# 07 — Unified Plan Confirmation & Execution Status

**Date:** 2 October 2026 · **Author:** Lead (DSH session) + 3 Scout-Analyst agents
**Binding plan:** `docs/MASTERPLAN_MBG_UNIFIED_V3.md` (V3) — confirmed as **THE one unified plan**.
**This document:** the verification record + execution status + next actions. It does not duplicate V3; it binds it to evidence.

---

## 1. Decision: one plan

Per the user's instruction ("combine them and make 1 full plan and implementation"), four source documents were fully digested by three independent analyst agents:

| Source | Verdict from cross-check |
|---|---|
| **[MP]** Revamp Master Plan (1,214 lines) | Long-horizon blueprint + quality gates — binding via V3's mapping; superseded in timeline by the lean horizon (V3 §1.1 C-1) |
| **[BL]** Implementation Backlog (781 lines) | Security/integrity gold standard + post-revenue roadmap; **trimmed W0/W1 adopted** as the lean W1; baseline-mismatch caution verified below |
| **[V2]** PRD v2 (433 lines) | Feature catalog + the only setup runbook, member SOP, and Rp 0 budget → slots into W2-W3 onboarding; master-password model **overridden** by TRUST01 (now implemented) |
| **[LEAN]** Strategy for Mas Fuad | Business filter: 4-week MVP track is primary; the 80% (papers, multi-seat, editorial, 18-exchange licensing) deferred |

**Result: no new plan is created. V3 already consolidates all four with conflict resolutions (C-1…C-11). This session confirms V3 as binding and records verified execution state.**

## 2. Verification results (2 Oct 2026, real repo AhFu28/MBG-Trading)

| Check | Result |
|---|---|
| Frontend build (combined v4 UI + TRUST01 + VIP router) | **✓ built in 1.72s, 25 chunks, zero errors** |
| TRUST01 sentinel (`scripts/verify-trust01.mjs`) | **PASS** — no `mbg` bypass, no legacy hash, no fallback secrets, PASSWORD_HASH env documented, constant-time compare, HttpOnly signed cookie, 25-chunk bundle scan clean |
| Auth handler runtime (`scripts/verify-auth-handler.mjs`) | **PASS** — 14 cases: hardcoded/legacy/wrong password → 401; forged/tampered tokens → 401; real cookie → 200; missing PASSWORD_HASH/JWT_SECRET → 503 (fails closed) |
| VIP signal router (`engine/tests/test_vip_signal_router.py`) | **25 passed + 5 subtests** — provenance gate (source + observed_at, synthetic never live), subscriber allowlist with expiry, dry-run default |
| v4 UI (this session's rework) | **Verified via live DOM** — SpaceX-class tokens, minimal home (hero row + 4 KPI tiles + 4 market cards + 3 signal tables + news rail), live sparklines (real ticks only), WCAG AA computed in both themes, honest states (em-dash, tooltips, Q-Score legend), sticky columns, 44px touch targets |
| Backlog baseline caution | **Resolved** — [BL] was mapped against a different checkout (MBG-Trading-pdf @ b09ebff); all named surfaces re-verified on the real repo before status was recorded |

## 3. M0 completion ledger (maps to V3 §4)

### Pekan 1 — Security gate
- **TRUST01 (slice)** — **DONE + VERIFIED** (sentinel + runtime, above).
- **TRUST04 (partial)** — headers hardened (no-store, noindex) ✓; **full migration NOT done — do not claim otherwise** (V3 §5.4). Steps 1-2 completed this session:

| Payload | Consumers | Upstream writers | Classification (proposed) |
|---|---|---|---|
| `latest_cockpit_bundle.json` | App.jsx, FlowProcessTab, DataIntegrityModal, NewsTab, api/data.js, telegram-webhook | run_pipeline, supabase_client, idx_market | **SPLIT required** — contains premium plans/signals inside a public bundle |
| `daily_trade_plans.json` | App.jsx (fallback) | supabase_client, vip_signal_router | **PRIVATE (VIP signal source)** |
| `crypto_spot_10.json` | App.jsx (fallback) | supabase_client | **PRIVATE (signals)** |
| `research_archive.json` | NewsTab | news_research_agent | **TIER-GATED** (paid later) |
| `latest_arena_state.json` | AiAgentArenaTab, DataIntegrityModal | arena_evaluator, arena_runner_247 | **PUBLIC (promo performance)** |
| `macro_telemetry.json`, `idx_categorized.json`, `latest_crisis_alert.json` | none (unused by frontend) | supabase_client / news agent | Remove from `public/` or serve via API when consumed |

- **TRUST03 (server-owned tier policy)** — NOT done; needs Supabase decision (localStorage tier still client-authoritative).
- **TRUST06 (isolate unsafe modules: fake swap success, real Binance orders, synthetic feeds)** — NOT done; next in-repo implementable item (release flags).
- **BASE01-04** — partially covered by `docs/consolidation/03_repo_truth_audit.md`; commit/push still pending (see §5).

### Pekan 2 — Telegram VIP
- **GTM-TG-01 (missing wiring)** — **DONE + VERIFIED**: `engine/notifiers/vip_signal_router.py` (provenance-gated dispatch, allowlist, dry-run default) + `scripts/send_vip_signals.py`.
- **GTM-DATA-01 (provenance labels)** — **DONE** in the router (source + observed_at, synthetic never live).
- **Channel wiring** — REMAINING, needs user: bot token, VIP group + promo channel creation, chat-id↔subscription mapping.

### Pekan 3 — GTM launch — REMAINING (user decisions: D-1 market choice, pricing, refund policy, early-bird cap)
### Pekan 4 — Evaluate & scale-from-profit — after launch

## 4. Corrections adopted from cross-check (digests B + C)

1. **Infra topology:** production = Cloudflare Pages + functions + **HF Space engine daemon** + GitHub Actions (not "Actions cron runs the brain" as [V2] says). Plans must document the real topology.
2. **URLs:** message templates/onboarding copy must use **mbg-trading.pages.dev** (not mbg-v2.pages.dev / project-mbg-v2.pages.dev).
3. **D-1 recommendation:** choose **crypto spot** as the first paid market — already integrated end-to-end; skips IDX licensing entirely.
4. **DESIGN01/03 (+05 partial) are satisfied by the v4 rework** — verify against [BL] acceptance (status anatomy, logo states) instead of rebuilding.
5. **Telegram paid-linking is a NEW lean ticket** ([BL] deferred it; lean W2 needs it now): chat-id↔grant map via the same access policy.
6. **Launch gate:** no blocking 14-day paper-trading gate ([V2] Sprint 4) — launch lean, track signal outcomes lightly.
7. Business math (churn 20%, LTV Rp 1M, 50×Rp150k = Rp 10M MRR) = **assumptions to validate in W4, not facts**.

## 5. Next actions (ranked; owner in bold)

1. **USER:** Approve commit + push + deploy of the verified working tree (v4 UI + TRUST01 + VIP router + this record). Everything is green; shipping is gated on this single OK since the v4 mockup review.
2. **USER:** D-1 — first paid market (recommendation: crypto spot).
3. **USER:** Provision secrets — Supabase (identity + VIP grant table), Telegram bot token + VIP group + promo channel IDs.
4. **LEAD (next session work):** TRUST06 release flags (in-repo, no secrets) + TRUST04 steps 3-4 once the data-backend decision (KV/R2/Supabase vs engine API) is made.
5. **USER:** W3 launch mechanics — early-bird cap, founding price, refund policy, onboarding script (uses [V2] §6 setup guide + §7 SOP).

## 6. Deferred register (unchanged, confirmed)

Academic paper system (RESEARCH01-05, PDF01 on demand), business multi-seat, editorial board, 18-exchange licensing, 14 tabs, correlation/backtest suite, Exp3 league, 30-day paper machine, Dividen Hunter, Tipe 4-6 bot messages, i18n/audio/palette extras — all archived with IDs intact, reactivated only from W4 profit per V3 §4.5.

## 7. Analyst A cross-check ([MP] Revamp Master Plan — final digest)

**Confirms:** V3's remediation-register mapping is faithful; [MP] itself contains **no Telegram VIP item** (V3's GTM-TG-01 addition is correct); [MP] prices (Rp 199k-249k) are stated as "test hypotheses, not tariffs" — Rp 150k early-bird is compatible.

