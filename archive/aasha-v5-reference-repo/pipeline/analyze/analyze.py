"""Stage 2 — Analyze. See README.md for the full contract."""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from llm_adapter import LLMAdapter  # noqa: E402

SYSTEM_PROMPT = """You are an expert pedagogue for Indian government-school curriculum
(NCERT-aligned). Produce a content_map JSON with keys: concepts (3-5 objects with
name/summary/key_ideas/difficulty), worked_examples, quiz_opportunities,
visual_opportunities, vocabulary (terms needing Hindi-English scaffolding).
Respond with ONLY the JSON object."""


def analyze(raw_extract: dict, subject: str, grade: int, adapter: LLMAdapter) -> dict:
    all_text = "\n".join(p["text"] for p in raw_extract.get("pages", []))
    user_prompt = (
        f"Subject: {subject}\nGrade: {grade}\n\n"
        f"Chapter text:\n{all_text[:12000]}"  # cap to keep prompt bounded
    )
    return adapter.complete(SYSTEM_PROMPT, user_prompt)


def save(content_map: dict, out_path: str) -> None:
    Path(out_path).write_text(
        json.dumps(content_map, ensure_ascii=False, indent=2), encoding="utf-8"
    )
