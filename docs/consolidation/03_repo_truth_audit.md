# 03 — Repo Truth Audit: real repository state vs. document claims

**Workstream:** independent evidence audit (task-3) · **Date:** 2026-10-02 (Asia/Bangkok)
**Repo:** `C:\Users\ASUS\Documents\deepseek-harness\default-workspace\MBG-Trading`
**Method:** read-only inspection of the working tree with `read`/`grep`/`git`; no source file modified.
**Verdict vocabulary:** CONFIRMED · REFUTED · PARTIALLY · UNVERIFIABLE.

> **Provenance note.** The original `repo-truth` teammate terminated before writing this file. This audit was completed by the Lead from direct inspection. Verdicts rest on the evidence quoted here; anything the Lead did not reproduce is marked UNVERIFIABLE rather than assumed.

---

## A. Security surface

### A1 — Client-side authentication bypass in `PasswordGate.jsx` — **CONFIRMED BEFORE / REMEDIATED AFTER**

**Before (HEAD version, `git show HEAD:frontend/src/components/PasswordGate.jsx`):**
- Line ~80: `// Test phase convenience fallback: allow 'mbg' immediately (C-02 Owner Directive)` followed by `if (input.trim().toLowerCase() === 'mbg') { ... setAuthed(true); return; }`.
- Line ~102: the same `'mbg'` check inside the network-error `catch`, granting access when the auth endpoint was unreachable.
- `verifySession()` trusted `localStorage`/`sessionStorage['mbg_cockpit_auth']` — a client-written `{authenticated:true, expiresAt:<future>}` granted immediate access **without any server call**.

**Bypass answer (before):** YES — two independent routes: (1) type `mbg`, (2) write the localStorage key.

**After (working tree, lines 1–140):**
- `DEV_AUTH_BYPASS = import.meta.env.DEV && import.meta.env.VITE_MBG_DEV_AUTH_BYPASS === 'true'` — requires **both** conditions; Vite statically replaces `import.meta.env.DEV` with `false` in production builds.
- Every mount calls `clearSessionHint()` then `fetch(AUTH_ENDPOINT, { credentials:'same-origin', cache:'no-store' })` and only accepts `data.authenticated === true`.
- The `catch` block no longer contains any password comparison: it sets an error and leaves `authed=false` (fail closed).
- `handleSubmit` refuses to mint a session locally: `if (!data || data.authenticated !== true) { setError('ACCESS DENIED. Server did not confirm the session.'); ... }`.

**Bypass answer (after):** the client cannot self-authenticate. Access requires a server-verified session. **Residual:** the DEV bypass is reachable in a local dev server if the operator sets the env flag — this is explicit, named, and stripped from production. **Residual gap:** `handleLogout` clears only local hints; the HttpOnly cookie remains valid until expiry because no `/api/auth` DELETE/revocation route exists yet ([BL] 185 also flags `Sidebar.handleLogout` clearing local keys rather than server revocation).

### A2 — Server auth handler `functions/api/auth.js` — **CONFIRMED (hardened)**

| Property | Evidence |
|---|---|
| Authorization decided server-side only | File header lines 5–14; `onRequestPost` line 181 |
| Requires configured `PASSWORD_HASH` | `resolvePasswordHash` line 93–97 requires `/^[0-9a-f]{64}$/` (lowercase hex SHA-256); missing → 503 line 188–191 |
| No default/legacy/plaintext fallback | Comment line 211–212: "No DEFAULT_HASH, no OLD_HASH, no plaintext 'mbg' fallback" |
| Requires a real `JWT_SECRET` | `resolveJwtSecret` line 99–105; ≥16 chars, else 503; insecure dev secret exists **only** behind explicit `MBG_ALLOW_INSECURE_DEV_SECRET === 'true'` |
| Comparison hardened | `timingSafeEqualHex` line 79–89 folds length difference and compares full length |
| Session is signed, HttpOnly, not client-authoritative | `signJWT` HS256 line 36–46; `Set-Cookie: mbg_jwt=...; HttpOnly; Secure; Path=/; Max-Age=86400; SameSite=Strict` line 227 |
| JSON body returns opaque id | `{ authenticated:true, expiresAt, session: sid }` line 224 (no authoritative flag for the client to persist) |

