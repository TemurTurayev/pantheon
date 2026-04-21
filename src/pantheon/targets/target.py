"""Target definition.

A target is the mission for a round: which protein / complex the LLMs
must design against, plus the biosecurity-intake outcome.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import yaml


@dataclass(frozen=True, slots=True)
class Target:
    id: str
    pdb_id: str
    chain: str
    disease_context: str
    hotspots: tuple[int, ...]
    approved: bool

    @classmethod
    def from_yaml(cls, path: Path) -> Target:
        raw = yaml.safe_load(Path(path).read_text())
        return cls(
            id=str(raw["id"]),
            pdb_id=str(raw["pdb_id"]),
            chain=str(raw.get("chain", "A")),
            disease_context=str(raw.get("disease_context", "")),
            hotspots=tuple(int(h) for h in raw.get("hotspots", [])),
            approved=bool(raw.get("approved", False)),
        )

    def require_approved(self) -> None:
        if not self.approved:
            raise PermissionError(
                f"Target '{self.id}' has not passed biosecurity intake review "
                f"(see docs/BIOSECURITY.md). Refusing to proceed."
            )
