import { describe, it, expect } from 'vitest';
import {
  formatUsdCompact,
  formatPrice,
} from '../marketOverview.js';

/**
 * Pure-formatting tests only.
 *
 * The fetch functions are deliberately NOT tested with mocked responses here —
 * a mock would assert that our code matches our own assumptions, which is worth
 * very little. Those endpoints are verified against the live API by
 * scripts/verify-market-overview.mjs instead, where a real response is checked.
 */

describe('formatUsdCompact', () => {
  it('formats trillions the way a market-cap header expects', () => {
    expect(formatUsdCompact(2830000000000)).toBe('$2.83T');
  });

  it('formats billions, millions and thousands', () => {
    expect(formatUsdCompact(102410000000)).toBe('$102.41B');
    expect(formatUsdCompact(929890000)).toBe('$929.89M');
    expect(formatUsdCompact(4500)).toBe('$4.50K');
  });

  it('keeps small values plain', () => {
    expect(formatUsdCompact(12.5)).toBe('$12.50');
  });

  it('returns an em-dash rather than a fabricated zero when data is missing', () => {
    // The project forbids inventing numbers. A missing value must look missing.
    for (const bad of [null, undefined, NaN, 'n/a', {}]) {
      expect(formatUsdCompact(bad)).toBe('—');
    }
  });

  it('renders a negative value with the minus sign before the dollar', () => {
    // ETF-style outflows are negative. The sign must lead, not trail.
    expect(formatUsdCompact(-88459610)).toBe('-$88.46M');
    expect(formatUsdCompact(-2830000000000)).toBe('-$2.83T');
  });
});

describe('formatPrice', () => {
  it('uses thousands separators for large prices', () => {
    expect(formatPrice(83349.64)).toBe('$83,349.64');
  });

  it('uses two decimals for normal coins', () => {
    expect(formatPrice(2565.55)).toBe('$2,565.55');
    expect(formatPrice(1.428)).toBe('$1.43');
  });

  it('widens precision for micro-cap prices', () => {
    expect(formatPrice(0.01957)).toBe('$0.0196');
    expect(formatPrice(0.00000012)).toBe('$0.00000012');
  });

  it('returns an em-dash when the price is unavailable', () => {
    for (const bad of [null, undefined, NaN, 'x']) {
      expect(formatPrice(bad)).toBe('—');
    }
  });
});
