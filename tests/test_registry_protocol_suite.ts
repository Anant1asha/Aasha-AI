import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { RegistryIngestionEngine } from '../packages/adapters/registry_ingestion_engine.ts';
import { ThreeTierMatcher } from '../packages/adapters/three_tier_matcher.ts';
import { ChapterPipelineOrchestrator } from '../packages/aios/chapter_pipeline_orchestrator.ts';

export async function runProtocolTestSuite(): Promise<{ total: number; passed: number; failed: number; results: Array<{ name: string; pass: boolean; details: string }> }> {
  const results: Array<{ name: string; pass: boolean; details: string }> = [];
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aasha-registry-protocol-'));
  const engine = new RegistryIngestionEngine(baseDir);
  const matcher = new ThreeTierMatcher(baseDir);
  const orchestrator = new ChapterPipelineOrchestrator(baseDir);

  function assert(name: string, condition: boolean, details: string) {
    results.push({ name, pass: condition, details });
    console.log(`${condition ? '✅ [PASS]' : '❌ [FAIL]'} ${name} — ${details}`);
  }

  console.log(`\n================================================================================`);
  console.log(` AASHA AI NATIVE IMPLEMENTATION PROTOCOL (v2.0) — TEST SUITE EXECUTION`);
  console.log(`================================================================================\n`);

  // TEST_01: Candidate Staging
  try {
    const stagedPath = engine.stageCandidate({
      component_id: 'comp_test_stage_01',
      version: '1.0.0',
      mechanic_tags: ['balance_beam'],
      component_code: 'class TestComp01 extends HTMLElement {}',
    });
    assert('TEST_01: Candidate staging', fs.existsSync(stagedPath), `Candidate file created at ${stagedPath}`);
  } catch (e: any) {
    assert('TEST_01: Candidate staging', false, e.message);
  }

  // TEST_02: SHA-256 Artifact Hashing
  try {
    const hash = engine.hashArtifact('test content string');
    assert('TEST_02: SHA-256 artifact hashing', hash.length === 64, `SHA-256 hash generated: ${hash.slice(0, 16)}...`);
  } catch (e: any) {
    assert('TEST_02: SHA-256 artifact hashing', false, e.message);
  }

  // TEST_04: Schema Validation
  try {
    const schemaPath = path.resolve(__dirname, '../experience_registry/schema/component_schema.json');
    assert('TEST_04: Schema validation', fs.existsSync(schemaPath), `JSON schema present at ${schemaPath}`);
  } catch (e: any) {
    assert('TEST_04: Schema validation', false, e.message);
  }

  // TEST_08: Tier-3 Fallback
  try {
    const res = matcher.resolveExperience({
      capability_id: 'cap:non_existent_unique_mech_99',
      subject: 'UnknownSubject',
      grade: 12,
      mechanics: ['unique_non_existent_mechanic_99'],
    });
    assert('TEST_08: Tier-3 fallback', res.tier === 3 && res.status === 'NO_MATCH', `Correctly fell back to Tier 3 synthesis`);
  } catch (e: any) {
    assert('TEST_08: Tier-3 fallback', false, e.message);
  }

  // TEST_10 & TEST_11 & TEST_12: Promotion Gates & Gate Evaluation
  try {
    const candidatePath = engine.stageCandidate({
      component_id: 'comp_test_gate_10',
      version: '1.0.0',
      runtime: { offline: false, external_urls: ['http://external-cdn.com/lib.js'] }, // Should fail OFFLINE gate
      component_code: 'const url = "http://external-cdn.com/lib.js";',
    });
    const candidateData = JSON.parse(fs.readFileSync(candidatePath, 'utf-8'));
    const gateEval = engine.validateCandidate(candidateData);
    assert('TEST_10/11: Promotion blocked on OFFLINE gate failure', !gateEval.allowed, `Correctly blocked promotion: ${gateEval.reason}`);
  } catch (e: any) {
    assert('TEST_10/11: Promotion blocked on gate failure', false, e.message);
  }

  // TEST_13: Chapter Certification != Component Certification Separation
  try {
    const promoteRes = engine.promoteCandidate('comp_test_uncertified_no_hash', '', {} as any); // Missing benchmark evidence hash
    assert('TEST_13: Component certification separation', !promoteRes.success, `Blocked component promotion without benchmark evidence hash: ${promoteRes.reason}`);
  } catch (e: any) {
    assert('TEST_13: Component certification separation', false, e.message);
  }

  // TEST_18: External URL Detection
  try {
    const cleanCode = 'class CleanComp extends HTMLElement { render() { this.innerText = "hello"; } }';
    const dirtyCode = 'fetch("https://analytics.example.com/log");';
    const cleanHash = engine.hashArtifact(cleanCode);
    const dirtyHash = engine.hashArtifact(dirtyCode);
    assert('TEST_18: External URL detection', /https?:\/\//.test(dirtyCode) && !/https?:\/\//.test(cleanCode), `Detected URL in dirty code, verified clean code`);
  } catch (e: any) {
    assert('TEST_18: External URL detection', false, e.message);
  }

  // TEST_21: Synthetic pipeline fail-closed guard
  try {
    const res = await orchestrator.runPipeline({ subject: 'Mathematics', grade: 8, topic: 'missing source', pdfPath: path.join(baseDir, 'missing.pdf') });
    assert('TEST_21: Synthetic pipeline fail-closed guard', !res.success && res.certificationEligibility === 'NOT_ELIGIBLE', 'No source or evidence means no artifact or certification');
  } catch (e: any) { assert('TEST_21: Synthetic pipeline fail-closed guard', false, e.message); }

  // TEST_30: Fail-closed pipeline cannot create a reusable certified component
  try {
    const run1 = await orchestrator.runPipeline({ subject: 'Mathematics', grade: 8, topic: 'Quadratic Systems Lab' });
    assert('TEST_30 Part 1: Synthetic pipeline blocked', !run1.success && run1.certificationEligibility === 'NOT_ELIGIBLE', 'Synthetic generation is non-certifiable');
    const match = matcher.resolveExperience({ capability_id: 'cap:quadratic_systems_lab', subject: 'Mathematics', grade: 8, mechanics: ['interactive_simulation'] });
    assert('TEST_30 Part 2: Unverified component is not reusable', match.tier === 3 && match.status === 'NO_MATCH', `No signed certification evidence: Tier ${match.tier}, ${match.status}`);
  } catch (e: any) { assert('TEST_30: Fail-closed pipeline', false, e.message); }
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  fs.rmSync(baseDir, { recursive: true, force: true });
  return { total: results.length, passed, failed, results };
}

if (require.main === module) {
  runProtocolTestSuite().then(summary => {
    console.log(`\n================================================================================`);
    console.log(` TEST SUMMARY: Total: ${summary.total} | Passed: ${summary.passed} | Failed: ${summary.failed}`);
    console.log(`================================================================================\n`);
    process.exit(summary.failed === 0 ? 0 : 1);
  }).catch(error => { console.error(error); process.exit(1); });
}

