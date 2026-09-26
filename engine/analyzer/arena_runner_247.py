"""
=============================================================================
MBG QUANT TRADING ENGINE — STANDALONE 24/7 ARENA CONTINUOUS RUNNER
=============================================================================
Zero-dependency, high-frequency autonomous trading runner for 16 AI Agents.
- Operates strictly with Python Standard Library (zero pip install delay).
- Ingests real-time Binance & macro market ticks via urllib.
- Ratchets trailing stops & deducts institutional 0.12% Bitget fees.
- Supports continuous multi-tick micro-loops for GitHub Actions & local runners.
- Persists state directly to frontend/public/data/latest_arena_state.json.
=============================================================================
"""

import os
import sys
import json
import time
import uuid
import logging
import argparse
import urllib.request
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ArenaRunner247")

DEFAULT_AGENTS = [
    {"id": "WATER", "name": "WATER", "role": "Smart Money Liquidity Flow", "strategy": "SMC_ORDER_BLOCK", "avatar": "🌊", "color": "#0ea5e9", "tier": "BASE", "winRate": 0.0, "totalTrades": 0, "totalRoiPct": 0, "activePositionsCount": 0},
    {"id": "FIRE", "name": "FIRE", "role": "Momentum & Volatility Breakout", "strategy": "NEWS_MOMENTUM", "avatar": "🔥", "color": "#ef4444", "tier": "BASE", "winRate": 0.0, "totalTrades": 0, "totalRoiPct": 0, "activePositionsCount": 0},
    {"id": "AIR", "name": "AIR", "role": "Donchian Trend Following", "strategy": "DONCHIAN_BREAKOUT", "avatar": "🌪️", "color": "#38bdf8", "tier": "BASE", "winRate": 0.0, "totalTrades": 0, "totalRoiPct": 0, "activePositionsCount": 0},
    {"id": "EARTH", "name": "EARTH", "role": "Mean Reversion & Value Accumulation", "strategy": "SUPPORT_REVERSION", "avatar": "⛰️", "color": "#eab308", "tier": "BASE", "winRate": 0.0, "totalTrades": 0, "totalRoiPct": 0, "activePositionsCount": 0},
    {"id": "STEAM", "name": "STEAM", "role": "Liquidity News Sniper [W+F]", "strategy": "TREND_PULLBACK", "avatar": "💨", "color": "#a855f7", "tier": "DUO", "winRate": 0.0, "totalTrades": 0, "totalRoiPct": 0, "activePositionsCount": 0},
    {"id": "STORM", "name": "STORM", "role": "SMC Trend Breakout [W+A]", "strategy": "VOLATILITY_BREAKOUT", "avatar": "⛈️", "color": "#06b6d4", "tier": "DUO", "winRate": 0.0, "totalTrades": 0, "totalRoiPct": 0, "activePositionsCount": 0},
    {"id": "MUD", "name": "MUD", "role": "Liquidity Reversal Absorber [W+E]", "strategy": "RANGE_ACCUMULATION", "avatar": "🧱", "color": "#84cc16", "tier": "DUO", "winRate": 0.0, "totalTrades": 0, "totalRoiPct": 0, "activePositionsCount": 0},
    {"id": "LIGHTNING", "name": "LIGHTNING", "role": "Hyper-Speed Trend Impulses [F+A]", "strategy": "IMPULSE_CHASING", "avatar": "⚡", "color": "#f59e0b", "tier": "DUO", "winRate": 0.0, "totalTrades": 0, "totalRoiPct": 0, "activePositionsCount": 0},
    {"id": "LAVA", "name": "LAVA", "role": "Violent Dip Momentum [F+E]", "strategy": "CAPITULATION_BOUNCE", "avatar": "🔥", "color": "#f43f5e", "tier": "DUO", "winRate": 0.0, "totalTrades": 0, "totalRoiPct": 0, "activePositionsCount": 0},
    {"id": "SANDSTORM", "name": "SANDSTORM", "role": "Breakout Reversion Hybrid [A+E]", "strategy": "FALSE_BREAKOUT_FADE", "avatar": "🏜️", "color": "#d97706", "tier": "DUO", "winRate": 0.0, "totalTrades": 0, "totalRoiPct": 0, "activePositionsCount": 0},
    {"id": "TEMPEST", "name": "TEMPEST", "role": "Macro Cyclone Trend Apex [W+F+A]", "strategy": "TRIPLE_CONFLUENCE", "avatar": "🌀", "color": "#8b5cf6", "tier": "TRIO", "winRate": 0.0, "totalTrades": 0, "totalRoiPct": 0, "activePositionsCount": 0},
    {"id": "GEOTHERMAL", "name": "GEOTHERMAL", "role": "Liquidity Expansion Burst [W+F+E]", "strategy": "VOLATILITY_EXPANSION", "avatar": "🌋", "color": "#ec4899", "tier": "TRIO", "winRate": 0.0, "totalTrades": 0, "totalRoiPct": 0, "activePositionsCount": 0},
    {"id": "OCEANIC", "name": "OCEANIC", "role": "Trend Range Freeze [W+A+E]", "strategy": "TREND_CHANNEL_REVERSION", "avatar": "🌊", "color": "#0284c7", "tier": "TRIO", "winRate": 0.0, "totalTrades": 0, "totalRoiPct": 0, "activePositionsCount": 0},
    {"id": "CYCLONE", "name": "CYCLONE", "role": "Violent Reversal Eruption [F+A+E]", "strategy": "ASYMMETRIC_REVERSAL", "avatar": "🌪️", "color": "#14b8a6", "tier": "TRIO", "winRate": 0.0, "totalTrades": 0, "totalRoiPct": 0, "activePositionsCount": 0},
    {"id": "AVATAR", "name": "AVATAR", "role": "Omni-Element Sovereign Master", "strategy": "FULL_QUAD_SYNTHESIS", "avatar": "☯️", "color": "#10b981", "tier": "MASTER", "winRate": 0.0, "totalTrades": 0, "totalRoiPct": 0, "activePositionsCount": 0},
    {"id": "CHAOS", "name": "CHAOS", "role": "Dynamic Adaptive Bandit", "strategy": "EXP3_DYNAMIC_SAMPLING", "avatar": "🎲", "color": "#e11d48", "tier": "CHAOS", "winRate": 0.0, "totalTrades": 0, "totalRoiPct": 0, "activePositionsCount": 0}
]

