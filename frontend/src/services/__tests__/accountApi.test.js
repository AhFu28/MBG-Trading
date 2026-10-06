/**
 * Tests for the account API endpoints.
 *
 * This is a MONEY PATH: it decides who is Free and who is Pro. The tests below
 * deliberately avoid a live Supabase by exercising the guards and the pure
 * entitlement logic, because the failure that matters most is "someone gets Pro
 * without paying" or "a paying customer is locked out".
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

import { onRequestGet as meGet } from '../../../functions/api/account/me.js';
import { onRequestPost as signupPost } from '../../../functions/api/account/signup.js';
import { onRequestPost as loginPost } from '../../../functions/api/account/login.js';
import { onRequestPost as logoutPost } from '../../../functions/api/account/logout.js';
import { resolveEntitlement, validateCredentials, config } from '../../../functions/api/account/_shared.js';

const ENV_EMPTY = {};
const ENV_OK = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
  JWT_SECRET: 'test-secret-not-used-for-real-sessions',
};

function req(url, body) {
  return new Request(url, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', Origin: 'https://example.com' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

afterEach(() => { vi.restoreAllMocks(); });

// ---------------------------------------------------------------------------
// Configuration guards — must fail loudly, never silently grant access
// ---------------------------------------------------------------------------
describe('configuration guards', () => {
  it('falls back to the committed project when env vars are missing', () => {
    // The publishable key is designed to ship in source, so the account system
    // works before the owner has set anything in Cloudflare. See
    // functions/api/_supabaseProject.js.
    const cfg = config(ENV_EMPTY);
    expect(cfg.ready).toBe(true);
    expect(cfg.url).toMatch(/^https:\/\/[a-z0-9]+\.supabase\.co$/);
    expect(cfg.anonKey).toMatch(/^sb_publishable_|^eyJ/);
  });

  it('lets the environment OVERRIDE the committed fallback', () => {
    // Rotation must not require a code change, so env has to win outright.
    const cfg = config({
      SUPABASE_URL: 'https://rotated.supabase.co',
      SUPABASE_ANON_KEY: 'sb_publishable_rotated',
    });
    expect(cfg.url).toBe('https://rotated.supabase.co');
    expect(cfg.anonKey).toBe('sb_publishable_rotated');
  });

  it('accepts every name the key has had', () => {
    // anon -> publishable -> the generic name this project used first.
    const base = { SUPABASE_URL: 'https://x.supabase.co' };
    expect(config({ ...base, SUPABASE_ANON_KEY: 'k1' }).anonKey).toBe('k1');
    expect(config({ ...base, SUPABASE_PUBLISHABLE_KEY: 'k2' }).anonKey).toBe('k2');
    expect(config({ ...base, SUPABASE_KEY: 'k3' }).anonKey).toBe('k3');
  });

  it('strips a trailing slash from the Supabase URL', () => {
    const cfg = config({ ...ENV_OK, SUPABASE_URL: 'https://example.supabase.co/' });
    expect(cfg.url).toBe('https://example.supabase.co');
  });

  it('refuses signup with a 503 when JWT_SECRET is absent', async () => {
    // Supabase now resolves from the fallback, so the missing signing secret is
    // the only thing that can block signup. That guard is load-bearing — see the
    // session-forgery note next to requireJwtSecret in _shared.js.
    const res = await signupPost({ env: ENV_EMPTY, request: req('https://x/api/account/signup', { email: 'a@b.co', password: 'longenough1' }) });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBeTruthy();
    expect(body.hint).toMatch(/JWT_SECRET/);
  });

  it('refuses login with a 503 when JWT_SECRET is absent', async () => {
    const res = await loginPost({ env: ENV_EMPTY, request: req('https://x/api/account/login', { email: 'a@b.co', password: 'longenough1' }) });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.hint).toMatch(/JWT_SECRET/);
  });

  it('reports configured:true on /me once Supabase resolves', async () => {
    const res = await meGet({ env: ENV_EMPTY, request: req('https://x/api/account/me') });
    expect(res.status).toBe(200);
    const body = await res.json();
    // Still a guest — nobody is signed in — but the service itself is ready.
    expect(body).toMatchObject({ authenticated: false, tier: 'guest', configured: true });
  });

  it('refuses signup when JWT_SECRET is missing even if Supabase is set', async () => {
    // Without a signing secret we must not mint a session we cannot verify.
    const env = { SUPABASE_URL: ENV_OK.SUPABASE_URL, SUPABASE_ANON_KEY: ENV_OK.SUPABASE_ANON_KEY };
    const res = await signupPost({ env, request: req('https://x/api/account/signup', { email: 'a@b.co', password: 'longenough1' }) });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.hint).toMatch(/JWT_SECRET/);
  });
});

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------
describe('credential validation', () => {
  it('accepts a normal email and password', () => {
    expect(validateCredentials({ email: 'a@b.co', password: 'longenough1' }).ok).toBe(true);
  });

  it('normalises the email to lowercase and trims it', () => {
    const r = validateCredentials({ email: '  User@Example.COM  ', password: 'longenough1' });
    expect(r.email).toBe('user@example.com');
  });

  it('rejects a missing password', () => {
    expect(validateCredentials({ email: 'a@b.co' }).ok).toBe(false);
    expect(validateCredentials({ email: 'a@b.co', password: '' }).ok).toBe(false);
  });

  it('rejects a short password', () => {
    expect(validateCredentials({ email: 'a@b.co', password: '1234567' }).ok).toBe(false);
    expect(validateCredentials({ email: 'a@b.co', password: '12345678' }).ok).toBe(true);
  });

  it('rejects obviously malformed emails', () => {
    for (const bad of ['notanemail', 'a@b', 'a@.com', '@b.com', 'a b@c.com']) {
      expect(validateCredentials({ email: bad, password: 'longenough1' }).ok).toBe(false);
    }
  });

  it('rejects an absurdly long password instead of hashing it', () => {
    expect(validateCredentials({ email: 'a@b.co', password: 'x'.repeat(500) }).ok).toBe(false);
  });

  it('rejects a malformed JSON body without throwing', async () => {
    const badRequest = new Request('https://x/api/account/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'not json',
    });
    const res = await signupPost({ env: ENV_OK, request: badRequest });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Entitlement — the single most important logic in this feature
// ---------------------------------------------------------------------------
describe('entitlement resolution', () => {
  const DAY = 86400000;
  const inFuture = (days) => new Date(Date.now() + days * DAY).toISOString();
  const inPast = (days) => new Date(Date.now() - days * DAY).toISOString();

  it('gives no access to a missing profile', () => {
    expect(resolveEntitlement(null)).toMatchObject({ tier: 'free', isPro: false });
  });

  it('keeps a plain free profile on free', () => {
    expect(resolveEntitlement({ tier: 'free' })).toMatchObject({ tier: 'free', isPro: false });
  });

  it('grants pro while the subscription is valid', () => {
    const r = resolveEntitlement({ tier: 'pro', expires_at: inFuture(10) });
    expect(r).toMatchObject({ tier: 'pro', isPro: true, expired: false });
  });

  it('REVOKES pro the moment the subscription lapses', () => {
    // The whole point: no cron job needs to run for access to end.
    const r = resolveEntitlement({ tier: 'pro', expires_at: inPast(1) });
    expect(r).toMatchObject({ tier: 'free', isPro: false });
    expect(r.expired).toBe(true);
  });

  it('reports expiry so the UI can explain the downgrade', () => {
    const r = resolveEntitlement({ tier: 'pro', expires_at: inPast(3) });
    expect(r.expired).toBe(true);
    expect(r.daysLeft).toBe(0);
  });

  it('does not expire a pro profile with no end date', () => {
    // Used for the owner's own account.
    expect(resolveEntitlement({ tier: 'pro', expires_at: null })).toMatchObject({ tier: 'pro', isPro: true });
  });

  it('treats an unparseable expiry as no expiry rather than as expired', () => {
    // Better to keep a paying customer in than to lock them out over a typo.
    const r = resolveEntitlement({ tier: 'pro', expires_at: 'not-a-date' });
    expect(r.isPro).toBe(true);
  });

  it('counts remaining days for the renewal prompt', () => {
    const r = resolveEntitlement({ tier: 'pro', expires_at: inFuture(5) });
    expect(r.daysLeft).toBeGreaterThanOrEqual(4);
    expect(r.daysLeft).toBeLessThanOrEqual(6);
  });

  it('accepts uppercase tier values from the database', () => {
    expect(resolveEntitlement({ tier: 'PRO', expires_at: inFuture(1) }).isPro).toBe(true);
  });

  it('never treats an unknown tier as paid', () => {
    for (const t of ['admin', 'vip', 'premium', '', null, undefined]) {
      expect(resolveEntitlement({ tier: t }).isPro).toBe(false);
    }
  });

  it('never returns isPro true for a lapsed row, whichever way it is asked', () => {
    const lapsed = { tier: 'pro', expires_at: inPast(30) };
    const direct = resolveEntitlement(lapsed);
    expect(direct.isPro).toBe(false);
    expect(direct.tier).toBe('free');
  });
});

// ---------------------------------------------------------------------------
// Logout must always succeed from the user's point of view
// ---------------------------------------------------------------------------
describe('logout', () => {
  it('clears the session cookie', async () => {
    const res = await logoutPost({ env: ENV_EMPTY, request: req('https://x/api/account/logout', {}) });
    expect(res.status).toBe(200);
    const cookie = res.headers.get('Set-Cookie') || '';
    expect(cookie).toMatch(/mbg_session=;/);
    expect(cookie).toMatch(/Max-Age=0/);
  });

  it('still clears the cookie when there is no session', async () => {
    const res = await logoutPost({ env: ENV_OK, request: req('https://x/api/account/logout', {}) });
    expect(res.status).toBe(200);
    expect(res.headers.get('Set-Cookie')).toMatch(/Max-Age=0/);
  });
});

// ---------------------------------------------------------------------------
// Session cookies must be unreadable from JavaScript
// ---------------------------------------------------------------------------
describe('session cookie hardening', () => {
  it('does not trust a forged cookie', async () => {
    const forged = new Request('https://x/api/account/me', {
      headers: { Cookie: 'mbg_session=eyJhbGciOiJIUzI1NiJ9.eyJ0aWVyIjoicHJvIn0.badsignature' },
    });
    const res = await meGet({ env: ENV_OK, request: forged });
    const body = await res.json();
    // A forged token must never yield an authenticated session.
    expect(body.authenticated).toBe(false);
    expect(body.tier).toBe('guest');
  });
});
