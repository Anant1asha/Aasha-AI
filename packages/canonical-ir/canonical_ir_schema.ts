/**
 * AASHA AIOS — Canonical Prototype IR Schema (v1.1.0)
 * Mandatory, authoritative, language-neutral, stateful semantic specification.
 *
 * v1.1.0 additions (Phase 1 IR Hardening):
 *   + LearnerAgencyContract   — learner control, pacing, choice surfaces
 *   + MotivationIntent        — narrative, progression, reward cues
 *   + AccessibilityEnvelope   — device, language, developmental, screen-reader contract
 *   + ExperienceAcceptanceContract — measurable pass/fail criteria for the experience
 */

export interface OpaqueIdentity {
  id: string; // Format: <namespace>:<subject>:<class>:<topic>:<suffix>
  namespace: 'obj' | 'cpt' | 'misc' | 'cnt' | 'exp' | 'evd' | 'cap' | 'ast';
}

export interface LearningObjective {
  id: string; // e.g. "obj:math:c7:alg:01"
  description: string;
  bloom_level: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  success_criteria: string[];
  evidence_contracts: string[]; // Linked Evidence IDs
}

export interface ConceptNode {
  id: string; // e.g. "cpt:math:like_terms"
  name: string;
  name_hindi?: string;
  definition_raw: string;
  definition_math_insulated: string;
  definition_hindi?: string;
  definition_hindi_math_insulated?: string;
  prerequisite_ids: string[];
  child_concept_ids: string[];
}

export interface MisconceptionEntity {
  id: string; // e.g. "misc:math:add_unlike_terms"
  concept_id: string;
  name: string;
  description: string;
  description_hindi?: string;
  observable_signals: string[];
  confidence_weight: number; // 0.0 to 1.0
  remediation_strategy: string;
}

export interface ContentBlock {
  id: string; // e.g. "cnt:def:term"
  type: 'concept_def' | 'worked_example' | 'guided_step' | 'summary' | 'key_takeaway';
  concept_id: string;
  text_english: string;
  text_hindi?: string;
  text_hindi_math_insulated?: string;
  text_math_insulated: string;
  hindi_translation?: {
    phonetics: string; // Devanagari transliteration
    word_map: Record<string, string>; // WM dictionary entries
  };
  provenance_source: string;
  fidelity_score: number; // 0.0 to 1.0
}

export interface ExperienceState {
  id: string; // e.g. "state:intro"
  name: string;
  type: 'concept_card' | 'interactive_sim' | 'teas_assessment' | 'remediation_card';
  capability_id?: string;
  content_ids: string[];
  on_enter_events?: string[];
  on_exit_events?: string[];
}

export interface ExperienceTransition {
  from_state_id: string;
  to_state_id: string;
  trigger_event: string;
  condition_expression?: string; // e.g. "mastery >= 0.8"
}

export interface ExperienceGraph {
  initial_state_id: string;
  states: ExperienceState[];
  transitions: ExperienceTransition[];
}

export interface AssessmentOption {
  id: string;
  text: string;
  text_hindi?: string;
  text_hindi_math_insulated?: string;
  text_math_insulated: string;
  is_correct: boolean;
  misconception_id?: string;
  distractor_explanation: string; // Zero-spoiler diagnostic explanation
  distractor_explanation_hindi?: string;
  distractor_explanation_hindi_math_insulated?: string;
}

export interface AssessmentItem {
  id: string;
  objective_id: string;
  concept_id: string;
  question_type: 'mcq' | 'matching' | 'numerical' | 'manipulative_target';
  prompt: string;
  prompt_hindi?: string;
  prompt_hindi_math_insulated?: string;
  prompt_math_insulated: string;
  options: AssessmentOption[];
  hints: {
    H1_hook: string;
    H2_concept: string;
    H3_formula: string;
    H4_step: string;
  };
  hints_hindi?: {
    H1_hook: string;
    H2_concept: string;
    H3_formula: string;
    H4_step: string;
  };
  hints_hindi_math_insulated?: {
    H1_hook: string;
    H2_concept: string;
    H3_formula: string;
    H4_step: string;
  };
}

export interface CapabilityRequirement {
  id: string; // e.g. "cap:sim:balance_scale:v1"
  purpose: string;
  /** Exact registry mechanic tag; extensible as reusable resources are added. */
  interaction_type: string;
  license_constraint: 'MIT_NATIVE' | 'APACHE_2.0' | 'GPL_3.0_ISOLATED' | 'GEOGEBRA_REFERENCE_ONLY';
  sandbox_required: boolean;
}

