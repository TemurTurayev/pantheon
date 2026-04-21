"""Tests for the tool registry and base Tool protocol."""

from __future__ import annotations

import pytest

from pantheon.tools.base import Tool, ToolResult
from pantheon.tools.registry import ToolRegistry


class _Echo:
    name = "echo"
    input_schema = {"type": "object", "properties": {"x": {"type": "string"}}, "required": ["x"]}
    output_schema = {"type": "object", "properties": {"x": {"type": "string"}}}

    def __call__(self, arguments: dict) -> ToolResult:
        return ToolResult(tool="echo", output={"x": arguments["x"]}, cached=False)


def test_registry_round_trip():
    registry = ToolRegistry()
    registry.register(_Echo())

    tool = registry.get("echo")
    assert isinstance(tool, Tool)

    result = registry.invoke("echo", {"x": "hi"})
    assert result.output == {"x": "hi"}
    assert result.tool == "echo"


def test_registry_unknown_tool_raises():
    registry = ToolRegistry()
    with pytest.raises(KeyError, match="unknown tool"):
        registry.invoke("nope", {})


def test_registry_rejects_duplicate_registration():
    registry = ToolRegistry()
    registry.register(_Echo())
    with pytest.raises(ValueError, match="already registered"):
        registry.register(_Echo())


def test_registry_schema_catalog():
    registry = ToolRegistry()
    registry.register(_Echo())
    catalog = registry.catalog()
    assert len(catalog) == 1
    entry = catalog[0]
    assert entry["name"] == "echo"
    assert entry["input_schema"]["type"] == "object"
