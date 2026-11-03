/**
 * AASHA AIOS — Foundation F25 & F26 Simulators Comprehensive Test Suite
 * Path: Aasha-AI/tests/test_f25_f26_adapters.ts
 *
 * Verifies:
 * 1. Foundation F25 (Number-Line Hunter): Math Evaluator, clamping, opposite mirror, vector jumps,
 *    Web Component lifecycle, 44x44px touch targets, zero-CDN containment, audio synth.
 * 2. Foundation F26 (Balance Scale Equation Solver): Linear solver, spring tilt physics,
 *    algebraic operations toolbar, Web Component lifecycle, 44x44px touch targets, zero-CDN containment.
 * 3. DomainSimGenerators integration: Routing for F25 and F26.
 */

import * as assert from 'assert';
import {
  AashaSimNumberLine,
  NumberLineMathEvaluator,
  NumberLineAudioSynthesizer,
  generateNumberLineHunterSimScript,
} from '../packages/adapters/number_line_hunter_sim.ts';
import {
  AashaSimBalanceEquation,
  BalanceEquationMathEvaluator,
  BalanceEquationAudioSynthesizer,
  generateBalanceEquationSimScript,
} from '../packages/adapters/balance_equation_sim.ts';
import { DomainSimGenerators } from '../packages/adapters/domain_sim_generators.ts';

console.log('🧪 Starting Foundations F25 & F26 Adapters Test Battery...\n');

let testsPassed = 0;
let totalTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    process.stdout.write(`Test ${totalTests}: ${name} ... `);
    fn();
    console.log('✅ PASS');
    testsPassed++;
  } catch (err: any) {
    console.log('❌ FAIL');
    console.error(err);
    process.exit(1);
  }
}

// ============================================================================
// PART 1: Foundation F25 (Number-Line Hunter) Tests
// ============================================================================

runTest('F25: Boundary clamping in range [-10, 10]', () => {
  assert.strictEqual(NumberLineMathEvaluator.clamp(0), 0);
  assert.strictEqual(NumberLineMathEvaluator.clamp(5), 5);
  assert.strictEqual(NumberLineMathEvaluator.clamp(-8), -8);
  assert.strictEqual(NumberLineMathEvaluator.clamp(-15), -10);
  assert.strictEqual(NumberLineMathEvaluator.clamp(25), 10);
  assert.strictEqual(NumberLineMathEvaluator.clamp(NaN), 0);
});

runTest('F25: Vector jump execution & boundary limitation', () => {
  const jump1 = NumberLineMathEvaluator.executeJump(-3, 5);
  assert.strictEqual(jump1.toPos, 2);
  assert.strictEqual(jump1.actualDelta, 5);
  assert.strictEqual(jump1.isClamped, false);

  const jump2 = NumberLineMathEvaluator.executeJump(8, 5);
  assert.strictEqual(jump2.toPos, 10);
  assert.strictEqual(jump2.actualDelta, 2);
  assert.strictEqual(jump2.isClamped, true);

  const jump3 = NumberLineMathEvaluator.executeJump(-7, -5);
  assert.strictEqual(jump3.toPos, -10);
  assert.strictEqual(jump3.actualDelta, -3);
  assert.strictEqual(jump3.isClamped, true);
});

runTest('F25: Opposite number mirror symmetry & absolute value distance', () => {
  const m1 = NumberLineMathEvaluator.computeMetrics(6);
  assert.strictEqual(m1.currentPos, 6);
  assert.strictEqual(m1.oppositePos, -6);
  assert.strictEqual(m1.absoluteValue, 6);
  assert.strictEqual(m1.isPositive, true);
  assert.strictEqual(m1.isNegative, false);
  assert.strictEqual(m1.isOrigin, false);

  const m2 = NumberLineMathEvaluator.computeMetrics(-7);
  assert.strictEqual(m2.currentPos, -7);
  assert.strictEqual(m2.oppositePos, 7);
  assert.strictEqual(m2.absoluteValue, 7);
  assert.strictEqual(m2.isPositive, false);
  assert.strictEqual(m2.isNegative, true);

  const m0 = NumberLineMathEvaluator.computeMetrics(0);
  assert.strictEqual(m0.oppositePos, 0);
  assert.strictEqual(m0.isOrigin, true);
});

