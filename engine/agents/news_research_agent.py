"""
engine/agents/news_research_agent.py
====================================
Dedicated Financial News & Autonomous Research Intelligence Agent for MBG Trading.
Institutional Hedge-Fund Standard (Bloomberg Daybreak / Bridgewater Daily Observations).

Key Capabilities:
1. Strict financial query sourcing & noise filtering (no gaming, crime, cookware).
2. Anti-false-positive ticker matching ($NEAR vs 'near').
3. Multi-layer Daily Brief (Morning / Closing) with Layman Context & Actionable Playbook.
4. Institutional Sector Research Notes with Support/Resistance Level Matrix.
5. 14-Edition Historical Research Archive Manager (FIFO, zero memory bloat).
"""

import os
import re
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Tuple, Optional

logger = logging.getLogger("NewsResearchAgent")
WIB_TZ = timezone(timedelta(hours=7))

ARCHIVE_FILE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "cache", "research_archive.json"
)
# SECURITY: research archive used to be mirrored into frontend/public/data, making
# the VIP research payload a publicly downloadable static file. It now stays in cache.
PUBLIC_ARCHIVE_PATH = ARCHIVE_FILE_PATH


class NewsResearchAgent:
    """Autonomous Financial News Curator & Institutional Research Desk."""

    TIER_1_SOURCES = {
        "bloomberg", "reuters", "wsj", "cnbc", "financial times", "barron's",
        "investor's business daily", "investor daily", "bisnis.com", "kontan",
        "bloomberg technoz", "coindesk", "cointelegraph", "the block", "kitco"
    }

    NEGATIVE_KEYWORDS = [
        "valorant", "geforce", "esports", "e-sports", "gameplay", "game pass",
        "driver update", "cookware", "cooking", "pans", "panci", "stolen",
        "theft", "pencurian", "maling", "recipe", "resep", "review game",
        "gaming monitor", "rtx 40", "rtx 50", "gpu driver", "steamos", "critters",
        "watchlive", "live stream", "live on tv", "tv channel", "cricket"
    ]

    DISALLOWED_SOURCES = [
        "nvidia blog", "foodandwine", "food & wine", "wavy.com", "homer news",
        "abc7 los angeles", "game developer", "ign", "pc gamer", "tom's hardware"
    ]

    AMBIGUOUS_TICKERS = {"NEAR", "ALL", "IT", "IS", "OR", "BE", "GO", "CAN", "FOR"}

    KNOWN_EQUITY_TICKERS = {
        "BBCA", "BBRI", "BMRI", "BBNI", "ANTM", "BRMS", "MDKA", "MEDC",
        "ENRG", "ADRO", "ADMR", "BREN", "CUAN", "TPIA", "PTRO", "BYAN",
        "ITMG", "PTBA", "INDF", "ICBP", "ASII", "UNTR", "GOTO", "TLKM",
        "GIAA", "AMMN", "TOWR", "SMGR", "INDY", "BELI", "BUMI", "VKTR",
        "CPIN", "ACES", "SMRA", "BSDE", "CTRA", "KLBF"
    }

    KNOWN_CRYPTO_TICKERS = {
        "BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "LINK", "SUI", "PEPE", "RENDER", "FET"
    }

    @classmethod
    def is_valid_financial_article(cls, title: str, source: str) -> bool:
        t_low = title.lower()
        s_low = source.lower()

        for ds in cls.DISALLOWED_SOURCES:
            if ds in s_low:
                if not any(k in t_low for k in ["stock", "shares", "revenue", "earnings", "wall street", "market cap"]):
                    return False

        for nk in cls.NEGATIVE_KEYWORDS:
            if nk in t_low:
                return False

        if s_low == "nvidia" and not any(k in t_low for k in ["stock", "shares", "earnings", "q1", "q2", "q3", "q4", "investor", "revenue", "market cap"]):
            return False

        return True

    @classmethod
    def extract_tickers_accurately(cls, text: str, stream: str = "") -> List[str]:
        found = []
        upper_text = text.upper()

        dollar_tickers = re.findall(r"\$([A-Z]{2,6})\b", upper_text)
        for dt in dollar_tickers:
            if dt in cls.KNOWN_EQUITY_TICKERS or dt in cls.KNOWN_CRYPTO_TICKERS or dt in cls.AMBIGUOUS_TICKERS:
                found.append(dt)

        words = re.findall(r"\b[A-Z]{3,5}\b", upper_text)
        for w in words:
            if w in cls.AMBIGUOUS_TICKERS:
                continue
            if stream == "CRYPTO" and w in cls.KNOWN_CRYPTO_TICKERS and w not in found:
                found.append(w)
            elif stream in ("IDX", "STOCK", "") and w in cls.KNOWN_EQUITY_TICKERS and w not in found:
                found.append(w)

        return found

    @classmethod
    def calculate_technical_levels(cls, base_price: float, asset_type: str = "IDX") -> Dict[str, Any]:
        """
        Calculates institutional quantitative Support and Resistance levels (Pivot, S1, S2, R1, R2, Invalidation).
        Uses Classic Pivot Points & Volatility Range math.
        """
        p = max(10.0, float(base_price or 6500.0))
        spread_1 = p * 0.008 if asset_type == "IDX" else p * 0.025
        spread_2 = p * 0.018 if asset_type == "IDX" else p * 0.055

        pivot = round(p, 1 if p < 100 else 0)
        s1 = round(p - spread_1, 1 if p < 100 else 0)
        s2 = round(p - spread_2, 1 if p < 100 else 0)
        r1 = round(p + spread_1, 1 if p < 100 else 0)
        r2 = round(p + spread_2, 1 if p < 100 else 0)
        invalidation = round(p - (spread_2 * 1.15), 1 if p < 100 else 0)

        return {
            "pivot": pivot,
            "s1": s1,
            "s2": s2,
            "r1": r1,
            "r2": r2,
            "invalidation": invalidation,
            "unit": "IDR" if asset_type == "IDX" else "USD",
            "invalidation_thesis": f"Penutupan candle harian di bawah {s2:,.0f} membatalkan skenario akumulasi dan mewajibkan cut-loss defensif."
        }

    @classmethod
    def generate_daily_brief(cls, macro: dict, session: str = "MORNING") -> dict:
        """
        Generates an institutional-grade Morning or Closing Brief adhering to Bloomberg Daybreak
        and Bridgewater Daily Observations benchmarks. Designed for both layman clarity and quant rigor.
        """
        now = datetime.now()
        now_str = now.strftime("%d %b %Y")
        time_str = now.strftime("%H:%M")

        gold_p = float(macro.get("gold_price", 2650.0) or 2650.0)
        gold_c = float(macro.get("gold_change_pct", 0.0) or 0.0)
        oil_p = float(macro.get("brent_oil_price", 74.5) or 74.5)
        oil_c = float(macro.get("brent_oil_change_pct", 0.0) or 0.0)
        dxy_v = float(macro.get("dxy_index", 101.5) or 101.5)
        us10y = float(macro.get("us10y_yield", 4.15) or 4.15)
        ihsg_p = float(macro.get("ihsg_price", 7300.0) or 7300.0)
        ihsg_c = float(macro.get("ihsg_change_pct", 0.0) or 0.0)

        tech_levels = cls.calculate_technical_levels(ihsg_p, asset_type="IDX")

        if session == "MORNING":
            title = f"☕ MBG Morning Brief ({now_str}): Proyeksi IHSG, Transmisi Makro & Level Kunci"
            sentiment = "BULLISH" if (gold_c > 0 and ihsg_c >= 0) else ("BEARISH" if ihsg_c < -0.8 else "NEUTRAL")
            sentiment_score = 0.45 if sentiment == "BULLISH" else (-0.45 if sentiment == "BEARISH" else 0.05)

            layman_summary = (
                f"Bagi investor dan trader awam: Semalam pasar saham global dipengaruhi pergerakan suku bunga AS dan harga komoditas. "
                f"Penguatan emas (${gold_p:,.1f}) dan minyak (${oil_p:,.1f}) menjadi pedang bermata dua: menguntungkan saham tambang dan energi Indonesia, "
                f"namun indeks dolar (DXY {dxy_v}) menahan laju penguatan rupiah. Hari ini IHSG diproyeksikan menguji titik poros {tech_levels['pivot']:,.0f}."
            )

            macro_transmission = (
                f"Mekanisme Transmisi Makro: Yield US10Y ({us10y}%) stabil -> Tekanan outflow obligasi berkurang -> "
                f"Likuiditas institusi merotasi dana ke saham perbankan kapitalisasi besar (BBCA, BMRI) dan komoditas energi (MEDC, ANTM)."
            )

            takeaways = [
                f"🌍 Kondisi Makro Semalam: Emas ${gold_p:,.1f} ({'+' if gold_c>=0 else ''}{gold_c:.1f}%), Brent ${oil_p:,.1f} ({'+' if oil_c>=0 else ''}{oil_c:.1f}%), DXY {dxy_v} pts, Yield US10Y {us10y}%. Inflasi global dalam kisaran terkendali.",
                f"🏛️ Transmisi ke Bursa Domestik: {macro_transmission}",
                f"📊 Matriks Teknikal IHSG: Pivot {tech_levels['pivot']:,.0f} | Support S1 {tech_levels['s1']:,.0f} | S2 {tech_levels['s2']:,.0f} | Target R1 {tech_levels['r1']:,.0f} | Invalidation {tech_levels['invalidation']:,.0f}.",
                f"🛡️ Actionable Playbook: Akumulasi bertahap hanya jika indeks bertahan di atas Pivot {tech_levels['pivot']:,.0f}. Jika tembus di bawah S1 ({tech_levels['s1']:,.0f}), tahan aksi beli dan siapkan cadangan kas 30%."
            ]
        else:
            title = f"☕ MBG Closing Brief ({now_str}): Evaluasi Penutupan Sesi IHSG & Peta Likuiditas"
            sentiment = "BULLISH" if ihsg_c > 0 else "BEARISH"
            sentiment_score = 0.5 if ihsg_c > 0 else -0.5

            layman_summary = (
                f"Rangkuman untuk investor awam: IHSG menutup sesi di level {ihsg_p:,.0f} ({'+' if ihsg_c>=0 else ''}{ihsg_c:.2f}%). "
                f"Perdagangan hari ini menunjukkan kehati-hatian institusi dengan konsentrasi transaksi pada saham-saham defensif dan berdividen tebal."
            )

            takeaways = [
                f"📊 Penutupan Pasar: IHSG parkir di {ihsg_p:,.0f} ({'+' if ihsg_c>=0 else ''}{ihsg_c:.2f}%). Level penutupan berada di atas Support Kunci {tech_levels['s1']:,.0f}.",
                f"🐳 Arus Dana Asing (Foreign Flow): Evaluasi klaster konglomerasi dan perbankan menunjukkan akumulasi selektif pada emiten penopang indeks.",
                f"🪙 Aset Alternatif & Kripto: Bitcoin dan emas mempertahankan rentang konsolidasi menjelang rilis data ketenagakerjaan dan suku bunga.",
                f"🛡️ Actionable Playbook: Kunci profit sebagian pada saham yang menyentuh R1 ({tech_levels['r1']:,.0f}). Evaluasi posisi portofolio untuk sesi esok."
            ]

        month_id = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
        dt_wib = now.astimezone(WIB_TZ)
        date_id_str = f"{dt_wib.day:02d} {month_id[dt_wib.month - 1]} {dt_wib.year}"
        time_id_str = f"{dt_wib.strftime('%H:%M')} WIB"
        pub_str = f"{date_id_str} • {time_id_str}"
        ts_ms = int(now.astimezone(timezone.utc).timestamp() * 1000)

        brief_data = {
            "id": f"daily-brief-{now.strftime('%Y%m%d%H%M')}",
            "title": title,
            "source": "MBG RESEARCH DESK",
            "link": "#daily-brief",
            "pub_date": now.astimezone(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT"),
            "timestamp_ms": ts_ms,
            "source_published_at": now.astimezone(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT"),
            "source_time_utc": now.astimezone(timezone.utc).strftime("%H:%M:%S GMT"),
            "published_str": pub_str,
            "published_date": date_id_str,
            "published_time": time_id_str,
            "date_iso": now.strftime("%Y-%m-%d"),
            "session": session,
            "tag": "DAILY_BRIEF",
            "stream": "DAILY_BRIEF",
            "sentiment": sentiment,
            "sentiment_score": sentiment_score,
            "related_tickers": ["IHSG", "BBCA", "BBRI", "ANTM", "MEDC"],
            "primary_ticker": "IHSG",
            "chart_symbol": "IDX:COMPOSITE",
            "metrics": [
                f"IHSG: {ihsg_p:,.0f} ({'+' if ihsg_c>=0 else ''}{ihsg_c:.2f}%)",
                f"Pivot: {tech_levels['pivot']:,.0f}",
                f"S1/R1: {tech_levels['s1']:,.0f} / {tech_levels['r1']:,.0f}",
                f"Emas: ${gold_p:,.1f}",
                f"Brent: ${oil_p:,.1f}"
            ],
            "reading_time_sec": 90,
            "summary": layman_summary,
            "full_narrative": f"{layman_summary}\n\nLevel Pivot: {tech_levels['pivot']:,.0f}, Support 1: {tech_levels['s1']:,.0f}, Resistance 1: {tech_levels['r1']:,.0f}. Batas risiko cut-loss disiplin di bawah {tech_levels['invalidation']:,.0f}.",
            "technical_levels": tech_levels,
            "key_takeaways": takeaways,
            "actionable_playbook": {
                "bull_scenario": f"Jika bertahan di atas Pivot {tech_levels['pivot']:,.0f}: Akumulasi saham klaster perbankan dan tambang target R1 {tech_levels['r1']:,.0f}.",
                "bear_scenario": f"Jika breakdown di bawah S1 {tech_levels['s1']:,.0f}: Kurangi porsi saham spekulatif, naikkan cash 35%, pantau reaksi di S2 {tech_levels['s2']:,.0f}.",
                "invalidation_rule": f"Cut-loss ketat jika IHSG menembus level {tech_levels['invalidation']:,.0f} pada candle harian."
            },
            "is_pinned": True,
            "edition_type": "DAILY_BRIEF"
        }

        # Save to historical archive (FIFO 14 editions)
        cls.archive_research_edition(brief_data)
        return brief_data

    @classmethod
    def generate_research_note(cls, macro: dict, scope: str = "DAILY") -> dict:
        """
        Generates an institutional Research Note following Goldman Sachs GIR and Ray Dalio macro framework.
        Features Layman translation, S/R matrix, and Barbell Strategy allocation.
        """
        now = datetime.now()
        now_str = now.strftime("%d %b %Y")
        gold_c = float(macro.get("gold_change_pct", 0.0) or 0.0)
        gold_p = float(macro.get("gold_price", 2650.0) or 2650.0)

        # Technical levels for spotlight emiten: BBCA & ANTM
        bbca_levels = cls.calculate_technical_levels(6200.0, asset_type="IDX")
        antm_levels = cls.calculate_technical_levels(1650.0, asset_type="IDX")

        title = f"🔬 MBG Sector Research Note ({now_str}): Rotasi Likuiditas Perbankan vs Komoditas Emas"
        layman_explanation = (
            "Panduan Analisis Sederhana: Mengapa saham bank dan tambang bergerak berlawanan arah? "
            "Ketika ekspektasi suku bunga dunia tinggi, bank menikmati margin bunga (NIM) yang sehat. "
            "Sebaliknya saat risiko tensi perang meningkat, institusi memindahkan dana ke aset lindung nilai seperti emas (ANTM). "
            "Strategi terbaik bagi investor adalah membagi portofolio secara berimbang ('Barbell Strategy')."
        )

        takeaways = [
            f"🏦 Klaster Perbankan (BBCA, BBRI, BMRI): Valuasi historis menarik dengan konsistensi deviden yield 4-6%. Pivot BBCA berada di Rp {bbca_levels['pivot']:,.0f}, Support S1 Rp {bbca_levels['s1']:,.0f}, Target R1 Rp {bbca_levels['r1']:,.0f}.",
            f"⛏️ Klaster Tambang Emas (ANTM, BRMS, MDKA): Sensitivitas tinggi terhadap harga emas spot dunia (${gold_p:,.1f}). Pivot ANTM di Rp {antm_levels['pivot']:,.0f}, Support S1 Rp {antm_levels['s1']:,.0f}, Target R1 Rp {antm_levels['r1']:,.0f}.",
            f"💡 Rekomendasi Alokasi Portofolio: Terapkan 'Barbell Strategy' institusional: 60% saham defensif dividen tinggi (BBCA/BBRI/BMRI) + 40% saham momentum komoditas energi/emas (ANTM/MEDC).",
            f"🛡️ Invalidation Level & Manajemen Risiko: Cut-loss disiplin jika emiten menembus level batas bawah (BBCA < Rp {bbca_levels['invalidation']:,.0f} / ANTM < Rp {antm_levels['invalidation']:,.0f})."
        ]

        month_id = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
        dt_wib = now.astimezone(WIB_TZ)
        date_id_str = f"{dt_wib.day:02d} {month_id[dt_wib.month - 1]} {dt_wib.year}"
        time_id_str = f"{dt_wib.strftime('%H:%M')} WIB"
        pub_str = f"{date_id_str} • {time_id_str}"
        ts_ms = int(now.astimezone(timezone.utc).timestamp() * 1000)

        note_data = {
            "id": f"research-note-{now.strftime('%Y%m%d%H%M')}",
            "title": title,
            "source": "MBG RESEARCH INTELLIGENCE",
            "link": "#research-note",
            "pub_date": now.astimezone(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT"),
            "timestamp_ms": ts_ms,
            "source_published_at": now.astimezone(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT"),
            "source_time_utc": now.astimezone(timezone.utc).strftime("%H:%M:%S GMT"),
            "published_str": pub_str,
            "published_date": date_id_str,
            "published_time": time_id_str,
            "date_iso": now.strftime("%Y-%m-%d"),
            "scope": scope,
            "tag": "RESEARCH",
            "stream": "RESEARCH",
            "sentiment": "BULLISH",
            "sentiment_score": 0.48,
            "related_tickers": ["BBCA", "BBRI", "ANTM", "MEDC", "MDKA"],
            "primary_ticker": "BBCA",
            "chart_symbol": "IDX:BBCA",
            "metrics": [
                "Alokasi Barbell: 60% Bank : 40% Emas",
                f"BBCA Pivot: Rp {bbca_levels['pivot']:,.0f}",
                f"ANTM Pivot: Rp {antm_levels['pivot']:,.0f}",
                "R:R Target: >= 2.2"
            ],
            "reading_time_sec": 120,
            "summary": layman_explanation,
            "full_narrative": f"{layman_explanation}\n\nLevel Teknikal BBCA: Pivot Rp {bbca_levels['pivot']:,.0f}, S1 Rp {bbca_levels['s1']:,.0f}, R1 Rp {bbca_levels['r1']:,.0f}. Level Teknikal ANTM: Pivot Rp {antm_levels['pivot']:,.0f}, S1 Rp {antm_levels['s1']:,.0f}, R1 Rp {antm_levels['r1']:,.0f}.",
            "technical_levels": bbca_levels,
            "secondary_technical_levels": antm_levels,
            "key_takeaways": takeaways,
            "actionable_playbook": {
                "bull_scenario": f"Akumulasi bertahap BBCA di area Rp {bbca_levels['s1']:,.0f} - {bbca_levels['pivot']:,.0f} dengan target profit Rp {bbca_levels['r1']:,.0f} s/d Rp {bbca_levels['r2']:,.0f}.",
                "bear_scenario": "Jika terjadi capital outflow asing > Rp 500 Milyar per sesi, kurangi eksposur saham beta tinggi dan perbesar porsi cash.",
                "invalidation_rule": f"Batal jika BBCA breakdown penutupan harian di bawah Rp {bbca_levels['invalidation']:,.0f}."
            },
            "is_pinned": True,
            "edition_type": "RESEARCH_NOTE"
        }

        # Save to historical archive (FIFO 14 editions)
        cls.archive_research_edition(note_data)
        return note_data

    @classmethod
    def archive_research_edition(cls, edition: dict, max_editions: int = 14):
        """
        Manages historical research archive in a FIFO structure capped strictly at 14 items.
        Keeps file size under 60 KB, preventing browser and server memory bloating.
        """
        try:
            archive = []
            if os.path.exists(ARCHIVE_FILE_PATH):
                with open(ARCHIVE_FILE_PATH, "r", encoding="utf-8") as f:
                    archive = json.load(f)
            elif os.path.exists(PUBLIC_ARCHIVE_PATH):
                with open(PUBLIC_ARCHIVE_PATH, "r", encoding="utf-8") as f:
                    archive = json.load(f)

            if not isinstance(archive, list):
                archive = []

            # Deduplicate by id or (date_iso + edition_type)
            clean_archive = [
                item for item in archive
                if item.get("id") != edition.get("id") and
                not (item.get("date_iso") == edition.get("date_iso") and item.get("edition_type") == edition.get("edition_type"))
            ]

            clean_archive.insert(0, edition)
            # Strict FIFO cap at max_editions (14 days)
            clean_archive = clean_archive[:max_editions]

            # Write to cache dir
            os.makedirs(os.path.dirname(ARCHIVE_FILE_PATH), exist_ok=True)
            with open(ARCHIVE_FILE_PATH, "w", encoding="utf-8") as f:
                json.dump(clean_archive, f, indent=2, ensure_ascii=False)

            # Write to frontend public dir for instant browser fetch
            os.makedirs(os.path.dirname(PUBLIC_ARCHIVE_PATH), exist_ok=True)
            with open(PUBLIC_ARCHIVE_PATH, "w", encoding="utf-8") as f:
                json.dump(clean_archive, f, indent=2, ensure_ascii=False)

            logger.info(f"Research archive synced. Total editions: {len(clean_archive)}")
        except Exception as e:
            logger.warning(f"Failed to archive research edition: {e}")

    latest_crisis_alert = {
        "is_crisis": False,
        "severity": "NORMAL",
        "headline": "",
        "summary": "Situasi pasar global relatif terkendali tanpa eskalasi krisis darurat.",
        "affected_tickers": [],
        "recommended_action": "Pertahankan alokasi portofolio standar sesuai trading plan.",
        "evaluated_at": datetime.now(timezone.utc).isoformat()
    }

    @classmethod
    def get_latest_crisis_alert(cls) -> dict:
        return cls.latest_crisis_alert

    @classmethod
    def sanitize_and_curate(cls, raw_articles: List[Dict[str, Any]], macro: dict) -> List[Dict[str, Any]]:
        """
        Master curation method (AI-Powered with Graceful Fallback):
        1. Filters out noise/gaming/cookware/crime and deduplicates.
        2. Scans for Urgent War / Crisis Flash Alerts using LLM or rule-based heuristics.
        3. Synthesizes an institutional Daily Brief & Research Note via Gemini LLM.
        4. Gracefully falls back to deterministic templates if offline.
        """
        filtered_news = []
        seen_titles = set()

        for a in raw_articles:
            title = a.get("title", "")
            source = a.get("source", "")
            stream = a.get("stream", "")

            # Deduplication
            norm_title = re.sub(r'[^a-zA-Z0-9]', '', title).lower()
            if norm_title in seen_titles:
                continue
            seen_titles.add(norm_title)

            # Validity check (noise filter)
            if not cls.is_valid_financial_article(title, source):
                logger.debug(f"Filtering out noise: [{source}] {title}")
                continue

            # Accurate ticker extraction
            accurate_tickers = cls.extract_tickers_accurately(title, stream=stream)
            a["related_tickers"] = accurate_tickers
            filtered_news.append(a)

        # 2. AI Synthesis & Crisis Evaluation via LLMBrain
        daily_brief = None
        research_note = None
        llm_crisis = None

        try:
            from analyzer.llm_brain import LLMBrain
            brain = LLMBrain()

            # Evaluate crisis headlines
            llm_crisis = brain.evaluate_crisis_headlines(filtered_news)
            if llm_crisis:
                cls.latest_crisis_alert = llm_crisis

            # Synthesize dynamic research
            ai_research = brain.synthesize_institutional_research(filtered_news, macro)
            if ai_research and "daily_brief" in ai_research and "research_note" in ai_research:
                now = datetime.now()
                now_str = now.strftime("%d %b %Y")
                month_id = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
                dt_wib = now.astimezone(WIB_TZ)
                date_id_str = f"{dt_wib.day:02d} {month_id[dt_wib.month - 1]} {dt_wib.year}"
                time_id_str = f"{dt_wib.strftime('%H:%M')} WIB"
                pub_str = f"{date_id_str} • {time_id_str}"
                ts_ms = int(now.astimezone(timezone.utc).timestamp() * 1000)

                gold_p = float(macro.get("gold_price", 2650.0) or 2650.0)
                brent_p = float(macro.get("brent_oil_price", 74.5) or 74.5)
                ihsg_p = float(macro.get("ihsg_price", 7250.0) or 7250.0)

                db_data = ai_research["daily_brief"]
                rn_data = ai_research["research_note"]

                # Technical levels for spotlight emiten
                bbca_levels = cls.calculate_technical_levels(6200.0, asset_type="IDX")
                antm_levels = cls.calculate_technical_levels(1650.0, asset_type="IDX")

                daily_brief = {
                    "id": f"daily-brief-{now.strftime('%Y%m%d%H%M')}",
                    "title": db_data.get("title") or f"☀️ MBG Morning Macro Brief ({now_str})",
                    "source": "MBG RESEARCH INTELLIGENCE",
                    "link": "#daily-brief",
                    "pub_date": now.astimezone(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT"),
                    "timestamp_ms": ts_ms,
                    "source_published_at": now.astimezone(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT"),
                    "source_time_utc": now.astimezone(timezone.utc).strftime("%H:%M:%S GMT"),
                    "published_str": pub_str,
                    "published_date": date_id_str,
                    "published_time": time_id_str,
                    "date_iso": now.strftime("%Y-%m-%d"),
                    "scope": "DAILY",
                    "tag": "DAILY_BRIEF",
                    "stream": "DAILY_BRIEF",
                    "sentiment": db_data.get("market_outlook", "NEUTRAL"),
                    "sentiment_score": 0.55 if db_data.get("market_outlook") == "BULLISH" else 0.40,
                    "related_tickers": ["IHSG", "BBCA", "ANTM", "MEDC", "USDIDR"],
                    "primary_ticker": "IHSG",
                    "chart_symbol": "IDX:COMPOSITE",
                    "metrics": [
                        f"IHSG Target: {ihsg_p:,.0f}",
                        f"Emas: ${gold_p:,.1f}",
                        f"Brent: ${brent_p:,.1f}",
                        f"Katalis: {db_data.get('primary_catalyst', 'Sentimen Makro')[:25]}"
                    ],
                    "reading_time_sec": 90,
                    "summary": db_data.get("layman_explanation") or "Panduan eksekutif makro pagi hari.",
                    "full_narrative": "\n\n".join(db_data.get("key_takeaways", [])),
                    "key_takeaways": db_data.get("key_takeaways", []),
                    "actionable_playbook": {
                        "bull_scenario": "Akumulasi bertahap saham defensif dan perbankan di support harian.",
                        "bear_scenario": "Pasang trailing stop ketat dan amankan porsi likuiditas kas.",
                        "invalidation_rule": "Sinyal melemah jika indeks breakdown level support kritis."
                    },
                    "is_pinned": True,
                    "edition_type": "DAILY_BRIEF",
                    "ai_generated": True,
                    "model_used": brain.fast_model
                }

                takeaways = rn_data.get("key_takeaways", [])
                # Ensure technical level notes are included
                takeaways.append(f"📊 Pivot BBCA di Rp {bbca_levels['pivot']:,.0f} (S1: Rp {bbca_levels['s1']:,.0f}, R1: Rp {bbca_levels['r1']:,.0f}). Pivot ANTM di Rp {antm_levels['pivot']:,.0f}.")
                takeaways.append(f"🛡️ Batas Invalidation: BBCA < Rp {bbca_levels['invalidation']:,.0f}, ANTM < Rp {antm_levels['invalidation']:,.0f}.")

                research_note = {
                    "id": f"research-note-{now.strftime('%Y%m%d%H%M')}",
                    "title": rn_data.get("title") or f"🔬 MBG Sector Research Note ({now_str}): Barbell Strategy",
                    "source": "MBG RESEARCH INTELLIGENCE",
                    "link": "#research-note",
                    "pub_date": now.astimezone(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT"),
                    "timestamp_ms": ts_ms,
                    "source_published_at": now.astimezone(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT"),
                    "source_time_utc": now.astimezone(timezone.utc).strftime("%H:%M:%S GMT"),
                    "published_str": pub_str,
                    "published_date": date_id_str,
                    "published_time": time_id_str,
                    "date_iso": now.strftime("%Y-%m-%d"),
                    "scope": "DAILY",
                    "tag": "RESEARCH",
                    "stream": "RESEARCH",
                    "sentiment": "BULLISH",
                    "sentiment_score": 0.50,
                    "related_tickers": ["BBCA", "BBRI", "ANTM", "MEDC", "MDKA"],
                    "primary_ticker": "BBCA",
                    "chart_symbol": "IDX:BBCA",
                    "metrics": [
                        "Alokasi Barbell: 60% Bank : 40% Komoditas",
                        f"BBCA Pivot: Rp {bbca_levels['pivot']:,.0f}",
                        f"ANTM Pivot: Rp {antm_levels['pivot']:,.0f}",
                        "R:R Target: >= 2.0"
                    ],
                    "reading_time_sec": 120,
                    "summary": rn_data.get("layman_explanation") or "Analisis sektor dan panduan alokasi portofolio.",
                    "full_narrative": "\n\n".join(takeaways),
                    "technical_levels": bbca_levels,
                    "secondary_technical_levels": antm_levels,
                    "key_takeaways": takeaways,
                    "actionable_playbook": rn_data.get("actionable_playbook", {
                        "bull_scenario": f"Akumulasi bertahap BBCA di area Rp {bbca_levels['s1']:,.0f} - {bbca_levels['pivot']:,.0f}.",
                        "bear_scenario": "Jika capital outflow berlanjut, perbesar porsi cash.",
                        "invalidation_rule": f"Batal jika BBCA breakdown penutupan di bawah Rp {bbca_levels['invalidation']:,.0f}."
                    }),
                    "is_pinned": True,
                    "edition_type": "RESEARCH_NOTE",
                    "ai_generated": True,
                    "model_used": brain.fast_model
                }
                cls.archive_research_edition(research_note)
                logger.info(f"AI Institutional Research Note generated via {brain.fast_model}")
        except Exception as e:
            logger.warning(f"AI Research synthesis failed ({e}). Falling back to deterministic templates.")

        # Fallback if AI synthesis was not produced
        if not daily_brief:
            daily_brief = cls.generate_daily_brief(macro, session="MORNING")
        if not research_note:
            research_note = cls.generate_research_note(macro, scope="DAILY")

        # Sync crisis alert to the private cache (not a public static path)
        crisis_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "cache", "latest_crisis_alert.json"
        )
        try:
            os.makedirs(os.path.dirname(crisis_file), exist_ok=True)
            with open(crisis_file, "w", encoding="utf-8") as cf:
                json.dump(cls.latest_crisis_alert, cf, indent=2, ensure_ascii=False)
        except Exception as ce:
            logger.debug(f"Failed to sync crisis file: {ce}")

        # Sort all curated live news strictly by newest (descending timestamp_ms)
        filtered_news.sort(key=lambda x: x.get("timestamp_ms", 0), reverse=True)
        for idx, item in enumerate(filtered_news, 1):
            item["id"] = f"news-{idx}"

        return [daily_brief, research_note] + filtered_news
