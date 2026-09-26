import hashlib
import json

import pymupdf
import pytest

from aasha.config import Config, PipelineConfig
from aasha.pipeline.orchestrator import Orchestrator, validate_child_bundle_size


def make_config(tmp_path):
    return Config(
        project_root=tmp_path,
        pipeline=PipelineConfig(
            work_dir=str(tmp_path / "work"),
            output_dir=str(tmp_path / "output"),
            jobs_dir=str(tmp_path / "jobs"),
            template_path=str(tmp_path / "template.html"),
            defaults_path=str(tmp_path / "defaults.json"),
            schema_path=str(tmp_path / "schema.json"),
        ),
    )


def make_pdf(path):
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((72, 72), "A source-grounded learning chapter with enough text for extraction.")
    doc.save(path)
    doc.close()


def test_create_job_copies_source_and_records_content_hash(tmp_path):
    source = tmp_path / "book.pdf"
    make_pdf(source)
    expected_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    orchestrator = Orchestrator(make_config(tmp_path))

    job_id = orchestrator.create_job(source)

    work_dir = tmp_path / "work" / job_id
    job = json.loads((work_dir / "job.json").read_text(encoding="utf-8"))
    manifest = json.loads((work_dir / "source_manifest.json").read_text(encoding="utf-8"))
    assert (work_dir / "source.pdf").read_bytes() == source.read_bytes()
    assert job["input"]["source_pdf_sha256"] == expected_hash
    assert manifest["source_artifact_id"] == f"sha256:{expected_hash}"
    assert manifest["source_sha256"] == expected_hash
    assert manifest["byte_size"] == source.stat().st_size


def test_create_job_rejects_missing_source_before_creating_job(tmp_path):
    missing = tmp_path / "missing.pdf"
    orchestrator = Orchestrator(make_config(tmp_path))

    with pytest.raises(FileNotFoundError, match="SOURCE_FILE_MISSING"):
        orchestrator.create_job(missing)

    assert list((tmp_path / "work").iterdir()) == []


def test_create_job_rejects_non_pdf_input(tmp_path):
    source = tmp_path / "not-a-pdf.pdf"
    source.write_text("not a PDF", encoding="utf-8")
    orchestrator = Orchestrator(make_config(tmp_path))

    with pytest.raises(ValueError, match="INVALID_PDF_HEADER"):
        orchestrator.create_job(source)

    assert list((tmp_path / "work").iterdir()) == []


def test_child_bundle_size_gate_uses_exact_byte_ceiling():
    assert validate_child_bundle_size(20_971_520) == 20_971_520
    with pytest.raises(ValueError, match="BUNDLE_SIZE_EXCEEDED"):
        validate_child_bundle_size(20_971_521)
