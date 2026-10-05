import React, { useState } from 'react';
import AuthPanel from './AuthPanel.jsx';
import { PLANS, TIER, allowedModules, MODULE_TIER } from '../services/featureAccess.js';

/**
 * LandingPage — the first thing a visitor sees.
 *
 * Doubles as the sales page: it must state the offer honestly. There is no
 * performance claim here that the system cannot prove, because an inflating
 * landing page is how a trading product loses trust on day one.
 */

const MODULE_LABEL = {
  HOME: 'Home Command Center',
  SIGNALS: 'Sinyal Trading',
  NEWS: 'News & Riset Harian',
  CHANGELOG: 'Changelog',
  STOCK: 'Saham IDX',
  CRYPTO: 'Crypto Spot',
  AI_AGENTS: 'AI Multi-Agent Arena',
  RADAR: 'Early Signal Radar',
  DEGEN: 'Degen Memecoin Desk',
  FUTURES: 'Crypto Futures',
  FOREX: 'Forex Scanner',
  US_STOCKS: 'US Stocks',
  WHALES: 'Whale Tracker',
  HEATMAP: 'Market Heatmap',
  CHARTING: 'Charting Desk',
  SENTINEL: 'AI Sentinel Desk',
  WATCHLIST: 'Watchlist Pribadi',
  FLOW_PROCESS: 'Flow Process',
};

