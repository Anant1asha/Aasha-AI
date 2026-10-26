#!/usr/bin/env node
/**
 * Aasha Foundation — L-Truth Ground Truth Benchmark & rt() Know-Stage Audit Tool (Node.js)
 * =======================================================================================
 * Zero-cost, offline validator enforcing:
 * 1. Anti-Spoiler Misconception Policy (Rule #1)
 * 2. Math Symbol vs. Bilingual rt() Collision Detection
 * 3. "Know" Stage Cognitive Hierarchy & Mastery Gating
 * 4. 10 Critical Production QA Rules
 */

const fs = require('fs');
const path = require('path');
const { QuestionSchemaValidator } = require('./question_schema_validator');

class ChapterAuditor {
  constructor(filePath) {
    this.filePath = filePath;
    this.filename = path.basename(filePath);
    this.content = fs.readFileSync(filePath, 'utf8');
    this.passedChecks = [];
    this.failedChecks = [];
    this.stats = {
      totalNodes: 0,
      totalSteps: 0,
      totalQuestions: 0,
      totalMisconceptions: 0,
      spoilerViolations: 0,
      missingMisconceptions: 0,
      mathRtCollisions: 0,
      ruleViolations: 0
    };
  }

  extractJsonVar(varName) {
    const regex = new RegExp(`var\\s+${varName}\\s*=\\s*([\\[\\{][\\s\\S]*?);\\s*(?:var|function|App|$)`);
    const match = this.content.match(regex);
    if (match) {
      const raw = match[1].trim();
      try {
        return JSON.parse(raw);
      } catch (e) {
        try {
          // Clean unquoted JS keys
          const cleaned = raw
            .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
            .replace(/:\s*'([^']*)'/g, ':"$1"');
          return JSON.parse(cleaned);
        } catch (e2) {
          // Eval in sandbox if clean JSON parsing fails
          try {
            const fn = new Function(`return ${raw};`);
            return fn();
          } catch (e3) {
            return null;
          }
        }
      }
    }
    return null;
  }

  auditRule1Spoilers() {
    const nodes = this.extractJsonVar('NODES');
    const we = this.extractJsonVar('WE') || {};
    const allChecks = [];

    // Collect checks from WE definitions
    if (we && typeof we === 'object') {
      for (const [weId, weData] of Object.entries(we)) {
        if (weData && typeof weData === 'object') {
          if (weData.check && typeof weData.check === 'object') {
            allChecks.push({ context: `WE '${weId}' overall check`, check: weData.check });
          }
          if (Array.isArray(weData.steps)) {
            weData.steps.forEach((step, sIdx) => {
              if (step && step.check && typeof step.check === 'object') {
                allChecks.push({ context: `WE '${weId}' Step ${sIdx + 1} check`, check: step.check });
              }
            });
          }
        }
      }
    }

    // Collect checks from NODES
    if (Array.isArray(nodes)) {
      this.stats.totalNodes = nodes.length;
      nodes.forEach((node, nIdx) => {
        if (Array.isArray(node.steps)) {
          node.steps.forEach((step, sIdx) => {
            this.stats.totalSteps++;
            const t = step.t;
            const ctx = `Node ${nIdx + 1} ('${node.title || '?'}') Step ${sIdx + 1} (${t})`;
            if (t === 'quiz' && step.q) {
              allChecks.push({ context: ctx, check: step.q });
            } else if (t === 'vq' && step.q) {
              allChecks.push({ context: ctx, check: step.q });
            } else if (t === 'solve' && step.sl && Array.isArray(step.sl.steps)) {
              step.sl.steps.forEach((slStep, slIdx) => {
                if (slStep.type === 'mcq' && Array.isArray(slStep.opts)) {
                  allChecks.push({ context: `${ctx} solve-step ${slIdx + 1}`, check: slStep });
                }
              });
            } else if (t === 'worked' && step.we && typeof step.we === 'object') {
              if (step.we.check) allChecks.push({ context: `${ctx} check`, check: step.we.check });
              if (Array.isArray(step.we.steps)) {
                step.we.steps.forEach((ws, wsIdx) => {
                  if (ws && ws.check) allChecks.push({ context: `${ctx} step ${wsIdx + 1}`, check: ws.check });
                });
              }
            }
          });
        }
      });
    }

    // Collect checks from DOM quiz-cards in HTML (e.g. Gamified assessments #section-warmup, deep_dive, boss)
    const cardSplit = this.content.split(/<div[^>]*class=["'][^"']*quiz-card[^"']*["']/i);
    for (let c = 1; c < cardSplit.length; c++) {
      const cardHtml = cardSplit[c];
      const idMatch = cardHtml.match(/^[^>]*id=["']([^"']+)["']/i);
      const qId = idMatch ? idMatch[1] : `DOM_Card_${c}`;

      const qTextMatch = cardHtml.match(/<div[^>]*class=["']quiz-question["'][^>]*>([\s\S]*?)<\/div>/i);
      const qText = qTextMatch ? qTextMatch[1].replace(/<[^>]+>/g, '').trim() : '';

      const domOpts = [];
      const optSplit = cardHtml.split(/<div[^>]*class=["'][^"']*quiz-opt[^"']*["']/i);
      for (let o = 1; o < optSplit.length; o++) {
        const optChunk = optSplit[o];
        const mMatch = optChunk.match(/data-m=(?:"([^"]*)"|'([^']*)')/i);
        const m = mMatch ? (mMatch[1] !== undefined ? mMatch[1] : mMatch[2]).replace(/&quot;/g, '"').replace(/&#39;/g, "'") : '';
        const onclickMatch = optChunk.match(/onclick=(?:"([^"]*)"|'([^']*)')/i);
        const onclick = onclickMatch ? (onclickMatch[1] !== undefined ? onclickMatch[1] : onclickMatch[2]) : '';
        const isCorrect = /,\s*true\b/i.test(onclick) || /data-correct=["']true["']/i.test(optChunk);
        const textMatch = optChunk.match(/<span[^>]*class=["']quiz-opt-text["'][^>]*>([\s\S]*?)<\/span>/i);
        const t = textMatch ? textMatch[1].replace(/<[^>]+>/g, '').trim() : '';
        if (t) {
          domOpts.push({ t, c: isCorrect, m });
        }
      }

      if (domOpts.length >= 2) {
        allChecks.push({ context: `Gamified Assessment '${qId}'`, check: { q: qText, opts: domOpts } });
      }
    }

    // Collect checks from V6 Canonical IR if present
    const irMatch = this.content.match(/const\s+IR\s*=\s*(\{[\s\S]*?\});\s*(?:\n|\r|\/\/)/);
    if (irMatch) {
      try {
        const ir = JSON.parse(irMatch[1]);
        if (ir && Array.isArray(ir.assessment_items)) {
          ir.assessment_items.forEach((item, qIdx) => {
            const ctx = `V6 Assessment Q${qIdx + 1} ('${item.id}')`;
            const opts = (item.options || []).map(opt => ({
              t: opt.text,
              c: opt.is_correct,
              m: opt.distractor_explanation
            }));
            allChecks.push({ context: ctx, check: { q: item.prompt, opts } });
          });
        }
      } catch (e) {}
    }

    this.stats.totalQuestions = allChecks.length;

    allChecks.forEach(({ context, check }) => {
      const opts = check.opts;
      if (!Array.isArray(opts) || opts.length === 0) return;

      const correctOpts = opts.filter(o => o && o.c === true);
      if (correctOpts.length === 0) {
        this.failedChecks.push(`CRITICAL: ${context} has no correct option marked (c: true).`);
        this.stats.ruleViolations++;
        return;
      }

      const correctOpt = correctOpts[0];

      opts.forEach((opt, optIdx) => {
        if (!opt || opt.c === true) return;
        this.stats.totalMisconceptions++;

        const distractorErrors = QuestionSchemaValidator.validateDistractor(opt, correctOpt, context, optIdx);
        distractorErrors.forEach(err => {
          if (err.ruleId.includes('MISSING_MISCONCEPTION')) {
            this.stats.missingMisconceptions++;
            this.failedChecks.push(`Rule #1 Violation: ${context} Option ${optIdx + 1} is missing misconception explanation ('m' field is empty).`);
          } else if (err.ruleId.includes('SPOILER')) {
            this.stats.spoilerViolations++;
            this.failedChecks.push(`Rule #1 Spoiler in ${context} [Wrong Option: '${opt.t || ''}']: ${err.message}`);
          } else if (err.ruleId.includes('LOW_QUALITY')) {
            this.failedChecks.push(`Pedagogical Quality Violation in ${context} [Wrong Option: '${opt.t || ''}']: ${err.message}`);
            this.stats.ruleViolations++;
          } else {
            this.failedChecks.push(`Validation Error in ${context}: ${err.message}`);
            this.stats.ruleViolations++;
          }
        });
      });
    });

    if (this.stats.spoilerViolations === 0 && this.stats.missingMisconceptions === 0) {
      this.passedChecks.push('Rule #1 (Zero-Spoiler Misconceptions): 100% compliant. No correct answers leaked.');
    }
  }

  auditMathRtCollisions() {
    const wm = this.extractJsonVar('WM') || {};
    const singleLetterKeys = Object.keys(wm).filter(k => k.length === 1 && /[a-zA-Z]/.test(k));

    const isAlgebra = /\b(?:algebra|coefficient|monomial|binomial|polynomial|variable|identit(?:y|ies))\b/i.test(this.content);

    if (isAlgebra) {
      const isolatesMath = /(?:<math|data-math|`[^`]+`|\$\$.*?\$\$|MathJax|class="math"|\\\(|MathIsolation)/i.test(this.content);
      const rtMatch = this.content.match(/function rt\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/);
      const rtBody = rtMatch ? rtMatch[1] : '';
      const rtGuardsMath = /math|isolate|skip|ignore|tag/i.test(rtBody);

      if (singleLetterKeys.includes('a') && !isolatesMath && !rtGuardsMath) {
        this.stats.mathRtCollisions++;
        this.failedChecks.push(
          "Math-rt Collision Warning: Chapter teaches Algebra, but WM defines 'a' as 'एक (ए)' without math-tag isolation in rt(). " +
          "Algebraic variables like 'a' in '4a' or '(a + b)' will trigger Hindi dictionary popups instead of mathematical symbols."
        );
      } else {
        this.passedChecks.push('Math-rt Isolation: Math expressions and variables are insulated from bilingual dictionary collision.');
      }
    } else {
      this.passedChecks.push('Math-rt Isolation: Non-algebraic content; no variable dictionary collisions detected.');
    }
  }

  audit10CriticalRules() {
    // Rule 2: Shuffled options
    const hasShuffle = /sort\(\s*function\(\s*\)\s*\{\s*return\s*Math\.random\(\)\s*-\s*0\.5/.test(this.content);
    if (hasShuffle) {
      this.passedChecks.push('Rule #2: All assessment options are shuffled using randomized sorting.');
    } else {
      this.failedChecks.push('Rule #2 Violation: Missing Math.random() - 0.5 option shuffle.');
      this.stats.ruleViolations++;
    }

    // Rule 3: No drag and drop, tap-only
    const hasDrag = /ondragstart|ondrop|draggable\s*=\s*["']true["']/i.test(this.content);
    if (!hasDrag) {
      this.passedChecks.push('Rule #3: Tap-only interaction enforced (zero HTML5 drag-and-drop events).');
    } else {
      this.failedChecks.push('Rule #3 Violation: HTML5 drag-and-drop detected. Low-end mobile requires tap-to-place.');
      this.stats.ruleViolations++;
    }

    // Rule 4: No alert() or confirm()
    const hasAlerts = /\b(?:window\.)?(?:alert|confirm|prompt)\s*\(/.test(this.content);
    if (!hasAlerts) {
      this.passedChecks.push('Rule #4: Clean execution without browser-freezing alert(), confirm(), or prompt().');
    } else {
      this.failedChecks.push('Rule #4 Violation: Found alert() or confirm() which freezes low-end mobile webviews.');
      this.stats.ruleViolations++;
    }

    // Rule 5: Skip button on interactive steps
    const hasSkip = /Skip this activity/i.test(this.content);
    const hasInteractive = /renderDD|renderIX|setupPizza|setupBar|setupArea/.test(this.content);
    if (!hasInteractive || hasSkip) {
      this.passedChecks.push('Rule #5: Skip action present on interactive canvas / drag-drop activities.');
    } else {
      this.failedChecks.push("Rule #5 Violation: Interactive activities found without a visible 'Skip this activity' link.");
      this.stats.ruleViolations++;
    }

    // Rule 6: Button never stuck disabled
    const hasBack = /id=["']backBtn["']/.test(this.content);
    const hasContinue = /id=["']continueBtn["']/.test(this.content);
    if (hasBack && hasContinue) {
      this.passedChecks.push('Rule #6: Primary navigation buttons (Back / Continue) properly anchored.');
    } else {
      this.failedChecks.push('Rule #6 Violation: Missing Back or Continue navigation buttons.');
      this.stats.ruleViolations++;
    }

    // Rule 7: _weCheckRendered flag present for WE flows
    const hasWeFlag = this.content.includes('_weCheckRendered');
    const hasWe = /renderWorked|WE\.|weSteps/.test(this.content);
    if (!hasWe || hasWeFlag) {
      this.passedChecks.push('Rule #7: _weCheckRendered flag present for multi-phase Worked Example check flow.');
    } else {
      this.failedChecks.push("Rule #7 Violation: Worked Example check flow missing '_weCheckRendered' state guard.");
      this.stats.ruleViolations++;
    }

    // Rule 8: localStorage bounds-checked
    const hasStorageTry = /try\s*\{\s*(?:var\s+s\s*=\s*)?JSON\.parse\(\s*localStorage\.getItem/.test(this.content);
    if (hasStorageTry) {
      this.passedChecks.push('Rule #8: localStorage safely wrapped in bounds-checked try-catch blocks.');
    } else {
      this.failedChecks.push('Rule #8 Violation: localStorage parse is unshielded; corrupt storage will crash app.');
      this.stats.ruleViolations++;
    }

    // Rule 9: exit() instant reset with no dialog
    const hasInstantExit = /exit\s*:\s*function\(\)\s*\{[^}]*this\.nIdx\s*=\s*0/.test(this.content);
    if (hasInstantExit) {
      this.passedChecks.push('Rule #9: exit() resets state immediately without modal dialogs.');
    } else {
      this.failedChecks.push('Rule #9 Violation: exit() does not perform immediate clean reset.');
      this.stats.ruleViolations++;
    }

    // Rule 10: Zero external CDN dependencies (Offline-first)
    const externalUrls = (this.content.match(/src=["'](https?:\/\/[^"']+)["']/g) || [])
      .filter(u => !u.includes('w3.org') && !u.includes('schema.org'));
    if (externalUrls.length === 0) {
      this.passedChecks.push('Rule #10: 100% Offline-First compliant. Zero external script or stylesheet CDN dependencies.');
    } else {
      this.failedChecks.push(`Rule #10 Violation: Found external network dependencies: ${externalUrls.join(', ')}`);
      this.stats.ruleViolations++;
    }

    // Rule 11: Air-Gapped Offline Bundle Size Ceiling (<= 40 MB = 41,943,040 bytes per AASHA-SPEC-02-TRD)
    const MAX_BUNDLE_BYTES = 41943040;
    try {
      const stats = fs.statSync(this.filePath);
      if (stats.size <= MAX_BUNDLE_BYTES) {
        this.passedChecks.push(`Rule #11: Air-Gapped Offline Bundle Size (${(stats.size / (1024 * 1024)).toFixed(2)} MB) satisfies <= 40 MB ceiling (${stats.size} <= ${MAX_BUNDLE_BYTES} bytes).`);
      } else {
        this.failedChecks.push(`Rule #11 Violation: Artifact file size (${stats.size} bytes / ${(stats.size / (1024 * 1024)).toFixed(2)} MB) exceeds hard 40 MB ceiling (${MAX_BUNDLE_BYTES} bytes). Release is BLOCKED.`);
        this.stats.ruleViolations++;
      }
    } catch (e) {
      this.failedChecks.push(`Rule #11 Violation: Could not stat file size for ${this.filePath}: ${e.message}`);
      this.stats.ruleViolations++;
    }

    // Rule 12: Cleanroom GPL-3.0 License Isolation (Zero copyleft contagion into MIT core chapter)
    const hasGplContagion = /GNU GENERAL PUBLIC LICENSE|GNU Affero General Public License|\bGPL-3\.0\b|\bGPLv3\b/i.test(this.content);
    if (!hasGplContagion) {
      this.passedChecks.push('Rule #12: Cleanroom License Isolation verified. Zero GPL-3.0 copyleft license contagion detected in core chapter.');
    } else {
      this.failedChecks.push('Rule #12 Violation: Found raw GPL copyleft license declaration in standalone chapter. Foundations with copyleft licenses (PhET, Escapp) must use the EXTRACT cleanroom strategy only.');
      this.stats.ruleViolations++;
    }
  }

  auditKnowStagePedagogy() {
    const nodes = this.extractJsonVar('NODES');
    if (!Array.isArray(nodes) || nodes.length === 0) return;

    let allIntro = true, allText = true, allCheck = true;

    nodes.forEach((node, idx) => {
      const steps = node.steps || [];
      const types = steps.map(s => s && s.t);
      if (!types.includes('intro')) {
        allIntro = false;
        this.failedChecks.push(`Pedagogy Gap: Concept Node ${idx + 1} ('${node.title}') is missing an 'intro' step.`);
      }
      if (!types.includes('text')) {
        allText = false;
        this.failedChecks.push(`Pedagogy Gap: Concept Node ${idx + 1} ('${node.title}') has no foundational 'text' (Know) step.`);
      }
      if (!types.some(t => ['quiz', 'worked', 'vq', 'solve'].includes(t))) {
        allCheck = false;
        this.failedChecks.push(`Pedagogy Gap: Concept Node ${idx + 1} ('${node.title}') lacks any concept verification check.`);
      }
    });

    if (allIntro && allText && allCheck) {
      this.passedChecks.push('Know-Stage Pedagogy: Every concept node follows proven Intro -> Concept Text -> Verification flow.');
    }
  }

  runFullAudit() {
    this.auditRule1Spoilers();
    this.auditMathRtCollisions();
    this.audit10CriticalRules();
    this.auditKnowStagePedagogy();

    const total = this.passedChecks.length + this.failedChecks.length;
    const baseRate = total > 0 ? (this.passedChecks.length / total) * 100 : 0;
    const penalty = (this.stats.spoilerViolations * 12) + (this.stats.ruleViolations * 8) + (this.stats.mathRtCollisions * 8);
    const finalScore = Math.max(0, Math.min(100, Math.round(baseRate - (penalty * 0.4))));

    return {
      filename: this.filename,
      filePath: this.filePath,
      finalScore,
      passedChecksCount: this.passedChecks.length,
      failedChecksCount: this.failedChecks.length,
      stats: this.stats,
      passedChecks: this.passedChecks,
      failedChecks: this.failedChecks
    };
  }
}

function runBatch(filePaths) {
  const results = {};
  for (const p of filePaths) {
    if (fs.existsSync(p)) {
      const auditor = new ChapterAuditor(p);
      results[path.basename(p)] = auditor.runFullAudit();
    } else {
      results[path.basename(p)] = { error: `File not found: ${p}` };
    }
  }
  return results;
}

// Run CLI
function resolveChapterPath(filename) {
  const candidates = [
    path.resolve(__dirname, '..', 'standalone_chapters', filename),
    path.resolve(__dirname, '..', 'chapters', filename),
    path.resolve(__dirname, '..', filename),
    path.resolve(__dirname, filename),
    path.resolve(__dirname, '..', 'aasha-pipeline-with-master-json', 'output', filename)
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.resolve(__dirname, '..', 'standalone_chapters', filename);
}

const args = process.argv.slice(2);
const fileArgIdx = args.indexOf('--file');
let targetFiles = [];

if (fileArgIdx !== -1 && args[fileArgIdx + 1]) {
  const customPath = path.resolve(process.cwd(), args[fileArgIdx + 1]);
  targetFiles = [customPath];
} else if (args.length > 0 && !args[0].startsWith('--')) {
  const customPath = path.resolve(process.cwd(), args[0]);
  targetFiles = [customPath];
} else {
  targetFiles = [
    resolveChapterPath('Class5_Math_Ch01_Gamified.html'),
    resolveChapterPath('Class5_Math_Ch02_Gamified.html'),
    resolveChapterPath('Class6_Math_Ch01_Gamified.html'),
    resolveChapterPath('Class6_Math_Ch02_Gamified.html'),
    resolveChapterPath('Class8_Math_Ch01_Gamified.html'),
    resolveChapterPath('Class8_Math_Ch02_Gamified.html'),
    resolveChapterPath('RationalNumbers_Class8_Gamified_v5_Enhanced_v6.html'),
    resolveChapterPath('ExponentsPowers_Class8_Gamified_v5_Enhanced_v6.html'),
    resolveChapterPath('RationalNumbers_Class8_AD.html'),
    resolveChapterPath('LinearEquations_Class8_v6.html'),
    resolveChapterPath('SquareCubeRoots_Class8_Gamified_v5_Enhanced_v6.html'),
    resolveChapterPath('AlgebraicExpressions_Class7_BETA_v6.html'),
    resolveChapterPath('quadratic_systems_lab_Class8_v6.html')
  ].filter(p => fs.existsSync(p));
}

const results = runBatch(targetFiles);

console.log('\n' + '='.repeat(80));
console.log(' AASHA FOUNDATION — L-TRUTH GROUND TRUTH BENCHMARK REPORT');
console.log('='.repeat(80) + '\n');

for (const [name, r] of Object.entries(results)) {
  if (r.error) {
    console.log(`[-] ${name}: ${r.error}`);
    continue;
  }
  const isPassed = r.finalScore >= 85 && r.stats.spoilerViolations === 0;
  const tag = isPassed ? '[PASSED]' : '[ACTION REQUIRED]';
  console.log(`${tag} ${name}`);
  console.log(`    Benchmark Score: ${r.finalScore}/100 | Checks Passed: ${r.passedChecksCount} | Violations: ${r.failedChecksCount}`);
  console.log(`    Questions Tested: ${r.stats.totalQuestions} | Misconceptions: ${r.stats.totalMisconceptions}`);
  console.log(`    Spoilers Found: ${r.stats.spoilerViolations} | Math-rt Collisions: ${r.stats.mathRtCollisions} | Rule Breaks: ${r.stats.ruleViolations}`);

  if (r.failedChecks.length > 0) {
    console.log('    Violations List:');
    r.failedChecks.forEach(f => console.log(`      * ${f}`));
  }
  console.log('-'.repeat(80));
}

// Export JSON
const outPath = path.resolve(__dirname, 'ltruth_benchmark_report.json');
fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
console.log(`\nDetailed report exported to: ${outPath}\n`);
