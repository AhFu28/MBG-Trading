"""MBG VIP signal router — closes backlog gap GTM-TG-01.

Why this module exists
----------------------
The Telegram VIP dispatcher (`TelegramNotifier.broadcast_vip_trade_signal`) already
existed but had **no caller anywhere in the repository** (see
``docs/consolidation/03_repo_truth_audit.md`` A6). This router is the missing
call site, and it adds the honesty gate required by GTM-DATA-01:

* every outgoing signal must carry a named **source** and an **observed_at** time;
* a plan without that provenance is **never** sent as a precise VIP signal — it is
  downgraded to a provenance-less public note and recorded as blocked;
* a plan explicitly marked synthetic/illustrative is labelled as such and is never
  presented as live;
* recipients come from an explicit subscriber allowlist with per-subscriber expiry,
  so "who gets the paid payload" stops being a client-side display value (TRUST03
  prerequisite: the allowlist is still file-based until server entitlement lands).

Design constraints
------------------
* Standard library only; no network access unless ``--live`` is passed.
* Dry-run is the default everywhere. ``dispatch(..., dry_run=True)`` performs no I/O.
* This module does not modify or duplicate the existing notifier formatter; it
  renders its own provenance-bearing text and hands delivery to
  ``TelegramNotifier.send_html_message``.
"""

from __future__ import annotations

import html
import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional, Tuple

# Provenance keys a plan must carry before it may be sent as a precise VIP signal.
REQUIRED_PROVENANCE_KEYS = ("source", "observed_at")

# Values of plan["data_state"] that must never be sold as a live signal.
NON_LIVE_STATES = {"synthetic", "simulated", "mock", "illustrative", "demo"}

# How old a plan may be before it is refused as a PAID signal.
#
# Why this exists: on 2026-10-05 the cached plans were 18 days old (generated
# 17 Sep) and CUAN's plan said "entry Rp 945" while the live price was Rp 840 —
# an 11% gap. Sending that to a paying subscriber means they buy at a price that
# no longer exists. A stale plan is not a signal, it is misinformation.
#
# Thresholds are deliberately generous for an EOD swing strategy while still
# catching the "pipeline stopped running" failure this was built for.
MAX_SIGNAL_AGE_HOURS = 48          # beyond this: blocked entirely
STALE_WARNING_HOURS = 12           # beyond this: warned, still allowed if < MAX

DEFAULT_SUBSCRIBERS_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "config",
    "vip_subscribers.json",
)
DEFAULT_BUNDLE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "cache",
    "daily_trade_plans.json",
)


# --------------------------------------------------------------------------- #
# Model
# --------------------------------------------------------------------------- #
@dataclass
class Subscriber:
    """One entitled recipient. `expires_at` accepts ``YYYY-MM-DD`` or ISO-8601."""

    chat_id: str
    tier: str = "VIP"
    expires_at: Optional[str] = None
    active: bool = True
    name: str = ""

    def is_entitled(self, now: Optional[datetime] = None) -> bool:
        if not self.active or self.tier.upper() not in {"VIP", "PRO"}:
            return False
        if not self.expires_at:
            # An unexpiring subscriber must be granted explicitly, never by omission
            # of the field in a hurry: require active=true (already checked above).
            return True
        now = now or datetime.now(timezone.utc)
        try:
            raw = self.expires_at.strip()
            if len(raw) == 10:  # date only -> end of that day, UTC
                expiry = datetime.fromisoformat(raw).replace(tzinfo=timezone.utc)
                expiry = expiry.replace(hour=23, minute=59, second=59)
            else:
                expiry = datetime.fromisoformat(raw.replace("Z", "+00:00"))
                if expiry.tzinfo is None:
                    expiry = expiry.replace(tzinfo=timezone.utc)
        except ValueError:
            return False  # unparseable expiry fails closed
        return now <= expiry


@dataclass
class RoutedMessage:
    audience: str  # "VIP" | "PUBLIC"
    text: str
    instrument: str
    chat_id: Optional[str] = None
    blocked_reason: Optional[str] = None

    def as_dict(self) -> Dict[str, Any]:
        return {
            "audience": self.audience,
            "chat_id": self.chat_id,
            "instrument": self.instrument,
            "blocked_reason": self.blocked_reason,
            "text": self.text,
        }


