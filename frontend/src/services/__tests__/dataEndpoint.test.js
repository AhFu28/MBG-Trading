/**
 * Tests for the /api/data bundle endpoint.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Jendral Arib reported every desk erroring. The cause was this endpoint
 * returning success while serving garbage:
 *
 *     HTTP 200 | Content-Type: text/html | 1 KB | body "<!doctype html>"
 *
 * The static bundle file no longer exists (the engine stopped writing it for
 * security reasons), and Cloudflare Pages answers a MISSING path with index.html
 * and a 200. So `if (!dataResp.ok)` never fired and HTML was forwarded to the
 * client as if it were market data. Every desk then crashed on JSON.parse while
 * the server reported a perfectly healthy response.
 *
 * The lesson pinned here: an API must never answer 200 with something that is
 * not the data it promised. Failing loudly is strictly better than failing
 * silently, because only one of the two can be monitored.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { onRequestGet } from '../../../functions/api/data.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a session cookie that data.js will accept (dev secret path). */
async function authCookie() {
  const enc = new TextEncoder();

  const b64url = (bytes) =>
    btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const header = b64url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = b64url(enc.encode(JSON.stringify({ role: 'owner', expiresAt: Date.now() + 60000 })));

  // data.js falls back to a secret derived from the default password hash.
  async function deriveSecret(passwordHash) {
    const key = await crypto.subtle.importKey(
      'raw', enc.encode('MBG-APEX-JWT-PEPPER-V1'),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(passwordHash));
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const secret = await deriveSecret('baab581258781b80bf4b0764a95fae1a9f08934bbd101053d0f4b70626d5dc30');
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${header}.${body}`));

  return `mbg_jwt=${header}.${body}.${b64url(new Uint8Array(sig))}`;
}

async function callData({ env = {}, cookie, fetchImpl }) {
  if (fetchImpl) vi.stubGlobal('fetch', fetchImpl);
  const request = new Request('https://x/api/data', {
    headers: cookie ? { Cookie: cookie } : {},
  });
  return onRequestGet({ env, request });
}

/** Mimics Cloudflare Pages serving index.html for a missing path. */
function htmlResponse() {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'Content-Type': 'text/html; charset=utf-8' }),
    text: async () => '<!doctype html>\n<html lang="en"><head><title>MBG</title></head></html>',
  };
}

/**
 * A response stub that satisfies what data.js actually reads.
 *
 * `ok` matters: data.js gates the Supabase branch on `if (sResp.ok)`. An earlier
 * version of this helper omitted it, so the Supabase path silently fell through
 * and the test appeared to prove something it never exercised.
 */
function jsonResponse(body, { contentType = 'application/json', status = 200 } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'Content-Type': contentType }),
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    json: async () => (typeof body === 'string' ? JSON.parse(body) : body),
  };
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------
describe('authentication is mandatory', () => {
  it('rejects a request with no session cookie', async () => {
    const res = await callData({ env: {} });
    expect(res.status).toBe(401);
  });

  it('rejects a forged token', async () => {
    const res = await callData({ env: {}, cookie: 'mbg_jwt=aaa.bbb.ccc' });
    expect(res.status).toBe(401);
  });

  it('returns JSON on rejection, not HTML', async () => {
    const res = await callData({ env: {} });
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });
});

// ---------------------------------------------------------------------------
// THE REGRESSION — HTML must never be served as data
// ---------------------------------------------------------------------------
describe('missing static bundle', () => {
  it('does NOT return 200 when Cloudflare serves index.html', async () => {
    const cookie = await authCookie();
    const res = await callData({ env: {}, cookie, fetchImpl: async () => htmlResponse() });

    // The exact bug: this used to be 200 with HTML in the body.
    expect(res.status).not.toBe(200);
    expect(res.status).toBe(503);
  });

  it('never forwards an HTML body to the client', async () => {
    const cookie = await authCookie();
    const res = await callData({ env: {}, cookie, fetchImpl: async () => htmlResponse() });
    const text = await res.text();

    expect(text).not.toContain('<!doctype');
    expect(text).not.toContain('<html');
  });

  it('explains what to do instead of failing vaguely', async () => {
    const cookie = await authCookie();
    const res = await callData({ env: {}, cookie, fetchImpl: async () => htmlResponse() });
    const body = await res.json();

    expect(body.error).toBeTruthy();
    expect(body.hint).toMatch(/SUPABASE|MBG_BUNDLE/i);
  });

  it('marks the response so monitoring can see the bad path', async () => {
    const cookie = await authCookie();
    const res = await callData({ env: {}, cookie, fetchImpl: async () => htmlResponse() });
    expect(res.headers.get('X-Data-Source')).toBe('invalid');
  });

  it('detects HTML even when the content type lies', async () => {
    // Some proxies report application/json for an error page.
    const cookie = await authCookie();
    const res = await callData({
      env: {}, cookie,
      fetchImpl: async () => jsonResponse('<!doctype html><html></html>'),
    });
    expect(res.status).toBe(503);
  });

  it('reports a non-200 from the static fetch', async () => {
    const cookie = await authCookie();
    const res = await callData({
      env: {}, cookie,
      fetchImpl: async () => ({ ok: false, status: 404, headers: new Headers(), text: async () => '' }),
    });
    expect(res.status).toBe(503);
  });
});

// ---------------------------------------------------------------------------
// Success paths
// ---------------------------------------------------------------------------
describe('a valid bundle is served', () => {
  it('returns the parsed bundle with 200', async () => {
    const cookie = await authCookie();
    const bundle = { last_updated: 'x', crypto_futures: { funding_rates: [] } };
    const res = await callData({ env: {}, cookie, fetchImpl: async () => jsonResponse(bundle) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.crypto_futures).toBeTruthy();
  });

  it('labels the static fallback source', async () => {
    const cookie = await authCookie();
    const res = await callData({
      env: {}, cookie,
      fetchImpl: async () => jsonResponse({ last_updated: 'x' }),
    });
    expect(res.headers.get('X-Data-Source')).toBe('static-bundle-fallback');
  });

  it('prefers Supabase when it is configured', async () => {
    const cookie = await authCookie();
    // Supabase's REST client passes the URL as a string, but a Request-like
    // object is also possible; match on whichever arrives.
    const seen = [];
    const res = await callData({
      env: { SUPABASE_URL: 'https://s.supabase.co', SUPABASE_KEY: 'k' },
      cookie,
      fetchImpl: async (url) => {
        const target = typeof url === 'string' ? url : (url && url.url) || '';
        seen.push(target);
        if (target.includes('supabase')) {
          return jsonResponse([{ val: { last_updated: 'live' }, updated_at: 'now' }]);
        }
        return jsonResponse({ last_updated: 'static' });
      },
    });

    // Guard: if Supabase was never called, the test would pass for the wrong
    // reason on a future refactor, so assert the call actually happened.
    expect(seen.some(u => u.includes('supabase'))).toBe(true);
    expect(res.headers.get('X-Data-Source')).toBe('supabase-live');
  });

  it('falls back when Supabase returns an empty result', async () => {
    const cookie = await authCookie();
    const res = await callData({
      env: { SUPABASE_URL: 'https://s.supabase.co', SUPABASE_KEY: 'k' },
      cookie,
      fetchImpl: async (url) => {
        if (String(url).includes('supabase')) return jsonResponse([]);
        return jsonResponse({ last_updated: 'static' });
      },
    });
    expect(res.headers.get('X-Data-Source')).toBe('static-bundle-fallback');
  });

  it('does not crash when Supabase throws', async () => {
    const cookie = await authCookie();
    const res = await callData({
      env: { SUPABASE_URL: 'https://s.supabase.co', SUPABASE_KEY: 'k' },
      cookie,
      fetchImpl: async (url) => {
        if (String(url).includes('supabase')) throw new Error('network down');
        return jsonResponse({ last_updated: 'static' });
      },
    });
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Edge KV binding
// ---------------------------------------------------------------------------
describe('edge KV binding', () => {
  it('serves from KV when bound', async () => {
    const cookie = await authCookie();
    const store = { get: async () => JSON.stringify({ last_updated: 'kv' }) };
    const res = await callData({ env: { MBG_BUNDLE: store }, cookie });

    expect(res.headers.get('X-Data-Source')).toBe('edge-kv');
  });

  it('reads from MBG_BUNDLE without hitting the network at all', async () => {
    const cookie = await authCookie();
    const fetchMock = vi.fn();
    const store = { get: async () => JSON.stringify({ last_updated: 'kv' }) };
    await callData({ env: { MBG_BUNDLE: store }, cookie, fetchImpl: fetchMock });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ignores a corrupt KV value and falls through', async () => {
    const cookie = await authCookie();
    const store = { get: async () => '<!doctype html>' };
    const res = await callData({
      env: { MBG_BUNDLE: store }, cookie,
      fetchImpl: async () => jsonResponse({ last_updated: 'static' }),
    });
    expect(res.headers.get('X-Data-Source')).toBe('static-bundle-fallback');
  });

  it('survives a KV read that throws', async () => {
    const cookie = await authCookie();
    const store = { get: async () => { throw new Error('kv down'); } };
    const res = await callData({
      env: { MBG_BUNDLE: store }, cookie,
      fetchImpl: async () => jsonResponse({ last_updated: 'static' }),
    });
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Cache safety
// ---------------------------------------------------------------------------
describe('caching', () => {
  it('never caches an error response', async () => {
    const cookie = await authCookie();
    const res = await callData({ env: {}, cookie, fetchImpl: async () => htmlResponse() });
    // A cached 503 would keep the cockpit broken long after the fix deploys.
    const cc = res.headers.get('Cache-Control') || '';
    expect(cc).toMatch(/no-store/);
  });
});
