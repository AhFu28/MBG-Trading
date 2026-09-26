import unittest
import os
import json
import tempfile
from engine.analyzer.arena_runner_247 import ArenaRunner247

class TestArenaRunner247(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.state_file = os.path.join(self.temp_dir.name, "test_arena_state.json")
        self.runner = ArenaRunner247(state_file_path=self.state_file)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_initial_state_generation(self):
        state = self.runner.state
        self.assertIn("agents", state)
        self.assertEqual(len(state["agents"]), 16)
        self.assertIn("positions", state)
        self.assertIn("journal", state)

    def test_evaluate_cycle_trailing_stop_and_exit(self):
        # Seed an active LONG position near TP1
        mock_position = {
            "id": "POS-TEST-1",
            "agentId": "WATER",
            "symbol": "BTCUSDT",
            "market": "CRYPTO",
            "direction": "LONG",
            "entryPrice": 90000.0,
            "currentPrice": 90000.0,
            "slPrice": 88500.0,
            "tp1Price": 92700.0,
            "tp2Price": 94500.0,
            "roiPct": 0.0,
            "trailingStopActive": False,
            "openedAt": "2026-09-26T00:00:00Z",
            "rationale": "Test position"
        }
        self.runner.state["positions"] = [mock_position]

        # 1. Price moves up +40% towards TP1 -> Trailing stop should ratchet
        mock_prices_1 = {
            "BTCUSDT": {"price": 91200.0, "changePct": 1.33}
        }
        self.runner.evaluate_cycle(mock_prices_1)
        active_pos = self.runner.state["positions"][0]
        self.assertTrue(active_pos["trailingStopActive"])
        self.assertGreater(active_pos["slPrice"], 88500.0)

        # 2. Price hits TP1 -> Position closes into journal with Bitget 0.12% fee deducted
        mock_prices_2 = {
            "BTCUSDT": {"price": 92750.0, "changePct": 3.05}
        }
        self.runner.evaluate_cycle(mock_prices_2)
        self.assertFalse(any(p["id"] == "POS-TEST-1" for p in self.runner.state["positions"]))
        
        closed_target = [t for t in self.runner.state["journal"] if "POS-TEST-1" in t["id"]]
        self.assertEqual(len(closed_target), 1)

        closed = closed_target[0]
        self.assertEqual(closed["exitReason"], "HIT_TP1")
        self.assertTrue(closed["isWin"])
        # Net ROI should be raw ROI minus 0.12% fee
        raw_roi = ((92700.0 - 90000.0) / 90000.0) * 100
        expected_net = round(raw_roi - 0.12, 2)
        self.assertEqual(closed["netRoiPct"], expected_net)

    def test_spawn_orders_concurrent_all_agents(self):
        # Empty positions, positive momentum market across all target universe
        mock_prices = {
            "BTCUSDT": {"price": 92000.0, "changePct": 2.5, "high": 93000.0, "low": 90500.0},
            "ETHUSDT": {"price": 3100.0, "changePct": -3.2, "high": 3250.0, "low": 3080.0},
            "SOLUSDT": {"price": 185.0, "changePct": 4.1, "high": 188.0, "low": 177.0},
            "XAUUSD": {"price": 4270.0, "changePct": 0.8, "high": 4285.0, "low": 4240.0}
        }
        self.runner.state["positions"] = []
        self.runner.evaluate_cycle(mock_prices)

        # Multiple agents should have opened positions concurrently
        opened_positions = self.runner.state["positions"]
        self.assertGreater(len(opened_positions), 0)
        # Agents should be distinct
        agent_ids = [p["agentId"] for p in opened_positions]
        self.assertEqual(len(agent_ids), len(set(agent_ids)))

if __name__ == "__main__":
    unittest.main()
