# 01 — Full Repo Re-Audit (2026-10-02)

**Repo:** C:/Users/ASUS/Documents/deepseek-harness/default-workspace/[REDACTED credential reference]-Trading (origin: AhFu28/[REDACTED credential reference]-Trading)
**Date/time:** 2 October 2026, ~15:50-16:20 WIB · **Author:** Lead (direct verification; delegated agents failed, every check below was re-executed by the Lead today)
**Method:** fresh npm build, py -m compileall, py -m pytest, both verify scripts, grep/read of every named surface, git status. No source modified.
**Verdict vocabulary:** FIXED / OPEN / PARTIAL / NOT-REPRODUCED / UNVERIFIABLE.

---

## 1. Executive summary

The repo is in the best state of its history: **build passes, all 41 engine tests pass, the TRUST01 auth bypass is fixed and verified, and the 2026-09-11 webhook open-relay is fixed** (secret now present). Three hard gaps remain, uncommitted-work risks aside:

1. **TRUST04 split still open** — 8 premium JSON payloads (~6.4 MB) sit in frontend/public/data/ and are downloadable without any credential; the leak mechanism is the unconditional local-fallback writer (supabase_client.py:36-51).
2. **Fake swap success still in code** — SolanaSwapModal.jsx generates a random 64-char "tx hash" on success (L141-143).
3. **Git hygiene** — a 173.8 MB embedded Python runtime (Python/) is untracked **and not .gitignored**; one `git add .` would commit it to GitHub.

### Scoreboard

| Check | Result | Evidence |
|:---|:---|:---|
| Frontend production build | **PASS** exit 0 | vite 5, 25 chunks + index-*.js 426.59 kB (gzip 122.4), built in 1.94s |
| Python engine compile | **PASS** exit 0 | compileall clean |
| Engine test suite | **PASS** 41 tests + 5 subtests, 2.64s | pytest engine/tests (pytest was pip-installed first — not preinstalled) |
| TRUST01 sentinel | **PASS** (10 checks + 25-chunk secret scan) | scripts/verify-trust01.mjs |
| Auth handler runtime | **PASS** (16 cases) | scripts/verify-auth-handler.mjs — wrong/hardcoded/legacy password -> 401; forged/tampered -> 401; real cookie -> 200; missing secrets -> 503 fail-closed |
| Frontend test runner | **MISSING** | frontend/package.json has no test script; engine-only coverage |
| Old audit CRIT findings (2026-09-11) | 2 FIXED, 1 obsolete, rest open/partial | section 6 |

---

## 2. Build & test matrix

| ID | Command (workdir) | Exit | Result |
|:--|:---|:--:|:---|
| B1 | npm run build (frontend/) | 0 | 25 chunks; largest: AiAgentArenaTab 290.04 kB, index 426.59 kB, WhaleIntelligenceTab 100.64 kB, QuantAcademyTab 85.13 kB, ChangelogTab 83.88 kB |
| B2 | py -m compileall -q engine | 0 | clean |
| B3 | py -m pytest engine/tests -q | 0 | **41 passed, 5 subtests** — incl. VIP router provenance gate, allowlist expiry, dry-run default |
| B4 | node scripts/verify-trust01.mjs | 0 | PASS — no [REDACTED credential reference] bypass/hash/fallback secret; PASSWORD_HASH documented; constant-time compare; HttpOnly signed cookie; bundle scan clean |
| B5 | node scripts/verify-auth-handler.mjs | 0 | PASS — 16 runtime cases, fails closed (503) when PASSWORD_HASH/JWT_SECRET missing or too short |
| B6 | npm test (frontend/) | — | Missing script: "test" — frontend has zero test runner (unchanged since 2026-09-11) |

> pytest was **not** installed in the embedded Python 3.14 runtime; it was installed by this audit (py -m pip install pytest). CI/workflows must do the same or vendor it.

---

## 3. Security findings

### S1 — Cockpit auth gate — **FIXED & VERIFIED** (TRUST01)
- **Files:** frontend/src/components/PasswordGate.jsx, frontend/functions/api/auth.js (both modified, uncommitted)
- **Evidence:** sentinel B4 + 16 runtime cases B5. No hardcoded [REDACTED credential reference], no legacy hash, no fallback JWT secret, constant-time-safe compare, HttpOnly+Secure+SameSite=Strict cookie, no-store cache headers, 503 fail-closed when env secrets missing.
- **Residual:** the fix is **uncommitted**. Losing the working tree loses the fix.

