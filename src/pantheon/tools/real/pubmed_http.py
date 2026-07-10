"""Real ``pubmed_search`` implementation via NCBI E-utilities.

HTTP transport is injected to keep the tool test-friendly and free of hard
network dependencies. The default transport (``HttpxTransport``) is only
constructed when ``pubmed_http()`` is called without arguments.
"""

from __future__ import annotations

import re
from typing import Any, Protocol
from xml.etree import ElementTree as ET

from pantheon.tools.base import ToolResult

_ESEARCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
_EFETCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"


class HttpTransport(Protocol):
    def get(self, url: str, params: dict[str, Any]) -> str: ...


class HttpxTransport:
    """Default production transport. Imports ``httpx`` lazily."""

    def get(self, url: str, params: dict[str, Any]) -> str:
        import httpx

        response = httpx.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.text


def _strip(text: str | None) -> str:
    if text is None:
        return ""
    return re.sub(r"\s+", " ", text).strip()


def _pub_year(entry: ET.Element) -> str:
    """Best-effort 4-digit publication year from a PubmedArticle entry.

    Prefers ``PubDate/Year``; falls back to the first 4-digit run in a
    ``MedlineDate`` (e.g. ``2021 Jan-Feb``). Empty string if neither is found.
    """
    year_el = entry.find(".//Article/Journal/JournalIssue/PubDate/Year")
    if year_el is not None and year_el.text:
        return _strip(year_el.text)
    medline_el = entry.find(".//Article/Journal/JournalIssue/PubDate/MedlineDate")
    if medline_el is not None and medline_el.text:
        m = re.search(r"\d{4}", medline_el.text)
        if m:
            return m.group(0)
    return ""


class PubmedHttp:
    name = "pubmed_search"
    input_schema = {
        "type": "object",
        "properties": {
            "query": {"type": "string"},
            "max_results": {"type": "integer"},
        },
        "required": ["query", "max_results"],
    }
    output_schema = {
        "type": "object",
        "properties": {
            "results": {"type": "array"},
        },
    }

    def __init__(self, http: HttpTransport | None = None) -> None:
        self._http: HttpTransport = http or HttpxTransport()

    def __call__(self, arguments: dict[str, Any]) -> ToolResult:
        query = str(arguments["query"])
        n = int(arguments.get("max_results", 5))

        esearch_xml = self._http.get(
            _ESEARCH,
            {"db": "pubmed", "term": query, "retmax": n, "retmode": "xml"},
        )
        ids = [el.text for el in ET.fromstring(esearch_xml).iter("Id") if el.text]
        if not ids:
            return ToolResult(tool=self.name, output={"results": []}, cached=False)

        efetch_xml = self._http.get(
            _EFETCH,
            {"db": "pubmed", "id": ",".join(ids), "retmode": "xml"},
        )
        root = ET.fromstring(efetch_xml)
        articles = []
        for entry in root.iter("PubmedArticle"):
            pmid_el = entry.find(".//PMID")
            title_el = entry.find(".//Article/ArticleTitle")
            abstract_el = entry.find(".//Article/Abstract/AbstractText")
            articles.append(
                {
                    "pmid": _strip(pmid_el.text if pmid_el is not None else None),
                    "title": _strip(title_el.text if title_el is not None else None),
                    "abstract": _strip(abstract_el.text if abstract_el is not None else None),
                    "year": _pub_year(entry),
                }
            )
        return ToolResult(tool=self.name, output={"results": articles}, cached=False)


def pubmed_http() -> PubmedHttp:
    return PubmedHttp()
