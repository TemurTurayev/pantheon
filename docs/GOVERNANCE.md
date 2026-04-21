# Governance

Who decides what, by what mechanism, with what appeal.

## Roles

- **Maintainers** — commit access, triage PRs, cut releases. Minimum two people; a single maintainer cannot merge their own PR on the main branch.
- **Biosecurity board** — at least two reviewers (one external to the project) with biological or biosecurity expertise. Mandatory sign-off on every target intake. May veto a release.
- **Season leads** — one per season, coordinates the scientific design, writes the season report. Rotates.
- **Ops** — on-call for cloud-lab submissions and external API failures.
- **Contributors** — anyone submitting a PR or issue.

Roles are durable assignments documented in `docs/PEOPLE.md` (created when real assignees exist). Until then, the README makes the project's pre-release status explicit.

## Decision channels

| Decision                                     | Who decides                     | Escalation      |
|----------------------------------------------|---------------------------------|-----------------|
| Merging a code PR                            | Any two maintainers             | Full maintainer vote |
| Approving a new target                       | Biosecurity board (≥2 reviewers)| Veto stands    |
| Opening a new season                         | Season lead + maintainers        | —               |
| Changing scoring weights mid-season          | Not permitted                   | N/A             |
| Changing scoring weights between seasons     | Maintainers + season lead       | Public RFC      |
| Adding a new wet-lab partner                 | Maintainers + biosec board      | Veto stands     |
| Updating the biosecurity policy              | Biosecurity board               | Public comment  |
| Emergency pull (e.g. hazardous candidate)    | Any maintainer + biosec board   | Post-hoc review |
| AI-authored preprint submission              | Season lead + maintainers       | Human on record |

## RFC process

Non-emergency changes to policy, scoring, or process go through a lightweight RFC:

1. Author opens an issue tagged `rfc:` with motivation, proposal, alternatives, drawbacks.
2. Public comment window — minimum 7 days for policy; 48 hours for mechanics.
3. Maintainers record the outcome in the issue.
4. If accepted, the change is implemented in a PR that links back to the RFC.

## Code of conduct

Contributors agree to the Contributor Covenant 2.1. Violations are handled by the maintainers privately, with appeal to the biosecurity board.

## Funding & sponsorship

The platform may accept sponsored seasons (pharma, academic labs, foundations) provided:

- Sponsor cannot select a target that fails the biosecurity gate.
- Sponsor cannot dictate scoring weights mid-season.
- Any embargo is declared in the season manifest before the season starts, max 90 days.
- Sponsor agrees to CC0 / permissive release of the platform's output (their proprietary contributions may remain theirs).

## Conflict of interest

Contributors and reviewers disclose:

- Financial ties to a player LLM's vendor.
- Financial ties to a wet-lab partner.
- Commercial ties to a target's therapeutic indication.

Disclosures are public; they do not disqualify participation but do inform role assignment (e.g. a reviewer with a material tie to a player cannot adjudicate that player's disputes).

## Changes to this document

Governance itself evolves through the RFC process above. The currently effective version is whatever is on the main branch; past versions are recoverable from Git.
