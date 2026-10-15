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

export const TIER = { GUEST: 'guest', FREE: 'free', PRO: 'pro', LEGEND: 'legend', ADMIN: 'admin' };

/** Every navigable module in the cockpit. */
export const MODULES = {
  HOME: 'HOME',
  SIGNALS: 'SIGNALS',
  NEWS: 'NEWS',
  RESEARCH: 'RESEARCH',
  STOCK: 'STOCK',
  CRYPTO: 'CRYPTO',
  CHANGELOG: 'CHANGELOG',
  // E-12: the sanitised public system map. Same subject as FLOW_PROCESS, no
  // operational detail, so it can live at FREE instead of ADMIN.
  ARCHITECTURE: 'ARCHITECTURE',
  AI_AGENTS: 'AI_AGENTS',
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
  SETTINGS: 'SETTINGS',
  ADMIN_APPROVAL: 'ADMIN_APPROVAL',
  TESTING: 'TESTING',
  PEARSON_CORRELATION: 'PEARSON_CORRELATION',
  ACADEMY: 'ACADEMY',
  ECONOMIC_CALENDAR: 'ECONOMIC_CALENDAR',
  // LEGEND-only: the autonomous trade executor and the Jev execution overlay.
  TRADING_BOT: 'TRADING_BOT',
  JEV_EXECUTION: 'JEV_EXECUTION',
  // The earned-tier path itself. Must be reachable by every signed-in user —
  // it is the roadmap they are working through, so gating it would hide the
  // only explanation of how to reach LEGEND.
  ACHIEVEMENTS: 'ACHIEVEMENTS',
};

/**
 * Minimum tier required per module.
 *
 * GUEST-level modules are the shop window: a visitor with no account can still
 * see the Home page and the heavily delayed Signal desk.
 *
 * FREE-level adds the daily news/riset desk.
 *
 * PRO-level is analytical desks: futures, charting, whale tracker, heatmap,
 * testing lab, pearson correlation, quant academy, economic calendar.
 *
 * ADMIN-only desks: Flow Process and Admin Approval. Changelog (E-1) and
 * Architecture (E-12) sit at FREE: both are readable by any signed-in user
 * because their public copies carry no operational detail.
 */
export const MODULE_TIER = {
  // --- Public: visible without an account (shop window) ---------------------
  [MODULES.HOME]: TIER.GUEST,
  [MODULES.SIGNALS]: TIER.GUEST,
  // Account management must never be locked — a paying customer has to be able
  // to see their own status and expiry.
  [MODULES.SUBSCRIPTION]: TIER.GUEST,
  // Settings must never be locked either — language and appearance are a
  // basic expectation, not a paid feature.
  [MODULES.SETTINGS]: TIER.GUEST,
  // Same reasoning: a user has to be able to see how to progress.
  [MODULES.ACHIEVEMENTS]: TIER.GUEST,
  [MODULES.ADMIN_APPROVAL]: TIER.ADMIN,

  // --- Free account: a little more, still not enough to run a business ------
  [MODULES.NEWS]: TIER.FREE,
  [MODULES.RESEARCH]: TIER.FREE,

  // --- Pro: the desks that actually make money ------------------------------
  [MODULES.STOCK]: TIER.PRO,
  [MODULES.CRYPTO]: TIER.PRO,
  [MODULES.AI_AGENTS]: TIER.PRO,
  [MODULES.FUTURES]: TIER.PRO,
  [MODULES.FOREX]: TIER.PRO,
  [MODULES.US_STOCKS]: TIER.PRO,
  [MODULES.WHALES]: TIER.PRO,
  [MODULES.HEATMAP]: TIER.PRO,
  [MODULES.CHARTING]: TIER.PRO,
  [MODULES.SENTINEL]: TIER.PRO,
  [MODULES.WATCHLIST]: TIER.PRO,
  [MODULES.TESTING]: TIER.PRO,
  [MODULES.PEARSON_CORRELATION]: TIER.PRO,
  [MODULES.ACADEMY]: TIER.PRO,
  [MODULES.ECONOMIC_CALENDAR]: TIER.PRO,

  // --- Legend: the tier that can actually place orders ----------------------
  //
  // Why these two are gated harder than everything else: they are the only
  // features in the product that touch a user's real money. Every other PRO
  // desk is read-only analysis — a wrong chart is an inconvenience. A wrong
  // order is a loss.
  //
  // Owner decision (2026-10-08): reachable only by earning it, not by paying
  // for it. `legendEligible()` in achievements.js enforces the prerequisite.
  [MODULES.TRADING_BOT]: TIER.LEGEND,
  [MODULES.JEV_EXECUTION]: TIER.LEGEND,

  // --- Admin only (Perintah Jendral Arib: Flow Process khusus admin) ---------
  //
  // FLOW_PROCESS stays ADMIN deliberately: it documents the architecture and
  // names cockpit credentials/JWT handling, so it must not be public.
  // CHANGELOG was demoted to FREE (E-1, 2026-10-10) so an ordinary signed-in
  // user can read release history without hunting for an admin account.
  [MODULES.FLOW_PROCESS]: TIER.ADMIN,
  [MODULES.CHANGELOG]: TIER.FREE,
  // ARCHITECTURE is the PUBLIC counterpart of FlowProcessTab (E-12, 2026-10-11):
  // it explains data sources, cadence and known gaps without naming anything
  // internal. FlowProcessTab itself stays ADMIN for exactly that reason.
  [MODULES.ARCHITECTURE]: TIER.FREE,
};

