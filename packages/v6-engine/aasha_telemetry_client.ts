/**
 * AASHA Asynchronous Semantic Telemetry Client — packages/v6-engine/aasha_telemetry_client.ts
 *
 * Implements AASHA_KARAKA_PATCH::ARTIFACT_LIMIT_AND_ASYNC_EVIDENCE.
 *
 * INVARIANTS:
 *  1. LEARNING_STATE != TELEMETRY_STATE:
 *     Learning is NEVER blocked by telemetry. If network or backend is offline,
 *     learning, simulations, and assessments remain 100% functional.
 *  2. Durable Local Buffering:
 *     Browser-native IndexedDB (with memory/localStorage fallback) stores events.
 *  3. Exact Version & Hash Binding:
 *     Every event identifies the exact artifact_hash and version that produced it.
 *  4. Privacy / Data Minimization:
 *     Only pseudonymous learner identifiers and semantic learning evidence are stored.
 */

export type SemanticEventClass =
  | 'SESSION_STARTED'
  | 'SESSION_RESUMED'
  | 'CONCEPT_STARTED'
  | 'CONCEPT_COMPLETED'
  | 'EXERCISE_STARTED'
  | 'EXERCISE_COMPLETED'
  | 'ANSWER_SUBMITTED'
  | 'ANSWER_CORRECT'
  | 'ANSWER_INCORRECT'
  | 'HINT_REQUESTED'
  | 'HINT_PROGRESS'
  | 'MISCONCEPTION_SIGNAL'
  | 'SIMULATION_STARTED'
  | 'SIMULATION_INTERACTION'
  | 'SIMULATION_COMPLETED'
  | 'GAME_STARTED'
  | 'GAME_CHECKPOINT'
  | 'GAME_COMPLETED'
  | 'VOCAB_OPENED'
  | 'VOCAB_MASTERED'
  | 'REMEDIATION_TRIGGERED'
  | 'MASTERY_UPDATED'
  | 'CHAPTER_COMPLETED'
  | 'TELEMETRY_SYNCED'
  | 'TELEMETRY_SYNC_FAILED';

export type EvidenceState = 'OBSERVED' | 'SIGNAL' | 'CORROBORATED' | 'PROBABLE' | 'UNKNOWN';

export interface AashaSemanticEvent {
  event_id: string;
  event_type: SemanticEventClass;
  session_id: string;
  learner_pseudonymous_id: string;
  artifact_hash: string;
  version: number | string;
  concept_id?: string;
  exercise_id?: string;
  source_ref?: string;
  foundation_id?: string;
  simulation_id?: string;
  sequence: number; // Primary monotonic ordering within session (protects against clock drift)
  sequence_number?: number; // Alias for sequence
  timestamp: string; // ISO 8601 (client wall-clock metadata)
  client_timestamp?: string; // Explicit client timestamp
  server_received_at?: string; // Populated upon ingestion
  evidence_state?: EvidenceState; // Multi-signal diagnosis state
  payload_version: string;
  payload: Record<string, any>;
  synced?: boolean;
}

export interface TelemetryClientConfig {
  artifactHash: string;
  version: number | string;
  learnerPseudonymousId?: string;
  syncEndpoint?: string;
  batchSize?: number;
  syncIntervalMs?: number;
  maxRetries?: number;
}

export class AashaTelemetryClient {
  private artifactHash: string;
  private version: number | string;
  private learnerId: string;
  private sessionId: string;
  private sequenceCounter = 0;
  private syncEndpoint: string;
  private batchSize: number;
  private syncIntervalMs: number;
  private maxRetries: number;
  private memoryQueue: AashaSemanticEvent[] = [];
  private isSyncing = false;
  private dbName = 'aasha_telemetry_db';
  private storeName = 'offline_events';
  private idb: IDBDatabase | null = null;
  private idbSupported = false;

  constructor(config: TelemetryClientConfig) {
    this.artifactHash = config.artifactHash;
    this.version = config.version;
    this.learnerId = config.learnerPseudonymousId || this.generatePseudonymousId();
    this.sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.syncEndpoint = config.syncEndpoint || '/api/telemetry/events';
    this.batchSize = config.batchSize || 20;
    this.syncIntervalMs = config.syncIntervalMs || 15000;
    this.maxRetries = config.maxRetries || 3;

    this.initStorage();
    this.initSyncScheduler();
  }

  private generatePseudonymousId(): string {
    return `anon_${Math.random().toString(36).substring(2, 10)}`;
  }

