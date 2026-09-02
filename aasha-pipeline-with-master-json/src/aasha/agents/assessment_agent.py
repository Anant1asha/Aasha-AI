"""AssessmentAgent — Stage 4: Assessment Generation.

For every quiz, VQ, solve step, and WE check, generates the question text,
3-4 options, exactly one correct option (c:true), and a misconception
explanation (m) for every wrong option. Also checks for answer leakage.
Output: updated chapter_spec.json (assessments filled in)
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from .base import BaseAgent

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
You are an expert assessment designer for Indian government-school students.
You create quiz questions, visual questions, and worked-example checks that \
test conceptual understanding, NOT rote memorization.

CRITICAL RULES FOR OPTIONS:
1. Every question must have exactly 3-4 options.
2. Exactly ONE option must be correct (c: true).
3. Every WRONG option must have a misconception explanation (m field) that:
   - Is a full sentence the child can read
   - Explains WHY that specific option is wrong
   - NEVER states or implies the correct answer
   - Is specific to the misconception that option represents
4. The correct option's m field must be an empty string "".
5. Wrong options must be plausible distractors tied to specific misconceptions,
   not random wrong answers.

You must respond with valid JSON only matching this structure:
{
  "assessments": [
    {
      "location": "NODES[0].steps[3].q",
      "opts": [
        {"t": "correct answer text", "c": true, "m": ""},
        {"t": "wrong answer 1", "c": false, "m": "explanation of why this is wrong"},
        {"t": "wrong answer 2", "c": false, "m": "explanation of why this is wrong"},
        {"t": "wrong answer 3", "c": false, "m": "explanation of why this is wrong"}
      ]
    }
  ]
}

The "location" field tells you where in the spec this assessment goes.
Generate options for EVERY assessment location listed in the request.
"""


