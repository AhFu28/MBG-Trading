import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import PasswordGate from './components/PasswordGate.jsx';
import MasterQuantLeaderboard from './components/MasterQuantLeaderboard.jsx';
import HomeDashboardTab from './components/HomeDashboardTab.jsx';
import Sidebar from './components/Sidebar.jsx';
import GlobalMarketTicker from './components/GlobalMarketTicker.jsx';
import { useLivePrices } from './hooks/useLivePrices.js';

// Code Splitting for heavy secondary modules
const TradingViewModal = lazy(() => import('./components/TradingViewModal.jsx'));
const LotCalculatorModal = lazy(() => import('./components/LotCalculatorModal.jsx'));
const ChangelogTab = lazy(() => import('./components/ChangelogTab.jsx'));
const ChartingDeskTab = lazy(() => import('./components/ChartingDeskTab.jsx'));
const WhaleIntelligenceTab = lazy(() => import('./components/WhaleIntelligenceTab.jsx'));
const CryptoFuturesTab = lazy(() => import('./components/CryptoFuturesTab.jsx'));
const ForexCommandTab = lazy(() => import('./components/ForexCommandTab.jsx'));
const USStockTab = lazy(() => import('./components/USStockTab.jsx'));
const NewsDetailModal = lazy(() => import('./components/NewsDetailModal.jsx'));

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
        fontSize: '11px', 
        padding: '5px 10px', 
        borderRadius: 'var(--radius-xs)', 
        background: 'var(--bg-panel-subtle)', 
        color: 'var(--text-primary)', 
        fontFamily: 'var(--font-mono)',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
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
  const { livePrices, flashMap, isWsConnected, lastUpdateTime, refetchAll } = useLivePrices(data);

  // Native hash routing
  const getTabFromHash = () => {
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
    market: 'IDX'
  });

  const handleOpenLotCalc = useCallback((entry = '', sl = '', market = 'IDX') => {
    setLotCalcModal({ isOpen: true, entry, sl, market });
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
        const res = await fetch('/data/latest_cockpit_bundle.json');
        if (res.ok) {
          const json = await res.json();
          // Fallback if bundle is partial
          if (!json.daily_trade_plans || !json.daily_trade_plans.length) {
            try {
              const fallbackPlans = await fetch('/data/daily_trade_plans.json');
              if (fallbackPlans.ok) {
                json.daily_trade_plans = await fallbackPlans.json();
              }
            } catch (e) {
              console.warn('Fallback daily_trade_plans fetch failed:', e);
            }
          }
          if (!json.crypto_spot_10 || !json.crypto_spot_10.length) {
            try {
              const fallbackCrypto = await fetch('/data/crypto_spot_10.json');
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
      default: return 'Institutional Desk';
    }
  };

  return (
    <PasswordGate>
      <div className="app-layout">

        {/* Mobile hamburger toggle */}
        <button
          className="sidebar-hamburger"
          onClick={() => setMobileOpen(prev => !prev)}
          aria-label="Toggle Sidebar"
        >
          ☰
        </button>

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
          stockCount={(data?.daily_trade_plans || []).filter(p => p.market === 'IDX').length}
          cryptoCount={(data?.crypto_spot_10 || []).length}
          newsCount={(data?.macro_telemetry?.live_news || []).length}
          livePrices={livePrices}
          flashMap={flashMap}
          onSelectTicker={handleOpenChart}
        />

        {/* ===== MAIN CONTENT AREA ===== */}
        <div className="main-content">

          {/* 1. Master Top Header Bar */}
          <header className="telemetry-panel" style={{
            marginBottom: '12px',
            padding: '8px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            {/* Left: Active Module Title (Clean & Modern) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 6px var(--accent-green)' }} />
              <div style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '0.04em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                {getTabLabel(activeTab)}
              </div>
            </div>

            {/* Right: Quick Launch Tools, Theme Switcher, Sync & Live Clock */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              
              {/* Bursa Luar Negeri (Global Market Sessions Ticker) */}
              <GlobalMarketTicker onNavigateGlobal={() => setActiveTab('GLOBAL_MARKETS')} />

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="telemetry-btn"
                style={{
                  background: 'var(--bg-panel-subtle)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title="Ganti Mode Gelap / Terang"
              >
                <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
                <span>{theme === 'dark' ? 'LIGHT' : 'DARK'}</span>
              </button>

              {/* Sync Trigger Button */}
              <button
                onClick={() => {
                  setSyncTrigger(prev => prev + 1);
                  refetchAll();
                }}
                className="telemetry-btn"
                style={{
                  background: 'var(--bg-panel-subtle)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title="Sinkronkan & Refresh Telemetri Terbaru"
              >
                <span>🔄</span>
                <span>SYNC</span>
              </button>

              {/* Sync & Live Stream Status Badge */}
              <div 
                style={{ 
                  fontSize: '10px', 
                  padding: '5px 8px', 
                  borderRadius: 'var(--radius-xs)', 
                  background: 'var(--bg-panel-subtle)', 
                  color: isWsConnected ? 'var(--accent-green)' : 'var(--accent-gold)', 
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  border: 'var(--border-hairline)'
                }}
                title={lastUpdateTime ? `Last Tick: ${lastUpdateTime.toLocaleTimeString('id-ID')} WIB` : 'Live Stream'}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isWsConnected ? 'var(--accent-green)' : 'var(--accent-gold)', boxShadow: isWsConnected ? '0 0 5px var(--accent-green)' : 'none' }} />
                <span>{isWsConnected ? 'STREAM 1S LIVE' : 'SYNCED'}</span>
              </div>

              {/* Live Real-time Clock */}
              <HeaderClock />

            </div>
          </header>

          {/* 2. Main Tab Body with Suspense */}
          <Suspense fallback={<div className="telemetry-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-primary)' }}>Memuat modul MBG APEX...</div>}>
            {loading ? (
              <div className="telemetry-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-primary)' }}>
                Memuat Telemetri MBG APEX Quant Terminal...
              </div>
            ) : activeTab === 'HOME' ? (
              /* HOME COMMAND CENTER (Wire + Bento + Foreign Flow + Konglo + Top 5 Alpha) */
              <HomeDashboardTab
                data={data}
                livePrices={livePrices}
                flashMap={flashMap}
                onSelectTicker={handleOpenChart}
                onOpenLotCalc={handleOpenLotCalc}
                onNavigateTab={setActiveTab}
                onSelectNews={handleOpenNews}
              />
            ) : activeTab === 'CHARTING' ? (
              /* INSTITUTIONAL CHARTING DESK */
              <main>
                <ChartingDeskTab
                  data={data}
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
                <WhaleIntelligenceTab data={data} onOpenChart={handleOpenChart} livePrices={livePrices} />
              </main>
            ) : activeTab === 'FUTURES' ? (
              /* v3.0 CRYPTO FUTURES INTELLIGENCE + DEXSCREENER */
              <main>
                <CryptoFuturesTab data={data} onOpenChart={handleOpenChart} livePrices={livePrices} />
              </main>
            ) : activeTab === 'FOREX' ? (
              /* v3.0 FOREX COMMAND CENTER */
              <main>
                <ForexCommandTab data={data} onOpenChart={handleOpenChart} livePrices={livePrices} />
              </main>
            ) : activeTab === 'US_STOCKS' ? (
              /* v3.0 US STOCK INTELLIGENCE */
              <main>
                <USStockTab data={data} onOpenChart={handleOpenChart} livePrices={livePrices} />
              </main>
            ) : (
              /* DEEP-DIVE SCREENER / TESTING / RESEARCH TABS */
              <main>
                <MasterQuantLeaderboard
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
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
                  onSelectTicker={handleOpenChart}
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
            />

            {/* 5. News Detail Modal */}
            {newsModal.isOpen && (
              <NewsDetailModal
                news={newsModal.news}
                allNews={data?.macro_telemetry?.live_news || []}
                onClose={handleCloseNews}
                onSelectTicker={handleOpenChart}
              />
            )}
          </Suspense>

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
    </PasswordGate>
  );
}
