/**
 * POST /api/account/admin/approve — approve a subscription request in 1 click.
 * Restricted strictly to authorized admin emails (Jendral Arib & Kamerad Fuad).
 */
import {
  config,
  notConfigured,
  readSession,
  corsHeaders,
  json,
  supabaseAuthHeaders,
  isAdmin,
} from '../_shared.js';

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function onRequestPost({ request, env }) {
  const cfg = config(env);
  if (!cfg.ready) return notConfigured(cfg);

  const session = await readSession(request, env);
  if (!session?.email || !isAdmin(session.email)) {
    return json(
      { error: 'Akses ditolak. Tindakan ini hanya diizinkan untuk Administrator.' },
      403,
      corsHeaders(request),
    );
  }

  let body = null;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Payload JSON tidak valid.' }, 400, corsHeaders(request));
  }

  const requestId = body?.requestId;
  const userEmail = String(body?.email || '').trim().toLowerCase();
  const days = Number(body?.days || 30);
  const note = String(body?.note || `Approved by ${session.email} on ${new Date().toISOString()}`).trim();

  if (!userEmail) {
    return json({ error: 'Email pengguna yang akan diaktifkan wajib ada.' }, 400, corsHeaders(request));
  }

  // 1. Invoke Supabase RPC activate_subscription
  const rpcRes = await fetch(`${cfg.url}/rest/v1/rpc/activate_subscription`, {
    method: 'POST',
    headers: {
      ...supabaseAuthHeaders(cfg.anonKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_email: userEmail,
      p_days: days,
      p_note: note,
    }),
  });

  if (!rpcRes.ok) {
    const errText = await rpcRes.text().catch(() => '');
    return json(
      { error: 'Gagal mengeksekusi stored procedure aktivasi di database.', detail: errText },
      502,
      corsHeaders(request),
    );
  }

  // 2. Update subscription_requests table if requestId is provided
  if (requestId) {
    await fetch(`${cfg.url}/rest/v1/subscription_requests?id=eq.${requestId}`, {
      method: 'PATCH',
      headers: {
        ...supabaseAuthHeaders(cfg.anonKey),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'approved',
        reviewed_by: session.email,
        reviewed_at: new Date().toISOString(),
      }),
    });
  }

  return json(
    {
      ok: true,
      message: `Akun ${userEmail} berhasil di-upgrade ke PRO (VIP) selama ${days} hari.`,
    },
    200,
    corsHeaders(request),
  );
}
