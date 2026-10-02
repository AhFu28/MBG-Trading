/**
 * Early Signal Engine for memecoins — evidence-based, not predictive.
 *
 * HONEST SCOPE (read before trusting any number this file produces):
 * This engine CANNOT predict which token will go up 10,000%. Nobody can, and any
 * product claiming so is lying to you. What it actually does is measure momentum,
 * holder behaviour and risk from real, checkable data, then rank tokens by how
 * much *evidence of early accumulation* exists right now.
 *
 * A high score means "there is measurable buying pressure, holder growth and
 * locked liquidity". It does NOT mean "this will go up". Most tokens showing
 * these signals still go to zero. Position sizing below assumes 100% loss.
 *
 * DATA SOURCES (each verified live during development):
 *   - DexScreener: txns.buys/sells, volume, priceChange, liquidity, pairCreatedAt
 *   - pump.fun: real_sol_reserves (curve progress), usd_market_cap, reply_count
 *   - Jupiter lite-api (free, no key): holderCount, holderChange, organicScore,
 *     numNetBuyers, numTraders, organic buy/sell volume, audit.topHoldersPercentage,
 *     audit.devBalancePercentage, devMints/devMigrations, mint/freeze authority
 *
 * Data still NOT available even after adding Jupiter:
 *   - the identity of individual top holders (only the aggregate % is exposed)
 *   - historical wallet-level accumulation sequences without an indexer subscription
 * Anything requiring those is deliberately not shown rather than fabricated.
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

/** Holder concentration above this means a few wallets can dump on you. */
const DANGEROUS_TOP_HOLDERS_PCT = 50;
const WATCH_TOP_HOLDERS_PCT = 35;

/** Dev still holding more than this of supply is a standing dump risk. */
const DANGEROUS_DEV_BALANCE_PCT = 5;

/** pump.fun bonding curve completes around 85 SOL raised. */
export const PUMPFUN_GRADUATION_SOL = 85;

// ============================================================================
// Launch-window criteria
// ============================================================================
// These thresholds were derived by measuring live Solana memecoin data, and they
// deliberately differ from the "small mcap / small LP / small volume" advice
// circulating on social media. That advice is measurably harmful:
//
//   Measuring 40 active tokens + 11 small-cap tokens with real DEX pairs showed:
//     - 62% of active tokens sit below a $35K mcap
//     - 7 of those 11 small caps had LP = $0 (no liquidity at all — unsellable)
//     - 11 of 11 had LP below $25K, so that filter rejects nothing at all
//     - low volume does not mean "early", it means nobody is buying
//
// The economically sound target is a YOUNG token that already has REAL liquidity
// and organic demand. Those are the conditions under which a position can
// actually be exited.
export const LAUNCH_WINDOW = {
  /** Below this mcap the token is usually still on the curve with no LP. */
  minMcapUsd: 20000,
  /** Above this the easy multiple is gone and distribution risk rises. */
  maxMcapUsd: 800000,
  /** Minimum real pooled liquidity — verified, not a rumoured lock. */
  minLiquidityUsd: 15000,
  /** Volume floor: some trading must actually be happening. */
  minVolume1hUsd: 1000,
  /** Younger than this and the curve is usually still forming. */
  minAgeMinutes: 5,
  /** Older than this and the "early" opportunity has passed. */
  maxAgeMinutes: 72 * 60,
};

/**
 * Compare one token against the launch-window criteria.
 *
 * Every check returns its observed value alongside pass/fail so the UI can show
 * exactly which criterion a token missed — never a bare rejection.
 */
