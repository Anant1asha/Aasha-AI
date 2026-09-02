# Open-Source Tooling — Use Before You Build

Goal: every piece of pipeline/tooling infrastructure should have a "did someone already solve
this" check before writing custom code. The engine template itself stays hand-rolled (it's the
proprietary, proven asset) — everything *around* it should lean on open source.

| Need | Reach for | License | Notes |
|---|---|---|---|
| PDF text/layout extraction | **PyMuPDF** (`fitz`) | AGPL/commercial dual — use under the free tier for internal tooling, confirm terms before any redistribution | Already the spec's chosen ingestion library (`Aasha_MVP_6_Documents.md §2.2.1`). Fallback: `pdfplumber` for complex tables. |
| JSON schema validation | **ajv** (Node) or **jsonschema** (Python) | MIT | Validate `chapter_spec.json` against `schema/chapter_spec.schema.json` before assembly — don't hand-roll a validator. |
| Headless DOM for QA harness | **jsdom** | MIT | Already the spec's QA approach (`§2.2.9`). Pairs with a plain Node test runner (`node:test`) — no need for a full browser automation stack for this. |
| LLM provider abstraction | Direct SDKs (`openai`, `google-generativeai`, `anthropic`) behind a **1-file adapter interface** (`complete()`, `batch_complete()`) | Provider SDK licenses (all permissive) | Don't reach for a heavy agent framework (LangChain/LlamaIndex) for what the spec defines as two thin methods — it adds dependency weight without solving a problem the spec has. |
| Retry/backoff | **tenacity** (Python) | Apache 2.0 | Exponential backoff + jitter, matches NFR-3 exactly, don't hand-write. |
| CLI argument parsing | **argparse** (stdlib) | — | Spec already specifies this; no need for `click`/`typer` unless the CLI surface grows materially. |
| Web UI | **Flask** (stdlib-adjacent, BSD) | BSD | Spec's choice (`§2.6`). For the JSON spec editor screen, a plain `<textarea>` is sufficient for MVP; **CodeMirror** (MIT) is the escalation if syntax highlighting becomes worth the weight. |
| Interactive simulations | **PhET Interactive Simulations** (University of Colorado Boulder) | GPL v3 (simulations), CC-BY (some assets) — verify per-sim license before embedding | Already used in the Fractions v8 build via base64 iframe embedding. Check license per simulation; PhET simulations are open source and designed for exactly this kind of educational embedding, but GPL v3 has redistribution implications — confirm before shipping broadly. |
| Confetti / celebration effects | Hand-rolled canvas (current) is fine and tiny; if replacing, **canvas-confetti** (MIT) is the standard lightweight option | MIT | Only worth swapping if the hand-rolled version becomes a maintenance burden — it currently isn't (40 particles, one function). |
| Audio tone synthesis | Web Audio API directly (current approach) is correct for a single-file, zero-dependency constraint | — | A library like **Tone.js** is not worth the KB cost for four sound effects — this is a case where NOT reaching for open source is the right call, because Design Principle #1 (one file, zero dependencies) outweighs convenience. |
| Fonts | **Fredoka** + **Inter** (established as the platform's type pair) | SIL Open Font License | Both are Google Fonts / OFL — embed as base64 `@font-face` for full offline compliance rather than linking, per Design Principle #3 (offline-first, no CDN). |
| Icons | Inline SVG (current) or **Lucide** (MIT, tree-shakeable SVG icon set) if the icon surface grows | MIT | For a handful of UI icons, hand-authored inline SVG (current) keeps file size minimal; Lucide is the fallback if a chapter needs many more icons than currently used. |
| Devanagari/Hindi text handling | No library needed — this is data (the WM/CONN dictionaries), not a rendering problem, since the browser's native font stack renders Devanagari fine | — | Don't add an i18n framework for a two-language, tap-to-reveal dictionary lookup; `rt()` already solves this in ~15 lines. |

## Principle for future additions

Before writing new infrastructure code for the pipeline (ingestion, LLM orchestration, QA), check
this table and a quick search first. The engine template (`template/v5-engine-template.html`) is
the one place where "build it ourselves" is correct — it's the proprietary, hand-tuned asset that
makes the chapters work on low-end Android at zero dependencies. Everything in the *pipeline*
around it is commodity tooling and should use commodity libraries.
