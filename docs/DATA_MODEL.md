# Aasha Beta Data Model

## Learner
- local_id: device-local opaque identifier
- display_name: local display label
- class_level: integer 1–10
- age_stage: foundation (1–2), primary (3–5), middle (6–8), secondary (9–10)
- cohort_code: centre reference

## Learning Node
- node_id
- title
- objective
- dependencies[]
- steps[]
- asset_refs[]
- language layer

## Event
- event_id (idempotency key)
- schema_version
- event_type
- learner_ref
- session_id
- timestamp
- payload

## Assessment evidence
- question_id
- node_id
- result
- response_time_ms
- misconception tag

## Reward ledger
- ledger_id
- source_event_id
- coins_delta
- xp_delta
- verification_status
- verifier_ref
- timestamp

Production should retain minimum necessary learner data and apply explicit consent, retention, access and deletion controls.