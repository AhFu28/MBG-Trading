/**
 * Achievements — the path from PRO to LEGEND.
 *
 * OWNER'S DESIGN (2026-10-08):
 *   "sudah masuk level tertentu, baru bisa upgrade... jadi nanti level pro ada
 *    level nya... seperti game solo leveling.. bisa gak ???"
 *   "aktivitas dan achievement"
 *
 * So LEGEND is not sold. It is EARNED. A Pro subscriber who never uses the
 * terminal stays Pro; one who does the work unlocks the tier that can execute
 * orders with real money.
 *
 * WHY EARN IT AT ALL — this is not gamification for its own sake:
 * LEGEND is the only tier that touches a user's funds. A user who has not yet
 * demonstrated they can read a chart, place a manual order, and manage a stop
 * is a bad candidate for automation. The achievements encode exactly those
 * prerequisites, so the gate is a risk control that happens to look like a game.
 *
 * HONESTY RULES, inherited from the rest of this codebase:
 *  - Progress is computed from what the user has ACTUALLY done, never granted.
 *  - A counter with no data reads 0, not a flattering default.
 *  - Nothing here decides entitlement. The server does. This module computes
 *    DISPLAY state and the client-side request; `legendEligible` is the single
 *    predicate the upgrade flow consults, and the server re-checks it.
 */

import { TIER, rankOf } from './featureAccess.js';

export const ACHIEVEMENT_CATEGORY = {
  ACTIVITY: 'aktivitas',      // how much they actually use the terminal
  SKILL: 'kemampuan',         // demonstrated understanding
  MILESTONE: 'pencapaian',    // one-off accomplishments
};

/**
 * Every achievement.
 *
 * `progress(ctx)` returns the user's current value; `target` is the goal. Both
 * are numbers so the UI can render a bar without special-casing.
 *
 * `ctx` is assembled by buildAchievementContext() from real app state. Keep
 * every requirement measurable from data the app already holds — an
 * achievement nobody can verify is worse than no achievement.
 */
