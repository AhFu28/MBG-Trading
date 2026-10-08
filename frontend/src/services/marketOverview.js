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
 * Cross-market asset universe: crypto, US equities, forex, commodities.
 *
 * REQUEST (Jendral Arib, 2026-10-08):
 *   "Semua Koin ini jangan cuma crypto, tapi saham dan forex commodities juga"
 *   "Trending ini ambil dari news terupdate + twitter dan threads ... gacuma
 *    crypto tapi saham, forex, atau bahkan AI sekalipun"
 *
 * WHY TRADINGVIEW SCANNER FOR STOCKS/FOREX:
 * The app already uses scanner.tradingview.com for its live IDX/US/forex feeds
 * in useLivePrices.js, and it answers from Indonesia (verified 2026-10-08).
 * One POST returns many symbols plus close and % change, so a cross-market
 * table costs one request per market rather than one per instrument.
 */

const TV_SCANNER = 'https://scanner.tradingview.com';

/** Universe definitions. Slugs match the scanner's own market identifiers. */
const CROSS_MARKET_UNIVERSES = [
  {
    market: 'US',
    scanner: 'america',
    label: 'US Stocks',
    // Tickers are requested explicitly so the list stays a curated mega-cap set
    // rather than whatever the scanner happens to rank first.
    symbols: [
      'NASDAQ:NVDA', 'NASDAQ:AAPL', 'NASDAQ:MSFT', 'NASDAQ:GOOGL', 'NASDAQ:AMZN',
      'NASDAQ:META', 'NASDAQ:TSLA', 'NASDAQ:AMD', 'NASDAQ:AVGO', 'NASDAQ:NFLX',
      'NYSE:JPM', 'NYSE:V', 'NYSE:WMT', 'NYSE:XOM', 'NASDAQ:COST',
      'NYSE:UNH', 'NASDAQ:PLTR', 'NASDAQ:INTC', 'NYSE:DIS', 'NYSE:BA',
    ],
  },
  {
    market: 'FX',
    scanner: 'forex',
    label: 'Forex',
    symbols: [
      'FX_IDC:EURUSD', 'FX_IDC:USDJPY', 'FX_IDC:GBPUSD', 'FX_IDC:AUDUSD',
      'FX_IDC:USDCAD', 'FX_IDC:USDCHF', 'FX_IDC:NZDUSD', 'FX_IDC:USDCNH',
      'FX_IDC:USDIDR', 'FX_IDC:USDSGD',
    ],
  },
  {
    market: 'COMMODITY',
    scanner: 'cfd',
    label: 'Komoditas',
    symbols: [
      'TVC:GOLD', 'TVC:SILVER', 'TVC:USOIL', 'TVC:UKOIL', 'TVC:DXY',
      'TVC:PLATINUM', 'TVC:COPPER', 'TVC:NATGAS',
    ],
  },
];

/**
 * Fetch one market universe from the TradingView scanner.
 *
 * Columns requested: description, close, change, volume — enough for a table
 * row without the payload growing large.
 */
async function fetchScannerMarket({ scanner, symbols, market, label }) {
  const json = await getJSON(`${TV_SCANNER}/${scanner}/scan`, {
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbols: { tickers: symbols, query: { types: [] } },
        columns: ['description', 'close', 'change', 'volume', 'market_cap_basic', 'type'],
        options: { lang: 'en' },
      }),
    },
  });

  const rows = json?.data;
  if (!Array.isArray(rows)) return [];

  return rows.map(r => {
    const [description, close, change, volume, marketCap, type] = r.d || [];
    // The scanner returns "EXCHANGE:TICKER"; the display name is the part after
    // the colon, which is what a user recognises.
    const fullSymbol = String(r.s || '');
    const ticker = fullSymbol.includes(':') ? fullSymbol.split(':').pop() : fullSymbol;

    return {
      market,
      marketLabel: label,
      symbol: ticker,
      fullSymbol,
      name: description || ticker,
      type: type || null,
      // NOTE: `close` may be null for a symbol the scanner does not cover. That
      // stays null so the table renders "—" rather than a fabricated 0.
      price: toNumberOrNull(close),
      change24h: toNumberOrNull(change),
      volume: toNumberOrNull(volume),
      marketCap: toNumberOrNull(marketCap),
    };
  });
}

/** All three non-crypto markets, fetched concurrently. */
export async function fetchCrossMarketAssets() {
  const results = await Promise.all(CROSS_MARKET_UNIVERSES.map(fetchScannerMarket));
  return results.flat().filter(r => r.price !== null);
}

/**
 * Session status for the major exchanges.
 *
 * REQUEST: "Market Status juga kosongan ini kenapaa"
 *
 * The old dashboard rendered MARKET-FORECAST numbers under the heading "Market
 * Status" (Fear & Greed, dominance, and so on). That is market sentiment, not
 * market status. A panel named "Market Status" should answer one question: is
 * each exchange open or closed right now, and when does it next change?
 *
 * All times are computed in Asia/Jakarta so the answer matches the user's clock.
 */
