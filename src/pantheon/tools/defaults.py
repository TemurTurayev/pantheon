"""Production tool wiring.

``default_registry()`` is the real-by-default set of tools the arena runs
with: real chemistry (rdkit), real literature (PubMed E-utilities), and the
mandatory biosecurity screen. It replaces the ad-hoc per-call-site wiring
that previously only registered stubs.

Graceful degradation is built into the tools themselves, not this factory:
- ``rdkit_real`` computes real descriptors when ``rdkit`` is importable and
  transparently falls back to the deterministic stub otherwise, so a dev box
  without rdkit still gets schema-valid output.
- ``pubmed_http`` talks to NCBI E-utilities through an injectable transport
  (``httpx`` by default); pass ``pubmed=`` to inject a fake in tests.

The biosecurity screen is ALWAYS registered and is never swapped for a no-op —
it is the safety gate every sequence/SMILES must clear.
"""

from __future__ import annotations

from pantheon.tools.base import Tool
from pantheon.tools.real.pubmed_http import pubmed_http
from pantheon.tools.real.rdkit_real import rdkit_real
from pantheon.tools.registry import ToolRegistry
from pantheon.tools.stubs.biosec import biosec_stub


def default_registry(
    *,
    chemistry: Tool | None = None,
    pubmed: Tool | None = None,
    biosec: Tool | None = None,
) -> ToolRegistry:
    """Build the arena's real-by-default tool registry.

    Any tool can be overridden (mainly for tests) by passing an explicit
    instance; otherwise the real implementation is used.
    """
    registry = ToolRegistry()
    registry.register(chemistry or rdkit_real())
    registry.register(pubmed or pubmed_http())
    registry.register(biosec or biosec_stub())
    return registry
