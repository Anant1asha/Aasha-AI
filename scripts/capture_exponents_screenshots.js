const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const HTTP_PORT = 8110;
const CDP_PORT = 9224;
const ARTIFACT_DIR = "C:\\Users\\admin\\.gemini\\antigravity\\brain\\54bca614-eb12-4ac4-aa30-7814b9cae4d4";
const CHAPTER_PATH = path.resolve(__dirname, '../chapters/ExponentsPowers_Class8_Gamified_v5_Enhanced_v6.html');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
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
    await new Promise((res, rej) => {
      this.ws.onopen = res;
      this.ws.onerror = rej;
    });
    this.ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
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
    const wrapped = `(() => {\n${expression}\n})()`;
    const res = await this.send('Runtime.evaluate', { expression: wrapped, returnByValue: true, awaitPromise: true });
    if (res && res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text || 'Evaluation error');
    }
    return res && res.result ? res.result.value : undefined;
  }

  async screenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`[SCREENSHOT CAPTURED]: ${filename} (${buffer.length} bytes) -> ${outPath}`);
    return outPath;
  }

  close() { if (this.ws) this.ws.close(); }
}

async function main() {
  console.log('=== AASHA AIOS — EXONENTS & POWERS SCREENSHOT CAPTURE PIPELINE ===');

  // 1. Start HTTP Server
  const server = http.createServer((req, res) => {
    if (fs.existsSync(CHAPTER_PATH)) {
      const content = fs.readFileSync(CHAPTER_PATH);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    } else {
      res.writeHead(404);
      res.end('Chapter HTML not found');
    }
  });

  await new Promise(res => server.listen(HTTP_PORT, '127.0.0.1', res));
  console.log(`1. HTTP Server active at http://127.0.0.1:${HTTP_PORT}`);

  // 2. Launch Chrome
  const tmpDir = path.join(os.tmpdir(), `chrome-shots-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${tmpDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--remote-allow-origins=*',
    `http://127.0.0.1:${HTTP_PORT}`
  ]);

  let version = null;
  for (let i = 0; i < 25; i++) {
    await sleep(400);
    try {
      version = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (version) break;
    } catch(e) {}
  }
  if (!version) {
    chromeProc.kill();
    server.close();
    throw new Error('Chrome failed to start CDP listener');
  }

  const pages = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
  const pageTarget = pages.find(p => p.type === 'page') || pages[0];
  const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await client.connect();
  await client.send('Page.enable');
  await client.send('Runtime.enable');

  // Mobile viewport: Modern iPhone 390x844, 2x DPR
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  // Wait for App to mount
  console.log('2. Waiting for Chapter App to initialize...');
  let appReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      const ready = await client.eval(`return typeof window.App !== 'undefined' && typeof window.App.render === 'function';`);
      if (ready) {
        appReady = true;
        break;
      }
    } catch(e) {}
    await sleep(300);
  }

  if (!appReady) {
    throw new Error('App failed to initialize in time');
  }
  console.log('   ✓ Chapter App fully loaded and verified');

  // Milestone 1: Discovery & Concept Hook Card
  console.log('3. Capturing Milestone 1: Topbar & Concept Hook...');
  await client.eval(`
    localStorage.clear();
    window.App.exit();
    window.App.switchTab('concept');
    window.App.nIdx = 0;
    window.App.sIdx = 0;
    window.App.render();
  `);
  await sleep(600);
  await client.screenshot('screenshot_01_hook_discovery.png');

  // Milestone 2: Concept Simulation (Exponential Doubling & Sign Parity F02/F24)
  console.log('4. Capturing Milestone 2: Concept Simulation Interactive Manipulative...');
  await client.eval(`
    window.App.sIdx = 1;
    window.App.render();
    if (typeof window.App.setDoubling === 'function') {
      window.App.setDoubling(4, -1);
    }
  `);
  await sleep(600);
  await client.screenshot('screenshot_02_concept_simulation.png');

  // Milestone 3: LLE Bilingual Word-Tap Modal Opened
  console.log('5. Capturing Milestone 3: Bilingual Word-Tap Modal Dialog...');
  await client.eval(`
    if (typeof showWord === 'function') {
      showWord('negative');
    }
  `);
  await sleep(600);
  await client.screenshot('screenshot_03_bilingual_modal.png');

  // Close Dialog cleanly
  await client.eval(`
    const dlg = document.getElementById('wordDialog');
    if (dlg) {
      if (typeof dlg.close === 'function') dlg.close();
      dlg.style.display = 'none';
    }
  `);
  await sleep(300);

  // Milestone 4: Level 1 Warm-up Drills & 4-Tier Hint Drawer
  console.log('6. Capturing Milestone 4: Level 1 Warm-up Drills with Progressive Hint...');
  await client.eval(`
    window.App.switchTab('warmup');
    const sec = document.getElementById('section-warmup');
    if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
    if (typeof window.App.showNextHint === 'function') {
      window.App.showNextHint('ep_w_1');
    }
  `);
  await sleep(600);
  await client.screenshot('screenshot_04_warmup_hints.png');

  // Milestone 5: Level 2 Deep Dive Challenge & Instant Misconception Diagnostic
  console.log('7. Capturing Milestone 5: Level 2 Deep Dive Challenge Feedback...');
  await client.eval(`
    window.App.switchTab('deep_dive');
    const sec = document.getElementById('section-deep_dive');
    if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
    const firstOpt = document.querySelector('#ep_dd_1 .quiz-opt[data-correct="true"]');
    if (firstOpt) firstOpt.click();
    const card = document.getElementById('ep_dd_1');
    if (card) card.scrollIntoView({ behavior: 'instant', block: 'start' });
  `);
  await sleep(600);
  await client.screenshot('screenshot_05_deepdive_feedback.png');

  // Milestone 6: Level 3 Boss Arena & HOTS Master Challenge
  console.log('8. Capturing Milestone 6: Level 3 Boss Arena...');
  await client.eval(`
    window.App.switchTab('boss');
    const sec = document.getElementById('section-boss');
    if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
  `);
  await sleep(600);
  await client.screenshot('screenshot_06_boss_arena.png');

  client.close();
  chromeProc.kill();
  server.close();
  console.log('\n=== ALL 6 MILESTONE SCREENSHOTS CAPTURED SUCCESSFULLY ===');
}

main().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
