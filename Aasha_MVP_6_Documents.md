# AASHA FOUNDATION — AI PIPELINE MVP
# Engineering Document Set (6 Documents)

**Project**: Annanth Aasha Foundation — AI-Powered PDF-to-Gamified-HTML Chapter Pipeline
**MVP Scope**: One pipeline that ingests a textbook PDF and produces a single self-contained gamified HTML chapter using the proven v5 engine. Plus a simple web UI and a CLI.
**Baseline**: v5 production engine, stabilized over 9 rounds of building Fractions (Grade 4) and Perimeter & Area (Grade 4).
**Date**: September 2026

This single file contains all six engineering documents, separated by `---`.

---

# DOCUMENT 1 — PRODUCT REQUIREMENTS DOCUMENT (PRD)

## 1.1 Purpose of This PRD

This PRD defines the MVP for the Aasha Foundation's automated chapter-authoring system. The MVP does one thing: it takes a textbook PDF as input and produces a single, self-contained, gamified HTML chapter file as output, conforming exactly to the v5 engine specification that already powers the hand-built Fractions and Perimeter & Area chapters.

The MVP is NOT the full Aasha learning platform. There is no student app, no authentication, no cohorts, no economy, no teacher dashboard, no evidence system, no Eco Seva or Jal Seva modules. All of those are explicitly deferred to post-MVP and are listed only as future scope.

## 1.2 What "Done" Looks Like for the MVP

The MVP is complete when all of the following are true:

1. A user can upload a textbook PDF (single chapter, roughly 5–20 pages) through a web form and receive back a downloadable `.html` file.
2. A user can run a CLI command against a folder of PDFs and receive a folder of `.html` chapters.
3. Every generated HTML file passes the same automated QA suite (200+ checks) that hand-built chapters pass — syntax, render, flow, and the 10 critical rules.
4. Every generated chapter uses the exact v5 engine: single file, zero dependencies, offline, mobile-first (480px), touch-optimized, LLE-enabled, gamified.
5. LLM cost per chapter is under $0.50.
6. A human reviewer can open the JSON intermediate representation (the "chapter spec") and edit it before final HTML compilation, without touching the v5 template.

## 1.3 The Single Product Surface

The MVP has exactly one product: the generated chapter. The pipeline that produces it, the web UI, and the CLI are all means to that end. The chapter itself is what reaches a learner.

## 1.4 Target Audience of the Generated Chapter

Inherited unchanged from the v5 baseline:
- Primary: Students in Indian government schools, Grades 3–8.
- Secondary: Teachers using DIKSHA/Sunbird.
- Devices: Low-end Android smartphones (primary), tablets, desktops.

The audience of the pipeline tool itself (the web UI and CLI) is a content author or operator at the Aasha Foundation, not the student.

## 1.5 Design Principles (Inherited from v5)

1. One file, zero dependencies.
2. Mobile-first (480px max-width, touch interaction).
3. Offline-first (all assets embedded, no CDN, no external requests).
4. Bilingual (English content with Hindi tap-to-reveal translations + phonics).
5. Gamified but lightweight (XP, badges, streaks, confetti; no coins/shop/economy).
6. Conceptual over rote (wrong answers explain misconceptions, never reveal the correct answer).

These principles are non-negotiable constraints on the output of the pipeline. The pipeline's job is to produce content that satisfies all six; it may not relax any of them.

## 1.6 MVP Functional Requirements

### FR-1 PDF Ingestion
The system accepts a PDF file and extracts structured text, images, and page-level layout. The extraction must preserve reading order and identify headings, body paragraphs, worked examples, exercise questions, and figure captions. Output is an intermediate "raw extract" JSON.

### FR-2 Content Analysis
The system analyzes the raw extract using an LLM to identify: (a) the chapter's core concepts (3–5 become Nodes), (b) candidate worked examples, (c) quiz opportunities, (d) interactive visual opportunities, (e) key vocabulary for LLE. Output is a "content map" JSON.

### FR-3 Learning Design
The system structures the content map into the v5 NODES/steps shape: assigns each concept a node, sequences steps within each node using the proven chapter flow (Intro → Text → Interactive Visual → Worked Example → Quiz → … → Progress), and assigns a step type from the 12 supported types. Output is a "chapter spec" JSON conforming to the Backend Schema Document.

### FR-4 Assessment Generation
For every quiz, VQ, solve step, and WE check, the system generates: the question text, 3–4 options, exactly one correct option marked `c:true`, and a misconception explanation `m` for every wrong option. All options are conceptually plausible distractors tied to a specific misconception, not random. Checks inside worked examples must be SPECIFIC to the concept being taught in that step — never generic "Did you understand?".

### FR-5 LLE Generation
For every distinct English word appearing in body text, the system generates the LLE entry in the format `हिंदी_अर्थ (अंग्रेज़ी_उच्चारण_देवनागरी_में)`. Words are classified as CONN (connecting words, shown inline blue) or WM (general vocabulary, tap-to-reveal). The system must reuse the existing 46 CONN and 296+ WM dictionary entries and only generate net-new entries for chapter-specific terms.

### FR-6 Misconception Explanations
Every wrong option in every assessment carries an `m` field. The explanation must be verbal (a sentence the child reads), specific to why THAT distractor is wrong, and must NEVER state or imply the correct answer. This is enforceable by QA.

### FR-7 HTML Assembly
The system compiles the chapter spec into a single HTML file by injecting content into the v5 template at the four placeholders: `{{CONTENT}}` (NODES), `{{WE}}` (worked example definitions), `{{WM}}` (word dictionary), `{{CONN}}` (connecting words dictionary). The output is a valid, standalone `.html` file.

### FR-8 Automated QA
The system runs the existing 200+ check QA suite against the generated HTML: syntax check (node --check on extracted JS), render-every-step, quiz flow, VQ flow, WE full flow, DD build, DD match, solve, advance/goBack/exit, no dead code, skip buttons present, WE checks specific, localStorage bounds. A chapter that fails any check is reported as failed with the failing check listed; it is NOT delivered.

### FR-9 Web UI
A simple web interface lets an operator upload one PDF, set metadata (subject, grade, provider, model), watch live progress through the 9 pipeline stages, preview the generated HTML in-browser, download the HTML, and download the JSON spec for manual editing. No login.

### FR-10 CLI
A Python CLI supports batch processing: `python build_chapter.py --pdf chapter.pdf --subject math --grade 4 --provider openai`. It accepts a directory of PDFs, runs the pipeline per file, writes HTML + JSON spec to an output directory, and prints a summary report (chapters built, chapters failed, total LLM cost, total time).

## 1.7 Non-Functional Requirements

### NFR-1 Cost
LLM cost per chapter under $0.50, achieved through provider selection (GPT-4o-mini default, Gemini free-tier fallback), prompt caching, and batching of independent LLM calls (LLE entries, misconceptions) into single requests.

### NFR-2 Latency
A single chapter should process in under 5 minutes end-to-end on the default provider. Batch jobs report progress; no chapter blocks another in the CLI (sequential is acceptable for MVP, parallel is a future optimization).

### NFR-3 Reliability
Every LLM call is retried up to 3 times with exponential backoff. Partial failures (one LLE entry missing) degrade gracefully: the word falls back to the "इस शब्द का हिंदी अर्थ अभी उपलब्ध नहीं है" message rather than failing the chapter. A chapter only fails if a structural element (NODES, a WE definition, an assessment with no correct option) cannot be produced.

### NFR-4 Determinism of Output Shape
Regardless of which LLM provider is used, the output chapter spec must conform to the same JSON schema and the generated HTML must pass the same QA suite. Provider choice must not leak into the output format.

### NFR-5 Reproducibility
Given the same PDF, same provider, same model version, and a fixed temperature of 0 (or as low as the provider allows), the pipeline should produce substantively similar output across runs. Exact byte-identity is not required; structural and conceptual fidelity is.

### NFR-6 Offline Output
The generated HTML must work with zero network access. This is inherited from v5 and is verified by QA (no external URLs in the file).

## 1.8 The 10 Critical Rules (Enforced by QA, Non-Negotiable)

These are inherited from the v5 baseline and are enforced as hard QA gates on every generated chapter:

