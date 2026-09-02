"""LLEAgent — Stage 5: LLE (Language Learning Experience) Generation.

For every distinct English word in body text, generates the LLE entry:
  [Local_meaning] ([English_pronunciation_in_local_script])

Reuses the existing WM and CONN dictionary entries from config/dictionaries/<lang>.json.
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

SYSTEM_PROMPT_TEMPLATE = """\
You are a bilingual translator specializing in educational content \
for Indian government-school students. The target language is {language_name} ({language_code}).

For each English word, provide:
1. The {language_name} meaning (in {script} script)
2. The English pronunciation written in {script} script

Format: {meaning_placeholder} ({pronunciation_placeholder})

Example: "fraction" → "{example_fraction_meaning} ({example_fraction_pronunciation})"

You must respond with valid JSON only matching this structure:
{{
  "translations": {{
    "word1": "{meaning_placeholder} ({pronunciation_placeholder})",
    "word2": "{meaning_placeholder} ({pronunciation_placeholder})"
  }}
}}

Rules:
- Use natural, commonly understood {language_name}
- Pronunciation in {script} should match how the word sounds in English
- Keep translations concise
- For technical/math terms, use the standard {language_name} mathematical term
"""

LANGUAGE_CONFIG = {
    "hi": {
        "name": "Hindi",
        "script": "Devanagari",
        "meaning_placeholder": "हिंदी_अर्थ",
        "pronunciation_placeholder": "अंग्रेज़ी_उच्चारण_देवनागरी_में",
        "example_fraction_meaning": "भिन्न",
        "example_fraction_pronunciation": "फ्रैक्शन",
        "fallback_msg": "इस शब्द का अर्थ अभी उपलब्ध नहीं है"
    },
    "ta": {
        "name": "Tamil",
        "script": "Tamil",
        "meaning_placeholder": "தமிழ்_பொருள்",
        "pronunciation_placeholder": "ஆங்கில_உச்சரிப்பு_தமிழில்",
        "example_fraction_meaning": "பின்னம்",
        "example_fraction_pronunciation": "ஃபிராக்‌ஷன்",
        "fallback_msg": "இந்த வார்த்தையின் பொருள் தற்போது இல்லை"
    },
    "te": {
        "name": "Telugu",
        "script": "Telugu",
        "meaning_placeholder": "తెలుగు_అర్థం",
        "pronunciation_placeholder": "ఆంగ్ల_ఉచ్చారణ_తెలుగులో",
        "example_fraction_meaning": "భిన్నం",
        "example_fraction_pronunciation": "ఫ్రాక్షన్",
        "fallback_msg": "ఈ పదం యొక్క అర్థం ప్రస్తుతం లేదు"
    },
    "mr": {
        "name": "Marathi",
        "script": "Devanagari",
        "meaning_placeholder": "मराठी_अर्थ",
        "pronunciation_placeholder": "इंग्रजी_उच्चार_देवनागरीत",
        "example_fraction_meaning": "अपूर्णांक",
        "example_fraction_pronunciation": "फ्रॅक्शन",
        "fallback_msg": "या शब्दाचा अर्थ सध्या उपलब्ध नाही"
    },
    "bn": {
        "name": "Bengali",
        "script": "Bengali",
        "meaning_placeholder": "বাংলা_অর্থ",
        "pronunciation_placeholder": "ইংরেজি_উচ্চারণ_বাংলায়",
        "example_fraction_meaning": "ভগ্নাংশ",
        "example_fraction_pronunciation": "ফ্র্যাকশন",
        "fallback_msg": "এই শব্দের অর্থ বর্তমানে উপলব্ধ নেই"
    }
}


class LLEAgent(BaseAgent):
    """Generates localized translations + phonics for English vocabulary."""

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

    def __init__(self, llm, dict_dir: str = "config/dictionaries"):
        super().__init__(name="LLEAgent", stage="lle", llm=llm)
        self.dict_dir = Path(dict_dir)

    def _load_baseline(self, lang: str) -> tuple[dict[str, str], dict[str, str]]:
        """Load the baseline WM/CONN dictionaries from config/dictionaries/<lang>.json."""
        baseline_wm, baseline_conn = {}, {}
        
        # Try specific language file
        lang_path = self.dict_dir / f"{lang}.json"
        
        # Fallback for Hindi (which used to be defaults.json)
        if not lang_path.exists() and lang == "hi":
            alt_path = self.dict_dir.parent / "defaults.json"
            if alt_path.exists():
                lang_path = alt_path

        if lang_path.exists():
            with open(lang_path, "r", encoding="utf-8") as f:
                try:
                    defaults = json.load(f)
                    baseline_wm = defaults.get("WM", {})
                    baseline_conn = defaults.get("CONN", {})
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse {lang_path}, using empty dictionaries.")
        else:
            logger.warning(f"Dictionary file {lang_path} not found. Using empty baseline.")

        return baseline_wm, baseline_conn

    def _get_config_dir(self) -> Path:
        """Resolve the root config directory containing dictionaries and defaults."""
        p = self.dict_dir
        if p.is_file():
            return p.parent
        if p.name == "dictionaries":
            return p.parent
        return p

    def _get_candidate_path(self, lang_code: str) -> Path:
        """Get the path to the candidate review queue file for a language."""
        return self._get_config_dir() / f"candidate_dictionary_{lang_code}.json"

    def _stage_candidates(
        self,
        new_words: set[str],
        lle: dict[str, Any],
        lang_code: str,
        chapter_id: str,
        lang_conf: dict[str, Any],
    ) -> int:
        """Tier 1: Stage net-new words to candidate review queue with occurrence metadata."""
        if not new_words:
            return 0

        candidate_path = self._get_candidate_path(lang_code)
        candidates: dict[str, Any] = {}
        if candidate_path.exists():
            try:
                with open(candidate_path, "r", encoding="utf-8") as f:
                    candidates = json.load(f)
            except Exception as e:
                logger.warning(f"Could not read existing candidates from {candidate_path}: {e}")
                candidates = {}

        from datetime import datetime, timezone
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        staged_count = 0
        for word in sorted(new_words):
            translation = lle.get("WM", {}).get(word, "")
            if word not in candidates:
                candidates[word] = {
                    "translation": translation,
                    "frequency": 1,
                    "chapters": [chapter_id] if chapter_id else [],
                    "first_seen": now_str,
                    "last_seen": now_str,
                }
                staged_count += 1
            else:
                candidates[word]["frequency"] = candidates[word].get("frequency", 0) + 1
                chapters = candidates[word].setdefault("chapters", [])
                if chapter_id and chapter_id not in chapters:
                    chapters.append(chapter_id)
                candidates[word]["last_seen"] = now_str
                # If existing candidate was fallback and we now have a translation, update it
                if (
                    candidates[word].get("translation") == lang_conf.get("fallback_msg")
                    and translation != lang_conf.get("fallback_msg")
                ):
                    candidates[word]["translation"] = translation

        try:
            candidate_path.parent.mkdir(parents=True, exist_ok=True)
            with open(candidate_path, "w", encoding="utf-8") as f:
                json.dump(candidates, f, indent=2, ensure_ascii=False)
            self.log(f"Staged {len(new_words)} net-new candidate words to {candidate_path.name}")
        except Exception as e:
            logger.error(f"Failed to write candidate queue to {candidate_path}: {e}")

        return staged_count

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

    def _classify_words(self, words: set[str], baseline_conn: dict, baseline_wm: dict) -> tuple[set[str], set[str], set[str]]:
        """Partition words into: in-CONN, in-WM, net-new."""
        conn_words = set()
        wm_words = set()
        new_words = set()

        for word in words:
            if word in baseline_conn:
                conn_words.add(word)
            elif word in baseline_wm:
                wm_words.add(word)
            else:
                new_words.add(word)

        return conn_words, wm_words, new_words

    def run(self, work_dir: Path, context: dict[str, Any]) -> dict[str, Any]:
        spec = self._read_json(work_dir, "chapter_spec.json")

        # Get language config
        lang_code = context.get("language", "hi")
        if lang_code not in LANGUAGE_CONFIG:
            self.log(f"Warning: Unsupported language '{lang_code}', falling back to 'hi'")
            lang_code = "hi"
            
        lang_conf = LANGUAGE_CONFIG[lang_code]
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
            language_name=lang_conf["name"],
            language_code=lang_code,
            script=lang_conf["script"],
            meaning_placeholder=lang_conf["meaning_placeholder"],
            pronunciation_placeholder=lang_conf["pronunciation_placeholder"],
            example_fraction_meaning=lang_conf["example_fraction_meaning"],
            example_fraction_pronunciation=lang_conf["example_fraction_pronunciation"],
        )

        # Load baseline for this language
        baseline_wm, baseline_conn = self._load_baseline(lang_code)

        # Extract all words
        words = self._extract_words(spec)
        self.log(f"Found {len(words)} distinct words in chapter text")

        # Classify
        conn_words, wm_words, new_words = self._classify_words(words, baseline_conn, baseline_wm)
        self.log(
            f"Reusing {len(conn_words)} CONN + {len(wm_words)} WM baseline entries for '{lang_code}', "
            f"{len(new_words)} net-new words to generate"
        )

        # Start with baseline
        lle = {
            "CONN": dict(baseline_conn),
            "WM": dict(baseline_wm),
        }

        # Generate translations for net-new words
        if new_words:
            word_list = sorted(new_words)

            # Batch in groups of 20
            batch_size = 20
            for i in range(0, len(word_list), batch_size):
                batch = word_list[i : i + batch_size]

                user_prompt = f"""\
