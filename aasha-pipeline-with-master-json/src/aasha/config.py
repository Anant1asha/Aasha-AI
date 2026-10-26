"""Configuration loader for the Aasha pipeline.

Reads config.yaml from the project root (or AASHA_CONFIG env var).
API keys are always read from environment variables, never from config.
"""

from __future__ import annotations

import os
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml


@dataclass
class LLMProviderConfig:
    model: str
    temperature: float = 0.0
    fallback_models: list[str] = field(default_factory=list)


@dataclass
class LLMConfig:
    default_provider: str = "openrouter"
    providers: dict[str, LLMProviderConfig] = field(default_factory=dict)
    cache_dir: str = "./.llm_cache"
    max_retries: int = 3
    backoff_base: float = 1.0
    backoff_max: float = 30.0


@dataclass
class PipelineConfig:
    work_dir: str = "./work"
    output_dir: str = "./output"
    jobs_dir: str = "./jobs"
    qa_runner: str = "node ./qa/run_qa.js"
    template_path: str = "./template/v5-engine-template.html"
    defaults_path: str = "./config/defaults.json"
    schema_path: str = "./schema/chapter_spec.schema.json"


@dataclass
class StorageConfig:
    type: str = "local"
    path: str = "./jobs"
    retention_days: int = 30


@dataclass
class WebConfig:
    host: str = "127.0.0.1"
    port: int = 5000
    debug: bool = False


