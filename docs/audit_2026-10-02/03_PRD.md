# 03 — PRD v4: MBG Lean Signal Product (M0) — 2026-10-02

**Status:** consolidated from [LEAN] (business filter), [V2] (feature catalog + onboarding), [MP]/[BL] (quality gates), V3 section 1.1 (C-1..C-11), and the 2026-10-02 repo audit (01_REPO_AUDIT.md).
**Product in one sentence:** *MBG mengirim sedikit setup trading yang sudah dihitung risikonya untuk satu pasar — entry, stop, target, dan alasannya dalam dua kalimat — sebelum harga bergerak. Tanpa pompom, tanpa pamer screenshot, tanpa menyembunyikan kerugian.*
**Evidence tags:** EXISTS(file:line) = in the working tree today · PARTIAL = exists but incomplete · NEW = must be built · [ASSUMPTION] = no supporting data.

---

## 1. Problem & ICP

- **Problem:** Indonesian retail traders (22-45, modal Rp10-500 jt) are tired of pom-pom signal groups; they want a few setups with honest risk math, a calm UI, and a transparent operator.
- **ICP:** self-directed trader of IDX stocks, gold (XAUUSD), and crypto, algorithm-curious, allergic to screenshot flexing. [ASSUMPTION — from [LEAN] section 2, no primary data yet]
- **Not the ICP:** fund managers, multi-seat institutions, academics (deferred 80%).

## 2. Positioning

| Layer | Position |
|:---|:---|
| Paid product (Pekan 3) | VIP Telegram signals on ONE market (D-1, recommended **crypto spot**) |
| Free surface | Pro access to the EXISTING cockpit (mbg-trading.pages.dev) — retention + funnel, not a rebuild (C-3) |
| Promo surface | Public Telegram channel + latest_arena_state.json (the only promo-safe public payload) |

## 3. Scope

### IN for M0 (Pekan 1-4)
| Item | Status | Source |
|:---|:---|:---|
| Auth gate: server-side session, fails closed | **EXISTS + VERIFIED** (uncommitted) — frontend/functions/api/auth.js, PasswordGate.jsx; sentinel + 16 runtime cases green | [BL] TRUST01 |
| Headers hardened (no-store, noindex) | **EXISTS** (uncommitted) — frontend/public/_headers | [BL] TRUST04 (step 1-2) |
| VIP signal router with provenance gate | **EXISTS + VERIFIED** — engine/notifiers/vip_signal_router.py (source + observed_at required; synthetic never LIVE; allowlist with expiry; dry-run default); 41 tests | [BL] GTM-TG-01, GTM-DATA-01 |
| TRUST04 data split (premium JSON out of public/) | **NEW** — blocking decision D-2; audit S2 | [BL] TRUST04 |
| TRUST06 release flags (fake swap hash, real-order gateway, synthetic feeds) | **NEW** — audit S4 | [BL] TRUST06, [MP] H04 |
| Server-side tier policy (TRUST03) | **NEW** — allowlist still file-based (engine/config/vip_subscribers.json) | [BL] TRUST03 |
| Telegram channel wiring (bot token, VIP group, promo channel, chat-id map) | **NEW** — needs user secrets | [LEAN] Pekan 2 |
| Payment record (manual transfer confirmation OK for M0) | **NEW** | [BL] COMMERCIAL |
| 3 alert types: morning briefing, instant signal, evening recap | **EXISTS as formats** — telegram-webhook.js parseCommand (NEWS/PLAN/HELP), telegram_notifier.py; **cadence NOT automated** (5 of 7 workflows manual-only — audit section 2) | [V2] Type 1/3/5 |
| Pro cockpit (14 reduced tabs, honest states) | **EXISTS** — frontend/src/App.jsx + 25 reachable components; v4 SpaceX-class rework built | V3 section 4 |

### OUT / deferred (IDs kept, reactivate from W4 profit — V3 section 4.5)
Academic paper system (RESEARCH01-05, PDF01 conditional on paid request), business multi-seat, editorial board, 18-exchange licensing, 14 tabs full, correlation/backtest suite, Exp3 league, 30-day paper machine, Dividen Hunter, alert types 2/4/6, i18n/audio/palette extras.

## 4. User stories & acceptance criteria

### Visitor (free cockpit)
- **US-V1** As a visitor, I can browse the public cockpit state so I can judge the product before paying. *Given* a fresh browser, *when* I open mbg-trading.pages.dev, *then* public payloads load (latest_arena_state.json) and premium payloads return 401/404 (after TRUST04).
- **US-V2** As a visitor, I see honest unavailable states (em-dash + tooltip), never fabricated numbers. *Given* stale data, *when* the card renders, *then* it shows the stale/unavailable pattern with observed_at (05_DESIGN_SYSTEM.md section 5).
### Free member (registered)
- **US-F1** As a member, I can log in with a server-issued session. *Given* valid credentials, *when* I POST /api/auth, *then* I get an HttpOnly+Secure+SameSite=Strict cookie; wrong/forged -> 401; missing secrets -> 503 (verified, 16 cases).
### VIP member
- **US-P1** As a VIP, I receive instant signals with entry, SL, TP, reason (2 sentences), source, and observed_at. *Given* a provenance-complete plan, *when* the router dispatches, *then* the message carries source + observed_at; a plan without provenance is never sent as a VIP signal (router gate).
- **US-P2** As an expired VIP, I stop receiving signals. *Given* expires_at passed, *when* dispatch runs, *then* my chat_id is skipped (allowlist expiry, tested).
### Owner/operator
- **US-O1** As the owner, I can run the daily cycle in ~15 minutes (SOP in 06_BUSINESS_PROCESS.md section 8), including manual workflow triggers where cron is off.
- **US-O2** As the owner, I can grant/revoke a chat_id in one file edit (engine/config/vip_subscribers.json) until TRUST03 lands.
- **US-O3** As the owner, I never have to fake success: the swap module reports real signatures or SIMULATION (after TRUST06).

