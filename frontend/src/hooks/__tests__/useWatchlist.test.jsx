import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWatchlist, __resetWatchlistMemory } from '../useWatchlist.js';
import { renderHook, act } from '@testing-library/react';

function makeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
    _map: map,
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', makeStorage());
  __resetWatchlistMemory();
});

describe('useWatchlist', () => {
  it('starts empty when nothing is stored', () => {
    const { result } = renderHook(() => useWatchlist());
    expect(result.current.entries).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it('adds a starred ticker and reports it as watched', () => {
    const { result } = renderHook(() => useWatchlist());

    act(() => result.current.toggle('BTC', 'CRYPTO'));

    expect(result.current.has('BTC', 'CRYPTO')).toBe(true);
    expect(result.current.entries).toHaveLength(1);
  });

  it('unstars on a second toggle', () => {
    const { result } = renderHook(() => useWatchlist());

    act(() => result.current.toggle('BTC', 'CRYPTO'));
    act(() => result.current.toggle('BTC', 'CRYPTO'));

    expect(result.current.has('BTC', 'CRYPTO')).toBe(false);
    expect(result.current.entries).toEqual([]);
  });

  it('keeps the same symbol in different markets apart', () => {
    // The old bare-string list could not express this: a US ticker and a crypto
    // pair sharing a symbol would collide.
    const { result } = renderHook(() => useWatchlist());

    act(() => result.current.toggle('BTC', 'CRYPTO'));
    act(() => result.current.toggle('BBCA', 'IDX'));

    expect(result.current.has('BTC', 'CRYPTO')).toBe(true);
    expect(result.current.has('BBCA', 'IDX')).toBe(true);
    expect(result.current.has('BTC', 'IDX')).toBe(false);
    expect(result.current.entries).toHaveLength(2);
  });

  it('normalizes symbols so casing and a leading $ do not create duplicates', () => {
    const { result } = renderHook(() => useWatchlist());

    act(() => result.current.add('btc', 'crypto'));
    act(() => result.current.add('$BTC', 'CRYPTO'));

    expect(result.current.entries).toHaveLength(1);
  });

  it('migrates a legacy bare-string watchlist instead of dropping it', () => {
    // An existing user has ["BBRI","BTCUSDT"]. Losing that on upgrade would be
    // a silent data loss bug.
    vi.stubGlobal('localStorage', makeStorage({
      mbg_user_watchlist: JSON.stringify(['BBRI', 'BTCUSDT']),
    }));
    __resetWatchlistMemory();

    const { result } = renderHook(() => useWatchlist());

    expect(result.current.entries).toHaveLength(2);
    expect(result.current.has('BBRI', 'IDX')).toBe(true);
    expect(result.current.has('BTCUSDT', 'CRYPTO')).toBe(true);
  });

  it('persists to localStorage under the new key', () => {
    const { result } = renderHook(() => useWatchlist());

    act(() => result.current.add('ETH', 'CRYPTO'));

    const stored = JSON.parse(localStorage.getItem('mbg_user_watchlist_v2'));
    expect(stored).toEqual([{ symbol: 'ETH', market: 'CRYPTO', key: 'CRYPTO:ETH' }]);
  });

  it('clears the whole list', () => {
    const { result } = renderHook(() => useWatchlist());
    act(() => result.current.add('ETH', 'CRYPTO'));
    act(() => result.current.add('SOL', 'CRYPTO'));

    act(() => result.current.clear());

    expect(result.current.entries).toEqual([]);
  });

  it('ignores an empty symbol rather than storing a blank row', () => {
    const { result } = renderHook(() => useWatchlist());

    act(() => result.current.add('   ', 'CRYPTO'));

    expect(result.current.entries).toEqual([]);
  });

  it('survives corrupt stored JSON', () => {
    vi.stubGlobal('localStorage', makeStorage({ mbg_user_watchlist_v2: '{not json' }));
    __resetWatchlistMemory();

    expect(() => renderHook(() => useWatchlist())).not.toThrow();
  });

  /**
   * REGRESSION — the reported bug: "nambah di watch list, gamuncul di home".
   *
   * The original fault was that one component kept its own state while another
   * read a different storage key, so a star added in one place never reached the
   * other. The fix routes every consumer through this hook's `subscribers` fan-out.
   *
   * Why this test exists: all ten tests above mount the hook ONCE. None of them
   * mounts two consumers, so deleting the `subscribers` Set entirely would have
   * left the whole file green — the exact reported bug could come back silently.
   * This test fails if `publish()` stops notifying subscribers.
   */
  it('notifies a second mounted consumer when the first one adds a ticker', () => {
    const star = renderHook(() => useWatchlist());
    const home = renderHook(() => useWatchlist());

    // Both start empty — this is the "home" panel before any starring.
    expect(home.result.current.entries).toEqual([]);

    act(() => star.result.current.add('BBCA', 'IDX'));

    // The second consumer is a peer component, NOT a re-render of the first.
    expect(home.result.current.has('BBCA', 'IDX')).toBe(true);
    expect(home.result.current.entries).toHaveLength(1);
    expect(home.result.current.count).toBe(1);
  });

  /**
   * REGRESSION — the legacy key must keep being written.
   *
   * Older code and any not-yet-migrated reader still look at
   * `mbg_user_watchlist` (a bare symbol array). `publish()` writes both keys so
   * those readers stay correct. Dropping the legacy write left every test above
   * green, because only the v2 key was ever asserted.
   */
  it('mirrors the flat symbol list into the legacy key on publish', () => {
    const { result } = renderHook(() => useWatchlist());

    act(() => result.current.add('BBCA', 'IDX'));
    act(() => result.current.add('ETH', 'CRYPTO'));

    const legacy = JSON.parse(localStorage.getItem('mbg_user_watchlist'));
    expect(legacy).toEqual(['BBCA', 'ETH']);
  });

  it('removes a ticker for every consumer, not just the caller', () => {
    const star = renderHook(() => useWatchlist());
    const home = renderHook(() => useWatchlist());

    act(() => star.result.current.add('TLKM', 'IDX'));
    expect(home.result.current.has('TLKM', 'IDX')).toBe(true);

    act(() => home.result.current.remove('TLKM', 'IDX'));

    // Removal propagates the same way addition does — the original bug had
    // removal working in one direction only.
    expect(star.result.current.has('TLKM', 'IDX')).toBe(false);
    expect(star.result.current.entries).toEqual([]);
  });
});
