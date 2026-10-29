import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import { type CanonicalIR, evaluateLLECoverage, evaluateSourceCoverage, type LLECoverageReport, type SourceCoverageReport, validateCanonicalIR } from '../canonical-ir/canonical_ir_schema.ts';
import { DomainSimGenerators } from '../adapters/domain_sim_generators.ts';
import { ThreeTierMatcher, type MatchResult } from '../adapters/three_tier_matcher.ts';

export interface V6CompilerOptions {
  minify?: boolean;
  inlineBase64Assets?: boolean;
  /** Registry root override for deterministic builds and isolated validation. */
  registryBaseDir?: string;
  /** Optional original PDF path; when supplied its bytes must match chapter_metadata.source_pdf_hash. */
  sourcePdfPath?: string;
  /** Paths keyed by source_documents[].id; every declared PDF must be present and hash-match. */
  sourcePdfPaths?: Record<string, string>;
  /** Defaults to strict source evidence. Set false only for isolated test fixtures or explicitly untrusted previews. */
  requireFullSourceCoverage?: boolean;
  artifactMode?: 'combined' | 'learning' | 'assessment';
}

export interface V6CompilerPairResult {
  learningHtml: string;
  assessmentHtml: string;
  errors: string[];
  sourceCoverage: SourceCoverageReport;
  lleCoverage: LLECoverageReport;
}

