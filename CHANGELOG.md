# Changelog — Market Brain Grid (MBG) // Trading Intelligence Cockpit

All notable changes to the MBG Trading Platform are documented in this file.
This changelog strictly groups releases **chronologically by date**, providing institutional-level transparency, mathematical foundations, architectural provenance, and test verification evidence.

The format follows an enhanced [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standard with categorized institutional tags:
- `[COCKPIT UI/UX]` — User experience, telemetry density, viewport optimizations, and layout symmetry.
- `[MACRO & RISK DESK]` — Sovereign yield curves, carry spreads, VaR (Value at Risk), and capital allocation.
- `[BANDARMOLOGY & ORDER FLOW]` — Institutional broker footprint, IIFS, foreign flow, and market microstructure.
- `[QUANT & AGENTIC ENGINES]` — Multi-armed bandits, strategy behavioral contracts, MCP server, and statistical tests.
- `[DEFENSE & GEOPOLITICAL HUD]` — Tail-risk defense alerts, DEFCON levels, flight-to-safety scenarios, and OSINT aggregation.
- `[RESEARCH & NEWS]` — Autonomous news intelligence, macroeconomic synthesis, and 4-pillar structured analysis.
- `[VERIFICATION & QA]` — Unit testing, build pipelines, and browser visual regression audits.

---

## [2026-09-23] — Institutional Cockpit Refinement, Tactical Defense & Quant Synthesis

### Sprint 4 (Malam) — Executive Hedge Fund Working Paper Series (MBG-WP-2026) & Quant Academy
- **[QUANT & AGENTIC ENGINES] Transformation to Executive Research Paper Series**:
  - Re-architected naive video-game levels into an **Executive Hedge Fund Research Paper Series** featuring 6 seminal working papers grounded in authoritative quantitative finance literature:
    * **`MBG-WP-01`**: *Capital Preservation & Discrete BEI Lot Sizing: A Probabilistic Framework for Asymmetric Risk in Indonesian Equity Portfolios* (Ref: Ralph Vince 1990, Robert Carver 2015).
    * **`MBG-WP-02`**: *Global Macro Transmission Channels & Carry Trade Mechanics: Cross-Asset Yield Differentials, Sovereign Spread Dynamics, and IDX Capital Flow Sensitivity* (Ref: John J. Murphy 1999, Abdulkader Aljandali 2016).
    * **`MBG-WP-03`**: *Market Microstructure & Order Book Asymmetry: Limit Order Book Dynamics, Queue Imbalance, and Institutional Spoofing Signatures* (Ref: Mark Andrew Lim 2016).
    * **`MBG-WP-04`**: *Smart Money Concepts: Imbalance, Liquidity Voids, and the 50% Consequent Encroachment Magnet on Low-Frequency Equities* (Ref: Marcos López de Prado 2018, ICT Frameworks).
    * **`MBG-WP-05`**: *Cyclical Commodity Dividend Cascade Trap: Liquidity Exits, Pre-Ex-Date Institutional Distribution, and Post-Ex Dividend Gap Decay in High-Beta Indonesian Equities* (Ref: Thomas N. Bulkowski 2013).
    * **`MBG-WP-06`**: *Deflated Sharpe Ratio & Statistical Defensibility: Combating Backtest Overfitting, Selection Bias, and Multiple Testing in Quantitative Strategy Verification* (Ref: David H. Bailey & Marcos López de Prado 2014, 2018).
- **[COCKPIT UI/UX] Dual-Layer Executive / Layman Reading Architecture**:
  - Implemented an interactive mode switcher for every working paper:
    * **`[👔 Executive / Layman View]`**: Written for retail investors and executives using intuitive, real-world analogies (e.g. driving at 120 km/h without brakes for drawdown, 3-candle sudden leaps for liquidity imbalance, poisoned honey bait for dividend traps) with zero mathematical friction, strategic takeaways, and pre-flight checklists.
    * **`[🔬 Quant Formalism & Proofs]`**: Written for quantitative researchers featuring formal mathematical theorems, LaTeX proofs, formal parameters, institutional edges, and full production Python/VectorBT algorithmic implementations.
- **[QUANT & AGENTIC ENGINES] 6 Embedded Live Interactive Research Widgets**:
  1. *Drawdown Recovery & Fixed Fractional Lot Calculator* (`MBG-WP-01`): Dynamic loss vs recovery slider with exact BEI lot size calculation.
  2. *Macro Transmission Flow Tree & Cross-Asset Sensitivity Matrix* (`MBG-WP-02`): Interactive root driver selector showing live propagation to IDX sectors.
  3. *L2 Queue Imbalance & Spoofing Detector Sandbox* (`MBG-WP-03`): Real-time bid/ask order book depth with queue imbalance metric ($QI$) and spoofing alert.
  4. *3-Candle Fair Value Gap & 50% C.E. Interactive Magnet* (`MBG-WP-04`): Visual candlestick imbalance sandbox with automatic Consequent Encroachment line.
  5. *Historical $PTBA Dividend Trap Net-PnL Simulator* (`MBG-WP-05`): Interactive scenario calculator computing dividend yield vs post-ex gap decay.
  6. *Deflated Sharpe Ratio (DSR) Multiple-Testing Decay Sandbox* (`MBG-WP-06`): Live statistical significance tester demonstrating how backtest variance decays true Sharpe ratio.
- **[RESEARCH & NEWS] Quantitative Glossary & Reference Suite**:
  - Integrated 66 institutional quantitative finance and market microstructure terms with real-time fuzzy search.
  - Retained 7 visual institutional architecture diagrams, standalone lot calculator, interactive quant lab, and final certification exam.
- **[VERIFICATION & QA] Strict Production Build Validation**:
  - Built and validated with `npm run build` (0 errors, 75 modules transformed in 3.17s).
  - Verified in browser with automated subagent across both Layman and Quant modes.

### Sprint 3 (Malam) — Symmetrical Cockpit Alignment, Defense Alert HUD & Standardized Financial Terminology
- **[COCKPIT UI/UX] Symmetrical 50/50 Vertical Axis Alignment**:
  - Replaced the asymmetric `1.15fr : 1.25fr` grid in `SMART MONEY ORDER FLOW & BANDARMOLOGY RADAR` with `repeat(2, minmax(0, 1fr))` with `gap: 6px`.
  - The vertical dividing line between **`FOREIGN FLOW // ARUS ASING (INTRADAY)`** and **`SMART MONEY ACCUMULATION (EOD)`** now aligns to the sub-pixel with the center dividing line between Card 2 (`COMMODITIES & DXY`) and Card 3 (`#1 QUANT CRYPTO SPOT`) directly above it.
  - Standardized `.home-macro-trio-grid` in `index.css` to `repeat(3, minmax(0, 1fr))` for uniform 33.33% panel widths across the top row.
- **[MACRO & RISK DESK] Standardized Institutional Financial Terminology**:
  - Replaced awkward literal translations with standard hedge fund terminology:
    * `KURVA IMBAL HASIL (10Y-2Y)` ➔ **`US YIELD CURVE & LIQUIDITY (10Y-2Y)`**
    * `Status: Ekspansi Normal (Bukan Resesi)` ➔ **`Regime: Normal Expansion (Low Recession Risk)`**
    * `BI vs Fed: +125 bps Carry (Rupiah Terlindungi)` ➔ **`BI vs Fed Spread: +125 bps Carry (IDR Support Buffer)`**
    * `PORTFOLIO RISK & KONTROL MODAL` ➔ **`PORTFOLIO RISK & CAPITAL ALLOCATION`**
    * `Batas Aman: Sisa Kas 21.6% • Max Rugi Harian: 1.18%` ➔ **`Safety Buffer: 21.6% Cash Reserve • Max Daily VaR: 1.18%`**
    * `MODAL AKTIF` ➔ **`GROSS EXPOSURE`** (78.4%)
    * `ARAH POSISI` ➔ **`NET BIAS`** (+64.2%)
    * `MAX RUGI 1D` ➔ **`1D VaR (95%)`** (1.18%)
    * `BETA IHSG` ➔ **`PORTFOLIO BETA`** (1.05x)
    * `71 TAMAK` ➔ **`71 GREED`**
    * `14.21 TENANG` ➔ **`14.21 CALM`**
    * `Makna Awam` ➔ **`Macro Context: Risk-On Sentiment • Soft DXY Supports BEI / Emerging Markets`**
- **[DEFENSE & GEOPOLITICAL HUD] Tactical Defense Alert Banner (WorldMonitor & God's Eye View Inspiration)**:
  - Integrated an institutional OSINT Geopolitical & Nuclear Threat Alert HUD banner at the top of the News Wire.
  - Automatically triggers under elevated DEFCON states with actionable real-world hedge fund flight-to-safety recommendations:
    * **Primary Safe Havens**: Long Brent Oil & Gold ($XAU/USD).
    * **IDX Commodity Proxies**: Core long exposure in `$MEDC`, `$ELSA`, and `$ANTM`.
    * **Quick Filter**: Direct one-click filter to all 29 geopolitical conflict intelligence feeds.
- **[RESEARCH & NEWS] Full 14-Category Horizontal Scrollable Track**:
  - Restored all 14 granular news categories (`SEMUA`, `NUKLIR & PERANG`, `BRIEF`, `RISET`, `SAHAM IDX`, `PERBANKAN`, `KRIPTO`, `MAKRO & FED`, `GEOPOLITIK`, `LOGAM & EMAS`, `ENERGI & MINYAK`, `US MARKET`, `CHINA`, `TECH & AI`) in a single horizontal scrollable chip track, maximizing information density without consuming vertical screen real estate.
- **[VERIFICATION & QA]**:
  - Vite production build verified: `✓ 75 modules transformed in 3.33s (0 syntax/type errors)`.
  - Browser visual regression verified via Puppeteer/agent-browser at `http://127.0.0.1:5173/#home`.

---

### Sprint 2 (Siang) — Top Viewport Compaction & 1-Line Command Center Header
- **[COCKPIT UI/UX] Command Center 1-Line Header**:
  - Re-architected `App.jsx` header with `flexWrap: 'nowrap'` ensuring title `HOME COMMAND CENTER`, global bursa clocks (`JKT`, `TYO`, `LON`, `NYC`), `Ctrl+K` launcher, `LIVE FEED WS`, jam WIB, `DEFCON 4 // AI DESK`, `LOT CALC`, and theme toggle sit on a single horizontal plane.
- **[COCKPIT UI/UX] Market Benchmarks Ribbon**:
  - Replaced legacy text-heavy strip with an ultra-compact (24px) running marquee ribbon displaying real-time live quotes for `USD/IDR`, `XAU/USD`, `BRENT`, `DXY`, `US10Y`, `IHSG`, `BTC/USD`, and `ETH/USD`.
- **[COCKPIT UI/UX] News Wire Top-Level Alignment**:
  - Expanded `LIVE INTELLIGENCE WIRE` vertically to start flush from the topmost row (level with Yield Curve) down through Smart Money Order Flow.
  - Removed dangling bottom meters from Smart Money and relocated them to the top row as animated 4-Barometer visual progress gauges.

---

### Sprint 1 (Pagi) — Institutional Quant Sprint v3.0 (Jev-Trade, OpenQuant & QuantDinger Synthesis)
- **[QUANT & AGENTIC ENGINES] Jev-Trade Visual Trade Execution Overlay HUD (`ChartingDeskTab.jsx`)**:
  - Semi-transparent glassmorphism HUD (`backdrop-filter: blur(8px)`) overlayed directly on the TradingView chart canvas.
  - Real-time bot execution attribution (`Bot-06 Bandarmology VWAP` / `Bot-02 Momentum Alpha`).
  - Marcos López de Prado Triple-Barrier Brackets visualization:
    * **Barrier 1 (Take Profit)**: Horizontal profit target price (+8.2%).
    * **Barrier 2 (Stop Loss)**: Horizontal hard invalidation cut-off (-3.5%).
    * **Barrier 3 (Time Expiry)**: Vertical holding horizon (Bar 14/24, H+3) for de-risking before session close.
  - Live trailing stop level and execution route slippage tracker (`TWAP Sliced: 0.08% slip`).
  - Dedicated **Triple-Barrier Contract Card** in the right-hand companion Radar Panel.
- **[QUANT & AGENTIC ENGINES] OpenQuant Strategy Behavioral Contracts & Deflated Sharpe Ratio (`BacktestPerformanceLab.jsx`)**:
  - Strategy Behavioral Contract (`strategy_spec.json` v2.1) drawer inspector exposing hypotheses, universe filters, trigger rules, triple-barrier rules, and volatility-targeted risk sizing.
  - Deflated Sharpe Ratio (DSR) mathematical engine (Marcos López de Prado 2018):
    $$SR^* = \sqrt{2 \ln N} + \frac{\gamma}{\sqrt{2 \ln N}}$$
    $$DSR = \Phi\left(\frac{(\widehat{SR} - SR^*)\sqrt{T-1}}{\sqrt{1 - \gamma_3 \widehat{SR} + \frac{\gamma_4 - 1}{4}\widehat{SR}^2}}\right)$$
  - Multiple-testing selection bias correction ($N = 6\dots24$) and non-normal skewness/kurtosis adjustment.
  - Formal statistical defensibility badge: `[🛡️ DEFENSIBLE SPEC]` ($DSR \ge 0.95$) vs `[⚠️ OVERFITTED]`.
- **[QUANT & AGENTIC ENGINES] OpenQuant Initiative Interactive Math Quant Lab Sandbox (`QuantAcademyTab.jsx`)**:
  - Sub-tab 5 in Quant Academy (`🔬 INTERACTIVE QUANT LAB (OPENQUANT)`).
  - **Simulator 1 — Bandarmology Concentration (BCR & HHI)**: Live volume sliders for Top 1, Top 2, Top 3 brokers vs Retail, calculating $BCR_k$ and Herfindahl-Hirschman Index ($HHI = \sum s_i^2$).
  - **Simulator 2 — Robert Carver Volatility Sizing (2015)**: Live sliders for account equity, annual volatility target, daily asset volatility, and stock price, generating exact discrete IDX lots:
    $$N_{lots} = \left\lfloor \frac{\text{Equity} \times (\sigma_{ann} / \sqrt{252})}{100 \times \text{Price} \times \sigma_{daily}} \right\rfloor$$
  - **Simulator 3 — Deflated Sharpe Ratio Multi-Testing Decay**: Live sliders for observed Sharpe, trial count ($N$), return skewness, and fat-tail kurtosis.
- **[QUANT & AGENTIC ENGINES] QuantDinger Local-First MCP Agentic Gateway Server (`engine/mcp/mbg_server.py`)**:
  - Zero-dependency stdlib Python JSON-RPC 2.0 stdio Model Context Protocol (MCP) server for local AI agents (Claude Code, Antigravity, Cursor).
  - 5 Standardized Quantitative Tools:
    1. `mbg_get_orderbook`: Level 2 depth, spread in bps, and queue imbalance ratio.
    2. `mbg_calc_bandarmology`: $BCR_1, BCR_3, BCR_5$, $HHI$, and net foreign broker flow.
    3. `mbg_get_macro_transmission`: DXY, US10Y, Brent Oil, Gold, USD/IDR and sector transmission impact.
    4. `mbg_validate_strategy_spec`: Formal schema and DSR validator for `strategy_spec.json`.
    5. `mbg_get_bot_arena_status`: Status of 6 autonomous trading agents and EXP3 bandit weights.
  - Diagnostic self-test suite: `py engine/mcp/mbg_server.py --test`.
  - Comprehensive unit test suite: `engine/tests/test_mcp_server.py` (7 tests, 100% pass).
- **[RESEARCH & NEWS] Vijay Subramanian 4-Pillar Executive News & Research Intelligence**:
  - Replaced legacy news cards with 4 structured pillars: **What Changed**, **Why It Changed** (waterfall driver decomposition), **What Matters** (equity transmission channels), and **What Next** (contingency roadmap & invalidation levels).

---

## [2026-09-22] — AI Multi-Agent Arena, 16 Offline Books Literature Alignment & L2 Order Book

- **[QUANT & AGENTIC ENGINES] Multi-Agent Arena Literature Alignment**:
  - Audited 16 autonomous trading bots and connected each bot's execution philosophy directly to authoritative finance literature from `D:\Book & journal\ORGANIZED\01_BOOKS`:
    * John J. Murphy (1999) *Technical Analysis of the Financial Markets*
    * Marcos López de Prado (2018) *Advances in Financial Machine Learning*
    * Robert Carver (2015) *Systematic Trading*
    * Thomas N. Bulkowski *Fundamental Analysis and Position Trading*
    * Mario Singh & Kathy Lien *Currency & Macro Trading*
    * Abdulkader Aljandali *Quantitative Analysis and Statistics for Finance*
- **[BANDARMOLOGY & ORDER FLOW] Level-2 Order Book Microstructure Simulator**:
  - Interactive L2 Order Book depth simulator (`OrderBookSimulator.jsx`) with realistic bid/ask queue dynamics, spoofing simulation, and order imbalance metrics.
- **[VERIFICATION & QA] Smoke Test Suite & Build Hardening**:
  - Validated frontend build and resolved all circular dependencies across modal components.

---

## [2026-09-21] — Macro Transmission, AI Intelligence Sentinel & Season 0.1 Recaps

- **[DEFENSE & GEOPOLITICAL HUD] AI Quant Intelligence & Sentinel Desk (`AiIntelligenceDrawer.jsx`)**:
  - Introduced Quantified DEFCON Threat Barometer (0.42 / 1.00) with interactive What-If Stress Testing simulator.
  - Live Gemini LLM Daily Brief & Goldman Sachs Barbell Strategy Sector Research Note generation.
  - Emergency Macro & War Flash Alert Sentinel banner.
- **[QUANT & AGENTIC ENGINES] AI Agent Arena Season 0.1 & Pair Recaps**:
  - Added dedicated Pair Recap tab in Session Recap modal with automated calibration session labeling.
  - Fixed auto-start regression on archived multi-agent sessions.

---

## [2026-09-20] — TimesFM Forecaster & Intermarket Correlation Matrix

- **[QUANT & AGENTIC ENGINES] Google TimesFM Zero-Shot Foundation Model Integration**:
  - Implemented `engine/analyzer/timesfm_forecaster.py` for univariate financial time series forecasting with dynamic prediction intervals.
- **[MACRO & RISK DESK] Cross-Asset Correlation Matrix Engine**:
  - Real-time rolling Pearson correlation calculations linking global benchmark drivers (DXY, US10Y, Brent Oil, Gold) with domestic equities and sector indices.

---

## [2026-09-19] — Multi-Asset Live Scanner & Real-Time Price Ingestion

- **[MACRO & RISK DESK] 5 Integrated Asset Classes**:
  - Live price ingestion pipelines across Saham BEI (IDX), Kripto Spot & Futures (Binance), US Equities, Forex Interbank, and Global Commodities.
- **[COCKPIT UI/UX] Watchlist & Market Heatmap Tabs**:
  - Treemap visualization of market breadth and institutional sector capital distribution.

---

## [2026-09-18] — Bandarmology & Foreign Flow Tracking Engine

- **[BANDARMOLOGY & ORDER FLOW] Institutional Inflow Flow Score (IIFS)**:
  - Designed proprietary IIFS algorithm calculating Top-3 and Top-5 broker concentration ratios ($BCR_3, BCR_5$) to expose Smart Money accumulation post-broker summary closure.
- **[BANDARMOLOGY & ORDER FLOW] Foreign Flow Intraday vs EOD Tracker**:
  - Real-time calculation of net foreign broker participation and volume velocity on IDX 100 and LQ45 universes.

---

## [2026-09-17] — Smart Money Concepts (SMC) & ICT Imbalance Engine

- **[QUANT & AGENTIC ENGINES] ICT Fair Value Gap (FVG) & Order Block Detector**:
  - Automated detection of 3-candle imbalance gaps and 50% Consequent Encroachment (C.E.) magnet levels in `engine/analyzer/smc_detector.py`.
- **[QUANT & AGENTIC ENGINES] Liquidity Sweep & Turtle Soup Detection**:
  - Algorithmic recognition of fake breakout stop-hunts with immediate daily reclaim confirmation.

---

## [2026-09-16] — Lot Calculator Modal & Dynamic Strategy Engine

- **[MACRO & RISK DESK] Exact Discrete BEI Lot Calculator**:
  - Interactive lot sizing calculator implementing Ralph Vince (1990) Fixed Fractional 2% Risk Model with BEI tick fractions (Rp 1, Rp 2, Rp 5, Rp 10, Rp 25) and dual-safety caps.
- **[QUANT & AGENTIC ENGINES] Dynamic Reactive Edge State Machine**:
  - Regime-dependent strategy selection adapting between Mean Reversion, Momentum Breakout, and Capital Preservation.

---

## [2026-09-12] — US Equities & Global Markets Module

- **[MACRO & RISK DESK] Wall Street Index Transmissions**:
  - Real-time ingestion of S&P 500, Nasdaq 100, and Dow Jones industrial averages with intraday sector relative strength.

---

## [2026-09-11] — Crypto Futures & Binance Integration

- **[MACRO & RISK DESK] Crypto Spot vs Futures Risk Engine**:
  - Pure Spot discipline architecture enforcing zero liquidation risk, contrasted with derivative funding rate heatmaps.

---

## [2026-09-10] — Economic Calendar & Macro Data Pipelines

- **[MACRO & RISK DESK] High-Impact Macro Economic Events**:
  - Central bank rate decisions (BI-Rate, FOMC Fed Funds Rate), US Non-Farm Payrolls, and domestic inflation CPI data releases.

---

## [2026-09-08 to 2026-09-09] — Initial Platform Architecture & Cockpit Launch

- **[COCKPIT UI/UX] Initial Platform Core**:
  - React 18 + Vite 5 + Vanilla CSS modular cockpit architecture.
  - Multi-tab navigation system (`Home`, `AI Agent Arena`, `Charting Desk`, `Whale Tracker`, `Economic Calendar`, `Quant Academy`).
  - Zero Simulation Policy foundation ensuring strict empirical veracity.
