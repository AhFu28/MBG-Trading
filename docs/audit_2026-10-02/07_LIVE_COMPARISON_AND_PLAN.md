# 07 — Live Comparison & Complete Remediation Plan (2026-10-03)

**Live web:** mbg-trading.pages.dev (probed 2026-10-03, 00:05-00:25 WIB) · **Repo:** local main @ e297fa4 vs origin/main @ 71037c0
**Headline:** the local tree is **20 commits BEHIND origin/main**, and origin has already closed several of the audit's findings — while DIVERGING from the local uncommitted work on auth policy. The plan below reconciles both into one shippable tree.

---

## 1. The headline finding

- **Local:** main @ e297fa4 + **12 modified + ~19 untracked files** (uncommitted TRUST01 fix, v4 SpaceX-class UI rework, VIP signal router, all docs). Nothing committed.
- **Origin:** main @ 71037c0 — **20 commits ahead**, including: public payload leak closed (a044e9b), multi-chain degen desk + memecoin radar (DegenDesk.jsx, MemecoinRadar.jsx, earlySignal.js), pump.fun production fix (f4acb13), **v5.8.0 security hardening + honest data labeling + Paper Broker v2 side-aware** (e72cf4c), frontend vitest suite, and the [MP]+[BL] source docs committed under new plan/.
- **Live site:** Cloudflare Pages deploys from origin — the live bundle (index-dVO8ozhf.js, 450,613 B) IS the origin build.

## 2. Live web verification

| Check | Result | Meaning |
|:---|:---|:---|
| GET / | 200, SPA shell | site up |
| GET /data/daily_trade_plans.json | 200 but returns **HTML** (SPA catch-all) | payload file GONE — **S2 leak CLOSED on live** |
| GET /data/latest_arena_state.json | 200 HTML (same) | promo payload also moved to API |
| GET /api/auth | **401 {"error":"Unauthorized"}** | auth live and enforcing |
| Bundle: DegenDesk / MemecoinRadar / memecoinDesk | **PRESENT** | newest origin features live |
| Bundle: fallback-secret-for-dev | **ABSENT** | **S8 FIXED on live** |
| Bundle: fakeTxHash | **ABSENT** | **S4 FIXED on live** |
| Bundle: vip_signal | **ABSENT** | local VIP router NOT live (still uncommitted) |

## 3. Finding-by-finding re-verification (01_REPO_AUDIT vs origin/live)

