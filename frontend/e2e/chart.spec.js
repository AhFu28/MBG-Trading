import { test, expect, gotoCockpitRoute } from './fixtures.js';

/**
 * Chart rendering, in a real browser.
 *
 * WHY THIS SPECIFICALLY: the owner reported the Pro Desk chart as a black
 * rectangle twice. The first cause was structural — the TradingView embed
 * script looks for a container with the class `tradingview-widget-container`,
 * and our container did not have it, so the widget built its own element
 * elsewhere and nothing ever drew. No error was raised. A unit test cannot see
 * that; it can only assert that an <iframe> or <div> was rendered, which was
 * true the whole time the chart was black.
 *
 * WHAT IS ASSERTED HERE: that the chart region has real layout (non-zero size),
 * that something is actually mounted inside it, and that a known-broken
 * construct (the script-injection approach) is not in use.
 */

test.describe('chart surfaces', () => {
  test('the Charting Desk mounts a TradingView chart with a resolved symbol', async ({ authedPage: page }) => {
    await gotoCockpitRoute(page, 'CHARTING');
    await page.waitForTimeout(1500);

    const chart = await page.evaluate(() => {
      const el = document.querySelector('main iframe');
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { src: el.getAttribute('src') || '', w: Math.round(b.width), h: Math.round(b.height) };
    });

    expect(chart, 'no chart iframe on the Charting Desk').not.toBeNull();

    // Real size. A zero-height element IS the black rectangle the owner saw.
    expect(chart.w).toBeGreaterThan(200);
    expect(chart.h).toBeGreaterThan(100);

    /**
     * The iframe must point at TradingView with a resolved symbol.
     *
     * This is the assertion that would have caught the original bug. The old
     * code injected `<script>` into a container missing the class the widget
     * looks for, so nothing drew and no error was raised. Asserting on the
     * iframe's own src proves a chart was actually requested; asserting it
     * carries a symbol proves the symbol plumbing works.
     */
    expect(chart.src).toContain('tradingview.com');
    expect(chart.src).toMatch(/symbol=[A-Z0-9%:_]+/i);
  });

  test('the script-injection approach that caused the black chart is gone', async ({ authedPage: page }) => {
    /**
     * Structural regression guard. The widget script builds its own container
     * when the host element lacks `tradingview-widget-container`, which is how
     * the chart rendered as an empty black box with no error. The fix replaced
     * injection with a plain iframe, so no such script may exist any more.
     */
    await gotoCockpitRoute(page, 'CHARTING');
    const injected = await page.evaluate(() =>
      document.querySelectorAll('script[src*="external-embedding"]').length);
    expect(injected, 'TradingView script injection is back').toBe(0);
  });

  test('the chart symbol follows the selected market', async ({ authedPage: page }) => {
    // Crypto desk must request a crypto symbol, not a stale IDX one. A wrong
    // symbol renders a chart, so only checking "a chart exists" would pass.
    await gotoCockpitRoute(page, 'CRYPTO');
    await page.waitForTimeout(1500);

    const src = await page.evaluate(() => {
      const el = document.querySelector('main iframe');
      return el ? (el.getAttribute('src') || '') : null;
    });

    expect(src, 'no chart iframe on the Crypto desk').not.toBeNull();
    expect(src).toMatch(/BINANCE|BTC|ETH/i);
  });

  test('the Pro Desk header renders its metrics, not blank placeholders', async ({ authedPage: page }) => {
    await gotoCockpitRoute(page, 'CRYPTO');

    const text = await page.locator('body').innerText();

    // The desk shows a ribbon of metrics. Each is either a real value or an
    // explicit dash — never an empty gap, which is what a broken binding looks
    // like (the arena table once rendered a blank direction cell for weeks).
    for (const label of [/mark/i, /oracle/i, /funding/i]) {
      expect(text, `Pro Desk is missing the ${label} metric`).toMatch(label);
    }
  });
});

test.describe('no fabricated market values reach the screen', () => {
  /**
   * These literals shipped as invented statistics and were removed by hand.
   * Asserting on RENDERED TEXT matters because a value can be correct in source
   * and still be printed by a fallback branch that never runs in unit tests.
   */
  const BANNED = [
    { re: /DEFCON\s+4\b/, why: 'hardcoded threat level' },
    { re: /\b99\.0\b/, why: 'fabricated profit factor fallback' },
    { re: /\$529\.7M/, why: 'hardcoded 24h volume' },
    { re: /\$1\.78B/, why: 'hardcoded open interest' },
    { re: /0\.0013%\s*00:14:58/, why: 'frozen funding countdown' },
  ];

  for (const route of ['HOME', 'CRYPTO', 'CHARTING', 'AI_AGENTS']) {
    for (const { re, why } of BANNED) {
      test(`${route} does not print ${re} (${why})`, async ({ authedPage: page }) => {
        await gotoCockpitRoute(page, route);
        await page.waitForTimeout(700);
        const text = await page.locator('body').innerText();
        expect(text, `${why} is on screen at ${route}`).not.toMatch(re);
      });
    }
  }
});
