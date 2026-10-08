import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * The locked-module screen, and why there are TWO of them.
 *
 * THE PROBLEM THIS GUARDS AGAINST: there used to be one generic lock screen that
 * always said "Modul Ini Khusus Pro" and always offered a purchase button. For a
 * LEGEND module that message is a lie with a price attached — LEGEND cannot be
 * bought, so a user who pays is still locked out. That is worse than a plain
 * refusal, because money changed hands on the strength of it.
 *
 * The fix splits the screen in two:
 *   - a LEGEND module explains what must be EARNED and links to the board
 *   - a PRO module keeps the purchase path, which is correct for it
 *
 * WHY SOURCE-LEVEL ASSERTIONS: App.jsx is a 1,200-line component that mounts the
 * entire cockpit, the live price engine and every desk. Rendering it in jsdom to
 * reach one branch would be slow and brittle, and the property being checked is
 * structural anyway: which screen does this branch render. The E2E suite covers
 * the rendered case.
 */

const APP = path.resolve(__dirname, '..', '..', 'App.jsx');

function readApp() {
  return fs.readFileSync(APP, 'utf8');
}

describe('locked module screen', () => {
  it('branches on the required tier rather than showing one generic message', () => {
    const src = readApp();
    expect(src).toMatch(/requiredTierFor\(activeTab\)\s*===\s*TIER\.LEGEND/);
  });

  it('tells a LEGEND-locked user that the tier cannot be bought', () => {
    const src = readApp();
    // The exact claim, because this is the sentence that prevents a wasted payment.
    expect(src).toMatch(/tidak bisa dibeli langsung/);
  });

  it('sends a LEGEND-locked user to the achievement board', () => {
    const src = readApp();
    // The board is the only path that actually opens TRADING_BOT and
    // JEV_EXECUTION, so the button must lead there.
    expect(src).toMatch(/setActiveTab\('ACHIEVEMENTS'\)/);
  });

  it('does not offer a LEGEND user the Pro purchase page', () => {
    const src = readApp();
    /**
     * Locate the LEGEND branch and confirm the Pro CTA is not inside it. Done by
     * splitting on the branch marker rather than by regex-across-the-whole-file,
     * because the Pro screen legitimately contains that button.
     */
    const marker = src.indexOf("requiredTierFor(activeTab) === TIER.LEGEND ?");
    expect(marker, 'the LEGEND branch is gone').toBeGreaterThan(-1);

    // The branch runs until the Pro screen's own opening.
    const proScreen = src.indexOf('Modul Ini Khusus Pro', marker);
    expect(proScreen, 'the Pro screen is gone').toBeGreaterThan(marker);

    const legendBranch = src.slice(marker, proScreen);
    expect(legendBranch, 'LEGEND branch sends the user to a purchase page')
      .not.toMatch(/setActiveTab\('SUBSCRIPTION'\)/);
    expect(legendBranch, 'LEGEND branch promises a Pro upgrade').not.toMatch(/Lihat Paket Pro/);
  });

  it('still keeps the purchase path for genuine Pro modules', () => {
    const src = readApp();
    // The generic screen must survive for modules that ARE purchasable.
    expect(src).toMatch(/Lihat Paket Pro/);
    expect(src).toMatch(/Khusus Pro/);
  });

  it('lets an admin through without either screen', () => {
    const src = readApp();
    // The branch condition still starts with the admin bypass, so an admin
    // locked out of their own execution desk cannot happen.
    expect(src).toMatch(/!isAdmin && !canAccess\(activeTab, userTier, isAdmin\)/);
  });
});
