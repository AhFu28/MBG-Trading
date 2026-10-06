"""
Tests for the whale tracker.

WHY THIS FILE EXISTS
--------------------
The engine padded its whale output with four HARDCODED transactions:

    if len(whales) < 5:
        whales.extend(self._get_curated_institutional_whales()[len(whales):5])

Those records carried three things that made them worse than obviously fake:

  1. `data_source: 'verified_cluster_feed'` — they CLAIMED verification.
  2. Timestamps of `now - 18 minutes` — so they never looked stale, no matter
     how old the surrounding data was.
  3. A REAL Bitcoin hash (the genesis block merkle root) and a working explorer
     link — the link opened, it just showed an unrelated transaction.

Because WHALE_ALERT_API_KEY is unset in this deployment, the padding branch
always fired. So the "4 whales" in the bundle were never real, and the UI
showed them beside a live-looking feed.

The fabrication is deleted. Real data or nothing.
"""

import unittest
from unittest import mock

from fetchers.whale_tracker import WhaleTracker


class TestNoFabricatedPadding(unittest.TestCase):
    def test_the_curated_function_is_gone(self):
        # Its absence IS the fix; a re-added fallback would reinstate the bug.
        self.assertFalse(hasattr(WhaleTracker, '_get_curated_institutional_whales'))

    def test_module_has_no_hardcoded_bitcoin_genesis_hash(self):
        import inspect
        import fetchers.whale_tracker as mod
        src = inspect.getsource(mod)
        self.assertNotIn('4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b', src)

    def test_module_never_claims_verified_cluster_feed(self):
        import inspect
        import fetchers.whale_tracker as mod
        # The string may still appear in the explanatory comment, so assert it is
        # not assigned as a data_source value anywhere in executable code.
        src = inspect.getsource(mod)
        for line in src.splitlines():
            stripped = line.strip()
            if stripped.startswith('#'):
                continue
            self.assertNotIn("'verified_cluster_feed'", stripped)


class TestRealSourceUsed(unittest.TestCase):
    def test_empty_feed_returns_empty_not_padded(self):
        """With the live source unavailable, the result must be short, not faked."""
        tracker = WhaleTracker()
        with mock.patch.object(tracker, '_fetch_mempool_btc_whales', return_value=[]):
            tracker.whale_alert_api_key = ''
            whales = tracker._fetch_crypto_whales()
        self.assertEqual(whales, [])

    def test_one_real_whale_is_returned_alone(self):
        """Previously a single real whale was padded out to five."""
        tracker = WhaleTracker()
        real = [{
            'hash': 'deadbeef', 'symbol': 'BTC', 'amount': 5.0,
            'amount_usd': 300000.0, 'data_source': 'mempool_onchain_live',
        }]
        with mock.patch.object(tracker, '_fetch_mempool_btc_whales', return_value=real):
            whales = tracker._fetch_crypto_whales()
        self.assertEqual(len(whales), 1)
        self.assertEqual(whales[0]['data_source'], 'mempool_onchain_live')

    def test_every_returned_whale_declares_its_source(self):
        tracker = WhaleTracker()
        real = [{'hash': f'h{i}', 'symbol': 'BTC', 'amount': 1.0,
                 'amount_usd': 60000.0, 'data_source': 'mempool_onchain_live'}
                for i in range(3)]
        with mock.patch.object(tracker, '_fetch_mempool_btc_whales', return_value=real):
            whales = tracker._fetch_crypto_whales()
        for w in whales:
            self.assertTrue(w.get('data_source'))
            self.assertNotEqual(w['data_source'], 'verified_cluster_feed')


class TestExecuteShape(unittest.TestCase):
    def test_execute_returns_the_documented_keys(self):
        tracker = WhaleTracker()
        with mock.patch.object(tracker, '_fetch_crypto_whales', return_value=[]):
            result = tracker.execute()
        for key in ('crypto_whales', 'idx_foreign_whales', 'us_institutional',
                    'idx_session_info', 'updated_at'):
            self.assertIn(key, result)

    def test_session_info_reports_a_real_slot(self):
        # Session labelling drives the BEI open/closed banner, so it must be one
        # of the known states rather than a free-form string.
        tracker = WhaleTracker()
        with mock.patch.object(tracker, '_fetch_crypto_whales', return_value=[]):
            info = tracker.execute()['idx_session_info']
        self.assertIn(info['session_status'], {
            'CLOSED', 'PRE_OPENING', 'SESSION_1', 'RECESS', 'SESSION_2',
            'PRE_CLOSING',
        })


if __name__ == '__main__':
    unittest.main()
