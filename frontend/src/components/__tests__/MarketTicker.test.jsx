import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import MarketTicker, { normalizeMarket, formatTickerPrice } from '../MarketTicker.jsx';

/**
 * MarketTicker tests (WP4).
 *
 * No network and no timers: the component is pure presentation, so every case
 * here renders a fixed list and inspects the DOM.
 */

const SAMPLE = [
  { market: 'CRYPTO', symbol: 'BTCUSDT', price: 82879.71, change: -0.35 },
  { market: 'FOREX', symbol: 'USDIDR', price: 16250.5, change: 0.12 },
  { market: 'IDX', symbol: 'BBCA', price: 10250, change: 1.48 },
  { market: 'COMMODITY', symbol: 'GOLD', price: 4195, change: 1.3 },
  { market: 'US', symbol: 'NVDA', price: 229.28, change: -0.52 },
];

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  })));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('market badges', () => {
  it('shows a badge for every supported market', () => {
    const { container } = render(<MarketTicker items={SAMPLE} />);
    for (const badge of ['IDX', 'US', 'FX', 'CMDTY', 'CRYPTO']) {
      expect(container.querySelectorAll('.market-ticker-badge').length).toBeGreaterThan(0);
      expect(container.textContent).toContain(badge);
    }
  });

  it('normalises FOREX to FX and COMMODITY to CMDTY so both spellings share a badge', () => {
    expect(normalizeMarket('FOREX')).toBe('FX');
    expect(normalizeMarket('FX_IDC')).toBe('FX');
    expect(normalizeMarket('COMMODITY')).toBe('CMDTY');
    expect(normalizeMarket('crypto')).toBe('CRYPTO');
  });

  it('hides badges when showMarketBadge is false', () => {
    const { container } = render(<MarketTicker items={SAMPLE} showMarketBadge={false} />);
    expect(container.querySelectorAll('.market-ticker-badge').length).toBe(0);
  });
});

describe('ordering and loop', () => {
  it('orders items IDX -> US -> FX -> CMDTY -> CRYPTO regardless of input order', () => {
    const { container } = render(<MarketTicker items={SAMPLE} />);
    const symbols = Array.from(container.querySelectorAll('.market-ticker-item .market-ticker-symbol')).map(n => n.textContent);
    // Items are duplicated for the seamless loop, so the first half is asserted.
    expect(symbols.slice(0, 5)).toEqual(['BBCA', 'NVDA', 'USDIDR', 'GOLD', 'BTCUSDT']);
  });

  it('duplicates the list so translateX(-50%) can loop seamlessly', () => {
    const { container } = render(<MarketTicker items={SAMPLE} />);
    expect(container.querySelectorAll('.market-ticker-item').length).toBe(SAMPLE.length * 2);
  });
});

describe('honest numbers', () => {
  it('renders an em dash instead of a fabricated 0 when price or change is missing', () => {
    const { container } = render(<MarketTicker items={[{ market: 'IDX', symbol: 'XXXX', price: null, change: null }]} />);
    expect(container.textContent).toContain('—');
    expect(container.textContent).not.toContain('0.00');
    expect(formatTickerPrice(null)).toBe('—');
    expect(formatTickerPrice('n/a')).toBe('—');
  });

  it('marks up and down changes with different classes', () => {
    const { container } = render(<MarketTicker items={SAMPLE} />);
    expect(container.querySelectorAll('.market-ticker-change.is-up').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.market-ticker-change.is-down').length).toBeGreaterThan(0);
  });
});

describe('degraded and reduced-motion rendering', () => {
  it('renders nothing and does not throw when items is empty', () => {
    const { container } = render(<MarketTicker items={[]} />);
    expect(container.textContent).toBe('');
  });

  it('does not throw when items is undefined or malformed', () => {
    expect(() => render(<MarketTicker items={undefined} />)).not.toThrow();
    expect(() => render(<MarketTicker items={[null, { price: 1 }]} />)).not.toThrow();
  });

  it('still renders the full strip when the user asks for reduced motion', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: true,
      addEventListener: () => {},
      removeEventListener: () => {},
    })));
    const { container } = render(<MarketTicker items={SAMPLE} />);
    // Motion is disabled in CSS (index.css, prefers-reduced-motion block); the
    // component must keep every quote visible as a static slice.
    expect(container.querySelectorAll('.market-ticker-item').length).toBe(SAMPLE.length * 2);
    expect(container.querySelector('.market-ticker-track')).not.toBeNull();
  });

  it('prints the snapshot time so the strip does not imply live data', () => {
    const { container } = render(<MarketTicker items={SAMPLE} updatedAt={new Date('2026-10-11T05:30:00+07:00')} />);
    expect(container.querySelector('.market-ticker-stamp')).not.toBeNull();
    expect(container.textContent).toContain('Diperbarui');
  });

  it('omits the stamp when updatedAt is absent', () => {
    const { container } = render(<MarketTicker items={SAMPLE} />);
    expect(container.querySelector('.market-ticker-stamp')).toBeNull();
  });
});
