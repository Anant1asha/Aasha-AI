"""Tests for FOCUS-UNIT-PHASE-B-001:
  - Dual-Mode Orchestrator (--mode v5-engine and --mode full-synthesis)
  - FrontendCodeSynthesizer QA Rule #4 (no alert/confirm), Rule #5 (Skip button), Rule #9 (instant reset), TEAS telemetry
  - SQLite Dual-Output Exporter (teas_content.db.gz)
"""

import json
import re
import tempfile
from pathlib import Path

from aasha.config import Config
from aasha.pipeline.orchestrator import Orchestrator
from aasha.schemas import FULL_SYNTHESIS_STAGE_ORDER, STAGE_ORDER
from aasha.synthesis import FrontendCodeSynthesizer
from aasha.assemble.sqlite_exporter import export_chapter_specs_to_sqlite


def _make_config(tmp_dir: Path) -> Config:
    cfg = Config.load(None)
    cfg.pipeline.work_dir = str(tmp_dir / "work")
    cfg.pipeline.output_dir = str(tmp_dir / "output")
    cfg.pipeline.jobs_dir = str(tmp_dir / "jobs")
    return cfg


def test_orchestrator_creates_v5_and_full_synthesis_jobs():
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        dummy_pdf = tmp_path / "fractions_ch1.pdf"
        dummy_pdf.write_bytes(b"%PDF-1.4 dummy")

        cfg = _make_config(tmp_path)
        orch = Orchestrator(cfg)

        v5_id = orch.create_job(dummy_pdf, subject="math", grade=6, mode="v5-engine")
        v5_job = orch.get_job(v5_id)
        assert v5_job is not None
        assert v5_job.input.mode == "v5-engine"
        assert [s.name for s in v5_job.stages] == STAGE_ORDER

        fs_id = orch.create_job(dummy_pdf, subject="math", grade=6, mode="full-synthesis")
        fs_job = orch.get_job(fs_id)
        assert fs_job is not None
        assert fs_job.input.mode == "full-synthesis"
        assert [s.name for s in fs_job.stages] == FULL_SYNTHESIS_STAGE_ORDER


def test_code_synthesizer_qa_rule_4_5_9_and_teas_telemetry():
    synth = FrontendCodeSynthesizer()
    with tempfile.TemporaryDirectory() as tmp:
        work_dir = Path(tmp)
        pedagogy_map = {
            "chapter_title": "Fractions & Equal Parts",
            "subject": "math",
            "grade": 6,
            "subject_domain": "STEM",
            "concepts": [
                {
                    "name": "Parts of a Whole",
                    "summary": "A fraction splits a whole into equal parts.",
                    "key_ideas": ["numerator", "denominator"],
                    "difficulty": "easy",
                    "plugin": "jsxgraph",
                    "interaction_type": "geometry",
                },
                {
                    "name": "Equivalent Fractions",
                    "summary": "Multiplying numerator and denominator by the same non-zero number keeps value equal.",
                    "key_ideas": ["equivalent", "proportion"],
                    "difficulty": "medium",
                    "plugin": "mafs",
                    "interaction_type": "graphing",
                },
            ],
            "exercises": [],
        }
        experience_plan = {
            "concepts": pedagogy_map["concepts"],
            "simulation_plan": [],
            "visual_plan": [],
        }
        assessment_suite = {
            "warmup": [
                {
                    "question": "Which fraction represents 3 equal parts out of 4?",
                    "opts": [
                        {"t": "3/4", "c": True, "m": ""},
                        {"t": "4/3", "c": False, "m": "You swapped numerator and denominator."},
                    ],
                    "xp": 5,
                    "hint": "Selected parts go in the numerator.",
                    "explanation": "3 parts out of 4 equal parts is 3/4.",
                }
            ],
            "deep_dive": [
                {
                    "question": "Which fraction is equivalent to 1/2?",
                    "opts": [
                        {"t": "2/4", "c": True, "m": ""},
                        {"t": "1/4", "c": False, "m": "Both numerator and denominator must be multiplied by 2."},
                    ],
                    "xp": 10,
                    "hint": "Multiply top and bottom by 2.",
                    "explanation": "1*2 / 2*2 = 2/4.",
                }
            ],
            "boss": [
                {
                    "question": "Compare 3/5 and 4/5.",
                    "opts": [
                        {"t": "4/5 > 3/5", "c": True, "m": ""},
                        {"t": "3/5 > 4/5", "c": False, "m": "With equal denominators, larger numerator is greater."},
                    ],
                    "xp": 20,
                    "hint": "Compare numerators when denominators match.",
                    "explanation": "4 > 3 so 4/5 > 3/5.",
                }
            ],
            "total_xp": 35,
            "badges": [],
        }
        for name, data in [
            ("pedagogy_map.json", pedagogy_map),
            ("experience_plan.json", experience_plan),
            ("assessment_suite.json", assessment_suite),
        ]:
            (work_dir / name).write_text(json.dumps(data), encoding="utf-8")

        res = synth.run(work_dir, {"subject": "math", "grade": 6})
        html_path = Path(res["output_file"])
        assert html_path.exists()
        html = html_path.read_text(encoding="utf-8")

        # 1. Offline bundle budget < 20 MiB
        assert html_path.stat().st_size < 20 * 1024 * 1024

        # 2. Critical Rule #4: zero blocking alert() or confirm()
        assert re.search(r"\balert\s*\(", html) is None
        assert re.search(r"\bconfirm\s*\(", html) is None

        # 3. Critical Rule #5 & #9: Skip button, showToast, and emitTeasEvent present
        assert "skipInteractiveStep" in html
        assert "showToast" in html
        assert "emitTeasEvent" in html

        # 4. Zero external runtime URLs
        ext_urls = re.findall(r"https?://[^\s\"\'<>)]+", html)
        allowed = [u for u in ext_urls if "w3.org" in u]
        assert len(ext_urls) == len(allowed)