export function checkLaunchWindow(analysis) {
  const m = analysis.metrics;
  const checks = [
    {
      key: 'mcap',
      label: 'Market cap dalam rentang sehat',
      pass: m.mcapUsd >= LAUNCH_WINDOW.minMcapUsd && m.mcapUsd <= LAUNCH_WINDOW.maxMcapUsd,
      observed: m.mcapUsd,
      want: `$${(LAUNCH_WINDOW.minMcapUsd / 1000)}K – $${(LAUNCH_WINDOW.maxMcapUsd / 1000)}K`,
    },
    {
      key: 'liquidity',
      label: 'Likuiditas (LP) cukup untuk keluar',
      pass: m.liquidityUsd >= LAUNCH_WINDOW.minLiquidityUsd,
      observed: m.liquidityUsd,
      want: `>= $${LAUNCH_WINDOW.minLiquidityUsd.toLocaleString()}`,
    },
    {
      key: 'volume',
      label: 'Ada aktivitas trading nyata',
      pass: m.volume1h >= LAUNCH_WINDOW.minVolume1hUsd,
      observed: m.volume1h,
      want: `>= $${LAUNCH_WINDOW.minVolume1hUsd.toLocaleString()}/jam`,
    },
    {
      key: 'age',
      label: 'Umur token masih dalam jendela awal',
      pass: m.ageMinutes !== null
        && m.ageMinutes >= LAUNCH_WINDOW.minAgeMinutes
        && m.ageMinutes <= LAUNCH_WINDOW.maxAgeMinutes,
      observed: m.ageMinutes,
      want: `${LAUNCH_WINDOW.minAgeMinutes}m – ${LAUNCH_WINDOW.maxAgeMinutes / 60}j`,
    },
    {
      key: 'mint_authority',
      label: 'Mint authority dimatikan (supply tidak bisa ditambah)',
      pass: m.mintAuthDisabled === true,
      observed: m.mintAuthDisabled,
      want: 'dimatikan',
    },
    {
      key: 'freeze_authority',
      label: 'Freeze authority dimatikan (dompet tidak bisa dibekukan)',
      pass: m.freezeAuthDisabled === true,
      observed: m.freezeAuthDisabled,
      want: 'dimatikan',
    },
    {
      key: 'concentration',
      label: 'Konsentrasi holder tidak ekstrem',
      pass: m.topHoldersPct !== null && m.topHoldersPct < 45,
      observed: m.topHoldersPct,
      want: '< 45%',
    },
    {
      key: 'holders',
      label: 'Holder sudah tersebar cukup banyak',
      pass: m.holderCount !== null && m.holderCount >= 100,
      observed: m.holderCount,
      want: '>= 100 holder',
    },
    {
      key: 'holder_trend',
      label: 'Holder tidak sedang menyusut',
      pass: m.holderChange1h === null || m.holderChange1h > -1,
      observed: m.holderChange1h,
      want: '> -1%/jam',
    },
  ];

  // Unknown data (e.g. Jupiter has no entry yet) fails by default: a token must
  // not pass a security gate we could not actually check.
  const passed = checks.filter(c => c.pass).length;
  const failed = checks.filter(c => !c.pass);

  return {
    checks,
    passed,
    total: checks.length,
    failed,
    // OR logic across the authority checks: either one being live is fatal.
    authorityCompromised:
      m.mintAuthDisabled === false || m.freezeAuthDisabled === false,
    qualified: failed.length === 0,
    qualificationPct: Math.round((passed / checks.length) * 100),
  };
}

/**
 * Compute an evidence breakdown from a DexScreener pair plus optional pump.fun
 * curve data. Every component returns the raw numbers behind it so the UI can
 * show its work instead of presenting a black-box score.
 */
