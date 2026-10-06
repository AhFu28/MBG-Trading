"""
Refresh ONLY the crypto_futures section of the cockpit bundle.

WHY A SEPARATE SCRIPT
---------------------
The full pipeline (`run_pipeline.py`) needs broker sessions, MT5 and IDX feeds.
Running it every 30 minutes just to refresh perpetual funding rates would be
slow, fragile and could clobber other sections with a partial run.

This script touches exactly one key: `crypto_futures`. Everything else in the
bundle is read, preserved and written back untouched.

USAGE
-----
    python scripts/refresh_crypto_futures.py
    python scripts/refresh_crypto_futures.py --quiet     (untuk Task Scheduler)

Exit codes:
    0 = bundle updated (data live)
    1 = ran but no exchange was reachable (bundle left intact, marked stale)
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

from fetchers.crypto_futures import CryptoFuturesFetcher  # noqa: E402


def _log(quiet, message):
    if not quiet:
        print(message)


def refresh(quiet=False) -> int:
    _log(quiet, "=" * 62)
    _log(quiet, "  REFRESH CRYPTO FUTURES")
    _log(quiet, "=" * 62)

    if not os.path.exists(BUNDLE_PATH):
        _log(quiet, f"[GAGAL] Bundle tidak ditemukan: {BUNDLE_PATH}")
        _log(quiet, "        Jalankan pipeline utama dulu untuk membuatnya.")
        return 2

    try:
        with open(BUNDLE_PATH, encoding="utf-8") as handle:
            bundle = json.load(handle)
    except Exception as exc:
        _log(quiet, f"[GAGAL] Bundle tidak bisa dibaca: {exc}")
        return 2

    previous = (bundle.get("crypto_futures") or {}).get("updated_at")
    _log(quiet, f"Data sebelumnya : {previous or '(belum ada)'}")

    try:
        fresh = CryptoFuturesFetcher().execute()
    except Exception as exc:
        _log(quiet, f"[GAGAL] Fetcher error: {exc}")
        traceback.print_exc()
        return 2

    source = fresh.get("source")
    total_liq = (fresh.get("liquidations_24h") or {}).get("total_usd", 0)

    if source in (None, "unreachable"):
        # CRITICAL: do NOT overwrite good data with empty rows. Leaving the old
        # snapshot in place is better than replacing it with zeroes — the desk
        # already labels stale data by timestamp.
        _log(quiet, "[PERINGATAN] Tidak ada bursa yang bisa diakses.")
        _log(quiet, "             Bundle TIDAK diubah (data lama tetap dipakai).")
        return 1

    bundle["crypto_futures"] = fresh
    now = datetime.now(timezone.utc).isoformat()
    bundle.setdefault("section_timestamps", {})["crypto"] = now

    # Write atomically: a half-written bundle would blank the whole cockpit.
    tmp_path = f"{BUNDLE_PATH}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as handle:
        json.dump(bundle, handle, ensure_ascii=False, indent=2)
    os.replace(tmp_path, BUNDLE_PATH)

    _log(quiet, f"Sumber          : {source}")
    _log(quiet, f"Funding rates   : {len(fresh.get('funding_rates') or [])} pair")
    _log(quiet, f"Open interest   : {len(fresh.get('open_interest') or [])} pair")
    _log(quiet, f"Long/short      : {len(fresh.get('long_short_ratio') or [])} pair")
    _log(quiet, f"Likuidasi 24 jam: ${total_liq:,.0f}")
    _log(quiet, f"Diperbarui      : {fresh.get('updated_at')}")
    _log(quiet, "[OK] Bundle diperbarui.")
    return 0


def main():
    parser = argparse.ArgumentParser(description="Refresh bagian crypto_futures pada bundle.")
    parser.add_argument("--quiet", action="store_true", help="Hanya cetak error (untuk penjadwal).")
    args = parser.parse_args()

    try:
        return refresh(quiet=args.quiet)
    except Exception:
        traceback.print_exc()
        return 2


if __name__ == "__main__":
    sys.exit(main())
