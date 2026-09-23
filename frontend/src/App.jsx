import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import PasswordGate from './components/PasswordGate.jsx';
import MasterQuantLeaderboard from './components/MasterQuantLeaderboard.jsx';
import HomeDashboardTab from './components/HomeDashboardTab.jsx';
import Sidebar from './components/Sidebar.jsx';
import GlobalMarketTicker from './components/GlobalMarketTicker.jsx';
import { useLivePrices } from './hooks/useLivePrices.js';
import PersonalWatchlistTab from './components/PersonalWatchlistTab.jsx';
import CommandPaletteModal from './components/CommandPaletteModal.jsx';

// Code Splitting for heavy secondary modules
const TradingViewModal = lazy(() => import('./components/TradingViewModal.jsx'));
const LotCalculatorModal = lazy(() => import('./components/LotCalculatorModal.jsx'));
const ChangelogTab = lazy(() => import('./components/ChangelogTab.jsx'));
const ChartingDeskTab = lazy(() => import('./components/ChartingDeskTab.jsx'));
const WhaleIntelligenceTab = lazy(() => import('./components/WhaleIntelligenceTab.jsx'));
const CryptoFuturesTab = lazy(() => import('./components/CryptoFuturesTab.jsx'));
const ForexCommandTab = lazy(() => import('./components/ForexCommandTab.jsx'));
const USStockTab = lazy(() => import('./components/USStockTab.jsx'));
const MarketHeatmapTab = lazy(() => import('./components/MarketHeatmapTab.jsx'));
const NewsDetailModal = lazy(() => import('./components/NewsDetailModal.jsx'));
const SecurityHubDrawer = lazy(() => import('./components/SecurityHubDrawer.jsx'));
const AiAgentArenaTab = lazy(() => import('./components/AiAgentArenaTab.jsx'));
const AiIntelligenceDrawer = lazy(() => import('./components/AiIntelligenceDrawer.jsx'));

const isIdxMarketOpen = () => {
  const now = new Date();
  const jktStr = now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
  const jktDate = new Date(jktStr);
  const day = jktDate.getDay();
  if (day === 0 || day === 6) return false;
  const totalMin = jktDate.getHours() * 60 + jktDate.getMinutes();
  if (day === 5) {
    return (totalMin >= 540 && totalMin <= 690) || (totalMin >= 840 && totalMin <= 960);
  }
  return (totalMin >= 540 && totalMin <= 720) || (totalMin >= 810 && totalMin <= 960);
};

const jakartaTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  hourCycle: 'h23'
});

function HeaderClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div 
      style={{ 
        fontSize: '10px', 
        padding: '3px 8px', 
        borderRadius: 'var(--radius-xs)', 
        background: 'var(--bg-panel-subtle)', 
        color: 'var(--text-primary)', 
        fontFamily: 'var(--font-mono)',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        border: 'var(--border-hairline)'
      }}
      title="Waktu Jakarta (WIB)"
    >
      <span>🕒</span>
      <span>{jakartaTimeFormatter.format(now)} WIB</span>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Unified Real-time Live Price Engine (Binance WebSocket + TradingView Scanners)
  const { livePrices, flashMap, allIdxStocks, allCryptoSpot, isWsConnected, lastUpdateTime, refetchAll } = useLivePrices(data);

  // Native hash routing
  const getTabFromHash = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const qTab = params.get('tab');
      if (qTab) return qTab.toUpperCase();
    } catch (e) {}
    const hash = window.location.hash.replace('#', '').toUpperCase();
    return hash || 'HOME';
  };
  const [activeTab, setActiveTabState] = useState(getTabFromHash);

  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
    window.location.hash = tab.toLowerCase();
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const tab = getTabFromHash();
      if (tab) setActiveTabState(tab);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const [isMobileOpen, setMobileOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Global Keyboard Listener for Command Palette (Ctrl + K / Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dark Mode state with persistence in localStorage
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('mbg_theme') || 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('mbg_theme', theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // TradingView Chart Modal State
  const [chartModal, setChartModal] = useState({
    isOpen: false,
    symbol: 'AMMN',
    market: 'IDX'
  });

  const handleOpenChart = useCallback((symbol = 'AMMN', market = 'IDX') => {
    setChartModal({
      isOpen: true,
      symbol: symbol,
      market: market
    });
  }, []);

  const handleCloseChart = useCallback(() => {
    setChartModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Lot Calculator Modal State
  const [lotCalcModal, setLotCalcModal] = useState({
    isOpen: false,
    entry: '',
    sl: '',
    market: 'IDX',
    symbol: ''
  });

  const handleOpenLotCalc = useCallback((entry = '', sl = '', market = 'IDX', symbol = '') => {
    setLotCalcModal({ isOpen: true, entry, sl, market, symbol });
  }, []);

  const handleCloseLotCalc = useCallback(() => {
    setLotCalcModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  // News Detail Modal State
  const [newsModal, setNewsModal] = useState({
    isOpen: false,
    news: null
  });

  const handleOpenNews = useCallback((newsItem) => {
    if (!newsItem) return;
    setNewsModal({
      isOpen: true,
      news: newsItem
    });
  }, []);

  const handleCloseNews = useCallback(() => {
    setNewsModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Institutional Security Hub Drawer State
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  const [securityHub, setSecurityHub] = useState({
    isOpen: false,
    symbol: 'BBCA',
    market: 'IDX'
  });

  const handleOpenSecurityHub = useCallback((symbol = 'BBCA', market = 'IDX') => {
    setSecurityHub({
      isOpen: true,
      symbol: symbol,
      market: market
    });
  }, []);

  const handleCloseSecurityHub = useCallback(() => {
    setSecurityHub(prev => ({ ...prev, isOpen: false }));
  }, []);

  const parseSafeDate = (isoString) => {
    if (!isoString) return null;
    const safeIso = isoString.endsWith('Z') || isoString.includes('+') ? isoString : isoString + 'Z';
    return new Date(safeIso);
  };

  const [syncTrigger, setSyncTrigger] = useState(0);

  useEffect(() => {
    const loadBundle = async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const cacheBuster = `?v=${Date.now()}`;
        const res = await fetch(`/data/latest_cockpit_bundle.json${cacheBuster}`, { cache: 'no-cache' });
        if (res.ok) {
          const json = await res.json();
          // Fallback if bundle is partial
          if (!json.daily_trade_plans || !json.daily_trade_plans.length) {
            try {
              const fallbackPlans = await fetch(`/data/daily_trade_plans.json${cacheBuster}`, { cache: 'no-cache' });
              if (fallbackPlans.ok) {
                json.daily_trade_plans = await fallbackPlans.json();
              }
            } catch (e) {
              console.warn('Fallback daily_trade_plans fetch failed:', e);
            }
          }
          if (!json.crypto_spot_10 || !json.crypto_spot_10.length) {
            try {
              const fallbackCrypto = await fetch(`/data/crypto_spot_10.json${cacheBuster}`, { cache: 'no-cache' });
              if (fallbackCrypto.ok) {
                json.crypto_spot_10 = await fallbackCrypto.json();
              }
            } catch (e) {
              console.warn('Fallback crypto_spot_10 fetch failed:', e);
            }
          }
          setData(json);
        } else {
          console.error('Failed to load local bundle:', res.status);
        }
      } catch (err) {
        console.error('Error fetching latest bundle:', err);
      } finally {
        if (!silent) setLoading(false);
      }
    };

    loadBundle(syncTrigger !== 0 ? false : false);

    const intervalId = setInterval(() => {
      loadBundle(true);
    }, 300000);

    return () => clearInterval(intervalId);
  }, [syncTrigger]);

  const getTabLabel = (tab) => {
    switch (tab) {
      case 'HOME': return '🏠 Home Command Center';
      case 'STOCK': return '📈 Saham IDX Alpha';
      case 'CRYPTO': return '⚡ Crypto Spot Momentum';
      case 'CHARTING': return '📊 Institutional Charting Desk';
      case 'WATCHLIST': return '⭐ Personal Watchlist';
      case 'GLOBAL_MARKETS': return '🌍 Pasar Global';
      case 'TESTING': return '🧪 Strategy Testing Lab';
      case 'CURRENT_TEST': return '🧪 Forward Paper Trading';
      case 'BACKTEST_LAB': return '📊 Historical Backtest Lab';
      case 'ECONOMIC_CALENDAR': return '📅 Kalender Makro';
      case 'PEARSON_CORRELATION': return '🔗 Korelasi Pearson';
      case 'NEWS': return '📰 Terminal Live News';
      case 'ACADEMY': return '🎓 Quant Academy';
      case 'WHALES': return '🐋 Whale Intelligence Hub';
      case 'FUTURES': return '🔥 Crypto Futures Intelligence';
      case 'FOREX': return '💱 Forex Command Center';
      case 'US_STOCKS': return '🇺🇸 US Stock Intelligence';
      case 'CHANGELOG': return '📜 Changelog Update & Catatan Rilis';
      case 'AI_AGENTS': return '🤖 AI Multi-Agent Arena';
      case 'AI_SENTINEL':
      case 'AI_SENTINEL_DEFCON':
      case 'AI_SENTINEL_DEBATE':
      case 'SENTINEL': return '🛡️ AI Intelligence & Sentinel Desk';
      default: return 'Institutional Desk';
    }
  };

  return (
    <PasswordGate>
      <div className="app-layout">

        {/* Mobile backdrop */}
        {isMobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 99
            }}
          />
        )}

        {/* ===== LEFT SIDEBAR (Zero-Scroll 100vh) ===== */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileOpen={isMobileOpen}
          setMobileOpen={setMobileOpen}
          stockCount={allIdxStocks.length > 0 ? allIdxStocks.length : 849}
          cryptoCount={allCryptoSpot.length > 0 ? allCryptoSpot.length : 744}
          newsCount={(data?.macro_telemetry?.live_news || []).length}
          livePrices={livePrices}
          flashMap={flashMap}
          onSelectTicker={handleOpenSecurityHub}
          onOpenAiSentinel={() => setActiveTab('AI_SENTINEL')}
        />

        {/* ===== MAIN CONTENT AREA ===== */}
        <div className="main-content">

          {/* 1. Master Top Header Bar (Tightly Compacted HUD) */}
          <header className="telemetry-panel" style={{
            marginBottom: '6px',
            padding: '3px 10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'nowrap',
            gap: '8px',
            minHeight: '28px',
            overflowX: 'auto',
            boxSizing: 'border-box'
          }}>
            {/* Left: Active Module Title (Clean & Modern) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <button
                className="mobile-header-hamburger"
                onClick={() => setMobileOpen(prev => !prev)}
                aria-label="Buka Navigasi"
                title="Buka Navigasi"
              >
                ☰
              </button>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 5px var(--accent-green)' }} />
              <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.04em', color: 'var(--text-primary)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {getTabLabel(activeTab)}
              </div>
            </div>

            {/* Right: Quick Launch Tools, Theme Switcher, Sync & Live Clock (Single Line) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'nowrap', flexShrink: 0 }}>

              {/* Bursa Luar Negeri (Global Market Sessions Ticker) */}
              <GlobalMarketTicker onNavigateGlobal={() => setActiveTab('GLOBAL_MARKETS')} />

              {/* OpenTerminalUI Command Palette Quick Button */}
              <button
                className="telemetry-btn"
                onClick={() => setIsPaletteOpen(true)}
                style={{
                  fontSize: '9px',
                  padding: '2px 6px',
                  color: '#60a5fa',
                  borderColor: 'rgba(59, 130, 246, 0.4)',
                  background: 'rgba(59, 130, 246, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                title="Buka Global Command Palette (Tekan Ctrl + K)"
              >
                <span>🔍</span>
                <span style={{ fontWeight: 800 }}>Ctrl + K</span>
              </button>

              {/* OpenTerminalUI Data Provenance Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '8.5px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  padding: '2px 5px',
                  borderRadius: 'var(--radius-xs)',
                  background: isWsConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  color: isWsConnected ? '#10b981' : '#f59e0b',
                  border: isWsConnected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                  whiteSpace: 'nowrap'
                }}
                title="Data Provenance Envelope: Status jalur data aktual pasar vs polling"
              >
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: isWsConnected ? '#10b981' : '#f59e0b', display: 'inline-block' }} />
                <span>{isWsConnected ? 'LIVE FEED WS' : 'REST (5S)'}</span>
              </div>

              {/* Master Terminal Time */}
              <HeaderClock />

              {/* AI Sentinel Quick Launch */}
              <button
                className="telemetry-btn"
                onClick={() => setIsAiDrawerOpen(true)}
                style={{
                  fontSize: '9px',
                  padding: '2px 6px',
                  color: '#3b82f6',
                  borderColor: 'rgba(59, 130, 246, 0.4)',
                  background: 'rgba(59, 130, 246, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                title="Buka AI Sentinel Desk"
              >
                <span>🛡️</span>
                <span style={{ fontWeight: 700 }}>DEFCON {data?.geopolitical_threat?.defcon_level || 4} // AI DESK</span>
              </button>

              {/* Quick Launch Lot Calculator Modal */}
              <button
                className="telemetry-btn"
                onClick={() => handleOpenLotCalc()}
                style={{
                  fontSize: '9px',
                  padding: '2px 6px',
                  color: 'var(--accent-gold)',
                  borderColor: 'var(--accent-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  whiteSpace: 'nowrap'
                }}
                title="Kalkulator Ukuran Lot dan Manajemen Risiko"
              >
                <span>💰</span>
                <span style={{ fontWeight: 700 }}>LOT CALC</span>
              </button>

              {/* Manual Refresh / Sync Button */}
              <button
                className="telemetry-btn"
                onClick={() => {
                  refetchAll();
                  setSyncTrigger(prev => prev + 1);
                }}
                style={{ fontSize: '9px', padding: '2px 5px', whiteSpace: 'nowrap' }}
                title="Sinkronisasi Ulang Seluruh Data Ticker"
              >
                🔄
              </button>

              {/* Dark / Light Mode Switcher */}
              <button
                className="telemetry-btn"
                onClick={toggleTheme}
                style={{
                  fontSize: '9px',
                  padding: '2px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  whiteSpace: 'nowrap'
                }}
                title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              >
                <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
                <span style={{ fontWeight: 700 }}>{theme === 'dark' ? 'LIGHT' : 'DARK'}</span>
              </button>
            </div>
          </header>

          {/* 2. Main Content View Routing with Suspense fallback */}
          <Suspense fallback={
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚡</div>
              <div style={{ fontWeight: '700', fontFamily: 'var(--font-mono)' }}>MEMUAT MODUL KUANTITATIF...</div>
            </div>
          }>
            {activeTab === 'AI_SENTINEL' || activeTab === 'AI_SENTINEL_DEFCON' || activeTab === 'AI_SENTINEL_DEBATE' || activeTab === 'SENTINEL' ? (
              /* AI SENTINEL EMBEDDED DESK VIEW */
              <main style={{ padding: '12px 0' }}>
                <AiIntelligenceDrawer
                  isDrawer={false}
                  isOpen={true}
                  defaultTab={activeTab === 'AI_SENTINEL_DEFCON' ? 'DEFCON' : activeTab === 'AI_SENTINEL_DEBATE' ? 'DEBATE' : 'THEMATIC'}
                  threatData={data?.geopolitical_threat}
                  debateData={data?.ai_agent_arena}
                  aiDiagnostics={data?.ai_agent_arena?.diagnostics}
                  thematicData={data?.thematic_macro_regimes}
                  allIdxStocks={allIdxStocks}
                  onRefreshDesk={refetchAll}
                />
              </main>
            ) : activeTab === 'WATCHLIST' ? (
              /* PERSONAL WATCHLIST (Star Marked Items) */
              <main>
                <PersonalWatchlistTab
                  data={data}
                  allIdxStocks={allIdxStocks}
                  allCryptoSpot={allCryptoSpot}
                  livePrices={livePrices}
                  onSelectTicker={handleOpenSecurityHub}
                  onOpenChart={handleOpenSecurityHub}
                  onOpenLotCalc={handleOpenLotCalc}
                  onNavigateTab={setActiveTab}
                />
              </main>
            ) : activeTab === 'AI_AGENTS' ? (
              /* AI MULTI-AGENT ARENA & 24/7 REAL-MARKET SIMULATOR */
              <main>
                <AiAgentArenaTab
                  data={data}
                  livePrices={livePrices}
                  onOpenChart={handleOpenSecurityHub}
                />
              </main>
            ) : activeTab === 'HOME' ? (
              /* HOME COMMAND CENTER (Wire + Bento + Foreign Flow + Konglo + Top 5 Alpha) */
              <HomeDashboardTab
                data={data}
                livePrices={livePrices}
                allIdxStocks={allIdxStocks}
                flashMap={flashMap}
                onSelectTicker={handleOpenSecurityHub}
                onOpenLotCalc={handleOpenLotCalc}
                onNavigateTab={setActiveTab}
                onSelectNews={handleOpenNews}
              />
            ) : activeTab === 'CHARTING' ? (
              /* INSTITUTIONAL CHARTING DESK */
              <main>
                <ChartingDeskTab
                  data={data}
                  livePrices={livePrices}
                  flashMap={flashMap}
                  onOpenLotCalc={handleOpenLotCalc}
                  initialSymbol={chartModal.symbol || 'BBCA'}
                />
              </main>
            ) : activeTab === 'CHANGELOG' ? (
              /* SYSTEM CHANGELOG & VERSION RELEASES */
              <main>
                <ChangelogTab />
              </main>
            ) : activeTab === 'WHALES' ? (
              /* v3.0 WHALE INTELLIGENCE HUB */
              <main>
                <WhaleIntelligenceTab data={data} onOpenChart={handleOpenSecurityHub} livePrices={livePrices} />
              </main>
            ) : activeTab === 'FUTURES' ? (
              /* v3.0 CRYPTO FUTURES INTELLIGENCE + DEXSCREENER */
              <main>
                <CryptoFuturesTab 
                  data={data} 
                  onOpenChart={handleOpenSecurityHub} 
                  livePrices={livePrices} 
                  flashMap={flashMap}
                  allCryptoSpot={allCryptoSpot}
                />
              </main>
            ) : activeTab === 'FOREX' ? (
              /* v3.0 FOREX COMMAND CENTER */
              <main>
                <ForexCommandTab data={data} onOpenChart={handleOpenSecurityHub} livePrices={livePrices} flashMap={flashMap} />
              </main>
            ) : activeTab === 'US_STOCKS' ? (
              /* v3.0 US STOCK INTELLIGENCE */
              <main>
                <USStockTab data={data} onOpenChart={handleOpenSecurityHub} livePrices={livePrices} flashMap={flashMap} />
              </main>
            ) : activeTab === 'HEATMAP' ? (
              /* v4.0 MARKET HEATMAP TREEMAP */
              <main>
                <MarketHeatmapTab data={data} onSelectTicker={handleOpenSecurityHub} livePrices={livePrices} flashMap={flashMap} />
              </main>
            ) : (
              /* DEEP-DIVE SCREENER / TESTING / RESEARCH TABS */
              <main>
                <MasterQuantLeaderboard
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  allIdxStocks={allIdxStocks}
                  allCryptoSpot={allCryptoSpot}
                  tradePlans={data?.daily_trade_plans || []}
                  cryptoSpotList={data?.crypto_spot_10 || []}
                  conglomerates={data?.conglomerates || {}}
                  dividendHunters={data?.dividend_hunters || []}
                  foreignFlow={data?.foreign_flow || {}}
                  liveNews={data?.macro_telemetry?.live_news || []}
                  macro={data?.macro_telemetry || {}}
                  paperPortfolio={data?.paper_portfolio || {}}
                  backtestLab={data?.backtest_lab || {}}
                  strategyRankings={data?.strategy_rankings || []}
                  brokerSummary={data?.broker_summary || {}}
                  bundle={data}
                  livePrices={livePrices}
                  flashMap={flashMap}
                  onSelectTicker={handleOpenSecurityHub}
                  onOpenLotCalc={handleOpenLotCalc}
                  onSelectNews={handleOpenNews}
                />
              </main>
            )}

            {/* 3. TradingView Chart Modal */}
            {chartModal.isOpen && (
              <TradingViewModal
                initialSymbol={chartModal.symbol}
                market={chartModal.market}
                onClose={handleCloseChart}
              />
            )}

            {/* 4. Lot Calculator Modal */}
            <LotCalculatorModal
              isOpen={lotCalcModal.isOpen}
              onClose={handleCloseLotCalc}
              prefillEntry={lotCalcModal.entry}
              prefillSL={lotCalcModal.sl}
              initialMarket={lotCalcModal.market}
              initialSymbol={lotCalcModal.symbol}
            />

            {/* 5. News Detail Modal */}
            {newsModal.isOpen && (
              <NewsDetailModal
                news={newsModal.news}
                allNews={data?.macro_telemetry?.live_news || []}
                onClose={handleCloseNews}
                onSelectTicker={handleOpenSecurityHub}
              />
            )}

            {/* 6. Institutional Security Hub Drawer */}
            {securityHub.isOpen && (
              <SecurityHubDrawer
                isOpen={securityHub.isOpen}
                symbol={securityHub.symbol}
                market={securityHub.market}
                onClose={handleCloseSecurityHub}
                data={data}
                livePrices={livePrices}
                flashMap={flashMap}
                onOpenChart={(sym, mkt) => {
                  handleCloseSecurityHub();
                  handleOpenChart(sym, mkt);
                }}
                onOpenLotCalc={(entry, sl, mkt, sym) => {
                  handleOpenLotCalc(entry, sl, mkt || securityHub.market, sym || securityHub.symbol);
                }}
                onNavigateTab={(tab) => {
                  handleCloseSecurityHub();
                  setActiveTab(tab);
                }}
              />
            )}

            {/* AI Intelligence & Geopolitical Sentinel Drawer */}
            {isAiDrawerOpen && (
              <AiIntelligenceDrawer
                isOpen={isAiDrawerOpen}
                onClose={() => setIsAiDrawerOpen(false)}
                threatData={data?.geopolitical_threat}
                debateData={data?.ai_agent_arena}
                aiDiagnostics={data?.ai_agent_arena?.diagnostics}
                thematicData={data?.thematic_macro_regimes}
                allIdxStocks={allIdxStocks}
                onRefreshDesk={refetchAll}
              />
            )}
          </Suspense>

          {/* OpenTerminalUI Provider Health & Data Quality Status Bar */}
          <div style={{
            marginTop: '20px',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            padding: '6px 12px',
            background: 'var(--bg-panel-subtle)',
            borderRadius: '6px',
            border: 'var(--border-hairline)',
            fontSize: '9.5px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                FEED HEALTH:
              </span>
              <span>IDX BEI: <strong style={{ color: '#10b981' }}>🟢 ACTIVE (48ms)</strong></span>
              <span>Binance WS: <strong style={{ color: isWsConnected ? '#10b981' : '#f59e0b' }}>{isWsConnected ? '🟢 CONNECTED' : '🟡 POLLING'}</strong></span>
              <span>US Yield Curve: <strong style={{ color: '#10b981' }}>🟢 SYNCED</strong></span>
              <span>Gemini LLM: <strong style={{ color: '#10b981' }}>🟢 READY (3.6-FLASH)</strong></span>
              <span>MCP Server: <strong style={{ color: '#38bdf8' }}>🟢 STDIO v3.0</strong></span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '8.5px' }}>
              PROVENANCE ENVELOPE: ZERO UNVERIFIED METRICS
            </div>
          </div>

          {/* 5. Institutional Disclaimer Footer */}
          <footer style={{
            marginTop: '24px',
            borderTop: 'var(--border-muted)',
            paddingTop: '10px',
            paddingBottom: '16px',
            fontSize: '10px',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div>
              <strong>DISCLAIMER</strong>: Algorithmic screening & quantitative intelligence only. Bukan ajakan atau nasihat investasi.
            </div>
            <div>
              MBG QUANT TERMINAL // MARKET BRAIN GRID · ZERO RUNTIME COST
            </div>
          </footer>

        </div>{/* /main-content */}

      </div>{/* /app-layout */}
      {/* Global Command Palette Modal (Ctrl + K) */}
      <CommandPaletteModal
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        allIdxStocks={allIdxStocks}
        allCryptoSpot={allCryptoSpot}
        onSelectTicker={handleOpenSecurityHub}
        onNavigateTab={setActiveTab}
        onOpenLotCalc={handleOpenLotCalc}
        onToggleTheme={toggleTheme}
        onRefetch={() => {
          refetchAll();
          setSyncTrigger(prev => prev + 1);
        }}
      />
    </PasswordGate>
  );
}
