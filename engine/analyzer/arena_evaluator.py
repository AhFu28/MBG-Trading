"""
=============================================================================
MBG QUANT TRADING ENGINE — AUTONOMOUS 24/7 MULTI-AGENT ARENA EVALUATOR
=============================================================================
Executes scheduled background evaluation for the 16 AI Trading Agents:
1. Validates & ratchets open positions against 100% REAL LIVE MARKET PRICES.
2. Checks TP1, TP2, Trailing Stop, and SL triggers.
3. Generates high-conviction trade plans for eligible agents across Crypto (24/7),
   Forex, Gold (XAUUSD), and Indices.
4. Enforces Sovereign Margin Call (MC <= 15%) & Darwinian DNA Evolution.
5. Persists state to cache, public JSON, and Supabase for seamless client hydration.
=============================================================================
"""

import os
import json
import logging
import uuid
from datetime import datetime, timezone

logger = logging.getLogger("ArenaEvaluator")

DEFAULT_AGENTS_SEED = [
    {"id": "WATER", "name": "WATER", "role": "Smart Money Liquidity Flow", "strategy": "SMC_ORDER_BLOCK", "avatar": "🌊", "color": "#0ea5e9", "tier": "BASE", "generation": 0, "resetCount": 0, "dnaTraits": {"riskMultiplier": 1.0, "confidenceBoost": 0, "trailingTightness": 1.0}},
    {"id": "FIRE", "name": "FIRE", "role": "Momentum & Volatility Breakout", "strategy": "NEWS_MOMENTUM", "avatar": "🔥", "color": "#ef4444", "tier": "BASE", "generation": 0, "resetCount": 0, "dnaTraits": {"riskMultiplier": 1.0, "confidenceBoost": 0, "trailingTightness": 1.0}},
    {"id": "AIR", "name": "AIR", "role": "Donchian Trend Following", "strategy": "DONCHIAN_BREAKOUT", "avatar": "🌪️", "color": "#38bdf8", "tier": "BASE", "generation": 0, "resetCount": 0, "dnaTraits": {"riskMultiplier": 1.0, "confidenceBoost": 0, "trailingTightness": 1.0}},
    {"id": "EARTH", "name": "EARTH", "role": "Mean Reversion & Value Accumulation", "strategy": "SUPPORT_REVERSION", "avatar": "⛰️", "color": "#eab308", "tier": "BASE", "generation": 0, "resetCount": 0, "dnaTraits": {"riskMultiplier": 1.0, "confidenceBoost": 0, "trailingTightness": 1.0}},
    {"id": "STEAM", "name": "STEAM", "role": "Liquidity News Sniper [W+F]", "strategy": "TREND_PULLBACK", "avatar": "💨", "color": "#a855f7", "tier": "DUO", "generation": 0, "resetCount": 0, "dnaTraits": {"riskMultiplier": 1.0, "confidenceBoost": 0, "trailingTightness": 1.0}},
    {"id": "STORM", "name": "STORM", "role": "SMC Trend Breakout [W+A]", "strategy": "VOLATILITY_BREAKOUT", "avatar": "⛈️", "color": "#06b6d4", "tier": "DUO", "generation": 0, "resetCount": 0, "dnaTraits": {"riskMultiplier": 1.0, "confidenceBoost": 0, "trailingTightness": 1.0}},
    {"id": "MUD", "name": "MUD", "role": "Liquidity Reversal Absorber [W+E]", "strategy": "RANGE_ACCUMULATION", "avatar": "🧱", "color": "#84cc16", "tier": "DUO", "generation": 0, "resetCount": 0, "dnaTraits": {"riskMultiplier": 1.0, "confidenceBoost": 0, "trailingTightness": 1.0}},
    {"id": "LIGHTNING", "name": "LIGHTNING", "role": "Hyper-Speed Trend Impulses [F+A]", "strategy": "IMPULSE_CHASING", "avatar": "⚡", "color": "#f59e0b", "tier": "DUO", "generation": 0, "resetCount": 0, "dnaTraits": {"riskMultiplier": 1.0, "confidenceBoost": 0, "trailingTightness": 1.0}},
    {"id": "LAVA", "name": "LAVA", "role": "Violent Dip Momentum [F+E]", "strategy": "CAPITULATION_BOUNCE", "avatar": "🔥", "color": "#f43f5e", "tier": "DUO", "generation": 0, "resetCount": 0, "dnaTraits": {"riskMultiplier": 1.0, "confidenceBoost": 0, "trailingTightness": 1.0}},
    {"id": "SANDSTORM", "name": "SANDSTORM", "role": "Breakout Reversion Hybrid [A+E]", "strategy": "FALSE_BREAKOUT_FADE", "avatar": "🏜️", "color": "#d97706", "tier": "DUO", "generation": 0, "resetCount": 0, "dnaTraits": {"riskMultiplier": 1.0, "confidenceBoost": 0, "trailingTightness": 1.0}},
    {"id": "TEMPEST", "name": "TEMPEST", "role": "Macro Cyclone Trend Apex [W+F+A]", "strategy": "TRIPLE_CONFLUENCE", "avatar": "🌀", "color": "#8b5cf6", "tier": "TRIO", "generation": 0, "resetCount": 0, "dnaTraits": {"riskMultiplier": 1.0, "confidenceBoost": 0, "trailingTightness": 1.0}},
    {"id": "GEOTHERMAL", "name": "GEOTHERMAL", "role": "Liquidity Expansion Burst [W+F+E]", "strategy": "VOLATILITY_EXPANSION", "avatar": "🌋", "color": "#ec4899", "tier": "TRIO", "generation": 0, "resetCount": 0, "dnaTraits": {"riskMultiplier": 1.0, "confidenceBoost": 0, "trailingTightness": 1.0}},
    {"id": "OCEANIC", "name": "OCEANIC", "role": "Trend Range Freeze [W+A+E]", "strategy": "TREND_CHANNEL_REVERSION", "avatar": "🌊", "color": "#0284c7", "tier": "TRIO", "generation": 0, "resetCount": 0, "dnaTraits": {"riskMultiplier": 1.0, "confidenceBoost": 0, "trailingTightness": 1.0}},
    {"id": "CYCLONE", "name": "CYCLONE", "role": "Violent Reversal Eruption [F+A+E]", "strategy": "ASYMMETRIC_REVERSAL", "avatar": "🌪️", "color": "#14b8a6", "tier": "TRIO", "generation": 0, "resetCount": 0, "dnaTraits": {"riskMultiplier": 1.0, "confidenceBoost": 0, "trailingTightness": 1.0}},
    {"id": "AVATAR", "name": "AVATAR", "role": "Omni-Element Sovereign Master", "strategy": "FULL_QUAD_SYNTHESIS", "avatar": "☯️", "color": "#10b981", "tier": "MASTER", "generation": 0, "resetCount": 0, "dnaTraits": {"riskMultiplier": 1.0, "confidenceBoost": 0, "trailingTightness": 1.0}},
    {"id": "CHAOS", "name": "CHAOS", "role": "Dynamic Adaptive Bandit", "strategy": "EXP3_DYNAMIC_SAMPLING", "avatar": "🎲", "color": "#e11d48", "tier": "CHAOS", "generation": 0, "resetCount": 0, "dnaTraits": {"riskMultiplier": 1.0, "confidenceBoost": 0, "trailingTightness": 1.0}}
]

