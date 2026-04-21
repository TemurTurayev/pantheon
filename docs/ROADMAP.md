# Roadmap

Phased build. Every phase ends with a runnable demo and a green test suite.

## Phase 0 — Bootstrap (this commit)

**Goal**: project skeleton, documentation, adapter layer.

- [x] Directory scaffold
- [x] Core docs (README, ARCHITECTURE, ROADMAP)
- [x] Subsystem docs (MCP tools, biosecurity, seasons, LLM integration, visualization, validation, publishing)
- [x] Python package (`pyproject.toml`, src layout)
- [x] Adapter base class with tests
- [x] Mock adapter, Claude CLI adapter, Gemini CLI adapter, Codex CLI adapter
- [x] Target loader with tests
- [x] Round skeleton with tests

**Demo**: `pytest` runs green; `python -m pantheon.arena.runner --adapter mock --target examples/streptavidin.yaml` prints a simulated round log.

## Phase 1 — MCP Tool Gateway (stub layer)

**Goal**: uniform tool surface with stub implementations so the orchestrator works end-to-end before expensive tools are wired.

- MCP server skeleton (stdio + HTTP transport)
- Stub implementations of every tool, returning deterministic fake payloads
- Content-addressed cache
- Biosecurity screen stub
- Integration test: mock adapter calls every tool

**Demo**: round completes with a transcript containing tool calls; scoring runs on synthetic outputs.

## Phase 2 — Real in-silico tools

**Goal**: swap stubs for real scientific tools, one family at a time.

- RDKit analyzer (small, pure Python — start here)
- AutoDock Vina wrapper (binary + Python bindings)
- OpenMM molecular dynamics (short sanity-check simulations)
- Boltz-2 wrapper (local or remote via Modal)
- RFdiffusion + ProteinMPNN pipeline
- Chai-1 as alternative structure predictor
- Evo 2 score (API via NVIDIA BioNeMo or local)
- ChemCrow integration (external service)
- Literature tools: PubMed, bioRxiv, UniProt, PDB, AlphaFold DB

Each tool ships with a contract test that verifies shape of output and handles failure modes.

## Phase 3 — Research Pre-brief

**Goal**: upgrade the "brief" from a static YAML to an agentically generated document.

- LitSearchAgent, PriorArtAgent, MechanismAgent, ChemSpaceAgent, FailureAgent, SynthesisAgent
- Orchestrator that runs them in parallel and merges into a single brief
- Cache briefs by (target, date) to keep reruns cheap
- Unit tests against recorded literature fixtures

## Phase 4 — Scoring & ELO

**Goal**: fair, reproducible multi-metric ranking.

- Composite score function (config-driven weights per season)
- Per-category ELO with Glicko-2 underneath
- Tournament runner: round-robin, Swiss, bracket
- Deterministic re-scoring from JSONL logs (for audit)

## Phase 5 — Visualization MVP

**Goal**: a web UI that shows a completed round with replay.

- Next.js / Vite + React front-end
- Mol\* embed for the target, ribbons, candidate superposition
- Recharts affinity timelines
- Reasoning stream panel (tails JSONL)
- "Replay round" slider that scrubs through the tool-call timeline

## Phase 6 — Live streaming mode

**Goal**: broadcast a round as it happens.

- WebSocket bridge from the arena runner to the UI
- HUD overlay for OBS ("esports scoreboard" style)
- Color palette + audio stingers for big affinity milestones
- Commentator adapter (separate LLM) that narrates to TTS

## Phase 7 — Wet-lab integration

**Goal**: close the design-test-learn loop.

- Adaptyv Bio client (sequence submission, job polling, result ingestion)
- Biosecurity screen (SecureBio / IBBIS sequence screening)
- Pre-submission whitelist check (target must be on approved list)
- Result-to-ELO pipeline: real assay data retro-updates rankings
- Public "Season Results" page with per-design wet-lab status

## Phase 8 — Open-science pipeline

**Goal**: every round publishes itself.

- HuggingFace dataset uploader
- Zenodo DOI minting
- aiXiv preprint draft generator (human-approval gate before submit)
- TDC leaderboard submission automation
- Provenance manifest per artefact

## Phase 9 — Community & seasons

**Goal**: make it sustainable beyond a single maintainer.

- Season proposal mechanism (issue template + review board)
- Partnerships with academic labs for deep validation
- Public calendar of seasons
- Governance doc (who can greenlight a target, biosecurity board)

---

## Timeline anchor (aspirational)

| Phase | Calendar target |
|-------|-----------------|
| 0     | Day 0           |
| 1     | Week 1          |
| 2     | Weeks 2–4       |
| 3     | Week 5          |
| 4     | Week 6          |
| 5     | Weeks 7–8       |
| 6     | Week 9          |
| 7     | Weeks 10–14     |
| 8     | Week 15         |
| 9     | Ongoing         |

Slippage is expected; the roadmap optimises for ordering, not dates.
