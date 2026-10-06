/**
 * Tests for chunk-load retry detection.
 *
 * CONTEXT
 * -------
 * Production showed the runtime recovery screen on 2026-10-06 for
 * `SecurityHubDrawer-C8h4s3MP.js`. That file was on the CDN answering HTTP 200,
 * and all nine chunks the main bundle references were present — one request
 * failed and React never retried it.
 *
 * Because the error boundary is the ROOT, that single dropped request replaced
 * the whole terminal. This module decides when a reload is the right answer.
 *
 * The two failure modes these tests pin down:
 *   - a real render bug must NOT reload (infinite loop)
 *   - a genuinely missing chunk must NOT reload forever
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  isChunkLoadFailure,
  shouldRetryChunkLoad,
  clearRetryGuard,
  CHUNK_RETRY_KEY,
} from '../chunkLoadRetry.js';

/** Minimal in-memory Storage so tests do not depend on jsdom's sessionStorage. */
function makeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    _dump: () => Object.fromEntries(map),
  };
}

describe('isChunkLoadFailure', () => {
  it('matches the exact production error', () => {
    const real = new TypeError(
      'Failed to fetch dynamically imported module: ' +
      'https://mbg-trading.pages.dev/assets/SecurityHubDrawer-C8h4s3MP.js'
    );
    expect(isChunkLoadFailure(real)).toBe(true);
  });

  it('matches Firefox wording', () => {
    expect(isChunkLoadFailure(new Error('Importing a module script failed.'))).toBe(true);
  });

  it('matches Safari wording', () => {
    expect(isChunkLoadFailure(new Error('error loading dynamically imported module'))).toBe(true);
  });

  it('matches webpack-style chunk errors', () => {
    expect(isChunkLoadFailure(new Error('Loading chunk 12 failed.'))).toBe(true);
    expect(isChunkLoadFailure(new Error('Loading CSS chunk 4 failed.'))).toBe(true);
  });

  it('does NOT match an ordinary render bug', () => {
    // This is the important one. Reloading a component that throws on every
    // render turns a broken tab into an infinite reload loop.
    expect(isChunkLoadFailure(new TypeError("Cannot read properties of undefined (reading 'map')"))).toBe(false);
    expect(isChunkLoadFailure(new Error('Objects are not valid as a React child'))).toBe(false);
    expect(isChunkLoadFailure(new Error('Network request failed'))).toBe(false);
  });

  it('tolerates null, undefined and strings', () => {
    expect(isChunkLoadFailure(null)).toBe(false);
    expect(isChunkLoadFailure(undefined)).toBe(false);
    expect(isChunkLoadFailure('')).toBe(false);
    expect(isChunkLoadFailure('Failed to fetch dynamically imported module')).toBe(true);
  });
});

describe('shouldRetryChunkLoad', () => {
  let storage;

  beforeEach(() => {
    storage = makeStorage();
  });

  it('retries on the first chunk failure of a session', () => {
    const result = shouldRetryChunkLoad(
      new TypeError('Failed to fetch dynamically imported module: /assets/X-abc.js'),
      storage
    );
    expect(result.retry).toBe(true);
    expect(result.reason).toBe('first-failure-this-session');
  });

  it('sets the guard so a second failure does not reload again', () => {
    const err = new TypeError('Failed to fetch dynamically imported module');
    shouldRetryChunkLoad(err, storage);
    expect(storage.getItem(CHUNK_RETRY_KEY)).toBe('1');

    const second = shouldRetryChunkLoad(err, storage);
    expect(second.retry).toBe(false);
    expect(second.reason).toBe('already-retried-this-session');
  });

  it('never retries a non-chunk error', () => {
    const result = shouldRetryChunkLoad(new Error('Cannot read properties of null'), storage);
    expect(result.retry).toBe(false);
    expect(result.reason).toBe('not-a-chunk-load-failure');
    // And it must not have consumed the guard.
    expect(storage.getItem(CHUNK_RETRY_KEY)).toBeNull();
  });

  it('does not retry when storage is unavailable', () => {
    // Without storage there is no way to remember the attempt, so a reload loop
    // is possible. Showing the screen is the safe choice.
    const result = shouldRetryChunkLoad(
      new TypeError('Failed to fetch dynamically imported module'),
      null
    );
    expect(result.retry).toBe(false);
    expect(result.reason).toBe('no-storage');
  });

  it('does not retry when storage refuses writes (private mode)', () => {
    const throwing = {
      getItem: () => null,
      setItem: () => { throw new Error('QuotaExceededError'); },
      removeItem: () => {},
    };
    const result = shouldRetryChunkLoad(
      new TypeError('Failed to fetch dynamically imported module'),
      throwing
    );
    expect(result.retry).toBe(false);
    expect(result.reason).toBe('storage-write-failed');
  });
});

describe('clearRetryGuard', () => {
  it('clears the guard so a later failure can retry again', () => {
    const storage = makeStorage({ [CHUNK_RETRY_KEY]: '1' });
    clearRetryGuard(storage);
    expect(storage.getItem(CHUNK_RETRY_KEY)).toBeNull();

    const result = shouldRetryChunkLoad(
      new TypeError('Failed to fetch dynamically imported module'),
      storage
    );
    expect(result.retry).toBe(true);
  });

  it('survives a storage that throws', () => {
    const throwing = { removeItem: () => { throw new Error('nope'); } };
    expect(() => clearRetryGuard(throwing)).not.toThrow();
    expect(() => clearRetryGuard(null)).not.toThrow();
  });
});

describe('wiring in main.jsx', () => {
  it('the error boundary uses the shared decision, not its own copy', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const src = fs.readFileSync(
      path.resolve(process.cwd(), 'src/main.jsx'),
      'utf8'
    );

    // A second inlined regex would drift from the tested one.
    expect(src).toContain('shouldRetryChunkLoad');
    expect(src).toContain('clearRetryGuard');
    expect(src).not.toMatch(/Failed to fetch dynamically imported module/);
  });

  it('the manual reset clears the retry guard too', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const src = fs.readFileSync(
      path.resolve(process.cwd(), 'src/main.jsx'),
      'utf8'
    );
    // localStorage.clear() does not touch sessionStorage. Without this line the
    // manual reset button could not re-attempt the failed chunk.
    expect(src).toContain('clearRetryGuard()');
  });
});
