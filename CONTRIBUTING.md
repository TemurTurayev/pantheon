# Contributing to PANTHEON

Short version: fork, branch, add tests, open a PR.

## Prerequisites

- Python 3.11+
- A terminal that can run `make` (optional — a few convenience shortcuts live in `scripts/`)
- For frontend work: Node 20+

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest                # must be green before you start
```

## Writing code

- Write tests first. `tests/` should stay runnable with zero external dependencies (no network, no GPU, no real CLI binaries).
- Follow the existing patterns: frozen dataclasses, small files, no hidden mutation.
- New tool goes through the `Tool` protocol and is registered in a `ToolRegistry`.
- New LLM backend is a 40-line adapter; no domain logic lives in adapters.
- If you change scoring, scoring weights, or a biosecurity gate, open an RFC issue first (see `docs/GOVERNANCE.md`).

## Running the demo round

```bash
python -m pantheon.arena.runner --target seasons/S0_streptavidin/config.yaml
```

## Running the frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server reads `public/round.json` by default. To stream live, point the `fetch` call in `src/App.tsx` at the SSE endpoint from `pantheon.stream.server`.

## Biosecurity

Any change that affects what the system will or won't synthesize requires review by the biosecurity board. Don't merge those changes until `docs/BIOSECURITY.md` is updated in the same PR.

## Submitting a new target

1. Open an issue using the `target-proposal` template (coming in Phase 9+).
2. Include: source literature, intended use, any known misuse concerns.
3. Wait for biosecurity board approval.
4. Open a PR with a new `seasons/<id>/config.yaml` referencing the approval.

## PR checklist

- [ ] `pytest` green
- [ ] Touched files have tests
- [ ] No new external runtime dependencies without a note in the PR
- [ ] Documentation updated if behavior or policy changed
- [ ] If the change touches biosecurity, a board member has reviewed

## Code style

- Python: `ruff` handles formatting and lints (`ruff check src tests`).
- Names: prefer clarity over brevity. `affinity_kcal_mol`, not `a`.
- Comments: document *why*, not *what*. No multi-paragraph docstrings.
