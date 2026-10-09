import { describe, it, expect } from 'vitest';
import {
  TIERS,
  TIER_DELAY_HOURS,
  normalizeTier,
  featuresFor,
  visibleAt,
  isVisible,
  hoursUntilVisible,
  buildTierView,
  maskPlanForTier,
} from '../signalTiers.js';

/** Build a plan observed `hoursAgo` hours before the fixed test clock. */
const NOW = new Date('2026-10-05T12:00:00Z');

function planAged(hoursAgo, overrides = {}) {
  const observed = new Date(NOW.getTime() - hoursAgo * 3600 * 1000);
  return {
    plan_id: `PLAN-${hoursAgo}`,
    clean_ticker: 'BBCA',
    market: 'IDX',
    direction: 'LONG',
    entry_price: 9850,
    stop_loss: 9600,
    target_1: 10450,
    target_2: 11000,
    risk_reward_ratio: 2.4,
    observed_at: observed.toISOString(),
    source: 'IDXMarketFetcher',
    opinion_thesis: 'Breakout dengan konfirmasi asing.',
    three_invalidations: ['1. Tutup di bawah SL'],
    ...overrides,
  };
}

describe('normalizeTier', () => {
  it('maps the server value PRO to VIP', () => {
    expect(normalizeTier('PRO')).toBe(TIERS.VIP);
    expect(normalizeTier('VIP')).toBe(TIERS.VIP);
    expect(normalizeTier('LEGEND')).toBe(TIERS.VIP);
  });

  it('treats unknown or missing values as the lowest tier, never as paid', () => {
    expect(normalizeTier(undefined)).toBe(TIERS.GUEST);
    expect(normalizeTier('')).toBe(TIERS.GUEST);
    expect(normalizeTier('ADMIN')).toBe(TIERS.GUEST);
    expect(normalizeTier('null')).toBe(TIERS.GUEST);
  });
});

describe('tier delays', () => {
  it('gives VIP no delay and everyone else a real wait', () => {
    expect(TIER_DELAY_HOURS[TIERS.VIP]).toBe(0);
    expect(TIER_DELAY_HOURS[TIERS.FREE]).toBeGreaterThan(0);
    expect(TIER_DELAY_HOURS[TIERS.GUEST]).toBeGreaterThan(TIER_DELAY_HOURS[TIERS.FREE]);
  });

  it('keeps the free tier useful as a shop window (not zero, not absurd)', () => {
    // Too long and nobody sees anything; too short and VIP has no advantage.
    expect(TIER_DELAY_HOURS[TIERS.FREE]).toBeGreaterThanOrEqual(6);
    expect(TIER_DELAY_HOURS[TIERS.FREE]).toBeLessThanOrEqual(72);
  });
});

describe('visibility by age', () => {
  it('shows a brand-new plan to VIP immediately', () => {
    expect(isVisible(planAged(0), TIERS.VIP, NOW)).toBe(true);
  });

  it('hides a brand-new plan from FREE and GUEST', () => {
    expect(isVisible(planAged(0), TIERS.FREE, NOW)).toBe(false);
    expect(isVisible(planAged(0), TIERS.GUEST, NOW)).toBe(false);
  });

  it('shows a 25-hour-old plan to FREE but not GUEST', () => {
    expect(isVisible(planAged(25), TIERS.FREE, NOW)).toBe(true);
    expect(isVisible(planAged(25), TIERS.GUEST, NOW)).toBe(false);
  });

  it('shows a 50-hour-old plan to everyone', () => {
    for (const tier of Object.values(TIERS)) {
      expect(isVisible(planAged(50), tier, NOW)).toBe(true);
    }
  });

  it('withholds a plan with no readable timestamp from every tier except VIP', () => {
    const broken = planAged(0, { observed_at: undefined, created_at: undefined });
    expect(visibleAt(broken, TIERS.FREE)).toBeNull();
    expect(isVisible(broken, TIERS.FREE, NOW)).toBe(false);
    // VIP has zero delay, but an unprovable timestamp is still treated as hidden
    // so the delayed tiers can never be tricked into an early reveal.
    expect(isVisible(broken, TIERS.VIP, NOW)).toBe(false);
  });

  it('counts down remaining hours correctly', () => {
    expect(hoursUntilVisible(planAged(0), TIERS.VIP, NOW)).toBe(0);
    expect(hoursUntilVisible(planAged(0), TIERS.FREE, NOW)).toBe(24);
    expect(hoursUntilVisible(planAged(20), TIERS.FREE, NOW)).toBe(4);
    expect(hoursUntilVisible(planAged(30), TIERS.FREE, NOW)).toBe(0);
  });
});

