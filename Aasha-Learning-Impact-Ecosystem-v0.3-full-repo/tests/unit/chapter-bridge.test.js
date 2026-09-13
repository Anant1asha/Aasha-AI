import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adaptStandaloneChapter,
  StandaloneChapterAdapter,
  ChapterRegistry,
  rationalNumbersStandaloneDef,
  algebraicExpressionsStandaloneDef
} from '../../apps/learner-web/src/chapter-bridge.js';
import { TLNEngine } from '../../packages/tln-engine/src/index.js';
import { questionsForNode, gradeQuestion } from '../../packages/question-engine/src/index.js';
import { assessNode } from '../../packages/assessment-engine/src/index.js';
import { progressionAuthority } from '../../packages/teas-engine/src/index.js';
import { generateVisualHtml } from '../../packages/visual-engine/src/index.js';
import { AashaExperienceContract } from '../../packages/simulation-runtime/src/index.js';

test('Chapter Bridge: adaptStandaloneChapter converts standalone format into validated chapter schema', () => {
  const chapter = adaptStandaloneChapter(rationalNumbersStandaloneDef);

  assert.equal(chapter.id, 'math8-rational-numbers');
  assert.equal(chapter.grade, 8);
  assert.equal(chapter.subject, 'Mathematics');
  assert.equal(chapter.stage, 'middle');
  assert.equal(chapter.nodes.length, 3);
  assert.ok(chapter.questions.length >= 3, 'Contains at least 3 questions');

  // Verify node structure
  const node1 = chapter.nodes[0];
  assert.equal(node1.id, 'node_g8_m1_c1');
  assert.ok(node1.title.includes('Properties of Rational Numbers'));
  assert.ok(node1.objective.length > 0);
  assert.ok(node1.explanation.length > 0);
  assert.deepEqual(node1.dependencies, []);

  // Verify questions bound to node
  const qs = questionsForNode(chapter, 'node_g8_m1_c1');
  assert.ok(qs.length >= 1);
  const q1 = qs[0];
  assert.ok(q1.prompt.includes('additive inverse of 2/8'));
  assert.equal(q1.answerIndex, 0);
  assert.equal(q1.options[0].correct, true);
  assert.equal(q1.options[1].correct, false);
  assert.ok(q1.options[1].misconceptionId.length > 0, 'Contains distractor misconception');
});

test('Chapter Bridge: Standalone chapter integrates with TLN DAG and TEAS progression', () => {
  const chapter = adaptStandaloneChapter(algebraicExpressionsStandaloneDef);
  const tln = new TLNEngine(chapter);
  const orderedIds = tln.orderedNodes().map(n => n.id);

  assert.deepEqual(orderedIds, ['node_alg_1', 'node_alg_2', 'node_alg_3']);

  // Grade first attempt on node 1
  const q = questionsForNode(chapter, 'node_alg_1')[0];
  const correctResult = gradeQuestion(q, q.answerIndex);
  assert.equal(correctResult.correct, true);
  assert.equal(correctResult.score, 1);
  assert.equal(correctResult.misconceptionId, null);

  const wrongResult = gradeQuestion(q, 1);
  assert.equal(wrongResult.correct, false);
  assert.equal(wrongResult.score, 0);
  assert.ok(wrongResult.misconceptionId !== null);

  // Run assessment on node
  const assessment = assessNode({
    nodeId: 'node_alg_1',
    attempts: [{ correct: true }, { correct: true }, { correct: false }, { correct: true }]
  });
  assert.equal(assessment.mastery, true);
  assert.equal(assessment.accuracy, 0.75);

  // Evaluate TEAS progression
  const auth = progressionAuthority({
    orderedNodeIds: orderedIds,
    masteryByNode: { node_alg_1: 1, node_alg_2: 0, node_alg_3: 0 }
  });
  assert.deepEqual(auth.unlocked, ['node_alg_1']);
  assert.equal(auth.authority, 'teas');
});

test('Chapter Bridge: Shared Visual Engine renders adapted chapter visual specs', () => {
  const chapter = adaptStandaloneChapter(rationalNumbersStandaloneDef);
  const spec = chapter.nodes[0].visual;
  const html = generateVisualHtml(spec);

  assert.ok(html.includes('aasha-visual'), 'Contains aasha-visual container');
  assert.ok(html.includes('fraction-bar-svg') || html.includes('visual-model-wrapper'));
});

test('Chapter Bridge: StandaloneChapterAdapter adheres to AashaExperienceContract lifecycle', () => {
  const adapter = new StandaloneChapterAdapter({
    id: 'test-standalone',
    title: 'Test Standalone Unit',
    htmlUrl: '/chapters/Test.html'
  });

  assert.ok(adapter instanceof AashaExperienceContract);

  // Mock DOM container
  const container = {
    innerHTML: '',
    appendChild: () => {},
    dispatchEvent: () => true
  };

  const mountResult = adapter.mount(container);
  assert.equal(mountResult.id, 'test-standalone');
  assert.equal(mountResult.mounted, true);

  // Telemetry emission
  const telEvent = adapter.emitTelemetry('test_action', { score: 10 });
  assert.equal(telEvent.type, 'aasha:telemetry');
  assert.equal(telEvent.detail.experienceId, 'test-standalone');

  // State inspection and reset
  adapter.state.coins = 5;
  adapter.state.xp = 25;
  assert.equal(adapter.getState().coins, 5);

  adapter.reset();
  assert.equal(adapter.getState().coins, 0);

  adapter.destroy();
  assert.equal(adapter.container, null);
});

test('Chapter Bridge: ChapterRegistry dynamically manages and lists all chapters', () => {
  const registry = new ChapterRegistry();
  const list = registry.list();

  // Must include the two standard chapters and two bridged standalone chapters
  assert.ok(list.length >= 4);
  const ids = list.map(c => c.id);
  assert.ok(ids.includes('math6-fractions-beta'));
  assert.ok(ids.includes('class-07-perimeter-and-area'));
  assert.ok(ids.includes('math8-rational-numbers'));
  assert.ok(ids.includes('math8-algebraic-expressions'));

  // Active chapter switching
  const initial = registry.getActive();
  assert.equal(initial.id, 'math6-fractions-beta');

  const switched = registry.setActive('math8-rational-numbers');
  assert.equal(switched.id, 'math8-rational-numbers');
  assert.equal(registry.getActive().id, 'math8-rational-numbers');

  // Dynamic registration of a custom standalone chapter
  const customChapter = registry.register({
    title: 'Class 5 The Fish Tale',
    grade: 5,
    NODES: [
      {
        id: 'node_fish_1',
        title: 'Fish Shapes and Scales',
        steps: [
          { t: 'intro', text: 'Explore sea life and geometry.' },
          { t: 'quiz', q: { text: 'How many sides does a triangle fish tail have?', opts: [{ t: '3', c: true }, { t: '4', c: false }] } }
        ]
      }
    ]
  });

  assert.equal(customChapter.grade, 5);
  assert.equal(customChapter.stage, 'primary');
  assert.ok(registry.get(customChapter.id) !== null);
});
