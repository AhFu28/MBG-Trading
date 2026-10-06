"""
Tests for the liquidity heat builder — "where is the money actually going?"

WHY THIS EXISTS
---------------
The owner asked for a way to see where liquidity is concentrating so he can pick
which pair to trade. That is a trading decision, so the scoring must be
explainable and honest:

  • High turnover alone must NOT win. Volume with flat open interest is churn —
    the same coins changing hands, no new money.
  • Rising open interest together with a price move is the real signal, because
    that is new positions being opened.
  • The score must never be produced from invented data. If a section is
    missing, its weight is simply not applied.
  • Every row must carry a human-readable reason, so the trader is not asked to
    trust an unexplained number.
"""

import unittest

from fetchers.crypto_futures import CryptoFuturesFetcher


def funding_row(symbol, volume, change_pct, funding_pct=0.01, source='gateio_live'):
    return {
        'symbol': symbol,
        'pair': symbol.replace('USDT', '/USDT'),
        'volume_24h_usd': volume,
        'change_24h_pct': change_pct,
        'funding_rate_pct': funding_pct,
        'data_source': source,
    }


def oi_row(symbol, oi_usd, change_1h):
    return {
        'symbol': symbol,
        'open_interest_usd': oi_usd,
        'oi_change_1h_pct': change_1h,
    }


def ls_row(symbol, ratio, bias):
    return {'symbol': symbol, 'long_short_ratio': ratio, 'bias': bias}


class TestLiquidityHeatScoring(unittest.TestCase):
    def setUp(self):
        self.fetcher = CryptoFuturesFetcher()

    def build(self, funding, oi, ls=None, liq=None):
        return self.fetcher._build_liquidity_heat(
            funding, oi, ls or [], liq or {}
        )

    def test_returns_rows_regime_and_summary(self):
        result = self.build([funding_row('BTCUSDT', 1e9, 1.0)], [oi_row('BTCUSDT', 1e8, 1.0)])
        self.assertIn('rows', result)
        self.assertIn('regime', result)
        self.assertIn('summary', result)
        self.assertEqual(len(result['rows']), 1)

    def test_rising_open_interest_beats_stagnant_volume(self):
        """
        The core promise of the feature: money flow, not noise.

        QUIET has 4x the turnover of MOVER but flat open interest. MOVER has real
        positions being opened. MOVER must rank higher, otherwise the panel is
        just a volume leaderboard with extra steps.
        """
        funding = [
            funding_row('QUIETUSDT', 4_000_000_000, 0.0),
            funding_row('MOVERUSDT', 1_000_000_000, 4.0),
        ]
        oi = [
            oi_row('QUIETUSDT', 5_000_000_000, 0.0),
            oi_row('MOVERUSDT', 1_000_000_000, 12.0),
        ]
        rows = self.build(funding, oi)['rows']
        self.assertEqual(rows[0]['symbol'], 'MOVERUSDT')

    def test_zero_volume_rows_are_excluded(self):
        # A pair with no turnover cannot be "where the liquidity is".
        funding = [funding_row('DEADUSDT', 0, 0.0), funding_row('BTCUSDT', 1e9, 1.0)]
        oi = [oi_row('DEADUSDT', 1e6, 0.0), oi_row('BTCUSDT', 1e9, 1.0)]
        symbols = [r['symbol'] for r in self.build(funding, oi)['rows']]
        self.assertNotIn('DEADUSDT', symbols)

    def test_offline_fallback_rows_are_excluded(self):
        # Invented/absent data must never drive a trading decision.
        funding = [funding_row('BTCUSDT', 1e9, 1.0, source='offline_fallback')]
        oi = [oi_row('BTCUSDT', 1e9, 5.0)]
        self.assertEqual(self.build(funding, oi)['rows'], [])

    def test_high_oi_change_cannot_run_away_with_the_score(self):
        # A parabolic +500% OI on a tiny pair must not outrank a real mover.
        funding = [
            funding_row('SPIKEUSDT', 1_000_000, 0.0),
            funding_row('SOLUSDT', 900_000_000, 2.0),
        ]
        oi = [
            oi_row('SPIKEUSDT', 1_000_000, 500.0),
            oi_row('SOLUSDT', 900_000_000, 10.0),
        ]
        rows = self.build(funding, oi)['rows']
        spike = next(r for r in rows if r['symbol'] == 'SPIKEUSDT')
        # Capped, so the score stays inside the documented 0-100 range.
        self.assertLessEqual(spike['heat_score'], 100.0)

    def test_score_stays_within_zero_and_hundred(self):
        funding = [funding_row('XUSDT', 1e12, 50.0, funding_pct=5.0)]
        oi = [oi_row('XUSDT', 1e15, 999.0)]
        row = self.build(funding, oi)['rows'][0]
        self.assertGreaterEqual(row['heat_score'], 0.0)
        self.assertLessEqual(row['heat_score'], 100.0)

    def test_rows_are_sorted_by_score_descending(self):
        funding = [
            funding_row('AUSDT', 1e9, 3.0),
            funding_row('BUSDT', 1e8, 0.0),
            funding_row('CUSDT', 5e8, 5.0),
        ]
        oi = [
            oi_row('AUSDT', 1e8, 10.0),
            oi_row('BUSDT', 1e8, 0.0),
            oi_row('CUSDT', 1e8, 1.0),
        ]
        scores = [r['heat_score'] for r in self.build(funding, oi)['rows']]
        self.assertEqual(scores, sorted(scores, reverse=True))