export type SourceInventoryKind = 'chapter_concept' | 'worked_example' | 'activity' | 'textbook_exercise' | 'other';
export type SourceInventoryGranularity = 'concept' | 'worked_example' | 'activity' | 'activity_step' | 'question' | 'question_part' | 'other';

export interface SourceDocument {
  id: string;
  file_name: string;
  sha256: string;
  page_count: number;
}

export interface SourceInventoryItem {
  id: string;
  kind: SourceInventoryKind;
  pages: number[];
  label: string;
  document_id?: string;
  /** Smallest independently traceable source unit; required before a FULL claim. */
  granularity?: SourceInventoryGranularity;
}

export interface SourceCoverageEntry {
  source_item_id: string;
  learning_target_ids: string[];
  assessment_item_ids: string[];
  coverage: 'FULL' | 'PARTIAL' | 'OMITTED';
  note?: string;
}

export interface SourceCoverageReport {
  status: 'FULL' | 'INCOMPLETE' | 'UNKNOWN' | 'INVALID';
  source_hash_status: 'UNVERIFIED' | 'VERIFIED' | 'MISMATCH' | 'MISSING';
  total_items: number;
  fully_covered: number;
  partial: number;
  omitted: number;
  unmapped: number;
  invalid_references: string[];
}

export interface LLECoverageReport {
  status: 'COMPLETE' | 'INCOMPLETE' | 'UNKNOWN';
  hindi_required: boolean;
  translatable_fields: number;
  translated_fields: number;
  coverage_percent: number;
  missing_fields: string[];
}

export interface VisualGrammar {
  spatial_model: 'card_stack' | 'split_canvas' | 'full_viewport';
  density_tier: 'compact_mobile' | 'standard';
  primary_color_theme: string;
  touch_target_min_px: number; // Must be >= 44
}

export interface AdaptivePolicyEnvelope {
  max_retries: number;
  dda_difficulty_step: number;
  remediation_threshold: number; // e.g. 0.6
  teas_historical_weight: number; // Default 0.60
  teas_recent_weight: number; // Default 0.40
}

/**
 * NEW in v1.1.0 — Spec §7: Learner Agency Contract
 * Describes what choices, control surfaces, and pacing authority the learner has.
 */
export interface LearnerAgencyContract {
  self_pacing_allowed: boolean; // Can learner control card advancement?
  can_skip_simulation: boolean; // Is the simulation mandatory or skippable?
  hint_request_allowed: boolean; // Can learner explicitly request hints?
  max_hints_per_item: number; // How many hints (H1-H4) can be requested?
  preferred_modality?: 'visual' | 'textual' | 'kinesthetic' | 'multimodal';
}

/**
 * NEW in v1.1.0 — Spec §7: Motivation Intent
 * Declares narrative framing, progression motivation, and reward cues.
 * Does not define implementation details — those belong to the runtime.
 */
export interface MotivationIntent {
  narrative_frame?: string; // e.g. "Be a mathmagician balancing the scales"
  xp_reward_warmup: number; // Points for completing warm-up tier
  xp_reward_deep_dive: number; // Points for completing deep-dive tier
  xp_reward_boss: number; // Points for completing boss tier
  badge_id?: string; // Opaque badge identifier awarded on chapter mastery
  streak_contribution: boolean; // Does this chapter contribute to daily streak?
  celebration_intensity: 'subtle' | 'standard' | 'elaborate';
}

/**
 * NEW in v1.1.0 — Spec §7: Accessibility / Device / Developmental Envelope
 * Declares the target context for rendering and adaptation decisions.
 */
export interface AccessibilityEnvelope {
  // Device
  min_viewport_width_px: number; // e.g. 360
  min_viewport_height_px: number; // e.g. 640
  target_aspect_ratios: ('16:9' | '19.5:9' | '20:9')[]; // Mobile aspect ratio targets
  touch_target_min_px: number; // Must be >= 44 (duplicates VisualGrammar for explicit contract)
  // Language / Developmental
  primary_language: string; // BCP47, e.g. 'hi', 'en'
  bilingual_pair?: string; // BCP47, e.g. 'en'
  reading_grade_level: number; // Flesch-Kincaid target grade
  // Accessibility
  screen_reader_compatible: boolean;
  high_contrast_mode_supported: boolean;
  reduced_motion_supported: boolean;
  // Performance
  max_bundle_size_mb: number; // Hard ceiling: 20MB
  offline_first: boolean; // Must always be true for AASHA
  cdn_dependencies_allowed: false; // Hard invariant: never allow CDN
}