runTest('F25: Dynamic integer addition/subtraction equation formatting', () => {
  const m = NumberLineMathEvaluator.computeMetrics(2, 5, -3);
  assert.strictEqual(m.equationString, '(-3) + (+5) = (+2)');

  const mNeg = NumberLineMathEvaluator.computeMetrics(-2, -6, 4);
  assert.strictEqual(mNeg.equationString, '(+4) + (-6) = (-2)');
});

runTest('F25: Bilingual dictionary terminology (Hindi & English)', () => {
  const en = NumberLineMathEvaluator.getLabels('en');
  const hi = NumberLineMathEvaluator.getLabels('hi');

  assert.ok(en.title.includes('F25'));
  assert.ok(hi.title.includes('F25'));
  assert.strictEqual(en.currentPos, 'Current Position');
  assert.strictEqual(hi.currentPos, 'वर्तमान स्थिति');
  assert.strictEqual(en.origin, 'Zero (Origin)');
  assert.strictEqual(hi.origin, 'शून्य (मूल बिंदु)');
  assert.strictEqual(en.opposite, 'Opposite Number (Mirror)');
  assert.strictEqual(hi.opposite, 'विपरीत संख्या (Mirror)');
});

runTest('F25: Web Component instantiation & contract', () => {
  assert.strictEqual(AashaSimNumberLine.TAG_NAME, 'aasha-sim-number-line');
  assert.strictEqual(AashaSimNumberLine.ALIAS_TAG_NAME, 'aasha-sim');

  const sim = new AashaSimNumberLine({ initialPos: -2 });
  assert.strictEqual(sim.getState().currentPos, -2);

  sim.jump(5);
  assert.strictEqual(sim.getState().currentPos, 3);
  assert.strictEqual(sim.getState().lastDelta, 5);

  sim.toggleMirror();
  assert.strictEqual(sim.getState().showOppositeMirror, true);

  sim.reset();
  assert.strictEqual(sim.getState().currentPos, 0);
  assert.strictEqual(sim.getState().showOppositeMirror, false);
});

runTest('F25: Lifecycle hooks & telemetry emission', () => {
  const sim = new AashaSimNumberLine();
  sim.pause();
  sim.resume();
  sim.destroy();

  let lastEmitted: any = null;
  sim.dispatchEvent = ((e: any) => {
    lastEmitted = e;
    return true;
  }) as any;

  sim.emitTelemetry('jump_step', { step: 2 });
  assert.ok(lastEmitted);
  assert.strictEqual(lastEmitted.detail.foundationId, 'F25');
  assert.strictEqual(lastEmitted.detail.eventType, 'jump_step');
});

runTest('F25: 44x44px touch targets & zero external CDN script invariant', () => {
  const script = generateNumberLineHunterSimScript();
  assert.ok(script.includes('min-width: 44px') || script.includes('min-width:44px'));
  assert.ok(script.includes('min-height: 44px') || script.includes('min-height:44px'));

  const prohibited = ['cdn.', 'unpkg.com', 'cdnjs.', 'fonts.googleapis.com', 'gtag'];
  for (const p of prohibited) {
    assert.ok(!script.includes(p), `Prohibited pattern found: ${p}`);
  }

  // Synthesizer safe execution in Node
  const synth = new NumberLineAudioSynthesizer();
  synth.playJumpChime(3);
  synth.playMirrorChime();

  // Validate executable JS syntax
  assert.doesNotThrow(() => {
    new Function(script);
  });
});

// ============================================================================
// PART 2: Foundation F26 (Balance Scale Equation Solver) Tests
// ============================================================================

