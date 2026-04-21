"""Deterministic fake for ``pubmed_search``.

Given an input query we produce a reproducible set of fake article records
derived from a stable hash of the query. Good enough for end-to-end arena
tests that require realistic-looking research-brief material.
"""

from __future__ import annotations

import hashlib
from typing import Any

from pantheon.tools.base import ToolResult


_INPUT = {
    "type": "object",
    "properties": {
        "query": {"type": "string"},
        "years": {"type": "array", "items": {"type": "integer"}},
        "max_results": {"type": "integer"},
    },
    "required": ["query", "max_results"],
}

_OUTPUT = {
    "type": "object",
    "properties": {
        "results": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "pmid": {"type": "string"},
                    "title": {"type": "string"},
                    "abstract": {"type": "string"},
                    "year": {"type": "integer"},
                    "doi": {"type": "string"},
                },
            },
        }
    },
}


def _digest(query: str, idx: int) -> str:
    return hashlib.sha256(f"{query}|{idx}".encode()).hexdigest()


class _PubmedStub:
    name = "pubmed_search"
    input_schema = _INPUT
    output_schema = _OUTPUT

    def __call__(self, arguments: dict[str, Any]) -> ToolResult:
        query = str(arguments["query"])
        n = int(arguments.get("max_results", 3))
        years = arguments.get("years", [2024, 2026])
        y_lo = int(years[0]) if years else 2024
        y_hi = int(years[-1]) if years else 2026
        results = []
        for i in range(n):
            h = _digest(query, i)
            year = y_lo + (int(h[:4], 16) % max(1, y_hi - y_lo + 1))
            results.append(
                {
                    "pmid": f"PMID{h[:8].upper()}",
                    "title": f"[stub] {query} — finding #{i + 1}",
                    "abstract": f"[stub abstract for '{query}' paper {i + 1}; content-hash {h[:12]}]",
                    "year": year,
                    "doi": f"10.0000/stub.{h[:10]}",
                }
            )
        return ToolResult(tool=self.name, output={"results": results}, cached=False)


def pubmed_stub() -> _PubmedStub:
    return _PubmedStub()
