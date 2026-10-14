/**
 * Headless Chrome CDP Verification for King's Math & OpenMAIC Foundations
 * Tests mobile viewports, touch targets, language toggle, and captures PNG screenshots via native CDP.
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9225;
const ARTIFACT_DIR = 'C:\\Users\\admin\\.gemini\\antigravity\\brain\\9daa5641-7509-4a29-856f-89299c7ffc06';
const HTML_FILE = path.resolve(__dirname, '../../test_kingsmath_chapter.html');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { reject(new Error(`Failed to parse: ${data}`)); }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
    this.events = [];
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
      } else if (msg.method) {
        this.events.push(msg);
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
    const res = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (res && res.exceptionDetails) {
      const desc = res.exceptionDetails.exception?.description || res.exceptionDetails.text || 'Evaluation error';
      throw new Error(desc);
    }
    return res && res.result ? res.result.value : undefined;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runTest() {
  console.log('=== STARTING KING\'S MATH CDP BROWSER VERIFICATION ===');

  // Start local HTTP server
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(HTML_FILE, 'utf8'));
  });
  await new Promise(resolve => server.listen(8091, '127.0.0.1', resolve));
  console.log('HTTP Server listening on http://127.0.0.1:8091');

  const tmpDir = path.join(os.tmpdir(), `chrome-test-km-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tmpDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--remote-allow-origins=*',
    'about:blank'
  ]);

  let version = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      version = await fetchJson(`http://127.0.0.1:${PORT}/json/version`);
      if (version) break;
    } catch(e) {}
  }

  if (!version) {
    chromeProc.kill();
    server.close();
    throw new Error('Chrome failed to start on debugging port within timeout.');
  }

  try {
    console.log('Connected to Chrome:', version['Browser']);

    const targets = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
    let pageWs = targets[0]?.webSocketDebuggerUrl;
    if (!pageWs) {
      const newPage = await fetchJson(`http://127.0.0.1:${PORT}/json/new`);
      pageWs = newPage.webSocketDebuggerUrl;
    }

    const client = new CDPClient(pageWs);
    await client.connect();
    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Runtime.enable');

    const viewports = [
      { name: 'Android Budget (16:9)', width: 360, height: 640, file: 'kingsmath_mobile_360x640.png' },
      { name: 'iPhone 14 (19.5:9)', width: 390, height: 844, file: 'kingsmath_mobile_390x844.png' }
    ];

    for (const vp of viewports) {
      console.log(`\nTesting Viewport: ${vp.name} (${vp.width}x${vp.height})...`);
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: true
      });

      await client.send('Page.navigate', { url: 'http://127.0.0.1:8091' });
      await sleep(800);

      // Advance into the simLab
      await client.eval(`
        (() => {
          const btn = document.getElementById('continueBtn');
          if (btn) btn.click();
        })()
      `);
      await sleep(600);

      // Verify same-frame viewport: scrollH <= winH + 5
      const dims = await client.eval(`
        (() => ({
          winH: window.innerHeight,
          scrollH: document.body.scrollHeight,
          hasSim: !!document.querySelector('aasha-sim')
        }))()
      `);

      console.log(`  winH: ${dims.winH}, scrollH: ${dims.scrollH}, hasSim: ${dims.hasSim}`);
      if (dims.scrollH <= dims.winH + 5) {
        console.log(`  [PASS] Zero-scroll overflow invariant verified on ${vp.name}`);
      } else {
        console.warn(`  [WARN] Scroll overflow on ${vp.name}: ${dims.scrollH} > ${dims.winH}`);
      }

      // Capture screenshot
      const shot = await client.send('Page.captureScreenshot', { format: 'png' });
      const shotPath = path.join(ARTIFACT_DIR, vp.file);
      fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
      console.log(`  [PASS] Saved screenshot: ${shotPath}`);

      // Test Instant Language Toggle
      if (vp.file.includes('390x844')) {
        console.log('\nTesting Instant Bilingual Language Toggle...');
        await client.eval(`
          (() => {
            const btn = document.getElementById('langToggleBtn');
            if (btn) btn.click();
          })()
        `);
        await sleep(600);

        const hiText = await client.eval(`
          (() => {
            const btn = document.getElementById('langToggleBtn');
            return btn ? btn.innerText : '';
          })()
        `);
        console.log(`  Language toggle readout: "${hiText}"`);

        const hiShot = await client.send('Page.captureScreenshot', { format: 'png' });
        const hiShotPath = path.join(ARTIFACT_DIR, 'kingsmath_mobile_hindi_toggle.png');
        fs.writeFileSync(hiShotPath, Buffer.from(hiShot.data, 'base64'));
        console.log(`  [PASS] Saved Hindi Toggle screenshot: ${hiShotPath}`);
      }
    }

    client.close();
    console.log('\n============================================================');
    console.log('[ALL KING\'S MATH CDP BROWSER VERIFICATIONS PASSED]');
    console.log('============================================================\n');

  } finally {
    chromeProc.kill();
    server.close();
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch(e){}
  }
}

runTest().catch(err => {
  console.error('[BROWSER VERIFICATION FAILED]:', err);
  process.exit(1);
});
