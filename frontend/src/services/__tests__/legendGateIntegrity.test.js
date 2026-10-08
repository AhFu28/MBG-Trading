import { describe, it, expect, beforeEach } from 'vitest';
import {
  legendEligible,
  loadAchievementContext,
  saveAchievementContext,
  ACHIEVEMENT_STORAGE_KEY,
  EMPTY_ACHIEVEMENT_CONTEXT,
} from '../achievements.js';
import { TIER } from '../featureAccess.js';

/**
 * The LEGEND gate, attacked rather than merely exercised.
 *
 * WHY THIS FILE EXISTS SEPARATELY: achievements.test.js checks the gate behaves
 * correctly for honest input. This file assumes a user who wants LEGEND without
 * earning it, because LEGEND unlocks a bot that can spend their money — and the
 * progress store is currently localStorage, which the user owns.
 *
 * The tests below are written as attacks. Each one either demonstrates that the
 * attack succeeds (in which case the finding is recorded as a `it.fails` or a
 * documented gap) or confirms it is blocked. Writing them as attacks matters:
 * a test that says "returns false for empty context" passes while the real hole
 * is somewhere else entirely.
 */

beforeEach(() => {
  localStorage.clear();
});

describe('attack: hand-editing the progress store', () => {
  it('rejects a store written with values that are not numbers', () => {
    // A user pastes this into the console and reloads.
    localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify({
      activeDays: 'lots',
      signalsReviewed: null,
      chartHours: {},
      paperTradesClosed: [],
      positionsWithStopLoss: true,
      journalEntries: 'NaN',
      watchlistCount: undefined,
      backtestsRun: Infinity,
      academyLessonsDone: -5,
      manualOrdersPlaced: NaN,
    }));

    const ctx = loadAchievementContext();
    for (const [key, value] of Object.entries(ctx)) {
      expect(Number.isFinite(value), `${key} survived as ${value}`).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });

  it('DOCUMENTS THE REAL HOLE: plain numbers are accepted as-is', () => {
    /**
     * The sanitiser keeps only finite positive numbers. That is the correct
     * defence against a MALFORMED store, and no defence at all against a
     * well-formed lie — which is what a user can trivially produce.
     *
     * This test asserts the weakness EXISTS so it cannot be mistaken for
     * something already solved. When progress moves to the account store and is
     * re-verified server-side, this test should be inverted to assert rejection.
     */
    const fabricated = {
      activeDays: 999,
      signalsReviewed: 999,
      chartHours: 999,
      paperTradesClosed: 999,
      positionsWithStopLoss: 999,
      journalEntries: 999,
      watchlistCount: 999,
      backtestsRun: 999,
      academyLessonsDone: 999,
      manualOrdersPlaced: 999,
      chartPredictionsCorrect: 999,
      predictionPoints: 999,
    };
    localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(fabricated));

    const ctx = loadAchievementContext();
    expect(ctx.manualOrdersPlaced, 'sanitiser accepted a fabricated perfect score').toBe(999);

    // And it unlocks the tier that can spend money.
    const gate = legendEligible(ctx, TIER.PRO);
    expect(gate.eligible, 'CLIENT-SIDE GATE IS BYPASSABLE — documented, not fixed').toBe(true);
  });

  it('a corrupted store degrades to zero rather than throwing', () => {
    // Whatever the user does to the store, the app must still render.
    for (const payload of ['{not json', 'null', '"a string"', '[]', '42', '']) {
      localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, payload);
      expect(() => loadAchievementContext()).not.toThrow();
      const ctx = loadAchievementContext();
      expect(ctx.activeDays).toBe(0);
    }
  });

  it('counters cannot be driven negative to fake a different state', () => {
    saveAchievementContext({ ...EMPTY_ACHIEVEMENT_CONTEXT, activeDays: -50 });
    expect(loadAchievementContext().activeDays).toBe(0);
  });
});

describe('attack: satisfying the gate without a Pro subscription', () => {
  it('refuses a GUEST with a perfect progress store', () => {
    const perfect = {
      activeDays: 999, signalsReviewed: 999, chartHours: 999,
      paperTradesClosed: 999, positionsWithStopLoss: 999, journalEntries: 999,
      watchlistCount: 999, backtestsRun: 999, academyLessonsDone: 999,
      manualOrdersPlaced: 999, chartPredictionsCorrect: 999, predictionPoints: 999,
    };
    // A complete store is not enough on its own: the subscription check must
    // still hold, or a free account could fabricate its way into the money tier.
    expect(legendEligible(perfect, TIER.GUEST).eligible).toBe(false);
    expect(legendEligible(perfect, TIER.FREE).eligible).toBe(false);
    // And with Pro, the same store does unlock — which is the hole the other
    // test in this file documents.
    expect(legendEligible(perfect, TIER.PRO).eligible).toBe(true);
  });

  it('leaves admin as the only unconditional path', () => {
    // The bypass is intentional and must stay narrow: one flag, one meaning.
    expect(legendEligible(EMPTY_ACHIEVEMENT_CONTEXT, TIER.GUEST, true).eligible).toBe(true);
    expect(legendEligible(EMPTY_ACHIEVEMENT_CONTEXT, TIER.PRO, false).eligible).toBe(false);
  });
});