export class V6Compiler {
  /**
   * Compiles Canonical IR v1.1.0 into a standalone, offline V6 HTML5 stateful experience.
   * Implements: ExperienceGraph walker, V6RuntimeBus, 3-tier TEAS assessment (warmup→deep_dive→boss),
   * 4-tier progressive hints (H1-H4), adaptive remediation, bilingual word-tap (WM/CONN),
   * XP/motivation system, mobile viewport invariants, zero external requests.
   */
  static compile(ir: CanonicalIR, options: V6CompilerOptions = {}): { html: string; errors: string[]; capabilityMatches: Array<{ capability_id: string; result: MatchResult }>; sourceCoverage: SourceCoverageReport; lleCoverage: LLECoverageReport } {
    // 1. Validate Canonical IR v1.1.0 Invariants
    const sourceCoverage = evaluateSourceCoverage(ir);
    let lleCoverage = evaluateLLECoverage(ir);
    const validation = validateCanonicalIR(ir);
    const provenanceErrors: string[] = [];
    if (options.sourcePdfPath && options.sourcePdfPaths) {
      provenanceErrors.push('Provide either sourcePdfPath for legacy single-PDF IR or sourcePdfPaths for a source manifest, not both');
    }
    if (options.sourcePdfPath) {
      if (!fs.existsSync(options.sourcePdfPath)) {
        sourceCoverage.source_hash_status = 'MISSING';
        provenanceErrors.push(`Source PDF does not exist: ${options.sourcePdfPath}`);
      } else {
        const actualHash = crypto.createHash('sha256').update(fs.readFileSync(options.sourcePdfPath)).digest('hex');
        const expectedHash = (ir.chapter_metadata.source_pdf_hash || '').replace(/^sha256:/i, '').toLowerCase();
        sourceCoverage.source_hash_status = actualHash === expectedHash ? 'VERIFIED' : 'MISMATCH';
        if (actualHash !== expectedHash) provenanceErrors.push('Source PDF SHA-256 does not match chapter_metadata.source_pdf_hash');
        const sourceDocuments = ir.chapter_metadata.source_documents || [];
        if (actualHash === expectedHash && sourceDocuments.length > 1) {
          sourceCoverage.source_hash_status = 'MISSING';
          provenanceErrors.push('A single sourcePdfPath cannot verify a multi-document source_documents manifest; provide sourcePdfPaths for every document ID');
        }
      }
    }
    if (options.sourcePdfPaths) {
      const documents = ir.chapter_metadata.source_documents || [];
      if (!documents.length) {
        sourceCoverage.source_hash_status = 'MISSING';
        provenanceErrors.push('sourcePdfPaths were supplied but chapter_metadata.source_documents is missing');
      } else {
        const expectedIds = new Set(documents.map((document) => document.id));
        const suppliedIds = new Set(Object.keys(options.sourcePdfPaths));
        const missingIds = [...expectedIds].filter((id) => !suppliedIds.has(id));
        const unexpectedIds = [...suppliedIds].filter((id) => !expectedIds.has(id));
        let missing = missingIds.length > 0 || unexpectedIds.length > 0;
        let mismatch = false;
        for (const document of documents) {
          const sourcePath = options.sourcePdfPaths[document.id];
          if (!sourcePath || !fs.existsSync(sourcePath)) {
            missing = true;
            provenanceErrors.push(`Source PDF for document '${document.id}' is missing${sourcePath ? `: ${sourcePath}` : ' from sourcePdfPaths'}`);
            continue;
          }
          const actualHash = crypto.createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex');
          if (actualHash !== document.sha256.toLowerCase()) {
            mismatch = true;
            provenanceErrors.push(`Source PDF SHA-256 does not match source_documents entry '${document.id}'`);
          }
        }
        if (missingIds.length) provenanceErrors.push(`sourcePdfPaths is missing document IDs: ${missingIds.join(', ')}`);
        if (unexpectedIds.length) provenanceErrors.push(`sourcePdfPaths contains undeclared document IDs: ${unexpectedIds.join(', ')}`);
        sourceCoverage.source_hash_status = mismatch ? 'MISMATCH' : missing ? 'MISSING' : 'VERIFIED';
      }
    }
    const requireFullSourceCoverage = options.requireFullSourceCoverage !== false;
    if (requireFullSourceCoverage &&
        (sourceCoverage.status !== 'FULL' || sourceCoverage.source_hash_status !== 'VERIFIED')) {
      const coverageDetail = sourceCoverage.status === 'UNKNOWN'
        ? 'source_inventory is missing or empty; extract and inventory source concepts, examples, activities, and every exercise item'
        : sourceCoverage.status === 'INCOMPLETE'
          ? `${ir.source_inventory_scope !== 'FULL_CHAPTER' ? `source inventory scope is ${ir.source_inventory_scope || 'UNSPECIFIED'}; ` : ''}coverage inventory is incomplete (${sourceCoverage.fully_covered}/${sourceCoverage.total_items} full, ${sourceCoverage.partial} partial, ${sourceCoverage.omitted} omitted, ${sourceCoverage.unmapped} unmapped)`
          : sourceCoverage.status === 'INVALID'
            ? 'coverage inventory contains invalid source or output references'
            : '';
      const hashDetail = sourceCoverage.source_hash_status === 'VERIFIED' ? '' : `; source hash evidence is ${sourceCoverage.source_hash_status}`;
      provenanceErrors.push(`Artifact emission requires FULL source coverage and VERIFIED source hashes: ${coverageDetail}${hashDetail}`);
    }
    if (!validation.valid || provenanceErrors.length) {
      return { html: '', errors: [...validation.errors, ...provenanceErrors], capabilityMatches: [], sourceCoverage, lleCoverage };
    }

    // Reuse the governed registry matcher in the actual chapter build path.
    // A match is recorded for review; the current V6 runtime remains offline and
    // does not claim to bundle third-party candidate code automatically.
    const matcher = new ThreeTierMatcher(options.registryBaseDir);
    const capabilityMatches = (ir.capability_requirements || []).map((requirement) => ({
      capability_id: requirement.id,
      result: matcher.resolveExperience({
        capability_id: requirement.id,
        subject: ir.chapter_metadata.subject || 'General',
        grade: ir.chapter_metadata.grade,
        board: ir.chapter_metadata.board,
        mechanics: [requirement.interaction_type],
        offline_required: true,
      }),
    }));

    const simulationState = (ir.experience_graph.states || []).find((state) => state.type === 'interactive_sim');
    const simulationMatch = simulationState?.capability_id
      ? capabilityMatches.find((match) => match.capability_id === simulationState.capability_id)
      : undefined;
    const selectedResourceHtml = options.artifactMode === 'assessment' || !simulationMatch
      ? null
      : matcher.loadRuntimeArtifact(simulationMatch.result);
    const selectedRuntimeResource = selectedResourceHtml && simulationMatch?.result.runtime_artifact
      ? simulationMatch.result.runtime_artifact
      : null;
    if (selectedRuntimeResource && lleCoverage.hindi_required && !selectedRuntimeResource.language?.toLowerCase().startsWith('hi')) {
      const missing = `resource:${selectedRuntimeResource.resource_id}:hindi_interface`;
      if (!lleCoverage.missing_fields.includes(missing)) {
        const translatableFields = lleCoverage.translatable_fields + 1;
        lleCoverage = {
          ...lleCoverage,
          status: 'INCOMPLETE',
          translatable_fields: translatableFields,
          coverage_percent: Math.round((lleCoverage.translated_fields / translatableFields) * 100),
          missing_fields: [...lleCoverage.missing_fields, missing],
        };
      }
    }

    const runtimeIR = this.projectRuntimeIR(ir, options.artifactMode || 'combined');
    const irJson = JSON.stringify(runtimeIR);
    const title = ir.chapter_metadata.title;
    const lang = ir.accessibility_envelope.primary_language;
    const theme = ir.visual_grammar.primary_color_theme;

    const simScript = options.artifactMode === 'assessment'
      ? ''
      : selectedResourceHtml && selectedRuntimeResource
        ? DomainSimGenerators.generateHtmlResourceAdapterScript({
            resourceId: selectedRuntimeResource.resource_id,
            title: `${ir.chapter_metadata.title} — ${simulationState?.name || 'Interactive activity'}`,
            html: selectedResourceHtml,
          })
        : DomainSimGenerators.generateSimScript({
            subject: ir.chapter_metadata.subject || 'Math',
            topic: ir.chapter_metadata.title || 'Concept',
            topicSlug: ir.chapter_metadata.chapter_id || 'ch1',
            grade: ir.chapter_metadata.grade || 8
          });

    // 2. Generate Standalone Offline HTML Package
    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="${theme}">
  <title>${title} — AASHA V6</title>
  <style>
    /* === AASHA V6 Base Styles — Multi Aspect Ratio Invariant === */
    *{box-sizing:border-box;margin:0;padding:0;font-family:system-ui,-apple-system,'Noto Sans',sans-serif;-webkit-tap-highlight-color:transparent;}
    html,body{height:100%;overflow:hidden;background:#0F172A;}
    .shell{width:100%;max-width:480px;height:100%;margin:0 auto;background:#1E293B;display:flex;flex-direction:column;position:relative;}
    @media(max-height:640px){.sim-canvas{height:92px!important}}
    @media(min-height:641px) and (max-height:800px){.sim-canvas{height:115px!important}}
    @media(min-height:801px){.sim-canvas{height:125px!important}}
    .header{padding:12px 16px;background:#0F172A;border-bottom:1px solid #334155;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;}
    .header-title{font-size:14px;font-weight:700;color:#38BDF8;max-width:72%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
    .xp-badge{font-size:11px;color:#FCD34D;font-weight:600;}
    .progress-track{height:3px;background:#1E3A5F;flex-shrink:0;}
    .progress-fill{height:3px;background:linear-gradient(90deg,#38BDF8,#818CF8);transition:width .4s;}
    .screen{flex:1;padding:16px;overflow-y:auto;display:flex;flex-direction:column;gap:12px;min-height:0;}
    .screen::-webkit-scrollbar{display:none;}
    .concept-title{font-size:18px;font-weight:700;color:#F1F5F9;line-height:1.3;}
    .concept-def{font-size:13px;line-height:1.7;color:#94A3B8;overflow-y:auto;}
    /* KaTeX & Mathematical Typography Subset */
    .katex-math, .math-var{display:inline-block;font-family:'KaTeX_Math','Cambria Math','Latin Modern Math','Times New Roman',serif;font-style:italic;letter-spacing:0.02em;padding:1px 5px;border-radius:4px;color:#FCD34D;background:rgba(30,58,95,0.45);line-height:1.2;vertical-align:baseline;}
    .katex-math sup, .math-var sup{font-size:0.72em;font-style:normal;vertical-align:0.45em;line-height:0;color:#38BDF8;}
    .katex-math sub, .math-var sub{font-size:0.72em;font-style:normal;vertical-align:-0.3em;line-height:0;color:#38BDF8;}
    .frac{display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;padding:0 2px;font-size:0.88em;line-height:1.1;}
    .frac-top{border-bottom:1px solid currentColor;padding-bottom:1px;}
    .frac-bot{padding-top:1px;}
    .sqrt{display:inline-flex;align-items:baseline;vertical-align:middle;}
    .sqrt .radical{font-size:1.1em;margin-right:1px;}
    .sqrt .radicand{border-top:1px solid currentColor;padding-top:1px;}
    .word{cursor:pointer;border-bottom:1px dashed #38BDF8;color:#E2E8F0;}
    .sim-canvas{width:100%;background:#0F172A;border-radius:12px;border:1px solid #334155;display:flex;justify-content:center;align-items:center;flex-direction:column;gap:8px;flex-shrink:0;}
    .q-prompt{font-size:14px;color:#F1F5F9;line-height:1.6;}
    .opts{display:flex;flex-direction:column;gap:8px;margin-top:8px;}
    .opt{min-height:44px;min-width:44px;padding:10px 14px;background:#334155;border:1.5px solid #475569;border-radius:8px;color:#E2E8F0;cursor:pointer;font-size:13px;text-align:left;transition:background .15s;box-sizing:border-box;}
    .opt:hover{background:#3B4D6A;}
    .opt.correct{background:#065F46;border-color:#10B981;}
    .opt.incorrect{background:#7F1D1D;border-color:#EF4444;}
    .feedback{padding:10px;border-radius:8px;font-size:12px;margin-top:6px;display:none;}
    .feedback.show{display:block;}
    .feedback.ok{background:#022C22;color:#34D399;}
    .feedback.err{background:#450A0A;color:#FCA5A5;}
    .hint-btn{min-height:44px;min-width:44px;padding:8px 12px;background:#1E3A5F;color:#38BDF8;border:none;border-radius:6px;font-size:12px;cursor:pointer;display:flex;align-items:center;width:100%;text-align:left;margin-top:6px;box-sizing:border-box;}
    .hint-text{font-size:12px;color:#94A3B8;padding:6px 10px;background:#0F172A;border-radius:6px;margin-top:2px;display:none;}
    .hint-text.show{display:block;}
    .nav-bar{padding:10px 16px;background:#0F172A;border-top:1px solid #334155;display:flex;gap:8px;flex-shrink:0;}
    .nav-btn{flex:1;min-height:44px;min-width:44px;border:none;border-radius:8px;font-weight:600;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-sizing:border-box;}
    .nav-btn.primary{background:#2563EB;color:#fff;}
    .nav-btn.secondary{background:#334155;color:#94A3B8;}
    .nav-btn:disabled{opacity:.4;cursor:not-allowed;}
    .tier-badge{font-size:11px;padding:2px 8px;border-radius:12px;font-weight:700;}
    .tier-warmup{background:#064E3B;color:#34D399;}
    .tier-deepdive{background:#1E3A5F;color:#38BDF8;}
    .tier-boss{background:#4C1D95;color:#C4B5FD;}
    .mastery-track{flex:1;height:6px;background:#334155;border-radius:3px;overflow:hidden;}
    .mastery-fill{height:6px;background:linear-gradient(90deg,#10B981,#38BDF8);border-radius:3px;transition:width .6s;}
    .mastery-pct{font-size:11px;color:#94A3B8;min-width:32px;text-align:right;}
    .remediation{background:#1C0A3C;border:1px solid #7C3AED;border-radius:12px;padding:14px;}
    .remediation-title{font-size:14px;font-weight:700;color:#C4B5FD;margin-bottom:8px;}
    .remediation-body{font-size:13px;color:#A78BFA;line-height:1.6;}
    .celebration{position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);text-align:center;z-index:50;pointer-events:none;opacity:0;transition:opacity .3s;}
    .celebration.show{opacity:1;}
    dialog{border:none;border-radius:16px;padding:20px;background:#1E293B;color:#F1F5F9;max-width:280px;width:90vw;box-shadow:0 20px 60px rgba(0,0,0,.8);}
    dialog::backdrop{background:rgba(0,0,0,.7);}
    .dlg-word{font-size:18px;font-weight:700;color:#38BDF8;margin-bottom:4px;}
    .dlg-hindi{font-size:22px;font-weight:700;color:#F59E0B;margin-bottom:8px;}
    .dlg-desc{font-size:13px;color:#94A3B8;margin-bottom:16px;}
    .dlg-close{min-height:44px;min-width:44px;width:100%;background:#2563EB;color:#fff;border:none;border-radius:8px;font-weight:600;font-size:14px;cursor:pointer;box-sizing:border-box;}
  </style>
</head>
<body>
<div class="shell">
  <div class="header">
    <div class="header-title">${title}</div>
    <div style="display:flex;align-items:center;gap:8px;">
      <button class="lang-toggle-btn" id="langToggleBtn" aria-label="Toggle Language" style="min-height:44px;min-width:44px;padding:6px 10px;border-radius:8px;border:1px solid #475569;background:#334155;color:#F1F5F9;font-size:12px;font-weight:700;cursor:pointer;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;">EN | हिन्दी</button>
      <div class="xp-badge">⚡ <span id="xpVal">0</span> XP</div>
    </div>
  </div>
  <div class="progress-track"><div class="progress-fill" id="progressFill" style="width:0%"></div></div>
  <div class="screen" id="screen"></div>
  <div class="nav-bar" id="navBar"></div>
</div>

<dialog id="wordDialog">
  <div class="dlg-word" id="dlgWord"></div>
  <div class="dlg-hindi" id="dlgHindi"></div>
  <div class="dlg-desc" id="dlgDesc">Hindi / हिन्दी शब्द</div>
  <button class="dlg-close" onclick="document.getElementById('wordDialog').close()">OK</button>
</dialog>

<div class="celebration" id="celebOv">
  <div style="font-size:48px;" id="celebIcon">🎉</div>
  <div style="font-size:16px;font-weight:700;color:#FCD34D;margin-top:8px;" id="celebMsg"></div>
</div>

<script>
(function(){
// ── Embedded Canonical IR ─────────────────────────────────────────────────
const IR = ${irJson};
const CAPABILITY_MATCHES = ${JSON.stringify(capabilityMatches).replace(/</g, '\\u003c')};
window.__AASHA_CAPABILITY_MATCHES__ = CAPABILITY_MATCHES;
const SELECTED_RUNTIME_RESOURCE = ${JSON.stringify(selectedRuntimeResource).replace(/</g, '\\u003c')};
window.__AASHA_SELECTED_RUNTIME_RESOURCE__ = SELECTED_RUNTIME_RESOURCE;
const SOURCE_COVERAGE = ${JSON.stringify(sourceCoverage).replace(/</g, '\\u003c')};
window.__AASHA_SOURCE_COVERAGE__ = SOURCE_COVERAGE;
const LLE_COVERAGE = ${JSON.stringify(lleCoverage).replace(/</g, '\\u003c')};
window.__AASHA_LLE_COVERAGE__ = LLE_COVERAGE;

// ── V6RuntimeBus (inline) ────────────────────────────────────────────────
class Bus {
  constructor(cId,lId='learner_local_anon'){
    this._k='aasha_v6_'+cId+'_'+lId;this._log=[];this._m={};this._ls=[];this._load();
  }
  emit(ev){
    const f={...ev,eventId:'evt_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),timestamp:new Date().toISOString()};
    this._log.push(f);this._proc(f);this._save();
    this._ls.forEach(fn=>{try{fn(f)}catch(e){}});return f;
  }
  subscribe(fn){this._ls.push(fn);return()=>{this._ls=this._ls.filter(l=>l!==fn)};}
  getMastery(cId){return this._m[cId]||{conceptId:cId,historicalScore:0,recentScore:0,compositeMastery:0,totalAttempts:0};}
  getEventLog(){return this._log;}
  _proc(ev){
    if(ev.eventType!=='response_evaluated'||!ev.conceptId)return;
    const ok=ev.payload.isCorrect===true;
    const cur=this._m[ev.conceptId]||{historicalScore:.5,recentScore:.5,compositeMastery:.5,totalAttempts:0};
    const n=cur.totalAttempts+1;const rec=ok?1:0;
    const hist=(cur.historicalScore*(n-1)+cur.recentScore)/n;
    const comp=parseFloat((0.6*hist+0.4*rec).toFixed(4));
    this._m[ev.conceptId]={conceptId:ev.conceptId,historicalScore:parseFloat(hist.toFixed(4)),recentScore:parseFloat(rec.toFixed(4)),compositeMastery:comp,totalAttempts:n,lastUpdated:ev.timestamp};
    this.emit({eventType:'mastery_updated',pseudonymousLearnerId:ev.pseudonymousLearnerId,chapterId:ev.chapterId,conceptId:ev.conceptId,payload:{compositeMastery:comp,isMastered:comp>=.8}});
  }
  _load(){try{var s=JSON.parse(localStorage.getItem(this._k)||'{}');this._log=s.eventLog||[];this._m=s.mastery||{};}catch(e){}}
  _save(){try{localStorage.setItem(this._k,JSON.stringify({eventLog:this._log,mastery:this._m}))}catch(e){}}
}

// ── Universal AashaExperienceContract & <aasha-sim> Web Component ─────────
class AashaExperienceContract {
  mount(container, config) {}
  getState() { return {}; }
  pause() {}
  resume() {}
  reset() {}
  destroy() {}
  emitTelemetry(eventType, payload) {
    const event = new CustomEvent('aasha:telemetry', { bubbles: true, composed: true, detail: { timestamp: Date.now(), foundationId: this.foundationId || 'F01', experienceId: this.experienceId || 'generic', eventType, payload } });
    if (this.container && typeof this.container.dispatchEvent === 'function') this.container.dispatchEvent(event);
  }
  emitStateChange(newState) {
    const event = new CustomEvent('aasha:state_change', { bubbles: true, composed: true, detail: { timestamp: Date.now(), foundationId: this.foundationId || 'F01', experienceId: this.experienceId || 'generic', state: newState } });
    if (this.container && typeof this.container.dispatchEvent === 'function') this.container.dispatchEvent(event);
  }

}
class AashaExperienceAdapter extends AashaExperienceContract {
  constructor(metadata = {}) {
    super();
    this.foundationId = metadata.foundationId || 'F01';
    this.foundationName = metadata.foundationName || 'Escape Run';
    this.experienceId = metadata.experienceId || 'adapter';
    this.container = null; this.config = {}; this.state = {}; this.isPaused = false;
  }
  mount(container, config = {}) { this.container = container; this.config = config; this.state = { ...(config.initialState || {}) }; this.isPaused = false; }
  getState() { return { ...this.state }; }
  pause() { this.isPaused = true; }
  resume() { this.isPaused = false; }
  reset() { this.state = { ...(this.config.initialState || {}) }; }
  destroy() { this.pause(); this.container = null; }
}
class AashaSimElement extends HTMLElement {
  constructor() {
    super();
    this._adapter = null;
    this._observer = null;
    this._shadowRoot = this.attachShadow({ mode: 'open' });
    this._setupShadowDOM();
  }
  _setupShadowDOM() {
    this._shadowRoot.innerHTML = '<style>' +
      ':host{display:block;width:100%;position:relative;box-sizing:border-box;contain:content;}' +
      '.sim-mount-point{width:100%;min-height:220px;display:flex;flex-direction:column;box-sizing:border-box;}' +
      'button,input,select,textarea,[role="button"],.btn,.opt-btn{min-width:44px;min-height:44px;touch-action:manipulation;box-sizing:border-box;}' +
      '</style>' +
      '<div class="sim-mount-point" id="simMountPoint"><slot></slot></div>';

    // Seamless event tunneling across Shadow DOM boundary into V6RuntimeBus
    this._shadowRoot.addEventListener('aasha:telemetry', (e) => {
      if (!e.composed) {
        this.dispatchEvent(new CustomEvent('aasha:telemetry', {
          bubbles: true,
          composed: true,
          detail: e.detail
        }));
      }
    });

    this._shadowRoot.addEventListener('aasha:state_change', (e) => {
      if (!e.composed) {
        this.dispatchEvent(new CustomEvent('aasha:state_change', {
          bubbles: true,
          composed: true,
          detail: e.detail
        }));
      }
    });
  }
  connectedCallback() {
    this.style.display = 'block';
    this.style.width = '100%';
    this.style.position = 'relative';
    if (typeof IntersectionObserver !== 'undefined') {
      this._observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!this._adapter) return;
          if (entry.isIntersecting) { if (typeof this._adapter.resume === 'function') this._adapter.resume(); }
          else { if (typeof this._adapter.pause === 'function') this._adapter.pause(); }
        });
      }, { threshold: 0.1 });
      this._observer.observe(this);
    }
  }
  disconnectedCallback() {
    if (this._observer) { this._observer.disconnect(); this._observer = null; }
    if (this._adapter && typeof this._adapter.destroy === 'function') { this._adapter.destroy(); this._adapter = null; }
  }
  get mountPoint() {
    return this._shadowRoot.getElementById('simMountPoint') || this._shadowRoot;
  }
  bindAdapter(adapter, config = {}) {
    if (this._adapter && typeof this._adapter.destroy === 'function') this._adapter.destroy();
    this._adapter = adapter;
    if (this._adapter && typeof this._adapter.mount === 'function') {
      this._adapter.mount(this.mountPoint, config);
    }
  }
  get adapter() { return this._adapter; }
}
// ── Domain Interactive Simulation Script ─────────────────────────────
${simScript}

if (typeof customElements !== 'undefined' && !customElements.get('aasha-sim')) {
  customElements.define('aasha-sim', AashaSimElement);
}

// ── Instant Language Controller ─────────────────────────────────────────
window.__AASHA_LANG__ = '${lang}' || 'en';
window.AashaLang = {
  get: () => window.__AASHA_LANG__,
  toggle: () => {
    window.__AASHA_LANG__ = window.__AASHA_LANG__ === 'hi' ? 'en' : 'hi';
    const btn = document.getElementById('langToggleBtn');
    if (btn) btn.innerText = window.__AASHA_LANG__ === 'hi' ? 'हिन्दी ➔ EN' : 'EN ➔ हिन्दी';
    window.dispatchEvent(new CustomEvent('aasha:language_change', { detail: { lang: window.__AASHA_LANG__ } }));
    if (window.exp && typeof window.exp.languageChanged === 'function') window.exp.languageChanged();
  }
};
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('langToggleBtn');
  if (btn) btn.addEventListener('click', () => window.AashaLang.toggle());
});


// ── KaTeX Math Formatting & Insulation ─────────────────────────────────
function formatKatexMath(formula) {
  var s = (formula || '').trim();
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<span class="frac"><span class="frac-top">$1</span><span class="frac-bot">$2</span></span>');
  s = s.replace(/\\sqrt\{([^}]+)\}/g, '<span class="sqrt"><span class="radical">√</span><span class="radicand">$1</span></span>');
  s = s.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>');
  s = s.replace(/\^([0-9a-zA-Z+-]+)/g, '<sup>$1</sup>');
  s = s.replace(/_\{([^}]+)\}/g, '<sub>$1</sub>');
  s = s.replace(/_([0-9a-zA-Z+-]+)/g, '<sub>$1</sub>');
  s = s.replace(/\\times/g, '×')
       .replace(/\\cdot/g, '·')
       .replace(/\\pm/g, '±')
       .replace(/\\leq?/g, '≤')
       .replace(/\\geq?/g, '≥')
       .replace(/\\neq/g, '≠')
       .replace(/\\approx/g, '≈')
       .replace(/\\pi/g, 'π')
       .replace(/\\alpha/g, 'α')
       .replace(/\\beta/g, 'β')
       .replace(/\\theta/g, 'θ')
       .replace(/\\left[()\[\]{}|.]/g, '')
       .replace(/\\right[()\[\]{}|.]/g, '');
  return '<span class="katex-math math-var" data-math="true">' + s + '</span>';
}

function insulateMathContent(raw) {
  if (!raw) return { text: '', tokens: {} };
  var tokens = {};
  var c = 0;
  raw = raw.replace(/\\\[([\s\S]*?)\\\]/g, function(m, inner){
    var k = '__AASHA_MATH_' + (c++) + '__';
    tokens[k] = formatKatexMath(inner);
    return k;
  });
  raw = raw.replace(/\\\(([\s\S]*?)\\\)/g, function(m, inner){
    var k = '__AASHA_MATH_' + (c++) + '__';
    tokens[k] = formatKatexMath(inner);
    return k;
  });
  raw = raw.replace(/\$\$([\s\S]*?)\$\$/g, function(m, inner){
    var k = '__AASHA_MATH_' + (c++) + '__';
    tokens[k] = formatKatexMath(inner);
    return k;
  });
  raw = raw.replace(/\$([^\$\n]+?)\$/g, function(m, inner){
    var k = '__AASHA_MATH_' + (c++) + '__';
    tokens[k] = formatKatexMath(inner);
    return k;
  });
  raw = raw.replace(/<span[^>]*class=["'][^"']*(?:math-var|katex-math)[^"']*["'][^>]*>[\s\S]*?<\/span>/gi, function(m){
    var k = '__AASHA_MATH_' + (c++) + '__';
    tokens[k] = m;
    return k;
  });
  return { text: raw, tokens: tokens };
}

// ── Bilingual rt() with KaTeX Math Restoration ───────────────────────────
const WM=(IR.content_blocks[0]?.hindi_translation?.word_map)||{};
function rt(text){
  if(!text)return '';
  var ins = insulateMathContent(String(text));
  var raw = ins.text;
  var tokens = ins.tokens;

  if (Object.keys(WM).length > 0) {
    const keys=Object.keys(WM).sort((a,b)=>b.length-a.length);
    let out='',i=0;
    while(i<raw.length){
      if(raw[i]==='<'){const ci=raw.indexOf('>',i);if(ci>=0){out+=raw.slice(i,ci+1);i=ci+1;continue;}}
      let matched=false;
      if(i===0||!/[a-zA-Z]/.test(raw[i-1])){
        for(const k of keys){
          const sub=raw.slice(i,i+k.length);
          if(sub.toLowerCase()===k.toLowerCase()){
            const ai=i+k.length;if(ai<raw.length&&/[a-zA-Z]/.test(raw[ai]))continue;
            out+='<span class="word" data-w="'+sub.toLowerCase()+'" data-h="'+(WM[k]||'')+'">'+sub+'</span>';
            i+=k.length;matched=true;break;
          }
        }
      }
      if(!matched){out+=raw[i];i++;}
    }
    raw = out;
  }

  for (var k in tokens) {
    if (raw.indexOf(k) !== -1) {
      raw = raw.replace(new RegExp(k, 'g'), tokens[k]);
    }
  }
  return raw;
}
  while(i<text.length){
    if(text[i]==='<'){const ci=text.indexOf('>',i);if(ci>=0){out+=text.slice(i,ci+1);i=ci+1;continue;}}
    let matched=false;
    if(i===0||!/[a-zA-Z]/.test(text[i-1])){
      for(const k of keys){
        const sub=text.slice(i,i+k.length);
        if(sub.toLowerCase()===k.toLowerCase()){
          const ai=i+k.length;if(ai<text.length&&/[a-zA-Z]/.test(text[ai]))continue;
          out+='<span class="word" data-w="'+sub.toLowerCase()+'" data-h="'+WM[k]+'">'+sub+'</span>';
          i+=k.length;matched=true;break;
        }
      }
    }
    if(!matched){out+=text[i];i++;}
  }
  return out;
}

// ── ExperienceGraph Walker ─────────────────────────────────────────────
class Walker {
  constructor(graph,bus,lId,cId){
    this.g=graph;this.bus=bus;this.lId=lId;this.cId=cId;
    this.cur=graph.initial_state_id;this.hist=[];
  }
  state(){return this.g.states.find(s=>s.id===this.cur)||null;}
  idx(){return this.g.states.findIndex(s=>s.id===this.cur);}
  total(){return this.g.states.length;}
  transition(trigger){
    const t=this.g.transitions.find(t=>t.from_state_id===this.cur&&t.trigger_event===trigger);
    if(!t)return false;
    this.hist.push(this.cur);this.cur=t.to_state_id;
    this.bus.emit({eventType:'state_entered',pseudonymousLearnerId:this.lId,chapterId:this.cId,payload:{from:this.hist[this.hist.length-1],to:this.cur,trigger}});
    return true;
  }
  forceNext(){
    const i=this.idx();if(i<this.g.states.length-1){
      this.hist.push(this.cur);this.cur=this.g.states[i+1].id;
      this.bus.emit({eventType:'state_entered',pseudonymousLearnerId:this.lId,chapterId:this.cId,payload:{to:this.cur,trigger:'FORCED_NEXT'}});
      return true;
    }return false;
  }
}

// ── V6 Experience Controller ───────────────────────────────────────────
class V6Exp {
  constructor(){
    this.ir=IR;this.lId='learner_local_anon';this.xp=0;this.hintsUsed=0;
    this.maxHints=this.ir.learner_agency.max_hints_per_item;
    this.assessIdx=0;this.currentTier='warmup';this.conceptIdx=0;
    this.bus=new Bus(this.ir.chapter_metadata.chapter_id,this.lId);
    this.walker=new Walker(this.ir.experience_graph,this.bus,this.lId,this.ir.chapter_metadata.chapter_id);
    this.render();
  }

  render(){
    const s=this.walker.state();if(!s){this._renderComplete();return;}
    this._updateProgress();
    switch(s.type){
      case 'concept_card':return this._renderConcept(s);
      case 'interactive_sim':return this._renderSim(s);
      case 'teas_assessment':
      case 'assessment_gate':
      case 'assessment':
      case 'quiz':
        return this._renderAssessment();
      case 'remediation_card':return this._renderRemediation();
      default:this._renderComplete();
    }
  }

  _renderConcept(s){
    const concepts=this.ir.concept_graph||[];
    if(!concepts.length){this.startLab();return;}
    this.conceptIdx=Math.max(0,Math.min(this.conceptIdx,concepts.length-1));
    const concept=concepts[this.conceptIdx];
    const hi=window.AashaLang?.get()==='hi';
    const blocks=(this.ir.content_blocks||[]).filter(b=>b.concept_id===concept.id);
    const labels=hi?{concept_def:'समझें',worked_example:'हल किया उदाहरण',guided_step:'अब आज़माएँ',summary:'मुख्य विचार',key_takeaway:'याद रखें'}:{concept_def:'Understand',worked_example:'Worked example',guided_step:'Try it',summary:'Key idea',key_takeaway:'Remember'};
    const body=blocks.length?blocks.map(b=>
      '<section class="concept-content concept-content-'+b.type+'">'+
        (labels[b.type]?'<div class="concept-content-label">'+labels[b.type]+'</div>':'')+
        '<div class="concept-def">'+rt((hi?(b.text_hindi_math_insulated||b.text_hindi||b.text_math_insulated||b.text_english):(b.text_english||b.text_math_insulated))||'')+'</div>'+
      '</section>'
    ).join(''):
      '<section class="concept-content"><div class="concept-def">'+rt((hi?(concept.definition_hindi_math_insulated||concept.definition_hindi||concept.definition_math_insulated):(concept.definition_raw||concept.definition_math_insulated))||'')+'</div></section>';
    const isLast=this.conceptIdx===concepts.length-1;
    this._s(
      '<div class="concept-count">'+(hi?'अवधारणा ':'Concept ')+(this.conceptIdx+1)+(hi?' / ':' of ')+concepts.length+'</div>'+
      '<div class="concept-title">'+(hi?(concept.name_hindi||concept.name):concept.name)+'</div>'+body
    );
    this._n(
      '<button class="nav-btn secondary" id="backBtn" onclick="exp.previousConcept()" '+(this.conceptIdx===0?'disabled':'')+'>'+(hi?'पीछे':'Back')+'</button>' +
      '<button class="nav-btn primary" id="continueBtn" onclick="exp.nextConcept()">'+(isLast?(hi?'प्रयोग शुरू करें ➜':'Start Lab ➜'):(hi?'अगली अवधारणा ➜':'Next Concept ➜'))+'</button>'
    );
    this._bindWT();
  }

  languageChanged(){this.render();}

  previousConcept(){
    if(this.conceptIdx<=0)return;
    this.conceptIdx--;
    this._renderConcept(this.walker.state());
  }

  nextConcept(){
    if(this.conceptIdx<(this.ir.concept_graph||[]).length-1){
      this.conceptIdx++;
      this._renderConcept(this.walker.state());
      return;
    }
    this.startLab();
  }

  _renderSim(s){
    const cap=this.ir.capability_requirements.find(c=>c.id===s.capability_id);
    this._s(
      '<div class="concept-title">🔬 '+(s.name||'Interactive Lab')+'</div>'+
      '<div class="sim-wrapper" style="width:100%;flex:1;min-height:220px;display:flex;flex-direction:column;position:relative;">'+
        '<aasha-sim id="simLab" capability-id="'+(s.capability_id||'')+'" style="width:100%;height:100%;display:block;"></aasha-sim>'+
      '</div>'
    );
    this._n(
      '<button class="nav-btn secondary" id="backBtn" onclick="exp.back()">Back</button>' +
      '<button class="nav-btn primary" id="continueBtn" onclick="exp.readySim()">Ready for Assessment ➜</button>'
    );
    const simEl = document.getElementById('simLab');
    if (simEl) {
      simEl.addEventListener('aasha:telemetry', (e) => {
        if (e.detail?.isCorrect === true || e.detail?.competencyAchieved === true) {
          this._celebrate('Goal Solved! 🌟', '🎉');
          const btn = document.getElementById('continueBtn');
          if (btn) {
            btn.style.background = '#059669';
            btn.innerText = 'Solved! Start Assessment ➜';
          }
        }
      });
    }
    this._initSim();
    this.bus.emit({eventType:'interaction_started',pseudonymousLearnerId:this.lId,chapterId:this.ir.chapter_metadata.chapter_id,payload:{capabilityId:s.capability_id}});
  }

  _tierItems(tier){
    const it=this.ir.assessment_items||[];if(!it.length)return[];
    const n=it.length;
    if(tier==='warmup')return it.slice(0,Math.ceil(n*.4));
    if(tier==='deep_dive')return it.slice(Math.ceil(n*.4),Math.ceil(n*.75));
    return it.slice(Math.ceil(n*.75));
  }

  _renderAssessment(){
    const items=this._tierItems(this.currentTier);
    if(this.assessIdx>=items.length){this._advanceTier();return;}
    const item=items[this.assessIdx];
    const hi=window.AashaLang?.get()==='hi';
    const tLabel=this.currentTier==='warmup'?'<span class="tier-badge tier-warmup">'+(hi?'अभ्यास':'WARM-UP')+'</span>':
                 this.currentTier==='deep_dive'?'<span class="tier-badge tier-deepdive">'+(hi?'गहराई से':'DEEP DIVE')+'</span>':
                 '<span class="tier-badge tier-boss">'+(hi?'अंतिम चुनौती':'BOSS')+'</span>';
    const m=this.bus.getMastery(item.concept_id);const mp=Math.round(m.compositeMastery*100);
    const shuffledOpts=[...item.options].sort(function(){return Math.random()-0.5;});
    const opts=shuffledOpts.map(o=>
      '<button class="opt" id="opt_'+o.id+'" data-optid="'+o.id+'" onclick="exp.checkOption(this.dataset.optid)">'+rt(hi?(o.text_hindi_math_insulated||o.text_hindi||o.text_math_insulated):(o.text||o.text_math_insulated))+'</button>'
    ).join('');
    const h=hi?(item.hints_hindi_math_insulated||item.hints_hindi||item.hints):item.hints;
    const hHtml=this.ir.learner_agency.hint_request_allowed?
      '<div style="margin-top:8px;">'+
        (h.H1_hook?'<button class="hint-btn" onclick="exp.hint(0)">💡 '+(hi?'संकेत 1 — ध्यान':'Hint 1 — Attention')+'</button><div class="hint-text" id="h0">'+rt(h.H1_hook)+'</div>':'')+
        (h.H2_concept?'<button class="hint-btn" onclick="exp.hint(1)">💡 '+(hi?'संकेत 2 — अवधारणा':'Hint 2 — Concept')+'</button><div class="hint-text" id="h1">'+rt(h.H2_concept)+'</div>':'')+
        (h.H3_formula?'<button class="hint-btn" onclick="exp.hint(2)">💡 '+(hi?'संकेत 3 — सूत्र':'Hint 3 — Formula')+'</button><div class="hint-text" id="h2">'+rt(h.H3_formula)+'</div>':'')+
        (h.H4_step?'<button class="hint-btn" onclick="exp.hint(3)">💡 '+(hi?'संकेत 4 — चरण':'Hint 4 — Step')+'</button><div class="hint-text" id="h3">'+rt(h.H4_step)+'</div>':'')+
      '</div>':'';
    this._s(
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'+tLabel+
        '<div style="flex:1;font-size:11px;color:#64748B;">'+(hi?'प्रश्न ':'Q ')+(this.assessIdx+1)+' / '+items.length+'</div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">'+
        '<span style="font-size:11px;color:#64748B;">'+(hi?'महारत':'Mastery')+'</span>'+
        '<div class="mastery-track"><div class="mastery-fill" style="width:'+mp+'%"></div></div>'+
        '<span class="mastery-pct">'+mp+'%</span>'+
      '</div>'+
      '<div class="q-prompt">'+rt(hi?(item.prompt_hindi_math_insulated||item.prompt_hindi||item.prompt_math_insulated):(item.prompt||item.prompt_math_insulated))+'</div>'+
      '<div class="opts">'+opts+'</div>'+
      '<div class="feedback" id="fb"></div>'+hHtml
    );
    this._n(
      '<button class="nav-btn secondary" id="backBtn" onclick="exp.back()">'+(hi?'पीछे':'Back')+'</button>' +
      '<button class="nav-btn primary" id="continueBtn" onclick="exp.nextQ()" disabled>'+(hi?'जारी रखें ➜':'Continue ➜')+'</button>'
    );
    this._bindWT();
  }

  _renderRemediation(){
    const c=this.ir.concept_graph[0];const m=this.ir.misconceptions[0];
    const hi=window.AashaLang?.get()==='hi';
    this._s(
      '<div class="remediation"><div class="remediation-title">📚 '+(hi?'फिर से देखें: ':'Revisit: ')+(hi?(c?.name_hindi||c?.name):(c?.name||'Concept'))+'</div>'+
      '<div class="remediation-body">'+(hi?(c?.definition_hindi_math_insulated||c?.definition_hindi||c?.definition_math_insulated):(c?.definition_raw||c?.definition_math_insulated)||'')+'</div></div>'+
      (m?'<div class="remediation" style="margin-top:10px;"><div class="remediation-title">⚠️ '+(hi?'गलतफहमी':'Misconception')+'</div>'+
      '<div class="remediation-body">'+(hi?(m.description_hindi||m.description):m.description)+'</div></div>':'')
    );
    this._n('<button class="nav-btn primary" id="continueBtn" onclick="exp.retry()">Try Again ↩</button>');
  }

  _renderComplete(){
    const hi=window.AashaLang?.get()==='hi';
    this._s(
      '<div style="text-align:center;padding:20px;">'+
        '<div style="font-size:48px;margin-bottom:12px;">'+(this.ir.motivation_intent.badge_id||'🌟')+'</div>'+
        '<div style="font-size:20px;font-weight:700;color:#F1F5F9;margin-bottom:6px;">'+(hi?'अध्याय पूरा हुआ!':'Chapter Complete!')+'</div>'+
        '<div style="font-size:13px;color:#94A3B8;margin-bottom:16px;">'+this.ir.chapter_metadata.title+'</div>'+
        '<div style="font-size:28px;font-weight:700;color:#FCD34D;">+'+this.xp+' XP</div>'+
        this._masteryReport()+
      '</div>'
    );
    this._n('<button class="nav-btn primary" onclick="window.location.reload()">'+(hi?'फिर से शुरू करें ↺':'Replay ↺')+'</button>');
  }

  _masteryReport(){
    let h='<div style="margin-top:16px;text-align:left;">';
    for(const c of this.ir.concept_graph){
      const m=this.bus.getMastery(c.id);const p=Math.round(m.compositeMastery*100);
      const st=p>=80?'✅':p>=60?'⚠️':'❌';
      h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'+
        '<span>'+st+'</span><span style="flex:1;font-size:13px;color:#F1F5F9;">'+c.name+'</span>'+
        '<div class="mastery-track" style="width:80px;"><div class="mastery-fill" style="width:'+p+'%"></div></div>'+
        '<span class="mastery-pct">'+p+'%</span></div>';
    }
    return h+'</div>';
  }

  check(optId,isCorrect,explanation,miscId,conceptId){
    const hi=window.AashaLang?.get()==='hi';
    document.querySelectorAll('.opt').forEach(b=>b.disabled=true);
    const el=document.getElementById('opt_'+optId);
    if(el)el.classList.add(isCorrect?'correct':'incorrect');
    const fb=document.getElementById('fb');
    if(fb){fb.className='feedback show '+(isCorrect?'ok':'err');fb.innerHTML=isCorrect?'<strong>'+(hi?'सही!':'Correct!')+'</strong>':'<strong>'+(hi?'सोचने का तरीका:':'Misconception:')+'</strong> '+rt(explanation);}
    const item=this._tierItems(this.currentTier)[this.assessIdx];
    this.bus.emit({eventType:'response_evaluated',pseudonymousLearnerId:this.lId,chapterId:this.ir.chapter_metadata.chapter_id,objectiveId:item?.objective_id,conceptId:conceptId||item?.concept_id,payload:{isCorrect,optId,misconception_id:miscId||null}});
    if(!isCorrect&&miscId)this.bus.emit({eventType:'misconception_detected',pseudonymousLearnerId:this.lId,chapterId:this.ir.chapter_metadata.chapter_id,conceptId:conceptId||item?.concept_id,payload:{misconception_id:miscId}});
    if(isCorrect){
      const xpMap={warmup:this.ir.motivation_intent.xp_reward_warmup,deep_dive:this.ir.motivation_intent.xp_reward_deep_dive,boss:this.ir.motivation_intent.xp_reward_boss};
      this.xp+=(xpMap[this.currentTier]||5);document.getElementById('xpVal').textContent=this.xp;
    }
    const nb=document.getElementById('continueBtn');if(nb)nb.disabled=false;
  }

  hint(idx){
    if(this.hintsUsed>=this.maxHints)return;
    const el=document.getElementById('h'+idx);if(el){el.classList.add('show');this.hintsUsed++;}
  }

  nextQ(){this.assessIdx++;this.hintsUsed=0;this.render();}

  _advanceTier(){
    const tiers=['warmup','deep_dive','boss'];const idx=tiers.indexOf(this.currentTier);
    const cId=this.ir.concept_graph[0]?.id;
    const m=cId?this.bus.getMastery(cId):null;
    const needRem=m&&m.compositeMastery<this.ir.adaptive_policy.remediation_threshold;
    if(needRem&&this.currentTier==='warmup'){
      this.bus.emit({eventType:'adaptation_triggered',pseudonymousLearnerId:this.lId,chapterId:this.ir.chapter_metadata.chapter_id,payload:{reason:'mastery_below_threshold',composite:m.compositeMastery}});
      const remId='state:remediation_auto';
      if(!this.ir.experience_graph.states.find(s=>s.id===remId)){
        this.ir.experience_graph.states.splice(this.walker.idx()+1,0,{id:remId,name:'Remediation',type:'remediation_card',content_ids:[]});
        this.ir.experience_graph.transitions.push({from_state_id:this.walker.cur,to_state_id:remId,trigger_event:'REMEDIATION_TRIGGER'});
        this.ir.experience_graph.transitions.push({from_state_id:remId,to_state_id:this.walker.cur,trigger_event:'RETRY'});
      }
      this.walker.forceNext();this.assessIdx=0;this.render();return;
    }
    if(idx<tiers.length-1){
      this.currentTier=tiers[idx+1];this.assessIdx=0;this.hintsUsed=0;
      this._celebrate(this.currentTier==='deep_dive'?'⚡ Warm-Up Complete!':'🏆 Deep Dive Done!','🎉');
      setTimeout(()=>this.render(),1200);
    }else{
      this._celebrate('Chapter Mastered! '+(this.ir.motivation_intent.badge_id||'🌟'),'🎊');
      setTimeout(()=>this._renderComplete(),1500);
    }
  }

  advance(trigger){
    if(trigger==='MANIPULATIVE_COMPLETED')this.bus.emit({eventType:'interaction_completed',pseudonymousLearnerId:this.lId,chapterId:this.ir.chapter_metadata.chapter_id,payload:{trigger}});
    const moved = this.walker.transition(trigger) || this.walker.forceNext();
    if (!moved) {
      // If state graph has no next explicit state, transition smoothly to assessment or completion
      const curType = this.walker.state()?.type;
      if (this.ir.assessment_items && this.ir.assessment_items.length > 0 && !['teas_assessment', 'assessment_gate', 'assessment', 'quiz'].includes(curType)) {
        this.assessIdx = 0;
        this.hintsUsed = 0;
        this._renderAssessment();
        return;
      }
      this._renderComplete();
      return;
    }
    this.assessIdx=0;this.hintsUsed=0;this.render();
  }

  back(){
    const previous=this.walker.hist.pop();
    if(!previous)return;
    const from=this.walker.cur;
    this.walker.cur=previous;
    this.bus.emit({eventType:'state_entered',pseudonymousLearnerId:this.lId,chapterId:this.ir.chapter_metadata.chapter_id,payload:{from,to:previous,trigger:'BACK'}});
    if(this.walker.state()?.type==='concept_card')this.conceptIdx=(this.ir.concept_graph||[]).length-1;
    this.assessIdx=0;this.hintsUsed=0;this.render();
  }
  startLab(){this.advance('NEXT_CARD');}
  readySim(){this.advance('MANIPULATIVE_COMPLETED');}
  retry(){this.advance('RETRY');}
  checkOption(optId){
    const items=this._tierItems(this.currentTier);
    const item=items[this.assessIdx];if(!item)return;
    const opt=item.options.find(o=>o.id===optId);if(!opt)return;
    const explanation=window.AashaLang?.get()==='hi'?(opt.distractor_explanation_hindi_math_insulated||opt.distractor_explanation_hindi||opt.distractor_explanation||''):(opt.distractor_explanation||'');
    this.check(opt.id,opt.is_correct,explanation,opt.misconception_id||'',item.concept_id);
  }

  _s(html){document.getElementById('screen').innerHTML=html;}
  _n(html){document.getElementById('navBar').innerHTML=html;}
  _updateProgress(){const p=Math.round((this.walker.idx()/Math.max(1,this.walker.total()-1))*100);const f=document.getElementById('progressFill');if(f)f.style.width=p+'%';}
  _celebrate(msg,icon){
    const ov=document.getElementById('celebOv');
    if(ov){document.getElementById('celebIcon').textContent=icon;document.getElementById('celebMsg').textContent=msg;ov.classList.add('show');setTimeout(()=>ov.classList.remove('show'),1100);}
  }
  _bindWT(){
    document.querySelectorAll('.word').forEach(el=>{
      el.addEventListener('click',()=>{
        document.getElementById('dlgWord').textContent=el.dataset.w;
        document.getElementById('dlgHindi').textContent=el.dataset.h;
        document.getElementById('wordDialog').showModal();
      });
    });
  }
  _initSim(){
    const el=document.getElementById('simLab');if(!el)return;
    const svg=document.getElementById('scaleSvg');if(!svg)return;
    const parent=this;
    class BalanceScaleAdapter extends AashaExperienceAdapter {
      constructor(){
        super({foundationId:'F01',foundationName:'Escape Run',experienceId:'balance-scale'});
        this.targetX=2;this.targetUnits=4;this.curX=0;this.curUnits=0;
      }
      mount(c){this.container=c;this.updateUI();}
      add(t){
        if(t==='x')this.curX++;if(t==='1')this.curUnits++;
        this.emitTelemetry('term_added',{type:t,curX:this.curX,curUnits:this.curUnits});
        this.updateUI();
      }
      reset(){
        this.curX=0;this.curUnits=0;
        this.emitTelemetry('reset',{});
        this.updateUI();
      }
      updateUI(){
        const isBalanced=(this.curX===this.targetX&&this.curUnits===this.targetUnits);
        const diff=Math.max(-15,Math.min(15,((this.curX*5+this.curUnits)-(this.targetX*5+this.targetUnits))*2));
        const svg=document.getElementById('scaleSvg');if(svg)svg.style.transform='rotate('+diff+'deg)';
        const txt=document.getElementById('rightPanText');
        if(txt){
          let s='';if(this.curX>0)s+=(this.curX===1?'x':this.curX+'x');
          if(this.curUnits>0)s+=(s?' + ':'')+this.curUnits;
          txt.textContent=s||'0';
        }
        const st=document.getElementById('balanceStatus');
        if(st){
          if(isBalanced)st.innerHTML='<span style="color:#34D399;font-weight:700;">🎉 Perfectly Balanced! 2x + 4 = 2x + 4</span>';
          else if(this.curX*5+this.curUnits<this.targetX*5+this.targetUnits)st.textContent='Right pan is lighter. Keep adding terms.';
          else st.textContent='Right pan is heavier! Hit Reset to balance.';
        }
        this.emitStateChange({isBalanced,curX:this.curX,curUnits:this.curUnits});
      }
    }
    this.simAdapter=new BalanceScaleAdapter();
    if(el.bindAdapter)el.bindAdapter(this.simAdapter);
  }
  simAdd(t){if(this.simAdapter)this.simAdapter.add(t);}
  simAddX(){this.simAdd('x');}
  simAddOne(){this.simAdd('1');}
  simReset(){if(this.simAdapter)this.simAdapter.reset();}
}

let exp;
window.addEventListener('DOMContentLoaded',()=>{exp=new V6Exp();});
window.exp={advance:(t)=>exp?.advance(t),back:()=>exp?.back(),startLab:()=>exp?.startLab(),nextConcept:()=>exp?.nextConcept(),previousConcept:()=>exp?.previousConcept(),languageChanged:()=>exp?.languageChanged(),readySim:()=>exp?.readySim(),retry:()=>exp?.retry(),check:(...a)=>exp?.check(...a),checkOption:(id)=>exp?.checkOption(id),hint:(i)=>exp?.hint(i),nextQ:()=>exp?.nextQ(),simAdd:(t)=>exp?.simAdd(t),simAddX:()=>exp?.simAddX(),simAddOne:()=>exp?.simAddOne(),simReset:()=>exp?.simReset()};
window.App={nIdx:0,exit:function(){this.nIdx=0;if(window.exp)window.exp.advance('EXIT');}};
})();
</script>
</body>
</html>`;

    // Keep each self-contained student artifact within the governed 20 MiB ceiling.
    const byteLength = Buffer.byteLength(html, 'utf8');
    if (byteLength > 20971520) {
      return {
        html: '',
        errors: [`Bundle limit exceeded: standalone student HTML is ${byteLength} bytes; the governed ceiling is 20,971,520 bytes.`],
        capabilityMatches,
        sourceCoverage,
        lleCoverage,
      };
    }

    return { html, errors: [], capabilityMatches, sourceCoverage, lleCoverage };
  }

  /** Produces both student artifacts from the same source IR and compiler. */
  static compilePair(ir: CanonicalIR, options: Omit<V6CompilerOptions, 'artifactMode'> = {}): V6CompilerPairResult {
    const learning = this.compile(ir, { ...options, artifactMode: 'learning' });
    if (learning.errors.length) return { learningHtml: '', assessmentHtml: '', errors: learning.errors, sourceCoverage: learning.sourceCoverage, lleCoverage: learning.lleCoverage };
    const assessment = this.compile(ir, { ...options, artifactMode: 'assessment' });
    if (assessment.errors.length) return { learningHtml: '', assessmentHtml: '', errors: assessment.errors, sourceCoverage: assessment.sourceCoverage, lleCoverage: assessment.lleCoverage };
    return { learningHtml: learning.html, assessmentHtml: assessment.html, errors: [], sourceCoverage: learning.sourceCoverage, lleCoverage: learning.lleCoverage };
  }

  private static projectRuntimeIR(ir: CanonicalIR, mode: NonNullable<V6CompilerOptions['artifactMode']>): CanonicalIR {
    const projected = JSON.parse(JSON.stringify(ir)) as CanonicalIR;
    if (mode === 'learning') {
      projected.assessment_items = [];
      const learningStates = projected.experience_graph.states.filter((state) =>
        !['teas_assessment', 'assessment_gate', 'assessment', 'quiz'].includes(state.type)
      );
      const stateIds = new Set(learningStates.map((state) => state.id));
      if (!stateIds.has(projected.experience_graph.initial_state_id)) {
        if (learningStates.length === 0) {
          learningStates.push({
            id: 'state:learning:intro',
            name: 'Concept Discovery',
            type: 'concept_card',
            content_ids: projected.content_blocks.map((block) => block.id),
          });
        }
        projected.experience_graph.initial_state_id = learningStates[0].id;
      }
      projected.experience_graph.states = learningStates;
      projected.experience_graph.transitions = projected.experience_graph.transitions.filter((transition) =>
        stateIds.has(transition.from_state_id) && stateIds.has(transition.to_state_id)
      );
    } else if (mode === 'assessment') {
      const assessmentState = projected.experience_graph.states.find((state) =>
        ['teas_assessment', 'assessment_gate', 'assessment', 'quiz'].includes(state.type)
      ) || {
        id: 'state:assessment', name: 'TEAS Assessment', type: 'teas_assessment' as const, content_ids: [] as string[],
      };
      assessmentState.content_ids = [];
      projected.content_blocks = [];
      projected.experience_graph = {
        initial_state_id: assessmentState.id,
        states: [assessmentState],
        transitions: [],
      };
      projected.capability_requirements = [];
    }
    return projected;
  }
}