### S2 — Premium payloads downloadable without auth — **OPEN (HIGH)** (TRUST04)
- **Files:** frontend/public/data/*.json — 8 files, ~6.4 MB total:
  latest_cockpit_bundle.json 4.28 MB (contains daily_trade_plans, crypto_spot_10, smc_analysis, bandarmology_iifs — the paid signal content), daily_trade_plans.json 15.8 kB (VIP signal source), crypto_spot_10.json 7.7 kB, idx_categorized.json 58.7 kB, macro_telemetry.json 1.82 MB, research_archive.json 48.3 kB, latest_arena_state.json 46.8 kB (intended-public promo), latest_crisis_alert.json 0.3 kB.
- **Evidence:** Cloudflare Pages serves everything under public/ statically; the 2026-09-30 _headers hardening adds no-store/noindex but **does not stop a direct download**.
- **Leak mechanism CONFIRMED:** engine/database/supabase_client.py:36-51 (_save_local_fallback) **unconditionally mirrors every upsert into frontend/public/data/ AND engine/cache/** — even when Supabase is configured (macro L53-55, idx L64-66, etc). The TRUST04 split must change this writer, not just move files.
- **Minimal fix:** TRUST04 split — move premium payloads out of public/ (or behind a gated Pages Function); keep only promo-safe latest_arena_state.json + a public mini-bundle. Blocking on data-backend decision (D-2).

### S3 — Telegram webhook secret — **PARTIAL (fixed relay, enforcement unverified)**
- **File:** frontend/functions/api/telegram-webhook.js
- **Evidence:** TELEGRAM_WEBHOOK_SECRET string **is present** in the file (2026-09-11 finding of a missing guard not reproduced). Whether the handler *rejects* unsigned updates is not runtime-verified here — verify with a signed/unsigned POST pair before launch.

### S4 — Fake swap success — **OPEN (HIGH, honesty+trust)**
- **File:** frontend/src/components/SolanaSwapModal.jsx:141-143
- **Evidence:** `const fakeTxHash = Array.from({ length: 64 }, () => Math.floor(Math.random() ...)); hash: fakeTxHash` — a successful swap reports a **fabricated** on-chain hash. Also flagged [MP] H04.
- **Minimal fix (TRUST06):** label SIMULATION, or remove the fake hash and show the real Signature from the provider response; gate the module behind a release flag.

### S5 — Browser-held broker keys — **PARTIAL (MED)**
- **File:** frontend/src/services/brokerGateway.js:330-332 — constructor(apiKey, secretKey, isTestnet=true) holds keys in browser memory; no literal secrets found in the tree (grep). isTestnet defaults true — good.
- **Fix:** keep testnet-only for M0; no key custody in browser when real orders ship ([MP] H04).

### S6 — HF Space daemon reset without identity — **PARTIAL (MED)**
- **File:** deploy/huggingface/app.py — reset/admin references present; no auth literals found (grep). Scoped internal admin auth recommended ([MP] H03).

### S8 — Dev-fallback JWT secret in the data function — **OPEN (HIGH, TRUST01 inconsistency)** *(found by the PRD/ERD subagent, confirmed by the Lead)*
- **File:** frontend/functions/api/data.js:52 — const JWT_SECRET = env.JWT_SECRET || '[REDACTED exposed credential]';
- **Evidence:** grep repo-wide; the literal sits in the deployed functions bundle (frontend/functions/api/ -> /api/data). auth.js itself is clean (resolveJwtSecret, fails closed, 16 runtime cases green) — data.js is the remaining fail-open path: anyone who reads the public source knows a token-signing secret.
- **Minimal fix:** reuse the auth.js resolveJwtSecret helper and 503 when JWT_SECRET is missing; extend scripts/verify-trust01.mjs to scan functions/api/data.js.

### S9 — Client tier is decorative — **OPEN (MED, TRUST03 evidence)**
- **File:** frontend/src/App.jsx:184-198 — userTier comes from localStorage('mbg_user_tier') and cycleUserTier() cycles NEW -> FREE -> PRO on click.
- **Evidence:** anyone can become PRO in the UI by clicking; the tier gates nothing server-side until TRUST03 lands (premium payloads are public anyway, S2).
- **Fix:** server-owned tier (TRUST03) or at minimum remove the debug cycle control.

### S7 — Git hygiene / .gitignore gap — **OPEN (MED)**
- Python/ (173.8 MB embedded runtime, untracked) is **not matched by .gitignore** (git check-ignore exit 1; git ls-files Python shows 1 stray tracked file). A SystemDrive artifact folder also exists in the tree.
- **Fix:** add Python/ and the SystemDrive folder to .gitignore, git rm --cached the stray file, before any commit. frontend/dist is already ignored (not tracked).

---

## 4. Data-honesty findings

| ID | Finding | Status | Evidence |
|:--|:---|:---|:---|
| D1 | useLivePrices.js seeds synthetic ticks with Date.now() | **OPEN (MED)** | Date.now() present (grep, 713-line file); spot-overwrites-futures mark not reproduced |
| D2 | Whale tab shows synthetic whale events as live | **NOT-REPRODUCED** | grep for synthetic/generated_at/simulat in WhaleIntelligenceTab.jsx: **zero hits** — old finding stays historical; verify visually on deploy |
| D3 | news_research_agent.py fabricated-news fallback | **NOT-REPRODUCED** | grep for fallback/fabricat/synthetic/hardcod: zero hits — re-review manually before citing as fixed |
| D4 | paper_portfolio.py two-stop settlement defect | **DEFERRED** | paper trading not in M0 (V3 section 4.6); not re-verified |

**Binding rule (unchanged):** stale = stale, synthetic never LIVE, provenance (source + observed_at) on every outgoing signal — already enforced in engine/notifiers/vip_signal_router.py (REQUIRED_PROVENANCE_KEYS, NON_LIVE_STATES).

---

## 5. Ponytail bloat audit (ranked biggest cut first)

- `yagni` MasterQuantLeaderboard.jsx:11-15 legacy imports keep 8 heavy tabs bundled — QuantAcademyTab 85.1 kB, EconomicCalendarTab 35.3 kB, GlobalMarketsTab 26.9 kB, OrderBookSimulator 20.4 kB, TestingHubTab+labs, NewsTab, PearsonCorrelationWidget. If the v4 nav does not link them, cut the imports -> **~200 kB bundle reduction**. [frontend/src/components/MasterQuantLeaderboard.jsx]
- `delete` Python/ 173.8 MB embedded runtime + SystemDrive artifact folder — ignore both, remove from repo. [-173.8 MB] [.gitignore]
- `delete` frontend/public/mockup_spacex_home.html, mockup_spacex_screener.html — mockups ship to production under public/. Keep in docs/screenshots. [frontend/public/]
- `yagni` latest_cockpit_bundle.json 4.28 MB monolith — 12 top-level sections in one public file; split per TRUST04, serve premium parts gated. [frontend/public/data/]
- `delete` macro_telemetry.json 1.82 MB + idx_categorized.json — no frontend consumer found in the v4 tree (prior payload-consumer table); serve via API when consumed. [frontend/public/data/]
- `delete` dead-engine scripts & one-off PRD generators flagged by the 2026-09-11 audit (10 files / 5,773 lines) — not re-enumerated today; re-run the old list before cutting. [engine/, scripts/]
- `native` requests -> stdlib urllib.request where still imported (old finding; engine deps unchanged). [engine/]
- `shrink` duplicate bot runtimes (4 files / 958 lines duplicating the zero-cost edge webhook, per 2026-09-11 audit) — confirm against current tree before cutting. [functions/, engine/notifiers/]

**net: ~-200 kB bundle, -175 MB repo, -1.9 MB public payload, -1 dep possible.**

> **Correction vs the 2026-09-11 audit:** its "17 dead components (2,793 lines)" is **REFUTED for the current tree** — all 39 components are reachable (16 lazy chunks in App.jsx; the rest via MasterQuantLeaderboard.jsx:11-15 and nested imports; Vite emits a chunk for each, confirming reachability).

---

## 6. Verdict tables

### 2026-09-11 CRITICAL findings -> status now

| Old finding | Status now | Evidence |
|:---|:---|:---|
| CRIT-01 Order-book depth fails via browser CORS | **OBSOLETE/PARTIAL** — OrderBookSimulator no longer in main nav; reachable only via legacy MasterQuantLeaderboard imports | build chunks; import graph |
| CRIT auth bypass [REDACTED credential reference] | **FIXED & VERIFIED** | S1, B4, B5 |
| CRIT webhook open relay | **FIXED (secret present; enforcement unverified)** | S3 |
| CRIT public premium JSON | **OPEN** | S2 |
| CRIT math flaws / blockers (remainder) | **UNVERIFIABLE** — not re-enumerated item-by-item today; engine suite passes 41 tests | B3 |

### TRUST01-06 (from [BL] / V3 section 12)

| Ticket | Status now | Evidence |
|:--|:---|:---|
| TRUST01 auth/session | **DONE + VERIFIED** (uncommitted) | B4, B5 |
| TRUST02 public payload protection | **OPEN** | S2 |
| TRUST03 server-owned tier policy | **OPEN** (allowlist still file-based: engine/config/vip_subscribers.json; client tier localStorage-editable + debug cycle, App.jsx:184-198 — S9) | vip_signal_router.py header |
| TRUST04 data split | **PARTIAL** — _headers hardened; split pending | S2 |
| TRUST05 audit trail | **PARTIAL** — router records blocked dispatches; full trail pending | vip_signal_router.py |
| TRUST06 isolate unsafe modules | **OPEN** — fake swap hash live in code | S4 |

---

## 7. Git state & risk

- git status --short: **12 modified tracked files** (.env.example, CHANGELOG.md, frontend/functions/api/auth.js, frontend/index.html, frontend/public/_headers, frontend/src/App.jsx, 5 components, frontend/src/index.css) + **~18 untracked paths** (docs/MASTERPLAN_MBG_UNIFIED_V3.md, docs/consolidation/, docs/audit_2026-10-02/, docs/sources/, docs/screenshots/*, engine/config/, engine/notifiers/vip_signal_router.py, engine/tests/test_vip_signal_router.py, scripts/verify-*.mjs, scripts/send_vip_signals.py, frontend/src/utils/format.js, mockups, Python/).
- Last commit: e297fa4 chore(arena): 24/7 multi-tick state update [skip ci].
- **Risk:** one `git add .` commits the 173.8 MB Python/ runtime and a 4.28 MB payload refresh to GitHub. **Fix S7 first, then stage an explicit file list.**