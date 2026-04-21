"""Candidate and metrics types."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Metrics:
    delta_g: float
    iptm: float
    md_stability_rmsd: float
    novelty: float
    synthesizability: float
    biosec_penalty: float = 0.0


@dataclass(frozen=True, slots=True)
class Candidate:
    id: str
    player: str
    sequence: str
    metrics: Metrics
    rationale: str = ""
