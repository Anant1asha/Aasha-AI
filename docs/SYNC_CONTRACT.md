# Aasha Async Sync Contract — Beta

Learning does not wait for connectivity.

## Local lifecycle

interaction → event → local persistence → outbox → later sync

## Batch

```json
{"schema_version":1,"device_session":"opaque-session-id","events":[{"event_id":"EV-...","event_type":"answer_submitted"}]}
```

## Server acknowledgement

The future endpoint returns acknowledged event IDs and explicit conflict records. The client removes only acknowledged IDs from the outbox.

Required: idempotent ingestion, replay protection, append-oriented evidence, explicit conflicts, failed-sync tolerance, and no sync dependency for progression.