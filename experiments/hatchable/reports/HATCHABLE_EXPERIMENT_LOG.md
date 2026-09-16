# HATCHABLE EXPERIMENT LOG
**Ecosystem**: Aasha-AIOS  
**Target Repository**: `Anant1asha/Aasha-AI`  
**Branch**: `experiment/hatchable-resource-evaluation`  
**Baseline Commit**: `6b9799f`  
**Date**: 2026-09-17  

---

## Experiment 1 — Database Compatibility (EXP-DB-01)
- **Date**: 2026-09-17
- **Commit**: `6b9799f`
- **Baseline**: `database/schema.sql` (5 tables: learners, learning_events, content_versions, reward_ledger, audit_log).
- **Action**: Provisioned PostgreSQL RDS on Hatchable (`proj_wDCbCrGwuVqy`), executed full DDL, tested CHECK constraint, tested JSONB expression index, tested primary key idempotency on reward ledger.
- **Result**: PASS. All tables, constraints, and JSONB queries executed flawlessly.
- **Metrics**: DDL latency ~165ms; query latency 17ms (PK lookup), 22ms (JSONB lookup), 29ms (aggregate).
- **Failures**: Initial CHECK test failed with expected check constraint violation (intentional verification).
- **Repairs**: None required.
- **Final Status**: **PASS**

---

## Experiment 2 — API Compatibility (EXP-API-02)
- **Date**: 2026-09-17
- **Commit**: `6b9799f`
- **Baseline**: `services/api/src/server.js` (Node.js http server handling `/health`, `/events`, `/impact`, `/chapters`).
- **Action**: Scaffolded 4 endpoints under `api/*.js` in V8 isolate. Tested GET and POST methods, JSON payloads, and error handlers.
- **Result**: PASS. All routes returned valid status codes matching canonical Aasha schemas.
- **Metrics**: Cold start 56ms; warm response 11ms (`/health`), 11ms (`/chapters`), 18ms (`/events`), 24ms (`/impact`).
- **Failures**: None.
- **Repairs**: None.
- **Final Status**: **PASS**

---

## Experiment 3 — Authentication & Roles (EXP-AUTH-03)
- **Date**: 2026-09-17
- **Commit**: `6b9799f`
- **Baseline**: `services/api/src/auth.js` (Role matrix: learner, teacher, admin, verifier).
- **Action**: Implemented `api/roles/check.js`. Tested 5 role permission permutations and collaborator edge-gating.
- **Result**: PASS. Role matrix enforced with 100% precision.
- **Metrics**: Gate execution time 4–11ms.
- **Failures**: None.
- **Repairs**: Path had to avoid reserved route `/api/auth/*` -> mapped to `/api/roles/check.js`.
- **Final Status**: **PASS_WITH_CONSTRAINTS** (Applicable to staff/donors only; students must remain anonymous local).

---

## Experiment 4 — Object Storage (EXP-STR-04)
- **Date**: 2026-09-17
- **Commit**: `6b9799f`
- **Baseline**: Local filesystem assets / inline Base64 data.
- **Action**: Deployed `api/storage/test.js` to execute `storage.put()`, `storage.get()`, and `storage.del()` using non-sensitive test manifest.
- **Result**: PASS_WITH_CONSTRAINTS. Storage works via AWS S3, but returned buffer is a Uint8Array, not a Node Buffer, and URLs have 1-hour expiration.
- **Metrics**: Put: 148ms, Get: 62ms, Del: 33ms. Total lifecycle: 243ms.
- **Failures**: Initial `JSON.parse(fetched.buffer.toString('utf8'))` threw unexpected character error because `fetched.buffer` was serialized as ASCII array.
- **Repairs**: Instrumented test to handle raw byte arrays.
- **Final Status**: **PASS_WITH_CONSTRAINTS** (Viable for cloud backups only; fails offline learner gate).

---

## Experiment 5 — Secrets Security (EXP-SEC-05)
- **Date**: 2026-09-17
- **Commit**: `6b9799f`
- **Baseline**: `.env` file with `ALLOW_PAID_GEMINI_FALLBACK=false` zero-bleed invariant.
- **Action**: Deployed `/api/secrets/test` to inspect isolate `process.env` for token leaks.
- **Result**: PASS_WITH_CONSTRAINTS. User secrets are protected (not leaked), but platform infrastructure tokens are present in `process.env`.
- **Metrics**: 11 env vars detected; 4 platform tokens present; 0 Aasha user secrets exposed.
- **Failures**: None.
- **Repairs**: None.
- **Final Status**: **PASS_WITH_CONSTRAINTS**

---

## Experiment 6 — Scheduled Execution (EXP-SCHED-06)
- **Date**: 2026-09-17
- **Commit**: `6b9799f`
- **Baseline**: Manual cron / `setInterval` in background Node process.
- **Action**: Deployed `api/scheduled/health-check.js` with `export const access = "scheduler"` and `schedule = "0 9 * * *"`. Tested edge 404 block for public and verified task in `list_cron_jobs`.
- **Result**: PASS. Task registered as ID 196440; edge returns 404 to external HTTP; scheduler runs in 10ms.
- **Metrics**: 10ms execution; 0 external exposure.
- **Failures**: None.
- **Repairs**: None.
- **Final Status**: **PASS**

---

## Experiment 7 — End-to-End Adapter & Privacy Gate (EXP-E2E-07)
- **Date**: 2026-09-17
- **Commit**: `6b9799f`
- **Baseline**: Canonical tests pass 21/21; L-Truth 100/100.
- **Action**: Implemented `HatchableSyncAdapter.ts` and test suite `adapter.test.ts`. Tested local PII intercept, clean batch transmission to remote Hatchable endpoint, and aggregate impact fetch.
- **Result**: PASS. 2 clean events ingested; 1 dirty PII event intercepted and dropped locally; impact metrics fetched. Canonical tests re-verified (21/21 passing).
- **Metrics**: 2/2 clean events synced; 1/1 PII events dropped; 0 canonical tests broken.
- **Failures**: Initial unauthenticated fetch rejected by Hatchable personal visibility wall.
- **Repairs**: Adapter updated to accept collaborator bearer token for private tier projects.
- **Final Status**: **PASS**
