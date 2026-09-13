import { createProfile, loadProfile, saveProfile } from '../../../packages/learner-profile/src/index.js';
import { TLNEngine } from '../../../packages/tln-engine/src/index.js';
import { questionsForNode, gradeQuestion } from '../../../packages/question-engine/src/index.js';
import { assessNode, remediationFor } from '../../../packages/assessment-engine/src/index.js';
import { computeMasteryByNode, progressionAuthority } from '../../../packages/teas-engine/src/index.js';
import { GameEngine } from '../../../packages/game-engine/src/index.js';
import { OfflineOutbox, makeEvent } from '../../../packages/offline-sync/src/index.js';
import { RewardLedger } from '../../../packages/reward-engine/src/index.js';
import { aggregateImpact } from '../../../packages/impact-engine/src/index.js';
import { renderVisual } from '../../../packages/visual-engine/src/index.js';
import fractionsChapter from '../../../content/class-06/fractions.json' with { type:'json' };
import perimeterChapter from '../../../content/class-07/perimeter-and-area.json' with { type:'json' };
import dictionary from '../../../content/dictionary.json' with { type:'json' };
import { chapterRegistry, StandaloneChapterAdapter } from './chapter-bridge.js';



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
          streak = 0;
          if(comboInd) comboInd.classList.remove('show');

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
          streak = 0;
          if(comboInd) comboInd.classList.remove('show');

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


let currentChapter = chapterRegistry.getActive();

const outbox = new OfflineOutbox();
const rewards = new RewardLedger();
let profile = loadProfile();
let teasResults = [];
let currentNode = null;
let attempts = [];

const app = document.querySelector('#app');
const status = document.querySelector('#status');

function event(type, payload){
  const e = makeEvent({
    eventId: crypto.randomUUID(),
    learnerId: profile ? profile.learnerId : 'anonymous',
    deviceId: deviceId(),
    type,
    payload
  });
  outbox.enqueue(e);
  return e;
}

function deviceId(){
  let d = localStorage.getItem('aasha.device');
  if(!d){
    d = crypto.randomUUID();
    localStorage.setItem('aasha.device', d);
  }
  return d;
}

function render(){
  if(!profile) return onboarding();
  const tln = new TLNEngine(currentChapter);
  const mastered = new Set(teasResults.filter(r => r.mastery).map(r => r.nodeId));
  const nodes = tln.orderedNodes();
  const chapterList = chapterRegistry.list();

  app.innerHTML = `
    <section class="hero">
      <div style="display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap;">
        ${chapterList.map(c => `
          <button data-ch="${c.id}" class="chapter-tab" style="font-size: 0.9rem; font-weight: 700; padding: 8px 14px; border-radius: 8px; background: ${c.id === currentChapter.id ? '#1e3a5f' : '#f1f5f9'}; color: ${c.id === currentChapter.id ? '#ffffff' : '#334155'}; border: 1px solid ${c.id === currentChapter.id ? '#1e3a5f' : '#cbd5e1'}; cursor: pointer;">
            Class ${c.grade}: ${c.title.split('—')[0].trim()}${c.isBridged ? ' 🌉' : ''}
          </button>
        `).join('')}
      </div>
      <span class="eyebrow">Class ${currentChapter.grade} · ${currentChapter.subject}${currentChapter.isBridged ? ' · Standardized Chapter Bridge' : ''}</span>
      <h1>${currentChapter.title}</h1>
      <p>School-book-first learning, built for understanding and usable offline.</p>
      ${currentChapter.standaloneHtml ? `
        <div style="margin: 12px 0;">
          <button id="launchStandalone" style="background: linear-gradient(135deg, #1e3a5f, #0284c7); padding: 10px 18px; font-size: 0.95rem;">
            Launch Standalone Experience View 🚀
          </button>
        </div>
      ` : ''}
    </section>
    <section class="grid">
      ${nodes.map(n => `
        <article class="card">
          <span class="badge">${mastered.has(n.id) ? '✓ Mastered' : 'Learn next'}</span>
          <h2>${n.title}</h2>
          <p>${n.objective}</p>
          <button data-node="${n.id}" ${n.dependencies?.some(d => !mastered.has(d)) ? 'disabled' : ''}>
            ${mastered.has(n.id) ? 'Review' : 'Learn'}
          </button>
        </article>
      `).join('')}
    </section>
    <section class="panel">
      <strong>Impact & Learning Progress</strong>
      <div id="metrics" style="margin-top: 8px; font-family: monospace; font-size: 0.9rem;"></div>
    </section>
  `;

  app.querySelectorAll('[data-ch]').forEach(b => b.onclick = () => {
    const selected = chapterRegistry.get(b.dataset.ch);
    if (selected) {
      currentChapter = selected;
      chapterRegistry.setActive(selected.id);
      render();
    }
  });

  const launchBtn = app.querySelector('#launchStandalone');
  if (launchBtn && currentChapter.standaloneHtml) {
    launchBtn.onclick = () => launchStandaloneView(currentChapter);
  }

  app.querySelectorAll('[data-node]').forEach(b => b.onclick = () => learn(b.dataset.node));
  const metricsEl = document.querySelector('#metrics');
  if (metricsEl) metricsEl.textContent = JSON.stringify(aggregateImpact(outbox.list()), null, 2);
}

