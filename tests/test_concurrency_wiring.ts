process.env.NODE_ENV = 'test';
process.env.MEMO0_OFFLINE = '1';

import { orchestrateChapterPipeline, getContextBus } from '../agent_orchestrator';

// Mock completers that simulate async work
const createDeterministicCompleter = (delayMs: number = 50) => {
  return async (req: any) => {
    await new Promise(r => setTimeout(r, delayMs));
    const prompt = req.messages[req.messages.length - 1].content;

    if (req.taskType === 'analysis') {
      return {
        content: JSON.stringify({
          conceptNodes: ['cpt:linear_eq_intro', 'cpt:balance_method'],
          grade: 8,
          competencies: ['algebraic_balance', 'isolation']
        })
      };
    }
    if (req.taskType === 'design') {
      return {
        content: JSON.stringify({
          screens: ['screen:intro', 'screen:interactive_balance', 'screen:practice'],
          foundationId: 'F01'
        })
      };
    }
    if (req.taskType === 'assessment') {
      return {
        content: JSON.stringify({
          assessments: [
            {
              q: 'Solve \\( 3x = 12 \\)',
              opts: [
                { t: 'x = 4', c: true },
                { t: 'x = 9', c: false, m: 'Subtracted 3 instead of dividing' },
                { t: 'x = 36', c: false, m: 'Multiplied by 3 instead of dividing' }
              ]
            }
          ]
        })
      };
    }
    if (req.taskType === 'lle' || req.taskType === 'lle-indic') {
      return {
        content: JSON.stringify({
          dictionary: {
            'equation': 'समीकरण (इक्वेशन)',
            'variable': 'चर (वैरिएबल)'
          }
        })
      };
    }
    return { content: 'OK' };
  };
};

interface ConcurrencyTestResult {
  id: string;
  name: string;
  passed: boolean;
  details: string;
}

const testResults: ConcurrencyTestResult[] = [];

function assert(condition: boolean, id: string, name: string, detail: string) {
  if (!condition) {
    testResults.push({ id, name, passed: false, details: `FAILED: ${detail}` });
    throw new Error(`[${id}] ${name} FAILED: ${detail}`);
  } else {
    testResults.push({ id, name, passed: true, details: detail });
    console.log(`✓ [${id}] ${name}: PASS (${detail})`);
  }
}

