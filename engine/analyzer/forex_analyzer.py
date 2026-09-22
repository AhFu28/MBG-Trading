"""
Institutional Forex Quantitative Analyzer
Integrates Technical Confluence, Currency Strength Meter, Central Bank Carry Trade Differentials,
and Interbank Session Liquidity (London/NY/Asian).
"""
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from analyzer.technical_indicators import TechnicalIndicators

class ForexAnalyzer:
    # Benchmark central bank policy interest rates (%) for Carry Trade calculation
    CENTRAL_BANK_RATES = {
        'USD': 5.25,
        'EUR': 3.75,
        'GBP': 5.00,
        'JPY': 0.25,
        'AUD': 4.35,
        'CAD': 4.75,
        'CHF': 1.25,
        'NZD': 5.25
    }

    @classmethod
    def get_market_session(cls) -> dict:
        """Determines active interbank trading session from UTC hour."""
        utc_hour = datetime.now(timezone.utc).hour
        is_asian = 0 <= utc_hour < 9
        is_london = 7 <= utc_hour < 16
        is_new_york = 12 <= utc_hour < 21
        is_overlap = is_london and is_new_york # Peak institutional liquidity

        session_name = "NEW_YORK" if is_new_york else ("LONDON" if is_london else "ASIAN")
        if is_overlap:
            session_name = "LONDON_NY_OVERLAP"

        return {
            "session": session_name,
            "is_peak_liquidity": is_overlap,
            "utc_hour": utc_hour
        }

    @classmethod
    def calculate_carry_bias(cls, base_curr: str, quote_curr: str) -> dict:
        """Calculates interest rate differential and carry trade edge (Kathy Lien 2015)."""
        r_base = cls.CENTRAL_BANK_RATES.get(base_curr.upper(), 3.0)
        r_quote = cls.CENTRAL_BANK_RATES.get(quote_curr.upper(), 3.0)
        diff = round(r_base - r_quote, 2)

        if diff >= 1.5:
            bias = "STRONG_POSITIVE_CARRY" # Long yields positive swap
        elif diff > 0:
            bias = "POSITIVE_CARRY"
        elif diff <= -1.5:
            bias = "STRONG_NEGATIVE_CARRY" # Short yields positive swap
        else:
            bias = "NEUTRAL_CARRY"

        return {
            "rate_diff_pct": diff,
            "carry_bias": bias,
            "base_rate": r_base,
            "quote_rate": r_quote
        }

    @classmethod
    def analyze(cls, df: pd.DataFrame, pair: str) -> dict:
        clean_pair = pair.upper().replace("/", "").replace("=X", "")
        base = TechnicalIndicators.analyze(df)
        base['pair'] = clean_pair
        base['market'] = 'FOREX'

        # Parse currencies
        base_curr = clean_pair[:3] if len(clean_pair) >= 6 else "EUR"
        quote_curr = clean_pair[3:6] if len(clean_pair) >= 6 else "USD"

        # Integrate institutional macro layers
        carry = cls.calculate_carry_bias(base_curr, quote_curr)
        session = cls.get_market_session()

        # Pip value / pip volatility
        atr = base.get('atr_14', 0.0010)
        pip_scale = 0.01 if 'JPY' in clean_pair else 0.0001
        atr_pips = round(atr / pip_scale, 1)

        base['forex_intelligence'] = {
            "base_currency": base_curr,
            "quote_currency": quote_curr,
            "carry": carry,
            "session": session,
            "atr_pips": atr_pips,
            "pip_scale": pip_scale
        }

        # Composite macro-technical score (-100 to +100)
        tech_score = base.get('confluence_score', 50)
        carry_adj = 15 if "POSITIVE" in carry['carry_bias'] else (-15 if "NEGATIVE" in carry['carry_bias'] else 0)
        base['institutional_fx_score'] = max(0, min(100, tech_score + carry_adj))

        return base
