"""
orchestrator.py — the agent. Runs the 9-stage pipeline end to end, tracks job
state in job.json, and supports resuming from any stage so a human's edit to
an intermediate JSON file costs $0 in LLM calls to re-apply.

State machine (Aasha_MVP_6_Documents.md §3.6):
    queued -> ingesting -> ingested -> analyzing -> analyzed -> designing ->
    designed -> assessing -> assessed -> lle -> lle_done -> assembling ->
    assembled -> qa_running -> qa_passed -> completed
                             -> qa_failed
    any stage -> failed (on unrecoverable error)
"""
from __future__ import annotations

import json
import subprocess
import sys
import time
import uuid
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

from llm_adapter import get_provider, LLMGenerationError  # noqa: E402
from validators import validate_chapter_spec, format_report  # noqa: E402
from ingest.ingest import ingest_pdf, load_raw_extract_stub  # noqa: E402
from analyze.analyze import analyze  # noqa: E402
from design.design import design  # noqa: E402
from assess.assess import assess  # noqa: E402
from lle.lle import generate_lle  # noqa: E402
from assemble.assemble import assemble_with_defaults  # noqa: E402

STAGES = ["ingest", "analyze", "design", "assess", "lle", "assemble", "qa"]


class PipelineError(Exception):
    def __init__(self, stage: str, message: str):
        self.stage = stage
        self.message = message
        super().__init__(f"[{stage}] {message}")


