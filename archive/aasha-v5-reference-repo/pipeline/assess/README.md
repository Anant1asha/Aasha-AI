# Stage 4 — Assess (Assessment + Misconception Generation)

**In:** `chapter_spec.json` (structure) + `content_map.json` (content)
**Out:** `chapter_spec.json` updated — every quiz/VQ/solve-MCQ/WE-check now has real question
text, 3-4 options, exactly one `c:true`, and a misconception `m` on every wrong option.
**Method:** batched LLM calls, 1-3 per chapter (batch by node to amortize context) — see
`OPEN_SOURCE_TOOLING.md` on why this doesn't need a heavy orchestration framework.

## Hard constraints (enforced post-generation, not just prompted for)
- Exactly one option per question has `c: true`.
- Every `c: false` option has a non-empty `m`.
- No `m` may contain the correct option's `t` text (case-insensitive substring check) — this
  is Critical Rule #1 and the single highest-risk content-quality area.
- WE inline/end checks must be specific to the concept of their step — validate with a
  keyword-overlap heuristic against the step text; flag zero-overlap checks for human review
  rather than silently shipping a generic "Did you understand?" question.
- All distractors must be conceptually plausible (tied to a real misconception), not random
  wrong values.

## Retry behavior
- Missing correct option → regenerate that assessment once, then fail the chapter.
- Leaked answer in `m` → regenerate that option's `m`; strip the offending substring; flag for
  human review either way (don't silently auto-fix and move on).

Full detail: `Aasha_MVP_6_Documents.md §2.2.5, §2.2.7, §5.4.3-5.4.4`.
