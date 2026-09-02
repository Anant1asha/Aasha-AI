# Complete Modular Monorepo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Aasha Learning + Impact Ecosystem as one modular monorepo from offline learning foundation through production-scale impact operations.

**Architecture:** Data-driven content feeds reusable learning, assessment, simulation, reward and impact engines. Offline event logs are the source of local continuity; cloud services synchronize and coordinate rather than gate learning.

**Tech Stack:** Node.js 20+, ESM JavaScript, Web Components/browser APIs, native Node HTTP, JSON/SQL schema artifacts, provider adapters, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-03-complete-monorepo-design.md`

## Global Constraints
- Phase-0 Constitution v1.1 is authoritative.
- Learner scope is Class 1–10.
- Offline learning is primary; backend is not required for core learning.
- AI cannot determine mastery or progression.
- Beta verification is manual and rewards are lower priority than learning validation.
- No uncontrolled child social/chat experience.
- Prefer reusable engines and open-source/resource adapters before custom builds.

---

### Task 1: Repository and contracts
Files: package manifests, shared types, content schema, phase docs. Tests: structure and schema tests.

### Task 2: TLN, learner runtime, bilingual layer
Files: `packages/tln-engine`, `packages/content-schema`, `packages/learner-profile`, learner app. Tests: node ordering, stage adaptation, profile persistence.

### Task 3: Question, assessment and TEAS engines
Files: `packages/question-engine`, `packages/assessment-engine`, `packages/teas-engine`. Tests: deterministic mastery, misconception signals, progression authority.

### Task 4: Games, visuals and simulations
Files: `packages/game-engine`, `packages/visual-engine`, `packages/simulation-runtime`, adapters under `simulations/`. Tests: game/assessment separation and offline simulation manifest validation.

### Task 5: Rewards and impact
Files: `packages/reward-engine`, `packages/impact-engine`, `packages/analytics`. Tests: idempotency, manual verification, aggregate reporting.

### Task 6: Content factory and asset governance
Files: `services/content-pipeline`, `packages/asset-registry`, `packages/ai-governance`. Tests: provenance, license state, generated-content approval rules.

### Task 7: Offline sync + backend services
Files: `packages/offline-sync`, `services/api`, `services/sync-worker`, database schemas. Tests: idempotency, conflict handling, authorization boundaries.

### Task 8: Teacher/admin/public apps
Files: `apps/teacher-console`, `apps/admin-console`, `apps/public-web`. Tests: aggregate-only donor/public data, role checks.

### Task 9: Infrastructure, CI and production hardening
Files: deployment adapters, CI workflows, monitoring docs, end-to-end test harness. Tests: full suite, smoke tests, accessibility checks, build reproducibility.

### Task 10: Full integration gate
Run all tests, build content, seed sample data, start learner/API services and verify the complete vertical slice end-to-end.
