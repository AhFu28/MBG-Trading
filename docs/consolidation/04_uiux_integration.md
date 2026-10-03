# 04 — UI/UX Integration: Consolidated Design Spec

**Consolidator:** `uiux-integrator` (task-4) · **Date:** 2026-10-01 (Asia/Bangkok)
**Repo:** `MBG-Trading` · **Mode:** read-only on all source; this document is the only write.
**Inputs merged:** `docs/UI_UX_POLISH_REPORT_2026-09-30.md`, `docs/superpowers/plans/2026-09-30-spacex-class-ui-rework.md` (v4 SpaceX-class rework), `docs/UI_UX_AUDIT_REPORT.md` (2026-09-19), `docs/UI_UX_REDESIGN_WALKTHROUGH.md`, `frontend/public/mockup_spacex_home.html`, `frontend/public/mockup_spacex_screener.html`, `docs/screenshots/**`, `CHANGELOG.md` `[2026-09-28]`/`[2026-09-30]`, Master Plan §5–§8, Implementation Backlog §6 (DESIGN01–DESIGN05), and the live working tree.

> **Evidence rule applied throughout.** A change is **IMPLEMENTED-AND-VISIBLE** only if it is present in the current working-tree file (with a line reference) *or* has a named screenshot. Every 2026-09-30 and 2026-10-01 UI change is **uncommitted** (see §1.0), so nothing here is "shipped". A mockup, plan, or report claim is not evidence of implementation.
>
> **Image limitation.** `read_image` is unavailable on this model (no image input), so PNGs are cited by filename as archival evidence only; no pixel-level verification was performed by this document. Visual claims below rest on the report text that names each screenshot.

---

## 1. Status ledger of prior UI/UX work

### 1.0 Repository truth: the entire UI effort is uncommitted

`git status --short` at write time (2026-10-01) shows:

```
 M CHANGELOG.md
 M frontend/index.html
 M frontend/src/App.jsx
 M frontend/src/components/HomeDashboardTab.jsx
 M frontend/src/components/LotCalculatorModal.jsx
 M frontend/src/components/MasterQuantLeaderboard.jsx
 M frontend/src/components/USStockTab.jsx
 M frontend/src/index.css
?? docs/UI_UX_POLISH_REPORT_2026-09-30.md
?? docs/screenshots/spacex_mockup_2026-10-01/
?? docs/screenshots/spacex_rework_2026-10-01/
?? docs/screenshots/ui_polish_2026-09-30/
?? docs/superpowers/plans/2026-09-30-spacex-class-ui-rework.md
?? frontend/public/mockup_spacex_home.html
?? frontend/public/mockup_spacex_screener.html
?? frontend/src/utils/format.js
```

`git diff --stat`: 8 files, **1039 insertions / 1477 deletions**. `HomeDashboardTab.jsx` alone is ~1914 changed lines — i.e. the working tree contains **two stacked, unreviewed UI passes**: the 2026-09-30 WCAG polish *and* a substantial 2026-10-01 v4 SpaceX-class pass. Neither is committed, so neither is a shipped change. Any release claim must be re-verified after commit.

**Consequence for the ledger:** "IMPLEMENTED-AND-VISIBLE" below means *visible in the current uncommitted working tree*, not released.

### 1.1 The 7 files changed on 2026-09-30 (polish report §2/§3)

| # | File | Claimed change | Status | Evidence in current tree |
|---|---|---|---|---|
| 1 | `frontend/src/utils/format.js` (NEW) | Locale-safe `formatIdNumber`/`formatIdr` (id-ID), `formatUsd` (en-US), `formatPct`, em-dash fallback | **IMPLEMENTED-AND-VISIBLE** | File exists (`frontend/src/utils/format.js:1-40`); untracked (`??`) |
| 2 | `frontend/src/index.css` | `[data-theme=light]` resurfacing block; AA badge text; dark muted bump; min-heights; 44px coarse pointer; `--space-1/2/3`; adaptive marquee | **IMPLEMENTED-AND-VISIBLE (partly superseded)** | Light block `index.css:1025-1065`; badge AA `index.css:138/144/150/155`; `--space-1/2/3` `index.css:3-5`; coarse pointer `index.css:396` |
| 3 | `frontend/src/components/USStockTab.jsx` | Honest RSI em-dash + tooltip; header jargon tooltips; sticky TICKER; empty state; AA CHART buttons + aria | **IMPLEMENTED-AND-VISIBLE** | `sticky-col` at `USStockTab.jsx:205,242`; ~63 changed lines |
| 4 | `frontend/src/components/HomeDashboardTab.jsx` | id-ID cells; honest setup badges; R:R/SMC tooltips; hardcoded colors → tokens | **IMPLEMENTED-AND-VISIBLE, then heavily reworked by v4** | File is now ~99.9 KB with v4 mono micro-labels (`HomeDashboardTab.jsx:394-401,549,578-630`) |
| 5 | `frontend/src/components/MasterQuantLeaderboard.jsx` | Q-Score legend + cell tooltip; SL/TP1/R:R header tooltips; 5 Rp cells → helper | **IMPLEMENTED-AND-VISIBLE** | `sticky-col` at `MasterQuantLeaderboard.jsx:974,977,1028,1031`; ~30 changed lines |
| 6 | `frontend/src/components/LotCalculatorModal.jsx` | Explicit `en-US` USD formatting | **IMPLEMENTED-AND-VISIBLE** | `LotCalculatorModal.jsx:278,299` (`toLocaleString('en-US')`) |
| 7 | `frontend/src/App.jsx` | min-heights on inline-styled header chips | **IMPLEMENTED-AND-VISIBLE, then extended by v4** | Header chips now mono/hairline (`App.jsx:528-545,553-570,582-595`); ~70 changed lines |

**Honest downgrades vs the report's own claims:**
- The report's limitation #1 (badge consolidation not merged) is **still true**: `index.css:1411-1470` retains 8 legacy neon classes (`.badge-neon-green`, `.badge-success-glow`, `.badge-danger-glow`, `.badge-entry-ready`, `.badge-active-trade`, `.badge-warning`, `.badge-pullback`, `.badge-pending`) alongside the base `.badge` set.
- Report limitation #3 (~70 remaining hardcoded decorative colors) is **still true and now mixed with v4 work** — e.g. `HomeDashboardTab.jsx:725` `#eab308`, `:1660` `#fca5a5`/`#f59e0b`/`#c084fc`.
- **CHANGELOG/code mismatch:** the `[2026-09-30]` entry claims `--text-muted` dark was changed to `#7d8daa`, but the file contains `#7a8798` (`index.css:661`). The `5.32:1` figure cannot be cited for the value actually in the tree. This must be corrected before release.
- The 2026-09-30 screenshots (`docs/screenshots/ui_polish_2026-09-30/after_dark_desktop.png`, `after_light_desktop.png`, `after_us_stocks.png`, `after_mobile.png`) evidence the **polish** pass, **not** the current tree — the tree has since been overwritten by the v4 pass. They are now historical baselines, not verification of the current build.

### 1.2 v4 SpaceX-class items (plan `2026-09-30-spacex-class-ui-rework.md` §2/§4/§6)

