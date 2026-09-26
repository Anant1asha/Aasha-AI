/**
 * ============================================================================
 * AASHA Autonomous Learning Architecture - Integration Adapter Contracts
 * Path: Aasha-AI/packages/adapters/contracts.ts
 * 
 * Strict, typed anti-corruption layer for zero-rewrite orchestration between:
 * - Aasha-AI Core Engines (v6_compiler, math_insulator, chapter-contract-manager)
 * - n8n Edge Webhook Ingress (CErvPWULI5Yaikwe)
 * - Hatchable / PostgreSQL Persistence
 * - Next.js Teacher Studio (annanth-aasha-foundationweb)
 * ============================================================================
 */

// ============================================================================
// 1. JobContract & State Machine Definitions
// ============================================================================

export type JobLifecycleState =
  | 'CREATED'
  | 'QUEUED'
  | 'INGESTING'
  | 'STRUCTURING'
  | 'GENERATING'
  | 'COMPILING'
  | 'QA'
  | 'READY_FOR_REVIEW'
  | 'APPROVED'
  | 'DEPLOYED'
  | 'QUARANTINED'
  | 'FAILED'
  | 'BLOCKED'
  | 'CONTRADICTED'
  | 'REJECTED';

export interface StateTransitionLog {
  readonly from_state: JobLifecycleState | null;
  readonly to_state: JobLifecycleState;
  readonly timestamp_utc: string; // ISO 8601
  readonly triggered_by: string;   // e.g., 'orchestrator', 'qa_gate', 'teacher_ui'
  readonly reason?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface JobContract {
  readonly job_id: string; // UUID v4
  readonly version: number; // Increment on revisions (v1, v2, etc.)
  /** Explicit execution classification; DEMO jobs cannot be certified or promoted. */
  execution_mode?: 'DEMO';
  status: JobLifecycleState;
  readonly created_at: string;
  updated_at: string;
  readonly handoff_envelope: HandoffEnvelope;
  
  // Progress tracking
  progress_percentage: number; // 0 to 100
  current_phase: string;
  state_history: StateTransitionLog[];

  // Output Artifact & Audit References
  artifact_hash?: string; // SHA-256 of compiled standalone HTML
  contract_hash?: string; // SHA-256 of frozen Section 24 contract.yaml
  manifest_hash?: string; // SHA-256 of ArtifactManifest
  certification_hash?: string; // SHA-256 of CertificationCertificate
  
  // Error handling & repair limits
  repair_attempt_count: number; // Strictly bounded <= 2
  max_repair_attempts: number;  // Default: 2
  latest_diagnostic?: DiagnosticDossier;
}

// ============================================================================
// 2. HandoffEnvelope (Ingress Payload)
// ============================================================================

export interface HandoffEnvelope {
  readonly document_id: string;
  readonly school_name: string;
  readonly grade?: number | string; // Normalized or source label (e.g. 8, "Year 8", "Grade 5")
  readonly subject: string; // Universal/Curriculum-agnostic
  readonly topic: string;
  readonly target_language?: string; // e.g. 'hi-en', 'hi', 'en'
  
  readonly pdf_meta: {
    readonly filename: string;
    readonly file_size_bytes: number;
    readonly pdf_sha256: string;
    readonly binary_storage_pointer?: string; // S3, local path, or Hatchable URI
    readonly total_pages?: number;
    readonly board?: string; // e.g. 'NCERT', 'CBSE', 'ICSE', 'STATE_BOARD', 'UNKNOWN'
    readonly syllabus_standard?: string;
  };

