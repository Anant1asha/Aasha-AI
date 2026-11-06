/**
 * Annanth Aasha Learning Ecosystem — AASHA AIOS
 * Unit Test Battery: CAT Assessment & Gamified Quest Engines
 *
 * Verifies:
 * 1. IRT 3PL mathematical monotonicity and Fisher Information bounds
 * 2. Maximum Fisher Information item selection
 * 3. Multi-tier ability estimation convergence and termination rules
 * 4. Anti-spoiler misconception validation (L-Truth Rule #1)
 * 5. Non-punitive gamification loops and streak shield protection
 * 6. Web Audio zero-asset sound generator headless safety
 * 7. Mobile touch ergonomics (>=44x44px)
 */

import {
  OfflineCATEngine,
  IRTItem,
  MasteryTier,
} from '../packages/assessment/cat_engine.ts';

import {
  GamifiedQuestStateMachine,
  OfflineToneSynthesizer,
  getGamificationCSS,
} from '../packages/gamification/quest_engine.ts';

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

const MOCK_QUESTION_BANK: IRTItem[] = [
  {
    id: 'Q_NOV_01',
    question: 'परिमेय संख्या (Rational Number) क्या है?',
    options: [
      { id: 'opt_a', text: 'p/q रूप, जहाँ q ≠ 0', correct: true },
      { id: 'opt_b', text: 'केवल धनात्मक संख्याएं', correct: false, m: 'ध्यान दें: परिमेय संख्याएं ऋणात्मक भी हो सकती हैं।' },
      { id: 'opt_c', text: 'केवल शून्य', correct: false, m: 'शून्य एक परिमेय संख्या है, परंतु अकेली नहीं।' },
      { id: 'opt_d', text: 'वे संख्याएं जो भिन्न नहीं हो सकतीं', correct: false, m: 'परिमेय संख्याओं को भिन्न (p/q) के रूप में लिखा जा सकता है।' },
    ],
    a: 1.2,
    b: -1.5,
    c: 0.25,
    tier: 'NOVICE',
    hints: [
      'संख्या रेखा (Number Line) पर भिन्नों को याद करें।',
      'परिभाषा: परिमेय संख्या p/q के रूप में होती है।',
      'हर (Denominator) कभी शून्य नहीं हो सकता।',
      'भिन्न के अंश और हर की स्थिति देखें।',
    ],
  },
  {
    id: 'Q_APP_01',
    question: '-3/4 और 5/6 के बीच एक परिमेय संख्या ज्ञात कीजिए।',
    options: [
      { id: 'opt_a', text: '1/24', correct: true },
      { id: 'opt_b', text: '2', correct: false, m: 'संख्या रेखा पर दोनों मान 1 से छोटे हैं, अतः 2 मध्य में नहीं हो सकता।' },
      { id: 'opt_c', text: '-1', correct: false, m: '-1 मान -3/4 के और बाईं ओर स्थित है।' },
      { id: 'opt_d', text: '3/2', correct: false, m: '3/2 का मान 1.5 है, जो 5/6 से बड़ा है।' },
    ],
    a: 1.5,
    b: 0.1,
    c: 0.25,
    tier: 'APPRENTICE',
    hints: [
      'दोनों भिन्नों के हर (Denominators) का ल.स. (LCM) लें।',
      'ल.स. 12 है: -9/12 और 10/12 के बीच का अंश चुनें।',
      'धनात्मक और ऋणात्मक दोनों मान मान्य हैं।',
      'मध्य बिंदु ज्ञात करने के लिए दोनों को जोड़कर 2 से भाग दें।',
    ],
  },
  {
    id: 'Q_MAS_01',
    question: 'सिद्ध कीजिए कि दो परिमेय संख्याओं का गुणनफल सदैव परिमेय होता है।',
    options: [
      { id: 'opt_a', text: '(a/b) * (c/d) = (ac)/(bd), जहाँ bd ≠ 0', correct: true },
      { id: 'opt_b', text: 'गुणनफल अपरिमेय हो जाता है', correct: false, m: 'पूर्णांकों का गुणनफल सदैव पूर्णांक होता है, अतः संवृत गुणधर्म (Closure Property) लागू होता है।' },
      { id: 'opt_c', text: 'केवल यदि दोनों भिन्न धनात्मक हों', correct: false, m: 'ऋणात्मक पूर्णांकों का गुणनफल भी पूर्णांक होता है।' },
      { id: 'opt_d', text: 'परिणाम अपरिभाषित है', correct: false, m: 'यदि दोनों हर अशून्य हैं, तो उनका गुणनफल भी अशून्य होगा।' },
    ],
    a: 2.0,
    b: 1.8,
    c: 0.25,
    tier: 'MASTER',
    hints: [
      'पूर्णांकों के संवृत गुणधर्म (Closure Property under Multiplication) को देखें।',
      'यदि a, b, c, d पूर्णांक हैं और b, d ≠ 0, तो ac और bd भी पूर्णांक हैं।',
      'क्या bd कभी शून्य हो सकता है यदि b ≠ 0 और d ≠ 0?',
      'p = ac और q = bd मानकर परिभाषा से तुलना करें।',
    ],
  },
];

