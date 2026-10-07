/**
 * Live market-wide data for the CoinMarketCap-style Home dashboard.
 *
 * WHY THIS EXISTS (2026-10-08)
 * ----------------------------
 * Jendral Arib: "aku ingin UI nya template sama persis bentuknya layout seperti
 * coinmarketcap.com ... isi home adalah market overview, pokoknya semua data
 * yang ada di coinmarketcap ambil aja yang bisa dijadikan dashboard."
 *
 * SOURCE POLICY — this project forbids fabricated market data. Every number this
 * module returns comes from a live public endpoint. Where no free source exists,
 * the field is reported as unavailable rather than estimated.
 *
 * INDONESIA REACHABILITY (verified by live fetch, 2026-10-08):
 *   - api.coinmarketcap.com      reachable, CloudFront CGK (Jakarta) edge, fastest
 *   - data-api.binance.vision    reachable (this is why the app already uses it)
 *   - api.alternative.me         reachable
 *   - api.hyperliquid.xyz        reachable
 *   - fapi.binance.com           BLOCKED by Indonesian DNS (TrustPositif)
 *   - api.bybit.com, api.okx.com BLOCKED
 * Never add a blocked host here. Use Hyperliquid for derivatives instead.
 *
 * ENDPOINTS DELIBERATELY NOT IMPLEMENTED (no free source exists — verified):
 *   - ETF net flows:      CMC exposes it only inside its SSR HTML, no JSON API
 *   - Liquidations 24h:   Coinglass requires a paid key; no free alternative
 *   - Community posts:    no public endpoint at all
 * These are omitted rather than faked. Do not invent substitutes.
 */

const CMC = 'https://api.coinmarketcap.com/data-api/v3';
const FNG = 'https://api.alternative.me/fng/';
const BINANCE = 'https://data-api.binance.vision/api/v3';
const HYPERLIQUID = 'https://api.hyperliquid.xyz/info';

/**
 * Fetch JSON with a hard timeout.
 *
 * Every call here is best-effort: a dead endpoint must degrade one card, never
 * blank the whole dashboard. Callers get `null` and render "—".
 */
