import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { institutionalPaperBroker } from '../services/brokerGateway.js';
import { getTvSymbol, cleanSymbolStr } from '../data/tv-helpers.js';

const POPULAR_INSTRUMENTS = [
  { symbol: 'BTCUSDT', coin: 'BTC', name: 'Bitcoin', market: 'CRYPTO' },
  { symbol: 'ETHUSDT', coin: 'ETH', name: 'Ethereum', market: 'CRYPTO' },
  { symbol: 'SOLUSDT', coin: 'SOL', name: 'Solana', market: 'CRYPTO' },
  { symbol: 'HYPEUSDC', coin: 'HYPE', name: 'Hyperliquid', market: 'CRYPTO' },
  { symbol: 'SUIUSDT', coin: 'SUI', name: 'Sui Network', market: 'CRYPTO' },
  { symbol: 'DOGEUSDT', coin: 'DOGE', name: 'Dogecoin', market: 'CRYPTO' },
  { symbol: 'AVAXUSDT', coin: 'AVAX', name: 'Avalanche', market: 'CRYPTO' },
  { symbol: 'LINKUSDT', coin: 'LINK', name: 'Chainlink', market: 'CRYPTO' },
  { symbol: 'BBCA', coin: 'BBCA', name: 'Bank Central Asia', market: 'IDX' },
  { symbol: 'BBRI', coin: 'BBRI', name: 'Bank Rakyat Indonesia', market: 'IDX' },
  { symbol: 'NVDA', coin: 'NVDA', name: 'Nvidia Corp', market: 'US' },
  { symbol: 'AAPL', coin: 'AAPL', name: 'Apple Inc', market: 'US' }
];

