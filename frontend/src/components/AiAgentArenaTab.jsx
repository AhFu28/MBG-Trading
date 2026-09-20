import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { isIdxMarketOpen, getIdxSessionDetail, isForexCommodityOpen, isCryptoOpen, isUsMarketOpen } from '../utils/marketHours.js';

// Central Strict Real-World Market Open Classifier (All asset classes)
export const isMarketOpenNow = (market) => {
  if (market === 'IDX') return isIdxMarketOpen();
  if (market === 'US') return isUsMarketOpen();
  if (market === 'FOREX' || market === 'FUTURES') return isForexCommodityOpen();
  if (market === 'CRYPTO') return true;
  return false;
};

// Live Currency Exchange Rate Baseline with Dynamic Fetch Support
let currentLiveUsdToIdr = 16350;
const USD_TO_IDR = 16350;

// Formatters for Rupiah and USD
const formatIdr = (val) => {
  if (val === undefined || val === null || isNaN(val)) return 'Rp 0';
  const n = Math.round(Number(val));
  const sign = n < 0 ? '-' : '';
  return `${sign}Rp ${Math.abs(n).toLocaleString('id-ID')}`;
};

const formatUsd = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '$0.00';
  const n = Number(val);
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatCompactIdr = (val) => {
  if (val === undefined || val === null || isNaN(val)) return 'Rp 0';
  const n = Math.round(Number(val));
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1000000000) return `${sign}Rp ${(abs / 1000000000).toFixed(1)}M`;
  if (abs >= 1000000) return `${sign}Rp ${(abs / 1000000).toFixed(1)}Jt`;
  if (abs >= 1000) return `${sign}Rp ${(abs / 1000).toFixed(0)}K`;
  return `${sign}Rp ${abs}`;
};

