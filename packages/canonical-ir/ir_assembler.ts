import { CanonicalIR, validateCanonicalIR, AssessmentItem, MisconceptionEntity, ContentBlock, LearningObjective, LearnerAgencyContract, MotivationIntent, AccessibilityEnvelope, ExperienceAcceptanceContract, CapabilityRequirement, SourceInventoryItem, SourceCoverageEntry, SourceDocument } from './canonical_ir_schema.ts';
import { MathInsulator } from '../aasha-rules/math_insulator.ts';

function insulateOptionalTranslation(text?: string): string | undefined {
  if (!text) return undefined;
  const masked = MathInsulator.tokenize(text);
  return MathInsulator.wrapWithIsolation(MathInsulator.restore(masked.maskedText, masked.tokenMap));
}

export interface AgentProposalsInput {
  chapter_id: string;
  title: string;
  grade: number;
  subject: string;
  board: string;
  source_pdf_hash: string;
  source_documents?: SourceDocument[];
  raw_objectives: Array<{ description: string; bloom_level: string; success_criteria: string[] }>;
  raw_concepts: Array<{ name: string; name_hindi?: string; definition: string; definition_hindi?: string; prerequisites?: string[] }>;
  raw_learning_content?: Array<{
    source_item_id: string;
    concept_name: string;
    type: ContentBlock['type'];
    text_english: string;
    text_hindi?: string;
    fidelity_score?: number;
  }>;
  raw_misconceptions: Array<{ concept_name: string; name: string; description: string; description_hindi?: string; remediation: string }>;
  raw_assessments: Array<{
    objective_index: number;
    concept_name: string;
    question_type: string;
    prompt: string;
    prompt_hindi?: string;
    options: Array<{ text: string; text_hindi?: string; is_correct: boolean; distractor_explanation: string; distractor_explanation_hindi?: string; misconception_name?: string }>;
    hints: { H1: string; H2: string; H3: string; H4: string };
    hints_hindi?: { H1: string; H2: string; H3: string; H4: string };
  }>;
  raw_capabilities?: Array<Omit<CapabilityRequirement, 'id'> & { id?: string }>;
  source_inventory_scope?: CanonicalIR['source_inventory_scope'];
  source_inventory?: SourceInventoryItem[];
  source_coverage?: SourceCoverageEntry[];
  word_map?: Record<string, string>;
}


