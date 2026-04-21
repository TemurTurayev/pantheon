"""Uploader interface and a test-only stub.

Real uploaders (Zenodo, HuggingFace) will implement the same interface in
Phase 9+ when credentials are wired and the policy review is complete.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Protocol


@dataclass(frozen=True, slots=True)
class UploadResult:
    destination: str
    bundle: Path
    identifier: str


class Uploader(Protocol):
    def upload(self, *, bundle_dir: Path, destination: str) -> UploadResult: ...


@dataclass
class StubUploader:
    history: list[UploadResult] = field(default_factory=list)

    def upload(self, *, bundle_dir: Path, destination: str) -> UploadResult:
        identifier = f"stub://{destination}/{bundle_dir.name}"
        result = UploadResult(destination=destination, bundle=bundle_dir, identifier=identifier)
        self.history.append(result)
        return result
