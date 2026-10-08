/**
 * P-8 P0b: research paper template + evidence ledger (spesifikasi update-fitur §3).
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The Research Desk needs ONE template source: the mandatory 14-section order,
 * the typed claims, and the evidence-quality rules. The editorial/reader code
 * and the validation tests all import from here so a paper that skips a section
 * or fakes evidence is rejected structurally, not by taste.
 *
 * Rules pinned (spec §3.3): a material claim is either sourced (with a locator)
 * or missing-with-reason (null + alasan) - never a plausible-looking number.
 * No numeric confidence in the MVP - categorical evidence status only.
 * Simulations are never performance evidence.
 */

// ---------------------------------------------------------------------------
// §3.1 - the mandatory 14-section order (the default template)
// ---------------------------------------------------------------------------
export const SECTION_ORDER = [
  { key: 'metadata', no: 1, title: 'Metadata', validation: 'Judul, report/edition ID, penulis, reviewer, instrumen/venue, bahasa, cutoff, issued date, versi' },
  { key: 'abstrak', no: 2, title: 'Abstrak', validation: 'Pertanyaan, metode, temuan utama, ketidakpastian; target 150–250 kata' },
  { key: 'ringkasan', no: 3, title: 'Ringkasan Eksekutif', validation: 'Tesis, temuan terpenting, kontra-tesis, implikasi bersyarat, risiko' },
  { key: 'konteks', no: 4, title: 'Konteks dan Pertanyaan Riset', validation: 'Apa yang diuji, mengapa relevan, horizon, scope' },
  { key: 'teori', no: 5, title: 'Teori dan Literatur', validation: 'Mekanisme, karya primer, competing explanation' },
  { key: 'data', no: 6, title: 'Data', validation: 'Sumber, periode, satuan, sampling, availability, missing data, hak penggunaan' },
  { key: 'metode', no: 7, title: 'Metode', validation: 'Rumus, aturan, parameter, kontrol, benchmark, code/environment version' },
  { key: 'hasil', no: 8, title: 'Hasil', validation: 'Tabel dan grafik; pisahkan hasil observasi dari simulasi' },
  { key: 'diskusi', no: 9, title: 'Diskusi', validation: 'Arti hasil, alternative explanations, external validity' },
  { key: 'kontra-tesis', no: 10, title: 'Kontra-tesis', validation: 'Bukti yang menentang dan asumsi yang paling rapuh' },
  { key: 'skenario', no: 11, title: 'Skenario dan Implikasi', validation: 'Base/bull/bear jika relevan; driver, sensitivity, invalidation' },
  { key: 'risiko', no: 12, title: 'Risiko dan Keterbatasan', validation: 'Data, metode, produk/venue, model, horizon, bias' },
  { key: 'kesimpulan', no: 13, title: 'Kesimpulan dan Monitoring', validation: 'Jawaban terhadap pertanyaan; indikator pemantauan dan review trigger' },
  { key: 'referensi', no: 14, title: 'Referensi dan Lampiran', validation: 'Locator sumber, daftar formula, manifest, reproducibility notes' },
];

// ---------------------------------------------------------------------------
// §3.3 - typed claims
// ---------------------------------------------------------------------------
export const CLAIM_TYPES = {
  fact: 'Pernyataan empiris yang didukung sumber',
  derived: 'Hasil perhitungan dari input yang terlacak',
  inference: 'Interpretasi yang memerlukan penalaran',
  scenario: 'Hasil jika asumsi tertentu berlaku',
  illustration: 'Contoh edukasi/synthetic — bukan hasil historis',
};

export const EVIDENCE_STATUS = ['sourced', 'missing', 'pending'];

