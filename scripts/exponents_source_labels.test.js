const assert = require('node:assert/strict');
const fs = require('node:fs');
const { WARMUP_QUESTIONS } = require('./exponents_warmup_data');
const { BOSS_QUESTIONS } = require('./exponents_boss_data');

const sourceLabelsVerifiedAgainstScans = {
  ep_w_1: 'Warm Up Q1(a)',
  ep_w_2: 'Warm Up Q1(b)',
  ep_w_3: 'Warm Up Q1(c)',
  ep_w_4: 'Warm Up Q1(d)',
  ep_w_5: 'Warm Up Q2(a)',
  ep_w_6: 'Warm Up Q2(b)',
  ep_w_7: 'Warm Up Q2(c)',
  ep_w_11: 'Exercise 2(A) Q3(b)',
  ep_w_12: 'Exercise 2(A) Q3(c)',
  ep_w_14: 'Warm Up Q6(b)',
  ep_w_15: 'Warm Up Q6(c)',
  ep_w_16: 'Warm Up Q8(a)',
};

const questions = new Map(WARMUP_QUESTIONS.map((question) => [question.id, question]));
for (const [id, expectedTag] of Object.entries(sourceLabelsVerifiedAgainstScans)) {
  assert.equal(questions.get(id)?.tag, expectedTag, `${id} must cite the matching scanned textbook item`);
}

const negativePowerNotation = questions.get('ep_w_5');
assert.equal(negativePowerNotation.prompt, 'Express \\(-15,625\\) in power notation:');
assert.equal(negativePowerNotation.opts.find((option) => option.correct)?.text, '-(5^6)');
assert.equal(-(5 ** 6), -15625, 'the marked correct answer must evaluate to the textbook value');

const textbookMcq10 = BOSS_QUESTIONS.find((question) => question.tag === 'Textbook MCQ 10');
assert.equal(textbookMcq10.prompt, 'If \\(2^{x-4} = 1\\), what is the value of \\(x\\)?');
assert.deepEqual(textbookMcq10.opts.filter((option) => option.correct).map((option) => option.text), ['4']);
const hotsQuestion2b = BOSS_QUESTIONS.find((question) => question.tag === 'HOTS Q2(b)');
assert.ok(hotsQuestion2b.prompt.includes('(a^{p+q})^2'));
assert.equal(hotsQuestion2b.opts.some((option) => !option.correct && option.text === 'a^0'), false, 'a^0 is equivalent to 1 and cannot be a wrong answer choice');

const legacyBuilder = fs.readFileSync(require.resolve('./build_exponents_master_chapter'), 'utf8');
assert.doesNotMatch(legacyBuilder, /100% Textbook|Full Textbook Edition|100% Textbook Derived/);

for (const question of WARMUP_QUESTIONS) {
  if (sourceLabelsVerifiedAgainstScans[question.id]) continue;
  assert.match(question.tag, /^Practice(?:\s|$)/, `${question.id} must not imply unverified textbook coverage`);
}

console.log('PASS: Tagged warm-up and boss-bank items match their scanned source questions.');
