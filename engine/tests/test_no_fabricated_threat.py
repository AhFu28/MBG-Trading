"""
Guard against fabricated threat levels in the LLM brain.

WHY THIS EXISTS
---------------
`assess_geopolitical_threat` used to return `defcon_level: 4` and
`threat_score: 0.42` from its except branch, tagged "DETERMINISTIC_FALLBACK".
Those exact numbers reached the terminal UI and were displayed as an assessed
geopolitical threat level. A model failure must produce "unknown", never a
plausible-looking number.

This is an AST check rather than a runtime test so it needs no API key, no
network, and none of the engine's heavy dependencies — it can run anywhere.

Run: python engine/tests/test_no_fabricated_threat.py
"""

import ast
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
BRAIN = os.path.join(HERE, "..", "analyzer", "llm_brain.py")
PIPELINE = os.path.join(HERE, "..", "run_pipeline.py")


def _find_function(tree, name):
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and node.name == name:
            return node
    return None


def _literal_fields(return_node):
    """Field name -> value, for a returned dict literal with constant values."""
    out = {}
    if not isinstance(return_node, ast.Dict):
        return out
    for key, value in zip(return_node.keys, return_node.values):
        name = getattr(key, "value", None)
        if name is None:
            continue
        if isinstance(value, ast.Constant):
            out[name] = value.value
    return out


def test_no_numeric_threat_literals():
    with open(BRAIN, encoding="utf-8") as fh:
        tree = ast.parse(fh.read())

    fn = _find_function(tree, "assess_geopolitical_threat")
    assert fn is not None, "assess_geopolitical_threat is missing from llm_brain"

    offenders = []
    for node in ast.walk(fn):
        if not isinstance(node, ast.Return):
            continue
        fields = _literal_fields(node.value)
        for field in ("defcon_level", "threat_score"):
            if field in fields and isinstance(fields[field], (int, float)):
                offenders.append((field, fields[field]))

    assert not offenders, (
        "Fabricated threat values are being returned as literals: "
        f"{offenders}. A failed assessment must report None, not a number."
    )


def test_failure_branch_flags_unassessed():
    with open(BRAIN, encoding="utf-8") as fh:
        tree = ast.parse(fh.read())

    fn = _find_function(tree, "assess_geopolitical_threat")
    assert fn is not None

    flags = []
    for node in ast.walk(fn):
        if isinstance(node, ast.Return):
            fields = _literal_fields(node.value)
            if "assessed" in fields:
                flags.append(fields["assessed"])

    assert False in flags, (
        "The failure branch must set assessed=False so callers can tell an "
        "unassessed result from a real one."
    )


def test_pipeline_only_publishes_assessed_results():
    """
    The pipeline must not write an unassessed stub into the bundle — that would
    re-create the permanently-empty panel this work removed.
    """
    with open(PIPELINE, encoding="utf-8") as fh:
        source = fh.read()

    assert "assess_geopolitical_threat" in source, (
        "The pipeline no longer calls the threat assessor."
    )
    assert 'threat.get("assessed"' in source or "threat.get('assessed'" in source, (
        "The pipeline must gate on the assessed flag before publishing a result."
    )
    assert "geopolitical_threat" in source, (
        "The bundle no longer carries a geopolitical_threat section."
    )


def _run():
    failures = 0
    for fn in (
        test_no_numeric_threat_literals,
        test_failure_branch_flags_unassessed,
        test_pipeline_only_publishes_assessed_results,
    ):
        try:
            fn()
            print(f"PASS  {fn.__name__}")
        except AssertionError as exc:
            failures += 1
            print(f"FAIL  {fn.__name__}\n      {exc}")
    print("-" * 60)
    print(f"{3 - failures}/3 checks passed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(_run())
