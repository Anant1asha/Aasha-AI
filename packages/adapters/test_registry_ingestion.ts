import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import assert from 'node:assert/strict';
import { RegistryIngestionEngine } from './registry_ingestion_engine';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aasha-registry-'));
fs.mkdirSync(path.join(tmp, 'experience_registry'), { recursive: true });
fs.writeFileSync(path.join(tmp, 'experience_registry', 'registry.json'), JSON.stringify({
  version: '1.0.0',
  foundations: [],
  experiences: []
}, null, 2));

const engine = new RegistryIngestionEngine(tmp);
const code = 'export class DemoSim { mount(){} getState(){ return {}; } reset(){} destroy(){} }';
const candidate = engine.stageCandidate({
  metadata: {
    component_id: 'exp.demo_sim',
    version: '1.0.0',
    capability_contract: {
      capability_id: 'cap.demo_sim',
      version: '1.0.0',
      mechanics: ['partition'],
      inputs: ['whole'],
      outputs: ['selection']
    },
    mechanic_tags: ['partition'],
    dependencies: [],
    runtime: { offline_compatible: true, external_urls: [] },
    provenance: [{ source_type: 'AASHA_NATIVE', reference: 'test' }],
    license: { classification: 'PERMISSIVE', isolation_mode: 'NATIVE' },
    verification: {
      component_gates: {
        functional: 'PASS',
        capability_contract: 'PASS',
        browser_runtime: 'PASS',
        offline: 'PASS',
        provenance: 'PASS',
        license: 'PASS',
        accessibility: 'PASS',
        performance: 'PASS',
        security_child_safety: 'PASS',
        maintainability: 'PASS',
        aasha_integration: 'PASS'
      },
      evidence_refs: ['test']
    },
    lineage: {}
  },
  componentCode: code
});
assert.equal(candidate.status, 'CANDIDATE');
assert.match(candidate.artifact_hash, /^sha256:[a-f0-9]{64}$/);
const result = engine.promoteCandidate(candidate);
assert.equal(result.promoted, true);
assert.equal(engine.resolve({ mechanics: ['partition'] })[0].component_id, 'exp.demo_sim');
console.log('PASS registry ingestion/reuse test');
