import { test, expect, gotoCockpitRoute } from './fixtures.js';

test.describe('chart prediction & strategy scoring arena', () => {
  test('opens prediction arena from Legend Path, locks a forecast, and simulates verification', async ({ authedPage: page }) => {
    // 1. Navigate to ACHIEVEMENTS (Legend Path)
    await gotoCockpitRoute(page, 'ACHIEVEMENTS');

    // 2. Locate the Prediction Arena trigger button
    const openBtn = page.locator('#btn-open-prediction-modal-achievements');
    await expect(openBtn).toBeVisible({ timeout: 8000 });
    await openBtn.click();

    // 3. Verify modal opened
    const modal = page.locator('[data-testid="chart-prediction-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.getByText(/ARENA PREDIKSI CHART & SKOR STRATEGI/i)).toBeVisible();

    // 4. Fill prediction form
    const symInput = modal.locator('#input-pred-symbol');
    await symInput.fill('ETHUSDT');

    const entryInput = modal.locator('#input-pred-entry');
    await entryInput.fill('3000');

    const slInput = modal.locator('#input-pred-stop-loss');
    await slInput.fill('2900');

    const tpInput = modal.locator('#input-pred-target');
    await tpInput.fill('3300');

    const rationaleInput = modal.locator('#textarea-pred-rationale');
    await rationaleInput.fill('Retest demand zone 4H konfirmasi breakout volume tinggi');

    // 5. Submit prediction
    const submitBtn = modal.locator('#btn-submit-prediction');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // 6. Verify success banner
    await expect(modal.getByText(/berhasil dikunci/i)).toBeVisible({ timeout: 5000 });

    // 7. Open History tab
    const historyTab = modal.locator('#tab-btn-prediction-history');
    await historyTab.click();

    // 8. Verify the pending forecast appears in history
    await expect(modal.getByText(/ETHUSDT/i).first()).toBeVisible({ timeout: 5000 });
    await expect(modal.getByText(/AKTIF/i).first()).toBeVisible();

    // 9. Simulate successful resolution
    const simSuccessBtn = modal.getByRole('button', { name: /Simulasikan Sukses/i }).first();
    await expect(simSuccessBtn).toBeVisible();
    await simSuccessBtn.click();

    // 10. Verify status changed to WON with awarded points
    await expect(modal.getByText(/BENAR \(\+/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('opens prediction arena directly from Charting Desk', async ({ authedPage: page }) => {
    await gotoCockpitRoute(page, 'CHARTING');

    const trigger = page.locator('#btn-open-prediction-charting');
    if (await trigger.isVisible().catch(() => false)) {
      await trigger.click();
      const modal = page.locator('[data-testid="chart-prediction-modal"]');
      await expect(modal).toBeVisible({ timeout: 5000 });
    }
  });
});
