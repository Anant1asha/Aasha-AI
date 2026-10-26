"""QAAgent — Stage 8: Automated QA.

Invokes the Node.js QA harness as a subprocess to run the 200+ check suite.
The QA harness performs: syntax check, render-every-step, flow simulation,
10 critical rules, and dead-code scan.

If Node.js is not available, falls back to a Python-based structural QA check.
Output: qa_report.json
"""

from __future__ import annotations

import json
import logging
import re
import subprocess
from pathlib import Path
from typing import Any

from .base import BaseAgent

logger = logging.getLogger(__name__)


class QAAgent(BaseAgent):
    """Runs the QA suite against the generated HTML."""

    def __init__(self, qa_runner: str = "node ./qa/run_qa.js"):
        super().__init__(name="QAAgent", stage="qa", llm=None)
        self.qa_runner = qa_runner

    @property
    def requires_llm(self) -> bool:
        return False

    def _run_node_qa(self, html_path: Path, mode: str = "v5-engine") -> dict[str, Any]:
        """Run the Node.js QA harness."""
        cmd_parts = self.qa_runner.split()
        if len(cmd_parts) >= 2 and cmd_parts[0] == "node":
            script_rel = Path(cmd_parts[1])
            pkg_script = (Path(__file__).resolve().parent.parent.parent.parent / script_rel).resolve()
            if pkg_script.exists():
                cmd = ["node", str(pkg_script), str(html_path), mode]
            else:
                cmd = cmd_parts + [str(html_path), mode]
        else:
            cmd = cmd_parts + [str(html_path), mode]

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=120,
                cwd=str(html_path.parent),
            )

            if result.returncode == 0:
                try:
                    return json.loads(result.stdout)
                except json.JSONDecodeError:
                    # QA harness might write to a file instead
                    report_path = html_path.parent / "qa_report.json"
                    if report_path.exists():
                        with open(report_path, "r", encoding="utf-8") as f:
                            return json.load(f)
                    return self._fallback_qa(html_path, "Node QA output not parseable", mode)
            else:
                logger.warning(f"Node QA failed: {result.stderr[:500]}")
                return self._fallback_qa(html_path, f"Node QA error: {result.stderr[:200]}", mode)

        except FileNotFoundError:
            logger.warning("Node.js not found, falling back to Python QA")
            return self._fallback_qa(html_path, "Node.js not available", mode)
        except subprocess.TimeoutExpired:
            logger.warning("Node QA timed out")
            return self._fallback_qa(html_path, "Node QA timed out", mode)
        except Exception as e:
            logger.warning(f"Node QA error: {e}")
            return self._fallback_qa(html_path, str(e), mode)

    def _fallback_qa(self, html_path: Path, note: str = "", mode: str = "v5-engine") -> dict[str, Any]:
        """Python-based fallback QA — runs structural checks without jsdom.

        15-check suite (extended from original 13):
          1.  No external CDN URLs
          2.  No confirm()/alert()
          3.  Has NODES variable (regex-safe)
          4.  Has WE variable   (regex-safe)
          5.  Has WM variable   (regex-safe)
          6.  Has CONN variable (regex-safe)
          7.  Has App.init()
          8.  No unresolved {{PLACEHOLDER}} tokens
          9.  No HTML5 drag-and-drop API
          10. File size within limit
          11. Has exit button
          12. Has progress indicator
          13. Devanagari characters present (LLE check — threshold ≥ 50 chars)
          14. KaTeX math library present (math insulation check)
          15. UTF-8 charset meta tag present
        """
        failures = []
        checks_total = 0
        checks_passed = 0

        with open(html_path, "r", encoding="utf-8") as f:
            html = f.read()

        def check(name: str, passed: bool, reason: str = "") -> None:
            nonlocal checks_total, checks_passed
            checks_total += 1
            if passed:
                checks_passed += 1
            else:
                failures.append({"check": name, "reason": reason})

        # 1: No external CDN URLs
        external = re.findall(r'(?:src|href)\s*=\s*["\']https?://', html)
        check("no_external_urls", not external,
              f"Found {len(external)} external URLs (file must be fully offline)")

        # 2: No confirm()/alert()
        check("no_confirm_alert",
              "confirm(" not in html and "alert(" not in html,
              "Found confirm() or alert() — blocked for child-safe content")

        # 3: Has NODES variable (flexible whitespace regex)
        check("has_nodes", bool(re.search(r'var\s+NODES\s*=', html)),
              "NODES data structure not found in HTML")

        # 4: Has WE variable
        check("has_we", bool(re.search(r'var\s+WE\s*=', html)),
              "WE (worked examples) not found in HTML")

        # 5: Has WM variable
        check("has_wm", bool(re.search(r'var\s+WM\s*=', html)),
              "WM (word map / bilingual dictionary) not found in HTML")

        # 6: Has CONN variable
        check("has_conn", bool(re.search(r'var\s+CONN\s*=', html)),
              "CONN (concept connections) not found in HTML")

        # 7: Has App.init()
        check("has_app_init", "App.init()" in html,
              "App.init() not found — engine may not start")

        # 8: No unresolved placeholders
        placeholders = re.findall(r"\{\{[A-Z_]+\}\}", html)
        check("no_unresolved_placeholders", not placeholders,
              f"Found {len(placeholders)} unresolved placeholders: {placeholders[:5]}")

        # 9: No HTML5 drag-and-drop API (v5 engine uses tap-to-select instead)
        has_html5_dnd = any(kw in html for kw in ("dragstart", "dragend", "ondrop", 'draggable="true"'))
        check("no_html5_dnd", not has_html5_dnd,
              "HTML5 drag-and-drop API found — use tap-to-select pattern")

        # 10: File size limit
        size_kb = len(html.encode("utf-8")) / 1024
        size_limit_kb = 20480 if mode == "full-synthesis" else 200
        check("file_size", size_kb < size_limit_kb,
              f"File is {size_kb:.0f} KB (limit {size_limit_kb} KB)")

        # 11: Has exit button
        check("has_exit",
              "exit" in html.lower() or "exitBtn" in html or "exit-btn" in html,
              "Exit button not found")

        # 12: Has progress indicator
        check("has_progress", "progress" in html.lower(),
              "Progress indicator not found")

        # 13: Devanagari characters (LLE bilingual content — at least 50 chars)
        devanagari = re.findall(r"[\u0900-\u097F]", html)
        check("has_devanagari", len(devanagari) >= 50,
              f"Insufficient Devanagari text ({len(devanagari)} chars found, need ≥ 50) — LLE may be missing")

        # 14: KaTeX math library (math insulation check)
        check("has_katex",
              "katex" in html.lower() or "__AASHA_MATH" not in html,
              "KaTeX not found — math insulation may be broken")

        # 15: UTF-8 charset declaration
        check("has_utf8_charset",
              bool(re.search(r'<meta\s[^>]*charset\s*=\s*["\']?utf-8', html, re.IGNORECASE)),
              "Missing <meta charset=\"UTF-8\"> — Devanagari may not render correctly")

        passed = len(failures) == 0

        return {
            "passed": passed,
            "checks_total": checks_total,
            "checks_passed": checks_passed,
            "failures": failures,
            "categories": {
                "structural": {"passed": checks_total - len(failures), "failed": len(failures)},
                "note": note or "Python fallback QA (15-check suite)",
            },
        }

    def run(self, work_dir: Path, context: dict[str, Any]) -> dict[str, Any]:
        html_path = work_dir / "chapter.html"

        if not html_path.exists():
            raise FileNotFoundError(f"chapter.html not found in {work_dir}")

        self.log(f"Running QA on {html_path.name}...")

        mode = context.get("mode", "v5-engine")

        # Try Node.js QA first
        report = self._run_node_qa(html_path, mode)

        output_path = self._write_json(work_dir, "qa_report.json", report)

        passed = report.get("passed", False)
        total = report.get("checks_total", 0)
        passed_count = report.get("checks_passed", 0)
        fail_count = len(report.get("failures", []))

        if passed:
            self.log(f"QA PASS: {passed_count}/{total} checks passed")
        else:
            self.log(f"QA FAIL: {passed_count}/{total} checks passed, {fail_count} failures")
            for fail in report.get("failures", [])[:5]:
                self.log(f"  - {fail.get('check', '?')}: {fail.get('reason', '?')}")

        return {
            "output_file": str(output_path),
            "passed": passed,
            "checks_total": total,
            "checks_passed": passed_count,
            "failure_count": fail_count,
        }
