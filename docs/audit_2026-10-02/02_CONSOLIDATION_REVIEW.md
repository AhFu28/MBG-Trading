# 02 — Consolidation Review: is MASTERPLAN_V3 faithful and consistent? (2026-10-02)

**Object of review:** docs/MASTERPLAN_MBG_UNIFIED_V3.md — current state **802 lines**
**Author:** Lead (direct verification against the four sources in docs/sources/, the repo, and the prior model reviews). Delegated reviewer agents failed; every claim below was checked by the Lead today.
**Method:** grep/read of V3 at the cited lines, cross-check against docs/sources/* and the working tree, sample-check of the consolidation docs (01..07).

---

## 1. The 5 prior contradictions (07_model_review_museglimmer.md) -> status in the current 802-line V3

| # | Contradiction (as raised) | Status now | V3 evidence (current lines) |
|:--|:---|:---|:---|
| 1 | Supabase Auth in SHIP NOW vs "not implemented in Week 1" | **RESOLVED-BY-DISCLOSURE** — registered as open decision D-7; correction note added | L143 ("Supabase Auth di baris SHIP NOW adalah **target produk**, bukan yang diimplementasikan"); L586 (D-7: auth target = tetap Cloudflare Pages Function, sudah jadi); L751 ("VALID — keputusan belum diambil") |
| 2 | Pekan 3 scheduled despite the D-1 prerequisite | **RESOLVED** — Pekan 3 made conditional on D-1 | L224 ("4.4 M0 — Pekan 3 ... **kondisional pada D-1**"); L226 ("tidak dapat dijadwalkan sampai D-1 terjawab"); L752 ("DISCLOSED") |
| 3 | Effort conflict: lean Pekan 1 = 2-3 days vs [BL] W1 = 15-25 days | **RESOLVED** — recorded as a real conflict, middle path chosen (4-week MVP with honestly-acknowledged security risk) | V3 section 1.1 C-1 (two horizons, one document); M0 is the vertical slice; [BL] W2-W5 stay as post-revenue plan |
| 4 | PDF01 in Pekan 4 vs "PDF/Quarto not shipped in M0" | **RESOLVED** — PDF01 made conditional, default NOT shipped | L248 ("PDF01 (kondisional) — Default TIDAK dikirim di M0 ... hanya jika ada permintaan berbayar"); L754 ("VALID — ambiguitas nyata") |
| 5 | MRR math Rp200rb vs promo Rp150rb (Rp10M vs Rp7.5M) | **RESOLVED** — corrected math on record | L547 ("**ARITHMETIC PROJECTION** — memakai Rp200rb padahal promo Rp150rb -> **Rp7,5 juta**; dan **bruto**"); L755 ("MISREADING — dokumen justru **mengkritik** angka sumber yang salah harga") |

**Verdict: all 5 contradictions are addressed in the current V3** — 4 fixed in the text, 1 (auth target) disclosed as an explicit owner decision (D-7). The reviewer claim that V3 "timed out / UNSUPPORTED" is superseded by the recorded cross-check at V3 section 12.8 (L743: independent recount 20/14/4 = 38 confirmed).

---

## 2. Additional consistency checks (today)

| Check | Result | Evidence |
|:---|:---|:---|
| SHIP NOW / DEFER / DROP count | **CONFIRMED** 20 / 14 / 4 = 38 disposisi | L137, L141, L743 |
| Pricing internally consistent | **CONFIRMED** — Rp150.000/bln founding (L237); quarterly Rp350rb option (L583, from [LEAN] 113); projections labelled assumptions (L543-549) | V3 section 7/11 |
| Infra topology | **CONFIRMED with a NEW gap** — Cloudflare Pages + functions + HF Space daemon + GitHub Actions. But only **2 of 7 workflows have cron schedules** (arena_247_engine every 5 min; hourly_crypto_macro hourly). daily_idx_morning, daily_idx_eod, midday_sesi1_recap, evening_global_watch, intraday_idx_refresh are **workflow_dispatch (manual) only** — the plan morning briefing 07:15 / evening 18:30 cadence is NOT automated | .github/workflows/*.yml trigger lines (grep today) |
| Counts vs repo | **CONFIRMED** — V3 correction "8 file -> 11 tracked files" (L659) matches today: 12 modified + ~18 untracked | git status today |
| URLs | **CONFIRMED** — mbg-trading.pages.dev is the production URL in the plan (prior correction adopted; mbg-v2.pages.dev variants rejected) | V3 corrections table |
| Honest-data rule | **CONFIRMED** — provenance source+observed_at enforced in code, not just prose | engine/notifiers/vip_signal_router.py: REQUIRED_PROVENANCE_KEYS, NON_LIVE_STATES; 41 pytest green |

---

## 3. Source coverage matrix (4 sources -> V3)

| Source | Lines (non-blank) | Role in V3 | Coverage verdict |
|:---|:--:|:---|:---|
| [MP] MBG-Trading-Revamp-Master-Plan.md | 948 | Long-horizon blueprint: remediation register (C01-C05, H01-H22), tier system, design system, research/paper, budget | MERGED via the mapping; timeline superseded by the lean horizon (C-1); prices kept as test hypotheses, not tariffs |
| [BL] MBG-Trading-Implementation-Backlog.md | 470 | 32 tickets: BASE01-04, TRUST01-06, DESIGN01-05, WORKSPACE01-03, PDF01, RESEARCH01-05, COMMERCIAL01-06, OPS01+ | MERGED; trimmed W0/W1 adopted as lean W1; all tickets remain planned-only until commit |
| [V2] PRD_PROJECT_MBG_V2_MASTER.md | 379 | Vision archive; feature catalog (6 alert types, 14 tabs); setup guide section 6 + SOP section 7 -> W2-W3 onboarding | MERGED as archive scope (C-11); master-password model overridden by TRUST01 (implemented); 3 of 6 alert types shipped in M0 |
| [LEAN] STRATEGI_EKSEKUSI_DAN_SARAN_MAS_FUAD.md | 102 | Business filter: 4-week MVP primary; 80% deferred; unit economics | MERGED as the GTM track; business math labelled assumptions with corrected arithmetic (L547) |

> **Note (line counts).** The 1,214 / 781 / 433 / 134 figures circulate from the original attachments (totalLines with blanks); the archived copies in docs/sources/ measure 948 / 470 / 379 / 102 non-blank lines. Content coverage is unaffected; cite the archived copies from here on.

---

## 4. Implementation Log cross-check vs the real repo

| V3 done claim | Working tree today | Verdict |
|:---|:---|:---|
| TRUST01: hardcoded mbg password removed, session server-side | frontend/functions/api/auth.js + PasswordGate.jsx modified; sentinel PASS; 16 runtime cases PASS | **VERIFIED** (uncommitted) |
| _headers hardened (no-store, noindex) | frontend/public/_headers modified | **VERIFIED** (uncommitted) |
| VIP signal router (GTM-TG-01) | engine/notifiers/vip_signal_router.py exists, 366 lines, provenance gate + allowlist + dry-run default; 41 tests pass | **VERIFIED** (uncommitted) |
| send_vip_signals.py script | scripts/send_vip_signals.py exists | **VERIFIED** (uncommitted) |
| v4 UI rework | App.jsx + 5 components + index.css modified; build PASS 25 chunks | **VERIFIED** (uncommitted) |
| Supabase Auth shipped | NOT in tree; registered as D-7 target | **CORRECTLY NOT CLAIMED** |

---

## 5. Decision list carried into V4

**Resolved (V4 must state):**
1. Two horizons, one document: 4-week M0 (lean + security gate) primary; [MP]/[BL] W2-W5 archived as post-revenue scope.
2. Paid product = VIP Telegram signals on ONE market + Pro access to the EXISTING cockpit; cockpit is retention/acquisition, not a rebuild (C-3).
3. 3 alert types in M0 (morning briefing, instant signal, evening recap); founding price Rp150.000/bln + optional Rp350k/3-month (C-2/C-4).
4. Corrected business math: 50 x Rp150k = **Rp7.5M gross/month** (not Rp10M, not net); churn/LTV = assumptions to validate in W4 (L547).
5. Pekan 3 is conditional on D-1; no blocking paper-trading gate; PDF01 conditional on paid request.
6. Auth for M0 = Cloudflare Pages Function (auth.js, done); Supabase Auth is a product target, decision D-7.
7. **NEW (from the 2026-10-02 audit): the daily cadence is not automated** — 5 of 7 workflows are manual-only. V4 must either re-enable cron or state the manual SOP honestly (06_BUSINESS_PROCESS.md section 2).

**Open decisions (owner only, from V3 section 11):**

| ID | Decision | Recommended default |
|:--|:---|:---|
| D-1 | First paid market | **crypto spot** — already integrated end-to-end, skips IDX licensing |
| D-2 | Data backend for private payloads (KV/R2/Supabase vs engine API) | Supabase (already in stack, free tier, schema.sql exists) |
| D-3 | Founding price + quarterly option | Rp150k/bln + Rp350k/3 bulan |
| D-4 | Launch Pekan 3 before TRUST02/03/06 are complete | Accept time-boxed commercial risk ONLY if S2 (premium JSON public) is closed first — it is the one non-negotiable |
| D-5 | Refund policy | 7-day no-questions for founding cohort |
| D-6 | Early-bird cap | 30-50 members (per [LEAN] / V3 L474) |
| D-7 | Auth target | Keep Cloudflare Pages Function for M0; migrate to Supabase Auth when the VIP grant table lands |

---

## 6. Verdict

**V3 is safe to use as the base.** It faithfully combines the four sources (coverage matrix section 3), its five known contradictions are fixed or disclosed (section 1), its counts and quotes verify against the repo (sections 2 and 4), and its evidence rules (planned != implemented != committed != deployed) are enforced in both prose and code. What V3 does NOT yet contain: the 2026-10-02 audit findings (S1-S7, the workflow-schedule gap, the corrected dead-component picture) — those live in the documents of this folder and are carried into V4 by 00_MASTER_REPORT.md.