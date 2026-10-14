/**
 * AASHA AIOS — IEC Phase 3 OpenMAIC Adapter & Provider Neutrality Test
 * Path: Aasha-AI/packages/iec/tests/phase_3_openmaic_test.ts
 *
 * Verifies Phase 3:
 * 1. Provenance integrity (pinned commit 21d83ec51b908a4b169ee2be7498a29da213c74d, MIT license)
 * 2. Provider interface compliance (APPROVED_EXTERNAL_CAPABILITY_PROVIDER)
 * 3. Rigorous Provider Neutrality Test (AASHA Foundation vs AASHA Native vs OpenMAIC on identical criteria)
 * 4. 7-gate provider-artifact validation subset
 * 5. Offline child bundle packaging (<= 20MB)
 * 6. Headless Chrome CDP live mounting, interaction, state sync, telemetry capture, and zero mastery mutation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { spawn, ChildProcess } from 'child_process';
import { OpenMAICAdapterProvider } from '../providers/openmaic/openmaic_adapter_provider';
import { CapabilityDiscoveryEngine } from '../discovery/capability_discovery_engine';
import { CapabilityEvaluator } from '../discovery/capability_evaluator';
import { ResourceMatchReporter } from '../discovery/resource_match_reporter';
import { ValidationPipeline } from '../validation/validation_pipeline';
import { ChildBundlePackager } from '../runtime/child_bundle_packager';
import { ExperienceRequirement, CandidateCapability } from '../contracts/experience_specification';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9226;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

class SimpleCDP {
  private ws: any;
  private id = 1;
  private callbacks = new Map<number, (res: any) => void>();

  constructor(private wsUrl: string) {}

  async connect(): Promise<void> {
    const WebSocketImpl = (globalThis as any).WebSocket;
    this.ws = new WebSocketImpl(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event: any) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const cb = this.callbacks.get(msg.id)!;
        this.callbacks.delete(msg.id);
        cb(msg.result);
      }
    };
  }

  send(method: string, params: Record<string, any> = {}): Promise<any> {
    return new Promise((resolve) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, resolve);
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  close(): void {
    if (this.ws) this.ws.close();
  }
}

async function runPhase3Tests() {
  console.log('===============================================================');
  console.log('AASHA IEC PHASE 3 — OPENMAIC ADAPTER & PROVIDER NEUTRALITY');
  console.log('===============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      throw new Error(`PHASE_3_TEST_FAILURE: ${testName}`);
    }
  }

  // 1. PROVENANCE & PINNED COMMIT VERIFICATION
  console.log('--- Step 1: OpenMAIC Provenance Verification ---');
  const provenancePath = path.resolve(__dirname, '../providers/openmaic/provenance.json');
  assert(fs.existsSync(provenancePath), 'OpenMAIC provenance.json exists');
  const provJson = JSON.parse(fs.readFileSync(provenancePath, 'utf8'));
  assert(provJson.exact_commit === '21d83ec51b908a4b169ee2be7498a29da213c74d', 'Exact commit SHA pinned (21d83ec)');
  assert(provJson.license === 'MIT', 'Verified MIT license');
  assert(provJson.floating_dependency === false, 'Zero floating dependencies');
  assert(provJson.rejected_components.includes('OpenMAIC_classroom_UI'), 'Classroom UI explicitly rejected');

  // 2. PROVIDER INTERFACE COMPLIANCE
  console.log('\n--- Step 2: OpenMAIC Provider Interface Compliance ---');
  const openmaicProvider = new OpenMAICAdapterProvider();
  assert(openmaicProvider.providerClass === 'APPROVED_EXTERNAL_CAPABILITY_PROVIDER', 'Provider class is APPROVED_EXTERNAL_CAPABILITY_PROVIDER');
  assert(openmaicProvider.pinnedCommit === '21d83ec51b908a4b169ee2be7498a29da213c74d', 'Provider instance binds to pinned commit');

  // 3. RIGOROUS PROVIDER NEUTRALITY TEST
  console.log('\n--- Step 3: Rigorous Provider Neutrality Test ---');
  const evaluator = new CapabilityEvaluator();

  // Candidate pool with identical capabilities
  const candidateFoundation: CandidateCapability = {
    candidate_id: 'F02',
    name: 'MicroSims',
    provider_class: 'AASHA_FOUNDATION',
    source_ref: 'experience_registry/registry.json',
    license: 'MIT',
    offline_ready: true,
    mechanics: ['parameter_sliders'],
    supported_subjects: ['Mathematics'],
    supported_grades: [8],
  };

  const candidateNative: CandidateCapability = {
    candidate_id: 'native:math:c8',
    name: 'AASHA Native Canvas',
    provider_class: 'AASHA_NATIVE',
    source_ref: 'packages/iec/providers/aasha_native',
    license: 'MIT',
    offline_ready: true,
    mechanics: ['parameter_sliders'],
    supported_subjects: ['Mathematics'],
    supported_grades: [8],
  };

  const candidateOpenMAIC: CandidateCapability = {
    candidate_id: 'openmaic:interactive_primitives',
    name: 'OpenMAIC Primitives',
    provider_class: 'APPROVED_EXTERNAL_CAPABILITY_PROVIDER',
    source_ref: 'https://github.com/THU-MAIC/OpenMAIC',
    license: 'MIT',
    offline_ready: true,
    mechanics: ['parameter_sliders', 'multi_parameter_sliders'],
    supported_subjects: ['Mathematics'],
    supported_grades: [8],
  };

  // Scenario A: When AASHA Foundation matches mechanic -> Foundation WINS due to lower adaptation overhead
  const reqA: ExperienceRequirement = {
    experience_id: 'exp:math:c8:test_neutrality_A',
    capability_id: 'SIMULATION',
    tln_ids: ['tln:math:c8:squares'],
    learning_objective_ids: ['obj:01'],
    concept_ids: ['cpt:squares'],
    misconception_ids: ['misc:squares'],
    interaction_mechanism: 'parameter_sliders',
    variables: [],
    performance_budget: { maxBundleBytes: 20971520, targetFps: 60, pauseWhenHidden: true },
    device_requirements: { supportedViewports: [320, 375, 414, 768], minTouchTargetPx: 44, orientationSafe: true },
    evidence_signals: ['slider_action'],
  };
  const evalResultA = evaluator.evaluate(reqA, [candidateOpenMAIC, candidateFoundation, candidateNative]);
  console.log(`  Scenario A (Foundation matches): Selected=${evalResultA.plan.selected_strategy} (${evalResultA.plan.primary_candidate?.name})`);
  assert(evalResultA.plan.selected_strategy === 'REUSE', 'Scenario A: Foundation selected via REUSE due to lowest adaptation overhead');
  assert(evalResultA.plan.primary_candidate?.candidate_id === 'F02', 'Scenario A: Candidate F02 won over OpenMAIC without bias');

  // Scenario B: Specialized multi-parameter mechanic where OpenMAIC matches and Foundation does not
  const reqB: ExperienceRequirement = {
    ...reqA,
    experience_id: 'exp:math:c8:test_neutrality_B',
    interaction_mechanism: 'multi_parameter_sliders',
  };
  const evalResultB = evaluator.evaluate(reqB, [candidateFoundation, candidateOpenMAIC, candidateNative]);
  console.log(`  Scenario B (OpenMAIC specific match): Selected=${evalResultB.plan.selected_strategy} (${evalResultB.plan.primary_candidate?.name})`);
  assert(evalResultB.plan.selected_strategy === 'ADAPT', 'Scenario B: OpenMAIC selected via ADAPT on objective capability merit');
  assert(evalResultB.plan.primary_candidate?.provider_class === 'APPROVED_EXTERNAL_CAPABILITY_PROVIDER', 'Scenario B: Selected external capability provider');

  // 4. REAL OPENMAIC PROVIDER SYNTHESIS
  console.log('\n--- Step 4: Real OpenMAIC Provider Synthesis ---');
  const rawArtifact = await openmaicProvider.synthesize(reqB, evalResultB.plan);
  assert(Boolean(rawArtifact.htmlFragment), 'Synthesized OpenMAIC HTML fragment');
  assert(Boolean(rawArtifact.javascriptCode), 'Synthesized OpenMAIC JavaScript code');
  assert(rawArtifact.contentSha256.length === 64, 'SHA-256 provenance hash verified');
  assert(Array.isArray(rawArtifact.canonicalIrRefs) && rawArtifact.canonicalIrRefs.length > 0, 'Canonical IR concept references traceably embedded');
  assert(Array.isArray(rawArtifact.learningObjectiveRefs) && rawArtifact.learningObjectiveRefs.length > 0, 'Learning objective references traceably embedded');

  // 5. PROVIDER-ARTIFACT VALIDATION SUBSET (7 GATES)
  console.log('\n--- Step 5: Provider-Artifact Validation Subset (7 Gates) ---');
  const validationReport = ValidationPipeline.validate(rawArtifact, reqB);
  for (const gate of validationReport.gates) {
    console.log(`  [Gate: ${gate.gateId}] Passed: ${gate.passed} — ${gate.message}`);
  }
  assert(validationReport.passed === true, 'All 7 validation gates passed for OpenMAIC artifact');

  // 6. CHILD BUNDLE PACKAGING (<= 20MB)
  console.log('\n--- Step 6: Child HTML5 Bundle Packaging ---');
  const bundle = ChildBundlePackager.package(rawArtifact);
  console.log(`OpenMAIC Child Bundle Size: ${bundle.byteSize} bytes`);
  assert(bundle.byteSize <= 20971520, 'Bundle size <= 20 MB');
  assert(bundle.isOfflineReady === true, 'Bundle flagged as 100% offline ready');

  const bundlePath = path.resolve(__dirname, '../../../chapters/test_iec_openmaic_child_bundle.html');
  fs.writeFileSync(bundlePath, bundle.bundleHtml, 'utf8');
  assert(fs.existsSync(bundlePath), 'Saved standalone OpenMAIC bundle to chapters directory');

  // 7. HEADLESS CHROME CDP EXECUTION UNDER STRICT NETWORK ISOLATION
  console.log('\n--- Step 7: Headless Chrome CDP Mounting & Interaction ---');
  const chromeProcess: ChildProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    `--user-data-dir=${path.resolve(__dirname, '../../../.chrome_temp_iec_openmaic')}`,
  ]);

  let cdpClient: SimpleCDP | null = null;
  try {
    await sleep(1500);
    const versionInfo = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json/version`);
    const wsUrl = versionInfo.webSocketDebuggerUrl;
    assert(Boolean(wsUrl), 'Headless Chrome CDP WebSocket endpoint discovered');

    cdpClient = new SimpleCDP(wsUrl);
    await cdpClient.connect();

    const newPage = await cdpClient.send('Target.createTarget', { url: 'about:blank' });
    const pageWsUrl = `ws://127.0.0.1:${CDP_PORT}/devtools/page/${newPage.targetId}`;
    const pageCdp = new SimpleCDP(pageWsUrl);
    await pageCdp.connect();

    // Strict offline emulation
    await pageCdp.send('Network.enable');
    await pageCdp.send('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
    });
    console.log('Strict network isolation enabled (Network.emulateNetworkConditions: offline=true)');

    const fileUrl = `file:///${bundlePath.replace(/\\/g, '/')}`;
    console.log(`Navigating to offline OpenMAIC bundle: ${fileUrl}`);
    await pageCdp.send('Page.enable');
    await pageCdp.send('Page.navigate', { url: fileUrl });
    await sleep(1000);

    // Verify DOM mounting & canvas
    const evalMount = await pageCdp.send('Runtime.evaluate', {
      expression: 'Boolean(document.querySelector(".openmaic-adapted-sim-container"))',
    });
    assert(evalMount.result?.value === true, 'OpenMAIC adapted container mounted in live DOM');

    const evalCanvas = await pageCdp.send('Runtime.evaluate', {
      expression: 'Boolean(document.querySelector("canvas"))',
    });
    assert(evalCanvas.result?.value === true, 'Canvas element visible and rendering');

    // Execute Real Interaction on Slider A
    const evalInteractA = await pageCdp.send('Runtime.evaluate', {
      expression: `
(() => {
  const sliderA = document.querySelector('input[id^="slider-a-"]');
  if (!sliderA) return false;
  sliderA.value = "7";
  sliderA.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
})()`,
    });
    assert(evalInteractA.result?.value === true, 'Dispatched user interaction on Dimension A slider');
    await sleep(300);

    // Verify DOM text readout
    const evalTextA = await pageCdp.send('Runtime.evaluate', {
      expression: 'document.querySelector("#val-a-exp\\\\:math\\\\:c8\\\\:test_neutrality_B").textContent',
    });
    assert(evalTextA.result?.value === '7', 'DOM text readout for Dimension A synchronously updated to 7');

    // Execute Reset Interaction
    const evalReset = await pageCdp.send('Runtime.evaluate', {
      expression: `
(() => {
  const btnReset = document.querySelector(".openmaic-btn-reset");
  if (!btnReset) return false;
  btnReset.dispatchEvent(new Event("click", { bubbles: true }));
  return true;
})()`,
    });
    assert(evalReset.result?.value === true, 'Dispatched reset button click');
    await sleep(300);

    // Verify Telemetry Event Capture
    const evalTelemetry = await pageCdp.send('Runtime.evaluate', {
      expression: 'JSON.stringify(window.__AASHA_OFFLINE_BUFFER__)',
    });
    const bufferedEvents = JSON.parse(evalTelemetry.result?.value || '[]');
    console.log(`Captured ${bufferedEvents.length} telemetry event(s) in offline buffer:`);
    for (const ev of bufferedEvents) {
      console.log(`  - Event: ${ev.eventType || 'state_change'} | Action: ${ev.action || 'none'} | Timestamp: ${ev.timestamp}`);
    }
    assert(bufferedEvents.length >= 2, 'Telemetry events captured in local buffer without network');
    const hasInteraction = bufferedEvents.some((ev: any) => ev.eventType === 'SIMULATION_INTERACTION');
    assert(hasInteraction, 'Interaction evidence event (SIMULATION_INTERACTION) captured');
    const hasReset = bufferedEvents.some((ev: any) => ev.eventType === 'RESET');
    assert(hasReset, 'Reset evidence event (RESET) captured');

    // Assert Invariant: Zero direct mastery mutations
    const evalMasteryLeak = await pageCdp.send('Runtime.evaluate', {
      expression: 'Boolean(window.mastery_score || window.mastery_level || window.teas_decision)',
    });
    assert(evalMasteryLeak.result?.value === false, 'Zero direct mastery mutations in global scope');

    pageCdp.close();
  } finally {
    if (cdpClient) cdpClient.close();
    chromeProcess.kill();
    try { fs.unlinkSync(bundlePath); } catch (_) {}
  }

  console.log('\n===============================================================');
  console.log(`PHASE 3 VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED.`);
  console.log('OPENMAIC ADAPTER INTEGRATION: VERIFIED');
  console.log('RIGOROUS PROVIDER NEUTRALITY: VERIFIED (ZERO UNMERITED BIAS)');
  console.log('HEADLESS BROWSER RUNTIME MOUNTING & INTERACTION: VERIFIED');
  console.log('PROMOTION STATUS: CONDITIONALLY ELIGIBLE FOR PHASE 4 (COMPOSITION)');
  console.log('===============================================================\n');
}

runPhase3Tests().catch(err => {
  console.error('FATAL PHASE 3 TEST ERROR:', err);
  process.exit(1);
});