# --------------------------------------------------------------------------- #
# Loading
# --------------------------------------------------------------------------- #
def load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def extract_plans(payload: Any) -> List[Dict[str, Any]]:
    """Accepts either a bare list or the cockpit bundle / daily-plans envelope."""
    if isinstance(payload, list):
        return [p for p in payload if isinstance(p, dict)]
    if isinstance(payload, dict):
        for key in ("daily_trade_plans", "plans", "data"):
            value = payload.get(key)
            if isinstance(value, list):
                return [p for p in value if isinstance(p, dict)]
        # A single plan object
        if any(k in payload for k in ("clean_ticker", "ticker", "symbol")):
            return [payload]
    return []


def load_subscribers(path: Optional[str] = None) -> List[Subscriber]:
    """Load the allowlist from JSON or from ``MBG_VIP_CHAT_IDS`` (comma-separated)."""
    subscribers: List[Subscriber] = []

    env_ids = os.getenv("MBG_VIP_CHAT_IDS", "").strip()
    if env_ids:
        for chunk in env_ids.split(","):
            cid = chunk.strip()
            if cid:
                subscribers.append(Subscriber(chat_id=cid, name="env"))

    resolved = path or DEFAULT_SUBSCRIBERS_PATH
    if os.path.exists(resolved):
        payload = load_json(resolved)
        rows = payload.get("subscribers") if isinstance(payload, dict) else payload
        for row in rows or []:
            if not isinstance(row, dict) or not row.get("chat_id"):
                continue
            subscribers.append(
                Subscriber(
                    chat_id=str(row["chat_id"]),
                    tier=str(row.get("tier", "VIP")),
                    expires_at=row.get("expires_at"),
                    active=bool(row.get("active", True)),
                    name=str(row.get("name", "")),
                )
            )
    return subscribers


# --------------------------------------------------------------------------- #
# Honesty gate
# --------------------------------------------------------------------------- #
def provenance_of(plan: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "source": plan.get("source") or plan.get("data_source"),
        "observed_at": plan.get("observed_at") or plan.get("source_time") or plan.get("as_of"),
        # Missing state is UNKNOWN, never assumed "observed" (master plan §7.2).
        "data_state": str(plan.get("data_state") or "unknown").lower(),
        "quality": plan.get("quality") or plan.get("quality_flags"),
    }


def plan_age_hours(plan: Dict[str, Any], now: Optional[datetime] = None) -> Optional[float]:
    """Age of the plan's observation time in hours, or None if unparseable."""
    prov = provenance_of(plan)
    raw = prov.get("observed_at")
    if not raw:
        return None
    text = str(raw).strip().replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        # Fall back to a date-only value such as "2026-10-05".
        try:
            parsed = datetime.strptime(str(raw).strip()[:10], "%Y-%m-%d")
        except ValueError:
            return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    reference = now or datetime.now(timezone.utc)
    if reference.tzinfo is None:
        reference = reference.replace(tzinfo=timezone.utc)
    return (reference - parsed).total_seconds() / 3600.0


def staleness_gap(plan: Dict[str, Any], now: Optional[datetime] = None) -> Optional[str]:
    """Return a reason string when the plan is too old to sell as a live signal."""
    age = plan_age_hours(plan, now=now)
    if age is None:
        # Unparseable observation time is not trustworthy for a paid signal.
        return "unparseable observed_at — cannot verify freshness"
    if age > MAX_SIGNAL_AGE_HOURS:
        return "stale signal: plan is %.1f hours old (max %d)" % (age, MAX_SIGNAL_AGE_HOURS)
    return None


def freshness_note(plan: Dict[str, Any], now: Optional[datetime] = None) -> Optional[str]:
    """Warn (but do not block) when a plan is aging."""
    age = plan_age_hours(plan, now=now)
    if age is not None and STALE_WARNING_HOURS < age <= MAX_SIGNAL_AGE_HOURS:
        return "aging: plan is %.1f hours old" % age
    return None