1. Wrong answers NEVER reveal the correct answer — only verbal misconception explanations.
2. All quiz/VQ/solve/WE check options are shuffled.
3. No drag-and-drop — tap-to-select, tap-to-place only.
4. No confirm()/alert() — these freeze mobile browsers.
5. Skip button on all interactive steps.
6. Button NEVER disabled when it's the only way forward.
7. `_weCheckRendered` flag present and used for multi-phase WE check flows.
8. localStorage bounds-checked (corrupt data must not crash).
9. exit() is an instant reset with no dialog.
10. Every kilobyte is proof of work — no dead code, no unused CSS, no orphaned functions.

## 1.9 Out of Scope (Explicitly Deferred to Post-MVP)

The following are NOT part of the MVP and must not appear in the generated chapters, the web UI, or the CLI:

- Eco Seva and Jal Seva modules.
- Cohorts, group learning, social features.
- Evidence/capture system.
- Aasha Economy (coins, shop, marketplace).
- Full student app with authentication, profiles, progress sync across devices.
- Backend database, user accounts, server-side state.
- Teacher dashboards, analytics, classroom management.
- Multi-language expansion beyond English+Hindi (the LLE is English→Hindi only for MVP).
- Content management system, editorial workflows, multi-author collaboration.
- Automated illustration/image generation (chapters may reuse embedded SVG/canvas visuals; AI image generation is out of scope).

## 1.10 Future Scope (Post-MVP)

- Expansion of LLE to additional Indian languages (Tamil, Telugu, Marathi, Bengali, etc.).
- A content management system with editorial review and approval workflows.
- S3/Cloudflare R2 storage and a catalog of generated chapters.
- A student-facing app shell that loads chapters and syncs progress.
- Teacher dashboards with per-student analytics.
- Automated image/illustration generation for hero images and visuals.
- Integration with DIKSHA/Sunbird for distribution.
- Batch re-processing when the v5 engine or LLE dictionaries are updated.
- Cost optimization via fine-tuned smaller models for LLE and misconception generation.

## 1.11 Success Metrics for the MVP

| Metric | Target |
|--------|--------|
| Chapters passing full QA suite on first generation | ≥ 60% |
| Chapters passing QA after one JSON-spec edit cycle | ≥ 90% |
| LLM cost per chapter | < $0.50 |
| Time per chapter (single) | < 5 min |
| Human review time per chapter | < 30 min |
| Generated chapter file size | < 200 KB (for jsdom full-flow test eligibility) |

---

# DOCUMENT 2 — TECHNICAL REQUIREMENTS DOCUMENT (TRD)

## 2.1 System Architecture Overview

The MVP is a Python application with two front-ends: a Flask web UI and an argparse CLI. Both front-ends call the same pipeline core. The pipeline produces a JSON "chapter spec" intermediate, then compiles it to HTML using a string-template version of the v5 engine. A Node.js QA harness validates the output. No database; job state is JSON files on the local filesystem.

```
┌─────────────┐     ┌──────────────────────────────────────────┐     ┌──────────────┐
│  Web UI     │────▶│                                          │     │              │
│  (Flask)    │     │           PIPELINE CORE (Python)          │     │  QA Harness  │
└─────────────┘     │                                          │────▶│  (Node.js +  │
                    │  1. PDF Ingestion   (PyMuPDF)            │     │   jsdom)     │
┌─────────────┐     │  2. Content Analysis (LLM)               │     └──────┬───────┘
│  CLI        │────▶│  3. Learning Design  (LLM)               │            │
│  (argparse) │     │  4. Assessment Gen   (LLM)               │     ┌──────▼───────┐
└─────────────┘     │  5. LLE Generation    (LLM)               │     │  Output      │
                    │  6. Misconceptions    (LLM)              │     │  .html file  │
                    │  7. HTML Assembly     (template inject)   │     │  .json spec  │
                    │  8. Automated QA     ────────────────────▶│     └──────────────┘
                    └──────────────────────────────────────────┘
```

## 2.2 Component Specification

### 2.2.1 PDF Ingestion Module
- Library: PyMuPDF (fitz), MIT license. Fallback: pdfplumber for complex table layouts.
- Input: path to a `.pdf` file.
- Output: `raw_extract.json` containing:
  - `pages`: array of page objects, each with `text` (reading-order-preserving), `blocks` (layout blocks with bounding boxes), `images` (extracted as base64 PNG, downsampled to max 800px width).
  - `headings`: detected heading lines (heuristic: font size > body median, short, title-case).
  - `exercises`: detected exercise/question sections (heuristic: numbered lists, "Q." prefixes, "Exercise" headings).
  - `figures`: array of `{caption, page, image_ref}`.
- Constraints: handle multi-column layouts (common in Indian textbooks) by using PyMuPDF's block detection and sorting by column then vertical position. Do not OCR scanned PDFs in MVP — log a warning and skip (future scope).

### 2.2.2 LLM Adapter Layer
- A thin abstraction (`llm_adapter.py`) supporting multiple providers via config:
  - OpenAI: GPT-4o-mini (default). Cost ~$0.15/1M input, ~$0.60/1M output.
  - Google Gemini: free-tier fallback for low-volume runs.
  - Anthropic Claude: optional, config-enabled.
- Each provider exposes two methods: `complete(system, user, json_schema)` returning parsed JSON, and `batch_complete(items)` for batching independent calls.
- All calls include a `response_format: json` instruction and a JSON schema where the provider supports it (OpenAI structured outputs; Gemini response_schema; others: prompt + parse + validate).
- Retry: 3 attempts, exponential backoff (1s, 2s, 4s), with jitter. On final failure, raise a typed `LLMGenerationError` caught by the pipeline orchestrator.
- Caching: a local file cache keyed by `sha256(system_prompt + user_prompt + model)` stores responses as JSON. Re-runs with the same inputs hit the cache (cost = $0). This makes iterative editing of the JSON spec free.
- Temperature: 0 for structural generation (content map, chapter spec, assessments); 0.2 for LLE translations (allows natural phrasing while staying accurate).

### 2.2.3 Content Analysis Stage
- Input: `raw_extract.json`.
- LLM call: system prompt instructs the model to act as an expert pedagogue for Indian government-school curriculum. It must output a `content_map` JSON with:
  - `concepts`: 3–5 concept objects, each `{name, summary, key_ideas[], difficulty}`.
  - `worked_examples`: candidate problems with their solution approach.
  - `quiz_opportunities`: points where a check-for-understanding fits.
  - `visual_opportunities`: where a pizza/bar/area/slider model would illustrate the concept.
  - `vocabulary`: key terms needing LLE entries (beyond existing WM/CONN).
- Prompt includes the subject and grade to calibrate language difficulty.

### 2.2.4 Learning Design Stage
- Input: `content_map.json`.
- LLM call: maps the content map to the v5 NODES/steps structure. Output: `chapter_spec.json` (partial — NODES and WE definitions, but assessments and LLE not yet filled). The model is given the exact JSON schema (see Document 5) and the 12 step types. It must:
  - Create 3–5 nodes, one per concept.
  - Sequence steps per node using the proven flow.
  - Assign step types.
  - Reference WE definitions by key (e.g., `WE.we_1`).
- A post-processor validates the structure against the schema before proceeding.

### 2.2.5 Assessment Generation Stage
- Input: `chapter_spec.json` (structure) + `content_map.json` (content).
- For each assessment (quiz, VQ, solve sub-steps, WE inline checks, WE end checks), an LLM call generates the question, options, and misconceptions. This stage is batched: all assessments in a chapter are generated in 1–3 LLM calls (batched by node) to amortize context.
- Hard constraints enforced post-generation:
  - Exactly one option has `c:true` per question.
  - Every wrong option has a non-empty `m`.
  - No `m` field may contain the correct answer or its value.
  - WE check questions must reference the specific concept of their step (validated by a keyword-overlap heuristic against the step text; flagged for human review if overlap is zero).

### 2.2.6 LLE Generation Stage
- Input: chapter spec body text (all text fields across all steps).
- Extract all distinct words (lowercased, stripped of punctuation).
- Partition: words already in the static WM/CONN dictionaries are reused. Net-new words are batched into LLM calls that return `{word: "हिंदी_अर्थ (उच्चारण)"}` objects.
- Classification: a word is CONN if it appears in a fixed connecting-words list; otherwise WM.
- Output: `lle.json` = merged dictionary (existing + new entries), ready to inject at `{{WM}}` and `{{CONN}}`.

