#!/usr/bin/env python3
"""
AASHA AIOS — System 1 Task Classifier powered by Laya (v0.4.7)
Evaluates incoming prompts & requests against AASHA task types with:
  1. Microsecond Indic script detection (pure Python)
  2. Non-autoregressive System 1 calibrated classification (zero token cost)
  3. Interactive/CLI mode + persistent daemon mode for sub-30ms repeat latency
"""

import os
import sys
import json
import time
import argparse

# Suppress TensorFlow & transformers noise
os.environ["USE_TF"] = "0"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

try:
    import laya
except ImportError:
    laya = None

INDIC_SCRIPTS = {
    "devanagari", "bengali", "gurmukhi", "gujarati",
    "oriya", "tamil", "telugu", "kannada", "malayalam"
}

AASHA_TASK_QUESTIONS = {
    "task_type": {
        "type": "choice",
        "instructions": "Which task category best describes this request for the AASHA education system?",
        "criteria": {
            "coding": "programming, TypeScript, JavaScript, CSS, HTML, simulation code, bug fixing, building or compiling chapter files, scripts",
            "assessment": "generating quizzes, test questions, misconception distractors, 4-tier hints H1-H4, exam items, answer keys",
            "design": "pedagogical structure, curriculum syllabus, chapter planning, contract design, learning sequence",
            "analysis": "explaining concepts, economics theories, science phenomena, definitions, textbook explanations",
            "lle": "language translation, vocabulary dictionary, bilingual word-tap popups, translation into Indic languages"
        }
    },
    "difficulty": {
        "type": "score",
        "instructions": "How intellectually complex is this educational request?",
        "criteria": [
            "trivial: direct definition or one-line lookup",
            "easy: basic single-concept explanation",
            "moderate: multi-step analytical explanation or structured code",
            "hard: full-chapter synthesis, complex interactive engine, or deep pedagogical framework"
        ]
    },
    "needs_tools": {
        "type": "noul",
        "instructions": "Does this task require executing code, tools, file editing, or browser automation?"
    }
}

_ROUTER_INSTANCE = None

def get_router():
    global _ROUTER_INSTANCE
    if _ROUTER_INSTANCE is None and laya is not None:
        _ROUTER_INSTANCE = laya.Router()
    return _ROUTER_INSTANCE

