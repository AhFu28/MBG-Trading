# 06b — Independent Verification (second verifier, blind to the first)

**Verifier:** independent; did not author any file under review. **Time:** 2026-10-02 ~02:21–02:45 (UTC+7).
**Repo:** `MBG-Trading`, branch `main`, dirty working tree (11 tracked files modified, 18 untracked paths). No source modified, no commit made by me.
**Target file note:** `docs/consolidation/06_verification.md` already existed with 252 lines of the *same* assignment from an earlier verifier, so this report was written to `06_verification_b.md` instead, as instructed.

---

## 1. AUTH RE-TEST

### 1a. Can anyone reach the protected app without valid credentials?

**No, not in a production build — but yes to all eight premium JSON payloads, which need no credentials at all.**

| Vector | Verdict | Evidence |
|---|---|---|
| Old hardcoded `'[REDACTED credential reference]'` | **Gone** | `PasswordGate.jsx` has no password comparison; only `POST /api/auth` (`PasswordGate.jsx:93-108`). `git show HEAD:frontend/src/components/PasswordGate.jsx` had `if (input.trim().toLowerCase() === '[REDACTED credential reference]')` at **lines 80 and 102**, plus `DEFAULT_HASH`/`OLD_HASH`/`password === '[REDACTED credential reference]'` and `env.JWT_SECRET \|\| '[REDACTED exposed credential]'` in `HEAD:frontend/functions/api/auth.js:104,135,164-172`. All absent from the current files. |
| localStorage / sessionStorage forgery | **No access** | `PasswordGate.jsx:43-86`: `clearSessionHint()` runs first (`:58`), then server GET (`:61-66`); `setAuthed(true)` only inside `if (data && data.authenticated === true)` (`:69-72`). A stored object is never parsed for a flag — the only reader of `SESSION_KEY` is `Sidebar.jsx:80` (removal). HEAD instead *trusted* storage: `if (parsed?.authenticated && parsed?.expiresAt …)` (HEAD lines 17–28) — that forgery path is genuinely closed. |
| Direct render / alternate entry | **No** | Single app entry only: `App.jsx:448-1150`, with `<PasswordGate>` at `:449`; `PasswordGate.jsx:149-151` returns children only when `authed`; `main.jsx` wraps in an ErrorBoundary that never renders the app on error. `public/*.html` (e.g. `final_cockpit_mockup.html`, `mockup_spacex_*.html`) are standalone static mockups with no `/src/main.jsx` or `/assets/index-*` script tag. |
| **Premium data** | **OPEN — no credential needed** | 8 payloads live in `frontend/public/data/` (**6,273,550 bytes** total; `latest_cockpit_bundle.json` 4,275,054 + `macro_telemetry.json` 1,820,903 + 6 others) and are copied verbatim into `dist/data/` (measured: 8 files, 6,273,550 bytes). Anyone can `GET /data/<name>.json`. The gate protects the shell, not the product. |
| Server-side forgery (conditional) | **Deployment risk** | `auth.js:99-105`: if `JWT_SECRET` is missing/<16 chars **and** `MBG_ALLOW_INSECURE_DEV_SECRET === 'true'`, sessions are signed with the public constant `'[REDACTED historical signing constant]'` → forgeable cookie. With the var unset the same path returns `null` → **503 fail-closed** (`:160-163`, `:186-191`). |

### 1b. Is the DEV bypass impossible in a production bundle?

**Yes — structurally impossible, and empirically absent.**

- Mechanism: `PasswordGate.jsx:15-16` — `import.meta.env.DEV && import.meta.env.VITE_MBG_DEV_AUTH_BYPASS === 'true'`. Vite statically replaces `import.meta.env.DEV` with `false` in a production build (repo uses `vite ^5.4.2`, resolved **5.4.21**), so the whole `if (DEV_AUTH_BYPASS)` block (`:47-55`) is dead code and is eliminated.
- Two independent operands: even `VITE_MBG_DEV_AUTH_BYPASS=true` in the build environment cannot enable it; no `.env*` file exists in `frontend/`.
- Empirical: freshly built `dist/` contains **no** occurrence of `DEV_AUTH_BYPASS`, `VITE_MBG_DEV_AUTH_BYPASS`, `[REDACTED historical signing constant]`, `fallback-secret`, or `d35bdd04ef…` across all 55 files. `scripts/verify-trust01.mjs` re-run by me: **16/16 PASS, exit 0** (includes "production bundle scanned (25 JS chunks) contains no auth-secret literals").

