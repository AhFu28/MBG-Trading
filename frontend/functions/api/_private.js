// Server-only storage. Never import this module from frontend/src.
export class ServiceUnavailable extends Error {}
export function privateConfig(env) {
  const url = env.SUPABASE_URL?.replace(/\/$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY;
  let privileged = key?.startsWith('sb_secret_');
  try {
    if (!privileged && key) privileged = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role === 'service_role';
  } catch { /* reject unrecognized/anonymous keys */ }
  if (!url || !/^https:\/\//.test(url) || !privileged) throw new ServiceUnavailable('Private storage is not configured');
  return { url, key };
}
export async function privateRequest(env, path, options = {}) {
  const { url, key } = privateConfig(env);
  try {
    const response = await fetch(`${url}/rest/v1/${path}`, {
      ...options,
      headers: {
        apikey: key,
        ...(key.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${key}` }),
        Accept: 'application/json', 'Content-Type': 'application/json', ...options.headers,
      },
      signal: AbortSignal.timeout(8000), cache: 'no-store',
    });
    if (!response.ok) throw new ServiceUnavailable('Private storage request failed');
    return response.status === 204 ? null : await response.json();
  } catch { throw new ServiceUnavailable('Private storage unavailable'); }
}
export async function fetchSystemState(env, key) {
  const query = new URLSearchParams({ key: `eq.${key}`, select: 'val,updated_at', limit: '1' });
  const rows = await privateRequest(env, `system_state?${query}`);
  if (!Array.isArray(rows)) throw new ServiceUnavailable('Invalid private snapshot');
  if (!rows.length || rows[0].val === null || rows[0].val === undefined) return null;
  return { val: rows[0].val, updatedAt: rows[0].updated_at };
}
export function jsonResponse(value, status = 200, headers = {}) {
  return new Response(JSON.stringify(value), { status, headers: {
    'Content-Type': 'application/json', 'Cache-Control': 'private, no-store', Vary: 'Cookie', ...headers,
  } });
}
export function sameOrigin(request) {
  const origin = request.headers.get('Origin');
  return !origin || origin === new URL(request.url).origin;
}
