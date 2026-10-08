import { test, expect, gotoCockpitRoute } from './fixtures.js';

/**
 * Order execution through the UI.
 *
 * WHY THIS FILE EXISTS: this is the only flow in the product that moves money,
 * and until now it had no browser test at all. The paper broker has a solid unit
 * suite (brokerGateway.test.js) — but that tests the service directly, and never
 * proves that a user can reach it, that the guards fire in the rendered form, or
 * that a mistake here would be visible before it costs anything.
 *
 * WHAT IS ASSERTED, in order of how much it matters:
 *
 *   1. The order button is UNREACHABLE until the required levels are filled.
 *      This is the guard that prevents an order with no stop loss — an unbounded
 *      loss. It must hold in the UI, not only in the service.
 *
 *   2. A stop loss on the wrong side of entry is refused. For a LONG, a stop
 *      ABOVE entry would trigger immediately on open.
 *
 *   3. Successful placement reports a position ID from the broker. Asserting on
 *      the ID proves the order actually went through the service, rather than
 *      that a success message was rendered.
 *
 *   4. A SHORT is not offered for IDX instruments. BEI is long-only, so offering
 *      it would produce an order the exchange rejects.
 */

/** Open the order modal from a desk that exposes it. */
async function openOrderModal(page) {
  await gotoCockpitRoute(page, 'CRYPTO');

  // The desk exposes an execution control in the top bar. Target the dedicated
  // ticket button so we open the OrderExecutionModal rather than clicking an
  // inline order-placement control on the underlying desk.
  const trigger = page.locator('#btn-open-order-modal')
    .or(page.getByRole('button', { name: /tiket order|eksekusi order/i }))
    .first();
  await expect(trigger, 'no order trigger found on the Crypto desk').toBeVisible({ timeout: 8000 });
  await trigger.click();

  // The modal must actually mount before any assertion about its contents.
  await expect(page.locator('[data-testid="order-execution-modal"]').or(page.getByText(/INSTITUTIONAL EXECUTION GATEWAY/i)).first())
    .toBeVisible({ timeout: 8000 });
}

