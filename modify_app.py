import re

with open('Aasha-Learning-Impact-Ecosystem-v0.3-full-repo/apps/learner-web/src/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add dictionary import
content = content.replace(
    "import perimeterChapter from '../../../content/class-07/perimeter-and-area.json' with { type:'json' };",
    "import perimeterChapter from '../../../content/class-07/perimeter-and-area.json' with { type:'json' };\nimport dictionary from '../../../content/dictionary.json' with { type:'json' };\n"
)

# 2. Add rt(text) and confetti functions at the top of the file
rt_code = """
// --- UI ENHANCEMENTS (Dictionary & Gamification) ---
function rt(text) {
  if (!text) return '';
  const WM = dictionary.WM || {};
  const CONN = dictionary.CONN || {};
  let html = text;
  
  const keys = Object.keys(CONN).sort((a,b) => b.length - a.length);
  let connCount = 0, result = '', i = 0;
  
  while(i < html.length) {
    const ch = html[i];
    if (ch === '.' || ch === '!' || ch === '?') { connCount = 0; result += ch; i++; continue; }
    if (ch === '<') { 
      const ci = html.indexOf('>', i); 
      if (ci >= 0) { result += html.substring(i, ci+1); i = ci+1; continue; }
    }
    
    let matched = false;
    if (i === 0 || !/[a-zA-Z]/.test(html[i-1])) {
      for (let k=0; k<keys.length; k++) {
        const c = keys[k];
        const sub = html.substring(i, i + c.length);
        if (sub.toLowerCase() === c.toLowerCase()) {
          const ai = i + c.length;
          if (ai < html.length && /[a-zA-Z]/.test(html[ai])) continue;
          const hi = CONN[c];
          connCount++;
          if (connCount <= 2) {
            result += `<span class="connective" data-w="${sub}" data-h="${hi}">${sub} <span class="connective-hi">(${hi})</span></span>`;
          } else {
            result += `<span class="word" data-w="${sub.toLowerCase()}" data-h="${hi}">${sub}</span>`;
          }
          i += c.length;
          matched = true;
          break;
        }
      }
    }
    if (matched) continue;
    
    if (/[a-zA-Z]/.test(ch)) {
      let ws = i;
      while (i < html.length && /[a-zA-Z]/.test(html[i])) i++;
      const word = html.substring(ws, i);
      const cw = word.toLowerCase();
      const hi = WM[cw];
      if (hi) result += `<span class="word" data-w="${cw}" data-h="${hi}">${word}</span>`;
      else result += `<span class="word" data-w="${cw}" data-h="">${word}</span>`;
    } else {
      result += ch;
      i++;
    }
  }
  return result;
}

function triggerConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const pieces = [];
  for(let i=0; i<80; i++) {
    pieces.push({
      x: canvas.width / 2, y: canvas.height / 2 + 50,
      vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 1) * 20 - 5,
      size: Math.random() * 10 + 5,
      color: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)],
      rot: Math.random() * 360, rotS: (Math.random() - 0.5) * 10
    });
  }
  let frame = 0;
  function loop() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let active = false;
    for (let p of pieces) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.5; p.rot += p.rotS;
      if (p.y < canvas.height) active = true;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color; ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
      ctx.restore();
    }
    if (active && frame < 150) { frame++; requestAnimationFrame(loop); }
    else ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  loop();
}

document.addEventListener('click', (e) => {
  let el = e.target.closest('.connective');
  if (el) { showWord(el.getAttribute('data-w'), el.getAttribute('data-h'), 'Connecting word'); return; }
  el = e.target.closest('.word');
  if (el) { 
    let h = el.getAttribute('data-h');
    showWord(el.getAttribute('data-w'), h || '—', h ? '' : 'Hindi meaning not available'); return; 
  }
});

function showWord(w, h, d) {
  const dlg = document.getElementById('wordDialog');
  if (!dlg) return;
  document.getElementById('dlgWord').textContent = w;
  let hi = h || '';
  if (hi === '—' || hi === '') hi = 'इस शब्द का हिंदी अर्थ अभी उपलब्ध नहीं है';
  document.getElementById('dlgHindi').textContent = hi;
  document.getElementById('dlgDesc').textContent = d || '';
  if (!dlg.open) dlg.showModal();
}
// ----------------------------------------------------

"""
content = content.replace("const chapters = [fractionsChapter, perimeterChapter];", rt_code + "\nconst chapters = [fractionsChapter, perimeterChapter];")

# 3. Update learn(nodeId) to use rt()
content = content.replace(
    "${currentNode.explanation}</p>",
    "${rt(currentNode.explanation)}</p>"
)

# 4. Update practice(nodeId) with streak
practice_streak_init = """  const retryLog = [];
  let streak = 0;
  const comboInd = document.getElementById('comboInd');
"""
content = content.replace("  const retryLog = [];", practice_streak_init)

content = content.replace(
    "if (r.correct) {",
    "if (r.correct) {\n          streak++;\n          if(streak > 1 && comboInd) { comboInd.textContent = streak + ' IN A ROW 🔥'; comboInd.classList.add('show'); }\n"
)
content = content.replace(
    "} else {",
    "} else {\n          streak = 0;\n          if(comboInd) comboInd.classList.remove('show');\n"
)
content = content.replace(
    "isAnswered = false;",
    "isAnswered = false;\n            if(comboInd) comboInd.classList.remove('show');\n"
)

# 5. Update finishAssessment to trigger confetti and levelUpDialog
finish_mod = """  const remediation = remediationFor(result);
  
  const comboInd = document.getElementById('comboInd');
  if (comboInd) comboInd.classList.remove('show');
  if (result.mastery) {
    triggerConfetti();
    const lu = document.getElementById('levelUpDialog');
    if(lu && !lu.open) lu.showModal();
  }
"""
content = content.replace("  const remediation = remediationFor(result);", finish_mod)

with open('Aasha-Learning-Impact-Ecosystem-v0.3-full-repo/apps/learner-web/src/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated app.js successfully")
