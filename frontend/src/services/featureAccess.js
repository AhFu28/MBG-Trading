/**
 * Which features each tier may use.
 *
 * OWNER'S INTENT (2026-10-05):
 * "fitur free dikit banget, harus subscribe pro biar muncul fitur-fiturnya."
 * Free must be genuinely limited — enough to prove the product works, not
 * enough to run a business on. Pro unlocks the desks that actually make money.
 *
 * WHY A SINGLE MAP:
 * Scattering `tier === 'pro'` checks across components guarantees that one
 * forgotten check leaks a paid feature. Every gate reads from here, and a test
 * asserts the free tier stays small.
 *
 * SECURITY HONESTY (same note as signalTiers.js):
 * This decides what the UI RENDERS. It is not the security boundary. Anyone who
 * edits JavaScript can reveal a hidden tab — but the data behind it still comes
 * from server endpoints that check entitlement themselves. Gating here is for
 * clarity and honesty, not protection. Never put a secret behind a client gate.
 */

export const TIER = { GUEST: 'guest', FREE: 'free', PRO: 'pro' };

/** Every navigable module in the cockpit. */
export const MODULES = {
  HOME: 'HOME',
  SIGNALS: 'SIGNALS',
  NEWS: 'NEWS',
  STOCK: 'STOCK',
  CRYPTO: 'CRYPTO',
  CHANGELOG: 'CHANGELOG',
  AI_AGENTS: 'AI_AGENTS',
  RADAR: 'RADAR',
  DEGEN: 'DEGEN',
  FUTURES: 'FUTURES',
  FOREX: 'FOREX',
  US_STOCKS: 'US_STOCKS',
  WHALES: 'WHALES',
  HEATMAP: 'HEATMAP',
  CHARTING: 'CHARTING',
  SENTINEL: 'SENTINEL',
  FLOW_PROCESS: 'FLOW_PROCESS',
  WATCHLIST: 'WATCHLIST',
  SUBSCRIPTION: 'SUBSCRIPTION',
  ADMIN_APPROVAL: 'ADMIN_APPROVAL',
};

/**
 * Minimum tier required per module.
 *
 * GUEST-level modules are the shop window: a visitor with no account can still
 * see the Home page, the heavily delayed Signal desk and the changelog. That is
 * deliberate — a locked door with no window sells nothing.
 *
 * FREE-level adds the daily news/riset desk.
 *
 * PRO-level is everything analytical: the arena, the radars, charting, whale
 * flow, forex, US equities and futures.
 */
export const MODULE_TIER = {
  // --- Public: visible without an account (shop window) ---------------------
  [MODULES.HOME]: TIER.GUEST,
  [MODULES.SIGNALS]: TIER.GUEST,
  [MODULES.CHANGELOG]: TIER.GUEST,
  // Account management must never be locked — a paying customer has to be able
  // to see their own status and expiry.
  [MODULES.SUBSCRIPTION]: TIER.GUEST,
  [MODULES.ADMIN_APPROVAL]: TIER.PRO,

  // --- Free account: a little more, still not enough to run a business ------
  [MODULES.NEWS]: TIER.FREE,

  // --- Pro: the desks that actually make money ------------------------------
  [MODULES.STOCK]: TIER.PRO,
  [MODULES.CRYPTO]: TIER.PRO,
  [MODULES.AI_AGENTS]: TIER.PRO,
  [MODULES.RADAR]: TIER.PRO,
  [MODULES.DEGEN]: TIER.PRO,
  [MODULES.FUTURES]: TIER.PRO,
  [MODULES.FOREX]: TIER.PRO,
  [MODULES.US_STOCKS]: TIER.PRO,
  [MODULES.WHALES]: TIER.PRO,
  [MODULES.HEATMAP]: TIER.PRO,
  [MODULES.CHARTING]: TIER.PRO,
  [MODULES.SENTINEL]: TIER.PRO,
  [MODULES.WATCHLIST]: TIER.PRO,
  [MODULES.FLOW_PROCESS]: TIER.PRO,
};

