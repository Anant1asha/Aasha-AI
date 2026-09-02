# Agentic AI Design V2 — Multi-Agent Curriculum Transformation

Based on the V2 specification, the pipeline extends to a 4-agent architecture that transforms any textbook PDF into fully interactive, gamified digital learning modules.

## The 4 Agents (Extended Mode)

### Agent 1: Pedagogical Analyzer & Assessment Extractor
- Extracts key learning milestones and classifications.
- Catalogs 100% of the chapter's end-of-chapter questions and maps difficulty tiers.

### Agent 2: Interactive Experience Designer
- Selects the best interactive plugin from the Plugin Registry based on the subject and grade (e.g. JSXGraph, PhET, Timeline).

### Agent 3: Gamified Assessment Architect
- Converts assessments into 3 levels: Warm-up, Deep Dive, Boss Challenge.
- Awards XP, mastery badges, streaks, and sets up contextual hints.

### Agent 4: Frontend Code Synthesizer
- Generates production-ready, self-contained HTML5 with embedded simulation containers and interactive quiz systems.

## File-Backed Agent Bus

The entire multi-agent orchestration relies on a **File-Backed Agent Bus**. 
- Agents do not pass raw state back and forth entirely in memory.
- When an agent completes its task, it serializes its output to a JSON file in the job's `work/` directory.
- The next agent in the sequence reads from this file to begin its execution.
- This creates an immutable audit trail of the reasoning process and allows human operators to pause, inspect, edit intermediate JSON files, and resume the pipeline seamlessly without incurring duplicate LLM costs.

## `ThreadPoolExecutor` Parallel Execution

To significantly reduce generation time, the orchestrator leverages Python's `ThreadPoolExecutor` for parallel execution during multi-part synthesis tasks.
- **Batched LLM Calls:** Agent 3 (Assessment Architect) and Agent 4 (Frontend Synthesizer) frequently operate on independent lists of concepts or questions. Instead of processing them sequentially, the orchestrator dispatches these tasks to a `ThreadPoolExecutor`.
- **Parallel Chunking:** Large chapters are chunked, and multiple threads query the LLM adapter simultaneously. The orchestrator awaits the `Future` objects, reassembles the responses in the correct order, and serializes the merged output to the file-backed bus.
- **Concurrency Control:** Thread pools are bounded (e.g., `max_workers=5`) to prevent rate-limiting from the LLM provider, ensuring stable throughput.

## Subject Domain Classification

| Domain | Subjects | Preferred Plugins |
|--------|----------|-------------------|
| **STEM** | Math, Science, Physics, Chemistry, Biology | JSXGraph, PhET, GeoGebra, Scilab, Mafs, Virtual Lab |
| **Humanities** | Social Studies, History, Geography, Civics | Timeline, Mermaid, H5P |
| **Languages** | English, Hindi, regional languages | Phonics (K-3), Hot Potatoes, H5P |
| **Social Sciences** | EVS, Environmental Science | Fabric, Mermaid, Hot Potatoes |
