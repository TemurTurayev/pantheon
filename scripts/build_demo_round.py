"""Generate a richer ``frontend/public/round.json`` demo payload.

Produces per-player reasoning streams, candidates with rationales, one
candidate with a synthetic 50-frame stress-test trajectory, and hotspot
annotations for the target.

Run::

    python scripts/build_demo_round.py
"""

from __future__ import annotations

import json
import math
import random
from pathlib import Path


RNG = random.Random(1234)


def score_history(base: float, n: int = 12) -> list[float]:
    values = []
    cur = base * 0.3
    for i in range(n):
        cur += RNG.uniform(-0.15, 0.55)
        cur = max(0.0, cur)
        values.append(round(cur, 3))
    values[-1] = round(max(values[-1], base), 3)
    return values


def reasoning_stream(player: str, color_cue: str) -> list[dict]:
    # Hand-written mini-trace that looks believable.
    if player == "claude-opus-4-7":
        return [
            {"t_ms": 90, "kind": "thought", "summary": "Start: biotin-binding pocket is the obvious target site.",
             "body": "Streptavidin forms the canonical femtomolar complex with biotin. For a peptide binder I\u2019ll aim for the same pocket but avoid the exact biotin carboxylate pose \u2014 that\u2019s patented territory."},
            {"t_ms": 1800, "kind": "tool_call", "summary": "pubmed_search  query='streptavidin peptide binder'", "tool": "pubmed_search"},
            {"t_ms": 2400, "kind": "tool_result", "summary": "5 hits; 2 recent (2025) on mini-binders.", "body": "[\n  {pmid: PMID6B67...., title: 'De novo mini-binders for streptavidin', year: 2025},\n  ...\n]"},
            {"t_ms": 3600, "kind": "thought", "summary": "Planning hotspot-centred RFdiffusion run around Trp45 + Asn88."},
            {"t_ms": 3900, "kind": "tool_call", "summary": "rfdiffusion  hotspots=[A45, A88]  length=30-50  n=8", "tool": "rfdiffusion"},
            {"t_ms": 16400, "kind": "tool_result", "summary": "8 backbones returned. Picking top-3 by compactness."},
            {"t_ms": 17900, "kind": "tool_call", "summary": "proteinmpnn  num_sequences=6 per backbone", "tool": "proteinmpnn"},
            {"t_ms": 22100, "kind": "tool_result", "summary": "18 candidate sequences."},
            {"t_ms": 22500, "kind": "thought", "summary": "Scoring every candidate with Boltz-2, then narrowing to top-3."},
            {"t_ms": 23800, "kind": "tool_call", "summary": "boltz2  target=1STP  candidate=YAGVVKYTAA\u2026", "tool": "boltz2"},
            {"t_ms": 41200, "kind": "tool_result", "summary": "\u0394G = -9.3 kcal/mol, ipTM 0.78 \u2014 new personal best."},
            {"t_ms": 45100, "kind": "thought", "summary": "Refining around the best hit: swap Val3\u2192Leu for tighter hydrophobic pack."},
            {"t_ms": 45900, "kind": "tool_call", "summary": "boltz2  refined candidate", "tool": "boltz2"},
            {"t_ms": 62400, "kind": "tool_result", "summary": "\u0394G = -10.1 kcal/mol \u2014 refinement worked."},
            {"t_ms": 62800, "kind": "event", "summary": "Submitting top-3 candidates."},
        ]
    if player == "gpt-5-4":
        return [
            {"t_ms": 110, "kind": "thought", "summary": "Go hydrophobic-clamp first; sequence search \u2192 graft onto an alpha-hairpin."},
            {"t_ms": 1900, "kind": "tool_call", "summary": "pubmed_search  query='biotin binding pocket geometry'", "tool": "pubmed_search"},
            {"t_ms": 2500, "kind": "tool_result", "summary": "4 hits; one cites a 2024 structural alignment dataset."},
            {"t_ms": 3700, "kind": "tool_call", "summary": "rfdiffusion  length=25-40  n=12", "tool": "rfdiffusion"},
            {"t_ms": 15900, "kind": "tool_result", "summary": "12 backbones; filtered to 5 by hairpin detection."},
            {"t_ms": 16400, "kind": "tool_call", "summary": "proteinmpnn  n=8 per backbone  T=0.2", "tool": "proteinmpnn"},
            {"t_ms": 20800, "kind": "tool_result", "summary": "40 sequences."},
            {"t_ms": 21200, "kind": "tool_call", "summary": "boltz2  screening 10 best", "tool": "boltz2"},
            {"t_ms": 46300, "kind": "tool_result", "summary": "Best \u0394G = -10.7 kcal/mol, ipTM 0.81 \u2014 round leader."},
            {"t_ms": 46800, "kind": "thought", "summary": "Holding position, running MD stress-test on top candidate."},
            {"t_ms": 47200, "kind": "tool_call", "summary": "openmm_md  T=400K  5ns", "tool": "openmm_md"},
            {"t_ms": 78400, "kind": "tool_result", "summary": "RMSD stays < 2.1\u00c5, Q(t) = 0.82 \u2014 stable at 400K. PASS."},
            {"t_ms": 78900, "kind": "event", "summary": "Submitting top candidate HLFWPMEGT\u2026"},
        ]
    if player == "gemini-3-pro":
        return [
            {"t_ms": 100, "kind": "thought", "summary": "Trying a symmetric-helix motif; should present two anchor residues toward the pocket."},
            {"t_ms": 1700, "kind": "tool_call", "summary": "pubmed_search  query='streptavidin symmetric peptide'", "tool": "pubmed_search"},
            {"t_ms": 2300, "kind": "tool_result", "summary": "3 hits, one on cyclic-peptide symmetry."},
            {"t_ms": 3200, "kind": "tool_call", "summary": "rfdiffusion  symmetry=C2  length=30  n=4", "tool": "rfdiffusion"},
            {"t_ms": 11800, "kind": "tool_result", "summary": "4 symmetric backbones."},
            {"t_ms": 12300, "kind": "tool_call", "summary": "chai1  scoring all 4", "tool": "chai1"},
            {"t_ms": 23700, "kind": "tool_result", "summary": "Best \u0394G \u2248 -6.8 kcal/mol \u2014 weaker than leaders."},
            {"t_ms": 24000, "kind": "thought", "summary": "Symmetry is forcing too much loop \u2014 giving up on C2, trying single-helix variant."},
            {"t_ms": 24500, "kind": "tool_call", "summary": "rfdiffusion  length=35  n=6", "tool": "rfdiffusion"},
            {"t_ms": 33100, "kind": "tool_result", "summary": "6 new backbones, better shape complementarity."},
            {"t_ms": 33600, "kind": "tool_call", "summary": "proteinmpnn  n=4 each", "tool": "proteinmpnn"},
            {"t_ms": 37200, "kind": "tool_result", "summary": "24 sequences."},
            {"t_ms": 37800, "kind": "tool_call", "summary": "boltz2  screening", "tool": "boltz2"},
            {"t_ms": 58900, "kind": "tool_result", "summary": "Best \u0394G = -8.9 kcal/mol \u2014 catching up, still behind GPT."},
            {"t_ms": 59400, "kind": "event", "summary": "Submitting best 2 candidates."},
        ]
    # default
    return []


