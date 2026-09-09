import os
import json
import time
import logging
import urllib.request
import urllib.error
import urllib.parse
import math

logger = logging.getLogger("TelegramBotHandler")

class TelegramBotHandler:
    def __init__(self):
        self.bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
        self.chat_id = os.environ.get("TELEGRAM_CHAT_ID")
        if not self.bot_token:
            logger.warning("TELEGRAM_BOT_TOKEN not found in environment variables.")
        
        self.api_url = f"https://api.telegram.org/bot{self.bot_token}/"
        self.cache_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "cache")
        self.last_update_id = 0

    def load_cache(self, filename):
        file_path = os.path.join(self.cache_dir, filename)
        if not os.path.exists(file_path):
            return None
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading {filename}: {e}")
            return None

    def send_message(self, chat_id, text):
        if not self.bot_token:
            return
        
        url = self.api_url + "sendMessage"
        data = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML",
            "disable_web_page_preview": True
        }
        
        req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers={"Content-Type": "application/json"})
        try:
            urllib.request.urlopen(req)
        except Exception as e:
            logger.error(f"Failed to send message: {e}")

    def handle_command(self, chat_id, command, args):
        if command == "/start":
            msg = (
                "🤖 <b>Welcome to Market Brain Bot!</b>\n\n"
                "Available commands:\n"
                "🔹 /rekom - Top 5 active trade plan recommendations (IDX + Crypto)\n"
                "🔹 /cek &lt;TICKER&gt; - Look up a specific ticker's analysis\n"
                "🔹 /news - Latest 5 macro news headlines\n"
                "🔹 /lot &lt;MODAL&gt; &lt;HARGA_ENTRY&gt; &lt;HARGA_SL&gt; - Calculate max lots based on 2% risk\n"
            )
            self.send_message(chat_id, msg)
            
        elif command == "/rekom":
            plans = self.load_cache("daily_trade_plans.json")
            if not plans:
                self.send_message(chat_id, "⚠️ No trade plans available currently.")
                return
            
            active_plans = plans[:5]
            msg = "📈 <b>TOP 5 TRADE PLANS</b>\n\n"
            for plan in active_plans:
                ticker = plan.get("ticker", "N/A")
                action = plan.get("action", "N/A")
                entry = plan.get("entry_zone", "N/A")
                tp = plan.get("take_profit", "N/A")
                sl = plan.get("stop_loss", "N/A")
                thesis = plan.get("thesis", "N/A")
                msg += f"<b>{ticker}</b> | {action}\n"
                msg += f"🎯 Entry: {entry} | TP: {tp} | SL: {sl}\n"
                msg += f"💡 {thesis}\n\n"
            
            self.send_message(chat_id, msg)
            
        elif command == "/cek":
            if not args:
                self.send_message(chat_id, "⚠️ Please provide a ticker: /cek &lt;TICKER&gt;")
                return
            
            ticker = args[0].upper()
            plans = self.load_cache("daily_trade_plans.json") or []
            crypto = self.load_cache("crypto_spot_10.json") or []
            idx_cat = self.load_cache("idx_categorized.json") or []
            
            found = False
            for plan in plans:
                if plan.get("ticker", "").upper() == ticker:
                    action = plan.get("action", "N/A")
                    entry = plan.get("entry_zone", "N/A")
                    tp = plan.get("take_profit", "N/A")
                    sl = plan.get("stop_loss", "N/A")
                    rr = plan.get("risk_reward_ratio", "N/A")
                    thesis = plan.get("thesis", "N/A")
                    
                    msg = (
                        f"🔎 <b>Analysis for {ticker}</b>\n\n"
                        f"Action: <b>{action}</b>\n"
                        f"🎯 Entry: {entry}\n"
                        f"💵 TP: {tp}\n"
                        f"🛑 SL: {sl}\n"
                        f"⚖️ R:R: {rr}\n\n"
                        f"💡 Thesis:\n{thesis}"
                    )
                    self.send_message(chat_id, msg)
                    found = True
                    break
            
            if not found:
                for c in crypto:
                    if c.get("symbol", "").upper() == ticker or c.get("symbol", "").upper() == ticker + "USDT":
                        msg = f"🔎 <b>Crypto Analysis for {ticker}</b>\n\n"
                        msg += f"Price: {c.get('price', 'N/A')}\n"
                        msg += f"Signal: {c.get('signal', 'N/A')}\n"
                        self.send_message(chat_id, msg)
                        found = True
                        break
            
            if not found:
                self.send_message(chat_id, f"⚠️ Ticker <b>{ticker}</b> not found in active recommendations or analysis.")

        elif command == "/news":
            macro = self.load_cache("macro_telemetry.json")
            if not macro or "news" not in macro:
                self.send_message(chat_id, "⚠️ No recent news available.")
                return
            
            news_items = macro.get("news", [])[:5]
            msg = "📰 <b>LATEST MACRO NEWS</b>\n\n"
            for item in news_items:
                title = item.get("title", "N/A")
                tags = " ".join([f"#{t}" for t in item.get("tags", [])])
                msg += f"🔹 {title}\n<i>{tags}</i>\n\n"
                
            self.send_message(chat_id, msg)

        elif command == "/lot":
            if len(args) < 3:
                self.send_message(chat_id, "⚠️ Usage: /lot &lt;MODAL&gt; &lt;HARGA_ENTRY&gt; &lt;HARGA_SL&gt;")
                return
            
            try:
                modal = float(args[0])
                entry = float(args[1])
                sl = float(args[2])
                
                if entry <= sl:
                    self.send_message(chat_id, "⚠️ Entry price must be greater than Stop Loss for long positions.")
                    return
                
                risk_amount = modal * 0.02
                loss_per_share = entry - sl
                max_shares = risk_amount / loss_per_share
                max_lots = math.floor(max_shares / 100)
                
                msg = (
                    f"🧮 <b>Lot Calculator (2% Risk)</b>\n\n"
                    f"💰 Modal: {modal:,.0f}\n"
                    f"🎯 Entry: {entry:,.0f}\n"
                    f"🛑 SL: {sl:,.0f}\n\n"
                    f"⚠️ Risk Amount: {risk_amount:,.0f}\n"
                    f"✅ <b>Max Lots: {max_lots}</b>"
                )
                self.send_message(chat_id, msg)
                
            except ValueError:
                self.send_message(chat_id, "⚠️ Invalid numbers provided. Please use numbers only.")

        else:
            self.send_message(chat_id, "⚠️ Unknown command. Use /start to see available commands.")

    def run_polling(self, timeout=30, max_cycles=10):
        if not self.bot_token:
            logger.error("No bot token available, aborting polling.")
            return

        logger.info(f"Starting Telegram Bot Polling (max_cycles={max_cycles})...")
        
        cycle = 0
        while cycle < max_cycles:
            try:
                url = self.api_url + f"getUpdates?timeout={timeout}&offset={self.last_update_id + 1}"
                req = urllib.request.Request(url)
                
                with urllib.request.urlopen(req, timeout=timeout + 5) as response:
                    data = json.loads(response.read().decode('utf-8'))
                    
                if not data.get("ok"):
                    logger.error(f"Telegram API Error: {data}")
                    time.sleep(2)
                    cycle += 1
                    continue
                
                for update in data.get("result", []):
                    self.last_update_id = update["update_id"]
                    message = update.get("message")
                    
                    if not message or "text" not in message:
                        continue
                        
                    chat_id = message["chat"]["id"]
                    text = message["text"].strip()
                    
                    if text.startswith("/"):
                        parts = text.split()
                        command = parts[0].lower()
                        args = parts[1:]
                        logger.info(f"Received command: {command} from {chat_id}")
                        self.handle_command(chat_id, command, args)
                        
            except urllib.error.URLError as e:
                logger.warning(f"Polling timeout or network error: {e}")
            except Exception as e:
                logger.error(f"Unexpected polling error: {e}")
                time.sleep(2)
                
            cycle += 1
            
        logger.info("Bot Polling cycle limit reached. Exiting gracefully.")
