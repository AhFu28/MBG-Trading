/**
 * Early Signal Engine for memecoins — evidence-based, not predictive.
 *
 * HONEST SCOPE (read before trusting any number this file produces):
 * This engine CANNOT predict which token will go up 10,000%. Nobody can, and any
 * product claiming so is lying to you. What it actually does is measure momentum
 * and risk from real, checkable on-chain/venue data, then rank tokens by how much
 * *evidence of early accumulation* exists right now.
 *
 * A high score means "there is measurable buying pressure and locked liquidity".
 * It does NOT mean "this will go up". Most tokens that show these signals still
 * go to zero. Position sizing below assumes you can lose 100% of the position.
 *
 * DATA ACTUALLY AVAILABLE (verified against live endpoints):
 *   - DexScreener: txns.buys/sells per interval, volume per interval, priceChange
 *     per interval, liquidity.usd, fdv, marketCap, pairCreatedAt
 *   - pump.fun: real_sol_reserves (curve progress), usd_market_cap, reply_count,
 *     complete flag, last_trade_timestamp
 *
 * DATA EXPLICITLY NOT AVAILABLE (do not pretend otherwise):
 *   - holder count, holder concentration, insider/dev wallet share
 *   - dev sell history, sniper wallet detection
 * pump.fun exposes no holder field, and Solana public RPC rejected
 * getTokenLargestAccounts during development. Any "holder analysis" UI would be
 * fabricated, so this engine does not produce one.
 */

/** A buy/sell ratio above this in the 1h window indicates one-sided demand. */
const STRONG_BUY_PRESSURE = 1.5;
const EXTREME_BUY_PRESSURE = 2.5;

/** Volume acceleration: h1 volume vs the hourly average implied by h24. */
const VOLUME_ACCEL_STRONG = 2.0;

/** Liquidity below this on a memecoin is where you get exit-scammed. */
const THIN_LIQUIDITY_USD = 10000;
const HEALTHY_LIQUIDITY_USD = 50000;

/** Turnover = h24 volume / liquidity. Very high means churn, not conviction. */
const OVERHEATED_TURNOVER = 15;

/** pump.fun bonding curve completes around 85 SOL raised. */
export const PUMPFUN_GRADUATION_SOL = 85;

/**
 * Compute an evidence breakdown from a DexScreener pair plus optional pump.fun
 * curve data. Every component returns the raw numbers behind it so the UI can
 * show its work instead of presenting a black-box score.
 */