/**
 * Modules a visitor can browse without an account at all.
 * Derived from MODULE_TIER so the two can never drift apart — an earlier
 * version listed these separately and immediately disagreed with itself.
 */
export const PUBLIC_MODULES = Object.keys(MODULE_TIER).filter(
  m => MODULE_TIER[m] === TIER.GUEST,
);

const RANK = { [TIER.GUEST]: 0, [TIER.FREE]: 1, [TIER.PRO]: 2 };

export function normalizeTier(raw) {
  // Only a real string may name a tier. `String(['pro'])` would coerce to
  // 'pro' and silently grant access, so non-strings are rejected outright
  // rather than stringified.
  if (typeof raw !== 'string') return TIER.GUEST;
  const v = raw.trim().toLowerCase();
  if (v === 'pro' || v === 'vip') return TIER.PRO;
  if (v === 'free') return TIER.FREE;
  return TIER.GUEST;
}

export function rankOf(tier) {
  return RANK[normalizeTier(tier)] ?? 0;
}

/** Does this tier unlock this module? */
export function canAccess(moduleId, tier) {
  const required = MODULE_TIER[moduleId];
  // Unknown module: deny rather than assume. A typo must not open a paid desk.
  if (!required) return false;
  return rankOf(tier) >= rankOf(required);
}

export function requiredTierFor(moduleId) {
  return MODULE_TIER[moduleId] || TIER.PRO;
}
/** The modules this tier can open, in navigation order. */
export function allowedModules(tier) {
  return Object.keys(MODULE_TIER).filter(m => canAccess(m, tier));
}

/** The modules this tier CANNOT open — used to show a locked menu. */
export function lockedModules(tier) {
  return Object.keys(MODULE_TIER).filter(m => !canAccess(m, tier));
}

/**
 * How many signals this tier may read, and how stale they are.
 * Mirrors signalTiers.js on purpose: one place for the commercial promise.
 */
export const TIER_LIMITS = {
  [TIER.GUEST]: { signals: 3, delayHours: 48, label: 'Tamu', showLevels: false },
  [TIER.FREE]: { signals: 6, delayHours: 24, label: 'Free', showLevels: true },
  [TIER.PRO]: { signals: 100, delayHours: 0, label: 'Pro', showLevels: true },
};

export function limitsFor(tier) {
  return TIER_LIMITS[normalizeTier(tier)] || TIER_LIMITS[TIER.GUEST];
}

/** Human-readable plan summary, used on the pricing page and the upgrade banner. */
export const PLANS = [
  {
    id: TIER.FREE,
    name: 'Free',
    price: 'Rp 0',
    period: 'selamanya',
    tagline: 'Cukup untuk melihat cara kerjanya.',
    features: [
      'Sinyal trading (tertunda 24 jam)',
      'Level Entry / Stop Loss / Target',
      'Berita & riset pasar harian',
      'Maksimal 6 sinyal per hari',
    ],
    missing: [
      'AI Multi-Agent Arena (16 bot)',
      'Early Signal Radar memecoin',
      'Charting Desk & Whale Tracker',
      'Forex, US Stocks & Crypto Futures',
      'Notifikasi Telegram real-time',
    ],
    cta: 'Mulai Gratis',
  },
  {
    id: TIER.PRO,
    name: 'Pro',
    price: 'Rp 149.000',
    period: 'per bulan',
    tagline: 'Semua alat, sinyal paling cepat.',
    highlight: true,
    features: [
      'Sinyal REAL-TIME (tanpa jeda 24 jam)',
      'Notifikasi langsung ke Telegram',
      'AI Multi-Agent Arena — 16 bot otonom',
      'Early Signal Radar memecoin',
      'Charting Desk, Whale Tracker & Heatmap',
      'Forex, US Stocks & Crypto Futures',
      'AI Sentinel Desk (makro & geopolitik)',
      'Sinyal tak terbatas',
    ],
    missing: [],
    cta: 'Berlangganan Pro',
  },
];
