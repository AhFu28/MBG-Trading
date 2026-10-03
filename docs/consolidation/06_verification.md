# 06 — Independent Adversarial Verification

**Verifier role:** independent — did not author any code or document under review.
**Date/time:** 2026-10-02, ~02:03–02:20 (Asia/Bangkok, UTC+7).
**Repo:** `MBG-Trading`, branch `main`, working tree (nothing committed).
**Scope:** (P1) security re-verification of the auth bypass; (P2) independent production build; (P3) 10-claim spot-check against the four original source documents; (P4) spot-check of `docs/MASTERPLAN_MBG_UNIFIED_V3.md`.
**Method:** read the current working-tree files, `git diff`, raw `npm run build`, direct inspection of the minified production bundle, ticket-heading enumeration, and line-level citation of the source documents. No source file was modified; no commit was made.

> **Concurrency note (material):** `frontend/public/_headers` was modified by another actor at **02:14:21**, mid-verification (its comment block changed; the header directives did not). `PasswordGate.jsx` (mtime 01 Oct 23:22:55) and `functions/api/auth.js` (01 Oct 23:39:31) did **not** change during this verification. `docs/consolidation/01…05` and the unified plan were also being written while this report was produced. Findings below are pinned to the state observed at the times stated; unstable items are marked.

---

## PART 1 — SECURITY RE-VERIFICATION

### 1a. Can a user reach the protected app WITHOUT valid credentials?

**Answer: No, not in a production build.** The client-side gate cannot be opened by a password, by storage writes, or by direct rendering. There is **one** residual path to the *premium data* (not the app UI), and **one** conditional server-side forgery path — both detailed below.

Evidence:

1. **The old hardcoded `'[REDACTED credential reference]'` is gone.** It existed in `HEAD` at two places — `git show HEAD:frontend/src/components/PasswordGate.jsx` lines 80 and 102 (`if (input.trim().toLowerCase() === '[REDACTED credential reference]')`). The current file contains no such comparison: the only credential path is the server POST at `frontend/src/components/PasswordGate.jsx:93-108`. `scripts/verify-trust01.mjs:41` asserts the string `=== '[REDACTED credential reference]'` is absent and passes.
2. **Writing `localStorage`/`sessionStorage` cannot grant access.** On every mount the component *first discards* the local hint (`PasswordGate.jsx:58`, `clearSessionHint()`), then asks the server (`:61-66`); `setAuthed(true)` is only reached inside `if (data && data.authenticated === true)` (`:69-72`). A stored object is never parsed for `authenticated`; the old `parsed?.authenticated` read (HEAD lines ~24–40) is removed.
3. **Direct rendering is not possible.** `App.jsx` has exactly one render return for the whole application (`frontend/src/App.jsx:448`), and it wraps every child in `<PasswordGate>` (`:449`) through `</PasswordGate>` (`:1150`). `PasswordGate` returns `children` only when `authed` is true (`PasswordGate.jsx:149-151`); otherwise it returns the login screen (`:154-240`). `frontend/src/main.jsx` renders `<App />` inside an `ErrorBoundary` that renders an error screen, never the app, on failure. No alternate HTML entry renders the app (the `public/*.html` files are standalone static mockups, not the application).
4. **The DEV bypass cannot be reached** — see 1b.
5. **Residual path to premium DATA (not the UI): TRUST04 is open.** The eight signal payloads are static files under `frontend/public/data/` (verified: `frontend/public/data/{latest_cockpit_bundle,macro_telemetry,research_archive,daily_trade_plans,idx_categorized,latest_arena_state,crypto_spot_10,latest_crisis_alert}.json`) and are fetched directly by the app (`App.jsx:367,380,390`; `DataIntegrityModal.jsx:34,130,139`; `NewsTab.jsx:41-42,62`; `AiAgentArenaTab.jsx:2408`). Anyone can request `/data/*.json` without any credential. The gate protects the app shell, **not** the product data. This is explicitly acknowledged as unfixed in the plan (`MASTERPLAN_MBG_UNIFIED_V3.md:184,308-319`).
6. **Residual conditional forgery path (server):** `functions/api/auth.js:99-105` — if `JWT_SECRET` is missing/`<16` chars **and** `MBG_ALLOW_INSECURE_DEV_SECRET === 'true'` is set, the handler signs sessions with the hardcoded public constant `'[REDACTED historical signing constant]'`. Anyone who reads the source could then forge a valid `mbg_jwt` cookie. With the env var unset, the same condition returns `null` → `503` fail-closed. **This is a deployment-configuration risk, not a default bypass.**

