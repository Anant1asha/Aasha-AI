"""Tests for the agents (mocked LLM)."""

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from aasha.agents import IngestAgent, AnalysisAgent, DesignAgent, AssessmentAgent, LLEAgent


@pytest.fixture
def work_dir(tmp_path):
    return tmp_path


@pytest.fixture
def mock_llm():
    llm = MagicMock()
    llm.cost_estimate = 0.01
    return llm


def test_ingest_agent_requires_no_llm():
    agent = IngestAgent()
    assert not agent.requires_llm


def test_analysis_agent_run(mock_llm, work_dir):
    # Set up raw_extract.json
    raw_extract = {
        "source_file": "test.pdf",
        "page_count": 2,
        "pages": [
            {"page_num": 1, "text": "Fractions are parts of a whole. A fraction has a numerator and denominator.", "blocks": [], "images": []},
            {"page_num": 2, "text": "Equivalent fractions are fractions that are equal in value.", "blocks": [], "images": []},
        ],
        "headings": [{"text": "Fractions", "page": 1, "level": 1}],
        "exercises": [],
        "figures": [],
    }
    with open(work_dir / "raw_extract.json", "w") as f:
        json.dump(raw_extract, f)

    mock_llm.complete.return_value = {
        "chapter_title": "Fractions",
        "concepts": [
            {"name": "What is a Fraction", "summary": "Parts of a whole", "key_ideas": ["numerator", "denominator"], "difficulty": "easy"},
            {"name": "Equivalent Fractions", "summary": "Fractions with same value", "key_ideas": ["equivalent"], "difficulty": "medium"},
            {"name": "Comparing Fractions", "summary": "Which is bigger", "key_ideas": ["compare"], "difficulty": "medium"},
        ],
        "worked_examples": [],
        "quiz_opportunities": [],
        "visual_opportunities": [],
        "vocabulary": ["fraction", "numerator"],
    }

    agent = AnalysisAgent(mock_llm)
    result = agent.run(work_dir, {"subject": "math", "grade": 4})

    assert (work_dir / "content_map.json").exists()
    assert result["concept_count"] == 3
    mock_llm.complete.assert_called_once()


def test_design_agent_creates_structure(mock_llm, work_dir):
    # Set up content_map.json
    content_map = {
        "chapter_title": "Fractions",
        "concepts": [
            {"name": "What is a Fraction", "summary": "Parts of a whole", "key_ideas": ["numerator", "denominator"], "difficulty": "easy"},
            {"name": "Equivalent Fractions", "summary": "Same value", "key_ideas": ["equivalent"], "difficulty": "medium"},
            {"name": "Fraction of a Number", "summary": "Find part of a number", "key_ideas": ["of"], "difficulty": "medium"},
        ],
        "worked_examples": [{"problem": "Find 1/2 of 10", "approach": "Divide by 2", "concept": "Fraction of a Number"}],
        "quiz_opportunities": [],
        "visual_opportunities": [{"concept": "Parts of a whole", "suggested_model": "pizza"}],
        "vocabulary": ["fraction"],
    }
    with open(work_dir / "content_map.json", "w") as f:
        json.dump(content_map, f)

    mock_llm.complete.return_value = {
        "chapter": {"title": "Fractions", "subject": "math", "grade": 4, "storage_key": "aasha_frac_v5", "emoji": "🍕"},
        "BADGES": [
            {"id": "b1", "name": "First", "ic": "🎯", "desc": "First"},
            {"id": "b2", "name": "Second", "ic": "⚡", "desc": "Second"},
            {"id": "b3", "name": "Third", "ic": "🏆", "desc": "Third"},
        ],
        "WE": {
            "we_1": {
                "title": "Find 1/2 of 10",
                "question": "What is 1/2 of 10?",
                "steps": [
                    {"text": "Step 1", "c": "blue", "check": None},
                    {"text": "Step 2", "c": "blue"},
                    {"text": "Answer", "c": "green", "final": True},
                ],
                "check": {"q": "What does 1/2 of 10 mean?", "opts": None},
            }
        },
        "SOLVE": {},
        "NODES": [
            {"title": "What is a Fraction", "emoji": "🍕", "steps": [
                {"t": "intro", "hero": ""},
                {"t": "text", "title": "Fractions", "body": "A fraction is part of a whole."},
                {"t": "progress", "xp": 30, "next": True},
            ]},
            {"title": "Equivalent Fractions", "emoji": "🍕", "steps": [
                {"t": "intro", "hero": ""},
                {"t": "text", "title": "Equivalent", "body": "Equivalent fractions are equal."},
                {"t": "progress", "xp": 30, "next": True},
            ]},
            {"title": "Fraction of a Number", "emoji": "🍕", "steps": [
                {"t": "intro", "hero": ""},
                {"t": "worked", "we": "WE.we_1"},
                {"t": "progress", "xp": 50},
            ]},
        ],
    }

    agent = DesignAgent(mock_llm)
    result = agent.run(work_dir, {"subject": "math", "grade": 4})

    assert (work_dir / "chapter_spec.json").exists()
    with open(work_dir / "chapter_spec.json") as f:
        spec = json.load(f)

    assert len(spec["NODES"]) == 3
    # Final node's last step should not have next: true
    assert "next" not in spec["NODES"][-1]["steps"][-1]
    # All other progress steps should have next: true
    assert spec["NODES"][0]["steps"][-1].get("next") == True
    assert result["node_count"] == 3


def test_assessment_agent_fills_opts(mock_llm, work_dir):
    # Set up chapter_spec.json with null opts
    spec = {
        "chapter": {"title": "Test", "subject": "math", "grade": 4, "storage_key": "aasha_test_v5"},
        "BADGES": [{"id": "b1", "name": "B", "ic": "🎯", "desc": "D"}] * 3,
        "WE": {},
        "SOLVE": {},
        "NODES": [
            {"title": "N1", "steps": [
                {"t": "quiz", "q": {"q": "What is 1+1?", "opts": None}},
                {"t": "progress", "xp": 10, "next": True},
            ]},
            {"title": "N2", "steps": [{"t": "progress", "xp": 10}]},
            {"title": "N3", "steps": [{"t": "progress", "xp": 10}]},
        ],
    }
    with open(work_dir / "chapter_spec.json", "w") as f:
        json.dump(spec, f)
    with open(work_dir / "content_map.json", "w") as f:
        json.dump({"concepts": []}, f)

    mock_llm.complete.return_value = {
        "assessments": [{
            "location": "NODES[0].steps[0].q",
            "opts": [
                {"t": "2", "c": True, "m": ""},
                {"t": "3", "c": False, "m": "That's too many."},
                {"t": "1", "c": False, "m": "That's too few."},
            ],
        }]
    }

    agent = AssessmentAgent(mock_llm)
    result = agent.run(work_dir, {"grade": 4, "subject": "math"})

    with open(work_dir / "chapter_spec.json") as f:
        updated_spec = json.load(f)

    opts = updated_spec["NODES"][0]["steps"][0]["q"]["opts"]
    assert opts is not None
    assert len(opts) == 3
    assert sum(1 for o in opts if o["c"]) == 1
