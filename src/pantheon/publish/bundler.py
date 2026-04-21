"""Season bundler.

Writes results, wet-lab rows, a README, and a deterministic manifest to a
clean directory. The manifest carries content hashes of every file so
that an external party can verify bit-for-bit reproduction.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, is_dataclass
from pathlib import Path
from typing import Any

from pantheon.publish.manifest import Manifest
from pantheon.scoring import Candidate, DEFAULT_WEIGHTS, compose_score
from pantheon.targets import Target
from pantheon.wetlab import AssayRow


def _serialise(obj: Any) -> Any:
    if is_dataclass(obj):
        return {k: _serialise(v) for k, v in asdict(obj).items()}
    if isinstance(obj, (list, tuple)):
        return [_serialise(v) for v in obj]
    if isinstance(obj, dict):
        return {k: _serialise(v) for k, v in obj.items()}
    return obj


def _sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def _readme(season_id: str, target: Target, counts: dict[str, int]) -> str:
    lines = [
        f"# Season bundle — {season_id}",
        "",
        f"Target: `{target.id}` (PDB `{target.pdb_id}`)",
        "",
        "## Counts",
    ]
    lines.extend(f"- {k}: {v}" for k, v in sorted(counts.items()))
    lines.extend(
        [
            "",
            "## Files",
            "",
            "- `results.json` — all candidates with composite scores",
            "- `wet_lab.json` — assay rows (may be empty)",
            "- `manifest.json` — file inventory with SHA-256 hashes",
            "- `target.json` — target metadata",
            "",
            "## License",
            "",
            "CC0-1.0. See `docs/PUBLISHING.md` for exceptions.",
        ]
    )
    return "\n".join(lines) + "\n"


def bundle_season(
    *,
    season_id: str,
    target: Target,
    candidates: list[Candidate],
    wet_lab_rows: list[AssayRow],
    root: Path,
) -> Path:
    root = Path(root)
    root.mkdir(parents=True, exist_ok=True)

    (root / "target.json").write_text(
        json.dumps(_serialise(target), indent=2, sort_keys=True)
    )

    scored = [
        {
            **_serialise(c),
            "composite_score": float(compose_score(c.metrics, DEFAULT_WEIGHTS)),
        }
        for c in candidates
    ]
    (root / "results.json").write_text(json.dumps(scored, indent=2, sort_keys=True))
    (root / "wet_lab.json").write_text(
        json.dumps([_serialise(r) for r in wet_lab_rows], indent=2, sort_keys=True)
    )

    counts = {
        "candidates": len(candidates),
        "wet_lab_rows": len(wet_lab_rows),
        "players": len({c.player for c in candidates}),
    }
    (root / "README.md").write_text(_readme(season_id, target, counts))

    file_names = sorted(p.name for p in root.iterdir() if p.is_file() and p.name != "manifest.json")
    hashes = {name: _sha256_of(root / name) for name in file_names}
    manifest = Manifest(
        season_id=season_id,
        target_id=target.id,
        files=tuple(file_names),
        hashes=hashes,
        counts=counts,
        license="CC0-1.0",
    )
    (root / "manifest.json").write_text(json.dumps(manifest.to_dict(), indent=2, sort_keys=True))
    return root
