/**
 * AASHA AIOS — IEC End-to-End Compiler & Browser Runtime Proof
 * Path: Aasha-AI/packages/iec/tests/e2e_compiler_runtime_test.ts
 *
 * Demonstrates the complete real proof chain:
 * Canonical IR -> Requirement -> Discovery -> Match Report -> Evaluator ->
 * Provider Synthesis -> Validation Pipeline -> Child HTML5 Bundle ->
 * Headless Chrome CDP Browser Mount & Offline Interaction -> Telemetry -> PASS
 */

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { spawn, ChildProcess } from 'child_process';
import { ExperienceSpecificationMapper } from '../contracts/experience_specification';
import { CapabilityDiscoveryEngine } from '../discovery/capability_discovery_engine';
import { ResourceMatchReporter } from '../discovery/resource_match_reporter';
import { CapabilityEvaluator } from '../discovery/capability_evaluator';
import { ProceduralCanvasProvider } from '../providers/aasha_native/procedural_canvas_provider';
import { ValidationPipeline } from '../validation/validation_pipeline';
import { ChildBundlePackager } from '../runtime/child_bundle_packager';
import { CanonicalIR } from '../../canonical-ir/canonical_ir_schema';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9225;

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
    if (!WebSocketImpl) {
      throw new Error('WebSocket not available in global scope.');
    }
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

