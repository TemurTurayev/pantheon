"""Emit a ``round.json`` payload for the frontend.

Frontend contract lives in ``frontend/src/types.ts``. Any change here
must be mirrored there.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from pantheon.scoring import Candidate, DEFAULT_WEIGHTS, compose_score
from pantheon.targets import Target


@dataclass(frozen=True, slots=True)
class ExportedRound:
    payload: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return self.payload

    def to_json(self) -> str:
        return json.dumps(self.payload, indent=2, sort_keys=True)


def export_round(
    *,
    round_id: str,
    target: Target,
    candidates: list[Candidate],
    tool_calls: list[dict[str, Any]],
    events: list[dict[str, Any]],
    colors: dict[str, str],
) -> ExportedRound:
    players = sorted({c.player for c in candidates} | set(colors.keys()))
    payload = {
        "round_id": round_id,
        "target_id": target.id,
        "target_pdb": target.pdb_id,
        "players": [{"name": p, "color": colors.get(p, "#d6dce5")} for p in players],
        "tool_calls": tool_calls,
        "candidates": [
            {
                "id": c.id,
                "player": c.player,
                "sequence": c.sequence,
                "delta_g": c.metrics.delta_g,
                "iptm": c.metrics.iptm,
                "score": float(compose_score(c.metrics, DEFAULT_WEIGHTS)),
            }
            for c in candidates
        ],
        "events": events,
    }
    return ExportedRound(payload=payload)
