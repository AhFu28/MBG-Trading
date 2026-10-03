# MBG TRADING — Full Re-Audit + Recombined Master Package (V4) — 2026-10-02

**Repo:** AhFu28/MBG-Trading · **Scope of this round:** re-audit the repo, re-verify the combined plan (V3), recombine into a complete document set: report + plan + PRD + ERD + design system + business process — all in markdown, with diagrams.
**Method note:** delegated agent teams failed repeatedly (5 crashed runs); the audit and most documents were produced by the Lead with direct verification. One background subagent (PRD/ERD) completed and contributed 04_ERD.md plus two confirmed findings (S8, S9). Every claim cites evidence gathered today.

---

## Documents in this package (docs/audit_2026-10-02/)

| File | What it is |
|:---|:---|
| **00_MASTER_REPORT.md** | This file — index, verdicts, what changed, what happens next |
| **01_REPO_AUDIT.md** | Full repo re-audit: build/test matrix (all green), 9 security findings, data-honesty, ponytail bloat, verdict tables, git risk |
| **02_CONSOLIDATION_REVIEW.md** | Is MASTERPLAN_V3 faithful + consistent? The 5 prior contradictions -> resolved/disclosed; coverage matrix; decision list; verdict: V3 is a safe base |
| **03_PRD.md** | PRD v4 for the lean product: VIP Telegram signals (1 market) + Pro cockpit; user stories, FRs with EXISTS/PARTIAL/NEW, hard gates, pricing |
| **04_ERD.md** | Entity-Relationship Design: current state (5 Supabase tables + JSON payloads) -> minimal M0 target (subscriber, payment, signal, dispatch_log, tier_policy) + migration SQL |
| **05_DESIGN_SYSTEM.md** | Design system from the live code: light/dark token tables, typography, components inventory (39, all reachable), data-state patterns, a11y, Telegram templates, diagrams |
| **06_BUSINESS_PROCESS.md** | The machine end-to-end: system context, daily cycle, signal lifecycle, member funnel, decision gates, 4-week gantt, unit economics, launch checklist + SOP |
| **07_LIVE_COMPARISON_AND_PLAN.md** | Live site + origin comparison (local is 20 commits behind; S2/S4/S8 closed on origin; auth policy divergence) + the complete phased remediation plan with acceptance criteria |
| **08_WEB_UPDATE_PLAN.md** | The step-by-step web update plan (Phase 0 protect+rebase, 1 security, 2 hygiene, 3 deploy) — password "MBG" decided |

Read them in order 00 -> 06, or jump: owner -> 00, 06; engineer -> 01, 03, 04; designer -> 05; reviewer -> 01, 02.

---

## 1. Verdicts at a glance

### The repo (01)
| Area | Verdict |
|:---|:---|
| Build + engine tests | **ALL GREEN** — build exit 0 (25 chunks), compileall clean, **41 pytest + 5 subtests**, TRUST01 sentinel PASS, auth runtime PASS (16 cases) |
| Auth (TRUST01) | **FIXED & VERIFIED** (uncommitted) |
| Premium JSON public (TRUST04) | **OPEN (HIGH)** — leak mechanism confirmed: supabase_client.py:36-51 unconditionally mirrors to public/ |
| data.js dev-fallback secret | **OPEN (HIGH)** — functions/api/data.js:52 (found by subagent, confirmed) |
| Fake swap hash | **OPEN (HIGH)** — SolanaSwapModal.jsx:141-143 |
| Client tier decorative | **OPEN (MED)** — localStorage + debug cycle (App.jsx:184-198) |
| Git hygiene | **OPEN (MED)** — Python/ 173.8 MB untracked + unignored; one `git add .` would commit it |
| Old 2026-09-11 audit | 2 CRIT FIXED (auth, webhook relay), 1 OBSOLETE (order book), "17 dead components" **REFUTED** (all 39 reachable) |

### The combined plan (02)
| Question | Verdict |
|:---|:---|
| Are the 4 sources faithfully combined in V3? | **YES** — coverage matrix confirms MERGED with reasons; nothing silently dropped |
| Are the 5 known contradictions fixed? | **YES** — 4 fixed in text, 1 (auth target) disclosed as owner decision D-7 |
| Counts and quotes verified? | **YES** — 20/14/4 = 38 recount confirmed; git counts match |
| Is V3 safe as the base of V4? | **YES** — V4 = V3 + this package (the docs above carry the new findings) |

---

## 2. What this round changed vs yesterday

1. **New confirmed findings:** S8 (data.js fallback JWT secret — the last fail-open auth path), S9 (client tier decorative), the TRUST04 leak *mechanism* (supabase_client.py:36-51 — the writer must change, not just the files), pytest now installed and the engine suite green at 41 tests.
2. **Corrections to prior claims:** "17 dead components" refuted (import graph + Vite chunks prove all 39 reachable); the old webhook open-relay is FIXED (secret present, enforcement unverified); whale/news fabrication findings NOT reproduced by grep (historical until re-verified).
3. **New fact for the plan:** only 2 of 7 workflows are cron-scheduled — the daily IDX cadence is manual; the plan and the business process document state this honestly.
4. **The package is complete:** report + plan-linked PRD + ERD + design system + business process, all markdown, all with Mermaid diagrams, all evidence-cited.

---

## 3. What will happen next (the machine, in one table)

| When | What | Who | Detail |
|:---|:---|:---|:---|
| Pekan 1 (from Mon 2026-10-06) | Commit + push + deploy the verified tree; fix S7/S8/S4 | USER + LEAD | git hygiene first, explicit staging; nothing is committed today |
| Pekan 2 | TRUST04 split (D-2), TRUST03 server tier, Telegram channel wiring, cron re-enable | LEAD + USER (secrets) | the only launch-blocking item is S2 |
| Pekan 3 (conditional D-1) | Founding offer, onboarding, launch to 30-50 members | USER | Rp150k/bln + Rp350k/3mo; checklist in 06 section 8 |
| Pekan 4 | Track outcomes/churn/feedback; scale-from-profit decisions | USER + LEAD | corrected math: 50 x Rp150k = Rp7.5M gross |

## 4. The 7 owner decisions (defaults recommended)

D-1 market = **crypto spot** · D-2 data backend = **Supabase** · D-3 pricing = **Rp150k + Rp350k/3mo** · D-4 launch timing = **only after S2 closed** · D-5 refund = **7-day no-questions** · D-6 early-bird cap = **30-50** · D-7 auth target = **Cloudflare Function for M0, Supabase when grant table lands**. Full table: 02 section 5.

## 5. Evidence rules (binding, carried from V3)

planned != implemented != committed != pushed != deployed != verified. Build success is not deploy. Documents are not features. Business numbers are labelled [FACT]/[ASSUMPTION]/[CONFLICT]. stale = stale; synthetic never LIVE; provenance (source + observed_at) on every outgoing signal.