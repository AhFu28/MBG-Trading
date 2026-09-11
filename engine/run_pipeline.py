import os
import sys
import json
import argparse
import logging
from datetime import datetime
from dotenv import load_dotenv

# Ensure engine path is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fetchers.news_macro import NewsMacroFetcher
from fetchers.idx_market import IDXMarketFetcher
from fetchers.crypto_spot import CryptoSpotFetcher
from analyzer.llm_brain import LLMBrain
from analyzer.backtest_engine import BacktestEngine
from fetchers.broker_summary_fetcher import BrokerSummaryFetcher

try:
    from analyzer.smc_detector import SMCDetector
    from analyzer.bandarmology_iifs import BandarmologyIIFS
    from analyzer.timesfm_forecaster import TimesFMForecaster
    from analyzer.exp3_bandit import Exp3StrategyBandit
    from analyzer.paper_portfolio import PaperPortfolio
except ImportError as e:
    SMCDetector = BandarmologyIIFS = TimesFMForecaster = Exp3StrategyBandit = PaperPortfolio = None

from database.supabase_client import DatabaseClient
from notifiers.telegram_notifier import TelegramNotifier

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("PipelineRunner")

def main():
    # Load .env if present
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    if os.path.exists(env_path):
        load_dotenv(env_path)

    parser = argparse.ArgumentParser(description="Market Brain Grid & Cockpit Engine Runner")
    parser.add_argument("--mode", choices=["all", "hourly_crypto_macro", "daily_idx_morning"], default="all")
    args = parser.parse_args()

    logger.info(f"Starting Market Brain Grid Pipeline in mode: {args.mode.upper()}")
    start_time = datetime.now()

    db = DatabaseClient()
    news_fetcher = NewsMacroFetcher()
    idx_fetcher = IDXMarketFetcher()
    crypto_fetcher = CryptoSpotFetcher()
    brain = LLMBrain()
    telegram = TelegramNotifier()

    macro_data = {}
    crypto_spot_10 = []
    idx_data = {}
    trade_plans = []

    # 1. Macro & Crypto (Always runs on hourly & all modes)
    if args.mode in ["all", "hourly_crypto_macro"]:
        logger.info("Executing US Macro, Fed/Trump & Commodities News Radar...")
        macro_data = news_fetcher.execute()
        db.upsert_macro_telemetry(macro_data)

        logger.info("Scanning & Generating Top 10 Crypto Spot Pairs (USDT)...")
        crypto_spot_10 = crypto_fetcher.execute()
        db.upsert_crypto_spot_10(crypto_spot_10)

    # 2. IDX Categorized Market (Runs on morning & all modes)
    if args.mode in ["all", "daily_idx_morning"]:
        logger.info("Scanning & Classifying IDX Equities (Conglomerates, Dividend Hunters, Foreign Flow)...")
        idx_data = idx_fetcher.execute()
        db.upsert_idx_categorized(idx_data.get("all_records", []))

    # 3. LLM Synthesis & Astra Trade Plans
    if args.mode == "all" or (args.mode == "daily_idx_morning" and idx_data):
        logger.info("Generating Astra-standard Daily Trade Plans...")
        trade_plans = brain.generate_daily_trade_plans(idx_data, crypto_spot_10, macro_data)
        db.upsert_trade_plans(trade_plans)

    smc_analysis = {}
    bandarmology_iifs = {}
    forecasts = {}
    portfolio_summary = {}
    strategy_rankings = {}
    backtest_lab = {}

    try:
        logger.info("Running Advanced Analytics & Paper Portfolio...")
        
        smc = SMCDetector() if SMCDetector else None
        iifs = BandarmologyIIFS() if BandarmologyIIFS else None
        timesfm = TimesFMForecaster() if TimesFMForecaster else None
        portfolio = PaperPortfolio() if PaperPortfolio else None
        exp3 = Exp3StrategyBandit() if Exp3StrategyBandit else None

        all_records = idx_data.get("all_records", []) if idx_data else []
        history_dfs = idx_data.get("history_dfs", {}) if idx_data else {}
        current_prices = {r["ticker"]: r["price"] for r in all_records}

        # Ensure candidate trade plan tickers have historical candle DataFrames for SMC, IIFS, TimesFM
        plan_tickers = [plan.get("clean_ticker") or plan.get("ticker") or plan.get("symbol", "").replace(".JK", "") for plan in trade_plans]
        plan_tickers = [t for t in plan_tickers if t]

        missing_tickers = [t for t in plan_tickers if t not in history_dfs and f"{t}.JK" not in history_dfs]
        if missing_tickers:
            logger.info(f"Downloading historical candles for {len(missing_tickers)} trade plan candidates...")
            try:
                import yfinance as yf
                yf_syms = [f"{t}.JK" for t in missing_tickers]
                downloaded = yf.download(yf_syms, period="3mo", interval="1d", group_by="ticker", progress=False)
                if len(missing_tickers) == 1:
                    t = missing_tickers[0]
                    if not downloaded.empty:
                        history_dfs[t] = downloaded
                else:
                    for t in missing_tickers:
                        sym = f"{t}.JK"
                        if sym in downloaded and not downloaded[sym].dropna(how="all").empty:
                            history_dfs[t] = downloaded[sym].dropna(how="all")
            except Exception as ex:
                logger.warning(f"Batch candle download for candidates failed: {ex}")

        target_tickers = set(plan_tickers + list(history_dfs.keys()))
        for t in target_tickers:
            full_t = f"{t}.JK"
            df = history_dfs.get(t)
            if df is None:
                df = history_dfs.get(full_t)

            if df is not None and not df.empty:
                if smc and t not in smc_analysis:
                    try: smc_analysis[t] = smc.analyze(df, t)
                    except Exception as e: logger.warning(f"SMC failed for {t}: {e}")
                if iifs and t not in bandarmology_iifs:
                    try: bandarmology_iifs[t] = iifs.analyze(df, t)
                    except Exception as e: logger.warning(f"IIFS failed for {t}: {e}")
                if timesfm and t not in forecasts:
                    try: forecasts[t] = timesfm.forecast(df, t)
                    except Exception as e: logger.warning(f"TimesFM failed for {t}: {e}")

        if portfolio:
            for plan in trade_plans:
                t = plan.get("clean_ticker") or plan.get("ticker") or plan.get("symbol", "").replace(".JK", "")
                if t in smc_analysis: plan["smc"] = smc_analysis[t]
                if t in bandarmology_iifs: plan["iifs"] = bandarmology_iifs[t]
                if t in forecasts: plan["forecast"] = forecasts[t]
                
                direction = (plan.get("direction") or plan.get("action") or "").upper()
                if direction in ["BUY", "LONG"]:
                    try:
                        portfolio.open_trade(
                            ticker=t,
                            entry_price=plan.get("entry_price", current_prices.get(t, 0)),
                            sl_price=plan.get("stop_loss", 0),
                            tp1_price=plan.get("target_1") or plan.get("take_profit_1", 0),
                            tp2_price=plan.get("target_2") or plan.get("take_profit_2", 0),
                            strategy_type=plan.get("strategy") or plan.get("strategy_type", "Astra")
                        )
                    except Exception as e:
                        logger.warning(f"Failed opening trade for {t}: {e}")
            try:
                portfolio.check_and_update_trades(current_prices)
                portfolio.expire_old_trades()
                portfolio_summary = portfolio.get_portfolio_summary()
            except Exception as e:
                logger.warning(f"Paper portfolio update failed: {e}")

        if exp3:
            try: strategy_rankings = exp3.get_rankings()
            except Exception as e: logger.warning(f"Exp3 Bandit failed: {e}")
            
        try:
            logger.info("Running Archetype Backtests...")
            backtest_lab = BacktestEngine().run_all_archetypes()
        except Exception as e:
            logger.warning(f"BacktestEngine failed: {e}")

        # Generate Broker Summaries (EOD Official Matrix ala Stockbit / NeoBDM)
        broker_summaries = {}
        try:
            bs_fetcher = BrokerSummaryFetcher()
            for rec in idx_data.get("all_records", []):
                tick = rec.get("ticker", "")
                pr = rec.get("price", 5000)
                vol = rec.get("volume", 500000)
                if tick:
                    broker_summaries[tick] = bs_fetcher.generate_broker_summary(tick, pr, vol)
            logger.info(f"Generated {len(broker_summaries)} Broker Summaries.")
        except Exception as e:
            logger.warning(f"BrokerSummary generation failed: {e}")

    except Exception as e:
        logger.error(f"Advanced integration pipeline error: {e}")

    # 4. Consolidate Master Cockpit Bundle (Preserve existing data if running hourly)
    existing_bundle = {}
    bundle_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "data", "latest_cockpit_bundle.json")
    if os.path.exists(bundle_path):
        try:
            with open(bundle_path, "r", encoding="utf-8") as bf:
                existing_bundle = json.load(bf)
        except Exception as be:
            logger.warning(f"Could not load existing bundle to merge: {be}")

    bundle = {
        "macro_telemetry": macro_data or existing_bundle.get("macro_telemetry", {}),
        "conglomerates": idx_data.get("conglomerates") or existing_bundle.get("conglomerates", {}),
        "dividend_hunters": idx_data.get("dividend_hunters") or existing_bundle.get("dividend_hunters", []),
        "foreign_flow": idx_data.get("foreign_flow") or existing_bundle.get("foreign_flow", {}),
        "crypto_spot_10": crypto_spot_10 or existing_bundle.get("crypto_spot_10", []),
        "daily_trade_plans": trade_plans or existing_bundle.get("daily_trade_plans", []),
        "smc_analysis": smc_analysis or existing_bundle.get("smc_analysis", {}),
        "bandarmology_iifs": bandarmology_iifs or existing_bundle.get("bandarmology_iifs", {}),
        "broker_summary": broker_summaries or existing_bundle.get("broker_summary", {}),
        "forecasts": forecasts or existing_bundle.get("forecasts", {}),
        "paper_portfolio": portfolio_summary or existing_bundle.get("paper_portfolio", {}),
        "strategy_rankings": strategy_rankings or existing_bundle.get("strategy_rankings", {}),
        "backtest_lab": backtest_lab or existing_bundle.get("backtest_lab", {}),
        "mode": args.mode,
        "execution_duration_sec": round((datetime.now() - start_time).total_seconds(), 2)
    }
    db.sync_complete_bundle(bundle)

    # 5. Broadcast to Telegram (if enabled in ENV)
    if macro_data:
        telegram.broadcast_macro_flash(macro_data)
    if trade_plans:
        telegram.broadcast_daily_plans(trade_plans)

    logger.info(f"Pipeline finished successfully in {bundle['execution_duration_sec']} seconds.")
    print("="*60)
    print("MARKET BRAIN GRID & COCKPIT TELEMETRY SNAPSHOT:")
    print(f"- Macro Headline: {macro_data.get('headline', 'N/A')}")
    print(f"- Gold Price: ${macro_data.get('gold_price')} | Brent Oil: ${macro_data.get('brent_oil_price')}")
    print(f"- Crypto Spot Pairs generated: {len(crypto_spot_10)}")
    print(f"- IDX Conglomerate Groups: {len(idx_data.get('conglomerates', {}))}")
    print(f"- IDX Dividend Hunters: {len(idx_data.get('dividend_hunters', []))}")
    print(f"- Trade Plans Synthesized: {len(trade_plans)}")
    print("="*60)

if __name__ == "__main__":
    main()
