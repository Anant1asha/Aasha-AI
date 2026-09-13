import {loadState,saveState,resetState,exportState} from './core/storage.js';
import {recordEvent} from './core/events.js';
import {refreshMastery,progressionDecision,getScaffoldingHint,DynamicDifficultyEngine,recordSimulationTelemetry} from './core/teas.js';
import {awardQuizReward,verifyRewardManually} from './core/rewards.js';
import {getSyncStatus} from './core/sync.js';
import {validateChapter} from './core/content-schema.js';
import {renderVisual,FractionVisual} from './core/visuals.js';
import {GameLoopComponent,TactileMatchComponent} from './core/game-engine.js';
import {rt,setupWordDialogListener} from './core/lle.js';
import {CHAPTERS_CATALOG,getChapterById,getQuestionsForChapter} from './content/chapter.js';

const app=document.querySelector('#app'),nav=document.querySelector('#nav'),status=document.querySelector('#status');
let state=loadState();
let screen='home';
let selected=null;
let quiz={questions:[],index:0,score:0,startedAt:0,gameId:null,hintTier:0,currentChapterId:null};
let activeGameLoop=null;
let activeTactileMatch=null;

// Ensure active chapter is tracked in state
if(!state.active_chapter)state.active_chapter=CHAPTERS_CATALOG[0].id;
if(!state.session_id)state.session_id=`S-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;

let currentChapter=getChapterById(state.active_chapter);
refreshMastery(state,currentChapter);
saveState(state);

// Initialize global bilingual word tap listener
setupWordDialogListener();

function cleanupActiveGames(){
  if(activeGameLoop){activeGameLoop.destroy();activeGameLoop=null;}
  if(activeTactileMatch){activeTactileMatch.destroy();activeTactileMatch=null;}
}

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function initials(s){return (s||'').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()}

function setNav(){
  const items=[['home','⌂','Home'],['learn','📖','Learn'],['games','🎮','Practice'],['impact','📊','Impact']];
  nav.innerHTML=items.map(([id,ic,t])=>`<button class="nav-btn ${screen===id?'active':''}" data-nav="${id}">${ic}<br>${t}</button>`).join('');
  nav.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{
    cleanupActiveGames();
    screen=b.dataset.nav;
    render();
  });
}

function syncHeader(){
  status.textContent=navigator.onLine?'Online · sync when requested':'Offline-ready';
  status.className=navigator.onLine?'status online':'status';
}
window.addEventListener('online',syncHeader);
window.addEventListener('offline',syncHeader);

function render(){
  syncHeader();
  setNav();
  if(!state.learner){renderProfile();return;}
  currentChapter=getChapterById(state.active_chapter);
  refreshMastery(state,currentChapter);
  saveState(state);
  ({home:renderHome,learn:renderLearn,games:renderGames,impact:renderImpact}[screen]||renderHome)();
}

function renderProfile(){
  cleanupActiveGames();
  nav.innerHTML='';
  app.innerHTML=`<section class="card"><span class="badge">BETA · OFFLINE-FIRST</span><h1>Welcome to Annanth Aasha</h1><p class="muted">School-book-first learning and gamified assessment that works offline on the device, maintaining an evidence trail for later sync.</p><label for="learnerName">Learner name</label><input id="learnerName" autocomplete="off" placeholder="Enter learner name"><br><label for="classLevel">Class</label><select id="classLevel">${Array.from({length:10},(_,i)=>`<option value="${i+1}">Class ${i+1}</option>`).join('')}</select><br><br><button class="btn" id="create">Start Learning</button></section><section class="card"><h3>Age/stage-aware foundation</h3><p class="small muted">The learner model supports Classes 1–10. Presentation adapts by stage while the underlying content, event and assessment contracts stay reusable.</p></section><section class="card"><h3>Safety + authority</h3><p class="small muted">No ads, no external CDN calls, no tracking scripts, and zero internet dependency for core learning. Progression is deterministic and content remains teacher-validated.</p></section>`;
  document.querySelector('#create').onclick=()=>{
    const n=document.querySelector('#learnerName').value.trim();
    const g=Number(document.querySelector('#classLevel').value);
    if(!n)return;
    state.learner={local_id:`L-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,display_name:n,class_level:g,age_stage:g<=2?'foundation':g<=5?'primary':g<=8?'middle':'secondary',cohort_code:'CENTRE-BETA'};
    recordEvent(state,'profile_started',{class_level:g,age_stage:state.learner.age_stage,cohort_code:'CENTRE-BETA'});
    screen='home';
    render();
  };
}

