import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Task types drive provider selection. Always set this so the router
 * can make an optimal routing decision without guessing.
 *
 * - 'deterministic'  : No LLM needed (Python/Node scripts). Router returns early.
 * - 'analysis'       : Concept mapping, curriculum analysis. → OpenRouter auto
 * - 'design'         : Pedagogical sequencing, chapter spec. → OpenRouter auto
 * - 'assessment'     : Quiz authoring, misconception writing. → OpenRouter auto
 * - 'lle'            : Non-Indic translation, simple bilingual. → OpenRouter auto
 * - 'lle-indic'      : Indic script translation (Devanagari, Tamil, etc.) → Gemini Key 1
 * - 'vision'         : Image understanding, OCR, multimodal. → Gemini Key 1
 * - 'coding'         : Code repair, TypeScript generation. → OpenRouter (Claude)
 */
export type TaskType =
  | 'deterministic'
  | 'analysis'
  | 'design'
  | 'assessment'
  | 'lle'
  | 'lle-indic'
  | 'vision'
  | 'coding';

export interface LLMRequest {
  /**
   * Model override. Format: 'provider/model-name'
   * e.g. 'openrouter/meta-llama/llama-3.1-8b-instruct', 'gemini/gemini-2.0-flash'
   * If omitted, router selects based on taskType.
   */
  model?: string;
  messages: LLMMessage[];
  /** Task type hint — drives smart routing. Always provide this. */
  taskType?: TaskType;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER CONFIG
// ─────────────────────────────────────────────────────────────────────────────

/** Provider identifiers used in the routing chain */
type ProviderId =
  | 'openrouter'
  | 'groq'
  | 'nara'
  | 'xpl'
  | 'gemini1'    // Key 1: LLE/Vision dedicated
  | 'gemini2'    // Key 2: Emergency fallback
  | 'openrouter2' // OR Key 2 — rotates when Key 1 budget hits 80%
  | 'openrouter3'; // OR Key 3 — rotates when Key 2 budget hits 80%

interface ProviderConfig {
  id: ProviderId;
  label: string;
  /** Max tokens to use per day before routing to next provider (0 = unlimited) */
  dailyTokenBudget: number;
  /** Max requests per day before routing to next provider (0 = unlimited) */
  dailyRequestBudget: number;
  /** Default model to use when no explicit model is set */
  defaultModel: string;
  apiKey: string | undefined;
}

const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter Key 1 (free auto)',
    dailyTokenBudget: 500_000,
    dailyRequestBudget: 0,
    // 'openrouter/free' auto-routes to the best available free model (confirmed working)
    defaultModel: 'openrouter/free',
    apiKey: process.env.OPENROUTER_API_KEY,
  },
  openrouter2: {
    id: 'openrouter2',
    label: 'OpenRouter Key 2 (free auto)',
    dailyTokenBudget: 500_000,
    dailyRequestBudget: 0,
    defaultModel: 'openrouter/free',
    apiKey: process.env.OPENROUTER_API_KEY_2,
  },
  openrouter3: {
    id: 'openrouter3',
    label: 'OpenRouter Key 3 (free auto)',
    dailyTokenBudget: 500_000,
    dailyRequestBudget: 0,
    defaultModel: 'openrouter/free',
    apiKey: process.env.OPENROUTER_API_KEY_3,
  },
  groq: {
    id: 'groq',
    label: 'Groq (free tier)',
    dailyTokenBudget: 100_000,
    dailyRequestBudget: 14_000,
    // openai/gpt-oss-20b: confirmed available and working on Groq free tier
    defaultModel: 'openai/gpt-oss-20b',
    apiKey: process.env.GROQ_API_KEY,
  },
  nara: {
    id: 'nara',
    label: 'Nara Router',
    dailyTokenBudget: 100_000,
    dailyRequestBudget: 0,
    defaultModel: 'meta-llama/llama-3-8b-instruct',
    apiKey: process.env.NARA_API_KEY,
  },
  xpl: {
    id: 'xpl',
    label: 'Experiential Labs (XPL)',
    dailyTokenBudget: 100_000,
    dailyRequestBudget: 0,
    defaultModel: 'gpt-4o-mini',
    apiKey: process.env.XPL_API_KEY,
  },
  gemini1: {
    id: 'gemini1',
    label: 'Gemini Pro Key 1 (LLE/Vision)',
    // Pro plan: budget conservatively at 26K tokens/day (80% of ~33K daily average)
    dailyTokenBudget: 26_000,
    dailyRequestBudget: 0,
    defaultModel: 'gemini-3.6-flash',
    apiKey: process.env.GEMINI_API_KEY,
  },
  gemini2: {
    id: 'gemini2',
    label: 'Gemini Pro Key 2 (Emergency Fallback)',
    // Hard cap at 50% — emergency only
    dailyTokenBudget: 16_000,
    dailyRequestBudget: 0,
    defaultModel: 'gemini-3.6-flash',
    apiKey: process.env.GEMINI_API_KEY_2,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ROUTING CHAINS — one per task type
// OR keys rotate 1→2→3 before falling to Groq/NARA/XPL → Gemini last
// ─────────────────────────────────────────────────────────────────────────────

const ALLOW_PAID_GEMINI_FALLBACK = process.env.ALLOW_PAID_GEMINI_FALLBACK === 'true';

const ROUTING_CHAINS: Record<TaskType, ProviderId[]> = {
  deterministic: [],
  analysis:      ['openrouter', 'openrouter2', 'openrouter3', 'groq', 'nara', 'gemini1', 'gemini2'],
  design:        ['openrouter', 'openrouter2', 'openrouter3', 'nara', 'groq', 'gemini1', 'gemini2'],
  assessment:    ['openrouter', 'openrouter2', 'openrouter3', 'groq', 'nara', 'gemini1', 'gemini2'],
  lle:           ['openrouter', 'openrouter2', 'openrouter3', 'groq', 'nara', 'xpl', 'gemini1', 'gemini2'],
  'lle-indic':   ['openrouter', 'openrouter2', 'openrouter3', 'groq', 'xpl', 'gemini1', 'gemini2'],
  vision:        ['openrouter', 'gemini1', 'gemini2'],
  coding:        ['openrouter', 'openrouter2', 'openrouter3', 'nara', 'xpl', 'gemini1', 'gemini2'],
};

// Model overrides: specific task type + provider combinations
const MODEL_OVERRIDES: Partial<Record<TaskType, Partial<Record<ProviderId, string>>>> = {
  'lle-indic': {
    openrouter: 'google/gemini-2.0-flash-exp:free',
    openrouter2: 'meta-llama/llama-3.1-8b-instruct:free',
    openrouter3: 'nvidia/nemotron-3.5-lightning:free',
    gemini1: 'gemini-3.6-flash',
    gemini2: 'gemini-3.6-flash',
  },
  vision: {
    openrouter: 'google/gemini-2.0-flash-exp:free',
    gemini1: 'gemini-3.6-flash',
    gemini2: 'gemini-3.6-flash',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// USAGE TRACKER
// ─────────────────────────────────────────────────────────────────────────────

interface ProviderUsage {
  tokensUsed: number;
  requestCount: number;
}

interface UsageData {
  date: string;
  usage: Record<ProviderId, ProviderUsage>;
}

const USAGE_FILE = path.resolve(process.cwd(), 'router_usage.json');

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function loadUsageData(): UsageData {
  const today = getTodayDateString();
  if (fs.existsSync(USAGE_FILE)) {
    try {
      const raw = fs.readFileSync(USAGE_FILE, 'utf-8');
      const data: UsageData = JSON.parse(raw);
      if (data.date === today) return data;
    } catch { /* corrupt — reset */ }
  }
  return {
    date: today,
    usage: {
      openrouter:  { tokensUsed: 0, requestCount: 0 },
      openrouter2: { tokensUsed: 0, requestCount: 0 },
      openrouter3: { tokensUsed: 0, requestCount: 0 },
      groq:        { tokensUsed: 0, requestCount: 0 },
      nara:        { tokensUsed: 0, requestCount: 0 },
      xpl:         { tokensUsed: 0, requestCount: 0 },
      gemini1:     { tokensUsed: 0, requestCount: 0 },
      gemini2:     { tokensUsed: 0, requestCount: 0 },
    },
  };
}

function saveUsageData(data: UsageData): void {
  try {
    fs.writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Router] Warning: Could not write router_usage.json:', err);
  }
}

function estimateTokens(messages: LLMMessage[]): number {
  return Math.ceil(messages.reduce((sum, m) => sum + m.content.length, 0) / 4);
}

function isBudgetExhausted(provider: ProviderConfig, usage: ProviderUsage): boolean {
  const tokenHit = provider.dailyTokenBudget > 0 && usage.tokensUsed >= provider.dailyTokenBudget * 0.8;
  const reqHit   = provider.dailyRequestBudget > 0 && usage.requestCount >= provider.dailyRequestBudget * 0.8;
  return tokenHit || reqHit;
}

function recordUsage(data: UsageData, providerId: ProviderId, estimatedTokens: number): void {
  data.usage[providerId].tokensUsed += estimatedTokens;
  data.usage[providerId].requestCount += 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ROUTER ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

export async function getLLMCompletion(request: LLMRequest): Promise<string> {
  const taskType: TaskType = request.taskType || 'analysis';

  if (taskType === 'deterministic') {
    console.log('[Router] Deterministic task — no LLM call needed.');
    return '';
  }

  // Legacy explicit model override
  if (request.model) {
    return await routeByModelString(request.model, request.messages);
  }

  const chain = ROUTING_CHAINS[taskType];
  const usageData = loadUsageData();
  const estimatedTokens = estimateTokens(request.messages);
  const errors: string[] = [];

  for (const providerId of chain) {
    const provider = PROVIDERS[providerId];

    if (!provider.apiKey) {
      console.log(`[Router] Skipping ${provider.label} — API key not set.`);
      continue;
    }

    if ((providerId === 'gemini1' || providerId === 'gemini2') && !ALLOW_PAID_GEMINI_FALLBACK) {
      console.log(`[Router] Skipping ${provider.label} — ALLOW_PAID_GEMINI_FALLBACK is disabled (Circuit Breaker active).`);
      continue;
    }

    if (isBudgetExhausted(provider, usageData.usage[providerId])) {
      const u = usageData.usage[providerId];
      console.log(`[Router] Skipping ${provider.label} — budget at 80% limit (${u.tokensUsed}/${provider.dailyTokenBudget} tokens).`);
      continue;
    }

    const model = MODEL_OVERRIDES[taskType]?.[providerId] ?? provider.defaultModel;
    console.log(`[Router] Task: ${taskType} → ${provider.label} (${model})`);

    try {
      const result = await callProvider(providerId, model, request.messages);
      recordUsage(usageData, providerId, estimatedTokens);
      saveUsageData(usageData);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`[${provider.label}]: ${msg}`);

      if (msg.includes('429') || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('quota')) {
        console.warn(`[Router] ${provider.label} rate-limited. Penalising and moving on.`);
        usageData.usage[providerId].tokensUsed = provider.dailyTokenBudget;
        saveUsageData(usageData);
        continue;
      }

      // Retry once for transient errors
      console.warn(`[Router] ${provider.label} transient error. Retrying once in 1s…`);
      await sleep(1000);
      try {
        const result = await callProvider(providerId, model, request.messages);
        recordUsage(usageData, providerId, estimatedTokens);
        saveUsageData(usageData);
        return result;
      } catch (retryErr: unknown) {
        const retryMsg = retryErr instanceof Error ? retryErr.message : String(retryErr);
        errors.push(`[${provider.label} retry]: ${retryMsg}`);
        console.error(`[Router] ${provider.label} failed on retry. Skipping.`);
        continue;
      }
    }
  }

  throw new Error(
    `[Router] All providers exhausted for task '${taskType}'.\n${errors.join('\n')}`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER DISPATCH
// ─────────────────────────────────────────────────────────────────────────────

async function callProvider(providerId: ProviderId, model: string, messages: LLMMessage[]): Promise<string> {
  switch (providerId) {
    case 'openrouter':  return await callOpenRouter(model, messages, PROVIDERS.openrouter.apiKey!);
    case 'openrouter2': return await callOpenRouter(model, messages, PROVIDERS.openrouter2.apiKey!);
    case 'openrouter3': return await callOpenRouter(model, messages, PROVIDERS.openrouter3.apiKey!);
    case 'groq':        return await callGroq(model, messages);
    case 'nara':        return await callNara(model, messages);
    case 'xpl':         return await callXpl(model, messages);
    case 'gemini1':     return await callGemini(model, messages, 'GEMINI_API_KEY');
    case 'gemini2':     return await callGemini(model, messages, 'GEMINI_API_KEY_2');
  }
}

/** Backward-compatible explicit model string routing */
async function routeByModelString(modelStr: string, messages: LLMMessage[]): Promise<string> {
  const splitIdx = modelStr.indexOf('/');
  const provider = splitIdx > -1 ? modelStr.substring(0, splitIdx) : modelStr;
  const modelName = splitIdx > -1 ? modelStr.substring(splitIdx + 1) : '';

  switch (provider) {
    case 'groq':    return await callGroq(modelName || 'llama-3.1-8b-instant', messages);
    case 'gemini':  return await callGemini(modelName || 'gemini-2.0-flash', messages, 'GEMINI_API_KEY');
    case 'gemini2': return await callGemini(modelName || 'gemini-2.0-flash', messages, 'GEMINI_API_KEY_2');
    case 'nara':    return await callNara(modelName || 'meta-llama/llama-3-8b-instruct', messages);
    case 'xpl':     return await callXpl(modelName || 'gpt-4o-mini', messages);
    default:        return await callOpenRouter(modelStr, messages, PROVIDERS.openrouter.apiKey || '');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER IMPLEMENTATIONS
// ─────────────────────────────────────────────────────────────────────────────

async function callOpenRouter(model: string, messages: LLMMessage[], key: string): Promise<string> {
  if (!key) throw new Error('OpenRouter API key is not set.');

  const candidateModels = (model === 'openrouter/free')
    ? ['openrouter/free', 'nvidia/nemotron-3.5-lightning:free', 'meta-llama/llama-3.1-8b-instruct:free', 'google/gemini-2.0-flash-exp:free']
    : [model, 'openrouter/free', 'nvidia/nemotron-3.5-lightning:free'];

  let lastError: Error | null = null;

  for (const m of candidateModels) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
          'X-Title': process.env.SITE_NAME || 'Aasha AI',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: m, messages }),
      });

      if (response.status === 429) {
        console.warn(`[OpenRouter] Model ${m} hit 429. Trying next free candidate in 1.5s...`);
        await sleep(1500);
        continue;
      }

      if (!response.ok) {
        throw new Error(`OpenRouter ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error('OpenRouter candidates failed.');
}

async function callGroq(model: string, messages: LLMMessage[]): Promise<string> {
  const key = PROVIDERS.groq.apiKey;
  if (!key) throw new Error('GROQ_API_KEY is not set.');
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages }),
  });
  if (!response.ok) throw new Error(`Groq ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function callNara(model: string, messages: LLMMessage[]): Promise<string> {
  const key = PROVIDERS.nara.apiKey;
  if (!key) throw new Error('NARA_API_KEY is not set.');
  const response = await fetch('https://router.bynara.id/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages }),
  });
  if (!response.ok) throw new Error(`Nara ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function callXpl(model: string, messages: LLMMessage[]): Promise<string> {
  const key = PROVIDERS.xpl.apiKey;
  if (!key) throw new Error('XPL_API_KEY is not set.');
  const response = await fetch('https://api.experientiallabs.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages }),
  });
  if (!response.ok) throw new Error(`XPL ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function callGemini(
  model: string,
  messages: LLMMessage[],
  keyEnvVar: 'GEMINI_API_KEY' | 'GEMINI_API_KEY_2'
): Promise<string> {
  const key = process.env[keyEnvVar];
  if (!key) throw new Error(`${keyEnvVar} is not set.`);
  const contents = buildGeminiContents(messages);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    }
  );
  if (!response.ok) throw new Error(`Gemini[${keyEnvVar}] ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Converts standard messages to Gemini's strict alternating user/model format.
 * System messages are merged into the first user turn.
 */
function buildGeminiContents(messages: LLMMessage[]): Array<{ role: string; parts: { text: string }[] }> {
  const systemText = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n');
  const nonSystem  = messages.filter(m => m.role !== 'system');

  const base = nonSystem.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    content: m.content,
  }));

  if (systemText && base.length > 0 && base[0].role === 'user') {
    base[0].content = systemText + '\n\n' + base[0].content;
  } else if (systemText) {
    base.unshift({ role: 'user', content: systemText });
  }

  // Merge consecutive same-role messages
  const merged: { role: string; content: string }[] = [];
  for (const msg of base) {
    if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
      merged[merged.length - 1].content += '\n\n' + msg.content;
    } else {
      merged.push({ ...msg });
    }
  }

  return merged.map(m => ({ role: m.role, parts: [{ text: m.content }] }));
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function printUsageSummary(): void {
  const data = loadUsageData();
  console.log(`\n📊 Router Usage Summary — ${data.date}`);
  console.log('─'.repeat(70));
  for (const [id, usage] of Object.entries(data.usage) as [ProviderId, ProviderUsage][]) {
    const config = PROVIDERS[id];
    const tokenPct = config.dailyTokenBudget > 0
      ? `${((usage.tokensUsed / config.dailyTokenBudget) * 100).toFixed(1)}%`
      : 'no cap';
    console.log(
      `  ${config.label.padEnd(35)} tokens: ${String(usage.tokensUsed).padStart(7)} / ${String(config.dailyTokenBudget || '∞').padStart(7)} (${tokenPct})  reqs: ${usage.requestCount}`
    );
  }
  console.log('─'.repeat(70) + '\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI — npx ts-node llm_router.ts --test | --usage
// ─────────────────────────────────────────────────────────────────────────────

if (require.main === module) {
  if (process.argv.includes('--usage')) {
    printUsageSummary();
  } else if (process.argv.includes('--test')) {
    console.log('[Router Test] Running smoke test…\n');
    (async () => {
      const cases: Array<{ taskType: TaskType; prompt: string }> = [
        { taskType: 'analysis',   prompt: 'List 3 concept nodes for: Fractions.' },
        { taskType: 'lle-indic',  prompt: 'Translate to Devanagari: fraction.' },
        { taskType: 'assessment', prompt: 'Write 1 MCQ about the water cycle, 4 options.' },
      ];
      for (const tc of cases) {
        console.log(`\n--- Task: ${tc.taskType} ---`);
        try {
          const result = await getLLMCompletion({
            taskType: tc.taskType,
            messages: [{ role: 'user', content: tc.prompt }],
          });
          console.log('Result (first 200 chars):', result.substring(0, 200));
        } catch (err) {
          console.error('FAILED:', err);
        }
      }
      printUsageSummary();
    })();
  }
}