  private async initStorage(): Promise<void> {
    if (typeof indexedDB !== 'undefined') {
      try {
        const req = indexedDB.open(this.dbName, 1);
        req.onupgradeneeded = (e: any) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'event_id' });
          }
        };
        req.onsuccess = (e: any) => {
          this.idb = e.target.result;
          this.idbSupported = true;
          this.flushMemoryQueueToIdb();
        };
        req.onerror = () => {
          this.idbSupported = false;
        };
      } catch {
        this.idbSupported = false;
      }
    }
  }

  private flushMemoryQueueToIdb(): void {
    if (!this.idbSupported || !this.idb || this.memoryQueue.length === 0) return;
    try {
      const tx = this.idb.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      for (const evt of this.memoryQueue) {
        store.put(evt);
      }
      this.memoryQueue = [];
    } catch {}
  }

  /**
   * Emit a compact semantic learning event.
   * Completely asynchronous and non-blocking: UI and learning state never wait.
   */
  public recordEvent(
    eventType: SemanticEventClass,
    payload: Record<string, any> = {},
    context: {
      conceptId?: string;
      exerciseId?: string;
      sourceRef?: string;
      foundationId?: string;
      simulationId?: string;
      evidenceState?: EvidenceState;
    } = {}
  ): AashaSemanticEvent {
    this.sequenceCounter++;
    const nowIso = new Date().toISOString();
    const event: AashaSemanticEvent = {
      event_id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      event_type: eventType,
      session_id: this.sessionId,
      learner_pseudonymous_id: this.learnerId,
      artifact_hash: this.artifactHash,
      version: this.version,
      concept_id: context.conceptId,
      exercise_id: context.exerciseId,
      source_ref: context.sourceRef,
      foundation_id: context.foundationId,
      simulation_id: context.simulationId,
      sequence: this.sequenceCounter,
      sequence_number: this.sequenceCounter,
      timestamp: nowIso,
      client_timestamp: nowIso,
      evidence_state: context.evidenceState || 'OBSERVED',
      payload_version: '1.0',
      payload,
      synced: false
    };

    // Store asynchronously without blocking caller
    if (this.idbSupported && this.idb) {
      try {
        const tx = this.idb.transaction(this.storeName, 'readwrite');
        tx.objectStore(this.storeName).put(event);
      } catch {
        this.memoryQueue.push(event);
      }
    } else {
      this.memoryQueue.push(event);
    }

    return event;
  }

  /**
   * Schedule periodic asynchronous batch sync
   */
  private initSyncScheduler(): void {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          this.flushBatchAsync();
        }
      }, this.syncIntervalMs);

      window.addEventListener('online', () => {
        this.flushBatchAsync();
      });
    }
  }

  /**
   * Flush pending batch asynchronously over HTTP POST
   */
  public async flushBatchAsync(): Promise<number> {
    if (this.isSyncing) return 0;
    this.isSyncing = true;

    try {
      const eventsToSync = await this.getUnsyncedEvents(this.batchSize);
      if (eventsToSync.length === 0) {
        this.isSyncing = false;
        return 0;
      }

      if (typeof fetch === 'undefined') {
        this.isSyncing = false;
        return 0;
      }

      const res = await fetch(this.syncEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: `batch_${Date.now()}`,
          artifact_hash: this.artifactHash,
          version: this.version,
          events: eventsToSync
        })
      });

      if (res.ok) {
        await this.markEventsSynced(eventsToSync.map(e => e.event_id));
        this.recordEvent('TELEMETRY_SYNCED', { count: eventsToSync.length });
        this.isSyncing = false;
        return eventsToSync.length;
      } else {
        this.recordEvent('TELEMETRY_SYNC_FAILED', { status: res.status });
      }
    } catch (e: any) {
      // Offline or network error: perfectly normal in offline learning
      // Learning continues unhindered; events remain in local buffer
    } finally {
      this.isSyncing = false;
    }
    return 0;
  }

  private getUnsyncedEvents(limit: number): Promise<AashaSemanticEvent[]> {
    return new Promise((resolve) => {
      if (this.idbSupported && this.idb) {
        try {
          const tx = this.idb.transaction(this.storeName, 'readonly');
          const store = tx.objectStore(this.storeName);
          const req = store.getAll();
          req.onsuccess = () => {
            const all: AashaSemanticEvent[] = req.result || [];
            const unsynced = all.filter(e => !e.synced).slice(0, limit);
            resolve(unsynced);
          };
          req.onerror = () => {
            resolve(this.memoryQueue.filter(e => !e.synced).slice(0, limit));
          };
        } catch {
          resolve(this.memoryQueue.filter(e => !e.synced).slice(0, limit));
        }
      } else {
        resolve(this.memoryQueue.filter(e => !e.synced).slice(0, limit));
      }
    });
  }

  private markEventsSynced(eventIds: string[]): Promise<void> {
    return new Promise((resolve) => {
      const idSet = new Set(eventIds);
      this.memoryQueue = this.memoryQueue.filter(e => !idSet.has(e.event_id));

      if (this.idbSupported && this.idb) {
        try {
          const tx = this.idb.transaction(this.storeName, 'readwrite');
          const store = tx.objectStore(this.storeName);
          for (const id of eventIds) {
            store.delete(id);
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      } else {
        resolve();
      }
    });
  }

  public getQueueLength(): number {
    return this.memoryQueue.length;
  }
}
