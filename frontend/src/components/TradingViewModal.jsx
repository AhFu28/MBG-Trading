import React, { useEffect, useRef, useState } from 'react';

export default function TradingViewModal({ initialSymbol, market = 'IDX', onClose }) {
  const containerRef = useRef(null);

  // Helper to identify if symbol belongs to Crypto or IDX
  const isCryptoSymbol = (sym, mkt) => {
    if (mkt === 'CRYPTO') return true;
    const clean = (sym || '').replace('.JK', '').replace('/', '').toUpperCase();
    return clean.endsWith('USDT') || clean.startsWith('BTC') || clean.startsWith('ETH') || clean.startsWith('SOL');
  };

  const initialIsCrypto = isCryptoSymbol(initialSymbol, market);
  const [currentSymbol, setCurrentSymbol] = useState(initialSymbol || 'BBCA');
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

  // Format symbol for TradingView
  const getTvSymbol = (sym, mkt) => {
    const clean = sym.replace('.JK', '').replace('/', '').toUpperCase();
    if (mkt === 'CRYPTO' || clean.endsWith('USDT')) {
      return `BINANCE:${clean}`;
    }
    return `IDX:${clean}`;
  };

  useEffect(() => {
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
  }, [currentSymbol, market, chartInterval, refreshKey]);

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

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(18, 19, 22, 0.75)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="telemetry-panel" style={{
        width: '100%',
        maxWidth: '1200px',
        height: '85vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        border: '2px solid var(--border-color)',
        boxShadow: '8px 8px 0px rgba(0,0,0,0.3)'
      }}>
        
        {/* Modal Topbar */}
        <div className="telemetry-header" style={{ background: '#1c1d22', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--accent-orange)', fontWeight: '700' }}>TRADINGVIEW INTERACTIVE TELEMETRY</span>
            <span className="badge badge-alert">{getTvSymbol(currentSymbol, market)}</span>

            {/* Smart Adaptive Timeframe selector */}
            <div style={{ display: 'flex', gap: '3px', background: 'rgba(255,255,255,0.08)', padding: '2px 4px', borderRadius: '4px', marginLeft: '6px', alignItems: 'center' }}>
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
                    color: chartInterval === tf.val ? '#ffffff' : '#a0a0a5',
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
              style={{ fontSize: '10px', padding: '2px 8px', background: 'var(--bg-panel)', color: 'var(--accent-green)' }}
              title="Reload Chart Data"
            >
              🔄 REFRESH
            </button>
          </div>

          <button 
            onClick={onClose}
            className="telemetry-btn" 
            style={{ background: 'var(--accent-rust)', color: '#fff', padding: '2px 10px', fontSize: '12px' }}
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Quick Ticker Switcher */}
        <div style={{ padding: '8px 14px', background: 'var(--bg-panel-subtle)', borderBottom: 'var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>CHECK ANY TICKER:</span>
            <input 
              type="text" 
              placeholder="e.g. RAJA, ACES, BREN, SOL..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                fontFamily: 'var(--font-mono)',
                padding: '4px 8px',
                fontSize: '12px',
                border: 'var(--border-hairline)',
                outline: 'none',
                width: '200px',
                textTransform: 'uppercase'
              }}
            />
            <button type="submit" className="telemetry-btn" style={{ background: 'var(--accent-blue)', color: '#fff' }}>
              LOAD CHART
            </button>
          </form>

          {/* Quick presets */}
          <div style={{ display: 'flex', gap: '6px', fontSize: '10px' }}>
            <span style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>PRESETS:</span>
            {['BBCA', 'BREN', 'ANTM', 'MEDC', 'BTCUSDT', 'SOLUSDT'].map(preset => (
              <button 
                key={preset}
                onClick={() => {
                  setCurrentSymbol(preset);
                  if (!isCryptoSymbol(preset, market)) {
                    setChartInterval('D');
                  }
                }}
                className="telemetry-btn"
                style={{ padding: '2px 6px', fontSize: '10px' }}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Canvas Area */}
        <div 
          ref={containerRef} 
          className="tradingview-widget-container" 
          style={{ flex: '1 1 auto', width: '100%', height: '100%', position: 'relative' }}
        >
          {/* TradingView Widget will inject here */}
        </div>

      </div>
    </div>
  );
}
