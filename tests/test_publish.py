"""Tests for the artefact bundler and publishing orchestrator."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from pantheon.publish.bundler import bundle_season
from pantheon.publish.manifest import Manifest
from pantheon.publish.upload import StubUploader
from pantheon.scoring import Candidate, Metrics
from pantheon.targets import Target


def _target() -> Target:
    return Target(id="streptavidin", pdb_id="1STP", chain="A", disease_context="", hotspots=(), approved=True)


def _candidates() -> list[Candidate]:
    return [
        Candidate(
            id="pth:S0:r1:a:1",
            player="a",
            sequence="AAA",
            metrics=Metrics(delta_g=-8.0, iptm=0.7, md_stability_rmsd=1.0, novelty=0.5, synthesizability=0.6),
        )
    ]


def test_bundler_writes_expected_files(tmp_path: Path):
    out = bundle_season(
        season_id="S0_streptavidin",
        target=_target(),
        candidates=_candidates(),
        wet_lab_rows=[],
        root=tmp_path,
    )
    assert out.is_dir()
    assert (out / "results.json").exists()
    assert (out / "manifest.json").exists()
    assert (out / "README.md").exists()


def test_manifest_is_reproducible(tmp_path: Path):
    out1 = bundle_season(
        season_id="S0",
        target=_target(),
        candidates=_candidates(),
        wet_lab_rows=[],
        root=tmp_path / "a",
    )
    out2 = bundle_season(
        season_id="S0",
        target=_target(),
        candidates=_candidates(),
        wet_lab_rows=[],
        root=tmp_path / "b",
    )
    m1 = json.loads((out1 / "manifest.json").read_text())
    m2 = json.loads((out2 / "manifest.json").read_text())
    # Manifest content hashes must match; timestamps are excluded from the hash set.
    assert m1["hashes"] == m2["hashes"]


def test_stub_uploader_records_call(tmp_path: Path):
    out = bundle_season(
        season_id="S0",
        target=_target(),
        candidates=_candidates(),
        wet_lab_rows=[],
        root=tmp_path,
    )
    uploader = StubUploader()
    result = uploader.upload(bundle_dir=out, destination="zenodo")
    assert result.destination == "zenodo"
    assert result.bundle == out
    assert uploader.history[-1].destination == "zenodo"


def test_manifest_dataclass_is_frozen():
    m = Manifest(
        season_id="x",
        target_id="t",
        files=("a.json", "b.json"),
        hashes={"a.json": "aa", "b.json": "bb"},
        counts={"candidates": 1},
        license="CC0-1.0",
    )
    import pytest

    with pytest.raises((AttributeError, TypeError)):
        m.season_id = "y"  # type: ignore[misc]
