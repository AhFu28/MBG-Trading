# 24/7 Autonomous AI Multi-Agent Arena Continuous Execution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish an autonomous, high-frequency 24/7 background trading execution engine for all 16 AI Trading Agents via GitHub Actions unlimited public runners, enabling continuous order evaluation, trailing-stop ratcheting, and seamless client hydration even when the user is offline.

**Architecture:** Create a dedicated, ultra-lean Python evaluator runner (`engine/analyzer/arena_runner_247.py`) that operates purely with Python standard libraries (`urllib.request`), executing multi-tick evaluation loops against Binance live ticker streams. Deploy a dedicated GitHub Actions workflow (`.github/workflows/arena_247_engine.yml`) executing on an aggressive 5-minute schedule with multi-tick internal iterations (30s intervals), persisting updated positions and closed trades to `frontend/public/data/latest_arena_state.json`.

**Tech Stack:** Python 3.11 (Standard Library `urllib.request`, `json`, `uuid`, `datetime`), GitHub Actions CI/CD (Ubuntu-latest, Unlimited Public Runner Minutes), Vite/React (Frontend Hydration Engine).

---

## File Structure & Responsibilities

| Path | Responsibility |
| :--- | :--- |
| `engine/analyzer/arena_runner_247.py` | Standalone, zero-dependency runner. Pulls live Binance prices via standard `urllib.request`, loops through 16 agent strategies, ratchets trailing stops, deducts 0.12% Bitget fees, and persists state. |
| `.github/workflows/arena_247_engine.yml` | High-frequency continuous workflow running every 5 minutes (`*/5 * * * *`) with multi-tick 30s evaluation window and auto-commit to git. |
| `frontend/src/components/AiAgentArenaTab.jsx` | Client hydration engine ensuring seamless merge of offline trades and positions upon opening the cockpit. |
| `engine/tests/test_arena_runner_247.py` | Unit test suite verifying live price ingestion, trailing stop ratcheting, order spawning, and zero-leak compliance. |
| `CHANGELOG.md` | Institutional provenance documentation under `## [2026-09-26]`. |

---

## Tasks

### Task 1: Standalone Zero-Dependency 24/7 Arena Runner (`arena_runner_247.py`)

**Files:**
- Create: `engine/analyzer/arena_runner_247.py`
- Test: `engine/tests/test_arena_runner_247.py`

- [ ] **Step 1: Write unit test for the standalone runner**
  Verify that `ArenaRunner247`:
  - Successfully fetches Binance live ticker or gracefully uses fallback.
  - Correctly evaluates active positions, calculating floating PnL.
  - Ratchets trailing stop when profit $\ge 40\%$ towards TP1.
  - Closes positions at TP/SL with 0.12% Bitget fee deduction.
  - Concurrently spawns new orders for eligible agents with confidence $\ge 68\%$.

- [ ] **Step 2: Run test to verify initial failure**
  Run: `py -m unittest engine/tests/test_arena_runner_247.py`
  Expected: FAIL (`ModuleNotFoundError: No module named 'engine.analyzer.arena_runner_247'`).

- [ ] **Step 3: Implement `engine/analyzer/arena_runner_247.py`**
  - Implement using `urllib.request` (zero `pip install` required for maximum boot speed).
  - Include multi-tick loop capability: `--duration-seconds 240 --interval-seconds 30`.
  - Save output to `frontend/public/data/latest_arena_state.json`.

- [ ] **Step 4: Run unit tests to verify pass**
  Run: `py -m unittest engine/tests/test_arena_runner_247.py`
  Expected: PASS (All test assertions pass).

- [ ] **Step 5: Commit Task 1**
  `git commit -m "feat(arena): add standalone zero-dependency 24/7 arena runner"`

---

### Task 2: High-Frequency Continuous GitHub Actions Workflow (`arena_247_engine.yml`)

**Files:**
- Create: `.github/workflows/arena_247_engine.yml`
- Modify: `.github/workflows/hourly_crypto_macro.yml` (Ensure separation of concerns)

- [ ] **Step 1: Create `.github/workflows/arena_247_engine.yml`**
  - Trigger: `schedule` with `cron: '*/5 * * * *'`, `workflow_dispatch`, and `push: branches [main]` (path filtered).
  - Concurrency group: `arena-247-runner` with `cancel-in-progress: false` to prevent overlapping state writes.
  - Permissions: `contents: write`.
  - Execution: Run `python engine/analyzer/arena_runner_247.py --duration-seconds 240 --interval-seconds 30`.
  - Auto-commit step: Commit and push changes to `frontend/public/data/latest_arena_state.json`.

- [ ] **Step 2: Verify workflow syntax and run local dry-run**
  Run: `py engine/analyzer/arena_runner_247.py --duration-seconds 10 --interval-seconds 2`
  Expected: 5 evaluation cycles complete in ~10 seconds with updated `latest_arena_state.json`.

- [ ] **Step 3: Commit Task 2**
  `git commit -m "ci(workflow): add high-frequency 24/7 arena trading workflow"`

---

### Task 3: Client Hydration Verification & Production Build

**Files:**
- Modify: `frontend/src/components/AiAgentArenaTab.jsx`
- Test: Full test suite & Vite production build

- [ ] **Step 1: Verify frontend hydration contract**
  Confirm that `AiAgentArenaTab.jsx` correctly reads and merges `latest_arena_state.json` without overriding active local user state if local has newer timestamps.

- [ ] **Step 2: Run frontend build**
  Run: `npm --prefix frontend run build`
  Expected: 0 errors, all modules transformed cleanly.

- [ ] **Step 3: Run full backend test discovery**
  Run: `py -m unittest discover engine/tests`
  Expected: All unit tests pass.

- [ ] **Step 4: Commit Task 3**
  `git commit -m "chore(arena): verify client hydration and production build"`

---

### Task 4: Documentation & Remote Verification

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Document Sprint 13 under `## [2026-09-26]` in `CHANGELOG.md`**
  Record the transition to public repository status, unlimited GitHub Actions minutes, and the 24/7 continuous multi-tick trading runner.

- [ ] **Step 2: Push to GitHub origin main**
  Run: `git push origin main`

- [ ] **Step 3: Trigger workflow run via GitHub API / dispatch check**
  Verify the workflow runs successfully on GitHub Actions.
