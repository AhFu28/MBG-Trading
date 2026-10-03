import { authConfig, ownerVersion, signJWT, requireSession, accessFor, SESSION_SECONDS } from './_session.js';
import { privateConfig, privateRequest, jsonResponse, sameOrigin } from './_private.js';
// Isolate-local throttle only; use Cloudflare WAF/rate rules for a distributed limit.
const attempts = new Map();
function throttle(ip) {
  const now = Date.now();
  for (const [key, entry] of attempts) if (entry.until <= now) attempts.delete(key);
  const entry = attempts.get(ip) || { count: 0, until: now + 15 * 60 * 1000 };
  entry.count++;
  attempts.set(ip, entry);
  return entry.count <= 5;
}
function sessionView(s) {
  return { authenticated: true, tier: s.tier, features: s.features, expiresAt: s.payload.exp * 1000 };
}
export async function onRequestGet(context) {
  const s = await requireSession(context);
  return s.ok ? jsonResponse(sessionView(s)) : s.response;
}
export async function onRequestPost(context) {
  const { env, request } = context;
  if (!sameOrigin(request)) return jsonResponse({ error: 'Origin not allowed' }, 403);
  let secret;
  try { secret = authConfig(env); } catch { return jsonResponse({ error: 'Authentication service unavailable' }, 503); }
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!throttle(ip)) return jsonResponse({ error: 'Too many attempts' }, 429, { 'Retry-After': '900' });
  let body;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 8192) return jsonResponse({ error: 'Payload too large' }, 413);
    body = JSON.parse(raw);
  } catch { return jsonResponse({ error: 'Invalid request' }, 400); }
  if (!body || typeof body.password !== 'string' || !body.password || body.password.length > 1024 || (body.email !== undefined && (typeof body.email !== 'string' || body.email.length > 320))) return jsonResponse({ error: 'Credentials required' }, 400);
  try {
    const iat = Math.floor(Date.now() / 1000);
    let identity;
    let seconds = SESSION_SECONDS;
    if (body.email) {
      const { url, key } = privateConfig(env);
      const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: body.email.trim(), password: body.password }),
        signal: AbortSignal.timeout(8000), cache: 'no-store',
      });
      if (response.status >= 500) throw new Error('Identity service unavailable');
      if (response.status === 429) return jsonResponse({ error: 'Too many attempts' }, 429, { 'Retry-After': '900' });
      if (!response.ok) return jsonResponse({ error: 'Invalid credentials' }, 401);
      const auth = await response.json();
      if (!auth.user?.id || !auth.user.email_confirmed_at || !Number.isFinite(auth.expires_in) || auth.expires_in < 1) return jsonResponse({ error: 'Invalid credentials' }, 401);
      identity = { kind: 'SUBSCRIBER', sub: auth.user.id };
      seconds = Math.min(SESSION_SECONDS, Math.floor(auth.expires_in));
    } else {
      const version = await ownerVersion(env);
      const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body.password)));
      const expected = Uint8Array.from(env.PASSWORD_HASH.match(/../g), hex => parseInt(hex, 16));
      let different = 0;
      for (let i = 0; i < digest.length; i++) different |= digest[i] ^ expected[i];
      if (different) return jsonResponse({ error: 'Invalid credentials' }, 401);
      identity = { kind: 'OWNER', sub: 'owner', ownerVersion: version };
    }
    const payload = { ...identity, sid: crypto.randomUUID(), authenticated: true, iss: 'mbg', aud: 'mbg-cockpit', iat, exp: iat + seconds };
    const access = await accessFor(env, payload);
    await privateRequest(env, 'mbg_sessions', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ id: payload.sid, subject: payload.sub, kind: payload.kind, expires_at: new Date(payload.exp * 1000).toISOString() }) });
    const token = await signJWT(payload, secret);
    attempts.delete(ip);
    return jsonResponse(sessionView({ payload, ...access }), 200, { 'Set-Cookie': `mbg_jwt=${token}; HttpOnly; Secure; Path=/; Max-Age=${seconds}; SameSite=Strict` });
  } catch { return jsonResponse({ error: 'Authentication service unavailable' }, 503); }
}
export async function onRequestDelete(context) {
  if (!sameOrigin(context.request)) return jsonResponse({ error: 'Origin not allowed' }, 403);
  const session = await requireSession(context);
  if (!session.ok && session.response.status !== 401) return session.response;
  try {
    if (session.ok) await privateRequest(context.env, `mbg_sessions?id=eq.${session.payload.sid}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ revoked_at: new Date().toISOString() }) });
    return jsonResponse({ authenticated: false }, 200, { 'Set-Cookie': 'mbg_jwt=; HttpOnly; Secure; Path=/; Max-Age=0; SameSite=Strict' });
  } catch { return jsonResponse({ error: 'Logout service unavailable' }, 503); }
}