export async function runConcurrencySuite() {
  console.log('\n======================================================================');
  console.log(' AASHA AIOS — OI-002 CONCURRENCY WIRING VERIFICATION SUITE');
  console.log('======================================================================\n');

  const input = {
    topic: 'Linear Equations',
    grade: 8,
    subject: 'Mathematics',
    rawSourceText: 'NCERT Class 8 Chapter 2 Linear Equations in One Variable.'
  };

  // TEST_C01: PARALLEL FORK-JOIN COMPLETION & STRUCTURE INTEGRITY
  {
    const completer = createDeterministicCompleter(30);
    const start = Date.now();
    const concurrentResult = await orchestrateChapterPipeline(input, {
      concurrency: true,
      llmCompleter: completer,
      useIEC: false,
    });
    const concurrentDuration = Date.now() - start;

    assert(
      concurrentResult.status === 'SUCCESS' &&
      concurrentResult.concurrencyMode === 'PARALLEL_FORK_JOIN' &&
      concurrentResult.analysis !== undefined &&
      concurrentResult.design !== undefined &&
      concurrentResult.assessment !== undefined &&
      concurrentResult.lle !== undefined,
      'TEST_C01',
      'PARALLEL_FORK_JOIN_COMPLETION',
      `Parallel Fork-Join completed successfully in ${concurrentDuration}ms with all 4 stage payloads intact`
    );
  }

  // TEST_C02: DETERMINISTIC EQUIVALENCE (SEQUENTIAL VS CONCURRENT)
  {
    const completer = createDeterministicCompleter(10);

    const seqResult = await orchestrateChapterPipeline(input, {
      concurrency: false,
      llmCompleter: completer,
      useIEC: false,
    });

    const parResult = await orchestrateChapterPipeline(input, {
      concurrency: true,
      llmCompleter: completer,
      useIEC: false,
    });

    const seqPayload = JSON.stringify({
      analysis: seqResult.analysis,
      design: seqResult.design,
      assessment: seqResult.assessment,
      lle: seqResult.lle,
    });

    const parPayload = JSON.stringify({
      analysis: parResult.analysis,
      design: parResult.design,
      assessment: parResult.assessment,
      lle: parResult.lle,
    });

    assert(
      seqPayload === parPayload,
      'TEST_C02',
      'DETERMINISTIC_EQUIVALENCE',
      `Concurrent output matches sequential output byte-for-byte (Zero nondeterminism)`
    );
  }

  // TEST_C03: CONCURRENCY SPEEDUP VERIFICATION
  {
    const delay = 80;
    const completer = createDeterministicCompleter(delay);

    const seqStart = Date.now();
    await orchestrateChapterPipeline(input, { concurrency: false, llmCompleter: completer, useIEC: false });
    const seqDuration = Date.now() - seqStart;

    const parStart = Date.now();
    await orchestrateChapterPipeline(input, { concurrency: true, llmCompleter: completer, useIEC: false });
    const parDuration = Date.now() - parStart;

    // Sequential: 1 analysis + 3 branches (design, assessment, lle) + QA ~ 4*80 = ~320ms
    // Concurrent: 1 analysis + 1 max(design, assessment, lle) + QA ~ 2*80 = ~160ms
    assert(
      parDuration < seqDuration,
      'TEST_C03',
      'CONCURRENCY_SPEEDUP',
      `Parallel runtime (${parDuration}ms) faster than sequential runtime (${seqDuration}ms)`
    );
  }

  // TEST_C04: DOWNSTREAM BLOCKING UNDER CONCURRENT BRANCH FAILURE
  {
    // Design and LLE succeed, but Assessment fails completely
    const faultyCompleter = async (req: any) => {
      if (req.taskType === 'assessment') {
        // Forbidden spoiler that fails all repair attempts
        return { content: '{"assessments":[{"q":"x+1=2","opts":[{"t":"x=1","c":true},{"t":"x=0","c":false,"m":"The answer is 1"}]}]}' };
      }
      return { content: '{"status":"OK"}' };
    };

    const pipeResult = await orchestrateChapterPipeline(input, {
      concurrency: true,
      llmCompleter: faultyCompleter,
      useIEC: false,
    });

    assert(
      pipeResult.status === 'QUARANTINED' &&
      pipeResult.quarantinePacket?.role === 'AssessmentAgent' &&
      pipeResult.blockedStages?.includes('QAAgent'),
      'TEST_C04',
      'CONCURRENT_FAILURE_DOWNSTREAM_BLOCKING',
      `Concurrent branch failure quarantined AssessmentAgent and blocked downstream QA`
    );
  }

  // TEST_C05: RACE CONDITION STABILITY (5 CONSECUTIVE RUNS)
  {
    const completer = createDeterministicCompleter(10);
    const runs = [];
    for (let i = 0; i < 5; i++) {
      runs.push(await orchestrateChapterPipeline(input, { concurrency: true, llmCompleter: completer, useIEC: false }));
    }

    const baseline = JSON.stringify({
      analysis: runs[0].analysis,
      design: runs[0].design,
      assessment: runs[0].assessment,
      lle: runs[0].lle,
    });

    const allIdentical = runs.every(r => JSON.stringify({
      analysis: r.analysis,
      design: r.design,
      assessment: r.assessment,
      lle: r.lle,
    }) === baseline);

    assert(
      allIdentical,
      'TEST_C05',
      'RACE_CONDITION_STABILITY',
      `5 consecutive parallel pipeline executions produced 100% identical outputs (Zero race conditions)`
    );
  }

  console.log('\n======================================================================');
  console.log(` ALL 5 OI-002 CONCURRENCY TESTS PASSED: ${testResults.filter(r => r.passed).length}/5`);
  console.log('======================================================================\n');

  return testResults;
}

if (require.main === module) {
  runConcurrencySuite().catch(err => {
    console.error('Concurrency Test Suite Failed:', err);
    process.exit(1);
  });
}
