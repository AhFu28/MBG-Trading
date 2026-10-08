import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import CmcTopNav, { NAV_GROUPS } from '../CmcTopNav.jsx';
import { __resetWatchlistMemory } from '../../hooks/useWatchlist.js';

/**
 * Regression guard for the navigation rebuild requested on 2026-10-08:
 *   "pilihan sectionnya bukan di side bar, tapi di atas aja, pilihan Home,
 *    Trade (...), Markets (...), Research and Learn (...), Account (...)"
 *
 * These tests pin the MENU STRUCTURE, which is the part a future edit is most
 * likely to break silently. Menu structure is data, so it is asserted directly
 * rather than through brittle DOM traversal.
 */

function makeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', makeStorage());
  __resetWatchlistMemory();
});

const renderNav = (props = {}) => render(
  <CmcTopNav
    activeTab="HOME"
    onNavigate={() => {}}
    account={{ email: 'user@example.com', isPro: false }}
    theme="dark"
    onToggleTheme={() => {}}
    isMobileOpen={false}
    setMobileOpen={() => {}}
    {...props}
  />,
);

describe('navigation structure', () => {
  it('has exactly the five requested top-level menus, in order', () => {
    expect(NAV_GROUPS.map(g => g.label)).toEqual([
      'Home',
      'Trade',
      'Markets',
      'Research & Learn',
      'Account',
    ]);
  });

  it('Home navigates directly with no submenu', () => {
    // On CMC the home link is a plain link, not a dropdown.
    expect(NAV_GROUPS.find(g => g.id === 'HOME').items).toBeNull();
  });

  it('Trade holds Signals, AI Agent Arena and Charting Desk', () => {
    const trade = NAV_GROUPS.find(g => g.id === 'TRADE');
    expect(trade.items.map(i => i.id)).toEqual(['SIGNALS', 'AI_AGENTS', 'CHARTING']);
  });

  it('Markets merges futures and spot into a single Crypto desk', () => {
    // Requested: "Crypto [futures dan spot dijadikan satu aja, beda di ticker
    // aja kan]". A separate FUTURES entry would contradict that.
    const markets = NAV_GROUPS.find(g => g.id === 'MARKETS');
    const ids = markets.items.map(i => i.id);
    expect(ids).toContain('CRYPTO');
    expect(ids).not.toContain('FUTURES');
    expect(ids).not.toContain('US_STOCKS');
  });

  it('Markets still exposes Heatmap, Stock and Forex & Commodities', () => {
    const ids = NAV_GROUPS.find(g => g.id === 'MARKETS').items.map(i => i.id);
    expect(ids).toEqual(['HEATMAP', 'CRYPTO', 'STOCK', 'FOREX']);
  });

  it('Research & Learn carries all seven requested desks', () => {
    const ids = NAV_GROUPS.find(g => g.id === 'RESEARCH').items.map(i => i.id);
    expect(ids).toEqual([
      'NEWS',
      'WHALES',
      'ECONOMIC_CALENDAR',
      'AI_SENTINEL',
      'ACADEMY',
      'PEARSON_CORRELATION',
      'TESTING',
    ]);
  });

  it('removed desks are gone from the navigation entirely', () => {
    // Early Signal Radar, Degen Memecoin and Pasar Global were deleted on
    // request; they must not reappear in any menu.
    const all = NAV_GROUPS.flatMap(g => (g.items || []).map(i => i.id));
    expect(all).not.toContain('RADAR');
    expect(all).not.toContain('DEGEN');
    expect(all).not.toContain('GLOBAL_MARKETS');
  });

  it('keeps admin-only desks out of the static navigation model', () => {
    // Flow Process, Changelog and Admin Approval are injected only for an
    // admin account, so they must not be entries any user could reach.
    const all = NAV_GROUPS.flatMap(g => (g.items || []).map(i => i.id));
    expect(all).not.toContain('FLOW_PROCESS');
    expect(all).not.toContain('CHANGELOG');
    expect(all).not.toContain('ADMIN_APPROVAL');
  });
});

describe('rendering', () => {
  it('renders every top-level label', () => {
    renderNav();
    for (const label of ['Home', 'Trade', 'Markets', 'Research & Learn', 'Account']) {
      expect(screen.getByRole('button', { name: new RegExp(label, 'i') })).toBeDefined();
    }
  });

  it('hides internal admin desks from a regular account', () => {
    renderNav({ account: { email: 'user@example.com', isPro: true } });
    expect(screen.queryByText('Flow Process')).toBeNull();
    expect(screen.queryByText('Changelog')).toBeNull();
    expect(screen.queryByText('Admin Approval Desk')).toBeNull();
  });

  it('shows internal admin desks to an admin account', () => {
    renderNav({ account: { email: 'naufalarib60@gmail.com', isAdmin: true } });
    // The Account menu renders its items only when open, so open it first —
    // wrapped in act() because the click triggers a React state update.
    const accountMenu = screen.getByRole('button', { name: /Account/i });
    act(() => { accountMenu.click(); });
    expect(screen.getByText('Flow Process')).toBeDefined();
    expect(screen.getByText('Changelog')).toBeDefined();
  });

  it('shows the watchlist count badge when instruments are starred', () => {
    localStorage.setItem('mbg_user_watchlist_v2', JSON.stringify([
      { symbol: 'BTC', market: 'CRYPTO' },
      { symbol: 'ETH', market: 'CRYPTO' },
    ]));
    __resetWatchlistMemory();
    renderNav();
    expect(screen.getByTitle(/Watchlist \(2 instrumen\)/)).toBeDefined();
  });
});

