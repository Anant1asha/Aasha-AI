import { spawnSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { IMemoryProvider, MemoryItem, MemorySearchOptions, MemorySnapshot, AgentRole, MemoryCategory } from './memory_interface';

export class Memo0DualProvider implements IMemoryProvider {
  private pythonPath: string;
  private bridgeScript: string;
  private storageDir: string;
  private localDbFile: string;

  constructor() {
    // Locate virtualenv python or system python
    const venvPython = path.resolve(__dirname, '../../aasha-pipeline-with-master-json/venv/Scripts/python.exe');
    this.pythonPath = fs.existsSync(venvPython) ? venvPython : 'python';
    this.bridgeScript = path.resolve(__dirname, 'memo0_bridge.py');
    this.storageDir = path.resolve(__dirname, 'storage');
    this.localDbFile = path.resolve(this.storageDir, 'aasha_local_memory.json');

    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  private runBridge(args: string[]): any {
    const res = spawnSync(this.pythonPath, [this.bridgeScript, ...args], {
      encoding: 'utf-8',
      env: process.env,
    });

    if (res.error) {
      console.warn(`[Memo0DualProvider] Python spawn error: ${res.error.message}`);
      return null;
    }

    try {
      return JSON.parse(res.stdout);
    } catch {
      if (res.stderr) {
        console.warn(`[Memo0DualProvider] Python bridge stderr: ${res.stderr}`);
      }
      return null;
    }
  }

  async addMemory(item: Omit<MemoryItem, 'id' | 'timestamp'>): Promise<MemoryItem> {
    // Fast path: bypass external Python spawn and network call during tests or offline mode
    if (process.env.MEMO0_OFFLINE === '1' || process.env.NODE_ENV === 'test' || process.env.AASHA_TEST_MODE === '1') {
      const memId = `${item.agentRole}_${item.category}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const timestamp = new Date().toISOString();
      const record: MemoryItem = {
        id: memId,
        ...item,
        timestamp,
      };

      const localData = this.readLocalDb();
      localData.memories.push(record);
      this.writeLocalDb(localData);

      return record;
    }

    const args = [
      'add',
      '--role', item.agentRole,
      '--category', item.category,
      '--content', item.content,
    ];

    if (item.metadata) {
      args.push('--metadata', JSON.stringify(item.metadata));
    }

    const bridgeResult = this.runBridge(args);
    if (bridgeResult && bridgeResult.record) {
      return bridgeResult.record as MemoryItem;
    }

    // Direct local fallback if python bridge failed
    const memId = `${item.agentRole}_${item.category}_${Date.now()}`;
    const timestamp = new Date().toISOString();
    const record: MemoryItem = {
      id: memId,
      ...item,
      timestamp,
    };

    const localData = this.readLocalDb();
    localData.memories.push(record);
    this.writeLocalDb(localData);

    return record;
  }

  async searchMemory(query: string, options?: MemorySearchOptions): Promise<MemoryItem[]> {
    // Fast path: bypass external Python spawn and network call during tests or offline mode
    if (process.env.MEMO0_OFFLINE === '1' || process.env.NODE_ENV === 'test' || process.env.AASHA_TEST_MODE === '1') {
      const localData = this.readLocalDb();
      let candidates = localData.memories;
      if (options?.agentRole) {
        candidates = candidates.filter(m => m.agentRole === options.agentRole);
      }
      if (options?.category) {
        candidates = candidates.filter(m => m.category === options.category);
      }

      const qWords = query.toLowerCase().split(/\s+/).filter(Boolean);
      return candidates
        .filter(m => {
          const text = `${m.content} ${JSON.stringify(m.metadata || {})}`.toLowerCase();
          return qWords.some(w => text.includes(w));
        })
        .slice(0, options?.limit || 5);
    }

    const args = ['search', '--query', query];
    if (options?.agentRole) {
      args.push('--role', options.agentRole);
    }
    if (options?.limit) {
      args.push('--limit', options.limit.toString());
    }

    const bridgeResult = this.runBridge(args);
    if (bridgeResult) {
      if (bridgeResult.cloud_results && bridgeResult.cloud_results.length > 0) {
        return bridgeResult.cloud_results.map((r: any) => ({
          id: r.id || `cloud_${Date.now()}`,
          agentRole: options?.agentRole || 'SuperAdmin',
          category: options?.category || 'experience',
          content: r.memory || r.content || JSON.stringify(r),
          score: r.score || 1.0,
          timestamp: new Date().toISOString(),
        }));
      }
      if (bridgeResult.local_results) {
        return bridgeResult.local_results;
      }
    }

    // Local in-memory fuzzy search fallback
    const localData = this.readLocalDb();
    let candidates = localData.memories;
    if (options?.agentRole) {
      candidates = candidates.filter(m => m.agentRole === options.agentRole);
    }
    if (options?.category) {
      candidates = candidates.filter(m => m.category === options.category);
    }

    const qWords = query.toLowerCase().split(/\s+/);
    return candidates
      .filter(m => {
        const text = `${m.content} ${JSON.stringify(m.metadata || {})}`.toLowerCase();
        return qWords.some(w => text.includes(w));
      })
      .slice(0, options?.limit || 5);
  }

  async getMemoriesByRole(agentRole: AgentRole, category?: MemoryCategory): Promise<MemoryItem[]> {
    const localData = this.readLocalDb();
    return localData.memories.filter(m => {
      if (m.agentRole !== agentRole) return false;
      if (category && m.category !== category) return false;
      return true;
    });
  }

  async deleteMemory(id: string): Promise<boolean> {
    const localData = this.readLocalDb();
    const initialLen = localData.memories.length;
    localData.memories = localData.memories.filter(m => m.id !== id);
    if (localData.memories.length !== initialLen) {
      this.writeLocalDb(localData);
      return true;
    }
    return false;
  }

  async exportSnapshot(): Promise<MemorySnapshot> {
    const bridgeResult = this.runBridge(['export']);
    if (bridgeResult && bridgeResult.status === 'success') {
      const snapData = fs.readFileSync(bridgeResult.exported_to, 'utf-8');
      return JSON.parse(snapData) as MemorySnapshot;
    }

    const localData = this.readLocalDb();
    return {
      exportedAt: new Date().toISOString(),
      totalMemories: localData.memories.length,
      memories: localData.memories,
      checksum: 'local_fallback',
    };
  }

  async importSnapshot(snapshot: MemorySnapshot): Promise<number> {
    const localData = this.readLocalDb();
    const existingIds = new Set(localData.memories.map(m => m.id));
    let imported = 0;

    for (const mem of snapshot.memories) {
      if (!existingIds.has(mem.id)) {
        localData.memories.push(mem);
        imported++;
      }
    }

    this.writeLocalDb(localData);
    return imported;
  }

  async healthCheck(): Promise<{ cloudHealthy: boolean; localHealthy: boolean; activeProvider: string }> {
    const bridgeResult = this.runBridge(['health']);
    const cloudHealthy = !!bridgeResult?.cloud_available;
    const localHealthy = fs.existsSync(this.storageDir);

    return {
      cloudHealthy,
      localHealthy,
      activeProvider: cloudHealthy ? 'Memo0 Cloud + Local Dual-Write' : 'Local Embedded Memory',
    };
  }

  private readLocalDb(): { memories: MemoryItem[] } {
    if (!fs.existsSync(this.localDbFile)) {
      return { memories: [] };
    }
    try {
      return JSON.parse(fs.readFileSync(this.localDbFile, 'utf-8'));
    } catch {
      return { memories: [] };
    }
  }

  private writeLocalDb(data: { memories: MemoryItem[] }): void {
    fs.writeFileSync(this.localDbFile, JSON.stringify(data, null, 2), 'utf-8');
  }
}