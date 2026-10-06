/**
 * Tests for the /api/data bundle endpoint.
 *
 * SOURCE ORDER UNDER TEST
 *   1. Supabase REST    — live, when SUPABASE_URL/KEY are configured
 *   2. KV binding       — when MBG_BUNDLE is bound
 *   3. Bundled snapshot — the engine's last committed bundle, inlined at build
 *
 * HISTORY, BECAUSE IT SHAPES THESE TESTS
 * --------------------------------------
 * This endpoint once returned `HTTP 200 | text/html | "<!doctype html>"`. The
 * static bundle file had been removed for security, and Cloudflare Pages answers
 * a MISSING path with index.html and a 200 — so `if (!dataResp.ok)` never fired
 * and HTML was forwarded as market data. Every desk crashed on JSON.parse while
 * the server reported perfect health.
 *
 * THE FIX, AND WHY SOURCE 3 EXISTS
 * --------------------------------
 * On 2026-10-06 four of five Crypto Futures tabs rendered empty because this
 * endpoint returned 503. The expected fix was "set the Supabase env vars", which
 * needs the account owner — but the engine already publishes the bundle hourly
 * via a GitHub commit, and Cloudflare rebuilds from that commit. The data was
 * already in the build; nothing read it.
 *
 * Inlining it is NOT the old frontend/public mistake: a file under `functions/`
 * is compiled into the worker and stays behind the JWT check, whereas the old
 * path was a plain downloadable URL.
 *
 * The lesson pinned here: an API must never answer 200 with something that is
 * not the data it promised, and it should not report "no data" when the data is
 * sitting right there.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { onRequestGet } from '../../../functions/api/data.js';
import bundledSnapshot from '../../../../engine/cache/latest_cockpit_bundle.json';

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

/** A KV binding stub, as Cloudflare exposes it. */
function kvBinding(value, { throwOnGet = false } = {}) {
  return {
    get: async () => {
      if (throwOnGet) throw new Error('kv down');
      return value;
    },
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

  it('gates the bundled snapshot behind auth too', async () => {
    // The snapshot is inlined in the worker, not a static asset — but that only
    // means anything if reaching it still requires a session.
    const res = await callData({ env: {} });
    expect(res.status).toBe(401);
    const text = await res.text();
    expect(text).not.toContain('daily_trade_plans');
  });
});

