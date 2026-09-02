"""Tests for the chapter spec validator."""

import pytest
from aasha.schemas.validator import validate_chapter_spec


VALID_SPEC = {
    "chapter": {
        "title": "Test Chapter",
        "subject": "math",
        "grade": 4,
        "storage_key": "aasha_test_v5",
        "emoji": "📚",
    },
    "BADGES": [
        {"id": "b1", "name": "First", "ic": "🎯", "desc": "First badge"},
        {"id": "b2", "name": "Second", "ic": "⚡", "desc": "Second badge"},
        {"id": "b3", "name": "Third", "ic": "🏆", "desc": "Third badge"},
    ],
    "WE": {
        "we_1": {
            "title": "Test WE",
            "question": "What is 1/2 of 10?",
            "steps": [
                {"text": "Step 1", "c": "blue", "check": {"q": "What is 10/2?", "opts": [
                    {"t": "5", "c": True, "m": ""},
                    {"t": "10", "c": False, "m": "That's the whole number, not half."},
                    {"t": "20", "c": False, "m": "That's multiplying by two, not dividing."},
                ]}},
                {"text": "Step 2", "c": "blue"},
                {"text": "Answer: 5", "c": "green", "final": True},
            ],
            "check": {"q": "What does 1/2 of 10 mean?", "opts": [
                {"t": "Divide 10 by 2", "c": True, "m": ""},
                {"t": "Multiply 10 by 2", "c": False, "m": "That doubles, not halves."},
                {"t": "Add 1 and 2", "c": False, "m": "That's not how fractions work."},
            ]},
        }
    },
    "SOLVE": {},
    "NODES": [
        {
            "title": "Node 1",
            "emoji": "📖",
            "steps": [
                {"t": "intro", "hero": "data:image/svg+xml;base64,..."},
                {"t": "text", "title": "Intro", "body": "This is intro text."},
                {"t": "quiz", "q": {"q": "What is 1+1?", "opts": [
                    {"t": "2", "c": True, "m": ""},
                    {"t": "3", "c": False, "m": "That's too many."},
                    {"t": "1", "c": False, "m": "That's too few."},
                ]}},
                {"t": "worked", "we": "WE.we_1"},
                {"t": "progress", "xp": 30, "next": True},
            ],
        },
        {
            "title": "Node 2",
            "emoji": "📐",
            "steps": [
                {"t": "intro", "hero": "data:image/svg+xml;base64,..."},
                {"t": "text", "title": "More", "body": "More text here."},
                {"t": "progress", "xp": 50},
            ],
        },
        {
            "title": "Node 3",
            "emoji": "🎯",
            "steps": [
                {"t": "intro", "hero": "data:image/svg+xml;base64,..."},
                {"t": "text", "title": "Final", "body": "Final text."},
                {"t": "progress", "xp": 50},
            ],
        },
    ],
}


def test_valid_spec_passes():
    result = validate_chapter_spec(VALID_SPEC)
    assert result.valid, f"Expected valid spec, got errors: {result.errors}"


def test_missing_correct_option():
    spec = {**VALID_SPEC}
    spec = __import__("copy").deepcopy(spec)
    spec["NODES"][0]["steps"][2]["q"]["opts"][0]["c"] = False
    result = validate_chapter_spec(spec)
    assert not result.valid
    assert any("exactly 1 correct" in e for e in result.errors)


def test_empty_misconception():
    import copy
    spec = copy.deepcopy(VALID_SPEC)
    spec["NODES"][0]["steps"][2]["q"]["opts"][1]["m"] = ""
    result = validate_chapter_spec(spec)
    assert not result.valid
    assert any("empty misconception" in e for e in result.errors)


def test_answer_leakage():
    import copy
    spec = copy.deepcopy(VALID_SPEC)
    # The correct answer is "2", put it in a misconception
    spec["NODES"][0]["steps"][2]["q"]["opts"][1]["m"] = "The answer is not 2."
    result = validate_chapter_spec(spec)
    assert any("leaks" in e for e in result.errors)


def test_final_node_no_next():
    import copy
    spec = copy.deepcopy(VALID_SPEC)
    # Add next: true to the final progress step
    spec["NODES"][-1]["steps"][-1]["next"] = True
    result = validate_chapter_spec(spec)
    assert any("next: true" in e for e in result.errors)


def test_too_few_nodes():
    import copy
    spec = copy.deepcopy(VALID_SPEC)
    spec["NODES"] = spec["NODES"][:2]
    result = validate_chapter_spec(spec)
    assert not result.valid


def test_we_reference_missing():
    import copy
    spec = copy.deepcopy(VALID_SPEC)
    spec["NODES"][0]["steps"][3]["we"] = "WE.nonexistent"
    result = validate_chapter_spec(spec)
    assert any("not found" in e for e in result.errors)


def test_invalid_storage_key():
    import copy
    spec = copy.deepcopy(VALID_SPEC)
    spec["chapter"]["storage_key"] = "invalid_key"
    result = validate_chapter_spec(spec)
    assert not result.valid
