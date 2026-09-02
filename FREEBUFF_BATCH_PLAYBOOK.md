# Freebuff CLI Batch Workflow Playbook (Grades 6–10)
**Annanth Aasha Foundation — Zero-Cost Curriculum Transformation**

---

## 1. What This Workflow Does
This playbook allows you to transform entire textbook PDF chapters (Grades 6 through 10) into fully gamified, offline HTML modules with interactive simulations, and automatically repair them without spending a single rupee on paid AI tokens.

It pairs **Freebuff CLI** (which runs unlimited heavy coding tasks for free) with our automated **L-Truth Benchmark & QA Harness** (which checks every rule, spoiler, and formula in seconds).

---

## 2. Quick Setup & Context for Freebuff
Whenever you open a new terminal window to work with Freebuff:
1. Open your command terminal.
2. Navigate to your project folder:
   ```bash
   cd "C:\Users\vanda\Downloads\ai tool build draft"
   ```
3. Launch Freebuff:
   ```bash
   freebuff
   ```
4. Paste the standard Aasha project intro into Freebuff:
   > *This is the Aasha EdTech project — offline-first bilingual learning platform for Class 1-10, all Indian boards. Folders: chapters (offline HTML), server, dashboard, packages. Keep chapters fully self-contained, preserve LLE API (rt, applyLLE, showWord), enforce zero-spoiler misconceptions, and never break offline-first isolation.*

---

## 3. The 3-Step Batch Transformation Cycle

### Step 1: Run the Batch Auditor
Run our zero-cost offline auditor to check all chapters in your workspace:
```bash
node freebuff_batch_orchestrator.js
```
What this does:
- Scans all HTML chapters in your folder.
- Runs the 10 Critical QA Rules and the L-Truth Anti-Spoiler filter.
- Prints a clear status report: **[PASSED]** or **[ACTION REQUIRED]**.
- If any chapter has issues, it automatically creates a ready-to-paste repair prompt in the `freebuff_prompts/` folder.

---

### Step 2: Auto-Repairing Flagged Chapters in Freebuff
If any chapter needs action:
1. Open the generated prompt from the `freebuff_prompts/` folder (for example, `repair_AlgebraicExpressions.md`).
2. Copy the contents and paste them directly into your running `freebuff` terminal session.
3. Freebuff CLI will read the chapter, rewrite the misconceptions to be strictly Socratic, insulate math variables, and save the file.

---

### Step 3: Verify the Fix
After Freebuff finishes editing, verify the fix with a single command:
```bash
node aasha-pipeline-with-master-json/qa/run_qa.js "<path-to-chapter.html>"
```
When you see `passed: true (31/31 checks passed)`, the chapter is officially verified and production-ready!

---

## 4. Full Synthesis Mode with Plugins (JSXGraph, Mermaid & PhET)
When building high-grade chapters (Grades 6–10) that require dynamic graphs, flowcharts, or science experiments:
- **JSXGraph:** Embeds geometry and algebra function plotters directly in the HTML.
- **Mermaid.js:** Embeds concept diagrams and flowcharts.
- **PhET Simulations:** Embeds full physics and chemistry simulations via base64 data iframes.
- **Universal Question Contract & TEAS:** All student answers are recorded into an offline event outbox, with the TEAS engine deterministically managing concept mastery (60% historical + 40% recent accuracy) and progression decisions (`learn`, `remediate`, `practice`, `advance`).
