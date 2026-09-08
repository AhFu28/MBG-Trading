import React from 'react';

export default function CryptoSpot10({ cryptoList = [], onOpenChart }) {
  if (cryptoList.length === 0) {
    return <div className="telemetry-panel" style={{ padding: '20px' }}>Scanning Top 10 Crypto Spot pairs...</div>;
  }

  return (
    <div>
      <div className="telemetry-panel" style={{ marginBottom: '12px', background: '#f6f9fc', padding: '10px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: '700', color: 'var(--accent-blue)', fontSize: '13px' }}>
              ⚡ 10 SPOT TRADE RECOMMENDED PAIRS (USDT)
            </span>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Spot Market Only (No Leverage / No Liquidation Risk). Every plan includes Entry Zone, TP1, TP2, Hard SL, and R:R Ratio.
            </p>
          </div>
          <span className="badge badge-blue">SPOT EXECUTION READY</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
        {cryptoList.map((item) => (
          <div key={item.pair} className="telemetry-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            
            {/* Card Header */}
            <div className="telemetry-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ 
                  background: 'var(--text-primary)', 
                  color: 'var(--text-inverse)', 
                  padding: '1px 5px', 
                  fontSize: '10px', 
                  fontWeight: '700' 
                }}>
                  #{item.rank}
                </span>
                <span style={{ fontSize: '13px', fontWeight: '700' }}>{item.pair}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span className={`badge ${item.conviction === 'HIGH' ? 'badge-bull' : 'badge-alert'}`}>
                  {item.conviction}
                </span>
                <button 
                  className="telemetry-btn"
                  style={{ padding: '1px 6px', fontSize: '9px', background: 'var(--accent-blue)', color: '#fff' }}
                  onClick={() => onOpenChart(item.pair.replace('/', ''), 'CRYPTO')}
                >
                  📈 CHART
                </button>
              </div>
            </div>

            {/* Card Body */}
            <div style={{ padding: '12px', flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* Price & Change Banner */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: 'var(--border-muted)', paddingBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CURRENT PRICE</div>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>${item.current_price}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>24H CHANGE</div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '700',
                    color: item.change_24h_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)'
                  }}>
                    {item.change_24h_pct >= 0 ? `+${item.change_24h_pct}%` : `${item.change_24h_pct}%`}
                  </div>
                </div>
              </div>

              {/* Execution Matrix */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
                <div className="metric-box">
                  <div className="metric-label">ENTRY ZONE</div>
                  <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--text-primary)' }}>
                    ${item.entry_low} - ${item.entry_high}
                  </div>
                </div>
                <div className="metric-box" style={{ background: '#fdf2f2', border: '1px solid #eccaca' }}>
                  <div className="metric-label" style={{ color: 'var(--accent-rust)' }}>HARD STOP LOSS</div>
                  <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--accent-rust)' }}>
                    ${item.stop_loss}
                  </div>
                </div>
                <div className="metric-box" style={{ background: '#f0f9f3', border: '1px solid #cce8d4' }}>
                  <div className="metric-label" style={{ color: 'var(--accent-green)' }}>TARGET 1 (TP1)</div>
                  <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--accent-green)' }}>
                    ${item.take_profit_1}
                  </div>
                </div>
                <div className="metric-box" style={{ background: '#f0f9f3', border: '1px solid #cce8d4' }}>
                  <div className="metric-label" style={{ color: 'var(--accent-green)' }}>TARGET 2 (SWING)</div>
                  <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--accent-green)' }}>
                    ${item.take_profit_2}
                  </div>
                </div>
              </div>

              {/* Risk / Reward & Setup Type */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-panel-subtle)', padding: '6px 8px', border: 'var(--border-muted)' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>
                  SETUP: <span style={{ color: 'var(--text-primary)' }}>{item.setup_type}</span>
                </span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-blue)' }}>
                  R:R RATIO 1 : {item.risk_reward_ratio}
                </span>
              </div>

              {/* Thesis & Invalidation */}
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                <p style={{ marginBottom: '4px' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Thesis:</strong> {item.catalyst_thesis}
                </p>
                <p style={{ color: 'var(--accent-rust)' }}>
                  <strong>Cut Rule:</strong> {item.invalidation_rule}
                </p>
              </div>

            </div>

            {/* Card Footer Status */}
            <div style={{ 
              background: 'var(--bg-panel-subtle)', 
              borderTop: 'var(--border-muted)', 
              padding: '6px 12px', 
              fontSize: '10px', 
              color: 'var(--text-muted)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>DISCIPLINE: SPOT ONLY</span>
              <span style={{ fontWeight: '700', color: 'var(--accent-orange)' }}>AWAITING HUMAN APPROVAL</span>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
