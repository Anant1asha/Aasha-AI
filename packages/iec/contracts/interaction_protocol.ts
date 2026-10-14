/**
 * AASHA AIOS — IEC Interaction Protocol
 * Path: Aasha-AI/packages/iec/contracts/interaction_protocol.ts
 *
 * Decoupled bi-directional interaction protocol between AASHA host and Experience widgets.
 * INVARIANT: Widget events provide observable evidence; TEAS determines learning interpretation.
 */

// Host -> Experience commands
export type HostToExperienceMessageType =
  | 'SET_WIDGET_STATE'
  | 'HIGHLIGHT_ELEMENT'
  | 'ANNOTATE_ELEMENT'
  | 'REVEAL_ELEMENT';

export interface HostToExperienceMessage {
  type: HostToExperienceMessageType;
  payload: {
    state?: Record<string, any>;
    selector?: string;
    annotationText?: string;
    targetId?: string;
  };
}

// Experience -> Host events
export type ExperienceToHostEventType =
  | 'INTERACTION_STARTED'
  | 'INTERACTION_COMPLETED'
  | 'STATE_CHANGED'
  | 'SUCCESS'
  | 'MISCONCEPTION_SIGNAL'
  | 'RESET'
  | 'EXPERIENCE_COMPLETED';

export interface ExperienceToHostEvent {
  type: ExperienceToHostEventType;
  experience_id: string;
  timestamp: number;
  payload: {
    interaction_id?: string;
    state_delta?: Record<string, any>;
    misconception_id?: string;
    trigger?: string;
    details?: Record<string, any>;
  };
}

export class InteractionProtocolValidator {
  /**
   * Validates outgoing event payload to ensure no direct mastery/learning authority mutation.
   */
  public static validateEvent(event: ExperienceToHostEvent): { valid: boolean; reason?: string } {
    if (!event.experience_id) {
      return { valid: false, reason: 'MISSING_EXPERIENCE_ID' };
    }
    if (!event.type) {
      return { valid: false, reason: 'MISSING_EVENT_TYPE' };
    }

    // Invariant: Widgets must not emit direct mastery updates or TEAS mutations
    const payloadKeys = Object.keys(event.payload || {});
    const forbiddenKeys = ['mastery_score', 'mastery_level', 'teas_decision', 'learning_authority'];
    for (const key of forbiddenKeys) {
      if (payloadKeys.includes(key)) {
        return {
          valid: false,
          reason: `FORBIDDEN_AUTHORITY_MUTATION: Experience widget attempted to emit '${key}'. Mastery is exclusively governed by TEAS.`,
        };
      }
    }

    return { valid: true };
  }
}