function launchStandaloneView(chapter) {
  app.innerHTML = `
    <section class="hero">
      <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
        <button id="backToStandard" class="btn-amber">← Back to Standard Overview</button>
        <span class="badge" style="font-weight: 700;">AashaExperienceContract Active</span>
      </div>
      <div id="standaloneMountTarget" style="width: 100%; min-height: 600px;"></div>
    </section>
  `;

  document.querySelector('#backToStandard').onclick = render;

  const target = document.querySelector('#standaloneMountTarget');
  const adapter = new StandaloneChapterAdapter({
    id: chapter.id,
    title: chapter.title,
    htmlUrl: chapter.standaloneHtml,
    onEvent: (type, payload) => {
      event(type, payload);
      if (payload && (payload.coins || payload.xp)) {
        rewards.issue(
          { eventId: `standalone:${chapter.id}:${Date.now()}` },
          { coins: payload.coins || 1, xp: payload.xp || 10, verified: true }
        );
      }
    }
  });

  adapter.mount(target);
}

function onboarding(){
  app.innerHTML = `
    <section class="hero">
      <span class="eyebrow">Annanth Aasha Foundation</span>
      <h1>Let’s start learning.</h1>
      <p>Core learning works without an account or internet connection.</p>
      <form id="p">
        <label>Name<input name="name" required placeholder="Enter your name"></label>
        <label>Class<input name="grade" type="number" min="1" max="10" value="6" required></label>
        <label>Language
          <select name="language">
            <option value="hi-en">Hindi + English</option>
            <option value="en">English</option>
          </select>
        </label>
        <button type="submit">Start learning</button>
      </form>
    </section>
  `;

  document.querySelector('#p').onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    profile = saveProfile(createProfile({
      learnerId: crypto.randomUUID(),
      name: f.get('name'),
      grade: Number(f.get('grade')),
      language: f.get('language')
    }));
    event('profile_created', { grade: profile.grade });
    render();
  };
}

function learn(nodeId){
  currentNode = new TLNEngine(currentChapter).node(nodeId);
  app.innerHTML = `
    <section class="hero">
      <span class="eyebrow">${currentNode.title}</span>
      <h1>${currentNode.concept}</h1>
      <p style="font-size: 1.15rem; line-height: 1.6; max-width: 680px;">${rt(currentNode.explanation)}</p>
      <div class="visual" style="margin-top: 20px;">
        <strong style="display:block; margin-bottom: 8px; font-size: 1.1rem; color: #14532d;">Visual Model & Interactive Exploration</strong>
        <div id="visualTarget" class="visual-target"></div>
      </div>
      <div style="margin-top: 24px;">
        <button id="practice" style="font-size: 1.1rem; padding: 14px 28px;">Start Practice →</button>
      </div>
    </section>
  `;

  const target = document.querySelector('#visualTarget');
  if (target && currentNode.visual) {
    renderVisual(target, {
      ...currentNode.visual,
      title: currentNode.title,
      interactive: true,
      onUpdate: ({ shaded, total }) => {
        event('visual_explored', { nodeId, shaded, total });
      }
    });
  }

  event('node_viewed', { nodeId });
  document.querySelector('#practice').onclick = () => practice(nodeId);
}

