"""
Crypto Futures Intelligence fetcher.

WHY THIS FILE WAS REWRITTEN (2026-10-06)
----------------------------------------
Every metric except funding rate had been frozen since 26 September. The cause
was not a crash — it was an unreachable data source with no fallback:

    fapi.binance.com    -> SSLError (blocked at national level in Indonesia)
    fapi1/2/3.binance   -> SSLError
    www.okx.com         -> SSLError
    api.bybit.com       -> SSLError
    api.gateio.ws       -> HTTP 200   <- the only one that works here
    data-api.binance.vision -> HTTP 200 (spot only, no futures endpoints)

Every request raised, every method fell through to its `offline_fallback`
branch, and the UI showed zeroes. Worse, `_fetch_liquidations` was a stub that
returned `[]` with the comment "until live liquidation WebSocket is hooked" —
it was never hooked, so the Liquidations tab could never show anything.

Binance is kept FIRST in the chain rather than deleted, because it is the richer
API and works fine from networks outside Indonesia. The fetcher probes once and
uses whichever source actually answers, so the same code is correct on a laptop
in Kediri and on a VPS in Singapore.

ZERO-SIMULATION POLICY (preserved from the original author):
When no source answers, rows are returned marked DATA_UNAVAILABLE with zeroes
rather than plausible-looking invented numbers. A trader must never be shown a
made-up funding rate or open interest figure.
"""

import logging
from datetime import datetime, timedelta, timezone

import requests

logger = logging.getLogger(__name__)

UA = {"User-Agent": "MBG-Trading/5.0"}
BINANCE_FAPI = "https://fapi.binance.com"
GATE_FUTURES = "https://api.gateio.ws/api/v4/futures/usdt"

# Gate.io funds perpetuals every 8 hours at 00:00 / 08:00 / 16:00 UTC.
GATE_FUNDING_HOURS = (0, 8, 16)


def _gate_contract(pair: str) -> str:
    """BTCUSDT -> BTC_USDT (Gate.io naming)."""
    if pair.endswith("USDT"):
        return f"{pair[:-4]}_USDT"
    return pair


def _next_funding_time_ms() -> int:
    """Milliseconds to the next 8-hourly funding stamp, computed for Gate.io."""
    now = datetime.now(timezone.utc)
    midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
    for hour in GATE_FUNDING_HOURS:
        candidate = midnight + timedelta(hours=hour)
        if candidate > now:
            return int(candidate.timestamp() * 1000)
    return int((midnight + timedelta(days=1)).timestamp() * 1000)


def _funding_signal(funding_rate_pct: float) -> tuple:
    """Same thresholds the previous Binance implementation used."""
    if funding_rate_pct > 0.05:
        return "OVERLEVERAGED_LONGS", "Longs are paying heavily — crowded and squeeze-prone"
    if funding_rate_pct < -0.05:
        return "SHORT_SQUEEZE_SETUP", "Shorts are paying heavily — a squeeze is building"
    return "NEUTRAL", "Funding is balanced"


