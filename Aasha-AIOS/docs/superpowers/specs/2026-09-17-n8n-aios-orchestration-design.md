# n8n–Antigravity AIOS Orchestration Prototype Design

**Date:** 2026-09-17  
**Status:** Approved for prototype implementation  
**Scope:** Orchestration adapter only

## Goal

Validate whether n8n can reduce workflow coordination overhead for AASHA build tasks while leaving Antigravity AIOS/AGI governance, TEAS authority, HIL approval, and the existing learning system unchanged.

## Authority Model

- **Antigravity AIOS/AGI:** agent runtime, skills, bounded decision-making, governance.
- **TEAS:** learning decision authority; n8n cannot override TEAS decisions.
- **n8n:** deterministic workflow orchestrator/integration adapter only.
- **PostgreSQL:** persistent source of truth where persistence is required.
- **HIL:** required approval boundary for governed outputs.
- **AI/LLM providers:** replaceable workers; no provider becomes architectural authority.

## Prototype Flow

`Task Input → Normalize → Route → AIOS Adapter → Deterministic Validation → HIL State → Audit Result`

The prototype runs with a deterministic local AIOS mock by default. The adapter contract is intentionally replaceable by the real Antigravity endpoint/bridge later; no provider-specific API is hard-coded into the workflow.

## Non-Changes

The prototype must not modify TLN schemas, TEAS rules, catalogue authority, pedagogy, bilingual rules, RAG contracts, student privacy rules, offline learner runtime, or existing product templates.

## Safety and Governance Invariants

1. n8n may route and sequence work but cannot approve governed content.
2. AIOS remains the owner of skill/agent execution semantics.
3. Validation failures stop the success path.
4. HIL remains explicit in the state machine.
5. Student PII must never enter telemetry or workflow payloads.
6. No student-facing runtime dependency on n8n is introduced.
7. Workflow payloads use task IDs and references rather than raw student data.
8. The prototype must be removable without changing canonical AIOS behavior.

## Success Criteria

- Workflow imports into n8n without structural errors.
- A representative build task travels through every stage.
- A validation failure reaches a deterministic failure state.
- HIL state is explicit and cannot be silently bypassed.
- The AIOS adapter can be replaced without changing orchestration semantics.
- Automated contract tests detect violations of the above invariants.
