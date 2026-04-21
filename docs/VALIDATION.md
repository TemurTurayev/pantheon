# Wet-lab Validation

How the best in-silico candidates become real data.

## Why at all

In-silico scores correlate with real binding, but the correlation is imperfect. A platform that never touches physical reality trains models to game simulators. Wet-lab validation:

- Updates ELO with ground truth, not a proxy
- Produces sequence → assay training pairs that any future model can learn from
- Catches failure modes the simulator misses (misfolding, aggregation, expression problems)
- Creates scientifically citable output

## Primary partner

[**Adaptyv Bio**](https://www.adaptyvbio.com/) — cloud protein lab, sequence-to-data in roughly three weeks, IGSC-compliant, runs open competitions with published hit rates. Default partner for every wet-lab-eligible season.

Alternates for specialised assays:

- Emerald Cloud Lab — broader chemistry and biology menu
- Strateos — programmable compound handling
- Twist Bioscience — DNA synthesis at scale (upstream of binding assays)
- Academic collaborators — deep characterization (crystallography, cryo-EM, cell assays)

## Submission pipeline

```
Season finalists (top K candidates)
     │
     ▼
Gate 2: biosecurity sequence screen ─── flagged → block + audit
     │
     ▼ pass
Guardian LLM review ─────────────────── block-vote → hold
     │
     ▼ clear
Synthesis vendor selection (Adaptyv by default)
     │
     ▼
API submission  (sequence + assay spec)
     │
     ▼
Poll job status (expected 2–3 weeks)
     │
     ▼
Assay results → results.parquet + ELO retro-update
     │
     ▼
Results published to Zenodo / HuggingFace
```

Every step writes to the telemetry log with content hashes, including the exact sequence sent to the vendor and the vendor's returned data.

## Assay defaults

For binder design seasons:

- Expression (yes / no)
- Solubility
- Binding affinity (Kd) by BLI / SPR against the intended target
- Off-target panel (configurable per season)

For enzyme seasons:

- Expression, thermostability, turnover at defined substrate concentrations

Season manifest can extend or override this menu.

## Cost management

Wet-lab work is the dominant cost. Controls:

- Seasons declare a finalist cap up front (default K=20)
- A "soft season" mode runs compute-only and skips wet-lab entirely
- Partnership seasons (with pharma or academic sponsors) cover their own validation costs; PANTHEON provides the data

## Data flow

Adaptyv returns a standard results payload (CSV + raw instrument traces). The ingest step:

1. Validates the payload schema.
2. Matches each returned sequence to its origin candidate via content hash.
3. Writes `seasons/<id>/wet_lab.csv` with one row per candidate.
4. Retro-updates ELO — models whose candidates out-performed their in-silico rank gain; models whose candidates under-performed lose.

The retro-update is a separate scoring pass. ELO values before and after are both preserved for audit.

## Failure handling

- **Non-expressing candidates** — counted and scored; they still contribute to the "synthesizability" penalty for future rounds of the same model.
- **Ambiguous assay results** — flagged as `indeterminate`, not silently dropped; stored for reanalysis.
- **Vendor error** — resubmitted once automatically; repeated failure triggers a human ticket.

## Open-science by default

Every wet-lab result is published under CC0 (or the most permissive license the vendor allows), including negatives. Negative results are rare in published literature; PANTHEON makes them routine.