class CryptoFuturesFetcher:
    def __init__(self):
        self.pairs = [
            'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
            'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'LINKUSDT', 'SUIUSDT',
            'NEARUSDT', 'APTUSDT', 'RENDERUSDT', 'FETUSDT', 'PEPEUSDT',
        ]
        self._source = None
        self._stats_cache = {}
        self._tickers_cache = None

    # ------------------------------------------------------------------
    # Source selection
    # ------------------------------------------------------------------
    def _probe_source(self) -> str:
        """
        Decide once which exchange can actually be reached.

        Probing is done once rather than per-request because a failed Binance
        call costs a full socket timeout, and doing that 15 times per pipeline
        run would stall the whole thing for minutes.
        """
        try:
            resp = requests.get(
                f"{BINANCE_FAPI}/fapi/v1/premiumIndex", timeout=6, headers=UA
            )
            if resp.status_code == 200 and len(resp.json()) > 10:
                logger.info("Crypto Futures source: Binance FAPI (reachable)")
                return "binance"
        except Exception as exc:
            logger.info(f"Crypto Futures: Binance unreachable ({type(exc).__name__}), trying Gate.io")

        try:
            resp = requests.get(
                f"{GATE_FUTURES}/tickers", timeout=10, headers=UA
            )
            if resp.status_code == 200 and len(resp.json()) > 10:
                logger.info("Crypto Futures source: Gate.io (Binance blocked here)")
                return "gateio"
        except Exception as exc:
            logger.warning(f"Crypto Futures: Gate.io also unreachable ({type(exc).__name__})")

        logger.warning("Crypto Futures: no reachable exchange — returning DATA_UNAVAILABLE rows")
        return None

    def _source_or_probe(self) -> str:
        if self._source is None:
            self._source = self._probe_source()
        return self._source

    # ------------------------------------------------------------------
    # Gate.io helpers
    # ------------------------------------------------------------------
    def _gate_tickers(self):
        """All USDT perpetual tickers in a single call (cheaper than per-pair)."""
        if self._tickers_cache is not None:
            return self._tickers_cache
        try:
            resp = requests.get(f"{GATE_FUTURES}/tickers", timeout=12, headers=UA)
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list):
                    self._tickers_cache = {t.get("contract"): t for t in data}
                    return self._tickers_cache
        except Exception as exc:
            logger.warning(f"Gate.io tickers fetch failed: {exc}")
        self._tickers_cache = {}
        return self._tickers_cache

    def _gate_stats(self, pair: str, limit: int = 24):
        """
        One call per contract, reused for open interest, long/short AND
        liquidations. Fetching these separately would triple the request count
        and risk Gate.io rate limiting.
        """
        key = f"{pair}:{limit}"
        if key in self._stats_cache:
            return self._stats_cache[key]
        try:
            resp = requests.get(
                f"{GATE_FUTURES}/contract_stats",
                params={"contract": _gate_contract(pair), "interval": "1h", "limit": limit},
                timeout=10,
                headers=UA,
            )
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list) and data:
                    self._stats_cache[key] = data
                    return data
        except Exception as exc:
            logger.debug(f"Gate.io contract_stats failed for {pair}: {exc}")
        self._stats_cache[key] = []
        return []

    def execute(self):
        source = self._source_or_probe()
        return {
            'funding_rates': self._fetch_funding_rates(source),
            'open_interest': self._fetch_open_interest(source),
            'long_short_ratio': self._fetch_long_short_ratio(source),
            'liquidations_24h': self._fetch_liquidations(source),
            'source': source or 'unreachable',
            'updated_at': datetime.now(timezone.utc).isoformat(),
        }

    # ------------------------------------------------------------------
    # Funding rates
    # ------------------------------------------------------------------
    def _fetch_funding_rates(self, source):
        if source == "binance":
            rows = self._funding_from_binance()
            if rows:
                return rows
        if source == "gateio":
            rows = self._funding_from_gate()
            if rows:
                return rows

        return [
            {
                'symbol': pair,
                'pair': pair.replace("USDT", "/USDT"),
                'funding_rate': 0.0,
                'funding_rate_pct': 0.0,
                'next_funding_time': 0,
                'mark_price': 0.0,
                'index_price': 0.0,
                'change_24h_pct': 0.0,
                'volume_24h_usd': 0.0,
                'signal': 'DATA_UNAVAILABLE',
                'signal_desc': 'Exchange unreachable from this machine (no data invented)',
                'data_source': 'offline_fallback',
            }
            for pair in self.pairs
        ]

    def _funding_from_binance(self):
        try:
            resp = requests.get(
                f"{BINANCE_FAPI}/fapi/v1/premiumIndex", timeout=6, headers=UA
            )
            if resp.status_code != 200:
                return []
            by_symbol = {item['symbol']: item for item in resp.json()}
        except Exception as exc:
            logger.warning(f"Binance funding fetch failed: {exc}")
            return []

        rows = []
        for pair in self.pairs:
            item = by_symbol.get(pair)
            if not item:
                continue
            rate = float(item.get('lastFundingRate', 0) or 0)
            pct = round(rate * 100, 4)
            signal, desc = _funding_signal(pct)
            rows.append({
                'symbol': pair,
                'pair': pair.replace("USDT", "/USDT"),
                'funding_rate': rate,
                'funding_rate_pct': pct,
                'next_funding_time': item.get('nextFundingTime', 0),
                'mark_price': float(item.get('markPrice', 0) or 0),
                'index_price': float(item.get('indexPrice', 0) or 0),
                'change_24h_pct': 0.0,
                'volume_24h_usd': 0.0,
                'signal': signal,
                'signal_desc': desc,
                'data_source': 'binance_live',
            })
        return rows

    def _funding_from_gate(self):
        tickers = self._gate_tickers()
        if not tickers:
            return []

        next_funding = _next_funding_time_ms()
        rows = []
        for pair in self.pairs:
            item = tickers.get(_gate_contract(pair))
            if not item:
                continue
            rate = float(item.get('funding_rate', 0) or 0)
            pct = round(rate * 100, 4)
            signal, desc = _funding_signal(pct)
            rows.append({
                'symbol': pair,
                'pair': pair.replace("USDT", "/USDT"),
                'funding_rate': rate,
                'funding_rate_pct': pct,
                'next_funding_time': next_funding,
                'mark_price': float(item.get('mark_price', 0) or 0),
                'index_price': float(item.get('index_price', 0) or 0),
                'change_24h_pct': float(item.get('change_percentage', 0) or 0),
                'volume_24h_usd': float(item.get('volume_24h_quote', 0) or 0),
                'signal': signal,
                'signal_desc': desc,
                'data_source': 'gateio_live',
            })
        return rows

    # ------------------------------------------------------------------
    # Open interest
    # ------------------------------------------------------------------
    def _fetch_open_interest(self, source):
        if source == "binance":
            rows = self._oi_from_binance()
            if rows:
                return rows
        if source == "gateio":
            rows = self._oi_from_gate()
            if rows:
                return rows

        return [
            {
                'symbol': pair,
                'pair': pair.replace("USDT", "/USDT"),
                'open_interest': 0.0,
                'open_interest_usd': 0.0,
                'oi_change_1h_pct': 0.0,
                'price': 0.0,
                'oi_price_divergence': 'DATA_UNAVAILABLE',
                'data_source': 'offline_fallback',
            }
            for pair in self.pairs
        ]

    def _oi_from_binance(self):
        rows = []
        for pair in self.pairs:
            try:
                resp = requests.get(
                    f"{BINANCE_FAPI}/fapi/v1/openInterest",
                    params={"symbol": pair}, timeout=5, headers=UA,
                )
                if resp.status_code != 200:
                    continue
                oi = float(resp.json().get('openInterest', 0) or 0)
                rows.append({
                    'symbol': pair,
                    'pair': pair.replace("USDT", "/USDT"),
                    'open_interest': oi,
                    'open_interest_usd': round(oi * 1000, 2),
                    'oi_change_1h_pct': 0.0,
                    'price': 0.0,
                    'oi_price_divergence': 'NEUTRAL',
                    'data_source': 'binance_live',
                })
            except Exception as exc:
                logger.debug(f"Binance OI failed for {pair}: {exc}")
        return rows

    def _oi_from_gate(self):
        rows = []
        for pair in self.pairs:
            stats = self._gate_stats(pair)
            if not stats:
                continue
            latest = stats[-1]
            oi_usd = float(latest.get('open_interest_usd', 0) or 0)
            oi = float(latest.get('open_interest', 0) or 0)
            price = float(latest.get('mark_price', 0) or 0)

            # 1h OI change from the two most recent hourly buckets.
            change_1h = 0.0
            if len(stats) >= 2:
                prev = float(stats[-2].get('open_interest_usd', 0) or 0)
                if prev > 0:
                    change_1h = round((oi_usd - prev) / prev * 100, 3)

            rows.append({
                'symbol': pair,
                'pair': pair.replace("USDT", "/USDT"),
                'open_interest': oi,
                'open_interest_usd': round(oi_usd, 2),
                'oi_change_1h_pct': change_1h,
                'price': price,
                'oi_price_divergence': 'NEUTRAL',
                'data_source': 'gateio_live',
            })
        return rows

    # ------------------------------------------------------------------
    # Long / short positioning
    # ------------------------------------------------------------------
    def _fetch_long_short_ratio(self, source):
        if source == "binance":
            rows = self._ls_from_binance()
            if rows:
                return rows
        if source == "gateio":
            rows = self._ls_from_gate()
            if rows:
                return rows

        return [
            {
                'symbol': pair,
                'pair': pair.replace("USDT", "/USDT"),
                'long_pct': 0.5,
                'short_pct': 0.5,
                'long_short_ratio': 1.0,
                'bias': 'DATA_UNAVAILABLE',
                'data_source': 'offline_fallback',
            }
            for pair in self.pairs[:6]
        ]

    def _ls_from_binance(self):
        rows = []
        for pair in self.pairs[:6]:
            try:
                resp = requests.get(
                    f"{BINANCE_FAPI}/futures/data/globalLongShortAccountRatio",
                    params={"symbol": pair, "period": "1h", "limit": 1},
                    timeout=5, headers=UA,
                )
                if resp.status_code != 200 or not resp.json():
                    continue
                data = resp.json()[0]
                ratio = float(data.get('longShortRatio', 1.0) or 1.0)
                rows.append({
                    'symbol': pair,
                    'pair': pair.replace("USDT", "/USDT"),
                    'long_pct': float(data.get('longAccount', 0.5)),
                    'short_pct': float(data.get('shortAccount', 0.5)),
                    'long_short_ratio': ratio,
                    'bias': self._bias(ratio),
                    'data_source': 'binance_live',
                })
            except Exception as exc:
                logger.debug(f"Binance L/S failed for {pair}: {exc}")
        return rows

    def _ls_from_gate(self):
        rows = []
        for pair in self.pairs[:6]:
            stats = self._gate_stats(pair)
            if not stats:
                continue
            latest = stats[-1]
            # lsr_account = accounts long / accounts short. Derive the share of
            # each side so the UI percentages add up to 100.
            ratio = float(latest.get('lsr_account', 1.0) or 1.0)
            if ratio <= 0:
                ratio = 1.0
            long_pct = round(ratio / (1 + ratio), 4)
            rows.append({
                'symbol': pair,
                'pair': pair.replace("USDT", "/USDT"),
                'long_pct': long_pct,
                'short_pct': round(1 - long_pct, 4),
                'long_short_ratio': round(ratio, 4),
                'taker_ratio': float(latest.get('lsr_taker', 1.0) or 1.0),
                'top_trader_ratio': float(latest.get('top_lsr_size', 1.0) or 1.0),
                'bias': self._bias(ratio),
                'data_source': 'gateio_live',
            })
        return rows

    @staticmethod
    def _bias(ratio: float) -> str:
        if ratio > 1.2:
            return 'LONG_HEAVY'
        if ratio < 0.8:
            return 'SHORT_HEAVY'
        return 'BALANCED'

    # ------------------------------------------------------------------
    # Liquidations (24h)
    # ------------------------------------------------------------------
    def _fetch_liquidations(self, source):
        """
        Returns an OBJECT, not a list.

        The UI reads `liquidations_24h.largest_single` directly, but the previous
        implementation returned `[]`, so that field was always undefined and the
        tab was hard-coded to display "$0". The shape is fixed here.
        """
        empty = {
            'total_usd': 0.0,
            'long_usd': 0.0,
            'short_usd': 0.0,
            'largest_single': 0.0,
            'pairs': [],
            'window_hours': 24,
            'source': source or 'unreachable',
            'updated_at': datetime.now(timezone.utc).isoformat(),
            'data_source': 'offline_fallback',
        }

        if source == "gateio":
            rows = self._liq_from_gate()
            if rows:
                return rows
        if source == "binance":
            # Binance exposes live liquidations only over WebSocket, which the
            # engine cannot host. Rather than invent numbers, report honestly.
            empty['data_source'] = 'binance_ws_required'
            empty['note'] = 'Binance liquidations are stream-only; Gate.io used when reachable.'
            return empty
        return empty

    def _liq_from_gate(self):
        total_long = total_short = largest = 0.0
        per_pair = []

        for pair in self.pairs:
            stats = self._gate_stats(pair, limit=24)
            if not stats:
                continue
            pair_long = sum(float(s.get('long_liq_usd', 0) or 0) for s in stats)
            pair_short = sum(float(s.get('short_liq_usd', 0) or 0) for s in stats)
            pair_largest = max(
                [float(s.get('long_liq_usd', 0) or 0) for s in stats]
                + [float(s.get('short_liq_usd', 0) or 0) for s in stats]
                + [0.0]
            )
            total_long += pair_long
            total_short += pair_short
            largest = max(largest, pair_largest)
            per_pair.append({
                'symbol': pair,
                'pair': pair.replace("USDT", "/USDT"),
                'long_usd': round(pair_long, 2),
                'short_usd': round(pair_short, 2),
                'total_usd': round(pair_long + pair_short, 2),
            })

        if not per_pair:
            return None

        per_pair.sort(key=lambda r: r['total_usd'], reverse=True)
        return {
            'total_usd': round(total_long + total_short, 2),
            'long_usd': round(total_long, 2),
            'short_usd': round(total_short, 2),
            'largest_single': round(largest, 2),
            'pairs': per_pair,
            'window_hours': 24,
            'source': 'gateio',
            'updated_at': datetime.now(timezone.utc).isoformat(),
            'data_source': 'gateio_live',
        }