| v4 item | Status | Evidence / why |
|---|---|---|
| Mockups produced, both themes (`frontend/public/mockup_spacex_home.html`, `mockup_spacex_screener.html`) | **IMPLEMENTED-AND-VISIBLE (as artifacts)** | Both files exist (21,896 / 15,424 bytes); in-file theme toggle at `mockup_spacex_home.html:11-22`; archives `docs/screenshots/spacex_mockup_2026-10-01/mock_home_dark.png`, `mock_home_light.png`, `mock_screener_dark.png`, `mock_screener_light.png` |
| Plan approval gate (v4 §6 "YOU REVIEW") | **PLANNED-ONLY / unrecorded** | No approval record exists in the repo. The 2026-10-01 `spacex_rework_2026-10-01/` screenshots imply implementation began; whether the user approved the mockup is not documented. **Flagged as a process gap**, not a code gap. |
| **Phase 1 — token set** (v4 §2) | **IMPLEMENTED-AND-VISIBLE (uncommitted, values only)** | All v4 dark values are live under `[data-theme="dark"]` (`index.css:647-682`): canvas `#000000`, panel `#0a0d12`, panel-2 `#0e1219`, text-1 `#f5f7fa`, text-2 `#aab3c0`, text-3 `#7a8798`, up `#2ee6a8`, down `#ff5c5c`, accent `#4d8dff`, warn `#ffb454`. Light values live in `:root` (`index.css:15-41`): `#f7f8fa`/`#ffffff`/`#f1f3f7`/`#0f172a`/`#3d4756`/`#5c6673`/`#0e9f6e`/`#dc2626`/`#1d4ed8`/`#b45309`. **But the v4 token *names* (`--canvas`, `--panel`, `--hairline`, `--text-1`…) were NOT adopted** — see §2 conflict X1. |
| Phase 1 — chrome: header | **PARTIAL** | Chip-level v4 work is uncommitted (`App.jsx:528-731`: mono, `fontWeight` 800→600, `borderRadius` 9999px→6px, hairline borders, single accent), **but the header container is still the 2026-09-28 glass dock**: `borderRadius: '12px'`, `backdropFilter: 'blur(20px)'` (`App.jsx:493-497`). Target is a flat 52–56px hairline bar. |
| Phase 1 — chrome: Sidebar | **PLANNED-ONLY** | `Sidebar.jsx` is **not in the modified set**. It still renders the glass-gradient PRO badge (`Sidebar.jsx:115`), neon glow dots `#10b981` (`:121-122,169`) and `fontWeight: '800'` (`:213-218,271-278`). |
| Phase 2 — Hero/KPI cards | **IMPLEMENTED-AND-VISIBLE (uncommitted)** | `HomeDashboardTab.jsx` now uses thin mono numerals and uppercase micro-labels: `:394-401`, `:465`, `:549`, `:578-630` (`fontWeight: '400'`, `fontSize: '8.5px'`, `letterSpacing: '0.14em'`). Evidence screenshot `docs/screenshots/spacex_rework_2026-10-01/v4_hero_row_dark.png`; full page `v4_dark_desktop.png`, `v4_light_desktop.png`. |
| Phase 2 — Market cards / sparklines | **PARTIAL** | Micro-label discipline applied (`HomeDashboardTab.jsx:549,672,734`), but the mini-chart slot is still a "loading" placeholder (`HomeDashboardTab.jsx:105`), not the v4 SVG sparkline. |
| Phase 2 — Signal tables | **PARTIAL** | Sticky columns exist (`USStockTab.jsx:205,242`; `MasterQuantLeaderboard.jsx:974-1031`) and tables are mono (`HomeDashboardTab.jsx:1229+`), but hairline-row/≤2-badge/right-aligned consolidation is not done (legacy neon badges persist, `index.css:1411-1470`). |
| Phase 2 — News rail | **PLANNED-ONLY** | `NewsTab.jsx`, `BloombergNewsWire.jsx`, `NewsDetailModal.jsx` untouched. |
| Phase 2 — Modals / drawer | **PLANNED-ONLY** | Only `LotCalculatorModal.jsx` changed (a 2-line locale fix, `:278,299`). Neon/glass surfaces in modals remain. |
| Phase 2 — Footer | **PLANNED-ONLY** | No footer change in the diff. |
| Phase 3 — verify (build, WCAG, screenshot regression vs mockup, Sentinel review) | **PARTIAL / not established** | Build + computed WCAG were evidenced for the **2026-09-30 polish** only. No build/WCAG/regression evidence exists for the 2026-10-01 v4 pass. `docs/screenshots/spacex_rework_2026-10-01/` has 5 frames (`v4_dark_desktop.png`, `v4_light_desktop.png`, `v4_hero_row_dark.png`, `v4_optionB_dark.png`, `v4_optionB_full.png`) — an **unreviewed draft contact sheet**, and notably **no mobile frame**. |
| v4 §5 "all features preserved" | **Unverified** | `HomeDashboardTab.jsx` lost ~1875 lines net in the stack; the claim of 100% feature preservation has not been independently diff-reviewed. **This is the single highest-risk unverified claim in the UI workstream.** |

---

## 2. Reconciled design system — ONE merged token table

### 2.0 Canonical-token decision (binding, so Phase 1 needs no design input)

Three naming systems collide:

- **v4 plan §2:** short names — `--canvas`, `--panel`, `--panel-2`, `--hairline`, `--text-1/2/3`, `--up`, `--down`, `--accent`, `--warn`.
- **Mockups** (`mockup_spacex_home.html:11-22`): the same short names, plus `--grid-line` (not in `index.css`).
- **Master Plan §6.2:** prose role names — Canvas, Surface, Raised/selected surface, Border, Primary/Secondary/Muted metadata text, Action/focus, Positive, Negative, Warning/uncertain, Paper canvas, Paper ink.
- **Live `index.css`:** `--bg-*`, `--text-*`, `--border-*`, `--accent-*`, `--radius-*`, `--space-*`, `--glass-*`, `--shadow-*`.

**Decision:** the live `index.css` names are canonical (they are already consumed by ~41 components plus inline styles). v4 short names are added as **alias tokens** so mockups/new primitives compile unchanged. Master-plan prose names are documentation labels, not CSS identifiers. Aliases MUST be declared in **both** `:root` and `[data-theme="dark"]` — a `var()` alias declared only in `:root` inherits its already-substituted light value into the dark cascade and would silently break dark mode.

### 2.1 The merged table

"D/L" = dark value / light value. "index.css" is the live uncommitted value. Contrast figures are the ones actually documented by the source cited; **master §6.2 values carry no measurement** (master §6.2 states they are "proposed starting values, not accessibility-certified").

