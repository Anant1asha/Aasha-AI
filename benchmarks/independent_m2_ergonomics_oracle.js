const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9223; // use alternate port to avoid conflict

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

async function runErgonomicsOracle() {
  console.log('=== STARTING INDEPENDENT M2 ERGONOMICS & VIEWPORT ORACLE ===');

  const tmpDir = path.join(os.tmpdir(), `chrome-m2-${Date.now()}`);
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

  const results = {
    viewports: {},
    touchTargets: {},
    bottomBar: {},
    stepFrameMetrics: []
  };

  try {
    const pages = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
    const defaultPage = pages.find(p => p.type === 'page') || pages[0];
    const client = new CDPClient(defaultPage.webSocketDebuggerUrl);
    await client.connect();
    await client.send('Page.enable');
    await client.send('Runtime.enable');

    const targetFile = 'c:/Users/admin/Downloads/NGO AI LLM/Aasha-AI/chapters/RationalNumbers_Class8_AD_Gamified_v5_Enhanced_v6.html';
    const fileUrl = 'file:///' + targetFile.replace(/\\/g, '/');

    const viewports = [
      { id: '16_9', name: '16:9 Budget Android (360x640)', width: 360, height: 640, deviceScaleFactor: 2 },
      { id: '19_5_9_base', name: '19.5:9 Modern iPhone (390x844)', width: 390, height: 844, deviceScaleFactor: 3 },
      { id: '19_5_9_pro', name: '19.5:9 iPhone Pro (393x852)', width: 393, height: 852, deviceScaleFactor: 3 },
      { id: '20_9_pixel', name: '20:9 Modern Pixel/Galaxy (412x915)', width: 412, height: 915, deviceScaleFactor: 2.625 },
      { id: '20_9_galaxy_a', name: '20:9 Galaxy A-Series (360x800)', width: 360, height: 800, deviceScaleFactor: 2 }
    ];

    for (const vp of viewports) {
      console.log(`\n======================================================`);
      console.log(`Testing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`======================================================`);

      await client.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.deviceScaleFactor,
        mobile: true
      });
      await sleep(200);

      await client.send('Page.navigate', { url: fileUrl });
      await sleep(1000);

      // Clean reset
      await client.eval(`
        try {
          localStorage.clear();
          if (window.App && App.exit) App.exit();
        } catch(e) {}
      `);
      await sleep(300);

      // 1. Check same-frame rule on Concept + Sim screen (Node 0, Step 1)
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

      const frameMetrics = await client.eval(`
        (() => {
          const winH = window.innerHeight;
          const winW = window.innerWidth;
          const scrollH = document.documentElement.scrollHeight;
          const scrollW = document.documentElement.scrollWidth;
          const conceptFrame = document.querySelector('.concept-frame');
          const bottomBar = document.getElementById('bottomBar');
          const frameRect = conceptFrame ? conceptFrame.getBoundingClientRect() : null;
          const bbRect = bottomBar && bottomBar.style.display !== 'none' ? bottomBar.getBoundingClientRect() : { top: winH, height: 0 };
          
          return {
            winW, winH, scrollW, scrollH,
            sameFrame: frameRect ? (frameRect.bottom <= bbRect.top + 8) : true,
            frameBottom: frameRect ? frameRect.bottom : 0,
            bbTop: bbRect.top,
            diff: scrollH - winH
          };
        })()
      `);

      console.log(`Same-Frame Status: winH=${frameMetrics.winH}, scrollH=${frameMetrics.scrollH}, diff=${frameMetrics.diff}px`);
      console.log(`frameBottom=${frameMetrics.frameBottom}, bbTop=${frameMetrics.bbTop}, sameFrame=${frameMetrics.sameFrame}`);

      // 2. Touch targets measurement on this viewport
      const touchData = await client.eval(`
        (() => {
          function getBox(el) {
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return {
              tag: el.tagName,
              cls: el.className,
              text: (el.textContent || '').trim().substring(0, 20),
              w: Math.round(r.width * 100) / 100,
              h: Math.round(r.height * 100) / 100,
              isGe44: (r.width >= 43.5 && r.height >= 43.5) // allow 0.5px subpixel rounding
            };
          }

          // exit-btn
          const exitBtn = getBox(document.querySelector('.exit-btn'));

          // sim-btn and preset-btn
          const simBtns = Array.from(document.querySelectorAll('.sim-btn')).map(getBox);
          const presetBtns = Array.from(document.querySelectorAll('.preset-btn')).map(getBox);

          // btn-back (may be hidden, so check computed min-width and min-height)
          const backBtnEl = document.querySelector('.btn-back');
          const backComputed = backBtnEl ? {
            minWidth: window.getComputedStyle(backBtnEl).minWidth,
            minHeight: window.getComputedStyle(backBtnEl).minHeight,
            padding: window.getComputedStyle(backBtnEl).padding
          } : null;

          // temporarily display backBtn to measure box
          let backBtnBox = null;
          if (backBtnEl) {
            const origDisp = backBtnEl.style.display;
            backBtnEl.style.display = 'inline-block';
            backBtnBox = getBox(backBtnEl);
            backBtnEl.style.display = origDisp;
          }

          return {
            exitBtn,
            simBtns,
            presetBtns,
            backBtnBox,
            backComputed
          };
        })()
      `);

      // 3. Open #wordDialog by clicking first word and measure dialog buttons
      await client.eval(`
        (() => {
          const w = document.querySelector('.word');
          if (w) w.click();
        })()
      `);
      await sleep(150);

      const dialogTouchData = await client.eval(`
        (() => {
          function getBox(el) {
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return {
              tag: el.tagName,
              cls: el.className,
              text: (el.textContent || '').trim().substring(0, 20),
              w: Math.round(r.width * 100) / 100,
              h: Math.round(r.height * 100) / 100,
              isGe44: (r.width >= 43.5 && r.height >= 43.5)
            };
          }

          const closeX = getBox(document.querySelector('.dlg-close-x'));
          const audioBtn = getBox(document.querySelector('.dlg-audio-btn'));
          const dlgBtn = getBox(document.querySelector('.dlg-btn'));

          const closeXComp = document.querySelector('.dlg-close-x') ? {
            minWidth: window.getComputedStyle(document.querySelector('.dlg-close-x')).minWidth,
            minHeight: window.getComputedStyle(document.querySelector('.dlg-close-x')).minHeight
          } : null;

          const audioComp = document.querySelector('.dlg-audio-btn') ? {
            minWidth: window.getComputedStyle(document.querySelector('.dlg-audio-btn')).minWidth,
            minHeight: window.getComputedStyle(document.querySelector('.dlg-audio-btn')).minHeight
          } : null;

          return { closeX, audioBtn, dlgBtn, closeXComp, audioComp };
        })()
      `);

      // Close dialog
      await client.eval(`
        (() => {
          const dlg = document.getElementById('wordDialog');
          if (dlg) { dlg.close?.(); dlg.style.display = 'none'; }
        })()
      `);
      await sleep(100);

      // 4. Inspect bottom-bar styling & safe-area padding
      const bottomBarData = await client.eval(`
        (() => {
          const bb = document.getElementById('bottomBar');
          if (!bb) return null;
          const style = window.getComputedStyle(bb);
          const screenEl = document.getElementById('screen');
          const screenStyle = screenEl ? window.getComputedStyle(screenEl) : null;
          return {
            backgroundColor: style.backgroundColor,
            backdropFilter: style.backdropFilter || style.webkitBackdropFilter,
            boxShadow: style.boxShadow,
            position: style.position,
            zIndex: style.zIndex,
            padding: style.padding,
            paddingBottom: style.paddingBottom,
            screenPaddingBottom: screenStyle ? screenStyle.paddingBottom : null
          };
        })()
      `);

      console.log('Touch targets:');
      console.log('  .exit-btn:', touchData.exitBtn);
      console.log('  .dlg-close-x:', dialogTouchData.closeX);
      console.log('  .dlg-audio-btn:', dialogTouchData.audioBtn);
      console.log('  .btn-back:', touchData.backBtnBox);
      console.log('  .preset-btn samples:', touchData.presetBtns.slice(0, 2));
      console.log('  .sim-btn samples:', touchData.simBtns.slice(0, 2));
      console.log('Bottom Bar:');
      console.log('  backgroundColor:', bottomBarData.backgroundColor);
      console.log('  backdropFilter:', bottomBarData.backdropFilter);
      console.log('  paddingBottom:', bottomBarData.paddingBottom);
      console.log('  screenPaddingBottom:', bottomBarData.screenPaddingBottom);

      results.viewports[vp.id] = {
        name: vp.name,
        sameFrame: frameMetrics.sameFrame,
        diff: frameMetrics.diff,
        scrollH: frameMetrics.scrollH,
        winH: frameMetrics.winH,
        exitBtn: touchData.exitBtn,
        closeX: dialogTouchData.closeX,
        audioBtn: dialogTouchData.audioBtn,
        backBtn: touchData.backBtnBox,
        presetBtns: touchData.presetBtns,
        simBtns: touchData.simBtns,
        bottomBar: bottomBarData
      };
    }

    // 5. Test all 5 nodes and all steps within nodes for scrollH <= winH + 5 on standard 360x640 (budget)
    console.log(`\n======================================================`);
    console.log(`Checking All Concept Nodes & Steps on 16:9 Budget (360x640)`);
    console.log(`======================================================`);
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 360,
      height: 640,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sleep(200);

    const stepResults = await client.eval(`
      (() => {
        const out = [];
        const winH = window.innerHeight;
        for (let n = 0; n < NODES.length; n++) {
          for (let s = 0; s < NODES[n].steps.length; s++) {
            App.nIdx = n;
            App.sIdx = s;
            App.render();
            const scrollH = document.documentElement.scrollHeight;
            out.push({
              node: n + 1,
              step: s + 1,
              stepType: NODES[n].steps[s].t,
              title: NODES[n].title,
              scrollH,
              winH,
              diff: scrollH - winH,
              fitsSameFrame: scrollH <= winH + 5
            });
          }
        }
        return out;
      })()
    `);

    results.stepFrameMetrics = stepResults;
    for (const sr of stepResults) {
      const status = sr.fitsSameFrame ? '[PASS]' : '[OVERFLOW]';
      console.log(`  ${status} Node ${sr.node} Step ${sr.step} (${sr.stepType}): scrollH=${sr.scrollH} winH=${sr.winH} diff=${sr.diff}px`);
    }

    client.close();
    fs.writeFileSync('benchmarks/m2_ergonomics_results.json', JSON.stringify(results, null, 2), 'utf8');
    console.log('\n[SUCCESS] Independent Ergonomics Oracle completed and results saved to benchmarks/m2_ergonomics_results.json');
  } finally {
    chromeProc.kill();
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch(e){}
  }
}

runErgonomicsOracle().catch(err => {
  console.error('[ORACLE FAILED]:', err);
  process.exit(1);
});
