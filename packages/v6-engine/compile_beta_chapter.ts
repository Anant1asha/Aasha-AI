import * as fs from 'fs';
import * as path from 'path';
import { IRAssembler, AgentProposalsInput } from '../canonical-ir/ir_assembler';
import { validateCanonicalIR } from '../canonical-ir/canonical_ir_schema';
import { V6Compiler } from './v6_compiler';

// Full Agent Proposals for Class 7 Mathematics: Algebraic Expressions
const betaProposal: AgentProposalsInput = {
  chapter_id: 'c7_math_algebraic_expressions',
  title: 'Algebraic Expressions',
  grade: 7,
  subject: 'Mathematics',
  board: 'NCERT',
  source_pdf_hash: 'sha256_ncert_math_class7_ch12_algebraic_expressions',
  raw_objectives: [
    {
      description: 'Identify terms, factors, and numerical/algebraic coefficients in given expressions.',
      bloom_level: 'understand',
      success_criteria: ['List all terms in an expression', 'Identify numerical coefficients with correct signs'],
    },
    {
      description: 'Distinguish between like and unlike terms and combine like terms correctly.',
      bloom_level: 'apply',
      success_criteria: ['Group like terms with identical algebraic factors', 'Add and subtract algebraic expressions'],
    },
    {
      description: 'Formulate algebraic expressions from real-world contexts and evaluate them for given values.',
      bloom_level: 'analyze',
      success_criteria: ['Translate word statements into expressions', 'Evaluate expressions by numerical substitution'],
    },
  ],
  raw_concepts: [
    {
      name: 'Terms and Coefficients',
      definition: 'An algebraic expression is formed from terms. For example, in \\(4x^2 - 3xy\\), the terms are \\(4x^2\\) and \\(-3xy\\). In the term \\(4x^2\\), 4 is the numerical coefficient and \\(x^2\\) is the variable factor.',
    },
    {
      name: 'Like and Unlike Terms',
      definition: 'Terms having the exact same algebraic factors are called like terms, such as \\(2xy\\) and \\(-5xy\\). Terms with different algebraic factors are unlike terms, such as \\(2xy\\) and \\(2x\\).',
    },
    {
      name: 'Addition and Subtraction of Expressions',
      definition: 'Only like terms can be combined by adding or subtracting their coefficients. For example, \\(7x + 5x = (7+5)x = 12x\\), whereas unlike terms such as \\(7x + 5y\\) cannot be merged.',
    },
  ],
  raw_misconceptions: [
    {
      concept_name: 'Like and Unlike Terms',
      name: 'Add Unlike Terms',
      description: 'Student combines coefficients of different variables, treating unlike terms as like terms (e.g. \\(2x + 3y = 5xy\\) or \\(4x + 3 = 7x\\)).',
      remediation: 'Terms with distinct variable factors cannot be combined into a single term; they remain separate in the sum.',
    },
    {
      concept_name: 'Terms and Coefficients',
      name: 'Sign Inversion Error',
      description: 'Student ignores the minus sign preceding a term, misidentifying negative coefficients as positive (e.g. coefficient of \\(-5x\\) reported as 5).',
      remediation: 'The sign immediately preceding a term belongs to its coefficient. For \\(-5x\\), the numerical coefficient is \\(-5\\).',
    },
    {
      concept_name: 'Like and Unlike Terms',
      name: 'Exponent Confusion',
      description: 'Student combines terms with the same variable letter but different exponents (e.g. treating \\(x^2\\) and \\(x\\) as like terms).',
      remediation: 'Like terms require identical variables raised to identical powers. \\(x^2\\) and \\(x\\) have different powers and are unlike.',
    },
  ],
  raw_assessments: [
    {
      objective_index: 0,
      concept_name: 'Terms and Coefficients',
      question_type: 'mcq',
      prompt: 'In the algebraic expression \\(7x - 5y + 3\\), what is the numerical coefficient of the term containing \\(y\\)?',
      options: [
        { text: '\\(-5\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(5\\)', is_correct: false, misconception_name: 'Sign Inversion Error', distractor_explanation: 'The minus sign preceding the term forms part of the coefficient.' },
        { text: '\\(7\\)', is_correct: false, distractor_explanation: 'This value corresponds to the coefficient of the variable x, not y.' },
        { text: '\\(3\\)', is_correct: false, distractor_explanation: 'This number represents the constant term without any variable factor.' },
      ],
      hints: {
        H1: 'Find the term that contains the letter y.',
        H2: 'Look closely at the mathematical sign placed directly before 5y.',
        H3: 'A term includes its preceding operational symbol as part of the coefficient.',
        H4: 'The term is -5y, meaning the numerical multiplier is -5.',
      },
    },
    {
      objective_index: 1,
      concept_name: 'Like and Unlike Terms',
      question_type: 'mcq',
      prompt: 'Which of the following pairs contains like terms?',
      options: [
        { text: '\\(4ab\\) and \\(-7ba\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(4a\\) and \\(4b\\)', is_correct: false, misconception_name: 'Add Unlike Terms', distractor_explanation: 'Matching numerical multipliers does not make terms with differing variables like terms.' },
        { text: '\\(3x^2\\) and \\(3x\\)', is_correct: false, misconception_name: 'Exponent Confusion', distractor_explanation: 'Different powers on the variable prevent terms from being like terms.' },
        { text: '\\(5xy\\) and \\(5x\\)', is_correct: false, misconception_name: 'Add Unlike Terms', distractor_explanation: 'The variable factors must be completely identical in every component.' },
      ],
      hints: {
        H1: 'Focus solely on the variable letters and their powers.',
        H2: 'Order of multiplication does not change algebraic factors (ab equals ba).',
        H3: 'Both terms must share the exact same algebraic factors regardless of coefficient.',
        H4: 'In 4ab and -7ba, the variable factors are a and b in both terms.',
      },
    },
    {
      objective_index: 0,
      concept_name: 'Terms and Coefficients',
      question_type: 'mcq',
      prompt: 'How many terms are in the expression \\(3x^2y - 2xy + 5x - 8\\)?',
      options: [
        { text: '4 terms', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '3 terms', is_correct: false, distractor_explanation: 'Do not overlook the constant term at the end of the expression.' },
        { text: '5 terms', is_correct: false, distractor_explanation: 'Count only parts separated by plus and minus operators.' },
        { text: '1 term', is_correct: false, distractor_explanation: 'Multiple parts separated by signs make this a multi-term expression.' },
      ],
      hints: {
        H1: 'Terms are separated by plus (+) and minus (-) operators.',
        H2: 'Count each separated piece including the constant number.',
        H3: 'Look at the chunks: 3x^2y, -2xy, 5x, and -8.',
        H4: 'There are four distinct separated parts in this expression.',
      },
    },
    {
      objective_index: 1,
      concept_name: 'Addition and Subtraction of Expressions',
      question_type: 'mcq',
      prompt: 'Simplify the expression by combining terms: \\(5x + 3y - 2x + 4y\\).',
      options: [
        { text: '\\(3x + 7y\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(10xy\\)', is_correct: false, misconception_name: 'Add Unlike Terms', distractor_explanation: 'Terms containing differing variables cannot be merged into a single product.' },
        { text: '\\(7x + 7y\\)', is_correct: false, distractor_explanation: 'Check the subtraction sign placed before 2x when grouping x terms.' },
        { text: '\\(3x - y\\)', is_correct: false, distractor_explanation: 'Notice both y terms have positive additions (3y and +4y).' },
      ],
      hints: {
        H1: 'Group like terms with the same variable letter together.',
        H2: 'Combine the x terms: 5x - 2x, then combine the y terms: 3y + 4y.',
        H3: 'Calculate (5 - 2)x and (3 + 4)y separately.',
        H4: '5x - 2x yields 3x, and 3y + 4y yields 7y.',
      },
    },
    {
      objective_index: 1,
      concept_name: 'Addition and Subtraction of Expressions',
      question_type: 'mcq',
      prompt: 'What is the result when \\(3a - 2b\\) is subtracted from \\(5a + 4b\\)?',
      options: [
        { text: '\\(2a + 6b\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(2a + 2b\\)', is_correct: false, misconception_name: 'Sign Inversion Error', distractor_explanation: 'Subtracting a negative quantity results in adding that quantity: 4b - (-2b).' },
        { text: '\\(8a + 2b\\)', is_correct: false, distractor_explanation: 'Subtract the coefficients of the second expression from the first: 5a - 3a.' },
        { text: '\\(2a - 6b\\)', is_correct: false, distractor_explanation: 'Carefully compute 4b - (-2b) = 4b + 2b.' },
      ],
      hints: {
        H1: 'Write out the full subtraction with brackets: (5a + 4b) - (3a - 2b).',
        H2: 'Distribute the negative sign across both terms inside the bracket.',
        H3: 'The operation becomes 5a + 4b - 3a + 2b.',
        H4: 'Group: (5a - 3a) + (4b + 2b) = 2a + 6b.',
      },
    },
    {
      objective_index: 2,
      concept_name: 'Terms and Coefficients',
      question_type: 'mcq',
      prompt: 'Evaluate the expression \\(2x^2 - 3x + 5\\) when \\(x = 2\\).',
      options: [
        { text: '7', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '11', is_correct: false, distractor_explanation: 'Pay attention to the negative sign in front of 3x: 2(4) - 6 + 5.' },
        { text: '15', is_correct: false, distractor_explanation: 'Evaluate powers before multiplication: x^2 = 4, then 2(4) = 8.' },
        { text: '3', is_correct: false, distractor_explanation: 'Carry out operations in correct order: 8 - 6 + 5.' },
      ],
      hints: {
        H1: 'Substitute the number 2 in place of every x.',
        H2: 'Calculate powers first: 2^2 = 4.',
        H3: 'Multiply terms: 2(4) = 8, and 3(2) = 6.',
        H4: 'Combine: 8 - 6 + 5 = 7.',
      },
    },
    {
      objective_index: 2,
      concept_name: 'Addition and Subtraction of Expressions',
      question_type: 'mcq',
      prompt: 'A rectangular field has length \\((3x + 2)\\) meters and breadth \\((2x - 1)\\) meters. What is its perimeter?',
      options: [
        { text: '\\(10x + 2\\) meters', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(5x + 1\\) meters', is_correct: false, distractor_explanation: 'Perimeter calculation requires doubling the combined sum of dimensions rather than taking a single sum.' },
        { text: '\\(6x^2 + x - 2\\) meters', is_correct: false, distractor_explanation: 'This expression represents area (length times breadth), not perimeter.' },
        { text: '\\(10x + 4\\) meters', is_correct: false, distractor_explanation: 'Check constant evaluation: evaluate 2 + (-1) and multiply by 2.' },
      ],
      hints: {
        H1: 'Perimeter of a rectangle is calculated as 2 * (length + breadth).',
        H2: 'First sum the expressions: (3x + 2) + (2x - 1).',
        H3: 'Combine like terms inside: 3x + 2x = 5x, and 2 - 1 = 1 to get (5x + 1).',
        H4: 'Multiply the entire sum by 2: 2 * (5x + 1) = 10x + 2.',
      },
    },
    {
      objective_index: 1,
      concept_name: 'Like and Unlike Terms',
      question_type: 'mcq',
      prompt: 'From the sum of \\(4 + 3x\\) and \\(5 - 4x + 2x^2\\), subtract the sum of \\(3x^2 - 5x\\) and \\(-x^2 + 2x + 5\\). What remains?',
      options: [
        { text: '\\(2x + 4\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(4x^2 + 2x + 4\\)', is_correct: false, distractor_explanation: 'Check x^2 terms: subtracting identical quantities cancels the quadratic terms.' },
        { text: '\\(-2x + 14\\)', is_correct: false, misconception_name: 'Sign Inversion Error', distractor_explanation: 'Carefully compute constant terms: subtract 5 from the combined sum of 4 and 5.' },
        { text: '\\(2x - 4\\)', is_correct: false, distractor_explanation: 'Notice positive constant remainder when subtracting 5 from 9.' },
      ],
      hints: {
        H1: 'Find sum A: (4 + 3x) + (5 - 4x + 2x^2) = 2x^2 - x + 9.',
        H2: 'Find sum B: (3x^2 - 5x) + (-x^2 + 2x + 5) = 2x^2 - 3x + 5.',
        H3: 'Subtract sum B from sum A: (2x^2 - x + 9) - (2x^2 - 3x + 5).',
        H4: '(2x^2 - 2x^2) + (-x - (-3x)) + (9 - 5) = 0 + 2x + 4.',
      },
    },
    {
      objective_index: 2,
      concept_name: 'Addition and Subtraction of Expressions',
      question_type: 'mcq',
      prompt: 'What should be added to \\(x^2 + xy + y^2\\) to obtain \\(2x^2 + 3xy\\)?',
      options: [
        { text: '\\(x^2 + 2xy - y^2\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(x^2 + 2xy + y^2\\)', is_correct: false, misconception_name: 'Sign Inversion Error', distractor_explanation: 'Since the target has no y^2 term, y^2 must be subtracted (-y^2).' },
        { text: '\\(3x^2 + 4xy + y^2\\)', is_correct: false, distractor_explanation: 'Subtract the original expression from the target expression, do not add them.' },
        { text: '\\(x^2 + 4xy - y^2\\)', is_correct: false, distractor_explanation: 'Compute 3xy - xy = 2xy, not 4xy.' },
      ],
      hints: {
        H1: 'Let the required expression be E: (x^2 + xy + y^2) + E = 2x^2 + 3xy.',
        H2: 'Rearrange: E = (2x^2 + 3xy) - (x^2 + xy + y^2).',
        H3: 'Distribute the minus sign: 2x^2 + 3xy - x^2 - xy - y^2.',
        H4: 'Combine like terms: (2x^2 - x^2) + (3xy - xy) - y^2 = x^2 + 2xy - y^2.',
      },
    },
  ],
  word_map: {
    'algebraic expression': 'बीजीय व्यंजक',
    'algebraic': 'बीजीय',
    'expression': 'व्यंजक',
    'variable': 'चर',
    'constant': 'अचर',
    'coefficient': 'गुणांक',
    'coefficients': 'गुणांक',
    'term': 'पद',
    'terms': 'पद',
    'like terms': 'समान पद',
    'unlike terms': 'असमान पद',
    'factor': 'गुणनखंड',
    'factors': 'गुणनखंड',
    'numerical': 'संख्यात्मक',
    'addition': 'योग',
    'subtraction': 'घटाव',
    'perimeter': 'परिमाप',
    'rectangle': 'आयत',
    'value': 'मान',
    'power': 'घात',
    'powers': 'घात',
  },
};

export function compileBetaChapter() {
  console.log('=== AASHA AIOS — Compiling BETA Vertical Slice Chapter ===\n');

  console.log('1. Assembling Canonical IR (v1.1.0)...');
  const { canonicalIR, validationErrors } = IRAssembler.assemble(betaProposal);
  if (validationErrors.length > 0) {
    console.error('ERROR: IR Assembly Validation Failed:', validationErrors);
    process.exit(1);
  }
  console.log('   ✓ Assembled Canonical IR for:', canonicalIR.chapter_metadata.title);

  console.log('\n2. Validating Technical & Pedagogical Invariants...');
  const validation = validateCanonicalIR(canonicalIR);
  if (!validation.valid) {
    console.error('ERROR: Invariant Validation Failed:', validation.errors);
    process.exit(1);
  }
  console.log('   ✓ Touch Target >= 44px: PASS');
  console.log('   ✓ Zero Spoilers in Distractors: PASS');
  console.log('   ✓ Misconception Bindings: PASS');
  console.log('   ✓ Offline-First & No External Requests: PASS');
  console.log('   ✓ Experience Acceptance Contract: PASS');

  console.log('\n3. Running V6 Compiler...');
  const compiled = V6Compiler.compile(canonicalIR);
  if (compiled.errors.length > 0) {
    console.error('ERROR: V6 Compilation Failed:', compiled.errors);
    process.exit(1);
  }
  console.log('   ✓ Standalone HTML5 package generated (' + compiled.html.length + ' bytes)');

  const chaptersDir = path.resolve(__dirname, '../../chapters');
  if (!fs.existsSync(chaptersDir)) {
    fs.mkdirSync(chaptersDir, { recursive: true });
  }

  const htmlPath = path.resolve(chaptersDir, 'AlgebraicExpressions_Class7_BETA_v6.html');
  fs.writeFileSync(htmlPath, compiled.html, 'utf-8');
  console.log('   ✓ Written HTML Chapter to:', htmlPath);

  const irPath = path.resolve(chaptersDir, 'AlgebraicExpressions_Class7_BETA_canonical_ir.json');
  fs.writeFileSync(irPath, JSON.stringify(canonicalIR, null, 2), 'utf-8');
  console.log('   ✓ Written Canonical IR to:', irPath);

  console.log('\n=== BETA VERTICAL SLICE CHAPTER COMPILED SUCCESSFULLY ===\n');
}

compileBetaChapter();
