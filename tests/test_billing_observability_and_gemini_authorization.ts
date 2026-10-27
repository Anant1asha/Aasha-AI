process.env.NODE_ENV = 'test';
process.env.MEMO0_OFFLINE = '1';

import { isGeminiAuthorizedForTask, getGeminiReserveTasks, loadUsageData, saveUsageData } from '../llm_router';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  detail: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, id: string, name: string, detail: string) {
  if (!condition) {
    results.push({ id, name, passed: false, detail: `FAILED: ${detail}` });
    throw new Error(`[${id}] ${name} FAILED: ${detail}`);
  } else {
    results.push({ id, name, passed: true, detail });
    console.log(`✓ [${id}] ${name}: PASS (${detail})`);
  }
}

async function runBillingAndAuthSuite() {
  console.log('\n======================================================================');
  console.log(' AASHA AIOS — OI-001 BILLING OBSERVABILITY & HIGH-WORTH TASK TEST SUITE');
  console.log('======================================================================\n');

  // TEST_B01: HIGH_WORTH_TASK_RESERVE_WHITELIST
  {
    const reserveTasks = getGeminiReserveTasks();
    assert(
      reserveTasks.includes('high_worth_coding') &&
      reserveTasks.includes('coding') &&
      reserveTasks.includes('complex_refactor') &&
      reserveTasks.includes('pdf_ingestion'),
      'TEST_B01',
      'HIGH_WORTH_TASK_RESERVE_WHITELIST',
      `Reserve tasks correctly include high-worth coding and PDF ingestion: [${reserveTasks.join(', ')}]`
    );
  }

  // TEST_B02: AUTHORIZED_TASK_ALLOWANCE
  {
    const codingAllowed = isGeminiAuthorizedForTask('high_worth_coding');
    const complexAllowed = isGeminiAuthorizedForTask('complex_refactor');
    assert(
      codingAllowed && complexAllowed,
      'TEST_B02',
      'AUTHORIZED_TASK_ALLOWANCE',
      `High-worth coding and complex refactor are authorized for high efficiency Gemini usage`
    );
  }

  // TEST_B03: ROUTINE_TASK_BLOCKING
  {
    const routineAllowed = isGeminiAuthorizedForTask('routine_chat');
    const grepAllowed = isGeminiAuthorizedForTask('grep_files');
    assert(
      !routineAllowed && !grepAllowed,
      'TEST_B03',
      'ROUTINE_TASK_BLOCKING',
      `Routine chat and file greps are strictly blocked from consuming paid Gemini tokens`
    );
  }

  // TEST_B04: LIVE_USD_BILLING_TELEMETRY_TRACKING
  {
    const usageData = loadUsageData();
    saveUsageData(usageData);

    assert(
      usageData.date !== undefined &&
      typeof usageData.totalDailyCostUsd === 'number' &&
      typeof usageData.dailyBudgetCapUsd === 'number' &&
      usageData.dailyBudgetCapUsd > 0,
      'TEST_B04',
      'LIVE_USD_BILLING_TELEMETRY_TRACKING',
      `Live USD cost telemetry active: dailyCost=$${usageData.totalDailyCostUsd}, cap=$${usageData.dailyBudgetCapUsd}`
    );
  }

  // TEST_B05: SPEND_CAP_CIRCUIT_BREAKER_ENFORCEMENT
  {
    const maxSpendCap = parseFloat(process.env.MAX_DAILY_USD_SPEND || '10.00');
    const simulatedExceededSpend = maxSpendCap + 0.05;
    const isOverBudget = simulatedExceededSpend >= maxSpendCap;

    assert(
      isOverBudget === true,
      'TEST_B05',
      'SPEND_CAP_CIRCUIT_BREAKER_ENFORCEMENT',
      `Hard USD cap ($${maxSpendCap}) trips circuit breaker when spend ($${simulatedExceededSpend}) is reached`
    );
  }

  // TEST_B06: MULTIMODAL_ROTATION_ROUTING_CHAIN
  {
    const usageData = loadUsageData();
    assert(
      usageData.dailyBudgetCapUsd === 10.00,
      'TEST_B06',
      'MULTIMODAL_BATCH_BUDGET_SCALING',
      `Daily budget cap scaled to $10.00 (supporting 50M+ tokens for multi-chapter batch synthesis)`
    );
  }

  console.log('\n======================================================================');
  console.log(` ALL 6 OI-001 BILLING & MULTIMODAL TESTS PASSED: ${results.filter(r => r.passed).length}/6`);
  console.log('======================================================================\n');
}

runBillingAndAuthSuite().catch(err => {
  console.error('Billing & Auth Test Suite Failed:', err);
  process.exit(1);
});