def test_full_synthesis_orchestrator_synthesize_to_output():
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        dummy_pdf = tmp_path / "fractions_ch1.pdf"
        dummy_pdf.write_bytes(b"%PDF-1.4 dummy")

        cfg = _make_config(tmp_path)
        orch = Orchestrator(cfg)
        job_id = orch.create_job(dummy_pdf, subject="math", grade=6, mode="full-synthesis")
        work_dir = orch.get_job_work_dir(job_id)

        # Seed content_map.json and chapter_spec.json from valid fixture so _prepare_full_synthesis_intermediates bridges them
        content_map = {
            "chapter_title": "Fractions Chapter",
            "subject": "math",
            "grade": 6,
            "concepts": [
                {"name": "Fractions", "description": "Equal parts of a whole", "key_terms": ["numerator", "denominator"], "difficulty": "easy"},
                {"name": "Number Line", "description": "Plotting fractions on a line", "key_terms": ["interval"], "difficulty": "medium"},
            ],
        }
        chapter_spec = {
            "chapter": {"title": "Fractions Chapter", "subject": "math", "grade": 6, "storage_key": "aasha_frac_v5", "emoji": "🍕"},
            "NODES": [
                {
                    "title": "Node 1",
                    "emoji": "📖",
                    "steps": [
                        {
                            "t": "quiz",
                            "q": {
                                "q": "What is 1/2 + 1/2?",
                                "opts": [
                                    {"t": "1", "c": True, "m": ""},
                                    {"t": "2/4", "c": False, "m": "Do not add denominators when they are equal."},
                                ],
                                "hint": "Add numerators over common denominator 2.",
                                "exp": "1/2 + 1/2 = 2/2 = 1.",
                            },
                        }
                    ],
                }
            ],
        }
        (work_dir / "content_map.json").write_text(json.dumps(content_map), encoding="utf-8")
        (work_dir / "chapter_spec.json").write_text(json.dumps(chapter_spec), encoding="utf-8")

        # Run synthesize stage directly and then output stage
        orch._prepare_full_synthesis_intermediates(work_dir, {"subject": "math", "grade": 6})
        assert (work_dir / "pedagogy_map.json").exists()
        assert (work_dir / "experience_plan.json").exists()
        assert (work_dir / "assessment_suite.json").exists()

        synth_res = FrontendCodeSynthesizer().run(work_dir, {"subject": "math", "grade": 6})
        assert Path(synth_res["output_file"]).exists()

        # Verify SQLite dual-output exporter produces teas_content.db.gz
        db_out = tmp_path / "output" / "teas_content.db"
        summary = export_chapter_specs_to_sqlite([work_dir / "chapter_spec.json"], db_out, gzip_output=True)
        assert summary["chapters"] == 1
        assert Path(summary["gzip_path"]).exists()
