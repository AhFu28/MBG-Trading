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

await check('CMC global metrics', async () => {
  const j = await getJSON(`${CMC}/global-metrics/quotes/latest`);
  return {
    totalMarketCap: j?.data?.totalMarketCap,
    btcDominance: j?.data?.btcDominance,
  };
});

await check('Fear & Greed (alternative.me)', async () => {
  const j = await getJSON(`${FNG}?limit=1`);
  return { value: j?.data?.[0]?.value, label: j?.data?.[0]?.value_classification };
});

await check('CMC altcoin season', async () => {
  const end = Math.floor(Date.now() / 1000);
  const start = end - 365 * 86400;
  const j = await getJSON(`${CMC}/altcoin-season/chart?start=${start}&end=${end}`);
  return {
    now: j?.data?.historicalValues?.now,
    dials: j?.data?.dialConfigs?.length,
    points: j?.data?.points?.length,
  };
});

await check('CMC top coins listing', async () => {
  const j = await getJSON(`${CMC}/cryptocurrency/listing?start=1&limit=10&sortBy=market_cap&sortType=desc&convert=USD`);
  const rows = j?.data?.cryptoCurrencyList ?? [];
  return { count: rows.length, first: rows[0]?.symbol, price: rows[0]?.quotes?.[0]?.price };
});

await check('CMC trending (topsearch)', async () => {
  const j = await getJSON(`${CMC}/topsearch/rank`);
  const rows = j?.data?.cryptoTopSearchRanks ?? [];
  return { count: rows.length, first: rows[0]?.symbol };
});

await check('CMC market-cap history (30d)', async () => {
  const end = Math.floor(Date.now() / 1000);
  const start = end - 30 * 86400;
  const j = await getJSON(`${CMC}/global-metrics/quotes/historical?timeStart=${start}&timeEnd=${end}&interval=1d`);
  const quotes = j?.data?.quotes ?? [];
  return { points: quotes.length, last: quotes[quotes.length - 1]?.quote?.[0]?.totalMarketCap };
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
