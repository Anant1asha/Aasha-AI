// Deep Dive Challenge (Level 2: 28 Questions)
// Ex 2A Compound simplification, missing multiplier/divisor, equations & Ex 2B scientific forms
// Strict L-Truth Zero-Spoiler Invariant: No leak words, misconception > 15 chars, pedagogical diagnosis.

const DEEPDIVE_QUESTIONS = [
  {
    id: "ep_dd_1",
    tag: "Ex 2A Q8(a)",
    prompt: "Simplify: \\([(\\frac{1}{2})^{-2} + (\\frac{1}{3})^{-2} + (\\frac{1}{4})^{-2}]\\)",
    opts: [
      { text: "29", correct: true, m: "" },
      { text: "9", correct: false, m: "Added the reciprocals 2 + 3 + 4 without squaring them according to the power 2." },
      { text: "54", correct: false, m: "Squared the fractions incorrectly before inverting them." },
      { text: "\\frac{29}{144}", correct: false, m: "Omitted inverting the fractions and added original fraction squares directly." }
    ],
    hints: {
      h1: "Invert each fraction using (1/a)^(-2) = a^2.",
      h2: "The terms transform into 2^2 + 3^2 + 4^2.",
      h3: "Evaluate each square: 4 + 9 + 16.",
      h4: "Sum the three positive integer squares together."
    },
    xp: 10
  },
  {
    id: "ep_dd_2",
    tag: "Ex 2A Q8(b)",
    prompt: "Simplify: \\([6^{-1} + (\\frac{3}{2})^{-1}]^{-1}\\)",
    opts: [
      { text: "\\frac{6}{5}", correct: true, m: "" },
      { text: "\\frac{5}{6}", correct: false, m: "Evaluated the inner sum correctly but forgot to apply the outer negative power reciprocal." },
      { text: "\\frac{1}{6}", correct: false, m: "Subtracted the fractions inside the bracket instead of finding their common denominator sum." },
      { text: "5", correct: false, m: "Inverted individual addends outside the bracket rather than inverting their unified sum." }
    ],
    hints: {
      h1: "First simplify inside the bracket: 6^(-1) = 1/6 and (3/2)^(-1) = 2/3.",
      h2: "Find common denominator 6: 1/6 + 4/6.",
      h3: "The inner sum simplifies to 5/6.",
      h4: "Now apply the outer exponent (-1): (5/6)^(-1) inverts the fraction."
    },
    xp: 10
  },
  {
    id: "ep_dd_3",
    tag: "Ex 2A Q8(c)",
    prompt: "Simplify: \\([(\\frac{1}{3})^{-1} - (\\frac{1}{2})^{-1}] \\div (\\frac{1}{4})^{-1}\\)",
    opts: [
      { text: "\\frac{1}{4}", correct: true, m: "" },
      { text: "4", correct: false, m: "Multiplied by the divisor instead of dividing by the inverted term." },
      { text: "-\\frac{1}{4}", correct: false, m: "Subtracted 3 from 2 instead of computing 3 minus 2 inside the bracket." },
      { text: "1", correct: false, m: "Neglected the divisor term after computing the bracket difference." }
    ],
    hints: {
      h1: "Invert terms with power (-1): (1/3)^(-1) = 3, (1/2)^(-1) = 2, and (1/4)^(-1) = 4.",
      h2: "Compute the difference inside the bracket: 3 - 2.",
      h3: "The bracket evaluates to 1.",
      h4: "Now divide that result by the divisor 4: 1 divided by 4."
    },
    xp: 10
  },
  {
    id: "ep_dd_4",
    tag: "Ex 2A Q9",
    prompt: "By what number should \\((-6)^{-1}\\) be multiplied so that the product \\(15^{-1}\\) is obtained?",
    opts: [
      { text: "-\\frac{2}{5}", correct: true, m: "" },
      { text: "\\frac{2}{5}", correct: false, m: "Omitted the negative sign from (-6)^(-1) when isolating the required multiplier." },
      { text: "-\\frac{5}{2}", correct: false, m: "Inverted the final ratio when dividing product by given factor." },
      { text: "-90", correct: false, m: "Multiplied -6 by 15 instead of setting up division of reciprocal values." }
    ],
    hints: {
      h1: "Set up the algebraic relation: let required number be x; then (-6)^(-1) * x = 15^(-1).",
      h2: "Express negative powers as fractions: -1/6 * x = 1/15.",
      h3: "Isolate x by multiplying both sides by -6: x = (1/15) * (-6).",
      h4: "Reduce the fraction -6/15 by dividing numerator and denominator by common factor 3."
    },
    xp: 10
  },
  {
    id: "ep_dd_5",
    tag: "Ex 2A Q10",
    prompt: "By what number should \\(3^{-7}\\) be multiplied to reach a product of \\(3\\)?",
    opts: [
      { text: "3^8", correct: true, m: "" },
      { text: "3^6", correct: false, m: "Subtracted 1 from 7 instead of setting up the exponent equation -7 + k = 1." },
      { text: "3^{-8}", correct: false, m: "Assigned a negative power which would decrease the product further to 3^(-15)." },
      { text: "3^7", correct: false, m: "Multiplying by 3^7 neutralizes to 3^0 = 1, falling short of power 1." }
    ],
    hints: {
      h1: "Let the required multiplier be 3^k.",
      h2: "Use the product law: 3^(-7) * 3^k = 3^(-7 + k).",
      h3: "Equate exponents to the target power 3^1: -7 + k = 1.",
      h4: "Solve for k by adding 7 to both sides of the equation."
    },
    xp: 10
  },
  {
    id: "ep_dd_6",
    tag: "Ex 2A Q11",
    prompt: "By what number should \\((-4)^5\\) be divided so the quotient is \\(4^{-2}\\)?",
    opts: [
      { text: "-4^7", correct: true, m: "" },
      { text: "4^7", correct: false, m: "Dropped the negative sign associated with odd power (-4)^5." },
      { text: "-4^3", correct: false, m: "Subtracted 2 from 5 without accounting for division by negative power 4^(-2)." },
      { text: "4^3", correct: false, m: "Omitted negative sign and computed 5 - 2 incorrectly." }
    ],
    hints: {
      h1: "Set up the division relation: (-4)^5 / x = 4^(-2).",
      h2: "Note that (-4)^5 = -(4^5). Therefore -(4^5) / x = 4^(-2).",
      h3: "Isolate x: x = -(4^5) / 4^(-2) = -(4^(5 - (-2))).",
      h4: "Evaluate the exponent: 5 - (-2) = 5 + 2 = 7."
    },
    xp: 10
  },
  {
    id: "ep_dd_7",
    tag: "Ex 2A Q12",
    prompt: "What number should multiply \\(5^{-3}\\) so the product matches \\(125\\)?",
    opts: [
      { text: "5^6", correct: true, m: "" },
      { text: "5^3", correct: false, m: "Multiplying by this power neutralizes to unit value rather than reaching the required cube magnitude." },
      { text: "5^0", correct: false, m: "Multiplying by unit factor leaves the original negative power unchanged." },
      { text: "5^9", correct: false, m: "Added exponents incorrectly, yielding an excessively large magnitude." }
    ],
    hints: {
      h1: "Express 125 as a power of base 5: 125 = 5^3.",
      h2: "Write the equation: 5^(-3) * 5^k = 5^3.",
      h3: "Apply product law: -3 + k = 3.",
      h4: "Add 3 to both sides to find k."
    },
    xp: 10
  },
  {
    id: "ep_dd_8",
    tag: "Ex 2A Q13",
    prompt: "By what number should \\((\\frac{3}{8})^{-3}\\) be divided to obtain \\(\\frac{9}{64}\\)?",
    opts: [
      { text: "(\\frac{3}{8})^{-5}", correct: true, m: "" },
      { text: "(\\frac{3}{8})^5", correct: false, m: "Inverted exponent sign erroneously during quotient isolation." },
      { text: "(\\frac{3}{8})^{-1}", correct: false, m: "Subtracted exponents in reverse order without following algebraic rules." },
      { text: "(\\frac{8}{3})^5", correct: false, m: "Inverted both the fraction base and the exponent simultaneously." }
    ],
    hints: {
      h1: "Express 9/64 as a power of (3/8): 9/64 = (3/8)^2.",
      h2: "Set up the equation: (3/8)^(-3) / x = (3/8)^2.",
      h3: "Rearrange for x: x = (3/8)^(-3) / (3/8)^2 = (3/8)^(-3 - 2).",
      h4: "Compute the combined exponent: -3 - 2 = -5."
    },
    xp: 10
  },
  {
    id: "ep_dd_9",
    tag: "Ex 2A Q14",
    prompt: "By what number should \\((\\frac{4}{7})^{-2}\\) be divided to obtain \\(\\frac{7}{16}\\)?",
    opts: [
      { text: "\\frac{49}{7}", correct: true, m: "" },
      { text: "\\frac{7}{4}", correct: false, m: "Omitted power evaluation when isolating the unknown divisor." },
      { text: "\\frac{16}{7}", correct: false, m: "Multiplied dividend by quotient rather than dividing dividend by quotient." },
      { text: "7", correct: false, m: "Approximated integer magnitude while dropping rational fractional factors." }
    ],
    hints: {
      h1: "Evaluate (4/7)^(-2) = (7/4)^2 = 49/16.",
      h2: "Set up: (49/16) / x = 7/16.",
      h3: "Isolate x by multiplying both sides: x = (49/16) / (7/16).",
      h4: "Cancel the common denominator 16: 49/7."
    },
    xp: 10
  },
  {
    id: "ep_dd_10",
    tag: "Ex 2A Q15(a)",
    prompt: "Find \\(x\\) if: \\((\\frac{5}{3})^{-5} \\times (\\frac{5}{3})^{-11} = (\\frac{5}{3})^{8x}\\)",
    opts: [
      { text: "-2", correct: true, m: "" },
      { text: "2", correct: false, m: "Lost the negative sign when dividing -16 by 8." },
      { text: "-16", correct: false, m: "Equated the sum of exponents directly to x without dividing by coefficient 8." },
      { text: "-1", correct: false, m: "Subtracted exponents instead of applying product law sum -5 + (-11)." }
    ],
    hints: {
      h1: "Combine LHS using product law: a^m * a^n = a^(m+n).",
      h2: "LHS exponent = -5 + (-11) = -16.",
      h3: "Since bases match, equate exponents: 8x = -16.",
      h4: "Divide both sides by 8 to determine x."
    },
    xp: 10
  },
  {
    id: "ep_dd_11",
    tag: "Ex 2A Q15(b)",
    prompt: "Find \\(x\\) if: \\((\\frac{2}{9})^3 \\times (\\frac{2}{9})^{-6} = (\\frac{2}{9})^{2x-1}\\)",
    opts: [
      { text: "-1", correct: true, m: "" },
      { text: "1", correct: false, m: "Sign error when moving -1 across the equality: -3 + 1 yields -2, not +2." },
      { text: "-2", correct: false, m: "Forgot to divide by coefficient 2 after simplifying the constant terms." },
      { text: "0", correct: false, m: "Assumed exponents cancelled completely across LHS and RHS." }
    ],
    hints: {
      h1: "Combine exponents on LHS: 3 + (-6) = -3.",
      h2: "Equate with RHS exponent: 2x - 1 = -3.",
      h3: "Add 1 to both sides: 2x = -3 + 1 = -2.",
      h4: "Divide by 2 to isolate variable x."
    },
    xp: 10
  },
  {
    id: "ep_dd_12",
    tag: "Ex 2A Q15(c)",
    prompt: "Find \\(x\\) if: \\((-\\frac{1}{2})^{-19} \\div (-\\frac{1}{2})^8 = (-\\frac{1}{2})^{-2x+1}\\)",
    opts: [
      { text: "14", correct: true, m: "" },
      { text: "-14", correct: false, m: "Divided by negative coefficient -2 without adjusting sign of LHS." },
      { text: "13", correct: false, m: "Subtracted 1 incorrectly from -27 during linear isolation." },
      { text: "15", correct: false, m: "Added 1 to -27 instead of subtracting 1 when moving term across equality." }
    ],
    hints: {
      h1: "Use quotient law on LHS: (-19) - 8 = -27.",
      h2: "Equate exponents: -2x + 1 = -27.",
      h3: "Subtract 1 from both sides: -2x = -28.",
      h4: "Divide -28 by -2 to solve for x."
    },
    xp: 10
  },
  {
    id: "ep_dd_13",
    tag: "Ex 2A Q15(d)",
    prompt: "Find \\(x\\) if: \\((\\frac{3}{2})^{-3} \\times (\\frac{3}{2})^5 = (\\frac{3}{2})^{2x-1}\\)",
    opts: [
      { text: "\\frac{3}{2}", correct: true, m: "" },
      { text: "2", correct: false, m: "Rounded the rational ratio to an integer without retaining fractional precision." },
      { text: "1", correct: false, m: "Subtracted 1 from 2 instead of adding 1 to 2 when isolating 2x." },
      { text: "\\frac{1}{2}", correct: false, m: "Subtracted exponents incorrectly on LHS as -3 - 5 = -8." }
    ],
    hints: {
      h1: "LHS exponent combines: -3 + 5 = 2.",
      h2: "Equate exponents: 2x - 1 = 2.",
      h3: "Add 1 to both sides: 2x = 3.",
      h4: "Divide by 2 to express x as a fraction."
    },
    xp: 10
  },
  {
    id: "ep_dd_14",
    tag: "Ex 2B Q1(a)",
    prompt: "Express in standard scientific notation: \\(0.000000000086\\)",
    opts: [
      { text: "8.6 \\times 10^{-11}", correct: true, m: "" },
      { text: "8.6 \\times 10^{-10}", correct: false, m: "Counted 10 decimal shifts, stopping before placing the decimal after digit 8." },
      { text: "86 \\times 10^{-12}", correct: false, m: "Left coefficient as 86, violating requirement that 1 <= k < 10." },
      { text: "8.6 \\times 10^{11}", correct: false, m: "Used positive exponent for a microscopic quantity less than 1." }
    ],
    hints: {
      h1: "Standard form requires k * 10^n with 1 <= k < 10.",
      h2: "Place decimal point after first non-zero digit 8, forming 8.6.",
      h3: "Count how many places the decimal shifts to the right from original position to reach 8.6.",
      h4: "Shifting right across 10 zeros and digit 8 requires 11 steps: exponent is -11."
    },
    xp: 10
  },
  {
    id: "ep_dd_15",
    tag: "Ex 2B Q1(b)",
    prompt: "Express in standard scientific notation: \\(80,200,000,000,000\\)",
    opts: [
      { text: "8.02 \\times 10^{13}", correct: true, m: "" },
      { text: "8.02 \\times 10^{14}", correct: false, m: "Overcounted decimal place movements by one unit." },
      { text: "80.2 \\times 10^{12}", correct: false, m: "Retained two digits before decimal point, violating standard normalization." },
      { text: "8.02 \\times 10^{-13}", correct: false, m: "Assigned negative exponent to a very large positive number." }
    ],
    hints: {
      h1: "Place the decimal point between 8 and 0 to form 8.02.",
      h2: "Count places from trailing end to position after 8.",
      h3: "Count zeros and digits: 11 trailing zeros + 2 digits (0 and 2).",
      h4: "Total leftward shift of 13 places yields power 10^13."
    },
    xp: 10
  },
  {
    id: "ep_dd_16",
    tag: "Ex 2B Q1(c)",
    prompt: "Express in standard scientific notation: \\(0.0000000839\\)",
    opts: [
      { text: "8.39 \\times 10^{-8}", correct: true, m: "" },
      { text: "8.39 \\times 10^{-7}", correct: false, m: "Counted only the zeros without including the step past digit 8." },
      { text: "83.9 \\times 10^{-9}", correct: false, m: "Did not normalize coefficient to strictly one non-zero leading digit." },
      { text: "8.39 \\times 10^8", correct: false, m: "Chose positive exponent for a decimal number far below 1." }
    ],
    hints: {
      h1: "Leading coefficient must be 8.39.",
      h2: "Count steps moving rightward from decimal point to 8.",
      h3: "There are 7 leading zeros followed by digit 8.",
      h4: "Total movement is 8 decimal places rightward."
    },
    xp: 10
  },
  {
    id: "ep_dd_17",
    tag: "Ex 2B Q1(d)",
    prompt: "Express in standard scientific notation: \\(3,286,000,000\\)",
    opts: [
      { text: "3.286 \\times 10^9", correct: true, m: "" },
      { text: "3.286 \\times 10^8", correct: false, m: "Counted only the zeros, ignoring shifts past digits 2, 8, and 6." },
      { text: "32.86 \\times 10^8", correct: false, m: "Failed to normalize coefficient between 1 and 10." },
      { text: "3.286 \\times 10^{-9}", correct: false, m: "Used negative exponent for a large quantity exceeding 3 billion." }
    ],
    hints: {
      h1: "Place the decimal after leading digit 3 to obtain 3.286.",
      h2: "Count digits after 3: 2, 8, 6, and six trailing zeros.",
      h3: "Total digits after 3 = 3 + 6 = 9.",
      h4: "The power of 10 is positive 9."
    },
    xp: 10
  },
  {
    id: "ep_dd_18",
    tag: "Ex 2B Q2(a)",
    prompt: "Write in usual decimal notation: \\(3.05 \\times 10^{-6}\\)",
    opts: [
      { text: "0.00000305", correct: true, m: "" },
      { text: "0.0000305", correct: false, m: "Shifted only 5 decimal places left instead of 6 places." },
      { text: "0.000000305", correct: false, m: "Shifted 7 decimal places, inserting one surplus zero." },
      { text: "3050000", correct: false, m: "Shifted rightward as if power were positive." }
    ],
    hints: {
      h1: "A negative power -6 means moving the decimal point 6 places left.",
      h2: "Moving past digit 3 uses 1 shift; remaining 5 shifts add 5 zeros.",
      h3: "Write '0.' followed by 5 zeros, then digits 305.",
      h4: "Verify total shift from 3.05 to 0.00000305 equals 6 places."
    },
    xp: 10
  },
  {
    id: "ep_dd_19",
    tag: "Ex 2B Q2(b)",
    prompt: "Write in usual decimal notation: \\(4.6 \\times 10^4\\)",
    opts: [
      { text: "46000", correct: true, m: "" },
      { text: "460000", correct: false, m: "Appended 4 zeros after 46 instead of shifting decimal 4 places." },
      { text: "4600", correct: false, m: "Shifted only 3 places to the right." },
      { text: "0.00046", correct: false, m: "Shifted leftward as if exponent were negative." }
    ],
    hints: {
      h1: "Positive exponent 4 means moving decimal 4 places to the right.",
      h2: "Moving past digit 6 takes 1 place.",
      h3: "Remaining 3 places are filled by trailing zeros.",
      h4: "Combine to form 46 followed by three zeros."
    },
    xp: 10
  },
  {
    id: "ep_dd_20",
    tag: "Ex 2B Q2(c)",
    prompt: "Write in usual decimal form: \\(8 \\times 10^{-8}\\)",
    opts: [
      { text: "0.00000008", correct: true, m: "" },
      { text: "0.0000008", correct: false, m: "Included only 6 zeros before 8, yielding a shift of only 7 places." },
      { text: "0.000000008", correct: false, m: "Added an extra zero, shifting 9 places instead of 8." },
      { text: "80000000", correct: false, m: "Expanded positive zeros instead of converting negative power." }
    ],
    hints: {
      h1: "Power -8 means moving decimal 8 places to the left.",
      h2: "Starting at 8., one shift moves past 8.",
      h3: "Seven additional zeros are needed after the decimal point.",
      h4: "Expression has decimal point, 7 zeros, and digit 8."
    },
    xp: 10
  },
  {
    id: "ep_dd_21",
    tag: "Ex 2B Q2(d)",
    prompt: "Write in usual decimal notation: \\(5.8 \\times 10^{12}\\)",
    opts: [
      { text: "5,800,000,000,000", correct: true, m: "" },
      { text: "58,000,000,000,000", correct: false, m: "Appended 12 zeros after 58 instead of counting 1 place for digit 8." },
      { text: "580,000,000,000", correct: false, m: "Under-expanded by one power of 10." },
      { text: "0.0000000000058", correct: false, m: "Shifted leftward treating exponent as negative." }
    ],
    hints: {
      h1: "Exponent 12 shifts decimal 12 places to the right.",
      h2: "First shift passes digit 8 (1 place).",
      h3: "Remaining 11 places are filled with 11 zeros.",
      h4: "Total value is 58 followed by 11 zeros (5.8 trillion)."
    },
    xp: 10
  },
  {
    id: "ep_dd_22",
    tag: "Ex 2B Q3(a)",
    prompt: "Express \\(1\\text{ micron} = \\frac{1}{1,000,000}\\text{ m}\\) in standard scientific form:",
    opts: [
      { text: "1 \\times 10^{-6}\\text{ m}", correct: true, m: "" },
      { text: "1 \\times 10^{-5}\\text{ m}", correct: false, m: "Miscounted number of zeros in one million (6 zeros)." },
      { text: "1 \\times 10^6\\text{ m}", correct: false, m: "Assigned positive exponent to a microscopic fraction." },
      { text: "10^{-6}\\text{ m}", correct: false, m: "Omitted explicit coefficient 1 required by standard notation k * 10^n." }
    ],
    hints: {
      h1: "One million in the denominator equals 10^6.",
      h2: "Rewrite fraction: 1 / 10^6.",
      h3: "Apply negative exponent rule: 1 / 10^6 = 10^(-6).",
      h4: "Format with standard coefficient: 1 * 10^(-6) m."
    },
    xp: 10
  },
  {
    id: "ep_dd_23",
    tag: "Ex 2B Q3(b)",
    prompt: "Express the electric charge \\(0.00000000000000000016\\text{ C}\\) in standard notation:",
    opts: [
      { text: "1.6 \\times 10^{-19}\\text{ C}", correct: true, m: "" },
      { text: "1.6 \\times 10^{-18}\\text{ C}", correct: false, m: "Counted only zeros without the final step past digit 1." },
      { text: "16 \\times 10^{-20}\\text{ C}", correct: false, m: "Coefficient 16 is not normalized between 1 and 10." },
      { text: "1.6 \\times 10^{19}\\text{ C}", correct: false, m: "Selected positive exponent for subatomic charge magnitude." }
    ],
    hints: {
      h1: "Target coefficient is 1.6.",
      h2: "Count total digits after decimal up to position between 1 and 6.",
      h3: "There are 18 zeros before 1, plus 1 shift past digit 1.",
      h4: "Total rightward shifts = 18 + 1 = 19 places."
    },
    xp: 10
  },
  {
    id: "ep_dd_24",
    tag: "Ex 2B Q3(c)",
    prompt: "Express the size of a bacterium \\(0.0000005\\text{ m}\\) in standard form:",
    opts: [
      { text: "5 \\times 10^{-7}\\text{ m}", correct: true, m: "" },
      { text: "5 \\times 10^{-6}\\text{ m}", correct: false, m: "Counted 6 leading zeros without including the shift past digit 5." },
      { text: "0.5 \\times 10^{-6}\\text{ m}", correct: false, m: "Coefficient 0.5 is less than 1, violating normalization rule." },
      { text: "5 \\times 10^7\\text{ m}", correct: false, m: "Used positive exponent for microscopic dimension." }
    ],
    hints: {
      h1: "Coefficient is integer 5.",
      h2: "Count total places to move decimal point past 5.",
      h3: "Count: 6 zeros + digit 5.",
      h4: "Seven places to the right gives power 10^(-7)."
    },
    xp: 10
  },
  {
    id: "ep_dd_25",
    tag: "Ex 2B Q3(d)",
    prompt: "Express the size of a plant cell \\(0.00001275\\text{ m}\\) in standard scientific form:",
    opts: [
      { text: "1.275 \\times 10^{-5}\\text{ m}", correct: true, m: "" },
      { text: "1.275 \\times 10^{-4}\\text{ m}", correct: false, m: "Stopped shifting at the first zero instead of passing digit 1." },
      { text: "12.75 \\times 10^{-6}\\text{ m}", correct: false, m: "Left two digits before decimal point." },
      { text: "1.275 \\times 10^5\\text{ m}", correct: false, m: "Assigned positive exponent to cell dimension." }
    ],
    hints: {
      h1: "Place decimal between 1 and 2 to form 1.275.",
      h2: "Count shifts from initial decimal point to position after 1.",
      h3: "Count 4 zeros plus digit 1.",
      h4: "Total 5 shifts to the right corresponds to 10^(-5)."
    },
    xp: 10
  },
  {
    id: "ep_dd_26",
    tag: "Ex 2B Q3(e)",
    prompt: "Express the speed of light in vacuum \\(300,000,000\\text{ m/s}\\) in standard notation:",
    opts: [
      { text: "3 \\times 10^8\\text{ m/s}", correct: true, m: "" },
      { text: "3 \\times 10^7\\text{ m/s}", correct: false, m: "Omitted one trailing zero during count." },
      { text: "30 \\times 10^7\\text{ m/s}", correct: false, m: "Kept two digits in the coefficient instead of normalizing to a single leading non-zero digit." },
      { text: "3 \\times 10^{-8}\\text{ m/s}", correct: false, m: "Used negative power for an astronomical velocity." }
    ],
    hints: {
      h1: "Standard coefficient is 3.",
      h2: "Count total zeros following digit 3.",
      h3: "There are eight zeros in 300 million.",
      h4: "Write as 3 * 10^8 m/s."
    },
    xp: 10
  },
  {
    id: "ep_dd_27",
    tag: "Ex 2B Q4(a)",
    prompt: "Compare two numbers: \\(A = 4.2 \\times 10^7\\) and \\(B = 7.9 \\times 10^6\\). Which is greater?",
    opts: [
      { text: "A > B", correct: true, m: "" },
      { text: "B > A", correct: false, m: "Judged by coefficient 7.9 > 4.2 while ignoring the higher power 10^7 on A." },
      { text: "A = B", correct: false, m: "Assumed values were approximately equal." },
      { text: "Cannot be compared", correct: false, m: "Both numbers are fully determined in scientific notation and directly comparable." }
    ],
    hints: {
      h1: "Compare the exponents of 10 first before looking at coefficients.",
      h2: "Number A has power 7; Number B has power 6.",
      h3: "A higher power of 10 dominates the overall magnitude.",
      h4: "4.2 * 10^7 = 42,000,000 while 7.9 * 10^6 = 7,900,000."
    },
    xp: 10
  },
  {
    id: "ep_dd_28",
    tag: "Ex 2B Q4(b)",
    prompt: "Compare two microscopic masses: \\(P = 3.6 \\times 10^{-8}\\text{ g}\\) and \\(Q = 9.1 \\times 10^{-9}\\text{ g}\\). Which is greater?",
    opts: [
      { text: "P > Q", correct: true, m: "" },
      { text: "Q > P", correct: false, m: "Assumed -9 is greater than -8, confusing negative exponent ordering." },
      { text: "P = Q", correct: false, m: "Assumed difference between negative powers was negligible." },
      { text: "Cannot be determined", correct: false, m: "Quantities are exact numerical values with identical units." }
    ],
    hints: {
      h1: "For negative numbers, -8 is greater than -9.",
      h2: "10^(-8) is ten times larger than 10^(-9).",
      h3: "Rewrite P in terms of 10^(-9): P = 36 * 10^(-9).",
      h4: "Compare 36 * 10^(-9) against 9.1 * 10^(-9)."
    },
    xp: 10
  }
];

module.exports = { DEEPDIVE_QUESTIONS };
