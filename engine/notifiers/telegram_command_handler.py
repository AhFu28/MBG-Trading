import os
import re
import json
import time
import logging
from typing import Tuple, Dict, Any, Optional

logger = logging.getLogger("TelegramCommandHandler")

POPULAR_ALIASES = {
    # Saham Perbankan & Bluechip BEI
    "BCA": "BBCA",
    "BRI": "BBRI",
    "MANDIRI": "BMRI",
    "BNI": "BBNI",
    "TELKOM": "TLKM",
    "ASTRA": "ASII",
    "ANTAM": "ANTM",
    "INCO": "VALE",
    "UNILEVER": "UNVR",
    "INDOFOOD": "INDF",
    "ADARO": "ADRO",
    "MEDCO": "MEDC",
    "BUKAPALAK": "BUKA",
    "GOTO": "GOTO",
    
    # Kripto Populer
    "BITCOIN": "BTC",
    "ETHEREUM": "ETH",
    "SOLANA": "SOL",
    "RIPPLE": "XRP",
    "CARDANO": "ADA",
    "DOGE": "DOGE",
    "DOGECOIN": "DOGE",
    "SHIBA": "SHIB",
    "BINANCE": "BNB"
}

KNOWN_CRYPTO = {"BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "LINK", "SUI", "PEPE", "SHIB"}

class TelegramCommandHandler:
    def __init__(self, cache_dir: Optional[str] = None):
        if not cache_dir:
            base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            self.cache_dir = os.path.join(base, "cache")
        else:
            self.cache_dir = cache_dir

        self.cooldown_tracker: Dict[int, float] = {}
        self.cooldown_sec = 2.0  # 2 detik jeda per user

    def is_rate_limited(self, user_id: int) -> bool:
        """Rate limiter to prevent group spam."""
        now = time.time()
        last = self.cooldown_tracker.get(user_id, 0)
        if now - last < self.cooldown_sec:
            return True
        self.cooldown_tracker[user_id] = now
        return False

    def load_cache_bundle(self) -> Dict[str, Any]:
        """Loads latest cockpit bundle from local cache."""
        bundle_path = os.path.join(self.cache_dir, "latest_cockpit_bundle.json")
        if os.path.exists(bundle_path):
            try:
                with open(bundle_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Failed to read latest_cockpit_bundle.json: {e}")
        return {}

    def parse_command(self, raw_text: str) -> Tuple[str, str]:
        """
        Parses user input into (Command_Type, Argument).
        Tolerates command syntax (/saham, /crypto, /news, /plan, /help)
        and conversational slang (cek bbca, harga btc, berita, sinyal).
        """
        clean = raw_text.strip()
        if not clean:
            return "UNKNOWN", ""

        # Remove bot mention (e.g. /saham@mbg_quant_bot BBCA)
        clean = re.sub(r"@\w+", "", clean).strip()

        # Command /news atau 'berita'/'makro'
        if re.match(r"^/?(news|berita|makro|kabar)$", clean, re.IGNORECASE):
            return "NEWS", ""

        # Command /plan atau 'sinyal'/'rekomendasi'
        if re.match(r"^/?(plan|sinyal|rekomendasi)$", clean, re.IGNORECASE):
            return "PLAN", ""

        # Command /help atau /start atau 'menu'
        if re.match(r"^/?(help|start|menu|bantuan)$", clean, re.IGNORECASE):
            return "HELP", ""

        # Command /saham [ticker]
        m_saham = re.match(r"^/?(?:saham|stock|saham_bei)\s*([A-Za-z]{3,10})?$", clean, re.IGNORECASE)
        if m_saham:
            ticker = m_saham.group(1)
            if not ticker:
                return "SAHAM_EMPTY", ""
            ticker = ticker.upper()
            return "SAHAM", POPULAR_ALIASES.get(ticker, ticker)

        # Command /crypto [coin]
        m_crypto = re.match(r"^/?(?:crypto|kripto|coin)\s*([A-Za-z]{3,10})?$", clean, re.IGNORECASE)
        if m_crypto:
            coin = m_crypto.group(1)
            if not coin:
                return "CRYPTO_EMPTY", ""
            coin = coin.upper()
            return "CRYPTO", POPULAR_ALIASES.get(coin, coin)

        # Conversational syntax: cek <simbol>, harga <simbol>, info <simbol>
        m_cek = re.match(r"^/?(?:cek|harga|info)\s+([A-Za-z]{3,10})$", clean, re.IGNORECASE)
        if m_cek:
            sym = m_cek.group(1).upper()
            sym = POPULAR_ALIASES.get(sym, sym)
            if sym in KNOWN_CRYPTO:
                return "CRYPTO", sym
            return "SAHAM", sym

        return "UNKNOWN", clean

    def handle_help(self) -> str:
        return (
            "🤖 <b>PANDUAN PERINTAH BOT MBG TRADING</b>\n\n"
            "Anda bisa mengetik perintah berikut di grup kapan saja:\n"
            "• <code>/saham &lt;KODE&gt;</code> ➔ Cek analisa & level harga saham BEI\n"
            "  <i>Contoh: <code>/saham BBCA</code> atau <code>/saham ANTM</code></i>\n\n"
            "• <code>/crypto &lt;KOIN&gt;</code> ➔ Cek harga spot & level kripto\n"
            "  <i>Contoh: <code>/crypto BTC</code> atau <code>/crypto SOL</code></i>\n\n"
            "• <code>/news</code> ➔ Berita ekonomi dunia & harga komoditas terkini\n"
            "• <code>/plan</code> ➔ Daftar saham & kripto pilihan hari ini\n\n"
            "💡 <i>Tips Awam: Anda juga bisa ketik santai tanpa garis miring, contoh: <code>cek BBCA</code> atau <code>cek BTC</code>.</i>"
        )

    def handle_news(self, bundle: Dict[str, Any]) -> str:
        macro = bundle.get("macro_telemetry", {})
        gold_p = macro.get("gold_price", 2750.0)
        gold_c = macro.get("gold_change_pct", 0.0)
        oil_p = macro.get("brent_oil_price", 74.0)
        oil_c = macro.get("brent_oil_change_pct", 0.0)
        dxy = macro.get("dxy_index", 104.5)

        live_news = macro.get("live_news", [])
        news_items = []
        for i, n in enumerate(live_news[:3], start=1):
            news_items.append(f"{i}. <b>{n.get('title')}</b> (<i>{n.get('source')}</i>)")

        news_text = "\n".join(news_items) if news_items else "1. Pasar finansial stabil menjelang pengumuman suku bunga."

        return (
            "📰 <b>KABAR PASAR & MAKRO TERKINI</b>\n\n"
            "🌍 <b>Indikator Komoditas Dunia:</b>\n"
            f"  • Emas Dunia  : ${gold_p:,.2f} ({'+' if gold_c > 0 else ''}{gold_c}%) {'🟢' if gold_c > 0 else '🔴'}\n"
            f"  • Minyak Brent: ${oil_p:,.2f} ({'+' if oil_c > 0 else ''}{oil_c}%) {'🟢' if oil_c > 0 else '🔴'}\n"
            f"  • DXY Dollar  : {dxy} pts 🟡\n\n"
            f"🔥 <b>Berita Terhangat:</b>\n{news_text}\n\n"
            "💡 <i>Gunakan informasi di atas untuk memantau rotasi sektor hari ini.</i>"
        )

    def handle_plan(self, bundle: Dict[str, Any]) -> str:
        plans = bundle.get("daily_trade_plans", [])
        if not plans:
            return "🎯 <b>SAHAM PILIHAN HARI INI</b>\n\n<i>Belum ada trade plan yang terbit. Silakan tunggu update pagi pukul 08:00 WIB.</i>"

        lines = ["🎯 <b>SAHAM & KRIPTO PILIHAN HARI INI</b>\n"]
        idx_plans = [p for p in plans if p.get("market") == "IDX"][:3]
        crypto_plans = [p for p in plans if p.get("market") == "CRYPTO"][:2]

        for p in idx_plans:
            sym = p.get("clean_ticker", p.get("symbol"))
            lines.append(
                f"🟢 <b>${sym}</b> [Buy Area: Rp {p.get('entry_price'):,}]\n"
                f"   🔴 SL: Rp {p.get('stop_loss'):,} | 🟢 TP: Rp {p.get('target_1'):,} (R:R 1:{p.get('risk_reward_ratio')})"
            )

        for c in crypto_plans:
            sym = c.get("symbol")
            lines.append(
                f"🪙 <b>{sym}</b> [Buy: ${c.get('entry_price')}]\n"
                f"   🔴 SL: ${c.get('stop_loss')} | 🟢 TP: ${c.get('target_1')}"
            )

        lines.append("\n⚠️ <i>Pasang batas rugi (Stop Loss) otomatis di sekuritas Anda!</i>")
        return "\n".join(lines)

    def handle_saham(self, ticker: str, bundle: Dict[str, Any]) -> str:
        ticker = ticker.upper()

        # 1. Cek di trade plans terlebih dahulu (Cache-First)
        for p in bundle.get("daily_trade_plans", []):
            if p.get("clean_ticker") == ticker:
                return (
                    f"📈 <b>ANALISA SAHAM: ${ticker}</b>\n"
                    f"Status: 🟢 <b>AKUMULASI (SINYAL RESMI HARI INI)</b>\n\n"
                    f"💵 Harga Acuan     : Rp {p.get('entry_price'):,}\n"
                    f"📊 Sinyal Teknikal : <b>{p.get('technical_signal', 'BUY')}</b>\n\n"
                    f"🎯 <b>PANDUAN TRADING:</b>\n"
                    f"  🟢 Buy Area       : Rp {p.get('entry_price'):,}\n"
                    f"  🔴 Stop Loss (SL) : Rp {p.get('stop_loss'):,} (Wajib Cut Loss jika jebol!)\n"
                    f"  🟢 Target Untung  : Rp {p.get('target_1'):,} (R:R 1:{p.get('risk_reward_ratio')})\n\n"
                    f"💡 <i>Catatan: {p.get('opinion_thesis', 'Didukung akumulasi terukur.')}</i>"
                )

        # 2. Cek di konglomerat / dividend data jika ada
        all_records = bundle.get("conglomerates", {}).get("records", []) if isinstance(bundle.get("conglomerates"), dict) else []
        for r in all_records:
            if r.get("ticker") == ticker:
                p = r.get("price", 1000)
                sl = round(p * 0.96)
                tp = round(p * 1.08)
                return (
                    f"📈 <b>ANALISA SAHAM: ${ticker}</b>\n"
                    f"Status: 🟢 <b>WATCHLIST KONGLOMERASI ({r.get('group', 'BEI')})</b>\n\n"
                    f"💵 Harga Terakhir : Rp {p:,}\n"
                    f"📊 Sinyal         : <b>{r.get('technical_signal', 'NETRAL')}</b> (RSI: {r.get('rsi_14', 50)})\n"
                    f"🏢 MA20           : Rp {r.get('ma20', p):,}\n\n"
                    f"🎯 <b>LEVEL HARGA ESTIMASI:</b>\n"
                    f"  🟢 Area Beli       : Rp {p:,}\n"
                    f"  🔴 Stop Loss (SL)  : Rp {sl:,} (-4.0%)\n"
                    f"  🟢 Target (TP)     : Rp {tp:,} (+8.0%)\n\n"
                    f"💡 <i>Saran: Perhatikan volume saat penutupan sesi 1.</i>"
                )

        # 3. Fallback on-demand via yfinance
        try:
            import yfinance as yf
            t = yf.Ticker(f"{ticker}.JK")
            hist = t.history(period="1mo")
            if not hist.empty:
                last_p = int(hist["Close"].iloc[-1])
                ma20 = int(hist["Close"].tail(20).mean())
                sl = round(last_p * 0.96)
                tp = round(last_p * 1.08)
                status = "🟢 UPTREND" if last_p >= ma20 else "🟡 KONSOLIDASI"

                return (
                    f"📈 <b>ANALISA SAHAM: ${ticker} (LIVE QUERY)</b>\n"
                    f"Status: {status}\n\n"
                    f"💵 Harga Sekarang  : Rp {last_p:,}\n"
                    f"📊 Garis Rata (MA20): Rp {ma20:,}\n\n"
                    f"🎯 <b>LEVEL ACUAN RISIKO:</b>\n"
                    f"  🟢 Support / Buy Area : Rp {min(last_p, ma20):,}\n"
                    f"  🔴 Stop Loss (SL)     : Rp {sl:,} (-4.0%)\n"
                    f"  🟢 Target Profit (TP) : Rp {tp:,} (+8.0%)\n\n"
                    f"💡 <i>Saran: Jangan kejar jika harga dibuka melompat jauh di atas batas atas.</i>"
                )
        except Exception as e:
            logger.warning(f"Live yfinance query failed for {ticker}: {e}")

        return (
            f"📈 <b>SAHAM ${ticker}</b>\n\n"
            f"Data untuk ticker <b>{ticker}</b> belum tersedia di radar harian.\n"
            f"Pastikan kode saham terdaftar di Bursa Efek Indonesia (BEI)."
        )

    def handle_crypto(self, coin: str, bundle: Dict[str, Any]) -> str:
        coin = coin.upper()
        pair_key = f"{coin}/USDT"

        # 1. Cek di cache crypto_spot_10
        crypto_list = bundle.get("crypto_spot_10", [])
        for c in crypto_list:
            if c.get("pair") == pair_key or c.get("pair") == coin:
                p = c.get("current_price")
                sl = c.get("stop_loss")
                tp1 = c.get("take_profit_1")
                return (
                    f"🪙 <b>ANALISA KRIPTO: {pair_key}</b>\n"
                    f"Status: 🟢 <b>TREN POSITIF (SPOT WATCHLIST)</b>\n\n"
                    f"💵 Harga Spot     : ${p}\n"
                    f"📊 Signal Teknikal: <b>{c.get('technical_signal', 'LONG')}</b>\n\n"
                    f"🎯 <b>LEVEL KRUSIAL:</b>\n"
                    f"  🟢 Support / Buy Area : ${p}\n"
                    f"  🔴 Stop Loss (SL)     : ${sl}\n"
                    f"  🟢 Target Profit (TP) : ${tp1} (R:R 1:{c.get('risk_reward_ratio', 2.0)})\n\n"
                    f"💡 <i>Saran Awam: Kripto aktif 24 jam. Pasang limit order demi keamanan dana.</i>"
                )

        # 2. Fallback on-demand via yfinance
        try:
            import yfinance as yf
            t = yf.Ticker(f"{coin}-USD")
            hist = t.history(period="1mo")
            if not hist.empty:
                last_p = round(float(hist["Close"].iloc[-1]), 4)
                sl = round(last_p * 0.95, 4)
                tp = round(last_p * 1.10, 4)
                return (
                    f"🪙 <b>ANALISA KRIPTO: {coin}/USDT (LIVE QUERY)</b>\n\n"
                    f"💵 Harga Spot Sekarang : ${last_p:,.4f}\n"
                    f"🟢 Batas Support       : ${sl:,.4f}\n"
                    f"🔴 Stop Loss (SL)      : ${sl:,.4f} (-5.0%)\n"
                    f"🟢 Target Kenaikan (TP): ${tp:,.4f} (+10.0%)\n\n"
                    f"💡 <i>Saran: Selalu gunakan ukuran posisi yang wajar.</i>"
                )
        except Exception as e:
            logger.warning(f"Live crypto query failed for {coin}: {e}")

        return (
            f"🪙 <b>KRIPTO {coin}</b>\n\n"
            f"Data koin <b>{coin}</b> tidak ditemukan. Pastikan simbol koin benar (Contoh: BTC, ETH, SOL)."
        )

    def process_message(self, text: str, user_id: int) -> Optional[str]:
        """Main dispatcher for incoming messages from users in Telegram group."""
        if not text:
            return None

        # Anti-flood check
        if self.is_rate_limited(user_id):
            return None

        cmd_type, arg = self.parse_command(text)
        if cmd_type == "UNKNOWN":
            return None  # Biarkan chat biasa di grup tanpa spamming balasan "Unknown"

        bundle = self.load_cache_bundle()

        if cmd_type == "HELP":
            return self.handle_help()
        elif cmd_type == "NEWS":
            return self.handle_news(bundle)
        elif cmd_type == "PLAN":
            return self.handle_plan(bundle)
        elif cmd_type == "SAHAM_EMPTY":
            return (
                "⚠️ <b>KODE SAHAM BELUM DIISI</b>\n\n"
                "Format yang benar: <code>/saham &lt;KODE&gt;</code>\n"
                "Contoh: <code>/saham BBCA</code> atau <code>/saham ANTM</code>\n\n"
                "Silakan dicoba lagi ya!"
            )
        elif cmd_type == "CRYPTO_EMPTY":
            return (
                "⚠️ <b>KODE KRIPTO BELUM DIISI</b>\n\n"
                "Format yang benar: <code>/crypto &lt;KOIN&gt;</code>\n"
                "Contoh: <code>/crypto BTC</code> atau <code>/crypto SOL</code>\n\n"
                "Silakan dicoba lagi ya!"
            )
        elif cmd_type == "SAHAM":
            return self.handle_saham(arg, bundle)
        elif cmd_type == "CRYPTO":
            return self.handle_crypto(arg, bundle)

        return None
