"""
Independence checks for the 16 arena agents.

WHY THIS TEST EXISTS:
A production audit on 2026-10-05 found that 16 "independent" agents shared only
6 decision logics. AVATAR, CHAOS, OCEANIC and TEMPEST ran the identical
"Synthesis (chg >= 0)" rule, so XAUUSD SHORT was opened by 12 different agents at
the exact same entry price, and 12 of 16 agents had never closed a trade.

These tests fail if the agents ever collapse back into near-identical behaviour.

Run: python engine/tests/test_agent_dna.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from analyzer.arena_runner_247 import (  # noqa: E402
    AGENT_DNA,
    DEFAULT_AGENTS,
    TARGET_UNIVERSE,
    ASSET_GROUPS,
    resolve_agent_universe,
    ArenaRunner247,
)


def _quote(price, chg, high=None, low=None):
    return {
        "price": price,
        "changePct": chg,
        "high": high if high is not None else price * 1.02,
        "low": low if low is not None else price * 0.98,
    }


# A spread of market conditions used to fingerprint each agent's behaviour.
#
# IMPORTANT: high/low must be ASYMMETRIC around the price, exactly as real
# candles are. Using a symmetric band (price*1.02 / price*0.98) pins range_pos
# at 0.5 for every scenario, which makes range-based agents look constant and
# hides real behavioural differences. Each entry below places the price at a
# deliberate position inside its own day range.
def _scenario(price, chg, pos):
    """pos = where price sits in [low, high]; 0.0 = at the low, 1.0 = at the high."""
    band = price * 0.04
    high = price + band * (1 - pos)
    low = price - band * pos
    return {"price": price, "changePct": chg, "high": high, "low": low}


SCENARIOS = [
    ("strong_up_high",   _scenario(100, 3.0, 0.95)),
    ("mild_up_mid",      _scenario(100, 0.8, 0.55)),
    ("flat_mid",         _scenario(100, 0.0, 0.50)),
    ("mild_down_low",    _scenario(100, -0.9, 0.20)),
    ("strong_down_low",  _scenario(100, -3.2, 0.05)),
    ("violent_dump",     _scenario(100, -6.0, 0.02)),
    ("near_high_only",   _scenario(100, 0.3, 0.90)),
    ("near_low_only",    _scenario(100, -0.3, 0.08)),
    ("deep_low_flat",    _scenario(100, 0.1, 0.03)),
    ("high_and_dumping", _scenario(100, -2.5, 0.75)),
]


def _fingerprint(runner, agent_id):
    """Agent's decision signature across every scenario."""
    return tuple(
        runner.compute_agent_confluence(agent_id, "BTCUSDT", q)[:2]  # (is_long, confidence)
        for _, q in SCENARIOS
    )


def test_every_default_agent_has_dna():
    missing = [a["id"] for a in DEFAULT_AGENTS if a["id"] not in AGENT_DNA]
    assert not missing, f"agents without DNA: {missing}"


def test_no_two_agents_have_identical_fingerprints():
    """The core regression: 16 agents must not collapse into a few behaviours."""
    runner = ArenaRunner247.__new__(ArenaRunner247)  # no state file needed
    prints = {a["id"]: _fingerprint(runner, a["id"]) for a in DEFAULT_AGENTS}

    seen = {}
    duplicates = []
    for ag_id, fp in prints.items():
        if fp in seen:
            duplicates.append((seen[fp], ag_id))
        else:
            seen[fp] = ag_id

    assert not duplicates, (
        f"agents with identical behaviour: {duplicates}. "
        "Each agent must produce a distinct decision signature."
    )
    assert len(seen) == len(DEFAULT_AGENTS), "every agent must be unique"


def test_no_two_agents_share_a_family():
    """Family duplication was the original root cause."""
    fams = {}
    dupes = []
    for ag_id, dna in AGENT_DNA.items():
        fam = dna["family"]
        if fam in fams:
            dupes.append((fam, fams[fam], ag_id))
        else:
            fams[fam] = ag_id
    assert not dupes, f"agents sharing a logic family: {dupes}"


def test_agents_do_not_all_trade_the_same_instrument_group():
    groups = {AGENT_DNA[a["id"]]["assets"] for a in DEFAULT_AGENTS}
    assert len(groups) >= 3, f"agents should span several asset preferences, got {groups}"


