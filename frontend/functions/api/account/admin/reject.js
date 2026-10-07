/**
 * POST /api/account/admin/reject — reject a payment confirmation request.
 * Restricted strictly to authorized admin emails.
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
  const reason = String(body?.reason || 'Bukti transfer tidak valid / mutasi tidak ditemukan').trim();

  if (!requestId) {
    return json({ error: 'ID request wajib diisi.' }, 400, corsHeaders(request));
  }

  const patchRes = await fetch(`${cfg.url}/rest/v1/subscription_requests?id=eq.${requestId}`, {
    method: 'PATCH',
    headers: {
      ...supabaseAuthHeaders(cfg.anonKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'rejected',
      notes: reason,
      reviewed_by: session.email,
      reviewed_at: new Date().toISOString(),
    }),
  });

  if (!patchRes.ok) {
    const errText = await patchRes.text().catch(() => '');
    return json(
      { error: 'Gagal memperbarui status penolakan di database.', detail: errText },
      502,
      corsHeaders(request),
    );
  }

  return json(
    {
      ok: true,
      message: 'Permintaan langganan berhasil ditolak.',
    },
    200,
    corsHeaders(request),
  );
}
