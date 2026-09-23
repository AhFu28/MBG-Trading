import React, { useState, useEffect } from 'react';

export default function BloombergNewsWire({ macro, bundle, livePrices = {}, onSelectTicker, onSelectNews }) {
  if (!macro) return null;

  const affectedStocks = macro.idx_affected_stocks || [];
  const goldChange = Number(macro.gold_change_pct || 0);
  const oilChange = Number(macro.brent_oil_change_pct || 0);
  const dxyChange = Number(macro.dxy_change_pct || 0);
  
  // Real-time IHSG from livePrices or macro fallback
  const ihsgLive = livePrices['IHSG'] || livePrices['.JKSE'] || livePrices['IDX:COMPOSITE'];
  const ihsgPriceVal = ihsgLive?.price !== undefined ? ihsgLive.price : (macro.ihsg_price || macro.jkse_price || 6484.1);
  const ihsgVal = Number(ihsgPriceVal).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const ihsgChange = ihsgLive?.changePct !== undefined ? Number(ihsgLive.changePct) : (macro.ihsg_change_pct !== undefined ? Number(macro.ihsg_change_pct) : 0.36);
  const isIhsgUp = ihsgChange >= 0;
  
  // Real-time Crypto from livePrices (WebSocket)
  const btcLive = livePrices['BTCUSDT'] || livePrices['BTC/USDT'] || livePrices['BTC'];
  const ethLive = livePrices['ETHUSDT'] || livePrices['ETH/USDT'] || livePrices['ETH'];
  const btcData = bundle?.crypto_spot_10?.find(c => c.pair === 'BTC/USDT' || c.pair === 'BTC');
  const ethData = bundle?.crypto_spot_10?.find(c => c.pair === 'ETH/USDT' || c.pair === 'ETH');
  
  const btcPriceNum = btcLive?.price !== undefined ? btcLive.price : (btcData?.current_price || 75942);
  const btcPrice = `$${Number(btcPriceNum).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const btcChgNum = btcLive?.changePct !== undefined ? btcLive.changePct : (btcData?.change_24h_pct !== undefined ? btcData.change_24h_pct : -2.21);
  const btcChg = `${btcChgNum >= 0 ? '+' : ''}${btcChgNum.toFixed(2)}%`;
  const btcIsUp = btcChgNum >= 0;

  const ethPriceNum = ethLive?.price !== undefined ? ethLive.price : (ethData?.current_price || 2406);
  const ethPrice = `$${Number(ethPriceNum).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const ethChgNum = ethLive?.changePct !== undefined ? ethLive.changePct : (ethData?.change_24h_pct !== undefined ? ethData.change_24h_pct : -3.67);
  const ethChg = `${ethChgNum >= 0 ? '+' : ''}${ethChgNum.toFixed(2)}%`;
  const ethIsUp = ethChgNum >= 0;

  // Multi-headline support
  const headlines = Array.isArray(macro.headlines) && macro.headlines.length > 0 
    ? macro.headlines 
    : [macro.headline || 'IHSG Menguat Ditopang Sektor Keuangan dan Arus Modal Asing'];

  const [headlineIndex, setHeadlineIndex] = useState(0);

  const crisisAlert = bundle?.crisis_alert || macro?.crisis_alert;
  const isCrisisActive = crisisAlert && (crisisAlert.is_crisis || crisisAlert.severity === 'CRITICAL' || crisisAlert.severity === 'HIGH');

  useEffect(() => {
    if (headlines.length <= 1) return;
    const timer = setInterval(() => {
      setHeadlineIndex(prev => (prev + 1) % headlines.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [headlines.length]);

  const [isExpanded, setIsExpanded] = useState(false);
  
  const tickerItems = [
    { label: 'XAU/USD', val: `$${macro.gold_price || '4,368.5'}`, chg: `${goldChange >= 0 ? '+' : ''}${goldChange}%`, isUp: goldChange >= 0 },
    { label: 'BRENT', val: `$${macro.brent_oil_price || '108.01'}`, chg: `${oilChange >= 0 ? '+' : ''}${oilChange}%`, isUp: oilChange >= 0 },
    { label: 'DXY', val: `${macro.dxy_index || '99.61'}`, chg: `${dxyChange >= 0 ? '+' : ''}${dxyChange}%`, isUp: dxyChange >= 0 },
    { label: 'US10Y', val: `${macro.us10y_yield || '5.00'}%`, chg: '+0.01%', isUp: true },
    { label: 'IHSG', val: ihsgVal, chg: `${ihsgChange >= 0 ? '+' : ''}${ihsgChange}%`, isUp: isIhsgUp },
    { label: 'BTC/USD', val: btcPrice, chg: btcChg, isUp: btcIsUp },
    { label: 'ETH/USD', val: ethPrice, chg: ethChg, isUp: ethIsUp }
  ];

  return (
    <div className='telemetry-panel' style={{ marginBottom: '6px', border: 'var(--border-hairline)' }}>
      
      {/* 0. EMERGENCY CRISIS / WAR FLASH BANNER */}
      {isCrisisActive && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(220, 38, 38, 0.25) 0%, rgba(185, 28, 28, 0.45) 50%, rgba(220, 38, 38, 0.25) 100%)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.6)',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '11px',
          color: '#fee2e2'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px' }}>🚨</span>
            <span style={{ fontWeight: '900', color: '#f87171', letterSpacing: '0.05em' }}>
              EMERGENCY MACRO FLASH ALERT // [{crisisAlert.severity} THREAT]
            </span>
            <span style={{ color: '#fff', fontWeight: '700' }}>
              {crisisAlert.headline || crisisAlert.summary}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {crisisAlert.affected_tickers && crisisAlert.affected_tickers.slice(0, 4).map(t => (
              <span key={t} style={{
                fontSize: '9px',
                fontWeight: '800',
                padding: '2px 5px',
                borderRadius: '3px',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(248, 113, 113, 0.5)',
                color: '#fca5a5'
              }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 1. Streaming Macro Ticker Tape */}
      <div style={{
        background: 'var(--bg-strip-wire, var(--bg-panel-dark))',
        color: 'var(--text-primary)',
        padding: '4px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '11px',
        letterSpacing: '0.04em',
        borderBottom: 'var(--border-hairline)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', background: 'var(--accent-green)', display: 'inline-block', borderRadius: '50%', boxShadow: '0 0 6px var(--accent-green)' }}></span>
          <strong style={{ color: 'var(--accent-green-text, var(--accent-green))', letterSpacing: '0.04em' }}>MBG MACRO INTELLIGENCE WIRE</strong>
          <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>// CONTINUOUS 24/7 LIVE FEED</span>
          <span style={{
            fontSize: '9px',
            fontWeight: '800',
            color: isCrisisActive ? '#f87171' : 'var(--accent-green)',
            background: isCrisisActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.12)',
            padding: '1px 6px',
            borderRadius: '3px',
            border: `1px solid ${isCrisisActive ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.3)'}`
          }}>
            {isCrisisActive ? `⚠️ CRISIS DETECTED: ${crisisAlert?.severity}` : '● THREAT: DEFCON 4 GUARDED'}
          </span>
        </div>

        {/* Continuous Running Marquee Ticker Tape */}
        <div className="marquee-ticker-container" title="Continuous Macro Feed (Hover to Pause)">
          <div className="marquee-ticker-track">
            {[...tickerItems, ...tickerItems].map((t, i) => (
              <span key={i} className="marquee-ticker-item" style={{ color: 'var(--text-primary)' }}>
                <b>{t.label}</b> {t.val}
                <span style={{ color: t.isUp ? 'var(--accent-green-text, #10b981)' : 'var(--accent-rust-text, #ef4444)', marginLeft: '3px' }}>
                  ({t.chg})
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Compact Headline Bar */}
      {(() => {
        const activeHeadline = headlines[headlineIndex];
        const activeHeadlineText = typeof activeHeadline === 'object'
          ? (activeHeadline?.title || activeHeadline?.headline || '')
          : (typeof activeHeadline === 'string' ? activeHeadline : '');

        const currentItem = typeof activeHeadline === 'object'
          ? activeHeadline
          : (macro.live_news || []).find(n => n.title === activeHeadline) || {
              id: `wire-${headlineIndex}`,
              title: activeHeadlineText || 'Pasar Memantau Sentimen Makro',
              source: 'MBG MACRO WIRE',
              sentiment: macro.sentiment || 'NEUTRAL',
              tag: 'MACRO',
              summary: macro.full_narrative || 'Dinamika makro ekonomi dan pasar finansial terkini.',
              related_tickers: [],
              pub_date: new Date().toISOString()
            };

        // Derive dynamic contextual tickers for the currently displayed headline
        const getContextualTickers = () => {
          if (Array.isArray(currentItem.related_tickers) && currentItem.related_tickers.length > 0) {
            return currentItem.related_tickers.slice(0, 3).map(t => ({
              ticker: t.replace('$', '').toUpperCase(),
              impact: currentItem.sentiment === 'BEARISH' ? 'BEARISH' : 'BULLISH',
              reason: `Relevan dengan ${currentItem.title || 'headline'}`
            }));
          }

          const textLower = activeHeadlineText.toLowerCase();
          if (textLower.includes('perbankan') || textLower.includes('bank') || textLower.includes('keuangan')) {
            return [
              { ticker: 'BBCA', impact: 'BULLISH', reason: 'Pilar Perbankan Swasta' },
              { ticker: 'BBRI', impact: 'BULLISH', reason: 'Pilar Perbankan Mikro BUMN' },
              { ticker: 'BMRI', impact: 'BULLISH', reason: 'Pilar Perbankan Korporasi' }
            ];
          }
          if (textLower.includes('minyak') || textLower.includes('oil') || textLower.includes('brent') || textLower.includes('energi') || textLower.includes('opec')) {
            return [
              { ticker: 'MEDC', impact: 'BULLISH', reason: 'Eksplorasi Migas Terbesar' },
              { ticker: 'ELSA', impact: 'BULLISH', reason: 'Jasa Hulu & Hilir Migas' },
              { ticker: 'AKRA', impact: 'BULLISH', reason: 'Distribusi BBM & Logistik' }
            ];
          }
          if (textLower.includes('emas') || textLower.includes('gold') || textLower.includes('logam') || textLower.includes('komoditas')) {
            return [
              { ticker: 'ANTM', impact: 'BULLISH', reason: 'Produsen Emas & Logam Mulia' },
              { ticker: 'BRMS', impact: 'BULLISH', reason: 'Tambang Emas Palu' },
              { ticker: 'MDKA', impact: 'BULLISH', reason: 'Tambang Emas Tujuh Bukit' }
            ];
          }
          if (textLower.includes('konglomerat') || textLower.includes('konglo') || textLower.includes('barito')) {
            return [
              { ticker: 'AMMN', impact: 'BULLISH', reason: 'Tambang Tembaga Amman' },
              { ticker: 'CUAN', impact: 'BULLISH', reason: 'Klaster Barito Renewables' },
              { ticker: 'PTRO', impact: 'BULLISH', reason: 'Petrosea Mining & EPC' }
            ];
          }

          if (affectedStocks.length > 0) {
            return affectedStocks.slice(0, 3);
          }

          return [
            { ticker: 'BBCA', impact: 'BULLISH', reason: 'Pilar Utama IHSG' },
            { ticker: 'BBRI', impact: 'BULLISH', reason: 'Pilar Likuiditas IHSG' },
            { ticker: 'ASII', impact: 'BULLISH', reason: 'Konglomerasi Astra' }
          ];
        };

        const activeTickers = getContextualTickers();

        return (
          <div style={{ padding: '6px 12px', background: 'var(--bg-panel)', borderTop: 'var(--border-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 auto', overflow: 'hidden' }}>
              <span className='badge' style={{ background: '#ff9500', color: '#ffffff', border: 'none', fontSize: '8px', fontWeight: '800', padding: '1px 5px' }}>
                FLASH
              </span>
              <span
                onClick={() => onSelectNews && onSelectNews(currentItem)}
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: onSelectNews ? 'pointer' : 'default',
                  transition: 'color 0.15s ease'
                }}
                onMouseEnter={(e) => { if (onSelectNews) e.currentTarget.style.color = 'var(--accent-blue)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                title="Klik untuk melihat detail & analisis berita ini"
              >
                ⚡ {activeHeadlineText}
              </span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                ({headlineIndex + 1}/{headlines.length})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              {/* Contextually mapped affected tickers */}
              {activeTickers.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectTicker(item.ticker, 'IDX')}
                  className='telemetry-btn'
                  style={{
                    padding: '1.5px 6px',
                    fontSize: '9px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    borderColor: item.impact === 'BULLISH' ? 'var(--accent-green)' : 'var(--accent-rust)',
                    background: 'var(--bg-panel-subtle)'
                  }}
                  title={item.reason}
                >
                  <span style={{ fontSize: '7px' }}>{item.impact === 'BULLISH' ? '🟢' : '🔴'}</span>
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
      );
      })()}

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