### 1b. Is the DEV bypass impossible in a production build?

**Answer: Yes — structurally impossible, and empirically absent from the built bundle.** The condition requires **BOTH** operands, and the first is a compile-time constant in production.

```js
// frontend/src/components/PasswordGate.jsx:15-16
const DEV_AUTH_BYPASS =
  import.meta.env.DEV && import.meta.env.VITE_MBG_DEV_AUTH_BYPASS === 'true';
```

Mechanism: Vite performs static replacement of `import.meta.env.DEV` at build time — it is literally replaced by `false` in a production build (Vite ≥5; the repo uses `vite ^5.4.2`, resolved `vite v5.4.21`). `false && <anything>` is `false`, and the minifier then dead-code-eliminates the entire `if (DEV_AUTH_BYPASS) { … }` branch, including its `console.warn`. `VITE_MBG_DEV_AUTH_BYPASS` is a *second, independent* gate, so a stray `VITE_MBG_DEV_AUTH_BYPASS=true` in a build environment still cannot enable it.

Empirical proof (stronger than reading the source): the freshly built `frontend/dist/assets/index-BKI4mvp5.js` contains **no** occurrence of `DEV_AUTH_BYPASS`, `VITE_MBG_DEV_AUTH_BYPASS`, `testMode`, `d35bdd04ef…`, or `[REDACTED exposed credential]`. The minified gate begins directly with the fail-closed clearing call:

```js
function ng({children:e}){…F.useEffect(()=>{let T=!1;async function R(){tg();try{const M=await fetch(Js,{method:"GET",credentials:"same-origin",cache:"no-store",…})
```

`tg()` is `clearSessionHint`; there is no preceding dev-branch. `scripts/verify-trust01.mjs` independently scanned **25 JS chunks** and passed (`production bundle scanned (25 JS chunks) contains no auth-secret literals`). Confirmed: **both** operands are required, and in a production build the first is statically `false`.

### 1c. Does `git diff` show any security header REMOVED or WEAKENED in `frontend/public/_headers`?

**Answer: No security header was weakened.** Exactly one header line was *removed* — `Access-Control-Allow-Origin: *` — which **strengthens** security (it eliminates anonymous cross-origin reads). Caching was changed from public/CDN-cacheable to `no-store`. All other security headers are untouched. The complete diff (single hunk):

```diff
-/data/*.json
-  Cache-Control: public, max-age=60, s-maxage=300
-  Access-Control-Allow-Origin: *
+# TRUST04 (partial, non-breaking): telemetry/plan payloads must not be indexed,
+# CDN-cached, or readable cross-origin. Static files remain directly fetchable until
+# the /api/data migration lands (see docs/consolidation/05_security_implementation.md);
+# these headers only reduce exposure and must not be removed before that migration.
+/data/*
+  Cache-Control: no-store, max-age=0
+  X-Robots-Tag: noindex, nofollow, noarchive
+
+# Defense in depth: any data JSON accidentally published at the public root also
+# gets the same no-store/noindex policy. NOTE: the /data/*.json rule above was
+# already correct (payloads live in frontend/public/data/), so this is belt-and-
+# braces, not a fix for a path drift. See docs/consolidation/03_repo_truth_audit.md A4.
+/*.json
+  Cache-Control: no-store, max-age=0
+  X-Robots-Tag: noindex, nofollow, noarchive
```

