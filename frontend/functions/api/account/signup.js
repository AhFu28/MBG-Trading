/**
 * POST /api/account/signup â€” create a new FREE account.
 *
 * Passwords go straight to Supabase Auth. We never hash or store them.
 * Every new account starts on the FREE tier; the tier is raised only by the
 * owner after a payment arrives (see supabase/schema.sql activate_subscription).
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

  const missingSecret = requireJwtSecret(env);
  if (missingSecret) return missingSecret;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Format permintaan tidak valid.' }, 400);
  }

  const check = validateCredentials(body);
  if (!check.ok) return json({ error: check.error }, 400);

  const displayName = String(body?.displayName || '').trim().slice(0, 80) || null;

  const { ok, payload } = await supabaseAuth(cfg, 'signup', {
    body: {
      email: check.email,
      password: check.password,
      data: displayName ? { display_name: displayName } : undefined,
    },
  });

  if (!ok) {
    return json(
      { error: translateAuthError(payload, 'Pendaftaran gagal. Coba lagi.') },
      400,
    );
  }

  // Two possible Supabase behaviours:
  //  a) email confirmation OFF -> session returned immediately
  //  b) email confirmation ON  -> user must confirm before a session exists
  const accessToken = payload?.access_token;
  const userId = payload?.user?.id || null;

  if (!accessToken) {
    // Account created but not yet usable. Tell the truth instead of pretending.
    return json({
      ok: true,
      requiresConfirmation: true,
      message: 'Akun dibuat. Cek email Anda untuk konfirmasi sebelum masuk.',
    }, 201);
  }

  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const token = await signJWT(
    { sub: userId, email: check.email, accessToken, expiresAt, kind: 'account' },
    env.JWT_SECRET,
  );

  return json(
    {
      ok: true,
      authenticated: true,
      // A brand-new account is FREE by definition. Never claim Pro here.
      tier: 'free',
      email: check.email,
      displayName,
      expiresAt,
    },
    201,
    { 'Set-Cookie': sessionCookie(token) },
  );
}