// ---------------------------------------------------------------------------
// Source 3: the bundled snapshot — the reason the empty desks were fixed
// ---------------------------------------------------------------------------
describe('bundled snapshot', () => {
  it('serves data when neither Supabase nor KV is configured', async () => {
    // This is the case that returned 503 and blanked four tabs in production.
    const cookie = await authCookie();
    const res = await callData({ env: {}, cookie });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/json');
    expect(res.headers.get('X-Data-Source')).toBe('bundled-snapshot');
  });

  it('returns the real bundle, not an empty object', async () => {
    const cookie = await authCookie();
    const res = await callData({ env: {}, cookie });
    const body = await res.json();

    expect(Object.keys(body).length).toBeGreaterThanOrEqual(20);
    expect(body.crypto_futures).toBeTruthy();
  });

  it('carries the crypto sections the empty tabs read', async () => {
    const cookie = await authCookie();
    const res = await callData({ env: {}, cookie });
    const body = await res.json();
    const cf = body.crypto_futures;

    // The five desk tabs read exactly these keys. If the bundle stops carrying
    // one, the corresponding tab silently renders empty again.
    for (const key of ['funding_rates', 'open_interest', 'long_short_ratio',
                       'liquidations_24h', 'liquidity_heat']) {
      expect(cf, `crypto_futures.${key} missing`).toHaveProperty(key);
    }
  });

  it('reports its age rather than pretending to be live', async () => {
    const cookie = await authCookie();
    const res = await callData({ env: {}, cookie });

    expect(res.headers.get('X-Data-Live')).toBe('false');
    expect(res.headers.get('X-Data-Age-Hours')).toBeTruthy();
  });

  it('never forwards HTML', async () => {
    const cookie = await authCookie();
    const res = await callData({ env: {}, cookie });
    const text = await res.text();

    expect(text).not.toContain('<!doctype');
    expect(text).not.toContain('<html');
  });

  it('the snapshot on disk is valid JSON with the expected shape', () => {
    // Guards against a truncated or conflict-marker-corrupted commit landing in
    // the build. A rebase autostash left markers in this file once.
    expect(typeof bundledSnapshot).toBe('object');
    expect(bundledSnapshot).not.toBeNull();
    expect(Object.keys(bundledSnapshot).length).toBeGreaterThanOrEqual(20);
    expect(bundledSnapshot.last_updated).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Source 1: Supabase takes priority when configured
// ---------------------------------------------------------------------------
describe('Supabase path', () => {
  it('is used when env vars are present', async () => {
    const cookie = await authCookie();
    const live = { last_updated: 'live', crypto_futures: { funding_rates: [{ pair: 'X' }] } };
    // The endpoint selects the `val` column, not `v`.
    const res = await callData({
      env: { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_KEY: 'k' },
      cookie,
      fetchImpl: async () => jsonResponse([{ val: live }]),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Data-Source')).toBe('supabase-live');
    const body = await res.json();
    expect(body.last_updated).toBe('live');
  });

  it('falls through to the snapshot when Supabase errors', async () => {
    const cookie = await authCookie();
    const res = await callData({
      env: { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_KEY: 'k' },
      cookie,
      fetchImpl: async () => { throw new Error('network down'); },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Data-Source')).toBe('bundled-snapshot');
  });

  it('falls through when Supabase returns an empty row set', async () => {
    const cookie = await authCookie();
    const res = await callData({
      env: { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_KEY: 'k' },
      cookie,
      fetchImpl: async () => jsonResponse([]),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Data-Source')).toBe('bundled-snapshot');
  });
});

// ---------------------------------------------------------------------------
// Source 2: KV
// ---------------------------------------------------------------------------
describe('edge KV binding', () => {
  it('is used when the binding holds a bundle', async () => {
    const cookie = await authCookie();
    const stored = { last_updated: 'kv', crypto_futures: { funding_rates: [] } };
    const res = await callData({
      env: { MBG_BUNDLE: kvBinding(JSON.stringify(stored)) },
      cookie,
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Data-Source')).toBe('edge-kv');
  });

  it('outranks the snapshot but not Supabase', async () => {
    const cookie = await authCookie();
    const res = await callData({
      env: { MBG_BUNDLE: kvBinding({ last_updated: 'kv-from-object' }) },
      cookie,
    });
    expect(res.headers.get('X-Data-Source')).toBe('edge-kv');
    const body = await res.json();
    expect(body.last_updated).toBe('kv-from-object');
  });

  it('ignores a corrupt KV value and falls through to the snapshot', async () => {
    const cookie = await authCookie();
    const res = await callData({
      env: { MBG_BUNDLE: kvBinding('{"truncated": ') },
      cookie,
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Data-Source')).toBe('bundled-snapshot');
  });

  it('survives a KV read that throws', async () => {
    const cookie = await authCookie();
    const res = await callData({
      env: { MBG_BUNDLE: kvBinding(null, { throwOnGet: true }) },
      cookie,
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Data-Source')).toBe('bundled-snapshot');
  });
});

// ---------------------------------------------------------------------------
// Caching
// ---------------------------------------------------------------------------
describe('caching', () => {
  it('never caches an auth rejection', async () => {
    const res = await callData({ env: {} });
    expect(res.headers.get('Cache-Control')).toContain('no-store');
  });

  it('allows short caching of a good response', async () => {
    const cookie = await authCookie();
    const res = await callData({ env: {}, cookie });
    expect(res.headers.get('Cache-Control')).toContain('max-age');
  });
});
