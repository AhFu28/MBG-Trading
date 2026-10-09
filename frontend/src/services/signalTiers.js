/**
 * Tier-based signal delivery model.
 *
 * THE BUSINESS IDEA (owner decision, 2026-10-05):
 * Everyone can SEE signals on the website; paying members get them FASTER and
 * are notified on their phone. Fast information is the thing being sold — the
 * signal itself is not hidden, the head start is.
 *
 * WHY THIS SHAPE:
 * Hiding signals entirely makes the free tier worthless as a shop window.
 * Delaying them costs nothing to build, creates a real reason to upgrade, and
 * is honest: we are selling speed, not secrets.
 *
 * IMPORTANT: this module only decides what the UI *shows*. It is not access
 * control. Server-side entitlement is the boundary that actually matters
 * (see functions/api/, TRUST03). A curious user editing JavaScript can defeat
 * anything in this file — that is acceptable for a delay, NOT for secrets.
 */

export const TIERS = {
  GUEST: 'GUEST',
  FREE: 'FREE',
  VIP: 'VIP',
};

/**
 * How long each tier waits before a plan becomes visible.
 * VIP sees it immediately; FREE waits; GUEST waits longer.
 */
export const TIER_DELAY_HOURS = {
  [TIERS.VIP]: 0,
  [TIERS.FREE]: 24,
  [TIERS.GUEST]: 48,
};

/** Which levels/fields each tier is allowed to see at all. */
export const TIER_FEATURES = {
  [TIERS.GUEST]: {
    label: 'Tamu',
    icon: '👤',
    delayHours: TIER_DELAY_HOURS[TIERS.GUEST],
    showExactLevels: false,
    showRationale: false,
    showTelegram: false,
    maxPlans: 3,
    note: 'Melihat sinyal tertunda 48 jam, tanpa level presisi.',
  },
  [TIERS.FREE]: {
    label: 'Free Member',
    icon: '⭐',
    delayHours: TIER_DELAY_HOURS[TIERS.FREE],
    showExactLevels: true,
    showRationale: false,
    showTelegram: false,
    maxPlans: 6,
    note: 'Level presisi terbuka, tertunda 24 jam. Tanpa notifikasi.',
  },
  [TIERS.VIP]: {
    label: 'VIP Pro',
    icon: '👑',
    delayHours: 0,
    showExactLevels: true,
    showRationale: true,
    showTelegram: true,
    maxPlans: 100,
    note: 'Real-time + notifikasi Telegram + alasan lengkap.',
  },
};

/** Normalise whatever the server sends into a known tier. */
export function normalizeTier(raw) {
  const value = String(raw || '').toUpperCase();
  if (value === 'VIP' || value === 'PRO' || value === 'LEGEND') return TIERS.VIP;
  if (value === 'FREE') return TIERS.FREE;
  return TIERS.GUEST;
}

export function featuresFor(tier) {
  return TIER_FEATURES[normalizeTier(tier)] || TIER_FEATURES[TIERS.GUEST];
}

/**
 * When does this plan become visible to this tier?
 * Returns a Date, or null when the plan has no readable timestamp.
 */
export function visibleAt(plan, tier) {
  const features = featuresFor(tier);
  const raw = plan?.observed_at || plan?.created_at;
  if (!raw) return null;
  const text = String(raw).trim().replace('Z', '+00:00');
  const published = new Date(text);
  if (Number.isNaN(published.getTime())) return null;
  return new Date(published.getTime() + features.delayHours * 3600 * 1000);
}

/** Is this plan visible to this tier right now? */
export function isVisible(plan, tier, now = new Date()) {
  const at = visibleAt(plan, tier);
  if (!at) return false;
  return now.getTime() >= at.getTime();
}

/** Hours remaining before this tier may see the plan (0 when already visible). */
export function hoursUntilVisible(plan, tier, now = new Date()) {
  const at = visibleAt(plan, tier);
  if (!at) return null;
  const diff = (at.getTime() - now.getTime()) / 3600000;
  return diff <= 0 ? 0 : Math.ceil(diff);
}

/**
 * Build the list this tier may actually see, newest first.
 *
 * Returns both the visible rows and the locked ones, so the UI can show
 * "3 sinyal lagi menunggu" instead of silently hiding that VIP exists.
 */
export function buildTierView(plans, tier, now = new Date()) {
  const features = featuresFor(tier);
  const visible = [];
  const locked = [];

  for (const plan of plans || []) {
    if (!plan || typeof plan !== 'object') continue;
    const at = visibleAt(plan, tier);
    // A plan with no readable timestamp is withheld — we cannot prove it is old
    // enough to be safe for a delayed tier, and guessing would leak freshness.
    if (!at) {
      locked.push({ plan, reason: 'no timestamp', hoursUntil: null });
      continue;
    }
    if (now.getTime() >= at.getTime()) {
      visible.push(plan);
    } else {
      locked.push({
        plan,
        reason: 'delay',
        hoursUntil: Math.ceil((at.getTime() - now.getTime()) / 3600000),
      });
    }
  }

  const byNewest = (a, b) => {
    const ta = new Date(String(a.observed_at || a.created_at || 0).replace('Z', '+00:00')).getTime();
    const tb = new Date(String(b.observed_at || b.created_at || 0).replace('Z', '+00:00')).getTime();
    return tb - ta;
  };

  return {
    visible: visible.sort(byNewest).slice(0, features.maxPlans),
    locked: locked.sort((a, b) => byNewest(a.plan, b.plan)),
    totalVisible: visible.length,
    totalLocked: locked.length,
    features,
  };
}

/**
 * Mask precise levels for a tier that is not allowed to see them.
 * Null is NOT zero (master plan §7.2) — a missing level renders as null so the
 * UI shows "—" rather than a fabricated 0.
 */
export function maskPlanForTier(plan, tier) {
  const features = featuresFor(tier);
  const base = {
    clean_ticker: plan.clean_ticker || plan.symbol || '?',
    market: plan.market || '',
    direction: plan.direction || plan.action || '',
    observed_at: plan.observed_at || plan.created_at || null,
    source: plan.source || null,
    technical_signal: plan.technical_signal || null,
  };

  if (!features.showExactLevels) {
    return {
      ...base,
      entry_price: null,
      stop_loss: null,
      target_1: null,
      target_2: null,
      risk_reward_ratio: null,
      masked: true,
    };
  }

  return {
    ...base,
    entry_price: plan.entry_price ?? null,
    stop_loss: plan.stop_loss ?? null,
    target_1: plan.target_1 ?? null,
    target_2: plan.target_2 ?? null,
    risk_reward_ratio: plan.risk_reward_ratio ?? null,
    facts_summary: plan.facts_summary || null,
    opinion_thesis: features.showRationale ? (plan.opinion_thesis || plan.thesis || null) : null,
    three_invalidations: features.showRationale ? (plan.three_invalidations || null) : null,
    masked: false,
  };
}
