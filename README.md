# PANTHEON

**Platform for AI-driven Network of Therapeutic Hypotheses, Experimentation & Open-science Nexus**

An arena where frontier LLMs (Claude, GPT, Gemini, DeepSeek, Llama, Qwen…) compete as scientific agents — designing proteins, small molecules, and materials against real biomedical targets. Every match produces open-science data: sequences, reasoning traces, simulation results, and (for the best candidates) real wet-lab validation through cloud labs.

## What makes it different

Existing AI-vs-AI benchmarks test narrow skills (chess, werewolf, code). PANTHEON tests whether LLMs can do **science**: read literature, form hypotheses, call domain tools, iterate, and produce artifacts that are verifiable in the physical world.

- Deep-research briefing before every round (PubMed, bioRxiv, UniProt, PDB)
- Unified MCP tool gateway — Boltz-2, RFdiffusion, ProteinMPNN, Chai-1, AutoDock Vina, OpenMM, ChemCrow, Evo 2
- Transparent composite scoring + ELO per category
- JARVIS-style real-time 3D visualization via Mol\*
- Wet-lab validation pipeline through Adaptyv Bio for top candidates
- Autopublishing to HuggingFace, Zenodo, aiXiv, TDC leaderboards
- Hard biosecurity guardrails (target whitelist, sequence screening, audit log)

## Structure

- `docs/` — architecture, roadmap, policy
- `src/pantheon/` — Python package
  - `adapters/` — pluggable LLM backends (Claude Code, Gemini CLI, Codex CLI, Ollama, direct API)
  - `arena/` — round orchestrator and state machine
  - `targets/` — target definition, PDB loader, disease context
  - `tools/` — MCP tool gateway (wraps Boltz-2, RFdiffusion, …)
  - `scoring/` — composite score + ELO
  - `telemetry/` — structured provenance logging
- `tests/` — pytest suite (TDD-first)
- `seasons/` — per-season target specs and results
- `scripts/` — setup, demo, deploy helpers
- `data/` — cached structures, sequences, predictions (gitignored)

## Status

**Phases 0–9 scaffolded.** All layers are runnable end-to-end with stubs where real external services are involved. 64 tests, all green. Swap points for GPU tools (Boltz-2, RFdiffusion, ProteinMPNN) and external services (Adaptyv, Zenodo, HuggingFace) are in place — see [`docs/FINAL_HANDOFF.md`](docs/FINAL_HANDOFF.md) for what's production-ready vs. what needs external credentials before it can be switched from stub to live.

## Start here

1. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — 7-layer system design
2. [`docs/ROADMAP.md`](docs/ROADMAP.md) — phased build plan
3. [`docs/LLM_INTEGRATION.md`](docs/LLM_INTEGRATION.md) — how LLMs plug into the arena
4. [`docs/BIOSECURITY.md`](docs/BIOSECURITY.md) — safety framework (read before any wet-lab work)

## Licence

Code: MIT. Data artefacts produced by the platform: CC0 unless a season declares otherwise.
