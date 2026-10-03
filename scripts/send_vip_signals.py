#!/usr/bin/env python3
"""Send MBG VIP signals / public watch notes from the daily trade plans.

Closes backlog gap GTM-TG-01 (the existing TelegramNotifier.broadcast_vip_trade_signal
had no caller anywhere in the repo).

DRY RUN BY DEFAULT. Nothing is sent unless `--live` is passed AND
TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID are present.

Examples
--------
    python scripts/send_vip_signals.py                     # dry run, default bundle
    python scripts/send_vip_signals.py --limit 3 --json
    python scripts/send_vip_signals.py --live              # actually sends
"""

from __future__ import annotations

import argparse
import json
import os
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENGINE_DIR = os.path.join(REPO_ROOT, "engine")
for path in (REPO_ROOT, ENGINE_DIR):
    if path not in sys.path:
        sys.path.insert(0, path)

# Windows consoles default to cp1252 and crash on the emoji in Telegram markup.
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        try:
            _stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

from notifiers.vip_signal_router import (  # noqa: E402
    DEFAULT_BUNDLE_PATH,
    DEFAULT_SUBSCRIBERS_PATH,
    dispatch,
    extract_plans,
    load_json,
    load_subscribers,
    route,
)


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description="MBG VIP signal dispatcher")
    parser.add_argument("--bundle", default=DEFAULT_BUNDLE_PATH,
                        help="daily trade plans JSON (default: engine/cache/daily_trade_plans.json)")
    parser.add_argument("--subscribers", default=DEFAULT_SUBSCRIBERS_PATH,
                        help="subscriber allowlist JSON (or set MBG_VIP_CHAT_IDS)")
    parser.add_argument("--limit", type=int, default=5, help="max VIP recipients per signal")
    parser.add_argument("--live", action="store_true",
                        help="actually send. Without this flag the run is a dry run.")
    parser.add_argument("--public-chat-id", default=None,
                        help="chat id for the free public channel (defaults to TELEGRAM_CHAT_ID)")
    parser.add_argument("--json", action="store_true", help="print the machine-readable result only")
    return parser.parse_args(argv)


def main(argv=None) -> int:
    args = parse_args(argv)

    if not os.path.exists(args.bundle):
        print("ERROR: bundle not found: %s" % args.bundle, file=sys.stderr)
        return 2

    plans = extract_plans(load_json(args.bundle))
    if not plans:
        print("ERROR: no plans found in %s" % args.bundle, file=sys.stderr)
        return 2

    subscribers = load_subscribers(args.subscribers)
    entitled = [s for s in subscribers if s.is_entitled()]
    print("plans=%d subscribers=%d entitled=%d" % (len(plans), len(subscribers), len(entitled)),
          file=sys.stderr)

    if not entitled:
        print("WARNING: no entitled subscribers; VIP messages will be empty. "
              "Fill %s or set MBG_VIP_CHAT_IDS." % args.subscribers, file=sys.stderr)

    vip, public = route(plans, subscribers, max_signals=args.limit)
    result = dispatch(vip, public, dry_run=not args.live, public_chat_id=args.public_chat_id)

    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print("=" * 72)
        print("DRY RUN" if result["dry_run"] else "LIVE SEND")
        print("=" * 72)
        print("VIP queued   : %d" % result["vip_queued"])
        print("PUBLIC queued: %d" % result["public_queued"])
        if result["blocked"]:
            print("Blocked from VIP by honesty gate:")
            for reason in result["blocked"]:
                print("  - %s" % reason)
        if result["errors"]:
            print("Errors:")
            for err in result["errors"]:
                print("  - %s" % err)
        print("-" * 72)
        for preview in result.get("preview", [])[:3]:
            print("[%s] %s" % (preview["audience"], preview["instrument"]))
            print(preview["text"])
            print("-" * 72)

    return 0 if not result["errors"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
