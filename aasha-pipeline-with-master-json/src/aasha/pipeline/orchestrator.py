"""Multi-agent orchestrator — manages the pipeline job lifecycle.

Sequences the 6 agents through 9 stages, tracks job state, estimates cost,
and supports resume from any stage via --from-stage.
"""

from __future__ import annotations

import json
import hashlib
import logging
import shutil
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ..agents import (
    AnalysisAgent,
    AssessmentAgent,
    DesignAgent,
    IngestAgent,
    LLEAgent,
    QAAgent,
)
from ..assemble import HTMLAssembler
from ..config import Config
from ..llm import LLMAdapter, LLMGenerationError
from ..schemas import STAGE_ORDER, Job, StageResult, generate_supplementary_assessments, enrich_content_map
from ..schemas.validator import validate_chapter_spec
from .agent_bus import AgentBus

logger = logging.getLogger(__name__)
MAX_CHILD_HTML5_BUNDLE_BYTES = 20_971_520


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def validate_child_bundle_size(size_bytes: int) -> int:
    if size_bytes < 0:
        raise ValueError("INVALID_BUNDLE_SIZE")
    if size_bytes > MAX_CHILD_HTML5_BUNDLE_BYTES:
        raise ValueError(
            f"BUNDLE_SIZE_EXCEEDED: {size_bytes} > {MAX_CHILD_HTML5_BUNDLE_BYTES} bytes"
        )
    return size_bytes


STAGE_ALIASES = {
    "extract": "ingest",
    "structure": "analyze",
    "pedagogy": "design",
    "assessment": "assess",
    "synthesis": "synthesize",
}


