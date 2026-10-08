import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ACHIEVEMENTS,
  ACHIEVEMENTS_BY_ID,
  buildAchievementBoard,
  legendEligible,
  eligibilityMessage,
  isUnlocked,
  achievementProgress,
  loadAchievementContext,
  saveAchievementContext,
  bumpAchievement,
  recordActiveDay,
  EMPTY_ACHIEVEMENT_CONTEXT,
  ACHIEVEMENT_STORAGE_KEY,
} from '../achievements.js';
import { TIER } from '../featureAccess.js';

/**
 * LEGEND is the only tier that can place a real order with a user's money, and
 * the owner's decision was that it must be EARNED rather than bought:
 *
 *   "sudah masuk level tertentu, baru bisa upgrade... seperti game solo leveling"
 *   "aktivitas dan achievement"
 *
 * These tests exist because the failure mode here is expensive: if the gate
 * ever returns eligible=true too easily, a user who has never placed an order
 * gets an autonomous bot pointed at their account.
 */

function makeStorage() {
  const map = new Map();
  return {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: k => map.delete(k),
    _map: map,
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', makeStorage());
});

const completeContext = Object.fromEntries(
  Object.keys(EMPTY_ACHIEVEMENT_CONTEXT).map(k => [k, 9999]),
);

describe('achievement definitions', () => {
  it('every achievement is measurable, with a positive target', () => {
    for (const a of ACHIEVEMENTS) {
      expect(typeof a.progress, `${a.id} has no progress fn`).toBe('function');
      expect(a.target, `${a.id} has no target`).toBeGreaterThan(0);
      expect(a.name, `${a.id} has no name`).toBeTruthy();
      expect(a.desc, `${a.id} has no description`).toBeTruthy();
    }
  });

  it('ids are unique', () => {
    const ids = ACHIEVEMENTS.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('reads zero from an empty context rather than assuming progress', () => {
    for (const a of ACHIEVEMENTS) {
      expect(Number(a.progress(EMPTY_ACHIEVEMENT_CONTEXT))).toBe(0);
      expect(isUnlocked(a, EMPTY_ACHIEVEMENT_CONTEXT)).toBe(false);
    }
  });

  it('survives a context with missing keys', () => {
    // A partial store must not throw, and must not read as unlocked.
    for (const a of ACHIEVEMENTS) {
      expect(isUnlocked(a, {})).toBe(false);
      expect(isUnlocked(a, { someOtherKey: 9999 })).toBe(false);
    }
  });
});

describe('buildAchievementBoard', () => {
  it('reports nothing unlocked for a brand-new account', () => {
    const board = buildAchievementBoard(EMPTY_ACHIEVEMENT_CONTEXT);
    expect(board.unlockedCount).toBe(0);
    expect(board.allUnlocked).toBe(false);
    expect(board.total).toBe(ACHIEVEMENTS.length);
    expect(board.completion).toBe(0);
  });

  it('lists locked achievements too, because they are the roadmap', () => {
    const board = buildAchievementBoard(EMPTY_ACHIEVEMENT_CONTEXT);
    expect(board.items).toHaveLength(ACHIEVEMENTS.length);
    expect(board.items.every(i => i.unlocked === false)).toBe(true);
  });

  it('reports all unlocked once every target is met', () => {
    const board = buildAchievementBoard(completeContext);
    expect(board.allUnlocked).toBe(true);
    expect(board.completion).toBe(1);
  });

  it('clamps progress to 1 so an over-achiever cannot exceed the bar', () => {
    const a = ACHIEVEMENTS_BY_ID.ACTIVE_DAYS;
    expect(achievementProgress(a, { activeDays: 99999 })).toBe(1);
  });
});

describe('legendEligible — the money gate', () => {
  it('refuses a guest', () => {
    const r = legendEligible(completeContext, TIER.GUEST);
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe('not_pro');
  });

  it('refuses a free account', () => {
    expect(legendEligible(completeContext, TIER.FREE).eligible).toBe(false);
  });

  it('refuses Pro when achievements are incomplete', () => {
    // The important case: paying is not enough.
    const r = legendEligible({ activeDays: 14 }, TIER.PRO);
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe('achievements_incomplete');
  });

  it('refuses Pro with zero activity', () => {
    expect(legendEligible(EMPTY_ACHIEVEMENT_CONTEXT, TIER.PRO).eligible).toBe(false);
  });

  it('allows Pro with every achievement complete', () => {
    const r = legendEligible(completeContext, TIER.PRO);
    expect(r.eligible).toBe(true);
    expect(r.reason).toBe('unlocked');
  });

  it('allows a Legend who already holds the tier', () => {
    expect(legendEligible(completeContext, TIER.LEGEND).eligible).toBe(true);
  });

  it('allows an admin unconditionally, even with no activity', () => {
    // An administrator locked out of their own execution desk cannot support
    // a customer who is stuck.
    const r = legendEligible(EMPTY_ACHIEVEMENT_CONTEXT, TIER.GUEST, true);
    expect(r.eligible).toBe(true);
    expect(r.reason).toBe('admin');
  });

  it('does not throw on missing arguments', () => {
    expect(() => legendEligible()).not.toThrow();
    expect(legendEligible().eligible).toBe(false);
  });

  it('explains every refusal in plain language', () => {
    for (const reason of ['admin', 'not_pro', 'achievements_incomplete', 'unlocked']) {
      const msg = eligibilityMessage({ reason, board: buildAchievementBoard({}) });
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    }
  });
});

describe('progress storage', () => {
  it('starts empty when nothing is stored', () => {
    expect(loadAchievementContext()).toEqual(EMPTY_ACHIEVEMENT_CONTEXT);
  });

  it('round-trips a saved context', () => {
    saveAchievementContext({ ...EMPTY_ACHIEVEMENT_CONTEXT, activeDays: 5 });
    expect(loadAchievementContext().activeDays).toBe(5);
  });

  it('discards unknown keys and rejects non-numeric values', () => {
    // A hand-edited store must not be able to inject its way past the gate.
    localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify({
      activeDays: 'lots',
      signalsReviewed: -50,
      evilKey: 9999,
      isLegend: true,
    }));
    const ctx = loadAchievementContext();
    expect(ctx.activeDays).toBe(0);
    expect(ctx.signalsReviewed).toBe(0);
    expect(ctx.evilKey).toBeUndefined();
    expect(ctx.isLegend).toBeUndefined();
    expect(Object.keys(ctx).sort()).toEqual(Object.keys(EMPTY_ACHIEVEMENT_CONTEXT).sort());
  });

  it('survives corrupt JSON without throwing', () => {
    localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, '{not json');
    expect(() => loadAchievementContext()).not.toThrow();
    expect(loadAchievementContext()).toEqual(EMPTY_ACHIEVEMENT_CONTEXT);
  });

  it('survives storage that throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('denied'); },
      setItem: () => { throw new Error('denied'); },
      removeItem: () => { throw new Error('denied'); },
    });
    expect(() => loadAchievementContext()).not.toThrow();
    expect(() => bumpAchievement('activeDays', 1)).not.toThrow();
  });
});

