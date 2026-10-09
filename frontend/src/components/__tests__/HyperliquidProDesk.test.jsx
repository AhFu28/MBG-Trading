import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import HyperliquidProDesk from '../HyperliquidProDesk.jsx';

/**
 * Regression guard for the PERP/SPOT contract toggle.
 *
 * WHY THIS FILE EXISTS
 *
 * MarketDesks.test.jsx had a test named "offers a Perpetual / Spot contract
 * switch" that rendered CryptoDeskTab — a different component entirely. So the
 * Spot/Futures switch requested for the Trade Desk had NO coverage, and the
 * misleadingly-named test would have kept passing if the feature were deleted.
 * An audit on 2026-10-09 found `HyperliquidProDesk` referenced in zero test
 * files. This closes that gap.
 *
 * What is pinned here is the behaviour a user actually depends on:
 *   - the toggle exists and is reachable,
 *   - SPOT locks leverage to 1x and drops the margin-mode controls,
 *   - the order ticket stops calling itself "Long"/"Short" and says Beli/Jual,
 *   - liquidation is not quoted for a cash position,
 *   - PERP restores the leverage path.
 *
 * The component renders a TradingView iframe and opens websockets; neither is
 * asserted on, and the test never depends on network state.
 */

function renderDesk(props = {}) {
  return render(
    <HyperliquidProDesk
      initialSymbol="BTCUSDT"
      {...props}
    />
  );
}

/** The PERP/SPOT segmented control, located by its own labels. */
function getPerpButton() {
  return screen.getByRole('button', { name: 'PERP' });
}
function getSpotButton() {
  return screen.getByRole('button', { name: 'SPOT' });
}

beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  });
  // The desk subscribes to live feeds; keep the environment inert.
  vi.stubGlobal('WebSocket', class {
    constructor() { this.readyState = 0; }
    send() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  });
});

describe('HyperliquidProDesk — Spot vs Perp contract type', () => {
  it('renders a PERP / SPOT toggle in the instrument ribbon', () => {
    renderDesk();
    expect(getPerpButton()).toBeDefined();
    expect(getSpotButton()).toBeDefined();
  });

  it('defaults to PERP and shows a leverage multiplier', () => {
    renderDesk();
    // 10x is the documented default for the perpetual desk.
    expect(screen.getByText('10x')).toBeDefined();
    // A cash position has no leverage, so this pill must be absent by default.
    expect(screen.queryByText('1x CASH')).toBeNull();
  });

  it('switching to SPOT locks leverage at 1x and shows the cash pill', () => {
    renderDesk();

    fireEvent.click(getSpotButton());

    expect(screen.getByText('1x CASH')).toBeDefined();
    // The leverage multiplier must not survive the switch.
    expect(screen.queryByText('10x')).toBeNull();
  });

  it('hides the cross/isolated margin controls in SPOT mode', () => {
    renderDesk();

    // Present while trading perps.
    expect(screen.getByRole('button', { name: 'Cross' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Isolated' })).toBeDefined();

    fireEvent.click(getSpotButton());

    // Margin mode is meaningless for cash spot, so the controls are replaced
    // by a plain "SPOT CASH" banner rather than left clickable-but-inert.
    expect(screen.queryByRole('button', { name: 'Cross' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Isolated' })).toBeNull();
    expect(screen.getByText('⚡ SPOT CASH')).toBeDefined();
  });

  it('relabels the order ticket from Long/Short to Beli/Jual in SPOT mode', () => {
    renderDesk();

    expect(screen.getByRole('button', { name: 'Buy / Long' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Sell / Short' })).toBeDefined();

    fireEvent.click(getSpotButton());

    expect(screen.getByRole('button', { name: 'Beli Spot' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Jual Spot' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Buy / Long' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Sell / Short' })).toBeNull();
  });

  it('does not quote a liquidation price for a cash spot position', () => {
    renderDesk();

    fireEvent.click(getSpotButton());

    // A spot holding cannot be liquidated; claiming a price would be a lie.
    expect(screen.getByText('Bebas Likuidasi (Spot)')).toBeDefined();
  });

  it('restores the perp leverage path when switching back to PERP', () => {
    renderDesk();

    fireEvent.click(getSpotButton());
    expect(screen.getByText('1x CASH')).toBeDefined();

    fireEvent.click(getPerpButton());

    // Back on perps: the cash pill is gone and leverage is usable again.
    expect(screen.queryByText('1x CASH')).toBeNull();
    expect(screen.getByText('10x')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Cross' })).toBeDefined();
  });

  it('keeps a working leverage cycle on the perp desk', () => {
    renderDesk();

    const leverageBtn = screen.getByRole('button', { name: /10x/ });
    fireEvent.click(leverageBtn);
    expect(screen.getByRole('button', { name: /20x/ })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /20x/ }));
    expect(screen.getByRole('button', { name: /40x/ })).toBeDefined();
  });
});
