import json

with open(r"C:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\chapters\ad_nodes_data.json", "r", encoding="utf-8") as f:
    nodes = json.load(f)

with open(r"C:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\chapters\ad_drills_data.json", "r", encoding="utf-8") as f:
    drills = json.load(f)

nodes_json_str = json.dumps(nodes)
drills_json_str = json.dumps(drills)

html_template = f"""<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<title>Class 8 Rational Numbers: The Stationery Market Quest — Aasha Ecosystem</title>
<style>
/* MathIsolation: true */
*{{margin:0;padding:0;box-sizing:border-box}}
:root{{
  --bg:#0f172a;--surface:#1e293b;--surface-card:#334155;--text:#f8fafc;--muted:#94a3b8;
  --blue:#3b82f6;--blue-dk:#1d4ed8;--blue-lt:#dbeafe;
  --green:#22c55e;--green-dk:#15803d;--green-lt:#dcfce7;
  --amber:#f59e0b;--amber-lt:#fef3c7;
  --purple:#a855f7;--purple-lt:#f3e8ff;
  --red:#ef4444;--red-lt:#fee2e2;
  --border:#475569;--radius:16px;--radius-sm:10px;
  --font:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
}}
body{{font-family:var(--font);background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden;-webkit-tap-highlight-color:transparent}}
.app{{max-width:540px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;background:var(--surface);box-shadow:0 0 50px rgba(0,0,0,0.5)}}

/* Top Game Bar */
.game-topbar{{background:#0f172a;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid var(--border);position:sticky;top:0;z-index:50}}
.hero-avatar{{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--purple));display:flex;align-items:center;justify-content:center;font-size:1.2rem;box-shadow:0 0 10px rgba(59,130,246,0.5)}}
.hud-stats{{display:flex;align-items:center;gap:8px}}
.hud-pill{{background:#1e293b;border:1px solid var(--border);border-radius:20px;padding:4px 10px;font-size:.76rem;font-weight:800;display:flex;align-items:center;gap:4px}}
.hud-pill.xp{{color:var(--amber);border-color:#f59e0b55}}
.hud-pill.streak{{color:var(--red);border-color:#ef444455}}
.hud-pill.stamina{{color:var(--green);border-color:#22c55e55}}

/* Story Banner */
.act-banner{{background:linear-gradient(135deg,#1e3a8a,#312e81);padding:14px 16px;border-bottom:1px solid #4338ca}}
.act-tag{{font-size:.70rem;font-weight:900;text-transform:uppercase;color:#93c5fd;letter-spacing:.05em}}
.act-title{{font-size:1.15rem;font-weight:900;color:#fff;margin-top:2px}}

/* Screen Content */
.screen{{flex:1;padding:16px 16px 100px;display:flex;flex-direction:column;gap:14px}}

/* Story Card */
.story-card{{background:var(--surface-card);border:2px solid var(--border);border-radius:var(--radius);padding:16px;line-height:1.6;font-size:.95rem;position:relative}}
.story-card::before{{content:'📖 NARRATIVE';position:absolute;top:-10px;left:14px;background:var(--blue);color:#fff;font-size:.65rem;font-weight:900;padding:2px 8px;border-radius:6px}}

/* Concept Frame */
.concept-box{{background:#1e293b;border:2px solid #3b82f6;border-radius:var(--radius);padding:16px}}
.concept-title{{font-size:1.1rem;font-weight:800;color:#60a5fa;margin-bottom:8px}}
.concept-body{{font-size:.92rem;line-height:1.7;color:#cbd5e1}}

/* Simulation Box */
.sim-box{{background:#0f172a;border:2px solid #6366f1;border-radius:var(--radius);padding:14px;display:flex;flex-direction:column;gap:10px}}
.sim-title{{font-size:.82rem;font-weight:800;color:#a5b4fc;text-transform:uppercase;letter-spacing:.03em}}
.sim-canvas{{display:block;width:100%;height:150px;background:#1e293b;border-radius:var(--radius-sm);border:1px solid #334155}}
.sim-controls{{display:flex;flex-wrap:wrap;gap:6px}}
.sim-btn{{background:#334155;color:#f8fafc;border:1px solid #475569;border-radius:8px;padding:6px 12px;font-size:.78rem;font-weight:700;cursor:pointer}}
.sim-btn.active{{background:var(--blue);border-color:var(--blue-lt);color:#fff}}

/* Challenge Obstacle Card */
.obstacle-card{{background:#1e293b;border:2.5px solid var(--amber);border-radius:var(--radius);padding:16px;box-shadow:0 8px 24px rgba(245,158,11,0.15)}}
.obstacle-header{{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}}
.obstacle-badge{{background:var(--amber);color:#0f172a;font-size:.70rem;font-weight:900;padding:3px 8px;border-radius:6px}}
.obstacle-prompt{{font-size:1.05rem;font-weight:800;color:#fff;line-height:1.4;margin-bottom:12px}}

/* Step Trajectory */
.step-item{{background:#334155;border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:12px;margin-bottom:10px}}
.step-item.active{{border-color:var(--blue);background:#1e3a8a33}}
.step-item.completed{{border-color:var(--green);background:#064e3b33}}
.step-task{{font-size:.88rem;font-weight:700;color:#e2e8f0;margin-bottom:8px}}

/* Interactive Smart Math Keypad & Inputs */
.input-row{{display:flex;gap:8px;align-items:center}}
.math-input{{flex:1;background:#0f172a;border:2px solid var(--blue);border-radius:8px;color:#fff;padding:10px 12px;font-size:1.05rem;font-weight:800;outline:none;font-family:monospace}}
.btn-submit-step{{background:linear-gradient(135deg,var(--blue),var(--blue-dk));color:#fff;border:none;border-radius:8px;padding:10px 16px;font-weight:800;cursor:pointer}}
.keypad{{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin-top:8px}}
.key-btn{{background:#1e293b;border:1px solid #475569;border-radius:6px;color:#cbd5e1;padding:8px 0;font-size:.9rem;font-weight:800;cursor:pointer;text-align:center}}
.key-btn:hover{{background:#334155;color:#fff}}

/* Hints & Diagnostic Feedback */
.hint-btn{{background:none;border:none;color:#94a3b8;font-size:.75rem;font-weight:700;cursor:pointer;text-decoration:underline;margin-top:6px;display:inline-block}}
.hint-box{{background:#451a03;border:1px solid #d97706;border-radius:8px;padding:8px 10px;font-size:.80rem;color:#fde68a;margin-top:6px;display:none}}
.step-fb{{padding:8px 10px;border-radius:8px;font-size:.85rem;font-weight:700;margin-top:6px;display:none}}
.step-fb.ok{{background:#064e3b;color:#a7f3d0;border:1px solid #059669}}
.step-fb.no{{background:#450a0a;color:#fca5a5;border:1px solid #dc2626}}

/* Bottom Action Bar */
.bottom-bar{{position:fixed;bottom:0;left:0;right:0;max-width:540px;margin:0 auto;padding:12px 16px;background:#0f172a;border-top:2px solid var(--border);display:flex;gap:10px;z-index:60}}
.btn-nav{{flex:1;padding:14px;border-radius:12px;font-size:1rem;font-weight:900;border:none;cursor:pointer;background:linear-gradient(135deg,var(--blue),var(--purple));color:#fff;box-shadow:0 4px 15px rgba(59,130,246,0.4)}}
.btn-nav:disabled{{opacity:0.5;cursor:not-allowed}}

/* LLE Words */
.word{{border-bottom:1px dotted #60a5fa;cursor:pointer}}
.word:hover{{color:#93c5fd}}
</style>
</head>
<body>
<div class="app">
  <div class="game-topbar">
    <div style="display:flex;align-items:center;gap:10px">
      <div class="hero-avatar">🏃</div>
      <div>
        <div style="font-size:.85rem;font-weight:900">Seema & Sachin's Quest</div>
        <div style="font-size:.68rem;color:var(--muted)">AD Class 8 Math Chapter 1</div>
      </div>
    </div>
    <div class="hud-stats">
      <div class="hud-pill xp">⭐ <span id="hudXp">0</span></div>
      <div class="hud-pill streak">🔥 <span id="hudStreak">0</span></div>
      <div class="hud-pill stamina">⚡ <span id="hudEnergy">100%</span></div>
    </div>
  </div>

  <div class="act-banner">
    <div class="act-tag" id="actTag">Act I</div>
    <div class="act-title" id="actTitle">The Stationery Counter Dilemma</div>
  </div>

  <div class="screen" id="screen"></div>

  <div class="bottom-bar">
    <button class="btn-nav" id="btnNext" onclick="GameApp.nextAct()">Advance Journey ➔</button>
  </div>
</div>

<canvas id="confettiCanvas" style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99"></canvas>

<script>
var NODES = {nodes_json_str};
var DRILLS = {drills_json_str};

var GameApp = {{
  actIdx: 0,
  xp: 0,
  streak: 0,
  activeChallengeIdx: 0,
  activeStepIdx: 0,

  init: function() {{
    this.render();
  }},

  render: function() {{
    var node = NODES[this.actIdx];
    document.getElementById('actTag').textContent = 'ACT ' + (this.actIdx + 1) + ' OF ' + NODES.length;
    document.getElementById('actTitle').textContent = node.title;

    var sc = document.getElementById('screen');
    var html = '';

    // 1. Story Narrative
    html += '<div class="story-card">' + node.story_text + '</div>';

    // 2. Academic Concept Box
    html += '<div class="concept-box"><div class="concept-title">' + node.concept_title + '</div><div class="concept-body">' + node.concept_body + '</div></div>';

    // 3. Interactive Simulation Box
    html += '<div class="sim-box">' +
      '<div class="sim-title">⚡ Interactive Lab: ' + node.sim_type.replace(/_/g, ' ') + '</div>' +
      '<canvas class="sim-canvas" id="actCanvas" width="480" height="150"></canvas>' +
      '<div style="font-size:.78rem;color:#94a3b8">' + node.sim_prompt + '</div>' +
      '<div class="sim-controls" id="simControls"></div>' +
      '</div>';

    // 4. Current Step-by-Step Obstacle Challenge
    var chal = node.challenges[this.activeChallengeIdx];
    if (chal) {{
      html += '<div class="obstacle-card">' +
        '<div class="obstacle-header"><span class="obstacle-badge">' + chal.tag + '</span><span style="font-size:.75rem;color:var(--amber);font-weight:800">OBSTACLE ' + (this.activeChallengeIdx + 1) + '</span></div>' +
        '<div class="obstacle-prompt">' + chal.prompt + '</div>';

      for (var s = 0; s < chal.sub_steps.length; s++) {{
        var st = chal.sub_steps[s];
        var isCurrent = (s === this.activeStepIdx);
        var isDone = (s < this.activeStepIdx);
        var cls = isDone ? 'step-item completed' : (isCurrent ? 'step-item active' : 'step-item');

        html += '<div class="' + cls + '">' +
          '<div class="step-task"><strong>Step ' + (s + 1) + ':</strong> ' + st.task + '</div>';

        if (isCurrent) {{
          html += '<div class="input-row">' +
            '<input type="text" class="math-input" id="stepInput" placeholder="Type answer (e.g. 22/5, -3)..." autocomplete="off">' +
            '<button class="btn-submit-step" onclick="GameApp.submitStep()">Unlock 🔓</button>' +
            '</div>' +
            '<div class="keypad">' +
            '<button class="key-btn" onclick="GameApp.insertKey(\'/\')">/</button>' +
            '<button class="key-btn" onclick="GameApp.insertKey(\'-\')">-</button>' +
            '<button class="key-btn" onclick="GameApp.insertKey(\'.\')">.</button>' +
            '<button class="key-btn" onclick="GameApp.insertKey(\'(\')">(</button>' +
            '<button class="key-btn" onclick="GameApp.insertKey(\')\')">)</button>' +
            '<button class="key-btn" onclick="GameApp.insertKey(\'C\')">C</button>' +
            '</div>' +
            '<button class="hint-btn" onclick="GameApp.toggleHint(' + s + ')">💡 Need a Rescue Hint?</button>' +
            '<div class="hint-box" id="hintBox_' + s + '">' + st.hint + '</div>' +
            '<div class="step-fb" id="stepFb"></div>';
        }} else if (isDone) {{
          html += '<div style="font-size:.80rem;color:#86efac;font-weight:800">✓ Solved: ' + st.answer + '</div>';
        }}
        html += '</div>';
      }}
      html += '</div>';
    }}

    sc.innerHTML = html;
    this.mountSim(node.sim_type);
    document.getElementById('btnNext').disabled = (this.activeChallengeIdx < node.challenges.length - 1 || this.activeStepIdx < chal.sub_steps.length);
  }},

  insertKey: function(k) {{
    var inp = document.getElementById('stepInput');
    if (!inp) return;
    if (k === 'C') {{ inp.value = ''; return; }}
    inp.value += k; inp.focus();
  }},

  toggleHint: function(s) {{
    var h = document.getElementById('hintBox_' + s);
    if (h) h.style.display = (h.style.display === 'block') ? 'none' : 'block';
  }},

  submitStep: function() {{
    var inp = document.getElementById('stepInput');
    var fb = document.getElementById('stepFb');
    if (!inp || !fb) return;
    var val = inp.value.trim().toLowerCase();
    var chal = NODES[this.actIdx].challenges[this.activeChallengeIdx];
    var st = chal.sub_steps[this.activeStepIdx];

    var match = false;
    for (var i = 0; i < st.accept.length; i++) {{
      if (val === st.accept[i].toLowerCase() || val.replace(/\\s/g, '') === st.accept[i].toLowerCase().replace(/\\s/g, '')) {{
        match = true; break;
      }}
    }}

    if (match) {{
      fb.className = 'step-fb ok'; fb.style.display = 'block';
      fb.innerHTML = '✓ Correct! Obstacle cleared. +20 XP';
      this.xp += 20; this.streak++;
      document.getElementById('hudXp').textContent = this.xp;
      document.getElementById('hudStreak').textContent = this.streak;
      fireConfetti(30);

      var self = this;
      setTimeout(function() {{
        self.activeStepIdx++;
        if (self.activeStepIdx >= chal.sub_steps.length) {{
          self.activeChallengeIdx++;
          self.activeStepIdx = 0;
          if (self.activeChallengeIdx >= NODES[self.actIdx].challenges.length) {{
            alert('🎉 Act ' + (self.actIdx + 1) + ' Conquered! Advance to the next chapter!');
            document.getElementById('btnNext').disabled = false;
          }}
        }}
        self.render();
      }}, 1200);
    }} else {{
      fb.className = 'step-fb no'; fb.style.display = 'block';
      fb.innerHTML = '✗ Not quite. Tap "Need a Rescue Hint?" or check your signs!';
      this.streak = 0; document.getElementById('hudStreak').textContent = 0;
    }}
  }},

  nextAct: function() {{
    this.actIdx++;
    if (this.actIdx >= NODES.length) {{
      alert('🏆 VICTORY! You have completely solved all Acts and Challenges of AD Class 8 Rational Numbers!');
      this.actIdx = 0;
    }}
    this.activeChallengeIdx = 0; this.activeStepIdx = 0;
    this.render();
  }},

  mountSim: function(type) {{
    var c = document.getElementById('actCanvas');
    var ctrls = document.getElementById('simControls');
    if (!c || !ctrls) return;
    var ctx = c.getContext('2d');
    var w = c.width, h = c.height;

    if (type === 'pen_shop_sim') {{
      function draw(pens, cost) {{
        ctx.clearRect(0,0,w,h);
        ctx.fillStyle = '#60a5fa'; ctx.font = 'bold 13px sans-serif';
        ctx.fillText('Stationery Wholesale Counter: ' + pens + ' Pens for ₹' + cost, 14, 25);
        ctx.fillStyle = '#4ade80'; ctx.font = 'bold 16px sans-serif';
        ctx.fillText('Unit Price: ₹' + cost + ' ÷ ' + pens + ' = ₹' + (cost/pens).toFixed(2), 14, 60);
        ctx.fillStyle = '#cbd5e1'; ctx.font = '12px sans-serif';
        ctx.fillText('Fraction p/q: ' + cost + '/' + pens + ' (p, q are integers, q ≠ 0)', 14, 90);
      }}
      draw(5, 22);
      ctrls.innerHTML = '<button class="sim-btn active" onclick="GameApp.simAction(5, 22)">5 Pens @ ₹22 (AD Book)</button>' +
        '<button class="sim-btn" onclick="GameApp.simAction(3, 15)">3 Pens @ ₹15</button>' +
        '<button class="sim-btn" onclick="GameApp.simAction(8, 36)">8 Pens @ ₹36</button>';
      GameApp.simAction = draw;
    }} else if (type === 'number_line_sim') {{
      function draw(n, d) {{
        ctx.clearRect(0,0,w,h);
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 12px sans-serif';
        ctx.fillText('Locating on Coordinate Line: ' + n + '/' + d, 14, 22);
        // Draw Axis
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(20, 75); ctx.lineTo(460, 75); ctx.stroke();
        // Marks
        for (var i = -4; i <= 4; i++) {{
          var x = 240 + i * 50;
          ctx.beginPath(); ctx.moveTo(x, 68); ctx.lineTo(x, 82); ctx.stroke();
          ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(i, x, 100);
        }}
        // Pinpoint target
        var targetX = 240 + (n / d) * 50;
        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(targetX, 75, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillText(n + '/' + d, targetX, 55);
      }}
      draw(-8, 3);
      ctrls.innerHTML = '<button class="sim-btn active" onclick="GameApp.simAction(-8, 3)">Pinpoint -8/3</button>' +
        '<button class="sim-btn" onclick="GameApp.simAction(5, 2)">Pinpoint 5/2</button>' +
        '<button class="sim-btn" onclick="GameApp.simAction(-1, 4)">Pinpoint -1/4</button>';
      GameApp.simAction = draw;
    }} else if (type === 'slice_equalizer_sim') {{
      function draw(d1, d2) {{
        ctx.clearRect(0,0,w,h);
        ctx.fillStyle = '#a5b4fc'; ctx.font = 'bold 12px sans-serif';
        ctx.fillText('Reslicing Denominators: ' + d1 + ' and ' + d2 + ' ➔ LCM: ' + (d1*d2), 14, 25);
        ctx.fillStyle = '#38bdf8'; ctx.fillRect(20, 50, 440, 30);
        var lcm = d1 * d2;
        ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5;
        for (var i = 0; i <= lcm; i++) {{
          var x = 20 + i * (440 / lcm);
          ctx.beginPath(); ctx.moveTo(x, 50); ctx.lineTo(x, 80); ctx.stroke();
        }}
        ctx.fillStyle = '#4ade80'; ctx.font = 'bold 13px sans-serif';
        ctx.fillText('Common Slice Size = 1/' + lcm + ' (Both slices now equal!)', 14, 115);
      }}
      draw(7, 8);
      ctrls.innerHTML = '<button class="sim-btn active" onclick="GameApp.simAction(7, 8)">LCM(7, 8) = 56</button>' +
        '<button class="sim-btn" onclick="GameApp.simAction(3, 5)">LCM(3, 5) = 15</button>' +
        '<button class="sim-btn" onclick="GameApp.simAction(5, 9)">LCM(5, 9) = 45</button>';
      GameApp.simAction = draw;
    }} else if (type === 'balance_scale_sim') {{
      function draw(p, q) {{
        ctx.clearRect(0,0,w,h);
        ctx.fillStyle = '#fde68a'; ctx.font = 'bold 12px sans-serif';
        ctx.fillText('Reciprocal Twin Balance: ' + p + '/' + q + ' × ' + q + '/' + p + ' = 1', 14, 25);
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2;
        // Fulcrum
        ctx.beginPath(); ctx.moveTo(240, 110); ctx.lineTo(220, 135); ctx.lineTo(260, 135); ctx.closePath(); ctx.stroke();
        // Beam
        ctx.beginPath(); ctx.moveTo(100, 110); ctx.lineTo(380, 110); ctx.stroke();
        // Left pan
        ctx.fillStyle = '#38bdf8'; ctx.fillRect(90, 80, 40, 30);
        ctx.fillStyle = '#0f172a'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(p + '/' + q, 110, 100);
        // Right pan
        ctx.fillStyle = '#a855f7'; ctx.fillRect(350, 80, 40, 30);
        ctx.fillStyle = '#0f172a'; ctx.fillText(q + '/' + p, 370, 100);
      }}
      draw(11, 13);
      ctrls.innerHTML = '<button class="sim-btn active" onclick="GameApp.simAction(11, 13)">11/13 ⇄ 13/11</button>' +
        '<button class="sim-btn" onclick="GameApp.simAction(-5, 8)">-5/8 ⇄ -8/5</button>' +
        '<button class="sim-btn" onclick="GameApp.simAction(9, 11)">9/11 ⇄ 11/9</button>';
      GameApp.simAction = draw;
    }} else if (type === 'distributive_grid_sim') {{
      function draw() {{
        ctx.clearRect(0,0,w,h);
        ctx.fillStyle = '#c084fc'; ctx.font = 'bold 12px sans-serif';
        ctx.fillText('Distributive Law: a × (b + c) = ab + ac', 14, 25);
        ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 14px sans-serif';
        ctx.fillText('(2/5) × [(-3/7) + (6/11)] = 18/385', 14, 65);
        ctx.fillStyle = '#4ade80';
        ctx.fillText('[(2/5) × (-3/7)] + [(2/5) × (6/11)] = 18/385 (Verified!)', 14, 105);
      }}
      draw();
      ctrls.innerHTML = '<button class="sim-btn active">Verify AD Page 8 Solved Law</button>';
    }}
  }}
}};

function fireConfetti(count) {{
  var canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  var particles = [];
  for (var i = 0; i < (count || 40); i++) {{
    particles.push({{
      x: canvas.width / 2, y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.7) * 14,
      size: Math.random() * 8 + 4,
      color: ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444'][Math.floor(Math.random() * 5)],
      life: 50
    }});
  }}
  function anim() {{
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var active = false;
    for (var i = 0; i < particles.length; i++) {{
      var p = particles[i];
      if (p.life > 0) {{
        active = true; p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.life--;
        ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size);
      }}
    }}
    if (active) requestAnimationFrame(anim);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }}
  requestAnimationFrame(anim);
}}

window.addEventListener('DOMContentLoaded', function(){{ GameApp.init(); }});
</script>
</body></html>"""

target_path = r"C:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\chapters\RationalNumbers_Class8_AD.html"
with open(target_path, "w", encoding="utf-8") as f:
    f.write(html_template)

print("Unified gamified chapter built at:", target_path)
