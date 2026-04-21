"""Content-addressed cache for tool outputs.

Keys are SHA-256 of ``(tool_name, canonical_json(arguments))``. Values are
stored one-per-file under the cache root as JSON. A simple filesystem layout
keeps the cache trivially auditable and easy to ship as a dataset artefact.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


class ContentCache:
    def __init__(self, root: Path) -> None:
        self._root = Path(root)
        self._root.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def key_for(tool_name: str, arguments: dict[str, Any]) -> str:
        canonical = json.dumps(
            {"tool": tool_name, "args": arguments},
            sort_keys=True,
            separators=(",", ":"),
        )
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    def path(self, key: str) -> Path:
        return self._root / f"{key}.json"

    def get(self, key: str) -> dict[str, Any] | None:
        p = self.path(key)
        if not p.exists():
            return None
        return json.loads(p.read_text())

    def put(self, key: str, value: dict[str, Any]) -> None:
        self.path(key).write_text(json.dumps(value, sort_keys=True))