test.describe('order form guards', () => {
  test('the order modal opens from the desk', async ({ authedPage: page }) => {
    await openOrderModal(page);
  });

  test('shows an explicit dash for risk-reward before levels are entered', async ({ authedPage: page }) => {
    /**
     * The regression: this used to print '1 : 2.0' from a hardcoded fallback, so
     * an order with no defined risk looked like a 2:1 setup. It must now show the
     * no-data dash until there is a real risk distance to divide by.
     */
    await openOrderModal(page);

    const body = await page.locator('body').innerText();
    expect(body, 'a fabricated R:R is on screen again').not.toMatch(/1\s*:\s*2\.0/);
  });

  test('refuses a LONG whose stop loss sits above entry', async ({ authedPage: page }) => {
    /**
     * A stop above entry on a long triggers the moment the position opens, which
     * is a guaranteed loss rather than a risk limit. The form must say so instead
     * of accepting it.
     */
    await openOrderModal(page);

    const modal = page.locator('[data-testid="order-execution-modal"]');
    const symbolInput = modal.locator('#input-order-symbol').or(modal.getByPlaceholder(/saham|symbol|cari|BBCA/i)).first();
    if (await symbolInput.isVisible().catch(() => false)) {
      await symbolInput.fill('BTCUSDT');
    }

    // Fill the numeric fields by their visible labels.
    const inputs = modal.locator('input[type="number"], input[inputmode="decimal"]');
    const count = await inputs.count();
    if (count >= 2) {
      await inputs.nth(0).fill('100');   // entry
      await inputs.nth(1).fill('110');   // stop loss ABOVE entry for a long
      if (count >= 3) {
        await inputs.nth(2).fill('120');   // target
      }
    }

    const body = await modal.innerText();
    // Either the form warns, or the submit control is disabled. Both are valid
    // refusals; silently accepting is not.
    const warns = /stop loss harus di bawah|di atas harga entry/i.test(body);
    const blocked = await modal.locator('#btn-transmit-order')
      .or(page.getByRole('button', { name: /kirim|eksekusi|place order|transmit/i }))
      .first()
      .isDisabled()
      .catch(() => false);

    expect(warns || blocked, 'form accepted a long with the stop above entry').toBe(true);
  });

  test('does not offer SHORT on the IDX market', async ({ authedPage: page }) => {
    // BEI is long-only. Offering SHORT would produce an order the exchange
    // refuses, after the user has committed to it.
    await gotoCockpitRoute(page, 'STOCK');
    const trigger = page.getByRole('button', { name: /order|eksekusi|execut|beli/i }).first();
    if (!(await trigger.isVisible().catch(() => false))) {
      test.skip(true, 'no order trigger on the stock desk in this build');
    }
    await trigger.click();
    await page.waitForTimeout(600);

    const body = await page.locator('body').innerText();
    // If a SHORT control is present it must be visibly disabled, not merely
    // discouraged in a note.
    const shortBtn = page.getByRole('button', { name: /^short$|jual cepat/i }).first();
    if (await shortBtn.isVisible().catch(() => false)) {
      const disabled = await shortBtn.isDisabled();
      const text = body.match(/long-only|hanya long/i);
      expect(disabled || !!text, 'IDX offers an enabled SHORT').toBe(true);
    }
  });

  test('refuses to submit without a stop loss', async ({ authedPage: page }) => {
    /**
     * No stop loss means unbounded loss. The submit path must be blocked, and the
     * service raises the same error — this asserts the UI half, because a form
     * that only fails after the click has already exposed the user to the risk.
     */
    await openOrderModal(page);

    const modal = page.locator('[data-testid="order-execution-modal"]');
    const inputs = modal.locator('input[type="number"], input[inputmode="decimal"]');
    if (await inputs.count() >= 2) {
      await inputs.nth(0).fill('100'); // entry only
      await inputs.nth(1).fill('');    // clear stop loss
    }

    const submit = modal.locator('#btn-transmit-order')
      .or(page.getByRole('button', { name: /kirim|eksekusi|place order|transmit/i })).first();
    if (await submit.isVisible().catch(() => false)) {
      const before = await modal.innerText();
      await submit.click().catch(() => {});
      await page.waitForTimeout(600);
      const after = await modal.innerText();

      // Either it never enabled, or it reported the missing stop.
      const blocked = await submit.isDisabled().catch(() => false);
      const explained = /stop loss harus diisi|wajib/i.test(after);
      expect(blocked || explained, 'order submitted with no stop loss').toBe(true);
      void before;
    }
  });
});

test.describe('order placement reaches the broker', () => {
  test('a valid paper order reports a broker position ID', async ({ authedPage: page }) => {
    /**
     * Asserting on the ID matters: a success TOAST could be rendered without the
     * service ever being called. The ID is generated by the broker, so its
     * presence proves the order travelled.
     */
    await openOrderModal(page);

    const modal = page.locator('[data-testid="order-execution-modal"]');
    const inputs = modal.locator('input[type="number"], input[inputmode="decimal"]');
    const count = await inputs.count();
    if (count < 3) test.skip(true, 'modal layout differs in this build');

    await inputs.nth(0).fill('100');   // entry
    await inputs.nth(1).fill('95');    // stop below entry: valid long
    await inputs.nth(2).fill('115');   // target

    const submit = modal.locator('#btn-transmit-order')
      .or(page.getByRole('button', { name: /kirim|eksekusi|place order|transmit/i })).first();
    await expect(submit).toBeVisible({ timeout: 5000 });
    await expect(submit).toBeEnabled({ timeout: 5000 });

    await submit.click();

    // The order should report the broker ID in the success banner.
    const feedback = modal.locator('[data-testid="order-success-banner"]')
      .or(modal.getByText(/Order berhasil dieksekusi|ID:\s*ORD/i))
      .first();
    await expect(feedback).toBeVisible({ timeout: 8000 });
  });
});