## 5. Functional requirements per surface

### 5.1 Cockpit web (frontend/)
| Req | Status | Where |
|:--|:---|:---|
| Password gate -> server session | EXISTS+VERIFIED | frontend/src/components/PasswordGate.jsx, frontend/functions/api/auth.js |
| Live prices hook | EXISTS (Date.now() seeding flagged — audit D1) | frontend/src/hooks/useLivePrices.js |
| Home dashboard (hero + KPI + market cards + signal tables + news rail) | EXISTS (v4 rework) | frontend/src/components/HomeDashboardTab.jsx |
| 16 lazy route chunks | EXISTS | frontend/src/App.jsx dynamic imports |
| Data integrity modal (provenance display) | EXISTS | frontend/src/components/DataIntegrityModal.jsx |
| Phantom wallet + swap | EXISTS (fake hash — audit S4, TRUST06) | frontend/src/services/phantomWallet.js, SolanaSwapModal.jsx |
| Premium payload gating | NEW (TRUST04 split) | frontend/public/data/ -> gated function |

### 5.2 Telegram VIP (engine + edge)
| Req | Status | Where |
|:--|:---|:---|
| Provenance-gated dispatch | EXISTS+VERIFIED | engine/notifiers/vip_signal_router.py |
| Subscriber allowlist + expiry | EXISTS | engine/config/vip_subscribers.json + router |
| HTML message delivery | EXISTS | engine/notifiers/telegram_notifier.py (send_html_message) |
| Edge bot (news/plan/help commands) | EXISTS | frontend/functions/api/telegram-webhook.js |
| Webhook secret enforcement | PARTIAL (string present; rejection not runtime-verified — audit S3) | telegram-webhook.js |
| Channel wiring (real token, groups) | NEW — user secrets | [V2] section 6 step 3 |

### 5.3 Engine pipeline
| Req | Status | Where |
|:--|:---|:---|
| Pipeline CLI (statistical fallback when timesfm absent) | EXISTS | engine/run_pipeline.py |
| Supabase upsert + local JSON fallback | EXISTS | engine/database/supabase_client.py, schema.sql |
| Arena 24/7 state | EXISTS (cron every 5 min) | .github/workflows/arena_247_engine.yml |
| Crypto/macro hourly | EXISTS (cron hourly) | .github/workflows/hourly_crypto_macro.yml |
| IDX morning/recap/evening/intraday | PARTIAL — workflow_dispatch only, no cron (audit section 2) | .github/workflows/daily_idx_morning.yml etc |
| HF Space daemon | EXISTS | deploy/huggingface/app.py (reset without identity — audit S6) |

## 6. Non-functional requirements (hard gates)

| Gate | Rule | Status |
|:--|:---|:---|
| TRUST01 | No client-side auth bypass; session server-side; fails closed | DONE + VERIFIED (uncommitted) |
| TRUST02/04 | Premium payloads not downloadable without auth | OPEN (S2) — must close before Pekan 3 |
| TRUST03 | Tier policy server-owned | OPEN (file-based interim) |
| TRUST05 | Dispatch/block audit trail | PARTIAL |
| TRUST06 | Unsafe modules isolated behind release flags | OPEN (S4) |
| Data honesty | stale = stale; synthetic never LIVE; provenance source+observed_at on every outgoing signal | ENFORCED in router + tests |
| Performance | LCP/INP/CLS p75 unmeasured — add to launch QA | OPEN |

## 7. Pricing & packaging [ASSUMPTION]

| Package | Price | Content |
|:---|:---|:---|
| Founding (Pekan 3, cap 30-50) | Rp150.000/bln (or Rp350.000/3 bulan) | VIP Telegram signals (1 market) + Pro cockpit access |
| Standard (post-founding) | Rp200.000/bln [ASSUMPTION — validate in W4] | same |
| Infra floor | ~US$30/mo (Cloudflare $5 + Supabase $25) [ASSUMPTION — from [MP] S18] | — |

## 8. Metrics & W4 review criteria

1. Paying members (target 30-50 founding) and MRR gross (50 x Rp150k = Rp7.5M).
2. Signal outcomes tracked lightly (hit/miss per signal, no win-rate marketing from suppressed ledgers — C-7).
3. Member feedback: can they follow the signal? does it help? (Mom-test questions in [LEAN] section 2).
4. Churn measured (assumption was 20%/mo).
5. TRUST02/03/06 closed or scheduled from profit.

## 9. Risks & legal

| Risk | Mitigation |
|:--|:---|
| Data rights per market (D-1) | Choose crypto spot (Binance public API terms) — the one market already integrated; do NOT resell IDX data without rights (C-5) |
| Premium JSON public (S2) | TRUST04 split BEFORE launch — non-negotiable |
| Uncommitted work | Fix git hygiene (S7), stage explicit files, commit + push + deploy |
| Win-rate claims | Signals ship with honesty labels only (C-7) |

## 10. Open decisions

D-1 market, D-2 data backend, D-3 pricing, D-4 launch-vs-security timing, D-5 refund, D-6 early-bird cap, D-7 auth target — table with defaults in 02_CONSOLIDATION_REVIEW.md section 5.