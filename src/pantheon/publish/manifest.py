"""Bundle manifest type."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True, slots=True)
class Manifest:
    season_id: str
    target_id: str
    files: tuple[str, ...]
    hashes: dict[str, str]
    counts: dict[str, int]
    license: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "season_id": self.season_id,
            "target_id": self.target_id,
            "files": list(self.files),
            "hashes": self.hashes,
            "counts": self.counts,
            "license": self.license,
        }
