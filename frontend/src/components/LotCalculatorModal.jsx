import React, { useState, useEffect } from 'react';

export default function LotCalculatorModal({ isOpen, onClose, prefillEntry = '', prefillSL = '', initialMarket = 'IDX' }) {
  const [assetMode, setAssetMode] = useState(initialMarket === 'CRYPTO' ? 'CRYPTO' : 'IDX');
  const [modalAmount, setModalAmount] = useState(initialMarket === 'CRYPTO' ? 1000 : 10000000);
  const [entryPrice, setEntryPrice] = useState(prefillEntry || '');
  const [stopLossPrice, setStopLossPrice] = useState(prefillSL || '');
  const [riskPercent, setRiskPercent] = useState(2);

  // Update prefill values if they change
  useEffect(() => {
    if (prefillEntry) setEntryPrice(prefillEntry);
    if (prefillSL) setStopLossPrice(prefillSL);
    if (initialMarket) {
      const mode = initialMarket === 'CRYPTO' ? 'CRYPTO' : 'IDX';
      setAssetMode(mode);
      if (mode === 'CRYPTO' && (modalAmount === 10000000 || !modalAmount)) {
        setModalAmount(1000);
      } else if (mode === 'IDX' && (modalAmount === 1000 || !modalAmount)) {
        setModalAmount(10000000);
      }
    }
  }, [prefillEntry, prefillSL, initialMarket]);

  // Handle ESC key close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCrypto = assetMode === 'CRYPTO';

  // Calculations
  const riskAmount = (Number(modalAmount) * Number(riskPercent)) / 100;
  
  let riskPerUnit = 0;
  let maxLots = 0;
  let maxTokens = 0;
  let totalPositionValue = 0;
  let positionPercent = 0;
  let rrRatioDisplay = '-';
  let targetPrice = 0;

  const entry = Number(entryPrice);
  const sl = Number(stopLossPrice);

  if (entry > 0 && sl > 0 && entry > sl) {
    riskPerUnit = entry - sl;
    
    if (riskPerUnit > 0) {
      if (!isCrypto) {
        // IDX: 1 lot = 100 lembar
        maxLots = Math.floor(riskAmount / (riskPerUnit * 100));
        if (maxLots < 0) maxLots = 0;
        totalPositionValue = maxLots * 100 * entry;
      } else {
        // Crypto Spot: exact token units (fractional)
        const units = riskAmount / riskPerUnit;
        maxTokens = units > 0 ? units : 0;
        totalPositionValue = maxTokens * entry;
      }

      positionPercent = modalAmount > 0 ? (totalPositionValue / modalAmount) * 100 : 0;
      targetPrice = entry + (2.2 * riskPerUnit);
      rrRatioDisplay = '1 : 2.2';
    }
  }

  const isWarning = positionPercent > 25;

  const formatTokens = (val) => {
    if (val >= 100) return val.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (val >= 1) return val.toLocaleString('en-US', { maximumFractionDigits: 4 });
    return val.toLocaleString('en-US', { maximumFractionDigits: 6 });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(18, 19, 22, 0.85)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="telemetry-panel" style={{
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-panel)',
        border: '2px solid var(--border-color)',
        boxShadow: '8px 8px 0px rgba(0,0,0,0.3)'
      }}>
        
        {/* Modal Topbar */}
        <div className="telemetry-header" style={{ background: '#1c1d22', color: '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--accent-green)', fontWeight: '700', fontSize: '14px' }}>
              💰 KALKULATOR RISIKO &amp; POSITION SIZING MBG APEX
            </span>
          </div>

          <button 
            onClick={onClose}
            className="telemetry-btn" 
            style={{ background: 'var(--accent-rust)', color: '#fff', padding: '4px 12px', fontSize: '12px' }}
          >
            ✕ CLOSE
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Asset Mode Toggle: IDX vs CRYPTO */}
          <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-panel-subtle)', padding: '4px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => {
                setAssetMode('IDX');
                if (modalAmount < 100000) setModalAmount(10000000);
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: !isCrypto ? 'var(--accent-blue)' : 'transparent',
                color: !isCrypto ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              🇮🇩 SAHAM IDX (LOT / RUPIAH)
            </button>
            <button
              onClick={() => {
                setAssetMode('CRYPTO');
                if (modalAmount > 100000) setModalAmount(1000);
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: isCrypto ? 'var(--accent-orange, #f59e0b)' : 'transparent',
                color: isCrypto ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              ⚡ CRYPTO SPOT (USDT / TOKEN)
            </button>
          </div>

          {/* Inputs Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div className="metric-box">
              <label className="metric-label" style={{ display: 'block', marginBottom: '6px' }}>
                {isCrypto ? 'Modal Portfolio ($ USDT)' : 'Modal Portfolio (Rp)'}
              </label>
              <input 
                type="number" 
                value={modalAmount}
                onChange={(e) => setModalAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  background: 'var(--bg-canvas)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  outline: 'none'
                }}
              />
            </div>
            
            <div className="metric-box">
              <label className="metric-label" style={{ display: 'block', marginBottom: '6px' }}>Risk % per Trade (1-5%)</label>
              <input 
                type="number" 
                value={riskPercent}
                onChange={(e) => setRiskPercent(e.target.value)}
                min="0.5" max="20" step="0.5"
                style={{
                  width: '100%',
                  padding: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  background: 'var(--bg-canvas)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  outline: 'none'
                }}
              />
            </div>
            
            <div className="metric-box" style={{ borderLeft: '3px solid var(--accent-blue)' }}>
              <label className="metric-label" style={{ display: 'block', marginBottom: '6px' }}>
                {isCrypto ? 'Harga Entry ($)' : 'Harga Entry (Rp)'}
              </label>
              <input 
                type="number" 
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                step="any"
                style={{
                  width: '100%',
                  padding: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  background: 'var(--bg-canvas)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  outline: 'none'
                }}
              />
            </div>

            <div className="metric-box" style={{ borderLeft: '3px solid var(--accent-rust)' }}>
              <label className="metric-label" style={{ display: 'block', marginBottom: '6px' }}>
                {isCrypto ? 'Harga Stop Loss ($)' : 'Harga Stop Loss (Rp)'}
              </label>
              <input 
                type="number" 
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(e.target.value)}
                step="any"
                style={{
                  width: '100%',
                  padding: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  background: 'var(--bg-canvas)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Results Section */}
          <div style={{ background: 'var(--bg-panel-subtle)', border: '1px solid var(--border-color)', padding: '20px' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.05em' }}>
                UKURAN POSISI MAKSIMAL:
              </div>
              <div style={{ fontSize: '42px', fontWeight: '900', color: 'var(--accent-green)', lineHeight: '1.1' }}>
                {!isCrypto ? `${maxLots} LOT` : `${formatTokens(maxTokens)} UNIT`}
              </div>
              {!isCrypto ? (
                maxLots > 0 && (
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '4px' }}>
                    ({(maxLots * 100).toLocaleString()} Lembar Saham)
                  </div>
                )
              ) : (
                maxTokens > 0 && (
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '4px' }}>
                    Total Alokasi: ${totalPositionValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                  </div>
                )
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              
              <div style={{ background: 'var(--bg-panel)', padding: '12px', borderLeft: '4px solid var(--accent-rust)' }}>
                <div className="metric-label">{isCrypto ? 'Max Risk Amount (USDT)' : 'Max Risk Amount (Rupiah)'}</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-rust)' }}>
                  {isCrypto ? `$${riskAmount.toFixed(2)}` : `Rp ${Math.round(riskAmount).toLocaleString('id-ID')}`}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  (Jika kena Stop Loss)
                </div>
              </div>

              <div style={{ background: 'var(--bg-panel)', padding: '12px', borderLeft: '4px solid var(--accent-blue)' }}>
                <div className="metric-label">Total Position Value</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {isCrypto ? `$${totalPositionValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `Rp ${Math.round(totalPositionValue).toLocaleString('id-ID')}`}
                </div>
                <div style={{ fontSize: '11px', color: isWarning ? 'var(--accent-rust)' : 'var(--text-muted)' }}>
                  {positionPercent.toFixed(1)}% dari Portfolio
                </div>
              </div>

              <div style={{ background: 'var(--bg-panel)', padding: '12px', borderLeft: '4px solid var(--accent-green)' }}>
                <div className="metric-label">Target Price (Asumsi 1:2.2)</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-green)' }}>
                  {isCrypto ? `$${targetPrice > 0 ? (targetPrice < 1 ? targetPrice.toFixed(6) : targetPrice.toFixed(4)) : '-'}` : `Rp ${targetPrice > 0 ? Math.round(targetPrice).toLocaleString('id-ID') : '-'}`}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  R:R Ratio {rrRatioDisplay}
                </div>
              </div>

            </div>

            {/* Warning Message */}
            {isWarning && (
              <div style={{ 
                marginTop: '15px', 
                padding: '10px', 
                background: 'rgba(184, 50, 50, 0.1)', 
                border: '1px solid var(--accent-rust)',
                color: 'var(--accent-rust)',
                fontWeight: '700',
                fontSize: '12px',
                textAlign: 'center'
              }}>
                ⚠️ PERINGATAN: Posisi melebihi 25% dari total portfolio. Jaga diversifikasi aset!
              </div>
            )}
            
            {entry > 0 && sl >= entry && (
              <div style={{ 
                marginTop: '15px', 
                padding: '10px', 
                background: 'rgba(184, 50, 50, 0.1)', 
                border: '1px solid var(--accent-rust)',
                color: 'var(--accent-rust)',
                fontWeight: '700',
                fontSize: '12px',
                textAlign: 'center'
              }}>
                ⚠️ ERROR: Harga Stop Loss harus lebih rendah dari Harga Entry!
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
