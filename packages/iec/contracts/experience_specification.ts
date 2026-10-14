/**
 * AASHA AIOS — IEC Experience Specification
 * Path: Aasha-AI/packages/iec/contracts/experience_specification.ts
 *
 * Maps Canonical IR entities into typed IEC Experience Requirements.
 * Directly reuses Canonical IR schemas without creating parallel representations.
 */

import {
  CanonicalIR,
  LearningObjective,
  ConceptNode,
  MisconceptionEntity,
  CapabilityRequirement,
  VisualGrammar,
} from '../../canonical-ir/canonical_ir_schema';

import {
  PerformanceBudget,
  DeviceRequirements,
  ProviderClass,
  ImplementationStrategy,
} from './strategy_types';

export interface ControlledVariable {
  name: string;
  symbol: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
  concept_mapping_ref: string; // Traceable reference to ConceptNode ID
}

export interface ExperienceRequirement {
  experience_id: string; // e.g. "exp:math:c8:cubes:01"
  capability_id: string; // Category, e.g. "SIMULATION" | "DIAGRAM" | "GAME" | "3D_VISUALIZATION"
  
  // Traceable grounding in Canonical IR (Can be 1:many or many:1)
  tln_ids: string[];
  learning_objective_ids: string[];
  concept_ids: string[];
  misconception_ids: string[];

  // Pedagogical & interaction mechanics
  interaction_mechanism: string; // e.g. "slider_manipulation", "layer_peeling"
  variables: ControlledVariable[];
  
  // System contracts
  performance_budget: PerformanceBudget;
  device_requirements: DeviceRequirements;
  accessibility_requirements?: string[];
  
  // Observable Evidence expectations
  evidence_signals: string[];
}

export interface CandidateCapability {
  candidate_id: string;
  name: string;
  provider_class: ProviderClass;
  source_ref: string;
  license: string;
  offline_ready: boolean;
  mechanics: string[];
  supported_subjects: string[];
  supported_grades: number[];
}

export interface ExperiencePlan {
  plan_id: string;
  experience_id: string;
  selected_strategy: ImplementationStrategy;
  primary_candidate?: CandidateCapability;
  composed_candidates?: CandidateCapability[];
  rationale: string;
  created_at: string;
}

export class ExperienceSpecificationMapper {
  /**
   * Traceably extracts an IEC ExperienceRequirement from Canonical IR.
   * Preserves Canonical IR as the sole authoritative learning specification.
   */
  public static fromCanonicalIR(
    cir: CanonicalIR,
    capabilityReq: CapabilityRequirement,
    experienceId: string
  ): ExperienceRequirement {
    return {
      experience_id: experienceId,
      capability_id: capabilityReq.id,
      tln_ids: [cir.chapter_id],
      learning_objective_ids: cir.learning_objectives.map(o => o.id),
      concept_ids: cir.concept_graph.map(c => c.id),
      misconception_ids: cir.misconceptions.map(m => m.id),
      interaction_mechanism: capabilityReq.interaction_type,
      variables: [],
      performance_budget: {
        maxBundleBytes: 20971520, // 20 MB ceiling
        targetFps: 60,
        pauseWhenHidden: true,
      },
      device_requirements: {
        supportedViewports: [320, 375, 414, 768],
        minTouchTargetPx: cir.visual_grammar.touch_target_min_px || 44,
        orientationSafe: true,
      },
      evidence_signals: cir.misconceptions.flatMap(m => m.observable_signals || []),
    };
  }
}
