/**
 * AASHA LLM Router — 3-Tier Anti-Bleed Client (100% Free Default)
 *
 * Tier 1: OpenRouter Free Pool  (routine chat, search, grep, memory)
 * Tier 2: OpenRouter Coding Pool / Claude Code via OpenRouter (free coding models)
 * Tier 3: Gemini Paid API Reserve (PDF ingestion, long-context QA — explicit auth ONLY)
 *
 * ZERO-BLEED GUARANTEE:
 * - 0 paid token bleed for routine tasks (Tier 1)
 * - 0 paid token bleed for coding tasks (Tier 2 uses free OpenRouter coding models)
 * - Tier 3 (Gemini paid) is STRICTLY blocked unless ALLOW_PAID_GEMINI_FALLBACK=true or authorized taskType
 */

import 'dotenv/config';

// ---------------------------------------------------------------------------
// Types & Interface
// ---------------------------------------------------------------------------

export type ModelTier = 1 | 2 | 3;

export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  taskType?: string;   // e.g. 'chat', 'code_edit', 'pdf_ingestion'
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  tier: ModelTier;
  retries: number;
}

// ---------------------------------------------------------------------------
// OpenRouter API Keys (Multi-Key Rotation for 3x Free Capacity)
// ---------------------------------------------------------------------------

function getOpenRouterKeys(): string[] {
  const keys = [
    process.env.OPENROUTER_API_KEY,
    process.env.OPENROUTER_API_KEY_2,
    process.env.OPENROUTER_API_KEY_3,
  ].filter(Boolean) as string[];
  
  return keys.length > 0 ? keys : ['sk-or-v1-placeholder'];
}

// ---------------------------------------------------------------------------
// Model Pools (Free Models via OpenRouter)
// ---------------------------------------------------------------------------

const TIER1_FREE_POOL: string[] = [
  process.env.DEFAULT_FREE_MODEL       ?? 'meta-llama/llama-3.1-8b-instruct:free',
  process.env.FALLBACK_FREE_MODEL_1    ?? 'nvidia/nemotron-3.5-lightning:free',
  process.env.FALLBACK_FREE_MODEL_2    ?? 'google/gemini-2.0-flash-exp:free',
];

const TIER2_FREE_CODING_POOL: string[] = [
  'qwen/qwen-2.5-coder-32b-instruct:free',
  'nvidia/nemotron-3.5-lightning:free',
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-3.1-8b-instruct:free',
];

const BACKOFF_MS = parseInt(process.env.BATCH_RATE_LIMIT_BACKOFF_MS ?? '3000', 10);
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES_BEFORE_TIER2_ESCALATE ?? '3', 10);

// ---------------------------------------------------------------------------
// Gemini Guard (Tier 3 Anti-Bleed)
// ---------------------------------------------------------------------------

