import 'dotenv/config';
export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenRouterRequest {
  model?: string;
  messages: OpenRouterMessage[];
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: OpenRouterMessage;
  }[];
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const NINEROUTER_BASE_URL = process.env.NINEROUTER_BASE_URL || 'http://localhost:20128/v1';
const NINEROUTER_API_KEY = process.env.NINEROUTER_API_KEY; // Must be set in .env; not hard‑coded
const DEFAULT_LLM_PROVIDER = process.env.DEFAULT_LLM_PROVIDER || '9router';
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const SITE_NAME = process.env.SITE_NAME || 'Aasha AI';

/**
 * Sends a chat completion request to 9router (default) or OpenRouter (fallback).
 */
export async function getOpenRouterCompletion(request: OpenRouterRequest): Promise<string> {
  // 1. Primary: 9Router Gateway
  if (DEFAULT_LLM_PROVIDER === '9router') {
    try {
      const model = request.model && !request.model.startsWith('openrouter/')
        ? request.model
        : (process.env.NINEROUTER_DEFAULT_MODEL || 'claude-combo');

      const response = await fetch(`${NINEROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NINEROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: request.messages,
          stream: false,
        }),
        signal: AbortSignal.timeout(45_000),
      });

      if (response.ok) {
        const data: OpenRouterResponse = await response.json();
        return data.choices[0]?.message.content || '';
      }
      const errText = await response.text();
      console.warn(`[9ROUTER] HTTP ${response.status}: ${errText.slice(0, 150)}. Falling back to OpenRouter.`);
    } catch (err: unknown) {
      console.warn(`[9ROUTER] Failed to connect (${err instanceof Error ? err.message : err}). Falling back to OpenRouter.`);
    }
  }

  // 2. Secondary Fallback: OpenRouter
  if (!OPENROUTER_API_KEY) {
    console.warn('Warning: OPENROUTER_API_KEY is not set in environment variables.');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': SITE_URL,
      'X-Title': SITE_NAME,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model || 'openrouter/auto',
      messages: request.messages,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
  }

  const data: OpenRouterResponse = await response.json();
  return data.choices[0]?.message.content || '';
}

// Example usage:
// getOpenRouterCompletion({
//   messages: [{ role: 'user', content: 'What is the meaning of life?' }]
// }).then(console.log).catch(console.error);
