import React, { useState, useEffect } from 'react';
import PasswordGate from './components/PasswordGate.jsx';
import BloombergNewsWire from './components/BloombergNewsWire.jsx';
import MasterQuantLeaderboard from './components/MasterQuantLeaderboard.jsx';
import TradingViewModal from './components/TradingViewModal.jsx';
import LotCalculatorModal from './components/LotCalculatorModal.jsx';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

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
      <div style={{ minHeight: '100vh', padding: '12px 16px', maxWidth: '1440px', margin: '0 auto' }}>
        
        {/* 1. Master Top Bar */}
        <header className='telemetry-panel' style={{ marginBottom: '10px', padding: '8px 14px', border: 'var(--border-hairline)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', background: 'var(--accent-green)' }}></div>
              <div>
                <h1 style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.06em', margin: 0, color: 'var(--text-primary)' }}>
                  MBG ASTRA QUANTITATIVE TERMINAL // INSTITUTIONAL CROSS-ASSET DESK
                </h1>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                  10-MODULE UNIFIED COCKPIT · SMC ORDER BLOCKS · BANDARMOLOGI IIFS · TIMESFM AI · EXP3 META-LEARNER
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', flexWrap: 'wrap' }}>
              {/* Dark / Light Mode Toggle Button */}
              <button
                onClick={toggleTheme}
                className='telemetry-btn'
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: '700',
                  background: theme === 'dark' ? 'var(--bg-panel-subtle)' : '#1c1d22',
                  color: theme === 'dark' ? 'var(--text-primary)' : '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title='Toggle Light / Dark Mode'
              >
                {theme === 'dark' ? '☀️ LIGHT MODE' : '🌙 DARK MODE'}
              </button>

              <button 
                onClick={() => handleOpenChart('MEDC', 'IDX')}
                className='telemetry-btn'
                style={{ background: 'var(--text-primary)', color: 'var(--bg-canvas)', padding: '4px 10px', fontSize: '10px' }}
              >
                📈 LAUNCH CHART
              </button>

              <button 
                onClick={() => handleOpenLotCalc()}
                className='telemetry-btn'
                style={{ background: 'var(--accent-green)', color: '#fff', padding: '4px 10px', fontSize: '10px' }}
              >
                💰 KALKULATOR LOT
              </button>

              <div className='metric-box' style={{ padding: '3px 8px' }}>
                <span className='metric-label'>WIB: </span>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                  {currentTime.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false })}
                </span>
              </div>

              <div className='metric-box' style={{ padding: '3px 8px' }}>
                <span style={{ color: 'var(--accent-green)', fontWeight: '700' }}>
                  {data?.meta?.generated_at ? ('LAST UPDATE: ' + new Date(data.meta.generated_at).toLocaleTimeString('id-ID', {timeZone:'Asia/Jakarta'}) + ' WIB') : 'DATA OFFLINE 🔴'}
                </span>
              </div>

              <button onClick={loadBundle} className='telemetry-btn' style={{ padding: '4px 8px', fontSize: '10px' }}>
                🔄 REFRESH
              </button>
            </div>

          </div>
        </header>

        {/* 2. Bloomberg Live News Wire & Multi-Headline Carousel */}
        <BloombergNewsWire macro={data?.macro_telemetry} onSelectTicker={handleOpenChart} />

        {/* 3. Executive Hero Bar: 3-Second Market Mood & Top Alpha */}
        {data && (
          <div className='hero-grid' style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '10px',
            marginBottom: '12px'
          }}>
            {/* Box 1: Overall Market Mood */}
            <div className='telemetry-panel' style={{ padding: '8px 12px', borderLeft: '4px solid #34c759' }}>
              <div className='metric-label'>IHSG &amp; GLOBAL BIAS</div>
              <div style={{ fontSize: '13px', fontWeight: '700', marginTop: '2px', color: '#1b8a4b' }}>
                {data?.macro_telemetry?.impact_assessment?.overall_sentiment || 'AWAITING DATA'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {data?.macro_telemetry?.impact_assessment?.narrative || data?.macro_telemetry?.live_news?.[0]?.title || 'Menunggu data macro terbaru...'}
              </div>
            </div>

            {/* Box 2: Top Saham BEI of the Day */}
            <div className='telemetry-panel' style={{ padding: '8px 12px', borderLeft: '4px solid #0066cc' }}>
              <div className='metric-label'>🔥 #1 IDX ALPHA WATCHLIST</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '2px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>${topIdx?.clean_ticker || 'MEDC'}</span>
                <span className='badge badge-bull'>{topIdx?.technical_signal || 'BREAKOUT'}</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Entry: Rp {topIdx?.entry_price?.toLocaleString()} | TP: Rp {topIdx?.target_1?.toLocaleString()} | R:R {topIdx?.risk_reward_ratio || 2.2}
              </div>
            </div>

            {/* Box 3: Top Spot Crypto of the Day */}
            <div className='telemetry-panel' style={{ padding: '8px 12px', borderLeft: '4px solid #ff9500' }}>
              <div className='metric-label'>⚡ #1 CRYPTO SPOT ALPHA</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '2px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{topCrypto?.pair || 'SOL/USDT'}</span>
                <span className='badge badge-alert'>R:R 1:{topCrypto?.risk_reward_ratio || 2.0}</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Entry: ${topCrypto?.current_price || topCrypto?.entry_high} | TP1: ${topCrypto?.take_profit_1} | SL: ${topCrypto?.stop_loss}
              </div>
            </div>
          </div>
        )}

        {/* 4. Single Master Quant Leaderboard with 5-Tab System */}
        {loading ? (
          <div className='telemetry-panel' style={{ padding: '30px', textAlign: 'center', color: 'var(--text-primary)' }}>
            Initializing Bloomberg Quant Terminal Telemetry...
          </div>
        ) : (
          <main>
            <MasterQuantLeaderboard
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

        {/* 5. TradingView Interactive Modal */}
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

        {/* 6. Institutional Disclaimer Footer */}
        <footer style={{
          marginTop: '20px',
          borderTop: 'var(--border-muted)',
          paddingTop: '10px',
          fontSize: '10px',
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            <strong>DISCLAIMER</strong>: Algorithmic screening &amp; quantitative intelligence only. Bukan ajakan atau nasihat investasi. Selalu lakukan validasi dan risk management sebelum eksekusi.
          </div>
          <div>
            MBG BLOOMBERG QUANT TERMINAL · ZERO RUNTIME SERVER COST
          </div>
        </footer>

      </div>
    </PasswordGate>
  );
}