**Weaknesses (honest):**
1. **Rate limiting is per-isolate in-memory** (`rateLimitMap`, line 119–138) — resets on cold start and is not shared across Cloudflare isolates/regions. Not a reliable brute-force control.
2. **No rate limit on `onRequestGet`** — the session-verification path is unmetered.
3. **No revocation/denylist** — a signed JWT stays valid until `expiresAt`; logout cannot invalidate it server-side.
4. **CSRF:** `SameSite=Strict` mitigates cross-site POST, but no explicit origin check exists on the state-changing POST.
5. **SHA-256 without salt/KDF** — a 64-hex SHA-256 of a short password is fast to brute-force offline if the hash leaks. Acceptable for a pilot gate, not for individual identity ([BL] 183 requires a hosted identity provider for TRUST01).

### A3 — Public data exposure — **CONFIRMED (real, and larger than a "drift" reading suggests)**

All eight data files live under **`frontend/public/data/`** and are copied verbatim into the production build output **`frontend/dist/data/`**:

| File | Public size | Same file in `dist/` |
|---|---:|---|
| `latest_cockpit_bundle.json` | 4.275.054 B (~4.2 MB) | yes |
| `macro_telemetry.json` | 1.820.903 B (~1.8 MB) | yes |
| `idx_categorized.json` | 58.650 B | yes |
| `research_archive.json` | 48.316 B | yes |
| `latest_arena_state.json` | 46.800 B | yes |
| `daily_trade_plans.json` | 15.813 B | yes |
| `crypto_spot_10.json` | 7.693 B | yes |
| `latest_crisis_alert.json` | 321 B | yes |
| **Total** | **~6.27 MB** | |

**Fetchable publicly?** YES. They are plain static assets served by the CDN at `/data/<file>.json`. Nothing in the request path checks identity.

**Confirmed consumers (grep of `frontend/src` + `frontend/functions`):**
- `hooks/useLivePrices.js:104,244,255` (plans, macro)
- `components/NewsTab.jsx:41,42,62` (`latest_cockpit_bundle.json`, `research_archive.json`)
- `components/DataIntegrityModal.jsx:34,130,139`
- `components/AiAgentArenaTab.jsx:2408`
- `components/BloombergNewsWire.jsx:20,21`, `ChartingDeskTab.jsx:414,420`, `HomeDashboardTab.jsx:152–157`, `PersonalWatchlistTab.jsx:54–67`, `SecurityHubDrawer.jsx:241–276`
- **Server-side:** `functions/api/data.js:104` (fallback), `functions/api/telegram-webhook.js:164,192,228,256,330,351` — **the Telegram bot reads the full public bundle.**

**Verdict:** H02 / TRUST04 **CONFIRMED**. Deleting a file is not sufficient: [BL] 221–227 requires the producer (`DatabaseClient._save_local_fallback`, `NewsResearchAgent.archive_research_edition`, crisis-alert sync), the readers, and the Telegram path to change together.

### A4 — `frontend/public/_headers` — **CORRECTION: there was no path drift**

**Lead's earlier reading was wrong and is corrected here.** An earlier listing printed only file basenames, which suggested the JSON sat at the `public/` root. In fact they are under `public/data/`, and the HEAD rule `**/data/*.json` targets them **correctly**.

| | HEAD (before) | Working tree (after) |
|---|---|---|
| Rule target | `/data/*.json` — **correct** | `/data/*` + `/*.json` (defense-in-depth, harmless) |
| `Cache-Control` | `public, max-age=60, s-maxage=300` | `no-store, max-age=0` |
| `Access-Control-Allow-Origin` | `*` | **removed** |
| `X-Robots-Tag` | absent | `noindex, nofollow, noarchive` |

**Practical impact:**
- Removing `no-store`-vs-`public` does **not** hide the data: a static asset is downloadable regardless of `Cache-Control`. It stops shared-CDN caching and search indexing; it does not close TRUST04.
- Removing `Access-Control-Allow-Origin: *` breaks only **cross-origin** browser reads. In-repo consumers are same-origin, and `telegram-webhook.js` fetches server-side, so no confirmed in-repo breakage. Any external embed relying on CORS would break and must be checked before release.
- The base `/*` block (CSP, `X-Frame-Options: SAMEORIGIN`, `nosniff`, Referrer-Policy, Permissions-Policy) is **unchanged and not weakened**.

