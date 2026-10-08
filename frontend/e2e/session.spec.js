import { test, expect, gotoCockpitRoute, installSession } from './fixtures.js';

/**
 * Session lifecycle in a real browser.
 *
 * WHY THIS IS THE FIRST THING AFTER ROUTES: logout has broken TWICE.
 *
 *   Round 1 — the handler cleared a legacy localStorage key and reloaded, while
 *   the live session was an HttpOnly cookie. The reload signed the user straight
 *   back in.
 *
 *   Round 2 — there were two session cookies (mbg_session for accounts, mbg_jwt
 *   for the owner cockpit) and logout cleared only the first. App falls back to
 *   /api/auth, which still saw the owner cookie, so the reload restored the
 *   session a second time.
 *
 * Both were fixed and both have unit tests. Neither had ever been exercised
 * through the UI, which is the only place a user meets them.
 */

test.describe('logout', () => {
  test('the Account menu offers logout to a signed-in user', async ({ authedPage: page }) => {
    await gotoCockpitRoute(page, 'HOME');

    await page.getByRole('button', { name: /Account/i }).first().click();

    // The regression in round 1 was that no control existed at all outside
    // Account > Langganan, a billing page nobody opens to sign out.
    await expect(page.getByRole('menuitem', { name: /Log out/i })).toBeVisible({ timeout: 5000 });
  });

  test('clicking logout calls BOTH revoke endpoints', async ({ authedPage: page }) => {
    /**
     * Round 2's bug was a missing second call. Asserting the requests at the
     * network layer is what catches that: a UI test alone passes as long as
     * SOMETHING happens, and the first fix did call one endpoint.
     */
    const revoked = [];
    await page.route('**/api/account/logout', route => {
      revoked.push('account');
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });
    await page.route('**/api/auth', route => {
      if (route.request().method() === 'DELETE') {
        revoked.push('owner');
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
      }
      return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Unauthorized' }) });
    });

    // Stop the reload so the assertions can run against the live page.
    await page.addInitScript(() => {
      window.__mbgBlockReload = true;
      const orig = window.location.reload.bind(window.location);
      try {
        Object.defineProperty(window.location, 'reload', {
          configurable: true,
          value: () => { window.__mbgReloadCalled = true; },
        });
      } catch { /* jsdom-style restriction; the flag above still records intent */ }
      void orig;
    });

    await gotoCockpitRoute(page, 'HOME');
    await page.getByRole('button', { name: /Account/i }).first().click();
    await page.getByRole('menuitem', { name: /Log out/i }).click();
    await page.waitForTimeout(1200);

    expect(revoked, 'logout must revoke the account session AND the owner session')
      .toEqual(expect.arrayContaining(['account', 'owner']));
  });

  test('logout clears every local session key', async ({ authedPage: page }) => {
    await gotoCockpitRoute(page, 'HOME');

    // Seed the legacy keys a stale session could hide behind.
    await page.evaluate(() => {
      for (const k of ['mbg_cockpit_auth', 'mbg_cockpit_auth_time', 'mbg_auth_session']) {
        try { localStorage.setItem(k, 'stale'); } catch {}
      }
    });

    await page.route('**/api/account/logout', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }));
    await page.route('**/api/auth', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }));

    await page.getByRole('button', { name: /Account/i }).first().click();
    await page.getByRole('menuitem', { name: /Log out/i }).click();
    await page.waitForTimeout(1500);

    // The page reloads as part of logout, so read after it settles. If the
    // reload happened, the keys must be gone; if it did not, they still must be.
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    const remaining = await page.evaluate(() => {
      const keys = ['mbg_cockpit_auth', 'mbg_cockpit_auth_time', 'mbg_auth_session'];
      return keys.filter(k => { try { return localStorage.getItem(k) !== null; } catch { return false; } });
    });

    expect(remaining, 'session keys survived logout').toEqual([]);
  });
});

test.describe('session integrity', () => {
  test('a signed-in user never sees the landing page', async ({ authedPage: page }) => {
    await gotoCockpitRoute(page, 'HOME');
    const text = await page.locator('body').innerText();
    expect(text).not.toMatch(/daftar gratis|masuk ke akun/i);
  });

  test('a visitor with no session sees the landing page, not the terminal', async ({ guestPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1200);

    // The cockpit must not flash for a signed-out visitor.
    await expect(page.locator('.cmc-topnav')).toHaveCount(0);
    const text = await page.locator('body').innerText();
    expect(text.length).toBeGreaterThan(100);
  });
});