/**
 * NEW in v1.1.0 — Spec §7: Experience Acceptance Contract
 * Measurable, verifiable pass/fail criteria that QAAgent uses as final gate.
 * HIL cannot approve a chapter that fails its own acceptance contract.
 */
export interface ExperienceAcceptanceContract {
  // Learning outcomes
  min_objectives_covered: number; // Minimum % of LearningObjectives that must be reachable
  min_assessment_items: number; // Minimum # of assessment items
  all_misconceptions_linked: boolean; // Every wrong option must map to a MisconceptionEntity
  // Technical invariants
  zero_external_requests: true; // Hard invariant: no CDN/network calls
  zero_spoilers_in_distractors: true; // Hard invariant: zero-spoiler rule
  zero_math_lle_collisions: true; // Hard invariant: math insulation must hold
  scroll_height_lte_viewport: true; // Hard invariant: no scroll on any target viewport
  // Evidence
  full_event_trace_verifiable: boolean; // V6RuntimeBus must produce complete trace
  mastery_threshold_measurable: boolean; // TEAS composite must converge to a score
}

export interface CanonicalIR {
  schema_version: '1.1.0';

  chapter_metadata: {
    chapter_id: string; // e.g. "c7_math_algebraic_expressions"
    title: string;
    grade: number;
    subject: string;
    board: string;
    source_pdf_hash: string;
    /** Ordered source manifest; source_pdf_hash remains for legacy single-PDF IRs. */
    source_documents?: SourceDocument[];
  };
  learning_objectives: LearningObjective[];
  concept_graph: ConceptNode[];
  misconceptions: MisconceptionEntity[];
  content_blocks: ContentBlock[];
  experience_graph: ExperienceGraph;
  visual_grammar: VisualGrammar;
  assessment_items: AssessmentItem[];
  capability_requirements: CapabilityRequirement[];
  /** Extracted source inventory and explicit mappings are required before coverage may be claimed. */
  source_inventory_scope?: 'FULL_CHAPTER' | 'PARTIAL' | 'UNKNOWN';
  source_inventory?: SourceInventoryItem[];
  source_coverage?: SourceCoverageEntry[];
  adaptive_policy: AdaptivePolicyEnvelope;

  // v1.1.0 — 4 new mandatory fields (Spec §7)
  learner_agency: LearnerAgencyContract;
  motivation_intent: MotivationIntent;
  accessibility_envelope: AccessibilityEnvelope;
  experience_acceptance_contract: ExperienceAcceptanceContract;

  compilation_manifest: {
    compiled_at: string;
    compiler_version: string;
    source_artifacts: string[];
    ir_hash: string;
  };
}

/**
 * Validates invariant integrity of a Canonical IR instance (v1.1.0).
 */
