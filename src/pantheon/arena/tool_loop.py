"""Adapter tool-call loop.

The loop runs as:

    system + user  →  adapter.generate()
    for each tool call the model requests:
        invoke it in the registry
        append its result to the conversation history
    call adapter.generate() again with the appended history
    repeat until the model emits a final turn with no tool calls
    OR the tool budget is exhausted (forfeit).

Unknown tool names never crash the loop — they are logged as errors and
the model is given a chance to recover on its next turn.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field

from pantheon.adapters.base import Adapter
from pantheon.tools.base import ToolResult
from pantheon.tools.registry import ToolRegistry


@dataclass(frozen=True, slots=True)
class ToolLoopResult:
    final_text: str
    tool_calls: tuple[ToolResult, ...]
    errors: tuple[str, ...]
    forfeited: bool
    turns: int


@dataclass
class _Conversation:
    system: str
    user: str
    history: list[str] = field(default_factory=list)

    def render_user(self) -> str:
        if not self.history:
            return self.user
        return self.user + "\n\n" + "\n\n".join(self.history)


def run_tool_loop(
    *,
    adapter: Adapter,
    registry: ToolRegistry,
    system: str,
    initial_user: str,
    tool_budget: int,
    max_tokens: int,
) -> ToolLoopResult:
    convo = _Conversation(system=system, user=initial_user)
    tool_calls: list[ToolResult] = []
    errors: list[str] = []
    turns = 0
    final_text = ""
    forfeited = False

    while True:
        turns += 1
        response = adapter.generate(
            system=convo.system,
            user=convo.render_user(),
            tool_schemas=registry.catalog(),
            max_tokens=max_tokens,
        )
        if not response.tool_calls:
            final_text = response.text
            break

        for call in response.tool_calls:
            if len(tool_calls) >= tool_budget:
                forfeited = True
                break
            try:
                result = registry.invoke(call.name, dict(call.arguments))
                tool_calls.append(result)
                convo.history.append(
                    f"[tool {call.name} -> {json.dumps(result.output, sort_keys=True)}]"
                )
            except KeyError as exc:
                errors.append(f"unknown tool: {exc}")
                convo.history.append(f"[tool error: unknown tool '{call.name}']")

        if forfeited:
            break

    return ToolLoopResult(
        final_text=final_text,
        tool_calls=tuple(tool_calls),
        errors=tuple(errors),
        forfeited=forfeited,
        turns=turns,
    )
