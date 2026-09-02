# Chapter Spec Schema — Human-Readable Companion

Machine-checkable version: `schema/chapter_spec.schema.json`. Source: `Aasha_MVP_6_Documents.md
§5.4`. This is the contract between "content for a chapter" and "the v5 engine template" — get
this right and assembly is a mechanical placeholder swap.

## Top level

```json
{
  "chapter": { "title": "...", "subject": "math", "grade": 8, "storage_key": "aasha_percent_v5", "emoji": "📊" },
  "LEVELS": [ /* optional — omit to use config/defaults.json */ ],
  "BADGES": [ /* 3-5 badges, chapter-specific */ ],
  "WE": { "we_key": { /* worked example */ } },
  "SOLVE": { "sl_key": { /* guided multi-step solve */ } },
  "NODES": [ /* 3-5 concept nodes */ ]
}
```

## 13 step types (`t` field)

| Type | Purpose | Answer-gated? |
|---|---|---|
| `intro` | Node opener, hero image | No |
| `text` | Body explanation, may include a canvas visual via `ctx` | No |
| `quiz` | Standard MCQ | Yes |
| `vq` | Visual question (paired with a bar/pizza/area visual) | Yes |
| `worked` | References a `WE.<key>` — multi-step revealed worked example | Yes (inline + end check) |
| `solve` | References a `SOLVE.<key>` — sequential guided solve | Yes (per sub-step) |
| `dd_build` | Tap-to-build (e.g. build a fraction from pieces) | Optional (skippable) |
| `dd_match` | Tap-to-match 4-5 pairs | Optional (skippable) |
| `ix_pizza` / `ix_bar` / `ix_area` | Tap-to-shade interactive visual | No (exploratory) |
| `ix_slider` | Slider-driven equivalent-value exploration | No (exploratory) |
| `video` | Looped canvas animation demo | No |
| `progress` | End-of-node XP award; final node's last step omits `next: true` | No |
| `phet` | Reserved for base64-embedded PhET simulation (heavy — see `OPEN_SOURCE_TOOLING.md`) | No |

## The proven chapter flow (per node)

`Intro → Text → Interactive Visual → Worked Example → Quiz → (repeat text/visual/quiz as needed)
→ Progress`. This sequencing is what's been validated across three chapters — deviating from it
is possible but should be a deliberate pedagogical choice, not a default.

## Option schema (used by quiz/vq/solve-mcq/WE checks)

```json
{ "t": "option text", "c": true, "m": "" }
```
- Exactly one option per question has `c: true`.
- Every `c: false` option has a non-empty `m` — verbal, specific to *that* distractor's
  misconception, and must never contain the correct answer's text.
- Options are shuffled at render time, not at spec-authoring time.

## Validation rules (enforced before assembly)

1. `NODES` has 3-5 elements.
2. Every node has `title` + non-empty `steps`.
3. Every step's `t` is one of the 13 types above.
4. The last node's final step is `{t: "progress", xp: N}` with **no** `next: true`.
5. Every option set has 3-4 `opts`.
6. Every option set has exactly one `c: true`.
7. Every wrong option's `m` is non-empty and doesn't leak the correct answer.
8. Every `worked` step's `we` key exists in `WE`.
9. Every `SOLVE` step's `sl` key exists in `SOLVE`.
10. Every WE has 3-4 steps, ≥1 inline `check`, and a WE-level `check`.
11. Every `dd_match` has 4-5 `pairs`.
12. `storage_key` matches `^aasha_[a-z0-9]+_v5$`.

Run these via `ajv`/`jsonschema` against `schema/chapter_spec.schema.json` (structural rules)
plus a small custom validator script for rules 4, 7, 8, 9 (cross-references and substring checks
that JSON Schema alone can't express) — see `pipeline/design/README.md`.
