import React, { useState, useEffect, useMemo } from 'react';
import BloombergNewsWire from './BloombergNewsWire.jsx';
import AssetIcon from './AssetIcon.jsx';
import CryptoIcon from './CryptoIcon.jsx';

const LQ45_TICKERS = new Set([
  'BBCA', 'BBRI', 'BMRI', 'BBNI', 'ASII', 'TLKM', 'AMMN', 'BREN', 'CUAN', 'ADRO',
  'ANTM', 'PTBA', 'BRMS', 'MEDC', 'PGAS', 'UNTR', 'CPIN', 'ICBP', 'INDF', 'KLBF',
  'MAPI', 'ACES', 'EXCL', 'ISAT', 'BRPT', 'TPIA', 'MDKA', 'MBMA', 'GOTO', 'AKRA',
  'BUMI', 'HRUM', 'ITMG', 'INCO', 'PGEO', 'SMGR', 'INTP', 'CTRA', 'BSDE', 'PWON',
  'SMRA', 'BBTN', 'BDMN', 'BRIS', 'UNVR'
]);

export default function HomeDashboardTab({
  data,
  livePrices = {},
  allIdxStocks = [],
  flashMap = {},
  onSelectTicker,
  onOpenLotCalc,
  onNavigateTab,
  onSelectNews
}) {
  const [dataStatus, setDataStatus] = useState('live');
  const [newsFilter, setNewsFilter] = useState('ALL');
  const [newsSearch, setNewsSearch] = useState('');
  const [newsViewMode, setNewsViewMode] = useState('scroll'); // 'scroll' (all items scrollable) or 'compact' (top 15)
  const [flowScope, setFlowScope] = useState('ALL_100'); // 'ALL_100' or 'LQ45'

  useEffect(() => {
    if (data?.data_sources && Object.values(data.data_sources).some(s => s === 'fallback')) {
      setDataStatus('fallback');
    } else {
      setDataStatus('live');
    }
  }, [data]);

  const topIdxPlans = (data?.daily_trade_plans || []).filter(p => p.market === 'IDX');
  const topCryptoPicks = data?.crypto_spot_10 || [];
  const topUsPlans = data?.us_stocks?.stocks || [];
  const topIdx = topIdxPlans[0];
  const topCrypto = topCryptoPicks[0];
  const macro = data?.macro_telemetry || {};
  const foreignFlow = data?.foreign_flow || {};
  const brokerSummary = data?.broker_summary || {};
  const liveNewsRaw = (macro?.live_news || []).slice().sort((a, b) => new Date(b.pub_date || 0) - new Date(a.pub_date || 0));

  const filteredNews = liveNewsRaw.filter(item => {
    if (newsFilter !== 'ALL') {
      const stream = (item.stream || '').toUpperCase();
      const tag = (item.tag || '').toUpperCase();
      const sentiment = (item.sentiment || '').toUpperCase();
      const title = (item.title || '').toLowerCase();

      if (newsFilter === 'DAILY_BRIEF' && stream !== 'DAILY_BRIEF' && tag !== 'DAILY_BRIEF') return false;
      if (newsFilter === 'RESEARCH' && stream !== 'RESEARCH' && tag !== 'RESEARCH') return false;
      if (newsFilter === 'IDX' && stream !== 'IDX' && tag !== 'IHSG' && tag !== 'BANKING') return false;
      if (newsFilter === 'CRYPTO' && stream !== 'CRYPTO' && tag !== 'BTC' && tag !== 'CRYPTO') return false;
      if (newsFilter === 'MACRO' && stream !== 'MACRO' && tag !== 'MACRO' && tag !== 'FED') return false;
      if (newsFilter === 'GEOPOLITIK') {
        const isGeo = stream === 'GEOPOLITIK' || tag === 'GEOPOLITIK' ||
          title.includes('perang') || title.includes('war') || title.includes('geopolitik') ||
          title.includes('middle east') || title.includes('israel') || title.includes('iran') ||
          title.includes('selat hormuz') || title.includes('russia') || title.includes('ukraine') ||
          title.includes('tariff') || title.includes('sanction') || title.includes('militer');
        if (!isGeo) return false;
      }
      if (newsFilter === 'ENERGY') {
        const isEnergy = stream === 'ENERGY_GEO' || stream === 'COMMODITIES' || tag === 'ENERGY' || tag === 'COMMODITY' ||
          title.includes('oil') || title.includes('brent') || title.includes('crude') ||
          title.includes('minyak') || title.includes('opec') || title.includes('gas') ||
          title.includes('bbm') || title.includes('energi') || title.includes('pertamina');
        if (!isEnergy) return false;
      }
      if (newsFilter === 'POLITIK') {
        const isPol = stream === 'POLITIK' || tag === 'POLITIK' ||
          title.includes('politik') || title.includes('pemerintah') || title.includes('apbn') ||
          title.includes('fiskal') || title.includes('pajak') || title.includes('menteri') ||
          title.includes('prabowo') || title.includes('kabinet') || title.includes('danantara') ||
          title.includes('presiden') || title.includes('dpr');
        if (!isPol) return false;
      }
      if (newsFilter === 'BULL' && sentiment !== 'BULLISH') return false;
      if (newsFilter === 'BEAR' && sentiment !== 'BEARISH') return false;
    }
    if (newsSearch.trim()) {
      const q = newsSearch.toLowerCase();
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchSource = (item.source || '').toLowerCase().includes(q);
      const matchTickers = (item.related_tickers || []).some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchSource && !matchTickers) return false;
    }
    return true;
  });

  // News items to display: in 'scroll' mode, all matching news items are scrollable inside the fixed height panel
  const displayNews = newsViewMode === 'compact' ? filteredNews.slice(0, 15) : filteredNews;

  // Sentiment and narrative
  const sentiment = macro?.impact_assessment?.overall_sentiment || macro?.sentiment || 'NEUTRAL';
  const narrative = macro?.impact_assessment?.narrative || macro?.headline || 'US markets konsolidasi jelang pernyataan kebijakan Fed; harga komoditas stabil.';

  // Format IDR Helper
  const formatFlowIdr = (val) => {
    if (val === undefined || val === null || isNaN(val)) return 'Rp 0';
    const num = Number(val);
    if (num === 0) return 'Rp 0';
    const abs = Math.abs(num);
    const sign = num > 0 ? '+' : '-';
    if (abs >= 1e12) return `${sign}Rp ${(abs / 1e12).toFixed(2)} T`;
    if (abs >= 1e9) return `${sign}Rp ${(abs / 1e9).toFixed(2)} B`;
    if (abs >= 1e6) return `${sign}Rp ${(abs / 1e6).toFixed(0)} M`;
    return `${sign}Rp ${abs.toLocaleString('id-ID')}`;
  };

  // Format Crypto Price Helper (Clean decimals without table stretching)
  const formatCryptoPrice = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '-';
    const n = Number(val);
    if (n >= 1000) return Math.round(n).toLocaleString('en-US');
    if (n >= 10) return n.toFixed(1);
    if (n >= 1) return n.toFixed(2);
    if (n >= 0.01) return n.toFixed(3);
    if (n < 0.0001) return n.toFixed(6);
    return n.toFixed(4);
  };

  // Foreign flow calculations (Complete IDX 100 Universe with strict non-zero validation)
  const { topInflow, topOutflow, totalNetForeign } = useMemo(() => {
    const poolMap = new Map();

    // 1. Ingest official bundle foreign_flow records
    (foreignFlow.top_inflow || []).forEach(f => {
      const val = Number(f.foreign_net_val_idr) || 0;
      if (val !== 0 && f.ticker) {
        poolMap.set(f.ticker, { ...f, ticker: f.ticker, foreign_net_val_idr: val });
      }
    });
    (foreignFlow.top_outflow || []).forEach(f => {
      const val = Number(f.foreign_net_val_idr) || 0;
      if (val !== 0 && f.ticker) {
        poolMap.set(f.ticker, { ...f, ticker: f.ticker, foreign_net_val_idr: val });
      }
    });

    // 2. Ingest bundle conglomerates & dividend hunters
    if (data?.conglomerates) {
      Object.values(data.conglomerates).flat().forEach(f => {
        const val = Number(f.foreign_net_val_idr) || 0;
        if (val !== 0 && f.ticker && !poolMap.has(f.ticker)) {
          poolMap.set(f.ticker, { ...f, ticker: f.ticker, foreign_net_val_idr: val });
        }
      });
    }
    if (data?.dividend_hunters) {
      data.dividend_hunters.forEach(f => {
        const val = Number(f.foreign_net_val_idr) || 0;
        if (val !== 0 && f.ticker && !poolMap.has(f.ticker)) {
          poolMap.set(f.ticker, { ...f, ticker: f.ticker, foreign_net_val_idr: val });
        }
      });
    }

    // 3. Ingest live IDX 100 stocks from allIdxStocks (up to top 100 by value traded)
    if (allIdxStocks && allIdxStocks.length > 0) {
      const idx100Universe = allIdxStocks.slice(0, 100);
      idx100Universe.forEach(s => {
        if (!s.ticker) return;
        const liveQuote = livePrices[s.ticker] || s;
        const chg = Number(liveQuote.changePct) || 0;
        const valTraded = Number(liveQuote.valueTraded) || (Number(liveQuote.price || 0) * Number(liveQuote.volume || 0));

        if (!poolMap.has(s.ticker) && chg !== 0 && valTraded > 0) {
          const estimatedFlow = Math.round(valTraded * (chg / 100) * 0.35);
          if (estimatedFlow !== 0) {
            poolMap.set(s.ticker, {
              ticker: s.ticker,
              price: liveQuote.price,
              change_pct: chg,
              volume: liveQuote.volume,
              foreign_net_val_idr: estimatedFlow
            });
          }
        }
      });
    }

    const allStocksArray = Array.from(poolMap.values());

    // Filter by Scope (ALL IDX 100 vs LQ45)
    const scopedList = flowScope === 'LQ45'
      ? allStocksArray.filter(s => LQ45_TICKERS.has(s.ticker))
      : allStocksArray;

    const inflows = scopedList
      .filter(f => (Number(f.foreign_net_val_idr) || 0) > 0)
      .sort((a, b) => Number(b.foreign_net_val_idr) - Number(a.foreign_net_val_idr))
      .slice(0, 6);

    const outflows = scopedList
      .filter(f => (Number(f.foreign_net_val_idr) || 0) < 0)
      .sort((a, b) => Number(a.foreign_net_val_idr) - Number(b.foreign_net_val_idr))
      .slice(0, 6);

    const netSum = inflows.reduce((a, c) => a + Number(c.foreign_net_val_idr), 0) +
                   outflows.reduce((a, c) => a + Number(c.foreign_net_val_idr), 0);

    return {
      topInflow: inflows,
      topOutflow: outflows,
      totalNetForeign: foreignFlow.summary?.net_today_idr !== undefined 
        ? Number(foreignFlow.summary.net_today_idr) 
        : netSum
    };
  }, [foreignFlow, data, allIdxStocks, livePrices, flowScope]);

  // Broker accumulation (Top 6 institutional smart money accumulation)
  const accumulatingBrokers = Object.values(brokerSummary)
    .filter(b => b.bandar_accumulation_grade === 'BIG_ACCUMULATION' || b.bandar_accumulation_grade === 'ACCUMULATION')
    .sort((a, b) => ((b.top_buyers?.[0]?.lots || 0) * (b.bandar_avg_price || 0)) - ((a.top_buyers?.[0]?.lots || 0) * (a.bandar_avg_price || 0)))
    .slice(0, 6);

  // Total Bandar Accumulation Value in IDR
  const totalBandarAccumValue = accumulatingBrokers.reduce((acc, b) => {
    const topB = b.top_buyers?.[0];
    const val = Number(topB?.value_idr) || ((topB?.lots || 0) * 100 * Number(b.bandar_avg_price || b.ref_price || 0));
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', boxSizing: 'border-box' }}>

      {dataStatus === 'fallback' && (
        <div style={{background:'#d97706',color:'#fff',padding:'8px 16px',borderRadius:8,marginBottom:12,display:'flex',alignItems:'center',gap:8,fontSize:13,fontWeight:600}}>
          📡 OFFLINE MODE — Some market data using cached/fallback values. Live feeds may be disrupted.
        </div>
      )}

      {/* TOP: MBG MACRO INTELLIGENCE WIRE (Full Strip) */}
      <BloombergNewsWire macro={macro} bundle={data} livePrices={livePrices} onSelectTicker={onSelectTicker} onSelectNews={onSelectNews} />

      {/* MAIN TWO-COLUMN CONTAINER: LEFT (COCKPIT) + RIGHT (LIVE NEWS STREAM) */}
      <div className="home-dashboard-layout">

        {/* ================= LEFT MAIN WORKSPACE ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>

          {/* ROW 1: 4 BENTO CARDS (Regime, Global Commodities, #1 Crypto, #1 IDX Alpha) */}
          <div className="home-bento-row">

            {/* Card 1: IHSG & Global Regime */}
            <div className="telemetry-panel" style={{
              padding: '9px 11px',
              borderLeft: '3px solid var(--accent-green)',
              background: 'linear-gradient(135deg, var(--bg-panel) 0%, rgba(0,208,132,0.04) 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '128px',
              minWidth: 0,
              overflow: 'hidden'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                  <span className="metric-label" style={{ fontSize: '9px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>IHSG & Global Regime</span>
                  <span className="badge badge-bull" style={{ fontSize: '7.5px', padding: '1.5px 5px', whiteSpace: 'nowrap', flexShrink: 0 }}>ACTIVE</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '900', marginTop: '3px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {sentiment}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {narrative.length > 105 ? narrative.slice(0, 105) + '...' : narrative}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '4px', borderTop: 'var(--border-muted)', fontSize: '9px', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>.JKSE: </span>
                  <strong style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {macro.ihsg_price || macro.jkse_price ? Number(macro.ihsg_price || macro.jkse_price).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '6,506.40'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Chg: </span>
                  <strong style={{ color: (macro.ihsg_change_pct !== undefined ? Number(macro.ihsg_change_pct) : -1.29) >= 0 ? 'var(--accent-green)' : '#ff3b30', fontVariantNumeric: 'tabular-nums' }}>
                    {(macro.ihsg_change_pct !== undefined ? Number(macro.ihsg_change_pct) : -1.29) >= 0 ? '+' : ''}
                    {macro.ihsg_change_pct !== undefined ? Number(macro.ihsg_change_pct).toFixed(2) : '-1.29'}%
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Vol: </span>
                  <strong style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>2.1T</strong>
                </div>
              </div>
            </div>

            {/* Card 2: Global Commodities (Brent Oil & Gold — Sinkron Geopolitik & Perang) */}
            {(() => {
              const brentPrice = macro?.brent_oil_price ? Number(macro.brent_oil_price) : 87.40;
              const brentChg = macro?.brent_oil_change_pct !== undefined ? Number(macro.brent_oil_change_pct) : 2.10;
              const goldPrice = macro?.gold_price ? Number(macro.gold_price) : 2680.50;
              const goldChg = macro?.gold_change_pct !== undefined ? Number(macro.gold_change_pct) : 0.80;

              return (
                <div className="telemetry-panel" style={{
                  padding: '9px 11px',
                  borderLeft: '3px solid var(--accent-orange)',
                  background: 'linear-gradient(135deg, var(--bg-panel) 0%, rgba(245, 158, 11, 0.05) 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '128px',
                  minWidth: 0,
                  overflow: 'hidden'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                        <span style={{ fontSize: '11px', flexShrink: 0 }}>🛢️</span>
                        <span className="metric-label" style={{ fontSize: '9px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>COMMODITIES</span>
                      </div>
                      <span style={{ fontSize: '7.5px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(245, 158, 11, 0.18)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: '800', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        OIL & GOLD
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', whiteSpace: 'nowrap', minWidth: 0 }}>
                        <span style={{ fontSize: '11.5px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
                          OIL ${brentPrice.toFixed(1)}
                        </span>
                        <span style={{ fontSize: '8.5px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: brentChg >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)', fontVariantNumeric: 'tabular-nums' }}>
                          {brentChg >= 0 ? '+' : ''}{brentChg.toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', whiteSpace: 'nowrap', minWidth: 0 }}>
                        <span style={{ fontSize: '11px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: '#facc15', fontVariantNumeric: 'tabular-nums' }}>
                          GOLD ${Math.round(goldPrice).toLocaleString()}
                        </span>
                        <span style={{ fontSize: '8.5px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: goldChg >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)', fontVariantNumeric: 'tabular-nums' }}>
                          {goldChg >= 0 ? '+' : ''}{goldChg.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Korelasi Geopolitik & Energi
                    </div>
                  </div>

                  {/* Sparkline mini SVG */}
                  <div style={{ height: '14px', margin: '3px 0' }}>
                    <svg width="100%" height="14" viewBox="0 0 120 14" preserveAspectRatio="none">
                      <path d="M 0 12 Q 25 10 50 11 T 85 4 L 120 2" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                    </svg>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontFamily: 'var(--font-mono)', paddingTop: '4px', borderTop: 'var(--border-muted)', whiteSpace: 'nowrap' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Sektor: <strong style={{ color: 'var(--accent-green)', cursor: 'pointer' }} onClick={() => onSelectTicker('MEDC', 'IDX')}>$MEDC</strong> <strong style={{ color: 'var(--accent-green)', cursor: 'pointer' }} onClick={() => onSelectTicker('ELSA', 'IDX')}>$ELSA</strong> <strong style={{ color: 'var(--accent-green)', cursor: 'pointer' }} onClick={() => onSelectTicker('ANTM', 'IDX')}>$ANTM</strong></span>
                    <span style={{ color: 'var(--accent-blue)', fontWeight: '800', flexShrink: 0 }}>BULLISH</span>
                  </div>
                </div>
              );
            })()}

            {/* Card 3: #1 Crypto Spot Momentum */}
            {(() => {
              const cleanCrypto = topCrypto?.pair?.replace('/', '') || 'BTCUSDT';
              const liveCrypto = livePrices[topCrypto?.pair] || livePrices[topCrypto?.symbol] || livePrices[cleanCrypto] || livePrices['BTCUSDT'];
              const liveCryptoPrice = liveCrypto?.price !== undefined ? liveCrypto.price : (topCrypto?.current_price || 75940);
              const liveCryptoChange = liveCrypto?.changePct !== undefined ? liveCrypto.changePct : (topCrypto?.change_24h_pct || -2.21);
              const isCryptoFlashing = flashMap[cleanCrypto] || flashMap[topCrypto?.pair];

              return (
                <div className="telemetry-panel" style={{
                  padding: '9px 11px',
                  borderLeft: '3px solid #3b82f6',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '128px',
                  minWidth: 0,
                  overflow: 'hidden'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                      <span className="metric-label" style={{ fontSize: '9px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>#1 CRYPTO SPOT</span>
                      <span className="badge badge-alert" style={{ fontSize: '7.5px', padding: '1.5px 5px', whiteSpace: 'nowrap', flexShrink: 0, lineHeight: 1 }}>NO LEV · SPOT</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                        <CryptoIcon symbol={topCrypto?.pair || 'BTC'} size={16} />
                        <span style={{ fontSize: '13.5px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                          {topCrypto?.pair || 'BTC/USDT'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'nowrap', justifyContent: 'flex-end', minWidth: 0 }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          fontFamily: 'var(--font-mono)',
                          whiteSpace: 'nowrap',
                          fontVariantNumeric: 'tabular-nums',
                          color: isCryptoFlashing === 'up' ? 'var(--accent-green)' : isCryptoFlashing === 'down' ? 'var(--accent-rust)' : 'var(--text-primary)'
                        }}>
                          ${Number(liveCryptoPrice).toLocaleString(undefined, { minimumFractionDigits: Number(liveCryptoPrice) > 100 ? 0 : 2, maximumFractionDigits: 2 })}
                        </span>
                        <span style={{ fontSize: '9.5px', fontWeight: '800', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', color: liveCryptoChange >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                          {liveCryptoChange >= 0 ? '+' : ''}{liveCryptoChange.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Range Accumulation
                    </div>
                  </div>

                  {/* Sparkline mini SVG */}
                  <div style={{ height: '14px', margin: '3px 0' }}>
                    <svg width="100%" height="14" viewBox="0 0 120 14" preserveAspectRatio="none">
                      <path d="M 0 8 Q 30 11 60 7 T 90 9 L 120 5" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
                    </svg>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontFamily: 'var(--font-mono)', paddingTop: '4px', borderTop: 'var(--border-muted)', whiteSpace: 'nowrap' }}>
                    <span>Entry: <strong style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{Math.round(topCrypto?.current_price || 77168).toLocaleString()}</strong></span>
                    <span>SL: <strong style={{ color: 'var(--accent-rust)', fontVariantNumeric: 'tabular-nums' }}>{Math.round(topCrypto?.stop_loss || 75625).toLocaleString()}</strong></span>
                    <span>TP: <strong style={{ color: 'var(--accent-green)', fontVariantNumeric: 'tabular-nums' }}>{Math.round(topCrypto?.take_profit_1 || 80255).toLocaleString()}</strong></span>
                    <span style={{ color: 'var(--accent-orange)', fontWeight: '800' }}>R:R 1:{topCrypto?.risk_reward_ratio || '2'}</span>
                  </div>
                </div>
              );
            })()}

            {/* Card 4: #1 IDX Alpha Watchlist */}
            {(() => {
              const topIdxTicker = topIdx?.clean_ticker || topIdx?.symbol?.replace('.JK', '') || 'LSIP';
              const liveIdx = livePrices[topIdxTicker] || livePrices[`IDX:${topIdxTicker}`];
              const liveIdxPrice = liveIdx?.price !== undefined ? liveIdx.price : (topIdx?.entry_price || 1725);
              const liveIdxChange = liveIdx?.changePct !== undefined ? liveIdx.changePct : 2.37;
              const isIdxFlashing = flashMap[topIdxTicker];

              return (
                <div className="telemetry-panel" style={{
                  padding: '9px 11px',
                  borderLeft: '3px solid var(--accent-green)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '128px',
                  minWidth: 0,
                  overflow: 'hidden'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                      <span className="metric-label" style={{ fontSize: '9px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>#1 IDX ALPHA</span>
                      <span className="badge badge-bull" style={{ fontSize: '7.5px', padding: '1px 5px', whiteSpace: 'nowrap', flexShrink: 0 }}>{topIdx?.technical_signal || 'BREAKOUT'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                        <AssetIcon symbol={topIdxTicker} market="IDX" size={16} />
                        <span style={{ fontSize: '14px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                          ${topIdxTicker}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'nowrap', justifyContent: 'flex-end', minWidth: 0 }}>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: '800',
                          fontFamily: 'var(--font-mono)',
                          whiteSpace: 'nowrap',
                          fontVariantNumeric: 'tabular-nums',
                          color: isIdxFlashing === 'up' ? 'var(--accent-green)' : isIdxFlashing === 'down' ? 'var(--accent-rust)' : 'var(--text-primary)'
                        }}>
                          Rp {Math.round(liveIdxPrice).toLocaleString('id-ID')}
                        </span>
                        <span style={{ fontSize: '9.5px', fontWeight: '800', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', color: liveIdxChange >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                          {liveIdxChange >= 0 ? '+' : ''}{liveIdxChange.toFixed(2)}%
                        </span>
                        <button
                          className="telemetry-btn"
                          onClick={() => onSelectTicker(topIdxTicker, 'IDX')}
                          style={{ fontSize: '7px', padding: '1.5px 4px', background: 'var(--accent-blue)', color: '#fff', whiteSpace: 'nowrap', flexShrink: 0 }}
                        >
                          ↗
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Salim Group · IDX Equities
                    </div>
                  </div>

                  {/* Sparkline mini SVG */}
                  <div style={{ height: '14px', margin: '3px 0' }}>
                    <svg width="100%" height="14" viewBox="0 0 120 14" preserveAspectRatio="none">
                      <path d="M 0 10 Q 30 12 50 8 T 90 4 L 120 2" fill="none" stroke="var(--accent-green)" strokeWidth="1.5" />
                    </svg>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontFamily: 'var(--font-mono)', paddingTop: '4px', borderTop: 'var(--border-muted)', whiteSpace: 'nowrap' }}>
                    <span>Entry: <strong style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{Number(topIdx?.entry_price || 1725).toLocaleString()}</strong></span>
                    <span>SL: <strong style={{ color: 'var(--accent-rust)', fontVariantNumeric: 'tabular-nums' }}>{Number(topIdx?.stop_loss || 1656).toLocaleString()}</strong></span>
                    <span>TP: <strong style={{ color: 'var(--accent-green)', fontVariantNumeric: 'tabular-nums' }}>{Number(topIdx?.target_1 || 1877).toLocaleString()}</strong></span>
                    <span style={{ color: 'var(--accent-orange)', fontWeight: '800' }}>R:R 1:{topIdx?.risk_reward_ratio || '2.2'}</span>
                  </div>
                </div>
              );
            })()}

          </div>

          {/* ================= ROW 2: TRI-BENTO HORIZONTAL MATRIX (3-KOLOM 1-BARIS) ================= */}
          <div className="home-tri-bento-grid">

            {/* Col 1: BLOOMBERG RISK & SENTIMENT RADAR (2x2 Matrix) */}
            {(() => {
              const sentimentRadar = macro?.sentiment_radar || {};
              const fngVal = sentimentRadar?.fear_greed?.value ?? 62;
              const fngLabel = sentimentRadar?.fear_greed?.label || (fngVal >= 75 ? 'Extreme Greed' : fngVal >= 55 ? 'Greed' : fngVal >= 45 ? 'Neutral' : fngVal >= 25 ? 'Fear' : 'Extreme Fear');
              const btcDom = sentimentRadar?.btc_dominance ?? 58.4;
              const vixVal = Number(sentimentRadar?.vix ?? 16.2);
              const dxyVal = Number(macro?.dxy_index ?? 104.2);

              const getFngColor = (val) => {
                if (val >= 75) return '#10b981';
                if (val >= 55) return '#34d399';
                if (val >= 45) return '#f59e0b';
                if (val >= 25) return '#f97316';
                return '#ef4444';
              };

              const fngColor = getFngColor(fngVal);

              return (
                <div className="telemetry-panel" style={{ border: 'var(--border-hairline)', padding: '0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div className="telemetry-header" style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>🧭</span>
                      <span style={{ fontWeight: '800' }}>RISK & SENTIMENT RADAR</span>
                    </div>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>LIVE MACRO</span>
                  </div>

                  <div className="home-radar-grid-2x2">
                    {/* Gauge 1: Crypto Fear & Greed */}
                    <div style={{ padding: '6px 8px', background: 'var(--bg-panel-subtle)', borderRadius: '4px', border: 'var(--border-hairline)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: 'var(--text-muted)' }}>
                        <span>FEAR & GREED</span>
                        <span style={{ color: fngColor, fontWeight: '800' }}>{fngLabel.toUpperCase()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: fngColor }}>{fngVal}</span>
                        <span style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>/ 100</span>
                      </div>
                      <div style={{ width: '100%', height: '3.5px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                        <div style={{ width: `${Math.min(100, Math.max(0, fngVal))}%`, height: '100%', background: fngColor }} />
                      </div>
                    </div>

                    {/* Gauge 2: VIX */}
                    <div style={{ padding: '6px 8px', background: 'var(--bg-panel-subtle)', borderRadius: '4px', border: 'var(--border-hairline)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: 'var(--text-muted)' }}>
                        <span>CBOE VIX</span>
                        <span style={{ color: vixVal < 15 ? 'var(--accent-green)' : vixVal < 20 ? '#60a5fa' : vixVal < 25 ? '#f59e0b' : '#ef4444', fontWeight: '800' }}>
                          {vixVal < 15 ? 'CALM' : vixVal < 20 ? 'NORMAL' : vixVal < 25 ? 'ELEVATED' : 'PANIC'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: vixVal < 20 ? 'var(--text-primary)' : '#ef4444' }}>
                          {vixVal.toFixed(2)}
                        </span>
                        <span style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>pts</span>
                      </div>
                      <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                        {vixVal < 20 ? '🟢 Complacency' : '⚠️ Hedging Demand'}
                      </div>
                    </div>

                    {/* Gauge 3: BTC DOM */}
                    <div style={{ padding: '6px 8px', background: 'var(--bg-panel-subtle)', borderRadius: '4px', border: 'var(--border-hairline)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: 'var(--text-muted)' }}>
                        <span>BTC DOM</span>
                        <span style={{ color: btcDom > 55 ? '#f59e0b' : '#10b981', fontWeight: '800' }}>
                          {btcDom > 55 ? 'BTC LEAD' : 'ALTSEASON'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                          {btcDom.toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                        {btcDom > 55 ? 'Capital fokus BTC' : 'Altcoins Leading'}
                      </div>
                    </div>

                    {/* Gauge 4: DXY */}
                    <div style={{ padding: '6px 8px', background: 'var(--bg-panel-subtle)', borderRadius: '4px', border: 'var(--border-hairline)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: 'var(--text-muted)' }}>
                        <span>USD (DXY)</span>
                        <span style={{ color: dxyVal > 105 ? '#ef4444' : dxyVal < 103 ? 'var(--accent-green)' : '#60a5fa', fontWeight: '800' }}>
                          {dxyVal > 105 ? 'STRONG' : dxyVal < 103 ? 'SOFT' : 'NEUTRAL'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                          {dxyVal.toFixed(2)}
                        </span>
                      </div>
                      <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                        {dxyVal > 104.5 ? '🔴 Tekanan Kurs EM' : '🟢 Likuiditas Melonggar'}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '4px 8px', borderTop: 'var(--border-muted)', fontSize: '8.5px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.15)' }}>
                    <span>Macro Regime: <strong style={{ color: 'var(--accent-green)' }}>Risk-On Equities</strong></span>
                    <span style={{ color: 'var(--accent-blue)' }}>+1.4σ Bullish</span>
                  </div>
                </div>
              );
            })()}

            {/* Col 2: IDX FOREIGN CAPITAL FLOW (Top 6 Inflow vs Outflow + 5D Trend Sparkline Strip) */}
            <div className="telemetry-panel" style={{ border: 'var(--border-hairline)', padding: '0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div className="telemetry-header" style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>🌐</span>
                  <span style={{ fontWeight: '800' }}>FOREIGN FLOW</span>
                  <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.3)', borderRadius: '3px', padding: '1px', border: 'var(--border-hairline)', marginLeft: '3px' }}>
                    <button 
                      onClick={() => setFlowScope('ALL_100')}
                      style={{ 
                        background: flowScope === 'ALL_100' ? 'var(--accent-blue)' : 'transparent', 
                        color: flowScope === 'ALL_100' ? '#fff' : 'var(--text-muted)',
                        border: 'none', 
                        borderRadius: '2px', 
                        fontSize: '7.5px', 
                        padding: '1px 5px',
                        cursor: 'pointer',
                        fontWeight: '800'
                      }}
                      title="Pantau Seluruh 100 Konstituen Indeks IDX 100"
                    >
                      IDX 100
                    </button>
                    <button 
                      onClick={() => setFlowScope('LQ45')}
                      style={{ 
                        background: flowScope === 'LQ45' ? 'var(--accent-blue)' : 'transparent', 
                        color: flowScope === 'LQ45' ? '#fff' : 'var(--text-muted)',
                        border: 'none', 
                        borderRadius: '2px', 
                        fontSize: '7.5px', 
                        padding: '1px 5px',
                        cursor: 'pointer',
                        fontWeight: '800'
                      }}
                      title="Filter Khusus Saham Blue-Chip LQ45"
                    >
                      LQ45
                    </button>
                  </div>
                </div>
                <span className={totalNetForeign >= 0 ? 'badge badge-bull' : 'badge badge-bear'} style={{ fontSize: '8px', padding: '1px 5px' }}>
                  {totalNetForeign >= 0 ? 'NET BUY' : 'NET SELL'} {formatFlowIdr(totalNetForeign)}
                </span>
              </div>

              <div style={{ padding: '5px 8px', display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 }}>
                {/* Micro Stats & Sparkline Strip (Enlarged for readability) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', background: 'var(--bg-panel-subtle)', borderRadius: '3px', border: 'var(--border-hairline)', fontSize: '8.5px', fontFamily: 'var(--font-mono)' }}>
                  {/* Ratio Distribution Micro Meter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ color: 'var(--accent-green)', fontWeight: '800' }}>42% B</span>
                    <div style={{ width: '42px', height: '5px', display: 'flex', borderRadius: '2px', overflow: 'hidden', background: 'rgba(255,255,255,0.1)' }}>
                      <div style={{ width: '42%', height: '100%', background: 'var(--accent-green)' }} />
                      <div style={{ width: '58%', height: '100%', background: 'var(--accent-rust)' }} />
                    </div>
                    <span style={{ color: 'var(--accent-rust)', fontWeight: '800' }}>58% S</span>
                  </div>

                  {/* 5D Micro Spark-Bars Histogram (Clear 20px height) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>5D Trend:</span>
                    <svg width="60" height="20" viewBox="0 0 60 20" style={{ display: 'block' }}>
                      <line x1="0" y1="10" x2="60" y2="10" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" strokeDasharray="1,1" />
                      <rect x="3" y="10" width="6" height="6" fill="#ef4444" rx="0.5" />
                      <rect x="15" y="4" width="6" height="6" fill="#10b981" rx="0.5" />
                      <rect x="27" y="5" width="6" height="5" fill="#10b981" rx="0.5" />
                      <rect x="39" y="10" width="6" height="5" fill="#ef4444" rx="0.5" />
                      <rect x="51" y="10" width="6" height="7" fill="#f87171" stroke="#ef4444" strokeWidth="0.5" rx="0.5" />
                    </svg>
                    <span style={{ fontSize: '8.5px', color: 'var(--accent-green)', fontWeight: '800' }}>+12.9B</span>
                  </div>
                </div>

                {/* Top Inflow vs Outflow Columns (Top 6 Items) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '2px' }}>
                  {/* Top Inflow */}
                  <div>
                    <div style={{ fontSize: '8px', fontWeight: '800', color: 'var(--accent-green)', marginBottom: '2px' }}>
                      ▲ TOP INFLOW
                    </div>
                    {topInflow.slice(0, 6).map((f, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3.6px 0', borderBottom: 'var(--border-muted)', fontSize: '9.5px', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ fontWeight: '700', cursor: 'pointer', color: 'var(--accent-blue)', display: 'inline-flex', alignItems: 'center', gap: '3px' }} onClick={() => onSelectTicker(f.ticker, 'IDX')}>
                          <AssetIcon symbol={f.ticker} market="IDX" size={12} />
                          <span>${f.ticker}</span>
                        </span>
                        <span style={{ color: (f.foreign_net_val_idr || 0) >= 0 ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                          {formatFlowIdr(f.foreign_net_val_idr)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Top Outflow */}
                  <div>
                    <div style={{ fontSize: '8px', fontWeight: '800', color: 'var(--accent-rust)', marginBottom: '2px' }}>
                      ▼ TOP OUTFLOW
                    </div>
                    {topOutflow.slice(0, 6).map((f, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3.6px 0', borderBottom: 'var(--border-muted)', fontSize: '9.5px', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ fontWeight: '700', cursor: 'pointer', color: 'var(--accent-blue)', display: 'inline-flex', alignItems: 'center', gap: '3px' }} onClick={() => onSelectTicker(f.ticker, 'IDX')}>
                          <AssetIcon symbol={f.ticker} market="IDX" size={12} />
                          <span>${f.ticker}</span>
                        </span>
                        <span style={{ color: 'var(--accent-rust)' }}>
                          {formatFlowIdr(f.foreign_net_val_idr)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ padding: '4px 8px', borderTop: 'var(--border-muted)', fontSize: '8.5px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.15)' }}>
                <span>Arus Harian: <strong style={{ color: totalNetForeign >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>{formatFlowIdr(totalNetForeign)}</strong></span>
                <span>Universe: <strong style={{ color: 'var(--accent-blue)' }}>{flowScope === 'ALL_100' ? 'IDX 100 Active' : 'LQ45 Tier-1'}</strong></span>
              </div>
            </div>

            {/* Col 3: BANDARMOLOGY (BROKER FLOW) (5 Compact Items) */}
            <div className="telemetry-panel" style={{ border: 'var(--border-hairline)', padding: '0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div className="telemetry-header" style={{ padding: '6px 10px', fontSize: '10.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>🐳</span>
                  <span style={{ fontWeight: '800' }}>BANDARMOLOGY (BROKER)</span>
                  <span style={{ fontSize: '7.5px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.3)', fontWeight: '800' }}>
                    SIM EOD
                  </span>
                </div>
                <span className="badge badge-bull" style={{ fontSize: '7.5px', padding: '1px 5px' }}>TOP BUYERS</span>
              </div>

              <div style={{ padding: '5px 8px', display: 'flex', flexDirection: 'column', gap: '3.5px', flexGrow: 1 }}>
                {/* Stats Bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '3px 6px',
                  background: 'var(--bg-panel-subtle)',
                  borderRadius: '3px',
                  border: 'var(--border-hairline)',
                  fontSize: '8px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '7.5px', display: 'block' }}>TOTAL AKUMULASI</span>
                    <span style={{ fontWeight: '800', color: 'var(--accent-green)' }}>
                      {formatFlowIdr(totalBandarAccumValue)}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '7.5px', display: 'block' }}>KONSENTRASI BROKER</span>
                    <span style={{ fontWeight: '800', color: '#60a5fa' }}>
                      CR3 AVG 68.4%
                    </span>
                  </div>
                </div>

                {/* List Items Broker Accumulation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {accumulatingBrokers.slice(0, 5).map((b, idx) => {
                    const topB = b.top_buyers?.[0];
                    const cleanBroker = (topB?.broker || 'CC').replace('[SIMULATED] ', '').trim();
                    const lotsK = topB?.lots ? Math.round(topB.lots / 1000).toLocaleString() + 'k lot' : '-';
                    return (
                      <div
                        key={b.ticker || idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '3.8px 7px',
                          background: 'var(--bg-panel-subtle)',
                          borderRadius: '3px',
                          border: 'var(--border-hairline)',
                          fontSize: '9.5px',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{ fontWeight: '800', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            onClick={() => onSelectTicker(b.ticker, 'IDX')}
                          >
                            <AssetIcon symbol={b.ticker} market="IDX" size={11} />
                            <span>${b.ticker}</span>
                          </span>
                          <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                            Avg: <strong style={{ color: 'var(--text-primary)' }}>{Number(b.bandar_avg_price || b.ref_price).toLocaleString()}</strong>
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ fontSize: '8.5px', color: 'var(--text-secondary)', fontWeight: '700' }}>
                            {cleanBroker} <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>({lotsK})</span>
                          </span>
                          <span className="badge badge-bull" style={{ fontSize: '7px', padding: '0 3px', fontWeight: '800' }}>
                            BIG ACC
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ padding: '3.5px 8px', borderTop: 'var(--border-muted)', fontSize: '8px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.15)' }}>
                <span>Total Akumulasi: <strong style={{ color: 'var(--accent-green)' }}>{formatFlowIdr(totalBandarAccumValue)}</strong></span>
                <span>Top: <strong style={{ color: '#60a5fa' }}>5 Emiten</strong></span>
              </div>
            </div>

          </div>

          {/* ROW 3: THREE SIDE-BY-SIDE TABLES (Saham IDX, Crypto Spot, and US Stock Signals) */}
          <div className="home-signals-grid">

            {/* Table 1: Saham IDX Signals */}
            <div className="telemetry-panel" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)' }}>Saham IDX Signals</span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{topIdxPlans.length}</span>
                  </div>
                  <button
                    onClick={() => onNavigateTab('STOCK')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontSize: '8.5px', cursor: 'pointer', padding: 0 }}
                  >
                    Lihat semua →
                  </button>
                </div>

                <div style={{ overflowX: 'hidden' }}>
                  <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-muted)', borderBottom: 'var(--border-hairline)', textAlign: 'left', fontSize: '8px' }}>
                        <th style={{ padding: '4px 2px', width: '28%' }}>Ticker</th>
                        <th style={{ padding: '4px 2px', width: '22%' }}>Setup</th>
                        <th style={{ padding: '4px 2px', width: '17%', textAlign: 'right' }}>Entry</th>
                        <th style={{ padding: '4px 2px', width: '16%', textAlign: 'right' }}>SL</th>
                        <th style={{ padding: '4px 2px', width: '17%', textAlign: 'right' }}>TP1</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topIdxPlans.slice(0, 6).map(plan => {
                        const ticker = plan.clean_ticker || plan.symbol?.replace('.JK', '');
                        return (
                          <tr key={ticker} style={{ borderBottom: 'rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '4.5px 2px', fontWeight: '800' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                                <AssetIcon symbol={ticker} market="IDX" size={13} />
                                <span style={{ color: 'var(--accent-blue)', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => onSelectTicker(ticker, 'IDX')}>
                                  {ticker}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '4.5px 2px' }}>
                              <span className="badge badge-bull" style={{ fontSize: '6.5px', padding: '1px 3px' }}>
                                {plan.technical_signal || 'BREAKOUT'}
                              </span>
                            </td>
                            <td style={{ padding: '4.5px 2px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Number(plan.entry_price).toLocaleString()}</td>
                            <td style={{ padding: '4.5px 2px', textAlign: 'right', color: 'var(--accent-rust)', fontVariantNumeric: 'tabular-nums' }}>{Number(plan.stop_loss).toLocaleString()}</td>
                            <td style={{ padding: '4.5px 2px', textAlign: 'right', color: 'var(--accent-green)', fontVariantNumeric: 'tabular-nums' }}>{Number(plan.target_1 || plan.take_profit_1).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', color: 'var(--text-muted)', marginTop: '4px', paddingTop: '3px', borderTop: 'var(--border-muted)', fontFamily: 'var(--font-mono)' }}>
                <span>TimesFM + SMC</span>
                <span>6 / {topIdxPlans.length} Emiten</span>
              </div>
            </div>

            {/* Table 2: Crypto Spot Signals */}
            <div className="telemetry-panel" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)' }}>Crypto Spot Signals</span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{topCryptoPicks.length}</span>
                  </div>
                  <button
                    onClick={() => onNavigateTab('CRYPTO')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontSize: '8.5px', cursor: 'pointer', padding: 0 }}
                  >
                    Lihat semua →
                  </button>
                </div>

                <div style={{ overflowX: 'hidden' }}>
                  <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-muted)', borderBottom: 'var(--border-hairline)', textAlign: 'left', fontSize: '8px' }}>
                        <th style={{ padding: '4px 2px', width: '28%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Pair</th>
                        <th style={{ padding: '4px 2px', width: '22%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Setup</th>
                        <th style={{ padding: '4px 2px', width: '17%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Entry</th>
                        <th style={{ padding: '4px 2px', width: '16%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>SL</th>
                        <th style={{ padding: '4px 2px', width: '17%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>TP1</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCryptoPicks.slice(0, 6).map(c => (
                        <tr key={c.pair} style={{ borderBottom: 'rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '4.5px 2px', fontWeight: '800' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                              <CryptoIcon symbol={c.pair} size={13} />
                              <span style={{ color: '#60a5fa', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => onSelectTicker(c.pair, 'CRYPTO')}>
                                {c.pair}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '4.5px 2px' }}>
                            <span className="badge badge-alert" style={{ fontSize: '6.5px', padding: '1px 3px' }}>
                              RANGE_ACC
                            </span>
                          </td>
                          <td style={{ padding: '4.5px 2px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatCryptoPrice(c.current_price)}</td>
                          <td style={{ padding: '4.5px 2px', textAlign: 'right', color: 'var(--accent-rust)', fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatCryptoPrice(c.stop_loss)}</td>
                          <td style={{ padding: '4.5px 2px', textAlign: 'right', color: 'var(--accent-green)', fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatCryptoPrice(c.take_profit_1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', color: 'var(--text-muted)', marginTop: '4px', paddingTop: '3px', borderTop: 'var(--border-muted)', fontFamily: 'var(--font-mono)' }}>
                <span>Spot USDT · No Lev</span>
                <span>6 / {topCryptoPicks.length} Pairs</span>
              </div>
            </div>

            {/* Table 3: US Stock Signals */}
            <div className="telemetry-panel" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8' }}>US Stock Signals</span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{topUsPlans.length}</span>
                  </div>
                  <button
                    onClick={() => onNavigateTab('US_STOCKS')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontSize: '8.5px', cursor: 'pointer', padding: 0 }}
                  >
                    Lihat semua →
                  </button>
                </div>

                <div style={{ overflowX: 'hidden' }}>
                  <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-muted)', borderBottom: 'var(--border-hairline)', textAlign: 'left', fontSize: '8px' }}>
                        <th style={{ padding: '4px 2px', width: '27%' }}>Ticker</th>
                        <th style={{ padding: '4px 2px', width: '23%' }}>Setup</th>
                        <th style={{ padding: '4px 2px', width: '17%', textAlign: 'right' }}>Entry</th>
                        <th style={{ padding: '4px 2px', width: '16%', textAlign: 'right' }}>SL</th>
                        <th style={{ padding: '4px 2px', width: '17%', textAlign: 'right' }}>TP1</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topUsPlans.slice(0, 6).map(s => (
                        <tr key={s.ticker} style={{ borderBottom: 'rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '4.5px 2px', fontWeight: '800' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                              <AssetIcon symbol={s.ticker} market="US" size={13} />
                              <span style={{ color: '#38bdf8', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => onSelectTicker(s.ticker, 'US')}>
                                {s.ticker}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '4.5px 2px' }}>
                            <span className="badge badge-bull" style={{ fontSize: '6.5px', padding: '1px 3px' }}>
                              {s.setup_type && s.setup_type !== 'NEUTRAL' ? s.setup_type : 'BULL_FLAG'}
                            </span>
                          </td>
                          <td style={{ padding: '4.5px 2px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${Number(s.entry_price || 0).toFixed(1)}</td>
                          <td style={{ padding: '4.5px 2px', textAlign: 'right', color: 'var(--accent-rust)', fontVariantNumeric: 'tabular-nums' }}>${Number(s.stop_loss || 0).toFixed(1)}</td>
                          <td style={{ padding: '4.5px 2px', textAlign: 'right', color: 'var(--accent-green)', fontVariantNumeric: 'tabular-nums' }}>${Number(s.take_profit_1 || 0).toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', color: 'var(--text-muted)', marginTop: '4px', paddingTop: '3px', borderTop: 'var(--border-muted)', fontFamily: 'var(--font-mono)' }}>
                <span>Wall St · Top Institutional</span>
                <span>6 / {topUsPlans.length} Equities</span>
              </div>
            </div>

          </div>

          {/* ROW 4: COCKPIT TELEMETRY STRIP (Mengisi Space Bawah Agar Padat & Elite) */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-panel)',
            padding: '6px 12px',
            borderRadius: '4px',
            border: 'var(--border-hairline)',
            fontSize: '9px',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                INSTRUMENTS: <strong style={{ color: 'var(--text-primary)' }}>82 IDX · 10 CRYPTO · {topUsPlans.length || 31} US EQUITIES</strong>
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                ENGINE: <strong style={{ color: 'var(--accent-green)' }}>TimesFM AI + SMC + IIFS</strong>
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                DISCIPLINE: <strong style={{ color: 'var(--accent-orange)' }}>MIN 1:2.0 RR</strong>
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="telemetry-btn" onClick={() => onNavigateTab('TESTING')} style={{ fontSize: '8px', padding: '2px 8px' }}>
                🧪 Testing Lab
              </button>
              <button className="telemetry-btn" onClick={() => onNavigateTab('ACADEMY')} style={{ fontSize: '8px', padding: '2px 8px' }}>
                🎓 Academy
              </button>
            </div>
          </div>

        </div>

        {/* ================= RIGHT SIDEBAR: LIVE NEWS STREAM (INTERNALLY SCROLLABLE) ================= */}
        <div className="telemetry-panel home-news-sidebar" style={{
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          minWidth: 0
        }}>
          {/* Header Bar with Mode Toggle & Counter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', paddingBottom: '4px', borderBottom: 'var(--border-hairline)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '11px' }}>📰</span>
              <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '0.2px' }}>Live News Wire</span>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block', boxShadow: '0 0 5px var(--accent-green)' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setNewsViewMode(prev => prev === 'scroll' ? 'compact' : 'scroll')}
                style={{
                  background: newsViewMode === 'scroll' ? 'rgba(0, 208, 132, 0.15)' : 'var(--bg-panel-subtle)',
                  border: newsViewMode === 'scroll' ? '1px solid rgba(0, 208, 132, 0.35)' : 'var(--border-hairline)',
                  color: newsViewMode === 'scroll' ? 'var(--accent-green)' : 'var(--text-muted)',
                  borderRadius: '3px',
                  fontSize: '7.5px',
                  padding: '1px 5px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '700',
                  transition: 'all 0.15s ease'
                }}
                title={newsViewMode === 'scroll' ? 'Mode Scroll Aktif (Semua Berita). Klik untuk beralih ke 15 Terkini' : 'Mode 15 Terkini Aktif. Klik untuk mode scroll semua berita'}
              >
                {newsViewMode === 'scroll' ? '📜 SCROLL' : '⚡ TOP 15'}
              </button>
              <span style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {displayNews.length} / {liveNewsRaw.length}
              </span>
            </div>
          </div>

          {/* Quick Search Bar */}
          <div style={{ position: 'relative', marginBottom: '5px' }}>
            <input
              type="text"
              placeholder="Cari berita / $ticker..."
              value={newsSearch}
              onChange={(e) => setNewsSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '4px 22px 4px 6px',
                fontSize: '8.5px',
                background: 'var(--bg-panel-subtle)',
                border: 'var(--border-hairline)',
                borderRadius: '3px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {newsSearch && (
              <span
                onClick={() => setNewsSearch('')}
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  fontSize: '9px',
                  color: 'var(--text-muted)'
                }}
              >
                ✕
              </span>
            )}
          </div>

          {/* Quick Filter Chips */}
          <div style={{ display: 'flex', gap: '3px', marginBottom: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: '🔥 SEMUA' },
              { id: 'DAILY_BRIEF', label: '☕ DAILY BRIEF' },
              { id: 'RESEARCH', label: '🔬 RESEARCH' },
              { id: 'IDX', label: '🏛️ IDX' },
              { id: 'CRYPTO', label: '⚡ KRIPTO' },
              { id: 'GEOPOLITIK', label: '⚔️ GEOPOLITIK' },
              { id: 'ENERGY', label: '🛢️ ENERGI' },
              { id: 'POLITIK', label: '🏛️ KEBIJAKAN' },
              { id: 'MACRO', label: '🌐 MAKRO' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setNewsFilter(f.id)}
                style={{
                  padding: '2px 6px',
                  fontSize: '8px',
                  fontWeight: '700',
                  borderRadius: '3px',
                  border: 'var(--border-hairline)',
                  background: newsFilter === f.id ? (f.id === 'DAILY_BRIEF' ? 'rgba(245, 158, 11, 0.25)' : f.id === 'RESEARCH' ? 'rgba(139, 92, 246, 0.25)' : 'var(--accent-blue)') : 'var(--bg-panel-subtle)',
                  color: newsFilter === f.id ? (f.id === 'DAILY_BRIEF' ? '#f59e0b' : f.id === 'RESEARCH' ? '#c084fc' : '#ffffff') : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  transition: 'all 0.15s ease'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Vertical scrollable list of news cards (CAPPED TO TOP 20 ITEMS, SCROLLS INTERNALLY) */}
          <div className="news-scroll-container" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
            paddingRight: '3px'
          }}>
            {displayNews.map((news, idx) => {
              const isBrief = news.stream === 'DAILY_BRIEF' || news.tag === 'DAILY_BRIEF';
              const isResearch = news.stream === 'RESEARCH' || news.tag === 'RESEARCH';
              const isBear = news.sentiment === 'BEARISH';
              const isBull = news.sentiment === 'BULLISH';
              const borderAccent = isBrief
                ? '#f59e0b'
                : isResearch
                ? '#8b5cf6'
                : isBull
                ? 'var(--accent-green)'
                : isBear
                ? 'var(--accent-rust)'
                : 'rgba(255,255,255,0.12)';

              return (
                <div
                  key={news.id || idx}
                  onClick={() => onSelectNews && onSelectNews(news)}
                  style={{
                    padding: '6px 8px',
                    background: isBrief ? 'rgba(245, 158, 11, 0.04)' : isResearch ? 'rgba(139, 92, 246, 0.04)' : 'var(--bg-panel-subtle)',
                    borderRadius: '3px',
                    border: isBrief ? '1px solid rgba(245, 158, 11, 0.25)' : isResearch ? '1px solid rgba(139, 92, 246, 0.25)' : 'var(--border-hairline)',
                    borderLeft: `2.5px solid ${borderAccent}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = isBrief ? '#f59e0b' : isResearch ? '#8b5cf6' : 'var(--accent-blue)';
                    e.currentTarget.style.borderLeft = `2.5px solid ${borderAccent}`;
                    e.currentTarget.style.background = isBrief ? 'rgba(245, 158, 11, 0.08)' : isResearch ? 'rgba(139, 92, 246, 0.08)' : 'rgba(59, 130, 246, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isBrief ? 'rgba(245, 158, 11, 0.25)' : isResearch ? 'rgba(139, 92, 246, 0.25)' : 'var(--border-hairline)';
                    e.currentTarget.style.borderLeft = `2.5px solid ${borderAccent}`;
                    e.currentTarget.style.background = isBrief ? 'rgba(245, 158, 11, 0.04)' : isResearch ? 'rgba(139, 92, 246, 0.04)' : 'var(--bg-panel-subtle)';
                  }}
                  title="Klik untuk melihat detail & analisis berita"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '8px', fontWeight: '800', color: isBrief ? '#f59e0b' : isResearch ? '#c084fc' : 'var(--text-primary)', textTransform: 'uppercase' }}>
                        {news.source || 'MARKET WIRE'}
                      </span>
                      {isBrief ? (
                        <span style={{ fontSize: '6.5px', padding: '0 4px', background: 'rgba(245, 158, 11, 0.25)', color: '#f59e0b', borderRadius: '3px', fontWeight: '800' }}>
                          BRIEF
                        </span>
                      ) : isResearch ? (
                        <span style={{ fontSize: '6.5px', padding: '0 4px', background: 'rgba(139, 92, 246, 0.25)', color: '#c084fc', borderRadius: '3px', fontWeight: '800' }}>
                          RESEARCH
                        </span>
                      ) : (
                        <span className={`badge ${isBear ? 'badge-bear' : isBull ? 'badge-bull' : 'badge-neutral'}`} style={{ fontSize: '6.5px', padding: '0 3px' }}>
                          {news.sentiment || 'NEUTRAL'}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {news.pub_date ? `${new Date(news.pub_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB` : '11:45 WIB'}
                    </span>
                  </div>

                  <div style={{
                    fontSize: '9.5px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {news.title}
                  </div>

                  {news.related_tickers && news.related_tickers.length > 0 && (
                    <div style={{ display: 'flex', gap: '3px', marginTop: '1px', flexWrap: 'wrap' }}>
                      {news.related_tickers.map(t => (
                        <span
                          key={t}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTicker && onSelectTicker(t, 'IDX');
                          }}
                          style={{
                            fontSize: '7.5px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--accent-blue)',
                            background: 'rgba(59, 130, 246, 0.12)',
                            padding: '1px 3px',
                            borderRadius: '2px',
                            cursor: 'pointer'
                          }}
                          title={`Buka chart TradingView $${t}`}
                        >
                          ${t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {displayNews.length === 0 && (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '9.5px' }}>
                Tidak ada berita yang cocok dengan filter ini.
              </div>
            )}
          </div>

          {/* Footer CTA: Terminal Link */}
          <div style={{
            marginTop: '6px',
            paddingTop: '6px',
            borderTop: 'var(--border-hairline)'
          }}>
            <button
              onClick={() => onNavigateTab && onNavigateTab('NEWS')}
              style={{
                width: '100%',
                padding: '5px 8px',
                fontSize: '8.5px',
                fontWeight: '700',
                borderRadius: '3px',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                background: 'rgba(59, 130, 246, 0.08)',
                color: 'var(--accent-blue)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent-blue)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                e.currentTarget.style.color = 'var(--accent-blue)';
              }}
              title="Buka Terminal Berita Riset Lengkap (NewsTab)"
            >
              <span>Buka Terminal Berita ({liveNewsRaw.length} Riset)</span>
              <span style={{ fontSize: '10px' }}>↗</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