class AssessmentAgent(BaseAgent):
    """Generates all assessments (quizzes, VQs, solves, WE checks)."""

    def __init__(self, llm):
        super().__init__(name="AssessmentAgent", stage="assess", llm=llm)

    def _collect_assessment_locations(self, spec: dict) -> list[dict]:
        """Find all locations in the spec that need options generated."""
        locations = []

        for n_idx, node in enumerate(spec.get("NODES", [])):
            for s_idx, step in enumerate(node.get("steps", [])):
                loc_prefix = f"NODES[{n_idx}].steps[{s_idx}]"

                if step.get("t") == "quiz":
                    if step.get("q") and step["q"].get("opts") is None:
                        locations.append({
                            "location": f"{loc_prefix}.q",
                            "type": "quiz",
                            "question": step["q"].get("q", ""),
                        })

                elif step.get("t") == "vq":
                    if step.get("q") and step["q"].get("opts") is None:
                        vq_info = {
                            "location": f"{loc_prefix}.q",
                            "type": "vq",
                            "question": step["q"].get("q", ""),
                        }
                        if step["q"].get("visual"):
                            vq_info["visual"] = step["q"]["visual"]
                        if step["q"].get("parts"):
                            vq_info["parts"] = step["q"]["parts"]
                        if step["q"].get("shaded"):
                            vq_info["shaded"] = step["q"]["shaded"]
                        locations.append(vq_info)

                elif step.get("t") == "worked":
                    we_ref = step.get("we", "").replace("WE.", "")
                    we = spec.get("WE", {}).get(we_ref)
                    if we:
                        # WE inline checks
                        for wi, ws in enumerate(we.get("steps", [])):
                            if ws.get("check") and ws["check"].get("opts") is None:
                                locations.append({
                                    "location": f"WE.{we_ref}.steps[{wi}].check",
                                    "type": "we_inline",
                                    "question": ws["check"].get("q", ""),
                                    "context": ws.get("text", ""),
                                })
                        # WE end check
                        if we.get("check") and we["check"].get("opts") is None:
                            locations.append({
                                "location": f"WE.{we_ref}.check",
                                "type": "we_end",
                                "question": we["check"].get("q", ""),
                                "context": we.get("question", ""),
                            })

        return locations

    def _apply_assessments(self, spec: dict, assessments: list[dict]) -> dict:
        """Apply generated assessments back into the spec."""
        applied = 0
        for assessment in assessments:
            location = assessment.get("location", "")
            opts = assessment.get("opts")

            if not opts or not location:
                continue

            # Validate: exactly one correct
            correct_count = sum(1 for o in opts if o.get("c"))
            if correct_count != 1:
                logger.warning(f"Skipping {location}: expected 1 correct, found {correct_count}")
                continue

            # Ensure m fields
            for o in opts:
                if o.get("c"):
                    o["m"] = ""
                elif not o.get("m"):
                    o["m"] = "This option is not correct. Think about the concept again."

            # Navigate to the location and set opts
            self._set_opts_at_location(spec, location, opts)
            applied += 1

        return spec

    def _set_opts_at_location(self, spec: dict, location: str, opts: list[dict]) -> None:
        """Set the opts array at the given location string in the spec."""
        try:
            if location.startswith("NODES["):
                # Parse: NODES[n].steps[s].q
                import re
                match = re.match(r"NODES\[(\d+)\]\.steps\[(\d+)\]\.(.+)", location)
                if match:
                    n_idx, s_idx, rest = int(match.group(1)), int(match.group(2)), match.group(3)
                    target = spec["NODES"][n_idx]["steps"][s_idx]
                    if rest == "q":
                        target["q"]["opts"] = opts
            elif location.startswith("WE."):
                # Parse: WE.key.steps[i].check or WE.key.check
                import re
                match = re.match(r"WE\.([^[]+)\.steps\[(\d+)\]\.check", location)
                if match:
                    we_key, step_idx = match.group(1), int(match.group(2))
                    spec["WE"][we_key]["steps"][step_idx]["check"]["opts"] = opts
                    return
                match = re.match(r"WE\.([^[]+)\.check", location)
                if match:
                    we_key = match.group(1)
                    spec["WE"][we_key]["check"]["opts"] = opts
        except (KeyError, IndexError, TypeError) as e:
            logger.warning(f"Could not apply assessment at {location}: {e}")

    def _check_answer_leakage(self, spec: dict) -> list[str]:
        """Scan every m field for substring overlap with the correct option."""
        leaks = []

        def check_opts(opts: list[dict], context: str):
            correct = [o for o in opts if o.get("c")]
            correct_text = correct[0]["t"].lower() if correct else ""
            for o in opts:
                if not o.get("c") and o.get("m"):
                    if correct_text and len(correct_text) > 3:
                        if correct_text in o["m"].lower():
                            leaks.append(f"{context}: misconception leaks answer")

        for n_idx, node in enumerate(spec.get("NODES", [])):
            for s_idx, step in enumerate(node.get("steps", [])):
                ctx = f"Node[{n_idx}] step[{s_idx}]"
                if step.get("q") and step["q"].get("opts"):
                    check_opts(step["q"]["opts"], ctx)

        for we_key, we in spec.get("WE", {}).items():
            for wi, ws in enumerate(we.get("steps", [])):
                if ws.get("check") and ws["check"].get("opts"):
                    check_opts(ws["check"]["opts"], f"WE.{we_key} step[{wi}]")
            if we.get("check") and we["check"].get("opts"):
                check_opts(we["check"]["opts"], f"WE.{we_key} end check")

        return leaks

    def _build_gamified_assessment(self, exercises: list[dict]) -> dict:
        """Convert extracted exercises to gamified format with 3 levels."""
        gamified = {
            "levels": {
                "warmup": [],
                "deep_dive": [],
                "boss": []
            }
        }
        for ex in exercises:
            diff = ex.get("difficulty", "recall")
            # Map difficulty to level
            level = "warmup"
            if diff in ["application"]:
                level = "deep_dive"
            elif diff in ["critical_thinking"]:
                level = "boss"
            
            gamified["levels"][level].append({
                "type": ex.get("type", "unknown"),
                "question": ex.get("question", ""),
                "options": ex.get("options", []),
                "answer": ex.get("answer", "")
            })
        return gamified

    def run(self, work_dir: Path, context: dict[str, Any]) -> dict[str, Any]:
        spec = self._read_json(work_dir, "chapter_spec.json")
        
        if (work_dir / "pedagogy_map.json").exists():
            content_map = self._read_json(work_dir, "pedagogy_map.json")
        else:
            content_map = self._read_json(work_dir, "content_map.json")

        grade = context.get("grade", 4)
        subject = context.get("subject", "math")

        # Handle gamified assessment generation from extracted exercises
        exercises = content_map.get("exercises", [])
        if exercises:
            spec["GAMIFIED_ASSESSMENT"] = self._build_gamified_assessment(exercises)
            self.log(f"Added {len(exercises)} exercises to GAMIFIED_ASSESSMENT (3 levels)")

        # Collect all assessment locations
        locations = self._collect_assessment_locations(spec)

        if not locations:
            self.log("No assessments to generate (all opts already filled)")
            # Still write the spec if we added GAMIFIED_ASSESSMENT
            output_path = self._write_json(work_dir, "chapter_spec.json", spec)
            return {"output_file": str(output_path), "assessment_count": 0}

        self.log(f"Generating {len(locations)} assessments...")

        # Batch: split into chunks to avoid huge prompts
        batch_size = 5
        total_generated = 0
        
        import concurrent.futures

        def process_batch(batch_idx, batch):
            user_prompt = f"""\
Subject: {subject}
Grade: {grade}

Chapter spec (for context):
{json.dumps(spec.get('chapter', {}), ensure_ascii=False)}

Content map concepts:
{json.dumps(content_map.get('concepts', [])[:5], ensure_ascii=False)}

Generate options for these {len(batch)} assessment locations:

{json.dumps(batch, ensure_ascii=False, indent=2)}

For each location, create 3-4 options with exactly ONE correct answer.
Every wrong option must have a misconception explanation that NEVER reveals \
the correct answer. Options must be age-appropriate for Grade {grade}.
"""
            result = self.llm.complete(SYSTEM_PROMPT, user_prompt)
            return batch_idx, result.get("assessments", [])

        batches = [locations[i : i + batch_size] for i in range(0, len(locations), batch_size)]
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(len(batches), 10) if batches else 1) as executor:
            futures = [executor.submit(process_batch, idx, b) for idx, b in enumerate(batches)]
            for future in concurrent.futures.as_completed(futures):
                batch_idx, assessments = future.result()
                spec = self._apply_assessments(spec, assessments)
                total_generated += len(assessments)
                self.log(f"  Batch {batch_idx + 1}: generated {len(assessments)} assessments")

        # Check for answer leakage
        leaks = self._check_answer_leakage(spec)
        if leaks:
            self.log(f"WARNING: Found {len(leaks)} potential answer leaks in misconceptions")
            for leak in leaks[:5]:
                self.log(f"  - {leak}")
        else:
            self.log("Misconception leakage check: 0 leaks")

        output_path = self._write_json(work_dir, "chapter_spec.json", spec)
        self.log(f"Total assessments generated: {total_generated}")

        return {
            "output_file": str(output_path),
            "assessment_count": total_generated,
            "leak_count": len(leaks),
        }
