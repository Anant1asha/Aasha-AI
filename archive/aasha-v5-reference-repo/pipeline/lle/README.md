# Stage 5 — LLE (Language Learning Element / Hindi Scaffolding)

**In:** all `body`/`text`/`q`/`instruction` fields across the final `chapter_spec.json`
**Out:** `lle.json` — merged `{WM: {...}, CONN: {...}}` ready to inject at `{{WM_JSON}}` /
`{{CONN_JSON}}`.

## Process
1. Extract every distinct word (lowercased, punctuation-stripped) from the chapter's text fields.
2. Load `config/defaults.json` — its `WM` (296 entries) and `CONN` (46 entries) are the shared
   baseline. Reuse whatever's already there.
3. Partition: baseline-covered words vs net-new. Only net-new words get an LLM call.
4. Batch net-new words into one/few LLM calls, format `हिंदी_अर्थ (अंग्रेज़ी_उच्चारण_देवनागरी_में)`.
   Temperature 0.2 (not 0) — natural phrasing matters here more than for structural generation.
5. Classify: a word is `CONN` only if it's a connecting word (fixed list, ~46 entries already
   in the baseline); everything else is `WM`.
6. Merge baseline + net-new into `lle.json`.

## Failure handling
A net-new word that fails to generate gets the fallback string
`"इस शब्द का हिंदी अर्थ अभी उपलब्ध नहीं है"` (already the engine's default in `showWord()`)
rather than failing the whole chapter — this is NFR-3's graceful-degradation rule.

Full detail: `Aasha_MVP_6_Documents.md §2.2.6, §5.5`.
