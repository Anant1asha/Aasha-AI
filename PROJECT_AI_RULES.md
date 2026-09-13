# Antigravity & Multi-Agent Guidelines for Aasha Project

**Override to Global Rule (AI Tool Hierarchy):**
The user has explicitly set up Claude Code with OpenRouter (using the free model `nvidia/nemotron-3.5-lightning:free`). Swap out Freebuff for this Claude + OpenRouter setup to get significantly better results on high-performance tasks:

## When to use Claude Code:
1. **Interactive Educational Simulations (JSXGraph, PhET, Mermaid):** Generating complex geometric plots, interactive science simulations, or intricate state-machines requires deep mathematical reasoning. Claude is far superior at writing bug-free, interactive JavaScript logic for educational widgets inside offline chapters.
2. **Fastify Server & API Architecture:** The `server` folder handles the backbone of the application. Claude excels at designing secure backend architectures, optimizing API route performance, and writing robust database schemas (e.g., offline syncs, LLE API requests).
3. **React + Vite + Tailwind Dashboard Development:** For the `dashboard` folder, use Claude to build complex UI components, handle tricky React state management, or design responsive layouts with Tailwind CSS. It produces cleaner, more modern, and accessible code.
4. **Evolving the TEAS Engine & L-Truth Benchmarks:** Tweaking complex logic like the TEAS engine (60% historical + 40% recent accuracy) and L-Truth anti-spoiler benchmarks requires advanced logic and edge-case detection. Claude is much better equipped to write and refine these core evaluation scripts.
5. **Cross-File Refactoring:** When updating core `packages` (like chapter-builder or test-harness) in a way that affects multiple files across the repository, Claude Code can hold more context and understand how a change in a package will impact the React dashboard and the Fastify server simultaneously.

## When to use Freebuff & OpenRouter Agents:
- **Freebuff (CLI):** Keep using Freebuff as an essential open-source local tool for grammar checks, simple formatting, or basic text extraction across hundreds of chapters. It provides free, local bucket-compute without API dependencies.
- **OpenRouter Multi-Agent Workflow:** For the pipeline stages (Content Analysis, Learning Design, Assessment, Translation), use the Node.js `agent_orchestrator.ts`. This routes specific agent tasks (e.g., `Translator`, `Assessor`) through `openrouter/auto` (or `openrouter/free`) to leverage top open-source models for free, removing full reliance on paid APIs like Google Gemini.

**Summary:** 
- Use **Claude Code** for complex React/Fastify logic and advanced interactive JavaScript.
- Use **OpenRouter Multi-Agent (via agent_orchestrator.ts)** for the automated chapter pipeline stages using free models.
- Use **Freebuff** for local bulk, repetitive text-editing tasks.

## Universal Learning Experience Reuse & Transformation Mandate:
**NEVER START A LEARNING EXPERIENCE FROM SCRATCH IF A SUITABLE OPEN-SOURCE, REUSABLE, ADAPTABLE OR REFERENCE EXPERIENCE ALREADY EXISTS.**
- For every chapter or concept: **SEARCH -> MATCH -> REUSE -> ADAPT -> COMPOSE -> ONLY THEN BUILD NEW**.
- Before writing code, query the registry (`Aasha-AI/experience_registry/registry.json`) and generate the mandatory **RESOURCE MATCH REPORT** (see `Aasha-AI/experience_registry/UNIVERSAL_LEARNING_EXPERIENCE_REUSE_SYSTEM.md`).
- Implement and wrap all simulations with the `AashaExperienceContract` / `AashaExperienceAdapter` lifecycle (`mount`, `getState`, `reset`, `destroy`, `telemetry`).
