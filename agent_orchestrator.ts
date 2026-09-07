import { getOpenRouterCompletion, OpenRouterMessage } from './openrouter';

export type AgentRole = 'IngestAgent' | 'AnalysisAgent' | 'DesignAgent' | 'AssessmentAgent' | 'LLEAgent' | 'QAAgent' | 'BrowserTesterAgent';

interface AgentConfig {
  role: AgentRole;
  systemPrompt: string;
  defaultModel: string;
}

const TRUTH_SEEKING_PROTOCOL = `
Adhere to the Truth-Seeking Epistemic Protocol:
1. ANSWER WITHOUT GUESSING: Never invent facts.
2. CHECK YOUR WORK: Audit for logical consistency and empirical accuracy.
3. BE HONEST ABOUT UNCERTAINTY: Never present an assumption or unverified prediction as fact.
Output must include a Confidence score (0.0-1.0) and Caveats if applicable, before or within the JSON output.
`;

const AGENTS: Record<AgentRole, AgentConfig> = {
  IngestAgent: {
    role: 'IngestAgent',
    systemPrompt: `You are the IngestAgent. Your responsibility is to extract structured text, headings, and images from source PDFs.
Model Required: NO (Deterministic Python / PyMuPDF). In this Node.js wrapper, you trigger deterministic Python extraction scripts.`,
    defaultModel: 'deterministic/python', // Handled deterministically, no LLM
  },
  AnalysisAgent: {
    role: 'AnalysisAgent',
    systemPrompt: `You are the AnalysisAgent for the Aasha Foundation.
Your task is to map raw text to 3–5 core pedagogical Concept Nodes. Select target grade competencies and identify worked example opportunities.
Do not exceed 5 concept nodes per chapter (cognitive load limit).
${TRUTH_SEEKING_PROTOCOL}
Output your analysis in strict JSON format matching the content_map schema.`,
    defaultModel: 'openrouter/auto', // Fast Reasoning (Gemini Flash / GPT-4o-mini / Local 8B)
  },
  DesignAgent: {
    role: 'DesignAgent',
    systemPrompt: `You are the DesignAgent.
Your task is to sequence each node through the proven pedagogical flow: Intro -> Concept Text -> Interactive Visual -> Worked Example -> Quiz -> Progress.
Select visual manipulatives from the Visual Contract registry. Cannot invent unsupported interactive step types.

[SKILL: visual-simulation-builder]
- Technical Contract: mount(container, config), getState(), reset(), destroy()
- Touch Rules: Minimum tap target 44x44px. Zero HTML5 drag-and-drop (strictly tap-to-select). Provide skip button.

${TRUTH_SEEKING_PROTOCOL}
Output your design in strict JSON format matching the chapter_spec schema.`,
    defaultModel: 'openrouter/auto', // Fast Reasoning
  },
  AssessmentAgent: {
    role: 'AssessmentAgent',
    systemPrompt: `You are the AssessmentAgent.
Your task is to author options per question with exactly 1 correct answer and verbal misconception explanations (m field) for every wrong option.

[SKILL: assessment-authoring]
Golden Zero-Spoiler Rule:
- Exactly 3 or 4 options per question.
- Exactly ONE option is correct.
- Every incorrect option MUST have a meaningful misconception explanation (m field).
- The misconception explanation must explain WHY the student was mistaken; it must NEVER state or leak the correct answer.

${TRUTH_SEEKING_PROTOCOL}
Output your assessments in strict JSON format.`,
    defaultModel: 'openrouter/auto', // Deep Reasoning (Claude 3.5 Sonnet / Gemini Pro / Freebuff)
  },
  LLEAgent: {
    role: 'LLEAgent',
    systemPrompt: `You are the LLEAgent (Language Learning Engine).
Your task is bilingual translation and transliteration. Map English terms to Indic scripts (Devanagari, Tamil, etc.).

[SKILL: lle-translation]
- Format Specification: Local Meaning (English Pronunciation in Local Script)
- Example: fraction -> भिन्न (फ्रैक्शन)
- Mathematical Collision Insulation Rule: Mathematical variables (x, y, a, b) and formulas must NEVER be translated or modified by the dictionary lookup engine.

${TRUTH_SEEKING_PROTOCOL}
Output in strict JSON.`,
    defaultModel: 'openrouter/auto', // Fast / Indic Specialized
  },
  QAAgent: {
    role: 'QAAgent',
    systemPrompt: `You are the QAAgent. Your responsibility is to execute the 200+ check L-Truth evaluation suite.
Model Required: NO (Deterministic Node.js / Python harness). In this Node.js wrapper, you trigger the existing run_qa.js harness.`,
    defaultModel: 'deterministic/node', // Handled deterministically
  },
  BrowserTesterAgent: {
    role: 'BrowserTesterAgent',
    systemPrompt: `You are the BrowserTesterAgent. You validate the generated gamified HTML chapters by simulating browser environments (using jsdom).`,
    defaultModel: 'deterministic/node',
  },
};

export async function runAgent(role: AgentRole, inputContent: string, modelOverride?: string): Promise<string> {
  const agent = AGENTS[role];
  const messages: OpenRouterMessage[] = [
    { role: 'system', content: agent.systemPrompt },
    { role: 'user', content: inputContent }
  ];

  console.log(`[Agent: ${role}] Starting task using model: ${modelOverride || agent.defaultModel}`);
  
  try {
    const result = await getOpenRouterCompletion({
      model: modelOverride || agent.defaultModel,
      messages
    });
    console.log(`[Agent: ${role}] Task completed successfully.`);
    return result;
  } catch (error) {
    console.error(`[Agent: ${role}] Task failed:`, error);
    throw error;
  }
}

// Automated Verification Hook
if (require.main === module) {
  const isTest = process.argv.includes('--test');
  if (isTest) {
    console.log("Running Multi-Agent automated verification...");
    (async () => {
      try {
        const result = await runAgent('LLEAgent', 'Translate the word: fraction', 'openrouter/auto');
        console.log("Test Result:", result);
      } catch (err) {
        console.error("Test failed.", err);
      }
    })();
  }
}
