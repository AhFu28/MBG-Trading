import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import {
  canAccess,
  requiredTierFor,
  MODULES,
  MODULE_TIER,
  TIER,
  allowedModules,
  lockedModules,
} from '../../services/featureAccess.js';
import { legendEligible } from '../../services/achievements.js';
import LegendDeskTab from '../LegendDeskTab.jsx';

/**
 * ADMIN MUST NEVER BE LOCKED OUT OF ANY MODULE.
 *
 * The owner's requirement (2026-10-09), stated in his own words:
 *   "jangan sampe admin gabisa buka fitur2"
 *
 * WHY THIS FILE EXISTS
 *
 * Access is decided by a chain of five separate checks spread across three files:
 *   1. App.jsx       derives `isAdmin` from the host/port/email.
 *   2. App.jsx       derives `userTier` ('LEGEND' when admin).
 *   3. App.jsx       gates rendering on `!isAdmin && !canAccess(...)`.
 *   4. featureAccess canAccess() short-circuits `if (isAdmin) return true`.
 *   5. LegendDeskTab re-checks `legendEligible(ctx, tier, isAdmin)` internally.
 *
 * Any ONE of those being reordered or tightened silently locks the owner out of
 * his own execution desk. Nothing covered this before — the suites that passed
 * were testing tiers, not the admin bypass. These tests pin the whole chain.
 */

beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  });
});

describe('admin bypass — canAccess', () => {
  it('grants an admin EVERY registered module', () => {
    const ids = Object.keys(MODULE_TIER);
    expect(ids.length).toBeGreaterThan(20); // guard against an empty/gutted map

    const denied = ids.filter(id => !canAccess(id, TIER.GUEST, true));
    expect(denied, `admin locked out of: ${denied.join(', ')}`).toEqual([]);
  });

  it('grants an admin the two LEGEND desks specifically', () => {
    // These are the flagship paid features; a regression here is the exact
    // failure the owner asked us to prevent.
    expect(canAccess(MODULES.TRADING_BOT, TIER.GUEST, true)).toBe(true);
    expect(canAccess(MODULES.JEV_EXECUTION, TIER.GUEST, true)).toBe(true);
  });

  it('grants an admin even a module id that is not registered', () => {
    // The bypass must precede the MODULE_TIER lookup. If a refactor moves the
    // `if (isAdmin)` line below `const required = MODULE_TIER[moduleId]`, an
    // unknown id starts returning false for the owner — this catches that.
    expect(canAccess('SOME_MODULE_REGISTERED_LATER', TIER.GUEST, true)).toBe(true);
    // ...while a non-admin still correctly gets denied for the same id.
    expect(canAccess('SOME_MODULE_REGISTERED_LATER', TIER.LEGEND, false)).toBe(false);
  });

  it('reports every module as allowed and none as locked for an admin', () => {
    // allowedModules/lockedModules do not take isAdmin, so they reflect the
    // LEGEND tier. Sanity-check that LEGEND itself already sees the desks —
    // which is what userTier resolves to when isAdmin is true.
    expect(allowedModules(TIER.LEGEND)).toContain(MODULES.TRADING_BOT);
    expect(lockedModules(TIER.LEGEND)).not.toContain(MODULES.TRADING_BOT);
    expect(lockedModules(TIER.LEGEND)).not.toContain(MODULES.JEV_EXECUTION);
  });

  it('still denies a plain guest, so the bypass is not a blanket open door', () => {
    // A guard against "fix the admin case by disabling the gate entirely".
    expect(canAccess(MODULES.TRADING_BOT, TIER.GUEST, false)).toBe(false);
    expect(canAccess(MODULES.JEV_EXECUTION, TIER.GUEST, false)).toBe(false);
  });
});

