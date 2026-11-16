# n8n–Antigravity AIOS Orchestration Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a removable n8n orchestration prototype that coordinates a bounded AASHA build task through an Antigravity AIOS adapter contract without changing canonical system authority.

**Architecture:** n8n owns deterministic sequencing only. Antigravity AIOS owns agent/skill execution and governance; the prototype uses a deterministic mock adapter for offline contract testing and exposes the replacement boundary for a real AIOS bridge.

**Tech Stack:** n8n workflow JSON, JavaScript Code nodes, JSON contract fixtures, Python contract tests.

**Spec:** `Aasha-AIOS/docs/superpowers/specs/2026-09-17-n8n-aios-orchestration-design.md`

## Global Constraints

- Do not change canonical TLN, TEAS, catalogue, pedagogy, bilingual, RAG, HIL, privacy, or offline rules.
- n8n is an orchestration adapter, never the authority for learning decisions.
- AIOS remains the agent/skill governance authority.
- No student PII is permitted in workflow payloads or telemetry.
- Prototype must be removable without changing core AIOS behavior.
- Real external APIs are not required for the default test path.

---

### Task 1: Add the orchestration contract

**Files:**
- Create: `Aasha-AIOS/workflows/n8n-prototype/README.md`
- Create: `Aasha-AIOS/workflows/n8n-prototype/contracts/task-envelope.example.json`

- [ ] **Step 1:** Define the task envelope with `task_id`, `task_type`, `source_ref`, `skill_ref`, `requires_hil`, and `payload_ref` only; explicitly prohibit names, phone numbers, emails, or raw student records.
- [ ] **Step 2:** Document adapter semantics: `submit → execute → validate → return state`.
- [ ] **Step 3:** Document replacement boundary between deterministic mock and real Antigravity AIOS bridge.
- [ ] **Step 4:** Commit with message `feat: add n8n AIOS orchestration contract`.

### Task 2: Build the n8n workflow

**Files:**
- Create: `Aasha-AIOS/workflows/n8n-prototype/AASHA-n8n-AIOS-Orchestrator-PROTOTYPE.json`

- [ ] **Step 1:** Add a manual trigger for deterministic local testing.
- [ ] **Step 2:** Normalize the task envelope and reject PII-like fields.
- [ ] **Step 3:** Route only approved task types to the AIOS adapter.
- [ ] **Step 4:** Execute the deterministic mock AIOS adapter using the same response shape expected from the real bridge.
- [ ] **Step 5:** Run a deterministic validation gate.
- [ ] **Step 6:** Set explicit `HIL_REQUIRED`, `PASS`, or `FAIL` state; never auto-approve HIL-required work.
- [ ] **Step 7:** Emit an audit-safe result containing IDs, status, timing fields, and validation codes only.
- [ ] **Step 8:** Commit with message `feat: add n8n AIOS orchestrator prototype`.

### Task 3: Add contract tests

**Files:**
- Create: `Aasha-AIOS/workflows/n8n-prototype/tests/test_orchestrator_contract.py`
- Create: `Aasha-AIOS/workflows/n8n-prototype/tests/fixtures/valid_task.json`
- Create: `Aasha-AIOS/workflows/n8n-prototype/tests/fixtures/pii_task.json`

- [ ] **Step 1:** Test workflow JSON parses and contains the required stages.
- [ ] **Step 2:** Test the valid envelope contains no forbidden PII fields.
- [ ] **Step 3:** Test the PII fixture is rejected by the contract.
- [ ] **Step 4:** Test HIL-required tasks cannot transition directly to approved.
- [ ] **Step 5:** Test validation failure is terminal for the success path.
- [ ] **Step 6:** Run the full contract test suite.
- [ ] **Step 7:** Commit with message `test: certify n8n AIOS orchestration contract`.

### Task 4: Integration handoff documentation

**Files:**
- Modify: `Aasha-AIOS/workflows/n8n-prototype/README.md`

- [ ] **Step 1:** Document the real AIOS bridge as an adapter, not a new authority.
- [ ] **Step 2:** Document required request/response fields and correlation ID behavior.
- [ ] **Step 3:** Document deployment/test commands and expected states.
- [ ] **Step 4:** Record prototype limitations: n8n runtime and real Antigravity bridge are not exercised by repository-only contract tests.
- [ ] **Step 5:** Commit with message `docs: document n8n AIOS integration boundary`.
