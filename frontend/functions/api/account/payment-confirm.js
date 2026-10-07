/**
 * POST /api/account/payment-confirm — submit a manual payment confirmation.
 */
import {
  config,
  notConfigured,
  readSession,
  corsHeaders,
  json,
  supabaseAuthHeaders,
} from './_shared.js';

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function onRequestPost({ request, env }) {
  const cfg = config(env);
  if (!cfg.ready) return notConfigured(cfg);

  let body = null;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Payload JSON tidak valid.' }, 400, corsHeaders(request));
  }

  const session = await readSession(request, env);

  const email = String(session?.email || body?.email || '').trim().toLowerCase();
  const senderName = String(body?.senderName || '').trim();
  const paymentMethod = String(body?.paymentMethod || 'BCA').trim();
  const amount = Number(body?.amount || 149000);
  const notes = String(body?.notes || '').trim();
  const proofUrl = String(body?.proofUrl || '').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json({ error: 'Email wajib diisi dan harus valid.' }, 400, corsHeaders(request));
  }
  if (!senderName) {
    return json({ error: 'Nama pengirim / pemilik rekening wajib diisi.' }, 400, corsHeaders(request));
  }
  if (!amount || isNaN(amount) || amount <= 0) {
    return json({ error: 'Nominal transfer tidak valid.' }, 400, corsHeaders(request));
  }

  // Insert into Supabase subscription_requests
  const record = {
    user_id: session?.id || null,
    email,
    sender_name: senderName,
    payment_method: paymentMethod,
    amount,
    notes: notes || null,
    proof_url: proofUrl || null,
    status: 'pending',
  };

  const res = await fetch(`${cfg.url}/rest/v1/subscription_requests`, {
    method: 'POST',
    headers: {
      ...supabaseAuthHeaders(cfg.anonKey),
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(record),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    return json(
      {
        error: 'Gagal menyimpan konfirmasi pembayaran ke sistem.',
        detail: errText,
      },
      502,
      corsHeaders(request),
    );
  }

  const inserted = await res.json().catch(() => []);
  const created = Array.isArray(inserted) && inserted.length ? inserted[0] : null;

  return json(
    {
      ok: true,
      message: 'Konfirmasi pembayaran berhasil dikirim. Admin akan memverifikasi dalam 5-15 menit.',
      request: created || record,
    },
    201,
    corsHeaders(request),
  );
}
