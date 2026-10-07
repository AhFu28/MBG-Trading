/**
 * GET /api/account/admin/requests — list subscription payment requests.
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

export async function onRequestGet({ request, env }) {
  const cfg = config(env);
  if (!cfg.ready) return notConfigured(cfg);

  const session = await readSession(request, env);
  if (!session?.email || !isAdmin(session.email)) {
    return json(
      { error: 'Akses ditolak. Endpoint ini hanya untuk Administrator (Jendral Arib & Kamerad Fuad).' },
      403,
      corsHeaders(request),
    );
  }

  // Read subscription_requests from Supabase
  const res = await fetch(
    `${cfg.url}/rest/v1/subscription_requests?select=*&order=created_at.desc&limit=100`,
    {
      headers: {
        ...supabaseAuthHeaders(cfg.anonKey),
        'Accept': 'application/json',
      },
    },
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    return json(
      { error: 'Gagal membaca daftar permintaan langganan dari database.', detail: errText },
      502,
      corsHeaders(request),
    );
  }

  const requests = await res.json().catch(() => []);

  return json(
    {
      ok: true,
      count: requests.length,
      requests,
    },
    200,
    corsHeaders(request),
  );
}
