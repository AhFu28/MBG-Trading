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
  /*
   * `secretIsConfigured` reports whether the signing key is PRIVATE.
   *
   * When JWT_SECRET is absent the key is derived from the password hash, and that
   * hash has a default committed in this file (sha256("MBG")). Anyone who can read
   * this repository can therefore compute the signing key and mint a valid token.
   * Verified live against production on 2026-10-11: a self-signed token was
   * accepted by /api/auth AND returned the 1.9 MB /api/data bundle.
   *
   * The admin claim is NO LONGER gated on this flag (owner directive, 2026-10-15).
   * It is still reported, because it measures how much the claim is worth: when
   * false, anyone who reads this repository can mint a token with the same rights.
   */
  return { passwordHash, jwtSecret, secretIsConfigured: !!env.JWT_SECRET };
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
  const { jwtSecret: JWT_SECRET, secretIsConfigured } = await resolveAuthConfig(env);

  const cookies = parseCookies(request.headers.get('Cookie'));
  const token = cookies['mbg_jwt'] || cookies['mbg_session'];

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  let payload = env.JWT_SECRET ? await verifyJWT(token, env.JWT_SECRET) : null;
  if (!payload) {
    payload = await verifyJWT(token, JWT_SECRET);
  }
  if (!payload || (payload.expiresAt && Date.now() > payload.expiresAt)) {
    return new Response(JSON.stringify({ error: 'Unauthorized or token expired' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  /*
   * WHO IS THE OWNER, AND WHY THIS MATTERS (2026-10-10)
   * ---------------------------------------------------
   * This route serves the legacy owner cockpit (/api/auth), and its JWT is the
   * ONLY credential the owner holds there. Before this fix the response carried
   * no identity at all — just `tier: 'PRO'` — so the browser had no way to know
   * the owner is an administrator. The owner was therefore permanently capped at
   * PRO and hit the "Khusus Pro" / "Khusus Legend" lock screens.
   *
   * `kind` separates the two token families that share this cookie space:
   *   - 'owner'   signed in onRequestPost below, after the cockpit password check
   *   - 'account' signed by /api/account/login with kind: 'account'
   *
   * A token issued before this change has no `kind` but DOES carry the exact
   * legacy owner shape `{ authenticated: true, tier: 'PRO' }`, so it is still
   * recognised and the owner does not have to log in again. The shape is matched
   * exactly rather than "anything with a tier": a loose truthiness test would
   * promote any future token family that forgets to set `kind`.
   *
   * An account token always carries kind: 'account' and can never be promoted to
   * admin here. Note that forging any of this still requires the HMAC signing key
   * — verifyJWT() rejects an unsigned or altered token before this line runs.
   */
  const isLegacyOwnerToken =
    payload.kind === undefined &&
    payload.authenticated === true &&
    payload.tier === 'PRO';

  const isOwner = payload.kind === 'owner' || isLegacyOwnerToken;
  /*
   * OWNER DIRECTIVE (Jendral Arib, 2026-10-15):
   *   "pass MBG itu hanya untuk akses admin, dan untuk bagian admin pastikan
   *    semua fitur terbuka."
   *
   * So an owner session IS an admin session and every desk opens. The claim is
   * driven by isOwner — never by tier, and never unconditionally: an account token
   * still carries kind: 'account' and can never be promoted here.
   *
   * The "(isOwner && secretIsConfigured)" term that used to sit here is exactly
   * what kept the owner locked out of his own admin desks in production.
   */
  const isAdminGranted = isOwner;

  return new Response(JSON.stringify({
    authenticated: true,
    // Lower-case, matching /api/account/me. A legacy owner token carries the
    // historical upper-case 'PRO', so the check below stays exact.
    tier: isOwner ? 'legend' : (payload.tier || 'free'),
    isAdmin: isAdminGranted,
    /*
     * ADMIN IS GRANTED — BUT SAY HOW STRONG IT IS (revised 2026-10-15)
     *
     * The claim is no longer withheld, because the owner needs his desks open.
     * What has NOT changed: an admin claim is only worth as much as the token
     * behind it. While JWT_SECRET is unset the signing key is derivable from this
     * public repository, so a forged owner token is indistinguishable from a real
     * one and would inherit the same rights.
     *
     * Stated out loud rather than buried. One secret closes the forgery path and
     * does not change how the owner logs in.
     */
    securityWarning: secretIsConfigured ? null
      : 'JWT_SECRET belum diset: sesi admin tetap diberikan, TETAPI token dapat dipalsukan siapa pun yang membaca repositori publik ini. Jalankan: wrangler pages secret put JWT_SECRET',
    adminForgeable: isOwner && !secretIsConfigured,
    email: payload.email || null,
    expiresAt: payload.expiresAt || null,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

// --- POST: Validate password, issue JWT ---
export async function onRequestPost(context) {
  const { env, request } = context;
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  const { passwordHash: PASSWORD_HASH, jwtSecret: JWT_SECRET, secretIsConfigured } = await resolveAuthConfig(env);

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
    /*
     * TRUST03: the tier is server-issued (JWT claim), never client-asserted.
     *
     * The cockpit password holder IS the owner, and the owner is an
     * administrator. Saying so here — in the signed claim and in the response —
     * is what lets the UI stop showing the owner the "Khusus Pro" / "Khusus
     * Legend" lock screens. The client never decides this; it only reads it.
     */
    const token = await signJWT(
      { authenticated: true, kind: 'owner', tier: 'legend', expiresAt },
      JWT_SECRET
    );

    /*
     * `tier` is lower-case to match /api/account/me, which returns 'free' / 'pro'.
     * The old owner route returned 'PRO' in upper case; CmcTopNav compares
     * `account.tier === 'legend'` for its badge, so the case is load-bearing.
     */
    return new Response(JSON.stringify({
      authenticated: true,
      tier: 'legend',
      /*
       * Granted on the password match, per the owner directive of 2026-10-15. This
       * line only runs after the constant-time comparison above succeeded, so it is
       * NOT a blanket claim on every token — the GET path still requires isOwner.
       */
      isAdmin: true,
      securityWarning: secretIsConfigured ? null
        : 'JWT_SECRET belum diset: sesi admin diberikan, TETAPI token dapat dipalsukan siapa pun yang membaca repositori publik ini. Jalankan: wrangler pages secret put JWT_SECRET',
      expiresAt,
    }), {
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
