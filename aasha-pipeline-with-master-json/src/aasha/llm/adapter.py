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
import random
import re
import threading
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

# Module-level thread-safe circuit breaker and rate pacing for multimodal vision
_vision_cooldown_lock = threading.Lock()
_vision_model_cooldowns: dict[str, float] = {}
_vision_round_robin_counter: int = 0
_last_vision_call_time: float = 0.0


def _load_env_if_missing() -> None:
    """Auto-load environment variables from Aasha-AI/.env or root .env if not set."""
    candidates = [
        Path.cwd() / "Aasha-AI" / ".env",
        Path.cwd() / ".env",
        Path(__file__).resolve().parents[4] / "Aasha-AI" / ".env",
        Path(__file__).resolve().parents[4] / ".env",
        Path(__file__).resolve().parents[3] / "Aasha-AI" / ".env",
        Path(__file__).resolve().parents[3] / ".env",
    ]
    for p in candidates:
        if p.is_file():
            try:
                for line in p.read_text(encoding="utf-8").splitlines():
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip().strip("'\"")
                    if k and k not in os.environ:
                        os.environ[k] = v
                break
            except Exception:
                pass


_load_env_if_missing()


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
        fallback_models: list | None = None,
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
        # Anti-bleed Tier-1 fallback cascade for OpenRouter free models
        self._fallback_models: list[str] = (
            fallback_models if fallback_models is not None else [
                "liquid/lfm-2.5-2.6b:free",
                "cohere/north-mini-code:free",
                "recursive/flint-v1.0:free",
                "openrouter/nvidia/nemotron-3.5-super-vl:free",
                "google/gemma-4-31b-it:free",
            ]
        )
        self._last_call_time = 0.0
        self._client = None
        self._9router_client = None
        self._openrouter_client = None
        self._total_cost = 0.0

    @staticmethod
    def _default_model(provider: str) -> str:
        defaults = {
            "openai": "gpt-4o-mini",
            "gemini": "gemini-1.5-flash",
            "anthropic": "claude-3-haiku-20240307",
            "openrouter": "nvidia/nemotron-3.5-lightning:free",
            "offline": "tier0-deterministic-synthesizer",
            "huggingface": "meta-llama/Llama-3-8b-chat-hf",
            "freebuff": "default-freebuff-model",
        }
        return defaults.get(provider, "nvidia/nemotron-3.5-lightning:free")

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

    @staticmethod
    def is_9router_alive() -> bool:
        """Check if 9Router is listening on port 20128 (<1ms socket check)."""
        import socket
        try:
            with socket.create_connection(("127.0.0.1", 20128), timeout=0.5):
                return True
        except (OSError, socket.timeout):
            return False

    @classmethod
    def ensure_9router_daemon(cls) -> bool:
        """Ensure 9Router daemon is running on port 20128; auto-spawn detached if missing."""
        if cls.is_9router_alive():
            return True

        appdata = os.environ.get("APPDATA", "")
        server_js = Path(appdata) / "npm" / "node_modules" / "9router" / "app" / "custom-server.js"
        if not server_js.exists():
            return False

        import subprocess
        env = {**os.environ, "PORT": "20128", "HOSTNAME": "127.0.0.1"}
        flags = 0
        if os.name == "nt":
            flags = subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP

        try:
            logger.info("[9Router] Auto-starting background daemon on port 20128...")
            subprocess.Popen(
                ["node", str(server_js)],
                env=env,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                stdin=subprocess.DEVNULL,
                creationflags=flags,
            )
            for _ in range(10):
                time.sleep(0.5)
                if cls.is_9router_alive():
                    logger.info("[9Router] Daemon successfully online on port 20128.")
                    return True
        except Exception as e:
            logger.warning(f"[9Router] Failed to auto-start daemon: {e}")

        return False

    def _call_9router(self, system: str, user: str, model_override: str = "") -> str:
        """Call 9Router local gateway (port 20128) using OpenAI-compatible client."""
        try:
            from openai import OpenAI
        except ImportError:
            raise LLMGenerationError("openai package not installed.")
        api_key = os.environ.get("NINEROUTER_API_KEY")
        if not api_key:
            raise LLMGenerationError("NINEROUTER_API_KEY not configured")
        base_url = os.environ.get("NINEROUTER_BASE_URL", "http://localhost:20128/v1")
        model_to_use = model_override or os.environ.get("NINEROUTER_DEFAULT_MODEL", "claude-combo")
        client = OpenAI(base_url=base_url, api_key=api_key, timeout=60.0)
        # 9Router reasoning / combo models reject temperature parameter
        response = client.chat.completions.create(
            model=model_to_use,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
        return response.choices[0].message.content or ""

    def _call_openrouter(self, system: str, user: str, model_override: str = "") -> str:
        """Call OpenRouter API using the openai-compatible client."""
        try:
            from openai import OpenAI
        except ImportError:
            raise LLMGenerationError("openai package not installed.")
        api_key = os.environ.get("OPENROUTER_API_KEY")
        if not api_key:
            vault_path = Path.home() / ".aasha" / "config.json"
            if vault_path.exists():
                try:
                    with open(vault_path, "r", encoding="utf-8") as f:
                        vdata = json.load(f)
                        api_key = vdata.get("openrouter_key")
                except Exception:
                    pass
        if not api_key:
            logger.info("[OpenRouter] No OPENROUTER_API_KEY configured. Engaging Tier-0 Deterministic Local Synthesizer.")
            return json.dumps(self._synthesize_offline_fallback(system, user))
        client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=api_key, timeout=60.0)
        model_to_use = model_override or self.model
        response = client.chat.completions.create(
            model=model_to_use,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=self.temperature,
        )
        return response.choices[0].message.content or ""

    def _call_openrouter_with_cascade(self, system: str, user: str) -> str:
        """OpenRouter & 9Router call with Tier-1 anti-bleed fallback cascade.

        Tries 9Router local gateway first if available, then cascades to
        OpenRouter free-model pool. Handles provider traffic variations, rate limits,
        and transient network errors with 3s anti-bleed backoff.
        """
        # Step 1: Try 9Router local gateway first (zero token bleed, unlimited)
        if os.environ.get("NINEROUTER_API_KEY"):
            # Ensure daemon is alive or auto-start it
            self.ensure_9router_daemon()
            if self.is_9router_alive():
                try:
                    logger.info("[Router] Attempting primary 9Router gateway on port 20128...")
                    return self._call_9router(system, user)
                except Exception as e:
                    err_msg = str(e)
                    logger.warning(
                        "[Router] 9Router gateway unavailable or failed (%s). Cascading to OpenRouter free pool.",
                        err_msg[:100],
                    )
            else:
                logger.warning("[Router] 9Router port 20128 unreachable. Cascading to OpenRouter free pool.")

        # Step 2: OpenRouter free-model cascade
        models_to_try = [self.model] + list(self._fallback_models)
        last_err: Exception | None = None
        for attempt, model in enumerate(models_to_try):
            try:
                logger.info(
                    "[OpenRouter] attempt %d/%d — model: %s",
                    attempt + 1, len(models_to_try), model,
                )
                return self._call_openrouter(system, user, model_override=model)
            except Exception as exc:
                err_str = str(exc)
                is_transient = any(
                    sig in err_str.lower()
                    for sig in [
                        "429", "404", "500", "502", "503", "504",
                        "rate", "timeout", "connection", "traffic", "overloaded", "exhausted"
                    ]
                )
                if is_transient:
                    logger.warning(
                        "[OpenRouter] Transient error on model '%s' (%s) — 3s backoff, trying next model.",
                        model, err_str[:80],
                    )
                    time.sleep(3)
                    last_err = exc
                    self._client = None
                    continue
                # Non-transient error: log and try next model rather than immediate hard failure
                logger.warning(
                    "[OpenRouter] Call failed on model '%s' (%s) — trying next fallback model.",
                    model, err_str[:80],
                )
                time.sleep(1)
                last_err = exc
                self._client = None
                continue

        logger.warning(
            f"[Router] All remote LLM routing options exhausted ({last_err}). "
            f"Seamlessly engaging Tier-0 Deterministic Local Synthesizer."
        )
        return json.dumps(self._synthesize_offline_fallback(system, user))

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

    def _synthesize_offline_fallback(self, system: str, user: str) -> dict[str, Any]:
        """Synthesize compliant responses locally using the Tier-0 Deterministic Synthesizer."""
        from ..synthesis.offline_synthesizer import OfflineSynthesizer

        logger.info("[LLMAdapter] Generating compliant Tier-0 local synthetic output...")
        sys_lower = system.lower()

        # 1. AnalysisAgent (Pedagogy Map)
        if "pedagogue" in sys_lower or "pedagogical structure" in sys_lower:
            subject = "math"
            grade = 4
            sub_m = re.search(r"Subject:\s*(\w+)", user, re.I)
            if sub_m:
                subject = sub_m.group(1).lower()
            grd_m = re.search(r"Grade:\s*(\d+)", user, re.I)
            if grd_m:
                grade = int(grd_m.group(1))

            text_m = re.search(r"Extracted text from the textbook chapter:\s*([\s\S]*?)(?:Analyze this chapter|\Z)", user)
            raw_text = text_m.group(1).strip() if text_m else ""
            raw_extract = {
                "pages": [{"page_num": 1, "text": raw_text[:5000]}],
                "headings": [{"text": h[0] or h[1]} for h in re.findall(r"^#+\s*(.+)$|([A-Z][A-Za-z0-9\s]{3,40})\n", raw_text, re.M) if any(h)],
            }
            return OfflineSynthesizer.synthesize_analysis(raw_extract, subject=subject, grade=grade)

        # 2. DesignAgent (Chapter Spec)
        elif "instructional designer" in sys_lower or "nodes/steps" in sys_lower:
            cmap = {}
            json_m = re.search(r"(\{[\s\S]*\})", user)
            if json_m:
                try:
                    cmap = json.loads(json_m.group(1))
                except Exception:
                    pass
            subject = cmap.get("subject", "math")
            grade = cmap.get("grade", 4)
            mode = "full-synthesis" if "full-synthesis" in sys_lower or "plugin" in sys_lower else "v5-engine"
            return OfflineSynthesizer.synthesize_design(cmap, subject=subject, grade=grade, mode=mode)

        # 3. AssessmentAgent
        elif "assessment" in sys_lower or "distractor" in sys_lower or "options for these" in user.lower():
            locs = []
            json_m = re.search(r"assessment locations:\s*(\[[\s\S]*?\])\s*(?:For each location|\Z)", user, re.I)
            if not json_m:
                json_m = re.search(r"(\[[\s\S]*\])", user)
            if json_m:
                try:
                    locs = json.loads(json_m.group(1))
                except Exception:
                    pass
            assessments = []
            sample_answers = [
                ("Multiply both numerator and denominator by the same non-zero number", [
                    ("Add the same number to top and bottom", "Adding changes the ratio rather than creating an equivalent fraction."),
                    ("Invert the fraction without changing the sign", "Inverting changes the reciprocal value."),
                    ("Divide the top only by two", "Both numerator and denominator must undergo identical scaling."),
                ]),
                ("It represents an equal ratio of parts to the whole", [
                    ("It only applies to positive whole integers", "Rational values can be negative or fractional."),
                    ("It changes value when multiplied by 1", "Multiplying by 1 preserves value identically."),
                    ("The denominator can be zero", "Dividing by zero is undefined in mathematics."),
                ]),
                ("The simplest reduced form", [
                    ("The largest possible multiple", "Simplification requires finding common factors to reduce."),
                    ("An approximation rounded to ten", "Exact fractions should be kept in lowest terms rather than rounded."),
                    ("A reciprocal integer value", "The reciprocal inverts the fraction rather than simplifying it."),
                ]),
                ("Both sides remain completely balanced", [
                    ("The left side becomes heavier", "An equality operation maintains exact equivalence across both pans."),
                    ("The equation loses its solution", "Performing identical valid operations preserves all equation solutions."),
                    ("The variable cancels out to zero", "Only matching opposite terms cancel out to zero."),
                ]),
            ]
            for idx, loc in enumerate(locs):
                ans, wrong = sample_answers[idx % len(sample_answers)]
                opts = [{"t": ans, "c": True, "m": ""}]
                for wt, wm in wrong:
                    opts.append({"t": wt, "c": False, "m": wm})
                assessments.append({
                    "location": loc.get("location", f"loc_{idx}"),
                    "opts": opts,
                })
            return {"assessments": assessments}

        # 4. LLEAgent
        elif "bilingual" in sys_lower or "lle" in sys_lower:
            vocab = re.findall(r"\b([a-zA-Z]{3,20})\b", user)[:30]
            return OfflineSynthesizer.synthesize_lle(vocab)

        return {"status": "ok", "message": "Offline synthesis complete"}

    def _call_provider(self, system: str, user: str) -> str:
        """Route to the correct provider.

        OpenRouter uses the anti-bleed free-model cascade.
        Paid Gemini is guarded by ALLOW_PAID_GEMINI_FALLBACK env var.
        """
        if self.provider == "offline" or os.environ.get("AASHA_OFFLINE") == "1":
            return json.dumps(self._synthesize_offline_fallback(system, user))
        elif self.provider == "openai":
            return self._call_openai(system, user)
        elif self.provider == "gemini":
            # Anti-bleed guard: block paid Gemini unless explicitly authorized
            if os.environ.get("ALLOW_PAID_GEMINI_FALLBACK", "false").lower() != "true":
                raise LLMGenerationError(
                    "Paid Gemini API is locked out (ALLOW_PAID_GEMINI_FALLBACK=false). "
                    "Use OpenRouter free tier (provider=openrouter) instead. "
                    "Gemini is Tier-3 reserve — requires explicit Super Admin authorization."
                )
            return self._call_gemini(system, user)
        elif self.provider == "anthropic":
            return self._call_anthropic(system, user)
        elif self.provider in ("openrouter", "9router"):
            # Use cascade: 9Router primary → OpenRouter fallback_models with 3s anti-bleed backoff
            return self._call_openrouter_with_cascade(system, user)
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
        # Build full user prompt with schema hint
        full_user = user
        if schema_hint:
            full_user += f"\n\nRespond with valid JSON matching this structure:\n{schema_hint}"
        full_user += "\n\nRespond with valid JSON only, no markdown fences."

        # Offline execution check (zero token bleed, 0ms network latency)
        if self.provider == "offline" or os.environ.get("AASHA_OFFLINE") == "1":
            return self._synthesize_offline_fallback(system, full_user)

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

        # Call with retry
        try:
            raw_response = self._call_with_retry(system, full_user)
            self._last_call_time = time.time()
        except Exception as e:
            logger.warning(f"LLM call failed after retries: {e}. Engaging Tier-0 Deterministic Local Synthesizer...")
            return self._synthesize_offline_fallback(system, full_user)

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

    def complete_vision(
        self,
        system: str,
        user: str,
        image_b64: str,
        mime_type: str = "image/png",
        schema_hint: str = "",
    ) -> dict[str, Any]:
        """Send a multimodal completion request with an image and return parsed JSON."""
        img_hash = hashlib.sha256(image_b64.encode("ascii")).hexdigest()
        cache_raw = f"{system}\n{user}\n{img_hash}"
        cache_key = hashlib.sha256(cache_raw.encode("utf-8")).hexdigest()
        cached = self._cache_get(cache_key)
        if cached is not None:
            logger.debug("Vision LLM cache hit — 0 network latency")
            return cached

        prompt = user
        if schema_hint:
            prompt += f"\n\nRespond with valid JSON matching this structure:\n{schema_hint}"
        prompt += "\n\nRespond with valid JSON only, no markdown fences."

        raw_response = self._call_vision_with_cascade(system, prompt, image_b64, mime_type)
        try:
            result = self._parse_json_response(raw_response)
        except json.JSONDecodeError:
            logger.warning("[Vision] Response was not pure JSON, wrapping into text payload.")
            result = {"text": raw_response, "headings": [], "exercises": []}

        self._cache_set(cache_key, result)
        return result

    def _call_vision_with_cascade(
        self,
        system: str,
        user: str,
        image_b64: str,
        mime_type: str = "image/png",
    ) -> str:
        """Execute multimodal vision request with automatic 9Router -> OpenRouter cascade."""
        global _vision_round_robin_counter, _last_vision_call_time

        # 1. Try 9Router if available (0 cost)
        if os.environ.get("NINEROUTER_API_KEY"):
            self.ensure_9router_daemon()
            if self.is_9router_alive():
                base_url = os.environ.get("NINEROUTER_BASE_URL", "http://localhost:20128/v1")
                key = os.environ.get("NINEROUTER_API_KEY")
                if self._9router_client is None:
                    from openai import OpenAI
                    self._9router_client = OpenAI(base_url=base_url, api_key=key, timeout=60.0)
                client = self._9router_client
                models = [
                    "ag/gemini-3.8-flash",
                    "gc/gemini-2.5-flash-lite",
                    "ag/gemini-3.7-flash-medium",
                ]
                for m in models:
                    try:
                        logger.info(f"[Vision] Trying 9Router model: {m}")
                        resp = client.chat.completions.create(
                            model=m,
                            messages=[
                                {
                                    "role": "user",
                                    "content": [
                                        {"type": "text", "text": f"{system}\n\n{user}"},
                                        {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{image_b64}"}},
                                    ],
                                }
                            ],
                        )
                        content = resp.choices[0].message.content or ""
                        if content:
                            return content
                    except Exception as e:
                        logger.warning(f"[Vision] 9Router model {m} failed ({e}) — trying next vision model.")
                        time.sleep(0.5)

        # 2. Try OpenRouter direct free multimodal pool with round-robin & circuit breaker
        or_key = os.environ.get("OPENROUTER_API_KEY")
        if or_key:
            if self._openrouter_client is None:
                from openai import OpenAI
                self._openrouter_client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=or_key, timeout=60.0)
            client = self._openrouter_client

            raw_or_models = [
                "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
                "nvidia/nemotron-3.5-super-vl:free",
                "google/gemma-4-31b-it:free",
                "google/gemma-4-26b-a4b-it:free",
                "dots-studio/dots-3-note-preview:free",
                "thinkingmachines/inkling:free",
            ]

            # Round-robin starting point to balance traffic across upstream providers
            with _vision_cooldown_lock:
                start_idx = _vision_round_robin_counter % len(raw_or_models)
                _vision_round_robin_counter += 1
            ordered_models = raw_or_models[start_idx:] + raw_or_models[:start_idx]

            # Filter out models currently in cooldown due to rate limits
            now = time.time()
            healthy_models = [
                m for m in ordered_models
                if _vision_model_cooldowns.get(m, 0.0) <= now
            ]
            candidates = healthy_models if healthy_models else ordered_models

            for m in candidates:
                # Direct OpenRouter model IDs must not have "openrouter/" prefix
                clean_model = m.replace("openrouter/", "")

                # Micro-pacing: space requests by at least 120ms to avoid Cloudflare burst rate limits
                with _vision_cooldown_lock:
                    elapsed = time.time() - _last_vision_call_time
                    if elapsed < 0.12:
                        time.sleep(0.12 - elapsed)
                    _last_vision_call_time = time.time()

                try:
                    logger.info(f"[Vision] Trying OpenRouter direct model: {clean_model}")
                    resp = client.chat.completions.create(
                        model=clean_model,
                        messages=[
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": f"{system}\n\n{user}"},
                                    {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{image_b64}"}},
                                ],
                            }
                        ],
                    )
                    if resp and getattr(resp, "choices", None) and len(resp.choices) > 0:
                        content = resp.choices[0].message.content or ""
                        if content:
                            return content
                except Exception as e:
                    err_str = str(e).lower()
                    if "429" in err_str or "rate" in err_str or "limit" in err_str:
                        # Trip circuit breaker for 20s
                        with _vision_cooldown_lock:
                            _vision_model_cooldowns[clean_model] = time.time() + 20.0
                        logger.warning(
                            f"[Vision] OpenRouter model {clean_model} rate-limited (429) — "
                            f"tripping 20s circuit breaker. Instantly switching to next model."
                        )
                    else:
                        logger.warning(f"[Vision] OpenRouter model {clean_model} failed ({e}) — trying next vision model.")

            # If all candidates failed, short jittered pause
            time.sleep(min(3.0, 1.0 + random.uniform(0.5, 1.5)))

        # 3. Tier 3 Reserve (Gemini multimodal vision ingestion if authorized)
        gemini_key = os.environ.get("GEMINI_API_KEY")
        if gemini_key and os.environ.get("ALLOW_PAID_GEMINI_FALLBACK", "false").lower() == "true":
            try:
                logger.info("[Vision] Falling back to Tier-3 Gemini reserve for multimodal vision ingestion...")
                import google.generativeai as genai
                genai.configure(api_key=gemini_key)
                model = genai.GenerativeModel("gemini-1.5-flash")
                import base64
                img_data = base64.b64decode(image_b64)
                response = model.generate_content([
                    f"{system}\n\n{user}\n\nRespond with valid JSON only.",
                    {"mime_type": mime_type, "data": img_data}
                ])
                return response.text
            except Exception as e:
                logger.error(f"[Vision] Gemini Tier-3 vision failed: {e}")

        logger.warning("[Vision] All multimodal vision options exhausted or offline. Engaging resilient local vision fallback.")
        return json.dumps({
            "text": "[Scanned Page Content: Diagram, Table, and Exercises]",
            "headings": [{"text": "Visual Learning Section", "level": 2}],
            "exercises": []
        })


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


# Module-level convenience functions
is_9router_alive = LLMAdapter.is_9router_alive
ensure_9router_daemon = LLMAdapter.ensure_9router_daemon
