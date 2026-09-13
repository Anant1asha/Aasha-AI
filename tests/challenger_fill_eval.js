const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Exact Rational Arithmetic Class
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

// Simple evaluator for expressions of Rational numbers
function evalExpr(expr) {
  expr = expr.trim();
  // Remove outer parentheses/brackets if redundant
  while ((expr.startsWith('(') && expr.endsWith(')')) || (expr.startsWith('[') && expr.endsWith(']'))) {
    // verify matching
    let depth = 0;
    let match = true;
    for (let i = 0; i < expr.length - 1; i++) {
      if (expr[i] === '(' || expr[i] === '[') depth++;
      else if (expr[i] === ')' || expr[i] === ']') depth--;
      if (depth === 0) { match = false; break; }
    }
    if (match) expr = expr.slice(1, -1).trim();
    else break;
  }

  // Look for top-level + or - (outside brackets)
  let depth = 0;
  for (let i = expr.length - 1; i >= 0; i--) {
    const c = expr[i];
    if (c === ')' || c === ']') depth++;
    else if (c === '(' || c === '[') depth--;
    else if (depth === 0) {
      if ((c === '+' || c === '-') && i > 0 && expr[i-1] !== '*' && expr[i-1] !== '/' && expr[i-1] !== '(' && expr[i-1] !== '[') {
        const left = evalExpr(expr.slice(0, i));
        const right = evalExpr(expr.slice(i + 1));
        return c === '+' ? left.add(right) : left.sub(right);
      }
    }
  }

  // Look for top-level * or /
  depth = 0;
  for (let i = expr.length - 1; i >= 0; i--) {
    const c = expr[i];
    if (c === ')' || c === ']') depth++;
    else if (c === '(' || c === '[') depth--;
    else if (depth === 0) {
      if (c === '*' || c === '/') {
        const left = evalExpr(expr.slice(0, i));
        const right = evalExpr(expr.slice(i + 1));
        return c === '*' ? left.mul(right) : left.div(right);
      }
    }
  }

  return Rational.parse(expr);
}

const jsonPath = path.resolve(__dirname, '..', 'chapters', 'ad_all_questions.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const questions = data.questions;

let fillCount = 0;
let fillPassed = 0;

questions.forEach(q => {
  if (q.q.includes('Fill in the blank')) {
    fillCount++;
    // Extract the equation after ':'
    const parts = q.q.split(':');
    const eq = parts[parts.length - 1].trim();
    const [lhsRaw, rhsRaw] = eq.split('=').map(s => s.trim());

    // Replace _____ with ans
    const lhsSub = lhsRaw.replace(/_____/g, `(${q.ans})`);
    const rhsSub = rhsRaw.replace(/_____/g, `(${q.ans})`);

    const lhsVal = evalExpr(lhsSub);
    const rhsVal = evalExpr(rhsSub);

    const match = lhsVal.equals(rhsVal);
    console.log(`[Fill-in] ${q.id}: ${lhsSub} = ${rhsSub} => LHS: ${lhsVal}, RHS: ${rhsVal} => ${match ? 'EXACT MATCH' : 'MISMATCH'}`);
    if (match) fillPassed++;
    else console.error(`FAILED: ${q.id}`);
  }
});

console.log(`\nFill-in Equations Verified: ${fillPassed}/${fillCount}`);
assert.strictEqual(fillPassed, fillCount, 'All fill-in equations must evaluate to LHS == RHS under exact substitution!');
