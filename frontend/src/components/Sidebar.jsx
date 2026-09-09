import React from 'react';

const NAV_ITEMS = [
  { id: 'STOCK',               icon: '📈', label: 'Saham IDX',       section: 'EXECUTION DESK' },
  { id: 'CRYPTO',              icon: '⚡', label: 'Crypto Spot',      section: 'EXECUTION DESK' },
  { id: 'WATCHLIST',           icon: '⭐', label: 'Watchlist',        section: 'EXECUTION DESK' },
  { id: 'CURRENT_TEST',        icon: '🧪', label: 'Paper Trading',    section: 'QUANT LAB' },
  { id: 'BACKTEST_LAB',        icon: '📊', label: 'Backtest Lab',     section: 'QUANT LAB' },
  { id: 'GLOBAL_MARKETS',      icon: '🌍', label: 'Pasar Global',     section: 'MACRO INTEL' },
  { id: 'ECONOMIC_CALENDAR',   icon: '📅', label: 'Kalender Makro',   section: 'MACRO INTEL' },
  { id: 'PEARSON_CORRELATION', icon: '🔗', label: 'Korelasi Pearson', section: 'MACRO INTEL' },
  { id: 'NEWS',                icon: '📰', label: 'Live News',        section: 'MACRO INTEL' },
  { id: 'ACADEMY',             icon: '🎓', label: 'Quant Academy',    section: 'RESEARCH' },
];

const SECTIONS = ['EXECUTION DESK', 'QUANT LAB', 'MACRO INTEL', 'RESEARCH'];

export default function Sidebar({
  activeTab,
  setActiveTab,
  theme,
  toggleTheme,
  onOpenChart,
  onOpenLotCalc,
  onRefresh,
  isMobileOpen,
  setMobileOpen,
  currentTime,
  lastUpdate,
  stockCount = 0,
  cryptoCount = 0,
  newsCount = 0,
}) {
  const getBadge = (id) => {
    if (id === 'STOCK') return stockCount > 0 ? stockCount : null;
    if (id === 'CRYPTO') return cryptoCount > 0 ? cryptoCount : null;
    if (id === 'NEWS') return newsCount > 0 ? newsCount : null;
    return null;
  };

  return (
    <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>

      {/* === 1. LOGO / BRAND === */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-dot" />
        <div>
          <div className="sidebar-logo-text">MBG Astra</div>
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

      {/* === 3. NAV ITEMS === */}
      <nav className="sidebar-nav">
        {SECTIONS.map(section => {
          const items = NAV_ITEMS.filter(n => n.section === section);
          return (
            <div key={section}>
              <div className="sidebar-nav-section-label">{section}</div>
              {items.map(item => {
                const badge = getBadge(item.id);
                return (
                  <button
                    key={item.id}
                    className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => { setActiveTab(item.id); if (isMobileOpen) setMobileOpen(false); }}
                    title={item.label}
                  >
                    <span className="sidebar-nav-icon">{item.icon}</span>
                    <span className="sidebar-nav-label">{item.label}</span>
                    {badge && <span className="sidebar-nav-badge">{badge}</span>}
                  </button>
                );
              })}
              {section !== 'RESEARCH' && <div className="sidebar-divider" />}
            </div>
          );
        })}
      </nav>

      {/* === 4. QUICK ACTION DOCK === */}
      <div style={{ padding: '8px 0', borderTop: 'var(--border-hairline)', borderBottom: 'var(--border-hairline)', flexShrink: 0 }}>
        <button className="sidebar-nav-item" onClick={() => onOpenChart && onOpenChart('MEDC', 'IDX')} title="Launch TradingView Chart">
          <span className="sidebar-nav-icon">📉</span>
          <span className="sidebar-nav-label">Launch Chart</span>
        </button>
        <button className="sidebar-nav-item" onClick={() => onOpenLotCalc && onOpenLotCalc()} title="Kalkulator Lot">
          <span className="sidebar-nav-icon">💰</span>
          <span className="sidebar-nav-label">Kalkulator Lot</span>
        </button>
      </div>

      {/* === 5. SYSTEM FOOTER === */}
      <div className="sidebar-footer">
        {/* WIB Clock + Last Sync */}
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🕒 {currentTime ? currentTime.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false }) : '--:--:--'} WIB</span>
          {lastUpdate && <span style={{ color: 'var(--accent-green)' }}>🟢</span>}
        </div>

        {/* Theme + Refresh */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="sidebar-nav-item" onClick={toggleTheme} style={{ flex: 1, justifyContent: 'center', padding: '6px 8px', fontSize: '11px' }} title="Toggle Theme">
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button className="sidebar-nav-item" onClick={onRefresh} style={{ flex: 1, justifyContent: 'center', padding: '6px 8px', fontSize: '11px' }} title="Refresh Data">
            🔄 Sync
          </button>
        </div>

        <div className="sidebar-divider" />

        {/* Settings + Logout */}
        <button className="sidebar-nav-item" onClick={() => alert('Settings — coming soon')} title="Settings">
          <span className="sidebar-nav-icon">⚙️</span>
          <span className="sidebar-nav-label">Settings</span>
        </button>
        <button
          className="sidebar-nav-item"
          onClick={() => { if (window.confirm('Logout dari MBG Trading Terminal?')) { localStorage.clear(); window.location.reload(); } }}
          style={{ color: 'var(--accent-rust)' }}
          title="Logout"
        >
          <span className="sidebar-nav-icon">🚪</span>
          <span className="sidebar-nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}
