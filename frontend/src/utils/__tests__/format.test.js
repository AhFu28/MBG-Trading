import { describe, it, expect } from 'vitest';
import { formatIdr, formatUsd, formatPct, formatIdNumber } from '../format.js';

describe('format.js Zero-Slop numerical integrity', () => {
  it('never turns null, undefined, boolean, or empty string into zero', () => {
    expect(formatIdr(null)).toBe('Rp —');
    expect(formatIdr(undefined)).toBe('Rp —');
    expect(formatIdr('')).toBe('Rp —');
    expect(formatIdr(false)).toBe('Rp —');
    expect(formatIdr(true)).toBe('Rp —');

    expect(formatUsd(null)).toBe('$—');
    expect(formatUsd(undefined)).toBe('$—');
    expect(formatUsd('')).toBe('$—');
    expect(formatUsd(false)).toBe('$—');

    expect(formatPct(null)).toBe('—');
    expect(formatPct(undefined)).toBe('—');
    expect(formatPct('')).toBe('—');

    expect(formatIdNumber(null)).toBe('—');
    expect(formatIdNumber(undefined)).toBe('—');
    expect(formatIdNumber('')).toBe('—');
  });

  it('formats genuine zero as 0 correctly', () => {
    expect(formatIdr(0)).toBe('Rp 0');
    expect(formatUsd(0)).toBe('$0.00');
    expect(formatPct(0)).toBe('0.00%');
    expect(formatIdNumber(0)).toBe('0');
  });

  it('formats valid positive and negative numbers with proper locale separators', () => {
    expect(formatIdr(16800)).toBe('Rp 16.800');
    expect(formatIdr(-5000)).toBe('Rp -5.000');

    expect(formatUsd(1234.56)).toBe('$1,234.56');
    expect(formatUsd(99.1)).toBe('$99.10');

    expect(formatPct(5.4321)).toBe('+5.43%');
    expect(formatPct(-2.1)).toBe('-2.10%');

    expect(formatIdNumber(1000000)).toBe('1.000.000');
  });
});