export default function LandingPage({ onAuthenticated, configured = true }) {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('signup');

  const open = (mode) => { setAuthMode(mode); setShowAuth(true); };

  const freeCount = allowedModules(TIER.FREE).length;
  const proCount = Object.keys(MODULE_TIER).length;

  const section = { maxWidth: '1080px', margin: '0 auto', padding: '0 22px' };

  return (
    <div style={{
      minHeight: '100vh', background: 'radial-gradient(circle at 20% 0%, rgba(99,102,241,0.13) 0%, transparent 45%), #070a13',
      color: 'var(--text-primary)', fontFamily: 'inherit', overflowX: 'hidden',
    }}>

      {/* ===== NAV ===== */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(7,10,19,0.86)', backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ ...section, height: '62px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontWeight: '900', fontSize: '15px' }}>
            <span style={{ fontSize: '19px' }}>📡</span>
            <span>MBG TRADING</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '9px', alignItems: 'center' }}>
            <button
              onClick={() => open('login')}
              style={{
                padding: '8px 16px', borderRadius: '8px', fontSize: '12.5px', fontWeight: '700',
                background: 'transparent', color: 'var(--text-secondary)',
                border: '1px solid rgba(255,255,255,0.14)', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Masuk
            </button>
            <button
              onClick={() => open('signup')}
              style={{
                padding: '8px 18px', borderRadius: '8px', fontSize: '12.5px', fontWeight: '900',
                background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Daftar Gratis
            </button>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section style={{ ...section, paddingTop: '64px', paddingBottom: '56px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: showAuth ? '1fr 400px' : '1fr',
          gap: '52px', alignItems: 'center',
        }}>
          <div>
            <div style={{
              display: 'inline-block', fontSize: '11px', fontWeight: '800', padding: '5px 13px',
              borderRadius: '9999px', background: 'rgba(99,102,241,0.14)',
              border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc', marginBottom: '20px',
            }}>
              Terminal Trading Kuantitatif
            </div>

            <h1 style={{
              fontSize: 'clamp(30px, 5vw, 50px)', lineHeight: 1.1, fontWeight: '900',
              letterSpacing: '-0.03em', margin: '0 0 18px 0',
            }}>
              Sinyal Trading dengan<br />
              <span style={{
                background: 'linear-gradient(135deg,#818cf8,#22d3ee)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Entry, Stop Loss & Target
              </span>
              <br />yang Jelas
            </h1>

            <p style={{
              fontSize: '14.5px', lineHeight: 1.75, color: 'var(--text-secondary)',
              maxWidth: '560px', margin: '0 0 28px 0',
            }}>
              Screening harian untuk <strong>saham IDX</strong>, <strong>kripto spot</strong> dan{' '}
              <strong>komoditas</strong> — lengkap dengan level entry, stop loss, target,
              dan alasan di balik setiap setup. Ditambah 16 bot AI otonom yang
              berjalan terjadwal untuk menguji strategi tanpa henti.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '30px' }}>
              <button
                onClick={() => open('signup')}
                style={{
                  padding: '13px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: '900',
                  background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Mulai Gratis →
              </button>
              <button
                onClick={() => open('login')}
                style={{
                  padding: '13px 26px', borderRadius: '10px', fontSize: '14px', fontWeight: '700',
                  background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)',
                  border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Sudah punya akun
              </button>
            </div>

            {/* Honest stat row — countable facts only, no performance promises */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '14px', maxWidth: '620px',
            }}>
              {[
                ['5', 'Kelas aset terpantau'],
                ['16', 'Bot AI otonom'],
                ['24 jam', 'Jendela sinyal (Free)'],
                ['0', 'Jam (Pro — real-time)'],
              ].map(([value, text]) => (
                <div key={text} style={{
                  background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '11px', padding: '13px 15px',
                }}>
                  <div style={{ fontSize: '19px', fontWeight: '900', color: '#818cf8' }}>{value}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.4 }}>
                    {text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showAuth && (
            <div>
              <AuthPanel
                initialMode={authMode}
                headline="Gratis untuk mulai. Upgrade kapan saja."
                onAuthenticated={onAuthenticated}
              />
            </div>
          )}
        </div>
      </section>

      {/* ===== WHAT YOU GET ===== */}
      <section style={{ ...section, paddingBottom: '56px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.02em', marginBottom: '8px' }}>
          Apa yang bisa Anda akses?
        </h2>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '26px', maxWidth: '640px', lineHeight: 1.7 }}>
          Akun gratis membuka {freeCount} modul. Berlangganan Pro membuka seluruhnya ({proCount} modul),
          termasuk sinyal real-time tanpa jeda.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {Object.entries(MODULE_TIER).map(([id, minTier]) => {
            const isPro = minTier === TIER.PRO;
            const isGuest = minTier === TIER.GUEST;
            const badge = isPro ? { text: 'PRO', color: '#fbbf24', bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.38)' }
              : isGuest ? { text: 'PUBLIK', color: '#34d399', bg: 'rgba(16,185,129,0.13)', border: 'rgba(16,185,129,0.35)' }
                : { text: 'GRATIS', color: '#818cf8', bg: 'rgba(99,102,241,0.14)', border: 'rgba(99,102,241,0.38)' };
            return (
              <div key={id} style={{
                background: 'rgba(255,255,255,0.032)',
                border: `1px solid ${isPro ? 'rgba(245,158,11,0.20)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '11px', padding: '13px 15px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px',
              }}>
                <span style={{ fontSize: '12.5px', fontWeight: '700' }}>
                  {isPro && <span style={{ marginRight: '6px', opacity: 0.65 }}>🔒</span>}
                  {MODULE_LABEL[id] || id}
                </span>
                <span style={{
                  fontSize: '9px', fontWeight: '900', padding: '3px 8px', borderRadius: '9999px',
                  background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                  whiteSpace: 'nowrap',
                }}>
                  {badge.text}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="harga" style={{ ...section, paddingBottom: '60px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.02em', marginBottom: '26px' }}>
          Pilih Paket Anda
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px', maxWidth: '820px' }}>
          {PLANS.map(plan => (
            <div key={plan.id} style={{
              position: 'relative',
              background: plan.highlight
                ? 'linear-gradient(165deg, rgba(245,158,11,0.09) 0%, rgba(15,20,35,0.97) 55%)'
                : 'rgba(255,255,255,0.032)',
              border: plan.highlight ? '1px solid rgba(245,158,11,0.42)' : '1px solid rgba(255,255,255,0.09)',
              borderRadius: '16px', padding: '26px 24px',
            }}>
              {plan.highlight && (
                <div style={{
                  position: 'absolute', top: '-11px', left: '22px',
                  fontSize: '9.5px', fontWeight: '900', padding: '4px 12px', borderRadius: '9999px',
                  background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000',
                }}>
                  PALING POPULER
                </div>
              )}

              <div style={{ fontSize: '15px', fontWeight: '900', color: plan.highlight ? '#fbbf24' : 'var(--text-primary)' }}>
                {plan.name}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '3px', marginBottom: '16px' }}>
                {plan.tagline}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px', marginBottom: '20px' }}>
                <span style={{ fontSize: '30px', fontWeight: '900', letterSpacing: '-0.03em' }}>{plan.price}</span>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{plan.period}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {plan.features.map(f => (
                  <div key={f} style={{ fontSize: '12px', display: 'flex', gap: '8px', lineHeight: 1.55 }}>
                    <span style={{ color: '#34d399', flexShrink: 0 }}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
                {plan.missing.map(f => (
                  <div key={f} style={{ fontSize: '12px', display: 'flex', gap: '8px', lineHeight: 1.55, opacity: 0.5 }}>
                    <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>✕</span>
                    <span style={{ textDecoration: 'line-through' }}>{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => open(plan.id === TIER.FREE ? 'signup' : 'signup')}
                style={{
                  width: '100%', padding: '12px', borderRadius: '9px', fontSize: '13px', fontWeight: '900',
                  fontFamily: 'inherit', cursor: 'pointer', border: 'none',
                  background: plan.highlight ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'rgba(99,102,241,0.9)',
                  color: plan.highlight ? '#000' : '#fff',
                }}
              >
                {plan.cta}
              </button>

              {plan.highlight && (
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '11px', lineHeight: 1.6, textAlign: 'center' }}>
                  Pembayaran via transfer bank atau QRIS.
                  Aktivasi dilakukan manual setelah pembayaran dikonfirmasi.
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ===== HONEST DISCLAIMER ===== */}
      <section style={{ ...section, paddingBottom: '68px' }}>
        <div style={{
          background: 'rgba(244,63,94,0.065)', border: '1px solid rgba(244,63,94,0.26)',
          borderRadius: '13px', padding: '18px 22px', lineHeight: 1.8,
        }}>
          <div style={{ fontSize: '12.5px', fontWeight: '900', color: '#fb7185', marginBottom: '7px' }}>
            ⚠️ PENTING — BACA SEBELUM BERLANGGANAN
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            MBG Trading adalah <strong>alat bantu screening dan analisis</strong>, bukan penasihat investasi.
            Kami <strong>tidak menjanjikan keuntungan</strong> dan tidak menjamin harga akan mencapai target.
            Seluruh trading mengandung risiko kehilangan modal, termasuk kehilangan seluruh modal.
            Level Entry / Stop Loss / Target adalah <strong>perencanaan</strong>, bukan kepastian.
            Kinerja masa lalu <strong>tidak menjamin</strong> hasil di masa depan. Keputusan akhir
            sepenuhnya milik Anda.
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.07)', padding: '26px 0',
        textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)',
      }}>
        <div style={section}>
          MBG Trading — Market Brain Grid · Terminal Kuantitatif
        </div>
      </footer>
    </div>
  );
}
