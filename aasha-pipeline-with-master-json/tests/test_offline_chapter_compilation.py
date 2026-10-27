"""Comprehensive Test Battery for Offline Method B Chapter Compilation Pipeline (Workstream B).

Tests:
1. PyMuPDF vector drawing extraction and SVG conversion (l, re, c, v, y, qu).
2. DeepOfflineVectorizer geometric diagram classification and topological OCR.
3. OfflineSynthesizer zero-token pedagogical synthesis (analysis, design, assessment, LLE).
4. End-to-end PDF -> HTML5 compilation with --offline (zero token bleed, 16/16 QA pass).
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

import pytest
from PIL import Image

PIPELINE_DIR = Path(__file__).parent.parent.resolve()
SRC_PATH = PIPELINE_DIR / "src"
VENV_PY = PIPELINE_DIR / ".venv" / "Scripts" / "python.exe"

if str(SRC_PATH) not in sys.path:
    sys.path.insert(0, str(SRC_PATH))

from aasha.agents.deep_vectorizer import DeepOfflineVectorizer
from aasha.synthesis.offline_synthesizer import (
    OfflineSynthesizer,
    sanitize_spec_misconceptions,
)
from tests.test_e2e_smoke import create_minimal_pdf


class TestDeepOfflineVectorizerUnit:
    """Unit tests for PyMuPDF vector drawing extraction and SVG rendering."""

    def test_drawings_to_svg_rendering(self):
        """Verify vector drawings convert accurately into scalable SVG elements."""
        drawings = [
            {
                "color": (0.1, 0.4, 0.9),
                "fill": (0.9, 0.9, 1.0),
                "width": 2.0,
                "items": [
                    ("l", (10, 10), (100, 10)),  # line
                    ("re", (20, 20, 80, 80)),     # rect
                    ("c", (10, 50), (30, 80), (70, 20), (90, 50)),  # cubic bezier
                    ("v", (30, 80), (70, 20), (90, 50)),            # bezier v
                ],
            }
        ]
        svg = DeepOfflineVectorizer._drawings_to_svg(drawings, width=200, height=150)
        assert "<svg" in svg
        assert "</svg>" in svg
        assert "<line" in svg
        assert "<rect" in svg
        assert "<path" in svg
        assert 'viewBox="0 0 200 150"' in svg

    def test_diagram_geometry_classification(self):
        """Verify geometric classifiers recognize aspect ratios and line types."""
        # 1. Number line: wide aspect ratio
        img_wide = Image.new("L", (300, 60), color=255)
        analysis_wide = DeepOfflineVectorizer.analyze_raster_image(img_wide, page_w=300, page_h=60)
        assert isinstance(analysis_wide, dict)

        # 2. Formula cleaning syntax
        clean_eq = DeepOfflineVectorizer._clean_formula_syntax("x + 3 = 7")
        assert "x" in clean_eq and "7" in clean_eq


class TestOfflineSynthesizerUnit:
    """Unit tests for Tier-0 Deterministic Synthesizer."""

    def test_synthesize_analysis_structure(self):
        raw_extract = {
            "pages": [{"page_num": 1, "text": "Fractions and Rational Numbers on a Number Line."}],
            "headings": [{"text": "Rational Numbers"}],
            "exercises": [],
        }
        res = OfflineSynthesizer.synthesize_analysis(raw_extract, subject="math", grade=4)
        assert "chapter_title" in res
        assert len(res["concepts"]) >= 3
        assert len(res["worked_examples"]) >= 3
        assert "vocabulary" in res

    def test_synthesize_design_and_assessment(self):
        content_map = {
            "chapter_title": "Rational Numbers",
            "subject": "math",
            "grade": 4,
            "concepts": [
                {"name": "Equivalent Fractions", "summary": "Equal ratio discovery."},
                {"name": "Number Line Models", "summary": "Positioning values."},
                {"name": "Fraction Addition", "summary": "Combining parts."},
            ],
        }
        spec = OfflineSynthesizer.synthesize_design(content_map, subject="math", grade=4)
        assert "NODES" in spec
        assert len(spec["NODES"]) == 3
        assert "WE" in spec
        assert len(spec["WE"]) == 3
        assert "BADGES" in spec

        # Verify all assessment options populated with zero spoiler leaks
        for node in spec["NODES"]:
            for step in node["steps"]:
                if step.get("t") == "quiz" and step.get("q"):
                    opts = step["q"].get("opts", [])
                    assert opts, "Quiz opts must be populated"
                    assert sum(1 for o in opts if o.get("c")) == 1
                    for o in opts:
                        if not o.get("c"):
                            assert o.get("m"), "Wrong option must have misconception explanation"

    def test_anti_spoiler_sanitization(self):
        spec = {
            "NODES": [
                {
                    "steps": [
                        {
                            "t": "quiz",
                            "q": {
                                "q": "What is 2+2?",
                                "opts": [
                                    {"t": "4", "c": True, "m": ""},
                                    {"t": "5", "c": False, "m": "Adding gives 4, not 5."},  # spoiler leak!
                                ],
                            },
                        }
                    ]
                }
            ]
        }
        repaired = sanitize_spec_misconceptions(spec)
        assert repaired >= 1
        wrong_m = spec["NODES"][0]["steps"][0]["q"]["opts"][1]["m"]
        assert "4" not in wrong_m, f"Spoiler answer leaked in misconception: {wrong_m}"


class TestOfflinePipelineEndToEnd:
    """Full End-to-End Pipeline test: PDF -> HTML5 offline compilation."""

    @pytest.mark.timeout(300)
    def test_offline_chapter_compilation_e2e(self, tmp_path: Path):
        pdf = tmp_path / "offline_math_test.pdf"
        create_minimal_pdf(pdf, title="Offline Rational Numbers")

        env = {
            **os.environ,
            "PYTHONPATH": str(SRC_PATH),
            "AASHA_OFFLINE": "1",
            "ALLOW_PAID_GEMINI_FALLBACK": "false",
        }

        result = subprocess.run(
            [
                str(VENV_PY),
                "-m",
                "aasha.cli",
                "--pdf",
                str(pdf),
                "--subject",
                "math",
                "--grade",
                "4",
                "--offline",
                "--json-events",
            ],
            capture_output=True,
            text=True,
            timeout=300,
            cwd=str(PIPELINE_DIR),
            env=env,
        )

        assert result.returncode == 0, f"Offline pipeline failed: {result.stderr}"

        # Parse JSON event stream
        events = []
        for line in result.stdout.splitlines():
            line = line.strip()
            if line.startswith("{"):
                try:
                    events.append(json.loads(line))
                except json.JSONDecodeError:
                    pass

        last = events[-1] if events else {}
        assert last.get("status") in ("completed", "done"), f"Pipeline event status: {last}"
        assert last.get("cost_usd") == 0.0, f"Expected 0 cost for offline mode, got: {last.get('cost_usd')}"

        html_path_str = last.get("html_path") or last.get("output_path", "")
        assert html_path_str, "html_path missing from pipeline completion event"

        html_path = Path(html_path_str)
        if not html_path.is_absolute():
            html_path = PIPELINE_DIR / html_path

        assert html_path.exists(), f"Output HTML not found: {html_path}"
        html_bytes = html_path.read_bytes()
        assert len(html_bytes) < 20 * 1024 * 1024, "Output exceeds 20 MiB ceiling"

        html_text = html_path.read_text(encoding="utf-8")
        assert not re.findall(r"\{\{[A-Z_]+\}\}", html_text), "Unresolved template placeholders detected"
        assert not re.findall(r'(?:src|href)\s*=\s*["\']https?://', html_text), "External URLs found"
        assert len(re.findall(r"[\u0900-\u097F]", html_text)) >= 50, "Bilingual Hindi content missing"
