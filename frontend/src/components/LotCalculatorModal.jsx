import React, { useState, useEffect } from 'react';

export default function LotCalculatorModal({
  isOpen,
  onClose,
  prefillEntry = '',
  prefillSL = '',
  initialMarket = 'IDX',
  initialSymbol = ''
}) {
  const [assetMode, setAssetMode] = useState(initialMarket === 'CRYPTO' ? 'CRYPTO' : 'IDX');
  const [modalAmount, setModalAmount] = useState(initialMarket === 'CRYPTO' ? 1000 : 10000000);
  const [entryPrice, setEntryPrice] = useState(prefillEntry || '');
  const [stopLossPrice, setStopLossPrice] = useState(prefillSL || '');
  const [riskPercent, setRiskPercent] = useState(2);
  const [isCopied, setIsCopied] = useState(false);

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

  // Format Helper for Rupiah Words
  const formatRupiahWords = (val) => {
    const n = Number(val) || 0;
    if (n >= 1e12) return `${(n / 1e12).toFixed(1)} Triliun Rupiah`;
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)} Miliar Rupiah`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(0)} Juta Rupiah`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)} Ribu Rupiah`;
    return `${n} Rupiah`;
  };

  // Calculations
  const riskAmount = (Number(modalAmount) * Number(riskPercent)) / 100;
  
  let riskPerUnit = 0;
  let maxLots = 0;
  let maxTokens = 0;
  let totalPositionValue = 0;
  let positionPercent = 0;
  let rrRatioDisplay = '-';
  let targetPrice = 0;
  let isCashCapped = false;
  let feeImpactTotal = 0;

  const entry = Number(entryPrice);
  const sl = Number(stopLossPrice);

  if (entry > 0 && sl > 0 && entry !== sl) {
    const isShort = sl > entry;
    // Friction fee modeling: IDX round-trip 0.40% (0.15% buy + 0.25% sell), Crypto 0.20% (0.10% x 2)
    const feeRate = isCrypto ? 0.002 : 0.004;
    const feePerUnit = entry * feeRate;
    riskPerUnit = Math.abs(entry - sl) + feePerUnit;
    
    if (riskPerUnit > 0) {
      if (!isCrypto) {
        // IDX: 1 lot = 100 lembar
        const riskLots = Math.floor(riskAmount / (riskPerUnit * 100));
        const maxAffordableLots = Math.floor(Number(modalAmount) / (entry * 100));
        // Bound by cash portfolio capacity (cannot buy more than 100% of cash in non-margin account)
        maxLots = Math.max(0, Math.min(riskLots, maxAffordableLots));
        isCashCapped = riskLots > maxAffordableLots && maxAffordableLots > 0;
        totalPositionValue = maxLots * 100 * entry;
        feeImpactTotal = totalPositionValue * feeRate;
      } else {
        // Crypto Spot: exact token units (fractional)
        const riskUnits = riskAmount / riskPerUnit;
        const maxAffordableUnits = Number(modalAmount) / entry;
        maxTokens = Math.max(0, Math.min(riskUnits, maxAffordableUnits));
        isCashCapped = riskUnits > maxAffordableUnits && maxAffordableUnits > 0;
        totalPositionValue = maxTokens * entry;
        feeImpactTotal = totalPositionValue * feeRate;
      }

      positionPercent = modalAmount > 0 ? (totalPositionValue / modalAmount) * 100 : 0;
      const pureStructuralRisk = Math.abs(entry - sl);
      targetPrice = isShort ? Math.max(0, entry - (2.2 * pureStructuralRisk)) : entry + (2.2 * pureStructuralRisk);
      rrRatioDisplay = isShort ? '1 : 2.2 (SHORT)' : '1 : 2.2 (LONG)';
    }
  }

  const isWarning = positionPercent > 25;

  const formatTokens = (val) => {
    if (val >= 100) return val.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (val >= 1) return val.toLocaleString('en-US', { maximumFractionDigits: 4 });
    return val.toLocaleString('en-US', { maximumFractionDigits: 6 });
  };

  const handleCopyExecution = () => {
    const text = `🎯 MBG APEX EXECUTION PLAN:\n` +
      (initialSymbol ? `Emiten: $${initialSymbol}\n` : '') +
      `Market: ${isCrypto ? 'CRYPTO SPOT' : 'SAHAM IDX'}\n` +
      `Sizing: ${!isCrypto ? `${maxLots} LOT (${(maxLots * 100).toLocaleString()} Lembar)` : `${formatTokens(maxTokens)} UNIT`}\n` +
      `Entry: ${isCrypto ? '$' + entry : 'Rp ' + entry.toLocaleString('id-ID')}\n` +
      `Stop Loss: ${isCrypto ? '$' + sl : 'Rp ' + sl.toLocaleString('id-ID')}\n` +
      `Target (1:2.2): ${isCrypto ? '$' + targetPrice.toFixed(4) : 'Rp ' + Math.round(targetPrice).toLocaleString('id-ID')}\n` +
      `Total Posisi: ${isCrypto ? '$' + totalPositionValue.toFixed(2) : 'Rp ' + Math.round(totalPositionValue).toLocaleString('id-ID')} (${positionPercent.toFixed(1)}% Porto)\n` +
      `Max Resiko: ${isCrypto ? '$' + riskAmount.toFixed(2) : 'Rp ' + Math.round(riskAmount).toLocaleString('id-ID')} (${riskPercent}%)`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(11, 14, 20, 0.85)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="telemetry-panel" style={{
        width: '100%',
        maxWidth: '720px',
        maxHeight: '92vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-panel)',
        border: 'var(--border-hairline)',
        borderRadius: '8px',
        boxShadow: '0 16px 40px rgba(0,0,0,0.45)'
      }}>
        
        {/* Modal Topbar */}
        <div className="telemetry-header" style={{
          background: 'var(--bg-panel-subtle)',
          borderBottom: 'var(--border-hairline)',
          padding: '12px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>💰</span>
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: '800', fontSize: '13px', letterSpacing: '0.03em' }}>
                KALKULATOR RISIKO & POSITION SIZING
              </div>
              {initialSymbol && (
                <div style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: '700', marginTop: '1px' }}>
                  Target Emiten: ${initialSymbol}
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '18px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Tutup Modal (ESC)"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Asset Mode Toggle: IDX vs CRYPTO */}
          <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-panel-subtle)', padding: '4px', borderRadius: '6px', border: 'var(--border-hairline)' }}>
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
                fontWeight: 800,
                fontSize: '11.5px',
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
                fontWeight: 800,
                fontSize: '11.5px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              ⚡ CRYPTO SPOT (USDT / TOKEN)
            </button>
          </div>

          {/* Inputs Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            
            {/* Modal Portfolio */}
            <div className="metric-box" style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '6px', border: 'var(--border-hairline)' }}>
              <label className="metric-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>{isCrypto ? 'Modal Portfolio ($ USDT)' : 'Modal Portfolio (Rp)'}</span>
              </label>
              <input 
                type="number" 
                value={modalAmount}
                onChange={(e) => setModalAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  fontWeight: '700',
                  background: 'var(--bg-canvas)',
                  color: 'var(--text-primary)',
                  border: 'var(--border-hairline)',
                  borderRadius: '4px',
                  outline: 'none'
                }}
              />
              <div style={{ fontSize: '10px', color: 'var(--accent-blue)', marginTop: '4px', fontWeight: '700' }}>
                {!isCrypto ? formatRupiahWords(modalAmount) : `$${Number(modalAmount || 0).toLocaleString()} USD`}
              </div>

              {/* Quick Preset Chips */}
              <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                {(isCrypto ? [500, 1000, 2500, 5000, 10000] : [10000000, 25000000, 50000000, 100000000, 500000000]).map(amt => (
                  <button
                    key={amt}
                    type="button"
                    className="telemetry-btn"
                    onClick={() => setModalAmount(amt)}
                    style={{
                      padding: '2px 6px',
                      fontSize: '9px',
                      fontWeight: '700',
                      background: Number(modalAmount) === amt ? 'var(--accent-blue)' : 'var(--bg-panel)',
                      color: Number(modalAmount) === amt ? '#fff' : 'var(--text-muted)',
                      borderColor: Number(modalAmount) === amt ? 'var(--accent-blue)' : 'var(--border-color)',
                      borderRadius: '3px'
                    }}
                  >
                    {isCrypto ? `$${amt.toLocaleString()}` : `${amt / 1e6} Jt`}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Risk % */}
            <div className="metric-box" style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '6px', border: 'var(--border-hairline)' }}>
              <label className="metric-label" style={{ display: 'block', marginBottom: '4px' }}>
                Resiko per Trade (%)
              </label>
              <input 
                type="number" 
                value={riskPercent}
                onChange={(e) => setRiskPercent(e.target.value)}
                min="0.5" max="20" step="0.5"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  fontWeight: '700',
                  background: 'var(--bg-canvas)',
                  color: 'var(--text-primary)',
                  border: 'var(--border-hairline)',
                  borderRadius: '4px',
                  outline: 'none'
                }}
              />
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Alokasi resiko: {!isCrypto ? `Rp ${Math.round(riskAmount).toLocaleString('id-ID')}` : `$${riskAmount.toFixed(2)}`}
              </div>

              {/* Quick Risk Chips */}
              <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                {[0.5, 1, 2, 3, 5].map(r => (
                  <button
                    key={r}
                    type="button"
                    className="telemetry-btn"
                    onClick={() => setRiskPercent(r)}
                    style={{
                      padding: '2px 6px',
                      fontSize: '9px',
                      fontWeight: '700',
                      background: Number(riskPercent) === r ? 'var(--accent-blue)' : 'var(--bg-panel)',
                      color: Number(riskPercent) === r ? '#fff' : 'var(--text-muted)',
                      borderColor: Number(riskPercent) === r ? 'var(--accent-blue)' : 'var(--border-color)',
                      borderRadius: '3px'
                    }}
                  >
                    {r}%
                  </button>
                ))}
              </div>
            </div>
            
            {/* Entry Price */}
            <div className="metric-box" style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '6px', borderLeft: '3px solid var(--accent-blue)', borderTop: 'var(--border-hairline)', borderRight: 'var(--border-hairline)', borderBottom: 'var(--border-hairline)' }}>
              <label className="metric-label" style={{ display: 'block', marginBottom: '4px' }}>
                {isCrypto ? 'Harga Entry ($)' : 'Harga Entry (Rp)'}
              </label>
              <input 
                type="number" 
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="Contoh: 945"
                step="any"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  fontWeight: '700',
                  background: 'var(--bg-canvas)',
                  color: 'var(--text-primary)',
                  border: 'var(--border-hairline)',
                  borderRadius: '4px',
                  outline: 'none'
                }}
              />
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Level beli rencana
              </div>
            </div>

            {/* Stop Loss Price */}
            <div className="metric-box" style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '6px', borderLeft: '3px solid var(--accent-rust)', borderTop: 'var(--border-hairline)', borderRight: 'var(--border-hairline)', borderBottom: 'var(--border-hairline)' }}>
              <label className="metric-label" style={{ display: 'block', marginBottom: '4px' }}>
                {isCrypto ? 'Harga Stop Loss ($)' : 'Harga Stop Loss (Rp)'}
              </label>
              <input 
                type="number" 
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(e.target.value)}
                placeholder="Contoh: 907"
                step="any"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  fontWeight: '700',
                  background: 'var(--bg-canvas)',
                  color: 'var(--text-primary)',
                  border: 'var(--border-hairline)',
                  borderRadius: '4px',
                  outline: 'none'
                }}
              />
              <div style={{ fontSize: '10px', color: 'var(--accent-rust-text, var(--accent-rust))', marginTop: '4px', fontWeight: '700' }}>
                {entry > 0 && sl > 0 ? `Resiko: ${(((entry - sl) / entry) * 100).toFixed(1)}%` : 'Batas cut loss'}
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', borderRadius: '6px', padding: '16px' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.06em' }}>
                UKURAN POSISI MAKSIMAL:
              </div>
              <div style={{ fontSize: '36px', fontWeight: '900', color: 'var(--accent-green-text, var(--accent-green))', lineHeight: '1.1', fontFamily: 'var(--font-mono)' }}>
                {!isCrypto ? `${maxLots} LOT` : `${formatTokens(maxTokens)} UNIT`}
              </div>
              {!isCrypto ? (
                maxLots > 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '4px', fontWeight: '600' }}>
                    ({(maxLots * 100).toLocaleString('id-ID')} Lembar Saham)
                  </div>
                )
              ) : (
                maxTokens > 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '4px', fontWeight: '600' }}>
                    Total Alokasi: ${totalPositionValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                  </div>
                )
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              
              <div style={{ background: 'var(--bg-panel)', padding: '10px', borderRadius: '4px', borderLeft: '3px solid var(--accent-rust)' }}>
                <div className="metric-label">{isCrypto ? 'Max Risk (USDT)' : 'Max Risk (Rupiah)'}</div>
                <div style={{ fontSize: '17px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-rust-text, var(--accent-rust))' }}>
                  {isCrypto ? `$${riskAmount.toFixed(2)}` : `Rp ${Math.round(riskAmount).toLocaleString('id-ID')}`}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Jika kena Stop Loss
                </div>
              </div>

              <div style={{ background: 'var(--bg-panel)', padding: '10px', borderRadius: '4px', borderLeft: '3px solid var(--accent-blue)' }}>
                <div className="metric-label">Total Nilai Transaksi</div>
                <div style={{ fontSize: '17px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {isCrypto ? `$${totalPositionValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `Rp ${Math.round(totalPositionValue).toLocaleString('id-ID')}`}
                </div>
                <div style={{ fontSize: '10px', color: isWarning ? 'var(--accent-rust-text, var(--accent-rust))' : 'var(--text-muted)' }}>
                  {positionPercent.toFixed(1)}% dari Total Porto
                </div>
              </div>

              <div style={{ background: 'var(--bg-panel)', padding: '10px', borderRadius: '4px', borderLeft: '3px solid var(--accent-green)' }}>
                <div className="metric-label">Target Take Profit (1:2.2)</div>
                <div style={{ fontSize: '17px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-green-text, var(--accent-green))' }}>
                  {isCrypto ? `$${targetPrice > 0 ? (targetPrice < 1 ? targetPrice.toFixed(6) : targetPrice.toFixed(4)) : '-'}` : `Rp ${targetPrice > 0 ? Math.round(targetPrice).toLocaleString('id-ID') : '-'}`}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  R:R Rasio {rrRatioDisplay}
                </div>
              </div>

            </div>

            {/* Warning & Error Messages */}
            {isCashCapped && (
              <div style={{ 
                marginTop: '10px', 
                padding: '6px 10px', 
                background: 'rgba(56, 189, 248, 0.1)', 
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '4px',
                color: '#38bdf8',
                fontWeight: '600',
                fontSize: '10.5px',
                textAlign: 'center'
              }}>
                ℹ️ Ukuran posisi dibatasi 100% saldo kas tunai portofolio (Batas akun cash reguler).
              </div>
            )}
            {isWarning && (
              <div style={{ 
                marginTop: '12px', 
                padding: '8px 12px', 
                background: 'rgba(220, 38, 38, 0.1)', 
                border: '1px solid var(--accent-rust)',
                borderRadius: '4px',
                color: 'var(--accent-rust-text, var(--accent-rust))',
                fontWeight: '700',
                fontSize: '11px',
                textAlign: 'center'
              }}>
                ⚠️ PERINGATAN: Posisi melebihi 25% dari total portfolio. Jaga diversifikasi aset!
              </div>
            )}
            
            {entry > 0 && sl >= entry && (
              <div style={{ 
                marginTop: '12px', 
                padding: '8px 12px', 
                background: 'rgba(220, 38, 38, 0.1)', 
                border: '1px solid var(--accent-rust)',
                borderRadius: '4px',
                color: 'var(--accent-rust-text, var(--accent-rust))',
                fontWeight: '700',
                fontSize: '11px',
                textAlign: 'center'
              }}>
                ⚠️ PERINGATAN: Harga Stop Loss ({sl}) harus lebih rendah dari Entry ({entry}) untuk posisi Long.
              </div>
            )}

            {/* Copy Execution Plan Button */}
            {entry > 0 && sl > 0 && maxLots > 0 && (
              <div style={{ marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={handleCopyExecution}
                  style={{
                    width: '100%',
                    padding: '9px',
                    fontSize: '12px',
                    fontWeight: '800',
                    background: isCopied ? 'var(--accent-green)' : 'var(--text-primary)',
                    color: 'var(--bg-canvas)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isCopied ? '✓ Rencana Eksekusi Berhasil Disalin!' : '📋 Salin Parameter Eksekusi (Lot, Entry, SL, TP)'}
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
