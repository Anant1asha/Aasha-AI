"""
Stage 1 — Ingest. See README.md in this folder for the full contract.

Uses PyMuPDF (`fitz`) when available. If it isn't installed (e.g. an offline
sandbox), raises a clear ImportError rather than silently degrading — PDF
parsing has no safe mock, unlike the LLM stages.

For demos/tests without a real PDF, use `load_raw_extract_stub()` below, or
point the orchestrator at a pre-made raw_extract.json.
"""
from __future__ import annotations

import json
import re
from pathlib import Path


def ingest_pdf(pdf_path: str) -> dict:
    try:
        import fitz  # PyMuPDF
    except ImportError as e:
        raise ImportError(
            "PyMuPDF is required for PDF ingestion (`pip install pymupdf`). "
            "See docs/OPEN_SOURCE_TOOLING.md. For offline testing without a "
            "real PDF, use ingest.load_raw_extract_stub() or hand-write a "
            "raw_extract.json and start the orchestrator from stage 'analyze'."
        ) from e

    doc = fitz.open(pdf_path)
    pages = []
    headings = []
    exercises = []
    figures = []

    for page_idx, page in enumerate(doc):
        blocks = page.get_text("blocks")  # (x0,y0,x1,y1,text,block_no,block_type)
        blocks_sorted = sorted(blocks, key=lambda b: (round(b[0] / 100), b[1]))
        page_text_parts = []
        body_sizes = []

        for b in blocks_sorted:
            text = b[4].strip()
            if not text:
                continue
            page_text_parts.append(text)

            first_line = text.splitlines()[0].strip()
            is_heading_like = (
                len(first_line) < 60
                and first_line[:1].isupper()
                and not first_line.endswith(".")
            )
            if is_heading_like:
                headings.append(first_line)
            if re.match(r"^(Q\.?\s*\d+|Exercise\s*\d*)", first_line, re.IGNORECASE):
                exercises.append({"page": page_idx, "text": text})

        images = []
        for img_idx, img in enumerate(page.get_images(full=True)):
            try:
                xref = img[0]
                pix = fitz.Pixmap(doc, xref)
                if pix.width > 800:
                    scale = 800 / pix.width
                    pix = fitz.Pixmap(pix, 0) if pix.alpha else pix
                    mat = fitz.Matrix(scale, scale)
                    pix = page.get_pixmap(matrix=mat)
                png_bytes = pix.tobytes("png")
                import base64
                images.append("data:image/png;base64," + base64.b64encode(png_bytes).decode())
                figures.append({"caption": "", "page": page_idx, "image_ref": img_idx})
            except Exception:
                continue  # a single bad image must not fail ingestion (NFR-3)

        pages.append({
            "text": "\n".join(page_text_parts),
            "blocks": [{"bbox": b[:4], "text": b[4]} for b in blocks_sorted],
            "images": images,
        })

    doc.close()
    return {"pages": pages, "headings": headings, "exercises": exercises, "figures": figures}


def load_raw_extract_stub(subject: str, grade: int, title: str, body_text: str) -> dict:
    """Build a minimal, schema-consistent raw_extract.json without a real PDF —
    for offline testing of Stages 2-9 (see pipeline/README.md quickstart)."""
    return {
        "pages": [{"text": body_text, "blocks": [], "images": []}],
        "headings": [title],
        "exercises": [],
        "figures": [],
        "_meta": {"subject": subject, "grade": grade, "source": "stub"},
    }


def save(raw_extract: dict, out_path: str) -> None:
    Path(out_path).write_text(
        json.dumps(raw_extract, ensure_ascii=False, indent=2), encoding="utf-8"
    )
