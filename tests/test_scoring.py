"""Tests for composite scoring and ELO."""

from __future__ import annotations

import pytest

from pantheon.scoring.candidate import Candidate, Metrics
from pantheon.scoring.compose import DEFAULT_WEIGHTS, compose_score
from pantheon.scoring.elo import Glicko2, Rating


def test_compose_higher_is_better():
    weak = Metrics(delta_g=-5.0, iptm=0.4, md_stability_rmsd=2.0, novelty=0.1, synthesizability=0.3, biosec_penalty=0.0)
    strong = Metrics(delta_g=-11.0, iptm=0.85, md_stability_rmsd=0.6, novelty=0.8, synthesizability=0.9, biosec_penalty=0.0)
    s1 = compose_score(weak, DEFAULT_WEIGHTS)
    s2 = compose_score(strong, DEFAULT_WEIGHTS)
    assert s2 > s1


def test_compose_penalty_reduces_score():
    m = Metrics(delta_g=-10.0, iptm=0.8, md_stability_rmsd=0.7, novelty=0.9, synthesizability=0.8, biosec_penalty=0.0)
    clean = compose_score(m, DEFAULT_WEIGHTS)
    flagged = Metrics(
        delta_g=m.delta_g,
        iptm=m.iptm,
        md_stability_rmsd=m.md_stability_rmsd,
        novelty=m.novelty,
        synthesizability=m.synthesizability,
        biosec_penalty=1.0,
    )
    penalised = compose_score(flagged, DEFAULT_WEIGHTS)
    assert penalised < clean


def test_candidate_is_frozen():
    c = Candidate(
        id="pth:S0:r1:mock:1",
        player="mock",
        sequence="AAA",
        metrics=Metrics(-5.0, 0.5, 1.0, 0.2, 0.4, 0.0),
    )
    with pytest.raises((AttributeError, TypeError)):
        c.player = "other"  # type: ignore[misc]


def test_glicko2_stronger_player_wins_more_often():
    glicko = Glicko2()
    strong = Rating(mu=1700, phi=200, sigma=0.06)
    weak = Rating(mu=1400, phi=200, sigma=0.06)
    updated_strong = glicko.update(strong, [(weak, 1.0)])
    updated_weak = glicko.update(weak, [(strong, 0.0)])
    assert updated_strong.mu > strong.mu
    assert updated_weak.mu < weak.mu


def test_glicko2_tie_draws_ratings_together():
    glicko = Glicko2()
    a = Rating(mu=1600, phi=200, sigma=0.06)
    b = Rating(mu=1400, phi=200, sigma=0.06)
    new_a = glicko.update(a, [(b, 0.5)])
    new_b = glicko.update(b, [(a, 0.5)])
    # A was over-rated relative to the draw, so it should go down; B up.
    assert new_a.mu < a.mu
    assert new_b.mu > b.mu


def test_glicko2_default_rating():
    glicko = Glicko2()
    r = glicko.default()
    assert r.mu == 1500
    assert r.phi == 350
