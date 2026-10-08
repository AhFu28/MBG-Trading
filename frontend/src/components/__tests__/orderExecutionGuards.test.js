import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Guard against fabricated risk ratios on the order form.
 *
 * WHY THIS FILE EXISTS — the order form computed the risk-reward ratio as:
 *
 *   const netRR = riskDistance > 0 ? (rewardDistance / riskDistance).toFixed(2) : '2.0';
 *
 * So an order with no stop loss yet rendered "1 : 2.0". That is not a computed
 * value; it is a plausible-looking constant, displayed next to the submit button
 * in the same style as a real ratio. A trader reads R:R to decide whether a
 * setup is worth taking, which makes this the worst possible place to invent one.
 *
 * WHY A SOURCE-LEVEL CHECK: the ratio only becomes wrong when the inputs are
 * incomplete, and jsdom cannot easily mount this modal with a half-filled form
 * (it depends on the paper broker and a live price feed). Asserting on the source
 * is a weaker instrument than rendering, and it is honest about that — the E2E
 * suite covers the rendered case, and this catches the reintroduction at the
 * point of edit, where a reviewer will see it.
 */

const MODAL = path.resolve(__dirname, '..', 'OrderExecutionModal.jsx');

function readModal() {
  return fs.readFileSync(MODAL, 'utf8');
}

describe('order form: risk-reward ratio', () => {
  it('never falls back to a hardcoded ratio', () => {
    const src = readModal();
    // The exact literal that shipped.
    expect(src).not.toMatch(/:\s*'2\.0'/);
    expect(src).not.toMatch(/toFixed\(2\)\s*:\s*'2\.0'/);
  });

  it('produces null when there is no risk distance to divide by', () => {
    const src = readModal();
    // The guard must still exist in some form.
    expect(src).toMatch(/hasRiskDistance/);
    expect(src).toMatch(/riskDistance\s*>\s*0/);
  });

  it('renders an explicit placeholder instead of a number when unavailable', () => {
    const src = readModal();
    expect(src).toMatch(/netRR === null \? '—'/);
  });
});

describe('order form: other displayed figures', () => {
  it('does not print a fabricated slippage or fee', () => {
    const src = readModal();
    // Fees come from BROKER_FEES; a literal percentage here would be a guess.
    expect(src).not.toMatch(/slippage:\s*0\.0[0-9]/i);
  });

  it('keeps the stop-loss requirement enforced before submit', () => {
    const src = readModal();
    // The fabricated ratio was display-only; submission must still be blocked.
    expect(src).toMatch(/Level Stop Loss harus diisi/);
  });

  it('keeps the over-allocation guard before submit', () => {
    const src = readModal();
    // Placing an order larger than available cash is the failure that costs
    // real money, so the guard must survive any edit to the display logic.
    expect(src).toMatch(/melebihi saldo kas tersedia/);
    expect(src).toMatch(/isOverAllocated/);
  });
});

/**
 * The same fabricated-ratio pattern appeared in two more places. Found by
 * grepping for the shape rather than by reading every file, after the first one
 * turned up.
 */
describe('risk-reward: no other module invents a ratio', () => {
  const ROOT = path.resolve(__dirname, '..', '..');

  function read(relative) {
    return fs.readFileSync(path.join(ROOT, relative), 'utf8');
  }

  it('dynamicStrategy returns null rather than 2.0 when risk is unmeasurable', () => {
    const src = read('utils/dynamicStrategy.js');
    // The two literals that shipped.
    expect(src).not.toMatch(/initialRR\s*=.*:\s*2\.0/);
    expect(src).not.toMatch(/dynamicRR:\s*2\.0/);
    expect(src).toMatch(/dynamicRR:\s*null/);
  });

  it('dynamicStrategy never renders a null ratio as text', () => {
    const src = read('utils/dynamicStrategy.js');
    // The advice sentence must branch, or it prints "1:null".
    expect(src).toMatch(/dynamicRR === null/);
  });

  it('the leaderboard treats a null ratio as unknown, not as a number', () => {
    const src = read('components/MasterQuantLeaderboard.jsx');
    // `!== undefined` lets null through, which is what printed "1:null".
    expect(src).not.toMatch(/dynamicRR !== undefined/);
    expect(src).toMatch(/Number\.isFinite/);
  });

  it('the lot calculator derives its ratio label from one constant', () => {
    const src = read('components/LotCalculatorModal.jsx');
    // The multiplier used to be typed out three times.
    const hardcoded = src.match(/'1 : 2\.2[^']*'/g) || [];
    expect(hardcoded, 'ratio label is hardcoded again').toEqual([]);
    expect(src).toMatch(/TARGET_RR/);
  });
});

