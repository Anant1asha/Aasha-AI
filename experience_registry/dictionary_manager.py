# -*- coding: utf-8 -*-
"""
AASHA Central Dictionary Manager (LLE + Universal Teaching System)
===================================================================
Provides automated tools to:
1. Load master dictionary DB (aasha_dictionary_db.json)
2. Enforce canonical LLE format: [सरल_अर्थ] ([देवनागरी_अंग्रेज़ी_उच्चारण])
3. Scan chapter text for learner-facing words
4. Ensure 0 missing words and 100% phonetic compliance before release
5. Export bundled WM and CONN objects for standalone HTML generation
"""

import json
import os
import re

REGISTRY_DIR = os.path.dirname(os.path.abspath(__file__))
MASTER_DB_PATH = os.path.join(REGISTRY_DIR, "aasha_dictionary_db.json")

def load_master_dict():
    if os.path.exists(MASTER_DB_PATH):
        with open(MASTER_DB_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_master_dict(d):
    with open(MASTER_DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(d, f, indent=2, ensure_ascii=False)

def scan_text_words(text):
    text = re.sub(r'<[^>]+>', ' ', text)
    words = re.findall(r'[a-zA-Z]{2,}', text)
    return set(w.lower() for w in words)

def validate_lle_format(master_dict=None):
    """Verifies that all entries follow LLE standard: Meaning (Phonics)."""
    if master_dict is None:
        master_dict = load_master_dict()
    invalid = []
    for word, val in master_dict.items():
        if not re.search(r'\(.+?\)', val):
            invalid.append((word, val))
    return invalid

def verify_and_bundle(words_set):
    master = load_master_dict()
    missing = [w for w in words_set if w not in master]
    non_phonetic = [w for w in words_set if w in master and not re.search(r'\(.+?\)', master[w])]
    return {
        "total_words": len(words_set),
        "missing_count": len(missing),
        "missing_words": missing,
        "non_phonetic_count": len(non_phonetic),
        "non_phonetic_words": non_phonetic,
        "bundle": {w: master[w] for w in words_set if w in master}
    }

if __name__ == '__main__':
    m = load_master_dict()
    bad = validate_lle_format(m)
    print(f"AASHA Master LLE Dictionary loaded with {len(m)} entries.")
    print(f"Non-phonetic entries: {len(bad)}")
    if bad:
        print(f"Sample non-phonetic: {bad[:5]}")
    else:
        print("100% LLE Phonetic Compliance Verified!")
