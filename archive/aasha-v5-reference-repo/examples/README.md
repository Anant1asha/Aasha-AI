# Reference Chapters

The engine template in `template/v5-engine-template.html` was extracted from these three
hand-built chapters. They're not included in this repo (they're full chapters with real content,
not reference architecture — see the repo's whole reason for existing), but keep them alongside
this repo for pattern study:

| Chapter | Grade | Notable patterns to study |
|---|---|---|
| Fractions (v8) | 8 | Full LLE scaffolding across all node types; base64 PhET iframe embedding (`{t: "phet"}`) — the one deliberate large-file exception; CSS-3D block rotation view |
| Perimeter & Area | 4 | Cleanest, smallest reference for the pure-engine shape (this is the file the template was extracted from) — shape-drawing composite pattern (`drawPerimCompare`, `drawAreaSplitCanvas`) |
| Comparing Quantities / Percentage | 8 | Second full-scope build after Number Play; validates the "cover every named section" quality bar |

## How to study, not copy

Open a reference chapter and search for `var NODES=` — that's where content starts. Everything
above it (down to the closing `</style>`) is engine you already have in the template. The value
of studying these files is in the *NODES/WE/SOLVE content patterns* — how a worked example is
paced, how a misconception is phrased, how a step sequence builds toward a quiz — not in the
underlying JS, which the template already gives you for free.
