"""Adaptyv Bio submission client.

The client has three responsibilities:

1. Run a biosecurity screen (via the tool registry) on every sequence
   *before* it leaves the process. A flagged sequence aborts submission
   with ``PermissionError``. This gate is not optional.
2. Submit approved sequences to Adaptyv's ``/jobs`` endpoint.
3. Poll job status and ingest assay results into typed ``AssayRow`` rows.

HTTP transport is injected so tests never hit the network.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol

from pantheon.tools.registry import ToolRegistry


class HttpTransport(Protocol):
    def request(self, method: str, url: str, json: dict[str, Any] | None) -> dict[str, Any]: ...


@dataclass(frozen=True, slots=True)
class JobStatus:
    state: str
    raw: dict[str, Any]


@dataclass(frozen=True, slots=True)
class AssayRow:
    candidate_id: str
    expressed: bool
    kd_nm: float | None
    raw: dict[str, Any]


_BASE = "https://api.adaptyvbio.com/v1"


class AdaptyvClient:
    def __init__(self, *, http: HttpTransport, screen: ToolRegistry) -> None:
        self._http = http
        self._screen = screen

    def submit(
        self,
        *,
        sequences: list[dict[str, str]],
        assay: str,
        target_pdb: str,
    ) -> str:
        for entry in sequences:
            decision = self._screen.invoke(
                "biosecurity_screen",
                {"sequence_or_smiles": entry["sequence"], "synthesis_target": "protein"},
            )
            if decision.output["decision"] != "pass":
                raise PermissionError(
                    f"biosecurity screen flagged sequence '{entry['id']}': "
                    f"{decision.output['risk_reasons']}"
                )
        body = {"sequences": sequences, "assay": assay, "target_pdb": target_pdb}
        reply = self._http.request("POST", f"{_BASE}/jobs", body)
        return str(reply["job_id"])

    def poll(self, job_id: str) -> JobStatus:
        reply = self._http.request("GET", f"{_BASE}/jobs/{job_id}", None)
        return JobStatus(state=str(reply.get("status", "unknown")), raw=reply)

    def ingest(self, job_id: str) -> list[AssayRow]:
        reply = self._http.request("GET", f"{_BASE}/jobs/{job_id}/results", None)
        rows: list[AssayRow] = []
        for item in reply.get("results", []):
            rows.append(
                AssayRow(
                    candidate_id=str(item["id"]),
                    expressed=bool(item.get("expressed", False)),
                    kd_nm=None if item.get("kd_nm") is None else float(item["kd_nm"]),
                    raw=item,
                )
            )
        return rows
