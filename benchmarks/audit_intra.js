const fs = require('fs');
const d = JSON.parse(fs.readFileSync('chapters/ad_all_questions.json', 'utf8'));

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function parseVal(str) {
  const m = str.trim().match(/^(-?\d+)\/(-?\d+)$/);
  if (m) {
    let n = parseInt(m[1], 10);
    let d = parseInt(m[2], 10);
    return n / d;
  }
  const i = str.trim().match(/^-?\d+$/);
  if (i) return parseInt(i[0], 10);
  return null;
}

let intraCollisions = 0;
d.questions.forEach(q => {
  for (let i = 0; i < q.opts.length; i++) {
    for (let j = i + 1; j < q.opts.length; j++) {
      const v1 = parseVal(q.opts[i].t);
      const v2 = parseVal(q.opts[j].t);
      if (v1 !== null && v2 !== null && Math.abs(v1 - v2) < 1e-9) {
        intraCollisions++;
        console.log(`[INTRA-COLLISION] ${q.id} (${q.tag}): Option #${i+1} '${q.opts[i].t}' equals Option #${j+1} '${q.opts[j].t}'`);
      }
    }
  }
});
console.log(`Total intra-question option value collisions: ${intraCollisions}`);
