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

if (!OPENROUTER_API_KEY) {
  console.warn('Warning: OPENROUTER_API_KEY is not set in environment variables.');
}
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const SITE_NAME = process.env.SITE_NAME || 'Aasha AI';

/**
 * Sends a chat completion request to OpenRouter.
 */
export async function getOpenRouterCompletion(request: OpenRouterRequest): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': SITE_URL,
      'X-Title': SITE_NAME,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model || 'openrouter/auto', // Routing to best models via openrouter
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
