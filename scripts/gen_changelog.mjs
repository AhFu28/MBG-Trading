#!/usr/bin/env node
/**
 * gen_changelog.mjs — generate docs/CHANGELOG_AUTO.md from git log (E-6).
 *
 * WHY: the hand-written changelog went stale because nothing updates it after a
 * push. This script derives a draft from what git actually recorded. It never
 * invents an entry: a day with no commit simply does not appear.
 *
 * Usage:
 *   node scripts/gen_changelog.mjs               # write the draft + summary
 *   node scripts/gen_changelog.mjs --check       # CI: exit 1 when stale
 *   node scripts/gen_changelog.mjs --include-bot # keep automated data commits
 *
 * STALENESS THRESHOLD: 14 days.
 *   Rationale: this repo commits in bursts — feature work, then quiet stretches
 *   (weekends, release freezes). 7 days would fail on an ordinary quiet week;
 *   30 days would hide a genuinely abandoned changelog. --check fails when:
 *     1. git log has no dated commit, or
 *     2. the newest commit is older than 14 days, or
 *     3. the on-disk draft differs from what git log would generate right now.
 *
 * Deterministic output: the draft carries no wall-clock timestamp, so it only
 * changes when git history changes (no churn in CI commits).
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_PATH = resolve(REPO_ROOT, 'docs/CHANGELOG_AUTO.md');
const STALE_AFTER_DAYS = 14;
const COMMIT_LIMIT = 3000;

// Automated data-bundle commits land every hour and carry no human change.
// Excluded by default; --include-bot puts them back.
const BOT_COMMIT_PATTERNS = [/^chore\(data\): automated bundle refresh/i, /\[skip ci\]/i];

/**
 * REDACTION — mandatory, not cosmetic.
 *
 * Commit subjects are copied verbatim into a draft that the hourly workflow
 * commits to this repository, which is PUBLIC. History proves subjects can carry
 * things that must not be republished on a schedule: d92ae72 named the partner's
 * phone number, and 32bb44c described removing a committed secret. Without this
 * step the generator would undo the redaction already applied to the curated
 * changelog, and would keep undoing it every hour.
 *
 * Scrubbing is best-effort; findForbidden() below is the backstop that refuses to
 * write a draft when anything still looks sensitive.
 */
const LITERAL_SECRETS = ['MBG-APEX-JWT-PEPPER-V1'];

const REDACTION_RULES = [
  // Indonesian mobile only. The first version was (?:\+?62|0)[\s.-]?8[\d\s.-]{6,}\d,
  // which also swallowed things like "0.8.20261012" — a version number, not a phone.
  // Requiring the 62 prefix (with \b) or a leading 08 keeps ordinary numbering safe.
  { pattern: /(?:\b\+?62[\s.-]?8[\d\s.-]{6,}\d)|\b08[\d\s.-]{7,}\d/g, replacement: '[nomor disunting]' },
  { pattern: /[\w.+-]+@[\w-]+\.[\w.-]+/g, replacement: '[email disunting]' },
  { pattern: /\beyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]{8,}\b/g, replacement: '[token disunting]' },
  { pattern: /\b[0-9a-fA-F]{32,}\b/g, replacement: '[hash disunting]' },
  { pattern: /\b[A-Za-z0-9+/]{40,}={0,2}\b/g, replacement: '[nilai panjang disunting]' },
];

/**
 * PROVE THE REDACTION WORKS.
 *
 * The redaction is the only thing standing between commit history and a public
 * file that CI commits every hour. An untested guard rots: a later edit that
 * loosens a pattern would publish PII silently, because an ordinary run has no
 * sensitive sample to trip over.
 *
 * So this mode plants known-bad strings, asserts each is scrubbed AND leaves no
 * residue, asserts the backstop fires on text that was never scrubbed, and asserts
 * a harmless commit subject is left alone. Run it in CI next to the generator.
 */
