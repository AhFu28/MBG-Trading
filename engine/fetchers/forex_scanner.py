"""
Forex + metals + energy + dollar-index scanner.

WHY THIS WAS REWRITTEN (2026-10-06)
-----------------------------------
Jendral Arib reported "forex dan xau dll ga jalan". Two separate faults:

1. XAU (gold) WAS NEVER IN THE LIST.
   This scanner only carried 28 currency pairs. Gold, silver, oil and the dollar
   index appear throughout the UI (arena agents, news wire, global markets, flow
   desk) but nothing fetched them here, so the desk had no metal or commodity
   rows at all.

2. NOTHING REFRESHED IT.
   The bundle's last pipeline run was `daily_idx_morning`, a day earlier. The
   network was fine the whole time — TradingView answers 28/28 pairs and all
   five commodity tickers from this machine. The data was simply never asked for.

The COT report was also removed: it returned a single hardcoded EUR row with
invented numbers (net_speculative 50000, sentiment LONG) presented as a CFTC
Commitment of Traders reading. That is fabricated data in a trading tool.
Rather than invent it, the field is now absent and the UI shows nothing.

VERIFIED LIVE from this machine (2026-10-06):
    FX_IDC:EURUSD    -> 1.12181
    TVC:GOLD         -> 4128.09
    TVC:SILVER       -> 60.7435
    FX:USOIL         -> 89.728
    FX:UKOIL         -> 100.639
    TVC:DXY          -> 102.162
"""

import logging

import requests
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Metals, energy and the dollar index. Tags decide how the row is displayed.
COMMODITY_SYMBOLS = [
    ('TVC:GOLD', 'XAUUSD', 'METAL'),
    ('TVC:SILVER', 'XAGUSD', 'METAL'),
    ('FX:USOIL', 'USOIL', 'ENERGY'),
    ('FX:UKOIL', 'UKOIL', 'ENERGY'),
    ('TVC:DXY', 'DXY', 'INDEX'),
]

JPY_DECIMALS = 3
FX_DECIMALS = 5
METAL_DECIMALS = 2


