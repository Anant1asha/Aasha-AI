# Stage 7 — Assemble HTML

**In:** final `chapter_spec.json` + `lle.json` + `template/v5-engine-template.html`
**Out:** `chapter.html` — a single, self-contained, offline file.

## Injection contract — 8 placeholders

| Placeholder | Source | Serialization note |
|---|---|---|
| `{{CHAPTER_TITLE}}` | `chapter.title` | Plain string substitution, used in `<title>` |
| `{{WM_JSON}}` | `lle.json.WM` merged with `config/defaults.json.WM` | JS object literal via `json.dumps(..., ensure_ascii=False)` — Devanagari must NOT be escaped to `\uXXXX` |
| `{{CONN_JSON}}` | `lle.json.CONN` merged with `config/defaults.json.CONN` | Same as above |
| `{{LEVELS_JSON}}` | `chapter_spec.LEVELS` or fall back to `config/defaults.json.LEVELS` | JS array literal |
| `{{BADGES_JSON}}` | `chapter_spec.BADGES` (required per-chapter, 3-5 entries) | JS array literal |
| `{{WE_JSON}}` | `chapter_spec.WE` | JS object literal, `var WE={{WE_JSON}};` |
| `{{SOLVE_JSON}}` | `chapter_spec.SOLVE` (may be `{}` if the chapter has no solve steps) | JS object literal |
| `{{CONTENT_JSON}}` | `chapter_spec.NODES` | JS object literal, `var NODES={{CONTENT_JSON}};` |

## Assembly rule
This is a **plain string replace**, not a template engine with logic — the placeholders are
literal tokens in `template/v5-engine-template.html`. Never generate/modify the engine JS/CSS
around the placeholders. If a chapter seems to need engine behavior the template doesn't have,
that's a template-level change reviewed against `docs/ENGINE_REFERENCE.md §Adding a new step
type`, not something to patch inline during assembly.

## Serialization gotcha
Use `json.dumps(obj, ensure_ascii=False)` (Python) or plain `JSON.stringify` (Node, which
doesn't escape Unicode by default) — escaping Devanagari to `\uXXXX` still renders correctly in
a browser, but keeping it literal keeps the output file human-diffable, which matters for the
edit-and-resume workflow.

Full detail: `Aasha_MVP_6_Documents.md §2.2.8, §5.8`.
