# Repair and Harden the Existing AASHA Chapter Builder

**Status:** Revised draft for product-owner review
**Date:** 2026-10-04
**Scope:** AIOS/LLM ecosystem design; no implementation authorized by this document

## 1. Product goal

Repair and improve the **existing AASHA chapter-building system** so it can reliably complete a source-grounded chapter build. Do not replace the existing system, start a parallel pipeline, or rebuild existing capabilities from scratch. Begin by identifying and reproducing the failing path, then fix the verified root cause with the smallest safe changes to the current implementation.

The existing system should ultimately produce two independent, self-contained HTML artifacts for each requested chapter:

1. A visual learning experience that develops understanding through explanation, animation, simulation, and learner action.
2. A separate gamified assessment experience that measures learning through source-grounded questions, hints, feedback, and age-appropriate game mechanics.

The repaired system must continue to support different subjects and chapters through its existing extensible capabilities. It should select capabilities according to the task, reuse resources only when their compatibility and provenance are supported by evidence, and use prior build experience only after verification and human approval. English and Hindi are the initial LLE languages. Local-only and hosted-admin operating modes are in scope. Student artifacts must work offline without accounts or runtime network access. Preserve existing interfaces, useful chapter content, and in-progress work unless evidence shows a specific element is the root cause and the owner approves a bounded change.

## 2. Confirmed product decisions

- Repair and extend the existing source-grounded pipeline; do not create a replacement or parallel pipeline.
- Both teachers and AASHA administrators use the workspace with role-appropriate permissions.
- The system supports a local-only mode and a separately hosted admin mode.
- Initial LLE support is English and Hindi. Additional languages are future expansion.
- Each chapter produces two separately usable HTML files. The files do not link to each other.
- Generated student HTML is offline-first and does not depend on hosted admin services.
- TEAS retains learning/mastery decision authority. Telemetry cannot directly mutate mastery.
- Registry promotion and certification require evidence and authenticated human approval.
- Only verified, approved outcomes may become reusable positive experience memory.

## 3. Evidence baseline and constraints

The repository contains an AIOS V2 governance document, task-capability matrix, evidence ledger client, signed HIL approval schema, experience registry and matcher, memory engine, LLE and simulation skills, assessment guidance, and validation/benchmark scripts. The compatibility `chapter_pipeline_orchestrator.ts` declares itself a non-certifiable demo; this describes that entry point and does **not** establish that the other existing build paths should be replaced.

The active nested repository is on branch `aios/v2-bootstrap` and has extensive existing, uncommitted changes, including an Exponents & Powers Class 8 build script, a V6 compiler, a chapter compilation script, and generated chapter artifacts. These files are evidence that an existing build is in progress, not proof that it succeeds. Preserve all of this work. No failing command, complete error output, or reproducible failed run has yet been captured, so the root cause and authoritative failing entry point remain unknown.

The relevant guidance is inconsistent in places. AIOS V2 specifies PostgreSQL-first evidence storage, SQLite fallback, a default block on paid Gemini fallback, and offline student HTML. Older pipeline documents describe other model providers and fallback behavior. The implementation phase must first reconcile these policies against the current repository and owner decisions. Historical documentation or capability-matrix declarations alone are not runtime verification.

The parent workspace has local modifications in `.agents/skills/aasha-ecosystem/SKILL.md` and `.serena/project.yml`, while the nested Aasha repository has many user changes. All pre-existing work must be preserved. Do not run a builder that overwrites generated files until its effects and target paths are understood.

### Non-negotiable system invariants

1. Textbook-derived learning content remains traceable to source pages and, where applicable, Canonical IR identifiers. Unsupported content is marked unknown or blocked, not fabricated.
2. Learning state and telemetry remain independent. Only TEAS-authorized pedagogical transactions may update mastery.
3. Child-facing artifacts contain all required runtime assets and work without remote scripts, styles, fonts, APIs, or model calls.
4. Each standalone HTML artifact must respect the current child bundle ceiling of 20,971,520 bytes unless canonical governance changes it.
5. Reuse claims distinguish certified components, evidence-reviewed foundations, adaptation candidates, blocked resources, and no-match outcomes. Unknown is a valid result.
6. Registry promotion uses the governed promotion path, preserves versions, and requires verified evidence plus authenticated HIL approval.
7. Autonomous repair is capped at two attempts per defect class, then blocks and escalates to HIL.
8. Interactive controls meet the 44×44 px touch-target threshold and provide accessible keyboard/touch alternatives.
9. Assessment hints and misconception feedback are validated against the actual question and answer; regex checks alone are insufficient proof of no spoilers.
10. A generated artifact, benchmark report, or model statement is not proof until its evidence is independently checked.

