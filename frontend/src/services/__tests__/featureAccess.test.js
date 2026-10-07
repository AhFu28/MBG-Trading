import { describe, it, expect } from 'vitest';
import {
  TIER,
  MODULES,
  MODULE_TIER,
  PUBLIC_MODULES,
  normalizeTier,
  canAccess,
  allowedModules,
  lockedModules,
  limitsFor,
  requiredTierFor,
  rankOf,
  PLANS,
} from '../featureAccess.js';

describe('normalizeTier', () => {
  it('maps vip to pro so an old session keeps full access', () => {
    expect(normalizeTier('VIP')).toBe(TIER.PRO);
    expect(normalizeTier('pro')).toBe(TIER.PRO);
  });

  it('treats anything unknown as guest, never as paid', () => {
    for (const junk of [undefined, null, '', 'admin', 'root', 'premium', 'vip2']) {
      expect(normalizeTier(junk)).not.toBe(TIER.PRO);
    }
    expect(normalizeTier(undefined)).toBe(TIER.GUEST);
  });

  it('rejects non-strings outright rather than coercing them', () => {
    // `String(['pro'])` is 'pro' — coercing would hand out Pro access.
    for (const junk of [['pro'], 1, true, {}, [], { tier: 'pro' }]) {
      expect(normalizeTier(junk)).toBe(TIER.GUEST);
    }
  });

  it('accepts ordinary formatting of a real tier string', () => {
    for (const ok of ['pro', 'PRO', 'Pro', ' pro ', 'vip', 'VIP']) {
      expect(normalizeTier(ok)).toBe(TIER.PRO);
    }
    expect(normalizeTier(' free ')).toBe(TIER.FREE);
  });

  it('ranks tiers in the expected order', () => {
    expect(rankOf(TIER.GUEST)).toBeLessThan(rankOf(TIER.FREE));
    expect(rankOf(TIER.FREE)).toBeLessThan(rankOf(TIER.PRO));
  });
});

describe('free tier is deliberately limited', () => {
  const freeModules = allowedModules(TIER.FREE);

  it('gives free a small set, not the whole cockpit', () => {
    const total = Object.keys(MODULE_TIER).length;
    // The owner asked for "free dikit banget" — if this ever grows past a
    // third of the app, the paid tier stops being worth buying.
    expect(freeModules.length).toBeLessThanOrEqual(Math.floor(total / 3));
  });

  it('keeps free to the intended modules only', () => {
    // SUBSCRIPTION is included on purpose: a paying customer must always be able
    // to see their own status and expiry.
    expect(new Set(freeModules)).toEqual(
      new Set([MODULES.HOME, MODULES.SIGNALS, MODULES.NEWS, MODULES.SUBSCRIPTION]),
    );
  });

  it('never locks the account page, even for a guest', () => {
    // Locking this would strand a lapsed customer with no way to renew.
    expect(canAccess(MODULES.SUBSCRIPTION, TIER.GUEST)).toBe(true);
    expect(canAccess(MODULES.SUBSCRIPTION, TIER.FREE)).toBe(true);
    expect(canAccess(MODULES.SUBSCRIPTION, TIER.PRO)).toBe(true);
  });

  it('locks every money-making desk behind Pro', () => {
    for (const m of [
      MODULES.AI_AGENTS, MODULES.RADAR, MODULES.DEGEN, MODULES.CHARTING,
      MODULES.WHALES, MODULES.FOREX, MODULES.US_STOCKS, MODULES.FUTURES,
      MODULES.SENTINEL, MODULES.STOCK, MODULES.CRYPTO,
    ]) {
      expect(canAccess(m, TIER.FREE)).toBe(false);
      expect(canAccess(m, TIER.PRO)).toBe(true);
    }
  });

  it('shows free that most of the app is locked', () => {
    expect(lockedModules(TIER.FREE).length).toBeGreaterThan(freeModules.length);
  });
});

describe('guest', () => {
  it('can browse only the public pages', () => {
    for (const m of PUBLIC_MODULES) {
      expect(canAccess(m, TIER.GUEST)).toBe(true);
    }
  });

  it('cannot open analytical desks', () => {
    for (const m of [MODULES.STOCK, MODULES.AI_AGENTS, MODULES.RADAR, MODULES.CHARTING]) {
      expect(canAccess(m, TIER.GUEST)).toBe(false);
    }
  });

  it('gets fewer signals than free, and more delay', () => {
    expect(limitsFor(TIER.GUEST).signals).toBeLessThan(limitsFor(TIER.FREE).signals);
    expect(limitsFor(TIER.GUEST).delayHours).toBeGreaterThan(limitsFor(TIER.FREE).delayHours);
  });

  it('never sees precise levels', () => {
    expect(limitsFor(TIER.GUEST).showLevels).toBe(false);
  });
});

