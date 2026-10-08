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
   * The URL tests above drive the router directly. These drive the actual nav,
   * because a menu entry pointing at an unrouted id is exactly the bug the owner
   * reported for Live News Wire.
   *
   * WAIT FOR THE PANEL, DO NOT SLEEP. An earlier version clicked and then read
   * the body text after a fixed timeout, which failed even though the panel was
   * open — the assertion simply ran before React had committed. Waiting on the
   * element that must appear is both faster and honest about what is being
   * tested.
   */
  test('the Account menu reaches Legend Path and it renders', async ({ authedPage: page }) => {
    await gotoCockpitRoute(page, 'HOME');

    await page.getByRole('button', { name: /Account/i }).first().click();

    // The panel must actually open. If it does not, fail here with a clear
    // message rather than continuing to a confusing text assertion.
    const legendItem = page.getByRole('menuitem', { name: /Legend Path/i });
    await expect(legendItem).toBeVisible({ timeout: 5000 });

    await legendItem.click();

    // The destination page, not the landing page and not the fallback desk.
    await expect(page.getByRole('heading', { name: /Legend Path/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/achievement/i).first()).toBeVisible();
  });

  test('the Research menu reaches Live News Wire and it renders content', async ({ authedPage: page }) => {
    await gotoCockpitRoute(page, 'HOME');

    await page.getByRole('button', { name: /Research/i }).first().click();

    const newsItem = page.getByRole('menuitem', { name: /Live News Wire/i });
    await expect(newsItem).toBeVisible({ timeout: 5000 });
    await newsItem.click();

    // The regression this guards: the entry existed with no router branch, so
    // clicking it fell through to the fallback desk.
    await expect(page.getByText(/modul tidak dikenal/i)).toHaveCount(0);
    await expect(page.getByText(/berita|news|headline/i).first()).toBeVisible({ timeout: 5000 });
  });
});
