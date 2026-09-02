"""
Stage 4 — Assess (Assessment + Misconception Generation). See README.md.

Walks the chapter_spec produced by design.py and fills every empty option
slot (node quiz `q.opts`, WE end `check`, WE inline step `check`) with real
question/options/misconception content, one LLM call per slot, batched
loosely by node to keep prompts small and outputs easy to validate
individually. Every generated option set is re-validated with
validators._check_option_set-equivalent logic before being accepted; a
failure triggers one regeneration attempt, then the slot is left flagged in
the returned `warnings` list for human review rather than silently shipping
bad content.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from llm_adapter import LLMAdapter, LLMGenerationError  # noqa: E402

SYSTEM_PROMPT = """You are generating one assessment item for an NCERT-aligned
math chapter for Indian government-school students. Produce JSON:
{"question": "...", "opts": [{"t": "...", "c": true|false, "m": "..."}]}
Rules: 3-4 options total, EXACTLY one c:true. Every c:false option's "m" must
be a short, verbal, SPECIFIC misconception explanation for why that exact
distractor is wrong -- it must NEVER state or imply the correct answer. The
correct option's "m" must be an empty string. This is an assessment item."""


def _is_valid_option_set(result: dict) -> bool:
    opts = result.get("opts")
    if not isinstance(opts, list) or not (3 <= len(opts) <= 4):
        return False
    correct = [o for o in opts if o.get("c") is True]
    if len(correct) != 1:
        return False
    correct_text = correct[0].get("t", "").strip().lower()
    for o in opts:
        if o.get("c") is False:
            m = (o.get("m") or "").strip()
            if not m or (correct_text and correct_text in m.lower()):
                return False
    return True


def _generate_option_set(prompt_context: str, adapter: LLMAdapter, warnings: list[str],
                          label: str) -> dict:
    user = f"Context: {prompt_context}\n\nGenerate the assessment item now."
    for attempt in range(2):  # one regeneration attempt on validation failure
        try:
            result = adapter.complete(SYSTEM_PROMPT, user)
        except LLMGenerationError as e:
            warnings.append(f"{label}: LLM call failed ({e}) — left unfilled, needs human review")
            return {"q": prompt_context, "opts": [
                {"t": "PLACEHOLDER — needs manual authoring", "c": True, "m": ""},
            ]}
        if _is_valid_option_set(result):
            return {"q": result["question"], "opts": result["opts"]}
        warnings.append(f"{label}: attempt {attempt+1} failed validation, retrying")
    warnings.append(f"{label}: failed validation after retry — flagged for human review")
    return {"q": result.get("question", prompt_context), "opts": result.get("opts", [])}


def assess(chapter_spec: dict, adapter: LLMAdapter) -> tuple[dict, list[str]]:
    warnings: list[str] = []
    spec = json.loads(json.dumps(chapter_spec))  # deep copy

    for node in spec.get("NODES", []):
        for step in node.get("steps", []):
            if step.get("t") == "quiz" and step.get("q", {}).get("opts") is None:
                topic = step["q"].get("q", node.get("title", ""))
                filled = _generate_option_set(topic, adapter, warnings,
                                               f"{node['title']}/quiz")
                step["q"] = filled

    for we_key, we in spec.get("WE", {}).items():
        if we.get("check") is None:
            filled = _generate_option_set(we.get("question", we_key), adapter, warnings,
                                           f"WE.{we_key}/end-check")
            we["check"] = filled
        for si, wstep in enumerate(we.get("steps", [])):
            if wstep.get("check", "absent") is None and si == 1:
                # the key conceptual step (index 1) gets an inline check
                filled = _generate_option_set(wstep.get("text", we_key), adapter, warnings,
                                               f"WE.{we_key}/step{si}-check")
                wstep["check"] = filled
            elif "check" in wstep and wstep["check"] is None:
                del wstep["check"]  # remove null rather than ship an invalid empty check

    return spec, warnings


def save(spec: dict, out_path: str) -> None:
    Path(out_path).write_text(json.dumps(spec, ensure_ascii=False, indent=2), encoding="utf-8")
