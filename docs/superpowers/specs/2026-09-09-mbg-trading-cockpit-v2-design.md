# Implementation Plan: MBG Trading Cockpit v2 (Autonomous Quant, SMC, Bandarmology & AI Foundation Intelligence)

> **Plan Identifier:** `mbg-trading-cockpit-v2-master-plan`  
> **Date:** 2026-09-09  
> **Status:** CONSOLIDATED & READY FOR STEP-BY-STEP IMPLEMENTATION  
> **Synergy Inputs:** IHSG Screener v4.0 Â· BandarMetrics Â· Stockbit Bandarmology Â· Matt Pocock Skills Â· Google TimesFM 2.5

---

## 1. Executive Summary & Architectural Synergy

This master plan consolidates our previous 4-pillar quant design with strategic breakthroughs from the analyzed platforms and AI foundation models:

1. **Pillar 1: Backtesting Engine with Historical Benchmarking**
   - Event-driven execution simulating intra-bar slippage (IDX price tick brackets /*fraksi harga*/ and Binance spot spread) + realistic transaction fees ($0.15\%$ buy / $0.25\%$ sell IDX, $0.10\%$ Crypto).
   - Standard quant metrics: Sharpe, Sortino, Calmar, Max Drawdown, Win Rate, Profit Factor, Mathematical Expectancy ($E_R$), and Deflated Sharpe Ratio (DSR).

2. **Pillar 2: Current Test (Paper Trading) with Continuous Meta-Learning**
   - Autonomous state-machine lifecycle: `PENDING_ENTRY` $\to$ `ACTIVE_POSITION` $\to$ `TP1_HIT` (lock 50%, trail SL to BE) $\to$ `TP2_HIT` or `STOPPED_OUT`.
   - **Multi-Armed Bandit (Exp3) Learning Loop**: Automatically decays weights of failing strategy archetypes ($E_R < 0$ or $WR < 38\% \implies$ `INCUBATION_MODE`) and elevates top-performing strategies into `HIGH_CONVICTION` status.

3. **Pillar 3: Smart Money Concepts (SMC) + Bandarmology (IIFS)**
   - *Western SMC*: Algorithmic detection of Order Blocks (OB), Fair Value Gaps (FVG) with Consequent Encroachment (50%), BOS/CHoCH, and Liquidity Sweeps (*Turtle Soup*).
   - *IDX Bandarmology (Stockbit inspiration)*: Quantified **IDX Institutional Flow Score ($IIFS$)** combining Net Foreign Flow Z-score ($Z_{NFF}$), Top 3 Broker accumulation ratio, and Foreign Average Price ($P_{\text{foreign\_avg}}$).

4. **Pillar 4: News & Event-Driven Impact Radar**
   - 5 structured catalyst buckets: Macro / Fed / BI Rate, Commodity Shocks (Brent Crude, Gold), IDX Earnings & Corporate Actions, Geopolitics, and Crypto Token Unlocks.
   - Cross-asset elasticity matrix ($\beta$) computing immediate and decaying price drift expectations.

5. **Pillar 5: Google TimesFM 2.5 Zero-Shot Probabilistic AI Forecast (NEW)**
   - Foundation model (`google/timesfm-2.5-200m-pytorch`) generating zero-shot 5-to-20 session forward paths with calibrated $80\%$ & $90\%$ prediction intervals ($q_{10} \dots q_{90}$).
   - **Lightweight Architecture**: Runs pre-computed for Top 10 IDX & Top 10 Crypto assets during pipeline runs with a fast fallback to statistical Holt-Winters/GARCH when running on low-resource environments.

6. **Pillar 6: Next-Gen Terminal UI (IHSG Screener & BandarMetrics Inspiration)**
   - Sub-navigation within Master Quant Leaderboard:
     - `ðŸ”¥ LIVE LEADERBOARD`: Hybrid SMC + Bandarmology ranks with conviction badges.
     - `ðŸ§ª CURRENT TEST (PAPER PORTFOLIO)`: Active positions, live PnL %, win rate, and manual virtual buy.
     - `ðŸ“Š BACKTEST LAB`: Historical equity curves and strategy archetype stats.
     - `âš¡ SMC & EVENT RADAR`: Visual unmitigated Order Blocks, FVGs, and news elasticity impact.
   - Embed BandarMetrics-style TradingView Sector Heatmap and IHSG mini snapshot.

---

## 2. File & Directory Structure Changes

