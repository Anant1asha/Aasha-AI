# Smart LLM Router Guide
**Aasha AI — Multi-Provider Cost Protection Architecture**

---

## Why This Exists

The Aasha pipeline runs many LLM calls across 6 agents. Without routing control,
all calls defaulted to whichever provider was set — often draining Gemini API quota.
This router introduces a **5-tier fallback chain** with **daily budget tracking**
so Gemini keys are only touched when no free/cheaper alternative is available.

---

## How Routing Works

Every `getLLMCompletion()` call now requires a `taskType`. The router:

1. Looks up the **provider chain** for that task type
2. Checks each provider: is the **API key set**? Is the **daily budget < 80%**?
3. Tries the first valid provider
4. On `429` / rate-limit: **penalises that provider** (marks as budget-exhausted) and moves to the next
5. On transient error: **retries once** after 1 second, then moves to the next
6. If all providers fail: throws a detailed error listing every failure

---

## Routing Chains by Task Type

| Task Type | Chain (left = first tried) |
|---|---|
| `analysis` | OpenRouter ? Groq ? NARA ? Gemini-1 ? Gemini-2 |
| `design` | OpenRouter ? NARA ? Groq ? Gemini-1 ? Gemini-2 |
| `assessment` | OpenRouter ? Groq ? NARA ? Gemini-1 ? Gemini-2 |
| `lle` | OpenRouter ? Groq ? NARA ? XPL ? Gemini-1 ? Gemini-2 |
| `lle-indic` | **Gemini-1 ? XPL ? Gemini-2** (Gemini is best for Indic) |
| `vision` | **Gemini-1 ? Gemini-2** (only multimodal providers) |
| `coding` | OpenRouter (Claude) ? NARA ? XPL ? Gemini-1 ? Gemini-2 |
| `deterministic` | No LLM call — returns immediately |

---

## Daily Budget Thresholds

Budgets are tracked in `router_usage.json` (auto-created, auto-resets daily at midnight).
The router skips a provider when its usage hits **80% of the daily budget**.

| Provider | Daily Token Budget | Trigger at |
|---|---|---|
| OpenRouter | 500,000 tokens | 400,000 |
| Groq | 100,000 tokens | 80,000 |
| NARA | 100,000 tokens | 80,000 |
| XPL | 100,000 tokens | 80,000 |
| Gemini Key 1 | 26,000 tokens | 20,800 |
| Gemini Key 2 | 16,000 tokens | 12,800 |

> To adjust these, edit the `PROVIDERS` config object in `llm_router.ts`.

---

## Model Selection per Task Type

Some task+provider combos use a specific model override instead of the provider default:

| Task Type | Provider | Model |
|---|---|---|
| `coding` | OpenRouter | `anthropic/claude-3.5-sonnet:beta` |
| `assessment` | OpenRouter | `google/gemma-3-27b-it:free` |
| `lle-indic` | Gemini-1 & 2 | `gemini-1.5-pro` |
| `vision` | Gemini-1 & 2 | `gemini-1.5-pro` |
| All others | (each provider default) | See `PROVIDERS` in `llm_router.ts` |

---

## Reading the Usage File

After running any agent task, check `router_usage.json` in the project root:

```json
{
  "date": "2026-09-10",
  "usage": {
    "openrouter": { "tokensUsed": 12340, "requestCount": 18 },
    "groq":       { "tokensUsed": 0,     "requestCount": 0 },
    "nara":       { "tokensUsed": 0,     "requestCount": 0 },
    "xpl":        { "tokensUsed": 0,     "requestCount": 0 },
    "gemini1":    { "tokensUsed": 0,     "requestCount": 0 },
    "gemini2":    { "tokensUsed": 0,     "requestCount": 0 }
  }
}
```

Print a live summary any time:
```bash
npx ts-node llm_router.ts --usage
```

---

## Using the Router in Your Code

### Standard usage (recommended — always set taskType)
```typescript
import { getLLMCompletion } from './llm_router';

const result = await getLLMCompletion({
  taskType: 'analysis',  // ? tells the router which chain to use
  messages: [
    { role: 'system', content: 'You are the AnalysisAgent.' },
    { role: 'user', content: 'Extract 3 concept nodes from this text...' },
  ],
});
```

### Legacy usage (explicit model — backward compatible)
```typescript
const result = await getLLMCompletion({
  model: 'groq/llama-3.1-8b-instant',  // direct provider/model override
  messages: [...],
});
```

### Via the Agent Orchestrator (recommended for pipeline)
```typescript
import { runAgent } from './agent_orchestrator';

// taskType is set automatically based on the agent role
const result = await runAgent('AnalysisAgent', 'Extract concept nodes from: ...');

// Override model for a specific call (bypasses smart routing)
const result = await runAgent('LLEAgent', 'Translate: fraction', 'xpl/gpt-4o-mini');
```

---

## Adding a New Provider

1. Add a new entry to the `ProviderId` union type in `llm_router.ts`
2. Add its config to the `PROVIDERS` record
3. Add a `callYourProvider()` function
4. Add it to the `callProvider()` switch
5. Insert it into the relevant `ROUTING_CHAINS` entries at the priority position you want
6. Add its default usage entry to the `loadUsageData()` return object

---

## Gemini Key Strategy

| Key | Env Var | Purpose | Daily Cap |
|---|---|---|---|
| Gemini Key 1 | `GEMINI_API_KEY` | LLE Indic + Vision (primary) | 26K tokens |
| Gemini Key 2 | `GEMINI_API_KEY_2` | Emergency overflow for ALL tasks | 16K tokens |

> **If Gemini Key 2 is firing regularly**: your free-tier providers are exhausted earlier than
> expected. Increase their `dailyTokenBudget` if you have quota headroom, or review
> prompt sizes to reduce token consumption.

---

## Claude Code CLI (for Manual Agentic Work)

Claude Code CLI (`npx @anthropic-ai/claude-code`) is a **terminal tool** for interactive,
high-complexity repairs — it is NOT an API endpoint called by this router.

**Workflow**:
- Pipeline batch tasks ? handled by this router (OpenRouter ? Groq ? ... ? Gemini)
- Complex chapter repairs needing multi-step reasoning ? paste into Claude Code CLI terminal

Both are complementary. The router handles automation; Claude Code handles interactive repair.
