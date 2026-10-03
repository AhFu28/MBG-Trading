import { privateRequest, privateConfig, jsonResponse } from './_private.js';
export const SESSION_SECONDS = 24 * 60 * 60;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const OWNER_FEATURES = ['cockpit.read', 'arena.read', 'research.read', 'ea.download', 'scanner.indonesia', 'scanner.america', 'scanner.forex', 'scanner.cfd'];
function encode(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function base64urlDecode(str) {
  return atob(str.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(str.length / 4) * 4, '='));
}
function decodeJson(str) {
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(base64urlDecode(str), c => c.charCodeAt(0))));
}
async function hmac(secret, usage) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [usage]);
}
export function authConfig(env) {
  if (typeof env.JWT_SECRET !== 'string' || new TextEncoder().encode(env.JWT_SECRET).length < 32) throw new Error('Session signing is not configured');
  privateConfig(env);
  return env.JWT_SECRET;
}
export async function ownerVersion(env) {
  if (!/^[a-f0-9]{64}$/i.test(env.PASSWORD_HASH || '')) throw new Error('Owner login is not configured');
  return encode(new Uint8Array(await crypto.subtle.sign('HMAC', await hmac(authConfig(env), 'sign'), new TextEncoder().encode(env.PASSWORD_HASH.toLowerCase()))));
}
export async function signJWT(payload, secret) {
  const encoder = new TextEncoder();
  const header = encode(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = encode(encoder.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign('HMAC', await hmac(secret, 'sign'), encoder.encode(`${header}.${body}`));
  return `${header}.${body}.${encode(new Uint8Array(sig))}`;
}
export async function verifyJWT(token, secret) {
  try {
    if (typeof token !== 'string' || token.length > 4096) return null;
    const parts = token.split('.');
    if (parts.length !== 3 || parts.some(p => !/^[A-Za-z0-9_-]+$/.test(p))) return null;
    const [header, body, sig] = parts;
    const metadata = decodeJson(header);
    if (metadata.alg !== 'HS256' || metadata.typ !== 'JWT') return null;
    const valid = await crypto.subtle.verify('HMAC', await hmac(secret, 'verify'), Uint8Array.from(base64urlDecode(sig), c => c.charCodeAt(0)), new TextEncoder().encode(`${header}.${body}`));
    if (!valid) return null;
    const p = decodeJson(body);
    const now = Math.floor(Date.now() / 1000);
    if (p.authenticated !== true || p.iss !== 'mbg' || p.aud !== 'mbg-cockpit' || !UUID.test(p.sid) ||
        !Number.isInteger(p.iat) || !Number.isInteger(p.exp) || p.iat > now + 30 || p.exp <= now || p.exp <= p.iat || p.exp - p.iat > SESSION_SECONDS ||
        !['OWNER', 'SUBSCRIBER'].includes(p.kind) || (p.kind === 'OWNER' ? p.sub !== 'owner' : !UUID.test(p.sub))) return null;
    return p;
  } catch { return null; }
}
export function parseCookies(header) {
  const cookies = Object.create(null);
  for (const part of (header || '').split(';')) {
    const [name, ...value] = part.split('=');
    cookies[name.trim()] = value.join('=').trim();
  }
  return cookies;
}
export async function accessFor(env, payload) {
  if (payload.kind === 'OWNER') return { tier: 'INTERNAL', features: OWNER_FEATURES };
  const query = new URLSearchParams({ user_id: `eq.${payload.sub}`, select: 'feature,valid_from,expires_at,revoked_at' });
  const rows = await privateRequest(env, `mbg_access_grants?${query}`);
  if (!Array.isArray(rows)) throw new Error('Invalid grants');
  const now = Date.now();
  const features = [...new Set(rows.filter(r => !r.revoked_at && Date.parse(r.valid_from) <= now && Date.parse(r.expires_at) > now && OWNER_FEATURES.includes(r.feature)).map(r => r.feature))];
  return { tier: features.length ? 'PRO' : 'FREE', features };
}
export async function requireSession(context) {
  try {
    const secret = authConfig(context.env);
    const payload = await verifyJWT(parseCookies(context.request.headers.get('Cookie')).mbg_jwt, secret);
    if (!payload) return { ok: false, response: jsonResponse({ error: 'Unauthorized' }, 401) };
    if (payload.kind === 'OWNER' && payload.ownerVersion !== await ownerVersion(context.env)) return { ok: false, response: jsonResponse({ error: 'Unauthorized' }, 401) };
    const query = new URLSearchParams({ id: `eq.${payload.sid}`, select: 'subject,kind,expires_at,revoked_at', limit: '1' });
    const rows = await privateRequest(context.env, `mbg_sessions?${query}`);
    if (!Array.isArray(rows)) throw new Error('Invalid sessions');
    const s = rows[0];
    if (!s || s.subject !== payload.sub || s.kind !== payload.kind || s.revoked_at || !Number.isFinite(Date.parse(s.expires_at)) || Date.parse(s.expires_at) <= Date.now()) return { ok: false, response: jsonResponse({ error: 'Unauthorized' }, 401) };
    return { ok: true, payload, ...await accessFor(context.env, payload) };
  } catch { return { ok: false, response: jsonResponse({ error: 'Authentication service unavailable' }, 503) }; }
}
export async function requireAccess(context, feature) {
  const session = await requireSession(context);
  if (!session.ok) return session;
  if (!session.features.includes(feature)) return { ok: false, response: jsonResponse({ error: 'Access grant required' }, 403) };
  return session;
}
