"""AASHA AIOS Layer-3 Product Pipeline Orchestrator Bridge.

Canonical Routing:
  - Deterministic PDF Harvesting & Ingestion:
      Delegated to `aasha-pipeline-with-master-json` (PyMuPDF & structured extraction).
  - Chapter Assembly, Section 24 Contracts & Gamified V6 Compilation:
      Delegated to the canonical TypeScript V6 architecture (`packages/v6-engine` + `packages/canonical-ir`).

This replaces the legacy severed Python stub with an authoritative, cross-runtime execution bridge.
"""

from __future__ import annotations

import json
import logging
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

# Root resolution
SCRIPT_DIR = Path(__file__).resolve().parent
AIOS_ROOT = SCRIPT_DIR.parents[2]  # Aasha-AI/Aasha-AIOS
AASHA_AI_ROOT = AIOS_ROOT.parent    # Aasha-AI
PIPELINE_ROOT = AASHA_AI_ROOT / "aasha-pipeline-with-master-json"
V6_ENGINE_ROOT = AASHA_AI_ROOT / "packages" / "v6-engine"


class CanonicalPipelineOrchestrator:
    """Authoritative bridge connecting AIOS Layer-3 to the canonical execution planes."""

    def __init__(self, work_dir: Optional[Path] = None):
        self.work_dir = work_dir or (AASHA_AI_ROOT / "work")
        self.work_dir.mkdir(parents=True, exist_ok=True)

    def harvest_pdf(
        self,
        pdf_path: str | Path,
        subject: str = "math",
        grade: int = 8,
        mode: str = "v2",
    ) -> Dict[str, Any]:
        """Delegate deterministic PDF text and asset extraction to `aasha-pipeline-with-master-json`."""
        pdf_path = Path(pdf_path).resolve()
        if not pdf_path.exists():
            raise FileNotFoundError(f"Source PDF not found: {pdf_path}")

        logger.info("Routing PDF ingestion to aasha-pipeline-with-master-json: %s", pdf_path)
        cmd = [
            sys.executable,
            "-m",
            "aasha.cli",
            "--pdf",
            str(pdf_path),
            "--subject",
            subject,
            "--grade",
            str(grade),
            "--mode",
            mode,
        ]

        result = subprocess.run(
            cmd,
            cwd=str(PIPELINE_ROOT),
            capture_output=True,
            text=True,
            check=False,
        )

        return {
            "plane": "Python Harvester (aasha-pipeline-with-master-json)",
            "exit_code": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
        }

    def compile_chapter_v6(
        self,
        contract_path: str | Path,
    ) -> Dict[str, Any]:
        """Delegate chapter compilation to canonical TypeScript V6 compiler."""
        contract_path = Path(contract_path).resolve()
        if not contract_path.exists():
            raise FileNotFoundError(f"Section 24 contract not found: {contract_path}")

        logger.info("Routing chapter compilation to canonical V6 Engine: %s", contract_path)
        cmd = [
            "npx",
            "tsx",
            str(V6_ENGINE_ROOT / "compile_beta_chapter.ts"),
            str(contract_path),
        ]

        result = subprocess.run(
            cmd,
            cwd=str(AASHA_AI_ROOT),
            capture_output=True,
            text=True,
            shell=sys.platform == "win32",
            check=False,
        )

        return {
            "plane": "TypeScript V6 Engine (packages/v6-engine)",
            "exit_code": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
        }


def get_orchestrator(work_dir: Optional[Path] = None) -> CanonicalPipelineOrchestrator:
    """Factory returning the canonical pipeline orchestrator bridge."""
    return CanonicalPipelineOrchestrator(work_dir)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("AASHA AIOS Layer-3 Pipeline Orchestrator Bridge initialized.")
    print(f"  Python PDF Harvester: {PIPELINE_ROOT}")
    print(f"  TypeScript V6 Engine:  {V6_ENGINE_ROOT}")
