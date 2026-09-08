import React, { useEffect, useRef, useState } from 'react';

export default function TradingViewModal({ initialSymbol, market = 'IDX', onClose }) {
  const containerRef = useRef(null);
  const [currentSymbol, setCurrentSymbol] = useState(initialSymbol || 'BBCA');
  const [searchInput, setSearchInput] = useState('');

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
      interval: "D",
      timezone: "Asia/Jakarta",
      theme: "light",
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
  }, [currentSymbol, market]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setCurrentSymbol(searchInput.trim().toUpperCase());
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
        <div className="telemetry-header" style={{ background: '#1c1d22', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--accent-orange)', fontWeight: '700' }}>TRADINGVIEW INTERACTIVE TELEMETRY</span>
            <span className="badge badge-alert">{getTvSymbol(currentSymbol, market)}</span>
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
                onClick={() => setCurrentSymbol(preset)}
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
