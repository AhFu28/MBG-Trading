import os
import json
import logging
import urllib.request
import urllib.error
import html
from typing import List, Dict, Any, Optional

logger = logging.getLogger("TelegramNotifier")

class TelegramNotifier:
    def __init__(self):
        if not os.getenv("TELEGRAM_BOT_TOKEN") or not os.getenv("TELEGRAM_CHAT_ID"):
            try:
                from dotenv import load_dotenv
                env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
                if os.path.exists(env_path):
                    load_dotenv(env_path)
            except Exception:
                pass

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
            {"command": "brief", "description": "Intisari pasar harian (Daily Brief) pagi & sore"},
            {"command": "research", "description": "Catatan riset tematik & evaluasi makro sepekan"},
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
        except urllib.error.HTTPError as e:
            try:
                err_resp = json.loads(e.read().decode("utf-8"))
                migrate_id = err_resp.get("parameters", {}).get("migrate_to_chat_id")
                if migrate_id:
                    logger.info(f"Telegram group upgraded to supergroup. Migrating chat_id from {target_chat} to {migrate_id} and retrying...")
                    self.chat_id = str(migrate_id)
                    return self.send_html_message(html_text, chat_id=str(migrate_id), reply_to_message_id=reply_to_message_id)
            except Exception as parse_err:
                logger.debug(f"Error parsing Telegram error response: {parse_err}")
                err_resp = str(e)
            logger.error(f"Failed to send Telegram message: {e} | Details: {err_resp}")
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
            sym = str(p.get("clean_ticker", p.get("symbol")))
            entry = p.get("entry_price", 0)
            sl = p.get("stop_loss", 0)
            tp1 = p.get("target_1", 0)
            rr = p.get("risk_reward_ratio", 2.0)
            signal = str(p.get("technical_signal", "BUY"))

            # Calculate safe lot size
            risk = max(1, entry - sl)
            safe_lots = max(1, int(1000000 / (risk * 100)))

            lines.append(
                f"🟢 <b>${html.escape(sym)}</b> — Rekomendasi: <b>{html.escape(signal)}</b>\n"
                f"  ▫️ Buy Area   : Rp {entry:,}\n"
                f"  🔴 Stop Loss (SL) : Rp {sl:,}\n"
                f"  🟢 Take Profit (TP): Rp {tp1:,} (R:R 1:{rr})\n"
                f"  💡 <i>Porsi Aman: Maks. {safe_lots} Lot (modal Rp 100 jt)</i>\n"
            )

        if crypto_plans:
            lines.append("━━━━━━━━━━━━━━━━━━━━━")
            lines.append("🪙 <b>KRIPTO PILIHAN (SPOT USDT):</b>")
            for c in crypto_plans:
                sym = str(c.get("symbol"))
                c_entry = c.get("entry_price")
                c_sl = c.get("stop_loss")
                c_tp1 = c.get("target_1")
                lines.append(
                    f"🟢 <b>{html.escape(sym)}</b> — Rekomendasi: <b>Beli Spot</b>\n"
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
            f"📌 <b>Headline:</b> {html.escape(str(macro_data.get('headline', 'Pergerakan Pasar Global')))}\n",
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
                tck = html.escape(str(s.get('ticker', '')))
                rsn = html.escape(str(s.get('reason', '')))
                lines.append(f"  {impact_emoji} <b>${tck}</b>: {rsn}")
        else:
            sectors = macro_data.get("idx_affected_sectors", ["PASAR GLOBAL"])
            lines.append("  • Sektor: " + html.escape(", ".join(sectors)))

        lines.append("\n💡 <i>Saran: Cermati harga saat pembukaan. Hindari FOMO jika harga sudah naik tinggi!</i>")
        msg = "\n".join(lines)
        self.send_html_message(msg)

    def broadcast_midday_recap(self, ihsg_change: str, top_buy: List[str], top_sell: List[str]):
        """Pushes Midday Sesi 1 market recap."""
        if not self.enabled:
            return

        lines = [
            "☕ <b>MIDDAY MARKET RECAP (SESI 1)</b>",
            f"IHSG Sesi 1: <b>{html.escape(str(ihsg_change))}</b>\n",
            "━━━━━━━━━━━━━━━━━━━━━",
            "🐳 <b>FOREIGN FLOW TRACKER (ARUS DANA ASING):</b>",
            f"  🟢 Net Foreign Buy  : {html.escape(', '.join(top_buy)) if top_buy else '-'}",
            f"  🔴 Net Foreign Sell : {html.escape(', '.join(top_sell)) if top_sell else '-'}\n",
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
            f"📌 <b>Kondisi:</b> {html.escape(str(reason))}\n",
            "🛡️ <b>ACTION PLAN UNTUK TRADER:</b>",
            "  🔴 Jangan serok bawah (Catching Falling Knife) sebelum ada pantulan.",
            "  🔴 Pasang Trailing Stop untuk mengamankan posisi yang masih profit.",
            "  🟢 Cash is King: Perbesar porsi uang tunai sampai pasar tenang."
        ]
        self.send_html_message("\n".join(lines))

    def broadcast_daily_brief(self, brief_item: Dict[str, Any]) -> bool:
        """Pushes structured institutional Daily Brief to Telegram."""
        if not self.enabled or not brief_item:
            return False

        title = brief_item.get("title", "MBG Daily Market Brief")
        summary = brief_item.get("summary", "")
        takeaways = brief_item.get("key_takeaways", [])
        metrics = brief_item.get("metrics", [])
        tickers = brief_item.get("related_tickers", [])
        sentiment = brief_item.get("sentiment", "NEUTRAL")
        sentiment_emoji = "🟢" if sentiment == "BULLISH" else ("🔴" if sentiment == "BEARISH" else "🟡")

        lines = [
            f"☕ <b>MBG DAILY BRIEF // MARKET PULSE</b>",
            f"Sentimen: {sentiment_emoji} <b>{sentiment}</b>\n",
            f"📌 <b>{html.escape(title)}</b>\n",
            "📊 <b>INDIKATOR MAKRO UTAMA:</b>",
            f"  • {html.escape(' | '.join(metrics)) if metrics else '-'}\n",
            "🎯 <b>POIN KUNCI & STRATEGI:</b>"
        ]

        for idx, t in enumerate(takeaways, 1):
            lines.append(f"  {idx}. {html.escape(t)}")

        if tickers:
            ticker_str = ", ".join([f"${html.escape(t)}" for t in tickers])
            lines.append(f"\n🔍 <b>Emiten Radar:</b> {ticker_str}")

        lines.append("\n━━━━━━━━━━━━━━━━━━━━━")
        lines.append("⚡ <i>Ketik /brief di grup untuk melihat brief terkini kapan saja.</i>")
        lines.append("💻 <i>Akses Terminal Lengkap: MBG Cockpit Web App</i>")

        return self.send_html_message("\n".join(lines))

    def broadcast_research_note(self, research_item: Dict[str, Any]) -> bool:
        """Pushes thematic institutional Research Note to Telegram."""
        if not self.enabled or not research_item:
            return False

        title = research_item.get("title", "MBG Institutional Research Note")
        summary = research_item.get("summary", "")
        takeaways = research_item.get("key_takeaways", [])
        tickers = research_item.get("related_tickers", [])

        lines = [
            "🔬 <b>MBG RESEARCH DESK // DEEP DIVE</b>\n",
            f"📑 <b>{html.escape(title)}</b>\n",
            f"💡 <i>{html.escape(summary)}</i>\n",
            "━━━━━━━━━━━━━━━━━━━━━",
            "📋 <b>TEMUAN & ANALISIS RISET:</b>"
        ]

        for idx, t in enumerate(takeaways, 1):
            lines.append(f"\n<b>[{idx}]</b> {html.escape(t)}")

        if tickers:
            ticker_str = ", ".join([f"${html.escape(t)}" for t in tickers])
            lines.append(f"\n🏛️ <b>Klaster Emiten Fokus:</b> {ticker_str}")

        lines.append("\n━━━━━━━━━━━━━━━━━━━━━")
        lines.append("⚡ <i>Ketik /research untuk catatan riset tematik lainnya.</i>")

        return self.send_html_message("\n".join(lines))

    def broadcast_vip_trade_signal(self, plan: Dict[str, Any], agent_name: str = "MBG CHAMPION BOT") -> bool:
        """Pushes actionable high-probability VIP Trade Signal to Telegram."""
        if not self.enabled or not plan:
            return False

        sym = plan.get("clean_ticker") or plan.get("ticker") or plan.get("symbol", "ASSET")
        market = plan.get("market", "MARKET")
        action = (plan.get("direction") or plan.get("action") or "BUY").upper()
        action_emoji = "🟢" if action in ["BUY", "LONG"] else "🔴"
        
        entry = plan.get("entry_price", 0)
        sl = plan.get("stop_loss", 0)
        tp1 = plan.get("target_1") or plan.get("take_profit_1", 0)
        tp2 = plan.get("target_2") or plan.get("take_profit_2", 0)
        rr = plan.get("risk_reward_ratio") or plan.get("rr", "1:2.5")
        
        bandar_badge = plan.get("bandar_badge", "")
        strat = plan.get("strategy") or plan.get("strategy_type", "Multi-Regime Quant")
        thesis = plan.get("thesis") or plan.get("reason", "Konfirmasi breakout momentum & likuiditas institusi.")

        lines = [
            f"👑 <b>MBG VIP SIGNAL // {market.upper()}</b>",
            f"Bot: <b>{html.escape(agent_name)}</b>\n",
            f"🎯 <b>INSTRUMEN:</b> <code>${html.escape(sym)}</code>",
            f"⚡ <b>AKSI:</b> {action_emoji} <b>{action}</b>\n",
            "━━━━━━━━━━━━━━━━━━━━━",
            f"📍 <b>ENTRY ZONE :</b> <code>{entry:,.2f}</code>" if isinstance(entry, float) else f"📍 <b>ENTRY ZONE :</b> <code>{entry}</code>",
            f"🛡️ <b>STOP LOSS  :</b> <code>{sl:,.2f}</code>" if isinstance(sl, float) else f"🛡️ <b>STOP LOSS  :</b> <code>{sl}</code>",
            f"🎯 <b>TARGET 1   :</b> <code>{tp1:,.2f}</code>" if isinstance(tp1, float) else f"🎯 <b>TARGET 1   :</b> <code>{tp1}</code>",
            f"🚀 <b>TARGET 2   :</b> <code>{tp2:,.2f}</code>" if isinstance(tp2, float) else f"🚀 <b>TARGET 2   :</b> <code>{tp2}</code>",
            f"⚖️ <b>RISK/REWARD:</b> <b>{rr}</b>",
            "━━━━━━━━━━━━━━━━━━━━━",
            f"💡 <b>LOGIKA & ALASAN:</b>",
            f"  • {html.escape(thesis)}",
            f"  • Strategi: <i>{html.escape(strat)}</i>"
        ]
        if bandar_badge:
            lines.append(f"  • Status Aliran Dana: <b>{html.escape(bandar_badge)}</b>")

        lines.append("\n⚠️ <i>Disiplin Money Management: Risiko maksimal 1-2% per tiket.</i>")
        lines.append("⚡ <i>Ketik /plan untuk daftar sinyal aktif hari ini.</i>")

        return self.send_html_message("\n".join(lines))

