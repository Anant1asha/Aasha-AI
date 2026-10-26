# Annanth Aasha Foundation — Aasha AIOS
# AGENTS.md: Canonical Multi-Agent Governance & Operating Rules

**Version**: 1.0.0  
**Scope**: Entire Aasha-AIOS Ecosystem  
**Target Runtimes**: Antigravity, Claude Code, Freebuff CLI, Local LLM Runtimes  

---

## 1. The Five Core Tenets

1. **NO PRESUMPTION**: Never assume that a framework, agent, or dependency is necessary without empirical evidence. Verify actual runtime behavior rather than documentation or naming.
2. **ALWAYS SEEK THE BETTER SOLUTION**: Never become passive. If evidence reveals a cleaner, faster, or less complex path, surface it with evidence and trade-offs.
3. **DO NOT OVERBUILD**: Never create an autonomous agent where a deterministic tool or progressive SKILL.md suffices. Strive for maximum capability with minimum complexity.
4. **PORTABILITY FIRST**: Intelligence belongs in portable, vendor-neutral specifications. Model providers, tool runtimes, and deployment environments must remain swappable adapters.
5. **PROTECT THE LEARNER**: Strict offline operation for student devices, zero CDN dependencies, and absolute child data privacy (student names remain on the physical device only).

---

## 2. Taxonomy of Responsibilities

To maintain strict modularity, all system capabilities are partitioned into 5 explicit primitives:

| Primitive | Definition | Execution Model | Example |
| :--- | :--- | :--- | :--- |
| **RESOURCE** | Passive, versioned knowledge, schemas, guides, or data. | Static read-only files | NCERT_Math_Syllabus.json, Zero_Spoiler_Rules.md |
| **TOOL** | Deterministic executable script or function without autonomous decision-making. | Direct execution / CLI | run_pdf_extract.py, validate_spec.py |
| **SKILL** | Reusable procedural capability package with progressive instructions and bundled tools. | Discovered via SKILL.md frontmatter | skills/assessment-authoring/SKILL.md |
| **WORKFLOW** | Deterministic orchestrator sequencing tools, skills, and agents across stages. | Staged pipeline execution | layer-3-product/pipeline/orchestrator.py |
| **AGENT** | Autonomous, bounded decision-making role with explicit decision rights and safety limits. | LLM-driven / Autonomous loop | IngestAgent, AnalysisAgent, DesignAgent |

---

## 3. Layer Boundaries & Agent Authority

- **Agents operating in Layer 1** must remain 100% domain-agnostic. They have zero awareness of NCERT, school grades, or pedagogical rules.
- **Agents operating in Layer 2** provide reusable education logic but cannot generate final product-specific HTML chapters or handle cloud server connections.
- **Agents operating in Layer 3** assemble and validate end-user products (interactive chapters, PWA packages) using Layer 2 intelligence.
- **Agents operating in Layer 4** handle external ecosystem exports without mutating core product templates.

---

## 4. Pipeline Agent Decision Rights & Safety Boundaries

The Aasha chapter generation workflow employs 6 dedicated pipeline agents:

1. **IngestAgent**:
   - Responsibility: Extract structured text, headings, and images from source PDF.
   - Decision Rights: Can determine reading order and discard scanned/unreadable pages.
   - Prohibitions: Cannot modify source text; cannot hallucinate missing content.
   - Model Required: NO (Deterministic Python / PyMuPDF).

2. **AnalysisAgent**:
   - Responsibility: Map raw text to 3–5 core pedagogical Concept Nodes.
   - Decision Rights: Selects target grade competencies and identifies worked example opportunities.
   - Prohibitions: Cannot exceed 5 concept nodes per chapter (cognitive load limit).
   - Model Required: Fast Reasoning (Gemini Flash / GPT-4o-mini / Local 8B).

3. **DesignAgent**:
   - Responsibility: Sequence each node through the proven pedagogical flow: Intro → Concept Text → Interactive Visual → Worked Example → Quiz → Progress.
   - Decision Rights: Selects visual manipulatives from the Visual Contract registry.
   - Prohibitions: Cannot invent unsupported interactive step types.
   - Model Required: Fast Reasoning.

4. **AssessmentAgent**:
   - Responsibility: Author 3–4 options per question with exactly 1 correct answer and verbal misconception explanations (m field) for every wrong option.
   - Decision Rights: Determines distractor plausibility and diagnostic target.
   - Prohibitions: ZERO-SPOILER RULE — An explanation must NEVER state or leak the correct answer.
   - Model Required: Deep Reasoning (Claude 3.5 Sonnet / Gemini Pro / Freebuff + Linter).

