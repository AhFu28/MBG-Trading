import React, { useMemo, useEffect, useState } from 'react';

/**
 * OrderBookSimulator - Professional Level 2 Market Depth Simulator
 * Styled in SoSoValue Bento Grid & High-Contrast Analytics Aesthetic
 * Supports OJK/IDX Fraksi Harga Rules & Crypto Adaptive Tick Sizes
 */
const OrderBookSimulator = ({ ticker = 'BBCA', currentPrice = 9000, isOpen = false, onClose }) => {
  const [refreshTick, setRefreshTick] = useState(0);

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Determine market type and accurate tick size (Do not treat IDX stocks under Rp 100 as crypto)
  const isCrypto = ticker.includes('USDT') || ticker.includes('USD') || ticker.includes('/');

  const tickSize = useMemo(() => {
    const p = Number(currentPrice) || 1000;
    if (isCrypto) {
      if (p < 0.1) return 0.0001;
      if (p < 1) return 0.001;
      if (p < 10) return 0.01;
      if (p < 100) return 0.05;
      if (p < 1000) return 0.25;
      return 1;
    }
    // IDX Official OJK Fraksi Harga
    if (p < 200) return 1;
    if (p < 500) return 2;
    if (p < 2000) return 5;
    if (p < 5000) return 10;
    return 25;
  }, [currentPrice, isCrypto]);

  // Generate stable, realistic 10-level L2 depth
  const { bidsWithCumulative, asksWithCumulative, maxCumulativeVol, totalBidVol, totalAskVol, spread, spreadPercent, buyerRatio } = useMemo(() => {
    const basePrice = Number(currentPrice) || 1000;
    const levelsCount = 10;

    // Seeded pseudo-random generator based on ticker chars + price
    let seed = ticker.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + Math.round(basePrice) + refreshTick;
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // Base volume scaler
    const baseLots = isCrypto ? (basePrice > 1000 ? 5 : 500) : (basePrice > 5000 ? 2500 : 15000);

    const bids = [];
    const asks = [];

    for (let i = 0; i < levelsCount; i++) {
      const bidPrice = Math.max(tickSize, basePrice - (i + 1) * tickSize);
      const askPrice = basePrice + (i + 1) * tickSize;

      // Realistic volume curve: higher liquidity near the spread
      const distFactor = 1 + Math.sin((i / levelsCount) * Math.PI) * 1.5;
      const bidLots = Math.round((baseLots * (0.6 + pseudoRandom() * 0.9)) * distFactor);
      const askLots = Math.round((baseLots * (0.6 + pseudoRandom() * 0.9)) * distFactor);

      bids.push({ price: bidPrice, lotQuantity: bidLots });
      asks.push({ price: askPrice, lotQuantity: askLots });
    }

    let cumBid = 0;
    const bidsWithCumulative = bids.map(b => {
      cumBid += b.lotQuantity;
      return { ...b, cumulative: cumBid };
    });

    let cumAsk = 0;
    const asksWithCumulative = asks.map(a => {
      cumAsk += a.lotQuantity;
      return { ...a, cumulative: cumAsk };
    });

    const maxCum = Math.max(cumBid, cumAsk, 1);
    const sp = Math.max(tickSize, Number((asks[0]?.price - bids[0]?.price).toFixed(4)));
    const spPct = ((sp / basePrice) * 100).toFixed(2);
    const buyRatio = Math.round((cumBid / (cumBid + cumAsk)) * 100);

    return {
      bidsWithCumulative,
      asksWithCumulative,
      maxCumulativeVol: maxCum,
      totalBidVol: cumBid,
      totalAskVol: cumAsk,
      spread: sp,
      spreadPercent: spPct,
      buyerRatio: buyRatio
    };
  }, [currentPrice, tickSize, isCrypto, ticker, refreshTick]);

  if (!isOpen) return null;

  const formatPrice = (p) => {
    if (isCrypto) {
      return '$' + Number(p).toLocaleString(undefined, { minimumFractionDigits: tickSize < 1 ? 2 : 0, maximumFractionDigits: 4 });
    }
    return 'Rp ' + Number(p).toLocaleString();
  };

  const formatLots = (num) => Number(num).toLocaleString();

  return (
    <div 
      onClick={() => onClose?.()}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.82)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-panel, #121722)',
          border: '1px solid var(--border-color, #1e2638)',
          borderRadius: 'var(--radius-md, 10px)',
          boxShadow: '0 24px 64px -8px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.06)',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'var(--font-sans)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 18px',
          background: 'var(--bg-panel-subtle, #18202e)',
          borderBottom: 'var(--border-hairline)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-blue" style={{ fontSize: '11px', padding: '3px 8px' }}>
              {isCrypto ? 'CRYPTO SPOT' : 'IDX EQUITY L2'}
            </span>
            <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {ticker} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Market Depth</span>
            </h2>
            <span style={{ 
              fontSize: '12px', 
              fontFamily: 'var(--font-mono)', 
              color: 'var(--text-primary)',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-xs)'
            }}>
              Ref Price: {formatPrice(currentPrice)} (Tick: {formatPrice(tickSize)})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="telemetry-btn"
              onClick={() => setRefreshTick(t => t + 1)}
              style={{ padding: '4px 10px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Simulasi fluktuasi order book"
            >
              🔄 Refresh Book
            </button>
            <button 
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '20px',
                lineHeight: 1,
                padding: '4px 8px',
                borderRadius: 'var(--radius-xs)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Telemetry Summary Bar */}
        <div style={{
          padding: '12px 18px',
          background: 'rgba(11, 14, 20, 0.6)',
          borderBottom: 'var(--border-hairline)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Spread Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Spread:
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-orange)' }}>
              {formatPrice(spread)} ({spreadPercent}%)
            </span>
          </div>

          {/* Order Flow Imbalance Power Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Order Flow Imbalance:
            </span>
            <div style={{
              width: '260px',
              height: '18px',
              background: 'rgba(255, 77, 77, 0.25)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              display: 'flex',
              position: 'relative',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div 
                style={{ 
                  width: `${buyerRatio}%`, 
                  background: 'var(--accent-green, #00d084)',
                  height: '100%',
                  transition: 'width 0.3s ease'
                }} 
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 8px',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: '#ffffff',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)'
              }}>
                <span>BID {buyerRatio}%</span>
                <span>ASK {100 - buyerRatio}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* L2 Depth Columns */}
        <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            {/* BIDS SIDE (Buyer Depth) */}
            <div style={{ 
              background: 'var(--bg-panel-subtle, #18202e)', 
              border: '1px solid rgba(0, 208, 132, 0.2)', 
              borderRadius: 'var(--radius-sm)' 
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1.2fr',
                padding: '8px 12px',
                borderBottom: 'var(--border-hairline)',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)'
              }}>
                <span style={{ textAlign: 'left' }}>Cum Vol</span>
                <span style={{ textAlign: 'right' }}>Bid Lots</span>
                <span style={{ textAlign: 'right', color: 'var(--accent-green, #00d084)' }}>Bid Price</span>
              </div>

              <div>
                {bidsWithCumulative.map((bid, i) => {
                  const depthPercent = ((bid.cumulative / maxCumulativeVol) * 100).toFixed(1);
                  return (
                    <div 
                      key={i} 
                      style={{
                        position: 'relative',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1.2fr',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.03)'
                      }}
                    >
                      {/* Depth Fill Bar from right to left */}
                      <div 
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          bottom: 0,
                          width: `${depthPercent}%`,
                          background: 'rgba(0, 208, 132, 0.12)',
                          zIndex: 0,
                          pointerEvents: 'none'
                        }}
                      />
                      <span style={{ position: 'relative', zIndex: 1, textAlign: 'left', color: 'var(--text-muted)' }}>
                        {formatLots(bid.cumulative)}
                      </span>
                      <span style={{ position: 'relative', zIndex: 1, textAlign: 'right', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {formatLots(bid.lotQuantity)}
                      </span>
                      <span style={{ position: 'relative', zIndex: 1, textAlign: 'right', color: 'var(--accent-green, #00d084)', fontWeight: 700 }}>
                        {formatPrice(bid.price)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div style={{
                padding: '8px 12px',
                background: 'rgba(0, 208, 132, 0.06)',
                borderTop: 'var(--border-hairline)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: 'var(--accent-green, #00d084)'
              }}>
                <span>TOTAL BID QUEUE</span>
                <span>{formatLots(totalBidVol)} Lots</span>
              </div>
            </div>

            {/* ASKS SIDE (Seller Depth) */}
            <div style={{ 
              background: 'var(--bg-panel-subtle, #18202e)', 
              border: '1px solid rgba(255, 77, 77, 0.2)', 
              borderRadius: 'var(--radius-sm)' 
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr 1fr',
                padding: '8px 12px',
                borderBottom: 'var(--border-hairline)',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)'
              }}>
                <span style={{ textAlign: 'left', color: 'var(--accent-rust, #ff4d4d)' }}>Ask Price</span>
                <span style={{ textAlign: 'right' }}>Ask Lots</span>
                <span style={{ textAlign: 'right' }}>Cum Vol</span>
              </div>

              <div>
                {asksWithCumulative.map((ask, i) => {
                  const depthPercent = ((ask.cumulative / maxCumulativeVol) * 100).toFixed(1);
                  return (
                    <div 
                      key={i} 
                      style={{
                        position: 'relative',
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1fr 1fr',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.03)'
                      }}
                    >
                      {/* Depth Fill Bar from left to right */}
                      <div 
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${depthPercent}%`,
                          background: 'rgba(255, 77, 77, 0.12)',
                          zIndex: 0,
                          pointerEvents: 'none'
                        }}
                      />
                      <span style={{ position: 'relative', zIndex: 1, textAlign: 'left', color: 'var(--accent-rust, #ff4d4d)', fontWeight: 700 }}>
                        {formatPrice(ask.price)}
                      </span>
                      <span style={{ position: 'relative', zIndex: 1, textAlign: 'right', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {formatLots(ask.lotQuantity)}
                      </span>
                      <span style={{ position: 'relative', zIndex: 1, textAlign: 'right', color: 'var(--text-muted)' }}>
                        {formatLots(ask.cumulative)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div style={{
                padding: '8px 12px',
                background: 'rgba(255, 77, 77, 0.06)',
                borderTop: 'var(--border-hairline)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: 'var(--accent-rust, #ff4d4d)'
              }}>
                <span>TOTAL ASK QUEUE</span>
                <span>{formatLots(totalAskVol)} Lots</span>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Guidance */}
        <div style={{
          padding: '8px 18px',
          background: 'var(--bg-panel-subtle, #18202e)',
          borderTop: 'var(--border-hairline)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '10px',
          color: 'var(--text-muted)'
        }}>
          <span>
            {isCrypto ? 'OJK / Crypto Spot Live Depth Matrix' : 'OJK IDX Standard Price Ticks (Fraksi Harga Rp 1, 2, 5, 10, 25)'}
          </span>
          <span>
            Tekan <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '3px' }}>Esc</kbd> untuk menutup
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderBookSimulator;