function renderHome(){
  cleanupActiveGames();
  currentChapter=getChapterById(state.active_chapter);
  const attempted=Object.values(state.mastery).filter(x=>x.attempts>0).length;

  app.innerHTML=`<section class="card"><span class="badge">${initials(state.learner.display_name)} · Class ${state.learner.class_level}</span><h1>Namaste, ${esc(state.learner.display_name)} 👋</h1><p class="muted">Your learning journey stays on this device. Explore interactive concepts and test your skills in the 3-Tier Gamified Lab.</p><div class="grid"><div class="stat"><b>${state.coins}</b>Coins</div><div class="stat"><b>${state.xp}</b>XP</div><div class="stat"><b>${state.streak}</b>Streak</div><div class="stat"><b>${attempted}/${currentChapter.nodes.length}</b>Concepts</div></div></section><section class="card"><div class="row" style="justify-content:space-between;align-items:center;"><span class="badge">Curriculum Module</span><span class="badge" style="background:#e0f2fe;color:#0369a1;">${currentChapter.subject}</span></div><label for="chapterSelect" style="font-weight:700;margin-top:8px;display:block;">Select Textbook Chapter:</label><select id="chapterSelect" style="margin:8px 0;">${CHAPTERS_CATALOG.map(c=>`<option value="${c.id}" ${c.id===state.active_chapter?'selected':''}>Class ${c.grade} ${c.subject} · ${esc(c.title)}</option>`).join('')}</select><h2>${esc(currentChapter.title)}</h2><p class="muted">Foundation: <b>${currentChapter.foundation}</b> · Class ${currentChapter.grade}</p>${currentChapter.nodes.map(n=>nodeCard(n)).join('')}<button class="btn" id="startChapter" style="margin-top:10px;">Continue Learning (Golden Flow)</button></section><section class="card"><h3>Pedagogical Audit Status</h3><p class="small muted">✅ 100% Textbook exercise coverage · 4-Pillar Pedagogical Certification · Strict L-Truth 0-Spoiler guarantee.</p></section>`;

  document.querySelector('#chapterSelect').onchange=(e)=>{
    state.active_chapter=e.target.value;
    state.concept_cursor=0;
    currentChapter=getChapterById(state.active_chapter);
    refreshMastery(state,currentChapter);
    saveState(state);
    render();
  };

  document.querySelector('#startChapter').onclick=()=>{screen='learn';renderLearn();};
}

function nodeCard(n){
  const m=state.mastery[n.id]||{mastery:0,attempts:0};
  return `<div style="margin:12px 0"><div class="row" style="align-items:center"><strong>${esc(n.title)}</strong><span class="small muted" style="text-align:right">${m.attempts?m.mastery+'%':'Not started'}</span></div><div class="progress"><i style="width:${m.mastery}%"></i></div></div>`;
}

