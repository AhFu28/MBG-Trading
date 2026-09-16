import React, { useState } from 'react';
import MbgLogo from './MbgLogo.jsx';
import AssetIcon from './AssetIcon.jsx';

// Core clean trading navigation — clutter removed
const PRIMARY_NAV_ITEMS = [
  { id: 'HOME',                icon: '🏠', label: 'Home',            section: 'COMMAND CENTER' },
  { id: 'STOCK',               icon: '📈', label: 'Saham IDX',       section: 'MARKETS' },
  { id: 'CRYPTO',              icon: '⚡', label: 'Crypto Spot',      section: 'MARKETS' },
  { id: 'FUTURES',             icon: '🔥', label: 'Crypto Futures',   section: 'MARKETS' },
  { id: 'FOREX',               icon: '💱', label: 'Forex Scanner',   section: 'MARKETS' },
  { id: 'US_STOCKS',           icon: '🇺🇸', label: 'US Stocks',       section: 'MARKETS' },
  { id: 'WHALES',              icon: '🐋', label: 'Whale Tracker',    section: 'MARKETS' },
  { id: 'HEATMAP',             icon: '🗺️', label: 'Market Heatmap',   section: 'MARKETS' },
  { id: 'CHARTING',            icon: '📊', label: 'Charting Desk',    section: 'MARKETS' },
  { id: 'WATCHLIST',           icon: '⭐', label: 'Watchlist',        section: 'MARKETS' },
  { id: 'GLOBAL_MARKETS',      icon: '🌍', label: 'Pasar Global',     section: 'MARKETS' },
  { id: 'NEWS',                icon: '📰', label: 'Live News Wire',   section: 'INTELLIGENCE' },
  { id: 'ECONOMIC_CALENDAR',   icon: '📅', label: 'Kalender Makro',   section: 'INTELLIGENCE' },
];

// Secondary tools tucked into expandable accordion
const SECONDARY_TOOLS = [
  { id: 'TESTING',             icon: '🧪', label: 'Testing Lab' },
  { id: 'PEARSON_CORRELATION', icon: '🔗', label: 'Korelasi Pearson' },
  { id: 'ACADEMY',             icon: '🎓', label: 'Quant Academy' },
  { id: 'CHANGELOG',           icon: '📜', label: 'Changelog Update' }
];

const SECTIONS = ['COMMAND CENTER', 'MARKETS', 'INTELLIGENCE'];

