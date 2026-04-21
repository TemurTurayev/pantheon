"""Adapter protocol and response types.

The arena holds *no* provider-specific logic — it only speaks this protocol.
Implementations live alongside this file (mock.py, claude_cli.py, …) and are
registered in ``__init__.py``.

Everything here is immutable: an adapter returns a frozen ``AdapterResponse``
and never mutates its inputs.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol, runtime_checkable


@dataclass(frozen=True, slots=True)
class ToolCall:
    """A request by the LLM to invoke one MCP tool."""

    name: str
    arguments: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class AdapterResponse:
    """One turn of output from an adapter.

    Attributes:
        adapter_name: Stable identity of the backend (e.g. ``claude-opus-4-7``).
        text: Natural-language text produced by the model.
        tool_calls: Zero or more tool invocations the model wants to make.
        tokens_in: Prompt tokens consumed (best-effort; 0 if the backend
            does not report it).
        tokens_out: Completion tokens produced.
        latency_ms: Wall-clock milliseconds spent in the provider call.
        cost_usd: Best-effort cost estimate. 0.0 for subscription CLIs.
    """

    adapter_name: str
    text: str
    tool_calls: tuple[ToolCall, ...]
    tokens_in: int
    tokens_out: int
    latency_ms: int
    cost_usd: float = 0.0


@runtime_checkable
class Adapter(Protocol):
    """The one interface every LLM backend implements."""

    name: str

    def generate(
        self,
        system: str,
        user: str,
        tool_schemas: list[dict[str, Any]],
        max_tokens: int,
    ) -> AdapterResponse:
        """Produce one response.

        ``system`` and ``user`` carry the two canonical prompt slots.
        ``tool_schemas`` is the MCP tool catalog advertised to the model,
        in the provider-agnostic JSON-schema form used by PANTHEON.
        """
        ...