## 4. Users and operating modes

### Teacher

- Starts a chapter job with a source PDF and task context.
- Reviews source coverage, resource matches, LLE status, previews, assessment content, and validation evidence.
- Requests a revision or submits the artifact for governed approval according to configured policy.
- Distributes the two standalone HTML files to learners.

### AASHA administrator / reviewer

- Maintains governance, capability policies, approved providers, and resource certification.
- Reviews evidence and signs scoped approval decisions for certification or promotion.
- Manages hosted operations and version rollback where applicable.

### Student

- Opens the learning HTML or assessment HTML without an account.
- Uses each artifact offline; local interaction telemetry remains separate from learning/mastery authority.

### Local-only mode

The approved workflow and evidence operate locally using the governed local persistence path. No hosted service is required for artifact use. Exact local authentication and storage configuration remain to be finalized during setup/security design.

### Hosted-admin mode

The admin workspace and evidence services may use the approved hosted infrastructure. Hosted connectivity is an operational option, not a runtime dependency for learner files. Hosting provider, identity provider, and deployment environment remain undecided.

## 5. Existing pipeline repair model and target data flow

```text
Existing PDF/build command + its current inputs and outputs
  → inspect the actual existing job/stage flow and capture the failure
  → trace source, configuration, and state through the failing boundary
  → make the smallest root-cause fix in the current implementation
  → resume the current chapter build through its existing stages
  → produce the required learning and assessment artifacts
  → validate source coverage, LLE, math, assessment, UI, and offline behavior
  → record evidence and use existing review/approval controls
  → add an approved, evidence-linked lesson to existing memory, if eligible
```

The repair must first identify the current job record and preserve its existing lifecycle. Where the current implementation already supports them, retain and verify the task identifier, source PDF hash, source/page references, Canonical IR references, selected capability IDs and versions, language and math-insulation results, output hashes, test evidence, review decisions, and final status. Add or repair evidence fields only when the reproduced failure or a required governance invariant demonstrates the need. A changed source or approved artifact creates a new immutable version rather than silently replacing an approved one.

### 5.1 Task classification

The system derives a structured task profile from user intent and verified source material. The profile may include subject, grade, board when supplied, chapter/topic, learning objectives, interaction needs, accessibility needs, language, offline constraints, device envelope, assessment scope, and allowed resource/license policy. Missing values remain explicit unknowns or are requested when they materially affect a decision.

Classification routes work to capability categories (for example, PDF extraction, math visualization, language support, simulation, assessment, or packaging). It does not allow an LLM to invent curricular authority or bypass Canonical IR/TEAS rules.

### 5.2 One capability-selection path

The first task is to trace which existing matcher the failing build actually calls and compare its behavior with the repository’s other matcher. Do not replace either path by default. A minimal reconciliation is in scope only if reproduced evidence shows inconsistent matching is a cause of the chapter-build failure and the owner approves that change. The repaired selection behavior should follow evidence and policy rather than a fixed subject-to-tool mapping:

1. Match a certified AASHA component whose current artifact hash, certification evidence, license, runtime, accessibility, and HIL approval verify.
2. Consider a foundation with documented provenance and reviewed compatibility; return it as an adaptation candidate unless its actual artifact and required gates are certified.
3. Compose or adapt only after compatibility, license, offline, and accessibility checks pass.
4. Permit AASHA-native synthesis only when the evidence-backed search returns no usable match and the task policy permits synthesis.

Every result has an explicit status: `MATCH_FOUND`, `NO_MATCH`, `BLOCKED`, or `UNKNOWN`, with evidence references, version, provenance, license, compatibility limits, and reason. A missing registry, unavailable evidence, unknown license, or failed check cannot be translated into a positive certification claim.

### 5.3 Source-grounded content

