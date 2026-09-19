import React, { useState } from 'react';
import MbgLogo from './MbgLogo.jsx';
import AssetIcon from './AssetIcon.jsx';

// Core clean trading navigation — clutter removed
const PRIMARY_NAV_ITEMS = [
  { id: 'HOME',                icon: '🏠', label: 'Home',            section: 'COMMAND CENTER' },
  // { id: 'AI_AGENTS',           icon: '🤖', label: 'AI Agent Arena',   section: 'COMMAND CENTER' },
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
    if (id === 'AI_AGENTS') return 'PRO';
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

      {/* === 1. LOGO / BRAND (Sleek Compact 40px Header) === */}
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}>
        <MbgLogo size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '0.06em', color: 'var(--text-primary)', lineHeight: 1 }}>
                MBG
              </span>
              <span style={{ fontSize: '7.5px', padding: '1px 3px', borderRadius: '3px', background: 'rgba(0, 208, 132, 0.15)', color: 'var(--accent-green)', fontWeight: '800', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                PRO
              </span>
            </div>
            {/* Live Streaming pulse indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }} title="WebSocket Real-Time Feed Active">
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 5px var(--accent-green)', display: 'inline-block' }} />
              <span style={{ fontSize: '7.5px', color: 'var(--accent-green)', fontWeight: '800', letterSpacing: '0.04em' }}>LIVE</span>
            </div>
          </div>
          <div style={{ fontSize: '7.5px', fontWeight: '700', letterSpacing: '0.04em', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px', lineHeight: 1 }}>
            Tactical Quant Terminal
          </div>
        </div>
      </div>

      {/* === 2. NAV ITEMS & ACTIVE TICKER RADAR === */}
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

              {/* Tampilkan DUAL-COLUMN BENTO TICKER RADAR persis di bawah section MARKETS */}
              {section === 'MARKETS' && (
                <div style={{ margin: '4px 8px 2px', padding: '6px 7px', background: 'var(--bg-panel-subtle)', borderRadius: '5px', border: 'var(--border-hairline)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', paddingBottom: '3px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '7.5px', fontWeight: '800', letterSpacing: '0.07em', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '3.5px' }}>
                      <span style={{ width: '4.5px', height: '4.5px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 4px var(--accent-green)' }} />
                      <span>RADAR LIVE</span>
                    </div>
                    <span style={{ fontSize: '7px', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>KLIK CHART ↗</span>
                  </div>

                  {/* Dual-Column Grid Matrix */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                    
                    {/* Kolom 1: IDX Core Blue Chips */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderRight: '1px solid rgba(255,255,255,0.06)', paddingRight: '3px' }}>
                      <div style={{ fontSize: '6.5px', fontWeight: '800', color: 'var(--accent-blue)', letterSpacing: '0.05em', marginBottom: '1px' }}>
                        IDX PILLARS
                      </div>
                      {DEFAULT_RADAR_TICKERS.filter(t => t.market === 'IDX').map(t => {
                        const quote = livePrices[t.symbol] || livePrices[`IDX:${t.symbol}`];
                        const chg = quote?.changePct !== undefined ? quote.changePct : t.defaultChange;
                        const isUp = chg >= 0;
                        const isFlashing = flashMap[t.symbol];

                        return (
                          <div
                            key={t.symbol}
                            onClick={() => {
                              if (onSelectTicker) onSelectTicker(t.symbol, t.market);
                              else setActiveTab('STOCK');
                              if (isMobileOpen && setMobileOpen) setMobileOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '1.5px',
                              padding: '2.5px 4px',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              background: isFlashing === 'up' ? 'rgba(0, 208, 132, 0.22)' : isFlashing === 'down' ? 'rgba(239, 68, 68, 0.22)' : 'rgba(255, 255, 255, 0.02)',
                              transition: 'all 0.2s ease',
                              border: '1px solid transparent'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                            title={`Buka Chart ${t.symbol} (${t.name}) - ${formatTickerPrice(t.symbol, t.market, t.defaultPrice)}`}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: 1.1 }}>
                              <span style={{ fontSize: '8.5px', fontWeight: '800', color: 'var(--text-primary)' }}>
                                {t.symbol}
                              </span>
                              <span style={{
                                fontSize: '7.5px',
                                fontWeight: '800',
                                color: isUp ? 'var(--accent-green)' : 'var(--accent-rust)'
                              }}>
                                {formatTickerChange(t.symbol, t.defaultChange)}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', lineHeight: 1 }}>
                              <span style={{ fontSize: '7.5px', color: 'var(--text-muted)', fontWeight: '600' }}>
                                {formatTickerPrice(t.symbol, t.market, t.defaultPrice)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Kolom 2: Crypto, US, & Global Forex */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '1px' }}>
                      <div style={{ fontSize: '6.5px', fontWeight: '800', color: 'var(--accent-gold-text, var(--accent-gold))', letterSpacing: '0.05em', marginBottom: '1px' }}>
                        GLOBAL & CRYPTO
                      </div>
                      {DEFAULT_RADAR_TICKERS.filter(t => t.market !== 'IDX').map(t => {
                        const quote = livePrices[t.symbol] || livePrices[`${t.symbol}USDT`];
                        const chg = quote?.changePct !== undefined ? quote.changePct : t.defaultChange;
                        const isUp = chg >= 0;
                        const isFlashing = flashMap[t.symbol] || flashMap[`${t.symbol}USDT`];

                        return (
                          <div
                            key={t.symbol}
                            onClick={() => {
                              if (onSelectTicker) onSelectTicker(t.symbol, t.market);
                              else setActiveTab(t.market === 'CRYPTO' ? 'CRYPTO' : t.market === 'US' ? 'US_STOCKS' : 'FOREX');
                              if (isMobileOpen && setMobileOpen) setMobileOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '1.5px',
                              padding: '2.5px 4px',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              background: isFlashing === 'up' ? 'rgba(0, 208, 132, 0.22)' : isFlashing === 'down' ? 'rgba(239, 68, 68, 0.22)' : 'rgba(255, 255, 255, 0.02)',
                              transition: 'all 0.2s ease',
                              border: '1px solid transparent'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                            title={`Buka Chart ${t.symbol} (${t.name}) - ${formatTickerPrice(t.symbol, t.market, t.defaultPrice)}`}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: 1.1 }}>
                              <span style={{
                                fontSize: '8px',
                                fontWeight: '800',
                                color: 'var(--text-primary)'
                              }}>
                                {t.symbol}
                              </span>
                              <span style={{
                                fontSize: '7.5px',
                                fontWeight: '800',
                                color: isUp ? 'var(--accent-green)' : 'var(--accent-rust)'
                              }}>
                                {formatTickerChange(t.symbol, t.defaultChange)}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', lineHeight: 1 }}>
                              <span style={{ fontSize: '7.5px', color: 'var(--text-muted)', fontWeight: '600' }}>
                                {formatTickerPrice(t.symbol, t.market, t.defaultPrice)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

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
