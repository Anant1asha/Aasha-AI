import { validateChapter } from '../../../packages/content-schema/src/index.js';
import { AashaExperienceContract, AashaExperienceAdapter } from '../../../packages/simulation-runtime/src/index.js';
import fractionsChapter from '../../../content/class-06/fractions.json' with { type: 'json' };
import perimeterChapter from '../../../content/class-07/perimeter-and-area.json' with { type: 'json' };
import dictionary from '../../../content/dictionary.json' with { type: 'json' };

/**
 * Normalizes an Indic / English text slug.
 */
export function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^\w\d]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'chapter';
}

/**
 * Harmonizes standalone chapter formats (NODES, WE, WM, CONN) into
 * the standardized Aasha Content Schema chapter contract.
 */
export function adaptStandaloneChapter(standaloneDef = {}) {
  if (!standaloneDef || typeof standaloneDef !== 'object') {
    throw new Error('standaloneDef object required');
  }

  const rawTitle = standaloneDef.title || 'Untitled Chapter';
  const gradeMatch = rawTitle.match(/Class\s*(\d+)/i) || (standaloneDef.grade ? [null, String(standaloneDef.grade)] : null);
  const grade = gradeMatch ? Number(gradeMatch[1]) : (Number(standaloneDef.grade) || 8);
  const subject = standaloneDef.subject || 'Mathematics';
  const id = standaloneDef.id || `ch-${slugify(rawTitle)}`;

  // Integrate bilingual dictionary
  if (standaloneDef.WM && typeof standaloneDef.WM === 'object') {
    dictionary.WM = Object.assign(dictionary.WM || {}, standaloneDef.WM);
    if (typeof window !== 'undefined') {
      window.WM = Object.assign(window.WM || {}, standaloneDef.WM);
    }
  }
  if (standaloneDef.CONN && typeof standaloneDef.CONN === 'object') {
    dictionary.CONN = Object.assign(dictionary.CONN || {}, standaloneDef.CONN);
    if (typeof window !== 'undefined') {
      window.CONN = Object.assign(window.CONN || {}, standaloneDef.CONN);
    }
  }

  const rawNodes = Array.isArray(standaloneDef.NODES) ? standaloneDef.NODES : (Array.isArray(standaloneDef.nodes) ? standaloneDef.nodes : []);
  if (!rawNodes.length) {
    throw new Error('standaloneDef must contain non-empty NODES or nodes array');
  }

  const weMap = standaloneDef.WE || {};
  const nodes = [];
  const questions = [];

  rawNodes.forEach((node, nodeIdx) => {
    const nodeId = node.id || `node_${nodeIdx + 1}`;
    const nodeTitle = node.title || `Concept ${nodeIdx + 1}`;

    const steps = Array.isArray(node.steps) ? node.steps : [];
    let explanation = '';
    let objective = node.objective || '';
    let visualSpec = node.visual || null;

    steps.forEach((step, sIdx) => {
      if (step.t === 'intro' || step.type === 'intro') {
        const text = step.text || step.sub || step.title || '';
        if (text && !objective) objective = text;
        if (text) explanation += (explanation ? ' ' : '') + text;
      } else if (step.t === 'text' || step.type === 'text') {
        const content = step.content || step.text || '';
        if (content) explanation += (explanation ? ' ' : '') + content;
      }

      // Check for visuals
      if (!visualSpec) {
        if (step.simType === 'props' || step.type === 'visual') {
          visualSpec = {
            type: 'diagram',
            total: 6,
            shaded: 3,
            interactive: true,
            title: step.caption || nodeTitle,
            text: step.caption || 'Interactive exploration'
          };
        } else if (typeof step.draw === 'function') {
          visualSpec = {
            type: 'canvas',
            width: 320,
            height: 200,
            title: nodeTitle,
            render: step.draw
          };
        }
      }

      // Extract quiz questions from steps
      if ((step.t === 'quiz' || step.type === 'quiz' || step.t === 'vq') && step.q) {
        const qObj = step.q;
        const prompt = qObj.text || qObj.q || qObj.prompt || `Assessment question for ${nodeTitle}`;
        const rawOpts = Array.isArray(qObj.opts) ? qObj.opts : (Array.isArray(qObj.options) ? qObj.options : []);

        const normalizedOptions = [];
        let answerIndex = 0;

        rawOpts.forEach((opt, optIdx) => {
          if (typeof opt === 'string') {
            normalizedOptions.push({
              text: opt,
              correct: optIdx === (qObj.answerIndex ?? 0),
              feedback: optIdx === (qObj.answerIndex ?? 0) ? 'Correct!' : 'Try again.',
              misconceptionId: optIdx === (qObj.answerIndex ?? 0) ? null : `distractor_${nodeId}_${sIdx}_${optIdx}`
            });
            if (optIdx === (qObj.answerIndex ?? 0)) answerIndex = optIdx;
          } else if (typeof opt === 'object' && opt !== null) {
            const isCorrect = Boolean(opt.c ?? opt.correct);
            if (isCorrect) answerIndex = optIdx;
            normalizedOptions.push({
              text: opt.t || opt.text || String(opt),
              correct: isCorrect,
              feedback: opt.m || opt.feedback || (isCorrect ? 'Correct!' : 'Check your calculation.'),
              misconceptionId: isCorrect ? null : (opt.misconceptionId || (opt.m ? `misc_${nodeId}_${sIdx}_${optIdx}` : 'misconception_distractor'))
            });
          }
        });

        // Guarantee at least 2 options
        if (normalizedOptions.length < 2) {
          normalizedOptions.push({
            text: 'Incorrect alternative',
            correct: false,
            feedback: 'Incorrect choice.',
            misconceptionId: `misc_pad_${nodeId}_${sIdx}`
          });
        }

        questions.push({
          id: qObj.question_id || qObj.id || `q_${nodeId}_${sIdx + 1}`,
          nodeId,
          prompt,
          options: normalizedOptions,
          answerIndex
        });
      }

      // Extract from worked example check if present
      if (step.t === 'worked' && step.we) {
        const weKey = typeof step.we === 'string' ? step.we.replace(/^WE\./, '') : null;
        const weItem = weKey ? weMap[weKey] : (typeof step.we === 'object' ? step.we : null);
        if (weItem && weItem.check && weItem.check.opts) {
          const check = weItem.check;
          const prompt = check.text || check.prompt || `Worked Example Check: ${weItem.title || nodeTitle}`;
          const normalizedOptions = [];
          let answerIndex = 0;

          (check.opts || []).forEach((opt, optIdx) => {
            const isCorrect = Boolean(opt.c ?? opt.correct);
            if (isCorrect) answerIndex = optIdx;
            normalizedOptions.push({
              text: opt.t || opt.text || String(opt),
              correct: isCorrect,
              feedback: opt.m || (isCorrect ? 'Correct!' : 'Check your steps.'),
              misconceptionId: isCorrect ? null : (opt.misconceptionId || `misc_we_${nodeId}_${optIdx}`)
            });
          });

          if (normalizedOptions.length >= 2) {
            questions.push({
              id: check.question_id || `q_we_${nodeId}_${sIdx + 1}`,
              nodeId,
              prompt,
              options: normalizedOptions,
              answerIndex
            });
          }
        }
      }
    });

    if (!objective) objective = `Understand and reason through ${nodeTitle}`;
    if (!explanation) explanation = `Comprehensive learning on ${nodeTitle}. Practice to master this concept.`;
    if (!visualSpec) {
      visualSpec = {
        type: 'diagram',
        total: 5,
        shaded: 2,
        interactive: true,
        text: `Interactive model for ${nodeTitle}`
      };
    }

    const dependencies = Array.isArray(node.dependencies)
      ? node.dependencies
      : (nodeIdx > 0 ? [rawNodes[nodeIdx - 1].id || `node_${nodeIdx}`] : []);

    nodes.push({
      id: nodeId,
      title: nodeTitle,
      objective,
      concept: node.concept || nodeTitle,
      explanation,
      dependencies,
      visual: visualSpec
    });
  });

  // Guarantee at least 1 question per node so TEAS assessment can run
  nodes.forEach((n, idx) => {
    const hasQ = questions.some(q => q.nodeId === n.id);
    if (!hasQ) {
      questions.push({
        id: `q_auto_${n.id}_1`,
        nodeId: n.id,
        prompt: `Which statement accurately describes ${n.title}?`,
        options: [
          {
            text: n.concept || `Core principle of ${n.title}`,
            correct: true,
            feedback: 'Correct! You identified the key concept.',
            misconceptionId: null
          },
          {
            text: `An inaccurate rule that violates the principles of ${n.title}`,
            correct: false,
            feedback: 'Review the concept explanation carefully.',
            misconceptionId: `misc_auto_${n.id}_distractor`
          }
        ],
        answerIndex: 0
      });
    }
  });

  const adapted = {
    schemaVersion: 1,
    id,
    title: rawTitle,
    grade,
    subject,
    language: standaloneDef.language || 'hi-en',
    nodes,
    questions,
    standaloneHtml: standaloneDef.htmlUrl || standaloneDef.standaloneHtml || null,
    isBridged: true
  };

  return validateChapter(adapted);
}

