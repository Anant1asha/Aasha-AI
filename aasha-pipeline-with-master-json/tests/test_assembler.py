"""Tests for the HTML assembler."""

import json
import os
from pathlib import Path

import pytest

from aasha.assemble import HTMLAssembler


@pytest.fixture
def template_path():
    """Path to the v5 engine template."""
    path = Path(__file__).parent.parent / "template" / "v5-engine-template.html"
    if not path.exists():
        pytest.skip(f"Template not found at {path}")
    return str(path)


@pytest.fixture
def spec():
    return {
        "chapter": {
            "title": "Test Chapter",
            "subject": "math",
            "grade": 4,
            "storage_key": "aasha_test_v5",
            "emoji": "📚",
        },
        "BADGES": [
            {"id": "b1", "name": "First", "ic": "🎯", "desc": "First"},
        ],
        "WE": {"we_1": {"title": "WE", "question": "Q?", "steps": [], "check": {"q": "Q?", "opts": []}}},
        "SOLVE": {},
        "NODES": [{"title": "N1", "steps": [{"t": "progress", "xp": 10}]}],
    }


@pytest.fixture
def lle():
    return {
        "CONN": {"because": "क्योंकि (बिकॉज़)"},
        "WM": {"fraction": "भिन्न (फ्रैक्शन)"},
    }


def test_assembler_produces_html(template_path, spec, lle):
    assembler = HTMLAssembler(template_path)
    html = assembler.assemble(spec, lle)
    assert "<!DOCTYPE html>" in html
    assert "</html>" in html


def test_assembler_injects_title(template_path, spec, lle):
    assembler = HTMLAssembler(template_path)
    html = assembler.assemble(spec, lle)
    assert "Test Chapter" in html


def test_assembler_injects_wm(template_path, spec, lle):
    assembler = HTMLAssembler(template_path)
    html = assembler.assemble(spec, lle)
    assert "भिन्न" in html  # Devanagari preserved


def test_assembler_no_placeholders(template_path, spec, lle):
    assembler = HTMLAssembler(template_path)
    html = assembler.assemble(spec, lle)
    import re
    placeholders = re.findall(r"\{\{[A-Z_]+\}\}", html)
    assert len(placeholders) == 0, f"Unresolved placeholders: {placeholders}"


def test_assembler_preserves_devanagari(template_path, spec, lle):
    """Ensure ensure_ascii=False preserves Devanagari characters."""
    assembler = HTMLAssembler(template_path)
    html = assembler.assemble(spec, lle)
    # Should NOT contain unicode escape sequences for Devanagari
    assert "\\u092d" not in html
    assert "भिन्न" in html
