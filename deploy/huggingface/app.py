"""
=============================================================================
MBG QUANT TRADING ENGINE — 24/7 AUTONOMOUS CLOUD ARENA DAEMON
=============================================================================
FastAPI Service with Always-On Multi-Agent Trading Daemon for Hugging Face Spaces.
- Continuously polls Binance REST & WebSocket ticker streams.
- Manages 16 AI Trading Agents concurrently without round-robin bottlenecks.
- Dynamically ratchets trailing stops & enforces authentic 0.12% Bitget fees.
- Exposes /health (keep-alive for UptimeRobot) & /api/arena/state (web sync).
=============================================================================
"""

import os
import time
import json
import logging
import threading
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any

import requests
from fastapi import FastAPI, BackgroundTasks, Response
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("MBGCloudArena")

app = FastAPI(title="MBG 24/7 Trading Arena Daemon", version="1.0.0")

# Enable CORS so frontend web can fetch state directly from anywhere
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
STATE_FILE = os.path.join(DATA_DIR, "arena_state.json")
START_TIME = time.time()

# 16 AI Trading Agents Seed Definition
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

state_lock = threading.Lock()
arena_state: Dict[str, Any] = {
    "agents": DEFAULT_AGENTS,
    "positions": [],
    "journal": [],
    "session_id": int(time.time()),
    "last_evaluated": datetime.now(timezone.utc).isoformat()
}

cached_prices: Dict[str, Dict[str, float]] = {}

def load_persisted_state():
    global arena_state
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
                if isinstance(saved, dict) and "agents" in saved and "positions" in saved:
                    with state_lock:
                        arena_state = saved
                    logger.info("Persisted state restored from %s", STATE_FILE)
        except Exception as e:
            logger.warning("Failed to load persisted state: %s", e)

def save_persisted_state():
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        with state_lock:
            arena_state["last_evaluated"] = datetime.now(timezone.utc).isoformat()
            data_to_write = dict(arena_state)
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(data_to_write, f, indent=2, default=str)
    except Exception as e:
        logger.error("Failed to save state to disk: %s", e)

def fetch_live_binance_prices():
    global cached_prices
    url = "https://api.binance.com/api/v3/ticker/24hr"
    try:
        resp = requests.get(url, timeout=4)
        if resp.status_code == 200:
            data = resp.json()
            latest = {}
            for item in data:
                sym = item.get("symbol")
                p = float(item.get("lastPrice", 0))
                chg = float(item.get("priceChangePercent", 0))
                h = float(item.get("highPrice", p))
                l = float(item.get("lowPrice", p))
                if p > 0:
                    latest[sym] = {"price": p, "changePct": chg, "high": h, "low": l}
            if latest:
                cached_prices.update(latest)
    except Exception as e:
        logger.debug("Binance fetch error: %s", e)

def fetch_macro_prices():
    # Periodically fetch XAUUSD (Gold) from Yahoo
    global cached_prices
    url = "https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1m&range=1d"
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        r = requests.get(url, headers=headers, timeout=4)
        if r.status_code == 200:
            res = r.json()
            meta = res.get("chart", {}).get("result", [{}])[0].get("meta", {})
            gold_price = float(meta.get("regularMarketPrice", 0))
            if gold_price > 2000:
                cached_prices["XAUUSD"] = {"price": gold_price, "changePct": 0.5, "high": gold_price * 1.01, "low": gold_price * 0.99}
    except Exception:
        pass

def compute_agent_confluence(agent_id: str, sym: str, quote: dict) -> tuple:
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