TARGET_UNIVERSE = [
    "BTCUSDT", "ETHUSDT", "SOLUSDT", "FETUSDT", "RENDERUSDT",
    "NEARUSDT", "LINKUSDT", "AVAXUSDT", "DOGEUSDT", "BNBUSDT",
    "ADAUSDT", "XRPUSDT", "SUIUSDT", "PEPEUSDT", "TAOUSDT", "XAUUSD"
]

class ArenaRunner247:
    def __init__(self, state_file_path: Optional[str] = None):
        if state_file_path:
            self.state_file = state_file_path
        else:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            self.state_file = os.path.join(base_dir, "frontend", "public", "data", "latest_arena_state.json")
        
        self.state = self._load_state()

    def _load_state(self) -> Dict[str, Any]:
        if os.path.exists(self.state_file):
            try:
                with open(self.state_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, dict) and "agents" in data and "positions" in data:
                        return data
            except Exception as e:
                logger.warning(f"Could not load state from {self.state_file}: {e}")

        return {
            "agents": DEFAULT_AGENTS,
            "positions": [],
            "journal": [],
            "session_id": int(time.time()),
            "last_evaluated": datetime.now(timezone.utc).isoformat()
        }

    def _save_state(self):
        try:
            os.makedirs(os.path.dirname(self.state_file), exist_ok=True)
            self.state["last_evaluated"] = datetime.now(timezone.utc).isoformat()
            temp_file = f"{self.state_file}.tmp"
            with open(temp_file, "w", encoding="utf-8") as f:
                json.dump(self.state, f, indent=2, default=str)
            os.replace(temp_file, self.state_file)
        except Exception as e:
            logger.error(f"Failed to persist state: {e}")

    def fetch_live_prices(self) -> Dict[str, Dict[str, float]]:
        prices: Dict[str, Dict[str, float]] = {}
        # 1. Fetch Binance 24hr tickers
        try:
            req = urllib.request.Request(
                "https://api.binance.com/api/v3/ticker/24hr",
                headers={"User-Agent": "MBG-Arena/1.0"}
            )
            with urllib.request.urlopen(req, timeout=4) as response:
                if response.status == 200:
                    raw = json.loads(response.read().decode("utf-8"))
                    for item in raw:
                        sym = item.get("symbol")
                        p = float(item.get("lastPrice", 0))
                        chg = float(item.get("priceChangePercent", 0))
                        h = float(item.get("highPrice", p))
                        l = float(item.get("lowPrice", p))
                        if p > 0:
                            prices[sym] = {"price": p, "changePct": chg, "high": h, "low": l}
        except Exception as e:
            logger.debug(f"Binance fetch notice: {e}")

        # 2. Fetch Gold (XAUUSD) quote via Yahoo Finance
        try:
            req = urllib.request.Request(
                "https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1m&range=1d",
                headers={"User-Agent": "Mozilla/5.0"}
            )
            with urllib.request.urlopen(req, timeout=4) as response:
                if response.status == 200:
                    raw = json.loads(response.read().decode("utf-8"))
                    meta = raw.get("chart", {}).get("result", [{}])[0].get("meta", {})
                    p = float(meta.get("regularMarketPrice", 0))
                    if p > 2000:
                        prices["XAUUSD"] = {"price": p, "changePct": 0.5, "high": p * 1.01, "low": p * 0.99}
        except Exception:
            pass

        return prices

    def compute_agent_confluence(self, agent_id: str, sym: str, quote: dict) -> tuple:
        price = quote.get("price", 0)
        chg = quote.get("changePct", 0)
        high = quote.get("high", price * 1.01)
        low = quote.get("low", price * 0.99)
        rng = high - low if high > low else price * 0.02
        range_pos = (price - low) / rng if rng > 0 else 0.5

        is_long = True
        confidence = 55
        rationale = ""

        if agent_id in ["WATER", "STEAM"]:
            is_long = range_pos < 0.40 or chg < -1.0
            confidence = 68 + int(abs(range_pos - 0.5) * 40)
            rationale = f"{agent_id} [SMC]: Liquidity sweep {'Discount' if is_long else 'Premium'} ({range_pos*100:.0f}%) pada {sym}."
        elif agent_id in ["FIRE", "LIGHTNING"]:
            is_long = chg > 1.2
            confidence = 65 + min(28, int(abs(chg) * 6))
            rationale = f"{agent_id} [Momentum]: Volatility surge ({chg:+.2f}%) breakout pada {sym}."
        elif agent_id in ["AIR", "STORM"]:
            is_long = range_pos > 0.70 or chg > 1.5
            confidence = 68 + int(abs(range_pos - 0.5) * 35)
            rationale = f"{agent_id} [Donchian]: Range breakout ({range_pos*100:.0f}%) ekspansi tren pada {sym}."
        elif agent_id in ["EARTH", "MUD"]:
            is_long = range_pos < 0.30 or chg < -2.5
            confidence = 66 + int(abs(chg) * 4)
            rationale = f"{agent_id} [Mean Reversion]: Statistical support bounce ({chg:+.2f}%) pada {sym}."
        elif agent_id in ["LAVA", "GEOTHERMAL"]:
            is_long = chg < -2.0
            confidence = 67 + int(abs(chg) * 5)
            rationale = f"{agent_id} [Capitulation]: Panic sell absorption bounce pada {sym}."
        elif agent_id in ["SANDSTORM", "CYCLONE"]:
            is_long = range_pos < 0.35 if chg > 0 else range_pos > 0.65
            confidence = 69 + int(abs(range_pos - 0.5) * 30)
            rationale = f"{agent_id} [Regime Transition]: Asymmetric shift pada {sym}."
        else:
            # TEMPEST, OCEANIC, AVATAR, CHAOS
            is_long = chg >= 0
            confidence = 68 + int(abs(chg) * 5)
            rationale = f"{agent_id} [Synthesis]: Multi-factor technical confluence ({chg:+.2f}%) pada {sym}."

        return is_long, min(92, max(50, confidence)), rationale

    def evaluate_cycle(self, live_prices: Dict[str, Any]):
        if not live_prices:
            return

        positions = self.state.get("positions", [])
        journal = self.state.get("journal", [])
        agents_dict = {a["id"]: a for a in self.state.get("agents", DEFAULT_AGENTS)}

        remaining = []
        closed_now = []

        # 1. EVALUATE ACTIVE RUNNING POSITIONS
        for pos in positions:
            sym = pos.get("symbol")
            quote = live_prices.get(sym)
            if not quote:
                remaining.append(pos)
                continue

            curr_price = float(quote.get("price", 0))
            if curr_price <= 0:
                remaining.append(pos)
                continue

            pos["currentPrice"] = curr_price
            direction = pos.get("direction", "LONG")
            entry = float(pos.get("entryPrice", curr_price))
            sl = float(pos.get("slPrice", 0))
            tp1 = float(pos.get("tp1Price", 0))
            tp2 = float(pos.get("tp2Price", 0))

            delta = (curr_price - entry) if direction == "LONG" else (entry - curr_price)
            roi = (delta / entry * 100) if entry > 0 else 0
            pos["roiPct"] = round(roi, 2)

            # Dynamic Trailing Stop Ratchet (at 40% towards TP1, lock 30% profit)
            if direction == "LONG":
                tp_dist = tp1 - entry
                if tp_dist > 0 and curr_price >= (entry + tp_dist * 0.40):
                    pos["trailingStopActive"] = True
                    ratchet_sl = entry + (curr_price - entry) * 0.30
                    if ratchet_sl > sl:
                        pos["slPrice"] = round(ratchet_sl, 4 if curr_price < 10 else 2)
            else:
                tp_dist = entry - tp1
                if tp_dist > 0 and curr_price <= (entry - tp_dist * 0.40):
                    pos["trailingStopActive"] = True
                    ratchet_sl = entry - (entry - curr_price) * 0.30
                    if ratchet_sl < sl or sl == 0:
                        pos["slPrice"] = round(ratchet_sl, 4 if curr_price < 10 else 2)

            # Check TP/SL Triggers
            should_close = False
            exit_reason = ""
            exit_p = curr_price

            if direction == "LONG":
                if tp2 > 0 and curr_price >= tp2:
                    should_close = True; exit_reason = "HIT_TP2"; exit_p = tp2
                elif tp1 > 0 and curr_price >= tp1:
                    should_close = True; exit_reason = "HIT_TP1"; exit_p = tp1
                elif sl > 0 and curr_price <= pos["slPrice"]:
                    should_close = True
                    exit_reason = "TRAILING_STOP" if pos.get("trailingStopActive") else "HIT_SL"
                    exit_p = pos["slPrice"]
            else:
                if tp2 > 0 and curr_price <= tp2:
                    should_close = True; exit_reason = "HIT_TP2"; exit_p = tp2
                elif tp1 > 0 and curr_price <= tp1:
                    should_close = True; exit_reason = "HIT_TP1"; exit_p = tp1
                elif sl > 0 and curr_price >= pos["slPrice"]:
                    should_close = True
                    exit_reason = "TRAILING_STOP" if pos.get("trailingStopActive") else "HIT_SL"
                    exit_p = pos["slPrice"]

            if should_close:
                trade_delta = (exit_p - entry) if direction == "LONG" else (entry - exit_p)
                raw_roi = (trade_delta / entry * 100) if entry > 0 else 0
                net_roi = raw_roi - 0.12 # Real Bitget 0.12% roundtrip taker fee + spread slippage

                trade_record = {
                    "id": f"TRD-{pos.get('id', uuid.uuid4().hex[:6])}",
                    "agentId": pos.get("agentId"),
                    "symbol": sym,
                    "direction": direction,
                    "entryPrice": entry,
                    "exitPrice": exit_p,
                    "rawRoiPct": round(raw_roi, 2),
                    "netRoiPct": round(net_roi, 2),
                    "pnlPct": round(net_roi, 2),
                    "exitReason": exit_reason,
                    "isWin": net_roi > 0,
                    "openedAt": pos.get("openedAt"),
                    "closedAt": datetime.now(timezone.utc).isoformat(),
                    "rationale": pos.get("rationale")
                }
                closed_now.append(trade_record)

                # Update agent lifetime stats
                ag = agents_dict.get(pos.get("agentId"))
                if ag:
                    ag["totalTrades"] = ag.get("totalTrades", 0) + 1
                    ag["totalRoiPct"] = round(ag.get("totalRoiPct", 0) + net_roi, 2)
                    agent_trades = [t for t in journal if t.get("agentId") == ag["id"]] + [trade_record]
                    wins = sum(1 for t in agent_trades if t.get("isWin"))
                    ag["winRate"] = round((wins / len(agent_trades)) * 100, 1)
            else:
                remaining.append(pos)

        if closed_now:
            journal.extend(closed_now)
            if len(journal) > 400:
                journal = journal[-400:]
            self.state["journal"] = journal

        # 2. CONCURRENT INDEPENDENT ORDER SPAWNER (100% Concurrent, Zero Round-Robin)
        max_pos_per_agent = 3
        for ag_id, ag in agents_dict.items():
            ag_open = [p for p in remaining if p.get("agentId") == ag_id]
            if len(ag_open) >= max_pos_per_agent:
                continue

            best_sig = None
            best_sym = None
            best_quote = None
            highest_conf = 0

            for sym in TARGET_UNIVERSE:
                if any(p.get("symbol") == sym and p.get("agentId") == ag_id for p in remaining):
                    continue
                q = live_prices.get(sym)
                if not q or q.get("price", 0) <= 0:
                    continue

                is_l, conf, rat = self.compute_agent_confluence(ag_id, sym, q)
                if conf >= 68 and conf > highest_conf:
                    highest_conf = conf
                    best_sig = (is_l, conf, rat)
                    best_sym = sym
                    best_quote = q

            if best_sig and best_sym and best_quote:
                is_l, conf, rat = best_sig
                entry_p = best_quote["price"]
                sl_ratio = 0.015 if best_sym != "XAUUSD" else 0.008
                tp1_ratio = 0.030 if best_sym != "XAUUSD" else 0.016
                tp2_ratio = 0.050 if best_sym != "XAUUSD" else 0.026

                sl_val = entry_p * (1 - sl_ratio) if is_l else entry_p * (1 + sl_ratio)
                tp1_val = entry_p * (1 + tp1_ratio) if is_l else entry_p * (1 - tp1_ratio)
                tp2_val = entry_p * (1 + tp2_ratio) if is_l else entry_p * (1 - tp2_ratio)
                dec = 4 if entry_p < 10 else 2

                new_position = {
                    "id": f"POS-{ag_id}-{best_sym}-{uuid.uuid4().hex[:4].upper()}",
                    "agentId": ag_id,
                    "symbol": best_sym,
                    "market": "COMMODITY" if best_sym == "XAUUSD" else "CRYPTO",
                    "direction": "LONG" if is_l else "SHORT",
                    "entryPrice": entry_p,
                    "currentPrice": entry_p,
                    "slPrice": round(sl_val, dec),
                    "tp1Price": round(tp1_val, dec),
                    "tp2Price": round(tp2_val, dec),
                    "roiPct": 0.0,
                    "trailingStopActive": False,
                    "openedAt": datetime.now(timezone.utc).isoformat(),
                    "rationale": rat
                }
                remaining.append(new_position)
                logger.info(f"Agent {ag_id} spawned {new_position['direction']} {best_sym} @ {entry_p} (Conf: {conf}%)")

        for ag_id, ag in agents_dict.items():
            ag["activePositionsCount"] = sum(1 for p in remaining if p.get("agentId") == ag_id)

        self.state["positions"] = remaining
        self.state["agents"] = list(agents_dict.values())
        self._save_state()

    def run_continuous_loop(self, duration_seconds: int = 240, interval_seconds: int = 30):
        logger.info(f"Starting Arena 24/7 loop for {duration_seconds}s (interval: {interval_seconds}s)...")
        end_time = time.time() + duration_seconds
        tick = 0
        while time.time() < end_time:
            tick += 1
            t0 = time.time()
            prices = self.fetch_live_prices()
            self.evaluate_cycle(prices)
            elapsed = time.time() - t0
            logger.info(f"Tick #{tick} finished in {elapsed:.3f}s. Active: {len(self.state['positions'])}, Journal: {len(self.state['journal'])}")
            
            sleep_time = max(1.0, interval_seconds - elapsed)
            if time.time() + sleep_time > end_time:
                break
            time.sleep(sleep_time)

        logger.info("Arena 24/7 continuous session complete.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MBG 24/7 Arena Continuous Runner")
    parser.add_argument("--duration-seconds", type=int, default=240, help="Total duration to run loop")
    parser.add_argument("--interval-seconds", type=int, default=30, help="Interval between evaluation ticks")
    args = parser.parse_args()

    runner = ArenaRunner247()
    runner.run_continuous_loop(duration_seconds=args.duration_seconds, interval_seconds=args.interval_seconds)
