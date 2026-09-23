import React from 'react';

export default function BloombergNewsWire({ macro, bundle, livePrices = {} }) {
  if (!macro) return null;

  const goldChange = Number(macro.gold_change_pct || 0);
  const oilChange = Number(macro.brent_oil_change_pct || 0);
  const dxyChange = Number(macro.dxy_change_pct || 0);

  // Real-time IHSG
  const ihsgLive = livePrices['IHSG'] || livePrices['.JKSE'] || livePrices['IDX:COMPOSITE'];
  const ihsgPriceVal = ihsgLive?.price !== undefined ? ihsgLive.price : (macro.ihsg_price || macro.jkse_price || 6374.91);
  const ihsgVal = Number(ihsgPriceVal).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const ihsgChange = ihsgLive?.changePct !== undefined ? Number(ihsgLive.changePct) : (macro.ihsg_change_pct !== undefined ? Number(macro.ihsg_change_pct) : 1.56);
  const isIhsgUp = ihsgChange >= 0;

  // Real-time Crypto
  const btcLive = livePrices['BTCUSDT'] || livePrices['BTC/USDT'] || livePrices['BTC'];
  const ethLive = livePrices['ETHUSDT'] || livePrices['ETH/USDT'] || livePrices['ETH'];
  const btcData = bundle?.crypto_spot_10?.find(c => c.pair === 'BTC/USDT' || c.pair === 'BTC');
  const ethData = bundle?.crypto_spot_10?.find(c => c.pair === 'ETH/USDT' || c.pair === 'ETH');

  const btcPriceNum = btcLive?.price !== undefined ? btcLive.price : (btcData?.current_price || 85922);
  const btcPrice = `$${Number(btcPriceNum).toLocaleString(undefined, { minimumFractionDigits: Number(btcPriceNum) > 100 ? 0 : 2, maximumFractionDigits: 2 })}`;
  const btcChgNum = btcLive?.changePct !== undefined ? btcLive.changePct : (btcData?.change_24h_pct !== undefined ? btcData.change_24h_pct : -0.25);
  const btcChg = `${btcChgNum >= 0 ? '+' : ''}${Number(btcChgNum).toFixed(2)}%`;
  const btcIsUp = btcChgNum >= 0;

  const ethPriceNum = ethLive?.price !== undefined ? ethLive.price : (ethData?.current_price || 2734);
  const ethPrice = `$${Number(ethPriceNum).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const ethChgNum = ethLive?.changePct !== undefined ? ethLive.changePct : (ethData?.change_24h_pct !== undefined ? ethData.change_24h_pct : -0.39);
  const ethChg = `${ethChgNum >= 0 ? '+' : ''}${Number(ethChgNum).toFixed(2)}%`;
  const ethIsUp = ethChgNum >= 0;

  const crisisAlert = bundle?.crisis_alert || macro?.crisis_alert;
  const isCrisisActive = crisisAlert && (crisisAlert.is_crisis || crisisAlert.severity === 'CRITICAL' || crisisAlert.severity === 'HIGH');

  const tickerItems = [
    { label: 'XAU/USD', val: `$${macro.gold_price || '4,381.8'}`, chg: `${goldChange >= 0 ? '+' : ''}${goldChange}%`, isUp: goldChange >= 0 },
    { label: 'BRENT', val: `$${macro.brent_oil_price || '99.21'}`, chg: `${oilChange >= 0 ? '+' : ''}${oilChange}%`, isUp: oilChange >= 0 },
    { label: 'DXY', val: `${macro.dxy_index || '100.63'}`, chg: `${dxyChange >= 0 ? '+' : ''}${dxyChange}%`, isUp: dxyChange >= 0 },
    { label: 'US10Y', val: `${macro.us10y_yield || '4.18'}%`, chg: '-0.03%', isUp: false },
    { label: 'IHSG', val: ihsgVal, chg: `${ihsgChange >= 0 ? '+' : ''}${ihsgChange.toFixed(2)}%`, isUp: isIhsgUp },
    { label: 'BTC/USD', val: btcPrice, chg: btcChg, isUp: btcIsUp },
    { label: 'ETH/USD', val: ethPrice, chg: ethChg, isUp: ethIsUp },
    { label: 'USD/IDR', val: 'Rp 15.680', chg: '-0.18%', isUp: false }
  ];

  return (
    <div style={{ marginBottom: '4px', width: '100%', boxSizing: 'border-box' }}>

      {/* Emergency Crisis / War Flash Banner (Only shown if severe) */}
      {isCrisisActive && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(220, 38, 38, 0.25) 0%, rgba(185, 28, 28, 0.45) 50%, rgba(220, 38, 38, 0.25) 100%)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.6)',
          padding: '4px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '9.5px',
          color: '#fee2e2',
          marginBottom: '3px',
          borderRadius: '3px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🚨</span>
            <strong style={{ letterSpacing: '0.04em' }}>ALERT: {crisisAlert?.headline || 'GEOPOLITICAL EVENT ACTIVE'}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {crisisAlert.affected_tickers && crisisAlert.affected_tickers.slice(0, 4).map(t => (
              <span key={t} style={{
                fontSize: '8.5px',
                fontWeight: '800',
                padding: '1px 4px',
                borderRadius: '2px',
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

      {/* STREAMLINED GLOBAL BENCHMARK RIBBON (Clean, 24px, Zero Jargon) */}
      <div style={{
        background: 'var(--bg-strip-wire, var(--bg-panel-dark))',
        color: 'var(--text-primary)',
        padding: '2px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
        gap: '8px',
        fontSize: '9.5px',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.04em',
        borderRadius: '4px',
        border: 'var(--border-hairline)',
        height: '24px',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          <span style={{ width: '6px', height: '6px', background: 'var(--accent-green)', display: 'inline-block', borderRadius: '50%', boxShadow: '0 0 5px var(--accent-green)' }} />
          <strong style={{ fontSize: '9px', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>MARKET BENCHMARKS</strong>
        </div>

        {/* Running Marquee Ticker Track */}
        <div className="marquee-ticker-container" title="Continuous Market Feed (Hover to Pause)" style={{ flexGrow: 1, minWidth: 0 }}>
          <div className="marquee-ticker-track">
            {[...tickerItems, ...tickerItems].map((t, i) => (
              <span key={i} className="marquee-ticker-item" style={{ color: 'var(--text-primary)', fontSize: '9px' }}>
                <b style={{ color: 'var(--text-muted)' }}>{t.label}</b> {t.val}
                <span style={{ color: t.isUp ? 'var(--accent-green-text, #10b981)' : 'var(--accent-rust-text, #ef4444)', marginLeft: '3px', fontWeight: 700 }}>
                  ({t.chg})
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
