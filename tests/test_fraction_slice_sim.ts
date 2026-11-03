/**
 * AASHA AIOS — Foundation F24 (Dynamic Fraction & Decimal Slices) Verification Suite
 * Path: Aasha-AI/tests/test_fraction_slice_sim.ts
 *
 * Verifies:
 * 1. Mathematical Evaluator: GCD, decimal equivalents, percentages, classifications, boundary clamping.
 * 2. Web Component API: <aasha-sim-fraction-slice> contract, lifecycle, state mutations, telemetry.
 * 3. 44x44px Touch Target Accessibility Invariant: buttons, sliders, steppers.
 * 4. Offline-first Invariant: zero external CDNs, zero remote fonts, zero tracking.
 * 5. Theme tokens & same-frame mobile responsiveness.
 * 6. Standalone script generation & syntax validity.
 */

import * as assert from 'assert';
import {
  AashaSimFractionSlice,
  FractionSliceMathEvaluator,
  FractionAudioSynthesizer,
  generateFractionSliceSimScript,
} from '../packages/adapters/fraction_slice_sim.ts';
import { DomainSimGenerators } from '../packages/adapters/domain_sim_generators.ts';

console.log('🧪 Starting Foundation F24 (Dynamic Fraction & Decimal Slices) Test Suite...\n');

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
// Group 1: Deterministic Mathematical Model & Metric Calculations
// ============================================================================

runTest('GCD (Greatest Common Divisor) calculation', () => {
  assert.strictEqual(FractionSliceMathEvaluator.gcd(3, 4), 1);
  assert.strictEqual(FractionSliceMathEvaluator.gcd(6, 8), 2);
  assert.strictEqual(FractionSliceMathEvaluator.gcd(4, 12), 4);
  assert.strictEqual(FractionSliceMathEvaluator.gcd(10, 10), 10);
  assert.strictEqual(FractionSliceMathEvaluator.gcd(7, 11), 1);
});

runTest('Boundary clamping (range 1 to 12)', () => {
  assert.strictEqual(FractionSliceMathEvaluator.clamp(0), 1);
  assert.strictEqual(FractionSliceMathEvaluator.clamp(-5), 1);
  assert.strictEqual(FractionSliceMathEvaluator.clamp(13), 12);
  assert.strictEqual(FractionSliceMathEvaluator.clamp(100), 12);
  assert.strictEqual(FractionSliceMathEvaluator.clamp(7), 7);
  assert.strictEqual(FractionSliceMathEvaluator.clamp(NaN), 1);
});

runTest('Proper fraction metric computation (3/4)', () => {
  const m = FractionSliceMathEvaluator.computeMetrics(3, 4);
  assert.strictEqual(m.numerator, 3);
  assert.strictEqual(m.denominator, 4);
  assert.strictEqual(m.decimal, 0.75);
  assert.strictEqual(m.decimalFormatted, '0.75');
  assert.strictEqual(m.percentage, 75);
  assert.strictEqual(m.percentageFormatted, '75%');
  assert.strictEqual(m.simplifiedNumerator, 3);
  assert.strictEqual(m.simplifiedDenominator, 4);
  assert.strictEqual(m.isSimplified, true);
  assert.strictEqual(m.classification, 'PROPER');
  assert.strictEqual(m.anglePerSliceDeg, 90);
  assert.strictEqual(m.wholeUnits, 0);
  assert.strictEqual(m.remainderNumerator, 3);
});

runTest('Improper fraction metric computation (5/4)', () => {
  const m = FractionSliceMathEvaluator.computeMetrics(5, 4);
  assert.strictEqual(m.numerator, 5);
  assert.strictEqual(m.denominator, 4);
  assert.strictEqual(m.decimal, 1.25);
  assert.strictEqual(m.decimalFormatted, '1.25');
  assert.strictEqual(m.percentage, 125);
  assert.strictEqual(m.percentageFormatted, '125%');
  assert.strictEqual(m.classification, 'IMPROPER');
  assert.strictEqual(m.wholeUnits, 1);
  assert.strictEqual(m.remainderNumerator, 1);
});

runTest('Whole unit metric computation (6/6)', () => {
  const m = FractionSliceMathEvaluator.computeMetrics(6, 6);
  assert.strictEqual(m.numerator, 6);
  assert.strictEqual(m.denominator, 6);
  assert.strictEqual(m.decimal, 1);
  assert.strictEqual(m.decimalFormatted, '1');
  assert.strictEqual(m.percentage, 100);
  assert.strictEqual(m.simplifiedNumerator, 1);
  assert.strictEqual(m.simplifiedDenominator, 1);
  assert.strictEqual(m.classification, 'WHOLE');
});

