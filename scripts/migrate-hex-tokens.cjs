/**
 * H-2: migrate the five hex colours DESIGN.md forbids explicitly to their tokens.
 *
 * WHY THESE FIVE FIRST. The audit found 1,494 hardcoded hex values across 271
 * distinct colours. Migrating all of them is a multi-session job, and a partial
 * migration that leaves the palette half-tokenised is not obviously better than
 * none. These five are different: DESIGN.md names them by value as forbidden,
 * and they account for 387 occurrences — a quarter of the total, concentrated in
 * the newest surfaces. Clearing them is both the highest-value slice and the one
 * the design contract is unambiguous about.
 *
 * The tokens already exist (index.css defines --accent-sky, --accent-emerald,
 * --accent-gold-bright, --accent-mint and friends), so this changes no colour on
 * screen. It changes who owns the value: the theme file, not 40 components.
 *
 * NOT DONE, deliberately: #ffffff, #000000, #94a3b8, #64748b, rgba() literals,
 * and the remaining ~260 colours. Those need a per-surface decision about which
 * token is semantically right, and guessing would replace one wrong value with
 * another. Left for a follow-up pass with eyes on each screen.
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'frontend', 'src');

/**
 * Value -> token. Only entries DESIGN.md lists as forbidden, plus the two
 * greys that already have an obvious token counterpart.
 */
const MAP = {
  '#38bdf8': 'var(--accent-sky)',
  '#10b981': 'var(--accent-emerald)',
  '#f59e0b': 'var(--accent-gold)',
  '#34d399': 'var(--accent-mint)',
  '#60a5fa': 'var(--accent-sky-soft)',
};

/** Files excluded, with a reason each. */
const SKIP = new Set([
  'changelogData.js', // historical record; see the em-dash commit for the same rule
  'index.css',        // this is the file that DEFINES the tokens
]);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '__tests__') continue;
      walk(full, out);
    } else if (/\.(jsx?|mjs)$/.test(e.name)) {
      out.push(full);
    }
  }
  return out;
}

let files = 0;
let replacements = 0;
const perFile = [];

for (const file of walk(SRC)) {
  if (SKIP.has(path.basename(file))) continue;

  let text = fs.readFileSync(file, 'utf8');
  const original = text;
  let n = 0;

  for (const [hex, token] of Object.entries(MAP)) {
    // Case-insensitive: the same colour appears as #38BDF8 in places.
    const re = new RegExp(hex.replace('#', '#'), 'gi');
    const matches = text.match(re);
    if (!matches) continue;
    n += matches.length;
    text = text.replace(re, token);
  }

  if (text !== original) {
    fs.writeFileSync(file, text, 'utf8');
    files++;
    replacements += n;
    perFile.push(`${path.basename(file)}: ${n}`);
  }
}

console.log(`Files: ${files}`);
console.log(`Replacements: ${replacements}`);
console.log(perFile.sort().join('\n'));
