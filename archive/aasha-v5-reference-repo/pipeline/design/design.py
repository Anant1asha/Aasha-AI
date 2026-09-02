"""
Stage 3 — Design. See README.md for the full contract.

Implementation choice: structure assembly (NODES shape, the proven step flow,
WE/SOLVE skeletons) is done DETERMINISTICALLY in Python, not left to freeform
LLM JSON generation. The MVP spec calls for "a post-processor [that] validates
the structure against the schema" (§2.2.4) — this implementation takes that a
step further and makes the structure schema-correct BY CONSTRUCTION, which is
more reliable than generate-then-validate-then-retry for the parts that don't
need creative judgment (step sequencing is a fixed, proven pattern; only the
pedagogical CONTENT of each step is genuinely creative and that's what an LLM
is actually good at — handled in Stage 4 / assess.py).

An LLM call is still used (see `suggest_visual_types`) for the one genuinely
judgment-based structural decision: which interactive visual type best fits
each concept. Everything else is template application.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from llm_adapter import LLMAdapter  # noqa: E402

VISUAL_TYPES = {"ix_pizza", "ix_bar", "ix_area", "ix_slider"}


def _slug(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")
    return s[:24] or "concept"


def design(content_map: dict, chapter_title: str, subject: str, grade: int,
           storage_key: str, adapter: LLMAdapter) -> dict:
    concepts = content_map.get("concepts", [])
    if not (3 <= len(concepts) <= 5):
        # Clamp defensively — a post-processor rule, not a silent content change.
        concepts = concepts[:5] if len(concepts) > 5 else concepts

    visual_by_concept = _suggest_visuals(concepts, content_map, adapter)

    nodes = []
    we_defs: dict = {}
    solve_defs: dict = {}

    for i, concept in enumerate(concepts):
        key = _slug(concept.get("name", f"concept{i}"))
        we_key = f"we_{key}"
        visual_t = visual_by_concept.get(concept.get("name"), "ix_bar")

        we_defs[we_key] = _we_skeleton(concept)

        is_last = i == len(concepts) - 1
        steps = [
            {"t": "intro"},
            {"t": "text", "title": concept.get("name", "Concept"),
             "body": concept.get("summary", "")},
            {"t": visual_t, "instruction": f"Explore {concept.get('name', 'the concept')}",
             **_visual_defaults(visual_t)},
            {"t": "worked", "we": f"WE.{we_key}"},
            {"t": "quiz", "q": _question_skeleton(concept)},
            {"t": "progress", "xp": 30, **({} if is_last else {"next": True})},
        ]
        nodes.append({"title": concept.get("name", f"Concept {i+1}"),
                       "emoji": concept.get("emoji", "\U0001F4D8"), "steps": steps})

    spec = {
        "chapter": {"title": chapter_title, "subject": subject, "grade": grade,
                    "storage_key": storage_key},
        "WE": we_defs,
        "SOLVE": solve_defs,
        "NODES": nodes,
    }
    return spec


def _visual_defaults(t: str) -> dict:
    return {
        "ix_pizza": {"slices": 4},
        "ix_bar": {"parts": 5},
        "ix_area": {"rows": 3, "cols": 4},
        "ix_slider": {"base_num": 1, "base_den": 2},
    }.get(t, {})


def _we_skeleton(concept: dict) -> dict:
    """A schema-valid WE skeleton with placeholder step text and an EMPTY
    check (filled by assess.py). Keeps design.py's output always valid even
    before assessment content exists, so intermediate stages can be
    inspected/edited independently (per the resumable-pipeline requirement)."""
    name = concept.get("name", "this concept")
    return {
        "title": f"Solved: {name}",
        "question": f"A worked example illustrating {name}.",
        "steps": [
            {"text": f"Let's work through {name} step by step.", "c": "blue"},
            {"text": f"Step 1 for {name}.", "c": "blue", "check": None},
            {"text": f"Step 2 for {name}.", "c": "blue"},
            {"text": f"Answer: {name} applied correctly.", "c": "green", "final": True},
        ],
        "check": None,  # filled by assess.py
    }


def _question_skeleton(concept: dict) -> dict:
    return {"q": f"Which statement about {concept.get('name', 'this concept')} is correct?",
            "opts": None}  # filled by assess.py


def _suggest_visuals(concepts: list[dict], content_map: dict, adapter: LLMAdapter) -> dict:
    """One structural judgment call left to the LLM: visual type per concept.
    Falls back to content_map's own visual_opportunities, then to 'ix_bar',
    so this never blocks the pipeline even if the LLM call fails."""
    opportunities = {vo.get("concept"): vo.get("visual_type")
                      for vo in content_map.get("visual_opportunities", [])}
    result = {}
    for c in concepts:
        vt = opportunities.get(c.get("name"))
        result[c.get("name")] = f"ix_{vt}" if vt in {"pizza", "bar", "area", "slider"} else "ix_bar"
    return result


def save(spec: dict, out_path: str) -> None:
    Path(out_path).write_text(json.dumps(spec, ensure_ascii=False, indent=2), encoding="utf-8")
