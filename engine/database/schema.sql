-- ==========================================================
-- MARKET BRAIN GRID & COCKPIT - SUPABASE SCHEMA (SQL DDL)
-- Designed for In-Place Upsert & Zero-Cost Free Tier Longevity
-- ==========================================================

-- 1. Macro & Global News Impact Radar
CREATE TABLE IF NOT EXISTS macro_telemetry (
    id TEXT PRIMARY KEY, -- e.g. 'GLOBAL_LATEST' for in-place upsert
    headline TEXT NOT NULL,
    source TEXT,
    event_category TEXT, -- 'FED', 'TRUMP', 'OIL', 'GOLD', 'GEOPOLITICAL'
    sentiment TEXT, -- 'HAWKISH', 'DOVISH', 'BULLISH', 'BEARISH', 'NEUTRAL'
    gold_price NUMERIC,
    brent_oil_price NUMERIC,
    dxy_index NUMERIC,
    us10y_yield NUMERIC,
    idx_affected_sectors JSONB, -- e.g. ["MINING", "OIL_GAS", "BANKING"]
    idx_affected_stocks JSONB,  -- e.g. [{"ticker": "ANTM", "impact": "BULLISH", "reason": "Gold rally"}]
    full_narrative TEXT,
    severity TEXT, -- 'CRITICAL', 'HIGH', 'NORMAL'
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Categorized IDX Equities (Conglo, Dividend, Foreign Flow)
CREATE TABLE IF NOT EXISTS idx_categorized (
    ticker TEXT PRIMARY KEY,
    company_name TEXT,
    category TEXT NOT NULL, -- 'CONGLOMERATE', 'DIVIDEND_HUNTER', 'FOREIGN_FLOW'
    sub_category TEXT,      -- e.g. 'SALIM_GROUP', 'BARITO_GROUP', 'HIGH_YIELD'
    price NUMERIC NOT NULL,
    change_pct NUMERIC,
    volume BIGINT,
    foreign_net_val_idr NUMERIC, -- Net Foreign Buy(+) / Sell(-) in IDR
    dividend_yield_pct NUMERIC,
    dividend_trap_risk TEXT,    -- 'LOW', 'MEDIUM', 'HIGH_RISK'
    ma20 NUMERIC,
    ma50 NUMERIC,
    rsi_14 NUMERIC,
    technical_signal TEXT,      -- 'BREAKOUT', 'ACCUMULATION', 'OVERSOLD', 'PULLBACK'
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Top 10 Recommended Crypto Spot Pairs (USDT)
CREATE TABLE IF NOT EXISTS crypto_spot_10 (
    rank INT PRIMARY KEY,
    pair TEXT NOT NULL UNIQUE,  -- e.g. 'BTC/USDT', 'SOL/USDT'
    current_price NUMERIC NOT NULL,
    change_24h_pct NUMERIC,
    setup_type TEXT,            -- 'SUPPORT_RETEST', 'CONSOLIDATION_BREAKOUT', 'MOMENTUM'
    entry_low NUMERIC NOT NULL,
    entry_high NUMERIC NOT NULL,
    take_profit_1 NUMERIC NOT NULL,
    take_profit_2 NUMERIC NOT NULL,
    stop_loss NUMERIC NOT NULL,
    risk_reward_ratio NUMERIC NOT NULL,
    conviction TEXT,            -- 'HIGH', 'MEDIUM'
    catalyst_thesis TEXT,
    invalidation_rule TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Daily Structured Trade Plans (Astra Standard)
CREATE TABLE IF NOT EXISTS daily_trade_plans (
    plan_id TEXT PRIMARY KEY,   -- e.g. 'PLAN-IDX-BBCA-20260908'
    symbol TEXT NOT NULL,
    market TEXT NOT NULL,       -- 'IDX' or 'CRYPTO'
    direction TEXT NOT NULL,    -- 'LONG'
    entry_price NUMERIC NOT NULL,
    stop_loss NUMERIC NOT NULL,
    target_1 NUMERIC NOT NULL,
    target_2 NUMERIC NOT NULL,
    position_size_math TEXT,
    risk_reward_ratio NUMERIC NOT NULL,
    facts_summary TEXT NOT NULL,
    opinion_thesis TEXT NOT NULL,
    three_invalidations JSONB,
    weakest_assumption TEXT,
    status TEXT DEFAULT 'AWAITING_HUMAN_REVIEW',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. System State & Execution Logs
CREATE TABLE IF NOT EXISTS system_state (
    key TEXT PRIMARY KEY,
    val JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning queries
CREATE INDEX IF NOT EXISTS idx_cat_category ON idx_categorized(category);
CREATE INDEX IF NOT EXISTS idx_cat_sub_category ON idx_categorized(sub_category);
CREATE INDEX IF NOT EXISTS idx_cat_foreign ON idx_categorized(foreign_net_val_idr);
CREATE INDEX IF NOT EXISTS idx_plans_created ON daily_trade_plans(created_at DESC);

-- Automatic Rolling Purge: Keep daily_trade_plans capped to 30 days
-- to permanently stay inside Supabase Free Tier limit (500MB)
CREATE OR REPLACE FUNCTION purge_old_records() RETURNS void AS $$
BEGIN
    DELETE FROM daily_trade_plans WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