```
engine/
â”œâ”€â”€ analyzer/
â”‚   â”œâ”€â”€ smc_detector.py             [NEW] Algorithmic SMC (OB, FVG, BOS, CHoCH, Sweeps)
â”‚   â”œâ”€â”€ bandarmology_iifs.py        [NEW] IDX Institutional Flow Score & Broker Accumulation
â”‚   â”œâ”€â”€ event_impact_radar.py       [NEW] Event classification & cross-asset drift estimation
â”‚   â”œâ”€â”€ timesfm_forecaster.py       [NEW] TimesFM 2.5 zero-shot probabilistic price path forecasting
â”‚   â””â”€â”€ llm_brain.py                [MODIFY] Integrate SMC, IIFS, and TimesFM intervals into trade plans
â”œâ”€â”€ backtester/
â”‚   â”œâ”€â”€ backtest_engine.py          [NEW] Event-driven intra-bar backtest simulator
â”‚   â””â”€â”€ performance_metrics.py      [NEW] Sharpe, Sortino, MDD, Calmar, Expectancy, DSR
â”œâ”€â”€ paper_trading/
â”‚   â”œâ”€â”€ virtual_portfolio.py        [NEW] Forward paper trading state machine & live PnL tracking
â”‚   â””â”€â”€ meta_learner.py             [NEW] Exp3 reinforcement weighting loop
â”œâ”€â”€ database/
â”‚   â”œâ”€â”€ schema.sql                  [MODIFY] Add tables: virtual_trades, strategy_telemetry, smc_levels
â”‚   â””â”€â”€ supabase_client.py          [MODIFY] Storage and query methods for paper portfolio & metrics
â””â”€â”€ run_pipeline.py                 [MODIFY] Orchestrate new modules and export consolidated bundle

frontend/src/
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ MasterQuantLeaderboard.jsx  [MODIFY] Main hub with sub-tabs for Live, Paper, Backtest, SMC
â”‚   â”œâ”€â”€ VirtualForwardPortfolio.jsx [NEW] Real-time paper trading tracker & manual virtual buy modal
â”‚   â”œâ”€â”€ BacktestPerformanceLab.jsx  [NEW] Equity curve charts, strategy scoreboards, and drawdown metrics
â”‚   â”œâ”€â”€ SmcEventRadarWidget.jsx     [NEW] Order Block / FVG cards and news catalyst elasticity feeds
â”‚   â””â”€â”€ SectorHeatmapWidget.jsx     [NEW] BandarMetrics-inspired TradingView sector heatmap embed
â””â”€â”€ App.jsx                         [MODIFY] Wire new dataset fields to components
```

---

## 3. Implementation Tasks (Bite-Sized Sprints)

### Phase 1: Core Quant Engines (Backend)
- [ ] **Task 1.1**: Build `engine/analyzer/smc_detector.py` (BOS, CHoCH, OB, FVG, Liquidity Sweeps).
- [ ] **Task 1.2**: Build `engine/analyzer/bandarmology_iifs.py` (Net Foreign Flow Z-scores, Broker accumulation ratios).
- [ ] **Task 1.3**: Build `engine/paper_trading/virtual_portfolio.py` & `engine/paper_trading/meta_learner.py` (State machine + Exp3 reinforcement loop).
- [ ] **Task 1.4**: Build `engine/backtester/backtest_engine.py` & `engine/backtester/performance_metrics.py` (Slippage, fees, Sharpe, Expectancy).
- [ ] **Task 1.5**: Build `engine/analyzer/event_impact_radar.py` (Catalyst categories, elasticity drift $\Delta \hat{P}$).
- [ ] **Task 1.6**: Build `engine/analyzer/timesfm_forecaster.py` (TimesFM 2.5 zero-shot quantiles with lightweight statistical fallback).

### Phase 2: Pipeline Integration & Data Storage
- [ ] **Task 2.1**: Update `engine/database/supabase_client.py` & `engine/database/schema.sql` to support paper trades, SMC structures, and backtest cache.
- [ ] **Task 2.2**: Update `engine/run_pipeline.py` to run SMC + Bandarmology detection, update paper trades, calculate meta-weights, and output bundle.

### Phase 3: Frontend Quant Terminal UI
- [ ] **Task 3.1**: Create `VirtualForwardPortfolio.jsx` (Live PnL %, open/closed trades table, manual paper trade trigger).
- [ ] **Task 3.2**: Create `BacktestPerformanceLab.jsx` (Strategy archetype cards, Win Rate vs Expectancy, Deflated Sharpe).
- [ ] **Task 3.3**: Create `SmcEventRadarWidget.jsx` (Unmitigated Order Blocks, FVGs, and news elasticity drift cards).
- [ ] **Task 3.4**: Create `SectorHeatmapWidget.jsx` (TradingView sector heatmap embed).
- [ ] **Task 3.5**: Integrate sub-tabs into `MasterQuantLeaderboard.jsx` and update `App.jsx`.

---

## 4. Verification Plan

### Automated Verification
1. **SMC & Bandarmology Tests**: Run verification script on historical sample OHLCV data to confirm OB and FVG bounds are strictly non-overlapping and accurately flagged.
2. **Paper Trading State Transitions**: Verify `PENDING` $\to$ `ACTIVE` $\to$ `TP1_HIT` $\to$ `TP2_HIT` or `STOPPED_OUT` with zero lookahead bias.
3. **Pipeline End-to-End**:
   ```bash
   py engine/run_pipeline.py --mode all
   ```
   Confirm `frontend/public/data/latest_cockpit_bundle.json` successfully includes `virtual_portfolio`, `strategy_performance`, `smc_radar`, and `event_radar`.

### Manual UI Verification
1. Launch dashboard (`cd frontend && npm run dev`).
2. Verify switching between:
   - **Live Alpha Leaderboard** (with SMC & IIFS tags)
   - **Current Test (Paper Portfolio)** (live PnL %, TP/SL triggers, manual buy button)
   - **Backtest Lab** (Sharpe, Expectancy, Win Rate per archetype)
   - **Smart Money & Event Radar** (unmitigated OB/FVG map + event elasticity drift)
   - **Sector Heatmap** (TradingView live embed)

