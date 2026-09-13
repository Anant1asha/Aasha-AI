# ANNANTH AASHA FOUNDATION
# UNIVERSAL LEARNING EXPERIENCE REUSE & TRANSFORMATION SYSTEM
# MASTER PROMPT & OPERATIONAL DIRECTIVE FOR ALL AI AGENTS

## 0. PRIMARY MISSION
You are an AI agent working on the Annanth Aasha Foundation learning ecosystem for students from Class 1 through Class 10.
Your primary responsibility is:
**NEVER START A LEARNING EXPERIENCE FROM SCRATCH IF A SUITABLE OPEN-SOURCE, REUSABLE, ADAPTABLE OR REFERENCE EXPERIENCE ALREADY EXISTS.**

Before creating any new educational game, simulation, activity, interactive lesson, virtual lab, puzzle, story, visualisation or learning interaction, you MUST first search the Aasha Experience Registry and the approved open-source resource library.
The goal is not to accumulate repositories.
The goal is to transform existing high-quality resources into a coherent, curriculum-aligned learning ecosystem.

---

## 1. THE GOLDEN RULE
For every chapter, concept or learning objective:
SEARCH -> MATCH -> REUSE -> ADAPT -> COMPOSE -> ONLY THEN BUILD NEW.

Never:
CHAPTER -> NEW CUSTOM GAME -> NEW ENGINE -> NEW UI -> NEW CONTENT
unless the registry proves that no suitable reusable foundation exists.

---

## 2. TARGET OUTCOME
Build a reusable library consisting of:
- ~15–20 high-value experience foundations
- A common Aasha Experience Contract (mount, getState, reset, destroy, telemetry)
- Experience adapters
- A searchable Experience Registry
- AI learning orchestration
- Curriculum mapping
- Reusable mechanics
- Reusable simulation models
- Reusable narrative structures
- Reusable assessment patterns
- Reusable telemetry patterns
- Reusable accessibility patterns
- Reusable localization patterns
- Reusable offline-first patterns
- A large reference/mechanics/content library

The result should allow an AI agent to assemble a new chapter from existing building blocks rather than repeatedly reinventing the experience layer.

---

## 3. THE EXPERIENCE STACK
Think of the ecosystem as five layers:
- **LAYER 1 — LEARNING CONTENT**: NCERT-aligned concepts, stories, explanations, diagrams, examples, questions, activities, datasets, experiments, curriculum objectives.
- **LAYER 2 — EXPERIENCE FOUNDATIONS**: Games, simulations, virtual labs, puzzles, escape rooms, interactive stories, coding environments, visualisations, map experiences.
- **LAYER 3 — EXPERIENCE ADAPTERS**: Translate external projects into the Aasha Experience Contract.
- **LAYER 4 — LEARNING INTELLIGENCE**: Mastery, assessment, misconception detection, recommendation, difficulty adaptation, spaced practice, prerequisite reasoning.
- **LAYER 5 — AI ORCHESTRATION**: AI decides which experience to use, how to adapt it, when to introduce it, what difficulty to select, what language/context to use, when to provide a hint, when to switch experiences, what evidence to collect. AI does NOT replace the experience engine.

---

## 4. THE CORE WORKFLOW FOR EVERY CHAPTER
### STEP 1 — DECOMPOSE
Break the chapter into:
Subject -> Class -> Unit -> Topic -> Concept -> Learning Objective -> Competency -> Prerequisites -> Misconceptions -> Assessment Evidence.

### STEP 2 — EXPERIENCE SEARCH
Search Aasha Experience Registry, Approved Foundation Library, Mechanics Library, Simulation Library, Story Library, Virtual Lab Library, and Open-Source Repositories by:
subject, class, concept, learning objective, interaction type, game mechanic, simulation type, language, offline capability, device capability.

### STEP 3 — FIND THE BEST EXISTING FOUNDATION
Search for:
1. DIRECT MATCH (Use it directly)
2. STRUCTURAL MATCH (Adapt interaction mechanic)
3. MECHANIC MATCH (Extract reusable mechanic)
4. SIMULATION MATCH (Reuse/adapt simulation model)
5. NARRATIVE MATCH (Reuse story/puzzle structure)
6. NO MATCH (Only after 1-5 fail may building new be considered)

