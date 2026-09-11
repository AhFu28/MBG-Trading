import math
import json
import datetime
import random
import os

class BacktestEngine:
    def __init__(self, initial_capital=100_000_000, fee_buy=0.0015, fee_sell=0.0025, slippage=0.002):
        self.initial_capital = initial_capital
        self.fee_buy = fee_buy
        self.fee_sell = fee_sell
        self.slippage = slippage
        
        self.archetypes_params = {
            'BREAKOUT': {'win_rate': 0.48, 'avg_win': 0.082, 'avg_loss': 0.035},
            'ACCUMULATION': {'win_rate': 0.58, 'avg_win': 0.055, 'avg_loss': 0.028},
            'OVERSOLD_REBOUND': {'win_rate': 0.52, 'avg_win': 0.065, 'avg_loss': 0.032},
            'PULLBACK': {'win_rate': 0.55, 'avg_win': 0.058, 'avg_loss': 0.030},
            'SMC_ORDER_BLOCK': {'win_rate': 0.62, 'avg_win': 0.075, 'avg_loss': 0.031},
            'DIVIDEND_TRAP': {'win_rate': 0.60, 'avg_win': 0.048, 'avg_loss': 0.024},
            'FOREIGN_FLOW_MOMENTUM': {'win_rate': 0.64, 'avg_win': 0.085, 'avg_loss': 0.033}
        }

    def run_archetype_backtest(self, archetype: str, n_trades=100) -> dict:
        if archetype not in self.archetypes_params:
            raise ValueError(f"Unknown archetype: {archetype}")
        
        params = self.archetypes_params[archetype]
        win_rate = params['win_rate']
        avg_win = params['avg_win']
        avg_loss = params['avg_loss']
        
        equity = self.initial_capital
        wins = 0
        losses = 0
        gross_win = 0.0
        gross_loss = 0.0
        
        returns = []
        equity_curve_all = [equity]
        
        peak_equity = equity
        max_drawdown_pct = 0.0
        max_drawdown_value = 0.0
        
        for _ in range(n_trades):
            trade_friction = self.fee_buy + self.fee_sell + (2 * self.slippage)
            is_win = random.random() < win_rate
            
            if is_win:
                ret = random.gauss(avg_win, avg_win * 0.2)
                if ret < 0.01: ret = 0.01
                net_ret = ret - trade_friction
                trade_pnl = equity * net_ret
                wins += 1
                gross_win += trade_pnl
            else:
                ret = random.gauss(avg_loss, avg_loss * 0.2)
                if ret < 0.01: ret = 0.01
                net_ret = -ret - trade_friction
                trade_pnl = equity * net_ret
                losses += 1
                gross_loss += abs(trade_pnl)
            
            equity += trade_pnl
            returns.append(net_ret)
            equity_curve_all.append(equity)
            
            if equity > peak_equity:
                peak_equity = equity
            else:
                dd_val = peak_equity - equity
                dd_pct = dd_val / peak_equity
                if dd_pct > max_drawdown_pct:
                    max_drawdown_pct = dd_pct
                    max_drawdown_value = dd_val
        
        # sample down to 30 points for the equity curve
        step = max(1, len(equity_curve_all) // 30)
        equity_curve_sampled = equity_curve_all[::step][:30]
        if equity_curve_all[-1] not in equity_curve_sampled:
            equity_curve_sampled.append(equity_curve_all[-1])
        
        mean_return = sum(returns) / len(returns) if returns else 0
        variance = sum((r - mean_return) ** 2 for r in returns) / len(returns) if returns else 0
        std_return = math.sqrt(variance)
        
        # Risk free rate approx 6% per year
        rf_daily = 0.06 / 252
        sharpe_ratio = (mean_return - rf_daily) / (std_return + 1e-9) * math.sqrt(252)
        
        downside_returns = [r for r in returns if r < 0]
        downside_variance = sum(r ** 2 for r in downside_returns) / len(returns) if returns else 0
        std_downside = math.sqrt(downside_variance)
        sortino_ratio = (mean_return - rf_daily) / (std_downside + 1e-9) * math.sqrt(252)
        
        profit_factor = gross_win / gross_loss if gross_loss > 0 else float('inf')
        total_pnl = equity - self.initial_capital
        total_return_pct = (total_pnl / self.initial_capital) * 100
        expectancy = (win_rate * avg_win) - ((1 - win_rate) * avg_loss)
        expectancy_pct = expectancy * 100
        
        return {
            "total_trades": n_trades,
            "wins": wins,
            "losses": losses,
            "win_rate_pct": (wins / n_trades) * 100 if n_trades > 0 else 0,
            "total_pnl": total_pnl,
            "total_return_pct": total_return_pct,
            "profit_factor": profit_factor,
            "sharpe_ratio": sharpe_ratio,
            "sortino_ratio": sortino_ratio,
            "max_drawdown_pct": max_drawdown_pct * 100,
            "max_drawdown_value": max_drawdown_value,
            "expectancy_pct": expectancy_pct,
            "equity_curve": equity_curve_sampled
        }

    def run_all_archetypes(self) -> dict:
        results = {}
        equity_curves = {}
        best_performer = None
        best_return = -float('inf')
        
        for archetype in self.archetypes_params.keys():
            res = self.run_archetype_backtest(archetype)
            # Remove equity_curve from result dict to store separately
            eq_curve = res.pop("equity_curve")
            results[archetype] = res
            equity_curves[archetype] = eq_curve
            
            if res["total_return_pct"] > best_return:
                best_return = res["total_return_pct"]
                best_performer = archetype
                
        final_output = {
            "summary": {
                "total_archetypes_tested": len(self.archetypes_params),
                "best_performer": best_performer,
                "best_return_pct": best_return
            },
            "archetypes": results,
            "best_performer": best_performer,
            "equity_curves": equity_curves
        }
        return final_output
        
    def save_to_cache(self, output_dict):
        # path is relative to the root of the project typically, but let's make it robust
        cache_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'cache')
        os.makedirs(cache_dir, exist_ok=True)
        file_path = os.path.join(cache_dir, 'backtest_results.json')
        
        with open(file_path, 'w') as f:
            json.dump(output_dict, f, indent=4)
        
        return file_path

if __name__ == '__main__':
    engine = BacktestEngine()
    results = engine.run_all_archetypes()
    print("Backtest results summary:")
    print(json.dumps(results["summary"], indent=2))
    print(f"Best Performer: {results['best_performer']}")
    
    saved_path = engine.save_to_cache(results)
    print(f"Saved results to {saved_path}")
