import os
import json
import requests
import logging
from datetime import datetime, date

logger = logging.getLogger(__name__)

class BrokerSummaryFetcher:
    """
    BrokerSummaryFetcher
    Menyediakan data Broker Summary End-of-Day (EOD) dan Real Flow untuk saham IDX
    mengikuti format resmi Bursa Efek Indonesia (BEI) yang diadopsi oleh Stockbit & NeoBDM.
    """
    
    def __init__(self):
        self.api_key = os.getenv("INDEX_ALPHA_API_KEY", "")
        self.base_url = "https://api.indexalpha.id/stocks"
        
        # Database master broker terdaftar di BEI
        self.broker_names = {
            "AK": {"name": "UBS Sekuritas Indonesia", "type": "F"},
            "YP": {"name": "Mirae Asset Sekuritas", "type": "D"},
            "CC": {"name": "Mandiri Sekuritas", "type": "D"},
            "ZP": {"name": "Maybank Sekuritas Indonesia", "type": "F"},
            "BK": {"name": "J.P. Morgan Sekuritas", "type": "F"},
            "PD": {"name": "Indo Premier Sekuritas", "type": "D"},
            "NI": {"name": "BNI Sekuritas", "type": "D"},
            "CP": {"name": "KB Valbury Sekuritas", "type": "D"},
            "XC": {"name": "Ajaib Sekuritas Asia", "type": "D"},
            "GR": {"name": "Panin Sekuritas", "type": "D"},
            "SQ": {"name": "BCA Sekuritas", "type": "D"},
            "LG": {"name": "Trimegah Sekuritas Indonesia", "type": "D"},
            "DR": {"name": "RHB Sekuritas Indonesia", "type": "D"},
            "CS": {"name": "Credit Suisse Sekuritas", "type": "F"},
            "KZ": {"name": "CLSA Sekuritas Indonesia", "type": "F"},
            "RX": {"name": "Macquarie Sekuritas", "type": "F"},
            "CG": {"name": "CGS International Sekuritas", "type": "F"},
            "YU": {"name": "CIMB Sekuritas Indonesia", "type": "F"},
            "AI": {"name": "UOB Kay Hian Sekuritas", "type": "D"},
            "AG": {"name": "Kiwoom Sekuritas Indonesia", "type": "D"}
        }

        self.daily_limit_exceeded = False

    def generate_broker_summary(self, ticker: str, current_price: float = 5000.0, volume: int = 500000) -> dict:
        """
        Compatibility method for run_pipeline.py.
        Generates simulated broker data for wide market tickers without consuming external API quota.
        """
        return self._generate_synthetic(ticker, current_price, volume)

    def fetch_broker_summary(self, ticker: str, target_date: str = None) -> dict:
        """
        Fetch real broker summary from IndexAlpha API.
        Automatically resolves to the latest completed trading day if today's EOD is not yet published.
        """
        clean_ticker = ticker.replace(".JK", "").upper()
        if self.api_key and not self.daily_limit_exceeded:
            from datetime import timedelta
            if target_date:
                candidate_dates = [target_date]
            elif self.latest_valid_date:
                candidate_dates = [self.latest_valid_date]
            else:
                candidate_dates = []
                for d_offset in range(5):
                    cand = date.today() - timedelta(days=d_offset)
                    if cand.weekday() < 5:  # Monday to Friday
                        candidate_dates.append(cand.strftime("%Y-%m-%d"))

            for d in candidate_dates:
                try:
                    result = self._fetch_from_indexalpha(clean_ticker, d)
                    if result:
                        self.latest_valid_date = d
                        result["data_source"] = "live"
                        return result
                    if self.daily_limit_exceeded:
                        break
                except Exception as e:
                    logger.warning(f"IndexAlpha API failed for {clean_ticker} on {d}: {e}")
                    if self.daily_limit_exceeded:
                        break
        
        # Fallback to synthetic with clear label
        result = self._generate_synthetic(clean_ticker)
        result["data_source"] = "simulated"
        if self.daily_limit_exceeded:
            result["simulated_warning"] = "⚠ Data ini SIMULASI (IndexAlpha 5/day Free limit tercapai, reset jam 00:00 WIB)"
        else:
            result["simulated_warning"] = "⚠ Data ini SIMULASI, bukan data broker sesungguhnya"
        return result

    def _fetch_from_indexalpha(self, ticker: str, target_date: str) -> dict:
        """Fetch from IndexAlpha API with correct params per docs."""
        clean_ticker = ticker.replace(".JK", "").upper()
        url = f"{self.base_url}/broker-summary"
        params = {
            "ticker": clean_ticker,
            "from": target_date,
            "to": target_date,
            "investor": "all"
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "accept": "application/json"
        }
        response = requests.get(url, params=params, headers=headers, timeout=15)
        if response.status_code == 403:
            if "limit exceeded" in response.text.lower():
                logger.info("IndexAlpha daily limit reached (Free plan 5/day). Auto-switching to simulated for today.")
                self.daily_limit_exceeded = True
                return None
        response.raise_for_status()
        data = response.json()
        
        if not data.get("success") or not data.get("data"):
            logger.warning(f"IndexAlpha returned empty data for {clean_ticker}")
            return None
        
        # Parse API response into our existing schema
        # API returns: [{code, buy_freq, buy_volume, buy_value, sell_freq, sell_volume, sell_value, buy_avg, sell_avg}]
        rows = data["data"]
        
        # Sort by buy_value descending for top buyers
        sorted_by_buy = sorted(rows, key=lambda r: r.get("buy_value", 0), reverse=True)
        top_buyers = []
        for r in sorted_by_buy[:5]:
            broker_code = r.get("code", "??")
            broker_info = self.broker_names.get(broker_code, {"name": broker_code, "type": "D"})
            top_buyers.append({
                "broker": broker_code,
                "name": broker_info["name"],
                "type": broker_info["type"],
                "lots": r.get("buy_volume", 0) // 100,  # shares → lots
                "avg_price": r.get("buy_avg", 0),
                "value_idr": r.get("buy_value", 0),
                "freq": r.get("buy_freq", 0)
            })
        
        # Sort by sell_value descending for top sellers
        sorted_by_sell = sorted(rows, key=lambda r: r.get("sell_value", 0), reverse=True)
        top_sellers = []
        for r in sorted_by_sell[:5]:
            broker_code = r.get("code", "??")
            broker_info = self.broker_names.get(broker_code, {"name": broker_code, "type": "D"})
            top_sellers.append({
                "broker": broker_code,
                "name": broker_info["name"],
                "type": broker_info["type"],
                "lots": r.get("sell_volume", 0) // 100,
                "avg_price": r.get("sell_avg", 0),
                "value_idr": r.get("sell_value", 0),
                "freq": r.get("sell_freq", 0)
            })
        
        # Foreign net: sum buy_value - sell_value for foreign brokers
        foreign_net_val = 0
        for r in rows:
            broker_info = self.broker_names.get(r.get("code", ""), {})
            if broker_info.get("type") == "F":
                foreign_net_val += r.get("buy_value", 0) - r.get("sell_value", 0)
        
        # Metrics
        top3_buyers = top_buyers[:3]
        total_top3_lots = sum(b["lots"] for b in top3_buyers) or 1
        bandar_avg_price = round(sum(b["lots"] * b["avg_price"] for b in top3_buyers) / total_top3_lots, 0)
        top3_buyer_val = sum(b["value_idr"] for b in top3_buyers)
        top3_seller_val = sum(s["value_idr"] for s in top_sellers[:3]) or 1
        buyer_dominance_ratio = round(top3_buyer_val / top3_seller_val, 2)
        cr3 = round(top3_buyer_val / (sum(r.get("buy_value", 0) for r in rows) or 1) * 100, 1)
        
        accum_grade = "BIG_ACCUMULATION" if buyer_dominance_ratio > 1.5 else (
            "NORMAL_ACCUMULATION" if buyer_dominance_ratio > 1.0 else "DISTRIBUTION"
        )
        
        return {
            "ticker": clean_ticker,
            "date": target_date,
            "bandar_accumulation_grade": accum_grade,
            "cr3_percentage": cr3,
            "cr5_percentage": round(cr3 * 1.25, 1),
            "bandar_avg_price": bandar_avg_price,
            "buyer_dominance_ratio": buyer_dominance_ratio,
            "foreign_net_value_idr": foreign_net_val,
            "foreign_net_lots": int(foreign_net_val / (bandar_avg_price * 100)) if bandar_avg_price else 0,
            "top_buyers": top_buyers,
            "top_sellers": top_sellers,
            "summary_verdict": f"Bandar {accum_grade.replace('_', ' ')}: Top buyer {top_buyers[0]['broker']} ({top_buyers[0]['name']}) avg Rp {int(top_buyers[0]['avg_price']):,}"
        }

    def fetch_batch(self, tickers: list, target_date: str = None) -> dict:
        """Fetch multiple tickers. Uses batch API if available, else single calls."""
        if not target_date:
            target_date = date.today().strftime("%Y-%m-%d")
        
        results = {}
        
        # Try batch endpoint first (POST, consumes 1 quota per ticker)
        if self.api_key and len(tickers) > 1:
            try:
                clean_tickers = [t.replace(".JK", "").upper() for t in tickers]
                url = f"{self.base_url}/broker-summary/batch"
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "accept": "application/json"
                }
                body = {
                    "tickers": clean_tickers,
                    "from": target_date,
                    "to": target_date,
                    "investor": "all",
                    "market": "RG"
                }
                response = requests.post(url, json=body, headers=headers, timeout=30)
                response.raise_for_status()
                batch_data = response.json()
                
                if batch_data.get("success"):
                    # Batch response maps ticker → array of broker rows
                    for ticker_key, rows in batch_data.get("data", {}).items():
                        # Re-use single ticker parsing logic
                        mock_response = {"success": True, "data": rows}
                        # Parse each ticker's data
                        result = self._parse_broker_rows(ticker_key, rows, target_date)
                        if result:
                            result["data_source"] = "live"
                            results[ticker_key] = result
                    
                    # Fill missing tickers with synthetic
                    for t in tickers:
                        clean = t.replace(".JK", "").upper()
                        if clean not in results:
                            r = self._generate_synthetic(t)
                            r["data_source"] = "simulated"
                            r["simulated_warning"] = "⚠ Data ini SIMULASI"
                            results[clean] = r
                    
                    return results
            except Exception as e:
                logger.warning(f"IndexAlpha batch failed: {e}, falling back to single calls")
        
        # Fallback: single calls
        for ticker in tickers:
            results[ticker.replace(".JK", "").upper()] = self.fetch_broker_summary(ticker, target_date)
        return results

    def _parse_broker_rows(self, ticker: str, rows: list, target_date: str) -> dict:
        """Parse broker rows from API into our schema. Shared by single and batch."""
        if not rows:
            return None
        
        sorted_by_buy = sorted(rows, key=lambda r: r.get("buy_value", 0), reverse=True)
        top_buyers = []
        for r in sorted_by_buy[:5]:
            broker_code = r.get("code", "??")
            broker_info = self.broker_names.get(broker_code, {"name": broker_code, "type": "D"})
            top_buyers.append({
                "broker": broker_code, "name": broker_info["name"], "type": broker_info["type"],
                "lots": r.get("buy_volume", 0) // 100, "avg_price": r.get("buy_avg", 0),
                "value_idr": r.get("buy_value", 0), "freq": r.get("buy_freq", 0)
            })
        
        sorted_by_sell = sorted(rows, key=lambda r: r.get("sell_value", 0), reverse=True)
        top_sellers = []
        for r in sorted_by_sell[:5]:
            broker_code = r.get("code", "??")
            broker_info = self.broker_names.get(broker_code, {"name": broker_code, "type": "D"})
            top_sellers.append({
                "broker": broker_code, "name": broker_info["name"], "type": broker_info["type"],
                "lots": r.get("sell_volume", 0) // 100, "avg_price": r.get("sell_avg", 0),
                "value_idr": r.get("sell_value", 0), "freq": r.get("sell_freq", 0)
            })
        
        foreign_net_val = sum(
            (r.get("buy_value", 0) - r.get("sell_value", 0))
            for r in rows if self.broker_names.get(r.get("code", ""), {}).get("type") == "F"
        )
        
        top3 = top_buyers[:3]
        total_lots = sum(b["lots"] for b in top3) or 1
        bavg = round(sum(b["lots"] * b["avg_price"] for b in top3) / total_lots, 0)
        bdr = round(sum(b["value_idr"] for b in top3) / (sum(s["value_idr"] for s in top_sellers[:3]) or 1), 2)
        cr3 = round(sum(b["value_idr"] for b in top3) / (sum(r.get("buy_value", 0) for r in rows) or 1) * 100, 1)
        grade = "BIG_ACCUMULATION" if bdr > 1.5 else ("NORMAL_ACCUMULATION" if bdr > 1.0 else "DISTRIBUTION")
        
        return {
            "ticker": ticker, "date": target_date, "bandar_accumulation_grade": grade,
            "cr3_percentage": cr3, "cr5_percentage": round(cr3 * 1.25, 1),
            "bandar_avg_price": bavg, "buyer_dominance_ratio": bdr,
            "foreign_net_value_idr": foreign_net_val,
            "foreign_net_lots": int(foreign_net_val / (bavg * 100)) if bavg else 0,
            "top_buyers": top_buyers, "top_sellers": top_sellers,
            "summary_verdict": f"Bandar {grade.replace('_', ' ')}: Top buyer {top_buyers[0]['broker']} ({top_buyers[0]['name']}) avg Rp {int(top_buyers[0]['avg_price']):,}" if top_buyers else "No data"
        }

    def _generate_synthetic(self, ticker: str, current_price: float = 5000.0, volume: int = 500000) -> dict:
        """
        Menghasilkan struktur ringkasan broker komprehensif ala Stockbit / NeoBDM
        berbasis mikrostruktur harga riil dan volume transaksi bursa.
        """
        clean_ticker = ticker.replace(".JK", "").upper()
        p = float(current_price) if current_price else 5000.0
        
        # Karakteristik saham big caps vs second liners
        is_bluechip = clean_ticker in ["BBCA", "BBRI", "BMRI", "BBNI", "TLKM", "ASII"]
        is_conglo = clean_ticker in ["BREN", "TPIA", "BRPT", "CUAN", "PTRO", "AMMN", "MEDC"]
        
        def s(broker_code):
            return broker_code

        # Kalibrasi shares -> lots (1 lot = 100 shares)
        base_lots = max(100, int(volume // 100)) if volume > 500 else int(volume)

        if is_bluechip:
            # Foreign institutional heavy
            top_buyers = [
                {"broker": s("AK"), "name": "UBS Sekuritas", "type": "F", "lots": int(base_lots * 0.28), "avg_price": round(p - 15, 0), "value_idr": int(base_lots * 0.28 * 100 * (p - 15))},
                {"broker": s("YP"), "name": "Mirae Asset", "type": "D", "lots": int(base_lots * 0.22), "avg_price": round(p - 10, 0), "value_idr": int(base_lots * 0.22 * 100 * (p - 10))},
                {"broker": s("CC"), "name": "Mandiri Sekuritas", "type": "D", "lots": int(base_lots * 0.18), "avg_price": round(p - 5, 0), "value_idr": int(base_lots * 0.18 * 100 * (p - 5))},
                {"broker": s("ZP"), "name": "Maybank Sekuritas", "type": "F", "lots": int(base_lots * 0.12), "avg_price": round(p, 0), "value_idr": int(base_lots * 0.12 * 100 * p)},
                {"broker": s("BK"), "name": "J.P. Morgan", "type": "F", "lots": int(base_lots * 0.08), "avg_price": round(p - 20, 0), "value_idr": int(base_lots * 0.08 * 100 * (p - 20))}
            ]
            top_sellers = [
                {"broker": s("PD"), "name": "Indo Premier", "type": "D", "lots": int(base_lots * 0.16), "avg_price": round(p + 10, 0), "value_idr": int(base_lots * 0.16 * 100 * (p + 10))},
                {"broker": s("NI"), "name": "BNI Sekuritas", "type": "D", "lots": int(base_lots * 0.13), "avg_price": round(p + 5, 0), "value_idr": int(base_lots * 0.13 * 100 * (p + 5))},
                {"broker": s("CP"), "name": "KB Valbury", "type": "D", "lots": int(base_lots * 0.09), "avg_price": round(p + 15, 0), "value_idr": int(base_lots * 0.09 * 100 * (p + 15))},
                {"broker": s("XC"), "name": "Ajaib Sekuritas", "type": "D", "lots": int(base_lots * 0.08), "avg_price": round(p + 5, 0), "value_idr": int(base_lots * 0.08 * 100 * (p + 5))},
                {"broker": s("GR"), "name": "Panin Sekuritas", "type": "D", "lots": int(base_lots * 0.06), "avg_price": round(p + 20, 0), "value_idr": int(base_lots * 0.06 * 100 * (p + 20))}
            ]
            cr3 = 68.0
            accum_grade = "BIG_ACCUMULATION"
            foreign_net_val = int(sum(b["value_idr"] for b in top_buyers if b["type"] == "F") - sum(sell["value_idr"] for sell in top_sellers if sell["type"] == "F"))
        elif is_conglo:
            # Domestic market maker heavy
            top_buyers = [
                {"broker": s("CC"), "name": "Mandiri Sekuritas", "type": "D", "lots": int(base_lots * 0.32), "avg_price": round(p * 0.992, 0), "value_idr": int(base_lots * 0.32 * 100 * (p * 0.992))},
                {"broker": s("LG"), "name": "Trimegah Sekuritas", "type": "D", "lots": int(base_lots * 0.25), "avg_price": round(p * 0.995, 0), "value_idr": int(base_lots * 0.25 * 100 * (p * 0.995))},
                {"broker": s("AI"), "name": "UOB Kay Hian", "type": "D", "lots": int(base_lots * 0.15), "avg_price": round(p, 0), "value_idr": int(base_lots * 0.15 * 100 * p)},
                {"broker": s("AK"), "name": "UBS Sekuritas", "type": "F", "lots": int(base_lots * 0.10), "avg_price": round(p * 0.998, 0), "value_idr": int(base_lots * 0.10 * 100 * (p * 0.998))},
                {"broker": s("SQ"), "name": "BCA Sekuritas", "type": "D", "lots": int(base_lots * 0.07), "avg_price": round(p * 0.990, 0), "value_idr": int(base_lots * 0.07 * 100 * (p * 0.990))}
            ]
            top_sellers = [
                {"broker": s("YP"), "name": "Mirae Asset", "type": "D", "lots": int(base_lots * 0.19), "avg_price": round(p * 1.008, 0), "value_idr": int(base_lots * 0.19 * 100 * (p * 1.008))},
                {"broker": s("PD"), "name": "Indo Premier", "type": "D", "lots": int(base_lots * 0.14), "avg_price": round(p * 1.005, 0), "value_idr": int(base_lots * 0.14 * 100 * (p * 1.005))},
                {"broker": s("XC"), "name": "Ajaib Sekuritas", "type": "D", "lots": int(base_lots * 0.11), "avg_price": round(p * 1.002, 0), "value_idr": int(base_lots * 0.11 * 100 * (p * 1.002))},
                {"broker": s("CP"), "name": "KB Valbury", "type": "D", "lots": int(base_lots * 0.07), "avg_price": round(p * 1.010, 0), "value_idr": int(base_lots * 0.07 * 100 * (p * 1.010))},
                {"broker": s("NI"), "name": "BNI Sekuritas", "type": "D", "lots": int(base_lots * 0.05), "avg_price": round(p * 1.004, 0), "value_idr": int(base_lots * 0.05 * 100 * (p * 1.004))}
            ]
            cr3 = 72.0
            accum_grade = "BIG_ACCUMULATION"
            foreign_net_val = int(sum(b["value_idr"] for b in top_buyers if b["type"] == "F") - sum(sell["value_idr"] for sell in top_sellers if sell["type"] == "F"))
        else:
            # Balanced flow
            top_buyers = [
                {"broker": s("YP"), "name": "Mirae Asset", "type": "D", "lots": int(base_lots * 0.20), "avg_price": round(p * 0.995, 0), "value_idr": int(base_lots * 0.20 * 100 * (p * 0.995))},
                {"broker": s("CC"), "name": "Mandiri Sekuritas", "type": "D", "lots": int(base_lots * 0.16), "avg_price": round(p, 0), "value_idr": int(base_lots * 0.16 * 100 * p)},
                {"broker": s("PD"), "name": "Indo Premier", "type": "D", "lots": int(base_lots * 0.14), "avg_price": round(p * 0.992, 0), "value_idr": int(base_lots * 0.14 * 100 * (p * 0.992))},
                {"broker": s("AK"), "name": "UBS Sekuritas", "type": "F", "lots": int(base_lots * 0.08), "avg_price": round(p * 0.998, 0), "value_idr": int(base_lots * 0.08 * 100 * (p * 0.998))},
                {"broker": s("NI"), "name": "BNI Sekuritas", "type": "D", "lots": int(base_lots * 0.06), "avg_price": round(p * 0.990, 0), "value_idr": int(base_lots * 0.06 * 100 * (p * 0.990))}
            ]
            top_sellers = [
                {"broker": s("XC"), "name": "Ajaib Sekuritas", "type": "D", "lots": int(base_lots * 0.18), "avg_price": round(p * 1.005, 0), "value_idr": int(base_lots * 0.18 * 100 * (p * 1.005))},
                {"broker": s("GR"), "name": "Panin Sekuritas", "type": "D", "lots": int(base_lots * 0.14), "avg_price": round(p * 1.002, 0), "value_idr": int(base_lots * 0.14 * 100 * (p * 1.002))},
                {"broker": s("CP"), "name": "KB Valbury", "type": "D", "lots": int(base_lots * 0.11), "avg_price": round(p * 1.008, 0), "value_idr": int(base_lots * 0.11 * 100 * (p * 1.010))},
                {"broker": s("DR"), "name": "RHB Sekuritas", "type": "D", "lots": int(base_lots * 0.08), "avg_price": round(p * 1.003, 0), "value_idr": int(base_lots * 0.08 * 100 * (p * 1.003))},
                {"broker": s("AG"), "name": "Kiwoom Sekuritas", "type": "D", "lots": int(base_lots * 0.05), "avg_price": round(p * 1.006, 0), "value_idr": int(base_lots * 0.05 * 100 * (p * 1.006))}
            ]
            cr3 = 50.0
            accum_grade = "NORMAL_ACCUMULATION"
            foreign_net_val = int(sum(b["value_idr"] for b in top_buyers if b["type"] == "F") - sum(sell["value_idr"] for sell in top_sellers if sell["type"] == "F"))

        # Calculate Bandar Average Price (Weighted Average Price of Top 3 Buyers)
        top3_buyers = top_buyers[:3]
        total_top3_lots = sum(b["lots"] for b in top3_buyers) or 1
        bandar_avg_price = round(sum(b["lots"] * b["avg_price"] for b in top3_buyers) / total_top3_lots, 0)
        
        # Calculate Buyer Dominance Ratio (Value top 3 buyers / Value top 3 sellers)
        top3_buyer_val = sum(b["value_idr"] for b in top3_buyers)
        top3_seller_val = sum(sell["value_idr"] for sell in top_sellers[:3]) or 1
        buyer_dominance_ratio = round(top3_buyer_val / top3_seller_val, 2)

        return {
            "ticker": clean_ticker,
            "ref_price": p,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "bandar_accumulation_grade": accum_grade,
            "cr3_percentage": cr3,
            "cr5_percentage": round(cr3 * 1.25, 1),
            "bandar_avg_price": bandar_avg_price,
            "buyer_dominance_ratio": buyer_dominance_ratio,
            "foreign_net_value_idr": foreign_net_val,
            "foreign_net_lots": int(foreign_net_val / (p * 100)) if p else 0,
            "top_buyers": top_buyers,
            "top_sellers": top_sellers,
            "summary_verdict": f"Bandar {accum_grade.replace('_', ' ')}: Akumulasi top buyers didominasi oleh {top_buyers[0]['broker']} ({top_buyers[0]['name']}) pada harga rata-rata Rp {int(bandar_avg_price):,}."
        }

if __name__ == "__main__":
    fetcher = BrokerSummaryFetcher()
    bbca = fetcher.fetch_broker_summary("BBCA")
    print("Sample BBCA Broker Summary:")
    print(json.dumps(bbca, indent=2))
