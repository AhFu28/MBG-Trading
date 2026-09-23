import unittest
import os
import sys
import json

# Ensure engine is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mcp.mbg_server import (
    tool_get_orderbook,
    tool_calc_bandarmology,
    tool_get_macro_transmission,
    tool_validate_strategy_spec,
    tool_get_bot_arena_status,
    handle_request
)

class TestMBGMcpServer(unittest.TestCase):
    def test_orderbook_metrics(self):
        ob = tool_get_orderbook("BBCA", levels=5)
        self.assertEqual(ob["ticker"], "BBCA")
        self.assertGreater(ob["best_ask"], ob["best_bid"])
        self.assertIn("spread_idr", ob)
        self.assertIn("queue_imbalance", ob)
        self.assertEqual(len(ob["bids"]), 5)
        self.assertEqual(len(ob["asks"]), 5)

    def test_calc_bandarmology(self):
        res = tool_calc_bandarmology("BBCA")
        self.assertEqual(res["ticker"], "BBCA")
        self.assertGreater(res["bcr3_pct"], 0)
        self.assertGreater(res["hhi_index"], 0)
        self.assertIn(res["accumulation_grade"], ["MONOPOLY_ACCUMULATION", "MODERATE_ACCUMULATION", "RETAIL_DISPERSED"])

    def test_macro_transmission(self):
        res = tool_get_macro_transmission()
        self.assertIn("DXY", res["macro_instruments"])
        self.assertIn("US10Y", res["macro_instruments"])
        self.assertGreater(len(res["sector_transmission_impact"]), 0)

    def test_validate_strategy_spec(self):
        valid_spec = {
            "strategy_id": "MOMENTUM-01",
            "objective": "Capture trend continuation",
            "universe": ["BBCA", "BBRI"],
            "entry_rules": "BOS + 50 EMA",
            "triple_barrier": {"take_profit_pct": 8.0, "stop_loss_pct": -3.0, "max_holding_bars": 20},
            "risk_sizing": "2% equity",
            "performance_claimed": {"sharpe_ratio": 2.5, "trials_tested": 4}
        }
        audit = tool_validate_strategy_spec(valid_spec)
        self.assertTrue(audit["valid"])
        self.assertIn("deflated_sharpe_ratio", audit)

    def test_bot_arena_status(self):
        arena = tool_get_bot_arena_status()
        self.assertEqual(arena["total_active_bots"], 6)
        self.assertEqual(len(arena["bots"]), 6)

    def test_json_rpc_initialize(self):
        req = {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}
        resp = handle_request(req)
        self.assertEqual(resp["result"]["serverInfo"]["name"], "mbg-trading-mcp")

    def test_json_rpc_tools_list(self):
        req = {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}
        resp = handle_request(req)
        tools = resp["result"]["tools"]
        tool_names = [t["name"] for t in tools]
        self.assertIn("mbg_get_orderbook", tool_names)
        self.assertIn("mbg_calc_bandarmology", tool_names)
        self.assertIn("mbg_validate_strategy_spec", tool_names)

if __name__ == '__main__':
    unittest.main()
