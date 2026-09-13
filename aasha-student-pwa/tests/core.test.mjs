import test from 'node:test';
import assert from 'node:assert/strict';
import { computeMastery, progressionDecision, DynamicDifficultyEngine } from '../src/core/teas.js';
import { validateChapter, validateQuestion } from '../src/core/content-schema.js';
import { awardQuizReward } from '../src/core/rewards.js';
import { rt, shieldMath, unshieldMath } from '../src/core/lle.js';
import { CHAPTERS_CATALOG, CHAPTER, QUESTIONS } from '../src/content/chapter.js';

test('1. Universal K-12 Schema Valid for ALL Catalog Chapters', () => {
  assert.ok(CHAPTERS_CATALOG.length >= 4, 'Catalog must contain multi-class multi-subject chapters');
  for (const chap of CHAPTERS_CATALOG) {
    const res = validateChapter(chap);
    assert.deepEqual(res, { valid: true, errors: [] }, `Chapter ${chap.id} failed validation: ${res.errors.join(', ')}`);
    assert.ok(chap.grade >= 1 && chap.grade <= 10, `Grade must be in 1-10 range: ${chap.grade}`);
    assert.ok(['Mathematics', 'Science'].includes(chap.subject), `Subject must be standardized: ${chap.subject}`);
  }
});

test('2. Question Schema Binds 100% of Questions to TLN Nodes with 3-Tier Structure', () => {
  for (const chap of CHAPTERS_CATALOG) {
    const nodeIds = new Set(chap.nodes.map(n => n.id));
    assert.ok(chap.questions && chap.questions.length >= 3, `Chapter ${chap.id} must have at least 3 assessment questions`);

    const tiers = new Set(chap.questions.map(q => q.tier));
    assert.ok(tiers.has(1), `Chapter ${chap.id} must have Tier 1 (Warm-up)`);
    assert.ok(tiers.has(2), `Chapter ${chap.id} must have Tier 2 (Deep Dive)`);
    assert.ok(tiers.has(3), `Chapter ${chap.id} must have Tier 3 (Boss Challenge)`);

    for (const q of chap.questions) {
      const qRes = validateQuestion(q, nodeIds);
      assert.equal(qRes.valid, true, `Question ${q.id} in ${chap.id} is invalid: ${qRes.errors.join(', ')}`);
      assert.ok(q.misconception && q.misconception.length >= 15, `Question ${q.id} must have diagnostic misconception explanation (>15 chars)`);
    }
  }
});

test('3. Bilingual LLE Engine with Pre-LLE Math Insulation Invariant', () => {
  const sampleMathText = 'When we divide \\( \\frac{a}{b} \\) by \\( \\frac{c}{d} \\), the denominator fraction cannot be zero.';
  const rendered = rt(sampleMathText);

  // Insulated math should be preserved in math-var tag
  assert.ok(rendered.includes('class="math-var"'), 'Math formula must be shielded inside math-var tag');
  assert.ok(rendered.includes('\\frac{a}{b}'), 'LaTeX formula must remain uncorrupted');

  // Vocabulary words must be wrapped in interactive word tags
  assert.ok(rendered.includes('class="word" data-w="fraction"'), 'Key vocabulary must be tagged for interactive Hindi word-tap');
  assert.ok(rendered.includes('class="word" data-w="denominator"'), 'Technical term denominator must be tagged with Hindi meaning');
});

test('4. Deterministic Mastery Calculation is Evidence-Based', () => {
  const s = {
    events: [
      { event_type: 'answer_submitted', payload: { node_id: 'n', result: 'correct' } },
      { event_type: 'answer_submitted', payload: { node_id: 'n', result: 'incorrect', misconception: 'x' } },
      { event_type: 'answer_submitted', payload: { node_id: 'n', result: 'correct' } },
      { event_type: 'answer_submitted', payload: { node_id: 'n', result: 'correct' } }
    ]
  };
  const m = computeMastery(s, 'n');
  assert.equal(m.accuracy, 75);
  assert.equal(m.mastery, 75);
  assert.equal(progressionDecision({ mastery: { n: m } }, 'n').action, 'advance');
});

test('5. Reward Ledger is Strictly Idempotent', () => {
  const s = {
    coins: 0,
    xp: 0,
    streak: 0,
    reward_ledger: [],
    events: [],
    sync_outbox: [],
    badges: []
  };
  const r1 = awardQuizReward(s, { event_id: 'E1', result: 'correct' });
  const r2 = awardQuizReward(s, { event_id: 'E1', result: 'correct' });
  assert.equal(r1.coins_delta, 2);
  assert.equal(r2.duplicate, true);
  assert.equal(s.coins, 2);
});
