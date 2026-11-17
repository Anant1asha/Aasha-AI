"""LLEAgent — Stage 5: LLE (Language Learning Experience) Generation.

For every distinct English word in body text, generates the LLE entry:
  हिंदी_अर्थ (अंग्रेज़ी_उच्चारण_देवनागरी_में)

Reuses the existing 296 WM and 46 CONN dictionary entries from config/defaults.json.
Only generates net-new entries for chapter-specific terms.
Output: lle.json
"""

from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from typing import Any

from .base import BaseAgent

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
You are a Hindi-English bilingual translator specializing in educational content \
for Indian government-school students.

For each English word, provide:
1. The Hindi meaning (Devanagari script)
2. The English pronunciation written in Devanagari script

Format: हिंदी_अर्थ (अंग्रेज़ी_उच्चारण_देवनागरी_में)

Example: "fraction" → "भिन्न (फ्रैक्शन)"
         "numerator" → "अंश (न्यूमरेटर)"

You must respond with valid JSON only matching this structure:
{
  "translations": {
    "word1": "हिंदी (उच्चारण)",
    "word2": "हिंदी (उच्चारण)"
  }
}

Rules:
- Use natural, commonly understood Hindi
- Pronunciation in Devanagari should match how the word sounds in English
- Keep translations concise
- For technical/math terms, use the standard Hindi mathematical term
"""


class LLEAgent(BaseAgent):
    """Generates Hindi translations + phonics for English vocabulary."""

    # Words to skip (articles, prepositions, etc. already in baseline)
    STOP_WORDS = {
        "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "do", "does", "did", "will", "would", "shall",
        "should", "may", "might", "must", "can", "could", "in", "on", "at",
        "to", "for", "of", "with", "by", "from", "up", "about", "into",
        "through", "during", "before", "after", "above", "below", "and",
        "but", "or", "not", "no", "so", "if", "as", "it", "its", "this",
        "that", "these", "those", "i", "you", "he", "she", "we", "they",
        "me", "him", "her", "us", "them", "my", "your", "his", "our", "their",
    }

    def __init__(self, llm, defaults_path: str = "config/defaults.json"):
        super().__init__(name="LLEAgent", stage="lle", llm=llm)
        self.defaults_path = Path(defaults_path)
        self._baseline_wm: dict[str, str] = {}
        self._baseline_conn: dict[str, str] = {}
        self._load_baseline()

    def _load_baseline(self) -> None:
        """Load the baseline WM/CONN dictionaries from config/defaults.json."""
        if self.defaults_path.exists():
            with open(self.defaults_path, "r", encoding="utf-8") as f:
                defaults = json.load(f)
            self._baseline_wm = defaults.get("WM", {})
            self._baseline_conn = defaults.get("CONN", {})

    def _extract_words(self, spec: dict) -> set[str]:
        """Extract all distinct words from body text, questions, and instructions."""
        words = set()

        def extract_from_text(text: str):
            if not text:
                return
            # Remove punctuation and split
            clean = re.sub(r"[^\w\s]", " ", text.lower())
            for word in clean.split():
                word = word.strip()
                if len(word) > 1 and word not in self.STOP_WORDS:
                    words.add(word)

        for node in spec.get("NODES", []):
            for step in node.get("steps", []):
                extract_from_text(step.get("body", ""))
                extract_from_text(step.get("title", ""))
                extract_from_text(step.get("instruction", ""))
                if step.get("q"):
                    extract_from_text(step["q"].get("q", ""))

        # Also from WE definitions
        for we_key, we in spec.get("WE", {}).items():
            extract_from_text(we.get("title", ""))
            extract_from_text(we.get("question", ""))
            for ws in we.get("steps", []):
                extract_from_text(ws.get("text", ""))
                if ws.get("check"):
                    extract_from_text(ws["check"].get("q", ""))

        return words

    def _classify_words(self, words: set[str]) -> tuple[set[str], set[str], set[str]]:
        """Partition words into: in-CONN, in-WM, net-new."""
        conn_words = set()
        wm_words = set()
        new_words = set()

        for word in words:
            if word in self._baseline_conn:
                conn_words.add(word)
            elif word in self._baseline_wm:
                wm_words.add(word)
            else:
                new_words.add(word)

        return conn_words, wm_words, new_words

    def run(self, work_dir: Path, context: dict[str, Any]) -> dict[str, Any]:
        spec = self._read_json(work_dir, "chapter_spec.json")

        # Extract all words
        words = self._extract_words(spec)
        self.log(f"Found {len(words)} distinct words in chapter text")

        # Classify
        conn_words, wm_words, new_words = self._classify_words(words)
        self.log(
            f"Reusing {len(conn_words)} CONN + {len(wm_words)} WM baseline entries, "
            f"{len(new_words)} net-new words to generate"
        )

        # Start with baseline
        lle = {
            "CONN": dict(self._baseline_conn),
            "WM": dict(self._baseline_wm),
        }

        # Generate translations for net-new words
        if new_words:
            word_list = sorted(new_words)

            # Batch in groups of 20
            batch_size = 20
            for i in range(0, len(word_list), batch_size):
                batch = word_list[i : i + batch_size]

                user_prompt = f"""\
Translate these English words to Hindi with pronunciation in Devanagari:

{json.dumps(batch, ensure_ascii=False)}

For each word, provide the Hindi meaning and English pronunciation in Devanagari.
Format: हिंदी (उच्चारण)
"""

                result = self.llm.complete(SYSTEM_PROMPT, user_prompt, temperature=0.2)
                translations = result.get("translations", {})

                for word, translation in translations.items():
                    lle["WM"][word] = translation

                self.log(f"  Batch {i // batch_size + 1}: translated {len(translations)} words")

            # Words that didn't get translated get the fallback
            for word in word_list:
                if word not in lle["WM"]:
                    lle["WM"][word] = "इस शब्द का हिंदी अर्थ अभी उपलब्ध नहीं है"
        else:
            self.log("All words already in baseline dictionary — no LLM calls needed")

        output_path = self._write_json(work_dir, "lle.json", lle)
        self.log(
            f"LLE complete: {len(lle['CONN'])} CONN + {len(lle['WM'])} WM entries"
        )

        return {
            "output_file": str(output_path),
            "conn_count": len(lle["CONN"]),
            "wm_count": len(lle["WM"]),
            "new_words": len(new_words),
        }
