# Operator Guide — How to Use the Pipeline

## Installation

```bash
git clone <repo-url> aasha-pipeline
cd aasha-pipeline
pip install -e ".[dev]"
npm install jsdom
cp .env.example .env
```

## Using the Web UI

To launch the Web UI:
```bash
python -m aasha.cli --web
```
Open `http://127.0.0.1:5000` in your browser.

### Operating Both Modes in the Web UI

The Web UI allows operators to generate chapters using the Dual-Mode architecture:

**Mode 1 (v5 Engine):**
1. Upload your PDF.
2. In the "Mode Selection" dropdown, choose `v5 Engine (Legacy)`.
3. Select the subject (mostly Math/Science grades 3-8).
4. Click Generate. The UI will step through the 6-agent sequential flow and inject into the frozen template.

**Mode 2 (Full Synthesis):**
1. Upload your PDF.
2. In the "Mode Selection" dropdown, choose `Full Synthesis (Agentic V2)`.
3. Select your desired subject and grade.
4. Click Generate. The UI will initiate the new 4-agent parallel flow. This mode takes slightly longer but generates entirely fresh HTML5 with embedded plugins.

### The Plugin Manager

When using Mode 2, the Web UI exposes a **Plugin Manager** sidebar.
- **View Enabled Plugins:** See the list of the 12 available plugins and their base64 size overhead.
- **Force Override:** Before hitting Generate, you can force the pipeline to prefer specific plugins (e.g., checking the box for `PhET` forces Agent 2 to use PhET for science simulations, even if Virtual Lab is smaller).
- **Inspect Plugin Selection:** During generation (Stage 2), the Job Detail view will show exactly which plugin was selected for each concept and why.

## Building a Single Chapter (CLI)

```bash
python -m aasha.cli --pdf path/to/chapter.pdf --subject math --grade 4 --mode v2
```

## Batch Processing

```bash
python -m aasha.cli --batch ./chapters/ --subject math --grade 4
```

## Resuming from a Stage

If a chapter fails QA, you can edit the `chapter_spec.json` and resume without re-running LLM calls:
```bash
python -m aasha.cli --pdf chapter.pdf --from-stage assemble
```