export const ACHIEVEMENTS = [
  // --- ACTIVITY: are they actually here? -----------------------------------
  {
    id: 'ACTIVE_DAYS',
    name: 'Rajin Buka Terminal',
    desc: 'Buka terminal ini selama 14 hari berbeda.',
    category: ACHIEVEMENT_CATEGORY.ACTIVITY,
    icon: '📅',
    target: 14,
    progress: ctx => ctx.activeDays,
    unit: 'hari',
  },
  {
    id: 'SIGNAL_REVIEWS',
    name: 'Pembaca Sinyal',
    desc: 'Buka detail 50 sinyal trading.',
    category: ACHIEVEMENT_CATEGORY.ACTIVITY,
    icon: '📡',
    target: 50,
    progress: ctx => ctx.signalsReviewed,
    unit: 'sinyal',
  },
  {
    id: 'CHART_SESSIONS',
    name: 'Mata Chart',
    desc: 'Analisa chart selama total 10 jam.',
    category: ACHIEVEMENT_CATEGORY.ACTIVITY,
    icon: '📈',
    target: 10,
    progress: ctx => ctx.chartHours,
    unit: 'jam',
  },

  // --- SKILL: can they actually drive? --------------------------------------
  {
    id: 'PAPER_TRADES',
    name: 'Latihan Serius',
    desc: 'Tutup 25 posisi di paper broker.',
    category: ACHIEVEMENT_CATEGORY.SKILL,
    icon: '🎯',
    target: 25,
    progress: ctx => ctx.paperTradesClosed,
    unit: 'posisi',
  },
  {
    id: 'RISK_DISCIPLINE',
    name: 'Disiplin Risiko',
    desc: 'Pasang stop loss di 20 posisi berturut-turut.',
    category: ACHIEVEMENT_CATEGORY.SKILL,
    icon: '🛡️',
    target: 20,
    progress: ctx => ctx.positionsWithStopLoss,
    unit: 'posisi',
  },
  {
    id: 'JOURNAL_KEEPER',
    name: 'Pencatat Jurnal',
    desc: 'Isi jurnal trading untuk 15 posisi.',
    category: ACHIEVEMENT_CATEGORY.SKILL,
    icon: '📓',
    target: 15,
    progress: ctx => ctx.journalEntries,
    unit: 'catatan',
  },
  {
    id: 'WATCHLIST_BUILDER',
    name: 'Pemantau Pasar',
    desc: 'Pantau 10 instrumen di watchlist.',
    category: ACHIEVEMENT_CATEGORY.SKILL,
    icon: '⭐',
    target: 10,
    progress: ctx => ctx.watchlistCount,
    unit: 'instrumen',
  },
  {
    id: 'CHART_PREDICTOR',
    name: 'Master Tebak Chart & Strategi',
    desc: 'Tebak arah chart dengan strategi dan analisa tepat (minimal 5 prediksi terverifikasi benar).',
    category: ACHIEVEMENT_CATEGORY.SKILL,
    icon: '🔮',
    target: 5,
    progress: ctx => ctx.chartPredictionsCorrect || 0,
    unit: 'prediksi benar',
  },

  // --- MILESTONE: did they finish something? -------------------------------
  {
    id: 'BACKTEST_RUNNER',
    name: 'Penguji Strategi',
    desc: 'Jalankan 5 backtest di Testing Lab.',
    category: ACHIEVEMENT_CATEGORY.MILESTONE,
    icon: '🧪',
    target: 5,
    progress: ctx => ctx.backtestsRun,
    unit: 'backtest',
  },
  {
    id: 'ACADEMY_GRADUATE',
    name: 'Lulus Quant Academy',
    desc: 'Selesaikan 10 materi di Quant Academy.',
    category: ACHIEVEMENT_CATEGORY.MILESTONE,
    icon: '🎓',
    target: 10,
    progress: ctx => ctx.academyLessonsDone,
    unit: 'materi',
  },
  {
    id: 'MANUAL_ORDER',
    name: 'Eksekusi Tertib',
    desc: 'Kirim order terukur dengan parameter risiko di Paper Broker.',
    category: ACHIEVEMENT_CATEGORY.MILESTONE,
    icon: '⚡',
    target: 5,
    progress: ctx => Math.max(Number(ctx.manualOrdersPlaced) || 0, Number(ctx.paperTradesClosed) || 0),
    unit: 'order',
  },
];

export const ACHIEVEMENTS_BY_ID = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));

/** Is this achievement finished? */
export function isUnlocked(achievement, ctx) {
  const current = Number(achievement.progress(ctx)) || 0;
  return current >= achievement.target;
}

/** 0..1 completion, clamped. Safe on a zero target. */
export function achievementProgress(achievement, ctx) {
  if (!achievement.target) return 0;
  const current = Number(achievement.progress(ctx)) || 0;
  return Math.max(0, Math.min(1, current / achievement.target));
}

/**
 * The full board for a user: every achievement with its measured state.
 *
 * Deliberately returns ALL achievements, locked ones included — the locked set
 * is the roadmap that tells a user how to reach LEGEND. Hiding them would make
 * the tier look arbitrary.
 */
export function buildAchievementBoard(ctx = {}) {
  const items = ACHIEVEMENTS.map(a => {
    const current = Number(a.progress(ctx)) || 0;
    return {
      ...a,
      current,
      unlocked: isUnlocked(a, ctx),
      ratio: achievementProgress(a, ctx),
    };
  });

  const unlockedCount = items.filter(i => i.unlocked).length;
  return {
    items,
    unlockedCount,
    total: items.length,
    allUnlocked: unlockedCount === items.length,
    completion: items.length ? unlockedCount / items.length : 0,
  };
}

/**
 * THE GATE. May this account be offered LEGEND?
 *
 * Requires BOTH:
 *   1. Every achievement complete — the earned part.
 *   2. An existing Pro subscription — you cannot skip a tier.
 *
 * An admin passes unconditionally, because an administrator locked out of their
 * own execution desk cannot support customers who are stuck.
 */
