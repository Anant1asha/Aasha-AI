# Stage 3 — Design

**In:** `content_map.json`
**Out:** `chapter_spec.json` (structure only — `NODES` + `WE`/`SOLVE` keys referenced, no
assessments or LLE yet)
**Method:** single LLM call given the exact schema (`schema/chapter_spec.schema.json`) and the
13 step types (`docs/CHAPTER_SPEC_SCHEMA.md`).

## Rules
- One node per concept (3-5 total).
- Sequence steps per node using the proven flow: Intro → Text → Interactive Visual → Worked
  Example → Quiz → ... → Progress (`ARCHITECTURE.md §1 TLN`).
- Final node's last step must be `{t: "progress", xp: N}` with no `next: true`.
- Reference WE/SOLVE definitions by key (`we: "WE.we_1"`) — the actual WE/SOLVE bodies are
  filled by name here and populated fully in Stage 4.

## Validation (run immediately, before proceeding to Stage 4)
Validate against `schema/chapter_spec.schema.json` with `ajv`/`jsonschema`, plus a small custom
script for the cross-reference rules the schema can't express alone: every `worked`/`solve`
step's key exists in `WE`/`SOLVE`, and the final-node/final-step rule. See
`docs/CHAPTER_SPEC_SCHEMA.md §Validation Rules` for the full list (rules 1-12).

Full detail: `Aasha_MVP_6_Documents.md §2.2.4, §5.4`.