  readonly ingress_timestamp: string;
  readonly ingress_source: 'n8n_webhook' | 'studio_direct' | 'cli';
}

// ============================================================================
// 3. ContextBus (Inter-Agent Immutable Memory Bus)
// ============================================================================

export interface ExerciseItem {
  readonly exercise_id: string;
  readonly question_raw: string;
  readonly question_shielded: string; // Post-math insulator with __AASHA_MATH_X__
  readonly options?: readonly string[];
  readonly correct_answer_token?: string;
  readonly four_tier_hints: readonly [string, string, string, string]; // Exactly 4 progressive hints
  readonly anti_spoiler_hash: string;
  readonly difficulty: 'easy' | 'medium' | 'hard';
  readonly source_ref?: {
    readonly page?: number;
    readonly bbox?: readonly [number, number, number, number];
    readonly original_index?: number;
  };
}

export interface BilingualVocabularyItem {
  readonly original_word: string;
  readonly translated_word: string;
  readonly phonetic_transliteration?: string;
  readonly contextual_explanation: string;
}

export interface AnalysisAgentOutput {
  readonly frozen_at: string;
  readonly syllabus_coverage_matrix: readonly string[];
  readonly extracted_exercises: readonly ExerciseItem[];
  readonly core_concepts: readonly string[];
  readonly formulas_detected: readonly string[];
}

export interface DesignAgentOutput {
  readonly frozen_at: string;
  readonly matched_foundation_id: `F${string}`; // e.g., 'F01', 'F02', ..., 'F20'
  readonly experience_template_name: string;      // e.g., 'Escape Run', 'MicroSims'
  readonly section_24_contract_yaml: string;      // Deterministic Section 24 specification
}

export interface AssessmentAgentOutput {
  readonly frozen_at: string;
  readonly validated_exercises: readonly ExerciseItem[];
  readonly total_exercises: number;
  readonly anti_spoiler_audit_passed: boolean;
}

export interface LLEAgentOutput {
  readonly frozen_at: string;
  readonly vocabulary_glossary: readonly BilingualVocabularyItem[];
  readonly unshielded_math_safe: boolean; // Math tokens untouched during translation
  readonly translation_locale: string;
}

export interface ContextBusState {
  readonly job_id: string;
  readonly stage: 'ANALYSIS' | 'FORK_JOIN' | 'ASSEMBLY' | 'FROZEN';
  analysis?: Readonly<AnalysisAgentOutput>;
  design?: Readonly<DesignAgentOutput>;
  assessment?: Readonly<AssessmentAgentOutput>;
  lle?: Readonly<LLEAgentOutput>;
}

// ============================================================================
// 4. ArtifactManifest (Cryptographic Release Ledger)
// ============================================================================

export interface FoundationBinding {
  readonly foundation_id: string; // e.g., 'F01'
  readonly foundation_version: string; // Semantic version or commit hash
  readonly registry_entry_path: string; // Path in experience_registry/
}

export interface ArtifactManifest {
  readonly manifest_version: '1.0.0';
  readonly job_id: string;
  readonly revision_number: number;
  readonly compiled_timestamp: string;
  
  // Content-addressed cryptographic hashes
  readonly artifact_hash: string;       // SHA-256 of compiled standalone HTML
  readonly contract_hash: string;       // SHA-256 of contract.yaml
  readonly source_pdf_hash: string;     // SHA-256 of incoming textbook PDF
  readonly canonical_ir_hash: string;   // SHA-256 of the Intermediate Representation
  
  readonly foundation_bindings: readonly FoundationBinding[];
  readonly total_file_size_bytes: number; // Must enforce <= 20 MB (20,971,520 bytes)
  readonly runtime_specs: {
    readonly requires_internet: false;   // Strictly 100% offline capable
    readonly dependencies_inlined: true;
    readonly math_renderer: 'KaTeX' | 'MathJax' | 'DualInline';
  };
}

// ============================================================================
// 5. DiagnosticDossier (Bounded Failure & Repair Packet)
// ============================================================================

export type SuspectOwner =
  | 'MATH_INSULATOR'
  | 'QUESTION_VALIDATOR'
  | 'LLM_ROUTER'
  | 'V6_COMPILER'
  | 'STATIC_L_TRUTH_GATE'
  | 'DYNAMIC_CDP_GATE';

export interface DiagnosticDossier {
  readonly failure_id: string;
  readonly job_id: string;
  readonly timestamp: string;
  readonly repair_attempt: number; // 1 or 2
  readonly component_id: string;
  readonly suspect_owner: SuspectOwner;
  readonly failure_code: string; // e.g., 'MATH_TOKEN_COLLISION', 'VIEWPORT_OVERFLOW', 'SPOILER_LEAK'
  readonly error_message: string;
  readonly minimal_repair_scope: {
    readonly targeted_file?: string;
    readonly targeted_exercise_id?: string;
    readonly corrective_prompt_hint?: string;
  };
  readonly evidence_refs: {
    readonly stdout_log?: string;
    readonly failing_dom_snippet?: string;
    readonly cdp_viewport_metrics?: {
      readonly scroll_height: number;
      readonly window_height: number;
      readonly device_name: string;
    };
  };
}

// ============================================================================
// 6. CertificationCertificate (QA Gate Cryptographic Seal)
// ============================================================================

export interface ViewportVerificationResult {
  readonly device_name: string;
  readonly width: number;
  readonly height: number;
  readonly passed: boolean;
  readonly actual_scroll_height: number;
  readonly allowable_scroll_height: number;
}

export interface CertificationCertificate {
  readonly certificate_id: string;
  readonly job_id: string;
  readonly certified_at: string;
  readonly artifact_hash: string;