Line-by-line: `/data/*.json` → `/data/*` (broader, but only *adds* restrictive headers); `Cache-Control: public, max-age=60, s-maxage=300` → `Cache-Control: no-store, max-age=0` (strengthened); `Access-Control-Allow-Origin: *` → **removed** (strengthened); `X-Robots-Tag: noindex…` added. Lines 1–6 (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and the full CSP) are byte-identical before and after. The same content is present in the built `frontend/dist/_headers`.

### 1d. Does `/api/auth` return a session the client cannot forge, and does the client refuse to mint a session locally?

**Answer: Yes to both.** Authorization is the server-signed, `HttpOnly` cookie; the JSON `session` is only an opaque `crypto.randomUUID()` hint and is not itself a credential.

Server (`frontend/functions/api/auth.js`):

```js
// :219-228
const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
const sid = crypto.randomUUID();
const token = await signJWT({ authenticated: true, sid, expiresAt }, JWT_SECRET);
return jsonResponse(
  { authenticated: true, expiresAt, session: sid },
  200,
  { 'Set-Cookie': `mbg_jwt=${token}; HttpOnly; Secure; Path=/; Max-Age=${24*60*60}; SameSite=Strict` }
);
```

`signJWT` (`:36-46`) is HMAC-SHA-256 over `header.body` with `JWT_SECRET`; `verifyJWT` (`:48-74`) re-verifies the signature and rejects payloads whose `authenticated !== true` or that are expired. There is no `DEFAULT_HASH`, `OLD_HASH`, or plaintext comparison: `isMatch = timingSafeEqualHex(inputHash, PASSWORD_HASH)` (`:213`).

Client (`frontend/src/components/PasswordGate.jsx`):

```js
// :101-108
if (res.ok) {
  const data = await res.json().catch(() => ({}));
  // Never mint a session client-side: the server must confirm it.
  if (!data || data.authenticated !== true) {
    setError('ACCESS DENIED. Server did not confirm the session.');
    setInput('');
    return;
  }
```

and on the network-error path (`:132-135`): `catch (_) { /* Never fall back to a client-side password check. */ setError('Network error during authentication.'); }`. Runtime confirmation: `scripts/verify-auth-handler.mjs` executed the real handlers and passed all 16 assertions, including `hardcoded '[REDACTED credential reference]' -> 401`, `legacy plaintext password -> 401`, `GET with forged token -> 401`, `GET with tampered signature -> 401`, `missing JWT_SECRET -> 503 (no dev fallback)` (exit 0).

**Caveat:** `handleLogout` (`PasswordGate.jsx:138-144`) only clears local hints; there is no server logout endpoint, so the `HttpOnly` cookie stays valid until expiry. Logout is therefore not revocation — a known, documented follow-up (`:140-141`).

---

## PART 2 — INDEPENDENT BUILD PROOF

Command: `npm run build` in `frontend` (node_modules present; `npm ci` not needed). Run twice; identical, deterministic output. Raw output of the final run:

