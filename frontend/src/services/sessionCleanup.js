/**
 * One place that actually ends a session.
 *
 * WHY THIS EXISTS (bug reported 2026-10-08)
 * -----------------------------------------
 * Jendral Arib: "kenapa pas klik log out ga keluar, dan masuk ke halaman awal?"
 *
 * There were TWO logout buttons and BOTH were wrong:
 *
 *   1. Sidebar.jsx  — deleted `mbg_cockpit_auth` from localStorage and called
 *      window.location.reload(). But `mbg_cockpit_auth` is the OLD pre-account
 *      session key. The real session is an HttpOnly cookie set by /api/auth and
 *      /api/account/login. Nothing deleted it, so after the reload the server
 *      still answered "authenticated" and the user landed straight back in the
 *      terminal. The button looked broken because it was.
 *
 *   2. SubscriptionPage.jsx — called logOut() (correct: clears the cookie) and
 *      set account state to guest. Correct in isolation, but it left the old
 *      localStorage keys behind, so a stale `mbg_cockpit_auth` could still make
 *      PasswordGate think a session existed.
 *
 * SECOND ROUND (same day, "gabisa di log out")
 * -------------------------------------------
 * Fixing the local keys was not enough, because there are TWO session cookies
 * and only one of them was being cleared:
 *
 *   mbg_session  — account session, minted by /api/account/login
 *   mbg_jwt      — legacy owner-cockpit session, minted by /api/auth
 *
 * App.jsx falls back to /api/auth whenever /api/account/me says "no account".
 * Clearing only `mbg_session` therefore left `mbg_jwt` valid, the owner session
 * was restored on the very next reload, and because both cookies are HttpOnly
 * there was no script-side way out. A session you cannot end is a security bug,
 * not a UX bug.
 *
 * So this routine now revokes BOTH, server-side, and only then scrubs local
 * traces. Every logout control must call this and never hand-roll its own.
 */

import { logOut as revokeServerSession, logOutOwner as revokeOwnerSession } from './accountClient.js';

/**
 * Every localStorage/sessionStorage key that can hold a session or account
 * trace. Kept as an explicit list rather than `localStorage.clear()` so a
 * logout never destroys the user's watchlist, paper-trading book, or AI arena
 * journal — those are the user's data, not the session's.
 */
export const SESSION_STORAGE_KEYS = [
  'mbg_cockpit_auth',      // legacy owner-password session (pre-account)
  'mbg_cockpit_auth_time', // legacy session timestamp
  'mbg_auth_session',      // account session hint
];

/**
 * Clear local session traces. Safe to call even if the keys are absent, and
 * safe when storage is unavailable (private mode, disabled cookies).
 */
export function clearLocalSession() {
  for (const key of SESSION_STORAGE_KEYS) {
    try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
    try { sessionStorage.removeItem(key); } catch { /* storage unavailable */ }
  }
}

/**
 * End the session for real: revoke BOTH server sessions, then scrub locally.
 *
 * Both revocations run concurrently and neither can throw — from the user's
 * point of view "keluar" must always succeed. That means this function always
 * completes, and the caller can reload unconditionally.
 *
 * @returns {Promise<{ok: true}>}
 */
export async function endSession() {
  try {
    await Promise.all([revokeServerSession(), revokeOwnerSession()]);
  } catch {
    // Defence in depth: neither client throws, but a logout that throws would
    // strand the user inside the terminal. Never let that happen — the local
    // scrub below still logs them out of this browser.
  }
  clearLocalSession();
  return { ok: true };
}