async function getJSON(url, { timeoutMs = 12000, init } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    // Network failure, timeout, CORS, or invalid JSON — all mean "no data".
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Coerce to a usable finite number, or `null`.
 *
 * WHY NOT `Number(value)` DIRECTLY: `Number(null)`, `Number('')`, `Number([])`
 * and `Number(false)` all return 0. A missing market value would then render as
 * a real-looking "$0.00" — fabricated data, which this project forbids. The
 * dashboard must show "—" for absent data, never a plausible zero.
 */
function toNumberOrNull(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  if (Array.isArray(value) || typeof value === 'object') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Format a USD figure the way CMC does: $2.83T / $102.41B / $929.89M. */
export function formatUsdCompact(value) {
  const n = toNumberOrNull(value);
  if (n === null) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(2)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

/** Format a plain price with sensible precision for both BTC and micro-caps. */
export function formatPrice(value) {
  const n = toNumberOrNull(value);
  if (n === null) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1000) return `${sign}$${abs.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
  if (abs >= 1) return `${sign}$${abs.toFixed(2)}`;
  if (abs >= 0.01) return `${sign}$${abs.toFixed(4)}`;
  return `${sign}$${abs.toFixed(8)}`;
}

/**
 * Global market metrics: total market cap, 24h volume, BTC/ETH dominance.
 * Verified live shape:
 *   data.totalMarketCap, data.totalVolume24h, data.btcDominance, data.ethDominance
 */
export async function fetchGlobalMetrics() {
  const json = await getJSON(`${CMC}/global-metrics/quotes/latest`);
  const d = json?.data;
  if (!d) return null;
  return {
    totalMarketCap: toNumberOrNull(d.totalMarketCap),
    totalVolume24h: toNumberOrNull(d.totalVolume24h),
    btcDominance: toNumberOrNull(d.btcDominance),
    ethDominance: toNumberOrNull(d.ethDominance),
    activeCryptocurrencies: toNumberOrNull(d.activeCryptoCurrencies),
    activeExchanges: toNumberOrNull(d.activeExchanges),
    // CMC reports this as a signed percentage already.
    marketCapChange24h: toNumberOrNull(d.totalMarketCapYesterdayPercentageChange),
    updatedAt: toNumberOrNull(d.lastUpdated),
  };
}

/**
 * Fear & Greed index.
 *
 * HONESTY NOTE: this is alternative.me's index, NOT CoinMarketCap's. They use
 * different methodologies and disagree (observed 71 vs 61 on the same day).
 * The UI must label the source. Never present one as the other.
 *
 * The API returns `value` as a STRING — always coerce.
 */
export async function fetchFearGreed() {
  const json = await getJSON(`${FNG}?limit=1`);
  const row = json?.data?.[0];
  if (!row) return null;
  // The API returns `value` as a string, so coercion is required.
  const score = toNumberOrNull(row.value);
  if (score === null) return null;
  return {
    score,
    classification: row.value_classification || null,
    source: 'alternative.me',
    updatedAt: toNumberOrNull(row.timestamp) !== null ? toNumberOrNull(row.timestamp) * 1000 : null,
  };
}

/**
 * Altcoin Season Index.
 *
 * The endpoint requires BOTH `start` and `end` — omitting them returns a 400.
 * `dialConfigs` gives the scale endpoints, so the marker position is rendered
 * from the API's own definition rather than a hardcoded guess.
 */
export async function fetchAltcoinSeason(days = 365) {
  const end = Math.floor(Date.now() / 1000);
  const start = end - days * 86400;
  const json = await getJSON(`${CMC}/altcoin-season/chart?start=${start}&end=${end}`);
  const d = json?.data;
  if (!d) return null;

  // `historicalValues.now` has appeared both as a bare value and as an object
  // across API revisions, so accept either rather than assuming one shape.
  const rawNow = d.historicalValues?.now;
  const valueFromNow = toNumberOrNull(
    rawNow !== null && typeof rawNow === 'object' ? rawNow?.altcoinIndex : rawNow,
  );
  const points = Array.isArray(d.points) ? d.points : [];
  const latest = points.length ? points[points.length - 1] : null;
  const valueFromLatest = toNumberOrNull(latest?.altcoinIndex);

  return {
    value: valueFromNow !== null ? valueFromNow : valueFromLatest,
    dialConfigs: Array.isArray(d.dialConfigs) ? d.dialConfigs : [],
    series: points
      .map(p => ({ t: toNumberOrNull(p.timestamp) * 1000, v: toNumberOrNull(p.altcoinIndex) }))
      .filter(p => Number.isFinite(p.t) && p.v !== null),
  };
}

/**
 * Market cap time series for the Overview chart.
 * `interval=1d` keeps the payload small.
 */
export async function fetchMarketCapHistory(days = 30) {
  const end = Math.floor(Date.now() / 1000);
  const start = end - days * 86400;
  const json = await getJSON(`${CMC}/global-metrics/quotes/historical?timeStart=${start}&timeEnd=${end}&interval=1d`);
  const quotes = json?.data?.quotes;
  if (!Array.isArray(quotes)) return [];
  return quotes.map(q => {
    const usd = q?.quote?.[0] || {};
    return {
      t: toNumberOrNull(q.timestamp) !== null ? toNumberOrNull(q.timestamp) * 1000 : null,
      marketCap: toNumberOrNull(usd.totalMarketCap),
      volume: toNumberOrNull(usd.totalVolume24H),
      btcDominance: toNumberOrNull(q.btcDominance),
    };
  }).filter(p => p.t !== null && p.marketCap !== null);
}

/**
 * Top coins table. One request serves the whole table — never loop per coin.
 * `listing` returns ~100 rows with 1h/24h/7d/30d changes in a single call.
 */
export async function fetchTopCoins(limit = 100) {
  const url = `${CMC}/cryptocurrency/listing?start=1&limit=${limit}&sortBy=market_cap&sortType=desc&convert=USD`;
  const json = await getJSON(url);
  const rows = json?.data?.cryptoCurrencyList;
  if (!Array.isArray(rows)) return [];

  return rows.map(c => {
    const q = c.quotes?.[0] || {};
    return {
      id: c.id,
      rank: c.cmcRank,
      name: c.name,
      symbol: c.symbol,
      slug: c.slug,
      price: toNumberOrNull(q.price),
      marketCap: toNumberOrNull(q.marketCap),
      volume24h: toNumberOrNull(q.volume24h),
      change1h: toNumberOrNull(q.percentChange1h),
      change24h: toNumberOrNull(q.percentChange24h),
      change7d: toNumberOrNull(q.percentChange7d),
      circulatingSupply: toNumberOrNull(c.circulatingSupply),
      dominance: toNumberOrNull(q.marketCapDominance),
    };
  });
}

/** Trending coins, ranked by real search volume on CMC. */
export async function fetchTrending() {
  const json = await getJSON(`${CMC}/topsearch/rank`);
  const rows = json?.data?.cryptoTopSearchRanks;
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, 10).map(r => ({
    symbol: r.symbol,
    name: r.name,
    slug: r.slug,
    price: toNumberOrNull(r.priceChange?.price),
    change24h: toNumberOrNull(r.priceChange?.priceChange24h),
  }));
}

/**
 * Major coins with 7-day sparklines for the top card row.
 *
 * Uses Binance Vision (reachable in Indonesia) rather than CoinGecko, because
 * CoinGecko's free tier throttles to HTTP 429 after a handful of rapid calls.
 * One batched `symbols=` request covers all majors.
 */
const MAJORS = [
  { symbol: 'BTC', pair: 'BTCUSDT' },
  { symbol: 'ETH', pair: 'ETHUSDT' },
  { symbol: 'BNB', pair: 'BNBUSDT' },
  { symbol: 'SOL', pair: 'SOLUSDT' },
  { symbol: 'XRP', pair: 'XRPUSDT' },
];

export async function fetchMajorCards() {
  const symbols = JSON.stringify(MAJORS.map(m => m.pair));
  const tickers = await getJSON(`${BINANCE}/ticker/24hr?symbols=${encodeURIComponent(symbols)}`);
  if (!Array.isArray(tickers)) return [];

  // 7d sparkline: hourly closes, 168 points. One call per major is acceptable
  // here because this refreshes on a slow cadence, not every few seconds.
  const sparklines = await Promise.all(
    MAJORS.map(async m => {
      const klines = await getJSON(`${BINANCE}/klines?symbol=${m.pair}&interval=1h&limit=168`);
      if (!Array.isArray(klines)) return [];
      return klines.map(k => Number(k[4])).filter(Number.isFinite);
    }),
  );

  return MAJORS.map((m, i) => {
    const t = tickers.find(x => x.symbol === m.pair);
    if (!t) return null;
    return {
      symbol: m.symbol,
      pair: m.pair,
      price: toNumberOrNull(t.lastPrice),
      change24h: toNumberOrNull(t.priceChangePercent),
      high24h: toNumberOrNull(t.highPrice),
      low24h: toNumberOrNull(t.lowPrice),
      volume24h: toNumberOrNull(t.quoteVolume),
      sparkline: sparklines[i] || [],
    };
  }).filter(Boolean);
}

/**
 * Derivatives panel: open interest, funding and 24h notional volume.
 *
 * Sourced from Hyperliquid, NOT Binance Futures — fapi.binance.com is blocked
 * from Indonesia (verified: TLS fail, DNS hijacked). One POST returns all ~234
 * assets, so this is a single call, never a per-coin loop.
 */
export async function fetchDerivatives() {
  const json = await getJSON(HYPERLIQUID, {
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
    },
  });

  const universe = json?.[0]?.universe;
  const ctxs = json?.[1];
  if (!Array.isArray(universe) || !Array.isArray(ctxs)) return null;

  let totalOi = 0;
  let totalVolume = 0;
  const perAsset = [];

  for (let i = 0; i < universe.length; i += 1) {
    const ctx = ctxs[i];
    if (!ctx) continue;
    const markPx = toNumberOrNull(ctx.markPx) || 0;
    const oi = toNumberOrNull(ctx.openInterest) || 0;
    const dayNtlVlm = toNumberOrNull(ctx.dayNtlVlm) || 0;
    // Open interest is reported in coin units, so multiply by mark price for USD.
    const oiUsd = oi * markPx;

    if (oiUsd > 0) totalOi += oiUsd;
    if (dayNtlVlm > 0) totalVolume += dayNtlVlm;

    if (oiUsd > 0) {
      perAsset.push({
        symbol: universe[i].name,
        openInterestUsd: oiUsd,
        funding: toNumberOrNull(ctx.funding),
        volume24h: dayNtlVlm,
        markPrice: markPx,
      });
    }
  }

  perAsset.sort((a, b) => b.openInterestUsd - a.openInterestUsd);

  return {
    totalOpenInterestUsd: totalOi || null,
    totalVolume24hUsd: totalVolume || null,
    topByOpenInterest: perAsset.slice(0, 5),
    venue: 'Hyperliquid',
  };
}

/**
 * Everything the Home dashboard needs, fetched concurrently.
 *
 * A failed section resolves to `null` / `[]` so the caller can render the rest
 * of the page. Nothing here throws.
 */
export async function fetchMarketOverview() {
  const [
    global,
    fearGreed,
    altcoinSeason,
    majors,
    topCoins,
    trending,
    derivatives,
    marketCapHistory,
  ] = await Promise.all([
    fetchGlobalMetrics(),
    fetchFearGreed(),
    fetchAltcoinSeason(),
    fetchMajorCards(),
    fetchTopCoins(100),
    fetchTrending(),
    fetchDerivatives(),
    fetchMarketCapHistory(30),
  ]);

  return {
    global,
    fearGreed,
    altcoinSeason,
    majors,
    topCoins,
    trending,
    derivatives,
    marketCapHistory,
    fetchedAt: Date.now(),
  };
}
