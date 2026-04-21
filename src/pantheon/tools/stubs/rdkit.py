"""Deterministic fake for ``rdkit_analyze``.

Derives plausible molecular descriptor values from a hash of the SMILES,
without actually depending on the ``rdkit`` package. Phase-2 swaps this
out for a real implementation that imports rdkit.
"""

from __future__ import annotations

import hashlib
from typing import Any

from pantheon.tools.base import ToolResult

_INPUT = {
    "type": "object",
    "properties": {"smiles": {"type": "string"}},
    "required": ["smiles"],
}

_OUTPUT = {
    "type": "object",
    "properties": {
        "qed": {"type": "number"},
        "logp": {"type": "number"},
        "tpsa": {"type": "number"},
        "mw": {"type": "number"},
        "sa_score": {"type": "number"},
        "lipinski_violations": {"type": "integer"},
    },
}


def _h(smiles: str, salt: str) -> int:
    return int(hashlib.sha256(f"{salt}|{smiles}".encode()).hexdigest()[:8], 16)


class _RdkitStub:
    name = "rdkit_analyze"
    input_schema = _INPUT
    output_schema = _OUTPUT

    def __call__(self, arguments: dict[str, Any]) -> ToolResult:
        smiles = str(arguments["smiles"])
        out = {
            "qed": round((_h(smiles, "qed") % 10_000) / 10_000, 4),
            "logp": round(-2.0 + (_h(smiles, "logp") % 10_000) / 1000, 3),
            "tpsa": round(20.0 + (_h(smiles, "tpsa") % 1500) / 10, 2),
            "mw": round(120.0 + (_h(smiles, "mw") % 6000) / 10, 2),
            "sa_score": round(1.0 + (_h(smiles, "sa") % 500) / 100, 3),
            "lipinski_violations": _h(smiles, "lipinski") % 5,
        }
        return ToolResult(tool=self.name, output=out, cached=False)


def rdkit_stub() -> _RdkitStub:
    return _RdkitStub()
