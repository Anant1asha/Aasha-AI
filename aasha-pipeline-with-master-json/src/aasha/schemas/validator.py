"""Chapter spec validator — enforces the 12 validation rules from the schema document.

Rules that JSON Schema alone cannot express (cross-references, substring checks)
are implemented here as custom Python validators.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

from . import ChapterSpec, Option, OptionSet


@dataclass
class ValidationResult:
    valid: bool
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def add_error(self, msg: str) -> None:
        self.errors.append(msg)
        self.valid = False

    def add_warning(self, msg: str) -> None:
        self.warnings.append(msg)


def _check_one_correct(opts: list[Option], context: str, result: ValidationResult) -> None:
    """Rule 6: Exactly one option has c=true."""
    correct_count = sum(1 for o in opts if o.c)
    if correct_count != 1:
        result.add_error(f"{context}: expected exactly 1 correct option, found {correct_count}")


def _check_misconceptions(opts: list[Option], context: str, result: ValidationResult) -> None:
    """Rule 7: Every wrong option has non-empty m that doesn't leak the answer."""
    correct_opts = [o.t for o in opts if o.c]
    correct_text = correct_opts[0].lower().strip() if correct_opts else ""
    # Match the correct answer as a whole token, not as a raw substring. A short
    # answer such as "A", "B" or "6" otherwise collides with ordinary English
    # (the article "a"), flagging every misconception as a leak.
    leak_pattern = (
        re.compile(r"(?<!\w)" + re.escape(correct_text) + r"(?!\w)")
        if correct_text
        else None
    )
    for o in opts:
        if not o.c:
            if not o.m or not o.m.strip():
                result.add_error(f"{context}: wrong option '{o.t[:40]}' has empty misconception")
            elif leak_pattern is not None and leak_pattern.search(o.m.lower()):
                result.add_error(
                    f"{context}: misconception for '{o.t[:40]}' leaks the correct answer"
                )


def _check_option_set(os: OptionSet | None, context: str, result: ValidationResult) -> None:
    """Check a full option set: one correct, misconceptions present."""
    if os is None:
        return
    if len(os.opts) < 3 or len(os.opts) > 4:
        result.add_error(f"{context}: expected 3-4 options, found {len(os.opts)}")
    _check_one_correct(os.opts, context, result)
    _check_misconceptions(os.opts, context, result)


def validate_chapter_spec(spec_data: dict[str, Any]) -> ValidationResult:
    """Run all 12 validation rules on a chapter spec dict.

    Returns a ValidationResult with errors (blocking) and warnings (non-blocking).
    """
    result = ValidationResult(valid=True)

    try:
        spec = ChapterSpec.model_validate(spec_data)
    except Exception as e:
        result.add_error(f"Schema validation failed: {e}")
        return result

    # Rule 1: NODES is non-empty with 3-5 elements (enforced by schema)
    # Rule 2: Every node has title + non-empty steps (enforced by schema)
    # Rule 3: Every step has a valid t (enforced by schema)

    # Rule 4: Last node's final step is {t: progress, xp: N} with no next: true
    last_node = spec.NODES[-1]
    last_step = last_node.steps[-1]
    if last_step.t != "progress":
        result.add_error(
            f"Rule 4: last node's final step must be 'progress', found '{last_step.t}'"
        )
    elif last_step.next is True:
        result.add_error("Rule 4: final progress step must NOT have next: true")

    # Rule 5-7: Check all option sets
    for n_idx, node in enumerate(spec.NODES):
        ctx_node = f"Node[{n_idx}] '{node.title}'"
        for s_idx, step in enumerate(node.steps):
            ctx_step = f"{ctx_node} step[{s_idx}] ({step.t})"

            if step.t == "quiz" or step.t == "vq":
                _check_option_set(step.q, ctx_step, result)

            if step.t == "worked" and step.we:
                we_key = step.we.replace("WE.", "")
                if not spec.WE or we_key not in spec.WE:
                    result.add_error(f"{ctx_step}: WE reference '{step.we}' not found in WE definitions")
                else:
                    we = spec.WE[we_key]
                    we_ctx = f"{ctx_step} WE '{we_key}'"
                    # Rule 9: WE has 3-4 steps
                    if len(we.steps) < 3 or len(we.steps) > 4:
                        result.add_error(f"{we_ctx}: expected 3-4 steps, found {len(we.steps)}")
                    # Check inline checks
                    has_inline_check = any(s.check is not None for s in we.steps)
                    if not has_inline_check:
                        result.add_error(f"{we_ctx}: missing inline check")
                    # Check each inline check
                    for wi, ws in enumerate(we.steps):
                        if ws.check:
                            _check_option_set(ws.check, f"{we_ctx} step[{wi}] inline check", result)
                    # Check end-of-WE check
                    _check_option_set(we.check, f"{we_ctx} end check", result)

            if step.t == "solve" and step.sl:
                sl_key = step.sl.replace("SOLVE.", "")
                if not spec.SOLVE or sl_key not in spec.SOLVE:
                    result.add_error(f"{ctx_step}: SOLVE reference '{step.sl}' not found")

            if step.t == "dd_match":
                if not step.pairs or len(step.pairs) < 4 or len(step.pairs) > 5:
                    result.add_error(f"{ctx_step}: dd_match needs 4-5 pairs, found {len(step.pairs) if step.pairs else 0}")

            # Rule 11: Warn if interactive step without instructions
            if step.t in ("dd_build", "dd_match", "ix_pizza", "ix_bar", "ix_area", "ix_slider"):
                if not step.instruction:
                    result.add_warning(f"{ctx_step}: interactive step without instruction text")

    # Rule 12: storage_key format (enforced by schema pattern)
    # Already validated by Pydantic

    return result


def validate_spec_file(path: str) -> ValidationResult:
    """Load and validate a chapter_spec.json from disk."""
    import json
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return validate_chapter_spec(data)
