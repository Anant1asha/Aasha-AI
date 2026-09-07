---
name: read-master-prompt-first
description: Enforces reading the primary specification documents before proposing build plans or writing code.
trigger: always_on
---

# Always Follow Central Specifications

When interacting with this repository:
1. **Never make assumptions** about the architecture or project scope based purely on directory names or older files.
2. **Always read `MASTER_PROMPT.md`**, `PROJECT_AI_RULES.md`, and `CLAUDE.md` in their entirety. These files represent the absolute source of truth for the Aasha AI Pipeline.
3. The core goal of this repository is executing the 10 Tasks outlined in the V2 Full-Synthesis Pipeline spec, not building standalone Next.js/Fastify web apps from scratch unless specified by those docs.
4. If you have not read `aasha-pipeline-with-master-json/MASTER_PROMPT.md` in your current session, you must read it before taking any other action.
5. Remember that the `v5-engine-template.html` is merely a reference prototype. The goal is to build a much better, more effective, and impactful system leveraging full AI capabilities.
6. Always deeply cross-check the existing codebase to see what is already implemented before starting new tasks to avoid conflicts.
