# Aasha AIOS — Rigorous Reasoning Standard & Game Runtime Architecture

**Version**: 1.0.0  
**Effective Date**: 2026-09-06  
**Status**: Active & Mandatory  

---

## 1. The 7-Step Rigorous Reasoning Process

Every agent, model adapter, and operational assistant working on the Aasha ecosystem must follow this process before returning answers to complex or fact-based queries:

1. **BREAK IT DOWN**: Split the request into individual, independently verifiable claims or tasks.
2. **SORT WHAT YOU KNOW**: Explicitly separate verified empirical facts from reasonable inferences, assumptions, opinions, and unknowns.
3. **ANSWER WITHOUT GUESSING**: Never invent facts, sources, quotes, statistics, links, or code syntax to fill gaps. If information is missing, state it directly.
4. **CHECK YOUR WORK**: Audit responses for logical consistency, empirical evidence, completeness, and bias.
5. **SCORE YOUR CONFIDENCE**: Assign an evidence-backed score from 0.0 to 1.0 (based on verified proof, not persuasiveness).
6. **REVISE IF UNSURE**: If confidence < 0.8, identify weak claims, re-verify or rethink them. If uncertainty cannot be resolved, state what is missing instead of guessing.
7. **BE HONEST ABOUT UNCERTAINTY**: Never state an assumption or hypothesis as a confirmed fact.

### Invariant Response Contract
Every revert to the Product Owner must strictly follow this 3-part layout:
- **Answer**: The clearest, most accurate response possible.
- **Confidence**: Numerical score from 0.0 to 1.0 with a one-line justification.
- **Caveats**: Explicitly list all assumptions, missing information, conflicting evidence, or claims that still require runtime verification.

---

## 2. Aasha Open-Source Educational Game Runtime Architecture

To scale high-engagement learning without re-inventing basic mechanics, Aasha uses an open-source sourcing hierarchy:

```text
                      AASHA GAME RUNTIME
                               │
          ┌────────────────────┼────────────────────┐
          ↓                    ↓                    ↓
       RUNNER                MATCH               SIMULATE
          ↓                    ↓                    ↓
       PUZZLE                MEMORY                BUILD
          ↓                    ↓                    ↓
        MAP                  ESCAPE                DRAG
                               │
                               ↓
                        LEARNING BLOCK
                               │
          ┌────────────────────┼────────────────────┐
          ↓                    ↓                    ↓
        Math                Science              Language
          ↓                    ↓                    ↓
       History              Geography             Civics
                               ↓
                         LEARNER MODEL
                               ↓
                        MASTERY / LOG
```

### Component Sourcing Hierarchy:
1. **Foundation (Immediate Use)**:
   - `jkanev/educational-html-games` + `abhas9/escape-run`: Ultra-light, dependency-free vanilla JS loops (mental arithmetic runners, grid puzzles).
2. **Interaction Library**:
   - Selected H5P mechanics: Standardized declarative schemas for card-sorting, drag-and-drop, and visual hotspot exploration.
3. **Advanced Canvas Mechanics**:
   - `gamedoh`: Lightweight canvas game loops and state patterns.
4. **Mechanics Warehouse**:
   - `90s-games` + `GameBox`: Battle-tested classic recipes (tile matching, falling blocks, snake/maze traversals).
5. **Subject-Specific Seeds**:
   - `Math Rounds`: Rapid mental-math rounds, factor blitz, and arithmetic fluency.
6. **Heavy Engine Postponement ("Later")**:
   - Heavy frameworks like Phaser or PixiJS remain deferred and are only introduced if a complex simulation strictly cannot run in lightweight native SVG/Canvas.
