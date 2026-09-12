# Aasha-AI: Safe Learning With Real Impact

**An AI-powered, offline-first educational ecosystem for K-10 learning in Indian government schools, built on evidence-based outcomes, gamified assessment, and sustainable impact tracking.**

## Overview

Aasha-AI is a comprehensive, modular monorepo implementing the **Annanth Aasha Foundation** learning infrastructure. It combines:

- **Offline-First Architecture**: Full functionality without internet, progressive sync when online
- **AI-Assisted Learning**: Multi-agent system for adaptive teaching, assessment, and content generation
- **Gamified Progression**: Three-tier mastery tracking (Warm-up → Deep Dive → Boss Challenge)
- **Impact Verification**: Evidence-based rewards tied to real learning outcomes
- **Production Ready**: Designed for budget smartphones (20MB cap), K-10 curriculum alignment

---

## Repository Structure

```
Aasha-AI/
├── Aasha-AIOS/                              # Core OS Layer (4-layer architecture)
│   ├── layer-1-core/                        # Runtime, crypto, persistence
│   ├── layer-2-education/                   # Learning engines, curriculum
│   ├── layer-3-product/                     # Student app, teacher dashboard
│   └── layer-4-extensions/                  # Integrations, custom modules
│
├── Aasha-Learning-Impact-Ecosystem-v0.3/    # Monorepo Phase 0-10 roadmap
│   ├── docs/architecture/                   # Authority chain, phase gates
│   ├── packages/                            # Modular learning engines
│   ├── server/                              # Backend + sync logic
│   └── tests/                               # Phase validation tests
│
├── aasha-pipeline-with-master-json/         # Multi-Agent Chapter Generator
│   ├── aasha/                               # 4-agent orchestrator (Python)
│   ├── agents/                              # Analyze, Design, Assess, Synthesize
│   └── templates/                           # HTML5/Tailwind output
│
├── aasha-student-pwa/                       # Progressive Web App (Student)
│   ├── src/                                 # React/Vue app UI
│   └── public/                              # Offline-ready assets
│
├── agent_orchestrator.ts                    # Agent coordination layer
├── freebuff_batch_orchestrator.js           # Batch processing system
├── ncert_books.json                         # ~561KB NCERT metadata
├── PROJECT_AI_RULES.md                      # AI safety + guardrails
└── ECOSYSTEM_MAP.md                         # Dependency graph
```

---

## Key Features

### 🎓 Learning
- **NCERT-Aligned**: Full K-10 textbook integration (Math, Science, Social Studies, Languages)
- **Adaptive Difficulty**: Dynamic progression based on mastery signals
- **Interactive Content**: Embedded simulations (JSXGraph, PhET, GeoGebra, Mermaid)
- **Offline + Sync**: Learn without internet; sync progress securely when online

### 🤖 AI Capabilities
- **4-Agent Pipeline**: Orchestrated LLM workflow (Analyze → Design → Assess → Synthesize)
- **PDF-to-HTML**: Automated chapter conversion from textbook PDFs
- **Multi-Subject**: STEM, Humanities, Languages, Social Sciences
- **Gamification Engine**: Auto-generates Warm-up (easy), Deep Dive (medium), Boss Challenge (hard) exercises

### 🎯 Assessment & Verification
- **3-Tier Mastery Tracking**: TEAS (Tracked Evidence-based Assessment System)
- **Manual Verification**: Intentional teacher-in-the-loop for reward authority
- **Impact Data**: Exportable evidence for foundation impact reporting
- **No AI Ownership**: AI assists learning; teachers verify mastery and progression

### 📱 Product
- **Mobile-First PWA**: Works on budget Android/iOS (480px, 20MB total)
- **Offline Capable**: Full functionality without server connectivity
- **Progressive Enhancement**: Core works offline; enhancements sync when online
- **Teacher Dashboard**: Class progress, student profiles, intervention tracking

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+ (for pipeline)
- 2GB+ disk space (for NCERT corpus)

### Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/Anant1asha/Aasha-AI.git
   cd Aasha-AI
   npm install
   ```

2. **Run Tests & Validation**
   ```bash
   npm test
   npm run validate
   ```

3. **Start the Student App**
   ```bash
   npm run dev:learner
   # Open http://localhost:4173
   ```

4. **Generate a Chapter (Pipeline)**
   ```bash
   cd aasha-pipeline-with-master-json
   pip install -e ".[dev]"
   python -m aasha.cli --pdf path/to/chapter.pdf --subject math --grade 4 --mode v2
   # Or: python -m aasha.cli --web
   ```

---

## Architecture

### Four-Layer AIOS Model

```
┌─────────────────────────────────────────────────────┐
│ Layer 4: Extensions                                  │
│ (Plugins, integrations, custom adapters)             │
├─────────────────────────────────────────────────────┤
│ Layer 3: Product                                     │
│ (Student app, teacher dashboard, APIs)               │
├─────────────────────────────────────────────────────┤
│ Layer 2: Education                                   │
│ (Learning engines, assessment, curriculum)           │
├─────────────────────────────────────────────────────┤
│ Layer 1: Core                                        │
│ (Runtime, persistence, crypto, sync)                 │
└─────────────────────────────────────────────────────┘
```

### Phase Roadmap (Phase 0 → 10)

| Phase | Focus | Status |
|-------|-------|--------|
| 0 | Contracts + runtime foundation | ✅ Active |
| 1 | Reusable learning engines | 🚧 In Progress |
| 2 | Assessment + TEAS | 🚧 In Progress |
| 3 | Visuals + simulations | 🔄 Planned |
| 4 | Rewards + impact | 🔄 Planned |
| 5 | Content factory | 🔄 Planned |
| 6 | Offline/cloud sync | 🔄 Planned |
| 7 | API + governance | 🔄 Planned |
| 8 | Teacher/admin ops | 🔄 Planned |
| 9 | Public impact ecosystem | 🔄 Planned |
| 10 | Scale + production hardening | 🔄 Planned |

Every phase includes: **code** + **adapters** + **tests** + **documentation**.

---

## Documentation

| Resource | Purpose |
|----------|---------|
| `docs/architecture/monorepo.md` | Repo organization and dependency rules |
| `docs/architecture/authority-chain.md` | AI ownership boundaries (AI assists; teachers verify) |
| `docs/operations/phase-gates.md` | Phase validation criteria |
| `PROJECT_AI_RULES.md` | AI safety + guardrails for this project |
| `ECOSYSTEM_MAP.md` | Service dependency graph |
| `Aasha_MVP_6_Documents.md` | Complete MVP specification |

---

## Language Composition

```
HTML:     97.8%  (Interactive learning chapters, UI)
Python:    1.5%  (Pipeline orchestration, data processing)
TypeScript/JS: (Agent coordination, offline sync, build)
```

**Note**: High HTML % reflects the content-first, offline-first design where learning materials are pre-rendered and embedded.

---

## Key Files & Tools

- **agent_orchestrator.ts**: Multi-agent coordination (LLM workflow management)
- **freebuff_batch_orchestrator.js**: Batch processing (chapter generation, bulk updates)
- **ncert_books.json**: NCERT curriculum metadata (~561KB, all K-10 books)
- **fetch_ncert.py**, **find_books.py**: Data pipeline utilities
- **openrouter.ts**: LLM provider abstraction (supports multiple models)
- **qa_ltruth_benchmark.js**: Quality assurance + learning truth validation

---

## Contributing

### Guidelines
1. **Phase-aware development**: Ensure changes respect phase authority (see `phase-gates.md`)
2. **Offline-first testing**: All features must function without internet
3. **Size-conscious**: Keep bundle impact under 20MB total
4. **Teacher verification**: AI assists, but never owns mastery/progression/rewards
5. **Evidence-based**: All claims tied to interaction logs and mastery signals

### Workflow
```bash
# Branch from phase-specific branch
git checkout -b feature/phase-X-feature-name

# Run tests & validation
npm test && npm run validate

# Submit PR with phase reference
# (e.g., "Phase 2: Adds TEAS mastery tracking")
```

---

## Safety & Governance

- **AI Guardrails**: See `PROJECT_AI_RULES.md`
- **Authority Chain**: Teachers verify; AI recommends (see `authority-chain.md`)
- **Data Privacy**: All student data remains on-device by default; sync is encrypted
- **Offline Integrity**: Core learning always available, no AI dependency for progression

---

## Support & Community

- **Issues**: Report bugs or request features via [GitHub Issues](https://github.com/Anant1asha/Aasha-AI/issues)
- **Foundation**: [Annanth Aasha Foundation](https://aashabhaarat.org/) (example)
- **Documentation**: See `docs/` directory for architecture, operations, and phase details

---

## License

This project is licensed under the MIT License (see `LICENSE` file).

---

## Vision

Aasha-AI envisions **safe, equitable, offline-first learning** for students in rural and under-resourced Indian schools. Every feature prioritizes:

1. **Learning First**: Technology serves pedagogy, not the reverse
2. **Agency**: Teachers make decisions; AI provides evidence
3. **Equity**: Works on budget hardware, no constant connectivity required
4. **Transparency**: All AI interactions logged and auditable
5. **Impact**: Real, measurable outcomes tied to student mastery

---

**Status**: Active development | **Phase**: 0-2 | **Last Updated**: September 2026

For detailed architecture, see [Aasha-Learning-Impact-Ecosystem-v0.3-full-repo/README.md](./Aasha-Learning-Impact-Ecosystem-v0.3-full-repo/README.md)
