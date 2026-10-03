# 02 — Product + GTM Reconciliation: Project MBG V2 PRD vs. Lean 80/20 Execution Strategy

**Consolidation workstream:** Product & GTM (task-2)
**Prepared:** 1 October 2026, Asia/Bangkok (UTC+7)
**Status of this document:** Reconciliation + recommendation. **No claim here is verified production fact unless it cites a numbered source line.**
**Owner of the decisions in §6:** Mas Fuad (founder). This document forces those decisions; it does not make them.

---

## 0. Source key (read-only; never modified)

| Tag | Document | Lines |
|---|---|---|
| **[V2]** | `PRD_PROJECT_MBG_V2_MASTER.md` — "Unified Autonomous Quant Cockpit & 24/7 Intelligence Terminal" | 433 |
| **[LEAN]** | `STRATEGI_EKSEKUSI_DAN_SARAN_MAS_FUAD.md` — Lean execution & business review | 134 |
| **[MP]** | `MBG-Trading-Revamp-Master-Plan.md` — 1 Oct 2026 revamp master plan (referenced by [LEAN]) | 1,214 |
| **[BL]** | `MBG-Trading-Implementation-Backlog.md` — source-mapped ticket backlog, v1.0 | 781 |
| **[PRD-M]** | repo `docs/PRD_MASTER.md` (grounding only) | 738 |
| **[UPD]** | repo `docs/UPDATE_PACKAGE_10092026.md` (grounding only) | — |

**Evidence grading used below:** `[FACT]` = stated in a cited source line or an arithmetic identity; `[ASSUMPTION]` = stated without a source or an unmeasured hypothesis; `[CONFLICT]` = two sources cannot both be true.

**Standing caveat on [BL]:** the backlog states repeatedly that all tickets are **planned only**, no code/DB/deployment was changed, and the remote/deployed revision is unverified ([BL] 8, 110, 537, 541). It is a plan, not evidence of shipped capability.

---

## 1. The one reconciled product + GTM position

> **MBG is a paid, human-gated market-signal and research service for time-poor Indonesian self-directed traders. The sellable unit is a Telegram VIP signal channel plus Pro access to the existing web cockpit, on one named market. The full V2 "autonomous quant terminal" is the long-term product vision, not the launch product.**

Positioning sentence (for copy):
> *"MBG sends you a small number of risk-defined, source-labelled trade setups for one market — entry, stop, target, and the reason in two sentences — with a lot-size calculator, before the market moves. No pompom, no screenshot bragging, no hidden losses."*

**What this position deliberately keeps from [V2]:** the 24/7 Telegram push, the "bahasa bayi" macro translation, the foreign-flow/order-block signal logic, the Astra risk filter and lot calculator, and the honest fact/opinion split.
**What it deliberately demotes from [V2]:** the 14-tab multi-market terminal, TimesFM forecasting, the Exp3 strategy league, and the paper-trading ledger as a *proof of edge* — all moved behind revenue gates (§3, §5).
**What it adds from [LEAN]:** an actual price, an actual payment path, an actual first cohort (30–50 people), and a 4-week clock (§5).

**The product/GTM tension in one line:** [V2] is written as *"build the platform, then it is free forever"*; [LEAN] is written as *"sell the signal now, fund the platform from profit."* This document keeps both — V2 as archived scope, Lean as the active plan — and surfaces every place they cannot coexist (§4, §6).

---

## 2. Feature disposition table — every [V2] promise, once, with one verdict

Verdict vocabulary:
- **SHIP NOW** — required, or already built, for the week 1–4 MVP.
- **DEFER** — real but post-revenue; do not build with launch money or ship as a sold promise.
- **DROP** — do not build; remove from product copy, roadmap, or KPIs.

### 2.1 Telegram alert engine ([V2] §3, lines 96–260)

| # | [V2] feature | Verdict | Business justification (one line) | Disagreement it resolves |
|---|---|---|---|---|
| 1 | **Type 1 — Instant Buy Signal 24/7** ([V2] 112–137) | **SHIP NOW** | This is the product people pay for; it is the only [V2] output with a direct willingness-to-pay hypothesis. | Ends the "web terminal is the product" vs "signal is the product" ambiguity in [V2] §1.2 vs [LEAN] 28. |
| 2 | **Type 2 — Breaking Macro Shock Radar** ([V2] 139–158) | **DEFER** | Real-time shock detection implies a paid, low-latency macro feed and dedup logic; neither exists and [LEAN] 49–52 puts paid feeds out of scope. | [V2] promises 24/7 macro detection; [LEAN] wants 3-day bot wiring. Only a scheduled macro digest survives week 2. |
| 3 | **Type 3 — Morning Briefing 07:15 WIB** ([V2] 160–186) | **SHIP NOW** | Cheapest retention driver: the existing pipeline already emits a morning brief; daily habit is the highest-leverage free-channel asset. | None material — both documents want a daily brief. |
| 4 | **Type 4 — Midday Sesi-1 Recap 12:15** ([V2] 188–204) | **DEFER** | Adds a third scheduled job and session-1 data dependency for value already covered by the morning + evening messages; no member has asked. | [V2] promises 6 message types; [LEAN] (104–109) only justifies "instant signal + daily recap". |
| 5 | **Type 5 — Evening Global Watch 18:30** ([V2] 206–222) | **SHIP NOW (simplified)** | The end-of-day recap is also the public performance/proof channel [LEAN] 108 uses as the sales funnel; ship it as recap + published hit/miss, not as a Wall-Street preview. | Resolves [V2]'s 6-alert promise vs [LEAN]'s one-public-one-VIP channel split: evening recap goes to the **public** channel. |
| 6 | **Type 6 — Conversational 2-way chat** (`/rekom`, `/cek`, `/news`) ([V2] 224–260) | **DEFER** | Per-user conversational answers multiply advice liability, hallucination surface and support load; [V2]'s own sample text already contains unproven claims (84% probability, "Akumulasi Sehat"). | [V2] treats chat as a headline feature; [LEAN] never asks for it and its ICP test (68–72) is about paid signal quality, not chat. |
| 7 | **Autonomous 24/7 broadcast push mode** ([V2] 98–99) | **SHIP NOW** | This is the delivery mechanism of the VIP channel and the free funnel; it exists in the repo. | Aligns both documents; distinguishes push (ship) from conversation (defer, row 6). |