describe('admin bypass — the App.jsx render gate', () => {
  const appSrc = fs.readFileSync(
    path.resolve(__dirname, '../../App.jsx'),
    'utf8',
  );

  it('derives isAdmin from the local host, port and admin emails', () => {
    expect(appSrc).toMatch(/const isLocalDev = /);
    expect(appSrc).toMatch(/window\.location\.hostname === 'localhost'/);
    expect(appSrc).toMatch(/window\.location\.hostname === '127\.0\.0\.1'/);
    expect(appSrc).toMatch(/const isAdmin = isLocalDev/);
  });

  it('resolves an admin to LEGEND tier before consulting the server tier', () => {
    // If the server-tier branch ever moves above this line, an admin account
    // without a paid tier would collapse to FREE/PRO and get gated.
    const idxAdminReturn = appSrc.indexOf("if (isAdmin) return 'LEGEND';");
    const idxServerTier = appSrc.indexOf('const serverTier =');
    expect(idxAdminReturn).toBeGreaterThan(-1);
    expect(idxServerTier).toBeGreaterThan(-1);
    expect(idxAdminReturn).toBeLessThan(idxServerTier);
  });

  it('keeps the isAdmin short-circuit in the locked-module render test', () => {
    // `!isAdmin &&` is what makes the locked panel unreachable for the owner.
    expect(appSrc).toMatch(/!isAdmin && !canAccess\(activeTab, userTier, isAdmin\)/);
  });

  it('passes isAdmin down to LegendDeskTab', () => {
    const idx = appSrc.indexOf('<LegendDeskTab');
    expect(idx).toBeGreaterThan(-1);
    const callSite = appSrc.slice(idx, idx + 300);
    expect(callSite).toMatch(/isAdmin=\{isAdmin\}/);
    expect(callSite).toMatch(/userTier=\{userTier\}/);
    expect(callSite).toMatch(/moduleId=\{activeTab\}/);
  });
});

describe('admin bypass — legendEligible', () => {
  it('passes an admin unconditionally, with reason "admin"', () => {
    const result = legendEligible({}, TIER.GUEST, true);
    expect(result.eligible).toBe(true);
    expect(result.reason).toBe('admin');
  });

  it('does not require achievements for an admin', () => {
    // Empty context = zero achievements unlocked. A non-admin is refused here;
    // the owner must not be.
    expect(legendEligible({}, TIER.GUEST, false).eligible).toBe(false);
    expect(legendEligible({}, TIER.GUEST, true).eligible).toBe(true);
  });
});

describe('admin bypass — LegendDeskTab renders for an admin', () => {
  it('shows the desk instead of the locked screen', () => {
    render(
      <LegendDeskTab
        moduleId="TRADING_BOT"
        userTier={TIER.GUEST}
        isAdmin
        onNavigate={() => {}}
      />,
    );

    // The desk itself must be present. Match the command-bar headline
    // specifically — "GROKTAGON" alone also appears in the log-feed title.
    expect(screen.getByText(/THE GROKTAGON \/\/ AUTONOMOUS BOT ARENA/i)).toBeDefined();
    // ...and the locked screen must not be.
    expect(screen.queryByText('Modul Khusus Legend & Admin')).toBeNull();
    expect(screen.queryByText(/Belum Terbuka/)).toBeNull();
  });

  it('marks simulated performance as simulated for the admin too', () => {
    // Seeing the desk is only safe if the numbers on it are labelled. The
    // honesty banner is not tier-dependent — it renders for everyone.
    render(
      <LegendDeskTab
        moduleId="TRADING_BOT"
        userTier={TIER.LEGEND}
        isAdmin
        onNavigate={() => {}}
      />,
    );
    expect(screen.getByText(/SIMULASI/i)).toBeDefined();
  });

  it('shows the JEV horizon when opened from the JEV_EXECUTION route', () => {
    render(
      <LegendDeskTab
        moduleId="JEV_EXECUTION"
        userTier={TIER.GUEST}
        isAdmin
        onNavigate={() => {}}
      />,
    );
    // Match the JEV panel headline specifically — "Jev" alone also appears in
    // the view-switcher button and the log feed, which makes the query ambiguous.
    expect(screen.getByText(/Jev Institutional Algorithmic Slicer/i)).toBeDefined();
    expect(screen.queryByText('Modul Khusus Legend & Admin')).toBeNull();
  });

  it('still locks a non-admin guest out of the desk', () => {
    // The admin bypass must not have flattened the gate into "always open".
    render(
      <LegendDeskTab
        moduleId="TRADING_BOT"
        userTier={TIER.GUEST}
        isAdmin={false}
        onNavigate={() => {}}
      />,
    );
    expect(screen.getByText('Modul Khusus Legend & Admin')).toBeDefined();
  });
});