| Finding | On origin/live now | Evidence |
|:---|:---|:---|
| S1 TRUST01 auth | **PARTIAL — POLICY DIVERGENCE** | origin fixed PasswordGate (server confirmation) + resolveAuthConfig, BUT keeps DEFAULT_PASSWORD_HASH = sha256("MBG") fallback ("login keeps working out of the box") — violates the [BL] TRUST01 gold standard (no default secrets). The local uncommitted fix **fails closed (503)**. Local sentinel would FAIL on origin's auth.js — correctly per [BL]. -> decision **D-8b** |
| S2 premium JSON (TRUST04) | **CLOSED** | public/data/ emptied on origin (all 8 payloads deleted, -142k lines); live /data/*.json returns SPA shell; data.js serves via API |
| S4 fake swap hash | **CLOSED** | SolanaSwapModal rewritten (+ f4acb13 origin-lock fix); no fakeTxHash in live bundle |
| S8 data.js fallback secret | **CLOSED** | origin: JWT_SECRET = env.JWT_SECRET or (await deriveJwtSecret(PASSWORD_HASH)); "authentication is mandatory — no anonymous fallback" |
| S5 broker keys | **IMPROVED** | origin added brokerGateway.test.js (179 lines) |
| S9 client tier decorative | **UNVERIFIED on origin** | App.jsx changed (+49) — re-check after rebase |
| D1 useLivePrices seeding | **LIKELY ADDRESSED** | e72cf4c "honest data labeling & Paper Broker v2 (side-aware)" — re-verify after rebase |
| S3 webhook enforcement | **OPEN** (as before) | needs signed/unsigned POST pair on live |
| S6 HF daemon reset | **OPEN** (as before) | local finding stands |
| S7 git hygiene | **LOCAL-ONLY** | origin does NOT track Python/ (0 files) — the 173.8 MB folder is local junk; fix .gitignore + delete locally before any commit |
| B6 frontend tests | **CLOSED** | origin: vitest 2.1.8, test: vitest run, 4 test files (brokerGateway 179, earlySignal 521, memecoinDesk 91, marketHours 72) |

## 4. Divergence map (local uncommitted work vs origin, the 6 conflicted files)

| File | Diff vs origin | Both changed? | Reconciliation |
|:---|:--:|:--:|:---|
| frontend/src/components/HomeDashboardTab.jsx | **2,007 lines** | YES — the big one | origin as base (radar/degen wired) + re-apply local v4 tokens/layout -> **D-8c** |
| frontend/src/index.css | 409 | YES | merge — local v4 tokens mostly additive |
| frontend/src/App.jsx | 119 | YES | merge — keep origin's lazy routes + local's v4 shell |
| frontend/functions/api/auth.js | 171 | YES — policy divergence | origin's structure + **D-8b** policy decision |
| frontend/src/components/PasswordGate.jsx | 127 | YES | compare both fixes; keep origin's + local improvements; verify with 16 runtime cases |
| frontend/public/_headers | 22 | YES | merge both hardenings |

**Local-only (bring to origin, no conflicts):** engine/notifiers/vip_signal_router.py + engine/tests/test_vip_signal_router.py (41 tests) + engine/config/vip_subscribers.json + scripts/send_vip_signals.py + scripts/verify-trust01.mjs + scripts/verify-auth-handler.mjs + docs (MASTERPLAN_V3, consolidation/, audit_2026-10-02/, sources/, screenshots) + frontend/src/utils/format.js + the 2 spacex mockups (move to docs/screenshots).

**Origin-only (already shipped):** payload-leak closure, DegenDesk + MemecoinRadar + earlySignal + memecoinDesk, vitest suite, pump.fun fix, v5.8.0 hardening, Paper Broker v2, new plan/ docs.

---

## 5. THE PLAN — what I will change, update, modify

### Phase 0 — Protect & rebase (critical path, ~1 session)
| # | Action | Verify |
|:--|:---|:---|
| 0.1 | **Commit ALL local work to branch local-v4-vip NOW** — explicit staging (12 modified + untracked docs/, engine/, scripts/, frontend/src/utils/format.js). NEVER git add . (Python/ 173.8 MB). Add Python/ + %SystemDrive%/ to .gitignore first | git status clean on the branch; Python/ untracked |
| 0.2 | Merge origin/main into the branch; resolve the 6 conflicts per the divergence map | merge completes; no leftover conflict markers |
| 0.3 | HomeDashboardTab: origin base + local v4 tokens/layout (D-8c recommended path) | build passes; visual parity vs docs/screenshots/spacex_rework_2026-10-01/ |
| 0.4 | Port VIP router + tests + config + send script; **reconcile with origin's a044e9b VIP wiring into ONE dispatcher** (ponytail: one path, not two) | 41 pytest green; single dispatch path |
| 0.5 | Update both verify scripts for origin's auth structure + D-8b outcome | sentinels PASS on the reconciled auth.js |
| 0.6 | Full gate: npm run build + npx vitest run + py -m pytest engine/tests + both sentinels | **ALL GREEN before any push** |

### Phase 1 — Security hardening on the reconciled tree (~2-3 days)
| # | Action | Verify |
|:--|:---|:---|
| 1.1 | Apply D-8b: remove DEFAULT_PASSWORD_HASH, fail closed (503) when PASSWORD_HASH unset; owner sets PASSWORD_HASH in Cloudflare env (2 min) | auth runtime 16 cases green; live 503 without env |
| 1.2 | S9: remove the debug tier cycle; make tier server-owned (TRUST03 grant table, 04_ERD.md Part B) | no localStorage tier escalation |
| 1.3 | S3: verify webhook secret enforcement (signed/unsigned POST pair) | unsigned -> 401/403 |
| 1.4 | S6: scoped admin auth on HF daemon reset endpoint | reset requires identity |
| 1.5 | Audit origin's NEW surfaces (DegenDesk, MemecoinRadar, earlySignal, memecoinDesk): synthetic labeling, Date.now seeding, provenance | no synthetic-as-LIVE |

### Phase 2 — Docs & hygiene (~1 day)
| # | Action | Verify |
|:--|:---|:---|
| 2.1 | Commit the docs package (V3, consolidation/, audit_2026-10-02/, sources/) | docs on origin |
| 2.2 | .gitignore: Python/, %SystemDrive%/; delete local Python/ (173.8 MB, not on origin) | repo size drops |
| 2.3 | Update MASTERPLAN V3 -> V3.1: S2/S4/S8 closed on origin; origin's new features; VIP router status; the rebase story | doc matches reality |
| 2.4 | Local spacex mockups -> docs/screenshots only (not public/) | nothing extra ships |

### Phase 3 — Deploy & verify (~0.5 day)
| # | Action | Verify |
|:--|:---|:---|
| 3.1 | Push branch -> PR -> merge to main (owner approves) | PR merged |
| 3.2 | Cloudflare auto-deploys; verify live: /api/auth 401 GET + 200 POST (real password); /data/*.json -> SPA shell; bundle has vip_signal PRESENT, no fallback-secret, no fakeTxHash | live checks green |
| 3.3 | Run the 06 launch checklist items 1-9 | launch-ready |

## 6. Open decisions (owner)
| ID | Decision | Recommended default |
|:--|:---|:---|
| **D-8b** | Auth policy: fail-closed (secure, needs PASSWORD_HASH env) vs default-hash out-of-box (current live) | **fail-closed** — [BL] TRUST01 gold standard; the owner sets PASSWORD_HASH once |
| **D-8c** | HomeDashboardTab base: origin + local v4 tokens (recommended) vs local rework + re-wire radar | **origin + tokens** — keeps origin's features + tests, re-skins with v4 |
| D-1 | First paid market | crypto spot (unchanged) |
| D-2 | Data backend | Supabase (unchanged) |

## 7. Acceptance criteria (verifiable)
1. Build + vitest + pytest + both sentinels ALL GREEN on the reconciled tree.
2. Live: /api/auth 401 on GET, 200 with real password; /data/*.json returns SPA shell; deployed bundle contains vip_signal and contains NO fallback-secret-for-dev, NO fakeTxHash.
3. Zero honesty incidents: no synthetic data shown as LIVE on the deployed site.
4. Docs package committed; V3.1 matches the deployed reality.
5. One VIP dispatch path (not two), provenance gate enforced, 41+ tests green.