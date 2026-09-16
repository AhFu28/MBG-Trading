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
from fetchers.whale_tracker import WhaleTracker
from fetchers.crypto_futures import CryptoFuturesFetcher
from fetchers.forex_scanner import ForexScanner
from fetchers.us_market import USMarketFetcher
from analyzer.llm_brain import LLMBrain
from analyzer.backtest_engine import BacktestEngine
from analyzer.technical_indicators import TechnicalIndicators
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
    parser.add_argument("--mode", choices=["all", "hourly_crypto_macro", "daily_idx_morning", "intraday_idx_refresh", "whale", "forex", "us_stocks"], default="all")
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

    # v3.0 — Whale Intelligence + Crypto Futures (runs on hourly & all & whale modes)
    whale_data = {}
    crypto_futures_data = {}
    if args.mode in ["all", "hourly_crypto_macro", "whale"]:
        try:
            logger.info("Scanning Whale Intelligence (Crypto On-Chain + IDX Foreign + US Institutional)...")
            whale_data = WhaleTracker().execute()
        except Exception as e:
            logger.warning(f"WhaleTracker failed: {e}")

        try:
            logger.info("Fetching Crypto Futures Intelligence (Funding Rate, OI, Long/Short, Liquidations)...")
            crypto_futures_data = CryptoFuturesFetcher().execute()
        except Exception as e:
            logger.warning(f"CryptoFuturesFetcher failed: {e}")

    # v3.0 — Forex Scanner (runs on daily & all & forex modes)
    forex_data = {}
    if args.mode in ["all", "daily_idx_morning", "forex"]:
        try:
            logger.info("Scanning 28 Forex Pairs + COT Report...")
            forex_data = ForexScanner().execute()
        except Exception as e:
            logger.warning(f"ForexScanner failed: {e}")

    # v3.0 — US Market Intelligence (runs on daily & all & us_stocks modes)
    us_data = {}
    if args.mode in ["all", "daily_idx_morning", "us_stocks"]:
        try:
            logger.info("Scanning 30 US Stocks + Earnings Calendar...")
            us_data = USMarketFetcher().execute()
        except Exception as e:
            logger.warning(f"USMarketFetcher failed: {e}")

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

    # 2b. Intraday IDX Price Refresh (lightweight, only updates current prices)
    if args.mode == "intraday_idx_refresh":
        logger.info("Running intraday IDX price refresh...")
        # Fetch latest IDX prices
        idx_data = idx_fetcher.execute()
        current_prices_map = {r["ticker"]: r for r in idx_data.get("all_records", [])}
        
        # Also fetch crypto + macro for freshness
        logger.info("Also refreshing crypto & macro...")
        macro_data = news_fetcher.execute()
        db.upsert_macro_telemetry(macro_data)
        crypto_spot_10 = crypto_fetcher.execute()
        db.upsert_crypto_spot_10(crypto_spot_10)
        
        # Load existing bundle and update current prices in trade plans
        bundle_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "data", "latest_cockpit_bundle.json")
        if os.path.exists(bundle_path):
            with open(bundle_path, "r", encoding="utf-8") as bf:
                existing_bundle = json.load(bf)
            
            # Inject current_price into trade plans
            for plan in existing_bundle.get("daily_trade_plans", []):
                ticker = plan.get("clean_ticker") or plan.get("symbol", "").replace(".JK", "")
                rec = current_prices_map.get(ticker) or current_prices_map.get(ticker + ".JK")
                if rec:
                    plan["current_price"] = rec.get("price", plan.get("entry_price", 0))
                    plan["change_pct"] = rec.get("change_pct", 0)
                    plan["volume"] = rec.get("volume", 0)
            
            # Update sections
            from datetime import timezone
            now_iso = datetime.now(timezone.utc).isoformat()
            existing_bundle["last_updated"] = now_iso
            existing_bundle["macro_telemetry"] = macro_data or existing_bundle.get("macro_telemetry", {})
            existing_bundle["crypto_spot_10"] = crypto_spot_10 or existing_bundle.get("crypto_spot_10", [])
            existing_bundle["conglomerates"] = idx_data.get("conglomerates") or existing_bundle.get("conglomerates", {})
            existing_bundle["foreign_flow"] = idx_data.get("foreign_flow") or existing_bundle.get("foreign_flow", {})
            existing_bundle["section_timestamps"] = {
                "idx": now_iso,
                "crypto": now_iso,
                "macro": now_iso,
                "trade_plans": existing_bundle.get("section_timestamps", {}).get("trade_plans", now_iso)
            }
            existing_bundle["mode"] = args.mode
            existing_bundle["execution_duration_sec"] = round((datetime.now() - start_time).total_seconds(), 2)
            
            # Write back
            with open(bundle_path, "w", encoding="utf-8") as bf:
                json.dump(existing_bundle, bf, ensure_ascii=False, indent=2)
            db.sync_complete_bundle(existing_bundle)
            
            logger.info(f"Intraday refresh done. Updated {len([p for p in existing_bundle.get('daily_trade_plans',[]) if 'current_price' in p])} trade plan prices.")
        
        logger.info(f"Intraday IDX refresh completed in {round((datetime.now() - start_time).total_seconds(), 2)} seconds.")
        return  # Exit early, no need for advanced analytics

    technical_analysis = {}
    smc_analysis = {}
    bandarmology_iifs = {}
    forecasts = {}
    portfolio_summary = {}
    strategy_rankings = {}
    backtest_lab = {}
    correlation_data = None

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
                if t not in technical_analysis:
                    try: technical_analysis[t] = TechnicalIndicators.analyze(df)
                    except Exception as e: logger.warning(f"Technicals failed for {t}: {e}")
                if smc and t not in smc_analysis:
                    try: smc_analysis[t] = smc.analyze(df, t)
                    except Exception as e: logger.warning(f"SMC failed for {t}: {e}")
                if iifs and t not in bandarmology_iifs:
                    try: bandarmology_iifs[t] = iifs.analyze(df, t)
                    except Exception as e: logger.warning(f"IIFS failed for {t}: {e}")
                if timesfm and t not in forecasts:
                    try: forecasts[t] = timesfm.forecast(df, t)
                    except Exception as e: logger.warning(f"TimesFM failed for {t}: {e}")

        for plan in trade_plans:
            t = plan.get("clean_ticker") or plan.get("ticker") or plan.get("symbol", "").replace(".JK", "")
            if t in technical_analysis: plan["technicals"] = technical_analysis[t]
            if t in smc_analysis: plan["smc"] = smc_analysis[t]
            if t in bandarmology_iifs: plan["iifs"] = bandarmology_iifs[t]
            if t in forecasts: plan["forecast"] = forecasts[t]
            
            if brain:
                debate_result = brain.run_bull_bear_debate(
                    ticker=t,
                    entry=plan.get('entry_price', 0),
                    sl=plan.get('stop_loss', 0),
                    tp1=plan.get('target_1', 0) or plan.get('take_profit_1', 0),
                    technical_data=plan.get('technicals', {}),
                    macro_context=macro_data.get('headline', '') if macro_data else ''
                )
                plan['debate'] = debate_result
                if debate_result.get('verdict') == 'VETOED':
                    plan['status'] = 'VETOED_BY_BEAR'

        if portfolio:
            for plan in trade_plans:
                t = plan.get("clean_ticker") or plan.get("ticker") or plan.get("symbol", "").replace(".JK", "")
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
                changes = portfolio.check_and_update_trades(current_prices)
                if exp3 and changes:
                    for ch in changes:
                        if ch.get('new_status') in ['TP1_HIT', 'TP2_HIT', 'SL_HIT']:
                            strat = ch.get('strategy_type')
                            if strat:
                                exp3.update_reward(strat, ch.get('pnl_pct', 0.0))
                portfolio.expire_old_trades()
                portfolio_summary = portfolio.get_portfolio_summary()
            except Exception as e:
                logger.warning(f"Paper portfolio update failed: {e}")

        if exp3:
            try: strategy_rankings = exp3.get_rankings()
            except Exception as e: logger.warning(f"Exp3 Bandit failed: {e}")
            
        try:
            logger.info("Running Archetype Backtests...")
            backtest_lab = BacktestEngine(history_dfs=history_dfs).run_all_archetypes()
        except Exception as e:
            logger.warning(f"BacktestEngine failed: {e}")

        # Generate Broker Summaries (EOD Official Matrix ala Stockbit / NeoBDM)
        broker_summaries = {}
        try:
            bs_fetcher = BrokerSummaryFetcher()
            # 1. Fetch live IndexAlpha broker summary for top trade plan setups (efficient quota utilization)
            priority_tickers = set()
            for p in trade_plans[:5]:
                ptick = p.get("clean_ticker") or p.get("ticker") or p.get("symbol", "").replace(".JK", "")
                if ptick:
                    priority_tickers.add(ptick)

            for ptick in priority_tickers:
                try:
                    broker_summaries[ptick] = bs_fetcher.fetch_broker_summary(ptick)
                except Exception as pe:
                    logger.warning(f"Priority live broker summary failed for {ptick}: {pe}")

            # 2. Fill the rest of the market universe with simulated coverage
            for rec in idx_data.get("all_records", []):
                tick = rec.get("ticker", "").replace(".JK", "")
                pr = rec.get("price", 5000)
                vol = rec.get("volume", 500000)
                if tick and tick not in broker_summaries:
                    broker_summaries[tick] = bs_fetcher.generate_broker_summary(tick, pr, vol)
            logger.info(f"Generated {len(broker_summaries)} Broker Summaries ({len(priority_tickers)} priority checked).")
        except Exception as e:
            logger.warning(f"BrokerSummary generation failed: {e}")

        try:
            from analyzer.correlation_matrix import compute_correlation_matrix
            correlation_data = compute_correlation_matrix(history_dfs)
        except Exception as e:
            logger.warning(f"Correlation matrix failed: {e}")

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

    from datetime import timezone

    # Inject current_price into trade plans from IDX all_records
    all_records = idx_data.get("all_records", []) if idx_data else []
    current_prices_map = {r["ticker"]: r for r in all_records}
    for plan in (trade_plans or []):
        ticker = plan.get("clean_ticker") or plan.get("symbol", "").replace(".JK", "")
        rec = current_prices_map.get(ticker) or current_prices_map.get(ticker + ".JK")
        if rec:
            plan["current_price"] = rec.get("price", plan.get("entry_price", 0))
            plan["change_pct"] = rec.get("change_pct", 0)

    bundle = {
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "data_sources": {
            "macro": macro_data.get("data_source", "unknown") if macro_data else "unknown"
        },
        "macro_telemetry": macro_data or existing_bundle.get("macro_telemetry", {}),
        "conglomerates": idx_data.get("conglomerates") or existing_bundle.get("conglomerates", {}),
        "dividend_hunters": idx_data.get("dividend_hunters") or existing_bundle.get("dividend_hunters", []),
        "foreign_flow": idx_data.get("foreign_flow") or existing_bundle.get("foreign_flow", {}),
        "crypto_spot_10": crypto_spot_10 or existing_bundle.get("crypto_spot_10", []),
        "daily_trade_plans": trade_plans or existing_bundle.get("daily_trade_plans", []),
        "technical_analysis": technical_analysis or existing_bundle.get("technical_analysis", {}),
        "smc_analysis": smc_analysis or existing_bundle.get("smc_analysis", {}),
        "bandarmology_iifs": bandarmology_iifs or existing_bundle.get("bandarmology_iifs", {}),
        "broker_summary": broker_summaries or existing_bundle.get("broker_summary", {}),
        "forecasts": forecasts or existing_bundle.get("forecasts", {}),
        "paper_portfolio": portfolio_summary or existing_bundle.get("paper_portfolio", {}),
        "strategy_rankings": strategy_rankings or existing_bundle.get("strategy_rankings", {}),
        "backtest_lab": backtest_lab or existing_bundle.get("backtest_lab", {}),
        "correlation_matrix": correlation_data or existing_bundle.get("correlation_matrix"),
        "whale_intelligence": whale_data or existing_bundle.get("whale_intelligence", {}),
        "crypto_futures": crypto_futures_data or existing_bundle.get("crypto_futures", {}),
        "forex_intelligence": forex_data or existing_bundle.get("forex_intelligence", {}),
        "us_stocks": us_data or existing_bundle.get("us_stocks", {}),
        "mode": args.mode,
        "section_timestamps": {
            "idx": datetime.now(timezone.utc).isoformat() if idx_data else existing_bundle.get("section_timestamps", {}).get("idx"),
            "crypto": datetime.now(timezone.utc).isoformat() if crypto_spot_10 else existing_bundle.get("section_timestamps", {}).get("crypto"),
            "macro": datetime.now(timezone.utc).isoformat() if macro_data else existing_bundle.get("section_timestamps", {}).get("macro"),
            "trade_plans": datetime.now(timezone.utc).isoformat() if trade_plans else existing_bundle.get("section_timestamps", {}).get("trade_plans"),
        },
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
