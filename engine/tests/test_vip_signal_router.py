"""Tests for the VIP signal router (GTM-TG-01 / GTM-DATA-01).

Runnable with either:
    python -m pytest engine/tests/test_vip_signal_router.py
    python -m unittest discover -s engine/tests
"""

import os
import sys
import unittest
from datetime import datetime, timedelta, timezone

TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
ENGINE_DIR = os.path.dirname(TESTS_DIR)
if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)

from notifiers.vip_signal_router import (  # noqa: E402
    Subscriber,
    dispatch,
    extract_plans,
    freshness_note,
    provenance_gap,
    provenance_of,
    render_public,
    render_vip,
    route,
)

NOW = datetime(2026, 10, 2, 12, 0, tzinfo=timezone.utc)


def good_plan(**overrides):
    plan = {
        "clean_ticker": "BBCA",
        "market": "IDX",
        "direction": "BUY",
        "entry_price": 9850.0,
        "stop_loss": 9600.0,
        "target_1": 10450.0,
        "target_2": 11000.0,
        "risk_reward_ratio": "1:2.4",
        "thesis": "Breakout dengan konfirmasi aliran dana asing.",
        "strategy": "SMC + Bandarmologi",
        "source": "IDX market feed",
        "observed_at": "2026-10-02T04:30:00Z",
        "data_state": "observed",
    }
    plan.update(overrides)
    return plan


class FakeNotifier:
    def __init__(self, enabled=True):
        self.enabled = enabled
        self.chat_id = "public-channel"
        self.sent = []

    def send_html_message(self, text, chat_id=None, reply_to_message_id=None):
        self.sent.append((chat_id, text))
        return True


class TestHonestyGate(unittest.TestCase):
    def test_missing_source_blocks_vip(self):
        self.assertIsNotNone(provenance_gap(good_plan(source=None), now=NOW))

    def test_missing_observed_at_blocks_vip(self):
        self.assertIsNotNone(provenance_gap(good_plan(observed_at=None), now=NOW))

    def test_synthetic_state_blocks_vip(self):
        for state in ("synthetic", "simulated", "mock", "illustrative", "demo"):
            with self.subTest(state=state):
                self.assertIsNotNone(provenance_gap(good_plan(data_state=state), now=NOW))

    def test_clean_plan_passes(self):
        self.assertIsNone(provenance_gap(good_plan(), now=NOW))

    def test_blocked_plan_produces_no_vip_message(self):
        sub = Subscriber(chat_id="111", expires_at="2026-12-31")
        vip, public = route([good_plan(source=None)], [sub], now=NOW)
        self.assertEqual(vip, [])
        self.assertEqual(len(public), 1)
        self.assertIn("VIP blocked", public[0].blocked_reason)

class TestStalenessGuard(unittest.TestCase):
    """A plan with perfect provenance can still be unsellable if it is too old.

    Regression for the 2026-10-05 incident: the cached plans were 18 days old
    (17 Sep) and CUAN said "entry Rp 945" while the live price was Rp 840.
    Sending that to paying subscribers means they buy at a price that no
    longer exists.
    """

    def _plan_aged(self, hours):
        observed = NOW - timedelta(hours=hours)
        return good_plan(observed_at=observed.isoformat())

    def _gap(self, hours):
        """Evaluate freshness against the fixed test clock, not wall time."""
        return provenance_gap(self._plan_aged(hours), now=NOW)

    def test_fresh_plan_passes(self):
        self.assertIsNone(self._gap(1))

    def test_aging_plan_passes_with_warning(self):
        plan = self._plan_aged(13)
        self.assertIsNone(provenance_gap(plan, now=NOW))
        self.assertIsNotNone(freshness_note(plan, now=NOW))

    def test_plan_at_limit_still_passes(self):
        self.assertIsNone(self._gap(47))

    def test_stale_plan_is_blocked(self):
        gap = self._gap(49)
        self.assertIsNotNone(gap)
        self.assertIn("stale signal", gap)

    def test_eighteen_day_old_plan_is_blocked(self):
        # The exact real-world case that triggered this guard (429.6 hours).
        gap = self._gap(18 * 24 + 1)
        self.assertIsNotNone(gap)
        self.assertIn("stale signal", gap)

    def test_unparseable_timestamp_blocked(self):
        self.assertIsNotNone(provenance_gap(good_plan(observed_at="not-a-date"), now=NOW))

    def test_naive_timestamp_treated_as_utc(self):
        naive = (NOW - timedelta(hours=2)).replace(tzinfo=None).isoformat()
        self.assertIsNone(provenance_gap(good_plan(observed_at=naive), now=NOW))

    def test_date_only_timestamp_accepted(self):
        self.assertIsNone(provenance_gap(good_plan(observed_at="2026-10-02"), now=NOW))

    def test_stale_plan_is_downgraded_to_public_not_dropped(self):
        sub = Subscriber(chat_id="111", expires_at="2026-12-31")
        vip, public = route([self._plan_aged(100)], [sub], now=NOW)
        self.assertEqual(vip, [])
        self.assertEqual(len(public), 1)
        self.assertIn("stale", public[0].blocked_reason)