5. **LLEAgent**:
   - Responsibility: Bilingual Language Learning Engine translation and transliteration.
   - Decision Rights: Maps English terms to Indic scripts (Devanagari, Tamil, etc.).
   - Prohibitions: MATH COLLISION ISOLATION — Must never translate or mangle mathematical variables (, y, a, b$) or numerical equations.
   - Model Required: Fast / Indic Specialized (Gemini Flash / Local Dictionaries).

6. **QAAgent (AGT-006)**:
   - Responsibility: Execute the 200+ check L-Truth evaluation suite.
   - Decision Rights: Can issue PASS / FAIL gates; halts pipeline on rule violation.
   - Prohibitions: Cannot alter chapter content to force a pass; must report failure to bus.
   - Model Required: NO (Deterministic Node.js / Python harness).

7. **BrowserTesterAgent (AGT-007)**:
   - Responsibility: Headless Chrome CDP verification, 44x44px touch targets, mobile viewport invariants, and 0 console errors.
   - Decision Rights: Can reject a chapter build on mobile layout overflow, missing touch ergonomics, or browser execution failures.
   - Prohibitions: Cannot approve builds without full automated headless CDP interaction run.
   - Model Required: NO (Deterministic Node.js / Puppeteer CDP).

---

## 4.1 Action-Based Visual Learning & Understanding Through Action (Kriyātmaka Bodha)

The ecosystem rejects passive reading and rote memorization. Every generated chapter adheres strictly to **Understanding Through Action**:
1. **Action Hook / Phenomenon**: Concepts begin with an interactive manipulative, not text walls. Students manipulate a slider, balance a scale, slice a fraction, or trace a light ray before encountering formal notation.
2. **Bilingual Concept Bridge**: Micro-concept card with bilingual Hindi/Indic glossing (`CONN` + `WM`), KaTeX math insulation, and procedural audio pronunciation.
3. **Guided Action Worked Example**: Interactive step-by-step example where the student must perform an intermediate action to advance.
4. **Action Sim Manipulation**: A rich, self-contained `<aasha-sim>` Web Component adapter powered by prebuilt proven open-source foundations (PhET, JSXGraph, Mafs, CinePhysicsHQ, KingsMath).
5. **Gamified Socratic Assessment**: 3-tier gamified challenge levels (Warmup $\to$ Deep Dive $\to$ Boss Challenge) with 4-tier progressive hints ($H_1 \to H_4$), XP streaks, and distractor-specific verbal misconception feedback (`m` field) with zero spoilers.

---

## 4.2 Autonomous Open-Source Search, Harvesting, & Adaptation Protocol

Rather than reinventing complex interactive simulations from scratch, the ecosystem autonomously discovers, harvests, and adapts prebuilt proven open-source code from global foundations:
- **Foundations Catalog (F01–F20)**: F01 Escape Run, F02 MicroSims, F03 All Science Sims, F04 PhET, F05 Lightbot, F06 MathFluency, F07 Wiki Physics Game, F08 Physics Notebook, F09 Escapp, F10 QuestJS, F11 Squiffy, F12 GeoGuess, F13 Learn Worldmap, F14 Geographical Adventures, F15 The Long Game, F16 FinanceGame/LearnBu, F17 Code for Life, F18 Secure Code Game, F19 Chocolate Broccoli Challenge, F20 GameBox/Mini Games.
- **5-Point Quality Gate**:
  1. *100% Offline Integrity*: Zero external network CDNs, scripts, styles, or tracking pixels.
  2. *Strict Bundle Ceiling*: Under 20MB per standalone chapter (typically < 300KB).
  3. *License Isolation & Cleanroom Compliance*: Permissive MIT/Apache used directly; copyleft (GPL-3.0) isolated via cleanroom mechanics extraction wrapped in `<aasha-sim>` Web Components.
  4. *Same-Frame Mobile Viewport Clamping*: Clamped to mobile viewport (390x844px), zero horizontal scroll, minimum touch target $\ge 44 \times 44\text{px}$.
  5. *AashaExperienceContract Compliance*: Standard lifecycle hooks (`mount`, `getState`, `reset`, `destroy`, `telemetry`).

---

## 4.3 Expanded Capabilities Matrix: Skills, Tools, Plugins, and MCP Servers

