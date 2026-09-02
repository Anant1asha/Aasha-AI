# MASTER BUILD PROMPT — Aasha Multi-Agent Curriculum Transformation Engine

> Paste this entire document into Claude (or any frontier LLM with code execution) to continue building the Aasha pipeline to production-grade multi-agent AI tool.

---

## YOU ARE

You are the Lead Full-Stack Engineer and AI Architect for the **Aasha Foundation** — an EdTech nonprofit serving Indian government-school students (Grades K-10, all boards, all subjects). You are continuing development of an existing, working codebase. Your job is to take it from "functional prototype with 62 passing tests" to "production-grade multi-agent AI tool."

## WHAT EXISTS (DO NOT BREAK)

The repo at `aasha-pipeline/` already contains a working system with 62 passing tests. Here is exactly what exists — you must preserve all of this:

### V1 Foundation (6-agent v5 engine pipeline)
- **6 agents**: `IngestAgent` (PyMuPDF PDF extraction), `AnalysisAgent` (LLM concept identification), `DesignAgent` (LLM NODES/steps structuring), `AssessmentAgent` (LLM quiz/VQ/WE-check generation with misconception enforcement), `LLEAgent` (LLM Hindi translation + phonics generation), `QAAgent` (Node.js + jsdom 200+ check QA suite with Python fallback)
- **LLM adapter** (`src/aasha/llm/adapter.py`): multi-provider (OpenAI/Gemini/Anthropic), SHA-256 file cache, exponential backoff retry (tenacity), malformed-JSON repair, cost estimation
- **HTML assembler** (`src/aasha/assemble/html_assembler.py`): injects content into the frozen v5 engine template at 8 placeholders (`{{CHAPTER_TITLE}}`, `{{WM_JSON}}`, `{{CONN_JSON}}`, `{{LEVELS_JSON}}`, `{{BADGES_JSON}}`, `{{WE_JSON}}`, `{{SOLVE_JSON}}`, `{{CONTENT_JSON}}`), preserves Devanagari with `ensure_ascii=False`
- **Pydantic schemas** (`src/aasha/schemas/`): `ChapterSpec`, `Option`, `OptionSet`, `WorkedExample`, `Step`, `Node`, `ChapterMeta`, `RawExtract`, `ContentMap`, `LLEFile`, `QAReport`, `Job` + 12-rule spec validator
- **Orchestrator** (`src/aasha/pipeline/orchestrator.py`): job lifecycle, stage sequencing, `--from-stage` resume, `job.json` state tracking, cost estimation
- **CLI** (`src/aasha/cli.py`): single mode, batch mode, `--from-stage`, `--web` flag
- **Flask web UI** (`src/aasha/web/`): upload, live progress polling, preview iframe, JSON spec editor, rerun, jobs list
- **QA harness** (`qa/run_qa.js`): Node.js syntax check, structural checks, critical rules, jsdom render checks (with Python fallback)
- **Frozen assets**: `template/v5-engine-template.html` (104KB, never edit), `schema/chapter_spec.schema.json`, `config/defaults.json` (296 WM + 46 CONN baseline Hindi dictionaries, LEVELS, BADGES)
- **4 example HTML chapters** in `examples/` (Fractions, Perimeter & Area, Comparing Quantities, Polynomials) — pattern references, not hardcoded

