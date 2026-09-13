const fs = require('fs');
const data = JSON.parse(fs.readFileSync('chapters/ad_all_questions.json', 'utf8'));
const qs = data.questions;

const propQs = qs.filter(q => 
  q.q.includes('property') || 
  q.q.includes('Property') || 
  q.q.includes('form p/q') ||
  q.id.startsWith('ad_presc') ||
  q.id.startsWith('ad_1b_q3') ||
  q.id.startsWith('ad_1c_q4')
);

console.log(`Found ${propQs.length} property / concept questions:`);
propQs.forEach((q, i) => {
  console.log(`\n[${i+1}] ID: ${q.id} | Tag: ${q.tag}`);
  console.log(`    Q: ${q.q}`);
  console.log(`    Ans: ${q.ans}`);
  console.log(`    Correct Opt: ${q.opts.find(o => o.c).t}`);
  console.log(`    Distractors: ${q.opts.filter(o => !o.c).map(o => o.t).join(' | ')}`);
});
