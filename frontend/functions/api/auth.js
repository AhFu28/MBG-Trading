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
  const JWT_SECRET = env.JWT_SECRET || 'fallback-secret-for-dev';

  const cookies = parseCookies(request.headers.get('Cookie'));
  const token = cookies['mbg_jwt'];

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const payload = await verifyJWT(token, JWT_SECRET);
  if (!payload || (payload.expiresAt && Date.now() > payload.expiresAt)) {
    return new Response(JSON.stringify({ error: 'Unauthorized or token expired' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ authenticated: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// --- POST: Validate password, issue JWT ---
export async function onRequestPost(context) {
  const { env, request } = context;
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  const PASSWORD_HASH = env.PASSWORD_HASH;
  const JWT_SECRET = env.JWT_SECRET || 'fallback-secret-for-dev';

  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: 'Too many attempts. Try again in 15 minutes.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { password } = body || {};
  if (!password) {
    return new Response(JSON.stringify({ error: 'Password required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const inputHash = await hashPassword(password);

  if (inputHash === PASSWORD_HASH) {
    // Clear rate limit on success
    rateLimitMap.delete(ip);

    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    const token = await signJWT({ authenticated: true, expiresAt }, JWT_SECRET);

    return new Response(JSON.stringify({ authenticated: true, expiresAt }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `mbg_jwt=${token}; HttpOnly; Secure; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Strict`
      }
    });
  } else {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
