# Aasha Pipeline — Multi-Agent AI Chapter Builder

An agentic AI system that converts textbook PDFs into self-contained,
gamified HTML learning chapters for students in Indian government schools
(Grades K–12). 

## V2 Capabilities (Full Synthesis Mode)

With the introduction of the V2 pipeline, Aasha now supports:
- **Dual-Mode Output**: Choose between the classic v5 template injection or Full Synthesis (generating modern HTML5/Tailwind from scratch).
- **Expanded Subject Support**: Full support for STEM, Humanities, Languages, and Social Sciences.
- **4-Agent Parallel Flow**: Utilizes a modernized agentic workflow utilizing `ThreadPoolExecutor` for parallel LLM queries, drastically reducing generation time.
- **Extensible Plugin System**: Embeds up to 12 open-source interactive libraries (JSXGraph, PhET, GeoGebra, Mermaid.js, etc.) directly as base64 into the offline HTML.
- **3-Tier Gamified Assessment**: Exercises are extracted and transformed into Warm-up, Deep Dive, and Boss Challenge levels.
- **Mastery Tracking & Offline Sync**: Tracks student mastery locally and syncs payloads safely when online.
- **File-Backed Bus**: Fully transparent agent interactions saved to disk for resuming and zero-cost debugging.

## Quick Start

```bash
# 1. Install dependencies
pip install -e ".[dev]"
npm install jsdom

# 2. Configure
cp .env.example .env
# Add API Keys to .env

# 3. Build a chapter
python -m aasha.cli --pdf path/to/chapter.pdf --subject math --grade 4 --mode v2

# 4. Or use the web UI
python -m aasha.cli --web
```

## Architecture

```
                    ┌─────────────────────────────────────────────────┐
  CLI / Web UI ────▶│              ORCHESTRATOR                        │
                    │  job lifecycle · state tracking · cost estimate  │
                    └──────┬──────┬──────┬──────┬─────────────────────┘
                           │      │      │      │      
                    ┌──────▼┐ ┌──▼──┐ ┌─▼──┐ ┌▼────┐ 
                    │ Agt 1 │ │Agt 2│ │Agt 3│ │Agt 4│ 
                    │Analyze│ │Dsgn │ │Asess│ │Synth│ 
                    └───────┘ └─────┘ └────┘ └─────┘ 
```

## Critical Features
- **Single file**, zero dependencies, works offline.
- **Mobile-first** (480px max-width).
- **Strict Size Limits**: Validates against a 20MB cap to ensure compatibility with budget smartphones.

## License
MIT (see LICENSE).
