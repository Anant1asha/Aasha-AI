#!/usr/bin/env python3
"""
manage_dictionary.py — Tier 2 Vocabulary Management & Promotion Tool
Annanth Aasha Foundation — Zero-Cost Curriculum Transformation

Commands:
  python manage_dictionary.py list [--lang hi] [--min-freq N]
  python manage_dictionary.py export-prompt [--lang hi]
  python manage_dictionary.py promote [--lang hi] (--all | --words w1 w2 ... | --min-freq N | --file path.json)
  python manage_dictionary.py reject [--lang hi] (--words w1 w2 ... | --file path.json)
  python manage_dictionary.py stats [--lang hi]
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def find_project_root() -> Path:
    """Find root directory containing aasha-pipeline-with-master-json or config."""
    cur = Path(__file__).resolve().parent
    for _ in range(5):
        if (cur / "config" / "defaults.json").exists():
            return cur
        if (cur / "aasha-pipeline-with-master-json" / "config" / "defaults.json").exists():
            return cur / "aasha-pipeline-with-master-json"
        cur = cur.parent
    # Fallback to current working directory
    cwd = Path.cwd()
    if (cwd / "config" / "defaults.json").exists():
        return cwd
    if (cwd / "aasha-pipeline-with-master-json" / "config" / "defaults.json").exists():
        return cwd / "aasha-pipeline-with-master-json"
    return Path.cwd()


def get_config_dir() -> Path:
    root = find_project_root()
    return root / "config"


def get_defaults_path() -> Path:
    return get_config_dir() / "defaults.json"


def get_candidate_path(lang: str) -> Path:
    return get_config_dir() / f"candidate_dictionary_{lang}.json"


def get_lang_dict_path(lang: str) -> Path:
    return get_config_dir() / "dictionaries" / f"{lang}.json"


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading {path}: {e}", file=sys.stderr)
        return {}


def save_json(path: Path, data: dict[str, Any]):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def cmd_stats(args: argparse.Namespace):
    """Print overall dictionary health & counts."""
    lang = args.lang
    defaults = load_json(get_defaults_path())
    candidates = load_json(get_candidate_path(lang))
    
    wm_count = len(defaults.get("WM", {}))
    conn_count = len(defaults.get("CONN", {}))
    candidate_count = len(candidates)
    
    print("\n=======================================================")
    print("       AASHA VOCABULARY BASELINE & QUEUE STATUS        ")
    print("=======================================================")
    print(f" Master Baseline (Hindi defaults.json):")
    print(f"   - Word Meanings (WM)   : {wm_count} verified entries")
    print(f"   - Connectives (CONN)   : {conn_count} verified entries")
    print(f"   - Total Verified Words : {wm_count + conn_count}")
    print("-------------------------------------------------------")
    print(f" Tier 1 Candidate Review Queue ({lang.upper()}):")
    print(f"   - Pending Net-New Words: {candidate_count} waiting for HIL review")
    if candidate_count > 0:
        freq_2plus = sum(1 for c in candidates.values() if c.get("frequency", 1) >= 2)
        print(f"   - High-Value (seen in 2+ chapters): {freq_2plus} words")
    print("=======================================================\n")


def cmd_list(args: argparse.Namespace):
    """List pending candidate words with occurrence metrics."""
    lang = args.lang
    candidates = load_json(get_candidate_path(lang))
    if not candidates:
        print(f"\n[OK] Candidate review queue for '{lang}' is empty. All chapter words are in baseline!")
        return

    min_freq = getattr(args, "min_freq", 1) or 1
    filtered = {
        w: info for w, info in candidates.items()
        if info.get("frequency", 1) >= min_freq
    }

    # Sort by frequency descending, then alphabetical
    sorted_words = sorted(filtered.items(), key=lambda item: (-item[1].get("frequency", 1), item[0]))

    print(f"\nFound {len(sorted_words)} candidate words (filter: min_frequency >= {min_freq}):\n")
    print(f"{'WORD':<20} | {'FREQ':<6} | {'TRANSLATION':<35} | {'SAMPLE CHAPTER'}")
    print("-" * 85)
    for word, info in sorted_words:
        freq = str(info.get("frequency", 1))
        trans = info.get("translation", "")
        chaps = info.get("chapters", [])
        sample_chap = chaps[0] if chaps else "N/A"
        if len(sample_chap) > 20:
            sample_chap = sample_chap[:17] + "..."
        if len(trans) > 33:
            trans = trans[:30] + "..."
        print(f"{word:<20} | {freq:<6} | {trans:<35} | {sample_chap}")
    print("-" * 85)
    print("Tip: Use 'promote' to move verified words to Master Baseline, or 'reject' to remove typos.\n")


def cmd_export_prompt(args: argparse.Namespace):
    """Export pending candidates to a Freebuff review prompt."""
    lang = args.lang
    candidates = load_json(get_candidate_path(lang))
    if not candidates:
        print(f"[!] No candidate words found for '{lang}' to export.")
        return

    # Find project workspace root to place prompt in freebuff_prompts/
    root = find_project_root()
    # Go up if in aasha-pipeline-with-master-json
    workspace_root = root.parent if root.name == "aasha-pipeline-with-master-json" else root
    prompts_dir = workspace_root / "freebuff_prompts"
    prompts_dir.mkdir(parents=True, exist_ok=True)
    prompt_file = prompts_dir / f"review_candidates_{lang}.md"

    # Prepare words
    words_payload = {}
    for word, info in sorted(candidates.items(), key=lambda x: -x[1].get("frequency", 1)):
        words_payload[word] = {
            "current_translation": info.get("translation", ""),
            "frequency": info.get("frequency", 1),
            "chapters": info.get("chapters", [])[:2]
        }

    prompt_content = f"""# Freebuff Vocabulary Review & Sanitation Prompt