// ---------------------------------------------------------------------------
// §3.2 - template variations (the mandatory additions per paper type)
// ---------------------------------------------------------------------------
export const TEMPLATE_VARIATIONS = {
  equity: ['Filing period', 'Restatement', 'Corporate action', 'Valuasi dan asumsi'],
  macro: ['Event/release vs observation date', 'Revision/vintage', 'Mekanisme transmisi'],
  crypto_spot: ['Network/token identity', 'Supply', 'Liquidity/venue', 'Onchain limitations'],
  crypto_perpetual: ['Venue', 'Contract type', 'Multiplier', 'Mark/index/last', 'Funding interval'],
  strategy_study: ['Aturan kausal', 'Execution/cost model', 'Register percobaan', 'Benchmark'],
  product_dossier: ['Entitas hukum', 'Jenis hak', 'Custody', 'Redemption', 'Dokumen dan eligibility'],
};

// ---------------------------------------------------------------------------
// Evidence-ledger validation (§3.3 quality rules)
// ---------------------------------------------------------------------------

/**
 * Validate one claim. A material claim must be:
 *   - evidence_status 'sourced' with at least one locator, OR
 *   - evidence_status 'missing' with a reason (null + alasan, bukan angka karangan).
 * 'pending' is allowed only while the draft is not yet in review.
 * A numeric confidence is rejected outright in the MVP (categorical only).
 */
export function validateClaim(claim) {
  const errors = [];
  if (!CLAIM_TYPES[claim.claim_type]) errors.push('tipe klaim tidak dikenal: ' + claim.claim_type);
  if (!claim.text || !String(claim.text).trim()) errors.push('teks klaim kosong');
  if (claim.confidence != null && typeof claim.confidence === 'number') {
    errors.push('confidence angka dilarang di MVP — pakai evidence_status kategoris');
  }
  if (claim.material) {
    if (claim.evidence_status === 'sourced') {
      const hasLocator = Array.isArray(claim.evidence) && claim.evidence.some((e) => e.locator);
      if (!hasLocator) errors.push('klaim material "sourced" butuh minimal satu locator');
    } else if (claim.evidence_status === 'missing') {
      if (!claim.missing_reason) errors.push('klaim material tanpa bukti wajib punya alasan (null + alasan)');
    } else if (claim.evidence_status === 'pending') {
      if (claim.state === 'review' || claim.state === 'approved' || claim.state === 'published') {
        errors.push('klaim "pending" tidak boleh lolos ke review/approved/published');
      }
    } else {
      errors.push('evidence_status tidak dikenal: ' + claim.evidence_status);
    }
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Validate a paper draft against the template: the 14 sections in order, and
 * every claim passes validateClaim. Returns { ok, errors }.
 */
export function validatePaper(paper) {
  const errors = [];
  if (!Array.isArray(paper.sections)) {
    return { ok: false, errors: ['paper.sections bukan array'] };
  }
  const keys = paper.sections.map((s) => s.section_key);
  const expected = SECTION_ORDER.map((s) => s.key);
  if (keys.join(',') !== expected.join(',')) {
    const missing = expected.filter((k) => !keys.includes(k));
    const extra = keys.filter((k) => !expected.includes(k));
    if (missing.length) errors.push('section wajib hilang: ' + missing.join(', '));
    if (extra.length) errors.push('section di luar template: ' + extra.join(', '));
    const orderBroken = expected.filter((k) => keys.includes(k)).join(',') !== keys.filter((k) => expected.includes(k)).join(',');
    if (orderBroken) errors.push('urutan section tidak sesuai template');
  }
  for (const s of paper.sections) {
    for (const claim of s.claims || []) {
      const r = validateClaim({ ...claim, state: paper.state });
      for (const err of r.errors) errors.push('[' + s.section_key + '] ' + err);
    }
  }
  return { ok: errors.length === 0, errors };
}

/**
 * The breakeven win rate for a fixed reward-to-risk ratio (derived, §7 metode):
 * p* = 1 / (1 + RR). At the plan RR of 2.2 the breakeven is ~31.25%.
 */
export function breakevenWinRate(riskRewardRatio) {
  const rr = Number(riskRewardRatio);
  if (!rr || rr <= 0) return null;
  return 1 / (1 + rr);
}
