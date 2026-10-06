/**
 * Chunk-load failure detection and retry guarding.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every `lazy()` import in this app rejects into the root error boundary when
 * its network request fails. Production hit this on 2026-10-06: the recovery
 * screen appeared for `SecurityHubDrawer-C8h4s3MP.js` while that file was on the
 * CDN answering HTTP 200, and all nine chunks the main bundle references were
 * present. One dropped request replaced the whole terminal with an error screen,
 * and React never re-tried.
 *
 * Retrying is the right response, but it has to be narrow. Two failure modes
 * matter:
 *
 *   1. A genuine render bug. Reloading a component that throws on every render
 *      is an infinite loop, so only chunk-load errors may trigger a retry.
 *
 *   2. A chunk that is genuinely gone (a deploy rotated the hash while the page
 *      was open). Reloading cannot fix that, so the retry is allowed once per
 *      session and the recovery screen shows from then on.
 *
 * Kept out of main.jsx so the branching can be tested without booting React.
 */

/**
 * Messages browsers use when a dynamic import fails at the network layer.
 *
 * Deliberately matches only import/loading failures. A generic "TypeError:
 * undefined is not a function" from inside a loaded chunk must NOT match, or a
 * real bug would be papered over with a reload.
 */
const CHUNK_LOAD_FAILURE = new RegExp([
  'Failed to fetch dynamically imported module',   // Chromium
  'Importing a module script failed',              // Firefox
  'error loading dynamically imported module',     // Safari
  'Loading chunk \\d+ failed',                     // webpack-style
  'Loading CSS chunk \\d+ failed',
].join('|'), 'i');

export const CHUNK_RETRY_KEY = 'mbg_chunk_retry_done';

/**
 * True when the error is a network-level module load failure.
 * @param {unknown} error
 * @returns {boolean}
 */
export function isChunkLoadFailure(error) {
  const text = String((error && error.message) || error || '');
  return CHUNK_LOAD_FAILURE.test(text);
}

/**
 * Decide whether to reload now.
 *
 * @param {unknown} error             the caught error
 * @param {Storage} [storage]         injectable for tests; defaults to sessionStorage
 * @returns {{ retry: boolean, reason: string }}
 */
export function shouldRetryChunkLoad(error, storage) {
  if (!isChunkLoadFailure(error)) {
    return { retry: false, reason: 'not-a-chunk-load-failure' };
  }

  let store = storage;
  if (store === undefined) {
    try {
      store = sessionStorage;
    } catch (e) {
      store = null;
    }
  }

  // No usable storage means no way to prevent a reload loop. Show the screen.
  if (!store) {
    return { retry: false, reason: 'no-storage' };
  }

  try {
    if (store.getItem(CHUNK_RETRY_KEY) === '1') {
      return { retry: false, reason: 'already-retried-this-session' };
    }
    store.setItem(CHUNK_RETRY_KEY, '1');
    return { retry: true, reason: 'first-failure-this-session' };
  } catch (e) {
    // Private mode throws on setItem. Same reasoning: do not risk a loop.
    return { retry: false, reason: 'storage-write-failed' };
  }
}

/**
 * Clear the once-per-session guard so a later failure can retry again.
 * Called after the app has settled, not on mount — React commits the Suspense
 * fallback first, so clearing on mount would fire while chunks are in flight.
 *
 * @param {Storage} [storage]
 */
export function clearRetryGuard(storage) {
  let store = storage;
  if (store === undefined) {
    try {
      store = sessionStorage;
    } catch (e) {
      return;
    }
  }
  try {
    if (store) store.removeItem(CHUNK_RETRY_KEY);
  } catch (e) {}
}
