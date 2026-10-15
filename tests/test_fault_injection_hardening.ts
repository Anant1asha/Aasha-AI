import { runAgent, orchestrateChapterPipeline, QuarantineError, QuarantinePacket, getContextBus } from '../agent_orchestrator';

// Helper: create a valid assessment JSON string (zero spoilers, formal notation)
const VALID_ASSESSMENT_JSON = JSON.stringify({
  assessments: [
    {
      q: 'Solve \\( 2x + 5 = 15 \\)',
      opts: [
        { t: 'x = 5', c: true },
        { t: 'x = 10', c: false, m: 'Subtracted 5 incorrectly without dividing by 2' },
        { t: 'x = 4', c: false, m: 'Divided both sides by 2 before subtracting 5' },
        { t: 'x = 20', c: false, m: 'Added 5 instead of subtracting from 15' }
      ]
    }
  ]
});

// Helper: create an invalid assessment JSON string (contains forbidden spoiler token "is 5")
const INVALID_ASSESSMENT_JSON_SPOILER = JSON.stringify({
  assessments: [
    {
      q: 'Solve \\( 2x + 5 = 15 \\)',
      opts: [
        { t: 'x = 5', c: true },
        { t: 'x = 10', c: false, m: 'The answer is 5, student calculated 10' }, // "is" prohibited spoiler!
        { t: 'x = 4', c: false, m: 'Wrong operation' },
        { t: 'x = 20', c: false, m: 'Added 5 instead of subtracting' }
      ]
    }
  ]
});

// Helper: create invalid unclosed LaTeX string
const INVALID_LATEX_JSON = 'Solve \\( 2x + 5 = 15 without closing tag';

