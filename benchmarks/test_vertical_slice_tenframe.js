/**
 * AASHA AIOS — Vertical Slice Verification Suite: Addition / Ten-Frame Construction
 * Path: Aasha-AI/benchmarks/test_vertical_slice_tenframe.js
 *
 * Enforces Section 2A Concrete Execution Contract:
 * - Mathematical Contract (Section 2A.14)
 * - Evidence Contract (Section 2A.15)
 * - Learner-State Contract (Section 2A.16)
 * - Telemetry Contract (Section 2A.17)
 * - Offline Contract (Section 2A.18)
 * - Artifact Contract (Section 2A.19, <= 20,971,520 bytes)
 * - QA Contract (Section 2A.21)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

let totalChecks = 0;
let passedChecks = 0;
const failureList = [];

function check(name, condition, errorMsg = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`[PASS] ${name}`);
  } else {
    failureList.push({ name, errorMsg });
    console.error(`[FAIL] ${name} — ${errorMsg}`);
  }
}

console.log('='.repeat(80));
console.log(' AASHA AIOS — VERTICAL SLICE VERIFICATION: ADDITION / TEN-FRAME');
console.log('='.repeat(80));

// ---------------------------------------------------------------------------
// 1. Mathematical Truth & Deterministic Evaluator Contract (Section 2A.14)
// ---------------------------------------------------------------------------
console.log('\n--- 1. Mathematical Truth & Deterministic Evaluation ---');

import { TenFrameMathEvaluator } from '../packages/adapters/ten_frame_evaluator.ts';

const evaluator = new TenFrameMathEvaluator({ targetSum: 10, startingQuantity: 4, maxCapacity: 10 });
check('Evaluator config respects boundaries', 
  evaluator.getConfig().targetSum === 10 && 
  evaluator.getConfig().startingQuantity === 4 &&
  evaluator.getConfig().maxCapacity === 10
);

check('Needed quantity is mathematically derived (10 - 4 = 6)', evaluator.getNeededQuantity() === 6);

// Correct response
const evalCorrect = evaluator.evaluate(6);
check('Correct placement (6) yields isCorrect = true', evalCorrect.isCorrect === true);
check('Correct placement yields diagnosticSignal = TARGET_MATCH', evalCorrect.diagnosticSignal === 'TARGET_MATCH');
check('Correct placement yields evidenceType = CONCEPTUAL_ADDITION', evalCorrect.evidenceType === 'CONCEPTUAL_ADDITION');
check('Correct placement has difference = 0', evalCorrect.difference === 0);

// Underfill response
const evalUnder = evaluator.evaluate(3);
check('Underfill placement (3) yields isCorrect = false', evalUnder.isCorrect === false);
check('Underfill yields diagnosticSignal = UNDERFILL', evalUnder.diagnosticSignal === 'UNDERFILL');
check('Underfill yields negative difference (-3)', evalUnder.difference === -3);

// Overfill response
const evalOver = evaluator.evaluate(8);
check('Overfill placement (8) yields isCorrect = false', evalOver.isCorrect === false);
check('Overfill yields diagnosticSignal = OVERFILL', evalOver.diagnosticSignal === 'OVERFILL');
check('Overfill yields positive difference (+2)', evalOver.difference === 2);

// Edge Cases: Empty Attempt (0)
const evalZero = evaluator.evaluate(0);
check('Zero counters placed yields diagnosticSignal = EMPTY_ATTEMPT', evalZero.diagnosticSignal === 'EMPTY_ATTEMPT');

// Edge Cases: Boundary (Boundary = 10)
const evalMax = evaluator.evaluate(10);
check('Max capacity placement evaluated deterministically', evalMax.currentTotal === 14 && evalMax.difference === 4);

// Edge Cases: Invalid inputs
const evalInvalid = evaluator.evaluate(-2);
check('Negative placement yields INVALID_QUANTITY', evalInvalid.diagnosticSignal === 'INVALID_QUANTITY');

// ---------------------------------------------------------------------------
// 2. OpenMAIC Visual Cues & Web Component Simulation Script
// ---------------------------------------------------------------------------
console.log('\n--- 2. OpenMAIC Visual Cues & Simulation Script Generation ---');

import { DomainSimGenerators } from '../packages/adapters/domain_sim_generators.ts';

const simScript = DomainSimGenerators.generateSimScript({
  subject: 'Mathematics',
  topic: 'Ten-Frame Addition',
  topicSlug: 'ten-frame-addition',
  grade: 2,
  initialParams: { targetSum: 10, startingQuantity: 4 }
});

check('Simulation script defines AashaTenFrameSim class', simScript.includes('class AashaTenFrameSim extends HTMLElement'));
check('Simulation script implements OpenMAIC laser_pointer cue helper', simScript.includes('laser_pointer'));
check('Simulation script implements OpenMAIC spotlight cue helper', simScript.includes('spotlight'));
check('Simulation script implements clearVisualCues helper', simScript.includes('clearVisualCues'));
check('Simulation script implements deterministic evaluateState method', simScript.includes('evaluateState('));
check('Simulation script implements precision stepper buttons (+1, -1, +5, Reset)', 
  simScript.includes('btnAddOne') && simScript.includes('btnSubOne') && simScript.includes('btnAddFive') && simScript.includes('btnReset')
);

// ---------------------------------------------------------------------------
// 3. Semantic Events & Telemetry Contract (Section 2A.15 - 2A.17)
// ---------------------------------------------------------------------------
console.log('\n--- 3. Semantic Events & Evidence Contract ---');

check('Simulation dispatches interaction_started event', simScript.includes("'interaction_started'"));
check('Simulation dispatches learner_action event', simScript.includes("'learner_action'"));
check('Simulation dispatches response_evaluated event with diagnostics', simScript.includes("'response_evaluated'"));
check('Simulation dispatches misconception_detected event on error', simScript.includes("'misconception_detected'"));
check('Simulation dispatches evidence_generated event on success', simScript.includes("'evidence_generated'"));

// ---------------------------------------------------------------------------
// 4. Offline Persistence & State Reconstruction (Section 2A.18)
// ---------------------------------------------------------------------------
console.log('\n--- 4. Offline Persistence & State Reconstruction ---');

check('Simulation loads persisted state from localStorage on init', simScript.includes("localStorage.getItem('aasha_tenframe_state')"));
check('Simulation saves state to localStorage upon every state change', simScript.includes("localStorage.setItem('aasha_tenframe_state'"));
check('Simulation contains persistState method', simScript.includes('persistState()'));

// ---------------------------------------------------------------------------
// 5. Standalone Offline Compilation & Artifact Contract (Section 2A.19)
// ---------------------------------------------------------------------------
console.log('\n--- 5. Compilation & Artifact Contract (<= 20,971,520 bytes) ---');

import { V6Compiler } from '../packages/v6-engine/v6_compiler.ts';

const mockIR = {
  schema_version: '1.1.0',
  chapter_metadata: {
    chapter_id: 'ch_tenframe_addition_c2',
    title: 'Addition with Ten-Frame (दस का ढाँचा)',
    subject: 'Mathematics',
    grade: 2,
    board: 'NCERT',
    source_pdf_hash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000'
  },
  learning_objectives: [
    {
      id: 'obj:math:c2:tenframe:01',
      description: 'Construct addition sums up to 10 using visual counters on a ten-frame',
      bloom_level: 'apply',
      success_criteria: ['Fill required counters to reach 10', 'Recognize place value groupings of ten and ones'],
      evidence_contracts: ['evd:math:c2:tenframe:01']
    }
  ],
  concept_graph: [
    {
      id: 'cpt:math:tenframe',
      name: 'Ten-Frame Addition',
      definition_raw: 'A ten-frame is a 2 by 5 grid that organizes numbers relative to 5 and 10.',
      definition_math_insulated: 'A ten-frame is a 2 by 5 grid that organizes numbers relative to 5 and 10.',
      prerequisite_ids: [],
      child_concept_ids: []
    }
  ],
  misconceptions: [
    {
      id: 'misc:math:overfill',
      concept_id: 'cpt:math:tenframe',
      name: 'Overfilling Frame',
      description: 'Adding more counters than needed, exceeding the target sum.',
      observable_signals: ['signal:overfill:attempt'],
      confidence_weight: 0.85,
      remediation_strategy: 'Observe the remaining blank spaces and stop once filled.'
    }
  ],
  content_blocks: [
    {
      id: 'cnt:math:def_1',
      type: 'concept_def',
      concept_id: 'cpt:math:tenframe',
      text_english: 'A ten-frame organizes numbers into groups of five and ten.',
      text_math_insulated: 'A ten-frame organizes numbers into groups of five and ten.',
      hindi_translation: {
        phonetics: 'दस का ढाँचा',
        word_map: {
          'ten-frame': 'दस का ढाँचा',
          'addition': 'जोड़',
          'counters': 'काउंटर'
        }
      },
      provenance_source: 'pdf:mock',
      fidelity_score: 1.0
    }
  ],
  experience_graph: {
    initial_state_id: 'state:concept',
    states: [
      { id: 'state:concept', name: 'Concept Card', type: 'concept_card', content_ids: ['cnt:math:def_1'] },
      { id: 'state:sim', name: 'Ten-Frame Lab', type: 'interactive_sim', capability_id: 'cap:sim:tenframe', content_ids: ['cnt:math:def_1'] },
      { id: 'state:assess', name: 'Practice Assessment', type: 'assessment_gate', content_ids: ['ast:math:q1'] }
    ],
    transitions: [
      { from_state_id: 'state:concept', to_state_id: 'state:sim', trigger_event: 'START_LAB' },
      { from_state_id: 'state:sim', to_state_id: 'state:assess', trigger_event: 'LAB_COMPLETE' }
    ]
  },
  assessment_items: [
    {
      id: 'ast:math:q1',
      objective_id: 'obj:math:c2:tenframe:01',
      concept_id: 'cpt:math:tenframe',
      question_type: 'mcq',
      prompt: 'If 4 counters are on the ten-frame, how many more make 10?',
      prompt_math_insulated: 'If 4 counters are on the ten-frame, how many more make 10?',
      options: [
        { id: 'o1', text: '6', text_math_insulated: '6', is_correct: true, distractor_explanation: '' },
        { id: 'o2', text: '5', text_math_insulated: '5', is_correct: false, misconception_id: 'misc:math:overfill', distractor_explanation: 'One space remains empty in the ten-frame.' },
        { id: 'o3', text: '7', text_math_insulated: '7', is_correct: false, misconception_id: 'misc:math:overfill', distractor_explanation: 'Exceeds the 10 available spaces on the ten-frame.' }
      ],
      hints: {
        H1_hook: 'Look closely at the unfilled empty spaces on the frame.',
        H2_concept: 'The ten-frame holds 10 total dots in two rows of 5.',
        H3_formula: 'Subtract the placed counters from the total capacity of 10.',
        H4_step: 'Count the empty slots starting after the 4th dot.'
      }
    }
  ],
  capability_requirements: [
    {
      id: 'cap:sim:tenframe',
      purpose: 'Interactive Ten-Frame Manipulative',
      interaction_type: 'drag_drop',
      license_constraint: 'MIT_NATIVE',
      sandbox_required: false
    }
  ],
  visual_grammar: {
    spatial_model: 'card_stack',
    density_tier: 'compact_mobile',
    primary_color_theme: '#0F172A',
    touch_target_min_px: 44
  },
  adaptive_policy: {
    max_retries: 3,
    dda_difficulty_step: 0.2,
    remediation_threshold: 0.6,
    teas_historical_weight: 0.6,
    teas_recent_weight: 0.4
  },
  learner_agency: {
    self_pacing_allowed: true,
    can_skip_simulation: false,
    hint_request_allowed: true,
    max_hints_per_item: 4
  },
  motivation_intent: {
    narrative_frame: 'Fill the ten-frame to master numbers!',
    xp_reward_warmup: 20,
    xp_reward_deep_dive: 40,
    xp_reward_boss: 100,
    streak_contribution: true,
    celebration_intensity: 'standard'
  },
  accessibility_envelope: {
    min_viewport_width_px: 360,
    min_viewport_height_px: 640,
    target_aspect_ratios: ['16:9', '19.5:9', '20:9'],
    touch_target_min_px: 44,
    primary_language: 'en',
    reading_grade_level: 2,
    screen_reader_compatible: true,
    high_contrast_mode_supported: true,
    reduced_motion_supported: true,
    max_bundle_size_mb: 20,
    offline_first: true,
    cdn_dependencies_allowed: false
  },
  experience_acceptance_contract: {
    min_objectives_covered: 1.0,
    min_assessment_items: 1,
    all_misconceptions_linked: true,
    zero_external_requests: true,
    zero_spoilers_in_distractors: true,
    zero_math_lle_collisions: true,
    scroll_height_lte_viewport: true,
    full_event_trace_verifiable: true,
    mastery_threshold_measurable: true
  }
};

const compileResult = V6Compiler.compile(mockIR, { requireFullSourceCoverage: false });
if (compileResult.errors.length) {
  console.error('Compiler Errors:', compileResult.errors);
}
check('V6Compiler successfully compiles vertical slice chapter', compileResult.errors.length === 0);

const htmlSize = Buffer.byteLength(compileResult.html, 'utf8');
const maxBytes = 20971520; // 20 MB ceiling
check(`Compiled HTML size (${htmlSize} bytes) <= 20,971,520 bytes`, htmlSize <= maxBytes);
check('Compiled HTML contains <aasha-sim>', compileResult.html.includes('<aasha-sim'));
check('Compiled HTML contains instant language toggle', compileResult.html.includes('langToggleBtn'));
check('Compiled HTML contains zero external http/https CDN references', 
  !compileResult.html.includes('http://') && !compileResult.html.includes('https://cdn')
);

// Write standalone vertical slice HTML for browser verification
const outPath = path.resolve(repoRoot, 'test_vertical_slice_tenframe.html');
fs.writeFileSync(outPath, compileResult.html, 'utf8');
check(`Exported standalone vertical slice HTML to: ${outPath}`, fs.existsSync(outPath));

// ---------------------------------------------------------------------------
// 6. Summary Report
// ---------------------------------------------------------------------------
console.log('\n' + '='.repeat(80));
console.log(` VERTICAL SLICE BENCHMARK SUMMARY: ${passedChecks} / ${totalChecks} CHECKS PASSED`);
if (failureList.length === 0) {
  console.log(' ALL GATES PASSED (Score: 100/100) — READY FOR HIL CERTIFICATION');
} else {
  console.error(` FAILURES DETECTED: ${failureList.length}`);
}
console.log('='.repeat(80));

process.exit(failureList.length === 0 ? 0 : 1);
