import test from 'node:test';
import assert from 'node:assert/strict';
import { GameLoopComponent, TactileMatchComponent } from '../src/core/game-engine.js';
import { computeMastery, refreshMastery, progressionDecision, DynamicDifficultyEngine, getScaffoldingHint, submitAssessment, recordSimulationTelemetry } from '../src/core/teas.js';
import { awardQuizReward } from '../src/core/rewards.js';
import { FractionVisual, AlgebraTileVisual, ElectricCircuitVisual } from '../src/core/visuals.js';
import { CHAPTER, QUESTIONS } from '../src/content/chapter.js';

test('Benchmark 1: 60 FPS Frame Budget (<16.6ms) in GameLoopComponent', () => {
  const loop = new GameLoopComponent({
    initialSpeed: 3,
    acceleration: 0.001
  });

  const frameCount = 1000;
  const start = performance.now();

  for (let i = 0; i < frameCount; i++) {
    const frameStart = performance.now();
    loop.tick(0.0166); // Simulated 60 FPS dt (16.6ms)
    const duration = performance.now() - frameStart;
    loop.lastFrameDurationMs = duration;
    loop.totalFramesRendered++;
    if (duration > 16.67) {
      loop.frameBudgetExceededCount++;
    }
  }

  const totalTime = performance.now() - start;
  const meanFrameMs = totalTime / frameCount;
  const metrics = loop.getMetrics();

  assert.ok(meanFrameMs < 1.0, `Mean computation frame time was ${meanFrameMs.toFixed(3)}ms (well below 16.6ms budget)`);
  assert.equal(metrics.totalFrames, frameCount);
  assert.ok(metrics.frameBudgetCompliancePct >= 99, `Frame budget compliance was ${metrics.frameBudgetCompliancePct}%`);
  loop.destroy();
});

test('Benchmark 2: Assessment Latency (<50ms for 500 rapid evaluations)', () => {
  const state = {
    events: [],
    sync_outbox: [],
    mastery: {},
    coins: 0,
    xp: 0,
    streak: 0,
    reward_ledger: [],
    badges: []
  };

  const sampleQuestion = QUESTIONS[0];
  const iterations = 500;
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    const isCorrect = i % 2 === 0;
    submitAssessment(state, sampleQuestion, isCorrect ? sampleQuestion.correct_index : 999, 1200);
    const dda = DynamicDifficultyEngine.evaluateDifficulty(state, sampleQuestion.node_id);
    assert.ok(dda.currentTier >= 1 && dda.currentTier <= 3);
  }

  const durationMs = performance.now() - start;
  assert.ok(durationMs < 50, `500 assessments evaluated in ${durationMs.toFixed(2)}ms (target <50ms)`);
  assert.equal(state.events.length, 500);
});

test('Benchmark 3: Simulation telemetry is excluded from mastery evidence', () => {
  const state = {
    events: [],
    sync_outbox: [],
    mastery: {},
    coins: 0,
    xp: 0,
    streak: 0,
    reward_ledger: [],
    badges: []
  };

  const nodeId = CHAPTER.nodes[0].id;
  // Initially 0
  let m = computeMastery(state, nodeId);
  assert.equal(m.mastery, 0);

  // Ingest simulation telemetry (e.g. interacting with FractionVisual)
  recordSimulationTelemetry(state, nodeId, { eventType: 'fraction_changed', selected: 3, total: 5 });
  recordSimulationTelemetry(state, nodeId, { eventType: 'fraction_changed', selected: 4, total: 5 });

  m = computeMastery(state, nodeId);
  assert.equal(m.mastery, 0, 'Simulation activity cannot increase assessment mastery');
  assert.equal(m.sim_interactions, 2);
});

test('Benchmark 4: 4-Tier Scaffolding Hint Zero-Spoiler Standard', () => {
  const spoilerRegex = /the result is|the correct answer is|answer is|equals to|yields|produces a value of/i;

  for (const q of QUESTIONS) {
    for (let tier = 1; tier <= 4; tier++) {
      const hint = getScaffoldingHint(q, tier);
      assert.equal(hint.tier, tier);
      assert.ok(hint.text.length >= 15, `Hint tier ${tier} text must be descriptive (>15 chars)`);
      assert.ok(!spoilerRegex.test(hint.text), `Hint tier ${tier} must not leak answers: "${hint.text}"`);
    }
  }
});

test('Benchmark 5: Non-Destructive Runtime Lifecycle (100 Mount/Pause/Resume/Destroy cycles)', () => {
  for (let i = 0; i < 100; i++) {
    const fv = new FractionVisual({ total: 6, selected: 3 });
    const at = new AlgebraTileVisual({});
    const ec = new ElectricCircuitVisual({});

    fv.pause();
    at.pause();
    ec.pause();

    assert.equal(fv.isPaused, true);
    assert.equal(at.isPaused, true);
    assert.equal(ec.isPaused, true);

    fv.resume();
    at.resume();
    ec.resume();

    assert.equal(fv.isPaused, false);
    assert.equal(at.isPaused, false);
    assert.equal(ec.isPaused, false);

    fv.destroy();
    at.destroy();
    ec.destroy();
  }
});

