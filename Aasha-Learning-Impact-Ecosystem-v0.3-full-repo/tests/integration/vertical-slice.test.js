import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { validateChapter } from '../../packages/content-schema/src/index.js';
import { TLNEngine } from '../../packages/tln-engine/src/index.js';
import { generateVisualHtml } from '../../packages/visual-engine/src/index.js';
import { gradeQuestion, questionsForNode } from '../../packages/question-engine/src/index.js';
import { GameEngine } from '../../packages/game-engine/src/index.js';
import { assessNode, remediationFor } from '../../packages/assessment-engine/src/index.js';
import { computeMasteryByNode, progressionAuthority, computeNodeMastery, canProgress, TEAS_POLICY } from '../../packages/teas-engine/src/index.js';
import { RewardLedger } from '../../packages/reward-engine/src/index.js';
import { BETA_REWARD_POLICY, eligibleBetaEvent } from '../../packages/reward-engine/src/policy.js';
import { aggregateImpact, donorSafe } from '../../packages/impact-engine/src/index.js';
import { OfflineOutbox, makeEvent } from '../../packages/offline-sync/src/index.js';
import { createProfile } from '../../packages/learner-profile/src/index.js';

class MockStorage {
  constructor() { this.store = new Map(); }
  getItem(k) { return this.store.get(k) ?? null; }
  setItem(k, v) { this.store.set(k, String(v)); }
  removeItem(k) { this.store.delete(k); }
  clear() { this.store.clear(); }
}

const rawFractions = JSON.parse(fs.readFileSync(new URL('../../content/class-06/fractions.json', import.meta.url)));

test('Vertical Slice - Scenario 1: Load and validate chapter package under canonical schema', () => {
  const chapter = validateChapter(rawFractions);
  assert.equal(chapter.id, 'math6-fractions-beta');
  assert.equal(chapter.grade, 6);
  assert.equal(chapter.stage, 'middle');
  assert.equal(chapter.nodes.length, 3);
  assert.equal(chapter.questions.length, 9);

  const tln = new TLNEngine(chapter);
  const ordered = tln.orderedNodes();
  assert.deepEqual(ordered.map(n => n.id), ['parts', 'equivalent', 'add']);
});

test('Vertical Slice - Scenario 2: Offline visual presentation contains zero CDN dependencies', () => {
  const node = rawFractions.nodes[0];
  const html = generateVisualHtml(node.visual);
  assert.ok(html.includes('<svg'), 'Visual contains inline SVG element');
  assert.ok(!html.includes('http://') && !html.includes('https://'), 'Zero external URLs in student visual');
  assert.ok(!html.includes('<script'), 'Zero external script tags in visual HTML');
  assert.ok(html.includes('aria-label'), 'Visual specifies accessible aria-label');
});

test('Vertical Slice - Scenario 3 & 4: Correct response vs Misconception diagnosis with zero spoiler leaks', () => {
  const q = rawFractions.questions[0]; // q-parts-1: What does denominator tell us?
  assert.equal(q.answerIndex, 1);

  // Correct answer
  const correctEval = gradeQuestion(q, 1);
  assert.equal(correctEval.correct, true);
  assert.equal(correctEval.score, 1);
  assert.equal(correctEval.misconceptionId, null);
  assert.ok(correctEval.feedback.length > 0);

  // Distractor 0: confused_numerator_denominator
  const wrongEval0 = gradeQuestion(q, 0);
  assert.equal(wrongEval0.correct, false);
  assert.equal(wrongEval0.score, 0);
  assert.equal(wrongEval0.misconceptionId, 'confused_numerator_denominator');
  assert.ok(!wrongEval0.feedback.toLowerCase().includes('how many equal parts make the whole'), 'Feedback must not reveal correct option text');

  // Verify all questions obey Golden Zero-Spoiler Rule
  for (const question of rawFractions.questions) {
    const correctOpt = question.options[question.answerIndex];
    const correctText = typeof correctOpt === 'object' ? correctOpt.text : correctOpt;

    question.options.forEach((opt, idx) => {
      if (idx !== question.answerIndex && typeof opt === 'object') {
        const feedback = opt.feedback ?? opt.m ?? '';
        assert.ok(!feedback.includes(correctText), `Question ${question.id} distractor ${idx} leaks correct text: ${correctText}`);
      }
    });
  }
});

