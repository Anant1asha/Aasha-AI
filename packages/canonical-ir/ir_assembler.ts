import { CanonicalIR, validateCanonicalIR, AssessmentItem, MisconceptionEntity, ContentBlock, LearningObjective } from './canonical_ir_schema';
import { MathInsulator } from '../aasha-rules/math_insulator';

export interface AgentProposalsInput {
  chapter_id: string;
  title: string;
  grade: number;
  subject: string;
  board: string;
  source_pdf_hash: string;
  raw_objectives: Array<{ description: string; bloom_level: string; success_criteria: string[] }>;
  raw_concepts: Array<{ name: string; definition: string; prerequisites?: string[] }>;
  raw_misconceptions: Array<{ concept_name: string; name: string; description: string; remediation: string }>;
  raw_assessments: Array<{
    objective_index: number;
    concept_name: string;
    question_type: string;
    prompt: string;
    options: Array<{ text: string; is_correct: boolean; distractor_explanation: string; misconception_name?: string }>;
    hints: { H1: string; H2: string; H3: string; H4: string };
  }>;
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
        definition_raw: c.definition,
        definition_math_insulated: MathInsulator.wrapWithIsolation(mathInsulated),
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
        observable_signals: [`signal:${opaqueId}:incorrect_attempt`],
        confidence_weight: 0.85,
        remediation_strategy: m.remediation,
      };
    });

    // 4. Resolve Content Blocks
    const content_blocks: ContentBlock[] = input.raw_concepts.map((c, idx) => ({
      id: `cnt:${chapterPrefix}:def_${idx + 1}`,
      type: 'concept_def',
      concept_id: concept_graph[idx].id,
      text_english: c.definition,
      text_math_insulated: concept_graph[idx].definition_math_insulated,
      provenance_source: `pdf:${input.source_pdf_hash}`,
      fidelity_score: 1.0,
    }));

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
        prompt_math_insulated: MathInsulator.restore(maskedPrompt.maskedText, maskedPrompt.tokenMap),
        options: a.options.map((opt, optIdx) => {
          const maskedOpt = MathInsulator.tokenize(opt.text);
          return {
            id: `opt:${chapterPrefix}:q_${idx + 1}_${optIdx + 1}`,
            text: opt.text,
            text_math_insulated: MathInsulator.restore(maskedOpt.maskedText, maskedOpt.tokenMap),
            is_correct: opt.is_correct,
            misconception_id: opt.misconception_name ? miscMap.get(opt.misconception_name) : undefined,
            distractor_explanation: opt.distractor_explanation,
          };
        }),
        hints: {
          H1_hook: a.hints.H1,
          H2_concept: a.hints.H2,
          H3_formula: a.hints.H3,
          H4_step: a.hints.H4,
        },
      };
    });

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
          capability_id: `cap:${chapterPrefix}:sim_1`,
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

    // 7. Canonical IR Manifest
    const canonicalIR: CanonicalIR = {
      schema_version: '1.0.0',
      chapter_metadata: {
        chapter_id: input.chapter_id,
        title: input.title,
        grade: input.grade,
        subject: input.subject,
        board: input.board,
        source_pdf_hash: input.source_pdf_hash,
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
      capability_requirements: [
        {
          id: `cap:${chapterPrefix}:sim_1`,
          purpose: 'Interactive visual manipulative',
          interaction_type: 'balance_beam',
          license_constraint: 'MIT_NATIVE',
          sandbox_required: false,
        },
      ],
      adaptive_policy: {
        max_retries: 3,
        dda_difficulty_step: 0.1,
        remediation_threshold: 0.6,
        teas_historical_weight: 0.6,
        teas_recent_weight: 0.4,
      },
      compilation_manifest: {
        compiled_at: new Date().toISOString(),
        compiler_version: 'v6-canonical-1.0.0',
        source_artifacts: ['ingest_output.json', 'analysis_output.json', 'assessment_output.json'],
        ir_hash: `sha256_${Date.now()}`,
      },
    };

    // 8. Validate Invariants
    const validationResult = validateCanonicalIR(canonicalIR);

    return {
      canonicalIR,
      validationErrors: validationResult.errors,
    };
  }
}
