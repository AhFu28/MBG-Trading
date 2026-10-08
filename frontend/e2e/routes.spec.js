import { test, expect, gotoCockpitRoute } from './fixtures.js';

/**
 * Route coverage: every navigable page must mount inside the authenticated shell
 * and render content specific to that page.
 *
 * HISTORY — this file was WRONG on its first run and the mistake is worth
 * keeping in the record. It passed 23/23 while asserting nothing: with no
 * session fixture, App.jsx served LandingPage for every `?tab=` value, so all
 * 18 route tests were checking the same page. `gotoCockpitRoute` now waits for
 * `.cmc-topnav`, which only exists inside the authenticated shell, so this
 * failure mode cannot recur silently.
 *
 * The `marker` is a page-specific string. A test that only asserts "body is not
 * empty" would pass on the wrong page; requiring the marker is what makes each
 * row prove its own route.
 */

const ROUTES = [
  { id: 'HOME', marker: /market overview|kapitalisasi|semua aset/i },
  { id: 'SIGNALS', marker: /sinyal|signal|entry/i },
  { id: 'AI_AGENTS', marker: /arena|agent|elemen|bot/i },
  { id: 'CHARTING', marker: /chart|grafik|candle|tradingview/i },
  { id: 'HEATMAP', marker: /heatmap|peta|panas/i },
  { id: 'CRYPTO', marker: /crypto|order book|bids|asks|harga/i },
  { id: 'STOCK', marker: /saham|stock|idx|emiten/i },
  { id: 'FOREX', marker: /forex|komoditas|emas|gold|oil/i },
  { id: 'NEWS', marker: /berita|news|headline/i },
  { id: 'WHALES', marker: /whale|paus|on-chain|dompet/i },
  { id: 'ECONOMIC_CALENDAR', marker: /kalender|calendar|event|rilis/i },
  { id: 'ACADEMY', marker: /academy|materi|belajar|kurikulum/i },
  { id: 'PEARSON_CORRELATION', marker: /korelasi|correlation|pearson|matriks/i },
  { id: 'TESTING', marker: /backtest|testing|strategi|lab/i },
  { id: 'WATCHLIST', marker: /watchlist|pantau|bintang/i },
  { id: 'SETTINGS', marker: /setting|bahasa|tema|theme|tampilan/i },
  { id: 'ACHIEVEMENTS', marker: /legend|achievement|achievement selesai/i },
  { id: 'SUBSCRIPTION', marker: /langganan|paket|pro|harga/i },
];

test.describe('cockpit routes', () => {
  for (const route of ROUTES) {
    test(`${route.id} mounts and shows its own content`, async ({ authedPage: page }) => {
      const pageErrors = [];
      page.on('pageerror', e => pageErrors.push(e.message));

      await gotoCockpitRoute(page, route.id);

      const text = await page.locator('body').innerText();

      // 1. The authenticated shell is present. If the session fixture broke,
      //    this fails loudly instead of silently testing the landing page.
      await expect(page.locator('.cmc-topnav')).toBeVisible();

      // 2. Not the landing page.
      expect(text, `${route.id} served the landing page instead of the cockpit`)
        .not.toMatch(/sudah punya akun\?|daftar gratis/i);

      // 3. Not the unknown-module lock screen (a route with no branch).
      expect(text, `${route.id} hit the unknown-module fallback`)
        .not.toMatch(/modul tidak dikenal|unknown module/i);

      // 4. This route's own content is on screen.
      expect(text, `${route.id} did not render its expected content`).toMatch(route.marker);

      // 5. Nothing threw.
      expect(pageErrors, `${route.id} threw`).toEqual([]);
    });
  }
});

test.describe('navigation reaches every route by clicking, not by URL', () => {
  /**
   * The URL tests above drive the router directly. This one drives the actual
   * nav, because a menu entry pointing at an unrouted id is exactly the bug the
   * owner reported for Live News Wire.
   */
  test('the Account menu reaches Legend Path and it renders', async ({ authedPage: page }) => {
    await gotoCockpitRoute(page, 'HOME');

    const accountBtn = page.getByRole('button', { name: /Account/i }).first();
    await accountBtn.click();
    await page.waitForTimeout(300);
    await page.getByRole('menuitem', { name: /Legend Path/i }).click();
    await page.waitForTimeout(700);

    const text = await page.locator('body').innerText();
    expect(text).toMatch(/legend path/i);
    expect(text).toMatch(/achievement/i);
  });

  test('the Trade menu reaches Live News Wire and it renders content', async ({ authedPage: page }) => {
    await gotoCockpitRoute(page, 'HOME');

    // News lives under Research & Learn in the current nav model.
    const researchBtn = page.getByRole('button', { name: /Research/i }).first();
    await researchBtn.click();
    await page.waitForTimeout(300);
    await page.getByRole('menuitem', { name: /Live News Wire/i }).click();
    await page.waitForTimeout(800);

    const text = await page.locator('body').innerText();
    // The regression: this used to fall through to the fallback desk.
    expect(text).not.toMatch(/modul tidak dikenal/i);
    expect(text).toMatch(/berita|news|headline|wire/i);
  });
});
