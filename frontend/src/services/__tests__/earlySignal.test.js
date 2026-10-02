import { describe, it, expect } from 'vitest';
import { analyzeToken, buildDummyPlan, rankCandidates, PUMPFUN_GRADUATION_SOL } from '../earlySignal.js';

/** Build a DexScreener-shaped pair fixture. */
function makePair(overrides = {}) {
  return {
    chainId: 'solana',
    dexId: 'raydium',
    baseToken: { symbol: 'TEST', name: 'Test Token', address: 'mint1' },
    priceUsd: '1.00',
    txns: {
      m5: { buys: 10, sells: 10 },
      h1: { buys: 100, sells: 100 },
      h24: { buys: 2400, sells: 2400 },
    },
    volume: { h24: 240000, h1: 10000, m5: 800 },
    priceChange: { m5: 0, h1: 0, h24: 0 },
    liquidity: { usd: 100000 },
    fdv: 1000000,
    marketCap: 1000000,
    pairCreatedAt: Date.now() - 3600_000,
    url: 'https://dexscreener.com/solana/test',
    ...overrides,
  };
}

describe('analyzeToken — buy/sell pressure', () => {
  it('rewards extreme buy pressure', () => {
    const pair = makePair({ txns: { m5: { buys: 5, sells: 5 }, h1: { buys: 300, sells: 100 }, h24: { buys: 2400, sells: 2400 } } });
    const r = analyzeToken(pair);
    expect(r.metrics.ratio1h).toBe(3);
    expect(r.factors.find(f => f.key === 'buy_pressure').points).toBe(25);
  });

  it('penalises dominant selling', () => {
    const pair = makePair({ txns: { m5: { buys: 5, sells: 5 }, h1: { buys: 40, sells: 200 }, h24: { buys: 2400, sells: 2400 } } });
    const r = analyzeToken(pair);
    expect(r.metrics.ratio1h).toBe(0.2);
    expect(r.factors.find(f => f.key === 'buy_pressure').points).toBe(-20);
    expect(r.riskFlags).toContain('Penjual lebih banyak dari pembeli');
  });

  it('handles zero sells without producing Infinity in metrics', () => {
    const pair = makePair({ txns: { m5: { buys: 5, sells: 0 }, h1: { buys: 50, sells: 0 }, h24: { buys: 500, sells: 0 } } });
    const r = analyzeToken(pair);
    expect(r.metrics.ratio1h).toBeNull(); // Infinity must not leak into display data
    expect(Number.isFinite(r.score)).toBe(true);
  });

  it('handles a completely dead token (no trades at all)', () => {
    const pair = makePair({ txns: { m5: { buys: 0, sells: 0 }, h1: { buys: 0, sells: 0 }, h24: { buys: 0, sells: 0 } }, volume: { h24: 0, h1: 0 }, liquidity: { usd: 0 } });
    const r = analyzeToken(pair);
    expect(r.metrics.ratio1h).toBe(0);
    expect(Number.isFinite(r.score)).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.riskFlags).toContain('Likuiditas tidak terdeteksi — tidak bisa diverifikasi');
  });
});

describe('analyzeToken — liquidity safety', () => {
  it('flags thin liquidity as a danger and penalises hard', () => {
    const r = analyzeToken(makePair({ liquidity: { usd: 3000 } }));
    expect(r.factors.find(f => f.key === 'liquidity').points).toBe(-30);
    expect(r.riskFlags.some(f => /Likuiditas tipis/.test(f))).toBe(true);
  });

  it('rewards healthy liquidity', () => {
    const r = analyzeToken(makePair({ liquidity: { usd: 80000 } }));
    expect(r.factors.find(f => f.key === 'liquidity').points).toBe(15);
  });
});

