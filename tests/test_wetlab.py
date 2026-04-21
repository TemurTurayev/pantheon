"""Tests for the wet-lab submission client with biosecurity gate."""

from __future__ import annotations

from typing import Any

import pytest

from pantheon.tools import ToolRegistry
from pantheon.tools.stubs.biosec import biosec_stub
from pantheon.wetlab.adaptyv import AdaptyvClient, HttpTransport, JobStatus


class _Recorder(HttpTransport):
    def __init__(self, responses: list[dict[str, Any]]):
        self.responses = list(responses)
        self.calls: list[tuple[str, str, dict[str, Any]]] = []

    def request(self, method: str, url: str, json: dict[str, Any] | None) -> dict[str, Any]:
        self.calls.append((method, url, json or {}))
        return self.responses.pop(0)


def _sec_registry() -> ToolRegistry:
    reg = ToolRegistry()
    reg.register(biosec_stub())
    return reg


def test_submission_blocks_flagged_sequence():
    http = _Recorder(responses=[])
    client = AdaptyvClient(http=http, screen=_sec_registry())
    with pytest.raises(PermissionError):
        client.submit(
            sequences=[{"id": "bad", "sequence": "TOXTOXTOX"}],
            assay="binding_affinity",
            target_pdb="1STP",
        )
    assert http.calls == []  # nothing leaves the client


def test_submission_passes_clean_sequence():
    http = _Recorder(responses=[{"job_id": "ADP-1"}])
    client = AdaptyvClient(http=http, screen=_sec_registry())
    job_id = client.submit(
        sequences=[{"id": "safe", "sequence": "AAGVVKY"}],
        assay="binding_affinity",
        target_pdb="1STP",
    )
    assert job_id == "ADP-1"
    assert http.calls[0][0] == "POST"
    assert "/jobs" in http.calls[0][1]


def test_poll_returns_job_status():
    http = _Recorder(responses=[{"status": "running"}])
    client = AdaptyvClient(http=http, screen=_sec_registry())
    status = client.poll("ADP-1")
    assert isinstance(status, JobStatus)
    assert status.state == "running"


def test_ingest_results_converts_shape():
    http = _Recorder(
        responses=[
            {
                "results": [
                    {"id": "safe", "expressed": True, "kd_nm": 4.7},
                    {"id": "also_safe", "expressed": False, "kd_nm": None},
                ]
            }
        ]
    )
    client = AdaptyvClient(http=http, screen=_sec_registry())
    rows = client.ingest("ADP-1")
    assert len(rows) == 2
    assert rows[0].candidate_id == "safe"
    assert rows[0].expressed is True
    assert rows[0].kd_nm == 4.7
    assert rows[1].kd_nm is None
