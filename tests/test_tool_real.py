"""Tests for real-tool wrappers.

Real tools use injected HTTP clients or optional heavy deps. Tests never
hit the network and never require GPU packages.
"""

from __future__ import annotations

from typing import Any

import pytest

from pantheon.tools.real.pubmed_http import PubmedHttp
from pantheon.tools.real.rdkit_real import rdkit_real


class _FakeHttp:
    def __init__(self, pages: dict[str, str]):
        self._pages = pages
        self.calls: list[str] = []

    def get(self, url: str, params: dict[str, Any]) -> str:
        self.calls.append(url)
        key = self._match(url, params)
        return self._pages[key]

    @staticmethod
    def _match(url: str, params: dict[str, Any]) -> str:
        if "esearch" in url:
            return "esearch"
        if "efetch" in url:
            return "efetch"
        raise KeyError(url)


_ESEARCH_XML = """<?xml version="1.0"?>
<eSearchResult>
  <Count>2</Count>
  <IdList>
    <Id>123</Id>
    <Id>456</Id>
  </IdList>
</eSearchResult>"""

_EFETCH_XML = """<?xml version="1.0"?>
<PubmedArticleSet>
  <PubmedArticle>
    <MedlineCitation>
      <PMID>123</PMID>
      <Article>
        <ArticleTitle>EGFR binder design</ArticleTitle>
        <Journal><JournalIssue><PubDate><Year>2021</Year></PubDate></JournalIssue></Journal>
        <Abstract><AbstractText>Foo bar.</AbstractText></Abstract>
      </Article>
    </MedlineCitation>
  </PubmedArticle>
  <PubmedArticle>
    <MedlineCitation>
      <PMID>456</PMID>
      <Article>
        <ArticleTitle>Allosteric binding</ArticleTitle>
        <Journal><JournalIssue><PubDate>
          <MedlineDate>2019 Jan-Feb</MedlineDate>
        </PubDate></JournalIssue></Journal>
        <Abstract><AbstractText>Baz qux.</AbstractText></Abstract>
      </Article>
    </MedlineCitation>
  </PubmedArticle>
</PubmedArticleSet>"""


def test_pubmed_http_parses_esearch_and_efetch():
    http = _FakeHttp({"esearch": _ESEARCH_XML, "efetch": _EFETCH_XML})
    tool = PubmedHttp(http=http)
    result = tool({"query": "EGFR", "max_results": 2})
    items = result.output["results"]
    assert len(items) == 2
    assert items[0]["pmid"] == "123"
    assert items[0]["title"] == "EGFR binder design"
    assert items[1]["abstract"] == "Baz qux."


def test_pubmed_http_extracts_year():
    """Real years come through so the literature review isn't all 'n/a'."""
    http = _FakeHttp({"esearch": _ESEARCH_XML, "efetch": _EFETCH_XML})
    result = PubmedHttp(http=http)({"query": "EGFR", "max_results": 2})
    items = result.output["results"]
    assert items[0]["year"] == "2021"  # from <Year>
    assert items[1]["year"] == "2019"  # parsed out of a <MedlineDate>


def test_rdkit_real_computes_real_descriptors():
    """When rdkit is installed, descriptors are the real textbook values."""
    pytest.importorskip("rdkit")
    tool = rdkit_real()
    # aspirin — MW 180.16, and a real Ertl SA score in the 1..10 range.
    out = tool({"smiles": "CC(=O)Oc1ccccc1C(=O)O"}).output
    assert abs(out["mw"] - 180.16) < 0.1
    assert 0.0 < out["tpsa"] < 120.0
    assert 1.0 <= out["sa_score"] <= 10.0  # real Ertl score, not the 0.0 placeholder


def test_rdkit_real_falls_back_to_stub_when_unavailable():
    """If rdkit is not installed we still return something schema-valid."""
    tool = rdkit_real()
    result = tool({"smiles": "CCO"})
    for key in ("qed", "logp", "tpsa", "mw", "sa_score", "lipinski_violations"):
        assert key in result.output


def test_rdkit_real_rejects_malformed():
    tool = rdkit_real()
    # Empty string is not a valid SMILES even to the stub.
    with pytest.raises(ValueError):
        tool({"smiles": ""})
