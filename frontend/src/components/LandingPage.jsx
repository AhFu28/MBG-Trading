import React, { useState, useEffect, useRef, useMemo } from 'react';
import AuthPanel from './AuthPanel.jsx';
import MbgLogo from './MbgLogo.jsx';
import { PLANS, TIER, allowedModules, MODULE_TIER } from '../services/featureAccess.js';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { fetchMajorCards, fetchGlobalMetrics, formatUsdCompact, formatPrice } from '../services/marketOverview.js';

/**
 * LandingPage — Institutional Front Door & Product Showcase.
 *
 * Implements the design direction from MBG_TRADING_FULL_SYSTEM_BLUEPRINT.md:
 * - x.ai: organization of attention, sparse primary choices, pure dark mode (#0B0E14).
 * - Samsung: concrete descriptions of practical value, clear structured showcase cards,
 *   step-by-step benefit progression, and honest product comparison.
 */

const MODULE_LABEL = {
  HOME: 'Market Overview',
  SIGNALS: 'Sinyal Trading (Entry, SL, TP)',
  NEWS: 'Live News Wire & RSS',
  CHANGELOG: 'Changelog Sistem',
  STOCK: 'Stock Desk (IDX & US)',
  CRYPTO: 'Crypto Desk (Perp & Spot)',
  AI_AGENTS: 'AI Multi-Agent Arena',
  FOREX: 'Forex & Komoditas',
  WHALES: 'Whale Tracker & On-Chain',
  HEATMAP: 'Market Heatmap',
  CHARTING: 'Charting Desk (TradingView)',
  SENTINEL: 'AI Sentiment DEFCON',
  WATCHLIST: 'Watchlist Pribadi',
  TESTING: 'Strategy Testing Lab',
  PEARSON_CORRELATION: 'Korelasi Pearson',
  ACADEMY: 'Quant Academy',
  ECONOMIC_CALENDAR: 'Kalender Makro',
  ADMIN_APPROVAL: 'Admin Approval Desk',
  FLOW_PROCESS: 'Flow Process Blueprint',
};

