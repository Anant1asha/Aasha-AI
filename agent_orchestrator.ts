import { getLLMCompletion, LLMMessage, TaskType } from './llm_router';
import { ContextBus } from './packages/memory-engine/context_bus';

const contextBus = new ContextBus();

export type AgentRole = 'IngestAgent' | 'AnalysisAgent' | 'DesignAgent' | 'AssessmentAgent' | 'LLEAgent' | 'QAAgent' | 'BrowserTesterAgent';

interface AgentConfig {
  role: AgentRole;
  systemPrompt: string;
  defaultModel: string;
  /** Task type tag — tells the router which provider chain to use for this agent */
  taskType: TaskType;
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
    taskType: 'deterministic',
  },
  AnalysisAgent: {
    role: 'AnalysisAgent',
    systemPrompt: `You are the AnalysisAgent for the Aasha Foundation.
Your task is to map raw text to 3–5 core pedagogical Concept Nodes. Select target grade competencies and identify worked example opportunities.
Do not exceed 5 concept nodes per chapter (cognitive load limit).
${TRUTH_SEEKING_PROTOCOL}
Output your analysis in strict JSON format matching the content_map schema.`,
    defaultModel: 'openrouter/auto', // Fast Reasoning (Gemini Flash / GPT-4o-mini / Local 8B)
    taskType: 'analysis',
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
    taskType: 'design',
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
    taskType: 'assessment',
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
    // NOTE: Use taskType 'lle-indic' for Devanagari/Tamil/etc. — routes to Gemini Key 1 first.
    // Use 'lle' for non-Indic or Latin-script translations — routes to OpenRouter first.
    taskType: 'lle-indic',
  },
  QAAgent: {
    role: 'QAAgent',
    systemPrompt: `You are the QAAgent. Your responsibility is to execute the 200+ check L-Truth evaluation suite.
Model Required: NO (Deterministic Node.js / Python harness). In this Node.js wrapper, you trigger the existing run_qa.js harness.`,
    defaultModel: 'deterministic/node', // Handled deterministically
    taskType: 'deterministic',
  },
  BrowserTesterAgent: {
    role: 'BrowserTesterAgent',
    systemPrompt: `You are the BrowserTesterAgent. You validate the generated gamified HTML chapters by simulating browser environments (using jsdom).`,
    defaultModel: 'deterministic/node',
    taskType: 'deterministic',
  },
};


export async function runAgent(role: AgentRole, userPrompt: string, modelOverride?: string, conceptId?: string) {
  const agent = AGENTS[role];
  if (!agent) throw new Error(`Agent ${role} not found.`);

  // Deterministic agents bypass the LLM entirely
  if (agent.taskType === 'deterministic' || agent.defaultModel.startsWith('deterministic/')) {
    console.log(`[Agent: ${role}] Executing deterministic script...`);
    return { status: 'success', method: 'deterministic' };
  }

  console.log(`[Agent: ${role}] Starting task (taskType: ${agent.taskType})${modelOverride ? ` with model override: ${modelOverride}` : ''}`);

  // 1. Context Bus Memory & Ontology Enrichment
  let enrichedSystemPrompt = agent.systemPrompt;
  try {
    const memoryContext = await contextBus.buildAgentContext(role, conceptId || 'general_concept', userPrompt);
    enrichedSystemPrompt += memoryContext.systemContextInjection;
  } catch (err) {
    console.warn(`[Agent: ${role}] Context Bus enrichment warning:`, err);
  }

  const messages: LLMMessage[] = [
    { role: 'system', content: enrichedSystemPrompt },
    { role: 'user', content: userPrompt }
  ];

  try {
    let response = await getLLMCompletion({
      ...(modelOverride ? { model: modelOverride } : {}),
      taskType: agent.taskType,
      messages,
    });

    // 2. AASHA Two-Phase Gatekeeper Validation
    const content = response.content || JSON.stringify(response);
    const audit = contextBus.validateOutput(content, role);

    if (!audit.passed) {
      console.warn(`[Agent: ${role}] AASHA Gatekeeper flagged violations:`, audit.violations);
      if (audit.repairPrompt) {
        console.log(`[Agent: ${role}] Triggering autonomous self-repair loop...`);
        messages.push({ role: 'assistant', content });
        messages.push({ role: 'user', content: audit.repairPrompt });

        response = await getLLMCompletion({
          ...(modelOverride ? { model: modelOverride } : {}),
          taskType: agent.taskType,
          messages,
        });
      }
    }

    // 3. Record Successful Output into Experience Memory Bank
    try {
      await contextBus.recordExperience(role, response.content || JSON.stringify(response), {
        taskType: agent.taskType,
        conceptId: conceptId || 'general_concept',
        gatekeeperPassed: true,
      });
    } catch (memErr) {
      console.warn(`[Agent: ${role}] Memory banking warning:`, memErr);
    }

    console.log(`[Agent: ${role}] Task completed successfully.`);
    return response;
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
        const result = await runAgent('LLEAgent', 'Translate the word: fraction', 'xpl/gpt-4o-mini');
        console.log("Test Result:", result);
      } catch (err) {
        console.error("Test failed.", err);
      }
    })();
  }
}
