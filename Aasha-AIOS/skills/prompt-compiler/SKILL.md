---
name: aasha-prompt-compiler
description: >-
  Aasha-AIOS Adaptive Semantic Prompt Compiler & Architectural Guide. Implements
  formal Pāṇinian Kāraka computational semantics, a 10-stage prompt compilation pipeline,
  turn-by-turn Prompt Delta Engine, local Graphify and Mem0 memory connectors, and
  Chāṇakya Human-in-the-Loop (HIL) governance with dual-output teacher proposals.
version: 1.0.0
layer: layer-4-extensions
compatibility:
  runtimes: [antigravity, claude-code, freebuff, nodejs]
  models: [inherit, gemini-2.0-flash, claude-3-5-sonnet, nemotron-3.5]
tools_required:
  - view_file
  - write_to_file
  - run_command
---

# Aasha-AIOS Adaptive Semantic Prompt Compiler & Architectural Guide
*Canonical Mirror for Aasha-AIOS Ecosystem Portability*

See primary skill specification in `.agents/skills/aasha-prompt-compiler/SKILL.md`.

## Golden Invariants
1. **REFINE != REINVENT**: Turn-by-turn refinement without architectural or curriculum drift.
2. **SKILL != SYSTEM**: Zero modifications to core runtime or existing build pipelines.
3. **KID'S OWN BOOK FIRST**: Authoritative anchor in the child's prescribed textbook across K–12 (any board, any subject).
4. **PĀṆINIAN KĀRAKA IR**: Formal 6-role decomposition (Kartā, Karma, Karaṇa, Sampradāna, Apādāna, Adhikaraṇa).
5. **CHĀṆAKYA GOVERNANCE**: Dual-output proposal generation (`.proposal.md`) and non-technical teacher review (`शिक्षक के लिए सारांश`).
6. **READ & EVALUATE FIRST — NEVER AUTO-MUTATE**: Strictly an advisory evaluation skill for this project. Always read and evaluate first; never modify files without prior review and explicit user approval.
