"""Tests for IngestAgent parallel vision and hybrid extraction."""

import base64
import json
from pathlib import Path
from unittest.mock import MagicMock

import fitz  # PyMuPDF
import pytest

from aasha.agents.ingest_agent import IngestAgent


def create_scanned_mock_pdf(pdf_path: Path, page_count: int = 4) -> None:
    """Create a PDF with blank/image pages having 0 extractable digital text."""
    doc = fitz.open()
    for _ in range(page_count):
        page = doc.new_page(width=595, height=842)
        # Draw a small rectangle to simulate image content without text
        page.draw_rect(fitz.Rect(50, 50, 300, 300), color=(0.2, 0.5, 0.8), fill=(0.2, 0.5, 0.8))
    doc.save(str(pdf_path))
    doc.close()


def create_hybrid_mock_pdf(pdf_path: Path) -> None:
    """Create a 3-page PDF: page 1 has text, page 2 has image only, page 3 has text."""
    doc = fitz.open()
    # Page 1: Digital text
    p1 = doc.new_page(width=595, height=842)
    p1.insert_text(fitz.Point(72, 100), "Chapter 1: The Solar System and Planetary Motion in Detail. " * 3)

    # Page 2: Scanned image only (no text)
    p2 = doc.new_page(width=595, height=842)
    p2.draw_rect(fitz.Rect(50, 50, 400, 400), color=(0.8, 0.3, 0.2), fill=(0.8, 0.3, 0.2))

    # Page 3: Digital text with exercise
    p3 = doc.new_page(width=595, height=842)
    p3.insert_text(fitz.Point(72, 100), "Exercise 1.1: Calculate orbital velocity for satellites. " * 3)
    p3.insert_text(fitz.Point(72, 150), "Q1. What is Kepler's first law of planetary orbits?")
    doc.save(str(pdf_path))
    doc.close()


def test_scanned_pdf_parallel_vision_ingest(tmp_path: Path):
    """Test that a scanned PDF with 4 pages dispatches parallel vision workers and orders pages properly."""
    pdf_path = tmp_path / "scanned_doc.pdf"
    create_scanned_mock_pdf(pdf_path, page_count=4)

    mock_llm = MagicMock()
    # Mock vision response
    def mock_complete_vision(system, user, image_b64, mime_type="image/jpeg"):
        assert mime_type == "image/jpeg"
        # Verify base64 is not empty and reasonably small (<200KB)
        assert len(image_b64) > 100
        assert len(image_b64) < 300_000
        return {
            "text": "Extracted text content from scanned page with $E = mc^2$",
            "headings": [{"text": "Scanned Heading", "level": 2}],
            "exercises": [{"question": "What is energy?", "type": "recall", "difficulty": "recall"}],
        }

    mock_llm.complete_vision.side_effect = mock_complete_vision
    mock_llm.is_9router_alive.return_value = True

    agent = IngestAgent(llm=mock_llm)
    res = agent.run(tmp_path, {"pdf_path": str(pdf_path)})

    assert res["page_count"] == 4
    assert res["heading_count"] == 4
    assert res["exercise_count"] == 4

    raw_extract = json.loads((tmp_path / "raw_extract.json").read_text(encoding="utf-8"))
    assert len(raw_extract["pages"]) == 4
    # Verify deterministic page ordering 1, 2, 3, 4
    for idx, p in enumerate(raw_extract["pages"], 1):
        assert p["page_num"] == idx
        assert "E = mc^2" in p["text"]


def test_hybrid_pdf_selective_vision_ingest(tmp_path: Path):
    """Test that a mixed PDF only sends scanned pages to vision LLM, extracting digital pages locally."""
    pdf_path = tmp_path / "hybrid_doc.pdf"
    create_hybrid_mock_pdf(pdf_path)

    mock_llm = MagicMock()
    mock_llm.complete_vision.return_value = {
        "text": "Digitized diagram caption from scanned page 2",
        "headings": [{"text": "Diagram Section", "level": 2}],
        "exercises": [],
    }
    mock_llm.is_9router_alive.return_value = True

    agent = IngestAgent(llm=mock_llm)
    res = agent.run(tmp_path, {"pdf_path": str(pdf_path)})

    assert res["page_count"] == 3
    # Only page 2 had < 50 chars of text, so complete_vision should be called exactly once
    assert mock_llm.complete_vision.call_count == 1

    raw_extract = json.loads((tmp_path / "raw_extract.json").read_text(encoding="utf-8"))
    assert len(raw_extract["pages"]) == 3
    assert raw_extract["pages"][0]["page_num"] == 1
    assert "Solar System" in raw_extract["pages"][0]["text"]
    assert raw_extract["pages"][1]["page_num"] == 2
    assert "Digitized diagram caption" in raw_extract["pages"][1]["text"]
    assert raw_extract["pages"][2]["page_num"] == 3
    assert "Kepler's first law" in raw_extract["pages"][2]["text"]
