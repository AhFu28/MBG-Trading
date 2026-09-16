/**
 * Cloudflare Pages Function: Authenticated Data Endpoint (MBG APEX)
 * Route: /api/data
 * 
 * Verifies JWT cookie before serving the trading data bundle.
 * Prevents unauthenticated access to /data/latest_cockpit_bundle.json.
 */

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
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

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(part => {
    const [key, ...rest] = part.split('=');
    cookies[key.trim()] = rest.join('=').trim();
  });
  return cookies;
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const JWT_SECRET = env.JWT_SECRET || 'fallback-secret-for-dev';

  // Parse JWT from cookie
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

  // Fetch the static data bundle from the same origin
  const url = new URL(request.url);
  const dataUrl = `${url.origin}/data/latest_cockpit_bundle.json`;

  try {
    const dataResp = await fetch(dataUrl);
    if (!dataResp.ok) {
      return new Response(JSON.stringify({ error: 'Data bundle not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await dataResp.text();
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-cache, no-store',
        'X-Data-Source': 'authenticated'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to read data bundle' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
