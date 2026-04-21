"""Swap-point contracts for GPU-bound tools.

These classes define the exact input / output shapes that Boltz-2,
RFdiffusion, ProteinMPNN, Chai-1, OpenMM, and Evo 2 will return when
wired to real backends. For now they delegate to deterministic stubs so
the rest of the system (tool loop, research brief, scoring) is
exercisable without a GPU.

To move to production:

1. Install the upstream package (e.g. ``pip install boltz``).
2. Replace ``_compute`` with the real call.
3. Keep the input / output schemas identical so downstream callers
   remain unchanged.
"""

from __future__ import annotations

import hashlib
from typing import Any

from pantheon.tools.base import ToolResult


def _hhash(*parts: str) -> int:
    return int(hashlib.sha256("|".join(parts).encode()).hexdigest()[:8], 16)


class Boltz2Contract:
    name = "boltz2"
    input_schema = {
        "type": "object",
        "properties": {
            "target_pdb": {"type": "string"},
            "candidate_sequence": {"type": "string"},
        },
        "required": ["target_pdb", "candidate_sequence"],
    }
    output_schema = {
        "type": "object",
        "properties": {
            "delta_g_kcal_mol": {"type": "number"},
            "iptm": {"type": "number"},
            "ptm": {"type": "number"},
        },
    }

    def __call__(self, arguments: dict[str, Any]) -> ToolResult:
        seq = str(arguments["candidate_sequence"])
        tgt = str(arguments["target_pdb"])
        h = _hhash(tgt, seq)
        out = {
            "delta_g_kcal_mol": round(-5.0 - (h % 10_000) / 1000.0, 3),
            "iptm": round(0.5 + (h % 500) / 1000.0, 3),
            "ptm": round(0.6 + (h % 400) / 1000.0, 3),
        }
        return ToolResult(tool=self.name, output=out, cached=False, meta={"backend": "stub"})


class RfdiffusionContract:
    name = "rfdiffusion"
    input_schema = {
        "type": "object",
        "properties": {
            "target_pdb": {"type": "string"},
            "hotspots": {"type": "array", "items": {"type": "string"}},
            "length_range": {"type": "array", "items": {"type": "integer"}},
            "num_designs": {"type": "integer"},
        },
        "required": ["target_pdb", "num_designs"],
    }
    output_schema = {
        "type": "object",
        "properties": {"designs": {"type": "array"}},
    }

    def __call__(self, arguments: dict[str, Any]) -> ToolResult:
        n = int(arguments.get("num_designs", 1))
        tgt = str(arguments["target_pdb"])
        designs = []
        for i in range(n):
            h = hashlib.sha256(f"rfdiff|{tgt}|{i}".encode()).hexdigest()
            designs.append({"backbone_id": f"rfdiff-{h[:10]}", "seed": i})
        return ToolResult(tool=self.name, output={"designs": designs}, cached=False, meta={"backend": "stub"})


class ProteinMPNNContract:
    name = "proteinmpnn"
    input_schema = {
        "type": "object",
        "properties": {
            "backbone_id": {"type": "string"},
            "num_sequences": {"type": "integer"},
            "temperature": {"type": "number"},
        },
        "required": ["backbone_id", "num_sequences"],
    }
    output_schema = {
        "type": "object",
        "properties": {"sequences": {"type": "array"}},
    }

    def __call__(self, arguments: dict[str, Any]) -> ToolResult:
        n = int(arguments.get("num_sequences", 1))
        bid = str(arguments["backbone_id"])
        seqs = []
        for i in range(n):
            h = hashlib.sha256(f"mpnn|{bid}|{i}".encode()).hexdigest()
            # Deterministic pseudo-sequence of 30 amino acids
            alphabet = "ACDEFGHIKLMNPQRSTVWY"
            seq = "".join(alphabet[int(h[j], 16) % 20] for j in range(30))
            seqs.append({"sequence": seq, "score": round((int(h[:6], 16) % 1000) / 1000.0, 3)})
        return ToolResult(tool=self.name, output={"sequences": seqs}, cached=False, meta={"backend": "stub"})


def boltz2() -> Boltz2Contract:
    return Boltz2Contract()


def rfdiffusion() -> RfdiffusionContract:
    return RfdiffusionContract()


def proteinmpnn() -> ProteinMPNNContract:
    return ProteinMPNNContract()
