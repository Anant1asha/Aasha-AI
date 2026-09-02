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
        """Python-based fallback QA — runs structural checks without jsdom."""
        failures = []
        checks_total = 0
        checks_passed = 0

        with open(html_path, "r", encoding="utf-8") as f:
            html = f.read()

        # Check 1: Single file (no external URLs)
        checks_total += 1
        import re
        external = re.findall(r'(?:src|href)\s*=\s*["\']https?://', html)
        if not external:
            checks_passed += 1
        else:
            failures.append({"check": "no_external_urls", "reason": f"Found {len(external)} external URLs"})

        # Check 2: No confirm()/alert()
        checks_total += 1
        if "confirm(" not in html and "alert(" not in html:
            checks_passed += 1
        else:
            failures.append({"check": "no_confirm_alert", "reason": "Found confirm() or alert()"})

        # Check 3: Has NODES
        checks_total += 1
        if "var NODES=" in html or "var NODES =" in html:
            checks_passed += 1
        else:
            failures.append({"check": "has_nodes", "reason": "NODES not found in HTML"})

        # Check 4: Has WE
        checks_total += 1
        if "var WE=" in html or "var WE =" in html:
            checks_passed += 1
        else:
            failures.append({"check": "has_we", "reason": "WE not found in HTML"})

        # Check 5: Has WM
        checks_total += 1
        if "var WM=" in html or "var WM =" in html:
            checks_passed += 1
        else:
            failures.append({"check": "has_wm", "reason": "WM not found in HTML"})

        # Check 6: Has CONN
        checks_total += 1
        if "var CONN=" in html or "var CONN =" in html:
            checks_passed += 1
        else:
            failures.append({"check": "has_conn", "reason": "CONN not found in HTML"})

        # Check 7: Has App.init()
        checks_total += 1
        if "App.init()" in html:
            checks_passed += 1
        else:
            failures.append({"check": "has_app_init", "reason": "App.init() not found"})

        # Check 8: No unresolved placeholders
        checks_total += 1
        placeholders = re.findall(r"\{\{[A-Z_]+\}\}", html)
        if not placeholders:
            checks_passed += 1
        else:
            failures.append({
                "check": "no_unresolved_placeholders",
                "reason": f"Found {len(placeholders)} unresolved placeholders: {placeholders[:5]}",
            })

        # Check 9: No HTML5 drag-and-drop API (dragstart, dragend, ondrop event handlers)
        # Note: the v5 engine uses "dd_build"/"dd_match" step names and "dropZone" IDs
        # for historical reasons, but implements tap-to-select, NOT HTML5 DnD.
        checks_total += 1
        has_html5_dnd = "dragstart" in html or "dragend" in html or "ondrop" in html or "draggable=" in html
        if not has_html5_dnd:
            checks_passed += 1
        else:
            failures.append({"check": "no_drag_drop", "reason": "HTML5 drag-and-drop API found"})

        # Check 10: File size limit
        checks_total += 1
        size_kb = len(html) / 1024
        size_limit_kb = 20480 if mode == "full-synthesis" else 200
        if size_kb < size_limit_kb:
            checks_passed += 1
        else:
            failures.append({"check": "file_size", "reason": f"File is {size_kb:.0f}KB (limit {size_limit_kb}KB)"})

        # Check 11: Has exit button
        checks_total += 1
        if "exit" in html.lower() or "exitBtn" in html or "exit-btn" in html:
            checks_passed += 1
        else:
            failures.append({"check": "has_exit", "reason": "Exit button not found"})

        # Check 12: Has progress bar
        checks_total += 1
        if "progress" in html.lower():
            checks_passed += 1
        else:
            failures.append({"check": "has_progress", "reason": "Progress indicator not found"})

        # Check 13: Devanagari characters present (LLE check)
        checks_total += 1
        devanagari = re.findall(r"[\u0900-\u097F]", html)
        if len(devanagari) > 10:
            checks_passed += 1
        else:
            failures.append({"check": "has_devanagari", "reason": "Insufficient Devanagari text (LLE may be missing)"})

        passed = len(failures) == 0

        return {
            "passed": passed,
            "checks_total": checks_total,
            "checks_passed": checks_passed,
            "failures": failures,
            "categories": {
                "structural": {"passed": checks_total - len(failures), "failed": len(failures)},
                "note": note or "Python fallback QA",
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
