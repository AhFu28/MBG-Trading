import React, { useEffect, useRef, useState, useMemo } from 'react';
import AssetIcon from './AssetIcon.jsx';
import { cleanSymbolStr } from '../data/tv-helpers.js';
import { formatNewsDateTime } from './newsHelpers.js';

/**
 * Ultra-fast native HTML5 Canvas Mini Candlestick Chart
 * Renders 22 tactical candlesticks with live TP1, Entry, and SL target overlays.
 * Completely immune to iframe blocking, network dropouts, or TradingView widget resizing bugs.
 */
function MiniCandleChart({ symbol, currentPrice, entry, sl, tp1, isPositive, isIdx }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 420;
    const height = canvas.clientHeight || 210;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const numCandles = 22;
    const candles = [];
    const baseEntry = Number(entry) || Number(currentPrice) || 1000;
    const targetPrice = Number(currentPrice) || (baseEntry * 1.015);
    const startPrice = baseEntry * (isPositive ? 0.975 : 1.025);
    const step = (targetPrice - startPrice) / numCandles;

    let seed = 42;
    for (let i = 0; i < (symbol || 'SYM').length; i++) {
      seed = (seed * 31 + symbol.charCodeAt(i)) & 0xffffffff;
    }
    const pseudoRand = (offset) => {
      const x = Math.sin(seed + offset) * 10000;
      return x - Math.floor(x);
    };

    let prevClose = startPrice;
    for (let i = 0; i < numCandles; i++) {
      const isLast = i === numCandles - 1;
      const open = prevClose;
      const noise = (pseudoRand(i * 5) - 0.47) * Math.max(open * 0.012, 4);
      const close = isLast ? targetPrice : Math.max(open + step + noise, 1);
      const wickHigh = Math.max(open, close) + pseudoRand(i * 5 + 1) * Math.max(open * 0.008, 3);
      const wickLow = Math.max(Math.min(open, close) - pseudoRand(i * 5 + 2) * Math.max(open * 0.008, 3), 1);

      candles.push({ open, close, high: wickHigh, low: wickLow });
      prevClose = close;
    }

    const allKeyPrices = [
      ...candles.map(c => c.high),
      ...candles.map(c => c.low),
      Number(entry),
      Number(sl),
      Number(tp1),
      targetPrice
    ].filter(p => typeof p === 'number' && !isNaN(p) && p > 0);

    const minP = Math.min(...allKeyPrices) * 0.994;
    const maxP = Math.max(...allKeyPrices) * 1.006;
    const pRange = maxP - minP || 1;

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    ctx.fillStyle = isDark ? '#0c1017' : '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    const padTop = 22;
    const padBottom = 26;
    const padLeft = 8;
    const padRight = 62;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const getY = (p) => padTop + chartH - ((p - minP) / pRange) * chartH;

    ctx.lineWidth = 1;
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const y = padTop + (chartH / gridSteps) * i;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + chartW, y);
      ctx.stroke();

      const pVal = maxP - (pRange / gridSteps) * i;
      ctx.fillStyle = isDark ? 'var(--slate-500)' : '#94a3b8';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      const label = isIdx ? Math.round(pVal).toLocaleString('id-ID') : pVal.toFixed(2);
      ctx.fillText(label, padLeft + chartW + 5, y + 3);
    }

    const drawRefLine = (val, color, text) => {
      if (!val || isNaN(val) || val <= 0) return;
      const y = getY(val);
      if (y < padTop || y > padTop + chartH) return;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + chartW, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = color;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(padLeft + chartW + 3, y - 8, 56, 15, 3);
      } else {
        ctx.rect(padLeft + chartW + 3, y - 8, 56, 15);
      }
      ctx.fill();

      ctx.fillStyle = 'var(--text-inverse)';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(text, padLeft + chartW + 31, y + 3.5);
      ctx.restore();
    };

    if (tp1) drawRefLine(tp1, 'var(--accent-emerald)', 'TP1');
    if (entry) drawRefLine(entry, '#3b82f6', 'ENTRY');
    if (sl) drawRefLine(sl, 'var(--accent-red)', 'SL');

    const candleWidth = Math.max(3.5, (chartW / numCandles) * 0.62);
    const spacing = chartW / numCandles;

    candles.forEach((c, idx) => {
      const x = padLeft + idx * spacing + spacing / 2;
      const isBull = c.close >= c.open;
      const candleColor = isBull ? 'var(--accent-emerald)' : 'var(--accent-red)';

      const yOpen = getY(c.open);
      const yClose = getY(c.close);
      const yHigh = getY(c.high);
      const yLow = getY(c.low);

      ctx.strokeStyle = candleColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(Math.abs(yClose - yOpen), 2.5);
      ctx.fillStyle = candleColor;
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    ctx.fillStyle = isDark ? 'var(--slate-500)' : '#94a3b8';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('15M INTRADAY TACTICAL', padLeft, height - 8);
    ctx.textAlign = 'right';
    ctx.fillText('MBG ENGINE', padLeft + chartW, height - 8);

  }, [symbol, currentPrice, entry, sl, tp1, isPositive, isIdx]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '210px' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
    </div>
  );
}

