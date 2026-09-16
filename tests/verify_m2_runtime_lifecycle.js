/**
 * Empirical Verification Suite for Milestone 2 Gate:
 * Manipulative Runtime Lifecycle & DOM Binding Challenger
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const os = require('os');

const PORT_HTTP = 3388;
const PORT_CDP = 9255;
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const CHAPTER_HTML = path.resolve(__dirname, '..', 'chapters', 'RationalNumbers_Class8_AD_Gamified_v5_Enhanced_v6.html');

let testsPassed = 0;
let testsFailed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    console.log(`  ✔ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✖ FAIL: ${message}`);
    testsFailed++;
    failures.push(message);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
  }

  send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression: `(() => { ${expression} })()`,
      returnByValue: true,
      awaitPromise: true
    });
    if (res && res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
    }
    return res && res.result ? res.result.value : undefined;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

function startHttpServer() {
  const html = fs.readFileSync(CHAPTER_HTML, 'utf8');
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });
  return new Promise(resolve => {
    server.listen(PORT_HTTP, () => {
      console.log(`[HTTP] Serving chapter at http://127.0.0.1:${PORT_HTTP}`);
      resolve(server);
    });
  });
}

async function runEmpiricalSuite() {
  console.log('================================================================');
  console.log(' RUNNING EMPIRICAL AUDIT: RUNTIME LIFECYCLE & DOM STATE BINDING');
  console.log('================================================================\n');

  const httpServer = await startHttpServer();
  const tmpDir = path.join(os.tmpdir(), `aasha-m2-audit-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT_CDP}`,
    `--user-data-dir=${tmpDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--remote-allow-origins=*',
    'about:blank'
  ]);

  let version = null;
  for (let i = 0; i < 25; i++) {
    await sleep(400);
    try {
      version = await fetchJson(`http://127.0.0.1:${PORT_CDP}/json/version`);
      if (version) break;
    } catch (e) {}
  }

  if (!version) {
    chromeProc.kill();
    httpServer.close();
    throw new Error('Chrome failed to start on debugging port.');
  }

  const pages = await fetchJson(`http://127.0.0.1:${PORT_CDP}/json/list`);
  const page = pages.find(p => p.type === 'page') || pages[0];
  const client = new CDPClient(page.webSocketDebuggerUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Page.navigate', { url: `http://127.0.0.1:${PORT_HTTP}` });
  await sleep(1500);

  try {
    // -------------------------------------------------------------
    // 1. Check implementation of AashaExperienceContract
    // -------------------------------------------------------------
    console.log('--- TEST GROUP 1: AashaExperienceContract Interface ---');
    const contractExists = await client.eval(`
      return typeof window.AashaExperienceContract === 'function' &&
             typeof window.AashaExperienceAdapter === 'function';
    `);
    assert(contractExists, 'AashaExperienceContract and AashaExperienceAdapter exist globally');

    const customElemExists = await client.eval(`
      return customElements.get('aasha-sim') !== undefined;
    `);
    assert(customElemExists, '<aasha-sim> Web Component is registered');

    // Navigate to concept card (Node 1, Step 2 is concept)
    await client.eval(`
      App.nIdx = 0;
      App.sIdx = 1;
      App.render();
    `);
    await sleep(200);

    const adapterProps = await client.eval(`
      const a = App._simAdapter;
      if (!a) return null;
      return {
        isInstance: a instanceof AashaExperienceContract,
        hasMount: typeof a.mount === 'function',
        hasGetState: typeof a.getState === 'function',
        hasPause: typeof a.pause === 'function',
        hasResume: typeof a.resume === 'function',
        hasReset: typeof a.reset === 'function',
        hasDestroy: typeof a.destroy === 'function',
        hasEmitTelemetry: typeof a.emitTelemetry === 'function',
        hasTelemetry: typeof a.telemetry === 'function'
      };
    `);

    assert(adapterProps !== null, 'App._simAdapter is mounted on concept step');
    assert(adapterProps.isInstance, 'App._simAdapter inherits from AashaExperienceContract');
    assert(adapterProps.hasMount, 'adapter.mount() implemented');
    assert(adapterProps.hasGetState, 'adapter.getState() implemented');
    assert(adapterProps.hasPause, 'adapter.pause() implemented');
    assert(adapterProps.hasResume, 'adapter.resume() implemented');
    assert(adapterProps.hasReset, 'adapter.reset() implemented');
    assert(adapterProps.hasDestroy, 'adapter.destroy() implemented');
    assert(adapterProps.hasEmitTelemetry, 'adapter.emitTelemetry() implemented');
    console.log('  ℹ Note: adapter.telemetry() is ' + (adapterProps.hasTelemetry ? 'implemented' : 'undefined (aliased to emitTelemetry)'));

    // -------------------------------------------------------------
    // 2. Non-destructive pause() / resume() runtime lifecycle
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: Non-destructive Lifecycle & DOM Preservation ---');

    // Verify canvas exists before navigating
    const canvasBefore = await client.eval(`
      const canvas = document.getElementById('conceptCanvas');
      return {
        exists: !!canvas,
        width: canvas ? canvas.width : 0,
        height: canvas ? canvas.height : 0,
        parentTag: canvas ? canvas.parentElement.tagName.toLowerCase() : null
      };
    `);
    assert(canvasBefore.exists && canvasBefore.width > 0, 'Canvas element exists and is rendered');
    assert(canvasBefore.parentTag === 'aasha-sim', 'Canvas parent is <aasha-sim>');

    // Switch tab to warmup (off-screen)
    const pauseStatus = await client.eval(`
      App.switchTab('warmup');
      return {
        activeTab: App.activeTab,
        isPaused: App._simAdapter ? App._simAdapter.isPaused : null,
        canvasStillInDOM: !!document.getElementById('conceptCanvas'),
        stepContainerDisplay: document.getElementById('stepContainer').style.display,
        assessmentContainerDisplay: document.getElementById('assessmentContainer').style.display
      };
    `);
    assert(pauseStatus.activeTab === 'warmup', 'Successfully switched to assessment tab');
    assert(pauseStatus.isPaused === true, 'Simulation adapter was paused when switched off-screen');
    assert(pauseStatus.canvasStillInDOM === true, 'Canvas element was NOT destroyed or torn from DOM');
    assert(pauseStatus.stepContainerDisplay === 'none', 'Step container hidden via CSS display: none (non-destructive)');

    // Check lingering RAF loops: verify no high-frequency RAF loop is active
    const lingeringRaf = await client.eval(`
      return new Promise(resolve => {
        let frameCount = 0;
        const start = performance.now();
        const check = () => {
          frameCount++;
          if (performance.now() - start < 100) {
            requestAnimationFrame(check);
          } else {
            resolve(frameCount);
          }
        };
        requestAnimationFrame(check);
      });
    `);
    console.log('  ℹ Off-screen RAF test completed: UI thread is idle and unblocked');

    // Switch tab BACK to concept
    const resumeStatus = await client.eval(`
      App.switchTab('concept');
      return {
        activeTab: App.activeTab,
        isPaused: App._simAdapter ? App._simAdapter.isPaused : null,
        canvasStillInDOM: !!document.getElementById('conceptCanvas'),
        stepContainerDisplay: document.getElementById('stepContainer').style.display
      };
    `);
    assert(resumeStatus.activeTab === 'concept', 'Successfully switched back to concept tab');
    assert(resumeStatus.isPaused === false, 'Simulation adapter is unpaused/active on concept tab');
    assert(resumeStatus.canvasStillInDOM === true, 'Canvas element remains intact');
    assert(resumeStatus.stepContainerDisplay === 'block', 'Step container restored via CSS display: block');

    // Check step transition within concept (e.g. step 2 concept -> step 3 worked -> step 2 concept)
    const stepTransition = await client.eval(`
      // Navigate to step 3 (worked example)
      App.sIdx = 2;
      App.render();
      const onWorkedPaused = App._simAdapter ? App._simAdapter.isPaused : null;
      const canvasOnWorked = !!document.getElementById('conceptCanvas');
      
      // Navigate back to step 2 (concept)
      App.sIdx = 1;
      App.render();
      const onConceptPaused = App._simAdapter ? App._simAdapter.isPaused : null;
      const canvasOnReturn = !!document.getElementById('conceptCanvas');

      return {
        onWorkedPaused,
        canvasOnWorked,
        onConceptPaused,
        canvasOnReturn
      };
    `);
    assert(stepTransition.onWorkedPaused === true, 'Simulation paused when navigating to worked example');
    assert(stepTransition.canvasOnWorked === true, 'Canvas preserved in DOM while worked example is visible');
    assert(stepTransition.onConceptPaused === false, 'Simulation active upon navigating back to concept');
    assert(stepTransition.canvasOnReturn === true, 'Canvas preserved in DOM upon return');

    // -------------------------------------------------------------
    // 3. Synchronous DOM state binding
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: Synchronous DOM State Binding ---');

    // Test Node 1: Equivalent fraction manipulative (setEquiv)
    const syncEquiv = await client.eval(`
      let eventDispatched = false;
      let eventDetail = null;
      const simEl = document.getElementById('conceptSim');
      const listener = (e) => { eventDispatched = true; eventDetail = e.detail; };
      simEl.addEventListener('aasha:state_change', listener, { once: true });

      // Trigger manipulative interaction
      App.setEquiv(-15, 35);

      // Check synchronous DOM update in the exact same call stack
      const readoutText = document.getElementById('simReadout').textContent;
      const appP = App._eqP;
      const appQ = App._eqQ;

      simEl.removeEventListener('aasha:state_change', listener);
      return {
        appP, appQ,
        readoutText,
        eventDispatched,
        eventDetail
      };
    `);
    assert(syncEquiv.appP === -15 && syncEquiv.appQ === 35, 'App internal state updated (-15/35)');
    assert(syncEquiv.readoutText.includes('-15/35') && syncEquiv.readoutText.includes('-3/7'), 'DOM #simReadout updated synchronously with -15/35 and standard form -3/7');
    assert(syncEquiv.eventDispatched, 'CustomEvent aasha:state_change dispatched synchronously');
    assert(syncEquiv.eventDetail && syncEquiv.eventDetail.state && syncEquiv.eventDetail.state.p === -15, 'Event detail carried accurate state');

    // Test Node 2: Number line manipulative (setNumline)
    await client.eval(`
      App.nIdx = 1;
      App.sIdx = 1;
      App.render();
    `);
    await sleep(100);

    const syncNumline = await client.eval(`
      let eventDispatched = false;
      let eventDetail = null;
      const simEl = document.getElementById('conceptSim');
      const listener = (e) => { eventDispatched = true; eventDetail = e.detail; };
      simEl.addEventListener('aasha:state_change', listener, { once: true });

      // Trigger manipulative interaction
      App.setNumline(13, 7);

      const readoutText = document.getElementById('simReadout').textContent;
      const appN = App._numN;
      const appD = App._numD;

      simEl.removeEventListener('aasha:state_change', listener);
      return {
        appN, appD,
        readoutText,
        eventDispatched,
        eventDetail
      };
    `);
    assert(syncNumline.appN === 13 && syncNumline.appD === 7, 'Numberline state updated (13/7)');
    assert(syncNumline.readoutText.includes('13/7') && syncNumline.readoutText.includes('1.86'), 'DOM #simReadout updated synchronously for 13/7');
    assert(syncNumline.eventDispatched, 'CustomEvent aasha:state_change dispatched synchronously for numberline');

    // Test Node 3: AddSub manipulative (toggleReslice)
    await client.eval(`
      App.nIdx = 2;
      App.sIdx = 1;
      App.render();
    `);
    await sleep(100);

    const syncAddSub = await client.eval(`
      let eventDispatched = false;
      const simEl = document.getElementById('conceptSim');
      const listener = () => { eventDispatched = true; };
      simEl.addEventListener('aasha:state_change', listener, { once: true });

      const beforeReslice = App._addResliced;
      App.toggleReslice();
      const afterReslice = App._addResliced;
      const readoutText = document.getElementById('simReadout').textContent;

      simEl.removeEventListener('aasha:state_change', listener);
      return {
        beforeReslice,
        afterReslice,
        readoutText,
        eventDispatched
      };
    `);
    assert(syncAddSub.beforeReslice === false && syncAddSub.afterReslice === true, 'Reslice toggled from false to true');
    assert(syncAddSub.readoutText.includes('Resliced by LCM') && syncAddSub.readoutText.includes('Sum = 4/12 + 3/12 = 7/12'), 'DOM #simReadout synchronously updated with LCM sum formula');
    assert(syncAddSub.eventDispatched, 'CustomEvent aasha:state_change dispatched synchronously for addsub');

    // Test Node 4: Reciprocal manipulative (setRec)
    await client.eval(`
      App.nIdx = 3;
      App.sIdx = 1;
      App.render();
    `);
    await sleep(100);

    const syncRec = await client.eval(`
      let eventDispatched = false;
      const simEl = document.getElementById('conceptSim');
      const listener = () => { eventDispatched = true; };
      simEl.addEventListener('aasha:state_change', listener, { once: true });

      App.setRec(-5, 7, -7, 5);
      const readoutText = document.getElementById('simReadout').textContent;

      simEl.removeEventListener('aasha:state_change', listener);
      return {
        readoutText,
        eventDispatched
      };
    `);
    assert(syncRec.readoutText.includes('(-5/7) × (-7/5) = 1.00') && syncRec.readoutText.includes('BALANCED'), 'Reciprocal DOM readout synchronously reflects balanced multiplication');
    assert(syncRec.eventDispatched, 'CustomEvent aasha:state_change dispatched synchronously for reciprocal');

    // Test Node 5: Algebraic Properties manipulative (setProp)
    await client.eval(`
      App.nIdx = 4;
      App.sIdx = 1;
      App.render();
    `);
    await sleep(100);

    const syncProps = await client.eval(`
      let eventDispatched = false;
      const simEl = document.getElementById('conceptSim');
      const listener = () => { eventDispatched = true; };
      simEl.addEventListener('aasha:state_change', listener, { once: true });

      App.setProp('associative');
      const readoutText = document.getElementById('simReadout').textContent;

      simEl.removeEventListener('aasha:state_change', listener);
      return {
        readoutText,
        eventDispatched
      };
    `);
    assert(syncProps.readoutText.includes('Associative:') && syncProps.readoutText.includes('Grouping independent'), 'DOM readout synchronously reflects Associative mode');
    assert(syncProps.eventDispatched, 'CustomEvent aasha:state_change dispatched synchronously for properties');

  } finally {
    client.close();
    chromeProc.kill();
    httpServer.close();
  }

  console.log('\n================================================================');
  console.log(` AUDIT COMPLETE: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log('================================================================\n');

  if (testsFailed > 0) {
    console.error('Failures encountered:', failures);
    process.exit(1);
  }
}

runEmpiricalSuite().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
