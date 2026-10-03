# UI/UX Polish Report — MBG PRO Tactical Quant Terminal

**Date:** 30 September 2026
**Method:** Multi-agent build-and-release workflow per the "Hermes Generalist Bot Team Playbook" — Navigator (lead orchestration + verification), Forge (independent audit + bounded implementation), Scout (independent evidence research, primary sources).
**Scope:** MBG-Trading/frontend/** only (React 18 + Vite, plain-CSS design system). No backend/deploy/CI changes. No new npm dependencies.

---

## 1. Fresh Audit Findings (by severity)

### Critical
| # | Finding | Evidence |
|---|---|---|
| C-1 | Light theme rendered `.quant-card` / `.quant-pill-nav` / `.quant-input` with dark-hardcoded surfaces and no `[data-theme=light]` override — text on them measured **1.09:1** (unreadable) | `index.css` + computed contrast |
| C-2 | Light badge text failed AA: badge-bull **2.26:1**, badge-alert **3.00:1**, badge-bear **4.11:1**; hardcoded `#38bdf8`/`#10b981`/`#f59e0b` as text on white panels 2.1–2.6:1 | computed contrast |

### Major
| # | Finding | Evidence |
|---|---|---|
| M-1 | US Stocks RSI column rendered a fake `50.0 (NEUTRAL)` from the pipeline's flat `rsi_14=50` default | `USStockTab.jsx` |
| M-2 | 128 bare `.toLocaleString()` calls — Rp values were browser-locale-dependent (`16,800` on en-US vs `16.800` on id-ID) | codebase scan |
| M-3 | Badge saturation: 3–8 badges per card/row, 10+ one-off badge classes, mixed radii/weights | components scan |
| M-4 | Touch targets ~20–28px, no `pointer:coarse` handling | CSS scan |
| M-5 | Jargon (Q-Score, R:R, SMC, RANGE_ACC) unexplained for newcomers | components scan |
| M-6 | Prior-audit screenshots in `docs/` were stale vs the working tree (COMPANY NAME fix already existed via the H-05 metadata registry) | `US_EQUITIES_METADATA` + data bundle |

### Minor
- Crypto setup badges hardcoded `RANGE_ACC` despite real `setup_type` in data; no empty state in the screener; dark `--text-muted` at 3.42:1; marquee/sidebar hover light-on-light in light mode.

## 2. Implementation (7 files, 161+/59−)

1. **`src/utils/format.js` (NEW)** — single shared formatter: `formatIdNumber`/`formatIdr` (always id-ID → `Rp 16.800`), `formatUsd` (always en-US), `formatPct`; em-dash fallback for invalid values.
2. **`src/index.css`** — `[data-theme=light]` resurfacing block (fixes C-1); badge AA text #166534/#be123c/#92400e/#1d4ed8 (fixes C-2); dark muted bump → 5.32:1; min-heights 26/28/32px + 44px `@media (pointer:coarse)`; `--space-1/2/3` tokens; adaptive marquee colors.
3. **`src/components/USStockTab.jsx`** — honest RSI em-dash + Indonesian tooltip; header jargon tooltips; sticky TICKER column; empty state; AA CHART buttons + aria-labels.
4. **`src/components/HomeDashboardTab.jsx`** — id-ID cells in signal tables; honest setup badges from data; R:R/SMC tooltips; hardcoded colors → adaptive tokens.
5. **`src/components/MasterQuantLeaderboard.jsx`** — on-screen Q-Score legend + cell tooltip; Hard SL/TP1/R:R header tooltips; 5 Rp cells → helper.
6. **`src/components/LotCalculatorModal.jsx`** — explicit en-US USD formatting.
7. **`src/App.jsx`** — min-heights on inline-styled header chips.

## 3. Verification (all evidence-based)

| Check | Result |
|---|---|
| `npm ci` (63 packages; lockfile only, package.json untouched) | ✓ |
| `npm run build` (re-run independently by the Lead) | ✓ built in 3.19s, zero errors, 19 chunks |
| Computed WCAG contrast (WCAG 2.x relative-luminance formula) — 5 new pairs | ALL PASS ≥ 4.5:1 (6.34 / 5.50 / 6.67 / 5.49–6.0 / 5.32) |
| Visual: light mode fully readable, real company names, real MKT CAP/P/E, honest RSI em-dash | ✓ (screenshot) |
| Visual: mobile 375px — no header breakage, no overflow, clean card stacking | ✓ (screenshot) |
| Scope: all changes inside `frontend/src/**`, no behavior-removal found in full diff review | ✓ |

**Visual evidence (captured 2026-09-30 from the production build via headless Edge):**
- `docs/screenshots/ui_polish_2026-09-30/after_light_desktop.png` — light theme after resurfacing
- `docs/screenshots/ui_polish_2026-09-30/after_dark_desktop.png` — dark theme
- `docs/screenshots/ui_polish_2026-09-30/after_us_stocks.png` — sticky ticker + honest RSI
- `docs/screenshots/ui_polish_2026-09-30/after_mobile.png` — 375px viewport

## 4. Limitations (deliberately not done)

1. Badge consolidation into ONE semantic set across ~41 components was not merged (needs a cross-component refactor; shared `.badge` classes were calmed).
2. Sticky table HEADER row not added (sticky ticker COLUMN done; header stickiness needs per-table testing).
3. ~70 remaining hardcoded decorative colors elsewhere (WhaleIntelligence, AiAgentArena, ChartingDesk, risk-radar gauges) untouched within the 8-file budget.
4. News page "Spot ETF Flow" panel placeholder junk needs the ETF-flow data source (backend out of scope).
5. MKT CAP/P/E come from a static 2026-09-17 registry without an as-of marker; real pipeline fields are 0 (backend out of scope).
6. Jt/Miliar kept as expert convention — Scout found no official BEI/IDX mandate (dropped, not fabricated).
7. Sentinel independent review was dispatched; verdict pending at write time. The Lead's own verification (build + visual + computed WCAG + full diff review) stands as the release gate for this bounded, user-facing-only change.

## 5. Current state, next action, owner

- **Current state:** Implemented + verified; uncommitted in the working tree (7 files + 4 screenshots + this report + CHANGELOG entry). Commit/push is the user's decision.
- **Next action:** User reviews the visual evidence and decides on commit/push.
- **Owner:** User (release decision). Follow-up work needs re-assignment.
- **Blocker:** None for the delivered scope.
- **Open user decisions:** (a) keep the static US metadata registry (professional look, values age) vs hide MKT CAP/P/E until a real data source exists; (b) 44px touch targets currently apply on touch devices only — extend to desktop? (would end the terminal's density); (c) proceed with cross-component badge consolidation as a follow-up pass; (d) commit/push timing.
- **Evidence:** this report, the 4 archived screenshots, `git diff` in the working tree, CHANGELOG entry `[2026-09-30]`.
