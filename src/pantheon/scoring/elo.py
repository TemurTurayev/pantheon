"""Glicko-2 rating system.

Reference: Glickman, 2012 — "Example of the Glicko-2 system".
We use the standard formulas with the conventional constants.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

_GLICKO2_SCALE = 173.7178


@dataclass(frozen=True, slots=True)
class Rating:
    mu: float
    phi: float
    sigma: float


def _to_glicko2(r: Rating) -> tuple[float, float]:
    return (r.mu - 1500.0) / _GLICKO2_SCALE, r.phi / _GLICKO2_SCALE


def _to_glicko(mu: float, phi: float, sigma: float) -> Rating:
    return Rating(mu=mu * _GLICKO2_SCALE + 1500.0, phi=phi * _GLICKO2_SCALE, sigma=sigma)


def _g(phi: float) -> float:
    return 1.0 / math.sqrt(1.0 + 3.0 * phi * phi / (math.pi * math.pi))


def _expected(mu: float, mu_j: float, phi_j: float) -> float:
    return 1.0 / (1.0 + math.exp(-_g(phi_j) * (mu - mu_j)))


class Glicko2:
    """Pure-Python Glicko-2 with sensible defaults."""

    def __init__(self, tau: float = 0.5) -> None:
        self._tau = tau

    @staticmethod
    def default() -> Rating:
        return Rating(mu=1500.0, phi=350.0, sigma=0.06)

    def update(self, player: Rating, results: list[tuple[Rating, float]]) -> Rating:
        """Update one player's rating given a list of (opponent, score) pairs.

        Score is 1.0 for a win, 0.5 for draw, 0.0 for loss.
        """
        if not results:
            return self._inactivity_update(player)

        mu, phi = _to_glicko2(player)
        opps = [_to_glicko2(opp) for opp, _ in results]
        outcomes = [s for _, s in results]

        v_inv = sum(
            (_g(phi_j) ** 2) * _expected(mu, mu_j, phi_j) * (1 - _expected(mu, mu_j, phi_j))
            for (mu_j, phi_j) in opps
        )
        v = 1.0 / v_inv
        delta = v * sum(
            _g(phi_j) * (outcomes[i] - _expected(mu, mu_j, phi_j))
            for i, (mu_j, phi_j) in enumerate(opps)
        )
        sigma_new = self._update_sigma(player.sigma, delta, phi, v)
        phi_star = math.sqrt(phi * phi + sigma_new * sigma_new)
        phi_new = 1.0 / math.sqrt(1.0 / (phi_star * phi_star) + 1.0 / v)
        mu_new = mu + (phi_new * phi_new) * sum(
            _g(phi_j) * (outcomes[i] - _expected(mu, mu_j, phi_j))
            for i, (mu_j, phi_j) in enumerate(opps)
        )
        return _to_glicko(mu_new, phi_new, sigma_new)

    def _inactivity_update(self, player: Rating) -> Rating:
        _, phi = _to_glicko2(player)
        phi_new = math.sqrt(phi * phi + player.sigma * player.sigma)
        return _to_glicko((player.mu - 1500.0) / _GLICKO2_SCALE, phi_new, player.sigma)

    def _update_sigma(self, sigma: float, delta: float, phi: float, v: float) -> float:
        # Illinois algorithm, per Glickman 2012.
        a = math.log(sigma * sigma)
        eps = 1e-6

        def f(x: float) -> float:
            ex = math.exp(x)
            num = ex * (delta * delta - phi * phi - v - ex)
            den = 2.0 * (phi * phi + v + ex) ** 2
            return num / den - (x - a) / (self._tau * self._tau)

        big = delta * delta - phi * phi - v
        A = a
        if big > 0:
            B = math.log(big)
        else:
            k = 1
            while f(a - k * self._tau) < 0:
                k += 1
            B = a - k * self._tau

        fa, fb = f(A), f(B)
        while abs(B - A) > eps:
            C = A + (A - B) * fa / (fb - fa)
            fc = f(C)
            if fc * fb <= 0:
                A, fa = B, fb
            else:
                fa = fa / 2.0
            B, fb = C, fc
        return math.exp(A / 2.0)
