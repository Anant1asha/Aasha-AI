const fs = require('fs');
const path = require('path');
const { warmupHtml, deepdiveHtml, bossHtml, warmupQuestionIds, deepdiveQuestionIds, bossQuestionIds, wmSnippet, connSnippet } = require('./card_generator_helper');
const { mathAndRtSnippet } = require('./extract_gold_rt');
const { validateSourceEvidenceManifest } = require('./source_evidence_gate');

console.log('Building full Exponents & Powers Gamified Chapter...');

// Read base template from Rational Numbers
const baseRef = fs.readFileSync(path.join(__dirname, '../chapters/RationalNumbers_Class8_AD_Gamified_v5_Enhanced_v6.html'), 'utf8');

// NODES & WE definitions for Exponents & Powers
const NODES_JSON = [
  {
    title: "Powers with Negative Exponents",
    steps: [
      {
        t: "intro",
        icon: "🔬",
        title: "Why do we need negative exponents in nature and science?",
        sub: "A cell doubles its count every hour: 1 cell becomes 2, then 4, then 8 (2^3). But what if we rewind time? An hour ago was half (1/2 = 2^(-1)), two hours ago was a quarter (1/4 = 2^(-2)). Negative exponents represent repeated division and reciprocal fractions!"
      },
      {
        t: "text",
        title: "Why does a negative exponent turn into a reciprocal fraction?",
        text: "For any non-zero rational base a, a^(-n) is the multiplicative inverse of a^n: a^(-n) = 1 / (a^n). For any fraction (p/q)^(-n) = (q/p)^n because dividing by a fraction is equivalent to multiplying by its reciprocal. The product of a number and its multiplicative inverse always equals 1.",
        simType: "doubling",
        caption: "Exponential Doubling & Sign Parity Lab: Fold layers and observe odd/even negative power signs"
      },
      { t: "worked", we: "we_negative_exp" },
      {
        t: "quiz",
        q: {
          q: "What is the value of (2/3)^(-3)?",
          opts: [
            { t: "27/8", c: true, m: "" },
            { t: "-8/27", c: false, m: "Confused negative exponent with negative arithmetic sign on the fraction." },
            { t: "8/27", c: false, m: "Cubed the fraction without reciprocating numerator and denominator for the negative exponent." },
            { t: "-27/8", c: false, m: "Inverted fraction correctly but erroneously added an unnecessary negative sign." }
          ],
          exp: "By the reciprocal rule for negative exponents, (2/3)^(-3) = (3/2)^3 = 3^3 / 2^3 = 27/8."
        }
      },
      {
        t: "progress",
        summary: "Node 1 Complete! You mastered negative exponents and reciprocal fraction transformations."
      }
    ]
  },
  {
    title: "Product & Quotient Laws",
    steps: [
      {
        t: "intro",
        icon: "⚡",
        title: "How do computer chips count gigabytes and terabytes?",
        sub: "A kilobyte is 2^10 bytes. A megabyte is 2^10 * 2^10 = 2^20 bytes. A gigabyte is 2^30 bytes. When multiplying powers of identical bases, we don't multiply the bases; we add their exponents together!"
      },
      {
        t: "text",
        title: "How do common base factors merge or cancel out?",
        text: "The Product Law states that a^m * a^n = a^(m+n) because we are grouping m factors of a with n factors of a. The Quotient Law states that a^m / a^n = a^(m-n) because identical factors cancel out between numerator and denominator. When m = n, all factors cancel, revealing why a^0 = 1.",
        simType: "laws",
        caption: "Factor Merger & Laser Particle Cancellation Arena: Merge factor clouds or evaporate matching pairs"
      },
      { t: "worked", we: "we_laws" },
      {
        t: "quiz",
        q: {
          q: "Simplify: (-3)^4 * (-3)^(-7)",
          opts: [
            { t: "(-3)^(-3)", c: true, m: "" },
            { t: "(-3)^(-11)", c: false, m: "Subtracted exponents rather than adding powers under the product rule." },
            { t: "9^(-3)", c: false, m: "Multiplied bases together (-3 * -3) when the common base must remain unchanged." },
            { t: "(-3)^{11}", c: false, m: "Multiplied signs incorrectly during exponent addition." }
          ],
          exp: "Using the product law with common base (-3): 4 + (-7) = -3, giving (-3)^(-3)."
        }
      },
      {
        t: "progress",
        summary: "Node 2 Complete! You mastered combining identical bases with product and quotient rules."
      }
    ]
  },
  {
    title: "Power of a Power & Zero Exponent",
    steps: [
      {
        t: "intro",
        icon: "📦",
        title: "Why does a power raised to another power multiply exponents?",
        sub: "Imagine a warehouse with 3 buildings, each with 3 rooms, each holding 3 boxes of 3 books: (3^2)^2 = 3^(2*2) = 3^4 = 81 books! Raising a power to another power repeats the multiplication of groups."
      },
      {
        t: "text",
        title: "Why does a^0 always equal 1 for any non-zero base?",
        text: "The Power of a Power law states (a^m)^n = a^(m*n). For any non-zero base a, dividing a^n by a^n gives a^(n-n) = a^0. Since any non-zero number divided by itself equals 1, we prove that a^0 = 1. Also (a*b)^n = a^n * b^n.",
        simType: "matrix",
        caption: "Power Matrix Visualizer: Group factor arrays and observe complete identity cancellation a^0 = 1"
      },
      { t: "worked", we: "we_power_of_power" },
      {
        t: "quiz",
        q: {
          q: "Evaluate: (7^0 - 4^0) * 8^2",
          opts: [
            { t: "0", c: true, m: "" },
            { t: "64", c: false, m: "Calculated inner difference as one rather than observing identical unit cancellation." },
            { t: "1", c: false, m: "Assumed zero exponents reduce the entire calculation to 1." },
            { t: "-64", c: false, m: "Subtracted base values 7 - 4 before applying the zero exponent rule." }
          ],
          exp: "Any non-zero base to power 0 equals 1: (1 - 1) * 64 = 0 * 64 = 0."
        }
      },
      {
        t: "progress",
        summary: "Node 3 Complete! You mastered repeated power scaling and the zero exponent identity."
      }
    ]
  },
  {
    title: "Solving Exponential Equations",
    steps: [
      {
        t: "intro",
        icon: "⚖️",
        title: "How do scientists find unknown growth rates?",
        sub: "If bacteria grow as 2^(3x-1) and reach 32 colonies, how many hours passed? Since 32 = 2^5, both sides share base 2. Setting exponents equal gives 3x - 1 = 5, so x = 2 hours!"
      },
      {
        t: "text",
        title: "How do equal bases unlock the unknown exponent?",
        text: "When two exponential expressions with the same non-zero base (other than 1 or -1) are equal, their exponents must be equal: if a^x = a^y, then x = y. To solve exponential equations, express both sides with a common prime base, apply exponent laws to simplify both sides, and solve the resulting linear equation.",
        simType: "equation",
        caption: "Equation Balance Scale: Tune x until beam levels out in horizontal equilibrium"
      },
      { t: "worked", we: "we_equation" },
      {
        t: "quiz",
        q: {
          q: "If (2/5)^(-3) * (2/5)^8 = (2/5)^{2x-1}, what is the value of x?",
          opts: [
            { t: "3", c: true, m: "" },
            { t: "2", c: false, m: "Subtracted constant term rather than adding constant across linear equality." },
            { t: "5", c: false, m: "Equated 2x directly to 5 without adding 1 across the equality." },
            { t: "4", c: false, m: "Added exponents incorrectly on the left hand side." }
          ],
          exp: "LHS exponent = -3 + 8 = 5. Equating exponents: 2x - 1 = 5, so 2x = 6, yielding x = 3."
        }
      },
      {
        t: "progress",
        summary: "Node 4 Complete! You mastered isolating unknown exponents with base equivalence."
      }
    ]
  },
  {
    title: "Scientific Notation & Standard Form",
    steps: [
      {
        t: "intro",
        icon: "🌌",
        title: "How can we write the mass of the Sun without writing 30 zeros?",
        sub: "The mass of the Sun is 1,989,000,000,000,000,000,000,000,000,000 kg! An electron weighs 0.00000000000000000000000000000091 kg. Scientific notation uses powers of 10 to write extreme scales cleanly and accurately."
      },
      {
        t: "text",
        title: "How does scientific notation express extreme scales with base 10?",
        text: "Standard scientific form expresses numbers as k * 10^n, where 1 <= k < 10 and n is an integer. For large numbers (>10), shifting the decimal point n places left produces a positive exponent 10^n. For microscopic decimals (<1), shifting n places right produces a negative exponent 10^(-n).",
        simType: "spinner",
        caption: "Maths Lab Dual-Spinner & Scale Zoomer: Explore astronomical vs microscopic dimensions"
      },
      { t: "worked", we: "we_standard_form" },
      {
        t: "quiz",
        q: {
          q: "What is the standard scientific form of 0.0000543?",
          opts: [
            { t: "5.43 * 10^(-5)", c: true, m: "" },
            { t: "5.43 * 10^(-4)", c: false, m: "Counted leading zeros without including the shift past first non-zero digit 5." },
            { t: "54.3 * 10^(-6)", c: false, m: "Coefficient retains multiple digits before decimal point, lacking standard normalization." },
            { t: "5.43 * 10^5", c: false, m: "Used a positive exponent for a decimal number less than one." }
          ],
          exp: "Moving the decimal point 5 places to the right puts it between 5 and 4: 5.43 * 10^(-5)."
        }
      },
      {
        t: "progress",
        summary: "Node 5 Complete! You mastered standard scientific form and extreme cosmic scales."
      }
    ]
  }
];

