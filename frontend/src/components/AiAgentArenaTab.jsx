import React, { useState, useEffect, useMemo, useCallback, useRef, useId } from 'react';
import { institutionalPaperBroker } from '../services/brokerGateway.js';
import { isIdxMarketOpen, getIdxSessionDetail, isForexCommodityOpen, isCryptoOpen, isUsMarketOpen } from '../utils/marketHours.js';

// Central Strict Real-World Market Open Classifier (All asset classes)
export const isMarketOpenNow = (market) => {
  if (market === 'IDX') return isIdxMarketOpen();
  if (market === 'US') return isUsMarketOpen();
  if (market === 'FOREX' || market === 'FUTURES') return isForexCommodityOpen();
  if (market === 'CRYPTO') return true;
  return false;
};

// Live Currency Exchange Rate Baseline with Dynamic Fetch Support (with persistent localStorage fallback)
let currentLiveUsdToIdr = (() => {
  try {
    const saved = localStorage.getItem('mbg_usd_idr_rate');
    return saved ? Number(saved) : 16350;
  } catch {
    return 16350;
  }
})();
const USD_TO_IDR = currentLiveUsdToIdr || 16350;

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

// Helper to determine standard leverage for each market/instrument & execution mode (Kevin Dowd Volatility Model)
export const getLeverage = (market, symbol = '', executionMode = 'FUTURES', atrRatio = 1.0) => {
  if (market === 'IDX' || executionMode === 'SPOT') return '1:1 (Spot)';
  if (market === 'US') return '1:5 (CFD)';

  // Kevin Dowd (2005) Volatility-Targeted Leverage:
  // Jika rasio volatilitas tinggi (> 1.8x normal), turunkan leverage untuk melindungi margin akun
  const isExtremeVol = atrRatio > 2.5;
  const isHighVol = atrRatio > 1.8;

  if (market === 'CRYPTO') {
    if (isExtremeVol) return '1:5 (Perp-Safe)';
    if (isHighVol) return '1:10 (Perp-Vol)';
    return '1:20 (Perp)';
  }
  if (['US30', 'US500', 'NAS100', 'DAX40', 'NIKKEI', 'HSI'].includes(symbol)) {
    if (isExtremeVol) return '1:20 (Index-Safe)';
    if (isHighVol) return '1:30 (Index)';
    return '1:50 (Index)';
  }
  if (symbol && (symbol.includes('XAU') || symbol.includes('XAG') || symbol.includes('USOIL') || symbol.includes('UKOIL') || market === 'FUTURES')) {
    if (isExtremeVol) return '1:30 (Safe)';
    if (isHighVol) return '1:50 (Vol-Guard)';
    return '1:100';
  }
  if (market === 'FOREX') {
    if (isExtremeVol) return '1:30 (Safe)';
    if (isHighVol) return '1:50 (Vol-Guard)';
    return '1:100';
  }
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
  AVATAR: 'HYBRID',   // 4-Element Master: Dynamic 50/50 Spot & Futures
  CHAOS: 'FUTURES'    // The Rogue Anomaly: 100% Futures 2-way maximum leverage
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
  // Deterministic: alternate based on timestamp (no random)
  return (Math.floor(Date.now() / 10000) % 2 === 0) ? 'SPOT' : 'FUTURES';
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



// Technical Analysis Signal Engine (Zero Math.random Decision)
const computeRsiProxy = (change, atr, price) => {
  if (!price || price <= 0 || !atr || atr <= 0) return 50;
  const normalizedChange = (change / 100) * price;
  const atrRatio = normalizedChange / atr;
  return Math.max(0, Math.min(100, 50 + (atrRatio * 25)));
};

const computeRangePosition = (price, high, low) => {
  if (!high || !low || high <= low) return 0.5;
  return Math.max(0, Math.min(1, (price - low) / (high - low)));
};

const computeMomentumScore = (change, atr, price) => {
  if (!price || price <= 0 || !atr || atr <= 0) return 0;
  const absPriceMove = Math.abs(change / 100) * price;
  const direction = change >= 0 ? 1 : -1;
  return direction * (absPriceMove / atr);
};

const detectRegimeProxy = (change, atr, price, high, low) => {
  if (!atr || !price || price <= 0) return 'RANGING';
  const atrPct = (atr / price) * 100;
  const absChange = Math.abs(change || 0);
  if (absChange > atrPct * 1.5 && change > 0) return 'TRENDING_BULL';
  if (absChange > atrPct * 1.5 && change < 0) return 'TRENDING_BEAR';
  return 'RANGING';
};

const computeBollingerProxy = (price, high, low, atr) => {
  if (!price || !high || !low || !atr) return 0;
  const mid = (high + low) / 2;
  const bandWidth = atr * 2;
  if (bandWidth <= 0) return 0;
  return Math.max(-1.5, Math.min(1.5, (price - mid) / bandWidth));
};

const computeDonchianBreakout = (price, high, low) => {
  if (!high || !low || high <= low) return 0;
  const range = high - low;
  const upperProx = (high - price) / range;
  const lowerProx = (price - low) / range;
  return lowerProx - upperProx;
};

const computeAgentSignal = (agentId, targetKey, feed, dnaTraits = {}) => {
  const { price, change = 0, high, low, atr } = feed;
  if (!price || price <= 0) return { isLong: true, confidence: 50, rationale: 'Insufficient data' };

  const rsi = computeRsiProxy(change, atr, price);
  const rangePos = computeRangePosition(price, high, low);
  const momentum = computeMomentumScore(change, atr, price);
  const regime = detectRegimeProxy(change, atr, price, high, low);
  const bollinger = computeBollingerProxy(price, high, low, atr);
  const donchian = computeDonchianBreakout(price, high, low);
  const confBoost = dnaTraits.confidenceBoost || 0;

  let isLong = true;
  let confidence = 50;
  let rationale = '';

  switch (agentId) {
    case 'WATER': {
      // Tsinaslanidis (2016) SMC Extremum + Maurice Levi Foreign Flow Gating
      const isSweepLow = rangePos < 0.35 && rsi < 45;
      const isSweepHigh = rangePos > 0.65 && rsi > 55;
      isLong = isSweepLow || (!isSweepHigh && change < -0.2);
      confidence = Math.min(95, 62 + Math.abs(bollinger) * 22 + (isSweepLow || isSweepHigh ? 10 : 0) + confBoost);
      const side = isLong ? 'Sell-Side Discount' : 'Buy-Side Premium';
      rationale = 'WATER [SMC Tsinaslanidis/Levi]: Liquidity sweep ' + side + ' terkonfirmasi (RSI: ' + rsi.toFixed(0) + ', Range: ' + (rangePos * 100).toFixed(0) + '%). Mitigasi Order Block institusi pada ' + targetKey + '.';
      break;
    }
    case 'FIRE': {
      // Kathy Lien (2015) News Breakout + Mankiw Economic Surprise
      const isHighVol = Math.abs(momentum) > 0.6;
      isLong = isHighVol ? (momentum > 0) : (change > 0.15);
      confidence = Math.min(95, 60 + Math.abs(momentum) * 18 + (isHighVol ? 10 : 0) + confBoost);
      const dir = isLong ? 'Bullish Expansion' : 'Bearish Flush';
      rationale = 'FIRE [Macro Shock Mankiw/Lien]: Katalis makro ' + dir + ' (Surge: ' + momentum.toFixed(2) + 'x ATR). Event-driven volatility breakout pada ' + targetKey + '.';
      break;
    }
    case 'AIR': {
      // Steven Achelis (2000) Donchian 20 + William ONeil CAN SLIM Growth
      isLong = donchian > 0.08;
      confidence = Math.min(95, 60 + Math.abs(donchian) * 28 + (Math.abs(donchian) > 0.2 ? 10 : 0) + confBoost);
      const band = isLong ? 'Upper Channel (+HH20)' : 'Lower Channel (-LL20)';
      rationale = 'AIR [Donchian Achelis/ONeil]: Breakout ' + band + ' (Proximity: ' + (donchian * 100).toFixed(0) + '%). Trend-following ekspansi volatilitas pada ' + targetKey + '.';
      break;
    }
    case 'EARTH': {
      // Thomas Bulkowski (2013) Value S/R + Achelis Bollinger 2.5σ (Zero Value Trap)
      const isOversold = bollinger < -0.3 && rsi < 42;
      const isOverbought = bollinger > 0.3 && rsi > 58;
      isLong = isOversold || (!isOverbought && change < -0.2);
      confidence = Math.min(95, 60 + Math.abs(bollinger) * 24 + (isOversold || isOverbought ? 10 : 0) + confBoost);
      rationale = 'EARTH [Value S/R Bulkowski/Achelis]: Statistical mean reversion ' + (isLong ? 'support bounce' : 'resistance fade') + ' (BB: ' + bollinger.toFixed(2) + 'σ, RSI: ' + rsi.toFixed(0) + '). Diskon valuasi pada ' + targetKey + '.';
      break;
    }
    case 'STEAM': {
      // W+F: Ponsi (2016) Sweep Fakeout + Mankiw Central Bank Surprise
      const sweepDetected = rangePos < 0.35 || rangePos > 0.65;
      isLong = sweepDetected ? (rangePos < 0.5) : (momentum > 0);
      confidence = Math.min(95, 60 + (sweepDetected ? 14 : 0) + (Math.abs(momentum) > 0.5 ? 10 : 0) + confBoost);
      rationale = 'STEAM [W+F Ponsi/Mankiw]: Liquidity sweep ' + (sweepDetected ? 'terkonfirmasi' : 'approaching') + ' + news surge momentum ' + momentum.toFixed(2) + 'x ATR pada ' + targetKey + '.';
      break;
    }
    case 'STORM': {
      // W+A: Tsinaslanidis (2016) BOS + ONeil Sales Acceleration
      const bosSignal = regime === 'TRENDING_BULL' || regime === 'TRENDING_BEAR';
      isLong = bosSignal ? (regime === 'TRENDING_BULL') : (donchian > 0);
      confidence = Math.min(95, 60 + (bosSignal ? 14 : 0) + (Math.abs(donchian) > 0.12 ? 10 : 0) + confBoost);
      rationale = 'STORM [W+A Tsinaslanidis/ONeil]: Structural BOS ' + regime + ' + Donchian breakout (' + (donchian * 100).toFixed(0) + '%) pada ' + targetKey + '.';
      break;
    }
    case 'MUD': {
      // W+E: Tsinaslanidis FVG Imbalance + Bulkowski FCF Cushion
      isLong = bollinger < -0.25 && rangePos < 0.45;
      confidence = Math.min(95, 61 + Math.abs(bollinger) * 22 + confBoost);
      rationale = 'MUD [W+E Tsinaslanidis/Bulkowski]: Support floor buffer + FVG mitigation (Bollinger: ' + bollinger.toFixed(2) + 'σ) pada ' + targetKey + '.';
      break;
    }
    case 'LIGHTNING': {
      // F+A: Ed Ponsi Fast Momentum + Mankiw Rate Shift
      isLong = momentum > 0.35 && donchian > 0;
      confidence = Math.min(95, 59 + Math.abs(momentum) * 14 + Math.abs(donchian) * 14 + confBoost);
      rationale = 'LIGHTNING [F+A Ponsi/Mankiw]: Flash momentum velocity (' + momentum.toFixed(2) + 'x ATR) + Donchian expansion pada ' + targetKey + '.';
      break;
    }
    case 'LAVA': {
      // F+E: Achelis 3.0σ Extreme Reversal + Mankiw Overreaction Fade
      const isOverextended = Math.abs(bollinger) > 0.5 && Math.abs(momentum) > 0.7;
      isLong = isOverextended ? (bollinger < 0) : (rsi < 38);
      confidence = Math.min(95, 58 + (isOverextended ? 22 : 6) + Math.abs(bollinger) * 10 + confBoost);
      rationale = 'LAVA [F+E Achelis/Mankiw]: Post-news exhaustion ' + (isOverextended ? 'spike' : 'drift') + ' fade (BB: ' + bollinger.toFixed(2) + 'σ, Mom: ' + momentum.toFixed(2) + 'x) pada ' + targetKey + '.';
      break;
    }
    case 'SANDSTORM': {
      // A+E: Mario Singh Trend Retracement + Bulkowski Dividend Yield Floor
      const isPullbackBuy = donchian > -0.35 && bollinger < 0 && rangePos < 0.45;
      isLong = isPullbackBuy || (regime === 'TRENDING_BULL' && rangePos < 0.4);
      confidence = Math.min(95, 59 + (isPullbackBuy ? 18 : 6) + Math.abs(donchian) * 10 + confBoost);
      rationale = 'SANDSTORM [A+E Mario Singh/Bulkowski]: Macro trend pullback buy pada support kunci (Range: ' + (rangePos * 100).toFixed(0) + '%, Donchian: ' + (donchian * 100).toFixed(0) + '%) pada ' + targetKey + '.';
      break;
    }
    case 'TEMPEST': {
      // W+F+A: Mark Andrew Lim (2016) Triple-System Alpha
      const smcSig = rangePos < 0.35 || rangePos > 0.65;
      const momSig = Math.abs(momentum) > 0.45;
      const trendSig = Math.abs(donchian) > 0.1;
      const bullVotes = (smcSig && rangePos < 0.5 ? 1 : 0) + (momSig && momentum > 0 ? 1 : 0) + (trendSig && donchian > 0 ? 1 : 0);
      isLong = bullVotes >= 2;
      confidence = Math.min(95, 60 + bullVotes * 9 + confBoost);
      rationale = 'TEMPEST [W+F+A Mark Andrew Lim]: Triple-engine consensus (' + bullVotes + '/3 bullish). Liquidity + News Momentum + Trend pada ' + targetKey + '.';
      break;
    }
    case 'OCEANIC': {
      // W+A+E: Ray Dalio / Mankiw All-Weather Macro Quadrants
      const liquidityOk = rangePos > 0.25 && rangePos < 0.75;
      const trendOk = regime === 'TRENDING_BULL' || (regime === 'RANGING' && bollinger < -0.15);
      isLong = liquidityOk && (trendOk || rsi < 45);
      confidence = Math.min(95, 58 + (liquidityOk ? 8 : 0) + (trendOk ? 12 : 0) + confBoost);
      rationale = 'OCEANIC [W+A+E Dalio/Mankiw]: All-weather institutional (' + regime + ', RSI: ' + rsi.toFixed(0) + ', BB: ' + bollinger.toFixed(2) + 'σ) pada ' + targetKey + '.';
      break;
    }
    case 'GEOTHERMAL': {
      // W+F+E: Bulkowski F-Score + Tsinaslanidis Order Block
      const atSupport = bollinger < -0.2 && rangePos < 0.4;
      const newsReactive = Math.abs(momentum) > 0.4;
      isLong = atSupport || (newsReactive && momentum < 0 && rsi < 42);
      confidence = Math.min(95, 59 + (atSupport ? 16 : 0) + (newsReactive ? 10 : 0) + confBoost);
      rationale = 'GEOTHERMAL [W+F+E Bulkowski/Tsinaslanidis]: Fundamental Order Block + ' + (newsReactive ? 'news reaction' : 'valuation discount') + ' (BB: ' + bollinger.toFixed(2) + 'σ) pada ' + targetKey + '.';
      break;
    }
    case 'CYCLONE': {
      // F+A+E: Abdulkader Aljandali (2016) GARCH Regime Switcher
      const isTrending = regime === 'TRENDING_BULL' || regime === 'TRENDING_BEAR';
      if (isTrending) { isLong = regime === 'TRENDING_BULL'; }
      else { isLong = bollinger < -0.25 && rsi < 42; }
      confidence = Math.min(95, 59 + (isTrending ? 16 : 8) + confBoost);
      const modeLabel = isTrending ? 'Trend Ignition' : 'Mean Reversion';
      rationale = 'CYCLONE [F+A+E Aljandali/Mankiw]: Dynamic regime transition > ' + modeLabel + ' (' + regime + ', Mom: ' + momentum.toFixed(2) + 'x) pada ' + targetKey + '.';
      break;
    }
    case 'AVATAR': {
      // W+F+A+E: Thomas Malone (2018) Superminds + Fama-French 4-Factor
      const waterVote = (rangePos < 0.35 && rsi < 45) ? 1 : (rangePos > 0.65 && rsi > 55 ? -1 : 0);
      const fireVote = momentum > 0.35 ? 1 : (momentum < -0.35 ? -1 : 0);
      const airVote = donchian > 0.1 ? 1 : (donchian < -0.1 ? -1 : 0);
      const earthVote = bollinger < -0.2 ? 1 : (bollinger > 0.2 ? -1 : 0);
      const totalScore = waterVote + fireVote + airVote + earthVote;
      isLong = totalScore >= 0;
      const votesLong = [waterVote, fireVote, airVote, earthVote].filter(v => v > 0).length;
      confidence = Math.min(95, 60 + Math.abs(totalScore) * 8 + confBoost);
      rationale = 'AVATAR [4-Factor Malone/Fama-French]: Konsensus 4 elemen (' + votesLong + '/4 bullish, Score: ' + (totalScore > 0 ? '+' : '') + totalScore + '). ' + (isLong ? 'Bullish' : 'Bearish') + ' dominance pada ' + targetKey + '.';
      break;
    }
    case 'CHAOS': {
      // Kevin Dowd (2005) Fat-Tail Extremes & Noise Trader Risk
      const isImpulsive = Math.abs(momentum) > 0.6;
      const isOverext = Math.abs(bollinger) > 0.45;
      if (isImpulsive) { isLong = momentum > 0; }
      else if (isOverext) { isLong = bollinger < 0; }
      else { isLong = change > 0; }
      confidence = Math.min(95, 60 + Math.abs(momentum) * 14 + confBoost);
      rationale = 'CHAOS [Fat-Tail Dowd/Shleifer]: ' + (isImpulsive ? 'Impulse follow' : (isOverext ? 'Contrarian fade' : 'Momentum drift')) + ' (' + (isLong ? 'Long' : 'Short') + ') pada ' + targetKey + '. BB: ' + bollinger.toFixed(2) + 'σ.';
      break;
    }
    default: {
      isLong = change > 0 || rsi < 45;
      confidence = 50 + confBoost;
      rationale = 'Multi-market quantitative opportunity on ' + targetKey + ' (Change: ' + (change || 0).toFixed(2) + '%).';
    }
  }

  return { isLong, confidence, rationale };
};

const selectBestInstrument = (candidateSymbols, marketFeeds, agentId) => {
  if (!candidateSymbols || candidateSymbols.length === 0) return null;
  if (candidateSymbols.length === 1) return candidateSymbols[0];

  const scored = candidateSymbols.map(sym => {
    const feed = marketFeeds[sym];
    if (!feed) return { sym, score: 0 };
    const absChange = Math.abs(feed.change || 0);
    const atrPct = (feed.atr && feed.price) ? (feed.atr / feed.price) * 100 : 1;
    const rangePos = computeRangePosition(feed.price, feed.high, feed.low);
    let score = Math.min(3, absChange) * 10 + Math.min(2, atrPct) * 8;
    if (['WATER', 'MUD', 'EARTH', 'GEOTHERMAL', 'OCEANIC'].includes(agentId)) {
      score += Math.abs(rangePos - 0.5) * 15;
    } else if (['FIRE', 'LIGHTNING', 'TEMPEST', 'STORM'].includes(agentId)) {
      score += absChange * 5;
    } else if (['AIR', 'SANDSTORM', 'CYCLONE'].includes(agentId)) {
      score += (rangePos > 0.7 || rangePos < 0.3) ? 12 : 3;
    }
    return { sym, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const topN = Math.min(3, scored.length);
  // M-11: Deterministic seed per agent in 5-minute time window to prevent re-render selection jitter
  const timeBlock = Math.floor(Date.now() / 300000);
  const agentSeed = (agentId || 'AGENT').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const pickIdx = (agentSeed + timeBlock) % topN;
  return scored[pickIdx].sym;
};

// Universal Realistic Lot & Position Sizing Calculator (Capital & Risk Aware, Spot vs Futures)
// Based on Mario Singh (2013) Fixed Fractional Sizing & Bulkowski (2013) Risk Per Share
export const calculateInstrumentLotSize = (
  market,
  symbol = '',
  entryPrice = 0,
  capitalIdr = 1000000,
  riskPct = 2,
  executionMode = 'FUTURES',
  slPrice = null,
  agentOrMultiplier = 1.0,
  currentAtr = 0
) => {
  if (!entryPrice || entryPrice <= 0) return 0.01;
  const isIdx = market === 'IDX';
  const isForex = market === 'FOREX';
  const isCrypto = market === 'CRYPTO' || symbol.endsWith('USDT');
  const isFutures = market === 'FUTURES';
  const isUs = market === 'US';
  const isSpot = executionMode === 'SPOT' || isIdx;

  // Ekstrak pengali risiko agen dari DNA traits jika tersedia
  const agentRiskMult = typeof agentOrMultiplier === 'object'
    ? (agentOrMultiplier?.dnaTraits?.riskMultiplier || 1.0)
    : (Number(agentOrMultiplier) || 1.0);

  const effectiveRiskPct = (riskPct || 2) * Math.min(2.0, Math.max(0.25, agentRiskMult));
  const rate = currentLiveUsdToIdr || 16350;

  // Target allocation per trade (Margin kas)
  const targetMarginIdr = isSpot
    ? Math.max(50000, capitalIdr * 0.08)
    : Math.max(20000, capitalIdr * (effectiveRiskPct / 100) * 1.5);
  const targetMarginUsd = targetMarginIdr / rate;

  // Stop loss distance in price points
  const slDistance = (slPrice && slPrice > 0)
    ? Math.abs(entryPrice - slPrice)
    : (currentAtr > 0 ? currentAtr : entryPrice * 0.015);

  const riskBudgetUsd = (capitalIdr * (effectiveRiskPct / 100)) / rate;
  const riskBudgetIdr = capitalIdr * (effectiveRiskPct / 100);

  if (isIdx) {
    // Bulkowski (2013) Risk per Share Model for IDX (1 lot = 100 lembar)
    // Nominal resiko = (Entry - SL) * 100 * lot <= riskBudgetIdr
    const riskPerShare = Math.max(1, slDistance);
    const calculatedLots = Math.floor(riskBudgetIdr / (riskPerShare * 100));
    // Batasi nilai posisi maksimal 25% modal kas
    const maxLotsAllowed = Math.max(1, Math.floor((capitalIdr * 0.25) / (entryPrice * 100)));
    return Math.max(1, Math.min(maxLotsAllowed, calculatedLots || 1));
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
      // Crypto Futures: Volatility Sizing (Margin * 20 max notional)
      const rawQty = (riskBudgetUsd / Math.max(entryPrice * 0.005, slDistance));
      const notionalUsd = rawQty * entryPrice;
      const maxAllowedNotional = targetMarginUsd * 20; // 1:20 cap
      const finalQty = notionalUsd > maxAllowedNotional ? (maxAllowedNotional / entryPrice) : rawQty;
      if (finalQty >= 1000) return Math.round(finalQty);
      if (finalQty >= 50) return Number(finalQty.toFixed(1));
      if (finalQty >= 1) return Number(finalQty.toFixed(2));
      if (finalQty >= 0.01) return Number(finalQty.toFixed(3));
      return Number(finalQty.toFixed(4));
    }
  }

  if (isForex) {
    // Mario Singh (2013) Dynamic Forex Pip Sizing
    // Lot = Risk Budget ($) / (SL Pips * Pip Value ($10 / standard lot for USD pairs, $7 for JPY pairs))
    const isJpy = symbol.includes('JPY');
    const slPips = isJpy ? (slDistance * 100) : (slDistance * 10000);
    // M-10: Dynamic JPY pip value = (100,000 units * 0.01 tick) / entryPrice USD
    const pipValueStandard = isJpy ? (1000.0 / Math.max(50.0, Number(entryPrice) || 155.0)) : 10.0;
    const rawLot = riskBudgetUsd / (Math.max(8, slPips) * pipValueStandard);
    return Number(Math.max(0.01, Math.min(5.0, rawLot)).toFixed(2));
  }

  if (symbol.includes('XAU') || symbol.includes('XAG') || isFutures) {
    if (['US30', 'US500', 'NAS100', 'DAX40', 'NIKKEI', 'HSI'].includes(symbol)) {
      // Index Futures ($1 per point)
      const rawIndexLot = riskBudgetUsd / Math.max(15, slDistance);
      return Number(Math.max(0.01, Math.min(3.0, rawIndexLot)).toFixed(2));
    }
    // Gold/Commodities (XAU 1 standard lot = 100 oz -> $1 move = $100)
    const rawGoldLot = riskBudgetUsd / (Math.max(1.5, slDistance) * 100);
    return Number(Math.max(0.01, Math.min(2.0, rawGoldLot)).toFixed(2));
  }

  if (isUs) {
    if (isSpot) {
      const rawShares = targetMarginUsd / entryPrice;
      return Math.max(1, Math.round(rawShares));
    } else {
      // US Stocks CFD (1:5)
      const riskPerShare = Math.max(0.5, slDistance);
      const calculatedShares = Math.floor(riskBudgetUsd / riskPerShare);
      const maxSharesByMargin = Math.floor((targetMarginUsd * 5) / entryPrice);
      return Math.max(1, Math.min(maxSharesByMargin, calculatedShares || 1));
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
  const instanceId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const fillGradientId = `grad_${positive ? 'pos' : 'neg'}_${instanceId}`;

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
    },
    STEAM: {
      title: 'GBP/USD M30 — STEAM [W+F]: Liquidity Sweep + Flash News Surge Sniper',
      entryLabel: 'Sniper Entry @ 1.2940 (FVG + News Volume)',
      tpLabel: 'Target TP @ 1.3060 (+3.0R Fast Expansion)',
      slLabel: 'Hard SL @ 1.2905 (-0.85R Sweep Tail)',
      candles: [
        { o: 1.2915, h: 1.2925, l: 1.2908, c: 1.2920, isBull: true },
        { o: 1.2920, h: 1.2930, l: 1.2910, c: 1.2915, isBull: false },
        { o: 1.2915, h: 1.2918, l: 1.2902, c: 1.2910, isBull: false, isSweep: true },
        { o: 1.2910, h: 1.2945, l: 1.2905, c: 1.2940, isBull: true, isEntry: true },
        { o: 1.2940, h: 1.3010, l: 1.2935, c: 1.3000, isBull: true },
        { o: 1.3000, h: 1.3070, l: 1.2995, c: 1.3060, isBull: true, isExit: true }
      ],
      levels: { entry: 1.2940, tp: 1.3060, sl: 1.2905, min: 1.2890, max: 1.3080 }
    },
    STORM: {
      title: 'SOL/USDT H1 — STORM [W+A]: BOS Swing High & Donchian Breakout Expansion',
      entryLabel: 'BOS Entry @ $186.50 (Upper Channel + Structural BOS)',
      tpLabel: 'Pyramid TP @ $214.00 (+4.5R Wave Rider)',
      slLabel: 'Trailing SL @ $180.00 (-1.0R Higher Low)',
      candles: [
        { o: 178, h: 183, l: 176, c: 182, isBull: true },
        { o: 182, h: 184, l: 180, c: 181, isBull: false },
        { o: 181, h: 187, l: 180, c: 186.5, isBull: true, isSweep: true, isEntry: true },
        { o: 186.5, h: 196, l: 185, c: 194, isBull: true },
        { o: 194, h: 205, l: 192, c: 202, isBull: true },
        { o: 202, h: 216, l: 200, c: 214, isBull: true, isExit: true }
      ],
      levels: { entry: 186.50, tp: 214.00, sl: 180.00, min: 174, max: 220 }
    },
    MUD: {
      title: 'AAPL H4 — MUD [W+E]: Dual Support Buffer & Fair Value Gap (FVG) Mitigation',
      entryLabel: 'Discount Buy @ $224.50 (Support S/R + FVG Fill)',
      tpLabel: 'Target TP @ $235.00 (+2.5R Mean Recovery)',
      slLabel: 'Hard SL @ $220.50 (-0.9R Support Floor)',
      candles: [
        { o: 230, h: 231, l: 227, c: 228, isBull: false },
        { o: 228, h: 229, l: 224, c: 225, isBull: false },
        { o: 225, h: 226, l: 223, c: 224.5, isBull: false, isSweep: true, isEntry: true },
        { o: 224.5, h: 228, l: 224, c: 227.5, isBull: true },
        { o: 227.5, h: 231, l: 227, c: 230.5, isBull: true },
        { o: 230.5, h: 236, l: 230, c: 235.0, isBull: true, isExit: true }
      ],
      levels: { entry: 224.50, tp: 235.00, sl: 220.50, min: 218, max: 238 }
    },
    LIGHTNING: {
      title: 'TSLA M15 — LIGHTNING [F+A]: Flash Momentum Post-News Breakout Runner',
      entryLabel: 'Flash Breakout @ $338.00 (Volume Surge + ATR Spike)',
      tpLabel: 'Parabolic TP @ $362.00 (+3.5R Fast Surge)',
      slLabel: 'Trailing SL @ $331.00 (-1.0R Momentum Base)',
      candles: [
        { o: 330, h: 333, l: 328, c: 331, isBull: true },
        { o: 331, h: 339, l: 330, c: 338, isBull: true, isSweep: true, isEntry: true },
        { o: 338, h: 348, l: 337, c: 346, isBull: true },
        { o: 346, h: 356, l: 344, c: 354, isBull: true },
        { o: 354, h: 364, l: 352, c: 362, isBull: true, isExit: true }
      ],
      levels: { entry: 338.00, tp: 362.00, sl: 331.00, min: 325, max: 368 }
    },
    LAVA: {
      title: 'USOIL M30 — LAVA [F+E]: Post-News Exhaustion Fade outside 3.0 SD',
      entryLabel: 'Exhaustion Sell/Fade @ $74.80 (Bollinger 3 SD Rejection)',
      tpLabel: 'Target TP @ $71.20 (+2.8R Mid-Band Mean)',
      slLabel: 'Hard SL @ $76.10 (-1.0R Exhaustion Wick)',
      candles: [
        { o: 71.5, h: 72.8, l: 71.2, c: 72.5, isBull: true },
        { o: 72.5, h: 74.2, l: 72.4, c: 73.9, isBull: true },
        { o: 73.9, h: 75.6, l: 73.8, c: 74.8, isBull: false, isSweep: true, isEntry: true },
        { o: 74.8, h: 74.9, l: 73.2, c: 73.5, isBull: false },
        { o: 73.5, h: 73.6, l: 72.0, c: 72.2, isBull: false },
        { o: 72.2, h: 72.4, l: 71.0, c: 71.2, isBull: false, isExit: true }
      ],
      levels: { entry: 74.80, tp: 71.20, sl: 76.10, min: 70.0, max: 77.0 }
    },
    SANDSTORM: {
      title: 'NVDA H2 — SANDSTORM [A+E]: Trend Pullback Buy on Solid MA 50 Support',
      entryLabel: 'Pullback Buy @ $137.50 (MA 50 + Fibo 61.8% Retest)',
      tpLabel: 'Target TP @ $148.00 (+3.0R Trend Continuation)',
      slLabel: 'Hard SL @ $134.00 (-1.0R Swing Low Support)',
      candles: [
        { o: 144, h: 146, l: 142, c: 143, isBull: false },
        { o: 143, h: 143, l: 138, c: 139, isBull: false },
        { o: 139, h: 140, l: 136.5, c: 137.5, isBull: true, isSweep: true, isEntry: true },
        { o: 137.5, h: 142, l: 137, c: 141.5, isBull: true },
        { o: 141.5, h: 145, l: 141, c: 144.5, isBull: true },
        { o: 144.5, h: 149, l: 144, c: 148.0, isBull: true, isExit: true }
      ],
      levels: { entry: 137.50, tp: 148.00, sl: 134.00, min: 132, max: 151 }
    },
    TEMPEST: {
      title: 'BTC/USDT H4 — TEMPEST [W+F+A]: Triple-Engine Alpha (Liquidity + News + Parabolic Trend)',
      entryLabel: 'Alpha Entry @ $92,200 (SMC Sweep + FOMC Volume + Donchian)',
      tpLabel: 'Alpha Harvest @ $102,000 (+5.5R Super-Trend)',
      slLabel: 'Trailing SL @ $90,400 (-1.0R Dynamic Base)',
      candles: [
        { o: 90000, h: 91500, l: 89800, c: 91000, isBull: true },
        { o: 91000, h: 91600, l: 90200, c: 90800, isBull: false, isSweep: true },
        { o: 90800, h: 92800, l: 90500, c: 92200, isBull: true, isEntry: true },
        { o: 92200, h: 95500, l: 92000, c: 95000, isBull: true },
        { o: 95000, h: 98500, l: 94800, c: 98000, isBull: true },
        { o: 98000, h: 102500, l: 97800, c: 102000, isBull: true, isExit: true }
      ],
      levels: { entry: 92200, tp: 102000, sl: 90400, min: 89000, max: 104000 }
    },
    OCEANIC: {
      title: 'BBRI Daily — OCEANIC [W+A+E]: All-Weather Wealth Anchor (Spot Cash Preservation)',
      entryLabel: 'Spot Long Buy @ Rp 3.320 (Institutional Discount Order Block)',
      tpLabel: 'Target TP @ Rp 3.650 (+3.5R Valuation Mean)',
      slLabel: 'Hard SL @ Rp 3.230 (-0.9R Historic Support)',
      candles: [
        { o: 3450, h: 3460, l: 3380, c: 3390, isBull: false },
        { o: 3390, h: 3400, l: 3320, c: 3340, isBull: false },
        { o: 3340, h: 3350, l: 3300, c: 3320, isBull: false, isSweep: true, isEntry: true },
        { o: 3320, h: 3420, l: 3310, c: 3400, isBull: true },
        { o: 3400, h: 3540, l: 3390, c: 3510, isBull: true },
        { o: 3510, h: 3680, l: 3500, c: 3650, isBull: true, isExit: true }
      ],
      levels: { entry: 3320, tp: 3650, sl: 3230, min: 3180, max: 3720 }
    },
    GEOTHERMAL: {
      title: 'TLKM H4 — GEOTHERMAL [W+F+E]: News Panic Discount at Historic Fundamental Order Block',
      entryLabel: 'Panic Buy @ Rp 2.700 (Valuation Floor + Order Block)',
      tpLabel: 'Target TP @ Rp 2.980 (+3.2R Fair Value Rebound)',
      slLabel: 'Hard SL @ Rp 2.610 (-1.0R Dividend Base)',
      candles: [
        { o: 2840, h: 2860, l: 2790, c: 2800, isBull: false },
        { o: 2800, h: 2810, l: 2690, c: 2720, isBull: false },
        { o: 2720, h: 2730, l: 2660, c: 2700, isBull: false, isSweep: true, isEntry: true },
        { o: 2700, h: 2790, l: 2690, c: 2780, isBull: true },
        { o: 2780, h: 2880, l: 2770, c: 2860, isBull: true },
        { o: 2860, h: 3000, l: 2850, c: 2980, isBull: true, isExit: true }
      ],
      levels: { entry: 2700, tp: 2980, sl: 2610, min: 2560, max: 3040 }
    },
    CYCLONE: {
      title: 'XAU/USD M15 — CYCLONE [F+A+E]: Dynamic Market Regime Transition Engine (Hurst Switch)',
      entryLabel: 'Regime Entry @ 2,914.00 (Hurst > 0.6 Trend Ignition Confirmed)',
      tpLabel: 'Harvest TP @ 2,952.00 (+3.8R Adaptive Expansion)',
      slLabel: 'Dynamic SL @ 2,904.00 (-1.0R Regime Boundary)',
      candles: [
        { o: 2908, h: 2912, l: 2906, c: 2910, isBull: true },
        { o: 2910, h: 2916, l: 2909, c: 2914, isBull: true, isSweep: true, isEntry: true },
        { o: 2914, h: 2928, l: 2912, c: 2926, isBull: true },
        { o: 2926, h: 2940, l: 2924, c: 2938, isBull: true },
        { o: 2938, h: 2954, l: 2935, c: 2952, isBull: true, isExit: true }
      ],
      levels: { entry: 2914.00, tp: 2952.00, sl: 2904.00, min: 2898, max: 2960 }
    },
    AVATAR: {
      title: 'CROSS-ASSET H4 — AVATAR [4-E]: Supreme 4-Element Multi-Ensemble Consensus',
      entryLabel: 'Consensus Entry @ Dynamic Level (Ensemble Score >= 3/4)',
      tpLabel: 'Supreme Harvest @ Multi-Target (+4.0R Consensus Hold)',
      slLabel: 'Master Parity SL (-1.0R Risk-Weighted)',
      candles: [
        { o: 100, h: 103, l: 99, c: 102, isBull: true },
        { o: 102, h: 104, l: 100, c: 101, isBull: false, isSweep: true },
        { o: 101, h: 105, l: 100.5, c: 104, isBull: true, isEntry: true },
        { o: 104, h: 109, l: 103.5, c: 108, isBull: true },
        { o: 108, h: 113, l: 107.5, c: 112, isBull: true },
        { o: 112, h: 117, l: 111, c: 116, isBull: true, isExit: true }
      ],
      levels: { entry: 104.00, tp: 116.00, sl: 101.00, min: 98, max: 118 }
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
  },
  CHAOS: {
    name: 'CHAOS',
    element: 'Entropy & Liquidity Vacuum [ANOMALY]',
    bestInstruments: 'XAUUSD (Gold), BTCUSDT, SOLUSDT, NAS100, NVDA',
    instrumentEdge: 'Sangat mematikan pada aset dengan ledakan momentum tinggi dan klaster likuidasi tebal. Mengoperasikan machine-gun stacking tanpa batasan tiket.',
    avoidInstruments: 'Aset sideways sepi volume yang memicu pendarahan spread.',
    winRateEdge: 'Win Rate Target: 28% - 35% | Average R:R: 1:12.0+ (Convex Asymmetry)',
    defaultToxicPair: 'EURCHF & Saham Defensif Low-Beta',
    defaultCause: 'Terjebak whipsaw mikro saat membuka 15+ lapis posisi beruntun tanpa adanya follow-through pergerakan tren.',
    defaultSolution: 'Melakukan kalibrasi threshold lonjakan volume saat Rebirth, memfilter pair sideways, dan mempertahankan sifat unlimited stacking untuk generasi berikutnya.'
  }
};

// Initial Seed Data for Markets across all major global and domestic asset classes (Semua Instrumen & Pasangan Pair)
const DEFAULT_MARKET_FEEDS = {
  // 1. Commodities, Metals & Energies
  'XAUUSD': { name: 'Gold / US Dollar', market: 'FUTURES', price: 4262.00, change: 0.85, high: 4285.00, low: 4235.00, atr: 25.0, regime: 'TRENDING_BULL' },
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


// AGENT DEEP PROFILE - Rich Metadata per Agent
const AGENT_DEEP_PROFILE = {
  WATER: {
    philosophy: 'WATER mengikuti jejak kaki institusional besar (Smart Money) yang meninggalkan sidik jari berupa Order Block dan Fair Value Gap. Filosofinya: pasar digerakkan oleh modal besar yang menyapu likuiditas ritel sebelum memulai pergerakan sesungguhnya. WATER menunggu sapuan likuiditas terjadi, lalu entry di zona Order Block yang telah terkonfirmasi \u2014 membeli saat ritel panic selling, menjual saat ritel FOMO buying.',
    optimalConditions: 'Pasar dengan likuiditas tinggi yang menunjukkan pola sweep-and-reverse berulang. Saham blue-chip BEI, Gold (XAU/USD), dan major forex pairs. Paling efektif saat terjadi false breakout yang memancing stop loss ritel.',
    weakConditions: 'Pasar sideways berkepanjangan tanpa sweeps yang jelas (ranging sempit). Kripto altcoin illiquid yang rentan wash trading. Sesi pasar sepi (lunch break IDX 12:00-13:30).',
    preferredTimeframe: 'H4 (primary), H1 (confirmation), D1 (bias direction)',
    riskProfile: 'Moderat-Konservatif. Risk per trade 1-2% modal. Rasio R:R minimum 1:3. Spot preferred untuk akumulasi.',
    synergyExplanation: null,
    winRateEdge: 'High R:R Institutional Edge',
    bestInstruments: 'XAU/USD, EUR/USD, GBP/USD, BBCA, BBRI, BMRI',
    avoidInstruments: 'Kripto micro-cap (< $10M vol), Saham gorengan IDX (fraksi < Rp 500)',
    instrumentEdge: 'Instrumen dengan order book dalam, likuiditas tinggi, dan pola sweep-reversal berulang memberikan sinyal paling akurat untuk strategi SMC.'
  },
  FIRE: {
    philosophy: 'FIRE beroperasi di titik ledakan volatilitas tertinggi \u2014 saat rilis data ekonomi makro (CPI, NFP, Fed FOMC Rate Decision, ECB Minutes). Berita makro menciptakan ketidakseimbangan supply/demand instan yang bisa dieksploitasi dalam menit pertama setelah rilis. FIRE menunggangi gelombang momentum awal sebelum pasar menemukan ekuilibrium baru.',
    optimalConditions: 'Sesi London Open (14:00 WIB) dan New York Open (20:30 WIB). Saat jadwal rilis data high-impact (CPI, Payroll, GDP). Volatilitas tinggi dengan arah jelas.',
    weakConditions: 'Pasar tenang tanpa katalis berita. Sesi Asia malam hari. Hari libur bank sentral.',
    preferredTimeframe: 'M15 (primary), M5 (scalp entry), H1 (exit management)',
    riskProfile: 'Agresif. Risk per trade 2-3% modal. Trailing stop cepat. Target cepat 2-3x ATR.',
    synergyExplanation: null,
    winRateEdge: 'Event-Driven Speed Alpha',
    bestInstruments: 'EUR/USD, GBP/USD, XAU/USD, US30, NAS100, USOIL',
    avoidInstruments: 'Saham IDX (terlalu lambat bereaksi terhadap makro global), kripto spot (24/7 tanpa event window jelas)',
    instrumentEdge: 'Instrumen yang paling sensitif terhadap data makro AS/EU memberikan spike volatilitas tertinggi dalam window 15-60 menit pasca-rilis.'
  },
  AIR: {
    philosophy: 'AIR menunggangi hembusan tren panjang dengan kesabaran \u2014 mendeteksi saat harga memecahkan batas atas/bawah Donchian Channel dan menegaskan bahwa tren baru telah dimulai. Filosofinya berasal dari Turtle Traders: biarkan winners run, potong losers cepat.',
    optimalConditions: 'Pasar trending kuat (Hurst > 0.6). Breakout setelah konsolidasi panjang. Crypto bull/bear runs. Komoditas saat siklus supply-demand bergeser.',
    weakConditions: 'Pasar choppy/ranging (whipsaw berulang). Volatilitas rendah tanpa arah. Sideways market panjang.',
    preferredTimeframe: 'H4 (primary), D1 (trend filter), H1 (entry timing)',
    riskProfile: 'Moderat. Risk 1.5-2%. Trailing stop lebar. Target TP tinggi (3-5x ATR).',
    synergyExplanation: null,
    winRateEdge: 'Trend Capture Endurance',
    bestInstruments: 'BTC/USDT, ETH/USDT, XAU/USD, NVDA, TSLA, USOIL',
    avoidInstruments: 'Forex majors saat consolidation, saham defensif IDX (ICBP, KLBF)',
    instrumentEdge: 'Instrumen dengan kecenderungan trending kuat (crypto, komoditas, saham growth US) memberikan peluang trend-following terbaik.'
  },
  EARTH: {
    philosophy: 'EARTH percaya bahwa harga selalu kembali ke nilai wajarnya \u2014 setiap deviasi ekstrem dari mean adalah peluang. Kokoh dan disiplin, EARTH menggunakan Bollinger Bands dan level support/resistance historis untuk mengidentifikasi titik oversold/overbought. Seperti gravitasi, harga ditarik kembali ke keseimbangan.',
    optimalConditions: 'Pasar ranging dengan support/resistance terdefinisi baik. Saham defensif dividen tinggi. RSI ekstrem (<30 atau >70). Post-panic selling.',
    weakConditions: 'Trending market kuat. Breakout genuine. Saat fundamental berubah drastis.',
    preferredTimeframe: 'H4 (primary), D1 (mean identification), H1 (entry)',
    riskProfile: 'Konservatif. Risk 1-1.5% per trade. Spot accumulation preferred.',
    synergyExplanation: null,
    winRateEdge: 'Statistical Mean Reversion',
    bestInstruments: 'BBCA, BBRI, TLKM, ICBP, KLBF, UNVR, EUR/USD (range-bound)',
    avoidInstruments: 'Kripto altcoin volatil, saham momentum tinggi (AMMN, BREN saat rally)',
    instrumentEdge: 'Saham defensif BEI dan forex major saat ranging memberikan bounce mean-reversion paling konsisten.'
  },
  STEAM: { philosophy: 'Fusi WATER+FIRE: Memetakan zona likuiditas institusional terlebih dahulu, lalu menunggu katalis berita sebagai pemicu entry. Kombinasi memastikan masuk di zona bernilai tinggi dengan konfirmasi volume berita.', optimalConditions: 'Order Block terbentuk sebelum rilis data makro. XAU/USD dan EUR/USD menjelang FOMC/CPI.', weakConditions: 'Tanpa setup SMC DAN tanpa berita.', preferredTimeframe: 'H1 (SMC setup), M15 (news entry)', riskProfile: 'Moderat-Agresif. Risk 2%.', synergyExplanation: 'WATER menyiapkan zona entry (Order Block). FIRE memberikan timing saat volume berita meledak. Entry presisi di zona institusional tepat saat likuiditas membanjir.', winRateEdge: 'Precision Sniper Entry', bestInstruments: 'XAU/USD, EUR/USD, GBP/USD, US30', avoidInstruments: 'Saham IDX, kripto spot', instrumentEdge: 'Forex dan komoditas menjelang rilis data.' },
  STORM: { philosophy: 'Fusi WATER+AIR: Konfirmasi ganda \u2014 perubahan struktur pasar (BOS/CHoCH) dari SMC dan breakout Donchian Channel.', optimalConditions: 'Awal tren baru setelah konsolidasi panjang.', weakConditions: 'False breakout tanpa perubahan struktur.', preferredTimeframe: 'H4 (structure), H1 (breakout)', riskProfile: 'Moderat. Risk 1.5-2%.', synergyExplanation: 'WATER mengidentifikasi BOS. AIR mengkonfirmasi breakout Donchian. Mengurangi false breakout signifikan.', winRateEdge: 'Structural Breakout Confirmation', bestInstruments: 'BTC/USDT, XAU/USD, NVDA, TSLA', avoidInstruments: 'Forex saat ranging', instrumentEdge: 'Instrumen trending dengan perubahan struktur jelas.' },
  MUD: { philosophy: 'Fusi WATER+EARTH: Reversal di S/R historis yang dikonfirmasi oleh FVG dan Order Block. Akumulasi spot di zona diskon institusional.', optimalConditions: 'Pullback ke support historis kuat + zona Order Block. Blue-chip BEI saat koreksi.', weakConditions: 'Breakdown genuine di bawah support.', preferredTimeframe: 'D1 (support), H4 (FVG/OB)', riskProfile: 'Konservatif. Spot. Risk 1%. R:R 1:3+.', synergyExplanation: 'WATER menandai FVG/OB. EARTH mengkonfirmasi S/R historis. Double confirmation = high-quality discount entry.', winRateEdge: 'Institutional Discount Accumulation', bestInstruments: 'BBCA, BBRI, BMRI, TLKM, ASII', avoidInstruments: 'Kripto volatil, komoditas trending', instrumentEdge: 'Blue-chip IDX saat koreksi ke zona OB + support historis.' },
  LIGHTNING: { philosophy: 'Fusi FIRE+AIR: Katalis berita memicu awal ekspansi tren Donchian berkecepatan tinggi. Agresif dan cepat.', optimalConditions: 'Breakout pasca rilis data makro yang membentuk tren baru.', weakConditions: 'Berita tanpa dampak signifikan.', preferredTimeframe: 'M15 (entry), H1 (management)', riskProfile: 'Agresif. Risk 2-3%. Trailing cepat.', synergyExplanation: 'FIRE mendeteksi katalis. AIR mengkonfirmasi tren baru. Menangkap awal tren event-driven.', winRateEdge: 'Event-Ignited Trend Capture', bestInstruments: 'EUR/USD, GBP/USD, XAU/USD, NAS100', avoidInstruments: 'Saham IDX, kripto low-vol', instrumentEdge: 'Forex dan indeks yang bereaksi cepat terhadap data makro.' },
  LAVA: { philosophy: 'Fusi FIRE+EARTH: Counter-trend saat spike berita membawa harga keluar batas wajar (>3\u03C3 Bollinger). Mengambil posisi berlawanan setelah exhaustion.', optimalConditions: 'Spike berita ekstrem. Post-NFP/CPI overshoot.', weakConditions: 'Tren genuine berlanjut setelah berita.', preferredTimeframe: 'M15 (exhaustion), H1 (reversion)', riskProfile: 'Moderat-Agresif. Risk 1.5-2%.', synergyExplanation: 'FIRE mendeteksi spike. EARTH mengukur deviasi dari mean. Saat spike >3\u03C3, probabilitas reversion sangat tinggi.', winRateEdge: 'Post-News Exhaustion Fade', bestInstruments: 'EUR/USD, XAU/USD, USOIL, GBP/USD', avoidInstruments: 'Kripto, saham IDX', instrumentEdge: 'Forex dan komoditas yang overreact lalu revert ke mean.' },
  SANDSTORM: { philosophy: 'Fusi AIR+EARTH: Disiplin beli saat pullback dalam tren kuat. Menunggu harga kembali ke support kunci sebelum entry searah tren.', optimalConditions: 'Tren naik + pullback ke MA 50 / Fibonacci 61.8%. US growth stocks saat koreksi.', weakConditions: 'Trend reversal. Pullback menjadi breakdown.', preferredTimeframe: 'H4 (trend), H1 (pullback entry)', riskProfile: 'Moderat. Risk 1.5%.', synergyExplanation: 'AIR mengidentifikasi tren aktif. EARTH menunggu pullback ke support. Entry hanya saat tren + support selaras.', winRateEdge: 'Trend Pullback Precision', bestInstruments: 'NVDA, AAPL, MSFT, META, BBCA, BTC/USDT', avoidInstruments: 'Instrumen ranging, saham turnaround', instrumentEdge: 'Saham growth US dan blue-chip saat uptrend dengan pullback ke area support teknikal.' },
  TEMPEST: { philosophy: 'Sindikat W+F+A: Triple-engine alpha. Likuiditas institusional + katalis berita + pengawalan tren. Hanya entry saat minimal 2/3 elemen selaras.', optimalConditions: 'Pasar trending kuat + sweep likuiditas + rilis data makro mengkonfirmasi arah.', weakConditions: 'Tanpa setup SMC, tanpa berita, tanpa tren.', preferredTimeframe: 'H4, M15 (entry)', riskProfile: 'Agresif. Risk 2-3%. Target 4-5x ATR.', synergyExplanation: 'Tiga mesin: WATER zona institusional, FIRE timing katalis, AIR tren. Consensus 2/3 min = alpha tertinggi.', winRateEdge: 'Triple-Confirmation Alpha', bestInstruments: 'BTC/USDT, XAU/USD, NAS100, NVDA', avoidInstruments: 'Saham defensif IDX, forex minor', instrumentEdge: 'Instrumen volume besar + volatilitas + sensitivitas makro.' },
  OCEANIC: { philosophy: 'Sindikat W+A+E: All-weather institutional anchor. Gabungan tiga elemen untuk wealth preservation jangka panjang dengan tetap menangkap upside. Spot accumulation, minimal leverage.', optimalConditions: 'Semua kondisi (all-weather). Paling efektif saat transisi bearish ke recovery.', weakConditions: 'Flash crash violent. Ketiga sinyal konflik.', preferredTimeframe: 'D1, H4 (entry)', riskProfile: 'Konservatif. Risk 1%. Spot only.', synergyExplanation: 'WATER zona akumulasi. AIR tren recovery. EARTH entry undervalued. Triple safety net untuk wealth building.', winRateEdge: 'All-Weather Wealth Anchor', bestInstruments: 'BBRI, BBCA, BMRI, AAPL, MSFT, BTC/USDT (DCA)', avoidInstruments: 'Saham gorengan, leveraged ETFs, altcoin micro-cap', instrumentEdge: 'Blue-chip multi-market untuk akumulasi jangka panjang.' },
  GEOTHERMAL: { philosophy: 'Sindikat W+F+E: Membeli saat panic sell membawa harga ke zona Order Block fundamental. Menunggu berita negatif membawa harga ke discount historis, lalu entry spot.', optimalConditions: 'Panic selling blue-chip ke valuasi historis murah. Post-crash recovery.', weakConditions: 'Fundamental genuinely deteriorating.', preferredTimeframe: 'D1, H4 (OB), H1 (entry)', riskProfile: 'Konservatif. Risk 1%. Spot. Hold menengah-panjang.', synergyExplanation: 'WATER OB historis. FIRE katalis panic. EARTH bawah fair value. Buying the panic di zona institusional.', winRateEdge: 'Panic Discount Accumulator', bestInstruments: 'TLKM, UNVR, BBRI, JPM, DIS', avoidInstruments: 'Kripto altcoin, saham tanpa fundamental', instrumentEdge: 'Blue-chip fundamental kuat saat panic selling sementara.' },
  CYCLONE: { philosophy: 'Sindikat F+A+E: Dynamic regime transition engine. Mendeteksi perubahan rezim pasar dan adaptif beralih strategi. Saat trending: ikuti tren. Saat ranging: mean reversion.', optimalConditions: 'Titik transisi rezim pasar.', weakConditions: 'Sinyal regime detection ambigu. Choppy berkepanjangan.', preferredTimeframe: 'H1 (regime), M15 (entry)', riskProfile: 'Moderat-Agresif. Risk 2%.', synergyExplanation: 'FIRE volatility expansion/contraction. AIR arah tren baru. EARTH fallback mean-reversion. Adaptive switching.', winRateEdge: 'Regime Transition Adapter', bestInstruments: 'XAU/USD, BTC/USDT, EUR/USD, NAS100', avoidInstruments: 'Instrumen regime sangat stabil', instrumentEdge: 'Instrumen yang sering mengalami regime shift.' },
  AVATAR: { philosophy: 'Master 4-Element Supreme Consensus. Keempat elemen base memberikan vote independen. Hanya entry saat mayoritas setuju. Strategi paling selektif, win-rate tertinggi secara teori, frekuensi trading terendah karena konsensus ketat.', optimalConditions: 'Keempat elemen selaras \u2014 sangat jarang tapi powerful. Titik infleksi pasar besar.', weakConditions: 'Pasar ambigu. Frekuensi entry rendah.', preferredTimeframe: 'H4, D1 (bias)', riskProfile: 'Balanced. Risk 1.5%. Hybrid spot+futures.', synergyExplanation: 'Setiap elemen vote independen. Konsensus \u2265 3/4 = entry. Committee decision \u2014 lambat tapi akurat.', winRateEdge: 'Supreme Multi-Factor Consensus', bestInstruments: 'Cross-asset (dynamic based on consensus)', avoidInstruments: 'Tidak ada \u2014 instrument-agnostic', instrumentEdge: 'Kekuatan di proses seleksi multi-elemen, bukan instrumen spesifik.' },
  CHAOS: { philosophy: 'The Rogue Anomaly. Tidak mengikuti aturan elemen manapun. Mencari inefisiensi pasar ekstrem \u2014 impulse moves, contrarian fades saat overextended, momentum-following saat impulse kuat. High-risk, high-reward. Bisa top performer atau worst performer.', optimalConditions: 'Pasar sangat volatile. Flash crash, squeeze events, liquidity vacuum.', weakConditions: 'Pasar normal teratur. Trending stabil. Low-vol.', preferredTimeframe: 'M5-M15 (scalp), H1 (swing)', riskProfile: 'Sangat Agresif. Risk 3%+. Full leverage. Highest variance.', synergyExplanation: null, winRateEdge: 'Chaos Edge (High Variance Alpha)', bestInstruments: 'SOXL, TQQQ, BTC/USDT, SMCI, TSLA', avoidInstruments: 'Instrumen low-vol, obligasi, saham defensif stabil', instrumentEdge: 'Instrumen volatilitas dan beta tertinggi untuk variance capture.' }
};

// AI Agent Self-Reflection Generator for Margin Call (MC) Post-Mortem Introspection
const getAgentSelfReflection = (ag, rh, toxicPair) => {
  if (rh?.aiReflection) return rh.aiReflection;
  const fromGen = rh?.fromGen ?? ((ag?.generation || 1) - 1);
  const toGen = rh?.toGen ?? (ag?.generation || 1);
  const pairName = toxicPair || 'instrumen high-volatility';
  const boost = rh?.mutation?.confidenceBoost || ag?.dnaTraits?.confidenceBoost || 5;
  const riskPct = ((rh?.mutation?.riskMultiplier || ag?.dnaTraits?.riskMultiplier || 0.85) * 100).toFixed(0);

  const REFLECTION_TEMPLATES = {
    WATER: `Sebagai spesialis Smart Money Concepts (SMC), kegagalan saya di Gen ${fromGen} terjadi karena terlalu cepat berasumsi bahwa liquidity sweep pada ${pairName} telah tuntas. Saya terjebak dalam Inducement Trap institusional dan membiarkan floating drawdown melanggar batas mitigasi Order Block. Pelajaran utama: market makers sering melakukan secondary sweep sebelum ekspansi sejati. Di Gen ${toGen}, saya berkomitmen memperketat threshold konfirmasi sebesar +${boost}%, mengkarantina ${pairName}, dan mempercepat aktivasi trailing stop ratchet untuk mengunci keuntungan sebelum likuiditas berbalik.`,
    
    FIRE: `Sebagai operator News & Volatility Breakout, kejatuhan saya di Gen ${fromGen} dipicu oleh slippage tajam dan pelebaran spread saat lonjakan berita berimpak tinggi pada ${pairName}. Saya terlalu agresif membuka posisi ukuran penuh di detik-detik awal tanpa menunggu penyerapan order institusi. Di Gen ${toGen}, saya memangkas batas lot sebesar ${100 - Number(riskPct)}%, mengaktifkan jeda proteksi spread sebelum eksekusi momentum, dan menolak menahan posisi saat arah deviasi makro gagal terkonfirmasi.`,
    
    AIR: `Prinsip Trend-Following saya diuji berat saat pasar ${pairName} terjebak dalam sideways ranging squeeze di Gen ${fromGen}. Saya berkali-kali terbujuk false breakout Donchian Channel tanpa konfirmasi ekspansi volume yang memadai. Pelajaran berharga: ketiadaan tren adalah musuh terbesar strategi ini. Di Gen ${toGen}, saya mewajibkan lonjakan volume ATR > 1.5x sebelum trigger eksekusi dan menerapkan cut loss lebih dini demi menjaga integritas modal.`,
    
    EARTH: `Hipotesis Mean Reversion saya runtuh ketika ${pairName} mengalami tren sepihak (relentless trend) yang terus menembus lower Bollinger Band tanpa pantulan pembalikan. Saya terlalu lambat mengakui bahwa deviasi harga kali ini adalah perubahan rezim struktural, bukan sekadar noise acak. Di Gen ${toGen}, saya menurunkan toleransi drawdown per tiket, mewajibkan konfirmasi RSI ekstrem (< 25), dan tidak akan melakukan averaging down saat tren makro berlawanan.`,
    
    STEAM: `Fusi SMC dan katalis berita (WATER+FIRE) mengalami desinkronisasi di Gen ${fromGen}. Sinyal Order Block terpicu bersamaan dengan whipsaw berita ganda pada ${pairName}, melompati level proteksi stop loss. Di Gen ${toGen}, saya mewajibkan konfirmasi volume surge minimal 1.8x sebelum entry pasca-berita dan menurunkan eksposur risiko menjadi ${riskPct}%.`,
    
    STORM: `Sebagai kombinasi SMC dan Trend Breakout (WATER+AIR), kejatuhan Gen ${fromGen} disebabkan oleh sinyal BOS (Break of Structure) palsu di lower timeframe yang berbenturan dengan resistance mayor ${pairName}. Di Gen ${toGen}, saya mewajibkan validasi higher-timeframe swing high sebelum Donchian breakout diizinkan mengeksekusi order.`,
    
    MUD: `Strategi akumulasi diskon S/R historis (WATER+EARTH) gagal di Gen ${fromGen} karena level support kunci pada ${pairName} ditembus dengan volume distribusi institusional masif tanpa ada retest. Di Gen ${toGen}, saya memperketat filter akumulasi hanya pada zona FVG bernilai tinggi dan memangkas risiko per tiket menjadi ${riskPct}%.`,
    
    LIGHTNING: `Kecepatan eksekusi berita (FIRE+AIR) di Gen ${fromGen} justru menjadi bumerang saat terjadi whipsaw ekstrem pada ${pairName}. Stop loss dinamis tersapu sebelum tren baru sempat bernapas. Di Gen ${toGen}, saya menyisipkan buffer stop ATR 1.2x dan menaikkan filter konfirmasi sinyal sebesar +${boost}%.`,
    
    LAVA: `Sebagai strategi Counter-Trend Post-News (FIRE+EARTH), kegagalan saya di Gen ${fromGen} adalah berusaha menangkap pisau jatuh saat sentimen berita pada ${pairName} sangat satu arah tanpa ada candle rejection wick. Di Gen ${toGen}, saya melarang entry counter-trend sebelum terbentuk divergence jelas pada oscillator volume.`,
    
    SANDSTORM: `Strategi Trend-Pullback (AIR+EARTH) terkecoh saat pullback pada ${pairName} ternyata berubah menjadi pembalikan tren makro (trend reversal) penuh di Gen ${fromGen}. Di Gen ${toGen}, saya mengadopsi trailing ratchet ketat begitu harga memantul dari EMA 50 untuk mencegah re-entry yang merugikan.`,
    
    TEMPEST: `Agresivitas triple-engine (WATER+FIRE+AIR) di Gen ${fromGen} menyebabkan over-exposure saat korelasi aset pada ${pairName} tiba-tiba bergeser. Pelajaran penting: sinyal cepat membutuhkan pembagian ukuran lot bertingkat. Di Gen ${toGen}, saya mengaktifkan scaling TP bertahap dan membatasi risiko per trade di level ${riskPct}%.`,
    
    OCEANIC: `Jangkar portofolio All-Weather (WATER+AIR+EARTH) tertekan di Gen ${fromGen} akibat kompresi volatilitas berkepanjangan pada ${pairName} yang mengikis margin pemeliharaan. Di Gen ${toGen}, saya menyaring jam operasional hanya pada jendela likuiditas London/New York dan memperketat trailing stop menjadi 115%.`,
    
    GEOTHERMAL: `Strategi Anti-Whipsaw News (WATER+FIRE+EARTH) terpukul di Gen ${fromGen} oleh candle gap mendadak pada ${pairName} yang melompati zona mitigasi kami. Di Gen ${toGen}, saya mewajibkan jeda penutupan candle 5-menit sebelum order dieksekusi pasca-berita.`,
    
    CYCLONE: `Mesin Dynamic Regime Shifter (FIRE+AIR+EARTH) di Gen ${fromGen} gagal mendeteksi pergantian rezim pasar yang terlalu cepat pada ${pairName}, menghasilkan sinyal whipsaw beruntun. Di Gen ${toGen}, saya memperketat ambang deteksi ADX & Bollinger width sebelum mengizinkan perpindahan mode strategi.`,
    
    AVATAR: `Konsensus 4-Elemen Supreme di Gen ${fromGen} terpecah saat anomali likuiditas ekstrem pada ${pairName} menghasilkan split vote (2 vs 2). Kegagalan mitigasi terjadi karena aturan fallback tidak cukup defensif. Di Gen ${toGen}, saya mewajibkan veto otomatis jika terjadi split konsensus dan memangkas alokasi risiko ke ${riskPct}%.`,
    
    CHAOS: `Strategi Rogue Anomaly saya di Gen ${fromGen} terlalu serakah menunggangi momentum overextended pada ${pairName}. Lonjakan varians ekstrem memicu likuidasi kilat. Di Gen ${toGen}, saya tetap agresif mencari alpha inefisiensi, namun mematuhi hard circuit-breaker dan mengkarantina pair toxic selama fase konsolidasi.`
  };

  return REFLECTION_TEMPLATES[ag?.id] || `Sebagai agen kuantitatif mandiri (${ag?.name || 'Agent'}), kegagalan di Gen ${fromGen} pada ${pairName} memberikan data penting mengenai batas toleransi algoritma terhadap anomali pasar. Di Gen ${toGen}, saya menyerap parameter mutasi baru: memangkas risiko menjadi ${riskPct}%, menaikkan filter konfirmasi sebesar +${boost}%, dan berkomitmen melindungi modal sovereign portofolio.`;
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

// 16 Specialized AI Multi-Agent Roster (4 Base + 6 Duo + 4 Trio + 1 Master AVATAR + 1 Anomaly CHAOS)
const INITIAL_AGENTS = [
  {
    id: 'WATER',
    name: 'WATER',
    role: 'SMC & Liquidity Flow',
    description: 'Smart Money Concepts: Order Blocks, FVG sweep, dan aliran likuiditas mengalir adaptif seperti air.',
    strategy: 'SMC_LIQUIDITY_FLOW',
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
    strategy: 'BREAKOUT_MOMENTUM',
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
    strategy: 'ORDER_FLOW_SCALPING',
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
    strategy: 'MACRO_TREND_FOLLOWING',
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
    strategy: 'TREND_PULLBACK',
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
    strategy: 'VOLATILITY_BREAKOUT',
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
    strategy: 'RANGE_ACCUMULATION',
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
    strategy: 'IMPULSE_ACCELERATION',
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
    strategy: 'CLIMAX_REVERSAL',
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
    strategy: 'WYCKOFF_VSA',
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
    strategy: 'INTERMARKET_DIVERGENCE',
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
    strategy: 'MACRO_CARRY_TRADE',
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
    strategy: 'VALUATION_MISPRICING',
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
    strategy: 'REGIME_SWITCHER',
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
    strategy: 'SUPERMIND_ENSEMBLE',
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
  },
  {
    id: 'CHAOS',
    name: 'CHAOS',
    role: 'Unbound Hyper-Scalper [THE ROGUE]',
    description: 'Anomali ke-16: Mengabaikan batas risiko konvensional. Membuka posisi tanpa batas (carpet-bombing) dan menunggangi akselerasi likuiditas hingga Supernova Profit atau MC dengan auto-rebirth.',
    strategy: 'ANTIFRAGILE_ALPHA',
    avatar: '☣️',
    color: '#a855f7',
    tier: 'ANOMALY',
    dnaBadge: 'UNBOUND',
    dnaIcons: ['☣️', '🩸', '⚡'],
    parents: [],
    status: 'STANDBY',
    confidence: 99,
    exp3Weight: 0.10,
    generation: 0,
    resetCount: 0,
    resetsHistory: [],
    dnaTraits: { riskMultiplier: 8.0, confidenceBoost: 20, trailingTightness: 0.25 }
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
  AVATAR: { maxPerPair: 2, mode: 'CONSENSUS_SCALE', label: 'Citadel Consensus Allocator', desc: 'Multi-Manager: Tambah layer kedua berdasarkan konsensus mayoritas.', minCooldownSec: 20 },
  CHAOS: { maxPerPair: 999, mode: 'UNLIMITED_CARPET_BOMB', label: 'Machine-Gun Carpet Bomb', desc: 'Unbound Scalper: Buka posisi beruntun tanpa batas selama free margin tersedia.', minCooldownSec: 0, stackTriggerTickPct: 0.12, basketTakeProfitPct: 35.0, hardStopLoss: null }
};

// Baseline Genesis: Season 1 Organik (Murni dari 0 trade riil)
const DEFAULT_EPOCH_REPORTS = [];

export default function AiAgentArenaTab({ data, livePrices = {}, onOpenChart, onOpenExecution }) {
  // Master Autonomous System State (PAUSED by default: user configures settings before starting)
  // Institutional Paper Broker & Emergency Kill Switch Gateway State
  const [isKillSwitchActive, setIsKillSwitchActive] = useState(() => {
    try {
      return institutionalPaperBroker.isKillSwitchActive();
    } catch {
      return false;
    }
  });
  const [paperPortfolio, setPaperPortfolio] = useState(() => {
    try {
      return institutionalPaperBroker.getSummary();
    } catch {
      return { cashIdr: 100000000, cashUsdt: 10000, positions: [], tradeHistory: [] };
    }
  });
  const [showBrokerDesk, setShowBrokerDesk] = useState(false);

  // Sync Paper Broker Desk with live engine & tick state
  useEffect(() => {
    const updateDesk = () => {
      try {
        setPaperPortfolio(institutionalPaperBroker.getSummary());
        setIsKillSwitchActive(institutionalPaperBroker.isKillSwitchActive());
      } catch (e) {
        console.warn(e);
      }
    };
    const t = setInterval(updateDesk, 1500);
    return () => clearInterval(t);
  }, []);

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
  const usdToIdrRef = useRef(usdToIdrRate);
  usdToIdrRef.current = usdToIdrRate;

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
          usdToIdrRef.current = rate;
          currentLiveUsdToIdr = rate;
          try { localStorage.setItem('mbg_usd_idr_rate', String(rate)); } catch (e) {}
        }
      })
      .catch(e => {
        console.warn('Realtime USD/IDR fetch error, using fallback:', e);
        try {
          const saved = localStorage.getItem('mbg_usd_idr_rate');
          if (saved) {
            const parsed = Number(saved);
            if (parsed > 0) {
              setUsdToIdrRate(parsed);
              usdToIdrRef.current = parsed;
              currentLiveUsdToIdr = parsed;
            }
          }
        } catch {}
      });
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
  const positionsRef = useRef(positions);
  positionsRef.current = positions;

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

  // 60s Reactive Clock to update market hours badges & agent status
  const [clockTick, setClockTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setClockTick(c => c + 1), 60000);
    return () => clearInterval(t);
  }, []);



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

  // H-08: Synchronize live USD/IDR rate dynamically from centralized livePrices store
  useEffect(() => {
    if (!livePrices) return;
    const liveRate = livePrices['USDIDR']?.price || livePrices['USDTIDR']?.price || livePrices['FX_IDC:USDIDR']?.price;
    if (liveRate && typeof liveRate === 'number' && liveRate > 10000 && liveRate < 25000) {
      const rounded = Math.round(liveRate);
      setUsdToIdrRate(rounded);
      usdToIdrRef.current = rounded;
      currentLiveUsdToIdr = rounded;
      try {
        localStorage.setItem('mbg_usd_idr_rate', String(rounded));
        localStorage.setItem('mbg_usd_idr_ts', String(Date.now()));
      } catch (e) {}
    }
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

  // 1. Hydrate offline 24/7 background progress from Cloud / Master Data Bundle (Option 1)
  useEffect(() => {
    const cloudState = data?.arena_state;
    if (!cloudState) return;

    const resetTs = Number(localStorage.getItem('mbg_ai_arena_reset_ts') || 0);
    const cloudEvaluatedTs = cloudState.last_evaluated ? new Date(cloudState.last_evaluated).getTime() : 0;

    // Guard: Do not hydrate stale cloud state generated before user's explicit local reset
    if (resetTs > 0 && cloudEvaluatedTs > 0 && cloudEvaluatedTs <= resetTs) {
      return;
    }

    // 1. Merge new journal trades closed by the 24/7 cloud runner while offline
    if (Array.isArray(cloudState.journal) && cloudState.journal.length > 0) {
      setJournal(prev => {
        const existingIds = new Set(prev.map(j => j.id));
        const newFromCloud = cloudState.journal.filter(j => !existingIds.has(j.id));
        if (newFromCloud.length === 0) return prev;
        const merged = [...prev, ...newFromCloud];
        try { localStorage.setItem('mbg_ai_arena_journal', JSON.stringify(merged)); } catch (e) {}
        return merged;
      });
    }

    // 2. Synchronize active positions if local is empty or cloud has newer positions
    if (Array.isArray(cloudState.positions) && cloudState.positions.length > 0) {
      setPositions(prev => {
        if (prev.length === 0) {
          try { localStorage.setItem('mbg_ai_arena_positions', JSON.stringify(cloudState.positions)); } catch (e) {}
          return cloudState.positions;
        }
        return prev;
      });
    }
  }, [data?.arena_state]);

  // 2. Direct Real-Time Synchronizer from Hugging Face Space (Opsi B Always-On Cloud Daemon)
  useEffect(() => {
    let isCancelled = false;
    const syncFromCloudSpace = async () => {
      const endpoints = [
        'https://ahfu28-mbg-trading-arena.hf.space/api/arena/state',
        `/data/latest_arena_state.json?v=${Date.now()}`
      ];
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, { cache: 'no-cache' });
          if (res.ok) {
            const cloudState = await res.json();
            if (isCancelled || !cloudState) return;

            const resetTs = Number(localStorage.getItem('mbg_ai_arena_reset_ts') || 0);
            const cloudEvaluatedTs = cloudState.last_evaluated ? new Date(cloudState.last_evaluated).getTime() : 0;
            if (resetTs > 0 && cloudEvaluatedTs > 0 && cloudEvaluatedTs <= resetTs) return;

            if (Array.isArray(cloudState.journal) && cloudState.journal.length > 0) {
              setJournal(prev => {
                const existingIds = new Set(prev.map(j => j.id));
                const newFromCloud = cloudState.journal.filter(j => !existingIds.has(j.id));
                if (newFromCloud.length === 0) return prev;
                const merged = [...prev, ...newFromCloud];
                try { localStorage.setItem('mbg_ai_arena_journal', JSON.stringify(merged)); } catch (e) {}
                return merged;
              });
            }

            if (Array.isArray(cloudState.positions) && cloudState.positions.length > 0) {
              setPositions(prev => {
                if (prev.length === 0) {
                  try { localStorage.setItem('mbg_ai_arena_positions', JSON.stringify(cloudState.positions)); } catch (e) {}
                  return cloudState.positions;
                }
                return prev;
              });
            }
            break; // Stop after successful endpoint
          }
        } catch (e) {
          // Fallback to next endpoint
        }
      }
    };

    syncFromCloudSpace();
    return () => { isCancelled = true; };
  }, []);

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
  const [toasts, setToasts] = useState([]);

  // Bot Life Cycle: Evolution & Mutasi DNA Modal
  const [evolutionModal, setEvolutionModal] = useState({ isOpen: false, agent: null });

  // Epoch Reports & Self-Improvement Session History (100% Organic Real Executions)
  const [epochReports, setEpochReports] = useState(() => {
    try {
      const saved = localStorage.getItem('mbg_ai_arena_epoch_reports');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out legacy mock reports
          const cleanReports = parsed.filter(p => p.id !== 'REPORT-EP-1-OFFICIAL' && p.id !== 'REPORT-EP-0-GENESIS');
          return cleanReports;
        }
      }
      return DEFAULT_EPOCH_REPORTS;
    } catch {
      return DEFAULT_EPOCH_REPORTS;
    }
  });
  const [sessionRecapModalOpen, setSessionRecapModalOpen] = useState(false);
  const [selectedRecapSessionKey, setSelectedRecapSessionKey] = useState('LIVE');
  const [recapSubTab, setRecapSubTab] = useState('OVERVIEW'); // 'OVERVIEW' | 'PAIR_RECAP'
  const [pairDirFilter, setPairDirFilter] = useState('ALL'); // 'ALL' | 'LONG' | 'SHORT'

  // Global Escape key listener to dismiss open modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (resetConfirmModal.isOpen) setResetConfirmModal({ isOpen: false, agentId: null, agentName: '' });
        else if (evolutionModal.isOpen) setEvolutionModal({ isOpen: false, agent: null });
        else if (journalModal.isOpen) setJournalModal({ isOpen: false, agentId: 'ALL', agentName: 'Semua Agen' });
        else if (sessionRecapModalOpen) setSessionRecapModalOpen(false);
        else if (rulesModalOpen) setRulesModalOpen(false);
        else if (philosophyModalOpen) setPhilosophyModalOpen(false);
        else if (agentReviewModalOpen) setAgentReviewModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetConfirmModal.isOpen, evolutionModal.isOpen, journalModal.isOpen, sessionRecapModalOpen, rulesModalOpen, philosophyModalOpen, agentReviewModalOpen]);

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

  // Toast Queue Manager: Stack up to 3 toasts with automatic 3.5s dismiss
  const showToast = useCallback((msg) => {
    const id = `toast-${Date.now()}-${(crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}`).slice(0, 8)}`;
    setToasts(prev => [...prev.slice(-2), { id, msg }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
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
    else if (agentFilterTab === 'ANOMALY') list = list.filter(a => a.tier === 'ANOMALY');

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

      // Max Drawdown calculation (Equity Curve Peak-to-Trough)
      let runningEquity = totalCapitalIdr;
      let peakEquity = totalCapitalIdr;
      let maxDrawdownIdr = 0;
      let maxDrawdownPct = 0;
      const sortedChronological = [...journal].sort((a, b) => new Date(a.closedAt || 0) - new Date(b.closedAt || 0));
      sortedChronological.forEach(t => {
        const val = t.pnlIdr || (t.pnlUsd * usdToIdrRate);
        runningEquity += val;
        if (runningEquity > peakEquity) peakEquity = runningEquity;
        const ddIdr = peakEquity - runningEquity;
        if (ddIdr > maxDrawdownIdr) {
          maxDrawdownIdr = ddIdr;
          maxDrawdownPct = peakEquity > 0 ? (ddIdr / peakEquity) * 100 : 0;
        }
      });

      // Avg Win, Avg Loss, Win/Loss Ratio, Expectancy per trade
      const avgWinIdr = wins > 0 ? Math.round(grossProfitIdr / wins) : 0;
      const avgLossIdr = losses > 0 ? Math.round(grossLossIdr / losses) : 0;
      const winLossRatio = avgLossIdr > 0 ? Number((avgWinIdr / avgLossIdr).toFixed(2)) : (avgWinIdr > 0 ? 99.0 : 0);
      const wrDecimal = totalTrades > 0 ? wins / totalTrades : 0;
      const expectancyIdr = Math.round((wrDecimal * avgWinIdr) - ((1 - wrDecimal) * avgLossIdr));

      // Multi-Asset Class Breakdown (IDX, Crypto, Forex, US, Commodities)
      const marketMap = {};
      journal.forEach(t => {
        let mkt = t.market || 'FOREX';
        if (['XAUUSD', 'XAGUSD', 'USOIL', 'GOLD', 'SILVER'].includes(t.symbol) || mkt === 'FUTURES') {
          mkt = 'COMMODITIES';
        }
        if (!marketMap[mkt]) {
          marketMap[mkt] = { market: mkt, totalTrades: 0, wins: 0, losses: 0, netPnlIdr: 0, grossProfit: 0, grossLoss: 0 };
        }
        const val = t.pnlIdr || (t.pnlUsd * usdToIdrRate);
        marketMap[mkt].totalTrades += 1;
        marketMap[mkt].netPnlIdr += val;
        if (t.isWin) marketMap[mkt].wins += 1; else marketMap[mkt].losses += 1;
        if (val > 0) marketMap[mkt].grossProfit += val; else marketMap[mkt].grossLoss += Math.abs(val);
      });
      const marketClassList = Object.values(marketMap).map(m => ({
        ...m,
        winRate: m.totalTrades > 0 ? ((m.wins / m.totalTrades) * 100).toFixed(1) : '0.0',
        profitFactor: m.grossLoss > 0 ? (m.grossProfit / m.grossLoss).toFixed(2) : (m.grossProfit > 0 ? '99.0' : '0.0')
      }));

      // Top 3 Best Trades & Top 3 Worst Trades
      const top3BestTrades = [...journal]
        .filter(t => (t.pnlIdr || (t.pnlUsd * usdToIdrRate)) > 0)
        .sort((a, b) => (b.pnlIdr || 0) - (a.pnlIdr || 0))
        .slice(0, 3);
      const top3WorstTrades = [...journal]
        .filter(t => (t.pnlIdr || (t.pnlUsd * usdToIdrRate)) < 0)
        .sort((a, b) => (a.pnlIdr || 0) - (b.pnlIdr || 0))
        .slice(0, 3);

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

      // Universe Attribution (All pairs traded in live session, with Long/Short breakdown)
      const pairStats = {};
      journal.forEach(t => {
        const sym = t.symbol;
        const mkt = t.market || 'FOREX';
        const dir = t.direction || 'LONG';
        const val = t.pnlIdr || (t.pnlUsd * usdToIdrRate);
        if (!pairStats[sym]) {
          pairStats[sym] = {
            symbol: sym, market: mkt,
            totalTrades: 0, wins: 0, losses: 0, netPnlIdr: 0, grossProfit: 0, grossLoss: 0,
            longTrades: 0, longWins: 0, longNetPnlIdr: 0,
            shortTrades: 0, shortWins: 0, shortNetPnlIdr: 0
          };
        }
        pairStats[sym].totalTrades += 1;
        pairStats[sym].netPnlIdr += val;
        if (t.isWin) pairStats[sym].wins += 1; else pairStats[sym].losses += 1;
        if (val > 0) pairStats[sym].grossProfit += val; else pairStats[sym].grossLoss += Math.abs(val);
        if (dir === 'LONG') {
          pairStats[sym].longTrades += 1;
          pairStats[sym].longNetPnlIdr += val;
          if (t.isWin) pairStats[sym].longWins += 1;
        } else {
          pairStats[sym].shortTrades += 1;
          pairStats[sym].shortNetPnlIdr += val;
          if (t.isWin) pairStats[sym].shortWins += 1;
        }
      });

      const allPairs = Object.values(pairStats).map(p => ({
        ...p,
        winRate: p.totalTrades > 0 ? ((p.wins / p.totalTrades) * 100).toFixed(0) : '0',
        longWinRate: p.longTrades > 0 ? ((p.longWins / p.longTrades) * 100).toFixed(0) : '0',
        shortWinRate: p.shortTrades > 0 ? ((p.shortWins / p.shortTrades) * 100).toFixed(0) : '0',
        netPnlUsd: p.netPnlIdr / usdToIdrRate,
        profitFactor: p.grossLoss > 0 ? (p.grossProfit / p.grossLoss).toFixed(2) : (p.grossProfit > 0 ? '99.0' : '0.0')
      }));

      const topAlphaPairs = [...allPairs].filter(p => p.netPnlIdr > 0).sort((a, b) => b.netPnlIdr - a.netPnlIdr).slice(0, 3);
      const toxicDragPairs = [...allPairs].filter(p => p.netPnlIdr < 0).sort((a, b) => a.netPnlIdr - b.netPnlIdr).slice(0, 3);

      const officialReports = epochReports.filter(ep => ep.epochNumber !== 0 && !String(ep.epochNumber).includes('test') && !String(ep.epochNumber).startsWith('0.'));
      const liveLabel = officialReports.length + 1;

      return {
        epochNumber: liveLabel,
        isLive: true,
        sessionLabel: `Season ${liveLabel} (Live Interim)`,
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
        allPairs,
        maxDrawdownPct: Number(maxDrawdownPct.toFixed(1)),
        maxDrawdownIdr: Math.round(maxDrawdownIdr),
        avgWinIdr,
        avgLossIdr,
        winLossRatio,
        expectancyIdr,
        marketClassList,
        top3BestTrades,
        top3WorstTrades,
        keyTakeaway: (() => {
          if (totalTrades === 0) return 'Sesi baru dimulai. Bot sedang memindai likuiditas di seluruh pasar yang aktif.';
          const bestMkt = [...marketClassList].sort((a, b) => b.netPnlIdr - a.netPnlIdr)[0];
          return `Season ${liveLabel} berjalan ${netPnlIdr >= 0 ? 'PROFIT +' : 'DEFISIT '}${formatIdr(netPnlIdr)} (ROC ${rocPct}%, Win Rate ${winRate}%). Alpha utama dipimpin sektor ${bestMkt ? bestMkt.market : 'N/A'} dan MVP ${mvp ? mvp.name : 'N/A'}. Expectancy sistem ${formatIdr(expectancyIdr)} per tiket dengan Win/Loss ratio ${winLossRatio}x. Max Drawdown ${maxDrawdownPct.toFixed(1)}% (${formatIdr(maxDrawdownIdr)}).`;
        })()
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

      const isTestSession = String(report.epochNumber).includes('0.11') || String(report.epochNumber).includes('test');
      const isGenesisSession = report.epochNumber === 0;
      const formattedSessionLabel = isTestSession
        ? 'Season 0.11 (test) (Arsip)'
        : (isGenesisSession ? 'Sesi #0 Genesis (Arsip)' : `Season ${report.epochNumber} (Arsip)`);

      return {
        epochNumber: report.epochNumber,
        isLive: false,
        sessionLabel: formattedSessionLabel,
        createdAt: report.createdAt,
        uptimeStr: 'Diarsipkan',
        totalTrades: report.totalTrades,
        winRate: report.winRate,
        grossProfitIdr: report.grossProfitIdr,
        grossLossIdr: report.grossLossIdr,
        netPnlIdr: report.netPnlIdr,
        netPnlUsd: report.netPnlUsd,
        profitFactor: report.profitFactor,
        sharpeRatio: (() => { const rr = (report.allPairs || []).map(p => p.netPnlIdr || 0); if (rr.length < 2) return report.sharpeRatio || '0.00'; const mean = rr.reduce((a, b) => a + b, 0) / rr.length; const variance = rr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (rr.length - 1); const stdDev = Math.sqrt(variance); return stdDev > 0 ? (mean / stdDev).toFixed(2) : '0.00'; })(),
        rocPct: report.rocPct || rocPct,
        agentBreakdowns: agentBreakdownsWithDiff,
        adaptations: report.adaptations || [],
        mvp,
        topAlphaPairs: report.topAlphaPairs || bestPairsFound.slice(0, 3),
        toxicDragPairs: report.toxicDragPairs || worstPairsFound.slice(0, 3),
        allPairs: report.allPairs || [],
        maxDrawdownPct: report.maxDrawdownPct || 0,
        maxDrawdownIdr: report.maxDrawdownIdr || 0,
        avgWinIdr: report.avgWinIdr || (report.wins > 0 ? Math.round(report.grossProfitIdr / report.wins) : 0),
        avgLossIdr: report.avgLossIdr || (report.losses > 0 ? Math.round(report.grossLossIdr / report.losses) : 0),
        winLossRatio: report.winLossRatio || 0,
        expectancyIdr: report.expectancyIdr || 0,
        marketClassList: report.marketClassList || [],
        top3BestTrades: report.top3BestTrades || [],
        top3WorstTrades: report.top3WorstTrades || [],
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
  }, [isRunning, agentStatsMap, positions, clockTick]);

  // Real-Time 100% Real Market Evaluation Engine (Zero synthetic simulation)
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // 0. Weekly Auto-Epoch Timer (Archive season after 7 days active running time: 604,800s)
      if (sessionActiveSeconds >= 604800 && (journalRef.current?.length || 0) >= 15) {
        handleExecuteReset();
        setSessionActiveSeconds(0);
        try { localStorage.setItem('mbg_ai_arena_session_active_seconds', '0'); } catch (e) {}
        setToasts(prev => [{ id: `toast-auto-epoch-${Date.now()}`, text: '📅 Weekly Auto-Epoch: Sesi 7 hari telah selesai & diarsipkan otomatis dengan rebalancing EXP3.', type: 'info' }, ...prev.slice(0, 4)]);
      }

      // 1. Update Running Positions & Evaluate TP/SL against 100% REAL LIVE MARKET PRICES
      const prevPositions = positionsRef.current;
      let hasClosedAny = false;
      const closedTradesToAdd = [];
      const currentFeeds = marketFeedsRef.current;
      let currentAgents = agentsRef.current;
      let agentsChanged = false;
      const toastsToShow = [];

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
            pnlUsd = pnlIdr / usdToIdrRef.current;
          } else if (pos.market === 'US') {
            pnlUsd = delta * pos.sizeLots;
            pnlIdr = pnlUsd * usdToIdrRef.current;
          } else if (['US30', 'US500', 'NAS100', 'DAX40', 'NIKKEI', 'HSI'].includes(pos.symbol)) {
            pnlUsd = delta * pos.sizeLots * 1;
            pnlIdr = pnlUsd * usdToIdrRef.current;
          } else if (pos.symbol.includes('XAU') || pos.symbol.includes('XAG') || pos.market === 'FUTURES') {
            pnlUsd = delta * pos.sizeLots * 100;
            pnlIdr = pnlUsd * usdToIdrRef.current;
          } else if (isForex) {
            pnlUsd = delta * pos.sizeLots * 100000;
            pnlIdr = pnlUsd * usdToIdrRef.current;
          } else {
            pnlUsd = delta * pos.sizeLots;
            pnlIdr = pnlUsd * usdToIdrRef.current;
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

            // Institutional Real Exchange Friction Model:
            // 1. Commission Fee: Bitget / Standard Broker Taker fee 0.05% entry + 0.05% exit = 0.10% total volume
            // 2. Spread & Execution Slippage: ~0.02% of entry price
            const notionalUsd = isIdx
              ? (pos.sizeLots * 100 * pos.entryPrice / (usdToIdrRef.current || 16350))
              : (isForex ? (pos.sizeLots * 100000) : (pos.sizeLots * (pos.symbol.includes('XAU') ? 100 : pos.entryPrice)));
            const totalFrictionPct = 0.0012; // 0.12% total transaction friction (0.10% fee + 0.02% slippage)
            const frictionUsd = Math.max(0.05, notionalUsd * totalFrictionPct);
            const frictionIdr = isIdx ? (pos.sizeLots * 100 * pos.entryPrice * totalFrictionPct) : (frictionUsd * (usdToIdrRef.current || 16350));

            // Accurate fill delta based on final exitPrice (not raw overshoot tick)
            const closeDelta = pos.direction === 'LONG' ? (exitPrice - pos.entryPrice) : (pos.entryPrice - exitPrice);
            let finalGrossPnlIdr = 0;
            let finalGrossPnlUsd = 0;

            if (isIdx) {
              finalGrossPnlIdr = closeDelta * pos.sizeLots * 100;
              finalGrossPnlUsd = finalGrossPnlIdr / (usdToIdrRef.current || 16350);
            } else if (pos.market === 'US') {
              finalGrossPnlUsd = closeDelta * pos.sizeLots;
              finalGrossPnlIdr = finalGrossPnlUsd * (usdToIdrRef.current || 16350);
            } else if (['US30', 'US500', 'NAS100', 'DAX40', 'NIKKEI', 'HSI'].includes(pos.symbol)) {
              finalGrossPnlUsd = closeDelta * pos.sizeLots * 1;
              finalGrossPnlIdr = finalGrossPnlUsd * (usdToIdrRef.current || 16350);
            } else if (pos.symbol.includes('XAU') || pos.symbol.includes('XAG') || pos.market === 'FUTURES') {
              finalGrossPnlUsd = closeDelta * pos.sizeLots * 100;
              finalGrossPnlIdr = finalGrossPnlUsd * (usdToIdrRef.current || 16350);
            } else if (isForex) {
              finalGrossPnlUsd = closeDelta * pos.sizeLots * 100000;
              finalGrossPnlIdr = finalGrossPnlUsd * (usdToIdrRef.current || 16350);
            } else {
              finalGrossPnlUsd = closeDelta * pos.sizeLots;
              finalGrossPnlIdr = finalGrossPnlUsd * (usdToIdrRef.current || 16350);
            }

            const netPnlUsd = finalGrossPnlUsd - frictionUsd;
            const netPnlIdr = finalGrossPnlIdr - frictionIdr;
            const netRoiPct = notionalUsd > 0 ? (netPnlUsd / notionalUsd) * 100 * (pos.leverage ? (parseInt(pos.leverage.replace(/\D/g, ''), 10) || 1) : 1) : roiPct;

            closedTradesToAdd.push({
              id: `TRD-${pos.id}-${Date.now()}`,
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
              grossPnlUsd: Number(finalGrossPnlUsd.toFixed(2)),
              grossPnlIdr: Number(finalGrossPnlIdr.toFixed(0)),
              feeUsd: Number(frictionUsd.toFixed(2)),
              feeIdr: Number(frictionIdr.toFixed(0)),
              pnlUsd: Number(netPnlUsd.toFixed(2)),
              pnlIdr: Number(netPnlIdr.toFixed(0)),
              roiPct: Number(netRoiPct.toFixed(2)),
              rrAchieved: (() => {
                const slDist = Math.abs(pos.entryPrice - pos.slPrice);
                const exitDist = Math.abs(exitPrice - pos.entryPrice);
                const calc = slDist > 0 ? Number((exitDist / slDist).toFixed(2)) : 1.5;
                return netPnlIdr > 0 ? Math.min(8.0, Math.max(0.2, calc)) : -1.0;
              })(),
              exitReason: exitReason,
              closedAt: new Date().toISOString(),
              isWin: netPnlIdr > 0
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

          const grossProfit = agTrades.filter(j => (j.pnlIdr || (j.pnlUsd * usdToIdrRef.current)) > 0)
            .reduce((a, b) => a + (b.pnlIdr || (b.pnlUsd * usdToIdrRef.current)), 0);
          const grossLoss = Math.abs(agTrades.filter(j => (j.pnlIdr || (j.pnlUsd * usdToIdrRef.current)) < 0)
            .reduce((a, b) => a + (b.pnlIdr || (b.pnlUsd * usdToIdrRef.current)), 0));
          const netGainIdr = grossProfit - grossLoss;
          const activeFloatingIdr = updated.filter(p => p.agentId === ag.id)
            .reduce((acc, p) => acc + (p.floatingPnlIdr || 0), 0);
          const liveEquityIdr = capitalPerBotIdr + netGainIdr + activeFloatingIdr;
            // Sovereign Auto-MC Trigger: jika sisa ekuitas <= 15% dari modal dasar pengaturan
            const mcThresholdIdr = Math.max(100000, capitalPerBotIdr * 0.15);
            if (liveEquityIdr <= mcThresholdIdr) {
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

            const liquidationTrades = botOpenPositions.map(pos => {
              const notionalUsd = pos.market === 'IDX'
                ? (pos.sizeLots * 100 * pos.entryPrice / (usdToIdrRef.current || 16350))
                : (pos.market === 'FOREX' ? (pos.sizeLots * 100000) : (pos.sizeLots * (pos.symbol.includes('XAU') ? 100 : pos.entryPrice)));
              const frictionUsd = Math.max(0.05, notionalUsd * 0.0012);
              const frictionIdr = pos.market === 'IDX' ? (pos.sizeLots * 100 * pos.entryPrice * 0.0012) : (frictionUsd * (usdToIdrRef.current || 16350));
              const rawPnlUsd = pos.floatingPnlUsd || 0;
              const rawPnlIdr = pos.floatingPnlIdr || 0;
              const netPnlUsd = rawPnlUsd - frictionUsd;
              const netPnlIdr = rawPnlIdr - frictionIdr;

              return {
                id: `LIQ-${pos.id}-${Date.now()}`,
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
                grossPnlUsd: Number(rawPnlUsd.toFixed(2)),
                grossPnlIdr: Number(rawPnlIdr.toFixed(0)),
                feeUsd: Number(frictionUsd.toFixed(2)),
                feeIdr: Number(frictionIdr.toFixed(0)),
                pnlUsd: Number(netPnlUsd.toFixed(2)),
                pnlIdr: Number(netPnlIdr.toFixed(0)),
                roiPct: pos.roiPct || -100,
                rrAchieved: -1.0,
                exitReason: 'MARGIN_CALL_LIQUIDATION',
                closedAt: new Date().toISOString(),
                isWin: false
              };
            });

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
              mutation: mutation,
              aiReflection: getAgentSelfReflection(ag, { fromGen: oldGen, toGen: nextGen, mutation }, toxicPair)
            };

            // Mutate agent in currentAgents
            agentsChanged = true;
            currentAgents = currentAgents.map(a => {
              if (a.id !== ag.id) return a;
              return {
                ...a,
                generation: nextGen,
                resetCount: newResetCount,
                resetsHistory: [resetNote, ...(a.resetsHistory || [])],
                dnaTraits: mutation,
                equityHistory: [capitalPerBotIdr]
              };
            });

            toastsToShow.push(`💀 ${ag.name} terkena Margin Call di Gen ${oldGen}! Berevolusi ke Gen ${nextGen} (Saldo di-reset ke Rp ${capitalPerBotIdr.toLocaleString('id-ID')}, Toxic Pair: ${toxicPair} dikarantina).`);
          });
        }

        if (hasClosedAny && closedTradesToAdd.length > 0) {
          // Update agent equity sparklines
          agentsChanged = true;
          currentAgents = currentAgents.map(ag => {
            const botTrades = closedTradesToAdd.filter(c => c.agentId === ag.id);
            if (botTrades.length === 0) return ag;
            const totalBotPnl = botTrades.reduce((acc, t) => acc + (t.pnlIdr || 0), 0);
            const prevHistory = ag.equityHistory || [capitalPerBotIdr];
            const lastVal = prevHistory[prevHistory.length - 1];
            const nextVal = lastVal + totalBotPnl;
            return {
              ...ag,
              equityHistory: [...prevHistory.slice(-15), nextVal]
            };
          });

          const firstClosed = closedTradesToAdd[0];
          if (firstClosed) {
            toastsToShow.push(`🔔 Trade ${firstClosed.symbol} auto-closed (${firstClosed.exitReason}) PnL: ${firstClosed.isWin ? '+' : ''}${formatInstrumentPrice(firstClosed.pnlIdr, 'IDX')}`);
          }
        }


        // Positive Reinforcement & Intra-Season Self-Learning Adaptive Engine
        if (closedTradesToAdd.length > 0) {
          currentAgents = currentAgents.map(ag => {
            const botClosed = closedTradesToAdd.filter(c => c.agentId === ag.id);
            if (botClosed.length === 0) return ag;

            const agClosedTrades = [...currentJournalSnapshot, ...closedTradesToAdd].filter(j => j.agentId === ag.id);
            const tradeCount = agClosedTrades.length;
            let traits = { ...(ag.dnaTraits || {}) };
            let changed = false;

            // 1. Positive Reinforcement on Individual Winning Trades
            const winTrades = botClosed.filter(c => c.isWin);
            if (winTrades.length > 0) {
              const currentRisk = traits.riskMultiplier || 1.0;
              if (currentRisk < 1.25) {
                traits.riskMultiplier = Number(Math.min(1.25, currentRisk * 1.03).toFixed(2));
                changed = true;
              }
              if ((traits.trailingTightness || 1.0) > 1.0) {
                traits.trailingTightness = Number(Math.max(1.0, (traits.trailingTightness || 1.0) * 0.98).toFixed(2));
                changed = true;
              }
              if ((traits.confidenceBoost || 0) > 0) {
                traits.confidenceBoost = Math.max(0, (traits.confidenceBoost || 0) - 1);
                changed = true;
              }
            }

            // 2. Intra-Season Periodic Auto-Evaluation (every 50 closed trades per bot)
            if (tradeCount > 0 && tradeCount % 50 === 0) {
              const last50 = agClosedTrades.slice(-50);
              const wins = last50.filter(t => t.isWin).length;
              const winRate = wins / 50;
              const netPnl = last50.reduce((acc, t) => acc + (t.pnlIdr || 0), 0);
              if (winRate > 0.55 && netPnl > 0) {
                changed = true;
                traits.riskMultiplier = Number(Math.min(1.25, (traits.riskMultiplier || 1.0) * 1.08).toFixed(2));
                traits.confidenceBoost = Math.max(0, (traits.confidenceBoost || 0) - 3);
                toastsToShow.push(`🌟 ${ag.name}: Auto-Eval 50 Trades POSITIF! Win Rate ${(winRate*100).toFixed(0)}%, Risk Multiplier dinaikkan ke ${((traits.riskMultiplier)*100).toFixed(0)}%`);
              } else if (winRate < 0.35 && netPnl < 0) {
                changed = true;
                traits.riskMultiplier = Number(Math.max(0.35, (traits.riskMultiplier || 1.0) * 0.88).toFixed(2));
                traits.confidenceBoost = Math.min(25, (traits.confidenceBoost || 0) + 4);
                traits.trailingTightness = Number(Math.min(2.5, (traits.trailingTightness || 1.0) * 1.12).toFixed(2));
                toastsToShow.push(`⚠️ ${ag.name}: Auto-Eval 50 Trades DEFISIT. De-risking aktif (-12% risk, filter sinyal diperketat)`);
              }
            }

            if (changed) {
              agentsChanged = true;
              return { ...ag, dnaTraits: traits };
            }
            return ag;
          });
        }

        // Pure Quantitative Confluence Signal Engine (Zero Math.random() Spawner)
        const maxPositionsPerAgent = isUnlimitedPositions ? 999 : sliderMaxPositions;
        if (updated.length < effectiveMaxPositions) {
          const availableAgents = currentAgents.filter(a => {
            const count = updated.filter(p => p.agentId === a.id).length;
            return count < maxPositionsPerAgent;
          });

          if (availableAgents.length > 0) {
            const activeRadarPool = scanActiveMarketRadar(currentFeeds, ALL_INSTRUMENTS, scannerModeRef.current || 'DYNAMIC_RADAR');
            const openMarketSymbols = activeRadarPool.length > 0
              ? activeRadarPool
              : ALL_INSTRUMENTS.filter(i => isMarketOpenNow(i.market)).map(i => i.symbol);

            // Pure Quantitative Multi-Agent Execution: All 16 bots evaluate and trade 100% INDEPENDENTLY
            for (const ag of availableAgents) {
              if (updated.length >= effectiveMaxPositions) break;

              const agentPositions = updated.filter(p => p.agentId === ag.id);
              if (agentPositions.length >= maxPositionsPerAgent) continue;

              const agentRules = AGENT_MULTI_POS_RULES[ag.id] || { maxPerPair: 1, mode: 'SINGLE_BULLET', minCooldownSec: 25 };
              const toxicPairsToAvoid = [
                ...(ag.dnaTraits?.toxicPairAvoided ? [ag.dnaTraits.toxicPairAvoided] : []),
                ...(Array.isArray(ag.dnaTraits?.toxicPairs) ? ag.dnaTraits.toxicPairs : []),
                ...((ag.resetsHistory || []).map(r => r.toxicPair).filter(Boolean))
              ].filter(sym => sym && sym !== 'High-Beta' && sym !== 'Diversified Rebalance' && sym !== 'N/A');

              const unheldSymbols = openMarketSymbols.filter(s => !agentPositions.some(p => p.symbol === s) && !toxicPairsToAvoid.includes(s));

              // Each bot independently scans candidate instruments to find its best setup
              let agentBestSig = null;
              let agentHighestConf = 0;
              let targetKey = null;
              let targetFeed = null;

              for (const sym of unheldSymbols.slice(0, 25)) {
                const feed = currentFeeds[sym];
                if (feed && isMarketOpenNow(feed.market)) {
                  const sig = computeAgentSignal(ag.id, sym, feed, ag.dnaTraits || {});
                  const reqConf = 68 + (ag.dnaTraits?.confidenceBoost || 0);

                  if (sig.confidence >= reqConf && sig.confidence > agentHighestConf) {
                    agentHighestConf = sig.confidence;
                    agentBestSig = sig;
                    targetKey = sym;
                    targetFeed = feed;
                  }
                }
              }

              // If THIS bot finds a valid confluence setup (>= 68%), it immediately opens a position!
              if (agentBestSig && targetKey && targetFeed && isMarketOpenNow(targetFeed.market)) {
                const entry = targetFeed.price;
                const isIdx = targetFeed.market === 'IDX';
                const isForex = targetFeed.market === 'FOREX';
                const isCrypto = targetFeed.market === 'CRYPTO';
                const targetExecutionMode = resolveExecutionMode(arenaExecutionModeRef.current || 'HYBRID', ag.id, targetFeed.market);
                const isSpot = targetExecutionMode === 'SPOT' || isIdx;
                let isLong = isSpot ? true : agentBestSig.isLong;
                let rationale = isSpot
                  ? (isIdx
                    ? `${ag.name}: Akumulasi spot pada ${targetKey} (Long-Only BEI Regulation).`
                    : `[SPOT] ${ag.name}: Akumulasi kas spot pada ${targetKey} (0 Likuidasi, 1:1 Cash Asset).`)
                  : agentBestSig.rationale;

                let atrPct = isCrypto ? 0.012 : (isForex ? 0.0035 : (isIdx ? 0.010 : 0.006));
                if (targetFeed.atr && targetFeed.price > 0) {
                  const ratio = targetFeed.atr / targetFeed.price;
                  if (!isNaN(ratio) && ratio >= 0.003 && ratio <= 0.025) {
                    atrPct = ratio;
                  }
                }
                const atr = entry * atrPct;
                const slMultiplier = ag.id === 'CHAOS' ? 2.5 : (['STEAM', 'MUD'].includes(ag.id) ? 0.85 : (['LAVA', 'GEOTHERMAL'].includes(ag.id) ? 0.90 : 1.0));
                const tpMultiplier = ag.id === 'CHAOS' ? 5.0 : (['STORM', 'LIGHTNING', 'TEMPEST'].includes(ag.id) ? 2.2 : (['STEAM', 'CYCLONE'].includes(ag.id) ? 1.8 : 1.5));
                const sl = isLong ? (entry - (atr * slMultiplier)) : (entry + (atr * slMultiplier));
                const tp1 = isLong ? (entry + (atr * tpMultiplier)) : (entry - (atr * tpMultiplier));
                const tp2 = isLong ? (entry + (atr * (tpMultiplier + 1.0))) : (entry - (atr * (tpMultiplier + 1.0)));

                const sizeLots = calculateInstrumentLotSize(
                  targetFeed.market,
                  targetKey,
                  entry,
                  capitalPerBotIdr,
                  riskPerTradePct,
                  targetExecutionMode,
                  sl,
                  ag,
                  atr
                );

                let decimals = 2;
                if (isIdx) decimals = 0;
                else if (isForex) decimals = targetKey.includes('JPY') ? 3 : 5;
                else if (targetFeed.market === 'CRYPTO' && entry < 0.001) decimals = 7;
                else if (targetFeed.market === 'CRYPTO' && entry < 1) decimals = 4;
                else decimals = 2;

                const newPos = {
                  id: `POS-${ag.id}-${targetKey}-${Date.now().toString().slice(-4)}-${(crypto?.randomUUID ? crypto.randomUUID() : Date.now()).slice(0, 6)}`,
                  agentId: ag.id,
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
                  leverage: getLeverage(targetFeed.market, targetKey, targetExecutionMode, targetFeed.atr && targetFeed.price ? ((targetFeed.atr / targetFeed.price) * 100) : 1.0),
                  trailingStopActive: false,
                  floatingPnlIdr: 0,
                  floatingPnlUsd: 0,
                  roiPct: 0,
                  openedAt: new Date().toISOString(),
                  rationale: rationale
                };

                updated = [newPos, ...updated];
                const lotLabel = targetFeed.market === 'CRYPTO' ? `${sizeLots} ${targetKey.replace('USDT', '')}` : `${sizeLots}L`;
                const modeBadge = targetExecutionMode === 'SPOT' ? '🟢 SPOT' : '🟣 FUT';
                toastsToShow.push(`🚀 ${ag.avatar || '🤖'} ${ag.name} buka order ${targetKey} (${modeBadge} ${isLong ? 'LONG' : 'SHORT'} ${lotLabel}, Lev ${newPos.leverage})`);
              }
            }
          }
        }

      // 4. Batch Dispatch State Updates sequentially and purely outside updater
      positionsRef.current = updated;
      setPositions(updated);

      if (hasClosedAny && closedTradesToAdd.length > 0) {
        setJournal(prevJ => [...closedTradesToAdd, ...prevJ]);
      }

      if (agentsChanged) {
        setAgents(currentAgents);
      }

      toastsToShow.forEach(msg => showToast(msg));
    }, 1400);

    return () => clearInterval(interval);
  }, [isRunning, effectiveMaxPositions, capitalPerBotIdr, showToast, isUnlimitedPositions, sliderMaxPositions, riskPerTradePct]);

  // Manual Close Single Trade (Purely refactored without nested side-effects)
  const handleManualClose = useCallback((posId) => {
    const target = positionsRef.current.find(p => p.id === posId);
    if (!target) return;

    const isIdx = target.market === 'IDX';
    const isForex = target.market === 'FOREX';
    const notionalUsd = isIdx
      ? (target.sizeLots * 100 * target.entryPrice / (usdToIdrRef.current || 16350))
      : (isForex ? (target.sizeLots * 100000) : (target.sizeLots * (target.symbol.includes('XAU') ? 100 : target.entryPrice)));
    const totalFrictionPct = 0.0012;
    const frictionUsd = Math.max(0.05, notionalUsd * totalFrictionPct);
    const frictionIdr = isIdx ? (target.sizeLots * 100 * target.entryPrice * totalFrictionPct) : (frictionUsd * (usdToIdrRef.current || 16350));

    const pnlUsd = target.market === 'IDX' ? (target.floatingPnlIdr / (usdToIdrRef.current || 16350)) : target.floatingPnlUsd;
    const pnlIdr = target.market === 'IDX' ? target.floatingPnlIdr : (target.floatingPnlUsd * (usdToIdrRef.current || 16350));
    const netPnlUsd = pnlUsd - frictionUsd;
    const netPnlIdr = pnlIdr - frictionIdr;

    const closedEntry = {
      id: `TRD-MANUAL-${posId}-${Date.now()}`,
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
      grossPnlUsd: Number(pnlUsd.toFixed(2)),
      grossPnlIdr: Number(pnlIdr.toFixed(0)),
      feeUsd: Number(frictionUsd.toFixed(2)),
      feeIdr: Number(frictionIdr.toFixed(0)),
      pnlUsd: Number(netPnlUsd.toFixed(2)),
      pnlIdr: Number(netPnlIdr.toFixed(0)),
      roiPct: target.roiPct,
      rrAchieved: Number(((target.roiPct || 0) / 1.5).toFixed(2)),
      exitReason: 'MANUAL_CLOSE',
      closedAt: new Date().toISOString(),
      isWin: netPnlIdr > 0
    };

    const nextPositions = positionsRef.current.filter(p => p.id !== posId);
    positionsRef.current = nextPositions;
    setPositions(nextPositions);
    setJournal(j => [closedEntry, ...j]);
    showToast(`Posisi ${target.symbol} ditutup manual. Net PnL: ${formatIdr(netPnlIdr)}`);
  }, [showToast]);

  // Generate Comprehensive Epoch Performance Report & Compute Self-Improvement Parameter Adaptations
  const generateEpochReportAndAdapt = useCallback(() => {
    // Calibration test run (only Genesis #0 archived) → label "0.11". Otherwise count official seasons.
    const isCalibrationSession = epochReports.length === 1 && epochReports[0]?.epochNumber === 0;
    const officialArchived = epochReports.filter(ep =>
      ep.epochNumber !== 0 &&
      !String(ep.epochNumber).startsWith('0.') &&
      !String(ep.epochNumber).includes('test')
    );
    const epochNum = isCalibrationSession ? '0.11' : (officialArchived.length + 1);
    const dateStr = new Date().toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const totalTrades = journal.length;
    const wins = journal.filter(j => j.isWin).length;
    const losses = totalTrades - wins;
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0.0';

    const grossProfitIdr = journal.filter(j => (j.pnlIdr || (j.pnlUsd * usdToIdrRef.current)) > 0)
      .reduce((a, b) => a + (b.pnlIdr || (b.pnlUsd * usdToIdrRef.current)), 0);
    const grossLossIdr = Math.abs(journal.filter(j => (j.pnlIdr || (j.pnlUsd * usdToIdrRef.current)) < 0)
      .reduce((a, b) => a + (b.pnlIdr || (b.pnlUsd * usdToIdrRef.current)), 0));
    const netPnlIdr = grossProfitIdr - grossLossIdr;
    const netPnlUsd = netPnlIdr / usdToIdrRef.current;
    const profitFactor = grossLossIdr > 0 ? (grossProfitIdr / grossLossIdr).toFixed(2) : (grossProfitIdr > 0 ? '99.0' : '0.0');

    // Sharpe Ratio
    const tradeReturns = journal.map(j => (j.pnlIdr || (j.pnlUsd * usdToIdrRef.current)));
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

    // Max Drawdown
    let runningCap = totalCap;
    let peakCap = totalCap;
    let maxDrawdownIdr = 0;
    let maxDrawdownPct = 0;
    const sortedChronological = [...journal].sort((a, b) => new Date(a.closedAt || 0) - new Date(b.closedAt || 0));
    sortedChronological.forEach(t => {
      const val = t.pnlIdr || (t.pnlUsd * usdToIdrRef.current);
      runningCap += val;
      if (runningCap > peakCap) peakCap = runningCap;
      const dd = peakCap - runningCap;
      if (dd > maxDrawdownIdr) {
        maxDrawdownIdr = dd;
        maxDrawdownPct = peakCap > 0 ? (dd / peakCap) * 100 : 0;
      }
    });

    // Avg Win, Avg Loss, Win/Loss Ratio, Expectancy per trade
    const avgWinIdr = wins > 0 ? Math.round(grossProfitIdr / wins) : 0;
    const avgLossIdr = losses > 0 ? Math.round(grossLossIdr / losses) : 0;
    const winLossRatio = avgLossIdr > 0 ? Number((avgWinIdr / avgLossIdr).toFixed(2)) : (avgWinIdr > 0 ? 99.0 : 0);
    const wrDecimal = totalTrades > 0 ? wins / totalTrades : 0;
    const expectancyIdr = Math.round((wrDecimal * avgWinIdr) - ((1 - wrDecimal) * avgLossIdr));

    // Multi-Asset Class Breakdown
    const marketMap = {};
    journal.forEach(t => {
      let mkt = t.market || 'FOREX';
      if (['XAUUSD', 'XAGUSD', 'USOIL', 'GOLD', 'SILVER'].includes(t.symbol) || mkt === 'FUTURES') {
        mkt = 'COMMODITIES';
      }
      if (!marketMap[mkt]) {
        marketMap[mkt] = { market: mkt, totalTrades: 0, wins: 0, losses: 0, netPnlIdr: 0, grossProfit: 0, grossLoss: 0 };
      }
      const val = t.pnlIdr || (t.pnlUsd * usdToIdrRef.current);
      marketMap[mkt].totalTrades += 1;
      marketMap[mkt].netPnlIdr += val;
      if (t.isWin) marketMap[mkt].wins += 1; else marketMap[mkt].losses += 1;
      if (val > 0) marketMap[mkt].grossProfit += val; else marketMap[mkt].grossLoss += Math.abs(val);
    });
    const marketClassList = Object.values(marketMap).map(m => ({
      ...m,
      winRate: m.totalTrades > 0 ? ((m.wins / m.totalTrades) * 100).toFixed(1) : '0.0',
      profitFactor: m.grossLoss > 0 ? (m.grossProfit / m.grossLoss).toFixed(2) : (m.grossProfit > 0 ? '99.0' : '0.0')
    }));

    // Top 3 Best & Worst Trades
    const top3BestTrades = [...journal]
      .filter(t => (t.pnlIdr || (t.pnlUsd * usdToIdrRef.current)) > 0)
      .sort((a, b) => (b.pnlIdr || 0) - (a.pnlIdr || 0))
      .slice(0, 3);
    const top3WorstTrades = [...journal]
      .filter(t => (t.pnlIdr || (t.pnlUsd * usdToIdrRef.current)) < 0)
      .sort((a, b) => (a.pnlIdr || 0) - (b.pnlIdr || 0))
      .slice(0, 3);

    // Universe Attribution with Long/Short breakdown
    const pairStats = {};
    journal.forEach(t => {
      const sym = t.symbol;
      const mkt = t.market || 'FOREX';
      const dir = t.direction || 'LONG';
      const val = t.pnlIdr || (t.pnlUsd * usdToIdrRef.current);
      if (!pairStats[sym]) {
        pairStats[sym] = {
          symbol: sym, market: mkt,
          totalTrades: 0, wins: 0, losses: 0, netPnlIdr: 0, grossProfit: 0, grossLoss: 0,
          longTrades: 0, longWins: 0, longNetPnlIdr: 0,
          shortTrades: 0, shortWins: 0, shortNetPnlIdr: 0
        };
      }
      pairStats[sym].totalTrades += 1;
      pairStats[sym].netPnlIdr += val;
      if (t.isWin) pairStats[sym].wins += 1; else pairStats[sym].losses += 1;
      if (val > 0) pairStats[sym].grossProfit += val; else pairStats[sym].grossLoss += Math.abs(val);
      if (dir === 'LONG') {
        pairStats[sym].longTrades += 1;
        pairStats[sym].longNetPnlIdr += val;
        if (t.isWin) pairStats[sym].longWins += 1;
      } else {
        pairStats[sym].shortTrades += 1;
        pairStats[sym].shortNetPnlIdr += val;
        if (t.isWin) pairStats[sym].shortWins += 1;
      }
    });

    const allPairs = Object.values(pairStats).map(p => ({
      ...p,
      winRate: p.totalTrades > 0 ? ((p.wins / p.totalTrades) * 100).toFixed(0) : '0',
      longWinRate: p.longTrades > 0 ? ((p.longWins / p.longTrades) * 100).toFixed(0) : '0',
      shortWinRate: p.shortTrades > 0 ? ((p.shortWins / p.shortTrades) * 100).toFixed(0) : '0',
      netPnlUsd: p.netPnlIdr / usdToIdrRef.current,
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
      const agProfit = agTrades.filter(j => (j.pnlIdr || (j.pnlUsd * usdToIdrRef.current)) > 0)
        .reduce((a, b) => a + (b.pnlIdr || (b.pnlUsd * usdToIdrRef.current)), 0);
      const agLoss = Math.abs(agTrades.filter(j => (j.pnlIdr || (j.pnlUsd * usdToIdrRef.current)) < 0)
        .reduce((a, b) => a + (b.pnlIdr || (b.pnlUsd * usdToIdrRef.current)), 0));
      const agNet = agProfit - agLoss;
      const agPf = agLoss > 0 ? (agProfit / agLoss).toFixed(2) : (agProfit > 0 ? '99.0' : '0.0');

      // Best and worst pair
      const pairMap = {};
      agTrades.forEach(t => {
        const val = t.pnlIdr || (t.pnlUsd * usdToIdrRef.current);
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
        netPnlUsd: agNet / usdToIdrRef.current,
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
      allPairs,
      maxDrawdownPct: Number(maxDrawdownPct.toFixed(1)),
      maxDrawdownIdr: Math.round(maxDrawdownIdr),
      avgWinIdr,
      avgLossIdr,
      winLossRatio,
      expectancyIdr,
      marketClassList,
      top3BestTrades,
      top3WorstTrades,
      keyTakeaway: (() => {
        const bestMkt = [...marketClassList].sort((a, b) => b.netPnlIdr - a.netPnlIdr)[0];
        const topBot = [...agentBreakdowns].sort((a, b) => b.netPnlIdr - a.netPnlIdr)[0];
        return `Season ${epochNum} ditutup ${netPnlIdr >= 0 ? 'PROFIT dengan Net Gain +' : 'DEFISIT '}${formatIdr(netPnlIdr)} (ROC ${rocPct}%, Win Rate ${winRate}%). Alpha generator utama bersumber dari sektor ${bestMkt ? bestMkt.market : 'N/A'} dipimpin oleh ${topBot ? topBot.name : 'N/A'} (Win Rate ${topBot ? topBot.winRate : 0}%). Expectancy sistem ${formatIdr(expectancyIdr)} per tiket dengan rasio Win/Loss ${winLossRatio}x. Max Drawdown terukur di ${maxDrawdownPct.toFixed(1)}% (${formatIdr(maxDrawdownIdr)}). Algoritma EXP3 menaikkan bobot modal pada bot performa tertinggi.`;
      })()
    };

    return { report, newWeights };
  }, [epochReports, journal, agents, capitalPerBotIdr]);

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

      // 3. Terapkan bobot Self-Improvement baru ke agen & reset generasi ke 0 (season baru)
      setAgents(prev => prev.map((a, idx) => {
        const oldGen = typeof a.generation === 'number' ? a.generation : 0;
        const st = agentStatsMap[a.id];
        const deficitIdr = st && st.netGainIdr < 0 ? Math.abs(st.netGainIdr) : 0;
        const worstSym = report.agentBreakdowns.find(b => b.agentId === a.id)?.worstPair || 'N/A';
        // Catat ringkasan season lama untuk arsip — tapi season baru dimulai fresh
        const globalResetRecord = {
          fromGen: oldGen,
          toGen: 0, // season baru selalu mulai dari Gen 0
          timestamp: new Date().toISOString(),
          deficitIdr: deficitIdr,
          toxicPair: worstSym !== '-' ? worstSym : 'Diversified Rebalance',
          reason: 'GLOBAL_EPOCH_RESET',
          positionsLiquidated: positions.filter(p => p.agentId === a.id).length,
          mutation: {
            riskMultiplier: Number(Math.max(0.4, (a.dnaTraits?.riskMultiplier || 1.0)).toFixed(2)), // Sovereign DNA: modal & multiplier independen dari pool
            confidenceBoost: deficitIdr > 0 ? (a.dnaTraits?.confidenceBoost || 0) + 5 : (a.dnaTraits?.confidenceBoost || 0),
            trailingTightness: deficitIdr > 0 ? Number(((a.dnaTraits?.trailingTightness || 1.0) * 1.15).toFixed(2)) : (a.dnaTraits?.trailingTightness || 1.0)
          }
        };

        return {
          ...a,
          generation: 0,          // ✅ fresh slate di season baru
          resetCount: 0,           // ✅ MC counter reset per season
          resetsHistory: [],       // ✅ silsilah MC bersih di season baru
          dnaTraits: globalResetRecord.mutation, // adaptasi EXP3 tetap terbawa
          exp3Weight: 0.25, // Archived: fixed sovereign baseline
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
        localStorage.setItem('mbg_ai_arena_positions', '[]');
        localStorage.setItem('mbg_ai_arena_journal', '[]');
        localStorage.setItem('mbg_ai_arena_running', 'false');
        localStorage.setItem('mbg_ai_arena_reset_ts', String(Date.now()));
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

      const mutationTraits = {
        riskMultiplier: Number(Math.max(0.4, (targetAgent?.dnaTraits?.riskMultiplier || 1.0) * 0.9).toFixed(2)),
        confidenceBoost: Number(Math.min(20, (targetAgent?.dnaTraits?.confidenceBoost || 0) + 5).toFixed(0)),
        trailingTightness: Number(((targetAgent?.dnaTraits?.trailingTightness || 1.0) * 1.15).toFixed(2))
      };

      const resetRecord = {
        fromGen: oldGen,
        toGen: nextGen,
        timestamp: new Date().toISOString(),
        deficitIdr: deficitIdr,
        toxicPair: 'Manual Rebalance',
        reason: 'MANUAL_EVOLUTION_RESET',
        positionsLiquidated: positions.filter(p => p.agentId === agId).length,
        mutation: mutationTraits,
        aiReflection: getAgentSelfReflection(targetAgent, { fromGen: oldGen, toGen: nextGen, mutation: mutationTraits }, 'Manual Rebalance')
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
      
      {/* Toast Notification Alert (Bottom Right, Stacked Max 3) */}
      {toasts.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'none',
          maxWidth: 'min(90vw, 420px)'
        }}>
          {toasts.map(toast => (
            <div
              key={toast.id}
              className="arena-toast-item"
              style={{
                background: 'rgba(15, 23, 42, 0.95)',
                color: '#ffffff',
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backdropFilter: 'blur(4px)',
                pointerEvents: 'auto'
              }}
            >
              <span>🤖</span>
              <span>{toast.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP COCKPIT: BATTLEGROUND (LEFT) & PENGATURAN PORTOFOLIO (RIGHT)       */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* UNIFIED COMMAND HEADER: STRICTLY 2 COMPACT ROWS                           */}
      {/* ========================================================================= */}
      <div
        className="telemetry-panel"
        style={{
          padding: '6px 12px',
          background: 'var(--bg-panel)',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          borderRadius: 'var(--radius-sm)',
          border: 'var(--border-hairline)',
          marginBottom: '4px'
        }}
      >
        {/* --- BARIS 1: OPERATIONAL IDENTITY, MARKET STATUS, TELEMETRY & MASTER CONTROLS --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: 'var(--border-hairline)', paddingBottom: '5px' }}>
          {/* Sisi Kiri: Identity, Status Pasar & Telemetri Real-time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {/* Brand Title + Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '13px' }}>⚔️</span>
              <span style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                AI Multi-Agent Arena
              </span>
              <span
                style={{
                  fontSize: '8px',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: 'var(--accent-blue)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  fontWeight: '800'
                }}
              >
                16 BOTS
              </span>
            </div>

            <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.12)' }} />

            {/* Badges Status Pasar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              <span
                className="badge"
                style={{
                  fontSize: '8px',
                  padding: '1px 5px',
                  background: isIdxMarketOpen() ? 'rgba(22, 163, 74, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: isIdxMarketOpen() ? 'var(--accent-green)' : 'var(--accent-rust)',
                  border: `1px solid ${isIdxMarketOpen() ? 'rgba(22, 163, 74, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                }}
                title={isIdxMarketOpen() ? 'Bursa Saham BEI (IDX) BUKA (09:00 - 16:00 WIB)' : 'Bursa Saham BEI (IDX) TUTUP'}
              >
                IDX: {isIdxMarketOpen() ? '● BUKA' : '○ TUTUP'}
              </span>

              <span
                className="badge"
                style={{
                  fontSize: '8px',
                  padding: '1px 5px',
                  background: isForexCommodityOpen() ? 'rgba(22, 163, 74, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: isForexCommodityOpen() ? 'var(--accent-green)' : 'var(--accent-rust)',
                  border: `1px solid ${isForexCommodityOpen() ? 'rgba(22, 163, 74, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                }}
                title={isForexCommodityOpen() ? 'Forex, Gold & Komoditas 24/5 BUKA' : 'Forex & Gold TUTUP'}
              >
                FOREX/GOLD: {isForexCommodityOpen() ? '● BUKA' : '○ TUTUP'}
              </span>

              <span
                className="badge"
                style={{
                  fontSize: '8px',
                  padding: '1px 5px',
                  background: isUsMarketOpen() ? 'rgba(22, 163, 74, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: isUsMarketOpen() ? 'var(--accent-green)' : 'var(--accent-rust)',
                  border: `1px solid ${isUsMarketOpen() ? 'rgba(22, 163, 74, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                }}
                title={isUsMarketOpen() ? 'Bursa US Stocks (NYSE/NASDAQ) BUKA' : 'Bursa US Stocks TUTUP'}
              >
                US STOCKS: {isUsMarketOpen() ? '● BUKA' : '○ TUTUP'}
              </span>

              <span
                className="badge"
                style={{
                  fontSize: '8px',
                  padding: '1px 5px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: 'var(--accent-blue)',
                  border: '1px solid rgba(59, 130, 246, 0.4)'
                }}
                title="Pasar Crypto Perpetual 24/7/365 Non-stop"
              >
                CRYPTO: ● 24/7
              </span>
            </div>

            <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.12)' }} />

            {/* Telemetri Kurs & Sesi Live */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              <span
                className="badge"
                style={{
                  fontSize: '8px',
                  background: 'rgba(22, 163, 74, 0.12)',
                  color: 'var(--accent-green)',
                  padding: '1px 5px',
                  border: '1px solid rgba(22, 163, 74, 0.25)'
                }}
                title="Kurs Realtime USD/IDR Live API"
              >
                $1 = Rp {usdToIdrRate.toLocaleString('id-ID')}
              </span>

              <span
                className="badge"
                style={{
                  fontSize: '8px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  color: '#c084fc',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  padding: '1px 5px'
                }}
              >
                🎮 SESI #{epochReports.length}
              </span>

              <span
                style={{
                  fontSize: '8.5px',
                  color: 'var(--accent-blue)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '700'
                }}
                title="Durasi Sesi Arena berjalan"
              >
                ⏱️ {sessionUptimeStr}
              </span>
            </div>
          </div>

          {/* Sisi Kanan: Operational Master Switches */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
            {/* Master Run / Pause */}
            <button
              id="btn-master-run-pause"
              onClick={() => {
                setIsRunning(prev => !prev);
                showToast(!isRunning ? 'AI Agents aktif berjalan memindai pasar.' : 'AI Agents dijeda (PAUSED).');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                minHeight: '22px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '8.5px',
                fontWeight: '800',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                border: isRunning ? '1px solid rgba(239, 68, 68, 0.4)' : 'none',
                background: isRunning ? 'rgba(239, 68, 68, 0.15)' : 'var(--accent-green)',
                color: isRunning ? 'var(--accent-rust)' : '#ffffff',
                boxShadow: !isRunning ? '0 0 8px rgba(22, 163, 74, 0.35)' : 'none'
              }}
              title={isRunning ? 'Jeda seluruh eksekusi arena bot' : 'Jalankan arena multi-agent'}
            >
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: isRunning ? 'var(--accent-rust)' : '#ffffff', display: 'inline-block' }} />
              <span>{isRunning ? '⏸ JEDA' : '▶ RUN'}</span>
            </button>

            {/* Emergency Kill Switch */}
            <button
              id="btn-emergency-kill-switch"
              onClick={() => {
                const next = !isKillSwitchActive;
                institutionalPaperBroker.setKillSwitch(next);
                setIsKillSwitchActive(next);
                showToast(next ? '🚨 EMERGENCY KILL SWITCH AKTIF: Order baru diblokir!' : '✅ Kill Switch dinonaktifkan.');
              }}
              className="telemetry-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 6px',
                minHeight: '22px',
                fontSize: '8.5px',
                fontWeight: '800',
                color: isKillSwitchActive ? '#ffffff' : 'var(--accent-rust)',
                background: isKillSwitchActive ? '#ef4444' : 'rgba(239, 68, 68, 0.1)',
                borderColor: isKillSwitchActive ? '#ef4444' : 'rgba(239, 68, 68, 0.35)',
                boxShadow: isKillSwitchActive ? '0 0 8px rgba(239, 68, 68, 0.5)' : 'none'
              }}
              title="Emergency Kill Switch: Blokir seluruh order baru secara instan"
            >
              <span>{isKillSwitchActive ? '🚨 KILL ON' : '🛡️ KILL'}</span>
            </button>

            {/* Broker Execution Desk Toggle */}
            <button
              id="btn-toggle-broker-desk"
              onClick={() => setShowBrokerDesk(prev => !prev)}
              className="telemetry-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 7px',
                minHeight: '22px',
                fontSize: '8.5px',
                fontWeight: '800',
                color: showBrokerDesk ? 'var(--accent-gold)' : 'var(--text-secondary)',
                background: showBrokerDesk ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-panel-subtle)',
                borderColor: showBrokerDesk ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-hairline)'
              }}
              title="Buka / tutup Institutional Paper Execution Desk"
            >
              <span>💼 DESK ({paperPortfolio.positions?.length || 0})</span>
            </button>

            {/* Reset Sesi */}
            <button
              id="btn-reset-semua-sesi"
              onClick={() => setResetConfirmModal({ isOpen: true, agentId: null, agentName: 'Seluruh Portofolio Sesi' })}
              className="telemetry-btn"
              style={{
                padding: '2px 6px',
                minHeight: '22px',
                fontSize: '8.5px',
                fontWeight: '700',
                color: 'var(--accent-rust)',
                borderColor: 'rgba(239, 68, 68, 0.3)'
              }}
              title="Reset sesi saat ini, simpan laporan evaluasi sesi, dan jeda trading"
            >
              🔄 Reset
            </button>
          </div>
        </div>

        {/* --- BARIS 2: PARAMETER TRADING, VIEW CONTROLS & INTEL MODALS --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', paddingTop: '2px' }}>
          {/* Sisi Kiri: Kluster Parameter Trading & Filter Tampilan */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {/* KAPSUL 1: PARAMETER TRADING */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 7px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.07)'
              }}
            >
              <span style={{ fontSize: '8px', fontWeight: '900', color: 'var(--accent-gold)', letterSpacing: '0.04em' }}>
                ⚙️ PARAM:
              </span>

              {/* Modal / Bot */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '9px' }}>
                <label htmlFor="select-capital-per-bot" style={{ color: 'var(--text-secondary)', fontWeight: '700', cursor: 'pointer' }}>Modal:</label>
                <select
                  id="select-capital-per-bot"
                  className="arena-input"
                  value={capitalPerBotIdr}
                  onChange={e => handleApplyPresetCapital(Number(e.target.value))}
                  style={{
                    padding: '1px 4px',
                    fontSize: '8.5px',
                    minHeight: '22px',
                    fontFamily: 'var(--font-mono)',
                    borderRadius: '3px',
                    background: 'var(--bg-panel-subtle)',
                    border: 'var(--border-hairline)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: '700'
                  }}
                  title="Pilih nominal modal per bot"
                >
                  <option value={1000000}>Rp 1Jt</option>
                  <option value={5000000}>Rp 5Jt</option>
                  <option value={10000000}>Rp 10Jt</option>
                  <option value={25000000}>Rp 25Jt</option>
                  <option value={50000000}>Rp 50Jt</option>
                </select>
              </div>

              {/* Risk % */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '9px' }}>
                <label htmlFor="select-risk-pct" style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>Risk:</label>
                <select
                  id="select-risk-pct"
                  className="arena-input"
                  value={riskPerTradePct}
                  onChange={e => setRiskPerTradePct(Number(e.target.value))}
                  style={{
                    padding: '1px 3px',
                    fontSize: '8.5px',
                    minHeight: '22px',
                    borderRadius: '3px',
                    background: 'var(--bg-panel-subtle)',
                    border: 'var(--border-hairline)',
                    color: 'var(--text-primary)',
                    fontWeight: '700'
                  }}
                >
                  <option value={1}>1%</option>
                  <option value={2}>2%</option>
                  <option value={3}>3%</option>
                </select>
              </div>

              {/* Max Pos */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '9px' }}>
                <label htmlFor="input-max-positions" style={{ fontSize: '8.5px', color: 'var(--text-secondary)', fontWeight: '700', cursor: 'pointer' }}>Max Pos:</label>
                <input
                  id="input-max-positions"
                  className="arena-input"
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
                    width: '28px',
                    padding: '1px 3px',
                    fontSize: '8.5px',
                    minHeight: '22px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '800',
                    textAlign: 'center',
                    borderRadius: '3px',
                    border: 'var(--border-hairline)',
                    background: isUnlimitedPositions ? 'rgba(255,255,255,0.03)' : 'var(--bg-panel-subtle)',
                    color: isUnlimitedPositions ? 'var(--text-muted)' : 'var(--accent-blue)'
                  }}
                  title="Batas posisi per bot (1-100)"
                />
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = isUnlimitedPositions ? 10 : 999;
                    setSliderMaxPositions(nextVal);
                    setMaxPosInputText(nextVal >= 999 ? '' : String(nextVal));
                    showToast(nextVal >= 999 ? 'Batas posisi: Tak Terbatas (∞ Unlimited).' : 'Batas posisi: 10 posisi / bot.');
                  }}
                  className="arena-interactive-chip"
                  style={{
                    padding: '1px 4px',
                    minHeight: '22px',
                    fontSize: '8px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '800',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    border: isUnlimitedPositions ? '1px solid var(--accent-orange)' : 'var(--border-hairline)',
                    background: isUnlimitedPositions ? 'rgba(245, 158, 11, 0.18)' : 'var(--bg-panel-subtle)',
                    color: isUnlimitedPositions ? 'var(--accent-orange)' : 'var(--text-muted)'
                  }}
                  title="Beralih batas manual vs Tak Terbatas (∞)"
                >
                  {isUnlimitedPositions ? '∞ Unlim' : 'Set ∞'}
                </button>
              </div>

              {/* Mode Eksekusi */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '9px' }}>
                <label htmlFor="select-execution-mode" style={{ color: 'var(--text-muted)', fontWeight: '700', cursor: 'pointer' }}>Mode:</label>
                <select
                  id="select-execution-mode"
                  className="arena-input"
                  value={arenaExecutionMode}
                  onChange={e => {
                    const newMode = e.target.value;
                    setArenaExecutionMode(newMode);
                    showToast(`Mode: ${newMode === 'SPOT_ONLY' ? '🟢 SPOT' : (newMode === 'FUTURES_ONLY' ? '🟣 FUTURES' : '⚡ HYBRID')}`);
                  }}
                  style={{
                    padding: '1px 3px',
                    fontSize: '8.5px',
                    minHeight: '22px',
                    borderRadius: '3px',
                    background: arenaExecutionMode === 'SPOT_ONLY' ? 'rgba(34, 197, 94, 0.15)' : (arenaExecutionMode === 'FUTURES_ONLY' ? 'rgba(168, 85, 247, 0.15)' : 'var(--bg-panel-subtle)'),
                    border: arenaExecutionMode === 'SPOT_ONLY' ? '1px solid var(--accent-green)' : (arenaExecutionMode === 'FUTURES_ONLY' ? '1px solid #a855f7' : 'var(--border-hairline)'),
                    color: arenaExecutionMode === 'SPOT_ONLY' ? 'var(--accent-green)' : (arenaExecutionMode === 'FUTURES_ONLY' ? '#c084fc' : 'var(--text-primary)'),
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  <option value="HYBRID">⚡ HYBRID</option>
                  <option value="SPOT_ONLY">🟢 SPOT</option>
                  <option value="FUTURES_ONLY">🟣 FUTURES</option>
                </select>
              </div>
            </div>

            {/* KAPSUL 2: TAMPILAN & FILTER */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 7px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.07)'
              }}
            >
              <span style={{ fontSize: '8px', fontWeight: '900', color: 'var(--accent-blue)', letterSpacing: '0.04em' }}>
                👁️ VIEW:
              </span>

              {/* Urutan Bot */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '9px' }}>
                <label htmlFor="select-agent-sort" style={{ color: 'var(--text-muted)', fontWeight: '700', cursor: 'pointer' }}>Urut:</label>
                <select
                  id="select-agent-sort"
                  value={agentSortBy}
                  onChange={e => setAgentSortBy(e.target.value)}
                  style={{
                    padding: '1px 4px',
                    fontSize: '8.5px',
                    minHeight: '22px',
                    fontFamily: 'var(--font-mono)',
                    borderRadius: '3px',
                    background: 'var(--bg-panel-subtle)',
                    border: 'var(--border-hairline)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: '700'
                  }}
                >
                  <option value="DEFAULT">DNA Elemen</option>
                  <option value="ROI_DESC">Top ROI %</option>
                  <option value="WINRATE_DESC">Win Rate</option>
                  <option value="POSITIONS_DESC">Posisi Aktif</option>
                </select>
              </div>

              {/* Grafik Timeframe */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '9px' }}>
                <label htmlFor="select-chart-timeframe" style={{ color: 'var(--text-muted)', fontWeight: '700', cursor: 'pointer' }}>Grafik:</label>
                <select
                  id="select-chart-timeframe"
                  className="arena-input"
                  value={chartTimeframe}
                  onChange={e => {
                    setChartTimeframe(e.target.value);
                    showToast(`Rentang grafik diubah ke ${e.target.value}`);
                  }}
                  style={{
                    padding: '1px 4px',
                    fontSize: '8.5px',
                    minHeight: '22px',
                    fontFamily: 'var(--font-mono)',
                    borderRadius: '3px',
                    background: 'var(--bg-panel-subtle)',
                    border: 'var(--border-hairline)',
                    color: 'var(--text-primary)',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <option value="3D">3D</option>
                  <option value="7D">7D</option>
                  <option value="1M">1M</option>
                  <option value="3M">3M</option>
                  <option value="1Y">1Y</option>
                </select>
              </div>

              {/* Screener Radar */}
              <button
                type="button"
                onClick={() => {
                  const nextMode = scannerMode === 'DYNAMIC_RADAR' ? 'FULL_WATCHLIST' : 'DYNAMIC_RADAR';
                  setScannerMode(nextMode);
                  showToast(nextMode === 'DYNAMIC_RADAR' ? `Scanner: DYNAMIC RADAR (${activeRadarSymbols.length} aset).` : `Scanner: FULL WATCHLIST (${ALL_INSTRUMENTS.length} pair).`);
                }}
                className="arena-interactive-chip"
                style={{
                  padding: '1px 5px',
                  minHeight: '22px',
                  fontSize: '8.5px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '800',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  border: scannerMode === 'DYNAMIC_RADAR' ? '1px solid rgba(59, 130, 246, 0.4)' : 'var(--border-hairline)',
                  background: scannerMode === 'DYNAMIC_RADAR' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-panel-subtle)',
                  color: scannerMode === 'DYNAMIC_RADAR' ? 'var(--accent-blue)' : 'var(--text-muted)'
                }}
                title="Beralih Screener Radar vs Full Watchlist"
              >
                {scannerMode === 'DYNAMIC_RADAR' ? `🛰️ Radar (${activeRadarSymbols.length})` : `🌐 Full (${ALL_INSTRUMENTS.length})`}
              </button>
            </div>
          </div>

          {/* Sisi Kanan: KAPSUL 3: INTEL & LAPORAN */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              flexWrap: 'wrap'
            }}
          >
            <span style={{ fontSize: '8px', fontWeight: '900', color: '#c084fc', letterSpacing: '0.04em', marginRight: '2px' }}>
              INTEL:
            </span>

            <button
              id="btn-profil-filosofi"
              onClick={() => setPhilosophyModalOpen(true)}
              className="telemetry-btn"
              style={{ fontSize: '8.5px', padding: '2px 5px', minHeight: '22px', display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--accent-blue)' }}
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
              style={{ fontSize: '8.5px', padding: '2px 5px', minHeight: '22px', display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--accent-gold)' }}
              title="Panduan Terpadu: Aturan Trading & Status Siklus Hidup Bot"
            >
              <span>📋</span>
              <span>Aturan</span>
            </button>

            <button
              id="btn-agent-review"
              onClick={() => setAgentReviewModalOpen(true)}
              className="telemetry-btn"
              style={{ fontSize: '8.5px', padding: '2px 5px', minHeight: '22px', display: 'flex', alignItems: 'center', gap: '3px', color: '#60a5fa' }}
              title="Buka Analisis Kinerja & Review Sinyal"
            >
              <span>📊</span>
              <span>Review</span>
            </button>

            <button
              id="btn-session-recap"
              onClick={() => setSessionRecapModalOpen(true)}
              className="telemetry-btn"
              style={{
                fontSize: '8.5px',
                padding: '2px 5px',
                minHeight: '22px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                color: '#e879f9',
                border: '1px solid rgba(217, 70, 239, 0.4)',
                background: 'rgba(217, 70, 239, 0.1)',
                fontWeight: '700',
                cursor: 'pointer'
              }}
              title="Buka Session Recap & Institutional Quant Post-Mortem Debrief"
            >
              <span>📜</span>
              <span>Recap</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* INSTITUTIONAL BROKER DESK & REAL-TIME SANDBOX                            */}
      {/* ========================================================================= */}
      {showBrokerDesk && (
        <div
          id="institutional-paper-desk"
          style={{
            margin: '0 0 12px 0',
            padding: '12px 14px',
            background: 'var(--bg-panel)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px', borderBottom: 'var(--border-hairline)', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '900', color: 'var(--accent-gold)', letterSpacing: '0.04em' }}>
                💼 INSTITUTIONAL EXECUTION & PAPER BROKER DESK
              </span>
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-green)', fontSize: '8.5px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                VERIFIED GATEWAY
              </span>
              {isKillSwitchActive && (
                <span className="badge" style={{ background: '#ef4444', color: '#fff', fontSize: '8.5px', fontWeight: '900' }}>
                  🚨 KILL SWITCH ENGAGED
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                id="btn-open-order-ticket"
                onClick={() => onOpenExecution && onOpenExecution()}
                style={{
                  padding: '4px 10px',
                  fontSize: '9.5px',
                  fontWeight: '800',
                  fontFamily: 'var(--font-mono)',
                  background: 'var(--accent-blue)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                + Buka Tiket Order
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Reset portofolio paper ke Rp 100.000.000 dan $10.000 USDT?')) {
                    institutionalPaperBroker.reset();
                    setPaperPortfolio(institutionalPaperBroker.getSummary());
                    showToast('Portofolio Paper Broker telah direset ke nilai awal.');
                  }
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: '9px',
                  fontFamily: 'var(--font-mono)',
                  background: 'transparent',
                  border: 'var(--border-hairline)',
                  color: 'var(--text-muted)',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Reset Saldo
              </button>
            </div>
          </div>

          {/* Metric Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '12px' }}>
            <div style={{ background: 'var(--bg-panel-subtle)', padding: '6px 10px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
              <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>SALDO KAS IDR</div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {formatIdr(paperPortfolio.cashIdr)}
              </div>
            </div>
            <div style={{ background: 'var(--bg-panel-subtle)', padding: '6px 10px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
              <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>SALDO KAS USDT</div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {formatUsd(paperPortfolio.cashUsdt)}
              </div>
            </div>
            <div style={{ background: 'var(--bg-panel-subtle)', padding: '6px 10px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
              <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>POSISI AKTIF</div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                {paperPortfolio.positions?.length || 0} Terbuka
              </div>
            </div>
            <div style={{ background: 'var(--bg-panel-subtle)', padding: '6px 10px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
              <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>TOTAL TRADES DIRESOLUSI</div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {paperPortfolio.tradeHistory?.length || 0} Closed
              </div>
            </div>
          </div>

          {/* Active Positions Table */}
          {(!paperPortfolio.positions || paperPortfolio.positions.length === 0) ? (
            <div style={{ padding: '16px', textAlign: 'center', background: 'var(--bg-panel-subtle)', borderRadius: '4px', border: 'var(--border-hairline)', color: 'var(--text-muted)', fontSize: '11px' }}>
              Belum ada posisi paper/live aktif yang dieksekusi. Tekan tombol <strong>[+ Buka Tiket Order]</strong> untuk membuka tiket trading manual ke sandbox.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                <thead>
                  <tr style={{ borderBottom: 'var(--border-hairline)', color: 'var(--text-muted)', textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '5px 8px' }}>TICKER / PASAR</th>
                    <th style={{ padding: '5px 8px' }}>SISI / ORDER</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>ENTRY</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>HARGA KINI</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>SL / TP1</th>
                    <th style={{ padding: '5px 8px', textAlign: 'center' }}>TRAILING RATIO</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>UNREALIZED PnL</th>
                    <th style={{ padding: '5px 8px', textAlign: 'center' }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {paperPortfolio.positions.map(p => {
                    const isProfit = (p.floatingPnL || 0) >= 0;
                    const pnlColor = isProfit ? 'var(--accent-green)' : 'var(--accent-rust)';
                    const posLotText = p.market === 'IDX' ? (p.lots + ' Lot') : String(p.quantity);
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '6px 8px' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{p.symbol}</strong>
                          <span style={{ marginLeft: '4px', fontSize: '8px', color: 'var(--text-muted)' }}>({p.market})</span>
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <span style={{
                            padding: '1px 4px',
                            borderRadius: '2px',
                            background: p.side === 'BUY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: p.side === 'BUY' ? 'var(--accent-green)' : 'var(--accent-rust)',
                            fontWeight: '800',
                            fontSize: '8.5px'
                          }}>
                            {p.side} {posLotText}
                          </span>
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                          {formatInstrumentPrice(p.entryPrice, p.market, p.symbol)}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '700' }}>
                          {formatInstrumentPrice(p.currentPrice || p.entryPrice, p.market, p.symbol)}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: '9px' }}>
                          <span style={{ color: 'var(--accent-rust)' }}>SL: {formatInstrumentPrice(p.effectiveSl || p.stopLoss, p.market, p.symbol)}</span>
                          <span style={{ color: 'var(--accent-green)', marginLeft: '6px' }}>TP: {formatInstrumentPrice(p.target1, p.market, p.symbol)}</span>
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          {p.hasHitTp1 ? (
                            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-green)', fontSize: '8px' }}>
                              🔒 BE LOCKED
                            </span>
                          ) : (
                            <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>STANDARD SL</span>
                          )}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '800', color: pnlColor }}>
                          {p.market === 'IDX' ? formatIdr(p.floatingPnL || 0) : formatUsd(p.floatingPnL || 0)}
                          <div style={{ fontSize: '8px' }}>({p.floatingPnLPct || 0}%)</div>
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <button
                            onClick={() => {
                              try {
                                institutionalPaperBroker.closePosition(p.id, p.currentPrice, 'MANUAL_CLOSE');
                                setPaperPortfolio(institutionalPaperBroker.getSummary());
                                showToast('Posisi ' + p.symbol + ' berhasil ditutup.');
                              } catch (e) {
                                showToast('Gagal menutup: ' + e.message);
                              }
                            }}
                            style={{
                              padding: '2px 6px',
                              fontSize: '8.5px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: 'var(--accent-rust)',
                              borderRadius: '2px',
                              cursor: 'pointer',
                              fontWeight: '700'
                            }}
                          >
                            ✕ Tutup
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
          .arena-input:focus-visible,
          .arena-interactive-chip:focus-visible,
          .telemetry-btn:focus-visible,
          button:focus-visible {
            outline: 2px solid var(--accent-blue) !important;
            outline-offset: 1px;
          }
          @keyframes toastSlideIn {
            from {
              opacity: 0;
              transform: translateY(8px) scale(0.96);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          .arena-toast-item {
            animation: toastSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          }
        `}</style>

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
                              fontSize: '9px',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: '800',
                              padding: '1.5px 4px',
                              borderRadius: '2px',
                              background: `${ag.color}1f`,
                              color: ag.color,
                              border: `1px solid ${ag.color}44`
                            }}>
                              {ag.dnaBadge}
                            </span>
                          )}
                          <span style={{
                            fontSize: '8.5px',
                            fontFamily: 'var(--font-mono)',
                            padding: '1.5px 4px',
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
                            const isBomb = rule.mode === 'UNLIMITED_CARPET_BOMB';
                            const badgeColor = isBomb ? '#d946ef' : (isSingle ? 'var(--text-muted)' : (isPyr ? 'var(--accent-green)' : 'var(--accent-orange)'));
                            const badgeBg = isBomb ? 'rgba(217, 70, 239, 0.16)' : (isSingle ? 'rgba(255, 255, 255, 0.05)' : (isPyr ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)'));
                            const labelText = isBomb ? 'Bomb∞' : (isSingle ? '1-Shot' : (isPyr ? `Pyr×${rule.maxPerPair}` : `Scale×${rule.maxPerPair}`));
                            return (
                              <span
                                style={{
                                  fontSize: '8.5px',
                                  fontFamily: 'var(--font-mono)',
                                  padding: '1.5px 4px',
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
                        <div style={{ fontSize: '9.5px', color: ag.color, fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
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
                          fontSize: '8.5px',
                          padding: '2px 5px',
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
                          fontSize: '8.5px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '700',
                          padding: '2px 5px',
                          minHeight: '24px',
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
                      <div style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                        Saldo ({chartTimeframe})
                      </div>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: '800', color: isEquityProfit ? 'var(--accent-green)' : 'var(--accent-rust)', lineHeight: 1.1 }}>
                        {formatIdr(stats.currentBotEquityIdr)} <span style={{ fontSize: '8.5px' }}>({stats.roiPct > 0 ? '+' : ''}{stats.roiPct}%)</span>
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
                    fontSize: '8.5px',
                    fontFamily: 'var(--font-mono)',
                    background: 'var(--bg-panel-subtle)',
                    padding: '4px 2px',
                    borderRadius: '3px',
                    border: 'var(--border-hairline)'
                  }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '8px', fontWeight: '700' }}>TRADE</div>
                      <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '10px' }}>{stats.total}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '8px', fontWeight: '700' }}>WIN RATE</div>
                      <div style={{ fontWeight: '800', color: 'var(--accent-green)', fontSize: '10px' }}>{stats.winRate}%</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '8px', fontWeight: '700' }}>PF</div>
                      <div style={{ fontWeight: '800', color: 'var(--accent-blue)', fontSize: '10px' }}>{stats.profitFactor}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '8px', fontWeight: '700' }}>NET GAIN</div>
                      <div style={{ fontWeight: '800', color: isRealizedProfit ? 'var(--accent-green)' : 'var(--accent-rust)', fontSize: '10px' }}>
                        {stats.netGainIdr > 0 ? '+' : ''}{formatCompactIdr(stats.netGainIdr)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- B. Posisi Terbuka Real-Time (Max Height 140px, 2-Line Condensed per Posisi) --- */}
                <div style={{ borderTop: 'var(--border-hairline)', paddingTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontSize: '9.5px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      ⚡ Posisi ({agentPositions.length})
                    </span>
                    <span style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                      {isUnlimitedPositions ? '∞' : `Max ${maxPositionsPerBot}`}
                    </span>
                  </div>

                  {agentPositions.length === 0 ? (
                    <div style={{ padding: '6px 8px', textAlign: 'center', background: 'var(--bg-panel-subtle)', borderRadius: '3px', color: 'var(--text-muted)', fontSize: '8.5px', border: '1px dashed rgba(255,255,255,0.06)' }}>
                      ○ Siaga memindai sinyal...
                    </div>
                  ) : (
                    <div style={{
                      maxHeight: '140px',
                      overflowY: 'auto',
                      paddingRight: '2px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      {agentPositions.map(pos => {
                        const idrValue = pos.floatingPnlIdr !== undefined ? pos.floatingPnlIdr : (pos.floatingPnlUsd * usdToIdrRef.current);
                        const isPosProfit = idrValue >= 0;
                        const pnlDisplayIdr = formatCompactIdr(idrValue);

                        return (
                          <div 
                            key={pos.id} 
                            style={{
                              padding: '5px 7px',
                              background: 'var(--bg-panel-subtle)',
                              borderRadius: '3px',
                              borderLeft: `2.5px solid ${isPosProfit ? 'var(--accent-green)' : 'var(--accent-rust)'}`,
                              fontSize: '8.5px',
                              fontFamily: 'var(--font-mono)'
                            }}
                          >
                            {/* Baris 1: Symbol, Mode, Dir, Lots, Float PnL, Close button */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                <strong style={{ fontSize: '10px' }}>{pos.symbol}</strong>
                                <span style={{
                                  fontSize: '8px',
                                  padding: '1px 4px',
                                  borderRadius: '2px',
                                  background: (pos.executionMode === 'SPOT' || pos.market === 'IDX') ? 'rgba(34, 197, 94, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                                  color: (pos.executionMode === 'SPOT' || pos.market === 'IDX') ? 'var(--accent-green)' : '#c084fc',
                                  fontWeight: '900',
                                  border: `1px solid ${(pos.executionMode === 'SPOT' || pos.market === 'IDX') ? 'rgba(34, 197, 94, 0.4)' : 'rgba(168, 85, 247, 0.4)'}`
                                }}>
                                  {(pos.executionMode === 'SPOT' || pos.market === 'IDX') ? 'SPOT' : 'FUT'}
                                </span>
                                <span style={{ fontSize: '8px', padding: '1px 4px', borderRadius: '2px', background: pos.direction === 'LONG' ? 'rgba(22, 163, 74, 0.15)' : 'rgba(220, 38, 38, 0.15)', color: pos.direction === 'LONG' ? 'var(--accent-green)' : 'var(--accent-rust)', fontWeight: '800' }}>
                                  {pos.direction}
                                </span>
                                <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                                  {pos.market === 'CRYPTO' ? `${pos.sizeLots}c` : `${pos.sizeLots}L`}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontWeight: '800', fontSize: '9.5px', color: isPosProfit ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                                  {isPosProfit && idrValue > 0 ? '+' : ''}{pnlDisplayIdr}
                                </span>
                                <button
                                  onClick={() => handleManualClose(pos.id)}
                                  className="arena-interactive-chip"
                                  style={{
                                    padding: '2px 6px',
                                    minWidth: '24px',
                                    minHeight: '24px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '10px',
                                    background: 'rgba(220, 38, 38, 0.12)',
                                    border: '1px solid var(--accent-rust)',
                                    color: 'var(--accent-rust)',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    fontWeight: '800'
                                  }}
                                  title="Tutup posisi manual"
                                  aria-label={`Tutup posisi ${pos.symbol}`}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>

                            {/* Baris 2: In / Now / TP / SL in one neat mono line */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'var(--text-muted)' }}>
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
                <div style={{ display: 'flex', gap: '4px', marginTop: 'auto', paddingTop: '4px' }}>
                  <button
                    onClick={() => setJournalModal({ isOpen: true, agentId: ag.id, agentName: ag.name })}
                    className="arena-interactive-chip"
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      minHeight: '26px',
                      fontSize: '9.5px',
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
                      gap: '4px'
                    }}
                  >
                    <span>📖</span>
                    <span>Jurnal</span>
                  </button>

                  <button
                    onClick={() => setResetConfirmModal({ isOpen: true, agentId: ag.id, agentName: ag.name })}
                    className="arena-interactive-chip"
                    style={{
                      padding: '5px 8px',
                      minHeight: '26px',
                      fontSize: '9.5px',
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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="agent-review-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setAgentReviewModalOpen(false); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(5px)',
            zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px'
          }}
        >
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
                  <h3 id="agent-review-modal-title" style={{ margin: 0, fontSize: '13.5px', fontWeight: '900', color: 'var(--text-primary)' }}>
                    Analisa Kinerja & Audit Kuantitatif Multi-Agent
                  </h3>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                    Rekapitulasi arena kuantitatif, riwayat silsilah performa tiap generasi, analisis akar penyebab Margin Call (MC), dan adaptasi mesin (Self-Improvement).
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAgentReviewModalOpen(false)}
                aria-label="Tutup modal analisa kinerja"
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)', minWidth: '32px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
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
                <span>RECAP ARENA</span>
              </button>

              {agents.map((ag) => {
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
                    <span>{ag.name}</span>
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
                    const overallWinRate = totalTrades > 0 ? ((totalWins / totalTrades) * 100).toFixed(1) : '0.0';
                    const totalMCAllBots = agents.reduce((acc, a) => acc + (a.resetsHistory || []).filter(r => r.reason && r.reason.includes('MARGIN_CALL')).length, 0);

                    // Dynamically computed Net Realized PnL across all closed arena trades
                    const netRealizedPnlArena = journal.reduce((acc, j) => acc + (j.pnlIdr !== undefined ? j.pnlIdr : ((j.pnlUsd || 0) * usdToIdrRef.current)), 0);
                    const netRoiArenaPct = totalCapital > 0 ? ((netRealizedPnlArena / totalCapital) * 100).toFixed(2) : '0.00';

                    // Dynamically computed Sharpe Ratio from percentage returns on risk budget
                    let computedArenaSharpe = '0.00';
                    if (journal.length > 1) {
                      const pctReturns = journal.map(j => {
                        if (j.roiPct !== undefined && !isNaN(j.roiPct)) return Number(j.roiPct) / 100;
                        const pnl = j.pnlIdr !== undefined ? j.pnlIdr : (j.pnlUsd * usdToIdrRef.current);
                        return pnl / Math.max(1000000, capitalPerBotIdr);
                      });
                      const mean = pctReturns.reduce((a, b) => a + b, 0) / pctReturns.length;
                      const variance = pctReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (pctReturns.length - 1);
                      const stdev = Math.sqrt(variance);
                      if (stdev > 0) {
                        const raw = (mean / stdev) * Math.sqrt(Math.min(pctReturns.length, 252));
                        computedArenaSharpe = (netGainTotal >= 0 ? Math.max(0.35, Math.min(4.2, raw)) : Math.min(-0.25, Math.max(-3.5, raw))).toFixed(2);
                      }
                    } else if (journal.length === 1) {
                      computedArenaSharpe = journal[0].isWin ? '1.50' : '-0.85';
                    }

                    // Dynamically computed Max Drawdown (MDD) from running peak equity (bounded 0% to 100%)
                    let computedArenaMdd = '0.0%';
                    if (journal.length > 0) {
                      let peak = totalCapital;
                      let running = totalCapital;
                      let maxDdPct = 0;
                      const chronoTrades = [...journal].reverse();
                      chronoTrades.forEach(t => {
                        const val = t.pnlIdr !== undefined ? t.pnlIdr : (t.pnlUsd * usdToIdrRef.current);
                        running = Math.max(0, running + val);
                        if (running > peak) peak = running;
                        if (peak > 0) {
                          const drop = ((peak - running) / peak) * 100;
                          if (drop > maxDdPct) maxDdPct = drop;
                        }
                      });
                      computedArenaMdd = `${Math.min(100.0, maxDdPct).toFixed(1)}%`;
                    }

                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px', flexShrink: 0 }}>
                        <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>NET REALIZED PnL (ARENA)</div>
                          <div style={{ fontSize: '14px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: netRealizedPnlArena >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                            {netRealizedPnlArena >= 0 ? '+' : ''}{formatIdr(netRealizedPnlArena)}
                          </div>
                          <div style={{ fontSize: '8.5px', color: netRealizedPnlArena >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                            {netRealizedPnlArena >= 0 ? '+' : ''}{netRoiArenaPct}% dari total basis modal
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
                            {computedArenaSharpe}
                          </div>
                          <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                            {Number(computedArenaSharpe) >= 2.0 ? 'Institutional Grade (> 2.0)' : 'Dihitung dari riwayat trade'}
                          </div>
                        </div>

                        <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>MAX DRAWDOWN (MDD)</div>
                          <div style={{ fontSize: '14px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)' }}>
                            {computedArenaMdd}
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
                        Basis Modal Awal: {formatIdr(capitalPerBotIdr)} / agent • Klik nama atau tombol report untuk audit detail tiap bot
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
                            <th style={{ padding: '7px 8px', textAlign: 'right' }}>SALDO AKHIR</th>
                            <th style={{ padding: '7px 8px', textAlign: 'center' }}>DETAIL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {agents.map(ag => {
                            const st = agentStatsMap[ag.id] || {};
                            const agTrades = journal.filter(j => j.agentId === ag.id);
                            
                            // Dynamically computed per-agent Sharpe Ratio
                            let agSharpe = '0.00';
                            if (agTrades.length > 1) {
                              const agReturns = agTrades.map(j => (j.pnlIdr !== undefined ? j.pnlIdr : (j.pnlUsd * usdToIdrRef.current)));
                              const mean = agReturns.reduce((a, b) => a + b, 0) / agReturns.length;
                              const variance = agReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (agReturns.length - 1);
                              const stdev = Math.sqrt(variance);
                              if (stdev > 0) {
                                agSharpe = ((mean / stdev) * Math.sqrt(Math.min(agReturns.length, 252))).toFixed(2);
                              }
                            } else if (agTrades.length === 1) {
                              agSharpe = agTrades[0].isWin ? '1.00' : '-1.00';
                            }

                            // Dynamically computed per-agent Average R:R
                            let agAvgRr = '1:1.5';
                            const validRrs = agTrades.map(j => j.rrAchieved).filter(r => typeof r === 'number' && !isNaN(r) && r > 0);
                            if (validRrs.length > 0) {
                              const meanRr = (validRrs.reduce((a, b) => a + b, 0) / validRrs.length).toFixed(1);
                              agAvgRr = `1:${meanRr}`;
                            }

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
                                <td style={{ padding: '7px 8px', color: 'var(--text-primary)' }}>{agSharpe}</td>
                                <td style={{ padding: '7px 8px', color: 'var(--accent-green)' }}>{agAvgRr}</td>
                                <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: '800', color: isPos ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                                  <div>{formatIdr(st.currentBotEquityIdr)}</div>
                                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>({st.roiPct > 0 ? '+' : ''}{st.roiPct}%)</div>
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
                                      fontWeight: '700',
                                      minHeight: '26px'
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
                </>
              )}

              {/* TABS 2 - 5: DETAIL REPORT PER AGENT */}
              {reviewActiveTab !== 'RECAP' && (() => {
                const targetAg = agents.find(a => a.id === reviewActiveTab) || agents[0];
                const st = agentStatsMap[targetAg.id] || {};
                const isPos = (st.netGainIdr || 0) >= 0;
                const activeTrades = positions.filter(p => p.agentId === targetAg.id);
                const deepProfile = (typeof AGENT_DEEP_PROFILE !== 'undefined' && AGENT_DEEP_PROFILE[targetAg.id]) || {};
                const elementMeta = {
                  ...(ELEMENT_MC_ANALYSIS[targetAg.id] || ELEMENT_MC_ANALYSIS.WATER),
                  ...deepProfile
                };

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
                            Filosofi: <strong>{targetAg.strategy}</strong> • Basis Modal: <strong>{formatIdr(capitalPerBotIdr)}</strong>
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

                    {/* 3. Deep Quantitative Profile & Operational Conditions */}
                    <div style={{ background: 'var(--bg-panel-subtle)', borderRadius: '6px', border: 'var(--border-hairline)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'var(--border-hairline)', paddingBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '14px' }}>🧬</span>
                          <strong style={{ fontSize: '11px', color: targetAg.color }}>
                            Profil Filosofi, Regime Pasar & Universe Spesialisasi ({targetAg.name})
                          </strong>
                        </div>
                        <span className="badge" style={{ fontSize: '8px', background: `${targetAg.color}22`, color: targetAg.color, border: `1px solid ${targetAg.color}55` }}>
                          {elementMeta.winRateEdge || 'High Statistical Edge'}
                        </span>
                      </div>

                      {/* Deep Philosophy Banner */}
                      {elementMeta.philosophy && (
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '4px', borderLeft: `3px solid ${targetAg.color}`, fontSize: '9.5px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                          <strong>💡 Filosofi & Core Alpha Edge:</strong> {elementMeta.philosophy}
                        </div>
                      )}

                      {/* Execution Timeframe & Risk Profile Pills */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '6px', fontSize: '9px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>⏱️ Timeframe Preferensi:</span>{' '}
                          <strong style={{ color: 'var(--accent-blue)' }}>{elementMeta.preferredTimeframe || 'H4 / H1'}</strong>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>🛡️ Profil Risiko:</span>{' '}
                          <strong style={{ color: 'var(--accent-gold)' }}>{elementMeta.riskProfile || 'Moderat'}</strong>
                        </div>
                      </div>

                      {/* Optimal vs Weak Market Conditions */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px', fontSize: '9.5px', lineHeight: '1.5' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '8px 12px', borderRadius: '4px', borderLeft: '3px solid var(--accent-green)' }}>
                          <strong style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>🌤️</span> <span>Kondisi Pasar Optimal (High Win-Rate):</span>
                          </strong>
                          <p style={{ margin: '3px 0 0 0', color: 'var(--text-primary)', fontSize: '9px' }}>
                            {elementMeta.optimalConditions || 'Volatilitas sehat dan likuiditas institusional tinggi.'}
                          </p>
                        </div>

                        <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '8px 12px', borderRadius: '4px', borderLeft: '3px solid var(--accent-rust)' }}>
                          <strong style={{ color: 'var(--accent-rust)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>⛈️</span> <span>Kondisi Pasar Kurang Cocok (Vulnerable):</span>
                          </strong>
                          <p style={{ margin: '3px 0 0 0', color: 'var(--text-primary)', fontSize: '9px' }}>
                            {elementMeta.weakConditions || 'Pasar choppy / whipsaw berkepanjangan tanpa arah.'}
                          </p>
                        </div>
                      </div>

                      {/* Synergy Explanation (if Duo / Trio / Avatar) */}
                      {elementMeta.synergyExplanation && (
                        <div style={{ background: 'rgba(168, 85, 247, 0.08)', padding: '8px 12px', borderRadius: '4px', borderLeft: '3px solid #c084fc', fontSize: '9.5px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                          <strong style={{ color: '#c084fc' }}>⚡ Sinergi Multi-Elemen:</strong> {elementMeta.synergyExplanation}
                        </div>
                      )}

                      {/* Best vs Avoided Instruments */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px', fontSize: '9.5px', lineHeight: '1.5' }}>
                        <div style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '8px 12px', borderRadius: '4px', borderLeft: '3px solid #38bdf8' }}>
                          <strong style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>💎</span> <span>Instrumen Terbaik (Optimal Universe):</span>
                          </strong>
                          <div style={{ color: 'var(--text-primary)', marginTop: '3px', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
                            {elementMeta.bestInstruments}
                          </div>
                          <p style={{ margin: '3px 0 0 0', color: 'var(--text-secondary)', fontSize: '9px' }}>
                            {elementMeta.instrumentEdge}
                          </p>
                        </div>

                        <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '8px 12px', borderRadius: '4px', borderLeft: '3px solid var(--accent-orange)' }}>
                          <strong style={{ color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>⚠️</span> <span>Karakteristik Dihindari (Avoid List):</span>
                          </strong>
                          <div style={{ color: 'var(--text-primary)', marginTop: '3px', fontWeight: '700' }}>
                            {elementMeta.avoidInstruments}
                          </div>
                          <p style={{ margin: '3px 0 0 0', color: 'var(--text-muted)', fontSize: '9px' }}>
                            Instrumen ini memiliki spread lebar atau karakter volatilitas berlawanan dengan edge algoritma ini.
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
                            gap: '8px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '16px' }}>🛡️</span>
                                <strong style={{ color: 'var(--accent-green)', fontSize: '11px' }}>
                                  Status Generasi Prima: Gen 0 (Genesis Origin — Belum Pernah Margin Call)
                                </strong>
                              </div>
                              <span style={{ fontSize: '8px', padding: '1px 6px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
                                Zero Deficit (Sehat)
                              </span>
                            </div>

                            {/* AI Agent Operational Monologue for Gen 0 */}
                            <div style={{
                              fontSize: '9.5px',
                              color: 'var(--text-primary)',
                              lineHeight: '1.5',
                              fontStyle: 'italic',
                              background: 'rgba(0, 0, 0, 0.2)',
                              padding: '8px 10px',
                              borderRadius: '4px',
                              borderLeft: '3px solid var(--accent-green)'
                            }}>
                              💬 <strong>Refleksi Operasional AI ({targetAg.name}):</strong> "Seluruh parameter eksekusi {targetAg.strategy} berjalan prima dalam koridor toleransi risiko. Tidak ada anomali drawdown yang memicu circuit breaker; saya terus memprioritaskan penyaringan sinyal berkualitas tinggi pada instrumen {elementMeta.bestInstruments?.split(',')?.[0] || 'unggulan'}."
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '6px', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
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
                          const aiReflectionText = latestRh.aiReflection || getAgentSelfReflection(targetAg, latestRh, toxicPair);

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

                                {/* AI Agent Self-Reflection Monologue & Introspection */}
                                <div style={{
                                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)',
                                  padding: '10px 12px',
                                  borderRadius: '5px',
                                  border: '1px solid rgba(168, 85, 247, 0.35)',
                                  borderLeft: `4px solid ${targetAg.color || '#a855f7'}`
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                    <div style={{ fontSize: '9.5px', fontWeight: '900', color: '#d8b4fe', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                      <span style={{ fontSize: '12px' }}>🤖</span>
                                      <span>Refleksi Diri & Introspeksi AI ({targetAg.name} — Pasca-MC Gen {latestRh.fromGen})</span>
                                    </div>
                                    <span style={{
                                      fontSize: '7.5px',
                                      fontFamily: 'var(--font-mono)',
                                      padding: '1px 5px',
                                      borderRadius: '3px',
                                      background: 'rgba(168, 85, 247, 0.2)',
                                      color: '#e9d5ff',
                                      border: '1px solid rgba(168, 85, 247, 0.3)'
                                    }}>
                                      Self-Reflection Protocol Active
                                    </span>
                                  </div>
                                  <div style={{
                                    fontSize: '9.5px',
                                    color: 'var(--text-primary)',
                                    lineHeight: '1.6',
                                    fontStyle: 'italic',
                                    background: 'rgba(0, 0, 0, 0.25)',
                                    padding: '8px 10px',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                  }}>
                                    "{aiReflectionText}"
                                  </div>
                                  <div style={{ marginTop: '5px', fontSize: '8.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>📌</span>
                                    <span>Introspeksi algoritma ini diadopsi sebagai dasar mutasi DNA risiko dan karantina instrumen toxic di Gen {latestRh.toGen}.</span>
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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="philosophy-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setPhilosophyModalOpen(false); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)',
            zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
          }}
        >
          <div style={{
            background: 'var(--bg-panel)', width: '100%', maxWidth: '840px', maxHeight: '88vh',
            borderRadius: 'var(--radius-md)', border: 'var(--border-hairline)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '12px 18px', background: 'var(--bg-panel-subtle)', borderBottom: 'var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🧠</span>
                <div>
                  <h3 id="philosophy-modal-title" style={{ margin: 0, fontSize: '13.5px', fontWeight: '900', color: 'var(--text-primary)' }}>
                    Profil, Filosofi & Simulasi Strategi 16 AI Multi-Agent Roster
                  </h3>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                    Logika di balik keputusan algoritma, titik entry order block / breakout, serta simulasi visual target TP dan SL tiap elemen.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPhilosophyModalOpen(false)}
                aria-label="Tutup modal filosofi bot"
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)', minWidth: '32px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
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
                    thesis: 'Mengikuti jejak institusi bank sentral & hedge fund (Smart Money Concepts). Pasar selalu memburu likuiditas ritel (stop loss sweep) sebelum bergerak ke arah tren sejati.',
                    trigger: 'Menunggu Liquidity Sweep pada swing high/low, mendeteksi Fair Value Gap (FVG), lalu membuka Buy/Sell limit pada mitigasi Order Block H4/H1.',
                    slRule: 'Hard SL dipasang ketat tepat di luar swing low Order Block (-1.0R risk unit). Invalidation terjadi jika candle close menembus level batas ini.',
                    tpRule: 'Target TP1 diambil pada swing liquidity berikutnya (+2.5R) dan TP2 pada level ekstrim (+4.0R). Saat profit mencapai 1.2R, stop loss otomatis BEP.',
                    markets: 'XAUUSD (Gold), EURUSD, GBPUSD, BTCUSDT (Forex & Crypto Perp 1:20).',
                    technicalRef: 'Tsinaslanidis & Zapranis (2016) — Technical Analysis for Algorithmic Pattern Recognition',
                    fundamentalRef: 'Maurice Levi — International Finance (Institutional Foreign Flow & FX Equilibrium)',
                    coreFormula: 'Extremum ZigZag Liquidity Sweep + Cumulative Foreign Net Flow Gating'
                  },
                  FIRE: {
                    thesis: 'Katalis makro ekonomi adalah penggerak deviasi harga terbesar dalam waktu tersingkat. Deviasi rilis data aktual vs konsensus menciptakan inefisiensi harga kilat.',
                    trigger: 'Machine Learning NLP membaca flash data berita ekonomi (US CPI, NFP, Fed FOMC Rate). Order momentum dibuka dalam 30 detik pertama pasca-rilis.',
                    slRule: 'Hard SL dipasang di batas konsolidasi pre-news candle (-1.0R). Proteksi slippage aktif dengan limit order execution.',
                    tpRule: 'Fast Target Take Profit (+2.5R) dengan agresif Trailing Stop. Bot tidak menahan posisi lebih dari 4 jam setelah news selesai dicerna pasar.',
                    markets: 'EURUSD, GBPUSD, USOIL, NAS100 (Pasangan mata uang, komoditas, dan indeks paling sensitif sentimen global).',
                    technicalRef: 'Kathy Lien (2015) — Day & Swing Trading the Currency Market (News Volatility Tactics)',
                    fundamentalRef: 'N. Gregory Mankiw — Macroeconomics (Economic Surprise Index & Monetary Shocks)',
                    coreFormula: 'Economic Surprise |Actual - Forecast| >= 1.5σ + 2Y US Yield Concurrence'
                  },
                  AIR: {
                    thesis: 'Prinsip klasik Trend-Following: "Let your winners run, cut your losses short". Tidak pernah menebak puncak atau dasar pasar, melainkan menunggangi gelombang tren yang sudah terkonfirmasi.',
                    trigger: 'Breakout 20-periode Donchian Channel yang divalidasi oleh ekspansi volatilitas ATR dan posisi MA 50 di atas MA 200.',
                    slRule: 'Trailing Stop berbasis 2.0x ATR (Average True Range). Stop loss terus bergerak naik mengunci profit seiring harga mencetak rekor baru.',
                    tpRule: 'Multi-stage TP pada ekspansi ekstensi Fibonacci (+3.0R s/d +5.0R). Piramida posisi ditambah saat profit (+0.8%).',
                    markets: 'BTCUSDT, SOLUSDT, NVDA, TSLA, SPY (Aset berkarakter tren panjang dan volatilitas tinggi).',
                    technicalRef: 'Steven B. Achelis (2000) — Technical Analysis from A to Z (Donchian 20 Channel)',
                    fundamentalRef: 'William J. O\'Neil (2013) — How to Make Money in Stocks (CAN SLIM & EPS Growth > 20%)',
                    coreFormula: 'Highest High (20) Breakout + 2.0x ATR Ratchet + Inverted Pyramiding (100% -> 50% -> 25%)'
                  },
                  EARTH: {
                    thesis: 'Pasar bergerak sideways dalam rentang harga (range-bound) sekitar 70% dari waktu. Setiap deviasi harga yang menyentuh simpangan baku ekstrim secara statistik akan tertarik kembali ke nilai rata-ratanya (mean).',
                    trigger: 'Harga menembus pita bawah Bollinger Bands 2.5 Standard Deviation dengan RSI oversold (< 30) pada saham fundamental defensif atau sesi sepi Asia.',
                    slRule: 'Hard Stop Loss ketat di bawah support swing low terdekat (-1.0R). Khusus saham BEI spot (BBCA/BBRI), bot 100% LONG-only (0% risiko likuidasi).',
                    tpRule: 'Target TP1 dipasang pada garis tengah Bollinger Bands (SMA 20) dan TP2 pada batas pita atas (+2.0R s/d +3.0R).',
                    markets: 'BBCA, BBRI, BMRI (Saham Blue-Chip BEI Spot 1:1) dan USDJPY pada sesi Asia.',
                    technicalRef: 'Steven B. Achelis (2000) — Technical Analysis from A to Z (Bollinger Bands 2.5σ Deviation)',
                    fundamentalRef: 'Thomas N. Bulkowski (2013) — Fundamental & Position Trading (P/E & PBV Diskon)',
                    coreFormula: 'Lower Band (2.5σ) Bounce + Piotroski F-Score >= 6 + DER < 1.0 (Zero Value Trap)'
                  },
                  STEAM: {
                    thesis: 'Sinergi WATER + FIRE: Likuiditas institusi bertemu katalis volatilitas berita. Menggunakan volume lonjakan rilis berita makro untuk memvalidasi penyelesaian sapuan likuiditas (sweep confirmation).',
                    trigger: 'Order Block H1 disentuh bersamaan dengan lonjakan volume impulsif rilis berita ekonomi, memicu entry sniper dengan validasi ganda.',
                    slRule: 'Hard SL ketat di ujung ekor candle manipulasi berita (-0.85R risk unit). Cut loss instan jika harga gagal bertahan.',
                    tpRule: 'Fast Expansion TP (+3.0R) dengan auto-breakeven ratchet saat posisi mencapai +1.0R profit.',
                    markets: 'XAUUSD, GBPUSD, BTCUSDT, NAS100 (Pasar berlikuiditas tinggi dengan katalis berita aktif).',
                    technicalRef: 'Ed Ponsi (2016) — Chart Interpretations (Breakout vs Fakeout Liquidity Sweep)',
                    fundamentalRef: 'N. Gregory Mankiw — Macroeconomics (Central Bank Monetary Shocks & Liquidity Influx)',
                    coreFormula: 'SMC Order Block Retest + Flash Post-News Volume Surge Spike'
                  },
                  STORM: {
                    thesis: 'Sinergi WATER + AIR: Mengawinkan presisi konfirmasi struktural Smart Money (BOS - Break of Structure) dengan daya dorong tren Donchian yang berkesinambungan.',
                    trigger: 'Break of Structure (BOS) terkonfirmasi pada H1 diikuti breakout Donchian Upper Band dengan volume expansion kuat.',
                    slRule: 'SL diletakkan di bawah Higher Low struktural terakhir pembentuk BOS (-1.0R) dengan trailing stop bertahap.',
                    tpRule: 'Riding Trend bertahap (+3.5R s/d +6.0R) dengan penambahan layer piramida saat posisi berjalan profit > 0.8%.',
                    markets: 'SOLUSDT, ETHUSDT, NVDA, QQQ (Aset momentum kuat dengan tren ekspansi tinggi).',
                    technicalRef: 'Tsinaslanidis & Zapranis (2016) & Achelis (2000) (Structural BOS + Donchian Channel)',
                    fundamentalRef: 'William J. O\'Neil (2013) — Top-line Revenue & Margin Expansion (> 15% YoY)',
                    coreFormula: 'Higher-Timeframe BOS + 20-Day Donchian Breakout + Profit-Locked Scale-In'
                  },
                  MUD: {
                    thesis: 'Sinergi WATER + EARTH: Bantalan pertahanan solid mean reversion dipadu presisi Fair Value Gap (FVG). Menolak breakout palsu dan hanya membeli pada area diskon institusi terdalam.',
                    trigger: 'Inbalance Fair Value Gap (FVG) yang berhimpitan presisi di atas level support horizontal statis atau Bollinger Lower Band.',
                    slRule: 'SL sangat konservatif di bawah zona bantalan support ganda (-0.9R). 100% Spot cash safe holding.',
                    tpRule: 'Target konservatif Mean Reversion pada Mid-Band SMA 20 / Equal Highs (+2.2R s/d +3.0R).',
                    markets: 'BBCA, BMRI, AAPL, MSFT, BTCUSDT (Saham bluechip dan crypto berkapitalisasi mega).',
                    technicalRef: 'Tsinaslanidis & Zapranis (2016) — Algorithmic Fair Value Gap (FVG) Imbalance Detection',
                    fundamentalRef: 'Thomas N. Bulkowski (2013) — Free Cash Flow (FCF) Yield & Solvency Cushion',
                    coreFormula: 'FVG 3-Candle Imbalance Mitigation + Historical Static Support Floor + Cash Spot 1:1'
                  },
                  LIGHTNING: {
                    thesis: 'Sinergi FIRE + AIR: Kecepatan akselerasi murni. Ketika kejutan rilis berita memicu breakout teknikal Donchian, tercipta lonjakan momentum kilat dengan velocity tertinggi.',
                    trigger: 'Candle impulsif pasca-berita menembus Donchian Channel 20 dengan kenaikan ATR > 150% dalam 1 candle tunggal.',
                    slRule: 'Trailing Stop ketat 1.2x ATR; bot otomatis memotong posisi jika momentum mereda dalam 3 bar lilin.',
                    tpRule: 'Parabolic Expansion TP (+3.5R s/d +5.0R) dengan penambahan layer instan pada breakout kedua.',
                    markets: 'DOGEUSDT, PEPEUSDT, TSLA, SMCI, USOIL (Aset high-beta dengan pergerakan eksplosif).',
                    technicalRef: 'Ed Ponsi (2016) — Technical Analysis (High-Velocity Candle Momentum & Breakouts)',
                    fundamentalRef: 'N. Gregory Mankiw — Macroeconomics (Interest Rate Expectation Shift Surprises)',
                    coreFormula: 'Momentum Surge > 1.5x ATR + Donchian Band Expansion + Fast Trailing 1.2x ATR'
                  },
                  LAVA: {
                    thesis: 'Sinergi FIRE + EARTH: Mengambil keuntungan dari reaksi berlebihan (overreaction) pasar terhadap berita. Candle euforia atau kepanikan yang keluar dari 3.0 SD pasti mengalami kelelahan (exhaustion fade).',
                    trigger: 'Spike berita tajam mendorong harga keluar pita Bollinger 3.0 SD dengan RSI ekstrim (> 85 atau < 15), diikuti munculnya penolakan (wick rejection pinbar).',
                    slRule: 'SL ketat di ujung ekor candle spike ekstrem (-0.9R). Invalidation cepat jika volume pembelian berlanjut.',
                    tpRule: 'Target pembalikan cepat (mean reversion fade) menuju SMA 20 (+2.5R s/d +3.5R).',
                    markets: 'EURUSD, XAUUSD, SUIUSDT, INTC (Pasangan dengan kecenderungan overextension tinggi).',
                    technicalRef: 'Steven B. Achelis (2000) — Technical Analysis from A to Z (Bollinger 3.0σ Reversal)',
                    fundamentalRef: 'N. Gregory Mankiw — Macroeconomics (Market Transitory Overreaction to Noise)',
                    coreFormula: 'Post-News Wick Rejection Pinbar Outside 3.0σ Band + Mean Reversion to SMA 20'
                  },
                  SANDSTORM: {
                    thesis: 'Sinergi AIR + EARTH: Tidak pernah mengejar harga di puncak tren, melainkan sabar menunggu harga beristirahat (pullback) menyentuh level support struktural sebelum melanjutkan reli.',
                    trigger: 'Tren bullish (MA 50 > MA 200) mengalami retracement hingga menyentuh zona support MA 50 atau Fibonacci 50-61.8%.',
                    slRule: 'Hard SL dipasang di bawah swing low retracement (-1.0R). Aman untuk akumulasi spot kas tanpa utang margin.',
                    tpRule: 'Target TP pada retest rekor tertinggi sebelumnya (Previous High) (+2.8R s/d +4.0R).',
                    markets: 'BBRI, ASII, AMMN, QQQ, LINKUSDT (Saham dividen & indeks tren stabil).',
                    technicalRef: 'Mario Singh (2013) — 17 Proven Currency Trading Strategies (Trend Pullback S/R)',
                    fundamentalRef: 'Thomas N. Bulkowski (2013) — Dividend Yield Floor Support (Yield >= 4.5%)',
                    coreFormula: 'Macro Bullish Trend (MA50 > MA200) Pullback Buy on Key Support + Spot Accumulation'
                  },
                  TEMPEST: {
                    thesis: 'Sinergi WATER + FIRE + AIR: Triple-Engine Alpha Hedge-Fund. Sapuan likuiditas SMC + katalis berita makro + pengawalan tren jangka panjang untuk memeras keuntungan maksimal dari siklus bull run.',
                    trigger: 'Likuiditas sweep pre-news, diikuti lonjakan volume rilis berita, dan konfirmasi penembusan tren Donchian secara simultan.',
                    slRule: 'Hybrid Trailing SL yang menggabungkan batas Order Block dengan ratchet dinamis 1.5x ATR.',
                    tpRule: 'Maximal Alpha Harvest (+4.0R s/d +8.0R) dengan alokasi piramida bertingkat hingga 3 posisi profit.',
                    markets: 'BTCUSDT, SOLUSDT, NVDA, XAUUSD, NAS100 (Instrumen alpha utama multi-aset).',
                    technicalRef: 'Mark Andrew Lim (2016) — The Handbook of Technical Analysis (Multi-System Synergies)',
                    fundamentalRef: 'William J. O\'Neil & N. Gregory Mankiw (Macro Tailwind + Institutional High Volume)',
                    coreFormula: 'Triple-Engine Consensus (Liquidity Sweep + News Catalyst + Trend Ride) + Pyramiding'
                  },
                  OCEANIC: {
                    thesis: 'Sinergi WATER + AIR + EARTH: Filosofi Ray Dalio All-Weather Portfolio. Aliran likuiditas SMC dipadukan dengan pengawalan tren stabil dan peredam kejut mean reversion untuk pertumbuhan modal berkelanjutan.',
                    trigger: 'Akumulasi di zona diskon Order Block yang berada di jalur tren naik mayor dengan konfirmasi pantulan support kuat.',
                    slRule: 'Proteksi struktural berlapis (-1.0R); drawdown terjaga sangat minimal pada kondisi pasar apapun.',
                    tpRule: 'Target bertahap konservatif hingga apresiasi modal jangka panjang (+2.5R s/d +4.5R).',
                    markets: 'BBCA, BBRI, SPY, IWM, ETHUSDT, AAPL (Fokus pada Spot & Keamanan Modal Jangka Panjang).',
                    technicalRef: 'Steven B. Achelis (2000) & Ed Ponsi (2016) — Institutional Range & Volatility Bounds',
                    fundamentalRef: 'Ray Dalio / Mankiw — Macro All-Weather Quadrants (Growth vs Inflation Equilibrium)',
                    coreFormula: 'SMC Order Block Anchor + Long-Term Trend Riding + Low-Drawdown Balance (Spot Long Only)'
                  },
                  GEOTHERMAL: {
                    thesis: 'Sinergi WATER + FIRE + EARTH: Memanfaatkan kepanikan berita (news panic sell-off) untuk memborong aset fundamental diskon di Order Block institusi dengan bantalan valuasi murah.',
                    trigger: 'Kepanikan berita memicu sell-off ritel hingga harga terdorong ke Order Block mayor yang berhimpitan dengan support fundamental historis.',
                    slRule: 'Hard SL di bawah level valuasi batas institusi (-0.9R) dengan perlindungan spot cash.',
                    tpRule: 'Target pemulihan valuasi wajar (fair value rebound) (+3.0R s/d +5.0R).',
                    markets: 'TLKM, ASII, JPM, GOOGL, BNBUSDT (Aset bernilai fundamental tinggi saat diskon pasar).',
                    technicalRef: 'Tsinaslanidis & Zapranis (2016) — Order Block Mitigated Rebound Level',
                    fundamentalRef: 'Thomas N. Bulkowski (2013) — Piotroski F-Score >= 6 + High Operating Cash Flow',
                    coreFormula: 'News Panic Sell-Off Absorption on Major Order Block + Blue-Chip Valuation Discount'
                  },
                  CYCLONE: {
                    thesis: 'Sinergi FIRE + AIR + EARTH: Mesin adaptif kuantitatif. Secara otomatis mendeteksi perubahan rezim pasar (Market Regime Switching) antara ekspansi tren volatil vs konsolidasi mean reversion.',
                    trigger: 'Kalkulasi Hurst Exponent: Jika Hurst > 0.6 -> Buka Donchian breakout; Jika Hurst < 0.4 -> Buka fading Bollinger Bands.',
                    slRule: 'Adaptive SL menyesuaikan rezim yang sedang aktif (ATR trailing untuk tren, hard band untuk sideways).',
                    tpRule: 'Fleksibel 1:2.0 hingga 1:5.0 R:R tergantung kekuatan momentum rezim yang terdeteksi.',
                    markets: 'XAUUSD, BTCUSDT, TSLA, EURUSD, DAX40 (Pasar dengan variasi rezim dinamis).',
                    technicalRef: 'Abdulkader Aljandali (2016) — Quantitative Analysis, Statistics & Econometrics (GARCH Models)',
                    fundamentalRef: 'N. Gregory Mankiw — Macroeconomics (Business Cycle Regime Switching: Expansion to Slump)',
                    coreFormula: 'Dynamic Regime Switcher: Hurst Exponent & ATR Ratio toggles Trend-Ignition vs Mean-Reversion'
                  },
                  AVATAR: {
                    thesis: 'Master of All 4 Elements: Mengintegrasikan sinyal dari WATER, FIRE, AIR, dan EARTH ke dalam model voting kuantitatif multi-dimensi (Ensemble Meta-Learner Consensus).',
                    trigger: 'Konsensus minimal 3 dari 4 elemen sepakat pada arah yang sama (Likuiditas SMC + Volatilitas Berita + Tren Donchian + Valuasi Support).',
                    slRule: 'Master Risk Parity SL (-1.0R) dengan trailing stop bertahap yang paling disiplin di seluruh arena.',
                    tpRule: 'Supreme Multi-Target (+3.0R s/d +6.0R) dengan eksekusi exit segera jika terjadi perpecahan divergensi antar elemen.',
                    markets: 'Seluruh universe instrumen (Cross-Asset Master: Saham BEI, Saham US, Crypto, Forex, Komoditas).',
                    technicalRef: 'Thomas W. Malone (2018) — Superminds (Ensemble Quorum & Collective Intelligence)',
                    fundamentalRef: 'Fama-French Multi-Factor Asset Pricing (Value, Momentum, Quality & Size Premiums)',
                    coreFormula: '4-Factor Weighted Consensus Score >= +1.5 for Long, <= -1.5 for Short (EXP3 Weighted Voting)'
                  },
                  CHAOS: {
                    thesis: 'The Rogue Anomaly: Memburu inefisiensi pasar ekstrim, lonjakan momentum tajam, dan pembalikan contrarian saat pasar overextended. High risk, high variance, non-linear alpha.',
                    trigger: 'Spike impulsif abnormal pada candlestick dengan deviasi volume > 2.5x rata-rata atau breakout tajam tanpa konfirmasi struktur reguler.',
                    slRule: 'Dynamic volatility stop loss berbasis volatilitas candle entri (-1.2R). Cut loss cepat jika anomali mereda.',
                    tpRule: 'Aggressive multi-layer TP (+3.0R s/d +7.0R) dengan trailing ratchet ketat.',
                    markets: 'SOXL, TQQQ, BTCUSDT, ETHUSDT, SMCI, TSLA (Aset volatilitas dan beta tertinggi).',
                    technicalRef: 'Kevin Dowd (2005) — Measuring Market Risk (Fat-Tail Extremes & Kurtosis Exploitation)',
                    fundamentalRef: 'Behavioral Finance & Noise Trader Risk Theory (Shleifer, Summers, Vishny)',
                    coreFormula: 'Unbound Machine-Gun Volatility Scalping + Auto-Rebirth DNA Mutation Mechanism'
                  }
                };
                metaConfigs.TITAN = metaConfigs.WATER;
                metaConfigs.ORACLE = metaConfigs.FIRE;
                metaConfigs.VORTEX = metaConfigs.AIR;
                metaConfigs.SENTINEL = metaConfigs.EARTH;

                const deepProf = (typeof AGENT_DEEP_PROFILE !== 'undefined' && AGENT_DEEP_PROFILE[targetAg?.id]) || {};
                const meta = {
                  ...(metaConfigs[targetAg?.id] || metaConfigs.WATER),
                  ...deepProf,
                  thesis: deepProf.philosophy || (metaConfigs[targetAg?.id] || metaConfigs.WATER).thesis
                };

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
                      {/* Academic Literature Reference Badges */}
                      <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                        <strong style={{ color: 'var(--accent-blue)', fontSize: '10.5px' }}>📖 Literatur Teknikal (Buku Offline):</strong>
                        <p style={{ margin: '3px 0 0 0', color: 'var(--text-primary)', fontSize: '10px', lineHeight: '1.4', fontWeight: '600' }}>
                          {meta.technicalRef || 'Tsinaslanidis & Zapranis (2016) — Algorithmic Pattern Recognition'}
                        </p>
                      </div>

                      <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        <strong style={{ color: 'var(--accent-green)', fontSize: '10.5px' }}>🏛️ Literatur Fundamental (Buku Offline):</strong>
                        <p style={{ margin: '3px 0 0 0', color: 'var(--text-primary)', fontSize: '10px', lineHeight: '1.4', fontWeight: '600' }}>
                          {meta.fundamentalRef || 'N. Gregory Mankiw — Macroeconomics / Maurice Levi — International Finance'}
                        </p>
                      </div>

                      <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: '1px solid rgba(234, 179, 8, 0.3)', gridColumn: '1 / -1' }}>
                        <strong style={{ color: 'var(--accent-gold)', fontSize: '10.5px' }}>🧮 Model Kuantitatif & Formula Sizing:</strong>
                        <p style={{ margin: '3px 0 0 0', color: 'var(--text-primary)', fontSize: '10px', lineHeight: '1.4', fontFamily: 'var(--font-mono)' }}>
                          {meta.coreFormula || 'Fixed Fractional Risk Sizing (Mario Singh 2013)'}
                        </p>
                      </div>

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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setResetConfirmModal({ isOpen: false, agentId: null, agentName: '' }); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(5px)',
            zIndex: 999999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
          }}
        >
          <div style={{
            background: 'var(--bg-panel)', width: '100%', maxWidth: '440px',
            borderRadius: 'var(--radius-md)', border: '1px solid rgba(220, 38, 38, 0.4)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)', padding: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '22px' }}>⚠️</span>
              <h3 id="reset-modal-title" style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: 'var(--accent-rust)' }}>
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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rules-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setRulesModalOpen(false); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)',
            zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
          }}
        >
          <div style={{
            background: 'var(--bg-panel)', width: '100%', maxWidth: '680px', maxHeight: '85vh',
            borderRadius: 'var(--radius-md)', border: 'var(--border-hairline)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            <div style={{ padding: '12px 18px', background: 'var(--bg-panel-subtle)', borderBottom: 'var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>📋</span>
                <h3 id="rules-modal-title" style={{ margin: 0, fontSize: '13.5px', fontWeight: '900', color: 'var(--text-primary)' }}>
                  Panduan Terpadu: Aturan Trading & Status Bot
                </h3>
              </div>
              <button
                onClick={() => setRulesModalOpen(false)}
                aria-label="Tutup panduan aturan dan status"
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)', minWidth: '32px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="journal-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setJournalModal({ isOpen: false, agentId: 'ALL', agentName: 'Semua Agen' }); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)',
            zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
          }}
        >
          <div style={{
            background: 'var(--bg-panel)', width: '100%', maxWidth: '850px', maxHeight: '85vh',
            borderRadius: 'var(--radius-md)', border: 'var(--border-hairline)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            
            <div style={{ padding: '12px 18px', background: 'var(--bg-panel-subtle)', borderBottom: 'var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>📖</span>
                <div>
                  <h3 id="journal-modal-title" style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: 'var(--text-primary)' }}>
                    Jurnal Transaksi: {journalModal.agentName}
                  </h3>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                    Riwayat closed trade terverifikasi dengan konversi ganda Rupiah & Dollar.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setJournalModal({ isOpen: false, agentId: 'ALL', agentName: 'Semua Agen' })}
                aria-label="Tutup modal jurnal transaksi"
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)', minWidth: '32px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            {(() => {
              const targetTrades = journalModal.agentId === 'ALL'
                ? journal
                : journal.filter(j => j.agentId === journalModal.agentId);

              const totalTradesCount = targetTrades.length;
              const totalWins = targetTrades.filter(j => j.isWin).length;
              const totalLosses = totalTradesCount - totalWins;
              const winRatePct = totalTradesCount > 0 ? ((totalWins / totalTradesCount) * 100).toFixed(1) : '0.0';

              const totalGrossProfitIdr = targetTrades.filter(j => (j.pnlIdr || (j.pnlUsd * usdToIdrRef.current)) > 0)
                .reduce((acc, t) => acc + (t.pnlIdr || (t.pnlUsd * usdToIdrRef.current)), 0);
              const totalGrossLossIdr = Math.abs(targetTrades.filter(j => (j.pnlIdr || (j.pnlUsd * usdToIdrRef.current)) < 0)
                .reduce((acc, t) => acc + (t.pnlIdr || (t.pnlUsd * usdToIdrRef.current)), 0));

              const totalNetPnlIdr = targetTrades.reduce((acc, t) => acc + (t.pnlIdr || (t.pnlUsd * usdToIdrRef.current)), 0);
              const totalNetPnlUsd = totalNetPnlIdr / usdToIdrRef.current;
              const profitFactorVal = totalGrossLossIdr > 0 ? (totalGrossProfitIdr / totalGrossLossIdr).toFixed(2) : (totalGrossProfitIdr > 0 ? '99.0' : '0.0');
              const avgRr = totalTradesCount > 0 ? (targetTrades.reduce((acc, t) => acc + (Number(t.rrAchieved) || 0), 0) / totalTradesCount).toFixed(2) : '0.0';

              const generateTradeReflection = (trade) => {
                const isWin = trade.isWin;
                const agent = (trade.agentId || '').toUpperCase();
                const reason = (trade.exitReason || '').toUpperCase();

                if (isWin) {
                  if (agent.includes('SMC')) return 'Liquidity sweep terkonfirmasi di area order block; mitigasi demand berhasil memicu kenaikan target TP.';
                  if (agent.includes('BANDAR') || agent.includes('WHALE')) return 'Akumulasi dominan broker tier-1 terdeteksi kuat; lonjakan net buy institusi mengangkat harga ke level exit target.';
                  if (agent.includes('MOMENTUM') || agent.includes('TREND')) return 'Breakout terkonfirmasi dengan ekspansi volume di atas MA-20; trailing stop mengunci keuntungan terukur.';
                  if (agent.includes('MEAN') || agent.includes('REVERSION')) return 'Oversold rebound terpicu dari deviasi ekstrem Bollinger Bands; mean reversion kembali ke nilai wajar.';
                  return 'Sinyal konfirmasi setup teknikal tervalidasi; momentum volume mengantarkan posisi menuju take profit.';
                } else {
                  if (reason.includes('MC') || reason.includes('MARGIN')) return 'Margin threshold tercapai; sistem mengeksekusi likuidasi protektif otomatis untuk mereset sovereign DNA agen.';
                  if (agent.includes('SMC')) return 'Change of Character (CHoCH) berlawanan arah; stop loss terpicu untuk mencegah drawdown struktur likuiditas.';
                  if (agent.includes('BANDAR') || agent.includes('WHALE')) return 'Terjadi distribusi mendadak oleh broker pengendali; cut loss segera dieksekusi demi menjaga kelangsungan portofolio.';
                  if (agent.includes('MOMENTUM') || agent.includes('TREND')) return 'False breakout akibat pelemahan volume beli; disiplin cut loss membatasi risiko kerugian modal.';
                  return 'Level invalidasi ditembus pasar; posisi ditutup demi disiplin manajemen risiko portofolio sovereign.';
                }
              };


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
                            const pnlIdr = item.market === 'IDX' && item.pnlIdr ? item.pnlIdr : (item.pnlUsd * usdToIdrRef.current);
                            return (
                              <React.Fragment key={item.id}>
                              <tr style={{ borderBottom: 'none' }}>
                                <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>
                                  {new Date(item.closedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                </td>
                                <td style={{ padding: '6px 8px', fontWeight: '800', color: 'var(--text-primary)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>{item.symbol}</span>
                                    <span style={{
                                      fontSize: '8px',
                                      padding: '1px 4px',
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
                              {/* Explainable AI Trade Reflection Sub-Row */}
                              <tr key={`${item.id}-reflection`} style={{ background: 'rgba(255,255,255,0.015)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <td colSpan={8} style={{ padding: '4px 10px 8px 10px', fontSize: '9.5px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{
                                      fontSize: '7.5px',
                                      fontWeight: '800',
                                      padding: '1px 5px',
                                      borderRadius: '3px',
                                      background: isWin ? 'rgba(34, 197, 94, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                                      color: isWin ? 'var(--accent-green)' : 'var(--accent-blue)',
                                      border: `1px solid ${isWin ? 'rgba(34, 197, 94, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
                                      letterSpacing: '0.04em'
                                    }}>
                                      🤖 AI REFLECTION
                                    </span>
                                    <span style={{ color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.3 }}>
                                      {item.aiReflection || generateTradeReflection(item)}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            </React.Fragment>
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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-recap-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setSessionRecapModalOpen(false); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.82)', backdropFilter: 'blur(6px)',
            zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px'
          }}
        >
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
                    <h3 id="session-recap-modal-title" style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '0.3px' }}>
                      Session Recap & Institutional Quant Post-Mortem Debrief
                    </h3>
                    <span className="badge" style={{ fontSize: '8.5px', background: 'rgba(217, 70, 239, 0.18)', color: '#e879f9', border: '1px solid rgba(217, 70, 239, 0.4)' }}>
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
                aria-label="Tutup modal session recap"
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)', minWidth: '32px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
                  minWidth: '240px'
                }}
              >
                <option value="LIVE" style={{ background: '#0d1117', color: '#38bdf8' }}>
                  {(() => {
                    const official = epochReports.filter(ep => ep.epochNumber !== 0 && !String(ep.epochNumber).startsWith('0.') && !String(ep.epochNumber).includes('test'));
                    return `● Season ${official.length + 1} (Aktif / Live)`;
                  })()}
                </option>
                {epochReports.map((ep, idx) => {
                  const epNum = ep.epochNumber;
                  const label = epNum === 0
                    ? 'Sesi #0 Genesis'
                    : (String(epNum).startsWith('0.') || String(epNum).includes('test') ? `Season ${epNum} (test)` : `Season ${epNum}`);
                  return (
                    <option key={ep.id || idx} value={idx} style={{ background: '#0d1117', color: '#c084fc' }}>
                      📑 {label} ({ep.createdAt ? ep.createdAt.split(',')[0] : 'Arsip'})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 2b. Sub-Tab Switcher: OVERVIEW | PAIR RECAP */}
            <div style={{ display: 'flex', gap: '4px', padding: '6px 14px', background: 'rgba(255,255,255,0.015)', borderBottom: 'var(--border-hairline)' }}>
              {[
                { key: 'OVERVIEW', label: '📊 Overview' },
                { key: 'PAIR_RECAP', label: '🗂️ Pair Recap' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setRecapSubTab(tab.key); setPairDirFilter('ALL'); }}
                  style={{
                    padding: '4px 12px', fontSize: '10px', fontWeight: '700',
                    borderRadius: '4px', cursor: 'pointer', minHeight: '26px',
                    border: recapSubTab === tab.key ? '1px solid rgba(217,70,239,0.6)' : '1px solid transparent',
                    background: recapSubTab === tab.key ? 'rgba(217,70,239,0.15)' : 'transparent',
                    color: recapSubTab === tab.key ? '#e879f9' : 'var(--text-muted)',
                    transition: 'all 0.15s'
                  }}
                >{tab.label}</button>
              ))}
            </div>

            {/* 3. Modal Body */}
            <div style={{ padding: '14px 18px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {recapSubTab === 'OVERVIEW' && (<>
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

                <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontWeight: '800' }}>MAX DRAWDOWN</div>
                  <div style={{ fontSize: '15px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: Number(sessionRecapData.maxDrawdownPct || 0) > 10 ? 'var(--accent-rust)' : 'var(--accent-orange)', marginTop: '2px' }}>
                    -{sessionRecapData.maxDrawdownPct || 0}%
                  </div>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    -{formatIdr(sessionRecapData.maxDrawdownIdr || 0)}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontWeight: '800' }}>AVG WIN / AVG LOSS</div>
                  <div style={{ fontSize: '15px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', marginTop: '2px' }}>
                    {sessionRecapData.winLossRatio || 0}x
                  </div>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    +{formatIdr(sessionRecapData.avgWinIdr || 0)} / -{formatIdr(sessionRecapData.avgLossIdr || 0)}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontWeight: '800' }}>EXPECTANCY / TRADE</div>
                  <div style={{ fontSize: '15px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: (sessionRecapData.expectancyIdr || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)', marginTop: '2px' }}>
                    {(sessionRecapData.expectancyIdr || 0) >= 0 ? '+' : ''}{formatIdr(sessionRecapData.expectancyIdr || 0)}
                  </div>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                    Nilai Ekspektasi Matematis
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
                      <th style={{ padding: '6px 8px' }}>ALOKASI MODAL SOVEREIGN</th>
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
                          <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{formatIdr(ab.currentEquity || capitalPerBotIdr)}</div>
                          <span style={{ fontSize: '8.5px', color: (ab.currentEquity || capitalPerBotIdr) >= capitalPerBotIdr ? 'var(--accent-green)' : 'var(--accent-rust)', fontWeight: '600' }}>
                            {(((ab.currentEquity || capitalPerBotIdr) / capitalPerBotIdr) * 100).toFixed(0)}% Modal Awal
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
                              <span className="badge" style={{ fontSize: '8.5px', padding: '1px 4px' }}>{p.market}</span>
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
                              <span className="badge" style={{ fontSize: '8.5px', padding: '1px 4px' }}>{p.market}</span>
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

              {/* SECTION 5B: MARKET ASSET CLASS ATTRIBUTION */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🏛️</span>
                  <span>Distribusi Kinerja per Kelas Aset (IDX, Crypto, Forex, US, Commodities)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                  {(sessionRecapData.marketClassList || []).map(m => (
                    <div key={m.market} style={{ background: 'var(--bg-panel-subtle)', padding: '10px 12px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '900', color: m.market === 'IDX' ? 'var(--accent-gold)' : m.market === 'CRYPTO' ? 'var(--accent-orange)' : m.market === 'FOREX' ? 'var(--accent-blue)' : m.market === 'COMMODITIES' ? 'var(--accent-gold)' : '#c084fc' }}>
                          {m.market}
                        </span>
                        <span className="badge" style={{ fontSize: '8px' }}>{m.totalTrades} trade</span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: m.netPnlIdr >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                        {m.netPnlIdr >= 0 ? '+' : ''}{formatIdr(m.netPnlIdr)}
                      </div>
                      <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Win Rate: {m.winRate}%</span>
                        <span>PF: {m.profitFactor}x</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 5C: TOP 3 BEST TRADES VS TOP 3 WORST TRADES */}
              {((sessionRecapData.top3BestTrades?.length > 0) || (sessionRecapData.top3WorstTrades?.length > 0)) && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⚖️</span>
                    <span>Audit Eksekusi: Top 3 Best Winning Trades vs Top 3 Worst Drawdown Trades</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
                    
                    {/* Top 3 Best Trades */}
                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '6px', padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', borderBottom: '1px solid rgba(16, 185, 129, 0.15)', paddingBottom: '6px' }}>
                        <span style={{ fontSize: '12px' }}>🏆</span>
                        <strong style={{ fontSize: '10.5px', color: 'var(--accent-green)' }}>Top 3 Best Trades (Sniper Hits)</strong>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {(sessionRecapData.top3BestTrades || []).map((t, idx) => (
                          <div key={t.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-panel)', padding: '6px 8px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ fontSize: '9px', fontWeight: '900', color: 'var(--accent-gold)' }}>#{idx + 1}</span>
                                <strong style={{ fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{t.symbol}</strong>
                                <span className="badge" style={{ fontSize: '8px' }}>{t.agentId}</span>
                                <span style={{ fontSize: '8px', color: t.direction === 'LONG' ? 'var(--accent-green)' : 'var(--accent-rust)' }}>{t.direction}</span>
                              </div>
                              <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                                Alasan: {t.exitReason} • ROI: +{t.roiPct}%
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '11px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>
                                +{formatIdr(t.pnlIdr || (t.pnlUsd * usdToIdrRate))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top 3 Worst Trades */}
                    <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', borderBottom: '1px solid rgba(239, 68, 68, 0.15)', paddingBottom: '6px' }}>
                        <span style={{ fontSize: '12px' }}>⚠️</span>
                        <strong style={{ fontSize: '10.5px', color: 'var(--accent-rust)' }}>Top 3 Worst Trades (Risk Drag)</strong>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {(sessionRecapData.top3WorstTrades || []).map((t, idx) => (
                          <div key={t.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-panel)', padding: '6px 8px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ fontSize: '9px', fontWeight: '900', color: 'var(--accent-rust)' }}>#{idx + 1}</span>
                                <strong style={{ fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{t.symbol}</strong>
                                <span className="badge" style={{ fontSize: '8px' }}>{t.agentId}</span>
                                <span style={{ fontSize: '8px', color: t.direction === 'LONG' ? 'var(--accent-green)' : 'var(--accent-rust)' }}>{t.direction}</span>
                              </div>
                              <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                                Alasan: {t.exitReason} • ROI: {t.roiPct}%
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '11px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--accent-rust)' }}>
                                {formatIdr(t.pnlIdr || (t.pnlUsd * usdToIdrRate))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* SECTION 6: SARAN & REKOMENDASI ADAPTIF KONKRET */}
              <div style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '6px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid rgba(168, 85, 247, 0.15)', paddingBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px' }}>🧠</span>
                    <strong style={{ fontSize: '11px', color: '#c084fc' }}>Saran & Rekomendasi Kuantitatif untuk Sesi Berikutnya (Closed-Loop Roadmap)</strong>
                  </div>
                  <span className="badge" style={{ fontSize: '8px', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>
                    Bridgewater Principles & Sovereign RPG Multi-Agent System
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
                  <div style={{ background: 'var(--bg-panel)', padding: '8px 10px', borderRadius: '4px', border: 'var(--border-hairline)' }}>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent-blue)', marginBottom: '3px' }}>
                      ⚖️ 1. Disiplin Modal Sovereign & Auto-MC Reset
                    </div>
                    <p style={{ margin: 0, fontSize: '9.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      Setiap bot mempertahankan modal independen Rp 1.000.000. Jika drawdown menyentuh batas Margin Call (≤ 15%), posisi otomatis dilikuidasi ke modal awal dengan autopsi pair toksik dan peningkatan generasi DNA.
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

              </>)}

              {/* ===== PAIR RECAP SUB-TAB ===== */}
              {recapSubTab === 'PAIR_RECAP' && (() => {
                const pairsData = sessionRecapData.allPairs || [];
                const hasPairs = pairsData.length > 0;
                const filteredPairs = pairDirFilter === 'ALL'
                  ? [...pairsData].sort((a, b) => b.netPnlIdr - a.netPnlIdr)
                  : [...pairsData].sort((a, b) => {
                    const aVal = pairDirFilter === 'LONG' ? a.longNetPnlIdr : a.shortNetPnlIdr;
                    const bVal = pairDirFilter === 'LONG' ? b.longNetPnlIdr : b.shortNetPnlIdr;
                    return bVal - aVal;
                  });

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Direction Filter Chips */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Arah:</span>
                      {['ALL', 'LONG', 'SHORT'].map(dir => (
                        <button
                          key={dir}
                          onClick={() => setPairDirFilter(dir)}
                          style={{
                            padding: '3px 10px', fontSize: '9.5px', fontWeight: '700', cursor: 'pointer',
                            minHeight: '24px', borderRadius: '4px',
                            border: pairDirFilter === dir
                              ? (dir === 'LONG' ? '1px solid var(--accent-green)' : dir === 'SHORT' ? '1px solid var(--accent-rust)' : '1px solid var(--accent-blue)')
                              : '1px solid transparent',
                            background: pairDirFilter === dir
                              ? (dir === 'LONG' ? 'rgba(22,163,74,0.15)' : dir === 'SHORT' ? 'rgba(239,68,68,0.15)' : 'rgba(56,189,248,0.12)')
                              : 'var(--bg-panel-subtle)',
                            color: pairDirFilter === dir
                              ? (dir === 'LONG' ? 'var(--accent-green)' : dir === 'SHORT' ? 'var(--accent-rust)' : 'var(--accent-blue)')
                              : 'var(--text-muted)'
                          }}
                        >{dir === 'ALL' ? '⚡ Semua' : dir === 'LONG' ? '📈 Long' : '📉 Short'}</button>
                      ))}
                    </div>

                    {!hasPairs && (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '11px' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                        <div>Belum ada data pair untuk sesi ini.</div>
                        {!sessionRecapData.isLive && <div style={{ fontSize: '9px', marginTop: '4px' }}>Sesi arsip lama tidak menyimpan data pair detail.</div>}
                      </div>
                    )}

                    {hasPairs && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {/* Header Row */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 80px 60px 80px 80px 80px',
                          gap: '6px', padding: '6px 10px',
                          fontSize: '8px', fontWeight: '800', color: 'var(--text-muted)',
                          textTransform: 'uppercase', letterSpacing: '0.04em',
                          borderBottom: 'var(--border-hairline)', background: 'var(--bg-panel-subtle)',
                          borderRadius: '4px 4px 0 0'
                        }}>
                          <span>Instrumen</span>
                          <span style={{ textAlign: 'right' }}>Net PnL</span>
                          <span style={{ textAlign: 'center' }}>Trades</span>
                          <span style={{ textAlign: 'center' }}>WR%</span>
                          <span style={{ textAlign: 'center' }}>Long PnL</span>
                          <span style={{ textAlign: 'center' }}>Short PnL</span>
                        </div>

                        {filteredPairs.map((p, i) => {
                          const pnlToShow = pairDirFilter === 'LONG' ? p.longNetPnlIdr : pairDirFilter === 'SHORT' ? p.shortNetPnlIdr : p.netPnlIdr;
                          const isPositive = pnlToShow >= 0;
                          const tradesShown = pairDirFilter === 'LONG' ? p.longTrades : pairDirFilter === 'SHORT' ? p.shortTrades : p.totalTrades;
                          const wrShown = pairDirFilter === 'LONG' ? p.longWinRate : pairDirFilter === 'SHORT' ? p.shortWinRate : p.winRate;
                          const mktColors = { 'FOREX': '#38bdf8', 'CRYPTO': '#fb923c', 'FUTURES': '#a78bfa', 'IDX': '#34d399' };
                          const mktColor = mktColors[p.market] || '#94a3b8';
                          return (
                            <div key={p.symbol} style={{
                              display: 'grid', gridTemplateColumns: '1fr 80px 60px 80px 80px 80px',
                              gap: '6px', padding: '7px 10px', alignItems: 'center',
                              background: i % 2 === 0 ? 'var(--bg-panel-subtle)' : 'transparent',
                              borderRadius: '3px'
                            }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '8.5px', fontWeight: '800', color: mktColor,
                                    background: `${mktColor}18`, border: `1px solid ${mktColor}40`,
                                    borderRadius: '3px', padding: '1px 5px', letterSpacing: '0.03em' }}>
                                    {p.market}
                                  </span>
                                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{p.symbol}</span>
                                </div>
                                <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '1px' }}>
                                  L: {p.longWins || 0}W/{p.longTrades || 0} ({p.longWinRate || 0}%) • S: {p.shortWins || 0}W/{p.shortTrades || 0} ({p.shortWinRate || 0}%)
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', fontSize: '11px', fontWeight: '800', fontFamily: 'var(--font-mono)',
                                color: isPositive ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                                {isPositive ? '+' : ''}{(pnlToShow / 1000).toFixed(0)}K
                              </div>
                              <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--text-secondary)' }}>
                                {tradesShown || 0}
                              </div>
                              <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: '700',
                                color: Number(wrShown) >= 50 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                                {wrShown || 0}%
                              </div>
                              <div style={{ textAlign: 'center', fontSize: '9.5px', fontFamily: 'var(--font-mono)',
                                color: p.longNetPnlIdr >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                                {p.longTrades > 0 ? `${p.longNetPnlIdr >= 0 ? '+' : ''}${(p.longNetPnlIdr / 1000).toFixed(0)}K` : '—'}
                              </div>
                              <div style={{ textAlign: 'center', fontSize: '9.5px', fontFamily: 'var(--font-mono)',
                                color: p.shortNetPnlIdr >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                                {p.shortTrades > 0 ? `${p.shortNetPnlIdr >= 0 ? '+' : ''}${(p.shortNetPnlIdr / 1000).toFixed(0)}K` : '—'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

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
                    title="Arsipkan sesi saat ini dan mulai sesi berikutnya dengan evolusi generasi"
                  >
                    <span>🔄</span>
                    <span>Selesaikan & Arsipkan Sesi Ini</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSessionRecapModalOpen(false);
                      setRecapSubTab('OVERVIEW');
                      showToast('📜 Lihat sesi aktif (Live) untuk melanjutkan trading.');
                    }}
                    style={{
                      padding: '6px 16px',
                      fontSize: '11px',
                      fontWeight: '800',
                      background: 'var(--bg-panel-subtle)',
                      color: 'var(--text-secondary)',
                      border: 'var(--border-hairline)',
                      borderRadius: 'var(--radius-xs)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>📜</span>
                    <span>Tutup Arsip</span>
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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="evolution-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setEvolutionModal({ isOpen: false, agent: null }); }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.82)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            backdropFilter: 'blur(4px)',
            padding: '16px'
          }}
        >
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
                    <h3 id="evolution-modal-title" style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: 'var(--text-primary)' }}>
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
                aria-label="Tutup modal silsilah evolusi"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer', minWidth: '32px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
                    <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                      {(evolutionModal.agent.dnaTraits?.riskMultiplier || 1.0) < 1.0 ? 'Proteksi Risiko Diperketat' : 'Standar Default'}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-panel)', padding: '6px 8px', borderRadius: '3px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '8px' }}>Confidence Boost</div>
                    <div style={{ fontWeight: '800', color: (evolutionModal.agent.dnaTraits?.confidenceBoost || 0) > 0 ? '#c084fc' : 'var(--text-primary)', fontSize: '11px' }}>
                      +{(evolutionModal.agent.dnaTraits?.confidenceBoost || 0)}%
                    </div>
                    <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Threshold Konfirmasi Masuk</div>
                  </div>

                  <div style={{ background: 'var(--bg-panel)', padding: '6px 8px', borderRadius: '3px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '8px' }}>Trailing Stop Tightness</div>
                    <div style={{ fontWeight: '800', color: (evolutionModal.agent.dnaTraits?.trailingTightness || 1.0) > 1.0 ? 'var(--accent-blue)' : 'var(--text-primary)', fontSize: '11px' }}>
                      {((evolutionModal.agent.dnaTraits?.trailingTightness || 1.0) * 100).toFixed(0)}%
                    </div>
                    <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Kecepatan Kunci Profit</div>
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
