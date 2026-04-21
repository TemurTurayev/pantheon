"""Tests for target primitives."""

from __future__ import annotations

from pathlib import Path

import pytest

from pantheon.targets import Target


def test_target_from_yaml(tmp_path: Path):
    yaml_text = """
    id: streptavidin
    pdb_id: 1STP
    chain: A
    disease_context: "calibration"
    hotspots: [45, 88, 92]
    approved: true
    """
    path = tmp_path / "target.yaml"
    path.write_text(yaml_text)

    target = Target.from_yaml(path)

    assert target.id == "streptavidin"
    assert target.pdb_id == "1STP"
    assert target.chain == "A"
    assert target.hotspots == (45, 88, 92)
    assert target.approved is True


def test_target_is_frozen():
    t = Target(id="t", pdb_id="0XXX", chain="A", disease_context="", hotspots=(), approved=True)
    with pytest.raises((AttributeError, TypeError)):
        t.pdb_id = "0YYY"  # type: ignore[misc]


def test_target_rejects_unapproved():
    """A target that has not passed biosecurity intake cannot be used."""
    t = Target(id="sketchy", pdb_id="XXXX", chain="A", disease_context="", hotspots=(), approved=False)
    with pytest.raises(PermissionError, match="biosecurity"):
        t.require_approved()


def test_target_approved_passes():
    t = Target(id="safe", pdb_id="1STP", chain="A", disease_context="", hotspots=(), approved=True)
    t.require_approved()  # must not raise
