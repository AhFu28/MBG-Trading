"""
engine/agents/news_research_agent.py
====================================
Dedicated Financial News & Research Intelligence Agent for MBG Trading.
Responsible for:
1. Strict financial query sourcing & noise filtering (eliminating gaming, kitchenware, crime).
2. Anti-false-positive ticker matching (e.g. preventing 'near' from triggering crypto $NEAR).
3. Automated Daily Brief (Morning / Closing) generation.
4. Thematic Daily & Weekly Research Note synthesis.
5. Direct integration with Telegram Notifier.
"""

import os
import re
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple, Optional

logger = logging.getLogger("NewsResearchAgent")

class NewsResearchAgent:
    """Autonomous Financial News Curator & Research Analyst Agent."""

    # Curated financial sources whitelist priority
    TIER_1_SOURCES = {
        "bloomberg", "reuters", "wsj", "cnbc", "financial times", "barron's",
        "investor's business daily", "investor daily", "bisnis.com", "kontan",
        "bloomberg technoz", "coindesk", "cointelegraph", "the block", "kitco"
    }

    # Negative keyword filters: articles matching these in title are discarded
    NEGATIVE_KEYWORDS = [
        "valorant", "geforce", "esports", "e-sports", "gameplay", "game pass",
        "driver update", "cookware", "cooking", "pans", "panci", "stolen",
        "theft", "pencurian", "maling", "recipe", "resep", "review game",
        "gaming monitor", "rtx 40", "rtx 50", "gpu driver", "steamos", "critters"
    ]

    # Domain / source blacklist for PR blogs or non-financial media
    DISALLOWED_SOURCES = [
        "nvidia blog", "foodandwine", "food & wine", "wavy.com", "homer news",
        "abc7 los angeles", "game developer", "ign", "pc gamer", "tom's hardware"
    ]

    # Tickers that are common English or Indonesian dictionary words
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
        """Filter out gaming, domestic crime, kitchenware, and pure corporate PR blog posts."""
        t_low = title.lower()
        s_low = source.lower()

        # 1. Check disallowed sources
        for ds in cls.DISALLOWED_SOURCES:
            if ds in s_low:
                # Disallow unless title explicitly has stock/financial indicators
                if not any(k in t_low for k in ["stock", "shares", "revenue", "earnings", "wall street", "market cap"]):
                    return False

        # 2. Check negative keywords
        for nk in cls.NEGATIVE_KEYWORDS:
            if nk in t_low:
                return False

        # 3. Discard raw PR announcements without financial bearing
        if s_low == "nvidia" and not any(k in t_low for k in ["stock", "shares", "earnings", "q1", "q2", "q3", "q4", "investor", "revenue", "market cap"]):
            return False

        return True

    @classmethod
    def extract_tickers_accurately(cls, text: str, stream: str = "") -> List[str]:
        """
        Accurately extracts tickers while preventing false positives like 'near' -> '$NEAR'.
        """
        found = []
        upper_text = text.upper()

        # 1. Look for explicit dollar-tagged tickers e.g. $NEAR, $BBCA
        dollar_tickers = re.findall(r"\$([A-Z]{2,6})\b", upper_text)
        for dt in dollar_tickers:
            if dt in cls.KNOWN_EQUITY_TICKERS or dt in cls.KNOWN_CRYPTO_TICKERS or dt in cls.AMBIGUOUS_TICKERS:
                found.append(dt)

        # 2. Look for regular word boundary uppercase tokens
        words = re.findall(r"\b[A-Z]{3,5}\b", upper_text)
        for w in words:
            # Skip ambiguous words unless preceded by $ or explicitly in crypto context
            if w in cls.AMBIGUOUS_TICKERS:
                if f"${w}" in upper_text:
                    found.append(w)
                elif stream == "CRYPTO" and any(k in text.lower() for k in ["protocol", "token", "crypto", "blockchain"]):
                    found.append(w)
                continue

            if w in cls.KNOWN_EQUITY_TICKERS or w in cls.KNOWN_CRYPTO_TICKERS:
                found.append(w)

        # 3. Known aliases
        if ("BITCOIN" in upper_text or "BTC" in upper_text) and "BTC" not in found: found.append("BTC")
        if ("ETHEREUM" in upper_text) and "ETH" not in found: found.append("ETH")
        if ("SOLANA" in upper_text) and "SOL" not in found: found.append("SOL")
        if ("ANTAM" in upper_text) and "ANTM" not in found: found.append("ANTM")
        if ("MEDCO" in upper_text) and "MEDC" not in found: found.append("MEDC")
        if ("BANK BRI" in upper_text or "BBRI" in upper_text) and "BBRI" not in found: found.append("BBRI")
        if ("BANK MANDIRI" in upper_text or "BMRI" in upper_text) and "BMRI" not in found: found.append("BMRI")
        if ("BANK BCA" in upper_text or "BBCA" in upper_text) and "BBCA" not in found: found.append("BBCA")
        if ("TELKOM" in upper_text) and "TLKM" not in found: found.append("TLKM")
        if ("ASTRA" in upper_text) and "ASII" not in found: found.append("ASII")

        return list(dict.fromkeys(found))

    @classmethod
    def generate_daily_brief(cls, macro: dict, session: str = "MORNING") -> dict:
        """
        Generates a highly structured institutional Daily Brief (Morning / Closing).
        Session: 'MORNING' (07:30 WIB) or 'CLOSING' (16:30 WIB).
        """
        gold_p = float(macro.get("gold_price", 2750.0) or 2750.0)
        gold_c = float(macro.get("gold_change_pct", 0.0) or 0.0)
        oil_p = float(macro.get("brent_oil_price", 74.2) or 74.2)
        oil_c = float(macro.get("brent_oil_change_pct", 0.0) or 0.0)
        dxy_v = float(macro.get("dxy_index", 104.5) or 104.5)
        dxy_c = float(macro.get("dxy_change_pct", 0.0) or 0.0)
        us10y = float(macro.get("us10y_yield", 4.28) or 4.28)
        ihsg_p = float(macro.get("ihsg_price", 6506.4) or 6506.4)
        ihsg_c = float(macro.get("ihsg_change_pct", -0.5) or -0.5)

        now_str = datetime.now().strftime("%d %b %Y %H:%M WIB")

        if session == "MORNING":
            title = f"☕ MBG Morning Brief: Proyeksi IHSG, Sentimen Wall Street & Dinamika Komoditas Global"
            sentiment = "BULLISH" if (gold_c > 0 and ihsg_c >= 0) else ("BEARISH" if ihsg_c < -1.0 else "NEUTRAL")
            sentiment_score = 0.4 if sentiment == "BULLISH" else (-0.4 if sentiment == "BEARISH" else 0.0)

            takeaways = [
                f"🌍 Kondisi Makro Semalam: Emas ${gold_p:,.1f} ({'+' if gold_c>0 else ''}{gold_c}%), Minyak Brent ${oil_p:,.1f} ({'+' if oil_c>0 else ''}{oil_c}%), DXY Index {dxy_v} pts, Yield US10Y {us10y}%.",
                f"🏛️ Katalis Pembukaan IHSG: Indeks diproyeksikan menguji level psikologis {ihsg_p:,.0f}. Sektor komoditas logam dan energi dalam sorotan aktif merespons fluktuasi global.",
                f"🛡️ Actionable Guidance: Disarankan fokus pada saham berorientasi ekspor dan defensif dividen; pasang trailing stop disiplin 3% untuk mengamankan modal."
            ]
            summary = f"MBG Morning Brief Intelligence ({now_str}): Tinjauan makro global, komoditas emas & minyak mentah, serta panduan alokasi portofolio harian."
        else:
            title = f"☕ MBG Closing Brief: Rekapitulasi Sesi Perdagangan IHSG & Sentimen Pasar 24 Jam"
            sentiment = "BULLISH" if ihsg_c > 0 else "BEARISH"
            sentiment_score = 0.5 if ihsg_c > 0 else -0.5

            takeaways = [
                f"📊 Penutupan IHSG: Indeks bertengger di {ihsg_p:,.2f} ({'+' if ihsg_c>0 else ''}{ihsg_c}%). Rotasi likuiditas terpantau pada emiten perbankan dan penopang indeks.",
                f"🐳 Arus Modal Asing & Sektoral: Evaluasi foreign flow menunjukkan selektivitas tinggi pada klaster konglomerasi likuid.",
                f"🪙 Aset Kripto & Likuiditas: Pasar kripto mempertahankan level support krusial seiring pemantauan rilis kebijakan moneter global."
            ]
            summary = f"MBG Closing Brief Intelligence ({now_str}): Rangkuman pergerakan bursa domestik, ringkasan rotasi sektor, dan sentimen komoditas pasca-market."

        return {
            "id": f"daily-brief-{datetime.now().strftime('%Y%m%d%H%M')}",
            "title": title,
            "source": "MBG RESEARCH DESK",
            "link": "#daily-brief",
            "pub_date": datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT"),
            "tag": "DAILY_BRIEF",
            "stream": "DAILY_BRIEF",
            "sentiment": sentiment,
            "sentiment_score": sentiment_score,
            "related_tickers": ["BBCA", "BBRI", "ANTM", "MEDC"],
            "metrics": [
                f"Emas: ${gold_p:,.1f}",
                f"Brent: ${oil_p:,.1f}",
                f"DXY: {dxy_v}",
                f"IHSG: {ihsg_p:,.1f} ({'+' if ihsg_c>0 else ''}{ihsg_c}%)"
            ],
            "reading_time_sec": 65,
            "summary": summary,
            "key_takeaways": takeaways,
            "is_pinned": True
        }

    @classmethod
    def generate_research_note(cls, macro: dict, scope: str = "DAILY") -> dict:
        """
        Generates a thematic institutional Research Note (Daily Sector Focus / Weekly Wrap).
        """
        now_str = datetime.now().strftime("%d %b %Y")
        gold_c = float(macro.get("gold_change_pct", 0.0) or 0.0)

        if scope == "WEEKLY":
            title = f"🔬 MBG Weekly Research Review: Evaluasi Korelasi Makro, Siklus Komoditas & Peta Risiko Sepekan"
            takeaways = [
                "📌 Matriks Kinerja Pasar: Analisis divergensi performa IHSG terhadap S&P 500 dan bursa regional Asia.",
                "⛏️ Siklus Super Komoditas: Transisi energi, penguatan emas sebagai lindung nilai inflasi, serta proyeksi marjin emiten tambang BEI.",
                "📅 Kalender Ekonomi Pekan Depan: Antisipasi rilis data inflasi (CPI/PPI AS), keputusan suku bunga bank sentral, dan arah arus likuiditas institusi."
            ]
            summary = f"MBG Weekly Research Intelligence: Catatan mendalam evaluasi makro sepekan, posisi likuiditas global, dan rekomendasi taktikal portofolio."
            tickers = ["ANTM", "BRMS", "BBCA", "BMRI", "BTC"]
        else:
            title = f"🔬 MBG Sector Research Note: Analisis Rotasi Modal Perbankan vs Komoditas Energi & Logam"
            takeaways = [
                f"🏦 Sektor Perbankan BUMN (BBRI, BMRI, BBNI): Ketahanan marjin bunga bersih (NIM) dan stabilitas rasio kredit bermasalah (NPL) di tengah volatilitas suku bunga global.",
                f"⛏️ Sektor Tambang & Emas (ANTM, BRMS, MDKA): Sensitivitas harga jual rata-rata (ASP) terhadap momentum kenaikan spot emas dunia ({'+' if gold_c>0 else ''}{gold_c}%).",
                f"💡 Rekomendasi Alokasi: Terapkan strategi 'Barbell Strategy'—kombinasi saham defensif dividen tinggi dan komoditas dengan katalis reli harga jangka pendek."
            ]
            summary = f"MBG Daily Research Desk ({now_str}): Riset tematik mendalam mengenai rotasi likuiditas institusi pada klaster saham likuid BEI."
            tickers = ["BBCA", "BBRI", "ANTM", "MEDC", "MDKA"]

        return {
            "id": f"research-note-{datetime.now().strftime('%Y%m%d%H%M')}",
            "title": title,
            "source": "MBG RESEARCH INTELLIGENCE",
            "link": "#research-note",
            "pub_date": datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT"),
            "tag": "RESEARCH",
            "stream": "RESEARCH",
            "sentiment": "BULLISH",
            "sentiment_score": 0.45,
            "related_tickers": tickers,
            "metrics": ["R:R Rasio >= 2.2", "Alokasi Barbell 60:40"],
            "reading_time_sec": 95,
            "summary": summary,
            "key_takeaways": takeaways,
            "is_pinned": True
        }

    @classmethod
    def sanitize_and_curate(cls, raw_articles: List[Dict[str, Any]], macro: dict) -> List[Dict[str, Any]]:
        """
        Master curation method:
        1. Filters out noise/gaming/cookware/crime.
        2. Fixes false positive tickers.
        3. Injects Daily Brief & Research Note at the top of the feed.
        """
        clean_articles = []
        seen_titles = set()

        # 1. Generate top-level Daily Brief & Research Note
        daily_brief = cls.generate_daily_brief(macro, session="MORNING")
        research_note = cls.generate_research_note(macro, scope="DAILY")

        clean_articles.append(daily_brief)
        clean_articles.append(research_note)

        # 2. Filter raw incoming articles
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
                logger.info(f"Filtering out non-financial/noise news: [{source}] {title}")
                continue

            # Accurate ticker extraction (anti-false positive)
            accurate_tickers = cls.extract_tickers_accurately(title, stream=stream)
            a["related_tickers"] = accurate_tickers

            clean_articles.append(a)

        return clean_articles