runTest('F26: Linear equation root solver', () => {
  // 2x + 3 = 11 -> x = 4
  assert.strictEqual(BalanceEquationMathEvaluator.solveRoot(2, 3, 11), 4);
  // 3x + 2 = 14 -> x = 4
  assert.strictEqual(BalanceEquationMathEvaluator.solveRoot(3, 2, 14), 4);
  // 2x + 6 = 12 -> x = 3
  assert.strictEqual(BalanceEquationMathEvaluator.solveRoot(2, 6, 12), 3);
  // 4x + 4 = 20 -> x = 4
  assert.strictEqual(BalanceEquationMathEvaluator.solveRoot(4, 4, 20), 4);
});

runTest('F26: Linear equation expression string formatting', () => {
  assert.strictEqual(BalanceEquationMathEvaluator.formatEquation(2, 3, 11), '2x + 3 = 11');
  assert.strictEqual(BalanceEquationMathEvaluator.formatEquation(2, 0, 8), '2x = 8');
  assert.strictEqual(BalanceEquationMathEvaluator.formatEquation(1, 0, 4), 'x = 4');
  assert.strictEqual(BalanceEquationMathEvaluator.formatEquation(0, 0, 0), '0 = 0');
});

runTest('F26: Balance physics scale tilt angle computation', () => {
  // Equal weights -> 0 degree tilt (horizontal balance)
  assert.strictEqual(BalanceEquationMathEvaluator.computeTiltAngle(11, 11), 0);

  // Left heavier -> tilts down to positive angle
  const angleLeft = BalanceEquationMathEvaluator.computeTiltAngle(14, 11);
  assert.ok(angleLeft > 0, 'Left heavier must tilt down (positive angle)');

  // Right heavier -> tilts down to negative angle
  const angleRight = BalanceEquationMathEvaluator.computeTiltAngle(8, 11);
  assert.ok(angleRight < 0, 'Right heavier must tilt down (negative angle)');

  // Clamped at 15 degrees max
  assert.strictEqual(BalanceEquationMathEvaluator.computeTiltAngle(100, 10), 15);
  assert.strictEqual(BalanceEquationMathEvaluator.computeTiltAngle(10, 100), -15);
});

runTest('F26: Comprehensive balance metrics & solved state', () => {
  // In initial state 2x + 3 = 11 where root x = 4:
  const mInit = BalanceEquationMathEvaluator.computeMetrics(2, 3, 11, 4);
  assert.strictEqual(mInit.isBalanced, true);
  assert.strictEqual(mInit.isSolved, false);
  assert.strictEqual(mInit.lhsWeight, 11);
  assert.strictEqual(mInit.rhsWeight, 11);

  // When solved: x = 4
  const mSolved = BalanceEquationMathEvaluator.computeMetrics(1, 0, 4, 4);
  assert.strictEqual(mSolved.isBalanced, true);
  assert.strictEqual(mSolved.isSolved, true);
  assert.strictEqual(mSolved.equationString, 'x = 4');
});

runTest('F26: Bilingual dictionary terminology (Hindi & English)', () => {
  const en = BalanceEquationMathEvaluator.getLabels('en');
  const hi = BalanceEquationMathEvaluator.getLabels('hi');

  assert.ok(en.title.includes('F26'));
  assert.ok(hi.title.includes('F26'));
  assert.strictEqual(en.lhs, 'Left Hand Side (LHS)');
  assert.strictEqual(hi.lhs, 'बायां पक्ष (LHS)');
  assert.strictEqual(en.balanced, 'Balanced ✅');
  assert.strictEqual(hi.balanced, 'संतुलित ✅');
  assert.strictEqual(en.solved, 'Equation Solved! 🎉');
  assert.strictEqual(hi.solved, 'समीकरण हल हो गया! 🎉');
});

