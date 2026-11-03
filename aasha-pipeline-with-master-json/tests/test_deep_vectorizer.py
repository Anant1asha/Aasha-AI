"""Tests for DeepOfflineVectorizer and IngestAgent offline vectorization of scanned PDFs."""

import json
import math
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


def create_balance_scale_image(width=400, height=240, tilt_degrees=0) -> Image.Image:
    """Create a high-contrast binary raster drawing of a balance scale."""
    img = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(img)
    # Stand base
    draw.rectangle([140, 210, 260, 225], fill="black")
    # Central pillar
    draw.line([(200, 210), (200, 90)], fill="black", width=5)
    # Fulcrum triangle
    draw.polygon([(200, 75), (188, 105), (212, 105)], outline="black", fill="black")
    # Crossbeam (with tilt if any)
    rad = math.radians(tilt_degrees)
    arm = 140
    dx = arm * math.cos(rad)
    dy = arm * math.sin(rad)
    x0, y0 = 200 - dx, 75 - dy
    x1, y1 = 200 + dx, 75 + dy
    draw.line([(x0, y0), (x1, y1)], fill="black", width=5)
    # Left pan & strings
    draw.line([(x0, y0), (x0 - 20, y0 + 60)], fill="black", width=2)
    draw.line([(x0, y0), (x0 + 20, y0 + 60)], fill="black", width=2)
    draw.line([(x0 - 25, y0 + 60), (x0 + 25, y0 + 60)], fill="black", width=4)
    # Right pan & strings
    draw.line([(x1, y1), (x1 - 20, y1 + 60)], fill="black", width=2)
    draw.line([(x1, y1), (x1 + 20, y1 + 60)], fill="black", width=2)
    draw.line([(x1 - 25, y1 + 60), (x1 + 25, y1 + 60)], fill="black", width=4)
    return img


def create_coordinate_graph_image(width=300, height=300, four_quadrants=True) -> Image.Image:
    """Create a high-contrast binary raster drawing of a Cartesian coordinate graph."""
    img = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(img)
    ox = width // 2 if four_quadrants else 60
    oy = height // 2 if four_quadrants else height - 60
    # X axis
    draw.line([(20, oy), (width - 20, oy)], fill="black", width=4)
    # Y axis
    draw.line([(ox, 20), (ox, height - 20)], fill="black", width=4)
    # Ticks along X
    for tx in range(40, width - 40, 30):
        draw.line([(tx, oy - 6), (tx, oy + 6)], fill="black", width=2)
    # Ticks along Y
    for ty in range(40, height - 40, 30):
        draw.line([(ox - 6, ty), (ox + 6, ty)], fill="black", width=2)
    return img


def test_classify_balance_scale_raster_and_vector():
    """Verify DeepOfflineVectorizer classifies balance scale diagrams with equilibrium metadata."""
    # 1. Balanced scale raster
    img_balanced = create_balance_scale_image(400, 240, tilt_degrees=0)
    analysis = DeepOfflineVectorizer.analyze_raster_image(img_balanced, 400, 240)
    figures = analysis.get("figures", [])
    assert len(figures) >= 1
    scale_fig = figures[0]
    assert scale_fig["type"] == "balance_scale"
    assert "aasha-balance-scale" in scale_fig["svg"]
    assert scale_fig.get("metadata", {}).get("diagram_category") == "balance_scale"
    assert scale_fig.get("metadata", {}).get("equilibrium") == "balanced"

    # 2. Right-heavy tilted scale raster
    img_tilted = create_balance_scale_image(400, 240, tilt_degrees=15)
    analysis_tilted = DeepOfflineVectorizer.analyze_raster_image(img_tilted, 400, 240)
    figures_tilted = analysis_tilted.get("figures", [])
    assert len(figures_tilted) >= 1
    assert figures_tilted[0]["type"] == "balance_scale"
    assert figures_tilted[0].get("metadata", {}).get("equilibrium") == "right_heavy"

    # 3. Native vector balance scale
    drawings = [
        {
            "color": (0.1, 0.1, 0.1),
            "width": 3.0,
            "items": [
                ("l", (50, 100), (350, 100)),   # Upper crossbeam
                ("l", (200, 100), (200, 250)),  # Central support pillar
                ("re", (40, 160, 100, 190)),    # Left pan rect
                ("re", (300, 160, 360, 190)),   # Right pan rect
            ],
        }
    ]
    vec_fig = DeepOfflineVectorizer._classify_vector_drawings(drawings, 400, 300, 1)
    assert vec_fig["type"] == "balance_scale"
    assert vec_fig.get("metadata", {}).get("diagram_category") == "balance_scale"
    assert "aasha-diagram-balance_scale" in vec_fig["svg"]


def test_classify_coordinate_graph_raster_and_vector():
    """Verify DeepOfflineVectorizer classifies 4-quadrant and 1-quadrant coordinate graphs."""
    # 1. 4-quadrant coordinate graph raster
    img_4quad = create_coordinate_graph_image(300, 300, four_quadrants=True)
    analysis_4q = DeepOfflineVectorizer.analyze_raster_image(img_4quad, 300, 300)
    figures_4q = analysis_4q.get("figures", [])
    assert len(figures_4q) >= 1
    coord_fig = figures_4q[0]
    assert coord_fig["type"] == "coordinate_graph"
    assert "aasha-coordinate-graph" in coord_fig["svg"]
    assert coord_fig.get("metadata", {}).get("diagram_category") == "coordinate_graph"
    assert coord_fig.get("metadata", {}).get("quadrants") == 4

    # 2. 1-quadrant coordinate graph raster (origin lower-left)
    img_1quad = create_coordinate_graph_image(300, 300, four_quadrants=False)
    analysis_1q = DeepOfflineVectorizer.analyze_raster_image(img_1quad, 300, 300)
    figures_1q = analysis_1q.get("figures", [])
    assert len(figures_1q) >= 1
    assert figures_1q[0]["type"] == "coordinate_graph"
    assert figures_1q[0].get("metadata", {}).get("quadrants") == 1

    # 3. Native vector coordinate graph
    drawings = [
        {
            "color": (0.1, 0.2, 0.8),
            "width": 2.5,
            "items": [
                ("l", (30, 150), (270, 150)),  # Horizontal axis
                ("l", (150, 30), (150, 270)),  # Vertical axis
                ("l", (90, 145), (90, 155)),   # Tick on X
                ("l", (210, 145), (210, 155)), # Tick on X
                ("l", (145, 90), (155, 90)),   # Tick on Y
                ("l", (145, 210), (155, 210)), # Tick on Y
            ],
        }
    ]
    vec_fig = DeepOfflineVectorizer._classify_vector_drawings(drawings, 300, 300, 1)
    assert vec_fig["type"] == "coordinate_graph"
    assert vec_fig.get("metadata", {}).get("diagram_category") == "coordinate_graph"
    assert "coord-arrow" in vec_fig["svg"]
    assert vec_fig.get("metadata", {}).get("quadrants") == 4
