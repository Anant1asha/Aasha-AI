# Agentic AI Design V2 — Multi-Agent Curriculum Transformation

Based on the `paste-1.md` specification, the pipeline extends to a 4-agent
architecture that transforms any dry textbook PDF into fully interactive,
gamified digital learning modules.

## The 4 Agents (Extended Mode)

### Agent 1: Pedagogical Analyzer & Assessment Extractor
- Extracts key learning milestones
- Classifies the subject domain (STEM, Humanities, Languages, Social Sciences)
- **Catalogs 100% of the chapter's end-of-chapter questions and in-text activities**
- Maps difficulty tiers (Recall, Conceptual, Application, Critical Thinking)

**Implementation:** `IngestAgent` (PDF extraction) + `ExerciseExtractor` (exercise
classification) + `AnalysisAgent` (concept identification via LLM)

### Agent 2: Interactive Experience Designer
- **For STEM:** Assigns dynamic simulations (JSXGraph for geometry, PhET for
  physics/chemistry, Fabric.js for biology anatomy, Scilab for numerical)
- **For Social Studies/Humanities:** Assigns interactive timelines, click-to-reveal
  maps, step-by-step cause-and-effect branching
- **For Languages/K-3:** Assigns phonics cards, word builders, picture matching

**Implementation:** `DesignAgent` + `PluginRegistry.find_best()` selects the optimal
plugin for each concept based on subject, grade, and interaction type.

### Agent 3: Gamified Assessment Architect
Converts the complete assessment list into 3 gamified levels:

- **Level 1 (Warm-up):** Rapid-fire MCQ, flashcards, image hotspots — 5 XP each
- **Level 2 (Deep Dive):** Interactive solvers with hint reveals — 10 XP each
- **Level 3 (Boss Challenge):** Multi-step branching scenarios — 20 XP each

**Scoring:** XP, mastery badges, streaks, contextual feedback for incorrect answers.

**Implementation:** `AssessmentAgent` + `ExerciseExtractor.to_assessment_level()`
maps difficulty tiers to assessment levels.

### Agent 4: Frontend Code Synthesizer
Generates production-ready, self-contained HTML5/CSS/JS incorporating:
1. **Interactive Concept Cards** — collapsible, visually distinct micro-learning modules
2. **Embedded Simulation Containers** — functional JS or responsive iframe wrappers
3. **Full Interactive Quiz System** — score trackers, retry mechanics, explanations

**Implementation:** `FrontendCodeSynthesizer` — takes outputs from Agents 1-3 and
synthesizes a complete HTML file with embedded plugin assets (CSS/JS as base64).

## Two Output Modes

The pipeline supports two output modes:

### Mode 1: v5 Engine (existing)
- Injects content into the frozen v5 engine template
- Uses the 8 placeholders (NODES, WE, WM, CONN, etc.)
- Output: v5-conformant gamified HTML with LLE (Hindi translations)
- Best for: NCERT math chapters grades 3-8 where the v5 engine is proven

### Mode 2: Full Synthesis (new)
- Generates fresh HTML5/Tailwind/JS from scratch
- Embeds plugin libraries (JSXGraph, PhET, etc.) as base64
- Supports all subjects, all grades (K-10), all boards
- 3-level gamified assessment suite
- Best for: any subject, any grade, when richer interactions are needed

## Subject Domain Classification

| Domain | Subjects | Preferred Plugins |
|--------|----------|-------------------|
| **STEM** | Math, Science, Physics, Chemistry, Biology | JSXGraph, PhET, GeoGebra, Scilab, Mafs, Virtual Lab |
| **Humanities** | Social Studies, History, Geography, Civics | Timeline, Mermaid, H5P |
| **Languages** | English, Hindi, regional languages | Phonics (K-3), Hot Potatoes, H5P |
| **Social Sciences** | EVS, Environmental Science | Fabric, Mermaid, Hot Potatoes |

## Exercise Extraction (100% Coverage)

The ExerciseExtractor parses the PDF for all exercise types:

```
NCERT Chapter PDF
  → Exercise section detected ("Exercise 1", "Try These", etc.)
  → Questions split (numbered: "1. ", "2. ", etc.)
  → Each question classified:
    - MCQ (has a/b/c/d options)
    - Numerical ("Find", "Calculate", "Solve")
    - Short answer ("What", "Why", "How")
    - Long answer ("Discuss", "Analyze", "Compare")
    - Fill in the blanks (underscores)
    - True/False
    - Match the column
  → Difficulty tier assigned (Recall → Conceptual → Application → Critical Thinking)
  → Routed to assessment level (Warm-up → Deep Dive → Boss)
```

Every exercise from the source PDF is transformed into a gamified assessment —
nothing is dropped.

## Plugin Selection Flow

```
Concept: "circuit design"
Subject: science
Grade: 9
  → Profile: STEM, preferred plugins: [phet, vlab, fabric, mermaid]
  → Registry queries all plugins:
    - JSXGraph: can_handle? No (subject != math)
    - PhET: can_handle? Yes (circuits in SIM_CATALOG)
    - GeoGebra: can_handle? No (subject != math)
    - Virtual Lab: can_handle? Yes (circuit in LAB_CATALOG)
    - Others: No
  → Candidates: [PhET (50KB), Virtual Lab (100KB)]
  → Winner: PhET (smaller embed size)
  → render_step() produces: {"t": "phet", "sim_id": "circuit-construction-kit-dc", ...}
```
