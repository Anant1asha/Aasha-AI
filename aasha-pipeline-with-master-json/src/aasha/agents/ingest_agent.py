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

    def run(self, work_dir: Path, context: dict[str, Any]) -> dict[str, Any]:
        pdf_path = Path(context.get("pdf_path", work_dir / "source.pdf"))
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF not found: {pdf_path}")

        self.log(f"Opening PDF: {pdf_path.name}")

        use_fitz = False
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(str(pdf_path))
            use_fitz = True
        except Exception as e:
            logger.info(f"PyMuPDF unavailable ({e}), using pypdf fallback")
            from pypdf import PdfReader
            reader = PdfReader(str(pdf_path))
            page_count = len(reader.pages)

        if use_fitz:
            page_count = len(doc)
            total_text = ""
            for page in doc:
                total_text += page.get_text()
        else:
            total_text = ""
            for page in reader.pages:
                total_text += page.extract_text() or ""

        if len(total_text.strip()) < 50:
            self.log("WARNING: PDF appears to be scanned (minimal text). Marking as failed.")
            if use_fitz:
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

        if use_fitz:
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
        else:
            # Pure-Python pypdf fallback
            for page_num, page in enumerate(reader.pages, 1):
                text = page.extract_text() or ""
                lines = [line.strip() for line in text.split("\n") if line.strip()]
                page_blocks = []
                for line in lines:
                    b_type = "text"
                    if re.match(r"^\d+\.\d+\s+[A-Z]", line) or (line.isupper() and len(line) < 60 and not line.startswith("PAGE")):
                        b_type = "heading"
                        headings.append({
                            "text": line,
                            "page": page_num,
                            "level": 1 if re.match(r"^\d+\.\d+", line) else 2,
                        })
                    page_blocks.append({
                        "x0": 0.0,
                        "y0": 0.0,
                        "x1": 500.0,
                        "y1": 50.0,
                        "text": line,
                        "type": b_type,
                    })

                ex_matches = re.findall(r"(?:Exercise\s+[\d.]+|\bQ\d+\b|\b\d+\.\s+[A-Z])", text)
                ex_heading_match = re.search(r"(Exercise\s+[\d.]+)", text, re.IGNORECASE)
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
                    "images": [],
                })

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
