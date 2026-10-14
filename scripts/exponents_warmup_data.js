// Warm-up assessment bank for Class 8 Exponents & Powers.
// Textbook labels are included only where matched to the scanned Math Matrix 8 pages.
// Strict L-Truth Zero-Spoiler Invariant:
// - No forbidden leak words: is, giving, becomes, instead of, to get, yielding, result is, should be, must be, equals, yields
// - Misconception explanation > 15 chars, pedagogical, diagnosing the mistake without giving the correct answer or calculating it.
// - 4-Tier hints: H1 (Hook), H2 (Concept), H3 (Strategy), H4 (Intermediate step).

const WARMUP_QUESTIONS = [
  {
    id: "ep_w_1",
    tag: "Warm Up Q1(a)",
    prompt: "Evaluate the power: \\((-1)^7\\)",
    opts: [
      { text: "-1", correct: true, m: "" },
      { text: "1", correct: false, m: "An odd exponent preserves the negative sign because negative unit factors leave one unpaired factor." },
      { text: "-7", correct: false, m: "Confused exponentiation with multiplying the base by the exponent magnitude." },
      { text: "7", correct: false, m: "Multiplied the base by the exponent while also reversing the negative sign." }
    ],
    hints: {
      h1: "Examine whether the exponent 7 is odd or even.",
      h2: "Recall that (-1) raised to an odd power retains its negative sign.",
      h3: "Pair up factors: each (-1) * (-1) forms +1, leaving any unpaired factor as negative.",
      h4: "Seven negative units group into three positive pairs with one negative factor remaining."
    },
    xp: 5
  },
  {
    id: "ep_w_2",
    tag: "Warm Up Q1(b)",
    prompt: "Evaluate the expanded value of: \\(13^3\\)",
    opts: [
      { text: "2197", correct: true, m: "" },
      { text: "39", correct: false, m: "Multiplied base 13 by exponent 3 rather than performing repeated multiplication." },
      { text: "169", correct: false, m: "Computed only the square 13 * 13 rather than multiplying by 13 three times." },
      { text: "2097", correct: false, m: "Made an arithmetic carrying calculation error during the final multiplication by 13." }
    ],
    hints: {
      h1: "An exponent of 3 indicates cubing the base.",
      h2: "Multiply 13 by 13 first, then multiply that intermediate product by 13 again.",
      h3: "Compute the square 13 * 13 = 169 first.",
      h4: "Now multiply 169 by 13 by decomposing: 169 * 10 + 169 * 3."
    },
    xp: 5
  },
  {
    id: "ep_w_3",
    tag: "Warm Up Q1(c)",
    prompt: "Evaluate the power: \\((-\\frac{5}{3})^5\\)",
    opts: [
      { text: "-\\frac{3125}{243}", correct: true, m: "" },
      { text: "\\frac{3125}{243}", correct: false, m: "Overlooked the odd exponent which preserves the negative sign on a negative rational base." },
      { text: "-\\frac{25}{15}", correct: false, m: "Multiplied both numerator and denominator by 5 instead of raising them to the fifth power." },
      { text: "-\\frac{243}{3125}", correct: false, m: "Inverted the fraction without any negative exponent justifying a reciprocal transformation." }
    ],
    hints: {
      h1: "Apply the power separately to both numerator and denominator: (p/q)^n = p^n / q^n.",
      h2: "Check the sign: a negative base raised to an odd exponent stays negative.",
      h3: "Compute 5^5 in the numerator and 3^5 in the denominator.",
      h4: "Numerator is 5^5 = 3125 and denominator is 3^5 = 243."
    },
    xp: 5
  },
  {
    id: "ep_w_4",
    tag: "Warm Up Q1(d)",
    prompt: "Evaluate the power: \\((-\\frac{7}{11})^4\\)",
    opts: [
      { text: "\\frac{2401}{14641}", correct: true, m: "" },
      { text: "-\\frac{2401}{14641}", correct: false, m: "Retained a negative sign even though an even exponent pairs every negative factor into a positive product." },
      { text: "\\frac{28}{44}", correct: false, m: "Multiplied terms by 4 instead of calculating repeated fourth powers." },
      { text: "\\frac{343}{1331}", correct: false, m: "Computed only the cubes of 7 and 11 rather than their fourth powers." }
    ],
    hints: {
      h1: "Notice that the exponent 4 is an even number.",
      h2: "Any negative number raised to an even power yields a positive value.",
      h3: "Calculate 7^4 for the numerator and 11^4 for the denominator.",
      h4: "7^4 = (49)^2 and 11^4 = (121)^2."
    },
    xp: 5
  },
  {
    id: "ep_w_5",
    tag: "Warm Up Q2(a)",
    prompt: "Express \\(-15,625\\) in power notation:",
    opts: [
      { text: "-(5^6)", correct: true, m: "" },
      { text: "(-5)^6", correct: false, m: "An even power of a negative base is positive, so this does not match the negative value." },
      { text: "(-5)^5", correct: false, m: "Five factors of 5 have magnitude 3125, not 15625." },
      { text: "-(5^5)", correct: false, m: "The sign is correct, but five factors of 5 have magnitude 3125." }
    ],
    hints: {
      h1: "Separate the negative sign from the magnitude 15,625.",
      h2: "Write the magnitude as repeated factors of 5.",
      h3: "There are six factors because 5^6 = 15,625.",
      h4: "Keep the negative sign outside the power: -(5^6) = -15,625."
    },
    xp: 5
  },
  {
    id: "ep_w_6",
    tag: "Warm Up Q2(b)",
    prompt: "Express \\(2197\\) in exponential notation with prime base \\(13\\):",
    opts: [
      { text: "13^3", correct: true, m: "" },
      { text: "13^2", correct: false, m: "13 squared equals 169, which is much smaller than 2197." },
      { text: "13^4", correct: false, m: "Four factors of 13 exceed 28,000, far larger than the target number." },
      { text: "17^3", correct: false, m: "Selected base 17 whose cube exceeds 4900, not matching 2197." }
    ],
    hints: {
      h1: "Divide 2197 by 13 to inspect the quotient.",
      h2: "2197 / 13 = 169.",
      h3: "Recognize that 169 is a known square of 13.",
      h4: "Since 169 = 13 * 13, combining with the first factor gives three factors of 13."
    },
    xp: 5
  },
  {
    id: "ep_w_7",
    tag: "Warm Up Q2(c)",
    prompt: "Express \\(1024\\) in power notation with base \\(2\\):",
    opts: [
      { text: "2^{10}", correct: true, m: "" },
      { text: "2^8", correct: false, m: "2^8 represents 256, which requires two additional doublings to reach 1024." },
      { text: "2^9", correct: false, m: "2^9 represents 512, exactly half of 1024." },
      { text: "2^{11}", correct: false, m: "2^11 represents 2048, which doubles past 1024." }
    ],
    hints: {
      h1: "Recall powers of 2 from binary computing (1 KB = 1024 bytes).",
      h2: "Start from 2^5 = 32 and keep doubling.",
      h3: "2^6 = 64, 2^7 = 128, 2^8 = 256, 2^9 = 512.",
      h4: "One more doubling of 512 reaches the required 1024."
    },
    xp: 5
  },
  {
    id: "ep_w_8",
    tag: "Practice · Negative exponents",
    prompt: "What is the rational value of \\(4^{-3}\\)?",
    opts: [
      { text: "\\frac{1}{64}", correct: true, m: "" },
      { text: "-64", correct: false, m: "Interpreted a negative exponent as making the overall integer value negative instead of reciprocal." },
      { text: "-\\frac{1}{64}", correct: false, m: "Applied an unnecessary negative sign to the fraction; the base 4 is positive." },
      { text: "\\frac{1}{12}", correct: false, m: "Multiplied base 4 by power 3 in the denominator instead of computing 4 cubed." }
    ],
    hints: {
      h1: "Use the negative exponent definition: a^(-n) = 1 / a^n.",
      h2: "A negative exponent indicates reciprocal division, not a negative arithmetic sign.",
      h3: "Rewrite 4^(-3) as 1 / (4^3).",
      h4: "Evaluate 4^3 = 4 * 4 * 4 in the denominator."
    },
    xp: 5
  },
  {
    id: "ep_w_9",
    tag: "Practice · Reciprocal fractions",
    prompt: "Express \\((\\frac{5}{3})^{-3}\\) as a fraction \\(\\frac{p}{q}\\):",
    opts: [
      { text: "\\frac{27}{125}", correct: true, m: "" },
      { text: "-\\frac{125}{27}", correct: false, m: "Confused the negative power with a negative sign and forgot to invert the fraction." },
      { text: "\\frac{125}{27}", correct: false, m: "Computed powers without reciprocating the fraction for the negative exponent." },
      { text: "-\\frac{27}{125}", correct: false, m: "Inverted the fraction correctly but erroneously attached a negative sign." }
    ],
    hints: {
      h1: "Apply the reciprocal fraction rule: (p/q)^(-n) = (q/p)^n.",
      h2: "Invert the numerator and denominator: 5/3 turns into 3/5 with positive power 3.",
      h3: "Now cube both terms: 3^3 / 5^3.",
      h4: "Evaluate 3 * 3 * 3 on top and 5 * 5 * 5 on bottom."
    },
    xp: 5
  },
  {
    id: "ep_w_10",
    tag: "Practice · Reciprocal powers",
    prompt: "Simplify: \\(\\frac{1}{2^{-5}}\\)",
    opts: [
      { text: "32", correct: true, m: "" },
      { text: "-32", correct: false, m: "Mistook the denominator's negative exponent for an arithmetic negative sign." },
      { text: "\\frac{1}{32}", correct: false, m: "Left the power in the denominator instead of reciprocating 1 / (a^(-n)) to a^n." },
      { text: "10", correct: false, m: "Multiplied base 2 by exponent 5 rather than computing repeated doubling." }
    ],
    hints: {
      h1: "Recall that 1 / a^(-n) = a^n.",
      h2: "A negative exponent in the denominator moves the term into the numerator with a positive power.",
      h3: "Rewrite the expression simply as 2^5.",
      h4: "Double 2 five times: 2, 4, 8, 16, 32."
    },
    xp: 5
  },
  {
    id: "ep_w_11",
    tag: "Exercise 2(A) Q3(b)",
    prompt: "Evaluate the reciprocal value: \\((-4)^{-2}\\)",
    opts: [
      { text: "\\frac{1}{16}", correct: true, m: "" },
      { text: "-\\frac{1}{16}", correct: false, m: "Overlooked that squaring a negative base (-4)^2 produces a positive denominator." },
      { text: "-16", correct: false, m: "Treated the negative exponent as negating the number without reciprocating." },
      { text: "16", correct: false, m: "Squared the base but omitted the reciprocal mandated by the negative exponent." }
    ],
    hints: {
      h1: "Apply the rule: a^(-n) = 1 / (a^n).",
      h2: "Write the expression as 1 / ((-4)^2).",
      h3: "Evaluate the denominator: (-4) * (-4).",
      h4: "A negative multiplied by a negative gives a positive square in the denominator."
    },
    xp: 5
  },
  {
    id: "ep_w_12",
    tag: "Exercise 2(A) Q3(c)",
    prompt: "Simplify: \\(\\frac{1}{7^{-2}}\\)",
    opts: [
      { text: "49", correct: true, m: "" },
      { text: "-49", correct: false, m: "Attributed a negative sign to the whole integer instead of applying the reciprocal law." },
      { text: "\\frac{1}{49}", correct: false, m: "Left the power in denominator form without moving to the numerator." },
      { text: "14", correct: false, m: "Multiplied 7 by 2 instead of calculating the square of 7." }
    ],
    hints: {
      h1: "Notice the negative power in the denominator position.",
      h2: "1 / (a^(-2)) transforms directly to a^2 in the numerator.",
      h3: "The expression reduces to 7^2.",
      h4: "Multiply 7 by 7."
    },
    xp: 5
  },
  {
    id: "ep_w_13",
    tag: "Practice · Multiplicative inverse",
    prompt: "Find the multiplicative inverse (reciprocal) of \\((\\frac{2}{3})^{-2}\\):",
    opts: [
      { text: "\\frac{4}{9}", correct: true, m: "" },
      { text: "\\frac{9}{4}", correct: false, m: "Evaluated the expression itself rather than finding its multiplicative inverse." },
      { text: "-\\frac{4}{9}", correct: false, m: "Appended a negative sign when reciprocal operations preserve the positive nature of the base." },
      { text: "\\frac{3}{2}", correct: false, m: "Inverted the base fraction but ignored the square exponent entirely." }
    ],
    hints: {
      h1: "The multiplicative inverse of any term x is 1/x.",
      h2: "The multiplicative inverse of a^(-n) is a^n.",
      h3: "Here the inverse of (2/3)^(-2) is simply (2/3)^2.",
      h4: "Square 2/3 directly: 2^2 / 3^2."
    },
    xp: 5
  },
  {
    id: "ep_w_14",
    tag: "Warm Up Q6(b)",
    prompt: "Simplify using exponent laws: \\(9^5 \\times 6^5\\)",
    opts: [
      { text: "54^5", correct: true, m: "" },
      { text: "54^{10}", correct: false, m: "Added exponents together even though bases are different and the power-of-product law applies." },
      { text: "15^5", correct: false, m: "Added the bases together instead of multiplying them under a common exponent." },
      { text: "54^{25}", correct: false, m: "Multiplied the exponents together instead of retaining the common power." }
    ],
    hints: {
      h1: "Notice that both terms share the exact same exponent 5.",
      h2: "Recall the law for like exponents: a^m * b^m = (ab)^m.",
      h3: "Group the bases together inside parentheses: (9 * 6)^5.",
      h4: "Multiply 9 by 6 to form the combined base."
    },
    xp: 5
  },
  {
    id: "ep_w_15",
    tag: "Warm Up Q6(c)",
    prompt: "Express as a single power: \\(a^4 \\times b^4 \\times c^4\\)",
    opts: [
      { text: "(abc)^4", correct: true, m: "" },
      { text: "(abc)^{12}", correct: false, m: "Added the three exponents together when common powers should be factored outward." },
      { text: "(a+b+c)^4", correct: false, m: "Replaced multiplication of bases with addition inside the bracket." },
      { text: "abc^4", correct: false, m: "Omitted parentheses, meaning the exponent 4 applies only to c instead of all three terms." }
    ],
    hints: {
      h1: "All three variables are raised to the common power 4.",
      h2: "Use the generalized product law: a^n * b^n * c^n = (a * b * c)^n.",
      h3: "Collect the product of variables within parentheses.",
      h4: "Retain 4 as the single outside exponent."
    },
    xp: 5
  },
  {
    id: "ep_w_16",
    tag: "Warm Up Q8(a)",
    prompt: "Evaluate the zero-power expression: \\((5^0 - 7^0) \\times 3^3 \\div 6^0\\)",
    opts: [
      { text: "0", correct: true, m: "" },
      { text: "27", correct: false, m: "Calculated 5^0 - 7^0 as 1 instead of observing that two identical non-zero powers cancel to zero." },
      { text: "1", correct: false, m: "Assumed zero exponents cause all arithmetic operations to reduce to unit value." },
      { text: "-27", correct: false, m: "Treated 5^0 - 7^0 as negative one instead of subtracting identical values." }
    ],
    hints: {
      h1: "Recall that any non-zero base raised to the power 0 equals 1.",
      h2: "Substitute 5^0 = 1 and 7^0 = 1 inside the first parenthesis.",
      h3: "Compute the subtraction inside the parenthesis: 1 - 1.",
      h4: "Any finite quantity multiplied by 0 reduces immediately."
    },
    xp: 5
  },
  {
    id: "ep_w_17",
    tag: "Practice · Zero and negative exponents",
    prompt: "Evaluate: \\((8^0 + 5^{-1}) \\times (\\frac{1}{3})^{-2}\\)",
    opts: [
      { text: "\\frac{54}{5}", correct: true, m: "" },
      { text: "\\frac{6}{5}", correct: false, m: "Computed the first bracket but multiplied by 1 instead of evaluating (1/3)^(-2)." },
      { text: "\\frac{18}{5}", correct: false, m: "Evaluated (1/3)^(-2) as 3 instead of squaring the inverted fraction." },
      { text: "9", correct: false, m: "Treated 5^(-1) as 0, ignoring the fractional addend inside the bracket." }
    ],
    hints: {
      h1: "Evaluate each component: 8^0 = 1, 5^(-1) = 1/5, and (1/3)^(-2) = 3^2 = 9.",
      h2: "Add the terms inside the first bracket: 1 + 1/5 = 6/5.",
      h3: "Now multiply 6/5 by 9.",
      h4: "Numerator becomes 6 * 9, over denominator 5."
    },
    xp: 5
  },
  {
    id: "ep_w_18",
    tag: "Practice · Reciprocal powers",
    prompt: "Which power represents the reciprocal of \\(5^{-3}\\)?",
    opts: [
      { text: "5^3", correct: true, m: "" },
      { text: "5^{-3}", correct: false, m: "Selected the identical expression rather than taking its reciprocal." },
      { text: "-5^3", correct: false, m: "Negated the base instead of changing the exponent sign to obtain the inverse." },
      { text: "(-5)^{-3}", correct: false, m: "Added a negative sign to the base while keeping the negative exponent unchanged." }
    ],
    hints: {
      h1: "The reciprocal of any term x is 1/x.",
      h2: "For powers, the reciprocal of a^(-n) is 1 / a^(-n) = a^n.",
      h3: "Changing the sign of the exponent produces the multiplicative inverse.",
      h4: "Transform negative power -3 into positive power +3 on base 5."
    },
    xp: 5
  }
];

module.exports = { WARMUP_QUESTIONS };