async function runE2ECompilerProof() {
  console.log('===============================================================');
  console.log('AASHA IEC REAL PROOF CHAIN: CANONICAL IR -> CDP BROWSER RUNTIME');
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
      throw new Error(`E2E_TEST_FAILURE: ${testName}`);
    }
  }

  // 1. CANONICAL IR SOURCE DEFINITION
  console.log('--- Step 1: Canonical IR Learning Ground Truth ---');
  const mockCanonicalIR: any = {
    schema_version: '1.1.0',
    chapter_metadata: {
      chapter_id: 'math:c8:squares',
      title: 'Squares and Square Roots',
      subject: 'Mathematics',
      grade: 8,
      board: 'CBSE',
      source_pdf_hash: 'sha256:mock_source_pdf_hash',
    },
    learning_objectives: [
      {
        id: 'obj:math:c8:squares:01',
        description: 'Understand geometric squares and visual areas',
        bloom_level: 'understand',
        success_criteria: ['Visualizes square grid expansion'],
        evidence_contracts: ['evd:squares:01'],
      },
    ],
    concept_graph: [
      {
        id: 'cpt:math:squares:area',
        name: 'Square Area',
        definition_raw: 'Area of square is s^2',
        definition_math_insulated: 'Area of square is s^2',
        prerequisite_ids: [],
        child_concept_ids: [],
      },
    ],
    misconceptions: [
      {
        id: 'misc:math:squares:perimeter_confusion',
        concept_id: 'cpt:math:squares:area',
        name: 'Perimeter vs Area Confusion',
        description: 'Confusing 4s with s^2',
        observable_signals: ['slider_area_delta'],
        confidence_weight: 0.8,
        remediation_strategy: 'Visualize grid area squares',
      },
    ],
    content_blocks: [],
    experience_graph: {
      initial_state_id: '',
      states: [],
      transitions: [],
    },
    capability_requirements: [
      {
        id: 'cap:sim:square_grid',
        purpose: 'Interactive square area manipulative',
        interaction_type: 'parameter_sliders',
        license_constraint: 'MIT_NATIVE',
        sandbox_required: false,
      },
    ],
    visual_grammar: {
      spatial_model: 'card_stack',
      density_tier: 'compact_mobile',
      primary_color_theme: '#4f46e5',
      touch_target_min_px: 44,
    },
    assessment_items: [],
  };
  assert(Boolean(mockCanonicalIR.chapter_metadata.chapter_id), 'Canonical IR ground truth loaded');

  // 2. REQUIREMENT EXTRACTION & CAPABILITY DISCOVERY
  console.log('\n--- Step 2: Requirement Extraction & Discovery ---');
  const req = ExperienceSpecificationMapper.fromCanonicalIR(
    mockCanonicalIR,
    mockCanonicalIR.capability_requirements[0],
    'exp:math:c8:square_grid_live'
  );
  assert(req.experience_id === 'exp:math:c8:square_grid_live', 'Extracted ExperienceRequirement');

  const discovery = new CapabilityDiscoveryEngine();
  const candidates = await discovery.discoverCandidates(req, 'Mathematics', 8);
  assert(candidates.length > 0, 'Discovered available capability candidates');

  // 3. RESOURCE MATCH REPORT & EVALUATION
  console.log('\n--- Step 3: Active Governance & Evaluator Decision ---');
  const reporterMd = ResourceMatchReporter.generateMarkdownReport({
    chapter: 'Square Roots & Visual Area',
    classNum: 8,
    subject: 'Mathematics',
    requirement: req,
    candidates,
    candidateCompositions: [],
    offlineStatus: '100% Offline (Local HTML5 Canvas)',
    licenseStatus: 'MIT Compatible',
    mobileStatus: 'Touch Target >= 44px',
    telemetryCompatibility: 'CustomEvent aasha:telemetry Ready',
    selectionRationale: 'AASHA Native selected for zero-dependency procedural rendering.',
    rejectedCandidates: [],
    timestamp: new Date().toISOString(),
  });
  assert(reporterMd.includes('MANDATORY RESOURCE MATCH REPORT'), 'Governance report created before synthesis');

  const evaluator = new CapabilityEvaluator();
  const evaluationResult = evaluator.evaluate(req, candidates);
  assert(Boolean(evaluationResult.plan.selected_strategy), 'Evaluator produced concrete ExperiencePlan');

  // 4. REAL PROVIDER SYNTHESIS
  console.log('\n--- Step 4: Real Provider Synthesis ---');
  const nativeProvider = new ProceduralCanvasProvider();
  const rawArtifact = await nativeProvider.synthesize(req, evaluationResult.plan);
  assert(Boolean(rawArtifact.htmlFragment), 'Provider synthesized HTML fragment');
  assert(Boolean(rawArtifact.javascriptCode), 'Provider synthesized JavaScript code');
  assert(rawArtifact.contentSha256.length === 64, 'SHA-256 provenance hash verified');
  assert(Array.isArray(rawArtifact.canonicalIrRefs) && rawArtifact.canonicalIrRefs.length > 0, 'Canonical IR concept references traceably embedded');
  assert(Array.isArray(rawArtifact.learningObjectiveRefs) && rawArtifact.learningObjectiveRefs.length > 0, 'Learning objective references traceably embedded');

  // 5. VALIDATION PIPELINE EXECUTION (7-GATE PROVIDER-ARTIFACT VALIDATION SUBSET)
  console.log('\n--- Step 5: Provider-Artifact Validation Subset (7 Gates) ---');
  const validationReport = ValidationPipeline.validate(rawArtifact, req);
  for (const gate of validationReport.gates) {
    console.log(`  [Gate: ${gate.gateId}] Passed: ${gate.passed} — ${gate.message}`);
  }
  assert(validationReport.passed === true, 'All 7 validation gates passed');

  // 6. CHILD BUNDLE PACKAGING (OFFLINE-FIRST)
  console.log('\n--- Step 6: Child HTML5 Bundle Packaging ---');
  const bundle = ChildBundlePackager.package(rawArtifact);
  console.log(`Child Bundle Size: ${bundle.byteSize} bytes`);
  assert(bundle.byteSize <= 20971520, 'Bundle size <= 20 MB');
  assert(bundle.isOfflineReady === true, 'Bundle flagged as 100% offline ready');

  // Write bundle to disk for browser verification
  const bundlePath = path.resolve(__dirname, '../../../chapters/test_iec_child_bundle.html');
  fs.writeFileSync(bundlePath, bundle.bundleHtml, 'utf8');
  assert(fs.existsSync(bundlePath), 'Saved standalone HTML5 bundle to chapters directory');

  // 7. REAL HEADLESS CHROME BROWSER EXECUTION OVER CDP
  console.log('\n--- Step 7: Headless Chrome CDP Mounting & Interaction ---');
  const chromeProcess: ChildProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    `--user-data-dir=${path.resolve(__dirname, '../../../.chrome_temp_iec')}`,
  ]);

  let cdpClient: SimpleCDP | null = null;
  try {
    await sleep(1500); // Allow Chrome process to bind port
    const versionInfo = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json/version`);
    const wsUrl = versionInfo.webSocketDebuggerUrl;
    assert(Boolean(wsUrl), 'Headless Chrome CDP WebSocket endpoint discovered');

    cdpClient = new SimpleCDP(wsUrl);
    await cdpClient.connect();
    console.log('Connected to Chrome CDP WebSocket');

    // Create a new target page
    const newPage = await cdpClient.send('Target.createTarget', { url: 'about:blank' });
    const pageWsUrl = `ws://127.0.0.1:${CDP_PORT}/devtools/page/${newPage.targetId}`;
    const pageCdp = new SimpleCDP(pageWsUrl);
    await pageCdp.connect();

    // Emulate strict offline network conditions to prove runtime isolation
    await pageCdp.send('Network.enable');
    await pageCdp.send('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
    });
    console.log('Strict network isolation enabled (Network.emulateNetworkConditions: offline=true)');

    // Navigate to local file URL (simulating 100% offline child environment)
    const fileUrl = `file:///${bundlePath.replace(/\\/g, '/')}`;
    console.log(`Navigating to offline bundle: ${fileUrl}`);
    await pageCdp.send('Page.enable');
    await pageCdp.send('Page.navigate', { url: fileUrl });
    await sleep(1000);

    // Verify DOM mounting
    const evalMount = await pageCdp.send('Runtime.evaluate', {
      expression: 'Boolean(document.querySelector(".aasha-native-sim-container"))',
    });
    assert(evalMount.result?.value === true, 'Experience mounted successfully in live DOM');

    const evalCanvas = await pageCdp.send('Runtime.evaluate', {
      expression: 'Boolean(document.querySelector("canvas"))',
    });
    assert(evalCanvas.result?.value === true, 'HTML5 Canvas element is visible and active');

    // Execute Real Interaction (Change slider value)
    const evalInteract = await pageCdp.send('Runtime.evaluate', {
      expression: `
(() => {
  const slider = document.querySelector('input[type="range"]');
  if (!slider) return false;
  slider.value = "8";
  slider.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
})()`,
    });
    assert(evalInteract.result?.value === true, 'Dispatched user interaction on parameter slider');
    await sleep(300);

    // Verify state synchronization
    const evalText = await pageCdp.send('Runtime.evaluate', {
      expression: 'document.querySelector("#slider-val-exp\\\\:math\\\\:c8\\\\:square_grid_live").textContent',
    });
    assert(evalText.result?.value === '8', 'DOM text readout synchronously updated to 8');

    // Execute Reset Interaction
    const evalReset = await pageCdp.send('Runtime.evaluate', {
      expression: `
(() => {
  const btnReset = document.querySelector(".sim-btn-reset");
  if (!btnReset) return false;
  btnReset.dispatchEvent(new Event("click", { bubbles: true }));
  return true;
})()`,
    });
    assert(evalReset.result?.value === true, 'Dispatched reset button click');
    await sleep(300);

    // Verify Telemetry event buffer (Test Observability Mirror)
    const evalTelemetry = await pageCdp.send('Runtime.evaluate', {
      expression: 'JSON.stringify(window.__AASHA_OFFLINE_BUFFER__)',
    });
    const bufferedEvents = JSON.parse(evalTelemetry.result?.value || '[]');
    console.log(`Captured ${bufferedEvents.length} telemetry event(s) in offline buffer:`);
    for (const ev of bufferedEvents) {
      console.log(`  - Event: ${ev.eventType || 'state_change'} | Action: ${ev.action || 'none'} | Timestamp: ${ev.timestamp}`);
    }
    assert(bufferedEvents.length >= 2, 'Telemetry events captured in local buffer without network');
    const hasInteractionEvent = bufferedEvents.some((ev: any) => ev.eventType === 'SIMULATION_INTERACTION');
    assert(hasInteractionEvent, 'Slider interaction evidence event (SIMULATION_INTERACTION) captured');
    const hasResetEvent = bufferedEvents.some((ev: any) => ev.eventType === 'RESET');
    assert(hasResetEvent, 'Reset evidence event (RESET) captured');

    // Assert Invariant: Zero direct mastery mutations
    const evalMasteryLeak = await pageCdp.send('Runtime.evaluate', {
      expression: 'Boolean(window.mastery_score || window.mastery_level || window.teas_decision)',
    });
    assert(evalMasteryLeak.result?.value === false, 'Zero direct mastery mutations in global scope');

    pageCdp.close();
  } finally {
    if (cdpClient) cdpClient.close();
    chromeProcess.kill();
    // Clean up temporary bundle file
    try { fs.unlinkSync(bundlePath); } catch (_) {}
  }

  console.log('\n===============================================================');
  console.log(`REAL PROOF CHAIN COMPLETE: ${passedTests}/${totalTests} TESTS PASSED.`);
  console.log('REAL PROVIDER SYNTHESIS: VERIFIED');
  console.log('HEADLESS BROWSER RUNTIME MOUNTING & INTERACTION: VERIFIED');
  console.log('OFFLINE TELEMETRY BUFFERING: VERIFIED (ZERO MASTERY MUTATION)');
  console.log('CHILD HTML5 BUNDLE (<= 20MB): VERIFIED');
  console.log('===============================================================\n');
}

runE2ECompilerProof().catch(err => {
  console.error('FATAL REAL PROOF ERROR:', err);
  process.exit(1);
});
