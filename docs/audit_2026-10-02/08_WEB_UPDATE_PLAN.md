# 08 — Full Web Update Plan, Step by Step (2026-10-03)

**Decision recorded (owner, 3 Okt 2026):** login password stays **"[REDACTED credential reference]"** — origin's default-hash approach. D-8b RESOLVED: the local fail-closed auth.js fix is DROPPED; the sentinel is updated to enforce the exact default hash instead of forbidding it.

**Current state (verified 2-3 Okt):**
- **Local:** main @ e297fa4 + 12 modified + ~19 untracked (uncommitted: v4 SpaceX UI rework, VIP router + 41 tests, verify scripts, all docs, fail-closed auth.js)
- **Origin/main:** @ 71037c0 (20 commits ahead) — payload leak closed, DegenDesk + MemecoinRadar live, vitest wired, v5.8.0 hardening, pump.fun fix, password "[REDACTED credential reference]" default
- **Live:** [REDACTED credential reference]-trading.pages.dev — runs the origin build; auth live (GET 401); no JSON leak; no fake hash

---

## PHASE 0 — Protect local work & rebase (I execute; ~1 session)

### Step 0.1 — .gitignore safety
Add to .gitignore: `Python/`, `%SystemDrive%/`. Verify: `git check-ignore Python` exits 0. Nothing huge can be staged accidentally.

### Step 0.2 — Branch + explicit commit of ALL local work
1. `git checkout -b local-v4-vip`
2. Stage EXPLICITLY (never `git add .`):
   - 12 modified: .env.example, CHANGELOG.md, frontend/functions/api/auth.js, frontend/index.html, frontend/public/_headers, frontend/src/App.jsx, frontend/src/components/{HomeDashboardTab,LotCalculatorModal,MasterQuantLeaderboard,PasswordGate,USStockTab}.jsx, frontend/src/index.css
   - Untracked to ADD: docs/MASTERPLAN_MBG_UNIFIED_V3.md, docs/UI_UX_POLISH_REPORT_2026-09-30.md, docs/consolidation/, docs/audit_2026-10-02/, docs/sources/, docs/screenshots/, engine/config/, engine/notifiers/vip_signal_router.py, engine/tests/test_vip_signal_router.py, frontend/src/utils/format.js, scripts/dev-local.ps1, scripts/send_vip_signals.py, scripts/verify-auth-handler.mjs, scripts/verify-trust01.mjs
   - Move first: frontend/public/mockup_spacex_home.html + mockup_spacex_screener.html -> docs/screenshots/ (mockups must not ship in public/)
3. Commit: "wip(v4+vip): v4 UI rework, VIP signal router + tests, audit package, sources"
4. NOT staged: Python/ (173.8 MB), %SystemDrive%/ — local junk, deleted in Phase 2

### Step 0.3 — Bring in origin
`git fetch origin && git merge origin/main` (merge keeps both histories visible; rebase rewrites — merge is safer here).

### Step 0.4 — Resolve the 6 conflicts (decision per file)
| File | Resolution | Why |
|:--|:--|:--|
| frontend/functions/api/auth.js | **TAKE ORIGIN** | owner decision: password = "[REDACTED credential reference]" (default-hash fallback). Local fail-closed version dropped |
| frontend/src/components/PasswordGate.jsx | **TAKE ORIGIN**, re-apply any strictly-better local bit | origin has server confirmation; verify with runtime tests |
| frontend/src/components/HomeDashboardTab.jsx | **ORIGIN as base** (radar/degen wired) + re-apply local v4 layout/tokens | D-8c recommended: keeps origin's features + tests; re-skin with v4 |
| frontend/src/index.css | **MERGE** | local v4 tokens mostly additive (light+dark token blocks) |
| frontend/src/App.jsx | **MERGE** | keep origin's lazy routes (DegenDesk, MemecoinRadar) + local v4 shell changes |
| frontend/public/_headers | **MERGE** | union of both hardenings |

### Step 0.5 — Port local-only assets + ONE dispatch path
1. VIP router + tests + config + send script are new files — no conflict; they carry over.
2. **Reconcile with origin's a044e9b VIP wiring into ONE dispatcher** — read origin's wiring first (grep engine/ for the dispatch call site); if origin dispatches VIP signals another way, unify: ONE provenance-gated path (the local router), origin's path becomes its caller or is removed. Two dispatchers = two sources of truth.

