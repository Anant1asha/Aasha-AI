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
├── packages/                                # Canonical V6 & AIOS Execution Architecture
│   ├── v6-engine/                           # High-production V6 single-file HTML compiler
│   ├── canonical-ir/                        # Canonical IR schema & assembler
│   ├── aios/                                # Trust authority, version manager, evidence client
│   └── adapters/                            # Prebuilt foundation & domain sim adapters
│
├── Aasha-AIOS/                              # Core AIOS Layer
│   ├── layer-1-core/                        # Runtime bus, LLM adapter
│   ├── layer-2-education/                   # LLE Indic dictionaries, misconceptions, visual contracts
│   ├── layer-3-product/                     # Product pipeline bridge & single-file templates
│   └── skills/                              # Specialized agent skills
│
├── Aasha-Learning-Impact-Ecosystem-v0.3-full-repo/ # Micro-packages & Services
│   ├── packages/                            # 15 modular learning engines (assessment, teas, tln)
│   ├── services/                            # Workers (assessment, content, reporting, sync, api)
│   └── apps/learner-web/                    # Student PWA runtime
│
├── aasha-pipeline-with-master-json/         # Deterministic PDF Harvester
│   ├── src/aasha/                           # Python PyMuPDF extractor & CLI
│   └── schema/                              # Chapter JSON validation schemas
│
├── content/contracts/                       # Section 24 YAML Reusable Content Contracts
├── experience_registry/                     # F01-F20 Prebuilt foundation catalog & bilingual DB
├── benchmarks/                              # L-Truth 100/100 anti-spoiler QA benchmarks
├── admin_memory_cli.ts                      # Super Admin unified operational CLI
├── agent_orchestrator.ts                    # Multi-agent coordination layer
└── ECOSYSTEM_MAP.md                         # Architecture dependency graph
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

3. **Start the Student App or Local API**
   ```bash
   npm run dev:learner
   # Or run local event ingestion API:
   npm run dev:api
   ```

4. **Super Admin CLI & Chapter Compilation (V6 Engine)**
   ```bash
   # Prime local memory & check status
   npm run admin:status

   # Initialize Section 24 contract with prebuilt foundation matching
   npm run chapter:init -- "Mathematics" 8 "Exponents and Powers"

   # Compile canonical V6 single-file HTML bundle
   npm run build:chapter

   # Run 100/100 L-Truth Anti-Spoiler verification
   npm run test:ltruth
   ```

5. **Textbook PDF Harvester (Deterministic PyMuPDF Pipeline)**
   ```bash
   cd aasha-pipeline-with-master-json
   pip install -e ".[dev]"
   python -m aasha.cli --pdf path/to/chapter.pdf --subject math --grade 4 --mode v2
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
