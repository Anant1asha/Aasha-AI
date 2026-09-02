"""Mastery tracker for frontend offline sync."""

MASTERY_CSS = """
/* Mastery Tracker CSS */
.login-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:9999; }
.login-box { background:var(--surface); padding:24px; border-radius:var(--radius); text-align:center; max-width:90%; width:320px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
.login-box input { width:100%; padding:10px; margin:10px 0; border:1px solid var(--border); border-radius:8px; font-size:1rem; }
.login-box button { width:100%; padding:12px; background:var(--blue); color:#fff; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:1rem; }
.hidden { display:none !important; }
.concept-progress { margin-top:8px; height:6px; background:var(--border); border-radius:4px; overflow:hidden; }
.concept-progress-fill { height:100%; background:var(--green); width:0%; transition:width 0.3s; }
.badges-container { display:flex; gap:8px; justify-content:center; margin:12px 0; }
.badge-item { font-size:1.8rem; opacity:0.3; filter:grayscale(100%); transition:all 0.3s; }
.badge-item.earned { opacity:1; filter:grayscale(0%); transform:scale(1.1); }
.celebration { position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:9998; display:none; justify-content:center; align-items:center; font-size:6rem; }
.celebration.show { display:flex; animation:pop 2s ease-out; }
@keyframes pop { 0% { transform:scale(0.5); opacity:0; } 20% { transform:scale(1.2); opacity:1; } 80% { transform:scale(1); opacity:1; } 100% { transform:scale(1.2); opacity:0; } }
.sync-status { position:fixed; bottom:70px; right:16px; background:var(--surface); border-radius:16px; padding:4px 12px; font-size:0.75rem; box-shadow:0 2px 5px rgba(0,0,0,0.1); z-index:90; }
.sync-status.offline { color:var(--red); }
.sync-status.online { color:var(--green); }
"""

MASTERY_HTML = """
<div id="loginOverlay" class="login-overlay hidden">
  <div class="login-box">
    <h2>Student Login</h2>
    <p style="font-size:0.85rem;color:var(--muted);margin-bottom:12px;">Enter your ID to save progress offline</p>
    <input type="text" id="studentIdInput" placeholder="Student ID (e.g. STU-01)">
    <button onclick="login()">Start Learning</button>
  </div>
</div>
<div id="syncStatus" class="sync-status offline">🔴 Offline</div>
<div id="celebration" class="celebration">🎉🎊✨🎓</div>
"""

