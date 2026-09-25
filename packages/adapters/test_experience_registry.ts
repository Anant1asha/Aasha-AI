import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { RegistryIngestionEngine } from './registry_ingestion_engine';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aasha-registry-test-'));
fs.mkdirSync(path.join(root, 'experience_registry'), { recursive: true });
fs.writeFileSync(path.join(root, 'experience_registry', 'registry.json'), JSON.stringify({
  version: '2.0.0',
  foundations: [{ id: 'F99', name: 'Foundation', subjects: ['Mathematics'], classes: [8], mechanics: ['partition'], license: 'MIT' }],
  experiences: [],
  registry_policy: { resolver_order: ['TIER_1_REGISTERED','TIER_2_APPROVED_FOUNDATION','TIER_3_DOMAIN_SYNTHESIS'] }
}));

const engine = new RegistryIngestionEngine(root);
const code = 'export class DemoSim { mount(){} getState(){return{};} reset(){} destroy(){} }';
const candidate = engine.stageCandidate({
  metadata: {
    component_id: 'exp.demo_sim',
    version: '1.0.0',
    capability_contract: { capability_id: 'cap:demo', version: '1.0.0', mechanics: ['partition'], inputs: ['whole'], outputs: ['selection'] },
    mechanic_tags: ['partition'],
    subjects: ['Mathematics'],
    classes: [8],
    dependencies: [],
    runtime: { offline_compatible: true, external_urls: [] },
    provenance: [{ source_type: 'AASHA_NATIVE', reference: 'test' }],
    license: { classification: 'PERMISSIVE', isolation_mode: 'NATIVE' },
    verification: { component_gates: {}, evidence_refs: [] },
    lineage: {}
  },
  componentCode: code
});

assert.equal(candidate.status, 'CANDIDATE');
assert.match(candidate.artifact_hash, /^sha256:[a-f0-9]{64}$/);
assert.equal(engine.resolve({ mechanics: ['partition'], subject: 'Mathematics', classNum: 8 }).length, 0);

candidate.verification.component_gates = {
  functional:'PASS', capability_contract:'PASS', browser_runtime:'PASS', offline:'PASS',
  provenance:'PASS', license:'PASS', accessibility:'PASS', performance:'PASS',
  security_child_safety:'PASS', maintainability:'PASS', aasha_integration:'PASS'
};
const promoted = engine.promoteCandidate(candidate);
assert.equal(promoted.promoted, true);
assert.equal(engine.resolve({ mechanics: ['partition'], subject: 'Mathematics', classNum: 8 })[0].component_id, 'exp.demo_sim');

const derived = engine.stageDerivedFromHtml({\n  component_id: 'exp.derived_sim', version: '1.0.0',\n  capability_contract: { capability_id: 'cap:derived', version: '1.0.0', mechanics: ['partition'], inputs: ['whole'], outputs: ['selection'] },\n  mechanic_tags: ['partition'], subjects: ['Mathematics'], classes: [8], dependencies: [],\n  runtime: { offline_compatible: true, external_urls: [] },\n  license: { classification: 'LICENSE_REVIEW_REQUIRED', isolation_mode: 'BLOCKED' },\n  verification: { component_gates: {}, evidence_refs: [] }, lineage: {}\n}, '<script>customElements.define(\\\'aasha-sim\\\', class {});</script>');\nassert.equal(derived.status, 'CANDIDATE');\n\nconst blocked = { ...candidate, component_id: 'exp.blocked', license: { classification:'UNKNOWN', isolation_mode:'NATIVE' as const } };
assert.equal(engine.promoteCandidate(blocked).promoted, false);

console.log('PASS: candidate staging, certification gate, promotion, and tier-1 resolution');
