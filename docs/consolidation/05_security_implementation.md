# 05 — Week-1 Trust/Security Implementation Record (bounded, non-breaking)

**Workstream:** TRUST01 + partial TRUST04 implementation (task-5) · **Date:** 2026-10-01/02 (Asia/Bangkok)
**Repo:** `C:\Users\ASUS\Documents\deepseek-harness\default-workspace\MBG-Trading`
**Scope statement:** this record covers a **bounded subset** of [BL] W1. It does **not** close W1, TRUST02, TRUST03, TRUST05 or TRUST06.
**Commit status:** all changes remain **uncommitted** in the working tree. Nothing here is pushed, merged or deployed.

> **Provenance and correction note.** The original `security-implementer` teammate completed the code edits but terminated before writing its report; the Lead wrote this record from the actual diff, ran the acceptance build and corrected one factual claim (see §5, `_headers` "drift"). One code comment in `frontend/public/_headers` that repeated the incorrect "path drift" diagnosis was corrected by the Lead to state the truth.

---

## 1. What changed

| # | File | Before | After |
|---|---|---|---|
| 1 | `frontend/src/components/PasswordGate.jsx` | Hardcoded `'mbg'` acceptance in the submit path (~L80) **and** in the network-error `catch` (~L102); session trusted from `localStorage` (`{authenticated:true, expiresAt}`); no server confirmation required | `'mbg'` comparison **removed entirely**; server confirmation required (`data.authenticated === true`); session re-verified on every mount against `/api/auth`; fail-closed catch; explicit dev-only bypass |
| 2 | `frontend/functions/api/auth.js` | Default/legacy hashes and a fallback JWT signing secret; plaintext comparison path | Config-only `PASSWORD_HASH` (64-hex) and required `JWT_SECRET`; missing config → 503; `timingSafeEqualHex`; signed HS256 JWT in `HttpOnly; Secure; SameSite=Strict` cookie; opaque `session` id in the body |
| 3 | `frontend/public/_headers` | `/data/*.json` with `public, max-age=60, s-maxage=300` + `Access-Control-Allow-Origin: *` | `/data/*` and `/*.json` with `no-store, max-age=0` + `X-Robots-Tag: noindex, nofollow, noarchive`; CORS wildcard removed; base security block untouched |
| 4 | `scripts/verify-trust01.mjs` (new, 3.890 B) | — | 16-assertion sentinel: source must not contain the bypass, must contain the dev-gated hatch, and the **production bundle** must contain no auth-secret literals |
| 5 | `scripts/verify-auth-handler.mjs` (new, 5.253 B) | — | Handler-level checks for the auth contract |
| 6 | `scripts/dev-local.ps1` (new, 724 B) | — | Local development helper |

**Deliberately not changed:** `frontend/src/index.css`, `frontend/src/App.jsx`, `HomeDashboardTab.jsx`, every tab component, and every file under `frontend/public/data/` — the uncommitted UI v4 rework and the live data path were kept out of scope so nothing could break.

---

## 2. Auth bypass: before → after

**Before (definitively exploitable, two independent routes):**

| Route | Mechanism |
|---|---|
| R1 — password | Typing `mbg` set `authed = true` directly in the React component, with no network call |
| R2 — storage forgery | `verifySession()` read `localStorage['mbg_cockpit_auth']`; writing `{"authenticated":true,"expiresAt":<future>}` granted the whole app |
| R3 — fail-open | When `/api/auth` was unreachable, the `catch` branch re-checked the literal `'mbg'` and granted access |

**After:**

| Route | Status |
|---|---|
| R1 | Closed — no password literal exists in the component (verified by `verify-trust01.mjs` PASS ×1) |
| R2 | Closed — `clearSessionHint()` runs first and the stored value is **never** read as authority; `setAuthed(true)` only executes after `data.authenticated === true` from the server |
| R3 | Closed — the `catch` sets an error and leaves `authed = false` (fail closed) |
| DEV bypass | Exists only when `import.meta.env.DEV === true` **AND** `VITE_MBG_DEV_AUTH_BYPASS === 'true'`. Vite statically replaces `import.meta.env.DEV` with `false` in production builds, so the branch is dead code in the shipped bundle. The sentinel scans the built bundle and finds no bypass string |

