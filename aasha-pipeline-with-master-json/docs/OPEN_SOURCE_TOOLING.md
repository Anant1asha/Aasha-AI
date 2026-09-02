# Open-Source Tooling — Use Before You Build

Every piece of pipeline/tooling infrastructure should have a "did someone already
solve this" check before writing custom code. The engine template itself stays
hand-rolled (it's the proven asset) — everything around it should lean on open source.

| Need | Library | License | Notes |
|------|---------|---------|-------|
| PDF text/layout extraction | PyMuPDF (fitz) | AGPL/commercial dual | Spec's chosen ingestion library. Fallback: pdfplumber for complex tables. |
| JSON schema validation | jsonschema (Python) / ajv (Node) | MIT | Validate chapter_spec.json before assembly. |
| Headless DOM for QA | jsdom | MIT | QA harness approach. Pairs with Node test runner. |
| LLM provider abstraction | Direct SDKs (openai, google-generativeai, anthropic) | Provider SDK licenses (all permissive) | Behind a 1-file adapter interface. No heavy agent framework needed. |
| Retry/backoff | tenacity | Apache 2.0 | Exponential backoff + jitter, matches NFR-3. |
| CLI argument parsing | argparse (stdlib) | — | No need for click/typer for the MVP CLI surface. |
| Web UI | Flask | BSD | Spec's choice. Plain textarea is sufficient for JSON editor. |
| Data validation | Pydantic | MIT | Used for all pipeline schemas. |
| Config loading | PyYAML | MIT | Reads config.yaml. |
| Interactive simulations | PhET (University of Colorado Boulder) | GPL v3 (sims), CC-BY (some assets) | Verify per-sim license before embedding. Reserved in schema, not generated in MVP. |
| Confetti | Hand-rolled canvas | — | 40 particles, one function — no library needed. |
| Audio tone synthesis | Web Audio API | — | Direct browser API, no library needed for 4 sound effects. |
| Fonts | Fredoka + Inter | SIL OFL | Embed as base64 @font-face for offline compliance. |
| Icons | Inline SVG | — | Hand-authored keeps file size minimal. |
| Devanagari/Hindi text | No library needed | — | This is data (WM/CONN dictionaries), not a rendering problem. Browser renders Devanagari natively. |

## Principle for Future Additions

Before writing new infrastructure code, check this table and search first. The
engine template is the one place where "build it ourselves" is correct — it's
the hand-tuned asset that makes chapters work on low-end Android at zero
dependencies. Everything in the pipeline around it is commodity tooling.
