/**
 * MBG Terminal — Shared Number & Currency Formatters (Single Source of Truth)
 * ---------------------------------------------------------------------------
 * IDR values ALWAYS use Indonesian separators (16.800) regardless of the
 * browser locale. USD values always use US separators (1,234.56).
 * Use these helpers instead of bare .toLocaleString() so numbers render
 * consistently for every user.
 */

const idrFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
const usdFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function isRealNumber(n) {
  if (n === null || n === undefined || typeof n === 'boolean' || n === '') return false;
  const num = Number(n);
  return Number.isFinite(num);
}

/**
 * Format a plain number with Indonesian separators (no currency prefix).
 * 16800 -> "16.800"
 */
export function formatIdNumber(n) {
  if (!isRealNumber(n)) return '—';
  return idrFormatter.format(Math.round(Number(n)));
}

/**
 * Format an IDR amount: 16800 -> "Rp 16.800"
 * Falls back to "Rp —" for missing/invalid values. Never turns null into zero.
 */
export function formatIdr(n) {
  if (!isRealNumber(n)) return 'Rp —';
  return 'Rp ' + idrFormatter.format(Math.round(Number(n)));
}

/**
 * Format a USD amount: 1234.5 -> "$1,234.50"
 * Falls back to "$—" for missing/invalid values. Never turns null into zero.
 */
export function formatUsd(n) {
  if (!isRealNumber(n)) return '$—';
  return '$' + usdFormatter.format(Number(n));
}

/**
 * Format a signed percentage: 1.234 -> "+1.23%", -0.5 -> "-0.50%"
 * Falls back to "—" for missing/invalid values. Never turns null into zero.
 */
export function formatPct(n, digits = 2) {
  if (!isRealNumber(n)) return '—';
  const num = Number(n);
  const sign = num > 0 ? '+' : '';
  return sign + num.toFixed(digits) + '%';
}
