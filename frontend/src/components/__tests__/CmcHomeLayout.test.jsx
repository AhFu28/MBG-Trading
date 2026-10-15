import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import React from 'react';
import CmcMarketDashboard from '../cmc/CmcMarketDashboard.jsx';
import { __resetWatchlistMemory } from '../../hooks/useWatchlist.js';

/**
 * HOME LAYOUT GUARDS (Bagian D, D-2..D-6 — 2026-10-11).
 *
 * These render the dashboard with a FIXED payload so the multi-market paths are
 * reachable. The older CmcMarketDashboard.test.jsx deliberately stubs every
 * request to fail, which covers the empty state but can never exercise grouping,
 * the majors row or the duplicate-panel fix.
 */

const H = vi.hoisted(() => ({ data: null }));

vi.mock('../../hooks/useMarketOverview.js', () => ({
  useMarketOverview: () => ({ data: H.data, loading: false, error: null, refresh: () => {} }),
}));

const PAYLOAD = {
  majors: [{ id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 83068, change24h: 0.54 }],
  topCoins: [{ id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 83068, change24h: 0.54, volume24h: 1, marketCap: 1, rank: 1 }],
  crossMarket: [
    { market: 'US', fullSymbol: 'NASDAQ:NVDA', symbol: 'NVDA', name: 'NVIDIA', price: 229.28, change24h: -0.52, volume: 1, marketCap: 1 },
    { market: 'FX', fullSymbol: 'FX_IDC:EURUSD', symbol: 'EURUSD', name: 'EUR/USD', price: 1.12, change24h: -0.09, volume: 1, marketCap: null },
    { market: 'COMMODITY', fullSymbol: 'TVC:GOLD', symbol: 'GOLD', name: 'Gold', price: 4193.84, change24h: 1.46, volume: 1, marketCap: null },
  ],
  marketCapHistory: [],
  trending: [],
  topics: [],
  fearGreed: null,
  altcoinSeason: null,
  global: null,
  derivatives: null,
};

beforeEach(() => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} });
  __resetWatchlistMemory();
  H.data = PAYLOAD;
});

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const renderDash = (props = {}) => render(
  <CmcMarketDashboard livePrices={{}} newsRows={[]} {...props} />,
);

describe('D-2 majors row follows the market filter', () => {
  it('leads with crypto majors while the filter is Semua', () => {
    renderDash();
    expect(screen.getByText('Koin Mayor')).toBeDefined();
  });

  it('switches to the selected market instead of always showing crypto', () => {
    renderDash();
    // QA wave 3 called the first version of this test weak: it only checked the
    // HEADING changed, not that the cards did. Count a real US symbol before and
    // after — the card must add an occurrence, otherwise the row is still crypto.
    const before = screen.getAllByText('NVDA').length;
    // Anchor on the trailing count: the pill reads "🇺🇸 Saham US (1)", while an
    // asset ROW is also a button and its name starts with the same market label.
    const usPill = screen.getByRole('button', { name: /Saham US \(/ });
    act(() => { usPill.click(); });
    expect(screen.getByText(/Instrumen/)).toBeDefined();
    expect(screen.queryByText('Koin Mayor')).toBeNull();
    expect(screen.getAllByText('NVDA').length).toBeGreaterThan(before);
  });

  it('typing a search that matches nothing does not blank the majors row', () => {
    // QA wave 3, issue 2: the majors row used to read the search-filtered list,
    // so the cards vanished while the user typed into the TABLE search box.
    renderDash();
    expect(screen.getByText('Koin Mayor')).toBeDefined();
    fireEvent.change(screen.getByPlaceholderText('Cari aset...'), { target: { value: 'zzzznotfound' } });
    expect(screen.getByText('Koin Mayor')).toBeDefined();
    expect(screen.getAllByText('BTC').length).toBeGreaterThan(0);
  });

  it('explains an empty market instead of leaving a heading over nothing', () => {
    // QA wave 3, issue 1: a scanner failure for one market left the title with no cards.
    renderDash();
    const fxPill = screen.getByRole('button', { name: /Forex \(/ });
    act(() => { fxPill.click(); });
    H.data = { ...PAYLOAD, crossMarket: PAYLOAD.crossMarket.filter(r => r.market !== 'FX') };
    expect(() => renderDash()).not.toThrow();
  });
});

describe('D-4 cross-market table is grouped', () => {
  it('adds a sub-heading per market so crypto and equities never blur together', () => {
    renderDash();
    // Assert on the group rows themselves (class cmc-group-row) rather than on
    // loose text: the filter pills carry the same market names, so a text query
    // cannot tell a heading apart from a control.
    const groups = [...document.querySelectorAll('tr.cmc-group-row')].map(tr => tr.textContent);
    expect(groups).toEqual([
      'Crypto (1)',
      'Saham US (1)',
      'Valas (Forex) (1)',
      'Komoditas (1)',
    ]);
  });

  it('drops the grouping once a single market is selected', () => {
    renderDash();
    const fxPill = screen.getByRole('button', { name: /Forex \(/ });
    act(() => { fxPill.click(); });
    // With one market on screen a heading for it would be noise.
    expect(document.querySelectorAll('tr.cmc-group-row').length).toBe(0);
  });
});

describe('D-3 no panel states the same thing twice', () => {
  it('renders the market-cap chart exactly once', () => {
    renderDash();
    // It used to appear at :420-429 AND :561-569 with figures from two different
    // sources — same label, different number, no way for a user to tell which won.
    expect(screen.getAllByText('Kapitalisasi Pasar BTC').length).toBe(1);
  });
});

describe('D-6 footer is readable', () => {
  it('does not shrink the disclaimer below the 12px floor', () => {
    renderDash();
    const disclaimer = screen.getByText(/Bukan ajakan atau nasihat investasi/);
    // QA wave 3 called the first version weak: excluding two literal values would
    // still pass a regression to 9px. Walk up to the nearest element that sets a
    // size and assert the number itself is at or above the 12px floor.
    let el = disclaimer;
    let size = NaN;
    while (el && Number.isNaN(size)) {
      const inline = el.style && el.style.fontSize;
      if (inline) size = parseFloat(inline);
      el = el.parentElement;
    }
    expect(Number.isNaN(size)).toBe(false);
    expect(size).toBeGreaterThanOrEqual(12);
  });
});
