/**
 * AASHA Universal Teaching Language System - Core Rules & Ontological Contracts
 * Direct programmatic implementation of Sections 1 through 24.
 */

export interface AASHARuleDefinition {
  sectionNumber: number;
  title: string;
  enforcementMode: 'deterministic_regex' | 'epistemic_audit' | 'schema_validation' | 'prompt_mandate';
  summary: string;
  governingAgents: string[];
}

export const AASHA_RULES: Record<number, AASHARuleDefinition> = {
  1: {
    sectionNumber: 1,
    title: 'Core Mission',
    enforcementMode: 'epistemic_audit',
    summary: 'Never optimize merely for shorter text, simpler vocab, emojis, or gamification. Optimize for conceptual clarity, reason, student connection, correct academic language, efficient interaction.',
    governingAgents: ['AnalysisAgent', 'DesignAgent', 'AssessmentAgent', 'LLEAgent'],
  },
  2: {
    sectionNumber: 2,
    title: 'The Golden Teaching Rule',
    enforcementMode: 'schema_validation',
    summary: 'WHAT -> WHY -> HOW -> SHOW -> TRY -> FEEDBACK -> CONNECT -> NAME. Use only the stages that improve learning.',
    governingAgents: ['DesignAgent', 'AnalysisAgent'],
  },
  3: {
    sectionNumber: 3,
    title: 'Definition-First Is NOT the Default',
    enforcementMode: 'epistemic_audit',
    summary: 'Start with curiosity/problem -> mechanism -> formal academic name and definition.',
    governingAgents: ['DesignAgent', 'AssessmentAgent'],
  },
  4: {
    sectionNumber: 4,
    title: 'Preserve the Academic Layer',
    enforcementMode: 'deterministic_regex',
    summary: 'Layer A (Student Understanding) + Layer B (Academic Precision). Simplify explanation, never simplify away concept.',
    governingAgents: ['AnalysisAgent', 'DesignAgent', 'AssessmentAgent', 'LLEAgent'],
  },
  5: {
    sectionNumber: 5,
    title: 'Explain the Reason Behind Operations',
    enforcementMode: 'epistemic_audit',
    summary: 'Protect against procedural misconceptions by explaining why an operation works (e.g. dividing both numerator & denominator).',
    governingAgents: ['DesignAgent', 'AssessmentAgent'],
  },
  6: {
    sectionNumber: 6,
    title: 'Use the Right Teaching Mode for Each Subject',
    enforcementMode: 'prompt_mandate',
    summary: 'Math (Notice->Represent->Reason), Science (Observe->Wonder->Predict), Social (Context->Evidence->Perspective), English (Encounter->Notice->Infer), Civics (Situation->Choice->Consequence).',
    governingAgents: ['AnalysisAgent', 'DesignAgent'],
  },
  7: {
    sectionNumber: 7,
    title: 'Student Connection Rule',
    enforcementMode: 'epistemic_audit',
    summary: 'Connect to familiar observations, questions, or actions. Never manufacture fake real-world hype.',
    governingAgents: ['DesignAgent', 'AnalysisAgent'],
  },
  8: {
    sectionNumber: 8,
    title: '"Why?" Must Be Genuine',
    enforcementMode: 'epistemic_audit',
    summary: 'Distinguish between Procedural, Conceptual, Causal, Purpose, Evidence, and Comparative Why.',
    governingAgents: ['AnalysisAgent', 'DesignAgent', 'AssessmentAgent'],
  },
  9: {
    sectionNumber: 9,
    title: 'Visual Teaching Rule',
    enforcementMode: 'schema_validation',
    summary: 'Prefer Visual -> Explanation over Paragraph -> Visual decoration.',
    governingAgents: ['DesignAgent'],
  },
  10: {
    sectionNumber: 10,
    title: 'Interaction Must Have a Learning Purpose',
    enforcementMode: 'schema_validation',
    summary: 'Every interaction must expose a misconception, teach a reasoning skill, or demonstrate a concept. No empty gamification.',
    governingAgents: ['DesignAgent', 'BrowserTesterAgent'],
  },
  11: {
    sectionNumber: 11,
    title: 'Feedback Language',
    enforcementMode: 'deterministic_regex',
    summary: 'Never use purely evaluative feedback (❌ Incorrect). Acknowledge what was correct -> identify misconception -> smallest hint -> retry.',
    governingAgents: ['AssessmentAgent'],
  },
  12: {
    sectionNumber: 12,
    title: 'Never Give Away the Answer Too Early',
    enforcementMode: 'deterministic_regex',
    summary: 'Progressive assistance: Hint 1 (Attention) -> Hint 2 (Relationship) -> Hint 3 (Strategy) -> Hint 4 (Procedure) -> Full explanation.',
    governingAgents: ['AssessmentAgent'],
  },
  13: {
    sectionNumber: 13,
    title: 'Student-Friendly Without Becoming Childish',
    enforcementMode: 'deterministic_regex',
    summary: 'Tone: warm + intelligent + encouraging + respectful. Avoid hyper-childish hype (e.g. "super-duper adventure 🚀").',
    governingAgents: ['DesignAgent', 'AssessmentAgent', 'LLEAgent'],
  },
  14: {
    sectionNumber: 14,
    title: 'Progressive Disclosure',
    enforcementMode: 'schema_validation',
    summary: 'Levels 1 to 5: Immediate understanding -> Reason -> Formal terminology -> Deeper explanation -> Extension.',
    governingAgents: ['DesignAgent'],
  },
  15: {
    sectionNumber: 15,
    title: 'Formal Notation Rules (Non-Negotiable)',
    enforcementMode: 'deterministic_regex',
    summary: 'Never damage LaTeX math or scientific formulas. Preserve superscripts, subscripts, fractions, roots, units, chemical equations.',
    governingAgents: ['AnalysisAgent', 'DesignAgent', 'AssessmentAgent', 'LLEAgent', 'QAAgent'],
  },
  16: {
    sectionNumber: 16,
    title: 'Transformation Safety Matrix',
    enforcementMode: 'deterministic_regex',
    summary: 'Classify changes as SAFE, CONTROLLED, or PROHIBITED.',
    governingAgents: ['AnalysisAgent', 'DesignAgent', 'AssessmentAgent', 'LLEAgent', 'QAAgent'],
  },
  17: {
    sectionNumber: 17,
    title: 'Misconception-First Design',
    enforcementMode: 'schema_validation',
    summary: 'Ask: What is the most likely wrong mental model? Design interaction to expose and resolve it.',
    governingAgents: ['AnalysisAgent', 'AssessmentAgent'],
  },
  18: {
    sectionNumber: 18,
    title: 'Causality Over Labels',
    enforcementMode: 'epistemic_audit',
    summary: 'Prefer mechanism and cause over isolated labels.',
    governingAgents: ['DesignAgent', 'AssessmentAgent'],
  },
  19: {
    sectionNumber: 19,
    title: 'Compare When Confusion Is Likely',
    enforcementMode: 'epistemic_audit',
    summary: 'Explicitly contrast commonly confused concepts.',
    governingAgents: ['DesignAgent', 'AssessmentAgent'],
  },
  20: {
    sectionNumber: 20,
    title: 'Real-World Connection Must Return to Curriculum',
    enforcementMode: 'epistemic_audit',
    summary: 'Return genuine observations directly to the curriculum concept.',
    governingAgents: ['DesignAgent'],
  },
  21: {
    sectionNumber: 21,
    title: 'Universal Content Transformation Pipeline',
    enforcementMode: 'schema_validation',
    summary: '17-stage transformation pipeline from source intent to verified learning experience.',
    governingAgents: ['AnalysisAgent', 'DesignAgent', 'AssessmentAgent', 'LLEAgent', 'QAAgent'],
  },
  22: {
    sectionNumber: 22,
    title: 'Master Agent Instruction',
    enforcementMode: 'prompt_mandate',
    summary: 'Epistemic truth-seeking persona across all prompts.',
    governingAgents: ['AnalysisAgent', 'DesignAgent', 'AssessmentAgent', 'LLEAgent'],
  },
  23: {
    sectionNumber: 23,
    title: 'Teaching Layer Separation in HTML Activities',
    enforcementMode: 'schema_validation',
    summary: 'Separate Curriculum Facts from Experience UI.',
    governingAgents: ['DesignAgent', 'BrowserTesterAgent'],
  },
  24: {
    sectionNumber: 24,
    title: 'Reusable Content Contract (YAML Schema)',
    enforcementMode: 'schema_validation',
    summary: 'Mandatory Reusable Content Contract mapping intent, misconceptions, worked examples, interactions, and feedback.',
    governingAgents: ['AnalysisAgent', 'DesignAgent', 'AssessmentAgent', 'QAAgent'],
  },
};

export const PROHIBITED_PATTERNS = [
  { pattern: /water disappearing/i, reason: 'Dilutes scientific concept of evaporation' },
  { pattern: /super-duper/i, reason: 'Childish language violating Section 13' },
  { pattern: /fun adventure 🚀/i, reason: 'Manufactured superficial hype violating Section 7 & 13' },
  { pattern: /❌\s*incorrect/i, reason: 'Purely evaluative negative feedback violating Section 11' },
];

export const SUBJECT_MODE_PATTERNS: Record<string, string> = {
  mathematics: 'Notice -> Represent -> Reason -> Calculate -> Verify -> Generalize',
  science: 'Observe -> Wonder -> Predict -> Experiment/Model -> Explain -> Apply',
  social_science: 'Context -> Question -> Evidence -> Cause/Effect -> Perspective -> Consequence -> Connection',
  english: 'Encounter -> Notice -> Infer -> Explain -> Practice -> Create -> Refine',
  civics: 'Real situation -> Choice -> Consequence -> Principle -> Application',
};