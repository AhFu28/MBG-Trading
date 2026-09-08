import React from 'react';

export default function MacroAlertBanner({ macro }) {
  if (!macro) return null;

  const affectedStocks = macro.idx_affected_stocks || [];

  return (
    <div className="telemetry-panel" style={{ marginBottom: '16px', borderLeft: '4px solid var(--accent-orange)' }}>
      <div className="telemetry-header" style={{ background: '#fff7f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--accent-orange)' }}></span>
          <span style={{ color: 'var(--accent-orange)' }}>24/7 GLOBAL MACRO &amp; US IMPACT RADAR</span>
          <span className="badge badge-alert">{macro.event_category || 'GLOBAL'}</span>
          <span className="badge" style={{ background: '#2a2b30', color: '#fff' }}>{macro.severity || 'NORMAL'}</span>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
          SYNCED: {new Date(macro.updated_at || Date.now()).toLocaleTimeString()}
        </span>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Main Headline & Context */}
          <div style={{ flex: '1 1 500px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px', color: '#1a1b1f' }}>
              {macro.headline}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
              {macro.full_narrative}
            </p>

            {/* Affected Stocks Badges */}
            {affectedStocks.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  IDX IMPACTED ASSETS:
                </span>
                {affectedStocks.map((item, idx) => (
                  <span 
                    key={idx} 
                    className={`badge ${item.impact === 'BULLISH' ? 'badge-bull' : item.impact === 'BEARISH' ? 'badge-bear' : 'badge-blue'}`}
                    title={item.reason}
                  >
                    ${item.ticker} ({item.impact}): {item.reason}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Macro Ticker Indicators Grid */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div className="metric-box" style={{ minWidth: '110px' }}>
              <div className="metric-label">GOLD (XAU)</div>
              <div className="metric-value" style={{ color: macro.gold_change_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                ${macro.gold_price || 0}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {macro.gold_change_pct >= 0 ? `+${macro.gold_change_pct}%` : `${macro.gold_change_pct}%`}
              </div>
            </div>

            <div className="metric-box" style={{ minWidth: '110px' }}>
              <div className="metric-label">BRENT CRUDE</div>
              <div className="metric-value" style={{ color: macro.brent_oil_change_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                ${macro.brent_oil_price || 0}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {macro.brent_oil_change_pct >= 0 ? `+${macro.brent_oil_change_pct}%` : `${macro.brent_oil_change_pct}%`}
              </div>
            </div>

            <div className="metric-box" style={{ minWidth: '100px' }}>
              <div className="metric-label">DXY INDEX</div>
              <div className="metric-value">{macro.dxy_index || 0}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>US DOLLAR</div>
            </div>

            <div className="metric-box" style={{ minWidth: '100px' }}>
              <div className="metric-label">US 10Y YIELD</div>
              <div className="metric-value">{macro.us10y_yield || 0}%</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>TREASURY</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
