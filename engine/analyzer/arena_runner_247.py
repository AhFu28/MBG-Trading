"""
=============================================================================
MBG QUANT TRADING ENGINE — ARENA PERIODIC RUNNER
=============================================================================
Zero-dependency autonomous trading runner for 16 AI Agents.

SCOPE AND LIMITS (read before trusting the word "continuous" anywhere):
This runner executes a bounded session, not an always-on daemon. In production
it is driven by GitHub Actions on a 4-sessions-per-day schedule of ~5h25m each.
GitHub Actions does NOT guarantee high-frequency cron, so real coverage is
roughly 22 hours/day with gaps, and the scheduler may delay or skip a session.
Do NOT describe this engine as real-time or 24/7 in user-facing copy.

- Operates strictly with Python Standard Library (zero pip install delay).
- Ingests real-time Binance & macro market ticks via urllib.
- Ratchets trailing stops & deducts institutional 0.12% Bitget fees.
- Supports configurable session duration for GitHub Actions & local runners.
- Persists state to engine/cache/latest_arena_state.json (never frontend/public).
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

# =============================================================================
# AGENT DNA — makes each of the 16 agents behave differently
# =============================================================================
# WHY THIS EXISTS:
# Before this, 16 agents shared only 6 decision logics. AVATAR, CHAOS, OCEANIC
# and TEMPEST ran the IDENTICAL "Synthesis (chg >= 0)" rule. The result was
# measurable and embarrassing: XAUUSD SHORT was opened by 12 different agents at
# the exact same entry (4205.3), FETUSDT by 14 agents at 0.2369, and 12 of 16
# agents had never closed a single trade in 3 days.
#
# "16 agents" that all make the same call is 1 strategy run 16 times. Each agent
# now gets its own sensory thresholds and its own instrument bias, so a single
# market condition produces genuinely different decisions per agent.
#
# Fields:
#   family   : which decision logic this agent uses (must be UNIQUE per agent
#              within reason, so no two agents share a rule set)
#   sens     : sensitivity multiplier on the family's raw trigger threshold
#   min_conf : this agent's own conviction bar (was hardcoded 68 for everyone)
#   assets   : instrument preference. "crypto" | "commodity" | "both" | "majors"
#   bias     : directional preference applied as a threshold skew
#              positive = prefers LONG, negative = prefers SHORT
AGENT_DNA = {
    # --- Base elementals: tight, fast, single-family -------------------------
    "WATER":     {"family": "smc",          "sens": 1.00, "min_conf": 66, "assets": "both",      "bias": 0.10},
    "FIRE":      {"family": "momentum",     "sens": 0.80, "min_conf": 70, "assets": "crypto",    "bias": 0.15},
    "AIR":       {"family": "donchian",     "sens": 1.10, "min_conf": 68, "assets": "majors",    "bias": 0.12},
    "EARTH":     {"family": "mean_revert",  "sens": 1.00, "min_conf": 64, "assets": "both",      "bias": 0.05},

    # --- Duos: same family as their parent but tuned differently -------------
    # STEAM is deliberately a DIFFERENT family from WATER now (was identical).
    "STEAM":     {"family": "smc_tight",    "sens": 1.35, "min_conf": 72, "assets": "crypto",    "bias": 0.00},
    # STORM differs from AIR by being far more sensitive (catches smaller breaks).
    "STORM":     {"family": "donchian_fast","sens": 0.72, "min_conf": 66, "assets": "crypto",    "bias": 0.20},
    # MUD differs from EARTH by deep-dip-only accumulation.
    "MUD":       {"family": "deep_value",   "sens": 1.20, "min_conf": 62, "assets": "both",      "bias": 0.25},
    # LIGHTNING differs from FIRE by chasing only violent impulses.
    "LIGHTNING": {"family": "impulse",      "sens": 1.30, "min_conf": 74, "assets": "crypto",    "bias": 0.18},
    # LAVA is the only pure capitulation-bounce agent.
    "LAVA":      {"family": "capitulation", "sens": 1.00, "min_conf": 68, "assets": "both",      "bias": 0.30},
    # SANDSTORM is the only false-breakout fade (contrarian SHORT bias).
    "SANDSTORM": {"family": "fade_break",   "sens": 1.00, "min_conf": 70, "assets": "crypto",    "bias": -0.25},

    # --- Trios: multi-condition, each weighted differently -------------------
    "TEMPEST":   {"family": "triple_conf",  "sens": 1.00, "min_conf": 76, "assets": "both",      "bias": 0.08},
    "GEOTHERMAL":{"family": "vol_expand",   "sens": 1.15, "min_conf": 72, "assets": "crypto",    "bias": 0.10},
    "OCEANIC":   {"family": "channel_rev",  "sens": 1.00, "min_conf": 66, "assets": "majors",    "bias": -0.10},
    "CYCLONE":   {"family": "asym_reversal","sens": 1.25, "min_conf": 75, "assets": "both",      "bias": -0.30},

    # --- Master & Chaos: highest bars, broadest scope ------------------------
    "AVATAR":    {"family": "quad_synth",   "sens": 1.00, "min_conf": 80, "assets": "both",      "bias": 0.00},
    # CHAOS keeps the only genuinely "no directional preference" rule.
    "CHAOS":     {"family": "adaptive",     "sens": 1.00, "min_conf": 72, "assets": "crypto",    "bias": 0.00},
}

# Instruments grouped, so an agent's `assets` preference actually narrows its hunt.
ASSET_GROUPS = {
    "crypto":    [s for s in TARGET_UNIVERSE if s != "XAUUSD"],
    "commodity": ["XAUUSD"],
    "majors":    ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XAUUSD"],
    "both":      list(TARGET_UNIVERSE),
}


def resolve_agent_universe(agent_id: str) -> List[str]:
    """Return the instrument list this specific agent is allowed to trade."""
    dna = AGENT_DNA.get(agent_id)
    if not dna:
        return list(TARGET_UNIVERSE)
    return ASSET_GROUPS.get(dna["assets"], list(TARGET_UNIVERSE))


class ArenaRunner247:
    def __init__(self, state_file_path: Optional[str] = None):
        if state_file_path:
            self.state_file = state_file_path
        else:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            # Written to engine/cache, NOT frontend/public: the arena state is a
            # paid payload and must never be a publicly downloadable static file.
            self.state_file = os.path.join(base_dir, "engine", "cache", "latest_arena_state.json")
        
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

        # 1. Fetch Binance 24hr tickers.
        #
        # WHY MULTIPLE HOSTS: api.binance.com is unreachable from some networks
        # (observed on 2026-10-05: TLS handshake refused, while the official
        # public mirror worked). When that happened this method silently returned
        # ONLY gold, so all 16 agents traded XAUUSD and looked like one bot
        # duplicated 16 times. Falling through several hosts removes that
        # silent single-asset failure mode.
        BINANCE_HOSTS = [
            "https://api.binance.com",
            "https://data-api.binance.vision",  # official public market-data mirror
            "https://api1.binance.com",
            "https://api2.binance.com",
        ]

        for host in BINANCE_HOSTS:
            if prices:
                break
            try:
                req = urllib.request.Request(
                    f"{host}/api/v3/ticker/24hr",
                    headers={"User-Agent": "MBG-Arena/1.0"}
                )
                with urllib.request.urlopen(req, timeout=8) as response:
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
                        if prices:
                            logger.info(f"Binance tickers loaded from {host}: {len(prices)} symbols")
            except Exception as e:
                logger.debug(f"Binance host {host} unavailable: {e}")

        if not prices:
            logger.error(
                "ALL Binance hosts failed — crypto universe is empty. "
                "Agents would only see gold, which is a silent single-asset failure."
            )

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
        """Score one instrument for one agent, using that agent's own DNA.

        Each family has a distinct trigger, and the agent's `sens` / `bias` /
        `min_conf` shape it further. Two agents in the same family therefore
        still diverge, and no two agents share an identical rule set.
        """
        price = quote.get("price", 0)
        chg = quote.get("changePct", 0)
        high = quote.get("high", price * 1.01)
        low = quote.get("low", price * 0.99)
        rng = high - low if high > low else price * 0.02
        range_pos = (price - low) / rng if rng > 0 else 0.5

        dna = AGENT_DNA.get(agent_id, {"family": "adaptive", "sens": 1.0, "min_conf": 68, "assets": "both", "bias": 0.0})
        fam = dna["family"]
        sens = dna["sens"]
        bias = dna["bias"]

        # `bias` shifts the effective range position: positive favours LONG entries.
        adj_pos = range_pos - (bias * 0.15)
        adj_pos = min(1.0, max(0.0, adj_pos))

        is_long = True
        confidence = 55
        rationale = ""

        if fam == "smc":
            # Buy the discount, sell the premium.
            is_long = adj_pos < (0.40 * sens)
            confidence = 68 + int(abs(range_pos - 0.5) * 40)
            rationale = f"{agent_id} [SMC]: Liquidity sweep {'Discount' if is_long else 'Premium'} ({range_pos*100:.0f}%) pada {sym}."

        elif fam == "smc_tight":
            # Only takes the deepest discount / highest premium.
            is_long = adj_pos < (0.25 * sens)
            confidence = 72 + int(abs(range_pos - 0.5) * 30)
            rationale = f"{agent_id} [SMC-Tight]: Deep {'discount' if is_long else 'premium'} zone ({range_pos*100:.0f}%) pada {sym}."

        elif fam == "momentum":
            is_long = chg > (1.2 * sens)
            confidence = 65 + min(28, int(abs(chg) * 6))
            rationale = f"{agent_id} [Momentum]: Volatility surge ({chg:+.2f}%) breakout pada {sym}."

        elif fam == "impulse":
            # Chases only violent moves; smaller surges do not qualify.
            is_long = chg > (2.5 * sens)
            confidence = 74 + min(18, int(abs(chg) * 4))
            rationale = f"{agent_id} [Impulse]: Violent thrust ({chg:+.2f}%) pada {sym}."

        elif fam == "donchian":
            is_long = adj_pos > (0.70 / sens)
            confidence = 68 + int(abs(range_pos - 0.5) * 35)
            rationale = f"{agent_id} [Donchian]: Range breakout ({range_pos*100:.0f}%) ekspansi tren pada {sym}."

        elif fam == "donchian_fast":
            # Catches earlier, shallower breakouts than Donchian.
            is_long = adj_pos > (0.55 / sens)
            confidence = 66 + int(abs(range_pos - 0.5) * 40)
            rationale = f"{agent_id} [Donchian-Fast]: Early breakout ({range_pos*100:.0f}%) pada {sym}."

        elif fam == "mean_revert":
            is_long = adj_pos < (0.30 * sens)
            confidence = 66 + int(abs(chg) * 4)
            rationale = f"{agent_id} [Mean Reversion]: Statistical support bounce ({chg:+.2f}%) pada {sym}."

        elif fam == "deep_value":
            # Waits for a genuinely washed-out dip, not a mild pullback.
            is_long = adj_pos < (0.18 * sens) or chg < -3.5
            confidence = 62 + int(abs(chg) * 3)
            rationale = f"{agent_id} [Deep Value]: Accumulation at washed-out lows ({chg:+.2f}%) pada {sym}."

        elif fam == "capitulation":
            is_long = chg < (-2.0 * sens)
            confidence = 67 + int(abs(chg) * 5)
            rationale = f"{agent_id} [Capitulation]: Panic sell absorption bounce pada {sym}."

        elif fam == "fade_break":
            # Contrarian: fades an over-extended breakout instead of joining it.
            is_long = not (adj_pos > (0.80 / sens) or chg > 2.0)
            confidence = 70 + int(abs(range_pos - 0.5) * 25)
            rationale = f"{agent_id} [Fade Break]: False-breakout fade pada {sym}."

        elif fam == "triple_conf":
            # Requires alignment of range position AND direction of change.
            aligned = (adj_pos > 0.60 and chg > 0.5) or (adj_pos < 0.40 and chg < -0.5)
            is_long = aligned and chg >= 0
            confidence = 76 + min(12, int(abs(chg) * 3)) if aligned else 60
            rationale = f"{agent_id} [Triple Confluence]: {'Aligned' if aligned else 'Unconfirmed'} multi-factor pada {sym}."

        elif fam == "vol_expand":
            # Looks for expansion: wide range plus a directional push.
            expanding = abs(chg) > (1.5 * sens)
            is_long = expanding and chg > 0
            confidence = 72 + min(15, int(abs(chg) * 4)) if expanding else 58
            rationale = f"{agent_id} [Vol Expansion]: {'Burst' if expanding else 'No expansion'} ({chg:+.2f}%) pada {sym}."

        elif fam == "channel_rev":
            # Fades the extremes of the observed channel.
            is_long = adj_pos < (0.20 * sens) or adj_pos > (0.80 / sens)
            confidence = 66 + int(abs(range_pos - 0.5) * 30)
            rationale = f"{agent_id} [Channel Rev]: Channel extreme ({range_pos*100:.0f}%) pada {sym}."

        elif fam == "asym_reversal":
            # Looks specifically for an asymmetric reversal setup (bearish bias).
            is_long = adj_pos < (0.25 * sens) and chg > 0
            confidence = 75 + int(abs(range_pos - 0.5) * 20)
            rationale = f"{agent_id} [Asym Reversal]: Reversal eruption pada {sym}."

        elif fam == "quad_synth":
            # The most demanding rule: needs range position AND momentum agreement.
            strong = (adj_pos > 0.65 and chg > 1.0) or (adj_pos < 0.35 and chg < -1.0)
            is_long = strong and chg >= 0
            confidence = 80 + min(10, int(abs(chg) * 2)) if strong else 55
            rationale = f"{agent_id} [Quad Synthesis]: {'Sovereign confluence' if strong else 'Insufficient confluence'} pada {sym}."

        else:  # "adaptive" (CHAOS) — the only agent with no directional preference
            is_long = chg >= 0
            confidence = 72 + int(abs(chg) * 5)
            rationale = f"{agent_id} [Adaptive]: Dynamic sampling ({chg:+.2f}%) pada {sym}."

        return is_long, min(95, max(40, confidence)), rationale

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

        # 2. INDEPENDENT ORDER SPAWNER — each agent uses its OWN universe and bar
        max_pos_per_agent = 3

        # Concentration cap: without it, one violent mover absorbs the whole
        # arena. Observed on 2026-10-05 when FETUSDT ran +15.7% and 9 agents piled
        # into the same symbol at the same price — the same "twin position"
        # symptom this DNA rework exists to eliminate.
        # ponytail: flat cap, no per-asset-class nuance. Tune if the arena grows.
        MAX_AGENTS_PER_SYMBOL = 4

        for ag_id, ag in agents_dict.items():
            ag_open = [p for p in remaining if p.get("agentId") == ag_id]
            if len(ag_open) >= max_pos_per_agent:
                continue

            dna = AGENT_DNA.get(ag_id, {"min_conf": 68, "assets": "both"})
            min_conf = dna["min_conf"]
            agent_universe = resolve_agent_universe(ag_id)

            best_sig = None
            best_sym = None
            best_quote = None
            highest_conf = 0

            # Search the agent's OWN universe first and accept the best signal
            # found there. Only fall back to the full target list when the
            # agent's universe produced NO qualifying candidate at all.
            #
            # The previous version merged both passes and picked the global
            # maximum, which made XAUUSD (high volatility = high confidence) win
            # for almost every agent regardless of its stated preference. An
            # agent declaring "crypto only" must actually trade crypto.
            for universe in (agent_universe, TARGET_UNIVERSE):
                for sym in universe:
                    if any(p.get("symbol") == sym and p.get("agentId") == ag_id for p in remaining):
                        continue
                    # Respect the concentration cap even inside the agent's own universe.
                    if sum(1 for p in remaining if p.get("symbol") == sym) >= MAX_AGENTS_PER_SYMBOL:
                        continue
                    q = live_prices.get(sym)
                    if not q or q.get("price", 0) <= 0:
                        continue

                    is_l, conf, rat = self.compute_agent_confluence(ag_id, sym, q)
                    if conf >= min_conf and conf > highest_conf:
                        highest_conf = conf
                        best_sig = (is_l, conf, rat)
                        best_sym = sym
                        best_quote = q
                if best_sig:
                    # Stop here: a signal inside the agent's own universe wins.
                    break

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