### 2.2.7 Misconception Generation Stage
- Already produced within Assessment Generation (the `m` fields). This is listed as a distinct logical stage for clarity and because it is the highest-risk content quality area. A dedicated QA check scans every `m` field for accidental correct-answer leakage (substring match against the correct option text).

### 2.2.8 HTML Assembly Module
- Input: `chapter_spec.json` + `lle.json` + the v5 HTML template string.
- The v5 template is stored as a Python string constant with four placeholders: `{{CONTENT}}`, `{{WE}}`, `{{WM}}`, `{{CONN}}`.
- Assembly: serialize NODES and WE to JS object literals (using `json.dumps` with `ensure_ascii=False` so Devanagari is preserved), then string-replace the placeholders.
- The static engine JS (App controller, rt(), showWord, confetti, etc.) is a fixed constant — the pipeline never modifies it.
- Output: a single `.html` file written to the output directory.

### 2.2.9 QA Harness (Node.js + jsdom)
- The existing 200+ check suite, invoked as a subprocess from Python.
- Stages: (1) `node --check` on the extracted script for syntax; (2) jsdom load + render every N×S step combination; (3) flow simulation per step type; (4) the 10 critical-rules checks; (5) dead-code scan (grep for `setupTouchDrag`, unused CSS selectors).
- Returns a JSON report: `{passed: bool, checks_total, checks_passed, failures[]}`.
- The pipeline treats a failed QA as a failed chapter; the failure list is surfaced to the operator.

## 2.3 The v5 Engine Contract (What the Pipeline Must Not Violate)

The generated HTML must be byte-compatible in structure with the hand-built chapters. Specifically:

- Single file. No `<link>`, no `<script src>`, no external URLs. Verified by QA grep.
- `<head>` contains viewport meta + inline `<style>` (~15.5 KB CSS).
- `<body>` contains `#app` (topBar, screen, bottomBar), `#wordDialog`, `#badgeDialog`, inline `<script>`.
- Script load order: CONN → WM → rt()/showWord → NODES → WE → App → App.init().
- localStorage key pattern: `aasha_[chapter]_v5`.
- App controller has the ~30 methods listed in the v5 TRD. The pipeline copies the controller verbatim; it never regenerates controller code.

## 2.4 Step Type Support Matrix (Pipeline Generation)

| Step Type | Generated by Pipeline? | Notes |
|-----------|----------------------|-------|
| text | Yes (always) | Body text from content analysis, LLE-wrapped at runtime |
| quiz | Yes | 3–4 options + misconceptions |
| VQ | Yes (when visual opportunity exists) | Canvas question; simpler visuals only in MVP |
| worked example (WE) | Yes | 3–4 steps, inline check on key step, end-of-WE check |
| solve | Yes | Multi-step MCQ + input |
| dd_build | Yes (fractions/measurement) | Tap-to-build |
| dd_match | Yes (equivalences) | Tap-to-match, 4–5 pairs |
| interactive visual | Yes | Pizza/bar/area/slider — selected to fit concept |
| ix_slider | Yes (multiplicative relationships) | |
| video demo | Limited | Canvas animation only; MVP generates simple looped animations |
| progress | Yes (always, end of each node) | XP award |
| PhET sim | No (MVP) | Requires curated base64 embeds; deferred |

## 2.5 Data Flow and Intermediate Files

```
input.pdf
  → raw_extract.json        (PDF Ingestion)
  → content_map.json        (Content Analysis)
  → chapter_spec.json       (Learning Design + Assessment Gen)
  → lle.json                (LLE Generation)
  → chapter.html            (HTML Assembly + QA)
```

Each intermediate is a real file on disk (under a job-specific work directory), so a human can inspect/edit any stage and re-run from that point. The CLI exposes `--from-stage` to resume.

## 2.6 Technology Stack Summary

| Concern | Choice | License / Cost |
|---------|--------|---------------|
| Language | Python 3.11+ | Free |
| PDF parsing | PyMuPDF | MIT / AGPL (dual) — use under MIT terms |
| LLM (default) | OpenAI GPT-4o-mini | ~$0.15/1M input |
| LLM (fallback) | Google Gemini free tier | Free (rate-limited) |
| Web UI | Flask | BSD |
| CLI | argparse (stdlib) | Free |
| QA harness | Node.js + jsdom | MIT |
| HTML template | v5 engine (existing) | Proprietary |
| Storage | Local filesystem | Free |
| Job tracking | JSON files | Free |

## 2.7 Configuration

A single `config.yaml` at the project root:
```yaml
llm:
  default_provider: openai
  providers:
    openai:
      model: gpt-4o-mini
      temperature: 0
    gemini:
      model: gemini-1.5-flash
      temperature: 0
  cache_dir: ./.llm_cache
  max_retries: 3
pipeline:
  work_dir: ./work
  output_dir: ./output
  qa_runner: node ./qa/run_qa.js
storage:
  type: local
  path: ./jobs
```

API keys are read from environment variables (`OPENAI_API_KEY`, `GEMINI_API_KEY`), never from the config file.

## 2.8 Error Handling and Failure Modes

| Failure | Behavior |
|---------|----------|
| PDF unreadable / scanned | Log warning, mark job failed, do not attempt OCR |
| LLM call fails after 3 retries | Mark stage failed; chapter fails with reason |
| LLM returns malformed JSON | Retry once with a "repair" prompt; then fail |
| Assessment missing correct option | Regenerate that assessment once; then fail |
| Misconception contains correct answer | Regenerate that option's `m`; strip offending substring; flag for review |
| QA harness fails | Chapter marked failed; failures list surfaced to UI/CLI |
| Net-new LLE word generation fails | Word gets the fallback "not available" string; chapter still passes |

## 2.9 Security Considerations

- API keys never logged, never written to intermediate files.
- Uploaded PDFs stored in a job-scoped work directory, cleaned up after N days (configurable).
- The web UI binds to localhost by default (single-operator MVP); no public exposure.
- Generated HTML is sandbox-safe (no `eval`, no external fetches — verified by QA).

---

# DOCUMENT 3 — APP FLOW DOCUMENT

## 3.1 Purpose

This document describes two flows: (A) the internal pipeline flow that transforms a PDF into an HTML chapter, and (B) the web UI flow that an operator follows to use it. The CLI flow is a subset of (B) without the interactive UI.

## 3.2 Pipeline Flow (End-to-End)

### Stage 0 — Job Initialization
- A new job ID (UUID) is created.
- A work directory `./work/<job_id>/` is created.
- The uploaded PDF is copied in as `source.pdf`.
- A `job.json` is written with `{id, status: 'queued', created_at, input: {subject, grade, provider}}`.

### Stage 1 — PDF Ingestion
- PyMuPDF opens `source.pdf`.
- For each page: extract text in reading order, detect blocks, extract images (downsample to ≤800px).
- Heuristics detect headings, exercises, figure captions.
- Output: `raw_extract.json`.
- Job status → `ingesting` → `ingested`.

### Stage 2 — Content Analysis
- LLM call with the raw extract + subject/grade context.
- Identifies concepts, worked examples, quiz/visual opportunities, vocabulary.
- Output: `content_map.json`.
- Job status → `analyzing` → `analyzed`.

### Stage 3 — Learning Design
- LLM call with content map + v5 JSON schema.
- Produces NODES array (3–5 nodes) and WE definitions, with step types assigned.
- Structure validator runs: every node has ≥1 step; every step has a valid `t`; final node ends with a progress step lacking `next:true`.
- Output: `chapter_spec.json` (structure only — assessments/LLE pending).
- Job status → `designing` → `designed`.

### Stage 4 — Assessment Generation
- Batched LLM calls per node produce quiz/VQ/solve/WE-check content.
- Post-processors enforce: one correct option per question, misconceptions present, no answer leakage, WE checks specific.
- Output: updated `chapter_spec.json` (assessments filled in).
- Job status → `assessing` → `assessed`.

### Stage 5 — LLE Generation
- All body text collected; distinct words extracted.
- Static WM/CONN reused; net-new words batched to LLM for Hindi+phonics.
- Output: `lle.json`.
- Job status → `lle` → `lle_done`.

### Stage 6 — Misconception QA Pass
- (Logical stage — runs as post-processing of Stage 4.)
- Scans every `m` field for substring overlap with the correct option. Flags and regenerates if found.