function practice(nodeId){
  const qs = questionsForNode(currentChapter, nodeId);
  let i = 0;
  const firstAttempts = [];
  const retryLog = [];
  let streak = 0;
  const comboInd = document.getElementById('comboInd');


  const next = () => {
    const q = qs[i];
    if (!q) return finishAssessment(nodeId, firstAttempts, retryLog);

    let isAnswered = false;
            if(comboInd) comboInd.classList.remove('show');

    let attemptCountOnQuestion = 0;

    app.innerHTML = `
      <section class="hero">
        <span class="eyebrow">Practice ${i + 1}/${qs.length} · ${currentNode?.title ?? 'Concept'}</span>
        <h1 style="font-size: 1.75rem; margin: 12px 0 20px;">${q.prompt}</h1>
        <div class="options">
          ${q.options.map((o, j) => {
            const text = (typeof o === 'object' && o !== null) ? o.text : o;
            return `<button data-a="${j}" class="opt-btn">${text}</button>`;
          }).join('')}
        </div>
        <div id="feedbackContainer"></div>
        <div id="actionContainer" style="margin-top: 16px;"></div>
      </section>
    `;

    const optButtons = app.querySelectorAll('.opt-btn');
    const feedbackBox = app.querySelector('#feedbackContainer');
    const actionBox = app.querySelector('#actionContainer');

    optButtons.forEach(b => {
      b.onclick = () => {
        if (isAnswered) return;
        isAnswered = true;
        attemptCountOnQuestion++;

        const selectedIdx = Number(b.dataset.a);
        const r = gradeQuestion(q, selectedIdx);

        if (attemptCountOnQuestion === 1) {
          firstAttempts.push(r);
          retryLog.push({ ...r, questionId: q.id, attemptNumber: 1, isRetry: false });
        } else {
          streak = 0;
          if(comboInd) comboInd.classList.remove('show');

          retryLog.push({ ...r, questionId: q.id, attemptNumber: attemptCountOnQuestion, isRetry: true });
        }

        event('attempt', {
          nodeId,
          questionId: q.id,
          correct: r.correct,
          misconceptionId: r.misconceptionId ?? null,
          attemptNumber: attemptCountOnQuestion,
          isRetry: attemptCountOnQuestion > 1
        });

        optButtons.forEach((btn, idx) => {
          btn.disabled = true;
          if (idx === selectedIdx) {
            btn.classList.add(r.correct ? 'correct' : 'wrong');
          }
        });

        if (r.correct) {
          streak++;
          if(streak > 1 && comboInd) { comboInd.textContent = streak + ' IN A ROW 🔥'; comboInd.classList.add('show'); }

          const rewardEventId = `reward:${profile ? profile.learnerId : 'guest'}:${nodeId}:${q.id}`;
          rewards.issue({ eventId: rewardEventId }, { coins: 1, xp: 5, verified: true });
          feedbackBox.innerHTML = `
            <div class="feedback-box ok">
              <strong>✓ Correct!</strong> ${r.feedback}
            </div>
          `;
          actionBox.innerHTML = `<button id="continueBtn" class="btn-green">Continue →</button>`;
          actionBox.querySelector('#continueBtn').onclick = () => {
            i++;
            next();
          };
        } else {
          streak = 0;
          if(comboInd) comboInd.classList.remove('show');

          const hint = r.misconceptionId ? `<span class="misconception-hint">💡 Concept Hint: ${r.feedback}</span>` : '';
          feedbackBox.innerHTML = `
            <div class="feedback-box no">
              <strong>✗ Not quite.</strong> ${r.feedback}
              ${hint}
            </div>
          `;
          actionBox.innerHTML = `<button id="retryBtn" class="btn-amber">Try Again</button>`;
          actionBox.querySelector('#retryBtn').onclick = () => {
            isAnswered = false;
            if(comboInd) comboInd.classList.remove('show');

            feedbackBox.innerHTML = '';
            actionBox.innerHTML = '';
            optButtons.forEach(btn => {
              btn.disabled = false;
              btn.classList.remove('wrong', 'selected');
            });
          };
        }
      };
    });
  };

  next();
}

function finishAssessment(nodeId, firstAttempts = [], retryLog = []){
  const result = assessNode({ nodeId, attempts: firstAttempts });
  teasResults = teasResults.filter(r => r.nodeId !== nodeId).concat(result);

  const retriesCount = retryLog.filter(l => l.isRetry).length;

  event('assessment', {
    nodeId,
    accuracy: result.accuracy,
    mastery: result.mastery,
    misconception: result.misconception,
    diagnosticCorrect: result.correct,
    diagnosticTotal: result.total,
    retriesCount
  });

  const auth = progressionAuthority({
    orderedNodeIds: new TLNEngine(currentChapter).orderedNodes().map(n => n.id),
    masteryByNode: computeMasteryByNode(teasResults)
  });

  const remediation = remediationFor(result);
  
  const comboInd = document.getElementById('comboInd');
  if (comboInd) comboInd.classList.remove('show');
  if (result.mastery) {
    triggerConfetti();
    const lu = document.getElementById('levelUpDialog');
    if(lu && !lu.open) lu.showModal();
  }


  app.innerHTML = `
    <section class="hero">
      <span class="eyebrow">Assessment Result</span>
      <h1>${result.mastery ? '🎉 Concept Mastered!' : 'Strengthen This Concept'}</h1>
      <p style="font-size: 1.15rem; line-height: 1.5;">
        Diagnostic Accuracy: <strong>${Math.round(result.accuracy * 100)}%</strong> (${result.correct}/${result.total} first-attempt correct).<br>
        ${retriesCount > 0 ? `<span style="font-size: 0.95rem; color: #0284c7;">🌱 Practice Growth: ${retriesCount} retry steps completed to master questions.</span><br>` : ''}
        Recommendation: <strong>${remediation.type === 'advance' ? 'Ready to advance' : 'Guided practice recommended'}</strong>.
      </p>
      <p style="color: #475569; font-size: 0.95rem;">
        TEAS Progression Status: <strong>${auth.authority.toUpperCase()}</strong>.
        ${auth.next ? `Next unlocked concept: <strong>${auth.next}</strong>` : 'All chapter concepts mastered!'}
      </p>
      <div style="margin-top: 24px;">
        <button id="home">Back to Learning Overview</button>
      </div>
    </section>
  `;

  document.querySelector('#home').onclick = render;
}

window.addEventListener('online', async () => {
  status.textContent = 'Online · syncing';
  await outbox.sync(async e => {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(e)
    });
  });
  status.textContent = 'Online-ready';
});

render();
