import logging
import yfinance as yf
import pandas as pd
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class USMarketFetcher:
    def __init__(self):
        self.universe = {
            'TECHNOLOGY': ['AAPL', 'NVDA', 'MSFT', 'META', 'GOOGL', 'AMD', 'AVGO', 'CRM', 'PLTR', 'SMCI'],
            'CONSUMER': ['AMZN', 'TSLA', 'NFLX', 'COIN', 'SOFI'],
            'FINANCE': ['JPM', 'GS', 'V', 'MA'],
            'HEALTHCARE': ['UNH', 'JNJ', 'PFE', 'LLY'],
            'ENERGY': ['XOM', 'CVX'],
            'INDUSTRIAL': ['BA', 'GE', 'CAT'],
            'SEMICONDUCTOR': ['MU', 'INTC', 'ARM']
        }
        self.tickers = [t for v in self.universe.values() for t in v]

    def execute(self):
        history_dfs = {}
        stocks = []
        sector_perf = {}
        earnings_cal = []
        
        try:
            data = yf.download(self.tickers, period='3mo', interval='1d', group_by='ticker')
            
            sector_changes = {s: [] for s in self.universe.keys()}
            
            for sector, t_list in self.universe.items():
                for t in t_list:
                    if t in data.columns.levels[0] if isinstance(data.columns, pd.MultiIndex) else data:
                        df = data[t] if isinstance(data.columns, pd.MultiIndex) else data
                        df = df.dropna()
                        if df.empty:
                            continue
                            
                        history_dfs[t] = df
                        
                        close = df['Close'].iloc[-1]
                        prev_close = df['Close'].iloc[-2] if len(df) > 1 else close
                        change_pct = ((close - prev_close) / prev_close) * 100
                        sector_changes[sector].append(change_pct)
                        
                        stocks.append({
                            'ticker': t,
                            'name': t,
                            'sector': sector,
                            'price': float(close),
                            'change_pct': float(change_pct),
                            'market_cap': 0,
                            'pe_ratio': 0,
                            'eps': 0,
                            'volume': float(df['Volume'].iloc[-1]),
                            'avg_volume_10d': float(df['Volume'].tail(10).mean()),
                            'high_52w': float(df['Close'].max()),
                            'low_52w': float(df['Close'].min()),
                            'distance_from_52w_high_pct': float((close - df['Close'].max()) / df['Close'].max() * 100),
                            'rsi_14': 50,
                            'sma20': float(df['Close'].tail(20).mean()) if len(df) >= 20 else 0,
                            'sma50': float(df['Close'].tail(50).mean()) if len(df) >= 50 else 0,
                            'sma200': float(df['Close'].tail(200).mean()) if len(df) >= 200 else 0,
                            'setup_type': 'NEUTRAL',
                            'entry_price': float(close),
                            'stop_loss': float(close * 0.95),
                            'take_profit_1': float(close * 1.1),
                            'risk_reward_ratio': 2.0,
                            'updated_at': datetime.now(timezone.utc).isoformat()
                        })
            
            for s, changes in sector_changes.items():
                if changes:
                    sector_perf[s] = sum(changes) / len(changes)
                    
        except Exception as e:
            logger.warning(f"Error fetching US market data: {e}")

        return {
            'stocks': stocks,
            'earnings_calendar': earnings_cal,
            'sector_performance': sector_perf,
            'history_dfs': history_dfs,
            'updated_at': datetime.now(timezone.utc).isoformat()
        }
