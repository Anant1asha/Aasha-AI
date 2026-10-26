"""Tests for DeepOfflineVectorizer and IngestAgent offline vectorization of scanned PDFs."""

import json
from pathlib import Path
from unittest.mock import MagicMock

import fitz  # PyMuPDF
import pytest
from PIL import Image, ImageDraw

from aasha.agents.deep_vectorizer import DeepOfflineVectorizer
from aasha.agents.ingest_agent import IngestAgent


def create_scanned_drawing_pdf(pdf_path: Path) -> None:
    """Create a scanned mock PDF containing geometric drawings and simulated handwritten formulas."""
    doc = fitz.open()

    # Page 1: Geometric drawing (rectangle, circle/ellipse, and coordinate lines)
    p1 = doc.new_page(width=600, height=800)
    # Draw vector rectangle
    p1.draw_rect(fitz.Rect(100, 100, 400, 300), color=(0.15, 0.4, 0.8), fill=(0.9, 0.95, 1.0), width=2)
    # Draw vector line (coordinate axis or number line)
    p1.draw_line(fitz.Point(80, 500), fitz.Point(520, 500), color=(0.2, 0.2, 0.2), width=3)
    for tick_x in (120, 200, 280, 360, 440):
        p1.draw_line(fitz.Point(tick_x, 490), fitz.Point(tick_x, 510), color=(0.2, 0.2, 0.2), width=2)

    # Page 2: Raster bitmap drawing embedded as image (handwritten equation and triangle)
    p2 = doc.new_page(width=600, height=800)
    pil_img = Image.new("RGB", (500, 600), color="white")
    draw = ImageDraw.Draw(pil_img)
    # Draw a triangle
    draw.polygon([(100, 300), (250, 100), (400, 300)], outline="black", width=4)
    # Draw a simulated formula: horizontal line for fraction and strokes
    draw.line([(150, 450), (350, 450)], fill="black", width=3)
    draw.line([(250, 400), (250, 430)], fill="black", width=3)  # numerator stroke
    draw.line([(250, 470), (250, 500)], fill="black", width=3)  # denominator stroke
    # Equals sign
    draw.line([(380, 440), (420, 440)], fill="black", width=3)
    draw.line([(380, 460), (420, 460)], fill="black", width=3)

    img_bytes = fitz.io.BytesIO()
    pil_img.save(img_bytes, format="PNG")
    p2.insert_image(fitz.Rect(50, 50, 550, 650), stream=img_bytes.getvalue())

    doc.save(str(pdf_path))
    doc.close()


def test_deep_vectorizer_page_vectorization(tmp_path: Path):
    """Test that DeepOfflineVectorizer extracts SVG geometry, figures, and blocks from a PDF page."""
    pdf_path = tmp_path / "vector_drawing_test.pdf"
    create_scanned_drawing_pdf(pdf_path)

    result = DeepOfflineVectorizer.vectorize_page_from_path(pdf_path, 1, "mock_sha256")

    assert result["page_num"] == 1
    assert "text" in result
    assert len(result["text"]) > 10
    assert len(result["blocks"]) >= 1
    # Check that SVG data was captured
    assert result.get("svg_data") or any(b.get("svg") for b in result.get("blocks", []))
    assert result["source_ref"]["vectorized_offline"] is True

    # Figures should contain vectorized drawings or classified figures
    figures = result.get("figures", [])
    assert len(figures) >= 1
    fig_types = [f.get("type") for f in figures]
    assert any(t in ("vector_drawing", "number_line", "geometric_figure", "coordinate_graph", "diagram") for t in fig_types)


def test_ingest_agent_offline_scanned_pdf(tmp_path: Path):
    """Test that IngestAgent with offline=True uses DeepOfflineVectorizer and avoids placeholder text."""
    pdf_path = tmp_path / "scanned_offline.pdf"
    create_scanned_drawing_pdf(pdf_path)

    agent = IngestAgent(llm=None)
    result = agent.run(tmp_path, {"pdf_path": str(pdf_path), "offline": True})

    assert result["page_count"] == 2
    raw_extract_path = tmp_path / "raw_extract.json"
    assert raw_extract_path.exists()

    raw_extract = json.loads(raw_extract_path.read_text(encoding="utf-8"))
    assert len(raw_extract["pages"]) == 2

    for page in raw_extract["pages"]:
        page_text = page["text"]
        # Must NOT contain the old generic placeholder
        assert "[Page " not in page_text or "Visual diagram or illustration content" not in page_text
        assert len(page_text.strip()) > 10
        # Verify blocks exist with coordinates
        assert len(page["blocks"]) >= 1

    # Figures must be extracted from the vector drawings and diagrams
    assert len(raw_extract["figures"]) >= 1


def test_ingest_agent_vision_failure_fallback_to_deep_vectorizer(tmp_path: Path):
    """Test that when online vision LLM fails, IngestAgent falls back to DeepOfflineVectorizer."""
    pdf_path = tmp_path / "scanned_fallback.pdf"
    create_scanned_drawing_pdf(pdf_path)

    failing_llm = MagicMock()
    failing_llm.complete_vision.side_effect = RuntimeError("OpenRouter 429 Rate Limit Exceeded")
    failing_llm.is_9router_alive.return_value = False

    agent = IngestAgent(llm=failing_llm)
    result = agent.run(tmp_path, {"pdf_path": str(pdf_path), "offline": False})

    assert result["page_count"] == 2
    raw_extract = json.loads((tmp_path / "raw_extract.json").read_text(encoding="utf-8"))
    assert len(raw_extract["pages"]) == 2

    for page in raw_extract["pages"]:
        assert "Visual diagram or illustration content" not in page["text"]
        assert len(page["text"].strip()) > 10

    # Ensure figures were extracted despite vision LLM failure
    assert len(raw_extract["figures"]) >= 1