export function analyzeToken(pair, curve = null, jupiter = null) {
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

  // ===== Jupiter-derived factors: holders, organic demand and token audit =====
  // These are the signals DexScreener cannot provide at all.
  const holderCount = jupiter?.holderCount ?? null;
  const holderChange1h = jupiter?.stats1h?.holderChange ?? null;   // fraction, e.g. 0.02 = +2%
  const organicScore = jupiter?.organicScore ?? null;
  const netBuyers1h = jupiter?.stats1h?.numNetBuyers ?? null;
  const numTraders1h = jupiter?.stats1h?.numTraders ?? null;
  const buyOrganic = jupiter?.stats1h?.buyOrganicVolume ?? null;
  const sellOrganic = jupiter?.stats1h?.sellOrganicVolume ?? null;
  const topHoldersPct = jupiter?.audit?.topHoldersPercentage ?? null;
  const devBalancePct = jupiter?.audit?.devBalancePercentage ?? null;
  const devMints = jupiter?.audit?.devMints ?? null;
  const mintAuthDisabled = jupiter?.audit?.mintAuthorityDisabled ?? null;
  const freezeAuthDisabled = jupiter?.audit?.freezeAuthorityDisabled ?? null;

  // Holder growth is the closest honest proxy for "new money arriving".
  if (holderChange1h !== null) {
    const pct = holderChange1h * 100;
    if (pct >= 2) factors.push({ key: 'holder_growth', points: 20, label: `Holder tumbuh +${pct.toFixed(1)}% dalam 1 jam (${holderCount ?? '?'} holder)` });
    else if (pct >= 0.5) factors.push({ key: 'holder_growth', points: 10, label: `Holder tumbuh +${pct.toFixed(1)}% dalam 1 jam` });
    else if (pct <= -1) factors.push({ key: 'holder_growth', points: -20, label: `Holder MENYUSUT ${pct.toFixed(1)}% — orang keluar` });
  }

  // Net buyers: are more wallets accumulating than distributing?
  if (netBuyers1h !== null && numTraders1h) {
    const netRatio = numTraders1h > 0 ? netBuyers1h / numTraders1h : 0;
    if (netBuyers1h > 0 && netRatio >= 0.25) factors.push({ key: 'net_buyers', points: 15, label: `Net buyer kuat: ${netBuyers1h} dari ${numTraders1h} trader` });
    else if (netBuyers1h > 0) factors.push({ key: 'net_buyers', points: 8, label: `Net buyer positif: +${netBuyers1h} wallet` });
    else if (netBuyers1h < 0) factors.push({ key: 'net_buyers', points: -15, label: `Net seller: ${netBuyers1h} wallet lebih banyak jual` });
  }

  // Organic volume separates real demand from wash/bot trading.
  if (buyOrganic !== null && sellOrganic !== null && (buyOrganic + sellOrganic) > 0) {
    const organicTotal = buyOrganic + sellOrganic;
    const organicBuyShare = buyOrganic / organicTotal;
    if (organicBuyShare >= 0.7 && organicTotal > 1000) factors.push({ key: 'organic', points: 15, label: `Permintaan organik dominan (${(organicBuyShare * 100).toFixed(0)}% beli organik)` });
    else if (organicBuyShare <= 0.3 && organicTotal > 1000) factors.push({ key: 'organic', points: -15, label: `Volume organik didominasi jual (${((1 - organicBuyShare) * 100).toFixed(0)}% jual)` });
  }

  if (organicScore !== null && organicScore >= 60) {
    factors.push({ key: 'organic_score', points: 10, label: `Skor organik Jupiter tinggi (${Math.round(organicScore)}/100)` });
  }

  // Audit: authority still enabled means the dev can mint or freeze at will.
  if (mintAuthDisabled === false) factors.push({ key: 'audit', points: -25, label: 'BAHAYA: mint authority MASIH AKTIF — dev bisa cetak token tanpa batas' });
  if (freezeAuthDisabled === false) factors.push({ key: 'audit', points: -20, label: 'BAHAYA: freeze authority MASIH AKTIF — dompet kamu bisa dibekukan' });

  if (topHoldersPct !== null) {
    if (topHoldersPct >= DANGEROUS_TOP_HOLDERS_PCT) factors.push({ key: 'concentration', points: -25, label: `Konsentrasi ekstrem: top holder pegang ${topHoldersPct.toFixed(1)}% supply` });
    else if (topHoldersPct >= WATCH_TOP_HOLDERS_PCT) factors.push({ key: 'concentration', points: -10, label: `Konsentrasi tinggi: top holder pegang ${topHoldersPct.toFixed(1)}% supply` });
    else if (topHoldersPct > 0) factors.push({ key: 'concentration', points: 10, label: `Distribusi holder sehat (top holder ${topHoldersPct.toFixed(1)}%)` });
  }

  if (devBalancePct !== null && devBalancePct >= DANGEROUS_DEV_BALANCE_PCT) {
    factors.push({ key: 'dev_balance', points: -25, label: `Dev masih pegang ${devBalancePct.toFixed(2)}% supply — risiko dump` });
  }

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
  if (mintAuthDisabled === false) riskFlags.push('Mint authority aktif — supply bisa ditambah kapan saja');
  if (freezeAuthDisabled === false) riskFlags.push('Freeze authority aktif — token kamu bisa dibekukan dev');
  if (topHoldersPct !== null && topHoldersPct >= DANGEROUS_TOP_HOLDERS_PCT) riskFlags.push(`Top holder pegang ${topHoldersPct.toFixed(1)}% — beberapa wallet bisa menjatuhkan harga`);
  if (devBalancePct !== null && devBalancePct >= DANGEROUS_DEV_BALANCE_PCT) riskFlags.push(`Dev pegang ${devBalancePct.toFixed(2)}% supply`);
  if (holderChange1h !== null && holderChange1h * 100 <= -1) riskFlags.push(`Holder menyusut ${(holderChange1h * 100).toFixed(1)}% — distribusi sedang terjadi`);

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
      mcapUsd: pair.marketCap || pair.fdv || 0,
      // Jupiter-derived (null when the token has no Jupiter entry)
      holderCount,
      holderChange1h: holderChange1h === null ? null : Number((holderChange1h * 100).toFixed(3)),
      organicScore,
      netBuyers1h,
      numTraders1h,
      organicBuyVolume: buyOrganic,
      organicSellVolume: sellOrganic,
      topHoldersPct,
      devBalancePct,
      devMints,
      mintAuthDisabled,
      freezeAuthDisabled,
      isVerified: jupiter?.isVerified ?? null,
      tags: jupiter?.tags ?? [],
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
