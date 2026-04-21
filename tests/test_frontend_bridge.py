"""Tests for the Python → frontend round-log exporter."""

from __future__ import annotations

from pantheon.scoring import Candidate, Metrics
from pantheon.viz.exporter import ExportedRound, export_round
from pantheon.targets import Target


def _target() -> Target:
    return Target(id="streptavidin", pdb_id="1STP", chain="A", disease_context="", hotspots=(), approved=True)


def _candidates() -> list[Candidate]:
    return [
        Candidate(
            id="pth:S0:r1:a:1",
            player="a",
            sequence="AAA",
            metrics=Metrics(delta_g=-8.0, iptm=0.7, md_stability_rmsd=1.0, novelty=0.5, synthesizability=0.6),
            rationale="Tight loop binder",
        ),
        Candidate(
            id="pth:S0:r1:b:1",
            player="b",
            sequence="BBB",
            metrics=Metrics(delta_g=-10.0, iptm=0.8, md_stability_rmsd=0.5, novelty=0.6, synthesizability=0.7),
            rationale="Hydrophobic clamp",
        ),
    ]


def test_export_round_minimum():
    export = export_round(
        round_id="S0_demo_r1",
        target=_target(),
        candidates=_candidates(),
        tool_calls=[],
        events=[],
        colors={"a": "#5ccfe6", "b": "#ffb547"},
    )
    assert isinstance(export, ExportedRound)
    payload = export.to_dict()
    assert payload["round_id"] == "S0_demo_r1"
    assert payload["target_pdb"] == "1STP"
    assert {p["name"] for p in payload["players"]} == {"a", "b"}
    assert all("score_history" in p for p in payload["players"])


def test_export_round_with_player_states_and_reasoning():
    export = export_round(
        round_id="S0_r1",
        target=_target(),
        candidates=_candidates(),
        tool_calls=[],
        events=[],
        colors={"a": "#5ccfe6", "b": "#ffb547"},
        target_stakes="Calibration — streptavidin binder design",
        player_states={
            "a": {
                "status": "tool",
                "current_tool": "boltz2",
                "current_action": "Running Boltz-2 on candidate 2",
                "step": 14,
                "step_total": 30,
                "elapsed_ms": 45_000,
                "score_history": [0.5, 1.2, 2.4, 3.1, 4.2],
            },
        },
        reasoning_by_player={
            "a": [
                {"t_ms": 120, "kind": "thought", "summary": "Searching literature for streptavidin binders"},
                {"t_ms": 3200, "kind": "tool_call", "summary": "rfdiffusion", "tool": "rfdiffusion"},
            ]
        },
        hotspots=[
            {"residue": 45, "label": "Trp45", "role": "hotspot", "explainer": "Deep pocket anchor"},
        ],
    )
    payload = export.to_dict()
    a_state = next(p for p in payload["players"] if p["name"] == "a")
    assert a_state["status"] == "tool"
    assert a_state["current_tool"] == "boltz2"
    assert a_state["step"] == 14
    assert len(payload["reasoning_by_player"]["a"]) == 2
    assert payload["hotspots"][0]["role"] == "hotspot"
    assert payload["target_stakes"].startswith("Calibration")


def test_export_round_candidate_shape():
    export = export_round(
        round_id="r",
        target=_target(),
        candidates=_candidates(),
        tool_calls=[],
        events=[],
        colors={"a": "#5ccfe6", "b": "#ffb547"},
    )
    payload = export.to_dict()
    cand = payload["candidates"][0]
    for field in ("id", "player", "sequence", "delta_g", "iptm", "score", "rationale", "hotspot_residues"):
        assert field in cand
    assert isinstance(cand["score"], float)
