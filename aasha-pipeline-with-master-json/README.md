# Aasha Pipeline — Multi-Agent AI Chapter Builder

An agentic AI system that converts NCERT textbook PDFs into self-contained,
gamified HTML learning chapters for students in Indian government schools
(Grades 3–8). Built on the proven v5 gamified-HTML engine.

## What It Does

```
Textbook PDF → [9-stage multi-agent pipeline] → Single offline gamified HTML chapter
```

The pipeline uses **six specialized AI agents**, each responsible for one
stage of the transformation:

| Agent | Stage | Responsibility |
|-------|-------|----------------|
| **IngestAgent** | 1 | Extracts text, images, layout from PDF (PyMuPDF) |
| **AnalysisAgent** | 2 | Identifies concepts, examples, quiz opportunities via LLM |
| **DesignAgent** | 3 | Structures content into v5 NODES/steps with WE definitions |
| **AssessmentAgent** | 4 | Generates quiz/VQ/solve/WE-check questions with misconceptions |
| **LLEAgent** | 5 | Generates Hindi translations + phonics for English vocabulary |
| **QAAgent** | 8 | Runs the 200+ check QA suite (Node.js + jsdom) |

Stages 7 (HTML Assembly) and 9 (Output) are deterministic — no LLM involved.

## Quick Start

```bash
# 1. Install dependencies
pip install -e ".[dev]"
npm install jsdom  # for the QA harness

# 2. Configure
cp .env.example .env
# Edit .env — add your OPENAI_API_KEY

# 3. Build a chapter (CLI)
python -m aasha.cli --pdf path/to/chapter.pdf --subject math --grade 4

# 4. Or use the web UI
python -m aasha.cli --web
# Open http://127.0.0.1:5000
```

## Batch Processing

```bash
python -m aasha.cli --batch ./chapters/ --subject math --grade 4
```

## Resume from Stage

If a chapter fails QA, edit the `chapter_spec.json` and resume without
re-running LLM calls (costs $0):

```bash
python -m aasha.cli --pdf chapter.pdf --from-stage assemble
```

## Architecture

```
                    ┌─────────────────────────────────────────────────┐
  CLI / Web UI ────▶│              ORCHESTRATOR                        │
                    │  job lifecycle · state tracking · cost estimate  │
                    └──────┬──────┬──────┬──────┬──────┬──────┬───────┘
                           │      │      │      │      │      │
                    ┌──────▼┐ ┌──▼──┐ ┌─▼──┐ ┌▼────┐ ┌▼──┐ ┌─▼──┐
                    │Ingest │ │Anlyz│ │Dsgn│ │Asess│ │LLE│ │ QA │
                    │Agent  │ │Agent│ │Agt │ │Agent│ │Agt│ │Agt │
                    └───────┘ └─────┘ └────┘ └─────┘ └────┘ └────┘
                         │       │       │       │       │       │
                    raw_extract  content  chapter  spec+   lle   qa_report
                     .json      _map     _spec   assess  .json   .json
```

Each agent:
- Receives input from the previous agent's output (or a human-edited file)
- Calls the LLM via the adapter layer (with caching + retry)
- Post-processes its output with validation rules
- Writes a real JSON file to disk (so any stage can be inspected/edited)

## The v5 Engine Contract

The generated HTML conforms to the v5 specification:
- **Single file**, zero dependencies, works offline
- **Mobile-first** (480px max-width, touch-optimized)
- **Bilingual** (English content with Hindi tap-to-reveal translations)
- **Gamified** (XP, badges, streaks, confetti — no coins/shop)
- **13 step types** (intro, text, quiz, VQ, worked, solve, dd_build, dd_match, ix_pizza, ix_bar, ix_area, ix_slider, video, progress, phet)

## The 10 Critical Rules (Enforced by QA)

1. Wrong answers never reveal the correct answer
2. All options are shuffled at render time
3. No drag-and-drop (tap-to-select only)
4. No confirm()/alert()
5. Skip button on all interactive steps
6. Button never disabled when it's the only way forward
7. `_weCheckRendered` flag present and used
8. localStorage is bounds-checked
9. exit() is instant reset, no dialog
10. No dead code

## Key Files

| Path | Purpose |
|------|---------|
| `template/v5-engine-template.html` | Frozen v5 engine (8 placeholders) — never edit |
| `schema/chapter_spec.schema.json` | JSON Schema for chapter specs |
| `config/defaults.json` | Baseline dictionaries (296 WM + 46 CONN words), LEVELS, BADGES |
| `src/aasha/agents/` | The 6 AI agents |
| `src/aasha/llm/adapter.py` | Multi-provider LLM adapter with caching + retry |
| `src/aasha/pipeline/orchestrator.py` | Job lifecycle + stage sequencing |
| `src/aasha/assemble/html_assembler.py` | Placeholder injection into the v5 template |
| `qa/run_qa.js` | Node.js QA harness (200+ checks) |
| `src/aasha/cli.py` | CLI entry point |
| `src/aasha/web/app.py` | Flask web UI |

## License

MIT (see [LICENSE](LICENSE)). The v5 engine template is a proprietary asset
of the Aasha Foundation.