### V2 Extension (4-agent architecture + 12 plugins)
- **12 interaction plugins** (`src/aasha/plugins/`): JSXGraph (geometry/graphing, MIT, ~200KB), PhET (physics/chemistry/biology sims, GPL v3), GeoGebra (geometry/algebra/3D, non-commercial), Mermaid.js (diagrams/flowcharts/timelines, MIT, ~150KB), Fabric.js (anatomy labeling/hotspots, MIT, ~300KB), H5P (interactive content format, MIT), Virtual Lab (physics/chemistry/biology experiments, MIT), Scilab (numerical computation, CeCILL), Mafs (reactive math viz, MIT), Hot Potatoes (JQuiz/JMatch/JCloze/JCross/JMix, GNU GPL), Phonics (K-3 English cards, MIT), Timeline (social studies interactive timelines, MIT)
- **Plugin registry** (`src/aasha/plugins/base.py`): `InteractionPlugin` ABC, `InteractionRequest`, `PluginMetadata`, `PluginRegistry` with `find_best()` routing (prefers smaller embed size), `create_default_registry()` auto-registers all 12 + v5-canvas fallback
- **Subject profiles** (`src/aasha/profiles/`): classifies subjects into STEM, Humanities, Languages, Social Sciences; declares preferred plugins, interaction types, and assessment types per domain
- **Exercise extractor** (`src/aasha/exercise/`): extracts 100% of exercises from PDF (MCQ, numerical, short/long answer, fill-blank, true-false, match-column), classifies difficulty tiers (Recall → Conceptual → Application → Critical Thinking), maps to assessment levels (Warm-up → Deep Dive → Boss)
- **Frontend Code Synthesizer** (`src/aasha/synthesis/code_synthesizer.py`): Agent 4 — generates complete self-contained HTML5/CSS/JS with embedded plugin assets, collapsible concept cards, 3-level gamified assessment suite, XP/badges/streaks/quiz system

### Existing tests (all 62 must continue passing)
- `test_validator.py` (8 tests): spec validation rules
- `test_assembler.py` (5 tests): v5 template injection, Devanagari preservation
- `test_llm_adapter.py` (10 tests): caching, JSON parsing, cost estimation
- `test_agents.py` (4 tests): agent run with mocked LLM
- `test_plugins.py` (11 tests): 12-plugin registry, routing across subjects
- `test_exercise_and_profiles.py` (14 tests): exercise extraction, difficulty classification, subject profiles
- `test_synthesizer.py` (7 tests): HTML synthesis, concept cards, assessment levels, gamification, plugin assets
- `test_llm_adapter.py` (3 tests): adapter factory

## WHAT TO BUILD NEXT

Take the system to production-grade. Here are the specific tasks, in priority order:

---

### TASK 1: Wire the 4-Agent Full-Synthesis Pipeline into the Orchestrator

The orchestrator currently only runs the 6-agent v5-engine pipeline. Add a `--mode` flag to the CLI:
- `--mode v5-engine` (default): existing 6-agent flow (ingest → analyze → design → assess → lle → assemble → qa → output)
- `--mode full-synthesis`: new 4-agent flow that uses the plugin registry, exercise extractor, and code synthesizer

The full-synthesis flow:
```
Stage 1: Ingest (IngestAgent) → raw_extract.json
Stage 2: Analyze + Extract Exercises → pedagogy_map.json
  - IngestAgent extracts PDF text
  - ExerciseExtractor extracts 100% of exercises, classifies type + difficulty
  - AnalysisAgent (LLM) identifies concepts, subject domain, vocabulary
  - Output combines all into pedagogy_map.json
Stage 3: Design Interactions (Experience Designer) → experience_plan.json
  - For each concept, query PluginRegistry.find_best() with InteractionRequest
  - Assign the best plugin + interaction config to each concept
  - No LLM needed if the concept-to-plugin mapping is deterministic
  - Optional LLM call to refine interaction choices for ambiguous concepts
Stage 4: Generate Assessments (Assessment Architect) → assessment_suite.json
  - Convert all extracted exercises into gamified format (3 levels)
  - Generate additional concept-based assessments if the chapter lacks enough
  - Every wrong option gets a misconception explanation (m field)
  - XP: 5 for warmup, 10 for deep_dive, 20 for boss
Stage 5: Synthesize HTML (FrontendCodeSynthesizer) → chapter.html
  - Collect plugin embed_assets() CSS/JS from all used plugins
  - Build concept cards, assessment sections, gamification UI
  - Embed everything as base64 in a single HTML file
Stage 6: QA (QAAgent) → qa_report.json
  - Run structural + critical rules checks on the synthesized HTML
Stage 7: Output → copy to output/
```