def test_asset_preferences_are_respected_and_non_empty():
    for group, symbols in ASSET_GROUPS.items():
        assert symbols, f"asset group {group} is empty"
    for ag in DEFAULT_AGENTS:
        universe = resolve_agent_universe(ag["id"])
        assert universe, f"{ag['id']} has an empty universe"
        assert all(s in TARGET_UNIVERSE for s in universe), f"{ag['id']} has unknown symbols"


def test_min_conf_bars_actually_differ_between_agents():
    bars = {AGENT_DNA[a["id"]]["min_conf"] for a in DEFAULT_AGENTS}
    assert len(bars) >= 5, f"conviction bars should vary meaningfully, got {sorted(bars)}"


def test_confidence_always_within_bounds():
    runner = ArenaRunner247.__new__(ArenaRunner247)
    for ag in DEFAULT_AGENTS:
        for _, q in SCENARIOS:
            _, conf, rationale = runner.compute_agent_confluence(ag["id"], "ETHUSDT", q)
            assert 40 <= conf <= 95, f"{ag['id']} produced out-of-range confidence {conf}"
            assert isinstance(rationale, str) and rationale, f"{ag['id']} has empty rationale"


def test_unknown_agent_falls_back_safely():
    runner = ArenaRunner247.__new__(ArenaRunner247)
    is_long, conf, rat = runner.compute_agent_confluence("NOT_A_REAL_AGENT", "BTCUSDT", _quote(100, 1.0))
    assert isinstance(is_long, bool)
    assert 40 <= conf <= 95
    assert rat


def test_directional_bias_produces_both_long_and_short_agents():
    """A healthy arena needs agents willing to take each side."""
    runner = ArenaRunner247.__new__(ArenaRunner247)
    q = _quote(100, 0.2, 101, 99)  # deliberately ambiguous
    sides = {runner.compute_agent_confluence(a["id"], "BTCUSDT", q)[0] for a in DEFAULT_AGENTS}
    assert sides == {True, False}, f"all agents agree on direction — that is the original bug (got {sides})"


def test_agent_universes_are_not_all_identical():
    """Agents must not all hunt the same instrument group.

    The first DNA attempt left every agent searching its own group AND the full
    universe together, so XAUUSD (highest volatility = highest confidence) won
    for nearly everyone. This asserts the groups genuinely differ.
    """
    universes = {ag["id"]: resolve_agent_universe(ag["id"]) for ag in DEFAULT_AGENTS}
    distinct = {tuple(sorted(u)) for u in universes.values()}
    assert len(distinct) >= 3, f"expected several distinct universes, got {len(distinct)}"
    assert any("XAUUSD" not in u for u in universes.values()), "every agent can trade gold"


def test_spawn_prefers_agents_own_universe_over_full_list():
    """Simulates the spawner: a crypto-only agent must pick crypto, not gold.

    XAUUSD is given the HIGHEST confidence on purpose. The agent must still pick
    from its own universe, which is the exact bug that produced 12 identical
    XAUUSD tickets.
    """
    runner = ArenaRunner247.__new__(ArenaRunner247)

    # Gold scores highest for everyone; crypto scores lower but still qualifies.
    prices = {
        "XAUUSD": {"price": 4200.0, "changePct": -4.0, "high": 4300.0, "low": 4180.0},
        "BTCUSDT": {"price": 76000.0, "changePct": -2.5, "high": 78000.0, "low": 75500.0},
        "ETHUSDT": {"price": 2400.0, "changePct": -2.5, "high": 2500.0, "low": 2380.0},
        "SOLUSDT": {"price": 97.0, "changePct": -2.5, "high": 101.0, "low": 96.0},
    }

    crypto_only = [a["id"] for a in DEFAULT_AGENTS if AGENT_DNA[a["id"]]["assets"] == "crypto"]
    assert crypto_only, "test needs at least one crypto-only agent"

    for ag_id in crypto_only:
        picks = []
        for sym in resolve_agent_universe(ag_id):
            q = prices.get(sym)
            if not q:
                continue
            conf = runner.compute_agent_confluence(ag_id, sym, q)[1]
            if conf >= AGENT_DNA[ag_id]["min_conf"]:
                picks.append((conf, sym))
        if picks:
            chosen = max(picks)[1]
            assert chosen != "XAUUSD", (
                f"{ag_id} declares crypto-only but would pick XAUUSD "
                f"(candidates: {sorted(picks, reverse=True)})"
            )


if __name__ == "__main__":
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
    print(f"OK — agent DNA: {len(tests)} checks passed")
