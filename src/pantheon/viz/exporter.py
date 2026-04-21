"""Emit a ``round.json`` payload for the frontend.

Contract lives in ``frontend/src/types.ts``. Any change here must be
mirrored there. The exporter is intentionally forgiving: fields the
caller does not supply are defaulted to safe empty values so the
frontend never sees ``undefined``.
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


def _default_player_state(name: str, color: str) -> dict[str, Any]:
    return {
        "name": name,
        "color": color,
        "status": "done",
        "current_action": "",
        "step": 0,
        "step_total": 0,
        "elapsed_ms": 0,
        "score_history": [],
    }


def export_round(
    *,
    round_id: str,
    target: Target,
    candidates: list[Candidate],
    tool_calls: list[dict[str, Any]],
    events: list[dict[str, Any]],
    colors: dict[str, str],
    target_stakes: str = "",
    player_states: dict[str, dict[str, Any]] | None = None,
    reasoning_by_player: dict[str, list[dict[str, Any]]] | None = None,
    hotspots: list[dict[str, Any]] | None = None,
) -> ExportedRound:
    player_states = player_states or {}
    reasoning_by_player = reasoning_by_player or {}
    hotspots = hotspots or []

    names = sorted({c.player for c in candidates} | set(colors.keys()) | set(player_states.keys()))
    players = []
    for name in names:
        base = _default_player_state(name, colors.get(name, "#e4e7ef"))
        if name in player_states:
            base.update(player_states[name])
        base["color"] = colors.get(name, base["color"])
        base["name"] = name
        players.append(base)

    payload = {
        "round_id": round_id,
        "target_id": target.id,
        "target_pdb": target.pdb_id,
        "target_stakes": target_stakes,
        "players": players,
        "reasoning_by_player": {p: reasoning_by_player.get(p, []) for p in names},
        "tool_calls": tool_calls,
        "candidates": [
            {
                "id": c.id,
                "player": c.player,
                "sequence": c.sequence,
                "delta_g": c.metrics.delta_g,
                "iptm": c.metrics.iptm,
                "score": float(compose_score(c.metrics, DEFAULT_WEIGHTS)),
                "rationale": c.rationale,
                "hotspot_residues": [],
            }
            for c in candidates
        ],
        "hotspots": hotspots,
        "events": events,
    }
    return ExportedRound(payload=payload)
