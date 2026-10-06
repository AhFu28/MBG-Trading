"""
Python Module: Auto Send WhatsApp to Mas Fuad (+62 812-2417-0187)

Works seamlessly with the local Node.js Baileys daemon (port 5055).
If the daemon is running and authenticated, sends instantaneously.
If daemon is not running, queues the message safely in `wa_auth/outbox_queue.json`.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error

TARGET_PHONE = "6281224170187"
DAEMON_URL = os.environ.get("WA_BOT_URL", "http://127.0.0.1:5055")
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUTH_DIR = os.path.join(ROOT_DIR, "wa_auth")
QUEUE_FILE = os.path.join(AUTH_DIR, "outbox_queue.json")


def clean_for_whatsapp(text: str) -> str:
    """Strip markdown decoration while keeping Javanese content clean."""
    if not text:
        return ""
    import re
    # Remove heading line
    t = re.sub(r'^\s*#*\s*💬\s*Untuk Mas Fuad\s*:?\s*$', '', text, flags=re.MULTILINE | re.IGNORECASE)
    # Remove quote prefix >
    t = re.sub(r'^\s*>\s?', '', t, flags=re.MULTILINE)
    # Remove bold / italic markdown markers
    t = re.sub(r'\*\*(.+?)\*\*', r'\1', t)
    t = re.sub(r'\*(.+?)\*', r'\1', t)
    # Remove outer quotes
    t = re.sub(r'^\s*["“](.+?)["”]\s*$', r'\1', t, flags=re.MULTILINE)
    # Remove excessive empty lines
    t = re.sub(r'\n{3,}', '\n\n', t)
    return t.strip()


def send_wa_mas_fuad(message: str) -> dict:
    """Send message directly to Mas Fuad via local WhatsApp bot daemon."""
    cleaned = clean_for_whatsapp(message)
    if not cleaned:
        return {"ok": False, "error": "Empty message"}

    # 1. Attempt sending via local HTTP daemon
    payload = json.dumps({"message": cleaned}).encode("utf-8")
    req = urllib.request.Request(
        f"{DAEMON_URL}/send-fuad",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data
    except Exception as e:
        # 2. Daemon not running or unreachable -> Fallback: queue in outbox
        os.makedirs(AUTH_DIR, exist_ok=True)
        queue = []
        if os.path.exists(QUEUE_FILE):
            try:
                with open(QUEUE_FILE, "r", encoding="utf-8") as f:
                    queue = json.load(f)
            except Exception:
                queue = []

        item = {
            "id": f"msg_{int(time.time() * 1000)}",
            "to": f"{TARGET_PHONE}@s.whatsapp.net",
            "message": cleaned,
            "queuedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        queue.append(item)

        tmp = f"{QUEUE_FILE}.tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(queue, f, indent=2)
        os.replace(tmp, QUEUE_FILE)

        return {
            "ok": True,
            "queued": True,
            "messageId": item["id"],
            "note": "Daemon bot offline. Pesan masuk antrean outbox & akan dikirim saat daemon aktif."
        }


def get_wa_status() -> dict:
    """Check WhatsApp daemon status."""
    req = urllib.request.Request(f"{DAEMON_URL}/status", method="GET")
    try:
        with urllib.request.urlopen(req, timeout=3) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        return {"ok": False, "connected": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) > 1:
        msg = " ".join(sys.argv[1:])
        res = send_wa_mas_fuad(msg)
        print(json.dumps(res, indent=2))
    else:
        status = get_wa_status()
        print(json.dumps(status, indent=2))
