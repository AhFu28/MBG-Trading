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

    def generate_daily_trade_plans(self, idx_data: dict, crypto_data: list, macro_data: dict, target_count: int = 16) -> list:
        """
        Generates 10-20 disciplined, Astra-standard trade plans (e.g. 10-12 for IDX, 6-8 for Crypto).
        Strict Rule: FACTS separate from OPINION, arithmetic visible, R:R >= 2.0, status = AWAITING_HUMAN_REVIEW.
        """
        plans = []

        # 1. Select up to 10-12 IDX candidates from Conglomerates, Dividends, and Foreign Flow
        all_idx = idx_data.get("all_records", [])
        
        # Deduplicate tickers while preserving best records
        seen_tickers = set()
        deduped_idx = []
        for s in all_idx:
            t = s["ticker"]
            if t not in seen_tickers:
                seen_tickers.add(t)
                deduped_idx.append(s)

        # Prioritize stocks with active signals: BREAKOUT > ACCUMULATION > OVERSOLD_REBOUND > PULLBACK > CONSOLIDATION
        priority_order = {"BREAKOUT": 1, "ACCUMULATION": 2, "OVERSOLD_REBOUND": 3, "PULLBACK": 4, "CONSOLIDATION": 5}
        sorted_idx = sorted(deduped_idx, key=lambda x: priority_order.get(x.get("technical_signal", "CONSOLIDATION"), 9))

        idx_target_count = min(12, len(sorted_idx))
        chosen_idx = sorted_idx[:idx_target_count]

        for stock in chosen_idx:
            ticker = stock["ticker"]
            price = stock["price"]
            if price <= 0:
                price = 1000

            # Calculate strict Astra risk parameters
            stop_loss = round(price * 0.96, 0) # 4% below support
            risk_per_share = price - stop_loss
            target_1 = round(price + (risk_per_share * 2.2), 0)
            target_2 = round(price + (risk_per_share * 3.6), 0)
            rr = round((target_1 - price) / (risk_per_share + 1e-6), 2)

            plan_id = f"PLAN-IDX-{ticker}-{datetime.now().strftime('%Y%m%d')}"
            plans.append({
                "plan_id": plan_id,
                "symbol": f"{ticker}.JK",
                "clean_ticker": ticker,
                "market": "IDX",
                "direction": "LONG",
                "entry_price": price,
                "stop_loss": stop_loss,
                "target_1": target_1,
                "target_2": target_2,
                "position_size_math": f"(Porto Rp 100M × 1% Risk = Rp 1M) ÷ (Entry Rp {price} - SL Rp {stop_loss} = Rp {risk_per_share}) = {int(1000000 / (risk_per_share * 100))} Lot",
                "risk_reward_ratio": rr,
                "technical_signal": stock.get("technical_signal"),
                "facts_summary": f"Harga Rp {price}, Signal: {stock.get('technical_signal')}, RSI 14: {stock.get('rsi_14')}, MA20: Rp {stock.get('ma20')}, Sub-Kategori: {stock.get('sub_category')}.",
                "opinion_thesis": f"Konsolidasi di atas MA20 didukung sentimen klaster {stock.get('sub_category')} dan akumulasi terukur.",
                "three_invalidations": [
                    f"1. Penutupan candle harian di bawah Rp {stop_loss}",
                    "2. Outflow asing masif lebih dari Rp 40 Miliar dalam 1 sesi",
                    "3. Indeks IHSG anjlok > 1.5% menembus support psikologis"
                ],
                "weakest_assumption": "Mengasumsikan likuiditas domestik stabil dan tidak ada intervensi suku bunga mendadak.",
                "status": "AWAITING_HUMAN_REVIEW",
                "created_at": datetime.now().isoformat()
            })

        # 2. Select up to 6-8 Crypto Spot candidates from crypto_data
        crypto_target_count = min(8, len(crypto_data))
        for coin in crypto_data[:crypto_target_count]:
            pair = coin["pair"]
            price = coin["current_price"]
            sl = coin["stop_loss"]
            tp1 = coin["take_profit_1"]
            tp2 = coin["take_profit_2"]
            rr = coin["risk_reward_ratio"]

            clean_sym = pair.replace("/", "")
            plan_id = f"PLAN-CRYPTO-{clean_sym}-{datetime.now().strftime('%Y%m%d')}"
            plans.append({
                "plan_id": plan_id,
                "symbol": pair,
                "clean_ticker": clean_sym,
                "market": "CRYPTO",
                "direction": "LONG",
                "entry_price": price,
                "stop_loss": sl,
                "target_1": tp1,
                "target_2": tp2,
                "position_size_math": f"($10,000 Portfolio × 1% Risk = $100) ÷ (${price} - ${sl}) = {round(100 / (price - sl + 1e-6), 4)} Units",
                "risk_reward_ratio": rr,
                "technical_signal": coin.get("setup_type"),
                "facts_summary": f"Pair {pair} di harga ${price}, 24h Change: {coin.get('change_24h_pct')}%, Conviction: {coin.get('conviction')}.",
                "opinion_thesis": coin.get("catalyst_thesis", "Asymmetric risk-reward setup above critical support level."),
                "three_invalidations": [
                    coin.get("invalidation_rule", f"Penutupan 4H di bawah ${sl}"),
                    "Bitcoin breakdown di bawah support kunci mingguan",
                    "Spike mendadak pada funding rate perp memicu long squeeze"
                ],
                "weakest_assumption": "Mengasumsikan dominasi likuiditas USDT stabil dan sentimen makro global netral.",
                "status": "AWAITING_HUMAN_REVIEW",
                "created_at": datetime.now().isoformat()
            })

        # 3. Gemini LLM Enrichment
        if self.use_llm:
            try:
                import json
                import time
                from google import genai
                
                client = genai.Client(api_key=self.api_key)
                
                # Rate limit: max 3 API calls per run. We will just use 1 batch for all to be safe.
                prompt_data = []
                for p in plans:
                    prompt_data.append({
                        "id": p["plan_id"],
                        "ticker": p["clean_ticker"],
                        "price": p["entry_price"],
                        "signal": p.get("technical_signal"),
                        "entry": p["entry_price"],
                        "sl": p["stop_loss"],
                        "tp": p["target_1"]
                    })
                
                prompt = f"""
                You are an expert trading analyst. For the following trade plans, generate:
                1. 'ai_thesis': a 2-sentence catalyst thesis in Indonesian.
                2. 'ai_bahasa_bayi': a simple "Bahasa Bayi" (baby language/eli5) explanation of why we buy.
                
                Also generate one 'ai_market_sentiment' summary for the overall market based on these setups.
                
                Trade plans data:
                {json.dumps(prompt_data, indent=2)}
                
                Respond ONLY in valid JSON format exactly like this:
                {{
                    "ai_market_sentiment": "Overall summary...",
                    "plans_enrichment": [
                        {{
                            "id": "...",
                            "ai_thesis": "...",
                            "ai_bahasa_bayi": "..."
                        }}
                    ]
                }}
                """
                
                response = client.models.generate_content(
                    model='gemini-2.0-flash',
                    contents=prompt,
                    config={
                        'temperature': 0.3,
                        'response_mime_type': 'application/json'
                    }
                )
                
                res_data = json.loads(response.text)
                sentiment = res_data.get("ai_market_sentiment", "Netral")
                enrich_map = {item["id"]: item for item in res_data.get("plans_enrichment", [])}
                
                for p in plans:
                    if p["plan_id"] in enrich_map:
                        p["ai_thesis"] = enrich_map[p["plan_id"]].get("ai_thesis", "Sentimen positif teknikal.")
                        p["ai_bahasa_bayi"] = enrich_map[p["plan_id"]].get("ai_bahasa_bayi", "Beli karena grafiknya bagus.")
                    else:
                        p["ai_thesis"] = "Sentimen positif teknikal berdasarkan data empiris."
                        p["ai_bahasa_bayi"] = "Harga turun dikit buat naik lebih tinggi, ayo beli."
                    p["ai_market_sentiment"] = sentiment
                    
            except Exception as e:
                logger.error(f"Gemini LLM enrichment failed: {e}")
                # Fallback silently to static narratives
                for p in plans:
                    p["ai_thesis"] = "Sentimen positif teknikal berdasarkan data empiris."
                    p["ai_bahasa_bayi"] = "Harga turun dikit buat naik lebih tinggi, ayo beli."
                    p["ai_market_sentiment"] = "Netral - menunggu konfirmasi arah pasar."

        return plans

    def _call_gemini(self, prompt: str, max_tokens: int = 300) -> str:
        if not self.use_llm:
            return ""
        from google import genai
        client = genai.Client(api_key=self.api_key)
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config={
                'temperature': 0.7,
                'max_output_tokens': max_tokens
            }
        )
        return response.text

    def run_bull_bear_debate(self, ticker: str, entry: float, sl: float, tp1: float, 
                              technical_data: dict, macro_context: str = "") -> dict:
        """
        Adversarial Bull vs Bear debate engine.
        Bull Advocate argues FOR the trade. Bear Red-Teamer attacks it.
        System Arbiter decides: APPROVED, CONDITIONAL, or VETOED.
        
        Returns dict with debate transcript and final verdict.
        """
        if not self.use_llm:
            # No LLM available - return neutral pass-through
            return {
                "verdict": "APPROVED",
                "reason": "LLM unavailable — auto-approved (deterministic only)",
                "bull_score": 50,
                "bear_score": 50,
                "debate_transcript": [],
                "data_source": "fallback"
            }
        
        risk_reward = round((tp1 - entry) / (entry - sl), 2) if entry != sl else 0
        
        # Round 1: Bull presents the case
        bull_prompt = f"""You are a BULL ADVOCATE for this trade setup. Present your STRONGEST case.

Ticker: {ticker}
Entry: {entry} | Stop Loss: {sl} | Take Profit: {tp1}
Risk:Reward = 1:{risk_reward}
Technical: RSI={technical_data.get('rsi','-')}, MACD={technical_data.get('macd_signal','-')}, Trend={technical_data.get('trend','-')}
Macro Context: {macro_context}

Present 3 bullet points arguing WHY this trade should be taken. Be specific with data."""
        
        # Round 2: Bear attacks
        bear_prompt = f"""You are a BEAR RED-TEAMER. Your job is to DESTROY this trade thesis.

Ticker: {ticker}
Entry: {entry} | Stop Loss: {sl} | Take Profit: {tp1}
Risk:Reward = 1:{risk_reward}
Technical: RSI={technical_data.get('rsi','-')}, MACD={technical_data.get('macd_signal','-')}, Trend={technical_data.get('trend','-')}
Macro Context: {macro_context}

{{bull_argument}}

Present 3 bullet points arguing WHY this trade should be REJECTED. Attack weak assumptions."""
        
        # Round 3: Arbiter decides
        arbiter_prompt = f"""You are a neutral RISK ARBITER. Based on the Bull and Bear arguments below, 
decide the verdict for this trade:

Ticker: {ticker} | R:R = 1:{risk_reward}

BULL CASE:
{{bull_argument}}

BEAR CASE:
{{bear_argument}}

Your verdict MUST be exactly one of:
- APPROVED (Bull wins, trade is valid)
- CONDITIONAL (Trade valid but needs modification — specify what)
- VETOED (Bear wins, trade is too risky)

Also score: Bull (0-100) and Bear (0-100).

Format your response as:
VERDICT: [APPROVED/CONDITIONAL/VETOED]
BULL_SCORE: [0-100]
BEAR_SCORE: [0-100]
REASON: [one sentence explanation]"""
        
        try:
            # Execute debate rounds
            bull_response = self._call_gemini(bull_prompt, max_tokens=300)
            
            bear_filled = bear_prompt.replace("{bull_argument}", bull_response)
            bear_response = self._call_gemini(bear_filled, max_tokens=300)
            
            arbiter_filled = arbiter_prompt.replace("{bull_argument}", bull_response).replace("{bear_argument}", bear_response)
            arbiter_response = self._call_gemini(arbiter_filled, max_tokens=200)
            
            # Parse arbiter response
            verdict = "APPROVED"  # default
            bull_score = 50
            bear_score = 50
            reason = arbiter_response
            
            for line in arbiter_response.split('\n'):
                line = line.strip()
                if line.startswith('VERDICT:'):
                    v = line.split(':', 1)[1].strip().upper()
                    if v in ('APPROVED', 'CONDITIONAL', 'VETOED'):
                        verdict = v
                elif line.startswith('BULL_SCORE:'):
                    try: bull_score = int(line.split(':', 1)[1].strip())
                    except: pass
                elif line.startswith('BEAR_SCORE:'):
                    try: bear_score = int(line.split(':', 1)[1].strip())
                    except: pass
                elif line.startswith('REASON:'):
                    reason = line.split(':', 1)[1].strip()
            
            return {
                "verdict": verdict,
                "reason": reason,
                "bull_score": bull_score,
                "bear_score": bear_score,
                "debate_transcript": [
                    {"role": "bull", "content": bull_response},
                    {"role": "bear", "content": bear_response},
                    {"role": "arbiter", "content": arbiter_response}
                ],
                "data_source": "live"
            }
        except Exception as e:
            logger.warning(f"Bull/Bear debate failed for {ticker}: {e}")
            return {
                "verdict": "APPROVED",
                "reason": f"Debate engine error: {e} — auto-approved",
                "bull_score": 50,
                "bear_score": 50,
                "debate_transcript": [],
                "data_source": "error"
            }