describe('analyzeToken — the actual "before it moves" signal', () => {
  it('detects heavy buying while price is still flat', () => {
    const pair = makePair({
      txns: { m5: { buys: 5, sells: 5 }, h1: { buys: 300, sells: 100 }, h24: { buys: 2400, sells: 2400 } },
      priceChange: { m5: 0, h1: 2, h24: 30 },
    });
    const r = analyzeToken(pair);
    expect(r.metrics.accumulationBeforeMove).toBe(true);
    expect(r.factors.some(f => f.key === 'early')).toBe(true);
  });

  it('does NOT flag it when price already moved hard', () => {
    const pair = makePair({
      txns: { m5: { buys: 5, sells: 5 }, h1: { buys: 300, sells: 100 }, h24: { buys: 2400, sells: 2400 } },
      priceChange: { m5: 0, h1: 45, h24: 90 },
    });
    const r = analyzeToken(pair);
    expect(r.metrics.accumulationBeforeMove).toBe(false);
  });
});

describe('analyzeToken — bonding curve', () => {
  it('computes progress and rewards graduation', () => {
    const r = analyzeToken(makePair(), { real_sol_reserves: 90e9 });
    expect(r.metrics.curveProgress).toBe(100);
    expect(r.factors.find(f => f.key === 'curve').points).toBe(15);
  });

  it('caps progress at 100 for a heavily funded curve', () => {
    const r = analyzeToken(makePair(), { real_sol_reserves: 500e9 });
    expect(r.metrics.curveProgress).toBe(100);
  });

  it('penalises an almost-empty curve', () => {
    const r = analyzeToken(makePair(), { real_sol_reserves: 3e9 });
    expect(r.metrics.curveProgress).toBe(Math.round((3 / PUMPFUN_GRADUATION_SOL) * 100));
    expect(r.factors.find(f => f.key === 'curve').points).toBe(-10);
  });

  it('reports null curve metrics when no pump.fun data is supplied', () => {
    const r = analyzeToken(makePair());
    expect(r.metrics.curveProgress).toBeNull();
    expect(r.metrics.solRaised).toBeNull();
  });
});

describe('analyzeToken — score bounds and honesty', () => {
  it('never exceeds 100 even with every positive factor', () => {
    const pair = makePair({
      txns: { m5: { buys: 50, sells: 1 }, h1: { buys: 900, sells: 100 }, h24: { buys: 2400, sells: 2400 } },
      volume: { h24: 240000, h1: 90000 },
      priceChange: { m5: 1, h1: 1, h24: 20 },
      liquidity: { usd: 500000 },
    });
    const r = analyzeToken(pair, { real_sol_reserves: 100e9 });
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.verdict).toBe('CLEAN');
  });

  it('never goes below 0 even with every negative factor', () => {
    const pair = makePair({
      txns: { m5: { buys: 0, sells: 50 }, h1: { buys: 10, sells: 500 }, h24: { buys: 10, sells: 5000 } },
      volume: { h24: 900000, h1: 100 },
      priceChange: { h1: -40, h24: -80 },
      liquidity: { usd: 2000 },
    });
    const r = analyzeToken(pair, { real_sol_reserves: 1e9 });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.verdict).toBe('HIGH_RISK');
  });

  it('every factor is traceable to a label (no black-box score)', () => {
    const r = analyzeToken(makePair({ liquidity: { usd: 3000 } }));
    expect(r.factors.length).toBeGreaterThan(0);
    r.factors.forEach(f => {
      expect(typeof f.label).toBe('string');
      expect(f.label.length).toBeGreaterThan(0);
      expect(typeof f.points).toBe('number');
    });
  });
});

