import React, { useState } from 'react';
import MbgLogo from './MbgLogo.jsx';
import AssetIcon from './AssetIcon.jsx';

// Core clean trading navigation — clutter removed
const PRIMARY_NAV_ITEMS = [
  { id: 'HOME',                icon: '🏠', label: 'Home',            section: 'COMMAND CENTER' },
  { id: 'AI_AGENTS',           icon: '🤖', label: 'AI Agent Arena',   section: 'COMMAND CENTER' },
  { id: 'STOCK',               icon: '📈', label: 'Saham IDX',       section: 'MARKETS' },
  { id: 'CRYPTO',              icon: '⚡', label: 'Crypto Spot',      section: 'MARKETS' },
  { id: 'FUTURES',             icon: '🔥', label: 'Crypto Futures',   section: 'MARKETS' },
  { id: 'DEGEN',               icon: '🎰', label: 'Degen Memecoin',   section: 'MARKETS' },
  { id: 'RADAR',               icon: '🎯', label: 'Early Signal Radar', section: 'MARKETS' },
  { id: 'SIGNALS',             icon: '📡', label: 'Sinyal Trading',    section: 'MARKETS' },
  { id: 'FOREX',               icon: '💱', label: 'Forex Scanner',   section: 'MARKETS' },
  { id: 'US_STOCKS',           icon: '🇺🇸', label: 'US Stocks',       section: 'MARKETS' },
  { id: 'WHALES',              icon: '🐋', label: 'Whale Tracker',    section: 'MARKETS' },
  { id: 'HEATMAP',             icon: '🗺️', label: 'Market Heatmap',   section: 'MARKETS' },
  { id: 'CHARTING',            icon: '📊', label: 'Charting Desk',    section: 'MARKETS' },
  { id: 'WATCHLIST',           icon: '⭐', label: 'Watchlist',        section: 'MARKETS' },
  { id: 'GLOBAL_MARKETS',      icon: '🌍', label: 'Pasar Global',     section: 'MARKETS' },
  { id: 'NEWS',                icon: '📰', label: 'Live News Wire',   section: 'INTELLIGENCE' },
  { id: 'ECONOMIC_CALENDAR',   icon: '📅', label: 'Kalender Makro',   section: 'INTELLIGENCE' },
  { id: 'AI_SENTINEL',        icon: '🛡️', label: 'AI Sentinel Desk', section: 'INTELLIGENCE' },
  { id: 'SUBSCRIPTION',        icon: '👑', label: 'Akun & Langganan', section: 'INTELLIGENCE' },
];

// Secondary tools tucked into expandable accordion
const SECONDARY_TOOLS = [
  { id: 'TESTING',             icon: '🧪', label: 'Testing Lab' },
  { id: 'PEARSON_CORRELATION', icon: '🔗', label: 'Korelasi Pearson' },
  { id: 'ACADEMY',             icon: '🎓', label: 'Quant Academy' },
  { id: 'FLOW_PROCESS',        icon: '⚡', label: 'Flow Process' },
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
  onSelectTicker,
  onOpenAiSentinel,
  onOpenDataIntegrity
}) {
  const [showMoreTools, setShowMoreTools] = useState(false);

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

              {/* Tampilkan DUAL-COLUMN BENTO TICKER RADAR persis di bawah section MARKETS */}
              {section === 'MARKETS' && (
                <div style={{ margin: '6px 8px 4px', padding: '8px 10px', background: 'var(--bg-panel-subtle)', borderRadius: '10px', border: 'var(--border-hairline)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '8.5px', fontWeight: '800', letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                      <span>RADAR WATCHLIST</span>
                    </div>
                    <span style={{ fontSize: '7.5px', color: '#818cf8', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>CHART ↗</span>
                  </div>

                  {/* Dual-Column Grid Matrix */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontFamily: 'var(--font-mono)' }}>
                    
                    {/* Kolom 1: IDX Core Blue Chips */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', borderRight: '1px solid rgba(255,255,255,0.06)', paddingRight: '4px' }}>
                      <div style={{ fontSize: '7px', fontWeight: '800', color: '#38bdf8', letterSpacing: '0.05em', marginBottom: '1px' }}>
                        SAHAM IDX
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
                              gap: '1px',
                              padding: '3px 5px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              background: isFlashing === 'up' ? 'rgba(16, 185, 129, 0.22)' : isFlashing === 'down' ? 'rgba(244, 63, 94, 0.22)' : 'rgba(255, 255, 255, 0.03)',
                              transition: 'all 0.15s ease',
                              border: '1px solid transparent'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)'}
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingLeft: '2px' }}>
                      <div style={{ fontSize: '7px', fontWeight: '800', color: '#f59e0b', letterSpacing: '0.05em', marginBottom: '1px' }}>
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
                              gap: '1px',
                              padding: '3px 5px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              background: isFlashing === 'up' ? 'rgba(16, 185, 129, 0.22)' : isFlashing === 'down' ? 'rgba(244, 63, 94, 0.22)' : 'rgba(255, 255, 255, 0.03)',
                              transition: 'all 0.15s ease',
                              border: '1px solid transparent'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)'}
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
            style={{ background: 'none', border: 'none', color: 'var(--accent-rust)', cursor: 'pointer', fontSize: '10.5px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 6px', borderRadius: '4px' }}
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
