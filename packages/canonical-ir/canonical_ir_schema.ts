/**
 * AASHA AIOS — Canonical Prototype IR Schema (v1.0.0)
 * Mandatory, authoritative, language-neutral, stateful semantic specification.
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
  definition_raw: string;
  definition_math_insulated: string;
  prerequisite_ids: string[];
  child_concept_ids: string[];
}

export interface MisconceptionEntity {
  id: string; // e.g. "misc:math:add_unlike_terms"
  concept_id: string;
  name: string;
  description: string;
  observable_signals: string[];
  confidence_weight: number; // 0.0 to 1.0
  remediation_strategy: string;
}

export interface ContentBlock {
  id: string; // e.g. "cnt:def:term"
  type: 'concept_def' | 'worked_example' | 'guided_step' | 'summary' | 'key_takeaway';
  concept_id: string;
  text_english: string;
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
  text_math_insulated: string;
  is_correct: boolean;
  misconception_id?: string;
  distractor_explanation: string; // Zero-spoiler diagnostic explanation
}

export interface AssessmentItem {
  id: string;
  objective_id: string;
  concept_id: string;
  question_type: 'mcq' | 'matching' | 'numerical' | 'manipulative_target';
  prompt: string;
  prompt_math_insulated: string;
  options: AssessmentOption[];
  hints: {
    H1_hook: string;
    H2_concept: string;
    H3_formula: string;
    H4_step: string;
  };
}

export interface CapabilityRequirement {
  id: string; // e.g. "cap:sim:balance_scale:v1"
  purpose: string;
  interaction_type: 'slider' | 'drag_drop' | 'balance_beam' | 'graph_plot' | 'circuit_switch';
  license_constraint: 'MIT_NATIVE' | 'APACHE_2.0' | 'GPL_3.0_ISOLATED' | 'GEOGEBRA_REFERENCE_ONLY';
  sandbox_required: boolean;
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

export interface CanonicalIR {
  schema_version: '1.0.0';
  chapter_metadata: {
    chapter_id: string; // e.g. "c7_math_algebraic_expressions"
    title: string;
    grade: number;
    subject: string;
    board: string;
    source_pdf_hash: string;
  };
  learning_objectives: LearningObjective[];
  concept_graph: ConceptNode[];
  misconceptions: MisconceptionEntity[];
  content_blocks: ContentBlock[];
  experience_graph: ExperienceGraph;
  visual_grammar: VisualGrammar;
  assessment_items: AssessmentItem[];
  capability_requirements: CapabilityRequirement[];
  adaptive_policy: AdaptivePolicyEnvelope;
  compilation_manifest: {
    compiled_at: string;
    compiler_version: string;
    source_artifacts: string[];
    ir_hash: string;
  };
}

/**
 * Validates invariant integrity of a Canonical IR instance.
 */
export function validateCanonicalIR(ir: CanonicalIR): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!ir.chapter_metadata || !ir.chapter_metadata.chapter_id) {
    errors.push('Missing chapter_metadata.chapter_id');
  }

  // 1. Minimum Touch Target Rule
  if (ir.visual_grammar && ir.visual_grammar.touch_target_min_px < 44) {
    errors.push(`Touch target min size must be >= 44px (got ${ir.visual_grammar.touch_target_min_px}px)`);
  }

  // 2. Zero Answer Leakage Validation in Distractor Explanations
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

  // 3. Misconception Binding Integrity
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

  return {
    valid: errors.length === 0,
    errors,
  };
}
