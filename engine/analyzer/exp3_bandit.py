import json
import os
import math
import random

class Exp3StrategyBandit:
    def __init__(self, strategies=None, gamma=0.1):
        if strategies is None:
            self.strategies = [
                'BREAKOUT', 'ACCUMULATION', 'OVERSOLD_REBOUND', 
                'PULLBACK', 'SMC_ORDER_BLOCK', 'DIVIDEND_TRAP', 'FOREIGN_FLOW_MOMENTUM'
            ]
        else:
            self.strategies = strategies
            
        self.gamma = gamma
        self.state_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
            'cache', 
            'exp3_state.json'
        )
        
        # Initialize weights uniformly
        self.weights = {s: 1.0 for s in self.strategies}
        self.probabilities = {s: 1.0 / len(self.strategies) for s in self.strategies}
        self.times_selected = {s: 0 for s in self.strategies}
        self.total_rewards = {s: 0.0 for s in self.strategies}
        
        self.load_state()
        self._update_probabilities()

    def _update_probabilities(self):
        K = len(self.strategies)
        total_weight = sum(self.weights.values())
        if total_weight == 0:
            total_weight = 1e-9
            
        for s in self.strategies:
            self.probabilities[s] = (1 - self.gamma) * (self.weights[s] / total_weight) + self.gamma / K

    def select_strategy(self) -> str:
        self._update_probabilities()
            
        # Sample proportionally
        r = random.random()
        cumulative = 0.0
        for s in self.strategies:
            cumulative += self.probabilities[s]
            if r <= cumulative:
                self.times_selected[s] += 1
                return s
                
        # Fallback
        s = self.strategies[-1]
        self.times_selected[s] += 1
        return s

    def update_reward(self, strategy: str, raw_reward: float):
        if strategy not in self.strategies:
            return
            
        K = len(self.strategies)
        # Ensure we have the probability for the chosen strategy
        prob = self.probabilities.get(strategy, 1.0 / K)
        if prob <= 0:
            prob = 1e-9
        
        # Normalize reward to [-1.0, 1.0] to prevent weight distortion/overflow
        if abs(raw_reward) > 1.0:
            reward = math.tanh(raw_reward / 1_000_000.0) if abs(raw_reward) > 100 else max(min(raw_reward / 10.0, 1.0), -1.0)
        else:
            reward = max(min(raw_reward, 1.0), -1.0)
        
        # Exp3 update formula
        estimated_reward = reward / prob
        
        # Prevent math overflow by capping exponent
        exponent = self.gamma * estimated_reward / K
        exponent = max(min(exponent, 20.0), -20.0) 
        
        self.weights[strategy] *= math.exp(exponent)
        self.total_rewards[strategy] += reward
        self.save_state()

    def get_rankings(self) -> list:
        self._update_probabilities()
        # Sort strategies by probability (highest first)
        return sorted(self.strategies, key=lambda s: self.probabilities.get(s, 0.0), reverse=True)

    def get_strategy_stats(self) -> dict:
        self._update_probabilities()
        stats = {}
        for s in self.strategies:
            avg_reward = 0.0
            if self.times_selected[s] > 0:
                avg_reward = self.total_rewards[s] / self.times_selected[s]
                
            stats[s] = {
                "weight": self.weights[s],
                "probability": self.probabilities.get(s, 0.0),
                "times_selected": self.times_selected[s],
                "avg_reward": avg_reward
            }
        return stats

    def save_state(self):
        os.makedirs(os.path.dirname(self.state_file), exist_ok=True)
        state = {
            "strategies": self.strategies,
            "weights": self.weights,
            "times_selected": self.times_selected,
            "total_rewards": self.total_rewards,
            "gamma": self.gamma
        }
        try:
            with open(self.state_file, 'w') as f:
                json.dump(state, f, indent=4)
        except Exception as e:
            pass

    def load_state(self):
        if os.path.exists(self.state_file):
            try:
                with open(self.state_file, 'r') as f:
                    state = json.load(f)
                    
                # Merge loaded state with current strategies
                loaded_weights = state.get("weights", {})
                loaded_times = state.get("times_selected", {})
                loaded_rewards = state.get("total_rewards", {})
                self.gamma = state.get("gamma", self.gamma)
                
                for s in self.strategies:
                    if s in loaded_weights:
                        self.weights[s] = loaded_weights[s]
                    if s in loaded_times:
                        self.times_selected[s] = loaded_times[s]
                    if s in loaded_rewards:
                        self.total_rewards[s] = loaded_rewards[s]
            except Exception as e:
                pass
