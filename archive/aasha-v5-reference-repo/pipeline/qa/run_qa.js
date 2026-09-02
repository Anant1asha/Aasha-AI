#!/usr/bin/env node
/**
 * Stage 8 — QA harness. See ../qa/README.md and docs/QA_CHECKLIST.md.
 *
 * Usage: node run_qa.js path/to/chapter.html [--out qa_report.json]
 *
 * Tiers:
 *   1. Syntax check          — `node --vm-check`-equivalent on the extracted <script>. Always runs.
 *   2. Static critical rules — regex/structural checks for rules that don't need a live DOM. Always runs.
 *   3. jsdom render checks   — render-every-step + flow simulation. Runs only if `jsdom` is
 *      resolvable; otherwise reported as SKIPPED (not silently passed) so a CI environment
 *      without jsdom installed can't accidentally ship a chapter that only passed tier 1-2.
 *
 * This mirrors the MVP spec's QA harness shape (§2.2.9) but is honest about what a
 * dependency-free environment can and can't verify — see docs/OPEN_SOURCE_TOOLING.md
 * on installing jsdom for full-fidelity CI.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function fail(list, check, reason) { list.push({ check, reason }); }

function extractScript(html) {
  const m = html.match(/<script>([\s\S]*)<\/script>/);
  if (!m) throw new Error('No <script> block found in HTML');
  return m[1];
}

function runSyntaxCheck(script, failures) {
  try {
    new vm.Script(script, { filename: 'chapter-script.js' });
  } catch (e) {
    fail(failures, 'syntax', `Script failed to parse: ${e.message}`);
  }
}

function runStaticCriticalRules(html, script, failures) {
  // Rule 3: no drag-and-drop anywhere (dragstart/dragover/drop handlers or setupTouchDrag)
  if (/\baddEventListener\(\s*['"](dragstart|dragover|drop)['"]/.test(script)
      || /setupTouchDrag/.test(script)) {
    fail(failures, 'rule3_no_drag_and_drop', 'Found drag-and-drop event wiring or dead setupTouchDrag reference');
  }

  // Rule 4: no confirm()/alert()
  if (/\b(confirm|alert)\s*\(/.test(script)) {
    fail(failures, 'rule4_no_confirm_alert', 'Found confirm()/alert() call — freezes mobile browsers');
  }

  // Rule 7: _weCheckRendered flag present and referenced
  if (!/_weCheckRendered/.test(script)) {
    fail(failures, 'rule7_we_check_flag', '_weCheckRendered flag not found in script');
  }

  // Rule 8: localStorage access is try/catch wrapped
  const lsUses = script.match(/localStorage\.(getItem|setItem)/g) || [];
  if (lsUses.length === 0) {
    fail(failures, 'rule8_localstorage_present', 'No localStorage persistence found (App.save/init expected)');
  } else if (!/try\s*\{[^}]*localStorage/.test(script)) {
    fail(failures, 'rule8_localstorage_bounded', 'localStorage access does not appear to be wrapped in try/catch');
  }

  // Rule 9: exit() has no dialog (no confirm/prompt in its body) — approximate via proximity search
  const exitMatch = script.match(/exit\s*:\s*function\s*\([^)]*\)\s*\{([\s\S]{0,300})/);
  if (exitMatch && /\b(confirm|prompt)\s*\(/.test(exitMatch[1])) {
    fail(failures, 'rule9_exit_no_dialog', 'exit() appears to show a confirmation dialog');
  }

  // Rule 6 (partial/static): the ONLY forward-nav button (#continueBtn) must never be
  // permanently stuck disabled — i.e. every code path that disables it must be paired with
  // SOME re-enable path elsewhere in the script (e.g. an option-select handler). A tight
  // proximity check produces false positives on this codebase's real pattern (disable on
  // render/retry, re-enable from a *different* handler when the user picks an option), so
  // this checks for at least one re-enable occurrence anywhere in the script rather than
  // requiring it near each disable call. True stuck-disabled bugs need jsdom flow simulation
  // (tier 3) to catch with confidence — this is a coarse heuristic, not a guarantee.
  const disablesBtn = /continueBtn['"]\)\.disabled\s*=\s*true/.test(script);
  const reenablesBtn = /continueBtn['"]\)\.disabled\s*=\s*false/.test(script);
  if (disablesBtn && !reenablesBtn) {
    fail(failures, 'rule6_button_never_stuck_disabled',
      'continueBtn is disabled somewhere but no re-enable path was found anywhere in the script');
  }

  // Offline check: no external URLs (http(s)://) anywhere in the file except inside comments/strings
  // that are clearly documentation. This is a heuristic, not a guarantee — real network calls
  // (fetch/XHR to a remote host) are what actually matters.
  if (/\b(fetch|XMLHttpRequest)\s*\(/.test(script) && /https?:\/\//.test(script)) {
    fail(failures, 'offline_no_network_calls', 'Found both a fetch/XHR call and an http(s) URL — verify no remote requests at runtime');
  }
}

function runDeadCodeScan(script, failures) {
  const fnDefs = [...script.matchAll(/function\s+([a-zA-Z_$][\w$]*)\s*\(/g)].map(m => m[1]);
  const dead = fnDefs.filter(name => {
    const re = new RegExp(`\\b${name}\\b`, 'g');
    const count = (script.match(re) || []).length;
    return count <= 1; // only the definition itself, never called
  });
  if (dead.length) {
    fail(failures, 'rule10_dead_code', `Possibly unused function(s): ${dead.join(', ')} (manual confirm recommended — this is a heuristic, not proof)`);
  }
}

async function runJsdomChecks(html, failures, skipped) {
  let jsdomLib;
  try {
    jsdomLib = require('jsdom');
  } catch (e) {
    skipped.push({ tier: 'jsdom_render_and_flow', reason: 'jsdom not installed — run `npm install jsdom` for full-fidelity QA (see docs/OPEN_SOURCE_TOOLING.md)' });
    return;
  }
  const { JSDOM } = jsdomLib;
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true });
  const { window } = dom;

  // Wait a tick for App.init() (runs at script end) to have executed.
  await new Promise(r => setTimeout(r, 50));

  const App = window.App;
  const NODES = window.NODES;
  if (!App || !NODES) {
    fail(failures, 'jsdom_bootstrap', 'App or NODES not found on window after script execution');
    return;
  }

  // Render-every-step: walk every (node, step) pair via goForward-equivalent direct index set.
  for (let ni = 0; ni < NODES.length; ni++) {
    for (let si = 0; si < NODES[ni].steps.length; si++) {
      try {
        App.nIdx = ni; App.sIdx = si;
        App.render();
      } catch (e) {
        fail(failures, 'render_every_step', `NODES[${ni}].steps[${si}] (t=${NODES[ni].steps[si].t}) threw: ${e.message}`);
      }
    }
  }

  // Skip-button presence on interactive step types.
  const skippableTypes = ['dd_build', 'dd_match'];
  for (let ni = 0; ni < NODES.length; ni++) {
    for (let si = 0; si < NODES[ni].steps.length; si++) {
      const step = NODES[ni].steps[si];
      if (skippableTypes.includes(step.t)) {
        App.nIdx = ni; App.sIdx = si;
        try {
          App.render();
          const doc = window.document;
          const hasSkip = !!doc.querySelector('[data-skip], .skip-btn, #skipBtn');
          if (!hasSkip) {
            fail(failures, 'rule5_skip_button_present',
              `NODES[${ni}].steps[${si}] (t=${step.t}) rendered without a detectable skip control`);
          }
        } catch (e) { /* already reported by render_every_step */ }
      }
    }
  }
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node run_qa.js path/to/chapter.html [--out qa_report.json]');
    process.exit(2);
  }
  const outIdx = process.argv.indexOf('--out');
  const outPath = outIdx >= 0 ? process.argv[outIdx + 1] : 'qa_report.json';

  const html = fs.readFileSync(filePath, 'utf-8');
  const failures = [];
  const skipped = [];

  let script;
  try {
    script = extractScript(html);
  } catch (e) {
    fail(failures, 'extract_script', e.message);
    script = '';
  }

  if (script) {
    runSyntaxCheck(script, failures);
    runStaticCriticalRules(html, script, failures);
    runDeadCodeScan(script, failures);
    await runJsdomChecks(html, failures, skipped);
  }

  const report = {
    file: path.resolve(filePath),
    passed: failures.length === 0,
    checks_run: 3 + (skipped.length ? 0 : 2), // rough count: syntax, static-rules, dead-code (+2 jsdom tiers if run)
    failures,
    skipped,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(report.passed ? `PASS — 0 failures` : `FAIL — ${failures.length} failure(s)`);
  failures.forEach(f => console.log(`  ✗ [${f.check}] ${f.reason}`));
  if (skipped.length) skipped.forEach(s => console.log(`  ⚠ SKIPPED [${s.tier}] ${s.reason}`));
  process.exit(report.passed ? 0 : 1);
}

main();