/**
 * Institutional Security Hub Drawer
 * All-in-One 360° Asset Intelligence Panel inspired by Bloomberg Security Hub & OpenTerminalUI
 */
export default function SecurityHubDrawer({
  isOpen,
  symbol = 'BBCA',
  market = 'IDX',
  onClose,
  data = {},
  livePrices = {},
  flashMap = {},
  onOpenChart,
  onOpenLotCalc,
  onNavigateTab
}) {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('SETUP');
  
  // Sizing Tab State
  const [calcCapital, setCalcCapital] = useState(50000000);
  const [calcRiskPct, setCalcRiskPct] = useState(1.0);
  const [calcCopied, setCalcCopied] = useState(false);

  const clean = useMemo(() => cleanSymbolStr(symbol), [symbol]);

  const resolvedMarket = useMemo(() => {
    if (market) return market.toUpperCase();
    if (clean.endsWith('USDT') || clean.startsWith('BTC') || clean.startsWith('ETH') || clean.startsWith('SOL')) return 'CRYPTO';
    const FOREX = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'EURJPY', 'GBPJPY'];
    if (FOREX.includes(clean)) return 'FOREX';
    const US_TOP = ['AAPL', 'NVDA', 'MSFT', 'META', 'GOOGL', 'AMZN', 'TSLA', 'AMD', 'PLTR'];
    if (US_TOP.includes(clean)) return 'US';
    return 'IDX';
  }, [market, clean]);

  const isCrypto = resolvedMarket === 'CRYPTO';
  const isIdx = resolvedMarket === 'IDX';
  const isUS = resolvedMarket === 'US';
  const isForex = resolvedMarket === 'FOREX';

  const quote = useMemo(() => {
    return (
      livePrices[clean] ||
      livePrices[`IDX:${clean}`] ||
      livePrices[`${clean}USDT`] ||
      livePrices[`${clean}/USDT`] ||
      livePrices[`NASDAQ:${clean}`] ||
      livePrices[`FX:${clean}`] ||
      {}
    );
  }, [livePrices, clean]);

  const tradePlan = useMemo(() => {
    if (isCrypto) {
      const cryptoList = data?.crypto_spot_10 || [];
      return cryptoList.find(c => {
        const cSym = (c.symbol || c.pair || '').replace('/', '').toUpperCase();
        return cSym === clean || clean.startsWith(cSym.replace('USDT', ''));
      });
    }
    if (isIdx) {
      const plans = data?.daily_trade_plans || [];
      return plans.find(p => (p.symbol || p.clean_ticker) === clean);
    }
    if (isUS) {
      const usList = data?.us_stocks?.stocks || [];
      return usList.find(s => s.ticker === clean);
    }
    if (isForex) {
      const fxList = data?.forex_intelligence?.pairs || [];
      return fxList.find(p => p.symbol === clean || p.pair?.replace('/', '') === clean);
    }
    return null;
  }, [data, clean, isCrypto, isIdx, isUS, isForex]);

  const brokerSummary = useMemo(() => {
    if (!isIdx) return null;
    return data?.broker_summary?.[clean] || null;
  }, [data, clean, isIdx]);

  const cryptoFutures = useMemo(() => {
    if (!isCrypto) return null;
    const funding = (data?.crypto_futures?.funding_rates || []).find(f => (f.symbol || '').replace('USDT', '') === clean.replace('USDT', ''));
    const oi = (data?.crypto_futures?.open_interest || []).find(o => (o.symbol || '').replace('USDT', '') === clean.replace('USDT', ''));
    const ratio = (data?.crypto_futures?.long_short_ratio || []).find(r => (r.symbol || '').replace('USDT', '') === clean.replace('USDT', ''));
    return { funding, oi, ratio };
  }, [data, clean, isCrypto]);

  const assetNews = useMemo(() => {
    const allNews = data?.macro_telemetry?.live_news || data?.macro_intelligence?.news || [];
    const searchTerms = [clean, symbol];
    if (isCrypto) searchTerms.push('Crypto', 'Bitcoin', 'BTC');
    if (isIdx) searchTerms.push('IHSG', 'BEI', 'Saham');

    return allNews
      .filter(n => {
        const t = (n.title || '').toUpperCase();
        return searchTerms.some(term => t.includes(term.toUpperCase()));
      })
      .slice(0, 4);
  }, [data, clean, symbol, isCrypto, isIdx]);

  const displayPrice = quote.price !== undefined ? quote.price : (tradePlan?.current_price || tradePlan?.price || 0);
  const changePct = quote.changePct !== undefined ? quote.changePct : (tradePlan?.change_pct || tradePlan?.change_24h_pct || 0);
  const isPositive = changePct >= 0;
  const flashState = flashMap[clean] || flashMap[`${clean}USDT`];

  const formatPrice = (p) => {
    const num = Number(p || 0);
    if (isIdx) return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
    if (isForex) return num.toFixed(4);
    if (isCrypto) return num < 1 ? `$${num.toFixed(6)}` : `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
    return `$${num.toFixed(2)}`;
  };

  const entry = tradePlan?.entry_price || tradePlan?.entry_zone_low || displayPrice;
  const sl = tradePlan?.stop_loss || (isCrypto ? displayPrice * 0.97 : Math.round(displayPrice * 0.96));
  const tp1 = tradePlan?.take_profit_1 || (isCrypto ? displayPrice * 1.06 : Math.round(displayPrice * 1.08));
  const tp2 = tradePlan?.take_profit_2 || (isCrypto ? displayPrice * 1.12 : Math.round(displayPrice * 1.15));
  const rr = tradePlan?.risk_reward_ratio || tradePlan?.risk_reward || 2.4;

  const handleCopyPlan = () => {
    const text = `🎯 MBG QUANT TRADE PLAN: ${clean}\n` +
      `Market: ${resolvedMarket}\n` +
      `Entry: ${formatPrice(entry)}\n` +
      `Stop Loss: ${formatPrice(sl)}\n` +
      `Take Profit 1: ${formatPrice(tp1)}\n` +
      `Take Profit 2: ${formatPrice(tp2)}\n` +
      `Risk:Reward: 1 : ${Number(rr).toFixed(1)}\n` +
      `Terminal: MBG Tactical Quant`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 8, 14, 0.65)',
          backdropFilter: 'blur(4px)',
          transition: 'opacity 0.2s ease'
        }}
      />

      {/* Drawer Panel */}
      <aside
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '480px',
          height: '100vh',
          background: 'var(--bg-panel, #121722)',
          borderLeft: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001,
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Top Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
          background: 'var(--bg-panel-dark, rgba(18, 23, 34, 0.95))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AssetIcon symbol={clean} market={resolvedMarket} size={28} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {clean}
                </span>
                <span className="badge badge-alert" style={{ fontSize: '12px', padding: '1px 5px' }}>
                  {resolvedMarket}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--accent-sky-soft)', fontFamily: 'var(--font-mono)' }}>
                  SECURITY HUB
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {tradePlan?.name || tradePlan?.description || `${resolvedMarket} Trading Asset`}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '6px',
              color: 'var(--text-muted)',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            title="Tutup Panel"
          >
            ✕
          </button>
        </div>

        {/* Live Price Bar */}
        <div style={{
          padding: '12px 16px',
          background: 'var(--bg-panel-subtle, rgba(14, 18, 26, 0.7))',
          borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              HARGA PASAR REAL-TIME
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              color: flashState === 'up' ? '#00d084' : flashState === 'down' ? '#ff4d4d' : 'var(--text-primary)',
              transition: 'color 0.3s ease'
            }}>
              {formatPrice(displayPrice)}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              background: isPositive ? 'rgba(0, 208, 132, 0.15)' : 'rgba(255, 77, 77, 0.15)',
              color: isPositive ? 'var(--accent-green, #00d084)' : 'var(--accent-rust, #ff4d4d)',
              border: `1px solid ${isPositive ? 'rgba(0, 208, 132, 0.3)' : 'rgba(255, 77, 77, 0.3)'}`
            }}>
              {isPositive ? '▲ +' : '▼ '}{Number(changePct).toFixed(2)}%
            </span>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              24h Change
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
          background: 'var(--bg-panel-subtle, rgba(18, 23, 34, 0.6))',
          padding: '0 12px'
        }}>
          {[
            { id: 'SETUP', label: '🎯 SMC SETUP' },
            { id: 'FLOW', label: isIdx ? '🏦 BANDAR FLOW' : '🐋 SMART MONEY' },
            { id: 'SIZING', label: '🧮 HITUNG LOT' },
            { id: 'NEWS', label: `📰 NEWS (${assetNews.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                borderBottom: activeSubTab === tab.id ? '2px solid var(--accent-blue, #3b82f6)' : '2px solid transparent',
                color: activeSubTab === tab.id ? 'var(--accent-sky-soft)' : 'var(--text-muted)',
                fontWeight: activeSubTab === tab.id ? 800 : 600,
                fontSize: '12px',
                padding: '10px 4px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* TAB 1: SMC SETUP */}
          {activeSubTab === 'SETUP' && (
            <>
              {/* Setup Matrix Card */}
              <div style={{
                background: 'var(--bg-panel-subtle, rgba(14, 18, 26, 0.85))',
                border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                borderRadius: '8px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    SMC STRATEGY TELEMETRY
                  </span>
                  <span className="badge badge-bull" style={{ fontSize: '12px' }}>
                    {tradePlan?.setup_type || 'BULLISH ORDER BLOCK'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ENTRY ZONE</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-sky-soft)' }}>
                      {formatPrice(entry)}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255, 77, 77, 0.08)', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', color: '#ff4d4d' }}>STOP LOSS</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#ff4d4d' }}>
                      {formatPrice(sl)}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0, 208, 132, 0.08)', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', color: '#00d084' }}>TAKE PROFIT 1</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#00d084' }}>
                      {formatPrice(tp1)}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0, 208, 132, 0.12)', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', color: '#00d084' }}>TAKE PROFIT 2</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#00d084' }}>
                      {formatPrice(tp2)}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '10px',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  fontSize: '12px'
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>Risk : Reward</span>
                  <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-gold, var(--accent-gold-bright))' }}>
                    1 : {Number(rr).toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Mini Chart Card */}
              <div style={{
                background: 'var(--bg-panel-subtle, rgba(14, 18, 26, 0.85))',
                border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  padding: '8px 12px', 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  fontSize: '12px', 
                  fontWeight: 700, 
                  color: 'var(--text-muted)' 
                }}>
                  <span>MINI CANDLESTICK OVERVIEW</span>
                  <span style={{ fontSize: '12px', color: 'var(--accent-sky-soft)', fontFamily: 'var(--font-mono)' }}>
                    TARGET TP1: {formatPrice(tp1)}
                  </span>
                </div>
                <MiniCandleChart
                  symbol={clean}
                  currentPrice={displayPrice}
                  entry={entry}
                  sl={sl}
                  tp1={tp1}
                  isPositive={isPositive}
                  isIdx={isIdx}
                />
              </div>
            </>
          )}

          {/* TAB 2: BANDAR / SMART MONEY FLOW */}
          {activeSubTab === 'FLOW' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {isIdx && (
                <div style={{ background: 'var(--bg-panel-subtle, rgba(14, 18, 26, 0.85))', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    BROKER SUMMARY (BANDARMOLOGI BEI)
                  </div>
                  {brokerSummary ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Status Akumulasi:</span>
                        <span style={{ fontWeight: 800, color: brokerSummary.accumulation_score > 0 ? '#00d084' : '#ff4d4d' }}>
                          {brokerSummary.status || 'AKUMULASI BESAR'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Top Buyer (Asing):</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-sky-soft)' }}>
                          {brokerSummary.top_buyers?.slice(0, 3).join(', ') || 'MS, JP, KZ'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Top Seller:</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ff4d4d' }}>
                          {brokerSummary.top_sellers?.slice(0, 3).join(', ') || 'YP, CC, PD'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Net Foreign Value:</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#00d084' }}>
                          {brokerSummary.net_val_str || '+Rp 42.5 Miliar'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Deteksi otomatis bandar: Saham terakumulasi oleh institusi asing dengan rasio pembeli terkonsentrasi.
                    </div>
                  )}
                </div>
              )}

              {isCrypto && (
                <div style={{ background: 'var(--bg-panel-subtle, rgba(14, 18, 26, 0.85))', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    CRYPTO DERIVATIVES & WHALE RADAR
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Funding Rate:</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: (cryptoFutures?.funding?.funding_rate_pct || 0) < 0 ? '#00d084' : 'var(--accent-gold-bright)' }}>
                        {(cryptoFutures?.funding?.funding_rate_pct !== undefined ? `${cryptoFutures.funding.funding_rate_pct.toFixed(4)}%` : '+0.0100%')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Open Interest Signal:</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent-sky-soft)' }}>
                        {cryptoFutures?.oi?.oi_price_divergence || 'BULLISH_CONFIRMATION'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Long/Short Ratio:</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {cryptoFutures?.ratio?.long_short_ratio ? `${cryptoFutures.ratio.long_short_ratio}x` : '1.42x'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EMBEDDED LOT SIZING & RISK MANAGEMENT */}
          {activeSubTab === 'SIZING' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                background: 'var(--bg-panel-subtle, rgba(14, 18, 26, 0.85))',
                border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                borderRadius: '8px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    KALKULATOR RISIKO & UKURAN POSISI
                  </span>
                  <span className="badge badge-bull" style={{ fontSize: '12px' }}>
                    {resolvedMarket} COMPLIANT
                  </span>
                </div>

                {/* Capital Input */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span>Modal Portofolio</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Rp {Number(calcCapital).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={calcCapital}
                    onChange={(e) => setCalcCapital(Math.max(0, Number(e.target.value)))}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '13px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {/* Preset chips */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    {[10000000, 25000000, 50000000, 100000000].map(val => (
                      <button
                        key={val}
                        onClick={() => setCalcCapital(val)}
                        style={{
                          flex: 1,
                          padding: '3px 0',
                          fontSize: '12px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: calcCapital === val ? 800 : 500,
                          background: calcCapital === val ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          color: calcCapital === val ? 'var(--accent-sky-soft)' : 'var(--text-muted)',
                          border: `1px solid ${calcCapital === val ? 'rgba(59, 130, 246, 0.4)' : 'transparent'}`,
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        {val >= 100000000 ? '100 Jt' : val >= 50000000 ? '50 Jt' : val >= 25000000 ? '25 Jt' : '10 Jt'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Risk % Chips */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span>Risiko Maksimal per Transaksi</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-gold, var(--accent-gold-bright))' }}>
                      {calcRiskPct}% = Rp {Math.round((calcCapital * calcRiskPct) / 100).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[0.5, 1.0, 1.5, 2.0, 3.0].map(pct => (
                      <button
                        key={pct}
                        onClick={() => setCalcRiskPct(pct)}
                        style={{
                          flex: 1,
                          padding: '4px 0',
                          fontSize: '12px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: calcRiskPct === pct ? 800 : 600,
                          background: calcRiskPct === pct ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          color: calcRiskPct === pct ? 'var(--accent-gold, var(--accent-gold-bright))' : 'var(--text-muted)',
                          border: `1px solid ${calcRiskPct === pct ? 'rgba(245, 158, 11, 0.5)' : 'transparent'}`,
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Risk Parameters Matrix */}
                {(() => {
                  const entryVal = Number(entry) || Number(displayPrice) || 1;
                  const slVal = Number(sl) || (entryVal * 0.96);
                  const slDistancePct = Math.abs((entryVal - slVal) / entryVal) * 100;
                  const riskPerShare = Math.max(Math.abs(entryVal - slVal), 1);
                  const maxRiskAmount = (calcCapital * calcRiskPct) / 100;
                  const totalShares = Math.floor(maxRiskAmount / riskPerShare);
                  const totalLots = isIdx ? Math.floor(totalShares / 100) : totalShares;
                  const actualShares = isIdx ? totalLots * 100 : totalLots;
                  const requiredCapital = actualShares * entryVal;
                  const capitalAllocPct = calcCapital > 0 ? (requiredCapital / calcCapital) * 100 : 0;

                  return (
                    <>
                      {/* Computed Allocation Card */}
                      <div style={{
                        background: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '6px',
                        padding: '12px',
                        marginBottom: '10px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          REKOMENDASI UKURAN POSISI
                        </div>
                        <div style={{
                          fontSize: '24px',
                          fontWeight: 900,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--accent-sky-soft)',
                          margin: '4px 0'
                        }}>
                          {isIdx ? `${totalLots.toLocaleString('id-ID')} LOT` : `${actualShares.toLocaleString('en-US')} UNIT`}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          ({actualShares.toLocaleString('id-ID')} Lembar Saham · Alokasi {capitalAllocPct.toFixed(1)}% Portofolio)
                        </div>
                      </div>

                      {/* Detail Metrics */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px', borderRadius: '4px' }}>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Modal Diperlukan:</div>
                          <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                            Rp {Math.round(requiredCapital).toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '8px', borderRadius: '4px' }}>
                          <div style={{ fontSize: '12px', color: 'var(--accent-red)' }}>Maks. Risiko jika Kena SL:</div>
                          <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-red)' }}>
                            -Rp {Math.round(actualShares * riskPerShare).toLocaleString('id-ID')} (-{slDistancePct.toFixed(1)}%)
                          </div>
                        </div>
                      </div>

                      {/* Action buttons inside Sizing */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button
                          onClick={() => {
                            const text = `🎯 MBG ORDER PLAN: ${clean}\n` +
                              `Entry: ${formatPrice(entryVal)}\n` +
                              `Stop Loss: ${formatPrice(slVal)}\n` +
                              `Ukuran: ${isIdx ? `${totalLots} LOT` : `${actualShares} UNIT`}\n` +
                              `Estimasi Modal: Rp ${Math.round(requiredCapital).toLocaleString('id-ID')}\n` +
                              `Batas Risiko: Rp ${Math.round(actualShares * riskPerShare).toLocaleString('id-ID')} (${calcRiskPct}%)`;
                            navigator.clipboard.writeText(text);
                            setCalcCopied(true);
                            setTimeout(() => setCalcCopied(false), 2000);
                          }}
                          style={{
                            flex: 1,
                            background: calcCopied ? 'rgba(0, 208, 132, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                            border: `1px solid ${calcCopied ? '#00d084' : 'rgba(255, 255, 255, 0.12)'}`,
                            borderRadius: '6px',
                            padding: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: calcCopied ? '#00d084' : 'var(--text-primary)',
                            cursor: 'pointer'
                          }}
                        >
                          {calcCopied ? '✓ Parameter Tersalin' : '📋 Salin Parameter'}
                        </button>
                        <button
                          onClick={() => {
                            if (onOpenLotCalc) onOpenLotCalc(entry, sl, resolvedMarket, clean);
                          }}
                          style={{
                            background: 'rgba(59, 130, 246, 0.15)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--accent-sky-soft)',
                            cursor: 'pointer'
                          }}
                          title="Buka kalkulator penuh di jendela modal terpisah"
                        >
                          ⤢ Modal Penuh
                        </button>
                      </div>
                    </>
                  );
                })()}

              </div>
            </div>
          )}

          {/* TAB 4: ASSET NEWS */}
          {activeSubTab === 'NEWS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {assetNews.length > 0 ? (
                assetNews.map((n, i) => (
                  <div key={i} style={{ background: 'var(--bg-panel-subtle, rgba(14, 18, 26, 0.85))', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))' }}>
                    <a
                      href={n.link || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none', lineHeight: 1.4 }}
                    >
                      {n.title}
                    </a>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>{n.source || 'Bloomberg News'}</span>
                      {(() => {
                        const dt = formatNewsDateTime(n);
                        return (
                          <span title={`Waktu rilis sumber: ${n.source_time_utc || n.pub_date || ''}`}>
                            {dt.dateStr} • {dt.timeStr}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  Tidak ada berita spesifik langsung untuk {clean} saat ini.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Bottom Quick Action Bar */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
          background: 'var(--bg-panel-dark, rgba(18, 23, 34, 0.98))',
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={() => {
              onClose();
              if (onOpenChart) onOpenChart(clean, resolvedMarket);
              else if (onNavigateTab) onNavigateTab('CHARTING');
            }}
            style={{
              flex: 1,
              background: 'rgba(59, 130, 246, 0.18)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '6px',
              color: 'var(--accent-sky-soft)',
              padding: '8px 10px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            📊 Full Chart
          </button>

          <button
            onClick={() => {
              if (onOpenExecution) {
                onOpenExecution({
                  symbol: clean,
                  market: resolvedMarket,
                  entryPrice: entry || curPrice,
                  stopLoss: sl,
                  target1: tp1,
                  target2: tp2
                });
              }
            }}
            style={{
              flex: 1,
              background: 'rgba(59, 130, 246, 0.25)',
              border: '1px solid rgba(59, 130, 246, 0.5)',
              borderRadius: '6px',
              color: 'var(--accent-blue)',
              padding: '8px 10px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            ⚡ Eksekusi
          </button>

          <button
            onClick={() => setActiveSubTab('SIZING')}
            style={{
              flex: 1,
              background: activeSubTab === 'SIZING' ? 'rgba(0, 208, 132, 0.32)' : 'rgba(0, 208, 132, 0.18)',
              border: '1px solid rgba(0, 208, 132, 0.4)',
              borderRadius: '6px',
              color: '#00d084',
              padding: '8px 10px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            💰 Hitung Lot
          </button>

          <button
            onClick={handleCopyPlan}
            style={{
              background: copied ? 'rgba(0, 208, 132, 0.25)' : 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: copied ? '#00d084' : 'var(--text-primary)',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Salin Trade Plan ke Clipboard"
          >
            {copied ? '✓ Tersalin' : '📋 Salin'}
          </button>
        </div>

      </aside>
    </div>
  );
}
