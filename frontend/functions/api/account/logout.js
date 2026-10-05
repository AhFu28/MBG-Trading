/**
 * POST /api/account/logout — clear the session cookie.
 *
 * Also revokes the Supabase token so a stolen cookie cannot be replayed.
 * Revocation failure is not fatal: the local cookie is cleared regardless, and
 * the token expires on its own.
 */

import { config, json, readSession, clearSessionCookie } from './_shared.js';

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
        // Best effort only — the cookie is cleared below either way.
      }
    }
  }

  return json(
    { ok: true, authenticated: false },
    200,
    { 'Set-Cookie': clearSessionCookie() },
  );
}