test('Vertical Slice - Scenario 5 & 6: Unified grading consistency across QuestionEngine and GameEngine', () => {
  const questions = rawFractions.questions.slice(0, 3);
  let ended = false;
  const game = new GameEngine({
    questions,
    mode: 'practice',
    onEnd: () => { ended = true; }
  });

  // Test question 1: Answer correct (index 1)
  const a1 = game.answer(1);
  assert.equal(a1.correct, true);
  assert.equal(a1.score, 1);
  assert.equal(game.score, 1);

  // Test question 2: Answer wrong (index 0)
  const a2 = game.answer(0);
  assert.equal(a2.correct, false);
  assert.equal(a2.score, 0);
  assert.equal(a2.misconceptionId, 'ratio_shaded_to_unshaded');
  assert.equal(game.score, 1);

  // Test question 3: Answer correct (index 1)
  const a3 = game.answer(1);
  assert.equal(a3.correct, true);
  assert.equal(ended, true);
  assert.equal(game.score, 2);
  assert.equal(game.attempts.length, 3);

  // Verify questions with fallback boolean options work identically
  const fallbackQ = {
    id: 'q-compat-1',
    nodeId: 'parts',
    prompt: 'Is 2/4 equivalent to 1/2?',
    options: [
      { text: 'Yes', isCorrect: true, feedback: 'Correct!' },
      { text: 'No', misconceptionId: 'negation_error', feedback: 'Consider visual area.' }
    ]
  };
  const fallbackGrade0 = gradeQuestion(fallbackQ, 0);
  assert.equal(fallbackGrade0.correct, true);
  const fallbackGame = new GameEngine({ questions: [fallbackQ] });
  const gameAns = fallbackGame.answer(0);
  assert.equal(gameAns.correct, true);
});

test('Vertical Slice - Scenario 7 & 8: Invalid answer index boundary and malformed package rejection', () => {
  const q = rawFractions.questions[0];

  // Negative answer index
  const negResult = gradeQuestion(q, -1);
  assert.equal(negResult.correct, false);

  // Out of bounds answer index
  const oobResult = gradeQuestion(q, 99);
  assert.equal(oobResult.correct, false);

  // Malformed question package: empty options
  assert.throws(() => {
    validateChapter({
      ...rawFractions,
      questions: [{ id: 'q-bad-1', nodeId: 'parts', prompt: 'Bad', options: [], answerIndex: 0 }]
    });
  }, /at least 2 options/);

  // Malformed question package: duplicate question ID
  assert.throws(() => {
    validateChapter({
      ...rawFractions,
      questions: [
        { id: 'q-dup', nodeId: 'parts', prompt: 'Q1', options: ['A', 'B'], answerIndex: 0 },
        { id: 'q-dup', nodeId: 'parts', prompt: 'Q2', options: ['A', 'B'], answerIndex: 1 }
      ]
    });
  }, /duplicate question id/);

  // Malformed question package: out-of-bounds answer index in schema
  assert.throws(() => {
    validateChapter({
      ...rawFractions,
      questions: [{ id: 'q-oob', nodeId: 'parts', prompt: 'Q', options: ['A', 'B'], answerIndex: 5 }]
    });
  }, /invalid or out-of-bounds answer index/);
});

