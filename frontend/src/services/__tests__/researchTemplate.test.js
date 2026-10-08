/**
 * Tests for the research template + evidence ledger (P-8 P0b).
 *
 * The template is the contract: a paper that skips a mandatory section, fakes
 * evidence, or smuggles a numeric confidence is rejected STRUCTURALLY here -
 * not by reviewer taste.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { SECTION_ORDER, CLAIM_TYPES, validateClaim, validatePaper, breakevenWinRate } from '../researchTemplate.js';

const SAMPLE = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../../docs/research/IDX_STRATEGY_STUDY_SAMPLE.json'), 'utf8')
);

describe('research template structure', () => {
  it('carries all 14 sections in the mandatory order', () => {
    const keys = SECTION_ORDER.map((s) => s.key);
    expect(keys).toEqual([
      'metadata', 'abstrak', 'ringkasan', 'konteks', 'teori', 'data', 'metode',
      'hasil', 'diskusi', 'kontra-tesis', 'skenario', 'risiko', 'kesimpulan', 'referensi',
    ]);
    expect(SECTION_ORDER.map((s) => s.no)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });

  it('declares exactly five claim types', () => {
    expect(Object.keys(CLAIM_TYPES).sort()).toEqual(['derived', 'fact', 'illustration', 'inference', 'scenario']);
  });
});

describe('the sample IDX paper', () => {
  it('passes template validation', () => {
    const r = validatePaper(SAMPLE);
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('has 14 sections in order', () => {
    const keys = SAMPLE.sections.map((s) => s.section_key);
    expect(keys).toEqual(SECTION_ORDER.map((s) => s.key));
  });

  it('shows the honest losing result, not a track-record boast', () => {
    const hasil = SAMPLE.sections.find((s) => s.section_key === 'hasil');
    const table = hasil.content_blocks.find((b) => b.type === 'table');
    const winRate = table.rows.find((row) => row.metrik === 'Win rate');
    expect(winRate.nilai).toBe('20%');
    const pf = table.rows.find((row) => row.metrik === 'Profit factor');
    expect(pf.nilai).toBe('0,62');
  });

  it('records missing data as null plus a reason, never an invented number', () => {
    const data = SAMPLE.sections.find((s) => s.section_key === 'data');
    const missing = (data.claims || []).find((c) => c.evidence_status === 'missing');
    expect(missing).toBeTruthy();
    expect(missing.missing_reason).toBeTruthy();
  });
});

describe('evidence-ledger rules', () => {
  it('rejects a material claim with neither evidence nor a reason', () => {
    const r = validateClaim({ claim_type: 'fact', material: true, evidence_status: 'sourced', text: 'x', evidence: [] });
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => /locator/.test(e))).toBe(true);
  });

  it('rejects a numeric confidence outright', () => {
    const r = validateClaim({ claim_type: 'inference', material: true, evidence_status: 'sourced', text: 'x', confidence: 0.9, evidence: [{ locator: 'a#b' }] });
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => /confidence/.test(e))).toBe(true);
  });

  it('rejects a pending claim leaking into review or published state', () => {
    const r = validateClaim({ claim_type: 'fact', material: true, evidence_status: 'pending', text: 'x', state: 'published' });
    expect(r.ok).toBe(false);
  });

  it('rejects a paper missing a mandatory section', () => {
    const broken = { state: 'draft', sections: SAMPLE.sections.filter((s) => s.section_key !== 'hasil') };
    const r = validatePaper(broken);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => /hasil/.test(e))).toBe(true);
  });
});

describe('breakeven math', () => {
  it('breakeven win rate for RR 2.2 is about 31.25%', () => {
    expect(breakevenWinRate(2.2)).toBeCloseTo(0.3125, 4);
  });
  it('returns null for an invalid ratio', () => {
    expect(breakevenWinRate(0)).toBe(null);
    expect(breakevenWinRate(-1)).toBe(null);
  });
});