### 2.2 Web cockpit / "24/7 intelligence terminal" ([V2] §2, §3; [PRD-M] §9.3)

| # | [V2] feature | Verdict | Business justification | Disagreement it resolves |
|---|---|---|---|---|
| 8 | **Web Cockpit shell + Free/Pro login surface** ([V2] 270) | **SHIP NOW** | [LEAN] 28, 132 confirms a "UI Dribbble clean" cockpit already exists today; it is the free/Pro retention surface and must not be rebuilt. | [V2] treats the cockpit as the terminal to be built; [LEAN] treats it as an already-built asset — reconciliation: ship the *existing shell*, not a rewrite. |
| 9 | **14-tab global market terminal** (BEI, Wall Street, Asia, Bonds, Forex, Crypto) ([V2] 271) | **DEFER** | [MP] 159 sets the launch hypothesis to **one licensed market**; 14 tabs = 14 coverage/rights gates at once, with no paying user to amortise them. | Direct conflict: [V2] 271 promises 14 tabs; [MP] 159 + [LEAN] 49 scope to one market. |
| 10 | **Macro "Bahasa Bayi" translator** ([V2] 272) | **SHIP NOW** | The clearest differentiator against pompom groups and terminal UIs, and it is text generation over data we already fetch — not a data-licence problem. | Both documents agree on retail clarity; it is the one [V2] §1 vision item that is cheap *and* defensible. |
| 11 | **Pearson correlation matrix + 2-yr backtest simulator** ([V2] 273) | **DEFER** | Requires licensed history and validated methodology; [MP] 224 puts backtest/Strategy Lab behind cost/leakage/reproducibility gates, and [BL] 249 requires it disabled publicly. | [V2] sells it as a launch capability; [MP]/[BL] gate it. Reconciliation: it is a later, gated module. |
| 12 | **Command Palette (Ctrl+K)** ([V2] 274) | **SHIP NOW** | Already implemented (`CommandPaletteModal.jsx`, [BL] 149); keeping it costs nothing and it is core to the cockpit navigation. | None — no disagreement. |
| 13 | **Audio Alert Synthesizer** ([V2] 274) | **DEFER** | Nice-to-have with accessibility/mobile-autoplay overhead; no revenue linkage. | [V2] bundles it with launch features; triage splits it out. |
| 14 | **i18n 4 languages** ([V2] 274) | **DROP** | Targets an Indonesian retail ICP ([LEAN] 70); a 4-language matrix multiplies content review 4× for zero evidenced demand. | [V2] scope inflation not justified by either document's market. |

### 2.3 Quant brain & analytics ([V2] §3.2, lines 276–284)

| # | [V2] feature | Verdict | Business justification | Disagreement it resolves |
|---|---|---|---|---|
| 15 | **Bandarmologi IIFS — Z-score foreign flow, broker accumulation** ([V2] 278) | **SHIP NOW** | It is the signal's credibility layer and [LEAN] 36 confirms it is already implemented (`bandarmology_iifs.py`); it is exactly "the true value" [LEAN] wants kept. | Aligns both documents. Caveat: the *data rights* for redistributing broker/foreign-flow data are unresolved (§4 C-5). |
| 16 | **Smart Money Concepts — Order Block / FVG detector** ([V2] 277) | **SHIP NOW** (existing-code only) | Listed as existing in [PRD-M] 706 (`smc_detector.py`) and is the entry-zone logic; **do not extend it as new work in the MVP**. | [V2] implies original R&D; [LEAN] 26 wants existing 20% kept. Reconciliation: consume what exists, build nothing new here. |
| 17 | **AI Google TimesFM 2.5 probabilistic forecast (80% band)** ([V2] 279) | **DEFER** | Heavy runtime + validation surface, and [V2] 123 presents "84% Bullish" as fact — that precision is unsupported and is a liability if sold. | [V2] treats TimesFM as a core differentiator; [MP] 213/691 pushes TimesFM to a later phase. |
| 18 | **Exp3 Multi-Armed Bandit strategy league** ([V2] 280) | **DEFER** | A meta-learner is only meaningful over a trustworthy P&L ledger, which is currently defective ([BL] 161). | [V2] sells "system gets smarter"; [LEAN] 26 does not include it in the 20%. |
| 19 | **Virtual Paper-Trading state machine** ([V2] 281) | **DEFER** | [BL] 161 reproduces a settlement defect (two positions disappear, one journal entry); shipping performance claims on it would be misleading. | Direct conflict with [LEAN] 105 ("pick 3 best bots from 16") — see C-7. |
| 20 | **Astra lot / risk calculator** ([V2] 132–133) | **SHIP NOW** | Deterministic, cheap, and the strongest tangible proof of "anti-boncos" value; it converts a signal into an actionable order. | Both documents agree; [MP] 222 keeps it educational/deterministic. |
| 21 | **Astra 5-step risk filter (R:R ≥ 1:2, tick snapping, ARA/ARB)** ([V2] 67, [PRD-M] 672–674) | **SHIP NOW** | It is the mechanism that makes a cheap signal defensible, and the filter rule is deterministic (no licence/AI dependency). | Aligns both documents; the "Zero-Hallucination Gate" only works if this filter actually runs. |
| 22 | **Multi-channel distribution (Telegram + web)** ([V2] 68) | **SHIP NOW** | Two channels already exist; the free channel is the acquisition funnel, the VIP channel is the product. | Resolves [V2]'s "multi-channel" breadth into a specific public/VIP split from [LEAN] 107–109. |