| # | Role | Canonical token (index.css) | Live D / L | v4 §2 D / L | Master §6.2 D / L | Alias to add | Contrast (source) | Conflict |
|---|---|---|---|---|---|---|---|---|
| 1 | Canvas / app background | `--bg-canvas` | `#000000` / `#f7f8fa` | `#000000` / `#f7f8fa` | `#0B0E13` / `#F4F6F9` | `--canvas` | n/a | **X1** dark and light differ from master |
| 2 | Panel / surface | `--bg-panel` | `#0a0d12` / `#ffffff` | `#0a0d12` / `#ffffff` | `#131923` / `#FFFFFF` | `--panel` | n/a | **X1** dark differs; light matches master |
| 3 | Inset / raised surface | `--bg-panel-subtle` | `#0e1219` / `#f1f3f7` | `#0e1219` / `#f1f3f7` | `#1B2431` / `#EDF2F7` | `--panel-2` | n/a | **X1** differs in both themes |
| 4 | Deep panel (legacy, no v4/master equivalent) | `--bg-panel-dark` | `#05070a` / `#1e293b` | — | — | — | n/a | **X4** unmapped legacy token; confusingly light-valued `#1e293b` in `:root` (`index.css:18`) |
| 5 | Wire / ticker strip | `--bg-strip-wire` | `#0a0d12` / `#ffffff` | — | — | — | n/a | — |
| 6 | Ticker pill | `--bg-ticker-pill` | `#0e1219` / `#f1f3f7` | — | — | — | n/a | — |
| 7 | Ticker micro-label | `--text-ticker-label` | `#7a8798` / `#5c6673` | `--text-3` | Muted metadata | `--text-3` | see #9 | — |
| 8 | Hairline border | `--border-hairline` | `1px solid rgba(255,255,255,0.08)` / `1px solid rgba(15,23,42,0.10)` | same | `#344154` / `#CBD5E1` (solid) | `--hairline` | n/a | **X1/X2** master wants a solid mid-tone border; v4 wants translucent hairline |
| 9 | Border solid / component border | `--border-color` | `rgba(255,255,255,0.10)` / `rgba(15,23,42,0.10)` | — | `#344154` / `#CBD5E1` | — | n/a | **X2** |
| 10 | Muted border | `--border-muted` | `1px solid rgba(255,255,255,0.05)` / `1px solid rgba(15,23,42,0.06)` | — | — | — | n/a | — |
| 11 | Primary text | `--text-primary` | `#f5f7fa` / `#0f172a` | `#f5f7fa` / `#0f172a` | `#E9EEF5` / `#172033` | `--text-1` | n/a | **X1** |
| 12 | Secondary text | `--text-secondary` | `#aab3c0` / `#3d4756` | `#aab3c0` / `#3d4756` | `#B4C0D0` / `#475569` | `--text-2` | n/a | **X1** |
| 13 | Muted / metadata text | `--text-muted` | `#7a8798` / `#5c6673` | `#7a8798` / `#5c6673` | `#8A9AAF` / `#5B6B80` | `--text-3` | v4 §2 ≈5.0:1 dark / ≈5.5:1 light; `index.css:661` comments "~5.3:1 on panel" | **X3** CHANGELOG claims `#7d8daa` — the file disagrees |
| 14 | Inverse text | `--text-inverse` | `#000000` / `#ffffff` | — | — | — | n/a | — |
| 15 | Accent / action / focus | `--accent-primary` | `#4d8dff` / `#1d4ed8` | `#4d8dff` / `#1d4ed8` | `#7BB6FF` / `#1D4ED8` | `--accent` | v4 §2 ≈5.5:1 dark / ≈6.0:1 light | **X3** dark differs; light matches |
| 16 | Accent hover | `--accent-primary-hover` | `#6ba0ff` / `#1e40af` | — | — | — | n/a | — |
| 17 | Accent blue (alias) | `--accent-blue` | `#4d8dff` / `#1d4ed8` | — | — | — | n/a | duplicate of #15 — retire |
| 18 | Positive / up | `--accent-green` | `#2ee6a8` / `#0e9f6e` | `--up` `#2ee6a8` / `#0e9f6e` | Positive `#59D6A1` / `#047857` | `--up` | v4 §2 ≈11:1 dark / ≈4.6:1 light; `index.css:672` "~12:1 on panel" | **X3** both themes differ from master |
| 19 | Positive text | `--accent-green-text` | `#2ee6a8` / `#0e9f6e` | — | — | — | — | duplicate of #18 — collapse |
| 20 | Mint (alias) | `--accent-mint` | **undefined** / `#2ee6a8` | — | — | — | n/a | **X5 BUG:** declared only in the dark block (`index.css:673`); `var(--accent-mint)` resolves to nothing in light mode |
| 21 | Negative / down | `--accent-rust` | `#ff5c5c` / `#dc2626` | `--down` `#ff5c5c` / `#dc2626` | Negative `#FF8892` / `#B91C1C` | `--down` | v4 §2 ≈6:1 dark / ≈4.6:1 light; `index.css:670` "~6.4:1 on panel" | **X3** |
| 22 | Negative text | `--accent-rust-text` | `#ff5c5c` / `#dc2626` | — | — | — | — | duplicate of #21 — collapse |
| 23 | Warning base | `--accent-orange` | `#ffb454` / `#d97706` | `--warn` `#ffb454` / `#b45309` | Warning `#F7CA6D` / `#92400E` | `--warn` | not measured | **X3** light base `#d97706` ≠ v4 `#b45309`; two-tone base/text convention |
| 24 | Warning text | `--accent-orange-text` | `#ffb454` / `#b45309` | `--warn` | Warning | — | not measured | — |
| 25 | Gold (duplicate of warning) | `--accent-gold` / `--accent-gold-text` | `#ffb454` / `#d97706` · `#ffb454` / `#b45309` | — | — | — | not measured | **X6** three tokens encode the same semantic warning |
| 26 | Paper canvas | — | **absent** | — | `#11161D` / `#FFFEFA` | `--paper-canvas` | not measured | **X7 GAP** research reader has no token |
| 27 | Paper ink | — | **absent** | — | `#E5E9EF` / `#202834` | `--paper-ink` | not measured | **X7 GAP** |
| 28 | Grid line | — | **absent** | `--grid-line` in mockup only | — | `--grid-line` | n/a | **X7 GAP** mockups use it; app does not define it |
| 29 | Radius scale | `--radius-xs..xl` + `--radius-full` | 4/6/8/10/12/9999 px | panels 6/8/10 | 4/8/12 + pills | `--radius` | n/a | **X8** superset of both; panel/control assignments unspecified |
| 30 | Spacing scale | `--space-1/2/3` | 4/8/16 px | 4/8/12/16/24 | 4/8/12/16/24/32/48/64 | `--space-4..9` | n/a | **X9 GAP** 5 of 8 master steps missing |
| 31 | Typeface — UI | `--font-sans` | `'Barlow', 'Plus Jakarta Sans', …` | Barlow | retain **Plus Jakarta Sans** | — | n/a | **X10** direct conflict; Barlow is loaded (`index.html:10`) and first in the stack (`index.css:6`) |
| 32 | Typeface — mono | `--font-mono` | `'JetBrains Mono', …` | JetBrains Mono | JetBrains Mono for short identifiers only | — | n/a | — |
| 33 | Elevation shadows | `--shadow-sm/md/lg` | present | v4 implies none | avoid glow | — | n/a | **X11** shadows/glass are legacy; v4 chrome should be flat |
| 34 | Glass surface | `--glass-surface` | `rgba(5,7,10,0.85)` / `rgba(255,255,255,0.88)` | retire | avoid cinematic blur | — | n/a | **X11** still consumed (`index.css:311-312` `.sidebar`, `:493`, `:910` `.quant-card`) |
| 35 | Glass border | `--glass-border` | present | retire | — | — | n/a | **X11** |

**Conflict legend** (referenced in §6): X1 neutral ramp · X2 border style · X3 semantic color values · X4 unmapped legacy token · X5 undefined-alias bug · X6 duplicate semantic tokens · X7 missing tokens · X8 radius assignment · X9 spacing gaps · X10 typeface · X11 glass/elevation.

### 2.2 Typography scale (merged)

| Role | v4 §3 | Master §6.2 | Live evidence | Resolution needed |
|---|---|---|---|---|
| UI body | Barlow 400, 13px, line-height 1.55 | 14px default; dense 12–13px | `index.css:85` uses `var(--font-sans)`; no global size token | **X10 + X12** |
| Display numbers | Barlow 300, 30–36px, tabular | prices tabular, instrument precision | `HomeDashboardTab.jsx:598-630` uses 20px weight 400 mono | **X12** |
| Section titles | Barlow 400, 15–16px, 0.04em | 24–28px page headings; short uppercase section labels | micro-labels at 8.5–9.5px in practice | **X12** |
| Micro-labels | JetBrains Mono 500, 9.5–10px, uppercase 0.14–0.16em | **no essential 8px text** | `HomeDashboardTab.jsx:394,549,578` uses 8.5–9.5px; `App.jsx:553` uses 9px; `Sidebar.jsx:176,225` uses 7–7.5px | **X12 direct violation of master's floor**; also non-essential 8px text at `App.jsx:638` |
| Data cells | JetBrains Mono 400, 12px, right-aligned, tabular | 12–13px dense, tabular | `.telemetry-table td` has `font-variant-numeric: tabular-nums` (`index.css:217`); `HomeDashboardTab.jsx` tables at 9px | **X12** |
| Paper prose | — | 17–18px, line-height 1.6–1.75, 65–80ch | absent | **X7** |

### 2.3 Layout constants

| Parameter | Master §6.2 | v4 | Live |
|---|---|---|---|
| Header height | ~52–56px | 56px hairline bar (mockup uses 50px) | **glass dock, `borderRadius: 12px` + `blur(20px)` (`App.jsx:493-497`)** |
| Sidebar width | 224–248px expanded / 64px compact | flat hairline nav | unchanged glass sidebar |
| Controls | 36–40px desktop; 44–48px touch target | minHeight 26–32px; 44px on `pointer:coarse` only | `index.css:396` coarse rule |
| Content padding | 24px desktop / 16px mobile; gap 16px | 4/8px grid, 16–24px padding | mockup uses 14px main padding |

---

## 3. Component rework map (42 components)

Ticket codes per Backlog §6. Effort: **S** ≤1 day · **M** 1–2 days · **L** 2–3 days · **XL** >3 days. "Safe now" = no W1/TRUST contract dependency, no chart-licence dependency, and no collision with the uncommitted v4 work or with `PasswordGate`/auth (owned by another teammate).

