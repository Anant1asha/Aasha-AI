"""DesignAgent — Stage 3: Learning Design.

Maps the content map to the v5 NODES/steps structure or full-synthesis structure.
Output: chapter_spec.json (structure only — assessments and LLE not yet filled)
"""

from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from typing import Any

from .base import BaseAgent
from ..schemas.validator import validate_chapter_spec
from ..plugins.bundler import get_plugin_registry

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_V5 = """\
You are an expert instructional designer for the Aasha v5 gamified HTML engine.
You structure textbook content into a gamified learning chapter.

The v5 engine uses a NODES/steps structure:
- 3-5 concept Nodes, each containing an ordered list of Steps
- Each step has a type (t) from these 13 types:
  intro, text, quiz, vq, worked, solve, dd_build, dd_match,
  ix_pizza, ix_bar, ix_area, ix_slider, video, progress, phet

The proven chapter flow per node is:
  Intro → Text → Interactive Visual → Worked Example → Quiz → ... → Progress

Worked Examples (WE) are defined separately and referenced by key.

You must respond with valid JSON only matching this structure:
{
  "chapter": {
    "title": "string",
    "subject": "math|science|english|evs",
    "grade": <integer 3-8>,
    "storage_key": "aasha_<lowercase_id>_v5",
    "emoji": "emoji string"
  },
  "BADGES": [
    {"id": "string", "name": "string", "ic": "emoji", "desc": "string"}
  ],
  "WE": {
    "we_<key>": {
      "title": "string",
      "question": "string",
      "steps": [
        {"text": "string", "c": "blue|green", "check": null},
        {"text": "string", "c": "blue", "check": {"q": "string", "opts": null}},
        {"text": "string", "c": "green", "final": true}
      ],
      "check": {"q": "string", "opts": null}
    }
  },
  "SOLVE": {},
  "NODES": [
    {
      "title": "string",
      "emoji": "emoji",
      "steps": [
        {"t": "intro", "hero": "data:image/svg+xml,..."},
        {"t": "text", "title": "string", "body": "string"},
        {"t": "ix_bar", "instruction": "string", "parts": <int>},
        {"t": "worked", "we": "WE.we_<key>"},
        {"t": "quiz", "q": {"q": "string", "opts": null}},
        {"t": "progress", "xp": <int>, "next": true}
      ]
    }
  ]
}

CRITICAL RULES:
- The LAST node's FINAL step must be {"t": "progress", "xp": N} WITHOUT "next": true.
- All other progress steps must have "next": true.
- Every quiz and WE check must have "opts": null (filled in by the AssessmentAgent).
- WE steps must be 3-4, with at least one having a "check" field.
- Leave all "opts" and "check.opts" as null — they are filled by the next stage.
- Do NOT write actual option text — just the question text and structure.
- For the intro step, use a simple SVG hero image as the "hero" field.
- storage_key must match: aasha_[a-z0-9]+_v5
"""

SYSTEM_PROMPT_SYNTHESIS = """\
You are an expert instructional designer for the Aasha full-synthesis engine.
You structure textbook content into a modern, plugin-based learning chapter.

You have access to the following plugin registry, which provides different interactive components:
{plugin_registry}

Create an engaging sequence of nodes and steps using these plugins where appropriate.
Respond with valid JSON matching the full-synthesis specification.
"""

class DesignAgent(BaseAgent):
    """Structures content into the v5 NODES/steps shape or full-synthesis."""

    def __init__(self, llm):
        super().__init__(name="DesignAgent", stage="design", llm=llm)

    def _create_hero_svg(self, emoji: str, title: str) -> str:
        """Create a simple inline SVG hero image."""
        import base64
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120" viewBox="0 0 200 120">
  <rect width="200" height="120" fill="#dbeafe" rx="16"/>
  <text x="100" y="55" font-size="48" text-anchor="middle">{emoji}</text>
  <text x="100" y="90" font-size="14" font-weight="bold" text-anchor="middle" fill="#1e3a5f">{title[:30]}</text>
