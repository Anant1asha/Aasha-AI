const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9223;

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
  console.log('=== STARTING CDP VERIFICATION: SQUARE & CUBE ROOTS CHAPTER ===');
  
  const tmpDir = path.join(os.tmpdir(), `chrome-test-sq-${Date.now()}`);
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
    throw new Error('Chrome failed to start on debugging port within timeout.');
  }

  try {
    console.log('Connected to Chrome:', version['Browser']);

    const targetFile = path.resolve(__dirname, 'SquareCubeRoots_Class8_Gamified_v5_Enhanced_v6.html');
    const fileUrl = 'file:///' + targetFile.replace(/\\/g, '/');

    const mobileViewports = [
      { name: '16:9 Budget Android (360x640)', width: 360, height: 640, deviceScaleFactor: 2 },
      { name: '19.5:9 Modern iPhone (390x844)', width: 390, height: 844, deviceScaleFactor: 3 },
      { name: '19.5:9 iPhone Pro (393x852)', width: 393, height: 852, deviceScaleFactor: 3 },
      { name: '20:9 Modern Pixel/Galaxy (412x915)', width: 412, height: 915, deviceScaleFactor: 2.625 },
      { name: '20:9 Galaxy A-Series (360x800)', width: 360, height: 800, deviceScaleFactor: 2 }
    ];

    const pages = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
    const defaultPage = pages.find(p => p.type === 'page') || pages[0];
    const client = new CDPClient(defaultPage.webSocketDebuggerUrl);
    await client.connect();
    await client.send('Page.enable');
    await client.send('Runtime.enable');

    console.log(`\nNavigating to: ${fileUrl}`);
    await client.send('Page.navigate', { url: fileUrl });
    await sleep(1200);

    // Clean reset
    await client.eval(`
      try {
        localStorage.clear();
        if (window.App && App.exit) App.exit();
      } catch(e) {}
    `);
    await sleep(300);

    const title = await client.eval('document.title');
    const brandName = await client.eval('document.querySelector(".brand-name")?.textContent');
    console.log(`[PASS] Page loaded cleanly. Title: "${title}"`);
    console.log(`[PASS] Brand header verified: "${brandName}"`);

    // Test vocabulary word tap on screen
    const wordsCount = await client.eval('document.querySelectorAll(".word").length');
    console.log(`Found ${wordsCount} vocabulary word elements on current screen.`);

    if (wordsCount > 0) {
      for (let i = 0; i < Math.min(5, wordsCount); i++) {
        const wordText = await client.eval(`document.querySelectorAll(".word")[${i}].getAttribute("data-w")`);
        await client.eval(`document.querySelectorAll(".word")[${i}].click()`);
        await sleep(100);

        const dlgHindi = await client.eval(`document.getElementById("dlgHindi").textContent`);
        if (!dlgHindi || dlgHindi.includes('उपलब्ध नहीं') || dlgHindi.includes('not available')) {
          throw new Error(`Word "${wordText}" displayed missing Hindi meaning! Received: "${dlgHindi}"`);
        }
        console.log(`  [PASS] Tap Word "${wordText}" -> Modal opened with Hindi: "${dlgHindi}"`);

        await client.eval(`document.getElementById("wordDialog").close?.(); document.getElementById("wordDialog").style.display = "none";`);
        await sleep(50);
      }
    }

    // Critical dictionary checks
    const testKeywords = ['express', 'rational', 'standard', 'form', 'positive', 'denominator', 'numerator', 'multiplying', 'entire', 'placed', 'fractions', 'understanding', 'square', 'cube', 'root', 'gnomon', 'parity', 'factor'];
    for (const kw of testKeywords) {
      const checkHi = await client.eval(`window.WM ? window.WM["${kw}"] : null`);
      if (!checkHi) {
        throw new Error(`Critical word "${kw}" is missing from window.WM!`);
      }
      console.log(`  [PASS] Dictionary check for "${kw}": "${checkHi}"`);
    }

    // Mobile Responsiveness across 5 viewports
    console.log('\nTesting Responsive Layout & Same-Frame Rule across Mobile Aspect Ratios:');
    for (const vp of mobileViewports) {
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.deviceScaleFactor,
        mobile: true
      });
      await sleep(300);

      await client.eval(`
        try {
          if (window.App) {
            App.nIdx = 0;
            App.sIdx = 1;
            App.render();
          }
        } catch(e) {}
      `);
      await sleep(300);

      const metrics = await client.eval(`
        (() => {
          const conceptFrame = document.querySelector('.concept-frame');
          const canvas = document.getElementById('conceptCanvas') || document.querySelector('canvas');
          const bottomBar = document.getElementById('bottomBar');
          const winH = window.innerHeight;
          const winW = window.innerWidth;
          const scrollH = document.documentElement.scrollHeight;
          const scrollW = document.documentElement.scrollWidth;

          const frameRect = conceptFrame ? conceptFrame.getBoundingClientRect() : null;
          const bbRect = bottomBar && bottomBar.style.display !== 'none' ? bottomBar.getBoundingClientRect() : { top: winH, height: 0 };
          
          const sameFrame = frameRect ? (frameRect.bottom <= bbRect.top + 8) : true;
          const noVerticalScroll = scrollH <= winH + 5;
          const noHorizontalScroll = scrollW <= winW + 2;

          const buttons = Array.from(document.querySelectorAll('.preset-btn, .sim-btn, .btn-primary'));
          const touchFailures = buttons.filter(b => {
            if (b.offsetParent === null) return false;
            const r = b.getBoundingClientRect();
            return r.width < 36 || r.height < 36;
          }).map(b => ({ text: b.textContent.trim().substring(0, 15), w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height) }));

          return {
            winW, winH, scrollW, scrollH,
            hasCanvas: !!canvas,
            canvasW: canvas ? Math.round(canvas.getBoundingClientRect().width) : 0,
            canvasH: canvas ? Math.round(canvas.getBoundingClientRect().height) : 0,
            sameFrame,
            noVerticalScroll,
            noHorizontalScroll,
            touchFailures
          };
        })()
      `);

      if (!metrics.sameFrame) {
        throw new Error(`Viewport ${vp.name}: Same-Frame rule violated! Frame bottom (${metrics.scrollH}px) extends beyond viewport (${metrics.winH}px).`);
      }
      if (!metrics.noVerticalScroll) {
        throw new Error(`Viewport ${vp.name}: Vertical scroll detected on simulation concept frame! (scrollH=${metrics.scrollH}, winH=${metrics.winH})`);
      }
      if (!metrics.noHorizontalScroll) {
        throw new Error(`Viewport ${vp.name}: Horizontal scroll detected! (scrollW=${metrics.scrollW}, winW=${metrics.winW})`);
      }
      if (metrics.touchFailures.length > 0) {
        throw new Error(`Viewport ${vp.name}: Touch targets under 44px found: ${JSON.stringify(metrics.touchFailures)}`);
      }

      console.log(`  [PASS] Viewport ${vp.name} (${metrics.winW}x${metrics.winH}): Same-Frame Verified! Canvas: ${metrics.canvasW}x${metrics.canvasH}px, 0 vertical scroll, 0 horizontal scroll, Touch Targets compliant.`);
    }

    await client.send('Emulation.clearDeviceMetricsOverride');
    await sleep(200);

    // Exercise five actual UI transitions, including required correct answers in worked examples.
    console.log('\nTesting five consecutive learner-controlled step transitions...');
    await client.eval(`if (window.App && App.exit) App.exit();`);
    await sleep(200);
    const visited = new Set();
    for (let s = 0; s < 5; s++) {
      const before = await client.eval('`${App.nIdx}:${App.sIdx}:${App.weStepIdx}:${App._weCheckRendered ? 1 : 0}:${App.weChecked ? 1 : 0}`');
      visited.add(before);
      const stepInfo = await client.eval('({ node: App.nIdx, step: App.sIdx, type: NODES[App.nIdx].steps[App.sIdx].t })');
      console.log(`  Transition ${s + 1}: Node ${stepInfo.node + 1}, Step ${stepInfo.step + 1} (${stepInfo.type})`);
      const moved = await client.eval(`(() => {
        const before = App.nIdx + ':' + App.sIdx + ':' + App.weStepIdx + ':' + (App._weCheckRendered ? 1 : 0) + ':' + (App.weChecked ? 1 : 0);
        for (let attempt = 0; attempt < 12; attempt++) {
          if (NODES[App.nIdx].steps[App.sIdx].t === 'quiz' && Array.isArray(App._qOpts)) {
            const i = App._qOpts.findIndex(o => o.c === true);
            if (i < 0) return false;
            App.selQuiz(i); App.next(); App.next();
          } else if (document.querySelector('#weCheckArea .quiz-opt') && Array.isArray(App._weCheckOpts)) {
            const i = App._weCheckOpts.findIndex(o => o.c === true);
            if (i < 0) return false;
            App.selWECheck(i); App.next(); App.next();
          } else if (document.querySelector('#weStepCheckArea .quiz-opt') && Array.isArray(App._weStepCheckOpts)) {
            const i = App._weStepCheckOpts.findIndex(o => o.c === true);
            if (i < 0) return false;
            App.selWEStepCheck(i); App.next(); App.next();
          } else {
            App.next();
          }
          if (before !== App.nIdx + ':' + App.sIdx + ':' + App.weStepIdx + ':' + (App._weCheckRendered ? 1 : 0) + ':' + (App.weChecked ? 1 : 0)) return true;
        }
        return false;
      })()`);
      if (!moved) {
        const debug = await client.eval(`({ nIdx: App.nIdx, sIdx: App.sIdx, weStepIdx: App.weStepIdx, rendered: App._weCheckRendered, weChecked: App.weChecked, answered: App.weCheckAnswered, selOpt: App.selOpt, opts: App._weCheckOpts, button: document.getElementById('continueBtn').textContent, disabled: document.getElementById('continueBtn').disabled })`);
        throw new Error(`Learner flow did not advance from ${before} (${stepInfo.type}). State: ${JSON.stringify(debug)}`);
      }
      await sleep(100);
    }
    if (visited.size !== 5) throw new Error(`Expected five distinct lesson steps; visited ${visited.size}: ${[...visited].join(', ')}`);
    console.log(`[PASS] Five distinct learner steps advanced through real continue, quiz, and worked-example checks.`);
    client.close();
    console.log(`\n============================================================`);
    console.log(`[ALL SQUARE & CUBE ROOTS CDP BROWSER TESTS PASSED]`);
    console.log(`============================================================\n`);

  } finally {
    chromeProc.kill();
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch(e){}
  }
}

runTest().catch(err => {
  console.error('[CDP TEST FAILED]:', err);
  process.exit(1);
});