class TestSubscriberEntitlement(unittest.TestCase):
    def test_expired_subscriber_is_excluded(self):
        expired = Subscriber(chat_id="111", expires_at="2026-09-01")
        self.assertFalse(expired.is_entitled(NOW))

    def test_future_expiry_is_included(self):
        self.assertTrue(Subscriber(chat_id="111", expires_at="2026-12-31").is_entitled(NOW))

    def test_inactive_is_excluded(self):
        self.assertFalse(Subscriber(chat_id="111", active=False).is_entitled(NOW))

    def test_non_paid_tier_is_excluded(self):
        self.assertFalse(Subscriber(chat_id="111", tier="FREE", expires_at="2026-12-31").is_entitled(NOW))

    def test_unparseable_expiry_fails_closed(self):
        self.assertFalse(Subscriber(chat_id="111", expires_at="not-a-date").is_entitled(NOW))

    def test_date_only_expiry_covers_that_whole_day_utc(self):
        sub = Subscriber(chat_id="111", expires_at="2026-10-02")
        self.assertTrue(sub.is_entitled(datetime(2026, 10, 2, 23, 0, tzinfo=timezone.utc)))
        self.assertFalse(sub.is_entitled(datetime(2026, 10, 3, 0, 30, tzinfo=timezone.utc)))


class TestRendering(unittest.TestCase):
    def test_public_channel_never_carries_precise_levels(self):
        text = render_public(good_plan())
        for leak in ("9850", "9600", "10450", "ENTRY ZONE", "STOP LOSS"):
            self.assertNotIn(leak, text)

    def test_vip_carries_levels_and_provenance(self):
        text = render_vip(good_plan())
        self.assertIn("ENTRY ZONE", text)
        self.assertIn("STOP LOSS", text)
        self.assertIn("IDX market feed", text)
        self.assertIn("2026-10-02T04:30:00Z", text)

    def test_missing_numbers_render_as_dash_not_zero(self):
        plan = good_plan(entry_price=None, stop_loss=None, target_1=None, target_2=None)
        text = render_vip(plan)
        self.assertIn("—", text)
        self.assertNotIn("<code>0", text)

    def test_missing_take_profit_alias_falls_back_without_zeroing(self):
        # target_1 absent but take_profit_1 present -> must use the alias, not 0.
        plan = good_plan()
        plan.pop("target_1")
        plan["take_profit_1"] = 10450.0
        self.assertIn("10,450.00", render_vip(plan))

    def test_footer_never_prints_none(self):
        text = render_public(good_plan(source=None, observed_at=None))
        self.assertNotIn("None", text)
        self.assertIn("—", text)

    def test_missing_data_state_is_unknown_not_observed(self):
        self.assertEqual(provenance_of(good_plan(data_state=None))["data_state"], "unknown")

    def test_blocked_public_message_states_the_hold(self):
        text = render_public(good_plan(source=None), gap="missing provenance: source")
        self.assertIn("Sinyal presisi ditahan", text)


class TestDispatch(unittest.TestCase):
    def test_dry_run_sends_nothing(self):
        notifier = FakeNotifier()
        vip, public = route([good_plan()], [Subscriber(chat_id="111", expires_at="2026-12-31")], now=NOW)
        result = dispatch(vip, public, notifier=notifier, dry_run=True)
        self.assertEqual(notifier.sent, [])
        self.assertEqual(result["vip_sent"], 0)
        self.assertTrue(result["dry_run"])

    def test_live_send_uses_notifier(self):
        notifier = FakeNotifier()
        vip, public = route([good_plan()], [Subscriber(chat_id="111", expires_at="2026-12-31")], now=NOW)
        result = dispatch(vip, public, notifier=notifier, dry_run=False)
        self.assertEqual(result["vip_sent"], 1)
        self.assertEqual(result["public_sent"], 1)
        self.assertEqual(notifier.sent[0][0], "111")

    def test_disabled_notifier_errors_without_raising(self):
        result = dispatch([], [], notifier=FakeNotifier(enabled=False), dry_run=False)
        self.assertTrue(result["errors"])


class TestExtractPlans(unittest.TestCase):
    def test_accepts_bare_list(self):
        self.assertEqual(len(extract_plans([good_plan()])), 1)

    def test_accepts_bundle_envelope(self):
        self.assertEqual(len(extract_plans({"daily_trade_plans": [good_plan()]})), 1)

    def test_accepts_single_plan_object(self):
        self.assertEqual(len(extract_plans(good_plan())), 1)

    def test_rejects_junk(self):
        self.assertEqual(extract_plans("nope"), [])
        self.assertEqual(extract_plans({"unrelated": 1}), [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
