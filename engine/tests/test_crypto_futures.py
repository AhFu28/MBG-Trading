"""
Tests for the Crypto Futures fetcher.

WHY THIS FILE EXISTS
--------------------
The desk silently showed zeroes and "$0" for weeks. Nothing crashed, so nothing
alerted. The bugs were:

  1. Only Binance FAPI was used. It is blocked in Indonesia (SSLError), so every
     method fell through to its offline_fallback branch. Funding, open interest
     and long/short were all frozen at zero.
  2. `_fetch_liquidations` returned `[]`, but the UI reads
     `liquidations_24h.largest_single`. A list has no such key, so the tab could
     only ever display $0.
  3. Nothing recorded WHICH exchange answered, so a silently-degraded payload
     looked identical to a healthy one.

These tests pin the contract so that failure is loud instead of invisible.
Network calls are stubbed: the suite must pass offline.
"""

import unittest
from unittest import mock
from datetime import datetime, timezone

from fetchers.crypto_futures import (
    CryptoFuturesFetcher,
    _gate_contract,
    _funding_signal,
    _next_funding_time_ms,
)


class TestHelpers(unittest.TestCase):
    def test_gate_contract_naming(self):
        self.assertEqual(_gate_contract("BTCUSDT"), "BTC_USDT")
        self.assertEqual(_gate_contract("1000PEPEUSDT"), "1000PEPE_USDT")

    def test_gate_contract_leaves_unknown_symbols_alone(self):
        self.assertEqual(_gate_contract("BTCUSD"), "BTCUSD")

    def test_funding_signal_thresholds(self):
        self.assertEqual(_funding_signal(0.10)[0], "OVERLEVERAGED_LONGS")
        self.assertEqual(_funding_signal(-0.10)[0], "SHORT_SQUEEZE_SETUP")
        self.assertEqual(_funding_signal(0.001)[0], "NEUTRAL")

    def test_funding_signal_boundary_is_not_flagged(self):
        # Exactly 0.05 is the boundary, not over it.
        self.assertEqual(_funding_signal(0.05)[0], "NEUTRAL")

    def test_next_funding_time_is_in_the_future(self):
        now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
        self.assertGreater(_next_funding_time_ms(), now_ms)

    def test_next_funding_time_is_within_eight_hours(self):
        now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
        eight_hours = 8 * 3600 * 1000
        self.assertLess(_next_funding_time_ms() - now_ms, eight_hours)


class TestSourceSelection(unittest.TestCase):
    """The fetcher must not depend on any single exchange being reachable."""

    def test_falls_back_to_gateio_when_binance_is_blocked(self):
        fetcher = CryptoFuturesFetcher()
        with mock.patch("fetchers.crypto_futures.requests.get") as get:
            # Binance raises (blocked), Gate.io answers.
            def side_effect(url, **kwargs):
                if "binance" in url:
                    raise OSError("SSLError: blocked")
                resp = mock.Mock()
                resp.status_code = 200
                resp.json.return_value = [{"contract": f"C{i}_USDT"} for i in range(20)]
                return resp

            get.side_effect = side_effect
            self.assertEqual(fetcher._probe_source(), "gateio")

    def test_prefers_binance_when_it_works(self):
        fetcher = CryptoFuturesFetcher()
        with mock.patch("fetchers.crypto_futures.requests.get") as get:
            resp = mock.Mock()
            resp.status_code = 200
            resp.json.return_value = [{"symbol": f"S{i}USDT"} for i in range(20)]
            get.return_value = resp
            self.assertEqual(fetcher._probe_source(), "binance")

    def test_reports_none_when_every_exchange_is_down(self):
        fetcher = CryptoFuturesFetcher()
        with mock.patch("fetchers.crypto_futures.requests.get", side_effect=OSError("no route")):
            self.assertIsNone(fetcher._probe_source())

    def test_probe_runs_only_once(self):
        # Probing per request would add a full socket timeout per symbol.
        fetcher = CryptoFuturesFetcher()
        with mock.patch.object(fetcher, "_probe_source", return_value="gateio") as probe:
            fetcher._source_or_probe()
            fetcher._source_or_probe()
            fetcher._source_or_probe()
            self.assertEqual(probe.call_count, 1)