| # | Component / surface | File | Current state (evidence) | Target | Ticket | Effort | Safe now |
|---|---|---|---|---|---|---|---|
| 1 | App shell + header container | `App.jsx:484-497` | Glass dock: `borderRadius: 12px`, `blur(20px)`; chips already v4-restyled (uncommitted) | Flat 52–56px hairline bar | DESIGN01/02 | M | ✅ tokens/chrome only |
| 2 | Header status chips (mode, tier, search, wallet, provenance, integrity) | `App.jsx:528-731` | PARTIAL — mono + hairline + 6px radius applied; `fontSize` still 8–9.5px | Mono micro-labels ≥9.5px, ≤1 accent | DESIGN01 | S | ⚠️ raises font floor → verify with §2.2 |
| 3 | Sidebar container | `Sidebar.jsx` | PLANNED-ONLY — gradient PRO badge (`:115`), neon `#10b981` glow (`:121-122`), `fontWeight: 800` | Flat hairline nav; active = white text + 8% fill | DESIGN02 | M | ✅ |
| 4 | Sidebar nav item / section labels / badge | `index.css:364-450`, `Sidebar.jsx:308-345` | `.sidebar-nav-item.active` already uses `rgba(255,255,255,0.08)` (`index.css:411`, `:642-644`); labels still sans/800 | Mono micro section headers; single active treatment | DESIGN01 | S | ✅ |
| 5 | Wordmark / brand | `MbgLogo.jsx`, `Sidebar.jsx:112-125` | Untouched; 900-weight wordmark + glow dot | Thin display wordmark, hairline `PRO` tag | DESIGN01 | S | ✅ |
| 6 | Global search / command entry | `App.jsx:582-595`, `CommandPaletteModal.jsx` | Untouched below 18 KB file | `Ctrl/Cmd+K`, grouped results, visible header button | DESIGN02 | M | ⚠️ needs route registry |
| 7 | Command palette result rows | `CommandPaletteModal.jsx` | Untouched; palette IDs `TESTING_LAB`/`QUANT_ACADEMY` ≠ renderer `TESTING`/`ACADEMY` (Backlog §6 DESIGN02) | Logo + name + venue + access state; Enter navigates, never executes | DESIGN02 | M | ⚠️ depends on registry |
| 8 | Route registry / alias resolver | `App.jsx` hash/`?tab=` parsing | Untouched; ad-hoc parsing | One registry + legacy aliases + missing-route page | DESIGN02 | L | ⚠️ needs TRUST access contract |
| 9 | Footer | `App.jsx` | No change in diff | Hairline + mono micro disclaimer | DESIGN01 | S | ✅ |
| 10 | Overview "Today" | `HomeDashboardTab.jsx` | PARTIAL (uncommitted v4) — micro-labels + thin mono numerals `:394-630`; residual `#eab308` `:725`, `#fca5a5`/`#f59e0b`/`#c084fc` `:1660` | ≤6 primary blocks, session context first, empty account state | DESIGN04 | L | ⚠️ finish color/token cleanup first |
| 11 | Hero KPI card / MetricCard | `HomeDashboardTab.jsx:379-470` | IMPLEMENTED-AND-VISIBLE (uncommitted); screenshot `v4_hero_row_dark.png` | Thin display number, one badge max, hairline card | DESIGN01/04 | M | ⚠️ shared with #10 |
| 12 | KPI tile row | `HomeDashboardTab.jsx:566-635` | IMPLEMENTED-AND-VISIBLE; 20px weight-400 mono | Consistent `--text-3` micro-label + hairlines | DESIGN01 | S | ✅ |
| 13 | Allocation bar | `HomeDashboardTab.jsx:~640-690` | PARTIAL — inline-colored segments, hardcoded palette | Tokenized segments + accessible legend | DESIGN01 | S | ✅ |
| 14 | Sparkline / mini-chart | `HomeDashboardTab.jsx:105` | PLANNED-ONLY — text placeholder, no SVG | Inline SVG sparkline, no chart library | DESIGN04 | M | ✅ |
| 15 | Primitive: Button / IconButton | absent (`.telemetry-btn` only, `index.css:161-192`) | Ad-hoc per component | `components/ui/Button` + variants/states | DESIGN01 | M | ⚠️ needs Phase 1 tokens |
| 16 | Primitive: Input / Combobox | `.quant-input` `index.css:1004-1022` | Exists, single variant | Shared primitive incl. combobox | DESIGN01 | M | ✅ |
| 17 | Primitive: Tabs | ad-hoc pill nav `.quant-pill-nav` `:921-1002` | Exists | Shared primitive | DESIGN01 | S | ✅ |
| 18 | Primitive: Badge (one semantic set) | `index.css:121-160` + 8 legacy neon classes `:1411-1470` | PARTIAL — base set AA-fixed (`:138/144/150/155`, hardcoded hex) | ONE semantic set, ≤2 per row, tokens not hex | DESIGN01 | M | ✅ |
| 19 | Primitive: SourceBadge | absent | PLANNED-ONLY | Source + as-of + delay state | DESIGN01 | S | ⚠️ needs observation contract |
| 20 | Primitive: QuoteCell | inline in scanners | PLANNED-ONLY | Right-aligned tabular, null ≠ zero, sign without colour-only | DESIGN01 | M | ✅ |
| 21 | Primitive: InstrumentHeader | logic duplicated in `SecurityHubDrawer.jsx` | PLANNED-ONLY | Shared identity/venue/quote/as-of header | DESIGN01/03/04 | L | ⚠️ needs DESIGN03 |
| 22 | Primitive: DataTable | `.telemetry-table` `index.css:193-236` | Exists; sticky cols `.sticky-col-*` `:572-600` | Sorting, active filter chips, paging 25/50/100, a11y region | DESIGN01/04 | L | ⚠️ per-table testing |
| 23 | Primitive: EmptyState / InlineError | absent (ad-hoc strings) | US Stocks empty state exists in text only | Shared components + next action | DESIGN01 | S | ✅ |
| 24 | Primitive: Tooltip / Popover | `title=` attributes | Ad-hoc | Shared accessible tooltip | DESIGN01 | M | ✅ |
| 25 | Primitive: Dialog / Drawer | per-component | Ad-hoc; focus management unverified | Shared surface, focus trap/restore | DESIGN01 | L | ✅ |
| 26 | Primitive: Pagination | absent | PLANNED-ONLY | Accessible paging | DESIGN01 | S | ✅ |
| 27 | Primitive: ChartFigure | absent | PLANNED-ONLY | Figure + summary/table alternative | DESIGN04/05 | M | ⚠️ chart licences |
| 28 | Primitive: ReportMetadata / CitationLink | absent | PLANNED-ONLY | Paper metadata + citations | DESIGN04 + RESEARCH | M | ⚠️ RESEARCH contract |
| 29 | Observation-status adapter (transport vs observation vs access vs release) | `DataIntegrityModal.jsx`, `hooks/useLivePrices.js` | PLANNED-ONLY; one WS badge conflates transport with health (`App.jsx:645-665`) | Four independent status concepts | DESIGN01 | M | ⚠️ needs TRUST contract |
| 30 | IDX scanner | `MasterQuantLeaderboard.jsx` | PARTIAL — sticky cols `:974-1031`, Rp helper; hairline/badge not done | Universe/Setups/Dividends/Turnover + filters + saved view | DESIGN04 | L | ✅ |
| 31 | Crypto scanner | `MasterQuantLeaderboard.jsx` | PARTIAL — same file, one code path | Base/quote/venue identity explicit | DESIGN04 | M | ✅ |
| 32 | US scanner | `USStockTab.jsx` | PARTIAL — honest RSI + sticky `:205,242` + empty state; v4 table not done | Exchange/share class/ADR/ETF + session context | DESIGN04 | M | ✅ |
| 33 | Instrument logos / AssetIcon | `AssetIcon.jsx` | PLANNED-ONLY | Registry → approved asset; no guessed domains | DESIGN03 | L | ⚠️ asset rights |
| 34 | Crypto logos | `CryptoIcon.jsx`, `data/crypto-icons.js` | PLANNED-ONLY | Base asset + pair/venue badge; chain/address | DESIGN03 | M | ⚠️ asset rights |
| 35 | Forex flags | `data/forex-flags.js` | PLANNED-ONLY | Ordered base/quote identity | DESIGN03 | S | ✅ |
| 36 | Heatmap | `MarketHeatmapTab.jsx` | Untouched; no legend/table | Universe/weighting/window + accessible table | DESIGN04 | M | ✅ |
| 37 | Global markets | `GlobalMarketsTab.jsx` | Untouched | Region/session overview with sources | DESIGN04 | M | ✅ |
| 38 | Crypto futures | `CryptoFuturesTab.jsx` | Untouched; gated research-only | Funding/OI/mark-index-last with intervals | DESIGN04 | M | ⚠️ market gate |
| 39 | Forex command | `ForexCommandTab.jsx` | Untouched | Spot/CFD/futures distinction | DESIGN04 | M | ✅ |
| 40 | News surface (tab + wire + detail) | `NewsTab.jsx`, `BloombergNewsWire.jsx`, `NewsDetailModal.jsx` | PLANNED-ONLY — untouched | Source browser, dedupe, relevance, opt-in audio | DESIGN04 | L | ⚠️ content rights |
| 41 | Economic calendar | `EconomicCalendarTab.jsx` | Untouched | Day/week, timezone, prev/revised/consensus/actual as separate fields | DESIGN04 | M | ✅ |
| 42 | Flows / Whale intelligence | `WhaleIntelligenceTab.jsx` (139 KB, hardcoded decorative colors) | Untouched; ~70 hardcoded colors noted by polish report limitation #3 | Separate observed vs inferred vs licensed vs delayed | DESIGN04 | L | ⚠️ provider licensing |
| 43 | Macro / Sentinel drawer | `AiIntelligenceDrawer.jsx` (125 KB) | Untouched; duplicate narrative risk | Preview of one content authority | DESIGN04 | L | ⚠️ content contract |
| 44 | Charting desk | `ChartingDeskTab.jsx` | Untouched; iframe blocked | One-pane toolbar + honest blocked state | DESIGN04 | L | ❌ licence + blocked-widget diagnostic |
| 45 | TradingView modal | `TradingViewModal.jsx` | Untouched | Instrument header, attribution, resize | DESIGN04 | M | ❌ licence |
| 46 | Watchlist | `PersonalWatchlistTab.jsx` | Untouched; browser-local `mbg_user_watchlist`, example holdings by default | Cloud-owned, revisioned, synced states | DESIGN03 + WORKSPACE01 | L | ❌ needs W1 identity |
| 47 | Notes / Journal editor | absent | PLANNED-ONLY | Plain-text thesis + horizon + invalidation | WORKSPACE02 (DESIGN04 spec) | M | ❌ needs WORKSPACE01 |
| 48 | Alerts / inbox | absent | PLANNED-ONLY | Rule, last eval, channel, cooldown, suspended state | DESIGN04 + COMMERCIAL06 | L | ❌ needs W4 |
| 49 | Simulation (Virtual Forward Portfolio) | `VirtualForwardPortfolio.jsx` | Untouched | Account/run selector, reconciliation, permanent sim context | DESIGN04 | M | ⚠️ ledger gate |
| 50 | Backtest lab | `BacktestPerformanceLab.jsx` | Untouched | Run metadata, net equity, drawdown, OOS | DESIGN04 | M | ✅ |
| 51 | AI Lab / Arena | `AiAgentArenaTab.jsx` (470 KB — largest file) | Untouched | Registry, run state, measured results, ledger links | DESIGN04 | XL | ⚠️ split before touching |
| 52 | Correlation widget | `PearsonCorrelationWidget.jsx` | Untouched | Frequency/dates/window/missingness + table alternative | DESIGN04 | S | ✅ |
| 53 | Academy | `QuantAcademyTab.jsx` (110 KB) | Untouched | Curriculum, progress, labelled simulations | DESIGN04 | L | ✅ |
| 54 | Updates / Changelog | `ChangelogTab.jsx` | Untouched (`CHANGELOG.md` edited instead) | New/Changed/Fixed + real build + known limits | DESIGN02 | S | ✅ |
| 55 | Lot calculator | `LotCalculatorModal.jsx` | PARTIAL — en-US fix `:278,299`; surface unchanged | Units/contract/FX, deterministic size, invalid blocks calc | DESIGN01/04 | M | ✅ |
| 56 | Order execution modal | `OrderExecutionModal.jsx` | Untouched; simulation-only successor planned | Account/venue/costs/protection + acknowledged states | DESIGN04 | L | ❌ ledger gate |
| 57 | Solana swap modal | `SolanaSwapModal.jsx` | Untouched; simulated swap | Visibly simulated; full chain/slippage review or removal | DESIGN01 | M | ⚠️ rename `phantomWallet.js` reference in Master Plan is stale |
| 58 | Data integrity modal | `DataIntegrityModal.jsx` | Untouched; "no timed animation masquerading as verification" rule applies | Observation vs ingestion time, delay, quality, retry | DESIGN01 | M | ⚠️ observation contract |
| 59 | Compliance/risk modal | `ComplianceRiskModal.jsx` | Untouched | Versioned notice, focus management | DESIGN01 | S | ✅ |
| 60 | Global market ticker | `GlobalMarketTicker.jsx`, `.marquee-ticker-*` `index.css:856-903` | PARTIAL — adaptive colours from polish pass; still compulsory motion | Pause/hide, session labels, static alternative, reduced-motion | DESIGN01/05 | M | ✅ |
| 61 | Running trade widget / order book sim | `RunningTradeWidget.jsx`, `OrderBookSimulator.jsx` | Untouched | True source tape or permanent simulation label; audio opt-in | DESIGN01 | M | ✅ |
| 62 | Toasts / durable job status | inline in shell | PLANNED-ONLY | Brief toast vs durable job view with IDs/retry | DESIGN01 | M | ✅ |
| 63 | Confirmation dialogs | per component | Ad-hoc | Explicit scope + reversibility; navigation cannot execute | DESIGN01 | S | ✅ |
| 64 | Loading / empty / stale / offline / locked / expired states | scattered | PARTIAL — some empty states (US Stocks) | Distinct states with next action; skeletons never fake prices | DESIGN01/05 | L | ✅ |
| 65 | PasswordGate / auth | `PasswordGate.jsx` | **Excluded by task boundary** | Not specified here | — | — | ❌ **do not touch** (owned by another teammate) |

