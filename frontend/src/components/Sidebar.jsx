import React, { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { id: 'HOME',                icon: '🏠', label: 'Home',            section: 'COMMAND CENTER' },
  { id: 'STOCK',               icon: '📈', label: 'Saham IDX',       section: 'MARKETS' },
  { id: 'CRYPTO',              icon: '⚡', label: 'Crypto Spot',      section: 'MARKETS' },
  { id: 'WATCHLIST',           icon: '⭐', label: 'Watchlist',        section: 'MARKETS' },
  { id: 'GLOBAL_MARKETS',      icon: '🌍', label: 'Pasar Global',     section: 'MARKETS' },
  { id: 'TESTING',             icon: '🧪', label: 'Testing Lab',     section: 'QUANT & RESEARCH' },
  { id: 'ECONOMIC_CALENDAR',   icon: '📅', label: 'Kalender Makro',   section: 'QUANT & RESEARCH' },
  { id: 'PEARSON_CORRELATION', icon: '🔗', label: 'Korelasi Pearson', section: 'QUANT & RESEARCH' },
  { id: 'NEWS',                icon: '📰', label: 'Live News',        section: 'QUANT & RESEARCH' },
  { id: 'ACADEMY',             icon: '🎓', label: 'Quant Academy',    section: 'QUANT & RESEARCH' },
  { id: 'CHANGELOG',           icon: '📜', label: 'Changelog Update', section: 'SYSTEM & UPDATES' },
];

const SECTIONS = ['COMMAND CENTER', 'MARKETS', 'QUANT & RESEARCH', 'SYSTEM & UPDATES'];

export default function Sidebar({
  activeTab,
  setActiveTab,
  isMobileOpen,
  setMobileOpen,
  stockCount = 0,
  cryptoCount = 0,
  newsCount = 0,
}) {

  const getBadge = (id) => {
    if (id === 'CHANGELOG') return '10092026';
    if (id === 'STOCK') return stockCount > 0 ? stockCount : null;
    if (id === 'CRYPTO') return cryptoCount > 0 ? cryptoCount : null;
    if (id === 'NEWS') return newsCount > 0 ? newsCount : null;
    return null;
  };

  const handleLogout = () => {
    if (window.confirm('Logout dari sesi MBG Trading Terminal? Data watchlist & paper trading Anda tetap tersimpan aman.')) {
      localStorage.removeItem('mbg_cockpit_auth');
      localStorage.removeItem('mbg_cockpit_auth_time');
      window.location.reload();
    }
  };

  return (
    <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>

      {/* === 1. LOGO / BRAND (Cool MBG Badge + Market Brain Grid) === */}
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px' }}>
        {/* Cool Monogram MBG Logo Mark */}
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #07090e 0%, #0d281e 55%, #00d084 100%)',
          border: '1px solid rgba(0, 208, 132, 0.45)',
          boxShadow: '0 0 12px rgba(0, 208, 132, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative'
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: '900',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '-0.02em',
            color: '#ffffff',
            textShadow: '0 0 8px rgba(0, 208, 132, 0.8)',
            lineHeight: 1.1
          }}>
            MBG
          </span>
          <span style={{
            fontSize: '6px',
            fontWeight: '800',
            letterSpacing: '0.08em',
            color: 'var(--accent-green)',
            lineHeight: 1
          }}>
            QUANT
          </span>
          {/* Active status beacon */}
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#00d084',
            boxShadow: '0 0 6px #00d084'
          }} />
        </div>

        {/* Text Details with Full Expansion */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '0.06em', color: 'var(--text-primary)', lineHeight: 1.2 }}>
              MBG ASTRA
            </span>
            <span style={{ fontSize: '8px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(0, 208, 132, 0.15)', color: 'var(--accent-green)', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
              PRO
            </span>
          </div>
          <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.04em', color: 'var(--accent-green)', textTransform: 'uppercase', marginTop: '2px', lineHeight: 1.2 }}>
            Market Brain Grid
          </div>
          <div style={{ fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '0.04em', lineHeight: 1.2 }}>
            Tactical Quant Desk · v2.4
          </div>
        </div>
      </div>

      {/* === 2. USER / DESK PROFILE === */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">M</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">Institutional</div>
          <div className="sidebar-user-role">Quant Desk · Live</div>
        </div>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 5px var(--accent-green)', flexShrink: 0 }} />
      </div>

      {/* === 3. NAV ITEMS (Compact Zero-Scroll) === */}
      <nav className="sidebar-nav">
        {SECTIONS.map(section => {
          const items = NAV_ITEMS.filter(n => n.section === section);
          return (
            <div key={section} style={{ marginBottom: '4px' }}>
              <div className="sidebar-nav-section-label">{section}</div>
              {items.map(item => {
                const badge = getBadge(item.id);
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab(item.id);
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
      </nav>

      {/* === 4. SYSTEM FOOTER (Clean & Compact) === */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px' }}>
          <button
            onClick={() => alert('MBG Astra Quantitative Desk\nVersion: 2.4.0 (Zero Runtime Cost)\nTimesFM + SMC + IIFS Active')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
            title="Sistem & Versi Terminal"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>
          <button
            onClick={handleLogout}
            style={{ background: 'none', border: 'none', color: 'var(--accent-rust)', cursor: 'pointer', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}
            title="Keluar dari sesi ini (Data Watchlist & Paper tetap aman)"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

    </aside>
  );
}
