import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import CommandPaletteModal from '../CommandPaletteModal.jsx';

/**
 * THE COMMAND PALETTE MUST NOT OFFER A DOOR THAT LEADS TO A LOCK SCREEN.
 *
 * E-9 history: CHANGELOG was registered here unconditionally while it was still
 * TIER.ADMIN, so every user could search for it and land on "Khusus
 * Administrator".
 *
 * The first attempt at gating it compared `userTier !== 'guest'`. That guard was
 * dead on arrival: App.jsx emits 'GUEST' in UPPER CASE (App.jsx:291) while
 * TIER.GUEST is 'guest' (featureAccess.js:21). 'GUEST' !== 'guest' is true, so
 * the entry was still shown to guests. These tests exist so that failure cannot
 * come back silently — they pass the UPPER CASE value the real app passes.
 */

// jsdom does not implement scrollIntoView, which the palette calls to keep the
// highlighted row visible. Stub it so the environment does not masquerade as a
// component failure.
beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
});

const baseProps = {
  isOpen: true,
  onClose: () => {},
  allIdxStocks: [],
  allCryptoSpot: [],
  onSelectTicker: () => {},
  onNavigateTab: () => {},
};

describe('command palette — tier-gated entries', () => {
  it('hides Changelog from a guest using the UPPER CASE tier the app emits', () => {
    render(<CommandPaletteModal {...baseProps} userTier="GUEST" isAdmin={false} />);
    expect(screen.queryByText(/Changelog/i)).toBeNull();
  });

  it('shows Changelog to a signed-in FREE account', () => {
    render(<CommandPaletteModal {...baseProps} userTier="FREE" isAdmin={false} />);
    expect(screen.getAllByText(/Changelog/i).length).toBeGreaterThan(0);
  });

  it('shows Changelog to an admin regardless of tier', () => {
    render(<CommandPaletteModal {...baseProps} userTier="GUEST" isAdmin />);
    expect(screen.getAllByText(/Changelog/i).length).toBeGreaterThan(0);
  });
});
/**
 * QA wave 4 (2026-10-12) closed a real gap here. The Architecture tab is new and
 * TIER.FREE, so the only thing standing between a guest and that page is this
 * gate. QA proved it worked — but proved it once, in a throwaway script outside
 * the repo. Nothing kept it proved. These tests make the promise permanent, and
 * like the Changelog cases above they pass the UPPER CASE tier the real app emits.
 */
describe('command palette — the public architecture map', () => {
  it('hides Arsitektur Sistem from a guest using the UPPER CASE tier', () => {
    render(<CommandPaletteModal {...baseProps} userTier="GUEST" isAdmin={false} />);
    expect(screen.queryByText(/Arsitektur Sistem/i)).toBeNull();
  });

  it('hides it from a lowercase guest too, so casing can never decide access', () => {
    render(<CommandPaletteModal {...baseProps} userTier="guest" isAdmin={false} />);
    expect(screen.queryByText(/Arsitektur Sistem/i)).toBeNull();
  });

  it('shows it to a signed-in FREE account', () => {
    render(<CommandPaletteModal {...baseProps} userTier="FREE" isAdmin={false} />);
    expect(screen.getAllByText(/Arsitektur Sistem/i).length).toBeGreaterThan(0);
  });

  it('shows it to a PRO account', () => {
    render(<CommandPaletteModal {...baseProps} userTier="PRO" isAdmin={false} />);
    expect(screen.getAllByText(/Arsitektur Sistem/i).length).toBeGreaterThan(0);
  });

  it('never offers the internal Flow Process map, not even to an admin', () => {
    // Written the obvious way first — "PRO must not see it" — and that passed
    // vacuously: CommandPaletteModal.jsx:74 documents that FLOW_PROCESS is absent
    // from the palette for EVERY tier, so the query was null for everyone.
    // Asserting it with admin rights as well turns a vacuous check into a real
    // guard: if anyone later adds this ADMIN-only entry to the palette, this fails.
    render(<CommandPaletteModal {...baseProps} userTier="ADMIN" isAdmin />);
    expect(screen.queryByText(/Flow Process/i)).toBeNull();
  });
});