/**
 * Standardized Standalone Chapter Adapter implementing AashaExperienceContract.
 * Enables mounting standalone chapter HTMLs or interactive containers into
 * apps/learner-web with bidirectional telemetry event bridging.
 */
export class StandaloneChapterAdapter extends AashaExperienceAdapter {
  constructor(options = {}) {
    super({
      foundationId: options.foundationId || 'AASHA_STANDALONE',
      foundationName: options.title || 'Standalone Chapter',
      experienceId: options.id || 'standalone_chapter'
    });
    this.chapterId = options.id || 'chapter';
    this.title = options.title || 'Standalone Chapter';
    this.htmlUrl = options.htmlUrl || null;
    this.onEvent = options.onEvent || (() => {});
    this.iframe = null;
    this._messageHandler = null;
  }

  mount(container, config = {}) {
    if (!container) throw new Error('Target container required for mount()');
    this.container = container;
    this.config = config;

    container.innerHTML = '';
    if (typeof document !== 'undefined') {
      const wrapper = document.createElement('div');
      wrapper.className = 'standalone-experience-frame';
      wrapper.style.cssText = 'position: relative; width: 100%; max-width: 480px; margin: 0 auto; min-height: 520px; border-radius: 16px; overflow: hidden; background: #ffffff; box-shadow: 0 4px 16px rgba(0,0,0,0.08);';

      if (this.htmlUrl) {
        this.iframe = document.createElement('iframe');
        this.iframe.src = this.htmlUrl;
        this.iframe.style.cssText = 'width: 100%; height: 600px; border: none; display: block;';
        this.iframe.title = this.title;
        this.iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');

        wrapper.appendChild(this.iframe);

        // Listen for postMessage from standalone chapter
        this._messageHandler = (e) => {
          if (e.source !== this.iframe?.contentWindow) return;
          const data = e.data;
          if (data && typeof data === 'object') {
            const type = data.type || data.eventType || 'aasha:telemetry';
            const payload = data.payload || data.detail || data;
            this.emitTelemetry(type, payload);
            this.onEvent(type, payload);
            if (payload.coins || payload.tokens) {
              this.state.coins = (this.state.coins || 0) + Number(payload.coins || payload.tokens);
            }
            if (payload.xp) {
              this.state.xp = (this.state.xp || 0) + Number(payload.xp);
            }
          }
        };
        if (typeof window !== 'undefined') {
          window.addEventListener('message', this._messageHandler);
        }
      } else {
        wrapper.innerHTML = `
          <div style="padding: 24px; text-align: center;">
            <h2 style="color: #1e3a5f;">${this.title}</h2>
            <p style="color: #64748b; font-size: 0.95rem;">Standalone interactive experience mounted via AashaExperienceContract.</p>
            <div id="simStage" style="margin: 20px 0;"></div>
          </div>
        `;
      }
      container.appendChild(wrapper);
    } else {
      container.innerHTML = `<div class="standalone-experience-frame">${this.title}</div>`;
    }

    return { id: this.chapterId, mounted: true };
  }

