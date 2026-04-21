"""Tests for subscription-backed CLI adapters.

The CLI adapters shell out to ``claude``, ``gemini``, or ``codex`` and parse
stdout. We never invoke the real binaries from the test suite — a callable
runner is injected instead.
"""

from __future__ import annotations

import pytest

from pantheon.adapters.base import AdapterResponse
from pantheon.adapters.cli import CliAdapter, CliRunResult


def fake_runner_factory(stdout: str, exit_code: int = 0, duration_ms: int = 5):
    def runner(argv: list[str], stdin: str) -> CliRunResult:
        assert isinstance(argv, list)
        return CliRunResult(stdout=stdout, stderr="", exit_code=exit_code, duration_ms=duration_ms)

    return runner


def test_cli_adapter_captures_stdout():
    runner = fake_runner_factory(stdout="hello from CLI")
    adapter = CliAdapter(name="claude-cli", argv_template=["claude", "-p"], runner=runner)

    response = adapter.generate(system="", user="design a binder", tool_schemas=[], max_tokens=10)

    assert isinstance(response, AdapterResponse)
    assert response.text == "hello from CLI"
    assert response.adapter_name == "claude-cli"
    assert response.latency_ms == 5


def test_cli_adapter_passes_prompt_on_stdin():
    captured: dict[str, object] = {}

    def runner(argv: list[str], stdin: str) -> CliRunResult:
        captured["argv"] = argv
        captured["stdin"] = stdin
        return CliRunResult(stdout="ok", stderr="", exit_code=0, duration_ms=1)

    adapter = CliAdapter(name="gemini-cli", argv_template=["gemini", "-p"], runner=runner)
    adapter.generate(system="you are a scientist", user="design X", tool_schemas=[], max_tokens=5)

    assert captured["argv"] == ["gemini", "-p"]
    # System and user prompt are concatenated onto stdin.
    stdin = captured["stdin"]
    assert isinstance(stdin, str)
    assert "you are a scientist" in stdin
    assert "design X" in stdin


def test_cli_adapter_non_zero_exit_raises():
    runner = fake_runner_factory(stdout="", exit_code=1)
    adapter = CliAdapter(name="codex-cli", argv_template=["codex", "exec"], runner=runner)

    with pytest.raises(RuntimeError, match="exit code 1"):
        adapter.generate(system="", user="x", tool_schemas=[], max_tokens=1)


def test_cli_adapter_strips_trailing_whitespace():
    runner = fake_runner_factory(stdout="answer\n\n")
    adapter = CliAdapter(name="any", argv_template=["any"], runner=runner)

    response = adapter.generate(system="", user="", tool_schemas=[], max_tokens=1)
    assert response.text == "answer"
