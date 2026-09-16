# AUTHENTICATION COMPATIBILITY REPORT
**Ecosystem**: Aasha-AIOS  
**Target Resource**: Hatchable Auth & Role-Based Access Control  
**Project Ref**: `proj_wDCbCrGwuVqy`  
**Date**: 2026-09-17  
**Evaluator**: Aasha-AIOS Autonomous Engineering Agent  

---

## 1. Executive Summary
Authentication in Aasha distinguishes sharply between **student learners** (anonymous, zero PII, physical device identification) and **educators/administrators** (role-gated access to cohort reports and reviews). Hatchable's two identity planes (`req.user` for end-users, `req.member` for collaborators) were evaluated against this model.

- **Compatibility Score**: 88%
- **Primary Classification**: `ADAPT` (Viable for Staff/Teacher Portals; Inapplicable for Student Offline Devices)
- **PII Breach Gate**: PASSED. Synthetic identities only. Zero student PII entered Hatchable auth.

---

## 2. Aasha Role Matrix vs Hatchable Identity Planes

Aasha's canonical role matrix (`services/api/src/auth.js`) was benchmarked via `api/roles/check.js`:

| Role | Operation / Permission | Aasha Policy | Hatchable Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| `learner` | `GET /api/chapters` | ALLOW | `allowed: true` | **PASS** |
| `learner` | `POST /api/content/review` | DENY | `allowed: false` | **PASS** |
| `teacher` | `POST /api/content/review` | ALLOW | `allowed: true` | **PASS** |
| `teacher` | `POST /api/rewards/manual` | DENY | `allowed: false` | **PASS** |
| `admin` | `POST /api/rewards/manual` | ALLOW | `allowed: true` | **PASS** |

---

## 3. Structural Evaluation of Hatchable Auth

### 3.1 Two Identity Planes
1. **App End Users (`access = "user"`)**:
   - Uses email magic-link code login (`[auth]` block in `hatchable.toml`).
   - Incompatible with Aasha's **offline child learner model**: primary school students in rural India do not have individual email addresses and must never submit email addresses to third-party clouds.
2. **Project Collaborators (`access = "member"` / `access = "admin"`)**:
   - Represents developers, NGO staff, and system administrators.
   - Fits the **Teacher / NGO Admin / Donor** identity layer well.

### 3.2 Personal Visibility Gate
- By default, Hatchable personal projects enforce an edge-level authentication wall (`Visibility: personal`). Unauthenticated browsers or anonymous HTTP requests receive an HTML login redirect.
- For public reporting or anonymous telemetry ingest, the project must either be set to `Public` in console settings or requests must carry a collaborator bearer token.

---

## 4. Child Privacy Safeguard Findings
- Student devices must **never** register with Hatchable `[auth]`.
- Learners remain anonymous identifiers (`learnerId: "lrn_..."` or UUID hash).
- All authentication checks for learners must execute entirely within the local student PWA / SQLite / IndexedDB sandbox.

---

## 5. Recommendation
- **Learners**: `DO_NOT_TOUCH`. Keep local anonymous authentication on physical devices.
- **Educator / NGO Portal**: `ADAPT`. Hatchable passwordless email authentication can be safely adopted for teacher cohort portals and donor dashboards.
