"""Tests for the real-by-default tool wiring."""

from __future__ import annotations

from typing import Any

import pytest

from pantheon.tools import default_registry
from pantheon.tools.base import ToolResult


def test_default_registry_exposes_the_real_science_tools():
    reg = default_registry()
    names = set(reg.names())
    assert "rdkit_analyze" in names
    assert "pubmed_search" in names
    # the biosecurity screen is always present and never a no-op
    assert any("biosec" in n or "screen" in n for n in names)


def test_default_registry_chemistry_is_schema_valid():
    """Real when rdkit is present, stub fallback otherwise — always schema-valid."""
    reg = default_registry()
    out = reg.invoke("rdkit_analyze", {"smiles": "CCO"}).output
    for key in ("qed", "logp", "tpsa", "mw", "sa_score", "lipinski_violations"):
        assert key in out


def test_default_registry_allows_injecting_fakes():
    """Callers (tests, offline runs) can override any tool without touching the net."""

    class _FakePubmed:
        name = "pubmed_search"
        input_schema = {"type": "object"}
        output_schema = {"type": "object"}

        def __call__(self, arguments: dict[str, Any]) -> ToolResult:
            return ToolResult(tool=self.name, output={"results": []}, cached=False)

    reg = default_registry(pubmed=_FakePubmed())
    assert reg.invoke("pubmed_search", {"query": "x", "max_results": 1}).output == {"results": []}


def test_rdkit_real_sa_score_is_real_when_available():
    pytest.importorskip("rdkit")
    out = default_registry().invoke("rdkit_analyze", {"smiles": "c1ccccc1"}).output  # benzene
    assert out["sa_score"] > 0.0
