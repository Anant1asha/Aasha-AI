import fs from 'node:fs';
import { generateVisualHtml } from '../packages/visual-engine/src/index.js';
import { gradeQuestion, questionsForNode, summarizeAttempts } from '../packages/question-engine/src/index.js';
import { assessNode, remediationFor } from '../packages/assessment-engine/src/index.js';
import { computeMasteryByNode, progressionAuthority } from '../packages/teas-engine/src/index.js';
import { OfflineOutbox, makeEvent } from '../packages/offline-sync/src/index.js';
import { RewardLedger } from '../packages/reward-engine/src/index.js';
import { TLNEngine } from '../packages/tln-engine/src/index.js';

const chapter = JSON.parse(fs.readFileSync(new URL('../content/class-06/fractions.json', import.meta.url), 'utf8'));

console.log('============================================================');
console.log('DEEP VALIDATION RUN');
console.log('============================================================\n');

// 1. VISUAL VALIDATION
console.log('--- 1. VISUAL LEARNING ENGINE ---');
const visualTests = [
  { shaded: 2, total: 6, title: 'Parts of Whole' },
  { shaded: 2, total: 4, title: 'Equivalent Fractions' },
  { shaded: 3, total: 5, title: 'Adding Like Fractions' },
  { shaded: 0, total: 4, title: 'Zero Shaded Edge Case' },
  { shaded: 4, total: 4, title: 'Full Whole Edge Case' }
];

