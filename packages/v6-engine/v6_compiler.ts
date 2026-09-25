import { CanonicalIR, validateCanonicalIR } from '../canonical-ir/canonical_ir_schema';

export interface V6CompilerOptions {
  minify?: boolean;
  inlineBase64Assets?: boolean;
}


export interface ExperienceArtifact {
  componentId: string;
  version: string;
  source: string;
  capabilityContract: {
    capability_id: string;
    version: string;
    mechanics: string[];
    inputs: string[];
    outputs: string[];
  };
  provenance: {
    sourceType: 'AASHA_NATIVE';
    reference: string;
  };
}

export interface V6CompileResult {
  html: string;
  errors: string[];
  experienceArtifacts: ExperienceArtifact[];
}

export class V6Compiler {
  /**
   * Compiles Canonical IR into a standalone, offline V6 HTML5 stateful experience.
   */
  static compile(ir: CanonicalIR, options: V6CompilerOptions = {}): V6CompileResult {
    // 1. Validate Canonical IR Invariants
    const validation = validateCanonicalIR(ir);
    if (!validation.valid) {
      return { html: '', errors: validation.errors, experienceArtifacts: [] };
    }

    const { chapter_metadata, learning_objectives, concept_graph, assessment_items } = ir;

    // Emit source-level reusable artifacts from Canonical IR. These are staged candidates only;
    // certification/promotion remains a separate evidence-backed gate.
    const capabilityById = new Map(ir.capability_requirements.map(c => [c.id, c]));
    const experienceArtifacts: ExperienceArtifact[] = ir.experience_graph.states
      .filter(state => state.type === 'interactive_sim' && state.capability_id)
      .map(state => {
        const capability = capabilityById.get(state.capability_id!);
        const componentId = `exp.${state.capability_id!.replace(/^cap:/, '').replace(/[^a-zA-Z0-9._-]+/g, '_')}`;
        const contract = {
          capability_id: state.capability_id!,
          version: '1.0.0',
          mechanics: capability ? [capability.interaction_type] : ['interactive_sim'],
          inputs: ['config'],
          outputs: ['serializable_state', 'semantic_events']
        };
        const className = `AashaExp_${componentId.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const source =
          `// Generated from Canonical IR ${ir.chapter_metadata.chapter_id}\n` +
          `// Candidate artifact. Certification is NOT implied by compilation.\n` +
          `export class ${className} {\n` +
          `  constructor(private readonly adapter: any) {}\n` +
          `  mount(container: HTMLElement, config: Record<string, unknown>) { return this.adapter.mount(container, config); }\n` +
          `  getState() { return this.adapter.getState(); }\n` +
          `  reset() { return this.adapter.reset(); }\n` +
          `  destroy() { return this.adapter.destroy(); }\n` +
          `}\n`;
        return {
          componentId,
          version: '1.0.0',
          source,
          capabilityContract: contract,
          provenance: { sourceType: 'AASHA_NATIVE' as const, reference: ir.compilation_manifest.ir_hash }
        };
      });

    // 2. Generate Standalone Offline HTML Package with <aasha-sim> Web Component
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${chapter_metadata.title} — AASHA AIOS V6 Experience</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    body { background: #0F172A; color: #F8FAFC; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .viewport-container { width: 100%; max-width: 480px; height: 100vh; max-height: 852px; background: #1E293B; display: flex; flex-direction: column; position: relative; overflow: hidden; }
    .header { padding: 16px; background: #334155; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #475569; }
    .header h1 { font-size: 16px; font-weight: 700; color: #38BDF8; }
    .card-screen { flex: 1; padding: 20px; display: flex; flex-direction: column; overflow-y: auto; gap: 16px; }
    .concept-title { font-size: 20px; font-weight: 700; color: #F1F5F9; }
    .concept-body { font-size: 14px; line-height: 1.6; color: #94A3B8; }
    .math-var { background: #334155; padding: 2px 6px; border-radius: 4px; color: #F59E0B; font-weight: 600; }
    .sim-canvas { width: 100%; height: 180px; background: #0F172A; border-radius: 12px; border: 1px solid #475569; display: flex; justify-content: center; align-items: center; flex-direction: column; }
    .nav-button { height: 48px; min-width: 44px; background: #2563EB; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 16px; cursor: pointer; display: flex; justify-content: center; align-items: center; }
    .nav-button:disabled { opacity: 0.5; cursor: not-allowed; }
    .quiz-container { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
    .quiz-option { min-height: 48px; padding: 12px; background: #334155; border: 1px solid #475569; border-radius: 8px; color: white; cursor: pointer; text-align: left; }
    .quiz-option.correct { background: #059669; border-color: #10B981; }
    .quiz-option.incorrect { background: #DC2626; border-color: #EF4444; }
    .feedback-box { padding: 12px; border-radius: 8px; background: #334155; font-size: 13px; margin-top: 8px; display: none; }
  </style>
</head>
<body>
  <div class="viewport-container">
    <div class="header">
      <h1>${chapter_metadata.title}</h1>
      <span style="font-size: 12px; color: #94A3B8;">Grade ${chapter_metadata.grade}</span>
    </div>

    <div id="app" class="card-screen">
      <!-- Dynamic V6 Card Render Surface -->
    </div>
  </div>

  <script>
    // Embedded Canonical IR Execution Payload
    const CANONICAL_IR = ${JSON.stringify(ir)};

    // V6 Stateful Runtime Engine
    class V6Runtime {
      constructor(ir) {
        this.ir = ir;
        this.currentStateIdx = 0;
        this.scores = {};
        this.init();
      }

      init() {
        this.renderState(0);
      }

      renderState(idx) {
        const app = document.getElementById('app');
        const state = this.ir.experience_graph.states[idx];

        if (!state) return;

        if (state.type === 'concept_card') {
          const concept = this.ir.concept_graph[0];
          app.innerHTML = \`
            <div class="concept-title">\${concept.name}</div>
            <div class="concept-body">\${concept.definition_math_insulated}</div>
            <div class="sim-canvas">
              <svg width="120" height="120" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#38BDF8" stroke-width="4" fill="none"/>
                <text x="50" y="55" text-anchor="middle" fill="#F59E0B" font-size="14">\${this.ir.chapter_metadata.chapter_id}</text>
              </svg>
            </div>
            <button class="nav-button" onclick="window.runtime.nextState()">Continue to Interactive Challenge</button>
          \`;
        } else if (state.type === 'interactive_sim') {
          app.innerHTML = \`
            <div class="concept-title">Interactive Manipulative Lab</div>
            <div class="sim-canvas">
              <div style="color: #38BDF8; font-weight: 600;">[Interactive Balance Scale]</div>
              <div style="font-size: 12px; color: #94A3B8; margin-top: 8px;">Touch weights to balance the expression</div>
            </div>
            <button class="nav-button" onclick="window.runtime.nextState()">Proceed to TEAS Assessment</button>
          \`;
        } else if (state.type === 'teas_assessment') {
          const item = this.ir.assessment_items[0];
          if (!item) {
            app.innerHTML = \`<div class="concept-title">Module Completed!</div>\`;
            return;
          }
          const optionsHtml = item.options.map(opt => \`
            <button class="quiz-option" onclick="window.runtime.checkAnswer('\${opt.id}', \${opt.is_correct}, '\${opt.distractor_explanation}')">\${opt.text_math_insulated}</button>
          \`).join('');

          app.innerHTML = \`
            <div class="concept-title">Diagnostic Challenge</div>
            <div class="concept-body">\${item.prompt_math_insulated}</div>
            <div class="quiz-container">\${optionsHtml}</div>
            <div id="feedback" class="feedback-box"></div>
          \`;
        }
      }

      checkAnswer(optId, isCorrect, explanation) {
        const feedback = document.getElementById('feedback');
        feedback.style.display = 'block';
        if (isCorrect) {
          feedback.style.background = '#065F46';
          feedback.style.color = '#34D399';
          feedback.innerHTML = '<strong>Correct!</strong> Excellent conceptual understanding.';
        } else {
          feedback.style.background = '#7F1D1D';
          feedback.style.color = '#FCA5A5';
          feedback.innerHTML = \`<strong>Misconception Detected:</strong> \${explanation}\`;
        }
      }

      nextState() {
        this.currentStateIdx = (this.currentStateIdx + 1) % this.ir.experience_graph.states.length;
        this.renderState(this.currentStateIdx);
      }
    }

    window.addEventListener('DOMContentLoaded', () => {
      window.runtime = new V6Runtime(CANONICAL_IR);
    });
  </script>
</body>
</html>`;

    return { html, errors: [], experienceArtifacts };
  }
}
