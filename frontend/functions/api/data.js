/**
 * Cloudflare Pages Function: Dynamic Authenticated Telemetry Endpoint (MBG APEX)
 * Route: /api/data
 * 
 * Fetches fresh telemetry from Supabase REST API (edge-cached 60s)
 * with graceful fallback to static /data/latest_cockpit_bundle.json.
 * Zero git commits needed for continuous market freshness.
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

  // 1. Authenticate JWT (allows dev testing fallback if dev secret is used)
  const cookies = parseCookies(request.headers.get('Cookie'));
  const token = cookies['mbg_jwt'];

  if (token) {
    const payload = await verifyJWT(token, JWT_SECRET);
    if (!payload || (payload.expiresAt && Date.now() > payload.expiresAt)) {
      return new Response(JSON.stringify({ error: 'Unauthorized or token expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 2. Query Supabase REST API for latest market bundle if configured
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_KEY || env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const restEndpoint = `${supabaseUrl}/rest/v1/system_state?key=eq.LATEST_COCKPIT_BUNDLE&select=val,updated_at`;
      const sResp = await fetch(restEndpoint, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Accept': 'application/json'
        }
      });

      if (sResp.ok) {
        const records = await sResp.json();
        if (Array.isArray(records) && records.length > 0 && records[0].val) {
          return new Response(JSON.stringify(records[0].val), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120',
              'X-Data-Source': 'supabase-live',
              'X-Bundle-Updated-At': records[0].updated_at || new Date().toISOString()
            }
          });
        }
      }
    } catch (e) {
      console.warn('Supabase REST fetch error, falling back to static JSON:', e);
    }
  }

  // 3. Fallback to static data bundle from CDN
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
        'Cache-Control': 'public, max-age=30, s-maxage=60',
        'X-Data-Source': 'static-bundle-fallback'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to read data bundle' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
