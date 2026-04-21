"""Subscription-backed CLI adapter.

Shells out to an official provider CLI (``claude``, ``gemini``, ``codex``)
that authenticates with a consumer subscription and streams its response
to stdout. The runner is injected so tests never spawn a real process.
"""

from __future__ import annotations

import subprocess
import time
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from pantheon.adapters.base import AdapterResponse


@dataclass(frozen=True, slots=True)
class CliRunResult:
    stdout: str
    stderr: str
    exit_code: int
    duration_ms: int


CliRunner = Callable[[list[str], str], CliRunResult]


def default_runner(argv: list[str], stdin: str) -> CliRunResult:
    """Real subprocess runner. Used at runtime; tests inject a fake."""
    started = time.perf_counter()
    completed = subprocess.run(
        argv,
        input=stdin,
        capture_output=True,
        text=True,
        check=False,
    )
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    return CliRunResult(
        stdout=completed.stdout,
        stderr=completed.stderr,
        exit_code=completed.returncode,
        duration_ms=elapsed_ms,
    )


class CliAdapter:
    """Generic CLI-backed adapter.

    Concrete flavours (claude, gemini, codex) differ only in ``argv_template``.
    """

    def __init__(
        self,
        name: str,
        argv_template: list[str],
        runner: CliRunner | None = None,
    ) -> None:
        self.name = name
        self._argv_template: tuple[str, ...] = tuple(argv_template)
        self._runner: CliRunner = runner or default_runner

    def generate(
        self,
        system: str,
        user: str,
        tool_schemas: list[dict[str, Any]],
        max_tokens: int,
    ) -> AdapterResponse:
        prompt = self._format_prompt(system, user)
        result = self._runner(list(self._argv_template), prompt)
        if result.exit_code != 0:
            raise RuntimeError(
                f"CliAdapter '{self.name}' exited with exit code {result.exit_code}: "
                f"{result.stderr.strip()[:200]}"
            )
        return AdapterResponse(
            adapter_name=self.name,
            text=result.stdout.rstrip(),
            tool_calls=(),
            tokens_in=len(prompt),
            tokens_out=len(result.stdout),
            latency_ms=result.duration_ms,
        )

    @staticmethod
    def _format_prompt(system: str, user: str) -> str:
        if system:
            return f"{system}\n\n---\n\n{user}"
        return user


def claude_cli(runner: CliRunner | None = None) -> CliAdapter:
    return CliAdapter(name="claude-cli", argv_template=["claude", "-p", "--output-format", "text"], runner=runner)


def gemini_cli(runner: CliRunner | None = None) -> CliAdapter:
    return CliAdapter(name="gemini-cli", argv_template=["gemini", "-p"], runner=runner)


def codex_cli(runner: CliRunner | None = None) -> CliAdapter:
    return CliAdapter(name="codex-cli", argv_template=["codex", "exec"], runner=runner)