**Residual access-control gaps (must not be glossed over):**

1. **No server-side logout/revocation.** `handleLogout` clears local hints only; the HttpOnly JWT stays valid until `expiresAt` (component comment L138–144 states this). [BL] 185 requires server logout and revocation — still open.
2. **Rate limiting is per-isolate and in-memory** (`rateLimitMap`), resetting on cold start; not a distributed brute-force control. The GET verification path has no limit at all.
3. **No CSRF origin check** on the POST beyond `SameSite=Strict`.
4. **Password hashing is unsalted SHA-256**, adequate for a single shared pilot gate but not for individual identity ([BL] 183 requires a hosted identity provider for full TRUST01).
5. **Entitlement is still client-side.** `App.jsx:184–195` reads/writes `localStorage['mbg_user_tier']`, consumed for labels at `App.jsx:560–573`. **TRUST03 is not implemented**: a paying-customer boundary does not exist yet.

---

## 3. Build and verification evidence (raw)

**Production build — `npm run build` in `frontend`:**

```
dist/assets/index-BKI4mvp5.js                    426.59 kB │ gzip: 122.40 kB
dist/assets/AiAgentArenaTab-WbCwSP9-.js          290.04 kB │ gzip:  75.54 kB
… 25 chunks total …
✓ built in 1.62s
=== EXIT: 0 ===
```

**TRUST01 sentinel — `node scripts/verify-trust01.mjs`:**

```
PASS  PasswordGate.jsx must not contain hardcoded 'mbg' comparison
PASS  PasswordGate.jsx must not contain client-minted testMode session
PASS  PasswordGate.jsx must not contain localStorage-trusted authenticated flag
PASS  PasswordGate.jsx must contain DEV-gated escape hatch
PASS  PasswordGate.jsx must contain explicit opt-in env flag
PASS  PasswordGate.jsx must contain cookie-backed server session
PASS  PasswordGate.jsx must contain server confirmation before setAuthed
PASS  auth.js must not contain default sha256 of "mbg"
PASS  auth.js must not contain legacy default hash
PASS  auth.js must not contain fallback JWT signing secret
PASS  auth.js must not contain plaintext 'mbg' comparison
PASS  auth.js must not contain plaintext legacy password comparison
PASS  auth.js must contain documented PASSWORD_HASH env var
PASS  auth.js must contain constant-time-safe hash comparison
PASS  auth.js must contain signed HttpOnly session cookie
PASS  production bundle scanned (25 JS chunks) contains no auth-secret literals

TRUST01 sentinel: PASS
=== EXIT: 0 ===
```

An **independent** re-run of the build by a separate verifier is recorded in `docs/consolidation/06_verification.md`.

---

## 4. TRUST04 migration plan (NOT executed — do not claim closure)

**What actually leaks today (confirmed in `03_repo_truth_audit.md` A3):** eight payloads totalling **~6.27 MB** live in `frontend/public/data/` and are copied verbatim into `frontend/dist/data/`, where they are publicly fetchable static assets:

`latest_cockpit_bundle.json` (4.28 MB · the whole product), `macro_telemetry.json` (1.82 MB), `idx_categorized.json` (58.7 KB), `research_archive.json` (48.3 KB), `latest_arena_state.json` (46.8 KB), `daily_trade_plans.json` (15.8 KB), `crypto_spot_10.json` (7.7 KB), `latest_crisis_alert.json` (321 B).

**Consumers that must change together:**

| Class | Consumer | Evidence |
|---|---|---|
| Client | `hooks/useLivePrices.js:104,244,255` | plans + macro |
| Client | `NewsTab.jsx:41,42,62` | cockpit bundle + research archive |
| Client | `DataIntegrityModal.jsx:34,130,139`, `AiAgentArenaTab.jsx:2408` | direct `/data/...` fetches |
| Client | `HomeDashboardTab.jsx:152–157`, `PersonalWatchlistTab.jsx:54–67`, `SecurityHubDrawer.jsx:241–276`, `BloombergNewsWire.jsx:20–21`, `ChartingDeskTab.jsx:414,420` | read fields out of the bundle |
| Server | `functions/api/data.js:104` | falls back to the public static bundle |
| Server | `functions/api/telegram-webhook.js:164,192,228,256,330,351` | **bot reads the public bundle** |
| Producer | `DatabaseClient._save_local_fallback`, `NewsResearchAgent.archive_research_edition`, crisis-alert sync | writers target the public path |

