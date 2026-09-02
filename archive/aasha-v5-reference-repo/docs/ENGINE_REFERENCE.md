# Engine Reference — Function-Level Map

Extracted from the reference builds (Fractions, Perimeter & Area, Comparing Quantities). Read
this before touching `template/v5-engine-template.html`, so additions extend the pattern instead
of duplicating it.

## Rendering / LLE
| Function | Role |
|---|---|
| `rt(text, sm)` | "Render Text" — walks a body string, wraps CONN words in blue inline spans and WM words in tap-to-reveal dotted-underline spans. `sm` = small-text mode. This is the single chokepoint for LLE — never render raw body text without it. |
| `showWord(w, h, d)` | Opens the word-definition dialog. Falls back to "इस शब्द का हिंदी अर्थ अभी उपलब्ध नहीं है" when a word has no dictionary entry — this is why partial LLE generation failure never crashes a chapter. |

## Visual primitives (canvas)
| Function | Role |
|---|---|
| `drawFracBar` / `animateFracBar` | Bar-model fraction visual |
| `drawPizza` | Pizza-slice fraction visual |
| `drawAreaModel` / `animateAreaModel` | Grid/area model (fractions & area chapters) |
| `drawNumLine` | Number-line visual |
| `drawRectShape`, `drawSquareShape`, `drawGridShape`, `drawLShape` | Perimeter/Area shape primitives — extend this family for new geometry chapters instead of writing one-off canvas code inline in a step |
| `drawPerimCompare`, `drawAreaSplitCanvas`, `drawPerimVsAreaCanvas` | Chapter-specific composites built from the primitives above — this is the pattern for subject-specific visuals: compose, don't rewrite the primitives |

## Touch interaction setup
| Function | Role |
|---|---|
| `setupPizzaCanvas`, `setupBarCanvas`, `setupAreaCanvas` | Bind tap handlers to a canvas, call back with the updated fill state. All tap-only — no pointer-drag state machines. |
| `setupCSS3D`, `dStart/dMove/dEnd`, `update3D`, `rot3D`, `toggleAutoSpin` | The one exception: a CSS 3D block-rotation view (used for volume/fraction-of-solid visuals) is drag-to-rotate, which is a camera control, not a drag-and-drop *answer* mechanic — still compliant with Critical Rule #3. |

## Audio / Reward feedback
| Function | Role |
|---|---|
| `getAudio()`, `playTone(type)` | Web Audio tone synthesis for tap/correct/wrong/levelup feedback. Wrapped in try/catch — must degrade silently on browsers without Web Audio. |
| `fireConfetti(count)`, `updateConfetti()` | Canvas confetti burst (default 40 particles), wrapped in try/catch — never allowed to crash a chapter. |
| `bumpStat(id)` | Micro-animation on the top-bar stat pills (coins/XP/level/streak) when they change. |

## App controller (the fixed core)
| Method | Role |
|---|---|
| `App.init()` | Loads bounded, validated `localStorage` state or starts fresh. |
| `App.render()` | Dispatches on `NODES[nIdx].steps[sIdx].t` to build the current screen. This is the switch that must cover every step type in the schema. |
| `App.next()` | The single dynamic bottom-button handler. Its behavior branches per step type and per gate state (answered/checked) — see `ARCHITECTURE.md §3 TEAS` for why these gates exist. |
| `App.goBack()` | Steps back one step, or one node if already at a node's first step. |
| `App.advance()` | Internal — moves to the next step/node once a gate has passed, resets all per-step transient state. |
| `App.save()` / state | Persists `{nIdx, sIdx, coins, xp, level, streak, badges}` to `localStorage` keyed by `storage_key`. |
| `App.checkLevelUp()`, `App.checkBadges()` | Reward-engine triggers, called only from gated advancement paths. |

## Adding a new step type (checklist)

1. Add the schema to `schema/chapter_spec.schema.json` and `docs/CHAPTER_SPEC_SCHEMA.md`.
2. Add a render branch in `App.render()` following the existing pattern (build DOM / canvas from
   the step object, wire up any `setup*` handler).
3. Add a gate + advancement branch in `App.next()` if the step requires an answer before
   proceeding (most do — see Critical Rule #6, button never disabled when it's the only way
   forward, so use gating logic instead of `disabled`).
4. Add a skip-button path if the step is interactive (Critical Rule #5).
5. Update the QA harness's render-every-step and flow-simulation checks to cover the new type.
6. Do NOT touch `WM`/`CONN`/`NODES`/`WE`/`SOLVE` — those stay content-only.