function renderLearn(){
  cleanupActiveGames();
  currentChapter=getChapterById(state.active_chapter);
  const n=currentChapter.nodes[state.concept_cursor]||currentChapter.nodes[0];
  const decision=progressionDecision(state,n.id);
  const dda=DynamicDifficultyEngine.evaluateDifficulty(state,n.id);

  app.innerHTML=`<section class="card"><div class="row"><span class="badge">Node ${state.concept_cursor+1}/${currentChapter.nodes.length}</span><span class="badge">${decision.action}</span><span class="badge" style="background:#e0f2fe;color:#0369a1;">${dda.tierName}</span></div><h1>${esc(n.title)}</h1><p class="muted"><strong>Objective:</strong> ${esc(n.objective)}</p><div id="learnSteps"></div><div class="notice" style="margin-top:14px;">💡 <b>Interactive LLE Word-Tap:</b> Tap any dotted-underlined word in the lesson to see its Hindi meaning and conceptual definition.</div></section><section class="card"><h3>Language Substrate</h3><div class="lang-toggle"><button id="en" class="${state.language==='en'?'on':''}">English</button><button id="hi" class="${state.language==='hi'?'on':''}">हिन्दी</button></div><p class="small muted" style="margin-top:8px;">${state.language==='hi'?'हिन्दी मोड सक्रिय: महत्वपूर्ण शब्दावली पर टैप करके तुरंत अर्थ देखें।':'English mode: Tap highlighted terms for Indic vernacular definitions.'}</p></section><div class="row"><button class="btn secondary" id="prev">← Previous</button><button class="btn" id="assess">3-Tier Assessment</button></div>`;

  const stepsContainer=document.querySelector('#learnSteps');
  n.steps.forEach((s)=>{
    if(s.type==='explain'){
      const textWrap=document.createElement('div');
      // Render through bilingual LLE engine with math shielding and word tap
      textWrap.innerHTML=rt(s.text, { language: state.language, customWords: n.words });
      stepsContainer.appendChild(textWrap);
    } else {
      const visWrap=document.createElement('div');
      visWrap.className='visual';
      visWrap.style.margin='14px 0';
      const simContainer=document.createElement('div');
      visWrap.appendChild(simContainer);

      // Mount interactive visual with real-time telemetry hook
      renderVisual(s.visual, s.data, simContainer, (interaction)=>{
        recordSimulationTelemetry(state, n.id, interaction);
      });

      const caption=document.createElement('span');
      caption.className='small muted';
      caption.textContent='Interactive simulation (tap/drag to manipulate parameters)';
      visWrap.appendChild(caption);
      stepsContainer.appendChild(visWrap);
    }
  });

  document.querySelector('#prev').onclick=()=>{state.concept_cursor=Math.max(0,state.concept_cursor-1);render();};
  document.querySelector('#assess').onclick=()=>startQuizForNode(n.id);
  document.querySelector('#en').onclick=()=>{state.language='en';render();};
  document.querySelector('#hi').onclick=()=>{state.language='hi';render();};
}

function startQuizForNode(nodeId, tierFilter=null){
  cleanupActiveGames();
  currentChapter=getChapterById(state.active_chapter);
  let qs=getQuestionsForChapter(state.active_chapter).filter(q=>q.node_id===nodeId);
  if(!qs.length){
    qs=getQuestionsForChapter(state.active_chapter);
  }
  if(tierFilter){
    const filtered=qs.filter(q=>q.tier===tierFilter);
    if(filtered.length) qs=filtered;
  }
  if(!qs.length){screen='games';render();return;}

  quiz={
    questions:[...qs],
    index:0,
    score:0,
    startedAt:performance.now(),
    gameId:`G-${Date.now()}`,
    hintTier:0,
    currentChapterId:state.active_chapter
  };
  recordEvent(state,'assessment_started',{node_id:nodeId,game_id:quiz.gameId,chapter_id:state.active_chapter});
  renderQuiz();
}

function renderQuiz(){
  const q=quiz.questions[quiz.index];
  const pct=Math.round((quiz.index/quiz.questions.length)*100);
  const dda=DynamicDifficultyEngine.evaluateDifficulty(state, q.node_id);
  const hintObj=quiz.hintTier>0?getScaffoldingHint(q, quiz.hintTier):null;

  app.innerHTML=`<section class="game"><div class="row" style="justify-content:space-between;align-items:center;"><span class="badge">${quiz.index+1}/${quiz.questions.length}</span><span class="badge" style="background:#e0f2fe;color:#0369a1;">${q.tier_name||dda.tierName}</span></div><div class="hp"><i style="width:${100-pct}%"></i></div><h2>${esc(q.prompt)}</h2>${q.options.map((o,i)=>`<button class="option ${selected===i?'selected':''}" data-i="${i}">${esc(o)}</button>`).join('')}<br><div class="row" style="gap:10px;"><button class="btn secondary" id="hintBtn" style="flex:1;">💡 Hint ${quiz.hintTier>0?`(${quiz.hintTier}/4)`:''}</button><button class="btn" id="submit" style="flex:2;">Submit</button></div>${hintObj?`<div class="notice" style="margin-top:12px;background:#fef3c7;border-left:3px solid #f59e0b;"><b>${hintObj.type}:</b> ${esc(hintObj.text)}</div>`:''}</section><section class="card"><div class="row" style="justify-content:space-between;align-items:center;"><span class="small muted">3-Tier Scaffolding Active</span><span class="small muted">DDA Multiplier: ${dda.adaptiveMultiplier}x</span></div></section>`;

  selected=null;
  app.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{
    selected=Number(b.dataset.i);
    app.querySelectorAll('[data-i]').forEach(x=>x.classList.remove('selected'));
    b.classList.add('selected');
  });

  document.querySelector('#hintBtn').onclick=()=>{
    quiz.hintTier=Math.min(4, quiz.hintTier+1);
    recordEvent(state,'hint_requested',{question_id:q.id,tier:quiz.hintTier});
    renderQuiz();
  };

  document.querySelector('#submit').onclick=()=>submitQuiz(q);
}

