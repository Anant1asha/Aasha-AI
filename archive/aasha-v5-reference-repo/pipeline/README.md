# Pipeline Scaffolding

Mirrors the 9-stage flow in `Aasha_MVP_6_Documents.md §3.2`. Each subfolder is a **contract**,
not an implementation — it documents the stage's input/output files and validation rules, in
line with tools recommended in `docs/OPEN_SOURCE_TOOLING.md`. This is intentional: a working
pipeline is a multi-week build (see the original spec's Milestones 1-10); what belongs in a
*reference* repo is the interface every stage must honor, so a human or an LLM implementing a
stage later can't accidentally violate the contract or the 10 critical rules.

```
source.pdf
  → pipeline/ingest    → raw_extract.json
  → pipeline/analyze   → content_map.json
  → pipeline/design    → chapter_spec.json (structure only)
  → pipeline/assess    → chapter_spec.json (assessments filled)
  → pipeline/lle       → lle.json
  → pipeline/assemble  → chapter.html   (uses template/v5-engine-template.html)
  → pipeline/qa        → qa_report.json
```

Every stage writes a real file to disk so a human can inspect or hand-edit any intermediate and
resume from that point (`--from-stage`) — this is what makes iterative fixes free (no LLM cost)
after the first full run.

## This is a working agent — quickstart

Every stage listed above has a real Python (or Node, for QA) implementation alongside its
contract README. Zero required third-party packages — it runs out of the box with a
deterministic `MockProvider` so you can exercise the whole thing offline before wiring in a
real LLM key.

```bash
cd pipeline
python3 build_chapter.py \
  --stub-text "Percentage means per hundred. To convert a fraction to a percentage, multiply by 100..." \
  --subject math --grade 8 --title "Percentages" --storage-key aasha_percent_v5 \
  --provider mock
```

This produces `output/aasha_percent_v5.html` (a real, QA-passing v5 chapter) and prints the job
ID + intermediate file directory. Swap `--provider mock` for `--provider anthropic --model
claude-sonnet-5` (with `ANTHROPIC_API_KEY` set) once you're ready to generate real pedagogical
content — same CLI, same validation, same QA gate.

**Resuming after a hand-edit** (the reason job.json/work-dir exist): edit
`work/<job-id>/chapter_spec.json` directly, then:
```bash
python3 build_chapter.py --job-id <job-id> --from-stage lle \
  --subject math --grade 8 --title "Percentages" --storage-key aasha_percent_v5
```
Only the stages from `lle` onward re-run — `ingest`/`analyze`/`design`/`assess` are skipped
entirely, and even within `lle` any previously-seen LLM prompt is served from
`work/.llm_cache/` instead of re-billed.

### Real PDF ingestion
`--pdf source.pdf` instead of `--stub-text` — requires `pip install pymupdf` (not bundled, see
`requirements.txt`). Everything downstream of ingestion is unaffected by which input mode you use.

### Full-fidelity QA
The QA harness (`pipeline/qa/run_qa.js`) runs syntax + static critical-rule checks with zero
dependencies. For the render-every-step and interaction-flow-simulation tiers, install jsdom:
`npm install jsdom` — without it those two tiers are honestly reported as `skipped`, not
silently passed.


