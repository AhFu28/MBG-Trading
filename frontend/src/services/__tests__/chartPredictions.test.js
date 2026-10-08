import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculatePotentialPoints,
  submitPrediction,
  resolvePrediction,
  evaluatePredictionsWithLivePrices,
  getPredictionStats,
  getStoredPredictions,
  saveStoredPredictions,
  PREDICTION_STORAGE_KEY,
  PREDICTION_STATUS,
} from '../chartPredictions.js';
import { loadAchievementContext, ACHIEVEMENT_STORAGE_KEY } from '../achievements.js';

function makeStorage() {
  const map = new Map();
  return {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: k => map.delete(k),
    _map: map,
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', makeStorage());
});

describe('calculatePotentialPoints', () => {
  it('gives base 100 points for a bare setup', () => {
    const pts = calculatePotentialPoints({ entryPrice: 100, stopLoss: 95, targetPrice: 105 });
    // base 100 + 10 discipline (has stop loss) = 110
    expect(pts).toBe(110);
  });

  it('awards +25 bonus for a thorough strategy rationale (>= 20 chars)', () => {
    const pts = calculatePotentialPoints({
      entryPrice: 100,
      stopLoss: 95,
      targetPrice: 105,
      rationale: 'Breakout konfirmasi volume tinggi dengan retest demand zone kuat',
    });
    // 100 base + 10 discipline + 25 rationale = 135
    expect(pts).toBe(135);
  });

  it('awards +25 bonus for high Risk:Reward ratio (>= 2.0)', () => {
    const pts = calculatePotentialPoints({
      entryPrice: 100,
      stopLoss: 95, // risk 5
      targetPrice: 110, // reward 10 -> R:R 2.0
      rationale: 'Breakout konfirmasi volume tinggi dengan retest demand zone kuat',
    });
    // 100 base + 10 discipline + 25 rationale + 25 RR = 160
    expect(pts).toBe(160);
  });
});

describe('submitPrediction', () => {
  it('submits a valid BULLISH setup and records it in storage', () => {
    const p = submitPrediction({
      symbol: 'BTCUSDT',
      market: 'CRYPTO',
      direction: 'BULLISH',
      entryPrice: 65000,
      targetPrice: 70000,
      stopLoss: 63000,
      strategy: 'BREAKOUT_RETEST',
      rationale: 'Retest weekly support dengan bullish engulfing candle',
    });

    expect(p.id).toMatch(/^PRED_/);
    expect(p.status).toBe(PREDICTION_STATUS.PENDING);
    expect(p.potentialPoints).toBe(160); // has SL + rationale + RR > 2

    const stored = getStoredPredictions();
    expect(stored.length).toBe(1);
    expect(stored[0].symbol).toBe('BTCUSDT');
  });

  it('rejects a BULLISH setup where stop loss is above entry', () => {
    expect(() => {
      submitPrediction({
        symbol: 'BTCUSDT',
        direction: 'BULLISH',
        entryPrice: 100,
        stopLoss: 105, // invalid
        targetPrice: 120,
      });
    }).toThrow(/Stop Loss harus di bawah harga entri/i);
  });

  it('rejects a BEARISH setup where target is above entry', () => {
    expect(() => {
      submitPrediction({
        symbol: 'ETHUSDT',
        direction: 'BEARISH',
        entryPrice: 3000,
        stopLoss: 3200,
        targetPrice: 3500, // invalid for short
      });
    }).toThrow(/Target harus di bawah harga entri/i);
  });

  it('rejects missing or zero entry price', () => {
    expect(() => {
      submitPrediction({
        symbol: 'BBCA',
        direction: 'BULLISH',
        entryPrice: 0,
        stopLoss: 9000,
        targetPrice: 10500,
      });
    }).toThrow(/Harga entri harus valid/i);
  });
});

describe('resolvePrediction and achievements integration', () => {
  it('awards points and bumps achievements when prediction is WON', () => {
    const p = submitPrediction({
      symbol: 'SOLUSDT',
      direction: 'BULLISH',
      entryPrice: 100,
      stopLoss: 90,
      targetPrice: 120,
      rationale: 'Likuiditas sweep di bawah swing low 4 jam dan divergensi RSI',
    });

    const initialCtx = loadAchievementContext();
    expect(initialCtx.chartPredictionsCorrect).toBe(0);

    const resolved = resolvePrediction(p.id, {
      currentPrice: 121,
      verdict: PREDICTION_STATUS.WON,
      verdictNote: 'Target hit!',
    });

    expect(resolved.status).toBe(PREDICTION_STATUS.WON);
    expect(resolved.pointsAwarded).toBe(160);

    const updatedCtx = loadAchievementContext();
    expect(updatedCtx.chartPredictionsCorrect).toBe(1);
    expect(updatedCtx.predictionPoints).toBe(160);
  });

  it('awards zero points when prediction is LOST', () => {
    const p = submitPrediction({
      symbol: 'SOLUSDT',
      direction: 'BULLISH',
      entryPrice: 100,
      stopLoss: 90,
      targetPrice: 120,
    });

    const resolved = resolvePrediction(p.id, {
      currentPrice: 89,
      verdict: PREDICTION_STATUS.LOST,
      verdictNote: 'Stop loss hit',
    });

    expect(resolved.status).toBe(PREDICTION_STATUS.LOST);
    expect(resolved.pointsAwarded).toBe(0);

    const updatedCtx = loadAchievementContext();
    expect(updatedCtx.chartPredictionsCorrect).toBe(0);
  });
});

describe('evaluatePredictionsWithLivePrices', () => {
  it('automatically resolves BULLISH when live price reaches target price', () => {
    submitPrediction({
      symbol: 'BTCUSDT',
      direction: 'BULLISH',
      entryPrice: 65000,
      stopLoss: 63000,
      targetPrice: 70000,
    });

    evaluatePredictionsWithLivePrices({
      BTCUSDT: { price: 70500 },
    });

    const stored = getStoredPredictions();
    expect(stored[0].status).toBe(PREDICTION_STATUS.WON);
    expect(stored[0].resolvedPrice).toBe(70500);
  });

  it('automatically resolves BEARISH when live price drops below target price', () => {
    submitPrediction({
      symbol: 'ETHUSDT',
      direction: 'BEARISH',
      entryPrice: 3000,
      stopLoss: 3200,
      targetPrice: 2800,
    });

    evaluatePredictionsWithLivePrices({
      ETHUSDT: { price: 2750 },
    });

    const stored = getStoredPredictions();
    expect(stored[0].status).toBe(PREDICTION_STATUS.WON);
  });
});

describe('getPredictionStats', () => {
  it('computes correct summary metrics and rank upgrade', () => {
    const p1 = submitPrediction({
      symbol: 'BTCUSDT',
      direction: 'BULLISH',
      entryPrice: 100,
      stopLoss: 95,
      targetPrice: 110,
      rationale: 'Analisa kuantitatif momentum alpha kuat',
    });
    resolvePrediction(p1.id, { currentPrice: 111, verdict: PREDICTION_STATUS.WON });

    const stats = getPredictionStats();
    expect(stats.total).toBe(1);
    expect(stats.won).toBe(1);
    expect(stats.winRate).toBe('100.0');
    expect(stats.totalPoints).toBe(160);
    expect(stats.rank).toBe('📈 Junior Strategist');
  });
});
