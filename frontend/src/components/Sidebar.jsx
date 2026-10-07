import React, { useState } from 'react';
import MbgLogo from './MbgLogo.jsx';
import { endSession } from '../services/sessionCleanup.js';

// Navigation grouped by WHAT YOU ARE DOING, not by asset class.
//
// WHY THIS CHANGED (2026-10-06)
// -----------------------------
// Jendral Arib: "struktur isi di webnya terlalu padat dan buanyak bgt".
// MARKETS had grown to ELEVEN items in one flat block, which is not a menu any
// more — it is a wall. Everything sat at the same level, so nothing was
// findable and every screen looked equally urgent.
//
// Now: 4 groups of 4-5, ordered by workflow:
//   TRADE      — put on a position (start here)
//   MARKETS    — what is moving
//   RESEARCH   — why it is moving
//   ACCOUNT    — you, and the system
//
// The highest-traffic desks (signals, futures, news) stay in the top group so
// daily work is one click, not a hunt through a list.
const PRIMARY_NAV_ITEMS = [
  // --- TRADE: the daily loop ---
  { id: 'HOME',              icon: '🏠', label: 'Home',              section: 'TRADE' },
  { id: 'SIGNALS',           icon: '📡', label: 'Sinyal Trading',    section: 'TRADE' },
  { id: 'AI_AGENTS',         icon: '🤖', label: 'AI Agent Arena',   section: 'TRADE' },
  { id: 'CHARTING',          icon: '📊', label: 'Charting Desk',    section: 'TRADE' },

  // --- MARKETS: where things are moving ---
  { id: 'FUTURES',           icon: '🔥', label: 'Crypto Futures',   section: 'MARKETS' },
  { id: 'CRYPTO',            icon: '⚡', label: 'Crypto Spot',      section: 'MARKETS' },
  { id: 'STOCK',             icon: '📈', label: 'Saham IDX',        section: 'MARKETS' },
  { id: 'US_STOCKS',         icon: '🇺🇸', label: 'US Stocks',       section: 'MARKETS' },
  { id: 'FOREX',             icon: '💱', label: 'Forex & Emas',     section: 'MARKETS' },

  // --- RESEARCH: why it is moving ---
  { id: 'NEWS',              icon: '📰', label: 'Live News Wire',   section: 'RESEARCH' },
  { id: 'WHALES',            icon: '🐋', label: 'Whale Tracker',    section: 'RESEARCH' },
  { id: 'HEATMAP',           icon: '🗺️', label: 'Market Heatmap',   section: 'RESEARCH' },
  { id: 'ECONOMIC_CALENDAR', icon: '📅', label: 'Kalender Makro',   section: 'RESEARCH' },
  { id: 'AI_SENTINEL',       icon: '🛡️', label: 'AI Sentinel Desk', section: 'RESEARCH' },

  // --- ACCOUNT ---
  { id: 'WATCHLIST',         icon: '⭐', label: 'Watchlist',        section: 'ACCOUNT' },
  { id: 'SUBSCRIPTION',      icon: '👑', label: 'Akun & Langganan', section: 'ACCOUNT' },
];

// Everything else lives behind one collapsed group. These are occasional tools,
// not daily desks — mixing them into the main list was most of the clutter.
const SECONDARY_TOOLS = [
  { id: 'TESTING',             icon: '🧪', label: 'Testing Lab' },
  { id: 'PEARSON_CORRELATION', icon: '🔗', label: 'Korelasi Pearson' },
  { id: 'ACADEMY',             icon: '🎓', label: 'Quant Academy' },
  { id: 'FLOW_PROCESS',        icon: '⚡', label: 'Flow Process' },
  { id: 'CHANGELOG',           icon: '📜', label: 'Changelog Update' },
];

const SECTIONS = ['TRADE', 'MARKETS', 'RESEARCH', 'ACCOUNT'];

