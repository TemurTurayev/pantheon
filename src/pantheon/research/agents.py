"""Research sub-agents.

Each agent produces one section of the brief. Phase-3 implementation:
literature agent calls the real / stub ``pubmed_search`` tool; the other
agents produce deterministic placeholder sections that a downstream
phase can upgrade to real LLM-driven analyses without breaking callers.
"""

from __future__ import annotations

from pantheon.research.brief import BriefSection
from pantheon.targets import Target
from pantheon.tools.registry import ToolRegistry


class _BaseAgent:
    name: str = ""
    heading: str = ""

    def __init__(self, registry: ToolRegistry) -> None:
        self._registry = registry

    def run(self, target: Target) -> BriefSection:  # pragma: no cover - abstract
        raise NotImplementedError


class LitSearchAgent(_BaseAgent):
    name = "lit_search"
    heading = "Literature review"

    def run(self, target: Target) -> BriefSection:
        try:
            result = self._registry.invoke(
                "pubmed_search",
                {"query": target.id, "max_results": 5},
            )
        except KeyError:
            return BriefSection(heading=self.heading, items=("(pubmed_search unavailable)",))
        items = tuple(
            f"{art['title']} ({art.get('year', 'n/a')}) — {art.get('pmid', '')}"
            for art in result.output.get("results", [])
        )
        return BriefSection(heading=self.heading, items=items)


class PriorArtAgent(_BaseAgent):
    name = "prior_art"
    heading = "Prior art"

    def run(self, target: Target) -> BriefSection:
        return BriefSection(
            heading=self.heading,
            items=(
                f"Search ChEMBL for known binders of {target.id}.",
                f"Check patent filings WO/US/EP for {target.pdb_id}.",
                "Summarise Kd / IC50 ranges observed in literature.",
            ),
        )


class MechanismAgent(_BaseAgent):
    name = "mechanism"
    heading = "Mechanism"

    def run(self, target: Target) -> BriefSection:
        return BriefSection(
            heading=self.heading,
            items=(
                f"Target {target.id} (PDB {target.pdb_id}, chain {target.chain}).",
                f"Disease context: {target.disease_context or 'n/a'}.",
                f"Known hotspot residues: {', '.join(str(h) for h in target.hotspots) or 'none recorded'}.",
            ),
        )


class ChemSpaceAgent(_BaseAgent):
    name = "chem_space"
    heading = "Chemical space"

    def run(self, target: Target) -> BriefSection:
        return BriefSection(
            heading=self.heading,
            items=(
                "Enumerate scaffolds used in prior binders; note any SAR trend.",
                "Flag any scaffolds with known ADMET liabilities (hERG, CYP3A4).",
            ),
        )


class FailureAgent(_BaseAgent):
    name = "failures"
    heading = "Failure modes"

    def run(self, target: Target) -> BriefSection:
        return BriefSection(
            heading=self.heading,
            items=(
                f"Review failed clinical candidates for {target.id}, if any.",
                "Identify recurring failure causes (pharmacokinetics, off-target, efficacy).",
            ),
        )


class SynthesisAgent(_BaseAgent):
    name = "synthesis"
    heading = "Synthesizability"

    def run(self, target: Target) -> BriefSection:
        return BriefSection(
            heading=self.heading,
            items=(
                "Estimate expression tractability (small peptide vs. full domain).",
                "Estimate vendor cost for wet-lab validation (Adaptyv Bio).",
            ),
        )