  readonly static_ltruth_benchmark: {
    readonly score: number; // Must be 100 to pass
    readonly spoilers_detected: number; // Strictly 0
    readonly math_collisions_detected: number; // Strictly 0
    readonly total_exercises_verified: number;
    readonly exercise_reachability_ratio: number; // 100% reachability (1.0)
    readonly passed: boolean;
  };

  readonly dynamic_cdp_benchmark: {
    readonly viewports_tested: readonly ViewportVerificationResult[];
    readonly total_console_errors: number; // Strictly 0
    readonly bilingual_word_tap_passed: boolean;
    readonly simulation_events_verified: boolean;
    readonly passed: boolean;
  };

  readonly certification_seal: string; // HMAC-SHA256 signature validating gate outputs
}

// ============================================================================
// 7. RevisionRequest (Teacher Feedback Loop)
// ============================================================================

export type RevisionCategory =
  | 'PEDAGOGICAL_CLARITY'
  | 'TRANSLATION_ACCURACY'
  | 'EXERCISE_REWORDING'
  | 'SIMULATION_CALIBRATION'
  | 'ACCESSIBILITY_FORMATTING'
  | 'CONTENT_ACCURACY'
  | 'MATHEMATICAL_CORRECTNESS'
  | 'MOBILE_LAYOUT';

export interface RevisionRequest {
  readonly revision_id: string;
  readonly original_job_id: string;
  readonly previous_artifact_hash: string;
  readonly requested_by: {
    readonly teacher_id: string;
    readonly teacher_name: string;
    readonly school_name: string;
  };
  readonly timestamp: string;
  readonly category: RevisionCategory;
  readonly affected_item_id?: string; // Exercise ID or section number
  readonly teacher_feedback: string;
  readonly priority: 'NORMAL' | 'HIGH';
  readonly spawned_version: number; // Spawns new immutable v2 job
}

// ============================================================================
// 8. AASHA_PREVIEW_BRIDGE (PostMessage Sandboxed Event Schema)
// ============================================================================

export type PreviewBridgeEventType =
  | 'PREVIEW_READY'
  | 'EXERCISE_COMPLETED'
  | 'SIMULATION_EVENT'
  | 'TEAS_UPDATE'
  | 'BRIDGE_HEARTBEAT';

export interface PreviewReadyPayload {
  readonly title: string;
  readonly total_exercises: number;
  readonly foundation_id: string;
  readonly engine_version: string;
}

export interface ExerciseCompletedPayload {
  readonly exercise_id: string;
  readonly attempts_taken: number;
  readonly hints_used: number; // 0 to 4
  readonly is_correct: boolean;
  readonly time_spent_seconds: number;
}

export interface SimulationEventPayload {
  readonly event_name: string;
  readonly parameters: Record<string, number | string | boolean>;
  readonly user_action_count: number;
}

export interface TEASUpdatePayload {
  readonly current_teas_score: number; // 0.00 to 1.00
  readonly engagement_level: 'LOW' | 'MEDIUM' | 'OPTIMAL' | 'FRUSTRATED';
  readonly concept_mastery_vector: Record<string, number>;
}

export type BridgePayloadMap = {
  PREVIEW_READY: PreviewReadyPayload;
  EXERCISE_COMPLETED: ExerciseCompletedPayload;
  SIMULATION_EVENT: SimulationEventPayload;
  TEAS_UPDATE: TEASUpdatePayload;
  BRIDGE_HEARTBEAT: { readonly timestamp: number };
};

export interface AASHA_PREVIEW_BRIDGE<T extends PreviewBridgeEventType = PreviewBridgeEventType> {
  readonly source: 'AASHA_SANDBOXED_IFRAME';
  readonly target: 'AASHA_TEACHER_STUDIO';
  readonly type: T;
  readonly job_id: string;
  readonly nonce: string; // Cryptographic session nonce
  readonly artifact_hash: string;
  readonly timestamp: number;
  readonly sequence: number;
  readonly payload: BridgePayloadMap[T];
}

// Type guard for runtime PostMessage verification
export function isAashaPreviewBridgeMessage(data: unknown): data is AASHA_PREVIEW_BRIDGE {
  if (typeof data !== 'object' || data === null) return false;
  const candidate = data as Record<string, unknown>;
  return (
    candidate.source === 'AASHA_SANDBOXED_IFRAME' &&
    candidate.target === 'AASHA_TEACHER_STUDIO' &&
    typeof candidate.type === 'string' &&
    typeof candidate.job_id === 'string' &&
    typeof candidate.nonce === 'string' &&
    typeof candidate.artifact_hash === 'string' &&
    typeof candidate.timestamp === 'number' &&
    typeof candidate.sequence === 'number' &&
    typeof candidate.payload === 'object' &&
    candidate.payload !== null
  );
}
