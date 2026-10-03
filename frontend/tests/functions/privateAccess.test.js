import { webcrypto } from 'node:crypto';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { signJWT, verifyJWT, requireSession } from '../../functions/api/_session.js';
import { fetchSystemState, privateConfig } from '../../functions/api/_private.js';
import * as auth from '../../functions/api/auth.js';
import { onRequestGet as data } from '../../functions/api/data.js';
import { onRequestGet as arena } from '../../functions/api/arena-state.js';
import { onRequestGet as research } from '../../functions/api/research-archive.js';
import { onRequestGet as ea } from '../../functions/api/ea.js';
import { onRequestPost as scanner, onRequestOptions as options } from '../../functions/api/scanner.js';
import { onRequestPost as webhook } from '../../functions/api/telegram-webhook.js';

const USER = '11111111-1111-4111-8111-111111111111';
const SID = '22222222-2222-4222-8222-222222222222';
const secret = 'independent-session-secret-used-only-in-tests';
let env, sessions, grants, snapshots, fetchMock, ip = 0;
const response = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
function context(path, { method = 'GET', cookie, body, origin, envOverride } = {}) {
  return { env: envOverride || env, request: new Request(`https://terminal.example${path}`, {
    method, headers: { ...(cookie ? { Cookie: cookie } : {}), ...(origin ? { Origin: origin } : {}), 'CF-Connecting-IP': `test-${ip++}` },
    ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
  }) };
}
async function subscriberCookie(overrides = {}) {
  const iat = Math.floor(Date.now() / 1000);
  const payload = { authenticated: true, iss: 'mbg', aud: 'mbg-cockpit', kind: 'SUBSCRIBER', sub: USER, sid: SID, iat, exp: iat + 3600, ...overrides };
  sessions.set(SID, { subject: USER, kind: 'SUBSCRIBER', expires_at: new Date((iat + 3600) * 1000).toISOString(), revoked_at: null });
  return `mbg_jwt=${await signJWT(payload, secret)}`;
}
function grant(feature, changes = {}) {
  grants.push({ user_id: USER, feature, valid_from: new Date(Date.now() - 10000).toISOString(), expires_at: new Date(Date.now() + 3600000).toISOString(), revoked_at: null, ...changes });
}
beforeEach(async () => {
  vi.stubGlobal('crypto', webcrypto);
  const hash = await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode('owner-test-password'));
  env = { JWT_SECRET: secret, PASSWORD_HASH: Buffer.from(hash).toString('hex'), SUPABASE_URL: 'https://private.example', SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_test_only' };
  sessions = new Map(); grants = []; snapshots = new Map();
  fetchMock = vi.fn(async (url, init = {}) => {
    const u = new URL(url);
    if (u.pathname === '/auth/v1/token') return response({ user: { id: USER, email_confirmed_at: new Date().toISOString(), user_metadata: { tier: 'PRO', admin: true } }, expires_in: 3600 });
    if (u.pathname === '/rest/v1/mbg_sessions') {
      if (init.method === 'POST') { const s = JSON.parse(init.body); sessions.set(s.id, s); return new Response(null, { status: 204 }); }
      const id = u.searchParams.get('id')?.slice(3);
      if (init.method === 'PATCH') { Object.assign(sessions.get(id), JSON.parse(init.body)); return new Response(null, { status: 204 }); }
      return response(sessions.has(id) ? [sessions.get(id)] : []);
    }
    if (u.pathname === '/rest/v1/mbg_access_grants') return response(grants.filter(g => `eq.${g.user_id}` === u.searchParams.get('user_id')));
    if (u.pathname === '/rest/v1/system_state') {
      const s = snapshots.get(u.searchParams.get('key')?.slice(3));
      return response(s ? [s] : []);
    }
    throw new Error('Unexpected network destination');
  });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('session authority', () => {
  it('fails closed without an independent secret or a private service key', async () => {
    for (const e of [{ ...env, JWT_SECRET: undefined }, { ...env, JWT_SECRET: 'short' }, { ...env, SUPABASE_SERVICE_ROLE_KEY: undefined, SUPABASE_ANON_KEY: 'anonymous' }]) {
      expect((await auth.onRequestPost(context('/api/auth', { method: 'POST', body: { password: 'owner-test-password' }, envOverride: e }))).status).toBe(503);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('rejects an anon JWT even when passed as SUPABASE_KEY', () => {
    const key = `x.${Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url')}.x`;
    expect(() => privateConfig({ SUPABASE_URL: env.SUPABASE_URL, SUPABASE_KEY: key })).toThrow();
  });
  it('issues INTERNAL owner access and keeps subscriber identity independent of metadata', async () => {
    const owner = await auth.onRequestPost(context('/api/auth', { method: 'POST', body: { password: 'owner-test-password', tier: 'PRO' } }));
    expect((await owner.json()).tier).toBe('INTERNAL');
    expect(owner.headers.get('Set-Cookie')).toMatch(/HttpOnly; Secure; Path=\/; Max-Age=86400; SameSite=Strict/);
    const customer = await auth.onRequestPost(context('/api/auth', { method: 'POST', body: { email: 'member@example.com', password: 'test-only', tier: 'PRO' } }));
    expect(await customer.json()).toMatchObject({ authenticated: true, tier: 'FREE', features: [] });
    expect(customer.headers.get('Set-Cookie')).toContain('Max-Age=3600');
  });
  it('does not issue a cookie when private session persistence fails', async () => {
    fetchMock.mockResolvedValue(response({ error: 'failed' }, 500));
    const res = await auth.onRequestPost(context('/api/auth', { method: 'POST', body: { password: 'owner-test-password' } }));
    expect(res.status).toBe(503); expect(res.headers.get('Set-Cookie')).toBeNull();
  });
  it.each([{ exp: undefined }, { exp: 0 }, { iat: undefined }, { authenticated: false }, { aud: 'other' }, { kind: 'ADMIN' }, { sub: 'owner' }, { sid: 'bad' }])('rejects malformed or expired signed claims %j', async invalid => {
    const cookie = await subscriberCookie(invalid);
    expect((await requireSession(context('/api/data', { cookie }))).response.status).toBe(401);
  });
  it('rejects an appended segment and a tampered algorithm header', async () => {
    const token = (await subscriberCookie()).slice(8);
    expect(await verifyJWT(`${token}.extra`, secret)).toBeNull();
    const [header, body, sig] = token.split('.');
    expect(await verifyJWT(`${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${body}.${sig}`, secret)).toBeNull();
    expect(await verifyJWT(`${header}.${body}.invalid`, secret)).toBeNull();
  });
  it('rotating the configured owner password invalidates existing owner sessions', async () => {
    const login = await auth.onRequestPost(context('/api/auth', { method: 'POST', body: { password: 'owner-test-password' } }));
    const cookie = login.headers.get('Set-Cookie').split(';')[0];
    env.PASSWORD_HASH = 'a'.repeat(64);
    expect((await auth.onRequestGet(context('/api/auth', { cookie }))).status).toBe(401);
  });
  it('logout revokes copied cookies and deletes the browser cookie', async () => {
    const cookie = await subscriberCookie();
    const res = await auth.onRequestDelete(context('/api/auth', { method: 'DELETE', cookie }));
    expect(res.status).toBe(200); expect(res.headers.get('Set-Cookie')).toContain('Max-Age=0');
    expect((await auth.onRequestGet(context('/api/auth', { cookie }))).status).toBe(401);
  });
  it('rejects cross-origin login, logout and deceptive scanner origins before I/O', async () => {
    const origin = 'https://terminal.example.attacker.test';
    expect((await auth.onRequestPost(context('/api/auth', { method: 'POST', origin, body: { password: 'test' } }))).status).toBe(403);
    expect((await auth.onRequestDelete(context('/api/auth', { method: 'DELETE', origin }))).status).toBe(403);
    expect((await options(context('/api/scanner', { method: 'OPTIONS', origin }))).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('protected payloads', () => {
  it.each([data, arena, research, ea])('rejects a direct unauthenticated endpoint call', async handler => {
    const res = await handler(context('/api/data'));
    expect(res.status).toBe(401); expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([data, arena, research, ea])('denies a valid subscriber with no relevant grant', async handler => {
    const res = await handler(context('/api/data', { cookie: await subscriberCookie({ tier: 'PRO' }) }));
    expect(res.status).toBe(403);
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes('system_state'))).toBe(false);
  });
  it('checks expiry, revocation and subject on every request', async () => {
    const cookie = await subscriberCookie();
    snapshots.set('LATEST_COCKPIT_BUNDLE', { val: { daily_trade_plans: [{ symbol: 'TEST' }] }, updated_at: new Date().toISOString() });
    grant('cockpit.read');
    expect((await data(context('/api/data', { cookie }))).status).toBe(200);
    grants[0].revoked_at = new Date().toISOString();
    expect((await data(context('/api/data', { cookie }))).status).toBe(403);
    grants[0].revoked_at = null; grants[0].expires_at = new Date(Date.now() - 1).toISOString();
    expect((await data(context('/api/data', { cookie }))).status).toBe(403);
    grants[0].expires_at = new Date(Date.now() + 10000).toISOString(); grants[0].user_id = SID;
    expect((await data(context('/api/data', { cookie }))).status).toBe(403);
  });
  it('preserves a real empty archive and distinguishes missing/corrupt/upstream data', async () => {
    const cookie = await subscriberCookie(); grant('research.read');
    snapshots.set('RESEARCH_ARCHIVE', { val: [], updated_at: new Date().toISOString() });
    const ok = await research(context('/api/research-archive', { cookie }));
    expect(ok.status).toBe(200); expect(await ok.json()).toEqual([]);
    snapshots.clear(); expect((await research(context('/api/research-archive', { cookie }))).status).toBe(503);
    snapshots.set('RESEARCH_ARCHIVE', { val: '<html>SPA</html>', updated_at: new Date().toISOString() });
    expect((await research(context('/api/research-archive', { cookie }))).status).toBe(503);
    fetchMock.mockRejectedValue(new Error('offline'));
    await expect(fetchSystemState(env, 'RESEARCH_ARCHIVE')).rejects.toThrow();
  });
  it('reads private bundle fallback directly without origin self-calls', async () => {
    const cookie = await subscriberCookie(); grant('arena.read');
    snapshots.set('LATEST_COCKPIT_BUNDLE', { val: { arena_state: { agents: [], positions: [] } }, updated_at: new Date().toISOString() });
    const res = await arena(context('/api/arena-state', { cookie }));
    expect(res.status).toBe(200); expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    expect(fetchMock.mock.calls.every(([url]) => new URL(url).hostname === 'private.example')).toBe(true);
  });
  it('returns unavailable rather than a placeholder EA file', async () => {
    const cookie = await subscriberCookie(); grant('ea.download');
    expect((await ea(context('/api/ea', { cookie }))).status).toBe(503);
    env.MT5_EA_SOURCE = '// test source';
    const res = await ea(context('/api/ea', { cookie }));
    expect(res.status).toBe(200); expect(await res.text()).toBe('// test source');
  });
  it('enforces scanner market grants and limits UTF-8 byte size', async () => {
    const cookie = await subscriberCookie(); grant('scanner.indonesia');
    expect((await scanner(context('/api/scanner?market=america', { method: 'POST', cookie, body: {} }))).status).toBe(403);
    const res = await scanner(context('/api/scanner', { method: 'POST', cookie, body: { symbols: '漢'.repeat(23000) } }));
    expect(res.status).toBe(413);
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes('tradingview'))).toBe(false);
  });
  it('rejects forged webhook secrets and ignores groups/unbound identities without reads or sends', async () => {
    env.TELEGRAM_WEBHOOK_SECRET = 'test-secret'; env.TELEGRAM_BOT_TOKEN = 'test-only'; env.TELEGRAM_OWNER_CHAT_ID = '123';
    const message = { text: '/plan', chat: { id: 123, type: 'group' }, from: { id: 123 } };
    let ctx = context('/api/telegram-webhook', { method: 'POST', body: { message } });
    expect((await webhook(ctx)).status).toBe(403);
    ctx = context('/api/telegram-webhook', { method: 'POST', body: { message } });
    ctx.request.headers.set('x-telegram-bot-api-secret-token', 'test-secret');
    expect((await webhook(ctx)).status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