export function analyzeToken(pair, curve = null) {
  const txns = pair.txns || {};
  const vol = pair.volume || {};
  const chg = pair.priceChange || {};
  const liq = pair.liquidity?.usd || 0;

  const h1 = txns.h1 || { buys: 0, sells: 0 };
  const m5 = txns.m5 || { buys: 0, sells: 0 };
  const h24 = txns.h24 || { buys: 0, sells: 0 };

  // --- Signal 1: buy/sell pressure (the core "someone is accumulating" measure)
  const ratio1h = h1.sells > 0 ? h1.buys / h1.sells : (h1.buys > 0 ? Infinity : 0);
  const ratio5m = m5.sells > 0 ? m5.buys / m5.sells : (m5.buys > 0 ? Infinity : 0);

  // --- Signal 2: volume acceleration vs the 24h hourly baseline
  const hourlyBaseline = (vol.h24 || 0) / 24;
  const volumeAccel = hourlyBaseline > 0 ? (vol.h1 || 0) / hourlyBaseline : 0;

  // --- Signal 3: liquidity safety (can you actually exit?)
  const liquiditySafe = liq >= HEALTHY_LIQUIDITY_USD;
  const liquidityThin = liq > 0 && liq < THIN_LIQUIDITY_USD;

  // --- Signal 4: turnover — too high means churn/pvp, not conviction
  const turnover = liq > 0 ? (vol.h24 || 0) / liq : 0;
  const overheated = turnover > OVERHEATED_TURNOVER;

  // --- Signal 5: price still flat while buying is heavy = "before it moves"
  const priceFlat1h = Math.abs(chg.h1 ?? 0) < 5;
  const accumulationBeforeMove = ratio1h >= STRONG_BUY_PRESSURE && priceFlat1h;

  // --- Signal 6: bonding curve progress (pump.fun only)
  const solRaised = curve?.real_sol_reserves ? curve.real_sol_reserves / 1e9 : null;
  const curveProgress = solRaised !== null
    ? Math.min(100, Math.round((solRaised / PUMPFUN_GRADUATION_SOL) * 100))
    : null;

  // --- Signal 7: age. Fresher = earlier, but also riskier.
  const ageMinutes = pair.pairCreatedAt
    ? Math.max(0, Math.round((Date.now() - pair.pairCreatedAt) / 60000))
    : null;

  // --- Scoring: additive, capped, each contributor traceable
  const factors = [];

  if (ratio1h >= EXTREME_BUY_PRESSURE) factors.push({ key: 'buy_pressure', points: 25, label: `Tekanan beli ekstrem (${ratio1h.toFixed(2)}x)` });
  else if (ratio1h >= STRONG_BUY_PRESSURE) factors.push({ key: 'buy_pressure', points: 15, label: `Tekanan beli kuat (${ratio1h.toFixed(2)}x)` });
  else if (ratio1h > 0 && ratio1h < 0.7) factors.push({ key: 'buy_pressure', points: -20, label: `Tekanan jual dominan (${ratio1h.toFixed(2)}x)` });

  if (volumeAccel >= VOLUME_ACCEL_STRONG) factors.push({ key: 'volume_accel', points: 20, label: `Volume meledak ${volumeAccel.toFixed(1)}x dari baseline` });
  else if (volumeAccel >= 1.2) factors.push({ key: 'volume_accel', points: 10, label: `Volume naik ${volumeAccel.toFixed(1)}x` });

  if (liquiditySafe) factors.push({ key: 'liquidity', points: 15, label: `Likuiditas sehat ($${Math.round(liq).toLocaleString()})` });
  else if (liquidityThin) factors.push({ key: 'liquidity', points: -30, label: `Likuiditas sangat tipis ($${Math.round(liq).toLocaleString()}) — risiko exit scam` });

  if (accumulationBeforeMove) factors.push({ key: 'early', points: 20, label: 'Akumulasi terdeteksi SEBELUM harga bergerak' });

  if (curveProgress !== null) {
    if (curveProgress >= 100) factors.push({ key: 'curve', points: 15, label: 'Bonding curve LULUS — siap listing DEX' });
    else if (curveProgress >= 60) factors.push({ key: 'curve', points: 10, label: `Bonding curve ${curveProgress}% (mendekati lulus)` });
    else if (curveProgress < 10) factors.push({ key: 'curve', points: -10, label: `Bonding curve baru ${curveProgress}%` });
  }

  if (overheated) factors.push({ key: 'turnover', points: -15, label: `Turnover ${turnover.toFixed(1)}x — churn tinggi, bukan akumulasi` });

  const rawScore = factors.reduce((sum, f) => sum + f.points, 0);
  const score = Math.max(0, Math.min(100, rawScore));

  // Risk is deliberately computed separately: a token can be "early" AND a scam.
  const riskFlags = [];
  if (liquidityThin) riskFlags.push('Likuiditas tipis — sulit keluar, rawan rug');
  if (ratio1h > 0 && ratio1h < 0.7) riskFlags.push('Penjual lebih banyak dari pembeli');
  if (overheated) riskFlags.push('Volume berputar terlalu cepat (churn)');
  if (ageMinutes !== null && ageMinutes < 5) riskFlags.push('Token berumur < 5 menit — sangat spekulatif');
  if (curveProgress !== null && curveProgress < 10) riskFlags.push('Bonding curve hampir kosong — bisa gagal total');
  if (liq === 0) riskFlags.push('Likuiditas tidak terdeteksi — tidak bisa diverifikasi');

  const verdict = riskFlags.length >= 3 ? 'HIGH_RISK'
    : riskFlags.length >= 1 ? 'CAUTION'
    : 'CLEAN';

  return {
    score,
    rawScore,
    factors,
    riskFlags,
    verdict,
    metrics: {
      ratio1h: Number.isFinite(ratio1h) ? Number(ratio1h.toFixed(2)) : null,
      ratio5m: Number.isFinite(ratio5m) ? Number(ratio5m.toFixed(2)) : null,
      volumeAccel: Number(volumeAccel.toFixed(2)),
      turnover: Number(turnover.toFixed(2)),
      liquidityUsd: liq,
      buys1h: h1.buys,
      sells1h: h1.sells,
      volume24h: vol.h24 || 0,
      volume1h: vol.h1 || 0,
      change1h: chg.h1 ?? null,
      change24h: chg.h24 ?? null,
      curveProgress,
      solRaised,
      ageMinutes,
      accumulationBeforeMove,
    },
  };
}