### Stage 7 — HTML Assembly
- NODES + WE serialized to JS object literals.
- `lle.json` split into WM and CONN dictionaries.
- All four injected into the v5 template via placeholder replacement.
- Output: `chapter.html` written to the work directory.
- Job status → `assembling` → `assembled`.

### Stage 8 — Automated QA
- Node.js QA harness invoked on `chapter.html`.
- Runs syntax check, render-all-steps, flow simulations, 10 critical rules, dead-code scan.
- Output: `qa_report.json`.
- If passed → job status `qa_passed`. If failed → `qa_failed` with failure list.

### Stage 9 — Output
- On pass: `chapter.html` and `chapter_spec.json` copied to `./output/`.
- Job status → `completed`.
- Final `job.json` records: duration, LLM cost estimate, QA pass count, output file paths.

### Failure / Retry Flow
- At any stage, if a non-recoverable error occurs, job status → `failed` with `error_stage` and `error_message`.
- The operator can edit the relevant intermediate JSON and re-run from that stage via `--from-stage` (CLI) or a "Resume from stage" button (UI).
- Common retry: edit `chapter_spec.json` to fix a WE check that was too generic, then re-run from Stage 7 (Assembly + QA). This costs $0 in LLM calls because the spec is already generated.

## 3.3 Pipeline Flow Diagram

```
 source.pdf
      │
      ▼
 ┌─────────────┐   raw_extract.json
 │ 1. Ingest   │────────────────────┐
 └─────────────┘                    │
      │                              │
      ▼                              │
 ┌─────────────┐   content_map.json  │
 │ 2. Analyze  │────────────────────┤
 └─────────────┘                    │
      │                              │
      ▼                              │
 ┌─────────────┐  chapter_spec.json  │  (human can edit
 │ 3. Design   │────────────────────┤   any intermediate
 └─────────────┘                    │   here, then resume)
      │                              │
      ▼                              │
 ┌─────────────┐                     │
 │ 4. Assess   │─────┐               │
 └─────────────┘     │ (updates spec)│
      │              │               │
      ▼              │               │
 ┌─────────────┐    │               │
 │ 5. LLE      │────┼───────────────┤  lle.json
 └─────────────┘    │               │
      │              │               │
      ▼              ▼               │
 ┌─────────────────────────┐        │
 │ 7. Assemble HTML        │◄───────┘
 └─────────────┬───────────┘
               │  chapter.html
               ▼
        ┌─────────────┐    qa_report.json
        │ 8. QA Test  │────────────────┐
        └─────┬───────┘                │
              │                        │
       pass?  │                        │
         ┌────┴────┐                   │
        YES        NO                  │
         │         │                   │
         ▼         ▼                   │
    output/   failed (operator edits   │
              spec, resumes from 7)────┘
```

## 3.4 Web UI Flow (Operator Journey)

### Screen 1 — Upload
- Operator opens the web UI (localhost:5000).
- Sees a single form: PDF file picker, Subject dropdown, Grade dropdown, LLM provider dropdown (default OpenAI), optional Model field.
- Clicks "Generate Chapter".
- The PDF uploads; a job is created; the browser redirects to the Job Status screen.

### Screen 2 — Job Status (Live)
- A progress timeline shows the 9 stages with current stage highlighted.
- Each stage shows: status icon (pending/running/done/failed), duration, and a short log line.
- A live log panel streams stage events (e.g., "Extracted 14 pages", "Generated 4 concepts", "LLM call 3/5 complete").
- Polling every 2 seconds (or SSE for the MVP if trivial) fetches `job.json` updates.
- No navigation away from this screen until completion or failure.

### Screen 3 — Result / Preview
- On success: a split view — left shows the rendered chapter HTML in an iframe (preview), right shows metadata (duration, cost, QA pass count, file sizes).
- Buttons: "Download HTML", "Download JSON Spec", "Open in new tab", "Edit JSON Spec" (opens an editor screen), "Regenerate from stage".
- On failure: the screen shows the failing stage, the error message, the failure list from QA, and a "Edit & Resume" button.

### Screen 4 — JSON Spec Editor (optional)
- A raw JSON editor (textarea or a lightweight code editor component) pre-loaded with `chapter_spec.json`.
- Operator edits (e.g., fixes a generic WE check question, corrects a misconception text).
- Clicks "Re-run Assembly + QA". This runs Stages 7–8 only (no LLM cost).
- Returns to the Result screen with the updated HTML.

### Screen 5 — Jobs List
- A simple list of past jobs (from the `./jobs/` directory), each row showing: job ID, source PDF name, status, created time, output link.
- Allows re-opening any job's Result screen.

## 3.5 CLI Flow

```
$ python build_chapter.py --pdf ./chapters/fractions.pdf \
    --subject math --grade 4 --provider openai

[1/9] Ingesting PDF........... done (14 pages, 3 figures)
[2/9] Analyzing content....... done (4 concepts, 6 worked examples)
[3/9] Designing learning...... done (4 nodes, 23 steps)
[4/9] Generating assessments.. done (8 quizzes, 4 WEs, 3 solves)
[5/9] Generating LLE......... done (47 new words, 296 reused)
[6/9] Checking misconceptions. done (0 leaks)
[7/9] Assembling HTML......... done (chapter.html, 142 KB)
[8/9] Running QA.............. PASS (217/217 checks)
[9/9] Writing output.......... ./output/fractions_chapter.html

Summary: 1 built, 0 failed. Cost: $0.31. Time: 3m 42s.
```

Batch mode:
```
$ python build_chapter.py --batch ./chapters/ --subject math --grade 4
Processing 12 PDFs...
[1/12] fractions.pdf ......... PASS
[2/12] decimals.pdf .......... PASS
...
Summary: 11 built, 1 failed (perimeter.pdf — QA: 3 failures). Cost: $3.48. Time: 41m.
```

## 3.6 State Transitions (Job Lifecycle)

```
queued → ingesting → ingested → analyzing → analyzed → designing → designed →
assessing → assessed → lle → lle_done → assembling → assembled →
qa_running → qa_passed → completed
                         ↘ qa_failed
any stage → failed (on unrecoverable error)
qa_failed/failed → (operator edits spec) → assembling (resume)
```

---

# DOCUMENT 4 — UI/UX DESIGN BRIEF

## 4.1 Scope of This Brief

This brief covers two distinct UX surfaces:
1. The **pipeline web UI** — the operator-facing tool for uploading PDFs and reviewing generated chapters.
2. The **generated chapter UX** — the standards every produced HTML chapter must meet, inherited from the v5 baseline. The pipeline must produce chapters that conform to these standards; the pipeline does not redesign them.

## 4.2 Part A — Pipeline Web UI

### 4.2.1 Design Principles for the Tool
- **Operator-focused, not student-focused.** The user is a content author, comfortable with files and JSON. No gamification, no child-friendly styling.
- **Transparency over polish.** Every stage visible, every intermediate file accessible. The operator should always be able to see what the LLM produced.
- **Calm interface.** Neutral palette (greys, whites, one accent color). No animations except progress indicators. This is a work tool.
- **Desktop-first.** The operator uses a laptop; the tool need not be mobile-responsive beyond not breaking on narrow windows.

### 4.2.2 Layout
A single-page application with a top navigation bar and a main content area. Three primary views, reachable from the nav bar: **Upload**, **Jobs**, **(Job Detail)**.

- **Top nav bar** (56px height): Left = "Aasha Pipeline" wordmark. Right = link to Jobs list. No user menu (no auth in MVP).
- **Main content**: max-width 960px, centered, 24px padding.

### 4.2.3 Upload View
- A centered card (max-width 520px) containing:
  - Heading: "Generate a Chapter".
  - File drop zone (dashed border, 160px tall) accepting `.pdf`. Shows filename on selection.
  - Row of fields: Subject (select: Math, Science, English, EVS), Grade (select: 3–8), Provider (select: OpenAI, Gemini), Model (text, optional, prefilled from config).
  - Primary button: "Generate" (disabled until a PDF is selected). On click → loading state → redirect to Job Detail.
- Below the card: a small note: "Cost target: under $0.50 per chapter. Output: a single offline HTML file."

### 4.2.4 Job Detail View
This is the primary working screen. It has three regions stacked vertically:

