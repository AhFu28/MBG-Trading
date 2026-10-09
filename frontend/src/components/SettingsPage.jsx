import React, { useState, useEffect } from 'react';
import { usePreferences, LANGUAGES } from '../context/PreferencesContext.jsx';

function playSoundChime(chimeType = 'radar', volume = 0.6) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (chimeType === 'radar') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (chimeType === 'chime') {
      [587.33, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const start = now + idx * 0.1;
        g.gain.setValueAtTime(volume * 0.25, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.35);
      });
    } else if (chimeType === 'kaching') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const start = now + idx * 0.06;
        g.gain.setValueAtTime(volume * 0.2, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.3);
      });
    }
  } catch (err) {
    console.warn('AudioContext playback error:', err);
  }
}

export default function SettingsPage({ account = {} }) {
  const { language, setLanguage, t } = usePreferences();

  // Audio Notification Settings (Persisted in localStorage)
  const [audioEnabled, setAudioEnabled] = useState(() => {
    return localStorage.getItem('mbg_audio_alert_enabled') !== 'false';
  });
  const [chimeType, setChimeType] = useState(() => {
    return localStorage.getItem('mbg_audio_chime_type') || 'radar';
  });
  const [volume, setVolume] = useState(() => {
    return Number(localStorage.getItem('mbg_audio_volume')) || 0.7;
  });

  const handleToggleAudio = (val) => {
    setAudioEnabled(val);
    localStorage.setItem('mbg_audio_alert_enabled', String(val));
    if (val) playSoundChime(chimeType, volume);
  };

  const handleChangeChime = (type) => {
    setChimeType(type);
    localStorage.setItem('mbg_audio_chime_type', type);
    playSoundChime(type, volume);
  };

  const handleChangeVolume = (v) => {
    const val = Number(v);
    setVolume(val);
    localStorage.setItem('mbg_audio_volume', String(val));
  };

  const handleTestSound = () => {
    playSoundChime(chimeType, volume);
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '30px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        background: 'var(--bg-panel, #0a0d12)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>⚙️</span>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              PENGATURAN TERMINAL & SUARA
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
              Konfigurasi personalisasi, audio chime sinyal & preferensi bahasa
            </div>
          </div>
        </div>
        {account?.email && (
          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-sky)',
            background: 'rgba(56, 189, 248, 0.1)',
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(56, 189, 248, 0.2)'
          }}>
            {account.email}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '14px' }}>

        {/* ---- AUDIO & SOUND NOTIFICATIONS CARD ---- */}
        <div style={{
          background: 'var(--bg-panel, #0a0d12)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>🔊</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                Notifikasi Suara (Audio Chime)
              </span>
            </div>
            {/* Toggle switch */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              <input
                type="checkbox"
                checked={audioEnabled}
                onChange={(e) => handleToggleAudio(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ color: audioEnabled ? 'var(--accent-mint)' : '#64748b', fontWeight: 700 }}>
                {audioEnabled ? 'AKTIF' : 'SENYAP'}
              </span>
            </label>
          </div>

          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', lineHeight: 1.5 }}>
            Mainkan nada lonceng akustik seketika saat ada sinyal kuantitatif baru, breakout, atau eksekusi order di layar.
          </p>

          {/* Chime Preset Picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Pilihan Nada Suara:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              {[
                { id: 'radar', label: '⚡ Radar Ping', desc: 'Futuristik 880Hz' },
                { id: 'chime', label: '🔔 Terminal Ding', desc: 'Harmonik Ganda' },
                { id: 'kaching', label: '💎 Ka-Ching', desc: 'Arpeggio Cuan' },
              ].map(c => {
                const active = chimeType === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleChangeChime(c.id)}
                    style={{
                      background: active ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: active ? '1px solid var(--accent-sky)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '8px 6px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 800, color: active ? 'var(--accent-sky)' : '#cbd5e1' }}>
                      {c.label}
                    </span>
                    <span style={{ fontSize: '9px', color: '#64748b' }}>
                      {c.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Volume Control & Test Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Volume:</span>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleChangeVolume(e.target.value)}
                style={{ flex: 1, cursor: 'pointer' }}
              />
              <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: '#94a3b8', width: '28px' }}>
                {Math.round(volume * 100)}%
              </span>
            </div>
            <button
              type="button"
              onClick={handleTestSound}
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: 'var(--accent-mint)',
                fontSize: '11px',
                fontWeight: 800,
                padding: '5px 12px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ▶ Tes Suara
            </button>
          </div>

          {/* Penjelasan Transparan Akses Suara */}
          <div style={{
            fontSize: '10px',
            color: '#64748b',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '8px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            lineHeight: 1.5
          }}>
            💡 <strong>Apakah semua user dapat sound notif ini?</strong>
            <br />
            <strong>YA, SEMUA USER</strong> (Tamu, Free, & VIP) yang membuka terminal web ini otomatis mendengar audio chime saat ada pergerakan sinyal di browser. Notifikasi push pesan HP (Telegram) terhubung khusus untuk member <strong>VIP Pro</strong>.
          </div>
        </div>

        {/* ---- LANGUAGE PREFERENCES CARD ---- */}
        <div style={{
          background: 'var(--bg-panel, #0a0d12)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '8px' }}>
            <span style={{ fontSize: '16px' }}>🌐</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
              {t('settings.language', 'Bahasa Tampilan')}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
            Pilih bahasa utama untuk navigasi antarmuka dan laporan.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {LANGUAGES.map(lang => {
              const active = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: active ? '1px solid var(--accent-sky)' : '1px solid rgba(255, 255, 255, 0.06)',
                    background: active ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    color: active ? '#ffffff' : '#94a3b8',
                    fontSize: '11.5px',
                    fontWeight: active ? 800 : 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{lang.flag}</span>
                  <span style={{ flex: 1 }}>{lang.label}</span>
                  {active && <span style={{ color: 'var(--accent-sky)', fontSize: '11px' }}>✓</span>}
                </button>
              );
            })}
          </div>

          {/* Theme Status (Pure Dark Enforced) */}
          <div style={{
            marginTop: 'auto',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px'
          }}>
            <span style={{ color: '#64748b' }}>Tema Antarmuka:</span>
            <span style={{
              color: 'var(--accent-mint)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}>
              🕶️ SpaceX Pure Dark (Locked)
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