describe('buildDummyPlan — must be mathematically sound', () => {
  const pair = makePair({ priceUsd: '2.00', priceChange: { h1: 10, h24: 40 } });
  const analysis = analyzeToken(pair);

  it('places stop loss strictly below entry, never at or below zero', () => {
    const p = buildDummyPlan(pair, analysis, { capitalUsd: 1000 });
    expect(p.stopLoss).toBeGreaterThan(0);
    expect(p.stopLoss).toBeLessThan(p.entry);
  });

  it('orders targets above entry and enforces the stated R:R', () => {
    const p = buildDummyPlan(pair, analysis, { capitalUsd: 1000 });
    expect(p.takeProfit1).toBeGreaterThan(p.entry);
    expect(p.takeProfit2).toBeGreaterThan(p.takeProfit1);
    // TP1 = 1.5R, TP2 = 3R by construction
    expect(p.takeProfit1 - p.entry).toBeCloseTo(p.riskPerUnit * 1.5, 6);
    expect(p.takeProfit2 - p.entry).toBeCloseTo(p.riskPerUnit * 3.0, 6);
  });

  it('never risks more than the configured budget', () => {
    const p = buildDummyPlan(pair, analysis, { capitalUsd: 1000, riskPct: 0.01 });
    expect(p.actualRiskUsd).toBeLessThanOrEqual(p.riskBudgetUsd + 1e-6);
    expect(p.actualRiskUsd).toBeLessThanOrEqual(10 + 1e-6); // 1% of 1000
  });

  it('never risks a loss larger than the position itself', () => {
    const p = buildDummyPlan(pair, analysis, { capitalUsd: 1000 });
    // A memecoin can go to zero: max loss must equal position size, not exceed it.
    expect(p.lossAtSlUsd).toBeLessThanOrEqual(p.positionUsd + 1e-6);
  });

  it('caps position size at maxPositionPct of capital', () => {
    const p = buildDummyPlan(pair, analysis, { capitalUsd: 1000, riskPct: 0.5, maxPositionPct: 0.1 });
    expect(p.positionUsd).toBeLessThanOrEqual(100 + 1e-6);
  });

  it('rewards and losses are consistent with units and prices', () => {
    const p = buildDummyPlan(pair, analysis, { capitalUsd: 1000 });
    expect(p.gainAtTp1Usd).toBeCloseTo(p.units * (p.takeProfit1 - p.entry), 4);
    expect(p.gainAtTp2Usd).toBeCloseTo(p.units * (p.takeProfit2 - p.entry), 4);
    expect(p.lossAtSlUsd).toBeCloseTo(-p.units * p.riskPerUnit, 4);
  });

  it('returns null for a token with no usable price', () => {
    expect(buildDummyPlan(makePair({ priceUsd: '0' }), analysis)).toBeNull();
    expect(buildDummyPlan(makePair({ priceUsd: null }), analysis)).toBeNull();
  });

  it('marks itself as simulated so the UI can never present it as a real order', () => {
    expect(buildDummyPlan(pair, analysis).simulated).toBe(true);
  });

  it('keeps the stop distance within the stated volatility clamp', () => {
    const p = buildDummyPlan(pair, analysis, { capitalUsd: 1000 });
    expect(p.stopDistancePct).toBeGreaterThanOrEqual(5);
    expect(p.volatilityPct).toBeLessThanOrEqual(60);
    expect(p.volatilityPct).toBeGreaterThanOrEqual(12);
  });
});

describe('rankCandidates', () => {
  it('pushes HIGH_RISK tokens below cleaner ones with the same score', () => {
    const riskyPair = makePair({ liquidity: { usd: 2000 }, txns: { m5: { buys: 1, sells: 9 }, h1: { buys: 10, sells: 40 }, h24: { buys: 100, sells: 400 } } });
    const cleanPair = makePair({ liquidity: { usd: 90000 } });
    const rows = [
      { symbol: 'RISKY', analysis: analyzeToken(riskyPair) },
      { symbol: 'CLEAN', analysis: analyzeToken(cleanPair) },
    ];
    const ranked = rankCandidates(rows);
    expect(ranked[0].symbol).toBe('CLEAN');
  });

  it('prefers fresher tokens when scores tie', () => {
    const older = makePair({ pairCreatedAt: Date.now() - 7200_000 });
    const newer = makePair({ pairCreatedAt: Date.now() - 600_000 });
    const rows = [
      { symbol: 'OLD', analysis: analyzeToken(older) },
      { symbol: 'NEW', analysis: analyzeToken(newer) },
    ];
    expect(rankCandidates(rows)[0].symbol).toBe('NEW');
  });

  it('does not mutate the input array', () => {
    const rows = [
      { symbol: 'A', analysis: analyzeToken(makePair()) },
      { symbol: 'B', analysis: analyzeToken(makePair()) },
    ];
    const before = rows.map(r => r.symbol);
    rankCandidates(rows);
    expect(rows.map(r => r.symbol)).toEqual(before);
  });
});