**Region 1 — Progress Timeline**
- A horizontal (or vertical on narrow screens) timeline of the 9 stages.
- Each stage node: a circle (state-colored: grey pending, blue pulsing running, green done, red failed) + stage name + duration.
- Clicking a completed stage expands its intermediate JSON in a collapsible panel below.

**Region 2 — Live Log**
- A monospace, dark-background log panel (240px tall, scrollable) streaming events.
- Auto-scrolls to bottom; pauses auto-scroll if the operator scrolls up.
- Each line prefixed with a timestamp and stage tag.

**Region 3 — Result (appears on completion)**
- On success: a two-column layout.
  - Left column: an iframe preview of the generated chapter, rendered at 480px width (to mirror the target device). A device-frame border optional.
  - Right column: metadata card (duration, LLM cost, QA checks passed, file sizes) + action buttons (Download HTML, Download JSON, Open in new tab, Edit JSON, Regenerate from stage).
- On failure: a failure card showing the failing stage, error message, QA failure list (if applicable), and an "Edit & Resume" CTA.

### 4.2.5 JSON Spec Editor View
- A full-width code editor (a textarea with monospace font and line numbers is sufficient for MVP; a library like CodeMirror is optional).
- Loaded with the current `chapter_spec.json`.
- A sticky bottom bar: "Cancel" and "Re-run Assembly + QA" (runs Stages 7–8 only).
- On completion, returns to Job Detail with updated preview.

### 4.2.6 Jobs List View
- A table: Job ID (truncated), Source PDF, Status (badge), Created, Duration, Cost, Actions (Open).
- Sorted by created desc. No pagination needed for MVP (expect <100 jobs).

### 4.2.7 Color and Typography (Tool)
- Font: system-ui stack (San Francisco / Segoe UI / Roboto). Base size 15px.
- Colors: background `#f8fafc`, surface `#ffffff`, border `#e2e8f0`, text `#1e293b`, muted `#64748b`, accent `#3b82f6` (blue), success `#22c55e`, danger `#ef4444`, warning `#f59e0b`.
- No rounded corners larger than 8px. No drop shadows heavier than `0 1px 3px rgba(0,0,0,0.1)`.

### 4.2.8 Accessibility (Tool)
- All interactive elements keyboard-reachable.
- Color contrast ≥ 4.5:1 for text.
- Log panel readable with `prefers-reduced-motion` (no pulsing animation).

## 4.3 Part B — Generated Chapter UX Standards (Inherited from v5)

The pipeline must produce chapters that conform to these standards exactly. These are acceptance criteria, not design suggestions.

### 4.3.1 Layout
- Max width 480px, centered.
- Top bar: Level, XP (star), streak, exit (X) button. Always visible.
- Content area: scrollable, padded.
- Bottom bar: single dynamic navigation button.
- Back button above the bottom bar, always visible.

### 4.3.2 Typography
- Instruction text: 1.15rem, weight 800, white on blue→purple gradient, box-shadow, 14px border-radius.
- Body text (LLE): 1.15rem, line-height 2.8, max-width 400px.
- Small text (LLE-sm): 0.95rem, line-height 2.2.
- WE step text: blue left-border cards, numbered.
- Answer/feedback: 0.8–0.9rem.
- Connecting words: blue, bold, dotted underline.
- Regular words: subtle dotted underline (tappable indicator).
- Minimum font size: 0.85rem for UI, 1.15rem for content.

### 4.3.3 Colors (CSS Variables — Fixed)
```css
--blue: #3b82f6; --blue-lt: #dbeafe;
--green: #22c55e; --green-lt: #dcfce7;
--red: #ef4444; --red-lt: #fee2e2;
--purple: #8b5cf6; --purple-lt: #ede9fe;
--amber: #f59e0b; --amber-lt: #fef3c7;
--text: #1e293b; --muted: #64748b;
```

### 4.3.4 Touch and Interaction
- Minimum 44px × 44px tap targets.
- Options: 12px vertical padding.
- Buttons: 14px × 30px padding minimum.
- No drag-and-drop anywhere. Tap-to-select, tap-to-place only.
- No confirm()/alert(). Inline feedback only.

### 4.3.5 LLE Presentation
- Every English word in body text tappable.
- CONN words (46): shown inline in blue with Hindi meaning; first 2 per sentence inline, rest on tap.
- WM words (296+): subtle dotted underline, Hindi on tap.
- Popup format: `हिंदी_अर्थ (अंग्रेज़ी_उच्चारण_देवनागरी_में)`.
- Words without translation: "इस शब्द का हिंदी अर्थ अभी उपलब्ध नहीं है".
- Fraction notation rendered as vertical fractions via CSS.

### 4.3.6 Worked Example UX
- Steps revealed one at a time via "Next Step →".
- Inline check after the key conceptual step: blue left-border, must answer correctly to proceed (+2 XP).
- End-of-WE check after final step: dashed separator, must answer to advance (+3 XP).
- Button state sequence enforced: "Next Step →" → "Check" (disabled until selection) → "Check" (enabled) → "Check →" (on last step) → "Continue →".
- Wrong answers: red highlight, verbal misconception, 5s retry, no correct-answer reveal.

### 4.3.7 Assessment UX (Quiz / VQ / Solve)
- Options shuffled; selection enables "Check".
- Correct: green, +5 XP, confetti, "Continue →".
- Wrong: red on selected, misconception text, 5s retry, no reveal.
- Solve sub-steps sequential; each must be correct to proceed.

### 4.3.8 Gamification Presentation
- Top bar shows level, XP (star), streak.
- Progress bar fills across nodes.
- Confetti (40-particle canvas burst, safety-wrapped) on correct answers and completions.
- Badge popup modal on milestone.
- Node completion: XP awarded (+15–30), badge check.
- No coins, shop, leaderboards, timers.

### 4.3.9 Navigation
- Back button: always visible above bottom bar; navigates to previous step/node.
- Exit (X): always visible top-left; instant reset to step 0,0, no dialog.
- Skip button: present on all interactive steps (DD build, DD match); advances without penalty.

### 4.3.10 Animation
- Confetti: canvas-based, 40 particles, wrapped in try/catch (never crashes on failure).
- Audio: `playTone()` for tap/correct/wrong feedback (Web Audio, optional, must degrade silently).
- CSS transitions on button states and option selection only. No heavy animations.

### 4.3.11 Accessibility (Chapter)
- High contrast: white-on-gradient for instructions, dark-on-white for body.
- Line height 2.2+ for body text (children need spacing).
- Exit and back always reachable.
- No motion that cannot be disabled; confetti is brief and non-essential.

---

# DOCUMENT 5 — BACKEND SCHEMA DOCUMENT

## 5.1 Purpose

This document defines the JSON schemas for the pipeline's intermediate representations. There is no database in the MVP — these are JSON files on disk. The schemas are the contract between pipeline stages and the input to the HTML assembler.

## 5.2 File: `raw_extract.json` (Output of PDF Ingestion)

```json
{
  "source_file": "fractions.pdf",
  "page_count": 14,
  "pages": [
    {
      "page_num": 1,
      "text": "Full page text in reading order...",
      "blocks": [
        {"x0": 72, "y0": 100, "x1": 300, "y1": 120, "text": "Fractions", "type": "heading"}
      ],
      "images": [
        {"ref": "img_p1_0", "width": 400, "height": 300, "b64": "..."}
      ]
    }
  ],
  "headings": [
    {"text": "Fractions", "page": 1, "level": 1},
    {"text": "What is a Fraction?", "page": 2, "level": 2}
  ],
  "exercises": [
    {"page": 5, "heading": "Exercise 2.1", "questions": ["Q1. ...", "Q2. ..."]}
  ],
  "figures": [
    {"page": 3, "caption": "A pizza cut into 4 equal parts", "image_ref": "img_p3_0"}
  ]
}
```

## 5.3 File: `content_map.json` (Output of Content Analysis)

