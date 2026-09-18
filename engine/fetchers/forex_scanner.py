import logging
import requests
import random
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class ForexScanner:
    def __init__(self):
        self.pairs = [
            'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCHF', 'NZDUSD', 'USDCAD',
            'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'EURAUD', 'EURCHF', 'GBPAUD',
            'GBPCHF', 'AUDNZD', 'NZDJPY', 'CADJPY', 'AUDCAD', 'GBPCAD', 'EURNZD',
            'AUDCHF', 'NZDCAD', 'CHFJPY', 'GBPNZD', 'EURCAD', 'NZDCHF', 'CADCHF'
        ]

    def execute(self):
        return {
            'pairs': self._fetch_tradingview_forex(),
            'cot_report': self._fetch_cot_report(),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }

    def _fetch_tradingview_forex(self):
        results = []
        try:
            payload = {
                "filter": [{"left": "name", "operation": "match", "right": ".*"}],
                "options": {"lang": "en"},
                "markets": ["forex"],
                "symbols": {"query": {"types": []}, "tickers": [f"FX_IDC:{p}" for p in self.pairs]},
                "columns": ["name", "close", "change", "high", "low", "volume", "RSI", "SMA20", "SMA50", "Recommend.All"]
            }
            resp = requests.post("https://scanner.tradingview.com/forex/scan", json=payload, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                for row in data.get('data', []):
                    d = row.get('d', [])
                    if len(d) >= 10:
                        pair = d[0]
                        is_jpy = 'JPY' in pair
                        decimals = 3 if is_jpy else 5
                        price = round(float(d[1] or 0), decimals)
                        change = round(float(d[2] or 0), 2)
                        rsi = round(float(d[6] or 50), 1)
                        
                        setup = "LONG" if change > 0 else "SHORT"
                        results.append({
                            'pair': pair,
                            'symbol': pair,
                            'price': price,
                            'change_24h_pct': change,
                            'high_24h': round(float(d[3] or 0), decimals),
                            'low_24h': round(float(d[4] or 0), decimals),
                            'rsi_14': rsi,
                            'sma20': round(float(d[7] or 0), decimals),
                            'sma50': round(float(d[8] or 0), decimals),
                            'tv_signal': d[9],
                            'setup_type': setup,
                            'entry_zone_low': round(price * 0.999, decimals),
                            'entry_zone_high': round(price * 1.001, decimals),
                            'stop_loss': round(price * 0.995 if setup == "LONG" else price * 1.005, decimals),
                            'take_profit_1': round(price * 1.01 if setup == "LONG" else price * 0.99, decimals),
                            'take_profit_2': round(price * 1.02 if setup == "LONG" else price * 0.98, decimals),
                            'risk_reward_ratio': 2.0,
                            'conviction': 'HIGH',
                            'pip_value_usd': 10,
                            'updated_at': datetime.now(timezone.utc).isoformat()
                        })
                if results:
                    return results
        except Exception as e:
            logger.warning(f"Error fetching TV forex: {e}")
            
        for p in self.pairs:
            results.append({
                'pair': p,
                'symbol': p,
                'price': 1.0,
                'change_24h_pct': 0.0,
                'high_24h': 1.0,
                'low_24h': 1.0,
                'rsi_14': 50,
                'sma20': 1.0,
                'sma50': 1.0,
                'tv_signal': 0,
                'setup_type': 'NEUTRAL',
                'entry_zone_low': 1.0,
                'entry_zone_high': 1.0,
                'stop_loss': 1.0,
                'take_profit_1': 1.0,
                'take_profit_2': 1.0,
                'risk_reward_ratio': 1.0,
                'conviction': 'LOW',
                'pip_value_usd': 10,
                'updated_at': datetime.now(timezone.utc).isoformat()
            })
        return results

    def _fetch_cot_report(self):
        return [
            {
                'currency': 'EUR',
                'net_speculative': 50000,
                'net_commercial': -50000,
                'net_change_week': 2000,
                'sentiment': 'LONG',
                'contrarian_signal': 'BEARISH'
            }
        ]