export default function Sidebar({
  activeTab,
  setActiveTab,
  isMobileOpen,
  setMobileOpen,
  stockCount = 0,
  cryptoCount = 0,
  newsCount = 0,
  account = {},
  onOpenAiSentinel,
  onOpenDataIntegrity
}) {
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const isAdmin = !!account?.isAdmin || ['naufalarib60@gmail.com', 'ahmfuadi28@gmail.com'].includes(String(account?.email || '').toLowerCase());
  const visibleSecondaryTools = SECONDARY_TOOLS.filter(item => {
    if (item.id === 'FLOW_PROCESS' || item.id === 'CHANGELOG') {
      return isAdmin;
    }
    return true;
  });

  const getBadge = (id) => {
    if (id === 'AI_AGENTS') return 'PRO';
    if (id === 'AI_SENTINEL') return 'DEFCON';
    if (id === 'CHARTING') return 'PRO';
    if (id === 'WHALES') return 'SIM'; // simulated microstructure feed — honest label
    if (id === 'FUTURES') return 'LIVE';
    if (id === 'DEGEN') return 'NEW';
    if (id === 'RADAR') return 'SCAN';
    if (id === 'FOREX') return 'LIVE';
    if (id === 'US_STOCKS') return 'LIVE';
    if (id === 'STOCK') return stockCount > 0 ? stockCount : null;
    if (id === 'CRYPTO') return cryptoCount > 0 ? cryptoCount : null;
    if (id === 'NEWS') return newsCount > 0 ? newsCount : null;
    if (id === 'ADMIN_APPROVAL') return 'ADMIN';
    return null;
  };

  const handleLogout = async () => {
    if (!window.confirm('Logout dari sesi MBG Trading Terminal? Data watchlist & paper trading Anda tetap tersimpan aman.')) {
      return;
    }
    setLoggingOut(true);
    // Revoke the HTTP-only session cookie on the server, then scrub local
    // traces. The old handler only deleted the legacy `mbg_cockpit_auth` key
    // and reloaded, which signed the user straight back in — see the incident
    // note in services/sessionCleanup.js.
    await endSession();
    // Full reload is deliberate: App.jsx re-asks /api/auth and /api/account/me
    // from scratch, so LandingPage renders with no stale account state.
    window.location.reload();
  };

  return (
    <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>

      {/* === 1. LOGO / BRAND (Modern Dribbble Sleek Header) === */}
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderBottom: 'var(--border-hairline)' }}>
        <MbgLogo size={30} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '13px', fontWeight: '900', letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1 }}>
                MBG QUANT
              </span>
              <span style={{ fontSize: '8px', padding: '2px 5px', borderRadius: '4px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.15) 100%)', color: '#818cf8', fontWeight: '800', fontFamily: 'var(--font-mono)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                PRO
              </span>
            </div>
            {/* Live Streaming pulse indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="WebSocket Real-Time Feed Active">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', display: 'inline-block' }} />
              <span style={{ fontSize: '8px', color: '#10b981', fontWeight: '800', letterSpacing: '0.04em' }}>LIVE</span>
            </div>
          </div>
          <div style={{ fontSize: '8.5px', fontWeight: '600', letterSpacing: '0.04em', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '3px', lineHeight: 1 }}>
            Terminal & Web3 Desk
          </div>
        </div>
      </div>

      {/* === 2. NAV ITEMS & ACTIVE TICKER RADAR === */}
      <nav className="sidebar-nav">

        {/* Section 1: Command Center & Markets */}
        {SECTIONS.map(section => {
          const isAdmin = !!account?.isAdmin || ['naufalarib60@gmail.com', 'ahmfuadi28@gmail.com'].includes(String(account?.email || '').toLowerCase());
          let items = PRIMARY_NAV_ITEMS.filter(n => n.section === section);
          if (section === 'ACCOUNT' && isAdmin) {
            items = [
              ...items,
              { id: 'ADMIN_APPROVAL', icon: '⚡', label: 'Admin Approval Desk', section: 'ACCOUNT' }
            ];
          }
          return (
            <div key={section} style={{ marginBottom: '2px' }}>
              <div className="sidebar-nav-section-label">{section}</div>
              {items.map(item => {
                const badge = getBadge(item.id);
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (item.id === 'AI_SENTINEL' && onOpenAiSentinel) {
                        onOpenAiSentinel();
                      } else {
                        setActiveTab(item.id);
                      }
                      if (isMobileOpen) setMobileOpen(false);
                    }}
                    title={item.label}
                  >
                    <span className="sidebar-nav-icon">{item.icon}</span>
                    <span className="sidebar-nav-label">{item.label}</span>
                    {badge && <span className="sidebar-nav-badge">{badge}</span>}
                  </button>
                );
              })}

              {section !== SECTIONS[SECTIONS.length - 1] && <div className="sidebar-divider" />}
            </div>
          );
        })}

        {/* Section 3: Expandable Secondary Tools (Accordion to eliminate clutter) */}
        <div style={{ marginTop: '6px', padding: '0 8px' }}>
          <button
            onClick={() => setShowMoreTools(prev => !prev)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderRadius: '4px',
              border: 'var(--border-hairline)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '10px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <span>🔬 MORE QUANT TOOLS</span>
            <span>{showMoreTools ? '▲' : '▼'}</span>
          </button>

          {showMoreTools && (
            <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {visibleSecondaryTools.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (item.id === 'AI_SENTINEL' && onOpenAiSentinel) {
                        onOpenAiSentinel();
                      } else {
                        setActiveTab(item.id);
                      }
                      if (isMobileOpen) setMobileOpen(false);
                    }}
                    style={{ fontSize: '10px', padding: '5px 12px' }}
                    title={item.label}
                  >
                    <span className="sidebar-nav-icon" style={{ fontSize: '12px' }}>{item.icon}</span>
                    <span className="sidebar-nav-label">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </nav>

      {/* === 4. SYSTEM FOOTER === */}
      <div className="sidebar-footer" style={{ borderTop: 'var(--border-hairline)', background: 'var(--bg-panel-subtle)', padding: '6px 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => onOpenDataIntegrity ? onOpenDataIntegrity() : setActiveTab('CHANGELOG')}
            style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700', padding: '4px 6px', borderRadius: '4px' }}
            title="Periksa Integritas & Provenance Data Terminal"
          >
            <span>🛡️</span>
            <span>Integritas</span>
          </button>
          <button
            onClick={() => setActiveTab('CHANGELOG')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '600', padding: '4px 6px', borderRadius: '4px' }}
            title="Catatan Rilis Terminal"
          >
            <span>📜</span>
            <span>Changelog</span>
          </button>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{ background: 'none', border: 'none', color: 'var(--accent-rust)', cursor: loggingOut ? 'wait' : 'pointer', opacity: loggingOut ? 0.6 : 1, fontSize: '10.5px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 6px', borderRadius: '4px' }}
            title="Keluar dari sesi ini"
          >
            <span>🚪</span>
            <span>{loggingOut ? 'Keluar...' : 'Logout'}</span>
          </button>
        </div>
      </div>

    </aside>
  );
}
