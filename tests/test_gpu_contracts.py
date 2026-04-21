"""Contract tests for GPU-bound tools (stubbed for CI)."""

from __future__ import annotations

from pantheon.tools.real.gpu_contracts import boltz2, proteinmpnn, rfdiffusion


def test_boltz2_returns_affinity_and_confidence():
    tool = boltz2()
    result = tool({"target_pdb": "1STP", "candidate_sequence": "AAAAAAAAAA"})
    assert result.output["delta_g_kcal_mol"] < 0
    assert 0 <= result.output["iptm"] <= 1
    assert result.meta["backend"] == "stub"


def test_boltz2_deterministic():
    tool = boltz2()
    a = tool({"target_pdb": "1STP", "candidate_sequence": "AAA"}).output
    b = tool({"target_pdb": "1STP", "candidate_sequence": "AAA"}).output
    assert a == b


def test_rfdiffusion_honors_num_designs():
    tool = rfdiffusion()
    res = tool({"target_pdb": "1STP", "num_designs": 4})
    assert len(res.output["designs"]) == 4


def test_proteinmpnn_sequences_valid_amino_acids():
    tool = proteinmpnn()
    res = tool({"backbone_id": "rfdiff-abc", "num_sequences": 2})
    alphabet = set("ACDEFGHIKLMNPQRSTVWY")
    for entry in res.output["sequences"]:
        assert set(entry["sequence"]).issubset(alphabet)
        assert 0 <= entry["score"] <= 1