  getState() {
    return {
      id: this.chapterId,
      title: this.title,
      ...this.state
    };
  }

  reset() {
    this.state = { coins: 0, xp: 0, progress: 0 };
    if (this.iframe) {
      try {
        this.iframe.contentWindow?.postMessage({ action: 'reset' }, '*');
      } catch {}
    }
  }

  destroy() {
    if (this._messageHandler) {
      window.removeEventListener('message', this._messageHandler);
      this._messageHandler = null;
    }
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
    this.iframe = null;
  }
}

/**
 * Pre-defined Standalone Class 8 Rational Numbers Specification
 * derived from RationalNumbers_Class8_Gamified_v5_Enhanced_v6.html
 */
export const rationalNumbersStandaloneDef = {
  id: 'math8-rational-numbers',
  title: 'Rational Numbers — Properties & Operations',
  grade: 8,
  subject: 'Mathematics',
  language: 'hi-en',
  htmlUrl: '/chapters/RationalNumbers_Class8_Gamified_v5_Enhanced_v6.html',
  WM: {
    "rational": "परिमेय (रैशनल)",
    "inverse": "व्युत्क्रम (इन्वर्स)",
    "reciprocal": "प्रतिलोम (रिसिप्रोकल)",
    "commutative": "क्रमविनिमेय",
    "associative": "सहचारी",
    "distributive": "वितरण नियम"
  },
  CONN: {
    "because": "क्योंकि (बिकॉज़)",
    "therefore": "इसलिए (देयरफोर)",
    "however": "हालांकि (हाउएवर)",
    "which means": "जिसका अर्थ है (विच मीन्स)"
  },
  NODES: [
    {
      id: "node_g8_m1_c1",
      title: "Properties of Rational Numbers (परिमेय संख्याएँ)",
      steps: [
        {
          t: "intro",
          text: "A number that can be written in p/q form (where q ≠ 0) is a Rational Number."
        },
        {
          t: "text",
          title: "Closure & Identities",
          content: "Rational numbers are closed under addition, subtraction, and multiplication. The additive identity is 0 and multiplicative identity is 1."
        },
        {
          t: "quiz",
          q: {
            question_id: "q_g8_m1_1",
            text: "What is the additive inverse of 2/8?",
            opts: [
              { c: true, t: "-2/8", m: "Correct! 2/8 + (-2/8) = 0." },
              { c: false, t: "8/2", m: "8/2 is the multiplicative inverse (reciprocal)." },
              { c: false, t: "2/8", m: "2/8 is the original number; additive inverse must sum to 0." },
              { c: false, t: "0", m: "0 is the additive identity, not the inverse of 2/8." }
            ]
          }
        }
      ]
    },
    {
      id: "node_g8_m1_c2",
      title: "Multiplicative Inverses & Zero Exclusion",
      steps: [
        {
          t: "intro",
          text: "The multiplicative inverse (or reciprocal) of a rational number a/b is b/a, because (a/b) × (b/a) = 1."
        },
        {
          t: "text",
          title: "The Zero Exception",
          content: "Zero has no reciprocal because division by zero is mathematically undefined. There is no number which multiplied by 0 gives 1."
        },
        {
          t: "quiz",
          q: {
            question_id: "q_g8_m1_2",
            text: "Why does the rational number 0 have no multiplicative inverse?",
            opts: [
              { c: true, t: "Division by zero is undefined (no number times 0 equals 1)", m: "Correct! 0 × x = 0 for any finite number x, so 0 × x = 1 is impossible." },
              { c: false, t: "Because 0 is not a rational number", m: "0 is a rational number since it can be written as 0/1." },
              { c: false, t: "Because negative numbers cannot multiply with zero", m: "Negative numbers can multiply with 0; the product is always 0." },
              { c: false, t: "Because 0 already equals 1", m: "0 does not equal 1." }
            ]
          }
        }
      ]
    },
    {
      id: "node_g8_m1_c3",
      title: "Algebraic Properties & Distributivity",
      steps: [
        {
          t: "intro",
          text: "Commutative and Associative properties permit regrouping compatible partners first to compute long expressions quickly."
        },
        {
          t: "text",
          title: "Non-commutative Operations & Distributive Rule",
          content: "Subtraction and division are NOT commutative. Distributivity connects multiplication over addition: a(b + c) = ab + ac."
        },
        {
          t: "quiz",
          q: {
            question_id: "q_g8_m1_3",
            text: "Which arithmetic operation is NOT commutative for rational numbers?",
            opts: [
              { c: true, t: "Subtraction (a - b ≠ b - a in general)", m: "Correct! Order matters in subtraction." },
              { c: false, t: "Addition", m: "Addition is commutative: a + b = b + a." },
              { c: false, t: "Multiplication", m: "Multiplication is commutative: a × b = b × a." },
              { c: false, t: "Both addition and multiplication", m: "Both addition and multiplication are commutative." }
            ]
          }
        }
      ]
    }
  ]
};

