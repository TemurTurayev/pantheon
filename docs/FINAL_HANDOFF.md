# Final handoff — Phases 0–9

All nine roadmap phases have been scaffolded. Pytest: **64/64 green**. The arena runs end-to-end against stubs; every real-world integration point is behind a swappable interface.

## Layer-by-layer status

| Layer | Status | Evidence |
|-------|--------|----------|
| L1 — Substrate (compute, data cache) | done | `tools/cache.py`, deterministic on-disk cache with SHA-256 keys |
| L2 — MCP tool gateway | done (stubs + 2 real) | `tools/registry.py`, `tools/stubs/`, `tools/real/` |
| L3 — Research pre-brief | done | `research/agents.py`, `research/brief.py` |
| L4 — Design arena | done (minimal) | `arena/round.py`, `arena/tool_loop.py` |
| L5 — Visualization | scaffolded | `frontend/` ready for `npm install` |
| L6 — Judging & telemetry | done (scoring + Glicko-2 ELO) | `scoring/compose.py`, `scoring/elo.py` |
| L7 — Validation & publishing | client + bundler done, uploads stubbed | `wetlab/adaptyv.py`, `publish/bundler.py` |

## Test map

```
tests/test_adapters.py         — Adapter protocol, MockAdapter, frozen responses
tests/test_cli_adapters.py     — claude/gemini/codex CLI shells (no real processes)
tests/test_target.py           — target YAML, biosecurity gate
tests/test_round.py            — round orchestrator
tests/test_tool_registry.py    — register/invoke/catalog
tests/test_tool_cache.py       — content-addressed cache
tests/test_tool_stubs.py       — pubmed/rdkit/biosec stubs
tests/test_tool_real.py        — PubMed HTTP + RDKit with graceful fallback
tests/test_gpu_contracts.py    — Boltz-2/RFdiffusion/ProteinMPNN interface
tests/test_tool_loop.py        — tool-call loop with budget and unknown-tool recovery
tests/test_research_brief.py   — 6 research sub-agents + brief composer
tests/test_scoring.py          — composite score + Glicko-2
tests/test_stream.py           — EventBus + SSE encoder
tests/test_frontend_bridge.py  — Python → round.json contract
tests/test_wetlab.py           — Adaptyv submit/poll/ingest with biosec gate
tests/test_publish.py          — bundler + manifest + uploader stub
```

Run everything:

```bash
source .venv/bin/activate
pytest
python -m pantheon.arena.runner --target seasons/S0_streptavidin/config.yaml
```

Frontend preview:

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173 — renders seasons/S0_streptavidin demo from public/round.json
```

Streaming bus:

```bash
python -m pantheon.stream.server    # listens on http://127.0.0.1:8765/events
```

## What's production-ready today

- Adapter contract + three CLI shells (pointing at real `claude`, `gemini`, `codex` binaries when they're installed).
- Tool registry, content-addressed cache, tool-call loop with budgets and error recovery.
- Target biosecurity gate — refuses to proceed on any unapproved target.
- Composite scoring + Glicko-2 ELO — matches literature.
- Research brief composer — literature agent calls whatever `pubmed_search` is registered; other agents produce structured sections ready for an LLM upgrade.
- Adaptyv client — refuses to submit sequences that fail the in-process biosecurity screen, then POSTs/GETs through any injected HTTP transport.
- Season bundler + deterministic manifest with per-file hashes.
- SSE bus + minimal stdlib HTTP server for streaming round events.
- Frontend React + Vite + Mol\* app with five panels.

## What needs external credentials or deps before flipping from stub to live

- **Boltz-2 / RFdiffusion / ProteinMPNN / Chai-1 / OpenMM** — interfaces ready in `tools/real/gpu_contracts.py`. Requires GPU (H100 on Modal recommended) + upstream model weights.
- **RDKit real** — will activate automatically if `pip install rdkit` is available; falls back to stub otherwise (see `tools/real/rdkit_real.py`).
- **PubMed HTTP** — uses injected transport; `HttpxTransport` works out of the box with `httpx` (already in deps).
- **Adaptyv wet lab** — client ready; needs API key and a transport implementing the `HttpTransport` protocol.
- **Zenodo / HuggingFace upload** — `StubUploader` records calls; real uploaders implement the same protocol.
- **Guardian LLM** — designed in `docs/BIOSECURITY.md`; not wired to a specific provider yet.

## Design invariants preserved across phases

1. **Immutability** — every round/candidate/metric/brief is a frozen dataclass.
2. **Adapters are thin** — no tool logic leaks into any adapter; adding a new LLM is ~40 LOC.
3. **Biosecurity gate is mandatory** — `Target.require_approved()` at round start; `AdaptyvClient` screens every sequence before it leaves the process.
4. **Reproducibility** — tool cache keyed by canonical JSON, manifests carry SHA-256 hashes, seeds flow through GPU contracts.
5. **Zero-network tests** — the entire suite runs offline with no heavy packages, so CI is green from day one.

## File inventory (created across all phases)

```
docs/
  ARCHITECTURE.md, BIOSECURITY.md, GOVERNANCE.md, LLM_INTEGRATION.md,
  MCP_TOOLS.md, PHASE0_HANDOFF.md, PUBLISHING.md, ROADMAP.md,
  SEASONS.md, VALIDATION.md, VISUALIZATION.md, FINAL_HANDOFF.md

src/pantheon/
  adapters/      base, cli, mock, __init__
  arena/         round, runner, tool_loop, __init__
  publish/       bundler, manifest, upload, __init__
  research/      agents, brief, __init__
  scoring/       candidate, compose, elo, __init__
  stream/        bus, server, sse, __init__
  targets/       target, __init__
  telemetry/     __init__  (reserved)
  tools/         base, cache, registry, __init__
    real/        gpu_contracts, pubmed_http, rdkit_real, __init__
    stubs/       biosec, pubmed, rdkit, __init__
  viz/           exporter, __init__

tests/           16 test modules, 64 tests, all green

frontend/
  package.json, tsconfig.json, vite.config.ts, index.html, .gitignore
  src/           main.tsx, App.tsx, types.ts
    components/  StructurePanel, PlayerPanel, AffinityChart, ToolTimeline, EventTicker
  public/        round.json (demo payload)

seasons/
  S0_streptavidin/config.yaml

.github/
  ISSUE_TEMPLATE/target_proposal.md, rfc.md
  PULL_REQUEST_TEMPLATE.md
  workflows/tests.yml

Root:  README.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, LICENSE, pyproject.toml, .gitignore, .env.example
```

## Next concrete steps (post-handoff)

Not part of this scaffold, but naturally next:

1. **Real Boltz-2** — swap `gpu_contracts.Boltz2Contract._call_stub` for a Modal deployment that runs the upstream model; keep the output schema byte-identical.
2. **Real biosecurity screen** — replace `tools/stubs/biosec.py` with a SecureBio-compliant implementation behind the same `Tool` protocol.
3. **First live round** — pick a target from S1–S8 in `docs/SEASONS.md`, get biosec board approval, wire three real CLIs (claude/gemini/codex) against stubs, then flip tools to real.
4. **Streaming UI** — replace the `fetch("/round.json")` in `frontend/src/App.tsx` with an EventSource against `pantheon.stream.server`.
5. **Adaptyv account + first wet-lab submission** — requires signed-off season + API credentials.
6. **Guardian LLM** — bolt on a non-participant model that reviews candidates before they enter the wet-lab queue.

Everything above operates inside the scaffolded architecture without breaking existing tests.
