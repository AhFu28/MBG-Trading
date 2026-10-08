/**
 * POST /api/account/logout — clear BOTH session cookies.
 *
 * Also revokes the Supabase token so a stolen cookie cannot be replayed.
 * Revocation failure is not fatal: the local cookies are cleared regardless, and
 * the token expires on its own.
 *
 * WHY BOTH COOKIES (bug reported 2026-10-08, "gabisa di log out"):
 * This handler used to clear only `mbg_session`. App.jsx falls back to
 * /api/auth when /api/account/me reports no account, and that route reads the
 * separate `mbg_jwt` owner cookie — which was still valid. The user was
 * therefore logged straight back in on reload, and because both cookies are
 * HttpOnly there was no way to clear the leftover from the browser.
 */

import { config, json, readSession, clearAllSessionCookies } from './_shared.js';

export async function onRequestPost(context) {
  const { env, request } = context;
  const session = await readSession(request, env);

  if (session?.accessToken) {
    const cfg = config(env);
    if (cfg.ready) {
      try {
        await fetch(`${cfg.url}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            'apikey': cfg.anonKey,
            'Authorization': `Bearer ${session.accessToken}`,
          },
        });
      } catch {
        // Best effort only — the cookies are cleared below either way.
      }
    }
  }

  return json(
    { ok: true, authenticated: false },
    200,
    { 'Set-Cookie': clearAllSessionCookies() },
  );
}
