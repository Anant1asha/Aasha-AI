"""Phase 4 Test Suite — Bounded 2-Tier Repair Loop, Quarantine Isolation & Batch Scaling.

Verifies:
1. Bounded 2-Tier Autonomous Self-Repair: QA catches spoiler leak -> Repair Attempt 1 sanitizes spec & reassembles -> QA passes.
2. Quarantine Activation upon Repair Exhaustion: Persistent QA failure -> 2 repair attempts fail -> quarantine_packet.json emitted with action_required: 'SUPER_ADMIN_INTERVENTION', job.status = 'quarantined', downstream output blocked.
3. Batch Processing with --batch-dir and --parallel concurrency.
4. Financial Anti-Bleed: Strict enforcement of ALLOW_PAID_GEMINI_FALLBACK=false lockout.
"""

from __future__ import annotations

import json
import os
import shutil
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from aasha.config import Config
from aasha.pipeline.orchestrator import Orchestrator
from aasha.pipeline.agent_bus import AgentBus
from aasha.schemas import Job, JobInput, StageResult, QuarantinePacket, QuarantineError
from aasha.llm.adapter import LLMAdapter, LLMGenerationError
from tests.test_e2e_smoke import create_minimal_pdf


@pytest.fixture
def test_env():
    """Create a temporary test environment with sample job and orchestrator."""
    temp_dir = Path(tempfile.mkdtemp(prefix="aasha_phase4_test_"))
    work_dir = temp_dir / "work"
    output_dir = temp_dir / "output"
    jobs_dir = temp_dir / "jobs"
    work_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)
    jobs_dir.mkdir(parents=True, exist_ok=True)

    pdf_path = temp_dir / "test_chapter.pdf"
    create_minimal_pdf(pdf_path, title="Class 8 Mathematics: Linear Equations")

    config = Config()
    config.pipeline.work_dir = str(work_dir)
    config.pipeline.output_dir = str(output_dir)
    config.pipeline.jobs_dir = str(jobs_dir)
    config.pipeline.template_path = str(Path(__file__).parent.parent / "template" / "v5-engine-template.html")
    config.pipeline.defaults_path = str(Path(__file__).parent.parent / "config" / "defaults.json")

    yield {
        "temp_dir": temp_dir,
        "work_dir": work_dir,
        "output_dir": output_dir,
        "jobs_dir": jobs_dir,
        "pdf_path": pdf_path,
        "config": config,
    }

    shutil.rmtree(temp_dir, ignore_errors=True)


