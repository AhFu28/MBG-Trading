import React from 'react';

export default function BloombergNewsWire({ macro, onSelectTicker }) {
  if (!macro) return null;

  const affectedStocks = macro.idx_affected_stocks || [];
  const goldChange = Number(macro.gold_change_pct || 0);
  const oilChange = Number(macro.brent_oil_change_pct || 0);
  const dxyChange = Number(macro.dxy_change_pct || 0);

  return (
    <div className="telemetry-panel" style={{ marginBottom: '14px', border: '1px solid #1c1d22' }}>
      
      {/* 1. Bloomberg Streaming Macro Ticker Tape */}
      <div style={{
        background: '#1c1d22',
        color: '#faf9f5',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '11px',
        letterSpacing: '0.04em'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', background: '#ff3b30', display: 'inline-block', borderRadius: '50%' }}></span>
          <strong style={{ color: '#ff9500' }}>BLOOMBERG MACRO WIRE</strong>
          <span style={{ color: '#8e8e93', fontSize: '10px' }}>// CONTINUOUS 24/7 FEED</span>
        </div>

        {/* Streaming Ticker Bellwethers */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ color: '#8e8e93' }}>XAU/USD:</span>
            <span style={{ fontWeight: '700' }}>${macro.gold_price}</span>
            <span style={{ color: goldChange >= 0 ? '#34c759' : '#ff3b30' }}>
              ({goldChange >= 0 ? `+${goldChange}%` : `${goldChange}%`})
            </span>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ color: '#8e8e93' }}>BRENT:</span>
            <span style={{ fontWeight: '700' }}>${macro.brent_oil_price}</span>
            <span style={{ color: oilChange >= 0 ? '#34c759' : '#ff3b30' }}>
              ({oilChange >= 0 ? `+${oilChange}%` : `${oilChange}%`})
            </span>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ color: '#8e8e93' }}>DXY:</span>
            <span style={{ fontWeight: '700' }}>{macro.dxy_index}</span>
            <span style={{ color: dxyChange >= 0 ? '#34c759' : '#ff3b30' }}>
              ({dxyChange >= 0 ? `+${dxyChange}%` : `${dxyChange}%`})
            </span>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ color: '#8e8e93' }}>US10Y:</span>
            <span style={{ fontWeight: '700' }}>{macro.us10y_yield}%</span>
          </div>

        </div>
      </div>

      {/* 2. Breaking News Narrative Box */}
      <div style={{ padding: '10px 14px', background: '#ffffff', borderTop: '1px solid #e5e5ea' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          
          <div style={{ flex: '1 1 500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge" style={{ background: '#ff9500', color: '#ffffff', border: 'none', fontSize: '9px', fontWeight: '700' }}>
                FLASH HEADLINE
              </span>
              <span style={{ fontSize: '10px', color: '#8e8e93' }}>
                {macro.source || 'Global Macro Intelligence Engine'} · SYNCED {new Date(macro.updated_at || Date.now()).toLocaleTimeString('id-ID')} WIB
              </span>
            </div>

            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#1c1d22', margin: '2px 0 4px 0' }}>
              ⚡ {macro.headline}
            </h3>

            <p style={{ fontSize: '11px', color: '#48484a', margin: '0 0 8px 0', lineHeight: 1.4 }}>
              {macro.full_narrative}
            </p>

            {/* Clickable Impacted IDX Asset Tags */}
            {affectedStocks.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#8e8e93' }}>
                  AFFECTED ASSETS (CLICK TO CHART):
                </span>
                {affectedStocks.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectTicker(item.ticker, 'IDX')}
                    className="telemetry-btn"
                    style={{
                      padding: '2px 6px',
                      fontSize: '10px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      borderColor: item.impact === 'BULLISH' ? '#34c759' : '#ff3b30'
                    }}
                    title={item.reason}
                  >
                    <span>{item.impact === 'BULLISH' ? '🟢' : '🔴'}</span>
                    <strong>${item.ticker}</strong>
                    <span style={{ color: '#8e8e93', fontSize: '9px' }}>({item.impact})</span>
                  </button>
                ))}
              </div>
            )}

          </div>

          {/* Quick Sentiment Status */}
          <div style={{ textAlign: 'right', minWidth: '120px' }}>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#8e8e93', fontWeight: '700' }}>
              EVENT CATEGORY
            </div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#1c1d22', marginTop: '2px' }}>
              {macro.event_category || 'GLOBAL_MACRO'}
            </div>
            <div style={{ marginTop: '4px' }}>
              <span className={`badge ${macro.severity === 'HIGH' || macro.severity === 'CRITICAL' ? 'badge-bear' : 'badge-bull'}`}>
                SEVERITY: {macro.severity || 'NORMAL'}
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
