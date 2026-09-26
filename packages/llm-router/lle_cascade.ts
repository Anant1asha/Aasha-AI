/**
 * AASHA LLE Cascade — packages/llm-router/lle_cascade.ts
 *
 * 3-Layer Hindi (Indic) Translation Cascade — ZERO paid API bleed
 *
 * Layer 1 (DETERMINISTIC): Local WM dictionary lookup     — 0 API cost, <1ms
 * Layer 2 (DETERMINISTIC): Google Translate free endpoint — 0 API cost, ~500ms
 * Layer 3 (FREE LLM):      gemini-2.0-flash-exp:free      — 0 API cost, ~2-5s
 *
 * MATH INSULATION: All terms pass MathInsulator BEFORE any layer.
 * Mathematical variables (x, y, a, b) and LaTeX expressions are NEVER translated.
 *
 * Anti-Bleed: Layer 3 uses OpenRouter free pool — NOT paid Gemini API.
 *
 * @see packages/aasha-rules/math_insulator.ts for insulation contract
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Math Insulation (protect variables and LaTeX from translation)
// ---------------------------------------------------------------------------

const MATH_VAR_PATTERN = /^[a-z]$/i;    // single-letter variables: x, y, a, b
const LATEX_PATTERN = /\$|\\[a-z]/;     // LaTeX: $, \frac, \sqrt etc.
const NUMBER_PATTERN = /^\d+(\.\d+)?$/; // pure numbers

function isMathTerm(term: string): boolean {
  const t = term.trim();
  return (
    MATH_VAR_PATTERN.test(t) ||
    LATEX_PATTERN.test(t) ||
    NUMBER_PATTERN.test(t)
  );
}

// ---------------------------------------------------------------------------
// Layer 1: Local WM Dictionary Lookup
// ---------------------------------------------------------------------------

// Resolve dictionary base from CWD (project root) — works reliably in tsx + node
// tsx: __dirname may resolve to a temp dir. CWD = Aasha-AI/ when run from project root.
const DICT_BASE = (() => {
  // Try CWD-relative first (standard run from Aasha-AI/ root)
  const cwdPath = path.join(process.cwd(), 'Aasha-AIOS', 'layer-2-education', 'lle', 'dictionaries');
  if (fs.existsSync(cwdPath)) return cwdPath;

  // Fallback: walk up from __filename (tsx provides this via import.meta)
  // Go up from packages/llm-router/ → Aasha-AI/ → AIOS layer
  const filePath = path.join(
    path.dirname(process.argv[1] ?? __filename ?? ''),
    '../../Aasha-AIOS/layer-2-education/lle/dictionaries'
  );
  if (fs.existsSync(filePath)) return filePath;

  // Hard fallback: absolute path pattern for this repo
  return cwdPath; // let downstream existsSync handle missing gracefully
})();

function loadDictionary(lang: string): Record<string, string> {
  const dictPath = path.join(DICT_BASE, `${lang}.json`);
  if (!fs.existsSync(dictPath)) return {};
  try {
    const raw = fs.readFileSync(dictPath, 'utf-8');
    const parsed = JSON.parse(raw);
    // Support both flat {word: translation} and {lang: {word: translation}} shapes
    return parsed[lang] ?? parsed;
  } catch {
    return {};
  }
}

function lookupDictionary(term: string, lang: string): string | null {
  const dict = loadDictionary(lang);
  const key = term.toLowerCase().trim();
  return dict[key] ?? null;
}

// ---------------------------------------------------------------------------
// Layer 2: Google Translate Free Endpoint (no key required)
// ---------------------------------------------------------------------------

async function googleTranslateFree(
  term: string,
  targetLang: string,
  timeoutMs = 3000
): Promise<string | null> {
  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(term)}`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': 'Aasha-LLE/2.0' },
    });
    if (!res.ok) return null;
    const data = await res.json() as any;
    const translated: string = data?.[0]?.[0]?.[0];
    if (!translated || translated.toLowerCase() === term.toLowerCase()) return null;
    return translated;
  } catch {
    return null; // timeout or network error — fall through to Layer 3
  }
}

// ---------------------------------------------------------------------------
// Layer 3: gemini-2.0-flash-exp:free via OpenRouter (Tier 1 — FREE)
// ---------------------------------------------------------------------------

async function openrouterIndicLLM(
  term: string,
  lang: string,
  langName: string,
  script: string
): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn('[LLE Layer 3] OPENROUTER_API_KEY not set. Cannot call free Indic LLM.');
    return null;
  }

  const systemPrompt =
    `You are a bilingual educational translator for Indian government-school students.\n` +
    `Translate the English educational term to ${langName} (${script} script).\n` +
    `Format: ${langName}_meaning (English_pronunciation_in_${script})\n` +
    `Example: "fraction" → "भिन्न (फ्रैक्शन)"\n` +
    `Rules:\n` +
    `- Never translate mathematical variables (x, y, a, b) or LaTeX expressions.\n` +
    `- Use natural, commonly understood ${langName}.\n` +
    `- Respond ONLY with the translation in the specified format. No explanation.`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
        'X-Title': 'Aasha AI LLE',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Translate: "${term}"` },
        ],
        max_tokens: 128,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return null;
    const data = await res.json() as any;
    const text: string = data?.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Language Config
// ---------------------------------------------------------------------------

const LANG_CONFIG: Record<string, { name: string; script: string; gtCode: string }> = {
  hi: { name: 'Hindi',   script: 'Devanagari', gtCode: 'hi' },
  ta: { name: 'Tamil',   script: 'Tamil',      gtCode: 'ta' },
  te: { name: 'Telugu',  script: 'Telugu',     gtCode: 'te' },
  bn: { name: 'Bengali', script: 'Bengali',    gtCode: 'bn' },
  mr: { name: 'Marathi', script: 'Devanagari', gtCode: 'mr' },
};

// ---------------------------------------------------------------------------
// Main Export: 3-Layer Cascade
// ---------------------------------------------------------------------------

export interface LLEResult {
  term: string;
  lang: string;
  translation: string | null;
  layer: 0 | 1 | 2 | 3;  // 0 = math-insulated (not translated), 1 = dict, 2 = google, 3 = llm
  source: 'MATH_INSULATED' | 'WM_DICTIONARY' | 'GOOGLE_TRANSLATE' | 'OPENROUTER_LLM' | 'NOT_FOUND';
  cached?: boolean;
}

const _cache = new Map<string, LLEResult>();

function autoPersistToDictionary(term: string, lang: string, translation: string): void {
  try {
    const dictPath = path.join(DICT_BASE, `${lang}.json`);
    let dict: Record<string, any> = {};
    if (fs.existsSync(dictPath)) {
      const raw = fs.readFileSync(dictPath, 'utf-8');
      dict = JSON.parse(raw.replace(/^\uFEFF/, ''));
    }
    const key = term.toLowerCase().trim();
    if (!dict[key]) {
      dict[key] = translation;
      fs.writeFileSync(dictPath, JSON.stringify(dict, null, 2) + '\n', 'utf-8');
      console.log(`[LLE Cascade] 💾 Auto-persisted new term to ${lang}.json: "${key}" → "${translation}"`);
    }
  } catch (err: any) {
    console.warn(`[LLE Cascade] Warning: Failed to auto-persist "${term}" to ${lang}.json: ${err.message}`);
  }
}

export async function translateTerm(
  term: string,
  lang: string = 'hi'
): Promise<LLEResult> {
  const cacheKey = `${lang}:${term}`;
  if (_cache.has(cacheKey)) {
    return { ..._cache.get(cacheKey)!, cached: true };
  }

  // Math insulation check — FIRST, before any translation attempt
  if (isMathTerm(term)) {
    const result: LLEResult = {
      term, lang, translation: null,
      layer: 0, source: 'MATH_INSULATED',
    };
    _cache.set(cacheKey, result);
    return result;
  }

  const config = LANG_CONFIG[lang];
  if (!config) {
    return { term, lang, translation: null, layer: 0, source: 'NOT_FOUND' };
  }

  // Layer 1: WM Dictionary (deterministic, 0 cost)
  const dictResult = lookupDictionary(term, lang);
  if (dictResult) {
    const result: LLEResult = {
      term, lang, translation: dictResult,
      layer: 1, source: 'WM_DICTIONARY',
    };
    _cache.set(cacheKey, result);
    return result;
  }

  // Layer 2: Google Translate free (deterministic, 0 cost, ~500ms)
  const gtResult = await googleTranslateFree(term, config.gtCode);
  if (gtResult) {
    autoPersistToDictionary(term, lang, gtResult);
    const result: LLEResult = {
      term, lang, translation: gtResult,
      layer: 2, source: 'GOOGLE_TRANSLATE',
    };
    _cache.set(cacheKey, result);
    return result;
  }

  // Layer 3: gemini-2.0-flash-exp:free via OpenRouter (free LLM, ~3-5s)
  const llmResult = await openrouterIndicLLM(term, lang, config.name, config.script);
  if (llmResult) {
    autoPersistToDictionary(term, lang, llmResult);
  }
  const result: LLEResult = {
    term, lang,
    translation: llmResult,
    layer: 3,
    source: llmResult ? 'OPENROUTER_LLM' : 'NOT_FOUND',
  };
  _cache.set(cacheKey, result);
  return result;
}

/** Batch translate an array of terms */
export async function translateBatch(
  terms: string[],
  lang: string = 'hi'
): Promise<LLEResult[]> {
  return Promise.all(terms.map(t => translateTerm(t, lang)));
}

