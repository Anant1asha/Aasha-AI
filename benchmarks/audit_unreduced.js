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

console.log('--- UNREDUCED FRACTIONS AUDIT ---');
let unreducedCount = 0;
let collisionCount = 0;

d.questions.forEach((q, idx) => {
  const correctOpt = (q.opts || []).find(o => o.c);
  const correctRaw = correctOpt ? correctOpt.t.trim() : '';

  q.opts.forEach((opt, optIdx) => {
    const t = opt.t.trim();
    const match = t.match(/^(-?\d+)\/(-?\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      const d = parseInt(match[2], 10);
      const g = gcd(n, d);
      if (g > 1) {
        unreducedCount++;
        const reducedN = (d < 0 ? -n : n) / g;
        const reducedD = Math.abs(d) / g;
        const reducedStr = `${reducedN}/${reducedD}`;
        const reducedInt = (reducedD === 1) ? `${reducedN}` : null;
        
        const isCollision = (reducedStr === correctRaw || reducedInt === correctRaw);
        if (isCollision && !opt.c) {
          collisionCount++;
          console.log(`[COLLISION] ${q.id} (${q.tag}): Distractor #${optIdx+1} '${t}' reduces to '${reducedStr}' which EQUALS correct answer '${correctRaw}'!`);
        } else {
          console.log(`[UNREDUCED] ${q.id} (${q.tag}) Option #${optIdx+1} (c: ${opt.c}): '${t}' reduces to '${reducedStr}' (gcd=${g}). Correct is '${correctRaw}'. Collision: ${isCollision}`);
        }
      }
    }
  });
});

console.log(`Total unreduced fractions across all options: ${unreducedCount}`);
console.log(`Total distractor collisions against correct answer: ${collisionCount}`);
