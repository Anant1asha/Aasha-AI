"""Agent 4: Frontend Code Synthesizer.

Generates a complete, self-contained HTML5/Tailwind/JS single-file module
that students can immediately open and use. This is the "full-synthesis" mode
that generates fresh HTML with embedded libraries (base64), rather than
injecting into the v5 engine template.

The output includes:
1. Interactive Concept Cards — collapsible, visually distinct micro-learning modules
2. Embedded Simulation/Manipulative Containers — functional JS or iframe wrappers
3. Full Interactive Quiz System — score trackers, retry mechanics, explanations
4. 3-Level Assessment Suite — Warm-up (recall), Deep Dive (application), Boss Challenge
5. Gamification — XP, badges, streaks, confetti

This agent does NOT use the LLM — it takes the structured output from Agents 1-3
and synthesizes HTML deterministically.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from ..agents.base import BaseAgent

logger = logging.getLogger(__name__)


class FrontendCodeSynthesizer(BaseAgent):
    """Agent 4 — generates the final HTML5 output.

    Takes the pedagogy map (concepts + interactions) and assessment suite
    from Agents 1-3, and synthesizes a complete self-contained HTML file
    with embedded CSS (Tailwind), JS, and plugin renderers.
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
        """Collect CSS and JS assets from plugins used in the experience plan."""
        assets: dict[str, str] = {}
        plugins_used = set()
        for concept in experience_plan.get("concepts", []):
            plugin_name = concept.get("plugin", "")
            if plugin_name:
                plugins_used.add(plugin_name)

        # Collect embed_assets from each plugin
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
        """Build the complete self-contained HTML file."""
        concepts = pedagogy_map.get("concepts", [])
        exercises = pedagogy_map.get("exercises", [])

        # Build concept cards HTML
        concept_cards = self._build_concept_cards(concepts, experience_plan)

        # Build assessment sections
        warmup_html = self._build_assessment_section("warmup", assessment_suite.get("warmup", []), "Level 1: Warm-up", "recall")
        deep_dive_html = self._build_assessment_section("deep_dive", assessment_suite.get("deep_dive", []), "Level 2: Deep Dive", "application")
        boss_html = self._build_assessment_section("boss", assessment_suite.get("boss", []), "Level 3: Boss Challenge", "mastery")

        # Collect plugin JS/CSS
        plugin_css = "\n".join(v for k, v in plugin_assets.items() if k.endswith("_css"))
        plugin_js = "\n".join(v for k, v in plugin_assets.items() if k.endswith("_js"))

        # Build the complete HTML document
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<title>{title} - Interactive Learning Module</title>
<style>
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
/* Interaction container */
.interaction-container{{margin:12px 0;border-radius:var(--radius-sm);overflow:hidden;min-height:200px;display:flex;align-items:center;justify-content:center;background:#f8fafc}}
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
/* XP bar */
.xp-bar{{position:fixed;top:50px;right:16px;background:var(--surface);border-radius:8px;padding:4px 12px;box-shadow:0 2px 8px rgba(0,0,0,.1);z-index:90;font-size:.8rem;font-weight:700;color:var(--purple)}}
/* Plugin styles */
{plugin_css}
</style>
</head>
<body>
<div class="app">
  <div class="topbar">
    <button class="exit-btn" onclick="resetChapter()">✕</button>
    <div class="progress-track"><div class="progress-fill" id="progressFill"></div></div>
    <span class="stat lvl" id="statLvl">L1</span>
    <span class="stat xp" id="statXp">⭐ 0</span>
    <span class="stat streak" id="statStreak">🔥 0</span>
  </div>

  <div class="xp-bar" id="xpBar">XP: 0</div>

  <div class="screen" id="screen">
    <h1 style="text-align:center;font-size:1.4rem;font-weight:800;margin-bottom:4px">{title}</h1>
    <p style="text-align:center;color:var(--muted);font-size:.85rem;margin-bottom:16px">{subject.title()} · Grade {grade}</p>

    <!-- Concept Cards -->
    {concept_cards}

    <!-- Assessments -->
    <div class="assessment-section">
      {warmup_html}
      {deep_dive_html}
      {boss_html}
    </div>

    <div style="text-align:center;padding:24px 0;color:var(--muted);font-size:.85rem">
      Chapter complete! Total XP: <span id="totalXp">0</span>
    </div>
  </div>

  <div class="bottom-bar">
    <button class="btn btn-primary" id="bottomBtn" onclick="scrollNext()">Start Learning →</button>
  </div>
</div>

<script>
// ════════ State ════════
var state = {{xp:0, level:1, streak:0, answered:0, correct:0}};
var totalQuestions = {sum(len(assessment_suite.get(k, [])) for k in ("warmup", "deep_dive", "boss"))};

function updateStats() {{
  document.getElementById('statXp').textContent = '⭐ ' + state.xp;
  document.getElementById('statLvl').textContent = 'L' + state.level;
  document.getElementById('statStreak').textContent = '🔥 ' + state.streak;
  document.getElementById('xpBar').textContent = 'XP: ' + state.xp;
  var pct = totalQuestions > 0 ? (state.answered / totalQuestions) * 100 : 0;
  document.getElementById('progressFill').style.width = pct + '%';
  // Level up every 50 XP
  var newLevel = Math.floor(state.xp / 50) + 1;
  if (newLevel > state.level) {{
    state.level = newLevel;
    showToast('Level Up! You are now Level ' + newLevel);
  }}
  document.getElementById('totalXp').textContent = state.xp;
}}

function answerQuestion(btn, correct, feedback, xp) {{
  var card = btn.closest('.quiz-card');
  var opts = card.querySelectorAll('.quiz-opt');
  var selected = btn;
  var feedbackEl = card.querySelector('.quiz-feedback');
  
  if (correct) {{
    selected.classList.add('correct');
    state.xp += xp;
    state.streak++;
    state.correct++;
    feedbackEl.className = 'quiz-feedback show ok';
    feedbackEl.textContent = '✓ Correct! +' + xp + ' XP';
  }} else {{
    selected.classList.add('wrong');
    state.streak = 0;
    feedbackEl.className = 'quiz-feedback show no';
    feedbackEl.textContent = feedback || 'Not quite. Try again!';
  }}
  state.answered++;
  emitTeasEvent('QUESTION_ANSWERED', {{correct: Boolean(correct), xp: xp, feedback: feedback || ''}});
  updateStats();
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
      cards[i].scrollIntoView({{behavior:'smooth'}});
      return;
    }}
  }}
  // Reached end
  document.getElementById('bottomBtn').textContent = '✓ Chapter Complete!';
  document.getElementById('bottomBtn').className = 'btn btn-green';
}}

