"""Round orchestrator.

The Phase-0 orchestrator is intentionally minimal: it issues one prompt
to each participant and collects the resulting ``AdapterResponse``. Tool
calls, research briefs, scoring, and ELO arrive in later phases.
"""

from __future__ import annotations

from dataclasses import dataclass
from types import MappingProxyType
from typing import Mapping

from pantheon.adapters.base import Adapter, AdapterResponse
from pantheon.targets import Target

_SYSTEM_PROMPT = (
    "You are a participant in the PANTHEON protein-design arena. "
    "Your goal: propose a candidate peptide binder for the given target. "
    "Respond with a brief rationale plus one candidate sequence in FASTA."
)


def _user_prompt(target: Target) -> str:
    hotspots = ", ".join(str(h) for h in target.hotspots) or "none"
    return (
        f"Target id: {target.id}\n"
        f"PDB: {target.pdb_id} (chain {target.chain})\n"
        f"Disease context: {target.disease_context or 'n/a'}\n"
        f"Hotspot residues: {hotspots}\n"
        "\n"
        "Propose one candidate binder and your rationale."
    )


@dataclass(frozen=True, slots=True)
class Round:
    target: Target
    participants: list[Adapter]
    max_tokens: int = 1024


@dataclass(frozen=True, slots=True)
class RoundResult:
    target_id: str
    order: tuple[str, ...]
    submissions: Mapping[str, AdapterResponse]


def run_round(spec: Round) -> RoundResult:
    spec.target.require_approved()
    user = _user_prompt(spec.target)
    submissions: dict[str, AdapterResponse] = {}
    order: list[str] = []
    for adapter in spec.participants:
        response = adapter.generate(
            system=_SYSTEM_PROMPT,
            user=user,
            tool_schemas=[],
            max_tokens=spec.max_tokens,
        )
        submissions[adapter.name] = response
        order.append(adapter.name)
    return RoundResult(
        target_id=spec.target.id,
        order=tuple(order),
        submissions=MappingProxyType(submissions),
    )
