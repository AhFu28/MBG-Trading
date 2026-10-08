import { describe, it, expect } from 'vitest';
import { computeProfitFactor, isSampleMeaningful, MIN_TRADES_FOR_CONFIDENCE } from '../AiAgentArenaTab.jsx';

/**
 * Profit factor is a money-adjacent statistic: it is displayed to decide whether
 * a strategy is worth following. It had a fabricated fallback.
 *
 * The old expression, hand-copied into nine places, was:
 *
 *   grossLoss > 0 ? (profit / loss).toFixed(2) : (profit > 0 ? '99.0' : '0.0')
 *
 * '99.0' is not computed from anything. It appeared whenever a book had profits
 * but no losses yet, and it looked identical to a real ratio. The owner asked
 * directly whether the numbers on screen were genuine — this is the part that
 * was not.
 */

describe('computeProfitFactor', () => {
  it('divides gross profit by gross loss', () => {
    expect(computeProfitFactor(300, 100)).toBe('3.00');
    expect(computeProfitFactor(150, 100)).toBe('1.50');
  });

  it('never returns the fabricated 99.0', () => {
    // Profits with no losses was the exact case that produced the literal.
    const result = computeProfitFactor(500, 0);
    expect(result).not.toBe('99.0');
    expect(result).toBe('∞');
  });

  it('reports 0.0 when there is nothing at all', () => {
    expect(computeProfitFactor(0, 0)).toBe('0.0');
  });

  it('reports a real ratio of 0 when every trade lost', () => {
    // No profit, real losses: the honest answer is 0, not ∞.
    expect(computeProfitFactor(0, 250)).toBe('0.00');
  });

  it('accepts a negative loss value, since losses are often stored signed', () => {
    expect(computeProfitFactor(300, -100)).toBe('3.00');
  });

  it('treats missing or non-numeric input as zero rather than NaN', () => {
    // "NaN" rendered into a PF cell would look like a broken metric.
    expect(computeProfitFactor(undefined, undefined)).toBe('0.0');
    expect(computeProfitFactor(null, 100)).toBe('0.00');
    expect(computeProfitFactor('abc', 'xyz')).toBe('0.0');
  });

  it('produces the high ratios seen on screen when losses are tiny', () => {
    // 16.29 is arithmetically possible from a small, loss-light sample. The
    // point is that the number is real; `isSampleMeaningful` is what stops it
    // being read as proof of edge.
    expect(computeProfitFactor(1630, 100)).toBe('16.30');
  });
});

describe('isSampleMeaningful', () => {
  it('rejects a sample below the threshold', () => {
    expect(isSampleMeaningful(0)).toBe(false);
    expect(isSampleMeaningful(3)).toBe(false);
    expect(isSampleMeaningful(MIN_TRADES_FOR_CONFIDENCE - 1)).toBe(false);
  });

  it('accepts a sample at or above the threshold', () => {
    expect(isSampleMeaningful(MIN_TRADES_FOR_CONFIDENCE)).toBe(true);
    expect(isSampleMeaningful(97)).toBe(true);
  });

  it('treats missing input as an unusable sample', () => {
    expect(isSampleMeaningful(undefined)).toBe(false);
    expect(isSampleMeaningful(null)).toBe(false);
  });
});