for (const vt of visualTests) {
  const html = generateVisualHtml({ ...vt, interactive: true });
  const hasSvg = html.includes('<svg') && html.includes('</svg>');
  const hasAria = html.includes('aria-label="');
  const expectedCells = vt.total;
  const cellMatches = (html.match(/<rect class="frac-cell/g) || []).length;
  const shadedMatches = (html.match(/frac-cell shaded/g) || []).length;
  const unshadedMatches = (html.match(/frac-cell unshaded/g) || []).length;
  const pct = Math.round((vt.shaded / vt.total) * 100);
  const hasReadout = html.includes(`${vt.shaded}</span> / <span class="denominator">${vt.total}</span>`);
  const hasPct = html.includes(`(${pct}% of whole)`);
  
  console.log(`[Visual] ${vt.title} (${vt.shaded}/${vt.total}):`, {
    hasSvg,
    hasAria,
    cellMatches,
    shadedMatches,
    unshadedMatches,
    hasReadout,
    hasPct,
    mathValid: cellMatches === expectedCells && shadedMatches === vt.shaded && unshadedMatches === (vt.total - vt.shaded)
  });
}

// 2. MISCONCEPTION & QUESTION AUDIT
console.log('\n--- 2. ALL 9 QUESTIONS & MISCONCEPTION MAPPING ---');
let totalOptions = 0;
let taggedDistractors = 0;
let untaggedDistractors = 0;

chapter.questions.forEach((q, qIdx) => {
  console.log(`\nQ${qIdx + 1} [${q.id}] (Node: ${q.nodeId}): "${q.prompt}"`);
  console.log(`  Objective: ${chapter.nodes.find(n => n.id === q.nodeId)?.objective}`);
  
  q.options.forEach((opt, optIdx) => {
    totalOptions++;
    const isAns = optIdx === q.answerIndex;
    const graded = gradeQuestion(q, optIdx);
    
    if (isAns) {
      console.log(`  ✓ Option ${optIdx} (CORRECT): "${opt.text}"`);
      console.log(`      Feedback: "${graded.feedback}"`);
      console.log(`      Misconception: ${graded.misconceptionId}`);
    } else {
      if (graded.misconceptionId) {
        taggedDistractors++;
        console.log(`  ✗ Option ${optIdx} (DISTRACTOR [${graded.misconceptionId}]): "${opt.text}"`);
        console.log(`      Feedback: "${graded.feedback}"`);
      } else {
        untaggedDistractors++;
        console.log(`  ✗ Option ${optIdx} (GENERIC DISTRACTOR): "${opt.text}"`);
        console.log(`      Feedback: "${graded.feedback}"`);
      }
    }
  });
});

// Test untagged distractor / legacy fallback behavior
console.log('\n--- Test distractor with NO misconceptionId ---');
const legacyQ = {
  id: 'legacy-q',
  nodeId: 'parts',
  prompt: 'Sample question without misconception tags',
  options: ['Wrong without tag', 'Right answer'],
  answerIndex: 1
};
const untaggedGraded = gradeQuestion(legacyQ, 0);
console.log('Untagged distractor result:', {
  correct: untaggedGraded.correct,
  misconceptionId: untaggedGraded.misconceptionId,
  feedback: untaggedGraded.feedback,
  didNotInvent: untaggedGraded.misconceptionId === null
});

// 3. ASSESSMENT & MASTERY LOGIC AT 0/3, 1/3, 2/3, 3/3
console.log('\n--- 3. ASSESSMENT & MASTERY BEHAVIOR (0/3, 1/3, 2/3, 3/3) ---');
const scenarios = [
  { name: '0/3 correct', attempts: [{ correct: false }, { correct: false }, { correct: false }] },
  { name: '1/3 correct', attempts: [{ correct: true }, { correct: false }, { correct: false }] },
  { name: '2/3 correct', attempts: [{ correct: true }, { correct: true }, { correct: false }] },
  { name: '3/3 correct', attempts: [{ correct: true }, { correct: true }, { correct: true }] }
];

for (const sc of scenarios) {
  const res = assessNode({ nodeId: 'parts', attempts: sc.attempts, masteryThreshold: 0.75 });
  const rem = remediationFor(res);
  console.log(`Scenario: ${sc.name}:`, {
    accuracy: (res.accuracy * 100).toFixed(1) + '%',
    mastery: res.mastery,
    misconception: res.misconception,
    remediationType: rem.type
  });
}

// 4. RETRY BEHAVIOR ON ASSESSMENT STATE
console.log('\n--- 4. RETRY BEHAVIOR ON ASSESSMENT STATE ---');
const retryCaseA = [
  { correct: false, misconceptionId: 'ratio' },
  { correct: true },
  { correct: true },
  { correct: true }
];
const resCaseA = assessNode({ nodeId: 'parts', attempts: retryCaseA, masteryThreshold: 0.75 });
console.log('Case A (1 wrong + retry right, then 2 clean right = 4 attempts, 3 correct):', {
  total: resCaseA.total,
  correct: resCaseA.correct,
  accuracy: (resCaseA.accuracy * 100).toFixed(1) + '%',
  mastery: resCaseA.mastery
});

const retryCaseB = [
  { correct: false },
  { correct: false },
  { correct: true },
  { correct: true },
  { correct: true }
];
const resCaseB = assessNode({ nodeId: 'parts', attempts: retryCaseB, masteryThreshold: 0.75 });
console.log('Case B (2 wrong + retry right, then 2 clean right = 5 attempts, 3 correct):', {
  total: resCaseB.total,
  correct: resCaseB.correct,
  accuracy: (resCaseB.accuracy * 100).toFixed(1) + '%',
  mastery: resCaseB.mastery
});

// 5. TEAS PROGRESSION SEPARATION
console.log('\n--- 5. TEAS PROGRESSION AUTHORITY ---');
const tln = new TLNEngine(chapter);
const nodeIds = tln.orderedNodes().map(n => n.id);
console.log('TLN Node Order:', nodeIds);

const p0 = progressionAuthority({ orderedNodeIds: nodeIds, masteryByNode: { parts: { mastery: 0, attempts: 0 }, equivalent: { mastery: 0, attempts: 0 }, add: { mastery: 0, attempts: 0 } } });
console.log('Zero mastery progression:', p0);

const p1 = progressionAuthority({ orderedNodeIds: nodeIds, masteryByNode: { parts: { mastery: 0.8, attempts: 4 }, equivalent: { mastery: 0, attempts: 0 }, add: { mastery: 0, attempts: 0 } } });
console.log('Parts mastered progression:', p1);

const p2 = progressionAuthority({ orderedNodeIds: nodeIds, masteryByNode: { parts: { mastery: 0.8, attempts: 4 }, equivalent: { mastery: 0.8, attempts: 4 }, add: { mastery: 0, attempts: 0 } } });
console.log('Parts + Equivalent mastered progression:', p2);

// 6. EVENT TELEMETRY & PRIVACY AUDIT
console.log('\n--- 6. EVENT TELEMETRY & PRIVACY AUDIT ---');
const sampleEvent = makeEvent({
  eventId: 'evt-123',
  learnerId: 'uuid-learner-456',
  deviceId: 'device-789',
  type: 'attempt',
  payload: {
    nodeId: 'parts',
    questionId: 'q-parts-1',
    correct: false,
    misconceptionId: 'confused_numerator_denominator'
  }
});
console.log('Event Structure:', JSON.stringify(sampleEvent, null, 2));
console.log('Contains student name?:', 'name' in sampleEvent || 'name' in sampleEvent.payload);
console.log('Contains learnerId?:', 'learnerId' in sampleEvent);
console.log('Contains deviceId?:', 'deviceId' in sampleEvent);

// 7. REWARD IDEMPOTENCE AUDIT
console.log('\n--- 7. REWARD LEDGER AUDIT ---');
const ledger = new RewardLedger();
const r1 = ledger.issue({ eventId: 'reward:q-parts-1:100' }, { coins: 1, xp: 5, verified: true });
const r2 = ledger.issue({ eventId: 'reward:q-parts-1:100' }, { coins: 1, xp: 5, verified: true });
console.log('First issue:', r1);
console.log('Second issue with same eventId:', r2);