class TestFlowLabels(unittest.TestCase):
    """The label must match what price and open interest are really doing."""

    def label(self, oi_change, price_change):
        return CryptoFuturesFetcher._flow_label({
            'oi_change_1h_pct': oi_change,
            'change_24h_pct': price_change,
        })

    def test_price_up_with_oi_up_is_new_long_money(self):
        self.assertIn('Uang Baru Masuk', self.label(2.0, 3.0))
        self.assertIn('LONG', self.label(2.0, 3.0))

    def test_price_down_with_oi_up_is_new_short_money(self):
        self.assertIn('SHORT', self.label(2.0, -3.0))

    def test_price_up_with_oi_down_is_short_covering(self):
        self.assertIn('Short Covering', self.label(-2.0, 3.0))

    def test_price_down_with_oi_down_is_long_liquidation(self):
        self.assertIn('Long Likuidasi', self.label(-2.0, -3.0))

    def test_flat_activity_is_labelled_churn(self):
        self.assertIn('Churn', self.label(0.0, 0.0))

    def test_tiny_oi_rise_does_not_claim_new_money(self):
        # Below the 0.3% threshold this is noise, not a signal.
        self.assertIn('Churn', self.label(0.05, 0.0))

    def test_every_label_is_non_empty(self):
        for oi in (-5, -0.5, 0, 0.5, 5):
            for price in (-5, -0.5, 0, 0.5, 5):
                self.assertTrue(self.label(oi, price))


class TestReasonsAreExplainable(unittest.TestCase):
    def setUp(self):
        self.fetcher = CryptoFuturesFetcher()

    def test_every_row_carries_at_least_one_reason(self):
        funding = [funding_row('BTCUSDT', 1e9, 2.0, funding_pct=0.08)]
        oi = [oi_row('BTCUSDT', 1e9, 5.0)]
        rows = self.fetcher._build_liquidity_heat(funding, oi, [], {})['rows']
        self.assertTrue(rows[0]['reasons'])
        self.assertGreaterEqual(len(rows[0]['reasons']), 1)

    def test_rising_oi_reason_mentions_new_money(self):
        funding = [funding_row('BTCUSDT', 1e9, 2.0)]
        oi = [oi_row('BTCUSDT', 1e9, 5.0)]
        reasons = ' '.join(
            self.fetcher._build_liquidity_heat(funding, oi, [], {})['rows'][0]['reasons']
        )
        self.assertIn('uang baru masuk', reasons.lower())

    def test_falling_oi_reason_says_positions_closed(self):
        funding = [funding_row('BTCUSDT', 1e9, 2.0)]
        oi = [oi_row('BTCUSDT', 1e9, -5.0)]
        reasons = ' '.join(
            self.fetcher._build_liquidity_heat(funding, oi, [], {})['rows'][0]['reasons']
        )
        self.assertIn('ditutup', reasons.lower())

    def test_quiet_market_says_so_rather_than_inventing_a_signal(self):
        funding = [funding_row('BTCUSDT', 1e9, 0.0, funding_pct=0.0)]
        oi = [oi_row('BTCUSDT', 1e9, 0.0)]
        reasons = ' '.join(
            self.fetcher._build_liquidity_heat(funding, oi, [], {})['rows'][0]['reasons']
        )
        self.assertIn('belum ada sinyal', reasons.lower())


class TestMarketRegime(unittest.TestCase):
    def regime(self, oi_changes, funding_pct=0.02):
        rows = [
            {'oi_change_1h_pct': c, 'funding_rate_pct': funding_pct}
            for c in oi_changes
        ]
        return CryptoFuturesFetcher._market_regime(rows)

    def test_broad_rise_with_positive_funding_is_eager_longs(self):
        self.assertEqual(self.regime([1, 2, 3, 4, 5], 0.05), 'EAGER_LONGS')

    def test_broad_rise_without_expensive_funding_is_position_building(self):
        self.assertEqual(self.regime([1, 2, 3, 4, 5], 0.0), 'POSITION_BUILDING')

    def test_broad_fall_is_deleveraging(self):
        self.assertEqual(self.regime([-1, -2, -3, -4, -5]), 'DELEVERAGING')

    def test_mixed_board_is_mixed(self):
        self.assertEqual(self.regime([1, -1, 1, -1]), 'MIXED')

    def test_no_rows_is_no_data(self):
        self.assertEqual(CryptoFuturesFetcher._market_regime([]), 'NO_DATA')


class TestDegradedInput(unittest.TestCase):
    """Missing sections must degrade gracefully, never raise."""

    def setUp(self):
        self.fetcher = CryptoFuturesFetcher()

    def test_no_funding_rows_returns_empty_but_valid(self):
        result = self.fetcher._build_liquidity_heat([], [], [], {})
        self.assertEqual(result['rows'], [])
        self.assertEqual(result['regime'], 'NO_DATA')

    def test_missing_oi_section_still_scores_from_volume(self):
        funding = [funding_row('BTCUSDT', 1e9, 1.0)]
        result = self.fetcher._build_liquidity_heat(funding, [], [], {})
        self.assertEqual(len(result['rows']), 1)
        self.assertIsNotNone(result['rows'][0]['heat_score'])

    def test_none_sections_do_not_raise(self):
        for liq in (None, {}, {'pairs': None}):
            result = self.fetcher._build_liquidity_heat(None, None, None, liq)
            self.assertIn('rows', result)

    def test_execute_exposes_liquidity_heat(self):
        fetcher = CryptoFuturesFetcher()
        fetcher._source = 'unreachable'
        result = fetcher.execute()
        self.assertIn('liquidity_heat', result)
        self.assertIn('regime', result['liquidity_heat'])


if __name__ == '__main__':
    unittest.main()
