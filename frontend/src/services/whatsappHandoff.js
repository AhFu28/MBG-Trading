/**
 * One-click WhatsApp handoff to Mas Fuad.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every "Untuk Mas Fuad" block was plain screen text. Naufal had to copy it,
 * switch to WhatsApp, paste it, and send — every single time. This module turns
 * those blocks into a link that opens WhatsApp with the message already typed,
 * so the only remaining step is pressing Send.
 *
 * HONEST LIMITS (do not overstate this in the UI):
 *   • wa.me can PRE-FILL a message but can never send it. WhatsApp requires a
 *     human tap. Any claim of "fully automatic" would be false.
 *   • It opens on whichever device the link is clicked from. On a desktop
 *     without WhatsApp installed, it falls back to web.whatsapp.com.
 *
 * PRIVACY & CONFIGURATION:
 *   Configured via environment variable `VITE_MAS_FUAD_WHATSAPP` (or defaults to
 *   Mas Fuad's operations line). Indonesian formats are supported and will be
 *   automatically normalized to digits-only international format.
 */

export const MAS_FUAD_WHATSAPP =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAS_FUAD_WHATSAPP) ||
  (typeof process !== 'undefined' && process.env?.VITE_MAS_FUAD_WHATSAPP) ||
  '+62 812-2417-0187';

/** Normalise any human-entered number into wa.me's digits-only form. */
export function normalizePhone(raw) {
  const digits = String(raw || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  // Indonesian numbers are written several ways; wa.me wants 62-prefixed digits.
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

export function isConfigured() {
  return normalizePhone(MAS_FUAD_WHATSAPP).length >= 10;
}

/**
 * Build a wa.me link with the message pre-filled.
 *
 * Returns null when no number is configured, so callers can hide the button
 * rather than render a link that goes nowhere.
 */
export function buildWhatsAppLink(message, { phone = MAS_FUAD_WHATSAPP } = {}) {
  const digits = normalizePhone(phone);
  if (digits.length < 10) return null;

  const text = String(message || '').trim();
  if (!text) return `https://wa.me/${digits}`;

  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/**
 * Strip the decoration from a "Untuk Mas Fuad" block so the pasted WhatsApp
 * message reads like a normal human message, not a code block.
 *
 * Removes the heading, blockquote markers, bold markers and the surrounding
 * quotes, while keeping the Javanese text itself untouched.
 */
export function cleanForWhatsApp(block) {
  return String(block || '')
    // Drop the heading line.
    .replace(/^\s*#*\s*💬\s*Untuk Mas Fuad\s*:?\s*$/gim, '')
    // Drop blockquote markers at the start of each line.
    .replace(/^\s*>\s?/gm, '')
    // Unwrap whole-line emphasis: "*text*" or **text** spanning the line.
    // These are WhatsApp's OWN bold/italic markers, so leaving them would make
    // the message render as literal asterisks instead of plain text.
    .replace(/^\s*\*{1,2}(.+?)\*{1,2}\s*$/gm, '$1')
    // Remove the surrounding quotes that wrap a spoken aside.
    .replace(/^\s*["“](.+?)["”]\s*$/gm, '$1')
    .replace(/^(.+?)"\*$/gm, '$1')
    .replace(/^\*"(.+?)$/gm, '$1')
    // Inline emphasis in the middle of a line.
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    // Stray quote or asterisk left at a paragraph boundary.
    .replace(/^\s*["“]\s*/gm, '')
    .replace(/\s*["”]\s*$/gm, '')
    // Emphasis markers that ended up mid-line because the source text wrapped
    // across lines. WhatsApp would render these as literal asterisks.
    .replace(/(^|\s)\*{1,2}(\S)/g, '$1$2')
    .replace(/(\S)\*{1,2}(\s|$)/g, '$1$2')
    .replace(/\*{1,2}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Convenience: a ready-to-use message for the common "status update" case.
 * Kept short on purpose — long WhatsApp messages do not get read.
 */
export function buildStatusMessage({ title, points = [], closing }) {
  const lines = [];
  if (title) lines.push(title);
  if (points.length) {
    lines.push('');
    for (const p of points) lines.push(`• ${p}`);
  }
  if (closing) {
    lines.push('');
    lines.push(closing);
  }
  return lines.join('\n');
}
