import { spawnSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { IGraphProvider, GraphNode, GraphEdge, AgentRole } from './memory_interface';

export class SQLiteGraphProvider implements IGraphProvider {
  private pythonPath: string;
  private bridgeScript: string;
  private storageDir: string;

  constructor() {
    const venvPython = path.resolve(__dirname, '../../aasha-pipeline-with-master-json/venv/Scripts/python.exe');
    this.pythonPath = fs.existsSync(venvPython) ? venvPython : 'python';
    this.bridgeScript = path.resolve(__dirname, 'graph_bridge.py');
    this.storageDir = path.resolve(__dirname, 'storage');

    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  private runBridge(args: string[]): any {
    // Fast path: bypass external Python child-process spawning during tests or offline mode
    if (process.env.MEMO0_OFFLINE === '1' || process.env.NODE_ENV === 'test' || process.env.AASHA_TEST_MODE === '1') {
      return null;
    }

    const res = spawnSync(this.pythonPath, [this.bridgeScript, ...args], {
      encoding: 'utf-8',
      env: process.env,
    });

    if (res.error) {
      console.warn(`[SQLiteGraphProvider] Python spawn error: ${res.error.message}`);
      return null;
    }

    try {
      return JSON.parse(res.stdout);
    } catch {
      if (res.stderr) {
        console.warn(`[SQLiteGraphProvider] stderr: ${res.stderr}`);
      }
      return null;
    }
  }

  async addNode(node: GraphNode): Promise<void> {
    const b64Props = Buffer.from(JSON.stringify(node.properties || {})).toString('base64');
    this.runBridge([
      'add-node',
      '--id', node.id,
      '--label', node.label,
      '--properties', b64Props,
    ]);
  }

  async addEdge(edge: GraphEdge): Promise<void> {
    const b64Props = Buffer.from(JSON.stringify(edge.properties || {})).toString('base64');
    this.runBridge([
      'add-edge',
      '--source', edge.source,
      '--target', edge.target,
      '--relation', edge.relation,
      '--properties', b64Props,
    ]);
  }

  async getNode(id: string): Promise<GraphNode | null> {
    const all = await this.exportGraph();
    return all.nodes.find(n => n.id === id) || null;
  }

  async getPrerequisites(conceptId: string): Promise<GraphNode[]> {
    const res = this.runBridge(['prerequisites', '--concept-id', conceptId]);
    return res?.prerequisites || [];
  }

  async getMisconceptions(conceptId: string): Promise<GraphNode[]> {
    const res = this.runBridge(['misconceptions', '--concept-id', conceptId]);
    return res?.misconceptions || [];
  }

  async getRulesForAgent(agentRole: AgentRole): Promise<GraphNode[]> {
    const res = this.runBridge(['rules-for-agent', '--agent-role', agentRole]);
    return res?.rules || [];
  }

  async exportGraph(): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    const res = this.runBridge(['export']);
    return {
      nodes: res?.nodes || [],
      edges: res?.edges || [],
    };
  }
}