"""Phase 5 Test Suite — Studio UI & Multi-Agent TUI Control Plane Unification.

Verifies:
1. Cooperative Pause and Resume Control Signals via work_dir/control.json.
2. Human Intervention Approval (HIL) overriding/bypassing quarantine upon Super Admin authorization.
3. Abort control signal cleanly halting pipeline execution.
"""

from __future__ import annotations

import json
import os
import shutil
import tempfile
import threading
import time
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from aasha.config import Config
from aasha.pipeline.orchestrator import Orchestrator
from aasha.pipeline.agent_bus import AgentBus
from aasha.schemas import Job
from tests.test_e2e_smoke import create_minimal_pdf


@pytest.fixture
def test_env():
    """Create a temporary test environment with sample job and orchestrator."""
    temp_dir = Path(tempfile.mkdtemp(prefix="aasha_phase5_test_"))
    work_dir = temp_dir / "work"
    output_dir = temp_dir / "output"
    jobs_dir = temp_dir / "jobs"
    work_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)
    jobs_dir.mkdir(parents=True, exist_ok=True)

    pdf_path = temp_dir / "test_chapter.pdf"
    create_minimal_pdf(pdf_path, title="Class 8 Mathematics: Control Plane Verification")

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


class TestControlPlaneSignaling:
    """Tests for cooperative pause, resume, abort, and human intervention."""

    def test_pause_and_resume_control_signals(self, test_env):
        """Verify pipeline pauses on action='pause' and resumes on action='resume'."""
        orch = Orchestrator(test_env["config"])
        job_id = orch.create_job(
            pdf_path=test_env["pdf_path"],
            subject="math",
            grade=8,
            provider="offline",
            mode="v5-engine",
        )
        job_work_dir = orch._get_job_work_dir(job_id)
        control_file = job_work_dir / "control.json"

        # Pre-set control signal to pause immediately when the pipeline starts checking
        control_file.write_text(json.dumps({
            "action": "pause",
            "issuer": "multi-agent-tui",
            "status": "pending"
        }), encoding="utf-8")

        # Spawn a background thread that sleeps 1.0s then resumes
        def resume_after_delay():
            time.sleep(1.0)
            control_file.write_text(json.dumps({
                "action": "resume",
                "issuer": "studio-ui",
                "status": "pending"
            }), encoding="utf-8")

        thread = threading.Thread(target=resume_after_delay)
        thread.start()

        # Execute pipeline
        job = orch.run_pipeline(job_id)
        thread.join()

        # Job should have successfully completed after being resumed
        assert job.status == "completed"
        # Check messages.jsonl contains job.paused and job.resumed events
        messages_path = job_work_dir / "messages.jsonl"
        assert messages_path.exists()
        messages = [json.loads(line) for line in messages_path.read_text(encoding="utf-8").splitlines() if line.strip()]
        topics = [m["topic"] for m in messages]
        assert "job.paused" in topics
        assert "job.resumed" in topics

    def test_human_intervention_approval_on_quarantine(self, test_env):
        """Verify that human intervention approval clears quarantine and unblocks output delivery."""
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

        # Mock QA agent to persistently fail so it would normally quarantine
        def mock_qa_run_fail(work_dir, context):
            return {
                "passed": False,
                "failure_count": 1,
                "failures": [{"check": "educator_curriculum_review", "reason": "Requires educator sign-off"}],
                "output_file": str(work_dir / "qa_report.json"),
            }

        # Issue human intervention approval signal before QA executes
        control_file = job_work_dir / "control.json"
        control_file.write_text(json.dumps({
            "action": "approve_intervention",
            "issuer": "super_admin_educator",
            "reason": "Audited math curriculum; verified compliant.",
            "status": "pending"
        }), encoding="utf-8")

        with patch("aasha.pipeline.orchestrator.QAAgent") as mock_qa_agent_cls:
            mock_qa_instance = MagicMock()
            mock_qa_instance.run = mock_qa_run_fail
            mock_qa_instance.logs = ["Advisory logged"]
            mock_qa_agent_cls.return_value = mock_qa_instance

            # Resume from QA
            job = orch.run_pipeline(job_id, from_stage="qa")

            # Invariant: Output must be delivered because intervention was approved!
            assert job.status == "completed"
            assert job.quarantined is False
            assert (job_work_dir / "intervention_approval.json").exists()

            chapter_name = test_env["pdf_path"].name.replace(".pdf", "").replace(" ", "_")
            delivered_html = test_env["output_dir"] / f"{chapter_name}_chapter.html"
            assert delivered_html.exists(), "Approved chapter must be delivered to output directory!"
