/**
 * POST /api/account/login â€” sign in with email + password.
 *
 * The password is verified by Supabase Auth, not by us. On success we mint our
 * own HttpOnly session cookie that carries the Supabase access token, so later
 * requests can read the profile (and therefore the tier) directly from the
 * database under the user's own Row Level Security.
 */

import {
  config, notConfigured, requireJwtSecret, json, supabaseAuth,
  validateCredentials, translateAuthError, sessionCookie, SESSION_TTL_SECONDS,
} from './_shared.js';
import { signJWT } from '../_jwt.js';

export async function onRequestPost(context) {
  const { env, request } = context;

  const cfg = config(env);
  if (!cfg.ready) return notConfigured(cfg);

  // Deliberately strict. The derived-key fallback used by auth.js and friends is
  // only safe when PASSWORD_HASH is genuinely set; with neither variable
  // configured the signing key comes from two constants in this public repo, and
  // a session forged from them was accepted by /api/data in production on
  // 2026-10-06. See the note on requireJwtSecret in _shared.js.
  const missingSecret = requireJwtSecret(env);
  if (missingSecret) return missingSecret;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Format permintaan tidak valid.' }, 400);
  }

  const check = validateCredentials(body);
  // Deliberately the same message for bad email and bad password, so the form
  // cannot be used to enumerate which emails have accounts.
  if (!check.ok) return json({ error: 'Email atau kata sandi salah.' }, 401);

  const { ok, payload } = await supabaseAuth(cfg, 'token?grant_type=password', {
    body: { email: check.email, password: check.password },
  });

  if (!ok || !payload?.access_token) {
    return json(
      { error: translateAuthError(payload, 'Email atau kata sandi salah.') },
      401,
    );
  }

  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const token = await signJWT(
    {
      sub: payload.user?.id || null,
      email: check.email,
      accessToken: payload.access_token,
      expiresAt,
      kind: 'account',
    },
    env.JWT_SECRET,
  );

  return json(
    {
      ok: true,
      authenticated: true,
      email: check.email,
      // The authoritative tier is returned by /api/account/me, not guessed here.
      expiresAt,
    },
    200,
    { 'Set-Cookie': sessionCookie(token) },
  );
}
