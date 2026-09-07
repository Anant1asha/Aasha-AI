# Aasha AI Ecosystem Map

This document serves as the canonical map of all open-source libraries, plugins, MCP servers, and agent skills planned and integrated into the Aasha AI repository. AI Agents must reference this map before building custom tools or overriding behaviors.

## 1. Multi-Agent System & Skills
The pipeline relies on 6 dedicated agents and 1 testing agent, enhanced by specific pedagogical skills.

| Agent | Responsibility | Injected Skill |
| --- | --- | --- |
| **IngestAgent** | PDF text/image extraction (Deterministic Python) | None |
| **AnalysisAgent** | Concept mapping & pedagogical extraction | Truth-Seeking Protocol |
| **DesignAgent** | Sequencer & visual manipulative mapping | `visual-simulation-builder` |
| **AssessmentAgent** | Quiz authoring & misconception generation | `assessment-authoring` |
| **LLEAgent** | Indic script translation (Devanagari/Tamil etc.) | `lle-translation` |
| **QAAgent** | L-Truth 200+ evaluation check (Node.js) | None |
| **BrowserTesterAgent** | Simulates headless browser testing | None |

## 2. Interaction Plugins (The 12 Manipulatives)
Instead of building custom interactives, the system injects the following open-source tools using Base64 Data URI embedding to ensure 100% offline mobile capability.

| Plugin | Use Case | Size | License |
| --- | --- | --- | --- |
| **JSXGraph** | Geometry, graphing, function plotting | ~200KB | MIT |
| **PhET** | Physics, chemistry, biology sims | ~50KB | GPL v3 |
| **GeoGebra** | Geometry, algebra, 3D | ~800KB | Non-com |
| **Mermaid.js** | Diagrams, flowcharts, timelines | ~150KB | MIT |
| **Fabric.js** | Anatomy labeling, hotspots | ~300KB | MIT |
| **H5P** | Branching scenarios, games | ~500KB | MIT |
| **Virtual Lab** | Science experiments | ~100KB | MIT |
| **Scilab** | Numerical computation | ~2MB | CeCILL |
| **Mafs** | Reactive math visualizer | ~150KB | MIT |
| **Hot Potatoes** | JQuiz, JMatch, JCloze | ~50KB | GNU GPL |
| **Phonics** | English phonics cards | ~30KB | MIT |
| **Timeline** | Social studies interactive timelines | ~40KB | MIT |

## 3. Model Context Protocol (MCP) Servers
The `.mcp.json` file configures 3 specialized Node-based MCP servers for AI agents to leverage when debugging generated HTML chapters.

1. **`a11y-debugging`** (`@modelcontextprotocol/server-accessibility`) - Used to test visual components for contrast and screen reader compliance.
2. **`chrome-devtools`** (`@modelcontextprotocol/server-puppeteer`) - Used for deep DOM inspection of generated chapters.
3. **`memory-leak-debugging`** (`@modelcontextprotocol/server-memory`) - Used to ensure Base64-heavy files do not crash low-end Android WebView instances.

## 4. Core Pipeline Dependencies
If a capability exists in these libraries, do not rewrite it from scratch.

### Python Backend (`requirements.txt`)
- **`PyMuPDF` (fitz)**: Core PDF ingestion and structural parsing.
- **`pydantic` & `jsonschema`**: Strict schema validation.
- **`tenacity`**: Exponential backoff/retry logic for LLM API calls.
- **`Flask`**: Local web UI for operator progress tracking.
- **LLM SDKs**: `openai`, `google-generativeai`, `anthropic`.

### Node.js QA Harness (`qa/package.json`)
- **`jsdom`**: Headless browser rendering to evaluate DOM structure, bounds checking, and event listeners in the generated `v5-engine-template.html` outputs.

## Principles for AI Agents
1. **Never Overbuild**: If a pedagogical need arises, check if one of the 12 interaction plugins handles it.
2. **Offline Strictness**: All dependencies must be base64-embedded inline. No CDNs.
3. **Zero Spoilers**: Assessment agents must rely on the `assessment-authoring` skill for Socratic error-handling.
