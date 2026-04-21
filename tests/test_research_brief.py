"""Tests for the research pre-brief layer."""

from __future__ import annotations

from pantheon.research.agents import (
    ChemSpaceAgent,
    FailureAgent,
    LitSearchAgent,
    MechanismAgent,
    PriorArtAgent,
    SynthesisAgent,
)
from pantheon.research.brief import Brief, build_brief
from pantheon.targets import Target
from pantheon.tools import ToolRegistry
from pantheon.tools.stubs.pubmed import pubmed_stub


def _safe_target() -> Target:
    return Target(
        id="streptavidin",
        pdb_id="1STP",
        chain="A",
        disease_context="calibration",
        hotspots=(45, 88),
        approved=True,
    )


def test_lit_search_agent_uses_registry():
    registry = ToolRegistry()
    registry.register(pubmed_stub())
    agent = LitSearchAgent(registry=registry)
    section = agent.run(_safe_target())
    assert section.heading == "Literature review"
    assert len(section.items) > 0
    assert "streptavidin" in section.items[0].lower() or "stub" in section.items[0].lower()


def test_build_brief_composes_all_sections():
    registry = ToolRegistry()
    registry.register(pubmed_stub())
    brief = build_brief(
        target=_safe_target(),
        agents=[
            LitSearchAgent(registry=registry),
            PriorArtAgent(registry=registry),
            MechanismAgent(registry=registry),
            ChemSpaceAgent(registry=registry),
            FailureAgent(registry=registry),
            SynthesisAgent(registry=registry),
        ],
    )
    assert isinstance(brief, Brief)
    headings = [s.heading for s in brief.sections]
    assert "Literature review" in headings
    assert "Prior art" in headings
    assert "Mechanism" in headings
    assert "Chemical space" in headings
    assert "Failure modes" in headings
    assert "Synthesizability" in headings


def test_brief_renders_markdown():
    registry = ToolRegistry()
    registry.register(pubmed_stub())
    brief = build_brief(
        target=_safe_target(),
        agents=[LitSearchAgent(registry=registry)],
    )
    md = brief.to_markdown()
    assert md.startswith("# Research brief")
    assert "## Literature review" in md
    assert "streptavidin" in md.lower()


def test_brief_is_frozen():
    brief = Brief(target_id="x", sections=())
    import pytest

    with pytest.raises((AttributeError, TypeError)):
        brief.target_id = "y"  # type: ignore[misc]