/** Build a WM dictionary object from an array of terms (for chapter use) */
export async function buildChapterWM(
  terms: string[],
  lang: string = 'hi'
): Promise<Record<string, string>> {
  const results = await translateBatch(terms, lang);
  const wm: Record<string, string> = {};
  for (const r of results) {
    if (r.translation && r.source !== 'MATH_INSULATED') {
      wm[r.term] = r.translation;
    }
  }
  return wm;
}

// ---------------------------------------------------------------------------
// CLI Self-Test
// ---------------------------------------------------------------------------

if (process.argv.includes('--test')) {
  (async () => {
    console.log('\n🌏 LLE Cascade — 3-Layer Self-Test (Hindi)\n');

    const testTerms = ['fraction', 'equation', 'x', 'a', '42', 'theorem', 'supercalifragilistic'];

    for (const term of testTerms) {
      const r = await translateTerm(term, 'hi');
      const icon = r.source === 'MATH_INSULATED' ? '🔒'
        : r.layer === 1 ? '📖'
        : r.layer === 2 ? '🌐'
        : r.layer === 3 ? '🤖'
        : '❓';
      console.log(`${icon} "${term}" → ${r.translation ?? 'NOT_FOUND'} [${r.source}]`);
    }

    console.log('\n✅ LLE cascade test complete.\n');
  })();
}