### 1c. Does the `_headers` rule `/data/*` match where the payloads physically live?

**Yes.** `frontend/public/` root holds **0** JSON files; all 8 payloads are in `frontend/public/data/` (directory listing above). `_headers:12` (`/data/*`) therefore matches them; the added `_headers:20` (`/*.json`) matches nothing in `public/` today.

**Caveat:** `_headers` sets response *metadata*, not access. `Cache-Control`/`X-Robots-Tag` cannot stop a direct `GET /data/latest_cockpit_bundle.json`, and no `Access-Control-Allow-Origin` is needed for a same-site or plain browser navigation. **Exposure is unchanged in kind; only caching/indexing/cross-origin reads were reduced.**

### 1d. Headers deleted or weakened vs `git show HEAD:frontend/public/_headers`?

**None deleted. None weakened. Only strengthened.**

- `git diff` root block `/*`: the five headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, CSP incl. `frame-ancestors 'self'`) are byte-identical; **nothing was removed or relaxed**. Still present: `script-src 'self' 'unsafe-inline' 'unsafe-eval'` (`_headers:6`) — pre-existing, not introduced here.
- `/data/*.json` → `/data/*`: `Cache-Control: public, max-age=60, s-maxage=300` → `no-store, max-age=0` (stricter); `Access-Control-Allow-Origin: *` → **deleted** (this is the only deletion, and it is a tightening); `X-Robots-Tag: noindex, nofollow, noarchive` added.
- **Documentation inaccuracy (not a header):** `_headers:16-19` claims the `/data/*.json` rule "was already correct … this is belt-and-braces, not a fix for a path drift". The *path* was already correct, but the old rule simultaneously granted wildcard CORS and public caching, so the change is a real hardening — the comment is understated/misleading.

---

## 2. BUILD

Command `npm run build` in `frontend`, raw output tail:

```
transforming...
✓ 83 modules transformed.
rendering chunks...
computing gzip size...
dist/assets/AiAgentArenaTab-WbCwSP9-.js          290.04 kB │ gzip:  75.54 kB
dist/assets/index-BKI4mvp5.js                    426.59 kB │ gzip: 122.40 kB
✓ built in 1.57s
```

- **Exit status: 0.** **Wall time 2.4 s** (Vite reports `built in 1.57s`).
- **Chunks: 25 JS + 1 CSS = 26 assets, 27 emitted entries** (1 HTML + 1 CSS + 25 JS) — matches Vite's listing and the 25-chunk count `verify-trust01.mjs` scans. `dist/` total files: 55 (incl. the 8 data payloads, 6,273,550 bytes).
- No Vite warnings or errors. The `node.exe : npm notice …` lines are PowerShell rendering npm's stderr notices, not a build failure.
- `scripts/verify-auth-handler.mjs` re-run: **16/16 PASS, exit 0** (incl. `hardcoded '[REDACTED credential reference]' -> 401`, `legacy plaintext password -> 401`, `forged token -> 401`, `missing JWT_SECRET -> 503`).

---

## 3. CLAIM SPOT-CHECK (C1–C7)

