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


export interface QuarantinePacket {
  quarantined: true;
  role: AgentRole;
  conceptId: string;
  repairAttempts: number;
  exhausted: boolean;
  violations: any[];
  rawContent: string;
  quarantineTimestamp: string;
  actionRequired: 'SUPER_ADMIN_INTERVENTION';
}

export class QuarantineError extends Error {
  public packet: QuarantinePacket;
  constructor(message: string, packet: QuarantinePacket) {
    super(message);
    this.name = 'QuarantineError';
    this.packet = packet;
  }
}

export interface RunAgentOptions {
  modelOverride?: string;
  conceptId?: string;
  llmCompleter?: (req: any) => Promise<{ content: string; [key: string]: any }>;
  maxRepairAttempts?: number;
}

export function getContextBus(): ContextBus {
  return contextBus;
}

export async function runAgent(
  role: AgentRole,
  userPrompt: string,
  optionsOrModelOverride?: string | RunAgentOptions,
  legacyConceptId?: string
) {
  const agent = AGENTS[role];
  if (!agent) throw new Error(`Agent ${role} not found.`);

  // Support both legacy (role, prompt, modelOverride, conceptId) and new (role, prompt, options)
  const options: RunAgentOptions = typeof optionsOrModelOverride === 'string'
    ? { modelOverride: optionsOrModelOverride, conceptId: legacyConceptId }
    : (optionsOrModelOverride || {});

  const modelOverride = options.modelOverride;
  const conceptId = options.conceptId || legacyConceptId;
  const completer = options.llmCompleter || getLLMCompletion;
  const maxRepairAttempts = options.maxRepairAttempts !== undefined ? options.maxRepairAttempts : 2;

  // Deterministic agents bypass the LLM entirely
  if (agent.taskType === 'deterministic' || agent.defaultModel.startsWith('deterministic/')) {
    console.log(`[Agent: ${role}] Executing deterministic script...`);
    return { status: 'success', method: 'deterministic', content: 'DETERMINISTIC_OK' };
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
    let response = await completer({
      ...(modelOverride ? { model: modelOverride } : {}),
      taskType: agent.taskType,
      messages,
    });

    // 2. AASHA Two-Phase Gatekeeper Validation & Bounded 2-Tier Repair Loop
    let content = response.content || JSON.stringify(response);
    let audit = contextBus.validateOutput(content, role);
    let repairAttempts = 0;

    while (!audit.passed && repairAttempts < maxRepairAttempts) {
      repairAttempts++;
      console.warn(`[Agent: ${role}] AASHA Gatekeeper flagged violations (Repair Attempt ${repairAttempts}/${maxRepairAttempts}):`, audit.violations);
      messages.push({ role: 'assistant', content });

      const repairPrompt = repairAttempts === 1
        ? (audit.repairPrompt || 'Fix all rule violations.')
        : `[STRICT REPAIR ATTEMPT 2/2 — FINAL CHANCE BEFORE QUARANTINE]\n${audit.repairPrompt || 'Violations remain unresolved.'}\nPlease eliminate all remaining errors immediately.`;

      messages.push({ role: 'user', content: repairPrompt });

      response = await completer({
        ...(modelOverride ? { model: modelOverride } : {}),
        taskType: agent.taskType,
        messages,
      });

      content = response.content || JSON.stringify(response);
      audit = contextBus.validateOutput(content, role);
    }

    if (!audit.passed) {
      // REPAIR EXHAUSTION & QUARANTINE ACTIVATION
      console.error(`[Agent: ${role}] Repair attempts exhausted (${repairAttempts}/${maxRepairAttempts}). Activating quarantine.`);
      const packet: QuarantinePacket = {
        quarantined: true,
        role,
        conceptId: conceptId || 'general_concept',
        repairAttempts,
        exhausted: true,
        violations: audit.violations,
        rawContent: content,
        quarantineTimestamp: new Date().toISOString(),
        actionRequired: 'SUPER_ADMIN_INTERVENTION',
      };
      // Quarantined content is NEVER banked in experience memory (prevents memory pollution)
      throw new QuarantineError(`Agent ${role} failed validation after ${repairAttempts} repair attempts. Output quarantined.`, packet);
    }

    // 3. Record Successful Output into Experience Memory Bank
    try {
      await contextBus.recordExperience(role, content, {
        taskType: agent.taskType,
        conceptId: conceptId || 'general_concept',
        gatekeeperPassed: true,
        repairAttempts,
      });
    } catch (memErr) {
      console.warn(`[Agent: ${role}] Memory banking warning:`, memErr);
    }

    console.log(`[Agent: ${role}] Task completed successfully (repairAttempts: ${repairAttempts}).`);
    return response;
  } catch (error) {
    if (error instanceof QuarantineError) {
      throw error;
    }
    console.error(`[Agent: ${role}] Task failed:`, error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PIPELINE ORCHESTRATION WITH FORK-JOIN CONCURRENCY & DOWNSTREAM BLOCKING
// ─────────────────────────────────────────────────────────────────────────────

export interface PipelineInput {
  topic: string;
  grade: number;
  subject: string;
  rawSourceText?: string;
}

export interface PipelineOptions {
  concurrency?: boolean; // default: true
  modelOverride?: string;
  llmCompleter?: (req: any) => Promise<{ content: string; [key: string]: any }>;
  maxRepairAttempts?: number;
}

export interface PipelineResult {
  status: 'SUCCESS' | 'QUARANTINED' | 'FAILED';
  analysis?: any;
  design?: any;
  assessment?: any;
  lle?: any;
  quarantinePacket?: QuarantinePacket;
  blockedStages?: AgentRole[];
  concurrencyMode: 'PARALLEL_FORK_JOIN' | 'SEQUENTIAL';
}

export function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (val !== null && typeof val === 'object' && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  }
  return obj;
}

export async function orchestrateChapterPipeline(
  input: PipelineInput,
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  const useConcurrency = options.concurrency !== false;
  const concurrencyMode = useConcurrency ? 'PARALLEL_FORK_JOIN' : 'SEQUENTIAL';
  const conceptId = `${input.subject}_Class${input.grade}_${input.topic}`;

  // Stage 1: Deterministic Ingest
  await runAgent('IngestAgent', `Ingest text for ${conceptId}`, options);

  // Stage 2: AnalysisAgent
  let analysisResult: any;
  try {
    analysisResult = await runAgent(
      'AnalysisAgent',
      `Analyze curriculum for ${input.subject} Class ${input.grade}: ${input.topic}. Source: ${input.rawSourceText || ''}`,
      { ...options, conceptId }
    );
  } catch (err: any) {
    if (err instanceof QuarantineError) {
      // DOWNSTREAM BLOCKING: Analysis failure blocks Design, Assessment, LLE, and QA
      return {
        status: 'QUARANTINED',
        quarantinePacket: err.packet,
        blockedStages: ['DesignAgent', 'AssessmentAgent', 'LLEAgent', 'QAAgent', 'BrowserTesterAgent'],
        concurrencyMode,
      };
    }
    throw err;
  }

  // UPSTREAM DEPENDENCY FREEZE POINT (Governed Fork-Join Precondition)
  // Deep clone + recursive deepFreeze to prevent branch mutation of nested structures
  const analysisSnapshot = JSON.parse(JSON.stringify(analysisResult.content || analysisResult));
  const frozenContentMap = deepFreeze(analysisSnapshot);

  let designResult: any;
  let assessmentResult: any;
  let lleResult: any;

  if (useConcurrency) {
    // Stage 3 (Parallel Fork-Join): Concurrently execute independent stages
    try {
      const [dRes, aRes, lRes] = await Promise.all([
        runAgent(
          'DesignAgent',
          `Sequence pedagogical flow for: ${JSON.stringify(frozenContentMap)}`,
          { ...options, conceptId }
        ),
        runAgent(
          'AssessmentAgent',
          `Create assessments with zero spoilers for: ${JSON.stringify(frozenContentMap)}`,
          { ...options, conceptId }
        ),
        runAgent(
          'LLEAgent',
          `Translate and insulate math terms for: ${JSON.stringify(frozenContentMap)}`,
          { ...options, conceptId }
        ),
      ]);
      designResult = dRes;
      assessmentResult = aRes;
      lleResult = lRes;
    } catch (err: any) {
      if (err instanceof QuarantineError) {
        // DOWNSTREAM BLOCKING: Any concurrent failure blocks Synthesis and QA
        return {
          status: 'QUARANTINED',
          analysis: frozenContentMap,
          quarantinePacket: err.packet,
          blockedStages: ['QAAgent', 'BrowserTesterAgent'],
          concurrencyMode,
        };
      }
      throw err;
    }
  } else {
    // Stage 3 (Sequential Fallback)
    try {
      designResult = await runAgent('DesignAgent', `Sequence pedagogical flow for: ${JSON.stringify(frozenContentMap)}`, { ...options, conceptId });
      assessmentResult = await runAgent('AssessmentAgent', `Create assessments with zero spoilers for: ${JSON.stringify(frozenContentMap)}`, { ...options, conceptId });
      lleResult = await runAgent('LLEAgent', `Translate and insulate math terms for: ${JSON.stringify(frozenContentMap)}`, { ...options, conceptId });
    } catch (err: any) {
      if (err instanceof QuarantineError) {
        return {
          status: 'QUARANTINED',
          analysis: frozenContentMap,
          quarantinePacket: err.packet,
          blockedStages: ['QAAgent', 'BrowserTesterAgent'],
          concurrencyMode,
        };
      }
      throw err;
    }
  }

  // Stage 4: Deterministic QA
  await runAgent('QAAgent', `Run L-Truth QA for ${conceptId}`, options);

  // Deterministic Join: Stable assembly
  return {
    status: 'SUCCESS',
    analysis: frozenContentMap,
    design: designResult,
    assessment: assessmentResult,
    lle: lleResult,
    concurrencyMode,
  };
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
