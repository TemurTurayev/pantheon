"""Deterministic in-memory adapter for tests and offline demos.

Feed it a list of scripted responses. Each call to ``generate`` consumes
one entry. Strings are wrapped as plain-text ``AdapterResponse`` objects;
pre-built ``AdapterResponse`` instances are emitted as-is.
"""

from __future__ import annotations

from typing import Any

from pantheon.adapters.base import AdapterResponse

ScriptEntry = str | AdapterResponse


class MockAdapter:
    """Adapter that replays a pre-built script.

    The script is captured as an immutable tuple so the caller's list is
    never mutated.
    """

    def __init__(self, name: str, script: list[ScriptEntry]) -> None:
        self.name = name
        self._script: tuple[ScriptEntry, ...] = tuple(script)
        self._cursor: int = 0

    def generate(
        self,
        system: str,
        user: str,
        tool_schemas: list[dict[str, Any]],
        max_tokens: int,
    ) -> AdapterResponse:
        if self._cursor >= len(self._script):
            raise RuntimeError(f"MockAdapter '{self.name}' script exhausted")
        entry = self._script[self._cursor]
        self._cursor += 1
        if isinstance(entry, AdapterResponse):
            return entry
        return AdapterResponse(
            adapter_name=self.name,
            text=entry,
            tool_calls=(),
            tokens_in=len(user),
            tokens_out=len(entry),
            latency_ms=0,
        )
