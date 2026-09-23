# Changelog — Market Brain Grid (MBG) Trading Intelligence Cockpit

All notable changes to the MBG Trading Platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v5.1.0] - 2026-09-23
### Institutional Quant Sprint v3.0 (Jev-Trade, OpenQuant & QuantDinger Synthesis)

#### Added
- **Jev-Trade Visual Trade Execution Overlay HUD (`ChartingDeskTab.jsx`)**:
  - Semi-transparent glassmorphism HUD (`backdrop-filter: blur(8px)`) overlayed directly on the TradingView chart canvas.
  - Real-time bot execution attribution (`Bot-06 Bandarmology VWAP` / `Bot-02 Momentum Alpha`).
  - Marcos López de Prado Triple-Barrier Brackets visualization:
    * **Barrier 1 (Take Profit)**: Horizontal profit target price (+8.2%).
    * **Barrier 2 (Stop Loss)**: Horizontal hard invalidation cut-off (-3.5%).
    * **Barrier 3 (Time Expiry)**: Vertical holding horizon (Bar 14/24, H+3) for de-risking before session close.
  - Live trailing stop level and execution route slippage tracker (`TWAP Sliced: 0.08% slip`).
  - Interactive mini toolbar toggle button (`🎯 HUD ON / HUD`).
  - Dedicated **Triple-Barrier Contract Card** in the right-hand companion Radar Panel.

- **OpenQuant Strategy Behavioral Contracts & Deflated Sharpe Ratio (`BacktestPerformanceLab.jsx`)**:
  - Strategy Behavioral Contract (`strategy_spec.json` v2.1) drawer inspector exposing hypotheses, universe filters, trigger rules, triple-barrier rules, and volatility-targeted risk sizing.
  - Deflated Sharpe Ratio (DSR) mathematical engine (Marcos López de Prado 2018):
    $$SR^* = \sqrt{2 \ln N} + \frac{\gamma}{\sqrt{2 \ln N}}$$
    $$DSR = \Phi\left(\frac{(\widehat{SR} - SR^*)\sqrt{T-1}}{\sqrt{1 - \gamma_3 \widehat{SR} + \frac{\gamma_4 - 1}{4}\widehat{SR}^2}}\right)$$
  - Multiple-testing selection bias correction ($N = 6\dots24$) and non-normal skewness/kurtosis adjustment.
  - Formal statistical defensibility badge: `[🛡️ DEFENSIBLE SPEC]` ($DSR \ge 0.95$) vs `[⚠️ OVERFITTED]`.

- **OpenQuant Initiative Interactive Math Quant Lab Sandbox (`QuantAcademyTab.jsx`)**:
  - Sub-tab 5 in Quant Academy (`🔬 INTERACTIVE QUANT LAB (OPENQUANT)`).
  - **Simulator 1 — Bandarmology Concentration (BCR & HHI)**: Live volume sliders for Top 1, Top 2, Top 3 brokers vs Retail, calculating $BCR_k$ and Herfindahl-Hirschman Index ($HHI = \sum s_i^2$).
  - **Simulator 2 — Robert Carver Volatility Sizing (2015)**: Live sliders for account equity, annual volatility target, daily asset volatility, and stock price, generating exact discrete IDX lots:
    $$N_{lots} = \left\lfloor \frac{\text{Equity} \times (\sigma_{ann} / \sqrt{252})}{100 \times \text{Price} \times \sigma_{daily}} \right\rfloor$$
  - **Simulator 3 — Deflated Sharpe Ratio Multi-Testing Decay**: Live sliders for observed Sharpe, trial count ($N$), return skewness, and fat-tail kurtosis.

- **QuantDinger Local-First MCP Agentic Gateway Server (`engine/mcp/mbg_server.py`)**:
  - Zero-dependency stdlib Python JSON-RPC 2.0 stdio Model Context Protocol (MCP) server for local AI agents (Claude Code, Antigravity, Cursor).
  - 5 Standardized Quantitative Tools:
    1. `mbg_get_orderbook`: Level 2 depth, spread in bps, and queue imbalance ratio.
    2. `mbg_calc_bandarmology`: $BCR_1, BCR_3, BCR_5$, $HHI$, and net foreign broker flow.
    3. `mbg_get_macro_transmission`: DXY, US10Y, Brent Oil, Gold, USD/IDR and sector transmission impact.
    4. `mbg_validate_strategy_spec`: Formal schema and DSR validator for `strategy_spec.json`.
    5. `mbg_get_bot_arena_status`: Status of 6 autonomous trading agents and EXP3 bandit weights.
  - Diagnostic self-test suite: `py engine/mcp/mbg_server.py --test`.
  - Comprehensive unit test suite: `engine/tests/test_mcp_server.py` (7 tests, 100% pass).

- **Vijay Subramanian 4-Pillar Executive News & Research Intelligence**:
  - Replaced legacy news cards with 4 structured pillars: **What Changed**, **Why It Changed** (waterfall driver decomposition), **What Matters** (equity transmission channels), and **What Next** (contingency roadmap & invalidation levels).

---

## [v5.0.0] - 2026-09-23
### Institutional AI Desk & Sentinel Integration
- AI Quant Intelligence & Sentinel Desk (`AiIntelligenceDrawer.jsx`).
- Quantified DEFCON Threat Barometer (0.42 / 1.00) with What-If Stress Simulator.
- Live Gemini LLM Daily Brief & Goldman Sachs Barbell Strategy Sector Research Note.
- Emergency Macro & War Flash Alert Sentinel banner.
- Explainable AI Reflection in AI Agent Arena closed trades.

---

## [v4.8.0] - 2026-09-21
### Season 0.1 & Pair Recap
- Pair Recap sub-tab in Session Recap modal.
- Calibration Session #0.1 auto-labeling.
- Auto-start bug fix on archived sessions.