### 2.4 Infrastructure, budget and compliance ([V2] §4–§6)

| # | [V2] feature/claim | Verdict | Business justification | Disagreement it resolves |
|---|---|---|---|---|
| 23 | **Cloudflare Pages hosting + Jakarta edge (<25 ms)** ([V2] 292–298) | **SHIP NOW** | Static hosting + CDN at zero marginal cost; it is the correct home for the cockpit and is not a Week-1 migration. | [V2] 290–298 vs [PRD-M] 464 (Vercel): the *hosting vendor* conflict is resolved in favour of Cloudflare where already deployed; do not re-platform in the MVP. |
| 24 | **Cloudflare Workers KV edge cache** ([V2] 297) | **DEFER** | Introduces a second source of truth for prices alongside Supabase; [BL] 94 forbids a blanket "LIVE/VERIFIED" state, which a KV cache encourages. | [V2] 297 presents KV as an anti-block cache; [MP]/[BL] require one honest observation contract. Keep one store until the contract exists. |
| 25 | **Cloudflare Turnstile anti-bot** ([V2] 296) | **SHIP NOW** (correction) | Free anti-bot on public forms is a sensible complement to the Week-1 auth gate — **but [V2] 296 calls it "Turnstile Enterprise", which is a paid product**; the free Turnstile tier is what is available. | Corrects a [V2] factual error and aligns with the Week-1 security gate. |
| 26 | **Supabase PostgreSQL, 30-day rolling history** ([V2] 314) | **SHIP NOW** | Already the state plane ([V2] 314; [PRD-M] 702); retention cap keeps the free tier viable. | Aligns both documents. |
| 27 | **Supabase Auth — individual identity** (new; implied by [LEAN] 100) | **SHIP NOW** | It is the Week-1 replacement for the client-side password gate, and the precondition for any paid entitlement. | This is where [LEAN] *adds* a requirement [V2] lacks: [V2] 372 only has a master password. |
| 28 | **Site-wide 30-day rolling purge of DB** ([PRD-M] 675) | **SHIP NOW** | Keeps storage under the free-tier ceiling; harmless for price telemetry. | **Caveat escalated:** do not let the purge touch subscriber records, notes or published editions ([BL] 201). |
| 29 | **"Rp 0 / bulan forever" zero-cost guarantee** ([V2] 32, 298, 320) | **DROP (as a marketed guarantee)** | [V2]'s own table lists a ~Rp12,500/month domain row (317) yet totals Rp0 (320); Workers/KV/Supabase free tiers have request/storage caps and idle pausing, and a paid service adds payment-provider fees and tax ([MP] 1021). Keep zero-cost as an **internal design constraint**, never a customer promise. | Resolves the [V2] internal arithmetic contradiction and the [V2]-vs-revenue conflict. |
| 30 | **Custom domain (~Rp12,500/month)** ([V2] 317) | **DEFER** | Optional branding cost; a `*.pages.dev` URL is sufficient for the early-bird cohort. | Removes the row that contradicts the Rp0 total. |
| 31 | **"100% uptime, $0 billed" KPI** ([PRD-M] 683) | **DROP** | A free-tier DB that pauses on inactivity cannot honestly promise 100% uptime; replace with a status page and best-effort statement. | Corrects a KPI that would be falsified in month 1. |
| 32 | **6-step setup guide / operator runbook** ([V2] §6, 326–395) | **SHIP NOW** | Needed to actually operate the pipeline and the bot each week; cheap to maintain. **Must be corrected** for secret hygiene ([V2] 372 already marks `COCKPIT_PASSWORD` as env-configured, but the .env block must never be committed). | Aligns both documents on operability. |
| 33 | **Daily SOP trader flow 07:15 → 09:00 (+ 24/7 standby)** ([V2] §7, 399–415) | **SHIP NOW (trimmed)** | The SOP *is* the onboarding and the activation metric ("did they act?"); trim it so it references only alerts that actually ship (rows 1, 3, 5). | [V2]'s SOP assumes 4+ alert times; [LEAN] ships fewer — the SOP must match reality or the promise breaks on day 1. |
| 34 | **OJK/BEI compliance standard as a claim** ([V2] 8) | **DEFER** | Compliance framing needs legal review before it appears in sold copy ([MP] 1021 explicitly does not determine the legal classification). | [V2] 8 labels the standard as compliance; [MP] 1021 says classification is unresolved. |
| 35 | **Zero-Hallucination Gate / Astra fact-vs-opinion doctrine** ([V2] 8, [PRD-M] 56–58) | **SHIP NOW** | It is the only thing that lets MBG charge for signals honestly, and [LEAN] 36 calls data integrity "100% correct". | Aligns both documents; it is the bridge between the two positions. |
| 36 | **Multi-phase engineering roadmap, Phase 2–3** ([PRD-M] 685–713) | **DEFER** | Phase 2/3 (paper lab, TimesFM, broker API, full multi-user) are legitimate long-term scope, funded from revenue. | [V2]'s sprint plan vs [LEAN]'s 4 weeks — see C-1. |

### 2.5 Sprint roadmap item ([V2] §8, lines 419–433)

| # | [V2] item | Verdict | Business justification | Disagreement it resolves |
|---|---|---|---|---|
| 37 | **4-sprint sequential roadmap as the active execution plan** (Sprint 1 Cloudflare+Turnstile → Sprint 2 quant+Supabase → Sprint 3 Telegram+TimesFM → Sprint 4 paper trading 14 days → launch) ([V2] 419–433) | **DROP as the active plan; retain as archived long-term scope** | The sprint order puts *launch* last, after a paper-trading validation gate that [BL] 161 shows is defective; [LEAN] 24–28 is right that it starves validation of revenue. | **The central conflict:** [V2] "validate then launch" vs [LEAN] "launch then fund validation". Owner decision D-1 (§6). |
| 38 | **14-day paper-trading validation as a launch gate** ([V2] 431) | **DEFER (remove as a launch gate)** | Launch must not be hostage to a module with a known settlement defect; run it as a post-revenue validation, or the gate silently becomes a 6-month delay. | Removes the gate that makes the 4-week MVP impossible. |