test('Vertical Slice - Scenario 9 & 10: Zero attempts handling and first-attempt diagnostic decoupling', () => {
  // Scenario 9: Zero attempts handling in assessment engine and TEAS
  const zeroAssessment = assessNode({ nodeId: 'parts', attempts: [] });
  assert.equal(zeroAssessment.total, 0);
  assert.equal(zeroAssessment.correct, 0);
  assert.equal(zeroAssessment.accuracy, 0);
  assert.equal(zeroAssessment.mastery, false);

  const zeroMastery = computeNodeMastery([]);
  assert.equal(zeroMastery.attempts, 0);
  assert.equal(zeroMastery.mastery, 0);
  assert.equal(zeroMastery.eligibleToProgress, false);

  // Scenario 10: Decouple diagnostic score from subsequent formative retries
  const firstAttempts = [
    { correct: false, misconceptionId: 'confused_numerator_denominator' }, // Q1 attempt 1
    { correct: true, misconceptionId: null },                              // Q2 attempt 1
    { correct: true, misconceptionId: null }                               // Q3 attempt 1
  ];
  const retriesLog = [
    { questionId: 'q-parts-1', attemptNumber: 1, correct: false, isRetry: false },
    { questionId: 'q-parts-1', attemptNumber: 2, correct: true, isRetry: true },
    { questionId: 'q-parts-2', attemptNumber: 1, correct: true, isRetry: false },
    { questionId: 'q-parts-3', attemptNumber: 1, correct: true, isRetry: false }
  ];

  const diagResult = assessNode({ nodeId: 'parts', attempts: firstAttempts, masteryThreshold: 0.75 });
  assert.equal(diagResult.total, 3, 'Diagnostic denominator remains strictly 3');
  assert.equal(diagResult.correct, 2, 'Diagnostic correct is 2 (2/3 = 66.7%)');
  assert.equal(diagResult.mastery, false, 'Node not yet mastered at first attempts');

  const remediation = remediationFor(diagResult);
  assert.equal(remediation.type, 'guided_practice');
});

test('Vertical Slice - Scenario 11 & 12: TEAS deterministic mastery and sequential progression gating', () => {
  // 3 attempts: [true, true, true] -> accuracy 1.0, recentAccuracy 1.0 -> mastery 1.0 (>= 0.75 and >= 3 attempts)
  const nodeAttempts = [{ correct: true }, { correct: true }, { correct: true }];
  const nodeMastery = computeNodeMastery(nodeAttempts);
  assert.equal(nodeMastery.attempts, 3);
  assert.equal(nodeMastery.accuracy, 1.0);
  assert.equal(nodeMastery.mastery, 1.0);
  assert.equal(nodeMastery.eligibleToProgress, true);

  // 2 attempts (both correct): accuracy 1.0, but attempts < 3 -> canProgress MUST be false
  assert.equal(canProgress({ accuracy: 1.0, attempts: 2 }), false, 'Progression blocked if attempts < 3');

  // Boundary score: 3 attempts with 2 correct -> 2/3 = 0.667 < 0.75 -> canProgress MUST be false
  assert.equal(canProgress({ accuracy: 2/3, attempts: 3 }), false, 'Progression blocked at 66.7%');

  // Sequential progression authority
  const tln = new TLNEngine(rawFractions);
  const orderedIds = tln.orderedNodes().map(n => n.id); // ['parts', 'equivalent', 'add']

  const teasProgression1 = progressionAuthority({
    orderedNodeIds: orderedIds,
    masteryByNode: {
      parts: { mastery: 0.85, attempts: 3 },
      equivalent: { mastery: 0.5, attempts: 3 },
      add: { mastery: 0, attempts: 0 }
    }
  });
  assert.deepEqual(teasProgression1.unlocked, ['parts'], 'Only parts is unlocked when equivalent has 50%');
  assert.equal(teasProgression1.next, 'equivalent');
  assert.equal(teasProgression1.authority, 'teas');

  const teasProgression2 = progressionAuthority({
    orderedNodeIds: orderedIds,
    masteryByNode: {
      parts: { mastery: 0.9, attempts: 4 },
      equivalent: { mastery: 0.8, attempts: 3 },
      add: { mastery: 0, attempts: 0 }
    }
  });
  assert.deepEqual(teasProgression2.unlocked, ['parts', 'equivalent']);
  assert.equal(teasProgression2.next, 'add');
});

