import sys

# Script to build the unified, single-journey HTML
# It combines:
# - Seema & Sachin's Stationary Shop Narrative Journey (Nodes 1 to 5)
# - Step-by-Step Interactive Escape Run Solver embedded in EVERY worked example & checkpoint
# - 100% of AD Textbook Exercises (1A, 1B, 1C & Prescribed Board Solved Questions) seamlessly woven into the flow
# - Multi-modal smart input: Virtual Math Keypad + Draggable/Tap Tiles + Free Input + LaTeX live preview
# - 4-Tier Progressive Hint Ladder (Attention, Relationship, Strategy, Procedure)
# - Full Web Audio FX, XP, Streak Shields, Leveling, and Confetti

parts = []

parts.append("""<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<title>Class 8 Rational Numbers (AD Edition — Unified Gamified Journey) — Aasha Learning Ecosystem</title>
<style>
/* MathIsolation: true */
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#f0f4ff;--surface:#ffffff;--text:#0f172a;--muted:#475569;
  --blue:#2563eb;--blue-dk:#1d4ed8;--blue-lt:#eff6ff;
  --green:#16a34a;--green-dk:#15803d;--green-lt:#f0fdf4;
  --red:#dc2626;--red-lt:#fef2f2;
  --amber:#d97706;--amber-lt:#fffbeb;
  --purple:#7c3aed;--purple-lt:#f5f3ff;
  --border:#cbd5e1;--border-dk:#94a3b8;
  --shadow:0 4px 6px -1px rgba(15,23,42,.08),0 2px 4px -2px rgba(15,23,42,.05);
  --shadow-lg:0 10px 25px -3px rgba(15,23,42,.12),0 4px 6px -4px rgba(15,23,42,.07);
  --radius:16px;--radius-sm:12px;--radius-xs:8px;
  --brand:#1e3a5f;--brand-lt:#2d5a8e;
  --font:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
}
body{font-family:var(--font);background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden;-webkit-tap-highlight-color:transparent}
.app{max-width:540px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;background:var(--surface);box-shadow:0 0 40px rgba(0,0,0,.08)}

/* Header */
.brand-header{background:linear-gradient(135deg,var(--brand),var(--brand-lt));padding:12px 16px;display:flex;align-items:center;gap:12px;color:#fff}
.brand-logo{width:42px;height:42px;flex-shrink:0}
.brand-logo svg{width:100%;height:100%}
.brand-info{flex:1;min-width:0}
.brand-name{font-size:.85rem;font-weight:800;letter-spacing:.02em;line-height:1.2}
.brand-name-hi{font-size:.72rem;opacity:.92;line-height:1.2}
.brand-tagline{font-size:.65rem;opacity:.8;margin-top:2px}

/* Topbar */
.topbar{display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--surface);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:50}
.exit-btn{background:none;border:none;font-size:20px;color:var(--muted);cursor:pointer;padding:4px}
.progress-track{flex:1;height:10px;background:var(--border);border-radius:10px;overflow:hidden}
.progress-fill{height:100%;background:linear-gradient(90deg,var(--blue),var(--purple));border-radius:10px;transition:width .4s ease;width:0}
.stat{display:inline-flex;align-items:center;gap:4px;font-size:.75rem;font-weight:800;padding:4px 9px;border-radius:16px;white-space:nowrap}
.stat.coins{color:var(--amber);background:var(--amber-lt);border:1px solid #fde68a}
.stat.xp{color:var(--purple);background:var(--purple-lt);border:1px solid #ddd6fe}
.stat.lvl{color:var(--blue);background:var(--blue-lt);border:1px solid #bfdbfe}
.stat.streak{color:var(--red);background:var(--red-lt);border:1px solid #fecaca}

/* Screen container */
.screen{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:16px 16px 95px;min-height:calc(100vh - 120px)}

/* Concept Frame */
.concept-frame{background:#ffffff;border:2px solid var(--border);border-radius:var(--radius);padding:18px 16px;width:100%;box-shadow:var(--shadow);margin-bottom:14px}
.concept-badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:.70rem;font-weight:800;letter-spacing:.04em;color:var(--blue-dk);background:var(--blue-lt);margin-bottom:8px}
.inquiry-title{font-size:1.15rem;font-weight:800;color:var(--brand);margin-bottom:10px;line-height:1.4}
.concept-def{font-size:.95rem;line-height:1.8;color:var(--text);margin-bottom:14px}

/* LLE Text & Connectives */
.lle-text{font-size:1.02rem;line-height:2.2;color:var(--text);margin:8px 0;text-align:left}
.lle-text-sm{font-size:.90rem;line-height:1.8;color:var(--text);margin:4px 0;text-align:left}
.word{cursor:pointer;border-radius:4px;padding:1px 3px;transition:all .15s;border-bottom:1.5px dotted #94a3b8;font-weight:600}
.word:hover{background:#dbeafe;color:var(--blue-dk)}
.connective{color:var(--blue-dk);font-weight:700;cursor:pointer;border-bottom:2px dotted var(--blue);padding:1px 3px}
.connective-hi{color:var(--purple);font-size:.85em;font-weight:600}

/* Math notation */
.math{font-family:'Cambria Math','Times New Roman',serif;font-style:italic;font-weight:700;padding:0 2px;color:#1e3a8a}
.frac{display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;font-size:.88em;line-height:1;margin:0 3px}
.frac-top{border-bottom:1.5px solid currentColor;padding:0 3px}
.frac-bot{padding:0 3px}

/* Simulation Canvas */
.sim-container{background:#f8fafc;border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:12px;margin:12px 0;width:100%}
.sim-canvas{display:block;margin:0 auto;max-width:100%;height:auto;border-radius:var(--radius-xs);touch-action:none;background:#ffffff;border:1px solid #e2e8f0}
.sim-controls{margin-top:10px;display:flex;flex-direction:column;gap:8px}
.sim-row{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px}
.sim-btn{min-height:38px;background:var(--blue-lt);color:var(--blue-dk);border:1.5px solid var(--blue);border-radius:8px;padding:6px 12px;font-weight:700;font-size:.82rem;cursor:pointer;transition:all .15s}
.sim-btn:hover{background:var(--blue);color:#fff}
.sim-btn.active{background:var(--blue);color:#fff}
.sim-caption{font-size:.78rem;color:var(--muted);text-align:center;margin-top:8px;line-height:1.4}

/* Gamified Step Solver Container (Escape Run & Escapp adapted) */
.solver-card{background:#ffffff;border:2.5px solid #2563eb;border-radius:var(--radius);padding:18px 16px;width:100%;box-shadow:var(--shadow-lg);margin-bottom:14px}
.solver-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;border-bottom:1px solid #e2e8f0;padding-bottom:8px}
.solver-badge{font-size:.70rem;font-weight:800;color:#1d4ed8;background:#eff6ff;padding:3px 8px;border-radius:8px}
.step-indicator{display:flex;gap:6px;align-items:center}
.step-dot{width:10px;height:10px;border-radius:50%;background:#cbd5e1}
.step-dot.active{background:#2563eb;transform:scale(1.2)}
.step-dot.done{background:#16a34a}

.solver-q{font-size:1.05rem;font-weight:800;color:var(--text);margin-bottom:12px;line-height:1.4}
.solver-subgoal{font-size:.92rem;font-weight:700;color:#1e3a8a;background:#eff6ff;padding:10px 12px;border-radius:10px;border-left:4px solid #2563eb;margin-bottom:12px}

/* Smart Input & Live LaTeX Box */
.input-display-box{min-height:50px;background:#f8fafc;border:2px dashed #94a3b8;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:800;color:#1e293b;padding:8px 14px;margin-bottom:10px}
.input-display-box.focused{border-color:#2563eb;background:#ffffff}

/* Math Keypad */
.keypad-grid{display:grid;grid-template-columns:repeat(5, 1fr);gap:6px;margin-bottom:10px}
.key-btn{height:42px;border-radius:8px;border:1px solid #cbd5e1;background:#ffffff;font-size:1rem;font-weight:800;color:#0f172a;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;touch-action:manipulation}
.key-btn:hover{background:#f1f5f9;border-color:#2563eb}
.key-btn.action{background:#f1f5f9;color:#475569;font-size:.85rem}
.key-btn.submit{background:linear-gradient(135deg, #16a34a, #15803d);color:#fff;border:none}

/* Tap Chips / Tiles */
.chip-rack{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:10px}
.chip-btn{padding:8px 14px;background:#f1f5f9;border:1.5px solid #cbd5e1;border-radius:10px;font-size:.9rem;font-weight:800;cursor:pointer;color:#1e293b}
.chip-btn:hover{border-color:#2563eb;background:#eff6ff;color:#1d4ed8}

/* Hint Ladder */
.hint-ladder-wrap{margin-top:10px;display:flex;flex-direction:column;gap:6px}
.hint-btn{background:none;border:none;color:#d97706;font-size:.80rem;font-weight:800;cursor:pointer;text-align:left;display:inline-flex;align-items:center;gap:4px}
.hint-box{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:8px 12px;font-size:.82rem;color:#92400e;line-height:1.4}

/* Bottom Bar */
.bottom-bar{position:fixed;bottom:0;left:0;right:0;max-width:540px;margin:0 auto;padding:12px 16px;background:var(--surface);border-top:1px solid var(--border);box-shadow:0 -4px 12px rgba(0,0,0,.05);display:none;z-index:60}
.btn-primary{width:100%;padding:14px;border-radius:12px;font-size:1rem;font-weight:800;background:linear-gradient(135deg,var(--blue),var(--blue-dk));color:#fff;border:none;cursor:pointer;box-shadow:0 4px 12px rgba(37,99,235,.25);transition:all .15s}
.btn-primary:hover{opacity:.95}
.btn-primary:disabled{opacity:.5;cursor:not-allowed;box-shadow:none}
.btn-back{width:auto;display:inline-block;padding:10px 16px;margin-right:8px;background:none;border:1px solid var(--border);border-radius:10px;color:var(--muted);font-size:.9rem;font-weight:700;cursor:pointer}

/* Dialog & Confetti */
.lle-dialog{border:none;border-radius:18px;padding:0;box-shadow:0 12px 36px rgba(0,0,0,.25);background:var(--surface);max-width:380px;width:90%;margin:auto}
.lle-dialog::backdrop{background:rgba(15,23,42,.65);backdrop-filter:blur(3px)}
.dlg-content{padding:18px;display:flex;flex-direction:column;gap:10px}
.dlg-header{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding-bottom:8px}
.dlg-badge{font-size:.68rem;font-weight:800;letter-spacing:.05em;color:var(--blue-dk);background:var(--blue-lt);padding:2px 8px;border-radius:12px}
.dlg-close-x{background:none;border:none;font-size:1.2rem;color:#64748b;cursor:pointer;padding:2px 6px}
.dlg-word-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:4px}
.dlg-word{font-size:1.5rem;font-weight:900;color:#1e293b}
.dlg-audio-btn{display:inline-flex;align-items:center;gap:4px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:20px;padding:4px 10px;font-size:.78rem;font-weight:800;color:#0f172a;cursor:pointer}
.dlg-phonics-row{display:flex;align-items:baseline;gap:6px;background:#f8fafc;padding:6px 10px;border-radius:8px;border-left:3px solid #8b5cf6}
.dlg-phonics-label{font-size:.75rem;font-weight:700;color:#64748b}
.dlg-phonics{font-size:.95rem;font-weight:800;color:#6d28d9}
.dlg-meaning-row{display:flex;flex-direction:column;gap:3px;background:#f0fdf4;padding:8px 10px;border-radius:8px;border-left:3px solid #22c55e}
.dlg-meaning-label{font-size:.75rem;font-weight:700;color:#15803d}
.dlg-hindi{font-size:1.05rem;font-weight:800;color:#166534}
.dlg-desc{font-size:.72rem;color:#64748b;line-height:1.4}
.dlg-btn{width:100%;margin-top:6px;padding:10px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;border:none;border-radius:12px;font-size:.92rem;font-weight:800;cursor:pointer}
#confettiCanvas{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99}
</style>
</head>
<body>
<div class="app">
  <div class="brand-header">
    <div class="brand-logo">
      <svg viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="46" fill="#2563eb"/>
        <path d="M50 16L78 78H62L50 48L38 78H22L50 16Z" fill="#ffffff"/>
      </svg>
    </div>
    <div class="brand-info">
      <div class="brand-name">AASHA LEARNING ECOSYSTEM</div>
      <div class="brand-name-hi">आशा लर्निंग इकोसिस्टम • कक्षा 8 गणित (AD स्कूल)</div>
      <div class="brand-tagline">Chapter 1: Rational Numbers — Unified Step-by-Step Gamified Journey</div>
    </div>
  </div>

  <div class="topbar">
    <button class="exit-btn" onclick="App.exit()" title="Exit">✕</button>
    <div class="progress-track"><div class="progress-fill" id="progressFill"></div></div>
    <span class="stat coins">🪙 <span id="statCoins">0</span></span>
    <span class="stat xp">⭐ <span id="statXp">0</span></span>
    <span class="stat lvl" id="statLvl">Lv 1</span>
    <span class="stat streak" id="statStreakWrap" style="display:none">🔥 <span id="statStreak">0</span></span>
  </div>

  <div class="screen" id="screen"></div>

  <div class="bottom-bar" id="bottomBar">
    <div style="display:flex;align-items:center;justify-content:center;max-width:540px;margin:0 auto">
      <button class="btn-back" id="backBtn" onclick="App.goBack()" style="display:none">← Back</button>
      <button class="btn-primary" id="continueBtn" onclick="App.next()">Continue →</button>
    </div>
  </div>
</div>

<dialog id="wordDialog" class="lle-dialog">
  <div class="dlg-content">
    <div class="dlg-header">
      <span class="dlg-badge">AASHA LLE BILINGUAL BRIDGE</span>
      <button class="dlg-close-x" onclick="document.getElementById('wordDialog').close();document.getElementById('wordDialog').style.display='none'">✕</button>
    </div>
    <div class="dlg-word-row">
      <span class="dlg-word" id="dlgWord">Word</span>
      <button class="dlg-audio-btn" id="dlgAudioBtn" onclick="speakCurrentWord()">🔊 बोलें</button>
    </div>
    <div class="dlg-phonics-row">
      <span class="dlg-phonics-label">उच्चारण (Phonics):</span>
      <span class="dlg-phonics" id="dlgPhonics">—</span>
    </div>
    <div class="dlg-meaning-row">
      <span class="dlg-meaning-label">सरल अर्थ (Meaning):</span>
      <span class="dlg-hindi" id="dlgHindi">—</span>
    </div>
    <div class="dlg-desc" id="dlgDesc">Aasha Universal Teaching Vocabulary</div>
    <button class="dlg-btn" onclick="document.getElementById('wordDialog').close();document.getElementById('wordDialog').style.display='none'">ठीक है (Got It)</button>
  </div>
</dialog>

<canvas id="confettiCanvas"></canvas>

<script>
// ═══ LLE VOCABULARY & TRANSLATION ═══
var CONN = {
  "if": "यदि / अगर", "because": "क्योंकि", "therefore": "इसलिए", "however": "हालांकि / लेकिन",
  "so that": "ताकि", "which means": "जिसका अर्थ है", "for example": "उदाहरण के लिए", "since": "चूँकि",
  "then": "तब / तो", "when": "जब", "while": "जबकि", "instead of": "के बजाय", "thus": "इस प्रकार",
  "hence": "अतः", "also": "भी", "but": "परंतु / लेकिन", "and": "और", "finally": "अंत में"
};

var WM = {
  "rational": "परिमेय संख्या (रैशनल)", "number": "संख्या (नंबर)", "numbers": "संख्याएँ (नंबर्स)",
  "integer": "पूर्णांक (इंटीजर)", "integers": "पूर्णांक (इंटीजर्स)", "zero": "शून्य (ज़ीरो)",
  "numerator": "अंश (न्यूमरेटर)", "denominator": "हर (डिनॉमिनेटर)", "fraction": "भिन्न (फ्रैक्शन)",
  "positive": "धनात्मक (पॉज़िटिव)", "negative": "ऋणात्मक (नेगेटिव)", "divide": "भाग देना (डिवाइड)",
  "division": "भाग (डिवीजन)", "multiply": "गुणा करना (मल्टीप्लाई)", "multiplication": "गुणा (मल्टीप्लिकेशन)",
  "add": "जोड़ना (ऐड)", "addition": "जोड़ (एडिशन)", "subtract": "घटाना (सबट्रैक्ट)", "subtraction": "घटाव (सबट्रैक्शन)",
  "reciprocal": "व्युत्क्रम (रेसिप्रोकल)", "inverse": "प्रतिलोम (इन्वर्स)", "identity": "तत्समक (आइडेंटिटी)",
  "commutative": "क्रमविनिमेय (कम्यूटेटिव)", "associative": "सहचारी (असोसिएटिव)", "distributive": "वितरण नियम (डिस्ट्रीब्यूटिव)",
  "closure": "संवृत (क्लोज़र)", "property": "गुणधर्म (प्रॉपर्टी)", "properties": "गुणधर्म (प्रॉपर्टीज़)",
  "packet": "पैकेट (पैकेट)", "cost": "लागत (कॉस्ट)", "pen": "कलम (पेन)", "pens": "कलमें (पेन्स)",
  "wholesale": "थोक बाज़ार (होलसेल)", "shopkeeper": "दुकानदार (शॉपकीपर)", "lcm": "ल.स.प. (एलसीएम)"
};

function rt(text, sm) {
  var cls = sm ? 'lle-text-sm' : 'lle-text';
  var html = text || '';
  html = html.replace(/(-?\\d+)\\/(\\d+)/g, '<span class="frac"><span class="frac-top">$1</span><span class="frac-bot">$2</span></span>');
  var keys = Object.keys(CONN).sort(function(a,b){ return b.length - a.length; });
  var connCount = 0, result = '', i = 0;
  while (i < html.length) {
    var ch = html[i];
    if (ch === '.' || ch === '!' || ch === '?') { connCount = 0; result += ch; i++; continue; }
    if (ch === '<') {
      var ci = html.indexOf('>', i);
      if (ci >= 0) { result += html.substring(i, ci + 1); i = ci + 1; continue; }
    }
    var matched = false;
    if (i === 0 || !/[a-zA-Z]/.test(html[i-1])) {
      for (var k = 0; k < keys.length; k++) {
        var c = keys[k];
        var sub = html.substring(i, i + c.length);
        if (sub.toLowerCase() === c.toLowerCase()) {
          var ai = i + c.length;
          if (ai < html.length && /[a-zA-Z]/.test(html[ai])) continue;
          var hi = CONN[c];
          connCount++;
          if (connCount <= 2) {
            result += '<span class="connective" data-w="' + sub + '" data-h="' + hi + '">' + sub + ' <span class="connective-hi">(' + hi + ')</span></span>';
          } else {
            result += '<span class="word" data-w="' + sub.toLowerCase() + '" data-h="' + hi + '">' + sub + '</span>';
          }
          i += c.length; matched = true; break;
        }
      }
    }
    if (matched) continue;
    if (/[a-zA-Z]/.test(ch)) {
      var ws = i;
      while (i < html.length && /[a-zA-Z]/.test(html[i])) i++;
      var word = html.substring(ws, i);
      var cw = word.toLowerCase();
      var hiVal = WM[cw] || '';
      result += '<span class="word" data-w="' + cw + '" data-h="' + (hiVal ? hiVal.replace(/"/g, '&quot;') : '') + '">' + word + '</span>';
    } else {
      result += ch; i++;
    }
  }
  return '<div class="' + cls + '">' + result + '</div>';
}

document.addEventListener('click', function(e) {
  var el = e.target.closest('.connective') || e.target.closest('.word');
  if (el) showWord(el.getAttribute('data-w'), el.getAttribute('data-h'));
});

function showWord(w, h) {
  var dlg = document.getElementById('wordDialog');
  var cw = (w || '').toLowerCase().trim();
  document.getElementById('dlgWord').textContent = w;
  var fullVal = (h && h !== '—') ? h : (WM[cw] || (cw + ' (शब्द)'));
  var mMatch = fullVal.match(/^(.*?)\\s*\\((.*?)\\)$/);
  var meaning = fullVal, phonics = cw;
  if (mMatch) { meaning = mMatch[1].trim(); phonics = mMatch[2].trim(); }
  document.getElementById('dlgPhonics').textContent = phonics;
  document.getElementById('dlgHindi').textContent = meaning;
  dlg.style.display = 'block';
  if (typeof dlg.showModal === 'function' && !dlg.open) dlg.showModal();
}

function speakCurrentWord() {
  var w = document.getElementById('dlgWord').textContent;
  if (w && 'speechSynthesis' in window) {
    var u = new SpeechSynthesisUtterance(w);
    u.lang = 'en-IN'; window.speechSynthesis.speak(u);
  }
}

// ═══ AUDIO FX & PARTICLES ═══
var _audioCtx = null;
function playTone(type) {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var osc = _audioCtx.createOscillator(), gain = _audioCtx.createGain();
    osc.connect(gain); gain.connect(_audioCtx.destination);
    var now = _audioCtx.currentTime;
    if (type === 'tap') {
      osc.frequency.setValueAtTime(440, now); gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
    } else if (type === 'step') {
      osc.frequency.setValueAtTime(587.33, now); gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'correct') {
      osc.frequency.setValueAtTime(523.25, now); osc.frequency.setValueAtTime(659.25, now + 0.1);
      gain.gain.setValueAtTime(0.12, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now); osc.stop(now + 0.28);
    } else if (type === 'wrong') {
      osc.frequency.setValueAtTime(240, now); gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now); osc.stop(now + 0.25);
    } else if (type === 'levelup') {
      [523.25, 659.25, 783.99, 1046.5].forEach(function(f, idx){
        var o = _audioCtx.createOscillator(), g = _audioCtx.createGain();
        o.connect(g); g.connect(_audioCtx.destination);
        o.frequency.setValueAtTime(f, now + idx * 0.08); g.gain.setValueAtTime(0.1, now + idx * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + (idx + 1) * 0.08 + 0.1);
        o.start(now + idx * 0.08); o.stop(now + (idx + 1) * 0.08 + 0.1);
      });
    }
  } catch(e){}
}

function fireConfetti(count) {
  var canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  var particles = [];
  for (var i = 0; i < (count || 45); i++) {
    particles.push({
      x: canvas.width / 2, y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.7) * 14,
      size: Math.random() * 8 + 4,
      color: ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#dc2626'][Math.floor(Math.random() * 5)],
      life: 55
    });
  }
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var active = false;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (p.life > 0) {
        active = true; p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.life--;
        ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    }
    if (active) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  requestAnimationFrame(animate);
}
""")

print("Part 1 added.")
with open(r"C:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\chapters\assemble_unified.py", "w", encoding="utf-8") as f:
    f.write("".join(parts))
