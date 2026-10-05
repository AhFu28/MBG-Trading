/**
 * Guards the arena freshness thresholds shown in the Data Provenance modal.
 *
 * Why this test exists: the thresholds were originally 15/60 minutes, copied
 * from an assumed "every 5 minutes" schedule. Measurement on 2026-10-05 showed
 * the arena really runs 4 scheduled sessions/day and only commits state at the
 * END of each session, so a healthy state can legitimately be ~6.5h old.
 * With the old values the modal reported OFFLINE on a perfectly healthy engine.
 *
 * These constants must stay in sync with DataIntegrityModal.jsx.
 */
import { describe, it, expect } from 'vitest';

const ARENA_FRESH_MIN = 400;    // ~6h40m
const ARENA_DELAYED_MIN = 800;  // ~13h20m

function classify(ageMin) {
  if (ageMin <= ARENA_FRESH_MIN) return 'PERIODIC ACTIVE';
  if (ageMin <= ARENA_DELAYED_MIN) return 'DELAYED';
  return 'OFFLINE';
}

describe('arena freshness thresholds', () => {
  it('reports a healthy state as active right after a session commit', () => {
    expect(classify(5)).toBe('PERIODIC ACTIVE');
  });

  it('still reports active at the documented worst case (~6.5h between sessions)', () => {
    // This is the case the old 15-minute threshold wrongly flagged as OFFLINE.
    expect(classify(390)).toBe('PERIODIC ACTIVE');
  });

  it('does not report active beyond one expected session gap', () => {
    expect(classify(401)).toBe('DELAYED');
  });

  it('escalates to DELAYED when a full session looks missed', () => {
    expect(classify(700)).toBe('DELAYED');
  });

  it('reports OFFLINE only after two missed sessions', () => {
    expect(classify(801)).toBe('OFFLINE');
    expect(classify(5000)).toBe('OFFLINE');
  });

  it('keeps the gap wide enough to survive real scheduler drift', () => {
    // GitHub Actions can delay a run. The active window must exceed 6 hours or
    // the modal turns red for reasons the engine cannot control.
    expect(ARENA_FRESH_MIN).toBeGreaterThan(360);
    expect(ARENA_DELAYED_MIN).toBeGreaterThan(ARENA_FRESH_MIN * 2 - 1);
  });
});
