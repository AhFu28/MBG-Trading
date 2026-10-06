/**
 * Shared helpers for the account endpoints.
 *
 * WHY THIS EXISTS
 * ---------------
 * The cockpit used to have ONE shared password and everyone who knew it got
 * full access. The owner wants real per-user accounts: sign up free, upgrade to
 * Pro by paying. That needs a per-user identity and a server-owned tier.
 *
 * DESIGN RULES (do not weaken these):
 *  1. Passwords are handled ONLY by Supabase Auth. We never see, hash or store
 *     them. Rolling our own password hashing is how projects leak credentials.
 *  2. The tier comes from the DATABASE, never from the client. The browser can
 *     ask "what is my tier" but can never assert it.
 *  3. Expiry is evaluated on every read. A lapsed Pro subscriber must lose
 *     access immediately, not whenever someone remembers to update a row.
 *  4. The session cookie is HttpOnly. JavaScript cannot read it, so an XSS bug
 *     cannot steal a session.
 *
 * If SUPABASE_URL / SUPABASE_ANON_KEY are not configured, every endpoint returns
 * a clear 503 explaining what to set, rather than failing mysteriously.
 */

import { verifyJWT, supabaseAuthHeaders } from '../_jwt.js';

export const SESSION_COOKIE = 'mbg_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

export function config(env) {
  const url = (env.SUPABASE_URL || '').replace(/\/+$/, '');
  // Accepts the legacy `anon` JWT and the newer `sb_publishable_...` key.
  // Supabase is retiring `anon`, and the dashboard now offers the publishable
  // key first, so refusing it here would block a correctly-configured project.
  const anonKey =
    env.SUPABASE_ANON_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_KEY ||
    '';
  if (!url || !anonKey) {
    return { ready: false, url: '', anonKey: '', error: 'SUPABASE_URL dan SUPABASE_ANON_KEY belum diisi di Cloudflare Pages.' };
  }
  return { ready: true, url, anonKey, error: null };
}

export function notConfigured(cfg) {
  return json(
    {
      error: 'Layanan akun belum dikonfigurasi.',
      detail: cfg.error,
      hint: 'Tambahkan SUPABASE_URL dan SUPABASE_ANON_KEY di Cloudflare Pages > Settings > Environment variables, lalu deploy ulang.',
    },
    503,
  );
}

/**
 * Resolve the session signing key.
 *
 * KEEPING THIS STRICT ON PURPOSE — see the incident note below.
 *
 * auth.js, data.js, scanner.js and _session.js all do:
 *     env.JWT_SECRET || deriveJwtSecret(env.PASSWORD_HASH || DEFAULT_PASSWORD_HASH)
 *
 * That fallback is only safe when PASSWORD_HASH is genuinely set. When NEITHER
 * variable is configured, the signing key is derived from two constants that sit
 * in this repository — and this repository is public:
 *
 *     pepper       : "MBG-APEX-JWT-PEPPER-V1"     (_jwt.js / auth.js)
 *     passwordHash : "baab5812...dc30"            (DEFAULT_PASSWORD_HASH)
 *
 * Verified in production on 2026-10-06: a session minted from those two public
 * constants was accepted by /api/data and returned the full 1750 KB VIP payload.
 * The control request without a cookie correctly got 401.
 *
 * login.js and signup.js refusing to run without JWT_SECRET is therefore not
 * over-cautious — it is the only thing in the account path that does NOT rely on
 * a publicly derivable key. Do not "simplify" it into the fallback.
 *
 * THE REAL FIX is to set JWT_SECRET in Cloudflare Pages, which makes the derived
 * key irrelevant. Until then, treat every gated endpoint as forgeable.
 */
export function requireJwtSecret(env) {
  if (!env.JWT_SECRET) {
    return json(
      {
        error: 'JWT_SECRET belum diisi.',
        hint: 'Sesi akun ditandatangani dengan JWT_SECRET. Isi di Cloudflare Pages > Environment variables.',
      },
      503,
    );
  }
  return null;
}

