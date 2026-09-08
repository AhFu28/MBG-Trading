import os
import sys
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
from database.supabase_client import DatabaseClient

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
    parser.add_argument("--mode", choices=["all", "hourly_crypto_macro", "daily_idx_morning", "mock"], default="all")
    args = parser.parse_args()

    logger.info(f"Starting Market Brain Grid Pipeline in mode: {args.mode.upper()}")
    start_time = datetime.now()

    db = DatabaseClient()
    news_fetcher = NewsMacroFetcher()
    idx_fetcher = IDXMarketFetcher()
    crypto_fetcher = CryptoSpotFetcher()
    brain = LLMBrain()

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

    # 4. Consolidate Master Cockpit Bundle (for instant frontend load)
    bundle = {
        "macro_telemetry": macro_data,
        "conglomerates": idx_data.get("conglomerates", {}),
        "dividend_hunters": idx_data.get("dividend_hunters", []),
        "foreign_flow": idx_data.get("foreign_flow", {}),
        "crypto_spot_10": crypto_spot_10,
        "daily_trade_plans": trade_plans,
        "mode": args.mode,
        "execution_duration_sec": round((datetime.now() - start_time).total_seconds(), 2)
    }
    db.sync_complete_bundle(bundle)

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