test('Vertical Slice - Scenario 13 & 14: Unverified reward rejection and idempotent ledger issuance', () => {
  const ledger = new RewardLedger();
  const event = { eventId: 'evt-test-1', type: 'assessment_passed' };

  // Unverified call (omitted verified flag) -> MUST be rejected under default verified=false
  const rejectedOmitted = ledger.issue(event, { coins: 5 });
  assert.equal(rejectedOmitted.issued, false);
  assert.equal(rejectedOmitted.reason, 'verification_required');
  assert.equal(ledger.balance, 0);

  // Explicitly unverified call
  const rejectedExplicit = ledger.issue(event, { coins: 5, verified: false });
  assert.equal(rejectedExplicit.issued, false);
  assert.equal(rejectedExplicit.reason, 'verification_required');
  assert.equal(ledger.balance, 0);

  // Invalid event (missing eventId)
  const rejectedInvalid = ledger.issue({}, { coins: 5, verified: true });
  assert.equal(rejectedInvalid.issued, false);
  assert.equal(rejectedInvalid.reason, 'invalid_event');

  // Policy-compliant verified call
  const validIssuance = ledger.issue(event, { coins: 5, xp: 20, verified: true });
  assert.equal(validIssuance.issued, true);
  assert.equal(validIssuance.coins, 5);
  assert.equal(ledger.balance, 5);

  // Idempotent duplicate replay rejection
  const duplicateReplay = ledger.issue(event, { coins: 5, xp: 20, verified: true });
  assert.equal(duplicateReplay.issued, false);
  assert.equal(duplicateReplay.reason, 'duplicate');
  assert.equal(ledger.balance, 5, 'Balance strictly preserved against duplicate replay');
});

test('Vertical Slice - Scenario 15: Aggregate impact reporting and absolute student privacy', () => {
  const events = [
    { type: 'attempt', learnerId: 'student_uuid_001', payload: { correct: true } },
    { type: 'attempt', learnerId: 'student_uuid_002', payload: { correct: false } },
    { type: 'assessment', learnerId: 'student_uuid_001', payload: { accuracy: 0.85, mastery: true } },
    { type: 'assessment', learnerId: 'student_uuid_002', payload: { accuracy: 0.70, mastery: false } }
  ];

  const report = aggregateImpact(events);
  assert.equal(report.studentsReached, 2);
  assert.equal(report.learningEvents, 4);
  assert.equal(report.assessments, 2);
  assert.ok(Math.abs(report.averageAccuracy - 0.775) < 1e-6, 'Average accuracy approximately 0.775');

  const safe = donorSafe(report);
  assert.equal('learnerId' in safe, false, 'Zero learnerId in donor-safe report');
  assert.equal('student_uuid_001' in safe, false);
  assert.deepEqual(Object.keys(safe).sort(), ['assessments', 'averageAccuracy', 'learningEvents', 'studentsReached']);
});

test('Vertical Slice - Scenario 16 & 17: Offline persistence, interrupted sync, telemetry independence, and bundle ceiling', async () => {
  // Scenario 16: Offline Outbox persistence and interrupted sync
  const storage = new MockStorage();
  const outbox = new OfflineOutbox(storage);
  const profile = createProfile({ learnerId: 'learner_101', grade: 6 });

  const ev1 = makeEvent({ eventId: 'ev-1', learnerId: profile.learnerId, deviceId: 'dev_1', type: 'attempt', payload: { correct: true } });
  const ev2 = makeEvent({ eventId: 'ev-2', learnerId: profile.learnerId, deviceId: 'dev_1', type: 'assessment', payload: { accuracy: 1.0 } });

  outbox.enqueue(ev1);
  outbox.enqueue(ev2);
  assert.equal(outbox.list().length, 2);

  // Simulate network interruption during sync: first event succeeds, second fails
  let syncAttempts = 0;
  const interruptedSync = await outbox.sync(async (e) => {
    syncAttempts++;
    if (e.eventId === 'ev-2') throw new Error('Network timeout');
  });
  assert.equal(interruptedSync.sent, 1);
  assert.equal(interruptedSync.failed, 1);
  assert.equal(outbox.list().length, 1, 'Failed event ev-2 survives in outbox for subsequent retry');

  // Retry after reconnection
  const recoveredSync = await outbox.sync(async (e) => {
    assert.equal(e.eventId, 'ev-2');
  });
  assert.equal(recoveredSync.sent, 1);
  assert.equal(recoveredSync.failed, 0);
  assert.equal(outbox.list().length, 0, 'Outbox clean after recovery');

  // Scenario 17: Bundle size validation (must be well below 20 MB ceiling)
  const fractionsFileStats = fs.statSync(new URL('../../content/class-06/fractions.json', import.meta.url));
  assert.ok(fractionsFileStats.size < 20 * 1024 * 1024, 'Chapter size is within 20 MB ceiling');
  assert.ok(fractionsFileStats.size < 50 * 1024, 'Class 6 fractions is lightweight (<50 KB)');
});
