/**
 * Remove dead `.sidebar*` CSS left by the deleted Sidebar component.
 *
 * WHY THIS IS THE SECOND ATTEMPT, and what the first one got wrong. A
 * line-oriented version consumed "the selector line plus everything up to the
 * next closing brace". That broke the file twice over:
 *
 *   1. Inside `@media (pointer: coarse) { .telemetry-btn, .sidebar-nav-item { ... } }`
 *      it grabbed the media query's opening brace, walked to the first `}`, and
 *      left a media query with no body and no closing brace.
 *   2. It ate the terminating comment delimiter of the NEXT comment, silently
 *      commenting out every CSS rule below it.
 *
 * Both were caught by reading the output, not by the script itself. So this
 * version does two narrow things and then REFUSES to keep its own output unless
 * brace and comment delimiters balance. A half-applied CSS rewrite that still
 * parses is the dangerous outcome; failing loudly is the safe one.
 *
 *   - delete whole rules whose ENTIRE selector list is sidebar-only
 *   - rewrite selector lists in place when only some entries are sidebar rules
 *
 * `.app-layout` and `.main-content` live in the same region and ARE still used
 * (App.jsx:509, App.jsx:529), so they are explicitly protected rather than
 * removed by proximity.
 */

const fs = require('fs');
const path = require('path');

const CSS = path.join(__dirname, '..', 'frontend', 'src', 'index.css');
const source = fs.readFileSync(CSS, 'utf8');

/** Length of a balanced block starting at the opening-brace index. */
function blockLength(text, braceIndex) {
  let depth = 0;
  for (let j = braceIndex; j < text.length; j++) {
    if (text[j] === '{') depth++;
    else if (text[j] === '}') {
      depth--;
      if (depth === 0) return j - braceIndex + 1;
    }
  }
  return text.length - braceIndex;
}

function commentEnd(text, i) {
  const end = text.indexOf('*/', i + 2);
  return end === -1 ? text.length : end + 2;
}

/** Selectors that must survive even though they sit beside sidebar rules. */
const PROTECTED = /\.(app-layout|main-content)\b/;

const removals = [];
const rewrites = [];
let out = '';
let i = 0;

while (i < source.length) {
  // ---- comment ----
  if (source.startsWith('/*', i)) {
    const end = commentEnd(source, i);

    // If the comment directly describes a sidebar-only rule, it goes with it.
    const gap = (source.slice(end).match(/^\s*/) || [''])[0];
    const afterGap = source.slice(end + gap.length);
    const brace = afterGap.indexOf('{');

    if (brace !== -1 && !/\{/.test(afterGap.slice(0, brace))) {
      const selector = afterGap.slice(0, brace);
      const onlySidebar = /\.sidebar/.test(selector) && !PROTECTED.test(selector);
      if (onlySidebar) {
        const len = blockLength(afterGap, brace);
        removals.push(selector.trim().split('\n').pop().trim().slice(0, 70));
        i = end + gap.length + len;
        i += (source.slice(i).match(/^\n/) || [''])[0].length;
        continue;
      }
    }

    out += source.slice(i, end);
    i = end;
    continue;
  }

  // ---- possible selector ----
  const brace = source.indexOf('{', i);
  const close = source.indexOf('}', i);

  if (brace !== -1 && (close === -1 || brace < close)) {
    const selector = source.slice(i, brace);

    // A selector has no declarations and no stray braces.
    if (!/[;}]/.test(selector) && /\.sidebar/.test(selector)) {
      const parts = selector.split(',').map(p => p.trim()).filter(Boolean);
      const kept = parts.filter(p => !/\.sidebar/.test(p) || PROTECTED.test(p));

      if (kept.length === 0) {
        const len = blockLength(source, brace);
        removals.push(parts[0].slice(0, 70));
        i = brace + len;
        i += (source.slice(i).match(/^\n/) || [''])[0].length;
        // Drop the now-orphaned comment that described this rule. Done by
        // scanning backwards rather than with a lookbehind regex: the previous
        // attempt used /[^]*?/ which is not portable across JS engines and threw
        // a SyntaxError at load time.
        const tailStart = out.lastIndexOf('/*');
        if (tailStart !== -1) {
          const between = out.slice(tailStart);
          if (between.endsWith('*/') || /^\s*$/.test(between.replace(/\/\*[\s\S]*?\*\//, ''))) {
            out = out.slice(0, tailStart);
          }
        }
        continue;
      }

      const indent = (selector.match(/\n([ \t]*)$/) || [, ''])[1];
      rewrites.push({ dropped: parts.length - kept.length, kept });
      out += kept.join(',\n' + indent) + ' ';
      i = brace;
      continue;
    }
  }

  out += source[i];
  i++;
}

out = out.replace(/\n{3,}/g, '\n\n');

// ---------------------------------------------------------------------------
// Verification. Structural breakage means: do not write.
// ---------------------------------------------------------------------------
const openBrace = (out.match(/\{/g) || []).length;
const closeBrace = (out.match(/\}/g) || []).length;
const openComment = (out.match(/\/\*/g) || []).length;
const closeComment = (out.match(/\*\//g) || []).length;
const sidebarLeft = (out.match(/sidebar/gi) || []).length;
const balanced = openBrace === closeBrace && openComment === closeComment;

console.log(`Rules removed: ${removals.length}`);
removals.forEach(r => console.log(`  - ${r}`));
console.log(`Selector lists rewritten: ${rewrites.length}`);
rewrites.forEach(r => console.log(`  kept: ${r.kept.join(' | ')}`));
console.log(`Braces  : ${openBrace} / ${closeBrace} ${openBrace === closeBrace ? 'OK' : 'MISMATCH'}`);
console.log(`Comments: ${openComment} / ${closeComment} ${openComment === closeComment ? 'OK' : 'MISMATCH'}`);
console.log(`'sidebar' mentions left: ${sidebarLeft}`);
console.log(`Lines: ${source.split('\n').length} -> ${out.split('\n').length}`);

if (!balanced) {
  console.error('\nVERIFICATION FAILED. Not writing. Restore the file from git.');
  process.exit(1);
}

fs.writeFileSync(CSS, out, 'utf8');
console.log('\nWritten.');
