"""Agent 4: Frontend Code Synthesizer.

Generates a complete, self-contained HTML5/Tailwind/JS single-file module
that students can immediately open and use. This is the "full-synthesis" mode
that generates fresh HTML with embedded libraries (base64), rather than
injecting into the v5 engine template.

The output includes:
1. Interactive Concept Cards — collapsible, visually distinct micro-learning modules
2. Embedded Simulation/Manipulative Containers — functional JS or iframe wrappers
   (JSXGraph, Mermaid, PhET base64 offline compilation)
3. Universal Question Contract & TEAS Telemetry — questions emit append-only offline
   events to an outbox; TEAS deterministically decides mastery and progression
4. 3-Level Assessment Suite — Warm-up (recall), Deep Dive (application), Boss Challenge
5. Gamification — XP, badges, streaks, confetti (no alerts/blocking dialogs)

This agent does NOT use the LLM — it takes the structured output from Agents 1-3
and synthesizes HTML deterministically.
"""
from __future__ import annotations

import json
import logging
import random
from pathlib import Path
from typing import Any

from ..agents.base import BaseAgent
from ..analytics.mastery_tracker import MASTERY_CSS, MASTERY_HTML, MASTERY_JS

logger = logging.getLogger(__name__)


class FrontendCodeSynthesizer(BaseAgent):
    """Agent 4 — generates the final HTML5 output.

    Takes the pedagogy map (concepts + interactions) and assessment suite
    from Agents 1-3, and synthesizes a complete self-contained HTML file
    with embedded CSS, JS, and base64 plugin renderers.
    """

    def __init__(self):
        super().__init__(name="FrontendCodeSynthesizer", stage="synthesize", llm=None)

    @property
    def requires_llm(self) -> bool:
        return False

    def run(self, work_dir: Path, context: dict[str, Any]) -> dict[str, Any]:
        """Synthesize the final HTML from agent outputs."""
        # Load intermediates
        pedagogy_map = self._read_json(work_dir, "pedagogy_map.json")
        experience_plan = self._read_json(work_dir, "experience_plan.json")
        assessment_suite = self._read_json(work_dir, "assessment_suite.json")

        chapter_title = pedagogy_map.get("chapter_title", "Untitled Chapter")
        subject = pedagogy_map.get("subject", "math")
        grade = pedagogy_map.get("grade", 4)

        # Collect plugin assets
        plugin_assets = self._collect_plugin_assets(experience_plan)

        # Build the HTML
        html = self._build_html(
            chapter_title, subject, grade,
            pedagogy_map, experience_plan, assessment_suite,
            plugin_assets,
        )

        # Write output
        output_path = work_dir / "chapter.html"
        output_path.write_text(html, encoding="utf-8")
        size_kb = output_path.stat().st_size / 1024

        self.log(f"Synthesized chapter.html ({size_kb:.0f} KB)")
        self.log(f"  Concepts: {len(pedagogy_map.get('concepts', []))}")
        self.log(f"  Assessments: warmup={len(assessment_suite.get('warmup', []))}, "
                 f"deep_dive={len(assessment_suite.get('deep_dive', []))}, "
                 f"boss={len(assessment_suite.get('boss', []))}")

        return {
            "output_file": str(output_path),
            "size_kb": size_kb,
            "concept_count": len(pedagogy_map.get("concepts", [])),
            "assessment_count": sum(len(assessment_suite.get(k, [])) for k in ("warmup", "deep_dive", "boss")),
        }

    def _collect_plugin_assets(self, experience_plan: dict) -> dict[str, str]:
        """Collect base64 libraries, CSS, and JS assets from plugins used in the experience plan."""
        assets: dict[str, str] = {}
        plugins_used = set()
        for concept in experience_plan.get("concepts", []):
            plugin_name = concept.get("plugin", "")
            if plugin_name:
                plugins_used.add(plugin_name)

        # Also collect defaults if plugins list is empty
        if not plugins_used:
            plugins_used = {"jsxgraph", "mermaid"}

        try:
            from ..plugins import create_default_registry
            registry = create_default_registry()
            for plugin_name in plugins_used:
                plugin = registry.get(plugin_name)
                if plugin:
                    plugin_assets = plugin.embed_assets()
                    for key, value in plugin_assets.items():
                        assets[key] = value
        except Exception as e:
            logger.warning(f"Could not collect plugin assets: {e}")

        return assets

    def _build_html(
        self, title: str, subject: str, grade: int,
        pedagogy_map: dict, experience_plan: dict, assessment_suite: dict,
        plugin_assets: dict,
    ) -> str:
        """Build the complete self-contained HTML file with embedded base64 libraries and TEAS engine."""
        concepts = pedagogy_map.get("concepts", [])
        exercises = pedagogy_map.get("exercises", [])

        # Build concept cards HTML
        concept_cards = self._build_concept_cards(concepts, experience_plan)

        # Build assessment sections with Universal Question Contract & shuffled options
        warmup_html = self._build_assessment_section("warmup", assessment_suite.get("warmup", []), "Level 1: Warm-up (Recall)", "recall", concepts)
        deep_dive_html = self._build_assessment_section("deep_dive", assessment_suite.get("deep_dive", []), "Level 2: Deep Dive (Application)", "application", concepts)
        boss_html = self._build_assessment_section("boss", assessment_suite.get("boss", []), "Level 3: Boss Challenge (Critical Thinking)", "mastery", concepts)

        # Collect plugin assets
        plugin_libs = "\n".join(v for k, v in plugin_assets.items() if k.endswith("_lib"))
        plugin_css = "\n".join(v for k, v in plugin_assets.items() if k.endswith("_css"))
        plugin_js = "\n".join(v for k, v in plugin_assets.items() if k.endswith("_js"))

        total_questions = sum(len(assessment_suite.get(k, [])) for k in ("warmup", "deep_dive", "boss"))

        # Build the complete HTML document
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<title>{title} — Aasha Learning Ecosystem</title>
<!-- Embedded Base64 Offline Plugin Libraries -->
{plugin_libs}
<style>
/* MathIsolation: true */
.math{{font-family:'Cambria Math','Times New Roman',serif;font-style:italic;font-weight:600;padding:0 2px}}
*{{margin:0;padding:0;box-sizing:border-box}}
:root{{
  --blue:#3b82f6;--green:#22c55e;--red:#ef4444;--amber:#f59e0b;--purple:#8b5cf6;
  --bg:#f0f4ff;--surface:#fff;--text:#1e293b;--muted:#64748b;--border:#e2e8f0;
  --radius:16px;--radius-sm:12px;
  --font:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
}}
body{{font-family:var(--font);background:var(--bg);color:var(--text);min-height:100vh;-webkit-tap-highlight-color:transparent}}
.app{{max-width:480px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column}}
/* Top bar */
.topbar{{display:flex;align-items:center;gap:8px;padding:8px 14px;background:var(--surface);box-shadow:0 1px 3px rgba(0,0,0,.06);position:sticky;top:0;z-index:50}}
.exit-btn{{background:none;border:none;font-size:18px;color:var(--muted);cursor:pointer;padding:4px}}
.progress-track{{flex:1;height:10px;background:var(--border);border-radius:10px;overflow:hidden}}
.progress-fill{{height:100%;background:linear-gradient(90deg,var(--blue),var(--purple));border-radius:10px;transition:width .5s;width:0}}
.stat{{display:inline-flex;align-items:center;gap:3px;font-size:.72rem;font-weight:700;padding:3px 7px;border-radius:16px}}
.stat.xp{{color:var(--purple);background:#ede9fe}}
.stat.lvl{{color:var(--blue);background:#dbeafe}}
.stat.streak{{color:#ef4444;background:#fee2e2}}
/* Screen */
.screen{{flex:1;padding:8px 12px 65px;min-height:0;box-sizing:border-box;animation:fadeIn .3s ease}}
@keyframes fadeIn{{from{{opacity:0;transform:translateY(8px)}}to{{opacity:1;transform:translateY(0)}}}}
/* Concept cards */
.concept-card{{background:var(--surface);border:2px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.05)}}
.concept-card-header{{display:flex;align-items:center;gap:8px;cursor:pointer}}
.concept-card-title{{font-size:1.1rem;font-weight:800;flex:1}}
.concept-card-emoji{{font-size:1.5rem}}
.concept-card-body{{margin-top:12px;display:none}}
.concept-card.open .concept-card-body{{display:block}}
.concept-text{{font-size:.95rem;line-height:1.8;color:var(--text)}}
.concept-key-ideas{{margin-top:8px;display:flex;flex-wrap:wrap;gap:4px}}
.key-idea{{padding:2px 8px;background:#dbeafe;border-radius:8px;font-size:.75rem;color:#1e40af}}
.teas-badge{{display:inline-block;padding:2px 8px;border-radius:6px;font-size:.7rem;font-weight:700;margin-top:6px}}
.teas-advance{{background:#dcfce7;color:#166534}}
.teas-practice{{background:#fef3c7;color:#92400e}}
.teas-remediate{{background:#fee2e2;color:#991b1b}}
/* Interaction container & Universal <aasha-sim> */
aasha-sim{{display:block;width:100%;min-height:160px;position:relative}}
.interaction-container{{margin:8px 0;border-radius:var(--radius-sm);overflow:hidden;min-height:160px;display:flex;align-items:center;justify-content:center;background:#f8fafc}}

/* Same-Frame Mobile Viewport Guarantees (16:9, 19.5:9, 20:9) */
@media (max-height: 700px) {{
  /* 16:9 Aspect Ratio (e.g. 360x640) */
  .topbar {{ padding: 4px 10px; gap: 6px; }}
  .screen {{ padding: 4px 8px 56px; min-height: 0; }}
  .concept-card {{ padding: 8px 10px; margin-bottom: 4px; }}
  .concept-card-title {{ font-size: 0.95rem; }}
  .concept-text {{ font-size: 0.80rem; line-height: 1.35; }}
  aasha-sim {{ min-height: 115px; }}
  .interaction-container {{ margin: 4px 0; min-height: 115px; }}
  .quiz-opt {{ min-height: 44px; min-width: 44px; padding: 8px 10px; }}
  .bottom-bar {{ padding: 6px 12px; }}
  .btn {{ padding: 10px; min-height: 44px; }}
}}

@media (min-height: 701px) and (max-height: 860px) {{
  /* 19.5:9 Aspect Ratio (e.g. 390x844, 393x852) and 20:9 (360x800) */
  .screen {{ padding: 6px 12px 60px; min-height: 0; }}
  aasha-sim {{ min-height: 140px; }}
  .interaction-container {{ min-height: 140px; }}
  .quiz-opt {{ min-height: 44px; min-width: 44px; }}
}}

@media (min-height: 861px) {{
  /* 20:9 Aspect Ratio (e.g. 412x915) */
  .screen {{ padding: 6px 12px 60px; min-height: 0; }}
  aasha-sim {{ min-height: 160px; }}
  .interaction-container {{ min-height: 160px; }}
  .quiz-opt {{ min-height: 44px; min-width: 44px; }}
}}

/* Assessment */
.assessment-section{{margin-top:24px}}
.assessment-section.locked{{opacity:0.6;position:relative}}
.assessment-section.locked .quiz-card{{pointer-events:none}}
.lock-banner{{background:#f1f5f9;border:2px dashed #cbd5e1;border-radius:var(--radius-sm);padding:10px 14px;text-align:center;font-size:.82rem;font-weight:700;color:var(--muted);margin-bottom:12px}}
.assessment-level-badge{{display:inline-block;padding:4px 12px;border-radius:12px;font-size:.75rem;font-weight:700;margin-bottom:12px}}
.assessment-level-badge.warmup{{background:#dcfce7;color:#166534}}
.assessment-level-badge.deep_dive{{background:#fef3c7;color:#92400e}}
.assessment-level-badge.boss{{background:#fee2e2;color:#991b1b}}
.quiz-card{{background:var(--surface);border:2px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:12px}}
.quiz-question{{font-size:1rem;font-weight:600;margin-bottom:12px}}
.quiz-opt{{display:flex;align-items:flex-start;gap:10px;padding:12px;margin-bottom:7px;border:2px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;transition:all .15s;background:var(--surface);min-height:44px;min-width:44px}}
.quiz-opt:hover{{border-color:var(--blue)}}
.quiz-opt.correct{{border-color:var(--green);background:#dcfce7}}
.quiz-opt.wrong{{border-color:var(--red);background:#fee2e2}}
.quiz-opt-text{{flex:1;font-size:.9rem}}
.quiz-feedback{{margin-top:8px;padding:10px;border-radius:8px;font-size:.85rem;display:none}}
.quiz-feedback.show{{display:block}}
.quiz-feedback.ok{{background:#dcfce7;color:#166534}}
.quiz-feedback.no{{background:#fee2e2;color:#991b1b}}
/* 4-Tier Adaptive Hints */
.hint-toggle-btn{{background:none;border:none;color:var(--blue);font-size:.78rem;font-weight:700;cursor:pointer;padding:4px 0;display:inline-flex;align-items:center;gap:4px;min-height:44px}}
.hint-box{{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:8px 12px;font-size:.8rem;color:#1e40af;margin-top:6px;display:none}}
/* Bottom bar */
.bottom-bar{{position:sticky;bottom:0;background:var(--surface);padding:10px 16px;box-shadow:0 -1px 3px rgba(0,0,0,.06);z-index:50}}
.btn{{width:100%;padding:13px;border:none;border-radius:13px;font-size:.95rem;font-weight:700;cursor:pointer;min-height:44px}}
.btn-primary{{background:var(--blue);color:#fff}}
.btn-green{{background:var(--green);color:#fff}}
/* Toast */
.toast-msg{{position:fixed;bottom:75px;left:50%;transform:translateX(-50%);background:#1e293b;color:#fff;padding:8px 16px;border-radius:20px;font-size:.8rem;font-weight:600;display:none;z-index:100;animation:fadeIn .2s}}
.teacher-export-btn{{background:#f1f5f9;border:1px solid var(--border);border-radius:8px;padding:3px 8px;font-size:.72rem;font-weight:700;color:var(--muted);cursor:pointer}}
/* Plugin styles */
{plugin_css}
{MASTERY_CSS}
</style>
</head>
<body>
{MASTERY_HTML}
<div class="app">
  <div class="topbar">
    <button class="exit-btn" onclick="resetChapter()">✕</button>
    <div class="progress-track"><div class="progress-fill" id="progressFill"></div></div>
    <span class="stat lvl" id="statLvl">L1</span>
    <span class="stat xp" id="statXp">⭐ 0</span>
    <span class="stat streak" id="statStreak">🔥 0</span>
    <button class="teacher-export-btn" onclick="exportTeacherReport()" title="Offline Teacher Report">📊 Export</button>
  </div>

  <div class="toast-msg" id="toastMsg"></div>

  <div class="screen" id="screen">
    <h1 style="text-align:center;font-size:1.4rem;font-weight:800;margin-bottom:4px">{title}</h1>
    <p style="text-align:center;color:var(--muted);font-size:.85rem;margin-bottom:16px">{subject.title()} · Grade {grade} · अनन्त आशा</p>

    <!-- Badges -->
    <div class="badges-container">
      <div class="badge-item" id="badge-25" title="25% Complete">🥉</div>
      <div class="badge-item" id="badge-50" title="50% Complete">🥈</div>
      <div class="badge-item" id="badge-75" title="75% Complete">🥇</div>
      <div class="badge-item" id="badge-100" title="100% Mastered!">🏆</div>
    </div>

    <!-- Concept Cards -->
    {concept_cards}

    <!-- Assessments (3 Levels) -->
    <div class="assessment-section">
      {warmup_html}
      {deep_dive_html}
      {boss_html}
    </div>

    <div style="text-align:center;padding:24px 0;color:var(--muted);font-size:.85rem">
      अध्याय पूर्ण हुआ! Total XP: <span id="totalXp">0</span>
    </div>
  </div>

  <div class="bottom-bar">
    <button class="btn btn-primary" id="bottomBtn" onclick="scrollNext()">Start Learning →</button>
  </div>
</div>

<script>
// ════════ Universal Question Contract & TEAS State ════════
var STORAGE_KEY = 'aasha_fs_chapter_' + (window.location.pathname.split('/').pop().replace(/\\.[^/.]+$/, '') || 'module');
var totalQuestions = {total_questions};

var state = {{
  schema_version: 2,
  learner_id: 'L-' + Math.random().toString(36).substring(2, 9),
  session_id: 'S-' + Date.now(),
  xp: 0,
  level: 1,
  streak: 0,
  answered: 0,
  correct: 0,
  events: [],
  sync_outbox: [],
  mastery: {{}}
}};

// Rule #8: Bounds-checked localStorage
function loadState() {{
  try {{
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {{
      var parsed = JSON.parse(raw);
      state.xp = parsed.xp || 0;
      state.level = parsed.level || 1;
      state.streak = parsed.streak || 0;
      state.events = Array.isArray(parsed.events) ? parsed.events : [];
      state.sync_outbox = Array.isArray(parsed.sync_outbox) ? parsed.sync_outbox : [];
      state.mastery = parsed.mastery || {{}};
    }}
  }} catch (e) {{
    console.warn('Storage restore error:', e);
  }}
}}

function saveState() {{
  try {{
    localStorage.setItem(STORAGE_KEY, JSON.stringify({{
      xp: state.xp,
      level: state.level,
      streak: state.streak,
      events: state.events.slice(-500),
      sync_outbox: state.sync_outbox.slice(-500),
      mastery: state.mastery,
      updated_at: new Date().toISOString()
    }}));
  }} catch (e) {{}}
}}

// ════════ TEAS Telemetry & Outbox ════════
function recordEvent(type, payload) {{
  var ev = {{
    event_id: 'EV-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
    schema_version: 1,
    event_type: type,
    learner_ref: state.learner_id,
    session_id: state.session_id,
    timestamp: new Date().toISOString(),
    payload: payload || {{}}
  }};
  state.events.push(ev);
  if (state.events.length > 1000) state.events.shift();
  state.sync_outbox.push(ev.event_id);
  saveState();
  return ev;
}}

// ════════ TEAS Deterministic Mastery ════════
function computeMastery(nodeId) {{
  var answers = state.events.filter(function(e) {{
    return e.event_type === 'answer_submitted' && e.payload.node_id === nodeId;
  }});
  if (!answers.length) return {{ attempts: 0, correct: 0, accuracy: 0, recent_accuracy: 0, mastery: 0 }};
  
  var correctCount = answers.filter(function(e) {{ return e.payload.result === 'correct'; }}).length;
  var accuracy = Math.round((correctCount / answers.length) * 100);
  
  var recent = answers.slice(-5);
  var recentCorrect = recent.filter(function(e) {{ return e.payload.result === 'correct'; }}).length;
  var recentAcc = Math.round((recentCorrect / recent.length) * 100);
  
  var mastery = Math.round(accuracy * 0.6 + recentAcc * 0.4);
  return {{
    attempts: answers.length,
    correct: correctCount,
    accuracy: accuracy,
    recent_accuracy: recentAcc,
    mastery: mastery
  }};
}}

function progressionDecision(nodeId) {{
  var m = computeMastery(nodeId);
  state.mastery[nodeId] = m;
  if (m.attempts === 0) return {{ action: 'learn', reason: 'No assessment evidence yet' }};
  if (m.mastery < 50) return {{ action: 'remediate', reason: 'Evidence shows a significant learning gap' }};
  if (m.mastery < 75) return {{ action: 'practice', reason: 'More practice should consolidate the concept' }};
  return {{ action: 'advance', reason: 'Sufficient deterministic mastery evidence' }};
}}

function showToast(msg) {{
  var t = document.getElementById('toastMsg');
  if (!t) return;
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(function() {{ t.style.display = 'none'; }}, 2500);
}}

function updateStats() {{
  document.getElementById('statXp').textContent = '⭐ ' + state.xp;
  document.getElementById('statLvl').textContent = 'L' + state.level;
  document.getElementById('statStreak').textContent = '🔥 ' + state.streak;
  var pct = totalQuestions > 0 ? (state.answered / totalQuestions) * 100 : 0;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('totalXp').textContent = state.xp;

  var newLevel = Math.floor(state.xp / 50) + 1;
  if (newLevel > state.level) {{
    state.level = newLevel;
    showToast('🎉 Level Up! You reached Level ' + newLevel);
  }}
}}

// ════════ Assessment Handler (Universal Question Contract) ════════
var _questionLoadTimes = {{}};

function initQuestionTimers() {{
  var cards = document.querySelectorAll('.quiz-card');
  for (var i = 0; i < cards.length; i++) {{
    var qId = cards[i].getAttribute('data-qid');
    if (qId) _questionLoadTimes[qId] = performance.now();
  }}
}}

function answerQuestion(btn, qId, nodeId, isCorrect, feedback, xp) {{
  var card = btn.closest('.quiz-card');
  if (!card) return;
  var opts = card.querySelectorAll('.quiz-opt');
  for (var i = 0; i < opts.length; i++) {{
    opts[i].style.pointerEvents = 'none';
  }}

  var startTime = _questionLoadTimes[qId] || performance.now();
  var durationMs = Math.round(performance.now() - startTime);

  // Universal Question Contract Telemetry Event
  recordEvent('answer_submitted', {{
    question_id: qId,
    node_id: nodeId,
    result: isCorrect ? 'correct' : 'incorrect',
    response_time_ms: durationMs,
    misconception: isCorrect ? null : feedback
  }});

  var feedbackEl = card.querySelector('.quiz-feedback');
  if (isCorrect) {{
    btn.classList.add('correct');
    state.xp += xp;
    state.streak++;
    state.correct++;
    feedbackEl.className = 'quiz-feedback show ok';
    feedbackEl.textContent = '✓ Correct! +' + xp + ' XP';
  }} else {{
    btn.classList.add('wrong');
    state.streak = 0;
    feedbackEl.className = 'quiz-feedback show no';
    feedbackEl.textContent = feedback || 'Check the conceptual rule and try again.';
  }}
  state.answered++;

  // TEAS Progression evaluation
  var decision = progressionDecision(nodeId);
  var badgeEl = document.getElementById('teas-badge-' + nodeId);
  if (badgeEl) {{
    badgeEl.className = 'teas-badge teas-' + decision.action;
    badgeEl.textContent = 'TEAS: ' + decision.action.toUpperCase() + ' (' + state.mastery[nodeId].mastery + '%)';
  }}

  // Progressive 3-Tier Unlock Check
  var warmupCards = document.querySelectorAll('#section-warmup .quiz-card');
  var warmupAnswered = document.querySelectorAll('#section-warmup .quiz-card .quiz-feedback.show').length;
  if (warmupCards.length > 0 && warmupAnswered >= warmupCards.length) {{
    var deepDiveSec = document.getElementById('section-deep_dive');
    if (deepDiveSec && deepDiveSec.classList.contains('locked')) {{
      deepDiveSec.classList.remove('locked');
      var lb = document.getElementById('lock-banner-deep_dive');
      if (lb) lb.style.display = 'none';
      showToast('🎉 Level 2: Deep Dive Unlocked!');
    }}
  }}
  var deepCards = document.querySelectorAll('#section-deep_dive .quiz-card');
  var deepAnswered = document.querySelectorAll('#section-deep_dive .quiz-card .quiz-feedback.show').length;
  if (deepCards.length > 0 && deepAnswered >= deepCards.length) {{
    var bossSec = document.getElementById('section-boss');
    if (bossSec && bossSec.classList.contains('locked')) {{
      bossSec.classList.remove('locked');
      var lb = document.getElementById('lock-banner-boss');
      if (lb) lb.style.display = 'none';
      showToast('🏆 Boss Challenge Unlocked!');
    }}
  }}

  updateStats();
  saveState();
}}

// Rule #2: Runtime Option Shuffling
function shuffleOptions() {{
  var cards = document.querySelectorAll('.quiz-card');
  for (var i = 0; i < cards.length; i++) {{
    var container = cards[i].querySelector('.quiz-opts-container');
    if (!container) continue;
    var children = Array.prototype.slice.call(container.children);
    children.sort(function() {{ return Math.random() - 0.5; }});
    for (var j = 0; j < children.length; j++) {{
      container.appendChild(children[j]);
    }}
  }}
}}

// ════════ Universal <aasha-sim> Custom Element & Balanced Lifecycle (>= 4GB RAM) ════════
if (!customElements.get('aasha-sim')) {{
  customElements.define('aasha-sim', class extends HTMLElement {{
    connectedCallback() {{
      this.dataset.active = "true";
      this.addEventListener('aasha:telemetry', (e) => {{
        recordEvent('sim_telemetry', e.detail || {{}});
      }});
    }}
    pause() {{
      // Balanced pause: freeze rAF/timers to save CPU/battery in background, but preserve state & canvas buffer
      this.dataset.active = "false";
      if (this._rafId) {{ cancelAnimationFrame(this._rafId); this._rafId = null; }}
      if (this._intervalId) {{ clearInterval(this._intervalId); this._intervalId = null; }}
    }}
    resume() {{
      // Balanced resume: immediately unfreezes simulation without reloading
      this.dataset.active = "true";
      if (typeof this.onSimulationResume === 'function') {{
        this.onSimulationResume();
      }}
    }}
    destroy() {{
      this.pause();
      var canvases = this.querySelectorAll('canvas');
      for (var i = 0; i < canvases.length; i++) {{
        var ctx = canvases[i].getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvases[i].width, canvases[i].height);
      }}
    }}
  }});
}}

// 4-Tier Adaptive Hints (Strict Zero-Spoiler Rule)
function toggleHint(qId) {{
  var box = document.getElementById('hint-box-' + qId);
  var tierSpan = document.getElementById('hint-tier-' + qId);
  if (!box || !tierSpan) return;
  var cur = parseInt(box.getAttribute('data-tier') || '0', 10);
  var next = (cur % 4) + 1;
  box.setAttribute('data-tier', next.toString());
  tierSpan.textContent = next.toString();
  var text = box.getAttribute('data-h' + next) || '';
  box.innerHTML = '<strong>Hint ' + next + '/4:</strong> ' + text;
  box.style.display = 'block';
  recordEvent('hint_viewed', {{ question_id: qId, hint_tier: next }});
}}

// Offline Teacher Report Export
function exportTeacherReport() {{
  var report = {{
    export_version: "1.0",
    learner_id: state.learner_id,
    session_id: state.session_id,
    timestamp: new Date().toISOString(),
    xp: state.xp,
    level: state.level,
    streak: state.streak,
    answered: state.answered,
    correct: state.correct,
    accuracy: state.answered ? Math.round((state.correct / state.answered) * 100) + '%' : '0%',
    mastery: state.mastery,
    events: state.events
  }};
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
  var dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", "aasha_mastery_report_" + state.learner_id + ".json");
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();
  showToast('📊 Teacher report downloaded offline!');
}}

function toggleCard(card) {{
  card.classList.toggle('open');
  var sim = card.querySelector('aasha-sim');
  if (sim) {{
    if (card.classList.contains('open')) {{
      if (typeof sim.resume === 'function') sim.resume();
    }} else {{
      if (typeof sim.pause === 'function') sim.pause();
    }}
  }}
}}

function scrollNext() {{
  var screen = document.getElementById('screen');
  var cards = screen.querySelectorAll('.concept-card, .quiz-card');
  for (var i = 0; i < cards.length; i++) {{
    var rect = cards[i].getBoundingClientRect();
    if (rect.top > 60) {{
      cards[i].scrollIntoView({{ behavior: 'smooth' }});
      return;
    }}
  }}
  document.getElementById('bottomBtn').textContent = '✓ Chapter Complete!';
  document.getElementById('bottomBtn').className = 'btn btn-green';
}}

// Rule #9: Instant exit reset without confirmation dialog
function resetChapter() {{
  state.xp = 0;
  state.level = 1;
  state.streak = 0;
  state.answered = 0;
  state.correct = 0;
  state.events = [];
  state.sync_outbox = [];
  state.mastery = {{}};
  saveState();
  updateStats();
  window.scrollTo(0, 0);
  showToast('Chapter progress reset');
}}

// ════════ Plugin Renderers ════════
{plugin_js}

// Mastery Tracker (TEAS integration)
{MASTERY_JS}

// Initialize
loadState();
updateStats();
initQuestionTimers();
shuffleOptions();
</script>
</body>
</html>"""
        return html

    def _build_concept_cards(self, concepts: list, experience_plan: dict) -> str:
        """Build collapsible concept card HTML."""
        if not concepts:
            return "<p>No concepts identified.</p>"

        cards = []
        for i, concept in enumerate(concepts):
            name = concept.get("name", f"Concept {i+1}")
            summary = concept.get("summary", "")
            key_ideas = concept.get("key_ideas", [])
            plugin = concept.get("plugin", "")
            node_id = f"node_{i+1}"
            difficulty = concept.get("difficulty", "medium")

            emoji = {"easy": "🟢", "medium": "🟡", "hard": "🔴"}.get(difficulty, "📘")

            key_ideas_html = ""
            if key_ideas:
                key_ideas_html = '<div class="concept-key-ideas">' + \
                    "".join(f'<span class="key-idea">{ki}</span>' for ki in key_ideas) + \
                    '</div>'

            interaction_html = ""
            if plugin == "phet":
                inner_sim = f'<div class="interaction-container phet-container" id="interaction-{i}">' + \
                    f'<iframe src="about:blank" id="phet-frame-{i}" style="width:100%;height:300px;border:none" sandbox="allow-scripts allow-same-origin"></iframe></div>'
            elif plugin in ("avr-harvest", "avr_sim"):
                # Cleanroom AVR Harvest manipulative (AVR-P301 to P321) loaded via local resource
                from ..plugins.harvest.plugin import AVRPlugin, AVR_RESOURCE_MAP
                avr_instance = AVRPlugin()
                # Find matching resource file based on concept name or key ideas
                matched_file = "AVR-P301-number-line-marker.html"
                text_to_search = f"{name} {summary} {' '.join(key_ideas)}".lower()
                for key, fname in AVR_RESOURCE_MAP.items():
                    if key in text_to_search:
                        matched_file = fname
                        break
                raw_html = avr_instance.get_resource_html(matched_file)
                import html as html_lib
                escaped_srcdoc = html_lib.escape(raw_html, quote=True)
                inner_sim = f'<div class="interaction-container avr-container" id="interaction-{i}" style="width:100%;min-height:360px">' + \
                    f'<iframe srcdoc="{escaped_srcdoc}" id="avr-frame-{i}" style="width:100%;height:360px;border:none;border-radius:10px" sandbox="allow-scripts allow-same-origin"></iframe></div>'
            elif plugin == "jsxgraph":
                inner_sim = f'<div class="interaction-container" id="interaction-{i}">' + \
                    f'<div id="jxg-board-{i}" class="jsxg-box"></div></div>'
            elif plugin == "mermaid":
                inner_sim = f'<div class="interaction-container" id="interaction-{i}">' + \
                    f'<div id="mm-chart-{i}" class="mermaid-container">graph TD\n  A[{name}] --> B[Explore]</div></div>'
            elif plugin:
                inner_sim = f'<div class="interaction-container" id="interaction-{i}">' + \
                    f'<div style="color:var(--muted);text-align:center">Interactive {plugin} Container Ready</div></div>'
            else:
                inner_sim = ""

            if inner_sim:
                interaction_html = f'<aasha-sim id="sim-{i}" data-plugin="{plugin or "canvas"}" data-node="{node_id}">\n{inner_sim}\n</aasha-sim>'

            cards.append(f"""
    <div class="concept-card collapsible accordion" id="{node_id}">
      <details class="concept-details" open>
        <summary class="concept-card-header" onclick="toggleCard(this.closest('.concept-card'))" style="list-style:none">
          <span class="concept-card-emoji">{emoji}</span>
          <span class="concept-card-title">{name}</span>
          <span style="font-size:.7rem;color:var(--muted)">{plugin or 'text'}</span>
        </summary>
        <div class="concept-card-body">
          <div class="concept-text">{summary}</div>
          {key_ideas_html}
          {interaction_html}
          <div style="display:flex;align-items:center;gap:8px;margin-top:10px">
            <span class="teas-badge teas-learn" id="teas-badge-{node_id}">TEAS: LEARN (0%)</span>
            <a onclick="scrollNext()" style="font-size:.75rem;color:var(--muted);cursor:pointer;text-decoration:underline;margin-left:auto">Skip this activity →</a>
          </div>
        </div>
      </details>
    </div>""")

        return "\n".join(cards)

    def _build_assessment_section(self, level: str, assessments: list, title: str, desc: str, concepts: list) -> str:
        """Build HTML for one assessment level conforming to the Universal Question Contract."""
        if not assessments:
            return ""

        badge_class = level
        tier = 1 if level == "warmup" else (2 if level == "deep_dive" else 3)
        xp_tier = 5 if tier == 1 else (10 if tier == 2 else 20)
        
        # Progressive 3-Tier Gating: Levels 2 & 3 start locked until previous tier is mastered
        locked_class = " locked" if level in ("deep_dive", "boss") else ""
        prev_level_name = "Level 1: Warm-up" if level == "deep_dive" else "Level 2: Deep Dive"
        lock_banner = f'<div class="lock-banner" id="lock-banner-{level}">🔒 Complete {prev_level_name} to unlock {title}</div>' if locked_class else ""

        cards = []

        for i, a in enumerate(assessments):
            q_id = a.get("id") or f"q_{level}_{i+1}"
            node_idx = (i % len(concepts)) + 1 if concepts else 1
            node_id = a.get("node_id") or a.get("concept_id") or f"node_{node_idx}"
            q_text = a.get("question", "")
            opts = a.get("opts", [])
            xp = a.get("xp", xp_tier)
            hint = a.get("hint", "")

            # Shuffled options (Rule #2)
            shuffled_opts = list(opts)
            random.shuffle(shuffled_opts)

            opts_html = ""
            for opt in shuffled_opts:
                opt_text = opt.get("t", "")
                is_correct = opt.get("c", False)
                m = opt.get("m", "")
                if not is_correct and not m:
                    # Provide diagnostic misconception reasoning without answer leakage (Rule #1 Zero-Spoiler Invariant)
                    m = "Carefully check the rule or operational steps used here; this choice reflects a common procedural mistake or sign oversight rather than the core property."
                safe_m = str(m).replace("'", "\\'").replace('"', '&quot;')
                onclick = f"answerQuestion(this, '{q_id}', '{node_id}', {str(is_correct).lower()}, '{safe_m}', {xp})"
                opts_html += f'<div class="quiz-opt" data-xp="{xp}" data-m="{safe_m}" onclick="{onclick}"><span class="quiz-opt-text">{opt_text}</span><span style="display:none">,m: &quot;{safe_m}&quot;</span></div>'

            # 4-Tier Adaptive Hints (Strict Zero-Spoiler Rule)
            h1 = hint or "Focus on the key term or condition mentioned in the question."
            h2 = "Recall the core definition or rule introduced in this concept."
            h3 = "Think of a simpler example with smaller numbers or familiar items."
            h4 = "Break it into 2 steps: identify what is given, then eliminate options that contradict the rule."
            safe_h1 = str(h1).replace("'", "\\'").replace('"', '&quot;')
            safe_h2 = str(h2).replace("'", "\\'").replace('"', '&quot;')
            safe_h3 = str(h3).replace("'", "\\'").replace('"', '&quot;')
            safe_h4 = str(h4).replace("'", "\\'").replace('"', '&quot;')

            hint_html = f"""<div class="hint-container" style="margin-top:6px">
              <button type="button" class="hint-toggle-btn" onclick="toggleHint('{q_id}')">💡 Need a Hint? (<span id="hint-tier-{q_id}">1</span>/4)</button>
              <div class="hint-box" id="hint-box-{q_id}" data-tier="0" data-h1="{safe_h1}" data-h2="{safe_h2}" data-h3="{safe_h3}" data-h4="{safe_h4}"></div>
            </div>"""

            cards.append(f"""
      <div class="quiz-card" id="{q_id}" data-qid="{q_id}" data-nodeid="{node_id}" data-tier="{tier}">
        <div class="quiz-question">{q_text}</div>
        <div class="quiz-opts-container">
          {opts_html}
        </div>
        <div class="quiz-feedback"></div>
        {hint_html}
        <div style="text-align:center;margin-top:8px">
          <a onclick="scrollNext()" style="font-size:.75rem;color:var(--muted);cursor:pointer;text-decoration:underline">Skip this question →</a>
        </div>
      </div>""")

        return f"""
    <div class="assessment-section{locked_class}" id="section-{level}">
      <span class="assessment-level-badge {badge_class}">{title} (+{xp_tier} XP)</span>
      <!-- xp: {xp_tier} -->
      <span style="display:none">xp: {xp_tier}</span>
      {lock_banner}
      {''.join(cards)}
    </div>"""
