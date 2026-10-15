import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

/**
 * THE OWNER COCKPIT MUST IDENTIFY ITSELF AS ADMIN.
 *
 * Bug reported by the owner (2026-10-10):
 *   "kenapa untuk admin masih kena notif ini untuk pro, ini untuk legend"
 *
 * Root cause: /api/auth (the legacy owner route) answered with
 * `{ tier: 'PRO' }` and nothing else — no identity, no admin flag. The browser
 * therefore resolved the owner as PRO, and the render gate
 * `!isAdmin && !canAccess(...)` showed him the "Khusus Pro" / "Khusus Legend"
 * lock screens.
 *
 * These tests pin the two halves of the fix:
 *   1. the server signs and returns an owner claim that says "admin", and
 *   2. the client stops hardcoding PRO and reads the flag it was given.
 *
 * They also pin the SECURITY boundary that makes the fix safe: an account token
 * (kind: 'account', signed by /api/account/login) must never be promoted to
 * admin by the owner route. Both token families share the same cookie space.
 *
 * adminAccess.test.jsx covers the tier/render chain. This file covers the
 * identity that feeds it.
 */

const read = (rel) => fs.readFileSync(new URL(rel, import.meta.url), 'utf8');

/**
 * Strip comments before a NEGATIVE assertion.
 *
 * The route's own documentation quotes the old `tier: 'PRO'` line to explain the
 * bug, so a raw text search matches the explanation rather than the code. Absence
 * must be asserted against executable source only.
 */
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const authSrc = read('../../../functions/api/auth.js');
const authCode = stripComments(authSrc);
const appSrc = read('../../App.jsx');

describe('owner route issues an admin identity', () => {
  it('tags the owner token with kind: owner', () => {
    expect(authSrc).toMatch(/kind:\s*'owner'/);
  });

  it('answers the owner session with isAdmin from the verified claim', () => {
    expect(authSrc).toMatch(/isAdmin:\s*isAdminGranted/);
  });

  it('grants the owner admin, per the directive of 2026-10-15', () => {
    /**
     * OWNER DIRECTIVE (Jendral Arib, 2026-10-15):
     *   "pass MBG itu hanya untuk akses admin, dan untuk bagian admin pastikan
     *    semua fitur terbuka."
     *
     * This SUPERSEDES the earlier fail-closed rule that withheld admin while the
     * signing key was derivable. That rule was correct in isolation and wrong in
     * practice: it capped the owner at PRO and locked him out of his own desks.
     */
    expect(authCode).not.toMatch(/isOwner && secretIsConfigured/);
    expect(authSrc).toMatch(/const isAdminGranted = isOwner;/);
  });

  it('still reports how strong the admin claim is, instead of hiding it', () => {
    // Granting admin without saying the token is forgeable would be the silent
    // half of this change. secretIsConfigured is still measured and surfaced.
    expect(authSrc).toMatch(/secretIsConfigured: !!env\.JWT_SECRET/);
    expect(authSrc).toMatch(/adminForgeable/);
    expect(authCode).toMatch(/wrangler pages secret put JWT_SECRET/);
  });

  it('never issues a PRO tier from the owner route any more', () => {
    expect(authCode).not.toMatch(/tier:\s*'PRO'/);
  });

  it('issues the lower-case tier the rest of the account API uses', () => {
    // /api/account/me returns 'free' / 'pro' and CmcTopNav compares
    // account.tier === 'legend', so an upper-case tier here breaks the badge.
    expect(authCode).toMatch(/tier:\s*'legend'/);
    expect(authCode).not.toMatch(/tier:\s*'LEGEND'/);
  });
});

describe('account tokens can never be promoted to admin by the owner route', () => {
  it('recognises the owner by an explicit kind or by the EXACT legacy token shape', () => {
    expect(authSrc).toMatch(/payload\.kind === 'owner'/);
    expect(authSrc).toMatch(/payload\.kind === undefined/);
    // The legacy branch must be matched exactly, not by truthiness: "any token
    // that happens to carry a tier" would promote a future token family that
    // forgets to set `kind`.
    expect(authSrc).toMatch(/payload\.authenticated === true/);
    expect(authSrc).toMatch(/payload\.tier === 'PRO'/);
    expect(authSrc).not.toMatch(/kind === undefined && !!payload\.tier/);
  });

  it('never grants admin to an account token', () => {
    // The protection that still matters. An 'account' token carries
    // kind: 'account', so isOwner is false for it, and the GET claim follows
    // isOwner — never the tier, never unconditionally.
    expect(authCode).toMatch(/isAdmin:\s*isAdminGranted/);
    expect(authCode).not.toMatch(/isAdmin:\s*isOwner\b/);
    // The owner is still identified by an explicit kind, so an account token
    // (kind: 'account') can never take the owner branch.
    expect(authSrc).toMatch(/const isOwner = payload\.kind === 'owner'/);
  });

  it('puts the POST admin grant INSIDE the password-match branch', () => {
    /**
     * The POST grant is legitimate precisely because it is unreachable without a
     * successful constant-time password comparison. Asserted structurally: the
     * grant must sit after 'if (isMatch) {' and before the rejection path. A
     * future edit that hoists it to the top level would hand admin to any token
     * holder, and this test fails before that can ship.
     */
    const branch = authCode.indexOf('if (isMatch) {');
    const grant = authCode.indexOf('isAdmin: true');
    const rejected = authCode.indexOf('Invalid credentials');
    expect(branch, 'the password-match branch is gone').toBeGreaterThan(-1);
    expect(grant, 'the POST admin grant is gone').toBeGreaterThan(branch);
    expect(rejected, 'the rejection path is gone').toBeGreaterThan(grant);
  });
});

describe('client reads the owner identity instead of inventing it', () => {
  it('no longer hardcodes tier pro for the owner session', () => {
    expect(appSrc).not.toMatch(/tier:\s*'pro',\s*isPro:\s*true,\s*owner:\s*true/);
  });

  it('takes isAdmin from the /api/auth response body', () => {
    expect(appSrc).toMatch(/isAdmin:\s*!!body\.isAdmin/);
  });
});
