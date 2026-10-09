import React, { useState } from 'react';
import { usePreferences } from '../context/PreferencesContext.jsx';

export default function OnboardingModal({ isOpen, onClose }) {
  const { marketFocus, setMarketFocus } = usePreferences();
  const [selected, setSelected] = useState(marketFocus || 'ALL');

  if (!isOpen) return null;

  const handleFinish = () => {
    setMarketFocus(selected);
    try {
      localStorage.setItem('mbg_onboarded_v1', 'true');
    } catch (e) {}
    onClose && onClose();
  };

  const options = [
    {
      id: 'ALL',
      title: 'Multi-Asset Terpadu (Direkomendasikan)',
      desc: 'Pantau Saham IDX, Kripto Global, dan Intelijen Makro dalam satu dashboard terpadu.',
      icon: '🌐',
      badge: 'Lengkap'
    },
    {
      id: 'IDX',
      title: 'Saham Indonesia (IDX / BEI)',
      desc: 'Fokus pada IHSG, emiten LQ45/kompas100, analisis arus dana asing & bandarmology.',
      icon: '🇮🇩',
      badge: 'Pasar Saham'
    },
    {
      id: 'CRYPTO',
      title: 'Kripto Global (Spot & Futures)',
      desc: 'Fokus pada BTC, ETH, altcoins, likuiditas whale, dan volatilitas 24/7.',
      icon: '⚡',
      badge: 'Pasar 24/7'
    }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          backgroundColor: '#0b0f19',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(99, 102, 241, 0.15)',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          color: '#f8fafc'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚀</div>
          <h2 style={{ margin: 0, fontSize: '19px', fontWeight: '900', letterSpacing: '-0.02em', color: '#fff' }}>
            Selamat Datang di MBG Trading
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5 }}>
            Sistem Terminal Intelijen Kuantitatif. Pilih fokus pasar utama Anda agar pengalaman navigasi lebih terarah:
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {options.map((opt) => {
            const isChecked = selected === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: isChecked ? '1.5px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isChecked ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontSize: '24px', lineHeight: 1, marginTop: '2px' }}>{opt.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: '800', color: isChecked ? '#fff' : '#e2e8f0' }}>
                      {opt.title}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isChecked ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                        color: isChecked ? '#a5b4fc' : '#94a3b8'
                      }}
                    >
                      {opt.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>
                    {opt.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          <button
            type="button"
            onClick={handleFinish}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '9px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
            }}
          >
            Mulai Masuk ke Terminal →
          </button>
          <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--slate-500)' }}>
            Preferensi fokus pasar dapat diubah sewaktu-waktu di menu Pengaturan.
          </div>
        </div>
      </div>
    </div>
  );
}