### A5 — Committed secrets — **CONFIRMED: none found in tracked config**

- `.env.example` contains placeholders only (`your-project-id`, `your-telegram-bot-token-from-botfather`, etc.) — **no live value**.
- `.gitignore` ignores `.env`, `.env.local`, `node_modules/`, `dist/`, `__pycache__/`, `*.log`.
- No hardcoded live API key, bot token or password was found in the files scanned. **Limit:** the scan was targeted, not an exhaustive entropy search; treat as "no evidence found", not "proven absent".

### A6 — Telegram VIP dispatcher — **CONFIRMED EXISTS / CONFIRMED UNWIRED**

- `engine/notifiers/telegram_notifier.py:299` defines `broadcast_vip_trade_signal(self, plan: Dict[str, Any], agent_name: str = "MBG CHAMPION BOT") -> bool`.
- Six sibling broadcasters exist: `broadcast_daily_plans:103`, `broadcast_macro_flash:160`, `broadcast_midday_recap:200`, `broadcast_emergency_alert:218`, `broadcast_daily_brief:234`, `broadcast_research_note:269`.
- A repo-wide search for callers of `broadcast_vip_trade_signal` found **no call sites** in `engine/`, `scripts/`, `frontend/` or `.github/` — the only matches were inside `docs/MASTERPLAN_MBG_UNIFIED_V3.md` itself.
- `.env.example` declares `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` as optional placeholders.

**Verdict:** the formatter exists; the **VIP entitlement + routing + scheduling is absent**. This independently confirms the `GTM-TG-01` backlog gap identified in `02_product_gtm_reconciliation.md` §5.

### A7 — Access tiers are display state, not authorization — **CONFIRMED**

`frontend/src/App.jsx:184–195` initialises and writes `localStorage['mbg_user_tier']`; the value is consumed only for labels/pill styling at `App.jsx:560–573` (`VIP PRO` / `FREE MEMBER` / `TAMU`). No server check reads it. **TRUST03 CONFIRMED.**

---

## B. Data integrity

| Claim | Verdict | Evidence |
|---|---|---|
| `rsi_14 = 50` is a flat pipeline default | **CONFIRMED** | `engine/analyzer/technical_indicators.py:116` `'rsi_14': 50.0` (fallback path); `engine/fetchers/crypto_spot.py:176` `rsi = data.get("rsi_14", 50.0)`; `engine/fetchers/forex_scanner.py:82` `'rsi_14': 50` |
| The shipped bundle carries the flat default | **CONFIRMED** | 37 occurrences of `"rsi_14": 50` in `engine/cache/latest_cockpit_bundle.json` (and therefore in the public 4.2 MB payload) |
| The UI hides the fake value | **CONFIRMED (UI mitigation only)** | The 2026-09-30 polish renders exactly-50 as an em-dash with an Indonesian tooltip (`docs/UI_UX_POLISH_REPORT_2026-09-30.md` §2; `USStockTab.jsx`) — **the pipeline default itself is unfixed**, so M-1 is PARTIALLY closed (presentation only) |
| Synthetic generators in `SecurityHubDrawer` | **UNVERIFIABLE (not reproduced)** | A targeted grep of `SecurityHubDrawer.jsx` for `generate`, `Math.random`, `synthetic`, `SIMULATION` returned **no matches**. [BL] 233 alleges tape/depth/whale generators there; this scan neither confirms nor refutes it (the generators may use different identifiers). Re-check during TRUST05 with a broader pattern |
| `HISTORICAL_BENCHMARK_MATRIX` disclaimers present | **UNVERIFIABLE in this pass** | Not searched exhaustively; [BL]/[CHANGELOG 2026-09-28] claim disclaimers were added to foreign-flow and 13F panels |

---

## C. Build reality

