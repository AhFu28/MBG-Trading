import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getTvSymbol, cleanSymbolStr } from '../data/tv-helpers.js';
import HyperliquidProDesk from './HyperliquidProDesk.jsx';

/**
 * ChartPane - Individual TradingView Chart Instance for Multi-Grid Workstation
 */
/**
 * ExecutionHudOverlay - jev-trade inspired real-time visual execution & triple-barrier HUD
 */
function ExecutionHudOverlay({ symbol, market, currentPrice, plan, isCrypto, onOpenLotCalc, onOpenExecution }) {
  const isIdx = market === 'IDX' || (!isCrypto && !symbol.includes('USDT'));
  const p = Number(currentPrice || (isIdx ? 1200 : 100));
  const entry = plan?.entry_price || plan?.entry_low || p;
  const sl = plan?.stop_loss || (isIdx ? Math.round(entry * 0.965) : Number((entry * 0.97).toFixed(4)));
  const tp = plan?.take_profit_1 || (isIdx ? Math.round(entry * 1.082) : Number((entry * 1.085).toFixed(4)));
  const trailing = isIdx ? Math.round(entry * 1.025) : Number((entry * 1.03).toFixed(4));
  
  const tpPct = (((tp - entry) / entry) * 100).toFixed(2);
  const slPct = (((sl - entry) / entry) * 100).toFixed(2);
  const pnlPct = (((p - entry) / entry) * 100).toFixed(2);
  const isProfit = Number(pnlPct) >= 0;

  const botName = isIdx ? 'Bot-06 Bandarmology VWAP' : 'Bot-02 Momentum Alpha';
  const cleanSym = cleanSymbolStr(symbol);

  return (
    <div style={{
      position: 'absolute',
      top: '32px',
      left: '8px',
      right: '8px',
      zIndex: 10,
      background: 'rgba(10, 14, 22, 0.92)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(59, 130, 246, 0.35)',
      borderRadius: '8px',
      padding: '7px 10px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.65)',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '6px',
      fontSize: '11px',
      fontFamily: 'var(--font-mono, monospace)',
      pointerEvents: 'auto'
    }}>
      {/* Bot & Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(16, 185, 129, 0.15)',
          color: 'var(--accent-emerald)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontWeight: 700,
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)', display: 'inline-block' }} />
          LIVE EXECUTION
        </span>
        <span style={{ color: '#93c5fd', fontWeight: 600 }}>{botName}</span>
        <span style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '10px' }}>
          • Sizing: {isIdx ? '150 Lot' : '2,500 USDT'}
        </span>
      </div>

      {/* Triple-Barrier Telemetry Pill Grid */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {/* Entry */}
        <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '2px 5px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '9px' }}>Entry: </span>
          <strong style={{ color: '#f1f5f9' }}>{isIdx ? `Rp ${entry.toLocaleString()}` : `$${entry}`}</strong>
        </div>

        {/* Upper Barrier (TP) */}
        <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '2px 5px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          <span style={{ color: 'var(--accent-emerald)', fontSize: '9px' }}>🎯 Barrier 1 (TP): </span>
          <strong style={{ color: 'var(--accent-mint)' }}>{isIdx ? `Rp ${tp.toLocaleString()}` : `$${tp}`} (+{tpPct}%)</strong>
        </div>

        {/* Lower Barrier (SL) */}
        <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '2px 5px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
          <span style={{ color: '#ef4444', fontSize: '9px' }}>🛑 Barrier 2 (SL): </span>
          <strong style={{ color: '#f87171' }}>{isIdx ? `Rp ${sl.toLocaleString()}` : `$${sl}`} ({slPct}%)</strong>
        </div>

        {/* Vertical Barrier (Time Horizon) */}
        <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '2px 5px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
          <span style={{ color: 'var(--accent-gold)', fontSize: '9px' }}>⏱️ Barrier 3 (Time): </span>
          <strong style={{ color: '#fbbf24' }}>Bar 14/24 (H+3)</strong>
        </div>

        {/* Trailing Stop & Slippage */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#93c5fd', fontSize: '10px' }}>
            Trailing: <strong>{isIdx ? `Rp ${trailing.toLocaleString()}` : `$${trailing}`}</strong>
          </span>
          <span style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '10px' }}>
            Slip: <span style={{ color: 'var(--accent-emerald)' }}>0.08% (TWAP)</span>
          </span>
          <span style={{
            color: isProfit ? 'var(--accent-mint)' : '#f87171',
            background: isProfit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            padding: '1px 5px',
            borderRadius: '3px',
            fontWeight: 700
          }}>
            PnL: {isProfit ? `+${pnlPct}%` : `${pnlPct}%`}
          </span>

          {onOpenLotCalc && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenLotCalc(entry, sl, market, cleanSym);
              }}
              style={{
                background: '#2457D6',
                color: '#fff',
                border: 'none',
                padding: '2px 7px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
              title="1-Klik Bawa ke Sizing"
            >
              ⚡ Sizing
            </button>
          )}

          {onOpenExecution && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenExecution({ symbol: cleanSym, market, side: 'LONG', entry, stopLoss: sl, takeProfit: tp });
              }}
              style={{
                background: '#3BC78A',
                color: '#0B0E14',
                border: 'none',
                padding: '2px 7px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
              title="1-Klik Eksekusi Order"
            >
              🚀 Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ChartPane({
  paneId,
  symbol,
  market,
  timeframe,
  preset,
  studies = [],
  onSelectTicker,
  onChangeTimeframe,
  isActive,
  onActivate,
  plan = null,
  currentPrice = null,
  onOpenLotCalc,
  onOpenExecution
}) {
  const containerRef = useRef(null);
  const clean = cleanSymbolStr(symbol);
  const isCrypto = market === 'CRYPTO' || clean.endsWith('USDT') || clean.startsWith('BTC') || clean.startsWith('ETH') || clean.startsWith('SOL');
  const [showHud, setShowHud] = useState(true);

  useEffect(() => {
    const tvSymbol = getTvSymbol(symbol, market);
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: timeframe,
      timezone: 'Asia/Jakarta',
      theme: 'dark',
      style: '1',
      locale: 'id',
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      save_image: true,
      studies: studies,
      support_host: 'https://www.tradingview.com'
    });

    const widgetWrapper = document.createElement('div');
    widgetWrapper.className = 'tradingview-widget-container__widget';
    widgetWrapper.style.width = '100%';
    widgetWrapper.style.height = '100%';

    if (containerRef.current) {
      containerRef.current.appendChild(widgetWrapper);
      containerRef.current.appendChild(script);
    }

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [symbol, market, timeframe, studies]);

  return (
    <div
      onClick={onActivate}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '340px',
        background: '#0b0e14',
        border: isActive ? '1px solid var(--accent-blue, #3b82f6)' : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '6px',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Mini Pane Topbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 8px',
        background: 'rgba(18, 23, 34, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            color: isActive ? 'var(--accent-sky-soft)' : 'var(--text-primary)',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '1px 5px',
            borderRadius: '3px'
          }}>
            {getTvSymbol(symbol, market)}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>
            {market}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* HUD toggle button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowHud(prev => !prev);
            }}
            title="Toggle Triple-Barrier Execution HUD Overlay"
            style={{
              background: showHud ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              color: showHud ? 'var(--accent-sky-soft)' : 'var(--text-muted)',
              border: '1px solid ' + (showHud ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.1)'),
              borderRadius: '3px',
              padding: '1px 6px',
              fontSize: '9px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <span>🎯</span>
            <span>{showHud ? 'HUD ON' : 'HUD'}</span>
          </button>

          {/* Timeframe selector */}
          <div style={{ display: 'flex', gap: '2px' }}>
          {(isCrypto ? ['15', '60', '240', 'D'] : ['D', 'W', 'M']).map(tf => (
            <button
              key={tf}
              onClick={(e) => {
                e.stopPropagation();
                onChangeTimeframe && onChangeTimeframe(paneId, tf);
              }}
              style={{
                background: timeframe === tf ? 'var(--accent-blue, #3b82f6)' : 'transparent',
                color: timeframe === tf ? '#fff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '2px',
                padding: '1px 5px',
                fontSize: '9px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {tf === '60' ? '1H' : tf === '240' ? '4H' : tf}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
        {showHud && (
          <ExecutionHudOverlay
            symbol={symbol}
            market={market}
            currentPrice={currentPrice}
            plan={plan}
            isCrypto={isCrypto}
            onOpenLotCalc={onOpenLotCalc}
            onOpenExecution={onOpenExecution}
          />
        )}
        <div
          ref={containerRef}
          className="tradingview-widget-container"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}

/**
 * ChartingDeskTab - Institutional Multi-Panel Chart Workstation
 * Features:
 * - Multi-Chart Grid Switcher: Single (1-Chart), Dual (2-Split), Quad (4-Grid)
 * - Independent Symbol, Market, and Timeframe per Pane
 * - 4 Strategy Preset Shortcuts: SMC, Trend Following, Bandar Flow, Mean Reversion
 * - Companion Strategy Telemetry Panel & 1-Click Lot Calculator
 */
export default function ChartingDeskTab({
  data = {},
  livePrices = {},
  flashMap = {},
  onOpenLotCalc,
  onOpenPrediction,
  onOpenExecution,
  initialSymbol = 'BBCA'
}) {
  const [deskMode, setDeskMode] = useState('PRO'); // 'PRO' (Hyperliquid Pro Desk) | 'GRID' (Multi-Pane Grid)
  const [layoutMode, setLayoutMode] = useState('1'); // '1' | '2' | '4'
  const [showCompanion, setShowCompanion] = useState(true);
  const [activePreset, setActivePreset] = useState('SMC');
  const [searchInput, setSearchInput] = useState('');
  const [activePaneId, setActivePaneId] = useState(1);

  // Pane configurations
  const [panes, setPanes] = useState({
    1: { symbol: initialSymbol || 'BBCA', market: 'IDX', timeframe: 'D' },
    2: { symbol: 'BTCUSDT', market: 'CRYPTO', timeframe: '15' },
    3: { symbol: 'NVDA', market: 'US', timeframe: 'D' },
    4: { symbol: 'EURUSD', market: 'FOREX', timeframe: '60' }
  });

  const activePane = panes[activePaneId] || panes[1];
  const cleanSym = cleanSymbolStr(activePane.symbol);
  const isCrypto = activePane.market === 'CRYPTO' || cleanSym.endsWith('USDT') || cleanSym.startsWith('BTC') || cleanSym.startsWith('ETH') || cleanSym.startsWith('SOL');

  // Strategy Presets
  const presetConfigs = useMemo(() => ({
    SMC: {
      badge: 'SMC DESK',
      badgeColor: 'var(--accent-purple, #a855f7)',
      studies: ["MASimple@tv-basicstudies", "Volume@tv-basicstudies"],
      indicators: [
        '• Bullish & Bearish Order Blocks (Gunakan Rectangle Tool)',
        '• Fair Value Gap (FVG Imbalance Zone)',
        '• Market Structure Break (BOS / CHoCH)',
        '• Baseline Volume Profile & Dynamic MA'
      ],
      setupStatus: 'BULLISH ORDER BLOCK READY'
    },
    TREND: {
      badge: 'TREND FOLLOWING',
      badgeColor: 'var(--accent-blue, #3b82f6)',
      studies: ["MAExp@tv-basicstudies", "MACD@tv-basicstudies", "Volume@tv-basicstudies"],
      indicators: [
        '• Exponential Moving Average (EMA Dynamic)',
        '• MACD (12, 26, 9) Momentum Histogram',
        '• Volume Confirmation'
      ],
      setupStatus: 'TREND EXPANSION VERIFIED'
    },
    FLOW: {
      badge: 'BANDAR FLOW',
      badgeColor: 'var(--accent-cyan, #06b6d4)',
      studies: ["VWAP@tv-basicstudies", "RSI@tv-basicstudies", "Volume@tv-basicstudies"],
      indicators: [
        '• Rolling Session VWAP (Modal Bandar)',
        '• Relative Strength Index (RSI 14)',
        '• Volume Accumulation Flow'
      ],
      setupStatus: 'STEALTH ACCUMULATION'
    },
    MEAN: {
      badge: 'MEAN REVERSION',
      badgeColor: 'var(--accent-amber, var(--accent-gold))',
      studies: ["BollingerBands@tv-basicstudies", "RSI@tv-basicstudies"],
      indicators: [
        '• Bollinger Bands (20, 2.0 Deviation)',
        '• RSI 14 Oversold / Overbought',
        '• Mean Rebound ke Middle Band'
      ],
      setupStatus: 'OVERSOLD REBOUND CANDIDATE'
    }
  }), []);

  // Update Pane Symbol
  const updatePaneSymbol = (id, sym, mkt) => {
    setPanes(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        symbol: sym,
        market: mkt,
        timeframe: mkt === 'IDX' ? 'D' : prev[id].timeframe
      }
    }));
  };

  // Update Pane Timeframe
  const updatePaneTimeframe = (id, tf) => {
    setPanes(prev => ({
      ...prev,
      [id]: { ...prev[id], timeframe: tf }
    }));
  };

  const handleSelectTicker = (sym, mkt) => {
    updatePaneSymbol(activePaneId, sym, mkt);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const val = searchInput.trim().toUpperCase();
    if (val) {
      const isCryptoVal = val.includes('USDT') || val.includes('BTC') || val.includes('ETH') || val.includes('SOL');
      updatePaneSymbol(activePaneId, val, isCryptoVal ? 'CRYPTO' : 'IDX');
      setSearchInput('');
    }
  };

  // Active Plan & Telemetry for active pane
  const activePlan = useMemo(() => {
    if (isCrypto) {
      const list = data?.crypto_spot_10 || [];
      return list.find(c => {
        const cSym = (c.symbol || c.pair || '').replace('/', '').toUpperCase();
        return cSym === cleanSym || cleanSym.startsWith(cSym.replace('USDT', ''));
      });
    }
    const plans = data?.daily_trade_plans || [];
    return plans.find(p => (p.symbol || p.clean_ticker) === cleanSym);
  }, [data, cleanSym, isCrypto]);

  const activeBrokerSummary = useMemo(() => {
    if (isCrypto) return null;
    return data?.broker_summary?.[cleanSym] || null;
  }, [data, cleanSym, isCrypto]);

  const currentPrice = useMemo(() => {
    const live = livePrices[cleanSym] || livePrices[`IDX:${cleanSym}`] || livePrices[`${cleanSym}USDT`];
    if (live?.price) return live.price;
    if (activePlan?.current_price) return activePlan.current_price;
    return isCrypto ? 100 : 5000;
  }, [cleanSym, livePrices, activePlan, isCrypto]);

  const entryPrice = activePlan?.entry_price || activePlan?.entry_low || currentPrice;
  const stopLossPrice = activePlan?.stop_loss || (isCrypto ? Number((currentPrice * 0.97).toFixed(4)) : Math.round(currentPrice * 0.96));
  const target1Price = activePlan?.take_profit_1 || activePlan?.target_1 || (isCrypto ? Number((currentPrice * 1.06).toFixed(4)) : Math.round(currentPrice * 1.08));
  const target2Price = activePlan?.take_profit_2 || activePlan?.target_2 || (isCrypto ? Number((currentPrice * 1.12).toFixed(4)) : Math.round(currentPrice * 1.15));

  const formatPriceVal = (val) => {
    const num = Number(val || 0);
    if (isCrypto) return `$${num < 1 ? num.toFixed(6) : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
    return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
  };

  if (deskMode === 'PRO') {
    return (
      <div style={{ height: 'calc(100vh - 120px)', minHeight: '650px', width: '100%' }}>
        <HyperliquidProDesk
          initialSymbol={activePane.symbol || initialSymbol || 'ETHUSDT'}
          livePrices={livePrices}
          onOpenLotCalc={onOpenLotCalc}
          onSwitchToGrid={() => setDeskMode('GRID')}
        />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 120px)',
      background: 'var(--bg-main, #0b0e14)',
      borderRadius: 'var(--radius-md, 10px)',
      border: 'var(--border-hairline)',
      overflow: 'hidden'
    }}>
      {/* 1. TOP CONTROL BAR */}
      <div style={{
        padding: '8px 14px',
        background: 'var(--bg-panel, #121722)',
        borderBottom: 'var(--border-hairline)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        flexShrink: 0
      }}>
        {/* Left: Quick Tickers & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green, #00d084)' }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
              CHART WORKSTATION
            </span>
            <button
              onClick={() => setDeskMode('PRO')}
              style={{
                background: 'linear-gradient(135deg, var(--accent-emerald), #059669)',
                color: '#022c22',
                border: 'none',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 800,
                cursor: 'pointer',
                marginLeft: '6px'
              }}
              title="Beralih ke Hyperliquid Pro Terminal"
            >
              ⚡ Pro Desk
            </button>
          </div>

          {/* Quick Instrument Chips */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-panel-subtle, #18202e)',
            padding: '2px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            gap: '2px'
          }}>
            {[
              { sym: 'BBCA', mkt: 'IDX' },
              { sym: 'BBRI', mkt: 'IDX' },
              { sym: 'BMRI', mkt: 'IDX' },
              { sym: 'BREN', mkt: 'IDX' },
              { sym: 'BTCUSDT', mkt: 'CRYPTO', label: 'BTC' },
              { sym: 'ETHUSDT', mkt: 'CRYPTO', label: 'ETH' },
              { sym: 'SOLUSDT', mkt: 'CRYPTO', label: 'SOL' }
            ].map(item => {
              const isSelected = cleanSym === item.sym;
              return (
                <button
                  key={item.sym}
                  onClick={() => handleSelectTicker(item.sym, item.mkt)}
                  style={{
                    padding: '3px 7px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--accent-blue, #0066cc)' : 'transparent',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {item.label || item.sym}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSearchSubmit} style={{ margin: 0 }}>
            <input
              type="text"
              placeholder="Cari Ticker (cth: TLKM)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                background: 'var(--bg-panel-subtle, #18202e)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--text-primary)',
                padding: '4px 8px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                borderRadius: '4px',
                width: '140px',
                outline: 'none'
              }}
            />
          </form>
        </div>

        {/* Center: Presets & Grid Mode Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Layout Grid Buttons */}
          <div style={{
            display: 'flex',
            background: 'rgba(14, 18, 26, 0.85)',
            padding: '2px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            gap: '2px'
          }}>
            {[
              { mode: '1', label: '⬛ Single (1)' },
              { mode: '2', label: '🪟 2-Split' },
              { mode: '4', label: '⊞ 4-Grid' }
            ].map(l => (
              <button
                key={l.mode}
                onClick={() => {
                  setLayoutMode(l.mode);
                  if (l.mode !== '1') setShowCompanion(false);
                }}
                style={{
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontWeight: 800,
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  background: layoutMode === l.mode ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                  color: layoutMode === l.mode ? 'var(--accent-sky-soft)' : 'var(--text-muted)'
                }}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Strategy Presets */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { id: 'SMC', label: '🏛️ SMC' },
              { id: 'TREND', label: '📈 Trend' },
              { id: 'FLOW', label: '🌊 Flow' },
              { id: 'MEAN', label: '🎯 Mean' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setActivePreset(p.id)}
                style={{
                  padding: '3px 6px',
                  fontSize: '10px',
                  fontWeight: 700,
                  borderRadius: '4px',
                  border: activePreset === p.id ? '1px solid var(--accent-blue)' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: activePreset === p.id ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: activePreset === p.id ? 'var(--accent-sky-soft)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Companion Toggle & Lot Calculator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setShowCompanion(prev => !prev)}
            style={{
              background: showCompanion ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: showCompanion ? 'var(--accent-sky-soft)' : 'var(--text-muted)',
              padding: '3px 8px',
              fontSize: '10px',
              fontWeight: 700,
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📋 Radar Panel
          </button>

          <button
            className="telemetry-btn"
            onClick={() => onOpenLotCalc && onOpenLotCalc(entryPrice, stopLossPrice, isCrypto ? 'CRYPTO' : 'IDX')}
            style={{
              background: 'var(--accent-green, #00d084)',
              color: '#ffffff',
              padding: '3px 9px',
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            💰 Hitung Lot
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: GRID STAGE + COMPANION PANEL */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Chart Stage Grid */}
        <div style={{
          flex: 1,
          height: '100%',
          overflowY: 'auto',
          display: 'grid',
          gap: '4px',
          padding: '4px',
          background: '#07090d',
          gridTemplateColumns: layoutMode === '1' ? '1fr' : 'repeat(auto-fit, minmax(360px, 1fr))',
          gridTemplateRows: layoutMode === '4' ? '1fr 1fr' : '1fr'
        }}>
          {/* Pane 1 */}
          <ChartPane
            paneId={1}
            symbol={panes[1].symbol}
            market={panes[1].market}
            timeframe={panes[1].timeframe}
            preset={activePreset}
            studies={presetConfigs[activePreset].studies}
            onChangeTimeframe={updatePaneTimeframe}
            isActive={activePaneId === 1}
            onActivate={() => setActivePaneId(1)}
            plan={activePaneId === 1 ? activePlan : null}
            currentPrice={activePaneId === 1 ? currentPrice : null}
            onOpenLotCalc={onOpenLotCalc}
            onOpenExecution={onOpenExecution}
          />

          {/* Pane 2 (if 2-Split or 4-Grid) */}
          {(layoutMode === '2' || layoutMode === '4') && (
            <ChartPane
              paneId={2}
              symbol={panes[2].symbol}
              market={panes[2].market}
              timeframe={panes[2].timeframe}
              preset={activePreset}
              studies={presetConfigs[activePreset].studies}
              onChangeTimeframe={updatePaneTimeframe}
              isActive={activePaneId === 2}
              onActivate={() => setActivePaneId(2)}
              plan={activePaneId === 2 ? activePlan : null}
              currentPrice={activePaneId === 2 ? currentPrice : null}
              onOpenLotCalc={onOpenLotCalc}
              onOpenExecution={onOpenExecution}
            />
          )}

          {/* Panes 3 & 4 (if 4-Grid) */}
          {layoutMode === '4' && (
            <>
              <ChartPane
                paneId={3}
                symbol={panes[3].symbol}
                market={panes[3].market}
                timeframe={panes[3].timeframe}
                preset={activePreset}
                studies={presetConfigs[activePreset].studies}
                onChangeTimeframe={updatePaneTimeframe}
                isActive={activePaneId === 3}
                onActivate={() => setActivePaneId(3)}
                plan={activePaneId === 3 ? activePlan : null}
                currentPrice={activePaneId === 3 ? currentPrice : null}
                onOpenLotCalc={onOpenLotCalc}
                onOpenExecution={onOpenExecution}
              />
              <ChartPane
                paneId={4}
                symbol={panes[4].symbol}
                market={panes[4].market}
                timeframe={panes[4].timeframe}
                preset={activePreset}
                studies={presetConfigs[activePreset].studies}
                onChangeTimeframe={updatePaneTimeframe}
                isActive={activePaneId === 4}
                onActivate={() => setActivePaneId(4)}
                plan={activePaneId === 4 ? activePlan : null}
                currentPrice={activePaneId === 4 ? currentPrice : null}
                onOpenLotCalc={onOpenLotCalc}
                onOpenExecution={onOpenExecution}
              />
            </>
          )}
        </div>

        {/* Companion Strategy Telemetry Panel (Collapsible) */}
        {showCompanion && (
          <div style={{
            width: '280px',
            background: 'var(--bg-panel, #121722)',
            borderLeft: 'var(--border-hairline)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflowY: 'auto',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '6px', borderBottom: 'var(--border-hairline)' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  RADAR STRATEGI: {cleanSym}
                </span>
                <span style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  color: presetConfigs[activePreset].badgeColor,
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  border: `1px solid ${presetConfigs[activePreset].badgeColor}`
                }}>
                  {presetConfigs[activePreset].badge}
                </span>
              </div>

              <div style={{
                background: 'var(--bg-panel-subtle, #18202e)',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                  STATUS SINYAL
                </span>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-green, #00d084)', marginTop: '2px' }}>
                  {activePlan?.direction === 'BUY' ? '🔥 BUY SIGNAL CONFIRMED' : presetConfigs[activePreset].setupStatus}
                </div>
              </div>

              {/* JEV-TRADE Inspired Triple-Barrier Execution Contract */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))',
                padding: '9px',
                borderRadius: '6px',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--accent-sky-soft)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    TRIPLE-BARRIER CONTRACT
                  </span>
                  <span style={{ fontSize: '8px', color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.1)', padding: '1px 4px', borderRadius: '3px', fontWeight: 700 }}>
                    ACTIVE
                  </span>
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  López de Prado Triple-Barrier Rule:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--accent-emerald)' }}>▲ Target (+{(((target1Price - entryPrice) / entryPrice) * 100).toFixed(1)}%):</span>
                    <strong>{formatPriceVal(target1Price)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#ef4444' }}>▼ Stop ({(((stopLossPrice - entryPrice) / entryPrice) * 100).toFixed(1)}%):</span>
                    <strong>{formatPriceVal(stopLossPrice)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--accent-gold)' }}>⏱️ Max Horizon:</span>
                    <strong>24 Bars (EOD Exit)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '3px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Execution Route:</span>
                    <span style={{ color: '#93c5fd' }}>TWAP Sliced (0.08% slip)</span>
                  </div>
                </div>
              </div>

              {/* Key Price Levels */}
              <div style={{
                background: 'var(--bg-panel-subtle, #18202e)',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Entry Zone:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{formatPriceVal(entryPrice)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Stop Loss:</span>
                  <strong style={{ color: 'var(--accent-red, #ff4d4d)' }}>{formatPriceVal(stopLossPrice)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Target 1:</span>
                  <strong style={{ color: 'var(--accent-green, #00d084)' }}>{formatPriceVal(target1Price)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Target 2:</span>
                  <strong style={{ color: 'var(--accent-green, #00d084)' }}>{formatPriceVal(target2Price)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>R:R Rasio:</span>
                  <strong style={{ color: 'var(--accent-orange, var(--accent-gold))' }}>
                    1 : {activePlan?.risk_reward_ratio ? Number(activePlan.risk_reward_ratio).toFixed(1) : '—'}
                  </strong>
                </div>
              </div>

              {/* Bandarmology or Crypto Radar */}
              {!isCrypto && activeBrokerSummary && (
                <div style={{
                  background: 'var(--bg-panel-subtle, #18202e)',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                    RADAR BANDARMOLOGI
                  </span>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#00d084', marginTop: '2px' }}>
                    {activeBrokerSummary.bandar_accumulation_grade?.replace('_', ' ')}
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Modal Bandar: <strong style={{ color: 'var(--accent-orange)' }}>Rp {activeBrokerSummary.bandar_avg_price?.toLocaleString()}</strong>
                  </div>
                </div>
              )}
            </div>

            <div style={{ paddingTop: '8px', borderTop: 'var(--border-hairline)' }}>
              <button
                onClick={() => onOpenLotCalc && onOpenLotCalc(entryPrice, stopLossPrice, isCrypto ? 'CRYPTO' : 'IDX')}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  background: 'var(--accent-green, #00d084)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                💰 {isCrypto ? 'Kalkulator Sizing USDT' : 'Kalkulator Lot BEI'}
              </button>

              <button
                id="btn-open-prediction-charting"
                onClick={() => onOpenPrediction && onOpenPrediction({
                  symbol: activePane.symbol,
                  market: activePane.market,
                  price: entryPrice || (isCrypto ? 65000 : 9000),
                })}
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '7px 10px',
                  background: 'var(--accent-gold, #facc15)',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                🎯 Tebak Chart & Poin Legend
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
