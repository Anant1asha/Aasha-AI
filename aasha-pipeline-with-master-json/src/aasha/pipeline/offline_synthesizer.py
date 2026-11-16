"""Deterministic Offline Chapter Synthesizer.

Builds content_map.json, chapter_spec.json, and lle.json directly from raw_extract.json
when running in offline/no-API-key mode, so any textbook PDF can be compiled end-to-end
into Aasha Learn + Aasha Arena modules without external network calls.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


def build_offline_content_map(
    raw_extract: dict[str, Any],
    subject: str = "math",
    grade: int = 8,
) -> dict[str, Any]:
    pages = raw_extract.get("pages", [])
    headings = raw_extract.get("headings", [])
    exercises = raw_extract.get("exercises", [])
    full_text = "\n".join(p.get("text", "") for p in pages)

    chapter_title = (
        headings[0]["text"]
        if headings
        else Path(raw_extract.get("source_file", "Chapter")).stem.replace("_", " ").title()
    )

    # Group text into 3..5 concept sections using headings or paragraph chunks
    concepts: list[dict[str, Any]] = []
    if len(headings) >= 3:
        for h in headings[1:5]:
            concepts.append({
                "name": h["text"][:70],
                "summary": f"Core concept from {h['text'][:50]} in {chapter_title}.",
                "key_ideas": [w for w in re.findall(r"[A-Za-z]{4,}", h["text"])[:4]],
                "difficulty": "medium",
            })
    if len(concepts) < 3:
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", full_text) if len(s.strip()) > 25]
        chunk_size = max(1, len(sentences) // 3)
        for idx in range(3):
            chunk = sentences[idx * chunk_size : (idx + 1) * chunk_size]
            summary = " ".join(chunk[:2])[:260] or f"Core principle {idx + 1} of {chapter_title}."
            concepts.append({
                "name": f"{chapter_title[:35]} — Part {idx + 1}",
                "summary": summary,
                "key_ideas": [w.lower() for w in re.findall(r"[A-Za-z]{5,}", summary)[:4]],
                "difficulty": ["easy", "medium", "hard"][idx],
            })

    worked_examples = []
    for idx, c in enumerate(concepts[:3]):
        worked_examples.append({
            "problem": f"Apply {c['name']} to a practical example from {chapter_title}.",
            "approach": c["summary"],
            "concept": c["name"],
        })

    vocab = sorted({w.lower() for w in re.findall(r"[A-Za-z]{4,}", full_text)})[:120]

    return {
        "chapter_title": chapter_title,
        "subject": subject,
        "grade": grade,
        "concepts": concepts[:5],
        "worked_examples": worked_examples,
        "quiz_opportunities": [{"concept": c["name"], "context": c["summary"]} for c in concepts[:5]],
        "visual_opportunities": [{"concept": c["name"], "suggested_model": "bar"} for c in concepts[:5]],
        "vocabulary": vocab,
        "exercises_detected": len(exercises),
    }


def build_offline_chapter_spec(
    content_map: dict[str, Any],
    raw_extract: dict[str, Any],
) -> dict[str, Any]:
    title = content_map.get("chapter_title", "Interactive Chapter")
    subject = content_map.get("subject", "math")
    if subject not in ("math", "science", "english", "evs"):
        subject = "math"
    grade = max(3, min(8, int(content_map.get("grade", 8))))
    slug = re.sub(r"[^a-z0-9]", "", title.lower())[:16] or "chapter"

    concepts = content_map.get("concepts", [])[:5]
    while len(concepts) < 3:
        concepts.append({
            "name": f"Concept {len(concepts) + 1}",
            "summary": f"Understanding {title} step by step.",
            "key_ideas": ["concept", "rule"],
            "difficulty": "medium",
        })

    pages_text = "\n".join(p.get("text", "") for p in raw_extract.get("pages", []))
    extracted_qs = re.findall(r"(?:Q\d+[.:)]|\d+[.)])\s*([^\n?]{12,140}\??)", pages_text)

    we_dict: dict[str, Any] = {}
    solve_dict: dict[str, Any] = {}
    nodes: list[dict[str, Any]] = []

    for idx, c in enumerate(concepts):
        cname = c.get("name", f"Concept {idx + 1}")
        csum = c.get("summary", f"Core principle of {cname}.")
        we_key = f"w{idx + 1}"
        sl_key = f"s{idx + 1}"
        q_text = extracted_qs[idx] if idx < len(extracted_qs) else f"Which statement accurately describes {cname}?"
        if not q_text.endswith("?"):
            q_text = f"In {cname}: {q_text}"

        we_dict[we_key] = {
            "title": f"Worked Example {idx + 1}: {cname}",
            "question": f"How do we apply {cname} step by step?",
            "steps": [
                {"text": f"Identify the given quantities in {cname}.", "c": "blue", "final": False},
                {"text": f"Apply the core relationship: {csum[:110]}", "c": "blue", "final": False},
                {"text": f"Verify the units and final answer for {cname}.", "c": "green", "final": True},
            ],
            "check": {
                "q": f"What is the first step when solving a problem on {cname}?",
                "opts": [
                    {"t": "Identify the given quantities and relationship", "c": True, "m": ""},
                    {"t": "Guess a number without checking units", "c": False, "m": "Always list the given values first."},
                    {"t": "Skip the formula and multiply randomly", "c": False, "m": "Check how the two quantities relate first."},
                ],
            },
        }
        solve_dict[sl_key] = {
            "title": f"Guided Practice: {cname}",
            "question": f"Walk through {cname} one step at a time.",
            "steps": [
                {"prompt": f"Step 1: State the key rule for {cname}.", "type": "input", "answer": csum[:80]},
                {"prompt": "Step 2: Check whether both quantities match the rule.", "type": "input", "answer": "Verified"},
            ],
        }

        nodes.append({
            "title": cname,
            "emoji": ["📘", "⚖️", "📊", "🔬", "🏆"][idx % 5],
            "steps": [
                {"t": "text", "title": cname, "body": csum, "xp": 5},
                {
                    "t": "ix_slider",
                    "title": f"Interactive Lab: {cname}",
                    "instruction": f"Move the slider to see how {cname} scales.",
                    "parts": idx + 2,
                    "target_num": idx + 3,
                    "xp": 10,
                },
                {"t": "worked", "we": f"WE.{we_key}", "xp": 10},
                {
                    "t": "quiz",
                    "q": {
                        "q": q_text,
                        "opts": [
                            {"t": csum[:90] or f"Follows the core rule of {cname}", "c": True, "m": ""},
                            {"t": "Ignores the relationship between quantities", "c": False, "m": f"Remember: {cname} depends on a consistent relationship."},
                            {"t": "Applies an unrelated formula without checking", "c": False, "m": "Always verify the relationship before calculating."},
                        ],
                    },
                    "xp": 15,
                },
            ],
        })

    return {
        "chapter": {
            "title": title,
            "subject": subject,
            "grade": grade,
            "storage_key": f"aasha_{slug}_v5",
            "emoji": "📘",
        },
        "BADGES": [
            {"id": "b1", "name": "Explorer", "ic": "🧭", "desc": f"Started {title}"},
            {"id": "b2", "name": "Builder", "ic": "⚙️", "desc": "Completed interactive labs"},
            {"id": "b3", "name": "Champion", "ic": "🏆", "desc": f"Mastered {title}"},
        ],
        "WE": we_dict,
        "SOLVE": solve_dict,
        "NODES": nodes,
    }


def build_offline_lle(
    spec: dict[str, Any],
    defaults_path: Path | None = None,
    master_pack_path: Path | None = None,
) -> dict[str, Any]:
    wm: dict[str, str] = {}
    conn: dict[str, str] = {}
    ph: dict[str, str] = {}

    if defaults_path and defaults_path.exists():
        d = json.loads(defaults_path.read_text(encoding="utf-8"))
        wm.update(d.get("WM", {}))
        conn.update(d.get("CONN", {}))

    if master_pack_path and master_pack_path.exists():
        mp = json.loads(master_pack_path.read_text(encoding="utf-8"))
        wm.update(mp.get("WM2", {}))
        conn.update(mp.get("CONN", {}))
        ph.update(mp.get("PH", {}))

    return {"WM": wm, "CONN": conn, "PH": ph}
