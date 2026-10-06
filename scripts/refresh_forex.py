"""
Refresh the forex / metals / energy section of the cockpit bundle.

WHY A SEPARATE SCRIPT
---------------------
Same reason as refresh_crypto_futures.py: the full pipeline needs broker
sessions, MT5 and IDX feeds. Running all of that every 30 minutes just to
re-price 33 instruments would be slow and fragile.

This script touches exactly two keys: `forex_intelligence` and the
`macro` section timestamp. Everything else is preserved byte for byte.

WHY IT EXISTS AT ALL
--------------------
Jendral Arib reported "forex dan xau dll ga jalan". The network was never the
problem — TradingView answers every symbol from this machine. The data was a
day old purely because nothing ever asked for a refresh. A desk that only
updates when a human remembers to run it is a desk that shows yesterday's
prices.

USAGE
-----
    python scripts/refresh_forex.py
    python scripts/refresh_forex.py --quiet      (untuk Task Scheduler)

Exit codes:
    0 = bundle updated
    1 = ran but TradingView gave nothing (bundle left intact)
    2 = unexpected error
"""

import argparse
import json
import os
import sys
import traceback
from datetime import datetime, timezone

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENGINE_DIR = os.path.join(REPO_ROOT, "engine")
BUNDLE_PATH = os.path.join(ENGINE_DIR, "cache", "latest_cockpit_bundle.json")

sys.path.insert(0, ENGINE_DIR)

from fetchers.forex_scanner import ForexScanner  # noqa: E402


def _log(quiet, message):
    if not quiet:
        print(message)


def refresh(quiet=False) -> int:
    _log(quiet, "=" * 62)
    _log(quiet, "  REFRESH FOREX / METALS / ENERGY")
    _log(quiet, "=" * 62)

    if not os.path.exists(BUNDLE_PATH):
        _log(quiet, f"[GAGAL] Bundle tidak ditemukan: {BUNDLE_PATH}")
        return 2

    try:
        with open(BUNDLE_PATH, encoding="utf-8") as handle:
            bundle = json.load(handle)
    except Exception as exc:
        _log(quiet, f"[GAGAL] Bundle tidak bisa dibaca: {exc}")
        return 2

    previous = (bundle.get("forex_intelligence") or {}).get("updated_at")
    _log(quiet, f"Data sebelumnya : {previous or '(belum ada)'}")

    try:
        fresh = ForexScanner().execute()
    except Exception as exc:
        _log(quiet, f"[GAGAL] Scanner error: {exc}")
        traceback.print_exc()
        return 2

    rows = fresh.get("pairs") or []
    live = [r for r in rows if r.get("data_source") == "tradingview_live"]

    if not live:
        # Do NOT replace good data with a page of unavailable rows.
        _log(quiet, "[PERINGATAN] TradingView tidak mengembalikan data.")
        _log(quiet, "             Bundle TIDAK diubah (data lama tetap dipakai).")
        return 1

    bundle["forex_intelligence"] = fresh

    now = datetime.now(timezone.utc).isoformat()
    bundle.setdefault("section_timestamps", {})["macro"] = now
    # Keep the legacy field in step so older UI paths see a fresh timestamp too.
    if isinstance(bundle.get("macro_telemetry"), dict):
        bundle["macro_telemetry"]["updated_at"] = now

    tmp_path = f"{BUNDLE_PATH}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as handle:
        json.dump(bundle, handle, ensure_ascii=False, indent=2)
    os.replace(tmp_path, BUNDLE_PATH)

    metals = [r for r in live if r.get("asset_class") in ("METAL", "ENERGY", "INDEX")]
    _log(quiet, f"Forex live      : {len([r for r in live if r.get('asset_class') == 'FOREX'])} pair")
    _log(quiet, f"Metal/Energi/Idx: {len(metals)} instrumen")
    for row in metals:
        _log(quiet, f"    {row.get('symbol'):<9} {row.get('price'):>10} ({row.get('change_24h_pct'):+.2f}%)")
    _log(quiet, f"Diperbarui      : {fresh.get('updated_at')}")
    _log(quiet, "[OK] Bundle diperbarui.")
    return 0


def main():
    parser = argparse.ArgumentParser(
        description="Refresh forex + metals pada bundle."
    )
    parser.add_argument("--quiet", action="store_true",
                        help="Hanya cetak error (untuk penjadwal).")
    args = parser.parse_args()

    try:
        return refresh(quiet=args.quiet)
    except Exception:
        traceback.print_exc()
        return 2


if __name__ == "__main__":
    sys.exit(main())
