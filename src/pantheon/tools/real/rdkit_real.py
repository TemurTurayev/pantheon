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
        from rdkit.Chem import Crippen, Descriptors, QED, Lipinski, rdMolDescriptors

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
            "sa_score": 0.0,  # placeholder — Ertl SA requires an extra model file
            "lipinski_violations": int(lipinski),
        }
        return ToolResult(tool=self.name, output=out, cached=False)


def rdkit_real() -> _RdkitReal:
    return _RdkitReal()
