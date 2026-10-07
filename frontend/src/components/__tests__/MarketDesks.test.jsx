import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import CryptoDeskTab from '../CryptoDeskTab.jsx';
import StockDeskTab from '../StockDeskTab.jsx';

/**
 * Regression guard for the market-page merges requested on 2026-10-08:
 *   "Crypto [futures dan spot dijadikan satu aja, beda di ticker aja kan]"
 *   "Stock [ada IDX dan US]"
 *
 * These tests pin the SWITCHERS, because that is the affordance that replaced
 * the old separate menu entries. If a future edit drops the contract-type
 * toggle, futures and spot silently become indistinguishable again.
 */

beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  });
});

describe('CryptoDeskTab', () => {
  it('offers a Perpetual / Spot contract switch', () => {
    render(<CryptoDeskTab livePrices={{}} allCryptoSpot={[]} />);
    expect(screen.getByRole('button', { name: 'Perpetual' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Spot' })).toBeDefined();
  });

  it('offers the trade desk, funding analytics and spot browser views', () => {
    render(<CryptoDeskTab livePrices={{}} allCryptoSpot={[]} />);
    expect(screen.getByRole('button', { name: /Trade Desk/ })).toBeDefined();
    // Match the full label: "Funding" alone also matches the funding-rate cell
    // labels inside the desk, which would make this assertion ambiguous.
    expect(screen.getByRole('button', { name: '📊 Funding & OI' })).toBeDefined();
    expect(screen.getByRole('button', { name: /Daftar Spot/ })).toBeDefined();
  });

  it('labels the desk as Crypto Desk, not as two separate pages', () => {
    render(<CryptoDeskTab livePrices={{}} allCryptoSpot={[]} />);
    expect(screen.getByText('Crypto Desk')).toBeDefined();
  });

  it('switches into the spot browser and lists live pairs', () => {
    const allCryptoSpot = [
      { symbol: 'BTCUSDT', pair: 'BTC/USDT', current_price: 83000, change_24h_pct: -2.5 },
      { symbol: 'ETHUSDT', pair: 'ETH/USDT', current_price: 2560, change_24h_pct: -4.8 },
    ];
    render(<CryptoDeskTab livePrices={{}} allCryptoSpot={allCryptoSpot} />);

    act(() => { screen.getByRole('button', { name: /Daftar Spot/ }).click(); });

    expect(screen.getByText('Pasangan Spot USDT')).toBeDefined();
    expect(screen.getByText('BTC')).toBeDefined();
    expect(screen.getByText('ETH')).toBeDefined();
  });

  it('shows an em-dash rather than a fake zero for a missing spot change', () => {
    // Zero-fake-data rule: an absent change must not render as "0.00%".
    const allCryptoSpot = [{ symbol: 'BTCUSDT', pair: 'BTC/USDT', current_price: 83000, change_24h_pct: null }];
    render(<CryptoDeskTab livePrices={{}} allCryptoSpot={allCryptoSpot} />);

    act(() => { screen.getByRole('button', { name: /Daftar Spot/ }).click(); });

    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });
});

describe('StockDeskTab', () => {
  it('offers an IDX / US market switch', () => {
    render(<StockDeskTab data={{}} livePrices={{}} allIdxStocks={[]} allCryptoSpot={[]} />);
    expect(screen.getByRole('button', { name: /Saham IDX/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /US Stocks/ })).toBeDefined();
  });

  it('labels the desk as Stock Desk, not as two separate pages', () => {
    render(<StockDeskTab data={{}} livePrices={{}} allIdxStocks={[]} allCryptoSpot={[]} />);
    expect(screen.getByText('Stock Desk')).toBeDefined();
  });

  it('reports the IDX instrument count for the selected market', () => {
    render(
      <StockDeskTab
        data={{}}
        livePrices={{}}
        allIdxStocks={[{ ticker: 'BBCA' }, { ticker: 'BBRI' }]}
        allCryptoSpot={[]}
      />,
    );
    expect(screen.getByText(/2 emiten live/)).toBeDefined();
  });

  it('switches to the US market and updates the session hint', () => {
    render(<StockDeskTab data={{}} livePrices={{}} allIdxStocks={[]} allCryptoSpot={[]} />);

    act(() => { screen.getByRole('button', { name: /US Stocks/ }).click(); });

    expect(screen.getByText(/Wall Street/)).toBeDefined();
  });
});