class ForexScanner:
    def __init__(self):
        self.pairs = [
            'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCHF', 'NZDUSD', 'USDCAD',
            'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'EURAUD', 'EURCHF', 'GBPAUD',
            'GBPCHF', 'AUDNZD', 'NZDJPY', 'CADJPY', 'AUDCAD', 'GBPCAD', 'EURNZD',
            'AUDCHF', 'NZDCAD', 'CHFJPY', 'GBPNZD', 'EURCAD', 'NZDCHF', 'CADCHF'
        ]
        self.commodities = COMMODITY_SYMBOLS

    def execute(self):
        rows = self._fetch_tradingview_forex()
        return {
            'pairs': rows,
            'metals_and_energy': [r for r in rows if r.get('asset_class') != 'FOREX'],
            'cot_report': [],  # not fabricated — see module docstring
            'updated_at': datetime.now(timezone.utc).isoformat(),
        }

    def _fetch_tradingview_forex(self):
        """Fetch forex pairs AND metals/energy in one pass."""
        results = self._scan(self.pairs, asset_class='FOREX')
        if results:
            results.extend(self._scan_commodities())
        if results:
            return results

        # NOTHING REACHABLE — return clearly-labelled unavailable rows.
        #
        # The old fallback filled price=1.0 and change=0.0 for all 28 pairs, which
        # rendered as a wall of "1.00000" that looks like real, flat prices. A
        # trader cannot tell that apart from a genuinely quiet market. Marking the
        # rows DATA_UNAVAILABLE is honest.
        return [self._unavailable(p) for p in self.pairs]

    def _scan(self, pairs, asset_class):
        """Shared scanner call for FX_IDC currency pairs."""
        if not pairs:
            return []
        payload = {
            "options": {"lang": "en"},
            "markets": ["forex"],
            "symbols": {"tickers": [f"FX_IDC:{p}" for p in pairs]},
            "columns": ["name", "close", "change", "high", "low",
                        "RSI", "SMA20", "SMA50", "Recommend.All"],
        }
        rows = self._post_scan("forex", payload, asset_class)
        return rows

    def _scan_commodities(self):
        """
        Metals/energy/DXY live on the CFD scanner, not the forex scanner.
        Verified: the forex market rejects these tickers.
        """
        payload = {
            "options": {"lang": "en"},
            "markets": ["cfd"],
            "symbols": {"tickers": [sym for sym, _, _ in self.commodities]},
            "columns": ["name", "close", "change", "high", "low",
                        "RSI", "SMA20", "SMA50", "Recommend.All"],
        }
        rows = self._post_scan("cfd", payload, asset_class=None)
        return [r for r in rows if r.get('asset_class') != 'FOREX']

    def _post_scan(self, market, payload, asset_class):
        try:
            resp = requests.post(
                f"https://scanner.tradingview.com/{market}/scan",
                json=payload, timeout=12,
                headers={"User-Agent": "MBG-Trading/5.0"},
            )
            if resp.status_code != 200:
                logger.warning(f"TradingView {market} scanner HTTP {resp.status_code}")
                return []

            out = []
            for row in resp.json().get('data', []):
                d = row.get('d') or []
                if len(d) < 9:
                    continue
                symbol = d[0]
                klass = asset_class or self._classify(row.get('s', ''), symbol)
                decimals = self._decimals(symbol, klass)
                price = round(float(d[1] or 0), decimals)
                if price <= 0:
                    continue
                out.append(self._build_row(symbol, klass, decimals, price, d))
            return out
        except Exception as exc:
            logger.warning(f"TradingView {market} scan failed: {exc}")
            return []

    @staticmethod
    def _classify(exchange_symbol: str, name: str) -> str:
        if 'GOLD' in name or name.startswith('XAU'):
            return 'METAL'
        if 'SILVER' in name or name.startswith('XAG'):
            return 'METAL'
        if 'OIL' in name:
            return 'ENERGY'
        if name == 'DXY':
            return 'INDEX'
        return 'FOREX'

    @staticmethod
    def _decimals(symbol: str, asset_class: str) -> int:
        if asset_class in ('METAL', 'ENERGY', 'INDEX'):
            return METAL_DECIMALS
        return JPY_DECIMALS if 'JPY' in symbol else FX_DECIMALS

    def _build_row(self, symbol, asset_class, decimals, price, d):
        change = round(float(d[2] or 0), 2)
        rsi = round(float(d[5] or 50), 1)
        sma20 = round(float(d[6] or 0), decimals)
        sma50 = round(float(d[7] or 0), decimals)

        # Setup is derived from the actual signal column, not merely the sign of
        # the daily change. The previous version labelled everything SHORT on a
        # down day, which is not a setup.
        tv_signal = d[8]
        try:
            signal_num = float(tv_signal)
        except (TypeError, ValueError):
            signal_num = 0.0

        if signal_num > 0.1:
            setup = 'LONG'
        elif signal_num < -0.1:
            setup = 'SHORT'
        else:
            setup = 'NEUTRAL'

        conviction = 'HIGH' if abs(signal_num) > 0.5 else 'MEDIUM' if abs(signal_num) > 0.2 else 'LOW'

        return {
            'pair': symbol,
            'symbol': symbol,
            'asset_class': asset_class,
            'price': price,
            'change_24h_pct': change,
            'high_24h': round(float(d[3] or 0), decimals),
            'low_24h': round(float(d[4] or 0), decimals),
            'rsi_14': rsi,
            'sma20': sma20,
            'sma50': sma50,
            'tv_signal': tv_signal,
            'setup_type': setup,
            'entry_zone_low': round(price * 0.999, decimals),
            'entry_zone_high': round(price * 1.001, decimals),
            'stop_loss': round(price * 0.995 if setup == 'LONG' else price * 1.005, decimals),
            'take_profit_1': round(price * 1.01 if setup == 'LONG' else price * 0.99, decimals),
            'take_profit_2': round(price * 1.02 if setup == 'LONG' else price * 0.98, decimals),
            'risk_reward_ratio': 2.0,
            'conviction': conviction,
            'pip_value_usd': 10,
            'data_source': 'tradingview_live',
            'updated_at': datetime.now(timezone.utc).isoformat(),
        }

    @staticmethod
    def _unavailable(pair):
        """Explicitly empty row. No invented price, no invented change."""
        return {
            'pair': pair,
            'symbol': pair,
            'asset_class': 'FOREX',
            'price': 0.0,
            'change_24h_pct': 0.0,
            'high_24h': 0.0,
            'low_24h': 0.0,
            'rsi_14': 0.0,
            'sma20': 0.0,
            'sma50': 0.0,
            'tv_signal': 0,
            'setup_type': 'DATA_UNAVAILABLE',
            'entry_zone_low': 0.0,
            'entry_zone_high': 0.0,
            'stop_loss': 0.0,
            'take_profit_1': 0.0,
            'take_profit_2': 0.0,
            'risk_reward_ratio': 0.0,
            'conviction': 'NONE',
            'pip_value_usd': 0,
            'data_source': 'offline_fallback',
            'updated_at': datetime.now(timezone.utc).isoformat(),
        }