### 2.6 Verdict counts

| Verdict | Count |
|---|---:|
| **SHIP NOW** | **20** |
| **DEFER** | **14** |
| **DROP** | **4** |
| **Total dispositions** | **38** |

*Note on count:* §2.6 counts the 38 numbered rows above (the 6 Telegram types are counted individually, so the "6 alert types" appear as rows 1–6; the 24/7 terminal and Cloudflare/Supabase/budget/SOP/sprint items are each decomposed into their constituent promises). Rows 14, 29, 31 and 37 are the DROPs; row 38 (paper trading as a launch gate) is a DEFER.

---

## 3. The lean-strategy critique, restated fairly and adjudicated

### 3.1 What [LEAN] says is gold — and whether it is technically correct

| [LEAN] "gold" claim | Source | Technical judgement |
|---|---|---|
| **Data integrity: audit items C01–C05 / H01–H22** must be fixed; never show synthetic data as live without a disclaimer ([LEAN] 35–36) | [BL] 233 documents synthetic generators in `SecurityHubDrawer` (tape/depth/whale) and `useLivePrices` seeding prices with `Date.now()`; [BL] 237 requires "synthetic never LIVE" | **Correct, and understated.** [V2] itself is the offender: it prints precise foreign-flow, probability and price values in sample messages (100–260) with no provenance and no synthetic label. This is the single highest-value item in [LEAN] and should be a Week-1 gate, not just a "gold" note. |
| **Security H01/H02: remove the hardcoded `mbg` password; stop serving signal JSON from `public/`** ([LEAN] 37–39) | [BL] 185: `PasswordGate.verifySession` trusts mutable local flags and permits a test fallback; [BL] 221: `/api/data` returns public cache headers and `_headers` caches data JSON with `CORS *` | **Correct.** The "password gate" in [V2] 372 and [PRD-M] 676 is client-side and therefore decorative. Selling access behind it would leak the paid product on day 1. |
| **Clear role separation: Guest / Free / Pro-VIP** ([LEAN] 40–41) | [BL] 38–44 defines exactly these audiences; [BL] 209 notes `App.userTier` reads/writes `mbg_user_tier` from localStorage and sidebar badges are display labels | **Correct and necessary.** Without it there is no enforceable paid product; the current tier is client-editable ([BL] 570). |

**Adjudication:** all three "gold" items are **technically correct**. They are also the *preconditions of monetisation*, not optional hygiene. [LEAN]'s own 4-week plan (98–102) is consistent with this, but the plan under-scopes it: it lists 3 fixes where the backlog lists six trust tickets totalling 15–25 engineering days ([BL] 116).

### 3.2 What [LEAN] calls over-engineering — one row per critique

| # | [LEAN] critique | What the cited source actually says | Technical judgement |
|---|---|---|---|
| **L-1** | "**7-page academic paper / Quarto PDF**" must be dropped; traders won't read a thesis ([LEAN] 47, 49) | [MP] 507 states explicitly: *"Length guides are not page minimums… generic textbook padding does not add rigor."* The seven-page item is a **completed sample**, not a mandate ([MP] 40, 64, 502). Quarto is a **later candidate** ([MP] 673, 705) costing 4–8 engineering days ([MP] 944) and is *"not a dependency for basic export"* ([MP] 673) | **Partly correct — correct on sequencing, inaccurate on the characterization.** The master plan does **not** require a 7-page academic gate before launch, so [LEAN] attacks a straw man. It is **right** that a research-publishing program must not gate revenue: [BL] schedules it as **W3**, after W0–W2 ([BL] 394–410), and the light PDF path is a 2–4-day recovery ticket ([BL] 404). **Resolution:** DROP Quarto from the launch path (it is not on [V2]'s path at all), keep the lightweight PDF recovery as a *demand-triggered* Week-4 ticket (PDF01), and keep the "paper-like reasoning + limitations/counter-thesis" requirement ([MP] 149) as the *quality bar*, not a page count. |
| **L-2** | "**Business tier multi-seat / corporate team** (Seksi 4.1)" is premature; defer until a company asks ([LEAN] 50) | [MP] 152: Business arrives *"after tenancy/billing validation"*; [MP] 230: "Team invites / seats / approvals — **Later**"; [BL] 44: Business is *"Planned information only — no team purchase or seat promise"*; [MP] 948: Business workspaces are 3–6 engineer person-weeks | **Correct in substance, but it is not a real disagreement.** The master plan already defers Business; [LEAN] is arguing against a tier the plan itself marks as later. **Residual work is small but real:** [MP] 240–256 still publishes Business *pricing/quota hypotheses* (from Rp799,000/workspace/month) and [MP] 323/618 require a checkout page to display seat/plan choices. **Resolution:** keep Business visible as **"planned, not purchasable"** ([BL] 618), remove it from any live pricing page and from the Week-1–4 backlog. No engineering now. |
| **L-3** | "**Editorial board & retraction policy**" is journal-style bureaucracy for a 2-person team; Fuad curates directly ([LEAN] 51) | [MP] 513–525 defines a mandatory paper spine; [BL] 480–484 defines a **single named editor/reviewer** flow (approve/return/reject) **plus** a correction/withdrawal lifecycle ([BL] 520) — not a board, and not peer review. [V2] contains **no** editorial governance at all | **Partly correct.** [LEAN] correctly rejects multi-reviewer governance and any journal-style "dewan redaksi". It is **wrong to bundle that with correction/withdrawal**, because a published factual claim needs a correction path for both consumer trust and liability ([BL] 520). **Resolution:** DROP the board/governance concept; KEEP a one-person review + a lightweight "correction = new edition, parent/change summary, visible supersession" capability. Do not build a CMS — [BL] 480 already says MVP authoring is file/import + review queue. |
| **L-4** | "**18-exchange real-time licences**" would cost tens of thousands of dollars/month; use free Yahoo/Binance/Mempool/RSS instead ([LEAN] 52) | [MP] 1009: *"No actual MBG IDX/US/feed/news rights were established by this plan"* and a personal TradingView/CoinGecko subscription does **not** grant resale, real-time display or export; [MP] 982: "No free-by-default assumption"; [MP] 159: launch hypothesis is **one licensed market** | **Correct on the licence risk; incomplete on the remedy.** [LEAN] is right that buying 18 exchange licences before revenue is fatal. But its alternative — "feed yang legal, gratis, dan stabil (Yahoo Finance / Binance API)" — is **not established as legal for redistribution either** ([MP] 1009 warns exactly against that assumption). **Resolution:** the real answer is neither "buy 18 licences" nor "free feeds are automatically fine": **launch one market whose permission basis the owner explicitly accepts**, and keep unlicensed data out of the paid product until that is documented. This is owner decision **D-2** (§6). |

