import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import ArchitectureTab from '../ArchitectureTab.jsx';
import { canAccess, MODULES, MODULE_TIER, TIER } from '../../services/featureAccess.js';

/**
 * ARCHITECTURE TAB GUARDS (E-12, 2026-10-11).
 *
 * This page is read by FREE accounts, so two things must hold forever:
 *   1. It renders the public map.
 *   2. It never carries internal material. The sanitisation check below is the
 *      important one: it reads the component SOURCE, so a future edit cannot
 *      smuggle operational detail in by pasting it from the admin project map.
 *
 * The phone number is assembled from parts on purpose. Writing it here would put
 * the very string we are testing for into the repository, where the next grep
 * for it would find this test and nothing else.
 */

const SRC = path.resolve(__dirname, '..', '..');
const readComponent = () => fs.readFileSync(path.join(SRC, 'components', 'ArchitectureTab.jsx'), 'utf8');

describe('ArchitectureTab — rendering', () => {
  it('renders the public architecture map without throwing', () => {
    render(<ArchitectureTab />);
    expect(screen.getByText('Arsitektur Sistem')).toBeDefined();
  });

  it('carries the three sections the owner asked for', () => {
    render(<ArchitectureTab />);
    // 1. data path source -> screen, 2. per-market sources, 3. what is missing.
    expect(screen.getByText(/Alur data: dari sumber sampai layar/i)).toBeDefined();
    expect(screen.getByText(/Sumber data per pasar/i)).toBeDefined();
    expect(screen.getByText(/Yang masih kurang/i)).toBeDefined();
  });

  it('says out loud what is not available instead of hiding it', () => {
    render(<ArchitectureTab />);
    // The honest-gap badge must appear at least once.
    expect(screen.getAllByText('BELUM TERSEDIA').length).toBeGreaterThan(0);
  });
});

describe('ArchitectureTab — sanitisation', () => {
  const FORBIDDEN = [
    { label: 'JWT secret marker', pattern: /JWT_SECRET/ },
    { label: 'password hash marker', pattern: /PASSWORD_HASH/ },
    // Built at runtime: see the file header.
    { label: 'partner phone number', pattern: new RegExp('6281' + '2241' + '70187') },
    { label: 'personal email domain', pattern: /@gmail/i },
    { label: 'access-token wording', pattern: /token/i },
    { label: 'raw 64-character digest', pattern: /\b[0-9a-f]{64}\b/i },
    { label: 'admin credential wording', pattern: /(password|sandi|api[_-]?key|secret[_-]?key)/i },
  ];

  for (const { label, pattern } of FORBIDDEN) {
    it(`never contains a ${label}`, () => {
      expect(readComponent()).not.toMatch(pattern);
    });
  }

  it('does not point at an admin console or an internal host', () => {
    const code = readComponent();
    // No absolute links at all: the public tab has nothing to send a reader to.
    expect(code).not.toMatch(/https?:\/\//);
  });
});

describe('ArchitectureTab — tier gate', () => {
  it('is FREE, not guest, so a visitor without an account cannot read it', () => {
    expect(MODULE_TIER[MODULES.ARCHITECTURE]).toBe(TIER.FREE);
    expect(canAccess(MODULES.ARCHITECTURE, TIER.GUEST)).toBe(false);
    expect(canAccess(MODULES.ARCHITECTURE, TIER.FREE)).toBe(true);
    expect(canAccess(MODULES.ARCHITECTURE, TIER.PRO)).toBe(true);
  });

  it('leaves the internal Flow Process map admin-only', () => {
    // The sanitised public tab must not have demoted the internal one.
    expect(MODULE_TIER[MODULES.FLOW_PROCESS]).toBe(TIER.ADMIN);
    expect(canAccess(MODULES.FLOW_PROCESS, TIER.FREE)).toBe(false);
    expect(canAccess(MODULES.FLOW_PROCESS, TIER.LEGEND)).toBe(false);
  });
});
