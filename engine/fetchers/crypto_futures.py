import logging
import requests
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class CryptoFuturesFetcher:
    def __init__(self):
        self.pairs = [
            'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 
            'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'LINKUSDT', 'SUIUSDT', 
            'NEARUSDT', 'APTUSDT', 'RENDERUSDT', 'FETUSDT', 'PEPEUSDT'
        ]

    def execute(self):
        return {
            'funding_rates': self._fetch_funding_rates(),
            'open_interest': self._fetch_open_interest(),
            'long_short_ratio': self._fetch_long_short_ratio(),
            'liquidations_24h': self._fetch_liquidations(),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }

    def _fetch_funding_rates(self):
        results = []
        try:
            resp = requests.get("https://fapi.binance.com/fapi/v1/premiumIndex", timeout=6, headers={"User-Agent": "MBG-Trading/5.0"})
            if resp.status_code == 200:
                data = resp.json()
                data_dict = {item['symbol']: item for item in data}
                for pair in self.pairs:
                    if pair in data_dict:
                        item = data_dict[pair]
                        fr = float(item.get('lastFundingRate', 0))
                        fr_pct = fr * 100
                        signal = "NEUTRAL"
                        if fr_pct > 0.05:
                            signal = "OVERLEVERAGED_LONGS"
                        elif fr_pct < -0.05:
                            signal = "SHORT_SQUEEZE_SETUP"
                            
                        results.append({
                            'symbol': pair,
                            'pair': pair.replace("USDT", "/USDT"),
                            'funding_rate': fr,
                            'funding_rate_pct': round(fr_pct, 4),
                            'next_funding_time': item.get('nextFundingTime', 0),
                            'mark_price': float(item.get('markPrice', 0)),
                            'index_price': float(item.get('indexPrice', 0)),
                            'signal': signal,
                            'signal_desc': f"Funding rate is {signal}",
                            'data_source': 'binance_live'
                        })
                return results
        except Exception as e:
            logger.warning(f"Live funding rates fetch failed (zero simulation fallback): {e}")

        # Explicit Zero Simulation Policy: return unavailable state instead of synthetic randoms
        for pair in self.pairs:
            results.append({
                'symbol': pair,
                'pair': pair.replace("USDT", "/USDT"),
                'funding_rate': 0.0,
                'funding_rate_pct': 0.0,
                'next_funding_time': 0,
                'mark_price': 0.0,
                'index_price': 0.0,
                'signal': 'DATA_UNAVAILABLE',
                'signal_desc': 'Binance FAPI connection paused (zero-simulation guarantee)',
                'data_source': 'offline_fallback'
            })
        return results

    def _fetch_open_interest(self):
        results = []
        for pair in self.pairs:
            try:
                resp = requests.get(f"https://fapi.binance.com/fapi/v1/openInterest?symbol={pair}", timeout=5, headers={"User-Agent": "MBG-Trading/5.0"})
                if resp.status_code == 200:
                    data = resp.json()
                    oi = float(data.get('openInterest', 0))
                    results.append({
                        'symbol': pair,
                        'pair': pair.replace("USDT", "/USDT"),
                        'open_interest': oi,
                        'open_interest_usd': round(oi * 1000, 2), 
                        'oi_change_1h_pct': 0.0,
                        'price': 0,
                        'oi_price_divergence': 'NEUTRAL',
                        'data_source': 'binance_live'
                    })
            except Exception as e:
                logger.debug(f"Open interest fetch failed for {pair}: {e}")

        # If completely unreachable, return explicit offline indicators
        if not results:
            for pair in self.pairs:
                results.append({
                    'symbol': pair,
                    'pair': pair.replace("USDT", "/USDT"),
                    'open_interest': 0.0,
                    'open_interest_usd': 0.0,
                    'oi_change_1h_pct': 0.0,
                    'price': 0.0,
                    'oi_price_divergence': 'DATA_UNAVAILABLE',
                    'data_source': 'offline_fallback'
                })
        return results

    def _fetch_long_short_ratio(self):
        results = []
        for pair in self.pairs[:6]:
            try:
                resp = requests.get(f"https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol={pair}&period=1h&limit=1", timeout=5, headers={"User-Agent": "MBG-Trading/5.0"})
                if resp.status_code == 200 and len(resp.json()) > 0:
                    data = resp.json()[0]
                    lr = float(data.get('longShortRatio', 1.0))
                    results.append({
                        'symbol': pair,
                        'pair': pair.replace("USDT", "/USDT"),
                        'long_pct': float(data.get('longAccount', 0.5)),
                        'short_pct': float(data.get('shortAccount', 0.5)),
                        'long_short_ratio': lr,
                        'bias': 'LONG_HEAVY' if lr > 1.2 else 'SHORT_HEAVY' if lr < 0.8 else 'BALANCED',
                        'data_source': 'binance_live'
                    })
            except Exception as e:
                logger.debug(f"Long/short ratio fetch failed for {pair}: {e}")

        if not results:
            for pair in self.pairs[:6]:
                results.append({
                    'symbol': pair,
                    'pair': pair.replace("USDT", "/USDT"),
                    'long_pct': 0.5,
                    'short_pct': 0.5,
                    'long_short_ratio': 1.0,
                    'bias': 'DATA_UNAVAILABLE',
                    'data_source': 'offline_fallback'
                })
        return results

    def _fetch_liquidations(self):
        # Empty array until live liquidation WebSocket is hooked to prevent mock data liability
        return []
