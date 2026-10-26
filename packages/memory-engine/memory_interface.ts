/**
 * AASHA Memory Engine - Core Interfaces
 * Unified memory abstractions for multi-agent coordination, few-shot recall,
 * experience memory banking, and ontological curriculum graphs.
 */

export type AgentRole =
  | 'IngestAgent'
  | 'AnalysisAgent'
  | 'DesignAgent'
  | 'AssessmentAgent'
  | 'LLEAgent'
  | 'QAAgent'
  | 'BrowserTesterAgent'
  | 'SuperAdmin';

export type MemoryCategory =
  | 'few_shot'
  | 'misconception'
  | 'experience'
  | 'approved_build_lesson'
  | 'rule_violation'
  | 'pedagogical_template'
  | 'glossary';

export interface TaskCapabilityProfile {
  task_type: string;
  goal: string;
  /** Domain-neutral capability tags; subject and grade are optional applicability hints. */
  capability_tags: string[];
  constraints?: string[];
  subject?: string;
  grade?: string;
}

export interface ApprovedBuildLesson {
  schema_version: '1.0';
  lesson_id: string;
  task_profile: TaskCapabilityProfile;
  artifact: { artifact_id: string; sha256: string; version: string | number };
  lesson: { reusable_pattern: string; adaptation_notes: string[]; known_limits: string[] };
  source_provenance: Array<{ source_id: string; sha256: string }>;
  test_evidence: Array<{
    test_id: string;
    status: 'PASS';
    command: string;
    sha256: string;
    run_at: string;
  }>;
  /** Approval of the actual built artifact, as recorded by the governed release path. */
  build_approval: import('../aios/trust_authority').SignedApproval;
  /** Separate approval binds this complete lesson manifest and its evidence to its digest. */
  reviewer_decision: import('../aios/trust_authority').SignedApproval;
}

export interface ApprovedBuildLessonMatch {
  strategy: 'REUSE' | 'ADAPT';
  lesson: MemoryItem;
  matched_capabilities: string[];
  score: number;
}

export interface ApprovedBuildLessonSelection {
  /** No lesson match is not a BUILD_NEW resource decision; the registry resolver owns that decision. */
  strategy: 'REUSE' | 'ADAPT' | 'NO_APPROVED_LESSON';
  evidence_status: 'VERIFIED_MATCH' | 'NO_VERIFIED_MATCH' | 'UNKNOWN_EVIDENCE';
  lessons: ApprovedBuildLessonMatch[];
}

export interface MemoryItem {
  id: string;
  agentRole: AgentRole;
  category: MemoryCategory;
  content: string;
  metadata?: Record<string, any>;
  score?: number;
  timestamp: string;
}

export interface MemorySearchOptions {
  agentRole?: AgentRole;
  category?: MemoryCategory;
  limit?: number;
  minScore?: number;
}

export interface MemorySnapshot {
  exportedAt: string;
  totalMemories: number;
  memories: MemoryItem[];
  checksum: string;
}

export interface IMemoryProvider {
  addMemory(item: Omit<MemoryItem, 'id' | 'timestamp'>): Promise<MemoryItem>;
  searchMemory(query: string, options?: MemorySearchOptions): Promise<MemoryItem[]>;
  getMemoriesByRole(agentRole: AgentRole, category?: MemoryCategory): Promise<MemoryItem[]>;
  deleteMemory(id: string): Promise<boolean>;
  exportSnapshot(): Promise<MemorySnapshot>;
  importSnapshot(snapshot: MemorySnapshot): Promise<number>;
  healthCheck(): Promise<{ cloudHealthy: boolean; localHealthy: boolean; activeProvider: string }>;
}

export interface GraphNode {
  id: string;
  label: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation:
    | 'REQUIRES_PREREQUISITE'
    | 'TEACHES_WHY'
    | 'EXPOSES_MISCONCEPTION'
    | 'FORMAL_NAME_FOR'
    | 'ENFORCES_RULE'
    | 'PROVIDES_VISUAL';
  properties?: Record<string, any>;
}

export interface IGraphProvider {
  addNode(node: GraphNode): Promise<void>;
  addEdge(edge: GraphEdge): Promise<void>;
  getNode(id: string): Promise<GraphNode | null>;
  getPrerequisites(conceptId: string): Promise<GraphNode[]>;
  getMisconceptions(conceptId: string): Promise<GraphNode[]>;
  getRulesForAgent(agentRole: AgentRole): Promise<GraphNode[]>;
  exportGraph(): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }>;
}