// ---------------------------------------------------------------------------
// Test Suite Runner
// ---------------------------------------------------------------------------

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failedCount++;
  }
}

async function runBattery() {
  console.log('================================================================');
  console.log('AASHA AIOS: CAT Assessment & Gamified Quest Engine Verification');
  console.log('================================================================\n');

  const catEngine = new OfflineCATEngine({
    initialTheta: 0.0,
    minItems: 3,
    maxItems: 5,
    targetPrecision: 0.4,
  });

  // -------------------------------------------------------------------------
  // Pillar 1: IRT 3PL Monotonicity & Boundary Tests
  // -------------------------------------------------------------------------
  console.log('--- Pillar 1: IRT 3PL Mathematical Monotonicity ---');

  const pLow = catEngine.probability(-2.0, 1.5, 0.0, 0.25);
  const pMid = catEngine.probability(0.0, 1.5, 0.0, 0.25);
  const pHigh = catEngine.probability(2.0, 1.5, 0.0, 0.25);

  assert(pLow < pMid && pMid < pHigh, 'Probability increases monotonically with theta');
  assert(pLow >= 0.25, 'Lower probability bound respects guessing parameter c=0.25');
  assert(pHigh <= 1.0, 'Upper probability bound respects 1.0 ceiling');
  assert(Math.abs(pMid - 0.625) < 0.01, 'At theta = b, P(theta) = c + (1-c)/2 = 0.625');

  // -------------------------------------------------------------------------
  // Pillar 2: Fisher Information & Item Selection
  // -------------------------------------------------------------------------
  console.log('\n--- Pillar 2: Fisher Information & Adaptive Selection ---');

  const infoAtZero = catEngine.fisherInformation(0.0, MOCK_QUESTION_BANK[1]); // b=0.1
  const infoFarAway = catEngine.fisherInformation(3.0, MOCK_QUESTION_BANK[1]);

  assert(infoAtZero > infoFarAway, 'Fisher Information peaks near item difficulty parameter b');

  const session = catEngine.createSession();
  const nextItem = catEngine.selectNextItem(MOCK_QUESTION_BANK, session);
  assert(nextItem !== null, 'Item selection returns valid unattempted item');
  assert(nextItem?.id === 'Q_APP_01', 'At theta=0.0, selects apprentice item closest to ability');

  // -------------------------------------------------------------------------
  // Pillar 3: Adaptive Simulation & Mastery Convergence
  // -------------------------------------------------------------------------
  console.log('\n--- Pillar 3: Ability Estimation & Session Convergence ---');

  // High-ability student simulation
  const highStudentSession = catEngine.createSession();
  let currentItem = catEngine.selectNextItem(MOCK_QUESTION_BANK, highStudentSession);
  while (currentItem && !highStudentSession.isTerminated) {
    catEngine.recordResponse(currentItem, true, highStudentSession);
    currentItem = catEngine.selectNextItem(MOCK_QUESTION_BANK, highStudentSession);
  }

  assert(highStudentSession.theta > 0.5, 'High-ability student theta increases positively');
  assert(catEngine.classifyTier(highStudentSession.theta) === 'MASTER' || catEngine.classifyTier(highStudentSession.theta) === 'APPRENTICE', 'High-ability student progresses to Apprentice or Master');
  assert(highStudentSession.history.length >= 3, 'Administered minimum item count');

  // Low-ability student simulation
  const lowStudentSession = catEngine.createSession();
  currentItem = catEngine.selectNextItem(MOCK_QUESTION_BANK, lowStudentSession);
  while (currentItem && !lowStudentSession.isTerminated) {
    catEngine.recordResponse(currentItem, false, lowStudentSession);
    currentItem = catEngine.selectNextItem(MOCK_QUESTION_BANK, lowStudentSession);
  }

  assert(lowStudentSession.theta < 0.0, 'Low-ability student theta decreases');
  assert(catEngine.classifyTier(lowStudentSession.theta) === 'NOVICE', 'Low-ability student classified as Novice');

  // Teacher report generation check
  const report = catEngine.generateTeacherReport(highStudentSession, 'Rational Numbers (परिमेय संख्याएँ)');
  assert(report.includes('शिक्षक मूल्यांकन सारांश'), 'Teacher report contains bilingual Hindi header');
  assert(report.includes('अधिगम स्तर'), 'Teacher report categorizes learning mastery tier');

  // -------------------------------------------------------------------------
  // Pillar 4: Anti-Spoiler Misconception Sanitizer (L-Truth Rule #1)
  // -------------------------------------------------------------------------
  console.log('\n--- Pillar 4: Anti-Spoiler Misconception Audit ---');

  // Test compliant item
  const compliantCheck = catEngine.sanitizeItemMisconceptions(MOCK_QUESTION_BANK[0]);
  assert(compliantCheck.compliant, 'Valid pedagogical distractors pass anti-spoiler audit');

  // Test violating item that quotes answer
  const spoiledItem: IRTItem = {
    id: 'Q_SPOILED_01',
    question: 'Solve 2x = 10',
    options: [
      { id: 'opt_1', text: '5', correct: true },
      { id: 'opt_2', text: '8', correct: false, m: 'गलत। सही उत्तर है 5।' },
    ],
    a: 1.0,
    b: 0.0,
    c: 0.25,
    tier: 'NOVICE',
  };

  const spoilerCheck = catEngine.sanitizeItemMisconceptions(spoiledItem);
  assert(!spoilerCheck.compliant, 'Spoiler distractor correctly caught and rejected');
  assert(spoilerCheck.violations.length > 0, 'Violation details accurately recorded');

  // -------------------------------------------------------------------------
  // Pillar 5: Gamified Quest State Machine & Streak Shields
  // -------------------------------------------------------------------------
  console.log('\n--- Pillar 5: Gamified Quest State Machine ---');

  const quest = new GamifiedQuestStateMachine('ch08-rational-numbers');
  assert(quest.getState().tier === 'NOVICE', 'Initial quest tier is NOVICE');
  assert(quest.getState().xp === 0, 'Initial XP is 0');

  // Simulate correct answers
  const res1 = quest.handleAnswer(true, -1.0);
  assert(res1.xpGained > 0, 'Correct answer awards XP');
  assert(quest.getState().streakCount === 1, 'Streak increments to 1');
  assert(!quest.getState().streakShieldActive, 'Streak shield not active at streak 1');

  // Reach streak of 3 -> Streak shield activated
  quest.handleAnswer(true, 0.0);
  const res3 = quest.handleAnswer(true, 0.5);
  assert(quest.getState().streakCount === 3, 'Streak reaches 3');
  assert(quest.getState().streakShieldActive, 'Streak shield awarded at streak 3');
  assert(res3.shieldAwarded, 'Reward event confirms streak shield activation');

  // Incorrect answer with streak shield active
  const resWrongWithShield = quest.handleAnswer(false, 0.5);
  assert(resWrongWithShield.shieldUsed, 'Streak shield consumed on incorrect answer');
  assert(quest.getState().streakCount === 3, 'Streak count preserved by shield protection');
  assert(!quest.getState().streakShieldActive, 'Shield is now inactive');

  // Next incorrect answer without shield resets streak
  const resWrongNoShield = quest.handleAnswer(false, 0.5);
  assert(quest.getState().streakCount === 0, 'Streak resets to 0 when no shield is active');
  assert(quest.getState().xp > 0, 'Non-punitive law: XP is never deducted on incorrect answers');

  // XP Tier progression
  quest.awardXP(160, 'Completed Foundation Lab Challenge');
  assert(quest.getState().tier === 'MASTER', 'Accumulated XP promotes student to MASTER tier');
  assert(quest.getState().badges.includes('master_creator'), 'Master Creator badge awarded');

  // -------------------------------------------------------------------------
  // Pillar 6: Offline Tone Synthesizer Safety & CSS Touch Ergonomics
  // -------------------------------------------------------------------------
  console.log('\n--- Pillar 6: Sound Engine & Touch Ergonomics ---');

  // Test tone synthesizer in headless Node.js
  let audioException = false;
  try {
    OfflineToneSynthesizer.play('correct');
    OfflineToneSynthesizer.play('incorrect');
    OfflineToneSynthesizer.play('hint');
    OfflineToneSynthesizer.play('streak_shield');
    OfflineToneSynthesizer.play('tier_complete');
  } catch {
    audioException = true;
  }
  assert(!audioException, 'OfflineToneSynthesizer safely no-ops in headless environments without window');

  // Test Touch Ergonomics CSS
  const css = getGamificationCSS();
  assert(css.includes('min-width: 44px'), 'CSS strictly enforces >=44px min-width touch target');
  assert(css.includes('min-height: 44px'), 'CSS strictly enforces >=44px min-height touch target');

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`Verification Complete: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runBattery().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