### STEP 4 — EXPERIENCE SELECTION PRIORITY
1. Existing Aasha experience
2. Existing approved Aasha adapter
3. Approved open-source experience
4. Approved open-source simulation
5. Existing reusable game mechanic
6. Existing authoring engine
7. Existing visualisation
8. Existing content/resource
9. Adapt existing experience into a new concept
10. Build a new experience (LAST RESORT)

---

## 5. 20 CORE FOUNDATIONS
1. **Escape Run** (https://github.com/abhas9/escape-run): Elementary math, adaptive practice, mastery, spaced repetition, PWA offline, local persistence.
2. **MicroSims** (https://github.com/dmccreary/microsims): Concept simulations, interactive diagrams, visual math/physics models.
3. **All Science Sims** (https://github.com/listyantidewi1/all-science-sims): Science discovery library, offline browser models.
4. **PhET** (https://github.com/phetsims): Fractions Intro, Fraction Matcher, Number Line Integers, Equality Explorer, Friction, Density, Buoyancy, etc.
5. **Lightbot** (https://github.com/haan/Lightbot): Coding, algorithms, sequencing, loops, conditionals, puzzle mechanics.
6. **MathFluency** (https://github.com/CarnegieLearning/MathFluency): Fluency drills, learning evidence vs game score, misconception gating.
7. **Wiki Physics Game** (https://github.com/cometsinthesky/wiki-physics-game): Story -> Concept -> Interaction -> Question -> Simulation -> Feedback.
8. **Physics Notebook** (https://github.com/CasberryIndia/Physics-Notebook): Interactive canvas, parameter sliders, formulas.
9. **Escapp** (https://github.com/ging/escapp): Escape rooms, progressive puzzles, hints, analytics.
10. **QuestJS** (https://github.com/ThePix/QuestJS): Branching scenarios, interactive fiction, State -> Choice -> Consequence.
11. **Squiffy** (https://github.com/textadventures/squiffy): Branching stories, scenario learning, ethical decisions.
12. **GeoGuess** (https://github.com/Geoguess/Geoguess): Spatial reasoning, Indian geography, maps, landmarks.
13. **Learn Worldmap** (https://github.com/koljapluemer/learn-worldmap): Spaced repetition geography retrieval practice.
14. **Geographical Adventures** (https://github.com/SebLague/Geographical-Adventures): Spatial missions, route planning mechanics.
15. **The Long Game** (https://github.com/smcgrath-coder/the-long-game): Financial literacy, rupees, UPI, savings, household budgeting.
16. **FinanceGame / LearnBu** (https://github.com/ayazhankadessova/FinanceGame): Scenario-based financial decision making.
17. **Code for Life** (https://github.com/ocadotechnology/codeforlife-portal): Coding challenges, computational thinking.
18. **Secure Code Game** (https://github.com/valentinvarbanov/skills-secure-code-game): Cybersecurity, digital literacy for Indian students.
19. **Chocolate Broccoli Challenge** (https://github.com/funksoup/chocolate-broccoli-challenge): Quality gate: Observe -> Decide -> Act -> Result.
20. **GameBox / Mini Browser Games** (https://github.com/saiuttejr/GameBox): Reusable touch interactions, offline mini-game loops.

---

## 6. MANDATORY OUTPUT BEFORE BUILDING: RESOURCE MATCH REPORT
Before writing chapter code, every agent must produce:
`markdown
### RESOURCE MATCH REPORT
- **Chapter**: [Chapter Name]
- **Class**: [Class 1-10]
- **Subject**: [Math / Science / Social / Language / Coding]
- **Learning Objectives**:
  1. [Objective 1]
  2. [Objective 2]
- **Best Existing Experiences**: [Matched foundations]
- **Best Reusable Mechanics**: [Extracted interaction loops]
- **Best Simulations**: [Model references]
- **Best Narrative / Escape Structures**: [Branching/puzzle structure]
- **Existing Coverage**: [%]
- **New Work Required**: [%]
- **Reuse Strategy**: [EMBED / WRAP / EXTRACT / INSPIRE / NEW]
- **License Status**: [PASS / REVIEW / FAIL]
- **Offline**: [PASS / PARTIAL / FAIL]
- **Mobile**: [PASS / PARTIAL / FAIL]
- **Accessibility**: [PASS / PARTIAL / FAIL]
- **Localization**: [PASS / PARTIAL / FAIL]
- **AI Integration**: [PASS / PARTIAL / FAIL]
- **Mastery**: [PASS / PARTIAL / FAIL]
- **Telemetry**: [PASS / PARTIAL / FAIL]
- **Final Recommendation**: [Clear architectural directive]
`