```json
{
  "chapter_title": "Fractions",
  "subject": "math",
  "grade": 4,
  "concepts": [
    {
      "name": "What is a Fraction",
      "summary": "A fraction represents equal parts of a whole.",
      "key_ideas": ["numerator", "denominator", "whole", "equal parts"],
      "difficulty": "easy"
    }
  ],
  "worked_examples": [
    {
      "problem": "Find 3/4 of 20",
      "approach": "Divide 20 by 4, then multiply by 3",
      "concept": "Fraction of a number"
    }
  ],
  "quiz_opportunities": [
    {"concept": "Equivalent fractions", "context": "After the equivalent fractions text step"}
  ],
  "visual_opportunities": [
    {"concept": "Parts of a whole", "suggested_model": "pizza"},
    {"concept": "Equivalent fractions", "suggested_model": "bar"}
  ],
  "vocabulary": ["fraction", "numerator", "denominator", "equivalent", "whole", "part"]
}
```

## 5.4 File: `chapter_spec.json` (The Central Intermediate)

This is the most important schema — it is what the HTML assembler consumes and what a human can edit. It must conform to the v5 engine's data model.

### 5.4.1 Top-Level Structure

```json
{
  "chapter": {
    "title": "Fractions",
    "subject": "math",
    "grade": 4,
    "storage_key": "aasha_frac_v5",
    "emoji": "🍕",
    "hero_image": "data:image/svg+xml;base64,..."
  },
  "WE": {
    "we_fracOfNum": { "..." : "see 5.4.3" }
  },
  "NODES": [ { "..." : "see 5.4.2" } ]
}
```

### 5.4.2 Node Object Schema

```json
{
  "title": "What is a Fraction?",
  "emoji": "🍕",
  "steps": [
    { "t": "intro", "hero": "data:image/svg+xml;base64,..." },
    { "t": "text", "title": "What is a Fraction?", "body": "A fraction shows parts of a whole..." },
    { "t": "ix_pizza", "instruction": "Tap slices to shade parts of the pizza", "slices": 4 },
    { "t": "worked", "we": "WE.we_fracOfNum" },
    { "t": "quiz", "q": { "..." : "see 5.4.4" } },
    { "t": "progress", "xp": 30, "next": true }
  ]
}
```

**Node fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | yes | Node title shown to learner |
| emoji | string | no | Emoji shown in map/progress |
| steps | array | yes | Ordered step objects (≥1) |

**Final node** must end with `{ "t": "progress", "xp": <int> }` WITHOUT `next: true`.

### 5.4.3 Worked Example (WE) Definition Schema

```json
"we_fracOfNum": {
  "title": "Solved: Find 3/4 of 20",
  "question": "Find 3/4 of 20.",
  "steps": [
    {
      "text": "3/4 of 20 means divide 20 into 4 equal parts, then take 3 parts.",
      "c": "blue"
    },
    {
      "text": "Step 1: Divide 20 by denominator (4): 20 ÷ 4 = 5. Each part is 5.",
      "c": "blue",
      "check": {
        "q": "After dividing 20 by 4, what does the answer (5) represent?",
        "opts": [
          { "t": "One part (one quarter of 20)", "c": true, "m": "" },
          { "t": "The final answer", "c": false, "m": "5 is just one part. We need 3 parts." },
          { "t": "The number of parts", "c": false, "m": "Number of parts is 4. 5 is the size of each part." }
        ]
      }
    },
    {
      "text": "Step 2: Multiply by numerator (3): 5 × 3 = 15.",
      "c": "blue"
    },
    {
      "text": "Answer: 3/4 of 20 = 15",
      "c": "green",
      "final": true
    }
  ],
  "check": {
    "q": "What does finding 3/4 of 20 mean?",
    "opts": [
      { "t": "Divide 20 into 4 equal parts, take 3", "c": true, "m": "" },
      { "t": "Multiply 3, 4, and 20 together", "c": false, "m": "That gives a huge number. Divide first." },
      { "t": "Add 3/4 to 20", "c": false, "m": "Adding does not find a fraction of something." }
    ]
  }
}
```

**WE step fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| text | string | yes | Step explanation |
| c | string | yes | Card color: `"blue"` (working) or `"green"` (answer) |
| final | boolean | no | True only on the answer step |
| check | object | no | Inline check on this step (see option schema 5.4.4) |

**WE-level `check`** (end-of-WE): same option schema. Required on every WE.

### 5.4.4 Option Schema (Quiz, VQ, Solve MCQ, WE Checks)

```json
{
  "t": "Option text shown to learner",
  "c": true,
  "m": "Misconception explanation for wrong answers (empty string when correct)"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| t | string | yes | Option text |
| c | boolean | yes | Exactly one option per question must be `true` |
| m | string | yes | For wrong options: non-empty, verbal, specific. For correct: empty string. Must NOT contain the correct answer text. |

### 5.4.5 Step Type Schemas (Complete Reference)

**text**
```json
{ "t": "text", "title": "What is a Fraction?", "body": "A fraction shows parts of a whole...", "ctx": "optional canvas visual" }
```

**quiz**
```json
{ "t": "quiz", "q": { "q": "Which is equivalent to 1/3?", "opts": [ {option schema}, ... ] } }
```

**VQ (visual question)**
```json
{ "t": "vq", "q": { "q": "How many parts are shaded?", "visual": "bar", "parts": 4, "shaded": 2, "opts": [ {option schema}, ... ] } }
```

**worked example**
```json
{ "t": "worked", "we": "WE.we_fracOfNum" }
```

**solve**
```json
{ "t": "solve", "sl": {
  "q": "Solve: 2/5 + 1/5",
  "steps": [
    { "type": "mcq", "q": "What do you add first?", "opts": [ {option schema}, ... ] },
    { "type": "input", "q": "What is 2/5 + 1/5?", "answer": "3/5" }
  ]
}}
```

**dd_build**
```json
{ "t": "dd_build", "instruction": "Tap pieces to build 3/4", "target_num": 3, "target_den": 4 }
```

**dd_match**
```json
{ "t": "dd_match", "instruction": "Tap fractions that are EQUAL to each other",
  "pairs": [
    { "a": "1/2", "b": "2/4" },
    { "a": "1/3", "b": "2/6" },
    { "a": "2/3", "b": "6/9" },
    { "a": "3/4", "b": "6/8" },
    { "a": "1/4", "b": "3/12" }
  ]
}
```
`a` = left side (simpler form); `b` = right side (equivalent, displayed). 4–5 pairs.

**interactive visual** (one of)
```json
{ "t": "ix_pizza", "instruction": "Tap slices to shade", "slices": 4 }
{ "t": "ix_bar", "instruction": "Tap parts to shade", "parts": 5 }
{ "t": "ix_area", "instruction": "Tap squares to shade", "rows": 3, "cols": 4 }
{ "t": "ix_slider", "instruction": "Slide to see equivalent fractions", "base_num": 1, "base_den": 2 }
```

**ix_slider**
```json
{ "t": "ix_slider", "instruction": "Slide to multiply", "base_num": 1, "base_den": 2 }
```

**video demo**
```json
{ "t": "video", "instruction": "Watch how to find 1/2 of 8", "animation": "divide_and_take" }
```

**progress**
```json
{ "t": "progress", "xp": 30, "next": true }
{ "t": "progress", "xp": 50 }
```
`next: true` = not final (more nodes follow). Absent `next` = final node (shows restart).

**PhET sim** (not generated in MVP; schema reserved)
```json
{ "t": "phet", "instruction": "Explore the simulation", "srcdoc_b64": "..." }
```

### 5.4.6 Validation Rules (Enforced by the Spec Validator)

1. `NODES` is a non-empty array with 3–5 elements.
2. Every node has `title` (string) and `steps` (non-empty array).
3. Every step has a `t` field matching one of the 12 supported types.
4. The last node's final step is `{ "t": "progress", "xp": <int> }` with NO `next: true`.
5. Every `quiz`, `vq`, solve-MCQ, and WE `check`/inline `check` has an `opts` array of 3–4 options.
6. Every option set has EXACTLY one `c: true`.
7. Every wrong option (`c: false`) has a non-empty `m` that does not contain the correct option's `t` text (case-insensitive substring check).
8. Every `worked` step references a WE key that exists in the `WE` object.
9. Every WE has 3–4 steps, at least one with `check` (inline), and a WE-level `check`.
10. Every `dd_match` has 4–5 pairs.
11. Every step with `t: "dd_build"` or `t: "dd_match"` conceptually needs a skip button — this is enforced at the engine level, not the spec, but the validator warns if an interactive step appears without clear instructions.
12. `storage_key` matches `^aasha_[a-z0-9]+_v5$`.

## 5.5 File: `lle.json` (Output of LLE Generation)

```json
{
  "CONN": {
    "because": "क्योंकि (बिकॉज़)",
    "therefore": "इसलिए (देयरफ़ोर)",
    "if": "अगर (इफ़)",
    "...": "46 total entries"
  },
  "WM": {
    "fraction": "भिन्न (फ्रैक्शन)",
    "numerator": "अंश (न्यूमरेटर)",
    "denominator": "हर (डेनॉमिनेटर)",
    "equivalent": "समतुल्य (इक्विवलेंट)",
    "...": "296+ existing + chapter-specific new entries"
  }
}
```

**Entry format**: `"word": "हिंदी_अर्थ (अंग्रेज़ी_उच्चारण_देवनागरी_में)"`

**Rules:**
- CONN contains exactly the 46 connecting words (fixed set, from the v5 baseline).
- WM contains the 296+ baseline words plus any chapter-specific words generated by the pipeline.
- Every entry has both Hindi meaning AND phonics in Devanagari, in the exact format.
- Words without a generated translation are omitted from the dictionary; the engine shows the fallback string at runtime.

## 5.6 File: `job.json` (Job Tracking)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "created_at": "2026-09-01T10:00:00Z",
  "updated_at": "2026-09-01T10:04:12Z",
  "input": {
    "source_pdf": "fractions.pdf",
    "subject": "math",
    "grade": 4,
    "provider": "openai",
    "model": "gpt-4o-mini"
  },
  "stages": [
    { "name": "ingest", "status": "done", "duration_s": 3, "output": "raw_extract.json" },
    { "name": "analyze", "status": "done", "duration_s": 18, "output": "content_map.json" },
    { "name": "design", "status": "done", "duration_s": 22, "output": "chapter_spec.json" },
    { "name": "assess", "status": "done", "duration_s": 35, "output": "chapter_spec.json" },
    { "name": "lle", "status": "done", "duration_s": 14, "output": "lle.json" },
    { "name": "assemble", "status": "done", "duration_s": 2, "output": "chapter.html" },
    { "name": "qa", "status": "done", "duration_s": 8, "output": "qa_report.json" }
  ],
  "cost_usd": 0.31,
  "qa": { "passed": true, "checks_total": 217, "checks_passed": 217, "failures": [] },
  "outputs": {
    "html": "output/fractions_chapter.html",
    "spec": "output/fractions_chapter_spec.json"
  }
}
```

