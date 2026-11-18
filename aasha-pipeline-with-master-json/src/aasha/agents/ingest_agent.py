"""IngestAgent — Stage 1: PDF Ingestion.

Extracts structured text, images, and page-level layout from a PDF using PyMuPDF.
Output: raw_extract.json
"""

from __future__ import annotations

import base64
import io
import logging
import re
from pathlib import Path
from typing import Any

from .base import BaseAgent

logger = logging.getLogger(__name__)


class IngestAgent(BaseAgent):
    """Extracts structured text from a PDF textbook."""

    def __init__(self):
        super().__init__(name="IngestAgent", stage="ingest", llm=None)

    @property
    def requires_llm(self) -> bool:
        return False


    def _extract_pdf_fallback(self, pdf_path: Path) -> dict[str, Any]:
        """Fallback PDF text extraction using pypdf or raw PDF text-stream parsing."""
        pages_text: list[str] = []
        try:
            import pypdf
            reader = pypdf.PdfReader(str(pdf_path))
            for p in reader.pages:
                pages_text.append(p.extract_text() or "")
        except Exception:
            raw = pdf_path.read_bytes().decode("latin-1", errors="ignore")
            # Extract literal strings inside (...) in PDF content streams
            chunks = re.findall(r"\(([^()]{3,})\)", raw)
            cleaned = [re.sub(r"\\(.)", r"\1", c).strip() for c in chunks]
            pages_text = ["\n".join(c for c in cleaned if any(ch.isalpha() for ch in c))]
        pages = []
        headings = []
        exercises = []
        for idx, text in enumerate(pages_text, 1):
            lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
            blocks = []
            for ln in lines:
                btype = "heading" if (len(ln) < 80 and (ln.istitle() or ln.isupper() or re.match(r"^(?:Chapter|Section|Exercise|\d+\.\d+)\b", ln, re.I))) else "text"
                if btype == "heading":
                    headings.append({"text": ln, "page": idx, "level": 1})
                blocks.append({"x0": 0.0, "y0": 0.0, "x1": 600.0, "y1": 20.0, "text": ln, "type": btype})
            ex_matches = re.findall(r"^(Q\d+|Exercise\s+\d+|\d+\.)", text, re.MULTILINE)
            if ex_matches:
                exercises.append({"page": idx, "heading": f"Exercises p.{idx}", "questions": ex_matches[:20]})
            pages.append({"page_num": idx, "text": text, "blocks": blocks, "images": []})
        return {
            "source_file": pdf_path.name,
            "page_count": len(pages),
            "pages": pages,
            "headings": headings,
            "exercises": exercises,
            "figures": [],
        }

    def run(self, work_dir: Path, context: dict[str, Any]) -> dict[str, Any]:
        pdf_path = Path(context.get("pdf_path", work_dir / "source.pdf"))
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF not found: {pdf_path}")

        self.log(f"Opening PDF: {pdf_path.name}")

        try:
            import fitz  # PyMuPDF
        except ImportError:
            self.log("PyMuPDF (fitz) unavailable; using fallback PDF extractor")
            raw_extract = self._extract_pdf_fallback(pdf_path)
            output_path = self._write_json(work_dir, "raw_extract.json", raw_extract)
            return {
                "output_file": str(output_path),
                "page_count": raw_extract["page_count"],
                "heading_count": len(raw_extract["headings"]),
                "figure_count": 0,
            }

        doc = fitz.open(str(pdf_path))
        page_count = len(doc)

        # Check if scanned (no extractable text)
        total_text = ""
        for page in doc:
            total_text += page.get_text()
        if len(total_text.strip()) < 50:
            self.log("WARNING: PDF appears to be scanned (minimal text). Marking as failed.")
            doc.close()
            return {
                "output_file": "",
                "error": "PDF appears to be scanned (no extractable text). OCR is not supported in MVP.",
                "page_count": page_count,
            }

        pages = []
        headings = []
        exercises = []
        figures = []

        # Collect font sizes for heading detection
        all_sizes = []
        for page in doc:
            blocks = page.get_text("dict")["blocks"]
            for block in blocks:
                if "lines" in block:
                    for line in block["lines"]:
                        for span in line["spans"]:
                            all_sizes.append(span["size"])
        median_size = sorted(all_sizes)[len(all_sizes) // 2] if all_sizes else 12.0

        for page_num, page in enumerate(doc, 1):
            text = page.get_text("text")
            blocks_raw = page.get_text("dict")["blocks"]

            # Sort blocks by position (column then vertical)
            page_blocks = []
            for block in blocks_raw:
                if "lines" in block:
                    block_text = " ".join(
                        span["text"]
                        for line in block["lines"]
                        for span in line["spans"]
                    ).strip()
                    if block_text:
                        block_type = "text"
                        max_size = max(
                            (span["size"] for line in block["lines"] for span in line["spans"]),
                            default=12.0,
                        )
                        if max_size > median_size * 1.2 and len(block_text) < 100:
                            block_type = "heading"
                            headings.append({
                                "text": block_text,
                                "page": page_num,
                                "level": 1 if max_size > median_size * 1.5 else 2,
                            })
                        page_blocks.append({
                            "x0": block["bbox"][0],
                            "y0": block["bbox"][1],
                            "x1": block["bbox"][2],
                            "y1": block["bbox"][3],
                            "text": block_text,
                            "type": block_type,
                        })

            # Extract images
            page_images = []
            for img_idx, img in enumerate(page.get_images(full=True)):
                try:
                    xref = img[0]
                    pix = fitz.Pixmap(doc, xref)
                    if pix.width > 800:
                        ratio = 800 / pix.width
                        pix = fitz.Pixmap(doc, xref)
                        # Downsample
                        new_w = int(pix.width * ratio)
                        new_h = int(pix.height * ratio)
                        pix = fitz.Pixmap(pix, 0) if pix.colorspace.n >= 4 else pix

                    img_bytes = pix.tobytes("png")
                    b64 = base64.b64encode(img_bytes).decode("ascii")
                    ref = f"img_p{page_num}_{img_idx}"
                    page_images.append({
                        "ref": ref,
                        "width": pix.width,
                        "height": pix.height,
                        "b64": b64,
                    })
                    figures.append({
                        "page": page_num,
                        "caption": "",
                        "image_ref": ref,
                    })
                except Exception as e:
                    logger.warning(f"Image extraction failed on page {page_num}: {e}")

            # Detect exercises (numbered questions)
            ex_pattern = re.compile(r"^(Q\d+|Exercise\s+\d+|\d+\.)", re.MULTILINE)
            ex_matches = ex_pattern.findall(text)
            if ex_matches:
                # Find exercise heading
                ex_heading_match = re.search(r"(Exercise\s+[\d.]+)", text)
                if ex_heading_match:
                    exercises.append({
                        "page": page_num,
                        "heading": ex_heading_match.group(1),
                        "questions": ex_matches[:20],
                    })

            pages.append({
                "page_num": page_num,
                "text": text,
                "blocks": page_blocks,
                "images": page_images,
            })

        doc.close()

        raw_extract = {
            "source_file": pdf_path.name,
            "page_count": page_count,
            "pages": pages,
            "headings": headings,
            "exercises": exercises,
            "figures": figures,
        }

        output_path = self._write_json(work_dir, "raw_extract.json", raw_extract)
        self.log(
            f"Extracted {page_count} pages, {len(headings)} headings, "
            f"{len(figures)} figures, {len(exercises)} exercise sections"
        )

        return {
            "output_file": str(output_path),
            "page_count": page_count,
            "heading_count": len(headings),
            "figure_count": len(figures),
        }
