"""Exercise Extractor — extracts 100% of exercises from a PDF and classifies them.

Extracts end-of-chapter exercises, in-text activities, MCQs, match-the-column,
numerical problems, fill-in-the-blanks, true/false, and short/long answer questions.
Classifies each into difficulty tiers: Recall, Conceptual, Application, Critical Thinking.
"""
from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Exercise detection patterns
EXERCISE_HEADING_PATTERNS = [
    r"Exercise\s+\d+",
    r"Exercises?",
    r"Practice\s+Questions?",
    r"Review\s+Questions?",
    r"Let\s+us\s+Practice",
    r"Try\s+These",
    r"Think\s+and\s+Discuss",
    r"In-text\s+Questions?",
    r"Activity",
    r"Assessment",
]

QUESTION_PATTERNS = {
    "mcq": [
        r"^\(?([a-d])\)\s*(.+)",  # (a) option text
        r"^\(?([A-D])\)\s*(.+)",
        r"^\(?(\d+)\)\s*(.+)",
    ],
    "fill_blank": [
        r"_{2,}",  # underscores
        r"\[____?\]",
        r"Fill\s+in\s+the\s+blanks?",
    ],
    "true_false": [
        r"(True|False)",
        r"T\s*/\s*F",
    ],
    "match_column": [
        r"Match\s+the\s+(following|column)",
        r"Column\s+[AI]\s+.*Column\s+[BI]",
        r"List\s+[AI]\s+.*List\s+[BI]",
    ],
    "numerical": [
        r"^\d+\.\s*(?:Find|Calculate|Compute|Solve|Determine|Evaluate)\s",
        r"^\d+\.\s*.*\d+\s*[+\-*/=]\s*\d+",
        r"^\d+\.\s*.*(?:area|perimeter|volume|speed|distance|time|cost|price)",
    ],
    "short_answer": [
        r"^\d+\.\s*(?:What|Why|How|When|Where|Who|Explain|Define|State|Describe|List|Name)\s",
    ],
    "long_answer": [
        r"^\d+\.\s*(?:Discuss|Elaborate|Analyze|Compare|Contrast|Justify|Prove|Derive)\s",
    ],
}


class ExerciseItem:
    """An extracted exercise from the PDF."""
    def __init__(self, raw_text: str, ex_type: str = "unknown", question: str = "",
                 options: list[str] = None, answer: str = "", page: int = 0,
                 difficulty: str = "recall"):
        self.raw_text = raw_text.strip()
        self.type = ex_type
        self.question = question or raw_text.strip()
        self.options = options or []
        self.answer = answer
        self.page = page
        self.difficulty = difficulty

    def to_dict(self) -> dict:
        return {
            "raw_text": self.raw_text,
            "type": self.type,
            "question": self.question,
            "options": self.options,
            "answer": self.answer,
            "page": self.page,
            "difficulty": self.difficulty,
        }


