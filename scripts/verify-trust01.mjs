#!/usr/bin/env node
/**
 * TRUST01 sentinel test.
 *
 * Proves the shared/browser-trusted auth bypass is gone from source and — when a
 * production build exists — from the shipped bundle. Run from the repo root:
 *
 *   node scripts/verify-trust01.mjs
 *
 * Exit code 0 = all checks pass, 1 = at least one regression.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const results = [];
let failed = 0;

function read(rel) {
  const p = join(root, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
}

function mustNotContain(rel, needle, label) {
  const src = read(rel);
  const ok = src !== null && !src.includes(needle);
  results.push({ ok, label: `${rel} must not contain ${label}` });
  if (!ok) failed++;
}

function mustContain(rel, needle, label) {
  const src = read(rel);
  const ok = src !== null && src.includes(needle);
  results.push({ ok, label: `${rel} must contain ${label}` });
  if (!ok) failed++;
}

// 1. Client gate: no hardcoded credential path, server-verified session.
const gate = 'frontend/src/components/PasswordGate.jsx';
mustNotContain(gate, "=== 'mbg'", "hardcoded 'mbg' comparison");
mustNotContain(gate, 'testMode', 'client-minted testMode session');
mustNotContain(gate, 'parsed?.authenticated', 'localStorage-trusted authenticated flag');
mustContain(gate, "credentials: 'same-origin'", 'cookie-backed server session');
mustContain(gate, 'authenticated !== true', 'server confirmation before setAuthed');
mustContain(gate, '/api/auth', 'server session verification on mount');

// 2. Server handler: no legacy hashes, no fallback signing secret literal.
// Owner directive (2026-09-30, reconfirmed 3 Okt): the live gate password stays
// "MBG" - the DEFAULT_PASSWORD_HASH fallback is allowed but MUST be exactly
// sha256("MBG") so it cannot be silently swapped for another password.
const auth = 'frontend/functions/api/auth.js';
mustNotContain(auth, 'd35bdd04ef763e558fec2f040990482f9375e9027e10f277786422c7dd8d182b', 'legacy sha256 of lowercase mbg');
mustNotContain(auth, '286713785e8fbca141922642c96747842acd886f6da2f7598d0bc8554b8c3e18', 'legacy default hash');
mustNotContain(auth, 'fallback-secret-for-dev', 'fallback JWT signing secret');
mustNotContain(auth, "password === 'mbg'", "plaintext 'mbg' comparison");
mustContain(auth, 'env.PASSWORD_HASH', 'documented PASSWORD_HASH env var');
mustContain(auth, 'timingSafe', 'constant-time-safe comparison');
mustContain(auth, 'Set-Cookie', 'signed HttpOnly session cookie');
mustContain(auth, 'resolveAuthConfig', 'centralized auth config resolution');
mustContain(auth, 'deriveJwtSecret', 'derived JWT secret (auto-invalidates on rotation)');
{
  const src = read(auth);
  const m = src && src.match(/DEFAULT_PASSWORD_HASH\s*=\s*'([0-9a-f]{64})'/);
  const expected = createHash('sha256').update('MBG').digest('hex');
  const okDefault = m !== null && m[1] === expected;
  results.push({ ok: okDefault, label: 'DEFAULT_PASSWORD_HASH equals sha256("MBG") exactly (owner decision)' });
  if (!okDefault) failed++;
}

// 3. Shipped production bundle (optional, when frontend/dist exists).
const distAssets = join(root, 'frontend', 'dist', 'assets');
if (existsSync(distAssets)) {
  const forbidden = [
    'd35bdd04ef763e558fec2f040990482f9375e9027e10f277786422c7dd8d182b',
    '286713785e8fbca141922642c96747842acd886f6da2f7598d0bc8554b8c3e18',
    'fallback-secret-for-dev',
    'testMode'
  ];
  let scanned = 0;
  let hit = false;
  for (const name of readdirSync(distAssets)) {
    const p = join(distAssets, name);
    if (!statSync(p).isFile() || !name.endsWith('.js')) continue;
    scanned++;
    const js = readFileSync(p, 'utf8');
    for (const f of forbidden) {
      if (js.includes(f)) {
        hit = true;
        results.push({ ok: false, label: `frontend/dist/assets/${name} must not contain ${f}` });
        failed++;
      }
    }
  }
  results.push({ ok: !hit, label: `production bundle scanned (${scanned} JS chunks) contains no auth-secret literals` });
} else {
  results.push({ ok: true, label: 'frontend/dist not built yet — bundle scan skipped' });
}

for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.label}`);
}
console.log(`\n${failed === 0 ? 'TRUST01 sentinel: PASS' : `TRUST01 sentinel: FAIL (${failed} check(s))`}`);
process.exit(failed === 0 ? 0 : 1);
