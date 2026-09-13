import sys

with open(r"C:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\chapters\assemble_unified.py", "a", encoding="utf-8") as f:
    f.write("""
// ═══ APP RUNTIME & MULTI-MODAL INTERACTION ENGINE ═══
var App = {
  idx: 0,
  stepIdx: 0,
  xp: 0,
  coins: 0,
  level: 1,
  streak: 0,
  currentInput: '',
  hintTier: 0,
  answered: false,

  init: function() {
    this.render();
  },

  awardXP: function(val) {
    this.xp += val;
    this.coins += Math.floor(val / 2);
    document.getElementById('statXp').textContent = this.xp;
    document.getElementById('statCoins').textContent = this.coins;
    document.getElementById('statStreak').textContent = this.streak;
    document.getElementById('statLvl').textContent = 'Lv ' + (Math.floor(this.xp / 75) + 1);
    var sw = document.getElementById('statStreakWrap');
    if (sw) sw.style.display = (this.streak >= 2) ? 'inline-flex' : 'none';
  },

  render: function() {
    var item = JOURNEY[this.idx];
    var sc = document.getElementById('screen');
    var bb = document.getElementById('bottomBar');
    var backBtn = document.getElementById('backBtn');
    var contBtn = document.getElementById('continueBtn');

    var pct = Math.round(((this.idx + 1) / JOURNEY.length) * 100);
    document.getElementById('progressFill').style.width = pct + '%';

    bb.style.display = 'block';
    backBtn.style.display = (this.idx > 0) ? 'inline-block' : 'none';

    if (item.type === 'intro') {
      sc.innerHTML = '<div class="concept-frame" style="text-align:center;padding:28px 16px">' +
        '<div style="font-size:3.5rem;margin-bottom:10px">' + item.icon + '</div>' +
        '<div class="concept-badge">' + item.badge + '</div>' +
        '<h2 class="inquiry-title" style="font-size:1.25rem">' + item.title + '</h2>' +
        rt(item.sub) +
        '</div>';
      contBtn.textContent = 'Explore Concept →';
      contBtn.disabled = false;
    } else if (item.type === 'concept') {
      sc.innerHTML = '<div class="concept-frame">' +
        '<div class="concept-badge">' + item.badge + '</div>' +
        '<h3 class="inquiry-title">' + item.title + '</h3>' +
        rt(item.text) +
        '<div class="sim-container">' +
        '<canvas class="sim-canvas" id="conceptCanvas" width="460" height="160"></canvas>' +
        '<div class="sim-caption">' + item.caption + '</div>' +
        '<div class="sim-controls" id="simControls"></div>' +
        '</div>' +
        '</div>';
      this.mountSim(item.simType);
      contBtn.textContent = 'Enter Step Challenge →';
      contBtn.disabled = false;
    } else if (item.type === 'solver') {
      this.renderSolver(item);
    } else if (item.type === 'milestone') {
      sc.innerHTML = '<div class="concept-frame" style="text-align:center;padding:34px 16px">' +
        '<div style="font-size:4rem;margin-bottom:8px">' + item.icon + '</div>' +
        '<div class="concept-badge" style="background:var(--green-lt);color:var(--green-dk)">ACT PROGRESS UNLOCKED</div>' +
        '<h2 class="inquiry-title" style="margin-top:10px">' + item.title + '</h2>' +
        '<div style="font-size:1.05rem;font-weight:800;color:var(--amber);margin:14px 0">' + item.reward + '</div>' +
        '</div>';
      playTone('levelup'); fireConfetti(60);
      contBtn.textContent = (this.idx < JOURNEY.length - 1) ? 'Continue Journey →' : '🏆 Restart Quest';
      contBtn.disabled = false;
    }
  },

  renderSolver: function(item) {
    var sc = document.getElementById('screen');
    var st = item.steps[this.stepIdx];
    var totalSteps = item.steps.length;

    var dotsHtml = '<div class="step-indicator">';
    for (var i = 0; i < totalSteps; i++) {
      var cls = (i < this.stepIdx) ? 'step-dot done' : (i === this.stepIdx ? 'step-dot active' : 'step-dot');
      dotsHtml += '<div class="' + cls + '"></div>';
    }
    dotsHtml += '</div>';

    var chipsHtml = '<div class="chip-rack">';
    for (var c = 0; c < st.chips.length; c++) {
      chipsHtml += '<button class="chip-btn" onclick="App.pickChip(\'' + st.chips[c].replace(/'/g, "\\\\'") + '\')">' + st.chips[c] + '</button>';
    }
    chipsHtml += '</div>';

    var html = '<div class="solver-card">' +
      '<div class="solver-header">' +
      '<span class="solver-badge">' + item.badge + '</span>' +
      dotsHtml +
      '</div>' +
      '<div class="solver-q">' + item.q + '</div>' +
      '<div class="solver-subgoal">' + st.goal + '</div>' +
      '<div class="input-display-box" id="inputBox">' + (this.currentInput ? rt(this.currentInput, true) : '<span style="color:#94a3b8;font-size:.9rem">Select a step tile below or tap keypad</span>') + '</div>' +
      chipsHtml +
      '<div class="hint-ladder-wrap">' +
      '<button class="hint-btn" onclick="App.showHint()"><span style="font-size:1rem">💡</span> Request Step Clue (Tier ' + (this.hintTier + 1) + ' of 4)</button>' +
      '<div id="hintArea"></div>' +
      '</div>' +
      '<div id="solverFb"></div>' +
      '</div>';

    sc.innerHTML = html;
    var contBtn = document.getElementById('continueBtn');
    contBtn.textContent = 'Check Step Answer';
    contBtn.disabled = (!this.currentInput && !this.answered);
  },

  pickChip: function(val) {
    if (this.answered) return;
    this.currentInput = val; playTone('tap');
    document.getElementById('inputBox').innerHTML = rt(val, true);
    document.getElementById('continueBtn').disabled = false;
  },

  showHint: function() {
    var item = JOURNEY[this.idx];
    var st = item.steps[this.stepIdx];
    var ha = document.getElementById('hintArea');
    if (!ha) return;
    var hintText = st.hints[Math.min(this.hintTier, st.hints.length - 1)];
    ha.innerHTML = '<div class="hint-box"><strong>Clue (Tier ' + (this.hintTier + 1) + '):</strong> ' + hintText + '</div>';
    playTone('tap');
    if (this.hintTier < st.hints.length - 1) this.hintTier++;
  },

  checkStep: function() {
    var item = JOURNEY[this.idx];
    var st = item.steps[this.stepIdx];
    var fb = document.getElementById('solverFb');
    var isCorrect = (this.currentInput.trim() === st.correct.trim());

    if (isCorrect) {
      playTone('step'); fireConfetti(25);
      fb.innerHTML = '<div class="feedback ok" style="margin-top:10px">✓ Step Unlocked! Precision +5 XP</div>';
      this.awardXP(5);
      this.answered = true;
      var contBtn = document.getElementById('continueBtn');
      contBtn.textContent = (this.stepIdx < item.steps.length - 1) ? 'Proceed to Next Step →' : 'Unlock Next Section →';
      contBtn.disabled = false;
    } else {
      playTone('wrong');
      fb.innerHTML = '<div class="feedback no" style="margin-top:10px">✗ Not quite. Re-evaluate this step or request a clue!</div>';
      var self = this;
      setTimeout(function(){
        fb.innerHTML = '';
      }, 2500);
    }
  },

  next: function() {
    var item = JOURNEY[this.idx];
    if (item.type === 'solver') {
      if (!this.answered) {
        this.checkStep();
        return;
      }
      this.stepIdx++;
      this.answered = false;
      this.currentInput = '';
      this.hintTier = 0;
      if (this.stepIdx >= item.steps.length) {
        this.stepIdx = 0;
        this.awardXP(item.xp || 30);
        this.streak++;
        playTone('correct'); fireConfetti(45);
        this.idx++;
      }
    } else {
      this.idx++;
      if (this.idx >= JOURNEY.length) {
        this.idx = 0;
      }
    }
    this.render();
  },

  goBack: function() {
    if (this.idx > 0) {
      this.idx--;
      this.stepIdx = 0;
      this.answered = false;
      this.currentInput = '';
      this.hintTier = 0;
      this.render();
    }
  },

  exit: function() {
    this.idx = 0;
    this.stepIdx = 0;
    this.answered = false;
    this.currentInput = '';
    this.hintTier = 0;
    this.render();
  },

  // ═══ SIMULATION CONTROLLERS ═══
  mountSim: function(type) {
    var c = document.getElementById('conceptCanvas');
    var ctrls = document.getElementById('simControls');
    if (!c || !ctrls) return;
    var ctx = c.getContext('2d');
    var w = c.width, h = c.height;

    if (type === 'penShop') {
      function draw(pens, cost) {
        ctx.clearRect(0,0,w,h);
        ctx.fillStyle = '#1e3a5f'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('Stationery Counter: Packet of ' + pens + ' pens for ₹' + cost, 14, 25);
        var unitPrice = (cost / pens).toFixed(2);
        ctx.fillStyle = '#2563eb'; ctx.font = 'bold 16px sans-serif';
        ctx.fillText('Cost per pen = ₹' + cost + ' ÷ ' + pens + ' = ₹' + unitPrice, 14, 55);
        ctx.fillStyle = '#64748b'; ctx.font = '12px sans-serif';
        ctx.fillText('Fraction Form: ' + cost + '/' + pens + ' (Both are integers, ' + pens + ' ≠ 0) → Rational Number!', 14, 85);
        for (var i = 0; i < pens; i++) {
          ctx.fillStyle = '#3b82f6'; ctx.fillRect(20 + i * 55, 105, 14, 40);
          ctx.fillStyle = '#1e3a8a'; ctx.fillRect(22 + i * 55, 145, 10, 8);
        }
      }
      draw(5, 22);
      ctrls.innerHTML = '<div class="sim-row"><button class="sim-btn active" onclick="App.redrawPen(5, 22)">5 Pens for ₹22 (₹4.40 each)</button><button class="sim-btn" onclick="App.redrawPen(3, 15)">3 Pens for ₹15 (₹5.00 each)</button><button class="sim-btn" onclick="App.redrawPen(8, 36)">8 Pens for ₹36 (₹4.50 each)</button></div>';
      App.redrawPen = draw;
    } else if (type === 'lcmAdd') {
      function draw(d1, d2) {
        ctx.clearRect(0,0,w,h);
        ctx.fillStyle = '#1e3a5f'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('Equalizing Slice Sizes via LCM: Denominators ' + d1 + ' and ' + d2, 14, 25);
        var lcm = (d1 * d2);
        ctx.fillStyle = '#16a34a'; ctx.font = 'bold 15px sans-serif';
        ctx.fillText('LCM(' + d1 + ', ' + d2 + ') = ' + lcm + ' → Common Slice Size!', 14, 60);
        ctx.fillStyle = '#475569'; ctx.font = '12px sans-serif';
        ctx.fillText('Both fractions are resliced into ' + lcm + ' equal parts before adding numerators.', 14, 95);
      }
      draw(7, 8);
      ctrls.innerHTML = '<div class="sim-row"><button class="sim-btn active" onclick="App.redrawLcm(7, 8)">LCM(7, 8) = 56</button><button class="sim-btn" onclick="App.redrawLcm(5, 6)">LCM(5, 6) = 30</button><button class="sim-btn" onclick="App.redrawLcm(9, 11)">LCM(9, 11) = 99</button></div>';
      App.redrawLcm = draw;
    } else if (type === 'multDiv') {
      function draw(num, den) {
        ctx.clearRect(0,0,w,h);
        ctx.fillStyle = '#1e3a5f'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('Original Fraction: ' + num + '/' + den, 14, 28);
        ctx.fillStyle = '#7c3aed'; ctx.font = 'bold 16px sans-serif';
        ctx.fillText('Flipped Reciprocal: ' + den + '/' + num, 14, 65);
        ctx.fillStyle = '#15803d'; ctx.font = 'bold 14px sans-serif';
        ctx.fillText('Product = (' + num + '/' + den + ') × (' + den + '/' + num + ') = 1 (Balanced!)', 14, 105);
      }
      draw(3, 5);
      ctrls.innerHTML = '<div class="sim-row"><button class="sim-btn active" onclick="App.redrawRecip(3, 5)">3/5 ⇄ 5/3</button><button class="sim-btn" onclick="App.redrawRecip(-5, 8)">-5/8 ⇄ -8/5</button><button class="sim-btn" onclick="App.redrawRecip(11, 13)">11/13 ⇄ 13/11</button></div>';
      App.redrawRecip = draw;
    } else if (type === 'propsTile') {
      function draw(p) {
        ctx.clearRect(0,0,w,h);
        ctx.fillStyle = '#1e3a5f'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
        if (p === 'comm') {
          ctx.fillText('Commutative Property: a + b = b + a', 14, 25);
          ctx.fillStyle = '#2563eb'; ctx.font = 'bold 14px sans-serif';
          ctx.fillText('(-3/7) + (4/9) = (4/9) + (-3/7) = 1/63', 14, 65);
          ctx.fillStyle = '#16a34a'; ctx.fillText('Order swapped → Sum remains identical! ✓', 14, 100);
        } else {
          ctx.fillText('Associative Property: (a + b) + c = a + (b + c)', 14, 25);
          ctx.fillStyle = '#7c3aed'; ctx.font = 'bold 14px sans-serif';
          ctx.fillText('[(1/11) + (2/13)] + 7/6 = 1/11 + [(2/13) + 7/6]', 14, 65);
          ctx.fillStyle = '#16a34a'; ctx.fillText('Grouping changed → Sum remains identical! ✓', 14, 100);
        }
      }
      draw('comm');
      ctrls.innerHTML = '<div class="sim-row"><button class="sim-btn active" onclick="App.redrawProp(\\'comm\\')">Commutative Test</button><button class="sim-btn" onclick="App.redrawProp(\\'assoc\\')">Associative Test</button></div>';
      App.redrawProp = draw;
    }
  }
};

window.addEventListener('DOMContentLoaded', function(){ App.init(); });
if (document.readyState === 'complete' || document.readyState === 'interactive') { App.init(); }
</script>
</body></html>
""")

print("Part 3 added.")