### 3.3 What [LEAN] gets factually wrong or overstates

| Item | [LEAN] says | Correction (with source) |
|---|---|---|
| Timeline slippage | 13.5–24 weeks "almost always" slips to 8–10 months ([LEAN] 19) | The **13.5–24 person-weeks** figure is documented ([MP] 922, [BL] 82). The **8–10-month** slippage is an [ASSUMPTION] with no project data. Treat as a risk, not a fact. |
| Engineering cost | "biaya rekayasa senilai Rp 150 Juta (24 minggu waktu kerja)" ([LEAN] 83) | The **Rp150M** figure has no cited rate or source; it is an [ASSUMPTION]. The 24 weeks is inherited from [MP]. |
| "0 paying users" ([LEAN] 21) | [BL] 257 lists "current customers" as an **unknown**, not as zero. Cannot call it 0 without evidence. |
| MRR = "pemasukan bersih" ([LEAN] 81) | Rp10M is **gross revenue**: it excludes payment-provider fees, tax, refunds/chargebacks and support cost. Presenting it as *net* is a material error. |
| "3 best bots from 16" ([LEAN] 105) | [BL] 161/247/249 show the Arena/paper ledger is defective and must be disabled publicly; a "best bot" ranking from an unvalidated ledger is not an edge measure. |

---

## 4. ICP, value proposition, pricing and unit economics (reconciled)

### 4.1 ICP — two different customers in the source documents

| Dimension | [V2] target | [LEAN] target | Reconciled primary ICP |
|---|---|---|---|
| Who | Absolute layperson "trader awam"; explained "in 5 seconds" ([V2] 7, 29) | Self-directed trader, 22–45, capital **Rp 10 jt – Rp 500 jt**, tired of pompom groups, values quant analysis ([LEAN] 70) | **Primary:** Indonesian self-directed retail trader, 22–45, Rp10jt–500jt capital, time-poor, already trading IDX and/or crypto, wants a decision, not a lecture. **Secondary (Pro/retention):** the quant-minded user who will use the cockpit, watchlists and papers ([MP] 144). |
| Market | BEI + global + crypto simultaneously ([V2] 18–19) | BEI + Gold (XAUUSD) + Crypto ([LEAN] 28, 70) | **One licensed market at launch** ([MP] 159); the *content* can reference global macro as context. |
| Pain | Missed news, complex macro, emotional sizing ([V2] 19–24) | Wants profit + sane risk + easy UX + honest developer ([LEAN] 60–63) | The same pain, expressed commercially: **"I don't know what to buy, when, how much, and when to cut."** |
| Contradiction | [V2]'s "bahasa bayi" framing implies a non-analytical beginner; [LEAN]'s "appreciates quant" implies an analytically literate user | | **[CONFLICT]** Different copy, price ceiling and retention model. Resolve with two surfaces: **free/public = beginner "bahasa bayi"; VIP/Pro = lean quant-labelled signal + explicit risk math.** |

### 4.2 Value proposition (reconciled)

1. **Speed + decision:** "a small number of risk-defined setups, before the move" — merges [V2]'s instant alert with [LEAN]'s "Entry, SL, TP, and a 2-sentence reason" ([LEAN] 49).
2. **Risk math, not just calls:** Astra filter + lot calculator ([V2] 31; [PRD-M] 672–674) — the anti-boncos promise.
3. **Honesty as a feature:** fact/opinion separation, source-time labels, published hit/miss, no screenshot bragging ([LEAN] 63; [PRD-M] 56–58).
4. **Not:** the 14-tab terminal, the AI forecast band, or the strategy league — those are later depth, not the reason to pay in month 1.

### 4.3 Pricing — three sources, no agreement yet

| Source | Proposal | Status |
|---|---|---|
| [V2] | No price at all; product described as free/zero-cost ([V2] 32, 302–322) | **[CONFLICT]** — cannot fund operations |
| [LEAN] | Early bird **Rp150,000/month**, or **Rp350,000 / 3 months**; benchmark "VIP Telegram retail Rp150k–350k/month" ([LEAN] 76, 113) | Proposed tactic; benchmark is unsourced |
| [MP] | Pro test **Rp199,000 vs Rp249,000/month**; extra market pack Rp49,000–99,000; Business from Rp799,000/workspace ([MP] 242–256) | Explicitly labelled **"test hypotheses, not present tariffs"** ([MP] 238) |