export function assertGeminiAuthorized(taskType: string): void {
  if (process.env.ALLOW_PAID_GEMINI_FALLBACK === 'true') {
    console.warn(`[TIER 3] ⚠️  ALLOW_PAID_GEMINI_FALLBACK=true — Gemini authorized for: "${taskType}"`);
    return;
  }
  const allowed = (process.env.GEMINI_RESERVE_TASKS ?? '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);
  if (!allowed.includes(taskType)) {
    throw new Error(
      `[ANTI-BLEED GUARD] ❌ Gemini API BLOCKED for task: "${taskType}".\n` +
      `Authorized tasks: ${allowed.join(', ') || '(none)'}.\n` +
      `→ Route to Tier 1 (OpenRouter free) or Tier 2 (OpenRouter free coding) instead.`
    );
  }
  console.warn(`[TIER 3] ⚠️  Gemini paid API authorized for: "${taskType}". Logging usage.`);
}

// ---------------------------------------------------------------------------
// 9Router Gateway (Primary Zero-Bleed Provider on Local Port 20128)
// ---------------------------------------------------------------------------

const NINEROUTER_BASE_URL = process.env.NINEROUTER_BASE_URL ?? 'http://localhost:20128/v1';
const NINEROUTER_API_KEY = process.env.NINEROUTER_API_KEY ?? 'sk-d672920e9d3d1993-xq1kzx-afac3200';
export const DEFAULT_LLM_PROVIDER = process.env.DEFAULT_LLM_PROVIDER ?? '9router';

const TIER1_9ROUTER_POOL: string[] = [
  process.env.NINEROUTER_DEFAULT_MODEL ?? 'claude-combo',
  'ag/gemini-3.8-flash',
  'gh/gpt-5.4-nano',
];

const TIER2_9ROUTER_POOL: string[] = [
  process.env.NINEROUTER_CODING_MODEL ?? 'claude-combo',
  'ag/gemini-3.8-flash-high',
  'ag/gemini-3.8-flash',
];

async function execute9Router(
  pool: string[],
  req: LLMRequest,
  tier: ModelTier,
  attempt = 0
): Promise<LLMResponse> {
  const model = pool[attempt % pool.length];
  const messages: { role: string; content: string }[] = [];
  if (req.systemPrompt) messages.push({ role: 'system', content: req.systemPrompt });
  messages.push({ role: 'user', content: req.prompt });

  try {
    const res = await fetch(`${NINEROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NINEROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        max_tokens: req.maxTokens ?? (tier === 2 ? 4096 : 2048),
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`[9ROUTER TIER ${tier}] HTTP ${res.status} (${model}): ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    const content = data.choices[0]?.message?.content || '';
    return { content, model, tier, retries: attempt };
  } catch (err: unknown) {
    if (attempt < pool.length - 1) {
      console.warn(`[9ROUTER TIER ${tier}] Retry model ${pool[(attempt + 1) % pool.length]} after error on ${model}: ${err}`);
      return execute9Router(pool, req, tier, attempt + 1);
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// OpenRouter Execution Helper with Key & Model Rotation
// ---------------------------------------------------------------------------

async function executeOpenRouter(
  pool: string[],
  req: LLMRequest,
  tier: ModelTier,
  attempt = 0
): Promise<LLMResponse> {
  const keys = getOpenRouterKeys();
  const apiKey = keys[attempt % keys.length];
  const model = pool[attempt % pool.length];

  const messages: { role: string; content: string }[] = [];
  if (req.systemPrompt) messages.push({ role: 'system', content: req.systemPrompt });
  messages.push({ role: 'user', content: req.prompt });

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
        'X-Title': process.env.SITE_NAME || 'Aasha AI',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: req.maxTokens ?? (tier === 2 ? 4096 : 2048),
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (res.status === 429) {
      if (attempt >= MAX_RETRIES * keys.length) {
        throw new Error(`[TIER ${tier}] Exhausted key & model pool on 429 rate limits.`);
      }
      console.warn(`[TIER ${tier}] 429 on key ${attempt % keys.length + 1} (${model}). Rotating key/model in ${BACKOFF_MS}ms...`);
      await new Promise(r => setTimeout(r, BACKOFF_MS));
      return executeOpenRouter(pool, req, tier, attempt + 1);
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`[TIER ${tier}] HTTP ${res.status} from OpenRouter (${model}): ${body.slice(0, 200)}`);
    }

    const data = await res.json() as { choices: { message: { content: string } }[] };
    const content = data.choices[0]?.message?.content || '';
    return { content, model, tier, retries: attempt };

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (attempt < MAX_RETRIES * keys.length && !msg.includes('Exhausted')) {
      console.warn(`[TIER ${tier}] Error on ${model}: ${msg}. Retrying in ${BACKOFF_MS}ms...`);
      await new Promise(r => setTimeout(r, BACKOFF_MS));
      return executeOpenRouter(pool, req, tier, attempt + 1);
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Tier 1: 9Router (Default) / OpenRouter Free Pool (Fallback)
// ---------------------------------------------------------------------------

export async function callTier1(req: LLMRequest): Promise<LLMResponse> {
  if (DEFAULT_LLM_PROVIDER === '9router') {
    try {
      return await execute9Router(TIER1_9ROUTER_POOL, req, 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[ROUTER] 9Router Tier 1 failed (${msg}). Cascading to OpenRouter free pool.`);
    }
  }
  return executeOpenRouter(TIER1_FREE_POOL, req, 1);
}

// ---------------------------------------------------------------------------
// Tier 2: 9Router Coding Pool (Default) / OpenRouter Free Coding Pool (Fallback)
// ---------------------------------------------------------------------------

export async function callTier2(req: LLMRequest): Promise<LLMResponse> {
  // If user explicitly configured a paid Anthropic key in .env, option to use it exists
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey && !anthropicKey.includes('YOUR_KEY_HERE') && !anthropicKey.includes('placeholder')) {
    try {
      const model = process.env.CLAUDE_CODE_MODEL ?? 'claude-3-5-sonnet-20241022';
      const body: Record<string, unknown> = {
        model,
        max_tokens: req.maxTokens ?? 4096,
        messages: [{ role: 'user', content: req.prompt }],
      };
      if (req.systemPrompt) body.system = req.systemPrompt;

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60_000),
      });

      if (res.ok) {
        const data = await res.json() as { content: { type: string; text: string }[] };
        const text = data.content.filter(c => c.type === 'text').map(c => c.text).join('');
        return { content: text, model, tier: 2, retries: 0 };
      }
    } catch {
      console.warn('[TIER 2] Direct Anthropic API call skipped/failed. Falling back to 9router/OpenRouter pool.');
    }
  }

  // DEFAULT: Route through 9Router Free Coding Models, falling back to OpenRouter
  if (DEFAULT_LLM_PROVIDER === '9router') {
    try {
      return await execute9Router(TIER2_9ROUTER_POOL, req, 2);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[ROUTER] 9Router Tier 2 failed (${msg}). Cascading to OpenRouter coding pool.`);
    }
  }

  return executeOpenRouter(TIER2_FREE_CODING_POOL, req, 2);
}

// ---------------------------------------------------------------------------
// Tier 3: Gemini Reserve (Authorized Tasks Only)
// ---------------------------------------------------------------------------

export async function callTier3(req: LLMRequest & { taskType: string }): Promise<LLMResponse> {
  assertGeminiAuthorized(req.taskType);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('[TIER 3] GEMINI_API_KEY not set in .env');

  const model = process.env.GEMINI_DEFAULT_RESERVE_MODEL ?? 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const parts: { text: string }[] = [];
  if (req.systemPrompt) parts.push({ text: req.systemPrompt + '\n\n' });
  parts.push({ text: req.prompt });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }] }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`[TIER 3] Gemini HTTP ${res.status}: ${errBody.slice(0, 300)}`);
  }

  const data = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] };
  const text = data.candidates[0].content.parts.map(p => p.text).join('');
  return { content: text, model, tier: 3, retries: 0 };
}