**Ordered plan:**

1. Run `scripts`-level grep to freeze the consumer list for each payload (the table above is the starting set).
2. Classify each payload: **public** / **customer-private** / **internal**.
3. Extend `functions/api/data.js` to serve private payloads behind the TRUST01 session check with `Cache-Control: private, no-store`, keeping a public subset deliberately.
4. Switch every consumer in the table to the API route; keep the static path as a fallback only for the public subset.
5. Remove private files from `frontend/public/data/` **after** all consumers are migrated, and add an AC04 assertion that no private body appears in the build output or the CDN cache.
6. Change the producers (`DatabaseClient`, research archiver, crisis sync) so they never write customer data into `public/`; include Python writers, GitHub-scheduled jobs and the Telegram path in the boundary ([BL] 102).
7. Deploy behind a flag, verify with a sentinel string, then retire the static route.

**Rollback:** steps 3–4 are additive, so reverting the client to the static path restores the previous behaviour; step 5 is the only destructive action and must be a separate, revertible commit. **Do not delete the JSON files before the API path is verified**, because that would break the app and the Telegram bot.

**Why it was not done in this turn:** closing TRUST04 requires the TRUST02/TRUST03 ownership and policy foundation to exist first ([BL] 127 lists `TRUST01–03` as a dependency). Doing it now would either break the app or move 6 MB of private data behind an authentication check that still cannot distinguish a paying customer from a guest.

---

## 5. Correction: the `_headers` change does **not** fix a path drift

The Lead's initial briefing to this workstream asserted a configuration drift — that `_headers` targeted `/data/*.json` while the JSON files sat at the `public/` root. **That assertion was wrong.** The payloads live in `frontend/public/data/`, so the original rule matched them correctly. See `03_repo_truth_audit.md` A4.

What the `_headers` edit therefore *is*:

- **Still useful:** it stops search-engine indexing, stops shared-CDN caching of telemetry, and removes a wildcard CORS header.
- **Not what it was described as:** it is not a drift fix, and it **does not close the exposure**. A static asset remains downloadable regardless of `Cache-Control`.
- The misleading comment in the file was corrected by the Lead to say exactly this.

`Access-Control-Allow-Origin: *` removal: no confirmed in-repo breakage (all consumers are same-origin; the Telegram function fetches server-side). Any external embed relying on CORS must be re-checked before release.

---

## 6. What was deliberately NOT done, and residual risk

| Not done | Why |
|---|---|
| TRUST02 ownership schema/RLS/private storage | Multi-day schema + policy work; belongs in W1 proper ([BL] 191–203) |
| TRUST03 server entitlement | The commercial boundary; required before selling, not before shipping a gate |
| TRUST05 provenance contract | Depends on TRUST03/04 contracts |
| TRUST06 unsafe-module isolation | Needs the release catalog; nothing was disabled this turn |
| TRUST04 steps 3–7 | Blocked by TRUST02/03; see §4 |
| Server logout/revocation | Needs a new handler route + denylist storage |
| Hosted identity provider | [BL] 183 requirement for full TRUST01; out of a bounded slice |

**Residual risk carried forward (accepted, time-bounded):**

1. **The product is still publicly readable.** ~6.27 MB of signal and research data can be downloaded without credentials. Closing the login gate does not protect the data (H02).
2. **Entitlement is decorative.** Anyone can set `mbg_user_tier` to `PRO` in devtools. Selling before TRUST03 is a commercial risk, not a technical one.
3. **Logout is cosmetic** until server revocation exists.
4. **The shared password is a single shared credential**, not individual identity; all pilot customers share it.
5. **The whole change is uncommitted**, so a `git checkout` reverts it silently.

**Honest one-line status:** *the front door now has a real lock, but the windows are still open and every visitor is handed the same key.*
