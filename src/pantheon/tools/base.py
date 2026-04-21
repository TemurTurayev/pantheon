"""Tool protocol and result types.

A Tool is anything the MCP gateway can invoke: a literature search, a
structure predictor, a safety screen. Tools are stateless callables.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol, runtime_checkable


@dataclass(frozen=True, slots=True)
class ToolResult:
    tool: str
    output: dict[str, Any]
    cached: bool
    cache_key: str | None = None
    meta: dict[str, Any] = field(default_factory=dict)


@runtime_checkable
class Tool(Protocol):
    name: str
    input_schema: dict[str, Any]
    output_schema: dict[str, Any]

    def __call__(self, arguments: dict[str, Any]) -> ToolResult: ...
