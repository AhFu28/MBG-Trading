import unittest
import pandas as pd
import numpy as np
import os
import sys

# Ensure engine is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from analyzer.smc_detector import SMCDetector
from analyzer.paper_portfolio import PaperPortfolio
from analyzer.exp3_bandit import Exp3StrategyBandit
from analyzer.backtest_engine import BacktestEngine
from fetchers.crypto_spot import CryptoSpotFetcher

class TestMBGCoreSmoke(unittest.TestCase):
    def test_smc_break_of_structure_bullish(self):
        """Verify BOS detection correctly excludes the current candle from swing high lookback."""
        detector = SMCDetector()
        # Create a series where prior 20 bars high was 100, and last bar breaks out to 105
        dates = pd.date_range('2026-01-01', periods=30, freq='D')
        highs = [95] * 29 + [105]
        lows = [85] * 29 + [95]
        closes = [90] * 29 + [104]
        df = pd.DataFrame({'High': highs, 'Low': lows, 'Close': closes}, index=dates)
        
        bos = detector.detect_break_of_structure(df, lookback=20)
        self.assertEqual(bos['direction'], 'BULLISH')
        self.assertEqual(bos['break_level'], 95.0)

    def test_smc_break_of_structure_bearish(self):
        """Verify BOS detection detects bearish breakdown."""
        detector = SMCDetector()
        dates = pd.date_range('2026-01-01', periods=30, freq='D')
        highs = [100] * 29 + [90]
        lows = [90] * 29 + [75]
        closes = [95] * 29 + [76]
        df = pd.DataFrame({'High': highs, 'Low': lows, 'Close': closes}, index=dates)
        
        bos = detector.detect_break_of_structure(df, lookback=20)
        self.assertEqual(bos['direction'], 'BEARISH')
        self.assertEqual(bos['break_level'], 90.0)

    def test_paper_portfolio_cash_cap_and_friction(self):
        """Verify paper portfolio caps position allocation and applies 0.4% IDX fee on exit."""
        portfolio = PaperPortfolio(initial_capital=100_000_000, risk_pct=0.02)
        portfolio.trades = []
        
        # Test open trade duplicate prevention
        t1 = portfolio.open_trade('BBCA', 10000, 9500, 11000, 12000, 'Astra')
        self.assertIsNotNone(t1)
        self.assertEqual(t1['ticker'], 'BBCA')
        
        # Duplicate trade should return existing trade and not duplicate
        t2 = portfolio.open_trade('BBCA', 10000, 9500, 11000, 12000, 'Astra')
        self.assertEqual(t1['id'], t2['id'])
        self.assertEqual(len(portfolio.trades), 1)
        
        # Simulate price hitting TP1
        portfolio.trades[0]['status'] = 'ACTIVE'
        changes = portfolio.check_and_update_trades({'BBCA': 11200})
        self.assertTrue(any(c['new_status'] == 'TP1_HIT' for c in changes))
        
        # Verify 0.4% fee applied: gross = (11000 - 10000)*lots*100, cost = 10000*lots*100
        closed_trade = portfolio.trades[0]
        cost_basis = closed_trade['entry_price'] * closed_trade['lots'] * 100
        gross_pnl = (11000 - 10000) * closed_trade['lots'] * 100
        expected_net_pnl = gross_pnl - (cost_basis * 0.004)
        self.assertAlmostEqual(closed_trade['pnl'], expected_net_pnl, delta=0.01)

    def test_exp3_bandit_normalized_rewards(self):
        """Verify EXP3 bandit handles rewards without exponent overflow."""
        bandit = Exp3StrategyBandit()
        bandit.update_reward('Astra', 0.05)
        bandit.update_reward('AlphaHunter', -0.02)
        rankings = bandit.get_rankings()
        self.assertIsInstance(rankings, list)
        self.assertGreater(len(rankings), 0)

    def test_backtest_sortino_ratio(self):
        """Verify backtest engine calculates Sortino and Sharpe ratios cleanly."""
        engine = BacktestEngine()
        res = engine.run_archetype_backtest('BREAKOUT', n_trades=30)
        self.assertIn('sharpe_ratio', res)
        self.assertIn('sortino_ratio', res)
        self.assertFalse(np.isnan(res['sharpe_ratio']))
        self.assertFalse(np.isnan(res['sortino_ratio']))

if __name__ == '__main__':
    unittest.main()
