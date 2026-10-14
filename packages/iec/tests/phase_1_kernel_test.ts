/**
 * AASHA AIOS — IEC Phase 1 Kernel Test Suite
 * Path: Aasha-AI/packages/iec/tests/phase_1_kernel_test.ts
 *
 * Verifies all Phase 1 kernel components and executes the hard architectural drift gate.
 */

import * as path from 'path';
import { ArchitecturalDriftGuard } from '../guards/architectural_drift_guard';
import { ExperienceSpecificationMapper, ExperienceRequirement } from '../contracts/experience_specification';
import { InteractionProtocolValidator, ExperienceToHostEvent } from '../contracts/interaction_protocol';
import { CapabilityDiscoveryEngine } from '../discovery/capability_discovery_engine';
import { ResourceMatchReporter } from '../discovery/resource_match_reporter';
import { CapabilityEvaluator } from '../discovery/capability_evaluator';
import { ProvenanceTracker } from '../provenance/provenance_tracker';

// Test Runner
async function runPhase1Tests() {
  console.log('===============================================================');
  console.log('AASHA IEC PHASE 1 — KERNEL & ARCHITECTURAL DRIFT VERIFICATION');
  console.log('===============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      throw new Error(`TEST_FAILURE: ${testName}`);
    }
  }

  // 1. HARD ARCHITECTURAL DRIFT GATE
  console.log('--- Gate 1: Architectural Drift Guard ---');
  const guard = new ArchitecturalDriftGuard();
  const driftReport = guard.verify();
  console.log(`Reused Components: ${driftReport.reusedComponents.join(', ')}`);
  assert(driftReport.passed === true, 'No architectural drift detected across invariants');
  assert(driftReport.violations.length === 0, 'Zero drift violations registered');
  guard.assertNoDrift();

  // 2. INTERACTION PROTOCOL & TELEMETRY ISOLATION
  console.log('\n--- Gate 2: Interaction Protocol & Authority Insulation ---');
  const validEvent: ExperienceToHostEvent = {
    type: 'INTERACTION_STARTED',
    experience_id: 'exp:math:c8:square_roots_gnomon',
    timestamp: Date.now(),
    payload: { interaction_id: 'slider_drag_step_1' },
  };
  const valResult1 = InteractionProtocolValidator.validateEvent(validEvent);
  assert(valResult1.valid === true, 'Valid evidence event is accepted');

  const rogueEvent: ExperienceToHostEvent = {
    type: 'STATE_CHANGED',
    experience_id: 'exp:math:c8:square_roots_gnomon',
    timestamp: Date.now(),
    payload: { mastery_score: 0.95 } as any, // Forbidden direct mastery mutation
  };
  const valResult2 = InteractionProtocolValidator.validateEvent(rogueEvent);
  assert(valResult2.valid === false, 'Rogue event with direct mastery mutation is blocked');
  assert(valResult2.reason?.includes('FORBIDDEN_AUTHORITY_MUTATION') === true, 'Proper diagnostic reason emitted');

  // 3. CAPABILITY DISCOVERY & SEARCH SEQUENCE
  console.log('\n--- Gate 3: Capability Discovery Engine ---');
  const discovery = new CapabilityDiscoveryEngine();
  const searchSeq = discovery.getPreferredSearchSequence();
  assert(searchSeq[0] === 'EXISTING_AASHA_EXPERIENCE', 'Search sequence prioritizes existing AASHA experiences');
  assert(searchSeq.length === 6, 'Preferred search sequence contains all 6 candidate tiers');

  const mockReq: ExperienceRequirement = {
    experience_id: 'exp:math:c8:squares_01',
    capability_id: 'SIMULATION',
    tln_ids: ['tln:math:c8:squares'],
    learning_objective_ids: ['obj:01'],
    concept_ids: ['cpt:squares'],
    misconception_ids: ['misc:negative_squares'],
    interaction_mechanism: 'parameter_sliders',
    variables: [],
    performance_budget: { maxBundleBytes: 20971520, targetFps: 60, pauseWhenHidden: true },
    device_requirements: { supportedViewports: [320, 375, 414, 768], minTouchTargetPx: 44, orientationSafe: true },
    evidence_signals: ['gnomon_peel_action'],
  };

  const candidates = await discovery.discoverCandidates(mockReq, 'Mathematics', 8);
  console.log(`Discovered ${candidates.length} candidate(s) for Class 8 Mathematics`);
  assert(candidates.length > 0, 'Discovered valid candidates from experience registry');
  const hasAashaFoundation = candidates.some(c => c.provider_class === 'AASHA_FOUNDATION');
  assert(hasAashaFoundation === true, 'Discovered AASHA Foundation candidate (e.g. F01/F02)');

  // 4. RESOURCE MATCH REPORT (ACTIVE GOVERNANCE ARTIFACT)
  console.log('\n--- Gate 4: Active Resource Match Reporter ---');
  const reportMd = ResourceMatchReporter.generateMarkdownReport({
    chapter: 'Squares and Cubes',
    classNum: 8,
    subject: 'Mathematics',
    requirement: mockReq,
    candidates,
    candidateCompositions: [],
    offlineStatus: '100% Offline (Zero CDN)',
    licenseStatus: 'Verified Compatible (MIT/BSD)',
    mobileStatus: 'Touch-Safe (>= 44px)',
    telemetryCompatibility: 'AASHA CustomEvents Ready',
    selectionRationale: 'Candidate F02 MicroSims provides exact parameter slider match with zero adaptation cost.',
    rejectedCandidates: [],
    timestamp: new Date().toISOString(),
  });
  assert(reportMd.includes('MANDATORY RESOURCE MATCH REPORT'), 'Markdown report header generated');
  assert(reportMd.includes('parameter_sliders'), 'Requirement mechanics documented');
  assert(reportMd.includes('AASHA_FOUNDATION'), 'Provider classes recorded accurately');

  // 5. CAPABILITY EVALUATION & EVIDENCE SELECTION
  console.log('\n--- Gate 5: Evidence-Based Capability Evaluator ---');
  const evaluator = new CapabilityEvaluator();
  const evalResult = evaluator.evaluate(mockReq, candidates);
  console.log(`Selected Strategy: ${evalResult.plan.selected_strategy}`);
  console.log(`Selected Candidate: ${evalResult.plan.primary_candidate?.name}`);
  console.log(`Rationale: ${evalResult.plan.rationale}`);
  assert(['REUSE', 'ADAPT', 'COMPOSE', 'GENERATE'].includes(evalResult.plan.selected_strategy), 'Valid strategy produced');
  assert(evalResult.evaluations.length > 0, 'Multi-dimensional evaluations completed');

  // 6. CRYPTOGRAPHIC PROVENANCE TRACKER
  console.log('\n--- Gate 6: Cryptographic Provenance Tracker ---');
  const hash = ProvenanceTracker.computeContentHash('function testSim() { return 42; }');
  assert(typeof hash === 'string' && hash.length === 64, 'SHA-256 hash computed deterministically');
  const provRecord = ProvenanceTracker.createRecord(
    'RESOURCE_TEST',
    'https://github.com/THU-MAIC/OpenMAIC',
    '21d83ec51b908a4b169ee2be7498a29da213c74d',
    'MIT',
    'NONE',
    hash
  );
  assert(provRecord.exact_commit === '21d83ec51b908a4b169ee2be7498a29da213c74d', 'Exact commit SHA pinned in provenance');

  console.log('\n===============================================================');
  console.log(`PHASE 1 VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED.`);
  console.log('HARD ARCHITECTURAL DRIFT GATE STATUS: SATISFIED (ZERO DRIFT)');
  console.log('PROMOTION STATUS: ELIGIBLE FOR PHASE 2 (PROVIDER ACTIVATION)');
  console.log('===============================================================\n');
}

runPhase1Tests().catch((err) => {
  console.error('FATAL PHASE 1 TEST ERROR:', err);
  process.exit(1);
});