**Reconciled pricing recommendation (owner sets the number):**
- **Founding-member price (Week 3):** Rp150,000/month, month-to-month, capped at the first 30–50 members — matches [LEAN] 113 and keeps the early cohort low-risk.
- **List price (post-Week 4):** run [MP]'s A/B test of **Rp199,000 vs Rp249,000/month** on new cohorts; do not raise the founding cohort's price without notice.
- **Prepay:** offer 3 months at ~2 months' price only if cash-flow benefit is worth the churn masking; measure separately.
- **Not sold:** Business seats ([BL] 44), PDF/AI credits until costed ([BL] 592), the 14-market pack until licensed ([MP] 159).

### 4.4 Unit economics — facts vs assumptions

| Metric | [LEAN] value | Grade | Basis / correction |
|---|---|---|---|
| Market price benchmark | Rp150,000–350,000/month | **[ASSUMPTION]** | [LEAN] 76 labels it "Tolok Ukur Pasar" but cites no source or comparison set. |
| Monthly churn | 20% | **[ASSUMPTION]** | [LEAN] 77; no cohort data exists (no paying users evidenced). |
| Customer lifetime | 5 months | **[ASSUMPTION — derived]** | [LEAN] 78; it is the arithmetic inverse of the 20% churn assumption (1/0.20 = 5), not an observed survival curve. |
| LTV | Rp1,000,000 | **[DERIVED, not measured]** | [LEAN] 79 = Rp200,000 × 5. The Rp200k is itself an unsourced midpoint of the benchmark range; LTV therefore inherits two assumptions. |
| 50 members → MRR | Rp10,000,000/month | **[ARITHMETIC PROJECTION]** | [LEAN] 81 = 50 × Rp200k. **Internal inconsistency:** the Week-3 promo price is Rp150,000 ([LEAN] 113) → 50 × Rp150k = **Rp7.5M**, not Rp10M. And it is **gross**, not "pemasukan bersih" as [LEAN] 81 claims. |
| Phantom swap commission 0.8% | "potensi komisi" | **[ASSUMPTION + out of MVP]** | [LEAN] 82. Swap is disabled by [MP] 234 and [BL] 247, and crypto commission needs regulatory review; exclude from the 4-week model. |
| Engineering cost Rp150M | — | **[ASSUMPTION]** | [LEAN] 83; no rate/source. |
| Effort envelope 13.5–24 person-weeks | — | **[FACT — documented estimate]** | [MP] 922, [BL] 82 (labelled engineering judgement, not a calendar commitment). |
| "0 paying users" | — | **[UNVERIFIED]** | [BL] 257 lists current customers as unknown. |
| [V2] Rp0/month operating cost | — | **[ASSUMPTION, internally inconsistent]** | [V2] 317 lists a ~Rp12,500/month domain row while [V2] 320 totals Rp0; free tiers have caps and can pause. |

**What is documented fact (use with confidence):** the effort envelope (13.5–24 person-weeks); the one-licensed-market default; that **no data rights were established**; that the password gate is client-side; that signal JSON is publicly cached; that the paper-broker ledger has a reproduced defect; that all prices in [MP] are test hypotheses; that a 7-page sample exists and is explicitly not a page mandate.

**What must never be quoted to a customer or investor as fact:** churn, lifetime, LTV, the Rp10M MRR, the Rp150M cost, the 0.8% swap commission, and the "Rp0 forever" claim.

**Missing from [LEAN]'s model entirely (must be added before any forecast):** CAC, payment-provider fee, tax, refund/chargeback rate, support hours, and the cost of the licensed data feed.

---

## 5. The single reconciled 4-week MVP

**MVP definition (one sentence):** *Harden the existing cockpit against the known leaks, wire the existing signal output into a gated Telegram VIP channel plus a free public channel, sell Rp150k/month founding memberships to 30–50 people via hosted checkout, then reinvest only what the cohort pays for.*

**Week structure below uses [BL] ticket IDs. Tickets marked `[NEW]` are **not** in the current backlog and must be created.**

### Week 1 — Security gate (make access and data enforceable)

| Ticket | Why it is in Week 1 | [LEAN] Week-1 ask it satisfies |
|---|---|---|
| **BASE04** | Freeze the bounded pilot scope: one market, Free/Pro surfaces, first cohort, rollback owner ([BL] 169–179) | Defines what is being sold |
| **TRUST01** (narrow slice) | Replace the client-side `mbg` gate with a verified individual session ([BL] 181–191) | "Cabut password hardcoded mbg" ([LEAN] 99) |
| **TRUST04** | Stop the full signal bundle being served from `public/` with public cache headers ([BL] 217–227) | "Pindahkan file JSON sinyal dari `public/` ke endpoint API" ([LEAN] 101) |
| **TRUST03** (narrow slice) | Server-owned capability/market policy so Free vs Pro is not a localStorage value ([BL] 205–215) | "Pemisahan peran Guest/Free/Pro" ([LEAN] 41) |
| **TRUST06** | Isolate unsafe modules: disable fake swap success, real Binance order submission, synthetic whale/tape feeds ([BL] 241–251) | Prevents a public incident during the first sale |
| **BASE02 + BASE03** | Route/data/rights map and regression/defect matrix, so the gate is verified against reality ([BL] 145–167) | Evidence for the gate |

**Deliberately NOT in Week 1 (deferred, and this is a conflict — see §6):** full **TRUST02** (ownership/RLS/private storage, 3–5 days) and **TRUST05** (observation/provenance contract, 3–5 days).

> **[CONFLICT — effort]** [LEAN] allots Week 1 **2–3 working days** ([LEAN] 98). The backlog's W1 (TRUST01–06) is **15–25 engineering days** ([BL] 116, 131). They cannot both be true. The Week-1 slice above is the minimum defensible subset; **the owner must accept that selling before TRUST02 means subscriber entitlements are not yet authoritatively enforced** — an explicit, time-boxed commercial risk, not a solved problem.

### Week 2 — Telegram VIP + free channel

