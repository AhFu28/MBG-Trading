import React, { useState } from 'react';
import BloombergNewsWire from './BloombergNewsWire.jsx';

export default function HomeDashboardTab({
  data,
  onSelectTicker,
  onOpenLotCalc,
  onNavigateTab
}) {
  const topIdxPlans = (data?.daily_trade_plans || []).filter(p => p.market === 'IDX');
  const topCryptoPicks = data?.crypto_spot_10 || [];
  const topIdx = topIdxPlans[0];
  const topCrypto = topCryptoPicks[0];
  const macro = data?.macro_telemetry || {};
  const foreignFlow = data?.foreign_flow || {};
  const bandarmology = data?.bandarmology_iifs || {};

  // Resolve overall sentiment safely
  const sentiment = macro?.impact_assessment?.overall_sentiment || macro?.sentiment || 'BULLISH ACCUMULATION';
  const narrative = macro?.impact_assessment?.narrative || macro?.headline || macro?.live_news?.[0]?.title || 'IHSG terkonsolidasi positif ditopang sektor komoditas dan perbankan.';

  const topInflow = (foreignFlow.top_inflow || []).slice(0, 4);
  const topOutflow = (foreignFlow.top_outflow || []).slice(0, 4);

  // Helper formatter for IDR flows (Fix: reading foreign_net_val_idr)
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

  // Compute live net today from bundle inflow & outflow
  const netInflowSum = (foreignFlow.top_inflow || []).reduce((acc, c) => acc + (Number(c.foreign_net_val_idr) || 0), 0);
  const netOutflowSum = (foreignFlow.top_outflow || []).reduce((acc, c) => acc + (Number(c.foreign_net_val_idr) || 0), 0);
  const totalNetForeign = netInflowSum + netOutflowSum;

  // Filter & limit state for Top Quant Signals Table
  const [signalTab, setSignalTab] = useState('ALL'); // 'ALL' | 'IDX' | 'CRYPTO'
  const [rowLimit, setRowLimit] = useState('ALL');   // 5 | 10 | 'ALL'

  // Normalizing IDX trade plans
  const normalizedIdx = topIdxPlans.map((p, idx) => ({
    id: `idx-${p.clean_ticker || idx}`,
    market: 'IDX',
    symbol: p.clean_ticker || p.symbol?.replace('.JK', '') || `IDX-${idx}`,
    signal: p.technical_signal || 'BUY BREAKOUT',
    entry: `Rp ${Number(p.entry_price || 0).toLocaleString()}`,
    sl: `Rp ${Number(p.stop_loss || 0).toLocaleString()}`,
    tp: `Rp ${Number(p.target_1 || 0).toLocaleString()}`,
    rr: `1:${p.risk_reward_ratio || '2.0'}`,
    raw_entry: p.entry_price,
    raw_sl: p.stop_loss
  }));

  // Normalizing Crypto spot trade plans
  const normalizedCrypto = topCryptoPicks.map((c, idx) => ({
    id: `crypto-${c.pair || idx}`,
    market: 'CRYPTO',
    symbol: c.pair || `CRYPTO-${idx}`,
    signal: c.setup_type?.replace(/_/g, ' ') || 'SPOT ACCUMULATION',
    entry: `$${c.entry_high || c.current_price || '-'}`,
    sl: `$${c.stop_loss || '-'}`,
    tp: `$${c.take_profit_1 || '-'}`,
    rr: `1:${c.risk_reward_ratio || '2.0'}`,
    raw_entry: c.entry_high || c.current_price,
    raw_sl: c.stop_loss
  }));

  const allSignals = signalTab === 'IDX'
    ? normalizedIdx
    : signalTab === 'CRYPTO'
      ? normalizedCrypto
      : [...normalizedIdx, ...normalizedCrypto];

  const visibleSignals = rowLimit === 'ALL' ? allSignals : allSignals.slice(0, Number(rowLimit));

  // Smart money / Bandarmology accumulating picks (replacing static conglomerate)
  const accumulatingStocks = Object.values(bandarmology)
    .filter(b => b.is_accumulating && (b.estimated_flow_idr || 0) > 0)
    .sort((a, b) => (b.estimated_flow_idr || 0) - (a.estimated_flow_idr || 0))
    .slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

      {/* ZONA 1: MBG MACRO INTELLIGENCE WIRE (Compact Single-Strip) */}
      <BloombergNewsWire macro={macro} onSelectTicker={onSelectTicker} />

      {/* ZONA 2: 3-CARD EXECUTIVE BENTO HUD */}
      <div className="hero-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1.3fr 1fr 1fr',
        gap: '8px'
      }}>
        {/* Card 1: Macro & Market Regime Radar */}
        <div className="telemetry-panel" style={{
          padding: '8px 12px',
          borderLeft: '3px solid var(--accent-green)',
          background: 'linear-gradient(135deg, var(--bg-panel) 0%, rgba(0,208,132,0.05) 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="metric-label" style={{ fontSize: '9px' }}>🌐 IHSG &amp; GLOBAL REGIME</span>
              <span className="badge badge-bull" style={{ fontSize: '8px', padding: '1px 4px' }}>ACTIVE REGIME</span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: '800', marginTop: '4px', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
              {sentiment}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.35 }}>
              {narrative.length > 90 ? narrative.slice(0, 90) + '...' : narrative}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px', fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            <span>XAU: ${macro?.gold_price || '2,340'}</span> · 
            <span>BRENT: ${macro?.brent_oil || '82.5'}</span> · 
            <span>DXY: {macro?.dxy_index || '104.1'}</span>
          </div>
        </div>

        {/* Card 2: #1 IDX Alpha Watchlist */}
        <div className="telemetry-panel" style={{
          padding: '8px 12px',
          borderLeft: '3px solid var(--accent-green)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="metric-label" style={{ fontSize: '9px' }}>🔥 #1 IDX ALPHA WATCHLIST</span>
              <span className="badge badge-bull" style={{ fontSize: '8px', padding: '1px 4px' }}>{topIdx?.technical_signal || 'BREAKOUT'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
              <span style={{ fontSize: '16px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {topIdx?.clean_ticker || topIdx?.symbol || 'SCANNING...'}
              </span>
              {topIdx && (
                <button
                  className="telemetry-btn"
                  onClick={() => onSelectTicker(topIdx?.clean_ticker || topIdx?.symbol, 'IDX')}
                  style={{ fontSize: '8px', padding: '1px 6px', background: 'var(--accent-blue)', color: '#fff' }}
                >
                  CHART 📈
                </button>
              )}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>
              Entry: Rp {topIdx?.entry_price ? Number(topIdx.entry_price).toLocaleString() : '-'} · TP: Rp {topIdx?.target_1 ? Number(topIdx.target_1).toLocaleString() : '-'}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '4px', borderTop: 'var(--border-muted)', fontSize: '9px' }}>
            <span style={{ color: 'var(--text-muted)' }}>SL: Rp {topIdx?.stop_loss ? Number(topIdx.stop_loss).toLocaleString() : '-'}</span>
            <span style={{ fontWeight: '800', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
              R:R 1:{topIdx?.risk_reward_ratio || '-'}
            </span>
          </div>
        </div>

        {/* Card 3: #1 Crypto Spot Momentum */}
        <div className="telemetry-panel" style={{
          padding: '8px 12px',
          borderLeft: '3px solid var(--accent-orange)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="metric-label" style={{ fontSize: '9px' }}>⚡ #1 CRYPTO SPOT MOMENTUM</span>
              <span className="badge badge-alert" style={{ fontSize: '8px', padding: '1px 4px' }}>NO LEV / SPOT</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
              <span style={{ fontSize: '16px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {topCrypto?.pair || 'SCANNING...'}
              </span>
              <span style={{ fontSize: '10px', fontWeight: '700', color: (topCrypto?.change_24h_pct || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                {(topCrypto?.change_24h_pct || 0) >= 0 ? '+' : ''}{topCrypto?.change_24h_pct !== undefined ? topCrypto.change_24h_pct : '0.00'}%
              </span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>
              Entry: ${topCrypto?.current_price || topCrypto?.entry_high || '-'} · TP: ${topCrypto?.take_profit_1 || '-'}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '4px', borderTop: 'var(--border-muted)', fontSize: '9px' }}>
            <span style={{ color: 'var(--text-muted)' }}>SL: ${topCrypto?.stop_loss || '-'}</span>
            <span style={{ fontWeight: '800', color: 'var(--accent-orange)', fontFamily: 'var(--font-mono)' }}>
              R:R 1:{topCrypto?.risk_reward_ratio || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* ZONA 3: INSTITUTIONAL FLOW DUAL RADAR (Foreign vs Domestic Bandarmology) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }} className="side-by-side-grid">
        
        {/* Box Left: Foreign Capital Flow Radar */}
        <div className="telemetry-panel" style={{ border: 'var(--border-hairline)' }}>
          <div className="telemetry-header" style={{ padding: '6px 10px', fontSize: '11px' }}>
            <span>🌐 IDX FOREIGN CAPITAL FLOW</span>
            <span className={`badge ${totalNetForeign >= 0 ? 'badge-bull' : 'badge-bear'}`} style={{ fontSize: '8px', padding: '1px 5px' }}>
              {totalNetForeign >= 0 ? 'NET BUY' : 'NET SELL'}
            </span>
          </div>
          <div style={{ padding: '8px 10px' }}>
            {/* Macro Net Stats Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {/* Inflow */}
              <div>
                <div style={{ fontSize: '9px', fontWeight: '800', color: 'var(--accent-green)', marginBottom: '4px' }}>
                  ▲ TOP INFLOW (BUY)
                </div>
                {topInflow.length > 0 ? (
                  topInflow.map((f, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: 'var(--border-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ fontWeight: '700', cursor: 'pointer', color: 'var(--accent-blue)' }} onClick={() => onSelectTicker(f.ticker, 'IDX')}>${f.ticker}</span>
                      <span style={{ color: 'var(--accent-green)' }}>{formatFlowIdr(f.foreign_net_val_idr)}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Menunggu kalkulasi stream...</div>
                )}
              </div>

              {/* Outflow */}
              <div>
                <div style={{ fontSize: '9px', fontWeight: '800', color: 'var(--accent-rust)', marginBottom: '4px' }}>
                  ▼ TOP OUTFLOW (SELL)
                </div>
                {topOutflow.length > 0 ? (
                  topOutflow.map((f, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: 'var(--border-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ fontWeight: '700', cursor: 'pointer', color: 'var(--accent-blue)' }} onClick={() => onSelectTicker(f.ticker, 'IDX')}>${f.ticker}</span>
                      <span style={{ color: 'var(--accent-rust)' }}>{formatFlowIdr(f.foreign_net_val_idr)}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Menunggu kalkulasi stream...</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Box Right: Domestic Smart Money / Bandarmology IIFS Accumulation */}
        <div className="telemetry-panel" style={{ border: 'var(--border-hairline)' }}>
          <div className="telemetry-header" style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🐳 BANDARMOLOGY IIFS (SMART MONEY)</span>
              <span className="badge badge-bull" style={{ fontSize: '8px', padding: '1px 4px' }}>DOMESTIC FLOW</span>
            </div>
            <button
              className="telemetry-btn"
              onClick={() => onNavigateTab?.('STOCK')}
              style={{ fontSize: '9px', padding: '1px 6px' }}
            >
              RADAR LENGKAP →
            </button>
          </div>
          <div style={{ padding: '8px 10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {accumulatingStocks.map((b, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: 'var(--border-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                  <div>
                    <span style={{ fontWeight: '800', cursor: 'pointer', color: 'var(--accent-blue)' }} onClick={() => onSelectTicker(b.ticker, 'IDX')}>
                      ${b.ticker}
                    </span>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                      MFI {Math.round(b.mfi_value)} · OBV {b.obv_trend}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: '700', color: 'var(--accent-green)' }}>
                      +Rp {((b.estimated_flow_idr || 0) / 1e9).toFixed(1)}B
                    </span>
                    <span className="badge badge-bull" style={{ fontSize: '8px', marginLeft: '6px', padding: '0 3px' }}>
                      {b.flow_classification.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
              {accumulatingStocks.length === 0 && (
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                  Smart money flow sedang dievaluasi oleh IIFS Engine...
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ZONA 4: CROSS-ASSET HIGH-CONVICTION QUANT SIGNALS MATRIX */}
      <div className="telemetry-panel" style={{ border: 'var(--border-hairline)' }}>
        <div className="telemetry-header" style={{ padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: '700', fontSize: '11px' }}>🎯 HIGH-CONVICTION QUANT SIGNALS</span>
            
            {/* Filter Tabs: ALL / IDX / CRYPTO */}
            <div style={{ display: 'flex', gap: '3px', background: 'var(--bg-panel-dark)', padding: '2px 4px', borderRadius: '3px' }}>
              {[
                { id: 'ALL', label: `ALL (${allSignals.length})` },
                { id: 'IDX', label: `SAHAM IDX (${normalizedIdx.length})` },
                { id: 'CRYPTO', label: `CRYPTO SPOT (${normalizedCrypto.length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSignalTab(tab.id)}
                  style={{
                    background: signalTab === tab.id ? 'var(--accent-blue)' : 'transparent',
                    color: signalTab === tab.id ? '#ffffff' : '#8e8e93',
                    border: 'none',
                    padding: '2px 6px',
                    fontSize: '9px',
                    fontWeight: '700',
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Limit Toggle: 5 / 10 / ALL */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>VIEW:</span>
            {['5', '10', 'ALL'].map(limit => (
              <button
                key={limit}
                onClick={() => setRowLimit(limit)}
                style={{
                  background: rowLimit === limit ? 'var(--accent-green)' : 'var(--bg-panel-subtle)',
                  color: rowLimit === limit ? '#08090b' : 'var(--text-primary)',
                  fontWeight: rowLimit === limit ? '800' : '500',
                  border: 'var(--border-hairline)',
                  padding: '1px 6px',
                  fontSize: '9px',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}
              >
                {limit}
              </button>
            ))}
          </div>

        </div>

        {/* Scrollable Compact Table */}
        <div style={{ maxHeight: '250px', overflowY: 'auto', overflowX: 'auto' }}>
          <table className="telemetry-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1 }}>
              <tr>
                <th style={{ padding: '5px 8px', fontSize: '10px' }}>TICKER / PAIR</th>
                <th style={{ padding: '5px 8px', fontSize: '10px' }}>ASSET</th>
                <th style={{ padding: '5px 8px', fontSize: '10px' }}>SIGNAL SETUP</th>
                <th style={{ padding: '5px 8px', fontSize: '10px' }}>ENTRY</th>
                <th style={{ padding: '5px 8px', fontSize: '10px' }}>STOP LOSS</th>
                <th style={{ padding: '5px 8px', fontSize: '10px' }}>TARGET 1</th>
                <th style={{ padding: '5px 8px', fontSize: '10px' }}>R:R</th>
                <th style={{ padding: '5px 8px', fontSize: '10px' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {visibleSignals.map((plan, idx) => (
                <tr key={plan.id || idx}>
                  <td style={{ fontWeight: '800', fontFamily: 'var(--font-mono)', padding: '5px 8px' }}>
                    <span
                      style={{ color: 'var(--accent-blue)', cursor: 'pointer' }}
                      onClick={() => onSelectTicker(plan.symbol, plan.market)}
                    >
                      {plan.symbol}
                    </span>
                  </td>
                  <td style={{ padding: '5px 8px' }}>
                    <span className={plan.market === 'IDX' ? 'badge badge-bull' : 'badge badge-alert'} style={{ fontSize: '8px', padding: '1px 4px' }}>
                      {plan.market}
                    </span>
                  </td>
                  <td style={{ padding: '5px 8px' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '8px', padding: '1px 4px' }}>
                      {plan.signal}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '5px 8px' }}>{plan.entry}</td>
                  <td style={{ color: 'var(--accent-rust)', fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '5px 8px' }}>{plan.sl}</td>
                  <td style={{ color: 'var(--accent-green)', fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '5px 8px' }}>{plan.tp}</td>
                  <td style={{ fontWeight: '700', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '5px 8px' }}>
                    {plan.rr}
                  </td>
                  <td style={{ padding: '5px 8px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="telemetry-btn"
                        onClick={() => onSelectTicker(plan.symbol, plan.market)}
                        style={{ fontSize: '8px', padding: '1px 5px' }}
                        title="Open Interactive Chart"
                      >
                        📈 Chart
                      </button>
                      {plan.market === 'IDX' ? (
                        <button
                          className="telemetry-btn"
                          onClick={() => onOpenLotCalc(plan.raw_entry, plan.raw_sl)}
                          style={{ fontSize: '8px', padding: '1px 5px', background: 'var(--accent-green)', color: '#08090b', fontWeight: '700' }}
                          title="Kalkulasi Lot Fraksi OJK"
                        >
                          💰 Lot
                        </button>
                      ) : (
                        <button
                          className="telemetry-btn"
                          onClick={() => onOpenLotCalc(plan.raw_entry, plan.raw_sl)}
                          style={{ fontSize: '8px', padding: '1px 5px', background: 'var(--accent-orange)', color: '#08090b', fontWeight: '700' }}
                          title="Hitung Sizing Modal USDT"
                        >
                          ⚡ Sizing
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ZONA 5: COMPACT ZERO-SCROLL TELEMETRY STRIP */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-panel)',
        padding: '6px 12px',
        borderRadius: '4px',
        border: 'var(--border-hairline)',
        fontSize: '10px',
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
          <button className="telemetry-btn" onClick={() => onNavigateTab('TESTING')} style={{ fontSize: '9px', padding: '2px 8px' }}>
            🧪 Testing Lab
          </button>
          <button className="telemetry-btn" onClick={() => onNavigateTab('ACADEMY')} style={{ fontSize: '9px', padding: '2px 8px' }}>
            🎓 Academy
          </button>
        </div>
      </div>

    </div>
  );
}
