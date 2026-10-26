// Boss Arena & HOTS (Level 3: 18 Questions)
// All 12 Textbook MCQs + HOTS 2a, 2b, 4 lunar spacecraft + Celestial Mass + Spinner Championship
// Strict L-Truth Zero-Spoiler Invariant: No leak words, misconception > 15 chars, pedagogical diagnosis.

const BOSS_QUESTIONS = [
  {
    id: "ep_boss_1",
    tag: "Textbook MCQ 1",
    prompt: "Simplify the power fraction: \\(\\frac{2^{2001} + 2^{1999}}{2^{2000} - 2^{1999}}\\)",
    opts: [
      { text: "5", correct: true, m: "" },
      { text: "3", correct: false, m: "Evaluated numerator as 2^2 - 1 instead of adding 2^2 + 1 after factoring out 2^1999." },
      { text: "2", correct: false, m: "Subtracted exponents directly across addition terms without factoring out common power." },
      { text: "1", correct: false, m: "Assumed high powers of 2 cancel out to leave unit ratio." }
    ],
    hints: {
      h1: "Identify the smallest power of 2 in both numerator and denominator, which is 2^1999.",
      h2: "Factor out 2^1999: Numerator = 2^1999 * (2^2 + 1); Denominator = 2^1999 * (2^1 - 1).",
      h3: "Cancel common factor 2^1999 between top and bottom.",
      h4: "Evaluate the remaining arithmetic: (4 + 1) / (2 - 1)."
    },
    xp: 20
  },
  {
    id: "ep_boss_2",
    tag: "Textbook MCQ 2",
    prompt: "For non-zero variables \\(x\\) and \\(y\\), what is \\(x^{-1} + y^{-1}\\)?",
    opts: [
      { text: "\\frac{x+y}{xy}", correct: true, m: "" },
      { text: "(x+y)^{-1}", correct: false, m: "Distributed negative exponent across addition, violating algebraic laws: 1/x + 1/y does not equal 1/(x+y)." },
      { text: "\\frac{xy}{x+y}", correct: false, m: "Took the reciprocal of the whole sum rather than adding the individual reciprocals." },
      { text: "\\frac{1}{xy}", correct: false, m: "Multiplied reciprocals instead of taking their common-denominator sum." }
    ],
    hints: {
      h1: "Convert negative exponents to fractions: x^(-1) = 1/x and y^(-1) = 1/y.",
      h2: "Find a common denominator xy for adding 1/x and 1/y.",
      h3: "Rewrite terms with common denominator: y/(xy) + x/(xy).",
      h4: "Combine numerators over the shared denominator."
    },
    xp: 20
  },
  {
    id: "ep_boss_3",
    tag: "Textbook MCQ 3",
    prompt: "What is the value of \\(x + x(x^x)\\) when \\(x = 2\\)?",
    opts: [
      { text: "10", correct: true, m: "" },
      { text: "16", correct: false, m: "Computed (x + x)^(x^x) by ignoring operational order of operations." },
      { text: "8", correct: false, m: "Evaluated x^x as 2 * 2 = 4 and added 4 without multiplying by coefficient x." },
      { text: "12", correct: false, m: "Multiplied before evaluating the inner exponential power." }
    ],
    hints: {
      h1: "Follow BODMAS/PEMDAS: evaluate the inner exponent x^x first with x = 2.",
      h2: "Evaluate two squared to obtain intermediate value four.",
      h3: "Now multiply by the coefficient: 2 * (4) = 8.",
      h4: "Add the first term: 2 + 8."
    },
    xp: 20
  },
  {
    id: "ep_boss_4",
    tag: "Textbook MCQ 4",
    prompt: "What is the multiplicative inverse of \\(10^{-100}\\)?",
    opts: [
      { text: "10^{100}", correct: true, m: "" },
      { text: "-10^{-100}", correct: false, m: "Confused additive inverse with multiplicative inverse." },
      { text: "10^{-100}", correct: false, m: "Selected the identical number instead of its reciprocal." },
      { text: "-10^{100}", correct: false, m: "Inverted exponent sign while adding an unwarranted negative sign to base." }
    ],
    hints: {
      h1: "The multiplicative inverse of any non-zero number a is 1/a.",
      h2: "By the law of negative exponents: 1 / 10^(-100) = 10^(100).",
      h3: "The product of a number and its inverse must equal 1.",
      h4: "Changing the exponent from -100 to +100 satisfies 10^(-100) * 10^(100) = 10^0 = 1."
    },
    xp: 20
  },
  {
    id: "ep_boss_5",
    tag: "Textbook MCQ 5",
    prompt: "Evaluate: \\((3^2)^3 + (\\frac{2}{3})^0 + 3^5\\)",
    opts: [
      { text: "973", correct: true, m: "" },
      { text: "972", correct: false, m: "Assumed (2/3)^0 = 0 instead of applying zero-power identity a^0 = 1." },
      { text: "730", correct: false, m: "Evaluated (3^2)^3 as 3^5 instead of multiplying powers 2 * 3 = 6." },
      { text: "974", correct: false, m: "Added 2 for (2/3)^0 instead of unit value 1." }
    ],
    hints: {
      h1: "Evaluate each term individually using exponent laws.",
      h2: "(3^2)^3 = 3^(2 * 3) = 3^6 = 729.",
      h3: "(2/3)^0 = 1, and 3^5 = 243.",
      h4: "Add the three evaluated terms: 729 + 1 + 243."
    },
    xp: 20
  },
  {
    id: "ep_boss_6",
    tag: "Textbook MCQ 6",
    prompt: "If \\(\\frac{10}{3} \\times 3^x - 3^{x-1} = 81\\), find the value of \\(x\\):",
    opts: [
      { text: "3", correct: true, m: "" },
      { text: "4", correct: false, m: "Equated 3^(x+1) to 81 without accounting for the fractional coefficient factor." },
      { text: "2", correct: false, m: "Divided 81 by 27 instead of solving the exponential power equation." },
      { text: "1", correct: false, m: "Assumed x - 1 cancelled out the linear power term." }
    ],
    hints: {
      h1: "Rewrite 10/3 * 3^x as 10 * 3^(x-1).",
      h2: "Combine like terms: 10 * 3^(x-1) - 1 * 3^(x-1) = 9 * 3^(x-1).",
      h3: "Set equal to RHS: 9 * 3^(x-1) = 81, so 3^(x-1) = 81 / 9 = 9 = 3^2.",
      h4: "Equate exponents: x - 1 = 2."
    },
    xp: 20
  },
  {
    id: "ep_boss_7",
    tag: "Textbook MCQ 7",
    prompt: "Evaluate: \\((8^0 - 3^0) \\times (8^0 + 3^0)\\)",
    opts: [
      { text: "0", correct: true, m: "" },
      { text: "2", correct: false, m: "Evaluated 8^0 - 3^0 as 1 instead of recognizing identical unit cancellation." },
      { text: "4", correct: false, m: "Computed (1 + 1) * (1 + 1) by ignoring the subtraction sign in the first bracket." },
      { text: "1", correct: false, m: "Assumed zero exponents produce unit output across all operations." }
    ],
    hints: {
      h1: "Evaluate 8^0 and 3^0 first.",
      h2: "Any non-zero base raised to power 0 equals 1.",
      h3: "First bracket: 1 - 1 = 0.",
      h4: "Multiplying 0 by any finite second bracket leaves 0."
    },
    xp: 20
  },
  {
    id: "ep_boss_8",
    tag: "Textbook MCQ 8",
    prompt: "Find the reciprocal of \\((\\frac{3}{2})^{-2} \\div (\\frac{1}{3})^{-3}\\):",
    opts: [
      { text: "\\frac{243}{4}", correct: true, m: "" },
      { text: "\\frac{4}{243}", correct: false, m: "Evaluated the expression correctly but did not take the final reciprocal." },
      { text: "\\frac{27}{4}", correct: false, m: "Evaluated (1/3)^(-3) as 9 instead of cubing 3 to 27." },
      { text: "\\frac{81}{4}", correct: false, m: "Multiplied powers incorrectly during quotient reduction." }
    ],
    hints: {
      h1: "Simplify (3/2)^(-2) = (2/3)^2 = 4/9.",
      h2: "Simplify (1/3)^(-3) = 3^3 = 27.",
      h3: "Divide: (4/9) / 27 = 4 / (9 * 27) = 4 / 243.",
      h4: "Take reciprocal of 4/243 by inverting numerator and denominator."
    },
    xp: 20
  },
  {
    id: "ep_boss_9",
    tag: "Textbook MCQ 9",
    prompt: "Simplify: \\((3^0 - 4^0) \\times 5^2\\)",
    opts: [
      { text: "0", correct: true, m: "" },
      { text: "25", correct: false, m: "Evaluated 3^0 - 4^0 as 1 instead of 1 - 1." },
      { text: "-25", correct: false, m: "Subtracted 4 from 3 before applying zero exponent." },
      { text: "1", correct: false, m: "Assumed zero powers collapse everything to 1." }
    ],
    hints: {
      h1: "Recall that 3^0 = 1 and 4^0 = 1.",
      h2: "Compute subtraction inside bracket: 1 - 1 = 0.",
      h3: "Now multiply 0 by 5^2 = 25.",
      h4: "Zero multiplied by 25 yields zero."
    },
    xp: 20
  },
  {
    id: "ep_boss_10",
    tag: "Textbook MCQ 10",
    prompt: "If \\(2^{x-4} = 1\\), what is the value of \\(x\\)?",
    opts: [
      { text: "4", correct: true, m: "" },
      { text: "3", correct: false, m: "This value leaves the exponent one unit below zero." },
      { text: "2", correct: false, m: "This value leaves the exponent two units below zero." },
      { text: "1", correct: false, m: "This value leaves the exponent three units below zero." }
    ],
    hints: {
      h1: "Express RHS 1 as a power of base 2: 1 = 2^0.",
      h2: "For equal positive bases, compare the exponents.",
      h3: "Set the exponent on the left equal to zero.",
      h4: "Use the inverse operation to isolate x."
    },
    xp: 20
  },
  {
    id: "ep_boss_11",
    tag: "Textbook MCQ 11",
    prompt: "What is the standard scientific form of \\(0.00000037\\)?",
    opts: [
      { text: "3.7 \\times 10^{-7}", correct: true, m: "" },
      { text: "3.7 \\times 10^{-6}", correct: false, m: "Counted 6 leading zeros without including the shift past digit 3." },
      { text: "37 \\times 10^{-8}", correct: false, m: "Did not normalize coefficient between 1 and 10." },
      { text: "3.7 \\times 10^7", correct: false, m: "Chose positive power for a microscopic decimal fraction." }
    ],
    hints: {
      h1: "Normalized coefficient is 3.7.",
      h2: "Count decimal shifts to position between 3 and 7.",
      h3: "Count: 6 zeros plus digit 3.",
      h4: "Seven shifts to the right corresponds to exponent -7."
    },
    xp: 20
  },
  {
    id: "ep_boss_12",
    tag: "Textbook MCQ 12",
    prompt: "If \\([((\\frac{1}{3})^{-1} - (\\frac{1}{4})^{-1})^{-1}]^m = 1\\), find the least positive integer \\(m\\):",
    opts: [
      { text: "2", correct: true, m: "" },
      { text: "1", correct: false, m: "Base simplifies to -1; (-1)^1 = -1, which does not equal +1." },
      { text: "3", correct: false, m: "An odd power on base -1 preserves -1 rather than reaching positive 1." },
      { text: "0", correct: false, m: "Zero is not a positive integer (positive integers start from 1)." }
    ],
    hints: {
      h1: "Evaluate inside brackets: (1/3)^(-1) = 3 and (1/4)^(-1) = 4.",
      h2: "Difference inside bracket: 3 - 4 = -1.",
      h3: "Now apply next power (-1): (-1)^(-1) = -1. So expression is (-1)^m = 1.",
      h4: "For (-1)^m to equal +1, m must be an even positive integer; smallest is 2."
    },
    xp: 20
  },
  {
    id: "ep_boss_13",
    tag: "HOTS Q2(a)",
    prompt: "Simplify the algebraic identity: \\(\\frac{1}{1 + x^{q-p}} + \\frac{1}{1 + x^{p-q}}\\)",
    opts: [
      { text: "1", correct: true, m: "" },
      { text: "0", correct: false, m: "Assumed fractional expressions cancelled out by opposite subtraction." },
      { text: "x^{p+q}", correct: false, m: "Multiplied exponents incorrectly when finding common denominator." },
      { text: "2", correct: false, m: "Added unit numerators directly without establishing a common denominator." }
    ],
    hints: {
      h1: "Rewrite x^(p-q) as 1 / x^(q-p).",
      h2: "Substitute into second denominator: 1 + 1 / x^(q-p) = (x^(q-p) + 1) / x^(q-p).",
      h3: "Take reciprocal of that second fraction: x^(q-p) / (1 + x^(q-p)).",
      h4: "Now add both fractions with identical denominator (1 + x^(q-p))."
    },
    xp: 20
  },
  {
    id: "ep_boss_14",
    tag: "HOTS Q2(b)",
    prompt: "Simplify: \\(\\frac{(a^{p+q})^2 (a^{q+r})^2 (a^{r+p})^2}{(a^p a^q a^r)^4}\\)",
    opts: [
      { text: "1", correct: true, m: "" },
      { text: "a^2", correct: false, m: "Mishandled exponent multiplication on numerator factors." },
      { text: "a^{-2}", correct: false, m: "A nonzero exponent remains after subtracting the matching numerator and denominator powers." },
      { text: "a^{pqr}", correct: false, m: "Confused addition of exponents with multiplication of exponents." }
    ],
    hints: {
      h1: "Expand numerator powers: (a^(p+q))^2 = a^(2p + 2q).",
      h2: "Sum all numerator exponents: (2p + 2q) + (2q + 2r) + (2r + 2p) = 4p + 4q + 4r.",
      h3: "Expand denominator: (a^(p+q+r))^4 = a^(4p + 4q + 4r).",
      h4: "Numerator and denominator have identical powers: a^K / a^K."
    },
    xp: 20
  },
  {
    id: "ep_boss_15",
    tag: "HOTS Q4",
    prompt: "A lunar spacecraft travels at \\(12\\text{ km/s} = 1.2 \\times 10^4\\text{ m/s}\\). If distance to Moon is \\(3.48 \\times 10^8\\text{ m}\\), calculate travel time in seconds in scientific notation:",
    opts: [
      { text: "2.9 \\times 10^4\\text{ s}", correct: true, m: "" },
      { text: "2.9 \\times 10^3\\text{ s}", correct: false, m: "Subtracted powers incorrectly in the exponent difference." },
      { text: "4.176 \\times 10^{12}\\text{ s}", correct: false, m: "Multiplied distance by speed instead of dividing distance by speed." },
      { text: "29 \\times 10^3\\text{ s}", correct: false, m: "Failed to normalize coefficient between 1 and 10." }
    ],
    hints: {
      h1: "Use formula: Time = Distance / Speed.",
      h2: "Set up division: (3.48 * 10^8) / (1.2 * 10^4).",
      h3: "Divide coefficients: 3.48 / 1.2.",
      h4: "Subtract powers of 10: 10^(8 - 4)."
    },
    xp: 20
  },
  {
    id: "ep_boss_16",
    tag: "Celestial Mass HOTS",
    prompt: "Earth mass is \\(5.97 \\times 10^{24}\\text{ kg}\\) and Sun mass is \\(1.989 \\times 10^{30}\\text{ kg}\\). What is their combined total mass in standard form?",
    opts: [
      { text: "1.989006 \\times 10^{30}\\text{ kg}", correct: true, m: "" },
      { text: "7.959 \\times 10^{54}\\text{ kg}", correct: false, m: "Added exponents 24 + 30 directly together, which applies only during multiplication." },
      { text: "7.959 \\times 10^{30}\\text{ kg}", correct: false, m: "Added coefficients without aligning both quantities to the same power of 10." },
      { text: "1.989 \\times 10^{24}\\text{ kg}", correct: false, m: "Converted higher power down to 10^24 erroneously." }
    ],
    hints: {
      h1: "To add numbers in scientific notation, express both in the higher power 10^30.",
      h2: "Earth mass: 5.97 * 10^24 = 0.00000597 * 10^30.",
      h3: "Now add coefficients: 1.989 + 0.00000597.",
      h4: "Retain 10^30 as the common exponential power."
    },
    xp: 20
  },
  {
    id: "ep_boss_17",
    tag: "Maths Lab Tournament Q1",
    prompt: "In Maths Lab spinner tournament, Spinner A lands on base \\(6\\) and Spinner B spins twice giving exponents \\(4\\) and \\(-7\\). What is \\(6^4 \\times 6^{-7}\\)?",
    opts: [
      { text: "6^{-3}", correct: true, m: "" },
      { text: "6^{-28}", correct: false, m: "Multiplied exponents together instead of adding them using the product law." },
      { text: "36^{-3}", correct: false, m: "Multiplied bases together when the base should remain unchanged." },
      { text: "6^{11}", correct: false, m: "Subtracted -7 as 4 - (-7) = 11 instead of adding exponents 4 + (-7)." }
    ],
    hints: {
      h1: "Apply the Product Law: a^m * a^n = a^(m+n).",
      h2: "Keep the common base 6 unchanged.",
      h3: "Add the exponents: 4 + (-7).",
      h4: "Compute 4 - 7."
    },
    xp: 20
  },
  {
    id: "ep_boss_18",
    tag: "Maths Lab Tournament Q2",
    prompt: "In power of power round, Spinner A lands on base \\(5\\) with power \\(3\\), and outer spin is \\(-2\\). What does \\((5^3)^{-2}\\) simplify to?",
    opts: [
      { text: "5^{-6}", correct: true, m: "" },
      { text: "5^1", correct: false, m: "Added exponents 3 + (-2) instead of applying the power of power law." },
      { text: "5^5", correct: false, m: "Subtracted exponents incorrectly." },
      { text: "25^{-6}", correct: false, m: "Squared the base 5 instead of multiplying powers." }
    ],
    hints: {
      h1: "Apply Power of a Power Law: (a^m)^n = a^(mn).",
      h2: "Retain base 5.",
      h3: "Multiply exponents: 3 * (-2).",
      h4: "A positive times a negative gives a negative product."
    },
    xp: 20
  }
];

module.exports = { BOSS_QUESTIONS };