const WE_JSON = {
  we_negative_exp: {
    title: "Worked Example: Negative Integral Exponent",
    q: "Evaluate: (-3/4)^(-3)",
    steps: [
      {
        step: 1,
        title: "Apply Reciprocal Inversion Rule",
        text: "By the law (p/q)^(-n) = (q/p)^n, invert the fraction to change the exponent to positive: (-3/4)^(-3) = (-4/3)^3.",
        check: {
          q: "What does (-3/4)^(-3) invert to?",
          opts: [
            { t: "(-4/3)^3", c: true, m: "" },
            { t: "(3/4)^3", c: false, m: "Lost the negative sign of the base during reciprocal inversion." },
            { t: "(-4/3)^(-3)", c: false, m: "Inverted the fraction but left the exponent negative." }
          ],
          exp: "Inverting base -3/4 gives -4/3, and the exponent changes from -3 to +3."
        }
      },
      {
        step: 2,
        title: "Expand and Evaluate",
        text: "Raise both numerator and denominator to the 3rd power: (-4)^3 / 3^3 = -64 / 27.",
        check: {
          q: "What is (-4)^3 / 3^3?",
          opts: [
            { t: "-64/27", c: true, m: "" },
            { t: "64/27", c: false, m: "An odd exponent preserves the negative sign on negative base." },
            { t: "-12/9", c: false, m: "Multiplied terms by 3 rather than evaluating cubic powers." }
          ],
          exp: "(-4)^3 = -64 and 3^3 = 27, yielding -64/27."
        }
      }
    ]
  },
  we_laws: {
    title: "Worked Example: Simplifying with Laws of Exponents",
    q: "Simplify: (2^5 * 2^(-3)) / 2^4",
    steps: [
      {
        step: 1,
        title: "Apply Product Law in Numerator",
        text: "2^5 * 2^(-3) = 2^(5 + (-3)) = 2^2.",
        check: {
          q: "What is 2^5 * 2^(-3)?",
          opts: [
            { t: "2^2", c: true, m: "" },
            { t: "2^8", c: false, m: "Subtracted negative power magnitude rather than adding the exponents algebraically." },
            { t: "4^2", c: false, m: "Multiplied the common bases together when like-base multiplication retains the common base factor." }
          ],
          exp: "Product law adds exponents: 5 + (-3) = 2, so 2^2."
        }
      },
      {
        step: 2,
        title: "Apply Quotient Law with Denominator",
        text: "Now divide by 2^4: 2^2 / 2^4 = 2^(2 - 4) = 2^(-2) = 1/4.",
        check: {
          q: "What is 2^2 / 2^4 in simplest form?",
          opts: [
            { t: "1/4", c: true, m: "" },
            { t: "4", c: false, m: "Subtracted exponents in reversed order rather than numerator minus denominator." },
            { t: "-4", c: false, m: "Confused negative power 2^(-2) with negative number -4." }
          ],
          exp: "2^(2 - 4) = 2^(-2) = 1 / 2^2 = 1/4."
        }
      }
    ]
  },
  we_power_of_power: {
    title: "Worked Example: Power of a Power & Zero Power",
    q: "Evaluate: [(2/3)^2]^(-3) * (5/7)^0",
    steps: [
      {
        step: 1,
        title: "Simplify Power of a Power and Zero Power",
        text: "[(2/3)^2]^(-3) = (2/3)^(2 * -3) = (2/3)^(-6). Also (5/7)^0 = 1.",
        check: {
          q: "What is [(2/3)^2]^(-3)?",
          opts: [
            { t: "(2/3)^(-6)", c: true, m: "" },
            { t: "(2/3)^(-1)", c: false, m: "Added powers together rather than multiplying exponents in power of a power." },
            { t: "(4/9)^(-3)", c: false, m: "While equivalent, power of power law multiplies exponents directly to -6." }
          ],
          exp: "Power of power law multiplies exponents: 2 * (-3) = -6."
        }
      },
      {
        step: 2,
        title: "Apply Negative Exponent Inversion",
        text: "(2/3)^(-6) * 1 = (3/2)^6 = 729 / 64.",
        check: {
          q: "What is (2/3)^(-6) as a positive power fraction?",
          opts: [
            { t: "(3/2)^6", c: true, m: "" },
            { t: "(2/3)^6", c: false, m: "Dropped negative sign without reciprocating the fraction base." },
            { t: "-(3/2)^6", c: false, m: "Reciprocal transformation preserves positive base sign." }
          ],
          exp: "(2/3)^(-6) inverts to (3/2)^6 = 729/64."
        }
      }
    ]
  },
  we_equation: {
    title: "Worked Example: Solving Exponential Equation",
    q: "Solve for x: 3^(2x-1) = 27",
    steps: [
      {
        step: 1,
        title: "Align to Common Base",
        text: "Express 27 as a power of base 3: 27 = 3^3. So 3^(2x-1) = 3^3.",
        check: {
          q: "What power of 3 is 27?",
          opts: [
            { t: "3^3", c: true, m: "" },
            { t: "3^2", c: false, m: "Squaring base three reaches value nine, falling short of target magnitude." },
            { t: "3^9", c: false, m: "Confused 3 * 9 with powers of 3." }
          ],
          exp: "3 * 3 * 3 = 27, which is 3^3."
        }
      },
      {
        step: 2,
        title: "Equate Exponents and Solve",
        text: "Since bases are equal, 2x - 1 = 3. Add 1 to both sides: 2x = 4, so x = 2.",
        check: {
          q: "What is the solution for x?",
          opts: [
            { t: "2", c: true, m: "" },
            { t: "1", c: false, m: "Subtracted linear constant rather than adding constant across equality." },
            { t: "3", c: false, m: "Equated 2x directly to 3 without isolating variable." }
          ],
          exp: "2x - 1 = 3 implies 2x = 4, so x = 2."
        }
      }
    ]
  },
  we_standard_form: {
    title: "Worked Example: Scientific Notation Conversion",
    q: "Express 0.0000000048 in standard scientific form",
    steps: [
      {
        step: 1,
        title: "Find Normalized Coefficient",
        text: "Place the decimal point after the first non-zero digit 4 to get k = 4.8.",
        check: {
          q: "What is the normalized coefficient k?",
          opts: [
            { t: "4.8", c: true, m: "" },
            { t: "48", c: false, m: "Standard form coefficient requires normalization strictly below ten." },
            { t: "0.48", c: false, m: "Standard form coefficient requires magnitude at or above one." }
          ],
          exp: "Normalized coefficient requires strictly one non-zero digit before decimal point: 4.8."
        }
      },
      {
        step: 2,
        title: "Count Decimal Shifts",
        text: "Moving from 0.0000000048 to 4.8 requires shifting 9 places to the right: 4.8 * 10^(-9).",
        check: {
          q: "What is the power of 10?",
          opts: [
            { t: "10^(-9)", c: true, m: "" },
            { t: "10^(-8)", c: false, m: "Counted only zeros without including shift past digit 4." },
            { t: "10^9", c: false, m: "Used positive exponent for a number far smaller than one." }
          ],
          exp: "Shift right across 8 zeros plus digit 4 = 9 places, giving 10^(-9)."
        }
      }
    ]
  }
};

// Assemble full HTML document
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<title>Class 8 Exponents & Powers — Aasha Learning Ecosystem</title>
<style>
/* MathIsolation: true */
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#f0f4ff;--surface:#ffffff;--text:#0f172a;--muted:#475569;
  --blue:#2563eb;--blue-dk:#1d4ed8;--blue-lt:#eff6ff;
  --green:#16a34a;--green-dk:#15803d;--green-lt:#f0fdf4;
  --red:#dc2626;--red-lt:#fef2f2;
  --amber:#d97706;--amber-lt:#fffbeb;
  --purple:#7c3aed;--purple-lt:#f5f3ff;
  --border:#cbd5e1;--border-dk:#94a3b8;
  --shadow:0 4px 6px -1px rgba(15,23,42,.08),0 2px 4px -2px rgba(15,23,42,.05);
  --shadow-lg:0 10px 25px -3px rgba(15,23,42,.12),0 4px 6px -4px rgba(15,23,42,.07);
  --radius:16px;--radius-sm:12px;--radius-xs:8px;
  --brand:#1e3a5f;--brand-lt:#2d5a8e;
  --font:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
}
body{font-family:var(--font);background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden;-webkit-tap-highlight-color:transparent}
.app{max-width:520px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;background:var(--surface);box-shadow:0 0 40px rgba(0,0,0,.08)}

