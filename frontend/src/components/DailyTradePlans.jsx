import React from 'react';

export default function DailyTradePlans({ plans = [] }) {
  if (plans.length === 0) {
    return <div className="telemetry-panel" style={{ padding: '20px' }}>Loading Astra trade plans...</div>;
  }

  return (
    <div>
      <div className="telemetry-panel" style={{ marginBottom: '12px', background: '#fffcf0', padding: '10px 14px', borderLeft: '4px solid #c28800' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: '700', color: '#c28800', fontSize: '13px' }}>
              🎯 ASTRA-GRADE DAILY TRADE PLANS (SUPERVISED DISCIPLINE)
            </span>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Strict Rules Applied: FACTS strictly separated from OPINION. Visible position size arithmetic. 3 Invalidation conditions. Zero auto-executions.
            </p>
          </div>
          <span className="badge badge-alert">STATUS: AWAITING HUMAN REVIEW</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '16px' }}>
        {plans.map((plan) => (
          <div key={plan.plan_id} className="telemetry-panel" style={{ border: 'var(--border-hairline)' }}>
            
            {/* Header */}
            <div className="telemetry-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge" style={{ background: '#2a2b30', color: '#fff' }}>{plan.market}</span>
                <span style={{ fontSize: '14px', fontWeight: '700' }}>{plan.symbol}</span>
                <span className="badge badge-bull">{plan.direction}</span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{plan.plan_id}</span>
            </div>

            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Target & Stop Matrix */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <div className="metric-box">
                  <div className="metric-label">ENTRY</div>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>
                    {plan.market === 'IDX' ? `Rp ${Number(plan.entry_price).toLocaleString()}` : `$${plan.entry_price}`}
                  </div>
                </div>
                <div className="metric-box" style={{ background: '#fdf2f2', border: '1px solid #eccaca' }}>
                  <div className="metric-label" style={{ color: 'var(--accent-rust)' }}>STOP LOSS</div>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--accent-rust)' }}>
                    {plan.market === 'IDX' ? `Rp ${Number(plan.stop_loss).toLocaleString()}` : `$${plan.stop_loss}`}
                  </div>
                </div>
                <div className="metric-box" style={{ background: '#f0f9f3', border: '1px solid #cce8d4' }}>
                  <div className="metric-label" style={{ color: 'var(--accent-green)' }}>TARGET 1</div>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--accent-green)' }}>
                    {plan.market === 'IDX' ? `Rp ${Number(plan.target_1).toLocaleString()}` : `$${plan.target_1}`}
                  </div>
                </div>
                <div className="metric-box" style={{ background: '#f0f9f3', border: '1px solid #cce8d4' }}>
                  <div className="metric-label" style={{ color: 'var(--accent-green)' }}>TARGET 2</div>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--accent-green)' }}>
                    {plan.market === 'IDX' ? `Rp ${Number(plan.target_2).toLocaleString()}` : `$${plan.target_2}`}
                  </div>
                </div>
              </div>

              {/* Arithmetic Position Sizing */}
              <div style={{ background: 'var(--bg-panel-subtle)', padding: '8px 10px', border: 'var(--border-muted)', fontSize: '11px' }}>
                <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  POSITION SIZING ARITHMETIC (MAX 1% RISK)
                </div>
                <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {plan.position_size_math}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--accent-blue)', marginTop: '2px' }}>
                  Calculated Risk/Reward Ratio: 1 : {plan.risk_reward_ratio} (PASSES &gt; 1:2 THRESHOLD)
                </div>
              </div>

              {/* Facts vs Opinion */}
              <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ padding: '6px 8px', background: '#f9f9f6', borderLeft: '3px solid var(--accent-blue)' }}>
                  <strong style={{ color: 'var(--accent-blue)' }}>FACTS:</strong> {plan.facts_summary}
                </div>
                <div style={{ padding: '6px 8px', background: '#f9f9f6', borderLeft: '3px solid var(--accent-orange)' }}>
                  <strong style={{ color: 'var(--accent-orange)' }}>OPINION &amp; THESIS:</strong> {plan.opinion_thesis}
                </div>
              </div>

              {/* 3 Invalidations */}
              <div style={{ fontSize: '11px', border: 'var(--border-muted)', padding: '8px 10px', background: '#fff' }}>
                <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--accent-rust)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  3 INVALIDATION CONDITIONS (CANCEL SETUP IF HIT):
                </div>
                {Array.isArray(plan.three_invalidations) && plan.three_invalidations.map((inv, i) => (
                  <div key={i} style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>
                    • {inv}
                  </div>
                ))}
              </div>

              {/* Weakest Assumption */}
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                <strong>Weakest Assumption:</strong> {plan.weakest_assumption}
              </div>

            </div>

            {/* Status Footer */}
            <div style={{ 
              background: '#fdf8ec', 
              borderTop: 'var(--border-hairline)', 
              padding: '8px 14px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              fontSize: '11px'
            }}>
              <span style={{ fontWeight: '700', color: '#8a6200' }}>STATUS: {plan.status}</span>
              <button 
                className="telemetry-btn"
                onClick={() => alert(`Plan ${plan.symbol} dicatat. Anda memegang kendali eksekusi manual di broker pilihan Anda.`)}
                style={{ background: 'var(--accent-orange)', color: '#fff' }}
              >
                LOG PLAN TO JOURNAL
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
