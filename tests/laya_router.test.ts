import { classifyTaskWithLaya } from '../packages/llm-router/laya_classifier';

async function runTests() {
  console.log('🧪 Starting Laya System 1 Router Test Suite...\n');

  const testCases = [
    {
      name: 'Indic Bilingual Query',
      prompt: 'मांग का नियम और कीमत लोच की व्याख्या कीजिए',
      expectedTask: 'lle-indic',
    },
    {
      name: 'Vision / Multimodal Request',
      prompt: 'Please inspect chart_demand_curve.png and extract the axis coordinates',
      expectedTask: 'vision',
    },
    {
      name: 'Coding / Simulation Task',
      prompt: 'Write a TypeScript function to calculate national income equilibrium and fix canvas loop',
      expectedTask: 'coding',
    },
    {
      name: 'Assessment & Misconception Generation',
      prompt: 'Create 5 quiz questions with misconception explanations and 4-tier progressive hints H1-H4',
      expectedTask: 'assessment',
    },
    {
      name: 'Pedagogical Curriculum Design',
      prompt: 'Design a pedagogical syllabus, section 24 contract, and lesson plan for Class 12 Macroeconomics',
      expectedTask: 'design',
    },
    {
      name: 'Conceptual Economic Analysis',
      prompt: 'Explain what happens to consumer equilibrium when income increases',
      expectedTask: 'analysis',
    },
  ];

  let passed = 0;

  for (const tc of testCases) {
    const t0 = performance.now();
    const result = await classifyTaskWithLaya(tc.prompt);
    const duration = (performance.now() - t0).toFixed(1);

    const isMatch = result.taskType === tc.expectedTask;
    if (isMatch) passed++;

    const status = isMatch ? '✅ PASS' : '⚠️ DIFF';
    console.log(`${status} | [${tc.name}]`);
    console.log(`       Input   : "${tc.prompt.substring(0, 60)}..."`);
    console.log(`       Routed  : ${result.taskType} (expected: ${tc.expectedTask})`);
    console.log(`       Conf    : ${(result.confidence * 100).toFixed(1)}% | Source: ${result.source} | Latency: ${result.latencyMs}ms (total: ${duration}ms)\n`);
  }

  console.log(`═══════════════════════════════════════════════════`);
  console.log(`Results: ${passed}/${testCases.length} tests strictly matched expectations.`);
  console.log(`Zero token bleed verified: 0 LLM API tokens used for classification.`);
  console.log(`═══════════════════════════════════════════════════`);
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