/* Brand Header */
.brand-header{background:linear-gradient(135deg,var(--brand),var(--brand-lt));padding:10px 16px;display:flex;align-items:center;gap:12px;color:#fff}
.brand-logo{width:44px;height:44px;flex-shrink:0}
.brand-logo svg{width:100%;height:100%}
.brand-info{flex:1;min-width:0}
.brand-name{font-size:.82rem;font-weight:800;letter-spacing:.02em;line-height:1.2}
.brand-name-hi{font-size:.70rem;opacity:.9;line-height:1.2}
.brand-tagline{font-size:.64rem;opacity:.8;margin-top:2px}

/* Topbar */
.topbar{display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--surface);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:50}
.exit-btn{background:none;border:none;font-size:20px;color:var(--muted);cursor:pointer;padding:4px;min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px}
.exit-btn:hover{background:#f1f5f9;color:#0f172a}
.progress-track{flex:1;height:10px;background:var(--border);border-radius:10px;overflow:hidden}
.progress-fill{height:100%;background:linear-gradient(90deg,var(--blue),var(--purple));border-radius:10px;transition:width .4s ease;width:0}
.stat{display:inline-flex;align-items:center;gap:4px;font-size:.75rem;font-weight:800;padding:4px 9px;border-radius:16px;white-space:nowrap}
.stat.coins{color:var(--amber);background:var(--amber-lt);border:1px solid #fde68a}
.stat.xp{color:var(--purple);background:var(--purple-lt);border:1px solid #ddd6fe}
.stat.lvl{color:var(--blue);background:var(--blue-lt);border:1px solid #bfdbfe}
.stat.streak{color:var(--red);background:var(--red-lt);border:1px solid #fecaca}

/* Mode Bar (Tab Navigation) */
.mode-bar{display:flex;align-items:center;justify-content:space-between;gap:4px;padding:6px 12px;background:#f8fafc;border-bottom:1px solid var(--border);overflow-x:auto;-webkit-overflow-scrolling:touch}
.mode-btn{flex:1;min-height:44px;min-width:44px;touch-action:manipulation;background:#ffffff;border:1.5px solid var(--border);border-radius:10px;font-size:0.75rem;font-weight:700;color:var(--muted);cursor:pointer;padding:4px 8px;display:inline-flex;align-items:center;justify-content:center;text-align:center;transition:all 0.15s;white-space:nowrap}
.mode-btn:hover{border-color:var(--blue);color:var(--blue-dk)}
.mode-btn.active{background:var(--blue-lt);border-color:var(--blue);color:var(--blue-dk);font-weight:800;box-shadow:0 1px 3px rgba(37,99,235,0.15)}

/* Screen Container */
.screen{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:8px 12px 60px;min-height:0;box-sizing:border-box;width:100%}

/* Concept Frame */
.concept-frame{background:#ffffff;border:2px solid var(--border);border-radius:var(--radius);padding:16px 14px;width:100%;box-shadow:var(--shadow);margin-bottom:12px;box-sizing:border-box}
.concept-badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:.70rem;font-weight:800;letter-spacing:.04em;color:var(--blue-dk);background:var(--blue-lt);margin-bottom:8px}
.inquiry-title{font-size:1.10rem;font-weight:800;color:var(--brand);margin-bottom:8px;line-height:1.35}
.concept-def{font-size:.92rem;line-height:1.7;color:var(--text);margin-bottom:10px}
.hint{font-size:.72rem;color:var(--muted);text-align:center;margin:6px 0}

/* Math expression styling */
.math, .math-var{font-family:'Cambria Math','Times New Roman',serif;font-style:italic;font-weight:700;padding:0 3px;color:#1e3a8a}

/* LLE Bilingual Styling */
.lle-text{font-size:1.02rem;line-height:2.0;color:var(--text);margin:6px 0;text-align:left}
.lle-text-sm{font-size:.90rem;line-height:1.7;color:var(--text);margin:4px 0;text-align:left}
.word{cursor:pointer;border-radius:4px;padding:1px 3px;transition:all .15s;border-bottom:1.5px dotted #94a3b8;font-weight:600}
.word:hover{background:#dbeafe;color:var(--blue-dk)}
.connective{color:var(--blue-dk);font-weight:700;cursor:pointer;border-bottom:2px dotted var(--blue);padding:1px 3px}
.connective-hi{color:var(--purple);font-size:.85em;font-weight:600}

/* Fraction display */
.frac{display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;font-size:.88em;line-height:1;margin:0 3px}
.frac-top{border-bottom:1.5px solid currentColor;padding:0 3px}
.frac-bot{padding:0 3px}

/* Simulation Box */
.sim-container{background:#f8fafc;border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:10px;margin:10px 0}
.sim-readout{padding:6px 10px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;font-size:0.82rem;font-weight:800;color:#1e40af;text-align:center;margin-bottom:8px;line-height:1.4}
.sim-canvas{display:block;margin:0 auto;max-width:100%;height:auto;border-radius:var(--radius-xs);touch-action:none;background:#ffffff;border:1px solid #e2e8f0}
.sim-controls{margin-top:8px;display:flex;flex-direction:column;gap:6px}
.preset-bar{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.preset-btn, .sim-btn{background:#ffffff;border:1.5px solid var(--border);border-radius:8px;padding:6px 10px;font-size:0.78rem;font-weight:700;color:var(--text);cursor:pointer;transition:all 0.15s;min-height:44px;min-width:44px;touch-action:manipulation;display:inline-flex;align-items:center;justify-content:center}
.preset-btn:hover, .sim-btn:hover{border-color:var(--blue);color:var(--blue-dk);background:var(--blue-lt)}
.preset-btn.active, .sim-btn.active{background:var(--blue-lt);border-color:var(--blue);color:var(--blue-dk)}
.sim-caption{font-size:.74rem;color:var(--muted);text-align:center;margin-top:6px}
.btn-skip{display:block;text-align:center;font-size:.78rem;color:var(--muted);text-decoration:none;margin-top:8px;min-height:44px;line-height:44px}
.btn-skip:hover{color:var(--blue)}

/* Worked Example Card */
.we-card{background:#ffffff;border:2px solid var(--border);border-radius:var(--radius);padding:18px 16px;width:100%;box-shadow:var(--shadow)}
.we-tag{font-size:.70rem;font-weight:800;text-transform:uppercase;color:var(--purple);background:var(--purple-lt);padding:3px 8px;border-radius:6px;display:inline-block;margin-bottom:8px}
.we-question{font-size:1.05rem;font-weight:800;color:var(--brand);margin-bottom:12px;line-height:1.4}
.we-step{background:#f8fafc;border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;margin-bottom:10px}
.we-step-title{font-size:.82rem;font-weight:800;color:var(--brand-lt);margin-bottom:4px}
.we-step-text{font-size:.88rem;line-height:1.6;color:var(--text)}

/* Assessment Question Cards */
.assessment-section{width:100%;margin-bottom:20px}
.assessment-header{padding:10px 14px;border-radius:12px;margin-bottom:12px}
.assessment-header.warmup{background:var(--blue-lt);border:1.5px solid #bfdbfe}
.assessment-header.deepdive{background:var(--purple-lt);border:1.5px solid #ddd6fe}
.assessment-header.boss{background:var(--amber-lt);border:1.5px solid #fde68a}
.assessment-level-badge{display:inline-block;font-size:0.75rem;font-weight:800;text-transform:uppercase;letter-spacing:0.04em}
.assessment-level-badge.warmup{color:var(--blue-dk)}
.assessment-level-badge.deepdive{color:var(--purple)}
.assessment-level-badge.boss{color:var(--amber)}

.quiz-card{background:#ffffff;border:2px solid var(--border);border-radius:var(--radius);padding:16px 14px;width:100%;box-shadow:var(--shadow);margin-bottom:12px;box-sizing:border-box}
.quiz-tag{font-size:.70rem;font-weight:800;text-transform:uppercase;color:var(--blue-dk);background:var(--blue-lt);padding:2px 8px;border-radius:6px;display:inline-block;margin-bottom:8px}
.quiz-question{font-size:1.0rem;font-weight:800;color:var(--brand);margin-bottom:12px;line-height:1.4}
.quiz-opts-container{display:flex;flex-direction:column;gap:8px}
.quiz-opt{display:flex;align-items:center;gap:10px;padding:12px 14px;border:1.5px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;transition:all .15s;min-height:44px;touch-action:manipulation;background:#fff}
.quiz-opt:hover{border-color:var(--blue);background:#f8fafc}
.quiz-opt.selected{border-color:var(--blue);background:var(--blue-lt)}
.quiz-opt.correct{border-color:var(--green);background:var(--green-lt);color:var(--green-dk);font-weight:700}
.quiz-opt.wrong{border-color:var(--red);background:var(--red-lt);color:var(--red);font-weight:700}
.quiz-radio{width:18px;height:18px;border:2px solid var(--border-dk);border-radius:50%;flex-shrink:0;transition:all .15s}
.quiz-opt.selected .quiz-radio{border-color:var(--blue);background:var(--blue)}
.quiz-opt.correct .quiz-radio{border-color:var(--green);background:var(--green)}
.quiz-opt.wrong .quiz-radio{border-color:var(--red);background:var(--red)}
.quiz-opt-text{font-size:.92rem;line-height:1.4}
.quiz-feedback{margin-top:10px}
.feedback{padding:10px 12px;border-radius:var(--radius-xs);font-size:.85rem;line-height:1.5;margin-top:8px}
.feedback.ok{background:var(--green-lt);color:var(--green-dk);border:1px solid #bbf7d0}
.feedback.fail{background:var(--red-lt);color:var(--red);border:1px solid #fecaca}
.misconception{margin-top:6px;padding:8px 10px;background:#fff;border-left:3px solid var(--amber);border-radius:4px;font-size:.80rem;color:var(--muted);line-height:1.45}

/* 4-Tier Hint Accordion */
.hint-box{margin-top:10px;border-top:1px dashed var(--border);padding-top:8px}
.hint-btn{background:none;border:none;color:var(--blue-dk);font-size:0.78rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;padding:4px 0;min-height:36px;touch-action:manipulation}
.hint-btn:hover{color:var(--blue)}
.hint-text{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:8px 10px;font-size:0.80rem;color:#1e40af;line-height:1.4;margin-top:6px}

/* Bottom Bar */
.bottom-bar{position:fixed;bottom:0;left:0;right:0;max-width:520px;margin:0 auto;padding:10px 16px;background:rgba(255,255,255,.95);backdrop-filter:blur(10px);border-top:1px solid var(--border);display:flex;align-items:center;gap:12px;z-index:40}
.btn-secondary{padding:10px 16px;border:1.5px solid var(--border);border-radius:var(--radius-sm);background:#fff;color:var(--muted);font-weight:700;font-size:.88rem;cursor:pointer;min-height:44px;min-width:44px;touch-action:manipulation}
.btn-primary{flex:1;padding:12px 20px;background:linear-gradient(135deg,var(--blue),var(--blue-dk));color:#fff;border:none;border-radius:var(--radius-sm);font-weight:800;font-size:.95rem;cursor:pointer;transition:all .15s;min-height:44px;touch-action:manipulation}
.btn-primary:disabled{opacity:.4;cursor:not-allowed}

/* Bilingual Modal */
.lle-dialog{border:none;border-radius:18px;padding:0;box-shadow:0 12px 36px rgba(0,0,0,.25);background:var(--surface);max-width:380px;width:90%;margin:auto}
.lle-dialog::backdrop{background:rgba(15,23,42,.65);backdrop-filter:blur(3px)}
.dlg-content{padding:18px;display:flex;flex-direction:column;gap:10px}
.dlg-header{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding-bottom:8px}
.dlg-badge{font-size:.68rem;font-weight:800;letter-spacing:.05em;color:var(--blue-dk);background:var(--blue-lt);padding:2px 8px;border-radius:12px}
.dlg-close-x{background:none;border:none;font-size:1.2rem;color:#64748b;cursor:pointer;padding:2px 6px;min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px}
.dlg-close-x:hover{background:#f1f5f9;color:#0f172a}
.dlg-word-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:4px}
.dlg-word{font-size:1.5rem;font-weight:900;color:#1e293b}
.dlg-audio-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:20px;padding:4px 12px;font-size:.78rem;font-weight:700;color:#334155;cursor:pointer;min-height:44px;touch-action:manipulation}
.dlg-phonics-row,.dlg-meaning-row{display:flex;flex-direction:column;gap:2px}
.dlg-phonics-label,.dlg-meaning-label{font-size:.70rem;font-weight:800;color:#64748b;text-transform:uppercase}
.dlg-phonics{font-size:1.0rem;font-weight:700;color:#475569}
.dlg-hindi{font-size:1.15rem;font-weight:800;color:var(--blue-dk);line-height:1.4}
.dlg-desc{font-size:.75rem;color:#64748b;line-height:1.4;background:#f8fafc;padding:8px 10px;border-radius:8px}
.dlg-btn{width:100%;padding:10px;background:var(--blue);color:#fff;border:none;border-radius:10px;font-weight:800;font-size:.9rem;cursor:pointer;min-height:44px;touch-action:manipulation}

/* Height-tiered Media Queries for Same-Frame Mobile Viewport Guarantees */
@media (max-height: 700px) {
  /* 16:9 Aspect Ratio (e.g. 360x640) */
  .brand-header { display: none; }
  .mode-bar { display: none; }
  body.assessment-mode .mode-bar { display: flex; }
  .topbar { padding: 4px 10px; gap: 6px; }
  .screen { padding: 4px 8px 56px; min-height: 0; }
  .concept-frame { padding: 8px 10px; margin-bottom: 4px; box-sizing: border-box; }
  .concept-badge { padding: 2px 6px; font-size: 0.65rem; margin-bottom: 3px; }
  .inquiry-title { font-size: 0.88rem; margin-bottom: 3px; line-height: 1.22; }
  .concept-def { font-size: 0.80rem; line-height: 1.35; margin-bottom: 4px; max-height: 80px; overflow-y: auto; }
  .concept-def .lle-text, .concept-def .lle-text-sm { line-height: 1.35 !important; font-size: 0.80rem !important; margin: 2px 0 !important; }
  .connective-hi { font-size: 0.8em; opacity: 0.85; }
  .sim-container { padding: 6px; margin: 4px 0; border-radius: 8px; }
  .sim-readout { padding: 3px 6px; font-size: 0.74rem; margin-bottom: 4px; }
  .sim-canvas { max-height: 92px; }
  .sim-controls { margin-top: 4px; gap: 4px; }
  .preset-bar { display: flex; flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; gap: 6px; justify-content: flex-start; padding: 2px 4px; }
  .preset-btn, .sim-btn { flex-shrink: 0; min-height: 44px; min-width: 44px; padding: 6px 10px; font-size: 0.76rem; touch-action: manipulation; }
  .sim-caption { font-size: 0.66rem; margin-top: 2px; line-height: 1.2; text-align: center; }
  .hint { font-size: 0.64rem; margin: 2px 0; text-align: center; }
  .btn-skip { margin: 2px auto 0; font-size: 0.70rem; min-height: 44px; line-height: 44px; display: inline-flex; align-items: center; justify-content: center; width: 100%; }
  .bottom-bar { padding: 6px 12px; }
  .btn-primary { padding: 10px 16px; min-height: 44px; font-size: 0.90rem; }
}

@media (min-height: 701px) and (max-height: 860px) {
  /* 19.5:9 Aspect Ratio (e.g. 390x844, 393x852) and 20:9 (360x800) */
  .brand-header { padding: 4px 12px; }
  .brand-logo { width: 28px; height: 28px; }
  .brand-name { font-size: 0.75rem; }
  .brand-name-hi { display: none; }
  .brand-tagline { display: none; }
  .mode-bar { display: none; }
  body.assessment-mode .mode-bar { display: flex; }
  .topbar { padding: 6px 12px; gap: 8px; }
  .screen { padding: 6px 12px 60px; min-height: 0; }
  .concept-frame { padding: 10px 12px; margin-bottom: 6px; }
  .inquiry-title { font-size: 0.98rem; margin-bottom: 4px; line-height: 1.3; }
  .concept-def { font-size: 0.84rem; line-height: 1.45; margin-bottom: 6px; max-height: 110px; overflow-y: auto; }
  .concept-def .lle-text, .concept-def .lle-text-sm { line-height: 1.45 !important; font-size: 0.84rem !important; margin: 2px 0 !important; }
  .sim-container { padding: 6px; margin: 6px 0; }
  .sim-readout { padding: 4px 8px; font-size: 0.78rem; margin-bottom: 6px; }
  .sim-canvas { max-height: 115px; }
  .preset-bar { display: flex; flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; gap: 6px; justify-content: flex-start; padding: 2px 4px; }
  .preset-btn, .sim-btn { flex-shrink: 0; min-height: 44px; min-width: 44px; }
  .btn-skip { min-height: 44px; line-height: 44px; display: inline-flex; align-items: center; justify-content: center; }
  .bottom-bar { padding: 8px 14px; }
  .btn-primary { padding: 12px 16px; min-height: 44px; font-size: 0.95rem; }
}

@media (min-height: 861px) {
  /* 20:9 Aspect Ratio (e.g. 412x915) */
  .brand-header { padding: 4px 14px; }
  .brand-logo { width: 30px; height: 30px; }
  .brand-name { font-size: 0.78rem; }
  .topbar { padding: 6px 12px; }
  .screen { padding: 6px 12px 60px; min-height: 0; }
  .concept-frame { padding: 10px 12px; margin-bottom: 6px; box-sizing: border-box; }
  .inquiry-title { font-size: 0.98rem; margin-bottom: 4px; line-height: 1.25; }
  .concept-def { font-size: 0.86rem; line-height: 1.45; margin-bottom: 6px; max-height: 125px; overflow-y: auto; }
  .concept-def .lle-text, .concept-def .lle-text-sm { line-height: 1.45 !important; font-size: 0.86rem !important; margin: 2px 0 !important; }
  .sim-container { padding: 6px; margin: 4px 0; }
  .sim-readout { padding: 5px 8px; font-size: 0.80rem; margin-bottom: 6px; }
  .sim-canvas { max-height: 125px; }
  .preset-bar { display: flex; flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; gap: 6px; justify-content: flex-start; padding: 2px 4px; }
  .preset-btn, .sim-btn { flex-shrink: 0; min-height: 44px; min-width: 44px; }
  .btn-skip { min-height: 44px; line-height: 44px; display: inline-flex; align-items: center; justify-content: center; }
  .bottom-bar { padding: 8px 14px; }
  .btn-primary { padding: 12px 16px; min-height: 44px; font-size: 0.95rem; }
}
</style>
</head>
<body>
<div class="app">
  <div class="brand-header">
    <div class="brand-logo">
      <svg viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="46" fill="#2563eb"/>
        <path d="M50 16L78 78H62L50 48L38 78H22L50 16Z" fill="#ffffff"/>
      </svg>
    </div>
    <div class="brand-info">
      <div class="brand-name">AASHA LEARNING ECOSYSTEM</div>
      <div class="brand-name-hi">आशा लर्निंग इकोसिस्टम • कक्षा 8 गणित (NCERT / Math Matrix)</div>
      <div class="brand-tagline">Chapter 2: Exponents & Powers · Learning and practice (घातांक और घात)</div>
    </div>
  </div>

  <div class="topbar">
    <button class="exit-btn" onclick="App.exit()" title="Exit to start">✕</button>
    <div class="progress-track"><div class="progress-fill" id="progressFill"></div></div>
    <button class="stat" id="assessmentToggleBtn" onclick="App.toggleAssessmentMode()" style="background:#eff6ff;color:var(--blue-dk);border:1px solid #bfdbfe;cursor:pointer;padding:4px 8px;min-height:44px;min-width:44px;display:inline-flex;align-items:center;touch-action:manipulation" title="Toggle 64 Textbook Exercises">🎯 64 Qs</button>
    <span class="stat coins">🪙 <span id="statCoins">0</span></span>
    <span class="stat xp">⭐ <span id="statXp">0</span></span>
    <span class="stat lvl" id="statLvl">Lv 1</span>
    <span class="stat streak" id="statStreakWrap" style="display:none">🔥 <span id="statStreak">0</span></span>
  </div>

  <div class="mode-bar" id="modeBar">
    <button class="mode-btn active" id="tabBtnConcept" onclick="App.switchTab('concept')">📖 Concept Labs</button>
    <button class="mode-btn" id="tabBtnWarmup" onclick="App.switchTab('warmup')">🎯 Warm-Up (18)</button>
    <button class="mode-btn" id="tabBtnDeepDive" onclick="App.switchTab('deep_dive')">🚀 Deep Dive (28)</button>
    <button class="mode-btn" id="tabBtnBoss" onclick="App.switchTab('boss')">👑 Boss (18)</button>
  </div>

  <div class="screen" id="screen">
    <!-- Step Container for Concept Nodes 1-5 -->
    <div id="stepContainer" style="width:100%">
      <div id="viewIntro" class="step-view" style="display:none;width:100%"></div>
      <div id="viewConcept" class="step-view" style="display:none;width:100%">
        <div class="concept-frame">
          <span class="concept-badge" id="conceptBadge">Node 1 · Concept & Dual-View Lab</span>
          <h2 class="inquiry-title" id="conceptTitle"></h2>
          <div class="concept-def" id="conceptDef"></div>
          
          <!-- Simulation Container with <aasha-sim> -->
          <div class="sim-container">
            <aasha-sim id="conceptSim">
              <div class="sim-readout" id="simReadout">Loading interactive engine...</div>
              <canvas id="conceptCanvas" class="sim-canvas" width="480" height="130"></canvas>
              <div class="sim-controls" id="conceptControls"></div>
            </aasha-sim>
            <div class="sim-caption" id="conceptCaption"></div>
          </div>
          <div class="hint">💡 Tip: Tap vocabulary words underlined with dots to see Hindi definitions!</div>
          <a href="javascript:void(0)" class="btn-skip" onclick="App.skipInteractive()">Skip this activity →</a>
        </div>
      </div>
      <div id="viewWorked" class="step-view" style="display:none;width:100%"></div>
      <div id="viewQuiz" class="step-view" style="display:none;width:100%"></div>
      <div id="viewProgress" class="step-view" style="display:none;width:100%"></div>
    </div>

    <!-- Assessment Container (All 64 Questions Statically Embedded) -->
    <div id="assessmentContainer" style="display:none;width:100%">
      <div class="assessment-section" id="section-warmup">
        <div class="assessment-header warmup">
          <span class="assessment-level-badge warmup">Level 1: Warm-up Drills (18 Questions) (+5 XP each)</span>
          <p style="font-size:0.84rem;color:var(--muted);margin-top:4px">Powers of Negative Numbers, Prime Bases & Reciprocal Laws</p>
        </div>
${warmupHtml}
      </div>

      <div class="assessment-section" id="section-deep_dive">
        <div class="assessment-header deepdive">
          <span class="assessment-level-badge deepdive">Level 2: Deep Dive Challenge (28 Questions) (+10 XP each)</span>
          <p style="font-size:0.84rem;color:var(--muted);margin-top:4px">Compound Brackets, Unknown Multipliers/Divisors, Equations & Scientific Notations</p>
        </div>
${deepdiveHtml}
      </div>

      <div class="assessment-section" id="section-boss">
        <div class="assessment-header boss">
          <span class="assessment-level-badge boss">Level 3: Boss Arena & HOTS (18 Questions) (+20 XP each)</span>
          <p style="font-size:0.84rem;color:var(--muted);margin-top:4px">12 Textbook MCQs, HOTS Lunar Craft, Celestial Masses & Spinner Tournament</p>
        </div>
${bossHtml}
      </div>
    </div>
  </div>

  <div class="bottom-bar" id="bottomBar">
    <button class="btn-secondary" id="backBtn" onclick="App.back()" title="Previous Step">← Back</button>
    <button class="btn-primary" id="continueBtn" onclick="App.onContinue()">Continue →</button>
  </div>
</div>

<!-- LLE Bilingual Modal -->
<dialog id="wordDialog" class="lle-dialog">
  <div class="dlg-content">
    <div class="dlg-header">
      <span class="dlg-badge">AASHA LLE BILINGUAL BRIDGE</span>
      <button class="dlg-close-x" onclick="document.getElementById('wordDialog').close();document.getElementById('wordDialog').style.display='none'">✕</button>
    </div>
    <div class="dlg-word-row">
      <span class="dlg-word" id="dlgWord">Word</span>
      <button class="dlg-audio-btn" id="dlgAudioBtn" onclick="speakCurrentWord()" title="Listen to pronunciation">🔊 बोलें</button>
    </div>
    <div class="dlg-phonics-row">
      <span class="dlg-phonics-label">उच्चारण (Phonics):</span>
      <span class="dlg-phonics" id="dlgPhonics">—</span>
    </div>
    <div class="dlg-meaning-row">
      <span class="dlg-meaning-label">सरल अर्थ (Meaning):</span>
      <span class="dlg-hindi" id="dlgHindi">—</span>
    </div>
    <div class="dlg-desc" id="dlgDesc">Aasha Universal Teaching Vocabulary (आशा शिक्षण शब्दावली)</div>
    <button class="dlg-btn" onclick="document.getElementById('wordDialog').close();document.getElementById('wordDialog').style.display='none'">ठीक है (Got It)</button>
  </div>
</dialog>

<script>
// ═══ LLE BILINGUAL VOCABULARY & CONNECTIVES ═══
${connSnippet}

${wmSnippet}

if (typeof window !== 'undefined') {
  window.WM = WM;
}

${mathAndRtSnippet}

// ═══ WEB AUDIO SYNTHESIZER ═══
var audioCtx = null;
function playTone(type) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    var now = audioCtx.currentTime;

    if (type === 'tap') {
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
    } else if (type === 'correct') {
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now); osc.stop(now + 0.25);
    } else if (type === 'wrong') {
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(196, now + 0.1);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now); osc.stop(now + 0.25);
    } else if (type === 'levelup') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.09);
      osc.frequency.setValueAtTime(659.25, now + 0.18);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
    }
  } catch(e){}
}

// ═══ CELEBRATORY CONFETTI ENGINE ═══
function fireConfetti(count) {
  var canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var ctx = canvas.getContext('2d');
  var particles = [];
  var colors = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#dc2626'];
  for (var i = 0; i < (count || 30); i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.8) * 14,
      size: Math.random() * 7 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1
    });
  }
  var anim = setInterval(function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var alive = false;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35;
      p.alpha -= 0.02;
      if (p.alpha > 0) {
        alive = true;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    }
    if (!alive) {
      clearInterval(anim);
      canvas.remove();
    }
  }, 20);
}

// ═══ 6 RICH INTERACTIVE MANIPULATIVES ═══

// 1. Exponential Doubling & Halving Visualizer with Sign Parity (F02 / F24)
function drawDoublingSim(canvas, folds, baseSign) {
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = parseFloat(canvas.style.width) || canvas.width, h = parseFloat(canvas.style.height) || canvas.height;
  ctx.clearRect(0, 0, w, h);

  var baseVal = baseSign * 2;
  var layers = Math.pow(2, folds);
  var value = Math.pow(baseVal, folds);
  var isEven = (folds % 2 === 0);

  ctx.fillStyle = '#1e3a5f'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
  var signLabel = (baseSign < 0) ? (isEven ? 'Even Power: Positive (+)' : 'Odd Power: Negative (-)') : 'Positive Base';
  ctx.fillText('Power: (' + baseVal + ')^' + folds + ' = ' + value + '  (' + signLabel + ')', 14, 18);

  var startX = 30, baseY = h - 20, maxH = h - 50;
  var stackH = Math.min(maxH, 4 + folds * 9);
  var layerColor = (baseSign < 0 && !isEven) ? '#dc2626' : '#2563eb';
  ctx.fillStyle = layerColor;
  ctx.fillRect(startX, baseY - stackH, 100, stackH);
  ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1;
  ctx.strokeRect(startX, baseY - stackH, 100, stackH);

  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  for (var i = 1; i <= Math.min(folds, 8); i++) {
    var ly = baseY - (i * stackH) / folds;
    ctx.beginPath(); ctx.moveTo(startX, ly); ctx.lineTo(startX + 100, ly); ctx.stroke();
  }

  var compObj = folds === 0 ? 'Single Sheet (0.1 mm)' : (folds <= 3 ? 'Cardboard Layer' : (folds <= 5 ? 'Dictionary Spine' : (folds <= 7 ? 'Door Thickness' : 'Tower Height!')));
  ctx.fillStyle = '#0f172a'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Layers: ' + layers + ' sheets', 150, 42);
  ctx.fillStyle = '#475569'; ctx.font = '10px sans-serif';
  ctx.fillText('Equivalent: ' + compObj, 150, 60);

  var cx = w - 40, cy = 50;
  ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fillStyle = (baseSign < 0 && !isEven) ? '#fee2e2' : '#dcfce7';
  ctx.fill();
  ctx.strokeStyle = (baseSign < 0 && !isEven) ? '#dc2626' : '#16a34a'; ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = (baseSign < 0 && !isEven) ? '#dc2626' : '#16a34a';
  ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(value > 0 ? '+' : (value < 0 ? '-' : '0'), cx, cy + 5);
}

// 2. Mechanical Reciprocal Inverter Machine (F01 / F02)
function drawInverterSim(canvas, base, exp) {
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = parseFloat(canvas.style.width) || canvas.width, h = parseFloat(canvas.style.height) || canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = '#1e3a5f'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
  var signStr = exp < 0 ? 'Negative Exponent (Reciprocal Inversion)' : (exp === 0 ? 'Zero Exponent (Unit Identity)' : 'Positive Exponent');
  ctx.fillText('Expression: ' + base + '^(' + exp + ') · ' + signStr, 14, 18);

  var absExp = Math.abs(exp);
  var pVal = Math.pow(base, absExp);
  var readout = exp < 0 ? '1 / ' + base + '^' + absExp + ' = 1/' + pVal : base + '^' + exp + ' = ' + pVal;
  if (exp === 0) readout = base + '^0 = 1';

  var cx = 70, cy = 68;
  ctx.save(); ctx.translate(cx, cy);
  var flipAngle = exp < 0 ? Math.PI : 0;
  ctx.rotate(flipAngle);
  ctx.fillStyle = '#eff6ff'; ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1e40af'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(exp < 0 ? '1/' + base : base + '/1', 0, 4);
  ctx.restore();

  ctx.fillStyle = '#0f172a'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Evaluated Form: ' + readout, 120, 50);

  ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif';
  var stepText = exp < 0 ? 'Step: Divide by ' + base + ' repeatedly ' + absExp + ' times' : 'Step: Multiply by ' + base + ' repeatedly ' + absExp + ' times';
  if (exp === 0) stepText = 'Step: Identity unit element (multiplicative neutral)';
  ctx.fillText(stepText, 120, 72);
}

// 3. Factor Merger & Particle Evaporation Cancellation Arena (F04 PhET / F02)
function drawLawsSim(canvas, base, m, n, op) {
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = parseFloat(canvas.style.width) || canvas.width, h = parseFloat(canvas.style.height) || canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = '#1e3a5f'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
  var titleStr = op === 'mul' ? 'Product Law: ' + base + '^' + m + ' × ' + base + '^' + n + ' = ' + base + '^(' + m + '+' + n + ')' : 'Quotient Law: ' + base + '^' + m + ' ÷ ' + base + '^' + n + ' = ' + base + '^(' + m + '-' + n + ')';
  ctx.fillText(titleStr, 14, 18);

  var y1 = 44, y2 = 82;
  var startX = 26;

  if (op === 'mul') {
    ctx.fillStyle = '#2563eb';
    for (var i = 0; i < m; i++) {
      ctx.beginPath(); ctx.arc(startX + i * 24, y1, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(base, startX + i * 24, y1 + 3);
      ctx.fillStyle = '#2563eb';
    }
    ctx.fillStyle = '#7c3aed'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText('+', startX + m * 24 + 8, y1 + 4);
    var startB = startX + m * 24 + 24;
    ctx.fillStyle = '#16a34a';
    for (var j = 0; j < n; j++) {
      ctx.beginPath(); ctx.arc(startB + j * 24, y1, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(base, startB + j * 24, y1 + 3);
      ctx.fillStyle = '#16a34a';
    }
    ctx.fillStyle = '#0f172a'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Combined Factors: ' + (m + n) + ' factors of ' + base + ' = ' + base + '^' + (m + n), startX, y2 + 8);
  } else {
    ctx.fillStyle = '#2563eb';
    for (var i = 0; i < m; i++) {
      var isCancelled = i < n;
      ctx.fillStyle = isCancelled ? '#94a3b8' : '#2563eb';
      ctx.beginPath(); ctx.arc(startX + i * 26, y1, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(base, startX + i * 26, y1 + 3);
    }
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(startX - 10, y1 + 16); ctx.lineTo(startX + Math.max(m, n) * 26, y1 + 16); ctx.stroke();

    for (var j = 0; j < n; j++) {
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath(); ctx.arc(startX + j * 26, y2, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(base, startX + j * 26, y2 + 3);

      ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(startX + j * 26 - 6, y1 - 6); ctx.lineTo(startX + j * 26 + 6, y2 + 6); ctx.stroke();
    }

    var rem = m - n;
    ctx.fillStyle = '#15803d'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Surviving: ' + rem + ' factors = ' + base + '^' + rem + (rem === 0 ? ' = 1' : ''), startX + Math.max(m, n) * 26 + 16, y1 + 18);
  }
}

// 4. Exponential Scale Balance (F01 Escape Run - Weighing Balance)
function drawEquationSim(canvas, base, userX, targetP) {
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = parseFloat(canvas.style.width) || canvas.width, h = parseFloat(canvas.style.height) || canvas.height;
  ctx.clearRect(0, 0, w, h);

  var cx = w / 2, cy = 68;
  var diff = userX - targetP;
  var angle = Math.max(-0.25, Math.min(0.25, -diff * 0.12));

  ctx.fillStyle = '#64748b';
  ctx.beginPath(); ctx.moveTo(cx - 20, cy + 32); ctx.lineTo(cx + 20, cy + 32); ctx.lineTo(cx, cy); ctx.fill();

  var arm = 95;
  var x1 = cx - Math.cos(angle) * arm, y1 = cy - Math.sin(angle) * arm;
  var x2 = cx + Math.cos(angle) * arm, y2 = cy + Math.sin(angle) * arm;
  var isBal = (diff === 0);
  ctx.strokeStyle = isBal ? '#16a34a' : '#2563eb'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

  ctx.fillStyle = '#eff6ff'; ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 1.5;
  ctx.fillRect(x1 - 32, y1 + 10, 64, 24); ctx.strokeRect(x1 - 32, y1 + 10, 64, 24);
  ctx.fillStyle = '#1e3a5f'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(base + '^(2x-1) [x=' + userX + ']', x1, y1 + 25);

  ctx.fillStyle = '#f0fdf4'; ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 1.5;
  ctx.fillRect(x2 - 32, y2 + 10, 64, 24); ctx.strokeRect(x2 - 32, y2 + 10, 64, 24);
  ctx.fillStyle = '#15803d'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('32 = ' + base + '^' + (2 * targetP - 1), x2, y2 + 25);

  ctx.fillStyle = isBal ? '#16a34a' : '#dc2626';
  ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
  var statusText = isBal ? '✓ Equilibrium Reached! 2x - 1 = 5 ⟹ x = 3' : (diff < 0 ? 'LHS Lighter: Increase x to add power' : 'LHS Heavier: Decrease x to balance');
  ctx.fillText(statusText, cx, 18);
}

// 5. Cosmic & Subatomic Scale Zoomer (PhET / F02)
function drawZoomerSim(canvas, pIndex) {
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = parseFloat(canvas.style.width) || canvas.width, h = parseFloat(canvas.style.height) || canvas.height;
  ctx.clearRect(0, 0, w, h);

  var scales = [
    { p: -19, label: 'Electron Charge', val: '1.6 × 10^(-19) C', icon: '⚡' },
    { p: -10, label: 'Hydrogen Atom', val: '1.0 × 10^(-10) m', icon: '⚛️' },
    { p: -7, label: 'Bacterium', val: '5.0 × 10^(-7) m', icon: '🦠' },
    { p: -5, label: 'Plant Cell', val: '1.275 × 10^(-5) m', icon: '🌱' },
    { p: 0, label: 'Human Height', val: '1.7 × 10^0 m', icon: '🧍' },
    { p: 8, label: 'Speed of Light', val: '3.0 × 10^8 m/s', icon: '🚀' },
    { p: 13, label: 'Pluto Orbit', val: '8.02 × 10^13 m', icon: '🪐' },
    { p: 30, label: 'Mass of Sun', val: '1.989 × 10^30 kg', icon: '☀️' }
  ];

  var item = scales[Math.max(0, Math.min(scales.length - 1, pIndex))];
  ctx.fillStyle = '#1e3a5f'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Scale of the Universe: ' + item.label + ' ' + item.icon, 14, 18);

  ctx.fillStyle = '#0f172a'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(item.val, w / 2, 54);

  var rx = 30, rw = w - 60, ry = 80;
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + rw, ry); ctx.stroke();

  for (var i = 0; i < scales.length; i++) {
    var tx = rx + (i * rw) / (scales.length - 1);
    ctx.strokeStyle = (i === pIndex) ? '#2563eb' : '#94a3b8';
    ctx.lineWidth = (i === pIndex) ? 3 : 1.5;
    ctx.beginPath(); ctx.moveTo(tx, ry - 6); ctx.lineTo(tx, ry + 6); ctx.stroke();
  }

  var activeX = rx + (pIndex * rw) / (scales.length - 1);
  ctx.fillStyle = '#2563eb';
  ctx.beginPath(); ctx.arc(activeX, ry, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(item.p, activeX, ry + 3);
}

// 6. Maths Lab Dual-Spinner Engine (Textbook Page 3 - F01/F19)
function drawSpinnerSim(canvas, baseVal, expVal, spinAngle) {
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = parseFloat(canvas.style.width) || canvas.width, h = parseFloat(canvas.style.height) || canvas.height;
  ctx.clearRect(0, 0, w, h);

  var r = 36;
  var c1x = w / 4 + 10, c1y = 52;
  ctx.save(); ctx.translate(c1x, c1y); ctx.rotate(spinAngle);
  ctx.fillStyle = '#eff6ff'; ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  for (var i = 0; i < 10; i++) {
    var a = (i * Math.PI * 2) / 10;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = '#dc2626';
  ctx.beginPath(); ctx.moveTo(c1x, c1y - r - 3); ctx.lineTo(c1x - 5, c1y - r - 11); ctx.lineTo(c1x + 5, c1y - r - 11); ctx.fill();
  ctx.fillStyle = '#1e3a5f'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Base: ' + baseVal, c1x, c1y + r + 16);

  var c2x = (3 * w) / 4 - 10, c2y = 52;
  ctx.save(); ctx.translate(c2x, c2y); ctx.rotate(-spinAngle * 1.3);
  ctx.fillStyle = '#f5f3ff'; ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  for (var j = 0; j < 5; j++) {
    var b = (j * Math.PI * 2) / 5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(b) * r, Math.sin(b) * r); ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = '#dc2626';
  ctx.beginPath(); ctx.moveTo(c2x, c2y - r - 3); ctx.lineTo(c2x - 5, c2y - r - 11); ctx.lineTo(c2x + 5, c2y - r - 11); ctx.fill();
  ctx.fillStyle = '#7c3aed'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Power: ' + expVal, c2x, c2y + r + 16);

  ctx.fillStyle = '#0f172a'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
  var pTotal = Math.pow(baseVal, expVal);
  ctx.fillText(baseVal + '^' + expVal + ' = ' + pTotal, w / 2, 18);
}

// ═══ MASTER APPLICATION CONTROLLER ═══
var STORAGE_KEY = 'aasha_exponents_powers_v6';
var NODES = ${JSON.stringify(NODES_JSON, null, 2)};
var WE = ${JSON.stringify(WE_JSON, null, 2)};

var App = {
  activeTab: 'concept',
  nIdx: 0, sIdx: 0, coins: 0, xp: 0, level: 1, streak: 0,
  selOpt: null, answered: false,
  weStepIdx: 0, weChecked: false, weCheckAnswered: false, _weCheckRendered: false,
  weStepCheckPassed: false, weStepCheckAnswered: false, selStepOpt: null,
  _weCheckOpts: null, _weStepCheckOpts: null, _qOpts: null, retryTimer: null,

  _doublingFolds: 3, _doublingSign: 1,
  _invBase: 2, _invExp: -3,
  _lawBase: 2, _lawM: 3, _lawN: 4, _lawOp: 'mul',
  _matBase: 2, _matM: 3, _matN: 2,
  _eqBase: 2, _eqX: 1, _eqTarget: 3,
  _zoomIdx: 3,
  _spinBase: 3, _spinExp: 4, _spinAngle: 0, _isSpinning: false,

  _hintState: {},

  init: function() {
    this.load();
    this.render();
    this.updateStats();
  },

  load: function() {
    try {
      var s = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (s.nIdx !== undefined && s.nIdx >= 0 && s.nIdx < NODES.length) {
        this.nIdx = s.nIdx;
        this.sIdx = (s.sIdx >= 0 && s.sIdx < NODES[this.nIdx].steps.length) ? s.sIdx : 0;
        this.coins = s.coins || 0; this.xp = s.xp || 0;
        this.level = s.level || 1; this.streak = s.streak || 0;
      }
    } catch(e){}
  },

  save: function() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        nIdx: this.nIdx, sIdx: this.sIdx,
        coins: this.coins, xp: this.xp,
        level: this.level, streak: this.streak
      }));
    } catch(e){}
  },

  updateStats: function() {
    document.getElementById('statCoins').textContent = this.coins;
    document.getElementById('statXp').textContent = this.xp;
    document.getElementById('statLvl').textContent = 'Lv ' + this.level;
    var sw = document.getElementById('statStreakWrap');
    if (this.streak >= 2) {
      sw.style.display = 'inline-flex';
      document.getElementById('statStreak').textContent = this.streak;
    } else {
      sw.style.display = 'none';
    }

    var totalSteps = 0, currentProgress = 0;
    for (var i = 0; i < NODES.length; i++) {
      totalSteps += NODES[i].steps.length;
      if (i < this.nIdx) currentProgress += NODES[i].steps.length;
      else if (i === this.nIdx) currentProgress += this.sIdx;
    }
    var pct = Math.min(100, Math.round((currentProgress / totalSteps) * 100));
    document.getElementById('progressFill').style.width = pct + '%';
  },

  awardXP: function(amount) {
    this.xp += amount;
    this.coins += Math.ceil(amount / 2);
    var newLvl = Math.floor(this.xp / 100) + 1;
    if (newLvl > this.level) {
      this.level = newLvl;
      playTone('levelup');
      fireConfetti(45);
    }
    this.save();
    this.updateStats();
  },

  switchTab: function(tab) {
    this.activeTab = tab;
    var tabs = ['concept', 'warmup', 'deep_dive', 'boss'];
    tabs.forEach(function(t) {
      var btn = document.getElementById('tabBtn' + (t === 'concept' ? 'Concept' : (t === 'warmup' ? 'Warmup' : (t === 'deep_dive' ? 'DeepDive' : 'Boss'))));
      if (btn) {
        if (t === tab) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    });

    var stepContainer = document.getElementById('stepContainer');
    var assessmentContainer = document.getElementById('assessmentContainer');
    var bottomBar = document.getElementById('bottomBar');

    if (tab === 'concept') {
      document.body.classList.remove('assessment-mode');
      stepContainer.style.display = 'block';
      assessmentContainer.style.display = 'none';
      bottomBar.style.display = 'flex';
      this.render();
    } else {
      document.body.classList.add('assessment-mode');
      stepContainer.style.display = 'none';
      assessmentContainer.style.display = 'block';
      bottomBar.style.display = 'none';

      var secId = (tab === 'warmup') ? 'section-warmup' : (tab === 'deep_dive' ? 'section-deep_dive' : 'section-boss');
      var secEl = document.getElementById(secId);
      if (secEl) secEl.scrollIntoView({ behavior: 'smooth' });
    }
  },

  toggleAssessmentMode: function() {
    if (this.activeTab === 'concept') {
      this.switchTab('warmup');
    } else {
      this.switchTab('concept');
    }
  },

  fitCanvas: function(canvas) {
    if (!canvas) return;
    var rect = canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    var w = rect.width || 440;
    var h = rect.height || 120;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);
  },

  render: function() {
    if (this.activeTab !== 'concept') return;
    var node = NODES[this.nIdx];
    var step = node.steps[this.sIdx];

    ['viewIntro', 'viewConcept', 'viewWorked', 'viewQuiz', 'viewProgress'].forEach(function(v) {
      document.getElementById(v).style.display = 'none';
    });

    var btnBack = document.getElementById('backBtn');
    var btnCont = document.getElementById('continueBtn');
    btnBack.disabled = (this.nIdx === 0 && this.sIdx === 0);

    if (step.t === 'intro') {
      var vi = document.getElementById('viewIntro');
      vi.innerHTML = '<div class="concept-frame" style="text-align:center;padding:26px 16px">' +
        '<span class="concept-badge">Node ' + (this.nIdx + 1) + ' · Hook & Real-World Discovery</span>' +
        '<h2 class="inquiry-title">' + rt(step.title, true) + '</h2>' +
        '<div style="font-size:36px;text-align:center;margin:12px 0">' + step.icon + '</div>' +
        rt(step.sub) +
        '<div style="display:inline-block;padding:6px 14px;background:var(--blue-lt);color:var(--blue-dk);border-radius:20px;font-weight:800;font-size:.8rem;margin-top:12px">Practice activities • Textbook coverage requires source review</div>' +
        '</div>';
      vi.style.display = 'block';
      btnCont.disabled = false;
      btnCont.textContent = 'Explore Concept →';
    } else if (step.t === 'text') {
      var vc = document.getElementById('viewConcept');
      document.getElementById('conceptBadge').textContent = 'Node ' + (this.nIdx + 1) + ' · Concept & Dual-View Lab';
      document.getElementById('conceptTitle').textContent = step.title;
      document.getElementById('conceptDef').innerHTML = rt(step.text);
      document.getElementById('conceptCaption').textContent = step.caption || '';
      vc.style.display = 'block';
      this.mountSim(step.simType);
      btnCont.disabled = false;
      btnCont.textContent = 'See Worked Example →';
    } else if (step.t === 'worked') {
      var vw = document.getElementById('viewWorked');
      var weData = WE[step.we];
      this._weCheckRendered = true;
      var curStep = weData.steps[this.weStepIdx] || weData.steps[0];
      
      vw.innerHTML = '<div class="we-card">' +
        '<span class="we-tag">' + weData.title + ' (Step ' + (this.weStepIdx + 1) + '/' + weData.steps.length + ')</span>' +
        '<div class="we-question">' + weData.q + '</div>' +
        '<div class="we-step">' +
        '<div class="we-step-title">' + curStep.title + '</div>' +
        '<div class="we-step-text">' + rt(curStep.text) + '</div>' +
        '</div>' +
        '<div class="quiz-card" style="margin-top:12px">' +
        '<div class="quiz-question">' + curStep.check.q + '</div>' +
        '<div class="quiz-opts-container" id="weOptsContainer"></div>' +
        '<div class="quiz-feedback" id="weFeedback"></div>' +
        '</div>' +
        '</div>';

      var oc = document.getElementById('weOptsContainer');
      var opts = curStep.check.opts.slice();
      opts.sort(function() { return Math.random() - 0.5; });
      opts.forEach(function(opt) {
        var optEl = document.createElement('div');
        optEl.className = 'quiz-opt';
        optEl.innerHTML = '<div class="quiz-radio"></div><span class="quiz-opt-text">' + opt.t + '</span>';
        optEl.onclick = function() { App.answerWeCheck(optEl, opt.c, opt.m, curStep.check.exp); };
        oc.appendChild(optEl);
      });

      vw.style.display = 'block';
      btnCont.disabled = !this.weStepCheckPassed;
      btnCont.textContent = (this.weStepIdx < weData.steps.length - 1) ? 'Next Step →' : 'Test Understanding →';
    } else if (step.t === 'quiz') {
      var vq = document.getElementById('viewQuiz');
      vq.innerHTML = '<div class="quiz-card">' +
        '<span class="concept-badge">Node ' + (this.nIdx + 1) + ' Concept Check</span>' +
        '<div class="quiz-question">' + step.q.q + '</div>' +
        '<div class="quiz-opts-container" id="quizOptsContainer"></div>' +
        '<div class="quiz-feedback" id="quizFeedback"></div>' +
        '</div>';

      var qoc = document.getElementById('quizOptsContainer');
      var qOpts = step.q.opts.slice();
      qOpts.sort(function() { return Math.random() - 0.5; });
      qOpts.forEach(function(opt) {
        var optEl = document.createElement('div');
        optEl.className = 'quiz-opt';
        optEl.innerHTML = '<div class="quiz-radio"></div><span class="quiz-opt-text">' + opt.t + '</span>';
        optEl.onclick = function() { App.answerNodeQuiz(optEl, opt.c, opt.m, step.q.exp); };
        qoc.appendChild(optEl);
      });

      vq.style.display = 'block';
      btnCont.disabled = !this.answered;
      btnCont.textContent = 'Complete Node →';
    } else if (step.t === 'progress') {
      var vp = document.getElementById('viewProgress');
      vp.innerHTML = '<div class="concept-frame" style="text-align:center">' +
        '<div style="font-size:44px;margin-bottom:10px">🎉</div>' +
        '<h2 class="inquiry-title">' + step.summary + '</h2>' +
        '<p style="font-size:0.90rem;color:var(--muted);margin:8px 0">Great job! You earned +25 XP and coins for mastering this node.</p>' +
        '</div>';
      vp.style.display = 'block';
      btnCont.disabled = false;
      btnCont.textContent = (this.nIdx < NODES.length - 1) ? 'Start Next Node →' : 'Finish Chapter 🚀';
    }

    this.updateStats();
  },

  mountSim: function(type) {
    var canvas = document.getElementById('conceptCanvas');
    var ctrl = document.getElementById('conceptControls');
    var readout = document.getElementById('simReadout');
    if (!canvas || !ctrl) return;
    this.fitCanvas(canvas);

    if (type === 'doubling') {
      drawDoublingSim(canvas, this._doublingFolds, this._doublingSign);
      readout.textContent = 'Base (' + (this._doublingSign * 2) + ')^' + this._doublingFolds + ' = ' + Math.pow(this._doublingSign * 2, this._doublingFolds);
      ctrl.innerHTML = '<div class="preset-bar">' +
        '<button class="preset-btn" onclick="App.setDoubling(1, 1)">2^1 = 2</button>' +
        '<button class="preset-btn" onclick="App.setDoubling(3, 1)">2^3 = 8</button>' +
        '<button class="preset-btn" onclick="App.setDoubling(5, 1)">2^5 = 32</button>' +
        '<button class="preset-btn" onclick="App.setDoubling(3, -1)">(-2)^3 = -8</button>' +
        '<button class="preset-btn" onclick="App.setDoubling(4, -1)">(-2)^4 = +16</button>' +
        '</div>';
    } else if (type === 'inverter') {
      drawInverterSim(canvas, this._invBase, this._invExp);
      readout.textContent = this._invBase + '^(' + this._invExp + ') = ' + (this._invExp < 0 ? '1/' + Math.pow(this._invBase, -this._invExp) : Math.pow(this._invBase, this._invExp));
      ctrl.innerHTML = '<div class="preset-bar">' +
        '<button class="preset-btn" onclick="App.setInverter(2, -3)">2^(-3) = 1/8</button>' +
        '<button class="preset-btn" onclick="App.setInverter(3, -2)">3^(-2) = 1/9</button>' +
        '<button class="preset-btn" onclick="App.setInverter(5, -1)">5^(-1) = 1/5</button>' +
        '<button class="preset-btn" onclick="App.setInverter(2, 3)">2^3 = 8</button>' +
        '</div>';
    } else if (type === 'laws') {
      drawLawsSim(canvas, this._lawBase, this._lawM, this._lawN, this._lawOp);
      readout.textContent = this._lawOp === 'mul' ? 'Product: 2^' + this._lawM + ' × 2^' + this._lawN + ' = 2^' + (this._lawM + this._lawN) : 'Quotient: 2^' + this._lawM + ' ÷ 2^' + this._lawN + ' = 2^' + (this._lawM - this._lawN);
      ctrl.innerHTML = '<div class="sim-controls" style="flex-direction:row;justify-content:center">' +
        '<button class="sim-btn ' + (this._lawOp === 'mul' ? 'active' : '') + '" onclick="App.setLawMul()">Multiply (Product Law)</button>' +
        '<button class="sim-btn ' + (this._lawOp === 'div' ? 'active' : '') + '" onclick="App.setLawDiv()">Divide (Quotient Law)</button>' +
        '</div>';
    } else if (type === 'matrix') {
      drawZoomerSim(canvas, this._zoomIdx);
      readout.textContent = 'Scale Zoomer: Powers of 10 in Nature';
      ctrl.innerHTML = '<div class="sim-controls" style="flex-direction:row;justify-content:center;gap:10px">' +
        '<button class="sim-btn" onclick="App.adjustZoom(-1)">🔍 Zoom Microscopic (-)</button>' +
        '<button class="sim-btn" onclick="App.adjustZoom(1)">🔭 Zoom Cosmic (+)</button>' +
        '</div>';
    } else if (type === 'equation') {
      drawEquationSim(canvas, this._eqBase, this._eqX, this._eqTarget);
      readout.textContent = 'Tune x to balance: 2^(2x-1) = 32';
      ctrl.innerHTML = '<div class="sim-controls" style="flex-direction:row;justify-content:center;gap:10px">' +
        '<button class="sim-btn" onclick="App.adjustEqX(-1)">Decrease x (-1)</button>' +
        '<button class="sim-btn" onclick="App.adjustEqX(1)">Increase x (+1)</button>' +
        '</div>';
    } else if (type === 'spinner') {
      drawSpinnerSim(canvas, this._spinBase, this._spinExp, this._spinAngle);
      readout.textContent = 'Maths Lab Dual-Spinners: Spinner A (' + this._spinBase + ') × Spinner B (' + this._spinExp + ')';
      ctrl.innerHTML = '<div class="sim-controls" style="flex-direction:row;justify-content:center">' +
        '<button class="sim-btn" onclick="App.spinSpinners()">🎲 Spin Dual-Spinners</button>' +
        '</div>';
    }
  },

  setDoubling: function(folds, sign) {
    this._doublingFolds = folds; this._doublingSign = sign;
    drawDoublingSim(document.getElementById('conceptCanvas'), folds, sign);
    document.getElementById('simReadout').textContent = 'Base (' + (sign * 2) + ')^' + folds + ' = ' + Math.pow(sign * 2, folds);
    playTone('tap');
  },

  setInverter: function(b, e) {
    this._invBase = b; this._invExp = e;
    drawInverterSim(document.getElementById('conceptCanvas'), b, e);
    document.getElementById('simReadout').textContent = b + '^(' + e + ') = ' + (e < 0 ? '1/' + Math.pow(b, -e) : Math.pow(b, e));
    playTone('tap');
  },

  setLawMul: function() {
    this._lawOp = 'mul';
    this.mountSim('laws');
    playTone('tap');
  },

  setLawDiv: function() {
    this._lawOp = 'div';
    this.mountSim('laws');
    playTone('tap');
  },

  adjustZoom: function(delta) {
    this._zoomIdx = Math.max(0, Math.min(7, this._zoomIdx + delta));
    drawZoomerSim(document.getElementById('conceptCanvas'), this._zoomIdx);
    playTone('tap');
  },

  adjustEqX: function(delta) {
    this._eqX += delta;
    drawEquationSim(document.getElementById('conceptCanvas'), this._eqBase, this._eqX, this._eqTarget);
    if (this._eqX === this._eqTarget) {
      playTone('correct');
      fireConfetti(30);
    } else {
      playTone('tap');
    }
  },

  spinSpinners: function() {
    if (this._isSpinning) return;
    this._isSpinning = true;
    playTone('tap');
    var canvas = document.getElementById('conceptCanvas');
    var self = this;
    var duration = 1200;
    var start = Date.now();
    var anim = function() {
      var now = Date.now();
      var elapsed = now - start;
      if (elapsed < duration) {
        self._spinAngle += 0.35 * (1 - elapsed / duration);
        drawSpinnerSim(canvas, self._spinBase, self._spinExp, self._spinAngle);
        requestAnimationFrame(anim);
      } else {
        self._isSpinning = false;
        self._spinBase = Math.floor(Math.random() * 10) + 1;
        self._spinExp = Math.floor(Math.random() * 5) + 1;
        drawSpinnerSim(canvas, self._spinBase, self._spinExp, self._spinAngle);
        playTone('correct');
        document.getElementById('simReadout').textContent = 'Result: ' + self._spinBase + '^' + self._spinExp + ' = ' + Math.pow(self._spinBase, self._spinExp);
      }
    };
    requestAnimationFrame(anim);
  },

  skipInteractive: function() {
    this.onContinue();
  },

  answerWeCheck: function(optEl, isCorrect, misconception, explanation) {
    var fb = document.getElementById('weFeedback');
    var opts = document.querySelectorAll('#weOptsContainer .quiz-opt');
    for (var i = 0; i < opts.length; i++) {
      opts[i].classList.remove('selected', 'correct', 'wrong');
      opts[i].style.pointerEvents = 'none';
    }
    if (isCorrect) {
      optEl.classList.add('correct');
      fb.innerHTML = '<div class="feedback ok">✓ Correct! ' + (explanation || '') + '</div>';
      playTone('correct');
      this.weStepCheckPassed = true;
      document.getElementById('continueBtn').disabled = false;
    } else {
      optEl.classList.add('wrong');
      var mHtml = misconception ? '<div class="misconception">' + rt('⚠ ' + misconception, true) + '</div>' : '';
      fb.innerHTML = '<div class="feedback fail">✗ Review carefully: ' + mHtml + '</div>';
      playTone('wrong');
      setTimeout(function() {
        for (var i = 0; i < opts.length; i++) opts[i].style.pointerEvents = 'auto';
      }, 900);
    }
  },

  answerNodeQuiz: function(optEl, isCorrect, misconception, explanation) {
    var fb = document.getElementById('quizFeedback');
    var opts = document.querySelectorAll('#quizOptsContainer .quiz-opt');
    for (var i = 0; i < opts.length; i++) {
      opts[i].classList.remove('selected', 'correct', 'wrong');
      opts[i].style.pointerEvents = 'none';
    }
    if (isCorrect) {
      optEl.classList.add('correct');
      fb.innerHTML = '<div class="feedback ok">✓ Excellent! ' + (explanation || '') + '</div>';
      playTone('correct');
      this.answered = true;
      this.awardXP(20);
      document.getElementById('continueBtn').disabled = false;
    } else {
      optEl.classList.add('wrong');
      var mHtml = misconception ? '<div class="misconception">' + rt('⚠ ' + misconception, true) + '</div>' : '';
      fb.innerHTML = '<div class="feedback fail">✗ Try again: ' + mHtml + '</div>';
      playTone('wrong');
      setTimeout(function() {
        for (var i = 0; i < opts.length; i++) opts[i].style.pointerEvents = 'auto';
      }, 900);
    }
  },

  showNextHint: function(qId) {
    var hb = document.getElementById('hb_' + qId);
    var ht = document.getElementById('ht_' + qId);
    var hl = document.getElementById('hl_' + qId);
    if (!hb || !ht) return;

    var curTier = this._hintState[qId] || 0;
    curTier = (curTier % 4) + 1;
    this._hintState[qId] = curTier;

    var hintKey = 'h' + curTier;
    var hintContent = hb.getAttribute('data-' + hintKey) || '';
    if (hl) hl.textContent = '[Tier ' + curTier + '/4]';
    ht.innerHTML = '<b>Tier ' + curTier + ' Hint:</b> ' + rt(hintContent, true).replace(/^<div class="lle-text-sm">/, '').replace(/<\\/div>$/, '');
    ht.style.display = 'block';
    playTone('tap');
  },

  answerAssessment: function(optEl, qId, isCorrect, misconception, xpVal) {
    var card = document.getElementById(qId);
    if (!card) return;
    var allOpts = card.querySelectorAll('.quiz-opt');
    var fb = document.getElementById('fb_' + qId);

    for (var i = 0; i < allOpts.length; i++) {
      allOpts[i].classList.remove('selected', 'correct', 'wrong');
      allOpts[i].style.pointerEvents = 'none';
    }

    if (isCorrect) {
      optEl.classList.add('correct');
      if (fb) fb.innerHTML = '<div class="feedback ok">✓ Correct! +' + xpVal + ' XP Earned.</div>';
      playTone('correct');
      fireConfetti(35);
      this.streak++;
      this.awardXP(xpVal);
    } else {
      optEl.classList.add('wrong');
      if (fb) {
        var mHtml = misconception ? '<div class="misconception">' + rt('⚠ ' + misconception, true).replace(/^<div class="lle-text-sm">/, '').replace(/<\\/div>$/, '') + '</div>' : '';
        fb.innerHTML = '<div class="feedback fail">✗ Incorrect. ' + mHtml + '</div>';
      }
      playTone('wrong');
      this.streak = 0;
      this.save();
      this.updateStats();
      setTimeout(function() {
        for (var i = 0; i < allOpts.length; i++) allOpts[i].style.pointerEvents = 'auto';
      }, 1000);
    }
  },

  onContinue: function() {
    var node = NODES[this.nIdx];
    var step = node.steps[this.sIdx];

    if (step.t === 'worked') {
      var weData = WE[step.we];
      if (this.weStepIdx < weData.steps.length - 1) {
        this.weStepIdx++;
        this.weStepCheckPassed = false;
        this.render();
        return;
      } else {
        this.weStepIdx = 0;
        this.weStepCheckPassed = false;
      }
    }

    if (this.sIdx < node.steps.length - 1) {
      this.sIdx++;
      this.answered = false;
      this.render();
    } else {
      if (this.nIdx < NODES.length - 1) {
        this.nIdx++;
        this.sIdx = 0;
        this.answered = false;
        this.render();
      } else {
        fireConfetti(80);
        playTone('levelup');
        this.switchTab('warmup');
      }
    }
  },

  back: function() {
    if (this.sIdx > 0) {
      this.sIdx--;
      this.render();
    } else if (this.nIdx > 0) {
      this.nIdx--;
      this.sIdx = NODES[this.nIdx].steps.length - 1;
      this.render();
    }
  },

  exit: function() {
    document.body.classList.remove('assessment-mode');
    this.save();
    this.nIdx = 0; this.sIdx = 0;
    this.weStepIdx = 0; this.weChecked = false; this.weCheckAnswered = false;
    this._weCheckRendered = false; this.answered = false; this.selOpt = null;
    this.activeTab = 'concept';
    var tabs = ['concept', 'warmup', 'deep_dive', 'boss'];
    tabs.forEach(function(t) {
      var btn = document.getElementById('tabBtn' + (t === 'concept' ? 'Concept' : (t === 'warmup' ? 'Warmup' : (t === 'deep_dive' ? 'DeepDive' : 'Boss'))));
      if (btn) {
        if (t === 'concept') btn.classList.add('active');
        else btn.classList.remove('active');
      }
    });
    document.getElementById('stepContainer').style.display = 'block';
    document.getElementById('assessmentContainer').style.display = 'none';
    document.getElementById('bottomBar').style.display = 'flex';
    this.render();
  }
};

if (typeof window !== 'undefined') {
  window.App = App;
}

window.addEventListener('resize', function() {
  var canvas = document.getElementById('conceptCanvas');
  if (canvas && window.App && typeof App.mountSim === 'function' && App.activeTab === 'concept') {
    var node = NODES[App.nIdx];
    var step = node && node.steps ? node.steps[App.sIdx] : null;
    if (step && step.simType) {
      App.mountSim(step.simType);
    }
  }
});

window.addEventListener('DOMContentLoaded', function() {
  App.init();
});
</script>
</body>
</html>`;

// The legacy renderer bypasses Canonical IR, so require the same page-level source evidence before any output write.
const sourceEvidence = validateSourceEvidenceManifest({
  manifestPath: path.resolve(__dirname, '../chapters/ExponentsPowers_Class8_source_evidence.json'),
  projectRoot: path.resolve(__dirname, '..'),
  chapterId: 'c8_math_exponents_powers',
  learningTargetIds: NODES_JSON.flatMap((node, nodeIndex) => [
    `learning:node:${nodeIndex + 1}`,
    ...(node.steps || []).map((_, stepIndex) => `learning:node:${nodeIndex + 1}:step:${stepIndex + 1}`),
  ]),
  assessmentTargetIds: [...warmupQuestionIds, ...deepdiveQuestionIds, ...bossQuestionIds],
});
if (!sourceEvidence.valid) {
  throw new Error(`Legacy chapter build blocked by source evidence gate:\n- ${sourceEvidence.errors.join('\n- ')}`);
}
console.log(`Source evidence verified: ${sourceEvidence.fully_covered}/${sourceEvidence.total_items} source items mapped.`);
const sourceEvidencePayload = {
  ...sourceEvidence.manifest,
  verification: {
    source_hash_status: sourceEvidence.source_hash_status,
    coverage_status: 'FULL',
    total_items: sourceEvidence.total_items,
    fully_covered: sourceEvidence.fully_covered,
  },
};
const sourceEvidenceScript = `<script type="application/json" id="aasha-source-evidence">${JSON.stringify(sourceEvidencePayload).replace(/</g, '\\u003c')}</script>`;
const verifiedHtml = fullHtml.replace('</body>', `${sourceEvidenceScript}\n</body>`);
const artifactBytes = Buffer.byteLength(verifiedHtml, 'utf8');
if (artifactBytes > 20971520) throw new Error(`Legacy chapter HTML is ${artifactBytes} bytes, above the 20 MiB artifact ceiling.`);

const outPath1 = path.join(__dirname, '../standalone_chapters/ExponentsPowers_Class8_Gamified_v5_Enhanced_v6.html');
const outPath2 = path.join(__dirname, '../chapters/ExponentsPowers_Class8_Gamified_v5_Enhanced_v6.html');
const outPath3 = path.join(__dirname, '../chapters/ExponentsPowers_Class8_v6.html');

fs.writeFileSync(outPath1, verifiedHtml, 'utf8');
console.log('Saved:', outPath1, '(' + fs.statSync(outPath1).size + ' bytes)');

fs.writeFileSync(outPath2, verifiedHtml, 'utf8');
console.log('Saved:', outPath2, '(' + fs.statSync(outPath2).size + ' bytes)');

fs.writeFileSync(outPath3, verifiedHtml, 'utf8');
console.log('Saved:', outPath3, '(' + fs.statSync(outPath3).size + ' bytes)');

console.log('Build completed successfully!');
