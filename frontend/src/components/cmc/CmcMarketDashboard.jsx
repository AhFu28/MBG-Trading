import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkline,
  FearGreedGauge,
  AltcoinSeasonScale,
  DominanceBar,
  MetricTile,
  MarketStatusRow,
  MarketPills,
  EmptyState,
  DashPanel,
  DASH,
  changeColor,
  formatPct,
} from './CmcPrimitives.jsx';
import { formatUsdCompact, formatPrice, computeMarketStatuses } from '../../services/marketOverview.js';
import { useMarketOverview } from '../../hooks/useMarketOverview.js';
import { useWatchlist } from '../../hooks/useWatchlist.js';
import CryptoIcon from '../CryptoIcon.jsx';

/**
 * CmcMarketDashboard — the CoinMarketCap-style Home page.
 *
 * REQUEST (Jendral Arib, 2026-10-08):
 *   "aku ingin UI nya template sama persis bentuknya layout seperti
 *    coinmarketcap.com ... di pilihan home sekarang kan penuh bgt, buat biar
 *    bermanfaat dong isinya ... isi home adalah market overview."
 *
 * WHAT THIS REPLACES: the previous Home was a 2,199-line composite of portfolio
 * hero, macro trio grid, bento row, news wire and execution matrix. Nearly all
 * of its headline numbers were hardcoded literals (VIX 28%, BTC dominance
 * 58.7%, five yield tenors, four factor percentages). It looked authoritative
 * and was, in large part, decoration.
 *
 * DESIGN DECISION — IDX CONTENT WAS REMOVED, NOT LOST:
 * The old Home led with IHSG, foreign flow, conglomerates and dividend hunters.
 * Those are Indonesian-market desks and they still exist as their own tabs
 * (Saham IDX, Whale Tracker, Foreign Flow). Home is now a global market
 * overview, matching the CMC brief. Nothing was deleted from the product.
 *
 * PANELS DELIBERATELY ABSENT (no free data source exists — verified 2026-10-08):
 *   - ETF Flows        : CMC serves it only inside its SSR HTML, no JSON API
 *   - Liquidations 24h : Coinglass requires a paid key; no free alternative
 *   - Community posts  : no public endpoint at all
 * These are omitted. The project's zero-fake-data rule means an honest gap is
 * better than a plausible-looking fabrication.
 */

const TIME_RANGES = [
  { id: '7d', label: '7d', days: 7 },
  { id: '30d', label: '30d', days: 30 },
  { id: '90d', label: '90d', days: 90 },
];

/** Market label and glyph for the cross-market table. */
const MARKET_BADGE = {
  CRYPTO: '🪙 Crypto',
  US: '🇺🇸 Saham US',
  FX: '💱 Forex',
  COMMODITY: '🛢️ Komoditas',
};

const MARKET_GLYPH = {
  US: '🏛️',
  FX: '💱',
  COMMODITY: '🛢️',
};

/**
 * Market-cap history line chart. No chart library — an SVG polyline is enough.
 *
 * LABEL HONESTY: the series is BTC's market cap, not the whole crypto market
 * (no free source publishes a total-market-cap series). The empty state says so,
 * because "market cap" alone would overstate what the line actually shows.
 */
