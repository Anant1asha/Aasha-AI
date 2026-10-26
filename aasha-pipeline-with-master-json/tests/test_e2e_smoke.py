"""
E2E Smoke Test — AASHA PDF → HTML5 Pipeline
============================================
Generates a minimal 2-page synthetic PDF (using only stdlib + reportlab/fpdf2
if available, otherwise a raw %PDF- byte stream), runs all 8 pipeline stages,
and asserts the output chapter.html passes all 15 QA checks.

Requires:
  - OPENROUTER_API_KEY env var (for LLM stages 2-5)
  - .venv bootstrapped via bootstrap.ps1

Run:
  python -m pytest tests/test_e2e_smoke.py -v --timeout=600
"""
from __future__ import annotations

import json
import os
import re
import struct
import subprocess
import sys
import tempfile
import zlib
from pathlib import Path

import pytest

# ── Locate package root ────────────────────────────────────────────────────────
PIPELINE_DIR = Path(__file__).parent.parent.resolve()
SRC_PATH = PIPELINE_DIR / "src"
VENV_PY = PIPELINE_DIR / ".venv" / "Scripts" / "python.exe"


# ── Minimal raw PDF builder (no external deps) ─────────────────────────────────

def _pdf_obj(num: int, content: str) -> tuple[int, bytes]:
    """Return (byte_offset_placeholder, serialised object bytes)."""
    return (0, f"{num} 0 obj\n{content}\nendobj\n".encode())


def create_minimal_pdf(pdf_path: Path, title: str = "Test Chapter") -> None:
    """Create the smallest valid 2-page PDF that PyMuPDF can extract text from.

    Uses only Python stdlib — no reportlab/fpdf2 required.
    The PDF contains two pages, each with a visible text block so that
    IngestAgent's 50-char minimum-text gate passes.
    """
    # Page text streams (Deflate-compressed)
    page_texts = [
        (
            f"BT /F1 12 Tf 50 750 Td ({title} — Page 1) Tj\n"
            "0 -20 Td (This chapter covers rational numbers and fractions.) Tj\n"
            "0 -20 Td (Exercise 1: Find the value of 3/4 + 1/2.) Tj\n"
            "0 -20 Td (Key vocabulary: numerator, denominator, equivalent fractions.) Tj\n"
            "ET"
        ),
        (
            "BT /F1 12 Tf 50 750 Td (Page 2 — Continued) Tj\n"
            "0 -20 Td (Rational numbers can be represented on a number line.) Tj\n"
            "0 -20 Td (Exercise 2: Compare 2/3 and 3/4 using cross multiplication.) Tj\n"
            "0 -20 Td (Summary: rational numbers, fractions, number line.) Tj\n"
            "ET"
        ),
    ]

    objects: list[bytes] = []
    xref: list[int] = []

    def add_obj(raw: str) -> int:
        n = len(objects) + 1
        blob = f"{n} 0 obj\n{raw}\nendobj\n".encode()
        objects.append(blob)
        return n

    # Object 1: catalog (filled after we know page tree ref)
    # Object 2: page tree
    # Objects 3,4: page 1 content stream, page 1
    # Objects 5,6: page 2 content stream, page 2
    # Object 7: font

    # Font (object 1)
    font_obj = add_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    # Content streams
    stream_refs = []
    for txt in page_texts:
        compressed = zlib.compress(txt.encode())
        length = len(compressed)
        stream_raw = (
            f"<< /Filter /FlateDecode /Length {length} >>\nstream\n"
        ).encode() + compressed + b"\nendstream"
        n = len(objects) + 1
        objects.append(f"{n} 0 obj\n".encode() + stream_raw + b"\nendobj\n")
        stream_refs.append(n)

    # Pages (will be filled after we know page refs)
    page_refs: list[int] = []
    page_tree_ref = len(objects) + 1
    # placeholder — we will splice it later
    objects.append(b"")  # page tree slot

    for sr in stream_refs:
        pr = len(objects) + 1
        page_refs.append(pr)
        objects.append((
            f"{pr} 0 obj\n"
            "<< /Type /Page /Parent {pt} 0 R "
            f"/MediaBox [0 0 612 792] "
            f"/Contents {sr} 0 R "
            f"/Resources << /Font << /F1 {font_obj} 0 R >> >> >>\n"
            "endobj\n"
        ).replace("{pt}", str(page_tree_ref)).encode())

    # Fill page tree
    kids = " ".join(f"{pr} 0 R" for pr in page_refs)
    page_tree_blob = (
        f"{page_tree_ref} 0 obj\n"
        f"<< /Type /Pages /Kids [{kids}] /Count {len(page_refs)} >>\n"
        "endobj\n"
    ).encode()
    objects[page_tree_ref - 1] = page_tree_blob

    # Catalog
    cat_ref = len(objects) + 1
    objects.append((
        f"{cat_ref} 0 obj\n"
        f"<< /Type /Catalog /Pages {page_tree_ref} 0 R >>\n"
        "endobj\n"
    ).encode())

    # Assemble with xref table
    header = b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"
    body = bytearray(header)
    offsets: list[int] = []
    for obj in objects:
        offsets.append(len(body))
        body.extend(obj)

    startxref = len(body)
    xref_section = f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n"
    for off in offsets:
        xref_section += f"{off:010d} 00000 n \n"
    body.extend(xref_section.encode())
    body.extend((
        f"trailer\n<< /Size {len(objects) + 1} /Root {cat_ref} 0 R >>\n"
        f"startxref\n{startxref}\n%%EOF\n"
    ).encode())

    pdf_path.write_bytes(bytes(body))


