# Architecture — Multi-Agent Pipeline

## Overview

The Aasha Pipeline is a multi-agent AI system that converts NCERT textbook
PDFs into self-contained, gamified HTML learning chapters. 
It now supports a **Dual-Mode Architecture**:
1. **Mode 1 (v5 Engine)**: Injects into a frozen template (used for grades 3-8 math). Uses a 6-agent sequential flow.
2. **Mode 2 (Full Synthesis)**: Generates complete HTML5/Tailwind/JS modules from scratch with embedded plugin libraries for any subject and grade. Powered by a modernized **4-Agent Flow** and an extensible **Plugin System**.

## Mode 2: 4-Agent Flow

```
                    ┌─────────────────────────────────────────────────────┐
  CLI / Web UI ────▶│              ORCHESTRATOR                            │
                    │  job lifecycle · state tracking · cost estimate     │
                    └──────┬──────┬──────┬──────┬─────────────────────────┘
                           │      │      │      │      
                    ┌──────▼┐ ┌──▼──┐ ┌─▼──┐ ┌▼────┐
                    │ Agt 1 │ │Agt 2│ │Agt 3│ │Agt 4│
                    │Analyze│ │Dsgn │ │Asess│ │Synth│
                    └───────┘ └─────┘ └────┘ └─────┘
                         │       │       │       │
                      extract  concept  gamify  final
                       .json    map      spec   html
```

### Agent 1: Pedagogical Analyzer & Assessment Extractor
- Analyzes text, extracts key learning milestones, classifies subject domain.
- Extracts 100% of end-of-chapter questions and in-text activities.

### Agent 2: Interactive Experience Designer
- Selects the optimal plugins for interactivity (e.g., JSXGraph for Math, PhET for Science, Timeline for History).
- Maps concepts to interaction models dynamically via the Plugin Registry.

### Agent 3: Gamified Assessment Architect
- Restructures extracted questions into a 3-tier gamified assessment (Warm-up, Deep Dive, Boss Challenge).
- Attributes XP, streaks, and hints based on the difficulty tier.

### Agent 4: Frontend Code Synthesizer
- Generates the final self-contained HTML/CSS/JS file.
- Collects required plugin assets and embeds them directly (base64) into the final artifact.

## Plugin System

The pipeline features a robust plugin system allowing up to 12 open-source interactive tools (like JSXGraph, PhET, GeoGebra, Mermaid) to be embedded directly into generated modules. The Experience Designer (Agent 2) queries the Plugin Registry to find the best matching interaction tool based on subject, grade, and required concept. The synthesizer then embeds these tools' logic offline.

## Data Flow & File-Backed Bus

Each agent operates via a file-backed event bus. Every intermediate step is a real file written to the job's work directory. This means:
- Any stage can be stopped, inspected, edited, and resumed.
- Free iterative fixes without LLM costs.
- Transparent debugging.

## The LLM Adapter Layer

A thin abstraction supporting multiple providers:
- OpenAI (GPT-4o/GPT-4o-mini default)
- Google Gemini (free-tier fallback / Gemini 1.5 Pro)
- Anthropic Claude (optional)

Features:
- `complete(system, user, schema)` → parsed JSON
- `batch_complete(items)` → list of parsed JSONs
- File cache keyed by SHA-256(system + user + model) — re-runs are free
- Retry with exponential backoff + jitter (tenacity)
- Malformed JSON repair retry
- Cost estimation per call
