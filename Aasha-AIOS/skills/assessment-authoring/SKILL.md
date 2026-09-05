---
name: aasha-assessment-authoring
description: Generates zero-spoiler diagnostic assessments and misconception explanations conforming to Aasha v5 pedagogy. Activate when generating quizzes, worked-example checks, or diagnostic questions.
version: 1.0.0
layer: layer-2-education
license: Apache-2.0
compatibility:
  runtimes: [antigravity, claude-code, freebuff, python-cli]
  models: [claude-3-5-sonnet, gemini-2.0-flash, gpt-4o-mini, nemotron-3.5]
tools_required:
  - view_file
  - write_to_file
---

# Aasha Assessment Authoring Skill

## 1. Pedagogical Objective
Generate high-fidelity, diagnostic assessment questions for Class 1-10 Indian students that identify conceptual misconceptions rather than testing rote recall.

## 2. The Golden Zero-Spoiler Rule
- Exactly 3 or 4 options per question.
- Exactly ONE option is correct.
- Every incorrect option MUST have a meaningful misconception explanation (m field).
- The misconception explanation must explain WHY the student was mistaken; it must NEVER state or leak the correct answer.
