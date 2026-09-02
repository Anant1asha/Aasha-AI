# Aasha v5 Chapter Engine — Reusable Reference Repo

**Purpose.** This is a *reference architecture*, not a chapter. It packages the proven v5
gamified-HTML engine (stabilized over 9 build rounds across Fractions, Perimeter & Area, and
Comparing Quantities) as a reusable, content-free template plus the docs, schema, and pipeline
scaffolding needed to transform any NCERT chapter PDF into a v5-conformant HTML chapter —
by hand or by an automated pipeline — **without re-deriving the engine from scratch each time.**

Nothing in `/template` or `/schema` should ever be hand-edited per chapter. Content goes into
the placeholders; the engine underneath stays fixed. That separation is the whole point of
this repo.

## What's in here

| Path | What it is | Reuse rule |
|---|---|---|
| `template/v5-engine-template.html` | The full v5 engine (CSS + JS controller + canvas visuals + gamification) with all content stripped to `{{PLACEHOLDER}}` tokens | Never hand-edit. Inject JSON, don't touch the JS. |
| `docs/ENGINE_REFERENCE.md` | What every engine function/module does, so a new chapter build (human or LLM) understands the engine before touching content | Read before every chapter build |
| `docs/ARCHITECTURE.md` | The six conceptual engines (TLN, Question, TEAS, Reward, Game, Impact) and how they map onto the single HTML file | Read once per project, reference per feature |
| `docs/CHAPTER_SPEC_SCHEMA.md` + `schema/chapter_spec.schema.json` | The JSON contract a chapter must satisfy before assembly | Validate every chapter spec against this before compiling to HTML |
| `docs/QA_CHECKLIST.md` | The 10 non-negotiable rules + the shape of the 200+-check automated suite | Run against every generated `.html`, no exceptions |
| `docs/OPEN_SOURCE_TOOLING.md` | Libraries to reach for instead of hand-rolling — PDF parsing, schema validation, QA harness, audio, icons, fonts | Check here before writing new infra code |
| `config/defaults.json` | Default LEVELS/BADGES progression and CSS palette so a new chapter starts from proven defaults, not a blank page | Override only when a chapter genuinely needs it |
| `pipeline/*` | A **working agent**: 9-stage orchestrator (`orchestrator.py`), CLI (`build_chapter.py`), pluggable LLM adapter with a zero-network mock provider, pure-stdlib validators, and a Node QA harness — proven end-to-end in this repo (see `pipeline/README.md` quickstart) | Run it. Extend stage implementations as pedagogical quality needs grow; don't re-derive stage boundaries. |
| `examples/` | Pointers to the three hand-built reference chapters this template was extracted from | Study these for *pattern*, never copy-paste their content into a new chapter |

## How to use this for a new chapter

**Automated (the agent):**
```bash
cd pipeline
python3 build_chapter.py --pdf source.pdf --subject math --grade 8 \
  --title "Chapter Title" --storage-key aasha_yourkey_v5 \
  --provider anthropic --model claude-sonnet-5   # or --provider mock for a free offline test run
```
See `pipeline/README.md` for the full quickstart, resume workflow, and QA gate behavior.

**Manual / by hand, or to understand what the agent is doing:**
1. Read `docs/ARCHITECTURE.md` and `docs/ENGINE_REFERENCE.md` once — understand the engine, don't memorize content.
2. Produce a `chapter_spec.json` for the new chapter conforming to `schema/chapter_spec.schema.json` (NODES, WE, SOLVE, chapter metadata).
3. Generate an `lle.json` (WM/CONN dictionaries) — reuse the baseline dictionary from `config/defaults.json`, only generate net-new words.
4. Run the injector (`pipeline/assemble/assemble.py`) to drop `chapter_spec.json` + `lle.json` into `template/v5-engine-template.html` at the eight placeholders.
5. Run the QA suite (`node pipeline/qa/run_qa.js chapter.html`) against the output. Do not ship a chapter that fails any of the 10 critical rules.

## Why this exists

Every prior chapter (Fractions v8, Perimeter & Area, Comparing Quantities) was built by re-deriving
the same engine patterns inside a single giant HTML file, which works but means each new chapter
starts from a full rebuild instead of a fill-in-the-blanks. This repo is the fill-in-the-blanks
version: the engine is proven and frozen, content is the only variable, and the 10 critical rules
are enforced mechanically instead of by memory.
