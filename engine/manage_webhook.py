import os
import sys
import json
import urllib.request
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

def get_bot_token():
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        print("ERROR: TELEGRAM_BOT_TOKEN not found in .env file.")
        sys.exit(1)
    return token

def check_webhook():
    token = get_bot_token()
    url = f"https://api.telegram.org/bot{token}/getWebhookInfo"
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print("="*60)
            print("TELEGRAM WEBHOOK STATUS:")
            print(json.dumps(data, indent=2))
            print("="*60)
            return data
    except Exception as e:
        print(f"Failed to check webhook: {e}")
        return None

def set_webhook(webhook_url: str):
    token = get_bot_token()
    url = f"https://api.telegram.org/bot{token}/setWebhook"
    payload = json.dumps({
        "url": webhook_url,
        "drop_pending_updates": True
    }).encode("utf-8")

    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print("="*60)
            print("SET WEBHOOK RESULT:")
            print(json.dumps(data, indent=2))
            print("="*60)
            return data
    except Exception as e:
        print(f"Failed to set webhook: {e}")
        return None

def delete_webhook():
    token = get_bot_token()
    url = f"https://api.telegram.org/bot{token}/deleteWebhook?drop_pending_updates=True"
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print("="*60)
            print("DELETE WEBHOOK RESULT:")
            print(json.dumps(data, indent=2))
            print("="*60)
            return data
    except Exception as e:
        print(f"Failed to delete webhook: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  py engine/manage_webhook.py check")
        print("  py engine/manage_webhook.py set https://<your-project>.pages.dev/api/telegram-webhook")
        print("  py engine/manage_webhook.py delete")
    else:
        cmd = sys.argv[1].lower()
        if cmd == "check":
            check_webhook()
        elif cmd == "set":
            if len(sys.argv) < 3:
                print("Error: Missing webhook URL. Example:")
                print("  py engine/manage_webhook.py set https://project-mbg-v2.pages.dev/api/telegram-webhook")
            else:
                set_webhook(sys.argv[2])
        elif cmd == "delete":
            delete_webhook()
        else:
            print(f"Unknown command: {cmd}")