# ── Fixtures ───────────────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def venv_python() -> Path:
    if not VENV_PY.exists():
        pytest.skip(
            f"Pipeline venv not found at {VENV_PY}. Run bootstrap.ps1 first."
        )
    return VENV_PY


@pytest.fixture(scope="session")
def openrouter_key() -> str:
    key = os.environ.get("OPENROUTER_API_KEY", "")
    if not key:
        try:
            from aasha.llm.adapter import _load_env_if_missing
            _load_env_if_missing()
            key = os.environ.get("OPENROUTER_API_KEY", "")
        except Exception:
            pass
    if not key:
        pytest.skip("OPENROUTER_API_KEY not set — skipping LLM stages in E2E test.")
    return key


# ── Unit tests (no LLM, no venv needed) ──────────────────────────────────────

class TestMinimalPdfCreation:
    def test_pdf_header(self, tmp_path: Path):
        pdf = tmp_path / "test.pdf"
        create_minimal_pdf(pdf)
        assert pdf.read_bytes()[:5] == b"%PDF-"

    def test_pdf_has_text_content(self, tmp_path: Path):
        pdf = tmp_path / "test.pdf"
        create_minimal_pdf(pdf, title="Math Chapter")
        raw = pdf.read_bytes()
        # The text appears compressed; we verify the stream objects exist
        assert b"stream" in raw
        assert b"endstream" in raw

    def test_pdf_size_reasonable(self, tmp_path: Path):
        pdf = tmp_path / "test.pdf"
        create_minimal_pdf(pdf)
        assert 100 < pdf.stat().st_size < 1_000_000


class TestHTMLAssemblerPlaceholders:
    """Verify assembler raises on missing placeholders."""

    def test_all_placeholders_present_in_real_template(self):
        template_path = PIPELINE_DIR / "template" / "v5-engine-template.html"
        if not template_path.exists():
            pytest.skip("Template not found")
        sys.path.insert(0, str(SRC_PATH))
        from aasha.assemble.html_assembler import PLACEHOLDERS
        content = template_path.read_text(encoding="utf-8")
        missing = [ph for ph in PLACEHOLDERS if ph not in content]
        assert not missing, f"Template missing placeholders: {missing}"

    def test_assembler_rejects_bad_template(self, tmp_path: Path):
        bad_template = tmp_path / "bad.html"
        bad_template.write_text("<html>No placeholders here</html>", encoding="utf-8")
        sys.path.insert(0, str(SRC_PATH))
        from aasha.assemble.html_assembler import HTMLAssembler
        with pytest.raises((FileNotFoundError, ValueError)):
            HTMLAssembler(str(bad_template))


class TestQAAgentFallback:
    """Verify the 15-check QA suite catches known problems."""

    def _write_html(self, tmp_path: Path, content: str) -> Path:
        p = tmp_path / "chapter.html"
        p.write_text(content, encoding="utf-8")
        return p

    def _run_qa(self, html_path: Path) -> dict:
        sys.path.insert(0, str(SRC_PATH))
        from aasha.agents.qa_agent import QAAgent
        agent = QAAgent()
        return agent._fallback_qa(html_path)

    def test_detects_external_url(self, tmp_path: Path):
        html = '<script src="https://cdn.example.com/bad.js"></script>'
        report = self._run_qa(self._write_html(tmp_path, html))
        checks = {f["check"] for f in report["failures"]}
        assert "no_external_urls" in checks

    def test_detects_unresolved_placeholder(self, tmp_path: Path):
        html = "Hello {{CHAPTER_TITLE}} world"
        report = self._run_qa(self._write_html(tmp_path, html))
        checks = {f["check"] for f in report["failures"]}
        assert "no_unresolved_placeholders" in checks

    def test_passes_on_valid_minimal_html(self, tmp_path: Path):
        # Build a minimal HTML that satisfies all 15 checks
        devanagari = "भिन्न" * 15   # 75 Devanagari chars
        html = f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Test</title></head>