| # | Claim | Verdict | Source line |
|---|---|---|---|
| **C1** | Core effort envelope is 13.5–24 engineer person-weeks | **TRUE** | `MBG-Trading-Revamp-Master-Plan.md:935` — "**Core subtotal: 13.5–24 engineer person-weeks.**" (cf. `:922` "One engineer person-week means roughly five focused working days") |
| **C2** | Backlog contains exactly 32 planned tickets | **TRUE — 32** | Enumerated `### <ID> —` headings: BASE01–04 (4), TRUST01–06 (6), DESIGN01–05 (5), WORKSPACE01–03 (3), PDF01 (1), RESEARCH01–05 (5), COMMERCIAL01–06 (6), OPS01–02 (2) = **32**. Only other `### <ID>` heading is `### W1 exit record…` (`:253`), not a ticket. `:110` "All ten tickets below are **planned**". |
| **C3** | §4.3 prices are labelled test hypotheses, not present tariffs | **TRUE** | `MASTER…:236` "### 4.3 Quota and pricing experiments"; `:238` "These are **test hypotheses**, not present tariffs or promises." |
| **C4** | Master plan states no data rights were established | **TRUE** | `MASTER…:1009` — "**No actual MBG IDX/US/feed/news rights were established by this plan.**" (also `:1214` "No forecast, fee revenue, data-rights grant … is inferred") |
| **C5** | PRD claims "FINAL & APPROVED FOR PRODUCTION SPRINT" | **TRUE** | `PRD_PROJECT_MBG_V2_MASTER.md:10` — "**Status Dokumen:** FINAL & APPROVED FOR PRODUCTION SPRINT" |
| **C6** | Lean document allots its Week 1 only 2–3 days | **TRUE** | `STRATEGI_EKSEKUSI_DAN_SARAN_MAS_FUAD.md:98` — "### Pekan 1: Amankan Pintu & Kunci Data (Est. 2-3 Hari Kerja)" under "Roadmap Nyata 4 Pekan" (`:87`) |
| **C7** | Lean doc presents Rp1,000,000 LTV and 20% churn — assumptions or facts? | **Neither: presented as market benchmarks/arithmetic, with no source and no assumption label.** Not labelled as facts about MBG; not labelled as assumptions either. | `LEAN:75` "**Tolok Ukur Harga Pasar (Indonesia)**" (market benchmarks) → `:77` "Churn Rate Bulanan … rata-rata **20% per bulan**", `:78` "Rata-rata masa aktif … **5 bulan**", `:79` "**LTV … Rp 1.000.000**". The only "Estimasi"/planning label in the document is on `:98` (Week-1 effort). |

**Tally: C1–C7 → 7 TRUE · 0 FALSE · 0 UNSUPPORTED.**
One nuance for C7: because the doc calls them "Tolok Ukur Pasar" (market benchmarks) rather than MBG's own facts, the literal claim "labelled as assumptions" is **not** satisfied — it presents them as external averages. They remain unsourced numbers. `MASTERPLAN_MBG_UNIFIED_V3.md:17,529` correctly rebuts them.

---

## 4. PLAN CHECK — `docs/MASTERPLAN_MBG_UNIFIED_V3.md` (685 lines)

Read in full (all 685 lines). Against the four sources + repo:

**The three specific confirmations the task asked for — all three are correct:**
- **(a) Hardcoded auth bypass removed — TRUE.** `:299`, `:301`, `:306-308`; verified in source and in the minified bundle (§1a/1b).
- **(b) TRUST02 / TRUST03 / TRUST06 NOT implemented — TRUE.** `:187-188`, `:600`, `:565`. Repo check: no ownership/RLS/private-storage work, no server-owned capability/policy module, no sandbox release flags; tier remains user-writable `localStorage`.
- **(c) Public ~6 MB data exposure remains open — TRUE.** `:100` ("**total ~6,27 MB**, disalin apa adanya ke `frontend/dist/data/` dan dapat diunduh tanpa kredensial"), `:303`, `:310-321` ("Header yang sudah diperketat **bukan** pengganti langkah 3–4 … tetap dapat diunduh"), `:649` B6. Measured 6,273,550 bytes — accurate to the stated ~6.27 MB.

