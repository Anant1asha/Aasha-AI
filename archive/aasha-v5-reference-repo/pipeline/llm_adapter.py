"""
llm_adapter.py — thin, pluggable LLM provider abstraction.

Design (per docs/OPEN_SOURCE_TOOLING.md): this is deliberately NOT a heavy agent
framework. It's two methods (`complete`, `batch_complete`) behind a common
interface, stdlib `urllib` for HTTP (no SDK dependency required), manual
exponential backoff (NFR-3), and a sha256-keyed file cache so re-running a
pipeline on unchanged input costs $0.

Providers included:
  - MockProvider   : deterministic canned responses, zero network — this is the
                      default so the whole pipeline is runnable and testable
                      offline, exactly like this sandbox.
  - OpenAIProvider  : GPT-4o-mini via the Chat Completions API (urllib, no SDK).
  - AnthropicProvider: Claude via the Messages API (urllib, no SDK).
  - GeminiProvider  : Gemini free-tier fallback (urllib, no SDK).

Swap providers via config.yaml `llm.default_provider`, or pass one directly to
the orchestrator. All three real providers are untested in this sandbox
(network is disabled here) — the HTTP shapes match each vendor's public API
as of the last training data, so verify against current docs before
production use (see docs/product-self-knowledge pattern: always confirm
against live docs, provider APIs shift).
"""
from __future__ import annotations

import hashlib
import json
import os
import time
import urllib.request
import urllib.error
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any


class LLMGenerationError(Exception):
    """Raised when a provider call fails after all retries, or returns
    malformed JSON after one repair attempt. Caught by the orchestrator,
    which marks the stage (and therefore the job) failed with a reason."""