/** Call Supabase Auth (GoTrue) with the anon/publishable key. */
export async function supabaseAuth(cfg, path, { method = 'POST', body, accessToken } = {}) {
  const headers = {
    ...supabaseAuthHeaders(cfg.anonKey, accessToken),
    'Content-Type': 'application/json',
  };

  const res = await fetch(`${cfg.url}/auth/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  return { ok: res.ok, status: res.status, payload };
}

/** Read the caller's profile row using their own access token (RLS applies). */
export async function fetchProfile(cfg, accessToken) {
  const res = await fetch(
    `${cfg.url}/rest/v1/profiles?select=id,email,display_name,tier,expires_at&limit=1`,
    {
      headers: {
        ...supabaseAuthHeaders(cfg.anonKey, accessToken),
        'Accept': 'application/json',
      },
    },
  );
  if (!res.ok) return null;
  const rows = await res.json().catch(() => null);
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

/**
 * Turn a raw profile row into what the UI needs.
 *
 * The tier is recalculated from expires_at EVERY time. If a subscription lapsed
 * while the user was away, this is where they lose Pro — not when somebody
 * remembers to run an update.
 */
export function resolveEntitlement(profile) {
  if (!profile) {
    return { tier: 'free', tierLabel: 'Free', isPro: false, expiresAt: null, expired: false };
  }

  const rawTier = String(profile.tier || 'free').toLowerCase();
  const expiresAt = profile.expires_at || null;
  const expiryMs = expiresAt ? new Date(expiresAt).getTime() : null;
  const lapsed = expiryMs !== null && !Number.isNaN(expiryMs) && expiryMs < Date.now();

  const tier = rawTier === 'pro' && !lapsed ? 'pro' : 'free';

  const daysLeft = expiryMs && !Number.isNaN(expiryMs)
    ? Math.max(0, Math.ceil((expiryMs - Date.now()) / 86400000))
    : null;

  return {
    tier,
    tierLabel: tier === 'pro' ? 'Pro' : 'Free',
    isPro: tier === 'pro',
    expiresAt,
    daysLeft,
    // `expired` lets the UI say "langganan Anda berakhir" instead of silently
    // dropping the user back to Free with no explanation.
    expired: rawTier === 'pro' && lapsed,
    email: profile.email || null,
    displayName: profile.display_name || null,
  };
}

export function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.split('=');
    if (!k) continue;
    out[k.trim()] = rest.join('=').trim();
  }
  return out;
}

export function sessionCookie(token, maxAge = SESSION_TTL_SECONDS) {
  return [
    `${SESSION_COOKIE}=${token}`,
    'HttpOnly',
    'Secure',
    'Path=/',
    'SameSite=Strict',
    `Max-Age=${maxAge}`,
  ].join('; ');
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=0`;
}

/** Read + verify the session cookie. Returns the JWT payload or null. */
export async function readSession(request, env) {
  if (!env.JWT_SECRET) return null;
  const token = parseCookies(request.headers.get('Cookie'))[SESSION_COOKIE];
  if (!token) return null;
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) return null;
  if (payload.expiresAt && Date.now() > payload.expiresAt) return null;
  return payload;
}

/** Minimal input validation. Deliberately strict but not clever. */
export function validateCredentials(body) {
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');

  if (!email || !password) return { ok: false, error: 'Email dan kata sandi wajib diisi.' };
  // Deliberately simple: real validation is "can we send mail to it", and
  // over-strict regexes reject valid addresses.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: 'Format email tidak valid.' };
  if (password.length < 8) return { ok: false, error: 'Kata sandi minimal 8 karakter.' };
  if (password.length > 200) return { ok: false, error: 'Kata sandi terlalu panjang.' };

  return { ok: true, email, password };
}

/** Map Supabase Auth errors to Indonesian messages a user can act on. */
export function translateAuthError(payload, fallback) {
  const raw = String(payload?.msg || payload?.error_description || payload?.error || '').toLowerCase();
  if (raw.includes('already registered') || raw.includes('already exists')) {
    return 'Email ini sudah terdaftar. Silakan masuk.';
  }
  if (raw.includes('invalid login credentials')) {
    return 'Email atau kata sandi salah.';
  }
  if (raw.includes('email not confirmed')) {
    return 'Email belum dikonfirmasi. Cek kotak masuk Anda.';
  }
  if (raw.includes('password') && raw.includes('least')) {
    return 'Kata sandi terlalu pendek.';
  }
  if (raw.includes('rate limit') || raw.includes('too many')) {
    return 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.';
  }
  return fallback;
}
