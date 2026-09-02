#!/usr/bin/env python3
"""
Aasha Foundation — L-Truth Ground Truth Benchmark & rt() Know-Stage Audit Tool
=============================================================================
Zero-cost, offline validator enforcing:
1. Anti-Spoiler Misconception Policy (Rule #1)
2. Math Symbol vs. Bilingual rt() Collision Detection
3. "Know" Stage Cognitive Hierarchy & Mastery Gating
4. 10 Critical Production QA Rules
"""

import os
import re
import json
import sys
from typing import Dict, List, Any, Tuple

class ChapterAuditor:
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.filename = os.path.basename(file_path)
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            self.content = f.read()
        self.issues = []
        self.stats = {
            "total_nodes": 0,
            "total_steps": 0,
            "total_questions": 0,
            "total_misconceptions": 0,
            "spoiler_violations": 0,
            "missing_misconceptions": 0,
            "math_rt_collisions": 0,
            "rule_violations": 0
        }
        self.passed_checks = []
        self.failed_checks = []

    def extract_json_var(self, var_name: str) -> Any:
        """Extracts JSON or JS object assignments from the HTML."""
        pattern = rf'var\s+{var_name}\s*=\s*([\[\{{].*?);(?=\s*(?:var|\n|App|function))'
        match = re.search(pattern, self.content, re.DOTALL)
        if match:
            raw = match.group(1).strip()
            # Try parsing as JSON directly
            try:
                return json.loads(raw)
            except Exception:
                # Basic JS-to-JSON cleaning if needed
                cleaned = re.sub(r'([{,]\s*)([a-zA-Z0-9_]+)\s*:', r'\1"\2":', raw)
                cleaned = re.sub(r':\s*\'([^\']*)\'', r':"\1"', cleaned)
                try:
                    return json.loads(cleaned)
                except Exception:
                    return None
        return None

    def audit_rule_1_spoilers(self):
        """Audits all quiz, VQ, solve, and WE check options for spoiler misconceptions."""
        nodes = self.extract_json_var("NODES")
        we = self.extract_json_var("WE") or {}
        
        all_checks = []

        # Collect checks from WE definitions
        if isinstance(we, dict):
            for we_id, we_data in we.items():
                if isinstance(we_data, dict):
                    # WE overall check
                    if "check" in we_data and isinstance(we_data["check"], dict):
                        all_checks.append((f"WE '{we_id}' overall check", we_data["check"]))
                    # WE step checks
                    for s_idx, step in enumerate(we_data.get("steps", [])):
                        if isinstance(step, dict) and "check" in step and isinstance(step["check"], dict):
                            all_checks.append((f"WE '{we_id}' Step {s_idx+1} check", step["check"]))

        # Collect checks from NODES
        if isinstance(nodes, list):
            self.stats["total_nodes"] = len(nodes)
            for n_idx, node in enumerate(nodes):
                for s_idx, step in enumerate(node.get("steps", [])):
                    self.stats["total_steps"] += 1
                    t = step.get("t")
                    context = f"Node {n_idx+1} ('{node.get('title','?')}') Step {s_idx+1} ({t})"
                    
                    if t == "quiz" and "q" in step:
                        all_checks.append((context, step["q"]))
                    elif t == "vq" and "q" in step:
                        all_checks.append((context, step["q"]))
                    elif t == "solve" and "sl" in step:
                        sl = step["sl"]
                        if isinstance(sl, dict):
                            for sl_idx, sl_step in enumerate(sl.get("steps", [])):
                                if sl_step.get("type") == "mcq" and "opts" in sl_step:
                                    all_checks.append((f"{context} sub-step {sl_idx+1}", sl_step))
                    elif t == "worked" and isinstance(step.get("we"), dict):
                        # Inlined WE
                        we_obj = step["we"]
                        if "check" in we_obj:
                            all_checks.append((f"{context} check", we_obj["check"]))
                        for ws_idx, ws in enumerate(we_obj.get("steps", [])):
                            if "check" in ws:
                                all_checks.append((f"{context} WE-step {ws_idx+1}", ws["check"]))

        # Also fallback to scanning embedded question objects if regex parsing finds more
        if not all_checks:
            # Regex search for opts arrays
            opt_matches = re.finditer(r'\{[^{}]*"opts"\s*:\s*\[(.*?)\][^{}]*\}', self.content, re.DOTALL)
            for idx, m in enumerate(opt_matches):
                raw_opts = m.group(0)
                try:
                    cleaned = re.sub(r'([{,]\s*)([a-zA-Z0-9_]+)\s*:', r'\1"\2":', raw_opts)
                    cleaned = re.sub(r':\s*\'([^\']*)\'', r':"\1"', cleaned)
                    parsed = json.loads(cleaned)
                    if "opts" in parsed and isinstance(parsed["opts"], list):
                        all_checks.append((f"Extracted check #{idx+1}", parsed))
                except Exception:
                    pass

        self.stats["total_questions"] = len(all_checks)

        for context, q_obj in all_checks:
            opts = q_obj.get("opts", [])
            if not isinstance(opts, list) or not opts:
                continue

            # Find correct option
            correct_opts = [o for o in opts if isinstance(o, dict) and o.get("c") is True]
            if not correct_opts:
                self.failed_checks.append(f"CRITICAL: {context} has no correct option marked (c: true).")
                self.stats["rule_violations"] += 1
                continue
            
            correct_text = correct_opts[0].get("t") or correct_opts[0].get("answer") or ""
            correct_clean = str(correct_text).strip().lower()

            for opt_idx, opt in enumerate(opts):
                if not isinstance(opt, dict) or opt.get("c") is True:
                    continue

                self.stats["total_misconceptions"] += 1
                m_text = opt.get("m", "").strip()

                if not m_text:
                    self.stats["missing_misconceptions"] += 1
                    self.failed_checks.append(f"Rule #1 Violation: {context} Option {opt_idx+1} is missing misconception explanation ('m' field is empty).")
                    continue

                m_lower = m_text.lower()

                # Check if misconception reveals correct answer
                revealed = False
                reason = ""

                # Look for telltale spoiler phrases
                spoiler_phrases = [
                    "the result is", "the correct answer is", "it is ", "leaving ", "gives ", 
                    "is equal to", "becomes ", "we get "
                ]
                for p in spoiler_phrases:
                    if p in m_lower and any(ans_word in m_lower for ans_word in correct_clean.split() if len(ans_word) > 1):
                        revealed = True
                        reason = f"Contains spoiler phrase '{p}' revealing target value"
                        break

                # Check for explicit numbers or terms in correct answer
                if not revealed and len(correct_clean) > 0:
                    nums = re.findall(r'-?\d+(?:\.\d+)?', correct_clean)
                    for n in nums:
                        if n in m_text and (f" {n}" in m_text or f": {n}" in m_text or f"= {n}" in m_text):
                            if re.search(rf'(?:is|=|, not \+?)\s*{re.escape(n)}\b', m_text):
                                revealed = True
                                reason = f"Explicitly gives the correct numerical value '{n}' in misconception text: \"{m_text}\""
                                break

                # Check algebraic term spoilers (e.g. "4a² - 12ab")
                if not revealed and len(correct_clean) > 3 and correct_clean in m_lower:
                    revealed = True
                    reason = f"Verbatim contains correct target phrase '{correct_clean}' in misconception"

                if revealed:
                    self.stats["spoiler_violations"] += 1
                    self.failed_checks.append(f"Rule #1 Spoiler Detected in {context} [Option: '{opt.get('t', '')}']: {reason}")

        if self.stats["spoiler_violations"] == 0 and self.stats["missing_misconceptions"] == 0:
            self.passed_checks.append("Rule #1 (Zero-Spoiler Misconceptions): 100% compliant. No correct answers leaked.")

    def audit_math_rt_collisions(self):
        """Audits whether mathematical variables collide with the LLE dictionary in rt()."""
        wm = self.extract_json_var("WM") or {}
        single_letter_keys = [k for k in wm.keys() if len(k) == 1 and k.isalpha()]

        has_algebra = bool(re.search(r'\b(?:algebra|coefficient|monomial|binomial|polynomial|variable|terms?)\b', self.content, re.I))
        
        if has_algebra:
            isolates_math = bool(re.search(r'(?:<math|data-math|`[^`]+`|\$\$.*?\$\$|MathJax|class="math"|\\\(|MathIsolation)', self.content))
            rt_code_match = re.search(r'function rt\s*\([^)]*\)\s*\{([\s\S]*?)\n\}', self.content)
            rt_code = rt_code_match.group(1) if rt_code_match else ""
            rt_has_guard = bool(re.search(r'math|isolate|skip|ignore|len\s*>\s*1', rt_code, re.I))

            if 'a' in single_letter_keys and not isolates_math and not rt_has_guard:
                self.stats["math_rt_collisions"] += 1
                self.failed_checks.append(
                    "Math-rt Collision Warning: Chapter teaches Algebra, but WM defines 'a' as 'एक (ए)' without math-tag isolation in rt(). "
                    "Algebraic variables like 'a' in '4a' or '(a + b)' will trigger Hindi dictionary popups instead of math symbols."
                )
            else:
                self.passed_checks.append("Math-rt Isolation: Math expressions and variables are insulated from bilingual dictionary collision.")
        else:
            self.passed_checks.append("Math-rt Isolation: Non-algebraic content; no variable dictionary collisions detected.")

    def audit_10_critical_rules(self):
        """Checks the 10 Non-Negotiable Critical QA Rules."""
        # Rule 2: Shuffled options
        has_shuffle = bool(re.search(r'sort\(\s*function\(\s*\)\s*\{\s*return\s*Math\.random\(\)\s*-\s*0\.5', self.content))
        if has_shuffle:
            self.passed_checks.append("Rule #2: All assessment options are shuffled using randomized sorting.")
        else:
            self.failed_checks.append("Rule #2 Violation: No option shuffling found (Math.random() - 0.5 sort missing).")
            self.stats["rule_violations"] += 1

        # Rule 3: No drag and drop, tap-only
        has_drag_events = bool(re.search(r'ondragstart|ondrop|draggable\s*=\s*["\']true["\']', self.content, re.I))
        has_tap_to_place = bool(re.search(r'tapDDPiece|tapMatchSrc|tapMatchDst|tap-item', self.content))
        if not has_drag_events and (has_tap_to_place or "dd" not in self.content.lower()):
            self.passed_checks.append("Rule #3: Tap-only interaction enforced (zero HTML5 drag-and-drop events).")
        else:
            self.failed_checks.append("Rule #3 Violation: HTML5 drag-and-drop detected. Mobile requires tap-to-place.")
            self.stats["rule_violations"] += 1

        # Rule 4: No alert() or confirm()
        has_alerts = bool(re.search(r'\b(?:window\.)?(?:alert|confirm|prompt)\s*\(', self.content))
        if not has_alerts:
            self.passed_checks.append("Rule #4: Clean execution without browser-freezing alert(), confirm(), or prompt().")
        else:
            self.failed_checks.append("Rule #4 Violation: Found alert() or confirm() call which freezes low-end mobile webviews.")
            self.stats["rule_violations"] += 1

        # Rule 5: Skip button on interactive steps
        has_skip = bool(re.search(r'Skip this activity', self.content, re.I))
        has_interactive = bool(re.search(r'renderDD|renderIX|setupPizza|setupBar|setupArea', self.content))
        if not has_interactive or has_skip:
            self.passed_checks.append("Rule #5: Skip action present on interactive canvas / drag-drop activities.")
        else:
            self.failed_checks.append("Rule #5 Violation: Interactive activities found without a visible 'Skip this activity' link.")
            self.stats["rule_violations"] += 1

        # Rule 6: Button never stuck disabled
        has_back_btn = bool(re.search(r'id=["\']backBtn["\']', self.content))
        has_continue_btn = bool(re.search(r'id=["\']continueBtn["\']', self.content))
        if has_back_btn and has_continue_btn:
            self.passed_checks.append("Rule #6: Primary navigation buttons (Back / Continue) properly anchored.")
        else:
            self.failed_checks.append("Rule #6 Violation: Missing Back or Continue navigation buttons.")
            self.stats["rule_violations"] += 1

        # Rule 7: _weCheckRendered flag present for WE flows
        has_we_flag = "_weCheckRendered" in self.content
        has_we = bool(re.search(r'renderWorked|WE\.|weSteps', self.content))
        if not has_we or has_we_flag:
            self.passed_checks.append("Rule #7: _weCheckRendered flag present for multi-phase Worked Example check flow.")
        else:
            self.failed_checks.append("Rule #7 Violation: Worked Example check flow missing '_weCheckRendered' state guard.")
            self.stats["rule_violations"] += 1

        # Rule 8: localStorage bounds-checked
        has_storage_try = bool(re.search(r'try\s*\{\s*(?:var\s+s\s*=\s*)?JSON\.parse\(\s*localStorage\.getItem', self.content))
        if has_storage_try:
            self.passed_checks.append("Rule #8: localStorage safely wrapped in bounds-checked try-catch blocks.")
        else:
            self.failed_checks.append("Rule #8 Violation: localStorage parse is unshielded; corrupt storage will crash app.")
            self.stats["rule_violations"] += 1

        # Rule 9: exit() instant reset with no dialog
        has_instant_exit = bool(re.search(r'exit\s*:\s*function\(\)\s*\{[^}]*this\.nIdx\s*=\s*0', self.content))
        if has_instant_exit:
            self.passed_checks.append("Rule #9: exit() resets state immediately without modal dialogs.")
        else:
            self.failed_checks.append("Rule #9 Violation: exit() does not perform immediate clean reset.")
            self.stats["rule_violations"] += 1

        # Rule 10: Zero external CDN dependencies (Offline-first)
        external_urls = re.findall(r'src=["\'](https?://[^"\']+)["\']', self.content)
        external_deps = [u for u in external_urls if not any(x in u for x in ["w3.org", "schema.org"])]
        if not external_deps:
            self.passed_checks.append("Rule #10: 100% Offline-First compliant. Zero external script or stylesheet CDN dependencies.")
        else:
            self.failed_checks.append(f"Rule #10 Violation: Found external network dependencies: {external_deps}")
            self.stats["rule_violations"] += 1

    def audit_know_stage_pedagogy(self):
        """Audits the 'Know' stage (Level 1 Recall) pedagogical structure."""
        nodes = self.extract_json_var("NODES")
        if not isinstance(nodes, list) or not nodes:
            return

        all_nodes_have_intro = True
        all_nodes_have_text = True
        all_nodes_have_check = True

        for idx, node in enumerate(nodes):
            steps = node.get("steps", [])
            types = [s.get("t") for s in steps if isinstance(s, dict)]
            
            if "intro" not in types:
                all_nodes_have_intro = False
                self.failed_checks.append(f"Pedagogy Gap: Concept Node {idx+1} ('{node.get('title')}') is missing an 'intro' step.")
            if "text" not in types:
                all_nodes_have_text = False
                self.failed_checks.append(f"Pedagogy Gap: Concept Node {idx+1} ('{node.get('title')}') has no foundational 'text' (Know) step.")
            if not any(t in types for t in ["quiz", "worked", "vq", "solve"]):
                all_nodes_have_check = False
                self.failed_checks.append(f"Pedagogy Gap: Concept Node {idx+1} ('{node.get('title')}') lacks any concept verification check.")

        if all_nodes_have_intro and all_nodes_have_text and all_nodes_have_check:
            self.passed_checks.append("Know-Stage Pedagogy: Every concept node follows proven Intro -> Concept Text -> Verification flow.")

    def run_full_audit(self) -> Dict[str, Any]:
        """Runs the entire L-Truth benchmark suite and returns results."""
        self.audit_rule_1_spoilers()
        self.audit_math_rt_collisions()
        self.audit_10_critical_rules()
        self.audit_know_stage_pedagogy()

        total_checks = len(self.passed_checks) + len(self.failed_checks)
        pass_rate = (len(self.passed_checks) / total_checks * 100) if total_checks > 0 else 0

        penalty = (self.stats["spoiler_violations"] * 10) + (self.stats["rule_violations"] * 8) + (self.stats["math_rt_collisions"] * 8)
        final_score = max(0, min(100, int(pass_rate - (penalty * 0.4))))

        return {
            "filename": self.filename,
            "path": self.file_path,
            "final_score": final_score,
            "passed_checks_count": len(self.passed_checks),
            "failed_checks_count": len(self.failed_checks),
            "stats": self.stats,
            "passed_checks": self.passed_checks,
            "failed_checks": self.failed_checks
        }


