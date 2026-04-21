"""Registry that exposes tools by name and provides the MCP-style catalog."""

from __future__ import annotations

from typing import Any

from pantheon.tools.base import Tool, ToolResult


class ToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, Tool] = {}

    def register(self, tool: Tool) -> None:
        if tool.name in self._tools:
            raise ValueError(f"tool '{tool.name}' already registered")
        self._tools[tool.name] = tool

    def get(self, name: str) -> Tool:
        if name not in self._tools:
            raise KeyError(f"unknown tool '{name}'")
        return self._tools[name]

    def invoke(self, name: str, arguments: dict[str, Any]) -> ToolResult:
        return self.get(name)(arguments)

    def catalog(self) -> list[dict[str, Any]]:
        return [
            {
                "name": t.name,
                "input_schema": t.input_schema,
                "output_schema": t.output_schema,
            }
            for t in self._tools.values()
        ]

    def names(self) -> list[str]:
        return list(self._tools.keys())
