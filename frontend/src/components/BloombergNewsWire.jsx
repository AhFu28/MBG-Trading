import React, { useState, useEffect } from 'react';

export default function BloombergNewsWire({ macro, onSelectTicker }) {
  if (!macro) return null;

  const affectedStocks = macro.idx_affected_stocks || [];
  const goldChange = Number(macro.gold_change_pct || 0);
  const oilChange = Number(macro.brent_oil_change_pct || 0);
  const dxyChange = Number(macro.dxy_change_pct || 0);

  // Multi-headline support
  const headlines = Array.isArray(macro.headlines) && macro.headlines.length > 0 
    ? macro.headlines 
    : [macro.headline || 'IHSG Menguat Ditopang Sektor Keuangan dan Arus Modal Asing'];

  const [headlineIndex, setHeadlineIndex] = useState(0);

  useEffect(() => {
    if (headlines.length <= 1) return;
    const timer = setInterval(() => {
      setHeadlineIndex(prev => (prev + 1) % headlines.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [headlines.length]);

  return (
    <div className='telemetry-panel' style={{ marginBottom: '14px', border: 'var(--border-hairline)' }}>
      
      {/* 1. Bloomberg Streaming Macro Ticker Tape */}
      <div style={{
        background: 'var(--bg-panel-dark)',
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
              ({goldChange >= 0 ? '+' + goldChange + '%' : goldChange + '%'})
            </span>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ color: '#8e8e93' }}>BRENT:</span>
            <span style={{ fontWeight: '700' }}>${macro.brent_oil_price}</span>
            <span style={{ color: oilChange >= 0 ? '#34c759' : '#ff3b30' }}>
              ({oilChange >= 0 ? '+' + oilChange + '%' : oilChange + '%'})
            </span>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ color: '#8e8e93' }}>DXY:</span>
            <span style={{ fontWeight: '700' }}>{macro.dxy_index}</span>
            <span style={{ color: dxyChange >= 0 ? '#34c759' : '#ff3b30' }}>
              ({dxyChange >= 0 ? '+' + dxyChange + '%' : dxyChange + '%'})
            </span>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ color: '#8e8e93' }}>US10Y:</span>
            <span style={{ fontWeight: '700' }}>{macro.us10y_yield}%</span>
          </div>
        </div>
      </div>

      {/* 2. Breaking News Narrative Box with Carousel */}
      <div style={{ padding: '10px 14px', background: 'var(--bg-panel)', borderTop: 'var(--border-muted)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          
          <div style={{ flex: '1 1 500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className='badge' style={{ background: '#ff9500', color: '#ffffff', border: 'none', fontSize: '9px', fontWeight: '700' }}>
                  FLASH HEADLINE
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {macro.source || 'Global Macro Intelligence Engine'} · SYNCED {new Date(macro.updated_at || Date.now()).toLocaleTimeString('id-ID')} WIB
                </span>
              </div>

              {/* Carousel Controls */}
              {headlines.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => setHeadlineIndex(prev => (prev - 1 + headlines.length) % headlines.length)}
                    className='telemetry-btn'
                    style={{ padding: '2px 6px', fontSize: '10px' }}
                    title='Previous headline'
                  >
                    ◀
                  </button>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', minWidth: '35px', textAlign: 'center' }}>
                    {headlineIndex + 1} / {headlines.length}
                  </span>
                  <button
                    onClick={() => setHeadlineIndex(prev => (prev + 1) % headlines.length)}
                    className='telemetry-btn'
                    style={{ padding: '2px 6px', fontSize: '10px' }}
                    title='Next headline'
                  >
                    ▶
                  </button>
                </div>
              )}
            </div>

            <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', margin: '2px 0 6px 0', minHeight: '20px' }}>
              ⚡ {typeof headlines[headlineIndex] === 'object' ? (headlines[headlineIndex]?.title || headlines[headlineIndex]?.headline) : headlines[headlineIndex]}
            </h3>

            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
              {macro.full_narrative}
            </p>

            {/* Clickable Impacted IDX Asset Tags */}
            {affectedStocks.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>
                  AFFECTED ASSETS (CLICK TO CHART):
                </span>
                {affectedStocks.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectTicker(item.ticker, 'IDX')}
                    className='telemetry-btn'
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
                    <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>({item.impact})</span>
                  </button>
                ))}
              </div>
            )}

          </div>

          {/* Quick Sentiment Status */}
          <div style={{ textAlign: 'right', minWidth: '120px' }}>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>
              EVENT CATEGORY
            </div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
              {macro.event_category || 'GLOBAL_MACRO'}
            </div>
            <div style={{ marginTop: '4px' }}>
              <span className={'badge ' + (macro.severity === 'HIGH' || macro.severity === 'CRITICAL' ? 'badge-bear' : 'badge-bull')}>
                SEVERITY: {macro.severity || 'NORMAL'}
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}