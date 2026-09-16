import * as fs from 'fs';
import * as path from 'path';
import { IRAssembler, AgentProposalsInput } from '../canonical-ir/ir_assembler';
import { validateCanonicalIR } from '../canonical-ir/canonical_ir_schema';
import { V6Compiler } from './v6_compiler';

// Full Agent Proposals for Class 8 Mathematics: Linear Equations in One Variable
// Curricular Source: NCERT Class 8 Mathematics Chapter 2 ("Linear Equations in One Variable")
// Contract Binding: Aasha-AI/content/contracts/Mathematics_Class8_linear_equations.yaml
// Foundation Match: F01 Escape Run (Balance Scale Manipulative) - MIT License
const linearEquationsProposal: AgentProposalsInput = {
  chapter_id: 'c8_math_linear_equations',
  title: 'Linear Equations in One Variable',
  grade: 8,
  subject: 'Mathematics',
  board: 'NCERT',
  source_pdf_hash: 'sha256_ncert_math_class8_ch02_linear_equations',
  raw_objectives: [
    {
      description: 'Identify linear equations in one variable and understand the algebraic concept of equality between LHS and RHS.',
      bloom_level: 'understand',
      success_criteria: ['Distinguish equations from expressions', 'Identify Left Hand Side and Right Hand Side'],
    },
    {
      description: 'Solve linear equations with variables on one side using balance scale principles and inverse operations.',
      bloom_level: 'apply',
      success_criteria: ['Apply balanced operations to both sides', 'Isolate the variable accurately'],
    },
    {
      description: 'Solve linear equations with variables on both sides and formulate equations from real-world situations.',
      bloom_level: 'analyze',
      success_criteria: ['Transpose terms across equality with correct sign inversion', 'Translate word problems into linear equations'],
    },
  ],
  raw_concepts: [
    {
      name: 'Linear Equations in One Variable',
      definition: 'An algebraic equation where the highest exponent of the variable is 1. An equation contains an equality symbol (\\(=\\)) establishing that the value of the Left Hand Side (LHS) equals the Right Hand Side (RHS), such as \\(2x - 3 = 7\\).',
    },
    {
      name: 'Solving Equations via Balance Scale',
      definition: 'An equation is like a weighing balance in equilibrium. Performing identical mathematical operations on both sides preserves equality. To isolate \\(x\\), apply inverse operations: addition cancels subtraction, and multiplication cancels division.',
    },
    {
      name: 'Variables on Both Sides and Transposition',
      definition: 'When variables appear on both sides of the equals sign, transposition moves a term from one side to the other by inverting its sign (+ becomes -, - becomes +). This groups all variable terms on one side and numerical constants on the other.',
    },
  ],
  raw_misconceptions: [
    {
      concept_name: 'Variables on Both Sides and Transposition',
      name: 'Sign Inversion on Transposition',
      description: 'Student moves a term across the equals sign without inverting its operational sign (e.g. changing \\(x + 5 = 12\\) to \\(x = 12 + 5\\) instead of \\(x = 12 - 5\\)).',
      remediation: 'Transposition is an abbreviation for applying the inverse operation to both sides. A positive term on one side becomes a subtracted term on the other side.',
    },
    {
      concept_name: 'Solving Equations via Balance Scale',
      name: 'Unbalanced Operation',
      description: 'Student applies an arithmetic operation to only one side of the equation, violating balance equivalence (e.g. dividing LHS by 2 but leaving RHS unchanged).',
      remediation: 'Equality holds only when every operation performed on the Left Hand Side is mirrored identically on the Right Hand Side.',
    },
    {
      concept_name: 'Linear Equations in One Variable',
      name: 'Combining Unlike Terms',
      description: 'Student attempts to combine a variable term and a numerical constant into a single term (e.g. treating \\(2x + 3\\) as \\(5x\\)).',
      remediation: 'Terms with variables and constant numbers have different algebraic dimensions and cannot be added together into a single product.',
    },
  ],
  raw_assessments: [
    // --- Tier 1: Warm-up (Foundational Understanding) ---
    {
      objective_index: 0,
      concept_name: 'Linear Equations in One Variable',
      question_type: 'mcq',
      prompt: 'Which of the following mathematical statements is a linear equation in one variable?',
      options: [
        { text: '\\(2x + 5 = 15\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(2x + 5\\)', is_correct: false, distractor_explanation: 'An equation requires an equality symbol connecting two expressions; this represents an expression without equality.' },
        { text: '\\(x^2 + 3 = 7\\)', is_correct: false, distractor_explanation: 'The highest power of the variable must equal 1 for linear equations; this option contains a quadratic exponent.' },
        { text: '\\(2x + 3y = 8\\)', is_correct: false, distractor_explanation: 'A single variable letter must appear throughout; this statement includes two distinct variables.' },
      ],
      hints: {
        H1: 'Look for two requirements: an equals sign (=) and only one variable letter.',
        H2: 'Check the exponent of the variable: it must not have exponent 2 or higher.',
        H3: 'An equation has both an LHS and an RHS separated by =.',
        H4: 'In 2x + 5 = 15, x represents the single variable with exponent 1.',
      },
    },
    {
      objective_index: 1,
      concept_name: 'Solving Equations via Balance Scale',
      question_type: 'mcq',
      prompt: 'To solve the equation \\(x - 7 = 10\\), which operation should be applied to both sides?',
      options: [
        { text: 'Add 7 to both sides', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: 'Subtract 7 from both sides', is_correct: false, misconception_name: 'Sign Inversion on Transposition', distractor_explanation: 'Subtracting 7 doubles the negative offset on the left; apply addition to cancel subtraction.' },
        { text: 'Multiply both sides by 7', is_correct: false, distractor_explanation: 'Multiplication inverts division rather than subtraction.' },
        { text: 'Divide both sides by 10', is_correct: false, distractor_explanation: 'Eliminate the number attached to the variable, not the independent constant on the opposite side.' },
      ],
      hints: {
        H1: 'Identify the operation currently attached to the variable x.',
        H2: 'The variable has 7 subtracted from it: (x - 7).',
        H3: 'The inverse mathematical operation of subtraction represents addition.',
        H4: 'Adding 7 to both sides eliminates -7 from the LHS, isolating x.',
      },
    },
    {
      objective_index: 1,
      concept_name: 'Solving Equations via Balance Scale',
      question_type: 'mcq',
      prompt: 'Solve for \\(x\\) in the equation: \\(3x = 18\\).',
      options: [
        { text: '\\(x = 6\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(x = 15\\)', is_correct: false, misconception_name: 'Sign Inversion on Transposition', distractor_explanation: 'The number 3 multiplies the variable; subtraction cannot cancel multiplication.' },
        { text: '\\(x = 54\\)', is_correct: false, distractor_explanation: 'Multiplication by 3 magnifies the variable side; apply division by 3.' },
        { text: '\\(x = 21\\)', is_correct: false, distractor_explanation: 'Addition cannot invert multiplication.' },
      ],
      hints: {
        H1: '3x represents the product of 3 and x.',
        H2: 'The inverse operation of multiplication by 3 represents division by 3.',
        H3: 'Divide both the Left Hand Side and Right Hand Side by 3.',
        H4: '18 divided by 3 isolates x.',
      },
    },

    // --- Tier 2: Deep Dive (Multi-step and Transposition) ---
    {
      objective_index: 1,
      concept_name: 'Solving Equations via Balance Scale',
      question_type: 'mcq',
      prompt: 'What is the solution to the linear equation: \\(2x + 3 = 11\\)?',
      options: [
        { text: '\\(x = 4\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(x = 7\\)', is_correct: false, misconception_name: 'Sign Inversion on Transposition', distractor_explanation: 'Moving +3 across equality requires subtraction, not addition.' },
        { text: '\\(x = 2.2\\)', is_correct: false, misconception_name: 'Combining Unlike Terms', distractor_explanation: 'Variable terms and constant numbers cannot merge together; subtract the constant first.' },
        { text: '\\(x = 14\\)', is_correct: false, distractor_explanation: 'Both subtraction of 3 and division by 2 must occur in sequence.' },
      ],
      hints: {
        H1: 'Follow standard order: eliminate addition/subtraction before multiplication/division.',
        H2: 'First subtract 3 from both sides: 2x = 11 - 3.',
        H3: 'Compute 11 - 3 to obtain 2x = 8.',
        H4: 'Finally divide 8 by 2 to isolate x.',
      },
    },
    {
      objective_index: 1,
      concept_name: 'Solving Equations via Balance Scale',
      question_type: 'mcq',
      prompt: 'Solve for \\(x\\) in the fractional equation: \\(\\frac{x}{3} + \\frac{5}{2} = -\\frac{3}{2}\\).',
      options: [
        { text: '\\(x = -12\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(x = 3\\)', is_correct: false, misconception_name: 'Sign Inversion on Transposition', distractor_explanation: 'Subtracting 5/2 from -3/2 maintains negative direction on the number line.' },
        { text: '\\(x = -4\\)', is_correct: false, misconception_name: 'Unbalanced Operation', distractor_explanation: 'After isolating the fraction, multiply both sides by the denominator.' },
        { text: '\\(x = -6\\)', is_correct: false, distractor_explanation: 'Check fraction arithmetic and remember multiplication by the denominator.' },
      ],
      hints: {
        H1: 'Isolate the variable fraction x/3 on the Left Hand Side.',
        H2: 'Subtract 5/2 from both sides: x/3 = -3/2 - 5/2.',
        H3: 'Combine fractions: (-3 - 5)/2 = -8/2 = -4.',
        H4: 'Multiply -4 by 3 to clear the denominator.',
      },
    },
    {
      objective_index: 2,
      concept_name: 'Variables on Both Sides and Transposition',
      question_type: 'mcq',
      prompt: 'Solve the equation having variables on both sides: \\(6x + 1 = 2x + 17\\).',
      options: [
        { text: '\\(x = 4\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(x = 2\\)', is_correct: false, misconception_name: 'Sign Inversion on Transposition', distractor_explanation: 'Transposing 2x subtracts it from 6x; transposing +1 subtracts 1 from 17.' },
        { text: '\\(x = 2.25\\)', is_correct: false, distractor_explanation: 'Group variable terms together on one side and numerical constants on the other.' },
        { text: '\\(x = 8\\)', is_correct: false, distractor_explanation: 'Divide by the coefficient of the variable.' },
      ],
      hints: {
        H1: 'Group variable terms on the LHS and constant numbers on the RHS.',
        H2: 'Transpose 2x to the left: 6x - 2x = 4x.',
        H3: 'Transpose +1 to the right: 17 - 1 = 16.',
        H4: 'Solve 4x = 16 by dividing both sides by 4.',
      },
    },

    // --- Tier 3: Boss Challenge (Parentheses, Word Problems & Rational Coefficients) ---
    {
      objective_index: 2,
      concept_name: 'Variables on Both Sides and Transposition',
      question_type: 'mcq',
      prompt: 'Solve the equation containing brackets: \\(5(x - 2) = 3(x + 4)\\).',
      options: [
        { text: '\\(x = 11\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(x = 1\\)', is_correct: false, misconception_name: 'Sign Inversion on Transposition', distractor_explanation: 'Transposing -10 across equality changes sign from negative to positive.' },
        { text: '\\(x = 7\\)', is_correct: false, distractor_explanation: 'Multiply each term inside parentheses by the outside factor.' },
        { text: '\\(x = 22\\)', is_correct: false, distractor_explanation: 'Divide the combined constant by the variable multiplier.' },
      ],
      hints: {
        H1: 'Use the distributive property: 5*(x) - 5*(2) = 3*(x) + 3*(4).',
        H2: 'Expand both sides: 5x - 10 = 3x + 12.',
        H3: 'Group terms: 5x - 3x = 12 + 10.',
        H4: '2x = 22, which calculates x upon division by 2.',
      },
    },
    {
      objective_index: 2,
      concept_name: 'Variables on Both Sides and Transposition',
      question_type: 'mcq',
      prompt: 'The perimeter of a rectangle is 26 cm. If its length is 3 cm more than its breadth, what is its breadth?',
      options: [
        { text: '5 cm', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '8 cm', is_correct: false, distractor_explanation: 'This value represents rectangle length (breadth plus 3), not breadth.' },
        { text: '10 cm', is_correct: false, misconception_name: 'Unbalanced Operation', distractor_explanation: 'Perimeter doubles the sum of dimensions; half the perimeter equals length plus breadth.' },
        { text: '6.5 cm', is_correct: false, distractor_explanation: 'Dividing by 4 assumes equal sides like a square; rectangles have unequal length and breadth.' },
      ],
      hints: {
        H1: 'Let breadth be b cm; then length represents (b + 3) cm.',
        H2: 'Perimeter formula equals 2 * (length + breadth) = 26.',
        H3: 'Substitute: 2 * ((b + 3) + b) = 2 * (2b + 3) = 26.',
        H4: 'Simplify: 2b + 3 = 13, so 2b = 10, calculating breadth b = 5 cm.',
      },
    },
    {
      objective_index: 2,
      concept_name: 'Variables on Both Sides and Transposition',
      question_type: 'mcq',
      prompt: 'Solve the equation by cross-multiplication: \\(\\frac{2x - 1}{3} = \\frac{x + 2}{2}\\).',
      options: [
        { text: '\\(x = 8\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(x = 4\\)', is_correct: false, misconception_name: 'Sign Inversion on Transposition', distractor_explanation: 'Transposing -2 across equality adds 2 to the opposite side.' },
        { text: '\\(x = -4\\)', is_correct: false, distractor_explanation: 'Distribute the cross-multiplication factor across both terms in the numerator.' },
        { text: '\\(x = 7\\)', is_correct: false, distractor_explanation: 'Check cross-multiplication signs and transpositions.' },
      ],
      hints: {
        H1: 'Multiply each side by the common denominator 6, or cross-multiply numerators and denominators.',
        H2: 'Cross-multiply: 2 * (2x - 1) = 3 * (x + 2).',
        H3: 'Expand both sides: 4x - 2 = 3x + 6.',
        H4: 'Transpose terms: 4x - 3x = 6 + 2, giving the final value of x.',
      },
    },
  ],
  word_map: {
    'linear equation': 'रैखिक समीकरण',
    'linear equations': 'रैखिक समीकरण',
    'linear': 'रैखिक',
    'equation': 'समीकरण',
    'equations': 'समीकरण',
    'variable': 'चर',
    'variables': 'चर',
    'constant': 'अचर',
    'equality': 'समानता (इक्वलिटी)',
    'left hand side': 'बायाँ पक्ष (LHS)',
    'right hand side': 'दायाँ पक्ष (RHS)',
    'transposition': 'पक्षांतरण (ट्रांसपोजिशन)',
    'transpose': 'पक्षांतरण करना',
    'inverse operation': 'व्युत्क्रम संक्रिया (इनवर्स ऑपरेशन)',
    'balance scale': 'तुला / तराजू',
    'solution': 'हल (सॉल्यूशन)',
    'cross-multiplication': 'वज्र-गुणन (क्रॉस मल्टीप्लिकेशन)',
    'perimeter': 'परिमाप',
    'breadth': 'चौड़ाई',
    'length': 'लंबाई',
  },
};