def synthesise_stress_test() -> dict:
    """Build a 50-frame trajectory: mostly stable, small fluctuation, modest drift.

    Simulates a 'pass' stress test at T=400K for a well-designed binder.
    """
    n = 50
    frames = []
    rmsd = 0.4
    rg = 11.8
    q = 0.98
    hb = 28
    events = []

    for i in range(n):
        t_ns = round(i * 0.1, 2)
        rmsd += RNG.uniform(-0.05, 0.07)
        rmsd = max(0.3, min(2.4, rmsd))
        rg += RNG.uniform(-0.03, 0.04)
        rg = max(11.2, min(12.7, rg))
        q -= RNG.uniform(-0.002, 0.008)
        q = max(0.78, min(1.0, q))
        hb += RNG.choice([-1, 0, 0, 0, 1])
        hb = max(22, min(32, hb))
        frames.append({
            "t_ns": t_ns,
            "rmsd": round(rmsd, 3),
            "rg": round(rg, 3),
            "q_native": round(q, 3),
            "h_bonds": hb,
        })

    # Seed some narrative events
    events.extend([
        {"t_ns": 0.0, "text": "MD started at T=400K, solvent: TIP3P, 5 ns", "severity": "info"},
        {"t_ns": 1.2, "text": "Helix α1 temporarily flickers, recovers", "severity": "info"},
        {"t_ns": 2.4, "text": "H-bond network stable at 26 ± 2", "severity": "good"},
        {"t_ns": 3.8, "text": "Peripheral loop exploring alternative conformation", "severity": "info"},
        {"t_ns": 4.9, "text": "Q(t) > 0.80 held throughout — PASS", "severity": "good"},
    ])

    rmsf = [round(0.3 + 0.9 * math.sin(i / 8.0) + RNG.uniform(0, 0.3), 3) for i in range(40)]

    return {
        "condition": "T=400K · 5 ns · explicit solvent",
        "verdict": "pass",
        "frames": frames,
        "events": events,
        "rmsf_per_residue": rmsf,
    }


