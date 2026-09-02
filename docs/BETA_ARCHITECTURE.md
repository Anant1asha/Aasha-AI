# Annanth Aasha Foundation — Beta Architecture v0.2

**Authority:** Phase-0 Constitution v1.1 remains authoritative and is not modified by this package.
**Audience:** Class 1–10. The Beta content sample remains Class 6 only; the engine/data model is grade-agnostic across 1–10.

## Authority chain

School-book content → TLN/Learning Nodes → Learning Runtime + Visual/Simulation adapters → Question Contract → Assessment evidence → TEAS deterministic progression → Reward ledger → Impact evidence → async sync outbox.

Games never calculate mastery. AI never determines progression or reward authority.

## Offline

Core learning is local. Learner interactions emit append-oriented events retained on-device and queued in an outbox. A future server acknowledges event IDs; learning does not wait for connectivity.

## Identity

No mandatory child login. Beta uses an opaque local learner ID plus centre cohort reference. A later platform layer can associate durable identities under explicit privacy rules.

## Rewards

Reward infrastructure exists but is deliberately low priority in Beta. Centre verification is manual. Reward state never controls progression.

## Reuse

External/open-source visual or simulation assets enter through a registry with provenance, license, version, adapter and offline metadata. New chapters supply data rather than custom engine code.