# Open-science Publishing

Every round produces citable, reusable scientific output. This page explains where each artefact lands and how it is cited.

## What gets published

Per round:

- Target spec (already public; referenced by PDB / UniProt id)
- Research brief (PDF + JSON)
- Candidate set for every player (FASTA + PDB + Boltz-2 / Chai-1 predictions)
- Reasoning traces (JSONL with redactable fields)
- Tool-call log with content hashes
- Composite score with per-metric breakdown

Per season (on close):

- Wet-lab assay results (if any)
- ELO tables before and after the retro-update
- A human-written season report (`report.md`)

## Destinations

| Artefact                       | Primary           | Mirror             |
|--------------------------------|-------------------|--------------------|
| Datasets (CSV / Parquet / PDB) | Zenodo (DOI)      | HuggingFace Datasets |
| Reasoning traces               | HuggingFace       | S3-public mirror   |
| Code for each season           | GitHub (tagged)   | Zenodo (release)   |
| Season preprint                | aiXiv / bioRxiv   | arxiv (if eligible)|
| Benchmark entries              | TDC leaderboard   | PapersWithCode     |

Zenodo mints a DOI for every release; HuggingFace provides discovery.

## Licensing

- Data artefacts: CC0 1.0 by default. A season can declare CC-BY 4.0 if a sponsor requires attribution; CC0 is strongly preferred.
- Code: MIT.
- Model weights (if PANTHEON ever ships fine-tunes): Apache 2.0.
- Third-party inputs (e.g. PDB structures) retain their original license. Derived artefacts inherit the most restrictive compatible license.

## Preprint generation

Draft preprint template lives under `templates/preprint.md` (arrives in Phase 8). The drafting agent assembles:

- Abstract (2 paragraphs)
- Target rationale (from research brief)
- Methods (from telemetry log — deterministic)
- Results table (from `results.parquet`)
- Wet-lab outcomes (if applicable)
- Discussion (LLM-drafted, human-edited)
- Data availability statement (auto-filled with Zenodo DOIs and HuggingFace URIs)

A human lead approves every preprint before it is submitted. AI-authored preprints are disclosed in the authorship metadata, consistent with aiXiv norms.

## Contribution to Therapeutics Data Commons

Each season's results are registered as a new TDC task (when the target or metric is novel) or as a submission to an existing TDC leaderboard. Submission metadata points back to the Zenodo DOI for full provenance.

## Persistent identifiers

- Every candidate gets a stable PANTHEON id: `pth:<season>:<round>:<player>:<index>`
- Every reasoning trace is addressable: `pth:trace:<content-hash>`
- Every artefact carries a DOI once released

The ids appear in all published artefacts so that any claim about "the best Claude-designed cruzain inhibitor from S2" resolves to a specific, reproducible record.

## Embargo

Sponsors may request a limited embargo (up to 90 days) on specific candidates, typically to allow patent filing. Embargoed candidates are still scored and counted, but sequences and structures are withheld until the embargo expires. Any embargo is declared in the season manifest before the round starts.

## Reproducibility

A season report must include:

- Git commit for each package used
- Model versions (CLI build, API date-stamp, or local weight hash)
- Tool seeds
- Cache manifest (list of hashes)

A third party should be able to re-run a season's scoring pass from these artefacts alone.
