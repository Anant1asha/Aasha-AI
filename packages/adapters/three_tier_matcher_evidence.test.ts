import * as fs from 'node:fs';
import * as crypto from 'node:crypto';
import * as os from 'node:os';
import * as path from 'node:path';
import { ThreeTierMatcher } from './three_tier_matcher.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aasha-matcher-'));
try {
  const registryDir = path.join(root, 'experience_registry');
  fs.mkdirSync(registryDir, { recursive: true });
  const registryPath = path.join(registryDir, 'registry.json');
  const foundation = {
    id: 'fixture', name: 'Fixture', repo: 'local-fixture', license: 'MIT',
    subjects: ['Mathematics'], classes: [8], mechanics: ['number_line'], reuse_strategy: 'ADAPT'
  };
  fs.writeFileSync(registryPath, JSON.stringify({ foundations: [foundation], components: [] }));
  const matcher = new ThreeTierMatcher(root);
  const unrelated = matcher.resolveExperience({ capability_id: 'sim', subject: 'Mathematics', grade: 8, mechanics: ['balance_beam'] });
  assert(unrelated.status === 'NO_MATCH', 'An unrelated listed mechanic must not be treated as a match');
  const exact = matcher.resolveExperience({ capability_id: 'sim', subject: 'Mathematics', grade: 8, mechanics: ['number_line'] });
  assert(exact.status === 'MATCH_FOUND' && exact.foundation_id === 'fixture', 'An exact mechanic should match');
  assert(exact.reuse_class === 'ADAPTATION_CANDIDATE' && exact.runtime_verified === false, 'A catalog foundation is a candidate, not a certified runtime component');
  assert(exact.license?.license_status === 'REVIEW_REQUIRED', 'A license string alone must not be promoted to approved license evidence');

  const projectDir = path.join(root, 'project');
  const projectRegistryDir = path.join(projectDir, 'experience_registry');
  const resourcesDir = path.join(root, 'resources');
  fs.mkdirSync(projectRegistryDir, { recursive: true });
  fs.mkdirSync(resourcesDir, { recursive: true });
  const resourceHtml = '<!doctype html><html><body><main><button>Move marker</button></main><script>window.__AASHA_EVENTS__=[];</script></body></html>';
  const resourcePath = path.join(resourcesDir, 'number-line.html');
  fs.writeFileSync(resourcePath, resourceHtml);
  const resourceHash = crypto.createHash('sha256').update(resourceHtml).digest('hex');
  const approvedResource = {
    component_id: 'AVR-number-line', version: '1.0.0', status: 'APPROVED',
    capability_contract: { mechanics: ['number_line'] },
    applicability: { subjects: ['Mathematics'], classes: [8] },
    adapter: { source_path: 'resources/number-line.html' },
    provenance: { source_hash: resourceHash },
    license: { license_status: 'APPROVED', spdx_identifier: 'MIT' },
    runtime: { offline: true, external_urls: [] },
  };
  fs.writeFileSync(path.join(projectRegistryDir, 'registry.json'), JSON.stringify({ foundations: [], components: [approvedResource] }));
  const resourceMatcher = new ThreeTierMatcher(projectDir);
  const resourceMatch = resourceMatcher.resolveExperience({ capability_id: 'sim:number-line', subject: 'Mathematics', grade: 8, mechanics: ['number_line'] });
  assert(resourceMatch.component_id === 'AVR-number-line' && resourceMatch.runtime_artifact?.local_verified, 'a compatible approved resource must be locally hash-verified before adaptation');
  assert(resourceMatch.runtime_verified === false && resourceMatch.runtime_artifact.browser_verified === false, 'static and hash checks must not claim browser certification');
  assert(resourceMatcher.loadRuntimeArtifact(resourceMatch) === resourceHtml, 'the exact matched HTML artifact can be loaded for an offline build');
  fs.writeFileSync(resourcePath, resourceHtml + '<!-- changed -->');
  assert(resourceMatcher.loadRuntimeArtifact(resourceMatch) === null, 'resource bytes changing after selection blocks bundling');
  const networkHtml = '<!doctype html><html><body><script>fetch("/remote-data");</script></body></html>';
  fs.writeFileSync(resourcePath, networkHtml);
  const networkHash = crypto.createHash('sha256').update(networkHtml).digest('hex');
  approvedResource.provenance.source_hash = networkHash;
  fs.writeFileSync(path.join(projectRegistryDir, 'registry.json'), JSON.stringify({ foundations: [], components: [approvedResource] }));
  const networkMatch = resourceMatcher.resolveExperience({ capability_id: 'sim:number-line', subject: 'Mathematics', grade: 8, mechanics: ['number_line'] });
  assert(networkMatch.status === 'NO_MATCH', 'a hash-matching resource that performs network requests must be rejected');

  const workspaceRoot = path.resolve(process.cwd());
  const realWorkspaceResource = path.resolve(workspaceRoot, '..', 'AASHA_Visual_Mass_Harvest_Phase3', 'resources', 'AVR-P301-number-line-marker.html');
  if (fs.existsSync(realWorkspaceResource)) {
    const workspaceMatcher = new ThreeTierMatcher(workspaceRoot);
    const workspaceMatch = workspaceMatcher.resolveExperience({ capability_id: 'cap:sim:number_line', subject: 'Mathematics', grade: 8, board: 'NCERT', mechanics: ['number_line'] });
    assert(workspaceMatch.component_id === 'AVR-P301-number-line-marker', 'the current workspace registry should resolve the checked local number-line asset');
    assert(workspaceMatcher.loadRuntimeArtifact(workspaceMatch)?.includes('Number Line Marker'), 'the current workspace asset must load only after its registry hash is verified');
  }

  fs.rmSync(registryPath);
  const missing = matcher.resolveExperience({ capability_id: 'sim', subject: 'Mathematics', grade: 8, mechanics: ['number_line'] });
  assert(missing.status === 'UNKNOWN', 'A missing authoritative registry must remain unknown');
  console.log('PASS three-tier matcher exact evidence checks');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