class ArenaEvaluator:
    def __init__(self, capital_per_bot_idr=10_000_000, risk_pct=0.015):
        self.capital_per_bot_idr = capital_per_bot_idr
        self.risk_pct = risk_pct
        self.state_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cache", "arena_state.json")
        # Non-public path: arena state must not ship as a downloadable static asset.
        self.public_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cache", "latest_arena_state.json")
        self.state = self._load_state()

    def _load_state(self) -> dict:
        # BE-29: two writers share these files (the hourly evaluator and the
        # long-session runner). Adopting an older timeline would make the public
        # state jump backward when this evaluator overwrites the runner's newer
        # progress - so the file with the newest last_evaluated wins.
        candidates = []
        for path in [self.state_file, self.public_file]:
            if os.path.exists(path):
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        if isinstance(data, dict) and "agents" in data and "positions" in data:
                            candidates.append((str(data.get("last_evaluated") or ""), path, data))
                except Exception as e:
                    logger.warning(f"Failed to load arena state from {path}: {e}")
        if candidates:
            candidates.sort(key=lambda c: c[0], reverse=True)
            if len(candidates) > 1 and candidates[0][0] != candidates[1][0]:
                logger.info(f"Arena state adopted from {candidates[0][1]} (newest last_evaluated {candidates[0][0]})")
            return candidates[0][2]

        # Initialize fresh state
        return {
            "agents": DEFAULT_AGENTS_SEED,
            "positions": [],
            "journal": [],
            "session_id": 1,
            "last_evaluated": datetime.now(timezone.utc).isoformat()
        }

    def _save_state(self):
        self.state["last_evaluated"] = datetime.now(timezone.utc).isoformat()
        for path in [self.state_file, self.public_file]:
            try:
                os.makedirs(os.path.dirname(path), exist_ok=True)
                # Atomic replace: a torn write here would be read as corrupt state
                # by the next writer (the runner already does temp + os.replace).
                temp_file = f"{path}.tmp"
                with open(temp_file, "w", encoding="utf-8") as f:
                    json.dump(self.state, f, indent=2, default=str)
                os.replace(temp_file, path)
            except Exception as e:
                logger.error(f"Error saving arena state to {path}: {e}")

    def evaluate_cycle(self, live_prices: dict, market_news: list = None) -> dict:
        """
        Executes one complete evaluation cycle against live market prices.
        """
        if not live_prices:
            logger.info("No live prices provided. Skipping evaluation cycle.")
            return self.state

        positions = self.state.get("positions", [])
        journal = self.state.get("journal", [])
        agents = {a["id"]: a for a in self.state.get("agents", DEFAULT_AGENTS_SEED)}

        closed_this_cycle = []
        remaining_positions = []

        # 1. EVALUATE RUNNING POSITIONS
        for pos in positions:
            sym = pos.get("symbol", "")
            current_quote = live_prices.get(sym) or live_prices.get(sym.replace("/", ""))
            if not current_quote:
                remaining_positions.append(pos)
                continue

            current_price = float(current_quote.get("price", 0) if isinstance(current_quote, dict) else current_quote)
            if current_price <= 0:
                remaining_positions.append(pos)
                continue

            pos["currentPrice"] = current_price
            direction = pos.get("direction", "LONG")
            entry_price = float(pos.get("entryPrice", current_price))
            sl_price = float(pos.get("slPrice", 0))
            tp1_price = float(pos.get("tp1Price", 0))
            tp2_price = float(pos.get("tp2Price", 0))

            delta = (current_price - entry_price) if direction == "LONG" else (entry_price - current_price)
            roi_pct = (delta / entry_price * 100) if entry_price > 0 else 0
            pos["roiPct"] = round(roi_pct, 2)

            # Trailing stop ratchet: when 40% towards TP1, move SL to lock 30% profit
            if direction == "LONG":
                target_dist = tp1_price - entry_price
                if target_dist > 0 and current_price >= (entry_price + target_dist * 0.40):
                    pos["trailingStopActive"] = True
                    ratchet_sl = entry_price + (current_price - entry_price) * 0.30
                    if ratchet_sl > sl_price:
                        pos["slPrice"] = round(ratchet_sl, 4 if current_price < 10 else 2)
            else:
                target_dist = entry_price - tp1_price
                if target_dist > 0 and current_price <= (entry_price - target_dist * 0.40):
                    pos["trailingStopActive"] = True
                    ratchet_sl = entry_price - (entry_price - current_price) * 0.30
                    if ratchet_sl < sl_price:
                        pos["slPrice"] = round(ratchet_sl, 4 if current_price < 10 else 2)

            # Check Exit Conditions
            should_close = False
            exit_reason = ""
            exit_price = current_price

            if direction == "LONG":
                if tp2_price > 0 and current_price >= tp2_price:
                    should_close = True
                    exit_reason = "HIT_TP2"
                    exit_price = tp2_price
                elif tp1_price > 0 and current_price >= tp1_price:
                    should_close = True
                    exit_reason = "HIT_TP1"
                    exit_price = tp1_price
                elif sl_price > 0 and current_price <= pos["slPrice"]:
                    should_close = True
                    exit_reason = "TRAILING_STOP" if pos.get("trailingStopActive") else "HIT_SL"
                    exit_price = pos["slPrice"]
            else:
                if tp2_price > 0 and current_price <= tp2_price:
                    should_close = True
                    exit_reason = "HIT_TP2"
                    exit_price = tp2_price
                elif tp1_price > 0 and current_price <= tp1_price:
                    should_close = True
                    exit_reason = "HIT_TP1"
                    exit_price = tp1_price
                elif sl_price > 0 and current_price >= pos["slPrice"]:
                    should_close = True
                    exit_reason = "TRAILING_STOP" if pos.get("trailingStopActive") else "HIT_SL"
                    exit_price = pos["slPrice"]

            if should_close:
                final_delta = (exit_price - entry_price) if direction == "LONG" else (entry_price - exit_price)
                raw_roi = (final_delta / entry_price * 100) if entry_price > 0 else 0
                
                # Institutional Real Exchange Friction Model:
                # 0.10% round-trip trading fee (Bitget taker 0.05% open + 0.05% close)
                # + 0.02% spread & slippage = 0.12% total friction
                friction_pct = 0.12
                net_roi = raw_roi - friction_pct
                is_win = net_roi > 0

                closed_trade = {
                    "id": f"TRD-{pos.get('id', uuid.uuid4().hex[:8])}",
                    "agentId": pos.get("agentId", "WATER"),
                    "symbol": sym,
                    "market": pos.get("market", "CRYPTO"),
                    "direction": direction,
                    "entryPrice": entry_price,
                    "exitPrice": exit_price,
                    "slPrice": sl_price,
                    "tp1Price": tp1_price,
                    "grossRoiPct": round(raw_roi, 2),
                    "feePct": round(friction_pct, 2),
                    "roiPct": round(net_roi, 2),
                    "exitReason": exit_reason,
                    "isWin": is_win,
                    "closedAt": datetime.now(timezone.utc).isoformat()
                }
                closed_this_cycle.append(closed_trade)
            else:
                remaining_positions.append(pos)

        # 2. UPDATE JOURNAL & BOT EQUITIES
        if closed_this_cycle:
            journal.extend(closed_this_cycle)
            # Retain last 300 trades in journal to prevent unbounded file growth
            if len(journal) > 300:
                journal = journal[-300:]

        # 3. AUTONOMOUS SCAN & ORDER SPAWN (For Crypto 24/7 and Active Pairs)
        target_pairs = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "FETUSDT", "RENDERUSDT", "NEARUSDT", "LINKUSDT", "AVAXUSDT"]
        for agent_id, agent in agents.items():
            agent_open_count = sum(1 for p in remaining_positions if p.get("agentId") == agent_id)
            if agent_open_count >= 3:
                continue

            for sym in target_pairs:
                if any(p.get("symbol") == sym and p.get("agentId") == agent_id for p in remaining_positions):
                    continue

                quote = live_prices.get(sym) or live_prices.get(sym.replace("USDT", "/USDT"))
                if not quote:
                    continue

                curr_p = float(quote.get("price", 0) if isinstance(quote, dict) else quote)
                chg_24h = float(quote.get("changePct", 0) if isinstance(quote, dict) else 0)
                if curr_p <= 0:
                    continue

                # Strategy Decision Matrix
                direction = None
                if agent["strategy"] in ["SMC_ORDER_BLOCK", "TREND_PULLBACK"]:
                    # Water / Steam: Buy on shallow dips in upward trend
                    if -3.5 <= chg_24h <= 1.5:
                        direction = "LONG"
                elif agent["strategy"] in ["NEWS_MOMENTUM", "IMPULSE_CHASING"]:
                    # Fire / Lightning: Ride strong momentum
                    if chg_24h > 2.0:
                        direction = "LONG"
                    elif chg_24h < -3.0:
                        direction = "SHORT"
                elif agent["strategy"] in ["DONCHIAN_BREAKOUT", "VOLATILITY_BREAKOUT"]:
                    # Air / Storm: Breakout
                    if abs(chg_24h) > 2.5:
                        direction = "LONG" if chg_24h > 0 else "SHORT"
                elif agent["strategy"] in ["SUPPORT_REVERSION", "RANGE_ACCUMULATION"]:
                    # Earth / Mud: Mean reversion from extremes
                    if chg_24h <= -4.0:
                        direction = "LONG"
                    elif chg_24h >= 4.5:
                        direction = "SHORT"
                else:
                    # Hybrids & Avatar: Balanced
                    if chg_24h > 0.5:
                        direction = "LONG"

                if direction:
                    sl_dist = curr_p * 0.015  # 1.5% SL
                    tp1_dist = curr_p * 0.030 # 3.0% TP1 (1:2 RR)
                    tp2_dist = curr_p * 0.050 # 5.0% TP2 (1:3.3 RR)

                    sl_price = round(curr_p - sl_dist if direction == "LONG" else curr_p + sl_dist, 4 if curr_p < 10 else 2)
                    tp1_price = round(curr_p + tp1_dist if direction == "LONG" else curr_p - tp1_dist, 4 if curr_p < 10 else 2)
                    tp2_price = round(curr_p + tp2_dist if direction == "LONG" else curr_p - tp2_dist, 4 if curr_p < 10 else 2)

                    new_pos = {
                        "id": f"POS-{uuid.uuid4().hex[:8].upper()}",
                        "agentId": agent_id,
                        "symbol": sym,
                        "market": "CRYPTO",
                        "direction": direction,
                        "entryPrice": curr_p,
                        "currentPrice": curr_p,
                        "slPrice": sl_price,
                        "tp1Price": tp1_price,
                        "tp2Price": tp2_price,
                        "roiPct": 0.0,
                        "trailingStopActive": False,
                        # Marks this row as machine-owned. The client uses it to
                        # decide what it may delete: a position the engine opened
                        # is the engine's to close, while a row the user created
                        # locally is preserved. Without this flag the client
                        # cannot tell the two apart, and previously refused to
                        # sync anything once it held a position of its own.
                        "origin": "engine",
                        "openedAt": datetime.now(timezone.utc).isoformat()
                    }
                    remaining_positions.append(new_pos)
                    logger.info(f"Agent {agent_id} spawned {direction} position on {sym} @ {curr_p}")
                    break

        # 4. RECOMPUTE WIN RATES & METRICS
        for ag_id, ag in agents.items():
            ag_trades = [t for t in journal if t.get("agentId") == ag_id]
            wins = sum(1 for t in ag_trades if t.get("isWin"))
            total = len(ag_trades)
            win_rate = (wins / total * 100) if total > 0 else 0.0
            total_roi = sum(t.get("roiPct", 0) for t in ag_trades)

            ag["winRate"] = round(win_rate, 1)
            ag["totalTrades"] = total
            ag["totalRoiPct"] = round(total_roi, 2)
            ag["activePositionsCount"] = sum(1 for p in remaining_positions if p.get("agentId") == ag_id)

        self.state["agents"] = list(agents.values())
        self.state["positions"] = remaining_positions
        self.state["journal"] = journal

        self._save_state()
        logger.info(f"Arena cycle complete: {len(remaining_positions)} active positions, {len(closed_this_cycle)} closed this cycle.")
        return self.state

    def reset_state(self) -> dict:
        """
        Hard resets the arena to an authentic clean slate (0 positions, 0 trades, 0.0 win rate).
        """
        agents_clean = []
        for a in DEFAULT_AGENTS_SEED:
            bot = dict(a)
            bot["winRate"] = 0.0
            bot["totalTrades"] = 0
            bot["totalRoiPct"] = 0.0
            bot["activePositionsCount"] = 0
            agents_clean.append(bot)

        self.state = {
            "agents": agents_clean,
            "positions": [],
            "journal": [],
            "session_id": int(datetime.now(timezone.utc).timestamp()),
            "last_evaluated": datetime.now(timezone.utc).isoformat()
        }
        self._save_state()
        logger.info("ArenaEvaluator: State successfully reset to 0.")
        return self.state