const MARKET_SESSIONS = [
  { id: 'IDX', name: 'Bursa Efek Indonesia', tz: 'Asia/Jakarta', tzLabel: 'WIB', open: [540, 960], break: [720, 810], days: [1, 2, 3, 4, 5] },
  { id: 'NYSE', name: 'New York Stock Exchange', tz: 'America/New_York', tzLabel: 'ET', open: [570, 960], break: null, days: [1, 2, 3, 4, 5] },
  { id: 'LSE', name: 'London Stock Exchange', tz: 'Europe/London', tzLabel: 'GMT', open: [480, 990], break: null, days: [1, 2, 3, 4, 5] },
  { id: 'TSE', name: 'Tokyo Stock Exchange', tz: 'Asia/Tokyo', tzLabel: 'JST', open: [540, 900], break: [690, 750], days: [1, 2, 3, 4, 5] },
  { id: 'CRYPTO', name: 'Crypto (24/7)', tz: 'UTC', tzLabel: 'UTC', open: [0, 1440], break: null, days: [0, 1, 2, 3, 4, 5, 6] },
];

/** Read the wall-clock hour/minute/weekday inside a given IANA timezone. */
function zonedParts(timeZone, now = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const get = t => parts.find(p => p.type === t)?.value;
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const hour = Number(get('hour'));
  const minute = Number(get('minute'));
  return {
    // Intl renders midnight as "24" in some locales; normalise it.
    minutes: ((hour % 24) * 60) + minute,
    weekday: weekdayMap[get('weekday')] ?? 0,
  };
}

/** Minutes as HH:MM in the market's own timezone. */
function formatMinutes(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.round(minutes % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Human-readable "in 2j 15m" / "3j 40m lalu". */
export function formatDuration(totalMinutes) {
  const mins = Math.abs(Math.round(totalMinutes));
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `${d} hari ${h} jam`;
  if (h > 0) return `${h} jam ${m} menit`;
  return `${m} menit`;
}

/**
 * Compute open/closed state for every tracked exchange.
 *
 * Pure function of the clock so it can be unit-tested without mocking fetch.
 */
export function computeMarketStatuses(now = new Date()) {
  return MARKET_SESSIONS.map(s => {
    const { minutes, weekday } = zonedParts(s.tz, now);
    const isTradingDay = s.days.includes(weekday);
    const [openAt, closeAt] = s.open;

    // 24/7 venues (crypto) have no closed window at all.
    const alwaysOpen = openAt === 0 && closeAt === 1440;

    let state = 'CLOSED';
    let detail = '';

    if (alwaysOpen) {
      state = 'OPEN';
      detail = 'Perdagangan tanpa henti';
    } else if (!isTradingDay) {
      state = 'CLOSED';
      detail = 'Akhir pekan';
    } else if (minutes >= openAt && minutes < closeAt) {
      const inBreak = s.break && minutes >= s.break[0] && minutes < s.break[1];
      if (inBreak) {
        state = 'BREAK';
        detail = `Istirahat, buka lagi ${formatMinutes(s.break[1])} ${s.tzLabel}`;
      } else {
        state = 'OPEN';
        detail = `Tutup ${formatMinutes(closeAt)} ${s.tzLabel}`;
      }
    } else {
      state = 'CLOSED';
      detail = minutes < openAt
        ? `Buka ${formatMinutes(openAt)} ${s.tzLabel}`
        : `Besok ${formatMinutes(openAt)} ${s.tzLabel}`;
    }

    return {
      id: s.id,
      name: s.name,
      state,
      detail,
      localTime: formatMinutes(minutes),
      tzLabel: s.tzLabel,
    };
  });
}

/**
 * Trending topics for the non-crypto markets and for AI.
 *
 * REQUEST: "Trending ini ambil dari news terupdate + twitter dan threads soal
 *           market gacuma crypto tapi saham, forex, atau bahkan AI sekalipun"
 *
 * HONEST LIMITATION — please read before changing this:
 * X/Twitter and Threads have NO free public API. Reading them requires a paid
 * key, and scraping them violates their terms. So this function does NOT read
 * social media, and it must never pretend to.
 *
 * What it does provide is real and verifiable:
 *   1. CMC search rank for crypto (a genuine trending signal from CMC itself)
 *   2. TradingView's live scanner ranking for the non-crypto markets
 *   3. Headline keywords, counted across the app's own live news feed
 *
 * The UI must label which of these it is showing. Calling scanner output
 * "Twitter trending" would be a lie.
 */

/** Words that carry no topic signal when scanning headlines. */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'for', 'with', 'from', 'that', 'this',
  'are', 'was', 'were', 'will', 'has', 'have', 'had', 'its', 'you', 'your',
  'dan', 'yang', 'untuk', 'dari', 'pada', 'dengan', 'akan', 'tidak', 'ini',
  'itu', 'adalah', 'ke', 'di', 'se', 'para', 'oleh', 'dalam', 'atau', 'juga',
  'bisa', 'lebih', 'telah', 'masih', 'saat', 'usai', 'soal', 'kata', 'nya',
]);

