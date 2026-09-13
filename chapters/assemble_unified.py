<!DOCTYPE html><html lang="en"><head>
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
  html = html.replace(/(-?\d+)\/(\d+)/g, '<span class="frac"><span class="frac-top">$1</span><span class="frac-bot">$2</span></span>');
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
  var mMatch = fullVal.match(/^(.*?)\s*\((.*?)\)$/);
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

// ═══ UNIFIED CHAPTER SEQUENCE WITH EMBEDDED STEP-SOLVERS ═══
// This structure unifies:
// Node Intro -> Concept Theory -> Interactive Manipulative -> Step-by-Step Escape Solver (AD Exercises) -> Milestone Reward

var JOURNEY = [
  // ─── NODE 1: THE STATIONERY SHOP & THE BIRTH OF RATIONAL NUMBERS ───
  {
    type: "intro",
    badge: "ACT 1: THE STATIONERY SHOP",
    icon: "🏪",
    title: "Seema & Sachin at the Stationery Shop",
    sub: "Seema wants to buy 3 pens, each costing ₹5. Her brother Sachin wants 2 similar pens. The shopkeeper offers a packet of 5 pens for ₹22. Cost per pen = 22/5 = ₹4.40. Neither a whole number nor an integer: a Rational Number p/q!"
  },
  {
    type: "concept",
    badge: "AD TEXTBOOK CONCEPT (PAGE 1)",
    title: "What is a Rational Number p/q?",
    text: "A rational number is a number that can be expressed as a quotient or fraction p/q of two integers, where p (numerator) is an integer and q (denominator) is a non-zero integer (q ≠ 0). Why can q never be 0? Because dividing by zero has no defined meaning in mathematics. Any integer a can be written as a/1. In standard form, q is positive and p, q share no common factor other than 1.",
    simType: "penShop",
    caption: "Interactive Stationery Counter: Change pen pack quantities and discover how ratios p/q emerge!"
  },
  {
    type: "solver",
    badge: "AD TEXTBOOK CHALLENGE: EMBARK ON",
    title: "Stationery Vault: Determine the Rational Cost",
    q: "A packet of 5 pens costs ₹22. Find the exact unit price and express it as a rational number p/q in standard form.",
    steps: [
      {
        goal: "Step 1: Set up the unit price ratio (Total Price ÷ Total Pens).",
        chips: ["22 / 5", "5 / 22", "22 - 5", "22 * 5"],
        correct: "22 / 5",
        hints: [
          "Look at the total amount paid (22) and the number of items received (5).",
          "Unit cost is calculated by dividing total cost by quantity.",
          "Select the ratio of 22 divided by 5.",
          "Tap the chip '22 / 5'."
        ]
      },
      {
        goal: "Step 2: Calculate the exact decimal value of 22 ÷ 5.",
        chips: ["4.40", "4.20", "4.00", "5.20"],
        correct: "4.40",
        hints: [
          "Divide 22 by 5: 5 goes into 20 four times, with remainder 2.",
          "Add decimal point: 20 tenths divided by 5 equals 4 tenths.",
          "The quotient is 4.4 (or ₹4.40).",
          "Select '4.40'."
        ]
      },
      {
        goal: "Step 3: Verify standard form constraint for rational numbers.",
        chips: ["p=22, q=5 (both integers, q≠0)", "q can be 0", "Fractions cannot have decimals"],
        correct: "p=22, q=5 (both integers, q≠0)",
        hints: [
          "Recall the definition of a rational number p/q.",
          "Check whether 22 and 5 are integers, and whether the denominator is non-zero.",
          "5 is non-zero, and gcd(22, 5) = 1.",
          "Select 'p=22, q=5 (both integers, q≠0)'."
        ]
      }
    ],
    xp: 25
  },
  {
    type: "solver",
    badge: "AD EXERCISE 1A: STANDARD FORM",
    title: "Standard Form Vault: Purge Common Factors",
    q: "Reduce the rational number 32 / -48 into Standard Form with a positive denominator.",
    steps: [
      {
        goal: "Step 1: Move the negative sign to the numerator so the denominator becomes positive.",
        chips: ["-32 / 48", "32 / 48", "-32 / -48", "48 / -32"],
        correct: "-32 / 48",
        hints: [
          "In standard form, the denominator must strictly be positive.",
          "Multiply both numerator and denominator by -1.",
          "This yields -32 in numerator and +48 in denominator.",
          "Select '-32 / 48'."
        ]
      },
      {
        goal: "Step 2: Identify the Highest Common Factor (HCF) of 32 and 48.",
        chips: ["16", "8", "12", "6"],
        correct: "16",
        hints: [
          "List common factors of 32 (1,2,4,8,16,32) and 48 (1,2,3,4,6,8,12,16,24,48).",
          "Find the greatest number that divides both without remainder.",
          "Both are divisible by 8, but an even higher factor is 16.",
          "Select '16'."
        ]
      },
      {
        goal: "Step 3: Divide both parts by 16 to find the co-prime standard form.",
        chips: ["-2/3", "-4/6", "-8/12", "2/3"],
        correct: "-2/3",
        hints: [
          "-32 ÷ 16 = -2.",
          "48 ÷ 16 = 3.",
          "Since 2 and 3 are co-prime, the fraction cannot be reduced further.",
          "Select '-2/3'."
        ]
      }
    ],
    xp: 30
  },
  {
    type: "milestone",
    icon: "🥉",
    title: "Act 1 Conquered: Rational Foundation",
    reward: "+55 XP Earned! You mastered p/q definitions and standard form."
  },

  // ─── NODE 2: ADDITION & COMMON DENOMINATOR EQUALIZER (EX 1A) ───
  {
    type: "intro",
    badge: "ACT 2: FRACTION SLICE EQUALIZER",
    icon: "🍕",
    title: "Adding Unequal Portions",
    sub: "How do we add portions with unequal denominators like -9/7 and 5/8? Denominators tell us slice sizes. We cannot add 7-part slices to 8-part slices directly without finding a common denominator via LCM!"
  },
  {
    type: "concept",
    badge: "AD TEXTBOOK CONCEPT (PAGE 3)",
    title: "Addition & Additive Inverse Laws",
    text: "When denominators are identical: (a/b) + (c/b) = (a+c)/b. When denominators differ, we calculate LCM(b, d) and multiply numerator and denominator to convert them into equivalent slices. Every rational number a/b has an Additive Inverse -a/b such that a/b + (-a/b) = 0. Subtraction of c/d from a/b means adding the additive inverse: a/b - c/d = a/b + (-c/d).",
    simType: "lcmAdd",
    caption: "LCM Slice Equalizer: Notice how finding common denominators reslices fractions into equal units!"
  },
  {
    type: "solver",
    badge: "AD TEXTBOOK SOLVED EXAMPLE (PAGE 3)",
    title: "LCM Bridge: Add -9/7 and 5/8",
    q: "Solve step-by-step: (-9/7) + (5/8).",
    steps: [
      {
        goal: "Step 1: Determine the LCM of denominators 7 and 8.",
        chips: ["56", "15", "48", "64"],
        correct: "56",
        hints: [
          "7 and 8 are co-prime (they share no factors other than 1).",
          "For co-prime numbers, LCM is simply their product: 7 × 8.",
          "7 × 8 = 56.",
          "Select '56'."
        ]
      },
      {
        goal: "Step 2: Scale -9/7 so its denominator is 56.",
        chips: ["-72/56", "-63/56", "-9/56", "72/56"],
        correct: "-72/56",
        hints: [
          "Multiply both numerator and denominator by 8.",
          "-9 × 8 = -72, and 7 × 8 = 56.",
          "The equivalent fraction is -72/56.",
          "Select '-72/56'."
        ]
      },
      {
        goal: "Step 3: Scale 5/8 so its denominator is 56.",
        chips: ["35/56", "40/56", "5/56", "25/56"],
        correct: "35/56",
        hints: [
          "Multiply both numerator and denominator by 7.",
          "5 × 7 = 35, and 8 × 7 = 56.",
          "The equivalent fraction is 35/56.",
          "Select '35/56'."
        ]
      },
      {
        goal: "Step 4: Combine numerators [-72 + 35] / 56.",
        chips: ["-37/56", "-107/56", "37/56", "-37/112"],
        correct: "-37/56",
        hints: [
          "Add numerators: -72 + 35.",
          "Since -72 has greater absolute value, the result is negative: -(72 - 35) = -37.",
          "Keep the common denominator 56.",
          "Select '-37/56'."
        ]
      }
    ],
    xp: 35
  },
  {
    type: "solver",
    badge: "AD EXERCISE 1A Q2(f): SUBTRACTION",
    title: "Subtraction Chamber: Solve (-4/7) - (-8/9)",
    q: "Subtract -8/9 from -4/7 step-by-step.",
    steps: [
      {
        goal: "Step 1: Rewrite subtraction as adding the additive inverse of -8/9.",
        chips: ["-4/7 + 8/9", "-4/7 - 8/9", "4/7 + 8/9", "4/7 - 8/9"],
        correct: "-4/7 + 8/9",
        hints: [
          "Subtracting a negative number is equivalent to adding its positive inverse.",
          "- (-8/9) becomes + 8/9.",
          "The expression becomes -4/7 + 8/9.",
          "Select '-4/7 + 8/9'."
        ]
      },
      {
        goal: "Step 2: Find common denominator LCM(7, 9).",
        chips: ["63", "56", "72", "16"],
        correct: "63",
        hints: [
          "7 and 9 share no common factor.",
          "LCM(7, 9) = 7 × 9 = 63.",
          "Select '63'."
        ]
      },
      {
        goal: "Step 3: Scale numerators: [(-4 × 9) + (8 × 7)] / 63.",
        chips: ["[-36 + 56] / 63", "[-36 - 56] / 63", "[36 + 56] / 63"],
        correct: "[-36 + 56] / 63",
        hints: [
          "-4 × 9 = -36.",
          "8 × 7 = 56.",
          "Combine them over 63: [-36 + 56] / 63.",
          "Select '[-36 + 56] / 63'."
        ]
      },
      {
        goal: "Step 4: Compute final simplified difference.",
        chips: ["20/63", "-20/63", "-92/63", "92/63"],
        correct: "20/63",
        hints: [
          "56 - 36 = 20.",
          "Denominator is 63.",
          "Result is 20/63.",
          "Select '20/63'."
        ]
      }
    ],
    xp: 35
  },
  {
    type: "milestone",
    icon: "🥈",
    title: "Act 2 Conquered: Operations Master",
    reward: "+70 XP Earned! You mastered fraction addition, subtraction and LCM scaling."
  },

  // ─── NODE 3: MULTIPLICATION & RECIPROCALS (EX 1A) ───
  {
    type: "intro",
    badge: "ACT 3: THE FLIPPED TWIN",
    icon: "⚖️",
    title: "Multiplication & Reciprocals",
    sub: "Multiplying fractions multiplies numerators together and denominators together. When a fraction meets its inverted twin, they balance into 1! Division is simply multiplying by the reciprocal."
  },
  {
    type: "concept",
    badge: "AD TEXTBOOK CONCEPT (PAGE 4)",
    title: "Reciprocals & Non-Zero Division",
    text: "Product rule: (a/b) × (c/d) = (ac)/(bd). If (a/b) × (c/d) = 1, then c/d is called the Reciprocal or Multiplicative Inverse of a/b. Why does 0 have no reciprocal? Because 0 = 0/1; flipping it gives 1/0, which is undefined! Division is the inverse of multiplication: (a/b) ÷ (c/d) = (a/b) × (d/c) for c/d ≠ 0.",
    simType: "multDiv",
    caption: "Reciprocal Balance Flipper: Flip the fraction to produce product 1!"
  },
  {
    type: "solver",
    badge: "AD EXERCISE 1A Q3(c): MULTIPLICATION",
    title: "Cross-Cancellation Vault: (11/-13) × (-39/22)",
    q: "Multiply 11/-13 by -39/22 step-by-step using cross-cancellation.",
    steps: [
      {
        goal: "Step 1: Standardize signs and observe the sign of the product.",
        chips: ["Positive (+), because negative × negative = positive", "Negative (-)", "Zero"],
        correct: "Positive (+), because negative × negative = positive",
        hints: [
          "Both fractions are negative (-11/13 and -39/22).",
          "When multiplying two negative numbers, the negatives cancel out.",
          "The product is strictly positive.",
          "Select 'Positive (+)...'."
        ]
      },
      {
        goal: "Step 2: Cross-cancel common factors between numerators and denominators.",
        chips: ["11 divides 22 into 2, and 13 divides 39 into 3", "Multiply 11 by 39 without cancelling", "Subtract 11 from 22"],
        correct: "11 divides 22 into 2, and 13 divides 39 into 3",
        hints: [
          "Look diagonally: 11 and 22 share factor 11 (22 ÷ 11 = 2).",
          "13 and 39 share factor 13 (39 ÷ 13 = 3).",
          "Cross-cancellation reduces the arithmetic to (1 × 3) / (1 × 2).",
          "Select '11 divides 22 into 2, and 13 divides 39 into 3'."
        ]
      },
      {
        goal: "Step 3: Multiply remaining terms to obtain the final fraction.",
        chips: ["3/2", "2/3", "-3/2", "6/4"],
        correct: "3/2",
        hints: [
          "Numerator: 1 × 3 = 3.",
          "Denominator: 1 × 2 = 2.",
          "Final fraction is 3/2.",
          "Select '3/2'."
        ]
      }
    ],
    xp: 35
  },
  {
    type: "solver",
    badge: "AD EXERCISE 1A Q4(a): DIVISION",
    title: "Division Gate: (16/7) ÷ (-8/14)",
    q: "Divide 16/7 by -8/14 step-by-step.",
    steps: [
      {
        goal: "Step 1: Invert divisor (-8/14) into its reciprocal.",
        chips: ["14 / -8", "-8 / 14", "8 / 14", "7 / 16"],
        correct: "14 / -8",
        hints: [
          "Division of fractions converts to multiplication by the divisor's reciprocal.",
          "The reciprocal of -8/14 is 14/-8.",
          "Select '14 / -8'."
        ]
      },
      {
        goal: "Step 2: Rewrite as multiplication: (16/7) × (-14/8).",
        chips: ["Cross-cancel 7 into 14 (gives 2) and 8 into 16 (gives 2)", "Directly multiply numerators", "Invert both fractions"],
        correct: "Cross-cancel 7 into 14 (gives 2) and 8 into 16 (gives 2)",
        hints: [
          "14 ÷ 7 = 2.",
          "16 ÷ 8 = 2.",
          "We get: 2 × (-2) / 1.",
          "Select 'Cross-cancel 7 into 14...'."
        ]
      },
      {
        goal: "Step 3: Compute final quotient.",
        chips: ["-4", "4", "-2", "2"],
        correct: "-4",
        hints: [
          "2 × (-2) = -4.",
          "Quotient is -4.",
          "Select '-4'."
        ]
      }
    ],
    xp: 35
  },
  {
    type: "milestone",
    icon: "🥇",
    title: "Act 3 Conquered: Multiplication & Reciprocal Pro",
    reward: "+70 XP Earned! You mastered reciprocals, cross-cancellation, and fraction division."
  },

  // ─── NODE 4: ALGEBRAIC PROPERTIES (EX 1B & 1C) ───
  {
    type: "intro",
    badge: "ACT 4: THE ALGEBRAIC RULES",
    icon: "✨",
    title: "Commutative, Associative & Distributive Laws",
    sub: "Do operations change when we swap the order or group terms differently? Addition and multiplication are commutative and associative, but subtraction and division are NOT! And the Distributive Property bridges multiplication across addition."
  },
  {
    type: "concept",
    badge: "AD TEXTBOOK CONCEPT (PAGES 5-8)",
    title: "Properties of Rational Operations",
    text: "Closure: Sum, difference, and product of rational numbers are always rational. Commutative: a + b = b + a and a × b = b × a (subtraction & division are not commutative). Associative: (a + b) + c = a + (b + c). Distributive: a × (b + c) = (a × b) + (a × c). Identities: 0 is additive identity; 1 is multiplicative identity.",
    simType: "propsTile",
    caption: "Tile Swapper: See how order changes leave addition identical but disrupt subtraction!"
  },
  {
    type: "solver",
    badge: "AD EXERCISE 1B: COMMUTATIVE VERIFICATION",
    title: "Commutativity Gate: a + b = b + a",
    q: "Verify Commutativity for a = -3/7 and b = 4/9.",
    steps: [
      {
        goal: "Step 1: Compute L.H.S. = (-3/7) + (4/9). LCM(7, 9) = 63.",
        chips: ["[-27 + 28] / 63 = 1/63", "[27 - 28] / 63 = -1/63", "7/63"],
        correct: "[-27 + 28] / 63 = 1/63",
        hints: [
          "-3 × 9 = -27, and 4 × 7 = 28.",
          "-27 + 28 = 1.",
          "L.H.S. = 1/63.",
          "Select '[-27 + 28] / 63 = 1/63'."
        ]
      },
      {
        goal: "Step 2: Compute R.H.S. = (4/9) + (-3/7).",
        chips: ["[28 + (-27)] / 63 = 1/63", "-1/63", "0"],
        correct: "[28 + (-27)] / 63 = 1/63",
        hints: [
          "Swap the order: 4/9 first, then -3/7.",
          "28 - 27 = 1 over 63 = 1/63.",
          "Select '[28 + (-27)] / 63 = 1/63'."
        ]
      },
      {
        goal: "Step 3: What does L.H.S. = R.H.S. = 1/63 prove?",
        chips: ["Addition is Commutative for rational numbers", "Subtraction is Commutative", "Division is Associative"],
        correct: "Addition is Commutative for rational numbers",
        hints: [
          "Swapping the order gave the exact same result.",
          "This proves commutativity of addition.",
          "Select 'Addition is Commutative...'."
        ]
      }
    ],
    xp: 35
  },
  {
    type: "solver",
    badge: "AD TEXTBOOK PAGE 8: DISTRIBUTIVE PROOF",
    title: "Distributive Vault: (2/5) × [(-3/7) + (6/11)]",
    q: "Verify the Distributive Property of Multiplication over Addition step-by-step.",
    steps: [
      {
        goal: "Step 1: Solve L.H.S. inside brackets: -3/7 + 6/11. LCM(7, 11) = 77.",
        chips: ["[-33 + 42]/77 = 9/77", "[-33 - 42]/77 = -75/77", "3/77"],
        correct: "[-33 + 42]/77 = 9/77",
        hints: [
          "-3 × 11 = -33, and 6 × 7 = 42.",
          "42 - 33 = 9.",
          "Bracket equals 9/77.",
          "Select '[-33 + 42]/77 = 9/77'."
        ]
      },
      {
        goal: "Step 2: Multiply with outer factor 2/5: (2 × 9) / (5 × 77).",
        chips: ["18/385", "18/77", "11/385", "4/385"],
        correct: "18/385",
        hints: [
          "2 × 9 = 18.",
          "5 × 77 = 385.",
          "L.H.S. = 18/385.",
          "Select '18/385'."
        ]
      },
      {
        goal: "Step 3: Solve R.H.S.: [2/5 × -3/7] + [2/5 × 6/11] = -6/35 + 12/55.",
        chips: ["LCM(35, 55) = 385 → [-66 + 84]/385 = 18/385", "18/35", "-18/385"],
        correct: "LCM(35, 55) = 385 → [-66 + 84]/385 = 18/385",
        hints: [
          "35 × 11 = 385, and 55 × 7 = 385.",
          "-6 × 11 = -66, and 12 × 7 = 84.",
          "84 - 66 = 18 over 385 = 18/385.",
          "Select 'LCM(35, 55) = 385 → [-66 + 84]/385 = 18/385'."
        ]
      },
      {
        goal: "Step 4: Conclude verification.",
        chips: ["L.H.S. = R.H.S. = 18/385 (Distributive Law Verified)", "Distributive law failed"],
        correct: "L.H.S. = R.H.S. = 18/385 (Distributive Law Verified)",
        hints: [
          "Both sides yield exactly 18/385.",
          "Select 'L.H.S. = R.H.S. = 18/385...'."
        ]
      }
    ],
    xp: 40
  },
  {
    type: "milestone",
    icon: "💎",
    title: "Act 4 Conquered: Algebraic Alchemist",
    reward: "+75 XP Earned! You mastered algebraic proofs and distributivity."
  },

  // ─── NODE 5: FINAL BOSS CHALLENGE (PRESCRIBED BOARD SOLVED QUESTIONS) ───
  {
    type: "intro",
    badge: "ACT 5: THE FINAL BOSS VAULT",
    icon: "🏆",
    title: "Prescribed Board Questions Challenge",
    sub: "Face the final examination board questions directly from Page 9 of the AD Textbook! Apply your knowledge of multiplicative identities, reciprocals, and associativity to conquer the chapter!"
  },
  {
    type: "solver",
    badge: "AD PRESCRIBED Q1: IDENTITIES & INVERSES",
    title: "Board Boss 1: Identify Key Multiplicative Properties",
    q: "Analyze each prescribed board identity step-by-step.",
    steps: [
      {
        goal: "Question (i): Name the property used in (-4/5) × 1 = 1 × (-4/5) = -4/5.",
        chips: ["1 is the Multiplicative Identity", "Commutative property only", "Additive identity", "Multiplicative inverse"],
        correct: "1 is the Multiplicative Identity",
        hints: [
          "Notice multiplying by 1 leaves the rational number unchanged.",
          "1 is known as the multiplicative identity element.",
          "Select '1 is the Multiplicative Identity'."
        ]
      },
      {
        goal: "Question (ii): Name the property used in (-13/17) × (-2/7) = (-2/7) × (-13/17).",
        chips: ["Commutativity under Multiplication", "Associativity", "Distributivity", "Closure"],
        correct: "Commutativity under Multiplication",
        hints: [
          "The order of the two factors is swapped (a × b = b × a).",
          "This is the Commutative Property of Multiplication.",
          "Select 'Commutativity under Multiplication'."
        ]
      },
      {
        goal: "Question (iii): Name the property used in (-19/29) × (29/-19) = 1.",
        chips: ["Multiplicative Inverse (Reciprocal)", "Multiplicative identity", "Associative", "Closure"],
        correct: "Multiplicative Inverse (Reciprocal)",
        hints: [
          "A fraction is multiplied by its inverted twin to produce 1.",
          "This is the Multiplicative Inverse or Reciprocal property.",
          "Select 'Multiplicative Inverse (Reciprocal)'."
        ]
      }
    ],
    xp: 45
  },
  {
    type: "solver",
    badge: "AD PRESCRIBED Q2 & Q3: ASSOCIATIVE & CLOSURE",
    title: "Board Boss 2: Associativity & Closure Laws",
    q: "Solve the final prescribed board exam problems.",
    steps: [
      {
        goal: "AD Prescribed Q2: What property allows computing (1/3) × [6 × (4/3)] as [(1/3) × 6] × (4/3)?",
        chips: ["Associative Property of Multiplication", "Commutative Property", "Distributive Property", "Additive Inverse"],
        correct: "Associative Property of Multiplication",
        hints: [
          "Notice that the terms remain in the exact same order (1/3, 6, 4/3), but the grouping brackets are shifted.",
          "It is of the form a × (b × c) = (a × b) × c.",
          "This is strictly the Associative Property.",
          "Select 'Associative Property of Multiplication'."
        ]
      },
      {
        goal: "AD Prescribed Q3: The product of two rational numbers is always a _____?",
        chips: ["Rational number (Closure Property)", "Whole number", "Positive integer", "Decimal with non-zero denominator"],
        correct: "Rational number (Closure Property)",
        hints: [
          "Multiplying any two integers in numerator and denominator yields integers.",
          "Therefore, the product is always a rational number.",
          "This is the Closure Property of Multiplication.",
          "Select 'Rational number (Closure Property)'."
        ]
      }
    ],
    xp: 50
  },
  {
    type: "milestone",
    icon: "👑",
    title: "🏆 CHAPTER 1 FULLY CONQUERED!",
    reward: "+100 XP Earned! You have completed 100% of the AD Class 8 Rational Numbers curriculum, exercises, and board questions in a unified step-by-step gamified journey!"
  }
];

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
      chipsHtml += '<button class="chip-btn" onclick="App.pickChip('' + st.chips[c].replace(/'/g, "\\'") + '')">' + st.chips[c] + '</button>';
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
      ctrls.innerHTML = '<div class="sim-row"><button class="sim-btn active" onclick="App.redrawProp(\'comm\')">Commutative Test</button><button class="sim-btn" onclick="App.redrawProp(\'assoc\')">Associative Test</button></div>';
      App.redrawProp = draw;
    }
  }
};

window.addEventListener('DOMContentLoaded', function(){ App.init(); });
if (document.readyState === 'complete' || document.readyState === 'interactive') { App.init(); }
</script>
</body></html>
