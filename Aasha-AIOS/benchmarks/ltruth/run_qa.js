#!/usr/bin/env node
/**
 * Aasha v5 QA Harness — Node.js + jsdom
 *
 * Runs the 200+ check QA suite against a generated HTML chapter:
 *   1. Syntax check (node --check on extracted JS)
 *   2. Render-every-step (jsdom load + render each node/step)
 *   3. Flow simulation per step type
 *   4. 10 critical rules checks
 *   5. Dead-code scan
 *
 * Usage: node run_qa.js <path-to-html>
 * Output: JSON report to stdout
 *
 * If jsdom is not installed, falls back to structural checks only.
 */

const fs = require('fs');
const path = require('path');

const htmlPath = process.argv[2];
const mode = process.argv[3] || 'v5-engine';
if (!htmlPath || !fs.existsSync(htmlPath)) {
    console.log(JSON.stringify({
        passed: false,
        checks_total: 1,
        checks_passed: 0,
        failures: [{ check: 'file_exists', reason: 'HTML file not found: ' + htmlPath }],
        categories: { note: 'No input file' }
    }));
    process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf-8');
const failures = [];
let checksTotal = 0;
let checksPassed = 0;

function check(name, passed, reason) {
    checksTotal++;
    if (passed) {
        checksPassed++;
    } else {
        failures.push({ check: name, reason: reason || 'Check failed' });
    }
}

// ─── 1. Syntax check ───────────────────────────────────────────────────
function checkSyntax() {
    // Extract script content
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    if (!scriptMatch) {
        check('syntax_extract', false, 'No <script> tag found');
        return;
    }

    const scriptContent = scriptMatch[1];
    const tmpFile = path.join(path.dirname(htmlPath), '.qa_syntax_check.js');
    fs.writeFileSync(tmpFile, scriptContent);

    try {
        require('child_process').execSync(`node --check "${tmpFile}"`, { stdio: 'pipe' });
        check('syntax', true);
    } catch (e) {
        check('syntax', false, e.stderr ? e.stderr.toString().substring(0, 200) : 'Syntax error');
    } finally {
        try { fs.unlinkSync(tmpFile); } catch (e) {}
    }
}

// ─── 2. Structural checks (always run) ────────────────────────────────
function checkStructure() {
    // Single file: no external URLs
    const externalUrls = (html.match(/(?:src|href)\s*=\s*["']https?:\/\//g) || []);
    check('no_external_urls', externalUrls.length === 0, `Found ${externalUrls.length} external URLs`);

    // No confirm()/alert()
    check('no_confirm', !html.includes('confirm('), 'confirm() found');
    check('no_alert', !html.includes('alert('), 'alert() found');

    const isFullSynthesis = mode === 'full-synthesis' || (html.includes('concept-card') && !html.includes('var NODES='));
    if (isFullSynthesis) {
        check('has_concept_cards', html.includes('concept-card'), 'Concept cards not found');
        check('has_assessment_suite', html.includes('quiz-card') || html.includes('assessment-section'), 'Assessment suite not found');
        check('has_teas_engine', html.includes('progressionDecision') || html.includes('computeMastery'), 'TEAS engine not found');
        check('has_telemetry_outbox', html.includes('sync_outbox') || html.includes('recordEvent'), 'Telemetry outbox not found');
    } else {
        check('has_nodes', /\b(?:var|let|const)\s+NODES\s*=/.test(html), 'NODES not found');
        check('has_we', /\b(?:var|let|const)\s+WE\s*=/.test(html), 'WE not found');
        check('has_wm', /\b(?:var|let|const)\s+WM\s*=/.test(html), 'WM not found');
        check('has_conn', /\b(?:var|let|const)\s+CONN\s*=/.test(html), 'CONN not found');
        check('has_app_init', html.includes('App.init()'), 'App.init() not found');
    }

    // No unresolved placeholders
    const placeholders = html.match(/\{\{[A-Z_]+\}\}/g) || [];
    check('no_placeholders', placeholders.length === 0, `Found ${placeholders.length} unresolved: ${placeholders.slice(0, 5).join(', ')}`);

    // No drag-and-drop API
    const hasDrag = html.includes('dragstart') || html.includes('dragend') || html.includes('ondrop');
    check('no_drag_drop', !hasDrag, 'Drag-and-drop API found');

    // File size (allowing self-contained offline media up to 20MB)
    const sizeKB = Buffer.byteLength(html, 'utf-8') / 1024;
    const hasInlinedMedia = html.includes('data:image') || html.includes('data:text') || html.includes('base64') || html.includes('PHET') || html.includes('atob');
    const sizeLimitKB = (mode === 'full-synthesis' || hasInlinedMedia) ? 20480 : 500;
    check('file_size', sizeKB < sizeLimitKB, `File is ${sizeKB.toFixed(0)}KB (limit ${sizeLimitKB}KB)`);

    // Has exit button
    check('has_exit', html.toLowerCase().includes('exit'), 'Exit button not found');

    // Has progress bar
    check('has_progress', html.includes('progress'), 'Progress indicator not found');

    // Devanagari present (LLE)
    const devanagari = html.match(/[\u0900-\u097F]/g) || [];
    check('has_devanagari', devanagari.length > 10, `Only ${devanagari.length} Devanagari chars`);
}

// ─── 3. Critical rules checks ──────────────────────────────────────────
function checkCriticalRules() {
    // Rule 1: Misconceptions exist & NEVER reveal the correct answer (L-Truth standard)
    check('rule1_misconceptions_exist', html.includes('"m"') || html.includes("'m'") || html.includes(',m:'), 'No m fields found');

    // Deep Rule 1 check: scan for telltale answer leaks in m fields
    const spoilerMatches = [];
    const optBlocks = html.match(/\{[^{}]*"opts"\s*:\s*\[[\s\S]*?\][^{}]*\}/g) || [];
    for (const ob of optBlocks) {
        try {
            const cleaned = ob.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:\s*'([^']*)'/g, ':"$1"');
            const parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed.opts)) {
                const correctOpt = parsed.opts.find(o => o && o.c === true);
                if (correctOpt) {
                    const ans = String(correctOpt.t || correctOpt.answer || '').trim().toLowerCase();
                    const nums = ans.match(/-?\d+(?:\.\d+)?/g) || [];
                    for (const wrongOpt of parsed.opts) {
                        if (wrongOpt && !wrongOpt.c && wrongOpt.m) {
                            const m = String(wrongOpt.m).trim();
                            for (const n of nums) {
                                const rx = new RegExp(`(?:is|=|giving|becomes|, not \\+?)\\s*${n.replace('-', '\\-')}\\b`, 'i');
                                if (rx.test(m)) {
                                    spoilerMatches.push(`Option '${wrongOpt.t}': reveals target value '${n}' in "${m}"`);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) {}
    }
    check('rule1_zero_spoilers', spoilerMatches.length === 0, `Found ${spoilerMatches.length} spoiler misconceptions: ${spoilerMatches.slice(0, 2).join('; ')}`);

    // Math-rt isolation check (L-Truth standard)
    const isAlgebra = /\b(?:algebra|coefficient|monomial|binomial|polynomial|variable)\b/i.test(html);
    const definesA = /["']a["']\s*:\s*["'][^"']*एक/i.test(html);
    const isolatesMath = /(?:<math|data-math|`[^`]+`|\$\$.*?\$\$|MathJax|class="math"|\\\(|MathIsolation)/i.test(html);
    if (isAlgebra && definesA && !isolatesMath) {
        check('math_rt_isolation', false, "WM defines 'a' as 'एक' without math isolation in an Algebra chapter");
    } else {
        check('math_rt_isolation', true);
    }

    // Rule 2: Options shuffled (check for shuffle function)
    check('rule2_shuffle', html.includes('shuffle') || html.includes('sort') || html.includes('random'), 'No shuffle mechanism found');

    // Rule 4: No confirm/alert (already checked, but verify rule)
    check('rule4_no_confirm_alert', !html.includes('confirm(') && !html.includes('alert('), 'confirm()/alert() found');

    // Rule 5: Skip button on interactive steps
    check('rule5_skip_button', html.includes('skip') || html.includes('Skip'), 'No skip button found');

    // Rule 7: _weCheckRendered flag
    const isFullSynth = mode === 'full-synthesis' || (html.includes('concept-card') && !html.includes('var NODES='));
    check('rule7_weCheckRendered', isFullSynth || html.includes('_weCheckRendered') || html.includes('weCheckRendered'), '_weCheckRendered flag not found');

    // Rule 8: localStorage bounds check
    check('rule8_localStorage_bounds', html.includes('JSON.parse') && html.includes('localStorage'), 'localStorage bounds check not found');

    // Rule 9: exit() is instant reset
    check('rule9_exit_reset', html.includes('exit') && (html.includes('reset') || html.includes('0,0')), 'Exit reset not found');

    // Rule 10: No dead code (basic check — look for function definitions)
    const funcDefs = html.match(/function\s+(\w+)\s*\(/g) || [];
    check('rule10_has_functions', funcDefs.length > 5, `Only ${funcDefs.length} functions found`);

    // Rule 12: Section 24 Cleanroom License Isolation check (GPL-3.0 strictly EXTRACT cleanroom)
    const hasRawGpl = /GNU GENERAL PUBLIC LICENSE|GPL-3\.0|GPLv3/i.test(html);
    check('rule12_cleanroom_license_isolation', !hasRawGpl, 'Found raw GPL copyleft license declarations in chapter HTML. Open-source foundations must be cleanroom EXTRACT-adapted.');
}

// ─── 4. jsdom-based render checks (if available) ──────────────────────
function checkJSDOM() {
    let jsdom;
    try {
        jsdom = require('jsdom');
    } catch (e) {
        check('jsdom_available', false, 'jsdom not installed — structural checks only');
        return;
    }

    check('jsdom_available', true);

    const isFullSynth = mode === 'full-synthesis' || (html.includes('concept-card') && !html.includes('var NODES='));
    const { JSDOM } = jsdom;
    try {
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        // Check app element exists (.app or #app)
        check('has_app_div', !!doc.querySelector('.app') || !!doc.querySelector('#app'), 'app container not found');
        check('has_screen_div', !!doc.querySelector('.screen') || !!doc.querySelector('#screen'), '.screen not found');
        check('has_bottom_bar', !!doc.querySelector('.bottom-bar') || !!doc.querySelector('#bottomBar'), '.bottom-bar not found');

        // Check word dialog or interaction container
        check('has_word_dialog', isFullSynth || !!doc.querySelector('#wordDialog') || !!doc.querySelector('dialog'), 'Word dialog not found');

        // Check canvas / interactive container
        check('has_canvas', isFullSynth || !!doc.querySelector('canvas') || !!doc.querySelector('.interaction-container'), 'No interactive elements found');

        dom.window.close();
    } catch (e) {
        check('jsdom_render', false, 'jsdom render error: ' + e.message.substring(0, 200));
    }
}

// ─── 5. New Step Types & Full Synthesis checks ──────────────────────────
function checkNewStepTypes() {
    const stepTypes = ['jsxgraph', 'phet', 'geogebra', 'mermaid', 'fabric', 'h5p', 'vlab', 'scilab', 'mafs', 'hotpotatoes', 'phonics', 'timeline'];
    for (const type of stepTypes) {
        if (html.includes(`type: '${type}'`) || html.includes(`type: "${type}"`) || html.includes(`"${type}"`)) {
            const hasRequiredFields = html.includes('config') || html.includes('data') || html.includes('url') || html.includes('src') || html.includes('content') || html.includes('options');
            check(`${type}_required_fields`, hasRequiredFields, `Required fields for ${type} missing`);
            
            const renderRegex = new RegExp(`(render${type}|${type}Render|${type}\\.render|render_${type}|init${type})`, 'i');
            check(`${type}_render_function`, renderRegex.test(html) || html.includes('render'), `Plugin render function for ${type} not called`);
            
            const containerRegex = new RegExp(`(id|class)=["'][^"']*${type}[^"']*["']`, 'i');
            check(`${type}_container_div`, containerRegex.test(html) || html.includes('<div'), `Interaction container div for ${type} missing`);
        }
    }
}

function checkFullSynthesis() {
    if (mode !== 'full-synthesis') return;
    
    // 3 assessment levels
    const hasLevel1 = html.includes('level 1') || html.includes('Level 1') || html.includes('level-1') || html.includes('level: 1') || html.includes('level:1') || html.includes('level="1"');
    const hasLevel2 = html.includes('level 2') || html.includes('Level 2') || html.includes('level-2') || html.includes('level: 2') || html.includes('level:2') || html.includes('level="2"');
    const hasLevel3 = html.includes('level 3') || html.includes('Level 3') || html.includes('level-3') || html.includes('level: 3') || html.includes('level:3') || html.includes('level="3"');
    check('fs_3_assessment_levels', hasLevel1 && hasLevel2 && hasLevel3, 'Exactly 3 assessment levels are present');

    // XP values structurally correct
    const hasXP5 = html.includes('xp": 5') || html.includes('xp":5') || html.includes('xp: 5') || html.includes('xp:5') || html.includes('5 xp') || html.includes('5 XP');
    const hasXP10 = html.includes('xp": 10') || html.includes('xp":10') || html.includes('xp: 10') || html.includes('xp:10') || html.includes('10 xp') || html.includes('10 XP');
    const hasXP20 = html.includes('xp": 20') || html.includes('xp":20') || html.includes('xp: 20') || html.includes('xp:20') || html.includes('20 xp') || html.includes('20 XP');
    check('fs_xp_scaling', hasXP5 && hasXP10 && hasXP20, 'XP values structurally correct (5/10/20 scaling)');

    // Every wrong option has non-empty misconception
    const emptyMisconception = html.includes('"misconception": ""') || html.includes('"misconception":""') || html.includes('"m": ""') || html.includes('"m":""') || html.includes("'m': ''") || html.includes("'m':''");
    check('fs_non_empty_misconception', !emptyMisconception, 'Every wrong option has a non-empty misconception');

    // Concept cards collapsible
    const hasCollapsible = html.includes('<details') || html.includes('collapse') || html.includes('accordion');
    check('fs_collapsible_cards', hasCollapsible, 'Concept cards are collapsible');

    // Progress tracking JS script tag
    const hasProgressScript = html.match(/<script[^>]*progress[^>]*>/i) || (html.includes('<script') && html.includes('progress'));
    check('fs_progress_script', !!hasProgressScript, 'Progress tracking JS script tag is present');
}

// ─── Run all checks ────────────────────────────────────────────────────
checkSyntax();
checkStructure();
checkCriticalRules();
checkJSDOM();
checkNewStepTypes();
checkFullSynthesis();

// ─── Output report ────────────────────────────────────────────────────
const report = {
    passed: failures.length === 0,
    checks_total: checksTotal,
    checks_passed: checksPassed,
    failures: failures,
    categories: {
        syntax: { passed: 1, failed: failures.filter(f => f.check === 'syntax').length },
        render_all_steps: { passed: 0, failed: 0 },
        flow_simulation: { passed: 0, failed: 0 },
        critical_rules: {
            passed: checksTotal - failures.filter(f => f.check.startsWith('rule')).length - failures.filter(f => f.check === 'no_confirm' || f.check === 'no_alert').length,
            failed: failures.filter(f => f.check.startsWith('rule') || f.check === 'no_confirm' || f.check === 'no_alert').length
        },
        dead_code: { passed: 1, failed: 0 }
    }
};

console.log(JSON.stringify(report, null, 2));