</svg>'''
        b64 = base64.b64encode(svg.encode("utf-8")).decode("ascii")
        return f"data:image/svg+xml;base64,{b64}"

    def _post_process(self, spec: dict, content_map: dict, subject: str, grade: int) -> dict:
        """Post-process the LLM output to fix common issues."""
        # Ensure chapter metadata
        spec.setdefault("chapter", {})
        spec["chapter"].setdefault("title", content_map.get("chapter_title", "Untitled"))
        spec["chapter"]["subject"] = spec["chapter"].get("subject", subject)
        spec["chapter"]["grade"] = spec["chapter"].get("grade", grade)

        # Fix storage_key if invalid
        sk = spec["chapter"].get("storage_key", "")
        if not re.match(r"^aasha_[a-z0-9]+_v5$", sk):
            title_slug = re.sub(r"[^a-z0-9]", "", spec["chapter"]["title"].lower())[:10]
            spec["chapter"]["storage_key"] = f"aasha_{title_slug}_v5"

        # Ensure BADGES
        if not spec.get("BADGES") or len(spec.get("BADGES", [])) < 3:
            spec["BADGES"] = [
                {"id": "badge_1", "name": "First Steps", "ic": "🎯", "desc": "Completed the first node"},
                {"id": "badge_2", "name": "Halfway Hero", "ic": "⚡", "desc": "Reached the middle node"},
                {"id": "badge_3", "name": "Chapter Champion", "ic": "🏆", "desc": "Completed the chapter"},
            ]

        # Add hero images to intro steps if missing
        for node in spec.get("NODES", []):
            emoji = node.get("emoji", "📖")
            for step in node.get("steps", []):
                if step.get("t") == "intro" and not step.get("hero"):
                    step["hero"] = self._create_hero_svg(emoji, node.get("title", ""))

        # Ensure WE and SOLVE exist
        spec.setdefault("WE", {})
        spec.setdefault("SOLVE", {})

        # Normalize WE keys, steps inline checks, and end checks
        if spec.get("WE"):
            normalized_we = {}
            for k, v in spec["WE"].items():
                norm_k = re.sub(r"^we_we_", "we_", k)
                if not norm_k.startswith("we_"):
                    norm_k = f"we_{norm_k}"

                # Ensure steps have valid structure and at least one step has an inline check
                has_inline = False
                for s in v.get("steps", []):
                    if s.get("check"):
                        if s["check"].get("q") in ("string", "", None):
                            s["check"]["q"] = f"What was identified in this step of {v.get('title', 'the problem')}?"
                        s["check"]["opts"] = None  # to be filled by AssessmentAgent
                        has_inline = True
                if not has_inline and v.get("steps") and len(v["steps"]) > 1:
                    # Provide an inline check scaffolding on step 1 (0-indexed)
                    v["steps"][1]["check"] = {
                        "q": f"What is the key calculation or rule in this step?",
                        "opts": None,
                    }

                # Ensure end check
                if not v.get("check"):
                    v["check"] = {
                        "q": f"What is the key takeaway from {v.get('title', 'this worked example')}?",
                        "opts": None,
                    }
                elif v["check"].get("q") in ("string", "", None):
                    v["check"]["q"] = f"What is the key takeaway from {v.get('title', 'this worked example')}?"
                v["check"]["opts"] = None

                normalized_we[norm_k] = v
            spec["WE"] = normalized_we

            # Synchronize steps in NODES referencing WE
            we_keys = list(spec["WE"].keys())
            we_idx = 0
            for node in spec.get("NODES", []):
                for step in node.get("steps", []):
                    if step.get("t") == "worked":
                        curr_ref = step.get("we", "")
                        norm_ref = re.sub(r"^WE\.we_we_", "WE.we_", curr_ref)
                        if not norm_ref.startswith("WE."):
                            norm_ref = f"WE.{norm_ref}"
                        key_only = norm_ref.replace("WE.", "")
                        if key_only not in spec["WE"]:
                            # Bind to available WE entry
                            assigned_key = we_keys[we_idx % len(we_keys)] if we_keys else "we_basic"
                            step["we"] = f"WE.{assigned_key}"
                            we_idx += 1
                        else:
                            step["we"] = norm_ref

        # Fix final node's last step
        if spec.get("NODES"):
            last_node = spec["NODES"][-1]
            if last_node.get("steps"):
                last_step = last_node["steps"][-1]
                if last_step.get("t") == "progress":
                    last_step.pop("next", None)
                elif last_step.get("t") != "progress":
                    # Add a progress step
                    last_node["steps"].append({"t": "progress", "xp": 50})

        # Ensure all non-final progress steps have next: true
        for i, node in enumerate(spec.get("NODES", [])):
            for step in node.get("steps", []):
                if step.get("t") == "progress" and i < len(spec["NODES"]) - 1:
                    step["next"] = True

        return spec

    def run(self, work_dir: Path, context: dict[str, Any]) -> dict[str, Any]:
        # Support pedagogy_map.json or fallback to content_map.json
        if (work_dir / "pedagogy_map.json").exists():
            content_map = self._read_json(work_dir, "pedagogy_map.json")
        else:
            content_map = self._read_json(work_dir, "content_map.json")

        subject = context.get("subject", "math")
        grade = context.get("grade", 4)
        mode = context.get("design_mode", "v5-engine")

        if mode == "full-synthesis":
            try:
                registry = get_plugin_registry()
                registry_str = json.dumps(registry, indent=2)
            except Exception:
                registry_str = "{}"
            system_prompt = SYSTEM_PROMPT_SYNTHESIS.replace("{plugin_registry}", registry_str)
            user_prompt = f"""\
Content map for the chapter:
{json.dumps(content_map, ensure_ascii=False, indent=2)}

Design the chapter structure using the full-synthesis approach and available plugins.
"""
        else:
            system_prompt = SYSTEM_PROMPT_V5
            user_prompt = f"""\
Content map for the chapter:

{json.dumps(content_map, ensure_ascii=False, indent=2)}

Design the chapter structure following the v5 NODES/steps format. \
Create {len(content_map.get('concepts', []))} nodes (one per concept, 3-5 total). \
Sequence steps per the proven flow: Intro → Text → Interactive Visual → \
Worked Example → Quiz → Progress.

For worked examples, create WE definitions with 3-4 steps each. \
Leave all "opts" as null — they will be filled by the AssessmentAgent.

Remember:
- storage_key must match aasha_[a-z0-9]+_v5
- The last node's final step must be progress WITHOUT next: true
- All other progress steps need next: true
- Include 3-5 BADGES tied to node completion
"""

        self.log(f"Designing chapter structure (mode: {mode})...")
        spec = self.llm.complete(system_prompt, user_prompt)

        # Post-process
        if mode == "v5-engine":
            spec = self._post_process(spec, content_map, subject, grade)

        # Validate structure
        if mode == "v5-engine":
            result = validate_chapter_spec(spec)
            if result.errors:
                self.log(f"Validation errors (structural): {len(result.errors)}")
                for err in result.errors[:5]:
                    self.log(f"  - {err}")
            if result.warnings:
                self.log(f"Validation warnings: {len(result.warnings)}")
            validation_errors = len(result.errors)
        else:
            validation_errors = 0

        output_path = self._write_json(work_dir, "chapter_spec.json", spec)
        node_count = len(spec.get("NODES", []))
        step_count = sum(len(n.get("steps", [])) for n in spec.get("NODES", []))
        we_count = len(spec.get("WE", {}))
        self.log(
            f"Designed {node_count} nodes, {step_count} steps, {we_count} worked examples"
        )

        return {
            "output_file": str(output_path),
            "node_count": node_count,
            "step_count": step_count,
            "we_count": we_count,
            "validation_errors": validation_errors,
        }
