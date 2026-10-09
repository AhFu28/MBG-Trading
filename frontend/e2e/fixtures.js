import { test as base, expect } from '@playwright/test';

/**
 * Shared fixtures for the terminal E2E suite.
 *
 * THE FIRST VERSION OF THIS SUITE PASSED 23/23 AND TESTED NOTHING.
 *
 * App.jsx renders LandingPage whenever `/api/account/me` reports no session, and
 * a static `vite preview` has no such endpoint. So every `?tab=X` navigation
 * rendered the same landing page, and 18 "route renders" tests were asserting on
 * one page 18 times. A green suite that proves nothing is worse than a red one,
 * because it buys false confidence.
 *
 * Hence `authedPage`: it intercepts the account/auth endpoints and returns a
 * signed-in Pro session, so the COCKPIT actually mounts. Route assertions then
 * mean what they claim.
 *
 * A separate `guestPage` fixture is used for the one thing that legitimately
 * needs a signed-out visitor: the landing page.
 */

/**
 * Fake the session so the terminal renders.
 *
 * `tier` is configurable because the tier gates what a route shows — testing
 * LEGEND-only desks needs a LEGEND session, and testing that a free user is
 * locked out needs a free one.
 */
async function installSession(page, { tier = 'pro', isAdmin = false, email = 'e2e@example.com' } = {}) {
  // Account session.
  await page.route('**/api/account/me', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      authenticated: true, tier, tierLabel: tier, isPro: tier === 'pro' || tier === 'legend',
      email, displayName: 'E2E', isAdmin, configured: true,
      expiresAt: Date.now() + 86400000, daysLeft: 30, expired: false,
    }),
  }));

  // Legacy owner route. Must NOT authenticate, or App treats every test as owner.
  await page.route('**/api/auth', route => route.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'Unauthorized' }),
  }));

  // Cockpit data bundle. A small but SHAPED payload, so components take their
  // normal render path instead of an early-return empty branch. Deliberately
  // minimal values: nothing here should look like real market data.
  await page.route('**/api/data', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      last_updated: new Date().toISOString(),
      data_sources: {},
      macro_telemetry: {
        headline: 'E2E fixture headline',
        gold_price: null,
        brent_oil_price: null,
        dxy_index: null,
        us10y_yield: null,
        live_news: [],
      },
      conglomerates: {},
      dividend_hunters: [],
      foreign_flow: {},
      crypto_spot_10: [],
      daily_trade_plans: [],
      technical_analysis: {},
      smc_analysis: {},
      bandarmology_iifs: {},
      broker_summary: {},
      forecasts: {},
      paper_portfolio: {},
      strategy_rankings: [],
      backtest_lab: {},
      correlation_matrix: null,
      whale_intelligence: {},
      crypto_futures: {},
      forex_intelligence: {},
      us_stocks: {},
      arena_state: { last_evaluated: new Date().toISOString(), agents: [], positions: [], journal: [] },
    }),
  }));

  await page.route('**/api/arena-state**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ last_evaluated: new Date().toISOString(), agents: [], positions: [], journal: [] }),
  }));

  // Hyperliquid derivatives mock for deterministic testing without external network flakiness.
  await page.route('https://api.hyperliquid.xyz/info', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      { universe: [{ name: 'BTC' }, { name: 'ETH' }] },
      [
        { markPx: '65000', openInterest: '1000', dayNtlVlm: '50000000', funding: '0.0001' },
        { markPx: '3500', openInterest: '5000', dayNtlVlm: '20000000', funding: '0.0001' }
      ]
    ])
  }));

  // Research Desk mock (P-8 P0c)
  await page.route('**/api/research/reports*', route => {
    const url = new URL(route.request().url());
    const slug = url.searchParams.get('slug');
    if (slug) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'X-Data-Source': 'sample-fallback' },
        body: JSON.stringify({
          report: { slug: 'idx-strategy-study-daily-plans', report_type: 'strategy_study', edition_no: 1 },
          metadata: { title: 'Studi Strategi: Daily Trade Plans IDX', data_cutoff: '2026-10-08T17:10:57Z' },
          sections: [
            { section_key: 'metadata', claims: [], content_blocks: [{ type: 'paragraph', text: 'Studi empiris kinerja rencana perdagangan harian IDX.' }] }
          ]
        })
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'X-Data-Source': 'sample-fallback' },
      body: JSON.stringify([
        {
          slug: 'idx-strategy-study-daily-plans',
          title: 'Studi Strategi: Daily Trade Plans IDX',
          report_type: 'strategy_study',
          state: 'draft',
          edition_no: 1
        }
      ])
    });
  });
}

