"""Deterministic Hindi Candidate Dictionary Sanitizer & Promoter (FOCUS-UNIT-PHASE-E-001)."""
import re
from typing import Dict, Any, Tuple

NOISE_OR_PII_BLOCKLIST = {
    "10", "1093953298", "12a", "2026", "27", "6413", "3rd",
    "aba", "abaca6413d", "cit", "din", "exm", "exm45", "itba",
    "lucknow", "pan", "shashwat", "shaurya", "shukla", "sub"
}

PAGE1_CANONICAL_WM = {
    "apply": "लागू करना (अप्लाई)",
    "balanced": "संतुलित (बैलेंस्ड)",
    "core": "मूल (कोर)",
    "correctly": "सही ढंग से (करेक्टली)",
    "describes": "वर्णन करता है (डिस्क्राइब्स)",
    "discovery": "खोज (डिस्कवरी)",
    "down": "नीचे (डाउन)",
    "governing": "नियंत्रित करने वाला (गवर्निंग)",
    "hands": "हाथों से / व्यावहारिक (हैंड्स)",
    "interactive": "संवादात्मक (इंटरैक्टिव)",
    "introduction": "परिचय (इंट्रोडक्शन)",
    "key": "मुख्य (की)",
    "mathematical": "गणितीय (मैथमैटिकल)",
    "observe": "अवलोकन करना (ऑब्ज़र्व)",
    "operations": "संक्रियाएँ (ऑपरेशन्स)",
    "page": "पृष्ठ (पेज)",
    "primary": "प्राथमिक (प्राइमरी)",
    "principles": "सिद्धांत (प्रिंसिपल्स)",
    "properties": "गुणधर्म (प्रॉपर्टीज़)",
    "relating": "संबंधित (रिलेटिंग)",
    "remain": "बना रहना (रिमेन)",
    "representations": "निरूपण (रिप्रेज़ेंटेशन्स)",
    "solving": "हल करना (सॉल्विंग)",
    "statement": "कथन (स्टेटमेंट)",
    "transformation": "रूपांतरण (ट्रांसफॉर्मेशन)",
    "verify": "सत्यापित करना (वेरिफाई)"
}

def is_valid_pedagogical_key(word: str) -> bool:
    w = str(word or "").strip().lower()
    if w in NOISE_OR_PII_BLOCKLIST:
        return False
    return bool(re.fullmatch(r"[a-z]{3,24}", w))

def normalize_hindi_translation(trans: str) -> str:
    def _fix_parens(m: re.Match) -> str:
        return f"({m.group(1).replace('-', '')})"
    return re.sub(r"\(([^)]+)\)", _fix_parens, str(trans or "").strip())

def reconcile_candidate_dictionary(
    candidates: Dict[str, Dict[str, Any]],
    defaults_wm: Dict[str, str]
) -> Tuple[Dict[str, Dict[str, Any]], Dict[str, str], Dict[str, int]]:
    sanitized: Dict[str, Dict[str, Any]] = {}
    updated_wm = dict(defaults_wm)
    stats = {"scrubbed": 0, "placeholders_fixed": 0, "promoted": 0}
    for k, meta in sorted(candidates.items()):
        w = k.strip().lower()
        if not is_valid_pedagogical_key(w):
            stats["scrubbed"] += 1
            continue
        trans = str(meta.get("translation", "")).strip()
        if w in PAGE1_CANONICAL_WM:
            trans = PAGE1_CANONICAL_WM[w]
            stats["placeholders_fixed"] += 1
        elif "उपलब्ध नहीं है" in trans or not trans:
            stats["scrubbed"] += 1
            continue
        else:
            trans = normalize_hindi_translation(trans)
        entry = dict(meta)
        entry["translation"] = trans
        sanitized[w] = entry
        if w not in updated_wm:
            updated_wm[w] = trans
            stats["promoted"] += 1
    return sanitized, updated_wm, stats