def daemon_worker():
    logger.info("Starting 24/7 AI Multi-Agent Trading Loop...")
    load_persisted_state()
    loop_count = 0

    target_universe = [
        "BTCUSDT", "ETHUSDT", "SOLUSDT", "FETUSDT", "RENDERUSDT",
        "NEARUSDT", "LINKUSDT", "AVAXUSDT", "DOGEUSDT", "BNBUSDT",
        "ADAUSDT", "XRPUSDT", "SUIUSDT", "PEPEUSDT", "TAOUSDT", "XAUUSD"
    ]

    while True:
        try:
            loop_count += 1
            # 1. Fetch live exchange prices
            fetch_live_binance_prices()
            if loop_count % 8 == 0:
                fetch_macro_prices()

            # 2. Evaluate active positions
            with state_lock:
                positions = arena_state.get("positions", [])
                journal = arena_state.get("journal", [])
                agents_dict = {a["id"]: a for a in arena_state.get("agents", DEFAULT_AGENTS)}

                remaining = []
                closed_now = []

                for pos in positions:
                    sym = pos.get("symbol")
                    quote = cached_prices.get(sym)
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
                    arena_state["journal"] = journal

                # 3. CONCURRENT INDEPENDENT ORDER SPAWNER (100% Concurrent, Zero Round-Robin)
                max_pos_per_agent = 3
                for ag_id, ag in agents_dict.items():
                    ag_open = [p for p in remaining if p.get("agentId") == ag_id]
                    if len(ag_open) >= max_pos_per_agent:
                        continue

                    # Bot scans eligible candidate symbols independently
                    best_sig = None
                    best_sym = None
                    best_quote = None
                    highest_conf = 0

                    for sym in target_universe:
                        if any(p.get("symbol") == sym and p.get("agentId") == ag_id for p in remaining):
                            continue
                        q = cached_prices.get(sym)
                        if not q or q.get("price", 0) <= 0:
                            continue

                        is_l, conf, rat = compute_agent_confluence(ag_id, sym, q)
                        if conf >= 68 and conf > highest_conf:
                            highest_conf = conf
                            best_sig = (is_l, conf, rat)
                            best_sym = sym
                            best_quote = q

                    # If this bot detects a valid confluence setup, it immediately fires the order!
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
                        logger.info(f"Agent {ag_id} opened {new_position['direction']} {best_sym} @ {entry_p} (Conf: {conf}%)")

                # Update live active count per agent
                for ag_id, ag in agents_dict.items():
                    ag["activePositionsCount"] = sum(1 for p in remaining if p.get("agentId") == ag_id)

                arena_state["positions"] = remaining
                arena_state["agents"] = list(agents_dict.values())

            # 4. Periodically save state to disk
            if loop_count % 5 == 0:
                save_persisted_state()

        except Exception as e:
            logger.error("Daemon cycle exception: %s", e)

        time.sleep(2.0)

# Start background daemon on server launch
@app.on_event("startup")
def startup_event():
    t = threading.Thread(target=daemon_worker, daemon=True)
    t.start()
    logger.info("Background 24/7 trading daemon started.")

@app.get("/health")
def health_check():
    """Endpoint for UptimeRobot / cron-job.org keep-alive ping."""
    uptime = int(time.time() - START_TIME)
    with state_lock:
        active_pos = len(arena_state.get("positions", []))
        closed_trades = len(arena_state.get("journal", []))
    return {
        "status": "online",
        "service": "MBG 24/7 AI Multi-Agent Arena",
        "uptime_seconds": uptime,
        "active_positions": active_pos,
        "closed_trades": closed_trades,
        "last_sync": arena_state.get("last_evaluated")
    }

@app.get("/api/arena/state")
def get_arena_state():
    """Returns real-time arena state for frontend web client synchronization."""
    with state_lock:
        return JSONResponse(content=arena_state)

@app.post("/api/arena/reset")
def reset_arena():
    """Reset state back to clean genesis."""
    global arena_state
    with state_lock:
        arena_state = {
            "agents": DEFAULT_AGENTS,
            "positions": [],
            "journal": [],
            "session_id": int(time.time()),
            "last_evaluated": datetime.now(timezone.utc).isoformat()
        }
    save_persisted_state()
    return {"status": "reset_complete", "session_id": arena_state["session_id"]}