function selftest() {
  const cases = [
    // Fixtures use SYNTHETIC numbers on purpose. The first version embedded the
    // partner's real number to prove the pattern matched, which put that number
    // into a public repository as test data — the same leak this file exists to
    // prevent. A pattern is proved just as well by a fake that has the same shape.
    { name: 'mobile with +62, spaced', input: 'handoff to Mas Fuad (+62 812-0000-0000)', must: '[nomor disunting]' },
    { name: 'mobile without +, inside a URL', input: 'see wa.me/6281200000000', must: '[nomor disunting]' },
    { name: 'local 08 form', input: 'call 0812-0000-0000 today', must: '[nomor disunting]' },
    { name: 'email address', input: 'ping naufalarib60@gmail.com', must: '[email disunting]' },
    { name: 'JWT-like token', input: 'tok eyJhbGciOiJIUzI1NiJ9.eyJraW5kIjoib3duZXIifQ.abc123def456', must: '[token disunting]' },
    { name: 'long hex blob', input: 'hash baab58aa11bb22cc33dd44ee55ff66aa77bb88cc here', must: '[hash disunting]' },
    { name: 'known pepper literal', input: 'pepper MBG-APEX-JWT-PEPPER-V1 leaked', must: '[nilai disunting]' },
  ];

  let failed = 0;
  for (const c of cases) {
    const out = redact(c.input);
    if (!out.includes(c.must)) {
      console.error('  FAIL ' + c.name + ' -> not scrubbed: ' + out);
      failed++;
      continue;
    }
    const residue = findForbidden(out);
    if (residue.length > 0) {
      console.error('  FAIL ' + c.name + ' -> residue: ' + residue.join(', '));
      failed++;
      continue;
    }
    console.log('  ok   ' + c.name);
  }

  // The backstop must fire on something never scrubbed, or it guards nothing.
  const raw = '+62 812-0000-0000 and someone@example.com';
  if (findForbidden(raw).length === 0) {
    console.error('  FAIL findForbidden() did not flag unscrubbed input — the backstop is dead');
    failed++;
  } else {
    console.log('  ok   backstop flags unscrubbed input');
  }

  // And it must NOT flag a harmless line, or every hourly run would fail.
  const harmless = 'fix(trust): honest model label, no fake progress bar, real USD/IDR rate';
  const cleanResidue = findForbidden(harmless);
  if (cleanResidue.length > 0) {
    console.error('  FAIL findForbidden() flagged a harmless subject (' + cleanResidue.join(', ') + '): ' + harmless);
    failed++;
  } else {
    console.log('  ok   harmless subject passes untouched');
  }

  // Version strings must survive: the phone rule used to eat them.
  const versioned = 'chore: bump to 0.8.20261012';
  if (redact(versioned) !== versioned) {
    console.error('  FAIL version string was mangled: ' + redact(versioned));
    failed++;
  } else {
    console.log('  ok   version string survives');
  }

  if (failed > 0) {
    console.error('redaction selftest: ' + failed + ' failure(s) — refusing to trust the draft');
    process.exit(1);
  }
  console.log('redaction selftest: all ' + (cases.length + 3) + ' checks passed');
}

function redact(text) {
  let out = String(text || '');
  for (const secret of LITERAL_SECRETS) out = out.split(secret).join('[nilai disunting]');
  for (const rule of REDACTION_RULES) out = out.replace(rule.pattern, rule.replacement);
  return out;
}

// Kept separate from REDACTION_RULES on purpose: a scrub that silently misses
// must still fail the run rather than publish.
const FORBIDDEN_OUTPUT = [
  { name: 'phone number', pattern: /(?:\b\+?62[\s.-]?8[\d\s.-]{6,}\d)|\b08[\d\s.-]{7,}\d/ },
  { name: 'email address', pattern: /[\w.+-]+@[\w-]+\.[\w.-]+/ },
  { name: 'JWT-like token', pattern: /\beyJ[\w-]{8,}\.[\w-]{8,}/ },
  { name: 'long hex string', pattern: /\b[0-9a-fA-F]{32,}\b/ },
];

function findForbidden(text) {
  const hits = [];
  for (const rule of FORBIDDEN_OUTPUT) {
    const m = String(text).match(rule.pattern);
    if (m) hits.push(rule.name + ' -> ' + m[0].slice(0, 24));
  }
  return hits;
}

const TYPES = [
  { id: 'feat', label: 'Features', pattern: /^feat(\(.+?\))?!?:/i },
  { id: 'fix', label: 'Fixes', pattern: /^fix(\(.+?\))?!?:/i },
  { id: 'perf', label: 'Performance', pattern: /^perf(\(.+?\))?!?:/i },
  { id: 'refactor', label: 'Refactors', pattern: /^refactor(\(.+?\))?!?:/i },
  { id: 'docs', label: 'Docs', pattern: /^docs(\(.+?\))?!?:/i },
  { id: 'test', label: 'Tests', pattern: /^test(\(.+?\))?!?:/i },
  { id: 'chore', label: 'Chores & Data', pattern: /^(chore|build|ci|style)(\(.+?\))?!?:/i },
];

