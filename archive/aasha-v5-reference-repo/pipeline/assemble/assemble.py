"""
Stage 7 — Assemble HTML. See README.md for the 8-placeholder injection contract.

Pure logic, no LLM calls, no network — this stage is the mechanical
placeholder swap described in ARCHITECTURE.md. It never modifies the engine
JS/CSS around the placeholders.
"""
from __future__ import annotations

import json
from pathlib import Path

TEMPLATE_PATH = Path(__file__).resolve().parent.parent.parent / "template" / "v5-engine-template.html"


def assemble(chapter_spec: dict, lle: dict, template_path: str | None = None) -> str:
    tpl = Path(template_path or TEMPLATE_PATH).read_text(encoding="utf-8")

    chapter = chapter_spec.get("chapter", {})
    levels = chapter_spec.get("LEVELS")
    badges = chapter_spec.get("BADGES")
    if not badges:
        raise ValueError("chapter_spec.BADGES is required (3-5 chapter-specific badges) "
                          "— see config/defaults.json BADGES_TEMPLATE for the shape.")

    def j(obj) -> str:
        return json.dumps(obj, ensure_ascii=False)

    fills = {
        "{{CHAPTER_TITLE}}": chapter.get("title", "Untitled Chapter"),
        "{{WM_JSON}}": j(lle.get("WM", {})),
        "{{CONN_JSON}}": j(lle.get("CONN", {})),
        "{{LEVELS_JSON}}": j(levels) if levels else j([]),  # prefer assemble_with_defaults()
                                                             # so this always has real tiers
        "{{BADGES_JSON}}": j(badges),
        "{{WE_JSON}}": j(chapter_spec.get("WE", {})),
        "{{SOLVE_JSON}}": j(chapter_spec.get("SOLVE", {})),
        "{{CONTENT_JSON}}": j(chapter_spec.get("NODES", [])),
    }

    out = tpl
    missing = [k for k in fills if k not in out]
    if missing:
        raise ValueError(f"Template is missing expected placeholders: {missing}. "
                          f"Do not hand-edit template/v5-engine-template.html.")
    for k, v in fills.items():
        out = out.replace(k, v)

    if "{{" in out and "}}" in out:
        leftover = [l for l in out.splitlines() if "{{" in l]
        raise ValueError(f"Unfilled placeholder(s) remain after assembly: {leftover[:3]}")

    return out


def assemble_with_defaults(chapter_spec: dict, lle: dict, defaults: dict,
                            template_path: str | None = None) -> str:
    """Convenience wrapper: fills LEVELS from config/defaults.json when the
    chapter spec doesn't override it, matching the assemble/README.md rule."""
    spec = json.loads(json.dumps(chapter_spec))
    spec.setdefault("LEVELS", defaults.get("LEVELS"))
    merged_lle = {"WM": {**defaults.get("WM", {}), **lle.get("WM", {})},
                  "CONN": {**defaults.get("CONN", {}), **lle.get("CONN", {})}}
    return assemble(spec, merged_lle, template_path)


def save(html: str, out_path: str) -> None:
    Path(out_path).write_text(html, encoding="utf-8")
