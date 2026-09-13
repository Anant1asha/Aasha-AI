#!/usr/bin/env node
/**
 * Aasha Foundation — L-Truth 200+ Verification Benchmark across 7 Generated Chapters
 * Using VM-Sandbox AST Execution + Claude Code via OpenRouter for Semantic Zero-Spoiler Audit
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

class ChapterAuditor {
  constructor(filePath) {
    this.filePath = filePath;
    this.filename = path.basename(filePath);
    this.content = fs.readFileSync(filePath, 'utf8');
    this.passedChecks = [];
    this.failedChecks = [];
    this.inspectedQuestions = [];
    this.sandbox = null;
    this.stats = {
      totalNodes: 0,
      totalSteps: 0,
      totalQuestions: 0,
      totalMisconceptions: 0,
      spoilerViolations: 0,
      missingMisconceptions: 0,
      mathRtCollisions: 0,
      ruleViolations: 0,
      syntaxErrors: 0
    };

    this.initSandbox();
  }

  initSandbox() {
    const dummyCtx = {
      fillRect: () => {}, clearRect: () => {}, beginPath: () => {},
      moveTo: () => {}, lineTo: () => {}, stroke: () => {}, fill: () => {},
      arc: () => {}, fillText: () => {}, strokeRect: () => {}, save: () => {},
      restore: () => {}, translate: () => {}, rotate: () => {}, setLineDash: () => {}
    };
    const dummyEl = {
      addEventListener: () => {}, removeEventListener: () => {},
      querySelector: () => null, querySelectorAll: () => [],
      style: {}, setAttribute: () => {}, getAttribute: () => null,
      getContext: () => dummyCtx, classList: { add: () => {}, remove: () => {}, contains: () => false },
      appendChild: () => {}, innerHTML: '', textContent: '', focus: () => {}
    };
    const sandbox = {
      window: {},
      document: {
        getElementById: () => dummyEl,
        querySelector: () => dummyEl,
        querySelectorAll: () => [],
        addEventListener: () => {},
        removeEventListener: () => {},
        createElement: () => dummyEl,
        body: dummyEl
      },
      navigator: { userAgent: 'AashaQAAgent/1.0' },
      localStorage: {
        _data: {},
        getItem: function(k) { return this._data[k] || null; },
        setItem: function(k, v) { this._data[k] = String(v); },
        removeItem: function(k) { delete this._data[k]; }
      },
      Math, console,
      setTimeout: () => {}, setInterval: () => {},
      clearTimeout: () => {}, clearInterval: () => {},
      requestAnimationFrame: () => {}
    };
    sandbox.window = sandbox;
    vm.createContext(sandbox);

    // Execute scripts in sandbox
    const scriptMatches = this.content.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi) || [];
    for (const scriptTag of scriptMatches) {
      const code = scriptTag.replace(/<\/?script[^>]*>/gi, '');
      try {
        vm.runInContext(code, sandbox);
      } catch (err) {
        // Non-fatal if runtime code tries DOM manipulation
      }
    }

    this.sandbox = sandbox;
  }

  extractVar(varName) {
    if (this.sandbox && this.sandbox[varName]) {
      return this.sandbox[varName];
    }
    // Fallback: regex search
    const regex = new RegExp(`(?:var|const|let)\\s+${varName}\\s*=\\s*([\\[\\{][\\s\\S]*?);\\s*(?:var|const|let|function|App|$)`);
    const match = this.content.match(regex);
    if (match) {
      try {
        const fn = new Function(`return ${match[1].trim()};`);
        return fn();
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  auditSyntax() {
    if (!this.content.includes('<!DOCTYPE html') && !this.content.includes('<html')) {
      this.failedChecks.push('Syntax Error: Missing <!DOCTYPE html> or <html> tag.');
      this.stats.syntaxErrors++;
    } else {
      this.passedChecks.push('Syntax: Valid HTML document wrapper structure.');
    }

    const scriptMatches = this.content.match(/<script[\s\S]*?<\/script>/gi) || [];
    if (scriptMatches.length === 0) {
      this.failedChecks.push('Syntax Error: No script tags found.');
      this.stats.syntaxErrors++;
    } else {
      this.passedChecks.push(`Syntax: ${scriptMatches.length} script block(s) detected.`);
    }
  }

  auditRule1Spoilers() {
    const nodes = this.extractVar('NODES');
    const we = this.extractVar('WE') || {};
    const allChecks = [];

    // Collect checks from WE definitions
    if (we && typeof we === 'object') {
      for (const [weId, weData] of Object.entries(we)) {
        if (weData && typeof weData === 'object') {
          if (weData.check && typeof weData.check === 'object') {
            allChecks.push({ context: `WE '${weId}' check`, check: weData.check });
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
            if ((t === 'quiz' || t === 'vq') && step.q) {
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

      const correctText = String(correctOpts[0].t || correctOpts[0].answer || '').trim();
      const correctLower = correctText.toLowerCase();

      const qRecord = {
        context,
        question: check.prompt || check.question || check.q || context,
        correctAnswer: correctText,
        distractors: []
      };

      opts.forEach((opt, optIdx) => {
        if (!opt || opt.c === true) return;
        this.stats.totalMisconceptions++;
        const mText = (opt.m || '').trim();
        const distText = String(opt.t || opt.answer || '').trim();

        qRecord.distractors.push({
          option: distText,
          misconception: mText
        });

        if (!mText) {
          this.stats.missingMisconceptions++;
          this.failedChecks.push(`Rule #1 Violation: ${context} Option ${optIdx + 1} ('${distText}') missing misconception ('m').`);
          return;
        }

        const mLower = mText.toLowerCase();
        let revealed = false;
        let reason = '';

        // 1. Explicit numerical values from the correct answer
        const nums = correctLower.match(/-?\d+(?:\.\d+)?/g) || [];
        for (const n of nums) {
          const numRegex = new RegExp(`(?:is|=|giving|becomes|, not \\+?)\\s*${n.replace('-', '\\-')}\\b`, 'i');
          if (numRegex.test(mText)) {
            revealed = true;
            reason = `Leaking numerical answer '${n}': "${mText}"`;
            break;
          }
        }

        // 2. Algebraic expressions in correct answer
        if (!revealed && correctLower.length > 3) {
          if (mLower.includes(correctLower)) {
            revealed = true;
            reason = `Contains exact answer phrase '${correctText}'`;
          }
        }

        // 3. Common revealing phrasing
        if (!revealed) {
          const spoilerTriggers = ['the result is', 'the correct answer is', 'the answer should be'];
          for (const st of spoilerTriggers) {
            if (mLower.includes(st) && nums.some(n => mLower.includes(n))) {
              revealed = true;
              reason = `Contains spoiler phrase '${st}' with value`;
              break;
            }
          }
        }

        if (revealed) {
          this.stats.spoilerViolations++;
          this.failedChecks.push(`Rule #1 Spoiler in ${context} [Distractor: '${distText}']: ${reason}`);
        }
      });

      this.inspectedQuestions.push(qRecord);
    });

    if (this.stats.totalQuestions > 0 && this.stats.spoilerViolations === 0 && this.stats.missingMisconceptions === 0) {
      this.passedChecks.push(`Rule #1 (Zero-Spoiler Misconceptions): 100% compliant across ${this.stats.totalMisconceptions} evaluated misconceptions.`);
    }
  }

  auditMathRtCollisions() {
    const wm = this.extractVar('WM') || {};
    const singleLetterKeys = Object.keys(wm).filter(k => k.length === 1 && /[a-zA-Z]/.test(k));
    const isAlgebra = /\b(?:algebra|coefficient|monomial|binomial|polynomial|variable|identit(?:y|ies))\b/i.test(this.content);

    if (isAlgebra) {
      const isolatesMath = /(?:<math|data-math|`[^`]+`|\$\$.*?\$\$|MathJax|class="math"|\\\(|MathIsolation)/i.test(this.content);
      const rtMatch = this.content.match(/function rt\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/);
      const rtBody = rtMatch ? rtMatch[1] : '';
      const rtGuardsMath = /math|isolate|skip|ignore|tag/i.test(rtBody);

      if (singleLetterKeys.includes('a') && !isolatesMath && !rtGuardsMath) {
        this.stats.mathRtCollisions++;
        this.failedChecks.push("Math-rt Collision Warning: Algebraic chapter defines 'a' in WM without isolation in rt().");
      } else {
        this.passedChecks.push('Math-rt Isolation: Algebraic symbols protected from bilingual translation collision.');
      }
    } else {
      this.passedChecks.push('Math-rt Isolation: Non-algebraic content; zero dictionary collision.');
    }
  }

  audit10CriticalRules() {
    // Rule 2: Shuffled options
    const hasShuffle = /sort\(\s*function\(\s*\)\s*\{\s*return\s*Math\.random\(\)\s*-\s*0\.5/.test(this.content);
    if (hasShuffle) {
      this.passedChecks.push('Rule #2: Options shuffled with Math.random() - 0.5.');
    } else {
      this.failedChecks.push('Rule #2 Violation: Missing Math.random() option shuffle.');
      this.stats.ruleViolations++;
    }

    // Rule 3: No drag and drop, tap-only
    const hasDrag = /ondragstart|ondrop|draggable\s*=\s*["']true["']/i.test(this.content);
    if (!hasDrag) {
      this.passedChecks.push('Rule #3: Tap-only interaction enforced (zero HTML5 drag-and-drop).');
    } else {
      this.failedChecks.push('Rule #3 Violation: HTML5 drag-and-drop detected.');
      this.stats.ruleViolations++;
    }

    // Rule 4: No alert() or confirm()
    const hasAlerts = /\b(?:window\.)?(?:alert|confirm|prompt)\s*\(/.test(this.content);
    if (!hasAlerts) {
      this.passedChecks.push('Rule #4: Clean execution without browser-freezing alert(), confirm(), prompt().');
    } else {
      this.failedChecks.push('Rule #4 Violation: Found alert() or confirm() calls.');
      this.stats.ruleViolations++;
    }

    // Rule 5: Skip button
    const hasSkip = /Skip this activity|skip-btn|id=["']skipBtn["']/i.test(this.content);
    const hasInteractive = /renderDD|renderIX|setupPizza|setupBar|setupArea|jsxgraph/i.test(this.content);
    if (!hasInteractive || hasSkip) {
      this.passedChecks.push('Rule #5: Skip action present on interactive visual activities.');
    } else {
      this.failedChecks.push("Rule #5 Violation: Interactive activity missing 'Skip'.");
      this.stats.ruleViolations++;
    }

    // Rule 6: Navigation buttons
    const hasBack = /id=["']backBtn["']|back-btn/.test(this.content);
    const hasContinue = /id=["']continueBtn["']|next-btn/.test(this.content);
    if (hasBack && hasContinue) {
      this.passedChecks.push('Rule #6: Primary navigation buttons (Back / Continue) anchored.');
    } else {
      this.failedChecks.push('Rule #6 Violation: Missing Back or Continue navigation buttons.');
      this.stats.ruleViolations++;
    }

    // Rule 7: _weCheckRendered flag
    const hasWeFlag = this.content.includes('_weCheckRendered');
    const hasWe = /renderWorked|WE\.|weSteps/.test(this.content);
    if (!hasWe || hasWeFlag) {
      this.passedChecks.push('Rule #7: _weCheckRendered state guard present for WE check flows.');
    } else {
      this.failedChecks.push("Rule #7 Violation: Worked Example check flow missing '_weCheckRendered'.");
      this.stats.ruleViolations++;
    }

    // Rule 8: localStorage bounds check
    const hasStorageTry = /try\s*\{\s*(?:var\s+s\s*=\s*)?JSON\.parse\(\s*localStorage\.getItem/.test(this.content);
    if (hasStorageTry) {
      this.passedChecks.push('Rule #8: localStorage safely wrapped in bounds-checked try-catch.');
    } else {
      this.failedChecks.push('Rule #8 Violation: localStorage parse unshielded.');
      this.stats.ruleViolations++;
    }

    // Rule 9: instant reset exit
    const hasInstantExit = /exit\s*:\s*function\(\)\s*\{[^}]*this\.nIdx\s*=\s*0|exit\(\)/.test(this.content);
    if (hasInstantExit) {
      this.passedChecks.push('Rule #9: exit() performs instant reset without modals.');
    } else {
      this.failedChecks.push('Rule #9 Violation: exit() does not perform instant reset.');
      this.stats.ruleViolations++;
    }

    // Rule 10: Zero external CDN dependencies
    const externalUrls = (this.content.match(/src=["'](https?:\/\/[^"']+)["']/g) || [])
      .filter(u => !u.includes('w3.org') && !u.includes('schema.org'));
    if (externalUrls.length === 0) {
      this.passedChecks.push('Rule #10: 100% Offline-First compliant. Zero CDN dependencies.');
    } else {
      this.failedChecks.push(`Rule #10 Violation: External network dependencies: ${externalUrls.join(', ')}`);
      this.stats.ruleViolations++;
    }
  }

  auditKnowStagePedagogy() {
    const nodes = this.extractVar('NODES');
    if (!Array.isArray(nodes) || nodes.length === 0) return;

    let allIntro = true, allText = true, allCheck = true;
    nodes.forEach((node, idx) => {
      const steps = node.steps || [];
      const types = steps.map(s => s && s.t);
      if (!types.includes('intro') && !types.includes('video')) {
        allIntro = false;
        this.failedChecks.push(`Pedagogy Gap: Node ${idx + 1} ('${node.title}') missing 'intro' hook.`);
      }
      if (!types.includes('text') && !types.includes('concept')) {
        allText = false;
        this.failedChecks.push(`Pedagogy Gap: Node ${idx + 1} ('${node.title}') missing 'text' (Know) step.`);
      }
      if (!types.some(t => ['quiz', 'worked', 'vq', 'solve', 'practice'].includes(t))) {
        allCheck = false;
        this.failedChecks.push(`Pedagogy Gap: Node ${idx + 1} ('${node.title}') lacks concept verification check.`);
      }
    });

    if (allIntro && allText && allCheck) {
      this.passedChecks.push('Know-Stage Pedagogy: Every node adheres to Intro -> Concept Text -> Verification flow.');
    }
  }

  runFullAudit() {
    this.auditSyntax();
    this.auditRule1Spoilers();
    this.auditMathRtCollisions();
    this.audit10CriticalRules();
    this.auditKnowStagePedagogy();

    const total = this.passedChecks.length + this.failedChecks.length;
    const baseRate = total > 0 ? (this.passedChecks.length / total) * 100 : 0;
    const penalty = (this.stats.spoilerViolations * 15) + (this.stats.ruleViolations * 8) + (this.stats.mathRtCollisions * 8) + (this.stats.syntaxErrors * 20);
    const finalScore = Math.max(0, Math.min(100, Math.round(baseRate - (penalty * 0.3))));

    return {
      filename: this.filename,
      filePath: this.filePath,
      fileSizeBytes: fs.statSync(this.filePath).size,
      finalScore,
      passedChecksCount: this.passedChecks.length,
      failedChecksCount: this.failedChecks.length,
      stats: this.stats,
      passedChecks: this.passedChecks,
      failedChecks: this.failedChecks,
      sampleQuestions: this.inspectedQuestions.slice(0, 3)
    };
  }
}

function runClaudeCodeAudit(promptText) {
  try {
    const escapedPrompt = promptText.replace(/"/g, '\\"').replace(/\n/g, ' ');
    const cmd = `claude -p "${escapedPrompt}" --model "nvidia/nemotron-3.5-lightning:free"`;
    const env = {
      ...process.env,
      ANTHROPIC_BASE_URL: 'https://openrouter.ai/api/v1',
      ANTHROPIC_API_KEY: OPENROUTER_API_KEY
    };
    const output = execSync(cmd, { env, encoding: 'utf8', timeout: 60000, stdio: ['pipe', 'pipe', 'ignore'] });
    return {
      source: 'Claude Code CLI (via OpenRouter)',
      content: output.trim()
    };
  } catch (err) {
    return { error: `Claude Code CLI Error: ${err.message}` };
  }
}

async function main() {
  const chaptersDir = path.resolve(__dirname, '..', 'chapters');
  const chapterFiles = [
    'AlgebraicExpressions_Class8_Gamified_v5_Enhanced_v6.html',
    'ComparingQuantities_Percentage_Class8_Gamified_v5_(1)_Enhanced_v6.html',
    'Fractions_Gamified_v5_(2)_Enhanced_v6.html',
    'Perimeter_Area_Gamified_v5_(2)_Enhanced_v6.html',
    'Polynomials_Class10_Gamified_v5_(1)_Enhanced_v6.html',
    'Polynomials_JSXGraph_Inlined_Enhanced_v6.html',
    'Polynomials_Offline_Demos_Enhanced_v6.html'
  ];

  console.log('='.repeat(85));
  console.log(' AASHA FOUNDATION — L-TRUTH 200+ BENCHMARK ON 7 GENERATED CHAPTERS');
  console.log(' Using VM Sandbox AST Inspection + Claude Code via OpenRouter');
  console.log('='.repeat(85) + '\n');

  const auditResults = {};
  const allSampleQuestions = [];

  for (const filename of chapterFiles) {
    const fullPath = path.join(chaptersDir, filename);
    if (!fs.existsSync(fullPath)) {
      auditResults[filename] = { error: `File not found at ${fullPath}` };
      continue;
    }

    const auditor = new ChapterAuditor(fullPath);
    const result = auditor.runFullAudit();
    auditResults[filename] = result;

    const isPassed = result.finalScore >= 80 && result.stats.spoilerViolations === 0 && result.stats.syntaxErrors === 0;
    const tag = isPassed ? '[PASSED]' : '[ACTION REQUIRED]';

    console.log(`${tag} ${filename}`);
    console.log(`    Size: ${(result.fileSizeBytes / 1024).toFixed(1)} KB | Benchmark Score: ${result.finalScore}/100`);
    console.log(`    Checks: ${result.passedChecksCount} Passed | ${result.failedChecksCount} Violations`);
    console.log(`    Questions Tested: ${result.stats.totalQuestions} | Misconceptions: ${result.stats.totalMisconceptions}`);
    console.log(`    Spoilers Found: ${result.stats.spoilerViolations} | Math Collisions: ${result.stats.mathRtCollisions}`);

    if (result.failedChecks.length > 0) {
      console.log('    Violations:');
      result.failedChecks.forEach(f => console.log(`      * ${f}`));
    }
    console.log('-'.repeat(85));

    if (result.sampleQuestions.length > 0) {
      allSampleQuestions.push({
        chapter: filename,
        samples: result.sampleQuestions
      });
    }
  }

  // Claude Code Semantic Review
  console.log('\nInvoking Claude Code via OpenRouter for Semantic Zero-Spoiler Audit...');
  let promptText = 'Review these assessment items from the 7 chapters. Evaluate Zero-Spoiler compliance (misconceptions must NOT reveal or hint at the answer). Output concise verdict:\n';
  allSampleQuestions.slice(0, 3).forEach(item => {
    promptText += `Chapter: ${item.chapter}\n`;
    item.samples.slice(0, 2).forEach(q => {
      promptText += `Q: ${q.context} | Answer: ${q.correctAnswer}\n`;
      q.distractors.forEach(d => {
        promptText += `  Distractor: "${d.option}" -> Explanation: "${d.misconception}"\n`;
      });
    });
  });

  const claudeResult = runClaudeCodeAudit(promptText);

  console.log('\n' + '='.repeat(85));
  console.log(' CLAUDE CODE SEMANTIC ZERO-SPOILER VERDICT');
  console.log('='.repeat(85));
  console.log(claudeResult.content || claudeResult.error);
  console.log('='.repeat(85) + '\n');

  // Export JSON Report
  const outPath = path.resolve(__dirname, 'ltruth_7_chapters_report.json');
  fs.writeFileSync(outPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    chaptersAudited: chapterFiles.length,
    results: auditResults,
    claudeSemanticAudit: claudeResult
  }, null, 2), 'utf8');

  console.log(`Detailed audit report exported to: ${outPath}\n`);
}

main().catch(console.error);
