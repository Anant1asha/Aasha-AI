import * as fs from 'fs';
import * as path from 'path';
import { IRAssembler, AgentProposalsInput } from '../canonical-ir/ir_assembler';
import { validateCanonicalIR } from '../canonical-ir/canonical_ir_schema';
import { V6Compiler } from './v6_compiler';

// Full Agent Proposals for Class 8 Mathematics: Exponents and Powers
// Curricular Source: Math Matrix 8, Chapter 2 ("Exponents and Powers"); board/edition details remain unverified.
// Contract Binding: Aasha-AI/content/contracts/Mathematics_Class8_exponents_and_powers.yaml
// Resource selection is determined at compile time from registry evidence; this label alone is not a match.

const exponentsPowersProposal: AgentProposalsInput = {
  chapter_id: 'c8_math_exponents_powers',
  title: 'Exponents and Powers',
  grade: 8,
  subject: 'Mathematics',
  board: 'Unspecified — Math Matrix 8 source scan',
  source_pdf_hash: 'sha256:883160b55ef8a9d107cda802b97ed763ed255ffbcca9131a8a63744ac5877a20',
  source_documents: [
    { id: 'math-matrix-8-ch2-part-1', file_name: 'MDS grade 8th math exponent part 1.pdf', sha256: '883160b55ef8a9d107cda802b97ed763ed255ffbcca9131a8a63744ac5877a20', page_count: 6 },
    { id: 'math-matrix-8-ch2-part-2', file_name: 'MDS grade 8th math exponent part 2.pdf', sha256: '73307fe342b0f61958c514d09668135cfb05e99cbce53203aa2ceb116b71fc35', page_count: 5 },
  ],
  raw_objectives: [
    {
      description: 'Understand the exponential notation, distinguishing base and power, and apply sign rules for odd/even powers of negative rational numbers.',
      bloom_level: 'understand',
      success_criteria: ['Identify base and exponent in exponential notation', 'Evaluate odd and even powers of negative numbers accurately'],
    },
    {
      description: 'Reason and apply the concept of negative integral exponents as multiplicative inverses and reciprocal fractions.',
      bloom_level: 'apply',
      success_criteria: ['Transform negative exponents into reciprocal positive powers', 'Compute values of rational bases with negative powers'],
    },
    {
      description: 'Master and apply the 5 fundamental laws of exponents with integral powers to simplify complex numerical and algebraic expressions.',
      bloom_level: 'apply',
      success_criteria: ['Execute product, quotient, and power of power laws correctly', 'Apply zero exponent identity a^0 = 1 for any non-zero base'],
    },
    {
      description: 'Solve exponential equations by transforming expressions to common bases and equating exponents.',
      bloom_level: 'analyze',
      success_criteria: ['Align LHS and RHS to identical prime or rational bases', 'Formulate and solve linear equations in the exponent variable'],
    },
    {
      description: 'Convert extreme astronomical and microscopic scientific measurements between usual decimal form and standard scientific notation.',
      bloom_level: 'analyze',
      success_criteria: ['Express numbers in standard form k * 10^n with 1 <= k < 10', 'Compare real-world physical dimensions and perform arithmetic on scientific numbers'],
    },
  ],
  raw_concepts: [
    {
      name: 'Exponential Notation and Sign Rules',
      definition: 'Repeated multiplication of a rational number by itself is expressed as exponential notation \\(a^n\\), where \\(a\\) is the base and \\(n\\) is the exponent or index. For any fraction, \\((\\frac{p}{q})^n = \\frac{p^n}{q^n}\\). A negative base raised to an odd power retains a negative value, whereas raised to an even power produces a positive value.',
    },
    {
      name: 'Negative Integral Exponents and Reciprocals',
      definition: 'A negative integral exponent indicates repeated division and represents the multiplicative inverse of the corresponding positive power: \\(a^{-n} = \\frac{1}{a^n}\\). For any non-zero rational fraction, \\((\\frac{p}{q})^{-n} = (\\frac{q}{p})^n\\). The product of a non-zero number and its multiplicative inverse always equals 1.',
    },
    {
      name: 'The Five Fundamental Laws of Exponents',
      definition: 'For non-zero rational bases and integral exponents: (1) Product Law: \\(a^m \\times a^n = a^{m+n}\\); (2) Quotient Law: \\(a^m \\div a^n = a^{m-n}\\); (3) Power of a Power: \\((a^m)^n = a^{mn}\\); (4) Power of a Product: \\(a^m \\times b^m = (ab)^m\\); and (5) Zero Exponent Law: \\(a^0 = 1\\) for every non-zero base \\(a\\).',
    },
    {
      name: 'Solving Exponential Equations',
      definition: 'An exponential equation contains an unknown variable in the exponent. When two exponential expressions with the same non-zero base (other than 1 or -1) are equal, their exponents must be equal: if \\(a^x = a^y\\), then \\(x = y\\). Unknown terms are isolated by aligning both sides to common bases.',
    },
    {
      name: 'Standard Form and Scientific Notation',
      definition: 'Scientific notation represents extreme numbers in the normalized form \\(k \\times 10^n\\), where \\(1 \\le k < 10\\) and \\(n\\) is an integer. For numbers smaller than 1, shifting the decimal point to the right produces a negative exponent \\(n\\). For numbers greater than 10, shifting to the left produces a positive exponent \\(n\\).',
    },
  ],
  raw_misconceptions: [
    {
      concept_name: 'Negative Integral Exponents and Reciprocals',
      name: 'Base Negation Error',
      description: 'Student confuses a negative exponent with a negative base value, assuming a negative power turns the whole number negative.',
      remediation: 'A negative sign in an exponent designates reciprocal division (multiplicative inverse), not an arithmetic negative sign on the base.',
    },
    {
      concept_name: 'The Five Fundamental Laws of Exponents',
      name: 'Base Multiplication Confusion',
      description: 'Student multiplies the bases together when applying the product law (e.g. treating 2^3 * 2^4 as 4^7).',
      remediation: 'When identical bases are multiplied, the base represents the unchanging factor; only the counts of factors (exponents) combine.',
    },
    {
      concept_name: 'The Five Fundamental Laws of Exponents',
      name: 'Quotient Exponent Division',
      description: 'Student divides exponents by each other during base division instead of subtracting them (e.g. treating 3^6 / 3^2 as 3^3).',
      remediation: 'Division of like bases cancels common factors one by one; therefore, denominator exponent count subtracts from numerator count.',
    },
    {
      concept_name: 'The Five Fundamental Laws of Exponents',
      name: 'Zero Power Value Confusion',
      description: 'Student assumes raising a non-zero base to power zero equals zero or equals the base itself.',
      remediation: 'By the quotient rule, dividing any non-zero quantity by itself yields an exponent difference of zero and an arithmetic value of 1.',
    },
    {
      concept_name: 'Standard Form and Scientific Notation',
      name: 'Non-Normalized Coefficient Error',
      description: 'Student leaves multiple non-zero digits before the decimal point (e.g. writing 35 * 10^4 instead of 3.5 * 10^5).',
      remediation: 'Standard scientific notation requires the leading decimal coefficient to contain strictly one non-zero digit to the left of the point.',
    },
  ],
  raw_assessments: [
    // ════════════════════════════════════════════════════════════════════════
    // TIER 1: WARM-UP (Foundational Powers, Sign Rules, Simple Reciprocals)
    // ════════════════════════════════════════════════════════════════════════
    {
      objective_index: 0,
      concept_name: 'Exponential Notation and Sign Rules',
      question_type: 'mcq',
      prompt: 'What is the value of \\((-1)^7\\)?',
      options: [
        { text: '-1', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '1', is_correct: false, misconception_name: 'Base Negation Error', distractor_explanation: 'Raising a negative unit base to an odd exponent retains a negative sign through unpaired factors.' },
        { text: '-7', is_correct: false, distractor_explanation: 'Exponents represent repeated multiplication of the base, not multiplication of base with exponent.' },
        { text: '7', is_correct: false, distractor_explanation: 'Repeated multiplication of unit factors cannot increase the absolute numerical magnitude above one.' },
      ],
      hints: {
        H1: 'Notice whether the exponent 7 is an even number or an odd number.',
        H2: 'An odd number of negative signs leaves one unpaired negative factor.',
        H3: 'Recall the rule: (-1) raised to any odd natural number retains its negative sign.',
        H4: 'Multiplying negative one by itself seven times pairs three negatives into positives, leaving one negative.',
      },
    },
    {
      objective_index: 0,
      concept_name: 'Exponential Notation and Sign Rules',
      question_type: 'mcq',
      prompt: 'Evaluate \\(13^3\\) into expanded standard value.',
      options: [
        { text: '2,197', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '169', is_correct: false, distractor_explanation: 'This value corresponds to 13 multiplied twice; a cube requires three factors of thirteen.' },
        { text: '39', is_correct: false, distractor_explanation: 'Multiplying base thirteen by the exponent three confuses repeated addition with repeated multiplication.' },
        { text: '2,097', is_correct: false, distractor_explanation: 'Carefully compute intermediate multiplication: 169 multiplied by 13.' },
      ],
      hints: {
        H1: 'Identify the power: 13 raised to exponent 3 means 13 * 13 * 13.',
        H2: 'First calculate the square: 13 * 13.',
        H3: 'Now multiply the product 169 by 13 once more.',
        H4: 'Compute: 169 * 10 + 169 * 3.',
      },
    },
    {
      objective_index: 0,
      concept_name: 'Exponential Notation and Sign Rules',
      question_type: 'mcq',
      prompt: 'Which power notation correctly expresses \\(-15,625\\)?',
      options: [
        { text: '\\((-25)^3\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\((-5)^6\\)', is_correct: false, misconception_name: 'Base Negation Error', distractor_explanation: 'An even exponent applied to a negative base creates a positive number rather than a negative quantity.' },
        { text: '\\((-5)^5\\)', is_correct: false, distractor_explanation: 'Multiplying five factors of negative five reaches negative 3,125.' },
        { text: '\\((-25)^2\\)', is_correct: false, distractor_explanation: 'Squaring negative twenty-five reaches positive 625.' },
      ],
      hints: {
        H1: 'Observe the negative sign in the given number -15,625.',
        H2: 'A negative power result requires an odd exponent on a negative base.',
        H3: 'Factor 15625: 25 * 25 * 25 = 25^3.',
        H4: 'Since the final value is negative, (-25)^3 preserves the negative sign.',
      },
    },
    {
      objective_index: 1,
      concept_name: 'Negative Integral Exponents and Reciprocals',
      question_type: 'mcq',
      prompt: 'What is the rational value of \\(4^{-3}\\)?',
      options: [
        { text: '\\(\\frac{1}{64}\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '-64', is_correct: false, misconception_name: 'Base Negation Error', distractor_explanation: 'A negative sign in an exponent inverts the factor into a denominator; it does not turn the product negative.' },
        { text: '64', is_correct: false, distractor_explanation: 'A negative exponent represents reciprocal division rather than positive direct power.' },
        { text: '\\(-\\frac{1}{64}\\)', is_correct: false, distractor_explanation: 'With a positive base, reciprocal inversion retains positivity without introducing negative signs.' },
      ],
      hints: {
        H1: 'Focus on the negative sign in the exponent -3.',
        H2: 'Recall the rule: a^(-n) = 1 / a^n.',
        H3: 'Invert the base into the denominator: 1 / 4^3.',
        H4: 'Calculate 4 * 4 * 4 in the denominator.',
      },
    },
    {
      objective_index: 1,
      concept_name: 'Negative Integral Exponents and Reciprocals',
      question_type: 'mcq',
      prompt: 'Express \\((\\frac{5}{3})^{-3}\\) as a rational number of the form \\(\\frac{p}{q}\\).',
      options: [
        { text: '\\(\\frac{27}{125}\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(-\\frac{27}{125}\\)', is_correct: false, misconception_name: 'Base Negation Error', distractor_explanation: 'The negative exponent indicates fractional inversion; both numerator and denominator remain positive.' },
        { text: '\\(\\frac{125}{27}\\)', is_correct: false, distractor_explanation: 'Invert the fraction to remove the negative exponent before cubing numerator and denominator.' },
        { text: '\\(\\frac{9}{15}\\)', is_correct: false, distractor_explanation: 'Exponents indicate repeated multiplication, not multiplication of numerator and denominator by three.' },
      ],
      hints: {
        H1: 'Observe the negative exponent on the rational fraction (5/3).',
        H2: 'Apply the fractional reciprocal law: (p/q)^(-n) = (q/p)^n.',
        H3: 'Swap numerator and denominator: (3/5)^3.',
        H4: 'Cube both terms: 3^3 / 5^3.',
      },
    },
    {
      objective_index: 2,
      concept_name: 'The Five Fundamental Laws of Exponents',
      question_type: 'mcq',
      prompt: 'What is the value of \\((5^0 - 7^0) \\times 3^3 \\div 6^0\\)?',
      options: [
        { text: '0', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '27', is_correct: false, misconception_name: 'Zero Power Value Confusion', distractor_explanation: 'Subtracting equal zero-power terms reduces the inner bracket to zero.' },
        { text: '1', is_correct: false, distractor_explanation: 'Parentheses evaluate to zero prior to subsequent multiplication.' },
        { text: '-27', is_correct: false, distractor_explanation: 'The term inside parentheses evaluates to 1 - 1, which completely eliminates the factor.' },
      ],
      hints: {
        H1: 'Look at the terms raised to exponent 0: 5^0 and 7^0.',
        H2: 'Recall the zero exponent law: any non-zero base to power zero equals 1.',
        H3: 'Evaluate the bracket first: (1 - 1).',
        H4: 'Multiply zero by any finite power product.',
      },
    },
    {
      objective_index: 2,
      concept_name: 'The Five Fundamental Laws of Exponents',
      question_type: 'mcq',
      prompt: 'Simplify and express as a single power: \\(9^5 \\times 6^5\\).',
      options: [
        { text: '\\(54^5\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(54^{10}\\)', is_correct: false, misconception_name: 'Base Multiplication Confusion', distractor_explanation: 'When bases differ but exponents match, exponents do not add; bases multiply under the shared exponent.' },
        { text: '\\(15^5\\)', is_correct: false, distractor_explanation: 'Bases undergo multiplication under a common power, rather than basic addition.' },
        { text: '\\(15^{10}\\)', is_correct: false, distractor_explanation: 'Both bases must multiply, and the shared exponent stays unchanged.' },
      ],
      hints: {
        H1: 'Notice that both factors share the exact same exponent 5.',
        H2: 'Recall the common power law: a^m * b^m = (ab)^m.',
        H3: 'Combine the bases under a single exponent: (9 * 6)^5.',
        H4: 'Compute the base product: 9 * 6.',
      },
    },

    // ════════════════════════════════════════════════════════════════════════
    // TIER 2: DEEP DIVE (Fraction Inversions, Unknown Multipliers, Equations)
    // ════════════════════════════════════════════════════════════════════════
    {
      objective_index: 1,
      concept_name: 'Negative Integral Exponents and Reciprocals',
      question_type: 'mcq',
      prompt: 'Simplify the sum of reciprocal powers: \\((\\frac{1}{2})^{-2} + (\\frac{1}{3})^{-2} + (\\frac{1}{4})^{-2}\\).',
      options: [
        { text: '29', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(\\frac{1}{29}\\)', is_correct: false, distractor_explanation: 'Inverting each unit fraction turns each denominator into an integer before squaring.' },
        { text: '9', is_correct: false, distractor_explanation: 'Squaring 2, 3, and 4 generates separate terms that sum together.' },
        { text: '-29', is_correct: false, misconception_name: 'Base Negation Error', distractor_explanation: 'Negative exponents invert positive fractions into positive integers; no negative signs enter.' },
      ],
      hints: {
        H1: 'Invert each fraction first: (1/a)^(-2) = a^2.',
        H2: 'Calculate the three squared integers: 2^2, 3^2, and 4^2.',
        H3: 'Add the three values: 4 + 9 + 16.',
        H4: 'Sum the numbers: 13 + 16.',
      },
    },
    {
      objective_index: 2,
      concept_name: 'The Five Fundamental Laws of Exponents',
      question_type: 'mcq',
      prompt: 'Simplify: \\([6^{-1} + (\\frac{3}{2})^{-1}]^{-1}\\).',
      options: [
        { text: '\\(\\frac{6}{5}\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(\\frac{5}{6}\\)', is_correct: false, distractor_explanation: 'Do not forget the outermost exponent -1, which inverts the bracketed sum.' },
        { text: '\\(\\frac{1}{6}\\)', is_correct: false, distractor_explanation: 'Add both reciprocal fractions using their common denominator six.' },
        { text: '6', is_correct: false, distractor_explanation: 'Compute 1/6 + 2/3 = 5/6, then take the reciprocal.' },
      ],
      hints: {
        H1: 'Evaluate the two inner terms: 6^(-1) = 1/6 and (3/2)^(-1) = 2/3.',
        H2: 'Find a common denominator to add the inner fractions: 1/6 + 4/6.',
        H3: 'The inner sum is 5/6.',
        H4: 'Apply the outer negative exponent: (5/6)^(-1).',
      },
    },
    {
      objective_index: 1,
      concept_name: 'Negative Integral Exponents and Reciprocals',
      question_type: 'mcq',
      prompt: 'By what number should \\((-6)^{-1}\\) be multiplied so that the product becomes \\(15^{-1}\\)?',
      options: [
        { text: '\\(-\\frac{2}{5}\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(\\frac{2}{5}\\)', is_correct: false, distractor_explanation: 'Dividing a positive target fraction by a negative factor leaves a negative quotient.' },
        { text: '\\(-\\frac{5}{2}\\)', is_correct: false, distractor_explanation: 'Invert the divisor when converting division to multiplication.' },
        { text: '\\(-\\frac{1}{90}\\)', is_correct: false, distractor_explanation: 'Divide the product by the known factor rather than multiplying them together.' },
      ],
      hints: {
        H1: 'Set up the equation: (-6)^(-1) * y = 15^(-1).',
        H2: 'Write with unit fractions: (-1/6) * y = 1/15.',
        H3: 'Isolate y: y = (1/15) / (-1/6) = (1/15) * (-6).',
        H4: 'Simplify -6/15 by dividing numerator and denominator by 3.',
      },
    },
    {
      objective_index: 2,
      concept_name: 'The Five Fundamental Laws of Exponents',
      question_type: 'mcq',
      prompt: 'What number should be multiplied with \\(5^{-3}\\) so that the product becomes \\(125\\)?',
      options: [
        { text: '\\(5^6\\) (or 15,625)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(5^0\\) (or 1)', is_correct: false, misconception_name: 'Base Multiplication Confusion', distractor_explanation: 'Multiplying by one retains the reciprocal fraction rather than reaching the target whole number.' },
        { text: '\\(5^3\\) (or 125)', is_correct: false, distractor_explanation: 'Multiplying opposite powers cancels to 5^0 = 1, not the target power.' },
        { text: '\\(5^{-6}\\)', is_correct: false, misconception_name: 'Base Negation Error', distractor_explanation: 'A negative power of five decreases the numerical value further into smaller decimals.' },
      ],
      hints: {
        H1: 'Write 125 as a power of 5: 125 = 5^3.',
        H2: 'Set up the equation: 5^(-3) * y = 5^3.',
        H3: 'Isolate y: y = 5^3 / 5^(-3).',
        H4: 'Apply the quotient law: 3 - (-3) = 3 + 3.',
      },
    },
    {
      objective_index: 3,
      concept_name: 'Solving Exponential Equations',
      question_type: 'mcq',
      prompt: 'Find the value of \\(x\\) in: \\((\\frac{5}{3})^{-5} \\times (\\frac{5}{3})^{-11} = (\\frac{5}{3})^{8x}\\).',
      options: [
        { text: 'x = -2', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: 'x = 2', is_correct: false, distractor_explanation: 'Summing negative exponents -5 and -11 keeps a negative sign.' },
        { text: 'x = -16', is_correct: false, distractor_explanation: 'Remember to divide the combined exponent -16 by the coefficient 8.' },
        { text: 'x = 1', is_correct: false, distractor_explanation: 'Equate the sum of left exponents directly to 8x.' },
      ],
      hints: {
        H1: 'Apply the product law to the left-hand side: add exponents -5 and -11.',
        H2: 'The combined left exponent is -5 + (-11) = -16.',
        H3: 'Since bases match, equate exponents: 8x = -16.',
        H4: 'Divide -16 by 8 to isolate x.',
      },
    },
    {
      objective_index: 3,
      concept_name: 'Solving Exponential Equations',
      question_type: 'mcq',
      prompt: 'Solve for \\(x\\): \\((-\\frac{1}{2})^{-19} \\div (-\\frac{1}{2})^8 = (-\\frac{1}{2})^{-2x + 1}\\).',
      options: [
        { text: 'x = 14', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: 'x = -14', is_correct: false, distractor_explanation: 'Be attentive with signs when isolating variable terms across the equals sign.' },
        { text: 'x = 13', is_correct: false, distractor_explanation: 'Subtracting positive 8 from -19 reaches -27; then isolate the variable term.' },
        { text: 'x = 28', is_correct: false, distractor_explanation: 'Divide -28 by -2 to find x.' },
      ],
      hints: {
        H1: 'Apply the quotient law to the LHS: subtract the denominator exponent: -19 - 8.',
        H2: 'The left-hand exponent simplifies to -27.',
        H3: 'Equate exponents: -2x + 1 = -27.',
        H4: 'Subtract 1 from both sides to get -2x = -28, then divide by -2.',
      },
    },
    {
      objective_index: 4,
      concept_name: 'Standard Form and Scientific Notation',
      question_type: 'mcq',
      prompt: 'Express the decimal \\(0.000000000086\\) in standard scientific form.',
      options: [
        { text: '\\(8.6 \\times 10^{-11}\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(86 \\times 10^{-12}\\)', is_correct: false, misconception_name: 'Non-Normalized Coefficient Error', distractor_explanation: 'The leading factor in scientific notation must have only one non-zero digit before the decimal point.' },
        { text: '\\(8.6 \\times 10^{11}\\)', is_correct: false, distractor_explanation: 'Decimals smaller than one require negative exponents of base ten.' },
        { text: '\\(0.86 \\times 10^{-10}\\)', is_correct: false, distractor_explanation: 'The coefficient must be greater than or equal to one.' },
      ],
      hints: {
        H1: 'Locate the first non-zero digit: 8.',
        H2: 'Place the decimal point immediately after 8 to get 8.6.',
        H3: 'Count how many places the decimal shifts to the right from original position to 8.6.',
        H4: 'Shifting 11 places to the right gives an exponent of -11.',
      },
    },
    {
      objective_index: 4,
      concept_name: 'Standard Form and Scientific Notation',
      question_type: 'mcq',
      prompt: 'Write \\(3.05 \\times 10^{-6}\\) in usual decimal form.',
      options: [
        { text: '0.00000305', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '0.0000305', is_correct: false, distractor_explanation: 'Ensure decimal shifts account for the single whole digit.' },
        { text: '3,050,000', is_correct: false, distractor_explanation: 'A negative exponent shifts the decimal point leftward, creating a small decimal fraction.' },
        { text: '0.000000305', is_correct: false, distractor_explanation: 'Moving 6 places left shifts past the digit 3 plus five additional zero placeholders.' },
      ],
      hints: {
        H1: 'Observe the exponent -6: move the decimal point 6 places to the left.',
        H2: 'Moving one place left passes digit 3: .305.',
        H3: 'The remaining 5 shifts require inserting 5 zeros before 3.',
        H4: 'Write the result: 0.00000305.',
      },
    },

    // ════════════════════════════════════════════════════════════════════════
    // TIER 3: BOSS CHALLENGE (Textbook MCQs, HOTS & Astronomy Applications)
    // ════════════════════════════════════════════════════════════════════════
    {
      objective_index: 2,
      concept_name: 'The Five Fundamental Laws of Exponents',
      question_type: 'mcq',
      prompt: 'Evaluate the expression: \\(\\frac{2^{2001} + 2^{1999}}{2^{2000} - 2^{1999}}\\).',
      options: [
        { text: '5', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '2', is_correct: false, distractor_explanation: 'Factor out the lowest power 2^1999 from both numerator and denominator.' },
        { text: '\\(2^{1000} + 1\\)', is_correct: false, distractor_explanation: 'Exponents cannot be subtracted across fraction bars without factoring out common base multiples.' },
        { text: '10', is_correct: false, distractor_explanation: 'Calculate bracket terms after factoring: (4 + 1) / (2 - 1).' },
      ],
      hints: {
        H1: 'Notice the common base 2 and very close exponent values: 1999, 2000, 2001.',
        H2: 'Factor out 2^1999 from both numerator and denominator.',
        H3: 'Numerator becomes 2^1999 * (2^2 + 1) = 2^1999 * (4 + 1).',
        H4: 'Denominator becomes 2^1999 * (2^1 - 1) = 2^1999 * 1. Cancel common factor 2^1999.',
      },
    },
    {
      objective_index: 1,
      concept_name: 'Negative Integral Exponents and Reciprocals',
      question_type: 'mcq',
      prompt: 'When simplified, the algebraic expression \\(x^{-1} + y^{-1}\\) is equal to:',
      options: [
        { text: '\\(\\frac{x + y}{xy}\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: 'x + y', is_correct: false, distractor_explanation: 'Negative exponents invert variables into denominators before addition.' },
        { text: 'xy', is_correct: false, distractor_explanation: 'Fraction addition retains separate denominator relationships.' },
        { text: '\\(\\frac{1}{xy}\\)', is_correct: false, distractor_explanation: 'Adding 1/x + 1/y requires cross-multiplying numerators over common denominator xy.' },
      ],
      hints: {
        H1: 'Rewrite each term with positive exponents: 1/x + 1/y.',
        H2: 'Identify the common denominator for adding fractions with denominators x and y.',
        H3: 'Convert each fraction: y/(xy) + x/(xy).',
        H4: 'Combine the numerators over the common denominator.',
      },
    },
    {
      objective_index: 0,
      concept_name: 'Exponential Notation and Sign Rules',
      question_type: 'mcq',
      prompt: 'Find the numerical value of \\(x + x(x^x)\\) when \\(x = 2\\).',
      options: [
        { text: '10', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '16', is_correct: false, distractor_explanation: 'Follow order of operations: evaluate innermost power 2^2 first, then multiply by 2, then add 2.' },
        { text: '18', is_correct: false, distractor_explanation: 'Carefully compute: 2 + 2 * (2^2) = 2 + 2 * 4.' },
        { text: '36', is_correct: false, distractor_explanation: 'Do not add the outer terms before completing multiplication.' },
      ],
      hints: {
        H1: 'Substitute x = 2 into the expression: 2 + 2 * (2^2).',
        H2: 'Evaluate the exponent first: 2^2 = 4.',
        H3: 'Multiply the outer factor: 2 * 4 = 8.',
        H4: 'Complete the addition: 2 + 8.',
      },
    },
    {
      objective_index: 1,
      concept_name: 'Negative Integral Exponents and Reciprocals',
      question_type: 'mcq',
      prompt: 'What is the multiplicative inverse of \\(10^{-100}\\)?',
      options: [
        { text: '\\(10^{100}\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(10^{-100}\\)', is_correct: false, distractor_explanation: 'Multiplying a number by itself does not equal 1 unless the power exponent cancels to zero.' },
        { text: '\\(-10^{100}\\)', is_correct: false, misconception_name: 'Base Negation Error', distractor_explanation: 'The multiplicative inverse inverts exponent sign; it never negates the base.' },
        { text: '\\(10^{-50}\\)', is_correct: false, distractor_explanation: 'Adding -50 to -100 does not equal zero.' },
      ],
      hints: {
        H1: 'Recall the definition: the product of a number and its multiplicative inverse must equal 1.',
        H2: 'Set up: 10^(-100) * 10^k = 10^0 = 1.',
        H3: 'Apply the product law: -100 + k = 0.',
        H4: 'Solve for k: k = 100.',
      },
    },
    {
      objective_index: 2,
      concept_name: 'The Five Fundamental Laws of Exponents',
      question_type: 'mcq',
      prompt: 'Evaluate: \\((3^2)^3 + (\\frac{2}{3})^0 + 3^5\\).',
      options: [
        { text: '973', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '930', is_correct: false, distractor_explanation: 'Ensure all three terms are calculated and included in the sum.' },
        { text: '932', is_correct: false, distractor_explanation: 'Check the zero power term: any non-zero fraction to power zero equals one.' },
        { text: '950', is_correct: false, distractor_explanation: 'Sum the three evaluated components accurately without omitting terms.' },
      ],
      hints: {
        H1: 'Apply power of power to the first term: (3^2)^3 = 3^(2 * 3) = 3^6.',
        H2: 'Evaluate 3^6: 729.',
        H3: 'Apply zero power rule: (2/3)^0 = 1. Evaluate 3^5: 243.',
        H4: 'Add: 729 + 1 + 243.',
      },
    },
    {
      objective_index: 3,
      concept_name: 'Solving Exponential Equations',
      question_type: 'mcq',
      prompt: 'If \\(\\frac{10}{3} \\times 3^x - 3^{x-1} = 81\\), find the value of \\(x\\).',
      options: [
        { text: 'x = 3', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: 'x = 2', is_correct: false, distractor_explanation: 'Factor out the common variable term before equating with the target power.' },
        { text: 'x = 4', is_correct: false, distractor_explanation: 'Equate exponents after converting both sides to identical bases.' },
        { text: 'x = 1', is_correct: false, distractor_explanation: 'Carefully isolate the variable term across the equals sign.' },
      ],
      hints: {
        H1: 'Express 3^(x-1) as (3^x) / 3 = (1/3) * 3^x.',
        H2: 'Factor out 3^x: (10/3 - 1/3) * 3^x = (9/3) * 3^x = 3 * 3^x.',
        H3: 'Simplify the LHS: 3^(x + 1). Write 81 as base 3: 81 = 3^4.',
        H4: 'Equate exponents: x + 1 = 4, so x = 4 - 1.',
      },
    },
    {
      objective_index: 2,
      concept_name: 'The Five Fundamental Laws of Exponents',
      question_type: 'mcq',
      prompt: 'What is the reciprocal of the rational number \\((\\frac{3}{2})^{-2} \\div (\\frac{1}{3})^{-3}\\)?',
      options: [
        { text: '\\(\\frac{243}{4}\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(\\frac{4}{243}\\)', is_correct: false, distractor_explanation: 'Remember to invert the final rational quotient to obtain the requested reciprocal.' },
        { text: '\\(\\frac{241}{4}\\)', is_correct: false, distractor_explanation: 'Calculate 9 * 27 for the inverted product.' },
        { text: '\\(\\frac{240}{4}\\)', is_correct: false, distractor_explanation: 'Carefully compute (2/3)^2 / 3^3 = (4/9) / 27.' },
      ],
      hints: {
        H1: 'Simplify (3/2)^(-2) = (2/3)^2 = 4/9.',
        H2: 'Simplify (1/3)^(-3) = 3^3 = 27.',
        H3: 'Divide: (4/9) / 27 = 4 / (9 * 27) = 4/243.',
        H4: 'Take the reciprocal of 4/243 by inverting numerator and denominator.',
      },
    },
    {
      objective_index: 3,
      concept_name: 'Solving Exponential Equations',
      question_type: 'mcq',
      prompt: 'If \\([((\\frac{1}{3})^{-1} - (\\frac{1}{4})^{-1})^{-1}]^m = 1\\), what is the least positive integral value of \\(m\\)?',
      options: [
        { text: 'm = 2', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: 'm = 1', is_correct: false, distractor_explanation: 'An odd power on base -1 preserves a negative value.' },
        { text: 'm = 0', is_correct: false, distractor_explanation: 'The problem explicitly asks for the least positive integer (greater than zero).' },
        { text: 'm = 3', is_correct: false, distractor_explanation: 'An odd exponent preserves the negative sign on base -1.' },
      ],
      hints: {
        H1: 'Evaluate the inner terms: (1/3)^(-1) = 3 and (1/4)^(-1) = 4.',
        H2: 'Subtract inside brackets: 3 - 4 = -1.',
        H3: 'Take reciprocal: (-1)^(-1) = -1. The expression simplifies to (-1)^m = 1.',
        H4: 'Recall that (-1) raised to an even power equals 1; the smallest positive even integer is 2.',
      },
    },
    {
      objective_index: 2,
      concept_name: 'The Five Fundamental Laws of Exponents',
      question_type: 'mcq',
      prompt: 'Prove the algebraic identity: \\(\\frac{1}{1 + x^{q-p}} + \\frac{1}{1 + x^{p-q}}\\). What does it simplify to?',
      options: [
        { text: '1', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '0', is_correct: false, distractor_explanation: 'Express the negative index difference as a reciprocal fraction to establish matching denominators.' },
        { text: '\\(x^{p+q}\\)', is_correct: false, distractor_explanation: 'Multiply numerator and denominator of the second term by x^q to align denominators.' },
        { text: '2', is_correct: false, distractor_explanation: 'Summing the unified fractions forms (x^p + x^q) / (x^p + x^q) = 1.' },
      ],
      hints: {
        H1: 'Express x^(p-q) as 1 / x^(q-p).',
        H2: 'Substitute into the second fraction: 1 / [1 + 1 / x^(q-p)].',
        H3: 'Multiply numerator and denominator of second term by x^(q-p).',
        H4: 'Add the two fractions with identical denominators: [1 + x^(q-p)] / [1 + x^(q-p)].',
      },
    },
    {
      objective_index: 4,
      concept_name: 'Standard Form and Scientific Notation',
      question_type: 'mcq',
      prompt: 'A spacecraft travels at \\(12\\text{ km/s} = 1.2 \\times 10^4\\text{ m/s}\\). If distance to Moon is \\(3.48 \\times 10^8\\text{ m}\\), how much time is required to reach the Moon?',
      options: [
        { text: '\\(2.9 \\times 10^4\\text{ s}\\) (approx 8 hours 3.3 minutes)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(2.9 \\times 10^3\\text{ s}\\)', is_correct: false, distractor_explanation: 'Divide exponents of ten: 10^8 / 10^4 = 10^(8 - 4) = 10^4.' },
        { text: '\\(4.176 \\times 10^{12}\\text{ s}\\)', is_correct: false, distractor_explanation: 'Time equals distance divided by speed, not distance multiplied by speed.' },
        { text: '\\(2.9 \\times 10^5\\text{ s}\\)', is_correct: false, distractor_explanation: 'Direct coefficient division leaves the base value unchanged while powers of ten subtract directly.' },
      ],
      hints: {
        H1: 'Apply the physics formula: Time = Distance / Speed.',
        H2: 'Divide coefficients: 3.48 / 1.2.',
        H3: 'Divide powers of ten: 10^8 / 10^4 = 10^(8 - 4).',
        H4: 'Combine: 2.9 * 10^4 seconds.',
      },
    },
  ],
  word_map: {
    "exponent": "घातांक (एक्सपोनेंट)",
    "exponents": "घातांक (एक्सपोनेंट्स)",
    "power": "घात (पावर)",
    "powers": "घातें (पावर्स)",
    "base": "आधार (बेस)",
    "bases": "आधार (बेसेस)",
    "integral": "पूर्णांक (इंटीग्रल)",
    "reciprocal": "व्युत्क्रम (रेसिप्रोकल)",
    "reciprocals": "व्युत्क्रम (रेसिप्रोकल्स)",
    "multiplicative": "गुणात्मक (मल्टीप्लिकेटिव)",
    "inverse": "प्रतिलोम (इन्वर्स)",
    "product": "गुणनफल (प्रोडक्ट)",
    "quotient": "भागफल (कोटिएंट)",
    "law": "नियम (लॉ)",
    "laws": "नियम (लॉज़)",
    "notation": "संकेतन (नोटेशन)",
    "scientific": "वैज्ञानिक (साइंटिफिक)",
    "standard": "मानक रूप (स्टैंडर्ड)",
    "form": "रूप (फॉर्म)",
    "decimal": "दशमलव (डेसिमल)",
    "equation": "समीकरण (इक्वेशन)",
    "equations": "समीकरण (इक्वेशन्स)",
    "variable": "चर (वेरिएबल)",
    "simplify": "सरल करना (सिम्प्लिफाई)",
    "evaluate": "मान ज्ञात करना (इवैल्यूएट)",
    "express": "व्यक्त करना (एक्सप्रेस)",
    "rational": "परिमेय संख्या (रैशनल)",
    "positive": "धनात्मक (पॉज़िटिव)",
    "negative": "ऋणात्मक (नेगेटिव)",
    "numerator": "अंश (न्यूमरेटर)",
    "denominator": "हर (डिनॉमिनेटर)",
    "multiply": "गुणा करना (मल्टीप्लाई)",
    "divide": "भाग देना (डिवाइड)",
    "add": "जोड़ना (ऐड)",
    "subtract": "घटाना (सबट्रैक्ट)",
    "spinner": "चकरी (स्पिनर)",
    "arena": "अखाड़ा / मैदान (एरीना)",
    "battle": "मुकाबला (बैटल)",
  },
};

export function compileExponentsPowersChapter() {
  console.log('='.repeat(80));
  console.log(' COMPILING CLASS 8 MATHEMATICS: EXPONENTS AND POWERS (CHAPTER 2)');
  console.log('='.repeat(80));

  console.log('\n1. Normalizing Agent Proposals into Canonical Prototype IR...');
  const { canonicalIR, validationErrors } = IRAssembler.assemble(exponentsPowersProposal);

  if (validationErrors.length > 0) {
    console.error('ERROR: Assembled Canonical IR validation failed:', validationErrors);
    process.exit(1);
  }
  console.log('   ✓ Assembled Canonical IR successfully. Entity IDs namespaced.');

  console.log('\n2. Validating Canonical IR Schema & Invariants...');
  const validation = validateCanonicalIR(canonicalIR);
  if (!validation.valid) {
    console.error('ERROR: Schema validation failed:', validation.errors);
    process.exit(1);
  }
  console.log('   ✓ Canonical IR v1.1.0 Strict Schema: PASS');
  console.log('   ✓ Basic schema spoiler heuristic: PASS (adversarial answer-leakage review remains required)');
  console.log('   ✓ 4-Tier Scaffolding Hints: PASS');
  console.log('   • Offline runtime and zero-network verification: PENDING');
  console.log('   ✓ Experience acceptance metadata: PASS (runtime criteria still require verification)');

  console.log('\n3. Running V6 Compiler...');
  const sourcePdfDir = path.resolve(__dirname, '../../content/pdfs');
  const compiled = V6Compiler.compilePair(canonicalIR, {
    sourcePdfPaths: {
      'math-matrix-8-ch2-part-1': path.join(sourcePdfDir, 'MDS grade 8th math exponent part 1.pdf'),
      'math-matrix-8-ch2-part-2': path.join(sourcePdfDir, 'MDS grade 8th math exponent part 2.pdf'),
    },
    requireFullSourceCoverage: true,
  });
  if (compiled.errors.length > 0) {
    console.error('ERROR: V6 Compilation Failed:', compiled.errors);
    process.exit(1);
  }
  console.log('   Source coverage:', compiled.sourceCoverage.status, '(' + compiled.sourceCoverage.fully_covered + '/' + compiled.sourceCoverage.total_items + ' mapped); source PDF hash:', compiled.sourceCoverage.source_hash_status);
  console.log('   English/Hindi LLE coverage:', compiled.lleCoverage.status, '(' + compiled.lleCoverage.coverage_percent + '%)');
  console.log('   ✓ Standalone learning + assessment packages generated (' + compiled.learningHtml.length + ' + ' + compiled.assessmentHtml.length + ' bytes)');

  const chaptersDir = path.resolve(__dirname, '../../chapters');
  if (!fs.existsSync(chaptersDir)) {
    fs.mkdirSync(chaptersDir, { recursive: true });
  }

  const learningPath = path.resolve(chaptersDir, 'ExponentsPowers_Class8_learning.html');
  fs.writeFileSync(learningPath, compiled.learningHtml, 'utf-8');
  console.log('   ✓ Written learning HTML to:', learningPath);

  const assessmentPath = path.resolve(chaptersDir, 'ExponentsPowers_Class8_assessment.html');
  fs.writeFileSync(assessmentPath, compiled.assessmentHtml, 'utf-8');
  console.log('   ✓ Written assessment HTML to:', assessmentPath);

  const irPath = path.resolve(chaptersDir, 'ExponentsPowers_Class8_canonical_ir.json');
  fs.writeFileSync(irPath, JSON.stringify(canonicalIR, null, 2), 'utf-8');
  console.log('   ✓ Written Canonical IR to:', irPath);

  // Generate Teacher HIL Proposal
  const proposalPath = path.resolve(chaptersDir, 'ExponentsPowers_Class8.proposal.md');
  const proposalContent = `# AASHA AIOS — Teacher Review Proposal
**Chapter**: Class 8 Mathematics — Exponents and Powers (\`c8_math_exponents_powers\`)
**Status**: Draft only — source verification, coverage reconciliation, runtime checks, and teacher review are pending.

## Evidence available

- The Canonical IR assembled by this script.
- The source hash supplied to the compiler (must be the digest of the actual textbook PDF).
- The capability match evidence embedded in the generated standalone files.

## Review still required

- Confirm the exact textbook edition and source PDF; map every section, example, activity, and exercise to generated content.
- Review the learner artifact and assessment artifact separately, including English/Hindi language quality and answer-feedback behavior.
- Verify any proposed reusable foundation's provenance, license, offline operation, accessibility, and adaptation scope. A catalog entry is not approval.
- Run offline, touch-target, browser, size, TEAS, and no-answer-leakage checks before distribution.
- Record the teacher/reviewer decision through the governed approval path.

इस सामग्री को अभी पूर्ण अध्याय, प्रमाणित मूल्यांकन, या स्वीकृत संसाधन नहीं माना गया है। स्रोत-पुस्तक और कवरेज की समीक्षा आवश्यक है।
`;
  fs.writeFileSync(proposalPath, proposalContent, 'utf-8');
  console.log('   ✓ Written Teacher HIL Proposal to:', proposalPath);

  console.log('\n=== EXPONENTS AND POWERS CLASS 8 COMPILED SUCCESSFULLY ===\n');
}

if (require.main === module || process.argv[1]?.includes('compile_exponents_powers_class8')) {
  compileExponentsPowersChapter();
}
