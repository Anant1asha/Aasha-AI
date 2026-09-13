const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Rational Arithmetic
class Rational {
  constructor(n, d = 1n) {
    n = BigInt(n);
    d = BigInt(d);
    if (d === 0n) throw new Error('Division by zero');
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = Rational.gcd(n < 0n ? -n : n, d);
    this.n = n / g;
    this.d = d / g;
  }

  static gcd(a, b) {
    while (b !== 0n) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  static parse(str) {
    str = String(str).trim().replace(/[()[\]]/g, '');
    if (str.includes('/')) {
      const parts = str.split('/');
      return new Rational(parts[0], parts[1]);
    }
    return new Rational(str, 1n);
  }

  add(other) { return new Rational(this.n * other.d + other.n * this.d, this.d * other.d); }
  sub(other) { return new Rational(this.n * other.d - other.n * this.d, this.d * other.d); }
  mul(other) { return new Rational(this.n * other.n, this.d * other.d); }
  div(other) { return new Rational(this.n * other.d, this.d * other.n); }
  toString() { return this.d === 1n ? this.n.toString() : `${this.n}/${this.d}`; }
  equals(other) { return this.n === other.n && this.d === other.d; }
}

const jsonPath = path.resolve(__dirname, '..', 'chapters', 'ad_all_questions.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const questions = data.questions;

console.log('Auditing questions count:', questions.length);

const errors = [];
const seenIds = new Set();

questions.forEach((q, i) => {
  const qid = q.id;
  if (seenIds.has(qid)) errors.push(`Duplicate id: ${qid}`);
  seenIds.add(qid);

  if (!q.tag) errors.push(`${qid}: Missing tag`);
  if (!['warmup', 'deep_dive', 'boss'].includes(q.tier)) errors.push(`${qid}: Invalid tier ${q.tier}`);
  if (!q.q || q.q.trim().length === 0) errors.push(`${qid}: Empty question text`);
  if (!q.ans || q.ans.trim().length === 0) errors.push(`${qid}: Empty ans`);
  if (!q.m || q.m.trim().length < 15) errors.push(`${qid}: Missing or short top-level m: '${q.m}'`);

  if (!Array.isArray(q.opts) || q.opts.length !== 4) {
    errors.push(`${qid}: Options count is not 4`);
  } else {
    const correctOpts = q.opts.filter(o => o.c === true);
    if (correctOpts.length !== 1) {
      errors.push(`${qid}: Exactly 1 correct option required, found ${correctOpts.length}`);
    } else if (correctOpts[0].t !== q.ans) {
      errors.push(`${qid}: Correct option text '${correctOpts[0].t}' !== ans '${q.ans}'`);
    }

    const optTexts = new Set();
    q.opts.forEach((o, oIdx) => {
      if (optTexts.has(o.t)) {
        errors.push(`${qid}: Duplicate option text '${o.t}' at index ${oIdx}`);
      }
      optTexts.add(o.t);

      if (o.c === false) {
        if (!o.m || o.m.trim().length < 15) {
          errors.push(`${qid}: Distractor ${oIdx} ('${o.t}') has missing/short m: '${o.m}'`);
        }
      }
    });

    // Check if any distractor is numerically equal to the correct answer
    try {
      const correctVal = Rational.parse(q.ans);
      q.opts.forEach((o, oIdx) => {
        if (o.c === false) {
          try {
            const distVal = Rational.parse(o.t);
            if (distVal.equals(correctVal)) {
              errors.push(`${qid}: Distractor ${oIdx} ('${o.t}') is numerically equal to correct answer '${q.ans}'!`);
            }
          } catch (_) {
            // Not a rational number (could be property name), that's fine
          }
        }
      });
    } catch (_) {
      // ans is not a rational number (property name), that's fine
    }
  }

  if (!q.hints) {
    errors.push(`${qid}: Missing hints object`);
  } else {
    ['h1', 'h2', 'h3', 'h4'].forEach(h => {
      if (!q.hints[h] || q.hints[h].trim().length < 10) {
        errors.push(`${qid}: Hint ${h} missing or short: '${q.hints[h]}'`);
      }
    });
  }
});

console.log('Structural & Numerical Equivalence Errors:', errors.length);
if (errors.length > 0) {
  errors.forEach(e => console.error('  ERROR:', e));
  process.exit(1);
} else {
  console.log('ALL 75 QUESTIONS PASSED STRUCTURAL, DISTRACTOR, AND NUMERICAL INTEGRITY AUDIT!');
}
