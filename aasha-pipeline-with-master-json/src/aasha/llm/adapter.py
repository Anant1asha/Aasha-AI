"""LLM adapter — multi-provider abstraction with caching, retry, and JSON repair.

Supports: OpenAI (GPT-4o-mini), Google Gemini, Anthropic Claude.
Each provider exposes two methods:
  - complete(system, user, schema) → parsed JSON
  - batch_complete(items) → list of parsed JSONs

Features:
  - File cache keyed by SHA-256(system_prompt + user_prompt + model)
  - Retry with exponential backoff + jitter (tenacity)
  - Malformed JSON repair retry
  - Temperature control (0 for structural, 0.2 for LLE)
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import time
from pathlib import Path
from typing import Any

from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential_jitter,
    retry_if_exception_type,
)

logger = logging.getLogger(__name__)


class LLMGenerationError(Exception):
    """Raised when an LLM call fails after all retries."""


class LLMAdapter:
    """Multi-provider LLM adapter with caching and retry."""

    def __init__(
        self,
        provider: str = "openai",
        model: str = "",
        temperature: float = 0.0,
        cache_dir: str = "./.llm_cache",
        max_retries: int = 3,
        backoff_base: float = 1.0,
        backoff_max: float = 30.0,
        rate_limit_delay: float = 1.0,
    ):
        self.provider = provider
        self.model = model or self._default_model(provider)
        self.temperature = temperature
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.max_retries = max_retries
        self.backoff_base = backoff_base
        self.backoff_max = backoff_max
        self.rate_limit_delay = rate_limit_delay
        self._last_call_time = 0.0
        self._client = None
        self._total_cost = 0.0

    @staticmethod
    def _default_model(provider: str) -> str:
        defaults = {
            "openai": "gpt-4o-mini",
            "gemini": "gemini-1.5-flash",
            "anthropic": "claude-3-haiku-20240307",
            "openrouter": "openai/gpt-4o-mini",
            "huggingface": "meta-llama/Llama-3-8b-chat-hf",
            "freebuff": "default-freebuff-model",
        }
        return defaults.get(provider, "gpt-4o-mini")

    @property
    def cost_estimate(self) -> float:
        return self._total_cost

    def _cache_key(self, system: str, user: str) -> str:
        raw = f"{system}\n{user}\n{self.model}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def _cache_path(self, key: str) -> Path:
        return self.cache_dir / f"{key}.json"

    def _cache_get(self, key: str) -> dict | None:
        path = self._cache_path(key)
        if path.exists():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return None

    def _cache_set(self, key: str, data: dict) -> None:
        path = self._cache_path(key)
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
        except Exception as e:
            logger.warning(f"Cache write failed: {e}")

    def _parse_json_response(self, text: str) -> dict:
        """Parse JSON from LLM response, handling code fences and extra text."""
        text = text.strip()
        # Remove code fences
        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines)
        # Try direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        # Try to find JSON object within text
        start = text.find("{")
        if start == -1:
            start = text.find("[")
        end = text.rfind("}")
        if end == -1:
            end = text.rfind("]")
        if start != -1 and end != -1:
            fragment = text[start : end + 1]
            try:
                return json.loads(fragment)
            except json.JSONDecodeError:
                pass
        raise json.JSONDecodeError("Could not parse JSON from response", text, 0)

    def _estimate_cost(self, input_tokens: int, output_tokens: int) -> float:
        """Estimate cost based on provider pricing (rough)."""
        pricing = {
            "openai": {"input": 0.15e-6, "output": 0.60e-6},
            "gemini": {"input": 0.075e-6, "output": 0.30e-6},
            "anthropic": {"input": 0.25e-6, "output": 1.25e-6},
            "openrouter": {"input": 0.15e-6, "output": 0.60e-6},
            "huggingface": {"input": 0.0, "output": 0.0},
            "freebuff": {"input": 0.0, "output": 0.0},
        }
        p = pricing.get(self.provider, pricing["openai"])
        return (input_tokens * p["input"]) + (output_tokens * p["output"])

    def _count_tokens(self, text: str) -> int:
        """Rough token count (4 chars ≈ 1 token)."""
        return max(1, len(text) // 4)

    def _call_openai(self, system: str, user: str) -> str:
        """Call OpenAI API."""
        if self._client is None:
            try:
                from openai import OpenAI
            except ImportError:
                raise LLMGenerationError("openai package not installed. Run: pip install openai")
            api_key = os.environ.get("OPENAI_API_KEY")
            if not api_key:
                raise LLMGenerationError("OPENAI_API_KEY not set in environment")
            self._client = OpenAI(api_key=api_key)

        response = self._client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=self.temperature,
            response_format={"type": "json_object"},
        )
        return response.choices[0].message.content or ""

    def _call_gemini(self, system: str, user: str) -> str:
        """Call Google Gemini API."""
        if self._client is None:
            try:
                import google.generativeai as genai
            except ImportError:
                raise LLMGenerationError(
                    "google-generativeai package not installed. Run: pip install google-generativeai"
                )
            api_key = os.environ.get("GEMINI_API_KEY")
            if not api_key:
                raise LLMGenerationError("GEMINI_API_KEY not set in environment")
            genai.configure(api_key=api_key)
            self._client = genai.GenerativeModel(self.model)

        combined = f"{system}\n\n{user}\n\nRespond with valid JSON only."
        response = self._client.generate_content(combined)
        return response.text

    def _call_anthropic(self, system: str, user: str) -> str:
        """Call Anthropic Claude API."""
        if self._client is None:
            try:
                from anthropic import Anthropic
            except ImportError:
                raise LLMGenerationError(
                    "anthropic package not installed. Run: pip install anthropic"
                )
            api_key = os.environ.get("ANTHROPIC_API_KEY")
            if not api_key:
                raise LLMGenerationError("ANTHROPIC_API_KEY not set in environment")
            self._client = Anthropic(api_key=api_key)

        response = self._client.messages.create(
            model=self.model,
            max_tokens=8192,
            temperature=self.temperature,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        return response.content[0].text if response.content else ""

    def _call_openrouter(self, system: str, user: str) -> str:
        """Call OpenRouter API."""
        if self._client is None:
            try:
                from openai import OpenAI
            except ImportError:
                raise LLMGenerationError("openai package not installed.")
            api_key = os.environ.get("OPENROUTER_API_KEY")
            if not api_key:
                raise LLMGenerationError("OPENROUTER_API_KEY not set in environment")
            self._client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=api_key
            )

        response = self._client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=self.temperature,
        )
        return response.choices[0].message.content or ""

    def _call_huggingface(self, system: str, user: str) -> str:
        """Call Hugging Face Inference API."""
        import requests
        api_key = os.environ.get("HF_API_KEY")
        if not api_key:
            raise LLMGenerationError("HF_API_KEY not set in environment")
        
        headers = {"Authorization": f"Bearer {api_key}"}
        # Simplify the prompt for HF endpoints usually expecting a single string or specific format
        prompt = f"System: {system}\n\nUser: {user}\n\nResponse:"
        payload = {
            "inputs": prompt,
            "parameters": {"temperature": max(self.temperature, 0.01), "return_full_text": False}
        }
        url = f"https://api-inference.huggingface.co/models/{self.model}"
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code != 200:
            raise LLMGenerationError(f"HuggingFace API Error: {response.text}")
            
        res_json = response.json()
        if isinstance(res_json, list) and len(res_json) > 0 and "generated_text" in res_json[0]:
            return res_json[0]["generated_text"]
        return str(res_json)

    def _call_freebuff(self, system: str, user: str) -> str:
        """Call Freebuff CLI via subprocess."""
        import subprocess
        prompt = f"System: {system}\nUser: {user}\nRespond with valid JSON only."
        try:
            # Assuming freebuff is installed globally as per user rules
            result = subprocess.run(
                ["freebuff", "--prompt", prompt],
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout
        except Exception as e:
            raise LLMGenerationError(f"Freebuff call failed: {e}")

    def _call_provider(self, system: str, user: str) -> str:
        """Route to the correct provider."""
        if self.provider == "openai":
            return self._call_openai(system, user)
        elif self.provider == "gemini":
            return self._call_gemini(system, user)
        elif self.provider == "anthropic":
            return self._call_anthropic(system, user)
        elif self.provider == "openrouter":
            return self._call_openrouter(system, user)
        elif self.provider == "huggingface":
            return self._call_huggingface(system, user)
        elif self.provider == "freebuff":
            return self._call_freebuff(system, user)
        else:
            raise LLMGenerationError(f"Unknown provider: {self.provider}")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential_jitter(initial=1.0, max=30.0),
        retry=retry_if_exception_type((LLMGenerationError, json.JSONDecodeError, Exception)),
        reraise=True,
    )
    def _call_with_retry(self, system: str, user: str) -> str:
        return self._call_provider(system, user)

    def complete(
        self,
        system: str,
        user: str,
        schema_hint: str = "",
    ) -> dict[str, Any]:
        """Send a completion request and return parsed JSON.

        Args:
            system: System prompt
            user: User prompt
            schema_hint: Optional description of expected JSON structure

        Returns:
            Parsed JSON dict

        Raises:
            LLMGenerationError: If all retries fail
        """
        # Check cache first
        cache_key = self._cache_key(system, user)
        cached = self._cache_get(cache_key)
        if cached is not None:
            logger.debug("LLM cache hit")
            return cached

        # Rate limiting
        if self.rate_limit_delay > 0:
            elapsed = time.time() - getattr(self, "_last_call_time", 0.0)
            if elapsed < self.rate_limit_delay:
                time.sleep(self.rate_limit_delay - elapsed)

        # Build full user prompt with schema hint
        full_user = user
        if schema_hint:
            full_user += f"\n\nRespond with valid JSON matching this structure:\n{schema_hint}"
        full_user += "\n\nRespond with valid JSON only, no markdown fences."

        # Call with retry
        try:
            raw_response = self._call_with_retry(system, full_user)
            self._last_call_time = time.time()
        except Exception as e:
            logger.error(f"LLM call failed after retries: {e}")
            raise LLMGenerationError(f"LLM call failed: {e}") from e

        # Parse JSON
        try:
            result = self._parse_json_response(raw_response)
        except json.JSONDecodeError:
            # One repair attempt
            logger.warning("Malformed JSON, attempting repair...")
            repair_prompt = (
                f"The following response was not valid JSON. Fix it and return ONLY valid JSON.\n\n"
                f"Original response:\n{raw_response}"
            )
            try:
                repaired = self._call_with_retry(
                    "You are a JSON repair assistant. Return only valid JSON.",
                    repair_prompt,
                )
                result = self._parse_json_response(repaired)
            except Exception as e:
                raise LLMGenerationError(f"JSON repair failed: {e}") from e

        # Estimate cost
        in_tokens = self._count_tokens(system + full_user)
        out_tokens = self._count_tokens(raw_response)
        self._total_cost += self._estimate_cost(in_tokens, out_tokens)

        # Cache result
        self._cache_set(cache_key, result)

        return result

    def batch_complete(
        self,
        items: list[tuple[str, str]],
        schema_hint: str = "",
    ) -> list[dict[str, Any]]:
        """Send multiple completion requests.

        Each item is a (system, user) tuple. Results are returned in order.
        Failures are returned as {"error": "..."} dicts.
        """
        results = []
        for system, user in items:
            try:
                result = self.complete(system, user, schema_hint)
                results.append(result)
            except LLMGenerationError as e:
                logger.error(f"Batch item failed: {e}")
                results.append({"error": str(e)})
        return results


def create_adapter(
    provider: str = "openai",
    model: str = "",
    temperature: float = 0.0,
    cache_dir: str = "./.llm_cache",
    max_retries: int = 3,
    rate_limit_delay: float = 1.0,
) -> LLMAdapter:
    """Factory function to create an LLM adapter."""
    return LLMAdapter(
        provider=provider,
        model=model,
        temperature=temperature,
        cache_dir=cache_dir,
        max_retries=max_retries,
        rate_limit_delay=rate_limit_delay,
    )
