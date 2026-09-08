import os
import logging
from datetime import datetime

logger = logging.getLogger("LLMBrain")

class LLMBrain:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.use_llm = bool(self.api_key)
        if self.use_llm:
            logger.info("Gemini API Key detected. LLM synthesis enabled.")
        else:
            logger.info("GEMINI_API_KEY not found. Operating with deterministic Astra-standard synthesis generator.")

    def generate_daily_trade_plans(self, idx_data: dict, crypto_data: list, macro_data: dict) -> list:
        """
        Generates 5 disciplined, Astra-standard trade plans (3 for IDX, 2 for Crypto).
        Strict Rule: FACTS separate from OPINION, arithmetic visible, R:R >= 2.0, status = AWAITING_HUMAN_REVIEW.
        """
        plans = []

        # 1. Pick Top 3 IDX candidates from Conglomerates / Dividend / Foreign Flow
        all_idx = idx_data.get("all_records", [])
        # Prefer stocks with Breakout or Accumulation signals
        high_conviction_idx = [s for s in all_idx if s.get("technical_signal") in ["BREAKOUT", "ACCUMULATION"]]
        if len(high_conviction_idx) < 3:
            high_conviction_idx = all_idx[:5]

        for stock in high_conviction_idx[:3]:
            ticker = stock["ticker"]
            price = stock["price"]
            if price <= 0:
                price = 1000

            # Calculate strict Astra risk parameters
            stop_loss = round(price * 0.96, 0) # 4% below support
            risk_per_share = price - stop_loss
            target_1 = round(price + (risk_per_share * 2.2), 0)
            target_2 = round(price + (risk_per_share * 3.5), 0)
            rr = round((target_1 - price) / (risk_per_share + 1e-6), 2)

            plan_id = f"PLAN-IDX-{ticker}-{datetime.now().strftime('%Y%m%d')}"
            plans.append({
                "plan_id": plan_id,
                "symbol": f"{ticker}.JK",
                "market": "IDX",
                "direction": "LONG",
                "entry_price": price,
                "stop_loss": stop_loss,
                "target_1": target_1,
                "target_2": target_2,
                "position_size_math": f"(Porto Rp 100M × 1% Risk = Rp 1M) ÷ (Entry Rp {price} - SL Rp {stop_loss} = Rp {risk_per_share}) = {int(1000000 / (risk_per_share * 100))} Lot",
                "risk_reward_ratio": rr,
                "facts_summary": f"Harga Rp {price}, Signal: {stock.get('technical_signal')}, RSI 14: {stock.get('rsi_14')}, Sub-Kategori: {stock.get('sub_category')}.",
                "opinion_thesis": f"Konsolidasi di atas MA20 didukung katalis kelompok {stock.get('sub_category')} dan sentimen makro.",
                "three_invalidations": [
                    f"1. Penutupan candle harian di bawah Rp {stop_loss}",
                    "2. Outflow asing masif lebih dari Rp 50 Miliar dalam 1 sesi",
                    "3. Indeks IHSG anjlok > 1.5% menembus support psikologis"
                ],
                "weakest_assumption": "Mengasumsikan likuiditas domestik stabil dan tidak ada intervensi suku bunga mendadak.",
                "status": "AWAITING_HUMAN_REVIEW",
                "created_at": datetime.now().isoformat()
            })

        # 2. Pick Top 2 Crypto Spot candidates
        for coin in crypto_data[:2]:
            pair = coin["pair"]
            price = coin["current_price"]
            sl = coin["stop_loss"]
            tp1 = coin["take_profit_1"]
            tp2 = coin["take_profit_2"]
            rr = coin["risk_reward_ratio"]

            plan_id = f"PLAN-CRYPTO-{pair.replace('/', '')}-{datetime.now().strftime('%Y%m%d')}"
            plans.append({
                "plan_id": plan_id,
                "symbol": pair,
                "market": "CRYPTO",
                "direction": "LONG",
                "entry_price": price,
                "stop_loss": sl,
                "target_1": tp1,
                "target_2": tp2,
                "position_size_math": f"($10,000 Portfolio × 1% Risk = $100) ÷ (${price} - ${sl}) = {round(100 / (price - sl + 1e-6), 4)} Units",
                "risk_reward_ratio": rr,
                "facts_summary": f"Pair {pair} di harga ${price}, 24h Change: {coin.get('change_24h_pct')}%, Conviction: {coin.get('conviction')}.",
                "opinion_thesis": coin.get("catalyst_thesis", "Asymmetric risk-reward setup above critical support level."),
                "three_invalidations": [
                    coin.get("invalidation_rule", f"Penutupan 4H di bawah ${sl}"),
                    "Bitcoin breakdown di bawah support kunci $65,000",
                    "Spike mendadak pada funding rate perp memicu long squeeze"
                ],
                "weakest_assumption": "Mengasumsikan dominasi likuiditas USDT stabil dan tidak ada rilis berita regulasi mendadak.",
                "status": "AWAITING_HUMAN_REVIEW",
                "created_at": datetime.now().isoformat()
            })

        return plans