```
npm notice run mbg-stock-crypto-cockpit@1.0.0 build
npm notice run vite build
vite v5.4.21 building for production...
transforming...
✓ 83 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                    0.87 kB │ gzip:   0.49 kB
dist/assets/index-gwkvlZ7J.css                    26.62 kB │ gzip:   5.70 kB
dist/assets/tv-helpers-CesYsnir.js                 0.90 kB │ gzip:   0.50 kB
dist/assets/TestingHubTab-DDN093R4.js              1.71 kB │ gzip:   0.83 kB
dist/assets/TradingViewModal-3gxHMrkS.js           4.98 kB │ gzip:   2.13 kB
dist/assets/MarketHeatmapTab-DH8uYB08.js           8.03 kB │ gzip:   2.82 kB
dist/assets/OrderExecutionModal-DCVFXldb.js       11.93 kB │ gzip:   3.59 kB
dist/assets/SolanaSwapModal-CPYJPnSL.js           12.82 kB │ gzip:   3.98 kB
dist/assets/ForexCommandTab-wV6ba5rU.js           13.50 kB │ gzip:   3.82 kB
dist/assets/LotCalculatorModal-B4pCEoHE.js        13.51 kB │ gzip:   3.60 kB
dist/assets/VirtualForwardPortfolio-Ds2sCcBc.js   13.75 kB │ gzip:   3.80 kB
dist/assets/BacktestPerformanceLab-M8a8ralt.js    14.50 kB │ gzip:   5.10 kB
dist/assets/USStockTab-DphsKT_9.js                18.77 kB │ gzip:   4.99 kB
dist/assets/OrderBookSimulator-0vZmS9is.js        20.44 kB │ gzip:   5.19 kB
dist/assets/ChartingDeskTab-CSib6Q7X.js           21.28 kB │ gzip:   5.96 kB
dist/assets/SecurityHubDrawer-DxFt3GNj.js         25.07 kB │ gzip:   7.01 kB
dist/assets/NewsDetailModal-Y8kbYDnq.js           25.68 kB │ gzip:   6.26 kB
dist/assets/FlowProcessTab-CuVip4Y2.js            26.15 kB │ gzip:   6.74 kB
dist/assets/GlobalMarketsTab-DEJZp9O_.js          26.92 kB │ gzip:   7.09 kB
dist/assets/EconomicCalendarTab-DXZCGsRV.js       35.29 kB │ gzip:  10.92 kB
dist/assets/CryptoFuturesTab-BPoUHbCj.js          39.41 kB │ gzip:   9.44 kB
dist/assets/ChangelogTab-BWVOpKCM.js              83.88 kB │ gzip:  29.33 kB
dist/assets/QuantAcademyTab-H79c-HEN.js           85.13 kB │ gzip:  25.04 kB
dist/assets/AiIntelligenceDrawer-C5xspFKu.js      85.56 kB │ gzip:  23.38 kB
dist/assets/WhaleIntelligenceTab-CH0f_Gux.js     100.64 kB │ gzip:  24.42 kB
dist/assets/AiAgentArenaTab-WbCwSP9-.js          290.04 kB │ gzip:  75.54 kB
dist/assets/index-BKI4mvp5.js                    426.59 kB │ gzip: 122.40 kB
✓ built in 1.57s

EXIT=0
```

