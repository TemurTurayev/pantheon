"""Composite score.

Weights are configurable per season (passed in as ``Weights``). The
default set reproduces the formula documented in ``docs/ARCHITECTURE.md``.

Higher composite score is better.
"""

from __future__ import annotations

from dataclasses import dataclass

from pantheon.scoring.candidate import Metrics


@dataclass(frozen=True, slots=True)
class Weights:
    delta_g: float = 0.40
    iptm: float = 0.20
    md_stability: float = 0.15
    novelty: float = 0.15
    synthesizability: float = 0.10
    biosec_penalty: float = 1.0


DEFAULT_WEIGHTS = Weights()


def _stability_from_rmsd(rmsd: float) -> float:
    """Lower RMSD => higher stability; clamp to [0, 1]."""
    if rmsd <= 0:
        return 1.0
    return max(0.0, min(1.0, 1.0 / (1.0 + rmsd)))


def compose_score(metrics: Metrics, weights: Weights) -> float:
    stability = _stability_from_rmsd(metrics.md_stability_rmsd)
    return (
        weights.delta_g * (-metrics.delta_g)
        + weights.iptm * metrics.iptm
        + weights.md_stability * stability
        + weights.novelty * metrics.novelty
        + weights.synthesizability * metrics.synthesizability
        - weights.biosec_penalty * metrics.biosec_penalty
    )