export function validateCanonicalIR(ir: CanonicalIR): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!ir.chapter_metadata || !ir.chapter_metadata.chapter_id) {
    errors.push('Missing chapter_metadata.chapter_id');
  }

  const sourcePdfHash = ir.chapter_metadata?.source_pdf_hash;
  if (!/^sha256:[a-f0-9]{64}$/i.test(sourcePdfHash || '')) {
    errors.push('chapter_metadata.source_pdf_hash must be the SHA-256 digest of the supplied source PDF (sha256:<64 hexadecimal characters>); descriptive placeholders are not valid provenance');
  }
  const documents = ir.chapter_metadata?.source_documents;
  if (documents !== undefined) {
    if (!Array.isArray(documents) || documents.length === 0) errors.push('chapter_metadata.source_documents must be a non-empty array when provided');
    const documentIds = new Set<string>();
    for (const document of documents || []) {
      if (!document.id?.trim() || documentIds.has(document.id)) errors.push(`chapter_metadata.source_documents contains a missing or duplicate document ID: '${document.id}'`);
      documentIds.add(document.id);
      if (!document.file_name?.trim()) errors.push(`Source document '${document.id}' is missing file_name`);
      if (!/^([a-f0-9]{64})$/i.test(document.sha256 || '')) errors.push(`Source document '${document.id}' sha256 must be 64 hexadecimal characters`);
      if (!Number.isInteger(document.page_count) || document.page_count < 1) errors.push(`Source document '${document.id}' page_count must be a positive integer`);
    }
    if (documents.length > 0 && /^sha256:[a-f0-9]{64}$/i.test(sourcePdfHash || '') &&
        documents[0].sha256.toLowerCase() !== sourcePdfHash.slice('sha256:'.length).toLowerCase()) {
      errors.push('chapter_metadata.source_pdf_hash must match the first source_documents entry for backward-compatible provenance');
    }
  }

  const sourceCoverage = evaluateSourceCoverage(ir);
  errors.push(...sourceCoverage.invalid_references);

  // 1. Schema version check
  if ((ir as any).schema_version !== '1.1.0') {
    errors.push(`Canonical IR schema_version must be '1.1.0' (got '${(ir as any).schema_version}')`);
  }

  // 2. Minimum Touch Target Rule (both VisualGrammar + AccessibilityEnvelope)
  if (ir.visual_grammar && ir.visual_grammar.touch_target_min_px < 44) {
    errors.push(`VisualGrammar touch_target_min_px must be >= 44px (got ${ir.visual_grammar.touch_target_min_px}px)`);
  }
  if (ir.accessibility_envelope && ir.accessibility_envelope.touch_target_min_px < 44) {
    errors.push(`AccessibilityEnvelope touch_target_min_px must be >= 44px (got ${ir.accessibility_envelope.touch_target_min_px}px)`);
  }

  // 3. Zero Answer Leakage Validation in Distractor Explanations
  const spoilerRegex = /\b(is|giving|becomes|instead of|to get|yielding|result is|should be)\b/i;
  for (const item of ir.assessment_items || []) {
    for (const opt of item.options || []) {
      if (!opt.is_correct && opt.distractor_explanation) {
        if (spoilerRegex.test(opt.distractor_explanation)) {
          errors.push(`Answer spoiler detected in option ${opt.id} distractor explanation: "${opt.distractor_explanation}"`);
        }
      }
    }
  }

  // 4. Misconception Binding Integrity
  const miscIds = new Set((ir.misconceptions || []).map((m) => m.id));
  for (const item of ir.assessment_items || []) {
    for (const opt of item.options || []) {
      if (!opt.is_correct && opt.misconception_id) {
        if (!miscIds.has(opt.misconception_id)) {
          errors.push(`Option ${opt.id} references unknown misconception ID: ${opt.misconception_id}`);
        }
      }
    }
  }

  // 5. v1.1.0: Accessibility Envelope offline invariant
  if (ir.accessibility_envelope) {
    if (!ir.accessibility_envelope.offline_first) {
      errors.push('AccessibilityEnvelope: offline_first must be true — AASHA never requires network for learning');
    }
    if (ir.accessibility_envelope.max_bundle_size_mb > 20) {
      errors.push(`AccessibilityEnvelope: max_bundle_size_mb must be <= 20 (got ${ir.accessibility_envelope.max_bundle_size_mb})`);
    }
  } else {
    errors.push('Missing accessibility_envelope (required in v1.1.0)');
  }

  // 6. v1.1.0: Experience Acceptance Contract hard invariants
  if (ir.experience_acceptance_contract) {
    const eac = ir.experience_acceptance_contract;
    if (!eac.zero_external_requests) {
      errors.push('ExperienceAcceptanceContract: zero_external_requests must be true');
    }
    if (!eac.zero_spoilers_in_distractors) {
      errors.push('ExperienceAcceptanceContract: zero_spoilers_in_distractors must be true');
    }
    if (!eac.zero_math_lle_collisions) {
      errors.push('ExperienceAcceptanceContract: zero_math_lle_collisions must be true');
    }
    if (!eac.scroll_height_lte_viewport) {
      errors.push('ExperienceAcceptanceContract: scroll_height_lte_viewport must be true');
    }
    if (ir.assessment_items && ir.assessment_items.length < eac.min_assessment_items) {
      errors.push(`ExperienceAcceptanceContract: min_assessment_items = ${eac.min_assessment_items} but only ${ir.assessment_items.length} found`);
    }
  } else {
    errors.push('Missing experience_acceptance_contract (required in v1.1.0)');
  }

  // 7. v1.1.0: Learner Agency Contract present
  if (!ir.learner_agency) {
    errors.push('Missing learner_agency (required in v1.1.0)');
  }

  // 8. v1.1.0: Motivation Intent present
  if (!ir.motivation_intent) {
    errors.push('Missing motivation_intent (required in v1.1.0)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/** Deterministic source-to-output coverage status; absence is UNKNOWN, never complete. */
export function evaluateSourceCoverage(ir: Pick<CanonicalIR, 'source_inventory' | 'source_coverage' | 'source_inventory_scope' | 'content_blocks' | 'concept_graph' | 'assessment_items'> & { chapter_metadata?: Pick<CanonicalIR['chapter_metadata'], 'source_documents'> }): SourceCoverageReport {
  const inventory = ir.source_inventory;
  if (!Array.isArray(inventory) || inventory.length === 0) {
    return { status: 'UNKNOWN', source_hash_status: 'UNVERIFIED', total_items: 0, fully_covered: 0, partial: 0, omitted: 0, unmapped: 0, invalid_references: [] };
  }

  const invalid: string[] = [];
  if (ir.source_inventory_scope !== undefined && !['FULL_CHAPTER', 'PARTIAL', 'UNKNOWN'].includes(ir.source_inventory_scope)) {
    invalid.push(`Unsupported source_inventory_scope '${ir.source_inventory_scope}'`);
  }
  const documents = ir.chapter_metadata?.source_documents || [];
  const documentsById = new Map(documents.map((document) => [document.id, document]));
  if (documents.length > 0 && new Set(documents.map((document) => document.id)).size !== documents.length) invalid.push('Source document manifest contains duplicate document IDs');
  const seen = new Set<string>();
  for (const item of inventory) {
    if (!item.id || seen.has(item.id)) invalid.push(`Source inventory contains a missing or duplicate item ID: '${item.id}'`);
    seen.add(item.id);
    if (!['chapter_concept', 'worked_example', 'activity', 'textbook_exercise', 'other'].includes(item.kind)) {
      invalid.push(`Source inventory item '${item.id}' has an unsupported kind '${item.kind}'`);
    }
    if (!Array.isArray(item.pages) || item.pages.length === 0 || item.pages.some((page) => !Number.isInteger(page) || page < 1)) {
      invalid.push(`Source inventory item '${item.id}' must cite one or more positive integer PDF pages`);
    }
    if (documents.length > 1 && !item.document_id) invalid.push(`Source inventory item '${item.id}' must identify document_id when multiple source PDFs are declared`);
    if (item.document_id && !documentsById.has(item.document_id)) invalid.push(`Source inventory item '${item.id}' references unknown source document '${item.document_id}'`);
    const sourceDocument = item.document_id ? documentsById.get(item.document_id) : documents.length === 1 ? documents[0] : undefined;
    if (sourceDocument && Array.isArray(item.pages) && item.pages.some((page) => page > sourceDocument.page_count)) {
      invalid.push(`Source inventory item '${item.id}' cites a page beyond source document '${sourceDocument.id}' page_count ${sourceDocument.page_count}`);
    }
    if (!item.label?.trim()) invalid.push(`Source inventory item '${item.id}' is missing a readable label`);
    if (item.granularity && !['concept', 'worked_example', 'activity', 'activity_step', 'question', 'question_part', 'other'].includes(item.granularity)) {
      invalid.push(`Source inventory item '${item.id}' has unsupported granularity '${item.granularity}'`);
    }
  }

  const contentIds = new Set((ir.content_blocks || []).map((block) => block.id));
  const conceptIds = new Set((ir.concept_graph || []).map((concept) => concept.id));
  const assessmentIds = new Set((ir.assessment_items || []).map((item) => item.id));
  const entries = ir.source_coverage || [];
  const bySource = new Map<string, SourceCoverageEntry>();
  for (const entry of entries) {
    if (!seen.has(entry.source_item_id)) invalid.push(`Coverage entry references unknown source item '${entry.source_item_id}'`);
    if (bySource.has(entry.source_item_id)) invalid.push(`Coverage entry is duplicated for source item '${entry.source_item_id}'`);
    bySource.set(entry.source_item_id, entry);
    if (!['FULL', 'PARTIAL', 'OMITTED'].includes(entry.coverage)) invalid.push(`Source item '${entry.source_item_id}' has unsupported coverage status '${entry.coverage}'`);
    for (const target of entry.learning_target_ids || []) {
      if (!contentIds.has(target) && !conceptIds.has(target)) invalid.push(`Source item '${entry.source_item_id}' references unknown learning target '${target}'`);
    }
    for (const target of entry.assessment_item_ids || []) {
      if (!assessmentIds.has(target)) invalid.push(`Source item '${entry.source_item_id}' references unknown assessment item '${target}'`);
    }
    if (entry.coverage === 'FULL') {
      const item = inventory.find((candidate) => candidate.id === entry.source_item_id);
      const needsLearning = item?.kind !== 'textbook_exercise';
      const needsAssessment = item?.kind === 'textbook_exercise';
      const permittedGranularity: Record<SourceInventoryKind, SourceInventoryGranularity[]> = {
        chapter_concept: ['concept'],
        worked_example: ['worked_example'],
        activity: ['activity', 'activity_step'],
        textbook_exercise: ['question', 'question_part'],
        other: ['other'],
      };
      if (item && !permittedGranularity[item.kind].includes(item.granularity as SourceInventoryGranularity)) {
        invalid.push(`Source item '${item.id}' cannot be FULL without an independently traceable ${permittedGranularity[item.kind].join(' or ')} granularity`);
      }
      if (needsLearning && (entry.learning_target_ids || []).length === 0) invalid.push(`Source item '${entry.source_item_id}' cannot be FULL without a learning target`);
      if (needsAssessment && (entry.assessment_item_ids || []).length === 0) invalid.push(`Textbook exercise '${entry.source_item_id}' cannot be FULL without an assessment target`);
    }
  }

  let fullyCovered = 0, partial = 0, omitted = 0, unmapped = 0;
  for (const item of inventory) {
    const entry = bySource.get(item.id);
    if (!entry) { unmapped++; continue; }
    if (entry.coverage === 'FULL') fullyCovered++;
    else if (entry.coverage === 'PARTIAL') partial++;
    else omitted++;
  }
  const status = invalid.length
    ? 'INVALID'
    : ir.source_inventory_scope === 'FULL_CHAPTER' && fullyCovered === inventory.length
      ? 'FULL'
      : 'INCOMPLETE';
  return { status, source_hash_status: 'UNVERIFIED', total_items: inventory.length, fully_covered: fullyCovered, partial, omitted, unmapped, invalid_references: invalid };
}

/** Tracks actual English/Hindi field coverage; a language toggle alone is not LLE evidence. */
export function evaluateLLECoverage(ir: Pick<CanonicalIR, 'accessibility_envelope' | 'concept_graph' | 'content_blocks' | 'misconceptions' | 'assessment_items'>): LLECoverageReport {
  const hindiRequired = ir.accessibility_envelope?.primary_language?.toLowerCase().startsWith('hi') === true ||
    ir.accessibility_envelope?.bilingual_pair?.toLowerCase().startsWith('hi') === true;
  if (!hindiRequired) return { status: 'UNKNOWN', hindi_required: false, translatable_fields: 0, translated_fields: 0, coverage_percent: 0, missing_fields: [] };

  const missing: string[] = [];
  let total = 0, translated = 0;
  const count = (field: string, value?: string) => {
    total++;
    if (value?.trim()) translated++;
    else missing.push(field);
  };
  for (const concept of ir.concept_graph || []) count(`concept:${concept.id}:name_hindi`, concept.name_hindi);
  for (const block of ir.content_blocks || []) count(`content:${block.id}:text_hindi`, block.text_hindi);
  for (const misconception of ir.misconceptions || []) count(`misconception:${misconception.id}:description_hindi`, misconception.description_hindi);
  for (const item of ir.assessment_items || []) {
    count(`assessment:${item.id}:prompt_hindi`, item.prompt_hindi);
    for (const option of item.options || []) {
      count(`option:${option.id}:text_hindi`, option.text_hindi);
      if (!option.is_correct) count(`option:${option.id}:distractor_explanation_hindi`, option.distractor_explanation_hindi);
    }
    for (const hint of ['H1_hook', 'H2_concept', 'H3_formula', 'H4_step'] as const) {
      count(`assessment:${item.id}:hints_hindi.${hint}`, item.hints_hindi?.[hint]);
    }
  }
  const percent = total ? Math.round((translated / total) * 100) : 0;
  const status = total === 0 ? 'UNKNOWN' : missing.length ? 'INCOMPLETE' : 'COMPLETE';
  return { status, hindi_required: true, translatable_fields: total, translated_fields: translated, coverage_percent: percent, missing_fields: missing };
}
