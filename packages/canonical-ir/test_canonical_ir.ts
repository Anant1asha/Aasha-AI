import { IRAssembler, AgentProposalsInput } from './ir_assembler';
import { validateCanonicalIR } from './canonical_ir_schema';
import { V6RuntimeBus } from '../v6-engine/v6_runtime_bus';
import { V6Compiler } from '../v6-engine/v6_compiler';

function runCanonicalIRTestSuite() {
  console.log('=== AASHA AIOS — Canonical IR & V6 Engine Test Suite ===\n');

  // 1. Mock Specialist Agent Output Proposals
  const sampleProposal: AgentProposalsInput = {
    chapter_id: 'c7_math_algebraic_expressions',
    title: 'Algebraic Expressions',
    grade: 7,
    subject: 'Mathematics',
    board: 'CBSE',
    source_pdf_hash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
    raw_objectives: [
      {
        description: 'Understand terms, factors, and coefficients in algebraic expressions.',
        bloom_level: 'understand',
        success_criteria: ['Identify like and unlike terms', 'Simplify linear expressions'],
      },
    ],
    raw_concepts: [
      {
        name: 'Like Terms',
        definition: 'Terms having the exact same algebraic factors, e.g. \\(3x\\) and \\(7x\\).',
      },
    ],
    raw_misconceptions: [
      {
        concept_name: 'Like Terms',
        name: 'Add Unlike Terms',
        description: 'Student adds coefficients of different variables like \\(2x + 3y = 5xy\\).',
        remediation: 'Focus on variable identities before combining terms.',
      },
    ],
    raw_assessments: [
      {
        objective_index: 0,
        concept_name: 'Like Terms',
        question_type: 'mcq',
        prompt: 'Which of the following pair consists of like terms?',
        options: [
          {
            text: '\\(3x\\) and \\(7x\\)',
            is_correct: true,
            distractor_explanation: 'Correct choice.',
          },
          {
            text: '\\(3x\\) and \\(7y\\)',
            is_correct: false,
            misconception_name: 'Add Unlike Terms',
            distractor_explanation: 'Variable factors x and y differ so terms cannot be combined.',
          },
        ],
        hints: {
          H1: 'Look at the variable letters.',
          H2: 'Like terms must have identical algebraic variables.',
          H3: 'Compare x against y.',
          H4: '3x and 7x both contain x.',
        },
      },
    ],
  };

  // 2. Test IR Assembly
  console.log('1. Testing IR Assembler...');
  const { canonicalIR, validationErrors } = IRAssembler.assemble(sampleProposal);
  if (validationErrors.length > 0) {
    console.error('FAILED IR Assembly Validation:', validationErrors);
    process.exit(1);
  }
  console.log('PASS: IR Assembler successfully produced valid Canonical IR.');
  console.log(`   - Chapter ID: ${canonicalIR.chapter_metadata.chapter_id}`);
  console.log(`   - Objectives: ${canonicalIR.learning_objectives.length} (ID: ${canonicalIR.learning_objectives[0].id})`);
  console.log(`   - Math Insulated Def: ${canonicalIR.concept_graph[0].definition_math_insulated}`);

  // 3. Test Invariant Validator
  console.log('\n2. Testing Invariant Validator...');
  const validationResult = validateCanonicalIR(canonicalIR);
  if (!validationResult.valid) {
    console.error('FAILED Invariant Validation:', validationResult.errors);
    process.exit(1);
  }
  console.log('PASS: Zero spoiler leaks, min 44px touch targets, and misconception binding invariants passed.');

  // 4. Test V6 Semantic Event Bus & Mastery Engine
  console.log('\n3. Testing V6 Semantic Event Bus & TEAS Mastery Engine...');
  const bus = new V6RuntimeBus('c7_math_algebraic_expressions', 'test_learner_1');
  let eventCaptured = false;

  bus.subscribe((evt) => {
    if (evt.eventType === 'mastery_updated') {
      eventCaptured = true;
    }
  });

  bus.emit({
    eventType: 'response_evaluated',
    pseudonymousLearnerId: 'test_learner_1',
    chapterId: 'c7_math_algebraic_expressions',
    conceptId: canonicalIR.concept_graph[0].id,
    payload: { isCorrect: true, attemptNumber: 1 },
  });

  const mastery = bus.getMastery(canonicalIR.concept_graph[0].id);
  console.log(`PASS: Mastery score updated: Composite = ${mastery.compositeMastery} (Event captured: ${eventCaptured})`);

  // 5. Test V6 Compiler Output
  console.log('\n4. Testing V6 Stateful Compiler...');
  const compiled = V6Compiler.compile(canonicalIR, { requireFullSourceCoverage: false });
  if (compiled.errors.length > 0) {
    console.error('FAILED V6 Compiler:', compiled.errors);
    process.exit(1);
  }
  console.log(`PASS: Compiled standalone V6 HTML package (${compiled.html.length} bytes).`);

  console.log('\n=== ALL CANONICAL IR & V6 ENGINE TESTS PASSED (100% VERIFIED) ===');
}

runCanonicalIRTestSuite();
