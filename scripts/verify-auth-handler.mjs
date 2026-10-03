#!/usr/bin/env node
/**
 * TRUST01 runtime test for frontend/functions/api/auth.js.
 *
 * Executes the real Pages Function handlers under Node's Web Crypto compatibility
 * layer. This is a unit-level harness, not a Cloudflare Pages deployment test.
 *
 *   node scripts/verify-auth-handler.mjs
 *
 * Exit code 0 = all assertions pass, 1 = at least one failure.
 */
import { createHash } from 'node:crypto';
import { onRequestGet, onRequestPost } from '../frontend/functions/api/auth.js';

const sha256hex = (s) => createHash('sha256').update(s).digest('hex');
const PASSWORD = 'correct-horse-battery-staple';
const PASSWORD_HASH = sha256hex(PASSWORD);
const JWT_SECRET = 'unit-test-secret-value-0123456789';

let failed = 0;
function check(name, cond, detail) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : `  --> ${detail}`}`);
  if (!cond) failed++;
}

function postRequest(password, ip) {
  return new Request('https://mbg.test/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip },
    body: JSON.stringify({ password })
  });
}

function getRequest(cookie) {
  const headers = cookie ? { Cookie: cookie } : {};
  return new Request('https://mbg.test/api/auth', { method: 'GET', headers });
}

// 1. Correct password issues a signed HttpOnly session cookie.
const okRes = await onRequestPost({ env: { PASSWORD_HASH, JWT_SECRET }, request: postRequest(PASSWORD, '10.0.0.1') });
const okBody = await okRes.json();
const setCookie = okRes.headers.get('Set-Cookie') || '';
check('correct password -> 200', okRes.status === 200, `status=${okRes.status}`);
check('correct password -> authenticated:true', okBody.authenticated === true, JSON.stringify(okBody));
check('correct password -> expiresAt returned', typeof okBody.expiresAt === 'number' && okBody.expiresAt > Date.now(), JSON.stringify(okBody));
check('correct password -> server-issued tier in response (TRUST03)', okBody.tier === 'PRO', `tier=${okBody.tier}`);
check('session cookie is HttpOnly+Secure+SameSite=Strict', /HttpOnly/.test(setCookie) && /Secure/.test(setCookie) && /SameSite=Strict/.test(setCookie), setCookie);
check('auth responses are Cache-Control: no-store', okRes.headers.get('Cache-Control') === 'no-store', okRes.headers.get('Cache-Control'));
check('no Clear/plaintext password echoed in body', !JSON.stringify(okBody).includes(PASSWORD), JSON.stringify(okBody));

const sessionCookie = setCookie.split(';')[0]; // mbg_jwt=<token>

// 2. The former hardcoded bypasses must fail.
const mbgRes = await onRequestPost({ env: { PASSWORD_HASH, JWT_SECRET }, request: postRequest('mbg', '10.0.0.2') });
check("hardcoded 'mbg' -> 401", mbgRes.status === 401, `status=${mbgRes.status}`);

const legacyRes = await onRequestPost({ env: { PASSWORD_HASH, JWT_SECRET }, request: postRequest('MBG::Xk9#Tr4d3!C0ckp1t_Zw&Qr7', '10.0.0.3') });
check('legacy plaintext password -> 401', legacyRes.status === 401, `status=${legacyRes.status}`);

const wrongRes = await onRequestPost({ env: { PASSWORD_HASH, JWT_SECRET }, request: postRequest('nope', '10.0.0.4') });
check('wrong password -> 401', wrongRes.status === 401, `status=${wrongRes.status}`);

// 3. Server verifies the cookie; a forged/tampered token is denied.
const noCookieRes = await onRequestGet({ env: { PASSWORD_HASH, JWT_SECRET }, request: getRequest(null) });
check('GET with no cookie -> 401', noCookieRes.status === 401, `status=${noCookieRes.status}`);

const forged = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  Buffer.from(JSON.stringify({ authenticated: true, expiresAt: Date.now() + 86400000 })).toString('base64url') + '.forged';
const forgedRes = await onRequestGet({ env: { PASSWORD_HASH, JWT_SECRET }, request: getRequest(`mbg_jwt=${forged}`) });
check('GET with forged token -> 401', forgedRes.status === 401, `status=${forgedRes.status}`);

// Tamper a SIGNIFICANT signature bit: the last base64 char of a 3-char group
// only encodes discarded bits, so flipping it is a no-op (the old test bug).
const tampered = sessionCookie.slice(0, -3) + (sessionCookie.slice(-3, -2) === 'A' ? 'B' : 'A') + sessionCookie.slice(-2);
const tamperedRes = await onRequestGet({ env: { PASSWORD_HASH, JWT_SECRET }, request: getRequest(tampered) });
check('GET with tampered signature -> 401', tamperedRes.status === 401, `status=${tamperedRes.status}`);

const validRes = await onRequestGet({ env: { PASSWORD_HASH, JWT_SECRET }, request: getRequest(sessionCookie) });
const validBody = await validRes.json();
check('GET with real cookie -> 200 authenticated:true', validRes.status === 200 && validBody.authenticated === true, `status=${validRes.status} body=${JSON.stringify(validBody)}`);
check('GET with real cookie -> server-issued tier PRO (TRUST03)', validRes.status === 200 && validBody.tier === 'PRO', `tier=${validBody.tier}`);

// 4. Owner directive (2026-09-30, reconfirmed 3 Okt): with PASSWORD_HASH unset,
// the gate falls back to the documented default password MBG (sha256-verified
// by the sentinel); JWT_SECRET is derived from the active hash so sessions
// auto-invalidate when the password rotates.
const defaultRes = await onRequestPost({ env: { JWT_SECRET }, request: postRequest('MBG', '10.0.0.5') });
check('missing PASSWORD_HASH -> default MBG accepted -> 200', defaultRes.status === 200, `status=${defaultRes.status}`);

const defaultWrongRes = await onRequestPost({ env: { JWT_SECRET }, request: postRequest('nope', '10.0.0.6') });
check('missing PASSWORD_HASH -> wrong password -> 401', defaultWrongRes.status === 401, `status=${defaultWrongRes.status}`);

const derivedPost = await onRequestPost({ env: { PASSWORD_HASH }, request: postRequest(PASSWORD, '10.0.0.7') });
const derivedCookie = (derivedPost.headers.get('Set-Cookie') || '').split(';')[0];
check('missing JWT_SECRET -> login still 200 (derived secret)', derivedPost.status === 200, `status=${derivedPost.status}`);
const derivedGet = await onRequestGet({ env: { PASSWORD_HASH }, request: getRequest(derivedCookie) });
const derivedBody = await derivedGet.json().catch(() => ({}));
check('missing JWT_SECRET -> session verifies -> 200 authenticated', derivedGet.status === 200 && derivedBody.authenticated === true, `status=${derivedGet.status}`);

const derivedForged = await onRequestGet({ env: { PASSWORD_HASH }, request: getRequest(`mbg_jwt=${forged}`) });
check('missing JWT_SECRET -> forged token -> 401', derivedForged.status === 401, `status=${derivedForged.status}`);

console.log(`\n${failed === 0 ? 'auth handler runtime test: PASS' : `auth handler runtime test: FAIL (${failed})`}`);
process.exit(failed === 0 ? 0 : 1);
