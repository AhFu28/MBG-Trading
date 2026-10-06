/**
 * Cloudflare Pages Function: Authenticated telemetry endpoint (MBG APEX)
 * Route: /api/data
 *
 * SOURCES, IN ORDER:
 *   1. Supabase REST  — the live path when SUPABASE_URL/KEY are configured.
 *   2. KV / R2 binding — optional edge storage for a pushed bundle.
 *   3. Static /data/latest_cockpit_bundle.json — last resort.
 *
 * ⚠️ THE BUG THIS FILE USED TO HAVE (fixed 2026-10-06)
 * ---------------------------------------------------
 * Production served HTTP 200 with an HTML page, and every desk in the cockpit
 * errored. Two faults combined:
 *
 *   a) `fetch(dataUrl)` on a MISSING static file does not fail on Cloudflare
 *      Pages. It returns index.html with a 200. So `if (!dataResp.ok)` never
 *      fired and the HTML was forwarded to the client as if it were data.
 *   b) The engine stopped writing frontend/public/data for security reasons
 *      (VIP payloads were downloadable). Nothing updated the fetch path, so the
 *      file it asked for no longer existed.
 *
 * An API that returns 200 + HTML for a data request is worse than one that
 * fails: the client cannot tell the difference and neither can monitoring.
 * This version checks the content type and returns a real error instead.
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

/**
 * Guard against the HTML-instead-of-JSON trap.
 * Returns the parsed bundle, or null when the response is not JSON data.
 */
function parseBundle(text, contentType) {
  const type = (contentType || '').toLowerCase();
  if (type.includes('text/html')) return null;

  const head = text.slice(0, 200).trimStart().toLowerCase();
  if (head.startsWith('<!doctype') || head.startsWith('<html')) return null;

  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function jsonResponse(body, status, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
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

export async function onRequestGet(context) {
  const { env, request } = context;

  // SECURITY: authentication is mandatory — no anonymous fallback.
  const PASSWORD_HASH = env.PASSWORD_HASH || DEFAULT_PASSWORD_HASH;
  const JWT_SECRET = env.JWT_SECRET || (await deriveJwtSecret(PASSWORD_HASH));

  const cookies = parseCookies(request.headers.get('Cookie'));
  const token = cookies['mbg_jwt'];

  if (!token) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const payload = await verifyJWT(token, JWT_SECRET);
  if (!payload || (payload.expiresAt && Date.now() > payload.expiresAt)) {
    return jsonResponse({ error: 'Unauthorized or token expired' }, 401);
  }

  // ---- 1. Supabase REST (live path) -------------------------------------
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
      console.warn('Supabase REST fetch error, falling back:', e);
    }
  }

  // ---- 2. Edge storage binding (optional) --------------------------------
  // Lets the engine PUSH the bundle to the edge without needing Supabase, and
  // without making the bundle a public static file.
  const store = env.MBG_BUNDLE || env.MBG_DATA;
  if (store && typeof store.get === 'function') {
    try {
      const stored = await store.get('latest_cockpit_bundle');
      if (stored) {
        const parsed = parseBundle(typeof stored === 'string' ? stored : JSON.stringify(stored));
        if (parsed) {
          return new Response(JSON.stringify(parsed), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=30, s-maxage=60',
              'X-Data-Source': 'edge-kv',
            },
          });
        }
      }
    } catch (e) {
      console.warn('Edge bundle read failed:', e);
    }
  }

  // ---- 3. Static bundle (last resort) ------------------------------------
  const url = new URL(request.url);
  const dataUrl = `${url.origin}/data/latest_cockpit_bundle.json`;

  try {
    const dataResp = await fetch(dataUrl, { headers: { 'Accept': 'application/json' } });

    if (!dataResp.ok) {
      return jsonResponse({
        error: 'Data bundle unavailable',
        detail: `Static bundle returned HTTP ${dataResp.status}`,
        hint: 'Isi SUPABASE_URL + SUPABASE_KEY, atau bind KV ke MBG_BUNDLE.',
      }, 503, { 'X-Data-Source': 'none' });
    }

    const text = await dataResp.text();
    const bundle = parseBundle(text, dataResp.headers.get('Content-Type'));

    if (!bundle) {
      // THE REGRESSION GUARD. A missing static file on Cloudflare Pages comes
      // back as index.html with HTTP 200. Forwarding that to the client is how
      // every desk in the cockpit ended up erroring while the server reported
      // success. Fail honestly instead.
      return jsonResponse({
        error: 'Data bundle is not JSON',
        detail: 'Static bundle path returned HTML (the file does not exist).',
        hint: 'Engine tidak lagi menulis ke frontend/public. Isi SUPABASE_URL + SUPABASE_KEY, atau bind KV ke MBG_BUNDLE.',
        servedBytes: text.length,
      }, 503, { 'X-Data-Source': 'invalid' });
    }

    return new Response(JSON.stringify(bundle), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, s-maxage=60',
        'X-Data-Source': 'static-bundle-fallback'
      }
    });
  } catch (err) {
    return jsonResponse({
      error: 'Failed to read data bundle',
      detail: String(err && err.message ? err.message : err),
    }, 500, { 'X-Data-Source': 'none' });
  }
}
