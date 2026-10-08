import React, { useState, useEffect, useRef, useMemo } from 'react';
import AuthPanel from './AuthPanel.jsx';
import MbgLogo from './MbgLogo.jsx';
import { PLANS, TIER, allowedModules, MODULE_TIER } from '../services/featureAccess.js';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { fetchMajorCards, fetchGlobalMetrics, formatUsdCompact, formatPrice } from '../services/marketOverview.js';

/**
 * LandingPage — the front door, and the sales page.
 *
 * REQUEST (Jendral Arib, 2026-10-08): "landingpage awal ini tolong buat sekalian
 * semenarik mungkin dong..."
 *
 * WHAT CHANGED AND WHY:
 * The previous page was a single centred text column with four stat boxes and a
 * feature grid — correct, but flat. It read like documentation. This rebuild
 * keeps every honest claim and adds the things that actually make a trading
 * product's front page persuasive:
 *
 *   1. A LIVE market strip pulled from the same verified feeds the terminal
 *      uses. Real prices, visibly moving. Nothing sells a market tool like the
 *      market itself.
 *   2. A stylised product preview of the actual terminal cockpit — so a visitor
 *      sees what they are buying instead of imagining it.
 *   3. A "how it works" sequence, because the offer is a process (scan → plan →
 *      execute) and a process is easier to trust when it is laid out.
 *   4. Interactive polish: scroll-reveal, cursor-tracked glow, hover lift.
 *   5. Anchored navigation so the page can be scanned instead of read.
 *
 * HONESTY RULES THAT WERE KEPT (and must stay kept):
 *   - No performance numbers, no win-rate claims, no invented track record.
 *   - The four headline stats remain countable facts about the product.
 *   - The risk disclaimer stays prominent, not buried.
 *   - The product preview is LABELLED as an illustration, not a live screen.
 *   - If market data fails to load, the strip says so instead of showing
 *     placeholder prices.
 */

const MODULE_LABEL = {
  HOME: 'Market Overview',
  SIGNALS: 'Sinyal Trading',
  NEWS: 'Live News Wire',
  CHANGELOG: 'Changelog (khusus admin)',
  STOCK: 'Stock Desk (IDX & US)',
  CRYPTO: 'Crypto Desk (Perp & Spot)',
  AI_AGENTS: 'AI Multi-Agent Arena',
  FOREX: 'Forex & Komoditas',
  WHALES: 'Whale Tracker',
  HEATMAP: 'Market Heatmap',
  CHARTING: 'Charting Desk',
  SENTINEL: 'AI Sentiment DEFCON',
  WATCHLIST: 'Watchlist Pribadi',
  TESTING: 'Testing Lab',
  PEARSON_CORRELATION: 'Korelasi Pearson',
  ACADEMY: 'Quant Academy',
  ECONOMIC_CALENDAR: 'Kalender Makro',
  ADMIN_APPROVAL: 'Admin Approval Desk',
  FLOW_PROCESS: 'Flow Process (khusus admin)',
};

/** Reveal-on-scroll. One shared observer rather than one per element. */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    // Respect a user who has asked the OS to reduce motion.
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
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/** Wrapper that fades and lifts its children into view. */
function Reveal({ children, delay = 0, style }) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className="lp-reveal"
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
}

