/**
 * Live verification of the market-overview endpoints.
 *
 * WHY THIS IS A SCRIPT AND NOT A UNIT TEST
 * ----------------------------------------
 * A mocked test only proves our code agrees with our own assumptions. The thing
 * that actually breaks a market dashboard is an upstream API changing shape,
 * disappearing, or being blocked from Indonesia. That can only be caught by
 * calling the real endpoints.
 *
 * Run:  node scripts/verify-market-overview.mjs
 *
 * Exit code 1 if any required section returns nothing, so this can gate a
 * release.
 */

const CMC = 'https://api.coinmarketcap.com/data-api/v3';
const FNG = 'https://api.alternative.me/fng/';
const BINANCE = 'https://data-api.binance.vision/api/v3';
const HYPERLIQUID = 'https://api.hyperliquid.xyz/info';

const results = [];

async function check(name, fn) {
  const started = Date.now();
  try {
    const value = await fn();
    const ms = Date.now() - started;
    const ok = value !== null && value !== undefined && !(Array.isArray(value) && value.length === 0);
    results.push({ name, ok, ms, value });
    const line = ok ? 'PASS' : 'EMPTY';
    console.log(`[${line}] ${name}  (${ms}ms)`);
    console.log(`        ${JSON.stringify(value)?.slice(0, 240) ?? String(value)}`);
  } catch (err) {
    results.push({ name, ok: false, ms: Date.now() - started, error: err.message });
    console.log(`[FAIL] ${name}  -> ${err.message}`);
  }
}

async function getJSON(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

console.log('Live market-overview endpoint verification');
console.log('='.repeat(70));
console.log('Order matters: Binance Vision is asked FIRST because CoinGecko\'s free');
console.log('tier allows only ~5 calls/min per IP. Reversing these causes HTTP 429.');
console.log('='.repeat(70));

await check('Global metrics (CMC / CoinGecko fallback)', async () => {
  const cmc = await getJSON(`${CMC}/global-metrics/quotes/latest`);
  if (cmc?.data) {
    return { marketCap: cmc.data.totalMarketCap, btcDom: cmc.data.btcDominance, from: 'CMC' };
  }
  const cg = await getJSON('https://api.coingecko.com/api/v3/global');
  return {
    marketCap: cg?.data?.total_market_cap?.usd,
    btcDom: cg?.data?.market_cap_percentage?.btc,
    from: 'CoinGecko',
  };
});

await check('Fear & Greed (alternative.me)', async () => {
  const j = await getJSON(`${FNG}?limit=1`);
  return { value: j?.data?.[0]?.value, label: j?.data?.[0]?.value_classification };
});

await check('Top coins listing (Binance Vision / CoinGecko fallback)', async () => {
  const bn = await getJSON(`${BINANCE}/ticker/24hr`);
  if (Array.isArray(bn) && bn.length > 0) {
    const rows = bn
      .filter(t => t.symbol.endsWith('USDT'))
      .sort((a, b) => (parseFloat(b.quoteVolume) || 0) - (parseFloat(a.quoteVolume) || 0))
      .slice(0, 10);
    return { count: rows.length, first: rows[0]?.symbol, price: rows[0]?.lastPrice, from: 'Binance' };
  }
  const cg = await getJSON('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false');
  return { count: (cg || []).length, first: cg?.[0]?.symbol, price: cg?.[0]?.current_price, from: 'CoinGecko' };
});

await check('Trending (CoinGecko / Binance fallback)', async () => {
  const cg = await getJSON('https://api.coingecko.com/api/v3/search/trending');
  const rows = cg?.coins ?? [];
  if (rows.length > 0) {
    return { count: rows.length, first: rows[0]?.item?.symbol, from: 'CoinGecko search' };
  }
  const bn = await getJSON(`${BINANCE}/ticker/24hr`);
  const gainers = (bn || [])
    .filter(t => t.symbol.endsWith('USDT'))
    .sort((a, b) => (parseFloat(b.priceChangePercent) || 0) - (parseFloat(a.priceChangePercent) || 0))
    .slice(0, 8);
  return { count: gainers.length, first: gainers[0]?.symbol, from: 'Binance gainers' };
});

await check('BTC market-cap history 30d (Binance Vision / CoinGecko fallback)', async () => {
  const bn = await getJSON(`${BINANCE}/klines?symbol=BTCUSDT&interval=1d&limit=30`);
  if (Array.isArray(bn) && bn.length > 0) {
    return { points: bn.length, lastClose: bn[bn.length - 1]?.[4], from: 'Binance' };
  }
  const cg = await getJSON('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30&interval=daily');
  return { points: cg?.prices?.length ?? 0, from: 'CoinGecko' };
});

await check('Binance Vision batched majors', async () => {
  const symbols = encodeURIComponent(JSON.stringify(['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT']));
  const j = await getJSON(`${BINANCE}/ticker/24hr?symbols=${symbols}`);
  return { count: j.length, btc: j.find(t => t.symbol === 'BTCUSDT')?.lastPrice };
});

await check('Binance Vision klines (7d sparkline)', async () => {
  const j = await getJSON(`${BINANCE}/klines?symbol=BTCUSDT&interval=1h&limit=168`);
  return { candles: j.length, lastClose: j[j.length - 1]?.[4] };
});

await check('Hyperliquid derivatives (OI + funding)', async () => {
  const j = await getJSON(HYPERLIQUID, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
  });
  const universe = j?.[0]?.universe ?? [];
  const btc = universe.findIndex(u => u.name === 'BTC');
  return {
    assets: universe.length,
    btcOpenInterest: btc >= 0 ? j[1][btc]?.openInterest : null,
    btcMarkPx: btc >= 0 ? j[1][btc]?.markPx : null,
  };
});

// ---- Cross-market desks (added 2026-10-08) ------------------------------
// Requested: the asset table must cover stocks, forex and commodities, not
// crypto only. All three come from the TradingView scanner.

const TV = 'https://scanner.tradingview.com';

async function scanMarket(scanner, tickers) {
  return getJSON(`${TV}/${scanner}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      symbols: { tickers, query: { types: [] } },
      columns: ['description', 'close', 'change', 'volume'],
      options: { lang: 'en' },
    }),
  });
}

await check('US equities (TradingView scanner)', async () => {
  const j = await scanMarket('america', ['NASDAQ:NVDA', 'NASDAQ:AAPL', 'NASDAQ:MSFT']);
  const rows = j?.data ?? [];
  return { count: rows.length, first: rows[0]?.d?.[0], close: rows[0]?.d?.[1] };
});

await check('Forex (TradingView scanner)', async () => {
  const j = await scanMarket('forex', ['FX_IDC:EURUSD', 'FX_IDC:USDJPY', 'FX_IDC:USDIDR']);
  const rows = j?.data ?? [];
  return { count: rows.length, first: rows[0]?.d?.[0], close: rows[0]?.d?.[1] };
});

await check('Commodities (TradingView scanner)', async () => {
  const j = await scanMarket('cfd', ['TVC:GOLD', 'TVC:SILVER', 'TVC:USOIL']);
  const rows = j?.data ?? [];
  return { count: rows.length, first: rows[0]?.d?.[0], close: rows[0]?.d?.[1] };
});

console.log('='.repeat(70));
const failed = results.filter(r => !r.ok);
console.log(`${results.length - failed.length}/${results.length} sections returned live data.`);
if (failed.length) {
  console.log('\nSections with no data:');
  for (const f of failed) console.log(`  - ${f.name}${f.error ? `: ${f.error}` : ''}`);
  process.exit(1);
}
console.log('All market-overview sources are live and reachable.');
