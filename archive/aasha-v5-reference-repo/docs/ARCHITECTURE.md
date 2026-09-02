# Architecture — The Six Engines Inside One HTML File

The Aasha Learning and Impact Ecosystem is described (per project spec) as six engines. In the
v5 chapter output, all six live inside a *single self-contained HTML file* — there is no server,
no build step, no bundler. This doc maps each conceptual engine to where it physically lives in
`template/v5-engine-template.html`, so future work (manual or LLM-assisted) touches the right
layer instead of re-deriving the whole file.

## 1. TLN — The Learning Node engine
**What it does:** sequences a chapter into 3–5 concept Nodes, each with an ordered list of Steps.
**Where it lives:** the `NODES` array (injected at `{{CONTENT_JSON}}`) plus `App.render()`,
`App.next()`, `App.goBack()`, `App.advance()` in the JS controller. Rendering dispatches on
`step.t` (step type) — see `docs/CHAPTER_SPEC_SCHEMA.md §Step Types` for the 13 supported types.
**Reuse rule:** never add a new step type without updating both the schema and the `render()`
switch — they must stay in lockstep or QA will fail on render-every-step.

## 2. Question Engine
**What it does:** generates and renders quiz / VQ / solve-MCQ / WE-check assessments, all sharing
one option schema (`{t, c, m}` — text, correct flag, misconception).
**Where it lives:** `checkQuiz()`, `checkVQ()`, `checkSolve()`, `checkWECheck()`,
`checkWEStepCheck()` in the JS controller; option shuffling happens at render time so the same
spec never shows options in the same order twice.
**Reuse rule:** every wrong option MUST carry a non-empty, verbal `m` that never contains the
correct answer's text (substring-checked by QA). This is Critical Rule #1 — see `QA_CHECKLIST.md`.

## 3. TEAS — Trust / Evidence / Assessment / Scoring (mastery authority)
**What it does:** in prior builds (Number Play chapter) TEAS was established as the *sole*
authority on whether a concept is mastered — the Reward Engine only fires on TEAS-verified
events, never on raw UI interaction.
**Where it lives in v5:** the `answered` / `weChecked` / `solveAnswered` boolean gates inside
`App`, which must flip true before `next()` allows advancement. XP awards (`bumpStat`,
`checkLevelUp`) are only called from inside these gated branches — never from a render call.
**Reuse rule:** any new interactive step type must gate its own "verified" flag the same way,
so a chapter can never be advanced or rewarded by an unanswered/unchecked step.

## 4. Reward Engine
**What it does:** XP, levels, streaks, badges, confetti — deliberately lightweight (no coins,
no shop, no economy, per Design Principle #5).
**Where it lives:** `LEVELS`, `BADGES` config objects; `checkLevelUp()`, `checkBadges()`,
`bumpStat()`, `fireConfetti()`, `playTone()`.
**Reuse rule:** `LEVELS` and `BADGES` are the only reward config that should vary per chapter
(badge names/milestones tied to that chapter's nodes). The XP *mechanics* (thresholds, confetti,
tone synthesis) are engine, not content — leave them alone.

## 5. Game Engine
**What it does:** the interactive step types that aren't plain assessments — `dd_build`,
`dd_match`, `ix_pizza`/`ix_bar`/`ix_area`/`ix_slider`, canvas-based visuals, CSS-3D block view.
**Where it lives:** `setupPizzaCanvas`, `setupBarCanvas`, `setupAreaCanvas`, `setupCSS3D`,
`drawFracBar`/`drawAreaModel`/`drawNumLine` and the shape-drawing functions
(`drawRectShape`, `drawGridShape`, `drawLShape`, etc.) — chapter-specific drawing functions are
added here per subject (e.g. Perimeter & Area added `drawPerimCompare`, `drawAreaSplitCanvas`).
**Reuse rule:** tap-to-select only — Critical Rule #3 bans drag-and-drop outright, even though
the step is *named* `dd_build`/`dd_match` for historical reasons. New visual types should be
added as new draw functions, not new step-type families, unless the interaction model genuinely
differs.

## 6. Impact Engine
**What it does:** in the full platform, this is the offline evidence/analytics layer (deferred
post-MVP per the PRD — see `Aasha_MVP_6_Documents.md §1.9`). In the MVP chapter itself, the only
"impact" surface is `localStorage` progress persistence (`App.save()`/`App.init()`), which lets
a learner resume a chapter offline across sessions.
**Where it lives:** `App.save()`, `App.init()`, keyed by `storage_key` (must match
`^aasha_[a-z0-9]+_v5$`, validated by the schema).
**Reuse rule:** always bounds-check parsed `localStorage` data before trusting it (Critical Rule
#8) — corrupt/stale data must fall back to a fresh start, never crash the chapter.

## Physical layout of the template file

```
<head>
  <style>          ← fixed engine CSS (design tokens in :root, component classes)
<body>
  <div class="app"> ← fixed shell markup (topbar, screen, bottom bar, dialogs)
  <script>
    rt(), showWord(), draw*()        ← rendering/visual helpers (engine)
    setup*Canvas()                    ← touch interaction handlers (engine)
    play Tone(), fireConfetti()       ← audio/reward feedback (engine)
    WM = {{WM_JSON}}                  ← content: Hindi word dictionary
    CONN = {{CONN_JSON}}              ← content: connecting-word dictionary
    LEVELS = {{LEVELS_JSON}}          ← content: XP thresholds (default provided)
    BADGES = {{BADGES_JSON}}          ← content: chapter-specific badges
    WE = {{WE_JSON}}                  ← content: worked-example definitions
    SOLVE = {{SOLVE_JSON}}            ← content: guided multi-step solve definitions
    NODES = {{CONTENT_JSON}}          ← content: the chapter itself
    App = {...}                      ← fixed controller (render/next/goBack/advance/save)
    App.init()
```

Everything above the `WM =` line and everything from `App = {` down is engine and should never
change per chapter. Everything between is content, injected from the chapter spec.