### Step 0.6 — Update the verify scripts for the "[REDACTED legacy value]" decision
- scripts/verify-trust01.mjs: change "must not contain default sha256 of [REDACTED credential reference]" -> "default hash, if present, MUST equal sha256([REDACTED credential reference]) exactly and be documented" + keep "no OTHER fallback secrets" + keep bundle scan.
- scripts/verify-auth-handler.mjs: default password "[REDACTED credential reference]" -> 200 (was 401 in the fail-closed version); wrong password -> 401; forged/tampered -> 401; real cookie -> 200.

### Step 0.7 — FULL GATE (nothing pushes before this is green)
1. `npm run build` (frontend/) — exit 0
2. `npx vitest run` (frontend/) — origin's 4 suites + any added
3. `py -m pytest engine/tests -q` — 41+ green
4. `node scripts/verify-trust01.mjs` + `node scripts/verify-auth-handler.mjs` — PASS
5. Visual check of the reconciled home vs docs/screenshots/spacex_rework_2026-10-01/

---

## PHASE 1 — Security polish on the reconciled tree (~2-3 days)

| Step | Action | Verify |
|:--|:--|:--|
| 1.1 | Remove the debug tier-cycle control in App.jsx (S9) | no localStorage tier escalation; tier display honest |
| 1.2 | Verify webhook secret enforcement: signed vs unsigned POST pair to /api/telegram-webhook (S3) | unsigned -> 401/403 |
| 1.3 | Scoped admin auth on the HF daemon reset endpoint (S6) | reset requires identity |
| 1.4 | Audit origin's NEW surfaces (DegenDesk, MemecoinRadar, earlySignal, memecoinDesk): synthetic labeling, Date.now seeding, provenance on outputs | no synthetic-as-LIVE |
| 1.5 | (Recommended, not blocking) Document how to set PASSWORD_HASH in Cloudflare env later for a stronger password | .env.example + docs note |

---

## PHASE 2 — Docs & hygiene (~1 day)

| Step | Action | Verify |
|:--|:--|:--|
| 2.1 | Delete local Python/ (173.8 MB — not on origin) + %SystemDrive%/ folder | repo size drops ~174 MB |
| 2.2 | Update MASTERPLAN V3 -> V3.1: S2/S4/S8 closed on origin; origin's new features; ONE VIP dispatch path; the rebase story; password "[REDACTED credential reference]" decision | doc matches reality |
| 2.3 | Commit the docs package | docs on origin |

---

## PHASE 3 — Deploy & verify on live (~0.5 day)

| Step | Action | Verify |
|:--|:--|:--|
| 3.1 | Push local-v4-vip -> open PR -> **you approve** -> merge to main | PR merged |
| 3.2 | Cloudflare Pages auto-deploys from main (build ~2 min) | deploy finishes |
| 3.3 | Live verification: GET /api/auth -> 401; POST /api/auth with "[REDACTED credential reference]" -> 200 + HttpOnly cookie; GET /data/*.json -> SPA shell (no JSON); bundle contains vip_signal + DegenDesk, contains NO [REDACTED exposed credential] string, NO fakeTxHash; login with "[REDACTED credential reference]" works in the browser | all green |
| 3.4 | Run the 06 launch checklist items 1-9 | launch-ready |

---

## What I need from you
1. **Approve this plan** -> I execute Phase 0 immediately (commits stay local until Phase 3).
2. **Phase 3:** approve the PR/merge (that is the moment the web actually updates).
3. (Optional) a stronger password later via PASSWORD_HASH env — "[REDACTED credential reference]" stays until you set it.

## Honest risk note (password "[REDACTED credential reference]")
The cockpit password is a **soft gate**: anyone who reads the public source knows the default is "[REDACTED credential reference]". What actually protects the paid data is the **API-level gating** (payload leak closed on origin — /data/*.json no longer serves JSON). Acceptable for M0 per your decision; upgrade the password any time via PASSWORD_HASH with zero code changes.

## Acceptance criteria
1. Phase 0 gate: build + vitest + pytest + both sentinels ALL GREEN on local-v4-vip.
2. One VIP dispatch path, provenance gate enforced, 41+ tests green.
3. Live after Phase 3: auth 401 GET / 200 POST("[REDACTED credential reference]"); /data/*.json returns SPA shell; no fallback-secret string, no fakeTxHash in the deployed bundle.
4. Zero honesty incidents on the deployed site.
5. Repo ~174 MB lighter locally; docs package on origin.