export default function HyperliquidProDesk({
  initialSymbol = 'ETHUSDT',
  livePrices = {},
  onOpenLotCalc,
  onSwitchToGrid,
  onClose
}) {
  const [selectedPair, setSelectedPair] = useState(initialSymbol || 'ETHUSDT');
  const [timeframe, setTimeframe] = useState('60'); // '5', '15', '60', '240', 'D'
  const [chartSubTab, setChartSubTab] = useState('chart'); // 'chart' | 'funding'
  const [leverage, setLeverage] = useState(10);
  const [marginMode, setMarginMode] = useState('Cross'); // 'Cross' | 'Isolated'
  const [orderType, setOrderType] = useState('Market'); // 'Market' | 'Limit' | 'Stop'
  const [orderSide, setOrderSide] = useState('BUY'); // 'BUY' (Long) | 'SELL' (Short)
  const [orderSize, setOrderSize] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [sizePercent, setSizePercent] = useState(0);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [useBracket, setUseBracket] = useState(false);
  const [takeProfitPrice, setTakeProfitPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [ledgerTab, setLedgerTab] = useState('positions'); // 'positions' | 'orders' | 'history' | 'balances'
  const [showLedger, setShowLedger] = useState(true);
  const [actionNotice, setActionNotice] = useState(null);

  // Live Hyperliquid L2 Order Book state
  const [l2Depth, setL2Depth] = useState(null);
  const [bookTickSize, setBookTickSize] = useState('0.1');

  // Paper Broker balance & positions state
  const [brokerPortfolio, setBrokerPortfolio] = useState(() => institutionalPaperBroker.getSummary());

  const chartContainerRef = useRef(null);

  const cleanSym = useMemo(() => cleanSymbolStr(selectedPair), [selectedPair]);
  const activeInstrument = useMemo(() => {
    return POPULAR_INSTRUMENTS.find(i => i.symbol === selectedPair) || {
      symbol: selectedPair,
      coin: cleanSym.replace('USDT', '').replace('USDC', ''),
      name: selectedPair,
      market: selectedPair.includes('USDT') || selectedPair.includes('USDC') ? 'CRYPTO' : 'IDX'
    };
  }, [selectedPair, cleanSym]);

  const isCrypto = activeInstrument.market === 'CRYPTO';
  const baseCoin = activeInstrument.coin || cleanSym.replace('USDT', '');

  // Live mark price
  const markPrice = useMemo(() => {
    const live = livePrices[selectedPair] || livePrices[`${baseCoin}/USDT`] || livePrices[baseCoin];
    if (live?.price && live.price > 0) return live.price;
    if (l2Depth?.bids?.[0]?.px) return parseFloat(l2Depth.bids[0].px);
    if (baseCoin === 'BTC') return 83050;
    if (baseCoin === 'ETH') return 2562.5;
    if (baseCoin === 'SOL') return 184.2;
    if (baseCoin === 'HYPE') return 88.52;
    return 100;
  }, [livePrices, selectedPair, baseCoin, l2Depth]);

  const oraclePrice = useMemo(() => {
    return Number((markPrice * 1.00015).toFixed(4));
  }, [markPrice]);

  const change24hPct = useMemo(() => {
    const live = livePrices[selectedPair] || livePrices[`${baseCoin}/USDT`];
    return live?.changePct !== undefined ? live.changePct : -2.45;
  }, [livePrices, selectedPair, baseCoin]);

  // Sync Broker Portfolio periodically
  const refreshBroker = useCallback(() => {
    setBrokerPortfolio(institutionalPaperBroker.getSummary());
  }, []);

  // Fetch Live Hyperliquid L2 Orderbook
  const fetchL2Book = useCallback(async () => {
    if (!isCrypto) return;
    try {
      const res = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'l2Book', coin: baseCoin }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.levels && data.levels.length >= 2) {
        setL2Depth({
          bids: (data.levels[0] || []).slice(0, 10),
          asks: (data.levels[1] || []).slice(0, 10),
          time: data.time || Date.now()
        });
      }
    } catch (e) {
      // ignore
    }
  }, [isCrypto, baseCoin]);

  useEffect(() => {
    fetchL2Book();
    const interval = setInterval(fetchL2Book, 1500);
    return () => clearInterval(interval);
  }, [fetchL2Book]);

  // TradingView Interactive Chart Embed
  useEffect(() => {
    if (!chartContainerRef.current) return;
    chartContainerRef.current.innerHTML = '';

    const tvSymbol = getTvSymbol(selectedPair, activeInstrument.market);
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
      allow_symbol_change: false,
      save_image: true,
      backgroundColor: '#0a0d14',
      gridColor: 'rgba(255, 255, 255, 0.04)',
      studies: ["MASimple@tv-basicstudies", "Volume@tv-basicstudies"],
      support_host: 'https://www.tradingview.com'
    });

    const widgetWrapper = document.createElement('div');
    widgetWrapper.className = 'tradingview-widget-container__widget';
    widgetWrapper.style.width = '100%';
    widgetWrapper.style.height = '100%';

    chartContainerRef.current.appendChild(widgetWrapper);
    chartContainerRef.current.appendChild(script);

    return () => {
      if (chartContainerRef.current) chartContainerRef.current.innerHTML = '';
    };
  }, [selectedPair, activeInstrument.market, timeframe]);

  // Process Orderbook Data for Vertical Display
  const { processedAsks, processedBids, spreadVal, spreadPct, maxDepthCum } = useMemo(() => {
    if (!l2Depth || !l2Depth.bids || !l2Depth.asks) {
      // No live book yet: synthesize a symmetric ladder around the mark price so
      // the column has a shape while the WebSocket connects.
      //
      // These levels MUST be numbers, not strings. The live branch below parses
      // px/sz with parseFloat, and the render calls `.toFixed()` on them — a
      // string here crashed the whole desk with "ask.px.toFixed is not a
      // function" the moment the component rendered without a live book.
      const p = Number(markPrice) || 0;
      const tick = p > 1000 ? 1 : 0.01;
      const b = [];
      const a = [];
      let cumB = 0;
      let cumA = 0;
      for (let i = 0; i < 7; i++) {
        const szB = 1.5 + i * 0.8;
        const szA = 1.2 + i * 0.9;
        cumB += szB;
        cumA += szA;
        b.push({ px: p - (i + 1) * tick, sz: szB, cum: cumB });
        a.push({ px: p + (i + 1) * tick, sz: szA, cum: cumA });
      }
      return {
        processedAsks: a.reverse(),
        processedBids: b,
        spreadVal: (tick * 2).toFixed(2),
        spreadPct: '0.02%',
        maxDepthCum: Math.max(cumA, cumB, 1),
      };
    }

    const rawAsks = (l2Depth.asks || []).slice(0, 8);
    const rawBids = (l2Depth.bids || []).slice(0, 8);

    // Hyperliquid returns px/sz as STRINGS. parseFloat them, and drop any level
    // that fails to parse rather than letting NaN reach `.toFixed()`.
    let cumAsk = 0;
    const asksWithCum = rawAsks
      .map(lvl => {
        const px = parseFloat(lvl.px);
        const sz = parseFloat(lvl.sz) || 0;
        if (!Number.isFinite(px)) return null;
        cumAsk += sz;
        return { px, sz, cum: cumAsk, n: lvl.n };
      })
      .filter(Boolean);

    let cumBid = 0;
    const bidsWithCum = rawBids
      .map(lvl => {
        const px = parseFloat(lvl.px);
        const sz = parseFloat(lvl.sz) || 0;
        if (!Number.isFinite(px)) return null;
        cumBid += sz;
        return { px, sz, cum: cumBid, n: lvl.n };
      })
      .filter(Boolean);

    const maxCum = Math.max(cumAsk, cumBid, 1);
    // Guard the spread maths: an empty or fully-unparseable book must not
    // produce NaN in the ribbon.
    const safeMark = Number.isFinite(Number(markPrice)) ? Number(markPrice) : 0;
    const bestAsk = asksWithCum[0]?.px || safeMark;
    const bestBid = bidsWithCum[0]?.px || safeMark;
    const sp = Math.max(0.0001, bestAsk - bestBid);
    const spP = bestAsk > 0 ? ((sp / bestAsk) * 100).toFixed(3) : '0.000';

    // Asks are displayed top-to-bottom descending to spread
    const displayAsks = [...asksWithCum].reverse();

    return {
      processedAsks: displayAsks,
      processedBids: bidsWithCum,
      spreadVal: sp.toFixed(sp < 1 ? 4 : 2),
      spreadPct: `${spP}%`,
      maxDepthCum: maxCum
    };
  }, [l2Depth, markPrice]);

  // Order Execution Calculation
  const availableUsdc = brokerPortfolio.cashUsdt || 10000;
  const numOrderSize = parseFloat(orderSize) || 0;
  const effectivePrice = orderType === 'Limit' && parseFloat(limitPrice) > 0 ? parseFloat(limitPrice) : markPrice;
  const orderValueUsd = numOrderSize * effectivePrice;
  const marginRequired = orderValueUsd / (leverage || 1);
  const liquidationPrice = useMemo(() => {
    if (numOrderSize <= 0 || effectivePrice <= 0) return 'N/A';
    const maintMargin = 0.05; // 5%
    if (orderSide === 'BUY') {
      const liq = effectivePrice * (1 - (1 / leverage) + maintMargin);
      return `$${Math.max(0, liq).toFixed(2)}`;
    } else {
      const liq = effectivePrice * (1 + (1 / leverage) - maintMargin);
      return `$${liq.toFixed(2)}`;
    }
  }, [effectivePrice, leverage, orderSide, numOrderSize]);

  // Handle Quick Size Buttons
  const handleSetPercent = (pct) => {
    setSizePercent(pct);
    const maxVal = availableUsdc * (leverage || 1);
    const targetVal = (maxVal * pct) / 100;
    const sz = targetVal / (effectivePrice || 1);
    setOrderSize(sz.toFixed(4));
  };

  // Submit Order Execution to Paper Broker
  const handleExecuteTrade = () => {
    try {
      if (numOrderSize <= 0) {
        setActionNotice({ type: 'error', text: 'Masukkan ukuran posisi (Size) yang valid.' });
        return;
      }
      if (marginRequired > availableUsdc) {
        setActionNotice({ type: 'error', text: `Margin tidak cukup! Butuh $${marginRequired.toFixed(2)}, saldo $${availableUsdc.toFixed(2)}.` });
        return;
      }

      institutionalPaperBroker.placeOrder({
        symbol: selectedPair,
        market: activeInstrument.market,
        side: orderSide,
        type: orderType,
        price: effectivePrice,
        quantity: numOrderSize,
        stopLoss: useBracket ? parseFloat(stopLossPrice) : 0,
        target1: useBracket ? parseFloat(takeProfitPrice) : 0,
        agentId: 'HYPERLIQUID_PRO_DESK',
        agentName: 'Hyperliquid Pro Execution'
      });

      refreshBroker();
      setActionNotice({
        type: 'success',
        text: `Berhasil mengeksekusi ${orderSide === 'BUY' ? 'LONG' : 'SHORT'} ${numOrderSize} ${baseCoin} pada $${effectivePrice.toLocaleString()}!`
      });
      setOrderSize('');
    } catch (err) {
      setActionNotice({ type: 'error', text: err.message || 'Gagal mengeksekusi order.' });
    }
  };

  // Close Position
  const handleClosePosition = (symbol) => {
    try {
      const summary = institutionalPaperBroker.getSummary();
      const pos = (summary.positions || []).find(p => p.symbol === symbol);
      if (!pos) return;

      const closeSide = pos.side === 'LONG' ? 'SELL' : 'BUY';
      institutionalPaperBroker.placeOrder({
        symbol: pos.symbol,
        market: pos.market,
        side: closeSide,
        type: 'MARKET',
        price: markPrice,
        quantity: pos.quantity,
        agentId: 'MANUAL_CLOSE',
        agentName: 'Hyperliquid Close Position'
      });

      refreshBroker();
      setActionNotice({ type: 'success', text: `Posisi ${symbol} berhasil ditutup pada mark price $${markPrice}!` });
    } catch (e) {
      setActionNotice({ type: 'error', text: e.message });
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 120px)',
      minHeight: '750px',
      background: '#090d15',
      color: '#e2e8f0',
      fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      {/* ── TOP RIBBON HUD (Exact Hyperliquid Style) ── */}
      <div style={{
        height: '46px',
        padding: '0 16px',
        background: '#0c111c',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
        overflowX: 'auto',
        gap: '16px',
        flexShrink: 0
      }}>
        {/* Left: Ticker Selector & Core Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          {/* Pair Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px' }}>⚡</span>
            <select
              value={selectedPair}
              onChange={(e) => {
                setSelectedPair(e.target.value);
                setOrderSize('');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '15px',
                fontWeight: 900,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {POPULAR_INSTRUMENTS.map(inst => (
                <option key={inst.symbol} value={inst.symbol} style={{ background: '#0f172a', color: '#fff' }}>
                  {inst.coin}-{inst.market === 'CRYPTO' ? 'USDC' : inst.market}
                </option>
              ))}
            </select>

            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              {leverage}x
            </span>
          </div>

          <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Mark Price */}
          <div>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Mark</div>
            <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
              ${Number(markPrice).toLocaleString(undefined, { minimumFractionDigits: markPrice < 1 ? 4 : 2, maximumFractionDigits: 4 })}
            </div>
          </div>

          {/* Oracle Price */}
          <div>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Oracle</div>
            <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
              ${Number(oraclePrice).toLocaleString(undefined, { minimumFractionDigits: oraclePrice < 1 ? 4 : 2, maximumFractionDigits: 4 })}
            </div>
          </div>

          {/* 24h Change */}
          <div>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>24h Change</div>
            <div style={{
              fontSize: '13px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: change24hPct >= 0 ? '#10b981' : '#f87171'
            }}>
              {change24hPct >= 0 ? '+' : ''}{change24hPct.toFixed(2)}%
            </div>
          </div>

          {/* 24h Volume */}
          <div>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>24h Volume</div>
            <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>
              $529.7M
            </div>
          </div>

          {/* Open Interest */}
          <div>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Open Interest</div>
            <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>
              $1.78B
            </div>
          </div>

          {/* Funding / Countdown */}
          <div>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Funding / Countdown</div>
            <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#10b981' }}>
              0.0013% <span style={{ color: '#94a3b8', fontSize: '11px' }}>00:14:58</span>
            </div>
          </div>
        </div>

        {/* Right: Workstation Mode & Balance Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '3px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: '#34d399'
          }}>
            Balance: ${availableUsdc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
          </div>

          {onSwitchToGrid && (
            <button
              onClick={() => onSwitchToGrid?.()}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Beralih ke tampilan multi-grid (1, 2, atau 4 chart)"
            >
              🪟 Multi-Grid
            </button>
          )}

          {onClose && (
            <button
              onClick={() => onClose?.()}
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
              title="Tutup Terminal (Esc)"
            >
              ✕ Tutup
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div style={{
          padding: '6px 16px',
          background: actionNotice.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          borderBottom: '1px solid ' + (actionNotice.type === 'success' ? '#10b981' : '#ef4444'),
          color: actionNotice.type === 'success' ? '#34d399' : '#f87171',
          fontSize: '11px',
          fontWeight: 700,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{actionNotice.text}</span>
          <span style={{ cursor: 'pointer', fontSize: '14px' }} onClick={() => setActionNotice(null)}>✕</span>
        </div>
      )}

      {/* ── 3-COLUMN WORKSTATION (Chart ~58% | Order Book ~20% | Execution Deck ~22%) ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        
        {/* ── COLUMN 1: INTERACTIVE TRADINGVIEW CHART ── */}
        <div style={{
          flex: '1 1 58%',
          minWidth: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#090d15'
        }}>
          {/* Chart Header Bar: Timeframes & Sub-tabs */}
          <div style={{
            height: '34px',
            padding: '0 12px',
            background: '#0c101a',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => setChartSubTab('chart')}
                  style={{
                    background: chartSubTab === 'chart' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    border: 'none',
                    color: chartSubTab === 'chart' ? '#fff' : '#64748b',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Chart
                </button>
                <button
                  onClick={() => setChartSubTab('funding')}
                  style={{
                    background: chartSubTab === 'funding' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    border: 'none',
                    color: chartSubTab === 'funding' ? '#fff' : '#64748b',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Funding
                </button>
              </div>

              <div style={{ width: '1px', height: '14px', background: 'rgba(255, 255, 255, 0.1)' }} />

              {/* Timeframes */}
              <div style={{ display: 'flex', gap: '2px' }}>
                {[
                  { id: '5', label: '5m' },
                  { id: '15', label: '15m' },
                  { id: '60', label: '1h' },
                  { id: '240', label: '4h' },
                  { id: 'D', label: '1D' }
                ].map(tf => (
                  <button
                    key={tf.id}
                    onClick={() => setTimeframe(tf.id)}
                    style={{
                      background: timeframe === tf.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      color: timeframe === tf.id ? '#38bdf8' : '#64748b',
                      border: 'none',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
              ⚡ HYPERLIQUID L1 REALTIME FEED
            </div>
          </div>

          {/* Chart Iframe Canvas */}
          <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: 0 }}>
            <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
          </div>
        </div>

        {/* ── COLUMN 2: VERTICAL ORDER BOOK L2 (Hyperliquid Native) ── */}
        <div style={{
          width: '260px',
          minWidth: '240px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#0a0e17'
        }}>
          {/* Orderbook Header */}
          <div style={{
            height: '34px',
            padding: '0 12px',
            background: '#0c101a',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#f8fafc' }}>
              Order Book
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select
                value={bookTickSize}
                onChange={(e) => setBookTickSize(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  borderRadius: '3px',
                  padding: '1px 4px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="0.001">0.001</option>
                <option value="0.01">0.01</option>
                <option value="0.1">0.1</option>
                <option value="1">1</option>
              </select>
            </div>
          </div>

          {/* Column Titles */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1fr',
            padding: '5px 10px',
            fontSize: '9.5px',
            color: '#64748b',
            fontWeight: 700,
            textTransform: 'uppercase',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
          }}>
            <span>Price ({isCrypto ? 'USDC' : 'IDR'})</span>
            <span style={{ textAlign: 'right' }}>Size ({baseCoin})</span>
            <span style={{ textAlign: 'right' }}>Total</span>
          </div>

          {/* ASKS (Sellers - Red) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflowY: 'hidden' }}>
            {processedAsks.map((ask, idx) => {
              const depthPct = Math.min(100, ((ask.cum / maxDepthCum) * 100)).toFixed(0);
              return (
                <div
                  key={`ask-${idx}-${ask.px}`}
                  onClick={() => {
                    setOrderType('Limit');
                    setLimitPrice(ask.px.toString());
                  }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr 1fr',
                    padding: '2.5px 10px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    position: 'relative',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  title="Klik untuk mengisi harga Limit"
                >
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    right: 0,
                    width: `${depthPct}%`,
                    background: 'rgba(239, 68, 68, 0.15)',
                    pointerEvents: 'none'
                  }} />
                  <span style={{ color: '#ef4444', fontWeight: 700, position: 'relative', zIndex: 1 }}>
                    {ask.px.toFixed(bookTickSize.includes('.') ? bookTickSize.split('.')[1].length : 0)}
                  </span>
                  <span style={{ textAlign: 'right', color: '#cbd5e1', position: 'relative', zIndex: 1 }}>
                    {ask.sz.toFixed(2)}
                  </span>
                  <span style={{ textAlign: 'right', color: '#64748b', position: 'relative', zIndex: 1 }}>
                    {ask.cum.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* SPREAD BAR (Center Divider) */}
          <div style={{
            padding: '5px 10px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)'
          }}>
            <span style={{ color: '#64748b' }}>Spread {spreadVal}</span>
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>{spreadPct}</span>
          </div>

          {/* BIDS (Buyers - Green) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', overflowY: 'hidden' }}>
            {processedBids.map((bid, idx) => {
              const depthPct = Math.min(100, ((bid.cum / maxDepthCum) * 100)).toFixed(0);
              return (
                <div
                  key={`bid-${idx}-${bid.px}`}
                  onClick={() => {
                    setOrderType('Limit');
                    setLimitPrice(bid.px.toString());
                  }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr 1fr',
                    padding: '2.5px 10px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    position: 'relative',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  title="Klik untuk mengisi harga Limit"
                >
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    right: 0,
                    width: `${depthPct}%`,
                    background: 'rgba(16, 185, 129, 0.15)',
                    pointerEvents: 'none'
                  }} />
                  <span style={{ color: '#10b981', fontWeight: 700, position: 'relative', zIndex: 1 }}>
                    {bid.px.toFixed(bookTickSize.includes('.') ? bookTickSize.split('.')[1].length : 0)}
                  </span>
                  <span style={{ textAlign: 'right', color: '#cbd5e1', position: 'relative', zIndex: 1 }}>
                    {bid.sz.toFixed(2)}
                  </span>
                  <span style={{ textAlign: 'right', color: '#64748b', position: 'relative', zIndex: 1 }}>
                    {bid.cum.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── COLUMN 3: ORDER EXECUTION DECK (Exact Hyperliquid Form) ── */}
        <div style={{
          width: '280px',
          minWidth: '260px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0b1019',
          padding: '12px',
          overflowY: 'auto'
        }}>
          {/* Mode Pill Switchers: Cross | 10x | Unified */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginBottom: '12px' }}>
            {['Cross', 'Isolated'].map(mode => (
              <button
                key={mode}
                onClick={() => setMarginMode(mode)}
                style={{
                  padding: '4px 0',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '4px',
                  border: '1px solid ' + (marginMode === mode ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.08)'),
                  background: marginMode === mode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: marginMode === mode ? '#38bdf8' : '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                {mode}
              </button>
            ))}

            <button
              onClick={() => {
                const next = leverage === 10 ? 20 : leverage === 20 ? 40 : 10;
                setLeverage(next);
              }}
              style={{
                padding: '4px 0',
                fontSize: '11px',
                fontWeight: 800,
                borderRadius: '4px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#34d399',
                cursor: 'pointer'
              }}
            >
              {leverage}x ▾
            </button>
          </div>

          {/* Order Type Tabs: Market | Limit | Pro */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px', marginBottom: '12px' }}>
            {['Market', 'Limit', 'Stop'].map(type => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: orderType === type ? '#f8fafc' : '#64748b',
                  fontSize: '12px',
                  fontWeight: orderType === type ? 800 : 600,
                  cursor: 'pointer',
                  borderBottom: orderType === type ? '2px solid #38bdf8' : '2px solid transparent',
                  paddingBottom: '4px'
                }}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Dual Action Buy/Long vs Sell/Short */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '14px' }}>
            <button
              onClick={() => setOrderSide('BUY')}
              style={{
                padding: '8px 0',
                fontSize: '12px',
                fontWeight: 900,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: orderSide === 'BUY' ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.05)',
                color: orderSide === 'BUY' ? '#ffffff' : '#64748b',
                transition: 'all 0.15s ease'
              }}
            >
              Buy / Long
            </button>
            <button
              onClick={() => setOrderSide('SELL')}
              style={{
                padding: '8px 0',
                fontSize: '12px',
                fontWeight: 900,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: orderSide === 'SELL' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(255, 255, 255, 0.05)',
                color: orderSide === 'SELL' ? '#ffffff' : '#64748b',
                transition: 'all 0.15s ease'
              }}
            >
              Sell / Short
            </button>
          </div>

          {/* Account Margin HUD */}
          <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '6px' }}>
            <span>Available to Trade</span>
            <span style={{ color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              ${availableUsdc.toFixed(2)} USDC
            </span>
          </div>

          {/* Limit Price Input (if Limit mode) */}
          {orderType === 'Limit' && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>Price</div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '6px 10px'
              }}>
                <input
                  type="number"
                  placeholder={markPrice.toString()}
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    fontWeight: 700,
                    width: '100%',
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>USDC</span>
              </div>
            </div>
          )}

          {/* Order Size Input */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>Size</div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '6px 10px'
            }}>
              <input
                type="number"
                placeholder="0.00"
                value={orderSize}
                onChange={(e) => {
                  setOrderSize(e.target.value);
                  setSizePercent(0);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 700,
                  width: '100%',
                  outline: 'none'
                }}
              />
              <span style={{ fontSize: '11px', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {baseCoin}
              </span>
            </div>
          </div>

          {/* Percentage Quick Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '12px' }}>
            {[25, 50, 75, 100].map(pct => (
              <button
                key={pct}
                onClick={() => handleSetPercent(pct)}
                style={{
                  padding: '3px 0',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  borderRadius: '4px',
                  border: sizePercent === pct ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: sizePercent === pct ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: sizePercent === pct ? '#38bdf8' : '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Options: Reduce Only & TP/SL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px', fontSize: '11px', color: '#94a3b8' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={reduceOnly}
                onChange={(e) => setReduceOnly(e.target.checked)}
              />
              <span>Reduce Only</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useBracket}
                onChange={(e) => setUseBracket(e.target.checked)}
              />
              <span>Take Profit / Stop Loss</span>
            </label>
          </div>

          {/* Bracket inputs if checked */}
          {useBracket && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '9px', color: '#10b981', fontWeight: 700 }}>TP ($)</span>
                <input
                  type="number"
                  placeholder={(effectivePrice * 1.05).toFixed(2)}
                  value={takeProfitPrice}
                  onChange={(e) => setTakeProfitPrice(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>
              <div>
                <span style={{ fontSize: '9px', color: '#ef4444', fontWeight: 700 }}>SL ($)</span>
                <input
                  type="number"
                  placeholder={(effectivePrice * 0.97).toFixed(2)}
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>
            </div>
          )}

          {/* BIG PROMINENT PLACE ORDER BUTTON */}
          <button
            onClick={handleExecuteTrade}
            style={{
              padding: '11px 0',
              fontSize: '13px',
              fontWeight: 900,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: orderSide === 'BUY'
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
              marginBottom: '14px',
              letterSpacing: '0.02em'
            }}
          >
            {orderSide === 'BUY' ? `Buy / Long ${baseCoin}` : `Sell / Short ${baseCoin}`}
          </button>

          {/* Specifications Breakdown */}
          <div style={{
            fontSize: '10.5px',
            color: '#64748b',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Liquidation Price</span>
              <span style={{ color: '#f87171', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {liquidationPrice}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Order Value</span>
              <span style={{ color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
                ${orderValueUsd.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Margin Required</span>
              <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                ${marginRequired.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Est. Slippage</span>
              <span style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                0.02% (Simulated TWAP)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Fees</span>
              <span style={{ color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                0.020% / 0.045%
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ── BOTTOM DOCK: POSITIONS & ORDERS LEDGER ── */}
      <div style={{
        height: showLedger ? '160px' : '30px',
        background: '#090d15',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'height 0.2s ease'
      }}>
        {/* Ledger Header Tabs */}
        <div style={{
          height: '30px',
          padding: '0 12px',
          background: '#0c101a',
          borderBottom: showLedger ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { id: 'positions', label: `Positions (${(brokerPortfolio.positions || []).length})` },
              { id: 'orders', label: 'Open Orders (0)' },
              { id: 'history', label: `Trade History (${(brokerPortfolio.tradeHistory || []).length})` },
              { id: 'balances', label: 'Balances' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setLedgerTab(tab.id);
                  if (!showLedger) setShowLedger(true);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: ledgerTab === tab.id ? '#38bdf8' : '#64748b',
                  fontSize: '11px',
                  fontWeight: ledgerTab === tab.id ? 800 : 600,
                  cursor: 'pointer',
                  borderBottom: ledgerTab === tab.id && showLedger ? '2px solid #38bdf8' : 'none',
                  paddingBottom: '2px'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowLedger(prev => !prev)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            {showLedger ? '▼ Tutup Panel' : '▲ Buka Panel'}
          </button>
        </div>

        {/* Ledger Content Rows */}
        {showLedger && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 12px' }}>
            {ledgerTab === 'positions' && (
              <>
                {(brokerPortfolio.positions || []).length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '11.5px' }}>
                    Belum ada posisi terbuka. Gunakan Order Execution Form di sisi kanan untuk membuka posisi Long atau Short.
                  </div>
                ) : (
                  <table style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-mono)', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ color: '#64748b', textAlign: 'left', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '10px' }}>
                        <th style={{ padding: '4px' }}>Symbol</th>
                        <th style={{ padding: '4px' }}>Side</th>
                        <th style={{ padding: '4px', textAlign: 'right' }}>Size</th>
                        <th style={{ padding: '4px', textAlign: 'right' }}>Entry Price</th>
                        <th style={{ padding: '4px', textAlign: 'right' }}>Mark Price</th>
                        <th style={{ padding: '4px', textAlign: 'right' }}>PnL (ROE)</th>
                        <th style={{ padding: '4px', textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(brokerPortfolio.positions || []).map(p => {
                        const cur = markPrice || p.entryPrice;
                        const diff = p.side === 'LONG' ? (cur - p.entryPrice) : (p.entryPrice - cur);
                        const pnlUsd = diff * p.quantity;
                        const roePct = ((diff / p.entryPrice) * (leverage || 1) * 100).toFixed(2);
                        const isWin = pnlUsd >= 0;

                        return (
                          <tr key={p.symbol} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                            <td style={{ padding: '5px 4px', fontWeight: 800, color: '#fff' }}>{p.symbol}</td>
                            <td style={{ padding: '5px 4px' }}>
                              <span style={{
                                background: p.side === 'LONG' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: p.side === 'LONG' ? '#34d399' : '#f87171',
                                padding: '1px 5px',
                                borderRadius: '3px',
                                fontWeight: 800
                              }}>
                                {p.side}
                              </span>
                            </td>
                            <td style={{ padding: '5px 4px', textAlign: 'right' }}>{p.quantity}</td>
                            <td style={{ padding: '5px 4px', textAlign: 'right' }}>${p.entryPrice.toLocaleString()}</td>
                            <td style={{ padding: '5px 4px', textAlign: 'right', color: '#38bdf8' }}>${cur.toLocaleString()}</td>
                            <td style={{ padding: '5px 4px', textAlign: 'right', fontWeight: 800, color: isWin ? '#10b981' : '#ef4444' }}>
                              {isWin ? '+' : ''}${pnlUsd.toFixed(2)} ({isWin ? '+' : ''}{roePct}%)
                            </td>
                            <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                              <button
                                onClick={() => handleClosePosition(p.symbol)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#f87171',
                                  padding: '2px 8px',
                                  borderRadius: '3px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                Market Close
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {ledgerTab === 'history' && (
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                {(brokerPortfolio.tradeHistory || []).length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                    Belum ada riwayat transaksi yang tersimpan.
                  </div>
                ) : (
                  (brokerPortfolio.tradeHistory || []).slice(-10).reverse().map((th, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <span>{th.symbol} ({th.side})</span>
                      <span>Qty: {th.quantity || th.lots}</span>
                      <span>Harga: ${th.price}</span>
                      <span style={{ color: '#94a3b8' }}>{new Date(th.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {ledgerTab === 'balances' && (
              <div style={{ display: 'flex', gap: '24px', padding: '12px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>CASH USDT / USDC</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#10b981' }}>
                    ${(brokerPortfolio.cashUsdt || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>CASH IDR</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                    Rp {(brokerPortfolio.cashIdr || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
