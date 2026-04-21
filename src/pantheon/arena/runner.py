"""Command-line entry point for running a single demo round.

Phase-0 scope: use mocked adapters (or the live CLIs if available) against
a YAML-defined target. No MCP tools, no scoring — just proves the arena
pipeline end-to-end.

Run::

    python -m pantheon.arena.runner --target seasons/S0_streptavidin/config.yaml
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from pantheon.adapters import MockAdapter
from pantheon.arena.round import Round, run_round
from pantheon.targets import Target


def _build_mock_pool() -> list[MockAdapter]:
    return [
        MockAdapter(
            name="mock-claude",
            script=[
                "Rationale: target binding loop around residue 45.\n"
                "Candidate:\n>mock-claude-1\nAAGVVKYAA"
            ],
        ),
        MockAdapter(
            name="mock-gpt",
            script=[
                "Rationale: target hydrophobic pocket near residue 88.\n"
                "Candidate:\n>mock-gpt-1\nHLFWPMADT"
            ],
        ),
        MockAdapter(
            name="mock-gemini",
            script=[
                "Rationale: symmetric helix approach.\n"
                "Candidate:\n>mock-gemini-1\nKKEAAYNII"
            ],
        ),
    ]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run one PANTHEON round (Phase 0 demo).")
    parser.add_argument("--target", type=Path, required=True, help="Path to target YAML")
    args = parser.parse_args(argv)

    target = Target.from_yaml(args.target)
    adapters = _build_mock_pool()
    result = run_round(Round(target=target, participants=adapters, max_tokens=256))

    json.dump(
        {
            "target": result.target_id,
            "order": list(result.order),
            "submissions": {
                name: {
                    "text": resp.text,
                    "tokens_in": resp.tokens_in,
                    "tokens_out": resp.tokens_out,
                    "latency_ms": resp.latency_ms,
                }
                for name, resp in result.submissions.items()
            },
        },
        sys.stdout,
        indent=2,
    )
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
