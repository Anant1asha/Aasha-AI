# Stage 2 — Analyze

**In:** `raw_extract.json` + subject/grade context
**Out:** `content_map.json`
**Method:** single LLM call, temperature 0, structured-output/JSON-schema mode where the
provider supports it (see `pipeline/README.md` for the adapter pattern).

## Output shape
```json
{
  "concepts": [{"name": "...", "summary": "...", "key_ideas": ["..."], "difficulty": "easy|medium|hard"}],
  "worked_examples": [{"problem": "...", "solution_approach": "..."}],
  "quiz_opportunities": [{"concept": "...", "point": "..."}],
  "visual_opportunities": [{"concept": "...", "visual_type": "pizza|bar|area|slider"}],
  "vocabulary": ["word1", "word2"]
}
```

## Rules
- 3-5 concepts (these become the chapter's Nodes — hard constraint from the schema).
- `vocabulary` should exclude anything already in `config/defaults.json` WM/CONN — the LLE
  stage only needs net-new words.
- Prompt should be calibrated with the pedagogue framing: "expert pedagogue for Indian
  government-school curriculum" (per the reference prompt design), with subject+grade context.

Full detail: `Aasha_MVP_6_Documents.md §2.2.3, §5.3`.
