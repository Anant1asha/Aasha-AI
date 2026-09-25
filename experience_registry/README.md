# AASHA Experience Registry

The registry is a governed capability catalogue, not a dump of generated chapter HTML.

## Lifecycle

ABSENT → CANDIDATE → VERIFIED → CERTIFIED → DEPRECATED

BLOCKED may occur whenever a mandatory gate fails.

## Rules

- Certified chapters do not automatically certify reusable components.
- Prefer source-level component artifacts emitted during compilation.
- Reverse extraction from compiled HTML is fallback-only and produces DERIVED candidates.
- Match by capability/mechanic contract, not subject/class alone.
- Unknown provenance, dependency closure, or license status blocks promotion.
- Shadow DOM is not a legal license boundary.
- Offline certification requires local dependency closure.
- Registry mutation is deterministic and hash-backed.
