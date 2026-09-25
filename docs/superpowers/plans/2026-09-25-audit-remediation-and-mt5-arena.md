# Audit Remediation, Headless 16-Bot Tournament & MT5 Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remediate all critical audit findings (data integrity, math correctness, zero-random policy), establish a 24/7 server-side headless runner for the 16-variant tournament, bridge signals to order execution, export the Bitget MT5 EA, and embed a comprehensive "Flow Process" architecture page in the web app and GitHub README.

**Architecture:**
- **Backend (Python):** Headless tournament evaluator (`arena_headless_runner.py`) runs on hourly cron, recording cumulative variant P&L/drawdowns to `latest_cockpit_bundle.json`. Math fixes in `backtest_engine.py` convert per-trade returns into true daily equity curves before annualizing with $\sqrt{252}$.
- **Execution Bridge (MQL5 + React):** `OrderExecutionModal.jsx` receives signal prefill from Arena and Home cards. A production-grade `MBG_Institutional_Apex_EA.mq5` file is deployed for Bitget MT5 Crypto Futures, AI Tokens, and Forex/Gold.
- **Frontend (React):** A dedicated `<FlowProcessTab />` is added between "Quant Academy" and "Changelog", acting as the live system blueprint and reference guide for external AI audits.

**Tech Stack:** Python 3.14 (pandas, numpy), React 18, Vite, MetaTrader 5 (MQL5), TradingView Scanner APIs.

---

### Task Breakdown & Implementation Roadmap

#### Phase 1: Data Integrity & Zero-Random Remediation
- [ ] **Task 1: Purge Random Number Generators from `crypto_futures.py`**
  - Files: `engine/fetchers/crypto_futures.py`
  - Changes: Replace `random.uniform()` in funding rates, `random.choice()` in OI divergence, and random fallbacks with explicit `{ "status": "DATA_UNAVAILABLE" }` and `None`.
  - Verification: Run `py engine/fetchers/crypto_futures.py` and verify zero references to `random` remain.

- [ ] **Task 2: Sanitize Whale Tracker & US Market Synthetic Data**
  - Files: `engine/fetchers/whale_tracker.py`, `engine/fetchers/us_market.py`
  - Changes:
    - In `whale_tracker.py`, dynamically fetch live BTC price for Mempool USD amounts (no hardcoded $65K). Explicitly label static cluster feeds as `"HISTORICAL_BENCHMARK"`.
    - In `us_market.py`, eliminate `random.randint(2, 28)` for earnings calendar. Return real dates from Yahoo Finance or empty list with notice.
  - Verification: Run `py -m unittest discover -s engine/tests`.

- [ ] **Task 3: Disclose Heuristic Estimations (Foreign Flow & Broker Summary)**
  - Files: `engine/fetchers/foreign_flow_fetcher.py`, `engine/fetchers/broker_summary_fetcher.py`
  - Changes: Ensure all synthetic fallbacks flag `data_source: "model_estimated"` and include visible disclaimer strings.
  - Verification: Verify bundle JSON flags data source accurately.

#### Phase 2: Quant Math & Backtest Corrections
- [ ] **Task 4: Correct Sharpe Ratio & Capital Allocation in `backtest_engine.py`**
  - Files: `engine/analyzer/backtest_engine.py`
  - Changes:
    - Group trade exits into chronological daily equity bins.
    - Compute daily returns $r_d$, subtract daily risk-free rate $r_f$, then annualize: $\text{Sharpe} = \frac{\text{mean}(r_d - r_f)}{\text{std}(r_d)} \times \sqrt{252}$.
    - Implement a 2% fixed-fractional risk sizing model instead of 100% sequential all-in compounding.
  - Verification: Re-run archetype backtest and verify Sharpe ratios fall into realistic institutional bounds (0.8 - 2.8).

#### Phase 3: Headless 24/7 16-Bot Tournament Runner
- [ ] **Task 5: Implement `engine/analyzer/arena_headless_runner.py`**
  - Files: `engine/analyzer/arena_headless_runner.py`, `engine/run_pipeline.py`
  - Changes:
    - Port the 16 elemental bot rules (WATER, FIRE, AIR, EARTH, combos) into a headless Python evaluator.
    - On every hourly pipeline run, evaluate live price ticks, update virtual open positions, calculate realized P&L, and track cumulative win rates.
    - Persist the tournament leaderboard into `latest_cockpit_bundle.json` under `arena_tournament_standings`.
  - Verification: Run `py engine/run_pipeline.py --mode hourly_crypto_macro` and check bundle for populated `arena_tournament_standings`.

#### Phase 4: Signal-to-Execution Bridge & MT5 EA Export
- [ ] **Task 6: Wire Signal Prefill into `OrderExecutionModal`**
  - Files: `frontend/src/components/AiAgentArenaTab.jsx`, `frontend/src/components/HomeDashboardTab.jsx`
  - Changes: Update bot action buttons to pass `{ symbol, market, entryPrice, stopLoss, target1, target2, agentId }` to `onOpenExecution(prefill)`.
  - Verification: Click "Eksekusi" on Bot WATER card in Arena and verify `OrderExecutionModal` opens pre-filled.

- [ ] **Task 7: Publish MT5 Expert Advisor (`MBG_Institutional_Apex_EA.mq5`)**
  - Files: `engine/mt5/MBG_Institutional_Apex_EA.mq5`, `frontend/public/ea/MBG_Institutional_Apex_EA.mq5`
  - Changes: Verified complete with Bitget MT5 symbol compatibility, risk % lot sizing, ATR stops, and breakeven trailing.
  - Verification: Provide direct download button and raw code viewer in the new Flow Process tab.

#### Phase 5: "Flow Process & Architecture" Tab & README Update
- [ ] **Task 8: Add `FLOW_PROCESS` to Navigation Menu**
  - Files: `frontend/src/components/Sidebar.jsx`, `frontend/src/App.jsx`
  - Changes: Insert `{ id: 'FLOW_PROCESS', icon: '⚡', label: 'Flow Process & Architecture' }` between `ACADEMY` and `CHANGELOG`.
  - Verification: Verify sidebar displays the new tab in the requested exact position.

- [ ] **Task 9: Create `<FlowProcessTab.jsx />` Component**
  - Files: `frontend/src/components/FlowProcessTab.jsx`
  - Contents:
    - Interactive End-to-End System Flow diagram (Fetch $\to$ Analyze $\to$ Synthesize $\to$ Tournament $\to$ Execute).
    - Data Reality & Integrity Matrix (live vs delayed vs estimated disclosure).
    - 16 Bot Elemental Tournament Engine Specs (formulas, hyperparameters, champion selection).
    - MT5 Bitget EA Execution Architecture & Download Link.
    - AI Audit Reference Blueprint for automated evaluation.
  - Verification: Tab renders cleanly at 60 FPS without layout shifts.

- [ ] **Task 10: Update `README.md` on GitHub**
  - Files: `README.md`
  - Changes: Append comprehensive Section `🏗️ System Architecture & Data Flow Process` featuring Mermaid diagrams, data provenance tables, 16 bot specs, and Bitget MT5 EA documentation.
  - Verification: Review markdown formatting and link integrity.