function MarketCapChart({ series, height = 210 }) {
  const points = (series || []).filter(p => Number.isFinite(p?.marketCap));
  if (points.length < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '0 16px' }}>
        Grafik kapitalisasi pasar BTC belum tersedia
      </div>
    );
  }

  const width = 1000;
  const values = points.map(p => p.marketCap);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const padTop = 12;
  const usableH = height - padTop * 2;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = padTop + (1 - (p.marketCap - min) / span) * usableH;
    return { x, y };
  });

  const line = `M${coords.map(c => `${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(' L')}`;
  const area = `${line} L${width},${height} L0,${height} Z`;

  const first = values[0];
  const last = values[values.length - 1];
  const isUp = last >= first;
  const stroke = isUp ? 'var(--cmc-up)' : 'var(--cmc-down)';

  // Four horizontal gridlines with real value labels, like CMC's chart.
  const gridValues = [0, 1, 2, 3].map(i => max - ((max - min) / 3) * i);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative' }}>
        {/* Gridline labels sit behind the chart so they never cover the line. */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
          {gridValues.map((gv, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: '46px' }}>
                {formatUsdCompact(gv)}
              </span>
              <span style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
            </div>
          ))}
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block', paddingLeft: '52px', boxSizing: 'border-box' }} role="img" aria-label="Kapitalisasi pasar Bitcoin sepanjang waktu">
          <defs>
            <linearGradient id="mcArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.30" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#mcArea)" />
          <path d={line} fill="none" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '52px', marginTop: '5px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        <span>{new Date(points[0].t).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
        <span>{new Date(points[points.length - 1].t).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
      </div>
    </div>
  );
}

/** One large coin card with a 7-day sparkline, matching CMC's top row. */
function MajorCard({ coin, onOpen }) {
  const isUp = (coin.change24h ?? 0) >= 0;
  return (
    <button
      onClick={() => onOpen && onOpen(coin.symbol, coin.pair)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '9px',
        padding: '13px 14px',
        borderRadius: '10px',
        border: 'var(--border-hairline)',
        background: 'var(--bg-panel)',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        minWidth: 0,
      }}
      title={`Buka ${coin.symbol}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
        <CryptoIcon symbol={coin.symbol} size={20} />
        <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {coin.symbol}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>7d</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
          <span style={{ fontSize: '16.5px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {formatPrice(coin.price)}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: changeColor(coin.change24h) }}>
            {formatPct(coin.change24h)}
          </span>
        </div>
        <Sparkline data={coin.sparkline} isUp={isUp} width={104} height={36} />
      </div>
    </button>
  );
}

/** Star toggle — the affordance that feeds the Home watchlist. */
function StarButton({ symbol, market, watchlist, size = 14 }) {
  const active = watchlist.has(symbol, market);
  return (
    <button
      onClick={(e) => {
        // Rows and cards are clickable; starring must not also open the asset.
        e.stopPropagation();
        watchlist.toggle(symbol, market);
      }}
      aria-label={active ? `Hapus ${symbol} dari watchlist` : `Tambah ${symbol} ke watchlist`}
      title={active ? 'Hapus dari Watchlist' : 'Tambah ke Watchlist'}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '2px 3px',
        fontSize: `${size}px`,
        lineHeight: 1,
        color: active ? 'var(--accent-gold)' : 'var(--text-muted)',
        opacity: active ? 1 : 0.45,
        transition: 'opacity 0.15s ease, color 0.15s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = active ? 1 : 0.45; }}
    >
      {active ? '★' : '☆'}
    </button>
  );
}

