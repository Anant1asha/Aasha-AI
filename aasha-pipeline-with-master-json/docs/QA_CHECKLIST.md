# QA Checklist — 10 Critical Rules + Automated Suite

## The 10 Critical Rules (Non-Negotiable)

These are hard gates enforced by the QA harness. A chapter that fails any of
the 10 is **not delivered**, regardless of content quality.

1. **Wrong answers never reveal the correct answer** — only verbal
   misconception text (`m`). Enforced by a substring scan of every `m` against
   its question's correct option text.

2. **All quiz/VQ/solve/WE-check options are shuffled** at render time.

3. **No drag-and-drop** — tap-to-select, tap-to-place only, everywhere.

4. **No `confirm()`/`alert()`** — these freeze mobile browsers. Inline
   feedback only.

5. **Skip button on every interactive step** (`dd_build`, `dd_match`, and
   similar).

6. **Button is never `disabled` when it's the only way forward** — gate
   advancement with logic in `App.next()`, not with a disabled attribute.

7. **`_weCheckRendered` flag present and correctly used** for multi-phase
   worked-example check flows.

8. **`localStorage` is bounds-checked** — corrupt/stale/out-of-range saved
   state must fall back to a fresh start, never throw.

9. **`exit()` is an instant reset, no confirmation dialog.**

10. **No dead code** — no unused CSS selectors, no orphaned functions, no
    unreferenced draw functions.

## Automated QA Suite

The QA harness (`qa/run_qa.js`) runs the following checks:

### Stage 1: Syntax Check
- `node --check` on the extracted `<script>` contents
- Verifies the JavaScript is syntactically valid

### Stage 2: Structural Checks
- No external URLs (single file, offline)
- No `confirm()` or `alert()` calls
- Has `NODES`, `WE`, `WM`, `CONN` variables
- Has `App.init()` call
- No unresolved `{{PLACEHOLDER}}` tokens
- No drag-and-drop API (`dragstart`, `dragend`, `drop`)
- File size under 200KB
- Has exit button
- Has progress indicator
- Devanagari characters present (LLE verification)

### Stage 3: jsdom Render Checks (if available)
- `#app` div exists
- `.screen` element exists
- `.bottom-bar` exists
- Word dialog exists
- Canvas elements present

### Stage 4: Critical Rules
- Rule 1: Misconception fields exist
- Rule 2: Shuffle mechanism present
- Rule 4: No confirm/alert (double check)
- Rule 5: Skip button present
- Rule 7: `_weCheckRendered` flag present
- Rule 8: localStorage bounds check present
- Rule 9: Exit reset mechanism present
- Rule 10: Sufficient function definitions

### Stage 5: Dead Code Scan
- Basic check for function count
- (Full dead-code scan requires AST analysis — future enhancement)

## Python Fallback QA

If Node.js is not available, the QAAgent runs a Python-based fallback with
~13 structural checks covering the most critical rules. This is sufficient for
development but the full Node.js harness should be used for production.

## Spec-Level Validation (Before HTML Assembly)

Run `validate_chapter_spec()` on `chapter_spec.json` *before* assembling HTML.
This catches:
- Missing `c:true` in option sets
- Empty `m` fields for wrong options
- Answer leakage in misconceptions
- Missing WE references
- Invalid `storage_key` format
- Wrong number of nodes (must be 3-5)
- Final node not ending with progress step

Catching these at the JSON stage is a $0 retry; catching them after assembly
means re-running the QA harness.

## QA Report Format

```json
{
  "passed": true,
  "checks_total": 217,
  "checks_passed": 217,
  "failures": [],
  "categories": {
    "syntax": { "passed": 1, "failed": 0 },
    "render_all_steps": { "passed": 23, "failed": 0 },
    "flow_quiz": { "passed": 8, "failed": 0 },
    "critical_rules": { "passed": 10, "failed": 0 },
    "dead_code": { "passed": 1, "failed": 0 }
  }
}
```

A chapter is only delivered if `passed` is `true`.