class Job:
    """One chapter-build job. Owns a work directory and job.json."""

    def __init__(self, work_dir: str, job_id: str | None = None):
        self.job_id = job_id or str(uuid.uuid4())
        self.dir = Path(work_dir) / self.job_id
        self.dir.mkdir(parents=True, exist_ok=True)
        self.state = {
            "id": self.job_id, "status": "queued", "created_at": time.time(),
            "stages": {}, "error_stage": None, "error_message": None,
        }
        self._save()

    @classmethod
    def resume(cls, work_dir: str, job_id: str) -> "Job":
        job = cls.__new__(cls)
        job.job_id = job_id
        job.dir = Path(work_dir) / job_id
        job.state = json.loads((job.dir / "job.json").read_text(encoding="utf-8"))
        return job

    def _save(self) -> None:
        (self.dir / "job.json").write_text(
            json.dumps(self.state, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    def set_status(self, status: str) -> None:
        self.state["status"] = status
        self._save()

    def stage_done(self, stage: str, meta: dict | None = None) -> None:
        self.state["stages"][stage] = {"status": "done", "at": time.time(), **(meta or {})}
        self._save()

    def fail(self, stage: str, message: str) -> None:
        self.state["status"] = "failed"
        self.state["error_stage"] = stage
        self.state["error_message"] = message
        self.state["stages"][stage] = {"status": "failed", "at": time.time(), "error": message}
        self._save()

    def path(self, filename: str) -> Path:
        return self.dir / filename


def _load_defaults() -> dict:
    return json.loads((REPO_ROOT / "config" / "defaults.json").read_text(encoding="utf-8"))


def run_pipeline(pdf_path: str | None, subject: str, grade: int, title: str,
                  storage_key: str, work_dir: str = "./work", output_dir: str = "./output",
                  provider_name: str = "mock", model: str = "mock-1",
                  from_stage: str | None = None, job_id: str | None = None,
                  stub_body_text: str | None = None) -> Job:
    """Run the pipeline from `from_stage` (default: the beginning) to completion.

    If pdf_path is None, stub_body_text is used with ingest.load_raw_extract_stub
    so the pipeline is runnable without a real PDF (offline demo / CI).
    """
    job = Job.resume(work_dir, job_id) if (job_id and from_stage) else Job(work_dir, job_id)
    adapter = get_provider(provider_name, model, cache_dir=str(Path(work_dir) / ".llm_cache"))
    defaults = _load_defaults()

    start_idx = STAGES.index(from_stage) if from_stage else 0

    try:
        # --- Stage 1: ingest ---
        if start_idx <= 0:
            job.set_status("ingesting")
            if pdf_path:
                raw_extract = ingest_pdf(pdf_path)
            else:
                raw_extract = load_raw_extract_stub(subject, grade, title, stub_body_text or "")
            job.path("raw_extract.json").write_text(
                json.dumps(raw_extract, ensure_ascii=False, indent=2), encoding="utf-8")
            job.stage_done("ingest", {"pages": len(raw_extract["pages"])})
            job.set_status("ingested")
        else:
            raw_extract = json.loads(job.path("raw_extract.json").read_text(encoding="utf-8"))

        # --- Stage 2: analyze ---
        if start_idx <= 1:
            job.set_status("analyzing")
            content_map = analyze(raw_extract, subject, grade, adapter)
            job.path("content_map.json").write_text(
                json.dumps(content_map, ensure_ascii=False, indent=2), encoding="utf-8")
            job.stage_done("analyze", {"concepts": len(content_map.get("concepts", []))})
            job.set_status("analyzed")
        else:
            content_map = json.loads(job.path("content_map.json").read_text(encoding="utf-8"))

        # --- Stage 3: design ---
        if start_idx <= 2:
            job.set_status("designing")
            chapter_spec = design(content_map, title, subject, grade, storage_key, adapter)
            job.path("chapter_spec.json").write_text(
                json.dumps(chapter_spec, ensure_ascii=False, indent=2), encoding="utf-8")
            job.stage_done("design", {"nodes": len(chapter_spec.get("NODES", []))})
            job.set_status("designed")
        else:
            chapter_spec = json.loads(job.path("chapter_spec.json").read_text(encoding="utf-8"))

        # --- Stage 4: assess ---
        if start_idx <= 3:
            job.set_status("assessing")
            chapter_spec, warnings = assess(chapter_spec, adapter)
            chapter_spec.setdefault("BADGES", defaults["BADGES_TEMPLATE"])
            job.path("chapter_spec.json").write_text(
                json.dumps(chapter_spec, ensure_ascii=False, indent=2), encoding="utf-8")
            job.stage_done("assess", {"warnings": warnings})
            job.set_status("assessed")
        else:
            chapter_spec = json.loads(job.path("chapter_spec.json").read_text(encoding="utf-8"))

        # Validate BEFORE spending anything on LLE/assembly — a $0 catch point.
        errors = validate_chapter_spec(chapter_spec)
        if errors:
            job.path("validation_report.txt").write_text(format_report(errors), encoding="utf-8")
            raise PipelineError("design", f"{len(errors)} validation error(s) — see validation_report.txt")

        # --- Stage 5: lle ---
        if start_idx <= 4:
            job.set_status("lle")
            lle = generate_lle(chapter_spec, defaults["WM"], defaults["CONN"], adapter)
            job.path("lle.json").write_text(
                json.dumps(lle, ensure_ascii=False, indent=2), encoding="utf-8")
            job.stage_done("lle", {"net_new": lle["net_new_count"], "reused": lle["reused_count"]})
            job.set_status("lle_done")
        else:
            lle = json.loads(job.path("lle.json").read_text(encoding="utf-8"))

        # --- Stage 7: assemble ---
        if start_idx <= 5:
            job.set_status("assembling")
            html = assemble_with_defaults(chapter_spec, lle, defaults)
            job.path("chapter.html").write_text(html, encoding="utf-8")
            job.stage_done("assemble", {"size_bytes": len(html.encode("utf-8"))})
            job.set_status("assembled")

        # --- Stage 8: qa ---
        job.set_status("qa_running")
        qa_report_path = job.path("qa_report.json")
        result = subprocess.run(
            ["node", str(REPO_ROOT / "pipeline" / "qa" / "run_qa.js"),
             str(job.path("chapter.html")), "--out", str(qa_report_path)],
            capture_output=True, text=True,
        )
        qa_report = json.loads(qa_report_path.read_text(encoding="utf-8"))
        job.stage_done("qa", {"passed": qa_report["passed"],
                               "failures": len(qa_report["failures"])})

        if not qa_report["passed"]:
            job.set_status("qa_failed")
            job.state["qa_failures"] = qa_report["failures"]
            job._save()
            return job

        job.set_status("qa_passed")

        # --- Stage 9: output ---
        out_dir = Path(output_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / f"{storage_key}.html").write_text(
            job.path("chapter.html").read_text(encoding="utf-8"), encoding="utf-8")
        (out_dir / f"{storage_key}.spec.json").write_text(
            json.dumps(chapter_spec, ensure_ascii=False, indent=2), encoding="utf-8")
        job.state["output"] = {
            "html": str(out_dir / f"{storage_key}.html"),
            "spec": str(out_dir / f"{storage_key}.spec.json"),
            "llm_calls": adapter.total_calls, "cache_hits": adapter.cache_hits,
        }
        job.set_status("completed")
        return job

    except PipelineError as e:
        job.fail(e.stage, e.message)
        return job
    except LLMGenerationError as e:
        job.fail(job.state["status"], str(e))
        return job
    except Exception as e:  # noqa: BLE001 — top-level agent boundary, must not crash silently
        job.fail(job.state.get("status", "unknown"), f"{type(e).__name__}: {e}")
        return job
