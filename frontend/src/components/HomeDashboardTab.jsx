import React, { useState, useEffect } from 'react';
import BloombergNewsWire from './BloombergNewsWire.jsx';
import AssetIcon from './AssetIcon.jsx';
import CryptoIcon from './CryptoIcon.jsx';

export default function HomeDashboardTab({
  data,
  livePrices = {},
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

  useEffect(() => {
    if (!data?.last_updated) return;
    const lastUpdate = new Date(data.last_updated);
    const now = new Date();
    const diffHours = (now - lastUpdate) / (1000 * 60 * 60);
    
    if (diffHours > 6) {
      setDataStatus('stale');
    } else if (data?.data_sources && Object.values(data.data_sources).some(s => s === 'fallback')) {
      setDataStatus('fallback');
    } else {
      setDataStatus('live');
    }
  }, [data]);

  const topIdxPlans = (data?.daily_trade_plans || []).filter(p => p.market === 'IDX');
  const topCryptoPicks = data?.crypto_spot_10 || [];
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

      if (newsFilter === 'IDX' && stream !== 'IDX' && tag !== 'IHSG' && tag !== 'BANKING') return false;
      if (newsFilter === 'CRYPTO' && stream !== 'CRYPTO' && tag !== 'BTC' && tag !== 'CRYPTO') return false;
      if (newsFilter === 'MACRO' && stream !== 'MACRO' && tag !== 'MACRO' && tag !== 'FED') return false;
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
    const abs = Math.abs(num);
    const sign = num >= 0 ? '+' : '-';
    if (abs >= 1e12) return `${sign}Rp ${(abs / 1e12).toFixed(2)} T`;
    if (abs >= 1e9) return `${sign}Rp ${(abs / 1e9).toFixed(2)} B`;
    if (abs >= 1e6) return `${sign}Rp ${(abs / 1e6).toFixed(0)} M`;
    return `${sign}Rp ${abs.toLocaleString('id-ID')}`;
  };

  // Foreign flow calculations (Top 6 Inflow & Top 6 Outflow for richer institutional depth)
  const topInflow = (foreignFlow.top_inflow || []).slice(0, 6);
  const topOutflow = (foreignFlow.top_outflow || []).slice(0, 6);
  const netInflowSum = (foreignFlow.top_inflow || []).reduce((acc, c) => acc + (Number(c.foreign_net_val_idr) || 0), 0);
  const netOutflowSum = (foreignFlow.top_outflow || []).reduce((acc, c) => acc + (Number(c.foreign_net_val_idr) || 0), 0);
  const totalNetForeign = netInflowSum + netOutflowSum;

  // Broker accumulation (Top 6 institutional smart money accumulation)
  const accumulatingBrokers = Object.values(brokerSummary)
    .filter(b => b.bandar_accumulation_grade === 'BIG_ACCUMULATION' || b.bandar_accumulation_grade === 'ACCUMULATION')
    .sort((a, b) => ((b.top_buyers?.[0]?.lots || 0) * (b.bandar_avg_price || 0)) - ((a.top_buyers?.[0]?.lots || 0) * (a.bandar_avg_price || 0)))
    .slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', boxSizing: 'border-box' }}>

      {dataStatus === 'stale' && (
        <div style={{background:'#dc2626',color:'#fff',padding:'8px 16px',borderRadius:8,marginBottom:12,display:'flex',alignItems:'center',gap:8,fontSize:13,fontWeight:600}}>
          ⚠️ DATA STALE — Last updated: {data?.last_updated ? new Date(data.last_updated).toLocaleString('id-ID') : 'Unknown'}. Pipeline may be down.
          {data?.section_timestamps && (
            <span style={{fontSize: '9px', marginLeft: '8px', opacity: 0.8}}>
              IDX: {data.section_timestamps?.idx ? new Date(data.section_timestamps.idx).toLocaleTimeString('id-ID') : 'N/A'} | 
              Crypto: {data.section_timestamps?.crypto ? new Date(data.section_timestamps.crypto).toLocaleTimeString('id-ID') : 'N/A'} | 
              Macro: {data.section_timestamps?.macro ? new Date(data.section_timestamps.macro).toLocaleTimeString('id-ID') : 'N/A'}
            </span>
          )}
        </div>
      )}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>

          {/* ROW 1: 3 BENTO CARDS (Regime, #1 IDX, #1 Crypto) */}
          <div className="home-bento-row">

            {/* Card 1: IHSG & Global Regime */}
            <div className="telemetry-panel" style={{
              padding: '10px 14px',
              borderLeft: '3px solid var(--accent-green)',
              background: 'linear-gradient(135deg, var(--bg-panel) 0%, rgba(0,208,132,0.04) 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '128px'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="metric-label" style={{ fontSize: '9.5px' }}>IHSG & Global Regime</span>
                  <span className="badge badge-bull" style={{ fontSize: '8px', padding: '2px 6px' }}>ACTIVE</span>
                </div>
                <div style={{ fontSize: '17px', fontWeight: '900', marginTop: '3px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {sentiment}
                </div>
                <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.4 }}>
                  {narrative.length > 110 ? narrative.slice(0, 110) + '...' : narrative}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '4px', borderTop: 'var(--border-muted)', fontSize: '9.5px', fontFamily: 'var(--font-mono)' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>.JKSE: </span>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {macro.ihsg_price || macro.jkse_price ? Number(macro.ihsg_price || macro.jkse_price).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '6,506.40'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Chg: </span>
                  <strong style={{ color: (macro.ihsg_change_pct !== undefined ? Number(macro.ihsg_change_pct) : -1.29) >= 0 ? 'var(--accent-green)' : '#ff3b30' }}>
                    {(macro.ihsg_change_pct !== undefined ? Number(macro.ihsg_change_pct) : -1.29) >= 0 ? '+' : ''}
                    {macro.ihsg_change_pct !== undefined ? Number(macro.ihsg_change_pct).toFixed(2) : '-1.29'}%
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Vol Bursa: </span>
                  <strong style={{ color: 'var(--text-primary)' }}>2.1T</strong>
                </div>
              </div>
            </div>

            {/* Card 2: #1 IDX Alpha Watchlist */}
            {(() => {
              const topIdxTicker = topIdx?.clean_ticker || topIdx?.symbol?.replace('.JK', '') || 'LSIP';
              const liveIdx = livePrices[topIdxTicker] || livePrices[`IDX:${topIdxTicker}`];
              const liveIdxPrice = liveIdx?.price !== undefined ? liveIdx.price : (topIdx?.entry_price || 1725);
              const liveIdxChange = liveIdx?.changePct !== undefined ? liveIdx.changePct : 2.37;
              const isIdxFlashing = flashMap[topIdxTicker];

              return (
                <div className="telemetry-panel" style={{
                  padding: '10px 14px',
                  borderLeft: '3px solid var(--accent-green)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '128px'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="metric-label" style={{ fontSize: '9.5px' }}>#1 IDX Alpha Watchlist</span>
                      <span className="badge badge-bull" style={{ fontSize: '8px', padding: '2px 6px' }}>{topIdx?.technical_signal || 'BREAKOUT'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AssetIcon symbol={topIdxTicker} market="IDX" size={20} />
                        <span style={{ fontSize: '16px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                          ${topIdxTicker}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          fontFamily: 'var(--font-mono)',
                          color: isIdxFlashing === 'up' ? 'var(--accent-green)' : isIdxFlashing === 'down' ? 'var(--accent-rust)' : 'var(--text-primary)'
                        }}>
                          Rp {Math.round(liveIdxPrice).toLocaleString('id-ID')}
                          {isIdxFlashing === 'up' && <span style={{ color: 'var(--accent-green)', marginLeft: '2px' }}>▲</span>}
                          {isIdxFlashing === 'down' && <span style={{ color: 'var(--accent-rust)', marginLeft: '2px' }}>▼</span>}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10.5px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: liveIdxChange >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                          {liveIdxChange >= 0 ? '+' : ''}{liveIdxChange.toFixed(2)}%
                        </span>
                        <button
                          className="telemetry-btn"
                          onClick={() => onSelectTicker(topIdxTicker, 'IDX')}
                          style={{ fontSize: '8.5px', padding: '2px 6px', background: 'var(--accent-blue)', color: '#fff' }}
                        >
                          CHART ↗
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                      Salim Group · IDX Equities
                    </div>
                  </div>

                  {/* Sparkline mini SVG */}
                  <div style={{ height: '14px', margin: '3px 0' }}>
                    <svg width="100%" height="14" viewBox="0 0 120 14" preserveAspectRatio="none">
                      <path d="M 0 10 Q 30 12 50 8 T 90 4 L 120 2" fill="none" stroke="var(--accent-green)" strokeWidth="1.5" />
                    </svg>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px', fontFamily: 'var(--font-mono)', paddingTop: '4px', borderTop: 'var(--border-muted)' }}>
                    <span>Entry: <strong style={{ color: 'var(--text-primary)' }}>{Number(topIdx?.entry_price || 1725).toLocaleString()}</strong></span>
                    <span>SL: <strong style={{ color: 'var(--accent-rust)' }}>{Number(topIdx?.stop_loss || 1656).toLocaleString()}</strong></span>
                    <span>TP: <strong style={{ color: 'var(--accent-green)' }}>{Number(topIdx?.target_1 || 1877).toLocaleString()}</strong></span>
                    <span style={{ color: 'var(--accent-orange)', fontWeight: '800' }}>R:R 1:{topIdx?.risk_reward_ratio || '2.2'}</span>
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
                  padding: '10px 14px',
                  borderLeft: '3px solid var(--accent-orange)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '128px'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="metric-label" style={{ fontSize: '9.5px' }}>#1 Crypto Spot Momentum</span>
                      <span className="badge badge-alert" style={{ fontSize: '8px', padding: '2px 6px' }}>NO LEV · SPOT</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CryptoIcon symbol={topCrypto?.pair || 'BTC'} size={20} />
                        <span style={{ fontSize: '16px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                          {topCrypto?.pair || 'BTC/USDT'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          fontFamily: 'var(--font-mono)',
                          color: isCryptoFlashing === 'up' ? 'var(--accent-green)' : isCryptoFlashing === 'down' ? 'var(--accent-rust)' : 'var(--text-primary)'
                        }}>
                          ${Number(liveCryptoPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          {isCryptoFlashing === 'up' && <span style={{ color: 'var(--accent-green)', marginLeft: '2px' }}>▲</span>}
                          {isCryptoFlashing === 'down' && <span style={{ color: 'var(--accent-rust)', marginLeft: '2px' }}>▼</span>}
                        </span>
                      </div>
                      <span style={{ fontSize: '10.5px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: liveCryptoChange >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                        {liveCryptoChange >= 0 ? '+' : ''}{liveCryptoChange.toFixed(2)}%
                      </span>
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                      Range Accumulation
                    </div>
                  </div>

                  {/* Sparkline mini SVG */}
                  <div style={{ height: '14px', margin: '3px 0' }}>
                    <svg width="100%" height="14" viewBox="0 0 120 14" preserveAspectRatio="none">
                      <path d="M 0 8 Q 30 11 60 7 T 90 9 L 120 5" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
                    </svg>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px', fontFamily: 'var(--font-mono)', paddingTop: '4px', borderTop: 'var(--border-muted)' }}>
                    <span>Entry: <strong style={{ color: 'var(--text-primary)' }}>{Math.round(topCrypto?.current_price || 77168).toLocaleString()}</strong></span>
                    <span>SL: <strong style={{ color: 'var(--accent-rust)' }}>{Math.round(topCrypto?.stop_loss || 75625).toLocaleString()}</strong></span>
                    <span>TP: <strong style={{ color: 'var(--accent-green)' }}>{Math.round(topCrypto?.take_profit_1 || 80255).toLocaleString()}</strong></span>
                    <span style={{ color: 'var(--accent-orange)', fontWeight: '800' }}>R:R 1:{topCrypto?.risk_reward_ratio || '2'}</span>
                  </div>
                </div>
              );
            })()}

          </div>

          {/* ================= BLOOMBERG SENTIMENT & RISK RADAR ================= */}
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
              <div className="telemetry-panel" style={{
                padding: '8px 12px',
                background: 'linear-gradient(135deg, var(--bg-panel) 0%, rgba(30, 41, 59, 0.4) 100%)',
                border: 'var(--border-hairline)',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px' }}>🧭</span>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
                      BLOOMBERG RISK & SENTIMENT RADAR
                    </span>
                    <span style={{ fontSize: '8px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontWeight: '700' }}>
                      INSTITUTIONAL METRICS
                    </span>
                  </div>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    LIVE MACRO SYNC
                  </span>
                </div>

                <div className="home-radar-grid">
                  {/* Gauge 1: Crypto Fear & Greed */}
                  <div style={{
                    padding: '6px 8px',
                    background: 'var(--bg-panel-subtle)',
                    borderRadius: '3px',
                    border: 'var(--border-hairline)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Crypto Fear & Greed</span>
                      <span style={{ fontSize: '8px', fontWeight: '800', color: fngColor }}>{fngLabel}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: fngColor }}>
                        {fngVal}
                      </span>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>/ 100</span>
                    </div>
                    <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                      <div style={{ width: `${Math.min(100, Math.max(0, fngVal))}%`, height: '100%', background: fngColor, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>

                  {/* Gauge 2: VIX Volatility Index */}
                  <div style={{
                    padding: '6px 8px',
                    background: 'var(--bg-panel-subtle)',
                    borderRadius: '3px',
                    border: 'var(--border-hairline)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CBOE VIX (Wall St)</span>
                      <span style={{
                        fontSize: '8px',
                        fontWeight: '800',
                        color: vixVal < 15 ? 'var(--accent-green)' : vixVal < 20 ? '#60a5fa' : vixVal < 25 ? '#f59e0b' : '#ef4444'
                      }}>
                        {vixVal < 15 ? 'CALM' : vixVal < 20 ? 'NORMAL' : vixVal < 25 ? 'ELEVATED' : 'HIGH PANIC'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{
                        fontSize: '15px',
                        fontWeight: '900',
                        fontFamily: 'var(--font-mono)',
                        color: vixVal < 20 ? 'var(--text-primary)' : '#ef4444'
                      }}>
                        {vixVal.toFixed(2)}
                      </span>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>pts</span>
                    </div>
                    <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {vixVal < 20 ? '🟢 Market Complacency' : '⚠️ Hedging Demand Naik'}
                    </div>
                  </div>

                  {/* Gauge 3: BTC Dominance & Altseason */}
                  <div style={{
                    padding: '6px 8px',
                    background: 'var(--bg-panel-subtle)',
                    borderRadius: '3px',
                    border: 'var(--border-hairline)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>BTC Dominance</span>
                      <span style={{ fontSize: '8px', fontWeight: '800', color: btcDom > 55 ? '#f59e0b' : '#10b981' }}>
                        {btcDom > 55 ? 'BTC LEADER' : 'ALTSEASON'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {btcDom.toFixed(1)}%
                      </span>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>market share</span>
                    </div>
                    <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {btcDom > 55 ? 'Capital fokus di BTC ETF' : 'Altcoin Outperforming'}
                    </div>
                  </div>

                  {/* Gauge 4: Dollar Strength DXY */}
                  <div style={{
                    padding: '6px 8px',
                    background: 'var(--bg-panel-subtle)',
                    borderRadius: '3px',
                    border: 'var(--border-hairline)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>US Dollar Index (DXY)</span>
                      <span style={{ fontSize: '8px', fontWeight: '800', color: dxyVal > 105 ? '#ef4444' : dxyVal < 103 ? 'var(--accent-green)' : '#60a5fa' }}>
                        {dxyVal > 105 ? 'STRONG USD' : dxyVal < 103 ? 'SOFT USD' : 'NEUTRAL'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {dxyVal.toFixed(2)}
                      </span>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>pts</span>
                    </div>
                    <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {dxyVal > 104.5 ? '🔴 Tekanan Kurs Emerging Markets' : '🟢 Likuiditas Global Melonggar'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ROW 2: DUAL FLOW RADAR (Struktur Klasik: Top 5 Inflow vs Outflow & Polish Bandarmology) */}
          <div className="home-dual-flow-grid">

            {/* Left Box: IDX Foreign Capital Flow (Struktur Lama: Top 5 Inflow & Top 5 Outflow Sempurna) */}
            <div className="telemetry-panel" style={{ border: 'var(--border-hairline)', padding: '0', display: 'flex', flexDirection: 'column' }}>
              <div className="telemetry-header" style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🌐 IDX FOREIGN CAPITAL FLOW</span>
                </div>
                <span className="badge badge-bear" style={{ fontSize: '8px', padding: '1px 5px' }}>
                  {totalNetForeign >= 0 ? 'NET BUY' : 'NET SELL'}
                </span>
              </div>
              <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {/* Stats Header Bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '4px 8px',
                  background: 'var(--bg-panel-subtle)',
                  borderRadius: '3px',
                  border: 'var(--border-hairline)',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '8px', display: 'block' }}>NET ASING TERPANTAU</span>
                    <span style={{ fontWeight: '800', color: totalNetForeign >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                      {formatFlowIdr(totalNetForeign)}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '8px', display: 'block' }}>AKUMULASI INFLOW TOP 6</span>
                    <span style={{ fontWeight: '800', color: 'var(--accent-green)' }}>
                      {formatFlowIdr(netInflowSum)}
                    </span>
                  </div>
                </div>

                {/* 2-Columns: Top Inflow (Buy) vs Top Outflow (Sell) */}
                <div className="home-flow-columns">
                  {/* Top Inflow */}
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: '800', color: 'var(--accent-green)', marginBottom: '3px' }}>
                      ▲ TOP INFLOW (BUY)
                    </div>
                    {topInflow.map((f, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3.5px 0', borderBottom: 'var(--border-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ fontWeight: '700', cursor: 'pointer', color: 'var(--accent-blue)', display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => onSelectTicker(f.ticker, 'IDX')}>
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
                    <div style={{ fontSize: '9px', fontWeight: '800', color: 'var(--accent-rust)', marginBottom: '3px' }}>
                      ▼ TOP OUTFLOW (SELL)
                    </div>
                    {topOutflow.map((f, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3.5px 0', borderBottom: 'var(--border-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ fontWeight: '700', cursor: 'pointer', color: 'var(--accent-blue)', display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => onSelectTicker(f.ticker, 'IDX')}>
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
            </div>

            {/* Right Box: Bandarmology Broker Accumulation (Optimasi Rapi & Estetis) */}
            <div className="telemetry-panel" style={{ border: 'var(--border-hairline)', padding: '0', display: 'flex', flexDirection: 'column' }}>
              <div className="telemetry-header" style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🐳 BANDARMOLOGY (BROKER ACCUMULATION)</span>
                </div>
                <span className="badge badge-bull" style={{ fontSize: '8px', padding: '1px 5px' }}>TOP BUYERS</span>
              </div>

              <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {accumulatingBrokers.map((b, idx) => {
                  const topB = b.top_buyers?.[0];
                  const lotsK = topB?.lots ? Math.round(topB.lots / 1000).toLocaleString() + 'k lot' : '-';
                  return (
                    <div
                      key={b.ticker || idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '5.5px 8px',
                        background: 'var(--bg-panel-subtle)',
                        borderRadius: '3px',
                        border: 'var(--border-hairline)',
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{ fontWeight: '900', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '11px' }}
                          onClick={() => onSelectTicker(b.ticker, 'IDX')}
                        >
                          ${b.ticker}
                        </span>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                          Avg: <strong style={{ color: 'var(--text-primary)' }}>Rp {Number(b.bandar_avg_price || b.ref_price).toLocaleString()}</strong>
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                          {topB?.broker || 'CC'} ({lotsK})
                        </span>
                        <span className="badge badge-bull" style={{ fontSize: '7px', padding: '1px 4px', fontWeight: '800' }}>
                          BIG ACC
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ROW 3: TWO SIDE-BY-SIDE TABLES (Saham IDX Signals vs Crypto Spot Signals) */}
          <div className="home-dual-flow-grid">

            {/* Table 1: Saham IDX Signals */}
            <div className="telemetry-panel" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)' }}>Saham IDX Signals</span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{topIdxPlans.length}</span>
                  </div>
                  <button
                    onClick={() => onNavigateTab('STOCK')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '9px', cursor: 'pointer' }}
                  >
                    Lihat semua →
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-muted)', borderBottom: 'var(--border-hairline)', textAlign: 'left' }}>
                        <th style={{ padding: '4px' }}>Ticker</th>
                        <th style={{ padding: '4px' }}>Setup</th>
                        <th style={{ padding: '4px' }}>Entry</th>
                        <th style={{ padding: '5.5px 5px' }}>SL</th>
                        <th style={{ padding: '5.5px 5px' }}>TP1</th>
                        <th style={{ padding: '5.5px 5px' }}>R:R</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topIdxPlans.slice(0, 6).map(plan => {
                        const ticker = plan.clean_ticker || plan.symbol?.replace('.JK', '');
                        return (
                          <tr key={ticker} style={{ borderBottom: 'rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '5.5px 5px', fontWeight: '800' }}>
                              <span style={{ color: 'var(--accent-blue)', cursor: 'pointer' }} onClick={() => onSelectTicker(ticker, 'IDX')}>
                                {ticker}
                              </span>
                            </td>
                            <td style={{ padding: '5.5px 5px' }}>
                              <span className="badge badge-bull" style={{ fontSize: '7px', padding: '1px 4px' }}>
                                {plan.technical_signal || 'BREAKOUT'}
                              </span>
                            </td>
                            <td style={{ padding: '5.5px 5px' }}>{Number(plan.entry_price).toLocaleString()}</td>
                            <td style={{ padding: '5.5px 5px', color: 'var(--accent-rust)' }}>{Number(plan.stop_loss).toLocaleString()}</td>
                            <td style={{ padding: '5.5px 5px', color: 'var(--accent-green)' }}>{Number(plan.target_1).toLocaleString()}</td>
                            <td style={{ padding: '5.5px 5px', fontWeight: '700', color: 'var(--accent-orange)' }}>1:{plan.risk_reward_ratio || '2.2'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8.5px', color: 'var(--text-muted)', marginTop: '6px', paddingTop: '4px', borderTop: 'var(--border-muted)' }}>
                <span>Engine TimesFM + SMC</span>
                <span>6 / {topIdxPlans.length}</span>
              </div>
            </div>

            {/* Table 2: Crypto Spot Signals */}
            <div className="telemetry-panel" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)' }}>Crypto Spot Signals</span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{topCryptoPicks.length}</span>
                  </div>
                  <button
                    onClick={() => onNavigateTab('CRYPTO')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '9px', cursor: 'pointer' }}
                  >
                    Lihat semua →
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px', fontFamily: 'var(--font-mono)' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-muted)', borderBottom: 'var(--border-hairline)', textAlign: 'left' }}>
                        <th style={{ padding: '5.5px 5px' }}>Pair</th>
                        <th style={{ padding: '5.5px 5px' }}>Setup</th>
                        <th style={{ padding: '5.5px 5px' }}>Entry</th>
                        <th style={{ padding: '5.5px 5px' }}>SL</th>
                        <th style={{ padding: '5.5px 5px' }}>TP1</th>
                        <th style={{ padding: '5.5px 5px' }}>R:R</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCryptoPicks.slice(0, 6).map(c => (
                        <tr key={c.pair} style={{ borderBottom: 'rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '5.5px 5px', fontWeight: '800' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <CryptoIcon symbol={c.pair} size={14} />
                              <span style={{ color: '#60a5fa', cursor: 'pointer' }} onClick={() => onSelectTicker(c.pair, 'CRYPTO')}>
                                {c.pair}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '5.5px 5px' }}>
                            <span className="badge badge-alert" style={{ fontSize: '7px', padding: '1px 4px' }}>
                              RANGE_ACC
                            </span>
                          </td>
                          <td style={{ padding: '5.5px 5px' }}>{c.current_price > 10 ? Math.round(c.current_price).toLocaleString() : c.current_price}</td>
                          <td style={{ padding: '5.5px 5px', color: 'var(--accent-rust)' }}>{c.stop_loss > 10 ? Math.round(c.stop_loss).toLocaleString() : c.stop_loss}</td>
                          <td style={{ padding: '5.5px 5px', color: 'var(--accent-green)' }}>{c.take_profit_1 > 10 ? Math.round(c.take_profit_1).toLocaleString() : c.take_profit_1}</td>
                          <td style={{ padding: '5.5px 5px', fontWeight: '700', color: 'var(--accent-orange)' }}>1:{c.risk_reward_ratio || '2'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8.5px', color: 'var(--text-muted)', marginTop: '6px', paddingTop: '4px', borderTop: 'var(--border-muted)' }}>
                <span>Spot USDT · no leverage</span>
                <span>6 / {topCryptoPicks.length}</span>
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
                INSTRUMENTS: <strong style={{ color: 'var(--text-primary)' }}>82 SAHAM · 10 CRYPTO</strong>
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
          minWidth: 0,
          height: '790px',
          maxHeight: '790px'
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
              { id: 'IDX', label: '🏛️ IDX' },
              { id: 'CRYPTO', label: '⚡ KRIPTO' },
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
                  background: newsFilter === f.id ? 'var(--accent-blue)' : 'var(--bg-panel-subtle)',
                  color: newsFilter === f.id ? '#ffffff' : 'var(--text-muted)',
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
              const isBear = news.sentiment === 'BEARISH';
              const isBull = news.sentiment === 'BULLISH';
              const borderAccent = isBull ? 'var(--accent-green)' : isBear ? 'var(--accent-rust)' : 'rgba(255,255,255,0.12)';

              return (
                <div
                  key={news.id || idx}
                  onClick={() => onSelectNews && onSelectNews(news)}
                  style={{
                    padding: '6px 8px',
                    background: 'var(--bg-panel-subtle)',
                    borderRadius: '3px',
                    border: 'var(--border-hairline)',
                    borderLeft: `2.5px solid ${borderAccent}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-blue)';
                    e.currentTarget.style.borderLeft = `2.5px solid ${borderAccent}`;
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-hairline)';
                    e.currentTarget.style.borderLeft = `2.5px solid ${borderAccent}`;
                    e.currentTarget.style.background = 'var(--bg-panel-subtle)';
                  }}
                  title="Klik untuk melihat detail & analisis berita"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '8px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                        {news.source || 'MARKET WIRE'}
                      </span>
                      <span className={`badge ${isBear ? 'badge-bear' : isBull ? 'badge-bull' : 'badge-neutral'}`} style={{ fontSize: '6.5px', padding: '0 3px' }}>
                        {news.sentiment || 'NEUTRAL'}
                      </span>
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