**TRUST06 execution scope — named surfaces from [MP] S2 (P0 cluster):**
| ID | Surface | Fix |
|---|---|---|
| C01 | `WhaleIntelligenceTab.jsx` — synthetic whale events/attribution in public data | Remove from public data; unknown stays unknown |
| C02 | `hooks/useLivePrices.js`, `CryptoFuturesTab.jsx` — spot overwrites futures mark; Date.now() seeding | Honest unavailable states; separate last/bid/ask/mark per venue |
| C03 | `engine/agents/news_research_agent.py` — fabricated news fallback, prompt-injection risk, fixed BBCA/ANTM level contamination | Sourced publication IDs/times; missing stays missing |
| H04 | `services/brokerGateway.js` + `SolanaSwapModal.jsx` — browser-held secrets; fake swap success/hash | No browser secret custody; SIMULATION label or remove |
| C05 | `engine/analyzer/paper_portfolio.py` — two-stop settlement defect | Gate only if paper trading ever ships (deferred per lean) |
| H03 | `deploy/huggingface/app.py` — daemon reset without identity | Scoped admin auth (internal only) |

**Design confirmation:** the v4 rework **exceeds** [MP] S6-S8 (pure-black canvas vs the doc's `#0B0E13`; Barlow supersedes its Plus Jakarta Sans assumption; WCAG AA verified). Residuals: logo-resolver registry + route-registry aliases (W2 slim). CWV (LCP/INP/CLS p75) unmeasured — add to launch QA.

**Budget nuance:** "Rp 0 forever" is aspirational — realistic floor at launch scale ≈ **US$30/mo** (Cloudflare $5 + Supabase $25), per [MP] S18. Fold into W3 pricing math.

**Honesty rule for the sold product (binding):** [MP]'s claims discipline applies to the lean signal product regardless of the deferred editorial pipeline — stale = stale, synthetic never LIVE, no decorative "VERIFIED", marketing only deployed features.