class ExerciseExtractor:
    """Extracts and classifies exercises from raw PDF text."""

    def extract(self, raw_extract: dict) -> list[ExerciseItem]:
        """Extract all exercises from a raw_extract.json dict."""
        exercises: list[ExerciseItem] = []

        # First, check pre-detected exercises from the ingest agent
        for ex in raw_extract.get("exercises", []):
            for q in ex.get("questions", []):
                item = self._classify_question(q, ex.get("page", 0))
                exercises.append(item)

        # Also scan all page text for question patterns
        seen_text = set()
        for page in raw_extract.get("pages", []):
            page_num = page.get("page_num", 0)
            text = page.get("text", "")

            # Check if this page contains an exercise section
            is_exercise_page = any(
                re.search(pat, text, re.IGNORECASE)
                for pat in EXERCISE_HEADING_PATTERNS
            )

            if is_exercise_page or self._has_numbered_questions(text):
                questions = self._split_questions(text)
                for q in questions:
                    q_clean = q.strip()
                    if len(q_clean) < 10:
                        continue
                    if q_clean in seen_text:
                        continue
                    seen_text.add(q_clean)
                    item = self._classify_question(q_clean, page_num)
                    exercises.append(item)

        logger.info(f"Extracted {len(exercises)} exercises from PDF")
        return exercises

    def _has_numbered_questions(self, text: str) -> bool:
        """Check if text contains numbered questions."""
        return bool(re.search(r"^\s*\d+[\.\)]\s+\S", text, re.MULTILINE))

    def _split_questions(self, text: str) -> list[str]:
        """Split exercise text into individual questions."""
        # Split on numbered questions: "1. ", "2. ", "Q1. ", etc.
        parts = re.split(r"(?:^|\n)\s*(\d+[\.\)]\s+)", text)
        questions = []
        for i in range(1, len(parts) - 1, 2):
            num = parts[i].strip()
            qtext = parts[i + 1].strip() if i + 1 < len(parts) else ""
            if qtext:
                questions.append(f"{num} {qtext}")
        return questions

    def _classify_question(self, text: str, page: int) -> ExerciseItem:
        """Classify a question by type and difficulty."""
        text_lower = text.lower()

        # Detect type
        ex_type = "unknown"

        # Check for MCQ (has options a), b), c), d) or (i), (ii), (iii))
        mcq_opts = re.findall(r"[\(]?([a-dA-D])[\)]\s+(.+?)(?=[\(]?[a-dA-D][\)]|$)", text, re.DOTALL)
        if len(mcq_opts) >= 2:
            ex_type = "mcq"
            opts = [opt[1].strip()[:200] for opt in mcq_opts]
            return ExerciseItem(text, "mcq", text.split("\n")[0], opts, "", page, "recall")

        # Check match the column
        if re.search(r"match\s+the\s+(following|column)", text_lower):
            ex_type = "match_column"

        # Check fill in the blanks
        elif re.search(r"_{2,}|\[.*_.*\]|fill\s+in\s+the\s+blanks?", text_lower):
            ex_type = "fill_blank"

        # Check true/false
        elif re.search(r"true\s+or\s+false|t\s*/\s*f", text_lower):
            ex_type = "true_false"

        # Check numerical
        elif re.search(r"(?:find|calculate|compute|solve|determine|evaluate)\s", text_lower):
            ex_type = "numerical"

        # Check short answer
        elif re.search(r"(?:what|why|how|when|where|who|explain|define|state|describe|list|name)\s", text_lower):
            ex_type = "short_answer"

        # Check long answer
        elif re.search(r"(?:discuss|elaborate|analyze|compare|contrast|justify|prove|derive)\s", text_lower):
            ex_type = "long_answer"

        # Classify difficulty
        difficulty = self._classify_difficulty(text, ex_type)

        return ExerciseItem(text, ex_type, text, [], "", page, difficulty)

    def _classify_difficulty(self, text: str, ex_type: str) -> str:
        """Classify difficulty into recall, conceptual, application, critical_thinking."""
        text_lower = text.lower()

        # Critical thinking: analyze, justify, evaluate, compare, discuss
        if any(w in text_lower for w in ["analyze", "justify", "evaluate", "compare", "contrast", "prove", "derive", "discuss", "elaborate"]):
            return "critical_thinking"

        # Application: calculate, solve, find, compute
        if ex_type == "numerical" or any(w in text_lower for w in ["calculate", "solve", "compute", "find the"]):
            return "application"

        # Conceptual: explain, why, how, describe
        if any(w in text_lower for w in ["explain", "why", "how", "describe", "differentiate"]):
            return "conceptual"

        # Default: recall
        return "recall"

    def to_assessment_level(self, difficulty: str) -> str:
        """Map difficulty tier to assessment level (warmup, deep_dive, boss)."""
        mapping = {
            "recall": "warmup",
            "conceptual": "warmup",
            "application": "deep_dive",
            "critical_thinking": "boss",
        }
        return mapping.get(difficulty, "warmup")
