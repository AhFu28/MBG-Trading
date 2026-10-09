import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import TradervueCalendarAndEquity from '../TradervueCalendarAndEquity.jsx';

describe('TradervueCalendarAndEquity', () => {
  it('renders visual equity curve with default starting capital', () => {
    render(<TradervueCalendarAndEquity startingCapital={100000000} />);
    expect(screen.getByText(/KURVA PERTUMBUHAN MODAL/i)).toBeDefined();
    expect(screen.getByText(/MODAL AWAL/i)).toBeDefined();
    expect(screen.getByText(/HIGH-WATER MARK/i)).toBeDefined();
    expect(screen.getByText(/MAX DRAWDOWN/i)).toBeDefined();
  });

  it('renders monthly PnL calendar and navigation buttons', () => {
    render(<TradervueCalendarAndEquity startingCapital={100000000} />);
    expect(screen.getByText(/KALENDER HASIL TRADING BULANAN/i)).toBeDefined();
    expect(screen.getByText(/Bulan Lalu/i)).toBeDefined();
    expect(screen.getByText(/Bulan Berikutnya/i)).toBeDefined();
  });

  it('displays closed positions and journal entries on the calendar', () => {
    const closedPositions = [
      {
        id: 'cp-1',
        ticker: 'BBCA',
        date: new Date().toISOString(),
        realizedPnL: 2500000,
        result: 'WIN',
        entryPrice: 10000,
        exitPrice: 10250
      }
    ];

    const journals = [
      {
        id: 'jr-1',
        symbol: 'BTCUSDT',
        date: new Date().toISOString(),
        result: 'WIN',
        emotionalState: 'ZEN',
        thesis: 'Breakout ATH'
      }
    ];

    render(
      <TradervueCalendarAndEquity
        startingCapital={100000000}
        closedPositions={closedPositions}
        journals={journals}
      />
    );

    expect(screen.getByText(/Total PnL:/i)).toBeDefined();
  });
});
