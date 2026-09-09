import React, { useState, useEffect } from 'react';
import PasswordGate from './components/PasswordGate.jsx';
import BloombergNewsWire from './components/BloombergNewsWire.jsx';
import MasterQuantLeaderboard from './components/MasterQuantLeaderboard.jsx';
import TradingViewModal from './components/TradingViewModal.jsx';
import LotCalculatorModal from './components/LotCalculatorModal.jsx';
import Sidebar from './components/Sidebar.jsx';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('STOCK');
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

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // TradingView Chart Modal State
  const [chartModal, setChartModal] = useState({
    isOpen: false,
    symbol: 'MEDC',
    market: 'IDX'
  });

  const handleOpenChart = (symbol, market = 'IDX') => {
    setChartModal({
      isOpen: true,
      symbol: symbol,
      market: market
    });
  };

  const handleCloseChart = () => {
    setChartModal(prev => ({ ...prev, isOpen: false }));
  };

  // Lot Calculator Modal State
  const [lotCalcModal, setLotCalcModal] = useState({
    isOpen: false,
    entry: '',
    sl: ''
  });

  const handleOpenLotCalc = (entry = '', sl = '') => {
    setLotCalcModal({ isOpen: true, entry, sl });
  };

  const handleCloseLotCalc = () => {
    setLotCalcModal(prev => ({ ...prev, isOpen: false }));
  };

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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

  // Top picks extraction for Executive Hero HUD
  const topIdx = (data?.daily_trade_plans || []).filter(p => p.market === 'IDX')[0];
  const topCrypto = (data?.crypto_spot_10 || [])[0];

  return (
    <PasswordGate>
      <div className="app-layout">

        {/* Mobile hamburger toggle */}
        <button
          className="sidebar-hamburger"
          onClick={() => setMobileOpen(prev => !prev)}
          aria-label="Toggle Sidebar"
        >
          â˜°
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

        {/* ===== LEFT SIDEBAR ===== */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          theme={theme}
          toggleTheme={toggleTheme}
          onOpenChart={handleOpenChart}
          onOpenLotCalc={handleOpenLotCalc}
          onRefresh={loadBundle}
          isMobileOpen={isMobileOpen}
          setMobileOpen={setMobileOpen}
          currentTime={currentTime}
          lastUpdate={data?.meta?.generated_at}
          stockCount={(data?.daily_trade_plans || []).filter(p => p.market === 'IDX').length}
          cryptoCount={(data?.crypto_spot_10 || []).length}
          newsCount={(data?.macro_telemetry?.live_news || []).length}
        />

        {/* ===== MAIN CONTENT AREA ===== */}
        <div className="main-content">

          {/* 1. Slim breadcrumb top bar */}
          <header className='telemetry-panel' style={{ marginBottom: '10px', padding: '6px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              <span style={{ color: 'var(--accent-green)' }}>MBG</span>
              <span style={{ margin: '0 6px', opacity: 0.4 }}>//</span>
              <span style={{ color: 'var(--text-primary)' }}>
                {activeTab === 'STOCK' && 'ðŸ“ˆ Saham IDX'}
                {activeTab === 'CRYPTO' && 'âš¡ Crypto Spot'}
                {activeTab === 'CURRENT_TEST' && 'ðŸ§ª Paper Trading'}
                {activeTab === 'BACKTEST_LAB' && 'ðŸ“Š Backtest Lab'}
                {activeTab === 'GLOBAL_MARKETS' && 'ðŸŒ Pasar Global'}
                {activeTab === 'ECONOMIC_CALENDAR' && 'ðŸ“… Kalender Makro'}
                {activeTab === 'PEARSON_CORRELATION' && 'ðŸ”— Korelasi Pearson'}
                {activeTab === 'NEWS' && 'ðŸ“° Live News'}
                {activeTab === 'WATCHLIST' && 'â­ Watchlist'}
                {activeTab === 'ACADEMY' && 'ðŸŽ“ Quant Academy'}
              </span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {data?.macro_telemetry?.impact_assessment?.overall_sentiment
                ? <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>ðŸŸ¢ {data.macro_telemetry.impact_assessment.overall_sentiment}</span>
                : <span>â³ Awaiting data...</span>
              }
            </div>
          </header>

          {/* 2. Bloomberg Live News Wire */}
          <BloombergNewsWire macro={data?.macro_telemetry} onSelectTicker={handleOpenChart} />

          {/* 3. Executive Hero Bento Cards */}
          {data && (() => {
            const topIdx = (data?.daily_trade_plans || []).filter(p => p.market === 'IDX')[0];
            const topCrypto = (data?.crypto_spot_10 || [])[0];
            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>

                {/* Card 1: Macro Regime */}
                <div className='telemetry-panel' style={{ padding: '10px 14px', borderLeft: '3px solid var(--accent-green)', background: 'linear-gradient(135deg, var(--bg-panel) 0%, rgba(0,208,132,0.04) 100%)' }}>
                  <div className='metric-label'>ðŸŒ IHSG & Global Macro Regime</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', marginTop: '4px', color: 'var(--accent-green)' }}>
                    {data?.macro_telemetry?.impact_assessment?.overall_sentiment || 'AWAITING DATA'}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                    {data?.macro_telemetry?.impact_assessment?.narrative || data?.macro_telemetry?.live_news?.[0]?.title || 'Menunggu data macro...'}
                  </div>
                </div>

                {/* Card 2: IDX Alpha */}
                <div className='telemetry-panel' style={{ padding: '10px 14px', borderLeft: '3px solid var(--accent-blue)' }}>
                  <div className='metric-label'>ðŸ”¥ #1 IDX Alpha Watchlist</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {topIdx?.clean_ticker || 'MEDC'}
                    </span>
                    <span className='badge badge-bull'>{topIdx?.technical_signal || 'BREAKOUT'}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                    Entry: Rp {topIdx?.entry_price?.toLocaleString()} Â· TP: Rp {topIdx?.target_1?.toLocaleString()} Â· R:R {topIdx?.risk_reward_ratio || 2.2}
                  </div>
                </div>

                {/* Card 3: Crypto Alpha */}
                <div className='telemetry-panel' style={{ padding: '10px 14px', borderLeft: '3px solid var(--accent-orange)' }}>
                  <div className='metric-label'>âš¡ #1 Crypto Spot Alpha</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {topCrypto?.pair || 'SOL/USDT'}
                    </span>
                    <span className='badge badge-alert'>R:R 1:{topCrypto?.risk_reward_ratio || 2.0}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                    Entry: ${topCrypto?.current_price || topCrypto?.entry_high} Â· TP: ${topCrypto?.take_profit_1} Â· SL: ${topCrypto?.stop_loss}
                  </div>
                </div>

              </div>
            );
          })()}

          {/* 4. Master Quant Leaderboard */}
          {loading ? (
            <div className='telemetry-panel' style={{ padding: '30px', textAlign: 'center', color: 'var(--text-primary)' }}>
              Initializing Bloomberg Quant Terminal Telemetry...
            </div>
          ) : (
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
                onSelectTicker={handleOpenChart}
                onOpenLotCalc={handleOpenLotCalc}
              />
            </main>
          )}

          {/* 5. TradingView Chart Modal */}
          {chartModal.isOpen && (
            <TradingViewModal
              initialSymbol={chartModal.symbol}
              market={chartModal.market}
              onClose={handleCloseChart}
            />
          )}

          {/* Lot Calculator Modal */}
          <LotCalculatorModal
            isOpen={lotCalcModal.isOpen}
            onClose={handleCloseLotCalc}
            prefillEntry={lotCalcModal.entry}
            prefillSL={lotCalcModal.sl}
          />

          {/* 6. Disclaimer Footer */}
          <footer style={{ marginTop: '20px', borderTop: 'var(--border-muted)', paddingTop: '10px', fontSize: '10px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <strong>DISCLAIMER</strong>: Algorithmic screening & quantitative intelligence only. Bukan ajakan investasi.
            </div>
            <div>MBG BLOOMBERG QUANT TERMINAL Â· ZERO RUNTIME COST</div>
          </footer>

        </div>{/* /main-content */}

      </div>{/* /app-layout */}
    </PasswordGate>
  );
}
