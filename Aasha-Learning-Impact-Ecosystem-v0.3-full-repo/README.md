# Annanth Aasha Foundation — Learning + Impact Ecosystem

A single modular monorepo for the complete Aasha journey from offline school-book-first learning through assessment, evidence, impact, teacher/admin operations and future scale.

## Authority
- Phase-0 Constitution **v1.1** is authoritative.
- Learner scope is **Class 1–10**.
- Learning remains usable without internet.
- AI assists; it does not own mastery, progression, verification or reward authority.
- Beta reward verification is manual at the Annanth Aasha Foundation centre and is intentionally lower priority than learning validation.

## Phase map
0. Contracts + runtime foundation
1. Reusable learning engines
2. Assessment + TEAS
3. Visuals + simulations + asset reuse
4. Rewards + impact
5. Content factory
6. Offline/cloud sync
7. API + governance
8. Teacher/admin operations
9. Public impact ecosystem
10. Scale + production hardening

Every phase is represented by code, adapters, tests and documentation. External production services are isolated behind provider interfaces so the core remains runnable locally and offline.

## Run
```bash
npm test
npm run validate
npm run dev:learner
```
Open `http://localhost:4173`.

## Repo rules
See `docs/architecture/monorepo.md`, `docs/architecture/authority-chain.md`, and `docs/operations/phase-gates.md`.
