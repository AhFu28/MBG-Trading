import React, { useState, useEffect } from 'react';

export default function LotCalculatorModal({ isOpen, onClose, prefillEntry = '', prefillSL = '' }) {
  const [modalAmount, setModalAmount] = useState(10000000);
  const [entryPrice, setEntryPrice] = useState(prefillEntry || '');
  const [stopLossPrice, setStopLossPrice] = useState(prefillSL || '');
  const [riskPercent, setRiskPercent] = useState(2);

  // Update prefill values if they change
  useEffect(() => {
    if (prefillEntry) setEntryPrice(prefillEntry);
    if (prefillSL) setStopLossPrice(prefillSL);
  }, [prefillEntry, prefillSL]);

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

  // Calculations
  const riskAmount = (Number(modalAmount) * Number(riskPercent)) / 100;
  
  let riskPerShare = 0;
  let maxLots = 0;
  let totalPositionValue = 0;
  let positionPercent = 0;
  let rrRatioDisplay = '-';
  let targetPrice = 0;

  const entry = Number(entryPrice);
  const sl = Number(stopLossPrice);

  if (entry > 0 && sl > 0 && entry > sl) {
    riskPerShare = entry - sl;
    
    // Check if riskPerShare is extremely small or zero
    if (riskPerShare > 0) {
      maxLots = Math.floor(riskAmount / (riskPerShare * 100));
      // prevent negative lots
      if (maxLots < 0) maxLots = 0;

      totalPositionValue = maxLots * 100 * entry;
      positionPercent = modalAmount > 0 ? (totalPositionValue / modalAmount) * 100 : 0;
      targetPrice = entry + (2.2 * riskPerShare);
      rrRatioDisplay = '1 : 2.2'; // As per prompt assumption
    }
  }

  const isWarning = positionPercent > 25;

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
        <div className="telemetry-header" style={{ background: '#1c1d22', color: '#fff', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--accent-green)', fontWeight: '700', fontSize: '14px' }}>
              💰 KALKULATOR LOT MBG APEX — ANTI BONCOS
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
          
          {/* Inputs Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div className="metric-box">
              <label className="metric-label" style={{ display: 'block', marginBottom: '6px' }}>Modal Portfolio (Rp)</label>
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
                min="1" max="100" step="0.5"
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
              <label className="metric-label" style={{ display: 'block', marginBottom: '6px' }}>Harga Entry (Rp)</label>
              <input 
                type="number" 
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
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
              <label className="metric-label" style={{ display: 'block', marginBottom: '6px' }}>Harga Stop Loss (Rp)</label>
              <input 
                type="number" 
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(e.target.value)}
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
                BELI MAKSIMAL:
              </div>
              <div style={{ fontSize: '48px', fontWeight: '900', color: 'var(--accent-green)', lineHeight: '1.1' }}>
                {maxLots} LOT
              </div>
              {maxLots > 0 && (
                <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '4px' }}>
                  ({(maxLots * 100).toLocaleString()} Lembar Saham)
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              
              <div style={{ background: 'var(--bg-panel)', padding: '12px', borderLeft: '4px solid var(--accent-rust)' }}>
                <div className="metric-label">Max Risk Amount (Rupiah)</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-rust)' }}>
                  Rp {riskAmount.toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  (Jika kena Stop Loss)
                </div>
              </div>

              <div style={{ background: 'var(--bg-panel)', padding: '12px', borderLeft: '4px solid var(--accent-blue)' }}>
                <div className="metric-label">Total Position Value</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Rp {totalPositionValue.toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: isWarning ? 'var(--accent-rust)' : 'var(--text-muted)' }}>
                  {positionPercent.toFixed(1)}% dari Portfolio
                </div>
              </div>

              <div style={{ background: 'var(--bg-panel)', padding: '12px', borderLeft: '4px solid var(--accent-green)' }}>
                <div className="metric-label">Target Price (Asumsi 1:2.2)</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-green)' }}>
                  Rp {targetPrice > 0 ? targetPrice.toLocaleString() : '-'}
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
                ⚠️ PERINGATAN: Posisi melebihi 25% dari total portfolio. Pastikan likuiditas saham memadai!
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
