"""Tests for the LLM adapter."""

import json
import os
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from aasha.llm import LLMAdapter, LLMGenerationError, create_adapter


@pytest.fixture
def adapter(tmp_path):
    return LLMAdapter(
        provider="openai",
        model="gpt-4o-mini",
        cache_dir=str(tmp_path / "cache"),
    )


def test_cache_key_deterministic(adapter):
    key1 = adapter._cache_key("system", "user")
    key2 = adapter._cache_key("system", "user")
    assert key1 == key2


def test_cache_key_different_for_different_input(adapter):
    key1 = adapter._cache_key("system", "user1")
    key2 = adapter._cache_key("system", "user2")
    assert key1 != key2


def test_cache_set_and_get(adapter):
    key = "test_key"
    data = {"result": "test"}
    adapter._cache_set(key, data)
    retrieved = adapter._cache_get(key)
    assert retrieved == data


def test_cache_returns_none_for_missing(adapter):
    assert adapter._cache_get("nonexistent") is None


def test_parse_json_direct(adapter):
    result = adapter._parse_json_response('{"key": "value"}')
    assert result == {"key": "value"}


def test_parse_json_with_code_fence(adapter):
    result = adapter._parse_json_response('```json\n{"key": "value"}\n```')
    assert result == {"key": "value"}


def test_parse_json_with_extra_text(adapter):
    result = adapter._parse_json_response('Here is the result:\n{"key": "value"}\nDone.')
    assert result == {"key": "value"}


def test_count_tokens(adapter):
    assert adapter._count_tokens("hello world") > 0
    assert adapter._count_tokens("") >= 1


def test_estimate_cost(adapter):
    cost = adapter._estimate_cost(1000, 500)
    assert cost > 0
    assert cost < 0.01  # Should be very small


def test_complete_uses_cache(adapter):
    """Test that complete() returns cached result without calling the API."""
    system = "test system"
    user = "test user"

    # Pre-populate cache
    cache_key = adapter._cache_key(system, user)
    adapter._cache_set(cache_key, {"cached": True})

    # Should return cached value without calling the API
    result = adapter.complete(system, user)
    assert result == {"cached": True}


def test_create_adapter_factory():
    adapter = create_adapter(provider="openai", cache_dir="/tmp/test_cache")
    assert adapter.provider == "openai"
    assert adapter.model == "gpt-4o-mini"
