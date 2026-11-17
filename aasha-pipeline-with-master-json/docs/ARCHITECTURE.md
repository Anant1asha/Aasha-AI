# Architecture — Multi-Agent Pipeline

## Overview

The Aasha Pipeline is a multi-agent AI system that converts NCERT textbook
PDFs into self-contained, gamified HTML learning chapters. It uses **six
specialized AI agents**, each responsible for one stage of the transformation,
coordinated by a central orchestrator.

## System Architecture

```
                    ┌─────────────────────────────────────────────────────┐
  CLI / Web UI ────▶│              ORCHESTRATOR                            │
                    │  job lifecycle · state tracking · cost estimate     │
                    └──────┬──────┬──────┬──────┬──────┬──────┬──────────┘
                           │      │      │      │      │      │
                    ┌──────▼┐ ┌──▼──┐ ┌─▼──┐ ┌▼────┐ ┌▼──┐ ┌─▼──┐
                    │Ingest │ │Anlyz│ │Dsgn│ │Asess│ │LLE│ │ QA │
                    │Agent  │ │Agent│ │Agt │ │Agent│ │Agt│ │Agt │
                    └───────┘ └─────┘ └────┘ └─────┘ └────┘ └────┘
                         │       │       │       │       │       │
                    raw_extract  content  chapter  spec+   lle   qa_report
                     .json      _map     _spec   assess  .json   .json
```

## The Six Agents

### 1. IngestAgent (Stage 1: Ingest)
- **Input**: PDF file
- **Output**: `raw_extract.json`
- **Technology**: PyMuPDF (fitz)
- **LLM**: No
- **Responsibility**: Extract text in reading order, detect headings, exercises,
  figure captions, and images. Handle multi-column layouts. Downsample images
  to ≤800px width and base64-encode them.

### 2. AnalysisAgent (Stage 2: Analyze)
- **Input**: `raw_extract.json`
- **Output**: `content_map.json`
- **Technology**: LLM (GPT-4o-mini default)
- **Responsibility**: Identify 3-5 core concepts, candidate worked examples,
  quiz opportunities, interactive visual opportunities, and key vocabulary.
  Calibrate language difficulty for the target grade.

### 3. DesignAgent (Stage 3: Design)
- **Input**: `content_map.json`
- **Output**: `chapter_spec.json` (structure only)
- **Technology**: LLM
- **Responsibility**: Map concepts to the v5 NODES/steps structure. Create 3-5
  nodes, sequence steps per the proven flow (Intro → Text → Interactive Visual →
  Worked Example → Quiz → Progress), assign step types, and produce WE definitions.
  Post-processes to fix storage_key, add hero SVGs, and ensure the final node's
  last step has no `next: true`.

### 4. AssessmentAgent (Stage 4: Assess)
- **Input**: `chapter_spec.json` + `content_map.json`
- **Output**: updated `chapter_spec.json` (assessments filled in)
- **Technology**: LLM (batched)
- **Responsibility**: Generate question text, 3-4 options, exactly one correct
  option (`c:true`), and a misconception explanation (`m`) for every wrong option.
  Enforces: no answer leakage (substring scan), WE checks are specific to their
  step's concept.

### 5. LLEAgent (Stage 5: LLE)
- **Input**: `chapter_spec.json`
- **Output**: `lle.json`
- **Technology**: LLM (temperature 0.2 for natural phrasing)
- **Responsibility**: Extract all distinct words from body text, reuse baseline
  296 WM + 46 CONN dictionary entries, generate Hindi translations + phonics
  for net-new words only. Falls back to "इस शब्द का हिंदी अर्थ अभी उपलब्ध नहीं है"
  for words that fail generation.

### 6. QAAgent (Stage 8: QA)
- **Input**: `chapter.html`
- **Output**: `qa_report.json`
- **Technology**: Node.js + jsdom (Python fallback)
- **Responsibility**: Run the 200+ check QA suite — syntax check, render-every-step,
  flow simulation per step type, 10 critical rules, dead-code scan. If Node.js
  is unavailable, runs a Python-based structural QA with ~13 checks.

## The Two Deterministic Stages

### Stage 7: HTML Assembly
- **Input**: `chapter_spec.json` + `lle.json` + v5 template
- **Output**: `chapter.html`
- **No LLM** — pure placeholder injection
- Serializes NODES, WE, SOLVE, WM, CONN, LEVELS, BADGES to JSON with
  `ensure_ascii=False` (preserves Devanagari) and string-replaces the 8
  placeholders in the template.

### Stage 9: Output
- Copies `chapter.html` and `chapter_spec.json` to the output directory.

## Data Flow

```
source.pdf
  → raw_extract.json        (IngestAgent)
  → content_map.json        (AnalysisAgent)
  → chapter_spec.json       (DesignAgent + AssessmentAgent)
  → lle.json                (LLEAgent)
  → chapter.html            (HTMLAssembler)
  → qa_report.json          (QAAgent)
  → output/                 (copy to output dir)
```

Every intermediate is a real file on disk. A human can inspect or edit any
stage and resume from that point (`--from-stage`). This makes iterative fixes
free (no LLM cost) after the first full run.

## The v5 Engine Contract

The generated HTML must conform to the v5 specification:
- Single file, zero dependencies, offline
- Mobile-first (480px max-width, touch-optimized)
- Bilingual (English + Hindi LLE)
- Gamified (XP, badges, streaks, confetti)
- 13 step types
- 10 critical rules enforced by QA

See `ENGINE_REFERENCE.md` and `CHAPTER_SPEC_SCHEMA.md` for details.

## The LLM Adapter Layer

A thin abstraction supporting multiple providers:
- OpenAI (GPT-4o-mini default)
- Google Gemini (free-tier fallback)
- Anthropic Claude (optional)

Features:
- `complete(system, user, schema)` → parsed JSON
- `batch_complete(items)` → list of parsed JSONs
- File cache keyed by SHA-256(system + user + model) — re-runs are free
- Retry with exponential backoff + jitter (tenacity)
- Malformed JSON repair retry
- Temperature control (0 for structural, 0.2 for LLE)
- Cost estimation per call

## Job Lifecycle

```
queued → ingesting → ingested → analyzing → analyzed → designing → designed →
assessing → assessed → lle → lle_done → assembling → assembled →
qa_running → qa_passed → completed
                         ↘ qa_failed
any stage → failed (on unrecoverable error)
qa_failed/failed → (operator edits spec) → assembling (resume)
```

State is tracked in `job.json` in both the work directory and the jobs directory.