function showToast(msg) {{
  var t = document.getElementById('aasha-toast');
  if (!t) {{
    t = document.createElement('div');
    t.id = 'aasha-toast';
    t.setAttribute('role', 'status');
    t.style.cssText = 'position:fixed;bottom:70px;right:16px;background:#1e293b;color:#f8fafc;border:2px solid #3b82f6;padding:10px 16px;border-radius:12px;z-index:9999;font-size:.85rem;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,.25);transition:opacity .25s';
    document.body.appendChild(t);
  }}
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(window.__aashaToastTimer);
  window.__aashaToastTimer = setTimeout(function() {{ t.style.opacity = '0'; }}, 2500);
}}

function emitTeasEvent(eventType, payload) {{
  window.__AASHA_EVENTS__ = window.__AASHA_EVENTS__ || [];
  var evt = Object.assign({{event_type: eventType, timestamp: new Date().toISOString()}}, payload || {{}});
  window.__AASHA_EVENTS__.push(evt);
  try {{
    localStorage.setItem('aasha_synth_teas_events', JSON.stringify(window.__AASHA_EVENTS__.slice(-100)));
  }} catch (e) {{}}
}}

function skipInteractiveStep(idx) {{
  showToast('Activity skipped — you can revisit it anytime.');
  scrollNext();
}}

function resetChapter() {{
  state = {{xp:0, level:1, streak:0, answered:0, correct:0}};
  updateStats();
  window.scrollTo(0, 0);
  showToast('Progress reset to start.');
}}

// Init
updateStats();

// Plugin renderers
{plugin_js}
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
            interaction_type = concept.get("interaction_type", "")
            difficulty = concept.get("difficulty", "medium")

            emoji = {"easy": "🟢", "medium": "🟡", "hard": "🔴"}.get(difficulty, "📘")

            key_ideas_html = ""
            if key_ideas:
                key_ideas_html = '<div class="concept-key-ideas">' + \
                    "".join(f'<span class="key-idea">{ki}</span>' for ki in key_ideas) + \
                    '</div>'

            interaction_html = ""
            if plugin:
                interaction_html = (
                    f'<div class="interaction-container" id="interaction-{i}" style="flex-direction:column;gap:8px;padding:12px">'
                    f'<div style="color:var(--muted);text-align:center">Loading {plugin}...</div>'
                    f'<button type="button" class="skip-btn" style="padding:6px 12px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--muted);cursor:pointer;font-size:.75rem;font-weight:600" onclick="event.stopPropagation();skipInteractiveStep({i})">Skip Activity ⏭</button>'
                    f'</div>'
                )

            cards.append(f"""
    <div class="concept-card" onclick="toggleCard(this)">
      <div class="concept-card-header">
        <span class="concept-card-emoji">{emoji}</span>
        <span class="concept-card-title">{name}</span>
        <span style="font-size:.7rem;color:var(--muted)">{plugin or 'text'}</span>
      </div>
      <div class="concept-card-body">
        <div class="concept-text">{summary}</div>
        {key_ideas_html}
        {interaction_html}
      </div>
    </div>""")

        return "\n".join(cards)

    def _build_assessment_section(self, level: str, assessments: list, title: str, desc: str) -> str:
        """Build HTML for one assessment level."""
        if not assessments:
            return ""

        badge_class = level
        cards = []
        for i, a in enumerate(assessments):
            q = a.get("question", "")
            opts = a.get("opts", [])
            xp = a.get("xp", 5)
            hint = a.get("hint", "")
            explanation = a.get("explanation", "")

            opts_html = ""
            for opt in opts:
                opt_text = opt.get("t", "")
                is_correct = opt.get("c", False)
                m = opt.get("m", "")
                feedback = m or explanation
                onclick = f"answerQuestion(this, {str(is_correct).lower()}, '{feedback.replace(chr(39), chr(92)+chr(39))[:100]}', {xp})"
                opts_html += f'<div class="quiz-opt" onclick="{onclick}"><span class="quiz-opt-text">{opt_text}</span></div>'

            hint_html = f'<div style="font-size:.75rem;color:var(--muted);margin-top:4px">💡 {hint}</div>' if hint else ""

            cards.append(f"""
      <div class="quiz-card">
        <div class="quiz-question">{q}</div>
        {opts_html}
        <div class="quiz-feedback"></div>
        {hint_html}
      </div>""")

        return f"""
    <div class="assessment-section">
      <span class="assessment-level-badge {badge_class}">{title}</span>
      {''.join(cards)}
    </div>"""
