import logging
from datetime import datetime, timezone, timedelta

try:
    import yfinance as yf
    import pandas as pd
except ImportError:
    yf = None
    pd = None

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
            if yf:
                data = yf.download(self.tickers, period='3mo', interval='1d', group_by='ticker', progress=False)
                sector_changes = {s: [] for s in self.universe.keys()}
                
                for sector, t_list in self.universe.items():
                    for t in t_list:
                        if t in (data.columns.levels[0] if isinstance(data.columns, pd.MultiIndex) else data):
                            df = data[t] if isinstance(data.columns, pd.MultiIndex) else data
                            df = df.dropna()
                            if df.empty:
                                continue
                                
                            history_dfs[t] = df
                            
                            close = float(df['Close'].iloc[-1])
                            prev_close = float(df['Close'].iloc[-2]) if len(df) > 1 else close
                            change_pct = round(((close - prev_close) / prev_close) * 100, 2)
                            sector_changes[sector].append(change_pct)
                            
                            high_52w = round(float(df['Close'].max()), 2)
                            dist_52w = round(float((close - high_52w) / high_52w * 100), 2)
                            
                            stocks.append({
                                'ticker': t,
                                'name': t,
                                'sector': sector,
                                'price': round(close, 2),
                                'change_pct': float(change_pct),
                                'market_cap': 0,
                                'pe_ratio': 0,
                                'eps': 0,
                                'volume': float(df['Volume'].iloc[-1]),
                                'avg_volume_10d': float(df['Volume'].tail(10).mean()),
                                'high_52w': high_52w,
                                'low_52w': round(float(df['Close'].min()), 2),
                                'distance_from_52w_high_pct': dist_52w,
                                'rsi_14': 50,
                                'sma20': round(float(df['Close'].tail(20).mean()), 2) if len(df) >= 20 else 0,
                                'sma50': round(float(df['Close'].tail(50).mean()), 2) if len(df) >= 50 else 0,
                                'sma200': round(float(df['Close'].tail(200).mean()), 2) if len(df) >= 200 else 0,
                                'setup_type': 'PULLBACK_SUPPORT' if change_pct < -0.5 else 'BREAKOUT' if change_pct > 1.5 else 'CONSOLIDATION',
                                'entry_price': round(close, 2),
                                'stop_loss': round(close * 0.96, 2),
                                'take_profit_1': round(close * 1.08, 2),
                                'risk_reward_ratio': 2.0,
                                'data_source': 'yfinance_live',
                                'updated_at': datetime.now(timezone.utc).isoformat()
                            })
                
                for s, changes in sector_changes.items():
                    if changes:
                        sector_perf[s] = round(sum(changes) / len(changes), 2)
                        
        except Exception as e:
            logger.warning(f"Error fetching US market data via yfinance: {e}")

        # Deterministic benchmark fallback when yfinance is completely unreachable
        if not stocks:
            sample_prices = {
                'AAPL': 228.5, 'NVDA': 128.2, 'MSFT': 442.0, 'META': 515.0, 'GOOGL': 168.0,
                'AMD': 152.0, 'AVGO': 165.0, 'CRM': 255.0, 'PLTR': 32.5, 'SMCI': 480.0,
                'AMZN': 188.0, 'TSLA': 245.0, 'NFLX': 685.0, 'COIN': 210.0, 'SOFI': 8.2,
                'JPM': 212.0, 'GS': 490.0, 'V': 275.0, 'MA': 465.0,
                'UNH': 570.0, 'JNJ': 162.0, 'PFE': 28.5, 'LLY': 940.0,
                'XOM': 118.0, 'CVX': 148.0,
                'BA': 175.0, 'GE': 185.0, 'CAT': 365.0,
                'MU': 112.0, 'INTC': 21.5, 'ARM': 135.0
            }
            sector_changes = {s: [] for s in self.universe.keys()}
            for sector, t_list in self.universe.items():
                for t in t_list:
                    px = sample_prices.get(t, 100.0)
                    chg = 0.0
                    sector_changes[sector].append(chg)
                    sl = round(px * 0.96, 2)
                    tp = round(px * 1.08, 2)
                    stocks.append({
                        'ticker': t,
                        'name': t,
                        'sector': sector,
                        'price': px,
                        'change_pct': chg,
                        'market_cap': 0,
                        'pe_ratio': 0,
                        'eps': 0,
                        'volume': 0,
                        'avg_volume_10d': 0,
                        'high_52w': round(px * 1.15, 2),
                        'low_52w': round(px * 0.75, 2),
                        'distance_from_52w_high_pct': -10.0,
                        'rsi_14': 50.0,
                        'sma20': round(px * 0.98, 2),
                        'sma50': round(px * 0.95, 2),
                        'sma200': round(px * 0.90, 2),
                        'setup_type': 'CONSOLIDATION',
                        'entry_price': px,
                        'stop_loss': sl,
                        'take_profit_1': tp,
                        'risk_reward_ratio': 2.0,
                        'data_source': 'offline_benchmark',
                        'updated_at': datetime.now(timezone.utc).isoformat()
                    })

        return {
            'stocks': stocks,
            'earnings_calendar': earnings_cal,
            'sector_performance': sector_perf,
            'history_dfs': history_dfs,
            'updated_at': datetime.now(timezone.utc).isoformat()
        }
