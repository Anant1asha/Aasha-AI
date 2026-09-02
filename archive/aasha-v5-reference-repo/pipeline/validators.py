"""
validators.py — validates chapter_spec.json against the v5 contract.

Deliberately dependency-free (no `jsonschema` package required) so this runs
anywhere Python 3 runs, including fully offline. It implements the same
contract as schema/chapter_spec.schema.json PLUS the cross-reference rules
that JSON Schema can't express alone (rules 4, 7, 8, 9 in
docs/CHAPTER_SPEC_SCHEMA.md) — this is the validator pipeline/design/README.md
points to.

Usage:
    from validators import validate_chapter_spec
    errors = validate_chapter_spec(spec_dict)
    if errors:
        ...report and fail the stage...
"""
from __future__ import annotations

import re
from typing import Any

STEP_TYPES = {
    "intro", "text", "quiz", "vq", "worked", "solve",
    "dd_build", "dd_match",
    "ix_pizza", "ix_bar", "ix_area", "ix_slider",
    "video", "progress", "phet",
}

STORAGE_KEY_RE = re.compile(r"^aasha_[a-z0-9]+_v5$")


class ValidationError:
    def __init__(self, rule: str, path: str, message: str):
        self.rule = rule
        self.path = path
        self.message = message

    def __repr__(self):
        return f"[{self.rule}] {self.path}: {self.message}"

    def to_dict(self):
        return {"rule": self.rule, "path": self.path, "message": self.message}


def _check_option_set(opt_set: dict, path: str, errors: list[ValidationError]) -> None:
    opts = opt_set.get("opts")
    if not isinstance(opts, list) or not (3 <= len(opts) <= 4):
        errors.append(ValidationError("rule5", path, "option set must have 3-4 opts"))
        return
    correct = [o for o in opts if o.get("c") is True]
    if len(correct) != 1:
        errors.append(ValidationError("rule6", path,
                       f"expected exactly one c:true option, found {len(correct)}"))
        return
    correct_text = correct[0].get("t", "").strip().lower()
    for i, o in enumerate(opts):
        if o.get("c") is False:
            m = o.get("m", "")
            if not m or not m.strip():
                errors.append(ValidationError("rule7", f"{path}.opts[{i}]",
                               "wrong option missing non-empty misconception 'm'"))
            elif correct_text and correct_text in m.strip().lower():
                errors.append(ValidationError("rule7", f"{path}.opts[{i}]",
                               "misconception 'm' appears to leak the correct answer"))


def validate_chapter_spec(spec: dict) -> list[ValidationError]:
    errors: list[ValidationError] = []

    chapter = spec.get("chapter", {})
    for field in ("title", "subject", "grade", "storage_key"):
        if field not in chapter:
            errors.append(ValidationError("structure", "chapter", f"missing '{field}'"))
    storage_key = chapter.get("storage_key", "")
    if storage_key and not STORAGE_KEY_RE.match(storage_key):
        errors.append(ValidationError("rule12", "chapter.storage_key",
                       f"{storage_key!r} does not match ^aasha_[a-z0-9]+_v5$"))

    nodes = spec.get("NODES")
    if not isinstance(nodes, list) or not (3 <= len(nodes) <= 5):
        errors.append(ValidationError("rule1", "NODES", "must be an array of 3-5 nodes"))
        nodes = nodes if isinstance(nodes, list) else []

    we_defs = spec.get("WE", {})
    solve_defs = spec.get("SOLVE", {})

    for ni, node in enumerate(nodes):
        npath = f"NODES[{ni}]"
        if not node.get("title"):
            errors.append(ValidationError("rule2", npath, "missing title"))
        steps = node.get("steps")
        if not isinstance(steps, list) or not steps:
            errors.append(ValidationError("rule2", npath, "steps must be a non-empty array"))
            continue

        for si, step in enumerate(steps):
            spath = f"{npath}.steps[{si}]"
            t = step.get("t")
            if t not in STEP_TYPES:
                errors.append(ValidationError("rule3", spath, f"unknown step type {t!r}"))
                continue

            if t in ("quiz", "vq") and "q" in step:
                _check_option_set(step["q"], f"{spath}.q", errors)

            if t == "worked":
                we_key = step.get("we", "")
                key = we_key.split(".", 1)[-1] if "." in we_key else we_key
                if key not in we_defs:
                    errors.append(ValidationError("rule8", spath,
                                   f"references WE key {we_key!r} not found in WE"))
                else:
                    we = we_defs[key]
                    we_steps = we.get("steps", [])
                    if not (3 <= len(we_steps) <= 4):
                        errors.append(ValidationError("rule9", f"WE.{key}",
                                       "must have 3-4 steps"))
                    if not any(s.get("check") for s in we_steps):
                        errors.append(ValidationError("rule9", f"WE.{key}",
                                       "must have at least one inline check"))
                    if not we.get("check"):
                        errors.append(ValidationError("rule9", f"WE.{key}",
                                       "missing WE-level end check"))
                    else:
                        _check_option_set(we["check"], f"WE.{key}.check", errors)
                    for wsi, ws in enumerate(we_steps):
                        if ws.get("check"):
                            _check_option_set(ws["check"], f"WE.{key}.steps[{wsi}].check", errors)

            if t == "solve":
                sl_key = step.get("sl", "")
                key = sl_key.split(".", 1)[-1] if "." in sl_key else sl_key
                if key not in solve_defs:
                    errors.append(ValidationError("rule9", spath,
                                   f"references SOLVE key {sl_key!r} not found in SOLVE"))
                else:
                    for ssi, sstep in enumerate(solve_defs[key].get("steps", [])):
                        if sstep.get("type") == "mcq" and "opts" in sstep:
                            _check_option_set({"opts": sstep["opts"]},
                                               f"SOLVE.{key}.steps[{ssi}]", errors)

            if t == "dd_match":
                pairs = step.get("pairs", [])
                if not (4 <= len(pairs) <= 5):
                    errors.append(ValidationError("rule11", spath,
                                   "dd_match must have 4-5 pairs"))

        # Rule 4: final node's last step is progress with NO next:true
        if ni == len(nodes) - 1 and steps:
            last = steps[-1]
            if last.get("t") != "progress":
                errors.append(ValidationError("rule4", npath,
                               "final node's last step must be t:'progress'"))
            elif last.get("next") is True:
                errors.append(ValidationError("rule4", npath,
                               "final node's progress step must NOT have next:true"))

    return errors


def format_report(errors: list[ValidationError]) -> str:
    if not errors:
        return "chapter_spec.json: VALID (0 errors)"
    lines = [f"chapter_spec.json: {len(errors)} error(s)"]
    lines += [f"  - {e}" for e in errors]
    return "\n".join(lines)
