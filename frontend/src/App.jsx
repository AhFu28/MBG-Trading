import React, { useState, useEffect } from 'react';
import PasswordGate from './components/PasswordGate.jsx';
import MacroAlertBanner from './components/MacroAlertBanner.jsx';
import IdxKongloGrid from './components/IdxKongloGrid.jsx';
import IdxDividendTab from './components/IdxDividendTab.jsx';
import IdxForeignFlow from './components/IdxForeignFlow.jsx';
import CryptoSpot10 from './components/CryptoSpot10.jsx';
import DailyTradePlans from './components/DailyTradePlans.jsx';
import AllTickerExplorer from './components/AllTickerExplorer.jsx';
import TradingViewModal from './components/TradingViewModal.jsx';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans'); // Default to 10-20 trade plans
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

  // Collect all indexed stocks for AllTickerExplorer
  const allIndexedStocks = [];
  if (data?.conglomerates) {
    Object.values(data.conglomerates).forEach(arr => allIndexedStocks.push(...arr));
  }
  if (data?.dividend_hunters) {
    allIndexedStocks.push(...data.dividend_hunters);
  }
  if (data?.foreign_flow?.top_inflow) {
    allIndexedStocks.push(...data.foreign_flow.top_inflow);
  }
  if (data?.foreign_flow?.top_outflow) {
    allIndexedStocks.push(...data.foreign_flow.top_outflow);
  }

  // Deduplicate by ticker
  const uniqueIndexedStocks = Array.from(new Map(allIndexedStocks.map(s => [s.ticker, s])).values());

  return (
    <PasswordGate>
    <div style={{ minHeight: '100vh', padding: '16px 20px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* 1. Master Top Bar */}
      <header className="telemetry-panel" style={{ marginBottom: '14px', padding: '10px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '10px', height: '10px', background: 'var(--accent-green)' }}></div>
            <div>
              <h1 style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '0.04em' }}>
                MARKET BRAIN GRID // TRADING INTELLIGENCE COCKPIT
              </h1>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                TACTICAL TELEMETRY DESK · 10-20 ACTIONABLE RECOMMANDATIONS · TRADINGVIEW INTERACTIVE
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
            <button 
              onClick={() => handleOpenChart('BBCA', 'IDX')}
              className="telemetry-btn"
              style={{ background: 'var(--accent-blue)', color: '#fff' }}
            >
              📈 LAUNCH TRADINGVIEW
            </button>

            <div className="metric-box" style={{ padding: '4px 8px' }}>
              <span className="metric-label">TIME (WIB): </span>
              <span style={{ fontWeight: '700' }}>{currentTime.toLocaleTimeString('id-ID')}</span>
            </div>

            <div className="metric-box" style={{ padding: '4px 8px' }}>
              <span className="metric-label">PIPELINE: </span>
              <span style={{ color: 'var(--accent-green)', fontWeight: '700' }}>ONLINE 24/7</span>
            </div>

            <button onClick={loadBundle} className="telemetry-btn">
              🔄 REFRESH
            </button>
          </div>

        </div>
      </header>

      {/* 2. Global Macro Impact Alert Banner (US Fed / Trump / Commodities) */}
      <MacroAlertBanner macro={data?.macro_telemetry} />

      {/* 3. Main Navigation Tab Selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('plans')}
          className={`telemetry-btn ${activeTab === 'plans' ? 'active' : ''}`}
        >
          🎯 10-20 REKOMENDASI TRADING ({data?.daily_trade_plans?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('crypto')}
          className={`telemetry-btn ${activeTab === 'crypto' ? 'active' : ''}`}
        >
          ⚡ 10 CRYPTO SPOT (USDT)
        </button>

        <button
          onClick={() => setActiveTab('explorer')}
          className={`telemetry-btn ${activeTab === 'explorer' ? 'active' : ''}`}
        >
          🔍 ALL-TICKER EXPLORER ({uniqueIndexedStocks.length}+)
        </button>

        <button
          onClick={() => setActiveTab('konglo')}
          className={`telemetry-btn ${activeTab === 'konglo' ? 'active' : ''}`}
        >
          🏢 IDX CONGLOMERATES
        </button>

        <button
          onClick={() => setActiveTab('dividend')}
          className={`telemetry-btn ${activeTab === 'dividend' ? 'active' : ''}`}
        >
          💰 DIVIDEND HUNTERS
        </button>

        <button
          onClick={() => setActiveTab('foreign')}
          className={`telemetry-btn ${activeTab === 'foreign' ? 'active' : ''}`}
        >
          🌊 FOREIGN FLOW RADAR
        </button>
      </div>

      {/* 4. Tab Content Area */}
      {loading ? (
        <div className="telemetry-panel" style={{ padding: '30px', textAlign: 'center' }}>
          Initializing Telemetry Deck and fetching live signals...
        </div>
      ) : (
        <main>
          {activeTab === 'plans' && (
            <DailyTradePlans plans={data?.daily_trade_plans} onOpenChart={handleOpenChart} />
          )}

          {activeTab === 'crypto' && (
            <CryptoSpot10 cryptoList={data?.crypto_spot_10} onOpenChart={handleOpenChart} />
          )}

          {activeTab === 'explorer' && (
            <AllTickerExplorer allStocks={uniqueIndexedStocks} onSelectTicker={handleOpenChart} />
          )}

          {activeTab === 'konglo' && (
            <IdxKongloGrid conglomerates={data?.conglomerates} onSelectTicker={handleOpenChart} />
          )}

          {activeTab === 'dividend' && (
            <IdxDividendTab dividendHunters={data?.dividend_hunters} onSelectTicker={handleOpenChart} />
          )}

          {activeTab === 'foreign' && (
            <IdxForeignFlow foreignFlow={data?.foreign_flow} onSelectTicker={handleOpenChart} />
          )}
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

      {/* 6. Standing Disclaimer Footer */}
      <footer style={{ marginTop: '30px', borderTop: 'var(--border-muted)', paddingTop: '12px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <strong>DISCLAIMER</strong>: Educational and research intelligence platform only. Zero automated live executions. Verify every metric before trading.
        </div>
        <div>
          ARCH: GitHub Actions Cron + Supabase + Vercel SPA · Zero Server Overhead
        </div>
      </footer>

    </div>
    </PasswordGate>
  );
}
