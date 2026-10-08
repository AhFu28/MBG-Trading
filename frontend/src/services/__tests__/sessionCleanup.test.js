import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { endSession, clearLocalSession, SESSION_STORAGE_KEYS } from '../sessionCleanup.js';
import * as accountClient from '../accountClient.js';

/**
 * Regression guard for the logout bug reported by Jendral Arib on 2026-10-08:
 * "kenapa pas klik log out ga keluar, dan masuk ke halaman awal?"
 *
 * The old Sidebar handler deleted only the legacy `mbg_cockpit_auth` key and
 * reloaded the page. Because the live session is an HttpOnly cookie, the reload
 * signed the user straight back in. These tests pin the corrected contract:
 * a logout MUST call the server, and MUST clear every local session key.
 */

function makeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    get size() { return map.size; },
    _map: map,
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', makeStorage());
  vi.stubGlobal('sessionStorage', makeStorage());
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('clearLocalSession', () => {
  it('removes every known session key from both storages', () => {
    for (const key of SESSION_STORAGE_KEYS) {
      localStorage.setItem(key, 'stale');
      sessionStorage.setItem(key, 'stale');
    }

    clearLocalSession();

    for (const key of SESSION_STORAGE_KEYS) {
      expect(localStorage.getItem(key)).toBeNull();
      expect(sessionStorage.getItem(key)).toBeNull();
    }
  });

  it('removes the legacy cockpit key that the old handler deleted', () => {
    // This key caused the bug: deleting it alone was never enough, but it must
    // still be cleared so PasswordGate cannot see a phantom session.
    localStorage.setItem('mbg_cockpit_auth', 'legacy-session');
    clearLocalSession();
    expect(localStorage.getItem('mbg_cockpit_auth')).toBeNull();
  });

  it('preserves the user\'s own data — watchlist, paper book, arena journal', () => {
    // Logging out must never destroy trading history. An earlier draft used
    // localStorage.clear(), which would have wiped all of this.
    const userData = {
      mbg_user_watchlist: '["BBCA","BTCUSDT"]',
      mbg_paper_portfolio: '{"cashUsdt":10000}',
      mbg_ai_arena_journal: '[]',
      mbg_display_mode: 'PRO',
    };
    for (const [k, v] of Object.entries(userData)) localStorage.setItem(k, v);

    clearLocalSession();

    for (const [k, v] of Object.entries(userData)) {
      expect(localStorage.getItem(k)).toBe(v);
    }
  });

  it('survives storage that throws (private mode / disabled cookies)', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('denied'); },
      setItem: () => { throw new Error('denied'); },
      removeItem: () => { throw new Error('denied'); },
    });
    expect(() => clearLocalSession()).not.toThrow();
  });
});

describe('endSession', () => {
  it('calls the server logout endpoint', async () => {
    const spy = vi.spyOn(accountClient, 'logOut').mockResolvedValue({ ok: true });

    await endSession();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('clears local session keys after revoking on the server', async () => {
    vi.spyOn(accountClient, 'logOut').mockResolvedValue({ ok: true });
    for (const key of SESSION_STORAGE_KEYS) localStorage.setItem(key, 'stale');

    await endSession();

    for (const key of SESSION_STORAGE_KEYS) {
      expect(localStorage.getItem(key)).toBeNull();
    }
  });

  it('still logs out locally when the server is unreachable', async () => {
    // The user pressed "keluar". Network trouble must not trap them inside the
    // terminal — that was half of the original bug report.
    vi.spyOn(accountClient, 'logOut').mockRejectedValue(new Error('network down'));
    localStorage.setItem('mbg_cockpit_auth', 'stale');

    const result = await endSession();

    expect(result).toEqual({ ok: true });
    expect(localStorage.getItem('mbg_cockpit_auth')).toBeNull();
  });

  it('resolves rather than throwing, so the caller can always reload', async () => {
    vi.spyOn(accountClient, 'logOut').mockRejectedValue(new Error('boom'));
    await expect(endSession()).resolves.toBeDefined();
  });
});

/**
 * Second round of the same bug (2026-10-08), reported as "gabisa di log out"
 * even after the button existed and was wired up.
 *
 * There are TWO HttpOnly session cookies, and the logout path cleared only one:
 *
 *   mbg_session — account session   (/api/account/login → /api/account/logout)
 *   mbg_jwt     — owner cockpit     (/api/auth → had no delete path at all)
 *
 * App.jsx falls back to /api/auth when /api/account/me reports no account, so a
 * surviving `mbg_jwt` restored the session on the next reload. These tests exist
 * so a future edit cannot drop one half of the revocation again.
 */
describe('endSession revokes BOTH session cookies', () => {
  it('calls the owner-cockpit logout as well as the account logout', async () => {
    const accountSpy = vi.spyOn(accountClient, 'logOut').mockResolvedValue({ ok: true });
    const ownerSpy = vi.spyOn(accountClient, 'logOutOwner').mockResolvedValue({ ok: true });

    await endSession();

    expect(accountSpy).toHaveBeenCalledTimes(1);
    expect(ownerSpy).toHaveBeenCalledTimes(1);
  });

  it('revokes both even when the account logout fails', async () => {
    // The owner cookie is the one that used to survive. It must not depend on
    // the account endpoint succeeding.
    vi.spyOn(accountClient, 'logOut').mockRejectedValue(new Error('500'));
    const ownerSpy = vi.spyOn(accountClient, 'logOutOwner').mockResolvedValue({ ok: true });

    await endSession();

    expect(ownerSpy).toHaveBeenCalledTimes(1);
  });

  it('revokes both even when the owner logout fails', async () => {
    const accountSpy = vi.spyOn(accountClient, 'logOut').mockResolvedValue({ ok: true });
    vi.spyOn(accountClient, 'logOutOwner').mockRejectedValue(new Error('network'));

    await endSession();

    expect(accountSpy).toHaveBeenCalledTimes(1);
  });
});

describe('logOutOwner', () => {
  it('sends DELETE to /api/auth with credentials, the only way to clear mbg_jwt', async () => {
    // mbg_jwt is HttpOnly, so no client code can delete it. The DELETE route is
    // the sole mechanism, which is why this assertion pins the method and path.
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal('fetch', fetchSpy);

    const { logOutOwner } = accountClient;
    await logOutOwner();

    expect(fetchSpy).toHaveBeenCalledWith('/api/auth', expect.objectContaining({ method: 'DELETE' }));
  });

  it('never throws when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(accountClient.logOutOwner()).resolves.toEqual({ ok: false });
  });
});
