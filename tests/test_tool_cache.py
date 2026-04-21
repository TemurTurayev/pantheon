"""Tests for the content-addressed tool cache."""

from __future__ import annotations

from pathlib import Path

from pantheon.tools.cache import ContentCache


def test_cache_miss_then_hit(tmp_path: Path):
    cache = ContentCache(tmp_path)
    key = cache.key_for("echo", {"x": "a"})

    assert cache.get(key) is None
    cache.put(key, {"x": "a"})
    assert cache.get(key) == {"x": "a"}


def test_cache_key_stable_across_dict_order(tmp_path: Path):
    cache = ContentCache(tmp_path)
    k1 = cache.key_for("echo", {"a": 1, "b": 2})
    k2 = cache.key_for("echo", {"b": 2, "a": 1})
    assert k1 == k2


def test_cache_key_changes_with_tool_name(tmp_path: Path):
    cache = ContentCache(tmp_path)
    k1 = cache.key_for("t1", {"x": 1})
    k2 = cache.key_for("t2", {"x": 1})
    assert k1 != k2


def test_cache_survives_restart(tmp_path: Path):
    cache_a = ContentCache(tmp_path)
    key = cache_a.key_for("t", {"x": "y"})
    cache_a.put(key, {"result": 42})

    cache_b = ContentCache(tmp_path)
    assert cache_b.get(key) == {"result": 42}
