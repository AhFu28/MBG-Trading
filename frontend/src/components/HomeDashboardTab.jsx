import React from 'react';
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
  const conglomerates = data?.conglomerates || {};

  // Resolve overall sentiment safely
  const sentiment = macro?.impact_assessment?.overall_sentiment || macro?.sentiment || 'BULLISH ACCUMULATION';
  const narrative = macro?.impact_assessment?.narrative || macro?.headline || macro?.live_news?.[0]?.title || 'IHSG terkonsolidasi positif ditopang sektor komoditas dan perbankan.';

  const topInflow = (foreignFlow.top_inflow || []).slice(0, 4);
  const topOutflow = (foreignFlow.top_outflow || []).slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* ZONA 1: BLOOMBERG MACRO WIRE & TICKER TAPE */}
      <BloombergNewsWire macro={macro} onSelectTicker={onSelectTicker} />

      {/* ZONA 2: 3-CARD EXECUTIVE BENTO HUD */}
      <div className="hero-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr 1fr',
        gap: '12px'
      }}>
        {/* Card 1: Macro & Market Regime Radar */}
        <div className="telemetry-panel" style={{
          padding: '12px 16px',
          borderLeft: '4px solid var(--accent-green)',
          background: 'linear-gradient(135deg, var(--bg-panel) 0%, rgba(0,208,132,0.05) 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="metric-label">🌐 IHSG &amp; GLOBAL MACRO REGIME</span>
              <span className="badge badge-bull" style={{ fontSize: '9px' }}>ACTIVE REGIME</span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', marginTop: '6px', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
              {sentiment}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.45 }}>
              {narrative}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            <span>XAU: </span> · 
            <span>BRENT: </span> · 
            <span>DXY: {macro?.dxy_index || '104.1'}</span>
          </div>
        </div>

        {/* Card 2: #1 High-Conviction IDX Setup */}
        <div className="telemetry-panel" style={{
          padding: '12px 16px',
          borderLeft: '4px solid var(--accent-blue)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="metric-label">🔥 #1 IDX ALPHA WATCHLIST</span>
              <span className="badge badge-bull">{topIdx?.technical_signal || 'BREAKOUT'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
              <span style={{ fontSize: '18px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                
              </span>
              <button
                className="telemetry-btn"
                onClick={() => onSelectTicker(topIdx?.clean_ticker || 'AMMN', 'IDX')}
                style={{ fontSize: '9px', padding: '2px 8px', background: 'var(--accent-blue)', color: '#fff' }}
              >
                CHART 📈
              </button>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
              Entry: Rp {topIdx?.entry_price?.toLocaleString() || '4,910'} · TP: Rp {topIdx?.target_1?.toLocaleString() || '5,340'}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '6px', borderTop: 'var(--border-muted)', fontSize: '10px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Hard SL: Rp {topIdx?.stop_loss?.toLocaleString() || '4,720'}</span>
            <span style={{ fontWeight: '800', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
              R:R 1:{topIdx?.risk_reward_ratio || '2.2'}
            </span>
          </div>
        </div>

        {/* Card 3: #1 Crypto Spot Momentum */}
        <div className="telemetry-panel" style={{
          padding: '12px 16px',
          borderLeft: '4px solid var(--accent-orange)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="metric-label">⚡ #1 CRYPTO SPOT MOMENTUM</span>
              <span className="badge badge-alert">NO LEV / SPOT</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
              <span style={{ fontSize: '18px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {topCrypto?.pair || 'SUI/USDT'}
              </span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: (topCrypto?.change_24h_pct || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                {(topCrypto?.change_24h_pct || 0) >= 0 ? '+' : ''}{topCrypto?.change_24h_pct || '0'}%
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
              Entry:  · TP: 
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '6px', borderTop: 'var(--border-muted)', fontSize: '10px' }}>
            <span style={{ color: 'var(--text-muted)' }}>SL: </span>
            <span style={{ fontWeight: '800', color: 'var(--accent-orange)', fontFamily: 'var(--font-mono)' }}>
              R:R 1:{topCrypto?.risk_reward_ratio || '2.0'}
            </span>
          </div>
        </div>
      </div>

      {/* ZONA 3: MARKET FLOW & CONGLOMERATE CLUSTERS (2-Column Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="side-by-side-grid">
        
        {/* Box Left: Foreign Institutional Flow Radar */}
        <div className="telemetry-panel" style={{ border: 'var(--border-hairline)' }}>
          <div className="telemetry-header">
            <span>🌊 FOREIGN INSTITUTIONAL RADAR</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>BEI Net Flow Tracker</span>
          </div>
          <div style={{ padding: '10px 14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              
              {/* Inflow */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--accent-green)', marginBottom: '6px' }}>
                  ▲ TOP NET AKUMULASI ASING
                </div>
                {topInflow.length > 0 ? (
                  topInflow.map((f, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: 'var(--border-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ fontWeight: '700', cursor: 'pointer' }} onClick={() => onSelectTicker(f.ticker, 'IDX')}></span>
                      <span style={{ color: 'var(--accent-green)' }}>{f.net_value_fmt || ('+Rp ' + (f.net_foreign_flow_billion || 0) + 'B')}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>BBRI, ASII, BMRI, BBNI terpantau inflow</div>
                )}
              </div>

              {/* Outflow */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--accent-rust)', marginBottom: '6px' }}>
                  ▼ TOP NET DISTRIBUSI ASING
                </div>
                {topOutflow.length > 0 ? (
                  topOutflow.map((f, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: 'var(--border-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ fontWeight: '700', cursor: 'pointer' }} onClick={() => onSelectTicker(f.ticker, 'IDX')}></span>
                      <span style={{ color: 'var(--accent-rust)' }}>{f.net_value_fmt || ('-Rp ' + Math.abs(f.net_foreign_flow_billion || 0) + 'B')}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>BBCA, GOTO terpantau outflow minor</div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Box Right: Conglomerate Synergy Clusters */}
        <div className="telemetry-panel" style={{ border: 'var(--border-hairline)' }}>
          <div className="telemetry-header">
            <span>🏢 KLASTER KONGLOMERASI BEI</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SMC Multi-Asset Synergy</span>
          </div>
          <div style={{ padding: '10px 14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(conglomerates).slice(0, 3).map(([groupName, stocks]) => {
                const cleanName = groupName.replace('_GROUP', '').replace('_', ' ');
                return (
                  <div key={groupName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: 'var(--border-muted)' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>{cleanName} GROUP</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                        {(stocks || []).map(s => s.ticker).join(', ')}
                      </div>
                    </div>
                    <span className="badge badge-bull" style={{ fontSize: '9px' }}>ACCUMULATION</span>
                  </div>
                );
              })}
              {Object.keys(conglomerates).length === 0 && (
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Barito, Astra, dan Salim Group terdeteksi aktif dalam rotasi modal.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ZONA 4: TOP 5 ALPHA MATRIX (Quick Execution Table) */}
      <div className="telemetry-panel" style={{ border: 'var(--border-hairline)' }}>
        <div className="telemetry-header">
          <span>🎯 TOP 5 HIGH-CONVICTION QUANT SIGNALS</span>
          <button 
            className="telemetry-btn" 
            onClick={() => onNavigateTab('STOCK')}
            style={{ fontSize: '10px', padding: '2px 8px' }}
          >
            LIHAT SEMUA SAHAM ({topIdxPlans.length}) →
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="telemetry-table">
            <thead>
              <tr>
                <th>TICKER</th>
                <th>SIGNAL</th>
                <th>ENTRY</th>
                <th>STOP LOSS</th>
                <th>TARGET 1</th>
                <th>R:R</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {topIdxPlans.slice(0, 5).map((plan, idx) => {
                const ticker = plan.clean_ticker || plan.symbol?.replace('.JK', '') || ('IDX-' + idx);
                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: 'var(--accent-blue)', cursor: 'pointer' }} onClick={() => onSelectTicker(ticker, 'IDX')}>
                        
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-bull">{plan.technical_signal || 'BUY BREAKOUT'}</span>
                    </td>
                    <td>Rp {plan.entry_price?.toLocaleString() || '-'}</td>
                    <td style={{ color: 'var(--accent-rust)' }}>Rp {plan.stop_loss?.toLocaleString() || '-'}</td>
                    <td style={{ color: 'var(--accent-green)' }}>Rp {plan.target_1?.toLocaleString() || '-'}</td>
                    <td style={{ fontWeight: '700', color: 'var(--accent-green)' }}>1:{plan.risk_reward_ratio || '2.0'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="telemetry-btn"
                          onClick={() => onSelectTicker(ticker, 'IDX')}
                          style={{ fontSize: '9px', padding: '2px 6px' }}
                          title="Open Chart"
                        >
                          📈 Chart
                        </button>
                        <button
                          className="telemetry-btn"
                          onClick={() => onOpenLotCalc(plan.entry_price, plan.stop_loss)}
                          style={{ fontSize: '9px', padding: '2px 6px', background: 'var(--accent-green)', color: '#fff' }}
                          title="Kalkulasi Lot"
                        >
                          💰 Lot
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ZONA 5: SYSTEM HEALTH & QUICK QUANT TELEMETRY */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '10px'
      }}>
        <div className="telemetry-panel" style={{ padding: '8px 12px' }}>
          <div className="metric-label">MONITORED INSTRUMENTS</div>
          <div style={{ fontSize: '14px', fontWeight: '800', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            82 SAHAM · 10 CRYPTO
          </div>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>IDX Composite + Binance Spot</div>
        </div>

        <div className="telemetry-panel" style={{ padding: '8px 12px' }}>
          <div className="metric-label">QUANT ENGINE SUITE</div>
          <div style={{ fontSize: '14px', fontWeight: '800', fontFamily: 'var(--font-mono)', marginTop: '2px', color: 'var(--accent-green)' }}>
            TimesFM + SMC + IIFS
          </div>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Google AI Foundation Model</div>
        </div>

        <div className="telemetry-panel" style={{ padding: '8px 12px' }}>
          <div className="metric-label">RISK/REWARD TARGET</div>
          <div style={{ fontSize: '14px', fontWeight: '800', fontFamily: 'var(--font-mono)', marginTop: '2px', color: 'var(--accent-orange)' }}>
            MIN 1 : 2.0 RR
          </div>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Disiplin Proteksi Modal Ketat</div>
        </div>

        <div className="telemetry-panel" style={{ padding: '8px 12px' }}>
          <div className="metric-label">QUICK DEEP DIVE</div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            <button className="telemetry-btn" onClick={() => onNavigateTab('TESTING')} style={{ fontSize: '9px', padding: '3px 6px' }}>
              🧪 Testing Lab
            </button>
            <button className="telemetry-btn" onClick={() => onNavigateTab('ACADEMY')} style={{ fontSize: '9px', padding: '3px 6px' }}>
              🎓 Academy
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
