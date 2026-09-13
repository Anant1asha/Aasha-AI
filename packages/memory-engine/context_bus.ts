import { Memo0DualProvider } from './memo0_dual_provider';
import { SQLiteGraphProvider } from './sqlite_graph_provider';
import { AASHAGatekeeper, GatekeeperResult } from '../aasha-rules/aasha_gatekeeper';
import { AgentRole, MemoryItem } from './memory_interface';

export interface EnrichedAgentContext {
  agentRole: AgentRole;
  applicableRules: any[];
  prerequisites: any[];
  misconceptions: any[];
  experienceFewShots: MemoryItem[];
  systemContextInjection: string;
}

export class ContextBus {
  private memoryProvider: Memo0DualProvider;
  private graphProvider: SQLiteGraphProvider;

  constructor() {
    this.memoryProvider = new Memo0DualProvider();
    this.graphProvider = new SQLiteGraphProvider();
  }

  getMemory(): Memo0DualProvider {
    return this.memoryProvider;
  }

  getGraph(): SQLiteGraphProvider {
    return this.graphProvider;
  }

  /**
   * Enriches an agent turn with relevant curriculum graph nodes, AASHA rules, and experience few-shots.
   */
  async buildAgentContext(agentRole: AgentRole, conceptId: string, topicQuery: string): Promise<EnrichedAgentContext> {
    const [rules, prereqs, misconceptions, experiences] = await Promise.all([
      this.graphProvider.getRulesForAgent(agentRole),
      this.graphProvider.getPrerequisites(conceptId),
      this.graphProvider.getMisconceptions(conceptId),
      this.memoryProvider.searchMemory(topicQuery, { agentRole, limit: 3 }),
    ]);

    const contextParts: string[] = [];
    contextParts.push(`\n--- [AASHA CONTEXT BUS ENRICHMENT for ${agentRole}] ---`);

    if (prereqs.length > 0) {
      contextParts.push(`Prerequisites for '${conceptId}':`);
      for (const p of prereqs) {
        contextParts.push(`- [${p.id}] ${p.label}: ${JSON.stringify(p.properties)}`);
      }
    }

    if (misconceptions.length > 0) {
      contextParts.push(`Known Student Misconceptions:`);
      for (const m of misconceptions) {
        contextParts.push(`- [Misconception] ${m.properties.misconception || m.id}`);
      }
    }

    if (experiences.length > 0) {
      contextParts.push(`Prior Successful Experience / Few-Shot Patterns:`);
      for (const exp of experiences) {
        contextParts.push(`- [Pattern]: ${exp.content}`);
      }
    }

    contextParts.push(`----------------------------------------------------\n`);

    return {
      agentRole,
      applicableRules: rules,
      prerequisites: prereqs,
      misconceptions,
      experienceFewShots: experiences,
      systemContextInjection: contextParts.join('\n'),
    };
  }

  /**
   * Validates agent output against AASHA 24 Rules.
   */
  validateOutput(content: string, agentRole: AgentRole): GatekeeperResult {
    return AASHAGatekeeper.auditDeterministic(content, agentRole);
  }

  /**
   * Curates a validated successful generation into the Experience Memory Bank.
   */
  async recordExperience(agentRole: AgentRole, content: string, metadata: Record<string, any>): Promise<MemoryItem> {
    return this.memoryProvider.addMemory({
      agentRole,
      category: 'experience',
      content,
      metadata,
    });
  }
}