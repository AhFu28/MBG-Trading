import math
import json
import os
import pandas as pd
import numpy as np

class BacktestEngine:
    def __init__(self, history_dfs=None, initial_capital=100_000_000, fee_buy=0.0015, fee_sell=0.0025, slippage=0.002):
        self.history_dfs = history_dfs or {}
        self.initial_capital = initial_capital
        self.fee_buy = fee_buy
        self.fee_sell = fee_sell
        self.slippage = slippage
        
        self.archetypes = [
            'BREAKOUT',
            'OVERSOLD_REBOUND',
            'FOREIGN_FLOW_MOMENTUM',
            'DIVIDEND_PLAY',
            'MEAN_REVERSION'
        ]

    def _compute_indicators(self, df):
        df['MA20'] = df['Close'].rolling(20).mean()
        df['MA50'] = df['Close'].rolling(50).mean()
        df['volume_sma20'] = df['Volume'].rolling(20).mean()
        
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
        rs = gain / (loss + 1e-9)
        df['RSI'] = 100 - (100 / (1 + rs))
        
        df['BB_middle'] = df['Close'].rolling(20).mean()
        df['BB_std'] = df['Close'].rolling(20).std()
        df['BB_lower'] = df['BB_middle'] - 2 * df['BB_std']
        
        return df

    def _get_signals(self, df, archetype):
        close = df['Close']
        volume = df['Volume']
        MA20 = df['MA20']
        MA50 = df['MA50']
        volume_sma20 = df['volume_sma20']
        RSI = df['RSI']
        BB_lower = df['BB_lower']

        if archetype == 'BREAKOUT':
            return (close > MA20) & (volume > volume_sma20 * 2.0)
        elif archetype == 'OVERSOLD_REBOUND':
            return (RSI < 35) & (close > BB_lower)
        elif archetype == 'FOREIGN_FLOW_MOMENTUM':
            return (close > MA50) & (volume > volume_sma20 * 1.5)
        elif archetype == 'DIVIDEND_PLAY':
            return (RSI < 45) & (close > MA50)
        elif archetype == 'MEAN_REVERSION':
            return (RSI < 30) | (close < BB_lower)
        return pd.Series(False, index=df.index)

    def _simulate_trade(self, df, entry_idx, entry_price, sl_price, tp1_price, tp2_price):
        """Resolve a trade using real subsequent candles."""
        for idx in range(entry_idx + 1, min(entry_idx + 30, len(df))):  # max 30 day hold
            low = df['Low'].iloc[idx]
            high = df['High'].iloc[idx]
            
            if low <= sl_price:
                exit_price = sl_price * (1 - self.slippage)
                return {'result': 'LOSS', 'exit_price': exit_price, 'exit_idx': idx, 
                        'return_pct': ((exit_price * (1-self.fee_sell)) / (entry_price * (1+self.fee_buy)) - 1) * 100}
            
            if high >= tp1_price:
                exit_price = tp1_price * (1 - self.slippage)
                return {'result': 'WIN_TP1', 'exit_price': exit_price, 'exit_idx': idx,
                        'return_pct': ((exit_price * (1-self.fee_sell)) / (entry_price * (1+self.fee_buy)) - 1) * 100}
        
        # Max hold period reached - exit at last close
        exit_price = df['Close'].iloc[min(entry_idx + 29, len(df)-1)]
        return {'result': 'TIMEOUT', 'exit_price': exit_price, 'exit_idx': min(entry_idx+29, len(df)-1),
                'return_pct': ((exit_price * (1-self.fee_sell)) / (entry_price * (1+self.fee_buy)) - 1) * 100}

    def run_archetype_backtest(self, archetype: str, n_trades: int = None) -> dict:
        all_trades = []
        
        # Process chronologically across all tickers if we want a true global equity curve
        # But grouping by ticker is fine for performance. We can sort trades by date later.
        
        for ticker, df in self.history_dfs.items():
            if len(df) < 50:
                continue
                
            df = df.copy()
            df = self._compute_indicators(df)
            signals = self._get_signals(df, archetype)
            signal_indices = np.where(signals)[0]
            
            i = 0
            while i < len(signal_indices):
                entry_idx = signal_indices[i]
                if entry_idx >= len(df) - 1:
                    break
                
                entry_price = df['Close'].iloc[entry_idx]
                sl_price = entry_price * 0.95
                tp1_price = entry_price * 1.05
                tp2_price = entry_price * 1.10
                
                trade = self._simulate_trade(df, entry_idx, entry_price, sl_price, tp1_price, tp2_price)
                # Store entry time for sorting
                trade['entry_time'] = df.index[entry_idx] if isinstance(df.index, pd.DatetimeIndex) else entry_idx
                all_trades.append(trade)
                
                exit_idx = trade['exit_idx']
                next_i = i + 1
                while next_i < len(signal_indices) and signal_indices[next_i] <= exit_idx:
                    next_i += 1
                i = next_i
                
        # Sort trades by entry_time to build chronological equity curve
        all_trades.sort(key=lambda x: x['entry_time'] if isinstance(x['entry_time'], pd.Timestamp) else x['entry_time'])
        if n_trades and len(all_trades) > n_trades:
            all_trades = all_trades[:n_trades]
        
        if not all_trades:
            return {
                "win_rate_pct": 0.0,
                "avg_return_pct": 0.0,
                "sharpe_ratio": 0.0,
                "sortino_ratio": 0.0,
                "max_drawdown_pct": 0.0,
                "total_trades": 0,
                "equity_curve": [1.0] * 30,
                "sample_trades": []
            }
            
        wins = [t for t in all_trades if t['return_pct'] > 0]
        win_rate = (len(wins) / len(all_trades)) * 100
        returns = [t['return_pct'] for t in all_trades]
        avg_return = np.mean(returns)
        std_return = np.std(returns) if len(returns) > 1 else 0.0
        
        sharpe_ratio = 0.0
        if std_return > 0:
            sharpe_ratio = (avg_return) / std_return * math.sqrt(252)

        downside_returns = [r for r in returns if r < 0]
        downside_std = np.std(downside_returns) if len(downside_returns) > 1 else (std_return if std_return > 0 else 1e-6)
        sortino_ratio = (avg_return / downside_std * math.sqrt(252)) if downside_std > 0 else 0.0
            
        equity = 1.0
        equity_curve_all = [equity]
        peak_equity = equity
        max_drawdown = 0.0
        
        for t in all_trades:
            equity *= (1 + t['return_pct'] / 100.0)
            equity_curve_all.append(equity)
            if equity > peak_equity:
                peak_equity = equity
            dd = (peak_equity - equity) / peak_equity * 100
            if dd > max_drawdown:
                max_drawdown = dd
                
        step = max(1, len(equity_curve_all) // 30)
        equity_curve_sampled = equity_curve_all[::step][:30]
        while len(equity_curve_sampled) < 30:
            equity_curve_sampled.append(equity_curve_sampled[-1] if equity_curve_sampled else 1.0)
            
        # Format sample trades to avoid non-serializable datetimes
        sample_trades_clean = []
        for t in all_trades[:5]:
            clean_t = t.copy()
            if 'entry_time' in clean_t and isinstance(clean_t['entry_time'], pd.Timestamp):
                clean_t['entry_time'] = str(clean_t['entry_time'])
            sample_trades_clean.append(clean_t)

        return {
            "win_rate_pct": float(win_rate),
            "avg_return_pct": float(avg_return),
            "sharpe_ratio": float(sharpe_ratio),
            "sortino_ratio": float(sortino_ratio),
            "max_drawdown_pct": float(max_drawdown),
            "total_trades": int(len(all_trades)),
            "equity_curve": [float(x) for x in equity_curve_sampled[:30]],
            "sample_trades": sample_trades_clean
        }

    def run_all_archetypes(self) -> dict:
        results = {}
        for archetype in self.archetypes:
            results[archetype] = self.run_archetype_backtest(archetype)
        return results

    def save_to_cache(self, output_dict):
        cache_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'cache')
        os.makedirs(cache_dir, exist_ok=True)
        file_path = os.path.join(cache_dir, 'backtest_results.json')
        with open(file_path, 'w') as f:
            json.dump(output_dict, f, indent=4)
        return file_path

if __name__ == '__main__':
    # Test script if run directly
    engine = BacktestEngine()
    results = engine.run_all_archetypes()
    print(json.dumps(results, indent=2))