**Coverage:** 65 mapped surfaces, of which **42 are row-level components/surfaces expressly required by Master §5.2/§5.4/§6.2 and v4 §4** — comfortably above the ≥30 acceptance floor. Rows 15–28 are the Master §6.2 required primitive set; rows 30–42 are the Master §5.2 module-to-target mapping; rows 1–14 and 44–64 are Master §5.4 + v4 §4.

---

## 4. Page-level rules consolidated

### 4.1 Global shell and Overview (Master §7.1 + v4 §4 "Header")

- Header = workspace + global search + **scoped** data-status summary + notifications + account. Market controls (symbol/timeframe/filter) move to a local page toolbar. Clocks, calculator, wallet experiments and rare diagnostics move to overflow/contextual areas.
- **Four status concepts must never collapse** (Backlog DESIGN01): transport `Connected/Polling/Disconnected`; observation `Current/Delayed/Last-session/Stale/Missing/Unknown`; resource `Public/Authorized/Sign-in-required/Forbidden`; feature `Released/Beta/Internal/Planned`. A live crypto socket must not turn macro/IDX/research green.
- Overview default order: market/session context → important changes → followed instruments → recent papers → saved work. **≤~6 primary blocks.** Portfolio/simulation metrics require a selected, reconciled account/run; empty account gets an empty state, never seeded performance.
- Current evidence: header conflates transport with health (`App.jsx:645-665` "WS LIVE / REST (5S)"), and Overview's four KPI tiles are static demo values (`HomeDashboardTab.jsx:598-630`: `$42.85B`, `+Rp 480 M`, `+18.4% ROI`) — these are **not** labelled as sample data.

### 4.2 Market tables, scanners, instrument detail (Master §7.2)