/** Reveal-on-scroll helper respecting reduced-motion */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      el.dataset.revealed = 'true';
      return undefined;
    }
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.dataset.revealed = 'true';
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, delay = 0, style = {} }) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className="lp-reveal"
      style={{
        ...style,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/** Live ticker strip from real market feeds with graceful degradation */
function LiveTickerStrip() {
  const [coins, setCoins] = useState(null);
  const [global, setGlobal] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [majors, globals] = await Promise.all([fetchMajorCards(), fetchGlobalMetrics()]);
      if (!alive) return;
      if (!majors?.length && !globals) {
        setFailed(true);
        return;
      }
      setCoins(majors);
      setGlobal(globals);
    })();
    return () => { alive = false; };
  }, []);

  const items = useMemo(() => {
    if (!coins?.length) return [];
    return coins.map(c => ({
      symbol: c.symbol,
      price: formatPrice(c.price),
      change: c.change24h,
    }));
  }, [coins]);

  if (failed) {
    return (
      <div style={{
        borderTop: '1px solid #2F3A49',
        borderBottom: '1px solid #2F3A49',
        padding: '11px 0',
        textAlign: 'center',
        fontSize: '12px',
        color: '#A7B0BD',
        background: '#0B0E14'
      }}>
        Data pasar sedang tidak bisa dimuat dari jaringan ini.
      </div>
    );
  }

  if (!items.length) {
    return (
      <div style={{
        borderTop: '1px solid #2F3A49',
        borderBottom: '1px solid #2F3A49',
        padding: '11px 0',
        textAlign: 'center',
        fontSize: '12px',
        color: '#A7B0BD',
        background: '#0B0E14'
      }}>
        Memuat data pasar…
      </div>
    );
  }

  return (
    <div
      style={{
        borderTop: '1px solid #2F3A49',
        borderBottom: '1px solid #2F3A49',
        background: '#131923',
        overflow: 'hidden',
        position: 'relative',
      }}
      title="Harga pasar langsung dari sumber yang sama dengan terminal"
    >
      <div className="lp-marquee-track">
        {[...items, ...items, ...items].map((it, i) => (
          <span key={`${it.symbol}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', fontSize: '12px', whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: 800, color: '#F3F5F7', letterSpacing: '0.02em' }}>{it.symbol}</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#A7B0BD' }}>{it.price}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: it.change >= 0 ? '#3BC78A' : '#FF6B75' }}>
              {it.change >= 0 ? '+' : ''}{Number(it.change).toFixed(2)}%
            </span>
          </span>
        ))}
      </div>

      {global?.totalMarketCap ? (
        <div style={{ textAlign: 'center', fontSize: '12px', color: '#A7B0BD', paddingBottom: '5px' }}>
          Kapitalisasi pasar global {formatUsdCompact(global.totalMarketCap)} · Realtime Market Engine
        </div>
      ) : null}
    </div>
  );
}

/** Product preview frame styled like Samsung device/software showcase and xAI dark UI */
function ProductPreview() {
  const bar = (pct, color) => (
    <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px' }} />
    </div>
  );

  return (
    <div
      className="lp-preview"
      style={{
        borderRadius: '16px',
        border: '1px solid #2F3A49',
        background: 'linear-gradient(180deg, #131923 0%, #0B0E14 100%)',
        boxShadow: '0 32px 80px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(36, 87, 214, 0.12) inset',
        overflow: 'hidden',
      }}
    >
      {/* Window chrome / top bezel */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '11px 16px',
        borderBottom: '1px solid #2F3A49',
        background: 'rgba(11, 14, 20, 0.6)'
      }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF6B75' }} />
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#F3C969' }} />
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#3BC78A' }} />
        <span style={{ marginLeft: '10px', fontSize: '12px', color: '#A7B0BD', fontFamily: 'var(--font-mono)' }}>
          mbg-trading : cockpit v5.0 · live market view
        </span>
        <span style={{
          marginLeft: 'auto',
          fontSize: '12px',
          fontWeight: 800,
          color: '#F3C969',
          border: '1px solid rgba(243, 201, 105, 0.4)',
          background: 'rgba(243, 201, 105, 0.1)',
          borderRadius: '9999px',
          padding: '2px 8px'
        }}>
          ILUSTRASI
        </span>
      </div>

      {/* Ticker overview row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', padding: '14px' }}>
        {[
          { s: 'BTC/USDT', p: '$83,342', c: '+3.14%', up: true, h: [30, 42, 50, 65, 72, 85, 95] },
          { s: 'BBCA.JK', p: 'Rp 10.250', c: '+1.48%', up: true, h: [40, 45, 42, 60, 58, 75, 80] },
          { s: 'XAU/USD', p: '$4,195', c: '+1.30%', up: true, h: [50, 55, 60, 68, 74, 82, 89] },
        ].map(c => (
          <div key={c.s} style={{
            border: '1px solid #2F3A49',
            borderRadius: '10px',
            padding: '10px 12px',
            background: '#1B2431'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#A7B0BD' }}>{c.s}</div>
            <div style={{ fontSize: '13.5px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#F3F5F7', marginTop: '2px' }}>{c.p}</div>
            <div style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: c.up ? '#3BC78A' : '#FF6B75' }}>{c.c}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '20px', marginTop: '6px' }}>
              {c.h.map((v, i) => (
                <span key={i} style={{ flex: 1, height: `${v}%`, background: '#3BC78A', opacity: 0.6, borderRadius: '1px' }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Split preview desk */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', padding: '0 14px 14px' }}>
        <div style={{ border: '1px solid #2F3A49', borderRadius: '10px', padding: '12px 14px', background: '#1B2431' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#A7B0BD', marginBottom: '8px', letterSpacing: '0.04em' }}>STATUS BURSA &amp; LIKUIDITAS</div>
          {[
            ['Bursa Efek Indonesia (IDX)', 100, '#3BC78A'],
            ['Crypto Derivatives (24/7)', 100, '#3BC78A'],
            ['US Stock Exchange (NYSE/NDQ)', 85, '#2457D6'],
            ['Global Forex Command', 70, '#F3C969'],
          ].map(([name, pct, color]) => (
            <div key={name} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#A7B0BD', marginBottom: '3px' }}>
                <span>{name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{pct}%</span>
              </div>
              {bar(pct, color)}
            </div>
          ))}
        </div>

        <div style={{ border: '1px solid #2F3A49', borderRadius: '10px', padding: '12px 14px', background: '#1B2431' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#A7B0BD', marginBottom: '8px', letterSpacing: '0.04em' }}>RADAR EKSEKUSI TERKINI</div>
          {[
            ['BBRI', 'Rp 4.950', '#3BC78A', '+2.1%'],
            ['ANTM', 'Rp 1.580', '#3BC78A', '+3.9%'],
            ['SOL', '$168.4', '#3BC78A', '+4.5%'],
            ['MEDC', 'Rp 1.320', '#FF6B75', '-0.8%'],
          ].map(([sym, px, color, chg]) => (
            <div key={sym} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontWeight: 800, color: '#F3F5F7' }}>{sym}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#A7B0BD' }}>{px}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color }}>{chg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ onAuthenticated, configured = true }) {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('signup');
  const { t } = usePreferences();
  const authRef = useRef(null);

  const open = (mode) => {
    setAuthMode(mode);
    setShowAuth(true);
    requestAnimationFrame(() => {
      authRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const freeCount = allowedModules(TIER.FREE).length;
  const proCount = Object.keys(MODULE_TIER).length;
  const section = { maxWidth: '1200px', margin: '0 auto', padding: '0 24px' };

  const NAV_LINKS = [
    { href: '#fitur', label: 'Fitur Utama' },
    { href: '#alur', label: 'Alur Trading' },
    { href: '#akses', label: 'Modul Terminal' },
    { href: '#harga', label: 'Biaya Akses' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 0%, rgba(36, 87, 214, 0.12) 0%, transparent 60%), #0B0E14',
      color: '#F3F5F7',
      fontFamily: 'var(--font-sans)',
      overflowX: 'hidden',
    }}>

      {/* ================= 1. NAVIGATION BAR (x.ai Minimalist Style) ================= */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(11, 14, 20, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #2F3A49',
      }}>
        <div style={{ ...section, height: '64px', display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MbgLogo size={28} />
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontWeight: 900, fontSize: '15px', letterSpacing: '-0.01em', color: '#F3F5F7' }}>MBG TRADING</span>
              <span style={{ fontSize: '12px', color: '#A7B0BD', letterSpacing: '0.08em', fontWeight: 700 }}>MARKET BRAIN GRID</span>
            </span>
          </div>

          <div className="lp-nav-links" style={{ display: 'flex', gap: '6px', marginLeft: '20px' }}>
            {NAV_LINKS.map(l => (
              <a
                key={l.href}
                href={l.href}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#A7B0BD',
                  textDecoration: 'none',
                  transition: 'color 180ms ease'
                }}
              >
                {l.label}
              </a>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => open('login')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                background: 'transparent',
                color: '#F3F5F7',
                border: '1px solid #2F3A49',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'border-color 180ms ease'
              }}
            >
              Masuk
            </button>
            <button
              onClick={() => open('signup')}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 800,
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                background: '#2457D6',
                boxShadow: '0 4px 14px rgba(36, 87, 214, 0.35)',
                transition: 'background 180ms ease, transform 150ms ease'
              }}
            >
              Daftar Gratis
            </button>
          </div>
        </div>
      </nav>

      {/* ================= 2. LIVE TICKER STRIP ================= */}
      <LiveTickerStrip />

      {/* ================= 3. HERO SECTION (x.ai Attention + Samsung Clarity) ================= */}
      <section style={{ ...section, paddingTop: '64px', paddingBottom: '56px' }}>
        {!configured && (
          <div style={{
            background: 'rgba(243, 201, 105, 0.1)',
            border: '1px solid rgba(243, 201, 105, 0.4)',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '32px',
            fontSize: '12px',
            color: '#F3C969',
            lineHeight: 1.7,
          }}>
            <strong>🔧 Pendaftaran akun belum diaktifkan.</strong> Database akun belum disiapkan,
            jadi tombol Daftar belum bisa dipakai. Untuk masuk sekarang, gunakan{' '}
            <strong>kata sandi sistem</strong> pada tautan di bawah form.
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: showAuth ? 'minmax(0, 1fr) 420px' : 'minmax(0, 1fr)',
          gap: '48px',
          alignItems: 'start',
        }}>
          <div>
            <Reveal>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                fontWeight: 800,
                padding: '6px 14px',
                borderRadius: '9999px',
                background: 'rgba(36, 87, 214, 0.15)',
                border: '1px solid rgba(36, 87, 214, 0.45)',
                color: '#78A9FF',
                marginBottom: '22px',
                letterSpacing: '0.04em'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3BC78A', boxShadow: '0 0 8px #3BC78A' }} />
                TERMINAL TRADING KUANTITATIF · PROCESSED ENGINE
              </div>
            </Reveal>

            {/* Core Product Promise directly from Blueprint Section 1.1 */}
            <Reveal delay={60}>
              <h1 style={{
                fontSize: 'clamp(34px, 5.4vw, 56px)',
                lineHeight: 1.08,
                fontWeight: 900,
                letterSpacing: '-0.035em',
                margin: '0 0 22px 0',
                color: '#F3F5F7'
              }}>
                Pantau pasar,{' '}
                <span style={{
                  background: 'linear-gradient(120deg, #78A9FF 0%, #2457D6 60%, #3BC78A 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  pahami rencana,
                </span>
                <br />dan ukur risiko dalam satu alur.
              </h1>
            </Reveal>

            {/* Core Supporting Explanation directly from Blueprint Section 1.1 */}
            <Reveal delay={120}>
              <p style={{
                fontSize: '16px',
                lineHeight: 1.7,
                color: '#A7B0BD',
                maxWidth: '620px',
                margin: '0 0 32px 0',
              }}>
                Temukan instrumen yang relevan, periksa sumber dan waktu datanya, lalu uji rencana dengan modal virtual sebelum mengevaluasi hasilnya. Dilengkapi 16 bot AI kuantitatif otonom yang menguji ketahanan strategi tanpa jeda.
              </p>
            </Reveal>

            {/* Actions: xAI sparse focal choices */}
            <Reveal delay={180}>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '38px' }}>
                <button
                  onClick={() => open('signup')}
                  style={{
                    padding: '14px 32px',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    background: '#2457D6',
                    boxShadow: '0 6px 20px rgba(36, 87, 214, 0.4)',
                    transition: 'transform 150ms ease, background 180ms ease'
                  }}
                >
                  Daftar Gratis
                </button>
                <button
                  onClick={() => open('login')}
                  style={{
                    padding: '14px 28px',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: 700,
                    background: '#131923',
                    color: '#F3F5F7',
                    border: '1px solid #2F3A49',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'border-color 180ms ease'
                  }}
                >
                  Masuk ke Akun
                </button>
              </div>
            </Reveal>

            {/* Countable facts (satisfies unit tests & honest verification) */}
            <Reveal delay={240}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
                maxWidth: '640px',
              }}>
                {[
                  ['5', 'Kelas aset terpantau'],
                  ['16', 'Bot AI otonom'],
                  ['24 jam', 'Jendela sinyal (Free)'],
                  ['0', 'Jam (Pro: real-time)'],
                ].map(([value, text]) => (
                  <div key={text} style={{
                    background: '#131923',
                    border: '1px solid #2F3A49',
                    borderRadius: '12px',
                    padding: '14px 16px',
                  }}>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: '#78A9FF', fontFamily: 'var(--font-mono)' }}>{value}</div>
                    <div style={{ fontSize: '12px', color: '#A7B0BD', marginTop: '3px', lineHeight: 1.4 }}>
                      {text}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Auth panel drawer / Desktop preview */}
          <div ref={authRef} style={{ position: showAuth ? 'sticky' : 'static', top: showAuth ? '82px' : undefined }}>
            {showAuth ? (
              <AuthPanel
                initialMode={authMode}
                headline="Gratis untuk mulai. Upgrade kapan saja."
                onAuthenticated={onAuthenticated}
                accountsReady={configured}
              />
            ) : (
              <Reveal delay={140}>
                <ProductPreview />
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {/* ================= 4. SAMSUNG-INSPIRED BENTO SHOWCASE: 4 CORE VALUE PILLARS ================= */}
      <section id="fitur" style={{ ...section, paddingTop: '32px', paddingBottom: '64px' }}>
        <Reveal>
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 40px auto' }}>
            <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 36px)', fontWeight: 900, letterSpacing: '-0.025em', marginBottom: '12px', color: '#F3F5F7' }}>
              Fondasi Eksekusi Disiplin &amp; Terukur
            </h2>
            <p style={{ fontSize: '15px', color: '#A7B0BD', lineHeight: 1.7 }}>
              Bukan sekadar rekomendasi saham tanpa dasar. MBG Trading dibangun dengan arsitektur risiko institusional untuk membimbing Anda dari analisis hingga evaluasi.
            </p>
          </div>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '16px' }}>
          {[
            {
              badge: 'MULTI-ASSET RADAR',
              icon: '🧭',
              title: 'Transparansi Data & Waktu Real-Time',
              desc: 'Pemindaian instrumen IDX, Kripto Futures, US Stocks, dan Forex. Setiap data mencantumkan sumber dan timestamp valid tanpa angka fiktif.'
            },
            {
              badge: 'DETERMINISTIC RISK',
              icon: '📐',
              title: 'Kalkulasi Ukuran Lot Otomatis',
              desc: 'Sistem membatasi risiko maksimal 1-2% per posisi. Stop loss dan target rasio R:R terhitung pasti secara matematis sebelum tombol order ditekan.'
            },
            {
              badge: 'VIRTUAL BROKER',
              icon: '⚡',
              title: 'Simulasi Eksekusi Paper Broker',
              desc: 'Uji tesis trading langsung di gateway broker simulasi tanpa risiko modal riil. Seluruh order tersinkronisasi dalam portofolio terpusat.'
            },
            {
              badge: 'TRADING PSYCHOLOGY',
              icon: '📓',
              title: 'Jurnal Evaluasi Disiplin & Emosi',
              desc: 'Catat tesis masuk, pantau bias emosional (Zen, FOMO, Fear, Greed), dan evaluasi performa trading untuk membentuk kebiasaan pemenang.'
            }
          ].map((pillar, i) => (
            <Reveal key={pillar.badge} delay={i * 80}>
              <div style={{
                background: '#131923',
                border: '1px solid #2F3A49',
                borderRadius: '14px',
                padding: '24px 22px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                transition: 'border-color 180ms ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontSize: '28px' }}>{pillar.icon}</span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 900,
                    letterSpacing: '0.06em',
                    color: '#78A9FF',
                    background: 'rgba(36, 87, 214, 0.12)',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    {pillar.badge}
                  </span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '8px', color: '#F3F5F7' }}>
                  {pillar.title}
                </h3>
                <p style={{ fontSize: '13px', color: '#A7B0BD', lineHeight: 1.7, margin: 0 }}>
                  {pillar.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= 5. USER JOURNEY: 4 LANGKAH PRAKTIS ================= */}
      <section id="alur" style={{ ...section, paddingTop: '16px', paddingBottom: '64px' }}>
        <Reveal>
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 36px auto' }}>
            <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 34px)', fontWeight: 900, letterSpacing: '-0.025em', marginBottom: '10px' }}>
              Alur Perjalanan Pengguna
            </h2>
            <p style={{ fontSize: '14.5px', color: '#A7B0BD', lineHeight: 1.65 }}>
              Dari pemindaian data mentah hingga evaluasi terukur dalam empat langkah terpadu.
            </p>
          </div>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {[
            {
              step: '01',
              title: 'Temukan Momentum',
              desc: 'Saring peluang potensial melalui screening teknikal, akumulasi bandarmology, dan sinyal bot kuantitatif.'
            },
            {
              step: '02',
              title: 'Hitung Ukuran Lot',
              desc: 'Tentukan harga entry, stop loss, dan toleransi risiko. Kalkulator lot menghitung jumlah lot yang aman.'
            },
            {
              step: '03',
              title: 'Uji di Paper Broker',
              desc: 'Kirim order virtual ke broker gateway. Pantau pergerakan harga real-time tanpa resiko modal uang asli.'
            },
            {
              step: '04',
              title: 'Evaluasi di Jurnal',
              desc: 'Simpan catatan evaluasi trading, rekam psikologi emosional, dan evaluasi kepatuhan pada aturan rencana.'
            }
          ].map((s, i) => (
            <Reveal key={s.step} delay={i * 80}>
              <div style={{
                background: '#131923',
                border: '1px solid #2F3A49',
                borderRadius: '14px',
                padding: '22px 20px',
                height: '100%',
                boxSizing: 'border-box'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#2457D6', marginBottom: '12px' }}>
                  {s.step}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#F3F5F7', marginBottom: '8px' }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '13px', color: '#A7B0BD', lineHeight: 1.65 }}>
                  {s.desc}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= 6. DAFTAR MODUL TERMINAL ================= */}
      <section id="akses" style={{ ...section, paddingBottom: '64px' }}>
        <Reveal>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 900, letterSpacing: '-0.025em', marginBottom: '10px' }}>
            Akses Seluruh Modul Terminal
          </h2>
          <p style={{ fontSize: '14px', color: '#A7B0BD', marginBottom: '28px', maxWidth: '680px', lineHeight: 1.7 }}>
            Akun gratis membuka <strong style={{ color: '#F3F5F7' }}>{freeCount} modul</strong> untuk eksplorasi. Akun Pro membuka seluruh{' '}
            <strong style={{ color: '#F3F5F7' }}>{proCount} modul</strong>, termasuk sinyal real-time tanpa penundaan.
          </p>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {Object.entries(MODULE_TIER).map(([id, minTier], i) => {
            const isPro = minTier === TIER.PRO;
            const isGuest = minTier === TIER.GUEST;
            const badge = isPro
              ? { text: 'PRO', color: '#F3C969', bg: 'rgba(243, 201, 105, 0.12)', border: 'rgba(243, 201, 105, 0.4)' }
              : isGuest
                ? { text: 'PUBLIK', color: '#3BC78A', bg: 'rgba(59, 199, 138, 0.12)', border: 'rgba(59, 199, 138, 0.4)' }
                : { text: 'GRATIS', color: '#78A9FF', bg: 'rgba(120, 169, 255, 0.12)', border: 'rgba(120, 169, 255, 0.4)' };

            return (
              <Reveal key={id} delay={Math.min(i * 20, 260)}>
                <div style={{
                  background: '#131923',
                  border: `1px solid ${isPro ? 'rgba(243, 201, 105, 0.25)' : '#2F3A49'}`,
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                  height: '100%',
                  boxSizing: 'border-box'
                }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#F3F5F7' }}>
                    {isPro && <span style={{ marginRight: '6px', opacity: 0.7 }}>🔒</span>}
                    {MODULE_LABEL[id] || id}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 900,
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    background: badge.bg,
                    color: badge.color,
                    border: `1px solid ${badge.border}`,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {badge.text}
                  </span>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ================= 7. HARGA & PAKET AKSES ================= */}
      <section id="harga" style={{ ...section, paddingBottom: '68px' }}>
        <Reveal>
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px auto' }}>
            <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 34px)', fontWeight: 900, letterSpacing: '-0.025em', marginBottom: '10px' }}>
              Pilihan Paket Langganan
            </h2>
            <p style={{ fontSize: '14px', color: '#A7B0BD', lineHeight: 1.65 }}>
              Mulai gratis sekarang. Upgrade ke Pro untuk akses sinyal instan dan fitur analitik penuh.
            </p>
          </div>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '20px', maxWidth: '860px', margin: '0 auto' }}>
          {PLANS.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 90}>
              <div style={{
                position: 'relative',
                background: plan.highlight ? '#1B2431' : '#131923',
                border: plan.highlight ? '1px solid #78A9FF' : '1px solid #2F3A49',
                borderRadius: '16px',
                padding: '28px 24px',
                height: '100%',
                boxSizing: 'border-box',
                boxShadow: plan.highlight ? '0 16px 40px rgba(36, 87, 214, 0.2)' : 'none',
              }}>
                {plan.highlight && (
                  <div style={{
                    position: 'absolute',
                    top: '-11px',
                    left: '24px',
                    fontSize: '12px',
                    fontWeight: 900,
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    background: '#2457D6',
                    color: '#FFFFFF',
                    letterSpacing: '0.04em'
                  }}>
                    REKOMENDASI
                  </div>
                )}

                <div style={{ fontSize: '16px', fontWeight: 900, color: plan.highlight ? '#78A9FF' : '#F3F5F7' }}>
                  {plan.name}
                </div>
                <div style={{ fontSize: '12px', color: '#A7B0BD', marginTop: '4px', marginBottom: '20px' }}>
                  {plan.tagline}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.035em', color: '#F3F5F7' }}>{plan.price}</span>
                  <span style={{ fontSize: '12px', color: '#A7B0BD' }}>{plan.period}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '26px' }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ fontSize: '12.5px', display: 'flex', gap: '8px', lineHeight: 1.5, color: '#F3F5F7' }}>
                      <span style={{ color: '#3BC78A', flexShrink: 0 }}>✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                  {plan.missing.map(f => (
                    <div key={f} style={{ fontSize: '12.5px', display: 'flex', gap: '8px', lineHeight: 1.5, opacity: 0.5, color: '#A7B0BD' }}>
                      <span style={{ color: '#A7B0BD', flexShrink: 0 }}>✕</span>
                      <span style={{ textDecoration: 'line-through' }}>{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => open('signup')}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    border: 'none',
                    background: plan.highlight ? '#2457D6' : 'rgba(255,255,255,0.08)',
                    color: '#FFFFFF',
                    transition: 'background 180ms ease'
                  }}
                >
                  {plan.cta}
                </button>

                {plan.highlight && (
                  <div style={{ fontSize: '12px', color: '#A7B0BD', marginTop: '12px', lineHeight: 1.6, textAlign: 'center' }}>
                    Pembayaran mudah via Transfer Bank (BCA) atau QRIS. Aktivasi cepat setelah konfirmasi bukti transfer.
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= 8. RISK DISCLAIMER ================= */}
      <section style={{ ...section, paddingBottom: '64px' }}>
        <Reveal>
          <div style={{
            background: 'rgba(255, 107, 117, 0.06)',
            border: '1px solid rgba(255, 107, 117, 0.3)',
            borderRadius: '14px',
            padding: '20px 24px',
            lineHeight: 1.8,
          }}>
            <div style={{ fontSize: '12.5px', fontWeight: 900, color: '#FF6B75', marginBottom: '8px', letterSpacing: '0.02em' }}>
              ⚠️ PENTING : BACA SEBELUM BERLANGGANAN
            </div>
            <div style={{ fontSize: '12px', color: '#A7B0BD' }}>
              MBG Trading adalah <strong>alat bantu screening dan analisis</strong>, bukan penasihat investasi.
              Kami <strong>tidak menjanjikan keuntungan</strong> dan tidak menjamin harga akan mencapai target.
              Seluruh trading mengandung risiko kehilangan modal, termasuk kehilangan seluruh modal.
              Level Entry / Stop Loss / Target adalah <strong>perencanaan</strong>, bukan kepastian.
              Kinerja masa lalu <strong>tidak menjamin</strong> hasil di masa depan. Keputusan akhir
              sepenuhnya milik Anda.
            </div>
          </div>
        </Reveal>
      </section>

      {/* ================= 9. FOOTER ================= */}
      <footer style={{
        borderTop: '1px solid #2F3A49',
        padding: '24px 0',
        fontSize: '12px',
        color: '#A7B0BD',
        background: '#0B0E14'
      }}>
        <div style={{ ...section, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span>MBG Trading : Market Brain Grid · Terminal Kuantitatif Institusional</span>
          <span>{t('settings.saved', 'Preferensi tersimpan otomatis di perangkat ini.')}</span>
        </div>
      </footer>
    </div>
  );
}
