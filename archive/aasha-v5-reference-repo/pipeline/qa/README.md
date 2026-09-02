# Stage 8 — QA

**In:** `chapter.html`
**Out:** `qa_report.json` — `{passed, checks_total, checks_passed, failures: [{check, reason}]}`
**Library:** Node.js + jsdom (see `OPEN_SOURCE_TOOLING.md`)

Full check list: `docs/QA_CHECKLIST.md`. Five stages — syntax, render-every-step, flow
simulation per step type, the 10 critical rules, dead-code scan.

## Rule
A chapter that fails ANY check is reported failed with the failing checks listed. It is never
delivered, regardless of content quality elsewhere. There is no "mostly passes" tier.

## On failure
Surface the failure list to the operator/CLI output. The fix is almost always a `chapter_spec.json`
edit (e.g. a WE check that's too generic, a misconception that leaks the answer) followed by a
re-run of Stage 7 (Assemble) + Stage 8 (QA) only — this costs $0 in LLM calls since the spec JSON
is already generated and cached.
