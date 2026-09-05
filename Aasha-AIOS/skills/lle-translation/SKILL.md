---
name: aasha-lle-translation
description: Maps English educational terminology into Indic scripts (Devanagari, Tamil, etc.) with bilingual phonics transliteration. Activate when processing chapter vocabulary or building LLE dictionaries.
version: 1.0.0
layer: layer-2-education
license: Apache-2.0
compatibility:
  runtimes: [antigravity, claude-code, freebuff, python-cli]
tools_required:
  - view_file
  - write_to_file
---

# Aasha LLE Translation Skill

## 1. Format Specification
For every distinct English term:
[Local Meaning] ([English Pronunciation in Local Script])

Example:
fraction -> भिन्न (फ्रैक्शन)
perimeter -> परिमाप (पेरीमीटर)

## 2. Mathematical Collision Insulation Rule
Mathematical variables (x, y, a, b) and formulas must NEVER be translated or modified by the dictionary lookup engine.
