/**
 * Cloudflare Pages Function: Auth Handler (MBG APEX)
 * Route: /api/auth
 * 
 * Handles password validation and JWT session management.
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

    return JSON.parse(base64urlDecode(bodyB64));
  } catch {
    return null;
  }
}

// --- Deployment Fallback (Owner Directive, 2026-09-30) ---
// The live gate password must remain "MBG" (owner instruction). This constant is
// sha256("MBG") and is used ONLY when the PASSWORD_HASH env var is not yet set in
// Cloudflare Pages, so login keeps working out of the box. Setting PASSWORD_HASH
// in the dashboard immediately overrides it (password rotation without redeploy).
const DEFAULT_PASSWORD_HASH = 'baab581258781b80bf4b0764a95fae1a9f08934bbd101053d0f4b70626d5dc30';

// When JWT_SECRET env is absent, derive the signing key deterministically from the
// active password hash so sessions auto-invalidate whenever the password rotates.
async function deriveJwtSecret(passwordHash) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode('MBG-APEX-JWT-PEPPER-V1'),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(passwordHash));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function resolveAuthConfig(env) {
  const passwordHash = env.PASSWORD_HASH || DEFAULT_PASSWORD_HASH;
  const jwtSecret = env.JWT_SECRET || (await deriveJwtSecret(passwordHash));
  return { passwordHash, jwtSecret };
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

// --- GET: Verify existing JWT session ---
export async function onRequestGet(context) {
  const { env, request } = context;
  const { jwtSecret: JWT_SECRET } = await resolveAuthConfig(env);

  const cookies = parseCookies(request.headers.get('Cookie'));
  const token = cookies['mbg_jwt'];

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  const payload = await verifyJWT(token, JWT_SECRET);
  if (!payload || (payload.expiresAt && Date.now() > payload.expiresAt)) {
    return new Response(JSON.stringify({ error: 'Unauthorized or token expired' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  // TRUST03: the tier comes from the server-issued JWT claim.
  return new Response(JSON.stringify({ authenticated: true, tier: payload.tier || 'PRO' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

// --- POST: Validate password, issue JWT ---
export async function onRequestPost(context) {
  const { env, request } = context;
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  const { passwordHash: PASSWORD_HASH, jwtSecret: JWT_SECRET } = await resolveAuthConfig(env);

  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: 'Too many attempts. Try again in 15 minutes.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  const { password } = body || {};
  if (!password) {
    return new Response(JSON.stringify({ error: 'Password required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  // Constant-time hash comparison (avoid string equality timing signal)
  const inputHash = await hashPassword(password);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
  const refSig = await crypto.subtle.sign('HMAC', key, encoder.encode(inputHash));
  const cmpSig = await crypto.subtle.sign('HMAC', key, encoder.encode(PASSWORD_HASH));
  const isMatch =
    refSig.byteLength === cmpSig.byteLength &&
    crypto.subtle.timingSafeEqual
      ? crypto.subtle.timingSafeEqual(refSig, cmpSig)
      : (() => {
          // Fallback constant-time compare on bytes
          const a = new Uint8Array(refSig), b = new Uint8Array(cmpSig);
          let diff = 0;
          for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
          return diff === 0;
        })();

  if (isMatch) {
    // Clear rate limit on success
    rateLimitMap.delete(ip);

    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    // TRUST03: the tier is server-issued (JWT claim), never client-asserted.
    // M0: every authenticated cockpit user is a Pro-cockpit user; per-user VIP
    // grants move here when the Supabase grant table lands (D-2).
    const token = await signJWT({ authenticated: true, tier: 'PRO', expiresAt }, JWT_SECRET);

    return new Response(JSON.stringify({ authenticated: true, tier: 'PRO', expiresAt }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Set-Cookie': `mbg_jwt=${token}; HttpOnly; Secure; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Strict`
      }
    });
  } else {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }
}

// --- DELETE: End the owner session ---
//
// WHY THIS EXISTS (bug reported 2026-10-08, "gabisa di log out"):
// `mbg_jwt` is this route's own cookie and the only way to clear it, because
// HttpOnly means no script can. Without a delete path the owner session was
// unendable: /api/account/logout clears the account cookie, not this one.
//
// Not gated on a valid token: an expired or corrupt cookie still needs clearing,
// and refusing would leave the browser holding a cookie it cannot remove.
export async function onRequestDelete() {
  return new Response(JSON.stringify({ ok: true, authenticated: false }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Set-Cookie': 'mbg_jwt=; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=0'
    }
  });
}
