"""
Tests for the forex / metals / energy scanner.

WHY THIS FILE EXISTS
--------------------
Jendral Arib reported "forex dan xau dll ga jalan". Investigation found two
faults, neither of them a network problem:

  1. XAU was NEVER IN THE LIST. The scanner carried 28 currency pairs only.
     Gold, silver, oil and DXY are referenced all over the UI but nothing
     fetched them, so those desks had no rows at all.

  2. The unreachable fallback filled price=1.0 and change=0.0 for every pair.
     A wall of "1.00000" reads like real flat prices — a trader cannot tell it
     apart from a genuinely quiet market.

  3. The COT report returned ONE hardcoded EUR row with invented figures
     (net_speculative 50000, sentiment LONG) presented as a CFTC reading.

These tests pin the corrected behaviour. Network calls are stubbed so the suite
passes offline.
"""

import unittest
from unittest import mock

from fetchers.forex_scanner import (
    ForexScanner,
    COMMODITY_SYMBOLS,
)


def scan_row(symbol, close, change, rsi=50.0, sma20=1.0, sma50=1.0, signal=0.3):
    """Mimics one TradingView row: d = [name, close, change, high, low, RSI, SMA20, SMA50, signal]."""
    return {
        's': f'FX_IDC:{symbol}',
        'd': [symbol, close, change, close * 1.01, close * 0.99, rsi, sma20, sma50, signal],
    }


class TestUniverse(unittest.TestCase):
    """Gold must actually be requested — that was the whole bug."""

    def test_commodity_universe_covers_metals_energy_and_dxy(self):
        symbols = [name for _, name, _ in COMMODITY_SYMBOLS]
        for expected in ('XAUUSD', 'XAGUSD', 'USOIL', 'UKOIL', 'DXY'):
            self.assertIn(expected, symbols, f'{expected} harus ikut dipindai')

    def test_gold_is_tagged_as_a_metal(self):
        gold = next(c for c in COMMODITY_SYMBOLS if c[1] == 'XAUUSD')
        self.assertEqual(gold[2], 'METAL')

    def test_28_currency_pairs_still_present(self):
        self.assertEqual(len(ForexScanner().pairs), 28)

    def test_dxy_is_tagged_as_an_index(self):
        dxy = next(c for c in COMMODITY_SYMBOLS if c[1] == 'DXY')
        self.assertEqual(dxy[2], 'INDEX')


class TestClassification(unittest.TestCase):
    def test_gold_name_classifies_as_metal(self):
        self.assertEqual(ForexScanner._classify('TVC:GOLD', 'GOLD'), 'METAL')

    def test_silver_classifies_as_metal(self):
        self.assertEqual(ForexScanner._classify('TVC:SILVER', 'SILVER'), 'METAL')

    def test_oil_classifies_as_energy(self):
        self.assertEqual(ForexScanner._classify('FX:USOIL', 'USOIL'), 'ENERGY')

    def test_dollar_index_classifies_as_index(self):
        self.assertEqual(ForexScanner._classify('TVC:DXY', 'DXY'), 'INDEX')

    def test_currency_pair_classifies_as_forex(self):
        self.assertEqual(ForexScanner._classify('FX_IDC:EURUSD', 'EURUSD'), 'FOREX')


class TestDecimals(unittest.TestCase):
    """Wrong decimals make a price unreadable — 4128.09 must not become 4128.09000."""

    def test_jpy_pairs_use_three_decimals(self):
        self.assertEqual(ForexScanner._decimals('USDJPY', 'FOREX'), 3)

    def test_other_currency_pairs_use_five_decimals(self):
        self.assertEqual(ForexScanner._decimals('EURUSD', 'FOREX'), 5)

    def test_gold_uses_two_decimals(self):
        self.assertEqual(ForexScanner._decimals('XAUUSD', 'METAL'), 2)

    def test_oil_uses_two_decimals(self):
        self.assertEqual(ForexScanner._decimals('USOIL', 'ENERGY'), 2)


class TestSetupDerivation(unittest.TestCase):
    """
    The old code set setup_type purely from the sign of the daily change, so any
    down day was labelled SHORT. A setup must come from the signal column.
    """

    def setUp(self):
        self.scanner = ForexScanner()

    def row(self, signal):
        return self.scanner._build_row('EURUSD', 'FOREX', 5, 1.12, ['EURUSD', 1.12, 0.5, 1.13, 1.11, 50, 1.1, 1.09, signal])

    def test_strong_buy_signal_is_long(self):
        self.assertEqual(self.row(0.6)['setup_type'], 'LONG')

    def test_strong_sell_signal_is_short(self):
        self.assertEqual(self.row(-0.6)['setup_type'], 'SHORT')

    def test_weak_signal_is_neutral(self):
        self.assertEqual(self.row(0.02)['setup_type'], 'NEUTRAL')

    def test_positive_change_with_bearish_signal_is_not_long(self):
        # The specific old bug: a rising day was always LONG regardless of signal.
        row = self.scanner._build_row('XAUUSD', 'METAL', 2, 4128.09,
                                      ['XAUUSD', 4128.09, 1.5, 4150, 4100, 40, 4100, 4050, -0.7])
        self.assertEqual(row['setup_type'], 'SHORT')

    def test_conviction_scales_with_signal_strength(self):
        self.assertEqual(self.row(0.9)['conviction'], 'HIGH')
        self.assertEqual(self.row(0.3)['conviction'], 'MEDIUM')
        self.assertEqual(self.row(0.05)['conviction'], 'LOW')

    def test_unparseable_signal_does_not_crash(self):
        row = self.scanner._build_row('EURUSD', 'FOREX', 5, 1.12,
                                      ['EURUSD', 1.12, 0, 1.13, 1.11, 50, 1.1, 1.09, None])
        self.assertEqual(row['setup_type'], 'NEUTRAL')


