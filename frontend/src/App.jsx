import React, { useState, useEffect, useCallback } from 'react';
import PasswordGate from './components/PasswordGate.jsx';
import MasterQuantLeaderboard from './components/MasterQuantLeaderboard.jsx';
import HomeDashboardTab from './components/HomeDashboardTab.jsx';
import TradingViewModal from './components/TradingViewModal.jsx';
import LotCalculatorModal from './components/LotCalculatorModal.jsx';
import Sidebar from './components/Sidebar.jsx';
import ChangelogTab from './components/ChangelogTab.jsx';

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
    sl: ''
  });

  const handleOpenLotCalc = useCallback((entry = '', sl = '') => {
    setLotCalcModal({ isOpen: true, entry, sl });
  }, []);

  const handleCloseLotCalc = useCallback(() => {
    setLotCalcModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const loadBundle = async () => {
    try {
      setLoading(true);
      const res = await fetch('/data/latest_cockpit_bundle.json');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        console.error('Failed to load local bundle:', res.status);
      }
    } catch (err) {
      console.error('Error fetching latest bundle:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBundle();
  }, []);

  const getTabLabel = (tab) => {
    switch (tab) {
      case 'HOME': return '🏠 Home Command Center';
      case 'STOCK': return '📈 Saham IDX Alpha';
      case 'CRYPTO': return '⚡ Crypto Spot Momentum';
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
          theme={theme}
          toggleTheme={toggleTheme}
          onRefresh={loadBundle}
          isMobileOpen={isMobileOpen}
          setMobileOpen={setMobileOpen}
          lastUpdate={data?.last_updated || data?.meta?.generated_at}
          stockCount={(data?.daily_trade_plans || []).filter(p => p.market === 'IDX').length}
          cryptoCount={(data?.crypto_spot_10 || []).length}
          newsCount={(data?.macro_telemetry?.live_news || []).length}
        />

        {/* ===== MAIN CONTENT AREA ===== */}
        <div className="main-content">

          {/* 1. Master Top Header Bar (MBG title aligned with Launch Chart & Lot Calculator) */}
          <header className="telemetry-panel" style={{
            marginBottom: '12px',
            padding: '8px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            {/* Left: Active Module Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 6px var(--accent-green)' }} />
              <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                <span style={{ color: 'var(--accent-green)' }}>MBG ASTRA</span>
                <span style={{ margin: '0 6px', opacity: 0.4 }}>//</span>
                <span style={{ color: 'var(--text-primary)' }}>{getTabLabel(activeTab)}</span>
              </div>
            </div>

            {/* Right: Quick Launch Tools + Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleOpenChart('AMMN', 'IDX')}
                className="telemetry-btn"
                style={{
                  background: 'var(--bg-panel-subtle)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title="Buka TradingView Pro Chart"
              >
                <span>📈</span>
                <span>LAUNCH CHART</span>
              </button>

              <button
                onClick={() => handleOpenLotCalc()}
                className="telemetry-btn"
                style={{
                  background: 'var(--accent-green)',
                  color: '#ffffff',
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 2px 6px rgba(0, 208, 132, 0.25)'
                }}
                title="Kalkulator Ukuran Lot & Manajemen Risiko"
              >
                <span>💰</span>
                <span>KALKULATOR LOT</span>
              </button>

              <div style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-panel-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {data?.last_updated ? ('SYNC: ' + new Date(data.last_updated).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) + ' WIB') : 'DATA LIVE 🟢'}
              </div>
            </div>
          </header>

          {/* 2. Main Tab Body */}
          {loading ? (
            <div className="telemetry-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-primary)' }}>
              Memuat Telemetri MBG Astra Quant Terminal...
            </div>
          ) : activeTab === 'HOME' ? (
            /* HOME COMMAND CENTER (Wire + Bento + Foreign Flow + Konglo + Top 5 Alpha) */
            <HomeDashboardTab
              data={data}
              onSelectTicker={handleOpenChart}
              onOpenLotCalc={handleOpenLotCalc}
              onNavigateTab={setActiveTab}
            />
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
              MBG ASTRA QUANT TERMINAL · ZERO RUNTIME COST
            </div>
          </footer>

        </div>{/* /main-content */}

      </div>{/* /app-layout */}
    </PasswordGate>
  );
}
