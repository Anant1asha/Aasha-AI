"""Base agent — shared interface for all pipeline agents."""

from __future__ import annotations

import json
import logging
import time
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

from ..llm import LLMAdapter
from ..schemas.validator import ValidationResult

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """Abstract base class for all pipeline agents.

    Each agent:
    - Has a name and stage identifier
    - Receives a work directory with intermediate JSONs
    - Produces its output JSON to the same work directory
    - Logs progress to the job's log
    """

    def __init__(self, name: str, stage: str, llm: LLMAdapter | None = None):
        self.name = name
        self.stage = stage
        self.llm = llm
        self.logs: list[str] = []

    def log(self, msg: str) -> None:
        """Log a message for the job log."""
        ts = time.strftime("%H:%M:%S")
        entry = f"[{ts}] [{self.stage}] {msg}"
        self.logs.append(entry)
        logger.info(entry)

    def _read_json(self, work_dir: Path, filename: str) -> dict[str, Any]:
        path = work_dir / filename
        if not path.exists():
            raise FileNotFoundError(f"Required input file not found: {path}")
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _write_json(self, work_dir: Path, filename: str, data: Any) -> Path:
        path = work_dir / filename
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return path

    def _write_text(self, work_dir: Path, filename: str, text: str) -> Path:
        path = work_dir / filename
        with open(path, "w", encoding="utf-8") as f:
            f.write(text)
        return path

    @abstractmethod
    def run(self, work_dir: Path, context: dict[str, Any]) -> dict[str, Any]:
        """Execute this agent's stage.

        Args:
            work_dir: The job's work directory containing intermediate files
            context: Pipeline context (subject, grade, provider, etc.)

        Returns:
            Dict with at least 'output_file' pointing to the produced file,
            and any additional metadata.
        """
        ...

    @property
    def requires_llm(self) -> bool:
        """Whether this agent calls the LLM (vs deterministic)."""
        return True
