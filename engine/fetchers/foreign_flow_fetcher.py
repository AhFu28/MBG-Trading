import os
import json
import logging
import urllib.request
from datetime import datetime, date, timedelta

logger = logging.getLogger(__name__)

class ForeignFlowFetcher:
    def __init__(self):
        self.goapi_key = os.getenv("GOAPI_KEY", "")
        self.indexalpha_key = os.getenv("INDEX_ALPHA_API_KEY", "")
        self.goapi_limit_exceeded = False
        self.indexalpha_limit_exceeded = False
        
        # Load broker codes for GOAPI if needed to identify foreign brokers
        self.foreign_brokers = {"AK", "ZP", "BK", "CS", "KZ", "RX", "CG", "YU"}

    def _get_target_date(self):
        # returns string YYYY-MM-DD of latest weekday
        d = date.today()
        if d.weekday() >= 5: # 5=Sat, 6=Sun
            d = d - timedelta(days=d.weekday() - 4)
        return d.strftime("%Y-%m-%d")

    def fetch_foreign_flow(self, ticker: str, current_price: float, volume: int, change_pct: float) -> dict:
        """
        Fetch real foreign flow data with fallbacks.
        Returns dict matching required format.
        """
        clean_ticker = ticker.replace(".JK", "").upper()
        target_date = self._get_target_date()

        # 1. Try GOAPI first (if key exists)
        if self.goapi_key and not self.goapi_limit_exceeded:
            try:
                result = self._fetch_goapi(clean_ticker, target_date)
                if result:
                    return result
            except Exception as e:
                logger.warning(f"GOAPI fetch failed for {clean_ticker}: {e}")

        # 2. Try IndexAlpha as fallback (existing code behavior)
        if self.indexalpha_key and not self.indexalpha_limit_exceeded:
            try:
                result = self._fetch_indexalpha(clean_ticker, target_date)
                if result:
                    return result
            except Exception as e:
                logger.warning(f"IndexAlpha fetch failed for {clean_ticker}: {e}")

        # 3. Fallback to TradingView heuristic
        return self._fetch_estimated(clean_ticker, current_price, volume, change_pct)

    def _fetch_goapi(self, ticker: str, target_date: str) -> dict:
        url = f"https://api.goapi.io/stock/idx/broker-summary?ticker={ticker}&date={target_date}"
        req = urllib.request.Request(url, headers={"Authorization": self.goapi_key, "accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=5) as res:
                if res.status == 200:
                    data = json.loads(res.read().decode("utf-8"))
                    if data.get("status") == "success" and "data" in data:
                        rows = data.get("data", [])
                        foreign_buy = 0
                        foreign_sell = 0
                        for row in rows:
                            broker = row.get("broker_code", row.get("broker", ""))
                            # Some APIs already mark 'type' as 'F' or 'D'
                            # If not, fallback to our known list
                            b_type = row.get("type", "D")
                            if b_type == "F" or broker in self.foreign_brokers:
                                foreign_buy += float(row.get("buy_val", row.get("buy_value", 0)))
                                foreign_sell += float(row.get("sell_val", row.get("sell_value", 0)))
                        
                        return {
                            "ticker": ticker,
                            "foreign_buy_val": foreign_buy,
                            "foreign_sell_val": foreign_sell,
                            "foreign_net_val_idr": foreign_buy - foreign_sell,
                            "data_source": "goapi"
                        }
                elif res.status == 403:
                    self.goapi_limit_exceeded = True
        except Exception as e:
            if hasattr(e, 'code') and e.code == 403:
                self.goapi_limit_exceeded = True
            raise e
        return None

    def _fetch_indexalpha(self, ticker: str, target_date: str) -> dict:
        url = f"https://api.indexalpha.id/stocks/broker-summary?ticker={ticker}&from={target_date}&to={target_date}&investor=all"
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {self.indexalpha_key}", "accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=5) as res:
                if res.status == 200:
                    data = json.loads(res.read().decode("utf-8"))
                    if data.get("success") and data.get("data"):
                        rows = data["data"]
                        foreign_buy = 0
                        foreign_sell = 0
                        for row in rows:
                            broker_code = row.get("code", "")
                            # Hardcoded broker checks matching BrokerSummaryFetcher
                            is_foreign = broker_code in {"AK", "ZP", "BK", "CS", "KZ", "RX", "CG", "YU"}
                            if is_foreign:
                                foreign_buy += float(row.get("buy_value", 0))
                                foreign_sell += float(row.get("sell_value", 0))
                        
                        return {
                            "ticker": ticker,
                            "foreign_buy_val": foreign_buy,
                            "foreign_sell_val": foreign_sell,
                            "foreign_net_val_idr": foreign_buy - foreign_sell,
                            "data_source": "indexalpha"
                        }
        except Exception as e:
            if hasattr(e, 'code') and e.code == 403:
                self.indexalpha_limit_exceeded = True
            raise e
        return None

    def _fetch_estimated(self, ticker: str, current_price: float, volume: int, change_pct: float) -> dict:
        est_flow = round((current_price * volume * (change_pct / 100)) * 0.35, 0)
        
        # We don't have real buy/sell for estimation, so we make a synthetic one
        # that satisfies net value
        abs_est = abs(est_flow)
        base_val = (current_price * volume) * 0.2 # assume 20% of total val is foreign
        
        if est_flow > 0:
            f_buy = base_val + est_flow
            f_sell = base_val
        else:
            f_buy = base_val
            f_sell = base_val + abs_est
            
        return {
            "ticker": ticker,
            "foreign_buy_val": f_buy,
            "foreign_sell_val": f_sell,
            "foreign_net_val_idr": est_flow,
            "data_source": "estimated"
        }