**FALSE / UNSUPPORTED statements found:** none material. Spot-verified citations that hold exactly: `:32` ("32 tiket"), `:33` (PRD **433** lines — correct), `:34` (LEAN 134), `:71` ([MP] §15.1 at `:920`), `:74` ([MP] 1009 quote matches the source line verbatim), `:99` (old gate at HEAD lines 80 & 102), `:185-189` (per-ticket status), `:303` (header facts), `:589-591`, `:610`, `:635` ("1,57 s, 83 modul, 27 aset (1 HTML + 1 CSS + 25 JS chunk)" — reproduced exactly), `:637` (see caveat), `:669` (ticket census), `:679` ([MP] line-1009 statement), `:683` (dirty tree).

**Two caveats, not errors of fact:**
1. `:637` "Spot-check 10 klaim … **10 TRUE · 0 FALSE · 0 UNSUPPORTED**" is accurate **but refers to a different claim set** — `06_verification.md:177-190` C1–C10 (effort envelope, ticket count, Week-1 2–3 days, data rights, §4.3, §6.2 tokens, 8px text, PRD status, Rp0 budget, Rp10m MRR). It does not cover this task's C1–C7. My independent re-run also returns 7/7 TRUE, so nothing is misreported.
2. `:638` lists corrections "applied": PRD 379→433, "8 file"→"11 file tracked", Supabase Auth marked as target. All three **are** now applied in the current text (`:33`, `:106`, `:141`), and the earlier stale "path drift" claim is also corrected (`:101` "sudah benar … DIBANTAH", `:303`, `:610`). The first verifier's F1/F2/F4 findings are resolved in this revision.

---

## 5. VERDICT

**Auth, one sentence:** No one can reach the protected app UI without valid credentials in a production build — the `'[REDACTED credential reference]'` string, storage forgery, and the DEV bypass are all closed (`PasswordGate.jsx:15-16,58,69-72,149-151`) — but all **6.27 MB** of premium JSON remains anonymously downloadable from `/data/*.json`, because the new `_headers` rules only remove CORS/caching, not access.

**Build, one line:** `npm run build` → **exit 0, 2.4 s wall (Vite 1.57 s), 83 modules, 25 JS chunks + 1 CSS + 1 HTML (27 entries)**, no warnings; both verify scripts PASS (16/16 and 25-chunk bundle scan).

**C1–C7:** **7 TRUE · 0 FALSE · 0 UNSUPPORTED** (C7 with the nuance that the lean doc labels the LTV/churn figures as *market benchmarks*, labelled neither "assumption" nor "fact").

**GO / NO-GO for the security change: GO on the code, NO-GO as a closed security workstream.** The auth-bypass removal is real, tested, and green. Exact blockers:

| # | Blocker | Why | Evidence |
|---|---|---|---|
| B1 | `PASSWORD_HASH` must be set in production (64-char lowercase hex SHA-256) | Unset → `/api/auth` **503**, nobody can log in | `auth.js:93-97,185-191` |
| B2 | `JWT_SECRET` must be a random ≥16-char value | Unset/short → **503**; weak → guessable sessions | `auth.js:99-105,186-191` |
| B3 | `MBG_ALLOW_INSECURE_DEV_SECRET` must **not** be `'true'` in production | With it and no secret, sessions are signed with the public constant `'[REDACTED historical signing constant]'` → **cookie forgeable by anyone** | `auth.js:102-104` |
| B4 | `VITE_MBG_DEV_AUTH_BYPASS` absent from the build environment | Defense in depth only (branch is already dead in prod) | `PasswordGate.jsx:15-16`; bundle scan |
| B5 | `PASSWORD_HASH`/`JWT_SECRET` are **not documented anywhere in the repo** (`.env.example` has only Supabase/Gemini/Telegram/IndexAlpha keys) | A deploy following the repo's own docs produces a **503 lockout** | `.env.example:1-13` |
| B6 | Decide logout/revocation semantics | `handleLogout` clears only local hints; the `HttpOnly` cookie stays valid to expiry; no server logout endpoint | `PasswordGate.jsx:138-144` |
| B7 | Do **not** ship any claim that premium data is protected | 8 payloads remain anonymously fetchable at `/data/*.json` | `frontend/public/data/*.json`; `dist/data/` (6,273,550 B) |

*No source file was modified and no commit was made by this verifier. This report is the only file written.*
