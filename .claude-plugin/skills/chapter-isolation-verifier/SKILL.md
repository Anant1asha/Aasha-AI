---
name: chapter-isolation-verifier
description: Verifies that HTML chapters contain zero external http:// or https:// CDN dependencies, ensuring 100% offline-first reliability for Aasha classrooms.
---

# Chapter Offline Isolation Verifier

## Purpose
Ensure all compiled HTML lessons in `chapters/` and `standalone_chapters/` are completely self-contained for offline usage in rural schools without internet connectivity.

## Verification Protocol
1. Scan HTML files for external `<script src="http...">` or `<link href="http...">` tags.
2. Ensure all CSS, JavaScript, fonts, and images are loaded via relative local paths (e.g., `./assets/` or inline data URIs).
3. Validate that the Language Learning Engine (LLE) API scripts (`rt`, `applyLLE`, `showWord`) are bundled locally.
4. Report any external network calls as strict compliance errors prior to release.
