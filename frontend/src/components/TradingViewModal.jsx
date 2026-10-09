import React, { useEffect, useRef, useState } from 'react';
import { getTvSymbol } from '../data/tv-helpers.js';
import HyperliquidProDesk from './HyperliquidProDesk.jsx';

export default function TradingViewModal({ initialSymbol, market = 'IDX', onClose, onOpenLotCalc, onOpenExecution }) {
  const containerRef = useRef(null);

  // Helper to identify if symbol belongs to Crypto or IDX
  const isCryptoSymbol = (sym, mkt) => {
    if (mkt === 'CRYPTO') return true;
    const clean = (sym || '').replace('.JK', '').replace('/', '').toUpperCase();
    return clean.endsWith('USDT') || clean.endsWith('USDC') || clean.startsWith('BTC') || clean.startsWith('ETH') || clean.startsWith('SOL') || clean.startsWith('HYPE');
  };

  const initialIsCrypto = isCryptoSymbol(initialSymbol, market);
  const [modalMode, setModalMode] = useState('PRO'); // 'PRO' (Hyperliquid Pro Desk) | 'STANDARD'
  const [currentSymbol, setCurrentSymbol] = useState(initialSymbol || (initialIsCrypto ? 'ETHUSDT' : 'BBCA'));
  const [searchInput, setSearchInput] = useState('');
  // Default to 'D' (Day) for IDX stocks because TradingView free IDX feed only supports D, W, M.
  const [chartInterval, setChartInterval] = useState(initialIsCrypto ? '15' : 'D');
  const [refreshKey, setRefreshKey] = useState(0);

  const isCurrentCrypto = isCryptoSymbol(currentSymbol, market);

  // Auto-guard: Automatically switch to Day interval if an Indonesian stock is active
  useEffect(() => {
    if (!isCurrentCrypto && ['1', '3', '5', '15', '30', '60', '120', '240'].includes(chartInterval)) {
      setChartInterval('D');
    }
  }, [currentSymbol, market, isCurrentCrypto]);

  useEffect(() => {
    if (modalMode !== 'STANDARD') return;
    const tvSymbol = getTvSymbol(currentSymbol, market);
    
    // Clear previous widget
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Embed TradingView Widget via iframe/container script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: chartInterval,
      timezone: "Asia/Jakarta",
      theme: "dark",
      style: "1", // Candlesticks
      locale: "id",
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: true,
      backgroundColor: '#0a0d14',
      studies: [
        "MASimple@tv-basicstudies",
        "RSI@tv-basicstudies",
        "Volume@tv-basicstudies"
      ],
      support_host: "https://www.tradingview.com"
    });

    const widgetWrapper = document.createElement('div');
    widgetWrapper.className = 'tradingview-widget-container__widget';
    widgetWrapper.style.height = 'calc(100% - 32px)';
    widgetWrapper.style.width = '100%';

    if (containerRef.current) {
      containerRef.current.appendChild(widgetWrapper);
      containerRef.current.appendChild(script);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [currentSymbol, market, chartInterval, refreshKey, modalMode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const sym = searchInput.trim().toUpperCase();
      setCurrentSymbol(sym);
      if (!isCryptoSymbol(sym, market)) {
        setChartInterval('D');
      }
      setSearchInput('');
    }
  };

  if (modalMode === 'PRO') {
    return (
      <div 
        onClick={() => onClose?.()}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(4, 7, 14, 0.82)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 'min(1480px, 98vw)',
            height: '92vh',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}
        >
          <HyperliquidProDesk
            initialSymbol={currentSymbol}
            onClose={onClose}
            onSwitchToGrid={() => setModalMode('STANDARD')}
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={() => onClose?.()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4, 7, 14, 0.82)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="telemetry-panel" 
        style={{
          width: 'min(1440px, 98vw)',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-panel, #0a0d12)',
          border: 'var(--border-hairline)',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.95)'
        }}
      >
        
        {/* Modal Topbar */}
        <div className="telemetry-header" style={{ background: 'var(--bg-panel-subtle, #0e1219)', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: 'var(--border-hairline)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--accent-orange)', fontWeight: '800', fontSize: '12px' }}>TRADINGVIEW CHART WORKSTATION</span>
            <span className="badge badge-alert" style={{ fontFamily: 'var(--font-mono)' }}>{getTvSymbol(currentSymbol, market)}</span>

            <button
              onClick={() => setModalMode('PRO')}
              style={{
                background: 'linear-gradient(135deg, var(--accent-emerald), #059669)',
                color: '#022c22',
                border: 'none',
                padding: '3px 9px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                marginLeft: '6px'
              }}
              title="Beralih ke Hyperliquid Pro Terminal (Orderbook & Execution Desk)"
            >
              ⚡ Hyperliquid Pro Desk
            </button>

            {/* Smart Adaptive Timeframe selector */}
            <div style={{ display: 'flex', gap: '3px', background: 'rgba(255,255,255,0.06)', padding: '2px 4px', borderRadius: '4px', marginLeft: '6px', alignItems: 'center' }}>
              {(isCurrentCrypto ? [
                { label: '5m', val: '5' },
                { label: '15m', val: '15' },
                { label: '1H', val: '60' },
                { label: '4H', val: '240' },
                { label: '1D', val: 'D' },
                { label: '1W', val: 'W' }
              ] : [
                { label: '1D (Day)', val: 'D' },
                { label: '1W (Week)', val: 'W' },
                { label: '1M (Month)', val: 'M' }
              ]).map(tf => (
                <button
                  key={tf.val}
                  onClick={() => setChartInterval(tf.val)}
                  style={{
                    background: chartInterval === tf.val ? 'var(--accent-blue)' : 'transparent',
                    color: chartInterval === tf.val ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    padding: '2px 7px',
                    fontSize: '10px',
                    fontWeight: '700',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                  title={!isCurrentCrypto ? 'TradingView IDX hanya mendukung data EOD (Daily/Weekly/Monthly)' : `Interval ${tf.label}`}
                >
                  {tf.label}
                </button>
              ))}
              {!isCurrentCrypto && (
                <span style={{ fontSize: '9px', color: '#8e8e93', padding: '0 4px', fontFamily: 'var(--font-mono)' }}>
                  IDX EOD Feed
                </span>
              )}
            </div>

            <button
              onClick={() => setRefreshKey(k => k + 1)}
              className="telemetry-btn"
              style={{ fontSize: '10px', padding: '3px 8px', background: 'rgba(255,255,255,0.05)', color: 'var(--accent-mint)', border: '1px solid rgba(255,255,255,0.1)' }}
              title="Reload Chart Data"
            >
              🔄 REFRESH
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {onOpenLotCalc && (
              <button
                onClick={() => onOpenLotCalc('', '', isCurrentCrypto ? 'CRYPTO' : 'IDX', currentSymbol)}
                className="telemetry-btn"
                style={{ fontSize: '10px', padding: '3px 8px', background: 'rgba(255,180,84,0.12)', color: 'var(--accent-gold)', border: '1px solid rgba(255,180,84,0.3)' }}
                title="Buka kalkulator ukuran lot & manajemen risiko"
              >
                💰 Sizing / Lot
              </button>
            )}
            {onOpenExecution && (
              <button
                onClick={() => onOpenExecution({ symbol: currentSymbol, market: isCurrentCrypto ? 'CRYPTO' : 'IDX' })}
                className="telemetry-btn"
                style={{ fontSize: '10px', padding: '3px 8px', background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.3)' }}
                title="Buka tiket eksekusi order paper"
              >
                ⚡ Tiket Order
              </button>
            )}

            <button 
              onClick={onClose}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#f87171',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              ✕ CLOSE
            </button>
          </div>
        </div>

        {/* Quick Ticker Switcher */}
        <div style={{ padding: '8px 14px', background: 'rgba(11, 16, 26, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>CARI TICKER:</span>
            <input 
              type="text" 
              placeholder="e.g. BTC, ETH, SOL, BBCA, NVDA..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                fontFamily: 'var(--font-mono)',
                padding: '4px 8px',
                fontSize: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                borderRadius: '4px',
                outline: 'none',
                width: '200px',
                textTransform: 'uppercase'
              }}
            />
          </form>

          {/* Quick presets */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {['BBCA', 'BBRI', 'BMRI', 'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'NVDA'].map(sym => (
              <button
                key={sym}
                onClick={() => {
                  setCurrentSymbol(sym);
                  if (!isCryptoSymbol(sym, market)) setChartInterval('D');
                }}
                style={{
                  background: currentSymbol === sym ? 'var(--accent-blue)' : 'rgba(255, 255, 255, 0.04)',
                  color: currentSymbol === sym ? '#fff' : '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '700',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer'
                }}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Chart iframe container */}
        <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: 0 }}>
          <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
        </div>

      </div>
    </div>
  );
}