describe('buildTierView', () => {
  const plans = [planAged(0), planAged(10), planAged(30), planAged(60)];

  it('gives VIP everything immediately', () => {
    const view = buildTierView(plans, TIERS.VIP, NOW);
    expect(view.totalVisible).toBe(4);
    expect(view.totalLocked).toBe(0);
  });

  it('gives FREE the 30h and 60h plans only', () => {
    const view = buildTierView(plans, TIERS.FREE, NOW);
    expect(view.totalVisible).toBe(2);
    expect(view.totalLocked).toBe(2);
  });

  it('gives GUEST only the 60h plan', () => {
    const view = buildTierView(plans, TIERS.GUEST, NOW);
    expect(view.totalVisible).toBe(1);
    expect(view.totalLocked).toBe(3);
  });

  it('reports locked plans so the UI can advertise what VIP unlocks', () => {
    const view = buildTierView(plans, TIERS.FREE, NOW);
    expect(view.locked.length).toBeGreaterThan(0);
    expect(view.locked.every(l => l.hoursUntil > 0)).toBe(true);
  });

  it('returns newest first inside the visible list', () => {
    const view = buildTierView(plans, TIERS.VIP, NOW);
    const times = view.visible.map(p => new Date(p.observed_at).getTime());
    const sorted = [...times].sort((a, b) => b - a);
    expect(times).toEqual(sorted);
  });

  it('caps GUEST to fewer plans than VIP', () => {
    const many = Array.from({ length: 20 }, (_, i) => planAged(100 + i));
    expect(buildTierView(many, TIERS.GUEST, NOW).visible.length)
      .toBeLessThan(buildTierView(many, TIERS.VIP, NOW).visible.length);
  });

  it('survives junk input without throwing', () => {
    expect(() => buildTierView(null, TIERS.FREE, NOW)).not.toThrow();
    expect(buildTierView([null, 'x', 42], TIERS.FREE, NOW).totalVisible).toBe(0);
  });
});

describe('maskPlanForTier', () => {
  it('hides precise levels from GUEST', () => {
    const masked = maskPlanForTier(planAged(60), TIERS.GUEST);
    expect(masked.entry_price).toBeNull();
    expect(masked.stop_loss).toBeNull();
    expect(masked.target_1).toBeNull();
    expect(masked.masked).toBe(true);
  });

  it('never reveals a level as numeric zero when it is withheld', () => {
    // Null is not zero (master plan §7.2): a fabricated 0 would show "Rp 0".
    const masked = maskPlanForTier(planAged(60), TIERS.GUEST);
    expect(masked.entry_price).not.toBe(0);
    expect(masked.stop_loss).not.toBe(0);
  });

  it('still shows the ticker and direction so GUEST sees a real shop window', () => {
    const masked = maskPlanForTier(planAged(60), TIERS.GUEST);
    expect(masked.clean_ticker).toBe('BBCA');
    expect(masked.direction).toBe('LONG');
  });

  it('gives FREE the levels but not the full rationale', () => {
    const free = maskPlanForTier(planAged(60), TIERS.FREE);
    expect(free.entry_price).toBe(9850);
    expect(free.opinion_thesis).toBeNull();
    expect(free.masked).toBe(false);
  });

  it('gives VIP the levels and the rationale', () => {
    const vip = maskPlanForTier(planAged(60), TIERS.VIP);
    expect(vip.entry_price).toBe(9850);
    expect(vip.opinion_thesis).toBeTruthy();
    expect(vip.three_invalidations).toBeTruthy();
  });

  it('preserves a genuinely missing level as null rather than inventing one', () => {
    const noTarget = maskPlanForTier(planAged(60, { target_2: null }), TIERS.VIP);
    expect(noTarget.target_2).toBeNull();
  });
});

describe('featuresFor', () => {
  it('gates Telegram on VIP only', () => {
    expect(featuresFor(TIERS.VIP).showTelegram).toBe(true);
    expect(featuresFor(TIERS.FREE).showTelegram).toBe(false);
    expect(featuresFor('unknown-tier').showTelegram).toBe(false);
  });

  it('always describes what the tier gets, including the delay', () => {
    for (const tier of Object.values(TIERS)) {
      expect(featuresFor(tier).note).toBeTruthy();
      expect(typeof featuresFor(tier).delayHours).toBe('number');
    }
  });
});
