import React, { useState, useEffect } from 'react';

export default function BloombergNewsWire({ macro, bundle, onSelectTicker }) {
  if (!macro) return null;

  const affectedStocks = macro.idx_affected_stocks || [];
  const goldChange = Number(macro.gold_change_pct || 0);
  const oilChange = Number(macro.brent_oil_change_pct || 0);
  const dxyChange = Number(macro.dxy_change_pct || 0);
  const ihsgVal = macro.ihsg_price || macro.jkse_price ? Number(macro.ihsg_price || macro.jkse_price).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '6,506.40';
  const ihsgChange = macro.ihsg_change_pct !== undefined ? Number(macro.ihsg_change_pct) : -1.29;
  const isIhsgUp = ihsgChange >= 0;
  
  // Try to get crypto prices from bundle
  const btcData = bundle?.crypto_spot_10?.find(c => c.pair === 'BTC/USDT' || c.pair === 'BTC');
  const ethData = bundle?.crypto_spot_10?.find(c => c.pair === 'ETH/USDT' || c.pair === 'ETH');
  
  const btcPrice = btcData?.current_price ? `$${Number(btcData.current_price).toLocaleString()}` : '$77,168 [DEMO]';
  const btcChg = btcData?.change_24h_pct !== undefined ? `${btcData.change_24h_pct >= 0 ? '+' : ''}${btcData.change_24h_pct}%` : '+0.78%';
  const btcIsUp = btcData?.change_24h_pct !== undefined ? btcData.change_24h_pct >= 0 : true;

  const ethPrice = ethData?.current_price ? `$${Number(ethData.current_price).toLocaleString()}` : '$2,463 [DEMO]';
  const ethChg = ethData?.change_24h_pct !== undefined ? `${ethData.change_24h_pct >= 0 ? '+' : ''}${ethData.change_24h_pct}%` : '+1.04%';
  const ethIsUp = ethData?.change_24h_pct !== undefined ? ethData.change_24h_pct >= 0 : true;

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
  
  const tickerItems = [
    { label: 'XAU/USD', val: `$${macro.gold_price || '4,374.4'}`, chg: `${goldChange >= 0 ? '+' : ''}${goldChange}%`, isUp: goldChange >= 0 },
    { label: 'BRENT', val: `$${macro.brent_oil_price || '107.0'}`, chg: `${oilChange >= 0 ? '+' : ''}${oilChange}%`, isUp: oilChange >= 0 },
    { label: 'DXY', val: `${macro.dxy_index || '99.08'}`, chg: `${dxyChange >= 0 ? '+' : ''}${dxyChange}%`, isUp: dxyChange >= 0 },
    { label: 'US10Y', val: `${macro.us10y_yield || '4.94'}%`, chg: '+2 bp', isUp: true },
    { label: 'IHSG', val: ihsgVal, chg: `${ihsgChange >= 0 ? '+' : ''}${ihsgChange}%`, isUp: isIhsgUp },
    { label: 'BTC/USD', val: btcPrice, chg: btcChg, isUp: btcIsUp },
    { label: 'ETH/USD', val: ethPrice, chg: ethChg, isUp: ethIsUp }
  ];

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

        {/* Continuous Running Marquee Ticker Tape */}
        <div className="marquee-ticker-container" title="Continuous Macro Feed (Hover to Pause)">
          <div className="marquee-ticker-track">
            {[...tickerItems, ...tickerItems].map((t, i) => (
              <span key={i} className="marquee-ticker-item">
                <b>{t.label}</b> {t.val}
                <span style={{ color: t.isUp ? '#34c759' : '#ff3b30' }}>
                  ({t.chg})
                </span>
              </span>
            ))}
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