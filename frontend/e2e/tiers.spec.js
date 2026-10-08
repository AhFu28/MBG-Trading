import { test, expect, gotoCockpitRoute, installSession } from './fixtures.js';

/**
 * Tier gating, verified in a browser with real sessions.
 *
 * THIS FILE WAS WRONG TWICE, and both mistakes are worth recording because they
 * are the same mistake.
 *
 * Attempt 1 asserted `locked || noOrderUi`. When the gate was deliberately
 * downgraded from LEGEND to PRO to check the test could fail, it still passed
 * 11/11 — the `||` meant "no execution UI is visible" was enough, which is also
 * true of a module that renders nothing at all.
 *
 * Attempt 2's probe also revealed a REAL bug that attempt 1 had been hiding: a
 * LEGEND account saw "Modul Ini Khusus Legend". App.jsx collapsed every paid
 * account to 'PRO', so the gate and the label disagreed and the gate won. A user
 * who earned the tier and paid for it was still locked out of it.
 *
 * So every assertion below is now EXACT:
 *   - the lock screen must be present for the tiers that should see it
 *   - and must be ABSENT for the tier that should not
 *
 * An `||` between "looks locked" and "looks empty" cannot tell those apart, which
 * is precisely why the downgrade slipped through.
 */

const LEGEND_MODULES = ['TRADING_BOT', 'JEV_EXECUTION'];

/** Tiers that must be refused, and the exact screen they must see. */
const REFUSED = [
  { tier: 'free', screen: /khusus legend/i },
  { tier: 'pro', screen: /khusus legend/i },
];

test.describe('LEGEND modules are locked to every other tier', () => {
  for (const moduleId of LEGEND_MODULES) {
    for (const { tier, screen } of REFUSED) {
      test(`${moduleId} shows the Legend lock screen to a ${tier} account`, async ({ page }) => {
        const pageErrors = [];
        page.on('pageerror', e => pageErrors.push(e.message));

        await installSession(page, { tier });
        await gotoCockpitRoute(page, moduleId);

        const body = await page.locator('body').innerText();

        // EXACT, not a disjunction: the specific screen must be on display.
        expect(body, `${moduleId} did not lock a ${tier} account`).toMatch(screen);

        // And nothing that would let an order be placed.
        expect(body).not.toMatch(/kirim order|place order|twap|vwap/i);
        expect(pageErrors, `${moduleId} threw for ${tier}`).toEqual([]);
      });
    }

    test(`${moduleId} OPENS for a legend account`, async ({ page }) => {
      /**
       * The positive case, and the one that would have caught the App.jsx bug.
       * Without this, "always locked" passes — which is exactly the state the
       * product shipped in.
       */
      await installSession(page, { tier: 'legend' });
      await gotoCockpitRoute(page, moduleId);

      const body = await page.locator('body').innerText();
      expect(body, `${moduleId} locked out a LEGEND account`).not.toMatch(/khusus legend/i);
      expect(body.length, `${moduleId} rendered nothing for legend`).toBeGreaterThan(200);
    });
  }
});

test.describe('the LEGEND lock screen tells the truth', () => {
  test('a Pro user is told the tier must be earned, not bought', async ({ page }) => {
    await installSession(page, { tier: 'pro' });
    await gotoCockpitRoute(page, 'TRADING_BOT');

    const body = await page.locator('body').innerText();
    expect(body).toMatch(/tidak bisa dibeli langsung/i);

    const path = page.getByRole('button', { name: /legend path|achievement/i }).first();
    await expect(path).toBeVisible({ timeout: 5000 });
  });

  test('a Pro user sees no Pro purchase CTA on a LEGEND module', async ({ page }) => {
    await installSession(page, { tier: 'pro' });
    await gotoCockpitRoute(page, 'TRADING_BOT');

    // A purchase button here would promise something the product will not honour.
    await expect(page.getByRole('button', { name: /lihat paket pro/i })).toHaveCount(0);
  });
});

test.describe('the gate holds for a genuinely unknown module', () => {
  test('an invented module id is refused, not defaulted open', async ({ page }) => {
    /**
     * canAccess denies unknown modules rather than assuming. Worth an end-to-end
     * check because the opposite default would open a desk for any typo.
     */
    await installSession(page, { tier: 'pro' });
    await gotoCockpitRoute(page, 'THIS_MODULE_DOES_NOT_EXIST');

    const body = await page.locator('body').innerText();
    expect(body).toMatch(/khusus pro|khusus legend|tidak dikenal/i);
  });
});

test.describe('an unlocked tier reaches its desks', () => {
  test('a Pro user opens the AI Agent Arena', async ({ page }) => {
    await installSession(page, { tier: 'pro' });
    await gotoCockpitRoute(page, 'AI_AGENTS');

    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/khusus pro|khusus legend/i);
    expect(body.length).toBeGreaterThan(200);
  });

  test('a guest can still open the free desks', async ({ page }) => {
    await installSession(page, { tier: 'guest' });
    await gotoCockpitRoute(page, 'HOME');

    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/khusus pro/i);
    expect(body.length).toBeGreaterThan(200);
  });
});

test.describe('admin bypass', () => {
  test('an admin reaches the LEGEND desks without the lock screen', async ({ page }) => {
    // Deliberate: an administrator locked out of the execution desk cannot
    // support a customer who is stuck. Narrow enough not to leak, per above.
    await installSession(page, { tier: 'admin', isAdmin: true, email: 'naufalarib60@gmail.com' });
    await gotoCockpitRoute(page, 'TRADING_BOT');

    const body = await page.locator('body').innerText();
    expect(body, 'admin was shown the LEGEND lock screen').not.toMatch(/khusus legend/i);
  });
});
