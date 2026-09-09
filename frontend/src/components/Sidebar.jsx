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
];

const SECTIONS = ['COMMAND CENTER', 'MARKETS', 'QUANT & RESEARCH'];

export default function Sidebar({
  activeTab,
  setActiveTab,
  theme,
  toggleTheme,
  onRefresh,
  isMobileOpen,
  setMobileOpen,
  lastUpdate,
  stockCount = 0,
  cryptoCount = 0,
  newsCount = 0,
}) {
  // Self-contained WIB clock to prevent parent re-renders
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getBadge = (id) => {
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
    <aside className={sidebar }>

      {/* === 1. LOGO / BRAND === */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-dot" />
        <div>
          <div className="sidebar-logo-text">MBG ASTRA</div>
          <div className="sidebar-logo-sub">Quant Terminal · v2</div>
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
                    className={sidebar-nav-item }
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
              {section !== 'QUANT & RESEARCH' && <div className="sidebar-divider" />}
            </div>
          );
        })}
      </nav>

      {/* === 4. SYSTEM FOOTER === */}
      <div className="sidebar-footer">
        {/* WIB Clock + Sync Indicator */}
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🕒 {clock.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false })} WIB</span>
          <span style={{ color: 'var(--accent-green)', fontWeight: '700' }}>
            {lastUpdate ? '🟢 SYNCED' : '🟡 LOCAL'}
          </span>
        </div>

        {/* Theme + Sync Buttons */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
          <button className="telemetry-btn" onClick={toggleTheme} style={{ flex: 1, padding: '4px 6px', fontSize: '10px' }} title="Toggle Theme">
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button className="telemetry-btn" onClick={onRefresh} style={{ flex: 1, padding: '4px 6px', fontSize: '10px' }} title="Refresh Data">
            🔄 Sync
          </button>
        </div>

        <div className="sidebar-divider" />

        {/* Settings + Safe Logout */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => alert('MBG Astra Quantitative Desk\nVersion: 2.4.0 (Zero Runtime Cost)\nTimesFM + SMC + IIFS Active')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>⚙️ Settings</span>
          </button>
          <button
            onClick={handleLogout}
            style={{ background: 'none', border: 'none', color: 'var(--accent-rust)', cursor: 'pointer', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Keluar dari sesi ini"
          >
            <span>🚪 Logout</span>
          </button>
        </div>
      </div>

    </aside>
  );
}