// Curated active tickers to display live in the sidebar
const DEFAULT_RADAR_TICKERS = [
  { symbol: 'BBCA', name: 'Bank Central Asia', market: 'IDX', defaultPrice: 6375, defaultChange: -0.39 },
  { symbol: 'BBRI', name: 'Bank Rakyat Indo', market: 'IDX', defaultPrice: 3340, defaultChange: 0.60 },
  { symbol: 'BMRI', name: 'Bank Mandiri', market: 'IDX', defaultPrice: 4300, defaultChange: -0.92 },
  { symbol: 'AMMN', name: 'Amman Mineral', market: 'IDX', defaultPrice: 5150, defaultChange: 1.98 },
  { symbol: 'BTC', name: 'Bitcoin', market: 'CRYPTO', defaultPrice: 75940, defaultChange: -2.21 },
  { symbol: 'ETH', name: 'Ethereum', market: 'CRYPTO', defaultPrice: 2406, defaultChange: -3.67 },
  { symbol: 'SOL', name: 'Solana', market: 'CRYPTO', defaultPrice: 97.18, defaultChange: -4.15 },
  { symbol: 'NVDA', name: 'Nvidia Corp', market: 'US', defaultPrice: 212.17, defaultChange: 0.57 },
  { symbol: 'EURUSD', name: 'Euro / US Dollar', market: 'FOREX', defaultPrice: 1.155, defaultChange: 0.10 },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  isMobileOpen,
  setMobileOpen,
  stockCount = 0,
  cryptoCount = 0,
  newsCount = 0,
  livePrices = {},
  flashMap = {},
  onSelectTicker
}) {
  const [showMoreTools, setShowMoreTools] = useState(false);

  const getBadge = (id) => {
    if (id === 'CHARTING') return 'PRO';
    if (id === 'WHALES') return 'LIVE';
    if (id === 'FUTURES') return 'LIVE';
    if (id === 'FOREX') return 'LIVE';
    if (id === 'US_STOCKS') return 'LIVE';
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

  const formatTickerPrice = (sym, market, defPrice) => {
    const quote = livePrices[sym] || livePrices[`IDX:${sym}`] || livePrices[`${sym}USDT`] || livePrices[`${sym}/USDT`];
    const val = quote?.price !== undefined ? quote.price : defPrice;
    if (market === 'IDX') return `Rp ${Math.round(val).toLocaleString('id-ID')}`;
    if (market === 'CRYPTO') return val >= 1000 ? `$${Math.round(val).toLocaleString()}` : `$${val.toFixed(2)}`;
    if (market === 'US') return `$${val.toFixed(2)}`;
    if (market === 'FOREX') return val.toFixed(4);
    return `${val}`;
  };

  const formatTickerChange = (sym, defChange) => {
    const quote = livePrices[sym] || livePrices[`IDX:${sym}`] || livePrices[`${sym}USDT`] || livePrices[`${sym}/USDT`];
    const chg = quote?.changePct !== undefined ? quote.changePct : defChange;
    const sign = chg > 0 ? '+' : '';
    return `${sign}${chg.toFixed(2)}%`;
  };

  return (
    <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>

      {/* === 1. LOGO / BRAND === */}
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px' }}>
        <MbgLogo size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: '900', letterSpacing: '0.06em', color: 'var(--text-primary)', lineHeight: 1.2 }}>
              MBG
            </span>
            <span style={{ fontSize: '8px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(0, 208, 132, 0.15)', color: 'var(--accent-green)', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
              PRO
            </span>
          </div>
          <div style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.05em', color: 'var(--accent-green)', textTransform: 'uppercase', marginTop: '2px', lineHeight: 1.2 }}>
            Market Brain Grid
          </div>
          <div style={{ fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '0.04em', lineHeight: 1.2 }}>
            Tactical Quant Terminal · v3.0
          </div>
        </div>
      </div>

      {/* === 2. USER / DESK PROFILE === */}
      <div className="sidebar-user" style={{ padding: '8px 14px' }}>
        <div className="sidebar-avatar">M</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">Institutional Desk</div>
          <div className="sidebar-user-role" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 5px var(--accent-green)', display: 'inline-block' }} />
            <span>Live Streaming</span>
          </div>
        </div>
      </div>

      {/* === 3. NAV ITEMS & ACTIVE TICKER RADAR === */}
      <nav className="sidebar-nav">

        {/* Section 1: Command Center & Markets */}
        {SECTIONS.map(section => {
          const items = PRIMARY_NAV_ITEMS.filter(n => n.section === section);
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

              {/* Tampilkan ACTIVE TICKER RADAR persis di bawah section MARKETS */}
              {section === 'MARKETS' && (
                <div style={{ margin: '8px 10px 4px', padding: '8px', background: 'var(--bg-panel-subtle)', borderRadius: '6px', border: 'var(--border-hairline)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ fontSize: '8px', fontWeight: '800', letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 4px var(--accent-green)' }} />
                      <span>TICKER RADAR LIVE</span>
                    </div>
                    <span style={{ fontSize: '8px', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>KLIK CHART</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {DEFAULT_RADAR_TICKERS.map(t => {
                      const quote = livePrices[t.symbol] || livePrices[`IDX:${t.symbol}`] || livePrices[`${t.symbol}USDT`];
                      const chg = quote?.changePct !== undefined ? quote.changePct : t.defaultChange;
                      const isUp = chg >= 0;
                      const isFlashing = flashMap[t.symbol] || flashMap[`${t.symbol}USDT`];

                      return (
                        <div
                          key={t.symbol}
                          onClick={() => onSelectTicker ? onSelectTicker(t.symbol, t.market) : setActiveTab(t.market === 'IDX' ? 'STOCK' : t.market === 'CRYPTO' ? 'CRYPTO' : 'HOME')}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            background: isFlashing === 'up' ? 'rgba(0, 208, 132, 0.2)' : isFlashing === 'down' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                            transition: 'all 0.25s ease',
                            border: '1px solid transparent'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                          title={`Buka Chart ${t.symbol} (${t.name})`}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <AssetIcon symbol={t.symbol} market={t.market} size={15} />
                            <span style={{
                              fontSize: '7px',
                              padding: '1px 3px',
                              borderRadius: '2px',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: '800',
                              background: t.market === 'IDX' ? 'rgba(59, 130, 246, 0.15)' : t.market === 'CRYPTO' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                              color: t.market === 'IDX' ? 'var(--accent-blue)' : t.market === 'CRYPTO' ? 'var(--accent-gold)' : '#c084fc'
                            }}>
                              {t.market === 'IDX' ? 'IDX' : t.market === 'CRYPTO' ? 'CRY' : t.market === 'US' ? 'US' : 'FX'}
                            </span>
                            <span style={{ fontSize: '10px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                              {t.symbol}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-secondary)' }}>
                              {formatTickerPrice(t.symbol, t.market, t.defaultPrice)}
                            </span>
                            <span style={{
                              fontSize: '8px',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: '800',
                              padding: '1px 4px',
                              borderRadius: '3px',
                              background: isUp ? 'rgba(0, 208, 132, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: isUp ? 'var(--accent-green)' : 'var(--accent-rust)'
                            }}>
                              {formatTickerChange(t.symbol, t.defaultChange)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
              {SECONDARY_TOOLS.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab(item.id);
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
      <div className="sidebar-footer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 10px' }}>
          <button
            onClick={() => setActiveTab('CHANGELOG')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
            title="Catatan Rilis Terminal"
          >
            <span>📜</span>
            <span>v3.0 Gacor</span>
          </button>
          <button
            onClick={handleLogout}
            style={{ background: 'none', border: 'none', color: 'var(--accent-rust)', cursor: 'pointer', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Keluar dari sesi ini"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

    </aside>
  );
}