/** Topic themes we look for in headlines, including AI. */
const TOPIC_RULES = [
  { id: 'AI', label: 'AI & Teknologi', keywords: ['ai', 'nvidia', 'openai', 'chip', 'semiconductor', 'artificial', 'intelligence', 'llm', 'datacenter', 'kecerdasan'] },
  { id: 'CRYPTO', label: 'Crypto', keywords: ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'kripto', 'altcoin', 'solana', 'stablecoin'] },
  { id: 'EQUITY', label: 'Saham', keywords: ['stock', 'saham', 'earnings', 'ihsg', 'idx', 'nasdaq', 'dow', 's&p', 'emiten'] },
  { id: 'FOREX', label: 'Forex', keywords: ['dollar', 'usd', 'rupiah', 'idr', 'euro', 'yen', 'forex', 'currency', 'mata uang'] },
  { id: 'COMMODITY', label: 'Komoditas', keywords: ['gold', 'emas', 'oil', 'minyak', 'brent', 'commodity', 'komoditas', 'copper'] },
  { id: 'MACRO', label: 'Makro & Fed', keywords: ['fed', 'inflation', 'inflasi', 'rate', 'suku bunga', 'central bank', 'recession', 'resesi', 'cpi'] },
  { id: 'GEOPOLITICS', label: 'Geopolitik', keywords: ['war', 'perang', 'sanction', 'sanksi', 'tariff', 'tarif', 'conflict', 'escalation'] },
];

/**
 * Rank live news headlines into topic counts.
 *
 * @param {Array<{title?:string, headline?:string}>} newsRows
 * @returns {Array<{id:string,label:string,count:number,samples:string[]}>}
 */
export function rankTopicsFromHeadlines(newsRows = []) {
  const rows = Array.isArray(newsRows) ? newsRows : [];
  const buckets = TOPIC_RULES.map(rule => ({ id: rule.id, label: rule.label, count: 0, samples: [] }));

  for (const row of rows) {
    const text = String(row?.title || row?.headline || '').toLowerCase();
    if (!text) continue;
    for (let i = 0; i < TOPIC_RULES.length; i += 1) {
      const hit = TOPIC_RULES[i].keywords.some(k => text.includes(k));
      if (hit) {
        buckets[i].count += 1;
        if (buckets[i].samples.length < 2) {
          buckets[i].samples.push(String(row.title || row.headline).slice(0, 90));
        }
      }
    }
  }

  return buckets
    .filter(b => b.count > 0)
    .sort((a, b) => b.count - a.count);
}

/**
 * Extract the most repeated meaningful words across headlines.
 * These are literal terms present in real reporting, not inferred topics.
 */
export function topKeywordsFromHeadlines(newsRows = [], limit = 14) {
  const counts = new Map();
  const rows = Array.isArray(newsRows) ? newsRows : [];

  for (const row of rows) {
    const text = String(row?.title || row?.headline || '').toLowerCase();
    if (!text) continue;
    for (const raw of text.split(/[^a-z0-9%$]+/)) {
      const w = raw.trim();
      // Keep tickers and percentages; drop short noise and stopwords.
      if (w.length < 3) continue;
      if (STOPWORDS.has(w)) continue;
      if (/^\d+$/.test(w)) continue;
      counts.set(w, (counts.get(w) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

/**
 * Everything the Home dashboard needs, fetched concurrently.
 *
 * A failed section resolves to `null` / `[]` so the caller can render the rest
 * of the page. Nothing here throws.
 *
 * `newsRows` is accepted rather than fetched here because the live news feed
 * already arrives with the main cockpit bundle; re-fetching it would duplicate
 * a request the app has already made.
 */
export async function fetchMarketOverview({ newsRows = [] } = {}) {
  const [
    global,
    fearGreed,
    altcoinSeason,
    majors,
    topCoins,
    trending,
    derivatives,
    marketCapHistory,
    crossMarket,
  ] = await Promise.all([
    fetchGlobalMetrics(),
    fetchFearGreed(),
    fetchAltcoinSeason(),
    fetchMajorCards(),
    fetchTopCoins(100),
    fetchTrending(),
    fetchDerivatives(),
    fetchMarketCapHistory(30),
    fetchCrossMarketAssets(),
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
    crossMarket,
    // Derived from the caller-supplied news feed. Both are real counts over
    // real headlines; neither claims to represent social media.
    topics: rankTopicsFromHeadlines(newsRows),
    keywords: topKeywordsFromHeadlines(newsRows),
    fetchedAt: Date.now(),
  };
}
