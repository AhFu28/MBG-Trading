# MBG Terminal v4 — SpaceX-Class UI Rework Plan

**Date:** 30 September 2026 · **Mode:** Product → Build (mockup-first, approval-gated)
**Request:** "rework the design, i want space x / freebuff / commandcode design — prepare plan and make mockup sample first in html"

---

## 0. Assumptions (reversible — correct me at plan review)

1. **"space x" = SpaceX design language** — VERIFIED by direct fetch of spacex.com: `font-family: D-DIN`, canvas `#000`, thin expanded uppercase headings, hairline borders, generous negative space, monochrome chrome.
2. **"freebuff" / "commandcode"** = additional minimal-dark, technical/command-center inspirations. Not found in your codebase; web search is down (invalid API key — Settings → Plugins → Web search). Interpreted as **technical HUD discipline**: monospace micro-labels, thin 1px hairlines, data-first density with real whitespace. If you meant specific designs, share links/screenshots and I will match them 1:1.
3. **Theme:** dark-first hero, light mode kept working (WCAG AA) — reversible.
4. **Scope:** full visual rework via the CSS design system + components; **100% of features, behavior and data preserved.**

## 1. Design principles (evidence-based)

1. **Monochrome chrome** — pure-black canvas, white text, hairline `rgba(255,255,255,0.08)` borders. Color is reserved for DATA (up/down) and ONE interactive accent (SpaceX DNA).
2. **Typography is the interface** — D-DIN-class grotesque (Barlow) for display, JetBrains Mono for micro-labels; uppercase micro-labels with 0.14–0.16em letter-spacing (SpaceX signature).
3. **Thin display headings** — weight 300–400 with wide tracking replaces heavy 800-weight labels.
4. **Whitespace as hierarchy** — 4/8px grid, generous 16–24px padding, breathing room between cards (Carbon: "use white space to enhance clarity").
5. **Data-first density** — keep the information, lose the noise: ≤2 badges per row; numbers right-aligned `tabular-nums` (MDN + NN/g evidence).
6. **F-pattern anchoring** — the 3–5 most important KPIs anchor top-left (NN/g F-pattern + Carbon dashboards: "place the most important at the top").
7. **One semantic status vocabulary** — up/down/neutral/warning, muted fills, never color alone (Polaris-style pip + text).
8. **Progressive disclosure** — summary first, detail on demand (NN/g).
9. **Honest states** — em-dash for no-data; never fabricated values.
10. **WCAG 2.2 AA in BOTH themes** — every text/background pair ≥ 4.5:1, computed with the relative-luminance formula, not assumed.

## 2. Design tokens v4

| Token | Dark (hero) | Light |
|---|---|---|
| `--canvas` | `#000000` (pure black) | `#f7f8fa` |
| `--panel` | `#0a0d12` | `#ffffff` |
| `--panel-2` | `#0e1219` | `#f1f3f7` |
| `--hairline` | `1px solid rgba(255,255,255,0.08)` | `1px solid rgba(15,23,42,0.10)` |
| `--text-1` | `#f5f7fa` | `#0f172a` |
| `--text-2` | `#aab3c0` | `#3d4756` |
| `--text-3` (micro) | `#7a8798` (≈5.0:1) | `#5c6673` (≈5.5:1) |
| `--up` | `#2ee6a8` (≈11:1) | `#0e9f6e` (≈4.6:1) |
| `--down` | `#ff5c5c` (≈6:1) | `#dc2626` (≈4.6:1) |
| `--accent` (single) | `#4d8dff` (≈5.5:1) | `#1d4ed8` (≈6.0:1) |
| `--warn` | `#ffb454` | `#b45309` |
| `--radius` | 6/8/10px (near-square, SpaceX) | same |
| `--space` | 4/8/12/16/24px grid | same |

## 3. Typography scale

| Role | Font | Size/Weight | Notes |
|---|---|---|---|
| Display numbers | Barlow 300 (JetBrains Mono alt) | 30–36px | tabular-nums, wide |
| Section titles | Barlow 400 | 15–16px | 0.04em |
| Micro-labels | JetBrains Mono 500 | 9.5–10px | uppercase, 0.14–0.16em — the SpaceX signature |
| Data cells | JetBrains Mono 400 | 12px | tabular-nums, right-aligned |
| Body | Barlow 400 | 13px | line-height 1.55 |

## 4. Component rework map

| Component | Now | After (v4) |
|---|---|---|
| Header | glass dock, colorful chips | 56px hairline bar, monochrome chips, mono micro-labels, single accent on interactive states |
| Sidebar | glow gradient pills | flat hairline nav, mono micro section headers, active = white text + 8% fill |
| Hero / KPI cards | heavy 800 labels, neon badges | thin display numbers, micro-labels, hairline cards, ≤1 badge |
| Market cards | saturated badges, borders | hairline cards, SVG sparklines, quiet level rows |
| Signal tables | zebra-ish, heavy badges | hairline rows only, right-aligned tabular data, ≤2 badges, sticky ticker |
| News rail | dense chips | mono timestamps, clean headline hierarchy |
| Modals / drawer | neon close buttons | white/dark surface, hairline, single accent CTA |
| Footer | gray bar | hairline + micro disclaimer |

## 5. What stays (unchanged)

All features: tabs, screener data flows, AI Arena, wallet integration, password gate, Command Palette, lot calculator, drawer, modals, live feeds. Only the visual language changes.

## 6. Mockup-first workflow (this document + 2 files)

- **NOW:** `frontend/public/mockup_spacex_home.html` + `frontend/public/mockup_spacex_screener.html` — standalone, real data from the current terminal, both themes via in-file toggle.
- **YOU REVIEW:** approve or correct the direction (free to change tokens, density, accent).
- **THEN Phase 1:** tokens + chrome (`index.css`, header, Sidebar) — bounded pass.
- **Phase 2:** components (Home, tables, drawer, modal) — bounded per-component passes.
- **Phase 3:** verify — build, screenshot regression vs mockup, computed WCAG, Sentinel independent review, Archivist record.

## 7. Acceptance criteria

- Mockup approved by you before implementation begins.
- Build zero errors; 100% of features preserved (full diff review).
- Computed WCAG AA in dark AND light.
- Rendered result visually matches the approved mockup (screenshot check).

## 8. Risks

- 41 components with many inline styles — Phase 2 is the long pole; mitigated by bounded per-component passes and a tracked report.
- Inline styles resist token replacement — accept partial per component, record leftovers in the report.
- D-DIN is not on Google Fonts — Barlow used as the closest free DIN-class face with system fallbacks (swap to licensed D-DIN anytime).
