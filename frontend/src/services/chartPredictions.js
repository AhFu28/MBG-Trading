/**
 * Chart Prediction & Strategy Scoring System for Legend Tier.
 *
 * OWNER REQUEST (Jendral Arib, 2026-10-09):
 *   "jadii untuk jadi legend, berikan tambahan .. semakin orang itu menebakk chart
 *    dengan benar dengan strategy dan analisa yg tepat akan dapat poin"
 *
 * QUANT DESIGN PHILOSOPHY:
 * 1. An analyst is evaluated not merely on guessing coin flips, but on:
 *    - Identifying direction (BULLISH vs BEARISH)
 *    - Structured strategy rationale (SMC, Breakout, Mean Reversion, Bandarmology)
 *    - Setting mathematical Risk:Reward with clear Stop Loss and Target
 * 2. Successful verified forecasts award mastery points toward the Legend Path.
 * 3. Every prediction has a verifiable immutable lifecycle: PENDING -> WON / LOST.
 */

import { bumpAchievement, recordActiveDay } from './achievements.js';

export const PREDICTION_STORAGE_KEY = 'mbg_chart_predictions_v1';

export const PREDICTION_STRATEGIES = [
  { id: 'BREAKOUT_RETEST', label: 'Breakout & Retest Resistance/Support' },
  { id: 'SMC_ORDER_BLOCK', label: 'Smart Money Concepts (Order Block & Liquidity Sweep)' },
  { id: 'MEAN_REVERSION', label: 'Mean Reversion & RSI Divergence' },
  { id: 'TREND_MOMENTUM', label: 'Trend Following & EMA Momentum Alpha' },
  { id: 'BANDARMOLOGY_FLOW', label: 'Bandarmology & Volume Accumulation Flow' },
];

export const PREDICTION_TIMEFRAMES = [
  { id: '1H', label: '1 Jam' },
  { id: '4H', label: '4 Jam' },
  { id: '24H', label: '24 Jam' },
  { id: '7D', label: '7 Hari' },
];

export const PREDICTION_STATUS = {
  PENDING: 'PENDING',
  WON: 'WON',
  LOST: 'LOST',
  EXPIRED: 'EXPIRED',
};