(`npm notice …` lines are npm's own banner written to stderr; the build itself emitted no warning or error.)

| Metric | Result |
|---|---|
| **Exit status** | **0** (success) |
| **Build time** | **1.57 s** (first run 1.61 s) |
| **Modules transformed** | **83** |
| **Emitted chunks/assets** | **27 files**: `index.html` + 1 CSS + **25 JS chunks** (largest `index-BKI4mvp5.js`, 426.59 kB / 122.40 kB gzip; then `AiAgentArenaTab`, 290.04 kB; 23 lazy route chunks) |
| **Warnings / errors** | **None** from Vite. No chunk-size warning printed. |
| **Bundle scan** | `scripts/verify-trust01.mjs`: **PASS** (0 failures), incl. "production bundle scanned (25 JS chunks) contains no auth-secret literals" |
| **Handler runtime test** | `scripts/verify-auth-handler.mjs`: **PASS** (16/16, exit 0) |

---

## PART 3 — TARGETED CLAIM SPOT-CHECK (10 claims)

Verdicts are against the original attached documents; "source line" is the exact line used.

| # | Claim | Verdict | Evidence | Source line |
|---|---|---|---|---|
| **C1** | Master plan core effort envelope is 13.5–24 engineer person-weeks | **TRUE** | "**Core subtotal: 13.5–24 engineer person-weeks.**" (and "One engineer person-week means roughly five focused working days") | `MBG-Trading-Revamp-Master-Plan.md:935` (also `:922`) |
| **C2** | Backlog contains exactly 32 planned tickets | **TRUE** | Enumerated all `^### <ID> —` ticket headings: BASE01–04, TRUST01–06, DESIGN01–05, WORKSPACE01–03, PDF01, RESEARCH01–05, COMMERCIAL01–06, OPS01–02 = **32**; "All tickets below are **planned**" | `MBG-Trading-Implementation-Backlog.md:8` (heading census across the file) |
| **C3** | Lean doc allots Week 1 of its 4-week plan 2–3 working days | **TRUE** | "### Pekan 1: Amankan Pintu & Kunci Data (Est. 2-3 Hari Kerja)" under "Roadmap Nyata 4 Pekan" | `STRATEGI_EKSEKUSI_DAN_SARAN_MAS_FUAD.md:98` (plan at `:87`) |
| **C4** | Master plan states no data rights were established | **TRUE** | "**No actual MBG IDX/US/feed/news rights were established by this plan.**" | `MBG-Trading-Revamp-Master-Plan.md:1009` |
| **C5** | §4.3 prices labelled "test hypotheses, not present tariffs" | **TRUE** | §4.3 "Quota and pricing experiments"; "These are **test hypotheses**, not present tariffs or promises." | `MBG-Trading-Revamp-Master-Plan.md:238` (section at `:236`) |
| **C6** | §6.2 token values are proposed starting values, not accessibility-certified | **TRUE** | §6.2 "Initial semantic tokens"; "These are proposed starting values, not accessibility-certified combinations." | `MBG-Trading-Revamp-Master-Plan.md:368` (section at `:366`) |
| **C7** | §6.2 states there should be no essential 8px text | **TRUE** | Token table row: "Default 14 px; dense data target 12–13 px; supporting metadata about 12 px; **no essential 8 px text**" — line 390 lies inside §6.2 (366 → next heading §7 at 404) | `[REDACTED credential reference]-Trading-Revamp-Master-Plan.md:390` |
| **C8** | PRD says its own status is "FINAL & APPROVED FOR PRODUCTION SPRINT" | **TRUE** | "**Status Dokumen:** FINAL & APPROVED FOR PRODUCTION SPRINT" | `PRD_PROJECT_MBG_V2_MASTER.md:10` |
| **C9** | PRD budget table lists a domain cost row while totalling Rp0/month | **TRUE** | Row 8: "Domain Kustom (Opsional) │ Cloudflare Registrar │ ~Rp 12.500/bln"; the table's bottom line: "TOTAL BIAYA OPERASIONAL BULANAN │ **RP 0 / BULAN**" — an internal contradiction | `PRD_PROJECT_MBG_V2_MASTER.md:317` vs `:320` (table §5 at `:302`) |
| **C10** | Lean doc claims 50 × Rp200,000 = Rp10,000,000/month and calls it net income | **TRUE** | "**50 Member VIP Pertama:** 50 × Rp 200.000 = **Rp 10.000.000 / bulan** pemasukan bersih berulang (*MRR*)" — "pemasukan bersih" = net income | `STRATEGI_EKSEKUSI_DAN_SARAN_MAS_FUAD.md:81` |

**Part 3 tally: 10 TRUE · 0 FALSE · 0 UNSUPPORTED.** All ten claims are direct, verifiable quotations. Note that C10's underlying assertion (that "net" is correct) is itself false economics — the lean document *does* call it "pemasukan bersih"; the claim as literally stated is TRUE, and the consolidated plan correctly rebuts it at `MASTERPLAN_MBG_UNIFIED_V3.md:500`.

---

## PART 4 — SPOT-CHECK OF `docs/MASTERPLAN_MBG_UNIFIED_V3.md`

Reviewed all 602 lines against the four source documents and the working tree. Most citations check out (spot-verified: `[BL] 44, 102, 116, 131, 161, 210-211, 235, 247, 249, 257, 404, 556-560`; `[MP] §15.2` values at 943–948; `[MP] 317/320`; `[BL] 8/32`; `telegram_notifier.py` reference; old-gate line numbers). **The following are FALSE or UNSUPPORTED.**

**F1 — `[V2]` line count is wrong (FALSE).**
Line 33's source table: "`PRD_PROJECT_MBG_V2_MASTER.md` | **379**". The file is **433 lines** (`(Get-Content …).Count` = 433; the reader also reports "total 433 lines"). Off by 54.

**F2 — The `_headers` "path drift" claim is false and already refuted inside the repo (FALSE).**
Line 101: "`_headers` menargetkan `/data/*.json` padahal file JSON ada di **root `public/`** → **aturan tidak mengenai sasaran**". Line 301 repeats it: "**Drift `/data/*.json` diperbaiki**". Repo facts:
- `frontend/public` contains **0** JSON files at its root; all eight payloads are in **`frontend/public/data/`** (so the old `/data/*.json` rule **did** match them).
- The app fetches them from `/data/*.json` (`App.jsx:367,380,390`; `NewsTab.jsx:41,62`; `DataIntegrityModal.jsx:130,139`).
- `docs/consolidation/03_repo_truth_audit.md:78-80` states: "**A4 — CORRECTION: there was no path drift** … the HEAD rule `**/data/*.json` targets them **correctly**"; line 197: "One Lead claim (`_headers` drift) was **wrong**".
- `frontend/public/_headers:17-19` (as corrected at 02:14:21) itself now says: "the /data/*.json rule above was **already correct** … not a fix for a path drift."
So V3 lines 101 and 301 are stale/refuted. The header change is still a genuine improvement (removal of `Access-Control-Allow-Origin: *` and public caching), but it is not a drift fix and does not close the exposure.

**F3 — "8 file termodifikasi" could not be reproduced (UNSUPPORTED).**
Line 106: "Kerja v4 SpaceX-class + polish WCAG **belum di-commit (8 file termodifikasi** + `format.js` baru …)". `git status --porcelain` shows **11** modified tracked files (`CHANGELOG.md`, `functions/api/auth.js`, `index.html`, `public/_headers`, `App.jsx`, `HomeDashboardTab.jsx`, `LotCalculatorModal.jsx`, `MasterQuantLeaderboard.jsx`, `PasswordGate.jsx`, `USStockTab.jsx`, `index.css`). The claimed 8-file UI subset is not enumerated anywhere, so the exact number is unverifiable/stale. (Counting UI-touching tracked files gives 7, not 8.)

**F4 — "Supabase + Supabase Auth" as a Week-1 SHIP NOW item is unsupported against the repo (UNSUPPORTED / inconsistent).**
Line 137 lists "Supabase + Supabase Auth" among SHIP NOW features, and `02_product_gtm_reconciliation.md:94` calls Supabase Auth "the Week-1 replacement for the client-side password gate". The Week-1 auth that was actually implemented is a **Cloudflare Pages Function** using `PASSWORD_HASH` (SHA-256 hex) + `JWT_SECRET` with an HMAC-signed `HttpOnly` cookie (`frontend/functions/api/auth.js:36-46,93-105,219-228`). There is no Supabase Auth code in the repo. The plan does not reconcile the chosen identity provider with the one it lists as shipped.

**F5 — `docs/consolidation/01..06_*.md` cited as existing (UNSUPPORTED at verification time).**
Lines 45 and 566 present `01..06_*` as workstream artifacts. At the time of check only `01`–`05` existed; `06_verification.md` did not (this report creates it). Cosmetic/forward-looking, but it was cited as already-delivered evidence.

**Confirmed CORRECT (the two points the task specifically asked about):**
- **The security bypass was removed** — V3 lines 299 and 306 ("Password `[REDACTED credential reference]` hardcoded dicabut total", "Bundle produksi tidak memuat cabang bypass") are **TRUE**: verified in the current source and in the minified `dist/assets/index-BKI4mvp5.js` (no `DEV_AUTH_BYPASS`/`VITE_MBG_DEV_AUTH_BYPASS`/`testMode`/hash literals; gate begins at `clearSessionHint()`).
- **TRUST02 / TRUST03 / TRUST06 were NOT implemented** — V3 lines 185–186 and 570 are **TRUE**: no ownership/RLS/private-storage work (`engine/database/schema.sql` untouched; not in `git status`), no server-owned capability/market policy (`access-policy.js` / `/api/me/entitlements` absent), no sandbox release flags. Tier is still user-writable `localStorage` (`App.jsx:184-195`, `mbg_user_tier`, with a click-to-change control at `:570-573`), exactly as V3 line 104 states.

---

## UNSUPPORTED / NOT REPRODUCIBLE

- **Production configuration** (`PASSWORD_HASH`, `JWT_SECRET`, `MBG_ALLOW_INSECURE_DEV_SECRET`, `VITE_MBG_DEV_AUTH_BYPASS`) — no access to the Cloudflare Pages environment; not verifiable from the working tree. **UNSUPPORTED.**
- **Live/deployed exposure** (whether the deployed site runs this revision, whether the current admin password is weak) — working-tree only; **UNSUPPORTED.** V3 line 580 concedes the same.
- **Edge behavior of `_headers`** (whether Cloudflare applies `/*.json` to nested paths) — cannot be deployed/tested here; documented semantics only. **UNSUPPORTED.**
- **F3 (8-file count)** — UNSUPPORTED as above.

---

## FINAL VERDICT — GO / NO-GO

**Security change (TRUST01 auth-bypass removal): GO.** The hardcoded `[REDACTED credential reference]` path is gone from source and from the shipped bundle; the session is server-owned and `HttpOnly`; the client refuses to mint a session; the server fails closed on missing config; the build is green and both verification scripts pass 100%. No user can reach the app UI without valid credentials in a production build, and the DEV bypass is structurally impossible there.

**Releasing it as a *closed* security workstream: NO-GO.** It is only releasable once the following are satisfied and evidenced; B6 forbids a claim, not the code.

**Blocking items**

| # | Blocker | Why it blocks | Evidence / where |
|---|---|---|---|
| **B1** | `PASSWORD_HASH` must be set in the production environment (64-char lowercase hex SHA-256) | Unset → `/api/auth` returns **503**; nobody can log in (availability failure) | `auth.js:93-97,188-191` |
| **B2** | `JWT_SECRET` must be set to a random, ≥16-char secret | Unset/short → **503**; if set weak, sessions are guessable | `auth.js:99-105,188-191` |
| **B3** | `MBG_ALLOW_INSECURE_DEV_SECRET` must **not** be `'true'` in production | With it set and a short/missing secret, sessions are signed with the public constant `'[REDACTED historical signing constant]'` → **anyone can forge a valid cookie** | `auth.js:102-104` |
| **B4** | `VITE_MBG_DEV_AUTH_BYPASS` must not be present in the production build environment | Defense-in-depth only (the branch is already dead in prod), but it must not be relied on | `PasswordGate.jsx:15-16`; bundle scan |
| **B5** | Decide and verify logout/revocation semantics | `handleLogout` clears only local hints; the `HttpOnly` cookie remains valid to expiry; no server logout endpoint exists. If "logout revokes access" is in release scope, this blocks | `PasswordGate.jsx:138-144` |
| **B6** | Do **not** release with any claim that premium data is protected or that TRUST04 is closed | The eight payloads remain anonymously downloadable at `/data/*.json`; the header change is mitigation, not closure | `frontend/public/data/*.json`; `MASTERPLAN_MBG_UNIFIED_V3.md:184,308-319` |

**Also required (documentation accuracy, non-code):** correct V3 **F1** (379 → 433) and **F2** (remove the refuted "path drift" wording at lines 101/301, matching `03_repo_truth_audit.md:78-80`), and resolve **F4** (Supabase Auth vs the implemented Cloudflare auth handler). These do not block the code, but F2/F4 misdescribe what the shipped change does.

*End of report. No source file was modified and no commit was made by this verifier.*
