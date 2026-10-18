import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { generateVisualHtml } from '../../packages/visual-engine/src/index.js';
import { gradeQuestion, questionsForNode } from '../../packages/question-engine/src/index.js';
import { validateChapter } from '../../packages/content-schema/src/index.js';
import { assessNode } from '../../packages/assessment-engine/src/index.js';
import { RewardLedger } from '../../packages/reward-engine/src/index.js';

const chapter = JSON.parse(fs.readFileSync(new URL('../../content/class-06/fractions.json', import.meta.url)));

test('P0-A & ISS-02: Visual engine renders interactive SVG fraction bar with keyboard accessibility', () => {
  const visualDef = {
    type: 'fraction-bar',
    shaded: 3,
    total: 4,
    interactive: true
  };
  const html = generateVisualHtml(visualDef);
  assert.ok(html.includes('<svg'), 'Visual output contains SVG element');
  assert.ok(html.includes('fraction-bar-svg'), 'Contains fraction-bar-svg class');
  assert.ok(html.includes('aria-label="3 out of 4 equal parts shaded"'), 'Contains accessible aria label');
  assert.ok(html.includes('data-index="0"'), 'Contains data-index attribute for interactive cells');
  assert.ok(html.includes('shaded'), 'Correctly marks shaded parts');
  assert.ok(html.includes('unshaded'), 'Correctly marks unshaded parts');

  // ISS-02 Accessibility assertions
  assert.ok(html.includes('tabindex="0"'), 'Interactive cells have tabindex="0" for keyboard focus');
  assert.ok(html.includes('role="button"'), 'Interactive cells declare role="button"');
  assert.ok(html.includes('aria-pressed="true"'), 'Shaded cells declare aria-pressed="true"');
  assert.ok(html.includes('aria-pressed="false"'), 'Unshaded cells declare aria-pressed="false"');
});

test('P0-B & P0-D: Question engine extracts distractor-specific feedback and misconception IDs', () => {
  const q = chapter.questions[0]; // q-parts-1
  assert.equal(q.nodeId, 'parts');
  assert.equal(q.answerIndex, 1);

  // Correct answer evaluation (index 1)
  const correctEval = gradeQuestion(q, 1);
  assert.equal(correctEval.correct, true);
  assert.ok(correctEval.feedback.includes('denominator names the total equal divisions'));
  assert.equal(correctEval.misconceptionId, null);

  // Distractor evaluation with diagnosed misconception (index 0)
  const wrongEval = gradeQuestion(q, 0);
  assert.equal(wrongEval.correct, false);
  assert.equal(wrongEval.misconceptionId, 'confused_numerator_denominator');
  assert.ok(wrongEval.feedback.includes('numerator'));

  // Another distractor evaluation with misconception (index 3)
  const wrongEval2 = gradeQuestion(q, 3);
  assert.equal(wrongEval2.correct, false);
  assert.equal(wrongEval2.misconceptionId, 'unshaded_parts_confusion');

  // Distractor evaluation on question 2 (q-parts-2: ratio_shaded_to_unshaded)
  const q2 = chapter.questions[1];
  const q2Distractor = gradeQuestion(q2, 0); // 3/5 instead of 3/8
  assert.equal(q2Distractor.correct, false);
  assert.equal(q2Distractor.misconceptionId, 'ratio_shaded_to_unshaded');
  assert.ok(q2Distractor.feedback.includes('compares colored parts to uncolored parts'));

  // Backward compatibility test with simple string options
  const legacyQ = {
    id: 'legacy-1',
    prompt: 'What is 1 + 1?',
    options: ['1', '2', '3'],
    answerIndex: 1
  };
  const legacyEvalCorrect = gradeQuestion(legacyQ, 1);
  assert.equal(legacyEvalCorrect.correct, true);
  assert.equal(legacyEvalCorrect.feedback, 'Correct! Great job.');

  const legacyEvalWrong = gradeQuestion(legacyQ, 0);
  assert.equal(legacyEvalWrong.correct, false);
  assert.equal(legacyEvalWrong.feedback, 'Not quite. Think about what the question is asking.');
  assert.equal(legacyEvalWrong.misconceptionId, null);
});