describe('pro', () => {
  it('unlocks every analytical trading desk', () => {
    for (const m of [
      MODULES.STOCK, MODULES.CRYPTO, MODULES.AI_AGENTS, MODULES.FUTURES,
      MODULES.FOREX, MODULES.US_STOCKS, MODULES.WHALES, MODULES.HEATMAP,
      MODULES.CHARTING, MODULES.SENTINEL, MODULES.WATCHLIST, MODULES.TESTING,
      MODULES.PEARSON_CORRELATION, MODULES.ACADEMY, MODULES.ECONOMIC_CALENDAR,
    ]) {
      expect(canAccess(m, TIER.PRO)).toBe(true);
    }
  });

  it('keeps internal admin-only modules locked for regular pro users', () => {
    expect(canAccess(MODULES.FLOW_PROCESS, TIER.PRO)).toBe(false);
    expect(canAccess(MODULES.CHANGELOG, TIER.PRO)).toBe(false);
    expect(canAccess(MODULES.ADMIN_APPROVAL, TIER.PRO)).toBe(false);
  });

  it('unlocks everything when admin flag is active', () => {
    for (const m of Object.keys(MODULE_TIER)) {
      expect(canAccess(m, TIER.PRO, true)).toBe(true);
    }
  });

  it('has no delay and no signal cap worth mentioning', () => {
    expect(limitsFor(TIER.PRO).delayHours).toBe(0);
    expect(limitsFor(TIER.PRO).signals).toBeGreaterThan(50);
    expect(limitsFor(TIER.PRO).showLevels).toBe(true);
  });
});

describe('safety of the gate itself', () => {
  it('denies unknown modules instead of assuming access', () => {
    // A typo in a module id must never open a paid desk.
    expect(canAccess('NOT_A_REAL_MODULE', TIER.PRO)).toBe(false);
    expect(canAccess('', TIER.PRO)).toBe(false);
    expect(canAccess(undefined, TIER.PRO)).toBe(false);
  });

  it('reports the required tier for locked modules', () => {
    expect(requiredTierFor(MODULES.AI_AGENTS)).toBe(TIER.PRO);
    expect(requiredTierFor(MODULES.NEWS)).toBe(TIER.FREE);
    expect(requiredTierFor(MODULES.HOME)).toBe(TIER.GUEST);
    expect(requiredTierFor('UNKNOWN')).toBe(TIER.PRO);
  });

  it('never marks a module free by accident', () => {
    for (const [moduleId, tier] of Object.entries(MODULE_TIER)) {
      expect([TIER.GUEST, TIER.FREE, TIER.PRO, TIER.ADMIN]).toContain(tier);
      if (tier === TIER.ADMIN) {
        expect(canAccess(moduleId, TIER.FREE)).toBe(false);
        expect(canAccess(moduleId, TIER.PRO)).toBe(false);
        expect(canAccess(moduleId, TIER.PRO, true)).toBe(true);
      }
      if (tier === TIER.PRO) {
        expect(canAccess(moduleId, TIER.FREE)).toBe(false);
        expect(canAccess(moduleId, TIER.GUEST)).toBe(false);
      }
      if (tier === TIER.FREE) {
        expect(canAccess(moduleId, TIER.GUEST)).toBe(false);
      }
    }
  });

  it('keeps PUBLIC_MODULES derived from the tier map, never a separate list', () => {
    // These drifted apart once already and the guest menu disagreed with itself.
    expect(PUBLIC_MODULES).toEqual(
      Object.keys(MODULE_TIER).filter(m => MODULE_TIER[m] === TIER.GUEST),
    );
    for (const m of PUBLIC_MODULES) {
      expect(canAccess(m, TIER.GUEST)).toBe(true);
      expect(canAccess(m, TIER.PRO)).toBe(true);
    }
  });

  it('is not defeated by a crafted tier string', () => {
    // These are not tier names — they must never resolve to Pro.
    for (const attack of ['pro,free', 'pro;', '{"tier":"pro"}', 'pro|pro', 'proor', 'p r o', '<pro>']) {
      expect(canAccess(MODULES.AI_AGENTS, attack)).toBe(false);
    }
  });

  it('is not defeated by a non-string tier', () => {
    for (const attack of [['pro'], { toString: () => 'pro' }, 1, true]) {
      expect(canAccess(MODULES.AI_AGENTS, attack)).toBe(false);
    }
  });
});

describe('plans shown to customers', () => {
  it('has exactly two plans with matching ids', () => {
    expect(PLANS.map(p => p.id)).toEqual([TIER.FREE, TIER.PRO]);
  });

  it('marks exactly one plan as the highlight', () => {
    expect(PLANS.filter(p => p.highlight)).toHaveLength(1);
    expect(PLANS.find(p => p.highlight).id).toBe(TIER.PRO);
  });

  it('lists what the paid plan adds, and what free is missing', () => {
    const pro = PLANS.find(p => p.id === TIER.PRO);
    const free = PLANS.find(p => p.id === TIER.FREE);
    expect(pro.features.length).toBeGreaterThan(free.features.length);
    expect(free.missing.length).toBeGreaterThan(0);
    expect(pro.missing).toHaveLength(0);
  });

  it('promises real-time only on the paid plan', () => {
    const free = PLANS.find(p => p.id === TIER.FREE);
    const pro = PLANS.find(p => p.id === TIER.PRO);
    const mentionsRealtime = (p) => p.features.some(f => /real-time/i.test(f));
    expect(mentionsRealtime(pro)).toBe(true);
    expect(mentionsRealtime(free)).toBe(false);
    // Free must state its delay so nobody thinks it is instant.
    expect(free.features.some(f => /tertunda/i.test(f))).toBe(true);
  });

  it('is honest that the free tier is delayed, not merely limited', () => {
    const guestDelay = limitsFor(TIER.GUEST).delayHours;
    const freeDelay = limitsFor(TIER.FREE).delayHours;
    expect(freeDelay).toBeGreaterThan(0);
    expect(guestDelay).toBeGreaterThan(freeDelay);
  });
});
