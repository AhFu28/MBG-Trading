#!/usr/bin/env python3
"""Backfill provenance onto existing trade plans so the VIP gate can pass them.

WHY THIS EXISTS
---------------
The VIP honesty gate (engine/notifiers/vip_signal_router.py) refuses to send a
precise paid signal unless the plan carries `source` and `observed_at`. Plans
generated before 2026-10-05 lack both, so all 12 were blocked and the VIP channel
would have stayed silent even after being switched on.

The generator in engine/analyzer/llm_brain.py now writes provenance at creation
time. This script repairs ALREADY-GENERATED plans without waiting for the next
pipeline run, so VIP can be activated today.

It does NOT invent data:
  * `source` is taken from the plan's own market field (IDX vs CRYPTO) and names
    the fetcher that actually produced it;
  * `observed_at` is taken from the plan's existing `created_at`, which is when
    the plan was genuinely computed.

DRY RUN BY DEFAULT. Pass --write to modify the file. A .bak copy is always made.

    python scripts/backfill_plan_provenance.py            # preview
    python scripts/backfill_plan_provenance.py --write    # apply
"""

from __future__ import annotations

import argparse
import copy
import json
import os
import shutil
import sys
from datetime import datetime, timezone

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_PLANS = os.path.join(REPO_ROOT, "engine", "cache", "daily_trade_plans.json")

SOURCE_BY_MARKET = {
    "IDX": "IDXMarketFetcher (TradingView BEI scanner) + TechnicalIndicators RSI/MA20",
    "CRYPTO": "CryptoSpotFetcher (Binance 24h ticker + technical setup scan)",
}


def _plans_of(payload):
    """Return (container_kind, plans) without losing the file's original shape."""
    if isinstance(payload, list):
        return "list", payload
    if isinstance(payload, dict):
        for key in ("daily_trade_plans", "plans"):
            if isinstance(payload.get(key), list):
                return key, payload[key]
    return None, []


def needs_backfill(plan: dict) -> bool:
    return not (plan.get("source") and plan.get("observed_at"))


def backfill(plan: dict) -> dict:
    """Return a copy of `plan` with provenance filled in from real data."""
    out = copy.deepcopy(plan)
    market = str(out.get("market", "")).upper()

    if not out.get("source"):
        out["source"] = SOURCE_BY_MARKET.get(
            market, f"MBG pipeline ({market or 'unknown market'})"
        )

    if not out.get("observed_at"):
        # created_at is when this plan was genuinely computed — the honest choice.
        observed = out.get("created_at")
        if not observed:
            observed = datetime.now(timezone.utc).isoformat()
            out["observed_at_backfilled_at_runtime"] = True
        out["observed_at"] = observed

    if not out.get("data_state"):
        out["data_state"] = "live"

    return out


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Backfill trade plan provenance")
    parser.add_argument("--plans", default=DEFAULT_PLANS, help="path to daily_trade_plans.json")
    parser.add_argument("--write", action="store_true", help="actually write (default: preview)")
    args = parser.parse_args(argv)

    if not os.path.exists(args.plans):
        print(f"ERROR: not found: {args.plans}", file=sys.stderr)
        return 2

    with open(args.plans, "r", encoding="utf-8") as fh:
        payload = json.load(fh)

    kind, plans = _plans_of(payload)
    if kind is None:
        print("ERROR: unrecognised plans file shape", file=sys.stderr)
        return 2

    todo = [p for p in plans if isinstance(p, dict) and needs_backfill(p)]
    print(f"plans total        : {len(plans)}")
    print(f"needing provenance : {len(todo)}")

    if not todo:
        print("Nothing to do — every plan already carries provenance.")
        return 0

    for p in todo:
        print(f"  + {p.get('plan_id', '?')[:52]:<52} "
              f"market={p.get('market', '?'):<7} "
              f"observed_at={p.get('created_at', '(runtime)')[:19]}")

    if not args.write:
        print("\nDRY RUN — nothing written. Re-run with --write to apply.")
        return 0

    backup = args.plans + ".bak"
    shutil.copy2(args.plans, backup)

    repaired = [backfill(p) if isinstance(p, dict) else p for p in plans]

    if kind == "list":
        new_payload = repaired
    else:
        new_payload = dict(payload)
        new_payload[kind] = repaired

    with open(args.plans, "w", encoding="utf-8") as fh:
        json.dump(new_payload, fh, indent=2, ensure_ascii=False)

    print(f"\nWrote {len(repaired)} plans -> {args.plans}")
    print(f"Backup            -> {backup}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