class TestZeroSimulationPolicy(unittest.TestCase):
    """With no exchange reachable, numbers must be absent — never invented."""

    def setUp(self):
        self.fetcher = CryptoFuturesFetcher()
        self.fetcher._source = None
        patcher = mock.patch("fetchers.crypto_futures.requests.get", side_effect=OSError("blocked"))
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_funding_rows_are_flagged_unavailable(self):
        rows = self.fetcher.execute()["funding_rates"]
        self.assertEqual(len(rows), 15)
        for row in rows:
            self.assertEqual(row["data_source"], "offline_fallback")
            self.assertEqual(row["signal"], "DATA_UNAVAILABLE")
            self.assertEqual(row["funding_rate_pct"], 0.0)

    def test_open_interest_rows_are_flagged_unavailable(self):
        rows = self.fetcher.execute()["open_interest"]
        for row in rows:
            self.assertEqual(row["oi_price_divergence"], "DATA_UNAVAILABLE")
            self.assertEqual(row["open_interest_usd"], 0.0)

    def test_long_short_rows_are_flagged_unavailable(self):
        rows = self.fetcher.execute()["long_short_ratio"]
        for row in rows:
            self.assertEqual(row["bias"], "DATA_UNAVAILABLE")

    def test_execute_never_raises(self):
        # A dead API must degrade the desk, not crash the pipeline.
        result = self.fetcher.execute()
        self.assertIn("funding_rates", result)
        self.assertEqual(result["source"], "unreachable")


class TestLiquidationShape(unittest.TestCase):
    """
    The regression that made the tab permanently show $0.

    `liquidations_24h` MUST be a dict carrying `largest_single`. It used to be a
    list, and `[].largest_single` is undefined, so the UI rendered 0 forever.
    """

    def test_liquidations_is_a_dict_not_a_list(self):
        fetcher = CryptoFuturesFetcher()
        fetcher._source = "unreachable"
        lq = fetcher._fetch_liquidations("unreachable")
        self.assertIsInstance(lq, dict)
        self.assertNotIsInstance(lq, list)

    def test_largest_single_key_always_present(self):
        fetcher = CryptoFuturesFetcher()
        lq = fetcher._fetch_liquidations("unreachable")
        self.assertIn("largest_single", lq)
        self.assertEqual(lq["largest_single"], 0.0)

    def test_all_expected_fields_present(self):
        fetcher = CryptoFuturesFetcher()
        lq = fetcher._fetch_liquidations("unreachable")
        for field in ("total_usd", "long_usd", "short_usd", "largest_single",
                      "pairs", "window_hours", "source", "updated_at"):
            self.assertIn(field, lq, f"missing field: {field}")

    def test_pairs_is_a_list_even_when_empty(self):
        fetcher = CryptoFuturesFetcher()
        self.assertIsInstance(fetcher._fetch_liquidations("unreachable")["pairs"], list)

    def test_binance_reports_honestly_rather_than_inventing_numbers(self):
        # Binance liquidations are WebSocket-only; the engine cannot host a stream.
        fetcher = CryptoFuturesFetcher()
        lq = fetcher._fetch_liquidations("binance")
        self.assertEqual(lq["total_usd"], 0.0)
        self.assertEqual(lq["data_source"], "binance_ws_required")


