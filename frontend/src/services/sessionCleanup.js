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
 * The fix is one shared routine that does BOTH halves in the right order:
 * revoke on the server first, then scrub every local trace. Anything that
 * offers a logout control must call this, never hand-roll its own.
 */

import { logOut as revokeServerSession } from './accountClient.js';

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
 * End the session for real: revoke server-side, then scrub locally.
 *
 * `logOut()` never throws — it resolves even when the network is down, because
 * from the user's point of view "keluar" must always succeed. That means this
 * function always completes, and the caller can reload unconditionally.
 *
 * @returns {Promise<{ok: true}>}
 */
export async function endSession() {
  try {
    await revokeServerSession();
  } catch {
    // Defence in depth: accountClient already swallows errors, but a logout
    // that throws would strand the user inside the terminal. Never let that
    // happen — the local scrub below still logs them out of this browser.
  }
  clearLocalSession();
  return { ok: true };
}