**Language:** {lang.upper()}
**Task:** Review the following candidate words extracted from Aasha textbook chapters.
For each word:
1. Verify if it is a valid educational/general term (keep it) or junk/name/typo (mark action: "reject").
2. Check if the regional meaning and pronunciation in brackets is accurate and natural for school students.
3. If accurate, mark action: "approve" and provide the refined "Meaning (Pronunciation)".

```json
{json.dumps(words_payload, indent=2, ensure_ascii=False)}
```

## Instructions for Freebuff CLI:
Return ONLY a valid JSON object with this structure:
```json
{{
  "approved": {{
    "sample_word": "सही_अर्थ (उच्चारण)"
  }},
  "rejected": [
    "typo_or_name_word"
  ]
}}
```
"""
    with open(prompt_file, "w", encoding="utf-8") as f:
        f.write(prompt_content)

    print(f"\n[OK] Generated Freebuff review prompt at:")
    print(f"     {prompt_file}")
    print("\nNext step: Copy that prompt into Freebuff CLI to audit all candidate words for free!\n")


def cmd_promote(args: argparse.Namespace):
    """Promote verified candidate words to Master Baseline."""
    lang = args.lang
    defaults_path = get_defaults_path()
    defaults = load_json(defaults_path)
    candidates_path = get_candidate_path(lang)
    candidates = load_json(candidates_path)

    if not candidates:
        print("[!] Candidate review queue is empty. Nothing to promote.")
        return

    words_to_promote: dict[str, str] = {}

    if getattr(args, "file", None):
        review_data = load_json(Path(args.file))
        # Support either {"approved": {"w": "t"}} or {"w": "t"}
        approved = review_data.get("approved", review_data)
        for w, t in approved.items():
            words_to_promote[w] = t if isinstance(t, str) else t.get("translation", "")
    elif getattr(args, "words", None):
        for w in args.words:
            w_lower = w.lower().strip()
            if w_lower in candidates:
                words_to_promote[w_lower] = candidates[w_lower].get("translation", "")
            else:
                print(f"[!] Warning: '{w_lower}' not found in candidate queue. Skipping.")
    elif getattr(args, "min_freq", None):
        min_f = args.min_freq
        for w, info in candidates.items():
            if info.get("frequency", 1) >= min_f:
                words_to_promote[w] = info.get("translation", "")
    elif getattr(args, "all", False):
        for w, info in candidates.items():
            words_to_promote[w] = info.get("translation", "")
    else:
        print("[!] Please specify --all, --min-freq N, --words [w...], or --file <reviewed.json>")
        return

    if not words_to_promote:
        print("[!] No matching words found to promote.")
        return

    # Add to baseline
    wm = defaults.setdefault("WM", {})
    conn = defaults.setdefault("CONN", {})
    promoted_count = 0

    for word, trans in words_to_promote.items():
        if word not in wm and word not in conn:
            wm[word] = trans
            promoted_count += 1
        elif word in wm:
            # Update existing
            wm[word] = trans
            promoted_count += 1
        # Remove from candidate queue
        candidates.pop(word, None)

    # Update counts
    counts = defaults.setdefault("baseline_dictionary_counts", {})
    counts["WM"] = len(wm)
    counts["CONN"] = len(conn)

    save_json(defaults_path, defaults)
    save_json(candidates_path, candidates)

    print(f"\n[SUCCESS] Successfully promoted {promoted_count} words to Master Baseline!")
    print(f"          Baseline (defaults.json) now has {len(wm)} WM + {len(conn)} CONN words.")
    print(f"          Remaining candidates in queue: {len(candidates)}\n")


def cmd_reject(args: argparse.Namespace):
    """Remove junk words (typos, student names) from candidate queue."""
    lang = args.lang
    candidates_path = get_candidate_path(lang)
    candidates = load_json(candidates_path)

    if not candidates:
        print("[!] Candidate review queue is empty.")
        return

    words_to_reject = []
    if getattr(args, "file", None):
        review_data = load_json(Path(args.file))
        words_to_reject = review_data.get("rejected", [])
    elif getattr(args, "words", None):
        words_to_reject = [w.lower().strip() for w in args.words]
    else:
        print("[!] Please specify --words [w...] or --file <path.json>")
        return

    rejected_count = 0
    for w in words_to_reject:
        if w in candidates:
            candidates.pop(w)
            rejected_count += 1

    save_json(candidates_path, candidates)
    print(f"\n[OK] Removed {rejected_count} rejected words from candidate queue.")
    print(f"     Remaining candidates in queue: {len(candidates)}\n")


def main():
    parser = argparse.ArgumentParser(description="Tier 2 Vocabulary Management & Promotion Tool")
    parser.add_argument("--lang", default="hi", help="Target language code (default: hi)")
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # stats
    subparsers.add_parser("stats", help="Display dictionary statistics")

    # list
    list_p = subparsers.add_parser("list", help="List pending candidate words")
    list_p.add_argument("--min-freq", type=int, default=1, help="Filter by minimum frequency (default: 1)")

    # export-prompt
    subparsers.add_parser("export-prompt", help="Export candidates to Freebuff review prompt")

    # promote
    promote_p = subparsers.add_parser("promote", help="Promote candidate words to Master Baseline")
    promote_p.add_argument("--all", action="store_true", help="Promote all candidates in queue")
    promote_p.add_argument("--min-freq", type=int, help="Promote words seen at least N times")
    promote_p.add_argument("--words", nargs="+", help="Specific words to promote")
    promote_p.add_argument("--file", help="Path to JSON file of reviewed words")

    # reject
    reject_p = subparsers.add_parser("reject", help="Reject unwanted words from candidate queue")
    reject_p.add_argument("--words", nargs="+", help="Specific words to reject")
    reject_p.add_argument("--file", help="Path to JSON file with 'rejected' list")

    args = parser.parse_args()
    if not args.command:
        cmd_stats(args)
        cmd_list(args)
        return

    if args.command == "stats":
        cmd_stats(args)
    elif args.command == "list":
        cmd_list(args)
    elif args.command == "export-prompt":
        cmd_export_prompt(args)
    elif args.command == "promote":
        cmd_promote(args)
    elif args.command == "reject":
        cmd_reject(args)


if __name__ == "__main__":
    main()
