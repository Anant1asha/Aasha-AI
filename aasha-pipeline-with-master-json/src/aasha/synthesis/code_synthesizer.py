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
.screen{{flex:1;padding:16px 14px 90px;animation:fadeIn .3s ease}}
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
/* Interaction container */
.interaction-container{{margin:12px 0;border-radius:var(--radius-sm);overflow:hidden;min-height:220px;display:flex;align-items:center;justify-content:center;background:#f8fafc}}
/* Assessment */
.assessment-section{{margin-top:24px}}
.assessment-level-badge{{display:inline-block;padding:4px 12px;border-radius:12px;font-size:.75rem;font-weight:700;margin-bottom:12px}}
.assessment-level-badge.warmup{{background:#dcfce7;color:#166534}}
.assessment-level-badge.deep_dive{{background:#fef3c7;color:#92400e}}
.assessment-level-badge.boss{{background:#fee2e2;color:#991b1b}}
.quiz-card{{background:var(--surface);border:2px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:12px}}
.quiz-question{{font-size:1rem;font-weight:600;margin-bottom:12px}}
.quiz-opt{{display:flex;align-items:flex-start;gap:10px;padding:12px;margin-bottom:7px;border:2px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;transition:all .15s;background:var(--surface)}}
.quiz-opt:hover{{border-color:var(--blue)}}
.quiz-opt.correct{{border-color:var(--green);background:#dcfce7}}
.quiz-opt.wrong{{border-color:var(--red);background:#fee2e2}}
.quiz-opt-text{{flex:1;font-size:.9rem}}
.quiz-feedback{{margin-top:8px;padding:10px;border-radius:8px;font-size:.85rem;display:none}}
.quiz-feedback.show{{display:block}}
.quiz-feedback.ok{{background:#dcfce7;color:#166534}}
.quiz-feedback.no{{background:#fee2e2;color:#991b1b}}
/* Bottom bar */
.bottom-bar{{position:sticky;bottom:0;background:var(--surface);padding:10px 16px;box-shadow:0 -1px 3px rgba(0,0,0,.06);z-index:50}}
.btn{{width:100%;padding:13px;border:none;border-radius:13px;font-size:.95rem;font-weight:700;cursor:pointer}}
.btn-primary{{background:var(--blue);color:#fff}}
.btn-green{{background:var(--green);color:#fff}}
/* Toast */
.toast-msg{{position:fixed;bottom:75px;left:50%;transform:translateX(-50%);background:#1e293b;color:#fff;padding:8px 16px;border-radius:20px;font-size:.8rem;font-weight:600;display:none;z-index:100;animation:fadeIn .2s}}
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

function toggleCard(card) {{
  card.classList.toggle('open');
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
                interaction_html = f'<div class="interaction-container phet-container" id="interaction-{i}">' + \
                    f'<iframe src="about:blank" id="phet-frame-{i}" style="width:100%;height:300px;border:none"></iframe></div>'
            elif plugin == "jsxgraph":
                interaction_html = f'<div class="interaction-container" id="interaction-{i}">' + \
                    f'<div id="jxg-board-{i}" class="jsxg-box"></div></div>'
            elif plugin == "mermaid":
                interaction_html = f'<div class="interaction-container" id="interaction-{i}">' + \
                    f'<div id="mm-chart-{i}" class="mermaid-container">graph TD\n  A[{name}] --> B[Explore]</div></div>'
            elif plugin:
                interaction_html = f'<div class="interaction-container" id="interaction-{i}">' + \
                    f'<div style="color:var(--muted);text-align:center">Interactive {plugin} Container Ready</div></div>'

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
                    m = "Review the foundational concept rule."
                safe_m = str(m).replace("'", "\\'").replace('"', '&quot;')
                onclick = f"answerQuestion(this, '{q_id}', '{node_id}', {str(is_correct).lower()}, '{safe_m}', {xp})"
                opts_html += f'<div class="quiz-opt" data-xp="{xp}" data-m="{safe_m}" onclick="{onclick}"><span class="quiz-opt-text">{opt_text}</span><span style="display:none">,m: &quot;{safe_m}&quot;</span></div>'

            hint_html = f'<div style="font-size:.75rem;color:var(--muted);margin-top:6px">💡 {hint}</div>' if hint else ""

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
    <div class="assessment-section" id="section-{level}">
      <span class="assessment-level-badge {badge_class}">{title} (+{xp_tier} XP)</span>
      <!-- xp: {xp_tier} -->
      <span style="display:none">xp: {xp_tier}</span>
      {''.join(cards)}
    </div>"""
