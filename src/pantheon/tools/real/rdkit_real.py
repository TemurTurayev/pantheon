"""Real ``rdkit_analyze`` with graceful fallback.

When ``rdkit`` is installed, compute actual descriptors. When it is not,
delegate to the Phase-1 stub so the arena keeps working on dev machines
that don't have rdkit wheels available.
"""

from __future__ import annotations

from typing import Any

from pantheon.tools.base import ToolResult
from pantheon.tools.stubs.rdkit import rdkit_stub


def _has_rdkit() -> bool:
    try:
        import rdkit  # noqa: F401

        return True
    except Exception:
        return False


def _sa_score(mol) -> float:
    """Ertl synthetic-accessibility score (1=easy … 10=hard).

    Uses the ``sascorer`` contrib module + ``fpscores`` model bundled with the
    rdkit wheel. Returns 0.0 if the contrib files are unavailable so the tool
    never fails on a descriptor it can't compute.
    """
    try:
        import os
        import sys

        from rdkit.Chem import RDConfig

        sa_dir = os.path.join(RDConfig.RDContribDir, "SA_Score")
        if sa_dir not in sys.path:
            sys.path.append(sa_dir)
        import sascorer  # type: ignore  # noqa: E402

        return round(float(sascorer.calculateScore(mol)), 3)
    except Exception:
        return 0.0


class _RdkitReal:
    name = "rdkit_analyze"
    input_schema = {
        "type": "object",
        "properties": {"smiles": {"type": "string"}},
        "required": ["smiles"],
    }
    output_schema = {
        "type": "object",
        "properties": {
            "qed": {"type": "number"},
            "logp": {"type": "number"},
            "tpsa": {"type": "number"},
            "mw": {"type": "number"},
            "sa_score": {"type": "number"},
            "lipinski_violations": {"type": "integer"},
        },
    }

    def __call__(self, arguments: dict[str, Any]) -> ToolResult:
        smiles = str(arguments.get("smiles") or "")
        if not smiles.strip():
            raise ValueError("smiles must be non-empty")

        if _has_rdkit():
            return self._compute_real(smiles)
        return rdkit_stub()({"smiles": smiles})

    def _compute_real(self, smiles: str) -> ToolResult:
        from rdkit import Chem
        from rdkit.Chem import QED, Crippen, Descriptors, Lipinski, rdMolDescriptors

        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            raise ValueError(f"could not parse SMILES: {smiles!r}")

        logp = Crippen.MolLogP(mol)
        mw = Descriptors.MolWt(mol)
        hbd = Lipinski.NumHDonors(mol)
        hba = Lipinski.NumHAcceptors(mol)
        lipinski = sum([mw > 500, logp > 5, hbd > 5, hba > 10])

        out = {
            "qed": round(QED.qed(mol), 4),
            "logp": round(logp, 3),
            "tpsa": round(rdMolDescriptors.CalcTPSA(mol), 2),
            "mw": round(mw, 2),
            "sa_score": _sa_score(mol),  # real Ertl synthetic-accessibility (1=easy…10=hard)
            "lipinski_violations": int(lipinski),
        }
        return ToolResult(tool=self.name, output=out, cached=False)


def rdkit_real() -> _RdkitReal:
    return _RdkitReal()
