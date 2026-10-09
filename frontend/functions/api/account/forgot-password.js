/**
 * POST /api/account/forgot-password — Request password reset email via Supabase Auth.
 */

import {
  config, notConfigured, json, supabaseAuth, translateAuthError
} from './_shared.js';

export async function onRequestPost(context) {
  const { env, request } = context;

  const cfg = config(env);
  if (!cfg.ready) return notConfigured(cfg);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Format permintaan tidak valid.' }, 400);
  }

  const email = String(body?.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json({ error: 'Format email tidak valid.' }, 400);
  }

  const { ok, payload } = await supabaseAuth(cfg, 'recover', {
    body: { email },
  });

  if (!ok) {
    return json(
      { error: translateAuthError(payload, 'Gagal mengirim email pemulihan. Coba lagi.') },
      400,
    );
  }

  return json({
    ok: true,
    message: 'Tautan reset kata sandi telah dikirim ke email Anda. Silakan periksa kotak masuk atau spam.',
  });
}
