import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end verification for the MBG Quant terminal.
 *
 * WHY THIS EXISTS (owner, 2026-10-08):
 *   "kamu gk ada fitur playwright kah?? setelah kamu bikin, harus ada testing
 *    dong... ayo lakukan testing"
 *
 * The unit suite (vitest) renders components in jsdom and stubs the network. It
 * proves logic, and it cannot catch the class of bug the owner keeps hitting:
 * a page that throws on load, a chart that renders black, a panel that is
 * silently empty, a menu entry with no route. Those only appear in a real
 * browser against a real build.
 *
 * So this suite deliberately does the opposite of the unit tests: real Chromium,
 * real built assets, real layout, and it FAILS on any uncaught console error or
 * failed request. A page that "looks fine" but logs a TypeError is a failure.
 */

const BASE_URL = process.env.E2E_BASE_URL || 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './e2e',
  // A real browser on a laptop; parallel workers make timing-based failures
  // flaky and the suite is small enough to run serially.
  workers: 1,
  fullyParallel: false,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['json', { outputFile: 'e2e-results.json' }],
  ],
  use: {
    baseURL: BASE_URL,
    // Kept on failure only; a passing run should not leave 40 screenshots.
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // `vite preview` serves the production build, which is what users get.
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
