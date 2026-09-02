# Offline Synchronization

Events are append-only locally and carry `eventId`, `occurredAt`, `deviceId`, `learnerId`, `schemaVersion`, and payload hash. Sync is idempotent by `eventId`. Server acknowledgement does not rewrite history; reconciliation produces a separate resolution event.
