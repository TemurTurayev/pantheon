"""TDD specs for the adapter layer.

Adapters are the boundary between PANTHEON and any specific LLM backend.
They must be immutable, deterministic given the same inputs, and expose
a uniform response shape.
"""

from __future__ import annotations

import pytest

from pantheon.adapters import Adapter, AdapterResponse, MockAdapter, ToolCall


def test_mock_adapter_returns_scripted_response():
    adapter = MockAdapter(name="mock-1", script=["hello"])
    response = adapter.generate(system="s", user="u", tool_schemas=[], max_tokens=100)
    assert isinstance(response, AdapterResponse)
    assert response.text == "hello"
    assert response.tool_calls == ()
    assert response.adapter_name == "mock-1"


def test_mock_adapter_emits_tool_calls():
    script = [
        AdapterResponse(
            adapter_name="mock-2",
            text="calling a tool",
            tool_calls=(ToolCall(name="pubmed_search", arguments={"query": "EGFR"}),),
            tokens_in=10,
            tokens_out=5,
            latency_ms=1,
        )
    ]
    adapter = MockAdapter(name="mock-2", script=script)
    response = adapter.generate(system="", user="", tool_schemas=[], max_tokens=100)
    assert len(response.tool_calls) == 1
    assert response.tool_calls[0].name == "pubmed_search"
    assert response.tool_calls[0].arguments == {"query": "EGFR"}


def test_mock_adapter_immutable_history():
    """Each generate() call must not mutate the original script."""
    script = ["first", "second"]
    adapter = MockAdapter(name="mock-3", script=script)
    adapter.generate(system="", user="", tool_schemas=[], max_tokens=1)
    # Original list must be untouched even after consumption.
    assert script == ["first", "second"]


def test_mock_adapter_scripts_exhausted_raises():
    adapter = MockAdapter(name="mock-4", script=["only"])
    adapter.generate(system="", user="", tool_schemas=[], max_tokens=1)
    with pytest.raises(RuntimeError, match="script exhausted"):
        adapter.generate(system="", user="", tool_schemas=[], max_tokens=1)


def test_adapter_response_is_frozen():
    r = AdapterResponse(
        adapter_name="x",
        text="t",
        tool_calls=(),
        tokens_in=1,
        tokens_out=2,
        latency_ms=3,
    )
    with pytest.raises((AttributeError, TypeError)):
        r.text = "mutated"  # type: ignore[misc]


def test_tool_call_is_frozen():
    tc = ToolCall(name="boltz2", arguments={"a": 1})
    with pytest.raises((AttributeError, TypeError)):
        tc.name = "other"  # type: ignore[misc]


def test_adapter_is_a_protocol():
    """Any class with the right shape should satisfy the Adapter protocol."""

    class MinimalAdapter:
        name = "minimal"

        def generate(self, system, user, tool_schemas, max_tokens):  # type: ignore[no-untyped-def]
            return AdapterResponse(
                adapter_name=self.name,
                text="",
                tool_calls=(),
                tokens_in=0,
                tokens_out=0,
                latency_ms=0,
            )

    m: Adapter = MinimalAdapter()  # static-type compatibility only
    assert m.generate("", "", [], 1).adapter_name == "minimal"