export function legendEligible(ctx = {}, tier = TIER.GUEST, isAdmin = false) {
  if (isAdmin) return { eligible: true, reason: 'admin', board: buildAchievementBoard(ctx) };
  const board = buildAchievementBoard(ctx);
  if (rankOf(tier) < rankOf(TIER.PRO)) {
    return { eligible: false, reason: 'not_pro', board };
  }
  if (!board.allUnlocked) {
    return { eligible: false, reason: 'achievements_incomplete', board };
  }
  return { eligible: true, reason: 'unlocked', board };
}

/** Plain-language explanation of a gate result, for the UI. */
export function eligibilityMessage(result) {
  switch (result?.reason) {
    case 'admin':
      return 'Akses admin: LEGEND terbuka tanpa syarat.';
    case 'not_pro':
      return 'LEGEND hanya bisa dinaiki dari paket Pro.';
    case 'achievements_incomplete': {
      const left = result.board.total - result.board.unlockedCount;
      return `Masih ada ${left} achievement yang belum selesai.`;
    }
    case 'unlocked':
      return 'Semua syarat terpenuhi. LEGEND siap diaktifkan.';
    default:
      return 'Status belum bisa ditentukan.';
  }
}

/**
 * Where achievement progress lives.
 *
 * LOCAL STORAGE, with a caveat the caller must respect: this counts activity in
 * ONE browser. A user on two devices accumulates two separate tallies, and
 * clearing site data resets them.
 *
 * That is acceptable for now because every counter is driven by real usage the
 * user cannot fabricate beyond their own history — but it means the SERVER must
 * re-verify before granting LEGEND. Migration to a per-account store is the
 * documented next step; until then this is a local, honest tally rather than an
 * entitlement.
 *
 * ponytail: single-browser tally, move to the account store when LEGEND ships.
 */
export const ACHIEVEMENT_STORAGE_KEY = 'mbg_achievement_progress_v1';

export const EMPTY_ACHIEVEMENT_CONTEXT = {
  activeDays: 0,
  signalsReviewed: 0,
  chartHours: 0,
  paperTradesClosed: 0,
  positionsWithStopLoss: 0,
  journalEntries: 0,
  watchlistCount: 0,
  backtestsRun: 0,
  academyLessonsDone: 0,
  manualOrdersPlaced: 0,
  chartPredictionsCorrect: 0,
  predictionPoints: 0,
};

export function loadAchievementContext() {
  try {
    const raw = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
    if (!raw) return { ...EMPTY_ACHIEVEMENT_CONTEXT };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...EMPTY_ACHIEVEMENT_CONTEXT };
    // Only known numeric counters survive. A malformed or hand-edited store
    // must not be able to inject a value that satisfies an achievement.
    const clean = { ...EMPTY_ACHIEVEMENT_CONTEXT };
    for (const key of Object.keys(EMPTY_ACHIEVEMENT_CONTEXT)) {
      const v = Number(parsed[key]);
      clean[key] = Number.isFinite(v) && v > 0 ? v : 0;
    }
    return clean;
  } catch {
    return { ...EMPTY_ACHIEVEMENT_CONTEXT };
  }
}

export function saveAchievementContext(ctx) {
  try {
    localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(ctx));
  } catch {
    // Storage unavailable — progress stays in memory for this session.
  }
}

/**
 * Bump one counter, taking the max when the caller reports an absolute total.
 *
 * Monotonic on purpose: a counter that can go DOWN would let a refresh undo an
 * achievement, and these exist to record what someone has done.
 */
export function bumpAchievement(key, value, { absolute = false } = {}) {
  const ctx = loadAchievementContext();
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return ctx;
  ctx[key] = absolute ? Math.max(ctx[key] || 0, n) : (ctx[key] || 0) + n;
  saveAchievementContext(ctx);
  return ctx;
}

/** Record a distinct calendar day of activity, in the user's local timezone. */
export function recordActiveDay(date = new Date()) {
  const key = 'mbg_achievement_active_days_v1';
  try {
    const day = date.toISOString().slice(0, 10);
    const raw = localStorage.getItem(key);
    const days = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(days) ? days : [];
    if (list.includes(day)) return loadAchievementContext();
    list.push(day);
    localStorage.setItem(key, JSON.stringify(list));
    return bumpAchievement('activeDays', list.length, { absolute: true });
  } catch {
    return loadAchievementContext();
  }
}
