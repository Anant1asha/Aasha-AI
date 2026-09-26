import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateChapter } from '../../packages/content-schema/src/index.js';
import { TLNEngine } from '../../packages/tln-engine/src/index.js';
import { generateVisualHtml } from '../../packages/visual-engine/src/index.js';
import { gradeQuestion, questionsForNode } from '../../packages/question-engine/src/index.js';
import { assessNode } from '../../packages/assessment-engine/src/index.js';
import { computeMasteryByNode, progressionAuthority } from '../../packages/teas-engine/src/index.js';

const chapter = JSON.parse(fs.readFileSync(new URL('../../content/class-07/perimeter-and-area.json', import.meta.url)));

test('Generalization: Class 7 Perimeter and Area passes content schema and TLN order', () => {
  const validated = validateChapter(chapter);
  assert.equal(validated.grade, 7);
  assert.equal(validated.stage, 'middle');
  assert.equal(validated.nodes.length, 3);
  assert.equal(validated.questions.length, 9);

  const tln = new TLNEngine(validated);
  const ordered = tln.orderedNodes().map(n => n.id);
  assert.deepEqual(ordered, ['perimeter', 'area', 'distinction']);
});

test('Generalization: Visual Engine renders modular 2D Grid Area model with dual readouts', () => {
  const visualSpec = {
    type: 'grid-area',
    rows: 4,
    cols: 6,
    fillRows: 3,
    fillCols: 5,
    unit: 'cm',
    interactive: true
  };

  const html = generateVisualHtml(visualSpec);
  assert.ok(html.includes('<svg class="grid-area-svg"'), 'Contains grid-area-svg SVG element');
  assert.ok(html.includes('readout-cols">5</span>'), 'Contains length readout (5 cm)');
  assert.ok(html.includes('readout-rows">3</span>'), 'Contains width readout (3 cm)');
  assert.ok(html.includes('readout-area">15</span> cm²'), 'Contains area readout (15 cm²)');
  assert.ok(html.includes('readout-peri">16</span> cm'), 'Contains perimeter readout (16 cm)');
  assert.ok(html.includes('tabindex="0"'), 'Contains keyboard focus tabindex');
  assert.ok(html.includes('role="button"'), 'Grid cells declare role="button"');
});

test('Generalization: Question Engine intercepts perimeter vs area cognitive misconceptions', () => {
  // Q1: Fencing sports ground (Boundary vs Area)
  const q1 = chapter.questions[0];
  const distractor1 = gradeQuestion(q1, 0); // "Area of the ground"
  assert.equal(distractor1.correct, false);
  assert.equal(distractor1.misconceptionId, 'confused_perimeter_and_area');

  // Q2: Calculating perimeter of rectangle 6m x 4m (Multiplied instead of added: 24 m²)
  const q2 = chapter.questions[1];
  const distractor2 = gradeQuestion(q2, 0); // "24 m²"
  assert.equal(distractor2.correct, false);
  assert.equal(distractor2.misconceptionId, 'multiplied_instead_of_added');

  // Q7: Surface unit (cm vs cm²)
  const q7 = chapter.questions[6];
  const distractor7 = gradeQuestion(q7, 0); // "cm"
  assert.equal(distractor7.correct, false);
  assert.equal(distractor7.misconceptionId, 'linear_unit_for_area');

  // Q8: Same perimeter does not mean same area
  const q8 = chapter.questions[7];
  const distractor8 = gradeQuestion(q8, 1); // "Because they have the same perimeter, their areas must be identical"
  assert.equal(distractor8.correct, false);
  assert.equal(distractor8.misconceptionId, 'same_perimeter_means_same_area');
});

test('Generalization: Two-tier diagnostic assessment and TEAS progression on Class 7 content', () => {
  const nodeQuestions = questionsForNode(chapter, 'perimeter');
  assert.equal(nodeQuestions.length, 3);

  // Simulate learner with 1 wrong on first attempt, retry right, and 2 clean passes
  const firstAttempts = [
    { correct: false, misconceptionId: 'confused_perimeter_and_area' },
    { correct: true, misconceptionId: null },
    { correct: true, misconceptionId: null }
  ];

  const assessment = assessNode({ nodeId: 'perimeter', attempts: firstAttempts, masteryThreshold: 0.75 });
  assert.equal(assessment.total, 3, 'Total diagnostic questions is 3');
  assert.equal(assessment.correct, 2, 'Diagnostic correct is 2');
  assert.equal(assessment.mastery, false, '66.7% accuracy requires guided practice');

  // Progression authority
  const auth0 = progressionAuthority({
    orderedNodeIds: ['perimeter', 'area', 'distinction'],
    masteryByNode: { perimeter: 0, area: 0, distinction: 0 }
  });
  assert.deepEqual(auth0.unlocked, []);
  assert.equal(auth0.next, 'perimeter');

  const auth1 = progressionAuthority({
    orderedNodeIds: ['perimeter', 'area', 'distinction'],
    masteryByNode: { perimeter: { mastery: 0.77, attempts: 4 }, area: { mastery: 0, attempts: 0 }, distinction: { mastery: 0, attempts: 0 } }
  });
  assert.deepEqual(auth1.unlocked, ['perimeter']);
  assert.equal(auth1.next, 'area');
});