describe('bumpAchievement', () => {
  it('increments a counter', () => {
    bumpAchievement('signalsReviewed', 3);
    bumpAchievement('signalsReviewed', 2);
    expect(loadAchievementContext().signalsReviewed).toBe(5);
  });

  it('never decreases, so a refresh cannot undo an achievement', () => {
    bumpAchievement('paperTradesClosed', 10);
    bumpAchievement('paperTradesClosed', 1, { absolute: true });
    expect(loadAchievementContext().paperTradesClosed).toBe(10);
  });

  it('ignores zero, negative and non-numeric input', () => {
    bumpAchievement('backtestsRun', 0);
    bumpAchievement('backtestsRun', -5);
    bumpAchievement('backtestsRun', 'abc');
    expect(loadAchievementContext().backtestsRun).toBe(0);
  });
});

describe('recordActiveDay', () => {
  it('counts a day once, not once per visit', () => {
    recordActiveDay(new Date('2026-10-08T08:00:00Z'));
    recordActiveDay(new Date('2026-10-08T20:00:00Z'));
    expect(loadAchievementContext().activeDays).toBe(1);
  });

  it('counts distinct days separately', () => {
    recordActiveDay(new Date('2026-10-08T08:00:00Z'));
    recordActiveDay(new Date('2026-10-09T08:00:00Z'));
    recordActiveDay(new Date('2026-10-10T08:00:00Z'));
    expect(loadAchievementContext().activeDays).toBe(3);
  });

  it('unlocks the active-days achievement only at the target', () => {
    for (let d = 1; d <= 13; d++) {
      recordActiveDay(new Date(Date.UTC(2026, 9, d)));
    }
    expect(isUnlocked(ACHIEVEMENTS_BY_ID.ACTIVE_DAYS, loadAchievementContext())).toBe(false);
    recordActiveDay(new Date(Date.UTC(2026, 9, 14)));
    expect(isUnlocked(ACHIEVEMENTS_BY_ID.ACTIVE_DAYS, loadAchievementContext())).toBe(true);
  });
});
