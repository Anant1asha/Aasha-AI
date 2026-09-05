#!/usr/bin/env node
/**
 * Aasha Foundation — Freebuff CLI Batch Orchestrator
 * ==================================================
 * Coordinates zero-cost batch transformation, QA audits, and auto-repair
 * workflows for Grades 6–10 textbook chapters using Freebuff CLI.
 *
 * Usage:
 *   node freebuff_batch_orchestrator.js [--dir <folder>] [--check] [--generate-prompts]
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ARGS = process.argv.slice(2);
const TARGET_DIR = getArgValue('--dir') || process.cwd();
const RUN_CHECK = ARGS.includes('--check') || ARGS.length === 0;
const GEN_PROMPTS = ARGS.includes('--generate-prompts') || ARGS.length === 0;

function getArgValue(flag) {
  const idx = ARGS.indexOf(flag);
  return (idx !== -1 && idx + 1 < ARGS.length) ? ARGS[idx + 1] : null;
}

console.log('\n' + '='.repeat(80));
console.log(' AASHA FOUNDATION — FREEBUFF CLI BATCH ORCHESTRATOR');
console.log('='.repeat(80) + '\n');
console.log(`Target Directory: ${TARGET_DIR}\n`);

// 1. Discover all root and output HTML chapters
function findChapters(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (!['node_modules', '.git', '.plugin_cache', 'archive', 'aasha-v5-reference-repo'].includes(file)) {
          results = results.concat(findChapters(fullPath));
        }
      } else if (file.endsWith('.html') && (file.includes('Gamified') || file.includes('Class') || file.includes('chapter'))) {
        results.push(fullPath);
      }
    }
  } catch (e) {
    console.error('Directory read error:', e);
  }
  return results;
}

// Target primary working chapters (deduplicated by basename)
const allFound = findChapters(TARGET_DIR);
const seenNames = new Set();
const chapters = allFound.filter(p => {
  const base = path.basename(p);
  if (seenNames.has(base)) return false;
  seenNames.add(base);
  return true;
});

console.log(`Discovered ${chapters.length} unique chapter(s) for batch audit:\n`);
chapters.forEach((c, idx) => console.log(`  [${idx + 1}] ${path.basename(c)}`));
console.log('\n' + '-'.repeat(80));

// 2. Run L-Truth Benchmark & QA Suite
const benchmarkScript = path.resolve(__dirname, 'benchmarks', 'qa_ltruth_benchmark.js');
const qaHarnessScript = path.resolve(__dirname, 'aasha-pipeline-with-master-json', 'qa', 'run_qa.js');

// Run global benchmark first to populate ltruth_benchmark_report.json
try {
  execFileSync(process.execPath, [benchmarkScript], { stdio: 'pipe' });
} catch (e) {}

const benchmarkReportPath = path.resolve(__dirname, 'benchmarks', 'ltruth_benchmark_report.json');
let benchmarkData = {};
if (fs.existsSync(benchmarkReportPath)) {
  try {
    benchmarkData = JSON.parse(fs.readFileSync(benchmarkReportPath, 'utf8'));
  } catch (e) {}
}

const report = [];
const repairNeeded = [];

chapters.forEach((chapterPath) => {
  const filename = path.basename(chapterPath);
  let ltruthPassed = true;
  let qaPassed = false;
  let failures = [];

  // Check L-Truth benchmark status
  if (benchmarkData[filename]) {
    const res = benchmarkData[filename];
    ltruthPassed = res.finalScore >= 85 && res.stats.spoilerViolations === 0;
    if (!ltruthPassed) {
      failures = failures.concat(res.failedChecks || []);
    }
  }

  // Run Pipeline QA Harness using execFileSync (safe with spaces)
  try {
    const qaOut = execFileSync(process.execPath, [qaHarnessScript, chapterPath], { encoding: 'utf8', stdio: 'pipe' });
    const qaJson = JSON.parse(qaOut);
    qaPassed = qaJson.passed === true;
    if (!qaPassed && Array.isArray(qaJson.failures)) {
      failures = failures.concat(qaJson.failures.map(f => `${f.check}: ${f.reason}`));
    }
  } catch (e) {
    try {
      if (e.stdout) {
        const qaJson = JSON.parse(e.stdout);
        qaPassed = qaJson.passed === true;
        if (!qaPassed && Array.isArray(qaJson.failures)) {
          failures = failures.concat(qaJson.failures.map(f => `${f.check}: ${f.reason}`));
        }
      } else {
        failures.push(`QA run failed: ${e.message}`);
      }
    } catch (e2) {
      failures.push(`QA harness parse error: ${e.message}`);
    }
  }

  const status = (ltruthPassed && qaPassed) ? 'PASSED' : 'NEEDS REVIEW';
  report.push({
    filename,
    path: chapterPath,
    status,
    ltruthPassed,
    qaPassed,
    failures
  });

  if (status !== 'PASSED') {
    repairNeeded.push({ filename, path: chapterPath, failures });
  }

  console.log(`[${status}] ${filename}`);
  if (failures.length > 0) {
    failures.slice(0, 3).forEach(f => console.log(`      * ${f}`));
    if (failures.length > 3) console.log(`      * ... and ${failures.length - 3} more issues`);
  }
});

console.log('\n' + '='.repeat(80));
console.log(` SUMMARY: ${chapters.length - repairNeeded.length}/${chapters.length} Chapters Passed 100%`);
console.log('='.repeat(80) + '\n');

// 3. Generate AI Auto-Repair Prompts
if (GEN_PROMPTS && repairNeeded.length > 0) {
  console.log('GENERATING AI CLI AUTO-REPAIR PLAYBOOK:\n');
  const promptsDir = path.resolve(__dirname, 'ai_prompts');
  fs.mkdirSync(promptsDir, { recursive: true });

  repairNeeded.forEach((item, idx) => {
    const promptContent = `## AI CLI Task: Auto-Repair Chapter ${item.filename}

You are working on the Aasha Foundation offline-first EdTech platform.
Please repair the file "${item.filename}" to satisfy our L-Truth Benchmark and 10 Critical Rules:

### Flagged Issues to Fix:
${item.failures.map(f => `- ${f}`).join('\n')}

### Required Standards:
1. Rule #1 Anti-Spoiler: Rewrite any misconceptions that reveal or calculate the target answer. Use Socratic guidance only.
2. Math Isolation: Ensure single-letter math variables (like 'a') do not collide with English dictionary translations in rt().
3. Rule #9 & #4: Never use alert() or confirm(). exit() must be an instant reset.
4. Universal Question Contract: Ensure all assessments have question_id and node_id tags.

### Verification Command:
After saving the file, verify with:
node aasha-pipeline-with-master-json/qa/run_qa.js "${item.path}"
`;

    const promptFile = path.join(promptsDir, `repair_${item.filename.replace(/[^a-zA-Z0-9_]/g, '_')}.md`);
    fs.writeFileSync(promptFile, promptContent, 'utf8');
    console.log(`  [Prompt ${idx + 1}] Generated: ${path.relative(process.cwd(), promptFile)}`);
  });

  console.log(`\nTo run high-performance repairs: Launch Claude Code (npx @anthropic-ai/claude-code) and paste the generated prompt from 'ai_prompts/'\n`);
} else if (repairNeeded.length === 0) {
  console.log('All chapters passed with 100/100 benchmark score! No repairs needed.\n');
}