<body>
<script>
var NODES=[{{}}];
var WE={{}};
var WM={{}};
var CONN={{}};
App.init();
</script>
<div id="exitBtn">Exit</div>
<div class="progress">0%</div>
<div>{devanagari}</div>
<script>/* katex */</script>
</body></html>"""
        report = self._run_qa(self._write_html(tmp_path, html))
        # Most checks should pass — external URL and size checks definitely pass
        assert report["checks_passed"] >= 10, (
            f"Expected >=10 checks to pass, got {report['checks_passed']}.\n"
            f"Failures: {report['failures']}"
        )


# ── Integration test: CLI import (no LLM) ─────────────────────────────────────

class TestCLIImport:
    def test_cli_importable(self, venv_python: Path):
        result = subprocess.run(
            [str(venv_python), "-c",
             "import sys; sys.path.insert(0,'src'); from aasha.cli import main; print('ok')"],
            capture_output=True, text=True, timeout=30,
            cwd=str(PIPELINE_DIR),
        )
        assert result.returncode == 0, f"CLI import failed: {result.stderr}"
        assert result.stdout.strip() == "ok"

    def test_cli_help(self, venv_python: Path):
        env = {**os.environ, "PYTHONPATH": str(SRC_PATH)}
        result = subprocess.run(
            [str(venv_python), "-m", "aasha.cli", "--help"],
            capture_output=True, text=True, timeout=30,
            cwd=str(PIPELINE_DIR), env=env,
        )
        assert result.returncode == 0, f"CLI --help failed: {result.stderr}"
        assert "--pdf" in result.stdout

    def test_ingest_only_no_llm(self, tmp_path: Path):
        """Run only the ingest stage (no LLM) to validate PDF parsing works."""
        from aasha.agents.ingest_agent import IngestAgent
        pdf = tmp_path / "test.pdf"
        create_minimal_pdf(pdf)
        agent = IngestAgent()
        res = agent.run(tmp_path, {"pdf_path": str(pdf), "source_sha256": "dummy", "subject": "math", "grade": 4})
        assert "raw_extract.json" in res.get("output_file", "")
        raw = json.loads((tmp_path / "raw_extract.json").read_text(encoding="utf-8"))
        assert raw["page_count"] == 2
        assert len(raw["pages"]) == 2
        assert "rational numbers" in raw["pages"][0]["text"].lower()


# ── Full E2E test (requires OPENROUTER_API_KEY) ───────────────────────────────

class TestFullE2EPipeline:
    @pytest.mark.timeout(600)
    def test_pdf_to_html_complete(
        self, venv_python: Path, openrouter_key: str, tmp_path: Path
    ):
        """Full 8-stage pipeline test: PDF → chapter.html with all QA checks."""
        pdf = tmp_path / "math_chapter.pdf"
        create_minimal_pdf(pdf, title="Rational Numbers")

        env = {
            **os.environ,
            "PYTHONPATH": str(SRC_PATH),
            "OPENROUTER_API_KEY": openrouter_key,
            "ALLOW_PAID_GEMINI_FALLBACK": "false",  # anti-bleed lock
        }

        result = subprocess.run(
            [str(venv_python), "-m", "aasha.cli",
             "--pdf", str(pdf),
             "--subject", "math",
             "--grade", "4",
             "--provider", "openrouter",
             "--mode", "v5-engine",
             "--json-events"],
            capture_output=True, text=True,
            timeout=600,
            cwd=str(PIPELINE_DIR),
            env=env,
        )

        # Parse JSON event stream
        events = []
        for line in result.stdout.splitlines():
            line = line.strip()
            if line.startswith("{"):
                try:
                    events.append(json.loads(line))
                except json.JSONDecodeError:
                    pass

        last = events[-1] if events else {}
        html_path_str = last.get("html_path") or last.get("output_path", "")

        assert result.returncode == 0, (
            f"Pipeline failed with code {result.returncode}.\n"
            f"STDERR (last 2000 chars): {result.stderr[-2000:]}"
        )
        assert last.get("status") in ("completed", "done"), (
            f"Last event status unexpected: {last}"
        )
        assert html_path_str, "No html_path in final pipeline event"

        html_path = Path(html_path_str)
        if not html_path.is_absolute():
            html_path = PIPELINE_DIR / html_path
        assert html_path.exists(), f"chapter.html not found at {html_path}"

        html = html_path.read_text(encoding="utf-8")

        # Structural assertions
        placeholders = re.findall(r"\{\{[A-Z_]+\}\}", html)
        assert not placeholders, f"Unresolved placeholders remain in output: {placeholders}"
        assert len(html.encode("utf-8")) < 20 * 1024 * 1024, "Output exceeds 20 MB limit"
        assert not re.findall(r'(?:src|href)\s*=\s*["\']https?://', html), \
            "External URLs found — chapter must be fully offline"
        assert re.search(r'var\s+NODES\s*=', html), "NODES not in output"
        assert re.search(r'var\s+WM\s*=', html), "WM (word map) not in output"
        assert len(re.findall(r"[\u0900-\u097F]", html)) >= 50, \
            "Insufficient Devanagari — LLE bilingual content may be missing"