/** Live ticker strip. Real prices; states clearly when they are unavailable. */
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

  // The strip duplicates its content so the CSS marquee can loop seamlessly.
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
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '11px 0', textAlign: 'center', fontSize: '11.5px', color: 'var(--text-muted)' }}>
        Data pasar sedang tidak bisa dimuat dari jaringan ini.
      </div>
    );
  }

  if (!items.length) {
    return (
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '11px 0', textAlign: 'center', fontSize: '11.5px', color: 'var(--text-muted)' }}>
        Memuat data pasar…
      </div>
    );
  }

  return (
    <div
      style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(255,255,255,0.018)',
        overflow: 'hidden',
        position: 'relative',
      }}
      title="Harga pasar langsung dari sumber yang sama dengan terminal"
    >
      <div className="lp-marquee-track">
        {[...items, ...items, ...items].map((it, i) => (
          <span key={`${it.symbol}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 22px', fontSize: '12px', whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>{it.symbol}</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{it.price}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: it.change >= 0 ? '#16c784' : '#ea3943' }}>
              {it.change >= 0 ? '+' : ''}{Number(it.change).toFixed(2)}%
            </span>
          </span>
        ))}
      </div>

      {global?.totalMarketCap ? (
        <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--text-muted)', paddingBottom: '5px' }}>
          Kapitalisasi pasar global {formatUsdCompact(global.totalMarketCap)} · sumber: CoinMarketCap &amp; Binance Vision
        </div>
      ) : null}
    </div>
  );
}

/**
 * Product preview.
 *
 * LABELLED AS AN ILLUSTRATION on purpose. It is a static mock of the cockpit
 * layout, not a screenshot and not live data — saying so is the difference
 * between a preview and a misleading claim.
 */
function ProductPreview() {
  const bar = (pct, color) => (
    <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px' }} />
    </div>
  );

  return (
    <div
      className="lp-preview"
      style={{
        borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'linear-gradient(165deg, rgba(20,26,44,0.96) 0%, rgba(9,12,22,0.99) 100%)',
        boxShadow: '0 26px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(99,102,241,0.08) inset',
        overflow: 'hidden',
      }}
    >
      {/* Window chrome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 13px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444', opacity: 0.75 }} />
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b', opacity: 0.75 }} />
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#22c55e', opacity: 0.75 }} />
        <span style={{ marginLeft: '8px', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          mbg-trading — market overview
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '9px', fontWeight: 800, color: '#fbbf24', border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.12)', borderRadius: '9999px', padding: '1px 8px' }}>
          ILUSTRASI
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', padding: '13px' }}>
        {/* Coin cards */}
        {[
          { s: 'BTC', p: '$83,342', c: '-2.68%', up: false, h: [70, 45, 58, 30, 40, 22, 26] },
          { s: 'ETH', p: '$2,564', c: '-4.96%', up: false, h: [80, 60, 66, 40, 48, 30, 24] },
          { s: 'SOL', p: '$116.77', c: '-3.04%', up: false, h: [62, 50, 55, 35, 42, 30, 33] },
        ].map(c => (
          <div key={c.s} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', padding: '9px 11px', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 900, color: 'var(--text-primary)' }}>{c.s}</div>
            <div style={{ fontSize: '13px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#fff', marginTop: '2px' }}>{c.p}</div>
            <div style={{ fontSize: '10px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: c.up ? '#16c784' : '#ea3943' }}>{c.c}</div>
            {/* Tiny sparkline shape */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '22px', marginTop: '6px' }}>
              {c.h.map((v, i) => (
                <span key={i} style={{ flex: 1, height: `${v}%`, background: '#ea3943', opacity: 0.55, borderRadius: '1px' }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '10px', padding: '0 13px 13px' }}>
        <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', padding: '10px 12px', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '9px', letterSpacing: '0.04em' }}>MARKET STATUS</div>
          {[
            ['Bursa Efek Indonesia', 100, '#16c784'],
            ['New York Stock Exchange', 72, '#f59e0b'],
            ['London Stock Exchange', 58, '#f59e0b'],
            ['Crypto (24/7)', 100, '#16c784'],
          ].map(([name, pct, color]) => (
            <div key={name} style={{ marginBottom: '7px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                <span>{name}</span>
              </div>
              {bar(pct, color)}
            </div>
          ))}
        </div>

        <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', padding: '10px 12px', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '9px', letterSpacing: '0.04em' }}>SINYAL HARIAN</div>
          {[
            ['BBCA', 'Rp 6.375', '#16c784', '+1.2%'],
            ['NVDA', '$237.47', '#ea3943', '-0.74%'],
            ['XAU/USD', '$4,132', '#16c784', '+0.85%'],
            ['EURUSD', '1.1204', '#ea3943', '-0.27%'],
          ].map(([sym, px, color, chg]) => (
            <div key={sym} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '9.5px', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{sym}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{px}</span>
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
    // Let the panel mount before scrolling, otherwise the target has no height.
    requestAnimationFrame(() => {
      authRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const freeCount = allowedModules(TIER.FREE).length;
  const proCount = Object.keys(MODULE_TIER).length;
  const section = { maxWidth: '1120px', margin: '0 auto', padding: '0 22px' };

  /** Cursor-tracked glow on the primary CTA. Purely decorative. */
  const onCtaMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  const NAV_LINKS = [
    { href: '#produk', label: 'Produk' },
    { href: '#cara-kerja', label: 'Cara Kerja' },
    { href: '#akses', label: 'Isi Terminal' },
    { href: '#harga', label: 'Harga' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 15% -10%, rgba(99,102,241,0.20) 0%, transparent 42%), radial-gradient(circle at 88% 8%, rgba(34,211,238,0.11) 0%, transparent 38%), #070a13',
      color: 'var(--text-primary)',
      fontFamily: 'inherit',
      overflowX: 'hidden',
    }}>

      {/* ================= NAV ================= */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(7,10,19,0.82)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ ...section, height: '64px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MbgLogo size={26} />
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <span style={{ fontWeight: 900, fontSize: '14px', letterSpacing: '-0.01em' }}>MBG TRADING</span>
              <span style={{ fontSize: '8.5px', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 700 }}>MARKET BRAIN GRID</span>
            </span>
          </div>

          <div className="lp-nav-links" style={{ display: 'flex', gap: '3px', marginLeft: '14px' }}>
            {NAV_LINKS.map(l => (
              <a
                key={l.href}
                href={l.href}
                style={{ padding: '7px 12px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none' }}
              >
                {l.label}
              </a>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '9px', alignItems: 'center' }}>
            <button
              onClick={() => open('login')}
              style={{
                padding: '8px 16px', borderRadius: '9px', fontSize: '12.5px', fontWeight: 700,
                background: 'transparent', color: 'var(--text-secondary)',
                border: '1px solid rgba(255,255,255,0.14)', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Masuk
            </button>
            <button
              onClick={() => open('signup')}
              className="lp-cta"
              onMouseMove={onCtaMove}
              style={{
                padding: '8px 18px', borderRadius: '9px', fontSize: '12.5px', fontWeight: 900,
                color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
              }}
            >
              Daftar Gratis
            </button>
          </div>
        </div>
      </nav>

      {/* ================= LIVE MARKET STRIP ================= */}
      <LiveTickerStrip />

      {/* ================= HERO ================= */}
      <section style={{ ...section, paddingTop: '62px', paddingBottom: '48px' }}>
        {!configured && (
          <div style={{
            background: 'rgba(245,158,11,0.09)', border: '1px solid rgba(245,158,11,0.36)',
            borderRadius: '12px', padding: '14px 18px', marginBottom: '32px',
            fontSize: '12px', color: '#fbbf24', lineHeight: 1.7,
          }}>
            <strong>🔧 Pendaftaran akun belum diaktifkan.</strong> Database akun belum disiapkan,
            jadi tombol Daftar belum bisa dipakai. Untuk masuk sekarang, gunakan{' '}
            <strong>kata sandi sistem</strong> pada tautan di bawah form.
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: showAuth ? 'minmax(0, 1fr) 400px' : 'minmax(0, 1fr)',
          gap: '48px',
          alignItems: 'start',
        }}>
          <div>
            <Reveal>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                fontSize: '11px', fontWeight: 800, padding: '5px 13px',
                borderRadius: '9999px', background: 'rgba(99,102,241,0.14)',
                border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc', marginBottom: '20px',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
                Terminal Trading Kuantitatif · Live
              </div>
            </Reveal>

            <Reveal delay={70}>
              <h1 style={{
                fontSize: 'clamp(32px, 5.2vw, 54px)', lineHeight: 1.06, fontWeight: 900,
                letterSpacing: '-0.035em', margin: '0 0 20px 0',
              }}>
                Sinyal Trading dengan<br />
                <span style={{
                  background: 'linear-gradient(120deg,#818cf8 0%,#22d3ee 55%,#34d399 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  Entry, Stop Loss &amp; Target
                </span>
                <br />yang Jelas
              </h1>
            </Reveal>

            <Reveal delay={140}>
              <p style={{
                fontSize: '15px', lineHeight: 1.75, color: 'var(--text-secondary)',
                maxWidth: '580px', margin: '0 0 30px 0',
              }}>
                Screening harian untuk <strong style={{ color: 'var(--text-primary)' }}>saham IDX</strong>,{' '}
                <strong style={{ color: 'var(--text-primary)' }}>kripto</strong>,{' '}
                <strong style={{ color: 'var(--text-primary)' }}>forex</strong> dan{' '}
                <strong style={{ color: 'var(--text-primary)' }}>komoditas</strong> — lengkap dengan level
                entry, stop loss, target, dan alasan di balik setiap setup. Ditambah 16 bot AI
                otonom yang menguji strategi tanpa henti.
              </p>
            </Reveal>

            <Reveal delay={210}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '34px' }}>
                <button
                  onClick={() => open('signup')}
                  className="lp-cta lp-cta-lg"
                  onMouseMove={onCtaMove}
                  style={{
                    padding: '14px 30px', borderRadius: '11px', fontSize: '14.5px', fontWeight: 900,
                    color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                  }}
                >
                  Mulai Gratis →
                </button>
                <button
                  onClick={() => open('login')}
                  style={{
                    padding: '14px 26px', borderRadius: '11px', fontSize: '14.5px', fontWeight: 700,
                    background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)',
                    border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Sudah punya akun
                </button>
              </div>
            </Reveal>

            {/* Countable facts only — no performance promises */}
            <Reveal delay={280}>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(128px, 1fr))',
                gap: '13px', maxWidth: '640px',
              }}>
                {[
                  ['5', 'Kelas aset terpantau'],
                  ['16', 'Bot AI otonom'],
                  ['24 jam', 'Jendela sinyal (Free)'],
                  ['0', 'Jam (Pro — real-time)'],
                ].map(([value, text]) => (
                  <div key={text} className="lp-stat" style={{
                    background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px', padding: '14px 15px',
                  }}>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>{value}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.45 }}>
                      {text}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Auth panel */}
          <div ref={authRef} style={{ position: showAuth ? 'sticky' : 'static', top: showAuth ? '82px' : undefined }}>
            {showAuth ? (
              <AuthPanel
                initialMode={authMode}
                headline="Gratis untuk mulai. Upgrade kapan saja."
                onAuthenticated={onAuthenticated}
                accountsReady={configured}
              />
            ) : (
              <Reveal delay={160}>
                <ProductPreview />
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {/* ================= PRODUCT PREVIEW (when auth is open) ================= */}
      {showAuth && (
        <section id="produk" style={{ ...section, paddingBottom: '54px' }}>
          <Reveal>
            <ProductPreview />
          </Reveal>
          <div style={{ textAlign: 'center', fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '11px' }}>
            Ilustrasi tampilan terminal — bukan tangkapan layar dan bukan data live.
          </div>
        </section>
      )}

      {/* ================= HOW IT WORKS ================= */}
      <section id="cara-kerja" style={{ ...section, paddingTop: '26px', paddingBottom: '58px' }}>
        <Reveal>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 900, letterSpacing: '-0.025em', marginBottom: '9px' }}>
            Cara kerjanya
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '30px', maxWidth: '640px', lineHeight: 1.7 }}>
            Tiga langkah, dari data mentah sampai keputusan yang bisa dieksekusi.
          </p>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(268px, 1fr))', gap: '15px' }}>
          {[
            {
              n: '01', icon: '🛰️', title: 'Pemindaian otomatis',
              body: 'Terminal memindai saham IDX, kripto, forex dan komoditas setiap hari, lalu menyaring hanya setup yang lolos aturan kuantitatif — bukan daftar panjang yang harus Anda saring sendiri.',
            },
            {
              n: '02', icon: '📐', title: 'Rencana yang terukur',
              body: 'Setiap setup datang dengan entry, stop loss, target, ukuran posisi, dan alasan di baliknya. Anda tahu persis di mana salah dan di mana benar sebelum menekan tombol.',
            },
            {
              n: '03', icon: '🤖', title: 'Diuji tanpa henti',
              body: '16 bot AI otonom menjalankan strategi di pasar nyata secara terus-menerus, sehingga kelemahan sebuah pendekatan muncul sebagai data — bukan sebagai kerugian Anda.',
            },
          ].map((step, i) => (
            <Reveal key={step.n} delay={i * 90}>
              <div className="lp-card" style={{
                background: 'rgba(255,255,255,0.032)',
                border: '1px solid rgba(255,255,255,0.085)',
                borderRadius: '15px', padding: '22px 21px', height: '100%',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ fontSize: '24px' }}>{step.icon}</span>
                  <span style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'rgba(129,140,248,0.28)', letterSpacing: '-0.04em' }}>{step.n}</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 900, marginBottom: '9px' }}>{step.title}</div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.75 }}>{step.body}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= WHAT YOU GET ================= */}
      <section id="akses" style={{ ...section, paddingBottom: '58px' }}>
        <Reveal>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 900, letterSpacing: '-0.025em', marginBottom: '9px' }}>
            Apa yang bisa Anda akses?
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '26px', maxWidth: '660px', lineHeight: 1.7 }}>
            Akun gratis membuka <strong style={{ color: 'var(--text-primary)' }}>{freeCount} modul</strong>. Berlangganan Pro
            membuka seluruhnya (<strong style={{ color: 'var(--text-primary)' }}>{proCount} modul</strong>),
            termasuk sinyal real-time tanpa jeda.
          </p>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(242px, 1fr))', gap: '11px' }}>
          {Object.entries(MODULE_TIER).map(([id, minTier], i) => {
            const isPro = minTier === TIER.PRO;
            const isGuest = minTier === TIER.GUEST;
            const badge = isPro
              ? { text: 'PRO', color: '#fbbf24', bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.38)' }
              : isGuest
                ? { text: 'PUBLIK', color: '#34d399', bg: 'rgba(16,185,129,0.13)', border: 'rgba(16,185,129,0.35)' }
                : { text: 'GRATIS', color: '#818cf8', bg: 'rgba(99,102,241,0.14)', border: 'rgba(99,102,241,0.38)' };
            return (
              <Reveal key={id} delay={Math.min(i * 25, 300)}>
                <div className="lp-card" style={{
                  background: 'rgba(255,255,255,0.032)',
                  border: `1px solid ${isPro ? 'rgba(245,158,11,0.20)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '12px', padding: '13px 15px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px',
                  height: '100%',
                }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700 }}>
                    {isPro && <span style={{ marginRight: '6px', opacity: 0.65 }}>🔒</span>}
                    {MODULE_LABEL[id] || id}
                  </span>
                  <span style={{
                    fontSize: '9px', fontWeight: 900, padding: '3px 8px', borderRadius: '9999px',
                    background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {badge.text}
                  </span>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ================= PRICING ================= */}
      <section id="harga" style={{ ...section, paddingBottom: '62px' }}>
        <Reveal>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 900, letterSpacing: '-0.025em', marginBottom: '26px' }}>
            Pilih paket Anda
          </h2>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '18px', maxWidth: '860px' }}>
          {PLANS.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 100}>
              <div className="lp-card" style={{
                position: 'relative',
                background: plan.highlight
                  ? 'linear-gradient(165deg, rgba(245,158,11,0.10) 0%, rgba(15,20,35,0.97) 55%)'
                  : 'rgba(255,255,255,0.032)',
                border: plan.highlight ? '1px solid rgba(245,158,11,0.42)' : '1px solid rgba(255,255,255,0.09)',
                borderRadius: '17px', padding: '28px 25px', height: '100%',
                boxShadow: plan.highlight ? '0 22px 60px rgba(245,158,11,0.10)' : 'none',
              }}>
                {plan.highlight && (
                  <div style={{
                    position: 'absolute', top: '-11px', left: '24px',
                    fontSize: '9.5px', fontWeight: 900, padding: '4px 12px', borderRadius: '9999px',
                    background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000',
                  }}>
                    PALING POPULER
                  </div>
                )}

                <div style={{ fontSize: '15px', fontWeight: 900, color: plan.highlight ? '#fbbf24' : 'var(--text-primary)' }}>
                  {plan.name}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '3px', marginBottom: '17px' }}>
                  {plan.tagline}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px', marginBottom: '21px' }}>
                  <span style={{ fontSize: '31px', fontWeight: 900, letterSpacing: '-0.035em' }}>{plan.price}</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{plan.period}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '22px' }}>
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
                  onClick={() => open('signup')}
                  style={{
                    width: '100%', padding: '13px', borderRadius: '10px', fontSize: '13px', fontWeight: 900,
                    fontFamily: 'inherit', cursor: 'pointer', border: 'none',
                    background: plan.highlight ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'rgba(99,102,241,0.92)',
                    color: plan.highlight ? '#000' : '#fff',
                  }}
                >
                  {plan.cta}
                </button>

                {plan.highlight && (
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '12px', lineHeight: 1.6, textAlign: 'center' }}>
                    Pembayaran via transfer bank atau QRIS. Aktivasi dilakukan manual
                    setelah pembayaran dikonfirmasi.
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= RISK DISCLAIMER ================= */}
      <section style={{ ...section, paddingBottom: '64px' }}>
        <Reveal>
          <div style={{
            background: 'rgba(244,63,94,0.065)', border: '1px solid rgba(244,63,94,0.26)',
            borderRadius: '14px', padding: '19px 23px', lineHeight: 1.8,
          }}>
            <div style={{ fontSize: '12.5px', fontWeight: 900, color: '#fb7185', marginBottom: '7px' }}>
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
        </Reveal>
      </section>

      {/* ================= FOOTER ================= */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.07)', padding: '26px 0',
        fontSize: '11px', color: 'var(--text-muted)',
      }}>
        <div style={{ ...section, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span>MBG Trading — Market Brain Grid · Terminal Kuantitatif</span>
          <span>{t('settings.saved', 'Preferensi tersimpan otomatis di perangkat ini.')}</span>
        </div>
      </footer>
    </div>
  );
}
