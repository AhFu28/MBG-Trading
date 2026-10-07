import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMarketOverview } from '../services/marketOverview.js';

/**
 * Loads the CoinMarketCap-style market overview for the Home dashboard.
 *
 * POLLING PHILOSOPHY
 * ------------------
 * These are whole-market aggregates, not a trade tape. CMC itself refreshes
 * them roughly once a minute. Polling faster would burn upstream rate limit for
 * numbers that have not changed, so this hook runs on a slow cadence.
 *
 * CACHING / STALE-ON-ERROR
 * ------------------------
 * If a refresh fails, we KEEP the previous data and mark it stale rather than
 * blanking the dashboard. What we never do is substitute a fabricated value —
 * a stale timestamped number is honest, an invented one is not.
 */

const REFRESH_MS = 90_000;

export function useMarketOverview({ enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  // Guards against a state update after unmount, and against overlapping
  // refreshes when a slow request outlives its interval.
  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);

  const load = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const result = await fetchMarketOverview();
      if (!mountedRef.current) return;
      setData(result);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      // fetchMarketOverview is written not to throw, but a future edit could
      // change that. Degrade to "stale", never to a crashed dashboard.
      setError(err?.message || 'Gagal memuat data pasar');
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      setLoading(false);
      return undefined;
    }

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [enabled, load]);

  return { data, loading, error, refresh: load };
}