/**
 * Build a dummy (simulated) trade plan from the token's REAL volatility.
 *
 * Every number is derived from observed data — nothing is invented:
 *   - entry      = current price
 *   - stop loss  = entry minus a volatility-scaled distance
 *   - targets    = volatility-scaled multiples, R:R genuinely computed
 *   - size       = fixed fractional risk of the stated capital
 *
 * This is a SIMULATION. It does not place an order and no wallet is touched.
 */
export function buildDummyPlan(pair, analysis, opts = {}) {
  const capitalUsd = opts.capitalUsd ?? 1000;
  const riskPct = opts.riskPct ?? 0.01;         // 1% of capital at risk
  const maxPositionPct = opts.maxPositionPct ?? 0.1; // never more than 10% of capital

  const price = parseFloat(pair.priceUsd || 0);
  if (!price || price <= 0) return null;

  // Volatility proxy: memecoins move violently; use the observed 1h move plus a
  // floor so brand-new flat tokens still get a sane stop.
  const observed1h = Math.abs(analysis.metrics.change1h ?? 0);
  const observed24h = Math.abs(analysis.metrics.change24h ?? 0);
  const volatilityPct = Math.max(12, Math.min(60, Math.max(observed1h * 1.5, observed24h * 0.5)));

  const stopDistance = price * (volatilityPct / 100);
  const stopLoss = Math.max(price - stopDistance, price * 0.05); // never a zero/negative stop

  // R:R is enforced, not wished for: TP1 = 1.5R, TP2 = 3R.
  const riskPerUnit = price - stopLoss;
  const takeProfit1 = price + riskPerUnit * 1.5;
  const takeProfit2 = price + riskPerUnit * 3.0;

  // Position sizing from the actual risk budget, capped by max position size.
  const riskBudget = capitalUsd * riskPct;
  const unitsByRisk = riskPerUnit > 0 ? riskBudget / riskPerUnit : 0;
  const unitsByCap = (capitalUsd * maxPositionPct) / price;
  const units = Math.max(0, Math.min(unitsByRisk, unitsByCap));

  const positionUsd = units * price;
  const actualRiskUsd = units * riskPerUnit;
  const actualRiskPct = capitalUsd > 0 ? (actualRiskUsd / capitalUsd) * 100 : 0;

  return {
    simulated: true,
    entry: price,
    stopLoss,
    takeProfit1,
    takeProfit2,
    riskPerUnit,
    stopDistancePct: Number(((riskPerUnit / price) * 100).toFixed(2)),
    rrRatio: '1:1.5 / 1:3.0',
    units,
    positionUsd: Number(positionUsd.toFixed(2)),
    riskBudgetUsd: Number(riskBudget.toFixed(2)),
    actualRiskUsd: Number(actualRiskUsd.toFixed(2)),
    actualRiskPct: Number(actualRiskPct.toFixed(2)),
    // Explicit numbers so the UI never has to invent them.
    gainAtTp1Usd: Number((units * (takeProfit1 - price)).toFixed(2)),
    gainAtTp2Usd: Number((units * (takeProfit2 - price)).toFixed(2)),
    lossAtSlUsd: Number((-units * riskPerUnit).toFixed(2)),
    volatilityPct: Number(volatilityPct.toFixed(1)),
  };
}

/** Rank candidates: evidence score first, then risk penalty, then freshness. */
export function rankCandidates(rows) {
  const verdictPenalty = { HIGH_RISK: -60, CAUTION: -20, CLEAN: 0 };
  return [...rows].sort((a, b) => {
    const sa = a.analysis.score + verdictPenalty[a.analysis.verdict];
    const sb = b.analysis.score + verdictPenalty[b.analysis.verdict];
    if (sb !== sa) return sb - sa;
    const aa = a.analysis.metrics.ageMinutes ?? 99999;
    const ab = b.analysis.metrics.ageMinutes ?? 99999;
    return aa - ab;
  });
}
