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

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className='telemetry-panel' style={{ marginBottom: '8px', border: 'var(--border-hairline)' }}>
      
      {/* 1. Streaming Macro Ticker Tape */}
      <div style={{
        background: 'var(--bg-panel-dark)',
        color: '#faf9f5',
        padding: '5px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        fontSize: '11px',
        letterSpacing: '0.04em'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', background: 'var(--accent-green)', display: 'inline-block', borderRadius: '50%', boxShadow: '0 0 6px var(--accent-green)' }}></span>
          <strong style={{ color: 'var(--accent-green)', letterSpacing: '0.04em' }}>MBG MACRO INTELLIGENCE WIRE</strong>
          <span style={{ color: '#8e8e93', fontSize: '10px' }}>// CONTINUOUS 24/7 LIVE FEED</span>
        </div>

        {/* Streaming Ticker Bellwethers */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
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

      {/* 2. Compact Headline Bar */}
      <div style={{ padding: '6px 12px', background: 'var(--bg-panel)', borderTop: 'var(--border-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 auto', overflow: 'hidden' }}>
          <span className='badge' style={{ background: '#ff9500', color: '#ffffff', border: 'none', fontSize: '8px', fontWeight: '800', padding: '1px 5px' }}>
            FLASH
          </span>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            ⚡ {typeof headlines[headlineIndex] === 'object' ? (headlines[headlineIndex]?.title || headlines[headlineIndex]?.headline) : headlines[headlineIndex]}
          </span>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            ({headlineIndex + 1}/{headlines.length})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Affected tickers in-line */}
          {affectedStocks.slice(0, 3).map((item, idx) => (
            <button
              key={idx}
              onClick={() => onSelectTicker(item.ticker, 'IDX')}
              className='telemetry-btn'
              style={{
                padding: '1px 5px',
                fontSize: '9px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                borderColor: item.impact === 'BULLISH' ? '#34c759' : '#ff3b30'
              }}
              title={item.reason}
            >
              <span>{item.impact === 'BULLISH' ? '🟢' : '🔴'}</span>
              <strong>${item.ticker}</strong>
            </button>
          ))}

          {headlines.length > 1 && (
            <div style={{ display: 'flex', gap: '2px' }}>
              <button
                onClick={() => setHeadlineIndex(prev => (prev - 1 + headlines.length) % headlines.length)}
                className='telemetry-btn'
                style={{ padding: '1px 5px', fontSize: '9px' }}
                title='Prev headline'
              >
                ◀
              </button>
              <button
                onClick={() => setHeadlineIndex(prev => (prev + 1) % headlines.length)}
                className='telemetry-btn'
                style={{ padding: '1px 5px', fontSize: '9px' }}
                title='Next headline'
              >
                ▶
              </button>
            </div>
          )}

          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className='telemetry-btn'
            style={{ padding: '1px 6px', fontSize: '9px', background: isExpanded ? 'var(--accent-blue)' : 'transparent', color: isExpanded ? '#fff' : 'var(--text-muted)' }}
          >
            {isExpanded ? '▲ Ringkas' : '▼ Detail'}
          </button>
        </div>
      </div>

      {/* Expandable Macro Narrative Drawer */}
      {isExpanded && (
        <div style={{ padding: '8px 12px', background: 'var(--bg-panel-subtle)', borderTop: 'var(--border-muted)', fontSize: '11px', lineHeight: 1.45, color: 'var(--text-muted)' }}>
          <p style={{ margin: '0 0 6px 0' }}>{macro.full_narrative || 'Pasar memantau dinamika suku bunga global dan arus akumulasi institusi.'}</p>
          {affectedStocks.length > 3 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
              <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)' }}>ALL IMPACTED:</span>
              {affectedStocks.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectTicker(item.ticker, 'IDX')}
                  className='telemetry-btn'
                  style={{ padding: '1px 5px', fontSize: '9px' }}
                >
                  ${item.ticker} ({item.impact})
                </button>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}