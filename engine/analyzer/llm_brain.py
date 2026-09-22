import os
import re
import time
import json
import logging
from datetime import datetime, timezone

logger = logging.getLogger("LLMBrain")

# Ensure .env is loaded even if run as standalone script
env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
if os.path.exists(env_file):
    try:
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip('"').strip("'")
                    if k not in os.environ:
                        os.environ[k] = v
    except Exception as e:
        logger.debug(f"Failed to load .env manually: {e}")


def parse_model_score(model_id: str) -> int:
    """
    Computes a semantic priority score for any Gemini model identifier.
    Automatically prioritizes Gemini 4 > Gemini 3.8 > Gemini 3.7 > Gemini 3.6 > Gemini 3.5 > Gemini 3.1 > Gemini 2.x.
    Flash is scored slightly below Pro within the same generation.
    """
    name = model_id.replace("models/", "").lower()
    
    # Check for direct major/minor regex (e.g. gemini-4-flash, gemini-3.8-pro, gemini-3.6-flash)
    m = re.search(r"gemini-(\d+)(?:\.(\d+))?-(flash|pro)(?:-preview|-latest)?", name)
    if m:
        major = int(m.group(1))
        minor = int(m.group(2)) if m.group(2) else 0
        variant = m.group(3)
        variant_score = 10 if variant == "pro" else 0
        return major * 1000 + minor * 100 + variant_score

    # Check for aliases e.g. gemini-flash-latest, gemini-pro-latest
    if "gemini-pro-latest" in name:
        return 3595
    if "gemini-flash-latest" in name:
        return 3590
    if "gemini" in name:
        return 1000
    return 0


