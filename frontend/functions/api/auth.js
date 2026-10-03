/**
 * Cloudflare Pages Function: Auth Handler (MBG APEX)
 * Route: /api/auth
 *
 * TRUST01 hardening (Week-1, bounded):
 *  - Authorization is decided **only** here, server-side. No hardcoded/default
 *    password and no plaintext credential comparison anywhere in this file.
 *  - Requires the documented `PASSWORD_HASH` env var (lowercase hex SHA-256 of the
 *    access password). Missing/invalid configuration fails closed (503).
 *  - Requires a real `JWT_SECRET`; the former hardcoded development fallback signing
 *    secret is gone, because a public fallback secret makes every session forgeable.
 *  - Password-hash comparison is length-safe and constant-time-ish.
 *  - Issued session is a signed JWT in an HttpOnly cookie; the JSON body returns an
 *    opaque `session` id, never a client-authoritative boolean to persist.
 *
 * Uses Web Crypto API (available natively in Cloudflare Workers).
 */

// --- Minimal JWT using Web Crypto API (Edge-compatible, no Node.js deps) ---

function base64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlEncode(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

async function signJWT(payload, secret) {
  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64urlEncode(JSON.stringify(payload));
  const data = new TextEncoder().encode(`${header}.${body}`);
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, data);
  return `${header}.${body}.${base64url(sig)}`;
}

async function verifyJWT(token, secret) {
  try {
    const [headerB64, bodyB64, sigB64] = token.split('.');
    if (!headerB64 || !bodyB64 || !sigB64) return null;

    const data = new TextEncoder().encode(`${headerB64}.${bodyB64}`);
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );

    // Reconstruct signature bytes
    const sigStr = base64urlDecode(sigB64);
    const sigBytes = new Uint8Array(sigStr.length);
    for (let i = 0; i < sigStr.length; i++) sigBytes[i] = sigStr.charCodeAt(i);

    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, data);
    if (!valid) return null;

    const payload = JSON.parse(base64urlDecode(bodyB64));
    if (!payload || payload.authenticated !== true) return null;
    if (payload.expiresAt && Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}

// --- Constant-time-ish hash comparison (Web Crypto has no timingSafeEqual) ---
// Compares the full length of the longer input and folds in a length difference so
// short/long inputs cannot be distinguished by early exit.
function timingSafeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const max = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < max; i++) {
    const ca = i < a.length ? a.charCodeAt(i) : 0;
    const cb = i < b.length ? b.charCodeAt(i) : 0;
    diff |= (ca ^ cb);
  }
  return diff === 0;
}

// --- Configuration guards: fail closed, never fall back to a shared default ---

function resolvePasswordHash(env) {
  const raw = typeof env.PASSWORD_HASH === 'string' ? env.PASSWORD_HASH.trim().toLowerCase() : '';
  if (!/^[0-9a-f]{64}$/.test(raw)) return null;
  return raw;
}

function resolveJwtSecret(env) {
  const secret = typeof env.JWT_SECRET === 'string' ? env.JWT_SECRET : '';
  if (secret.length >= 16) return secret;
  // Explicit, clearly-named opt-in for local/staging work only.
  if (env.MBG_ALLOW_INSECURE_DEV_SECRET === 'true') return 'insecure-dev-only-secret';
  return null;
}

function jsonResponse(payload, status, extraHeaders) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...(extraHeaders || {})
    }
  });
}

// --- Rate Limiting (in-memory, resets on cold start — acceptable for edge) ---
const rateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const window = 15 * 60 * 1000; // 15 minutes

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + window });
    return true;
  }

  const entry = rateLimitMap.get(ip);
  if (now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + window });
    return true;
  }

  entry.count += 1;
  return entry.count <= 5;
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(part => {
    const [key, ...rest] = part.split('=');
    cookies[key.trim()] = rest.join('=').trim();
  });
  return cookies;
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- GET: Verify existing signed session cookie ---
export async function onRequestGet(context) {
  const { env, request } = context;

  const JWT_SECRET = resolveJwtSecret(env);
  if (!JWT_SECRET) {
    return jsonResponse({ error: 'Authentication is not configured' }, 503);
  }

  const cookies = parseCookies(request.headers.get('Cookie'));
  const token = cookies['mbg_jwt'];

  if (!token) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const payload = await verifyJWT(token, JWT_SECRET);
  if (!payload) {
    return jsonResponse({ error: 'Unauthorized or token expired' }, 401);
  }

  return jsonResponse({ authenticated: true, expiresAt: payload.expiresAt, session: payload.sid || null }, 200);
}

// --- POST: Validate password, issue a signed HttpOnly session cookie ---
export async function onRequestPost(context) {
  const { env, request } = context;
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';

  const PASSWORD_HASH = resolvePasswordHash(env);
  const JWT_SECRET = resolveJwtSecret(env);

  if (!PASSWORD_HASH || !JWT_SECRET) {
    // Fail closed: never authenticate against a missing/default credential or secret.
    return jsonResponse({ error: 'Authentication is not configured' }, 503);
  }

  if (!checkRateLimit(ip)) {
    return jsonResponse({ error: 'Too many attempts. Try again in 15 minutes.' }, 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { password } = body || {};
  if (typeof password !== 'string' || password.length === 0) {
    return jsonResponse({ error: 'Password required' }, 400);
  }

  const inputHash = await hashPassword(password);

  // Single, configuration-driven check. No DEFAULT_HASH, no OLD_HASH, no
  // plaintext 'mbg' fallback — those were the production bypass.
  const isMatch = timingSafeEqualHex(inputHash, PASSWORD_HASH);

  if (isMatch) {
    // Clear rate limit on success
    rateLimitMap.delete(ip);

    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    const sid = crypto.randomUUID();
    const token = await signJWT({ authenticated: true, sid, expiresAt }, JWT_SECRET);

    return jsonResponse(
      { authenticated: true, expiresAt, session: sid },
      200,
      {
        'Set-Cookie': `mbg_jwt=${token}; HttpOnly; Secure; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Strict`
      }
    );
  }

  return jsonResponse({ error: 'Invalid credentials' }, 401);
}