| Ticket | Why it is in Week 2 |
|---|---|
| **TRUST03** (Channel scope) | Server policy must decide who receives VIP payloads; Telegram may not re-serve the public bundle ([BL] 210–211) |
| **TRUST04** (Channel classification) | Telegram is named as a data-delivery channel that must follow the same content policy ([BL] 102, 221) |
| **COMMERCIAL06** (pulled forward from W4) | "Basic price rules and in-app inbox" is the closest existing ticket to alert delivery/scope (AC18) ([BL] 556, 586). **Partially reused**; alert entitlements for Telegram are not fully covered. |
| **`[NEW] GTM-TG-01`** | VIP channel entitlement + delivery: the actual `broadcast_vip_trade_signal` wiring, public-vs-VIP routing, and per-subscriber gating. No existing backlog ticket owns this — **this is a real gap in [BL]**. |
| **`[NEW] GTM-DATA-01`** | Signal provenance/labelling: every alert carries source, source-time, "illustrative vs observed" and `AWAITING_HUMAN_REVIEW` where applicable (required by [BL] 235, [LEAN] 36). |
| **`[NEW] GTM-HONEST-01`** | Public-channel performance disclosure: publish hit/miss on the same sources, no cherry-picked screenshots ([LEAN] 108). |

> **[CONFLICT — edge proof]** [LEAN] 105 says pick the "3 best bots from 16 Arena" by performance. [BL] 161/247/249 say the paper/Arena ledger is defective and must be disabled publicly. **You cannot select bots by a ledger you are suppressing.** Ship the bot logic as signal generation with honest labels; do **not** advertise Arena-derived win rates.

### Week 3 — First 30–50 paying members (GTM launch)

| Ticket | Why it is in Week 3 |
|---|---|
| **COMMERCIAL01** | Server access contract: plan/version/expiry/quota; without it there is no paid entitlement ([BL] 564–576) |
| **COMMERCIAL03** | Hosted checkout + authoritative payment state + reconciliation; without it there is no reliable revenue ([BL] 594–608) |
| **COMMERCIAL04** | Account/plan/downgrade UI so the buyer sees what they bought ([BL] 610–620) |
| **COMMERCIAL05** | Scoped internal operations for the owner (who has access, who is refunded) ([BL] 555) |
| **COMMERCIAL02** | Only in scope if the offer includes AI/credit-consuming jobs; otherwise defer ([BL] 578–592) |
| **`[NEW] GTM-LAUNCH-01`** | Early-bird cohort mechanics: 30–50 cap, founding price, refund policy, onboarding sequence, first-cohort feedback script ([LEAN] 111–115) |

> **[PULLED-FORWARD COST]** [BL] estimates W4 (COMMERCIAL01–06) at **10–20 engineering days = 2–4 person-weeks** ([BL] 560). Pulling the P0 subset into Week 3 is realistic only with focused staffing; it is the largest single schedule risk in the 4-week plan.

### Week 4 — Evaluation + scale-from-profit

| Ticket | Why it is in Week 4 |
|---|---|
| **COMMERCIAL04** (downgrade/cancel slice) | Retention/pause behaviour and honest churn measurement ([BL] 610–620) |
| **OPS01** | Release flags/manifest/telemetry so the owner can see what is live and what fails ([BL] 557) |
| **OPS02** | Restore/rollback and release validation before scaling spend ([BL] 558) |
| **PDF01** (demand-gated) | Only if paying members ask for export — 2–4 days, reuses existing exporter ([BL] 404, 444–454) |
| **RESEARCH01+** (revenue-gated) | Start only from profit; [LEAN] 119–122 is explicit that further builds are funded by customer money |

**Week-4 exit decision (owner):** continue (members renewing, signals followed), pivot the offer (price/channel/market), or stop — before any new infrastructure spend.

### 5.1 Explicit 4-week scope reduction (what the MVP does NOT ship)

Not in MVP: TimesFM, Exp3, paper trading, 14 tabs, correlation/backtest, audio alert, i18n, Workers KV, 6 alert types (ships 3), Business tier, PDF/Quarto, MT5 copy-trading ([LEAN] 121 mentions MT5 as a *later* option; [MP] 234 keeps execution internal — no ticket exists and none should be pulled forward).

---

## 6. Conflicts to escalate to the owner

Each item below is a case where [V2] (or [MP]) and [LEAN] **cannot both be true**, or where a source contradicts itself. Owner answers are required before Week 3.

