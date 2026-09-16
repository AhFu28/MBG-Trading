import os
import json
import logging
import math
from datetime import datetime

def _sanitize_for_json(obj):
    """Replace NaN/Infinity with None to produce valid JSON."""
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
    if isinstance(obj, dict):
        return {k: _sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize_for_json(i) for i in obj]
    return obj

logger = logging.getLogger("DBClient")

class DatabaseClient:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_KEY")
        self.client = None

        if self.supabase_url and self.supabase_key:
            try:
                from supabase import create_client
                self.client = create_client(self.supabase_url, self.supabase_key)
                logger.info("Connected to Supabase successfully.")
            except Exception as e:
                logger.warning(f"Failed to initialize Supabase client: {e}. Running in local file fallback mode.")
        else:
            logger.info("Supabase credentials not found in ENV. Operating in LOCAL_JSON fallback mode.")

    def _save_local_fallback(self, filename: str, data: any):
        """Saves data to frontend public folder so web dashboard can read it directly without backend"""
        base_dirs = [
            os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "data"),
            os.path.join(os.path.dirname(__file__), "..", "cache")
        ]
        for b_dir in base_dirs:
            try:
                os.makedirs(b_dir, exist_ok=True)
                target_file = os.path.join(b_dir, filename)
                sanitized_data = _sanitize_for_json(data)
                with open(target_file, "w", encoding="utf-8") as f:
                    json.dump(sanitized_data, f, indent=2, default=str)
                logger.info(f"Local fallback synced to: {target_file}")
            except Exception as e:
                logger.error(f"Error writing fallback file: {e}")

    def upsert_macro_telemetry(self, macro_data: dict):
        sanitized = _sanitize_for_json(macro_data)
        self._save_local_fallback("macro_telemetry.json", sanitized)
        if not self.client:
            return
        try:
            self.client.table("macro_telemetry").upsert(sanitized).execute()
            logger.info("Macro telemetry upserted to Supabase.")
        except Exception as e:
            logger.error(f"Supabase upsert error (macro): {e}")

    def upsert_idx_categorized(self, stocks_list: list):
        sanitized = _sanitize_for_json(stocks_list)
        self._save_local_fallback("idx_categorized.json", sanitized)
        if not self.client:
            return
        try:
            # Batch upsert
            self.client.table("idx_categorized").upsert(sanitized).execute()
            logger.info(f"Upserted {len(stocks_list)} categorized IDX equities to Supabase.")
        except Exception as e:
            logger.error(f"Supabase upsert error (idx_categorized): {e}")

    def upsert_crypto_spot_10(self, crypto_list: list):
        sanitized = _sanitize_for_json(crypto_list)
        self._save_local_fallback("crypto_spot_10.json", sanitized)
        if not self.client:
            return
        try:
            self.client.table("crypto_spot_10").upsert(sanitized).execute()
            logger.info(f"Upserted {len(crypto_list)} crypto spot pairs to Supabase.")
        except Exception as e:
            logger.error(f"Supabase upsert error (crypto_spot_10): {e}")

    def upsert_trade_plans(self, plans_list: list):
        sanitized = _sanitize_for_json(plans_list)
        self._save_local_fallback("daily_trade_plans.json", sanitized)
        if not self.client:
            return
        try:
            self.client.table("daily_trade_plans").upsert(sanitized).execute()
            logger.info(f"Upserted {len(plans_list)} trade plans to Supabase.")
        except Exception as e:
            logger.error(f"Supabase upsert error (daily_trade_plans): {e}")

    def sync_complete_bundle(self, bundle: dict):
        """Save master bundle into latest.json for ultra-fast single-request web load"""
        from datetime import timezone
        now_utc = datetime.now(timezone.utc).isoformat()
        bundle["last_updated"] = now_utc
        sanitized = _sanitize_for_json(bundle)
        self._save_local_fallback("latest_cockpit_bundle.json", sanitized)
        if self.client:
            try:
                self.client.table("system_state").upsert({
                    "key": "LATEST_COCKPIT_BUNDLE",
                    "val": sanitized,
                    "updated_at": now_utc
                }).execute()
            except Exception as e:
                logger.error(f"Supabase upsert error (system_state): {e}")
