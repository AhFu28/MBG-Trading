import React, { useMemo } from 'react';

/**
 * MarketTicker — one horizontal strip that mixes several markets.
 *
 * WHY THIS EXISTS (WP4, request from Jendral Arib):
 * the landing ticker used to show only five hardcoded coins (crypto only, no
 * market badge) and Home had no price ticker at all. This component is the
 * single shared renderer for both pages.
 *
 * HONESTY RULES (project-wide, non-negotiable):
 *  - A missing price renders as an em dash, never as 0 (a fabricated zero would
 *    look like a real quote).
 *  - The strip is a snapshot of whatever the caller passed in. It does not
 *    claim to be live: callers must either refresh on a timer or pass
 *    updatedAt so the 'Diperbarui HH:MM' stamp is shown.
 */

/** Display order: IDX -> US -> FX -> Komoditas -> Crypto. */
const MARKET_ORDER = ['IDX', 'US', 'FX', 'CMDTY', 'CRYPTO'];

const MARKET_BADGE = {
  IDX: 'IDX',
  US: 'US',
  FX: 'FX',
  CMDTY: 'CMDTY',
  CRYPTO: 'CRYPTO',
};

/**
 * Map the many market tags used across the app onto the five ticker buckets.
 * livePrices uses FOREX/COMMODITY while the cross-market service uses
 * FX/COMMODITY, so both spellings must land on the same badge.
 */
export function normalizeMarket(market) {
  const m = String(market || '').toUpperCase();
  if (m === 'COMMODITY' || m === 'CMDTY' || m === 'COM') return 'CMDTY';
  if (m === 'FOREX' || m === 'FX_IDC') return 'FX';
  if (!m) return 'LAIN';
  return m;
}

function marketRank(market) {
  const i = MARKET_ORDER.indexOf(normalizeMarket(market));
  return i === -1 ? MARKET_ORDER.length : i;
}

/** Format a quote with sane precision. Never invents a number. */
export function formatTickerPrice(value) {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  if (abs >= 1) return n.toFixed(2);
  if (abs >= 0.01) return n.toFixed(4);
  return n.toFixed(8);
}

export default function MarketTicker({
  items = [],
  speedSec = 46,
  showMarketBadge = true,
  onSelect = null,
  updatedAt = null,
  ariaLabel = 'Pita harga pasar lintas pasar',
}) {
  const ordered = useMemo(() => {
    const safe = Array.isArray(items) ? items.filter(it => it && it.symbol) : [];
    return safe
      .map((it, i) => ({ ...it, __index: i }))
      .sort((a, b) => (marketRank(a.market) - marketRank(b.market)) || (a.__index - b.__index));
  }, [items]);

  if (ordered.length === 0) {
    // Nothing to show is not an error; the caller decides on its own empty state.
    return null;
  }

  // Duplicated once so translateX(-50%) loops seamlessly.
  const loopItems = ordered.concat(ordered);
  const stamp = updatedAt ? new Date(updatedAt) : null;
  const stampValid = !!stamp && !Number.isNaN(stamp.getTime());
  const clickable = typeof onSelect === 'function';

  return (
    <div className="market-ticker" aria-label={ariaLabel}>
      <div className="market-ticker-viewport">
        <div className="market-ticker-track" style={{ animationDuration: speedSec + 's' }}>
          {loopItems.map((it, i) => {
            const market = normalizeMarket(it.market);
            const rawChange = it.change;
            const change = rawChange === null || rawChange === undefined || rawChange === '' ? null : Number(rawChange);
            const changeValid = change !== null && Number.isFinite(change);
            const changeClass = changeValid ? (change < 0 ? 'is-down' : 'is-up') : 'is-flat';
            const handleClick = clickable ? () => onSelect(it) : undefined;
            const handleKeyDown = clickable
              ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(it); } }
              : undefined;
            const itemClass = 'market-ticker-item' + (clickable ? ' market-ticker-item-clickable' : '');
            const badgeClass = 'market-ticker-badge market-ticker-badge-' + market.toLowerCase();
            const changeClassName = 'market-ticker-change ' + changeClass;
            const changeLabel = changeValid ? (change >= 0 ? '+' : '') + change.toFixed(2) + '%' : '—';
            return (
              <span
                key={market + '-' + it.symbol + '-' + i}
                className={itemClass}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
              >
                {showMarketBadge && (
                  <span className={badgeClass}>{MARKET_BADGE[market] || market}</span>
                )}
                <b className="market-ticker-symbol">{it.symbol}</b>
                <span className="market-ticker-price">{formatTickerPrice(it.price)}</span>
                <span className={changeClassName}>{changeLabel}</span>
              </span>
            );
          })}
        </div>
      </div>
      {stampValid && (
        <div className="market-ticker-stamp">
          {'Diperbarui ' + stamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
}
