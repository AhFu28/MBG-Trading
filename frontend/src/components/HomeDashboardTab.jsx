import React, { useState, useEffect } from 'react';
import BloombergNewsWire from './BloombergNewsWire.jsx';

export default function HomeDashboardTab({
  data,
  onSelectTicker,
  onOpenLotCalc,
  onNavigateTab,
  onSelectNews
}) {
  const [dataStatus, setDataStatus] = useState('live');

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
  const liveNews = macro?.live_news || [];

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

  // Foreign flow calculations (Top 5 Inflow & Top 5 Outflow)
  const topInflow = (foreignFlow.top_inflow || []).slice(0, 5);
  const topOutflow = (foreignFlow.top_outflow || []).slice(0, 5);
  const netInflowSum = (foreignFlow.top_inflow || []).reduce((acc, c) => acc + (Number(c.foreign_net_val_idr) || 0), 0);
  const netOutflowSum = (foreignFlow.top_outflow || []).reduce((acc, c) => acc + (Number(c.foreign_net_val_idr) || 0), 0);
  const totalNetForeign = netInflowSum + netOutflowSum;

  // Broker accumulation (Top 5 institutional smart money accumulation)
  const accumulatingBrokers = Object.values(brokerSummary)
    .filter(b => b.bandar_accumulation_grade === 'BIG_ACCUMULATION' || b.bandar_accumulation_grade === 'ACCUMULATION')
    .sort((a, b) => ((b.top_buyers?.[0]?.lots || 0) * (b.bandar_avg_price || 0)) - ((a.top_buyers?.[0]?.lots || 0) * (a.bandar_avg_price || 0)))
    .slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', boxSizing: 'border-box' }}>

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
      <BloombergNewsWire macro={macro} bundle={data} onSelectTicker={onSelectTicker} onSelectNews={onSelectNews} />

      {/* MAIN TWO-COLUMN CONTAINER: LEFT 72% (COCKPIT) + RIGHT 28% (LIVE NEWS STREAM) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 300px',
        gap: '8px',
        alignItems: 'stretch',
        width: '100%',
        boxSizing: 'border-box'
      }}>

        {/* ================= LEFT MAIN WORKSPACE ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>

          {/* ROW 1: 3 BENTO CARDS (Regime, #1 IDX, #1 Crypto) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1fr',
            gap: '8px',
            minWidth: 0
          }}>

            {/* Card 1: IHSG & Global Regime */}
            <div className="telemetry-panel" style={{
              padding: '8px 12px',
              borderLeft: '3px solid var(--accent-green)',
              background: 'linear-gradient(135deg, var(--bg-panel) 0%, rgba(0,208,132,0.04) 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '120px'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="metric-label" style={{ fontSize: '9px' }}>IHSG & Global Regime</span>
                  <span className="badge badge-bull" style={{ fontSize: '8px', padding: '1px 5px' }}>ACTIVE</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '900', marginTop: '3px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {sentiment}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.35 }}>
                  {narrative.length > 85 ? narrative.slice(0, 85) + '...' : narrative}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '4px', borderTop: 'var(--border-muted)', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
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
            <div className="telemetry-panel" style={{
              padding: '8px 12px',
              borderLeft: '3px solid var(--accent-green)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '120px'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="metric-label" style={{ fontSize: '9px' }}>#1 IDX Alpha Watchlist</span>
                  <span className="badge badge-bull" style={{ fontSize: '8px', padding: '1px 5px' }}>{topIdx?.technical_signal || 'BREAKOUT'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '2px' }}>
                  <span style={{ fontSize: '17px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    ${topIdx?.clean_ticker || topIdx?.symbol || 'LSIP'}
                  </span>
                  <button
                    className="telemetry-btn"
                    onClick={() => onSelectTicker(topIdx?.clean_ticker || topIdx?.symbol || 'LSIP', 'IDX')}
                    style={{ fontSize: '8px', padding: '1px 5px', background: 'var(--accent-blue)', color: '#fff' }}
                  >
                    CHART ↗
                  </button>
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontFamily: 'var(--font-mono)', paddingTop: '3px', borderTop: 'var(--border-muted)' }}>
                <span>Entry: <strong style={{ color: 'var(--text-primary)' }}>{Number(topIdx?.entry_price || 1725).toLocaleString()}</strong></span>
                <span>SL: <strong style={{ color: 'var(--accent-rust)' }}>{Number(topIdx?.stop_loss || 1656).toLocaleString()}</strong></span>
                <span>TP: <strong style={{ color: 'var(--accent-green)' }}>{Number(topIdx?.target_1 || 1877).toLocaleString()}</strong></span>
                <span style={{ color: 'var(--accent-orange)', fontWeight: '800' }}>R:R 1:{topIdx?.risk_reward_ratio || '2.2'}</span>
              </div>
            </div>

            {/* Card 3: #1 Crypto Spot Momentum */}
            <div className="telemetry-panel" style={{
              padding: '8px 12px',
              borderLeft: '3px solid var(--accent-orange)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '120px'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="metric-label" style={{ fontSize: '9px' }}>#1 Crypto Spot Momentum</span>
                  <span className="badge badge-alert" style={{ fontSize: '8px', padding: '1px 5px' }}>NO LEV · SPOT</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '2px' }}>
                  <span style={{ fontSize: '17px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {topCrypto?.pair || 'BTC/USDT'}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: (topCrypto?.change_24h_pct || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                    {(topCrypto?.change_24h_pct || 0) >= 0 ? '+' : ''}{topCrypto?.change_24h_pct !== undefined ? topCrypto.change_24h_pct : '0.78'}%
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontFamily: 'var(--font-mono)', paddingTop: '3px', borderTop: 'var(--border-muted)' }}>
                <span>Entry: <strong style={{ color: 'var(--text-primary)' }}>{Math.round(topCrypto?.current_price || 77168).toLocaleString()}</strong></span>
                <span>SL: <strong style={{ color: 'var(--accent-rust)' }}>{Math.round(topCrypto?.stop_loss || 75625).toLocaleString()}</strong></span>
                <span>TP: <strong style={{ color: 'var(--accent-green)' }}>{Math.round(topCrypto?.take_profit_1 || 80255).toLocaleString()}</strong></span>
                <span style={{ color: 'var(--accent-orange)', fontWeight: '800' }}>R:R 1:{topCrypto?.risk_reward_ratio || '2'}</span>
              </div>
            </div>

          </div>

          {/* ROW 2: DUAL FLOW RADAR (Struktur Klasik: Top 5 Inflow vs Outflow & Polish Bandarmology) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            minWidth: 0
          }}>

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
                    <span style={{ color: 'var(--text-muted)', fontSize: '8px', display: 'block' }}>AKUMULASI INFLOW TOP 5</span>
                    <span style={{ fontWeight: '800', color: 'var(--accent-green)' }}>
                      {formatFlowIdr(netInflowSum)}
                    </span>
                  </div>
                </div>

                {/* 2-Columns: Top Inflow (Buy) vs Top Outflow (Sell) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {/* Top Inflow */}
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: '800', color: 'var(--accent-green)', marginBottom: '3px' }}>
                      ▲ TOP INFLOW (BUY)
                    </div>
                    {topInflow.map((f, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: 'var(--border-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ fontWeight: '700', cursor: 'pointer', color: 'var(--accent-blue)' }} onClick={() => onSelectTicker(f.ticker, 'IDX')}>
                          ${f.ticker}
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
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: 'var(--border-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ fontWeight: '700', cursor: 'pointer', color: 'var(--accent-blue)' }} onClick={() => onSelectTicker(f.ticker, 'IDX')}>
                          ${f.ticker}
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
                        padding: '4px 6px',
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            minWidth: 0
          }}>

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
                        <th style={{ padding: '4px' }}>SL</th>
                        <th style={{ padding: '4px' }}>TP1</th>
                        <th style={{ padding: '4px' }}>R:R</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topIdxPlans.slice(0, 5).map(plan => {
                        const ticker = plan.clean_ticker || plan.symbol?.replace('.JK', '');
                        return (
                          <tr key={ticker} style={{ borderBottom: 'rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '4px', fontWeight: '800' }}>
                              <span style={{ color: 'var(--accent-blue)', cursor: 'pointer' }} onClick={() => onSelectTicker(ticker, 'IDX')}>
                                {ticker}
                              </span>
                            </td>
                            <td style={{ padding: '4px' }}>
                              <span className="badge badge-bull" style={{ fontSize: '7px', padding: '1px 3px' }}>
                                {plan.technical_signal || 'BREAKOUT'}
                              </span>
                            </td>
                            <td style={{ padding: '4px' }}>{Number(plan.entry_price).toLocaleString()}</td>
                            <td style={{ padding: '4px', color: 'var(--accent-rust)' }}>{Number(plan.stop_loss).toLocaleString()}</td>
                            <td style={{ padding: '4px', color: 'var(--accent-green)' }}>{Number(plan.target_1).toLocaleString()}</td>
                            <td style={{ padding: '4px', fontWeight: '700', color: 'var(--accent-orange)' }}>1:{plan.risk_reward_ratio || '2.2'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', color: 'var(--text-muted)', marginTop: '6px', paddingTop: '4px', borderTop: 'var(--border-muted)' }}>
                <span>Engine TimesFM + SMC</span>
                <span>5 / {topIdxPlans.length}</span>
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
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-muted)', borderBottom: 'var(--border-hairline)', textAlign: 'left' }}>
                        <th style={{ padding: '4px' }}>Pair</th>
                        <th style={{ padding: '4px' }}>Setup</th>
                        <th style={{ padding: '4px' }}>Entry</th>
                        <th style={{ padding: '4px' }}>SL</th>
                        <th style={{ padding: '4px' }}>TP1</th>
                        <th style={{ padding: '4px' }}>R:R</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCryptoPicks.slice(0, 5).map(c => (
                        <tr key={c.pair} style={{ borderBottom: 'rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '4px', fontWeight: '800' }}>
                            <span style={{ color: '#60a5fa', cursor: 'pointer' }} onClick={() => onSelectTicker(c.pair, 'CRYPTO')}>
                              {c.pair}
                            </span>
                          </td>
                          <td style={{ padding: '4px' }}>
                            <span className="badge badge-alert" style={{ fontSize: '7px', padding: '1px 3px' }}>
                              RANGE_ACC
                            </span>
                          </td>
                          <td style={{ padding: '4px' }}>{c.current_price > 10 ? Math.round(c.current_price).toLocaleString() : c.current_price}</td>
                          <td style={{ padding: '4px', color: 'var(--accent-rust)' }}>{c.stop_loss > 10 ? Math.round(c.stop_loss).toLocaleString() : c.stop_loss}</td>
                          <td style={{ padding: '4px', color: 'var(--accent-green)' }}>{c.take_profit_1 > 10 ? Math.round(c.take_profit_1).toLocaleString() : c.take_profit_1}</td>
                          <td style={{ padding: '4px', fontWeight: '700', color: 'var(--accent-orange)' }}>1:{c.risk_reward_ratio || '2'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', color: 'var(--text-muted)', marginTop: '6px', paddingTop: '4px', borderTop: 'var(--border-muted)' }}>
                <span>Spot USDT · no leverage</span>
                <span>5 / {topCryptoPicks.length}</span>
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

        {/* ================= RIGHT SIDEBAR: LIVE NEWS STREAM ================= */}
        <div className="telemetry-panel" style={{
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          minWidth: 0,
          height: '100%'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '4px', borderBottom: 'var(--border-hairline)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '11px' }}>📰</span>
              <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)' }}>Live News</span>
            </div>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{liveNews.length}</span>
          </div>

          {/* Vertical scrollable list of news cards */}
          <div className="news-scroll-container" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            overflowY: 'auto',
            maxHeight: '520px',
            paddingRight: '4px'
          }}>
            {liveNews.map((news, idx) => {
              const isBear = news.sentiment === 'BEARISH';
              const isBull = news.sentiment === 'BULLISH';
              return (
                <div
                  key={news.id || idx}
                  onClick={() => onSelectNews && onSelectNews(news)}
                  style={{
                    padding: '8px 10px',
                    background: 'var(--bg-panel-subtle)',
                    borderRadius: '4px',
                    border: 'var(--border-hairline)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-blue)';
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-hairline)';
                    e.currentTarget.style.background = 'var(--bg-panel-subtle)';
                  }}
                  title="Klik untuk melihat detail & analisis berita"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                        {news.source || 'MARKET WIRE'}
                      </span>
                      <span className={`badge ${isBear ? 'badge-bear' : isBull ? 'badge-bull' : 'badge-neutral'}`} style={{ fontSize: '7px', padding: '0 3px' }}>
                        {news.sentiment || 'NEUTRAL'}
                      </span>
                    </div>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {news.pub_date ? `${new Date(news.pub_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} · ${new Date(news.pub_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB` : '16 Sep · 11:45 WIB'}
                    </span>
                  </div>

                  <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: 1.35 }}>
                    {news.title}
                  </div>

                  {news.related_tickers && news.related_tickers.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '2px', flexWrap: 'wrap' }}>
                      {news.related_tickers.map(t => (
                        <span
                          key={t}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTicker && onSelectTicker(t, 'IDX');
                          }}
                          style={{
                            fontSize: '8px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--accent-blue)',
                            background: 'rgba(59, 130, 246, 0.12)',
                            padding: '1px 4px',
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
          </div>
        </div>

      </div>

    </div>
  );
}