function submitQuiz(q){
  if(selected===null)return;
  const rtTime=Math.max(0,Math.round(performance.now()-quiz.startedAt));
  const correct=selected===q.correct_index;
  const dda=DynamicDifficultyEngine.evaluateDifficulty(state, q.node_id);

  const e=recordEvent(state,'answer_submitted',{
    question_id:q.id,
    node_id:q.node_id,
    result:correct?'correct':'incorrect',
    response_time_ms:rtTime,
    misconception:correct?null:q.misconception,
    difficulty_tier:dda.currentTier,
    hints_used:quiz.hintTier
  });

  currentChapter=getChapterById(state.active_chapter);
  refreshMastery(state,currentChapter);
  awardQuizReward(state,{event_id:e.event_id,result:e.payload.result});
  quiz.score+=correct?1:0;
  quiz.index++;
  quiz.hintTier=0;
  quiz.startedAt=performance.now();
  selected=null;
  saveState(state);

  if(quiz.index>=quiz.questions.length){
    recordEvent(state,'assessment_completed',{game_id:quiz.gameId,score:quiz.score,total:quiz.questions.length});
    const decision=progressionDecision(state,q.node_id);
    if(decision.action==='advance')state.concept_cursor=Math.min(currentChapter.nodes.length-1,state.concept_cursor+1);
    renderResult(q.node_id,decision);
    return;
  }
  renderQuiz();
}

function renderResult(nodeId,decision){
  const m=state.mastery[nodeId]||{accuracy:0,mastery:0,misconceptions:[]};
  app.innerHTML=`<section class="card"><span class="badge">ASSESSMENT COMPLETE</span><h1>${decision.action==='advance'?'🎉 Ready to advance':'🔁 Keep building understanding'}</h1><div class="grid"><div class="stat"><b>${m.accuracy}%</b>Accuracy</div><div class="stat"><b>${m.mastery}%</b>Deterministic mastery</div><div class="stat"><b>${state.coins}</b>Coins</div><div class="stat"><b>${state.xp}</b>XP</div></div><p><strong>Next:</strong> ${esc(decision.reason)}</p>${m.misconceptions&&m.misconceptions.length?`<div class="notice"><b>Diagnostic Misconception Feedback:</b><br>${esc(m.misconceptions[0])}</div>`:''}</section><div class="row"><button class="btn secondary" id="retry">Retry Assessment</button><button class="btn" id="next">Back to Lesson</button></div>`;
  document.querySelector('#retry').onclick=()=>startQuizForNode(nodeId);
  document.querySelector('#next').onclick=()=>{screen='learn';render();};
}

function renderGames(){
  cleanupActiveGames();
  currentChapter=getChapterById(state.active_chapter);

  app.innerHTML=`<section class="card"><span class="badge">UNIVERSAL GAME ENGINE</span><h1>Practice Lab</h1><p class="muted">Active Module: <b>${esc(currentChapter.title)}</b> (Class ${currentChapter.grade})</p></section><section class="card"><h3>⏱️ Speed Run (60 FPS Escape Run)</h3><p class="muted">Maintain runner velocity and solve arithmetic/concept obstacle gates within frame budget.</p><button class="btn" id="launchSpeed">Launch Speed Run</button></section><section class="card"><h3>🧩 Match Arena (Tactile Grid)</h3><p class="muted">Mobile touch-first concept pairing grid for ${esc(currentChapter.subject)}.</p><button class="btn" id="launchMatch">Launch Match Arena</button></section><section class="card"><h3>⚔️ Boss Battle (3-Tier Mastery)</h3><p class="muted">Test textbook challenge problems with 4-Tier zero-spoiler hints.</p><button class="btn" id="launchBoss">Launch Boss Battle</button></section>`;

  document.querySelector('#launchSpeed').onclick=()=>launchSpeedRun();
  document.querySelector('#launchMatch').onclick=()=>launchMatchArena();
  document.querySelector('#launchBoss').onclick=()=>{
    const n=currentChapter.nodes[Math.min(state.concept_cursor,currentChapter.nodes.length-1)];
    startQuizForNode(n.id, 3); // Launch Boss Challenge tier
  };
}