runTest('F26: Web Component algebraic operations toolbar (Subtract & Divide)', () => {
  assert.strictEqual(AashaSimBalanceEquation.TAG_NAME, 'aasha-sim-balance-equation');
  assert.strictEqual(AashaSimBalanceEquation.ALIAS_TAG_NAME, 'aasha-sim');

  // Initial: 2x + 3 = 11
  const sim = new AashaSimBalanceEquation({ presetId: 0 });
  const s0 = sim.getState();
  assert.strictEqual(s0.currentXCoeff, 2);
  assert.strictEqual(s0.currentLeftConst, 3);
  assert.strictEqual(s0.currentRightConst, 11);
  assert.strictEqual(s0.isSolved, false);

  // Operation 1: Subtract 3 from both sides -> 2x = 8
  sim.subtractBothSides(3);
  const s1 = sim.getState();
  assert.strictEqual(s1.currentXCoeff, 2);
  assert.strictEqual(s1.currentLeftConst, 0);
  assert.strictEqual(s1.currentRightConst, 8);
  assert.strictEqual(s1.stepHistory.length, 1);

  // Operation 2: Divide both sides by 2 -> x = 4 (Solved!)
  sim.divideBothSides();
  const s2 = sim.getState();
  assert.strictEqual(s2.currentXCoeff, 1);
  assert.strictEqual(s2.currentLeftConst, 0);
  assert.strictEqual(s2.currentRightConst, 4);
  assert.strictEqual(s2.isSolved, true);
  assert.strictEqual(s2.isBalanced, true);
});

runTest('F26: Web Component preset cycling and reset', () => {
  const sim = new AashaSimBalanceEquation({ presetId: 0 });
  sim.nextPreset();
  assert.strictEqual(sim.getState().presetId, 1);
  assert.strictEqual(sim.getState().initialXCoeff, 3);

  sim.reset();
  assert.strictEqual(sim.getState().currentXCoeff, 3);
  assert.strictEqual(sim.getState().currentLeftConst, 2);
  assert.strictEqual(sim.getState().currentRightConst, 14);
});

runTest('F26: 44x44px touch targets & zero external CDN script invariant', () => {
  const script = generateBalanceEquationSimScript();
  assert.ok(script.includes('min-width: 44px') || script.includes('min-width:44px'));
  assert.ok(script.includes('min-height: 44px') || script.includes('min-height:44px'));

  const prohibited = ['cdn.', 'unpkg.com', 'cdnjs.', 'fonts.googleapis.com', 'gtag'];
  for (const p of prohibited) {
    assert.ok(!script.includes(p), `Prohibited pattern found: ${p}`);
  }

  // Synthesizer safe execution in Node
  const synth = new BalanceEquationAudioSynthesizer();
  synth.playClink();
  synth.playVictoryChord();

  // Validate executable JS syntax
  assert.doesNotThrow(() => {
    new Function(script);
  });
});

// ============================================================================
// PART 3: DomainSimGenerators Integration Tests
// ============================================================================

runTest('Domain Integration: F25 Number-Line Hunter routing', () => {
  const script = DomainSimGenerators.generateSimScript({
    subject: 'Mathematics',
    topic: 'number-line-integers',
    topicSlug: 'number-line-integers',
    grade: 6,
  });

  assert.ok(script.includes('aasha-sim-number-line'), 'Must route number line topic to F25 adapter');
  assert.ok(script.includes('aasha-sim'), 'Must register fallback <aasha-sim>');
});

runTest('Domain Integration: F26 Balance Equation routing', () => {
  const script = DomainSimGenerators.generateSimScript({
    subject: 'Mathematics',
    topic: 'linear-equation-balance',
    topicSlug: 'linear-equation-balance',
    grade: 7,
  });

  assert.ok(script.includes('aasha-sim-balance-equation'), 'Must route balance equation topic to F26 adapter');
  assert.ok(script.includes('aasha-sim'), 'Must register fallback <aasha-sim>');
});

console.log(`\n========================================================`);
console.log(`🎉 ALL ${testsPassed}/${totalTests} F25 & F26 SIMULATION TESTS PASSED (100%)`);
console.log(`========================================================\n`);
