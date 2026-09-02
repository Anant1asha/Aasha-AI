# QA Checklist — 10 Critical Rules + Automated Suite Shape

Source of truth: `Aasha_MVP_6_Documents.md §1.8` and `§2.2.9`. These are hard gates, not style
guidance. A chapter that fails any of the 10 is **not delivered**, regardless of how good the
content is.

## The 10 Critical Rules (non-negotiable)

1. **Wrong answers never reveal the correct answer** — only verbal misconception text (`m`).
   Enforced by a substring scan of every `m` against its question's correct option text.
2. **All quiz/VQ/solve/WE-check options are shuffled** at render time.
3. **No drag-and-drop** — tap-to-select, tap-to-place only, everywhere.
4. **No `confirm()`/`alert()`** — these freeze mobile browsers. Inline feedback only.
5. **Skip button on every interactive step** (`dd_build`, `dd_match`, and similar).
6. **Button is never `disabled` when it's the only way forward** — gate advancement with logic
   in `App.next()`, not with a disabled attribute that strands the learner.
7. **`_weCheckRendered` flag present and correctly used** for multi-phase worked-example check
   flows (render the check once, don't re-render on every `next()` call).
8. **`localStorage` is bounds-checked** — corrupt/stale/out-of-range saved state must fall back
   to a fresh start, never throw.
9. **`exit()` is an instant reset, no confirmation dialog.**
10. **No dead code** — no unused CSS selectors, no orphaned functions, no unreferenced draw
    functions. Every kilobyte of the single file is proof of work.

## Automated suite shape (Node.js + jsdom)

Reference: `Aasha_MVP_6_Documents.md §2.2.9`. Five stages, ~200+ individual checks:

1. **Syntax** — `node --check` on the extracted `<script>` contents.
2. **Render-every-step** — load the chapter in jsdom, iterate every `(nodeIdx, stepIdx)` pair,
   assert render doesn't throw and produces expected DOM (e.g. an `.opt` for every option).
3. **Flow simulation per step type** — simulate a full interaction: quiz answer → check → next;
   WE step-by-step → inline check → end check; solve sub-steps in sequence; DD build/match tap
   sequences; skip-button paths. One simulation per step type present in the chapter.
4. **10 critical-rules checks** — the list above, each as an automatable assertion (grep-based
   for some, DOM/behavior-based for others).
5. **Dead-code scan** — grep for functions/selectors defined but never referenced.

Output: `{passed: bool, checks_total, checks_passed, failures: [{check, reason}]}`.

## Spec-level validation (before HTML assembly — see `CHAPTER_SPEC_SCHEMA.md §Validation Rules`)

Run schema validation on `chapter_spec.json` *before* assembling HTML — catching a missing
`c:true` or an empty `m` at the JSON stage is a $0 retry; catching it after assembly means
re-running the whole QA harness. Recommended: `ajv` (see `OPEN_SOURCE_TOOLING.md`) against
`schema/chapter_spec.schema.json`.

## File-size gate

Generated chapter should stay under ~200KB where possible (jsdom full-flow test eligibility
threshold noted in the risk register). Prefer SVG over raster, downsample any embedded images to
≤800px width. The Fractions v8 build embedding PhET iframes as base64 is a known, deliberate
exception (~6.6MB) — acceptable only when the interactive simulation is essential and no
lighter-weight alternative exists; don't default to this pattern.