class TestGateIOMapping(unittest.TestCase):
    """Field mapping must stay aligned with the live Gate.io payload."""

    def _fetcher_with_gate(self):
        """
        Only BTCUSDT is seeded. `pairs` is narrowed to match, so the per-pair
        loops under test produce exactly one row instead of one per 15 symbols.
        """
        fetcher = CryptoFuturesFetcher()
        fetcher.pairs = ["BTCUSDT"]
        fetcher._source = "gateio"
        fetcher._tickers_cache = {
            "BTC_USDT": {
                "contract": "BTC_USDT",
                "mark_price": "85609.9",
                "index_price": "85638.8",
                "funding_rate": "0.000026",
                "change_percentage": "-1.11",
                "volume_24h_quote": "5528207957",
            }
        }
        # Limit 1 feeds open interest; limit 24 feeds liquidations.
        stats = {
            "open_interest": 510221536,
            "open_interest_usd": 4368607100.44,
            "mark_price": 85621.77,
            "lsr_account": 1.5,
            "lsr_taker": 1.041,
            "top_lsr_size": 1.253,
            "long_liq_usd": 120000.0,
            "short_liq_usd": 80000.0,
        }
        fetcher._stats_cache = {
            "BTCUSDT:1": [dict(stats)],
            "BTCUSDT:24": [dict(stats)],
        }
        return fetcher

    def test_ticker_maps_to_funding_row(self):
        rows = self._fetcher_with_gate()._funding_from_gate()
        self.assertEqual(len(rows), 1)
        row = rows[0]
        self.assertEqual(row["symbol"], "BTCUSDT")
        self.assertEqual(row["mark_price"], 85609.9)
        self.assertEqual(row["volume_24h_usd"], 5528207957.0)
        self.assertEqual(row["data_source"], "gateio_live")
        self.assertAlmostEqual(row["funding_rate_pct"], 0.0026, places=4)

    def test_stats_map_to_open_interest_row(self):
        rows = self._fetcher_with_gate()._oi_from_gate()
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["open_interest_usd"], 4368607100.44)
        self.assertEqual(rows[0]["data_source"], "gateio_live")

    def test_long_short_percentages_sum_to_one(self):
        rows = self._fetcher_with_gate()._ls_from_gate()
        self.assertEqual(len(rows), 1)
        row = rows[0]
        self.assertAlmostEqual(row["long_pct"] + row["short_pct"], 1.0, places=6)

    def test_long_short_ratio_above_one_is_long_heavy(self):
        rows = self._fetcher_with_gate()._ls_from_gate()
        self.assertGreater(rows[0]["long_short_ratio"], 1.0)
        self.assertEqual(rows[0]["bias"], "LONG_HEAVY")

    def test_liquidations_sum_both_sides(self):
        lq = self._fetcher_with_gate()._liq_from_gate()
        self.assertIsNotNone(lq)
        self.assertEqual(lq["long_usd"], 120000.0)
        self.assertEqual(lq["short_usd"], 80000.0)
        self.assertEqual(lq["total_usd"], 200000.0)
        self.assertEqual(lq["largest_single"], 120000.0)
        self.assertEqual(lq["data_source"], "gateio_live")

    def test_a_missing_contract_is_skipped_not_zero_filled(self):
        fetcher = self._fetcher_with_gate()
        fetcher.pairs = ["NOPEUSDT"]
        self.assertEqual(fetcher._funding_from_gate(), [])


class TestExecuteContract(unittest.TestCase):
    """The payload shape the frontend reads must not drift."""

    def test_execute_returns_all_four_sections(self):
        fetcher = CryptoFuturesFetcher()
        fetcher._source = "unreachable"
        result = fetcher.execute()
        for key in ("funding_rates", "open_interest", "long_short_ratio", "liquidations_24h"):
            self.assertIn(key, result)

    def test_execute_records_the_source_used(self):
        # Without this, a silently degraded payload looks identical to a good one.
        fetcher = CryptoFuturesFetcher()
        fetcher._source = "unreachable"
        self.assertEqual(fetcher.execute()["source"], "unreachable")

    def test_every_funding_row_carries_a_data_source(self):
        fetcher = CryptoFuturesFetcher()
        fetcher._source = "unreachable"
        for row in fetcher.execute()["funding_rates"]:
            self.assertTrue(row.get("data_source"))


if __name__ == "__main__":
    unittest.main()