Update `src/aasha/pipeline/orchestrator.py` to support both modes. Update `src/aasha/cli.py` with `--mode` flag. Update `src/aasha/schemas/__init__.py` with new stage names.

---

### TASK 2: Implement Actual Library Embedding for Plugins

Currently plugins provide placeholder JS renderers. Implement real base64 embedding:

1. Create `src/aasha/plugins/bundler.py` — a utility that:
   - Downloads a library's minified JS from its CDN/GitHub release
   - Base64-encodes it
   - Caches it locally in `.plugin_cache/<library_name>.b64`
   - Returns the `<script>` tag with the base64 data URI

2. For each plugin, update `embed_assets()` to use the bundler:
   - JSXGraph: download `jsxgraphcore.min.js` from GitHub releases
   - Mermaid.js: download `mermaid.min.js`
   - Fabric.js: download `fabric.min.js`
   - H5P: download the H5P standalone player JS
   - PhET: download the simulation HTML and base64-encode as iframe srcdoc
   - Mafs: download the Mafs bundle
   - GeoGebra: download the GeoGebra Math API bundle
   - Scilab: provide a lightweight JS-based numerical computation wrapper
   - Hot Potatoes: download or generate the exercise framework JS
   - Phonics: no external library needed (pure CSS/JS)
   - Timeline: no external library needed (pure CSS/JS)

3. Ensure the total embedded size stays reasonable. If a chapter uses 3+ plugins that each embed 200KB+, warn the operator. Prefer lighter plugins when multiple can handle the same concept.

4. All embeddings must work offline. No CDN links in the output HTML.

---

### TASK 3: Upgrade the LLM Agents for Multi-Subject Support

The current `AnalysisAgent` and `DesignAgent` system prompts are math-focused. Update them:

1. **AnalysisAgent** — update `SYSTEM_PROMPT` to:
   - Accept any subject (math, science, english, evs, social_studies, history, geography, civics, computer_science)
   - Accept any grade (K-10, i.e., 1-10)
   - Accept any board (NCERT, ICSE, state board, IB, Cambridge)
   - Classify the subject domain (STEM, Humanities, Languages, Social Sciences) using the profiles module
   - Extract 100% of exercises (not just identify concepts) by calling the ExerciseExtractor
   - Output `pedagogy_map.json` (not just `content_map.json`) that includes exercises with difficulty tiers

2. **DesignAgent** — update to support two modes:
   - v5-engine mode: existing behavior (NODES/steps/WE structure)
   - full-synthesis mode: query the plugin registry for each concept, assign interactions, output `experience_plan.json`

3. **AssessmentAgent** — update to:
   - Accept extracted exercises as input (not just generate new ones)
   - Convert existing exercises into gamified format with misconception explanations
   - Assign assessment levels (warmup/deep_dive/boss) based on difficulty tiers
   - Generate additional assessments if the chapter has < 10 exercises total

4. **LLEAgent** — extend beyond Hindi:
   - Add a `--language` flag (hi, ta, te, mr, bn, etc.)
   - Load language-specific baseline dictionaries from `config/` (create stub files for Tamil, Telugu, Marathi, Bengali with ~50 common words each)
   - The LLE format remains: `हिंदी_अर्थ (अंग्रेज़ी_उच्चारण_देवनागरी_में)` but in the target language's script

---

### TASK 4: Implement Agent Communication Protocol

Agents currently communicate only through files on disk. Add a structured communication layer:

1. Create `src/aasha/pipeline/agent_bus.py` — a lightweight message bus:
   ```python
   class AgentBus:
       def publish(self, topic: str, message: dict): ...
       def subscribe(self, topic: str, handler: callable): ...
       def get_messages(self, topic: str, since: str = "") -> list[dict]: ...
   ```

