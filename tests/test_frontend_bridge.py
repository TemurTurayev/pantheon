"""Tests for the Python → frontend round-log exporter."""

from __future__ import annotations

from pantheon.scoring import Candidate, Metrics
from pantheon.viz.exporter import ExportedRound, export_round
from pantheon.targets import Target


def _target() -> Target:
    return Target(id="streptavidin", pdb_id="1STP", chain="A", disease_context="", hotspots=(), approved=True)


def test_export_round_shape_matches_frontend_contract():
    target = _target()
    candidates = [
        Candidate(
            id="pth:S0:r1:a:1",
            player="a",
            sequence="AAA",
            metrics=Metrics(delta_g=-8.0, iptm=0.7, md_stability_rmsd=1.0, novelty=0.5, synthesizability=0.6),
        ),
        Candidate(
            id="pth:S0:r1:b:1",
            player="b",
            sequence="BBB",
            metrics=Metrics(delta_g=-10.0, iptm=0.8, md_stability_rmsd=0.5, novelty=0.6, synthesizability=0.7),
        ),
    ]
    tool_calls = [
        {"tool": "pubmed_search", "player": "a", "turn": 1, "output": {}, "t_ms": 120},
        {"tool": "boltz2", "player": "b", "turn": 1, "output": {}, "t_ms": 5200},
    ]
    events = [{"t_ms": 9000, "text": "round complete"}]

    export = export_round(
        round_id="S0_demo_r1",
        target=target,
        candidates=candidates,
        tool_calls=tool_calls,
        events=events,
        colors={"a": "#d97757", "b": "#64e1a8"},
    )

    assert isinstance(export, ExportedRound)
    payload = export.to_dict()
    assert payload["round_id"] == "S0_demo_r1"
    assert payload["target_pdb"] == "1STP"
    assert {p["name"] for p in payload["players"]} == {"a", "b"}
    assert len(payload["candidates"]) == 2
    # Score must be present and a number.
    assert all(isinstance(c["score"], float) for c in payload["candidates"])
