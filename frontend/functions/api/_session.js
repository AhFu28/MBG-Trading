/**
 * Shared session verification for Cloudflare Pages Functions.
 *
 * Every gated route must route through here so there is exactly one place
 * that decides whether a request may read VIP payloads.
 */

import { supabaseAuthHeaders } from './_jwt.js';
import { resolveSupabaseConfig } from './_supabaseProject.js';

export function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

export async function verifyJWT(token, secret) {
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

export function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(part => {
    const [key, ...rest] = part.split('=');
    cookies[key.trim()] = rest.join('=').trim();
  });
  return cookies;
}

// Must stay byte-identical with auth.js: when JWT_SECRET env is absent, sessions
// are verified against the same derived key that auth.js used to sign them.
export const DEFAULT_PASSWORD_HASH = 'baab581258781b80bf4b0764a95fae1a9f08934bbd101053d0f4b70626d5dc30';

export async function deriveJwtSecret(passwordHash) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode('MBG-APEX-JWT-PEPPER-V1'),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(passwordHash));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Returns { ok: true } when the request carries a valid, unexpired session.
 * Returns { ok: false, response } with a ready 401 otherwise.
 */
export async function requireSession(context) {
  const { env, request } = context;
  const PASSWORD_HASH = env.PASSWORD_HASH || DEFAULT_PASSWORD_HASH;
  const JWT_SECRET = env.JWT_SECRET || (await deriveJwtSecret(PASSWORD_HASH));

  const cookies = parseCookies(request.headers.get('Cookie'));
  const token = cookies['mbg_jwt'] || cookies['mbg_session'];

  const unauthorized = (msg) => ({
    ok: false,
    response: new Response(JSON.stringify({ error: msg }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  });

  if (!token) return unauthorized('Unauthorized');

  let payload = env.JWT_SECRET ? await verifyJWT(token, env.JWT_SECRET) : null;
  if (!payload) {
    payload = await verifyJWT(token, JWT_SECRET);
  }
  if (!payload || (payload.expiresAt && Date.now() > payload.expiresAt)) {
    return unauthorized('Unauthorized or token expired');
  }

  // resolveSupabaseConfig prefers the environment and falls back to the committed
  // publishable coordinates. Returning raw env values here meant every caller of
  // fetchSystemState got an undefined URL whenever the owner had not set the
  // variables — the gated routes then silently read nothing.
  const sb = resolveSupabaseConfig(env);
  return { ok: true, payload, supabaseUrl: sb.url, supabaseKey: sb.key };
}

/**
 * Read a single key from Supabase system_state. Returns null when Supabase is
 * unconfigured, unreachable, or holds no row for that key.
 */
export async function fetchSystemState(supabaseUrl, supabaseKey, key) {
  if (!supabaseUrl || !supabaseKey) return null;
  try {
    const restEndpoint = `${supabaseUrl}/rest/v1/system_state?key=eq.${key}&select=val,updated_at`;
    const resp = await fetch(restEndpoint, {
      // supabaseAuthHeaders() omits Authorization for the newer
      // `sb_publishable_...` keys, which Supabase rejects in that header because
      // they are not JWTs. See functions/api/_jwt.js.
      headers: {
        ...supabaseAuthHeaders(supabaseKey),
        'Accept': 'application/json'
      }
    });
    if (!resp.ok) return null;
    const records = await resp.json();
    if (Array.isArray(records) && records.length > 0 && records[0].val) {
      return { val: records[0].val, updatedAt: records[0].updated_at };
    }
  } catch {
    // fall through — caller decides what a miss means
  }
  return null;
}