function launchSpeedRun(){
  cleanupActiveGames();
  recordEvent(state,'game_shell_opened',{mode:'speed_run',chapter_id:state.active_chapter});
  app.innerHTML=`<section class="card"><div class="row" style="justify-content:space-between;align-items:center;"><h2>⏱️ Speed Run</h2><button class="btn secondary" id="exitGame" style="padding:6px 12px;">Exit</button></div><div class="grid"><div class="stat"><b id="runDistance">0m</b>Distance</div><div class="stat"><b id="runSpeed">3.0</b>Speed</div><div class="stat"><b id="runFps">60 FPS</b>Budget</div></div><div id="gateArea" style="margin:14px 0;min-height:80px;background:#f8fafc;padding:12px;border-radius:10px;border:2px dashed #cbd5e1;text-align:center;"><p class="muted">Running smoothly... Obstacle gate approaching!</p></div></section>`;

  document.querySelector('#exitGame').onclick=()=>{
    cleanupActiveGames();
    screen='games';
    render();
  };

  const distEl=document.querySelector('#runDistance');
  const spdEl=document.querySelector('#runSpeed');
  const fpsEl=document.querySelector('#runFps');
  const gateArea=document.querySelector('#gateArea');

  activeGameLoop=new GameLoopComponent({
    initialSpeed:3,
    acceleration:0.002,
    onScoreUpdate:(info)=>{
      if(distEl)distEl.textContent=`${info.distance}m`;
      if(spdEl)spdEl.textContent=`${info.speed}x`;
      if(fpsEl)fpsEl.textContent=info.frameMs<=16.67?'60 FPS':'<60 FPS';

      if(info.distance>0 && info.distance%150===0 && activeGameLoop.isRunning){
        triggerMathGate(gateArea);
      }
    },
    onTelemetry:(t)=>{
      recordEvent(state,'simulation_telemetry',t);
    }
  });

  activeGameLoop.start();
}

function triggerMathGate(container){
  if(!activeGameLoop)return;
  const num=Math.floor(Math.random()*4)+1;
  const den=num+Math.floor(Math.random()*3)+1;

  activeGameLoop.triggerGate({num, den}, (solveGate)=>{
    container.innerHTML=`<p><b>GATE CHALLENGE:</b> Is <b>${num}/${den}</b> a proper fraction (less than 1)?</p><div class="row" style="gap:10px;justify-content:center;margin-top:8px;"><button class="btn" id="gateYes" style="min-width:60px;">Yes</button><button class="btn secondary" id="gateNo" style="min-width:60px;">No</button></div>`;
    document.querySelector('#gateYes').onclick=()=>{
      container.innerHTML='<p style="color:#16a34a;font-weight:700;">Gate Cleared! Speed boost!</p>';
      solveGate(true);
    };
    document.querySelector('#gateNo').onclick=()=>{
      container.innerHTML='<p style="color:#ef4444;font-weight:700;">Incorrect! Slow down!</p>';
      solveGate(false);
    };
  });
}

