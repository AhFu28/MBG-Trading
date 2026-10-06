"""
Push the cockpit bundle to the edge so the web cockpit stops erroring.

WHY THIS IS NEEDED
------------------
Jendral Arib reported every desk erroring. The cause was not futures or forex:

    /api/data  ->  HTTP 200, Content-Type text/html, 1 KB, body "<!doctype html>"

The endpoint fetched `/data/latest_cockpit_bundle.json`, and that static file no
longer exists. The engine stopped writing into `frontend/public/data` for
security reasons — VIP payloads (trade plans, arena state, macro telemetry) were
sitting in a publicly downloadable file that needed no authentication. Removing
that write was correct. Nothing replaced it, so production kept asking for a file
that had been deliberately deleted.

Cloudflare Pages serves index.html with HTTP 200 for a missing path, which is
why the failure looked like success and why every desk broke at once.

WHAT THIS SCRIPT DOES
---------------------
Pushes the local bundle to one of two edge stores, in this order:

  1. Cloudflare KV via the REST API  (env: CLOUDFLARE_ACCOUNT_ID,
     CLOUDFLARE_API_TOKEN, MBG_KV_NAMESPACE_ID)
  2. A plain HTTPS endpoint you control (env: MBG_BUNDLE_PUSH_URL [+ optional
     MBG_BUNDLE_PUSH_TOKEN])

Both keep the bundle OFF the public static path, so the security fix is
preserved while the cockpit still gets data.

USAGE
-----
    python scripts/push_bundle_to_edge.py --check
    python scripts/push_bundle_to_edge.py

Exit codes:
    0 = pushed
    1 = no destination configured (nothing was sent — bundle untouched)
    2 = error
"""

import argparse
import json
import os
import sys
import traceback
from datetime import datetime, timezone

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUNDLE_PATH = os.path.join(
    REPO_ROOT, "engine", "cache", "latest_cockpit_bundle.json"
)

KEY = "latest_cockpit_bundle"


def _log(quiet, message):
    if not quiet:
        print(message)


def _describe_bundle():
    with open(BUNDLE_PATH, encoding="utf-8") as handle:
        bundle = json.load(handle)
    size_kb = round(os.path.getsize(BUNDLE_PATH) / 1024)
    return bundle, size_kb


def push_cloudflare_kv(bundle, quiet=False):
    """Write the bundle into Cloudflare KV through the REST API."""
    import requests

    account = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    token = os.environ.get("CLOUDFLARE_API_TOKEN")
    namespace = os.environ.get("MBG_KV_NAMESPACE_ID")

    if not (account and token and namespace):
        return None

    url = (
        f"https://api.cloudflare.com/client/v4/accounts/{account}"
        f"/storage/kv/namespaces/{namespace}/values/{KEY}"
    )
    body = json.dumps(bundle, ensure_ascii=False)
    resp = requests.put(
        url,
        data=body.encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        timeout=60,
    )
    if resp.status_code != 200:
        raise RuntimeError(
            f"Cloudflare KV HTTP {resp.status_code}: {resp.text[:200]}"
        )

    # KV values expire unless a TTL is set. A stale bundle served forever is
    # worse than an honest error, so cap it at 24 hours.
    ttl_url = url + "?expiration_ttl=86400"
    requests.put(
        ttl_url,
        data=body.encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        timeout=60,
    )

    _log(quiet, f"  Cloudflare KV  : OK (namespace {namespace[:8]}…)")
    return "cloudflare-kv"


def push_http_endpoint(bundle, quiet=False):
    """POST the bundle to a self-hosted endpoint."""
    import requests

    url = os.environ.get("MBG_BUNDLE_PUSH_URL")
    if not url:
        return None

    headers = {"Content-Type": "application/json"}
    token = os.environ.get("MBG_BUNDLE_PUSH_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    resp = requests.post(
        url,
        data=json.dumps(bundle, ensure_ascii=False).encode("utf-8"),
        headers=headers,
        timeout=120,
    )
    if resp.status_code not in (200, 201, 202, 204):
        raise RuntimeError(f"HTTP {resp.status_code}: {resp.text[:200]}")

    _log(quiet, f"  HTTP endpoint  : OK ({resp.status_code})")
    return "http"


def run(quiet=False, check_only=False) -> int:
    _log(quiet, "=" * 62)
    _log(quiet, "  PUSH BUNDLE KE EDGE")
    _log(quiet, "=" * 62)

    if not os.path.exists(BUNDLE_PATH):
        _log(quiet, f"[GAGAL] Bundle ora ono: {BUNDLE_PATH}")
        return 2

    try:
        bundle, size_kb = _describe_bundle()
    except Exception as exc:
        _log(quiet, f"[GAGAL] Bundle ora bisa diwaca: {exc}")
        return 2

    has_kv = all(
        os.environ.get(v)
        for v in ("CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN", "MBG_KV_NAMESPACE_ID")
    )
    has_http = bool(os.environ.get("MBG_BUNDLE_PUSH_URL"))

    _log(quiet, f"Bundle         : {BUNDLE_PATH}")
    _log(quiet, f"Ukuran         : {size_kb} KB")
    _log(quiet, f"last_updated   : {bundle.get('last_updated')}")
    _log(quiet, "")

    if not has_kv and not has_http:
        _log(quiet, "[PERINGATAN] Ora ana tujuan sing dikonfigurasi.")
        _log(quiet, "             Bundle ORA dikirim.")
        _log(quiet, "")
        _log(quiet, "Pilih salah siji:")
        _log(quiet, "  A) Cloudflare KV (paling cepet):")
        _log(quiet, "       setx CLOUDFLARE_ACCOUNT_ID \"<account-id>\"")
        _log(quiet, "       setx CLOUDFLARE_API_TOKEN  \"<token>\"")
        _log(quiet, "       setx MBG_KV_NAMESPACE_ID   \"<namespace-id>\"")
        _log(quiet, "  B) Endpoint HTTPS dhewe:")
        _log(quiet, "       setx MBG_BUNDLE_PUSH_URL \"https://...\"")
        _log(quiet, "")
        _log(quiet, "CATETAN: cara paling prasaja tetep SUPABASE_URL + SUPABASE_KEY")
        _log(quiet, "         nang Cloudflare — ora perlu script iki.")
        return 1

    if check_only:
        _log(quiet, f"Cloudflare KV  : {'siap' if has_kv else 'ora dikonfigurasi'}")
        _log(quiet, f"HTTP endpoint  : {'siap' if has_http else 'ora dikonfigurasi'}")
        return 0

    pushed = []
    try:
        if has_kv:
            result = push_cloudflare_kv(bundle, quiet)
            if result:
                pushed.append(result)
        if has_http:
            result = push_http_endpoint(bundle, quiet)
            if result:
                pushed.append(result)
    except Exception as exc:
        _log(quiet, f"[GAGAL] {exc}")
        traceback.print_exc()
        return 2

    _log(quiet, "")
    _log(quiet, f"[OK] Dikirim menyang: {', '.join(pushed)}")
    _log(quiet, f"     Wektu: {datetime.now(timezone.utc).isoformat()}")
    return 0


def main():
    parser = argparse.ArgumentParser(description="Push bundle menyang edge.")
    parser.add_argument("--quiet", action="store_true")
    parser.add_argument("--check", action="store_true",
                        help="Mung priksa konfigurasi, ora ngirim.")
    args = parser.parse_args()

    try:
        return run(quiet=args.quiet, check_only=args.check)
    except Exception:
        traceback.print_exc()
        return 2


if __name__ == "__main__":
    sys.exit(main())