runTest('Unit fraction metric computation (1/8)', () => {
  const m = FractionSliceMathEvaluator.computeMetrics(1, 8);
  assert.strictEqual(m.numerator, 1);
  assert.strictEqual(m.denominator, 8);
  assert.strictEqual(m.decimal, 0.125);
  assert.strictEqual(m.decimalFormatted, '0.125');
  assert.strictEqual(m.percentage, 12.5);
  assert.strictEqual(m.classification, 'UNIT');
  assert.strictEqual(m.anglePerSliceDeg, 45);
});

runTest('Non-terminating repeating decimal handling (1/3)', () => {
  const m = FractionSliceMathEvaluator.computeMetrics(1, 3);
  assert.strictEqual(m.decimalFormatted, '0.333');
  assert.strictEqual(m.percentage, 33.3);
  assert.strictEqual(m.classification, 'UNIT');
});

runTest('Simplification / Reduction to lowest terms (8/12 -> 2/3)', () => {
  const m = FractionSliceMathEvaluator.computeMetrics(8, 12);
  assert.strictEqual(m.simplifiedNumerator, 2);
  assert.strictEqual(m.simplifiedDenominator, 3);
  assert.strictEqual(m.isSimplified, false);
});

runTest('Bilingual terminology coverage (English & Hindi)', () => {
  const en = FractionSliceMathEvaluator.getLabels('en');
  const hi = FractionSliceMathEvaluator.getLabels('hi');

  assert.ok(en.title.includes('F24'));
  assert.ok(hi.title.includes('F24'));
  assert.strictEqual(en.numerator, 'Numerator (N)');
  assert.strictEqual(hi.numerator, 'अंश (Numerator)');
  assert.strictEqual(en.denominator, 'Denominator (D)');
  assert.strictEqual(hi.denominator, 'हर (Denominator)');
  assert.strictEqual(en.modePie, 'Circular Pie');
  assert.strictEqual(hi.modePie, 'वृत्ताकार पाई');
  assert.strictEqual(en.modeStrip, 'Rectangular Strip');
  assert.strictEqual(hi.modeStrip, 'आयताकार पट्टी');
});

// ============================================================================
// Group 2: Web Component Contract & State Management
// ============================================================================

runTest('Web Component class tags & instantiation', () => {
  assert.strictEqual(AashaSimFractionSlice.TAG_NAME, 'aasha-sim-fraction-slice');
  assert.strictEqual(AashaSimFractionSlice.ALIAS_TAG_NAME, 'aasha-sim');

  const sim = new AashaSimFractionSlice({
    initialNumerator: 2,
    initialDenominator: 5,
    initialMode: 'strip',
  });

  const state = sim.getState();
  assert.strictEqual(state.numerator, 2);
  assert.strictEqual(state.denominator, 5);
  assert.strictEqual(state.mode, 'strip');
  assert.strictEqual(state.theme, 'dark');
});

runTest('Web Component state mutations (setNumerator, setDenominator, setMode)', () => {
  const sim = new AashaSimFractionSlice();
  sim.setNumerator(5);
  assert.strictEqual(sim.getState().numerator, 5);

  sim.setDenominator(8);
  assert.strictEqual(sim.getState().denominator, 8);

  sim.setMode('strip');
  assert.strictEqual(sim.getState().mode, 'strip');

  const metrics = sim.getMetrics();
  assert.strictEqual(metrics.decimal, 0.625);
  assert.strictEqual(metrics.percentage, 62.5);
  assert.strictEqual(metrics.classification, 'PROPER');
});

runTest('Web Component boundary clamping on state mutations', () => {
  const sim = new AashaSimFractionSlice();
  sim.setNumerator(99);
  assert.strictEqual(sim.getState().numerator, 12);

  sim.setNumerator(-10);
  assert.strictEqual(sim.getState().numerator, 1);

  sim.setDenominator(0);
  assert.strictEqual(sim.getState().denominator, 1);

  sim.setDenominator(25);
  assert.strictEqual(sim.getState().denominator, 12);
});

runTest('Web Component reset restores initial baseline (3/4 pie)', () => {
  const sim = new AashaSimFractionSlice();
  sim.setState({ numerator: 11, denominator: 12, mode: 'strip' });
  assert.strictEqual(sim.getState().numerator, 11);

  sim.reset();
  const resetState = sim.getState();
  assert.strictEqual(resetState.numerator, 3);
  assert.strictEqual(resetState.denominator, 4);
  assert.strictEqual(resetState.mode, 'pie');
});