def provenance_gap(plan: Dict[str, Any], now: Optional[datetime] = None) -> Optional[str]:
    """Return a human-readable reason the plan may not be sold as a live signal.

    `now` is injectable so tests (and any backfill/replay) can evaluate freshness
    against a fixed clock instead of wall time.
    """
    prov = provenance_of(plan)
    missing = [key for key in REQUIRED_PROVENANCE_KEYS if not prov.get(key)]
    if missing:
        return "missing provenance: " + ", ".join(missing)
    if prov["data_state"] in NON_LIVE_STATES:
        return "non-live data_state: %s" % prov["data_state"]
    # A plan with full provenance can STILL be unsellable if it is too old.
    stale = staleness_gap(plan, now=now)
    if stale:
        return stale
    return None


def _fmt_number(value: Any) -> str:
    if isinstance(value, bool):
        return str(value)
    if isinstance(value, (int, float)):
        return f"{value:,.2f}"
    return html.escape(str(value if value not in (None, "") else "—"))


def _provenance_footer(plan: Dict[str, Any], gap: Optional[str] = None) -> str:
    """Render provenance honestly: an absent field is '—', never 'None'."""
    prov = provenance_of(plan)
    source = prov["source"] if prov["source"] else "—"
    observed = prov["observed_at"] if prov["observed_at"] else "—"
    lines = [
        "Sumber: <b>%s</b>" % html.escape(str(source)),
        "Waktu sumber: <b>%s</b>" % html.escape(str(observed)),
        "Status data: <b>%s</b>" % html.escape(str(prov["data_state"])),
    ]
    if gap:
        lines.append("⚠️ <b>Sinyal presisi ditahan:</b> <i>%s</i>" % html.escape(gap))
    return "\n".join(lines)


# --------------------------------------------------------------------------- #
# Rendering
# --------------------------------------------------------------------------- #
def render_vip(plan: Dict[str, Any], agent_name: str = "MBG CHAMPION BOT") -> str:
    """Precise, paid payload: entry / stop / targets / reason, with provenance."""
    sym = plan.get("clean_ticker") or plan.get("ticker") or plan.get("symbol", "ASSET")
    market = str(plan.get("market", "MARKET")).upper()
    action = str(plan.get("direction") or plan.get("action") or "BUY").upper()
    emoji = "🟢" if action in {"BUY", "LONG"} else "🔴"
    # Null is not zero (master plan §7.2): a missing level must render as "—",
    # never as 0.00. Do not use `or` with a numeric default here.
    entry = plan.get("entry_price")
    sl = plan.get("stop_loss")
    tp1 = plan.get("target_1")
    if tp1 is None:
        tp1 = plan.get("take_profit_1")
    tp2 = plan.get("target_2")
    if tp2 is None:
        tp2 = plan.get("take_profit_2")
    rr = plan.get("risk_reward_ratio") or plan.get("rr") or "—"
    thesis = plan.get("thesis") or plan.get("reason", "—")
    strat = plan.get("strategy") or plan.get("strategy_type", "Multi-Regime Quant")

    lines = [
        f"👑 <b>MBG VIP SIGNAL // {market}</b>",
        f"Bot: <b>{html.escape(agent_name)}</b>\n",
        f"🎯 <b>INSTRUMEN:</b> <code>${html.escape(str(sym))}</code>",
        f"⚡ <b>AKSI:</b> {emoji} <b>{action}</b>\n",
        "━━━━━━━━━━━━━━━━━━━━━",
        f"📍 <b>ENTRY ZONE :</b> <code>{_fmt_number(entry)}</code>",
        f"🛡️ <b>STOP LOSS  :</b> <code>{_fmt_number(sl)}</code>",
        f"🎯 <b>TARGET 1   :</b> <code>{_fmt_number(tp1)}</code>",
        f"🚀 <b>TARGET 2   :</b> <code>{_fmt_number(tp2)}</code>",
        f"⚖️ <b>RISK/REWARD:</b> <b>{html.escape(str(rr))}</b>",
        "━━━━━━━━━━━━━━━━━━━━━",
        "💡 <b>LOGIKA & ALASAN:</b>",
        f"  • {html.escape(str(thesis))}",
        f"  • Strategi: <i>{html.escape(str(strat))}</i>",
        "━━━━━━━━━━━━━━━━━━━━━",
        _provenance_footer(plan),
        "\n⚠️ <i>Disiplin Money Management: Risiko maksimal 1-2% per tiket.</i>",
    ]
    return "\n".join(lines)