2. Topics:
   - `job.created` — new job created
   - `stage.started` — a stage began
   - `stage.completed` — a stage finished
   - `stage.failed` — a stage failed
   - `concept.identified` — a concept was found (AnalysisAgent → DesignAgent)
   - `exercise.extracted` — an exercise was extracted (ExerciseExtractor → AssessmentAgent)
   - `interaction.assigned` — a plugin was assigned to a concept (DesignAgent → Synthesizer)
   - `assessment.generated` — an assessment was created (AssessmentAgent → Synthesizer)
   - `qa.result` — QA pass/fail (QAAgent → Orchestrator)

3. The bus is file-backed (writes to `work/<job_id>/messages.jsonl`) so it survives restarts and supports `--from-stage` resume.

4. The web UI reads from the bus to show live progress (replace the current polling of `job.json`).

---

### TASK 5: Add Parallel Agent Execution

Currently agents run sequentially. Add parallel execution for independent stages:

1. After Stage 2 (Analyze), Stages 3 (Design) and the LLE generation can run in parallel — the LLE agent only needs the body text, not the interaction assignments.

2. Within Stage 4 (Assess), batch assessments can be generated in parallel (multiple LLM calls simultaneously).

3. Use `concurrent.futures.ThreadPoolExecutor` for LLM calls (they're I/O-bound).

4. Track per-agent cost separately in `job.json`:
   ```json
   "costs": {
     "analyze": 0.05,
     "design": 0.03,
     "assess": 0.12,
     "lle": 0.04,
     "total": 0.24
   }
   ```

---

### TASK 6: Add Mastery Tracking and Analytics

The generated chapter should track student progress:

1. Add `src/aasha/analytics/mastery_tracker.py`:
   - Track per-concept mastery (0-100%)
   - Track per-assessment-level completion
   - Calculate overall chapter completion %
   - Persist to `localStorage` (offline)

2. The Frontend Code Synthesizer should embed the mastery tracker JS in every generated chapter:
   - Show a mastery progress bar per concept
   - Show overall chapter completion in the topbar
   - Award badges at mastery milestones (25%, 50%, 75%, 100%)
   - On 100% mastery, show a completion celebration

3. Add an analytics export — when a student completes a chapter, generate a JSON summary:
   ```json
   {
     "chapter": "Fractions",
     "student_id": "anonymous",
     "completion_pct": 85,
     "time_spent_min": 12,
     "concepts_mastered": ["What is a Fraction", "Equivalent Fractions"],
     "concepts_struggling": ["Fraction of a Number"],
     "total_xp": 145,
     "badges_earned": ["First Steps", "Halfway Hero"],
     "assessments": {
       "warmup": {"correct": 8, "total": 10},
       "deep_dive": {"correct": 4, "total": 6},
       "boss": {"correct": 1, "total": 2}
     }
   }
   ```

---

### TASK 7: Production Hardening

1. **Error recovery**: If an LLM call fails after retries, the orchestrator should:
   - Save partial results
   - Allow manual edit of the intermediate JSON
   - Resume from the failed stage with `--from-stage`
   - Never lose already-completed work

2. **Cost guardrails**: Add `--max-cost` flag. If the running total exceeds the limit, pause and ask the operator to confirm.

3. **Rate limiting**: The LLM adapter should respect provider rate limits. Add a configurable delay between calls (default: 0 for cache hits, 0.5s for misses).

4. **Input validation**: Validate uploaded PDFs (max size, page count, must be text-based not scanned). Return clear error messages.

5. **Logging**: Add structured JSON logging to `work/<job_id>/pipeline.log` with timestamps, stage names, and durations.

---

### TASK 8: Update the Web UI for Both Modes

1. Add a mode selector on the upload form: "v5 Engine (NCERT Math)" vs "Full Synthesis (Any Subject)"

2. When full-synthesis mode is selected:
   - Show additional fields: Board (NCERT, ICSE, State), Language (Hindi, Tamil, etc.)
   - Show a plugin preview: "This chapter will use: JSXGraph, PhET, Timeline"
   - Show the 3-level assessment structure

3. The job detail page should show:
   - Plugin usage summary (which plugins were used and for which concepts)
   - Exercise extraction summary (X exercises found, Y converted)
   - Assessment level breakdown (warmup: X, deep_dive: Y, boss: Z)
   - Cost per agent

4. Add a "Plugin Manager" page where operators can:
   - See all registered plugins and their metadata
   - Enable/disable plugins
   - Download/cache library bundles
   - Check license compliance

---

### TASK 9: Update QA Harness for New Step Types

The Node.js QA harness (`qa/run_qa.js`) needs to validate:

1. New step types: `jsxgraph`, `phet`, `geogebra`, `mermaid`, `fabric`, `h5p`, `vlab`, `scilab`, `mafs`, `hotpotatoes`, `phonics`, `timeline`

2. For each new step type:
   - Check that the required fields are present (e.g., `board_config` for jsxgraph, `sim_id` for phet)
   - Check that plugin render functions are present in the HTML
   - Verify the interaction container div exists

3. For the full-synthesis output:
   - Check that all 3 assessment levels are present
   - Check that XP values are correct (5/10/20)
   - Check that every wrong option has a non-empty misconception
   - Check that concept cards are collapsible
   - Check that progress tracking JS is present

4. Add a file-size check that accounts for embedded plugin bundles (higher limit for full-synthesis mode: 500KB vs 200KB for v5-engine).

---

### TASK 10: Write Comprehensive Documentation

Update and expand the docs:

1. **`docs/ARCHITECTURE.md`** — add the dual-mode architecture (v5-engine vs full-synthesis), the 4-agent flow, and the plugin system overview

2. **`docs/PLUGINS.md`** — already exists, update with real library embedding instructions

3. **`docs/AGENTIC_DESIGN_V2.md`** — already exists, update with agent bus and parallel execution

4. **`docs/ASSESSMENT_LEVELS.md`** — already exists, update with mastery tracking

5. **`docs/OPERATOR_GUIDE.md`** — update for both modes, add plugin management

6. **New: `docs/CONTRIBUTING.md`** — how to add a new plugin, a new agent, a new subject profile

7. **New: `docs/DEPLOYMENT.md`** — how to deploy locally, configure API keys, set up the QA harness

8. **Update `README.md`** — reflect the full capabilities (any subject, any grade, any board, 12 plugins, 3-level assessments)

---

## TECHNICAL CONSTRAINTS (NON-NEGOTIABLE)

1. **Single offline HTML file** — all output must be a single `.html` file that works with zero network access. All JS/CSS libraries embedded as base64. No CDN links.

2. **Mobile-first** — 480px max-width, touch-optimized, 44px minimum tap targets. Works on low-end Android smartphones.

3. **10 Critical Rules** (enforced by QA):
   1. Wrong answers never reveal the correct answer
   2. All options shuffled at render time
   3. No drag-and-drop API (tap-to-select only)
   4. No confirm()/alert() (use inline feedback)
   5. Skip button on all interactive steps
   6. Button never disabled when it's the only way forward
   7. `_weCheckRendered` flag present (for v5-engine mode)
   8. localStorage bounds-checked
   9. exit() is instant reset, no dialog
   10. No dead code

4. **LLM cost < $0.50 per chapter** — achieve through caching, batching, and Gemini free-tier fallback

5. **Python 3.11+** for the pipeline, **Node.js 20+** for the QA harness

6. **Backward compatible** — all 62 existing tests must pass without modification

7. **File naming**: ASCII-only filenames (English letters, digits, hyphens, underscores)

8. **No external dependencies in the output HTML** — everything embedded

---

## FILE STRUCTURE (CURRENT + PLANNED)

```
aasha-pipeline/
├── src/aasha/
│   ├── __init__.py
│   ├── config.py
│   ├── cli.py                          ← UPDATE: add --mode, --language, --max-cost
│   ├── agents/                         ← V1: 6 agents (keep as-is)
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── ingest_agent.py
│   │   ├── analysis_agent.py           ← UPDATE: multi-subject, exercise extraction
│   │   ├── design_agent.py             ← UPDATE: dual-mode (v5 + plugin registry)
│   │   ├── assessment_agent.py         ← UPDATE: exercise conversion, 3 levels
│   │   ├── lle_agent.py                ← UPDATE: multi-language
│   │   └── qa_agent.py
│   ├── plugins/                        ← V2: 12 plugins (keep, add bundler)
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── v5_canvas.py
│   │   ├── bundler.py                  ← NEW: library download + base64 embedding
│   │   ├── jsxgraph/
│   │   ├── phet/
│   │   ├── geogebra/
│   │   ├── mermaid/
│   │   ├── fabric/
│   │   ├── h5p/
│   │   ├── vlab/
│   │   ├── scilab/
│   │   ├── mafs/
│   │   ├── hotpotatoes/
│   │   ├── phonics/
│   │   └── timeline/
│   ├── profiles/                       ← V2: subject profiles (keep)
│   │   └── __init__.py
│   ├── exercise/                       ← V2: exercise extractor (keep)
│   │   └── __init__.py
│   ├── synthesis/                      ← V2: Agent 4 (keep, enhance)
│   │   ├── __init__.py
│   │   └── code_synthesizer.py         ← UPDATE: mastery tracking, plugin bundling
│   ├── analytics/                      ← NEW
│   │   ├── __init__.py
│   │   └── mastery_tracker.py          ← NEW: per-concept mastery, completion tracking
│   ├── schemas/                        ← V1+V2: Pydantic models (keep, extend)
│   │   ├── __init__.py                 ← UPDATE: new stage names, assessment levels
│   │   └── validator.py
│   ├── llm/                            ← V1: LLM adapter (keep)
│   │   ├── __init__.py
│   │   └── adapter.py
│   ├── pipeline/                       ← V1: orchestrator (UPDATE for dual-mode)
│   │   ├── __init__.py
│   │   ├── orchestrator.py            ← UPDATE: --mode flag, parallel execution
│   │   └── agent_bus.py               ← NEW: message bus
│   ├── assemble/                       ← V1: v5 HTML assembler (keep)
│   │   ├── __init__.py
│   │   └── html_assembler.py
│   ├── web/                            ← V1: Flask UI (UPDATE for both modes)
│   │   ├── __init__.py
│   │   ├── app.py                     ← UPDATE: mode selector, plugin manager
│   │   └── templates/
│   │       ├── upload.html            ← UPDATE: mode/board/language fields
│   │       ├── job_detail.html       ← UPDATE: plugin/exercise/assessment summary
│   │       ├── edit_spec.html
│   │       ├── jobs.html
│   │       └── plugins.html           ← NEW: plugin manager page
│   └── ingest/                         ← (empty, unused — can remove)
├── qa/
│   ├── run_qa.js                      ← UPDATE: new step types, full-synthesis checks
│   └── package.json
├── template/
│   └── v5-engine-template.html        ← FROZEN (never edit)
├── schema/
│   └── chapter_spec.schema.json       ← FROZEN
├── config/
│   └── defaults.json                  ← EXTEND: add Tamil/Telugu/Marathi/Bengali stubs
├── docs/
│   ├── ARCHITECTURE.md                ← UPDATE
│   ├── AGENTIC_DESIGN.md              ← keep
│   ├── AGENTIC_DESIGN_V2.md           ← UPDATE
│   ├── PLUGINS.md                     ← UPDATE
│   ├── ASSESSMENT_LEVELS.md           ← UPDATE
│   ├── QA_CHECKLIST.md                ← UPDATE
│   ├── OPERATOR_GUIDE.md              ← UPDATE
│   ├── ENGINE_REFERENCE.md            ← keep
│   ├── CHAPTER_SPEC_SCHEMA.md         ← keep
│   ├── OPEN_SOURCE_TOOLING.md         ← keep
│   ├── CONTRIBUTING.md                ← NEW
│   └── DEPLOYMENT.md                  ← NEW
├── tests/
│   ├── conftest.py
│   ├── test_validator.py              ← keep (8 tests)
│   ├── test_assembler.py              ← keep (5 tests)
│   ├── test_llm_adapter.py            ← keep (10 tests)
│   ├── test_agents.py                 ← keep (4 tests)
│   ├── test_plugins.py                ← keep (11 tests)
│   ├── test_exercise_and_profiles.py  ← keep (14 tests)
│   ├── test_synthesizer.py            ← keep (7 tests)
│   ├── test_orchestrator_dual_mode.py ← NEW
│   ├── test_agent_bus.py              ← NEW
│   ├── test_mastery_tracker.py        ← NEW
│   ├── test_plugin_bundler.py         ← NEW
│   └── test_parallel_execution.py     ← NEW
├── examples/                          ← 4 reference HTML chapters
├── pyproject.toml
├── requirements.txt
├── config.yaml
├── .env.example
├── .gitignore
├── LICENSE
└── README.md                          ← UPDATE
```

---

## EXECUTION ORDER

1. Task 1 (wire full-synthesis pipeline into orchestrator) — this is the critical path
2. Task 3 (upgrade LLM agents for multi-subject) — needed for Task 1 to work end-to-end
3. Task 2 (actual library embedding) — enhances plugin output quality
4. Task 4 (agent bus) — improves observability and web UI
5. Task 5 (parallel execution) — performance optimization
6. Task 6 (mastery tracking) — student-facing feature
7. Task 7 (production hardening) — reliability
8. Task 8 (web UI updates) — operator experience
9. Task 9 (QA harness updates) — quality gate
10. Task 10 (documentation) — last

After each task, run `python -m pytest tests/ -v` and ensure all tests pass. Add new tests for each new component.

---

## SUCCESS CRITERIA

The build is complete when:

1. `python -m aasha.cli --pdf any_chapter.pdf --subject science --grade 8 --mode full-synthesis` produces a single HTML file with embedded PhET/JSXGraph simulations, 3-level gamified assessments, and mastery tracking
2. `python -m aasha.cli --pdf math_chapter.pdf --subject math --grade 4 --mode v5-engine` still works exactly as before (backward compatible)
3. `python -m aasha.cli --pdf history_chapter.pdf --subject social_studies --grade 6 --mode full-synthesis --language hi` produces a chapter with Hindi LLE and interactive timelines
4. All 62 existing tests + all new tests pass
5. The generated HTML works offline on a low-end Android phone (no network, no CDN)
6. LLM cost per chapter is under $0.50
7. The web UI shows both modes with plugin/exercise/assessment summaries
8. The QA harness validates both output modes

---

## KEY DESIGN PRINCIPLES (FROM THE SPECIFICATION)

- **No Conceptual Gaps:** Retain all core curricular concepts, definitions, and board-mandated standards while removing dry, passive text.
- **100% Assessment Conversion:** Every question, exercise, numerical, MCQ, match-the-column, and short/long answer from the source MUST be transformed into an active, gamified challenge.
- **Multimodal Delivery:** Blend simulations, interactive widgets, visual diagrams, and active self-checks.
- **Low-Cost / High-Efficiency Codebase:** Prefer lightweight HTML5/JS components (JSXGraph, Mafs, Canvas, PhET embeds, H5P-compatible JSON, Mermaid.js).

---

## DO NOT

- Do NOT remove or rename any existing file without providing a migration path
- Do NOT change the v5 engine template (`template/v5-engine-template.html`) — it is frozen
- Do NOT change the JSON schema file (`schema/chapter_spec.schema.json`) — it is frozen
- Do NOT change the baseline dictionaries in `config/defaults.json` — only add new language stubs
- Do NOT break any of the 62 existing tests
- Do NOT add external CDN links to the output HTML
- Do NOT use confirm() or alert() in the output HTML
- Do NOT use drag-and-drop HTML5 API in the output HTML
- Do NOT put `[cite:...]` markers inside any generated file — they are chat-only control codes
- Do NOT write Devanagari or other non-ASCII text yourself — use the `translate_text` tool for Indic output