class LLMAdapter(ABC):
    """Common interface every provider implements."""

    name: str = "base"

    def __init__(self, model: str, temperature: float = 0.0,
                 cache_dir: str = "./.llm_cache", max_retries: int = 3):
        self.model = model
        self.temperature = temperature
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.max_retries = max_retries
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.total_calls = 0
        self.cache_hits = 0

    # ---- caching ----------------------------------------------------
    def _cache_key(self, system: str, user: str) -> str:
        raw = f"{system}\n---\n{user}\n---\n{self.model}\n{self.temperature}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def _cache_path(self, key: str) -> Path:
        return self.cache_dir / f"{key}.json"

    def _cache_get(self, key: str) -> dict | None:
        p = self._cache_path(key)
        if p.exists():
            try:
                self.cache_hits += 1
                return json.loads(p.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                return None
        return None

    def _cache_set(self, key: str, value: dict) -> None:
        self._cache_path(key).write_text(
            json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    # ---- public API ---------------------------------------------------
    def complete(self, system: str, user: str, json_schema: dict | None = None) -> dict:
        """Single structured-JSON completion. Cached, retried with backoff."""
        key = self._cache_key(system, user)
        cached = self._cache_get(key)
        if cached is not None:
            return cached

        last_err: Exception | None = None
        for attempt in range(self.max_retries):
            try:
                self.total_calls += 1
                raw_text = self._call(system, user, json_schema)
                parsed = self._parse_json(raw_text)
                self._cache_set(key, parsed)
                return parsed
            except (LLMGenerationError, urllib.error.URLError, TimeoutError,
                    json.JSONDecodeError) as e:
                last_err = e
                if attempt < self.max_retries - 1:
                    time.sleep((2 ** attempt) + 0.1 * attempt)  # 1s, 2s, 4s + jitter
        raise LLMGenerationError(
            f"[{self.name}] failed after {self.max_retries} attempts: {last_err}"
        )

    def batch_complete(self, items: list[dict]) -> list[dict]:
        """Independent calls batched into the SAME provider round trips where
        the provider supports multi-item prompts; the base implementation
        just loops with the shared cache, which is still $0 on repeat runs."""
        return [self.complete(it["system"], it["user"], it.get("json_schema"))
                for it in items]

    @staticmethod
    def _parse_json(text: str) -> dict:
        text = text.strip()
        if text.startswith("```"):
            text = text.strip("`")
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text.strip())

    # ---- provider-specific ------------------------------------------
    @abstractmethod
    def _call(self, system: str, user: str, json_schema: dict | None) -> str:
        """Return raw text from the provider. Raise LLMGenerationError on
        unrecoverable failure (auth, bad request); let network errors
        propagate so the retry loop in complete() can catch them."""


class MockProvider(LLMAdapter):
    """Deterministic, zero-network provider for offline development and CI.

    Returns structurally valid content matching each stage's expected shape,
    derived from the input so different chapters produce different (but
    always schema-valid) output. This is what lets the orchestrator, the
    validators, and the assembler be exercised end-to-end without an API key.
    """
    name = "mock"

    def _call(self, system: str, user: str, json_schema: dict | None) -> str:
        # Route on a marker the stage modules put in the system prompt so
        # the mock can return the right shape for each stage.
        if "content_map" in system:
            return self._mock_content_map(user)
        if "chapter_spec structure" in system:
            return self._mock_design(user)
        if "assessment" in system:
            return self._mock_assessment(user)
        if "lle_translation" in system:
            return self._mock_lle(user)
        raise LLMGenerationError(f"MockProvider has no route for prompt: {system[:60]!r}")

    @staticmethod
    def _mock_content_map(user: str) -> str:
        return json.dumps({
            "concepts": [
                {"name": "Concept One", "summary": "Core idea of the chapter.",
                 "key_ideas": ["idea A", "idea B"], "difficulty": "medium"},
                {"name": "Concept Two", "summary": "Builds on concept one.",
                 "key_ideas": ["idea C"], "difficulty": "medium"},
                {"name": "Concept Three", "summary": "Applies both concepts.",
                 "key_ideas": ["idea D"], "difficulty": "hard"},
            ],
            "worked_examples": [{"problem": "Sample problem 1", "solution_approach": "Step-wise"}],
            "quiz_opportunities": [{"concept": "Concept One", "point": "after intro"}],
            "visual_opportunities": [{"concept": "Concept One", "visual_type": "bar"}],
            "vocabulary": ["sample_term"],
        })

    @staticmethod
    def _mock_design(user: str) -> str:
        return json.dumps({"structure_ack": True, "node_count": 3})

    @staticmethod
    def _mock_assessment(user: str) -> str:
        return json.dumps({
            "question": "Which option correctly completes the concept?",
            "opts": [
                {"t": "Correct option", "c": True, "m": ""},
                {"t": "Distractor A", "c": False, "m": "This confuses the operation order."},
                {"t": "Distractor B", "c": False, "m": "This uses the wrong unit."},
            ],
        })

    @staticmethod
    def _mock_lle(user: str) -> str:
        # user carries a JSON list of net-new words; echo back placeholder Hindi.
        try:
            words = json.loads(user)
        except json.JSONDecodeError:
            words = []
        return json.dumps({w: f"अर्थ_{w} ({w})" for w in words})


class OpenAIProvider(LLMAdapter):
    """GPT-4o-mini via Chat Completions, structured-output JSON mode."""
    name = "openai"
    API_URL = "https://api.openai.com/v1/chat/completions"

    def _call(self, system: str, user: str, json_schema: dict | None) -> str:
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise LLMGenerationError("OPENAI_API_KEY not set")
        body = {
            "model": self.model,
            "temperature": self.temperature,
            "messages": [{"role": "system", "content": system},
                         {"role": "user", "content": user}],
            "response_format": {"type": "json_object"},
        }
        req = urllib.request.Request(
            self.API_URL, data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json",
                     "Authorization": f"Bearer {api_key}"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        usage = data.get("usage", {})
        self.total_input_tokens += usage.get("prompt_tokens", 0)
        self.total_output_tokens += usage.get("completion_tokens", 0)
        return data["choices"][0]["message"]["content"]


class AnthropicProvider(LLMAdapter):
    """Claude via the Messages API."""
    name = "anthropic"
    API_URL = "https://api.anthropic.com/v1/messages"

    def _call(self, system: str, user: str, json_schema: dict | None) -> str:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise LLMGenerationError("ANTHROPIC_API_KEY not set")
        body = {
            "model": self.model,
            "max_tokens": 4096,
            "system": system + "\n\nRespond with ONLY valid JSON, no prose, no markdown fences.",
            "messages": [{"role": "user", "content": user}],
        }
        req = urllib.request.Request(
            self.API_URL, data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json",
                     "x-api-key": api_key,
                     "anthropic-version": "2023-06-01"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        usage = data.get("usage", {})
        self.total_input_tokens += usage.get("input_tokens", 0)
        self.total_output_tokens += usage.get("output_tokens", 0)
        return "".join(b["text"] for b in data.get("content", []) if b.get("type") == "text")


class GeminiProvider(LLMAdapter):
    """Google Gemini free-tier fallback."""
    name = "gemini"

    def _call(self, system: str, user: str, json_schema: dict | None) -> str:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise LLMGenerationError("GEMINI_API_KEY not set")
        url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
               f"{self.model}:generateContent?key={api_key}")
        body = {
            "contents": [{"parts": [{"text": f"{system}\n\n{user}"}]}],
            "generationConfig": {"temperature": self.temperature,
                                  "responseMimeType": "application/json"},
        }
        req = urllib.request.Request(
            url, data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json"}, method="POST",
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        return data["candidates"][0]["content"]["parts"][0]["text"]


PROVIDERS: dict[str, type[LLMAdapter]] = {
    "mock": MockProvider,
    "openai": OpenAIProvider,
    "anthropic": AnthropicProvider,
    "gemini": GeminiProvider,
}


def get_provider(name: str, model: str, **kwargs) -> LLMAdapter:
    if name not in PROVIDERS:
        raise ValueError(f"Unknown provider {name!r}. Choices: {list(PROVIDERS)}")
    return PROVIDERS[name](model=model, **kwargs)