class TestLiveRowsCarryProvenance(unittest.TestCase):
    def test_live_row_states_its_source(self):
        row = ForexScanner()._build_row(
            'EURUSD', 'FOREX', 5, 1.12,
            ['EURUSD', 1.12, 0.5, 1.13, 1.11, 50, 1.1, 1.09, 0.6]
        )
        self.assertEqual(row['data_source'], 'tradingview_live')

    def test_row_carries_asset_class(self):
        row = ForexScanner()._build_row(
            'XAUUSD', 'METAL', 2, 4128.09,
            ['XAUUSD', 4128.09, -0.3, 4150, 4100, 38, 4100, 4050, -0.5]
        )
        self.assertEqual(row['asset_class'], 'METAL')


class TestUnavailableRows(unittest.TestCase):
    """No exchange reachable must never look like real flat prices."""

    def test_unavailable_row_is_marked(self):
        row = ForexScanner._unavailable('EURUSD')
        self.assertEqual(row['setup_type'], 'DATA_UNAVAILABLE')
        self.assertEqual(row['data_source'], 'offline_fallback')

    def test_unavailable_row_has_no_invented_price(self):
        row = ForexScanner._unavailable('EURUSD')
        self.assertEqual(row['price'], 0.0)
        self.assertEqual(row['conviction'], 'NONE')

    def test_scanner_falls_back_to_unavailable_when_nothing_answers(self):
        scanner = ForexScanner()
        with mock.patch('fetchers.forex_scanner.requests.post', side_effect=OSError('blocked')):
            rows = scanner._fetch_tradingview_forex()
        self.assertEqual(len(rows), 28)
        for row in rows:
            self.assertEqual(row['setup_type'], 'DATA_UNAVAILABLE')

    def test_scan_never_raises_on_http_error(self):
        scanner = ForexScanner()
        resp = mock.Mock()
        resp.status_code = 500
        with mock.patch('fetchers.forex_scanner.requests.post', return_value=resp):
            self.assertEqual(scanner._scan(['EURUSD'], 'FOREX'), [])

    def test_zero_price_rows_are_dropped(self):
        # A row with no usable price would render as a fake 0.00 quote.
        scanner = ForexScanner()
        resp = mock.Mock()
        resp.status_code = 200
        resp.json.return_value = {'data': [scan_row('EURUSD', 0, 0)]}
        with mock.patch('fetchers.forex_scanner.requests.post', return_value=resp):
            self.assertEqual(scanner._scan(['EURUSD'], 'FOREX'), [])


class TestCotReportIsNotFabricated(unittest.TestCase):
    """
    The old COT report was one hardcoded EUR row with invented numbers. Real COT
    data needs the CFTC weekly file, which this pipeline does not fetch — so the
    honest answer is nothing at all.
    """

    def test_cot_report_is_empty_rather_than_invented(self):
        scanner = ForexScanner()
        with mock.patch('fetchers.forex_scanner.requests.post', side_effect=OSError('blocked')):
            result = scanner.execute()
        self.assertEqual(result['cot_report'], [])

    def test_execute_still_returns_the_expected_keys(self):
        scanner = ForexScanner()
        with mock.patch('fetchers.forex_scanner.requests.post', side_effect=OSError('blocked')):
            result = scanner.execute()
        for key in ('pairs', 'metals_and_energy', 'cot_report', 'updated_at'):
            self.assertIn(key, result)


class TestExecuteShape(unittest.TestCase):
    def setUp(self):
        self.scanner = ForexScanner()
        fx = mock.Mock()
        fx.status_code = 200
        fx.json.return_value = {'data': [scan_row('EURUSD', 1.12, 0.1)]}
        cfd = mock.Mock()
        cfd.status_code = 200
        cfd.json.return_value = {
            'data': [
                {'s': 'TVC:GOLD', 'd': ['GOLD', 4128.09, -0.28, 4150, 4100, 38, 4100, 4050, -0.5]},
                {'s': 'FX:USOIL', 'd': ['USOIL', 89.73, 0.52, 90, 89, 46, 90, 91, 0.3]},
            ]
        }
        self.responses = {'forex': fx, 'cfd': cfd}

    def _post(self, url, **kwargs):
        return self.responses['cfd' if '/cfd/' in url else 'forex']

    def test_metals_are_split_out_for_the_ui(self):
        with mock.patch('fetchers.forex_scanner.requests.post', side_effect=self._post):
            result = self.scanner.execute()
        symbols = [r['symbol'] for r in result['metals_and_energy']]
        self.assertIn('GOLD', symbols)
        self.assertIn('USOIL', symbols)
        self.assertNotIn('EURUSD', symbols)

    def test_gold_and_oil_are_tagged_correctly(self):
        with mock.patch('fetchers.forex_scanner.requests.post', side_effect=self._post):
            result = self.scanner.execute()
        classes = {r['symbol']: r['asset_class'] for r in result['metals_and_energy']}
        self.assertEqual(classes['GOLD'], 'METAL')
        self.assertEqual(classes['USOIL'], 'ENERGY')


if __name__ == '__main__':
    unittest.main()
