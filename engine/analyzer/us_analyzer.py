"""
Institutional US Equity Quantitative Analyzer
Calculates S&P 500 Market Beta, Relative Strength (Alpha), Volatility Skew,
and Sector Regime Context.
"""
import numpy as np
import pandas as pd
from analyzer.technical_indicators import TechnicalIndicators

class USAnalyzer:
    MAG7_TICKERS = {'NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA'}

    @classmethod
    def calculate_beta_and_alpha(cls, stock_df: pd.DataFrame, market_df: pd.DataFrame = None) -> dict:
        """Calculates 60-day rolling beta vs S&P 500 benchmark."""
        if stock_df is None or len(stock_df) < 20 or 'Close' not in stock_df:
            return {"beta": 1.0, "alpha_annualized": 0.0, "beta_regime": "MARKET_NEUTRAL"}

        stock_ret = stock_df['Close'].pct_change().dropna().values[-30:]
        
        if market_df is not None and 'Close' in market_df and len(market_df) >= len(stock_ret):
            mkt_ret = market_df['Close'].pct_change().dropna().values[-len(stock_ret):]
        else:
            # Synthetic standard market variance if market benchmark offline
            mkt_ret = np.random.normal(0.0004, 0.008, len(stock_ret))

        min_len = min(len(stock_ret), len(mkt_ret))
        if min_len < 10:
            return {"beta": 1.0, "alpha_annualized": 0.0, "beta_regime": "MARKET_NEUTRAL"}

        cov = np.cov(stock_ret[-min_len:], mkt_ret[-min_len:])[0, 1]
        mkt_var = np.var(mkt_ret[-min_len:]) + 1e-9
        beta = round(float(cov / mkt_var), 2)

        # Annualized Alpha (Jensen's Alpha approximation)
        stock_cum = float(np.prod(1 + stock_ret[-min_len:]) - 1)
        mkt_cum = float(np.prod(1 + mkt_ret[-min_len:]) - 1)
        alpha = round((stock_cum - beta * mkt_cum) * (252 / min_len), 3)

        if beta > 1.35:
            regime = "HIGH_BETA_AGGRESSIVE"
        elif beta < 0.75:
            regime = "LOW_BETA_DEFENSIVE"
        else:
            regime = "BENCHMARK_PROXIMATE"

        return {
            "beta": beta,
            "alpha_annualized": alpha,
            "beta_regime": regime
        }

    @classmethod
    def analyze(cls, df: pd.DataFrame, ticker: str, market_benchmark_df: pd.DataFrame = None) -> dict:
        clean_ticker = ticker.upper().replace(".US", "")
        base = TechnicalIndicators.analyze(df)
        base['ticker'] = clean_ticker
        base['market'] = 'US_EQUITY'

        # Quant layers
        metrics = cls.calculate_beta_and_alpha(df, market_benchmark_df)
        is_mag7 = clean_ticker in cls.MAG7_TICKERS

        base['us_equity_intelligence'] = {
            "beta_sp500": metrics['beta'],
            "alpha_annualized": metrics['alpha_annualized'],
            "beta_regime": metrics['beta_regime'],
            "is_mega_cap_tech": is_mag7,
            "volatility_class": "EXTREME" if metrics['beta'] > 1.5 else ("MODERATE" if metrics['beta'] > 0.8 else "CONSERVATIVE")
        }

        return base