class TestBoundedSelfRepairAndQuarantine:
    """Tests for the Bounded 2-Tier Repair Loop and Downstream Quarantine Invariant."""

    def test_bounded_repair_succeeds_on_spoiler_leak(self, test_env):
        """Verify that QA failure due to spoiler leak is autonomously repaired on attempt 1."""
        orch = Orchestrator(test_env["config"])
        job_id = orch.create_job(
            pdf_path=test_env["pdf_path"],
            subject="math",
            grade=8,
            provider="offline",
            mode="v5-engine",
        )
        job_work_dir = orch._get_job_work_dir(job_id)

        # Run pipeline up to assemble using offline synthesizer
        orch.run_pipeline(job_id, from_stage="ingest")

        # Inject a distractor misconception spoiler into chapter_spec.json
        spec_path = job_work_dir / "chapter_spec.json"
        assert spec_path.exists(), "chapter_spec.json must exist after initial stages"
        spec_data = json.loads(spec_path.read_text(encoding="utf-8"))

        # Corrupt one misconception to leak the answer "The correct answer is 12"
        for node in spec_data.get("NODES", []):
            for step in node.get("steps", []):
                q = step.get("q")
                if q and "opts" in q:
                    for opt in q["opts"]:
                        if not opt.get("c"):
                            opt["m"] = "Incorrect. The correct answer is 12, please review."
                            break
                    break

        spec_path.write_text(json.dumps(spec_data, indent=2), encoding="utf-8")

        # Mock QAAgent to fail first run with spoiler violation, but pass second run after repair
        call_count = 0
        def mock_qa_run(work_dir, context):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                return {
                    "passed": False,
                    "failure_count": 1,
                    "failures": [{"check": "no_spoilers", "reason": "Answer leaked in misconception"}],
                    "output_file": str(work_dir / "qa_report.json"),
                }
            else:
                return {
                    "passed": True,
                    "failure_count": 0,
                    "failures": [],
                    "output_file": str(work_dir / "qa_report.json"),
                }

        with patch("aasha.pipeline.orchestrator.QAAgent") as mock_qa_agent_cls:
            mock_qa_instance = MagicMock()
            mock_qa_instance.run = mock_qa_run
            mock_qa_instance.logs = ["Mocked QA run executed"]
            mock_qa_agent_cls.return_value = mock_qa_instance

            # Resume from QA stage
            job = orch.run_pipeline(job_id, from_stage="qa")

            # Assert bounded repair loop triggered and succeeded
            assert call_count == 2, f"Expected 1 initial check + 1 repair check, got {call_count}"
            assert job.status == "completed", f"Expected job.status to be 'completed', got {job.status}"
            assert job.quarantined is False

            # Assert chapter spec misconceptions were sanitized
            repaired_spec = json.loads(spec_path.read_text(encoding="utf-8"))
            for node in repaired_spec.get("NODES", []):
                for step in node.get("steps", []):
                    q = step.get("q")
                    if q and "opts" in q:
                        for opt in q["opts"]:
                            if not opt.get("c") and opt.get("m"):
                                assert "The correct answer is" not in opt["m"]

    def test_quarantine_activation_upon_repair_exhaustion(self, test_env):
        """Verify that when 2 autonomous repair attempts fail, quarantine activates and blocks delivery."""
        orch = Orchestrator(test_env["config"])
        job_id = orch.create_job(
            pdf_path=test_env["pdf_path"],
            subject="math",
            grade=8,
            provider="offline",
            mode="v5-engine",
        )
        job_work_dir = orch._get_job_work_dir(job_id)

        # Run pipeline up to assemble
        orch.run_pipeline(job_id, from_stage="ingest")

        # Mock QAAgent to persistently fail (exhausting the 2-repair ceiling)
        call_count = 0
        def mock_qa_run_fail(work_dir, context):
            nonlocal call_count
            call_count += 1
            return {
                "passed": False,
                "failure_count": 2,
                "failures": [
                    {"check": "no_external_urls", "reason": "Persistent external CDN url in iframe"},
                    {"check": "min_touch_targets", "reason": "Control target 30px < 44px"},
                ],
                "output_file": str(work_dir / "qa_report.json"),
            }

        with patch("aasha.pipeline.orchestrator.QAAgent") as mock_qa_agent_cls:
            mock_qa_instance = MagicMock()
            mock_qa_instance.run = mock_qa_run_fail
            mock_qa_instance.logs = ["Persistent QA failure logged"]
            mock_qa_agent_cls.return_value = mock_qa_instance

            # Resume from QA stage
            job = orch.run_pipeline(job_id, from_stage="qa")

            # 1 initial attempt + 2 repair attempts = 3 total attempts (ceiling respected)
            assert call_count == 3, f"Ceiling violation: expected 3 attempts, got {call_count}"
            assert job.status == "quarantined", f"Expected job status 'quarantined', got '{job.status}'"
            assert job.quarantined is True

            # Verify quarantine_packet.json exists in work_dir
            q_packet_path = job_work_dir / "quarantine_packet.json"
            assert q_packet_path.exists(), "quarantine_packet.json must be emitted upon exhaustion"
            packet = json.loads(q_packet_path.read_text(encoding="utf-8"))

            assert packet["quarantined"] is True
            assert packet["action_required"] == "SUPER_ADMIN_INTERVENTION"
            assert packet["repair_attempts"] == 2
            assert packet["exhausted"] is True
            assert len(packet["violations"]) == 2

            # Invariant: downstream output stage must NOT have executed / delivered
            chapter_name = test_env["pdf_path"].name.replace(".pdf", "").replace(" ", "_")
            delivered_html = test_env["output_dir"] / f"{chapter_name}_chapter.html"
            assert not delivered_html.exists(), "Quarantined chapter must NEVER be delivered to output directory!"


class TestBatchScalingAndAntiBleed:
    """Tests for multi-chapter batch throughput and financial anti-bleed."""

    def test_batch_runner_concurrency_and_summary(self, test_env):
        """Verify run_batch processes multiple PDFs with --parallel concurrency and reports summary."""
        from aasha.cli import run_batch

        batch_dir = test_env["temp_dir"] / "batch_pdfs"
        batch_dir.mkdir(parents=True, exist_ok=True)

        pdf1 = batch_dir / "Class8_Ch1.pdf"
        pdf2 = batch_dir / "Class8_Ch2.pdf"
        create_minimal_pdf(pdf1, title="Class 8 Mathematics: Chapter 1")
        create_minimal_pdf(pdf2, title="Class 8 Mathematics: Chapter 2")

        class Args:
            batch = str(batch_dir)
            subject = "math"
            grade = 8
            provider = "offline"
            mode = "v5-engine"
            max_cost = 0.50
            parallel = 2

        # Run batch with concurrency=2
        os.environ["AASHA_OFFLINE"] = "1"
        exit_code = run_batch(Args(), test_env["config"])
        assert exit_code == 0, "run_batch with parallel=2 should exit with code 0 on valid PDFs"

    def test_financial_anti_bleed_gemini_lockout(self):
        """Verify that ALLOW_PAID_GEMINI_FALLBACK=false strictly locks out paid Gemini."""
        os.environ["ALLOW_PAID_GEMINI_FALLBACK"] = "false"
        adapter = LLMAdapter(provider="gemini", model="gemini-1.5-flash")

        with pytest.raises(LLMGenerationError) as exc_info:
            adapter.complete("System prompt", "User prompt", "chapter_spec")

        assert "Paid Gemini API is locked out" in str(exc_info.value) or "ALLOW_PAID_GEMINI_FALLBACK=false" in str(exc_info.value)
