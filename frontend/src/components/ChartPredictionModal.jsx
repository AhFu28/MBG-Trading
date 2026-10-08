import React, { useState, useEffect, useMemo } from 'react';
import {
  PREDICTION_STRATEGIES,
  PREDICTION_TIMEFRAMES,
  PREDICTION_STATUS,
  getStoredPredictions,
  submitPrediction,
  resolvePrediction,
  calculatePotentialPoints,
  getPredictionStats,
} from '../services/chartPredictions.js';

export default function ChartPredictionModal({
  isOpen,
  onClose,
  initialSymbol = 'BTCUSDT',
  initialMarket = 'CRYPTO',
  initialPrice = null,
  onPredictionSubmitted,
}) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [market, setMarket] = useState(initialMarket);
  const [direction, setDirection] = useState('BULLISH');
  const [entryPrice, setEntryPrice] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [strategy, setStrategy] = useState(PREDICTION_STRATEGIES[0].id);
  const [timeframe, setTimeframe] = useState('24H');
  const [rationale, setRationale] = useState('');

  const [feedbackError, setFeedbackError] = useState(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [activeTab, setActiveTab] = useState('FORM'); // 'FORM' | 'HISTORY'

  // Refresh predictions on open
  useEffect(() => {
    if (isOpen) {
      setPredictions(getStoredPredictions());
      setFeedbackError(null);
      setFeedbackSuccess(null);
      if (initialSymbol) setSymbol(initialSymbol);
      if (initialMarket) setMarket(initialMarket);
      if (initialPrice && Number(initialPrice) > 0) {
        const p = Number(initialPrice);
        setEntryPrice(String(p));
        // Sensible initial projections based on direction
        if (direction === 'BULLISH') {
          setStopLoss(String(Math.round(p * 0.97)));
          setTargetPrice(String(Math.round(p * 1.06)));
        } else {
          setStopLoss(String(Math.round(p * 1.03)));
          setTargetPrice(String(Math.round(p * 0.94)));
        }
      }
    }
  }, [isOpen, initialSymbol, initialMarket, initialPrice]);

  const stats = useMemo(() => getPredictionStats(), [predictions]);

  // Compute live potential points
  const potentialPoints = useMemo(() => {
    return calculatePotentialPoints({
      rationale,
      entryPrice: Number(entryPrice),
      stopLoss: Number(stopLoss),
      targetPrice: Number(targetPrice),
    });
  }, [rationale, entryPrice, stopLoss, targetPrice]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const rec = submitPrediction({
        symbol,
        market,
        direction,
        entryPrice,
        targetPrice,
        stopLoss,
        strategy,
        timeframe,
        rationale,
      });

      setPredictions(getStoredPredictions());
      setFeedbackSuccess(`✅ Prediksi untuk ${symbol} berhasil dikunci! Potensi skor: +${rec.potentialPoints} poin.`);
      if (onPredictionSubmitted) onPredictionSubmitted(rec);

      // Reset rationale
      setRationale('');
      setTimeout(() => {
        setActiveTab('HISTORY');
      }, 1200);
    } catch (err) {
      setFeedbackError(err.message || 'Gagal menyimpan prediksi.');
    }
  };

  const handleSimulateResolve = (predId, won) => {
    const verdict = won ? PREDICTION_STATUS.WON : PREDICTION_STATUS.LOST;
    const item = predictions.find(p => p.id === predId);
    if (!item) return;

    resolvePrediction(predId, {
      currentPrice: won ? item.targetPrice : item.stopLoss,
      verdict,
      verdictNote: won 
        ? 'Verifikasi simulasi: Target tercapai dengan strategi valid.' 
        : 'Verifikasi simulasi: Stop loss tersentuh.',
    });

    setPredictions(getStoredPredictions());
  };

  return (
    <div
      role="dialog"
      aria-label="Arena Prediksi Chart & Strategi"
      data-testid="chart-prediction-modal"
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
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-panel, #0e131f)',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
          borderRadius: '10px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.85)',
          overflow: 'hidden',
          fontFamily: 'var(--font-sans, system-ui, sans-serif)',
          color: 'var(--text-primary, #e2e8f0)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0) 100%)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🎯</span>
              <h2 style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '0.04em', margin: 0 }}>
                ARENA PREDIKSI CHART & SKOR STRATEGI
              </h2>
              <span style={{
                fontSize: '9.5px',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(234, 179, 8, 0.15)',
                color: 'var(--accent-gold, #facc15)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
              }}>
                PATH TO LEGEND
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
              Tebak arah chart dengan strategi tepat untuk meraih poin Mastery & unlock tier LEGEND.
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Modal"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Stats Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          padding: '10px 18px',
          background: 'rgba(0, 0, 0, 0.25)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '11px',
        }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase' }}>Total Prediksi</div>
            <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{stats.total}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase' }}>Win Rate</div>
            <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: stats.winRate !== '—' ? 'var(--accent-green, #10b981)' : 'var(--text-muted)' }}>
              {stats.winRate}% ({stats.won}/{stats.resolved})
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase' }}>Total Skor Quant</div>
            <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-gold, #facc15)' }}>
              {stats.totalPoints} PTS
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase' }}>Peringkat Analis</div>
            <div style={{ fontWeight: 800, fontSize: '10.5px' }}>{stats.rank}</div>
          </div>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', padding: '0 18px' }}>
          <button
            id="tab-btn-prediction-form"
            onClick={() => setActiveTab('FORM')}
            style={{
              padding: '9px 14px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'FORM' ? '2px solid var(--accent-gold, #facc15)' : '2px solid transparent',
              color: activeTab === 'FORM' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ➕ Pasang Prediksi Baru
          </button>
          <button
            id="tab-btn-prediction-history"
            onClick={() => setActiveTab('HISTORY')}
            style={{
              padding: '9px 14px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'HISTORY' ? '2px solid var(--accent-gold, #facc15)' : '2px solid transparent',
              color: activeTab === 'HISTORY' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            📋 Riwayat & Evaluasi ({predictions.length})
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'FORM' ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Asset & Direction */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label htmlFor="input-pred-symbol" style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                    Simbol Instrumen
                  </label>
                  <input
                    id="input-pred-symbol"
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="Contoh: BTCUSDT atau BBCA"
                    required
                    style={{
                      width: '100%',
                      padding: '7px 9px',
                      background: 'var(--bg-canvas, #090d16)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                    Arah Proyeksi Chart
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <button
                      type="button"
                      id="btn-pred-direction-bullish"
                      onClick={() => setDirection('BULLISH')}
                      style={{
                        padding: '7px',
                        background: direction === 'BULLISH' ? 'rgba(16, 185, 129, 0.25)' : 'var(--bg-canvas)',
                        border: direction === 'BULLISH' ? '1px solid var(--accent-emerald, #10b981)' : '1px solid rgba(255,255,255,0.1)',
                        color: direction === 'BULLISH' ? '#10b981' : 'var(--text-muted)',
                        borderRadius: '4px',
                        fontWeight: 800,
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      ▲ BULLISH
                    </button>
                    <button
                      type="button"
                      id="btn-pred-direction-bearish"
                      onClick={() => setDirection('BEARISH')}
                      style={{
                        padding: '7px',
                        background: direction === 'BEARISH' ? 'rgba(239, 68, 68, 0.25)' : 'var(--bg-canvas)',
                        border: direction === 'BEARISH' ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                        color: direction === 'BEARISH' ? '#ef4444' : 'var(--text-muted)',
                        borderRadius: '4px',
                        fontWeight: 800,
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      ▼ BEARISH
                    </button>
                  </div>
                </div>
              </div>

              {/* Price Levels Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div>
                  <label htmlFor="input-pred-entry" style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                    Harga Entri / Saat Ini
                  </label>
                  <input
                    id="input-pred-entry"
                    type="number"
                    step="any"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    placeholder="0"
                    required
                    style={{
                      width: '100%',
                      padding: '7px 9px',
                      background: 'var(--bg-canvas)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="input-pred-stop-loss" style={{ fontSize: '10px', color: 'var(--accent-rust, #f87171)', display: 'block', marginBottom: '3px' }}>
                    Stop Loss (Proteksi)
                  </label>
                  <input
                    id="input-pred-stop-loss"
                    type="number"
                    step="any"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="0"
                    required
                    style={{
                      width: '100%',
                      padding: '7px 9px',
                      background: 'var(--bg-canvas)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '4px',
                      color: 'var(--accent-rust, #f87171)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="input-pred-target" style={{ fontSize: '10px', color: 'var(--accent-emerald, #34d399)', display: 'block', marginBottom: '3px' }}>
                    Target Take Profit
                  </label>
                  <input
                    id="input-pred-target"
                    type="number"
                    step="any"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="0"
                    required
                    style={{
                      width: '100%',
                      padding: '7px 9px',
                      background: 'var(--bg-canvas)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '4px',
                      color: 'var(--accent-emerald, #34d399)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                    }}
                  />
                </div>
              </div>

              {/* Strategy & Timeframe */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label htmlFor="select-pred-strategy" style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                    Pondasi Strategi & Metodologi
                  </label>
                  <select
                    id="select-pred-strategy"
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 9px',
                      background: 'var(--bg-canvas)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {PREDICTION_STRATEGIES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="select-pred-timeframe" style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                    Horizon Waktu
                  </label>
                  <select
                    id="select-pred-timeframe"
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 9px',
                      background: 'var(--bg-canvas)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {PREDICTION_TIMEFRAMES.map(tf => (
                      <option key={tf.id} value={tf.id}>{tf.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rationale Textarea */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <label htmlFor="textarea-pred-rationale" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Alasan & Analisa Kuantitatif
                  </label>
                  <span style={{ fontSize: '9.5px', color: rationale.length >= 20 ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                    {rationale.length}/20 Karakter {rationale.length >= 20 ? '✓ (+25 Poin Bonus!)' : '(Minimal 20 kar untuk bonus analisa)'}
                  </span>
                </div>
                <textarea
                  id="textarea-pred-rationale"
                  rows={3}
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Jelaskan alasan setup: contohnya konfirmasi volume breakout, divergensi indikator, retest demand zone, atau inflow bandar..."
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'var(--bg-canvas)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                    fontSize: '11.5px',
                    lineHeight: '1.4',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Potential Points Strip */}
              <div style={{
                padding: '9px 12px',
                background: 'rgba(234, 179, 8, 0.08)',
                border: '1px solid rgba(234, 179, 8, 0.25)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  💎 Potensi Hadiah Poin Bila Analisa Benar:
                </div>
                <div style={{ fontSize: '13px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--accent-gold, #facc15)' }}>
                  +{potentialPoints} POIN MASTERY
                </div>
              </div>

              {feedbackError && (
                <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '4px', color: '#fca5a5', fontSize: '11px', fontWeight: 700 }}>
                  ⚠️ {feedbackError}
                </div>
              )}

              {feedbackSuccess && (
                <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '4px', color: '#6ee7b7', fontSize: '11px', fontWeight: 700 }}>
                  {feedbackSuccess}
                </div>
              )}

              <button
                id="btn-submit-prediction"
                type="submit"
                style={{
                  padding: '11px',
                  background: 'var(--accent-gold, #facc15)',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 900,
                  fontSize: '12px',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  marginTop: '4px',
                }}
              >
                🚀 KUNCI PREDIKSI STRATEGI
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {predictions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                  Belum ada prediksi tersimpan. Buat prediksi pertama Anda di tab sebelah!
                </div>
              ) : (
                predictions.map((p) => {
                  const isWon = p.status === PREDICTION_STATUS.WON;
                  const isLost = p.status === PREDICTION_STATUS.LOST;
                  const isPending = p.status === PREDICTION_STATUS.PENDING;

                  return (
                    <div
                      key={p.id}
                      style={{
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 900, fontSize: '13px', fontFamily: 'var(--font-mono)' }}>{p.symbol}</span>
                          <span style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            padding: '2px 5px',
                            borderRadius: '3px',
                            background: p.direction === 'BULLISH' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: p.direction === 'BULLISH' ? '#10b981' : '#ef4444',
                          }}>
                            {p.direction}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{p.timeframe}</span>
                        </div>

                        <div>
                          {isWon && (
                            <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '3px 7px', borderRadius: '4px' }}>
                              ✅ BENAR (+{p.pointsAwarded} Poin)
                            </span>
                          )}
                          {isLost && (
                            <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#ef4444', background: 'rgba(239, 68, 68, 0.15)', padding: '3px 7px', borderRadius: '4px' }}>
                              ❌ MELESET (0 Poin)
                            </span>
                          )}
                          {isPending && (
                            <span style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--accent-gold, #facc15)', background: 'rgba(234, 179, 8, 0.15)', padding: '3px 7px', borderRadius: '4px' }}>
                              ⏳ AKTIF (+{p.potentialPoints} Potensi)
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '14px', fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        <span>Entri: <strong style={{ color: 'var(--text-primary)' }}>{p.entryPrice}</strong></span>
                        <span>Target: <strong style={{ color: 'var(--accent-emerald)' }}>{p.targetPrice}</strong></span>
                        <span>Stop: <strong style={{ color: 'var(--accent-rust)' }}>{p.stopLoss}</strong></span>
                      </div>

                      {p.rationale && (
                        <div style={{ fontSize: '10.5px', color: 'var(--text-secondary, #cbd5e1)', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '5px 8px', borderRadius: '4px' }}>
                          "{p.rationale}"
                        </div>
                      )}

                      {/* Interactive testing / simulation trigger for pending forecasts */}
                      {isPending && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                          <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Simulasi Verifikasi:</span>
                          <button
                            type="button"
                            onClick={() => handleSimulateResolve(p.id, true)}
                            style={{
                              padding: '2px 8px',
                              background: 'rgba(16, 185, 129, 0.2)',
                              border: '1px solid #10b981',
                              color: '#6ee7b7',
                              borderRadius: '3px',
                              fontSize: '9.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            ✓ Simulasikan Sukses (Hit TP)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSimulateResolve(p.id, false)}
                            style={{
                              padding: '2px 8px',
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid #ef4444',
                              color: '#fca5a5',
                              borderRadius: '3px',
                              fontSize: '9.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            ✗ Simulasikan Gagal (Hit SL)
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
