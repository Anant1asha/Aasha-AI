# DEPLOYMENT COMPATIBILITY REPORT
**Ecosystem**: Aasha-AIOS  
**Target Resource**: Hatchable Deployment Pipeline & CDN  
**Project Ref**: `proj_wDCbCrGwuVqy`  
**Date**: 2026-09-17  
**Evaluator**: Aasha-AIOS Autonomous Engineering Agent  

---

## 1. Executive Summary
We evaluated Hatchable's zero-build deployment workflow (`write_files` -> `dry_run_deploy` -> `deploy`). Three incremental deployment versions were created, validated, and observed.

- **Deployment Speed**: 1.2s – 2.0s per deployment cycle.
- **Rollback & History**: Full manifest tracking per version number.
- **Compatibility Score**: 84%
- **Primary Classification**: `ADAPT` (for Web Dashboards and Telemetry Gateway; NOT for Offline Learner Chapter Files).

---

## 2. Measured Deployment Cycles

| Version | Intent / Summary | Files Modified | Deploy Duration | Status |
| :--- | :--- | :--- | :--- | :--- |
| `v1` | Initial harness scaffold (8 API functions, 1 HTML) | 9 files | 2.0s | **PASS** |
| `v2` | Added declarative PostgreSQL migration (`001_schema.sql`) | 1 file | 1.5s | **PASS** |
| `v3` | Updated storage test instrumentation | 1 file | 1.2s | **PASS** |

---

## 3. Deployment Pipeline Strengths
1. **Instant Compilation**: Source files are production files; no `webpack`, `vite`, or `tsc` build step required at deploy time.
2. **Atomic Migrations**: `migrations/*.sql` run in strict alphabetical sequence on every deployment and are tracked in `__hatchable_migrations`.
3. **Automated Validation (`dry_run_deploy`)**: Linter catches undeclared access routes, reserved table names, missing await calls, and forbidden dependencies before publishing.
4. **Preview Links**: Generates 30-minute anonymous preview URLs bypassing personal sign-in walls for instant verification without public exposure.

---

## 4. Deployment Pipeline Limitations & Gotchas
1. **Automatic Script Injection**: Hatchable automatically injects `/__hatchable/config.js` and `/__hatchable/badge.js` into all served HTML files.
2. **No Build Scripts**: `package.json` scripts are not executed on deploy. Frontend bundles (if using Tailwind CLI or complex bundlers) must be pre-compiled before upload.
3. **Personal Visibility Wall**: Free personal tier projects enforce a login wall by default; making a project public requires human confirmation in console settings.

---

## 5. Recommendation
- **Aasha Teacher/Admin Portal**: `ADAPT`. Rapid iteration, automatic HTTPS, and zero-ops deployment provide substantial operational efficiency over custom VPS/Docker setups.
- **Offline Chapter Distribution**: `DO_NOT_TOUCH`. Canonical student chapters must continue to be built as single-file, zero-dependency HTML artifacts via Aasha's local build system (`build_rn.py`, `generate_chapters.js`).