class LLMBrain:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.use_llm = bool(self.api_key)
        
        self.discovered_models = []
        self.discovered_at = None
        self.dynamic_discovery_active = False

        # Default fallback cascade in case API listing fails
        self.default_cascade = [
            "gemini-4-flash",
            "gemini-4-pro",
            "gemini-3.8-flash",
            "gemini-3.8-pro",
            "gemini-3.7-flash",
            "gemini-3.6-flash",
            "gemini-3.5-flash",
            "gemini-flash-latest"
        ]

        self.last_diagnostics = {
            "model": "NONE",
            "latency_ms": 0,
            "status": "INITIALIZED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "mode": "IDLE"
        }

        # 1. Discover models dynamically from Google API endpoint runtime
        if self.use_llm:
            self._discover_and_rank_models()
        else:
            self.fast_model = "gemini-3.8-flash"
            self.reasoning_model = "gemini-3.8-pro"
            self.candidate_models = self.default_cascade
            self.model_name = self.fast_model
            logger.info("GEMINI_API_KEY not found. Operating with deterministic Astra-standard synthesis generator.")

    def _discover_and_rank_models(self):
        """
        Dynamically queries Google Gemini REST API to fetch available models in the user's account.
        Ranks models by generation (Gemini 4 > 3.8 > 3.6 > etc.) and assigns fast and reasoning tiers.
        """
        try:
            import requests
            url = f"https://generativelanguage.googleapis.com/v1beta/models?key={self.api_key}"
            res = requests.get(url, timeout=6)
            if res.status_code == 200:
                data = res.json()
                raw_models = [
                    m["name"].replace("models/", "")
                    for m in data.get("models", [])
                    if "generateContent" in m.get("supportedGenerationMethods", [])
                ]
                gemini_models = [m for m in raw_models if "gemini" in m]
                
                # Sort by semantic generation score descending
                gemini_models.sort(key=parse_model_score, reverse=True)
                
                self.discovered_models = gemini_models
                self.discovered_at = datetime.now(timezone.utc).isoformat()
                self.dynamic_discovery_active = True

                # Determine top fast (flash) and reasoning (pro) models
                top_flash = next((m for m in gemini_models if "flash" in m), None)
                top_pro = next((m for m in gemini_models if "pro" in m), None)

                self.fast_model = top_flash or (gemini_models[0] if gemini_models else "gemini-3.8-flash")
                self.reasoning_model = top_pro or self.fast_model
                self.candidate_models = gemini_models[:3] if gemini_models else self.default_cascade
                self.model_name = self.fast_model
                logger.info(f"Dynamic Model Discovery SUCCESS. Discovered {len(gemini_models)} Gemini models. Fast: {self.fast_model}, Reasoning: {self.reasoning_model}")
                return
            else:
                logger.warning(f"Google Models API returned HTTP {res.status_code}. Using adaptive default cascade.")
        except Exception as e:
            logger.warning(f"Dynamic model discovery failed ({e}). Falling back to adaptive default cascade.")

        # Fallback if discovery network fails
        self.fast_model = os.getenv("GEMINI_MODEL_FAST", "gemini-4-flash")
        self.reasoning_model = os.getenv("GEMINI_MODEL_REASONING", "gemini-4-pro")
        self.candidate_models = self.default_cascade
        self.model_name = self.fast_model

    def get_ai_diagnostics(self) -> dict:
        """
        Returns live AI diagnostic telemetry for the frontend and monitoring drawers.
        """
        return {
            "active_model": self.model_name,
            "fast_model": self.fast_model,
            "reasoning_model": self.reasoning_model,
            "candidate_models": self.candidate_models,
            "discovered_models_count": len(self.discovered_models),
            "discovered_at": self.discovered_at,
            "dynamic_discovery_active": self.dynamic_discovery_active,
            "last_call": self.last_diagnostics
        }

    def _call_gemini(self, prompt: str, max_tokens: int = 400, model: str = None, json_mode: bool = False) -> str:
        """
        Robust multi-model execution with automatic REST fallback and demand-spike (503/429) cascading.
        """
        if not self.api_key:
            return ""

        models_to_try = []
        if model:
            models_to_try.append(model)
        for cand in self.candidate_models:
            if cand not in models_to_try:
                models_to_try.append(cand)

        last_error = None
        t0 = time.time()

        for m in models_to_try:
            try:
                # 1. Try google-genai SDK if available
                use_sdk = False
                try:
                    from google import genai
                    client = genai.Client(api_key=self.api_key)
                    config = {}
                    if json_mode:
                        config["response_mime_type"] = "application/json"
                    response = client.models.generate_content(
                        model=m,
                        contents=prompt,
                        config=config
                    )
                    use_sdk = True
                    text = response.text or ""
                except Exception as sdk_err:
                    use_sdk = False

                # 2. Native REST API Execution (Zero external SDK lock-in)
                if not use_sdk:
                    import requests
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={self.api_key}"
                    payload = {
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "maxOutputTokens": max_tokens,
                            "temperature": 0.2
                        }
                    }
                    if json_mode:
                        payload["generationConfig"]["responseMimeType"] = "application/json"

                    r = requests.post(url, json=payload, timeout=5)
                    if r.status_code == 200:
                        data = r.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        else:
                            text = ""
                    else:
                        raise ValueError(f"HTTP {r.status_code}: {r.text[:200]}")

                if text:
                    self.model_name = m
                    latency_ms = int((time.time() - t0) * 1000)
                    self.last_diagnostics = {
                        "model": m,
                        "latency_ms": latency_ms,
                        "status": "SUCCESS",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "mode": "SDK" if use_sdk else "REST"
                    }
                    logger.info(f"Gemini call SUCCESS with model '{m}' in {latency_ms}ms")
                    return text

            except Exception as e:
                last_error = e
                logger.warning(f"Gemini model '{m}' failed ({e}). Cascading to next candidate...")
                continue

        latency_ms = int((time.time() - t0) * 1000)
        self.last_diagnostics = {
            "model": "NONE",
            "latency_ms": latency_ms,
            "status": "FAILED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "last_error": str(last_error)
        }
        logger.error(f"All candidate Gemini models failed. Last error: {last_error}")
        return ""

    def generate_daily_trade_plans(self, idx_data: dict, crypto_data: list, macro_data: dict, target_count: int = 16) -> list:
        """
        Generates 10-20 disciplined, Astra-standard trade plans (e.g. 10-12 for IDX, 6-8 for Crypto).
        Strict Rule: FACTS separate from OPINION, arithmetic visible, R:R >= 2.0, status = AWAITING_HUMAN_REVIEW.
        """
        plans = []

        all_idx = idx_data.get("all_records", [])
        seen_tickers = set()
        deduped_idx = []
        for s in all_idx:
            t = s["ticker"]
            if t not in seen_tickers:
                seen_tickers.add(t)
                deduped_idx.append(s)

        priority_order = {"BREAKOUT": 1, "ACCUMULATION": 2, "OVERSOLD_REBOUND": 3, "PULLBACK": 4, "CONSOLIDATION": 5}
        sorted_idx = sorted(deduped_idx, key=lambda x: priority_order.get(x.get("technical_signal", "CONSOLIDATION"), 9))

        idx_target_count = min(12, len(sorted_idx))
        chosen_idx = sorted_idx[:idx_target_count]

        for stock in chosen_idx:
            ticker = stock["ticker"]
            price = stock["price"]
            if price <= 0:
                price = 1000

            stop_loss = round(price * 0.96, 0)
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
                    "Lonjakan pendanaan derivatif (Funding Rate > 0.05%) memicu long squeeze"
                ],
                "weakest_assumption": "Mengasumsikan level support $BTC bertahan dan sentimen likuiditas global tidak memburuk.",
                "status": "AWAITING_HUMAN_REVIEW",
                "created_at": datetime.now().isoformat()
            })

        # LLM Synthesis Enhancement
        if self.use_llm and plans:
            try:
                prompt_data = []
                for p in plans[:6]:
                    prompt_data.append({
                        "id": p["plan_id"],
                        "ticker": p["clean_ticker"],
                        "facts": p["facts_summary"],
                        "base_thesis": p["opinion_thesis"]
                    })

                prompt = f"""
                You are an expert trading analyst. For the following trade plans, generate:
                1. A refined, professional institutional-grade 'opinion_thesis' (2-3 sentences max).
                2. Explicitly note the 'weakest_assumption' for each setup.
                Also generate one 'ai_market_sentiment' summary for the overall market based on these setups.

                Return ONLY valid JSON matching this schema:
                {{
                  "market_sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
                  "market_narrative": "string",
                  "plans_enhancement": [
                    {{
                      "id": "string",
                      "refined_thesis": "string",
                      "weakest_assumption": "string"
                    }}
                  ]
                }}

                Data:
                {json.dumps(prompt_data, indent=2)}
                """

                raw_json = self._call_gemini(prompt, max_tokens=800, model=self.fast_model, json_mode=True)
                if raw_json:
                    clean_json = raw_json.strip()
                    if clean_json.startswith("```json"):
                        clean_json = clean_json[7:]
                    if clean_json.endswith("```"):
                        clean_json = clean_json[:-3]
                    parsed = json.loads(clean_json.strip())

                    enhancements = {item["id"]: item for item in parsed.get("plans_enhancement", [])}
                    for p in plans:
                        if p["plan_id"] in enhancements:
                            p["opinion_thesis"] = enhancements[p["plan_id"]]["refined_thesis"]
                            p["weakest_assumption"] = enhancements[p["plan_id"]]["weakest_assumption"]
            except Exception as e:
                logger.warning(f"LLM plan enhancement failed ({e}). Preserving robust Astra heuristics.")

        return plans

    def run_bull_bear_debate(self, ticker: str, entry: float, sl: float, tp1: float,
                            facts: str, catalyst: str) -> dict:
        """
        Runs an adversarial Bull vs Bear debate with an impartial Risk Arbiter.
        """
        bull_prompt = f"""You are a BULL ADVOCATE for this trade setup. Present your STRONGEST case.
Ticker: {ticker} | Entry: {entry} | Stop Loss: {sl} | Target: {tp1}
Market Facts: {facts}
Catalyst: {catalyst}

Present exactly 3 bullet points why this trade WILL succeed. Focus on asymmetric upside, volume flow, and technical confirmation. Max 100 words."""

        bear_prompt = f"""You are a BEAR RED-TEAMER. Your job is to DESTROY this trade thesis.
Ticker: {ticker} | Entry: {entry} | Stop Loss: {sl} | Target: {tp1}
Market Facts: {facts}
Catalyst: {catalyst}

The Bull says:
{{bull_argument}}

Present exactly 3 bullet points exposing the fatal flaws in this trade. Focus on macro risks, fakeouts, distribution patterns, and hidden leverage. Max 100 words."""

        arbiter_prompt = f"""You are a neutral RISK ARBITER. Based on the Bull and Bear arguments below,
render an impartial judgment for {ticker} (Entry: {entry}, SL: {sl}, TP: {tp1}).

BULL CASE:
{{bull_argument}}

BEAR CASE:
{{bear_argument}}

Respond with valid JSON:
{{
  "verdict": "APPROVED" | "REDUCED_SIZE" | "REJECTED",
  "recommended_size_pct": float (0.0 to 100.0),
  "critical_risk": "one sentence describing the single biggest risk",
  "reasoning": "two sentences summarizing the decision"
}}"""

        try:
            bull_response = self._call_gemini(bull_prompt, max_tokens=300)
            bear_filled = bear_prompt.replace("{bull_argument}", bull_response)
            bear_response = self._call_gemini(bear_filled, max_tokens=300)

            arbiter_filled = arbiter_prompt.replace("{bull_argument}", bull_response).replace("{bear_argument}", bear_response)
            raw_arbiter = self._call_gemini(arbiter_filled, max_tokens=300, json_mode=True)

            clean = raw_arbiter.strip()
            if clean.startswith("```json"):
                clean = clean[7:]
            if clean.endswith("```"):
                clean = clean[:-3]
            arbiter_result = json.loads(clean.strip())

            return {
                "ticker": ticker,
                "bull_case": bull_response,
                "bear_case": bear_response,
                "verdict": arbiter_result.get("verdict", "APPROVED"),
                "recommended_size_pct": arbiter_result.get("recommended_size_pct", 100.0),
                "critical_risk": arbiter_result.get("critical_risk", "Market volatility"),
                "reasoning": arbiter_result.get("reasoning", "Setup meets risk-reward criteria."),
                "model_used": self.last_diagnostics.get("model", self.model_name),
                "latency_ms": self.last_diagnostics.get("latency_ms", 0),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.warning(f"Debate LLM failed for {ticker}: {e}. Returning deterministic consensus.")
            return {
                "ticker": ticker,
                "bull_case": f"1. Momentum akumulasi kuat di atas support Rp {sl}.\n2. Katalis {catalyst} mendukung kelanjutan tren.\n3. Risk/Reward terukur di atas 2:1.",
                "bear_case": f"1. Risiko false breakout jika volume pasar melemah.\n2. Potensi aksi profit taking institusi di area resistance Rp {tp1}.\n3. Volatilitas eksternal makro dapat memicu stop loss hunt.",
                "verdict": "APPROVED",
                "recommended_size_pct": 80.0,
                "critical_risk": "Volatilitas makro dan likuiditas sesi perdagangan.",
                "reasoning": "Setup teknikal solid dengan toleransi risiko ketat.",
                "model_used": "DETERMINISTIC_FALLBACK",
                "latency_ms": 0,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

    def assess_geopolitical_threat(self, news_headlines: list, market_context: dict = None) -> dict:
        """
        Assesses global geopolitical and macro threat levels (DEFCON 1 to 5).
        """
        headlines_str = "\n".join(news_headlines[:15]) if news_headlines else "No major breaking headlines reported."
        context_str = json.dumps(market_context or {}, indent=2)

        prompt = f"""You are the Chief Macro Risk Sentinel for a Quantitative Trading Firm.
Analyze the following breaking news headlines and macro indicators to assess the Geopolitical Threat Level:

HEADLINES:
{headlines_str}

MARKET CONTEXT:
{context_str}

Assign a DEFCON level (1 to 5) and output ONLY valid JSON matching this schema:
{{
  "defcon_level": integer between 1 and 5 (1=Critical Systemic/War Crisis, 2=Severe Escalation, 3=Elevated Market Volatility, 4=Guarded/Tension, 5=Normal Peacetime),
  "primary_threat": "one sentence summarizing the main risk factor (e.g. Strait of Hormuz blockade / Trade War Tariff shock)",
  "affected_asset_classes": ["list of assets e.g. Crude Oil, Gold, Emerging Markets FX, Tech Equities"],
  "tactical_recommendation": "specific advice on cash allocation, stop-loss tightness, or commodity hedging",
  "threat_score": float between 0.0 and 1.0
}}
"""
        try:
            raw_json = self._call_gemini(prompt, max_tokens=400, model=self.fast_model, json_mode=True)
            clean = raw_json.strip()
            if clean.startswith("```json"):
                clean = clean[7:]
            if clean.endswith("```"):
                clean = clean[:-3]
            res = json.loads(clean.strip())
            res["model_used"] = self.last_diagnostics.get("model", self.model_name)
            res["latency_ms"] = self.last_diagnostics.get("latency_ms", 0)
            res["evaluated_at"] = datetime.now(timezone.utc).isoformat()
            return res
        except Exception as e:
            logger.warning(f"Geopolitical assessment LLM failed: {e}. Returning baseline DEFCON.")
            return {
                "defcon_level": 4,
                "primary_threat": "Tensi geopolitik Timur Tengah & fluktuasi suku bunga bank sentral global.",
                "affected_asset_classes": ["Crude Oil", "Gold Spot", "IHSG Banking", "USD/IDR"],
                "tactical_recommendation": "Pertahankan cadangan kas 20-30%, gunakan trailing stop disiplin pada saham energi dan perbankan.",
                "threat_score": 0.42,
                "model_used": "DETERMINISTIC_FALLBACK",
                "latency_ms": 0,
                "evaluated_at": datetime.now(timezone.utc).isoformat()
            }
