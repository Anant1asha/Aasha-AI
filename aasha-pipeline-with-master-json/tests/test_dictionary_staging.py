"""Tests for Tier 1 candidate staging and Tier 2 dictionary management."""

import json
from pathlib import Path
from unittest.mock import MagicMock

from aasha.agents import LLEAgent
from aasha import manage_dictionary


def make_mock_llm():
    llm = MagicMock()
    llm.cost_estimate = 0.01
    return llm



def test_lle_agent_stages_candidates(mock_llm, tmp_path):
    # Setup mock config dir with defaults.json
    config_dir = tmp_path / "config"
    config_dir.mkdir()
    defaults = {
        "WM": {
            "fraction": "भिन्न (फ्रैक्शन)",
            "fractions": "भिन्न (फ्रैक्शन्स)"
        },
        "CONN": {"and": "और (एंड)"},
        "baseline_dictionary_counts": {"WM": 2, "CONN": 1},
    }
    with open(config_dir / "defaults.json", "w", encoding="utf-8") as f:
        json.dump(defaults, f)

    work_dir = tmp_path / "work"
    work_dir.mkdir()

    # Spec containing 1 baseline word ("fraction") and 1 net-new word ("numerator")
    spec = {
        "chapter": {"title": "Fractions Part 1", "storage_key": "chap_1"},
        "NODES": [
            {
                "title": "Intro",
                "steps": [
                    {"t": "text", "title": "Fractions", "body": "fraction numerator"}
                ],
            }
        ],
    }
    with open(work_dir / "chapter_spec.json", "w", encoding="utf-8") as f:
        json.dump(spec, f)

    mock_llm.complete.return_value = {
        "translations": {
            "numerator": "अंश (न्यूमरेटर)"
        }
    }

    agent = LLEAgent(mock_llm, dict_dir=str(config_dir / "defaults.json"))
    res = agent.run(work_dir, {"language": "hi", "title": "Chapter 1"})

    assert res["new_words"] == 1
    assert res["staged_candidates"] == 1

    candidate_file = config_dir / "candidate_dictionary_hi.json"
    assert candidate_file.exists()
    with open(candidate_file, "r", encoding="utf-8") as f:
        candidates = json.load(f)

    assert "numerator" in candidates
    assert candidates["numerator"]["frequency"] == 1
    assert "Chapter 1" in candidates["numerator"]["chapters"]
    assert candidates["numerator"]["translation"] == "अंश (न्यूमरेटर)"

    # Run a second time with Chapter 2 to verify frequency increment
    work_dir_2 = tmp_path / "work2"
    work_dir_2.mkdir()
    with open(work_dir_2 / "chapter_spec.json", "w", encoding="utf-8") as f:
        json.dump(spec, f)

    agent.run(work_dir_2, {"language": "hi", "title": "Chapter 2"})
    with open(candidate_file, "r", encoding="utf-8") as f:
        candidates2 = json.load(f)

    assert candidates2["numerator"]["frequency"] == 2
    assert "Chapter 1" in candidates2["numerator"]["chapters"]
    assert "Chapter 2" in candidates2["numerator"]["chapters"]


def test_manage_dictionary_promotion_and_rejection(tmp_path, monkeypatch):
    config_dir = tmp_path / "config"
    config_dir.mkdir()
    defaults = {
        "WM": {"fraction": "भिन्न (फ्रैक्शन)"},
        "CONN": {"and": "और (एंड)"},
        "baseline_dictionary_counts": {"WM": 1, "CONN": 1},
    }
    candidates = {
        "numerator": {
            "translation": "अंश (न्यूमरेटर)",
            "frequency": 2,
            "chapters": ["chap_1", "chap_2"],
        },
        "typo_word": {
            "translation": "अशुद्ध (टाइपो)",
            "frequency": 1,
            "chapters": ["chap_1"],
        },
    }
    with open(config_dir / "defaults.json", "w", encoding="utf-8") as f:
        json.dump(defaults, f)
    with open(config_dir / "candidate_dictionary_hi.json", "w", encoding="utf-8") as f:
        json.dump(candidates, f)

    monkeypatch.setattr(manage_dictionary, "get_config_dir", lambda: config_dir)
    monkeypatch.setattr(manage_dictionary, "get_defaults_path", lambda: config_dir / "defaults.json")
    monkeypatch.setattr(manage_dictionary, "get_candidate_path", lambda lang: config_dir / f"candidate_dictionary_{lang}.json")

    # Reject typo_word
    args_reject = MagicMock()
    args_reject.lang = "hi"
    args_reject.words = ["typo_word"]
    args_reject.file = None
    manage_dictionary.cmd_reject(args_reject)

    with open(config_dir / "candidate_dictionary_hi.json", "r", encoding="utf-8") as f:
        cand_after_reject = json.load(f)
    assert "typo_word" not in cand_after_reject
    assert "numerator" in cand_after_reject

    # Promote numerator
    args_promote = MagicMock()
    args_promote.lang = "hi"
    args_promote.all = False
    args_promote.min_freq = None
    args_promote.words = ["numerator"]
    args_promote.file = None
    manage_dictionary.cmd_promote(args_promote)

    with open(config_dir / "candidate_dictionary_hi.json", "r", encoding="utf-8") as f:
        cand_after_promote = json.load(f)
    assert "numerator" not in cand_after_promote

    with open(config_dir / "defaults.json", "r", encoding="utf-8") as f:
        def_after_promote = json.load(f)
    assert def_after_promote["WM"]["numerator"] == "अंश (न्यूमरेटर)"
    assert def_after_promote["baseline_dictionary_counts"]["WM"] == 2


if __name__ == "__main__":
    from unittest.mock import MagicMock
    import tempfile

    with tempfile.TemporaryDirectory() as td:
        print("Running test_lle_agent_stages_candidates...")
        test_lle_agent_stages_candidates(MagicMock(), Path(td))
        print("[PASS] test_lle_agent_stages_candidates passed!")

    with tempfile.TemporaryDirectory() as td:
        print("Running test_manage_dictionary_promotion_and_rejection...")
        class DummyMonkey:
            def setattr(self, obj, name, val):
                setattr(obj, name, val)
        test_manage_dictionary_promotion_and_rejection(Path(td), DummyMonkey())
        print("[PASS] test_manage_dictionary_promotion_and_rejection passed!")

    print("\nALL DICTIONARY TESTS PASSED SUCCESSFULLY!")

