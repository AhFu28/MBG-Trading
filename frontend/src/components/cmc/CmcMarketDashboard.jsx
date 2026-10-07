import React, { useState, useMemo } from 'react';
import {
  Sparkline,
  FearGreedGauge,
  AltcoinSeasonScale,
  DominanceBar,
  MetricTile,
  DashPanel,
  DASH,
  changeColor,
  formatPct,
} from './CmcPrimitives.jsx';
import { formatUsdCompact, formatPrice } from '../../services/marketOverview.js';
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

/** Market-cap history line chart. No chart library — an SVG polyline is enough. */
function MarketCapChart({ series, height = 210 }) {
  const points = (series || []).filter(p => Number.isFinite(p?.marketCap));
  if (points.length < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '11.5px' }}>
        Grafik market cap belum tersedia
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
  const stroke = isUp ? '#16c784' : '#ea3943';

  // Four horizontal gridlines with real value labels, like CMC's chart.
  const gridValues = [0, 1, 2, 3].map(i => max - ((max - min) / 3) * i);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative' }}>
        {/* Gridline labels sit behind the chart so they never cover the line. */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
          {gridValues.map((gv, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: '46px' }}>
                {formatUsdCompact(gv)}
              </span>
              <span style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
            </div>
          ))}
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block', paddingLeft: '52px', boxSizing: 'border-box' }} role="img" aria-label="Total crypto market cap over time">
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

      <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '52px', marginTop: '5px', fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
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
        <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>7d</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
          <span style={{ fontSize: '16.5px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {formatPrice(coin.price)}
          </span>
          <span style={{ fontSize: '11.5px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: changeColor(coin.change24h) }}>
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
        color: active ? '#f59e0b' : 'var(--text-muted)',
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

export default function CmcMarketDashboard({ onOpenAsset, livePrices = {} }) {
  const { data, loading, refresh } = useMarketOverview();
  const watchlist = useWatchlist();
  const [range, setRange] = useState('30d');
  const [search, setSearch] = useState('');
  const [view, setView] = useState('overview');

  const global = data?.global;
  const fng = data?.fearGreed;
  const season = data?.altcoinSeason;
  const majors = data?.majors || [];
  const topCoins = data?.topCoins || [];
  const trending = data?.trending || [];
  const deriv = data?.derivatives;

  // The chart range control filters the 30d series we already fetched; asking
  // the API again for a shorter window would be a redundant round-trip.
  const chartSeries = useMemo(() => {
    const full = data?.marketCapHistory || [];
    const days = TIME_RANGES.find(r => r.id === range)?.days ?? 30;
    if (full.length <= days) return full;
    return full.slice(full.length - days);
  }, [data, range]);

  const filteredCoins = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return topCoins;
    return topCoins.filter(c =>
      c.symbol?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q),
    );
  }, [topCoins, search]);

  const watched = watchlist.entries;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', width: '100%' }}>

      {/* ---------- HEADER: title, live indicator, refresh ---------- */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: 'var(--text-primary)' }}>
            Crypto Market Overview
          </h2>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '9.5px', fontWeight: 800, color: '#16c784', background: 'rgba(22,199,132,0.12)', border: '1px solid rgba(22,199,132,0.3)', padding: '2px 7px', borderRadius: '20px' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#16c784', boxShadow: '0 0 6px #16c784' }} />
            LIVE
          </span>
          {data?.fetchedAt && (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              diperbarui {new Date(data.fetchedAt).toLocaleTimeString('id-ID')}
            </span>
          )}
        </div>
        <button
          onClick={refresh}
          style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', color: 'var(--text-secondary)', borderRadius: '7px', padding: '5px 11px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
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
              <MajorCard key={coin.symbol} coin={coin} onOpen={onOpenAsset} />
            ))}
      </div>

      {/* ---------- ROW 2: market status + watchlist ---------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)', gap: '11px' }} className="cmc-two-col">

        <DashPanel
          title="Market Status"
          subtitle="Ringkasan kondisi pasar global"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: '15px', alignItems: 'start' }}>

            {/* Fear & Greed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>Fear &amp; Greed</span>
              <FearGreedGauge score={fng?.score} label={fng?.classification} size={124} />
              {fng?.source && (
                <span style={{ fontSize: '8.5px', color: 'var(--text-muted)', textAlign: 'center' }}>
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
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>Koin Aktif</span>
                <span style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {global?.activeCryptocurrencies?.toLocaleString('id-ID') ?? DASH}
                </span>
              </div>
            </div>

            {/* Altcoin season + dominance */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>Altcoin Season</span>
                  <strong style={{ fontSize: '19px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {season?.value ?? DASH}
                  </strong>
                </div>
                <AltcoinSeasonScale value={season?.value} dialConfigs={season?.dialConfigs} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>Dominasi</span>
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
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}
              >
                Kosongkan
              </button>
            ) : null
          }
        >
          {watched.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '26px 12px', textAlign: 'center' }}>
              <span style={{ fontSize: '22px', opacity: 0.5 }}>☆</span>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
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
                    onClick={() => onOpenAsset && onOpenAsset(item.symbol, item.symbol)}
                    style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 8px', borderRadius: '7px', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-panel-subtle)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <StarButton symbol={item.symbol} market={item.market} watchlist={watchlist} size={13} />
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.symbol}
                    </span>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {price === undefined || price === null ? DASH : formatPrice(price)}
                    </span>
                    <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: changeColor(change), minWidth: '54px', textAlign: 'right' }}>
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
          title="Crypto Market Cap"
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
                      border: 'none', borderRadius: '4px', padding: '3px 9px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
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
                      border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
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
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)' }}>Open Interest Terbesar</span>
              {(deriv?.topByOpenInterest || []).map(a => (
                <div key={a.symbol} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '11px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{a.symbol}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{formatUsdCompact(a.openInterestUsd)}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: changeColor(a.funding), minWidth: '52px', textAlign: 'right' }}>
                    {a.funding === null || a.funding === undefined ? DASH : `${(a.funding * 100).toFixed(4)}%`}
                  </span>
                </div>
              ))}
              {(!deriv || !deriv.topByOpenInterest?.length) && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Data derivatif belum tersedia</span>
              )}
            </div>
          </div>
        </DashPanel>
      </div>

      {/* ---------- ROW 4: coin table + trending ---------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 1fr)', gap: '11px' }} className="cmc-two-col">

        <DashPanel
          title="Semua Koin"
          right={
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari koin..."
              style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', borderRadius: '6px', padding: '4px 9px', fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', width: '150px' }}
            />
          }
        >
          <div style={{ overflowX: 'auto', maxHeight: '430px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 2, color: 'var(--text-muted)', fontSize: '10px' }}>
                  <th style={{ textAlign: 'left', padding: '6px 5px', fontWeight: 700, width: '30px' }}>#</th>
                  <th style={{ textAlign: 'left', padding: '6px 5px', fontWeight: 700 }}>Nama</th>
                  <th style={{ textAlign: 'right', padding: '6px 5px', fontWeight: 700 }}>Harga</th>
                  <th style={{ textAlign: 'right', padding: '6px 5px', fontWeight: 700 }}>1j %</th>
                  <th style={{ textAlign: 'right', padding: '6px 5px', fontWeight: 700 }}>24j %</th>
                  <th style={{ textAlign: 'right', padding: '6px 5px', fontWeight: 700 }}>7h %</th>
                  <th style={{ textAlign: 'right', padding: '6px 5px', fontWeight: 700 }}>Market Cap</th>
                  <th style={{ textAlign: 'right', padding: '6px 5px', fontWeight: 700 }}>Volume (24j)</th>
                  <th style={{ textAlign: 'right', padding: '6px 5px', fontWeight: 700 }}>Sirkulasi</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoins.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => onOpenAsset && onOpenAsset(c.symbol, `${c.symbol}USDT`)}
                    style={{ borderTop: 'var(--border-hairline)', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-panel-subtle)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '7px 5px', color: 'var(--text-muted)' }}>{c.rank ?? DASH}</td>
                    <td style={{ padding: '7px 5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                        <StarButton symbol={c.symbol} market="CRYPTO" watchlist={watchlist} />
                        <CryptoIcon symbol={c.symbol} size={17} />
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{c.name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>{c.symbol}</span>
                      </div>
                    </td>
                    <td style={{ padding: '7px 5px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{formatPrice(c.price)}</td>
                    <td style={{ padding: '7px 5px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: changeColor(c.change1h) }}>{formatPct(c.change1h)}</td>
                    <td style={{ padding: '7px 5px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: changeColor(c.change24h) }}>{formatPct(c.change24h)}</td>
                    <td style={{ padding: '7px 5px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: changeColor(c.change7d) }}>{formatPct(c.change7d)}</td>
                    <td style={{ padding: '7px 5px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{formatUsdCompact(c.marketCap)}</td>
                    <td style={{ padding: '7px 5px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{formatUsdCompact(c.volume24h)}</td>
                    <td style={{ padding: '7px 5px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {c.circulatingSupply ? `${(c.circulatingSupply / 1e6).toFixed(2)}M` : DASH}
                    </td>
                  </tr>
                ))}
                {filteredCoins.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding: '26px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {loading ? 'Memuat data koin...' : 'Tidak ada koin yang cocok.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DashPanel>

        <DashPanel title="Trending" subtitle="Paling banyak dicari hari ini">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {trending.slice(0, 8).map((t, i) => (
              <div
                key={`${t.symbol}-${i}`}
                onClick={() => onOpenAsset && onOpenAsset(t.symbol, `${t.symbol}USDT`)}
                style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 6px', borderRadius: '7px', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-panel-subtle)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: '13px' }}>{i + 1}</span>
                <StarButton symbol={t.symbol} market="CRYPTO" watchlist={watchlist} size={13} />
                <CryptoIcon symbol={t.symbol} size={16} />
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.symbol}</span>
                  <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{formatPrice(t.price)}</span>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: changeColor(t.change24h) }}>{formatPct(t.change24h)}</span>
                </div>
              </div>
            ))}
            {trending.length === 0 && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '18px 6px', textAlign: 'center' }}>
                {loading ? 'Memuat...' : 'Data trending belum tersedia'}
              </span>
            )}
          </div>
        </DashPanel>
      </div>

      {/* ---------- FOOTER: honest disclosure of what is NOT shown ---------- */}
      <div className="telemetry-panel" style={{ padding: '9px 13px', borderRadius: '9px', fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
        <strong style={{ color: 'var(--text-secondary)' }}>Sumber data:</strong> CoinMarketCap Data API (market cap, dominasi, tabel koin, trending, altcoin season) ·
        Binance Vision (harga &amp; grafik koin utama) · Hyperliquid (open interest &amp; funding) · alternative.me (Fear &amp; Greed).
        <br />
        <strong style={{ color: 'var(--text-secondary)' }}>Tidak ditampilkan:</strong> ETF Flows, Likuidasi 24 Jam, dan Community Posts — belum ada sumber data publik gratis,
        jadi panel tersebut dikosongkan daripada diisi angka perkiraan.
      </div>
    </div>
  );
}