/**
 * Modules a visitor can browse without an account at all.
 * Derived from MODULE_TIER so the two can never drift apart — an earlier
 * version listed these separately and immediately disagreed with itself.
 */
export const PUBLIC_MODULES = Object.keys(MODULE_TIER).filter(
  m => MODULE_TIER[m] === TIER.GUEST,
);

/**
 * Owner accounts that may see admin-only surfaces (P1-7, 2026-10-11).
 *
 * This list used to be written out twice — once in App.jsx for the render gate,
 * once in CmcTopNav.jsx for the menu. A security-relevant list with two copies
 * drifts, and the copy that drifts silently is the one that grants access. There
 * is now one list, imported by both, so the menu and the gate cannot disagree.
 *
 * It is a convenience for the owner's own accounts, NOT the security boundary:
 * server-side admin is granted by functions/api/auth.js only when JWT_SECRET is
 * configured. See P0-0 in "rencana fixing.md".
 */
export const ADMIN_EMAILS = ['naufalarib60@gmail.com', 'ahmfuadi28@gmail.com'];

/**
 * QA wave 4 (2026-10-12) tightened this. The first version was
 * ADMIN_EMAILS.includes(String(email || '').toLowerCase()), which had two holes:
 *
 *   - String() coerced ANY value, so isAdminEmail([...]) or an object whose
 *     toString() returned an address came back true. Only a real string may match.
 *   - no trim, while the server (functions/api/_shared.js) trims the claim. Two
 *     copies of one rule that disagree is exactly what P1-7 set out to remove.
 *
 * Client and server now agree on what an address is.
 */
export const isAdminEmail = (email) =>
  typeof email === 'string' && ADMIN_EMAILS.includes(email.trim().toLowerCase());

/**
 * Tier ordering. LEGEND sits above PRO but below ADMIN.
 *
 * ADMIN stays highest on purpose: an administrator must never be locked out of
 * their own system by a missing achievement.
 */
const RANK = { [TIER.GUEST]: 0, [TIER.FREE]: 1, [TIER.PRO]: 2, [TIER.LEGEND]: 3, [TIER.ADMIN]: 4 };