- `frontend/package.json` build script: Vite. `node_modules` present; `node -v` = v24.16.0, `npm -v` = 12.0.2.
- A production build was run during this effort. A stray `frontend/dist-audit/` output directory (55 files) produced by an interrupted audit was **removed** by the Lead to keep the working tree clean.
- **Authoritative build evidence for the final tree is recorded in `docs/consolidation/06_verification.md`** (independent re-run by a separate verifier), not here.

### C1 — Git state

`git log --oneline` returns **exactly one commit**: `e297fa4 chore(arena): 24/7 multi-tick state update [skip ci]`.

**Implication:** the repository history is not a release history. [MP] §20.2's shipping-state ledger cannot be populated from this repo — there is no meaningful "committed locally → pushed → deployed" chain to inspect. Every UI/UX change in the tree is uncommitted against a single squashed commit.

`git status --short` (after Lead cleanup):

```
 M CHANGELOG.md
 M frontend/functions/api/auth.js
 M frontend/index.html
 M frontend/public/_headers
 M frontend/src/App.jsx
 M frontend/src/components/HomeDashboardTab.jsx
 M frontend/src/components/LotCalculatorModal.jsx
 M frontend/src/components/MasterQuantLeaderboard.jsx
 M frontend/src/components/PasswordGate.jsx
 M frontend/src/components/USStockTab.jsx
 M frontend/src/index.css
?? docs/MASTERPLAN_MBG_UNIFIED_V3.md
?? docs/UI_UX_POLISH_REPORT_2026-09-30.md
?? docs/consolidation/
?? docs/screenshots/spacex_mockup_2026-10-01/
?? docs/screenshots/spacex_rework_2026-10-01/
?? docs/screenshots/ui_polish_2026-09-30/
?? docs/superpowers/plans/2026-09-30-spacex-class-ui-rework.md
?? frontend/public/mockup_spacex_home.html
?? frontend/public/mockup_spacex_screener.html
?? frontend/src/utils/format.js
?? scripts/dev-local.ps1
?? scripts/verify-auth-handler.mjs
?? scripts/verify-trust01.mjs
```

---

## D. Test and CI reality

| Item | Status |
|---|---|
| `engine/tests/test_smoke.py`, `test_arena_runner_247.py`, `test_mcp_server.py` | Exist. Execution was **not** performed in this pass → UNVERIFIABLE |
| `frontend/tests/researchPdf.test.mjs` | Referenced by [BL] 422 as six existing tests; **the file was not located in this working tree** → UNVERIFIABLE / likely on the separate `feat/research-pdf-export` line at `b09ebff` |
| `scripts/verify-trust01.mjs`, `scripts/verify-auth-handler.mjs` | Created in this Turn-1 implementation; see 05 |
| `.github/workflows/` | Directory exists; **not inspected in this pass** → UNVERIFIABLE |

---

## E. Summary of verdicts

| # | Item | Verdict |
|---|---|---|
| A1 | Client-side auth bypass (before) / remediated (after) | CONFIRMED → REMEDIATED, with residual logout-revocation gap |
| A2 | Server auth handler hardening | CONFIRMED, with 5 documented residual weaknesses |
| A3 | Public data exposure (~6.27 MB in `public/data` → `dist/data`) | CONFIRMED |
| A4 | `_headers` path drift | **REFUTED** — the rule was correct; Lead's earlier claim corrected |
| A5 | Committed live secrets | CONFIRMED none found (targeted scan) |
| A6 | VIP dispatcher exists but is unwired | CONFIRMED |
| A7 | Tier is localStorage display state | CONFIRMED |
| B | RSI flat default | CONFIRMED; UI mitigation only → PARTIALLY closed |
| B | SecurityHubDrawer synthetic generators | UNVERIFIABLE (not reproduced) |
| C | Single-commit git history | CONFIRMED |
| D | Test/CI execution | UNVERIFIABLE in this pass |

**Bottom line:** the highest-severity document claims (H01 bypass, H02 public bundle, TRUST03 localStorage tier, unwired VIP bot) are **all confirmed against the real repository**. One Lead claim (`_headers` drift) was **wrong** and is corrected above; the remediation remains useful as rate-limiting/indexing defense-in-depth but must not be described as "fixing a drift" or as closing the exposure.
