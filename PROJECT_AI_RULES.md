# Antigravity & Multi-Agent Guidelines for Aasha Project

**Override to Global Rule (AI Tool Hierarchy):**
The user has explicitly set up Claude Code with OpenRouter (using the free model `nvidia/nemotron-3.5-lightning:free`). Swap out Freebuff for this Claude + OpenRouter setup to get significantly better results on high-performance tasks:

## When to use Claude Code:
1. **Interactive Educational Simulations (JSXGraph, PhET, Mermaid):** Generating complex geometric plots, interactive science simulations, or intricate state-machines requires deep mathematical reasoning. Claude is far superior at writing bug-free, interactive JavaScript logic for educational widgets inside offline chapters.
2. **Fastify Server & API Architecture:** The `server` folder handles the backbone of the application. Claude excels at designing secure backend architectures, optimizing API route performance, and writing robust database schemas (e.g., offline syncs, LLE API requests).
3. **React + Vite + Tailwind Dashboard Development:** For the `dashboard` folder, use Claude to build complex UI components, handle tricky React state management, or design responsive layouts with Tailwind CSS. It produces cleaner, more modern, and accessible code.
4. **Evolving the TEAS Engine & L-Truth Benchmarks:** Tweaking complex logic like the TEAS engine (60% historical + 40% recent accuracy) and L-Truth anti-spoiler benchmarks requires advanced logic and edge-case detection. Claude is much better equipped to write and refine these core evaluation scripts.
5. **Cross-File Refactoring:** When updating core `packages` (like chapter-builder or test-harness) in a way that affects multiple files across the repository, Claude Code can hold more context and understand how a change in a package will impact the React dashboard and the Fastify server simultaneously.

## When to use Freebuff:
- **Bulk, Repetitive Tasks:** Keep using Freebuff for grammar checks, simple formatting, or basic text extraction across hundreds of chapters.

**Summary:** Switch strictly to Claude Code for any task that involves core logic, complex interactive JavaScript, backend architecture, or modern React UI development. Use Freebuff only for bulk, repetitive tasks.
