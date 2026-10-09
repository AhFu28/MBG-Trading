import { useState, useCallback, useEffect, useMemo } from 'react';

/**
 * Cross-component watchlist.
 *
 * WHY THIS IS NEW (Jendral Arib, 2026-10-08):
 *   "ada pilihan watch list, jadi ticker manapun yg di centang pilihan watch
 *    list, bisa masuk watch list yg ada di home"
 *
 * The audit found NO star toggle existed anywhere in the terminal. The only
 * watchlist was a free-text input on its own tab, storing a bare array of
 * ticker strings under `mbg_user_watchlist`. That shape cannot express which
 * MARKET a ticker belongs to, so `BBCA` and a crypto `BBCA` would collide, and
 * a starred row could not be routed back to the right desk.
 *
 * This hook keeps a richer record and stays backward compatible: it migrates
 * the old string array on first read, so an existing user keeps their list.
 *
 * SYNC ACROSS COMPONENTS: `storage` events only fire across browser TABS, not
 * within one. Since many components mount the star toggle at once, this module
 * also keeps an in-memory subscriber list so every mounted consumer re-renders
 * together. Without that, starring a coin in the table would not update the
 * watchlist panel sitting next to it.
 */

const STORAGE_KEY = 'mbg_user_watchlist_v2';
const LEGACY_KEY = 'mbg_user_watchlist';

/** Infer the market for a bare legacy ticker so old entries still resolve. */
function inferMarket(ticker) {
  const t = String(ticker || '').toUpperCase();
  if (/USDT$/.test(t)) return 'CRYPTO';
  if (/^(BBCA|BBRI|BMRI|TLKM|ASII|AMMN|GOTO|ANTM|ADRO|ICBP|INDF|UNVR|KLBF|SMGR|INTP|BRPT|TPIA|CUAN|BREN|MEDC|PGAS|PTBA|ITMG|UNTR|MDKA|MBMA|BBNI|BRIS|BSDE|CTRA|SMRA|EXCL|ISAT|TOWR|TBIG|MNCN|SCMA|ACES|MAPI|ERAA|ARTO|BBTN|BJTM|BJBR)$/.test(t)) return 'IDX';
  if (/^(AAPL|MSFT|NVDA|GOOGL|AMZN|META|TSLA|AMD|NFLX|INTC|AVGO|JPM|BAC|V|MA|DIS|KO|PEP|XOM|CVX|WMT|COST|CRM|ORCL|ADBE|QCOM|MU|SNAP|HIMS|AMC|PLTR|COIN|MSTR|SHOP|UBER|ABNB|SQ|PYPL|BA|CAT|GE|F|GM|T|VZ|PFE|MRK|JNJ|LLY|ABBV|UNH|HD|NKE|SBUX|MCD)$/.test(t)) return 'US';
  if (/^(XAUUSD|XAGUSD|USOIL|UKOIL|DXY|GOLD|SILVER|BRENT|WTI)$/.test(t)) return 'COMMODITY';
  if (/^[A-Z]{6}$/.test(t)) return 'FOREX';
  return 'CRYPTO';
}

function normalizeEntry(symbol, market) {
  const sym = String(symbol || '').trim().toUpperCase().replace('$', '');
  if (!sym) return null;
  return {
    symbol: sym,
    market: (market || inferMarket(sym)).toUpperCase(),
    key: `${(market || inferMarket(sym)).toUpperCase()}:${sym}`,
  };
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map(e => normalizeEntry(e?.symbol, e?.market))
          .filter(Boolean);
      }
    }
  } catch {
    // Corrupt JSON or storage disabled — fall through to the legacy read.
  }

  // One-time migration from the old bare-string array.
  try {
    const legacyRaw = localStorage.getItem(LEGACY_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw);
      if (Array.isArray(parsed)) {
        return parsed.map(s => normalizeEntry(s)).filter(Boolean);
      }
    }
  } catch {
    // Nothing to migrate.
  }

  return [];
}

// In-memory subscribers so every mounted star toggle stays in sync within the
// same tab (the `storage` event does not cover this case).
const subscribers = new Set();
let memoryEntries = null;

function readEntries() {
  if (memoryEntries === null) memoryEntries = readStored();
  return memoryEntries;
}

function publish(next) {
  memoryEntries = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    localStorage.setItem(LEGACY_KEY, JSON.stringify(next.map(e => e.symbol)));
  } catch {
    // Storage may be full or disabled. The in-memory list still works for this
    // session, which is better than losing the click entirely.
  }
  for (const fn of subscribers) fn(next);
}

export function useWatchlist() {
  const [entries, setEntries] = useState(() => readEntries());

  useEffect(() => {
    const listener = (next) => setEntries(next);
    subscribers.add(listener);

    // Another tab changed the list.
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        memoryEntries = null;
        const fresh = readEntries();
        for (const fn of subscribers) fn(fresh);
      }
    };
    window.addEventListener('storage', onStorage);

    // Re-sync in case the list changed between render and effect.
    setEntries(readEntries());

    return () => {
      subscribers.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const has = useCallback(
    (symbol, market) => {
      const entry = normalizeEntry(symbol, market);
      if (!entry) return false;
      return entries.some(e => e.symbol === entry.symbol && e.market === entry.market);
    },
    [entries],
  );

  const toggle = useCallback((symbol, market) => {
    const entry = normalizeEntry(symbol, market);
    if (!entry) return;
    const current = readEntries();
    const exists = current.some(e => e.symbol === entry.symbol && e.market === entry.market);
    const next = exists
      ? current.filter(e => !(e.symbol === entry.symbol && e.market === entry.market))
      : [...current, entry];
    publish(next);
  }, []);

  const add = useCallback((symbol, market) => {
    const entry = normalizeEntry(symbol, market);
    if (!entry) return;
    const current = readEntries();
    if (current.some(e => e.symbol === entry.symbol && e.market === entry.market)) return;
    publish([...current, entry]);
  }, []);

  const remove = useCallback((symbol, market) => {
    const entry = normalizeEntry(symbol, market);
    if (!entry) return;
    publish(readEntries().filter(e => !(e.symbol === entry.symbol && e.market === entry.market)));
  }, []);

  const clear = useCallback(() => publish([]), []);

  return useMemo(
    () => ({ entries, has, toggle, add, remove, clear, count: entries.length }),
    [entries, has, toggle, add, remove, clear],
  );
}

/** Test seam: reset module memory between tests. */
export function __resetWatchlistMemory() {
  memoryEntries = null;
  subscribers.clear();
}