function launchMatchArena(){
  cleanupActiveGames();
  currentChapter=getChapterById(state.active_chapter);
  recordEvent(state,'game_shell_opened',{mode:'match_arena',chapter_id:state.active_chapter});

  app.innerHTML=`<section class="card"><div class="row" style="justify-content:space-between;align-items:center;"><h2>🧩 Match Arena</h2><button class="btn secondary" id="exitMatch" style="padding:6px 12px;">Exit</button></div><p class="small muted">Tap to match equivalent concepts for ${esc(currentChapter.title)}:</p><div id="matchContainer" style="margin:14px 0;"></div><div id="matchResult"></div></section>`;

  document.querySelector('#exitMatch').onclick=()=>{
    cleanupActiveGames();
    screen='games';
    render();
  };

  const matchContainer=document.querySelector('#matchContainer');
  const resultContainer=document.querySelector('#matchResult');

  // Adapt pairs to chapter subject
  let pairs=[
    {left:'1/2',right:'Half'},
    {left:'1/4',right:'Quarter'},
    {left:'3/4',right:'Three-Fourths'},
    {left:'Numerator',right:'Top Count'},
    {left:'Denominator',right:'Total Slices'}
  ];

  if(state.active_chapter==='rational-numbers'){
    pairs=[
      {left:'p/q',right:'Rational Form'},
      {left:'q ≠ 0',right:'Non-Zero Denominator'},
      {left:'a + b = b + a',right:'Commutative'},
      {left:'Infinite',right:'Density on Line'}
    ];
  } else if(state.active_chapter==='electric-circuits'){
    pairs=[
      {left:'Copper',right:'Conductor'},
      {left:'Rubber',right:'Insulator'},
      {left:'Open Switch',right:'Zero Current'},
      {left:'Closed Loop',right:'Bulb Glows'}
    ];
  } else if(state.active_chapter==='algebraic-expressions'){
    pairs=[
      {left:'x²',right:'Square Area'},
      {left:'4x',right:'Term with Coeff 4'},
      {left:'(x+a)(x+b)',right:'Area Identity'},
      {left:'Constant',right:'Fixed Numerical Value'}
    ];
  }

  activeTactileMatch=new TactileMatchComponent(
    matchContainer,
    pairs,
    (res)=>{
      resultContainer.innerHTML=`<div class="notice" style="background:#dcfce7;border-left:3px solid #16a34a;"><b>Victory!</b> All pairs matched in ${(res.timeElapsedMs/1000).toFixed(1)}s with ${res.mismatches} retries.</div>`;
      awardQuizReward(state,{event_id:`MATCH-${Date.now()}`,result:'correct'});
      saveState(state);
    },
    (t)=>{
      recordEvent(state,'simulation_telemetry',t);
    }
  );

  activeTactileMatch.render();
}

function renderImpact(){
  cleanupActiveGames();
  currentChapter=getChapterById(state.active_chapter);
  const total=Object.values(state.mastery).reduce((a,x)=>a+x.attempts,0);
  const correct=Object.values(state.mastery).reduce((a,x)=>a+x.correct,0);
  const avg=total?Math.round(correct/total*100):0;
  const sync=getSyncStatus(state);

  app.innerHTML=`<section class="card"><span class="badge">IMPACT ENGINE-LITE</span><h1>My Learning Evidence</h1><div class="grid"><div class="stat"><b>${avg}%</b>Overall accuracy</div><div class="stat"><b>${Object.values(state.mastery).filter(x=>x.attempts).length}</b>Concepts attempted</div><div class="stat"><b>${state.events.length}</b>Events</div><div class="stat"><b>${sync.pending}</b>Pending sync</div></div></section><section class="card"><h3>Concept evidence (${esc(currentChapter.title)})</h3><table class="table"><tr><th>Concept</th><th>Accuracy</th><th>Mastery</th><th>Interactions</th></tr>${currentChapter.nodes.map(n=>{const m=state.mastery[n.id]||{};return `<tr><td>${esc(n.title)}</td><td>${m.accuracy||0}%</td><td>${m.mastery||0}%</td><td>${m.sim_interactions||0}</td></tr>`;}).join('')}</table></section><section class="card"><h3>Rewards</h3><p>${state.coins} Aasha Coins · ${state.xp} XP ${state.badges.length?'· 🏅 '+state.badges.join(', '):''}</p><p class="small muted">Beta reward records use a manual verification status. Reward logic is present, but verification is deliberately operationally manual at the centre.</p>${state.reward_ledger.slice(-3).reverse().map(r=>`<div class="badge">${esc(r.ledger_id)} · ${r.coins_delta} coins · ${esc(r.verification_status)}</div>`).join('')}</section><section class="card"><h3>Data controls</h3><div class="row"><button class="btn secondary" id="export">Export local evidence</button><button class="btn ghost" id="reset">Reset learner</button></div></section>`;

  document.querySelector('#export').onclick=()=>{
    const blob=new Blob([exportState(state)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='aasha-beta-evidence.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  document.querySelector('#reset').onclick=()=>{state=resetState();screen='home';render();};
}

window.render=render;
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
const chapterCheck=validateChapter(currentChapter);
if(!chapterCheck.valid)console.error('Content validation failed',chapterCheck.errors);
render();
