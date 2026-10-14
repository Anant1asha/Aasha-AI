const fs = require('fs');
const path = require('path');
const { WARMUP_QUESTIONS } = require('./exponents_warmup_data');
const { DEEPDIVE_QUESTIONS } = require('./exponents_deepdive_data');
const { BOSS_QUESTIONS } = require('./exponents_boss_data');

console.log('Assembling Exponents & Powers Master Gamified Chapter...');

// Helper to render static question cards
function renderQuizCard(q, levelName) {
  const qId = q.id;
  const tag = q.tag || 'Exercise Q';
  const prompt = q.prompt;
  const xp = q.xp || 10;

  // Options HTML
  const optsHtml = q.opts.map((opt, idx) => {
    const isCorrect = opt.correct === true;
    const mAttr = (opt.m || '').replace(/"/g, '&quot;');
    const clickHandler = `App.answerAssessment(this, '${qId}', ${isCorrect}, '${opt.m ? opt.m.replace(/'/g, "\\'") : ''}', ${xp})`;
    return `          <div class="quiz-opt" data-m="${mAttr}" data-correct="${isCorrect}" onclick="${clickHandler}">
            <div class="quiz-radio"></div>
            <span class="quiz-opt-text">${opt.text}</span>
          </div>`;
  }).join('\n');

  // Hints HTML
  const h1 = (q.hints?.h1 || '').replace(/"/g, '&quot;');
  const h2 = (q.hints?.h2 || '').replace(/"/g, '&quot;');
  const h3 = (q.hints?.h3 || '').replace(/"/g, '&quot;');
  const h4 = (q.hints?.h4 || '').replace(/"/g, '&quot;');

  return `      <div class="quiz-card" id="${qId}" data-qid="${qId}" data-nodeid="node_${levelName.toLowerCase()}" data-tier="${xp}">
        <div class="quiz-tag">${tag}</div>
        <div class="quiz-question">${prompt}</div>
        <div class="quiz-opts-container">
${optsHtml}
        </div>
        <div class="hint-box" id="hb_${qId}" data-h1="${h1}" data-h2="${h2}" data-h3="${h3}" data-h4="${h4}">
          <button class="hint-btn" onclick="App.showNextHint('${qId}')">💡 Need a Hint? <span id="hl_${qId}">[Tier 1/4]</span></button>
          <div class="hint-text" id="ht_${qId}" style="display:none"></div>
        </div>
        <div class="quiz-feedback" id="fb_${qId}"></div>
      </div>`;
}

// Generate sections
const warmupHtml = WARMUP_QUESTIONS.map(q => renderQuizCard(q, 'Warmup')).join('\n\n');
const deepdiveHtml = DEEPDIVE_QUESTIONS.map(q => renderQuizCard(q, 'DeepDive')).join('\n\n');
const bossHtml = BOSS_QUESTIONS.map(q => renderQuizCard(q, 'Boss')).join('\n\n');

console.log(`Generated cards: Warmup=${WARMUP_QUESTIONS.length}, DeepDive=${DEEPDIVE_QUESTIONS.length}, Boss=${BOSS_QUESTIONS.length}`);
console.log(`Total Assessment Cards: ${WARMUP_QUESTIONS.length + DEEPDIVE_QUESTIONS.length + BOSS_QUESTIONS.length}`);

// Read base template and dictionary from Rational Numbers
const baseRef = fs.readFileSync(path.join(__dirname, '../chapters/RationalNumbers_Class8_AD_Gamified_v5_Enhanced_v6.html'), 'utf8');

// Extract dictionary and connectives
const wmStart = baseRef.indexOf('var WM = {');
const wmEnd = baseRef.indexOf('};', wmStart) + 2;
const wmSnippet = baseRef.slice(wmStart, wmEnd);

const connStart = baseRef.indexOf('var CONN = {');
const connEnd = baseRef.indexOf('};', connStart) + 2;
const connSnippet = baseRef.slice(connStart, connEnd);

console.log('Extracted WM and CONN snippets cleanly.');

module.exports = {
  warmupHtml,
  deepdiveHtml,
  bossHtml,
  warmupQuestionIds: WARMUP_QUESTIONS.map(question => question.id),
  deepdiveQuestionIds: DEEPDIVE_QUESTIONS.map(question => question.id),
  bossQuestionIds: BOSS_QUESTIONS.map(question => question.id),
  wmSnippet,
  connSnippet
};