Extraction records page-level references for chapter concepts, in-text examples, activities, and exercises. A coverage report compares extracted source items with the generated learning and assessment map. The system may claim complete coverage only when source inventory and output mapping are both available and reconciled. Unreadable or ambiguous source regions are reported for human review.

Canonical IR is the curricular authority. Existing TLNs are immutable; changes create a new version. Generated experiences can implement a learning capability but cannot silently create or revise learning outcomes.

### 5.4 LLE and math protection

LLE is a core pipeline stage, applied to learner-facing explanations, interactions, instructions, and feedback in English and Hindi. Math insulation runs before vocabulary lookup or translation. Each output records language-pack/dictionary version and validation results. Unknown or ambiguous translations are surfaced for review rather than asserted as verified. Any build-time remote translation capability requires an explicit approved-provider and privacy policy; student HTML never calls it at runtime.

### 5.5 Paired learner artifacts

The learning artifact contains source-grounded explanations, visual models, simulation interactions, animation, and low-stakes checks. It cannot expose the assessment answer key.

The assessment artifact contains source-grounded questions and gamified assessment progression. Hints progress without directly revealing answers; misconception feedback diagnoses reasoning without leaking the correct choice. Each file runs independently and offline, embeds or locally packages its approved dependencies, and stays within its own applicable size limit.

### 5.6 Assessment, state, and telemetry

Student actions may produce local telemetry such as selections, hint usage, and interaction events. These events are not mastery decisions. The assessment produces evidence for TEAS; only a permitted TEAS transaction can update learning state. Failure to persist telemetry must not corrupt learner progress or mastery state.

## 6. Approved-build learning and memory

### 6.1 Evidence captured per build

For each build, the evidence record links:

- task profile and source PDF hash;
- source/page and Canonical IR references;
- chosen matcher result, component/foundation version, provenance, and license evidence;
- LLE and math-insulation version/results;
- hashes of both generated HTML files and their manifest;
- static, pedagogical, adversarial, accessibility, offline, size, and browser-test evidence;
- defects, repair attempts, unresolved caveats, and final outcome;
- scoped human reviewer identity, decision, time, and signed approval reference where certification/promotion applies.

### 6.2 Eligibility to become reusable experience

Only an artifact that passes its required quality gates, is linked to complete evidence, and receives the required authenticated human approval may create a positive reusable lesson. The memory entry stores a typed lesson and references to the evidence; it does not promote itself to Canonical IR, TEAS policy, or registry status.

Failed, blocked, or incomplete builds may be retained as **failure evidence** to prevent repeating known mistakes. They must remain labeled by status and may not be retrieved as successful patterns. Approval of one artifact does not certify unrelated components, content, or future builds.

### 6.3 Relevance-based retrieval

Retrieval filters by task class, capability, subject/grade only when relevant, language, runtime constraints, component/resource version, approval status, and evidence validity. Results return typed lesson/evidence references with confidence and limits. Stale, superseded, unverified, or mismatched lessons are excluded or clearly downgraded. Retrieval can inform a proposal but cannot override current source evidence, Canonical IR, TEAS, registry gates, or HIL decisions.

## 7. Authentication, privacy, and security

- Define separate permissions for teachers, administrators, certifiers, and automated agents.
- Bind approvals to a specific action, artifact ID, artifact hash, version, reviewer, expiry, nonce, and trusted signature.
- Keep secrets out of source control, learner artifacts, logs, and student data.
- Do not put student names or contact details in build memory or telemetry. Student identity remains local to the device where policy requires it.
- Validate and sandbox imported PDFs, external components, and generated HTML previews.
- Hosted services are optional for the learner runtime. Offline output validation must prove no remote requests are required.
- Confirm the identity provider, hosting environment, key management, and backup/retention policy before implementation.

## 8. Core UI scope

The existing teacher/admin workspace, if used by the failing flow, should be inspected and repaired in place. Do not build a new workspace as part of this repair. The required workflow should let users:

1. Job creation and PDF intake with source metadata and task profile.
2. Extraction and source-coverage review with unresolved items visible.
3. Resource match report with evidence, license, status, and reuse/adaptation rationale.
4. English/Hindi LLE coverage and math-protection review.
5. Separate learning and assessment previews.
6. Build stage, validation, repair-budget, blocked/HIL, and approval status.
7. Artifact download, version history, and authorized rollback or promotion controls.
8. Approved experience lessons with provenance and task applicability.

