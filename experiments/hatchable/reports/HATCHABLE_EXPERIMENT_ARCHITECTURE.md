# HATCHABLE EXPERIMENT ARCHITECTURE
**Ecosystem**: Aasha-AIOS  
**Authority**: Aasha-AIOS Canonical Multi-Agent Governance  
**Date**: 2026-09-17  

---

## 1. System Topology Overview

```
+-----------------------------------------------------------------------------------+
|                            CANONICAL AASHA ECOSYSTEM                             |
|                                                                                   |
|  +---------------------------+       +-----------------------------------------+  |
|  |     Aasha-AIOS Core       |       |       Pedagogy & Learning Truth         |  |
|  | - AGENTS.md Multi-Agent   |       | - Section 24 YAML Curriculum Contracts  |  |
|  | - Truth-Seeking Protocol  |       | - 20+ Prebuilt Experience Foundations   |  |
|  | - Zero-Token Bleed Router |       | - 4-Tier Scaffolding & Zero Spoilers    |  |
|  | - Epistemic Memory Bus    |       | - TEAS Dual-Mastery Engine (Offline)    |  |
|  +---------------------------+       +-----------------------------------------+  |
|                |                                          |                       |
|                v                                          v                       |
|  +-----------------------------------------------------------------------------+  |
|  |                     Student Offline Learning Layer                          |  |
|  | - Standalone HTML Chapters (Fractions, Rational Numbers, Linear Equations)  |  |
|  | - Self-Contained KaTeX, SVG Manipulatives, and Canvas Engines               |  |
|  | - Zero CDN Network Dependence (HARD OFFLINE CONTRACT)                      |  |
|  | - Anonymous Physical Device Identity & IndexedDB Event Outbox               |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                         |
                                         | Sync when network available
                                         v
+-----------------------------------------------------------------------------------+
|                        EXPERIMENTAL ADAPTER BOUNDARY                              |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |         experiments/hatchable/adapters/HatchableSyncAdapter.ts               |  |
|  |  - Invariant 1: Local Event Queue is authoritative (Survives disconnect)   |  |
|  |  - Invariant 2: Automated PII Sanitizer (Intercepts studentName, email)     |  |
|  |  - Invariant 3: Clean JSON-over-HTTP Transport to Remote Ingest Endpoint     |  |
|  |  - Invariant 4: Zero Hatchable imports in canonical Aasha code               |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                         |
                                         | Authenticated HTTPS Egress (OAuth/Token)
                                         v
+-----------------------------------------------------------------------------------+
|                         EXTERNAL HATCHABLE RESOURCE                               |
|                         Project: proj_wDCbCrGwuVqy                                |
|                                                                                   |
|  +--------------------+   +--------------------+   +---------------------------+  |
|  |  V8 Isolate API    |   | PostgreSQL RDS DB  |   |   Serverless Scheduler    |  |
|  | - POST /api/events |   | - learners         |   | - 0 9 * * *               |  |
|  | - GET /api/impact  |   | - learning_events  |   | - Catalogue Health Check  |  |
|  | - GET /api/chapters|   | - reward_ledger    |   | - Auto-edge 404 security  |  |
|  | - GET /api/health  |   | - audit_log        |   |                           |  |
|  +--------------------+   +--------------------+   +---------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                      Auxiliary Storage & Secret Vault                       |  |
|  | - AWS S3 Blob Storage (Backups & PDF Ingestion Artifacts)                   |  |
|  | - hatchable.toml Declarative Secret Vault (expose = false)                  |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Layer Definitions & Invariants

### 2.1 Canonical (Protected)
- **Files**: `Aasha-AIOS/`, `packages/`, `chapters/`, `content/`, `benchmarks/`, `apps/learner-web/`.
- **Invariants**:
  1. Student device code must execute with network connection severed.
  2. Zero student PII may leave the physical device.
  3. Learning progression, cognitive misconception detection, and TEAS scores are computed client-side.
  4. L-Truth benchmark score must remain 100/100.

### 2.2 Experimental (Isolated Adapter)
- **Files**: `experiments/hatchable/adapters/`, `experiments/hatchable/tests/`, `experiments/hatchable/reports/`.
- **Invariants**:
  1. No canonical file imports anything from `experiments/hatchable/`.
  2. Adapter is strictly disposable without destabilizing the Aasha ecosystem.
  3. Git branch: `experiment/hatchable-resource-evaluation`.

### 2.3 External (Hatchable Cloud)
- **Resource**: Managed serverless isolate functions, AWS RDS PostgreSQL, AWS S3 object store, and edge routing.
- **Role**: Auxiliary backend sink for asynchronous batch syncing, educator cohort aggregation, and automated maintenance crons.