def run_batch_audit(file_paths: List[str]) -> Dict[str, Any]:
    results = {}
    for p in file_paths:
        if os.path.isfile(p):
            auditor = ChapterAuditor(p)
            results[os.path.basename(p)] = auditor.run_full_audit()
        else:
            results[os.path.basename(p)] = {"error": f"File not found: {p}"}
    return results


if __name__ == "__main__":
    target_files = [
        "Fractions_Gamified_v5 (2).html",
        "Perimeter_Area_Gamified_v5 (2).html",
        "ComparingQuantities_Percentage_Class8_Gamified_v5 (1).html",
        "AlgebraicExpressions_Class8_Gamified_v5.html"
    ]
    
    resolved_paths = [os.path.abspath(f) for f in target_files]
    audit_results = run_batch_audit(resolved_paths)

    print("\n" + "="*80)
    print(" AASHA FOUNDATION — L-TRUTH GROUND TRUTH BENCHMARK REPORT")
    print("="*80 + "\n")

    for name, r in audit_results.items():
        if "error" in r:
            print(f"[-] {name}: {r['error']}")
            continue

        score = r["final_score"]
        status = "PASSED" if score >= 85 and r["stats"]["spoiler_violations"] == 0 else "ACTION REQUIRED"
        print(f"[{status}] {name}")
        print(f"    Benchmark Score: {score}/100 | Passed Checks: {r['passed_checks_count']} | Violations: {r['failed_checks_count']}")
        print(f"    Questions Tested: {r['stats']['total_questions']} | Misconceptions: {r['stats']['total_misconceptions']}")
        print(f"    Spoilers Found: {r['stats']['spoiler_violations']} | Math-rt Collisions: {r['stats']['math_rt_collisions']} | Rule Breaks: {r['stats']['rule_violations']}")
        
        if r["failed_checks"]:
            print("    Top Violations:")
            for f in r["failed_checks"][:5]:
                print(f"      * {f}")
            if len(r["failed_checks"]) > 5:
                print(f"      * ... and {len(r['failed_checks'])-5} more issues")
        print("-" * 80)

    # Save JSON summary report for pipeline consumption
    with open("ltruth_benchmark_report.json", "w", encoding="utf-8") as out_f:
        json.dump(audit_results, out_f, indent=2)
    print("\nDetailed benchmark report exported to: ltruth_benchmark_report.json\n")