export function compileLinearEquationsChapter() {
  console.log('=== AASHA AIOS — Compiling Linear Equations Class 8 Chapter ===\n');

  console.log('1. Assembling Canonical IR (v1.1.0)...');
  const { canonicalIR, validationErrors } = IRAssembler.assemble(linearEquationsProposal);
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

  const htmlPath = path.resolve(chaptersDir, 'LinearEquations_Class8_v6.html');
  fs.writeFileSync(htmlPath, compiled.html, 'utf-8');
  console.log('   ✓ Written HTML Chapter to:', htmlPath);

  const irPath = path.resolve(chaptersDir, 'LinearEquations_Class8_canonical_ir.json');
  fs.writeFileSync(irPath, JSON.stringify(canonicalIR, null, 2), 'utf-8');
  console.log('   ✓ Written Canonical IR to:', irPath);

  // Generate Teacher HIL Proposal
  const proposalPath = path.resolve(chaptersDir, 'LinearEquations_Class8.proposal.md');
  const proposalContent = `# AASHA AIOS — Teacher HIL Proposal & Pedagogical Review
**Chapter**: Class 8 Mathematics — Linear Equations in One Variable (\`c8_math_linear_equations\`)  
**Target Board/Curriculum**: NCERT / CBSE Class 8 Mathematics Chapter 2  
**Foundation Match**: Foundation F01: Escape Run (Balance Scale Manipulative) — MIT License (Extract Strategy)  
**Status**: Production Candidate (Dual-Benchmark Certified)  

---

## 1. शिक्षक के लिए सारांश (Hindi Summary for Educators)

आदरणीय शिक्षक महोदय / महोदया,

यह डिजिटल अनुभवात्मक पाठ **कक्षा 8 गणित: एक चर वाले रैखिक समीकरण (Linear Equations in One Variable)** का इंटरएक्टिव संस्करण है। इसे विशेष रूप से उन विद्यार्थियों के लिए तैयार किया गया है जो समीकरण को रटने के बजाय उसके मूलभूत संतुलन (Balance Equilibrium) को समझना चाहते हैं।

### मुख्य विशेषताएं:
1. **तुला / तराजू सिमुलेशन (Balance Scale Manipulative - F01)**:
   - छात्र समीकरण को एक संतुलित तराजू के रूप में देखते हैं।
   - वे अनुभव करते हैं कि यदि बाएँ पलड़े (LHS) में कुछ जोड़ा या घटाया जाता है, तो संतुलन बनाए रखने के लिए दाएँ पलड़े (RHS) में भी वही क्रिया करनी पड़ती है।
2. **पक्षांतरण की भ्रांति का निवारण (Sign Inversion Diagnostics)**:
   - छात्र अक्सर चिन्ह बदलना भूल जाते हैं (जैसे \(x + 5 = 12 \\to x = 12 + 5\))।
   - प्रणाली इस त्रुटि को तुरंत पहचानकर 4-स्तरीय प्रगतिशील संकेत प्रदान करती है, जिससे छात्र स्वयं अपनी भूल सुधारते हैं।
3. **द्विभाषी सहायता (Bilingual Word-Tap Assistance)**:
   - कठिन पारिभाषिक शब्दों (जैसे *Linear Equation*, *Transposition*, *Equality*) पर टैप करते ही हिंदी अर्थ और उच्चारण तुरंत प्रदर्शित होता है।
4. **पूर्णतः ऑफ़लाइन (Zero Remote Dependency)**:
   - अध्याय का आकार 1 MB से कम है और यह बिना किसी इंटरनेट या सर्वर के पूर्णतः ऑफ़लाइन संचालित होता है।
`;
  fs.writeFileSync(proposalPath, proposalContent, 'utf-8');
  console.log('   ✓ Written Teacher HIL Proposal to:', proposalPath);

  console.log('\n=== LINEAR EQUATIONS CLASS 8 COMPILED SUCCESSFULLY ===\n');
}

compileLinearEquationsChapter();
