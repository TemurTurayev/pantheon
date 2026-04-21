"""Contract tests for stub tools.

Stubs return deterministic payloads and respect their schemas. They stand
in for real tools so the arena runs end-to-end before heavy dependencies
are wired up.
"""

from __future__ import annotations

from pantheon.tools.stubs.biosec import biosec_stub
from pantheon.tools.stubs.pubmed import pubmed_stub
from pantheon.tools.stubs.rdkit import rdkit_stub


def test_pubmed_stub_returns_deterministic_list():
    tool = pubmed_stub()
    result = tool({"query": "EGFR", "years": [2024, 2026], "max_results": 3})
    assert result.tool == "pubmed_search"
    assert len(result.output["results"]) == 3
    # Deterministic — same input => same output
    result2 = tool({"query": "EGFR", "years": [2024, 2026], "max_results": 3})
    assert result.output == result2.output


def test_pubmed_stub_different_query_different_output():
    tool = pubmed_stub()
    a = tool({"query": "EGFR", "years": [2024, 2026], "max_results": 2})
    b = tool({"query": "ALS", "years": [2024, 2026], "max_results": 2})
    assert a.output != b.output


def test_rdkit_stub_returns_expected_keys():
    tool = rdkit_stub()
    result = tool({"smiles": "CCO"})
    assert result.tool == "rdkit_analyze"
    for key in ("qed", "logp", "tpsa", "mw", "sa_score", "lipinski_violations"):
        assert key in result.output


def test_biosec_stub_flags_blocklisted_motif():
    tool = biosec_stub()
    safe = tool({"sequence_or_smiles": "AGAGAGA", "synthesis_target": "protein"})
    assert safe.output["decision"] == "pass"

    flagged = tool({"sequence_or_smiles": "TOXTOXTOX", "synthesis_target": "protein"})
    assert flagged.output["decision"] == "flagged"
    assert "audit_id" in flagged.output
