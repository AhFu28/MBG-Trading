import React, { useState, useEffect } from 'react';

/**
 * ComplianceRiskModal - Institutional Regulatory & Risk Acknowledgment
 * Ensures compliance with OJK / Capital Market screening standards:
 * - Clarifies non-advisory quantitative algorithmic screening
 * - Discloses simulation aspects & model estimation limits
 */
export default function ComplianceRiskModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const acknowledged = localStorage.getItem('mbg_risk_acknowledged_v2');
      if (!acknowledged) {
        setIsOpen(true);
      }
    } catch {
      // In private browsing mode or storage error, don't block
    }
  }, []);

  const handleAcknowledge = () => {
    try {
      localStorage.setItem('mbg_risk_acknowledged_v2', 'true');
    } catch {}
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999,
      padding: '16px'
    }}>
      <div style={{
        background: '#0d1117',
        border: '1px solid rgba(245, 158, 11, 0.4)',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '580px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
        overflow: 'hidden',
        color: '#c9d1d9'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #21262d',
          background: 'rgba(245, 158, 11, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-gold)', letterSpacing: '0.04em' }}>
              PERNYATAAN KEPATUHAN & PENGUNGKAPAN RISIKO (DISCLAIMER)
            </div>
            <div style={{ fontSize: '10px', color: '#8b949e' }}>
              Market Brain Grid (MBG) · Terminal Riset & Screening Kuantitatif
            </div>
          </div>
        </div>

        {/* Body content */}
        <div style={{ padding: '18px 20px', fontSize: '11px', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <strong style={{ color: '#ffffff' }}>1. Bukan Nasihat atau Rekomendasi Investasi:</strong>
            <p style={{ margin: '4px 0 0', color: '#8b949e' }}>
              Seluruh metrik, sinyal kuantitatif, proyeksi probabilitas, dan rencana transaksi yang ditampilkan di terminal MBG merupakan 
              hasil komputasi algoritma dan estimasi model statistik semata. Platform ini <strong>TIDAK</strong> bertindak sebagai Penasihat Investasi atau Manajer Investasi berizin.
            </p>
          </div>

          <div>
            <strong style={{ color: '#ffffff' }}>2. Data Simulasi & Keterbatasan Model:</strong>
            <p style={{ margin: '4px 0 0', color: '#8b949e' }}>
              Fitur seperti AI Agent Arena, Paper Portfolio, dan Backtest Lab merupakan lingkungan pengujian hipotetis tanpa uang nyata. Kinerja historis tidak menjamin hasil masa depan.
            </p>
          </div>

          <div>
            <strong style={{ color: '#ffffff' }}>3. Tanggung Jawab Keputusan Mandiri:</strong>
            <p style={{ margin: '4px 0 0', color: '#8b949e' }}>
              Segala risiko finansial yang timbul dari keputusan jual/beli instrumen pasar modal berada sepenuhnya di bawah kendali dan tanggung jawab pengguna secara mandiri.
            </p>
          </div>
        </div>

        {/* Footer Action */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #21262d',
          background: '#161b22',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          <div style={{ fontSize: '10px', color: '#8b949e' }}>
            Tekan setuju untuk melanjutkan akses ke workspace terminal.
          </div>
          <button
            onClick={handleAcknowledge}
            style={{
              background: 'var(--accent-gold)',
              color: '#000000',
              border: 'none',
              padding: '7px 18px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '800',
              cursor: 'pointer',
              letterSpacing: '0.03em'
            }}
          >
            SAYA MENGERTI & SETUJU
          </button>
        </div>
      </div>
    </div>
  );
}
