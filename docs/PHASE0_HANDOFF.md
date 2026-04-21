# Phase 0 — Handoff

## What shipped

- Full documentation set in `docs/`:
  - `ARCHITECTURE.md` — 7-layer stack
  - `ROADMAP.md` — 10-phase plan
  - `LLM_INTEGRATION.md` — adapter contract and three integration paths
  - `MCP_TOOLS.md` — full tool catalog schema
  - `BIOSECURITY.md` — 4-gate policy, guardian LLM, red-team protocol
  - `SEASONS.md` — season manifest, league structure, opening line-up
  - `VISUALIZATION.md` — UI design, streaming mode
  - `VALIDATION.md` — wet-lab pipeline via Adaptyv Bio
  - `PUBLISHING.md` — HuggingFace / Zenodo / aiXiv / TDC pipeline
- Python package (src layout, `pyproject.toml`, pytest config)
- Adapter layer:
  - `Adapter` protocol, frozen `AdapterResponse`, frozen `ToolCall`
  - `MockAdapter` for deterministic tests
  - `CliAdapter` with factories `claude_cli()`, `gemini_cli()`, `codex_cli()`
- `Target` primitive with YAML loader and biosecurity gate
- `Round` + `run_round` orchestrator (Phase-0 minimal)
- CLI demo: `python -m pantheon.arena.runner --target seasons/S0_streptavidin/config.yaml`
- Season 0 manifest (streptavidin calibration)
- **18 tests, all green**

## How to run

```bash
cd /Users/temur/Desktop/pantheon
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

pytest                                                           # all green
python -m pantheon.arena.runner --target seasons/S0_streptavidin/config.yaml
```

## Explicit non-goals in Phase 0

The following are deliberately stubbed or absent; they arrive in later phases:

- Real tool calls (Boltz-2, RFdiffusion, …) — Phase 2
- Research brief generation — Phase 3
- Scoring and ELO — Phase 4
- Web UI — Phase 5
- Wet-lab integration — Phase 7
- Publishing pipeline — Phase 8

## Design invariants worth preserving

1. **Immutability end-to-end.** `AdapterResponse`, `ToolCall`, `Target`, `RoundResult` are all frozen dataclasses. The round orchestrator never mutates its inputs.
2. **Adapters are pure boundaries.** No tool logic lives in an adapter. Tools live (will live) in the MCP gateway. Adding a new LLM provider must remain ~40 LOC.
3. **Biosecurity gate is not optional.** `Target.require_approved()` is called by the orchestrator before any work proceeds. Do not add a bypass flag.
4. **TDD for every new behaviour.** Tests precede code. Every test in `tests/` should stay runnable with zero external dependencies (no network, no real CLI).

## Next-phase starter tasks (Phase 1 — MCP tool gateway)

These are sized for one working day each, in order:

1. `src/pantheon/tools/schema.py` — JSON-schema types for tool I/O (start with `pubmed_search`, `rdkit_analyze`, `biosecurity_screen` — the three cheapest tools to prototype).
2. `src/pantheon/tools/registry.py` — tool registry keyed by name.
3. `src/pantheon/tools/cache.py` — content-addressed cache (BLAKE3, on-disk).
4. Stub implementations (`tools/stubs/*.py`) that return deterministic fake payloads. The arena should be able to complete a round that includes tool calls using only stubs.
5. `src/pantheon/arena/tool_loop.py` — extend `run_round` to loop `adapter.generate → tool call → append tool result → adapter.generate …` up to a tool budget.
6. Tests for each tool stub (contract test: "given these inputs, expect this schema").
7. `docs/MCP_TOOLS.md` needs a concrete transport decision (stdio vs. HTTP) — pick stdio for local demos, HTTP for Phase 6 streaming.

## Open questions for the lead

- Which cloud partner for the first non-stub tool call? (Modal, Lambda, Nebius?)
- Single MCP server or per-tool-family servers? (Start single; split if latency becomes a problem.)
- Governance: 2-person biosecurity board — who are the two people? Internal or external reviewer for S1 onwards?
- Streaming partner: Twitch or YouTube first? Affects Phase 6 asset sizes.

## References of record

All external work cited during design is listed in `docs/ARCHITECTURE.md` and inline in individual policy docs. Key upstream projects to track:

- Adaptyv Bio — wet-lab partner
- Boltz-2 (MIT) — structure + affinity
- RFdiffusion / ProteinMPNN — generative design
- Chai-1 / OpenFold3 — structure alternatives
- Therapeutics Data Commons — benchmark destination
- aiXiv — AI-authored preprint venue
- SecureBio, IBBIS — biosecurity screening
- Mol\* — 3D viewer
