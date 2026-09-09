import os
import sys
import json
import time
import signal
import logging
import urllib.request
from dotenv import load_dotenv

# Ensure root workspace and engine are in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

# Load environment variables
load_dotenv(os.path.join(BASE_DIR, ".env"))

from engine.notifiers.telegram_notifier import TelegramNotifier
from engine.notifiers.telegram_command_handler import TelegramCommandHandler

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s [%(name)s]: %(message)s"
)
logger = logging.getLogger("MBGBotListener")

running = True

def handle_sigint(sig, frame):
    global running
    logger.info("Shutdown signal received. Exiting MBG Bot Listener...")
    running = False

signal.signal(signal.SIGINT, handle_sigint)
signal.signal(signal.SIGTERM, handle_sigint)

def run_listener():
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token:
        logger.error("TELEGRAM_BOT_TOKEN not found in environment. Bot listener cannot start.")
        sys.exit(1)

    notifier = TelegramNotifier()
    handler = TelegramCommandHandler()

    # 1. Register command menu automatically in Telegram
    logger.info("Registering Telegram Bot command menu automatically...")
    registered = notifier.set_my_commands()
    if registered:
        logger.info("Bot command menu registered successfully! Users will see suggestions when typing '/'.")
    else:
        logger.warning("Could not register bot command menu. Polling will still proceed.")

    offset = 0
    poll_url_base = f"https://api.telegram.org/bot{bot_token}"

    logger.info("=" * 60)
    logger.info("🚀 MBG TELEGRAM V1 BOT LISTENER ACTIVE & LISTENING 24/7")
    logger.info("Perintah yang didukung di grup:")
    logger.info("  - /saham <KODE>  (cth: /saham BBCA, cek bca)")
    logger.info("  - /crypto <KOIN> (cth: /crypto BTC, cek btc)")
    logger.info("  - /news          (cth: /news, berita)")
    logger.info("  - /plan          (cth: /plan, sinyal)")
    logger.info("  - /help          (cth: /help, menu)")
    logger.info("=" * 60)

    while running:
        try:
            req_url = f"{poll_url_base}/getUpdates?offset={offset}&timeout=20"
            req = urllib.request.Request(req_url, headers={"User-Agent": "MBG-Telegram-Bot-v1"})

            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            if not data.get("ok"):
                logger.warning(f"Telegram getUpdates response not ok: {data}")
                time.sleep(2)
                continue

            updates = data.get("result", [])
            for update in updates:
                update_id = update.get("update_id", 0)
                offset = max(offset, update_id + 1)

                message = update.get("message") or update.get("channel_post")
                if not message:
                    continue

                text = message.get("text", "")
                if not text:
                    continue

                chat = message.get("chat", {})
                chat_id = chat.get("id")
                message_id = message.get("message_id")
                from_user = message.get("from", {})
                user_id = from_user.get("id", chat_id)
                user_name = from_user.get("first_name", "Trader")

                logger.info(f"Incoming message from [{user_name}] in chat [{chat_id}]: {text}")

                # Process command via smart handler
                reply = handler.process_message(text, user_id)
                if reply:
                    notifier.send_html_message(
                        html_text=reply,
                        chat_id=str(chat_id),
                        reply_to_message_id=message_id
                    )

        except urllib.error.URLError as e:
            logger.warning(f"Network / connection glitch with Telegram API: {e}. Retrying in 3s...")
            time.sleep(3)
        except Exception as e:
            logger.error(f"Unexpected error in bot listener loop: {e}", exc_info=True)
            time.sleep(3)

    logger.info("MBG Bot Listener has stopped cleanly.")

if __name__ == "__main__":
    run_listener()