Learner-facing UI belongs in the generated HTML and follows the same offline, accessibility, and privacy constraints.

## 9. Phased build plan and deliverables

Implementation begins only after this revised design is reviewed, the failing path and root cause are evidenced, and the implementation plan is separately approved. Each phase has its own review gate; failure at a gate blocks downstream promotion. The phases below repair the existing system in place and preserve existing work. They do not authorize a replacement pipeline.

### Phase 0 — Preserve the existing build and reproduce its failure

**Deliverables:** clean inventory of current build entry points and in-progress changes; exact failing command, inputs, full error/logs, and output paths; traced stage-by-stage data flow; current Git baseline and preservation plan; documented policy conflicts. Do not clean, reset, overwrite, or run a builder against the active working tree. If logs are insufficient, reproduce only in a verified isolated copy/output location after confirming its inputs and write paths.
**Exit gate:** the failure is reproduced safely or sufficient logs establish the failing boundary; the existing path and affected files are identified. If not reproducible safely, request the smallest missing evidence rather than guessing.

### Phase 1 — Existing environment and configuration

**Deliverables:** verified command/runtime versions and current dependencies; actual configuration and provider routing used by the failing build; local and hosted-admin mode behavior; existing job workspace and PDF inputs/outputs; setup gaps tied to observed failures. Reuse current dependencies and configuration; no reinstall or new scaffold by default.
**Exit gate:** the existing environment can reach the reproduced failing stage without changing unrelated workspace state.

### Phase 2 — Authentication and approval authority

**Deliverables:** trace of current authentication and approval paths; verified role permissions and trusted-key configuration; only the minimal repair required for a demonstrated authorization defect. Reuse the existing signed HIL mechanisms.
**Exit gate:** automated actors cannot approve their own outputs or exceed assigned authority, and existing authorized review still works.

### Phase 3 — Database and evidence ledger

**Deliverables:** inventory and health evidence for the current database, registry, memory, and evidence ledger; trace of which store the failing build uses; data-integrity diagnosis; minimal, backward-compatible persistence repair if required. Do not introduce a new database or schema absent evidence and approval.
**Exit gate:** the current build’s state is traceable and recoverable; no learner PII is added to reusable build memory.

### Phase 4 — Core teacher/admin UI

**Deliverables:** existing UI failure trace and the smallest in-place fix; clear visibility of current job stage, source coverage, errors, LLE status, previews, and approval state where the existing UI already owns those functions. New screens are excluded unless a diagnosed user-blocking failure cannot be fixed within the existing interface.
**Exit gate:** users can complete and review the repaired existing flow with role restrictions and accessible controls.

### Phase 5 — Main pipeline features

**Deliverables:** root-cause fix for the existing chapter completion failure; retained/improved source-grounded extraction and exercise inventory; current task profile and Canonical IR traceability; repair to the existing matcher call path only if implicated; current learning and assessment generation producing the agreed two files; English/Hindi LLE and math insulation preserved or repaired.
**Exit gate:** the same existing build path completes a chapter from source PDF through both outputs, with coverage and provenance evidence. No parallel generator is introduced.

### Phase 6 — Integrations

**Deliverables:** verified integration path actually used by the current builder; compatibility repairs to existing model, registry, simulation, LLE, or storage adapters only where root-cause evidence points. Preserve approved resource contracts and licensing boundaries.
**Exit gate:** current integrations complete the chapter build or fail with a precise, recoverable diagnostic. No new integration is added without a demonstrated need.

### Phase 7 — Testing and certification

**Deliverables:** baseline reproduction evidence; targeted regression test for the diagnosed failure; relevant existing test/benchmark results; source coverage, mathematical/LLE, no-spoiler, accessibility, offline, file-size, and browser evidence for the exact outputs. Do not claim unrun checks.
**Exit gate:** the original failure is fixed, the chapter build completes, and mandatory gates pass for the output hashes; at most two repairs per defect class.

### Phase 8 — Deployment and delivery

**Deliverables:** repair release notes, existing local/hosted deployment instructions, backup and rollback steps, and versioned artifact delivery. No deployment changes unless needed for the verified fix and separately approved.
**Exit gate:** the repaired build is reproducible in the selected existing environment; release/deployment requires explicit approval.

