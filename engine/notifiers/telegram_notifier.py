import os
import json
import logging
import urllib.request
from typing import List, Dict, Any, Optional

logger = logging.getLogger("TelegramNotifier")

class TelegramNotifier:
    def __init__(self):
        self.bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.chat_id = os.getenv("TELEGRAM_CHAT_ID")
        self.enabled = bool(self.bot_token and self.chat_id)

        if self.enabled:
            logger.info("TelegramNotifier initialized with valid credentials.")
        else:
            logger.info("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not found in ENV. Telegram alerts disabled.")

    def set_my_commands(self) -> bool:
        """Registers the bot command menu automatically in Telegram."""
        if not self.enabled:
            return False

        commands = [
            {"command": "saham", "description": "Cek analisa saham BEI (cth: /saham BBCA)"},
            {"command": "crypto", "description": "Cek harga & support kripto (cth: /crypto BTC)"},
            {"command": "news", "description": "Berita makro & komoditas dunia terkini"},
            {"command": "plan", "description": "Lihat saham & kripto pilihan hari ini"},
            {"command": "help", "description": "Panduan cara memakai bot di grup"}
        ]

        url = f"https://api.telegram.org/bot{self.bot_token}/setMyCommands"
        payload = json.dumps({"commands": commands}).encode("utf-8")
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})

        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status == 200:
                    logger.info("Telegram bot command menu successfully registered via setMyCommands.")
                    return True
        except Exception as e:
            logger.warning(f"Failed to register Telegram bot commands: {e}")
        return False

    def send_html_message(self, html_text: str, chat_id: Optional[str] = None, reply_to_message_id: Optional[int] = None) -> bool:
        """Sends an HTML formatted message to Telegram, supporting specific chats and replies."""
        if not self.enabled:
            return False

        target_chat = chat_id or self.chat_id
        payload_dict = {
            "chat_id": target_chat,
            "text": html_text,
            "parse_mode": "HTML",
            "disable_web_page_preview": True
        }
        if reply_to_message_id:
            payload_dict["reply_to_message_id"] = reply_to_message_id

        payload = json.dumps(payload_dict).encode("utf-8")
        url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})

        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status == 200:
                    logger.info(f"Telegram message sent successfully to {target_chat}.")
                    return True
                else:
                    logger.warning(f"Telegram API responded with status: {resp.status}")
                    return False
        except Exception as e:
            logger.error(f"Failed to send Telegram message: {e}")
            return False

    def broadcast_daily_plans(self, plans: List[Dict[str, Any]], max_idx: int = 4, max_crypto: int = 3):
        """Pushes human-friendly Morning Trade Plans (Telegram V1 Standard)."""
        if not self.enabled or not plans:
            return

        idx_plans = [p for p in plans if p.get("market") == "IDX"][:max_idx]
        crypto_plans = [p for p in plans if p.get("market") == "CRYPTO"][:max_crypto]

        lines = [
            "☀️ <b>SINYAL TRADING HARI INI</b>",
            f"📅 <i>{len(plans)} Peluang Teridentifikasi</i>\n",
            "━━━━━━━━━━━━━━━━━━━━━",
            "📈 <b>SAHAM PILIHAN (IHSG):</b>"
        ]

        for p in idx_plans:
            sym = p.get("clean_ticker", p.get("symbol"))
            entry = p.get("entry_price", 0)
            sl = p.get("stop_loss", 0)
            tp1 = p.get("target_1", 0)
            rr = p.get("risk_reward_ratio", 2.0)
            signal = p.get("technical_signal", "BUY")

            # Calculate safe lot size
            risk = max(1, entry - sl)
            safe_lots = max(1, int(1000000 / (risk * 100)))

            lines.append(
                f"🟢 <b>${sym}</b> — Rekomendasi: <b>{signal}</b>\n"
                f"  ▫️ Buy Area   : Rp {entry:,}\n"
                f"  🔴 Stop Loss (SL) : Rp {sl:,}\n"
                f"  🟢 Take Profit (TP): Rp {tp1:,} (R:R 1:{rr})\n"
                f"  💡 <i>Porsi Aman: Maks. {safe_lots} Lot (modal Rp 100 jt)</i>\n"
            )

        if crypto_plans:
            lines.append("━━━━━━━━━━━━━━━━━━━━━")
            lines.append("🪙 <b>KRIPTO PILIHAN (SPOT USDT):</b>")
            for c in crypto_plans:
                sym = c.get("symbol")
                c_entry = c.get("entry_price")
                c_sl = c.get("stop_loss")
                c_tp1 = c.get("target_1")
                lines.append(
                    f"🟢 <b>{sym}</b> — Rekomendasi: <b>Beli Spot</b>\n"
                    f"  ▫️ Buy Area   : ${c_entry}\n"
                    f"  🔴 Stop Loss  : ${c_sl}\n"
                    f"  🟢 Take Profit: ${c_tp1}\n"
                )

        lines.append("━━━━━━━━━━━━━━━━━━━━━")
        lines.append("⚠️ <i>Wajib pasang Stop Loss otomatis di aplikasi sekuritas Anda!</i>")
        lines.append("📲 <i>Ketik /help di grup untuk panduan perintah bot.</i>")

        msg = "\n".join(lines)
        self.send_html_message(msg)

    def broadcast_macro_flash(self, macro_data: Dict[str, Any]):
        """Pushes High/Critical severity macro updates in clear, layman-friendly format."""
        if not self.enabled or not macro_data:
            return

        severity = macro_data.get("severity", "NORMAL")
        if severity not in ["HIGH", "CRITICAL"]:
            return

        gold_p = macro_data.get("gold_price", 0)
        gold_c = macro_data.get("gold_change_pct", 0)
        oil_p = macro_data.get("brent_oil_price", 0)
        oil_c = macro_data.get("brent_oil_change_pct", 0)
        dxy = macro_data.get("dxy_index", 0)

        lines = [
            f"🚨 <b>KABAR PASAR KILAT [{severity}]</b>\n",
            f"📌 <b>Headline:</b> {macro_data.get('headline', 'Pergerakan Pasar Global')}\n",
            "🌍 <b>Kondisi Pasar Dunia:</b>",
            f"  • Emas Dunia  : ${gold_p:,.2f} ({'+' if gold_c > 0 else ''}{gold_c}%) {'🟢' if gold_c > 0 else '🔴'}",
            f"  • Minyak Brent: ${oil_p:,.2f} ({'+' if oil_c > 0 else ''}{oil_c}%) {'🟢' if oil_c > 0 else '🔴'}",
            f"  • Dollar AS   : {dxy} pts 🟡\n",
            "🏢 <b>Efek ke Saham BEI:</b>"
        ]

        affected_stocks = macro_data.get("idx_affected_stocks", [])
        if affected_stocks:
            for s in affected_stocks:
                impact_emoji = "🟢" if s.get("impact") == "BULLISH" else "🔴" if s.get("impact") == "BEARISH" else "🟡"
                lines.append(f"  {impact_emoji} <b>${s.get('ticker')}</b>: {s.get('reason')}")
        else:
            lines.append("  • Sektor: " + ", ".join(macro_data.get("idx_affected_sectors", ["PASAR GLOBAL"])))

        lines.append("\n💡 <i>Saran: Cermati harga saat pembukaan. Hindari FOMO jika harga sudah naik tinggi!</i>")
        msg = "\n".join(lines)
        self.send_html_message(msg)

    def broadcast_midday_recap(self, ihsg_change: str, top_buy: List[str], top_sell: List[str]):
        """Pushes Midday Sesi 1 market recap."""
        if not self.enabled:
            return

        lines = [
            "☕ <b>MIDDAY MARKET RECAP (SESI 1)</b>",
            f"IHSG Sesi 1: <b>{ihsg_change}</b>\n",
            "━━━━━━━━━━━━━━━━━━━━━",
            "🐳 <b>FOREIGN FLOW TRACKER (ARUS DANA ASING):</b>",
            f"  🟢 Net Foreign Buy  : {', '.join(top_buy) if top_buy else '-'}",
            f"  🔴 Net Foreign Sell : {', '.join(top_sell) if top_sell else '-'}\n",
            "📋 <b>STRATEGI SESI 2 (13:30 WIB):</b>",
            "  • Cermati saham yang konsisten diakumulasi asing.",
            "  • Tetap tunggu konfirmasi volume sebelum masuk."
        ]
        self.send_html_message("\n".join(lines))

    def broadcast_emergency_alert(self, reason: str):
        """Pushes emergency volatility alert."""
        if not self.enabled:
            return

        lines = [
            "⚠️ <b>PERINGATAN RISIKO PASAR</b>",
            f"Status: 🔴 <b>VOLATILITAS TINGGI</b>\n",
            f"📌 <b>Kondisi:</b> {reason}\n",
            "🛡️ <b>ACTION PLAN UNTUK TRADER:</b>",
            "  🔴 Jangan serok bawah (Catching Falling Knife) sebelum ada pantulan.",
            "  🔴 Pasang Trailing Stop untuk mengamankan posisi yang masih profit.",
            "  🟢 Cash is King: Perbesar porsi uang tunai sampai pasar tenang."
        ]
        self.send_html_message("\n".join(lines))