def classify(text: str) -> dict:
    t0 = time.perf_counter()
    text = (text or "").strip()
    if not text:
        return {
            "task_type": "analysis",
            "confidence": 1.0,
            "script": "unknown",
            "is_indic": False,
            "source": "fallback_empty",
            "latency_ms": 0.0
        }

    # 1. Fast-path pure-Python script detection (<1ms)
    script = "latin"
    is_indic = False
    if laya is not None and hasattr(laya, "detect_script"):
        try:
            script = laya.detect_script(text)
            is_indic = script.lower() in INDIC_SCRIPTS
        except Exception:
            pass

    # If Indic text, route directly to 'lle-indic' for bilingual Indic synthesis
    if is_indic:
        latency = (time.perf_counter() - t0) * 1000.0
        return {
            "task_type": "lle-indic",
            "confidence": 0.99,
            "script": script,
            "is_indic": True,
            "source": "laya_script_detector",
            "latency_ms": round(latency, 2)
        }

    # 2. Check for multimodal / vision requests
    lower = text.lower()
    if any(marker in lower for marker in [".png", ".jpg", ".jpeg", ".webp", "data:image/", "multimodal vision", "inspect screenshot"]):
        latency = (time.perf_counter() - t0) * 1000.0
        return {
            "task_type": "vision",
            "confidence": 0.95,
            "script": script,
            "is_indic": False,
            "source": "multimodal_pattern",
            "latency_ms": round(latency, 2)
        }

    # 3. System 1 Laya Decision
    if laya is not None and hasattr(laya, "decide"):
        try:
            router = get_router()
            decision = laya.decide(router, text, questions=AASHA_TASK_QUESTIONS, return_details=True)
            
            # Extract answers
            answers = decision.answers if hasattr(decision, "answers") else (decision.get("answers", {}) if isinstance(decision, dict) else {})
            
            task_choice = "analysis"
            task_conf = 0.5
            task_probs = {}
            
            if "task_type" in answers:
                ans = answers["task_type"]
                task_choice = ans.get("choice", "analysis")
                task_conf = ans.get("answer_confidence", ans.get("confidence", 0.5))
                task_probs = ans.get("probabilities", {})
            
            # Map 'lle' to 'lle' or 'lle-indic' based on script
            if task_choice == "lle" and is_indic:
                task_choice = "lle-indic"

            diff_score = 1.0
            if "difficulty" in answers:
                diff_score = answers["difficulty"].get("score", 1.0)

            needs_tools_val = False
            if "needs_tools" in answers:
                noul = answers["needs_tools"].get("noul", 0.0)
                needs_tools_val = noul > 0.5

            latency = (time.perf_counter() - t0) * 1000.0
            return {
                "task_type": task_choice,
                "confidence": round(float(task_conf), 4),
                "probabilities": {k: round(float(v), 4) for k, v in task_probs.items()},
                "difficulty_score": round(float(diff_score), 2),
                "needs_tools": needs_tools_val,
                "script": script,
                "is_indic": is_indic,
                "source": "laya_system1_decision",
                "latency_ms": round(latency, 2)
            }
        except Exception as e:
            # Safe heuristic fallback if model fails
            pass

    # 4. Fallback fast heuristic
    task_type = "analysis"
    if any(k in lower for k in ["function", "const ", "class ", "interface ", "import ", "typescript", "canvas", "compile chapter", "bug", "syntax"]):
        task_type = "coding"
    elif any(k in lower for k in ["quiz", "mcq", "misconception", "hint h1", "distractor", "assessment", "question bank"]):
        task_type = "assessment"
    elif any(k in lower for k in ["syllabus", "curriculum", "pedagogy", "lesson plan", "spec", "proposal"]):
        task_type = "design"

    latency = (time.perf_counter() - t0) * 1000.0
    return {
        "task_type": task_type,
        "confidence": 0.70,
        "script": script,
        "is_indic": is_indic,
        "source": "heuristic_fallback",
        "latency_ms": round(latency, 2)
    }

def main():
    parser = argparse.ArgumentParser(description="AASHA System 1 Task Classifier via Laya")
    parser.add_argument("--text", type=str, help="Single text prompt to classify")
    parser.add_argument("--daemon", action="store_true", help="Run as JSON stdio stream daemon")
    args = parser.parse_args()

    if args.daemon:
        # Reconfigure stdio streams for unbuffered, low-latency line-by-line IPC
        stdin_reconf = getattr(sys.stdin, "reconfigure", None)
        if callable(stdin_reconf):
            stdin_reconf(line_buffering=True)
        stdout_reconf = getattr(sys.stdout, "reconfigure", None)
        if callable(stdout_reconf):
            stdout_reconf(line_buffering=True)

        # Preload router
        get_router()
        sys.stdout.write(json.dumps({"status": "ready"}) + "\n")
        sys.stdout.flush()
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            req_id = None
            try:
                payload = json.loads(line)
                req_id = payload.get("id")
                req_type = payload.get("type")

                # Handle ping/heartbeat health check
                if req_type == "ping":
                    pong_resp = {"status": "ok", "type": "pong"}
                    if req_id is not None:
                        pong_resp["id"] = req_id
                    sys.stdout.write(json.dumps(pong_resp) + "\n")
                    sys.stdout.flush()
                    continue

                # Handle graceful exit signal
                if req_type == "exit":
                    sys.stdout.write(json.dumps({"status": "exiting", "id": req_id}) + "\n")
                    sys.stdout.flush()
                    break

                text = payload.get("text", "")
                result = classify(text)
                if req_id is not None:
                    result["id"] = req_id
                sys.stdout.write(json.dumps(result) + "\n")
                sys.stdout.flush()
            except Exception as ex:
                err_resp = {"error": str(ex)}
                if req_id is not None:
                    err_resp["id"] = req_id
                sys.stdout.write(json.dumps(err_resp) + "\n")
                sys.stdout.flush()
    elif args.text:
        res = classify(args.text)
        print(json.dumps(res, indent=2))
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