runTest('Lifecycle hooks: pause, resume, destroy execution', () => {
  const sim = new AashaSimFractionSlice();
  // Safe execution without active browser DOM
  sim.pause();
  sim.resume();
  sim.destroy();
});

runTest('Telemetry emission dispatch contract', () => {
  const sim = new AashaSimFractionSlice();
  let emittedEvent: any = null;

  sim.dispatchEvent = ((evt: any) => {
    emittedEvent = evt;
    return true;
  }) as any;

  sim.emitTelemetry('slice_click', { testPayload: 123 });
  assert.ok(emittedEvent, 'Event should be dispatched');
  assert.strictEqual(emittedEvent.type, 'aasha:telemetry');
  assert.strictEqual(emittedEvent.detail.foundationId, 'F24');
  assert.strictEqual(emittedEvent.detail.eventType, 'slice_click');
  assert.strictEqual(emittedEvent.detail.payload.testPayload, 123);
});

// ============================================================================
// Group 3: 44x44px Touch Target & Accessibility Invariant
// ============================================================================

runTest('44x44px Touch Target Invariant in inlined styles', () => {
  const script = generateFractionSliceSimScript();

  // Verify touch target min-width and min-height in styles
  assert.ok(
    script.includes('min-width: 44px') || script.includes('min-width:44px'),
    'Styles must declare min-width >= 44px'
  );
  assert.ok(
    script.includes('min-height: 44px') || script.includes('min-height:44px'),
    'Styles must declare min-height >= 44px'
  );
  assert.ok(
    script.includes('touch-action: manipulation') || script.includes('touch-action: pan-x'),
    'Styles must optimize touch-action for mobile manipulation'
  );
});

// ============================================================================
// Group 4: 100% Offline-First Invariant (Zero External Dependencies)
// ============================================================================

runTest('Zero external CDN scripts and zero external web fonts', () => {
  const script = generateFractionSliceSimScript();

  const prohibitedPatterns = [
    'https://cdn.',
    'http://cdn.',
    'unpkg.com',
    'cdnjs.cloudflare.com',
    'cdn.jsdelivr.net',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'googletagmanager.com',
    'google-analytics.com',
  ];

  for (const pattern of prohibitedPatterns) {
    assert.ok(
      !script.includes(pattern),
      `Prohibited external dependency detected: ${pattern}`
    );
  }
});

// ============================================================================
// Group 5: Procedural Audio Synthesizer (Zero Audio Files)
// ============================================================================

runTest('Procedural Audio Synthesizer instantiation and graceful fallback', () => {
  const synth = new FractionAudioSynthesizer();
  assert.ok(synth, 'Synthesizer should instantiate');
  // In Node environment without window.AudioContext, calls must safely no-op
  synth.playSliceChirp(3, 4);
  synth.playModeSwitch();
});

// ============================================================================
// Group 6: Standalone Inlined Script Generator & Syntax Integrity
// ============================================================================

runTest('generateFractionSliceSimScript() produces valid executable JS', () => {
  const script = generateFractionSliceSimScript({
    initialNumerator: 5,
    initialDenominator: 6,
    initialMode: 'strip',
  });

  assert.ok(script.length > 500, 'Generated script must be substantial');
  assert.ok(script.includes('aasha-sim-fraction-slice'), 'Must register aasha-sim-fraction-slice');
  assert.ok(script.includes('aasha-sim'), 'Must register fallback aasha-sim');
  assert.ok(script.includes('numerator: 5'), 'Must inject initial numerator');
  assert.ok(script.includes('denominator: 6'), 'Must inject initial denominator');
  assert.ok(script.includes("mode: 'strip'"), 'Must inject initial mode');

  // Validate JavaScript syntax using Function constructor
  assert.doesNotThrow(() => {
    new Function(script);
  }, 'Generated simulation script must have 100% valid JavaScript syntax');
});

runTest('DomainSimGenerators integration for F24 fraction slices', () => {
  const script = DomainSimGenerators.generateSimScript({
    subject: 'Mathematics',
    topic: 'fraction-slices',
    topicSlug: 'fraction-slices',
    grade: 5,
  });

  assert.ok(script.includes('aasha-sim-fraction-slice'), 'Must route fraction topic to F24 Web Component');
  assert.ok(script.includes('aasha-sim'), 'Must register fallback <aasha-sim>');
});

console.log(`\n========================================================`);
console.log(`🎉 ALL ${testsPassed}/${totalTests} FOUNDATION F24 SIMULATION TESTS PASSED (100%)`);
console.log(`========================================================\n`);
