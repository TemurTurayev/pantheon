"""Tests for the adapter tool-call loop."""

from __future__ import annotations

from pantheon.adapters import AdapterResponse, MockAdapter, ToolCall
from pantheon.arena.tool_loop import run_tool_loop
from pantheon.tools import ToolRegistry
from pantheon.tools.stubs.pubmed import pubmed_stub


def _resp(name: str, text: str = "", tool_calls=()):
    return AdapterResponse(
        adapter_name=name,
        text=text,
        tool_calls=tool_calls,
        tokens_in=1,
        tokens_out=1,
        latency_ms=1,
    )


def test_tool_loop_resolves_one_tool_call():
    registry = ToolRegistry()
    registry.register(pubmed_stub())

    # Turn 1 requests a tool. Turn 2 emits final text.
    adapter = MockAdapter(
        name="m",
        script=[
            _resp("m", tool_calls=(ToolCall(name="pubmed_search", arguments={"query": "EGFR", "max_results": 1}),)),
            _resp("m", text="final candidate"),
        ],
    )

    result = run_tool_loop(
        adapter=adapter,
        registry=registry,
        system="",
        initial_user="design",
        tool_budget=5,
        max_tokens=64,
    )
    assert result.final_text == "final candidate"
    assert len(result.tool_calls) == 1
    assert result.tool_calls[0].tool == "pubmed_search"
    assert result.tool_calls[0].output["results"][0]["pmid"].startswith("PMID")


def test_tool_loop_stops_at_tool_budget():
    registry = ToolRegistry()
    registry.register(pubmed_stub())

    # Always request a tool — budget should force termination.
    def spam_script():
        return [
            _resp(
                "m",
                tool_calls=(ToolCall(name="pubmed_search", arguments={"query": "x", "max_results": 1}),),
            )
            for _ in range(10)
        ]

    adapter = MockAdapter(name="m", script=spam_script())

    result = run_tool_loop(
        adapter=adapter,
        registry=registry,
        system="",
        initial_user="x",
        tool_budget=3,
        max_tokens=64,
    )
    assert len(result.tool_calls) == 3
    assert result.forfeited is True


def test_tool_loop_unknown_tool_counts_as_forfeit_penalty_not_crash():
    registry = ToolRegistry()  # empty

    adapter = MockAdapter(
        name="m",
        script=[
            _resp("m", tool_calls=(ToolCall(name="does_not_exist", arguments={}),)),
            _resp("m", text="recovered"),
        ],
    )

    result = run_tool_loop(
        adapter=adapter,
        registry=registry,
        system="",
        initial_user="x",
        tool_budget=5,
        max_tokens=64,
    )
    assert result.final_text == "recovered"
    assert len(result.errors) == 1
    assert "unknown tool" in result.errors[0]
