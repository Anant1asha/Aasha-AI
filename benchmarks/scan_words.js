const fs = require('fs');
const d = JSON.parse(fs.readFileSync('chapters/ad_all_questions.json', 'utf8'));

const badWords = [
  'incorrect', 'wrong', 'false', 'bad', 'stupid', 'dumb', 'careless',
  'foolish', 'silly', 'you failed', 'you did not', 'you made a mistake',
  'error on your part', 'not right', 'not correct', 'mistake', 'error', 'fault', 'invalid', '❌'
];

console.log('--- SCANNING ALL FIELDS FOR ALL SUSPECT WORDS ---');
d.questions.forEach((q, idx) => {
  const fields = [
    { name: 'q.m', text: q.m || '' },
    ...(q.opts || []).map((o, i) => ({ name: `opt[${i+1}].m`, text: o.m || '' })),
    ...(q.hints ? Object.entries(q.hints).map(([k, v]) => ({ name: `hints.${k}`, text: v || '' })) : [])
  ];

  fields.forEach(f => {
    badWords.forEach(w => {
      const reg = new RegExp(`\\b${w}\\b`, 'i');
      if (reg.test(f.text)) {
        console.log(`[${q.id}] (${q.tag}) [${f.name}]: contains '${w}': "${f.text}"`);
      }
    });
  });
});
