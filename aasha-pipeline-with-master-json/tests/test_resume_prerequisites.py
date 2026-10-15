"""Test pipeline job resumption, prerequisite validation, and cross-mode adaptation."""

import json
import pytest
from pathlib import Path
from unittest.mock import MagicMock
from aasha.pipeline.orchestrator import Orchestrator
from aasha.config import Config
from aasha.schemas import Job, JobInput


@pytest.fixture
def temp_job(tmp_path):
    """Create a temporary job directory with a mock job.json."""
    job_id = "test-resume-job-001"
    work_dir = tmp_path / "work" / job_id
    work_dir.mkdir(parents=True)
    jobs_dir = tmp_path / "jobs"
    jobs_dir.mkdir(parents=True)

    job_input = JobInput(
        source_pdf="test.pdf",
        source_pdf_sha256="dummy_hash",
        subject="math",
        grade=8,
        mode="v5-engine",
        provider="openrouter"
    )
    job = Job(id=job_id, input=job_input, status="created")

    job_data = job.model_dump()
    (work_dir / "job.json").write_text(json.dumps(job_data), encoding="utf-8")
    (jobs_dir / f"{job_id}.json").write_text(json.dumps(job_data), encoding="utf-8")
    (work_dir / "source.pdf").write_bytes(b"%PDF-1.4 mock")

    return tmp_path, job_id, work_dir


def test_resume_missing_prerequisites_strict(temp_job):
    tmp_path, job_id, work_dir = temp_job
    cfg = Config()
    orch = Orchestrator(cfg)
    orch.work_root = tmp_path / "work"
    orch.jobs_dir = tmp_path / "jobs"

    # Attempt to resume from assemble without chapter_spec.json and lle.json in strict mode
    job = orch.run_pipeline(job_id, from_stage="assemble", auto_rewind=False)

    assert job.status == "failed"
    assert job.error_stage == "assemble"
    assert "RESUME_PREREQUISITES_MISSING" in job.error_message
    assert "chapter_spec.json" in job.error_message


def test_auto_rewind_on_missing_prerequisites(temp_job):
    tmp_path, job_id, work_dir = temp_job
    cfg = Config()
    orch = Orchestrator(cfg)
    orch.work_root = tmp_path / "work"
    orch.jobs_dir = tmp_path / "jobs"

    # Provide raw_extract.json so analyze stage prerequisites (source.pdf + raw_extract.json) are satisfied
    (work_dir / "raw_extract.json").write_text(json.dumps({"pages": []}), encoding="utf-8")

    # When resuming from design without content_map.json, auto-rewind identifies analyze as runnable
    rewind_idx = 2  # design is index 2 in STAGE_ORDER_V5
    while rewind_idx > 0:
        rewind_idx -= 1
        earlier_stage = ["ingest", "analyze", "design", "assess", "lle", "assemble", "qa", "output"][rewind_idx]
        earlier_missing = orch._validate_stage_prerequisites(earlier_stage, "v5-engine", work_dir)
        if not earlier_missing:
            break

    assert rewind_idx == 1  # analyze


def test_recover_deleted_work_dir(temp_job):
    import shutil
    tmp_path, job_id, work_dir = temp_job
    cfg = Config()
    orch = Orchestrator(cfg)
    orch.work_root = tmp_path / "work"
    orch.jobs_dir = tmp_path / "jobs"

    # Create a source PDF in a mock samples directory
    samples_dir = tmp_path / "samples"
    samples_dir.mkdir(parents=True)
    sample_pdf = samples_dir / "test.pdf"
    sample_pdf.write_bytes(b"%PDF-1.4 sample content")

    # Delete the active work directory completely
    shutil.rmtree(work_dir)
    assert not work_dir.exists()

    # Orchestrator should auto-recover work_dir from job input and samples
    job = orch._load_job(job_id)
    recovered_dir = orch._recover_work_dir_if_needed(job, job_id)

    assert recovered_dir.exists()
    assert (recovered_dir / "source.pdf").is_file()
    assert (recovered_dir / "source_manifest.json").is_file()


def test_stage_aliases(temp_job):
    from aasha.pipeline.orchestrator import STAGE_ALIASES
    assert STAGE_ALIASES["extract"] == "ingest"
    assert STAGE_ALIASES["structure"] == "analyze"
    assert STAGE_ALIASES["pedagogy"] == "design"
    assert STAGE_ALIASES["assessment"] == "assess"
    assert STAGE_ALIASES["synthesis"] == "synthesize"


def test_cross_mode_adaptation(temp_job):
    tmp_path, job_id, work_dir = temp_job
    cfg = Config()
    orch = Orchestrator(cfg)
    orch.work_root = tmp_path / "work"
    orch.jobs_dir = tmp_path / "jobs"

    # Create content_map.json and raw_extract.json in work dir
    content_map = {
        "title": "Rational Numbers",
        "concepts": [{"name": "Number Line", "description": "Graphing integers"}],
    }
    (work_dir / "content_map.json").write_text(json.dumps(content_map), encoding="utf-8")
    (work_dir / "raw_extract.json").write_text(json.dumps({"pages": []}), encoding="utf-8")

    # Call _validate_stage_prerequisites for full-synthesis design stage
    missing = orch._validate_stage_prerequisites("design", "full-synthesis", work_dir)

    # Cross-mode adapter should have created pedagogy_map.json from content_map.json
    assert (work_dir / "pedagogy_map.json").exists()
    assert "pedagogy_map.json" not in missing


def test_mode_auto_detection_and_invalid_stage(temp_job):
    tmp_path, job_id, work_dir = temp_job
    cfg = Config()
    orch = Orchestrator(cfg)
    orch.work_root = tmp_path / "work"
    orch.jobs_dir = tmp_path / "jobs"

    # Test completely invalid stage
    job = orch.run_pipeline(job_id, from_stage="totally_invalid_stage")
    assert job.status == "failed"
    assert "INVALID_STAGE" in job.error_message

    # Test auto-switching to full-synthesis when synthesize stage is requested (strict mode to verify mode before execution)
    job = orch.run_pipeline(job_id, from_stage="synthesize", auto_rewind=False)
    assert job.input.mode == "full-synthesis"


def test_find_source_pdf_in_content_pdfs(temp_job):
    tmp_path, job_id, work_dir = temp_job
    cfg = Config()
    orch = Orchestrator(cfg)
    orch.work_root = tmp_path / "work"
    orch.jobs_dir = tmp_path / "jobs"

    # Create mock content/pdfs directory structure
    content_pdfs = tmp_path / "content" / "pdfs"
    content_pdfs.mkdir(parents=True)
    real_sample = content_pdfs / "AD class 8th math rational number.pdf"
    real_sample.write_bytes(b"%PDF-1.4 rational numbers content")

    # Orchestrator should find the PDF in content/pdfs by exact name or basename
    found = orch._find_source_pdf("AD class 8th math rational number.pdf")
    assert found is not None
    assert found.name == "AD class 8th math rational number.pdf"