export default function CmcMarketDashboard({ onOpenAsset, onOpenChart, livePrices = {}, newsRows = [] }) {
  const { data, loading, error, refresh } = useMarketOverview({ newsRows });
  const watchlist = useWatchlist();
  const [range, setRange] = useState('30d');
  const [search, setSearch] = useState('');
  const [view, setView] = useState('overview');
  const [assetMarket, setAssetMarket] = useState('ALL');

  /**
   * Opening an asset always goes to the FULL chart.
   *
   * `onOpenChart` is App's TradingView modal handler. `onOpenAsset` is kept as
   * a fallback so a caller that only wires one of the two still works — but the
   * chart handler wins, because the small Security Hub drawer is not what a
   * user expects when they click a price. */
  const openAsset = onOpenChart || onOpenAsset;

  const global = data?.global;
  const fng = data?.fearGreed;
  const season = data?.altcoinSeason;
  const majors = data?.majors || [];
  const topCoins = data?.topCoins || [];
  const trending = data?.trending || [];
  const deriv = data?.derivatives;
  const crossMarket = data?.crossMarket || [];

  /**
   * Live exchange session state.
   *
   * Recomputed on a one-minute tick so the open/closed flags and countdowns
   * stay accurate without refetching any market data.
   */
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const marketStatuses = useMemo(() => computeMarketStatuses(new Date(nowTick)), [nowTick]);

  // The chart range control filters the 30d series we already fetched; asking
  // the API again for a shorter window would be a redundant round-trip.
  const chartSeries = useMemo(() => {
    const full = data?.marketCapHistory || [];
    const days = TIME_RANGES.find(r => r.id === range)?.days ?? 30;
    if (full.length <= days) return full;
    return full.slice(full.length - days);
  }, [data, range]);

  /**
   * Cross-market rows, normalised into one shape.
   *
   * CRYPTO comes from the CMC listing; US / FX / COMMODITY come from the
   * TradingView scanner. Both are flattened here so the table has a single
   * render path.
   */
  const assetRows = useMemo(() => {
    const cryptoRows = topCoins.map(c => ({
      key: `CRYPTO:${c.id}`,
      market: 'CRYPTO',
      symbol: c.symbol,
      name: c.name,
      price: c.price,
      change24h: c.change24h,
      volume: c.volume24h,
      marketCap: c.marketCap,
      rank: c.rank,
    }));

    const other = crossMarket.map(r => ({
      key: `${r.market}:${r.fullSymbol}`,
      market: r.market,
      symbol: r.symbol,
      name: r.name,
      price: r.price,
      change24h: r.change24h,
      volume: r.volume,
      marketCap: r.marketCap,
      rank: null,
    }));

    const all = [...cryptoRows, ...other];
    const byMarket = assetMarket === 'ALL' ? all : all.filter(r => r.market === assetMarket);

    const q = search.trim().toLowerCase();
    if (!q) return byMarket;
    return byMarket.filter(r =>
      r.symbol?.toLowerCase().includes(q) || r.name?.toLowerCase().includes(q),
    );
  }, [topCoins, crossMarket, assetMarket, search]);

  /** Counts for the market filter pills. */
  const marketCounts = useMemo(() => {
    const count = m => {
      if (m === 'CRYPTO') return topCoins.length;
      return crossMarket.filter(r => r.market === m).length;
    };
    return [
      { id: 'ALL', label: 'Semua', count: topCoins.length + crossMarket.length },
      { id: 'CRYPTO', label: '🪙 Crypto', count: count('CRYPTO') },
      { id: 'US', label: '🇺🇸 Saham US', count: count('US') },
      { id: 'FX', label: '💱 Forex', count: count('FX') },
      { id: 'COMMODITY', label: '🛢️ Komoditas', count: count('COMMODITY') },
    ];
  }, [topCoins, crossMarket]);

  const watched = watchlist.entries;

  // A fetch that returned nothing at all means every upstream is unreachable —
  // usually a blocked network. Say so instead of showing empty boxes.
  const nothingLoaded = !loading && !!error;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', width: '100%' }}>

      {/* ---------- HEADER: title, live indicator, refresh ---------- */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: 'var(--text-primary)' }}>
            Market Overview
          </h2>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 800, color: 'var(--cmc-up)', background: 'rgba(22,199,132,0.12)', border: '1px solid rgba(22,199,132,0.3)', padding: '2px 7px', borderRadius: '20px' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--cmc-up)', boxShadow: '0 0 6px var(--cmc-up)' }} />
            LIVE
          </span>
          {data?.fetchedAt && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              diperbarui {new Date(data.fetchedAt).toLocaleTimeString('id-ID')}
            </span>
          )}
          {error && (
            <span style={{ fontSize: '12px', color: 'var(--accent-gold)' }}>
              ⚠️ sebagian data gagal dimuat
            </span>
          )}
        </div>
        <button
          onClick={refresh}
          style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', color: 'var(--text-secondary)', borderRadius: '7px', padding: '5px 11px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          ↻ Segarkan
        </button>
      </div>

      {/* ---------- ROW 1: major coin cards ---------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(178px, 1fr))', gap: '10px' }}>
        {loading && majors.length === 0
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="telemetry-panel" style={{ height: '92px', opacity: 0.45, borderRadius: '10px' }} />
            ))
          : majors.map(coin => (
              <MajorCard key={coin.symbol} coin={coin} onOpen={openAsset} />
            ))}
      </div>

      {/* ---------- ROW 2: market status + watchlist ---------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)', gap: '11px' }} className="cmc-two-col">

        <DashPanel
          title="Market Status"
          subtitle="Status sesi bursa saat ini (waktu Jakarta)"
        >
          {/* Previously this panel showed market SENTIMENT (Fear & Greed,
              dominance) under a "Market Status" heading, which answered the
              wrong question. It now answers the one the name implies: is each
              exchange tradeable right now, and when does that change. */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '4px 20px' }}>
            {marketStatuses.map(s => (
              <MarketStatusRow key={s.id} status={s} />
            ))}
          </div>

          <div style={{ borderTop: 'var(--border-hairline)', paddingTop: '11px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: '15px', alignItems: 'start' }}>
            {/* Fear & Greed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Fear &amp; Greed</span>
              <FearGreedGauge score={fng?.score} label={fng?.classification} size={124} />
              {fng?.source && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Sumber: {fng.source}
                </span>
              )}
            </div>

            {/* Market cap + volume */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <MetricTile
                label="Market Cap"
                value={formatUsdCompact(global?.totalMarketCap)}
                change={global?.marketCapChange24h}
                hint="Total kapitalisasi pasar seluruh aset kripto, 24 jam"
              />
              <MetricTile
                label="Volume (24h)"
                value={formatUsdCompact(global?.totalVolume24h)}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Koin Aktif</span>
                <span style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {global?.activeCryptocurrencies?.toLocaleString('id-ID') ?? DASH}
                </span>
              </div>
            </div>

            {/* Altcoin season + dominance */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Altcoin Season</span>
                  <strong style={{ fontSize: '19px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {season?.value ?? DASH}
                  </strong>
                </div>
                <AltcoinSeasonScale value={season?.value} dialConfigs={season?.dialConfigs} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Dominasi</span>
                <DominanceBar btc={global?.btcDominance} eth={global?.ethDominance} />
              </div>
            </div>
          </div>
        </DashPanel>

        {/* Watchlist — fed by the star toggle across the whole terminal */}
        <DashPanel
          title="Watchlist Saya"
          subtitle={watched.length ? `${watched.length} instrumen dipantau` : 'Belum ada instrumen'}
          right={
            watched.length > 0 ? (
              <button
                onClick={watchlist.clear}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}
              >
                Kosongkan
              </button>
            ) : null
          }
        >
          {watched.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '26px 12px', textAlign: 'center' }}>
              <span style={{ fontSize: '22px', opacity: 0.5 }}>☆</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Klik ikon bintang di tabel koin untuk menambahkan instrumen ke sini.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '290px', overflowY: 'auto' }}>
              {watched.map(item => {
                const live = livePrices[item.symbol] || livePrices[`${item.symbol}USDT`] || livePrices[`IDX:${item.symbol}`];
                const coin = topCoins.find(c => c.symbol === item.symbol);
                const price = live?.price ?? coin?.price;
                const change = live?.changePct ?? coin?.change24h;
                return (
                  <div
                    key={item.key}
                    onClick={() => openAsset && openAsset(item.symbol, item.market === 'CRYPTO' ? 'CRYPTO' : item.market)}
                    style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 8px', borderRadius: '7px', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-panel-subtle)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <StarButton symbol={item.symbol} market={item.market} watchlist={watchlist} size={13} />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.symbol}
                    </span>
                    <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {price === undefined || price === null ? DASH : formatPrice(price)}
                    </span>
                    <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: changeColor(change), minWidth: '54px', textAlign: 'right' }}>
                      {change === undefined || change === null ? DASH : formatPct(change)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </DashPanel>
      </div>

      {/* ---------- ROW 3: market cap chart + derivatives ---------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '11px' }} className="cmc-two-col">

        <DashPanel
          title="Kapitalisasi Pasar BTC"
          subtitle="30 hari terakhir, dihitung dari harga BTC dan supply beredar"
          right={
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ display: 'flex', background: 'var(--bg-panel-subtle)', borderRadius: '6px', padding: '2px', border: 'var(--border-hairline)' }}>
                {['overview', 'breakdown'].map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    style={{
                      background: view === v ? 'var(--accent-blue)' : 'transparent',
                      color: view === v ? '#fff' : 'var(--text-muted)',
                      border: 'none', borderRadius: '4px', padding: '3px 9px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', background: 'var(--bg-panel-subtle)', borderRadius: '6px', padding: '2px', border: 'var(--border-hairline)' }}>
                {TIME_RANGES.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setRange(r.id)}
                    style={{
                      background: range === r.id ? 'var(--accent-blue)' : 'transparent',
                      color: range === r.id ? '#fff' : 'var(--text-muted)',
                      border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          }
        >
          {view === 'overview' ? (
            <>
              <div style={{ display: 'flex', gap: '26px', flexWrap: 'wrap' }}>
                <MetricTile
                  label="Market Cap"
                  value={formatUsdCompact(chartSeries.length ? chartSeries[chartSeries.length - 1].marketCap : global?.totalMarketCap)}
                  change={global?.marketCapChange24h}
                />
                <MetricTile
                  label="Volume (24h)"
                  value={formatUsdCompact(chartSeries.length ? chartSeries[chartSeries.length - 1].volume : global?.totalVolume24h)}
                />
              </div>
              <MarketCapChart series={chartSeries} />
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <DominanceBar btc={global?.btcDominance} eth={global?.ethDominance} height={16} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '13px' }}>
                <MetricTile label="Dominasi Bitcoin" value={global?.btcDominance !== null && global?.btcDominance !== undefined ? `${Number(global.btcDominance).toFixed(2)}%` : DASH} />
                <MetricTile label="Dominasi Ethereum" value={global?.ethDominance !== null && global?.ethDominance !== undefined ? `${Number(global.ethDominance).toFixed(2)}%` : DASH} />
                <MetricTile label="Total Aset" value={global?.totalMarketCap ? formatUsdCompact(global.totalMarketCap) : DASH} />
                <MetricTile label="Bursa Aktif" value={global?.activeExchanges?.toLocaleString('id-ID') ?? DASH} />
              </div>
            </div>
          )}
        </DashPanel>

        <DashPanel title="Derivatives" subtitle={deriv?.venue ? `Sumber: ${deriv.venue}` : undefined}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <MetricTile label="Open Interest" value={formatUsdCompact(deriv?.totalOpenInterestUsd)} />
            <MetricTile label="Volume (24h)" value={formatUsdCompact(deriv?.totalVolume24hUsd)} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Open Interest Terbesar</span>
              {(deriv?.topByOpenInterest || []).map(a => (
                <div key={a.symbol} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '12px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{a.symbol}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{formatUsdCompact(a.openInterestUsd)}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: changeColor(a.funding), minWidth: '52px', textAlign: 'right' }}>
                    {a.funding === null || a.funding === undefined ? DASH : `${(a.funding * 100).toFixed(4)}%`}
                  </span>
                </div>
              ))}
              {(!deriv || !deriv.topByOpenInterest?.length) && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Data derivatif belum tersedia</span>
              )}
            </div>
          </div>
        </DashPanel>
      </div>

      {/* ---------- ROW 4: cross-market asset table + trending ---------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 1fr)', gap: '11px' }} className="cmc-two-col">

        <DashPanel
          title="Semua Aset"
          subtitle="Crypto, saham US, forex dan komoditas dalam satu tabel"
          right={
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari aset..."
              style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', borderRadius: '6px', padding: '4px 9px', fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', width: '140px' }}
            />
          }
        >
          <MarketPills markets={marketCounts} active={assetMarket} onChange={setAssetMarket} />

          {nothingLoaded ? (
            <EmptyState
              message="Data pasar gagal dimuat."
              hint="Periksa koneksi internet. Beberapa sumber (CoinMarketCap, Binance Vision, TradingView) mungkin diblokir jaringan Anda."
              onRetry={refresh}
            />
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '430px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 2, color: 'var(--text-muted)', fontSize: '12px' }}>
                    <th style={{ textAlign: 'left', padding: '6px 5px', fontWeight: 700, width: '94px' }}>Pasar</th>
                    <th style={{ textAlign: 'left', padding: '6px 5px', fontWeight: 700 }}>Nama</th>
                    <th style={{ textAlign: 'right', padding: '6px 5px', fontWeight: 700 }}>Harga</th>
                    <th style={{ textAlign: 'right', padding: '6px 5px', fontWeight: 700 }}>24j %</th>
                    <th style={{ textAlign: 'right', padding: '6px 5px', fontWeight: 700 }}>Volume</th>
                    <th style={{ textAlign: 'right', padding: '6px 5px', fontWeight: 700 }}>Market Cap</th>
                    <th style={{ textAlign: 'center', padding: '6px 5px', fontWeight: 700 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {assetRows.map(row => (
                    <tr
                      key={row.key}
                      tabIndex={0}
                      role="button"
                      onClick={() => openAsset && openAsset(row.symbol, row.market)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openAsset && openAsset(row.symbol, row.market);
                        }
                      }}
                      style={{ borderTop: 'var(--border-hairline)', cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-panel-subtle)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      title={`Buka chart ${row.symbol}`}
                    >
                      <td style={{ padding: '7px 5px', fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {MARKET_BADGE[row.market] || row.market}
                      </td>
                      <td style={{ padding: '7px 5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                          <StarButton symbol={row.symbol} market={row.market} watchlist={watchlist} />
                          {row.market === 'CRYPTO'
                            ? <CryptoIcon symbol={row.symbol} size={17} />
                            : <span style={{ width: 17, textAlign: 'center', fontSize: '13px' }}>{MARKET_GLYPH[row.market] || '•'}</span>}
                          <span style={{ fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.symbol}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '7px 5px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, whiteSpace: 'nowrap' }}>{formatPrice(row.price)}</td>
                      <td style={{ padding: '7px 5px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: changeColor(row.change24h) }}>{formatPct(row.change24h)}</td>
                      <td style={{ padding: '7px 5px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{formatUsdCompact(row.volume)}</td>
                      <td style={{ padding: '7px 5px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{formatUsdCompact(row.marketCap)}</td>
                      <td style={{ padding: '7px 5px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onOpenChart && onOpenChart(row.symbol, row.market)}
                          style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', color: 'var(--accent-blue)', borderRadius: '5px', padding: '3px 8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                        >
                          📈 Chart
                        </button>
                      </td>
                    </tr>
                  ))}
                  {assetRows.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '10px' }}>
                        {loading
                          ? <span style={{ color: 'var(--text-muted)' }}>Memuat data aset…</span>
                          : <EmptyState
                              compact
                              message={search ? 'Tidak ada aset yang cocok dengan pencarian.' : 'Belum ada data untuk pasar ini.'}
                              hint={marketCounts.find(m => m.id === assetMarket)?.count === 0
                                ? 'Sumber data untuk pasar ini sedang tidak mengembalikan hasil.'
                                : undefined}
                              onRetry={search ? undefined : refresh}
                            />}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </DashPanel>

        <DashPanel title="Trending & Topik" subtitle="Paling dicari dan paling diliput hari ini">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {trending.slice(0, 8).map((t, i) => (
              <div
                key={`${t.symbol}-${i}`}
                onClick={() => openAsset && openAsset(t.symbol, 'CRYPTO')}
                style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 6px', borderRadius: '7px', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-panel-subtle)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: '13px' }}>{i + 1}</span>
                <StarButton symbol={t.symbol} market="CRYPTO" watchlist={watchlist} size={13} />
                <CryptoIcon symbol={t.symbol} size={16} />
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.symbol}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{formatPrice(t.price)}</span>
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: changeColor(t.change24h) }}>{formatPct(t.change24h)}</span>
                </div>
              </div>
            ))}
            {trending.length === 0 && (
              <EmptyState compact message={loading ? 'Memuat…' : 'Data trending belum tersedia.'} onRetry={loading ? undefined : refresh} />
            )}
          </div>

          {/* Topic coverage from the live news feed.
              HONEST LABEL: this counts headlines in our own news wire. It is
              NOT X/Twitter or Threads; neither has a free public API. */}
          <div style={{ borderTop: 'var(--border-hairline)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Jumlah berita per topik dari Live News Wire (bukan media sosial)
            </span>
            {(data?.topics || []).map(topic => (
              <div key={topic.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {topic.label}
                </span>
                <span style={{ flex: '0 0 60px', height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: `${Math.min(100, (topic.count / (data?.topics?.[0]?.count || 1)) * 100)}%`, background: 'var(--accent-blue)' }} />
                </span>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', minWidth: '18px', textAlign: 'right' }}>{topic.count}</span>
              </div>
            ))}
            {(data?.topics || []).length === 0 && !loading && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Belum ada berita yang bisa dikelompokkan.
              </span>
            )}
            {(data?.keywords || []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                {data.keywords.slice(0, 10).map(k => (
                  <span key={k.word} style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', color: 'var(--text-secondary)' }}>
                    {k.word} <strong style={{ color: 'var(--text-muted)' }}>{k.count}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        </DashPanel>
      </div>

      {/* ---------- FOOTER: honest disclosure of what is NOT shown ---------- */}
      <div className="telemetry-panel" style={{ padding: '9px 13px', borderRadius: '9px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
        <strong style={{ color: 'var(--text-secondary)' }}>Sumber data:</strong> Binance Vision (tabel koin, top gainers, grafik BTC) ·
        CoinGecko (market cap global, dominasi, trending) · Hyperliquid (open interest &amp; funding) ·
        TradingView (saham US, forex, komoditas) · alternative.me (Fear &amp; Greed).
        <br />
        <strong style={{ color: 'var(--text-secondary)' }}>Tidak ditampilkan:</strong> ETF Flows, Likuidasi 24 Jam, Community Posts,
        dan Altcoin Season Index (belum ada sumber data publik gratis, jadi panelnya dikosongkan daripada diisi angka perkiraan).
        <br />
        <strong style={{ color: 'var(--text-secondary)' }}>Catatan grafik:</strong> grafik market cap menampilkan kapitalisasi pasar BTC,
        bukan seluruh pasar kripto. Tidak ada sumber gratis yang menyediakan seri total market cap.
      </div>
    </div>
  );
}
