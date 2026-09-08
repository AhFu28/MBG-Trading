import React, { useState, useEffect } from 'react';
import PasswordGate from './components/PasswordGate.jsx';
import MacroAlertBanner from './components/MacroAlertBanner.jsx';
import DailyTradePlans from './components/DailyTradePlans.jsx';
import CryptoSpot10 from './components/CryptoSpot10.jsx';
import UnifiedMarketScanner from './components/UnifiedMarketScanner.jsx';
import TradingViewModal from './components/TradingViewModal.jsx';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('ALL_SIGNALS'); // ALL_SIGNALS | IDX_ONLY | CRYPTO_ONLY | SCANNER
  const [currentTime, setCurrentTime] = useState(new Date());

  // TradingView Chart Modal State
  const [chartModal, setChartModal] = useState({
    isOpen: false,
    symbol: 'BBCA',
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
        console.error("Failed to load local bundle:", res.status);
      }
    } catch (err) {
      console.error("Error fetching latest bundle:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBundle();
  }, []);

  // Top picks extraction for Executive Hero
  const topIdx = (data?.daily_trade_plans || []).filter(p => p.market === 'IDX')[0];
  const topCrypto = (data?.crypto_spot_10 || [])[0];

  return (
    <PasswordGate>
      <div style={{ minHeight: '100vh', padding: '14px 16px', maxWidth: '1440px', margin: '0 auto' }}>
        
        {/* 1. Master Top Bar */}
        <header className="telemetry-panel" style={{ marginBottom: '12px', padding: '10px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '10px', height: '10px', background: 'var(--accent-green)' }}></div>
              <div>
                <h1 style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '0.05em', margin: 0 }}>
                  MARKET BRAIN GRID // UNIFIED ALPHA COCKPIT
                </h1>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  INSTITUTIONAL QUANT TELEMETRY · ZERO-TAB CLUTTER · 24/7 AUTONOMOUS SCANNER
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => handleOpenChart('MEDC', 'IDX')}
                className="telemetry-btn"
                style={{ background: 'var(--accent-blue)', color: '#fff', padding: '4px 10px' }}
              >
                📈 TRADINGVIEW
              </button>

              <div className="metric-box" style={{ padding: '3px 8px' }}>
                <span className="metric-label">WIB: </span>
                <span style={{ fontWeight: '700' }}>{currentTime.toLocaleTimeString('id-ID')}</span>
              </div>

              <div className="metric-box" style={{ padding: '3px 8px' }}>
                <span className="metric-label">TELEGRAM BOT: </span>
                <span style={{ color: 'var(--accent-green)', fontWeight: '700' }}>CONNECTED 🟢</span>
              </div>

              <button onClick={loadBundle} className="telemetry-btn" style={{ padding: '4px 8px' }}>
                🔄
              </button>
            </div>

          </div>
        </header>

        {/* 2. Global Macro Radar Banner */}
        <MacroAlertBanner macro={data?.macro_telemetry} />

        {/* 3. Executive Hero Bar: 3-Second Market Mood & Top Alpha */}
        {data && (
          <div className="hero-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '10px',
            marginBottom: '14px'
          }}>
            {/* Box 1: Overall Market Mood */}
            <div className="telemetry-panel" style={{ padding: '10px 14px', borderLeft: '4px solid var(--accent-green)' }}>
              <div className="metric-label">IHSG &amp; GLOBAL BIAS</div>
              <div style={{ fontSize: '14px', fontWeight: '700', marginTop: '2px', color: 'var(--accent-green)' }}>
                BULLISH MOMENTUM ACCUMULATION
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Sentimen Emas &amp; Minyak mendukung sektor Komoditas dan Energi BEI.
              </div>
            </div>

            {/* Box 2: Top Saham BEI of the Day */}
            <div className="telemetry-panel" style={{ padding: '10px 14px', borderLeft: '4px solid var(--accent-blue)' }}>
              <div className="metric-label">🔥 TOP IDX ALPHA WATCHLIST</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '2px' }}>
                <span style={{ fontSize: '15px', fontWeight: '700' }}>${topIdx?.clean_ticker || 'MEDC'}</span>
                <span className="badge badge-bull">{topIdx?.technical_signal || 'BREAKOUT'}</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Entry: Rp {topIdx?.entry_price?.toLocaleString()} | TP: Rp {topIdx?.target_1?.toLocaleString()} | R:R {topIdx?.risk_reward_ratio || 2.2}
              </div>
            </div>

            {/* Box 3: Top Spot Crypto of the Day */}
            <div className="telemetry-panel" style={{ padding: '10px 14px', borderLeft: '4px solid var(--accent-orange)' }}>
              <div className="metric-label">⚡ TOP CRYPTO SPOT ALPHA</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '2px' }}>
                <span style={{ fontSize: '15px', fontWeight: '700' }}>{topCrypto?.pair || 'SOL/USDT'}</span>
                <span className="badge badge-alert">R:R 1:{topCrypto?.risk_reward_ratio || 2.0}</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Entry: ${topCrypto?.current_price} | TP1: ${topCrypto?.take_profit_1} | SL: ${topCrypto?.stop_loss}
              </div>
            </div>
          </div>
        )}

        {/* 4. Quick View Toggle (Instead of 6 isolated tabs) */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveSection('ALL_SIGNALS')}
            className={`telemetry-btn ${activeSection === 'ALL_SIGNALS' ? 'active' : ''}`}
          >
            📊 UNIFIED DASHBOARD (SAHAM &amp; KRIPTO)
          </button>
          <button
            onClick={() => setActiveSection('SCANNER')}
            className={`telemetry-btn ${activeSection === 'SCANNER' ? 'active' : ''}`}
          >
            🔍 ALL-IN-ONE MARKET SCANNER (KONGLO, DIVIDEN &amp; ASING)
          </button>
        </div>

        {/* 5. Main Content Area */}
        {loading ? (
          <div className="telemetry-panel" style={{ padding: '30px', textAlign: 'center' }}>
            Initializing Unified Cockpit Telemetry...
          </div>
        ) : (
          <main>
            {activeSection === 'ALL_SIGNALS' && (
              <div className="side-by-side-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)',
                gap: '14px',
                marginBottom: '16px'
              }}>
                {/* Left Column: Astra Structured Trade Plans */}
                <div>
                  <DailyTradePlans plans={data?.daily_trade_plans} onOpenChart={handleOpenChart} />
                </div>

                {/* Right Column: 10 Crypto Spot Quick Cards */}
                <div>
                  <CryptoSpot10 cryptoList={data?.crypto_spot_10} onOpenChart={handleOpenChart} />
                </div>
              </div>
            )}

            {/* Unified Scanner (Always accessible or focused in SCANNER view) */}
            <div style={{ marginTop: activeSection === 'SCANNER' ? '0' : '10px' }}>
              <UnifiedMarketScanner
                conglomerates={data?.conglomerates}
                dividendHunters={data?.dividend_hunters}
                foreignFlow={data?.foreign_flow}
                onSelectTicker={handleOpenChart}
              />
            </div>
          </main>
        )}

        {/* 6. TradingView Interactive Modal */}
        {chartModal.isOpen && (
          <TradingViewModal
            initialSymbol={chartModal.symbol}
            market={chartModal.market}
            onClose={handleCloseChart}
          />
        )}

        {/* 7. Institutional Disclaimer Footer */}
        <footer style={{
          marginTop: '24px',
          borderTop: 'var(--border-muted)',
          paddingTop: '12px',
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
            MBG TRADING COCKPIT · GITHUB ACTIONS CRON + VERCEL EDGE · ZERO RUNTIME SERVER COST
          </div>
        </footer>

      </div>
    </PasswordGate>
  );
}