describe('dependency wiring', () => {
  it('every menu id maps to a module the router and gate understand', async () => {
    // A menu entry pointing at an id that neither featureAccess nor the router
    // knows would render the "unknown module" lock screen instead of the desk.
    const { MODULES } = await import('../../services/featureAccess.js');
    const known = new Set(Object.values(MODULES));

    // Some ids address a sub-view handled directly by App's router rather than
    // a tier-gated top-level module. Listed explicitly so a NEW id cannot be
    // added to the menu without a conscious decision about its access gate.
    const routerHandled = new Set([
      'AI_SENTINEL',      // opens AiIntelligenceDrawer; gated as MODULES.SENTINEL
      'CURRENT_TEST',
      'BACKTEST_LAB',
      'GLOBAL_MARKETS',
    ]);

    const ids = NAV_GROUPS.flatMap(g => (g.items || []).map(i => i.id));
    for (const id of ids) {
      if (routerHandled.has(id)) continue;
      expect(known.has(id), `${id} is not a known module`).toBe(true);
    }
  });

  it('AI Sentiment DEFCON is gate-checked under the SENTINEL module', async () => {
    // The menu label is "AI Sentiment DEFCON" but the entitlement key is
    // SENTINEL. Pinning this stops the two names drifting apart, which would
    // silently unlock a Pro desk.
    const { MODULE_TIER, MODULES, TIER } = await import('../../services/featureAccess.js');
    expect(MODULE_TIER[MODULES.SENTINEL]).toBe(TIER.PRO);
  });

  /**
   * A menu entry is worthless if App's router has no branch for it.
   *
   * The NEWS entry shipped with the CMC top nav but no `activeTab === 'NEWS'`
   * branch existed, so clicking "Live News Wire" fell through to the fallback
   * desk. The owner reported it as "ini gk ada datanya". Being in MODULES is not
   * enough — the id must also reach a component.
   *
   * An id counts as routed if App mentions it directly, OR if it is one of the
   * ids the fallback `MasterQuantLeaderboard` branch forwards on (`activeTab` is
   * passed to it). That fallback is the last `else` in the chain, so an id that
   * reaches it is rendered, not dropped.
   */
  it('every menu id either has a router branch or reaches the fallback desk', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const app = fs.readFileSync(path.resolve(__dirname, '..', '..', 'App.jsx'), 'utf8');

    // Passed through to MasterQuantLeaderboard by the final `else` branch.
    const fallbackDeskIds = new Set([
      'TESTING', 'ECONOMIC_CALENDAR', 'PEARSON_CORRELATION', 'ACADEMY',
    ]);

    const ids = NAV_GROUPS.flatMap(g => (g.items || []).map(i => i.id));
    const unrouted = [];
    for (const id of ids) {
      if (fallbackDeskIds.has(id)) continue;
      if (!new RegExp(`activeTab === '${id}'`).test(app)) unrouted.push(id);
    }

    expect(unrouted, `menu ids with no App router branch: ${unrouted.join(', ')}`).toEqual([]);
  });

  it('Live News Wire is actually routed, not just listed', async () => {
    // The specific regression the owner hit.
    const fs = await import('node:fs');
    const path = await import('node:path');
    const app = fs.readFileSync(path.resolve(__dirname, '..', '..', 'App.jsx'), 'utf8');
    expect(app).toMatch(/activeTab === 'NEWS'/);
    expect(app).toMatch(/<NewsTab/);
  });
});

describe('logout', () => {
  /**
   * The owner reported "gk ada tombol logout". The handler existed and was wired
   * to SubscriptionPage, but nothing in the navigation offered it — Account had
   * only Setting, Langganan and Watchlist, and a user looking for logout opens
   * Account, not the billing page.
   */
  it('offers logout from the Account menu to a signed-in user', () => {
    renderNav({
      account: { email: 'user@example.com', isPro: false, authenticated: true },
      isAuthenticated: true,
      onLogout: () => {},
    });
    const accountMenu = screen.getByRole('button', { name: /Account/i });
    act(() => { accountMenu.click(); });
    expect(screen.getByText('Log out')).toBeDefined();
  });

  it('calls onLogout exactly once when clicked', () => {
    const onLogout = vi.fn();
    renderNav({
      account: { email: 'user@example.com', authenticated: true },
      isAuthenticated: true,
      onLogout,
    });
    const accountMenu = screen.getByRole('button', { name: /Account/i });
    act(() => { accountMenu.click(); });
    act(() => { screen.getByText('Log out').click(); });
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('does not offer logout to a visitor who is not signed in', () => {
    // A guest has no session to end; showing the button would imply otherwise.
    renderNav({
      account: { authenticated: false },
      isAuthenticated: false,
      onLogout: () => {},
    });
    const accountMenu = screen.getByRole('button', { name: /Account/i });
    act(() => { accountMenu.click(); });
    expect(screen.queryByText('Log out')).toBeNull();
  });
});
describe('accessibility', () => {
  it('marks dropdown buttons with aria-haspopup and aria-expanded', () => {
    renderNav();
    const tradeBtn = screen.getByRole('button', { name: /Trade/i });
    expect(tradeBtn.getAttribute('aria-haspopup')).toBe('true');
    expect(tradeBtn.getAttribute('aria-expanded')).toBe('false');
  });

  it('does not mark the direct Home link as a popup', () => {
    renderNav();
    const homeBtn = screen.getByRole('button', { name: /^Home$/i });
    expect(homeBtn.getAttribute('aria-haspopup')).toBeNull();
  });
});