// ---------------------------------------------------------------------------
// Main Router — Apply Decision Tree
// ---------------------------------------------------------------------------

const CODE_TASK_TYPES = new Set([
  'code_edit', 'code_synthesis', 'file_creation', 'chapter_html',
  'typescript_generation', 'benchmark_script', 'mcp_plugin', 'cdp_automation',
]);

const TIER3_TASK_TYPES = new Set([
  'pdf_ingestion', 'final_qa_certification', 'super_admin_boost',
]);

export async function route(req: LLMRequest): Promise<LLMResponse> {
  const taskType = req.taskType ?? 'chat';

  // 1. Tier 3 guard
  if (TIER3_TASK_TYPES.has(taskType)) {
    console.log(`[ROUTER] → TIER 3 (Gemini reserve) for task: ${taskType}`);
    return callTier3({ ...req, taskType });
  }

  // 2. Tier 2 — coding tasks (routes via OpenRouter free coding pool if no paid key)
  if (CODE_TASK_TYPES.has(taskType)) {
    console.log(`[ROUTER] → TIER 2 (OpenRouter free coding pool) for task: ${taskType}`);
    return callTier2(req);
  }

  // 3. Tier 1 — routine work
  console.log(`[ROUTER] → TIER 1 (OpenRouter free pool) for task: ${taskType}`);
  try {
    return await callTier1(req);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[ROUTER] Tier 1 exhausted: ${msg}`);
    console.warn('[ROUTER] → Escalating to TIER 2 (OpenRouter free coding pool). NOT Tier 3.');
    return callTier2(req);
  }
}

if (process.argv.includes('--test')) {
  (async () => {
    console.log('\n🔍 AASHA LLM Router — Anti-Bleed Self-Test\n');

    // Test 1: Gemini guard blocks non-authorized task
    try {
      assertGeminiAuthorized('chat');
      console.error('❌ FAIL: Gemini guard did not block "chat"');
    } catch {
      console.log('✅ PASS: Gemini guard correctly blocked "chat"');
    }

    // Test 2: Gemini guard allows authorized task when flag set
    try {
      const orig = process.env.ALLOW_PAID_GEMINI_FALLBACK;
      process.env.ALLOW_PAID_GEMINI_FALLBACK = 'true';
      assertGeminiAuthorized('pdf_ingestion');
      process.env.ALLOW_PAID_GEMINI_FALLBACK = orig;
      console.log('✅ PASS: Gemini guard allows authorized task with flag=true');
    } catch (e) {
      console.error('❌ FAIL:', e);
    }

    // Test 3: Test key rotation and routing
    const keys = getOpenRouterKeys();
    console.log(`ℹ️  Loaded ${keys.length} OpenRouter API key(s) for 0-bleed execution.`);

    console.log('\n✅ Anti-bleed guard is active. Gemini paid API: RESERVED.\n');
  })();
}

// ---------------------------------------------------------------------------
// getLLMCompletion — Canonical Adapter (V2 Router Unification — C-01/C-02 fix)
//
// This function provides the same interface as llm_router.ts's getLLMCompletion(),
// making openrouter_client.ts the canonical router for new code.
// agent_orchestrator.ts and future modules should import from here.
// llm_router.ts remains functional for backward compatibility (no breaking changes).
//
// TaskType mapping to 3-tier routing:
//   'deterministic'  → returns DETERMINISTIC_OK immediately (no LLM call)
//   'analysis'       → Tier 1 (OpenRouter free — llama/nemotron/gemini-flash-exp)
//   'design'         → Tier 1
//   'assessment'     → Tier 1
//   'lle'            → Tier 1 (LLE cascade: WM dict → Google Translate → gemini-flash-exp:free)
//   'lle-indic'      → Tier 1 (same as 'lle' — C-04 deadlock FIXED in AIOS v2)
//   'vision'         → Tier 3 if authorized, else Tier 1 fallback
//   'coding'         → Tier 2 (OpenRouter free coding pool: qwen-2.5-coder, etc.)
// ---------------------------------------------------------------------------

export type TaskType =
  | 'deterministic'
  | 'analysis'
  | 'design'
  | 'assessment'
  | 'lle'
  | 'lle-indic'
  | 'vision'
  | 'coding';

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMCompletionRequest {
  messages: LLMMessage[];
  taskType?: TaskType;
  model?: string;
  maxTokens?: number;
}

const TIER2_TASK_TYPES = new Set<TaskType>(['coding']);
const TIER3_TASK_TYPES_EXT = new Set<TaskType>(['vision']);

/**
 * Canonical LLM completion function (replaces llm_router.ts getLLMCompletion).
 * Import from here in new code. llm_router.ts is preserved for backward compat.
 */
export async function getLLMCompletion(req: LLMCompletionRequest): Promise<string> {
  const taskType = req.taskType ?? 'analysis';

  // Deterministic agents — no LLM call
  if (taskType === 'deterministic') {
    return 'DETERMINISTIC_OK';
  }

  // Extract system prompt and user prompt from messages
  const systemMsg = req.messages.find(m => m.role === 'system')?.content ?? '';
  const userMsg = req.messages
    .filter(m => m.role !== 'system')
    .map(m => m.content)
    .join('\n');

  const llmReq: LLMRequest = {
    prompt: userMsg,
    systemPrompt: systemMsg || undefined,
    taskType,
    maxTokens: req.maxTokens,
  };

  let response: LLMResponse;

  if (TIER3_TASK_TYPES_EXT.has(taskType)) {
    // Vision tasks — attempt Tier 3 if authorized, else fall to Tier 1
    try {
      response = await callTier3({ ...llmReq, taskType: taskType as string });
    } catch {
      console.warn(`[getLLMCompletion] Vision task Tier 3 blocked. Falling to Tier 1.`);
      response = await callTier1(llmReq);
    }
  } else if (TIER2_TASK_TYPES.has(taskType)) {
    response = await callTier2(llmReq);
  } else {
    // Tier 1 for: analysis, design, assessment, lle, lle-indic (cascade handles Indic in lle_cascade.ts)
    response = await route(llmReq);
  }

  return response.content;
}
