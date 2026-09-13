/**
 * AASHA AIOS — Stateful V6 Semantic Event Bus & Learner State Engine
 * Implements event-sourcing, TEAS mastery calculation (60% historical + 40% recent),
 * and local offline ledger persistence.
 */

export interface SemanticEvent {
  eventId: string; // UUID v4 or deterministic SHA-256 hash
  timestamp: string; // ISO 8601
  eventType:
    | 'learner_action'
    | 'state_entered'
    | 'interaction_started'
    | 'interaction_completed'
    | 'attempt_submitted'
    | 'response_evaluated'
    | 'misconception_detected'
    | 'evidence_generated'
    | 'mastery_updated'
    | 'adaptation_triggered';
  pseudonymousLearnerId: string;
  chapterId: string;
  objectiveId?: string;
  conceptId?: string;
  payload: Record<string, any>;
}

export interface MasteryScore {
  conceptId: string;
  historicalScore: number; // 60% weight
  recentScore: number;     // 40% weight
  compositeMastery: number; // Combined (0.0 to 1.0)
  totalAttempts: number;
  lastUpdated: string;
}

export class V6RuntimeBus {
  private eventLog: SemanticEvent[] = [];
  private masteryStore: Map<string, MasteryScore> = new Map();
  private listeners: Array<(event: SemanticEvent) => void> = [];
  private storageKey: string;

  constructor(chapterId: string, pseudonymousLearnerId = 'learner_local_anon') {
    this.storageKey = `aasha_v6_ledger_${chapterId}_${pseudonymousLearnerId}`;
    this.loadLocalLedger();
  }

  /**
   * Emits a canonical semantic event onto the bus.
   */
  public emit(event: Omit<SemanticEvent, 'eventId' | 'timestamp'>): SemanticEvent {
    const fullEvent: SemanticEvent = {
      ...event,
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    this.eventLog.push(fullEvent);
    this.processEvent(fullEvent);
    this.saveLocalLedger();

    // Dispatch to subscribers
    for (const listener of this.listeners) {
      try {
        listener(fullEvent);
      } catch (err) {
        console.error('Error in V6RuntimeBus event listener:', err);
      }
    }

    return fullEvent;
  }

  /**
   * Subscribes to events on the semantic bus.
   */
  public subscribe(callback: (event: SemanticEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Process event to update state and TEAS mastery score.
   */
  private processEvent(event: SemanticEvent): void {
    if (event.eventType === 'response_evaluated' && event.conceptId) {
      const isCorrect: boolean = event.payload.isCorrect === true;
      const conceptId = event.conceptId;
      const current = this.masteryStore.get(conceptId) || {
        conceptId,
        historicalScore: 0.5,
        recentScore: 0.5,
        compositeMastery: 0.5,
        totalAttempts: 0,
        lastUpdated: event.timestamp,
      };

      const scoreDelta = isCorrect ? 1.0 : 0.0;
      const newAttempts = current.totalAttempts + 1;

      // Sliding window: recent = latest score, historical = previous composite
      const newRecent = scoreDelta;
      const newHistorical = (current.historicalScore * (newAttempts - 1) + current.recentScore) / newAttempts;
      const composite = 0.6 * newHistorical + 0.4 * newRecent;

      const updated: MasteryScore = {
        conceptId,
        historicalScore: parseFloat(newHistorical.toFixed(4)),
        recentScore: parseFloat(newRecent.toFixed(4)),
        compositeMastery: parseFloat(composite.toFixed(4)),
        totalAttempts: newAttempts,
        lastUpdated: event.timestamp,
      };

      this.masteryStore.set(conceptId, updated);

      // Emit mastery_updated event
      this.emit({
        eventType: 'mastery_updated',
        pseudonymousLearnerId: event.pseudonymousLearnerId,
        chapterId: event.chapterId,
        conceptId: event.conceptId,
        payload: {
          conceptId,
          compositeMastery: updated.compositeMastery,
          isMastered: updated.compositeMastery >= 0.8,
        },
      });
    }
  }

  /**
   * Retrieves current mastery score for a concept.
   */
  public getMastery(conceptId: string): MasteryScore {
    return (
      this.masteryStore.get(conceptId) || {
        conceptId,
        historicalScore: 0.0,
        recentScore: 0.0,
        compositeMastery: 0.0,
        totalAttempts: 0,
        lastUpdated: new Date().toISOString(),
      }
    );
  }

  /**
   * Retrieves the immutable event log for audit & outbox sync.
   */
  public getEventLog(): readonly SemanticEvent[] {
    return this.eventLog;
  }

  /**
   * Loads ledger from localStorage if available (offline-first).
   */
  private loadLocalLedger(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.eventLog = parsed.eventLog || [];
          if (parsed.mastery) {
            this.masteryStore = new Map(Object.entries(parsed.mastery));
          }
        }
      } catch (e) {
        console.warn('Failed to load local ledger from localStorage:', e);
      }
    }
  }

  /**
   * Persists ledger to localStorage (offline-first).
   */
  private saveLocalLedger(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const masteryObj: Record<string, MasteryScore> = {};
        for (const [k, v] of this.masteryStore.entries()) {
          masteryObj[k] = v;
        }
        localStorage.setItem(
          this.storageKey,
          JSON.stringify({
            eventLog: this.eventLog,
            mastery: masteryObj,
          })
        );
      } catch (e) {
        console.warn('Failed to save local ledger to localStorage:', e);
      }
    }
  }
}
