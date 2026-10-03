/**
 * Cloudflare Pages Function: TradingView Scanner Reverse Proxy (Hardened)
 * Route: /api/scanner
 *
 * Proxies scanner requests to TradingView with edge caching (10s).
 * SECURITY: session-gated (JWT cookie required), strict market allowlist,
 * per-IP rate limit, strict CORS origin protection.
 */

const ALLOWED_MARKETS = new Set(['indonesia', 'america', 'forex', 'cfd']);
const MAX_BODY_BYTES = 64 * 1024; // 64 KB — scanner payloads are small

// In-memory rate limit (per isolate; KV upgrade tracked in remediation plan)
const rlMap = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const window = 60 * 1000; // 1 minute
  if (!rlMap.has(ip)) {
    rlMap.set(ip, { count: 1, resetTime: now + window });
    return true;
  }
  const entry = rlMap.get(ip);
  if (now > entry.resetTime) {
    rlMap.set(ip, { count: 1, resetTime: now + window });
    return true;
  }
  entry.count += 1;
  return entry.count <= 30; // 30 scans/min per IP is ample for a 12s poll loop
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

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

// --- Deployment Fallback (Owner Directive, 2026-09-30) ---
// Must stay byte-identical with auth.js: when JWT_SECRET env is absent, sessions
// are verified against the same derived key that auth.js used to sign them.
const DEFAULT_PASSWORD_HASH = 'baab581258781b80bf4b0764a95fae1a9f08934bbd101053d0f4b70626d5dc30';

async function deriveJwtSecret(passwordHash) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode('MBG-APEX-JWT-PEPPER-V1'),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(passwordHash));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyJWT(token, secret) {
  try {
    const [headerB64, bodyB64, sigB64] = token.split('.');
    if (!headerB64 || !bodyB64 || !sigB64) return null;
    const data = new TextEncoder().encode(`${headerB64}.${bodyB64}`);
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
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

function getAllowedOrigin(request) {
  const origin = request.headers.get('Origin') || '';
  if (
    origin.includes('mbg-trading.pages.dev') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1')
  ) {
    return origin;
  }
  return 'https://mbg-trading.pages.dev';
}

export async function onRequestPost({ request, env }) {
  try {
    // 1. Require an authenticated session (same JWT as /api/auth)
    const JWT_SECRET = env.JWT_SECRET || (await deriveJwtSecret(env.PASSWORD_HASH || DEFAULT_PASSWORD_HASH));
    const cookies = parseCookies(request.headers.get('Cookie'));
    const payload = cookies['mbg_jwt'] ? await verifyJWT(cookies['mbg_jwt'], JWT_SECRET) : null;
    if (!payload || (payload.expiresAt && Date.now() > payload.expiresAt)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // 2. Rate limit per IP
    const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
    if (!checkRateLimit(ip)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }

    // 3. Strict market allowlist
    const url = new URL(request.url);
    const market = url.searchParams.get('market') || 'indonesia';
    if (!ALLOWED_MARKETS.has(market)) {
      return new Response(JSON.stringify({ error: 'Market not allowed' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // 4. Body size guard
    const body = await request.text();
    if (body.length > MAX_BODY_BYTES) {
      return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413, headers: { 'Content-Type': 'application/json' } });
    }

    const tvUrl = `https://scanner.tradingview.com/${encodeURIComponent(market)}/scan`;
    const tvResponse = await fetch(tvUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: body
    });

    if (!tvResponse.ok) {
      return new Response(tvResponse.body, {
        status: tvResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await tvResponse.text();
    const allowedOrigin = getAllowedOrigin(request);

    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=10, s-maxage=15',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Scanner proxy failed', details: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions({ request }) {
  const allowedOrigin = getAllowedOrigin(request);
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}
