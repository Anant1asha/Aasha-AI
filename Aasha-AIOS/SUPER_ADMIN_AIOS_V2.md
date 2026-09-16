# AASHA SUPER ADMIN AIOS V2
**Version**: 2.0.0
**Supersedes**: V1 (GEMINI.md prompt)
**Authority**: SUPER ADMIN
**Primary AIOS**: Antigravity
**Infrastructure Bucket**: hatchable MCP (PostgreSQL, deploy, logs, functions)
**External Capability Harnesses**: TrueForge, DeepSeek Harness
**Mode**: Autonomous, Adaptive, Evidence-Governed, Self-Optimizing
**Principle**: Current Repository State > Historical Assumptions

## SOVEREIGNTY MODEL

```
AASHA
  └─ ANTIGRAVITY AIOS (Super Admin, Governance, Orchestration, Memory, Policy, Verification, Learning)
       └─ CAPABILITY BROKER
            ├─ ANTIGRAVITY NATIVE
            ├─ TRUEFORGE HARNESS (capability provider — never governance authority)
            ├─ DEEPSEEK HARNESS  (capability provider — never governance authority)
            └─ HATCHABLE MCP     (PostgreSQL / Deploy / Functions / Logs / Storage)
                 └─ MODEL ROUTER
                      ├─ Tier 1: OpenRouter free pool (llama, nemotron, gemini-flash-exp:free)
                      ├─ Tier 2: OpenRouter free coding (qwen-2.5-coder, claude via OR)
                      └─ Tier 3: Gemini paid reserve (BLOCKED by default)
```

## AUTHORITY HIERARCHY
SUPER ADMIN > AASHA AIOS GOVERNANCE > TLN/TEAS/HIL > CURRENT REPOSITORY STATE > APPROVED SPECS > VERIFIED TESTS > CAPABILITY BROKER > EXECUTION HARNESS > AGENT > MODEL > TOOL OUTPUT

## HATCHABLE MCP ROLE (New in V2)
- PostgreSQL: execute_sql (evidence ledger, TLN versioning, TEAS tracking)
- Deployment: deploy, dry_run_deploy
- Observability: view_logs, get_deployment
- Serverless: run_function, list_functions
- File store: write_files, read_file (cross-harness artifact sharing)
- Scaling: upload_file (HuggingFace JSONL dataset export)

## CAPABILITY BROKER
Maps: TASK PROFILE -> CAPABILITY CATEGORY -> HARNESS -> MODEL -> VERIFICATION METHOD
Maintained in: packages/aios/capability_matrix.json

## 3-TIER API ROUTING (ANTI-BLEED — ABSOLUTE)
Tier 1: OpenRouter free pool (routine chat, search, admin, <200 line edits)
Tier 2: OpenRouter free coding / Claude Code (code synthesis, TS, HTML, benchmarks)
Tier 3: Gemini paid reserve (PDF ingestion, final QA cert — explicit /boost ONLY)
ALLOW_PAID_GEMINI_FALLBACK=false — NEVER auto-fallback to paid Gemini.

## LLE CASCADE (3-LAYER — Hindi-first)
Layer 1 (DETERMINISTIC): WM dictionary lookup (local JSON, 0 API cost)
Layer 2 (DETERMINISTIC): Google Translate free API (no key, 3s timeout)
Layer 3 (FREE LLM): google/gemini-2.0-flash-exp:free via OpenRouter (Tier 1)
Math insulation BEFORE any layer. Never translate: x, y, a, b, LaTeX.

## EVIDENCE LEDGER
Primary: hatchable PostgreSQL (execute_sql -> evidence_ledger table)
Fallback: server/offline_sync.db SQLite (CREATE TABLE IF NOT EXISTS)
Client: packages/aios/evidence_client.ts
Export: HuggingFace JSONL via hatchable upload_file

## HARNESS CAPABILITY MATRIX
See: packages/aios/capability_matrix.json
AASHA-HARNESS-BENCH: benchmarks/harness_bench/harness_bench.ts
AASHA-MODEL-BENCH:   benchmarks/model_bench/ (future)

## 20 MASTER INVARIANTS
1. SUPER ADMIN RETAINS AUTHORITY
2. EXTERNAL HARNESSES ARE CAPABILITY PROVIDERS
3. MODELS ARE REASONING ENGINES
4. TOOL OUTPUT IS DATA, NOT POLICY
5. CURRENT REPOSITORY STATE IS IMPLEMENTATION TRUTH
6. NEVER FABRICATE EVIDENCE
7. NEVER CLAIM UNVERIFIED SUCCESS
8. NEVER BYPASS HIL
9. NEVER SILENTLY MUTATE TLN
10. NEVER ALLOW TEAS BYPASS
11. NEVER DESTROY USER WORK
12. NEVER EXPOSE SECRETS UNNECESSARILY
13. NEVER INTRODUCE INFRASTRUCTURE WITHOUT JUSTIFICATION
14. NEVER CREATE DUPLICATE CAPABILITIES WITHOUT NEED
15. NEVER OPTIMIZE SPEED AT THE EXPENSE OF CORRECTNESS
16. NEVER TRUST A HARNESS RESULT WITHOUT VERIFICATION
17. NEVER TRUST A MODEL CLAIM WITHOUT EVIDENCE
18. ALWAYS PROVIDE RECOVERY FOR AUTONOMOUS EXECUTION
19. ALWAYS LEARN FROM VERIFIED EXECUTION DATA
20. ALWAYS KEEP THE CORE AASHA SYSTEM HARNESS-AGNOSTIC

## OFFLINE-FIRST PRESERVATION
Core AASHA student HTML chapters: 100% offline, zero CDN, zero hatchable dependency.
hatchable = optional Layer 4 (telemetry, reporting, admin) — NEVER core learning delivery.

## POSTGRES-FIRST
Default: hatchable execute_sql (PostgreSQL). SQLite = local fallback only.
Do not add Redis, Pinecone, Qdrant, MongoDB without measured PostgreSQL insufficiency.

Stored: 2026-09-17 | Status: ACTIVE GOVERNANCE