class Orchestrator:
    """Coordinates the multi-agent pipeline.

    Pipeline stages:
      1. ingest   → raw_extract.json     (IngestAgent, no LLM)
      2. analyze  → content_map.json     (AnalysisAgent, LLM)
      3. design   → chapter_spec.json    (DesignAgent, LLM)
      4. assess   → chapter_spec.json     (AssessmentAgent, LLM, updates spec)
      5. lle      → lle.json             (LLEAgent, LLM)
      6. assemble → chapter.html         (HTMLAssembler, no LLM)
      7. qa       → qa_report.json       (QAAgent, no LLM)
      8. output   → copies to output dir  (deterministic)
    """

    def __init__(self, config: Config):
        self.config = config
        self.template_path = config.template_full_path()
        self.defaults_path = config.defaults_full_path()
        self.schema_path = config.schema_full_path()
        self.work_root = Path(config.pipeline.work_dir)
        self.output_dir = Path(config.pipeline.output_dir)
        self.jobs_dir = Path(config.pipeline.jobs_dir)
        self.work_root.mkdir(parents=True, exist_ok=True)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.jobs_dir.mkdir(parents=True, exist_ok=True)

    def _create_llm(self, provider: str, temperature: float = 0.0) -> LLMAdapter:
        """Create an LLM adapter for the given provider.

        For OpenRouter, passes fallback_models from config to enable the
        Tier-1 anti-bleed free-model cascade (3s backoff on 429/404).
        """
        provider_config = self.config.llm.providers.get(provider, None)
        model = provider_config.model if provider_config else ""
        # Extract fallback cascade list (OpenRouter only)
        fallback_models: list[str] = []
        if provider == "openrouter" and provider_config:
            fallback_models = getattr(provider_config, "fallback_models", []) or []
        return LLMAdapter(
            provider=provider,
            model=model,
            temperature=temperature,
            cache_dir=self.config.llm.cache_dir,
            max_retries=self.config.llm.max_retries,
            backoff_base=self.config.llm.backoff_base,
            backoff_max=self.config.llm.backoff_max,
            rate_limit_delay=getattr(self.config.llm, "rate_limit_delay", 3.0),
            fallback_models=fallback_models,
        )

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def create_job(
        self,
        pdf_path: str | Path,
        subject: str = "math",
        grade: int = 4,
        provider: str = "openai",
        mode: str = "v5-engine",
    ) -> str:
        """Create a new job and return the job ID."""
        from ..schemas import STAGE_ORDER_V5, STAGE_ORDER_FS
        
        pdf_path = Path(pdf_path)
        if not pdf_path.is_file():
            raise FileNotFoundError(f"SOURCE_FILE_MISSING: {pdf_path}")
        with pdf_path.open("rb") as source:
            if source.read(5) != b"%PDF-":
                raise ValueError(f"INVALID_PDF_HEADER: {pdf_path.name}")

        source_sha256 = _sha256_file(pdf_path)
        source_pdf_bytes = pdf_path.stat().st_size
        job_id = str(uuid.uuid4())
        work_dir = self.work_root / job_id
        work_dir.mkdir(parents=True, exist_ok=False)

        # Hash the copied input too, so a change during copy cannot be hidden.
        copied_pdf = work_dir / "source.pdf"
        shutil.copyfile(str(pdf_path), str(copied_pdf))
        copied_sha256 = _sha256_file(copied_pdf)
        if copied_sha256 != source_sha256:
            raise ValueError("SOURCE_HASH_MISMATCH: PDF changed while creating the job copy")

        source_manifest = {
            "manifest_version": "1.0.0",
            "source_artifact_id": f"sha256:{source_sha256}",
            "source_sha256": source_sha256,
            "source_file": pdf_path.name,
            "byte_size": source_pdf_bytes,
            "page_count": None,
            "created_at": self._now_iso(),
            "lineage_status": "SOURCE_HASHED_PAGE_EXTRACTION_PENDING",
        }
        (work_dir / "source_manifest.json").write_text(
            json.dumps(source_manifest, ensure_ascii=False, indent=2), encoding="utf-8"
        )

        stage_order = STAGE_ORDER_FS if mode == "full-synthesis" else STAGE_ORDER_V5

        job = Job(
            id=job_id,
            status="queued",
            created_at=self._now_iso(),
            updated_at=self._now_iso(),
            input={
                "source_pdf": pdf_path.name,
                "source_pdf_sha256": source_sha256,
                "source_pdf_bytes": source_pdf_bytes,
                "subject": subject,
                "grade": grade,
                "provider": provider,
                "model": "",
                "mode": mode,
            },
            stages=[
                StageResult(name=stage, status="pending")
                for stage in stage_order
            ],
        )

        self._save_job(job, work_dir)
        bus = AgentBus(work_dir)
        bus.publish("job.created", {
            "job_id": job_id,
            "subject": subject,
            "grade": grade,
            "provider": provider,
            "mode": mode
        })
        return job_id

    def _save_job(self, job: Job, work_dir: Path) -> None:
        """Save job.json to both work dir and jobs dir."""
        job.updated_at = self._now_iso()
        job_data = job.model_dump()

        # Save to work dir
        with open(work_dir / "job.json", "w", encoding="utf-8") as f:
            json.dump(job_data, f, ensure_ascii=False, indent=2)

        # Save to jobs dir
        job_file = self.jobs_dir / f"{job.id}.json"
        with open(job_file, "w", encoding="utf-8") as f:
            json.dump(job_data, f, ensure_ascii=False, indent=2)

    def _update_stage(self, job: Job, stage: str, status: str, duration: float = 0, output: str = "", error: str = ""):
        for s in job.stages:
            if s.name == stage:
                s.status = status
                s.duration_s = duration
                s.output = output
                s.error = error
                break

    def _get_job_work_dir(self, job_id: str) -> Path:
        return self.work_root / job_id

    def _find_source_pdf(self, source_pdf_name: str, source_sha256: str = "", exclude_dir: Path | None = None) -> Path | None:
        """Find a source PDF across content/pdfs, samples, sister work dirs, and common disk paths."""
        candidates = []
        if source_pdf_name:
            candidates.extend([
                Path(source_pdf_name),
                Path("content/pdfs") / source_pdf_name,
                Path("content/pdfs") / Path(source_pdf_name).name,
                Path("../content/pdfs") / Path(source_pdf_name).name,
                Path("../../content/pdfs") / Path(source_pdf_name).name,
                self.work_root.parent / "content" / "pdfs" / Path(source_pdf_name).name,
                self.work_root.parent.parent / "content" / "pdfs" / Path(source_pdf_name).name,
                Path("c:/Users/admin/Downloads/NGO AI LLM/Aasha-AI/content/pdfs") / Path(source_pdf_name).name,
                Path("samples") / source_pdf_name,
                Path("samples") / Path(source_pdf_name).name,
                Path("../samples") / Path(source_pdf_name).name,
                self.work_root.parent / "samples" / Path(source_pdf_name).name,
            ])

        # Scan all PDFs in content/pdfs directories
        content_dirs = [
            Path("content/pdfs"),
            Path("../content/pdfs"),
            Path("../../content/pdfs"),
            self.work_root.parent / "content" / "pdfs",
            self.work_root.parent.parent / "content" / "pdfs",
            Path("c:/Users/admin/Downloads/NGO AI LLM/Aasha-AI/content/pdfs"),
            Path("samples"),
            Path("../samples"),
            self.work_root.parent / "samples",
        ]
        for cdir in content_dirs:
            if cdir.is_dir():
                for p in cdir.glob("*.pdf"):
                    candidates.append(p)

        # Scan sister work directories
        if self.work_root.exists():
            for other_dir in self.work_root.iterdir():
                if other_dir.is_dir() and (exclude_dir is None or other_dir != exclude_dir) and (other_dir / "source.pdf").is_file():
                    candidates.append(other_dir / "source.pdf")

        # First priority: match exact SHA-256
        if source_sha256:
            for cand in candidates:
                try:
                    if cand.is_file() and _sha256_file(cand) == source_sha256:
                        return cand
                except Exception:
                    continue

        # Second priority: match filename (case-insensitive)
        if source_pdf_name:
            target_name = Path(source_pdf_name).name.lower()
            for cand in candidates:
                try:
                    if cand.is_file() and cand.name.lower() == target_name:
                        return cand
                except Exception:
                    continue

        return None

    def _recover_work_dir_if_needed(self, job: Job, job_id: str) -> Path:
        """Attempt to restore a deleted or missing work directory from available sources."""
        work_dir = self.work_root / job_id
        if work_dir.exists():
            return work_dir

        source_pdf_name = ""
        source_sha256 = ""
        if hasattr(job, "input") and job.input:
            source_pdf_name = getattr(job.input, "source_pdf", "") or ""
            source_sha256 = getattr(job.input, "source_pdf_sha256", "") or ""

        found_pdf = self._find_source_pdf(source_pdf_name, source_sha256)
        if not found_pdf:
            raise FileNotFoundError(
                f"WORK_DIR_DELETED_UNRECOVERABLE: Work directory for job '{job_id}' was deleted and source PDF "
                f"'{source_pdf_name}' could not be located in content/pdfs, samples, or disk to reconstruct it."
            )

        work_dir.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(str(found_pdf), str(work_dir / "source.pdf"))
        manifest = {
            "manifest_version": "1.0.0",
            "source_artifact_id": f"sha256:{source_sha256 or _sha256_file(found_pdf)}",
            "source_sha256": source_sha256 or _sha256_file(found_pdf),
            "source_file": Path(source_pdf_name).name if source_pdf_name else found_pdf.name,
            "byte_size": found_pdf.stat().st_size,
            "page_count": None,
            "created_at": self._now_iso(),
            "lineage_status": "SOURCE_HASHED_RESTORED_FROM_BACKUP",
        }
        (work_dir / "source_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        self._save_job(job, work_dir)
        logger.info(f"Auto-recovery: Restored missing work directory for job '{job_id}' from '{found_pdf}'.")
        return work_dir

    def _recover_source_pdf_if_needed(self, job: Job, work_dir: Path) -> bool:
        """Attempt to recover missing source.pdf in an existing work directory."""
        target = work_dir / "source.pdf"
        if target.is_file():
            return True
        source_pdf_name = ""
        source_sha256 = ""
        if hasattr(job, "input") and job.input:
            source_pdf_name = getattr(job.input, "source_pdf", "") or ""
            source_sha256 = getattr(job.input, "source_pdf_sha256", "") or ""

        found_pdf = self._find_source_pdf(source_pdf_name, source_sha256, exclude_dir=work_dir)
        if found_pdf:
            shutil.copyfile(str(found_pdf), str(target))
            logger.info(f"Auto-recovery: Restored missing source.pdf from '{found_pdf}'.")
            return True
        return False

    def _load_job(self, job_id: str) -> Job:
        job_file = self.jobs_dir / f"{job_id}.json"
        if not job_file.exists():
            # Check work dir
            work_dir = self._get_job_work_dir(job_id)
            job_file = work_dir / "job.json"
        with open(job_file, "r", encoding="utf-8") as f:
            return Job.model_validate(json.load(f))

    def _validate_stage_prerequisites(self, stage: str, mode: str, work_dir: Path) -> list:
        """Validate that all prerequisite artifacts exist before starting a stage.
        If cross-mode artifacts exist (e.g. content_map.json for a pedagogy_map.json requirement),
        it attempts automatic non-destructive synthesis/adaptation first.
        Returns a list of missing required artifact filenames.
        """
        # Cross-mode adapter 1: If pedagogy_map.json is needed, but content_map.json exists
        if stage in ("design", "assess", "synthesize") and not (work_dir / "pedagogy_map.json").exists() and (work_dir / "content_map.json").exists():
            try:
                from ..exercise import ExerciseExtractor
                extractor = ExerciseExtractor()
                raw_path = work_dir / "raw_extract.json"
                if raw_path.exists():
                    raw_data = json.loads(raw_path.read_text(encoding="utf-8"))
                    ex_dicts = [ex.to_dict() for ex in extractor.extract(raw_data)]
                else:
                    ex_dicts = []
                content_map = json.loads((work_dir / "content_map.json").read_text(encoding="utf-8"))
                pedagogy_map = enrich_content_map(content_map, ex_dicts)
                (work_dir / "pedagogy_map.json").write_text(json.dumps(pedagogy_map, indent=2), encoding="utf-8")
                logger.info("Cross-mode adapter: Synthesized pedagogy_map.json from content_map.json")
            except Exception as e:
                logger.warning(f"Could not adapt content_map.json to pedagogy_map.json: {e}")

        # Cross-mode adapter 2: If content_map.json is needed, but pedagogy_map.json exists
        if stage in ("design", "assess") and not (work_dir / "content_map.json").exists() and (work_dir / "pedagogy_map.json").exists():
            try:
                pedagogy_map = json.loads((work_dir / "pedagogy_map.json").read_text(encoding="utf-8"))
                (work_dir / "content_map.json").write_text(json.dumps(pedagogy_map, indent=2), encoding="utf-8")
                logger.info("Cross-mode adapter: Synthesized content_map.json from pedagogy_map.json")
            except Exception as e:
                logger.warning(f"Could not adapt pedagogy_map.json to content_map.json: {e}")

        # Cross-mode adapter 3: If assessment_suite.json is needed, but assessment_bank.json exists
        if stage == "synthesize" and not (work_dir / "assessment_suite.json").exists() and (work_dir / "assessment_bank.json").exists():
            try:
                bank = json.loads((work_dir / "assessment_bank.json").read_text(encoding="utf-8"))
                suite = {"warmup": bank.get("warmup", []), "deep_dive": bank.get("deep_dive", []), "boss": bank.get("boss", [])}
                (work_dir / "assessment_suite.json").write_text(json.dumps(suite, indent=2), encoding="utf-8")
                logger.info("Cross-mode adapter: Adapted assessment_bank.json to assessment_suite.json")
            except Exception:
                pass

        if mode == "full-synthesis":
            prereq_map = {
                "ingest": ["source.pdf"],
                "analyze": ["source.pdf", "raw_extract.json"],
                "design": ["pedagogy_map.json"],
                "assess": ["pedagogy_map.json", "experience_plan.json"],
                "synthesize": ["pedagogy_map.json", "experience_plan.json", "assessment_suite.json"],
                "qa": ["chapter.html"],
                "output": ["chapter.html"],
            }
        else:
            prereq_map = {
                "ingest": ["source.pdf"],
                "analyze": ["source.pdf", "raw_extract.json"],
                "design": ["content_map.json"],
                "assess": ["content_map.json"],
                "lle": ["chapter_spec.json"],
                "assemble": ["chapter_spec.json", "lle.json"],
                "qa": ["chapter.html"],
                "output": ["chapter.html"],
            }
        required_files = prereq_map.get(stage, [])
        return [f for f in required_files if not (work_dir / f).exists()]

    def run_pipeline(
        self,
        job_id: str,
        from_stage: str | None = None,
        log_callback=None,
        max_cost: float = 0.50,
        mode: str | None = None,
        auto_rewind: bool = True,
    ) -> Job:
        """Run the full pipeline for a job.

        Args:
            job_id: The job ID to run
            from_stage: Resume from this stage (skip earlier stages)
            log_callback: Optional callback for log messages
            max_cost: Maximum allowed cost in USD
            mode: Optional pipeline execution mode override
            auto_rewind: Automatically rewind to earliest runnable stage if prerequisites are missing

        Returns:
            Updated Job object
        """
        if from_stage:
            from_stage = STAGE_ALIASES.get(from_stage, from_stage)

        job = self._load_job(job_id)
        work_dir = self._recover_work_dir_if_needed(job, job_id)
        self._recover_source_pdf_if_needed(job, work_dir)

        json_log_path = work_dir / "pipeline.log"
        
        def log(msg: str, **kwargs):
            logger.info(msg)
            if log_callback:
                log_callback(msg)
            
            log_entry = {
                "timestamp": self._now_iso(),
                "message": msg,
                **kwargs
            }
            with open(json_log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry) + "\n")

        from ..schemas import STAGE_ORDER_V5, STAGE_ORDER_FS

        # Mode handling & auto-detection
        if mode:
            job.input.mode = mode
        elif from_stage:
            if from_stage == "synthesize" and job.input.mode != "full-synthesis":
                log(f"Stage 'synthesize' belongs to full-synthesis mode; auto-switching job mode to full-synthesis")
                job.input.mode = "full-synthesis"
            elif from_stage in ("assemble", "lle") and job.input.mode != "v5-engine":
                log(f"Stage '{from_stage}' belongs to v5-engine mode; auto-switching job mode to v5-engine")
                job.input.mode = "v5-engine"

        context = {
            "pdf_path": str(work_dir / "source.pdf"),
            "source_pdf_sha256": job.input.source_pdf_sha256,
            "subject": job.input.subject,
            "grade": job.input.grade,
            "provider": job.input.provider,
        }

        stage_order = STAGE_ORDER_FS if job.input.mode == "full-synthesis" else STAGE_ORDER_V5

        # Determine starting stage
        start_idx = 0
        if from_stage:
            if from_stage in stage_order:
                start_idx = stage_order.index(from_stage)
                log(f"Resuming from stage: {from_stage} (mode: {job.input.mode})")
            else:
                other_mode = "full-synthesis" if job.input.mode == "v5-engine" else "v5-engine"
                other_order = STAGE_ORDER_FS if other_mode == "full-synthesis" else STAGE_ORDER_V5
                if from_stage in other_order:
                    error_msg = (
                        f"MODE_MISMATCH: Stage '{from_stage}' belongs to '{other_mode}' mode, but job '{job_id}' is in '{job.input.mode}' mode. "
                        f"To resume with this stage, pass '--mode {other_mode}'."
                    )
                else:
                    error_msg = (
                        f"INVALID_STAGE: Unknown stage '{from_stage}'. "
                        f"Valid stages for mode '{job.input.mode}' are: {', '.join(stage_order)}."
                    )
                log(f"  ERROR: {error_msg}")
                self._update_stage(job, from_stage, "failed", error=error_msg)
                job.status = "failed"
                job.error_stage = from_stage
                job.error_message = error_msg
                self._save_job(job, work_dir)
                bus = AgentBus(work_dir)
                bus.publish("stage.failed", {"stage": from_stage, "error": error_msg})
                return job

        # Validate prerequisite artifacts before resuming from a later stage
        if from_stage and start_idx > 0:
            stage_to_resume = stage_order[start_idx]
            missing_prereqs = self._validate_stage_prerequisites(stage_to_resume, job.input.mode, work_dir)
            if missing_prereqs:
                if auto_rewind:
                    log(f"  NOTICE: Missing required prerequisite artifact(s) for stage '{stage_to_resume}': {', '.join(missing_prereqs)}")
                    # Find earliest preceding stage that needs to run
                    rewind_idx = start_idx
                    while rewind_idx > 0:
                        rewind_idx -= 1
                        earlier_stage = stage_order[rewind_idx]
                        earlier_missing = self._validate_stage_prerequisites(earlier_stage, job.input.mode, work_dir)
                        if not earlier_missing:
                            break

                    earliest_stage = stage_order[rewind_idx]
                    earliest_missing = self._validate_stage_prerequisites(earliest_stage, job.input.mode, work_dir)
                    if earliest_missing and "source.pdf" in earliest_missing:
                        if self._recover_source_pdf_if_needed(job, work_dir):
                            earliest_missing = self._validate_stage_prerequisites(earliest_stage, job.input.mode, work_dir)

                    if earliest_missing:
                        error_msg = (
                            f"RESUME_PREREQUISITES_MISSING: Cannot resume from stage '{stage_to_resume}'. "
                            f"Missing required artifact(s): {', '.join(missing_prereqs)}, and auto-rewind to '{earliest_stage}' "
                            f"failed due to missing {', '.join(earliest_missing)}. "
                            f"Earlier stages in job '{job_id}' must complete before resuming from '{stage_to_resume}'."
                        )
                        log(f"  ERROR: {error_msg}")
                        self._update_stage(job, stage_to_resume, "failed", error=error_msg)
                        job.status = "failed"
                        job.error_stage = stage_to_resume
                        job.error_message = error_msg
                        self._save_job(job, work_dir)
                        bus = AgentBus(work_dir)
                        bus.publish("stage.failed", {"stage": stage_to_resume, "error": error_msg})
                        return job

                    rewound_stage = stage_order[rewind_idx]
                    log(f"  AUTO-REWIND: Automatically rewinding execution from '{stage_to_resume}' to '{rewound_stage}' to backfill missing prerequisites seamlessly.")
                    start_idx = rewind_idx
                else:
                    error_msg = (
                        f"RESUME_PREREQUISITES_MISSING: Cannot resume from stage '{stage_to_resume}'. "
                        f"Missing required artifact(s): {', '.join(missing_prereqs)}. "
                        f"Earlier stages in job '{job_id}' must complete before resuming from '{stage_to_resume}'."
                    )
                    log(f"  ERROR: {error_msg}")
                    self._update_stage(job, stage_to_resume, "failed", error=error_msg)
                    job.status = "failed"
                    job.error_stage = stage_to_resume
                    job.error_message = error_msg
                    self._save_job(job, work_dir)
                    bus = AgentBus(work_dir)
                    bus.publish("stage.failed", {"stage": stage_to_resume, "error": error_msg})
                    return job

        job.status = "running"
        self._save_job(job, work_dir)
        bus = AgentBus(work_dir)

        total_cost = 0.0

        try:
            for i in range(start_idx, len(stage_order)):
                stage = stage_order[i]
                log(f"[{i+1}/{len(stage_order)}] {stage}...")
                
                if total_cost > max_cost:
                    error_msg = f"Max cost exceeded: ${total_cost:.4f} > ${max_cost:.4f}"
                    log(f"  ERROR: {error_msg}")
                    self._update_stage(job, stage, "failed", error=error_msg)
                    job.status = "failed"
                    job.error_stage = stage
                    job.error_message = error_msg
                    job.cost_usd = total_cost
                    self._save_job(job, work_dir)
                    bus.publish("stage.failed", {"stage": stage, "error": error_msg})
                    return job

                self._update_stage(job, stage, "running")
                job.status = stage
                self._save_job(job, work_dir)
                bus.publish("stage.started", {"stage": stage})

                stage_start = time.time()
                stage_result = {}

                try:
                    if stage == "ingest":
                        agent = IngestAgent(llm=self.llm)
                        stage_result = agent.run(work_dir, context)
                        if stage_result.get("error"):
                            raise ValueError(f"SOURCE_EXTRACTION_FAILED: {stage_result['error']}")
                        if stage_result.get("source_sha256") != job.input.source_pdf_sha256:
                            raise ValueError("SOURCE_HASH_MISMATCH: ingestion output is not bound to the job source")
                        manifest_path = work_dir / "source_manifest.json"
                        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
                        raw_extract_path = work_dir / "raw_extract.json"
                        manifest.update({
                            "page_count": stage_result.get("page_count"),
                            "raw_extract_sha256": _sha256_file(raw_extract_path),
                            "lineage_status": "SOURCE_HASHED_PAGES_REFERENCED",
                        })
                        manifest_path.write_text(
                            json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
                        )
                        for entry in agent.logs:
                            log(f"  {entry}")

                    elif stage == "analyze":
                        llm = self._create_llm(context["provider"])
                        agent = AnalysisAgent(llm)
                        stage_result = agent.run(work_dir, context)
                        total_cost += llm.cost_estimate
                        job.costs["AnalysisAgent"] = job.costs.get("AnalysisAgent", 0) + llm.cost_estimate
                        for entry in agent.logs:
                            log(f"  {entry}")

                        if job.input.mode == "full-synthesis":
                            # Stage 2 of full-synthesis: Analyze + Extract Exercises → pedagogy_map.json
                            # IngestAgent output (raw_extract.json) + ExerciseExtractor + AnalysisAgent output
                            from ..exercise import ExerciseExtractor
                            extractor = ExerciseExtractor()
                            raw_extract = json.loads((work_dir / "raw_extract.json").read_text(encoding="utf-8"))
                            exercises = extractor.extract(raw_extract)
                            ex_dicts = [ex.to_dict() for ex in exercises]

                            content_map = json.loads((work_dir / "content_map.json").read_text(encoding="utf-8"))
                            pedagogy_map = enrich_content_map(content_map, ex_dicts)

                            with open(work_dir / "pedagogy_map.json", "w", encoding="utf-8") as f:
                                json.dump(pedagogy_map, f, indent=2)
                            stats = pedagogy_map.get("exercise_stats", {})
                            stage_result = {"output_file": str(work_dir / "pedagogy_map.json")}
                            log(f"  Created pedagogy_map.json: {stats.get('total', 0)} exercises, "
                                f"types={stats.get('by_type', {})}")
                            bus.publish("concept.identified", {"count": len(pedagogy_map.get("concepts", []))})
                            bus.publish("exercise.extracted", {"count": stats.get("total", 0)})

                    elif stage == "design":
                        if job.input.mode == "full-synthesis":
                            # Stage 3 of full-synthesis: Design Interactions → experience_plan.json
                            # Query PluginRegistry.find_best() for each concept
                            from ..plugins import create_default_registry
                            from ..plugins.base import InteractionRequest
                            registry = create_default_registry()
                            pedagogy_map = json.loads((work_dir / "pedagogy_map.json").read_text(encoding="utf-8"))

                            experience_plan = {"concepts": [], "plugins_used": []}
                            plugins_used_set = set()
                            for concept in pedagogy_map.get("concepts", []):
                                req = InteractionRequest(
                                    concept=concept.get("name", ""),
                                    subject=context["subject"],
                                    grade=context["grade"],
                                    suggested_model=concept.get("suggested_model", ""),
                                    context=concept.get("summary", ""),
                                )
                                best_plugin = registry.find_best(req)
                                plugin_name = best_plugin.metadata.name if best_plugin else None
                                if plugin_name:
                                    plugins_used_set.add(plugin_name)
                                experience_plan["concepts"].append({
                                    "name": concept.get("name", ""),
                                    "summary": concept.get("summary", ""),
                                    "key_ideas": concept.get("key_ideas", []),
                                    "difficulty": concept.get("difficulty", "medium"),
                                    "plugin": plugin_name,
                                })
                            experience_plan["plugins_used"] = sorted(plugins_used_set)

                            with open(work_dir / "experience_plan.json", "w", encoding="utf-8") as f:
                                json.dump(experience_plan, f, indent=2)
                            stage_result = {"output_file": str(work_dir / "experience_plan.json")}
                            log(f"  Created experience_plan.json: {len(experience_plan['concepts'])} concepts, "
                                f"plugins={experience_plan['plugins_used']}")
                            bus.publish("interaction.assigned", {"concepts": len(experience_plan["concepts"])})
                        else:
                            import concurrent.futures
                            
                            def run_design_agent():
                                llm = self._create_llm(context["provider"])
                                agent = DesignAgent(llm)
                                res = agent.run(work_dir, context)
                                return "DesignAgent", llm.cost_estimate, agent.logs, res
                                
                            def run_lle_agent():
                                llm = self._create_llm(context["provider"], temperature=0.2)
                                agent = LLEAgent(llm, str(self.defaults_path))
                                res = agent.run(work_dir, context)
                                return "LLEAgent", llm.cost_estimate, agent.logs, res

                            # LLEAgent reads chapter_spec.json, which DesignAgent writes.
                            # Running them concurrently races on that file: LLE can start
                            # before the spec exists and abort the stage. Design must finish
                            # (and flush its output) before LLE is submitted.
                            with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
                                future_d = executor.submit(run_design_agent)
                                agent_name_d, cost_d, logs_d, res_d = future_d.result()

                                future_l = executor.submit(run_lle_agent)
                                agent_name_l, cost_l, logs_l, res_l = future_l.result()
                                
                            total_cost += cost_d + cost_l
                            job.costs[agent_name_d] = job.costs.get(agent_name_d, 0) + cost_d
                            job.costs[agent_name_l] = job.costs.get(agent_name_l, 0) + cost_l
                            
                            for entry in logs_d:
                                log(f"  [Design] {entry}")
                            for entry in logs_l:
                                log(f"  [LLE] {entry}")
                                
                            stage_result = res_d

                    elif stage == "assess":
                        if job.input.mode == "full-synthesis":
                            # Stage 4 of full-synthesis: Generate Assessments → assessment_suite.json
                            # Convert all extracted exercises into 3 gamified levels + generate supplementary
                            pedagogy_map = json.loads((work_dir / "pedagogy_map.json").read_text(encoding="utf-8"))
                            exercises = pedagogy_map.get("extracted_exercises", [])
                            concepts = pedagogy_map.get("concepts", [])

                            from ..exercise import ExerciseExtractor
                            extractor = ExerciseExtractor()

                            assessment_suite: dict[str, list] = {
                                "warmup": [],
                                "deep_dive": [],
                                "boss": [],
                            }

                            for ex in exercises:
                                level = extractor.to_assessment_level(ex.get("difficulty", "recall"))
                                assessment_suite[level].append(ex)

                            # Generate supplementary assessments to fill level gaps
                            assessment_suite = generate_supplementary_assessments(
                                assessment_suite,
                                subject=context["subject"],
                                concepts=concepts,
                            )

                            # Map TEAS nodes and assign node_id
                            nodes_map = []
                            for i, concept in enumerate(concepts):
                                nodes_map.append({"node_id": f"node_{i+1}", "concept": concept.get("name")})

                            for level in ("warmup", "deep_dive", "boss"):
                                for i, ex in enumerate(assessment_suite[level]):
                                    if not ex.get("node_id"):
                                        node_idx = (i % len(concepts)) + 1 if concepts else 1
                                        ex["node_id"] = f"node_{node_idx}"

                            manifest = {
                                "subject": context["subject"],
                                "grade": context["grade"],
                                "nodes": nodes_map,
                                "dependencies": [{"from": f"node_{i}", "to": f"node_{i+1}"} for i in range(1, len(nodes_map))]
                            }
                            with open(work_dir / "chapter_manifest.json", "w", encoding="utf-8") as f:
                                json.dump(manifest, f, indent=2)

                            # Add summary stats
                            assessment_suite["total_xp"] = sum(
                                ex.get("xp", 5) for level_list in assessment_suite.values()
                                if isinstance(level_list, list) for ex in level_list
                            )
                            assessment_suite["level_counts"] = {
                                level: len(assessment_suite.get(level, []))
                                for level in ("warmup", "deep_dive", "boss")
                            }

                            with open(work_dir / "assessment_suite.json", "w", encoding="utf-8") as f:
                                json.dump(assessment_suite, f, indent=2)
                            counts = assessment_suite["level_counts"]
                            stage_result = {"output_file": str(work_dir / "assessment_suite.json")}
                            log(f"  Created assessment_suite.json: warmup={counts['warmup']}, "
                                f"deep_dive={counts['deep_dive']}, boss={counts['boss']}")
                            bus.publish("assessment.generated", {"total_xp": assessment_suite.get("total_xp", 0)})
                        else:
                            llm = self._create_llm(context["provider"])
                            agent = AssessmentAgent(llm)
                            stage_result = agent.run(work_dir, context)
                            total_cost += llm.cost_estimate
                            job.costs["AssessmentAgent"] = job.costs.get("AssessmentAgent", 0) + llm.cost_estimate
                            for entry in agent.logs:
                                log(f"  {entry}")

                    elif stage == "synthesize":
                        from ..synthesis.code_synthesizer import FrontendCodeSynthesizer
                        agent = FrontendCodeSynthesizer()
                        stage_result = agent.run(work_dir, context)
                        for entry in agent.logs:
                            log(f"  {entry}")

                    elif stage == "lle":
                        if (work_dir / "lle.json").exists():
                            log("  LLE already generated in parallel during Design stage.")
                            stage_result = {"output_file": str(work_dir / "lle.json")}
                        else:
                            llm = self._create_llm(context["provider"], temperature=0.2)
                            agent = LLEAgent(llm, str(self.defaults_path))
                            stage_result = agent.run(work_dir, context)
                            total_cost += llm.cost_estimate
                            job.costs["LLEAgent"] = job.costs.get("LLEAgent", 0) + llm.cost_estimate
                            for entry in agent.logs:
                                log(f"  {entry}")

                    elif stage == "assemble":
                        spec_path = work_dir / "chapter_spec.json"
                        
                        if spec_path.exists():
                            from ..schemas.validator import validate_chapter_spec
                            spec_data = json.loads(spec_path.read_text(encoding="utf-8"))
                            val_result = validate_chapter_spec(spec_data)
                            if not val_result.valid:
                                error_msgs = "; ".join(val_result.errors)
                                raise ValueError(f"Strict JSON schema validation failed: {error_msgs}")

                        assembler = HTMLAssembler(str(self.template_path))
                        lle_path = work_dir / "lle.json"
                        html_path = work_dir / "chapter.html"
                        assembler.assemble_to_file(
                            spec_path, lle_path, html_path, str(self.defaults_path)
                        )
                        stage_result = {"output_file": str(html_path)}
                        log(f"  Assembled chapter.html ({html_path.stat().st_size / 1024:.0f} KB)")

                    elif stage == "qa":
                        html_path = work_dir / "chapter.html"
                        if not html_path.is_file():
                            raise FileNotFoundError("CHILD_BUNDLE_MISSING: chapter.html")
                        bundle_size_bytes = validate_child_bundle_size(html_path.stat().st_size)
                        qa_runner = self.config.pipeline.qa_runner
                        agent = QAAgent(qa_runner)
                        stage_result = agent.run(work_dir, context)
                        stage_result["bundle_size_bytes"] = bundle_size_bytes
                        for entry in agent.logs:
                            log(f"  {entry}")
                        
                        bus.publish("qa.result", {"passed": stage_result.get("passed", False)})

                        # Check if QA passed
                        if not stage_result.get("passed", False):
                            job.status = "qa_failed"
                            job.error_stage = "qa"
                            self._update_stage(
                                job, stage, "failed",
                                duration=time.time() - stage_start,
                                output=stage_result.get("output_file", ""),
                                error=f"QA failed with {stage_result.get('failure_count', 0)} failures"
                            )
                            job.cost_usd = total_cost
                            self._save_job(job, work_dir)
                            bus.publish("stage.failed", {"stage": stage, "error": f"QA failed with {stage_result.get('failure_count', 0)} failures"})
                            log(f"  QA FAILED — chapter not delivered")
                            return job

                    elif stage == "output":
                        # Copy to output directory
                        html_src = work_dir / "chapter.html"
                        spec_src = work_dir / "chapter_spec.json"

                        chapter_name = job.input.source_pdf.replace(".pdf", "").replace(" ", "_")
                        html_out = self.output_dir / f"{chapter_name}_chapter.html"
                        spec_out = self.output_dir / f"{chapter_name}_spec.json"

                        if html_src.exists():
                            shutil.copy(str(html_src), str(html_out))
                            job.outputs["html"] = str(html_out)
                        if spec_src.exists():
                            shutil.copy(str(spec_src), str(spec_out))
                            job.outputs["spec"] = str(spec_out)

                        # Full-synthesis mode: also copy intermediate JSONs
                        if job.input.mode == "full-synthesis":
                            for json_name in ("pedagogy_map.json", "experience_plan.json", "assessment_suite.json", "chapter_manifest.json"):
                                json_src = work_dir / json_name
                                if json_src.exists():
                                    json_out = self.output_dir / f"{chapter_name}_{json_name}"
                                    shutil.copy(str(json_src), str(json_out))
                                    job.outputs[json_name] = str(json_out)

                        stage_result = {"html": str(html_out), "spec": str(spec_out)}
                        log(f"  Output: {html_out.name}")

                    duration = time.time() - stage_start
                    self._update_stage(
                        job, stage, "done",
                        duration=duration,
                        output=stage_result.get("output_file", ""),
                    )
                    job.cost_usd = total_cost
                    self._save_job(job, work_dir)
                    bus.publish("stage.completed", {
                        "stage": stage,
                        "duration": duration,
                        "output": stage_result.get("output_file", "")
                    })

                    log(f"  Done ({duration:.1f}s)")

                except LLMGenerationError as e:
                    log(f"  ERROR: {e}")
                    self._update_stage(job, stage, "failed", error=str(e))
                    job.status = "failed"
                    job.error_stage = stage
                    job.error_message = str(e)
                    job.cost_usd = total_cost
                    self._save_job(job, work_dir)
                    bus.publish("stage.failed", {"stage": stage, "error": str(e)})
                    return job

                except Exception as e:
                    log(f"  ERROR: {e}")
                    import traceback
                    traceback.print_exc()
                    self._update_stage(job, stage, "failed", error=str(e))
                    job.status = "failed"
                    job.error_stage = stage
                    job.error_message = str(e)
                    job.cost_usd = total_cost
                    self._save_job(job, work_dir)
                    bus.publish("stage.failed", {"stage": stage, "error": str(e)})
                    return job

            # All stages complete
            job.status = "completed"
            job.cost_usd = total_cost
            self._save_job(job, work_dir)
            log(f"Pipeline complete. Cost: ${total_cost:.4f}")

            return job

        except Exception as e:
            log(f"Pipeline error: {e}")
            job.status = "failed"
            job.error_stage = "pipeline"
            job.error_message = str(e)
            job.cost_usd = total_cost
            self._save_job(job, work_dir)
            return job

    def list_jobs(self) -> list[dict[str, Any]]:
        """List all jobs."""
        jobs = []
        for job_file in sorted(self.jobs_dir.glob("*.json"), reverse=True):
            try:
                with open(job_file, "r", encoding="utf-8") as f:
                    job_data = json.load(f)
                jobs.append({
                    "id": job_data.get("id", ""),
                    "source_pdf": job_data.get("input", {}).get("source_pdf", ""),
                    "status": job_data.get("status", ""),
                    "created_at": job_data.get("created_at", ""),
                    "cost_usd": job_data.get("cost_usd", 0),
                })
            except Exception:
                continue
        return jobs

    def get_job(self, job_id: str) -> Job | None:
        """Get a job by ID."""
        try:
            return self._load_job(job_id)
        except Exception:
            return None

    def get_job_work_dir(self, job_id: str) -> Path:
        """Get the work directory for a job."""
        return self._get_job_work_dir(job_id)