/**
 * Pre-defined Standalone Class 8 Algebraic Expressions Specification
 * derived from AlgebraicExpressions_Class8_Gamified_v5.html
 */
export const algebraicExpressionsStandaloneDef = {
  id: 'math8-algebraic-expressions',
  title: 'Algebraic Expressions — Terms & Operations',
  grade: 8,
  subject: 'Mathematics',
  language: 'hi-en',
  htmlUrl: '/chapters/AlgebraicExpressions_Class8_Gamified_v5_Enhanced_v6.html',
  WM: {
    "algebraic": "बीजीय (अलजेब्राइक)",
    "expression": "व्यंजक (एक्सप्रेशन)",
    "term": "पद (टर्म)",
    "coefficient": "गुणांक (कोएफिशिएंट)",
    "variable": "चर राशि (वैरिएबल)",
    "monomial": "एकपदी (मोनोमियल)"
  },
  CONN: {
    "for example": "उदाहरण के लिए (फॉर एग्ज़ैम्पल)",
    "in contrast": "इसके विपरीत (इन कॉन्ट्रास्ट)"
  },
  NODES: [
    {
      id: "node_alg_1",
      title: "Terms, Factors & Coefficients",
      steps: [
        {
          t: "intro",
          text: "Expressions are formed from variables and constants using arithmetic operations. Terms are added together to make an expression."
        },
        {
          t: "text",
          title: "Numerical Coefficients",
          content: "In a term like 7xy, 7 is the numerical coefficient, while x and y are the variable factors."
        },
        {
          t: "quiz",
          q: {
            question_id: "q_alg_1",
            text: "In the expression 4x² - 3xy, what is the coefficient of xy?",
            opts: [
              { c: true, t: "-3", m: "Correct! The negative sign is part of the coefficient." },
              { c: false, t: "3", m: "Remember to include the negative sign with the term." },
              { c: false, t: "4", m: "4 is the coefficient of x², not xy." },
              { c: false, t: "-3x", m: "The numerical coefficient is the pure number part, -3." }
            ]
          }
        }
      ]
    },
    {
      id: "node_alg_2",
      title: "Like and Unlike Terms",
      steps: [
        {
          t: "intro",
          text: "Terms having the exact same algebraic factors are Like Terms. Only like terms can be directly added or subtracted."
        },
        {
          t: "text",
          title: "Identifying Like Terms",
          content: "7x and 14x are like terms. 7x and 7y are unlike terms because their variable factors differ."
        },
        {
          t: "quiz",
          q: {
            question_id: "q_alg_2",
            text: "Which of the following pairs contains like terms?",
            opts: [
              { c: true, t: "7x and -5x", m: "Correct! Both terms have the exact same variable factor x." },
              { c: false, t: "7x and 7y", m: "Variables are different (x vs y)." },
              { c: false, t: "7x and 7x²", m: "Powers differ (x vs x²); they are unlike terms." },
              { c: false, t: "xy and x²y", m: "Powers of x differ; they cannot be added directly." }
            ]
          }
        }
      ]
    },
    {
      id: "node_alg_3",
      title: "Addition & Subtraction of Expressions",
      steps: [
        {
          t: "intro",
          text: "To add or subtract polynomials, group like terms together and add their numerical coefficients."
        },
        {
          t: "text",
          title: "Combining Like Terms",
          content: "(7x + 5) + (3x - 2) = (7x + 3x) + (5 - 2) = 10x + 3."
        },
        {
          t: "quiz",
          q: {
            question_id: "q_alg_3",
            text: "Simplify: (5x + 3) + (2x - 1)",
            opts: [
              { c: true, t: "7x + 2", m: "Correct! 5x + 2x = 7x, and 3 - 1 = 2." },
              { c: false, t: "7x + 4", m: "Check the constant terms: 3 + (-1) = 2, not 4." },
              { c: false, t: "10x + 2", m: "We add the coefficients 5 + 2 = 7, not multiply." },
              { c: false, t: "9x", m: "You cannot combine 7x and 2 into a single term." }
            ]
          }
        }
      ]
    }
  ]
};