Translate these English words to {lang_conf['name']} with pronunciation in {lang_conf['script']} script:

{json.dumps(batch, ensure_ascii=False)}

For each word, provide the {lang_conf['name']} meaning and English pronunciation in {lang_conf['script']} script.
Format: {lang_conf['meaning_placeholder']} ({lang_conf['pronunciation_placeholder']})
"""

                result = self.llm.complete(system_prompt, user_prompt, temperature=0.2)
                translations = result.get("translations", {})

                for word, translation in translations.items():
                    lle["WM"][word] = translation

                self.log(f"  Batch {i // batch_size + 1}: translated {len(translations)} words")

            # Words that didn't get translated get the fallback
            for word in word_list:
                if word not in lle["WM"]:
                    lle["WM"][word] = lang_conf["fallback_msg"]

            # Tier 1 Staging: Stage candidates into review queue
            chapter_id = (
                context.get("title")
                or context.get("job_id")
                or (spec.get("chapter", {}) if isinstance(spec, dict) else {}).get("title")
                or (spec.get("chapter", {}) if isinstance(spec, dict) else {}).get("storage_key")
                or work_dir.name
            )
            self._stage_candidates(new_words, lle, lang_code, str(chapter_id), lang_conf)
        else:
            self.log("All words already in baseline dictionary — no LLM calls needed")

        output_path = self._write_json(work_dir, "lle.json", lle)
        self.log(
            f"LLE complete for {lang_code}: {len(lle['CONN'])} CONN + {len(lle['WM'])} WM entries"
        )

        return {
            "output_file": str(output_path),
            "conn_count": len(lle["CONN"]),
            "wm_count": len(lle["WM"]),
            "new_words": len(new_words),
            "staged_candidates": len(new_words),
            "language": lang_code,
        }