interface TestSummary {
  id: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestSummary[] = [];

function assert(condition: boolean, testId: string, testName: string, detail: string) {
  if (!condition) {
    results.push({ id: testId, name: testName, passed: false, details: `FAILED: ${detail}` });
    throw new Error(`[${testId}] ${testName} FAILED: ${detail}`);
  } else {
    results.push({ id: testId, name: testName, passed: true, details: detail });
    console.log(`✓ [${testId}] ${testName}: PASS (${detail})`);
  }
}

export async function runFaultInjectionSuite() {
  console.log('\n======================================================================');
  console.log(' AASHA AIOS — OI-003 FAULT INJECTION HARDENING TEST SUITE (10 SCENARIOS)');
  console.log('======================================================================\n');

  // TEST_001: FORCED_SCHEMA_FAILURE
  {
    const contextBus = getContextBus();
    const audit = contextBus.validateOutput(INVALID_ASSESSMENT_JSON_SPOILER, 'AssessmentAgent');
    assert(
      !audit.passed && audit.violations.length > 0 && audit.violations.some(v => v.ruleTitle.includes('Anti-Spoiler') || v.message.includes('SPOILER')),
      'TEST_001',
      'FORCED_SCHEMA_FAILURE',
      `Correctly caught spoiler violation in AssessmentAgent output: ${audit.violations[0]?.message}`
    );
  }

  // TEST_002: REPAIR_ATTEMPT_1_FAILURE
  {
    let callCount = 0;
    const mockCompleter = async () => {
      callCount++;
      if (callCount === 1) return { content: INVALID_ASSESSMENT_JSON_SPOILER };
      if (callCount === 2) return { content: INVALID_LATEX_JSON }; // Attempt 1 fails with latex error
      return { content: VALID_ASSESSMENT_JSON }; // Attempt 2 succeeds
    };

    const res = await runAgent('AssessmentAgent', 'Generate quiz', {
      llmCompleter: mockCompleter,
      maxRepairAttempts: 2,
    });

    const actualContent = typeof res === 'string' ? res : res.content;
    assert(
      callCount === 3 && actualContent === VALID_ASSESSMENT_JSON,
      'TEST_002',
      'REPAIR_ATTEMPT_1_FAILURE',
      `Attempt 1 failed and agent proceeded to Attempt 2, which recovered successfully (Total calls: ${callCount})`
    );
  }

  // TEST_003: REPAIR_ATTEMPT_2_FAILURE
  {
    let callCount = 0;
    const mockCompleter = async () => {
      callCount++;
      // All calls fail
      return { content: INVALID_ASSESSMENT_JSON_SPOILER };
    };

    let caughtError: QuarantineError | null = null;
    try {
      await runAgent('AssessmentAgent', 'Generate quiz', {
        llmCompleter: mockCompleter,
        maxRepairAttempts: 2,
      });
    } catch (err: any) {
      if (err instanceof QuarantineError) {
        caughtError = err;
      }
    }

    assert(
      caughtError !== null && caughtError.packet.repairAttempts === 2,
      'TEST_003',
      'REPAIR_ATTEMPT_2_FAILURE',
      `Attempt 2 failure detected after 2 repair attempts`
    );
  }

  // TEST_004: REPAIR_EXHAUSTION
  {
    let callCount = 0;
    const mockCompleter = async () => {
      callCount++;
      return { content: INVALID_ASSESSMENT_JSON_SPOILER };
    };

    try {
      await runAgent('AssessmentAgent', 'Generate quiz', {
        llmCompleter: mockCompleter,
        maxRepairAttempts: 2,
      });
    } catch (err) {
      // Expected QuarantineError
    }

    assert(
      callCount === 3, // 1 initial + 2 repair attempts = 3 total. No call 4!
      'TEST_004',
      'REPAIR_EXHAUSTION',
      `Strictly bounded at 2 repair attempts (Total calls: ${callCount}, zero runaway loops)`
    );
  }

  // TEST_005: QUARANTINE_ACTIVATION
  {
    const mockCompleter = async () => ({ content: INVALID_ASSESSMENT_JSON_SPOILER });
    let packet: QuarantinePacket | null = null;

    try {
      await runAgent('AssessmentAgent', 'Generate quiz', {
        llmCompleter: mockCompleter,
        maxRepairAttempts: 2,
      });
    } catch (err: any) {
      if (err instanceof QuarantineError) {
        packet = err.packet;
      }
    }

    assert(
      packet !== null && packet.quarantined === true && packet.exhausted === true,
      'TEST_005',
      'QUARANTINE_ACTIVATION',
      `Quarantine status activated with quarantined=true and exhausted=true`
    );
  }

  // TEST_006: DOWNSTREAM_BLOCKING
  {
    // AnalysisAgent fails and is quarantined
    const mockCompleter = async (req: any) => {
      // Return invalid output for AnalysisAgent (childish slang and mismatched latex)
      return { content: 'This is a super-duper fun adventure 🚀 with mismatched latex \\( x + 1' };
    };

    const pipeResult = await orchestrateChapterPipeline(
      { topic: 'Linear Equations', grade: 8, subject: 'Mathematics' },
      { llmCompleter: mockCompleter, maxRepairAttempts: 2 }
    );

    assert(
      pipeResult.status === 'QUARANTINED' &&
      pipeResult.blockedStages?.includes('DesignAgent') &&
      pipeResult.blockedStages?.includes('AssessmentAgent') &&
      pipeResult.blockedStages?.includes('LLEAgent'),
      'TEST_006',
      'DOWNSTREAM_BLOCKING',
      `AnalysisAgent quarantine blocked all downstream stages: ${pipeResult.blockedStages?.join(', ')}`
    );
  }

  // TEST_007: HIL_ESCALATION
  {
    const mockCompleter = async () => ({ content: INVALID_ASSESSMENT_JSON_SPOILER });
    let packet: QuarantinePacket | null = null;

    try {
      await runAgent('AssessmentAgent', 'Generate quiz', {
        llmCompleter: mockCompleter,
        maxRepairAttempts: 2,
        conceptId: 'cpt:linear_equations_class8',
      });
    } catch (err: any) {
      if (err instanceof QuarantineError) packet = err.packet;
    }

    assert(
      packet !== null &&
      packet.actionRequired === 'SUPER_ADMIN_INTERVENTION' &&
      packet.conceptId === 'cpt:linear_equations_class8' &&
      Array.isArray(packet.violations) &&
      packet.violations.length > 0 &&
      typeof packet.quarantineTimestamp === 'string',
      'TEST_007',
      'HIL_ESCALATION',
      `Structured HIL escalation packet emitted with actionRequired: ${packet?.actionRequired}, timestamp: ${packet?.quarantineTimestamp}`
    );
  }

  // TEST_008: SUCCESSFUL_RECOVERY
  {
    let callCount = 0;
    const mockCompleter = async () => {
      callCount++;
      if (callCount === 1) return { content: INVALID_ASSESSMENT_JSON_SPOILER };
      return { content: VALID_ASSESSMENT_JSON }; // Recovers on Attempt 1
    };

    const res = await runAgent('AssessmentAgent', 'Generate quiz', {
      llmCompleter: mockCompleter,
      maxRepairAttempts: 2,
    });

    const actualContent = typeof res === 'string' ? res : res.content;
    assert(
      callCount === 2 && actualContent === VALID_ASSESSMENT_JSON,
      'TEST_008',
      'SUCCESSFUL_RECOVERY',
      `Autonomous recovery succeeded on Attempt 1 without reaching quarantine`
    );
  }

  // TEST_009: UPSTREAM_FAILURE_STATE_PRESERVATION
  {
    const mockCompleter = async () => ({ content: INVALID_ASSESSMENT_JSON_SPOILER });
    let packet: QuarantinePacket | null = null;

    try {
      await runAgent('AssessmentAgent', 'Generate quiz', {
        llmCompleter: mockCompleter,
        maxRepairAttempts: 2,
      });
    } catch (err: any) {
      if (err instanceof QuarantineError) packet = err.packet;
    }

    assert(
      packet !== null && packet.rawContent === INVALID_ASSESSMENT_JSON_SPOILER,
      'TEST_009',
      'UPSTREAM_FAILURE_STATE_PRESERVATION',
      `Failing content preserved verbatim in quarantine packet for teacher/auditor inspection`
    );
  }

  // TEST_010: NO_DUPLICATE_SIDE_EFFECTS
  {
    const contextBus = getContextBus();
    const memoryProvider = contextBus.getMemory();
    const initialMemories = await memoryProvider.searchMemory('quarantine_check_test_topic', { limit: 100 });

    const mockCompleter = async () => ({ content: INVALID_ASSESSMENT_JSON_SPOILER });

    try {
      await runAgent('AssessmentAgent', 'quarantine_check_test_topic', {
        llmCompleter: mockCompleter,
        maxRepairAttempts: 2,
      });
    } catch (err) {
      // Expected QuarantineError
    }

    const postMemories = await memoryProvider.searchMemory('quarantine_check_test_topic', { limit: 100 });

    assert(
      initialMemories.length === postMemories.length,
      'TEST_010',
      'NO_DUPLICATE_SIDE_EFFECTS',
      `Quarantined execution produced zero memory banking side effects (Memory count before: ${initialMemories.length}, after: ${postMemories.length})`
    );
  }

  console.log('\n======================================================================');
  console.log(` ALL 10 OI-003 FAULT INJECTION TESTS PASSED: ${results.filter(r => r.passed).length}/10`);
  console.log('======================================================================\n');

  return results;
}

if (require.main === module) {
  runFaultInjectionSuite().catch(err => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  });
}