test('P0-C: Fractions chapter contains 3 diagnostic questions per concept node', () => {
  const validated = validateChapter(chapter);
  assert.equal(validated.questions.length, 9, 'Chapter has 9 questions across 3 nodes');

  const nodes = ['parts', 'equivalent', 'add'];
  for (const nodeId of nodes) {
    const nodeQuestions = questionsForNode(chapter, nodeId);
    assert.equal(nodeQuestions.length, 3, `Node ${nodeId} has exactly 3 diagnostic questions`);
    
    // Check that each question has diagnosed distractors
    for (const q of nodeQuestions) {
      assert.ok(Array.isArray(q.options), `Question ${q.id} has options`);
      assert.ok(q.options.length >= 3, `Question ${q.id} has at least 3 options`);
      
      // Verify distractors have feedback
      q.options.forEach((opt, idx) => {
        if (typeof opt === 'object') {
          assert.ok(opt.text, `Option ${idx} has text`);
          assert.ok(opt.feedback, `Option ${idx} has feedback`);
          if (idx !== q.answerIndex) {
            assert.ok(opt.misconceptionId, `Distractor ${idx} in ${q.id} has misconceptionId`);
          }
        }
      });
    }
  }
});

test('ISS-01: Two-tier attempt tracking decouples diagnostic score from retries', () => {
  // Scenario 1: Q1 wrong -> retry correct -> Q2 correct -> Q3 correct
  const firstAttemptsScenario1 = [
    { correct: false, misconceptionId: 'confused_numerator_denominator' }, // Q1 first attempt
    { correct: true, misconceptionId: null },                              // Q2 first attempt
    { correct: true, misconceptionId: null }                               // Q3 first attempt
  ];
  const retryLogScenario1 = [
    { questionId: 'q-parts-1', attemptNumber: 1, correct: false, isRetry: false },
    { questionId: 'q-parts-1', attemptNumber: 2, correct: true, isRetry: true },
    { questionId: 'q-parts-2', attemptNumber: 1, correct: true, isRetry: false },
    { questionId: 'q-parts-3', attemptNumber: 1, correct: true, isRetry: false }
  ];

  const res1 = assessNode({ nodeId: 'parts', attempts: firstAttemptsScenario1, masteryThreshold: 0.75 });
  assert.equal(res1.total, 3, 'Diagnostic denominator remains strictly 3 (not 4)');
  assert.equal(res1.correct, 2, 'Diagnostic correct is 2 (first attempt on Q1 was wrong)');
  assert.equal(res1.accuracy, 2 / 3, 'Accuracy is exactly 2/3');
  assert.equal(retryLogScenario1.filter(l => l.isRetry).length, 1, 'Retry log captures the retry');

  // Scenario 2: Q1 wrong -> retry wrong -> retry correct -> Q2 correct -> Q3 correct
  const firstAttemptsScenario2 = [
    { correct: false, misconceptionId: 'confused_numerator_denominator' },
    { correct: true, misconceptionId: null },
    { correct: true, misconceptionId: null }
  ];
  const retryLogScenario2 = [
    { questionId: 'q-parts-1', attemptNumber: 1, correct: false, isRetry: false },
    { questionId: 'q-parts-1', attemptNumber: 2, correct: false, isRetry: true },
    { questionId: 'q-parts-1', attemptNumber: 3, correct: true, isRetry: true },
    { questionId: 'q-parts-2', attemptNumber: 1, correct: true, isRetry: false },
    { questionId: 'q-parts-3', attemptNumber: 1, correct: true, isRetry: false }
  ];

  const res2 = assessNode({ nodeId: 'parts', attempts: firstAttemptsScenario2, masteryThreshold: 0.75 });
  assert.equal(res2.total, 3, 'Diagnostic denominator remains strictly 3 even after multiple retries (not 5)');
  assert.equal(res2.correct, 2, 'Diagnostic correct remains 2');
  assert.equal(retryLogScenario2.filter(l => l.isRetry).length, 2, 'Retry log captures all 2 retries');
});

test('ISS-03: Deterministic reward event ID prevents duplicate coins on replay', () => {
  const ledger = new RewardLedger();
  const learnerId = 'test-learner-1';
  const nodeId = 'parts';
  const qId = 'q-parts-1';

  const rewardEventId = `reward:${learnerId}:${nodeId}:${qId}`;

  const rewardEvent = { eventId: rewardEventId, type: 'assessment_passed', verifiedByHuman: true };

  // First run: earns reward
  const firstClaim = ledger.issue(rewardEvent, { coins: 1, xp: 5 });
  assert.equal(firstClaim.issued, true);
  assert.equal(firstClaim.coins, 1);
  assert.equal(ledger.balance, 1);

  // Second run (replay): deduplicated, zero extra coins
  const secondClaim = ledger.issue(rewardEvent, { coins: 1, xp: 5 });
  assert.equal(secondClaim.issued, false);
  assert.equal(secondClaim.reason, 'duplicate');
  assert.equal(ledger.balance, 1, 'Balance does not increase on replay');
});
