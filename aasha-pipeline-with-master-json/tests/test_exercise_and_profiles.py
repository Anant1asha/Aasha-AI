"""Tests for the exercise extractor and subject profiles."""

import pytest

from aasha.exercise import ExerciseExtractor, ExerciseItem
from aasha.profiles import get_profile, classify_domain


# ─── Subject Profiles ──────────────────────────────────────────────────

def test_classify_domain_math():
    assert classify_domain("math") == "STEM"
    assert classify_domain("science") == "STEM"


def test_classify_domain_social_studies():
    assert classify_domain("social_studies") == "Humanities"
    assert classify_domain("history") == "Humanities"


def test_classify_domain_english():
    assert classify_domain("english") == "Languages"


def test_get_profile_math():
    profile = get_profile("math")
    assert profile.domain == "STEM"
    assert "geometry" in profile.interaction_types
    assert "jsxgraph" in profile.preferred_plugins


def test_get_profile_english():
    profile = get_profile("english")
    assert profile.domain == "Languages"
    assert "phonics_card" in profile.interaction_types


def test_get_profile_social_studies():
    profile = get_profile("social_studies")
    assert profile.domain == "Humanities"
    assert "timeline" in profile.interaction_types


def test_get_profile_unknown_falls_back_to_stem():
    profile = get_profile("unknown_subject")
    assert profile.domain == "STEM"


# ─── Exercise Extractor ─────────────────────────────────────────────────

@pytest.fixture
def extractor():
    return ExerciseExtractor()


def test_extract_from_exercise_section(extractor):
    """Test extraction from a PDF with an exercise section."""
    raw = {
        "source_file": "test.pdf",
        "page_count": 2,
        "pages": [
            {"page_num": 1, "text": "Fractions are parts of a whole.", "blocks": [], "images": []},
            {"page_num": 2, "text": """Exercise 1
1. What is a fraction?
2. Find 1/2 of 10.
3. Calculate the sum of 1/4 and 2/4.
4. Explain why 1/2 and 2/4 are equivalent.
(a) They look the same
(b) They represent the same amount
(c) They are different
""", "blocks": [], "images": []},
        ],
        "headings": [],
        "exercises": [],
        "figures": [],
    }
    items = extractor.extract(raw)
    assert len(items) > 0
    # Should have found at least the numbered questions
    types_found = {item.type for item in items}
    assert "unknown" not in types_found or len(types_found) > 1


def test_classify_mcq(extractor):
    text = """1. What is the capital of France?
(a) London
(b) Paris
(c) Berlin
(d) Rome"""
    item = extractor._classify_question(text, 1)
    assert item.type == "mcq"
    assert len(item.options) >= 2


def test_classify_numerical(extractor):
    text = "2. Find the area of a rectangle with length 5 and width 3."
    item = extractor._classify_question(text, 1)
    assert item.type == "numerical"
    assert item.difficulty == "application"


def test_classify_short_answer(extractor):
    text = "3. What is photosynthesis?"
    item = extractor._classify_question(text, 1)
    assert item.type == "short_answer"
    assert item.difficulty in ("recall", "conceptual")


def test_classify_long_answer(extractor):
    text = "4. Discuss the causes of the French Revolution."
    item = extractor._classify_question(text, 1)
    assert item.type == "long_answer"
    assert item.difficulty == "critical_thinking"


def test_difficulty_mapping(extractor):
    assert extractor.to_assessment_level("recall") == "warmup"
    assert extractor.to_assessment_level("conceptual") == "warmup"
    assert extractor.to_assessment_level("application") == "deep_dive"
    assert extractor.to_assessment_level("critical_thinking") == "boss"


def test_exercise_item_to_dict():
    item = ExerciseItem("Test question", "mcq", "What is 1+1?", ["1", "2"], "2", 5, "recall")
    d = item.to_dict()
    assert d["raw_text"] == "Test question"
    assert d["type"] == "mcq"
    assert d["page"] == 5
    assert d["difficulty"] == "recall"


def test_fill_blank_detection(extractor):
    text = "Fill in the blanks: The ____ is the top part of a fraction."
    item = extractor._classify_question(text, 1)
    assert item.type == "fill_blank"


def test_true_false_detection(extractor):
    text = "State True or False: A fraction has a numerator and denominator."
    item = extractor._classify_question(text, 1)
    assert item.type == "true_false"
