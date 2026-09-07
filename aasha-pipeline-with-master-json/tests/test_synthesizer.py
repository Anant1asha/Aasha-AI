"""Tests for the Frontend Code Synthesizer (Agent 4)."""

import json
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from aasha.synthesis import FrontendCodeSynthesizer


@pytest.fixture
def synthesizer():
    return FrontendCodeSynthesizer()


@pytest.fixture
def work_dir(tmp_path):
    return tmp_path


@pytest.fixture
def intermediates(work_dir):
    """Write the intermediate JSON files that Agent 4 needs."""
    pedagogy_map = {
        "chapter_title": "Test Chapter",
        "subject": "math",
        "grade": 4,
        "subject_domain": "STEM",
        "concepts": [
            {"name": "Fractions", "summary": "Parts of a whole", "key_ideas": ["numerator", "denominator"], "difficulty": "easy", "plugin": "jsxgraph", "interaction_type": "geometry"},
            {"name": "Addition", "summary": "Adding fractions", "key_ideas": ["common denominator"], "difficulty": "medium", "plugin": "", "interaction_type": ""},
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
            {"question": "What is 1+1?", "opts": [{"t": "2", "c": True, "m": ""}, {"t": "3", "c": False, "m": "Too many"}], "xp": 5, "hint": "", "explanation": ""},
        ],
        "deep_dive": [
            {"question": "Calculate 2/3 + 1/3", "opts": [{"t": "1", "c": True, "m": ""}, {"t": "2/3", "c": False, "m": "Add numerators"}], "xp": 10, "hint": "Same denominator", "explanation": ""},
        ],
        "boss": [
            {"question": "Explain why 1/2 = 2/4", "opts": [{"t": "They represent the same amount", "c": True, "m": ""}, {"t": "They look different", "c": False, "m": "Look beyond appearance"}], "xp": 20, "hint": "", "explanation": ""},
        ],
        "total_xp": 35,
        "badges": [],
    }

    for name, data in [("pedagogy_map.json", pedagogy_map), ("experience_plan.json", experience_plan), ("assessment_suite.json", assessment_suite)]:
        with open(work_dir / name, "w") as f:
            json.dump(data, f)

    return work_dir


def test_synthesizer_does_not_require_llm(synthesizer):
    assert not synthesizer.requires_llm


def test_synthesizer_produces_html(synthesizer, intermediates):
    result = synthesizer.run(intermediates, {"subject": "math", "grade": 4})

    html_path = intermediates / "chapter.html"
    assert html_path.exists()

    html = html_path.read_text(encoding="utf-8")
    assert "<!DOCTYPE html>" in html
    assert "</html>" in html
    assert "Test Chapter" in html


def test_synthesizer_includes_concept_cards(synthesizer, intermediates):
    synthesizer.run(intermediates, {"subject": "math", "grade": 4})
    html = (intermediates / "chapter.html").read_text(encoding="utf-8")
    assert "Fractions" in html
    assert "Addition" in html
    assert "concept-card" in html


def test_synthesizer_includes_3_assessment_levels(synthesizer, intermediates):
    synthesizer.run(intermediates, {"subject": "math", "grade": 4})
    html = (intermediates / "chapter.html").read_text(encoding="utf-8")
    assert "Warm-up" in html or "warmup" in html
    assert "Deep Dive" in html or "deep_dive" in html
    assert "Boss" in html or "boss" in html


def test_synthesizer_includes_gamification(synthesizer, intermediates):
    synthesizer.run(intermediates, {"subject": "math", "grade": 4})
    html = (intermediates / "chapter.html").read_text(encoding="utf-8")
    assert "XP" in html or "xp" in html
    assert "stat" in html  # stats bar
    assert "progress" in html.lower()


def test_synthesizer_includes_plugin_assets(synthesizer, intermediates):
    """Plugins used in the experience plan should have their CSS/JS embedded."""
    synthesizer.run(intermediates, {"subject": "math", "grade": 4})
    html = (intermediates / "chapter.html").read_text(encoding="utf-8")
    # JSXGraph plugin is used for the "Fractions" concept
    assert "jsxg" in html or "JSX" in html or "jsxgraph" in html.lower()


def test_synthesizer_file_size_reasonable(synthesizer, intermediates):
    result = synthesizer.run(intermediates, {"subject": "math", "grade": 4})
    # Should be under 20MB for a full-synthesis chapter with embedded assets
    assert result["size_kb"] < 20480
