import os
import json
import logging
import urllib.request
from typing import List, Dict, Any

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

    def send_html_message(self, html_text: str) -> bool:
        """Sends an HTML formatted message to the configured Telegram chat."""
        if not self.enabled:
            return False

        url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
        payload = json.dumps({
            "chat_id": self.chat_id,
            "text": html_text,
            "parse_mode": "HTML",
            "disable_web_page_preview": True
        }).encode("utf-8")

        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json"}
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status == 200:
                    logger.info("Telegram notification sent successfully.")
                    return True
                else:
                    logger.warning(f"Telegram API responded with status: {resp.status}")
                    return False
        except Exception as e:
            logger.error(f"Failed to send Telegram message: {e}")
            return False

    def broadcast_daily_plans(self, plans: List[Dict[str, Any]], max_idx: int = 5, max_crypto: int = 5):
        """Pushes structured Morning Trade Plans (Astra standard) for IDX and Crypto."""
        if not self.enabled or not plans:
            return

        idx_plans = [p for p in plans if p.get("market") == "IDX"][:max_idx]
        crypto_plans = [p for p in plans if p.get("market") == "CRYPTO"][:max_crypto]

        lines = [
            "⚡ <b>MARKET BRAIN GRID // DAILY BRIEFING</b>",
            f"📅 <i>{len(plans)} Trade Plans Synthesized</i>\n",
            "━━━━━━━━━━━━━━━━━━━━━",
            "🎯 <b>TOP IDX EQUITIES (SPOT):</b>"
        ]

        for p in idx_plans:
            sym = p.get("clean_ticker", p.get("symbol"))
            lines.append(
                f"• <b>${sym}</b> [{p.get('technical_signal', 'BUY')}]\n"
                f"  <code>Entry : Rp {p.get('entry_price'):,}</code>\n"
                f"  <code>SL    : Rp {p.get('stop_loss'):,}</code>\n"
                f"  <code>TP1   : Rp {p.get('target_1'):,} | R:R {p.get('risk_reward_ratio')}</code>\n"
                f"  <i>Size: {p.get('position_size_math', '').split('=')[-1].strip()}</i>"
            )

        lines.append("\n━━━━━━━━━━━━━━━━━━━━━")
        lines.append("⚡ <b>TOP CRYPTO SPOT (USDT):</b>")

        for c in crypto_plans:
            sym = c.get("symbol")
            lines.append(
                f"• <b>{sym}</b> [{c.get('technical_signal', 'LONG')}]\n"
                f"  <code>Entry : ${c.get('entry_price')}</code>\n"
                f"  <code>SL    : ${c.get('stop_loss')}</code>\n"
                f"  <code>TP1   : ${c.get('target_1')} | R:R {c.get('risk_reward_ratio')}</code>"
            )

        lines.append("\n━━━━━━━━━━━━━━━━━━━━━")
        lines.append("🔐 <i>Dashboard Web aktif & password-protected.</i>")

        msg = "\n".join(lines)
        self.send_html_message(msg)

    def broadcast_macro_flash(self, macro_data: Dict[str, Any]):
        """Pushes High/Critical severity macro updates affecting IDX/Crypto."""
        if not self.enabled or not macro_data:
            return

        severity = macro_data.get("severity", "NORMAL")
        # Only notify on HIGH or CRITICAL to prevent hourly spam
        if severity not in ["HIGH", "CRITICAL"]:
            return

        gold_p = macro_data.get("gold_price", 0)
        gold_c = macro_data.get("gold_change_pct", 0)
        oil_p = macro_data.get("brent_oil_price", 0)
        oil_c = macro_data.get("brent_oil_change_pct", 0)
        dxy = macro_data.get("dxy_index", 0)

        lines = [
            f"🚨 <b>GLOBAL MACRO FLASH ALERT [{severity}]</b>\n",
            f"<b>Headline:</b> {macro_data.get('headline', 'Macro Shift Detected')}\n",
            "📊 <b>Bellwethers:</b>",
            f"• Gold      : <code>${gold_p:,.2f} ({'+' if gold_c > 0 else ''}{gold_c}%)</code>",
            f"• Brent Oil : <code>${oil_p:,.2f} ({'+' if oil_c > 0 else ''}{oil_c}%)</code>",
            f"• US DXY    : <code>{dxy} pts</code>\n",
            "🏢 <b>Impacted IDX Stocks:</b>"
        ]

        affected_stocks = macro_data.get("idx_affected_stocks", [])
        if affected_stocks:
            for s in affected_stocks:
                impact_emoji = "🟢" if s.get("impact") == "BULLISH" else "🔴" if s.get("impact") == "BEARISH" else "⚪"
                lines.append(f"{impact_emoji} <b>${s.get('ticker')}</b>: {s.get('reason')}")
        else:
            lines.append("• Sektor: " + ", ".join(macro_data.get("idx_affected_sectors", ["GLOBAL_MARKETS"])))

        lines.append("\n⚠️ <i>Validasi sebelum eksekusi order.</i>")
        msg = "\n".join(lines)
        self.send_html_message(msg)
