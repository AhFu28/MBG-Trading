import React, { useState, useEffect, useCallback } from 'react';
import PasswordGate from './components/PasswordGate.jsx';
import MasterQuantLeaderboard from './components/MasterQuantLeaderboard.jsx';
import HomeDashboardTab from './components/HomeDashboardTab.jsx';
import TradingViewModal from './components/TradingViewModal.jsx';
import LotCalculatorModal from './components/LotCalculatorModal.jsx';
import Sidebar from './components/Sidebar.jsx';
import ChangelogTab from './components/ChangelogTab.jsx';
import ChartingDeskTab from './components/ChartingDeskTab.jsx';
import GlobalMarketTicker from './components/GlobalMarketTicker.jsx';

function HeaderClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString('id-ID', { 
    timeZone: 'Asia/Jakarta', 
    hour12: false, 
    hourCycle: 'h23' 
  });
  const tzName = 'WIB';

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
      title={`Waktu Perangkat Lokal (${Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta'})`}
    >
      <span>🕒</span>
      <span>{timeStr} {tzName}</span>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('HOME');
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

  const parseSafeDate = (isoString) => {
    if (!isoString) return null;
    const safeIso = isoString.endsWith('Z') || isoString.includes('+') ? isoString : isoString + 'Z';
    return new Date(safeIso);
  };

  const loadBundle = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch('/data/latest_cockpit_bundle.json?_t=' + Date.now());
      if (res.ok) {
        const json = await res.json();
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

  useEffect(() => {
    loadBundle();
    // Auto-poll fresh telemetry every 60 seconds
    const interval = setInterval(() => {
      loadBundle(true);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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
                onClick={() => loadBundle(false)}
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

              {/* Sync Status Badge */}
              <div 
                style={{ 
                  fontSize: '10px', 
                  padding: '5px 8px', 
                  borderRadius: 'var(--radius-xs)', 
                  background: 'var(--bg-panel-subtle)', 
                  color: 'var(--accent-green)', 
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  border: 'var(--border-hairline)'
                }}
                title={data?.last_updated ? `Snapshot Pipeline: ${parseSafeDate(data.last_updated)?.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB` : 'Live Telemetry'}
              >
                <span>🟢</span>
                <span>SYNCED</span>
              </div>

              {/* Live Real-time Clock */}
              <HeaderClock />

            </div>
          </header>

          {/* 2. Main Tab Body */}
          {loading ? (
            <div className="telemetry-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-primary)' }}>
              Memuat Telemetri MBG APEX Quant Terminal...
            </div>
          ) : activeTab === 'HOME' ? (
            /* HOME COMMAND CENTER (Wire + Bento + Foreign Flow + Konglo + Top 5 Alpha) */
            <HomeDashboardTab
              data={data}
              onSelectTicker={handleOpenChart}
              onOpenLotCalc={handleOpenLotCalc}
              onNavigateTab={setActiveTab}
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
                onSelectTicker={handleOpenChart}
                onOpenLotCalc={handleOpenLotCalc}
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
              <strong>DISCLAIMER</strong>: Algorithmic screening &amp; quantitative intelligence only. Bukan ajakan atau nasihat investasi.
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
