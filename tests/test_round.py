"""Tests for the Round primitive and orchestrator."""

from __future__ import annotations

from pantheon.adapters import MockAdapter
from pantheon.arena.round import Round, RoundResult, run_round
from pantheon.targets import Target


def _safe_target() -> Target:
    return Target(
        id="streptavidin",
        pdb_id="1STP",
        chain="A",
        disease_context="calibration",
        hotspots=(),
        approved=True,
    )


def test_round_runs_each_adapter_once():
    target = _safe_target()
    a1 = MockAdapter(name="model-a", script=["I propose peptide AAA"])
    a2 = MockAdapter(name="model-b", script=["I propose peptide BBB"])
    round_spec = Round(target=target, participants=[a1, a2], max_tokens=64)

    result = run_round(round_spec)

    assert isinstance(result, RoundResult)
    assert set(result.submissions) == {"model-a", "model-b"}
    assert result.submissions["model-a"].text == "I propose peptide AAA"
    assert result.submissions["model-b"].text == "I propose peptide BBB"


def test_round_blocks_unapproved_target():
    unapproved = Target(
        id="x", pdb_id="XXXX", chain="A", disease_context="", hotspots=(), approved=False
    )
    a1 = MockAdapter(name="model-a", script=["x"])

    round_spec = Round(target=unapproved, participants=[a1], max_tokens=10)

    import pytest

    with pytest.raises(PermissionError):
        run_round(round_spec)


def test_round_result_preserves_order():
    target = _safe_target()
    a = MockAdapter(name="a", script=["first"])
    b = MockAdapter(name="b", script=["second"])
    c = MockAdapter(name="c", script=["third"])
    round_spec = Round(target=target, participants=[a, b, c], max_tokens=10)

    result = run_round(round_spec)

    assert result.order == ("a", "b", "c")