def build() -> dict:
    players = [
        {"name": "claude-opus-4-7", "color": "#d97757"},
        {"name": "gpt-5-4", "color": "#64e1a8"},
        {"name": "gemini-3-pro", "color": "#5ea8ff"},
    ]

    player_states = {
        "claude-opus-4-7": {
            "color": "#d97757",
            "status": "done",
            "current_action": "Final submission locked in — awaiting scoring.",
            "step": 16, "step_total": 16, "elapsed_ms": 63_000,
            "score_history": score_history(4.2),
        },
        "gpt-5-4": {
            "color": "#64e1a8",
            "status": "tool",
            "current_tool": "openmm_md",
            "current_action": "Running MD stress-test at T=400K on top candidate.",
            "step": 13, "step_total": 14, "elapsed_ms": 78_400,
            "score_history": score_history(4.6),
        },
        "gemini-3-pro": {
            "color": "#5ea8ff",
            "status": "thinking",
            "current_action": "Re-scoring two late candidates against ipTM threshold.",
            "step": 14, "step_total": 15, "elapsed_ms": 59_400,
            "score_history": score_history(3.1),
        },
    }

    candidates = [
        {
            "id": "pth:S0:r1:claude-opus-4-7:1",
            "player": "claude-opus-4-7",
            "sequence": "AAGVVKYAAGTPWDNSI",
            "delta_g": -7.2, "iptm": 0.72, "score": 3.10,
            "rationale": "Hotspot-centred design around Trp45 + Asn88. Short loop + helix. Good starting point but pocket fit is shallow.",
            "hotspot_residues": [45, 88],
        },
        {
            "id": "pth:S0:r1:claude-opus-4-7:2",
            "player": "claude-opus-4-7",
            "sequence": "YAGVVKYTAAGTPWDNSI",
            "delta_g": -9.3, "iptm": 0.78, "score": 4.20,
            "rationale": "Y-substitution deepens hydrophobic contact with the biotin pocket. ipTM jumps to 0.78 and ΔG improves by ~2 kcal/mol.",
            "hotspot_residues": [45, 88],
        },
        {
            "id": "pth:S0:r1:claude-opus-4-7:3",
            "player": "claude-opus-4-7",
            "sequence": "YAGLLKYTAAGTPWDNSI",
            "delta_g": -10.1, "iptm": 0.81, "score": 4.55,
            "rationale": "V3→L swap tightens the hydrophobic pack one more turn. Final candidate — the one being submitted.",
            "hotspot_residues": [45, 88],
        },
        {
            "id": "pth:S0:r1:gpt-5-4:1",
            "player": "gpt-5-4",
            "sequence": "HLFWPMADTKRSVVP",
            "delta_g": -8.1, "iptm": 0.68, "score": 3.40,
            "rationale": "Alpha-hairpin with a Trp-Phe clamp at the pocket rim. Good fit, somewhat flexible terminus.",
            "hotspot_residues": [45],
        },
        {
            "id": "pth:S0:r1:gpt-5-4:2",
            "player": "gpt-5-4",
            "sequence": "HLFWPMEGTKRSVVP",
            "delta_g": -10.7, "iptm": 0.81, "score": 4.60,
            "rationale": "E→E/G substitution stabilises the hairpin turn. ΔG = -10.7, ipTM = 0.81 — round-best at submission time.",
            "hotspot_residues": [45, 88],
            "stress_test": synthesise_stress_test(),
        },
        {
            "id": "pth:S0:r1:gemini-3-pro:1",
            "player": "gemini-3-pro",
            "sequence": "KKEAAYNIIDGTWPLC",
            "delta_g": -6.8, "iptm": 0.61, "score": 2.80,
            "rationale": "Symmetric-helix attempt (C2). Symmetry constraint gave weaker pocket fit than expected.",
            "hotspot_residues": [88],
        },
        {
            "id": "pth:S0:r1:gemini-3-pro:2",
            "player": "gemini-3-pro",
            "sequence": "KKEAYNIIDGTWPLCVV",
            "delta_g": -8.9, "iptm": 0.73, "score": 3.55,
            "rationale": "Dropped symmetry, single-helix variant with better shape complementarity. Still behind the leaders but valid.",
            "hotspot_residues": [88],
        },
    ]

    hotspots = [
        {"residue": 45, "label": "Trp45", "role": "hotspot",
         "explainer": "A deep aromatic residue that sits at the mouth of the biotin pocket. Binders that put a hydrophobic ring here (W, F, Y) usually gain 1-2 kcal/mol of affinity."},
        {"residue": 88, "label": "Asn88", "role": "hotspot",
         "explainer": "Hydrogen-bond anchor on the back wall of the pocket. A binder that can donate a polar group to this residue tends to be much more selective."},
        {"residue": 23, "label": "Ser23", "role": "binding",
         "explainer": "Surface serine contributing to the rim of the pocket. Not a strong anchor on its own but helps orient the incoming peptide."},
        {"residue": 79, "label": "Thr79", "role": "pocket",
         "explainer": "Defines the pocket floor. Binders that clash here lose scores quickly; the AIs learn to avoid it within the first few rounds."},
    ]

    tool_calls = []
    for p in ("claude-opus-4-7", "gpt-5-4", "gemini-3-pro"):
        for entry in reasoning_stream(p, ""):
            if entry["kind"] == "tool_call":
                tool_calls.append({
                    "tool": entry.get("tool", ""),
                    "player": p,
                    "turn": 0,
                    "output": {},
                    "t_ms": entry["t_ms"],
                    "status": "ok",
                })

    events = [
        {"t_ms": 5_000, "text": "All three players begin reasoning phase"},
        {"t_ms": 41_200, "text": "claude-opus-4-7 hits ΔG = -9.3 (personal best)", "severity": "milestone"},
        {"t_ms": 46_300, "text": "gpt-5-4 hits ΔG = -10.7 (round best)", "severity": "milestone"},
        {"t_ms": 62_400, "text": "claude-opus-4-7 refines to ΔG = -10.1", "severity": "milestone"},
        {"t_ms": 78_400, "text": "gpt-5-4 stress-test at 400K PASSED — Q(t) = 0.82", "severity": "milestone"},
        {"t_ms": 79_000, "text": "Round complete — top candidate: pth:S0:r1:gpt-5-4:2"},
    ]

    payload = {
        "round_id": "S0_demo_r1",
        "target_id": "streptavidin",
        "target_pdb": "1STP",
        "target_stakes": "Calibration round — design a peptide that fits the biotin pocket of streptavidin. Easy target, known answer, used to verify the arena is working end-to-end.",
        "players": [{**p, **player_states[p["name"]], "name": p["name"]} for p in players],
        "reasoning_by_player": {p["name"]: reasoning_stream(p["name"], "") for p in players},
        "tool_calls": tool_calls,
        "candidates": candidates,
        "hotspots": hotspots,
        "events": events,
    }
    return payload


def main() -> None:
    payload = build()
    out = Path(__file__).parent.parent / "frontend" / "public" / "round.json"
    out.write_text(json.dumps(payload, indent=2))
    print(f"wrote {out} ({out.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