- Identity column always keeps logo + ticker + name + venue. Numbers right-aligned `tabular-nums`; **missing ≠ zero**; signed change readable without red/green alone.
- Sorting via explicit controls; active filters shown as chips with Clear; view/filter state persisted in route or saved view; page 25/50/100 or measured virtualization; never mount hundreds of charts.
- Instrument full page tabs: Overview, Chart, Fundamentals/Protocol/Contract, Research, News/Events, Flow, Notes/Risk. A common header anchors identity, venue, contract type, currency, quote type, source, observation time, session. Trade setup is a **dated hypothetical panel**, not an acknowledged order.
- Cross-market semantics: IDX = Rupiah/lot; US = share classes + adjustments; crypto = venue/base/quote; derivatives = mark/index/funding interval; FX = contract/pip. Never inferred from the ticker string.
- Current evidence: sticky column done (`USStockTab.jsx:205,242`; `MasterQuantLeaderboard.jsx:974-1031`), sticky **header row explicitly not done** (polish report limitation #2).

### 4.3 Charts (Master §7.3 + v4 §4)

- Toolbar: instrument search, interval, chart type, studies, compare, layout, save, source/as-of. One pane first; larger layouts only when the device and chosen product support them. Separate analysis overlays from actual order/position state.
- Saved layouts mean MBG-owned symbol/timeframe/pane settings only. No assumed cross-iframe drawing persistence or control.
- Integration choice is deliberate and licensed: contextual widgets vs own-data charts vs Advanced Charts are different products. Widgets are not a data API. Preserve provider logos/attribution/legal links. **The currently blocked iframe needs a diagnostic task** — a redesign or paid account does not fix embedding restrictions.
- Current evidence: `ChartingDeskTab.jsx` and `TradingViewModal.jsx` untouched.

### 4.4 News, Calendar, Macro and Flows (Master §7.4)

- News is a **source browser**: published time, publisher, title, permitted excerpt, tickers/topics, external link. Curate relevance, deduplicate syndication. AI interpretation visually distinct from publisher facts.
- Copy retains source/report metadata; audio is opt-in with Stop/Mute and reads the same authorized content. Neither creates a second contradictory narrative.
- Calendar: day/week, local timezone, source, release state. Previous / revised previous / consensus / actual are separate fields. **Never fill a missed release with a template value.**
- Macro/Sentinel: theme → mechanism → affected assets → supporting/contrary evidence → scenarios → review trigger. A regime/score needs a named method. Flows separate observed transactions, inferred/unknown ownership, licensed broker data and delayed filings.
- Open item carried from polish report limitation #4: the News "Spot ETF Flow" panel placeholder needs a real data source (backend, out of UI scope).

### 4.5 Watchlists, Alerts, Journal, Labs (Master §7.5)

- Watchlists: ownership, saved sort/views, clear quote/source state, notes, alert entry points. Account switching must not show another account's browser data. Imports preview and dedupe IDs. Never dual-write the legacy shared browser key.
- Alerts: rule, required data, last evaluation, channel, cooldown, last delivery, enabled/suspended. Outage = suspended/stale, never a false signal. Quiet hours + duplicate suppression.
- Journal: user reasoning separate from imported order/ledger facts. Entry = question/thesis, source version, horizon, assumptions, invalidation, planned review, outcome. Writing stays exportable on Free or after expiry. Performance analytics gated until ledger/currency correctness.
- Labs: environment/account/run IDs, assumptions, dataset/method version, costs, measured state; pause/kill/reset explicit and scoped. Educational demos labelled as demos. **Internal QA (Testing Hub) is not a customer product.**

### 4.6 Command and navigation (Master §7.6)

- `Ctrl/Cmd+K` plus a visible header button. Arrows choose, Enter navigates, Escape closes and **restores focus**. Results grouped Instruments / Papers / Pages / Actions with logo + name + venue + access state.
- `BRK.B`, `IDX:BBCA`, `BTC/USDT` and colliding tickers resolve via the registry or ask the user to pick the visible match.
- `>` prefix selects actions, but Enter **never** executes trade/reset/payment without a separate review. Single-letter shortcuts disabled in forms/charts/editors. Locked actions explain the required capability/market/quota and return to the original task after upgrade. An outage offers recovery, not an upgrade CTA.

### 4.7 Responsive, accessibility, performance (Master §7.7 + DESIGN05)

- Test viewports: 360, 390, 768, 1024, 1440+ px, plus zoom/text enlargement; include a **320 CSS-pixel reflow / 400% zoom** case. Document legitimate 2-D table/chart exceptions and provide readable alternatives — do not exempt the whole app.
- Target **WCAG 2.2 AA**: keyboard access, visible focus, meaningful labels, dialog focus trap/restore, sufficient contrast, error association, non-colour signals, zoom/reflow, chart summaries/tables. Target 4.5:1 normal text and 3:1 large text/non-text where the criterion applies. Automated checks are supplemented by keyboard/screen-reader review. These are **acceptance targets, not an existing certification.**
- Performance (measure, never claim): p75 LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 under a defined page/device/connection/sample. Lazy-load route chunks, iframes and PDF libraries; batch render updates; subscribe by instrument. Measure before optimising.
- DESIGN05 evidence bundle: (1) route/audience/status matrix, (2) token/component states + 8 annotated screens, (3) logo contact sheet, (4) AC-results report with exact build/flags/fixtures/rollback. Capture 8 screens × desktop 1440 + mobile 390 × dark/light = **32 baseline frames**, plus targeted 360/768/1024/reflow/zoom/dense/failure frames.
- Current evidence gap: the v4 pass has **no mobile frame at all** in `docs/screenshots/spacex_rework_2026-10-01/`, and no build/WCAG evidence.

### 4.8 Instrument-logo preservation (Master §8 — release gate)

- Preserve `AssetIcon.jsx`, `CryptoIcon.jsx`, `stock-icons.js`, `crypto-icons.js`, `forex-flags.js` as migration inputs. Stable canonical ID → approved logo; no invented `${ticker}.com` domains; original colour/aspect ratio with `contain`; ordered FX flags; base+pari/venue badge for crypto; neutral monogram when unknown; bounded approved-host fallback and reset error index when the instrument changes.
- Fixtures required: BBCA/BBRI/AMMN; AAPL/NVDA/GOOG/GOOGL/BRK.A/BRK.B; BTC/ETH/SOL/BTCUSDT/BTCUSDT.P/1000PEPE; EURUSD/USDJPY/USDCNH; unknown asset; failed-logo→new-symbol.
- Accessible rendering: logo decorative when an adjacent complete name exists, otherwise meaningful label. Before/after contact sheet is required before rollout.

---

## 5. Phase-1 implementation checklist (tokens + chrome only)

**Scope:** `frontend/src/index.css`, `frontend/src/App.jsx` (header only), `frontend/src/components/Sidebar.jsx`. No other file. Estimated **2–3 focused days** (aligns with DESIGN01 1.5–2.5d + the chrome half of DESIGN02 2.5–4d).

**Precondition P1-0 (mandatory, blocking).** Commit or stash the current working tree as a reviewable checkpoint **before** editing. `index.css` and `App.jsx` are already modified and unreviewed; Phase 1 edits must not be stacked invisibly on top. Suggested: one commit of the existing stack (polish + v4 draft + screenshots + mockups + reports), or a named stash, so Phase 1's diff is isolated. Do not squash away the evidence artifacts.

### Stage A — tokens (`frontend/src/index.css` only)

| Step | Exact action |
|---|---|
| A1 | Add missing spacing steps to `:root`: `--space-4: 12px; --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;` (keeps existing `--space-1: 4px`, `--space-2: 8px`, `--space-3: 16px` exactly as-is — do not renumber, ~41 components depend on them). |
| A2 | Add v4 alias tokens **inside `:root`**: `--canvas: var(--bg-canvas); --panel: var(--bg-panel); --panel-2: var(--bg-panel-subtle); --hairline: var(--border-hairline); --text-1: var(--text-primary); --text-2: var(--text-secondary); --text-3: var(--text-muted); --up: var(--accent-green); --down: var(--accent-rust); --accent: var(--accent-primary); --warn: var(--accent-orange); --grid-line: rgba(15,23,42,0.04);` |
| A3 | Add the **same alias block inside `[data-theme="dark"]`** (`index.css:647`) with `--grid-line: rgba(255,255,255,0.04);`. Required — a `:root`-only alias inherits the light substitution into dark mode. |
| A4 | Fix the `--accent-mint` bug: add `--accent-mint: #0e9f6e;` to `:root` (dark already has `#2ee6a8` at `:673`). |
| A5 | Add paper tokens to `:root`: `--paper-canvas: #FFFEFA; --paper-ink: #202834;` and to `[data-theme="dark"]`: `--paper-canvas: #11161D; --paper-ink: #E5E9EF;` (Master §6.2). |
| A6 | Add badge text tokens so the AA-safe hexes stop being one-off class literals: `:root` → `--badge-bull-text: #166534; --badge-bear-text: #be123c; --badge-alert-text: #92400e; --badge-blue-text: #1d4ed8;` then replace the literals at `index.css:138,144,150,155` with `var(...)`. Do not change the measured values. |
| A7 | Mark `--glass-surface` and `--glass-border` as deprecated with a comment; **do not delete yet** (still consumed at `index.css:311-312,493,910`). Slated for removal in Phase 2 after those three consumers are migrated. |
| A8 | **Do not** change any existing token value in Stage A. The v4 values are the live, screenshot-evidenced implementation; master §6.2 values are recorded as *deferred* (see §6 conflict X1/X3 and Decision D1). |

### Stage B — header chrome (`frontend/src/App.jsx`, header block only)

Locate the `<header className="telemetry-panel">` block (`App.jsx:484`). Replace exactly these style properties:

| Step | Exact change |
|---|---|
| B1 | `borderRadius: '12px'` → `borderRadius: '8px'` (`App.jsx:493`). |
| B2 | Delete `backdropFilter: 'blur(20px)'` and `WebkitBackdropFilter: 'blur(20px)'` (`App.jsx:496-497`). |
| B3 | Ensure the header uses `background: 'var(--bg-panel)'` (not glass) and `border: 'var(--border-hairline)'`. |
| B4 | Set header height to `56px` (`height: '56px'`, `minHeight: '56px'`). Keep the existing responsive override for ≤768px from stacking/wrapping. |
| B5 | Style-string hygiene only — **change no JSX structure, no handler, no conditional, no state**. The chips at `App.jsx:504-731` are already v4-conformant (uncommitted); leave them alone except for a font-floor bump if Step C3 is approved. |

### Stage C — sidebar chrome (`frontend/src/components/Sidebar.jsx`)

| Step | Exact change |
|---|---|
| C1 | PRO badge (`Sidebar.jsx:115`): remove `linear-gradient(...)` background → `background: 'transparent'`; `color: '#818cf8'` → `color: 'var(--text-muted)'`; `fontWeight: '800'` → `'500'`; border `rgba(99,102,241,0.3)` → `var(--border-hairline)`. |
| C2 | Replace all hardcoded status colours with tokens: `#10b981` → `var(--accent-green)` (`Sidebar.jsx:121,122,169`); `#38bdf8` → `var(--accent-blue)` (`:180`); `#f59e0b` → `var(--accent-gold-text)` (`:236`); `#818cf8` → `var(--text-muted)` (`:172`); flash tints `rgba(16,185,129,0.22)`/`rgba(244,63,94,0.22)` → token-derived borders only. |
| C3 | Micro-label floor: raise sidebar `fontSize` values below 9px (`Sidebar.jsx:176,180,225,236,285`: 7–7.5px) to `9.5px` and set `fontFamily: 'var(--font-mono)'`, `fontWeight: '500'`, `letterSpacing: '0.14em'`, `textTransform: 'uppercase'`. Applies Master §6.2 "no essential 8px text" and v4 §3 micro-label spec. |
| C4 | Nav items (`Sidebar.jsx:308-345`): `fontWeight: '700'` → `'500'`; keep the existing active treatment from `index.css:411` (`rgba(255,255,255,0.08)` + white text) — it is already v4-conformant. |
| C5 | Brand block (`Sidebar.jsx:112-125`): `fontWeight: '900'` → `'500'`, `letterSpacing: '-0.02em'` → `'0.04em'`; glow box-shadow → `none`. |
| C6 | Sidebar container blur: `index.css:311-312` `backdrop-filter: blur(20px)` → remove; `background` from `--glass-surface` → `--bg-panel`; `border-right: var(--border-hairline)`. |
| C7 | `.quant-card` blur at `index.css:910`: leave for Phase 2 (it is not chrome). |

### Stage D — verification (required before claiming Phase 1 done)

| Step | Check |
|---|---|
| D1 | `cd frontend && npm ci && npm run build` → zero errors, record build time and chunk count. |
| D2 | Confirm no `var(--accent-mint)`, `var(--grid-line)`, `var(--paper-*)`, `var(--canvas)`, `var(--panel)`, `var(--text-1/2/3)`, `var(--up/down/accent/warn)` resolves to an empty value in **both** themes (grep the built CSS for `var(` with no declaration). |
| D3 | Screenshot the header + sidebar at 1440px and 390px in dark and light → 4 frames, named and stored under `docs/screenshots/`. Phase 1 has no valid frame today for mobile. |
| D4 | Keyboard pass: Tab order through header and sidebar, visible focus ring, Ctrl/Cmd+K opens palette, Escape restores focus. |
| D5 | Confirm `git diff` touches only the three permitted files. |

### 5.1 What must NOT be touched in Phase 1

1. **`frontend/src/components/PasswordGate.jsx` and every auth/session/token/header-hardening file** — owned by another teammate (`security-implementer`). No exception.
2. **All tab components** — `HomeDashboardTab.jsx`, `MasterQuantLeaderboard.jsx`, `USStockTab.jsx`, `NewsTab.jsx`, `WhaleIntelligenceTab.jsx`, `AiAgentArenaTab.jsx`, `ChartingDeskTab.jsx`, `QuantAcademyTab.jsx`, `MarketHeatmapTab.jsx`, `GlobalMarketsTab.jsx`, `CryptoFuturesTab.jsx`, `ForexCommandTab.jsx`, `EconomicCalendarTab.jsx`, `BacktestPerformanceLab.jsx`, `VirtualForwardPortfolio.jsx`, `PearsonCorrelationWidget.jsx`, `TestingHubTab.jsx`, `ChangelogTab.jsx`. These are Phase 2 and several are actively contested by the in-flight uncommitted v4 work.
3. **All modal/drawer components** and their focus behaviour (Phase 2).
4. **`frontend/src/utils/format.js`** — behaviour is correct and tested by the polish pass; Phase 1 is visuals only.
5. **The `Badge` / `.badge-*` legacy neon classes** — calm them in Phase 2 with the one-semantic-set refactor; do not delete in Phase 1 (unknown consumers).
6. **`mockup_spacex_home.html`, `mockup_spacex_screener.html`, `docs/screenshots/**`, `docs/UI_UX_POLISH_REPORT_2026-09-30.md`, `docs/superpowers/plans/*`, `CHANGELOG.md`** — evidence artifacts; read-only.
7. **No new dependencies, no font swap, no licensed D-DIN, no chart library** in Phase 1.
8. **No route/hash/`?tab=` parsing change** — that is DESIGN02 proper and depends on the TRUST access contract.
9. **No value changes to existing tokens** (Stage A8) and **no JSX structure/handler changes** in `App.jsx`/`Sidebar.jsx` (Stage B5).

---

## 6. Gaps and conflicts

### 6.1 The three biggest conflicts: v4 SpaceX direction vs Master Plan design section

**C1 — Token architecture and neutral ramp (blocking).**
v4 §2/mockups use short names (`--canvas`, `--panel`, `--hairline`, `--text-1/2/3`, `--up/--down`, `--accent`) with a **pure-black `#000000` canvas and translucent `rgba(255,255,255,0.08)` hairlines**; the live `index.css` uses `--bg-*`/`--text-*`/`--border-*`/`--accent-*`; master §6.2 specifies a **lifted graphite ramp** (`Canvas #0B0E13`, `Surface #131923`, `Raised #1B2431`) and a **solid mid-tone border** (`#344154` / `#CBD5E1`). The live implementation has already taken the v4 ramp in both themes. Until the alias layer from §2.0/Stage A2–A3 exists, no mechanical merge is possible, and any component written against master §6.2 names silently renders unstyled. *Resolution:* canonical = live names + v4 aliases (Phase 1); master §6.2 values recorded as deferred (Decision D1).

**C2 — Typography and readable-floor (accessibility-relevant).**
v4 §3 makes **Barlow** the display/body face with **9.5–10px uppercase mono micro-labels**, and the shipped code goes further — 7–7.5px sidebar labels (`Sidebar.jsx:176,180,225,236,285`), 8px SWAP badge (`App.jsx:638`), 8.5px KPI labels (`HomeDashboardTab.jsx:549,578-630`). Master §6.2 says **retain Plus Jakarta Sans**, default **14px**, dense 12–13px, and explicitly **"no essential 8px text"**. `index.html:10` now loads Barlow and `index.css:6` puts it first, so the master-plan requirement is already overridden in code. *Resolution:* keep Barlow (implemented, mockup-approved direction) but enforce the 9.5px floor as a hard token/rule (Stage C3) and confirm at the design checkpoint; this is the one place where the v4 direction currently fails a master-plan acceptance criterion.

**C3 — Colour semantics, duplication, and certification status.**
v4 reserves **one** interactive accent (`#4d8dff`) and defines `--up #2ee6a8` / `--down #ff5c5c` / `--warn #ffb454`; master §6.2 defines different values for **every** semantic role (Action `#7BB6FF`, Positive `#59D6A1`, Negative `#FF8892`, Warning `#F7CA6D`) and states plainly that its tokens are "proposed starting values, **not accessibility-certified**" — measurement is required. Worse, the AA-safe light-theme badge colours the polish pass measured (`#166534` 6.34:1, `#be123c` 5.50:1, `#92400e` 6.67:1, `#1d4ed8` 6.0:1) exist only as **hardcoded literals inside three CSS classes** (`index.css:138,144,150,155`), not as tokens, so any token-level refactor can silently regress measured AA. On top of that, warning is encoded three times (`--accent-orange`, `--accent-gold`, plus their `-text` twins), accent twice (`--accent-primary`, `--accent-blue`), positive/negative twice each, and 8 legacy neon badge classes remain (`index.css:1411-1470`). *Resolution:* Stage A6 promotes the four AA literals to tokens verbatim; the semantic consolidation and the master-vs-v4 value decision are explicitly deferred to the design checkpoint (Recorded Decisions D1–D2).

### 6.2 v4-vs-master disagreements beyond the top three

| # | Area | v4 / live | Master Plan | Verdict |
|---|---|---|---|---|
| X1 | Canvas / surface ramp | `#000000`, `#0a0d12`, `#0e1219` | `#0B0E13`, `#131923`, `#1B2431` | Conflict — resolved to v4 for now (D1) |
| X2 | Border style | translucent hairline `.08/.10` | solid `#344154` / `#CBD5E1` | Conflict — resolve at design checkpoint |
| X4 | `--bg-panel-dark` | `#05070a` dark / `#1e293b` light | no equivalent | Legacy token; confusing light value; audit for removal |
| X6 | Duplicate semantic tokens | orange/gold, primary/blue, green/green-text, rust/rust-text | one per role | Consolidate in Phase 2 |
| X7 | Missing tokens | no paper/grid/spacing-4..8 | paper canvas+ink; 8 spacing steps | Phase 1 A1/A3/A5 |
| X8 | Radius | 6/8/10 for panels (mockup) | 4/8/12 controls/panels; pills for tags | Assign per component in Phase 2 |
| X11 | Glass/elevation | retired by v4, still live (`index.css:311-312,493,910`) | avoid glow/cinematic blur | Phase 2 removal |
| X12 | Density & control size | chips at 26–32px, 7–10px labels | controls 36–40px, touch 44–48px, text ≥12px | Only the `pointer:coarse` rule (`index.css:396`) is 44px; desktop intentionally dense — needs an explicit accepted deviation |
| X13 | Theme default | dark-first hero, light kept working | "restrained dark market workspace **with a complete** light theme" | Compatible; but v4 light frames are thin (`v4_light_desktop.png` only, no mobile light) |
| X14 | Font source | Google Fonts CDN (`index.html:10`) | "font assets and licences are reviewed before shipping"; self-host evaluation | Open risk — no licence/self-host decision recorded |

### 6.3 Where uncommitted work collides

1. **Phase 1 vs the in-flight `index.css` and `App.jsx`.** Both are already modified. Editing without a checkpoint (P1-0) produces an unreviewable stack and risks overwriting the other pass. **This is the highest-probability collision.**
2. **`HomeDashboardTab.jsx` is the contested file.** It carries the 2026-09-30 polish *and* the 2026-10-01 v4 rework, net −1875 lines, with ~1914 changed lines. Any second writer touching it will conflict. Its feature-preservation claim is unverified (§1.2).
3. **`index.css` is a single shared append-only surface** for every design ticket. DESIGN01 (tokens) and the chrome work both write here; the badge consolidation, marquee and table work also write here. Serialize `index.css` edits to one writer at a time.
4. **`Sidebar.jsx` is clean** (unmodified) — safe for Phase 1's Stage C assuming no other teammate claims it.
5. **`PasswordGate.jsx` / auth files** belong to `security-implementer`; the UI spec must not be read as authorising edits there.
6. **Screenshot directories are evidence, not outputs.** Regenerating `docs/screenshots/spacex_rework_2026-10-01/` would destroy the only record of the v4 draft; new frames must be written to a new dated directory.
7. **No `components/ui/` directory exists** — every "shared primitive" in §3 rows 15–28 is greenfield, so DESIGN01 cannot rely on an existing import path.
8. **The design approval gate (v4 §6) has no recorded outcome.** Starting Phase 2 before the mockup is explicitly approved risks a third stacked, unreviewed pass.

### 6.4 Gaps carried forward (not UI-owned, listed so they are not lost)

- News "Spot ETF Flow" placeholder needs a backend data source (polish report limitation #4).
- MKT CAP/P/E come from a static 2026-09-17 registry with no as-of marker; real pipeline fields are 0 (polish report limitation #5) — this violates the "honest states" principle at the data layer.
- Sticky table **header** row not implemented (polish report limitation #2).
- ~70 hardcoded decorative colours across `WhaleIntelligenceTab`, `AiAgentArenaTab`, `ChartingDeskTab`, risk-radar gauges (polish report limitation #3).
- Sentinel independent review of the 2026-09-30 polish was still pending at that report's write time; no review exists for the v4 pass.
- `CHANGELOG.md` `[2026-09-30]` claims `--text-muted` = `#7d8daa`; the file has `#7a8798` (`index.css:661`). Correct the changelog or the token before release.

---

## 7. Recorded decisions (so Phase 1 needs no further design input)

| ID | Decision | Rationale | Reversible? |
|---|---|---|---|
| **D1** | Live `index.css` token names are canonical; v4 short names become aliases; **live v4 values stay**; master §6.2 values are deferred to the design checkpoint. | The v4 values are already implemented across ~41 components and evidenced by screenshots; changing them now would invalidate the only visual evidence that exists. | Yes — a value swap after the checkpoint is a one-block edit once tokens are consolidated. |
| **D2** | Phase 1 changes **no existing token value**; it only adds tokens/aliases and promotes four measured AA literals to tokens verbatim. | Protects the four measured AA pairs from regression. | Yes. |
| **D3** | Barlow remains the UI face; the **9.5px floor** for essential micro-labels is enforced, and 7–8px essential text is eliminated in chrome (Stage C3). | Accepts the v4 direction while satisfying master §6.2's "no essential 8px text". | Yes (font stack is one line). |
| **D4** | `--glass-surface` / `--glass-border` are **deprecated, not deleted**, in Phase 1. | Three live consumers remain (`index.css:311-312,493,910`); deleting now breaks surfaces. | Yes. |
| **D5** | Phase 1 is limited to `index.css`, `App.jsx` (header block), `Sidebar.jsx`. | Matches v4 §6 Phase 1 and keeps the diff reviewable against a contested working tree. | Yes. |
| **D6** | Phase 1 is blocked on P1-0 (commit/stash checkpoint). | The tree already contains two unreviewed stacked passes; a third would be unaccountable. | Yes. |

---

## Appendix A — Evidence index

| Artifact | Path | What it evidences |
|---|---|---|
| Polish report | `docs/UI_UX_POLISH_REPORT_2026-09-30.md` | 2026-09-30 WCAG fixes, 7-file scope, limitations |
| v4 plan | `docs/superpowers/plans/2026-09-30-spacex-class-ui-rework.md` | v4 tokens §2, type §3, component map §4, phases §6 |
| Earlier audit | `docs/UI_UX_AUDIT_REPORT.md` (2026-09-19) | Pre-existing findings: badge saturation, mobile 4.5/10, left-aligned numbers |
| Earlier walkthrough | `docs/UI_UX_REDESIGN_WALKTHROUGH.md` | Prior claimed fixes and 1:1 mockups |
| Mockups | `frontend/public/mockup_spacex_home.html`, `mockup_spacex_screener.html` | Approved-direction design; token names + `--grid-line` |
| Polish screenshots | `docs/screenshots/ui_polish_2026-09-30/{after_dark_desktop,after_light_desktop,after_us_stocks,after_mobile}.png` | Historical baseline of the polish pass (superseded in tree) |
| v4 mockup screenshots | `docs/screenshots/spacex_mockup_2026-10-01/{mock_home_dark,mock_home_light,mock_screener_dark,mock_screener_light}.png` | Mockup approval material |
| v4 draft screenshots | `docs/screenshots/spacex_rework_2026-10-01/{v4_dark_desktop,v4_light_desktop,v4_hero_row_dark,v4_optionB_dark,v4_optionB_full}.png` | Unreviewed draft of the implemented v4 pass; **no mobile frame** |
| Changelog | `CHANGELOG.md` `[2026-09-28]`, `[2026-09-30]` | Intended changes (contains the `#7d8daa` discrepancy) |
| Live tokens | `frontend/src/index.css:1-48` (light), `:647-682` (dark) | The real token set |
| Live chrome | `frontend/src/App.jsx:484-731` | Glass dock + v4-restyled chips |
| Live sidebar | `frontend/src/components/Sidebar.jsx` | Unchanged glass/neon sidebar |
| Master Plan | §5.1–5.4, §6.1–6.2, §7.1–7.7, §8 | IA, tokens, page rules, logo spec |
| Backlog | §6 DESIGN01–DESIGN05 (+ WORKSPACE01–03) | Tickets, acceptance, effort |

**Document status:** consolidated spec complete; one merged token table (§2.1, 35 rows), component map covering 65 surfaces / 42 required components (§3), executable Phase-1 checklist (§5), conflicts (§6), decisions (§7).
