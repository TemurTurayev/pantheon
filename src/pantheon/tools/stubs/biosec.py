"""Stub biosecurity screen.

Flags any sequence or SMILES that contains one of the placeholder
block-list motifs. Real production pipeline would call a partner
service (SecureBio / IBBIS-compliant). The audit id is a SHA-256 prefix
of the input so every decision is replayable.
"""

from __future__ import annotations

import hashlib
from typing import Any

from pantheon.tools.base import ToolResult

_INPUT = {
    "type": "object",
    "properties": {
        "sequence_or_smiles": {"type": "string"},
        "synthesis_target": {"type": "string", "enum": ["dna", "protein", "small_molecule"]},
    },
    "required": ["sequence_or_smiles", "synthesis_target"],
}

_OUTPUT = {
    "type": "object",
    "properties": {
        "decision": {"type": "string", "enum": ["pass", "flagged"]},
        "risk_reasons": {"type": "array", "items": {"type": "string"}},
        "audit_id": {"type": "string"},
    },
}

_BLOCKLIST_MOTIFS = ("TOX", "RICIN", "BOTULINUM", "ANTHRAX")


class _BiosecStub:
    name = "biosecurity_screen"
    input_schema = _INPUT
    output_schema = _OUTPUT

    def __call__(self, arguments: dict[str, Any]) -> ToolResult:
        seq = str(arguments["sequence_or_smiles"]).upper()
        audit = hashlib.sha256(seq.encode()).hexdigest()[:16]
        hits = [motif for motif in _BLOCKLIST_MOTIFS if motif in seq]
        if hits:
            out = {
                "decision": "flagged",
                "risk_reasons": [f"matches block-list motif: {m}" for m in hits],
                "audit_id": f"audit-{audit}",
            }
        else:
            out = {
                "decision": "pass",
                "risk_reasons": [],
                "audit_id": f"audit-{audit}",
            }
        return ToolResult(tool=self.name, output=out, cached=False)


def biosec_stub() -> _BiosecStub:
    return _BiosecStub()