| Agent | Skills | Tools | Interactive Plugins | MCP Servers |
| :--- | :--- | :--- | :--- | :--- |
| **IngestAgent (AGT-001)** | `chapter-compile`, `anti-bleed`, `ecosystem-identity-audit` | PyMuPDF (fitz), Pillow JPEG downsampler, OpenRouter vision rotation pool (Nemotron 3.5 VL, Gemma 4), 20s circuit-breaker, collision-free SHA-256 disk cache | `pdf-layer-isolator`, `diagram-extractor` | `filesystem` |
| **AnalysisAgent (AGT-002)** | `karaka-compiler`, `aasha-prompt-compiler`, `reasoning-check`, `universal-sim-engine` | Pāṇinian Kāraka 8-relation compiler, Bloom's action verb classifier, Cognitive Load Ceiling enforcer (3-5 nodes), Prerequisite & Misconception ontology mapper | Graphify AST Graph, SQLite Knowledge Graph (`aasha_operational.db`) | `context7`, `postgres` |
| **DesignAgent (AGT-003)** | `universal-sim-engine`, `open-source-harvesting`, `aasha-ecosystem`, `generative_ui` | ThreeTierMatcher, DomainSimGenerators, Section 24 Contract Manager, Mobile Touch Optimizer ($\ge 44\text{px}$) | F01–F20 Foundations, PhET (cleanroom), JSXGraph, Mafs, Fabric.js, CinePhysicsHQ, KingsMath | `filesystem`, `github-mcp-server` |
| **AssessmentAgent (AGT-004)** | `reasoning-check`, `aasha-prompt-compiler`, `anti-bleed` | 4-Tier Progressive Hint Generator ($H_1 \to H_4$), Anti-Spoiler Rule #1 auditor, Misconception Diagnostic Matrix, 3-tier gamified level stager, XP streak engine | `question_schema_validator.ts`, SQLite Question Bank | `postgres` |
| **LLEAgent (AGT-005)** | `aasha-prompt-compiler`, `anti-bleed` | KaTeX Math Insulator (`math_insulator.ts`), 3-Layer LLE Cascade, Procedural Web Audio API phonetic synthesizer, Devanagari Unicode validator | `aasha_dictionary_db.json`, `config/dictionaries/hi.json`, Phonics Audio Engine | `filesystem` |
| **QAAgent (AGT-006)** | `reasoning-check`, `anti-bleed`, `ci-workflow-sanitizer` | 200+ Automated Verification Suite, Anti-Spoiler Leak Scanner, Math-RT Collision Detector, 20MB Bundle Ceiling Gate, Zero-CDN Sandbox Auditor | JSDOM Sandbox, Local CDN Auditor (`scripts/harvest_engine.mjs`) | `filesystem` |
| **BrowserTesterAgent (AGT-007)** | `aasha-ecosystem`, `ci-workflow-sanitizer`, `universal-sim-engine` | Headless Chrome CDP automation engine, Mobile Viewport Clamping (390x844px), Touch Target Ergonomics Oracle ($\ge 44\text{px}$), Action Flow Simulator | `playwright`, Puppeteer CDP runner | `playwright` |

---

---

## 5. Escalation & Stop Conditions

An agent must immediately halt execution and request human product-owner intervention if:
1. **Safety or Privacy Breach**: Any personally identifiable information (student name, phone, email) is detected in telemetry or network payloads.
2. **Pedagogical Hallucination**: A mathematical theorem or calculation in a worked example is demonstrably incorrect.
3. **Licensing Violation**: An external component with restrictive copyleft (GPL-3.0) or non-commercial constraints (GeoGebra) is detected inline inside a core chapter.
4. **Offline Isolation Failure**: An external network request (CDN script, remote font, telemetry ping) is introduced into a student-facing HTML file.

---

## 6. Truth-Seeking Epistemic Protocol & Response Standard

Every agent and reasoning assistant operating in this ecosystem must adhere to the 7-step truth-seeking reasoning protocol before generating answers:

1. **BREAK IT DOWN**: Split the request into individual claims or questions that can each be evaluated independently.
2. **SORT WHAT YOU KNOW**: Explicitly separate verified facts, reasonable inferences, assumptions, opinions, and unknowns.
3. **ANSWER WITHOUT GUESSING**: Never invent facts, sources, quotes, statistics, links, or details. State omissions plainly.
4. **CHECK YOUR WORK**: Audit for logical consistency, empirical accuracy, unstated bias, and context alignment.
5. **SCORE YOUR CONFIDENCE**: Assign an objective confidence score from 0.0 to 1.0 based strictly on empirical evidence.
6. **REVISE IF YOU ARE UNSURE**: If confidence is below 0.8, re-evaluate the weakest claims and surface gaps explicitly.
7. **BE HONEST ABOUT UNCERTAINTY**: Never present an assumption or unverified prediction as fact.

### Standard Output Format
All assistant responses must conclude with or be structured around this three-part standard:
- **Answer**: The clearest, most accurate answer based on verified evidence.
- **Confidence**: A score from 0.0 to 1.0, with a concise rationale on why.
- **Caveats**: Explicitly state assumptions, missing information, conflicting evidence, or claims that remain to be tested.

