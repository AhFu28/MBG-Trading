import logging
import yfinance as yf
from datetime import datetime

logger = logging.getLogger("IDXMarketFetcher")

class IDXMarketFetcher:
    def __init__(self):
        self.history_dfs = {}
        # 1. Conglomerate Groups Definition
        self.conglomerates = {
            "BARITO_GROUP": [
                {"ticker": "BREN.JK", "name": "Barito Renewables Energy"},
                {"ticker": "TPIA.JK", "name": "Chandra Asri Pacific"},
                {"ticker": "BRPT.JK", "name": "Barito Pacific"},
                {"ticker": "CUAN.JK", "name": "Petrindo Jaya Kreasi"},
                {"ticker": "PTRO.JK", "name": "Petrosea"}
            ],
            "SALIM_GROUP": [
                {"ticker": "INDF.JK", "name": "Indofood Sukses Makmur"},
                {"ticker": "ICBP.JK", "name": "Indofood CBP Sukses Makmur"},
                {"ticker": "MEDC.JK", "name": "Medco Energi Internasional"},
                {"ticker": "AMMN.JK", "name": "Amman Mineral Internasional"}
            ],
            "ASTRA_GROUP": [
                {"ticker": "ASII.JK", "name": "Astra International"},
                {"ticker": "UNTR.JK", "name": "United Tractors"},
                {"ticker": "AUTO.JK", "name": "Astra Otoparts"}
            ],
            "DJARUM_GROUP": [
                {"ticker": "BBCA.JK", "name": "Bank Central Asia"},
                {"ticker": "TOWR.JK", "name": "Sarana Menara Nusantara"},
                {"ticker": "BELI.JK", "name": "Global Digital Niaga (Blibli)"}
            ],
            "BAKRIE_GROUP": [
                {"ticker": "BRMS.JK", "name": "Bumi Resources Minerals"},
                {"ticker": "BUMI.JK", "name": "Bumi Resources"},
                {"ticker": "ENRG.JK", "name": "Energi Mega Persada"},
                {"ticker": "VKTR.JK", "name": "VKTR Teknologi Mobilitas"}
            ],
            "ADARO_GROUP": [
                {"ticker": "ADRO.JK", "name": "Adaro Energy Indonesia"},
                {"ticker": "ADMR.JK", "name": "Adaro Minerals Indonesia"}
            ]
        }

        # 2. Dividend Hunters Universe
        self.dividend_stocks = [
            {"ticker": "ITMG.JK", "name": "Indo Tambangraya Megah", "est_yield": 12.8, "trap_risk": "MEDIUM"},
            {"ticker": "PTBA.JK", "name": "Bukit Asam", "est_yield": 14.2, "trap_risk": "MEDIUM"},
            {"ticker": "ADRO.JK", "name": "Adaro Energy Indonesia", "est_yield": 10.5, "trap_risk": "LOW"},
            {"ticker": "MPMX.JK", "name": "Mitra Pinasthika Mustika", "est_yield": 9.4, "trap_risk": "LOW"},
            {"ticker": "HEXA.JK", "name": "Hexindo Adiperkasa", "est_yield": 11.2, "trap_risk": "LOW"},
            {"ticker": "BBRI.JK", "name": "Bank Rakyat Indonesia", "est_yield": 6.8, "trap_risk": "LOW"},
            {"ticker": "BMRI.JK", "name": "Bank Mandiri", "est_yield": 5.9, "trap_risk": "LOW"},
            {"ticker": "BBNI.JK", "name": "Bank Negara Indonesia", "est_yield": 5.4, "trap_risk": "LOW"},
            {"ticker": "BJTM.JK", "name": "Bank Pembangunan Daerah Jatim", "est_yield": 9.1, "trap_risk": "LOW"},
            {"ticker": "BJBR.JK", "name": "Bank Pembangunan Daerah Jabar", "est_yield": 8.7, "trap_risk": "MEDIUM"}
        ]

        # 3. Foreign Flow Radar Candidates
        self.foreign_flow_candidates = [
            {"ticker": "BBCA.JK", "name": "Bank Central Asia"},
            {"ticker": "BBRI.JK", "name": "Bank Rakyat Indonesia"},
            {"ticker": "BMRI.JK", "name": "Bank Mandiri"},
            {"ticker": "TLKM.JK", "name": "Telkom Indonesia"},
            {"ticker": "ASII.JK", "name": "Astra International"},
            {"ticker": "MDKA.JK", "name": "Merdeka Copper Gold"},
            {"ticker": "ANTM.JK", "name": "Aneka Tambang"},
            {"ticker": "GOTO.JK", "name": "GoTo Gojek Tokopedia"},
            {"ticker": "BRIS.JK", "name": "Bank Syariah Indonesia"},
            {"ticker": "CPIN.JK", "name": "Charoen Pokphand Indonesia"}
        ]

    def _fetch_ticker_stats(self, ticker: str) -> dict:
        """Fetch quotes and calculate technical indicators for a ticker"""
        default_stat = {
            "price": 1000,
            "change_pct": 0.0,
            "volume": 100000,
            "ma20": 1000,
            "ma50": 1000,
            "rsi_14": 50.0,
            "foreign_net_val_idr": 0,
            "technical_signal": "CONSOLIDATION"
        }
        try:
            t = yf.Ticker(ticker)
            hist = t.history(period="3mo")
            if not hist.empty and len(hist) >= 15:
                self.history_dfs[ticker] = hist
                self.history_dfs[ticker.replace(".JK", "")] = hist
                closes = hist["Close"]
                vols = hist["Volume"]
                price = float(closes.iloc[-1])
                prev_close = float(closes.iloc[-2]) if len(closes) >= 2 else price
                change_pct = round(((price - prev_close) / prev_close) * 100, 2)
                volume = int(vols.iloc[-1])

                # MAs
                ma20 = round(float(closes.rolling(20).mean().iloc[-1]), 1) if len(closes) >= 20 else price
                ma50 = round(float(closes.rolling(50).mean().iloc[-1]), 1) if len(closes) >= 50 else ma20

                # RSI 14
                delta = closes.diff()
                gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
                loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
                rs = gain / (loss + 1e-9)
                rsi = round(float(100 - (100 / (1 + rs)).iloc[-1]), 1)

                # Signal Detection
                avg_vol = float(vols.rolling(20).mean().iloc[-1]) if len(vols) >= 20 else volume
                vol_ratio = volume / (avg_vol + 1)

                if price > ma20 and vol_ratio >= 1.4 and change_pct > 1.5:
                    signal = "BREAKOUT"
                elif vol_ratio >= 1.3 and abs(change_pct) < 1.0:
                    signal = "ACCUMULATION"
                elif rsi < 35:
                    signal = "OVERSOLD_REBOUND"
                else:
                    signal = "PULLBACK" if price < ma20 else "CONSOLIDATION"

                # Foreign flow estimate proxy (price change * institutional participation factor)
                est_flow = round((price * volume * (change_pct / 100)) * 0.35, 0)

                return {
                    "price": round(price, 0),
                    "change_pct": change_pct,
                    "volume": volume,
                    "ma20": ma20,
                    "ma50": ma50,
                    "rsi_14": rsi,
                    "foreign_net_val_idr": est_flow,
                    "technical_signal": signal
                }
        except Exception as e:
            logger.debug(f"yfinance failed for {ticker}: {e}")

        return default_stat

    def execute(self) -> dict:
        """Run classification and generate organized dataset"""
        results = {
            "conglomerates": {},
            "dividend_hunters": [],
            "foreign_flow": {
                "top_inflow": [],
                "top_outflow": []
            },
            "all_records": []
        }

        # 1. Process Conglomerates
        for group_name, items in self.conglomerates.items():
            group_list = []
            for item in items:
                ticker = item["ticker"]
                stats = self._fetch_ticker_stats(ticker)
                record = {
                    "ticker": ticker.replace(".JK", ""),
                    "full_ticker": ticker,
                    "company_name": item["name"],
                    "category": "CONGLOMERATE",
                    "sub_category": group_name,
                    "price": stats["price"],
                    "change_pct": stats["change_pct"],
                    "volume": stats["volume"],
                    "foreign_net_val_idr": stats["foreign_net_val_idr"],
                    "dividend_yield_pct": 0,
                    "dividend_trap_risk": "N/A",
                    "ma20": stats["ma20"],
                    "ma50": stats["ma50"],
                    "rsi_14": stats["rsi_14"],
                    "technical_signal": stats["technical_signal"],
                    "updated_at": datetime.now().isoformat()
                }
                group_list.append(record)
                results["all_records"].append(record)
            results["conglomerates"][group_name] = group_list

        # 2. Process Dividend Hunters
        for item in self.dividend_stocks:
            ticker = item["ticker"]
            stats = self._fetch_ticker_stats(ticker)
            record = {
                "ticker": ticker.replace(".JK", ""),
                "full_ticker": ticker,
                "company_name": item["name"],
                "category": "DIVIDEND_HUNTER",
                "sub_category": "HIGH_YIELD_ARISTOCRAT",
                "price": stats["price"],
                "change_pct": stats["change_pct"],
                "volume": stats["volume"],
                "foreign_net_val_idr": stats["foreign_net_val_idr"],
                "dividend_yield_pct": item["est_yield"],
                "dividend_trap_risk": item["trap_risk"],
                "ma20": stats["ma20"],
                "ma50": stats["ma50"],
                "rsi_14": stats["rsi_14"],
                "technical_signal": stats["technical_signal"],
                "updated_at": datetime.now().isoformat()
            }
            results["dividend_hunters"].append(record)
            results["all_records"].append(record)

        # 3. Process Foreign Flow Radar
        flow_records = []
        for item in self.foreign_flow_candidates:
            ticker = item["ticker"]
            stats = self._fetch_ticker_stats(ticker)
            flow_records.append({
                "ticker": ticker.replace(".JK", ""),
                "full_ticker": ticker,
                "company_name": item["name"],
                "category": "FOREIGN_FLOW",
                "sub_category": "INSTITUTIONAL_TRACKER",
                "price": stats["price"],
                "change_pct": stats["change_pct"],
                "volume": stats["volume"],
                "foreign_net_val_idr": stats["foreign_net_val_idr"],
                "dividend_yield_pct": 0,
                "dividend_trap_risk": "N/A",
                "ma20": stats["ma20"],
                "ma50": stats["ma50"],
                "rsi_14": stats["rsi_14"],
                "technical_signal": stats["technical_signal"],
                "updated_at": datetime.now().isoformat()
            })

        # Sort top 5 inflow and top 5 outflow
        sorted_flow = sorted(flow_records, key=lambda x: x["foreign_net_val_idr"], reverse=True)
        results["foreign_flow"]["top_inflow"] = sorted_flow[:5]
        results["foreign_flow"]["top_outflow"] = sorted(flow_records, key=lambda x: x["foreign_net_val_idr"])[:5]
        results["all_records"].extend(flow_records)
        results["history_dfs"] = self.history_dfs

        return results
