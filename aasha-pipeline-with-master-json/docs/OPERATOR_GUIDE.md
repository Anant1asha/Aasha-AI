# Operator Guide — How to Use the Pipeline

## Installation

```bash
# Clone the repo
git clone <repo-url> aasha-pipeline
cd aasha-pipeline

# Install Python dependencies
pip install -e ".[dev]"

# Install Node.js QA dependencies (optional but recommended)
npm install jsdom

# Configure
cp .env.example .env
# Edit .env — add your OPENAI_API_KEY (or GEMINI_API_KEY)
```

## Building a Single Chapter (CLI)

```bash
python -m aasha.cli --pdf path/to/chapter.pdf --subject math --grade 4
```

The CLI will:
1. Create a job (UUID)
2. Run all 9 pipeline stages
3. Print progress for each stage
4. Output the HTML file to `./output/`

### CLI Options

| Option | Description |
|--------|-------------|
| `--pdf PATH` | Path to a single PDF |
| `--batch DIR` | Directory of PDFs for batch processing |
| `--subject` | Subject (math, science, english, evs) |
| `--grade` | Grade level (3-8) |
| `--provider` | LLM provider (openai, gemini, anthropic) |
| `--from-stage STAGE` | Resume from a specific stage |
| `--web` | Start the web UI instead |
| `--verbose` | Enable debug logging |

## Batch Processing

```bash
python -m aasha.cli --batch ./chapters/ --subject math --grade 4
```

Processes all `.pdf` files in the directory sequentially. Prints a summary:
```
[1/12] fractions.pdf ......... PASS (3m 42s, $0.31)
[2/12] decimals.pdf .......... PASS (4m 12s, $0.28)
...
Summary: 11 built, 1 failed. Cost: $3.48. Time: 41m.
```

## Resuming from a Stage

If a chapter fails QA, you can edit the `chapter_spec.json` and resume
without re-running LLM calls:

```bash
# Find the job's work directory
ls work/<job_id>/

# Edit the spec
vim work/<job_id>/chapter_spec.json

# Resume from assembly (stages 7-8 only, costs $0)
python -m aasha.cli --pdf chapter.pdf --from-stage assemble
```

Available stages: `ingest`, `analyze`, `design`, `assess`, `lle`, `assemble`,
`qa`, `output`

## Using the Web UI

```bash
python -m aasha.cli --web
```

Then open `http://127.0.0.1:5000` in your browser.

### Web UI Features
- **Upload**: Drop a PDF, select subject/grade/provider, click Generate
- **Job Detail**: Watch live progress through 9 stages, see live log
- **Preview**: View the generated chapter in an iframe at 480px width
- **Download**: Get the HTML file or JSON spec
- **Edit Spec**: Edit the JSON spec in a text editor, then re-run Assembly + QA
- **Jobs List**: See all past jobs with status and cost

## Reading a QA Failure Report

When QA fails, the report tells you exactly what went wrong:

```
QA FAIL: 210/217 checks passed, 7 failures
  - no_external_urls: Found 2 external URLs
  - rule1_misconceptions_exist: No m fields found in step 3
  - has_devanagari: Only 3 Devanagari chars (LLE may be missing)
```

### Common Failures and Fixes

| Failure | Cause | Fix |
|---------|-------|-----|
| `no_placeholders` | Template not fully injected | Re-run from `assemble` stage |
| `has_devanagari` | LLE generation failed | Re-run from `lle` stage |
| `rule1_misconceptions_exist` | Assessment agent didn't generate `m` fields | Re-run from `assess` stage |
| `file_size` | Chapter too large (>200KB) | Reduce content or downsample images |
| `syntax` | Invalid JavaScript in template | Check template integrity |

## Cost Management

- **LLM cache**: Re-runs with the same PDF + provider + model cost $0
- **Resume from stage**: Editing the spec and resuming from `assemble` costs $0
- **Gemini free tier**: Use `--provider gemini` for free-tier fallback
- **Cost tracking**: Each job records `cost_usd` in `job.json`

## File Locations

| Path | Purpose |
|------|---------|
| `work/<job_id>/` | Intermediate files for each job |
| `output/` | Final HTML and spec files |
| `jobs/<job_id>.json` | Job state tracking |
| `.llm_cache/` | Cached LLM responses |
| `config/defaults.json` | Baseline dictionaries, LEVELS, BADGES |
| `template/v5-engine-template.html` | Frozen v5 engine template |
