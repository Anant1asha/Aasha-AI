"""Configuration loader for the Aasha pipeline.

Reads config.yaml from the project root (or AASHA_CONFIG env var).
API keys are always read from environment variables, never from config.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml


@dataclass
class LLMProviderConfig:
    model: str
    temperature: float = 0.0


@dataclass
class LLMConfig:
    default_provider: str = "openai"
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

    @classmethod
    def load(cls, config_path: str | Path | None = None) -> "Config":
        """Load configuration from YAML file."""
        if config_path is None:
            config_path = os.environ.get("AASHA_CONFIG", "config.yaml")
        config_path = Path(config_path)

        if not config_path.exists():
            return cls(project_root=Path("."))

        with open(config_path, "r", encoding="utf-8") as f:
            raw: dict[str, Any] = yaml.safe_load(f) or {}

        llm_raw = raw.get("llm", {})
        providers = {}
        for name, pcfg in (llm_raw.get("providers") or {}).items():
            providers[name] = LLMProviderConfig(
                model=pcfg.get("model", ""),
                temperature=pcfg.get("temperature", 0.0),
            )

        return cls(
            llm=LLMConfig(
                default_provider=llm_raw.get("default_provider", "openai"),
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
        """Get the API key for a provider from environment variables."""
        env_vars = {
            "openai": "OPENAI_API_KEY",
            "gemini": "GEMINI_API_KEY",
            "anthropic": "ANTHROPIC_API_KEY",
        }
        env_var = env_vars.get(provider.lower())
        if env_var:
            return os.environ.get(env_var)
        return None

    def template_full_path(self) -> Path:
        p = Path(self.pipeline.template_path)
        if not p.is_absolute():
            p = self.project_root / p
        return p

    def defaults_full_path(self) -> Path:
        p = Path(self.pipeline.defaults_path)
        if not p.is_absolute():
            p = self.project_root / p
        return p

    def schema_full_path(self) -> Path:
        p = Path(self.pipeline.schema_path)
        if not p.is_absolute():
            p = self.project_root / p
        return p


_config_cache: Config | None = None


def get_config() -> Config:
    global _config_cache
    if _config_cache is None:
        _config_cache = Config.load()
    return _config_cache
