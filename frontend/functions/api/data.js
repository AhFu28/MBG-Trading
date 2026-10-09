/**
 * Cloudflare Pages Function: Authenticated telemetry endpoint (MBG APEX)
 * Route: /api/data
 *
 * SOURCES, IN ORDER:
 *   1. Supabase REST   — the live path when SUPABASE_URL/KEY are configured.
 *   2. KV / R2 binding — optional edge storage for a pushed bundle.
 *   3. Bundled snapshot — the engine's last committed bundle, inlined by the
 *      build. Always available; no credentials required.
 *
 * WHY SOURCE 3 EXISTS (added 2026-10-06)
 * --------------------------------------
 * Four of the five Crypto Futures tabs rendered empty in production. They all
 * read `data?.crypto_futures`, and this endpoint was returning 503, so every
 * engine-computed section was blank — only the tabs fed by direct public
 * fetches had content.
 *
 * The fix everyone assumed was "set the Supabase env vars", which needs the
 * account owner. But the engine ALREADY publishes the bundle: the hourly GitHub
 * Action commits engine/cache/latest_cockpit_bundle.json every hour, and
 * Cloudflare Pages rebuilds from that commit. So the data is sitting in the
 * build already — nothing was reading it.
 *
 * Inlining it here is not the same as the old frontend/public/data mistake:
 * a file under `functions/` is compiled INTO this worker, so it is never served
 * as a static asset and remains behind the JWT check below. The old path made
 * it a plain downloadable URL.
 *
 * Trade-off, stated plainly: the snapshot is as fresh as the last Cloudflare
 * deploy, so it can lag by up to about an hour. Supabase and KV take priority
 * when configured, and the response reports which source answered plus the
 * snapshot's age, so the client never has to guess.
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

// The engine's committed bundle, resolved at build time by the Pages bundler.
// Path is three levels up from functions/api/: api -> functions -> frontend ->
// repo root. If this file is missing the build fails loudly, which is the right
// outcome: a silent fallback here is what hid the problem for ten days.
import bundledSnapshot from '../../../engine/cache/latest_cockpit_bundle.json';
import { supabaseAuthHeaders } from './_jwt.js';
import { resolveSupabaseConfig } from './_supabaseProject.js';

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
  const token = cookies['mbg_jwt'] || cookies['mbg_session'];

  if (!token) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let payload = env.JWT_SECRET ? await verifyJWT(token, env.JWT_SECRET) : null;
  if (!payload) {
    payload = await verifyJWT(token, JWT_SECRET);
  }
  if (!payload || (payload.expiresAt && Date.now() > payload.expiresAt)) {
    return jsonResponse({ error: 'Unauthorized or token expired' }, 401);
  }

  // ---- 1. Supabase REST (live path) -------------------------------------
  // Only attempt live Supabase fetch if Supabase credentials are provided in
  // env. When env is unset, fall through to edge KV and the bundled snapshot.
  const hasSupabaseInEnv = Boolean(
    env.SUPABASE_URL ||
    env.SUPABASE_KEY ||
    env.SUPABASE_ANON_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY
  );
  const { url: supabaseUrl, key: supabaseKey, ready: supabaseReady } =
    resolveSupabaseConfig(env);

  if (hasSupabaseInEnv && supabaseReady) {
    try {
      const restEndpoint = `${supabaseUrl}/rest/v1/system_state?key=eq.LATEST_COCKPIT_BUNDLE&select=val,updated_at`;
      const sResp = await fetch(restEndpoint, {
        // supabaseAuthHeaders() omits Authorization for the new
        // `sb_publishable_...` keys, which Supabase rejects in that header
        // because they are not JWTs. See functions/api/_jwt.js.
        headers: {
          ...supabaseAuthHeaders(supabaseKey),
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

  // ---- 3. Bundled snapshot (always available) ----------------------------
  //
  // Inlined by the build from the engine's committed bundle, so it works with
  // no Supabase and no KV binding. Its age is reported rather than hidden: it
  // is exactly as fresh as the last Cloudflare deploy, and the hourly GitHub
  // Action commits a new bundle every hour.
  if (bundledSnapshot && typeof bundledSnapshot === 'object') {
    const stamped = Date.parse(bundledSnapshot.last_updated || '');
    const ageHours = Number.isFinite(stamped)
      ? Math.max(0, Math.round(((Date.now() - stamped) / 3600000) * 10) / 10)
      : null;

    return new Response(JSON.stringify(bundledSnapshot), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Kept short: a redeploy is what refreshes this source, not the cache.
        'Cache-Control': 'public, max-age=30, s-maxage=60',
        'X-Data-Source': 'bundled-snapshot',
        'X-Data-Age-Hours': ageHours === null ? 'unknown' : String(ageHours),
        // So the client can tell a fresh push from a build-time snapshot and
        // label stale sections honestly instead of presenting them as live.
        'X-Data-Live': 'false',
      },
    });
  }

  // Unreachable by design. The snapshot above is inlined by the build, so it
  // either exists or the build failed — there is no runtime case where we get
  // here. Returning an explicit error rather than fetching a static path keeps
  // the old trap closed: a missing file on Cloudflare Pages comes back as
  // index.html with HTTP 200, and forwarding that to the client is exactly what
  // made every desk crash while the server reported success.
  return jsonResponse({
    error: 'Data bundle unavailable',
    detail: 'No Supabase, no KV binding, and the bundled snapshot is absent.',
    hint: 'This should be impossible: the snapshot is inlined at build time.',
  }, 503, { 'X-Data-Source': 'none' });
}
