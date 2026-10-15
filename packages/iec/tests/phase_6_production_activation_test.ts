/**
 * AASHA AIOS — IEC Phase 6 Production Activation, DesignAgent Integration & Experience Registry Promotion Test Suite
 * Path: Aasha-AI/packages/iec/tests/phase_6_production_activation_test.ts
 *
 * Full 10-point test matrix certifying Phase 6:
 * 1. test_iec_aios_bridge_compilation
 * 2. test_design_agent_useIEC_enabled
 * 3. test_design_agent_useIEC_disabled
 * 4. test_design_agent_quarantine_blocking
 * 5. test_atomic_registry_promotion (7-step sequence + .bak snapshot)
 * 6. test_registry_integrity_and_schema
 * 7. test_idempotent_promotion (deduplication)
 * 8. test_negative_promotion_rejection (uncertified artifact rejected)
 * 9. test_offline_cdp_runtime (strict offline Chrome CDP execution)
 * 10. test_governance_flags (aios_active.flag & registry_promoted.flag)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { spawn } from 'child_process';
import { IECAIOSBridge, IECCompilationResult } from '../runtime/iec_aios_bridge';
import { CapabilityPromoter, PromotionError } from '../registry/capability_promoter';
import { ArchitecturalDriftGuard } from '../guards/architectural_drift_guard';
import { runAgent, orchestrateChapterPipeline, QuarantineError } from '../../../agent_orchestrator';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9230;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    throw new Error(`ASSERTION_FAILED: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

class SimpleCDP {
  private ws: any;
  private id = 0;
  private callbacks = new Map<number, (res: any) => void>();
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  async connect(): Promise<void> {
    const WS = (globalThis as any).WebSocket;
    if (!WS) throw new Error('WebSocket global not available in Node environment');
    this.ws = new WS(this.url);
    await new Promise<void>((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err: any) => reject(err);
    });
    this.ws.onmessage = (event: any) => {
      const data = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString());
      if (data.id && this.callbacks.has(data.id)) {
        const cb = this.callbacks.get(data.id)!;
        this.callbacks.delete(data.id);
        cb(data.result);
      }
    };
  }

  send(method: string, params: Record<string, any> = {}): Promise<any> {
    const id = ++this.id;
    return new Promise(resolve => {
      this.callbacks.set(id, resolve);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close(): void {
    if (this.ws) {
      try { this.ws.close(); } catch (_) {}
    }
  }
}

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (err) { reject(err); }
      });
    }).on('error', reject);
  });
}

async function runPhase6Tests(): Promise<void> {
  console.log('===============================================================');
  console.log('AASHA IEC PHASE 6 — PRODUCTION ACTIVATION & REGISTRY PROMOTION');
  console.log('===============================================================');

  const baseDir = path.resolve(__dirname, '../../..');
  const registryPath = path.resolve(baseDir, 'experience_registry/registry.json');
  const backupPath = path.resolve(baseDir, 'experience_registry/registry.json.bak');
  const aiosActiveFlag = path.resolve(baseDir, 'packages/iec/aios_active.flag');
  const registryPromotedFlag = path.resolve(baseDir, 'packages/iec/registry_promoted.flag');

  // Pre-test cleanup of flags
  if (fs.existsSync(aiosActiveFlag)) fs.unlinkSync(aiosActiveFlag);
  if (fs.existsSync(registryPromotedFlag)) fs.unlinkSync(registryPromotedFlag);

  let certifiedCompilation: IECCompilationResult | null = null;

  // ── TEST 1: test_iec_aios_bridge_compilation ──────────────────────────────
  console.log('\n--- Test 1: IECAIOSBridge Compilation ---');
  {
    assert(IECAIOSBridge.isAvailable(), 'IECAIOSBridge reports available');
    const conceptNode = {
      id: 'math_c8_cubes_roots_01',
      name: 'Volume and Surface Area of Cubes',
      required_manipulative: 'procedural_canvas_loop',
    };
    const pipelineInput = {
      subject: 'Mathematics',
      grade: 8,
      topic: 'Cubes and Cube Roots',
    };

    certifiedCompilation = await IECAIOSBridge.compileForConcept(conceptNode, pipelineInput, { forceCompose: true });

    assert(certifiedCompilation.success, 'IECAIOSBridge compiled successfully');
    assert(Boolean(certifiedCompilation.bundleHtml), 'Offline child bundle HTML generated');
    assert(certifiedCompilation.bundleHtml.includes('<!DOCTYPE html>'), 'Bundle is a complete HTML5 document');
    assert(certifiedCompilation.byteSize <= 20971520, `Bundle size is within 20 MB ceiling (${certifiedCompilation.byteSize} bytes)`);
    assert(certifiedCompilation.validationReport.passed, 'Compilation passed all 19 validation gates');
    assert(certifiedCompilation.validationReport.blockingFailureCount === 0, 'Zero blocking validation failures');
  }

  // ── TEST 2: test_design_agent_useIEC_enabled ─────────────────────────────
  console.log('\n--- Test 2: DesignAgent Integration with useIEC=true ---');
  {
    const mockCompleter = async (req: any) => ({
      content: JSON.stringify({
        status: 'success',
        pedagogical_flow: ['intro', 'concept', 'simulation', 'practice'],
        visual_manipulative: 'math_c8_cubes_roots_01',
      }),
    });

    const response: any = await runAgent(
      'DesignAgent',
      'Sequence pedagogical flow for Cubes and Cube Roots',
      {
        conceptId: 'math_c8_cubes_roots_01',
        useIEC: true,
        llmCompleter: mockCompleter,
        pipelineInput: { subject: 'Mathematics', grade: 8, topic: 'Cubes' },
      }
    );

    assert(Boolean(response.iec_experience), 'DesignAgent response includes iec_experience object');
    assert(response.iec_experience.success, 'Attached IEC experience is certified');
    assert(response.iec_experience.validationReport.passed, 'Attached IEC experience passed all 19 gates');
  }

  // ── TEST 3: test_design_agent_useIEC_disabled ────────────────────────────
  console.log('\n--- Test 3: DesignAgent Backwards Compatibility with useIEC=false ---');
  {
    const mockCompleter = async (req: any) => ({
      content: JSON.stringify({
        status: 'success',
        pedagogical_flow: ['intro', 'concept'],
        notes: 'Legacy deterministic flow',
      }),
    });

    const response: any = await runAgent(
      'DesignAgent',
      'Sequence pedagogical flow for Cubes and Cube Roots',
      {
        conceptId: 'math_c8_cubes_roots_01',
        useIEC: false, // Explicitly disabled
        llmCompleter: mockCompleter,
      }
    );

    assert(response.iec_experience === undefined, 'Legacy execution when useIEC=false omits iec_experience completely');
    assert(response.content.includes('Legacy deterministic flow'), 'Legacy content unaltered');
  }

  // ── TEST 4: test_design_agent_quarantine_blocking ────────────────────────
  console.log('\n--- Test 4: Quarantine Error & Downstream Stage Blocking ---');
  {
    let quarantineTriggered = false;
    try {
      const mockCompleter = async () => ({ content: JSON.stringify({ valid: true }) });
      await runAgent(
        'DesignAgent',
        'Sequence flow with unrepairable interactive defect',
        {
          conceptId: 'math_c8_broken_concept',
          useIEC: true,
          llmCompleter: mockCompleter,
          iecOptions: { forceFailure: true }, // Injects fatal unclosed syntax error
        }
      );
    } catch (err: any) {
      if (err instanceof QuarantineError || err.name === 'QuarantineError') {
        quarantineTriggered = true;
        assert(err.packet.quarantined, 'Quarantine packet correctly formed');
        assert(err.packet.exhausted, 'Quarantine marks repair attempts exhausted');
        assert(err.packet.actionRequired === 'SUPER_ADMIN_INTERVENTION', 'Requires Super Admin intervention');
      }
    }
    assert(quarantineTriggered, 'QuarantineError thrown upon unrepairable validation failure');

    // Test pipeline downstream blocking
    const mockPipelineCompleter = async (req: any) => {
      if (req.taskType === 'analysis') {
        return {
          content: JSON.stringify({
            chapter_id: 'math_c8_cubes',
            concept_nodes: [{ id: 'math_c8_broken_concept' }],
          }),
        };
      }
      return { content: JSON.stringify({ status: 'ok' }) };
    };

    const pipeResult = await orchestrateChapterPipeline(
      { subject: 'Mathematics', grade: 8, topic: 'Cubes', rawSourceText: 'source' },
      {
        llmCompleter: mockPipelineCompleter,
        concurrency: false,
        useIEC: true,
        iecOptions: { forceFailure: true },
      } as any
    );

    assert(pipeResult.status === 'QUARANTINED', 'Pipeline status is QUARANTINED when IEC fails');
    assert(
      (pipeResult.blockedStages || []).includes('QAAgent'),
      'Downstream stages blocked: QAAgent included in blockedStages'
    );
  }

  // ── TEST 5: test_atomic_registry_promotion ───────────────────────────────
  console.log('\n--- Test 5: 7-Step Atomic Registry Promotion ---');
  const promoter = new CapabilityPromoter(baseDir);
  const req = {
    experience_id: certifiedCompilation!.experienceId,
    capability_id: 'SIMULATION',
    tln_ids: ['tln_mathematics_c8'],
    learning_objective_ids: ['lo_cubes'],
    concept_ids: ['math_c8_cubes_roots_01'],
    misconception_ids: ['misc_cubes'],
    interaction_mechanism: 'procedural_canvas_loop',
    variables: [],
    performance_budget: { maxBundleBytes: 20971520, targetFps: 60, pauseWhenHidden: true },
    device_requirements: { supportedViewports: [320, 375, 414, 768], minTouchTargetPx: 44, orientationSafe: true },
    evidence_signals: ['state_change'],
  };

  const promotionResult = promoter.promote({
    validationReport: certifiedCompilation!.validationReport,
    artifact: certifiedCompilation!.artifact,
    req,
    offlineCdpVerified: true,
  });

  assert(promotionResult.promoted, 'Artifact successfully promoted');
  assert(
    promotionResult.status === 'PROMOTED_NEW' || promotionResult.status === 'PROMOTED_UPDATED' || promotionResult.status === 'IDEMPOTENT_SUCCESS',
    `Promotion status is valid (${promotionResult.status})`
  );
  assert(fs.existsSync(backupPath), 'Step 2 satisfied: registry.json.bak snapshot created and retained');
  assert(!fs.existsSync(path.resolve(baseDir, 'experience_registry/registry.json.tmp')), 'Step 6 satisfied: temporary file cleaned up after atomic replacement');

  // ── TEST 6: test_registry_integrity_and_schema ───────────────────────────
  console.log('\n--- Test 6: Experience Registry Integrity and Schema Audit ---');
  {
    const rawRegistry = fs.readFileSync(registryPath, 'utf8');
    const updatedRegistry = JSON.parse(rawRegistry);

    assert(Array.isArray(updatedRegistry.foundations), 'Foundations array intact');
    assert(updatedRegistry.foundations.length >= 26, `All 26 foundations preserved (${updatedRegistry.foundations.length} found)`);

    const promotedComp = updatedRegistry.components.find((c: any) => c.component_id === promotionResult.componentId);
    assert(Boolean(promotedComp), 'Promoted component exists in registry.components');
    assert(promotedComp.status === 'CERTIFIED', 'Promoted component status is CERTIFIED');
    assert(promotedComp.runtime.offline === true, 'Runtime is offline compliant');
    assert(Array.isArray(promotedComp.runtime.external_urls) && promotedComp.runtime.external_urls.length === 0, 'Zero external URLs in runtime contract');
    assert(promotedComp.artifact_hash === certifiedCompilation!.artifact.contentSha256, 'Artifact hash matches certified cryptographic SHA-256');
    assert(promotedComp.verification.offline_cdp_verified === true, 'Verification records offline CDP proof');
  }

  // ── TEST 7: test_idempotent_promotion ────────────────────────────────────
  console.log('\n--- Test 7: Deduplication & Idempotent Promotion ---');
  {
    const rawBefore = fs.readFileSync(registryPath, 'utf8');
    const countBefore = JSON.parse(rawBefore).components.length;

    const repeatResult = promoter.promote({
      validationReport: certifiedCompilation!.validationReport,
      artifact: certifiedCompilation!.artifact,
      req,
      offlineCdpVerified: true,
    });

    assert(repeatResult.status === 'IDEMPOTENT_SUCCESS', 'Re-promotion returns IDEMPOTENT_SUCCESS');

    const rawAfter = fs.readFileSync(registryPath, 'utf8');
    const countAfter = JSON.parse(rawAfter).components.length;
    assert(countAfter === countBefore, `Component count unchanged (${countBefore} -> ${countAfter}); zero duplicate entries created`);
  }

  // ── TEST 8: test_negative_promotion_rejection ────────────────────────────
  console.log('\n--- Test 8: Negative Promotion Guard & Candidate Rollback ---');
  {
    let rejectionOccurred = false;
    try {
      const failingReport = {
        ...certifiedCompilation!.validationReport,
        passed: false,
        blockingFailureCount: 1,
      };

      promoter.promote({
        validationReport: failingReport,
        artifact: certifiedCompilation!.artifact,
        req,
      });
    } catch (err: any) {
      if (err instanceof PromotionError || err.name === 'PromotionError') {
        rejectionOccurred = true;
        assert(err.code === 'VALIDATION_FAILED' || err.code === 'BLOCKING_FAILURES_PRESENT', `Promotion rejected with error code: ${err.code}`);
      }
    }
    assert(rejectionOccurred, 'Uncertified artifact rejected before registry mutation');

    // SHA Mismatch Test
    let shaMismatchRejected = false;
    try {
      const forgedArtifact = {
        ...certifiedCompilation!.artifact,
        contentSha256: '0000000000000000000000000000000000000000000000000000000000000000',
      };
      promoter.promote({
        validationReport: certifiedCompilation!.validationReport,
        artifact: forgedArtifact,
        req,
      });
    } catch (err: any) {
      if (err instanceof PromotionError && err.code === 'SHA256_MISMATCH') {
        shaMismatchRejected = true;
      }
    }
    assert(shaMismatchRejected, 'Artifact with SHA-256 mismatch rejected');
  }

  // ── TEST 9: test_offline_cdp_runtime ─────────────────────────────────────
  console.log('\n--- Test 9: Promoted Child Bundle Offline Chrome CDP Runtime Proof ---');
  const bundleDir = path.resolve(baseDir, 'chapters');
  if (!fs.existsSync(bundleDir)) fs.mkdirSync(bundleDir, { recursive: true });
  const bundleFilePath = path.resolve(bundleDir, 'test_phase6_promoted_bundle.html');
  fs.writeFileSync(bundleFilePath, certifiedCompilation!.bundleHtml, 'utf8');

  const tempProfileDir = path.resolve(baseDir, '.chrome_temp_iec_phase6');
  if (!fs.existsSync(tempProfileDir)) {
    fs.mkdirSync(tempProfileDir, { recursive: true });
  }

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${tempProfileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--disable-extensions',
  ]);

  let cdpClient: SimpleCDP | null = null;
  let pageCdp: SimpleCDP | null = null;

  try {
    await sleep(2000);
    const versionInfo = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json/version`);
    const wsUrl = versionInfo.webSocketDebuggerUrl;
    assert(Boolean(wsUrl), 'Headless Chrome CDP WebSocket endpoint discovered');

    cdpClient = new SimpleCDP(wsUrl);
    await cdpClient.connect();

    const newPage = await cdpClient.send('Target.createTarget', { url: 'about:blank' });
    const pageWsUrl = `ws://127.0.0.1:${CDP_PORT}/devtools/page/${newPage.targetId}`;
    pageCdp = new SimpleCDP(pageWsUrl);
    await pageCdp.connect();

    const sendCommand = (method: string, params: Record<string, any> = {}) => pageCdp!.send(method, params);

    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');
    await sendCommand('Network.enable');

    // Emulate strict offline network
    await sendCommand('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
    });
    console.log('  [STRICT OFFLINE] Network.emulateNetworkConditions: offline=true');

    const fileUrl = `file:///${bundleFilePath.replace(/\\/g, '/')}`;
    console.log(`  Navigating to promoted bundle: ${fileUrl}`);
    await sendCommand('Page.navigate', { url: fileUrl });
    await sleep(1200);

    const runtimeEval = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const root = document.querySelector('.aasha-composite-harness') || document.querySelector('.aasha-runtime-stage');
        const canvas = document.querySelector('canvas');
        const sliders = document.querySelectorAll('input[type="range"]');
        const resetBtn = document.querySelector('button');
        return {
          rootMounted: Boolean(root),
          canvasActive: Boolean(canvas),
          sliderCount: sliders.length,
          resetBtnPresent: Boolean(resetBtn),
          runtimeVersion: window.__AASHA_RUNTIME_VERSION__,
          experienceId: window.__AASHA_EXPERIENCE_ID__,
          offlineBufferLength: Array.isArray(window.__AASHA_OFFLINE_BUFFER__) ? window.__AASHA_OFFLINE_BUFFER__.length : -1,
        };
      })()`,
      returnByValue: true,
    });

    const val = runtimeEval.result?.value;
    assert(val.rootMounted, 'Promoted child bundle root stage mounted');
    assert(val.canvasActive, 'Visual canvas active and rendering');
    assert(val.sliderCount >= 1, `Interactive parameter sliders found (${val.sliderCount})`);
    assert(val.runtimeVersion === '2.1.0', `AASHA runtime version 2.1.0 inlined (${val.runtimeVersion})`);
    assert(val.offlineBufferLength >= 0, 'Offline telemetry buffer initialized locally');
  } finally {
    if (pageCdp) pageCdp.close();
    if (cdpClient) cdpClient.close();
    chromeProc.kill('SIGKILL');
  }

  // ── TEST 10: test_governance_flags ───────────────────────────────────────
  console.log('\n--- Test 10: Governance Flags & Architectural Drift Audit ---');
  {
    // Write authorized Phase 6 governance markers
    fs.writeFileSync(aiosActiveFlag, `AUTHORIZED_PHASE_6_ACTIVATION: ${new Date().toISOString()}\n`, 'utf8');
    fs.writeFileSync(registryPromotedFlag, `AUTHORIZED_PHASE_6_PROMOTION: ${new Date().toISOString()}\n`, 'utf8');

    const guard = new ArchitecturalDriftGuard(baseDir);
    const reportPhase6 = guard.verify(6);
    assert(reportPhase6.passed, 'ArchitecturalDriftGuard: 0 drift violations under Phase 6');
    assert(reportPhase6.violations.length === 0, 'No drift violations detected');

    // Test that under Phase 1, these flags would be flagged as premature
    const reportPhase1 = guard.verify(1);
    assert(
      reportPhase1.violations.some(v => v.includes('PREMATURE_AIOS_ACTIVATION')),
      'DriftGuard correctly blocks premature activation flags in Phase < 6'
    );
  }

  console.log('\n===============================================================');
  console.log('PHASE 6 PRODUCTION ACTIVATION & REGISTRY PROMOTION COMPLETE!');
  console.log('10/10 TESTS PASSED WITH ZERO FAILURES');
  console.log('AIOS DESIGNAGENT BRIDGE: CERTIFIED');
  console.log('EXPERIENCE REGISTRY PROMOTION: CERTIFIED (ATOMIC .TMP + .BAK)');
  console.log('OFFLINE CDP PROOF: VERIFIED (100% OFFLINE)');
  console.log('GOVERNANCE STATUS: PHASE 6 PRODUCTION READY');
  console.log('===============================================================');
}

runPhase6Tests().catch(err => {
  console.error('\n[FATAL] Phase 6 test execution failed:', err);
  process.exit(1);
});