@dataclass
class Config:
    llm: LLMConfig = field(default_factory=LLMConfig)
    pipeline: PipelineConfig = field(default_factory=PipelineConfig)
    storage: StorageConfig = field(default_factory=StorageConfig)
    web: WebConfig = field(default_factory=WebConfig)
    project_root: Path = field(default_factory=lambda: Path("."))

    @staticmethod
    def _bootstrap_credentials(config_path: Path | None = None) -> None:
        """Load API keys from ~/.aasha/config.json or nearby .env files into os.environ if missing."""
        # 1. Local BYOK Vault (~/.aasha/config.json)
        vault_path = Path.home() / ".aasha" / "config.json"
        if vault_path.exists():
            try:
                with open(vault_path, "r", encoding="utf-8") as f:
                    vault_data = json.load(f)
                    if "OPENROUTER_API_KEY" not in os.environ and vault_data.get("openrouter_key"):
                        os.environ["OPENROUTER_API_KEY"] = vault_data["openrouter_key"]
                    if "GEMINI_API_KEY" not in os.environ and vault_data.get("gemini_key"):
                        os.environ["GEMINI_API_KEY"] = vault_data["gemini_key"]
            except Exception:
                pass

        # 2. Nearby .env files (Aasha-AI/.env, monorepo root)
        search_dirs = [
            Path("."),
            Path(".."),
            Path("../.."),
            Path(__file__).resolve().parent.parent.parent.parent,
        ]
        for d in search_dirs:
            env_file = d / ".env"
            if env_file.exists():
                try:
                    with open(env_file, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if not line or line.startswith("#") or "=" not in line:
                                continue
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip("'\"")
                            if k and v:
                                if k in ("OPENROUTER_API_KEY", "OPENROUTER_KEY") and "OPENROUTER_API_KEY" not in os.environ:
                                    os.environ["OPENROUTER_API_KEY"] = v
                                elif k not in os.environ:
                                    os.environ[k] = v
                except Exception:
                    pass

    @classmethod
    def load(cls, config_path: str | Path | None = None) -> "Config":
        """Load configuration from YAML file and bootstrap credentials."""
        cls._bootstrap_credentials()

        pkg_root = Path(__file__).resolve().parent.parent.parent
        if config_path is None:
            env_cfg = os.environ.get("AASHA_CONFIG")
            if env_cfg and Path(env_cfg).exists():
                config_path = Path(env_cfg)
            elif Path("config.yaml").exists():
                config_path = Path("config.yaml")
            elif (pkg_root / "config.yaml").exists():
                config_path = pkg_root / "config.yaml"
            else:
                config_path = Path("config.yaml")
        else:
            config_path = Path(config_path)

        if not config_path.exists():
            if (pkg_root / "config.yaml").exists():
                config_path = pkg_root / "config.yaml"
            else:
                return cls(project_root=pkg_root)

        with open(config_path, "r", encoding="utf-8") as f:
            raw: dict[str, Any] = yaml.safe_load(f) or {}

        llm_raw = raw.get("llm", {})
        providers = {}
        for name, pcfg in (llm_raw.get("providers") or {}).items():
            providers[name] = LLMProviderConfig(
                model=pcfg.get("model", ""),
                temperature=pcfg.get("temperature", 0.0),
                fallback_models=pcfg.get("fallback_models", []),
            )

        return cls(
            llm=LLMConfig(
                default_provider=llm_raw.get("default_provider", "openrouter"),
                providers=providers,
                cache_dir=llm_raw.get("cache_dir", "./.llm_cache"),
                max_retries=llm_raw.get("max_retries", 3),
                backoff_base=llm_raw.get("backoff_base", 1.0),
                backoff_max=llm_raw.get("backoff_max", 30.0),
            ),
            pipeline=PipelineConfig(
                work_dir=raw.get("pipeline", {}).get("work_dir", "./work"),
                output_dir=raw.get("pipeline", {}).get("output_dir", "./output"),
                jobs_dir=raw.get("pipeline", {}).get("jobs_dir", "./jobs"),
                qa_runner=raw.get("pipeline", {}).get("qa_runner", "node ./qa/run_qa.js"),
                template_path=raw.get("pipeline", {}).get("template_path", "./template/v5-engine-template.html"),
                defaults_path=raw.get("pipeline", {}).get("defaults_path", "./config/defaults.json"),
                schema_path=raw.get("pipeline", {}).get("schema_path", "./schema/chapter_spec.schema.json"),
            ),
            storage=StorageConfig(
                type=raw.get("storage", {}).get("type", "local"),
                path=raw.get("storage", {}).get("path", "./jobs"),
                retention_days=raw.get("storage", {}).get("retention_days", 30),
            ),
            web=WebConfig(
                host=raw.get("web", {}).get("host", "127.0.0.1"),
                port=raw.get("web", {}).get("port", 5000),
                debug=raw.get("web", {}).get("debug", False),
            ),
            project_root=config_path.parent,
        )

    def get_api_key(self, provider: str) -> str | None:
        """Get the API key for a provider from environment variables or vault."""
        env_vars = {
            "openai": "OPENAI_API_KEY",
            "gemini": "GEMINI_API_KEY",
            "anthropic": "ANTHROPIC_API_KEY",
            "openrouter": "OPENROUTER_API_KEY",
        }
        env_var = env_vars.get(provider.lower())
        if env_var and os.environ.get(env_var):
            return os.environ.get(env_var)
        
        # Check ~/.aasha/config.json vault
        vault_path = Path.home() / ".aasha" / "config.json"
        if vault_path.exists():
            try:
                with open(vault_path, "r", encoding="utf-8") as f:
                    vault_data = json.load(f)
                    if provider.lower() == "openrouter" and vault_data.get("openrouter_key"):
                        return vault_data["openrouter_key"]
                    if provider.lower() == "gemini" and vault_data.get("gemini_key"):
                        return vault_data["gemini_key"]
            except Exception:
                pass
        return None

    def template_full_path(self) -> Path:
        p = Path(self.pipeline.template_path)
        if not p.is_absolute():
            cand = (self.project_root / p).resolve()
            if cand.exists():
                return cand
            pkg_cand = (Path(__file__).resolve().parent.parent.parent / p).resolve()
            if pkg_cand.exists():
                return pkg_cand
            return cand
        return p

    def defaults_full_path(self) -> Path:
        p = Path(self.pipeline.defaults_path)
        if not p.is_absolute():
            cand = (self.project_root / p).resolve()
            if cand.exists():
                return cand
            pkg_cand = (Path(__file__).resolve().parent.parent.parent / p).resolve()
            if pkg_cand.exists():
                return pkg_cand
            return cand
        return p

    def schema_full_path(self) -> Path:
        p = Path(self.pipeline.schema_path)
        if not p.is_absolute():
            cand = (self.project_root / p).resolve()
            if cand.exists():
                return cand
            pkg_cand = (Path(__file__).resolve().parent.parent.parent / p).resolve()
            if pkg_cand.exists():
                return pkg_cand
            return cand
        return p


_config_cache: Config | None = None


def get_config() -> Config:
    global _config_cache
    if _config_cache is None:
        _config_cache = Config.load()
    return _config_cache