export class IRAssembler {
  /**
   * Deterministically normalizes specialist agent proposals into Canonical Prototype IR.
   */
  static assemble(input: AgentProposalsInput): { canonicalIR: CanonicalIR; validationErrors: string[] } {
    const chapterPrefix = `${input.subject.toLowerCase()}:c${input.grade}:${input.chapter_id}`;

    // 1. Resolve Learning Objectives with Opaque IDs
    const learning_objectives: LearningObjective[] = input.raw_objectives.map((obj, idx) => ({
      id: `obj:${chapterPrefix}:${(idx + 1).toString().padStart(2, '0')}`,
      description: obj.description,
      bloom_level: (obj.bloom_level || 'understand') as any,
      success_criteria: obj.success_criteria || [],
      evidence_contracts: [`evd:${chapterPrefix}:obj_${idx + 1}`],
    }));

    // 2. Resolve Concepts with Opaque IDs
    const conceptMap = new Map<string, string>(); // name -> opaque ID
    const concept_graph = input.raw_concepts.map((c, idx) => {
      const opaqueId = `cpt:${chapterPrefix}:c_${idx + 1}`;
      conceptMap.set(c.name, opaqueId);
      const masked = MathInsulator.tokenize(c.definition);
      const mathInsulated = MathInsulator.restore(masked.maskedText, masked.tokenMap);

      return {
        id: opaqueId,
        name: c.name,
        name_hindi: c.name_hindi,
        definition_raw: c.definition,
        definition_math_insulated: MathInsulator.wrapWithIsolation(mathInsulated),
        definition_hindi: c.definition_hindi,
        definition_hindi_math_insulated: insulateOptionalTranslation(c.definition_hindi),
        prerequisite_ids: (c.prerequisites || []).map((p) => conceptMap.get(p) || `cpt:prereq:${p}`),
        child_concept_ids: [],
      };
    });

    // 3. Resolve Misconceptions with Opaque IDs
    const miscMap = new Map<string, string>(); // name -> opaque ID
    const misconceptions: MisconceptionEntity[] = input.raw_misconceptions.map((m, idx) => {
      const opaqueId = `misc:${chapterPrefix}:m_${idx + 1}`;
      miscMap.set(m.name, opaqueId);
      const conceptId = conceptMap.get(m.concept_name) || concept_graph[0]?.id || `cpt:${chapterPrefix}:gen`;

      return {
        id: opaqueId,
        concept_id: conceptId,
        name: m.name,
        description: m.description,
        description_hindi: m.description_hindi,
        observable_signals: [`signal:${opaqueId}:incorrect_attempt`],
        confidence_weight: 0.85,
        remediation_strategy: m.remediation,
      };
    });

    // 4. Resolve Content Blocks
    const conceptContentBlocks: ContentBlock[] = input.raw_concepts.map((c, idx) => ({
      id: `cnt:${chapterPrefix}:def_${idx + 1}`,
      type: 'concept_def',
      concept_id: concept_graph[idx].id,
      text_english: c.definition,
      text_hindi: c.definition_hindi,
      text_hindi_math_insulated: insulateOptionalTranslation(c.definition_hindi),
      text_math_insulated: concept_graph[idx].definition_math_insulated,
      hindi_translation: input.word_map ? {
        phonetics: '',
        word_map: input.word_map,
      } : undefined,
      provenance_source: input.source_documents?.length
        ? `source-set:${input.source_documents.map((document) => `${document.id}=sha256:${document.sha256}`).join('|')}`
        : `pdf:${input.source_pdf_hash}`,
      fidelity_score: 1.0,
    }));
    const learningContentErrors: string[] = [];
    const sourceInventoryIds = new Set((input.source_inventory || []).map((item) => item.id));
    const learningContentBlocks = (input.raw_learning_content || []).flatMap((content, idx): ContentBlock[] => {
      const conceptId = conceptMap.get(content.concept_name);
      if (!conceptId) {
        learningContentErrors.push(`Source learning content '${content.source_item_id}' references unknown concept '${content.concept_name}'`);
        return [];
      }
      if (input.source_inventory && !sourceInventoryIds.has(content.source_item_id)) {
        learningContentErrors.push(`Source learning content references unknown inventory item '${content.source_item_id}'`);
        return [];
      }
      const masked = MathInsulator.tokenize(content.text_english);
      const sourceSet = input.source_documents?.length
        ? `source-set:${input.source_documents.map((document) => `${document.id}=sha256:${document.sha256}`).join('|')}`
        : `pdf:${input.source_pdf_hash}`;
      return [{
        id: `cnt:${chapterPrefix}:learning_${idx + 1}`,
        type: content.type,
        concept_id: conceptId,
        text_english: content.text_english,
        text_hindi: content.text_hindi,
        text_hindi_math_insulated: insulateOptionalTranslation(content.text_hindi),
        text_math_insulated: MathInsulator.wrapWithIsolation(MathInsulator.restore(masked.maskedText, masked.tokenMap)),
        hindi_translation: input.word_map ? { phonetics: '', word_map: input.word_map } : undefined,
        provenance_source: `source-item:${content.source_item_id}|${sourceSet}`,
        fidelity_score: content.fidelity_score ?? 1.0,
      }];
    });
    const content_blocks: ContentBlock[] = [...conceptContentBlocks, ...learningContentBlocks];

    // 5. Resolve Assessment Items with Zero-Spoiler Math Insulation
    const assessment_items: AssessmentItem[] = input.raw_assessments.map((a, idx) => {
      const objId = learning_objectives[a.objective_index]?.id || learning_objectives[0].id;
      const cptId = conceptMap.get(a.concept_name) || concept_graph[0].id;
      const maskedPrompt = MathInsulator.tokenize(a.prompt);

      return {
        id: `ast:${chapterPrefix}:q_${idx + 1}`,
        objective_id: objId,
        concept_id: cptId,
        question_type: (a.question_type || 'mcq') as any,
        prompt: a.prompt,
        prompt_hindi: a.prompt_hindi,
        prompt_hindi_math_insulated: insulateOptionalTranslation(a.prompt_hindi),
        prompt_math_insulated: MathInsulator.restore(maskedPrompt.maskedText, maskedPrompt.tokenMap),
        options: a.options.map((opt, optIdx) => {
          const maskedOpt = MathInsulator.tokenize(opt.text);
          return {
            id: `opt:${chapterPrefix}:q_${idx + 1}_${optIdx + 1}`,
            text: opt.text,
            text_hindi: opt.text_hindi,
            text_hindi_math_insulated: insulateOptionalTranslation(opt.text_hindi),
            text_math_insulated: MathInsulator.restore(maskedOpt.maskedText, maskedOpt.tokenMap),
            is_correct: opt.is_correct,
            misconception_id: opt.misconception_name ? miscMap.get(opt.misconception_name) : undefined,
            distractor_explanation: opt.distractor_explanation,
            distractor_explanation_hindi: opt.distractor_explanation_hindi,
            distractor_explanation_hindi_math_insulated: insulateOptionalTranslation(opt.distractor_explanation_hindi),
          };
        }),
        hints: {
          H1_hook: a.hints.H1,
          H2_concept: a.hints.H2,
          H3_formula: a.hints.H3,
          H4_step: a.hints.H4,
        },
        hints_hindi: a.hints_hindi ? {
          H1_hook: a.hints_hindi.H1,
          H2_concept: a.hints_hindi.H2,
          H3_formula: a.hints_hindi.H3,
          H4_step: a.hints_hindi.H4,
        } : undefined,
        hints_hindi_math_insulated: a.hints_hindi ? {
          H1_hook: insulateOptionalTranslation(a.hints_hindi.H1) || '',
          H2_concept: insulateOptionalTranslation(a.hints_hindi.H2) || '',
          H3_formula: insulateOptionalTranslation(a.hints_hindi.H3) || '',
          H4_step: insulateOptionalTranslation(a.hints_hindi.H4) || '',
        } : undefined,
      };
    });

    // Capability requirements are task/source inputs. Never assign a math-specific
    // manipulative to every subject as a default.
    const capability_requirements: CapabilityRequirement[] = (input.raw_capabilities || []).map((capability, idx) => ({
      ...capability,
      id: capability.id || `cap:${chapterPrefix}:sim_${idx + 1}`,
    }));

    // 6. Build Experience Graph
    const experience_graph = {
      initial_state_id: 'state:intro',
      states: [
        {
          id: 'state:intro',
          name: 'Concept Discovery',
          type: 'concept_card' as const,
          content_ids: content_blocks.map((b) => b.id),
        },
        {
          id: 'state:sim',
          name: 'Interactive Manipulative Lab',
          type: 'interactive_sim' as const,
          capability_id: capability_requirements[0]?.id,
          content_ids: [],
        },
        {
          id: 'state:assessment',
          name: 'TEAS Diagnostic Challenge',
          type: 'teas_assessment' as const,
          content_ids: [],
        },
      ],
      transitions: [
        {
          from_state_id: 'state:intro',
          to_state_id: 'state:sim',
          trigger_event: 'NEXT_CARD',
        },
        {
          from_state_id: 'state:sim',
          to_state_id: 'state:assessment',
          trigger_event: 'MANIPULATIVE_COMPLETED',
        },
      ],
    };

    // 7. Canonical IR Manifest (v1.1.0)
    const canonicalIR: CanonicalIR = {
      schema_version: '1.1.0',
      chapter_metadata: {
        chapter_id: input.chapter_id,
        title: input.title,
        grade: input.grade,
        subject: input.subject,
        board: input.board,
        source_pdf_hash: input.source_pdf_hash,
        source_documents: input.source_documents,
      },
      learning_objectives,
      concept_graph,
      misconceptions,
      content_blocks,
      experience_graph,
      visual_grammar: {
        spatial_model: 'card_stack',
        density_tier: 'compact_mobile',
        primary_color_theme: '#4F46E5',
        touch_target_min_px: 44,
      },
      assessment_items,
      capability_requirements,
      source_inventory_scope: input.source_inventory_scope,
      source_inventory: input.source_inventory,
      source_coverage: input.source_coverage,
      adaptive_policy: {
        max_retries: 3,
        dda_difficulty_step: 0.1,
        remediation_threshold: 0.6,
        teas_historical_weight: 0.6,
        teas_recent_weight: 0.4,
      },

      // v1.1.0 — 4 new mandatory fields
      learner_agency: {
        self_pacing_allowed: true,
        can_skip_simulation: false,
        hint_request_allowed: true,
        max_hints_per_item: 4,
        preferred_modality: 'multimodal',
      },
      motivation_intent: {
        narrative_frame: `Discover the world of ${input.title}`,
        xp_reward_warmup: 5,
        xp_reward_deep_dive: 10,
        xp_reward_boss: 20,
        streak_contribution: true,
        celebration_intensity: 'standard',
      },
      accessibility_envelope: {
        min_viewport_width_px: 360,
        min_viewport_height_px: 640,
        target_aspect_ratios: ['16:9', '19.5:9', '20:9'],
        touch_target_min_px: 44,
        primary_language: 'hi',
        bilingual_pair: 'en',
        reading_grade_level: input.grade,
        screen_reader_compatible: true,
        high_contrast_mode_supported: true,
        reduced_motion_supported: true,
        max_bundle_size_mb: 20,
        offline_first: true,
        cdn_dependencies_allowed: false,
      },
      experience_acceptance_contract: {
        min_objectives_covered: learning_objectives.length,
        min_assessment_items: assessment_items.length,
        all_misconceptions_linked: true,
        zero_external_requests: true,
        zero_spoilers_in_distractors: true,
        zero_math_lle_collisions: true,
        scroll_height_lte_viewport: true,
        full_event_trace_verifiable: true,
        mastery_threshold_measurable: true,
      },

      compilation_manifest: {
        compiled_at: new Date().toISOString(),
        compiler_version: 'v6-canonical-1.1.0',
        source_artifacts: ['ingest_output.json', 'analysis_output.json', 'assessment_output.json', 'lle_output.json'],
        ir_hash: `sha256_${Date.now()}`,
      },
    };

    // 8. Validate Invariants (v1.1.0 extended checks)
    const validationResult = validateCanonicalIR(canonicalIR);

    return {
      canonicalIR,
      validationErrors: [...validationResult.errors, ...learningContentErrors],
    };
  }
}
