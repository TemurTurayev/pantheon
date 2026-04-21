# Architecture

PANTHEON is a 7-layer stack. Each layer is independently testable and swappable.

```
┌─────────────────────────────────────────────────────────┐
│  7. VALIDATION & PUBLISHING  — Adaptyv, aiXiv, Zenodo   │
├─────────────────────────────────────────────────────────┤
│  6. JUDGING & TELEMETRY      — ELO, composite score     │
├─────────────────────────────────────────────────────────┤
│  5. VISUALIZATION            — Mol*, Three.js, streaming│
├─────────────────────────────────────────────────────────┤
│  4. DESIGN ARENA             — LLMs competing           │
├─────────────────────────────────────────────────────────┤
│  3. RESEARCH PRE-BRIEF       — deep-research agents     │
├─────────────────────────────────────────────────────────┤
│  2. MCP TOOL GATEWAY         — unified tool surface     │
├─────────────────────────────────────────────────────────┤
│  1. COMPUTE & DATA SUBSTRATE — GPUs, PDB, UniProt …     │
└─────────────────────────────────────────────────────────┘
```

## Layer 1 — Substrate

- **Compute**: CPU for orchestration; GPU (H100 on Modal/Lambda, or local RTX 4090 / M-Mac MLX) for Boltz-2, RFdiffusion, ProteinMPNN, Chai-1, OpenMM.
- **Reference data**: UniProt, RCSB PDB, AlphaFold DB, ChEMBL, ChEBI, PubChem, ClinVar, ChEMBL-Bioactivity, RDKit's built-in datasets.
- **Caching**: content-addressed blob store under `data/cache/<hash>.bin` for deterministic reruns.

## Layer 2 — MCP Tool Gateway

One Model Context Protocol server exposes every scientific tool behind a uniform schema. Each participating LLM connects to the same server, so tool behavior is identical across players.

Tool families:

- **Literature & knowledge** — `pubmed_search`, `biorxiv_scan`, `semantic_scholar_graph`, `uniprot_lookup`, `pdb_fetch`, `alphafold_db_fetch`, `clinvar_mutations`
- **Structure & design** — `rfdiffusion`, `proteinmpnn`, `boltz2`, `chai1`, `autodock_vina`, `openmm_md`
- **Chemistry** — `chemcrow_call`, `rdkit_analyze`, `admet_predict`
- **Genomics** — `evo2_generate`, `evo2_score`
- **Materials (optional)** — `mattergen`, `dft_simulate`
- **Safety** — `biosecurity_screen` (mandatory before any synthesis request)

Full tool catalog in [`MCP_TOOLS.md`](MCP_TOOLS.md).

## Layer 3 — Research Pre-brief

Each round, every player gets a private research team of sub-agents that produce a 5–10 page structured brief before the design phase:

- `LitSearchAgent` — scans PubMed + bioRxiv for recent publications on the target
- `PriorArtAgent` — catalogs known binders, IC50 / Kd values, patents
- `MechanismAgent` — builds a knowledge graph target → pathway → disease
- `ChemSpaceAgent` — SAR analysis of known actives
- `FailureAgent` — failed clinical trials / attrition reasons
- `SynthesisAgent` — feasibility and cost estimation

The brief is pushed into the player's context before design begins. This prevents hallucinated biology and creates a reproducible knowledge baseline.

## Layer 4 — Design Arena

A round is a sandboxed competition:

```yaml
round:
  target: <PDB id + optional constraints>
  disease_context: <free text>
  tool_budget: 50
  time_budget_minutes: 120
  scratchpad_tokens: 200_000
  participants: [<adapter names>]
```

Each participant independently:

1. Reads the research brief.
2. Drafts a strategy on the scratchpad.
3. Calls MCP tools (subject to budget).
4. Iterates until satisfied or budget exhausted.
5. Submits up to N candidates with rationale and expected score.

The orchestrator records every tool call, latency, and token count.

## Layer 5 — Visualization

Browser-based, WebGL-first.

- **Mol\*** — primary 3D viewer for structures and trajectories.
- **Three.js** — HUD overlay: reasoning stream, tool timeline, affinity chart.
- **Recharts** / d3 — score and ELO graphs.
- **OBS Studio** — capture for Twitch/YouTube streams.

Layout concept and asset pipeline in [`VISUALIZATION.md`](VISUALIZATION.md).

## Layer 6 — Judging & Telemetry

Composite score per candidate:

```
score = w1 * (-ΔG)
      + w2 * iptm
      + w3 * stability_RMSD_inv
      + w4 * novelty
      + w5 * synthesizability
      - penalty_biosec
```

Weights are season-specific and published before the round starts (no post-hoc tuning).

Judges (all contribute to one composite number, no single point of failure):

- Physics — Boltz-2 + Chai-1 + OpenMM
- Chemistry — RDKit + ADMET predictors
- Literature — third-party critic LLM (not a participant)
- Wet lab — Adaptyv binding assay (periodic, season finalists only)

ELO is computed per category (Protein Designer, Small-Molecule Chemist, Literature Reasoner, Novel-Target Designer, Speed).

Every tool call is appended to an immutable JSONL log with content hashes of inputs and outputs. See [`telemetry/logger.py`](../src/pantheon/telemetry).

## Layer 7 — Validation & Publishing

- **Wet lab**: top-N candidates per season → biosecurity screen → Adaptyv Bio (sequence-to-data in ~3 weeks).
- **Datasets**: sequences, traces, predictions, and assay results published to HuggingFace + Zenodo with DOIs under CC0 (unless season dictates otherwise).
- **Preprints**: aiXiv / bioRxiv auto-draft, human-reviewed before submission.
- **Benchmarks**: season results contributed to Therapeutics Data Commons leaderboards.

Details in [`VALIDATION.md`](VALIDATION.md) and [`PUBLISHING.md`](PUBLISHING.md).

## Data flow

```
Target spec
   │
   ▼
Research agents → Brief (cached)
   │
   ▼
Player receives brief + tool catalog
   │
   ▼
Player calls tools ──► MCP Gateway ──► Boltz-2 / RFdiff / …
   │                                        │
   ▲────────────────────────────────────────┘
   │
   ▼
Submitted candidates
   │
   ▼
Composite scoring → ELO update
   │
   ▼
Top-N → biosecurity screen → Adaptyv wet lab
   │
   ▼
All artefacts → HuggingFace / Zenodo / aiXiv
```

## Non-goals

- Not a general chatbot arena — chat-only comparisons belong on LMArena.
- Not a human tutoring system.
- Not a drug-development pipeline that bypasses regulatory review. Leads surfaced by PANTHEON are starting points for academic or pharma-partnered medicinal chemistry, not clinical candidates.