/** Load all stored predictions. */
export function getStoredPredictions() {
  try {
    const raw = localStorage.getItem(PREDICTION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Save prediction list to storage. */
export function saveStoredPredictions(predictions) {
  try {
    localStorage.setItem(PREDICTION_STORAGE_KEY, JSON.stringify(predictions));
  } catch (err) {
    console.warn('Failed to save chart predictions:', err);
  }
}

/**
 * Calculate potential points for a prediction setup.
 *
 * - Base correct: 100 pts
 * - Rationale analysis >= 20 chars: +25 pts
 * - Valid Risk:Reward >= 2.0: +25 pts
 * - Risk Discipline (Stop Loss defined): +10 pts
 */
export function calculatePotentialPoints({ rationale = '', entryPrice, stopLoss, targetPrice }) {
  let points = 100;
  if (String(rationale).trim().length >= 20) points += 25;
  
  const entry = Number(entryPrice) || 0;
  const sl = Number(stopLoss) || 0;
  const tp = Number(targetPrice) || 0;

  if (entry > 0 && sl > 0) points += 10;

  if (entry > 0 && sl > 0 && tp > 0) {
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    if (risk > 0 && reward / risk >= 1.95) {
      points += 25;
    }
  }

  return points;
}

/**
 * Submit a new chart prediction and strategy setup.
 */
export function submitPrediction({
  symbol = 'BTCUSDT',
  market = 'CRYPTO',
  direction = 'BULLISH',
  entryPrice,
  targetPrice,
  stopLoss,
  strategy = 'BREAKOUT_RETEST',
  timeframe = '24H',
  rationale = '',
}) {
  const entry = Number(entryPrice);
  const target = Number(targetPrice);
  const sl = Number(stopLoss);

  if (!symbol) throw new Error('Simbol instrumen harus diisi.');
  if (!Number.isFinite(entry) || entry <= 0) throw new Error('Harga entri harus valid dan > 0.');
  if (!Number.isFinite(target) || target <= 0) throw new Error('Target harga harus valid dan > 0.');
  if (!Number.isFinite(sl) || sl <= 0) throw new Error('Stop loss harus diisi untuk membatasi risiko.');

  // Validate geometry
  if (direction === 'BULLISH') {
    if (sl >= entry) throw new Error('Untuk prediksi BULLISH, Stop Loss harus di bawah harga entri.');
    if (target <= entry) throw new Error('Untuk prediksi BULLISH, Target harus di atas harga entri.');
  } else if (direction === 'BEARISH') {
    if (sl <= entry) throw new Error('Untuk prediksi BEARISH, Stop Loss harus di atas harga entri.');
    if (target >= entry) throw new Error('Untuk prediksi BEARISH, Target harus di bawah harga entri.');
  }

  const potentialPoints = calculatePotentialPoints({ rationale, entryPrice: entry, stopLoss: sl, targetPrice: target });

  const record = {
    id: `PRED_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    symbol: symbol.toUpperCase(),
    market,
    direction,
    entryPrice: entry,
    targetPrice: target,
    stopLoss: sl,
    strategy,
    timeframe,
    rationale: String(rationale || '').trim(),
    potentialPoints,
    pointsAwarded: 0,
    status: PREDICTION_STATUS.PENDING,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    resolvedPrice: null,
    verdictNote: null,
  };

  const list = getStoredPredictions();
  list.unshift(record);
  saveStoredPredictions(list);

  recordActiveDay();
  return record;
}

/**
 * Resolve a prediction with a verdict.
 */
export function resolvePrediction(id, { currentPrice, verdict, verdictNote = '' }) {
  const list = getStoredPredictions();
  const idx = list.findIndex(p => p.id === id);
  if (idx === -1) return null;

  const item = list[idx];
  if (item.status !== PREDICTION_STATUS.PENDING) return item;

  const isWon = verdict === PREDICTION_STATUS.WON;
  const points = isWon ? item.potentialPoints : 0;

  const updated = {
    ...item,
    status: isWon ? PREDICTION_STATUS.WON : PREDICTION_STATUS.LOST,
    resolvedPrice: Number(currentPrice) || item.entryPrice,
    resolvedAt: new Date().toISOString(),
    pointsAwarded: points,
    verdictNote: verdictNote || (isWon ? 'Target tercapai sesuai strategi!' : 'Stop loss tersentuh.'),
  };

  list[idx] = updated;
  saveStoredPredictions(list);

  if (isWon) {
    bumpAchievement('chartPredictionsCorrect', 1);
    bumpAchievement('predictionPoints', points);
  }

  return updated;
}

/**
 * Automatically evaluate pending predictions against live prices.
 */
export function evaluatePredictionsWithLivePrices(livePrices = {}) {
  const list = getStoredPredictions();
  let changed = false;

  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    if (p.status !== PREDICTION_STATUS.PENDING) continue;

    const sym = p.symbol;
    const curObj = livePrices[sym] || livePrices[`BINANCE:${sym}`] || livePrices[`IDX:${sym}`];
    const curPrice = Number(curObj?.price || curObj?.close || curObj);

    if (!Number.isFinite(curPrice) || curPrice <= 0) continue;

    if (p.direction === 'BULLISH') {
      if (curPrice >= p.targetPrice) {
        list[i] = {
          ...p,
          status: PREDICTION_STATUS.WON,
          resolvedPrice: curPrice,
          resolvedAt: new Date().toISOString(),
          pointsAwarded: p.potentialPoints,
          verdictNote: `Target $${p.targetPrice} tercapai pada harga $${curPrice}!`,
        };
        bumpAchievement('chartPredictionsCorrect', 1);
        bumpAchievement('predictionPoints', p.potentialPoints);
        changed = true;
      } else if (curPrice <= p.stopLoss) {
        list[i] = {
          ...p,
          status: PREDICTION_STATUS.LOST,
          resolvedPrice: curPrice,
          resolvedAt: new Date().toISOString(),
          pointsAwarded: 0,
          verdictNote: `Stop loss $${p.stopLoss} tersentuh pada harga $${curPrice}.`,
        };
        changed = true;
      }
    } else if (p.direction === 'BEARISH') {
      if (curPrice <= p.targetPrice) {
        list[i] = {
          ...p,
          status: PREDICTION_STATUS.WON,
          resolvedPrice: curPrice,
          resolvedAt: new Date().toISOString(),
          pointsAwarded: p.potentialPoints,
          verdictNote: `Target short $${p.targetPrice} tercapai pada harga $${curPrice}!`,
        };
        bumpAchievement('chartPredictionsCorrect', 1);
        bumpAchievement('predictionPoints', p.potentialPoints);
        changed = true;
      } else if (curPrice >= p.stopLoss) {
        list[i] = {
          ...p,
          status: PREDICTION_STATUS.LOST,
          resolvedPrice: curPrice,
          resolvedAt: new Date().toISOString(),
          pointsAwarded: 0,
          verdictNote: `Stop loss short $${p.stopLoss} tersentuh pada harga $${curPrice}.`,
        };
        changed = true;
      }
    }
  }

  if (changed) {
    saveStoredPredictions(list);
  }

  return list;
}

/**
 * Summary stats for UI and Legend eligibility insights.
 */
export function getPredictionStats() {
  const list = getStoredPredictions();
  const total = list.length;
  const won = list.filter(p => p.status === PREDICTION_STATUS.WON).length;
  const lost = list.filter(p => p.status === PREDICTION_STATUS.LOST).length;
  const pending = list.filter(p => p.status === PREDICTION_STATUS.PENDING).length;
  const resolved = won + lost;
  const winRate = resolved > 0 ? ((won / resolved) * 100).toFixed(1) : '—';
  const totalPoints = list.reduce((acc, p) => acc + (p.pointsAwarded || 0), 0);

  let rank = 'Pemula Chart';
  if (totalPoints >= 500) rank = '👑 Legend Quant Strategist';
  else if (totalPoints >= 250) rank = '⚡ Senior Tactical Analyst';
  else if (totalPoints >= 100) rank = '📈 Junior Strategist';

  return {
    total,
    won,
    lost,
    pending,
    resolved,
    winRate,
    totalPoints,
    rank,
  };
}