## 5.7 File: `qa_report.json`

```json
{
  "passed": true,
  "checks_total": 217,
  "checks_passed": 217,
  "failures": [],
  "categories": {
    "syntax": { "passed": 1, "failed": 0 },
    "render_all_steps": { "passed": 23, "failed": 0 },
    "flow_quiz": { "passed": 8, "failed": 0 },
    "flow_vq": { "passed": 3, "failed": 0 },
    "flow_we": { "passed": 4, "failed": 0 },
    "flow_dd_build": { "passed": 2, "failed": 0 },
    "flow_dd_match": { "passed": 2, "failed": 0 },
    "flow_solve": { "passed": 3, "failed": 0 },
    "navigation": { "passed": 15, "failed": 0 },
    "critical_rules": { "passed": 10, "failed": 0 },
    "dead_code": { "passed": 1, "failed": 0 }
  }
}
```

## 5.8 Placeholder Injection Contract

The v5 HTML template contains exactly four placeholders. The assembler replaces them with serialized JS:

| Placeholder | Replaced With | Serialization |
|------------|---------------|----------------|
| `{{CONTENT}}` | `var NODES = [...];` | `json.dumps(NODES, ensure_ascii=False)` prefixed with `var NODES = ` and suffixed with `;` |
| `{{WE}}` | `var WE = {...};` | `json.dumps(WE, ensure_ascii=False)` prefixed/suffixed |
| `{{WM}}` | `var WM = {...};` | `json.dumps(WM, ensure_ascii=False)` |
| `{{CONN}}` | `var CONN = {...};` | `json.dumps(CONN, ensure_ascii=False)` |

`ensure_ascii=False` is mandatory so Devanagari script is written as native characters, not `\uXXXX` escapes (keeps file size down and aids human review).

---

# DOCUMENT 6 — IMPLEMENTATION PLAN

## 6.1 Approach

The build is sequenced so that each milestone produces a demonstrable artifact. The riskiest work (LLM prompt engineering for the v5 content schema) is front-loaded, and the v5 engine and QA harness — already proven — are integrated early as the acceptance gate. The web UI and CLI are built last because they are thin shells over the pipeline core.

Total estimated effort: 4 weeks for a single engineer, assuming the v5 engine template and QA harness are available as-is from the baseline.

## 6.2 Milestones

### Milestone 1 — Foundation & Contracts (Week 1, Days 1–2)
**Goal**: Stand up the project skeleton, define schemas, wire the v5 template and QA harness as acceptance gates.

Tasks:
- Initialize Python project (pyproject.toml, src/ layout).
- Copy the v5 HTML template string (with `{{CONTENT}}`, `{{WE}}`, `{{WM}}`, `{{CONN}}` placeholders) into `src/aasha/engine/template.py`.
- Copy the existing Node.js QA harness into `qa/run_qa.js` and verify it runs against an existing hand-built chapter (Fractions) and passes.
- Write the JSON schemas (Document 5) as Python dataclasses or Pydantic models in `src/aasha/schemas/`.
- Write a spec validator that loads a chapter_spec.json and runs the 12 validation rules.
- Write a manual end-to-end smoke test: take the existing Fractions chapter_spec.json (hand-authored from the baseline), inject it into the template, run QA → must pass 217/217. This proves the assembly + QA path works before any LLM is involved.

**Deliverable**: A working "assembly + QA" path that takes a hand-written spec and produces a passing HTML chapter. Zero LLM dependency.

**Exit criteria**: `python assemble.py --spec fractions_spec.json --out fractions.html` produces a file that passes `node qa/run_qa.js fractions.html` with 0 failures.

### Milestone 2 — PDF Ingestion (Week 1, Days 3–4)
**Goal**: Convert a PDF into structured `raw_extract.json`.

Tasks:
- Install PyMuPDF (`pip install pymupdf`).
- Write `src/aasha/ingest/pdf_reader.py`: open PDF, extract per-page text in reading order, detect blocks, extract images (downsample to ≤800px, base64-encode).
- Implement heading detection (font-size heuristic), exercise detection (numbered-list heuristic), figure caption detection.
- Handle multi-column layout (sort blocks by column then vertical position).
- Write `--from-stage` support so ingestion can be skipped if `raw_extract.json` exists.
- Test against 3 sample textbook PDFs (math, science, EVS) and inspect output.

**Deliverable**: `raw_extract.json` for any input PDF.

**Exit criteria**: 3 sample PDFs produce readable, ordered extracts with correct heading/exercise detection on ≥80% of pages.

### Milestone 3 — LLM Adapter Layer (Week 1, Day 5)
**Goal**: A working, cached, retrying multi-provider LLM client.

Tasks:
- Write `src/aasha/llm/adapter.py` with `complete()` and `batch_complete()`.
- Implement OpenAI provider (GPT-4o-mini, structured outputs / JSON mode).
- Implement Gemini provider (free-tier, response_schema).
- Implement the file cache (SHA-256 key, JSON store in `./.llm_cache/`).
- Implement retry with exponential backoff + jitter (3 attempts).
- Implement `LLMGenerationError` and malformed-JSON repair retry.
- Config loading from `config.yaml`; API keys from environment.

**Deliverable**: A `complete(system, user, schema)` call that returns validated JSON from either provider.

**Exit criteria**: A test call to generate a 3-concept content map from a sample raw_extract runs, caches, and on a second call returns cached output instantly at $0 cost.

### Milestone 4 — Content Analysis + Learning Design (Week 2, Days 1–2)
**Goal**: `raw_extract.json` → `content_map.json` → `chapter_spec.json` (structure, no assessments yet).

Tasks:
- Write the content-analysis system prompt (pedagogue role, Indian curriculum context, output schema).
- Write the learning-design system prompt (maps concepts to NODES/steps, assigns step types, produces WE skeleton references).
- Implement stage 2 (analyze) and stage 3 (design) in the orchestrator.
- Run the spec validator on the output. Iterate on prompts until a sample chapter produces a structurally valid spec (passes all 12 validation rules except those requiring assessments).
- Temperature 0 for determinism.

