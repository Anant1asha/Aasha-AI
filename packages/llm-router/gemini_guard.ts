/**
 * AASHA LLM Router — gemini_guard.ts
 * Standalone Gemini Anti-Bleed Guard (extracted from openrouter_client.ts)
 *
 * This module is the SINGLE authoritative source for Gemini paid API gating.
 * Import this from ALL pipeline scripts that might touch the Gemini API.
 *
 * Invariant: ALLOW_PAID_GEMINI_FALLBACK=false at all times in Aasha-AI/.env
 */

import 'dotenv/config';

/** Authorized Gemini task types — sourced from GEMINI_RESERVE_TASKS env var */
function getAuthorizedTasks(): string[] {
  return (process.env.GEMINI_RESERVE_TASKS ?? '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);
}

/**
 * Asserts that the given taskType is authorized for Gemini paid API usage.
 * Throws an error if not authorized (anti-bleed circuit breaker).
 *
 * @param taskType - The task type attempting to use Gemini.
 * @throws Error if taskType is not in GEMINI_RESERVE_TASKS and ALLOW_PAID_GEMINI_FALLBACK != true
 */
export function assertGeminiAuthorized(taskType: string): void {
  if (process.env.ALLOW_PAID_GEMINI_FALLBACK === 'true') {
    console.warn(
      `[TIER 3] ⚠️  ALLOW_PAID_GEMINI_FALLBACK=true — Gemini paid API authorized for: "${taskType}"`
    );
    return;
  }

  const allowed = getAuthorizedTasks();
  if (!allowed.includes(taskType)) {
    throw new Error(
      `[ANTI-BLEED GUARD] ❌ Gemini paid API BLOCKED for task: "${taskType}".\n` +
      `Authorized reserve tasks: ${allowed.join(', ') || '(none configured)'}.\n` +
      `→ Route to Tier 1 (OpenRouter free pool) or Tier 2 (OpenRouter free coding) instead.\n` +
      `→ To authorize this task, add "${taskType}" to GEMINI_RESERVE_TASKS in Aasha-AI/.env\n` +
      `→ To use /boost, set ALLOW_PAID_GEMINI_FALLBACK=true temporarily (Super Admin only).`
    );
  }

  console.warn(`[TIER 3] ⚠️  Gemini paid API authorized for: "${taskType}". Logging usage.`);
}

/**
 * Logs Gemini usage for observability and cost tracking.
 * Call this AFTER a successful Gemini API call.
 */
export function logGeminiUsage(taskType: string, model: string, tokenCount?: number): void {
  const entry = {
    timestamp: new Date().toISOString(),
    tier: 3,
    taskType,
    model,
    tokenCount: tokenCount ?? 'UNKNOWN',
    env: process.env.NODE_ENV ?? 'development',
  };
  console.warn(`[TIER 3 USAGE LOG]`, JSON.stringify(entry));
  // Future: write to evidence_client.ts -> hatchable PostgreSQL evidence_ledger
}

/**
 * Checks if a task is authorized for Gemini without throwing.
 * Useful for routing decisions.
 */
export function isGeminiAuthorized(taskType: string): boolean {
  if (process.env.ALLOW_PAID_GEMINI_FALLBACK === 'true') return true;
  return getAuthorizedTasks().includes(taskType);
}

// ---------------------------------------------------------------------------
// Self-Test (run with: npx tsx packages/llm-router/gemini_guard.ts --test)
// ---------------------------------------------------------------------------

if (process.argv.includes('--test')) {
  console.log('\n🔐 gemini_guard.ts — Anti-Bleed Self-Test\n');

  // Test 1: Block unauthorized task
  try {
    assertGeminiAuthorized('chat');
    console.error('❌ FAIL: Should have blocked "chat"');
  } catch (e: any) {
    if (e.message.includes('ANTI-BLEED GUARD')) {
      console.log('✅ PASS: Correctly blocked "chat" task');
    } else {
      console.error('❌ FAIL unexpected error:', e.message);
    }
  }

  // Test 2: Allow authorized task
  try {
    const orig = process.env.GEMINI_RESERVE_TASKS;
    process.env.GEMINI_RESERVE_TASKS = 'pdf_ingestion,test_task';
    assertGeminiAuthorized('test_task');
    process.env.GEMINI_RESERVE_TASKS = orig;
    console.log('✅ PASS: Correctly allowed authorized task "test_task"');
  } catch (e: any) {
    console.error('❌ FAIL:', e.message);
  }

  // Test 3: isGeminiAuthorized helper
  process.env.GEMINI_RESERVE_TASKS = 'pdf_ingestion,final_qa_certification,super_admin_boost';
  console.log('✅ isGeminiAuthorized("pdf_ingestion"):', isGeminiAuthorized('pdf_ingestion'));
  console.log('✅ isGeminiAuthorized("chat"):', isGeminiAuthorized('chat'));

  console.log('\n✅ gemini_guard.ts self-test complete. Anti-bleed circuit breaker ACTIVE.\n');
}
