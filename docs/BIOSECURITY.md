# Biosecurity Policy

PANTHEON produces sequences and small molecules that could, in principle, be synthesized. Any design-and-synthesize system is dual-use. This document is the policy that governs what the platform will and will not permit, and what controls are in place.

## Guiding principles

1. **Precaution over speed.** If a control is missing, wet-lab steps do not execute. Compute-only rounds are fine.
2. **Transparency.** Every gate decision is logged with a tamper-evident audit id.
3. **Defence in depth.** Target whitelist, sequence screen, synthesis partner screen, post-hoc audit. Failure of any single layer does not authorize synthesis.
4. **Alignment with established frameworks.** The platform conforms to the IGSC Harmonized Screening Protocol v2, complies with the Anthropic Responsible Scaling Policy thresholds where applicable, and incorporates recommendations from the Responsible Biodesign Workshop (NeurIPS 2024) and SecureBio 2025 guidance.

## What is in scope

- Protein design for binding or enzymatic function against whitelisted targets
- Small-molecule design against whitelisted targets
- Genome modification proposals at academic-pathway scale only (no whole-genome synthesis orders)

## What is out of scope

The following are **hard-blocked** and do not appear on any target whitelist:

- Pathogen enhancement (gain-of-function, transmissibility, virulence, host-range)
- Toxins, venoms, or their analogues
- Known or suspected biological / chemical / radiological / nuclear weapon precursors
- Targets listed under the Australia Group, HHS Select Agent List, Federal Select Agent Program
- Sequences with >40% identity to known toxins in the Uniprot Tox-Prot subset

This list is enforced at two points: target intake and pre-synthesis screen. A proposed target is rejected at intake if it matches the block list or if its intended use cannot be articulated as defensive / therapeutic.

## Layered controls

### Gate 1 — Target intake

Every new target (for a season, demo, or community submission) requires:

- Source literature citation
- Disease or application context
- Biosecurity review by a board of ≥2 reviewers (one external)
- Signed rationale stored with the target manifest

No compute round begins without a passed intake review.

### Gate 2 — Sequence & compound screen

Before any sequence or compound leaves PANTHEON (e.g. is sent to Adaptyv Bio, Twist Bioscience, IDT, etc.), it is screened:

- **DNA / RNA / peptide sequences**: screened against a curated set of pathogen, toxin, and controlled-sequence databases using the SecureBio AI screening pipeline (or equivalent IBBIS-compliant tool).
- **Small molecules**: matched against controlled substances lists and structural-alert filters.

A `flagged` decision blocks submission and opens an incident ticket.

### Gate 3 — Synthesis partner due diligence

Partners must be IGSC signatories (International Gene Synthesis Consortium) or equivalent. Adaptyv Bio is an IGSC signatory; that is the default wet-lab partner.

### Gate 4 — Post-hoc audit

All rounds, briefings, tool calls, and candidates are written to an append-only log with content hashes. A monthly audit reviews:

- Unusual target submissions
- Model behavior patterns (e.g. repeated near-misses on the block list)
- Any `flagged` screen results

Findings feed back into the block list and the guardian LLM prompt.

## Guardian LLM

A separate non-participant model reviews each candidate before it is stored for wet-lab submission. It looks for:

- Similarity to known hazardous sequences that the primary screen may have missed
- Anomalous patterns (e.g. a binder that is also a convincing toxin scaffold)
- Inconsistencies between the candidate and its stated rationale

The guardian model does not see player identities; it sees only the candidate and the target. Its decision is advisory but blocking when combined with any flag from Gate 2.

## Red-teaming

Before every season launches, the platform runs an adversarial round in which the guardian LLM is replaced with an inert stub and the target pool is augmented with obvious block-list items. If any candidate progresses past Gate 2 in that adversarial round, the release is held.

## Disclosure

- If a candidate turns out to be hazardous in retrospect, it is disclosed to relevant authorities (e.g. IBBIS, national biosecurity boards) before public release.
- All block-list additions are published.
- The audit log is open to auditors on request; player identities may be redacted per season policy.

## Review cadence

This policy is reviewed quarterly and whenever:

- A frontier model's biological capability materially advances
- A new wet-lab partner is added
- A flagged event occurs
- An external audit recommends changes

## References

- IGSC Harmonized Screening Protocol v2
- Anthropic RSP / ASL-3 deployment controls
- SecureBio 2025 annual review
- Responsible Biodesign Workshop proceedings
- Strengthening nucleic acid biosecurity screening against generative protein design tools (Science 2025)