**Deliverable**: A `chapter_spec.json` with valid NODES/WE structure for a sample PDF.

**Exit criteria**: 2 sample PDFs produce specs that pass structural validation. Nodes = 3–5, steps sequenced per the proven flow, WE keys referenced correctly.

### Milestone 5 — Assessment Generation + Misconceptions (Week 2, Days 3–4)
**Goal**: Fill in all assessments (quizzes, VQs, solves, WE checks) with options, correct flags, and misconceptions.

Tasks:
- Write the assessment-generation prompt (batched per node). It receives the step context + concept and returns the option set.
- Enforce post-generation: exactly one `c:true`, every wrong option has non-empty `m`, no answer leakage (substring check against correct `t`).
- Implement WE check specificity check (keyword overlap between check question and step text; flag if zero).
- Implement misconception-leak repair (regenerate an `m` if it contains the correct answer text).
- Run full QA on a generated chapter for the first time.

**Deliverable**: A complete `chapter_spec.json` that, when assembled and QA-tested, passes the structural and flow checks.

**Exit criteria**: 2 sample chapters pass QA at ≥60% of checks on first generation. Remaining failures are content-quality (fixable via spec edit), not structural.

### Milestone 6 — LLE Generation (Week 2, Day 5)
**Goal**: Generate `lle.json` for all body text words.

Tasks:
- Extract distinct words from all `body`, `text`, `q`, `instruction` fields in the spec.
- Load the static baseline WM (296+) and CONN (46) dictionaries.
- Partition words: already-present (reuse) vs net-new (LLM-generate).
- Batch net-new words into LLM calls (format: `हिंदी (उच्चारण)`).
- Merge into `lle.json`.
- Verify injection at `{{WM}}` and `{{CONN}}` produces valid, Devanagari-correct output.

**Deliverable**: Complete `lle.json`; assembled HTML has tappable LLE on every word.

**Exit criteria**: A generated chapter passes the LLE-related QA checks (no missing-word crashes, all words tappable, CONN words shown inline blue).

### Milestone 7 — End-to-End Pipeline + QA Pass (Week 3, Days 1–2)
**Goal**: The full 9-stage pipeline runs end-to-end and produces QA-passing chapters.

Tasks:
- Wire the orchestrator: job init → ingest → analyze → design → assess → lle → assemble → qa → output.
- Implement `job.json` state tracking and stage-by-stage status updates.
- Implement `--from-stage` resume.
- Run the pipeline against 5 sample PDFs. Triage failures: prompt fixes, validation fixes, edge cases.
- Hit the target: ≥60% first-generation QA pass rate.

**Deliverable**: `python build_chapter.py --pdf sample.pdf --subject math --grade 4` produces a passing HTML chapter.

**Exit criteria**: 3 of 5 sample chapters pass full QA on first run. The 2 that fail have identifiable, fixable causes documented.

### Milestone 8 — CLI (Week 3, Days 3–4)
**Goal**: A complete CLI with single-file and batch modes.

Tasks:
- Write `build_chapter.py` with argparse: `--pdf`, `--batch`, `--subject`, `--grade`, `--provider`, `--model`, `--from-stage`, `--output-dir`.
- Implement batch mode: iterate a directory, run the pipeline per file, collect results, print a summary table (built/failed, cost, time).
- Implement the per-chapter summary print (stage-by-stage log lines as shown in Document 3).
- Error handling: one failed chapter does not stop the batch; failures are collected and reported.

**Deliverable**: A working CLI usable for batch production.

**Exit criteria**: Batch run of 10 PDFs completes with a summary report; failed chapters are identifiable and re-runnable.

### Milestone 9 — Web UI (Week 3, Day 5 – Week 4, Days 1–3)
**Goal**: A Flask web UI with upload, live progress, preview, and JSON editing.

Tasks:
- Flask app with routes: `/` (upload), `/jobs` (list), `/job/<id>` (detail + live progress), `/job/<id>/edit` (JSON editor), `/job/<id>/rerun` (resume from stage).
- Upload form (Document 4 spec).
- Job detail view with progress timeline + live log panel (poll `job.json` every 2s).
- Result view with iframe preview (rendered at 480px) + metadata + download buttons.
- JSON editor view: textarea with the spec, "Re-run Assembly + QA" button (calls stages 7–8 only).
- Jobs list view (scan `./jobs/` directory).
- Bind to localhost only.

**Deliverable**: A usable operator web UI.

**Exit criteria**: An operator can upload a PDF, watch progress, preview the result, edit the JSON spec, re-run QA, and download the HTML — all through the browser.

### Milestone 10 — Hardening & Documentation (Week 4, Days 4–5)
**Goal**: Production-ready MVP.

Tasks:
- Run the full pipeline against 15–20 sample PDFs across subjects (math, science, EVS, English).
- Triage and fix recurring failure patterns (prompt adjustments, validator tightening).
- Achieve ≥60% first-generation pass rate and ≥90% pass-after-one-edit rate.
- Verify cost: average < $0.50/chapter across the sample set.
- Write a README (install, config, CLI usage, web UI usage).
- Write an operator guide: how to read a QA failure report, common spec edits, how to resume.
- Final review of the 10 critical rules enforcement on 5 random generated chapters.

**Deliverable**: MVP release.

**Exit criteria**: 15 sample chapters generated; ≥9 pass QA on first run; all 15 pass after at most one spec-edit cycle; average cost < $0.50/chapter; README and operator guide complete.

## 6.3 Risk Register and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| LLM produces structurally invalid JSON | High | High | Schema-validated structured-output mode; repair-retry; fail-fast with clear error |
| WE checks come out generic ("Did you understand?") | High | Medium | Specificity heuristic (keyword overlap); human review flag; prompt examples of good vs bad checks |
| Misconceptions leak the correct answer | Medium | High | Substring scan post-generation; auto-regenerate; manual review |
| LLE phonics inaccurate (wrong Devanagari) | Medium | Medium | Reuse baseline dictionary for common words; only generate for net-new; spot-check in QA |
| Cost exceeds $0.50/chapter | Medium | Medium | Batch independent calls; cache aggressively; fall back to Gemini free tier; monitor per-chapter cost in job.json |
| Scanned (non-text) PDFs | Medium | Low | Detect and reject with a clear message; OCR is post-MVP |
| QA harness regressions on Node version | Low | High | Pin Node version in README; run QA in a fixed environment |
| Multi-column PDFs misread | Medium | Low | PyMuPDF block sorting heuristic; operator can edit raw_extract.json |
| Generated chapter > 200 KB (fails jsdom full-flow test) | Low | Medium | Image downsampling; SVG over raster; warn if threshold exceeded |

## 6.4 Dependency Map

```
M1 (Foundation) ──┬──▶ M2 (Ingest) ──▶ M4 (Analysis+Design) ──▶ M5 (Assessments) ──▶ M7 (E2E) ──▶ M8 (CLI) ──▶ M10 (Hardening)
                   │                                                          ▲
                   └──▶ M3 (LLM Adapter) ──────────────────────────────────────┘
                                                                              │
                                              M6 (LLE) ────────────────────────┘
                                                                              │
                                              M9 (Web UI) depends on M7 ──────┘
```

M1 is the prerequisite for all. M3 (LLM adapter) and M2 (ingest) proceed in parallel. M4 depends on M2 and M3. M5 depends on M4. M6 depends on M4. M7 depends on M5 and M6. M8 and M9 depend on M7. M10 is final.

## 6.5 Definition of Done (MVP Release)

The MVP is released when ALL of the following are true:
1. The pipeline (CLI) processes a single PDF into a QA-passing HTML chapter.
2. The CLI batch mode processes a directory of PDFs with a summary report.
3. The web UI allows upload, live progress, preview, JSON edit, re-run, and download.
4. ≥60% of 15 sample chapters pass QA on first generation.
5. ≥90% pass after one spec-edit cycle.
6. Average LLM cost per chapter < $0.50.
7. Every generated chapter conforms to the 10 critical rules (verified by QA).
8. README and operator guide are written.
9. No chapter is delivered that fails the QA suite.

---

# END OF DOCUMENT SET
