# Stage 1 — Ingest

**In:** `source.pdf` (5-20 pages, single chapter)
**Out:** `raw_extract.json`
**Library:** PyMuPDF (`fitz`), fallback `pdfplumber` for complex tables — see `OPEN_SOURCE_TOOLING.md`.

## Output shape
```json
{
  "pages": [{ "text": "...", "blocks": [...], "images": ["data:image/png;base64,..."] }],
  "headings": ["..."],
  "exercises": [{"number": "1", "text": "..."}],
  "figures": [{"caption": "...", "page": 2, "image_ref": 0}]
}
```

## Rules
- Preserve reading order; sort multi-column layouts by column then vertical position
  (PyMuPDF block detection).
- Downsample extracted images to ≤800px width.
- Heuristics for headings (font size > body median, short, title-case) and exercises
  (numbered lists, "Q." prefixes, "Exercise" headings).
- Scanned (non-text) PDFs: detect and reject with a clear message. No OCR in this scaffold —
  it's real added scope, not a missing detail.

Full detail: `Aasha_MVP_6_Documents.md §2.2.1, §5.2`.