export function normalizeTier(raw) {
  // Only a real string may name a tier. `String(['pro'])` would coerce to
  // 'pro' and silently grant access, so non-strings are rejected outright
  // rather than stringified.
  if (typeof raw !== 'string') return TIER.GUEST;
  const v = raw.trim().toLowerCase();
  if (v === 'admin') return TIER.ADMIN;
  if (v === 'legend') return TIER.LEGEND;
  if (v === 'pro' || v === 'vip') return TIER.PRO;
  if (v === 'free') return TIER.FREE;
  return TIER.GUEST;
}

export function rankOf(tier) {
  return RANK[normalizeTier(tier)] ?? 0;
}

/**
 * Does this tier unlock this module?
 *
 * ADMIN BYPASS IS ABSOLUTE, AND MUST STAY FIRST.
 *
 * The owner's requirement (2026-10-09): "jangan sampe admin gabisa buka fitur2".
 * An administrator who cannot open a desk cannot support the customers stuck in
 * it, so `isAdmin` short-circuits before ANY other rule below — including the
 * `required === TIER.ADMIN` check further down, which would otherwise look like
 * it applied to admins too.
 *
 * ORDER IS LOAD-BEARING. If a future edit moves the `isAdmin` line below the
 * MODULE_TIER lookup, an unknown module id starts returning false for the owner.
 * `featureAccess.test.js` asserts the ordering so that edit fails loudly.
 */
export function canAccess(moduleId, tier, isAdmin = false) {
  if (isAdmin) return true; // Admin has unrestricted access to all desks and tools
  const required = MODULE_TIER[moduleId];
  // Unknown module: deny rather than assume. A typo must not open a paid desk.
  if (!required) return false;
  if (required === TIER.ADMIN) return false; // Modul internal khusus admin
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
  [TIER.LEGEND]: { signals: 100, delayHours: 0, label: 'Legend', showLevels: true },
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
      'Charting Desk & Whale Tracker',
      'Forex, US Stocks & Crypto Futures',
      'Notifikasi Telegram real-time',
    ],
    cta: 'Mulai Gratis',
  },
  {
    id: TIER.PRO,
    name: 'Pro',
    price: 'Rp 40.000',
    period: 'per minggu',
    tagline: 'Semua alat, sinyal paling cepat.',
    highlight: true,
    features: [
      'Sinyal REAL-TIME (tanpa jeda 24 jam)',
      'Notifikasi langsung ke Telegram',
      'AI Multi-Agent Arena, 16 bot otonom',
      'Charting Desk, Whale Tracker & Heatmap',
      'Forex, US Stocks & Crypto Futures',
      'AI Sentinel Desk (makro & geopolitik)',
      'Sinyal tak terbatas',
    ],
    missing: [],
    cta: 'Berlangganan Pro',
  },
  {
    id: TIER.LEGEND,
    name: 'Legend',
    price: 'Rp 75.000',
    period: 'per minggu',
    tagline: 'Bot yang mengeksekusi. Bukan sekadar menampilkan.',
    // NOT purchasable directly. The CTA opens the achievement path.
    locked: true,
    unlockHint: 'Terbuka setelah semua achievement Pro terpenuhi.',
    features: [
      'Trading Bot Otonom, eksekusi order otomatis',
      'Jev Execution HUD (TWAP / VWAP / POV)',
      'Semua fitur Pro tetap terbuka',
      'Prioritas bantuan & konsultasi',
    ],
    missing: [],
    cta: 'Lihat Achievement',
  },
];

/**
 * Weekly pricing note.
 *
 * Owner decision (2026-10-08): PRO and LEGEND bill per week, not per month.
 * The monthly-equivalent figures below exist so the pricing page can show a
 * comparison without the reader doing arithmetic — they are derived, never
 * stored, so they cannot drift from the weekly price.
 */
export const WEEKS_PER_MONTH = 4.345;
export function monthlyEquivalent(weeklyPriceIdr) {
  const n = Number(weeklyPriceIdr);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round((n * WEEKS_PER_MONTH) / 1000) * 1000;
}