function runGit(args) {
  return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function readCommits({ includeBot }) {
  const FIELD = '\u001f';
  const raw = runGit(['log', `--pretty=format:%H${FIELD}%ad${FIELD}%s`, '--date=short', '-n', String(COMMIT_LIMIT)]);
  const commits = raw.split('\n').filter(Boolean).map(line => {
    const [hash, date, subject] = line.split(FIELD);
    return { hash, date, subject: redact(subject || '') };
  });
  if (includeBot) return commits;
  return commits.filter(c => !BOT_COMMIT_PATTERNS.some(p => p.test(c.subject)));
}

function classify(subject) {
  const found = TYPES.find(t => t.pattern.test(subject));
  return found ? found.id : 'other';
}

function buildMarkdown(commits) {
  const byDate = new Map();
  for (const c of commits) {
    if (!byDate.has(c.date)) byDate.set(c.date, []);
    byDate.get(c.date).push(c);
  }
  const dates = [...byDate.keys()].sort((a, b) => (a < b ? 1 : -1));
  const lines = [];
  lines.push('# CHANGELOG (auto-generated draft)');
  lines.push('');
  lines.push('> Generated by `scripts/gen_changelog.mjs` from `git log`. Do not hand-edit:');
  lines.push('> the next run overwrites it. Curated release notes live in the Changelog tab.');
  lines.push('>');
  lines.push('> Automated data-bundle commits ([skip ci]) are excluded by default.');
  lines.push('> The draft is deterministic — no wall-clock timestamp.');
  lines.push('');
  if (commits.length === 0) {
    lines.push('_No commits matched. Nothing to report._');
    lines.push('');
    return { markdown: lines.join('\n'), dates, total: 0 };
  }
  for (const date of dates) {
    lines.push('## ' + date);
    lines.push('');
    const groups = new Map();
    for (const c of byDate.get(date)) {
      const id = classify(c.subject);
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id).push(c);
    }
    for (const type of TYPES) {
      const items = groups.get(type.id);
      if (!items) continue;
      lines.push('### ' + type.label);
      lines.push('');
      for (const c of items) lines.push('- ' + c.subject + ' (`' + c.hash.slice(0, 7) + '`)');
      lines.push('');
    }
    const other = groups.get('other');
    if (other) {
      lines.push('### Other');
      lines.push('');
      for (const c of other) lines.push('- ' + c.subject + ' (`' + c.hash.slice(0, 7) + '`)');
      lines.push('');
    }
  }
  return { markdown: lines.join('\n') + '\n', dates, total: commits.length };
}

function newestDate(commits) {
  return commits.reduce((max, c) => (c.date > max ? c.date : max), '');
}

function daysSince(dateString) {
  if (!dateString) return Infinity;
  const then = Date.parse(dateString + 'T00:00:00Z');
  if (Number.isNaN(then)) return Infinity;
  return Math.floor((Date.now() - then) / 86400000);
}

function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  const includeBot = args.includes('--include-bot');
  if (args.includes('--selftest')) {
    selftest();
    return;
  }
  const commits = readCommits({ includeBot });
  const { markdown, dates, total } = buildMarkdown(commits);
  const forbidden = findForbidden(markdown);
  if (forbidden.length > 0) {
    for (const h of forbidden) console.error('::error::draft looks sensitive, refusing to write -> ' + h);
    console.error('Tighten REDACTION_RULES in scripts/gen_changelog.mjs. Do NOT weaken this check.');
    process.exit(1);
  }
  const newest = newestDate(commits);
  const ageDays = daysSince(newest);

  if (!checkOnly) {
    mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
    const previous = existsSync(OUTPUT_PATH) ? readFileSync(OUTPUT_PATH, 'utf8') : '';
    writeFileSync(OUTPUT_PATH, markdown, 'utf8');
    console.log('changelog: ' + total + ' commit(s) across ' + dates.length + ' day(s)');
    console.log('changelog: newest commit ' + (newest || 'n/a') + ' (' + (ageDays === Infinity ? 'n/a' : ageDays) + ' day(s) ago)');
    console.log('changelog: ' + (previous === markdown ? 'unchanged' : 'updated') + ' -> docs/CHANGELOG_AUTO.md');
    return;
  }

  const failures = [];
  const onDisk = existsSync(OUTPUT_PATH) ? readFileSync(OUTPUT_PATH, 'utf8') : null;
  if (onDisk === null) failures.push('docs/CHANGELOG_AUTO.md does not exist');
  else if (onDisk !== markdown) failures.push('docs/CHANGELOG_AUTO.md is out of date with git log');
  if (ageDays === Infinity) failures.push('git log has no dated commit');
  else if (ageDays > STALE_AFTER_DAYS) failures.push('newest commit is ' + ageDays + ' day(s) old (limit ' + STALE_AFTER_DAYS + ')');

  if (failures.length > 0) {
    for (const f of failures) console.error('::error::changelog stale: ' + f);
    console.error('Run: node scripts/gen_changelog.mjs');
    process.exit(1);
  }
  console.log('changelog OK: ' + total + ' commit(s), newest ' + newest + ' (' + ageDays + ' day(s) ago)');
}

main();