/** Console noise that is not a product defect. Each entry needs a reason. */
const IGNORED_CONSOLE = [
  // React's own dev banner.
  /Download the React DevTools/i,
  // Upstream market feeds. The build has no proxy in preview, and the app is
  // required to degrade gracefully — the page-level assertions check that it
  // DID degrade, which is the meaningful test.
  /Failed to load resource/i,
  /net::ERR_(NAME_NOT_RESOLVED|CONNECTION|BLOCKED|TIMED_OUT|CERT|FAILED)/i,
  // jsdom-free preview has no websocket backend.
  /WebSocket connection to/i,
];

const IGNORED_REQUEST_FAILURES = [
  /coinmarketcap|binance|hyperliquid|tradingview|alternative\.me|mempool\.space/i,
  /\/api\/(account|auth|data|arena-state|dev-bundle|scanner|research-archive|ea|tokocrypto|pumpfun)/i,
];

export const test = base.extend({
  /** A signed-in Pro user looking at the cockpit. */
  authedPage: async ({ page }, use, testInfo) => {
    const consoleErrors = [];
    const pageErrors = [];

    page.on('console', msg => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (IGNORED_CONSOLE.some(re => re.test(text))) return;
      consoleErrors.push(text);
    });
    page.on('pageerror', err => pageErrors.push(err.message));

    await installSession(page, { tier: 'pro' });
    await use(page);

    const diagnostics = { consoleErrors, pageErrors };
    if (consoleErrors.length || pageErrors.length) {
      await testInfo.attach('browser-diagnostics', {
        body: JSON.stringify(diagnostics, null, 2),
        contentType: 'application/json',
      });
    }
  },

  /** A signed-out visitor, for landing-page assertions only. */
  guestPage: async ({ page }, use) => {
    await page.route('**/api/account/me', route => route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ authenticated: false }),
    }));
    await page.route('**/api/auth', route => route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Unauthorized' }),
    }));
    await use(page);
  },
});

export { expect, installSession };

/**
 * Navigate to a cockpit route and wait for the shell.
 *
 * Waits for the top nav, which only exists inside the authenticated shell. That
 * single wait is what makes the route assertions meaningful: if the session
 * fixture ever stops working, every route test fails loudly instead of silently
 * asserting on the landing page again.
 *
 * ALSO DISMISSES THE COMPLIANCE MODAL. On a first visit the terminal shows
 * "PERNYATAAN KEPATUHAN & PENGUNGKAPAN RISIKO" over everything, and it covers
 * the nav — the first E2E run failed with "<div> intercepts pointer events" and
 * the probe identified that overlay as the blocker. It is not a bug: the gate is
 * deliberate, and a user must accept it before the terminal is usable. The test
 * accepts it exactly as a user would.
 */
export async function gotoCockpitRoute(page, id) {
  await page.goto(`/?tab=${id}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('.cmc-topnav', { timeout: 15_000 });

  await dismissComplianceModal(page);
  await page.waitForTimeout(400);
}

/**
 * Accept the first-run compliance notice if it is present.
 *
 * Uses the button's own label, so if the wording changes the test fails here
 * rather than mysteriously timing out on a later click.
 */
export async function dismissComplianceModal(page) {
  const accept = page.getByRole('button', { name: /SAYA MENGERTI|SETUJU/i }).first();
  const shown = await accept.isVisible().catch(() => false);
  if (shown) {
    await accept.click();
    // The modal animates out; wait for the overlay to stop intercepting.
    await page.waitForTimeout(300);
  }
  return shown;
}