def render_public(plan: Dict[str, Any], gap: Optional[str] = None) -> str:
    """Free funnel payload: direction and instrument only — never precise levels."""
    sym = plan.get("clean_ticker") or plan.get("ticker") or plan.get("symbol", "ASSET")
    market = str(plan.get("market", "MARKET")).upper()
    action = str(plan.get("direction") or plan.get("action") or "WATCH").upper()
    thesis = plan.get("thesis") or plan.get("reason") or "—"
    return "\n".join(
        [
            f"📣 <b>MBG PUBLIC WATCH // {market}</b>",
            f"🎯 Instrumen: <code>${html.escape(str(sym))}</code> — arah: <b>{html.escape(action)}</b>",
            f"💡 Ringkas: {html.escape(str(thesis))}",
            _provenance_footer(plan, gap=gap),
            "\n🔒 <i>Level entry/stop/target presisi hanya di kanal VIP.</i>",
        ]
    )


# --------------------------------------------------------------------------- #
# Routing
# --------------------------------------------------------------------------- #
def route(
    plans: Iterable[Dict[str, Any]],
    subscribers: Iterable[Subscriber],
    now: Optional[datetime] = None,
    agent_name: str = "MBG CHAMPION BOT",
    max_signals: int = 5,
) -> Tuple[List[RoutedMessage], List[RoutedMessage]]:
    """Return ``(vip_messages, public_messages)``.

    A plan that fails the honesty gate produces **no** VIP message; it produces a
    public message plus a tips-only record describing why it was blocked.
    """
    now = now or datetime.now(timezone.utc)
    entitled = [s for s in subscribers if s.is_entitled(now)]

    vip: List[RoutedMessage] = []
    public: List[RoutedMessage] = []

    for plan in plans:
        sym = str(plan.get("clean_ticker") or plan.get("ticker") or plan.get("symbol", "?"))
        # Pass the same clock used for entitlement so a replay/backfill evaluates
        # freshness consistently instead of against wall time.
        gap = provenance_gap(plan, now=now)

        if gap:
            public.append(
                RoutedMessage(
                    audience="PUBLIC",
                    text=render_public(plan, gap=gap),
                    instrument=sym,
                    blocked_reason="VIP blocked (%s)" % gap,
                )
            )
            continue

        for sub in entitled[:max_signals]:
            vip.append(
                RoutedMessage(
                    audience="VIP",
                    text=render_vip(plan, agent_name=agent_name),
                    instrument=sym,
                    chat_id=sub.chat_id,
                )
            )
        public.append(RoutedMessage(audience="PUBLIC", text=render_public(plan), instrument=sym))

    return vip, public


def dispatch(
    vip: Iterable[RoutedMessage],
    public: Iterable[RoutedMessage],
    notifier: Any = None,
    dry_run: bool = True,
    public_chat_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Deliver messages. With ``dry_run=True`` (default) nothing leaves the process."""
    vip = list(vip)
    public = list(public)
    result: Dict[str, Any] = {
        "dry_run": dry_run,
        "vip_queued": len(vip),
        "public_queued": len(public),
        "vip_sent": 0,
        "public_sent": 0,
        "blocked": [m.blocked_reason for m in public if m.blocked_reason],
        "errors": [],
    }

    if dry_run:
        result["preview"] = [m.as_dict() for m in vip[:2]] + [m.as_dict() for m in public[:1]]
        return result

    if notifier is None:
        from notifiers.telegram_notifier import TelegramNotifier  # engine-relative import

        notifier = TelegramNotifier()

    if not getattr(notifier, "enabled", False):
        result["errors"].append("Telegram credentials absent; nothing sent.")
        return result

    for msg in vip:
        if notifier.send_html_message(msg.text, chat_id=msg.chat_id):
            result["vip_sent"] += 1
        else:
            result["errors"].append("VIP send failed for chat %s" % msg.chat_id)

    target = public_chat_id or getattr(notifier, "chat_id", None)
    for msg in public:
        if notifier.send_html_message(msg.text, chat_id=target):
            result["public_sent"] += 1
        else:
            result["errors"].append("Public send failed")

    return result