### Phase 9 — Final polish and governed learning loop

**Deliverables:** focused polish to existing chapter workflow and output; English/Hindi review; accessibility fixes; memory curation only for approved build evidence; relevant retrieval and stale-memory handling; operator runbook. Avoid broad unrelated refactoring.
**Exit gate:** the existing system completes the intended chapter-build flow reliably, and only verified, approved lessons influence future task plans.

## 10. Acceptance criteria

The repair is eligible for release only when evidence demonstrates that:

1. The existing chapter-build path completes the reproduced failing job without requiring a replacement or parallel pipeline.
2. The repaired path continues to support different subjects and chapters through its existing extensibility.
3. Each requested chapter produces exactly two independently usable, source-traceable HTML artifacts: learning and assessment.
4. Coverage claims derive from reconciled source inventory and mapped output, not fixed template values.
5. Matching results accurately distinguish verified certification, reviewed candidates, blocked resources, no match, and unknown evidence.
6. Both artifacts work offline, make no runtime network requests, satisfy their size limits, and include no unapproved external dependencies.
7. English/Hindi LLE preserves protected math and reports missing or uncertain vocabulary honestly.
8. Assessment rules enforce one correct choice, meaningful misconception feedback, progressive hints, and no answer leakage under adversarial checks.
9. Telemetry cannot directly mutate learning/mastery state; TEAS remains authoritative.
10. Certification and registry promotion require evidence bound to the artifact hash and authenticated HIL approval.
11. Positive build memory cannot be created from unverified or unapproved output; failure evidence never becomes a successful fact.
12. Retrieval selects lessons relevant to the current task and exposes their provenance, version, status, and limits.
13. Existing user changes are preserved, repair attempts are bounded, and rollback is documented and verified.

No current benchmark score, deployment status, or end-to-end success is asserted by this design.

## 11. Open decisions before implementation

1. Which identity provider and account policy should hosted admins and teachers use? What local-only authentication is required?
2. Which hosted deployment environment is approved, and is it the same environment named in AIOS V2?
3. Which textbook boards/curricula and PDF quality profiles define the first pilot set? The system remains universal, but certification needs representative source fixtures.
4. Which model providers and build-time translation services are permitted under current cost, privacy, and anti-bleed policy?
5. What exact teacher/reviewer actions constitute required approval before a learning/assessment artifact may be distributed?
6. Are any build evidence or approved lessons allowed to sync between local and hosted modes? Default: no learner data sync; only approved, non-PII build evidence under explicit policy.
7. How should visual/animation complexity trade off against low-end device performance and the per-file size ceiling?

## 12. Explicitly out of scope for this repair

- Replacing the existing chapter pipeline or creating a parallel generator.
- Rebuilding existing UI, authentication, persistence, matcher, simulation, or LLE capabilities without a proven root cause and approved scope.
- Broad refactors unrelated to completing the existing chapter build.
- Automatic curriculum or Canonical IR mutation by an LLM.
- Automatic mastery updates from interaction telemetry.
- Student accounts or cloud identity requirements for offline HTML.
- Additional LLE languages beyond English and Hindi.
- Unreviewed external libraries or resources bundled into learner artifacts.
- Automatic paid-model fallback or self-approval of certification/promotion.
- Guaranteed “zero hallucinations”; the design instead uses provenance, explicit uncertainty, deterministic checks, independent verification, and human approval gates.

## 13. Design self-review

- **Scope:** This is a repair-and-hardening plan for the existing ecosystem, organized into gated phases; it is not a greenfield build or replacement.
- **Consistency:** Separate learner artifacts remain offline; hosted admin functions do not become runtime dependencies. TEAS, Canonical IR, signed HIL, and registry promotion retain their authority.
- **Evidence:** Existing repository mechanisms and uncommitted chapter-build work are preserved. A specific failing command and root cause remain unknown until reproduced; the fail-closed compatibility orchestrator is not treated as proof that all current build paths are unusable.
- **Open decisions:** Provider, identity, hosted deployment, first pilot sources, and review policy remain visible and are not filled with assumptions.
- **No implementation:** This document is a proposed repair design; no implementation code, installation, database mutation, chapter build, certification, or deployment has been performed.
