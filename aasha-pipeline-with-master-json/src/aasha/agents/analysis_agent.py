"""AnalysisAgent — Stage 2: Content Analysis.

Analyzes the raw PDF extract using an LLM to identify concepts, worked examples,
quiz opportunities, interactive visual opportunities, and key vocabulary.
Output: pedagogy_map.json
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from .base import BaseAgent
from ..exercise import ExerciseExtractor

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
You are an expert pedagogue for any curriculum board (e.g. NCERT, CBSE, ICSE, State Boards).
You analyze textbook content and identify the pedagogical structure of a chapter.

Your task: given the raw text extracted from a textbook chapter, identify:
1. The chapter's core concepts (3-5 will become Nodes)
2. Candidate worked examples (problems with their solution approach)
3. Quiz opportunities (points where a check-for-understanding fits)
4. Interactive visual opportunities (where a pizza/bar/area/slider model would help)
5. Key vocabulary (terms needing translations beyond common words)

You must respond with valid JSON only. The JSON must have this structure:
{
  "chapter_title": "string",
  "concepts": [
    {"name": "string", "summary": "string", "key_ideas": ["string"], "difficulty": "easy|medium|hard"}
  ],
  "worked_examples": [
    {"problem": "string", "approach": "string", "concept": "string"}
  ],
  "quiz_opportunities": [
    {"concept": "string", "context": "string"}
  ],
  "visual_opportunities": [
    {"concept": "string", "suggested_model": "pizza|bar|area|slider|numline"}
  ],
  "vocabulary": ["string"]
}

Rules:
- Identify 3-5 core concepts only.
- Concepts should be at the right difficulty level for the given grade (K-10).
- Each concept should be independently teachable.
- Vocabulary should include domain-specific terms (not common words like "the", "is").
"""


class AnalysisAgent(BaseAgent):
    """Analyzes raw PDF extract to identify concepts and opportunities."""

    def __init__(self, llm):
        super().__init__(name="AnalysisAgent", stage="analyze", llm=llm)

    def run(self, work_dir: Path, context: dict[str, Any]) -> dict[str, Any]:
        raw_extract = self._read_json(work_dir, "raw_extract.json")

        subject = context.get("subject", "math")
        grade = context.get("grade", 4)
        board = context.get("board", "NCERT")

        # Classify subject domain using profiles module (if available)
        # Note: Added as per requirements, we attempt to get domain
        domain = subject
        try:
            from ..profiles import get_domain
            domain = get_domain(subject, grade)
        except ImportError:
            pass

        # Extract 100% of exercises
        extractor = ExerciseExtractor()
        extracted_exercises = extractor.extract(raw_extract)
        exercises_list = [ex.to_dict() for ex in extracted_exercises]

        # Build user prompt from extracted text
        pages_text = []
        for page in raw_extract.get("pages", []):
            pages_text.append(f"--- Page {page['page_num']} ---\n{page['text'][:3000]}")

        full_text = "\n\n".join(pages_text[:20])  # Limit to first 20 pages
        if len(full_text) > 30000:
            full_text = full_text[:30000] + "\n[...truncated...]"

        user_prompt = f"""\
Subject: {subject} (Domain: {domain})
Grade: {grade}
Board: {board}

Extracted text from the textbook chapter:

{full_text}

Analyze this chapter and identify its pedagogical structure. Focus on:
1. The 3-5 core concepts that should become learning nodes
2. Worked examples that demonstrate each concept
3. Where quizzes would naturally fit
4. Where interactive visuals (pizza/bar/area/slider) would help understanding
5. Key vocabulary terms specific to this chapter

Remember: this is for students in Grade {grade} ({board}). \
Keep language simple and concepts age-appropriate.
"""

        self.log(f"Analyzing content for {subject} Grade {grade} ({board})...")
        content_map = self.llm.complete(SYSTEM_PROMPT, user_prompt)

        # Ensure required fields
        content_map.setdefault("chapter_title", "Untitled Chapter")
        content_map.setdefault("subject", subject)
        content_map.setdefault("grade", grade)
        content_map.setdefault("board", board)
        content_map.setdefault("concepts", [])
        content_map.setdefault("worked_examples", [])
        content_map.setdefault("quiz_opportunities", [])
        content_map.setdefault("visual_opportunities", [])
        content_map.setdefault("vocabulary", [])
        content_map["exercises"] = exercises_list

        # Validate concepts count
        if len(content_map["concepts"]) < 3:
            self.log(f"WARNING: Only {len(content_map['concepts'])} concepts identified (need 3-5)")

        output_path = self._write_json(work_dir, "pedagogy_map.json", content_map)
        self.log(
            f"Generated {len(content_map['concepts'])} concepts, "
            f"{len(content_map['worked_examples'])} worked examples, "
            f"{len(content_map['vocabulary'])} vocabulary terms, "
            f"{len(exercises_list)} exercises extracted"
        )

        return {
            "output_file": str(output_path),
            "concept_count": len(content_map["concepts"]),
            "example_count": len(content_map["worked_examples"]),
            "exercise_count": len(exercises_list),
        }
