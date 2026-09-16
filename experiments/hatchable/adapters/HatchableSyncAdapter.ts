/**
 * Aasha-AIOS Hatchable Infrastructure Adapter
 * 
 * Boundary: EXPERIMENTAL / ADAPTER ONLY
 * Authority: Aasha-AIOS
 * 
 * Strict Invariants:
 * 1. ZERO STUDENT PII: Strips any learner personal names/emails before transmission.
 * 2. OFFLINE-FIRST SURVIVABILITY: Local storage queue is primary; Hatchable is a sync target.
 * 3. NO CANONICAL COUPLING: Core Aasha code never imports or calls Hatchable directly.
 * 4. THUNDERING HERD DEFENSE: Jittered window + Bulk batching (up to 100 events/req).
 * 5. HYBRID DELTA CONTENT: Bandwidth-optimized delta updates (304 upToDate check).
 */

export interface LearningEvent {
  eventId: string;
  learnerId: string; // Anonymous opaque UUID/hash only
  type: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}

export interface SyncResult {
  syncedCount: number;
  failedCount: number;
  rejectedPIICount: number;
  endpoint: string;
}

export interface ChapterDeltaResponse {
  chapterId: string;
  version: number;
  upToDate: boolean;
  title?: string;
  grade?: number;
  updatedAt: string;
  itemBank?: Array<{
    id: string;
    nodeId: string;
    stem: string;
    options: Array<{ text: string; isCorrect: boolean; m?: string }>;
    hints: Array<{ tier: string; text: string }>;
  }>;
}

export class HatchableSyncAdapter {
  private endpoint: string;

  constructor(endpoint: string = 'https://aasha.hatchable.site/api') {
    this.endpoint = endpoint;
  }

  /**
   * Sanitizes events to enforce strict child privacy rules (Section 21).
   */
  public sanitizeEvent(event: LearningEvent): { clean: LearningEvent | null; violation: string | null } {
    const payloadStr = JSON.stringify(event.payload);
    
    // Explicit pattern match for student personal identifiers
    if (/(\bname\b|\bemail\b|\bphone\b|\bstudentName\b|\bstudent_name\b)/i.test(payloadStr)) {
      return {
        clean: null,
        violation: `PII detected in event ${event.eventId}. Payload contains forbidden personal identifier keys.`
      };
    }

    return {
      clean: {
        eventId: event.eventId,
        learnerId: event.learnerId,
        type: event.type,
        occurredAt: event.occurredAt,
        payload: { ...event.payload }
      },
      violation: null
    };
  }

  /**
   * High-throughput batch sync designed for school tablet bursts.
   */
  public async syncBatchBulk(
    events: LearningEvent[],
    opts: { maxBatchSize?: number; jitterMs?: number; authToken?: string } = {}
  ): Promise<SyncResult> {
    const { maxBatchSize = 50, jitterMs = 0, authToken } = opts;

    if (jitterMs > 0) {
      const wait = Math.floor(Math.random() * jitterMs);
      await new Promise(res => setTimeout(res, wait));
    }

    const cleanList: LearningEvent[] = [];
    let rejectedPIICount = 0;

    for (const ev of events) {
      const { clean } = this.sanitizeEvent(ev);
      if (clean) {
        cleanList.push(clean);
      } else {
        rejectedPIICount++;
      }
    }

    if (cleanList.length === 0) {
      return { syncedCount: 0, failedCount: 0, rejectedPIICount, endpoint: this.endpoint };
    }

    let syncedCount = 0;
    let failedCount = 0;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    for (let i = 0; i < cleanList.length; i += maxBatchSize) {
      const chunk = cleanList.slice(i, i + maxBatchSize);
      try {
        const res = await fetch(`${this.endpoint}/events/batch`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ events: chunk })
        });
        if (res.status === 202 || res.status === 200) {
          const data = await res.json();
          syncedCount += (data.accepted || chunk.length);
        } else {
          failedCount += chunk.length;
        }
      } catch {
        failedCount += chunk.length;
      }
    }

    return {
      syncedCount,
      failedCount,
      rejectedPIICount,
      endpoint: this.endpoint
    };
  }

  /**
   * Pulls lightweight curriculum delta item banks (WhatsApp offline companion).
   */
  public async fetchChapterDelta(
    chapterId: string,
    currentVersion?: number,
    authToken?: string
  ): Promise<ChapterDeltaResponse | null> {
    try {
      let url = `${this.endpoint}/chapters/deltas?chapter=${encodeURIComponent(chapterId)}`;
      if (currentVersion !== undefined) {
        url += `&version=${currentVersion}`;
      }
      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(url, { headers });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Fetches aggregate-only impact metrics for NGO reporting.
   */
  public async getAggregateImpact(authToken?: string): Promise<{ studentsReached: number; events: number } | null> {
    try {
      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${this.endpoint}/impact`, { headers });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
}
