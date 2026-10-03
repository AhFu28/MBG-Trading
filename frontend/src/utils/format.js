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

/**
 * Format a plain number with Indonesian separators (no currency prefix).
 * 16800 -> "16.800"
 */
export function formatIdNumber(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return '—';
  return idrFormatter.format(Math.round(num));
}

/**
 * Format an IDR amount: 16800 -> "Rp 16.800"
 * Falls back to "Rp —" for missing/invalid values.
 */
export function formatIdr(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return 'Rp —';
  return 'Rp ' + idrFormatter.format(Math.round(num));
}

/**
 * Format a USD amount: 1234.5 -> "$1,234.50"
 * Falls back to "$—" for missing/invalid values.
 */
export function formatUsd(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return '$—';
  return '$' + usdFormatter.format(num);
}

/**
 * Format a signed percentage: 1.234 -> "+1.23%", -0.5 -> "-0.50%"
 */
export function formatPct(n, digits = 2) {
  const num = Number(n);
  if (!Number.isFinite(num)) return '—';
  const sign = num > 0 ? '+' : '';
  return sign + num.toFixed(digits) + '%';
}
