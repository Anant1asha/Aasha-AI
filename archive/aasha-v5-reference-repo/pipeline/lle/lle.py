"""Stage 5 — LLE (Hindi word scaffolding). See README.md for the full contract."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from llm_adapter import LLMAdapter  # noqa: E402

SYSTEM_PROMPT = """You are generating lle_translation entries: Hindi meaning plus
Devanagari phonetic transliteration for English words used in an NCERT math
chapter. Input is a JSON list of English words. Respond with a JSON object
mapping each word to a string in the exact format:
"हिंदी_अर्थ (अंग्रेज़ी_उच्चारण_देवनागरी_में)" """

FALLBACK = "इस शब्द का हिंदी अर्थ अभी उपलब्ध नहीं है"

_WORD_RE = re.compile(r"[a-zA-Z']+")


def _extract_words(spec: dict) -> set[str]:
    words: set[str] = set()

    def walk(obj):
        if isinstance(obj, str):
            for w in _WORD_RE.findall(obj):
                words.add(w.lower())
        elif isinstance(obj, dict):
            for v in obj.values():
                walk(v)
        elif isinstance(obj, list):
            for v in obj:
                walk(v)

    walk(spec.get("NODES", []))
    walk(spec.get("WE", {}))
    walk(spec.get("SOLVE", {}))
    return words


def generate_lle(chapter_spec: dict, baseline_wm: dict, baseline_conn: dict,
                  adapter: LLMAdapter) -> dict:
    all_words = _extract_words(chapter_spec)
    net_new = sorted(w for w in all_words if w not in baseline_wm and w not in baseline_conn)

    new_entries: dict[str, str] = {}
    if net_new:
        # Batch into chunks of 40 words per call to keep prompts bounded.
        for i in range(0, len(net_new), 40):
            chunk = net_new[i:i + 40]
            try:
                result = adapter.complete(SYSTEM_PROMPT, json.dumps(chunk, ensure_ascii=False))
                for w in chunk:
                    new_entries[w] = result.get(w, FALLBACK)
            except Exception:
                for w in chunk:
                    new_entries[w] = FALLBACK  # graceful degradation, per NFR-3

    wm = {**baseline_wm, **{w: v for w, v in new_entries.items() if w not in baseline_conn}}
    conn = dict(baseline_conn)  # CONN classification is a fixed curated list, not LLM-inferred
    return {"WM": wm, "CONN": conn, "net_new_count": len(net_new), "reused_count": len(all_words) - len(net_new)}


def save(lle: dict, out_path: str) -> None:
    Path(out_path).write_text(json.dumps(lle, ensure_ascii=False, indent=2), encoding="utf-8")