MASTERY_JS = """
// Mastery Tracker
const TRACKER = {
  studentId: null,
  startTime: Date.now(),
  chapterId: document.title.split('-')[0].trim().replace(/[^a-zA-Z0-9]/g, '_') || 'chapter',
  conceptMastery: {}, // concept index -> 0 to 100
  badges: [],
  offlineQueue: [],
  
  init: function() {
    this.studentId = localStorage.getItem('aasha_student_id');
    if (!this.studentId) {
      document.getElementById('loginOverlay').classList.remove('hidden');
    } else {
      this.loadProgress();
    }
    
    window.addEventListener('online', () => this.sync());
    window.addEventListener('offline', () => this.updateSyncStatus());
    this.updateSyncStatus();
    
    // Attempt sync every 30s if online
    setInterval(() => this.sync(), 30000);
  },
  
  updateSyncStatus: function() {
    const el = document.getElementById('syncStatus');
    if (!el) return;
    if (navigator.onLine) {
      el.className = 'sync-status online';
      el.textContent = '🟢 Online';
      this.sync();
    } else {
      el.className = 'sync-status offline';
      el.textContent = '🔴 Offline (' + this.offlineQueue.length + ' pending)';
    }
  },
  
  loadProgress: function() {
    const saved = localStorage.getItem('aasha_prog_' + this.chapterId + '_' + this.studentId);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (typeof state !== 'undefined') {
            state = Object.assign(state, data.state);
            updateStats();
        }
        this.conceptMastery = data.conceptMastery || {};
        this.badges = data.badges || [];
        this.updateUI();
      } catch (e) { console.error('Error loading progress', e); }
    }
  },
  
  saveProgress: function() {
    if (!this.studentId) return;
    const data = {
      state: typeof state !== 'undefined' ? state : {},
      conceptMastery: this.conceptMastery,
      badges: this.badges,
      timestamp: Date.now()
    };
    localStorage.setItem('aasha_prog_' + this.chapterId + '_' + this.studentId, JSON.stringify(data));
    this.queueSync(this.exportAnalytics());
  },
  
  queueSync: function(payload) {
    this.offlineQueue.push(payload);
    localStorage.setItem('aasha_queue_' + this.studentId, JSON.stringify(this.offlineQueue));
    this.updateSyncStatus();
  },
  
  sync: function() {
    if (!navigator.onLine || !this.studentId) return;
    const qStr = localStorage.getItem('aasha_queue_' + this.studentId);
    if (qStr) {
      try { this.offlineQueue = JSON.parse(qStr); } catch(e) {}
    }
    
    if (this.offlineQueue.length === 0) return;
    
    console.log('Syncing ' + this.offlineQueue.length + ' events to server...', this.offlineQueue);
    
    // Stub background sync
    setTimeout(() => {
      this.offlineQueue = [];
      localStorage.removeItem('aasha_queue_' + this.studentId);
      this.updateSyncStatus();
    }, 1000);
  },
  
  updateConceptMastery: function(conceptIdx, increment) {
    let current = this.conceptMastery[conceptIdx] || 0;
    current = Math.min(100, current + increment);
    this.conceptMastery[conceptIdx] = current;
    
    const bar = document.getElementById('concept-prog-' + conceptIdx);
    if (bar) bar.style.width = current + '%';
    
    this.checkBadges();
    this.saveProgress();
  },
  
  checkBadges: function() {
    const totalConcepts = document.querySelectorAll('.concept-card').length || 1;
    let totalMastery = 0;
    for (let i = 0; i < totalConcepts; i++) {
      totalMastery += (this.conceptMastery[i] || 0);
    }
    const overallPct = (totalMastery / (totalConcepts * 100)) * 100;
    
    const milestones = [25, 50, 75, 100];
    let newBadge = false;
    
    milestones.forEach(m => {
      if (overallPct >= m && !this.badges.includes(m)) {
        this.badges.push(m);
        newBadge = true;
        
        const b = document.getElementById('badge-' + m);
        if (b) b.classList.add('earned');
        
        if (m === 100) {
          const cel = document.getElementById('celebration');
          if (cel) {
            cel.classList.add('show');
            setTimeout(() => cel.classList.remove('show'), 2500);
          }
        }
      }
    });
    
    return overallPct;
  },
  
  exportAnalytics: function() {
    const totalConcepts = document.querySelectorAll('.concept-card').length || 1;
    let totalMastery = 0;
    let mastered = 0;
    let struggling = 0;
    for (let i = 0; i < totalConcepts; i++) {
      let m = this.conceptMastery[i] || 0;
      totalMastery += m;
      if (m >= 80) mastered++;
      if (m > 0 && m < 40) struggling++;
    }
    
    return {
      student_id: this.studentId,
      chapter_id: this.chapterId,
      timestamp: new Date().toISOString(),
      completion_pct: Math.round((totalMastery / (totalConcepts * 100)) * 100),
      time_spent_s: Math.round((Date.now() - this.startTime) / 1000),
      concepts_mastered: mastered,
      concepts_struggling: struggling,
      total_xp: typeof state !== 'undefined' ? state.xp : 0,
      badges_earned: this.badges,
      assessment: typeof state !== 'undefined' ? {
        answered: state.answered,
        correct: state.correct
      } : {}
    };
  },
  
  updateUI: function() {
    const totalConcepts = document.querySelectorAll('.concept-card').length || 1;
    for (let i = 0; i < totalConcepts; i++) {
      const current = this.conceptMastery[i] || 0;
      const bar = document.getElementById('concept-prog-' + i);
      if (bar) bar.style.width = current + '%';
    }
    this.badges.forEach(m => {
      const b = document.getElementById('badge-' + m);
      if (b) b.classList.add('earned');
    });
  }
};

function login() {
  const input = document.getElementById('studentIdInput').value.trim();
  if (input) {
    localStorage.setItem('aasha_student_id', input);
    document.getElementById('loginOverlay').classList.add('hidden');
    TRACKER.init();
  }
}

// Intercept original functions if they exist
document.addEventListener('DOMContentLoaded', () => {
    TRACKER.init();
    
    // Monkey patch answerQuestion
    if (typeof answerQuestion === 'function') {
        const origAnswerQuestion = answerQuestion;
        window.answerQuestion = function(btn, correct, feedback, xp) {
            origAnswerQuestion(btn, correct, feedback, xp);
            
            // Give mastery boost to closest concept or random if unlinked
            const allBars = document.querySelectorAll('.concept-progress-fill');
            if (allBars.length > 0) {
                // Distribute to random concept for now
                const idx = Math.floor(Math.random() * allBars.length);
                TRACKER.updateConceptMastery(idx, correct ? 25 : 5);
            }
        };
    }
});
"""