/**
 * Universal Chapter Registry managing all standardized and bridged chapters.
 */
export class ChapterRegistry {
  constructor() {
    this.chapters = new Map();
    this.activeId = null;
    this.listeners = new Set();

    // Register built-in monorepo content
    this.register(fractionsChapter);
    this.register(perimeterChapter);

    // Register adapted standalone chapters
    this.register(rationalNumbersStandaloneDef);
    this.register(algebraicExpressionsStandaloneDef);

    this.activeId = fractionsChapter.id;
  }

  register(chapterOrDef) {
    if (!chapterOrDef || typeof chapterOrDef !== 'object') {
      throw new Error('Valid chapter or standalone definition required');
    }

    let normalized;
    if (Array.isArray(chapterOrDef.NODES) || (Array.isArray(chapterOrDef.nodes) && !chapterOrDef.questions)) {
      normalized = adaptStandaloneChapter(chapterOrDef);
    } else {
      normalized = validateChapter(chapterOrDef);
    }

    this.chapters.set(normalized.id, normalized);
    this._notify();
    return normalized;
  }

  get(id) {
    return this.chapters.get(id) || null;
  }

  list() {
    return Array.from(this.chapters.values()).map(c => ({
      id: c.id,
      title: c.title,
      grade: c.grade,
      subject: c.subject,
      stage: c.stage,
      nodeCount: c.nodes.length,
      questionCount: c.questions.length,
      isBridged: Boolean(c.isBridged),
      standaloneHtml: c.standaloneHtml || null
    }));
  }

  setActive(id) {
    if (!this.chapters.has(id)) {
      throw new Error(`Chapter not found: ${id}`);
    }
    this.activeId = id;
    this._notify();
    return this.chapters.get(id);
  }

  getActive() {
    return this.chapters.get(this.activeId) || this.chapters.values().next().value;
  }

  subscribe(listener) {
    if (typeof listener === 'function') {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }
    return () => {};
  }

  async loadFromUrl(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load chapter from ${url}: ${res.statusText}`);
    const data = await res.json();
    return this.register(data);
  }

  _notify() {
    for (const fn of this.listeners) {
      try { fn(this.getActive()); } catch {}
    }
  }
}

export const chapterRegistry = new ChapterRegistry();