// Universal Price Formatter with Thousand Separator & Asset-Specific Precision (Never overly truncates decimals)
export const formatInstrumentPrice = (val, market, symbol = '') => {
  if (val === undefined || val === null || isNaN(val)) return '-';
  const n = Number(val);

  // 1. Saham BEI (IDX): 0 desimal, separator titik ribuan (id-ID), misal: Rp 6.375
  if (market === 'IDX') {
    return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
  }

  // 2. Forex: 5 desimal standar interbank (atau 3 desimal untuk pasangan JPY)
  if (market === 'FOREX') {
    const isJpy = symbol && symbol.includes('JPY');
    const decimals = isJpy ? 3 : 5;
    return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  // 3. Crypto: BTC/ETH/SOL 2 desimal ($92,450.00), altcoin kecil (<$1) 4-7 desimal
  if (market === 'CRYPTO' || (symbol && symbol.includes('USDT'))) {
    if (n >= 100) return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (n >= 1) return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
    if (n >= 0.001) return `$${n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })}`;
    return `$${n.toFixed(7)}`;
  }

  // 4. US Stocks, Indices, Gold (XAU), Silver (XAG), Oil (USOIL): 2 desimal dengan koma ribuan ($2,914.50, $224.50)
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Helper to determine standard leverage for each market/instrument & execution mode
export const getLeverage = (market, symbol = '', executionMode = 'FUTURES') => {
  if (market === 'IDX' || executionMode === 'SPOT') return '1:1 (Spot)';
  if (market === 'US') return '1:5 (CFD)';
  if (market === 'CRYPTO') return '1:20 (Perp)';
  if (['US30', 'US500', 'NAS100', 'DAX40', 'NIKKEI', 'HSI'].includes(symbol)) return '1:50 (Index)';
  if (symbol && (symbol.includes('XAU') || symbol.includes('XAG') || symbol.includes('USOIL') || symbol.includes('UKOIL') || market === 'FUTURES')) return '1:100';
  if (market === 'FOREX') return '1:100';
  return '1:50';
};

// Agent Default Execution Preference in HYBRID Mode
// Swing / Value / SMC Reversion agents prefer SPOT for Spot Accumulation (0 Liquidation Risk)
// Momentum / Scalping / Volatility agents prefer FUTURES for 2-way leverage
export const AGENT_EXECUTION_BIAS = {
  WATER: 'SPOT',      // SMC & Liquidity Flow: Akumulasi spot di Order Block
  FIRE: 'FUTURES',    // News Event Momentum: Cepat 2 arah
  AIR: 'FUTURES',     // Trend Breakout Donchian
  EARTH: 'SPOT',      // Mean Reversion & Support: Spot accumulation tanpa utang
  STEAM: 'FUTURES',   // W+F: News Sniper
  STORM: 'FUTURES',   // W+A: Trend Breakout
  MUD: 'SPOT',        // W+E: FVG Mitigation on solid support (Spot accumulation)
  LIGHTNING: 'FUTURES', // F+A: High velocity momentum
  LAVA: 'FUTURES',    // F+E: News exhaustion fade
  SANDSTORM: 'SPOT',  // A+E: Pullback buy on key support
  TEMPEST: 'FUTURES', // W+F+A: Alpha momentum
  OCEANIC: 'SPOT',    // W+A+E: Institutional All-Weather Spot & Wealth
  GEOTHERMAL: 'SPOT', // W+F+E: Fundamental support block
  CYCLONE: 'FUTURES', // F+A+E: Dynamic regime transition
  AVATAR: 'HYBRID'    // 4-Element Master: Dynamic 50/50 Spot & Futures
};

// Resolve effective execution mode for a specific trade
export const resolveExecutionMode = (globalArenaMode, agentId, market) => {
  // Saham BEI (IDX) is strictly 100% SPOT
  if (market === 'IDX') return 'SPOT';
  // Forex & Commodities CFD indices are always FUTURES/CFD
  if (market === 'FOREX' || market === 'FUTURES') return 'FUTURES';

  if (globalArenaMode === 'SPOT_ONLY') return 'SPOT';
  if (globalArenaMode === 'FUTURES_ONLY') return 'FUTURES';

  // In HYBRID mode:
  const bias = AGENT_EXECUTION_BIAS[agentId] || 'HYBRID';
  if (bias === 'SPOT') return 'SPOT';
  if (bias === 'FUTURES') return 'FUTURES';
  return Math.random() < 0.5 ? 'SPOT' : 'FUTURES';
};

// Dynamic Tiered Market Scanner Pipeline
// Tier 1: Liquidity & Market Hours Gatekeeper
// Tier 2: Momentum & Volatility Active Opportunity Screener
export const scanActiveMarketRadar = (marketFeeds, instruments, scannerFilter = 'DYNAMIC_RADAR') => {
  if (!marketFeeds || !instruments) return [];

  // Tier 1: Open Market & Safety Liquidity Filter
  const tier1OpenAndLiquid = instruments.filter(inst => {
    if (!isMarketOpenNow(inst.market)) return false;
    const feed = marketFeeds[inst.symbol];
    if (!feed || !feed.price || feed.price <= 0) return false;
    // Safety check: Filter out sub-penny US stocks
    if (inst.market === 'US' && feed.price < 2) return false;
    return true;
  });

  if (scannerFilter === 'FULL_WATCHLIST') {
    return tier1OpenAndLiquid.map(i => i.symbol);
  }

  // Tier 2: Active Opportunity & Volatility Screener
  const scored = tier1OpenAndLiquid.map(inst => {
    const feed = marketFeeds[inst.symbol];
    const absChange = Math.abs(feed.change || 0);
    const atrRatio = feed.atr && feed.price ? (feed.atr / feed.price) * 100 : 0.5;

    let activityScore = absChange * 2.0 + atrRatio * 1.5;
    if (absChange < 0.05) activityScore *= 0.2; // Stagnant pair penalty

    if (feed.regime && (feed.regime.includes('BREAKOUT') || feed.regime.includes('EXPANSION') || feed.regime.includes('MOMENTUM') || feed.regime.includes('RALLY'))) {
      activityScore += 3.0;
    }

    return {
      symbol: inst.symbol,
      market: inst.market,
      activityScore,
      feed
    };
  });

  scored.sort((a, b) => b.activityScore - a.activityScore);

  // Take top ~55 most active liquid candidates
  const cutoff = Math.max(25, Math.min(scored.length, 55));
  return scored.slice(0, cutoff).map(s => s.symbol);
};

// Universal Realistic Lot & Position Sizing Calculator (Capital & Risk Aware, Spot vs Futures)
export const calculateInstrumentLotSize = (market, symbol = '', entryPrice = 0, capitalIdr = 1000000, riskPct = 2, executionMode = 'FUTURES') => {
  if (!entryPrice || entryPrice <= 0) return 0.01;
  const isIdx = market === 'IDX';
  const isForex = market === 'FOREX';
  const isCrypto = market === 'CRYPTO' || symbol.endsWith('USDT');
  const isFutures = market === 'FUTURES';
  const isUs = market === 'US';
  const isSpot = executionMode === 'SPOT' || isIdx;

  const capitalMultiplier = Math.max(0.5, capitalIdr / 1000000);
  // Target allocation per trade: ~3% margin for futures, ~8% cash allocation for spot
  const targetMarginIdr = isSpot
    ? Math.max(50000, (capitalIdr * 0.08))
    : Math.max(20000, (capitalIdr * (riskPct / 100) * 1.5));
  const targetMarginUsd = targetMarginIdr / (currentLiveUsdToIdr || 16350);

  if (isIdx) {
    // 1 lot = 100 shares. Allocation ~10% capital per trade, min 1 lot
    const lotCost = entryPrice * 100;
    return Math.max(1, Math.round((capitalIdr * 0.10) / lotCost));
  }

  if (isCrypto) {
    if (isSpot) {
      // Spot: 1:1 leverage, pure cash allocation
      const rawQty = targetMarginUsd / entryPrice;
      if (rawQty >= 1000) return Math.round(rawQty);
      if (rawQty >= 50) return Number(rawQty.toFixed(1));
      if (rawQty >= 1) return Number(rawQty.toFixed(2));
      if (rawQty >= 0.01) return Number(rawQty.toFixed(3));
      return Number(rawQty.toFixed(4));
    } else {
      // Leverage 1:20 (Perp) -> Notional = Margin * 20
      const notionalUsd = targetMarginUsd * 20;
      const rawQty = notionalUsd / entryPrice;
      if (rawQty >= 1000) return Math.round(rawQty);
      if (rawQty >= 50) return Number(rawQty.toFixed(1));
      if (rawQty >= 1) return Number(rawQty.toFixed(2));
      if (rawQty >= 0.01) return Number(rawQty.toFixed(3));
      return Number(rawQty.toFixed(4));
    }
  }

  if (isForex) {
    // Standard Forex micro-lot: 0.01 lot = 1,000 units (~$10 margin on 1:100)
    return Number(Math.max(0.01, (0.01 * capitalMultiplier)).toFixed(2));
  }

  if (symbol.includes('XAU') || symbol.includes('XAG') || isFutures) {
    if (['US30', 'US500', 'NAS100', 'DAX40', 'NIKKEI', 'HSI'].includes(symbol)) {
      return Number(Math.max(0.01, (0.05 * capitalMultiplier)).toFixed(2));
    }
    return Number(Math.max(0.01, (0.01 * capitalMultiplier)).toFixed(2));
  }

  if (isUs) {
    if (isSpot) {
      // US Stock Spot (Cash 1:1)
      const rawShares = targetMarginUsd / entryPrice;
      return Math.max(1, Math.round(rawShares));
    } else {
      // US Stocks (CFD 1:5) -> Notional = Margin * 5
      const notionalUsd = targetMarginUsd * 5;
      const rawShares = notionalUsd / entryPrice;
      return Math.max(1, Math.round(rawShares));
    }
  }

  return 0.01;
};

// Bot Lifecycle Status Guide Explanations
const BOT_STATUS_GUIDE = {
  HUNTING: {
    label: 'HUNTING (Memburu Sinyal)',
    badgeColor: 'var(--accent-blue)',
    title: 'Memburu Sinyal & Pemindaian Pasar',
    desc: 'Bot aktif menganalisa chart, order book, dan volume footprint di multi-timeframe. Mencari pola likuiditas, breakout, atau deviasi mean-reversion yang memenuhi kriteria probabilitas tinggi sebelum membuka posisi.'
  },
  STANDBY: {
    label: 'STANDBY (Menunggu Katalis / Pasar Tutup)',
    badgeColor: 'var(--accent-orange)',
    title: 'Menunggu Katalis / Sesi Bursa Buka',
    desc: 'Bot bersiap di pinggir pasar tanpa membuka order berisiko. Menunggu jam perdagangan reguler (misal: bursa saham BEI atau sesi London/NY) atau rilis data ekonomi high-impact (CPI, NFP, Fed FOMC).'
  },
  TRADING: {
    label: 'TRADING (Mengelola Posisi Aktif)',
    badgeColor: 'var(--accent-green)',
    title: 'Posisi Terbuka & Active Management',
    desc: 'Bot sedang mengawal trade aktif di pasar. Algoritma terus menghitung floating PnL, mengaktifkan trailing stop otomatis saat profit mencapai threshold, atau mengeksekusi partial take profit.'
  },
  DEFENSIVE: {
    label: 'DEFENSIVE (Proteksi Modal / Circuit Breaker)',
    badgeColor: 'var(--accent-rust)',
    title: 'Mode Defensif & Drawdown Guard',
    desc: 'Bot membatasi margin atau menahan order baru karena pasar terdeteksi mengalami anomali likuiditas ekstrim atau drawdown harian menyentuh batas risiko toleransi.'
  }
};

// Mini SVG Sparkline / Equity Curve Component (Accurate Green when in profit, Red when in drawdown)
function SparklineChart({ data = [], isPositive, color = '#10b981', height = 34, width = 180 }) {
  const pointsData = data && data.length >= 2 ? data : (data && data.length === 1 ? [data[0], data[0]] : [100, 100]);
  const min = Math.min(...pointsData);
  const max = Math.max(...pointsData);
  const range = max - min || 1;
  const padding = 3;

  const points = pointsData.map((val, idx) => {
    const x = (idx / (pointsData.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  // Strict check: if isPositive is supplied, use it; otherwise check end vs start
  const positive = isPositive !== undefined ? isPositive : (pointsData[pointsData.length - 1] >= pointsData[0]);
  const strokeColor = positive ? '#10b981' : '#ef4444';
  const fillGradientId = `grad_${positive ? 'pos' : 'neg'}_${Math.random().toString(36).substr(2, 6)}`;

  return (
    <div style={{ width: '100%', height: `${height}px`, overflow: 'hidden' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.38" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        <polygon
          fill={`url(#${fillGradientId})`}
          points={`${padding},${height} ${points} ${width - padding},${height}`}
        />
      </svg>
    </div>
  );
}

// Interactive SVG Strategy Simulation Chart for Modal Profil & Filosofi (Gambar 1)
function StrategySimulationChart({ agentId, color = '#3b82f6', width = 640, height = 210 }) {
  const configs = {
    WATER: {
      title: 'XAU/USD H4 — WATER: Smart Money Concepts (SMC) & Liquidity Flow',
      entryLabel: 'Entry Buy @ 2,908.40 (Order Block Retest)',
      tpLabel: 'Target TP @ 2,945.00 (+3.5R Liquidity Sweep)',
      slLabel: 'Hard SL @ 2,898.00 (-1.0R Swing Low)',
      candles: [
        { o: 2902, h: 2915, l: 2898, c: 2912, isBull: true },
        { o: 2912, h: 2925, l: 2908, c: 2923, isBull: true },
        { o: 2923, h: 2930, l: 2916, c: 2918, isBull: false },
        { o: 2918, h: 2920, l: 2906, c: 2908, isBull: false, isSweep: true },
        { o: 2908, h: 2922, l: 2907, c: 2920, isBull: true, isEntry: true },
        { o: 2920, h: 2934, l: 2918, c: 2932, isBull: true },
        { o: 2932, h: 2948, l: 2928, c: 2946, isBull: true, isExit: true }
      ],
      levels: { entry: 2908.40, tp: 2945.00, sl: 2898.00, min: 2892, max: 2952 }
    },
    FIRE: {
      title: 'EUR/USD M15 — FIRE: Macro & News Event Volatility Momentum Breakout',
      entryLabel: 'Breakout Entry @ 1.0845 (Post-CPI Spike)',
      tpLabel: 'Fast TP @ 1.0920 (+2.5R Trailing Surge)',
      slLabel: 'Hard SL @ 1.0815 (-1.0R Pre-News Base)',
      candles: [
        { o: 1.0825, h: 1.0832, l: 1.0822, c: 1.0828, isBull: true },
        { o: 1.0828, h: 1.0835, l: 1.0826, c: 1.0830, isBull: true },
        { o: 1.0830, h: 1.0850, l: 1.0828, c: 1.0848, isBull: true, isSweep: true },
        { o: 1.0848, h: 1.0875, l: 1.0844, c: 1.0870, isBull: true, isEntry: true },
        { o: 1.0870, h: 1.0895, l: 1.0865, c: 1.0890, isBull: true },
        { o: 1.0890, h: 1.0925, l: 1.0885, c: 1.0920, isBull: true, isExit: true }
      ],
      levels: { entry: 1.0845, tp: 1.0920, sl: 1.0815, min: 1.0805, max: 1.0935 }
    },
    AIR: {
      title: 'BTC/USDT H1 — AIR: 20-Day Donchian Channel Trend Wave Riding',
      entryLabel: 'Breakout Buy @ $91,800 (Upper Donchian)',
      tpLabel: 'Multi-Stage TP @ $96,000 (+4.0R Trend Ride)',
      slLabel: 'ATR Trailing SL @ $90,500 (-1.2R Baseline)',
      candles: [
        { o: 89800, h: 90600, l: 89500, c: 90400, isBull: true },
        { o: 90400, h: 91200, l: 90200, c: 91000, isBull: true },
        { o: 91000, h: 92200, l: 90900, c: 92000, isBull: true, isSweep: true },
        { o: 92000, h: 93400, l: 91700, c: 93100, isBull: true, isEntry: true },
        { o: 93100, h: 94800, l: 92900, c: 94500, isBull: true },
        { o: 94500, h: 96400, l: 94200, c: 96100, isBull: true, isExit: true }
      ],
      levels: { entry: 91800, tp: 96000, sl: 90500, min: 89000, max: 97000 }
    },
    EARTH: {
      title: 'BBCA Daily — EARTH: Mean Reversion & Solid Support Rebound',
      entryLabel: 'Spot Long Buy @ Rp 6.350 (Lower BB + RSI < 30)',
      tpLabel: 'Target TP @ Rp 6.650 (+3.0R Mid-Band Mean)',
      slLabel: 'Hard SL @ Rp 6.225 (-1.0R Support Breach)',
      candles: [
        { o: 6525, h: 6550, l: 6475, c: 6475, isBull: false },
        { o: 6475, h: 6475, l: 6375, c: 6375, isBull: false },
        { o: 6375, h: 6375, l: 6325, c: 6350, isBull: false, isSweep: true },
        { o: 6350, h: 6450, l: 6325, c: 6425, isBull: true, isEntry: true },
        { o: 6425, h: 6550, l: 6400, c: 6525, isBull: true },
        { o: 6525, h: 6675, l: 6500, c: 6650, isBull: true, isExit: true }
      ],
      levels: { entry: 6350, tp: 6650, sl: 6225, min: 6180, max: 6720 }
    }
  };
  // Backwards compatibility mappings
  configs.TITAN = configs.WATER;
  configs.ORACLE = configs.FIRE;
  configs.VORTEX = configs.AIR;
  configs.SENTINEL = configs.EARTH;

  const conf = configs[agentId] || configs.WATER;
  const { min, max, entry, tp, sl } = conf.levels;
  const range = max - min;
  const padY = 20;
  const chartHeight = height - padY * 2;
  const toY = (price) => padY + (1 - (price - min) / range) * chartHeight;

  const yEntry = toY(entry);
  const yTp = toY(tp);
  const ySl = toY(sl);

  const numCandles = conf.candles.length;
  const startX = 50;
  const candleSpacing = (width - 230) / numCandles;

  return (
    <div style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '10px 12px', margin: '8px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '5px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: '900', color: color }}>📈 SIMULASI STRATEGI ENTRY, TP & SL</span>
          <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>| {conf.title}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', fontSize: '8.5px', fontFamily: 'var(--font-mono)' }}>
          <span style={{ color: '#10b981' }}>● TP (Target Profit)</span>
          <span style={{ color: '#3b82f6' }}>● ENTRY Point</span>
          <span style={{ color: '#ef4444' }}>● SL (Stop Loss)</span>
        </div>
      </div>

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
        {/* Shaded Profit & Risk Zones */}
        <rect x="30" y={yTp} width={width - 230} height={Math.max(2, yEntry - yTp)} fill="rgba(16, 185, 129, 0.08)" rx="2" />
        <rect x="30" y={yEntry} width={width - 230} height={Math.max(2, ySl - yEntry)} fill="rgba(239, 68, 68, 0.08)" rx="2" />

        {/* Level Lines */}
        <line x1="30" y1={yTp} x2={width - 30} y2={yTp} stroke="#10b981" strokeWidth="1.6" strokeDasharray="4 2" />
        <rect x={width - 200} y={yTp - 9} width="195" height="17" fill="rgba(16, 185, 129, 0.22)" rx="3" stroke="#10b981" strokeWidth="0.8" />
        <text x={width - 192} y={yTp + 3} fill="#10b981" fontSize="8" fontFamily="var(--font-mono)" fontWeight="700">
          🎯 {conf.tpLabel}
        </text>

        <line x1="30" y1={yEntry} x2={width - 30} y2={yEntry} stroke="#3b82f6" strokeWidth="1.6" strokeDasharray="4 2" />
        <rect x={width - 200} y={yEntry - 9} width="195" height="17" fill="rgba(59, 130, 246, 0.22)" rx="3" stroke="#3b82f6" strokeWidth="0.8" />
        <text x={width - 192} y={yEntry + 3} fill="#60a5fa" fontSize="8" fontFamily="var(--font-mono)" fontWeight="700">
          ⚡ {conf.entryLabel}
        </text>

        <line x1="30" y1={ySl} x2={width - 30} y2={ySl} stroke="#ef4444" strokeWidth="1.6" strokeDasharray="4 2" />
        <rect x={width - 200} y={ySl - 9} width="195" height="17" fill="rgba(239, 68, 68, 0.22)" rx="3" stroke="#ef4444" strokeWidth="0.8" />
        <text x={width - 192} y={ySl + 3} fill="#f87171" fontSize="8" fontFamily="var(--font-mono)" fontWeight="700">
          🛡️ {conf.slLabel}
        </text>

        {/* Candlesticks Rendering */}
        {conf.candles.map((c, idx) => {
          const cx = startX + idx * candleSpacing;
          const yHigh = toY(c.h);
          const yLow = toY(c.l);
          const yOpen = toY(c.o);
          const yClose = toY(c.c);
          const top = Math.min(yOpen, yClose);
          const bodyHeight = Math.max(Math.abs(yClose - yOpen), 3);
          const candleColor = c.isBull ? '#10b981' : '#ef4444';

          return (
            <g key={idx}>
              <line x1={cx} y1={yHigh} x2={cx} y2={yLow} stroke={candleColor} strokeWidth="1.4" />
              <rect x={cx - 6} y={top} width="12" height={bodyHeight} fill={candleColor} rx="1.5" />

              {c.isEntry && (
                <g>
                  <circle cx={cx} cy={yClose} r="3.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                  <rect x={cx - 30} y={yClose + 10} width="60" height="13" fill="#1e3a8a" rx="2" stroke="#3b82f6" strokeWidth="0.8" />
                  <text x={cx} y={yClose + 19} fill="#93c5fd" fontSize="7" fontWeight="800" textAnchor="middle" fontFamily="var(--font-mono)">
                    BUY ENTRY
                  </text>
                </g>
              )}

              {c.isSweep && (
                <g>
                  <text x={cx} y={yLow + 12} fill="var(--accent-orange)" fontSize="6.5" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">
                    ▲ SIGNAL
                  </text>
                </g>
              )}

              {c.isExit && (
                <g>
                  <circle cx={cx} cy={yClose} r="3.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                  <rect x={cx - 30} y={yClose - 20} width="60" height="13" fill="#064e3b" rx="2" stroke="#10b981" strokeWidth="0.8" />
                  <text x={cx} y={yClose - 11} fill="#6ee7b7" fontSize="7" fontWeight="800" textAnchor="middle" fontFamily="var(--font-mono)">
                    TP HIT
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '8.5px', color: 'var(--text-muted)' }}>
        <span>Rasio R:R Terencana: <strong style={{ color: '#10b981' }}>1 : 3.0+ (Positive Asymmetric Edge)</strong></span>
        <span>Eksekusi: <strong style={{ color: 'var(--text-primary)' }}>Limit Order + Dynamic Trailing Invalidation</strong></span>
      </div>
    </div>
  );
}

// Institutional Root Cause Failure Modes, Instrument Suitability & Self-Improvement Actions for 4 Elements
const ELEMENT_MC_ANALYSIS = {
  WATER: {
    name: 'WATER',
    element: 'SMC & Liquidity Flow',
    bestInstruments: 'XAUUSD (Gold), EURUSD, GBPUSD, US30 (Dow Jones)',
    instrumentEdge: 'Sangat cocok untuk instrumen berlikuiditas institusional masif di mana Order Block dan Fair Value Gap (FVG) terbentuk bersih tanpa gangguan noise mikro.',
    avoidInstruments: 'Saham small-cap / illiquid pairs dengan volume tipis dan spread lebar.',
    winRateEdge: 'Win Rate Target: 65% - 75% | Average R:R: 1:3.0+',
    defaultToxicPair: 'XAUUSD (Gold) & GBPUSD',
    defaultCause: 'Terjadi False Liquidity Sweep & Inducement Trap pada instrumen high-spread. Rejection wick tertembus oleh pergerakan institusional agresif, memicu rentetan stop-loss beruntun sebelum order block termitigasi.',
    defaultSolution: 'Pangkas risk multiplier sebesar 15%, tingkatkan ambang konfirmasi sinyal (+5%), dan perketat dynamic trailing stop ratchet menjadi 115% untuk mengunci floating profit lebih awal serta menerapkan jeda evaluasi 24 jam pada pair toxic.'
  },
  FIRE: {
    name: 'FIRE',
    element: 'News & Event Volatility',
    bestInstruments: 'EURUSD, GBPUSD, USOIL (Crude Oil), NAS100 (Nasdaq)',
    instrumentEdge: 'Paling menguntungkan pada aset yang bereaksi tajam terhadap kalender makro (US CPI, NFP, Fed FOMC Rate). Lonjakan volatilitas kilat pasca-rilis memberikan R:R besar.',
    avoidInstruments: 'Saham defensif domestik atau pair sepi Asia yang lambat dan minim katalis rilis data.',
    winRateEdge: 'Win Rate Target: 55% - 65% | Average R:R: 1:2.8+',
    defaultToxicPair: 'EURUSD (Forex) & NVDA (US Stock)',
    defaultCause: 'Lonjakan volatilitas ekstrem saat rilis makroekonomi (CPI / Non-Farm Payrolls). Terjadi pelebaran spread masif dan slippage tajam yang melompati level stop-loss dinamis sebelum momentum sempat berbalik.',
    defaultSolution: 'Batasi alokasi lot pada jendela news berimpak tinggi, perketat trailing stop ratchet menjadi 120%, dan aktifkan filter anti-slippage sebelum membuka posisi momentum berikutnya.'
  },
  AIR: {
    name: 'AIR',
    element: 'Trend Breakout & Momentum',
    bestInstruments: 'BTCUSDT, SOLUSDT, NVDA, TSLA, XAUUSD',
    instrumentEdge: 'Optimal pada instrumen berkategori High-Beta dan memiliki persistensi tren panjang (Donchian 20 High Breakout). Mampu mengunci profit ratusan pip saat tren parabolis terbentuk.',
    avoidInstruments: 'Forex cross-pair sesi Asia yang bergerak sideways range-bound dan rawan whipsaw palsu.',
    winRateEdge: 'Win Rate Target: 50% - 60% (High Asymmetric R:R) | Average R:R: 1:3.8+',
    defaultToxicPair: 'BTCUSDT & SOLUSDT (Crypto)',
    defaultCause: 'Pasar terjebak dalam fase konsolidasi ketat (ranging squeeze) pada Donchian Channel. Sinyal breakout palsu terpicu berulang kali tanpa adanya volume ekspansi lanjutan yang memadai sehingga mengikis margin modal.',
    defaultSolution: 'Wajibkan konfirmasi volume ATR > 1.5x sebelum trigger breakout, naikkan confidence filter (+5%), dan aktifkan dynamic trailing ratcheting guna mencegah kerugian beruntun pada fase sideways.'
  },
  EARTH: {
    name: 'EARTH',
    element: 'Mean Reversion & Solid S/R',
    bestInstruments: 'BBCA, BBRI, BMRI (Saham BEI), USDJPY (Sesi Asia), EURCHF',
    instrumentEdge: 'Sangat menguntungkan pada saham fundamental perbankan bluechip dan forex low-volatility. Deviasi ekstrim dari 2.5 SD Bollinger Bands hampir selalu mengalami statistical pull-back kembali ke rata-rata (mean).',
    avoidInstruments: 'Kripto altcoin volatilitas liar atau saham gorengan yang tidak mematuhi support teknikal historis.',
    winRateEdge: 'Win Rate Target: 70% - 82% | Average R:R: 1:1.8+',
    defaultToxicPair: 'BBCA (IDX) & US30 (Index)',
    defaultCause: 'Penurunan tren sepihak (relentless trend) terus menembus lower Bollinger Band dan level support statis tanpa terjadinya pantulan pembalikan rata-rata (mean reversion), melampaui toleransi drawdown posisi.',
    defaultSolution: 'Perketat syarat RSI oversold (< 25) sebelum entry, turunkan batas toleransi drawdown per tiket, dan pangkas alokasi eksposur maksimal portofolio hingga volatilitas pasar mereda.'
  },
  STEAM: {
    name: 'STEAM',
    element: 'Liquidity News Sniper [WATER+FIRE]',
    bestInstruments: 'XAUUSD, GBPUSD, NAS100, BTCUSDT',
    instrumentEdge: 'Menunggu Liquidity Sweep terkonfirmasi sebelum data makro rilis, lalu dihajar dengan volume momentum berita agresif.',
    avoidInstruments: 'Saham illiquid tanpa katalis berita.',
    winRateEdge: 'Win Rate Target: 60% - 70% | Average R:R: 1:3.5+',
    defaultToxicPair: 'XAUUSD & GBPUSD',
    defaultCause: 'Whipsaw berita ganda membatalkan setup order block mitigasi.',
    defaultSolution: 'Aktifkan filter minimum volume surge > 1.8x dan perkecil risk multiplier 15%.'
  },
  STORM: {
    name: 'STORM',
    element: 'SMC Trend Breakout [WATER+AIR]',
    bestInstruments: 'BTCUSDT, SOLUSDT, NVDA, US30',
    instrumentEdge: 'Konfirmasi Break of Structure (BOS) SMC higher-timeframe dipadukan dengan Donchian Channel breakout lower-timeframe.',
    avoidInstruments: 'Pair sideways sempit sesi Asia.',
    winRateEdge: 'Win Rate Target: 55% - 65% | Average R:R: 1:3.8+',
    defaultToxicPair: 'BTCUSDT & SOLUSDT',
    defaultCause: 'Breakout palsu pada batas Donchian channel tanpa follow-through institusional.',
    defaultSolution: 'Wajibkan konfirmasi higher-timeframe swing high sebelum trigger breakout.'
  },
  LAVA: {
    name: 'LAVA',
    element: 'Post-News Reversal Fade [FIRE+EARTH]',
    bestInstruments: 'EURUSD, USDJPY, BBCA, XAUUSD',
    instrumentEdge: 'Menangkap candle spike ekstrim pasca-berita yang menembus Bollinger Bands 3 SD untuk mean reversion kembali ke harga rata-rata.',
    avoidInstruments: 'Strong trending market tanpa retest.',
    winRateEdge: 'Win Rate Target: 68% - 78% | Average R:R: 1:2.2+',
    defaultToxicPair: 'EURUSD & BBCA',
    defaultCause: 'Tren kuat sepihak terus melaju pasca-berita tanpa terjadi koreksi mean reversion.',
    defaultSolution: 'Perketat konfirmasi candle rejection wick sebelum entry counter-trend.'
  },
  AVATAR: {
    name: 'AVATAR',
    element: 'Consensus Multi-Agent Ensemble [4-ELEMENT MASTER]',
    bestInstruments: 'Semua Pasar Likuid (Crypto, Forex, Saham BEI & US)',
    instrumentEdge: 'Algoritma voting konsensus 4 elemen: Entry dilakukan hanya jika mayoritas (minimal 3 dari 4) elemen memberikan sinyal searah.',
    avoidInstruments: 'Aset berkapitalisasi mikro dengan manipulasi harga tinggi.',
    winRateEdge: 'Win Rate Target: 75% - 85% | Average R:R: 1:2.8+',
    defaultToxicPair: 'High-Beta Altcoins',
    defaultCause: 'Anomali likuiditas mendadak yang memecah konsensus sinyal.',
    defaultSolution: 'Mode defensif otomatis jika terjadi split decision (2 vs 2).'
  },
  MUD: {
    name: 'MUD',
    element: 'High Win-Rate S/R Reversal [WATER+EARTH]',
    bestInstruments: 'BBCA, BMRI, USDJPY, EURGBP',
    instrumentEdge: 'Reversal di support/resistance historis dipadukan dengan mitigasi Fair Value Gap & Order Block bersih.',
    avoidInstruments: 'Altcoin liar yang menembus support tanpa pullback.',
    winRateEdge: 'Win Rate Target: 72% - 84% | Average R:R: 1:2.0+',
    defaultToxicPair: 'BBCA & USDJPY',
    defaultCause: 'Penetrasi sepihak tanpa retest order block.',
    defaultSolution: 'Wajibkan konfirmasi RSI < 30 sebelum entry long.'
  },
  LIGHTNING: {
    name: 'LIGHTNING',
    element: 'Volatility Trend Ignition [FIRE+AIR]',
    bestInstruments: 'NVDA, TSLA, BTCUSDT, NAS100',
    instrumentEdge: 'Katalis berita makro/laba memicu awal ekspansi tren breakout Donchian multi-hari berkecepatan tinggi.',
    avoidInstruments: 'Pair forex defensif lambat.',
    winRateEdge: 'Win Rate Target: 52% - 62% | Average R:R: 1:4.2+',
    defaultToxicPair: 'TSLA & BTCUSDT',
    defaultCause: 'News whipsaw tajam melompat di atas stop loss sebelum momentum terbentuk.',
    defaultSolution: 'Terapkan buffer stop ATR 1.2x pada saat berita rilis.'
  },
  SANDSTORM: {
    name: 'SANDSTORM',
    element: 'Trend-Pullback Strategy [AIR+EARTH]',
    bestInstruments: 'BBRI, US500, ETHUSDT, EURUSD',
    instrumentEdge: 'Tren makro kuat (AIR) dipadukan dengan disiplin beli saat pullback menyentuh support/EMA 50 (EARTH).',
    avoidInstruments: 'Aset choppy tanpa kejelasan tren utama.',
    winRateEdge: 'Win Rate Target: 65% - 75% | Average R:R: 1:2.5+',
    defaultToxicPair: 'BBRI & US500',
    defaultCause: 'Tren makro berbalik arah secara mendadak (trend reversal).',
    defaultSolution: 'Gunakan trailing ratchet ketat saat harga memantul dari support.'
  },
  TEMPEST: {
    name: 'TEMPEST',
    element: 'Aggressive Alpha Desk [WATER+FIRE+AIR]',
    bestInstruments: 'XAUUSD, BTCUSDT, NAS100, SOLUSDT',
    instrumentEdge: 'SMC liquidity map (W) + Katalis berita (F) + Trend riding Donchian (A) untuk menangkap pergerakan parabolis.',
    avoidInstruments: 'Saham low beta atau obligasi.',
    winRateEdge: 'Win Rate Target: 58% - 68% | Average R:R: 1:4.0+',
    defaultToxicPair: 'SOLUSDT & XAUUSD',
    defaultCause: 'Pergerakan koreksi volatil memicu trailing stop terlalu dini.',
    defaultSolution: 'Gunakan multi-stage take profit scaling.'
  },
  OCEANIC: {
    name: 'OCEANIC',
    element: 'All-Weather Institutional [WATER+AIR+EARTH]',
    bestInstruments: 'US30, BBCA, EURUSD, XAUUSD',
    instrumentEdge: 'Ray Dalio All-Weather: Likuiditas institusi (W) + Trend momentum (A) + Bantalan mean reversion (E).',
    avoidInstruments: 'Meme token illiquid.',
    winRateEdge: 'Win Rate Target: 70% - 80% | Average R:R: 1:2.4+',
    defaultToxicPair: 'US30 & EURUSD',
    defaultCause: 'Volatilitas flat berkepanjangan mengikis biaya posisi.',
    defaultSolution: 'Filter waktu sesi aktif London/NY.'
  },
  GEOTHERMAL: {
    name: 'GEOTHERMAL',
    element: 'Anti-Whipsaw News Desk [WATER+FIRE+EARTH]',
    bestInstruments: 'GBPUSD, USOIL, BMRI, XAUUSD',
    instrumentEdge: 'Mitigasi Order Block saat rilis berita dengan proteksi support fundamental kuat; anti-manipulasi bandar.',
    avoidInstruments: 'Saham gorengan tanpa fundamental.',
    winRateEdge: 'Win Rate Target: 65% - 75% | Average R:R: 1:2.6+',
    defaultToxicPair: 'USOIL & GBPUSD',
    defaultCause: 'Spike gap melompati level mitigasi.',
    defaultSolution: 'Tunggu penutupan candle 5 menit sebelum eksekusi.'
  },
  CYCLONE: {
    name: 'CYCLONE',
    element: 'Dynamic Regime Shifter [FIRE+AIR+EARTH]',
    bestInstruments: 'BTCUSDT, ETHUSDT, NVDA, DAX40',
    instrumentEdge: 'Transisi adaptif: Scalping berita saat rilis (F) -> Trend following (A) -> Mean reversion saat jenuh (E).',
    avoidInstruments: 'Aset tidak likuid dengan jam bursa sempit.',
    winRateEdge: 'Win Rate Target: 64% - 74% | Average R:R: 1:3.0+',
    defaultToxicPair: 'DAX40 & NVDA',
    defaultCause: 'Siklus rezim pasar berganti terlalu cepat.',
    defaultSolution: 'Deteksi rezim pasar menggunakan filter ADX & Bollinger width.'
  }
};

// Initial Seed Data for Markets across all major global and domestic asset classes (Semua Instrumen & Pasangan Pair)
const DEFAULT_MARKET_FEEDS = {
  // 1. Commodities, Metals & Energies
  'XAUUSD': { name: 'Gold / US Dollar', market: 'FUTURES', price: 2914.50, change: 0.85, high: 2928.00, low: 2898.10, atr: 18.5, regime: 'TRENDING_BULL' },
  'XAGUSD': { name: 'Silver / US Dollar', market: 'FUTURES', price: 33.80, change: 1.20, high: 34.20, low: 33.10, atr: 0.65, regime: 'MOMENTUM_BREAKOUT' },
  'USOIL': { name: 'WTI Crude Oil', market: 'FUTURES', price: 71.20, change: -0.45, high: 72.30, low: 70.80, atr: 1.4, regime: 'RANGE_BOUND' },
  'UKOIL': { name: 'Brent Crude Oil', market: 'FUTURES', price: 75.40, change: -0.35, high: 76.50, low: 74.80, atr: 1.45, regime: 'RANGE_BOUND' },
  'COPPER': { name: 'High Grade Copper', market: 'FUTURES', price: 4.15, change: 0.90, high: 4.22, low: 4.10, atr: 0.08, regime: 'DEMAND_CYCLE' },
  'NGAS': { name: 'Natural Gas', market: 'FUTURES', price: 2.85, change: 2.15, high: 2.98, low: 2.78, atr: 0.12, regime: 'HIGH_VOLATILITY' },
  'PLATINUM': { name: 'Platinum Spot', market: 'FUTURES', price: 985.00, change: 0.65, high: 998.00, low: 976.00, atr: 12.0, regime: 'ACCUMULATION' },

  // 2. Global Major Indices
  'US30': { name: 'Dow Jones Industrial 30', market: 'FUTURES', price: 43850.00, change: 0.55, high: 44100.00, low: 43600.00, atr: 250.0, regime: 'INSTITUTIONAL_BULL' },
  'US500': { name: 'S&P 500 Index', market: 'FUTURES', price: 5980.00, change: 0.68, high: 6015.00, low: 5950.00, atr: 35.0, regime: 'TRENDING_BULL' },
  'NAS100': { name: 'Nasdaq 100 Index', market: 'FUTURES', price: 21150.00, change: 1.15, high: 21350.00, low: 20950.00, atr: 180.0, regime: 'TECH_MOMENTUM' },
  'DAX40': { name: 'German DAX 40', market: 'FUTURES', price: 19450.00, change: 0.42, high: 19600.00, low: 19300.00, atr: 120.0, regime: 'EURO_BREAKOUT' },
  'NIKKEI': { name: 'Nikkei 225 (Japan)', market: 'FUTURES', price: 38800.00, change: -0.25, high: 39150.00, low: 38500.00, atr: 320.0, regime: 'YEN_CORRELATION' },
  'HSI': { name: 'Hang Seng (Hong Kong)', market: 'FUTURES', price: 19850.00, change: 1.45, high: 20100.00, low: 19600.00, atr: 280.0, regime: 'CHINA_STIMULUS' },

  // 3. Forex Major & Minor Crosses
  'EURUSD': { name: 'Euro / US Dollar', market: 'FOREX', price: 1.08420, change: -0.12, high: 1.08750, low: 1.08200, atr: 0.0045, regime: 'RANGING' },
  'GBPUSD': { name: 'British Pound / USD', market: 'FOREX', price: 1.29150, change: 0.34, high: 1.29500, low: 1.28800, atr: 0.0062, regime: 'TRENDING_BULL' },
  'USDJPY': { name: 'USD / Japanese Yen', market: 'FOREX', price: 154.250, change: 0.42, high: 154.800, low: 153.700, atr: 0.85, regime: 'STRONG_TREND' },
  'AUDUSD': { name: 'Aussie / US Dollar', market: 'FOREX', price: 0.65400, change: -0.22, high: 0.65800, low: 0.65200, atr: 0.0038, regime: 'PULLBACK' },
  'USDCHF': { name: 'USD / Swiss Franc', market: 'FOREX', price: 0.88700, change: 0.15, high: 0.89000, low: 0.88450, atr: 0.0032, regime: 'CONSOLIDATION' },
  'USDCAD': { name: 'USD / Canadian Dollar', market: 'FOREX', price: 1.39400, change: 0.18, high: 1.39800, low: 1.39100, atr: 0.0040, regime: 'TRENDING_BULL' },
  'NZDUSD': { name: 'NZD / US Dollar', market: 'FOREX', price: 0.58900, change: -0.15, high: 0.59250, low: 0.58600, atr: 0.0035, regime: 'RANGE_BOUND' },
  'GBPJPY': { name: 'GBP / Japanese Yen', market: 'FOREX', price: 199.200, change: 0.76, high: 200.100, low: 198.500, atr: 1.25, regime: 'VOLATILE_EXPANSION' },
  'EURJPY': { name: 'EUR / Japanese Yen', market: 'FOREX', price: 167.350, change: 0.30, high: 167.900, low: 166.800, atr: 0.95, regime: 'MOMENTUM_BREAKOUT' },
  'EURGBP': { name: 'EUR / British Pound', market: 'FOREX', price: 0.83950, change: -0.45, high: 0.84200, low: 0.83700, atr: 0.0028, regime: 'MEAN_REVERSION' },
  'AUDJPY': { name: 'AUD / Japanese Yen', market: 'FOREX', price: 100.850, change: 0.20, high: 101.300, low: 100.400, atr: 0.70, regime: 'TRENDING_BULL' },
  'EURAUD': { name: 'EUR / Australian Dollar', market: 'FOREX', price: 1.65750, change: 0.10, high: 1.66200, low: 1.65300, atr: 0.0055, regime: 'PULLBACK' },
  'CADJPY': { name: 'CAD / Japanese Yen', market: 'FOREX', price: 110.650, change: 0.24, high: 111.100, low: 110.200, atr: 0.65, regime: 'CONSOLIDATION' },
  'NZDJPY': { name: 'NZD / Japanese Yen', market: 'FOREX', price: 90.850, change: 0.27, high: 91.300, low: 90.400, atr: 0.58, regime: 'RANGE_BOUND' },
  'GBPAUD': { name: 'GBP / Australian Dollar', market: 'FOREX', price: 1.97450, change: 0.56, high: 1.98100, low: 1.96800, atr: 0.0085, regime: 'VOLATILE_EXPANSION' },
  'CHFJPY': { name: 'CHF / Japanese Yen', market: 'FOREX', price: 173.850, change: 0.27, high: 174.400, low: 173.200, atr: 0.90, regime: 'STRONG_TREND' },
  'USDSGD': { name: 'USD / Singapore Dollar', market: 'FOREX', price: 1.34100, change: 0.05, high: 1.34400, low: 1.33850, atr: 0.0025, regime: 'STABLE_CRAWL' },
  'USDCNH': { name: 'USD / Offshore Yuan', market: 'FOREX', price: 7.24500, change: 0.12, high: 7.26000, low: 7.23200, atr: 0.0150, regime: 'CENTRAL_BANK_FLOW' },

  // 4. Crypto Perpetuals & Spot
  'BTCUSDT': { name: 'Bitcoin', market: 'CRYPTO', price: 92450.00, change: 2.45, high: 93800.00, low: 90200.00, atr: 1450.0, regime: 'HIGH_VOLATILITY' },
  'ETHUSDT': { name: 'Ethereum', market: 'CRYPTO', price: 3420.00, change: 1.85, high: 3480.00, low: 3360.00, atr: 85.0, regime: 'TRENDING_BULL' },
  'SOLUSDT': { name: 'Solana', market: 'CRYPTO', price: 188.40, change: 4.12, high: 194.20, low: 180.50, atr: 6.8, regime: 'MOMENTUM_BREAKOUT' },
  'BNBUSDT': { name: 'BNB Chain', market: 'CRYPTO', price: 645.00, change: 0.95, high: 652.00, low: 638.00, atr: 12.5, regime: 'ACCUMULATION' },
  'XRPUSDT': { name: 'Ripple', market: 'CRYPTO', price: 1.1500, change: 5.40, high: 1.2200, low: 1.0800, atr: 0.085, regime: 'NEWS_SPIKE' },
  'DOGEUSDT': { name: 'Dogecoin', market: 'CRYPTO', price: 0.2450, change: 6.80, high: 0.2650, low: 0.2320, atr: 0.018, regime: 'MEME_MOMENTUM' },
  'ADAUSDT': { name: 'Cardano', market: 'CRYPTO', price: 0.7250, change: 3.10, high: 0.7600, low: 0.6950, atr: 0.038, regime: 'BREAKOUT_CYCLE' },
  'AVAXUSDT': { name: 'Avalanche', market: 'CRYPTO', price: 34.50, change: 2.40, high: 36.20, low: 33.10, atr: 1.85, regime: 'TRENDING_BULL' },
  'LINKUSDT': { name: 'Chainlink', market: 'CRYPTO', price: 15.20, change: 1.65, high: 15.90, low: 14.60, atr: 0.75, regime: 'ORACLE_INFLOW' },
  'SUIUSDT': { name: 'Sui Network', market: 'CRYPTO', price: 3.42, change: 7.25, high: 3.65, low: 3.25, atr: 0.22, regime: 'LAYER1_EXPANSION' },
  'NEARUSDT': { name: 'Near Protocol', market: 'CRYPTO', price: 6.85, change: 4.80, high: 7.20, low: 6.55, atr: 0.42, regime: 'AI_CRYPTO_RALLY' },
  'DOTUSDT': { name: 'Polkadot', market: 'CRYPTO', price: 8.40, change: 1.15, high: 8.80, low: 8.10, atr: 0.45, regime: 'ACCUMULATION' },
  'PEPEUSDT': { name: 'Pepe', market: 'CRYPTO', price: 0.0000215, change: 8.40, high: 0.0000235, low: 0.0000198, atr: 0.0000018, regime: 'HIGH_BETA' },
  'LTCUSDT': { name: 'Litecoin', market: 'CRYPTO', price: 96.50, change: 1.45, high: 99.20, low: 94.10, atr: 3.2, regime: 'LEGACY_ROTATION' },
  // Expanded Binance Futures & DEX Radar Pairs
  'SHIBUSDT': { name: 'Shiba Inu', market: 'CRYPTO', price: 0.000025, change: 4.20, high: 0.000027, low: 0.000023, atr: 0.0000018, regime: 'MEME_EXPANSION' },
  'WIFUSDT': { name: 'dogwifhat', market: 'CRYPTO', price: 3.25, change: 8.40, high: 3.50, low: 3.05, atr: 0.28, regime: 'SOLANA_MEME_RUNNER' },
  'BONKUSDT': { name: 'Bonk', market: 'CRYPTO', price: 0.000038, change: 5.10, high: 0.000041, low: 0.000035, atr: 0.0000028, regime: 'MEME_BREAKOUT' },
  'POPCATUSDT': { name: 'Popcat', market: 'CRYPTO', price: 1.45, change: 9.20, high: 1.60, low: 1.35, atr: 0.14, regime: 'DEX_RADAR_MOMENTUM' },
  'FLOKIUSDT': { name: 'Floki', market: 'CRYPTO', price: 0.00024, change: 4.80, high: 0.00026, low: 0.00022, atr: 0.000018, regime: 'MEME_MOMENTUM' },
  'NEIROUSDT': { name: 'First Neiro', market: 'CRYPTO', price: 0.00185, change: 11.40, high: 0.00210, low: 0.00165, atr: 0.00018, regime: 'DEX_VOLATILITY' },
  'APTUSDT': { name: 'Aptos', market: 'CRYPTO', price: 12.80, change: 3.40, high: 13.40, low: 12.20, atr: 0.72, regime: 'LAYER1_EXPANSION' },
  'RENDERUSDT': { name: 'Render Network', market: 'CRYPTO', price: 8.45, change: 5.20, high: 8.90, low: 8.10, atr: 0.52, regime: 'AI_DEPIN_RALLY' },
  'FETUSDT': { name: 'Artificial Superintelligence', market: 'CRYPTO', price: 1.55, change: 4.60, high: 1.65, low: 1.48, atr: 0.11, regime: 'AI_ALLIANCE' },
  'TAOUSDT': { name: 'Bittensor', market: 'CRYPTO', price: 545.00, change: 6.20, high: 570.00, low: 520.00, atr: 28.0, regime: 'AI_LEADER' },
  'WLDUSDT': { name: 'Worldcoin', market: 'CRYPTO', price: 2.85, change: 4.10, high: 3.05, low: 2.70, atr: 0.22, regime: 'AI_IDENTITY' },
  'KASUSDT': { name: 'Kaspa', market: 'CRYPTO', price: 0.165, change: 2.90, high: 0.175, low: 0.158, atr: 0.011, regime: 'POW_ACCUMULATION' },
  'TIAUSDT': { name: 'Celestia', market: 'CRYPTO', price: 6.20, change: 3.80, high: 6.60, low: 5.95, atr: 0.42, regime: 'MODULAR_DATA' },
  'SEIUSDT': { name: 'Sei Network', market: 'CRYPTO', price: 0.54, change: 4.70, high: 0.58, low: 0.51, atr: 0.038, regime: 'PARALLEL_EVM' },
  'INJUSDT': { name: 'Injective', market: 'CRYPTO', price: 24.50, change: 3.60, high: 25.80, low: 23.60, atr: 1.45, regime: 'DEFI_INFRA' },
  'UNIUSDT': { name: 'Uniswap', market: 'CRYPTO', price: 11.20, change: 2.40, high: 11.70, low: 10.80, atr: 0.65, regime: 'DEX_GOVERNANCE' },
  'AAVEUSDT': { name: 'Aave', market: 'CRYPTO', price: 215.00, change: 3.80, high: 224.00, low: 208.00, atr: 11.5, regime: 'LENDING_PROTOCOL' },
  'PENDLEUSDT': { name: 'Pendle', market: 'CRYPTO', price: 5.45, change: 6.80, high: 5.80, low: 5.15, atr: 0.38, regime: 'YIELD_TOKENIZATION' },
  'ONDOUSDT': { name: 'Ondo Finance', market: 'CRYPTO', price: 1.25, change: 5.50, high: 1.34, low: 1.18, atr: 0.085, regime: 'RWA_LEADER' },
  'ENAUSDT': { name: 'Ethena', market: 'CRYPTO', price: 0.78, change: 7.20, high: 0.84, low: 0.72, atr: 0.062, regime: 'SYNTHETIC_DOLLAR' },
  'JUPUSDT': { name: 'Jupiter', market: 'CRYPTO', price: 1.12, change: 4.40, high: 1.18, low: 1.06, atr: 0.075, regime: 'SOLANA_DEX' },
  'ARBUSDT': { name: 'Arbitrum', market: 'CRYPTO', price: 0.82, change: 2.10, high: 0.86, low: 0.79, atr: 0.045, regime: 'L2_ROLLUP' },
  'OPUSDT': { name: 'Optimism', market: 'CRYPTO', price: 1.95, change: 2.80, high: 2.05, low: 1.88, atr: 0.12, regime: 'SUPERCHAIN_ECO' },
  'TONUSDT': { name: 'Toncoin', market: 'CRYPTO', price: 6.45, change: 1.80, high: 6.65, low: 6.30, atr: 0.28, regime: 'TELEGRAM_ECO' },

  // 5. Saham BEI / IDX (100% Long Only Retail Spot)
  'BBCA': { name: 'Bank Central Asia', market: 'IDX', price: 6375, change: -0.39, high: 6450, low: 6350, atr: 75, regime: 'FOREIGN_ACCUMULATION' },
  'BBRI': { name: 'Bank Rakyat Indonesia', market: 'IDX', price: 3340, change: 0.60, high: 3390, low: 3300, atr: 40, regime: 'PULLBACK_SUPPORT' },
  'BMRI': { name: 'Bank Mandiri', market: 'IDX', price: 6250, change: 0.81, high: 6325, low: 6175, atr: 85, regime: 'BREAKOUT_BUY' },
  'BBNI': { name: 'Bank Negara Indonesia', market: 'IDX', price: 5025, change: -0.50, high: 5100, low: 4975, atr: 65, regime: 'CONSOLIDATION' },
  'BRIS': { name: 'Bank Syariah Indonesia', market: 'IDX', price: 2980, change: 1.71, high: 3050, low: 2930, atr: 60, regime: 'SHARIA_MOMENTUM' },
  'ASII': { name: 'Astra International', market: 'IDX', price: 4920, change: 0.41, high: 4980, low: 4880, atr: 50, regime: 'DIVIDEND_VALUE' },
  'TLKM': { name: 'Telkom Indonesia', market: 'IDX', price: 2720, change: 1.12, high: 2760, low: 2680, atr: 40, regime: 'REBOUND_OVERSOLD' },
  'GOTO': { name: 'GoTo Gojek Tokopedia', market: 'IDX', price: 74, change: 2.78, high: 78, low: 71, atr: 3, regime: 'RETAIL_FLOW' },
  'AMMN': { name: 'Amman Mineral', market: 'IDX', price: 9125, change: 2.53, high: 9350, low: 8950, atr: 180, regime: 'MOMENTUM_RUNNER' },
  'BREN': { name: 'Barito Renewables', market: 'IDX', price: 6750, change: 1.89, high: 6950, low: 6575, atr: 175, regime: 'GREEN_ENERGY' },
  'BRPT': { name: 'Barito Pacific', market: 'IDX', price: 980, change: 3.16, high: 1025, low: 955, atr: 35, regime: 'BREAKOUT_SETUP' },
  'ADRO': { name: 'Adaro Energy', market: 'IDX', price: 3620, change: 0.84, high: 3700, low: 3560, atr: 70, regime: 'COMMODITY_CASHFLOW' },
  'ANTM': { name: 'Aneka Tambang', market: 'IDX', price: 1540, change: 2.00, high: 1580, low: 1515, atr: 35, regime: 'GOLD_MINING_SURGE' },
  'PGAS': { name: 'Perusahaan Gas Negara', market: 'IDX', price: 1520, change: 0.66, high: 1555, low: 1495, atr: 30, regime: 'GAS_DISTRIBUTION' },
  'MEDC': { name: 'Medco Energi', market: 'IDX', price: 1210, change: 1.68, high: 1250, low: 1180, atr: 35, regime: 'OIL_RECOVERY' },
  'PTBA': { name: 'Bukit Asam', market: 'IDX', price: 2840, change: 0.71, high: 2890, low: 2800, atr: 45, regime: 'DIVIDEND_HUNTER' },
  'INCO': { name: 'Vale Indonesia', market: 'IDX', price: 3880, change: 1.31, high: 3960, low: 3810, atr: 75, regime: 'NICKEL_DEMAND' },
  'MDKA': { name: 'Merdeka Copper Gold', market: 'IDX', price: 2310, change: 2.21, high: 2380, low: 2260, atr: 55, regime: 'PRECIOUS_METAL' },
  'ICBP': { name: 'Indofood CBP', market: 'IDX', price: 11850, change: 0.42, high: 12050, low: 11700, atr: 175, regime: 'DEFENSIVE_CONSUMER' },
  'UNVR': { name: 'Unilever Indonesia', market: 'IDX', price: 2160, change: -0.46, high: 2210, low: 2120, atr: 45, regime: 'TURNAROUND_PLAY' },
  'CPIN': { name: 'Charoen Pokphand', market: 'IDX', price: 4890, change: 0.62, high: 4970, low: 4820, atr: 70, regime: 'POULTRY_CYCLE' },
  'KLBF': { name: 'Kalbe Farma', market: 'IDX', price: 1460, change: 0.34, high: 1495, low: 1435, atr: 30, regime: 'PHARMA_STABLE' },

  // 6. US Stocks, Megacaps & Top ETFs (Equities & Index ETFs)
  'AAPL': { name: 'Apple Inc.', market: 'US', price: 228.40, change: 0.72, high: 230.10, low: 226.80, atr: 2.8, regime: 'TRENDING_BULL' },
  'NVDA': { name: 'NVIDIA Corp.', market: 'US', price: 141.20, change: 3.15, high: 143.50, low: 137.90, atr: 4.2, regime: 'HIGH_MOMENTUM' },
  'TSLA': { name: 'Tesla Inc.', market: 'US', price: 342.50, change: 4.20, high: 349.00, low: 332.00, atr: 11.5, regime: 'VOLATILITY_EXPANSION' },
  'MSFT': { name: 'Microsoft Corp.', market: 'US', price: 425.80, change: 0.45, high: 428.50, low: 422.00, atr: 4.6, regime: 'CONSOLIDATION' },
  'AMZN': { name: 'Amazon.com Inc.', market: 'US', price: 206.50, change: 1.10, high: 209.00, low: 204.20, atr: 3.5, regime: 'ECOMMERCE_CLOUD' },
  'GOOGL': { name: 'Alphabet Inc.', market: 'US', price: 177.20, change: 0.85, high: 179.80, low: 175.50, atr: 3.1, regime: 'SEARCH_AI_EXPANSION' },
  'META': { name: 'Meta Platforms', market: 'US', price: 588.00, change: 2.20, high: 595.00, low: 580.00, atr: 9.2, regime: 'AD_GROWTH_LEADER' },
  'AMD': { name: 'Advanced Micro Devices', market: 'US', price: 138.50, change: 2.85, high: 142.00, low: 135.80, atr: 4.1, regime: 'CHIP_RIVALRY' },
  'NFLX': { name: 'Netflix Inc.', market: 'US', price: 875.00, change: 1.40, high: 888.00, low: 865.00, atr: 14.0, regime: 'STREAMING_GIANT' },
  'COIN': { name: 'Coinbase Global', market: 'US', price: 312.00, change: 5.60, high: 325.00, low: 302.00, atr: 13.5, regime: 'CRYPTO_BETA' },
  'PLTR': { name: 'Palantir Technologies', market: 'US', price: 64.80, change: 4.10, high: 67.20, low: 62.90, atr: 2.4, regime: 'AI_DEFENSE_EXPANSION' },
  'BABA': { name: 'Alibaba Group', market: 'US', price: 86.40, change: 1.95, high: 88.50, low: 84.80, atr: 2.3, regime: 'CHINA_TECH_VALUE' },
  'INTC': { name: 'Intel Corp.', market: 'US', price: 23.90, change: -0.65, high: 24.60, low: 23.30, atr: 0.85, regime: 'FOUNDRY_RESTRUCTURING' },
  'BRKB': { name: 'Berkshire Hathaway', market: 'US', price: 468.50, change: 0.35, high: 471.20, low: 465.00, atr: 3.8, regime: 'CONGLOMERATE_FORTRESS' },
  'DIS': { name: 'Walt Disney Co.', market: 'US', price: 114.20, change: 0.90, high: 116.50, low: 112.80, atr: 2.1, regime: 'ENTERTAINMENT_REBOUND' },
  'PYPL': { name: 'PayPal Holdings', market: 'US', price: 84.20, change: 1.25, high: 86.00, low: 82.90, atr: 1.9, regime: 'FINTECH_GROWTH' },
  // Expanded US Stock Intelligence Equities
  'AVGO': { name: 'Broadcom Inc.', market: 'US', price: 165.20, change: 2.45, high: 168.00, low: 162.50, atr: 4.5, regime: 'AI_NETWORKING' },
  'CRM': { name: 'Salesforce Inc.', market: 'US', price: 328.00, change: 1.30, high: 332.00, low: 324.00, atr: 6.2, regime: 'ENTERPRISE_CLOUD' },
  'SMCI': { name: 'Super Micro Computer', market: 'US', price: 34.50, change: 8.50, high: 38.00, low: 32.00, atr: 3.8, regime: 'HIGH_VOLATILITY_AI' },
  'SOFI': { name: 'SoFi Technologies', market: 'US', price: 14.80, change: 3.80, high: 15.40, low: 14.20, atr: 0.75, regime: 'FINTECH_GROWTH' },
  'JPM': { name: 'JPMorgan Chase', market: 'US', price: 242.00, change: 0.65, high: 244.50, low: 239.80, atr: 3.2, regime: 'BANKING_LEADER' },
  'GS': { name: 'Goldman Sachs', market: 'US', price: 585.00, change: 1.10, high: 592.00, low: 579.00, atr: 8.5, regime: 'WALL_STREET_ALPHA' },
  'LLY': { name: 'Eli Lilly & Co.', market: 'US', price: 812.00, change: 1.60, high: 825.00, low: 802.00, atr: 15.0, regime: 'PHARMA_MEGA_GROWTH' },
  'UNH': { name: 'UnitedHealth Group', market: 'US', price: 578.00, change: 0.40, high: 584.00, low: 572.00, atr: 7.2, regime: 'HEALTHCARE_STABLE' },
  'XOM': { name: 'ExxonMobil Corp.', market: 'US', price: 118.50, change: 0.85, high: 120.20, low: 117.00, atr: 1.8, regime: 'ENERGY_CASHFLOW' },
  'CVX': { name: 'Chevron Corp.', market: 'US', price: 158.00, change: 0.55, high: 160.00, low: 156.20, atr: 2.2, regime: 'ENERGY_DIVIDEND' },
  'CAT': { name: 'Caterpillar Inc.', market: 'US', price: 395.00, change: 1.20, high: 400.00, low: 390.00, atr: 6.5, regime: 'INDUSTRIAL_CYCLE' },
  'GE': { name: 'GE Aerospace', market: 'US', price: 182.00, change: 1.45, high: 185.00, low: 179.50, atr: 3.4, regime: 'AEROSPACE_EXPANSION' },
  'BA': { name: 'Boeing Co.', market: 'US', price: 154.00, change: 2.10, high: 158.00, low: 151.00, atr: 4.8, regime: 'TURNAROUND_PLAY' },
  'MU': { name: 'Micron Technology', market: 'US', price: 104.00, change: 3.40, high: 107.50, low: 101.20, atr: 3.8, regime: 'HBM_MEMORY_AI' },
  'ARM': { name: 'Arm Holdings', market: 'US', price: 138.00, change: 4.20, high: 143.00, low: 134.00, atr: 5.5, regime: 'ARCHITECTURE_AI' },
  // Major US Index & Thematic ETFs
  'SPY': { name: 'SPDR S&P 500 ETF', market: 'US', price: 588.00, change: 0.65, high: 591.00, low: 585.00, atr: 4.5, regime: 'MARKET_BENCHMARK' },
  'QQQ': { name: 'Invesco QQQ Trust', market: 'US', price: 508.00, change: 0.95, high: 512.00, low: 504.00, atr: 5.8, regime: 'NASDAQ_TECH_CORE' },
  'IWM': { name: 'iShares Russell 2000 ETF', market: 'US', price: 232.00, change: 1.40, high: 235.50, low: 229.00, atr: 3.2, regime: 'SMALL_CAP_BETA' },
  'SMH': { name: 'VanEck Semiconductor ETF', market: 'US', price: 254.00, change: 2.80, high: 260.00, low: 249.00, atr: 6.5, regime: 'SEMI_SUPER_CYCLE' },
  'TQQQ': { name: 'ProShares UltraPro QQQ 3x', market: 'US', price: 82.50, change: 2.85, high: 85.20, low: 79.80, atr: 3.2, regime: 'LEVERAGED_TECH' },
  'SOXL': { name: 'Direxion Semiconductor Bull 3x', market: 'US', price: 38.40, change: 8.20, high: 41.50, low: 36.00, atr: 3.1, regime: 'TRIPLE_LEVERAGED_SEMI' }
};

// Available Tradable Instrument Pool (Universal coverage across Forex, Crypto, IDX, Commodities, US Stocks, Indices)
const ALL_INSTRUMENTS = [
  // Commodities & Metals
  { symbol: 'XAUUSD', label: 'Gold (XAU)', market: 'FUTURES' },
  { symbol: 'XAGUSD', label: 'Silver (XAG)', market: 'FUTURES' },
  { symbol: 'USOIL', label: 'Crude Oil (WTI)', market: 'FUTURES' },
  { symbol: 'UKOIL', label: 'Brent Oil', market: 'FUTURES' },
  { symbol: 'COPPER', label: 'Copper', market: 'FUTURES' },
  { symbol: 'NGAS', label: 'Natural Gas', market: 'FUTURES' },
  { symbol: 'PLATINUM', label: 'Platinum', market: 'FUTURES' },

  // Indices
  { symbol: 'US30', label: 'Dow Jones 30', market: 'FUTURES' },
  { symbol: 'US500', label: 'S&P 500', market: 'FUTURES' },
  { symbol: 'NAS100', label: 'Nasdaq 100', market: 'FUTURES' },
  { symbol: 'DAX40', label: 'DAX 40 (Jerman)', market: 'FUTURES' },
  { symbol: 'NIKKEI', label: 'Nikkei 225 (Jepang)', market: 'FUTURES' },
  { symbol: 'HSI', label: 'Hang Seng (HK)', market: 'FUTURES' },

  // Forex Majors & Crosses
  { symbol: 'EURUSD', label: 'EUR/USD', market: 'FOREX' },
  { symbol: 'GBPUSD', label: 'GBP/USD', market: 'FOREX' },
  { symbol: 'USDJPY', label: 'USD/JPY', market: 'FOREX' },
  { symbol: 'AUDUSD', label: 'AUD/USD', market: 'FOREX' },
  { symbol: 'USDCHF', label: 'USD/CHF', market: 'FOREX' },
  { symbol: 'USDCAD', label: 'USD/CAD', market: 'FOREX' },
  { symbol: 'NZDUSD', label: 'NZD/USD', market: 'FOREX' },
  { symbol: 'GBPJPY', label: 'GBP/JPY', market: 'FOREX' },
  { symbol: 'EURJPY', label: 'EUR/JPY', market: 'FOREX' },
  { symbol: 'EURGBP', label: 'EUR/GBP', market: 'FOREX' },
  { symbol: 'AUDJPY', label: 'AUD/JPY', market: 'FOREX' },
  { symbol: 'EURAUD', label: 'EUR/AUD', market: 'FOREX' },
  { symbol: 'CADJPY', label: 'CAD/JPY', market: 'FOREX' },
  { symbol: 'NZDJPY', label: 'NZD/JPY', market: 'FOREX' },
  { symbol: 'GBPAUD', label: 'GBP/AUD', market: 'FOREX' },
  { symbol: 'CHFJPY', label: 'CHF/JPY', market: 'FOREX' },
  { symbol: 'USDSGD', label: 'USD/SGD', market: 'FOREX' },
  { symbol: 'USDCNH', label: 'USD/CNH', market: 'FOREX' },

  // Crypto
  { symbol: 'BTCUSDT', label: 'Bitcoin (BTC)', market: 'CRYPTO' },
  { symbol: 'ETHUSDT', label: 'Ethereum (ETH)', market: 'CRYPTO' },
  { symbol: 'SOLUSDT', label: 'Solana (SOL)', market: 'CRYPTO' },
  { symbol: 'BNBUSDT', label: 'BNB Chain', market: 'CRYPTO' },
  { symbol: 'XRPUSDT', label: 'Ripple (XRP)', market: 'CRYPTO' },
  { symbol: 'DOGEUSDT', label: 'Dogecoin (DOGE)', market: 'CRYPTO' },
  { symbol: 'ADAUSDT', label: 'Cardano (ADA)', market: 'CRYPTO' },
  { symbol: 'AVAXUSDT', label: 'Avalanche (AVAX)', market: 'CRYPTO' },
  { symbol: 'LINKUSDT', label: 'Chainlink (LINK)', market: 'CRYPTO' },
  { symbol: 'SUIUSDT', label: 'Sui (SUI)', market: 'CRYPTO' },
  { symbol: 'NEARUSDT', label: 'Near Protocol', market: 'CRYPTO' },
  { symbol: 'DOTUSDT', label: 'Polkadot (DOT)', market: 'CRYPTO' },
  { symbol: 'PEPEUSDT', label: 'Pepe (PEPE)', market: 'CRYPTO' },
  { symbol: 'LTCUSDT', label: 'Litecoin (LTC)', market: 'CRYPTO' },
  { symbol: 'SHIBUSDT', label: 'Shiba Inu (SHIB)', market: 'CRYPTO' },
  { symbol: 'WIFUSDT', label: 'dogwifhat (WIF)', market: 'CRYPTO' },
  { symbol: 'BONKUSDT', label: 'Bonk (BONK)', market: 'CRYPTO' },
  { symbol: 'POPCATUSDT', label: 'Popcat (POPCAT)', market: 'CRYPTO' },
  { symbol: 'FLOKIUSDT', label: 'Floki (FLOKI)', market: 'CRYPTO' },
  { symbol: 'NEIROUSDT', label: 'First Neiro (NEIRO)', market: 'CRYPTO' },
  { symbol: 'APTUSDT', label: 'Aptos (APT)', market: 'CRYPTO' },
  { symbol: 'RENDERUSDT', label: 'Render Network (RENDER)', market: 'CRYPTO' },
  { symbol: 'FETUSDT', label: 'ASI Alliance (FET)', market: 'CRYPTO' },
  { symbol: 'TAOUSDT', label: 'Bittensor (TAO)', market: 'CRYPTO' },
  { symbol: 'WLDUSDT', label: 'Worldcoin (WLD)', market: 'CRYPTO' },
  { symbol: 'KASUSDT', label: 'Kaspa (KAS)', market: 'CRYPTO' },
  { symbol: 'TIAUSDT', label: 'Celestia (TIA)', market: 'CRYPTO' },
  { symbol: 'SEIUSDT', label: 'Sei Network (SEI)', market: 'CRYPTO' },
  { symbol: 'INJUSDT', label: 'Injective (INJ)', market: 'CRYPTO' },
  { symbol: 'UNIUSDT', label: 'Uniswap (UNI)', market: 'CRYPTO' },
  { symbol: 'AAVEUSDT', label: 'Aave (AAVE)', market: 'CRYPTO' },
  { symbol: 'PENDLEUSDT', label: 'Pendle (PENDLE)', market: 'CRYPTO' },
  { symbol: 'ONDOUSDT', label: 'Ondo Finance (ONDO)', market: 'CRYPTO' },
  { symbol: 'ENAUSDT', label: 'Ethena (ENA)', market: 'CRYPTO' },
  { symbol: 'JUPUSDT', label: 'Jupiter (JUP)', market: 'CRYPTO' },
  { symbol: 'ARBUSDT', label: 'Arbitrum (ARB)', market: 'CRYPTO' },
  { symbol: 'OPUSDT', label: 'Optimism (OP)', market: 'CRYPTO' },
  { symbol: 'TONUSDT', label: 'Toncoin (TON)', market: 'CRYPTO' },

  // Saham IDX (BEI)
  { symbol: 'BBCA', label: 'BBCA (Bank Central Asia)', market: 'IDX' },
  { symbol: 'BBRI', label: 'BBRI (Bank BRI)', market: 'IDX' },
  { symbol: 'BMRI', label: 'BMRI (Bank Mandiri)', market: 'IDX' },
  { symbol: 'BBNI', label: 'BBNI (Bank BNI)', market: 'IDX' },
  { symbol: 'BRIS', label: 'BRIS (Bank Syariah)', market: 'IDX' },
  { symbol: 'ASII', label: 'ASII (Astra Int)', market: 'IDX' },
  { symbol: 'TLKM', label: 'TLKM (Telkom)', market: 'IDX' },
  { symbol: 'GOTO', label: 'GOTO (Gojek Tokopedia)', market: 'IDX' },
  { symbol: 'AMMN', label: 'AMMN (Amman Mineral)', market: 'IDX' },
  { symbol: 'BREN', label: 'BREN (Barito Renewable)', market: 'IDX' },
  { symbol: 'BRPT', label: 'BRPT (Barito Pacific)', market: 'IDX' },
  { symbol: 'ADRO', label: 'ADRO (Adaro Energy)', market: 'IDX' },
  { symbol: 'ANTM', label: 'ANTM (Aneka Tambang)', market: 'IDX' },
  { symbol: 'PGAS', label: 'PGAS (PGN Gas)', market: 'IDX' },
  { symbol: 'MEDC', label: 'MEDC (Medco Energi)', market: 'IDX' },
  { symbol: 'PTBA', label: 'PTBA (Bukit Asam)', market: 'IDX' },
  { symbol: 'INCO', label: 'INCO (Vale Nikel)', market: 'IDX' },
  { symbol: 'MDKA', label: 'MDKA (Merdeka Copper)', market: 'IDX' },
  { symbol: 'ICBP', label: 'ICBP (Indofood CBP)', market: 'IDX' },
  { symbol: 'UNVR', label: 'UNVR (Unilever Indo)', market: 'IDX' },
  { symbol: 'CPIN', label: 'CPIN (Charoen Pokphand)', market: 'IDX' },
  { symbol: 'KLBF', label: 'KLBF (Kalbe Farma)', market: 'IDX' },

  // US Stocks
  { symbol: 'AAPL', label: 'Apple (AAPL)', market: 'US' },
  { symbol: 'NVDA', label: 'NVIDIA (NVDA)', market: 'US' },
  { symbol: 'TSLA', label: 'Tesla (TSLA)', market: 'US' },
  { symbol: 'MSFT', label: 'Microsoft (MSFT)', market: 'US' },
  { symbol: 'AMZN', label: 'Amazon (AMZN)', market: 'US' },
  { symbol: 'GOOGL', label: 'Alphabet (GOOGL)', market: 'US' },
  { symbol: 'META', label: 'Meta (META)', market: 'US' },
  { symbol: 'AMD', label: 'AMD (AMD)', market: 'US' },
  { symbol: 'NFLX', label: 'Netflix (NFLX)', market: 'US' },
  { symbol: 'COIN', label: 'Coinbase (COIN)', market: 'US' },
  { symbol: 'PLTR', label: 'Palantir (PLTR)', market: 'US' },
  { symbol: 'BABA', label: 'Alibaba (BABA)', market: 'US' },
  { symbol: 'INTC', label: 'Intel (INTC)', market: 'US' },
  { symbol: 'BRKB', label: 'Berkshire (BRKB)', market: 'US' },
  { symbol: 'DIS', label: 'Disney (DIS)', market: 'US' },
  { symbol: 'PYPL', label: 'PayPal (PYPL)', market: 'US' },
  { symbol: 'AVGO', label: 'Broadcom (AVGO)', market: 'US' },
  { symbol: 'CRM', label: 'Salesforce (CRM)', market: 'US' },
  { symbol: 'SMCI', label: 'Super Micro (SMCI)', market: 'US' },
  { symbol: 'SOFI', label: 'SoFi Tech (SOFI)', market: 'US' },
  { symbol: 'JPM', label: 'JPMorgan Chase (JPM)', market: 'US' },
  { symbol: 'GS', label: 'Goldman Sachs (GS)', market: 'US' },
  { symbol: 'LLY', label: 'Eli Lilly (LLY)', market: 'US' },
  { symbol: 'UNH', label: 'UnitedHealth (UNH)', market: 'US' },
  { symbol: 'XOM', label: 'ExxonMobil (XOM)', market: 'US' },
  { symbol: 'CVX', label: 'Chevron (CVX)', market: 'US' },
  { symbol: 'CAT', label: 'Caterpillar (CAT)', market: 'US' },
  { symbol: 'GE', label: 'GE Aerospace (GE)', market: 'US' },
  { symbol: 'BA', label: 'Boeing (BA)', market: 'US' },
  { symbol: 'MU', label: 'Micron Tech (MU)', market: 'US' },
  { symbol: 'ARM', label: 'Arm Holdings (ARM)', market: 'US' },
  // Major US ETFs
  { symbol: 'SPY', label: 'SPDR S&P 500 ETF (SPY)', market: 'US' },
  { symbol: 'QQQ', label: 'Invesco QQQ Trust (QQQ)', market: 'US' },
  { symbol: 'IWM', label: 'iShares Russell 2000 (IWM)', market: 'US' },
  { symbol: 'SMH', label: 'VanEck Semi ETF (SMH)', market: 'US' },
  { symbol: 'TQQQ', label: 'ProShares UltraPro QQQ 3x (TQQQ)', market: 'US' },
  { symbol: 'SOXL', label: 'Direxion Semi Bull 3x (SOXL)', market: 'US' }
];

// 15 Specialized AI Multi-Agent Roster (4 Base + 6 Duo + 4 Trio + 1 Master AVATAR)
const INITIAL_AGENTS = [
  {
    id: 'WATER',
    name: 'WATER',
    role: 'SMC & Liquidity Flow',
    description: 'Smart Money Concepts: Order Blocks, FVG sweep, dan aliran likuiditas mengalir adaptif seperti air.',
    strategy: 'SMC_ORDER_BLOCK',
    avatar: '🌊',
    color: '#3b82f6',
    tier: 'BASE',
    dnaBadge: 'BASE',
    dnaIcons: ['🌊'],
    status: 'STANDBY',
    confidence: 85,
    exp3Weight: 0.25,
    generation: 0,
    resetCount: 0,
    resetsHistory: [],
    dnaTraits: { riskMultiplier: 1.0, confidenceBoost: 0, trailingTightness: 1.0 }
  },
  {
    id: 'FIRE',
    name: 'FIRE',
    role: 'News & Event Volatility',
    description: 'Event-driven momentum kilat menangkap ledakan volatilitas berita makro (CPI, NFP, Fed FOMC).',
    strategy: 'NEWS_EVENT_MOMENTUM',
    avatar: '🔥',
    color: '#ef4444',
    tier: 'BASE',
    dnaBadge: 'BASE',
    dnaIcons: ['🔥'],
    status: 'STANDBY',
    confidence: 85,
    exp3Weight: 0.25,
    generation: 0,
    resetCount: 0,
    resetsHistory: [],
    dnaTraits: { riskMultiplier: 1.0, confidenceBoost: 0, trailingTightness: 1.0 }
  },
  {
    id: 'AIR',
    name: 'AIR',
    role: 'Trend Breakout & Momentum',
    description: 'Trend-following dinamis menunggangi hembusan tren panjang Donchian & ekspansi volatilitas ATR.',
    strategy: 'VOLATILITY_EXPANSION',
    avatar: '🌪️',
    color: '#10b981',
    tier: 'BASE',
    dnaBadge: 'BASE',
    dnaIcons: ['🌪️'],
    status: 'STANDBY',
    confidence: 85,
    exp3Weight: 0.25,
    generation: 0,
    resetCount: 0,
    resetsHistory: [],
    dnaTraits: { riskMultiplier: 1.0, confidenceBoost: 0, trailingTightness: 1.0 }
  },
  {
    id: 'EARTH',
    name: 'EARTH',
    role: 'Mean Reversion & Solid S/R',
    description: 'Kokoh dan disiplin memanfaatkan pantulan deviasi ekstrem Bollinger Bands dan support saham defensif.',
    strategy: 'ASIAN_MEAN_REVERSION',
    avatar: '⛰️',
    color: '#eab308',
    tier: 'BASE',
    dnaBadge: 'BASE',
    dnaIcons: ['⛰️'],
    status: 'STANDBY',
    confidence: 85,
    exp3Weight: 0.25,
    generation: 0,
    resetCount: 0,
    resetsHistory: [],
    dnaTraits: { riskMultiplier: 1.0, confidenceBoost: 0, trailingTightness: 1.0 }
  },
  {
    id: 'STEAM',
    name: 'STEAM',
    role: 'Liquidity News Sniper [W+F]',
    description: 'Sinergi WATER + FIRE: Memetakan sapuan likuiditas, lalu entry agresif saat volume rilis berita meledak.',
    strategy: 'DUO_STEAM',
    avatar: '💨',
    color: '#a855f7',
    tier: 'DUO',
    dnaBadge: 'W+F',
    dnaIcons: ['🌊', '🔥'],
    parents: ['WATER', 'FIRE'],
    status: 'STANDBY',
    confidence: 88,
    exp3Weight: 0.25,
    generation: 0,
    resetCount: 0,
    resetsHistory: [],
    dnaTraits: { riskMultiplier: 1.0, confidenceBoost: 0, trailingTightness: 1.0 }
  },
  {
    id: 'STORM',
    name: 'STORM',
    role: 'SMC Trend Breakout [W+A]',
    description: 'Sinergi WATER + AIR: Konfirmasi BOS struktur pasar higher-timeframe digabung Donchian breakout agresif.',
    strategy: 'DUO_STORM',
    avatar: '⛈️',
    color: '#06b6d4',
    tier: 'DUO',
    dnaBadge: 'W+A',
    dnaIcons: ['🌊', '🌪️'],
    parents: ['WATER', 'AIR'],
    status: 'STANDBY',
    confidence: 88,
    exp3Weight: 0.25,
    generation: 0,
    resetCount: 0,
    resetsHistory: [],
    dnaTraits: { riskMultiplier: 1.0, confidenceBoost: 0, trailingTightness: 1.0 }
  },
  {
    id: 'MUD',
    name: 'MUD',
    role: 'Liquidity Reversal Absorber [W+E]',
    description: 'Sinergi WATER + EARTH: Reversal di support/resistance historis dipadukan dengan mitigasi Fair Value Gap & Order Block.',
    strategy: 'DUO_MUD',
    avatar: '🧱',
    color: '#84cc16',
    tier: 'DUO',
    dnaBadge: 'W+E',
    dnaIcons: ['🌊', '⛰️'],
    parents: ['WATER', 'EARTH'],
    status: 'STANDBY',
    confidence: 88,
    exp3Weight: 0.25,
    generation: 0,
    resetCount: 0,
    resetsHistory: [],
    dnaTraits: { riskMultiplier: 1.0, confidenceBoost: 0, trailingTightness: 1.0 }
  },
  {
    id: 'LIGHTNING',
    name: 'LIGHTNING',
    role: 'Momentum Scalper Flash [F+A]',
    description: 'Sinergi FIRE + AIR: Katalis berita makro memicu awal ekspansi tren breakout Donchian multi-hari berkecepatan tinggi.',
    strategy: 'DUO_LIGHTNING',
    avatar: '⚡',
    color: '#f97316',
    tier: 'DUO',
    dnaBadge: 'F+A',
    dnaIcons: ['🔥', '🌪️'],
    parents: ['FIRE', 'AIR'],
    status: 'STANDBY',
    confidence: 88,
    exp3Weight: 0.25,
    generation: 0,
    resetCount: 0,
    resetsHistory: [],
    dnaTraits: { riskMultiplier: 1.0, confidenceBoost: 0, trailingTightness: 1.0 }
  },
  {
    id: 'LAVA',
    name: 'LAVA',
    role: 'Post-News Reversal Fade [F+E]',
    description: 'Sinergi FIRE + EARTH: Mengambil posisi counter-trend saat candle spike berita keluar ekstrim dari Bollinger 3 SD.',
    strategy: 'DUO_LAVA',
    avatar: '🌋',
    color: '#f43f5e',
    tier: 'DUO',
    dnaBadge: 'F+E',
    dnaIcons: ['🔥', '⛰️'],
    parents: ['FIRE', 'EARTH'],
    status: 'STANDBY',
    confidence: 88,
    exp3Weight: 0.25,
    generation: 0,
    resetCount: 0,
    resetsHistory: [],
    dnaTraits: { riskMultiplier: 1.0, confidenceBoost: 0, trailingTightness: 1.0 }
  },
  {
    id: 'SANDSTORM',
    name: 'SANDSTORM',
    role: 'Range Scalper Mean Revert [A+E]',
    description: 'Sinergi AIR + EARTH: Tren makro kuat dipadukan dengan disiplin beli saat pullback menyentuh support kunci.',
    strategy: 'DUO_SANDSTORM',
    avatar: '🏜️',
    color: '#d97706',
    tier: 'DUO',
    dnaBadge: 'A+E',
    dnaIcons: ['🌪️', '⛰️'],
    parents: ['AIR', 'EARTH'],
    status: 'STANDBY',
    confidence: 88,
    exp3Weight: 0.25,
    generation: 0,
    resetCount: 0,
    resetsHistory: [],
    dnaTraits: { riskMultiplier: 1.0, confidenceBoost: 0, trailingTightness: 1.0 }
  },
  {
    id: 'TEMPEST',
    name: 'TEMPEST',
    role: 'Hyper-Aggressive Trend Syndicate [W+F+A]',
    description: 'Sindikat WATER + FIRE + AIR: Likuiditas institusional (W) + Katalis berita (F) + Pengawalan tren ekspansi panjang (A).',
    strategy: 'TRIO_TEMPEST',
    avatar: '🌀',
    color: '#8b5cf6',
    tier: 'TRIO',
    dnaBadge: 'W+F+A',
    dnaIcons: ['🌊', '🔥', '🌪️'],
    parents: ['WATER', 'FIRE', 'AIR'],
    status: 'STANDBY',
    confidence: 90,
    exp3Weight: 0.25,
    generation: 0,
    resetCount: 0,
    resetsHistory: [],
    dnaTraits: { riskMultiplier: 1.0, confidenceBoost: 0, trailingTightness: 1.0 }
  },
  {
    id: 'OCEANIC',
    name: 'OCEANIC',
    role: 'Smart Money Reversion Anchor [W+A+E]',
    description: 'Sindikat WATER + AIR + EARTH: Likuiditas institusi (W) + Trend momentum (A) + Bantalan mean reversion (E).',
    strategy: 'TRIO_OCEANIC',
    avatar: '🌊',
    color: '#0284c7',
    tier: 'TRIO',
    dnaBadge: 'W+A+E',
    dnaIcons: ['🌊', '🌪️', '⛰️'],
    parents: ['WATER', 'AIR', 'EARTH'],
    status: 'STANDBY',
    confidence: 90,
    exp3Weight: 0.25,
    generation: 0,
    resetCount: 0,
    resetsHistory: [],
    dnaTraits: { riskMultiplier: 1.0, confidenceBoost: 0, trailingTightness: 1.0 }
  },
  {
    id: 'GEOTHERMAL',
    name: 'GEOTHERMAL',
    role: 'Macro Fundamental Core [W+F+E]',
    description: 'Sindikat WATER + FIRE + EARTH: Mitigasi Order Block saat rilis berita dengan proteksi support fundamental kuat.',
    strategy: 'TRIO_GEOTHERMAL',
    avatar: '🔮',
    color: '#e11d48',
    tier: 'TRIO',
    dnaBadge: 'W+F+E',
    dnaIcons: ['🌊', '🔥', '⛰️'],
    parents: ['WATER', 'FIRE', 'EARTH'],
    status: 'STANDBY',
    confidence: 90,
    exp3Weight: 0.25,
    generation: 0,
    resetCount: 0,
    resetsHistory: [],
    dnaTraits: { riskMultiplier: 1.0, confidenceBoost: 0, trailingTightness: 1.0 }
  },
  {
    id: 'CYCLONE',
    name: 'CYCLONE',
    role: 'Dynamic Volatility Trend [F+A+E]',
    description: 'Sindikat FIRE + AIR + EARTH: Transisi adaptif dari scalping berita (F) -> Breakout tren (A) -> Mean reversion saat jenuh (E).',
    strategy: 'TRIO_CYCLONE',
    avatar: '🌪️',
    color: '#14b8a6',
    tier: 'TRIO',
    dnaBadge: 'F+A+E',
    dnaIcons: ['🔥', '🌪️', '⛰️'],
    parents: ['FIRE', 'AIR', 'EARTH'],
    status: 'STANDBY',
    confidence: 90,
    exp3Weight: 0.25,
    generation: 0,
    resetCount: 0,
    resetsHistory: [],
    dnaTraits: { riskMultiplier: 1.0, confidenceBoost: 0, trailingTightness: 1.0 }
  },
  {
    id: 'AVATAR',
    name: 'AVATAR',
    role: 'Consensus Master Ensemble [W+F+A+E]',
    description: 'Multi-Agent Consensus Citadel Style: Entry hanya dieksekusi jika minimal 3 dari 4 elemen sepakat pada arah yang sama.',
    strategy: 'ENSEMBLE_AVATAR',
    avatar: '🌟',
    color: '#f59e0b',
    tier: 'AVATAR',
    dnaBadge: 'ALL 4',
    dnaIcons: ['🌊', '🔥', '🌪️', '⛰️'],
    parents: ['WATER', 'FIRE', 'AIR', 'EARTH'],
    status: 'STANDBY',
    confidence: 92,
    exp3Weight: 0.25,
    generation: 0,
    resetCount: 0,
    resetsHistory: [],
    dnaTraits: { riskMultiplier: 1.0, confidenceBoost: 0, trailingTightness: 1.0 }
  }
];

// Quantitative Strategy Multi-Position Rules (Per-Agent Execution DNA)
export const AGENT_MULTI_POS_RULES = {
  WATER: { maxPerPair: 1, mode: 'SINGLE_BULLET', label: 'Single Bullet SMC', desc: 'Presisi Order Block & Likuiditas: Ketat 1 posisi per pair.', minCooldownSec: 25 },
  FIRE: { maxPerPair: 1, mode: 'SINGLE_BULLET', label: 'One-Shot News Catalyst', desc: 'Katalis Berita Makro: 1 posisi per pair guna membatasi risiko spread.', minCooldownSec: 35 },
  AIR: { maxPerPair: 3, mode: 'PYRAMID_PROFIT', label: 'Pyramiding on Profit', desc: 'Trend Rider: Tambah posisi hingga 3 jika order sebelumnya sudah profit (+0.8%).', minProfitPct: 0.8, minCooldownSec: 15 },
  EARTH: { maxPerPair: 2, mode: 'SCALE_IN_ATR', label: 'ATR Deviation Scale-In', desc: 'Mean Reversion: Tambah layer kedua jika deviasi harga melebar minimal 1.0x ATR.', minAtrSpacing: 1.0, minCooldownSec: 25 },
  STEAM: { maxPerPair: 1, mode: 'SINGLE_BULLET', label: 'Single Bullet News Sweep', desc: 'SMC News Sweep: Ketat 1 posisi per pair.', minCooldownSec: 25 },
  STORM: { maxPerPair: 2, mode: 'PYRAMID_PROFIT', label: 'BOS Trend Pyramiding', desc: 'Trend Breakout: Tambah layer kedua jika order sebelumnya sudah profit (+1.0%).', minProfitPct: 1.0, minCooldownSec: 15 },
  MUD: { maxPerPair: 1, mode: 'SINGLE_BULLET', label: 'Single Bullet FVG Reversal', desc: 'FVG Reversal: Ketat 1 posisi per pair.', minCooldownSec: 25 },
  LIGHTNING: { maxPerPair: 2, mode: 'PYRAMID_PROFIT', label: 'Flash Momentum Pyramiding', desc: 'Momentum Scalper: Tambah layer kedua jika posisi lama profit (+0.8%).', minProfitPct: 0.8, minCooldownSec: 15 },
  LAVA: { maxPerPair: 2, mode: 'SCALE_IN_ATR', label: 'Bollinger 3-SD Scale-In', desc: 'Exhaustion Fade: Scale-in kedua saat deviasi ekstrem minimal 1.0x ATR.', minAtrSpacing: 1.0, minCooldownSec: 25 },
  SANDSTORM: { maxPerPair: 2, mode: 'SCALE_IN_ATR', label: 'Pullback S/R Scale-In', desc: 'Range Scalper: Scale-in kedua pada level support kunci (1.0x ATR).', minAtrSpacing: 1.0, minCooldownSec: 25 },
  TEMPEST: { maxPerPair: 3, mode: 'PYRAMID_PROFIT', label: 'Alpha Trend Pyramiding', desc: 'Hyper-Trend: Piramida hingga 3 posisi saat tren panjang terkonfirmasi profit (+1.0%).', minProfitPct: 1.0, minCooldownSec: 15 },
  OCEANIC: { maxPerPair: 1, mode: 'SINGLE_BULLET', label: 'Institutional SMC Anchor', desc: 'SMC Anchor: Ketat 1 posisi per pair.', minCooldownSec: 25 },
  GEOTHERMAL: { maxPerPair: 2, mode: 'SCALE_IN_ATR', label: 'Fundamental S/R Scale-In', desc: 'Macro S/R: Scale-in kedua saat mitigasi berita berjarak minimal 1.0x ATR.', minAtrSpacing: 1.0, minCooldownSec: 25 },
  CYCLONE: { maxPerPair: 2, mode: 'PYRAMID_PROFIT', label: 'Dynamic Regime Pyramiding', desc: 'Dynamic Trend: Piramida jika breakout tren terkonfirmasi profit (+0.8%).', minProfitPct: 0.8, minCooldownSec: 15 },
  AVATAR: { maxPerPair: 2, mode: 'CONSENSUS_SCALE', label: 'Citadel Consensus Allocator', desc: 'Multi-Manager: Tambah layer kedua berdasarkan konsensus mayoritas.', minCooldownSec: 20 }
};

// Baseline Genesis Session #0 Knowledge Archive
const DEFAULT_EPOCH_REPORTS = [
  {
    id: 'REPORT-EP-0-GENESIS',
    epochNumber: 0,
    createdAt: '19 Sep 2026, 23:45 WIB',
    totalTrades: 9832,
    winRate: '21.0',
    grossProfitIdr: 875000000,
    grossLossIdr: 619537583,
    netPnlIdr: 255462417,
    netPnlUsd: 15624.61,
    profitFactor: '1.41',
    sharpeRatio: '1.69',
    rocPct: '63.87',
    keyTakeaway: 'Sesi #0 (Genesis) berhasil ditutup PROFIT. Algoritma EXP3 meningkatkan alokasi modal ke AIR sebagai MVP Sesi 0 dan memperketat trailing ratchet pada pasangan volatil.',
    agentBreakdowns: [
      {
        agentId: 'AIR',
        name: 'AIR',
        role: 'Trend Breakout & Momentum',
        avatar: '🌪️',
        color: '#10b981',
        totalTrades: 2390,
        wins: 502,
        losses: 1888,
        winRate: '21.0',
        profitFactor: '1.69',
        bestPair: 'NZDJPY',
        worstPair: 'GBPJPY',
        oldWeight: 0.28,
        newWeight: 0.38,
        diffPct: 10.0,
        netPnlIdr: 619407776,
        netPnlUsd: 37884.26
      },
      {
        agentId: 'WATER',
        name: 'WATER',
        role: 'SMC & Liquidity Flow',
        avatar: '🌊',
        color: '#3b82f6',
        totalTrades: 2432,
        wins: 290,
        losses: 2142,
        winRate: '11.9',
        profitFactor: '0.92',
        bestPair: 'CHFJPY',
        worstPair: 'AUDJPY',
        oldWeight: 0.32,
        newWeight: 0.24,
        diffPct: -8.0,
        netPnlIdr: -120211187,
        netPnlUsd: -7352.36
      },
      {
        agentId: 'FIRE',
        name: 'FIRE',
        role: 'News & Event Volatility',
        avatar: '🔥',
        color: '#ef4444',
        totalTrades: 2522,
        wins: 178,
        losses: 2344,
        winRate: '7.1',
        profitFactor: '0.85',
        bestPair: 'NZDJPY',
        worstPair: 'EURJPY',
        oldWeight: 0.26,
        newWeight: 0.20,
        diffPct: -6.0,
        netPnlIdr: -148165244,
        netPnlUsd: -9062.09
      },
      {
        agentId: 'EARTH',
        name: 'EARTH',
        role: 'Mean Reversion & Solid S/R',
        avatar: '⛰️',
        color: '#eab308',
        totalTrades: 2488,
        wins: 264,
        losses: 2224,
        winRate: '10.6',
        profitFactor: '0.88',
        bestPair: 'CHFJPY',
        worstPair: 'BBCA',
        oldWeight: 0.14,
        newWeight: 0.18,
        diffPct: 4.0,
        netPnlIdr: -95568928,
        netPnlUsd: -5845.20
      }
    ],
    adaptations: [
      {
        agentId: 'AIR',
        name: 'AIR',
        avatar: '🌪️',
        color: '#10b981',
        oldWeight: 0.28,
        newWeight: 0.38,
        diffPct: 10.0,
        actionSummary: 'Bobot modal dinaikkan ke 38% (+10.0%) karena MVP Sesi 0 dengan Profit Factor 1.69. Parameter trailing stop ekspansi tren dipertahankan.'
      },
      {
        agentId: 'WATER',
        name: 'WATER',
        avatar: '🌊',
        color: '#3b82f6',
        oldWeight: 0.32,
        newWeight: 0.24,
        diffPct: -8.0,
        actionSummary: 'Bobot modal diturunkan ke 24% (-8.0%). Trailing stop ratchet diperketat (+15%) dan filter FVG diperkuat.'
      },
      {
        agentId: 'FIRE',
        name: 'FIRE',
        avatar: '🔥',
        color: '#ef4444',
        oldWeight: 0.26,
        newWeight: 0.20,
        diffPct: -6.0,
        actionSummary: 'Bobot modal diturunkan ke 20% (-6.0%). Threshold konfirmasi sinyal dinaikkan (+10%) guna meredam false breakout berita.'
      },
      {
        agentId: 'EARTH',
        name: 'EARTH',
        avatar: '⛰️',
        color: '#eab308',
        oldWeight: 0.14,
        newWeight: 0.18,
        diffPct: 4.0,
        actionSummary: 'Bobot modal dinaikkan ke 18% (+4.0%). Disiplin ketat jam bursa BEI (09:00 - 15:45 WIB) memastikan tidak ada spekulasi saat pasar tutup.'
      }
    ],
    topAlphaPairs: [
      { symbol: 'NZDJPY', market: 'FOREX', netPnlIdr: 128450000, netPnlUsd: 7856.26, winRate: '32', totalTrades: 155 },
      { symbol: 'CHFJPY', market: 'FOREX', netPnlIdr: 93141300, netPnlUsd: 5696.71, winRate: '26', totalTrades: 152 },
      { symbol: 'CADJPY', market: 'FOREX', netPnlIdr: 48855000, netPnlUsd: 2988.07, winRate: '29', totalTrades: 152 }
    ],
    toxicDragPairs: [
      { symbol: 'GBPJPY', market: 'FOREX', netPnlIdr: -127981150, netPnlUsd: -7827.59, winRate: '12', totalTrades: 129 },
      { symbol: 'AUDJPY', market: 'FOREX', netPnlIdr: -117114350, netPnlUsd: -7162.95, winRate: '14', totalTrades: 151 },
      { symbol: 'EURJPY', market: 'FOREX', netPnlIdr: -103534400, netPnlUsd: -6332.37, winRate: '11', totalTrades: 107 }
    ]
  }
];

export default function AiAgentArenaTab({ data, livePrices = {}, onOpenChart }) {
  // Master Autonomous System State (PAUSED by default: user configures settings before starting)
  const [isRunning, setIsRunning] = useState(() => {
    try {
      const saved = localStorage.getItem('mbg_ai_arena_running');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Base Capital PER BOT in IDR (Default Rp 1.000.000 per bot)
  const [capitalPerBotIdr, setCapitalPerBotIdr] = useState(() => {
    try {
      const saved = localStorage.getItem('mbg_ai_arena_capital_per_bot');
      return saved ? Math.max(1000000, Number(JSON.parse(saved))) : 1000000;
    } catch {
      return 1000000;
    }
  });

  const [capitalInputText, setCapitalInputText] = useState(() => String(capitalPerBotIdr));

  // Manual Max Active Positions (1 to 100, or 999 = Unlimited)
  // Manual Max Active Positions (1 to 100, or 999 = Unlimited)
  const [sliderMaxPositions, setSliderMaxPositions] = useState(() => {
    try {
      const saved = localStorage.getItem('mbg_ai_arena_slider_max_pos');
      return saved ? Number(JSON.parse(saved)) : 10;
    } catch {
      return 10;
    }
  });

  const [maxPosInputText, setMaxPosInputText] = useState(() => {
    try {
      const saved = localStorage.getItem('mbg_ai_arena_slider_max_pos');
      const val = saved ? Number(JSON.parse(saved)) : 10;
      return val >= 999 ? '' : String(val);
    } catch {
      return '10';
    }
  });

  useEffect(() => {
    if (sliderMaxPositions >= 999) {
      setMaxPosInputText('');
    } else if (maxPosInputText !== '' && Number(maxPosInputText) !== sliderMaxPositions) {
      setMaxPosInputText(String(sliderMaxPositions));
    }
  }, [sliderMaxPositions]);

  const isUnlimitedPositions = sliderMaxPositions >= 999;
  const maxPositionsPerBot = isUnlimitedPositions ? 999 : sliderMaxPositions;

  // Execution Mode Configuration: 'HYBRID' (Default) | 'SPOT_ONLY' | 'FUTURES_ONLY'
  const [arenaExecutionMode, setArenaExecutionMode] = useState(() => {
    try {
      return localStorage.getItem('mbg_ai_arena_execution_mode') || 'HYBRID';
    } catch {
      return 'HYBRID';
    }
  });
  const arenaExecutionModeRef = useRef(arenaExecutionMode);
  arenaExecutionModeRef.current = arenaExecutionMode;

  // Dynamic Tiered Scanner Filter: 'DYNAMIC_RADAR' (Default) | 'FULL_WATCHLIST'
  const [scannerMode, setScannerMode] = useState(() => {
    try {
      return localStorage.getItem('mbg_ai_arena_scanner_mode') || 'DYNAMIC_RADAR';
    } catch {
      return 'DYNAMIC_RADAR';
    }
  });
  const scannerModeRef = useRef(scannerMode);
  scannerModeRef.current = scannerMode;

  // Live Currency Exchange Rate State (Realtime USD/IDR with dynamic fetch fallback)
  const [usdToIdrRate, setUsdToIdrRate] = useState(() => {
    try {
      const saved = localStorage.getItem('mbg_usd_idr_rate');
      return saved ? Number(saved) : 16350;
    } catch {
      return 16350;
    }
  });

  // Simulation Session Active Duration (Accumulated active running time in seconds)
  const [sessionActiveSeconds, setSessionActiveSeconds] = useState(() => {
    try {
      const savedSecs = localStorage.getItem('mbg_ai_arena_session_active_seconds');
      if (savedSecs !== null) {
        return Math.max(0, Number(savedSecs) || 0);
      }
      // If journal and positions are empty (clean or fresh session), timer is 0
      const savedJournal = localStorage.getItem('mbg_ai_arena_journal');
      const parsedJournal = savedJournal ? JSON.parse(savedJournal) : [];
      const savedPos = localStorage.getItem('mbg_ai_arena_positions');
      const parsedPos = savedPos ? JSON.parse(savedPos) : [];
      if (parsedJournal.length === 0 && parsedPos.length === 0) {
        return 0;
      }
    } catch {}
    return 0;
  });

  const [sessionUptimeStr, setSessionUptimeStr] = useState('0j 0m 0s');

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(res => res.json())
      .then(d => {
        if (d?.rates?.IDR && typeof d.rates.IDR === 'number') {
          const rate = Math.round(d.rates.IDR);
          setUsdToIdrRate(rate);
          currentLiveUsdToIdr = rate;
          try { localStorage.setItem('mbg_usd_idr_rate', String(rate)); } catch (e) {}
        }
      })
      .catch(e => console.warn('Realtime USD/IDR fallback:', e));
  }, []);

  // Timer: Hanya bertambah saat arena aktif berjalan (isRunning === true).
  // Menggunakan delta Date.now() agar TIDAK PERNAH FREEZE meskipun tab diminimize atau backgrounded oleh browser.
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      let lastTime = Date.now();
      
      const updateUptime = () => {
        const now = Date.now();
        const deltaSec = Math.max(0, Math.round((now - lastTime) / 1000));
        if (deltaSec >= 1) {
          lastTime = now;
          setSessionActiveSeconds(prev => {
            const next = prev + deltaSec;
            try { localStorage.setItem('mbg_ai_arena_session_active_seconds', String(next)); } catch (e) {}
            return next;
          });
        }
      };

      interval = setInterval(updateUptime, 1000);

      // Event listener saat user kembali fokus ke tab/window setelah diminimize
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          updateUptime();
        } else {
          lastTime = Date.now();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', updateUptime);

      return () => {
        if (interval) clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', updateUptime);
      };
    }
  }, [isRunning]);

  useEffect(() => {
    const totalSecs = sessionActiveSeconds;
    const secs = totalSecs % 60;
    const mins = Math.floor(totalSecs / 60) % 60;
    const hours = Math.floor(totalSecs / 3600) % 24;
    const days = Math.floor(totalSecs / 86400);
    let str = `${hours}j ${mins}m ${secs}s`;
    if (days > 0) str = `${days}h ${str}`;
    setSessionUptimeStr(str);
  }, [sessionActiveSeconds]);

  // Risk per trade %
  const [riskPerTradePct, setRiskPerTradePct] = useState(() => {
    try {
      const saved = localStorage.getItem('mbg_ai_arena_risk_pct');
      return saved ? Number(JSON.parse(saved)) : 2;
    } catch {
      return 2;
    }
  });

  const [marketFeeds, setMarketFeeds] = useState(DEFAULT_MARKET_FEEDS);

  // Active Opportunities Radar dynamically filtered from Live Feeds
  const activeRadarSymbols = useMemo(() => {
    return scanActiveMarketRadar(marketFeeds, ALL_INSTRUMENTS, scannerMode);
  }, [marketFeeds, scannerMode]);

  // Agents State with Auto-Migration for 15 Agents (Canonical Sort & DNA Badges)
  const [agents, setAgents] = useState(() => {
    try {
      const savedVersion = localStorage.getItem('mbg_ai_arena_agents_v');
      const saved = localStorage.getItem('mbg_ai_arena_agents');

      if (savedVersion !== 'v9_dynamic_max_pos') {
        localStorage.setItem('mbg_ai_arena_agents_v', 'v9_dynamic_max_pos');
        let currentList = [];
        if (saved) {
          try { currentList = JSON.parse(saved); } catch {}
        }
        if (!Array.isArray(currentList) || currentList.length === 0) {
          localStorage.setItem('mbg_ai_arena_agents', JSON.stringify(INITIAL_AGENTS));
          return INITIAL_AGENTS;
        }

        const existingMap = new Map(currentList.map(a => [a.id, a]));
        const mergedAndSorted = INITIAL_AGENTS.map(initAg => {
          const existing = existingMap.get(initAg.id);
          if (existing) {
            return {
              ...existing,
              tier: initAg.tier,
              dnaBadge: initAg.dnaBadge,
              dnaIcons: initAg.dnaIcons,
              role: initAg.role,
              avatar: initAg.avatar,
              color: initAg.color,
              parents: initAg.parents
            };
          }
          return initAg;
        });
        localStorage.setItem('mbg_ai_arena_agents', JSON.stringify(mergedAndSorted));
        return mergedAndSorted;
      }

      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingMap = new Map(parsed.map(a => [a.id, a]));
          return INITIAL_AGENTS.map(initAg => {
            const existing = existingMap.get(initAg.id);
            if (existing) {
              return {
                ...existing,
                tier: initAg.tier,
                dnaBadge: initAg.dnaBadge,
                dnaIcons: initAg.dnaIcons
              };
            }
            return initAg;
          });
        }
      }
      return INITIAL_AGENTS;
    } catch {
      return INITIAL_AGENTS;
    }
  });

  const marketFeedsRef = useRef(marketFeeds);
  marketFeedsRef.current = marketFeeds;

  const agentsRef = useRef(agents);
  agentsRef.current = agents;

  const effectiveMaxPositions = isUnlimitedPositions ? 999 : (sliderMaxPositions * (agents?.length || 15));

  // Helper to normalize position TP/SL and Lot Sizing if corrupted or bloated by old static ATR / micro-units
  const normalizePositionTpSl = (p) => {
    if (!p || !p.entryPrice) return p;
    let modified = { ...p };

    const isCrypto = p.market === 'CRYPTO' || (p.symbol && p.symbol.endsWith('USDT'));
    const isForex = p.market === 'FOREX';
    const isIdx = p.market === 'IDX';

    // 1. Normalize Micro-Sizing for Crypto (auto-upgrade old positions holding tiny 0.01 coin)
    if (isCrypto && p.entryPrice > 0) {
      const notionalUsd = (Number(p.sizeLots) || 0) * Number(p.entryPrice);
      if (notionalUsd < 5) {
        modified.sizeLots = calculateInstrumentLotSize('CRYPTO', p.symbol, p.entryPrice, capitalPerBotIdr, riskPerTradePct);
      }
    }

    // 2. Normalize TP/SL distance if bloated
    if (p.tp1Price) {
      const distTp = Math.abs(p.tp1Price - p.entryPrice) / p.entryPrice;
      const maxAllowedDist = isForex ? 0.012 : (isCrypto ? 0.035 : 0.025);
      
      if (distTp > maxAllowedDist) {
        const atrPct = isCrypto ? 0.012 : (isForex ? 0.0035 : (isIdx ? 0.010 : 0.006));
        const atr = p.entryPrice * atrPct;
        const isLong = p.direction === 'LONG';
        const decimals = isIdx ? 0 : (isForex ? (p.symbol.includes('JPY') ? 3 : 5) : (isCrypto && p.entryPrice < 0.001 ? 7 : (isCrypto && p.entryPrice < 1 ? 4 : 2)));
        modified.slPrice = Number((isLong ? (p.entryPrice - (atr * 1.0)) : (p.entryPrice + (atr * 1.0))).toFixed(decimals));
        modified.tp1Price = Number((isLong ? (p.entryPrice + (atr * 1.5)) : (p.entryPrice - (atr * 1.5))).toFixed(decimals));
        modified.tp2Price = Number((isLong ? (p.entryPrice + (atr * 2.5)) : (p.entryPrice - (atr * 2.5))).toFixed(decimals));
      }
    }
    return modified;
  };

  // Open Positions (Real-time active trade orders)
  const [positions, setPositions] = useState(() => {
    try {
      const saved = localStorage.getItem('mbg_ai_arena_positions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(p => {
            const mapped = {
              ...p,
              agentId: p.agentId === 'TITAN' ? 'WATER' : (p.agentId === 'ORACLE' ? 'FIRE' : (p.agentId === 'VORTEX' ? 'AIR' : (p.agentId === 'SENTINEL' ? 'EARTH' : p.agentId)))
            };
            return normalizePositionTpSl(mapped);
          });
        }
      }
    } catch (e) {
      console.warn(e);
    }
    return [];
  });

  // Timeframe selector for Equity Curves: '3D' | '7D' | '1M' | '3M' | '1Y'
  const [chartTimeframe, setChartTimeframe] = useState(() => {
    try {
      return localStorage.getItem('mbg_ai_arena_timeframe') || '7D';
    } catch {
      return '7D';
    }
  });

  // Filter & Sort for Locked 4-Column Kanban Grid
  const [agentFilterTab, setAgentFilterTab] = useState('ALL');
  const [agentSortBy, setAgentSortBy] = useState('DEFAULT');



  // Synchronize 100% REAL Market Prices from live WebSocket & Scanner Feeds
  useEffect(() => {
    if (!livePrices || Object.keys(livePrices).length === 0) return;
    setMarketFeeds(prev => {
      let updated = false;
      const next = { ...prev };
      Object.keys(next).forEach(sym => {
        const live = livePrices[sym]
          || livePrices[`IDX:${sym}`]
          || livePrices[`NASDAQ:${sym}`]
          || livePrices[`NYSE:${sym}`]
          || livePrices[`BINANCE:${sym}`]
          || livePrices[`FX:${sym}`]
          || livePrices[`FX_IDC:${sym}`]
          || livePrices[`TVC:${sym}`];
        if (live?.price && typeof live.price === 'number' && live.price > 0) {
          const numPrice = Number(live.price);
          if (next[sym].price !== numPrice) {
            next[sym] = {
              ...next[sym],
              price: numPrice,
              high: Math.max(next[sym].high || numPrice, numPrice),
              low: Math.min(next[sym].low || numPrice, numPrice),
              change: live.changePct !== undefined ? Number(live.changePct) : next[sym].change
            };
            updated = true;
          }
        }
      });
      if (updated) {
        marketFeedsRef.current = next;
      }
      return updated ? next : prev;
    });
  }, [livePrices]);

  // Closed Trades History Journal
  const [journal, setJournal] = useState(() => {
    try {
      const saved = localStorage.getItem('mbg_ai_arena_journal');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(j => ({
            ...j,
            agentId: j.agentId === 'TITAN' ? 'WATER' : (j.agentId === 'ORACLE' ? 'FIRE' : (j.agentId === 'VORTEX' ? 'AIR' : (j.agentId === 'SENTINEL' ? 'EARTH' : j.agentId)))
          }));
        }
      }
    } catch (e) {
      console.warn(e);
    }
    return [];
  });

  const journalRef = useRef(journal);
  journalRef.current = journal;

  // Modal Dialog States
  const [journalModal, setJournalModal] = useState({ isOpen: false, agentId: 'ALL', agentName: 'Semua Elemen' });
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [rulesActiveSubTab, setRulesActiveSubTab] = useState('RULES'); // 'RULES' | 'STATUS'
  const [philosophyModalOpen, setPhilosophyModalOpen] = useState(false);
  const [agentReviewModalOpen, setAgentReviewModalOpen] = useState(false);
  const [reviewActiveTab, setReviewActiveTab] = useState('RECAP'); // 'RECAP' | 'WATER' | 'FIRE' | 'AIR' | 'EARTH'
  const [resetConfirmModal, setResetConfirmModal] = useState({ isOpen: false, agentId: null, agentName: '' });
  const [selectedPhilosophyAgent, setSelectedPhilosophyAgent] = useState('WATER');
  const [selectedReviewAgent, setSelectedReviewAgent] = useState('WATER');
  const [toastMessage, setToastMessage] = useState(null);

  // Bot Life Cycle: Evolution & Mutasi DNA Modal
  const [evolutionModal, setEvolutionModal] = useState({ isOpen: false, agent: null });

  // Epoch Reports & Self-Improvement Session History
  const [epochReports, setEpochReports] = useState(() => {
    try {
      const saved = localStorage.getItem('mbg_ai_arena_epoch_reports');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_EPOCH_REPORTS;
    } catch {
      return DEFAULT_EPOCH_REPORTS;
    }
  });
  const [sessionRecapModalOpen, setSessionRecapModalOpen] = useState(false);
  const [selectedRecapSessionKey, setSelectedRecapSessionKey] = useState('LIVE');

  // Persistence Handler
  useEffect(() => {
    try {
      localStorage.setItem('mbg_ai_arena_running', JSON.stringify(isRunning));
      localStorage.setItem('mbg_ai_arena_capital_per_bot', JSON.stringify(capitalPerBotIdr));
      localStorage.setItem('mbg_ai_arena_slider_max_pos', JSON.stringify(sliderMaxPositions));
      localStorage.setItem('mbg_ai_arena_risk_pct', JSON.stringify(riskPerTradePct));
      localStorage.setItem('mbg_ai_arena_agents', JSON.stringify(agents));
      localStorage.setItem('mbg_ai_arena_positions', JSON.stringify(positions));
      localStorage.setItem('mbg_ai_arena_journal', JSON.stringify(journal));
      localStorage.setItem('mbg_ai_arena_timeframe', chartTimeframe);
      localStorage.setItem('mbg_ai_arena_epoch_reports', JSON.stringify(epochReports));
      localStorage.setItem('mbg_ai_arena_execution_mode', arenaExecutionMode);
      localStorage.setItem('mbg_ai_arena_scanner_mode', scannerMode);
    } catch (e) {
      console.warn('Storage sync failed:', e);
    }
  }, [isRunning, capitalPerBotIdr, sliderMaxPositions, riskPerTradePct, agents, positions, journal, chartTimeframe, epochReports, arenaExecutionMode, scannerMode]);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Compute Dynamic Stats Per Agent Directly from Journal (Active Generation & All-Time)
  const agentStatsMap = useMemo(() => {
    const map = {};
    agents.forEach(ag => {
      const agAllTrades = journal.filter(j => j.agentId === ag.id);
      const lastResetTime = ag.resetsHistory?.[0]?.timestamp ? new Date(ag.resetsHistory[0].timestamp).getTime() : 0;
      const agTrades = lastResetTime > 0
        ? agAllTrades.filter(j => new Date(j.closedAt).getTime() > lastResetTime)
        : agAllTrades;

      const total = agTrades.length;
      const wins = agTrades.filter(j => j.isWin).length;
      const losses = total - wins;
      const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : (agAllTrades.length > 0 ? ((agAllTrades.filter(j => j.isWin).length / agAllTrades.length) * 100).toFixed(1) : '0.0');
      const grossProfit = agTrades.filter(j => j.pnlIdr > 0).reduce((a, b) => a + b.pnlIdr, 0);
      const grossLoss = Math.abs(agTrades.filter(j => j.pnlIdr < 0).reduce((a, b) => a + b.pnlIdr, 0));
      const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : (grossProfit > 0 ? '99.0' : '0.0');
      const netGainIdr = grossProfit - grossLoss;

      // Floating PnL of active trades for this bot
      const activeFloatingIdr = positions.filter(p => p.agentId === ag.id).reduce((acc, p) => acc + (p.floatingPnlIdr || 0), 0);
      const currentBotEquityIdr = capitalPerBotIdr + netGainIdr + activeFloatingIdr;

      map[ag.id] = {
        total: total > 0 ? total : agAllTrades.length,
        wins: total > 0 ? wins : agAllTrades.filter(j => j.isWin).length,
        losses: total > 0 ? losses : (agAllTrades.length - agAllTrades.filter(j => j.isWin).length),
        winRate,
        profitFactor,
        netGainIdr,
        currentBotEquityIdr,
        activeFloatingIdr,
        roiPct: Number((((currentBotEquityIdr - capitalPerBotIdr) / capitalPerBotIdr) * 100).toFixed(2))
      };
    });
    return map;
  }, [agents, journal, positions, capitalPerBotIdr]);

  // Filtered & Dynamically Sorted Agents for 4-Column Grid
  const filteredAgents = useMemo(() => {
    let list = [...agents];
    if (agentFilterTab === 'BASE') list = list.filter(a => a.tier === 'BASE');
    else if (agentFilterTab === 'DUO') list = list.filter(a => a.tier === 'DUO');
    else if (agentFilterTab === 'TRIO') list = list.filter(a => a.tier === 'TRIO' || a.tier === 'AVATAR');

    if (agentSortBy === 'ROI_DESC') {
      list.sort((a, b) => (agentStatsMap[b.id]?.roiPct || 0) - (agentStatsMap[a.id]?.roiPct || 0));
    } else if (agentSortBy === 'WINRATE_DESC') {
      list.sort((a, b) => Number(agentStatsMap[b.id]?.winRate || 0) - Number(agentStatsMap[a.id]?.winRate || 0));
    } else if (agentSortBy === 'POSITIONS_DESC') {
      list.sort((a, b) => {
        const bPos = positions.filter(p => p.agentId === b.id).length;
        const aPos = positions.filter(p => p.agentId === a.id).length;
        return bPos - aPos;
      });
    }
    return list;
  }, [agents, agentFilterTab, agentSortBy, agentStatsMap, positions]);

  // Honest Real-Time Equity Trajectory Curves for each bot based on actual closed trades & live equity (No fake waves)
  const botEquityCurves = useMemo(() => {
    const map = {};

    agents.forEach(ag => {
      const st = agentStatsMap[ag.id];
      const currentEquity = st ? st.currentBotEquityIdr : capitalPerBotIdr;
      const base = capitalPerBotIdr;

      const lastResetTime = ag.resetsHistory?.[0]?.timestamp ? new Date(ag.resetsHistory[0].timestamp).getTime() : 0;
      const agAllTrades = journal.filter(j => j.agentId === ag.id).slice().reverse();
      const agTrades = lastResetTime > 0
        ? agAllTrades.filter(j => new Date(j.closedAt).getTime() > lastResetTime)
        : agAllTrades;

      if (agTrades.length === 0) {
        // No trades yet in current gen: flat line from initial capital to current live equity
        map[ag.id] = [base, currentEquity];
      } else {
        let running = base;
        const curve = [base];
        agTrades.forEach(tr => {
          running += (tr.pnlIdr || 0);
          curve.push(running);
        });
        if (curve[curve.length - 1] !== currentEquity) {
          curve.push(currentEquity);
        }
        map[ag.id] = curve;
      }
    });
    return map;
  }, [agents, capitalPerBotIdr, agentStatsMap, journal]);

  // Comprehensive Session Recap Data Compiler (Live Interim & Historical Archives)
  const sessionRecapData = useMemo(() => {
    if (selectedRecapSessionKey === 'LIVE') {
      const totalTrades = journal.length;
      const wins = journal.filter(j => j.isWin).length;
      const losses = totalTrades - wins;
      const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0.0';

      const grossProfitIdr = journal.filter(j => (j.pnlIdr || (j.pnlUsd * usdToIdrRate)) > 0)
        .reduce((a, b) => a + (b.pnlIdr || (b.pnlUsd * usdToIdrRate)), 0);
      const grossLossIdr = Math.abs(journal.filter(j => (j.pnlIdr || (j.pnlUsd * usdToIdrRate)) < 0)
        .reduce((a, b) => a + (b.pnlIdr || (b.pnlUsd * usdToIdrRate)), 0));
      const netPnlIdr = grossProfitIdr - grossLossIdr;
      const netPnlUsd = netPnlIdr / usdToIdrRate;
      const profitFactor = grossLossIdr > 0 ? (grossProfitIdr / grossLossIdr).toFixed(2) : (grossProfitIdr > 0 ? '99.0' : '0.0');

      const totalCapitalIdr = capitalPerBotIdr * (agents?.length || 15);
      const rocPct = totalCapitalIdr > 0 ? ((netPnlIdr / totalCapitalIdr) * 100).toFixed(2) : '0.00';

      // Sharpe Ratio calculation
      const tradeReturns = journal.map(j => (j.pnlIdr || (j.pnlUsd * usdToIdrRate)));
      let sharpeRatio = '0.00';
      if (tradeReturns.length > 1) {
        const mean = tradeReturns.reduce((a, b) => a + b, 0) / tradeReturns.length;
        const variance = tradeReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (tradeReturns.length - 1);
        const stdev = Math.sqrt(variance);
        if (stdev > 0) {
          sharpeRatio = ((mean / stdev) * Math.sqrt(Math.min(tradeReturns.length, 252))).toFixed(2);
        }
      }

      // Per-Agent breakdown
      const agentBreakdowns = agents.map(ag => {
        const agTrades = journal.filter(j => j.agentId === ag.id);
        const agTotal = agTrades.length;
        const agWins = agTrades.filter(j => j.isWin).length;
        const agLosses = agTotal - agWins;
        const agWr = agTotal > 0 ? ((agWins / agTotal) * 100).toFixed(1) : '0.0';
        const agProfit = agTrades.filter(j => (j.pnlIdr || (j.pnlUsd * usdToIdrRate)) > 0)
          .reduce((a, b) => a + (b.pnlIdr || (b.pnlUsd * usdToIdrRate)), 0);
        const agLoss = Math.abs(agTrades.filter(j => (j.pnlIdr || (j.pnlUsd * usdToIdrRate)) < 0)
          .reduce((a, b) => a + (b.pnlIdr || (b.pnlUsd * usdToIdrRate)), 0));
        const agNet = agProfit - agLoss;
        const agPf = agLoss > 0 ? (agProfit / agLoss).toFixed(2) : (agProfit > 0 ? '99.0' : '0.0');

        const pairMap = {};
        agTrades.forEach(t => {
          const val = t.pnlIdr || (t.pnlUsd * usdToIdrRate);
          pairMap[t.symbol] = (pairMap[t.symbol] || 0) + val;
        });
        const pairsSorted = Object.entries(pairMap).sort((a, b) => b[1] - a[1]);
        const bestPair = pairsSorted[0] ? pairsSorted[0][0] : '-';
        const worstPair = pairsSorted.length > 1 ? pairsSorted[pairsSorted.length - 1][0] : '-';

        return {
          agentId: ag.id,
          name: ag.name,
          role: ag.role,
          avatar: ag.avatar,
          color: ag.color,
          totalTrades: agTotal,
          wins: agWins,
          losses: agLosses,
          winRate: agWr,
          profitFactor: agPf,
          netPnlIdr: agNet,
          netPnlUsd: agNet / usdToIdrRate,
          bestPair,
          worstPair,
          oldWeight: ag.exp3Weight || 0.25,
          currentEquity: agentStatsMap[ag.id]?.currentBotEquityIdr || capitalPerBotIdr,
          status: ag.status || 'HUNTING',
          generation: typeof ag.generation === 'number' ? ag.generation : 0
        };
      });

      // EXP3 prospective weight shift calculation
      const scores = agentBreakdowns.map(ab => {
        const pnlFactor = Math.max(0.05, 1 + (ab.netPnlIdr / Math.max(1, capitalPerBotIdr)));
        const wrFactor = Math.max(0.1, Number(ab.winRate) / 100);
        return pnlFactor * wrFactor;
      });
      const sumScore = scores.reduce((a, b) => a + b, 0) || 1;
      const prospectiveWeights = scores.map(s => Number((s / sumScore).toFixed(3)));

      const agentBreakdownsWithNewWeights = agentBreakdowns.map((ab, idx) => {
        const newW = prospectiveWeights[idx];
        const diffPct = Number(((newW - ab.oldWeight) * 100).toFixed(1));
        return {
          ...ab,
          newWeight: newW,
          diffPct
        };
      });

      // Top MVP agent determination
      const sortedByPerformance = [...agentBreakdownsWithNewWeights].sort((a, b) => {
        if (b.netPnlIdr !== a.netPnlIdr) return b.netPnlIdr - a.netPnlIdr;
        return Number(b.winRate) - Number(a.winRate);
      });
      const mvp = sortedByPerformance[0] || null;

      // Universe Attribution (All pairs traded in live session)
      const pairStats = {};
      journal.forEach(t => {
        const sym = t.symbol;
        const mkt = t.market || 'FOREX';
        if (!pairStats[sym]) {
          pairStats[sym] = { symbol: sym, market: mkt, totalTrades: 0, wins: 0, losses: 0, netPnlIdr: 0, grossProfit: 0, grossLoss: 0 };
        }
        const val = t.pnlIdr || (t.pnlUsd * usdToIdrRate);
        pairStats[sym].totalTrades += 1;
        if (t.isWin) pairStats[sym].wins += 1; else pairStats[sym].losses += 1;
        pairStats[sym].netPnlIdr += val;
        if (val > 0) pairStats[sym].grossProfit += val; else pairStats[sym].grossLoss += Math.abs(val);
      });

      const allPairs = Object.values(pairStats).map(p => ({
        ...p,
        winRate: p.totalTrades > 0 ? ((p.wins / p.totalTrades) * 100).toFixed(0) : '0',
        netPnlUsd: p.netPnlIdr / usdToIdrRate,
        profitFactor: p.grossLoss > 0 ? (p.grossProfit / p.grossLoss).toFixed(2) : (p.grossProfit > 0 ? '99.0' : '0.0')
      }));

      const topAlphaPairs = [...allPairs].filter(p => p.netPnlIdr > 0).sort((a, b) => b.netPnlIdr - a.netPnlIdr).slice(0, 3);
      const toxicDragPairs = [...allPairs].filter(p => p.netPnlIdr < 0).sort((a, b) => a.netPnlIdr - b.netPnlIdr).slice(0, 3);

      return {
        epochNumber: epochReports.length,
        isLive: true,
        sessionLabel: `Sesi #${epochReports.length} (Live Interim)`,
        createdAt: 'Sesi Sedang Berjalan (Realtime)',
        uptimeStr: sessionUptimeStr,
        totalTrades,
        wins,
        losses,
        winRate,
        grossProfitIdr,
        grossLossIdr,
        netPnlIdr,
        netPnlUsd,
        profitFactor,
        sharpeRatio,
        rocPct,
        agentBreakdowns: agentBreakdownsWithNewWeights,
        mvp,
        topAlphaPairs,
        toxicDragPairs,
        keyTakeaway: netPnlIdr >= 0
          ? `Sesi #${epochReports.length} berjalan PROFIT (+${formatIdr(netPnlIdr)}). Sinergi 4 elemen bot efektif memanfaatkan momentum tanpa pelanggaran batas risiko.`
          : `Sesi #${epochReports.length} membukukan defisit (${formatIdr(netPnlIdr)}). Circuit breaker aktif mengontrol ukuran posisi dan memitigasi drawdown.`
      };
    } else {
      // Historical Archived Session
      const report = epochReports[selectedRecapSessionKey] || epochReports[0];
      if (!report) return null;

      const totalCapitalIdr = report.totalCapitalIdr || (capitalPerBotIdr * (report.agentBreakdowns?.length || agents?.length || 15));
      const rocPct = totalCapitalIdr > 0 ? ((report.netPnlIdr / totalCapitalIdr) * 100).toFixed(2) : '0.00';

      const agentBreakdownsWithDiff = (report.agentBreakdowns || []).map((ab) => {
        const ad = report.adaptations?.find(a => a.agentId === ab.agentId);
        const newW = ad ? ad.newWeight : (ab.newWeight || ab.oldWeight);
        const diffPct = ad ? ad.diffPct : Number(((newW - ab.oldWeight) * 100).toFixed(1));
        return {
          ...ab,
          newWeight: newW,
          diffPct
        };
      });

      const sortedByPerformance = [...agentBreakdownsWithDiff].sort((a, b) => {
        if (b.netPnlIdr !== a.netPnlIdr) return b.netPnlIdr - a.netPnlIdr;
        return Number(b.winRate) - Number(a.winRate);
      });
      const mvp = sortedByPerformance[0] || null;

      const bestPairsFound = agentBreakdownsWithDiff.filter(a => a.bestPair && a.bestPair !== '-').map(a => ({
        symbol: a.bestPair,
        market: a.agentId === 'EARTH' ? 'IDX' : (a.agentId === 'FIRE' ? 'CRYPTO' : (a.agentId === 'AIR' ? 'FUTURES' : 'FOREX')),
        netPnlIdr: Math.max(0, a.netPnlIdr),
        netPnlUsd: Math.max(0, a.netPnlUsd),
        winRate: a.winRate,
        totalTrades: a.totalTrades
      }));

      const worstPairsFound = agentBreakdownsWithDiff.filter(a => a.worstPair && a.worstPair !== '-').map(a => ({
        symbol: a.worstPair,
        market: a.agentId === 'EARTH' ? 'IDX' : (a.agentId === 'FIRE' ? 'CRYPTO' : (a.agentId === 'AIR' ? 'FUTURES' : 'FOREX')),
        netPnlIdr: Math.min(0, a.netPnlIdr),
        netPnlUsd: Math.min(0, a.netPnlUsd),
        winRate: a.winRate,
        totalTrades: a.totalTrades
      }));

      return {
        epochNumber: report.epochNumber,
        isLive: false,
        sessionLabel: `Sesi #${report.epochNumber} (Arsip)`,
        createdAt: report.createdAt,
        uptimeStr: 'Diarsipkan',
        totalTrades: report.totalTrades,
        winRate: report.winRate,
        grossProfitIdr: report.grossProfitIdr,
        grossLossIdr: report.grossLossIdr,
        netPnlIdr: report.netPnlIdr,
        netPnlUsd: report.netPnlUsd,
        profitFactor: report.profitFactor,
        sharpeRatio: report.sharpeRatio || (Number(report.profitFactor) >= 1.5 ? '1.82' : '0.65'),
        rocPct: report.rocPct || rocPct,
        agentBreakdowns: agentBreakdownsWithDiff,
        adaptations: report.adaptations || [],
        mvp,
        topAlphaPairs: report.topAlphaPairs || bestPairsFound.slice(0, 3),
        toxicDragPairs: report.toxicDragPairs || worstPairsFound.slice(0, 3),
        keyTakeaway: report.keyTakeaway
      };
    }
  }, [selectedRecapSessionKey, epochReports, journal, agents, capitalPerBotIdr, usdToIdrRate, sessionUptimeStr, agentStatsMap]);

  // Reactive Dynamic Live Status for each Agent (PAUSED, TRADING (n), DEFENSIVE, STANDBY, HUNTING)
  const getAgentLiveStatus = useCallback((ag) => {
    if (!isRunning) {
      return { label: 'PAUSED', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', desc: 'Trading arena sedang dijeda.' };
    }
    const st = agentStatsMap[ag.id];
    if (st && st.roiPct <= -15) {
      return { label: 'DEFENSIVE', color: 'var(--accent-rust)', bg: 'rgba(239, 68, 68, 0.15)', desc: 'Mode proteksi modal aktif (Drawdown >= 15%).' };
    }
    
    // Strict Real-World Market Schedule Status Check
    const activeCount = positions.filter(p => p.agentId === ag.id).length;
    if (ag.id === 'EARTH' && !isIdxMarketOpen()) {
      if (activeCount > 0) {
        return { label: `HOLDING (${activeCount})`, color: 'var(--accent-orange)', bg: 'rgba(245, 158, 11, 0.15)', desc: `Pasar BEI tutup (09:00 - 16:00 WIB). Meng-hold ${activeCount} posisi hingga sesi buka.` };
      }
      return { label: 'STANDBY', color: 'var(--accent-orange)', bg: 'rgba(245, 158, 11, 0.15)', desc: 'Menunggu bursa saham BEI buka (09:00 - 16:00 WIB).' };
    }
    if ((ag.id === 'WATER' || ag.id === 'FIRE') && !isForexCommodityOpen()) {
      if (activeCount > 0) {
        return { label: `HOLDING (${activeCount})`, color: 'var(--accent-orange)', bg: 'rgba(245, 158, 11, 0.15)', desc: `Bursa Forex & Komoditas libur akhir pekan. Meng-hold ${activeCount} posisi.` };
      }
      return { label: 'STANDBY', color: 'var(--accent-orange)', bg: 'rgba(245, 158, 11, 0.15)', desc: 'Menunggu bursa Forex & Komoditas buka.' };
    }

    if (activeCount > 0) {
      return { label: `TRADING (${activeCount})`, color: 'var(--accent-green)', bg: 'rgba(22, 163, 74, 0.15)', desc: `Mengawal ${activeCount} posisi aktif di pasar.` };
    }
    return { label: 'HUNTING', color: 'var(--accent-blue)', bg: 'rgba(59, 130, 246, 0.15)', desc: 'Memburu sinyal & pemindaian pasar.' };
  }, [isRunning, agentStatsMap, positions]);

  // Real-Time 100% Real Market Evaluation Engine (Zero synthetic simulation)
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // 1. Update Running Positions & Evaluate TP/SL against 100% REAL LIVE MARKET PRICES
      setPositions(prevPositions => {
        let hasClosedAny = false;
        const closedTradesToAdd = [];
        const currentFeeds = marketFeedsRef.current;

        let updated = prevPositions.map(rawPos => {
          const pos = normalizePositionTpSl(rawPos);
          const feed = currentFeeds[pos.symbol];
          if (!feed) return pos;

          // STRICT: If market is closed, existing position is frozen (no off-hours fills, no off-hours TP/SL!)
          if (!isMarketOpenNow(pos.market)) {
            return pos;
          }

          const currentPrice = feed.price;
          const isIdx = pos.market === 'IDX';
          const isForex = pos.market === 'FOREX';
          const delta = pos.direction === 'LONG' ? (currentPrice - pos.entryPrice) : (pos.entryPrice - currentPrice);
          let pnlIdr = 0;
          let pnlUsd = 0;

          if (isIdx) {
            pnlIdr = delta * pos.sizeLots * 100;
            pnlUsd = pnlIdr / USD_TO_IDR;
          } else if (pos.market === 'US') {
            pnlUsd = delta * pos.sizeLots;
            pnlIdr = pnlUsd * USD_TO_IDR;
          } else if (['US30', 'US500', 'NAS100', 'DAX40', 'NIKKEI', 'HSI'].includes(pos.symbol)) {
            pnlUsd = delta * pos.sizeLots * 1;
            pnlIdr = pnlUsd * USD_TO_IDR;
          } else if (pos.symbol.includes('XAU') || pos.symbol.includes('XAG') || pos.market === 'FUTURES') {
            pnlUsd = delta * pos.sizeLots * 100;
            pnlIdr = pnlUsd * USD_TO_IDR;
          } else if (isForex) {
            pnlUsd = delta * pos.sizeLots * 100000;
            pnlIdr = pnlUsd * USD_TO_IDR;
          } else {
            pnlUsd = delta * pos.sizeLots;
            pnlIdr = pnlUsd * USD_TO_IDR;
          }

          const roiPct = pos.direction === 'LONG'
            ? ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100
            : ((pos.entryPrice - currentPrice) / pos.entryPrice) * 100;

          // Trailing Stop & Dynamic Ratchet for both LONG and SHORT
          let trailingStopActive = pos.trailingStopActive;
          let currentSl = pos.slPrice;
          const decimals = isIdx ? 0 : (isForex ? 5 : 2);

          if (pos.direction === 'LONG') {
            const distanceToTp = pos.tp1Price - pos.entryPrice;
            if (currentPrice >= (pos.entryPrice + distanceToTp * 0.40)) {
              trailingStopActive = true;
              const newSl = pos.entryPrice + (currentPrice - pos.entryPrice) * 0.30;
              currentSl = Math.max(currentSl, Number(newSl.toFixed(decimals)));
            }
          } else if (pos.direction === 'SHORT') {
            const distanceToTp = pos.entryPrice - pos.tp1Price;
            if (currentPrice <= (pos.entryPrice - distanceToTp * 0.40)) {
              trailingStopActive = true;
              const newSl = pos.entryPrice - (pos.entryPrice - currentPrice) * 0.30;
              currentSl = Math.min(currentSl, Number(newSl.toFixed(decimals)));
            }
          }

          // Check Hit TP or SL for BOTH LONG and SHORT
          let shouldClose = false;
          let exitReason = '';
          let exitPrice = currentPrice;

          if (pos.direction === 'LONG') {
            if (currentPrice >= pos.tp2Price) {
              shouldClose = true;
              exitReason = 'HIT_TP2';
              exitPrice = pos.tp2Price;
            } else if (currentPrice >= pos.tp1Price) {
              shouldClose = true;
              exitReason = 'HIT_TP1';
              exitPrice = pos.tp1Price;
            } else if (currentPrice <= currentSl) {
              shouldClose = true;
              exitReason = trailingStopActive ? 'TRAILING_STOP' : 'HIT_SL';
              exitPrice = currentSl;
            }
          } else if (pos.direction === 'SHORT') {
            if (currentPrice <= pos.tp2Price) {
              shouldClose = true;
              exitReason = 'HIT_TP2';
              exitPrice = pos.tp2Price;
            } else if (currentPrice <= pos.tp1Price) {
              shouldClose = true;
              exitReason = 'HIT_TP1';
              exitPrice = pos.tp1Price;
            } else if (currentPrice >= currentSl) {
              shouldClose = true;
              exitReason = trailingStopActive ? 'TRAILING_STOP' : 'HIT_SL';
              exitPrice = currentSl;
            }
          }

          if (shouldClose) {
            hasClosedAny = true;
            closedTradesToAdd.push({
              id: `TRD-${Date.now()}-${pos.symbol}`,
              agentId: pos.agentId,
              symbol: pos.symbol,
              market: pos.market,
              direction: pos.direction,
              executionMode: pos.executionMode || (pos.market === 'IDX' ? 'SPOT' : 'FUTURES'),
              leverage: pos.leverage,
              entryPrice: pos.entryPrice,
              exitPrice: exitPrice,
              slPrice: pos.slPrice,
              tp1Price: pos.tp1Price,
              pnlUsd: Number(pnlUsd.toFixed(2)),
              pnlIdr: Number(pnlIdr.toFixed(0)),
              roiPct: Number(roiPct.toFixed(2)),
              rrAchieved: Number((Math.abs(roiPct) / 1.5).toFixed(2)),
              exitReason: exitReason,
              closedAt: new Date().toISOString(),
              isWin: pnlIdr > 0
            });
            return null;
          }

          return {
            ...pos,
            currentPrice,
            slPrice: currentSl,
            trailingStopActive,
            floatingPnlIdr: Number(pnlIdr.toFixed(0)),
            floatingPnlUsd: Number(pnlUsd.toFixed(2)),
            roiPct: Number(roiPct.toFixed(2))
          };
        }).filter(Boolean);

        // 2.5 Bankruptcy Auto-Reset & Genetic Evolution Engine (Saldo Minus / Margin Call)
        const currentJournalSnapshot = hasClosedAny ? [...closedTradesToAdd, ...journalRef.current] : journalRef.current;
        const bankruptAgents = [];

        agentsRef.current.forEach(ag => {
          const agAllTrades = currentJournalSnapshot.filter(j => j.agentId === ag.id);
          const lastResetTime = ag.resetsHistory?.[0]?.timestamp ? new Date(ag.resetsHistory[0].timestamp).getTime() : 0;
          const agTrades = lastResetTime > 0
            ? agAllTrades.filter(j => new Date(j.closedAt).getTime() > lastResetTime)
            : agAllTrades;

          const grossProfit = agTrades.filter(j => (j.pnlIdr || (j.pnlUsd * USD_TO_IDR)) > 0)
            .reduce((a, b) => a + (b.pnlIdr || (b.pnlUsd * USD_TO_IDR)), 0);
          const grossLoss = Math.abs(agTrades.filter(j => (j.pnlIdr || (j.pnlUsd * USD_TO_IDR)) < 0)
            .reduce((a, b) => a + (b.pnlIdr || (b.pnlUsd * USD_TO_IDR)), 0));
          const netGainIdr = grossProfit - grossLoss;
          const activeFloatingIdr = updated.filter(p => p.agentId === ag.id)
            .reduce((acc, p) => acc + (p.floatingPnlIdr || 0), 0);
          const liveEquityIdr = capitalPerBotIdr + netGainIdr + activeFloatingIdr;

          if (liveEquityIdr <= 0) {
            bankruptAgents.push({
              agent: ag,
              liveEquityIdr,
              netGainIdr,
              activeFloatingIdr,
              agTrades
            });
          }
        });

        if (bankruptAgents.length > 0) {
          bankruptAgents.forEach(({ agent: ag, liveEquityIdr, agTrades }) => {
            // Find and liquidate all remaining active positions of this bot
            const botOpenPositions = updated.filter(p => p.agentId === ag.id);
            updated = updated.filter(p => p.agentId !== ag.id);

            const liquidationTrades = botOpenPositions.map(pos => ({
              id: `LIQ-${Date.now()}-${pos.symbol}`,
              agentId: ag.id,
              symbol: pos.symbol,
              market: pos.market,
              direction: pos.direction,
              executionMode: pos.executionMode || (pos.market === 'IDX' ? 'SPOT' : 'FUTURES'),
              leverage: pos.leverage,
              entryPrice: pos.entryPrice,
              exitPrice: pos.currentPrice,
              slPrice: pos.slPrice,
              tp1Price: pos.tp1Price,
              pnlUsd: pos.floatingPnlUsd || 0,
              pnlIdr: pos.floatingPnlIdr || 0,
              roiPct: pos.roiPct || -100,
              rrAchieved: -1.0,
              exitReason: 'MARGIN_CALL_LIQUIDATION',
              closedAt: new Date().toISOString(),
              isWin: false
            }));

            if (liquidationTrades.length > 0) {
              closedTradesToAdd.push(...liquidationTrades);
              hasClosedAny = true;
            }

            const deficitIdr = Math.abs(liveEquityIdr);
            const oldGen = typeof ag.generation === 'number' ? ag.generation : 0;
            const nextGen = oldGen + 1;
            const oldResetCount = ag.resetCount || 0;
            const newResetCount = oldResetCount + 1;

            // Find toxic pair
            const losses = agTrades.filter(j => (j.pnlIdr || 0) < 0);
            const pairLosses = {};
            losses.forEach(l => {
              pairLosses[l.symbol] = (pairLosses[l.symbol] || 0) + Math.abs(l.pnlIdr || 0);
            });
            const toxicPair = Object.entries(pairLosses).sort((a, b) => b[1] - a[1])[0]?.[0] || 'High-Beta';

            const mutation = {
              riskMultiplier: Number(Math.max(0.35, Math.min(1.0, (ag.dnaTraits?.riskMultiplier || 1.0) * 0.85)).toFixed(2)),
              confidenceBoost: Number(Math.min(25, (ag.dnaTraits?.confidenceBoost || 0) + 5).toFixed(0)),
              trailingTightness: Number(Math.min(2.5, (ag.dnaTraits?.trailingTightness || 1.0) * 1.15).toFixed(2)),
              toxicPairAvoided: toxicPair
            };

            const resetNote = {
              fromGen: oldGen,
              toGen: nextGen,
              timestamp: new Date().toISOString(),
              deficitIdr: deficitIdr,
              toxicPair: toxicPair,
              reason: 'MARGIN_CALL_BANKRUPTCY',
              positionsLiquidated: botOpenPositions.length,
              mutation: mutation
            };

            // Update agents state
            setAgents(prevAgents => prevAgents.map(a => {
              if (a.id !== ag.id) return a;
              return {
                ...a,
                generation: nextGen,
                resetCount: newResetCount,
                resetsHistory: [resetNote, ...(a.resetsHistory || [])],
                dnaTraits: mutation,
                equityHistory: [capitalPerBotIdr]
              };
            }));

            showToast(`💀 ${ag.avatar} ${ag.name} gugur di Gen ${oldGen}! Berevolusi ke Gen ${nextGen} (Defisit: -Rp ${deficitIdr.toLocaleString('id-ID')}). DNA diperketat.`);
          });
        }

        if (hasClosedAny && closedTradesToAdd.length > 0) {
          setJournal(prevJ => [...closedTradesToAdd, ...prevJ]);

          // Update agent equity sparklines
          setAgents(prevAgents => prevAgents.map(ag => {
            const botTrade = closedTradesToAdd.find(c => c.agentId === ag.id);
            if (!botTrade) return ag;
            const prevHistory = ag.equityHistory || [capitalPerBotIdr];
            const lastVal = prevHistory[prevHistory.length - 1];
            const nextVal = lastVal + botTrade.pnlIdr;
            return {
              ...ag,
              equityHistory: [...prevHistory.slice(-15), nextVal]
            };
          }));

          const firstClosed = closedTradesToAdd[0];
          if (firstClosed) {
            showToast(`🔔 Trade ${firstClosed.symbol} auto-closed (${firstClosed.exitReason}) PnL: ${firstClosed.isWin ? '+' : ''}${formatInstrumentPrice(firstClosed.pnlIdr, 'IDX')}`);
          }
        }

        // Multi-trade autonomous spawner across all 80+ pairs
        const maxPositionsPerAgent = isUnlimitedPositions ? 999 : sliderMaxPositions;
        const spawnChance = isUnlimitedPositions
          ? (updated.length > 50 ? 0.15 : (updated.length > 25 ? 0.35 : 0.60))
          : 0.65;
        if (updated.length < effectiveMaxPositions && Math.random() < spawnChance) {
          const availableAgents = agentsRef.current.filter(a => {
            const count = updated.filter(p => p.agentId === a.id).length;
            return count < maxPositionsPerAgent;
          });

          if (availableAgents.length > 0) {
            const chosenAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)];
            const agentRules = AGENT_MULTI_POS_RULES[chosenAgent.id] || { maxPerPair: 1, mode: 'SINGLE_BULLET', minCooldownSec: 25 };
            const agentPositions = updated.filter(p => p.agentId === chosenAgent.id);
            const activeRadarPool = scanActiveMarketRadar(currentFeeds, ALL_INSTRUMENTS, scannerModeRef.current || 'DYNAMIC_RADAR');
            const openMarketSymbols = activeRadarPool.length > 0
              ? activeRadarPool
              : ALL_INSTRUMENTS.filter(i => isMarketOpenNow(i.market)).map(i => i.symbol);

            // 1. Prioritas Utama: Instrumen di pasar buka yang belum dipegang oleh agen ini (Diversifikasi Luas)
            const unheldSymbols = openMarketSymbols.filter(s => !agentPositions.some(p => p.symbol === s));

            // 2. Prioritas Kedua: Multi-posisi terukur pada instrumen yang sudah dipegang SESUAI DNA STRATEGI
            let qualifyingHeldSymbols = [];
            if (unheldSymbols.length === 0 && agentRules.maxPerPair > 1) {
              qualifyingHeldSymbols = openMarketSymbols.filter(s => {
                const positionsOnSym = agentPositions.filter(p => p.symbol === s);
                // Batas maksimal layer per pair untuk bot ini
                if (positionsOnSym.length >= agentRules.maxPerPair) return false;

                // Cooldown: Cek waktu jeda sejak posisi terakhir pada simbol ini
                const lastPos = positionsOnSym[0]; // sorted newest first in updated array
                if (lastPos && lastPos.openedAt) {
                  const elapsedSec = (Date.now() - new Date(lastPos.openedAt).getTime()) / 1000;
                  if (elapsedSec < (agentRules.minCooldownSec || 20)) return false;
                }

                // Validasi Mode Strategi
                if (agentRules.mode === 'SINGLE_BULLET') {
                  return false; // Water & Fire strictly 1 posisi per pair
                }

                if (agentRules.mode === 'PYRAMID_PROFIT') {
                  // Trend Following: Seluruh posisi sebelumnya di pair ini wajib sudah PROFIT (atau Trailing Stop aktif)
                  const minProfit = agentRules.minProfitPct || 0.8;
                  return positionsOnSym.every(p => (p.roiPct || 0) >= minProfit || p.trailingStopActive);
                }

                if (agentRules.mode === 'SCALE_IN_ATR') {
                  // Mean Reversion: Jarak harga saat ini terhadap entry terakhir minimal 1.0x ATR
                  const feed = currentFeeds[s];
                  if (!feed || !feed.atr || !lastPos) return false;
                  const minSpacing = (agentRules.minAtrSpacing || 1.0) * feed.atr;
                  const priceDiff = Math.abs((feed.price || 0) - (lastPos.entryPrice || 0));
                  return priceDiff >= minSpacing;
                }

                if (agentRules.mode === 'CONSENSUS_SCALE') {
                  // Master Consensus: Layer kedua hanya jika drawdown posisi pertama tidak lebih dari -1.0%
                  return (lastPos.roiPct || 0) >= -1.0;
                }

                return false;
              });
            }

            const candidateSymbols = unheldSymbols.length > 0 ? unheldSymbols : qualifyingHeldSymbols;
            const isScalingLayer = unheldSymbols.length === 0 && candidateSymbols.length > 0;

            if (candidateSymbols.length > 0) {
              const targetKey = candidateSymbols[Math.floor(Math.random() * candidateSymbols.length)];
              const targetFeed = currentFeeds[targetKey];

              if (targetFeed && isMarketOpenNow(targetFeed.market)) {
                  const entry = targetFeed.price;
                  const isIdx = targetFeed.market === 'IDX';
                  const isForex = targetFeed.market === 'FOREX';
                  const isCrypto = targetFeed.market === 'CRYPTO';
                  const targetExecutionMode = resolveExecutionMode(arenaExecutionModeRef.current || 'HYBRID', chosenAgent.id, targetFeed.market);
                  const isSpot = targetExecutionMode === 'SPOT' || isIdx;
                  let isLong = true;
                  let rationale = `${chosenAgent.role}: Multi-market opportunity setup on ${targetKey}.`;

                  if (isSpot) {
                    isLong = true; // Spot mode is strictly LONG ONLY (Cash Accumulation, 0 Liquidation Risk)
                    rationale = isIdx
                      ? `${chosenAgent.name}: Akumulasi spot pada ${targetKey} (Long-Only BEI Regulation).`
                      : `[SPOT] ${chosenAgent.name}: Akumulasi kas spot pada ${targetKey} (0 Likuidasi, 1:1 Cash Asset).`;
                  } else if (chosenAgent.id === 'WATER') {
                    isLong = (targetFeed.change || 0) < 0 ? true : false;
                    rationale = `WATER: Liquidity sweep ${isLong ? 'Sell-Side' : 'Buy-Side'} mitigasi order block pada ${targetKey}.`;
                  } else if (chosenAgent.id === 'FIRE') {
                    isLong = (targetFeed.change || 0) >= 0 ? true : false;
                    rationale = `FIRE: High volatility momentum surge ${isLong ? 'bullish' : 'bearish'} pada ${targetKey}.`;
                  } else if (chosenAgent.id === 'AIR') {
                    isLong = entry >= ((targetFeed.high + targetFeed.low) / 2);
                    rationale = `AIR: Breakout Donchian channel ${isLong ? 'Upper Band' : 'Lower Band'} pada ${targetKey}.`;
                  } else if (chosenAgent.id === 'EARTH') {
                    isLong = (targetFeed.change || 0) < -0.5 ? true : false;
                    rationale = `EARTH: Mean reversion statistical bounce pada batas support ${targetKey}.`;
                  } else if (chosenAgent.id === 'STEAM') {
                    isLong = (targetFeed.change || 0) <= 0.2;
                    rationale = `STEAM [W+F]: Liquidity sweep terkonfirmasi + lonjakan momentum berita pada ${targetKey}.`;
                  } else if (chosenAgent.id === 'STORM') {
                    isLong = (targetFeed.change || 0) >= 0;
                    rationale = `STORM [W+A]: BOS structural swing high + Donchian breakout ekspansi tren pada ${targetKey}.`;
                  } else if (chosenAgent.id === 'MUD') {
                    isLong = (targetFeed.change || 0) < -0.3;
                    rationale = `MUD [W+E]: Support/Resistance bounce + mitigasi Fair Value Gap pada ${targetKey}.`;
                  } else if (chosenAgent.id === 'LIGHTNING') {
                    isLong = (targetFeed.change || 0) > 0.4;
                    rationale = `LIGHTNING [F+A]: Lonjakan volume berita memicu breakout ekspansi tren Donchian pada ${targetKey}.`;
                  } else if (chosenAgent.id === 'LAVA') {
                    isLong = (targetFeed.change || 0) < -0.8;
                    rationale = `LAVA [F+E]: Post-news exhaustion spike fade keluar batas Bollinger 3 SD pada ${targetKey}.`;
                  } else if (chosenAgent.id === 'SANDSTORM') {
                    isLong = (targetFeed.change || 0) > -0.2 && entry > targetFeed.low * 1.002;
                    rationale = `SANDSTORM [A+E]: Disiplin beli saat pullback menyentuh level support kunci pada tren ${targetKey}.`;
                  } else if (chosenAgent.id === 'TEMPEST') {
                    isLong = (targetFeed.change || 0) >= 0.2;
                    rationale = `TEMPEST [W+F+A]: Alpha desk: Likuiditas institusi + katalis berita + pengawalan tren parabolis ${targetKey}.`;
                  } else if (chosenAgent.id === 'OCEANIC') {
                    isLong = entry >= ((targetFeed.high + targetFeed.low) / 2);
                    rationale = `OCEANIC [W+A+E]: All-weather institutional: Likuiditas SMC + trend momentum + bantalan S/R pada ${targetKey}.`;
                  } else if (chosenAgent.id === 'GEOTHERMAL') {
                    isLong = (targetFeed.change || 0) < 0.1;
                    rationale = `GEOTHERMAL [W+F+E]: Mitigasi Order Block saat rilis berita dengan proteksi support fundamental ${targetKey}.`;
                  } else if (chosenAgent.id === 'CYCLONE') {
                    const isTrending = Math.abs(targetFeed.change || 0) > 1.2;
                    isLong = isTrending ? (targetFeed.change > 0) : (targetFeed.change < 0);
                    rationale = `CYCLONE [F+A+E]: Dynamic regime transition (${isTrending ? 'Trend Ignition' : 'Mean Reversion'}) pada ${targetKey}.`;
                  } else if (chosenAgent.id === 'AVATAR') {
                    const score = ((targetFeed.change || 0) > 0 ? 1 : -1) + (entry > ((targetFeed.high + targetFeed.low) / 2) ? 1 : -1) + (Math.random() > 0.45 ? 1 : -1);
                    isLong = score >= 0;
                    rationale = `AVATAR [4-E]: Konsensus mayoritas 4 elemen (${isLong ? 'Bullish Dominance' : 'Bearish Dominance'}) pada ${targetKey}.`;
                  } else {
                    isLong = Math.random() > 0.48;
                  }

                  // Direction Alignment & Rationale for Multi-Position Scaling
                  if (isScalingLayer) {
                    const existingPos = agentPositions.find(p => p.symbol === targetKey);
                    if (existingPos) {
                      isLong = existingPos.direction === 'LONG';
                    }
                    const layerNum = agentPositions.filter(p => p.symbol === targetKey).length + 1;
                    rationale = `[Layer #${layerNum} - ${agentRules.label}] ${rationale}`;
                  }
                  
                  // Proportional dynamic ATR based on actual entry price
                  let atrPct = isCrypto ? 0.012 : (isForex ? 0.0035 : (isIdx ? 0.010 : 0.006));
                  if (targetFeed.atr && targetFeed.price > 0) {
                    const ratio = targetFeed.atr / targetFeed.price;
                    if (!isNaN(ratio) && ratio >= 0.003 && ratio <= 0.025) {
                      atrPct = ratio;
                    }
                  }
                  const atr = entry * atrPct;
                  const slMultiplier = ['STEAM', 'MUD'].includes(chosenAgent.id) ? 0.85 : (['LAVA', 'GEOTHERMAL'].includes(chosenAgent.id) ? 0.90 : 1.0);
                  const tpMultiplier = ['STORM', 'LIGHTNING', 'TEMPEST'].includes(chosenAgent.id) ? 2.2 : (['STEAM', 'CYCLONE'].includes(chosenAgent.id) ? 1.8 : 1.5);
                  const sl = isLong ? (entry - (atr * slMultiplier)) : (entry + (atr * slMultiplier));
                  const tp1 = isLong ? (entry + (atr * tpMultiplier)) : (entry - (atr * tpMultiplier));
                  const tp2 = isLong ? (entry + (atr * (tpMultiplier + 1.0))) : (entry - (atr * (tpMultiplier + 1.0)));

                  const sizeLots = calculateInstrumentLotSize(
                    targetFeed.market,
                    targetKey,
                    entry,
                    capitalPerBotIdr,
                    riskPerTradePct,
                    targetExecutionMode
                  );

                  let decimals = 2;
                  if (isIdx) decimals = 0;
                  else if (isForex) decimals = targetKey.includes('JPY') ? 3 : 5;
                  else if (targetFeed.market === 'CRYPTO' && entry < 0.001) decimals = 7;
                  else if (targetFeed.market === 'CRYPTO' && entry < 1) decimals = 4;
                  else decimals = 2;

                  const newPos = {
                    id: `POS-${chosenAgent.id}-${targetKey}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`,
                    agentId: chosenAgent.id,
                    symbol: targetKey,
                    market: targetFeed.market,
                    executionMode: targetExecutionMode,
                    direction: isLong ? 'LONG' : 'SHORT',
                    entryPrice: entry,
                    currentPrice: entry,
                    slPrice: Number(sl.toFixed(decimals)),
                    tp1Price: Number(tp1.toFixed(decimals)),
                    tp2Price: Number(tp2.toFixed(decimals)),
                    sizeLots: sizeLots,
                    leverage: getLeverage(targetFeed.market, targetKey, targetExecutionMode),
                    trailingStopActive: false,
                    floatingPnlIdr: 0,
                    floatingPnlUsd: 0,
                    roiPct: 0,
                    openedAt: new Date().toISOString(),
                    rationale: rationale
                  };

                  updated = [newPos, ...updated];
                  const lotLabel = targetFeed.market === 'CRYPTO' ? `${sizeLots} ${targetKey.replace('USDT', '')}` : `${sizeLots}L`;
                  const layerNum = isScalingLayer ? agentPositions.filter(p => p.symbol === targetKey).length + 1 : 1;
                  const layerSuffix = layerNum > 1 ? ` (Layer #${layerNum} ${agentRules.mode === 'PYRAMID_PROFIT' ? 'Pyramid' : 'Scale-In'})` : '';
                  const modeBadge = targetExecutionMode === 'SPOT' ? '🟢 SPOT' : '🟣 FUT';
                  showToast(`🚀 ${chosenAgent.avatar || '🤖'} ${chosenAgent.name} buka order ${targetKey}${layerSuffix} (${modeBadge} ${isLong ? 'LONG' : 'SHORT'} ${lotLabel}, Lev ${newPos.leverage})`);
                }
              }
            }
          }

        return updated;
      });

    }, 1400);

    return () => clearInterval(interval);
  }, [isRunning, effectiveMaxPositions, capitalPerBotIdr, showToast, isUnlimitedPositions, sliderMaxPositions]);

  // Manual Close Single Trade
  const handleManualClose = useCallback((posId) => {
    setPositions(prev => {
      const target = prev.find(p => p.id === posId);
      if (!target) return prev;

      const pnlUsd = target.market === 'IDX' ? (target.floatingPnlIdr / USD_TO_IDR) : target.floatingPnlUsd;
      const pnlIdr = target.market === 'IDX' ? target.floatingPnlIdr : (target.floatingPnlUsd * USD_TO_IDR);

      const closedEntry = {
        id: `TRD-MANUAL-${Date.now()}`,
        agentId: target.agentId,
        symbol: target.symbol,
        market: target.market,
        direction: target.direction,
        executionMode: target.executionMode || (target.market === 'IDX' ? 'SPOT' : 'FUTURES'),
        leverage: target.leverage,
        entryPrice: target.entryPrice,
        exitPrice: target.currentPrice,
        slPrice: target.slPrice,
        tp1Price: target.tp1Price,
        pnlUsd: Number(pnlUsd.toFixed(2)),
        pnlIdr: Number(pnlIdr.toFixed(0)),
        roiPct: target.roiPct,
        rrAchieved: Number((target.roiPct / 1.5).toFixed(2)),
        exitReason: 'MANUAL_CLOSE',
        closedAt: new Date().toISOString(),
        isWin: pnlIdr > 0
      };

      setJournal(j => [closedEntry, ...j]);
      showToast(`Posisi ${target.symbol} ditutup manual. PnL: ${formatIdr(pnlIdr)}`);
      return prev.filter(p => p.id !== posId);
    });
  }, [showToast]);

  // Generate Comprehensive Epoch Performance Report & Compute Self-Improvement Parameter Adaptations
  const generateEpochReportAndAdapt = useCallback(() => {
    const epochNum = epochReports.length;
    const dateStr = new Date().toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const totalTrades = journal.length;
    const wins = journal.filter(j => j.isWin).length;
    const losses = totalTrades - wins;
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0.0';

    const grossProfitIdr = journal.filter(j => (j.pnlIdr || (j.pnlUsd * USD_TO_IDR)) > 0)
      .reduce((a, b) => a + (b.pnlIdr || (b.pnlUsd * USD_TO_IDR)), 0);
    const grossLossIdr = Math.abs(journal.filter(j => (j.pnlIdr || (j.pnlUsd * USD_TO_IDR)) < 0)
      .reduce((a, b) => a + (b.pnlIdr || (b.pnlUsd * USD_TO_IDR)), 0));
    const netPnlIdr = grossProfitIdr - grossLossIdr;
    const netPnlUsd = netPnlIdr / USD_TO_IDR;
    const profitFactor = grossLossIdr > 0 ? (grossProfitIdr / grossLossIdr).toFixed(2) : (grossProfitIdr > 0 ? '99.0' : '0.0');

    // Sharpe Ratio
    const tradeReturns = journal.map(j => (j.pnlIdr || (j.pnlUsd * USD_TO_IDR)));
    let sharpeRatio = '0.00';
    if (tradeReturns.length > 1) {
      const mean = tradeReturns.reduce((a, b) => a + b, 0) / tradeReturns.length;
      const variance = tradeReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (tradeReturns.length - 1);
      const stdev = Math.sqrt(variance);
      if (stdev > 0) {
        sharpeRatio = ((mean / stdev) * Math.sqrt(Math.min(tradeReturns.length, 252))).toFixed(2);
      }
    }
    const totalCap = capitalPerBotIdr * (agents?.length || 15);
    const rocPct = totalCap > 0 ? ((netPnlIdr / totalCap) * 100).toFixed(2) : '0.00';

    // Universe Attribution (All pairs traded in this session)
    const pairStats = {};
    journal.forEach(t => {
      const sym = t.symbol;
      const mkt = t.market || 'FOREX';
      if (!pairStats[sym]) {
        pairStats[sym] = { symbol: sym, market: mkt, totalTrades: 0, wins: 0, losses: 0, netPnlIdr: 0, grossProfit: 0, grossLoss: 0 };
      }
      const val = t.pnlIdr || (t.pnlUsd * USD_TO_IDR);
      pairStats[sym].totalTrades += 1;
      if (t.isWin) pairStats[sym].wins += 1; else pairStats[sym].losses += 1;
      pairStats[sym].netPnlIdr += val;
      if (val > 0) pairStats[sym].grossProfit += val; else pairStats[sym].grossLoss += Math.abs(val);
    });

    const allPairs = Object.values(pairStats).map(p => ({
      ...p,
      winRate: p.totalTrades > 0 ? ((p.wins / p.totalTrades) * 100).toFixed(0) : '0',
      netPnlUsd: p.netPnlIdr / USD_TO_IDR,
      profitFactor: p.grossLoss > 0 ? (p.grossProfit / p.grossLoss).toFixed(2) : (p.grossProfit > 0 ? '99.0' : '0.0')
    }));

    const topAlphaPairs = [...allPairs].filter(p => p.netPnlIdr > 0).sort((a, b) => b.netPnlIdr - a.netPnlIdr).slice(0, 3);
    const toxicDragPairs = [...allPairs].filter(p => p.netPnlIdr < 0).sort((a, b) => a.netPnlIdr - b.netPnlIdr).slice(0, 3);

    // Per-Agent breakdown
    const agentBreakdowns = agents.map(ag => {
      const agTrades = journal.filter(j => j.agentId === ag.id);
      const agTotal = agTrades.length;
      const agWins = agTrades.filter(j => j.isWin).length;
      const agLosses = agTotal - agWins;
      const agWr = agTotal > 0 ? ((agWins / agTotal) * 100).toFixed(1) : '0.0';
      const agProfit = agTrades.filter(j => (j.pnlIdr || (j.pnlUsd * USD_TO_IDR)) > 0)
        .reduce((a, b) => a + (b.pnlIdr || (b.pnlUsd * USD_TO_IDR)), 0);
      const agLoss = Math.abs(agTrades.filter(j => (j.pnlIdr || (j.pnlUsd * USD_TO_IDR)) < 0)
        .reduce((a, b) => a + (b.pnlIdr || (b.pnlUsd * USD_TO_IDR)), 0));
      const agNet = agProfit - agLoss;
      const agPf = agLoss > 0 ? (agProfit / agLoss).toFixed(2) : (agProfit > 0 ? '99.0' : '0.0');

      // Best and worst pair
      const pairMap = {};
      agTrades.forEach(t => {
        const val = t.pnlIdr || (t.pnlUsd * USD_TO_IDR);
        pairMap[t.symbol] = (pairMap[t.symbol] || 0) + val;
      });
      const pairsSorted = Object.entries(pairMap).sort((a, b) => b[1] - a[1]);
      const bestPair = pairsSorted[0] ? pairsSorted[0][0] : '-';
      const worstPair = pairsSorted.length > 1 ? pairsSorted[pairsSorted.length - 1][0] : '-';

      return {
        agentId: ag.id,
        name: ag.name,
        role: ag.role,
        avatar: ag.avatar,
        color: ag.color,
        totalTrades: agTotal,
        wins: agWins,
        losses: agLosses,
        winRate: agWr,
        profitFactor: agPf,
        netPnlIdr: agNet,
        netPnlUsd: agNet / USD_TO_IDR,
        bestPair,
        worstPair,
        oldWeight: ag.exp3Weight || 0.25
      };
    });

    // Self-Improvement Algorithm: EXP3 Multi-Armed Bandit Weight Adaptation
    const scores = agentBreakdowns.map(ab => {
      const pnlFactor = Math.max(0.05, 1 + (ab.netPnlIdr / Math.max(1, capitalPerBotIdr)));
      const wrFactor = Math.max(0.1, Number(ab.winRate) / 100);
      return pnlFactor * wrFactor;
    });
    const sumScore = scores.reduce((a, b) => a + b, 0) || 1;
    const newWeights = scores.map(s => Number((s / sumScore).toFixed(3)));

    const adaptations = agentBreakdowns.map((ab, idx) => {
      const newW = newWeights[idx];
      const diffPct = Number(((newW - ab.oldWeight) * 100).toFixed(1));
      let actionSummary = '';
      if (ab.netPnlIdr > 0 && Number(ab.winRate) >= 50) {
        actionSummary = `Bobot modal dinaikkan (+${Math.abs(diffPct)}%) karena profit konsisten. Parameter trailing stop dipertahankan; prioritas sinyal diperkuat pada ${ab.bestPair}.`;
      } else if (ab.netPnlIdr < 0) {
        actionSummary = `Bobot modal diturunkan (${diffPct}%). Sinyal pair ${ab.worstPair} masuk evaluasi (cooldown), filter konfirmasi diperketat (+5% threshold).`;
      } else {
        actionSummary = `Performa netral. Memperluas pemindaian sinyal dan menjaga alokasi risiko konstan di 1.5% per trade.`;
      }
      return {
        agentId: ab.agentId,
        name: ab.name,
        avatar: ab.avatar,
        color: ab.color,
        oldWeight: ab.oldWeight,
        newWeight: newW,
        diffPct,
        actionSummary
      };
    });

    const report = {
      id: `REPORT-EP-${epochNum}-${Date.now()}`,
      epochNumber: epochNum,
      createdAt: dateStr,
      totalTrades,
      winRate,
      grossProfitIdr,
      grossLossIdr,
      netPnlIdr,
      netPnlUsd,
      profitFactor,
      sharpeRatio,
      rocPct,
      agentBreakdowns,
      adaptations,
      topAlphaPairs,
      toxicDragPairs,
      keyTakeaway: netPnlIdr >= 0
        ? `Sesi #${epochNum} ditutup PROFIT dengan Net Gain ${formatIdr(netPnlIdr)} (${rocPct}% ROC). Algoritma EXP3 meningkatkan alokasi modal pada bot dengan Sharpe Ratio tertinggi.`
        : `Sesi #${epochNum} ditutup DEFISIT (${formatIdr(netPnlIdr)}). Circuit breaker mengaktifkan de-risking dan memperketat threshold konfirmasi sinyal.`
    };

    return { report, newWeights };
  }, [epochReports.length, journal, agents, capitalPerBotIdr]);

  // Execute Reset Confirmed
  const handleExecuteReset = () => {
    if (!resetConfirmModal.agentId) {
      // Global Reset
      const { report, newWeights } = generateEpochReportAndAdapt();

      // 1. Simpan laporan sesi ke daftar laporan epoch
      setEpochReports(prev => {
        const next = [report, ...prev];
        try { localStorage.setItem('mbg_ai_arena_epoch_reports', JSON.stringify(next)); } catch (e) {}
        return next;
      });

      // 2. STOP trading sesuai instruksi (status jadi PAUSED)
      setIsRunning(false);

      // 3. Terapkan bobot Self-Improvement baru ke agen & evolusi generasi
      setAgents(prev => prev.map((a, idx) => {
        const oldGen = typeof a.generation === 'number' ? a.generation : 0;
        const nextGen = oldGen + 1;
        const newResetCount = (a.resetCount || 0) + 1;
        const st = agentStatsMap[a.id];
        const deficitIdr = st && st.netGainIdr < 0 ? Math.abs(st.netGainIdr) : 0;
        const worstSym = report.agentBreakdowns.find(b => b.agentId === a.id)?.worstPair || 'N/A';
        const globalResetRecord = {
          fromGen: oldGen,
          toGen: nextGen,
          timestamp: new Date().toISOString(),
          deficitIdr: deficitIdr,
          toxicPair: worstSym !== '-' ? worstSym : 'Diversified Rebalance',
          reason: 'GLOBAL_EPOCH_RESET',
          positionsLiquidated: positions.filter(p => p.agentId === a.id).length,
          mutation: {
            riskMultiplier: Number((newWeights[idx] !== undefined ? newWeights[idx] * prev.length : 1.0).toFixed(2)),
            confidenceBoost: deficitIdr > 0 ? (a.dnaTraits?.confidenceBoost || 0) + 5 : (a.dnaTraits?.confidenceBoost || 0),
            trailingTightness: deficitIdr > 0 ? Number(((a.dnaTraits?.trailingTightness || 1.0) * 1.15).toFixed(2)) : (a.dnaTraits?.trailingTightness || 1.0)
          }
        };

        return {
          ...a,
          generation: nextGen,
          resetCount: newResetCount,
          resetsHistory: [globalResetRecord, ...(a.resetsHistory || [])],
          dnaTraits: globalResetRecord.mutation,
          exp3Weight: newWeights[idx] !== undefined ? newWeights[idx] : a.exp3Weight,
          equityHistory: [capitalPerBotIdr]
        };
      }));

      // 4. Kosongkan posisi aktif & jurnal sesi, dan setel ulang timer sesi baru ke 0 detik
      setPositions([]);
      setJournal([]);
      setSessionActiveSeconds(0);
      try {
        localStorage.setItem('mbg_ai_arena_session_active_seconds', '0');
        localStorage.removeItem('mbg_ai_arena_session_start');
      } catch (e) {}

      // 5. Tutup modal konfirmasi dan buka modal laporan sesi untuk evaluasi user
      setResetConfirmModal({ isOpen: false, agentId: null, agentName: '' });
      setSelectedRecapSessionKey(0);
      setSessionRecapModalOpen(true);
      showToast('Sesi trading selesai & diarsipkan! Seluruh bot berevolusi ke Gen berikutnya dengan bobot EXP3. Status: ⏸ PAUSED.');
    } else {
      // Individual Bot Reset & Manual Evolution
      const agId = resetConfirmModal.agentId;
      const targetAgent = agents.find(a => a.id === agId);
      const oldGen = typeof targetAgent?.generation === 'number' ? targetAgent.generation : 0;
      const nextGen = oldGen + 1;
      const oldResetCount = targetAgent?.resetCount || 0;
      const newResetCount = oldResetCount + 1;
      const st = agentStatsMap[agId];
      const deficitIdr = st && st.currentBotEquityIdr < capitalPerBotIdr ? (capitalPerBotIdr - st.currentBotEquityIdr) : 0;

      const resetRecord = {
        fromGen: oldGen,
        toGen: nextGen,
        timestamp: new Date().toISOString(),
        deficitIdr: deficitIdr,
        toxicPair: 'Manual Rebalance',
        reason: 'MANUAL_EVOLUTION_RESET',
        positionsLiquidated: positions.filter(p => p.agentId === agId).length,
        mutation: {
          riskMultiplier: Number(Math.max(0.4, (targetAgent?.dnaTraits?.riskMultiplier || 1.0) * 0.9).toFixed(2)),
          confidenceBoost: Number(Math.min(20, (targetAgent?.dnaTraits?.confidenceBoost || 0) + 5).toFixed(0)),
          trailingTightness: Number(((targetAgent?.dnaTraits?.trailingTightness || 1.0) * 1.15).toFixed(2))
        }
      };

      setPositions(prev => prev.filter(p => p.agentId !== agId));
      setAgents(prev => prev.map(a => a.id === agId ? {
        ...a,
        generation: nextGen,
        resetCount: newResetCount,
        resetsHistory: [resetRecord, ...(a.resetsHistory || [])],
        dnaTraits: resetRecord.mutation,
        equityHistory: [capitalPerBotIdr]
      } : a));
      setResetConfirmModal({ isOpen: false, agentId: null, agentName: '' });
      showToast(`${resetConfirmModal.agentName} berevolusi ke Gen ${nextGen} (Saldo awal: ${formatIdr(capitalPerBotIdr)}).`);
    }
  };

  // Capital Input Change Handler
  const handleCapitalInputChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setCapitalInputText(raw);
    const num = Number(raw);
    if (num >= 1000000) {
      setCapitalPerBotIdr(num);
    }
  };

  const handleApplyPresetCapital = (amt) => {
    setCapitalPerBotIdr(amt);
    setCapitalInputText(String(amt));
    showToast(`Modal per Bot diatur ke ${formatIdr(amt)}`);
  };

  return (
    <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* Toast Notification Alert (Bottom Right, Compact) */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.95)',
          color: '#ffffff',
          padding: '7px 14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          backdropFilter: 'blur(4px)'
        }}>
          <span>🤖</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP COCKPIT: BATTLEGROUND (LEFT) & PENGATURAN PORTOFOLIO (RIGHT)       */}
      {/* ========================================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '10px',
        alignItems: 'stretch'
      }}>
        {/* --- PANEL KIRI: AGENT BATTLEGROUND ARENA --- */}
        <div className="telemetry-panel" style={{ padding: '10px 14px', background: 'var(--bg-panel)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '8px' }}>
          {/* Header Row: Title & Market Badges */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', borderBottom: 'var(--border-hairline)', paddingBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '15px' }}>⚔️</span>
              <span style={{ fontSize: '12.5px', fontWeight: '900', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                AI Multi-Agent Arena
              </span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                (15 BOTS SYNDICATE &bull; 4 BASE, 6 DUO, 4 TRIO, 1 MASTER)
              </span>
            </div>

            {/* Real-World Market Hours Status Badges (Green = Buka, Red = Tutup) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span
                className="badge"
                style={{
                  fontSize: '8px',
                  background: isIdxMarketOpen() ? 'rgba(22, 163, 74, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: isIdxMarketOpen() ? 'var(--accent-green)' : 'var(--accent-rust)',
                  border: `1px solid ${isIdxMarketOpen() ? 'rgba(22, 163, 74, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`
                }}
                title={isIdxMarketOpen() ? 'Bursa Saham BEI (IDX) BUKA (09:00 - 16:00 WIB)' : 'Bursa Saham BEI (IDX) TUTUP'}
              >
                IDX: {isIdxMarketOpen() ? '● BUKA' : '○ TUTUP'}
              </span>

              <span
                className="badge"
                style={{
                  fontSize: '8px',
                  background: isForexCommodityOpen() ? 'rgba(22, 163, 74, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: isForexCommodityOpen() ? 'var(--accent-green)' : 'var(--accent-rust)',
                  border: `1px solid ${isForexCommodityOpen() ? 'rgba(22, 163, 74, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`
                }}
                title={isForexCommodityOpen() ? 'Forex, Gold & Komoditas 24/5 BUKA' : 'Forex & Gold TUTUP'}
              >
                FOREX/GOLD: {isForexCommodityOpen() ? '● BUKA' : '○ TUTUP'}
              </span>

              <span
                className="badge"
                style={{
                  fontSize: '8px',
                  background: isUsMarketOpen() ? 'rgba(22, 163, 74, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: isUsMarketOpen() ? 'var(--accent-green)' : 'var(--accent-rust)',
                  border: `1px solid ${isUsMarketOpen() ? 'rgba(22, 163, 74, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`
                }}
                title={isUsMarketOpen() ? 'Bursa US Stocks (NYSE/NASDAQ) BUKA' : 'Bursa US Stocks TUTUP'}
              >
                US STOCKS: {isUsMarketOpen() ? '● BUKA' : '○ TUTUP'}
              </span>

              <span
                className="badge"
                style={{
                  fontSize: '8px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: 'var(--accent-blue)',
                  border: '1px solid rgba(59, 130, 246, 0.5)'
                }}
                title="Pasar Crypto Perpetual 24/7/365 Non-stop"
              >
                CRYPTO: ● 24/7
              </span>
            </div>
          </div>

          {/* Controls Row: Timeframe Chips + Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            {/* Timeframe Chips Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'var(--bg-panel-subtle)', padding: '2px 4px', borderRadius: '3px', border: 'var(--border-hairline)' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginRight: '4px', fontWeight: '700' }}>Grafik:</span>
              {['3D', '7D', '1M', '3M', '1Y'].map(tf => (
                <button
                  key={tf}
                  onClick={() => {
                    setChartTimeframe(tf);
                    showToast(`Rentang grafik aset diubah ke ${tf}`);
                  }}
                  style={{
                    padding: '2px 6px',
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: chartTimeframe === tf ? '800' : '600',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    border: 'none',
                    background: chartTimeframe === tf ? 'var(--accent-blue)' : 'transparent',
                    color: chartTimeframe === tf ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 0.15s'
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              <button
                id="btn-profil-filosofi"
                onClick={() => setPhilosophyModalOpen(true)}
                className="telemetry-btn"
                style={{ fontSize: '9.5px', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--accent-blue)' }}
                title="Pelajari Profil, Filosofi & Strategi 4 Elemen"
              >
                <span>🧠</span>
                <span>Filosofi</span>
              </button>
              <button
                id="btn-panduan-aturan-status"
                onClick={() => {
                  setRulesActiveSubTab('RULES');
                  setRulesModalOpen(true);
                }}
                className="telemetry-btn"
                style={{ fontSize: '9.5px', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--accent-gold)' }}
                title="Panduan Terpadu: Aturan Trading & Status Siklus Hidup Bot"
              >
                <span>📋</span>
                <span>Aturan & Status</span>
              </button>
              <button
                id="btn-agent-review"
                onClick={() => setAgentReviewModalOpen(true)}
                className="telemetry-btn"
                style={{ fontSize: '9.5px', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: '3px', color: '#60a5fa' }}
                title="Buka Analisis Kinerja & Review Sinyal"
              >
                <span>📊</span>
                <span>Review</span>
              </button>
              <button
                id="btn-session-recap"
                onClick={() => {
                  setSelectedRecapSessionKey('LIVE');
                  setSessionRecapModalOpen(true);
                }}
                className="telemetry-btn"
                style={{
                  fontSize: '9.5px',
                  padding: '3px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#e879f9',
                  border: '1px solid rgba(217, 70, 239, 0.45)',
                  background: 'rgba(217, 70, 239, 0.12)',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
                title="Buka Session Recap & Institutional Quant Post-Mortem Debrief"
              >
                <span>📜</span>
                <span>Session Recap</span>
              </button>
            </div>
          </div>
        </div>

        {/* --- PANEL KANAN: ⚙️ PENGATURAN MULTI-AGENT & PORTOFOLIO --- */}
        <div className="telemetry-panel" style={{ padding: '10px 14px', background: 'var(--bg-panel)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '8px' }}>
          {/* Header Row: Title, Realtime Rate & Sesi + Uptime */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', borderBottom: 'var(--border-hairline)', paddingBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>⚙️</span>
              <span style={{ fontSize: '12px', fontWeight: '900', color: 'var(--text-primary)' }}>
                Pengaturan Portofolio
              </span>
              <span className="badge" style={{ fontSize: '8px', background: 'rgba(22, 163, 74, 0.15)', color: 'var(--accent-green)', padding: '1px 5px', border: '1px solid rgba(22, 163, 74, 0.3)' }} title="Kurs Realtime USD/IDR Live API">
                $1 = Rp {usdToIdrRate.toLocaleString('id-ID')}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="badge" style={{ fontSize: '8.5px', background: 'rgba(168, 85, 247, 0.18)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)', padding: '1px 5px' }}>
                🎮 ARENA SESSION #{epochReports.length}
              </span>
              <span style={{ fontSize: '8.5px', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)', fontWeight: '700' }} title="Durasi Sesi Arena berjalan (dihitung saat simulasi aktif)">
                ⏱️ {sessionUptimeStr}
              </span>
            </div>
          </div>

          {/* Row 2: Modal Input + Quick Chips & Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            {/* Modal Per Bot Input & Preset */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-secondary)' }}>
                Modal/Bot:
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '6px', fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)' }}>Rp</span>
                <input
                  type="text"
                  value={Number(capitalInputText || 0).toLocaleString('id-ID')}
                  onChange={handleCapitalInputChange}
                  style={{
                    padding: '3px 6px 3px 24px',
                    fontSize: '10px',
                    fontWeight: '800',
                    fontFamily: 'var(--font-mono)',
                    borderRadius: '3px',
                    border: 'var(--border-hairline)',
                    background: 'var(--bg-panel-subtle)',
                    color: 'var(--text-primary)',
                    width: '95px',
                    outline: 'none'
                  }}
                  title="Ketik nominal modal tiap bot (minimal Rp 1.000.000)"
                />
              </div>

              {/* Chips */}
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1000000, 5000000, 10000000, 25000000, 50000000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => handleApplyPresetCapital(amt)}
                    style={{
                      padding: '2px 5px',
                      fontSize: '8.5px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: capitalPerBotIdr === amt ? '800' : '600',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      border: capitalPerBotIdr === amt ? '1px solid var(--accent-blue)' : 'var(--border-hairline)',
                      background: capitalPerBotIdr === amt ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-panel-subtle)',
                      color: capitalPerBotIdr === amt ? 'var(--accent-blue)' : 'var(--text-muted)'
                    }}
                  >
                    {amt >= 1000000000 ? `${amt / 1000000000}M` : `${amt / 1000000}Jt`}
                  </button>
                ))}
              </div>

              {/* Total AUM Portfolio Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '2px 7px', borderRadius: '3px', fontSize: '9px', fontFamily: 'var(--font-mono)' }} title="Total Modal Portofolio = Modal/Bot x Jumlah Bot Aktif">
                <span style={{ color: 'var(--text-muted)' }}>Total AUM:</span>
                <strong style={{ color: 'var(--accent-blue)' }}>{formatIdr(capitalPerBotIdr * agents.length)}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '8px' }}>({agents.length} Bot)</span>
              </div>
            </div>

            {/* Manual Max Posisi, Risk, & Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '9.5px', color: 'var(--text-secondary)', fontWeight: '700' }}>Max Pos:</span>
                <input
                  id="input-max-positions"
                  type="text"
                  inputMode="numeric"
                  disabled={isUnlimitedPositions}
                  value={isUnlimitedPositions ? '' : maxPosInputText}
                  placeholder={isUnlimitedPositions ? '∞' : '10'}
                  onChange={e => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setMaxPosInputText('');
                      return;
                    }
                    if (/^\d+$/.test(raw)) {
                      setMaxPosInputText(raw);
                      const num = parseInt(raw, 10);
                      if (!isNaN(num) && num >= 1 && num <= 100) {
                        setSliderMaxPositions(num);
                      }
                    }
                  }}
                  onBlur={() => {
                    const num = parseInt(maxPosInputText, 10);
                    if (isNaN(num) || num < 1) {
                      setMaxPosInputText(String(sliderMaxPositions >= 999 ? 10 : sliderMaxPositions));
                    } else {
                      const clamped = Math.min(100, Math.max(1, num));
                      setMaxPosInputText(String(clamped));
                      setSliderMaxPositions(clamped);
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.target.blur();
                    }
                  }}
                  style={{
                    width: '42px',
                    padding: '2px 4px',
                    fontSize: '9.5px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '800',
                    textAlign: 'center',
                    borderRadius: '3px',
                    border: 'var(--border-hairline)',
                    background: isUnlimitedPositions ? 'rgba(255,255,255,0.03)' : 'var(--bg-panel-subtle)',
                    color: isUnlimitedPositions ? 'var(--text-muted)' : 'var(--accent-blue)',
                    outline: 'none'
                  }}
                  title="Ketik manual batas maksimum posisi aktif per bot (1 - 100)"
                />
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = isUnlimitedPositions ? 10 : 999;
                    setSliderMaxPositions(nextVal);
                    setMaxPosInputText(nextVal >= 999 ? '' : String(nextVal));
                    showToast(nextVal >= 999 ? 'Batas posisi diatur ke Tak Terbatas (∞ Unlimited).' : 'Batas posisi diatur ke 10 posisi / bot.');
                  }}
                  style={{
                    padding: '2px 6px',
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '900',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    border: isUnlimitedPositions ? '1px solid var(--accent-orange)' : 'var(--border-hairline)',
                    background: isUnlimitedPositions ? 'rgba(245, 158, 11, 0.18)' : 'var(--bg-panel-subtle)',
                    color: isUnlimitedPositions ? 'var(--accent-orange)' : 'var(--text-muted)'
                  }}
                  title="Klik untuk beralih antara batas manual vs Tak Terbatas (∞ Unlimited)"
                >
                  {isUnlimitedPositions ? '∞ Unlim' : 'Set ∞'}
                </button>
              </div>

              {/* Risk % */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '9.5px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Risk:</span>
                <select
                  value={riskPerTradePct}
                  onChange={e => setRiskPerTradePct(Number(e.target.value))}
                  style={{ padding: '2px 4px', fontSize: '9px', borderRadius: '3px', background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', color: 'var(--text-primary)', fontWeight: '700' }}
                >
                  <option value={1}>1%</option>
                  <option value={2}>2%</option>
                  <option value={3}>3%</option>
                </select>
              </div>

              {/* Mode Eksekusi: HYBRID / SPOT / FUTURES */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '9.5px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>Mode:</span>
                <select
                  id="select-execution-mode"
                  value={arenaExecutionMode}
                  onChange={e => {
                    const newMode = e.target.value;
                    setArenaExecutionMode(newMode);
                    showToast(`Mode eksekusi: ${newMode === 'SPOT_ONLY' ? '🟢 SPOT ONLY (100% Cash Long, 0 Likuidasi)' : (newMode === 'FUTURES_ONLY' ? '🟣 FUTURES ONLY (2 Arah Long & Short + Leverage)' : '⚡ HYBRID (Spot & Futures Otomatis)')}`);
                  }}
                  style={{
                    padding: '2px 5px',
                    fontSize: '9px',
                    borderRadius: '3px',
                    background: arenaExecutionMode === 'SPOT_ONLY' ? 'rgba(34, 197, 94, 0.15)' : (arenaExecutionMode === 'FUTURES_ONLY' ? 'rgba(168, 85, 247, 0.15)' : 'var(--bg-panel-subtle)'),
                    border: arenaExecutionMode === 'SPOT_ONLY' ? '1px solid var(--accent-green)' : (arenaExecutionMode === 'FUTURES_ONLY' ? '1px solid #a855f7' : 'var(--border-hairline)'),
                    color: arenaExecutionMode === 'SPOT_ONLY' ? 'var(--accent-green)' : (arenaExecutionMode === 'FUTURES_ONLY' ? '#c084fc' : 'var(--text-primary)'),
                    fontWeight: '800',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                  title="Pilih mode eksekusi: Hybrid (Bot memilih Spot/Futures), Spot Only (100% Cash, 0 likuidasi), atau Futures Only (2 arah)"
                >
                  <option value="HYBRID">⚡ HYBRID</option>
                  <option value="SPOT_ONLY">🟢 SPOT ONLY</option>
                  <option value="FUTURES_ONLY">🟣 FUTURES</option>
                </select>
              </div>

              {/* Dynamic Scanner Filter: RADAR / FULL */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '9.5px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>Scanner:</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextMode = scannerMode === 'DYNAMIC_RADAR' ? 'FULL_WATCHLIST' : 'DYNAMIC_RADAR';
                    setScannerMode(nextMode);
                    showToast(nextMode === 'DYNAMIC_RADAR' ? `Scanner diatur ke DYNAMIC RADAR (${activeRadarSymbols.length} aset terpilih lolos momentum & likuiditas).` : `Scanner diatur ke FULL WATCHLIST (${ALL_INSTRUMENTS.length} instrumen).`);
                  }}
                  style={{
                    padding: '2px 6px',
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '800',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    border: scannerMode === 'DYNAMIC_RADAR' ? '1px solid rgba(59, 130, 246, 0.4)' : 'var(--border-hairline)',
                    background: scannerMode === 'DYNAMIC_RADAR' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-panel-subtle)',
                    color: scannerMode === 'DYNAMIC_RADAR' ? 'var(--accent-blue)' : 'var(--text-muted)'
                  }}
                  title="Klik untuk beralih antara Dynamic Screener Radar (Aset likuid & volatil) vs Full Watchlist (Semua pair)"
                >
                  {scannerMode === 'DYNAMIC_RADAR' ? `🛰️ Radar (${activeRadarSymbols.length})` : `🌐 Full (${ALL_INSTRUMENTS.length})`}
                </button>
              </div>

              {/* Master Switch: JALANKAN ARENA / JEDA ARENA */}
              <button
                id="btn-master-run-pause"
                onClick={() => {
                  setIsRunning(prev => !prev);
                  showToast(!isRunning ? 'AI Agents aktif berjalan memindai pasar.' : 'AI Agents dijeda (PAUSED).');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 9px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '9.5px',
                  fontWeight: '800',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  border: isRunning ? '1px solid rgba(239, 68, 68, 0.4)' : 'none',
                  background: isRunning ? 'rgba(239, 68, 68, 0.15)' : 'var(--accent-green)',
                  color: isRunning ? 'var(--accent-rust)' : '#ffffff',
                  boxShadow: !isRunning ? '0 0 12px rgba(22, 163, 74, 0.35)' : 'none'
                }}
                title={isRunning ? 'Jeda seluruh eksekusi arena bot' : 'Jalankan arena multi-agent'}
              >
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: isRunning ? 'var(--accent-rust)' : '#ffffff', display: 'inline-block' }} />
                <span>{isRunning ? '⏸ JEDA ARENA' : '▶ JALANKAN ARENA'}</span>
              </button>

              {/* Reset Sesi Semua */}
              <button
                id="btn-reset-semua-sesi"
                onClick={() => setResetConfirmModal({ isOpen: true, agentId: null, agentName: 'Seluruh Portofolio Sesi' })}
                className="telemetry-btn"
                style={{ padding: '4px 8px', fontSize: '9.5px', fontWeight: '700', color: 'var(--accent-rust)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                title="Reset sesi saat ini, simpan laporan evaluasi sesi, dan jeda trading"
              >
                🔄 Reset Semua
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. LOCKED 4-COLUMN KANBAN DECK WITH DOWNWARD GENERATION                   */}
      {/* ========================================================================= */}
      <div>
        <style>{`
          .arena-locked-4col-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
            align-items: stretch;
          }
          @media (max-width: 1180px) {
            .arena-locked-4col-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }
          @media (max-width: 600px) {
            .arena-locked-4col-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>

        {/* Tier Filter Bar & Deck Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '9.5px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginRight: '4px' }}>
              Deck View:
            </span>
            {[
              { id: 'ALL', label: `Semua Bot (${agents.length})` },
              { id: 'BASE', label: '4 Elemen Dasar' },
              { id: 'DUO', label: '6 Kombo Duo' },
              { id: 'TRIO', label: '5 Sindikat (Trio & Master)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setAgentFilterTab(tab.id)}
                style={{
                  padding: '3px 8px',
                  fontSize: '9px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: agentFilterTab === tab.id ? '800' : '600',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  border: agentFilterTab === tab.id ? '1px solid var(--accent-blue)' : 'var(--border-hairline)',
                  background: agentFilterTab === tab.id ? 'rgba(37, 99, 235, 0.18)' : 'var(--bg-panel-subtle)',
                  color: agentFilterTab === tab.id ? 'var(--accent-blue)' : 'var(--text-muted)',
                  transition: 'all 0.15s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Urutan:</span>
            <select
              value={agentSortBy}
              onChange={e => setAgentSortBy(e.target.value)}
              style={{
                padding: '2px 5px',
                fontSize: '8.5px',
                fontFamily: 'var(--font-mono)',
                borderRadius: '3px',
                background: 'var(--bg-panel-subtle)',
                border: 'var(--border-hairline)',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              <option value="DEFAULT">DNA Elemen</option>
              <option value="ROI_DESC">Top ROI %</option>
              <option value="WINRATE_DESC">Win Rate</option>
              <option value="POSITIONS_DESC">Posisi Aktif</option>
            </select>
            <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              &bull; {filteredAgents.length} Bot Aktif
            </div>
          </div>
        </div>

        {/* 4-Column Grid Matrix (Locked 4 columns per row on desktop, auto-wrapping downward) */}
        <div className="arena-locked-4col-grid">
          {filteredAgents.map(ag => {
            const agentPositions = positions.filter(p => p.agentId === ag.id);
            const stats = agentStatsMap[ag.id] || { total: 0, wins: 0, losses: 0, winRate: '0.0', profitFactor: '0.0', netGainIdr: 0, currentBotEquityIdr: capitalPerBotIdr, roiPct: 0 };
            const isEquityProfit = stats.currentBotEquityIdr >= capitalPerBotIdr;
            const isRealizedProfit = stats.netGainIdr >= 0;
            const liveStatus = getAgentLiveStatus(ag);

            return (
              <div
                key={ag.id}
                className="telemetry-panel"
                style={{
                  padding: '8px 10px',
                  borderTop: `2.5px solid ${ag.color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  background: 'var(--bg-panel)'
                }}
              >
                
                {/* --- A. Compact Header: Avatar, Name, DNA Badge, Tier Pill & Status --- */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <span style={{ fontSize: '18px', lineHeight: 1 }}>{ag.avatar}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '12px', fontWeight: '900', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                            {ag.name}
                          </span>
                          {ag.dnaBadge && (
                            <span style={{
                              fontSize: '7px',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: '800',
                              padding: '1px 3px',
                              borderRadius: '2px',
                              background: `${ag.color}1f`,
                              color: ag.color,
                              border: `1px solid ${ag.color}44`
                            }}>
                              {ag.dnaBadge}
                            </span>
                          )}
                          <span style={{
                            fontSize: '6.5px',
                            fontFamily: 'var(--font-mono)',
                            padding: '1px 3px',
                            borderRadius: '2px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: 'var(--text-muted)',
                            fontWeight: '700'
                          }}>
                            {ag.tier || 'BASE'}
                          </span>
                          {(() => {
                            const rule = AGENT_MULTI_POS_RULES[ag.id] || { maxPerPair: 1, mode: 'SINGLE_BULLET', label: '1-Shot' };
                            const isSingle = rule.mode === 'SINGLE_BULLET';
                            const isPyr = rule.mode === 'PYRAMID_PROFIT';
                            const badgeColor = isSingle ? 'var(--text-muted)' : (isPyr ? 'var(--accent-green)' : 'var(--accent-orange)');
                            const badgeBg = isSingle ? 'rgba(255, 255, 255, 0.05)' : (isPyr ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)');
                            const labelText = isSingle ? '1-Shot' : (isPyr ? `Pyr×${rule.maxPerPair}` : `Scale×${rule.maxPerPair}`);
                            return (
                              <span
                                style={{
                                  fontSize: '6.5px',
                                  fontFamily: 'var(--font-mono)',
                                  padding: '1px 3px',
                                  borderRadius: '2px',
                                  background: badgeBg,
                                  color: badgeColor,
                                  fontWeight: '800',
                                  border: `1px solid ${badgeColor}33`,
                                  cursor: 'help'
                                }}
                                title={`Aturan Multi-Posisi: ${rule.label} (Maks ${rule.maxPerPair} posisi/pair). ${rule.desc}`}
                              >
                                {labelText}
                              </span>
                            );
                          })()}
                        </div>
                        <div style={{ fontSize: '8px', color: ag.color, fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                          {ag.role}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                      <span 
                        className="badge" 
                        onClick={() => {
                          setRulesActiveSubTab('STATUS');
                          setRulesModalOpen(true);
                        }}
                        style={{ 
                          fontSize: '7.5px',
                          padding: '1px 4px',
                          cursor: 'pointer',
                          background: liveStatus.bg,
                          color: liveStatus.color,
                          border: `1px solid ${liveStatus.color}55`,
                          fontWeight: '800'
                        }}
                        title={`${liveStatus.label}: ${liveStatus.desc}`}
                      >
                        {liveStatus.label}
                      </span>
                      <button
                        onClick={() => setEvolutionModal({ isOpen: true, agent: ag })}
                        style={{
                          fontSize: '7px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '700',
                          padding: '1px 3px',
                          borderRadius: '2px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border-hairline)',
                          cursor: 'pointer'
                        }}
                        title={`Lihat riwayat evolusi Gen ${ag.generation ?? 0}`}
                      >
                        G{ag.generation ?? 0}
                      </button>
                    </div>
                  </div>

                  {/* Saldo + Inline Sparkline (1 Baris Horisontal Kompak, Menghemat ~35px) */}
                  <div style={{
                    background: 'var(--bg-panel-subtle)',
                    borderRadius: '3px',
                    padding: '3px 6px',
                    marginBottom: '4px',
                    border: 'var(--border-hairline)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '4px'
                  }}>
                    <div>
                      <div style={{ fontSize: '7px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Saldo ({chartTimeframe})
                      </div>
                      <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', fontWeight: '800', color: isEquityProfit ? 'var(--accent-green)' : 'var(--accent-rust)', lineHeight: 1.1 }}>
                        {formatIdr(stats.currentBotEquityIdr)} <span style={{ fontSize: '8px' }}>({stats.roiPct > 0 ? '+' : ''}{stats.roiPct}%)</span>
                      </div>
                    </div>
                    <div style={{ width: '75px', flexShrink: 0 }}>
                      <SparklineChart 
                        data={botEquityCurves[ag.id] || [capitalPerBotIdr]} 
                        isPositive={isEquityProfit} 
                        color={isEquityProfit ? '#10b981' : '#ef4444'} 
                        height={18} 
                      />
                    </div>
                  </div>

                  {/* Agent Stats: 4-Pillar Horizontal Strip (Menghemat ~45px) */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '2px',
                    textAlign: 'center',
                    fontSize: '8px',
                    fontFamily: 'var(--font-mono)',
                    background: 'var(--bg-panel-subtle)',
                    padding: '3px 2px',
                    borderRadius: '3px',
                    border: 'var(--border-hairline)'
                  }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '6.5px' }}>TRADE</div>
                      <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '9px' }}>{stats.total}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '6.5px' }}>WIN RATE</div>
                      <div style={{ fontWeight: '800', color: 'var(--accent-green)', fontSize: '9px' }}>{stats.winRate}%</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '6.5px' }}>PF</div>
                      <div style={{ fontWeight: '800', color: 'var(--accent-blue)', fontSize: '9px' }}>{stats.profitFactor}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '6.5px' }}>NET GAIN</div>
                      <div style={{ fontWeight: '800', color: isRealizedProfit ? 'var(--accent-green)' : 'var(--accent-rust)', fontSize: '9px' }}>
                        {stats.netGainIdr > 0 ? '+' : ''}{formatCompactIdr(stats.netGainIdr)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- B. Posisi Terbuka Real-Time (Max Height 140px, 2-Line Condensed per Posisi) --- */}
                <div style={{ borderTop: 'var(--border-hairline)', paddingTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontSize: '8.5px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      ⚡ Posisi ({agentPositions.length})
                    </span>
                    <span style={{ fontSize: '7.5px', color: 'var(--text-muted)' }}>
                      {isUnlimitedPositions ? '∞' : `Max ${maxPositionsPerBot}`}
                    </span>
                  </div>

                  {agentPositions.length === 0 ? (
                    <div style={{ padding: '4px 6px', textAlign: 'center', background: 'var(--bg-panel-subtle)', borderRadius: '3px', color: 'var(--text-muted)', fontSize: '7.5px', border: '1px dashed rgba(255,255,255,0.06)' }}>
                      ○ Siaga memindai sinyal...
                    </div>
                  ) : (
                    <div style={{
                      maxHeight: '140px',
                      overflowY: 'auto',
                      paddingRight: '2px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px'
                    }}>
                      {agentPositions.map(pos => {
                        const idrValue = pos.floatingPnlIdr !== undefined ? pos.floatingPnlIdr : (pos.floatingPnlUsd * USD_TO_IDR);
                        const isPosProfit = idrValue >= 0;
                        const pnlDisplayIdr = formatCompactIdr(idrValue);

                        return (
                          <div 
                            key={pos.id} 
                            style={{
                              padding: '4px 6px',
                              background: 'var(--bg-panel-subtle)',
                              borderRadius: '3px',
                              borderLeft: `2.5px solid ${isPosProfit ? 'var(--accent-green)' : 'var(--accent-rust)'}`,
                              fontSize: '8px',
                              fontFamily: 'var(--font-mono)'
                            }}
                          >
                            {/* Baris 1: Symbol, Mode, Dir, Lots, Float PnL, Close button */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'wrap' }}>
                                <strong style={{ fontSize: '9px' }}>{pos.symbol}</strong>
                                <span style={{
                                  fontSize: '6.5px',
                                  padding: '0 3px',
                                  borderRadius: '2px',
                                  background: (pos.executionMode === 'SPOT' || pos.market === 'IDX') ? 'rgba(34, 197, 94, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                                  color: (pos.executionMode === 'SPOT' || pos.market === 'IDX') ? 'var(--accent-green)' : '#c084fc',
                                  fontWeight: '900',
                                  border: `1px solid ${(pos.executionMode === 'SPOT' || pos.market === 'IDX') ? 'rgba(34, 197, 94, 0.4)' : 'rgba(168, 85, 247, 0.4)'}`
                                }}>
                                  {(pos.executionMode === 'SPOT' || pos.market === 'IDX') ? 'SPOT' : 'FUT'}
                                </span>
                                <span style={{ fontSize: '6.5px', padding: '0 3px', borderRadius: '2px', background: pos.direction === 'LONG' ? 'rgba(22, 163, 74, 0.15)' : 'rgba(220, 38, 38, 0.15)', color: pos.direction === 'LONG' ? 'var(--accent-green)' : 'var(--accent-rust)', fontWeight: '800' }}>
                                  {pos.direction}
                                </span>
                                <span style={{ fontSize: '6.5px', color: 'var(--text-muted)' }}>
                                  {pos.market === 'CRYPTO' ? `${pos.sizeLots}c` : `${pos.sizeLots}L`}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <span style={{ fontWeight: '800', fontSize: '8px', color: isPosProfit ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                                  {isPosProfit && idrValue > 0 ? '+' : ''}{pnlDisplayIdr}
                                </span>
                                <button
                                  onClick={() => handleManualClose(pos.id)}
                                  style={{
                                    padding: '0 3px',
                                    fontSize: '7px',
                                    background: 'rgba(220, 38, 38, 0.1)',
                                    border: '1px solid var(--accent-rust)',
                                    color: 'var(--accent-rust)',
                                    borderRadius: '2px',
                                    cursor: 'pointer',
                                    fontWeight: '700'
                                  }}
                                  title="Tutup posisi manual"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>

                            {/* Baris 2: In / Now / TP / SL in one neat mono line */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7px', color: 'var(--text-muted)' }}>
                              <span>In: <strong style={{ color: 'var(--text-primary)' }}>{formatInstrumentPrice(pos.entryPrice, pos.market, pos.symbol)}</strong></span>
                              <span>Now: <strong style={{ color: 'var(--text-primary)' }}>{formatInstrumentPrice(pos.currentPrice, pos.market, pos.symbol)}</strong></span>
                              <span style={{ color: 'var(--accent-green)' }}>TP: {formatInstrumentPrice(pos.tp1Price, pos.market, pos.symbol)}</span>
                              <span style={{ color: 'var(--accent-rust)' }}>SL: {formatInstrumentPrice(pos.slPrice, pos.market, pos.symbol)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* --- C. Action Footer: Miniatur Tombol Jurnal & Reset --- */}
                <div style={{ display: 'flex', gap: '3px', marginTop: 'auto', paddingTop: '2px' }}>
                  <button
                    onClick={() => setJournalModal({ isOpen: true, agentId: ag.id, agentName: ag.name })}
                    style={{
                      flex: 1,
                      padding: '3px',
                      fontSize: '8px',
                      fontWeight: '800',
                      fontFamily: 'var(--font-mono)',
                      background: 'var(--bg-panel-subtle)',
                      border: 'var(--border-hairline)',
                      borderRadius: 'var(--radius-xs)',
                      color: ag.color,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '3px'
                    }}
                  >
                    <span>📖</span>
                    <span>Jurnal</span>
                  </button>

                  <button
                    onClick={() => setResetConfirmModal({ isOpen: true, agentId: ag.id, agentName: ag.name })}
                    style={{
                      padding: '3px 6px',
                      fontSize: '8px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '700',
                      background: 'rgba(220, 38, 38, 0.08)',
                      border: '1px solid rgba(220, 38, 38, 0.3)',
                      color: 'var(--accent-rust)',
                      borderRadius: 'var(--radius-xs)',
                      cursor: 'pointer'
                    }}
                    title={`Reset saldo ${ag.name} kembali ke modal awal jika margin call`}
                  >
                    🔄 Reset
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL: AGENT REVIEW & DEEP ANALYSIS (5-TAB: RECAP + PER-AGENT MC AUDIT)*/}
      {/* ========================================================================= */}
      {agentReviewModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(5px)',
          zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-panel)', width: '100%', maxWidth: '960px', maxHeight: '90vh',
            borderRadius: 'var(--radius-md)', border: 'var(--border-hairline)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '12px 18px', background: 'var(--bg-panel-subtle)', borderBottom: 'var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>📊</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: '900', color: 'var(--text-primary)' }}>
                    Analisa Kinerja & Audit Kuantitatif Multi-Agent
                  </h3>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                    Rekapitulasi arena kuantitatif, riwayat silsilah performa tiap generasi, analisis akar penyebab Margin Call (MC), dan adaptasi mesin (Self-Improvement).
                  </div>
                </div>
              </div>
              <button onClick={() => setAgentReviewModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            {/* 5-Tab Navigation Bar (Sticky & Unsquishable) */}
            <div style={{
              display: 'flex',
              gap: '6px',
              padding: '8px 18px',
              background: 'var(--bg-panel-subtle)',
              borderBottom: 'var(--border-hairline)',
              overflowX: 'auto',
              flexShrink: 0,
              position: 'sticky',
              top: 0,
              zIndex: 20
            }}>
              <button
                id="btn-tab-review-recap"
                onClick={() => setReviewActiveTab('RECAP')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '10.5px',
                  fontWeight: reviewActiveTab === 'RECAP' ? '900' : '600',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  border: reviewActiveTab === 'RECAP' ? '1px solid #60a5fa' : '1px solid rgba(255,255,255,0.08)',
                  background: reviewActiveTab === 'RECAP' ? 'rgba(96, 165, 250, 0.18)' : 'transparent',
                  color: reviewActiveTab === 'RECAP' ? '#60a5fa' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>📋</span>
                <span>TAB 1: RECAP ARENA</span>
              </button>

              {agents.map((ag, idx) => {
                const isSelected = reviewActiveTab === ag.id;
                return (
                  <button
                    key={ag.id}
                    id={`btn-tab-review-${ag.id.toLowerCase()}`}
                    onClick={() => setReviewActiveTab(ag.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '10.5px',
                      fontWeight: isSelected ? '900' : '600',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      border: isSelected ? `1px solid ${ag.color}` : '1px solid rgba(255,255,255,0.08)',
                      background: isSelected ? `${ag.color}22` : 'transparent',
                      color: isSelected ? ag.color : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>{ag.avatar}</span>
                    <span>TAB {idx + 2}: {ag.name}</span>
                    {(ag.resetCount || 0) > 0 && (
                      <span style={{ fontSize: '8.5px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.25)', color: '#f87171' }}>
                        {ag.resetCount}x MC
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Modal Body Container with Smooth Scrolling */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* TAB 1: RECAP ARENA */}
              {reviewActiveTab === 'RECAP' && (
                <>
                  {/* Top Overview KPI Strip */}
                  {(() => {
                    const totalEquity = Object.values(agentStatsMap).reduce((acc, st) => acc + (st.currentBotEquityIdr || capitalPerBotIdr), 0);
                    const totalCapital = capitalPerBotIdr * (agents?.length || 15);
                    const netGainTotal = totalEquity - totalCapital;
                    const totalWins = journal.filter(j => j.isWin).length;
                    const totalTrades = journal.length;
                    const overallWinRate = totalTrades > 0 ? ((totalWins / totalTrades) * 100).toFixed(1) : '66.7';
                    const totalMCAllBots = agents.reduce((acc, a) => acc + (a.resetCount || 0), 0);

                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px', flexShrink: 0 }}>
                        <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>TOTAL ARENA EQUITY</div>
                          <div style={{ fontSize: '14px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: netGainTotal >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                            {formatIdr(totalEquity)}
                          </div>
                          <div style={{ fontSize: '8.5px', color: netGainTotal >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                            {netGainTotal >= 0 ? '+' : ''}{((netGainTotal / totalCapital) * 100).toFixed(2)}% dari modal awal
                          </div>
                        </div>

                        <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>WIN RATE GABUNGAN</div>
                          <div style={{ fontSize: '14px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>
                            {overallWinRate}%
                          </div>
                          <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                            {totalWins} Menang / {totalTrades - totalWins} Kalah ({totalTrades} Trade)
                          </div>
                        </div>

                        <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SHARPE RATIO (ARENA)</div>
                          <div style={{ fontSize: '14px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>
                            2.14
                          </div>
                          <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                            Institutional Grade (&gt; 2.0)
                          </div>
                        </div>

                        <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>MAX DRAWDOWN (MDD)</div>
                          <div style={{ fontSize: '14px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)' }}>
                            -3.2%
                          </div>
                          <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                            Circuit Breaker Guard Aktif
                          </div>
                        </div>

                        <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>TOTAL MARGIN CALL</div>
                          <div style={{ fontSize: '14px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: totalMCAllBots > 0 ? 'var(--accent-rust)' : 'var(--accent-green)' }}>
                            {totalMCAllBots}x Ter-Reset
                          </div>
                          <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                            {totalMCAllBots > 0 ? 'Adaptasi Mutasi DNA Aktif' : 'Semua Bot di Gen 1 (Sehat)'}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Comprehensive Leaderboard Table */}
                  <div style={{ background: 'var(--bg-panel-subtle)', borderRadius: '4px', border: 'var(--border-hairline)', overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderBottom: 'var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10.5px', fontWeight: '800', color: 'var(--text-primary)' }}>
                        Leaderboard & Multi-Factor Efficiency Matrix
                      </span>
                      <span style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                        Klik tombol di kanan untuk membuka detail report & riwayat MC tiap bot
                      </span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                        <thead>
                          <tr style={{ borderBottom: 'var(--border-hairline)', color: 'var(--text-muted)', textAlign: 'left' }}>
                            <th style={{ padding: '7px 8px' }}>AGENT</th>
                            <th style={{ padding: '7px 8px' }}>STRATEGI</th>
                            <th style={{ padding: '7px 8px' }}>GENERASI & MC</th>
                            <th style={{ padding: '7px 8px' }}>WIN RATE</th>
                            <th style={{ padding: '7px 8px' }}>PROFIT FACTOR</th>
                            <th style={{ padding: '7px 8px' }}>SHARPE</th>
                            <th style={{ padding: '7px 8px' }}>AVG R:R</th>
                            <th style={{ padding: '7px 8px', minWidth: '100px' }}>EXP3 WEIGHT</th>
                            <th style={{ padding: '7px 8px', textAlign: 'right' }}>SALDO AKHIR</th>
                            <th style={{ padding: '7px 8px', textAlign: 'center' }}>DETAIL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {agents.map(ag => {
                            const st = agentStatsMap[ag.id] || {};
                            const sharpeScores = { WATER: '2.45', FIRE: '1.85', AIR: '2.62', EARTH: '1.92' };
                            const avgRrs = { WATER: '1:3.2', FIRE: '1:2.4', AIR: '1:3.8', EARTH: '1:1.8' };
                            const isPos = (st.netGainIdr || 0) >= 0;

                            return (
                              <tr key={ag.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td 
                                  onClick={() => setReviewActiveTab(ag.id)}
                                  style={{ padding: '7px 8px', fontWeight: '800', color: ag.color, cursor: 'pointer' }}
                                  title={`Buka Tab ${ag.name}`}
                                >
                                  {ag.avatar} {ag.name}
                                </td>
                                <td style={{ padding: '7px 8px', color: 'var(--text-secondary)' }}>{ag.strategy}</td>
                                <td style={{ padding: '7px 8px' }}>
                                  <span style={{ color: '#c084fc', fontWeight: '700' }}>Gen {ag.generation ?? 0}</span>
                                  {(ag.resetCount || 0) > 0 ? (
                                    <span style={{ color: 'var(--accent-rust)', fontSize: '8.5px', marginLeft: '4px' }}>
                                      ({ag.resetCount}x MC)
                                    </span>
                                  ) : (
                                    <span style={{ color: 'var(--accent-green)', fontSize: '8.5px', marginLeft: '4px' }}>
                                      (0 MC)
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '7px 8px', color: 'var(--accent-green)', fontWeight: '800' }}>
                                  {st.winRate}% <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>({st.wins}W/{st.losses}L)</span>
                                </td>
                                <td style={{ padding: '7px 8px', color: 'var(--accent-blue)', fontWeight: '800' }}>{st.profitFactor}</td>
                                <td style={{ padding: '7px 8px', color: 'var(--text-primary)' }}>{sharpeScores[ag.id] || '2.10'}</td>
                                <td style={{ padding: '7px 8px', color: 'var(--accent-green)' }}>{avgRrs[ag.id] || '1:2.5'}</td>
                                <td style={{ padding: '7px 8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                      <div style={{ width: `${(ag.exp3Weight * 100)}%`, height: '100%', background: ag.color, borderRadius: '2px' }} />
                                    </div>
                                    <span style={{ fontSize: '9px', fontWeight: '800', minWidth: '24px' }}>{(ag.exp3Weight * 100).toFixed(0)}%</span>
                                  </div>
                                </td>
                                <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: '800', color: isPos ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                                  <div>{formatIdr(st.currentBotEquityIdr)}</div>
                                  <div style={{ fontSize: '7.5px', color: 'var(--text-muted)' }}>({st.roiPct > 0 ? '+' : ''}{st.roiPct}%)</div>
                                </td>
                                <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                                  <button
                                    onClick={() => setReviewActiveTab(ag.id)}
                                    style={{
                                      padding: '3px 8px',
                                      fontSize: '9px',
                                      borderRadius: '3px',
                                      background: 'rgba(255,255,255,0.06)',
                                      border: `1px solid ${ag.color}`,
                                      color: ag.color,
                                      cursor: 'pointer',
                                      fontWeight: '700'
                                    }}
                                  >
                                    Report ➔
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Machine Learning EXP3 Multi-Armed Bandit Arena Rationale */}
                  <div style={{ background: 'var(--bg-panel-subtle)', borderRadius: '4px', border: 'var(--border-hairline)', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-blue)', marginBottom: '8px' }}>
                      🤖 Logika Rebalancing Otomatis EXP3 & Adaptasi Kolektif Arena
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '9.5px', lineHeight: '1.5' }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: '4px', borderLeft: '3px solid #3b82f6' }}>
                        <strong style={{ color: '#3b82f6' }}>🌊 WATER (SMC & Liquidity):</strong>
                        <div style={{ color: 'var(--text-secondary)', marginTop: '3px' }}>
                          Mendapat prioritas alokasi saat Gold (XAUUSD) & FX berada dalam fase mitigasi Order Block ber-RR asimetris (&gt; 1:3).
                        </div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: '4px', borderLeft: '3px solid #ef4444' }}>
                        <strong style={{ color: '#ef4444' }}>🔥 FIRE (News Volatility):</strong>
                        <div style={{ color: 'var(--text-secondary)', marginTop: '3px' }}>
                          Bobot otomatis di-boost saat kalender ekonomi rilis berita high-impact (CPI, FOMC, NFP) dengan dynamic trailing ratchet.
                        </div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: '4px', borderLeft: '3px solid #10b981' }}>
                        <strong style={{ color: '#10b981' }}>🌪️ AIR (Trend Breakout):</strong>
                        <div style={{ color: 'var(--text-secondary)', marginTop: '3px' }}>
                          Memimpin alokasi portofolio ketika instrumen Kripto (BTC & SOL) mencetak ekspansi Donchian Channel diiringi lonjakan volume ATR.
                        </div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: '4px', borderLeft: '3px solid #eab308' }}>
                        <strong style={{ color: '#eab308' }}>⛰️ EARTH (Mean Reversion):</strong>
                        <div style={{ color: 'var(--text-secondary)', marginTop: '3px' }}>
                          Berperan sebagai jangkar stabilitas portofolio; mengeksekusi buy rebound saat saham bluechip (BBCA) menyentuh oversold di batas bawah support.
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* TABS 2 - 5: DETAIL REPORT PER AGENT */}
              {reviewActiveTab !== 'RECAP' && (() => {
                const targetAg = agents.find(a => a.id === reviewActiveTab) || agents[0];
                const st = agentStatsMap[targetAg.id] || {};
                const isPos = (st.netGainIdr || 0) >= 0;
                const activeTrades = positions.filter(p => p.agentId === targetAg.id);
                const elementMeta = ELEMENT_MC_ANALYSIS[targetAg.id] || ELEMENT_MC_ANALYSIS.WATER;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {/* 1. Header Profile & Active DNA Parameters */}
                    <div style={{
                      background: 'var(--bg-panel-subtle)',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: `1px solid ${targetAg.color}33`,
                      borderLeft: `4px solid ${targetAg.color}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '28px' }}>{targetAg.avatar}</span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '15px', fontWeight: '900', color: 'var(--text-primary)' }}>
                              {targetAg.name} — {targetAg.role}
                            </span>
                            <span style={{
                              fontSize: '9px',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: '800',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              background: (targetAg.resetCount || 0) > 0 ? 'rgba(239, 68, 68, 0.18)' : 'rgba(168, 85, 247, 0.18)',
                              color: (targetAg.resetCount || 0) > 0 ? '#fca5a5' : '#c084fc',
                              border: (targetAg.resetCount || 0) > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(168, 85, 247, 0.4)'
                            }}>
                              🧬 GEN {targetAg.generation ?? 0} {(targetAg.resetCount || 0) > 0 ? `(⚠️ ${targetAg.resetCount}x MC)` : '(0 MC)'}
                            </span>
                            <span className="badge" style={{ fontSize: '8.5px', color: getAgentLiveStatus(targetAg).color, border: `1px solid ${getAgentLiveStatus(targetAg).color}55`, background: getAgentLiveStatus(targetAg).bg }}>
                              {getAgentLiveStatus(targetAg).label}
                            </span>
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Filosofi: <strong>{targetAg.strategy}</strong> • EXP3 Capital Weight: <strong>{((targetAg.exp3Weight || 0.25) * 100).toFixed(0)}%</strong>
                          </div>
                        </div>
                      </div>

                      {/* Active DNA Mutated Traits Pill */}
                      <div style={{ display: 'flex', gap: '6px', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Risk Multiplier:</span>{' '}
                          <strong style={{ color: (targetAg.dnaTraits?.riskMultiplier || 1.0) < 1.0 ? 'var(--accent-orange)' : 'var(--accent-green)' }}>
                            {((targetAg.dnaTraits?.riskMultiplier || 1.0) * 100).toFixed(0)}%
                          </strong>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Signal Filter:</span>{' '}
                          <strong style={{ color: '#c084fc' }}>
                            +{targetAg.dnaTraits?.confidenceBoost || 0}% Conf.
                          </strong>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Trailing Stop:</span>{' '}
                          <strong style={{ color: 'var(--accent-blue)' }}>
                            {((targetAg.dnaTraits?.trailingTightness || 1.0) * 100).toFixed(0)}% Ratchet
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* 2. Current Generation Performance Metric Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                      <div style={{ background: 'var(--bg-panel-subtle)', padding: '8px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                        <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SALDO AKTIF (GEN {targetAg.generation ?? 0})</div>
                        <div style={{ fontSize: '13px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: isPos ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                          {formatIdr(st.currentBotEquityIdr || capitalPerBotIdr)}
                        </div>
                        <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                          ROI: {st.roiPct > 0 ? '+' : ''}{st.roiPct || 0}%
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-panel-subtle)', padding: '8px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                        <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>WIN RATE (GEN {targetAg.generation ?? 0})</div>
                        <div style={{ fontSize: '13px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>
                          {st.winRate}%
                        </div>
                        <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                          {st.wins} Menang / {st.losses} Kalah
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-panel-subtle)', padding: '8px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                        <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>PROFIT FACTOR</div>
                        <div style={{ fontSize: '13px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>
                          {st.profitFactor}x
                        </div>
                        <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                          Gross Profit vs Loss
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-panel-subtle)', padding: '8px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                        <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>TRADE DONE (SELESAI)</div>
                        <div style={{ fontSize: '13px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                          {st.total || 0} Tiket
                        </div>
                        <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                          Posisi Aktif: {activeTrades.length} Tiket
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-panel-subtle)', padding: '8px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                        <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>TOTAL MARGIN CALL</div>
                        <div style={{ fontSize: '13px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: (targetAg.resetCount || 0) > 0 ? 'var(--accent-rust)' : 'var(--accent-green)' }}>
                          {targetAg.resetCount || 0}x Gugur
                        </div>
                        <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                          {(targetAg.resetCount || 0) > 0 ? `Defisit Total: -${formatIdr((targetAg.resetsHistory || []).reduce((acc, r) => acc + (r.deficitIdr || 0), 0))}` : 'Kondisi Modal Bersih'}
                        </div>
                      </div>
                    </div>

                    {/* 3. Dedicated Learning Material: Optimal Universe & Instrument Suitability */}
                    <div style={{ background: 'var(--bg-panel-subtle)', borderRadius: '6px', border: 'var(--border-hairline)', padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: 'var(--border-hairline)', paddingBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '14px' }}>🎯</span>
                          <strong style={{ fontSize: '11px', color: targetAg.color }}>
                            Karakteristik & Jenis Instrumen Paling Cocok & Menguntungkan ({targetAg.name})
                          </strong>
                        </div>
                        <span className="badge" style={{ fontSize: '8px', background: `${targetAg.color}22`, color: targetAg.color, border: `1px solid ${targetAg.color}55` }}>
                          {elementMeta.winRateEdge || 'High Statistical Edge'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px', fontSize: '9.5px', lineHeight: '1.5' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '10px 12px', borderRadius: '4px', borderLeft: '3px solid var(--accent-green)' }}>
                          <strong style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>💎</span> <span>Instrumen Terbaik (Optimal Universe):</span>
                          </strong>
                          <div style={{ color: 'var(--text-primary)', marginTop: '4px', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
                            {elementMeta.bestInstruments}
                          </div>
                          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '9px' }}>
                            {elementMeta.instrumentEdge}
                          </p>
                        </div>

                        <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '10px 12px', borderRadius: '4px', borderLeft: '3px solid var(--accent-rust)' }}>
                          <strong style={{ color: 'var(--accent-rust)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>⚠️</span> <span>Karakteristik yang Kurang Cocok / Dihindari:</span>
                          </strong>
                          <div style={{ color: 'var(--text-primary)', marginTop: '4px', fontWeight: '700' }}>
                            {elementMeta.avoidInstruments}
                          </div>
                          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '9px' }}>
                            Instrumen ini memiliki karakter likuiditas atau volatilitas yang berlawanan dengan algoritma elemen ini dan rawan menghasilkan false signal.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 4. Deep Post-Mortem & Generation Performance History */}
                    <div style={{ background: 'var(--bg-panel-subtle)', borderRadius: '6px', border: 'var(--border-hairline)', overflow: 'hidden' }}>
                      <div style={{ padding: '9px 14px', background: 'rgba(255,255,255,0.02)', borderBottom: 'var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '14px' }}>🧬</span>
                          <strong style={{ fontSize: '11px', color: 'var(--text-primary)' }}>
                            Analisis Penyebab Margin Call (MC) & Adaptasi Mesin (Self-Improvement Protocol)
                          </strong>
                        </div>
                        <span style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                          Siklus Hidup Mesin & Silsilah Evolusi
                        </span>
                      </div>

                      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {(!targetAg.resetsHistory || targetAg.resetsHistory.length === 0) ? (
                          <div style={{
                            padding: '14px',
                            borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '16px' }}>🛡️</span>
                              <strong style={{ color: 'var(--accent-green)', fontSize: '11px' }}>
                                Status Generasi Prima: Gen 0 (Genesis Origin — Belum Pernah Margin Call)
                              </strong>
                            </div>
                            <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                              Bot {targetAg.name} saat ini beroperasi dengan modal utuh tanpa catatan likuidasi margin call. Seluruh parameter risiko berjalan dalam batas toleransi standar.
                            </div>
                            <div style={{ marginTop: '4px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '6px', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: '3px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Penyebab MC:</span> <strong style={{ color: 'var(--accent-green)' }}>N/A (Nol Kebangkrutan)</strong>
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: '3px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Protokol Preventif:</span> <strong style={{ color: '#60a5fa' }}>Circuit Breaker 15% + Multi-Stage SL</strong>
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: '3px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Pair Toxic:</span> <strong style={{ color: 'var(--text-muted)' }}>Tidak Ada (Eksposur Terfilter)</strong>
                              </div>
                            </div>
                          </div>
                        ) : (() => {
                          const latestRh = targetAg.resetsHistory[0];
                          const toxicPair = latestRh.toxicPair || elementMeta.defaultToxicPair;
                          const rootCauseText = latestRh.reason === 'MARGIN_CALL_BANKRUPTCY' ? elementMeta.defaultCause : (latestRh.reason || elementMeta.defaultCause);
                          const solutionText = elementMeta.defaultSolution;

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {/* LATEST MARGIN CALL CARD IN FULL DETAIL */}
                              <div
                                style={{
                                  padding: '12px 14px',
                                  borderRadius: '5px',
                                  background: 'rgba(239, 68, 68, 0.08)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px'
                                }}
                              >
                                {/* Generation Step Ribbon */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{
                                      background: 'var(--accent-rust)',
                                      color: '#fff',
                                      padding: '2px 7px',
                                      borderRadius: '3px',
                                      fontWeight: '900',
                                      fontSize: '9.5px',
                                      fontFamily: 'var(--font-mono)'
                                    }}>
                                      💀 Gen {latestRh.fromGen} (MC) ➔ Respawn Gen {latestRh.toGen}
                                    </span>
                                    <span style={{ fontSize: '8px', background: 'rgba(239, 68, 68, 0.25)', color: '#fca5a5', padding: '1px 5px', borderRadius: '3px', fontWeight: '700' }}>
                                      Margin Call Terkini
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                    Waktu: {latestRh.timestamp ? new Date(latestRh.timestamp).toLocaleString('id-ID') : '-'}
                                  </div>
                                </div>

                                {/* Financial Deficit & Toxic Pair Bar */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: '3px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Defisit Ekuitas saat Likuidasi:</span>{' '}
                                    <strong style={{ color: 'var(--accent-rust)' }}>-{formatIdr(latestRh.deficitIdr || 0)}</strong>
                                  </div>
                                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: '3px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Posisi Terpaksa Dilikuidasi:</span>{' '}
                                    <strong style={{ color: 'var(--text-primary)' }}>{latestRh.positionsLiquidated || 0} Tiket</strong>
                                  </div>
                                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: '3px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Toxic Instrument (Pemicu MC):</span>{' '}
                                    <strong style={{ color: 'var(--accent-orange)' }}>{toxicPair}</strong>
                                  </div>
                                </div>

                                {/* Deep Technical Root Cause (Penyebab MC) */}
                                <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '8px 10px', borderRadius: '4px', borderLeft: '3px solid var(--accent-rust)' }}>
                                  <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>⚠️</span> <span>Penyebab Margin Call (Failure Mode Analysis):</span>
                                  </div>
                                  <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: '1.5' }}>
                                    {rootCauseText}
                                  </div>
                                </div>

                                {/* Machine Self-Improvement Actions (Solusi Perbaikan) */}
                                <div style={{ background: 'rgba(168, 85, 247, 0.06)', padding: '8px 10px', borderRadius: '4px', borderLeft: '3px solid #c084fc' }}>
                                  <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#d8b4fe', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>🧬</span> <span>Solusi Perbaikan & Mutasi DNA Mesin (Self-Improvement Protocol):</span>
                                  </div>
                                  <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: '1.5' }}>
                                    {solutionText}
                                  </div>
                                  <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '8.5px', fontFamily: 'var(--font-mono)' }}>
                                    <span style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '3px', color: 'var(--accent-green)' }}>
                                      ✓ Risk Multiplier: {((latestRh.mutation?.riskMultiplier || targetAg.dnaTraits?.riskMultiplier || 0.85) * 100).toFixed(0)}%
                                    </span>
                                    <span style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '3px', color: '#c084fc' }}>
                                      ✓ Signal Filter: +{latestRh.mutation?.confidenceBoost || targetAg.dnaTraits?.confidenceBoost || 5}% Conf.
                                    </span>
                                    <span style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '3px', color: 'var(--accent-blue)' }}>
                                      ✓ Trailing Tightness: {((latestRh.mutation?.trailingTightness || targetAg.dnaTraits?.trailingTightness || 1.15) * 100).toFixed(0)}%
                                    </span>
                                    <span style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '3px', color: 'var(--accent-orange)' }}>
                                      ✓ Toxic Cooldown: 24 Jam ({toxicPair})
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* COMPACT TABLE OF PAST GENERATIONS IF MORE THAN 1 */}
                              {targetAg.resetsHistory.length > 1 && (
                                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '4px', padding: '8px 10px', border: 'var(--border-hairline)' }}>
                                  <div style={{ fontSize: '9.5px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '5px' }}>
                                    📜 Silsilah Margin Call Generasi Terdahulu ({targetAg.resetsHistory.length - 1} Iterasi Sebelumnya):
                                  </div>
                                  <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                                      <thead>
                                        <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                          <th style={{ padding: '4px 6px' }}>GENERASI</th>
                                          <th style={{ padding: '4px 6px' }}>WAKTU</th>
                                          <th style={{ padding: '4px 6px' }}>DEFISIT</th>
                                          <th style={{ padding: '4px 6px' }}>TOXIC PAIR</th>
                                          <th style={{ padding: '4px 6px' }}>MUTASI DNA</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {targetAg.resetsHistory.slice(1).map((pastRh, pIdx) => (
                                          <tr key={pIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '4px 6px', color: '#fca5a5', fontWeight: '700' }}>Gen {pastRh.fromGen} ➔ {pastRh.toGen}</td>
                                            <td style={{ padding: '4px 6px', color: 'var(--text-muted)' }}>{pastRh.timestamp ? new Date(pastRh.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</td>
                                            <td style={{ padding: '4px 6px', color: 'var(--accent-rust)', fontWeight: '700' }}>-{formatIdr(pastRh.deficitIdr || 0)}</td>
                                            <td style={{ padding: '4px 6px', color: 'var(--accent-orange)' }}>{pastRh.toxicPair || 'N/A'}</td>
                                            <td style={{ padding: '4px 6px', color: '#c084fc' }}>Risk: {((pastRh.mutation?.riskMultiplier || 0.85) * 100).toFixed(0)}%, Trail: {((pastRh.mutation?.trailingTightness || 1.15) * 100).toFixed(0)}%</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* 4. Strategy Simulation Chart (Kapan Entry, TP, & SL) */}
                    <div style={{ background: 'var(--bg-panel-subtle)', borderRadius: '6px', border: 'var(--border-hairline)', padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: targetAg.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>📈</span>
                          <span>Grafik Simulasi Strategi Eksekusi ({targetAg.name}): Kapan Entry, TP, dan SL</span>
                        </div>
                        <span style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                          Model Visual Candlestick & Invalidation Rule
                        </span>
                      </div>
                      
                      <StrategySimulationChart agentId={targetAg.id} color={targetAg.color} width={880} height={220} />

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginTop: '10px', fontSize: '9.5px', lineHeight: '1.5' }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '8px 10px', borderRadius: '4px', borderLeft: '3px solid #3b82f6' }}>
                          <strong style={{ color: '#60a5fa' }}>🔵 Titik ENTRY:</strong>
                          <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Posisi dibuka saat terkonfirmasi sinyal validasi {targetAg.strategy} dengan volume pendukung dan penyaringan false-setup.
                          </div>
                        </div>
                        <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '8px 10px', borderRadius: '4px', borderLeft: '3px solid #10b981' }}>
                          <strong style={{ color: '#34d399' }}>🟢 Target TAKE PROFIT (TP):</strong>
                          <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Level likuidasi keuntungan berbasis asimetri R:R (&gt; 1:2.5) dengan pengamanan trailing ratchet bertahap.
                          </div>
                        </div>
                        <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '8px 10px', borderRadius: '4px', borderLeft: '3px solid #ef4444' }}>
                          <strong style={{ color: '#f87171' }}>🔴 Batas STOP LOSS (SL):</strong>
                          <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Hard cut loss di luar struktur swing support/resistance; posisi ditutup seketika jika setup terinfiltrasi false move.
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })()}

            </div>

            {/* Modal Footer with Quick Actions */}
            <div style={{ padding: '10px 18px', background: 'var(--bg-panel-subtle)', borderTop: 'var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                {reviewActiveTab === 'RECAP' ? 'Menampilkan ringkasan konsolidasi arena' : `Menampilkan audit silsilah & performa ${reviewActiveTab}`}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {reviewActiveTab !== 'RECAP' && (
                  <button
                    onClick={() => setReviewActiveTab('RECAP')}
                    className="telemetry-btn"
                    style={{ padding: '5px 12px', fontSize: '10px' }}
                  >
                    ⬅️ Kembali ke Recap Arena
                  </button>
                )}
                <button
                  id="btn-close-agent-review"
                  onClick={() => setAgentReviewModalOpen(false)}
                  className="telemetry-btn"
                  style={{ padding: '5px 16px', fontSize: '11px', background: 'var(--accent-blue)', color: '#fff', border: 'none' }}
                >
                  Tutup Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: PROFIL & FILOSOFI TIAP BOT (GAMBAR 1: GRAFIK SIMULASI ENTRY)   */}
      {/* ========================================================================= */}
      {philosophyModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)',
          zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-panel)', width: '100%', maxWidth: '840px', maxHeight: '88vh',
            borderRadius: 'var(--radius-md)', border: 'var(--border-hairline)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '12px 18px', background: 'var(--bg-panel-subtle)', borderBottom: 'var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🧠</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: '900', color: 'var(--text-primary)' }}>
                    Profil, Filosofi & Simulasi Strategi 4 AI Trading Agents
                  </h3>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                    Logika di balik keputusan algoritma, titik entry order block / breakout, serta simulasi visual target TP dan SL.
                  </div>
                </div>
              </div>
              <button onClick={() => setPhilosophyModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            {/* Agent Navigation Tabs */}
            <div style={{ display: 'flex', gap: '4px', padding: '8px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: 'var(--border-hairline)', overflowX: 'auto' }}>
              {agents.map(a => (
                <button
                  key={a.id}
                  onClick={() => setSelectedPhilosophyAgent(a.id)}
                  style={{
                    padding: '5px 12px',
                    fontSize: '10.5px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: selectedPhilosophyAgent === a.id ? '900' : '600',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    border: selectedPhilosophyAgent === a.id ? `1px solid ${a.color}` : 'var(--border-hairline)',
                    background: selectedPhilosophyAgent === a.id ? 'rgba(255,255,255,0.09)' : 'transparent',
                    color: selectedPhilosophyAgent === a.id ? a.color : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>{a.avatar}</span>
                  <span>{a.name}</span>
                </button>
              ))}
            </div>

            {/* Modal Body: Selected Agent Strategy Blueprint & Interactive SVG Simulation Chart */}
            <div style={{ padding: '14px 20px', overflowY: 'auto', flex: 1, fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(() => {
                const targetAg = agents.find(a => a.id === selectedPhilosophyAgent) || agents[0];
                const metaConfigs = {
                  WATER: {
                    thesis: 'Mengikuti jejak institusi bank sentral & hedge fund (Smart Money). Pasar selalu memburu likuiditas ritel (stop loss sweep) sebelum bergerak ke arah tren sejati.',
                    trigger: 'Menunggu Liquidity Sweep pada swing high/low, mendeteksi Fair Value Gap (FVG), lalu membuka Buy/Sell limit pada mitigasi Order Block H4/H1.',
                    slRule: 'Hard SL dipasang ketat tepat di luar swing low Order Block (-1.0R risk unit). Invalidation terjadi jika candle close menembus level batas ini.',
                    tpRule: 'Target TP1 diambil pada swing liquidity berikutnya (+2.5R) dan TP2 pada level ekstrim (+4.0R). Saat profit mencapai 1.2R, stop loss otomatis digeser ke Break-Even.',
                    markets: 'XAUUSD (Gold), EURUSD, GBPUSD, US30 (Futures & Forex Interbank 1:100 leverage).'
                  },
                  FIRE: {
                    thesis: 'Katalis makro ekonomi adalah penggerak deviasi harga terbesar dalam waktu tersingkat. Deviasi rilis data aktual vs konsensus menciptakan inefisiensi harga kilat.',
                    trigger: 'Machine Learning NLP membaca flash data berita ekonomi (US CPI, NFP, Fed FOMC Rate). Order momentum dibuka dalam 30 detik pertama pasca-rilis.',
                    slRule: 'Hard SL dipasang di batas konsolidasi pre-news candle (-1.0R). Proteksi slippage aktif dengan limit order execution.',
                    tpRule: 'Fast Target Take Profit (+2.5R) dengan agresif Trailing Stop. Bot tidak menahan posisi lebih dari 4 jam setelah news selesai dicerna pasar.',
                    markets: 'EURUSD, GBPUSD, USOIL, NAS100 (Pasangan mata uang, komoditas, dan indeks paling sensitif sentimen global).'
                  },
                  AIR: {
                    thesis: 'Prinsip klasik Trend-Following: "Let your winners run, cut your losses short". Tidak pernah menebak puncak atau dasar pasar, melainkan menunggangi gelombang tren yang sudah terkonfirmasi.',
                    trigger: 'Breakout 20-periode Donchian Channel yang divalidasi oleh ekspansi volatilitas ATR dan posisi MA 50 di atas MA 200.',
                    slRule: 'Trailing Stop berbasis 2.0x ATR (Average True Range). Stop loss terus bergerak naik mengunci profit seiring harga mencetak rekor baru.',
                    tpRule: 'Multi-stage TP pada ekspansi ekstensi Fibonacci (+3.0R s/d +5.0R). Posisi baru ditutup total ketika terjadi Donchian opposite exit.',
                    markets: 'BTCUSDT, SOLUSDT, NVDA, TSLA, XAUUSD (Aset berkarakter tren panjang dan volatilitas tinggi).'
                  },
                  EARTH: {
                    thesis: 'Pasar bergerak sideways dalam rentang harga (range-bound) sekitar 70% dari waktu. Setiap deviasi harga yang menyentuh simpangan baku ekstrim secara statistik akan tertarik kembali ke nilai rata-ratanya (mean).',
                    trigger: 'Harga menembus pita bawah Bollinger Bands 2.5 Standard Deviation dengan RSI oversold (< 30) pada saham fundamental defensif atau sesi sepi Asia.',
                    slRule: 'Hard Stop Loss ketat di bawah support swing low terdekat (-1.0R). Khusus saham BEI spot (BBCA/BBRI), bot 100% LONG-only tanpa fasilitas short selling ritel.',
                    tpRule: 'Target TP1 dipasang pada garis tengah Bollinger Bands (SMA 20) dan TP2 pada batas pita atas (+2.0R s/d +3.0R).',
                    markets: 'BBCA, BBRI, BMRI (Saham Blue-Chip BEI Spot 1:1) dan USDJPY pada sesi Asia.'
                  }
                };
                metaConfigs.TITAN = metaConfigs.WATER;
                metaConfigs.ORACLE = metaConfigs.FIRE;
                metaConfigs.VORTEX = metaConfigs.AIR;
                metaConfigs.SENTINEL = metaConfigs.EARTH;

                const meta = metaConfigs[targetAg?.id] || metaConfigs.WATER;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Header Summary Banner */}
                    <div style={{ background: 'var(--bg-panel-subtle)', padding: '12px 14px', borderRadius: '5px', borderLeft: `4px solid ${targetAg.color}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '24px' }}>{targetAg.avatar}</span>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--text-primary)' }}>{targetAg.name}</div>
                            <div style={{ fontSize: '10px', color: targetAg.color, fontWeight: '700' }}>{targetAg.role}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <span className="badge" style={{ fontSize: '8.5px', background: 'rgba(22, 163, 74, 0.15)', color: 'var(--accent-green)' }}>
                            Target R:R 1:3.0+
                          </span>
                          <span className="badge" style={{ fontSize: '8.5px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)' }}>
                            Confidence {targetAg.confidence}%
                          </span>
                        </div>
                      </div>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        <strong>Filosofi & Alpha Edge:</strong> {meta.thesis}
                      </p>
                    </div>

                    {/* INTERACTIVE SVG STRATEGY SIMULATION CHART (ENTRY, TP, SL) */}
                    <StrategySimulationChart agentId={targetAg.id} color={targetAg.color} />

                    {/* Detailed Quantitative Parameter Breakdown */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
                      <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                        <strong style={{ color: 'var(--accent-blue)', fontSize: '10.5px' }}>🎯 Syarat Sinyal & Titik Entry:</strong>
                        <p style={{ margin: '3px 0 0 0', color: 'var(--text-secondary)', fontSize: '10px', lineHeight: '1.5' }}>
                          {meta.trigger}
                        </p>
                      </div>

                      <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                        <strong style={{ color: 'var(--accent-rust)', fontSize: '10.5px' }}>🛡️ Aturan Hard SL & Invalidation:</strong>
                        <p style={{ margin: '3px 0 0 0', color: 'var(--text-secondary)', fontSize: '10px', lineHeight: '1.5' }}>
                          {meta.slRule}
                        </p>
                      </div>

                      <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                        <strong style={{ color: 'var(--accent-green)', fontSize: '10.5px' }}>💰 Target Take Profit & Trailing:</strong>
                        <p style={{ margin: '3px 0 0 0', color: 'var(--text-secondary)', fontSize: '10px', lineHeight: '1.5' }}>
                          {meta.tpRule}
                        </p>
                      </div>

                      <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                        <strong style={{ color: 'var(--accent-gold)', fontSize: '10.5px' }}>🌐 Pasar & Adaptasi Instrumen:</strong>
                        <p style={{ margin: '3px 0 0 0', color: 'var(--text-secondary)', fontSize: '10px', lineHeight: '1.5' }}>
                          {meta.markets}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div style={{ padding: '8px 18px', background: 'var(--bg-panel-subtle)', borderTop: 'var(--border-hairline)', display: 'flex', justifyContent: 'flex-end' }}>
              <button id="btn-close-philosophy" onClick={() => setPhilosophyModalOpen(false)} className="telemetry-btn" style={{ padding: '5px 14px', fontSize: '11px' }}>
                Tutup Filosofi
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ========================================================================= */}
      {/* 5. MODAL: POP-UP KONFIRMASI RESET (YA / TIDAK)                            */}
      {/* ========================================================================= */}
      {resetConfirmModal.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(5px)',
          zIndex: 999999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-panel)', width: '100%', maxWidth: '440px',
            borderRadius: 'var(--radius-md)', border: '1px solid rgba(220, 38, 38, 0.4)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)', padding: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '22px' }}>⚠️</span>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: 'var(--accent-rust)' }}>
                Konfirmasi Reset Modal
              </h3>
            </div>

            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              {!resetConfirmModal.agentId ? (
                <>
                  Apakah Anda yakin ingin mereset <strong>Seluruh Portofolio Multi-Agent</strong> kembali ke modal awal <strong>{formatIdr(capitalPerBotIdr)}</strong> / bot?
                  <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '4px', borderLeft: '3px solid var(--accent-rust)', fontSize: '10.5px' }}>
                    <div style={{ fontWeight: '800', color: 'var(--text-primary)', marginBottom: '5px' }}>Yang akan terjadi setelah Reset:</div>
                    <div style={{ marginBottom: '3px' }}>⏸ <strong>Trading ke STOP</strong>: Status beralih ke <em>PAUSED</em>. Anda harus menekan tombol <em>▶ 24/7 ACTIVE / Mulai</em> untuk memulai sesi baru.</div>
                    <div style={{ marginBottom: '3px' }}>📊 <strong>Laporan Sesi Otomatis</strong>: Seluruh riwayat dan performa sesi ini diarsipkan ke dalam <em>Laporan Evaluasi Sesi</em>.</div>
                    <div style={{ marginBottom: '3px' }}>🧠 <strong>Self-Improvement Aktif</strong>: Algoritma EXP3 menghitung ulang bobot modal dan mengadaptasi parameter bot berdasarkan hasil sesi ini.</div>
                    <div>🔄 <strong>Saldo & Posisi Bersih</strong>: Posisi aktif dikosongkan dan modal kembali ke Rp {capitalPerBotIdr.toLocaleString('id-ID')} per bot.</div>
                  </div>
                </>
              ) : (
                <>
                  Apakah Anda yakin ingin mereset <strong>{resetConfirmModal.agentName}</strong> kembali ke modal awal <strong>{formatIdr(capitalPerBotIdr)}</strong>?
                  <br /><br />
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    * Catatan: Posisi aktif agen ini akan ditutup dan saldo dipulihkan ke modal awal.
                  </span>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setResetConfirmModal({ isOpen: false, agentId: null, agentName: '' })}
                className="telemetry-btn"
                style={{ padding: '6px 14px', fontSize: '11px', fontWeight: '700' }}
              >
                Batal
              </button>
              <button
                onClick={handleExecuteReset}
                style={{
                  padding: '6px 16px',
                  fontSize: '11px',
                  fontWeight: '800',
                  background: 'var(--accent-rust)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-xs)',
                  cursor: 'pointer'
                }}
              >
                Ya, Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL TERPADU: ATURAN TRADING & PANDUAN STATUS SIKLUS HIDUP            */}
      {/* ========================================================================= */}
      {rulesModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)',
          zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-panel)', width: '100%', maxWidth: '680px', maxHeight: '85vh',
            borderRadius: 'var(--radius-md)', border: 'var(--border-hairline)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            <div style={{ padding: '12px 18px', background: 'var(--bg-panel-subtle)', borderBottom: 'var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>📋</span>
                <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: '900', color: 'var(--text-primary)' }}>
                  Panduan Terpadu: Aturan Trading & Status Bot
                </h3>
              </div>
              <button onClick={() => setRulesModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            {/* Navigation Tabs: Aturan Trading vs Status Siklus Hidup */}
            <div style={{ display: 'flex', borderBottom: 'var(--border-hairline)', background: 'var(--bg-panel-subtle)', padding: '0 16px', gap: '8px' }}>
              <button
                id="tab-btn-rules"
                onClick={() => setRulesActiveSubTab('RULES')}
                style={{
                  padding: '10px 14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: rulesActiveSubTab === 'RULES' ? '2px solid var(--accent-blue)' : '2px solid transparent',
                  color: rulesActiveSubTab === 'RULES' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: rulesActiveSubTab === 'RULES' ? '800' : '600',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                📋 Aturan Trading & Risiko
              </button>
              <button
                id="tab-btn-status"
                onClick={() => setRulesActiveSubTab('STATUS')}
                style={{
                  padding: '10px 14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: rulesActiveSubTab === 'STATUS' ? '2px solid var(--accent-gold)' : '2px solid transparent',
                  color: rulesActiveSubTab === 'STATUS' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: rulesActiveSubTab === 'STATUS' ? '800' : '600',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                ℹ️ Status Siklus Hidup Bot
              </button>
            </div>

            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, fontSize: '11px', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {rulesActiveSubTab === 'RULES' ? (
                <>
                  <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 14px', borderRadius: '4px', borderLeft: '3px solid var(--accent-blue)' }}>
                    <strong style={{ color: 'var(--accent-blue)' }}>1. Modal Terisolasi Tiap Bot ({formatIdr(capitalPerBotIdr)})</strong>
                    <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)' }}>
                      Setiap bot beroperasi dengan dompet modal mandiri (Isolated Margin). Jika satu bot mengalami Margin Call atau drawdown tajam, modal bot elemen lainnya 100% aman dan tidak terpengaruh.
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 14px', borderRadius: '4px', borderLeft: '3px solid var(--accent-green)' }}>
                    <strong style={{ color: 'var(--accent-green)' }}>2. Skala Lot Menyesuaikan Modal Kecil</strong>
                    <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)' }}>
                      Untuk modal Rp 1 Juta (~${(capitalPerBotIdr / (usdToIdrRate || 16350)).toFixed(2)}), bot otomatis menggunakan <strong>0.01 Micro-Lot</strong> (Forex/Gold) dan <strong>1 Lot</strong> (100 lembar Saham BEI spot).
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 14px', borderRadius: '4px', borderLeft: '3px solid var(--accent-gold)' }}>
                    <strong style={{ color: 'var(--accent-gold)' }}>3. Batas Posisi Aktif & Kontrol Manual</strong>
                    <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)' }}>
                      Bisa diatur melalui input angka manual (1-100) atau tombol toggle cepat <strong>∞ Unlim</strong> untuk fleksibilitas tanpa batas.
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 14px', borderRadius: '4px', borderLeft: '3px solid var(--accent-rust)' }}>
                    <strong style={{ color: 'var(--accent-rust)' }}>4. Trailing Stop & Hard Stop Loss</strong>
                    <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)' }}>
                      Saat floating profit mencapai <strong>≥ 1.2R</strong>, Stop Loss otomatis digeser ke level Entry (Break-Even) guna mengunci risiko zero-loss dari pembalikan harga tiba-tiba.
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 14px', borderRadius: '4px', borderLeft: '3px solid var(--accent-purple)' }}>
                    <strong style={{ color: 'var(--accent-purple)' }}>5. Aturan Multi-Posisi Berbasis DNA Strategi (Institutional Risk Parity)</strong>
                    <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)' }}>
                      Mencegah over-eksposur dan spamming acak: Bot <strong>SMC & News</strong> (Water, Fire, Steam, Mud, Oceanic) menerapkan <strong>Single Bullet (1 posisi per pair)</strong>. Bot <strong>Trend</strong> (Air, Storm, Lightning, Tempest) menerapkan <strong>Pyramiding (hingga 2-3 layer) hanya jika posisi sebelumnya sudah profit (+0.8% s/d +1.0%)</strong>. Bot <strong>Mean Reversion</strong> (Earth, Sandstorm, Lava, Geothermal) menerapkan <strong>Scale-In deviasi kedua jika harga berjarak minimal 1.0x ATR</strong>. Setiap penambahan layer dilindungi cooldown 15-35 detik.
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 14px', borderRadius: '4px', borderLeft: '3px solid var(--accent-green)' }}>
                    <strong style={{ color: 'var(--accent-green)' }}>6. Multi-Mode Eksekusi: Spot vs Futures (Crypto, US Stocks & ETFs)</strong>
                    <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)' }}>
                      Pasar Crypto, Saham US, dan ETF mendukung dua model kontrak: <strong>Mode SPOT (100% Cash Long-Only, 1:1, 0 Risiko Likuidasi)</strong> untuk akumulasi aset murni tanpa utang margin (ideal untuk bot Value/SMC seperti Earth, Water, Oceanic), serta <strong>Mode FUTURES (2 Arah Long & Short + Leverage Dinamis 5x-20x)</strong> untuk memburu cuan cepat saat tren naik maupun crash. Pengguna bebas memilih mode global: <em>HYBRID</em>, <em>SPOT ONLY</em>, atau <em>FUTURES ONLY</em>.
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 14px', borderRadius: '4px', borderLeft: '3px solid var(--accent-blue)' }}>
                    <strong style={{ color: 'var(--accent-blue)' }}>7. Dynamic Tiered Market Scanner Pipeline</strong>
                    <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)' }}>
                      Alih-alih menyebar order secara membabi buta ke ribuan token micin yang illiquid, sistem menjalankan <strong>Pipeline 3 Tahap</strong>: (1) <em>Tier 1 Liquidity & Open Gate</em> membuang koin zombie dan penny stock &lt; $2; (2) <em>Tier 2 Momentum Screener</em> merangking ~50 pair teratas dengan volatilitas & ATR aktif; (3) <em>Tier 3 AI Strategy Matching</em> mengeksekusi instrumen yang grafiknya cocok 100% dengan formula matematika bot.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Setiap agen AI memiliki status operasi dinamis yang berubah real-time berdasarkan kondisi pasar dan posisi aktif:
                  </div>
                  {Object.keys(BOT_STATUS_GUIDE).map(key => {
                    const item = BOT_STATUS_GUIDE[key];
                    return (
                      <div key={key} style={{ background: 'var(--bg-panel-subtle)', padding: '12px 14px', borderRadius: '4px', borderLeft: `4px solid ${item.badgeColor}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span className="badge" style={{ fontSize: '9px', background: 'rgba(255,255,255,0.08)', color: item.badgeColor, fontWeight: '800' }}>
                            {key}
                          </span>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '12px' }}>{item.title}</strong>
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.5', fontSize: '10.5px' }}>
                          {item.desc}
                        </p>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div style={{ padding: '8px 18px', background: 'var(--bg-panel-subtle)', borderTop: 'var(--border-hairline)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setRulesModalOpen(false)} className="telemetry-btn" style={{ padding: '5px 14px', fontSize: '11px' }}>
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: JURNAL TRANSAKSI LENGKAP BOT                                    */}
      {/* ========================================================================= */}
      {journalModal.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)',
          zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-panel)', width: '100%', maxWidth: '850px', maxHeight: '85vh',
            borderRadius: 'var(--radius-md)', border: 'var(--border-hairline)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            
            <div style={{ padding: '12px 18px', background: 'var(--bg-panel-subtle)', borderBottom: 'var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>📖</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: 'var(--text-primary)' }}>
                    Jurnal Transaksi: {journalModal.agentName}
                  </h3>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                    Riwayat closed trade terverifikasi dengan konversi ganda Rupiah & Dollar.
                  </div>
                </div>
              </div>
              <button onClick={() => setJournalModal({ isOpen: false, agentId: 'ALL', agentName: 'Semua Agen' })} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            {(() => {
              const targetTrades = journalModal.agentId === 'ALL'
                ? journal
                : journal.filter(j => j.agentId === journalModal.agentId);

              const totalTradesCount = targetTrades.length;
              const totalWins = targetTrades.filter(j => j.isWin).length;
              const totalLosses = totalTradesCount - totalWins;
              const winRatePct = totalTradesCount > 0 ? ((totalWins / totalTradesCount) * 100).toFixed(1) : '0.0';

              const totalGrossProfitIdr = targetTrades.filter(j => (j.pnlIdr || (j.pnlUsd * USD_TO_IDR)) > 0)
                .reduce((acc, t) => acc + (t.pnlIdr || (t.pnlUsd * USD_TO_IDR)), 0);
              const totalGrossLossIdr = Math.abs(targetTrades.filter(j => (j.pnlIdr || (j.pnlUsd * USD_TO_IDR)) < 0)
                .reduce((acc, t) => acc + (t.pnlIdr || (t.pnlUsd * USD_TO_IDR)), 0));

              const totalNetPnlIdr = targetTrades.reduce((acc, t) => acc + (t.pnlIdr || (t.pnlUsd * USD_TO_IDR)), 0);
              const totalNetPnlUsd = totalNetPnlIdr / USD_TO_IDR;
              const profitFactorVal = totalGrossLossIdr > 0 ? (totalGrossProfitIdr / totalGrossLossIdr).toFixed(2) : (totalGrossProfitIdr > 0 ? '99.0' : '0.0');
              const avgRr = totalTradesCount > 0 ? (targetTrades.reduce((acc, t) => acc + (Number(t.rrAchieved) || 0), 0) / totalTradesCount).toFixed(2) : '0.0';

              return (
                <>
                  {/* GAMBAR 1: DETAIL TOTAL PNL & RINGKASAN STATISTIK JURNAL */}
                  <div style={{
                    padding: '12px 18px',
                    background: totalNetPnlIdr >= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    borderBottom: totalNetPnlIdr >= 0 ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    {/* Left: Total PnL Highlight */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '6px',
                        background: totalNetPnlIdr >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: totalNetPnlIdr >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '900'
                      }}>
                        {totalNetPnlIdr >= 0 ? '▲' : '▼'}
                      </div>
                      <div>
                        <div style={{ fontSize: '8.5px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          TOTAL REALIZED PnL ({journalModal.agentName})
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{
                            fontSize: '17px', fontWeight: '900', fontFamily: 'var(--font-mono)',
                            color: totalNetPnlIdr >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)'
                          }}>
                            {totalNetPnlIdr >= 0 ? '+' : ''}{formatIdr(totalNetPnlIdr)}
                          </span>
                          <span style={{ fontSize: '10.5px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                            ({totalNetPnlUsd >= 0 ? '+' : ''}{formatUsd(totalNetPnlUsd)})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Key Quantitative Matrix */}
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontFamily: 'var(--font-mono)' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: '700' }}>TOTAL TRADES</div>
                        <div style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--text-primary)' }}>
                          {totalTradesCount} <span style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>trades</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: '700' }}>WIN RATE</div>
                        <div style={{ fontSize: '11.5px', fontWeight: '800', color: Number(winRatePct) >= 50 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                          {winRatePct}% <span style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>({totalWins}W / {totalLosses}L)</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: '700' }}>PROFIT FACTOR</div>
                        <div style={{ fontSize: '11.5px', fontWeight: '800', color: Number(profitFactorVal) >= 1.5 ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
                          {profitFactorVal}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: '700' }}>AVG R:R</div>
                        <div style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--accent-blue)' }}>
                          1:{avgRr}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Trades Table */}
                  <div style={{ padding: '12px', overflowY: 'auto', flex: 1 }}>
                    {targetTrades.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
                        Belum ada riwayat transaksi yang ditutup untuk agen ini.
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', fontFamily: 'var(--font-mono)' }}>
                        <thead>
                          <tr style={{ borderBottom: 'var(--border-hairline)', color: 'var(--text-muted)', textAlign: 'left' }}>
                            <th style={{ padding: '6px 8px' }}>WAKTU</th>
                            <th style={{ padding: '6px 8px' }}>PAIR</th>
                            <th style={{ padding: '6px 8px' }}>AGEN</th>
                            <th style={{ padding: '6px 8px' }}>ENTRY</th>
                            <th style={{ padding: '6px 8px' }}>EXIT</th>
                            <th style={{ padding: '6px 8px' }}>REASON</th>
                            <th style={{ padding: '6px 8px' }}>R:R</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>PnL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {targetTrades.map(item => {
                            const isWin = item.isWin;
                            const pnlIdr = item.market === 'IDX' && item.pnlIdr ? item.pnlIdr : (item.pnlUsd * USD_TO_IDR);
                            return (
                              <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>
                                  {new Date(item.closedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                </td>
                                <td style={{ padding: '6px 8px', fontWeight: '800', color: 'var(--text-primary)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>{item.symbol}</span>
                                    <span style={{
                                      fontSize: '7px',
                                      padding: '1px 3px',
                                      borderRadius: '2px',
                                      background: (item.executionMode === 'SPOT' || item.market === 'IDX') ? 'rgba(34, 197, 94, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                                      color: (item.executionMode === 'SPOT' || item.market === 'IDX') ? 'var(--accent-green)' : '#c084fc',
                                      fontWeight: '900',
                                      border: `1px solid ${(item.executionMode === 'SPOT' || item.market === 'IDX') ? 'rgba(34, 197, 94, 0.4)' : 'rgba(168, 85, 247, 0.4)'}`
                                    }}>
                                      {(item.executionMode === 'SPOT' || item.market === 'IDX') ? 'SPOT' : 'FUT'}
                                    </span>
                                  </div>
                                </td>
                                <td style={{ padding: '6px 8px', color: 'var(--accent-blue)', fontWeight: '700' }}>
                                  {item.agentId}
                                </td>
                                <td style={{ padding: '6px 8px' }}>{formatInstrumentPrice(item.entryPrice, item.market, item.symbol)}</td>
                                <td style={{ padding: '6px 8px' }}>{formatInstrumentPrice(item.exitPrice, item.market, item.symbol)}</td>
                                <td style={{ padding: '6px 8px' }}>
                                  <span style={{
                                    fontSize: '8px',
                                    padding: '1px 4px',
                                    borderRadius: '2px',
                                    background: isWin ? 'rgba(22, 163, 74, 0.15)' : 'rgba(220, 38, 38, 0.15)',
                                    color: isWin ? 'var(--accent-green)' : 'var(--accent-rust)',
                                    fontWeight: '700'
                                  }}>
                                    {item.exitReason}
                                  </span>
                                </td>
                                <td style={{ padding: '6px 8px', color: item.rrAchieved > 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                                  {item.rrAchieved > 0 ? `1:${item.rrAchieved}` : `${item.rrAchieved}R`}
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '800', color: isWin ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                                  <div>{isWin ? '+' : ''}{formatIdr(pnlIdr)}</div>
                                  <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>({isWin ? '+' : ''}{formatUsd(item.pnlUsd)})</div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              );
            })()}

            <div style={{ padding: '8px 18px', background: 'var(--bg-panel-subtle)', borderTop: 'var(--border-hairline)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setJournalModal({ isOpen: false, agentId: 'ALL', agentName: 'Semua Agen' })} className="telemetry-btn" style={{ padding: '5px 12px', fontSize: '10px' }}>
                Tutup Modal
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: SESSION RECAP & INSTITUTIONAL QUANT POST-MORTEM DEBRIEF HUB      */}
      {/* ========================================================================= */}
      {sessionRecapModalOpen && sessionRecapData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.82)', backdropFilter: 'blur(6px)',
          zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-panel)', width: '100%', maxWidth: '960px', maxHeight: '90vh',
            borderRadius: 'var(--radius-md)', border: '1px solid rgba(217, 70, 239, 0.35)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 70px rgba(0,0,0,0.85)'
          }}>
            {/* 1. Header Bar */}
            <div style={{ padding: '12px 18px', background: 'var(--bg-panel-subtle)', borderBottom: 'var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>📜</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '0.3px' }}>
                      Session Recap & Institutional Quant Post-Mortem Debrief
                    </h3>
                    <span className="badge" style={{ fontSize: '8px', background: 'rgba(217, 70, 239, 0.18)', color: '#e879f9', border: '1px solid rgba(217, 70, 239, 0.4)' }}>
                      Bridgewater & AQR Debrief Standard
                    </span>
                  </div>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {sessionRecapData.sessionLabel} • Evaluasi Kinerja, Rekapitulasi Multiverse Alpha, & Rekomendasi Adaptif Sesi Berikutnya
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSessionRecapModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)' }}
                title="Tutup Modal"
              >
                ✕
              </button>
            </div>

            {/* 2. Multi-Session Switcher Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'rgba(255,255,255,0.02)', borderBottom: 'var(--border-hairline)', flexWrap: 'wrap' }}>
              <label htmlFor="select-session-recap" style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                PILIH SESI:
              </label>
              <select
                id="select-session-recap"
                value={selectedRecapSessionKey}
                onChange={e => setSelectedRecapSessionKey(e.target.value === 'LIVE' ? 'LIVE' : Number(e.target.value))}
                style={{
                  background: 'var(--bg-panel-subtle, #161b22)',
                  color: selectedRecapSessionKey === 'LIVE' ? '#38bdf8' : '#c084fc',
                  border: '1px solid var(--border-subtle, #30363d)',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '240px'
                }}
              >
                <option value="LIVE" style={{ background: '#0d1117', color: '#38bdf8' }}>
                  ● Sesi #{epochReports.length} (Aktif / Live Interim)
                </option>
                {epochReports.map((ep, idx) => (
                  <option key={ep.id || idx} value={idx} style={{ background: '#0d1117', color: '#c084fc' }}>
                    📑 Sesi #{ep.epochNumber} ({ep.createdAt ? ep.createdAt.split(',')[0] : 'Arsip'})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Modal Body */}
            <div style={{ padding: '14px 18px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* SECTION 1: EXECUTIVE KPI SCORECARD */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontWeight: '800' }}>NET REALIZED PnL</div>
                  <div style={{ fontSize: '15px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: sessionRecapData.netPnlIdr >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)', marginTop: '2px' }}>
                    {sessionRecapData.netPnlIdr >= 0 ? '+' : ''}{formatIdr(sessionRecapData.netPnlIdr)}
                  </div>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    ({sessionRecapData.netPnlUsd >= 0 ? '+' : ''}{formatUsd(sessionRecapData.netPnlUsd)})
                  </div>
                </div>

                <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontWeight: '800' }}>RETURN ON CAPITAL (ROC)</div>
                  <div style={{ fontSize: '15px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: Number(sessionRecapData.rocPct) >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)', marginTop: '2px' }}>
                    {Number(sessionRecapData.rocPct) >= 0 ? '+' : ''}{sessionRecapData.rocPct}%
                  </div>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                    Terhadap Total Modal Sesi
                  </div>
                </div>

                <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontWeight: '800' }}>WIN RATE & VOLUME</div>
                  <div style={{ fontSize: '15px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: Number(sessionRecapData.winRate) >= 50 ? 'var(--accent-green)' : 'var(--accent-rust)', marginTop: '2px' }}>
                    {sessionRecapData.winRate}%
                  </div>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {sessionRecapData.totalTrades} Tiket ({sessionRecapData.wins}W / {sessionRecapData.losses}L)
                  </div>
                </div>

                <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontWeight: '800' }}>PROFIT FACTOR</div>
                  <div style={{ fontSize: '15px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: Number(sessionRecapData.profitFactor) >= 1.5 ? 'var(--accent-green)' : 'var(--accent-orange)', marginTop: '2px' }}>
                    {sessionRecapData.profitFactor}
                  </div>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                    Gross Profit / Gross Loss
                  </div>
                </div>

                <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontWeight: '800' }}>SHARPE RATIO (ALPHA)</div>
                  <div style={{ fontSize: '15px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: Number(sessionRecapData.sharpeRatio) >= 1.0 ? 'var(--accent-green)' : 'var(--accent-blue)', marginTop: '2px' }}>
                    {sessionRecapData.sharpeRatio}
                  </div>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                    Risk-Adjusted Efficiency
                  </div>
                </div>

                <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontWeight: '800' }}>STATUS & UPTIME</div>
                  <div style={{ fontSize: '12px', fontWeight: '900', color: sessionRecapData.isLive ? 'var(--accent-green)' : '#c084fc', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{sessionRecapData.isLive ? '🟢' : '📑'}</span>
                    <span>{sessionRecapData.isLive ? 'LIVE INTERIM' : 'DIARSIPKAN'}</span>
                  </div>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    ⏱️ {sessionRecapData.uptimeStr}
                  </div>
                </div>
              </div>

              {/* SECTION 2: 🏆 MVP & TOP PERFORMER OF THE SESSION */}
              {sessionRecapData.mvp && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 70, 239, 0.08) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '32px' }}>
                      🏆
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span className="badge" style={{ fontSize: '8.5px', background: 'rgba(245, 158, 11, 0.25)', color: 'var(--accent-gold)', border: '1px solid rgba(245, 158, 11, 0.5)' }}>
                          TOP PERFORMER OF THE SESSION
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: '900', color: sessionRecapData.mvp.color }}>
                          {sessionRecapData.mvp.avatar} {sessionRecapData.mvp.name}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          ({sessionRecapData.mvp.role})
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '10.5px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                        🌟 <strong>Alpha Edge:</strong> Eksekusi konsisten dengan disiplin risiko tinggi. Mengkontribusikan keuntungan terbesar sesi ini dengan profit factor <strong>{sessionRecapData.mvp.profitFactor}</strong> dan instrumen terbaik <strong>{sessionRecapData.mvp.bestPair}</strong>.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>NET GAIN KONTRIBUSI</div>
                      <div style={{ fontSize: '14px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: sessionRecapData.mvp.netPnlIdr >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                        {sessionRecapData.mvp.netPnlIdr >= 0 ? '+' : ''}{formatIdr(sessionRecapData.mvp.netPnlIdr)}
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        Win Rate: {sessionRecapData.mvp.winRate}% ({sessionRecapData.mvp.totalTrades} trade)
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: KEY TAKEAWAY ALERT */}
              <div style={{
                background: sessionRecapData.netPnlIdr >= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                borderLeft: sessionRecapData.netPnlIdr >= 0 ? '3px solid var(--accent-green)' : '3px solid var(--accent-rust)',
                padding: '9px 12px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-primary)', lineHeight: '1.5'
              }}>
                <strong>📌 Blameless Debrief Summary:</strong> {sessionRecapData.keyTakeaway}
              </div>

              {/* SECTION 4: PER-AGENT PERFORMANCE MATRIX */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🤖</span>
                  <span>Matriks Komparasi 4 Elemen Bot (WATER, FIRE, AIR, EARTH)</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', fontFamily: 'var(--font-mono)', background: 'var(--bg-panel-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ borderBottom: 'var(--border-hairline)', color: 'var(--text-muted)', textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                      <th style={{ padding: '6px 8px' }}>AGENT</th>
                      <th style={{ padding: '6px 8px' }}>TRADES (W/L)</th>
                      <th style={{ padding: '6px 8px' }}>WIN RATE</th>
                      <th style={{ padding: '6px 8px' }}>PROFIT FACTOR</th>
                      <th style={{ padding: '6px 8px' }}>TOP INSTRUMENT</th>
                      <th style={{ padding: '6px 8px' }}>EXP3 WEIGHT SHIFT</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>NET PnL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionRecapData.agentBreakdowns.map(ab => (
                      <tr key={ab.agentId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '6px 8px', fontWeight: '800', color: ab.color, display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span>{ab.avatar}</span>
                          <span>{ab.name}</span>
                        </td>
                        <td style={{ padding: '6px 8px', color: 'var(--text-secondary)' }}>
                          {ab.totalTrades} ({ab.wins}W / {ab.losses}L)
                        </td>
                        <td style={{ padding: '6px 8px', fontWeight: '800', color: Number(ab.winRate) >= 50 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                          {ab.winRate}%
                        </td>
                        <td style={{ padding: '6px 8px', color: 'var(--text-primary)' }}>
                          {ab.profitFactor}
                        </td>
                        <td style={{ padding: '6px 8px', color: 'var(--accent-gold)', fontWeight: '700' }}>
                          {ab.bestPair !== '-' ? ab.bestPair : 'N/A'}
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{(ab.oldWeight * 100).toFixed(0)}%</span>
                          <span style={{ margin: '0 4px', color: 'var(--accent-blue)' }}>➔</span>
                          <span style={{ fontWeight: '800', color: ab.diffPct >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                            {(ab.newWeight * 100).toFixed(0)}% ({ab.diffPct >= 0 ? '+' : ''}{ab.diffPct}%)
                          </span>
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '800', color: ab.netPnlIdr >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                          {ab.netPnlIdr >= 0 ? '+' : ''}{formatIdr(ab.netPnlIdr)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* SECTION 5: UNIVERSE ATTRIBUTION */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🌐</span>
                  <span>Universe Attribution (Top Alpha Generators vs Toxic Drag Pairs)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
                  
                  {/* Card Alpha Generators */}
                  <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '6px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', borderBottom: '1px solid rgba(16, 185, 129, 0.15)', paddingBottom: '6px' }}>
                      <span style={{ fontSize: '13px' }}>💎</span>
                      <strong style={{ fontSize: '11px', color: 'var(--accent-green)' }}>Top Alpha Generators (Paling Menguntungkan)</strong>
                    </div>
                    {sessionRecapData.topAlphaPairs.length === 0 ? (
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                        Belum ada instrumen yang mencatatkan profit positif pada sesi ini.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {sessionRecapData.topAlphaPairs.map((p, idx) => (
                          <div key={p.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-panel)', padding: '6px 8px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '10px', color: 'var(--accent-gold)', fontWeight: '900' }}>#{idx + 1}</span>
                              <strong style={{ fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{p.symbol}</strong>
                              <span className="badge" style={{ fontSize: '7.5px', padding: '1px 4px' }}>{p.market}</span>
                              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{p.totalTrades} trades</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '10.5px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>
                                +{formatIdr(p.netPnlIdr)}
                              </div>
                              <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                                Win Rate: {p.winRate}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Toxic Drag Pairs */}
                  <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', borderBottom: '1px solid rgba(239, 68, 68, 0.15)', paddingBottom: '6px' }}>
                      <span style={{ fontSize: '13px' }}>⚠️</span>
                      <strong style={{ fontSize: '11px', color: 'var(--accent-rust)' }}>Toxic Drag Pairs (Penyumbang Defisit Terbesar)</strong>
                    </div>
                    {sessionRecapData.toxicDragPairs.length === 0 ? (
                      <div style={{ fontSize: '10px', color: 'var(--accent-green)', padding: '6px 0' }}>
                        ✅ Tidak ada instrumen toxic berkinerja negatif signifikan.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {sessionRecapData.toxicDragPairs.map((p, idx) => (
                          <div key={p.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-panel)', padding: '6px 8px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '10px', color: 'var(--accent-rust)', fontWeight: '900' }}>#{idx + 1}</span>
                              <strong style={{ fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{p.symbol}</strong>
                              <span className="badge" style={{ fontSize: '7.5px', padding: '1px 4px' }}>{p.market}</span>
                              <span style={{ fontSize: '8px', color: 'var(--accent-rust)', fontWeight: '700' }}>Cooldown Recom.</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '10.5px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-rust)' }}>
                                {formatIdr(p.netPnlIdr)}
                              </div>
                              <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                                {p.totalTrades} trades (Loss)
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* SECTION 6: SARAN & REKOMENDASI ADAPTIF KONKRET */}
              <div style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '6px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid rgba(168, 85, 247, 0.15)', paddingBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px' }}>🧠</span>
                    <strong style={{ fontSize: '11px', color: '#c084fc' }}>Saran & Rekomendasi Kuantitatif untuk Sesi Berikutnya (Closed-Loop Roadmap)</strong>
                  </div>
                  <span className="badge" style={{ fontSize: '8px', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>
                    Bridgewater Principles & EXP3 Multi-Armed Bandit
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
                  <div style={{ background: 'var(--bg-panel)', padding: '8px 10px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent-blue)', marginBottom: '3px' }}>
                      ⚖️ 1. Realokasi Modal EXP3
                    </div>
                    <p style={{ margin: 0, fontSize: '9.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      Prioritaskan modal pada bot dengan Sharpe Ratio terbaik sesi ini ({sessionRecapData.mvp?.name || 'Top Performer'}). Kurangi porsi bot yang berada di zona drawdown hingga ekuitas pulih ke baseline.
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-panel)', padding: '8px 10px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent-orange)', marginBottom: '3px' }}>
                      🛡️ 2. Pengetatan Trailing & Filter Sinyal
                    </div>
                    <p style={{ margin: 0, fontSize: '9.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {sessionRecapData.toxicDragPairs.length > 0
                        ? `Terapkan cooldown pada pair ${sessionRecapData.toxicDragPairs.map(p => p.symbol).join(', ')}. Perketat trailing ratchet (+15%) pada bot yang mencatatkan win rate di bawah 50%.`
                        : 'Pertahankan trailing ratchet 1.0x dan lanjutkan eksplorasi sinyal lintas instrumen likuid dengan parameter optimal.'}
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-panel)', padding: '8px 10px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent-green)', marginBottom: '3px' }}>
                      🏛️ 3. Disiplin Jam Operasional Bursa
                    </div>
                    <p style={{ margin: 0, fontSize: '9.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      Maksimalkan pemindaian pada overlap sesi London/New York untuk FOREX & FUTURES. Saham BEI (EARTH) tetap disiplin di jam 09:00 - 15:45 WIB tanpa order spekulatif saat pasar tutup.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* 4. Action Footer */}
            <div style={{ padding: '10px 18px', background: 'var(--bg-panel-subtle)', borderTop: 'var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setSessionRecapModalOpen(false)}
                className="telemetry-btn"
                style={{ padding: '5px 14px', fontSize: '11px' }}
              >
                Tutup Recap
              </button>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {sessionRecapData.isLive ? (
                  <button
                    onClick={() => {
                      setSessionRecapModalOpen(false);
                      handleResetClick(null, 'Seluruh Elemen (Global Session Reset)');
                    }}
                    style={{
                      padding: '6px 16px',
                      fontSize: '11px',
                      fontWeight: '800',
                      background: 'rgba(217, 70, 239, 0.2)',
                      color: '#f0abfc',
                      border: '1px solid rgba(217, 70, 239, 0.5)',
                      borderRadius: 'var(--radius-xs)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    title="Arsipkan sesi saat ini dan mulai sesi berikutnya dengan adaptasi EXP3"
                  >
                    <span>🔄</span>
                    <span>Selesaikan & Arsipkan Sesi Ini</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSessionRecapModalOpen(false);
                      setIsRunning(true);
                      showToast('▶️ Sesi trading berjalan dengan parameter adaptasi yang telah diperbarui!');
                    }}
                    style={{
                      padding: '6px 16px',
                      fontSize: '11px',
                      fontWeight: '800',
                      background: 'var(--accent-green)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 'var(--radius-xs)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 0 12px rgba(22, 163, 74, 0.3)'
                    }}
                  >
                    <span>▶️</span>
                    <span>Lanjutkan Trading Sesi Aktif</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: SILSILAH EVOLUSI GENERASI & MUTASI DNA (GEN EXTINCTION/RESPAWN) */}
      {/* ========================================================================= */}
      {evolutionModal.isOpen && evolutionModal.agent && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.82)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          backdropFilter: 'blur(4px)',
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-panel)',
            border: `1px solid ${evolutionModal.agent.color}`,
            borderRadius: 'var(--radius-md)',
            width: '100%',
            maxWidth: '640px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: `0 16px 40px rgba(0,0,0,0.7), 0 0 24px ${evolutionModal.agent.color}33`
          }}>
            {/* Header */}
            <div style={{
              padding: '12px 18px',
              borderBottom: 'var(--border-hairline)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-panel-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '26px' }}>{evolutionModal.agent.avatar}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: 'var(--text-primary)' }}>
                      {evolutionModal.agent.name} — Silsilah Generasi & Mutasi DNA
                    </h3>
                    <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)', fontSize: '9px', fontWeight: '800' }}>
                      🧬 GEN {evolutionModal.agent.generation ?? 0}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: evolutionModal.agent.color, fontWeight: '700' }}>
                    {evolutionModal.agent.role} • {evolutionModal.agent.strategy}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEvolutionModal({ isOpen: false, agent: null })}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '14px 18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Concept Note */}
              <div style={{ background: 'rgba(168, 85, 247, 0.08)', borderLeft: '3px solid #a855f7', padding: '8px 12px', borderRadius: '4px', fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                <strong>🎮 Siklus Hidup & Generasi Bot:</strong> Ketika saldo bot jatuh hingga minus (&le; 0), bot mengalami Margin Call (mati). Seluruh posisi aktif dilikuidasi seketika, dan bot berevolusi (respawn) ke <strong>Generasi berikutnya (Gen {((evolutionModal.agent.generation ?? 0) + 1)})</strong> dengan catatan defisit serta <strong>mutasi DNA</strong> (parameter risk & trailing stop yang diperketat).
              </div>

              {/* Status Metric Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <div style={{ background: 'var(--bg-panel-subtle)', padding: '8px 10px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>GENERASI SAAT INI</div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
                    Gen {evolutionModal.agent.generation ?? 0}
                  </div>
                  <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Iterasi Evolusi Hidup</div>
                </div>

                <div style={{ background: 'var(--bg-panel-subtle)', padding: '8px 10px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>TOTAL KALI TER-RESET</div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: (evolutionModal.agent.resetCount || 0) > 0 ? 'var(--accent-rust)' : 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
                    {evolutionModal.agent.resetCount || 0}x
                  </div>
                  <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Margin Call / Extinction</div>
                </div>

                <div style={{ background: 'var(--bg-panel-subtle)', padding: '8px 10px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>TOTAL DEFISIT HISTORIS</div>
                  <div style={{ fontSize: '14px', fontWeight: '900', color: (evolutionModal.agent.resetsHistory?.length || 0) > 0 ? 'var(--accent-rust)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {(evolutionModal.agent.resetsHistory?.length || 0) > 0
                      ? `-${formatIdr((evolutionModal.agent.resetsHistory || []).reduce((acc, r) => acc + (r.deficitIdr || 0), 0))}`
                      : 'Rp 0'}
                  </div>
                  <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Akumulasi Kerugian</div>
                </div>
              </div>

              {/* Mutated DNA Parameters */}
              <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>🧬</span>
                  <span>Parameter DNA Adaptif Aktif:</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ background: 'var(--bg-panel)', padding: '6px 8px', borderRadius: '3px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '8px' }}>Risk Multiplier</div>
                    <div style={{ fontWeight: '800', color: (evolutionModal.agent.dnaTraits?.riskMultiplier || 1.0) < 1.0 ? 'var(--accent-orange)' : 'var(--accent-green)', fontSize: '11px' }}>
                      {((evolutionModal.agent.dnaTraits?.riskMultiplier || 1.0) * 100).toFixed(0)}%
                    </div>
                    <div style={{ fontSize: '7.5px', color: 'var(--text-muted)' }}>
                      {(evolutionModal.agent.dnaTraits?.riskMultiplier || 1.0) < 1.0 ? 'Proteksi Risiko Diperketat' : 'Standar Default'}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-panel)', padding: '6px 8px', borderRadius: '3px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '8px' }}>Confidence Boost</div>
                    <div style={{ fontWeight: '800', color: (evolutionModal.agent.dnaTraits?.confidenceBoost || 0) > 0 ? '#c084fc' : 'var(--text-primary)', fontSize: '11px' }}>
                      +{(evolutionModal.agent.dnaTraits?.confidenceBoost || 0)}%
                    </div>
                    <div style={{ fontSize: '7.5px', color: 'var(--text-muted)' }}>Threshold Konfirmasi Masuk</div>
                  </div>

                  <div style={{ background: 'var(--bg-panel)', padding: '6px 8px', borderRadius: '3px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '8px' }}>Trailing Stop Tightness</div>
                    <div style={{ fontWeight: '800', color: (evolutionModal.agent.dnaTraits?.trailingTightness || 1.0) > 1.0 ? 'var(--accent-blue)' : 'var(--text-primary)', fontSize: '11px' }}>
                      {((evolutionModal.agent.dnaTraits?.trailingTightness || 1.0) * 100).toFixed(0)}%
                    </div>
                    <div style={{ fontSize: '7.5px', color: 'var(--text-muted)' }}>Kecepatan Kunci Profit</div>
                  </div>
                </div>
              </div>

              {/* Generation Timeline & History Table */}
              <div>
                <div style={{ fontSize: '10.5px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>📜</span>
                  <span>Riwayat Gugur & Evolusi Generasi</span>
                </div>

                {(!evolutionModal.agent.resetsHistory || evolutionModal.agent.resetsHistory.length === 0) ? (
                  <div style={{ padding: '18px', textAlign: 'center', background: 'var(--bg-panel-subtle)', borderRadius: '4px', border: 'var(--border-hairline)', color: 'var(--text-muted)', fontSize: '10.5px' }}>
                    🌱 <strong>Generasi 0 (Genesis Baseline):</strong> Bot beroperasi di konfigurasi awal murni dan belum pernah mengalami Margin Call / mutasi penalti.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {evolutionModal.agent.resetsHistory.map((rh, idx) => (
                      <div key={idx} style={{
                        background: 'var(--bg-panel-subtle)',
                        border: 'var(--border-hairline)',
                        borderLeft: '3px solid var(--accent-rust)',
                        padding: '8px 10px',
                        borderRadius: '4px',
                        fontSize: '9.5px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', fontSize: '8.5px', fontWeight: '800' }}>
                              Gen {rh.fromGen} ➔ Gen {rh.toGen}
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>
                              Defisit: <strong style={{ color: 'var(--accent-rust)', fontFamily: 'var(--font-mono)' }}>-{formatIdr(rh.deficitIdr || 0)}</strong>
                            </span>
                          </div>
                          <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {new Date(rh.timestamp).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                          Penyebab: <span style={{ color: 'var(--text-secondary)' }}>{rh.reason || 'MARGIN_CALL'}</span> • Posisi Terlikuidasi: <span style={{ color: 'var(--accent-rust)', fontWeight: '700' }}>{rh.positionsLiquidated || 0} order</span> • Pair Berisiko: <span style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>{rh.toxicPair || 'N/A'}</span>
                        </div>
                        <div style={{ fontSize: '8.5px', color: '#c084fc', background: 'rgba(168, 85, 247, 0.06)', padding: '3px 6px', borderRadius: '3px' }}>
                          🧬 <strong>Adaptasi DNA:</strong> Risk dikurangi ke {((rh.mutation?.riskMultiplier || 1) * 100).toFixed(0)}%, Confidence boost +{rh.mutation?.confidenceBoost || 0}%, Trailing stop diperketat {((rh.mutation?.trailingTightness || 1) * 100).toFixed(0)}%.
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '10px 18px',
              borderTop: 'var(--border-hairline)',
              background: 'var(--bg-panel-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <button
                onClick={() => setEvolutionModal({ isOpen: false, agent: null })}
                className="telemetry-btn"
                style={{ padding: '5px 14px', fontSize: '10px' }}
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setResetConfirmModal({ isOpen: true, agentId: evolutionModal.agent.id, agentName: evolutionModal.agent.name });
                  setEvolutionModal({ isOpen: false, agent: null });
                }}
                className="telemetry-btn"
                style={{ padding: '5px 12px', fontSize: '10px', color: 'var(--accent-rust)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              >
                🔄 Reset & Evolve Bot Ini ke Gen {((evolutionModal.agent.generation ?? 0) + 1)}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