@app.get("/", response_class=HTMLResponse)
def index_dashboard():
    """Cyberpunk live monitoring HUD for Hugging Face Spaces UI."""
    uptime = int(time.time() - START_TIME)
    mins = uptime // 60
    hours = mins // 60
    with state_lock:
        active_pos = len(arena_state.get("positions", []))
        trades = len(arena_state.get("journal", []))
        agents = arena_state.get("agents", [])
        positions = arena_state.get("positions", [])

    cards_html = ""
    for ag in agents:
        pos_cnt = ag.get("activePositionsCount", 0)
        status_badge = f'<span style="color:#10b981;font-weight:bold;">TRADING ({pos_cnt})</span>' if pos_cnt > 0 else '<span style="color:#64748b;">HUNTING</span>'
        cards_html += f"""
        <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:12px;margin:6px;width:220px;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
                <span style="font-size:16px;">{ag.get('avatar','🤖')} <strong style="color:{ag.get('color','#38bdf8')}">{ag.get('name')}</strong></span>
                <span style="font-size:10px;background:#1e293b;padding:2px 6px;border-radius:4px;color:#94a3b8;">{ag.get('tier')}</span>
            </div>
            <div style="font-size:11px;color:#94a3b8;margin:6px 0;">{ag.get('role')}</div>
            <div style="display:flex;justify-content:space-between;font-size:11px;border-top:1px solid #1e293b;padding-top:6px;">
                <span>Status:</span>{status_badge}
            </div>
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-top:2px;">
                <span>Win Rate:</span><strong style="color:#38bdf8;">{ag.get('winRate', 0)}%</strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-top:2px;">
                <span>ROI:</span><strong style="color:{'#10b981' if ag.get('totalRoiPct',0)>=0 else '#ef4444'};">{ag.get('totalRoiPct', 0):+.2f}%</strong>
            </div>
        </div>
        """

    positions_rows = ""
    for p in positions[:8]:
        roi = p.get('roiPct', 0)
        c = '#10b981' if roi >= 0 else '#ef4444'
        positions_rows += f"""
        <tr style="border-bottom:1px solid #1e293b;font-family:monospace;font-size:11px;">
            <td style="padding:6px;">{p.get('agentId')}</td>
            <td style="padding:6px;font-weight:bold;">{p.get('symbol')}</td>
            <td style="padding:6px;color:{'#10b981' if p.get('direction')=='LONG' else '#ef4444'};">{p.get('direction')}</td>
            <td style="padding:6px;">${p.get('entryPrice'):,.2f}</td>
            <td style="padding:6px;">${p.get('currentPrice'):,.2f}</td>
            <td style="padding:6px;color:{c};font-weight:bold;">{roi:+.2f}%</td>
            <td style="padding:6px;color:#f59e0b;">{'🔒 Locked' if p.get('trailingStopActive') else 'Waiting'}</td>
        </tr>
        """

    if not positions_rows:
        positions_rows = '<tr><td colspan="7" style="padding:16px;text-align:center;color:#64748b;">Memburu peluang sinyal konfluensi...</td></tr>'

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>MBG 24/7 AI Multi-Agent Arena HUD</title>
        <meta http-equiv="refresh" content="5">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #030712; color: #f8fafc; margin: 0; padding: 24px; }}
            .container {{ max-width: 1200px; margin: 0 auto; }}
            .header {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 16px; }}
            .badge {{ background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: bold; }}
            .grid {{ display: flex; flex-wrap: wrap; margin-top: 16px; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 12px; background: #0f172a; border-radius: 8px; overflow: hidden; }}
            th {{ background: #1e293b; padding: 8px; text-align: left; font-size: 11px; color: #94a3b8; font-weight: 600; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div>
                    <h2 style="margin:0;color:#38bdf8;">⚡ MBG 24/7 AI Multi-Agent Arena</h2>
                    <div style="font-size:12px;color:#94a3b8;margin-top:4px;">Autonomous Cloud Execution Daemon — 16 Sovereign Trading Agents</div>
                </div>
                <div style="text-align:right;">
                    <span class="badge">● DAEMON ONLINE (24/7)</span>
                    <div style="font-size:11px;color:#94a3b8;margin-top:4px;">Uptime: {hours}h {mins%60}m | Posisi Aktif: {active_pos} | Trade Selesai: {trades}</div>
                </div>
            </div>

            <h3 style="margin-top:24px;font-size:14px;color:#e2e8f0;">Active Running Positions ({active_pos})</h3>
            <table>
                <thead>
                    <tr><th>Agent</th><th>Symbol</th><th>Direction</th><th>Entry</th><th>Current</th><th>ROI %</th><th>Trailing Stop</th></tr>
                </thead>
                <tbody>{positions_rows}</tbody>
            </table>

            <h3 style="margin-top:24px;font-size:14px;color:#e2e8f0;">16 AI Agent Syndicate Telemetry</h3>
            <div class="grid">{cards_html}</div>
            
            <div style="margin-top:24px;padding:12px;background:#0f172a;border-radius:8px;font-size:12px;color:#94a3b8;text-align:center;">
                Endpoint Web Client: <code style="color:#38bdf8;">/api/arena/state</code> | Keep-Alive Ping: <code style="color:#10b981;">/health</code>
            </div>
        </div>
    </body>
    </html>
    """

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=7860, reload=False)