| ID | Conflict | Evidence | Why it cannot be resolved by engineering |
|---|---|---|---|
| **C-1 (D-1)** | **Timeline:** [V2] 4 sprints + [MP] 13.5–24 person-weeks vs [LEAN] 4-week MVP | [V2] 419–433; [MP] 82/922; [LEAN] 19, 87–96 | A calendar choice with staffing and income consequences; the numbers differ by 5–20×. |
| **C-2** | **Scope:** 14 market tabs / 6 alert types / full terminal vs one market / ~3 alerts | [V2] 271, 102–110; [MP] 159; [LEAN] 104–109 | Determines data cost, review load and the Week-2/3 content calendar. |
| **C-3** | **Product form:** web terminal is the product ([V2] §1.2, §3) vs Telegram VIP signal is the product ([LEAN] 28, 104–115) | [V2] 27–32; [LEAN] 28 | Determines where engineering and marketing money go; the cockpit becomes an acquisition/retention surface if [LEAN] wins. |
| **C-4** | **Price:** [V2] implies free; [LEAN] Rp150k–350k; [MP] Rp199k/249k test + Rp799k Business | [V2] 32/302–322; [LEAN] 76/113; [MP] 242–256 | Only the owner can set the founding price and whether to honour it after launch. |
| **C-5** | **Data legality:** "free Yahoo/ECB/Binance feeds" vs "18 exchange licences" | [LEAN] 52; [MP] 1009, 982, 159 | **Neither position is safe as stated.** [MP] says no rights were established and free feeds do not grant resale. Requires an owner procurement/legal decision. |
| **C-6** | **Honesty vs speed:** [V2] sample alerts state "Net Foreign Buy +Rp385 Miliar" and "Probabilitas Bullish 84%" with no provenance; [LEAN] wants to sell signals fast | [V2] 120–137; [LEAN] 28, 111–115 | Selling unproven precision as fact is a consumer-protection and reputational risk; speed cannot override it. |
| **C-7** | **Edge proof:** sell the "3 best of 16 Arena bots" ([LEAN] 105) vs disable the Arena/paper ledger as defective ([BL] 161/247/249) | See §5 Week 2 | Cannot both ship a performance claim and suppress the ledger that supposedly proves it. |
| **C-8** | **"Rp0 forever"** public promise vs revenue reality | [V2] 32/317/320/296; [MP] 1021 | Charging money brings payment fees, tax and merchant terms; a lifetime cost guarantee is unenforceable and has an internal arithmetic contradiction. |
| **C-9** | **Unit economics:** 20% churn / 5-month life / Rp1M LTV are assumptions presented as benchmarks; MRR called "net" | [LEAN] 76–83 | Forecasts built on unmeasured inputs; the owner must decide whether to quote them at all. |
| **C-10** | **ICP:** beginner "bahasa bayi" ([V2] 29) vs quant-appreciating trader with Rp10–500jt ([LEAN] 70) | [V2] 7/29; [LEAN] 68–70 | Determines copy, price anchor and product depth; both cannot be the lead message. |
| **C-11** | **Document authority:** [V2] is marked "FINAL & APPROVED FOR PRODUCTION SPRINT" ([V2] 10) while [MP]/[BL] (1 Oct 2026) supersede architecture (Vercel/Supabase/Cloudflare) and scope | [V2] 10; [MP] 464/159; [BL] 110 | The owner must designate one authoritative product document, or teams will build two products. |
| **C-12** | **V2 architecture vs [PRD-M]:** Cloudflare Pages/Workers ([V2] 9/270) vs Vercel React/Vite ([PRD-M] 464) and 3-universe scope ([PRD-M] 39–44) | [V2] 9; [PRD-M] 44/464 | Hosting and scope are incompatible as written; pick one. |

### 6.1 The single most important owner decision

> **D-1: Which single market may MBG legally and honestly sell, and therefore what exactly is sold in Week 3?**
>
> Concretely: approve **one** sellable market (IDX, or crypto spot, or Gold) **with an accepted permission basis for its data**, and approve the **Week-3 offer** of *Telegram VIP signals + Pro cockpit access at Rp150,000/month* on that market.
>
> This decision is the hinge because:
> - it sets whether Week 3 revenue is legally defensible (C-5, C-6);
> - it fixes the Week-2 alert content and the public-channel claims (C-2, C-7);
> - it determines the price and therefore the whole unit-economics model (C-4, C-9);
> - and it is the decision that demotes the V2 full-scope terminal to archived long-term scope, which cascades into every remaining ticket (C-1, C-3, C-11, C-12).

Until D-1 is answered, Week 3 cannot be scheduled, because the sellable unit is undefined.

---

## 7. Acceptance check against the task brief

| Requirement | Status |
|---|---|
| Every [V2] feature appears once with one verdict | ✅ §2 — 38 dispositions (6 Telegram types individually; 24/7 terminal, Cloudflare, Supabase, zero-cost claim, daily SOP and sprint roadmap each decomposed), one verdict each |
| All four [LEAN] critiques adjudicated with a technical judgement | ✅ §3.2 L-1…L-4 (correct / partly correct / incorrect) plus §3.1 gold items and §3.3 factual errors |
| ICP, value proposition, pricing, unit economics reconciled; lean numbers tabled as fact vs assumption | ✅ §4.1–§4.4 |
| Single 4-week MVP with concrete backlog ticket IDs | ✅ §5 (TRUST01/03/04/06, BASE02/03/04, COMMERCIAL01/03/04/05/06, OPS01/02, PDF01, RESEARCH01+; gaps flagged as `[NEW]`) |
| Explicit conflicts escalated to the owner | ✅ §6 C-1…C-12, with the single most important decision D-1 in §6.1 |
| Assumptions never presented as verified facts | ✅ Every claim tagged `[FACT]`/`[ASSUMPTION]`/`[CONFLICT]`; sources cited by line throughout |

---

### Appendix A — Claims in [V2] that must be corrected before any customer sees them

| Claim | Location | Correction |
|---|---|---|
| "Turnstile Enterprise" free | [V2] 296 | Free Turnstile ≠ Enterprise; Enterprise is paid. |
| Total operating cost "RP 0 / BULAN" while listing a ~Rp12,500/month domain | [V2] 317 vs 320 | Arithmetic contradiction; state the real, non-zero cost or remove the row. |
| "GRATIS TANPA BATAS (Unlimited Bandwidth)" | [V2] 295 | Pages static bandwidth is effectively unlimited; Workers/KV free tiers have request limits. Scope the claim. |
| "100% uptime" at $0 | [PRD-M] 683 | Free-tier databases pause; replace with status + best-effort. |
| "84% Bullish probability" and precise foreign-flow numbers in sample alerts | [V2] 121–123, 144–157 | Label as illustrative/heuristic unless a named method and source exist, per [BL] 235. |
| "90% trader pemula mengalami kerugian" | [V2] 18 | Unsourced statistic; cite a source or soften. |
| "Global Actions 24/7" on free APIs | [V2] 313, 395 | GitHub Actions free minutes are capped on private repos; "24/7" is conditional. |
| Product status "FINAL & APPROVED FOR PRODUCTION SPRINT" | [V2] 10 | Superseded by the 1 Oct 2026 revamp plan per C-11; re-label as vision/archive. |
