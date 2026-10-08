import React, { useState, useEffect, useMemo } from 'react';
import { institutionalPaperBroker, BinanceLiveAdapter, BROKER_FEES } from '../services/brokerGateway.js';

export default function OrderExecutionModal({
  isOpen,
  onClose,
  prefill = null, // { symbol, market, entryPrice, stopLoss, target1, target2, agentId, agentName }
  livePrices = {},
  onOrderSuccess = () => {}
}) {
  const [brokerType, setBrokerType] = useState('PAPER'); // 'PAPER' | 'BINANCE'
  const [riskPercent, setRiskPercent] = useState(1.5);
  const [orderType, setOrderType] = useState('LIMIT');
  const [orderSide, setOrderSide] = useState('BUY');

  // Input states
  const [symbol, setSymbol] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [target1, setTarget1] = useState('');
  const [target2, setTarget2] = useState('');
  const [customLots, setCustomLots] = useState('');

  // Binance API Config state (stored locally in memory/localStorage)
  const [binanceConfig, setBinanceConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('mbg_binance_config');
      return saved ? JSON.parse(saved) : { apiKey: '', secretKey: '', isTestnet: true };
    } catch {
      return { apiKey: '', secretKey: '', isTestnet: true };
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  /** Persist Binance API credentials to the same key the initialiser reads. */
  const updateBinanceConfig = (patch) => {
    setBinanceConfig((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem('mbg_binance_config', JSON.stringify(next));
      } catch {
        // Storage disabled (private mode): keep working in memory for this session.
      }
      return next;
    });
  };

  // Load prefill values
  useEffect(() => {
    if (prefill) {
      setSymbol(prefill.symbol || 'BBCA');
      setEntryPrice(prefill.entryPrice || prefill.currentPrice || '');
      setStopLoss(prefill.stopLoss || '');
      setTarget1(prefill.target1 || prefill.take_profit_1 || '');
      setTarget2(prefill.target2 || prefill.take_profit_2 || '');
      setOrderSide(prefill.direction || 'BUY');
      setCustomLots('');
      setErrorMessage('');
      setSuccessMessage('');
    } else if (isOpen && !symbol) {
      setSymbol('BBCA');
      setEntryPrice('10000');
      setStopLoss('9600');
      setTarget1('10500');
      setTarget2('11000');
      setOrderSide('BUY');
    }
  }, [prefill, isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isIdr = (prefill?.market === 'IDX') || (!symbol.includes('USDT') && !symbol.includes('/') && prefill?.market !== 'CRYPTO');
  const isShort = orderSide === 'SELL';
  const currencySymbol = isIdr ? 'Rp ' : '$';

  const entry = Number(entryPrice) || 0;
  const sl = Number(stopLoss) || 0;
  const tp1 = Number(target1) || 0;
  const tp2 = Number(target2) || 0;

  // Bracket geometry guard: LONG needs SL<entry<TP; SHORT needs TP<entry<SL (IDX rejects SELL entirely).
  const bracketError = isIdr && isShort
    ? 'IDX long-only (OJK/BEI): gunakan broker lain untuk posisi SHORT.'
    : (sl > 0 && entry > 0 && ((isShort ? sl <= entry : sl >= entry))
      ? (isShort ? 'Stop Loss harus DI ATAS harga entry untuk posisi SHORT.' : 'Stop Loss harus DI BAWAH harga entry untuk posisi LONG.')
      : (tp1 > 0 && entry > 0 && (isShort ? tp1 >= entry : tp1 <= entry)
        ? (isShort ? 'Target 1 harus DI BAWAH harga entry untuk posisi SHORT.' : 'Target 1 harus DI ATAS harga entry untuk posisi LONG.')
        : null));

  // Account balance from paper broker
  const brokerSummary = institutionalPaperBroker.getSummary();
  const availableCash = isIdr ? brokerSummary.cashIdr : brokerSummary.cashUsdt;

  // Math: Risk-weighted Lot / Unit sizing
  const riskAmount = (availableCash * (Number(riskPercent) || 1.5)) / 100;
  const feeRate = isIdr ? BROKER_FEES.IDX_EQUITY.buy : BROKER_FEES.CRYPTO_SPOT.taker;
  const pureRiskPerUnit = Math.abs(entry - sl);
  const feePerUnit = entry * feeRate;
  const totalRiskPerUnit = pureRiskPerUnit + feePerUnit;

  let calculatedLots = 0;
  let calculatedUnits = 0;

  if (entry > 0 && pureRiskPerUnit > 0) {
    if (isIdr) {
      const riskBasedLots = Math.floor(riskAmount / (totalRiskPerUnit * 100));
      const cashCapacityLots = Math.floor(availableCash / (entry * 100 * (1 + feeRate)));
      calculatedLots = Math.max(1, Math.min(riskBasedLots, cashCapacityLots));
    } else {
      const riskUnits = riskAmount / totalRiskPerUnit;
      const cashUnits = availableCash / (entry * (1 + feeRate));
      calculatedUnits = Math.min(riskUnits, cashUnits);
    }
  }

  const effectiveQuantity = isIdr 
    ? (Number(customLots) > 0 ? Number(customLots) * 100 : calculatedLots * 100)
    : (Number(customLots) > 0 ? Number(customLots) : Number(calculatedUnits.toFixed(4)));

  const notionalValue = effectiveQuantity * entry;
  const totalFee = notionalValue * feeRate;
  const totalRequiredCapital = notionalValue + totalFee;
  const isOverAllocated = notionalValue > availableCash;

  // Structural R:R
  const riskDistance = Math.abs(entry - sl);
  const rewardDistance = Math.abs(tp1 - entry);
  const netRR = riskDistance > 0 ? (rewardDistance / riskDistance).toFixed(2) : '2.0';

  const handleTransmitOrder = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      if (entry <= 0) throw new Error('Harga entri harus valid dan lebih besar dari 0.');
      if (sl <= 0) throw new Error('Level Stop Loss harus diisi untuk membatasi risiko.');
      if (bracketError) throw new Error(bracketError);
      if (isOverAllocated) throw new Error('Total modal yang dibutuhkan melebihi saldo kas tersedia.');

      if (brokerType === 'PAPER') {
        const newPos = institutionalPaperBroker.placeOrder({
          symbol: symbol.toUpperCase(),
          market: isIdr ? 'IDX' : 'CRYPTO',
          side: orderSide,
          type: orderType,
          price: entry,
          lots: isIdr ? (effectiveQuantity / 100) : 0,
          quantity: effectiveQuantity,
          stopLoss: sl,
          target1: tp1,
          target2: tp2,
          agentId: prefill?.agentId || 'MANUAL',
          agentName: prefill?.agentName || 'Manual Trader'
        });

        setSuccessMessage(`✅ Order berhasil dieksekusi di Paper Broker! ID: ${newPos.id}`);
        onOrderSuccess(newPos);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        // Binance Live Execution
        if (!binanceConfig.apiKey || !binanceConfig.secretKey) {
          throw new Error('API Key & Secret Key Binance belum dikonfigurasi.');
        }

        const adapter = new BinanceLiveAdapter(binanceConfig.apiKey, binanceConfig.secretKey, binanceConfig.isTestnet);
        const result = await adapter.placeOrder({
          symbol,
          side: orderSide,
          type: orderType,
          quantity: effectiveQuantity,
          price: entry
        });

        setSuccessMessage(`✅ Order live berhasil dikirim ke Binance! Order ID: ${result.orderId}`);
        onOrderSuccess(result);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal mengirim order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-panel, #0f141f)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '10px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.85)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'var(--font-sans)'
        }}
      >
        {/* Header Bar */}
        <div style={{
          padding: '12px 18px',
          background: 'rgba(59, 130, 246, 0.08)',
          borderBottom: 'var(--border-hairline)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>⚡</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                INSTITUTIONAL EXECUTION GATEWAY // {symbol}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Verifikasi parameter risiko sebelum order ditransmisikan ke bursa
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* 1. Broker Route Selector */}
          <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-panel-subtle)', padding: '4px', borderRadius: '6px' }}>
            <button
              type="button"
              onClick={() => setBrokerType('PAPER')}
              style={{
                flex: 1,
                padding: '7px',
                fontSize: '11px',
                fontWeight: '800',
                borderRadius: '4px',
                border: 'none',
                background: brokerType === 'PAPER' ? 'var(--accent-blue, #3b82f6)' : 'transparent',
                color: brokerType === 'PAPER' ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              🛡️ Paper Sandbox Broker (Zero Risk)
            </button>
            <button
              type="button"
              onClick={() => setBrokerType('BINANCE')}
              style={{
                flex: 1,
                padding: '7px',
                fontSize: '11px',
                fontWeight: '800',
                borderRadius: '4px',
                border: 'none',
                background: brokerType === 'BINANCE' ? '#f59e0b' : 'transparent',
                color: brokerType === 'BINANCE' ? '#000000' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              🌐 Binance Live / Testnet API
            </button>
          </div>

          {/* Balance Strip */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-panel-subtle)', padding: '8px 12px', borderRadius: '4px', borderLeft: '3px solid var(--accent-green)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Saldo Kas Tersedia:</span>
            <span style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>
              {isIdr ? `Rp ${Math.round(availableCash).toLocaleString('id-ID')}` : `$${availableCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            </span>
          </div>

          {/* Binance credential entry.
              binanceConfig was read at submit time (line ~163) and its keys were
              required before a live order could be placed, but nothing ever
              called setBinanceConfig; so the live broker was unreachable by
              design. The fields now exist and persist to the same localStorage
              key the initialiser already reads. */}
          {brokerType === 'BINANCE' && (
            <div style={{
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '6px', padding: '12px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#fbbf24', marginBottom: '8px' }}>
                🔑 API Binance {binanceConfig.isTestnet ? '(TESTNET)' : '(LIVE : dana nyata)'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input
                  type="password"
                  placeholder="API Key"
                  value={binanceConfig.apiKey}
                  onChange={(e) => updateBinanceConfig({ apiKey: e.target.value })}
                  style={{ padding: '6px', background: 'var(--bg-canvas)', border: 'var(--border-hairline)', color: 'var(--text-primary)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                />
                <input
                  type="password"
                  placeholder="Secret Key"
                  value={binanceConfig.secretKey}
                  onChange={(e) => updateBinanceConfig({ secretKey: e.target.value })}
                  style={{ padding: '6px', background: 'var(--bg-canvas)', border: 'var(--border-hairline)', color: 'var(--text-primary)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '10.5px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={binanceConfig.isTestnet}
                  onChange={(e) => updateBinanceConfig({ isTestnet: e.target.checked })}
                />
                Pakai Testnet (disarankan, dana nyata Anda tidak tersentuh)
              </label>
            </div>
          )}

          {/* 2. Order Parameters Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Ticker Simbol</label>
              <input
                id="input-order-symbol"
                type="text"
                placeholder="Contoh: BBCA"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                style={{ width: '100%', padding: '6px', background: 'var(--bg-canvas)', border: 'var(--border-hairline)', color: 'var(--text-primary)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontWeight: '700' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Arah Order</label>
              <select
                value={orderSide}
                onChange={(e) => setOrderSide(e.target.value)}
                style={{ width: '100%', padding: '6px', background: 'var(--bg-canvas)', border: 'var(--border-hairline)', color: 'var(--text-primary)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontWeight: '700' }}
              >
                <option value="BUY">BUY / LONG</option>
                <option value="SELL">SELL / SHORT</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Tipe Eksekusi</label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                style={{ width: '100%', padding: '6px', background: 'var(--bg-canvas)', border: 'var(--border-hairline)', color: 'var(--text-primary)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontWeight: '700' }}
              >
                <option value="LIMIT">LIMIT ORDER</option>
                <option value="MARKET">MARKET (TAKER)</option>
              </select>
            </div>

            {/* Risk per trade.
                This was hardwired to 1.5% with no way to change it, yet the
                rupiah amount it produces is displayed to the user below. A
                risk-sized order the trader cannot size is not a risk tool, so
                the input now exists and drives the lot maths at line ~94. */}
            <div>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                Risiko per Trade (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                value={riskPercent}
                onChange={(e) => setRiskPercent(e.target.value)}
                style={{ width: '100%', padding: '6px', background: 'var(--bg-canvas)', border: 'var(--border-hairline)', color: 'var(--text-primary)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontWeight: '700' }}
              />
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '3px' }}>
                Batas kerugian bila stop loss tersentuh
              </div>
            </div>

            <div>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Harga Entri ({currencySymbol})</label>
              <input
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                style={{ width: '100%', padding: '6px', background: 'var(--bg-canvas)', border: 'var(--border-hairline)', color: 'var(--text-primary)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontWeight: '700' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '10px', color: 'var(--accent-rust)', display: 'block', marginBottom: '3px' }}>Stop Loss ({currencySymbol})</label>
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                style={{ width: '100%', padding: '6px', background: 'var(--bg-canvas)', border: 'var(--border-hairline)', color: 'var(--accent-rust)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontWeight: '700' }}
              />
            </div>
          </div>

          {/* Targets Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--accent-green)', display: 'block', marginBottom: '3px' }}>Target Profit 1 (Lock BE) ({currencySymbol})</label>
              <input
                type="number"
                value={target1}
                onChange={(e) => setTarget1(e.target.value)}
                style={{ width: '100%', padding: '6px', background: 'var(--bg-canvas)', border: 'var(--border-hairline)', color: 'var(--accent-green)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontWeight: '700' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--accent-blue)', display: 'block', marginBottom: '3px' }}>Target Profit 2 (Runner) ({currencySymbol})</label>
              <input
                type="number"
                value={target2}
                onChange={(e) => setTarget2(e.target.value)}
                style={{ width: '100%', padding: '6px', background: 'var(--bg-canvas)', border: 'var(--border-hairline)', color: 'var(--accent-blue)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontWeight: '700' }}
              />
            </div>
          </div>

          {/* 3. Mathematical Verification Summary Card */}
          <div style={{ background: 'var(--bg-panel-subtle)', padding: '12px', borderRadius: '6px', border: 'var(--border-hairline)' }}>
            <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '8px' }}>
              KALKULASI RISIKO & NOTIONAL TERUKUR:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Ukuran Eksekusi</div>
                <div style={{ fontSize: '14px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {isIdr ? `${Math.floor(effectiveQuantity / 100)} Lot` : `${effectiveQuantity} Unit`}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Total Nilai Posisi</div>
                <div style={{ fontSize: '14px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {isIdr ? `Rp ${Math.round(notionalValue).toLocaleString('id-ID')}` : `$${notionalValue.toFixed(2)}`}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '9px', color: 'var(--accent-rust)' }}>Max Risiko Nominal</div>
                <div style={{ fontSize: '14px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-rust)' }}>
                  {isIdr ? `Rp ${Math.round(riskAmount).toLocaleString('id-ID')}` : `$${riskAmount.toFixed(2)}`}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '9px', color: 'var(--accent-green)' }}>Rasio Risk-Reward</div>
                <div style={{ fontSize: '14px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>
                  1 : {netRR}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '8px', fontSize: '9.5px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
              <span>Estimasi Biaya Transaksi: {isIdr ? `Rp ${Math.round(totalFee).toLocaleString('id-ID')}` : `$${totalFee.toFixed(2)}`}</span>
              <span>Alokasi Modal: {((notionalValue / (availableCash || 1)) * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* Bracket validation error (shown live, blocks submit) */}
          {bracketError && (
            <div style={{ padding: '8px 12px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid #f59e0b', borderRadius: '4px', color: '#fcd34d', fontSize: '11px', fontWeight: '700' }}>
              ⚠️ {bracketError}
            </div>
          )}

          {/* Feedback & Error alerts */}
          {errorMessage && (
            <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '4px', color: '#fca5a5', fontSize: '11px', fontWeight: '700' }}>
              ⚠️ {errorMessage}
            </div>
          )}

          {successMessage && (
            <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '4px', color: '#6ee7b7', fontSize: '11px', fontWeight: '700' }}>
              {successMessage}
            </div>
          )}

          {/* 4. Action Button */}
          <button
            type="button"
            onClick={handleTransmitOrder}
            disabled={isSubmitting || isOverAllocated || !!bracketError}
            style={{
              padding: '12px',
              fontSize: '13px',
              fontWeight: '900',
              letterSpacing: '0.04em',
              background: isOverAllocated 
                ? 'var(--text-muted)' 
                : (brokerType === 'PAPER' ? 'var(--accent-green, #10b981)' : '#f59e0b'),
              color: isOverAllocated ? '#ffffff' : '#000000',
              border: 'none',
              borderRadius: '6px',
              cursor: isOverAllocated ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              marginTop: '4px'
            }}
          >
            {isSubmitting 
              ? 'TRANSMITTING ORDER...' 
              : isOverAllocated
                ? 'SALDO KAS KURANG (OVER-ALLOCATED)'
                : (brokerType === 'PAPER' ? '🛡️ EKSEKUSI DI PAPER BROKER' : '⚡ TRANSMIT ORDER KE BURSA LIVE')}
          </button>

        </div>
      </div>
    </div>
  );
}
