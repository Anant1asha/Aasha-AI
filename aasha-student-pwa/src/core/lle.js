/**
 * Annanth Aasha Foundation - Bilingual Vernacular Substrate (LLE Engine)
 * Version: 2.1.0
 * 
 * Enforces Pre-LLE Math Insulation Invariant and provides
 * interactive word-tap vocabulary lookups (Hindi focus) and connectives.
 */

// Core connective words dictionary (Section 15 of AASHA Universal Teaching Language)
export const CONNECTIVE_WORDS = {
  "because": "क्योंकि",
  "therefore": "इसलिए",
  "however": "हालाँकि",
  "if": "यदि / अगर",
  "then": "तो",
  "but": "लेकिन / परन्तु",
  "so": "इसलिए",
  "since": "चूँकि",
  "although": "यद्यपि",
  "whereas": "जबकि",
  "which means": "जिसका अर्थ है",
  "in order to": "के लिए",
  "as a result": "परिणामस्वरूप",
  "for example": "उदाहरण के लिए",
  "notice that": "ध्यान दें कि"
};

// Foundational vocabulary bank for STEM & curriculum concepts
export const VOCABULARY_BANK = {
  "fraction": "अंश (पूर्ण वस्तु का एक भाग)",
  "fractions": "अंश (विभिन्न भाग)",
  "numerator": "अंश संख्या (ऊपर की संख्या, चुने गए भाग)",
  "denominator": "हर (नीचे की संख्या, कुल बराबर भाग)",
  "whole": "पूर्ण / समूचा",
  "equal": "बराबर / समान",
  "parts": "भाग / हिस्से",
  "equivalent": "समतुल्य (समान मान वाला)",
  "quantity": "मात्रा",
  "represent": "दर्शाना / प्रदर्शित करना",
  "rational": "परिमेय (p/q के रूप में व्यक्त संख्या)",
  "number": "संख्या",
  "numbers": "संख्याएँ",
  "positive": "धनात्मक (+)",
  "negative": "ऋणात्मक (−)",
  "integer": "पूर्णांक",
  "integers": "पूर्णांक",
  "density": "सघनता (दो संख्याओं के बीच अनन्त संख्याएँ होना)",
  "property": "गुणधर्म / नियम",
  "commutative": "क्रमविनिमेय नियम (क्रम बदलने पर परिणाम समान)",
  "associative": "सहचारिता नियम (समूह बदलने पर परिणाम समान)",
  "distributive": "वितरण नियम",
  "circuit": "विद्युत परिपथ (धारा बहने का बंद मार्ग)",
  "current": "विद्युत धारा (इलेक्ट्रॉनों का प्रवाह)",
  "battery": "बैटरी / विद्युत सेल (ऊर्जा स्रोत)",
  "switch": "स्विच / कुंजी (परिपथ चालू या बंद करने वाला)",
  "conductor": "सुचालक (जिसमें विद्युत धारा आसानी से बहती है)",
  "conductors": "सुचालक पदार्थ",
  "insulator": "कुचालक (जिसमें विद्युत धारा नहीं बह सकती)",
  "insulators": "कुचालक पदार्थ",
  "filament": "फिलामेंट (बल्ब का पतला तार)",
  "closed": "बंद (पूरा परिपथ)",
  "open": "खुला (टूटा हुआ परिपथ)",
  "copper": "तांबा (उत्तम सुचालक)",
  "rubber": "रबर (कुचालक)",
  "iron": "लोहा (सुचालक)",
  "wood": "लकड़ी (कुचालक)",
  "expression": "बीजीय व्यंजक",
  "expressions": "व्यंजक",
  "variable": "चर (अज्ञात राशि, जैसे x, y)",
  "constant": "अचर (निश्चित संख्या)",
  "term": "पद",
  "terms": "पद",
  "coefficient": "गुणांक (चर के साथ गुणा होने वाली संख्या)",
  "identity": "सर्वसमिका (सभी मानों के लिए सत्य समीकरण)",
  "area": "क्षेत्रफल (सतह का विस्तार)",
  "perimeter": "परिमाप (चारों ओर की सीमा की कुल लंबाई)"
};

/**
 * Pre-LLE Math Insulation: Shield LaTeX and math formulas before wrapping text
 */
export function shieldMath(text) {
  const placeholders = [];
  let counter = 0;

  // Protect \( ... \), $$ ... $$, and $ ... $
  const shielded = text
    .replace(/\\\(.*?\\\)/g, (match) => {
      const ph = `__AASHA_MATH_${counter++}__`;
      placeholders.push({ placeholder: ph, original: `<span class="math-var" data-math="true">${match}</span>` });
      return ph;
    })
    .replace(/\$\$.*?\$\$/g, (match) => {
      const ph = `__AASHA_MATH_${counter++}__`;
      placeholders.push({ placeholder: ph, original: `<span class="math-var" data-math="true">${match}</span>` });
      return ph;
    })
    .replace(/\$([^\$]+)\$/g, (match) => {
      const ph = `__AASHA_MATH_${counter++}__`;
      placeholders.push({ placeholder: ph, original: `<span class="math-var" data-math="true">${match}</span>` });
      return ph;
    });

  return { shielded, placeholders };
}

export function unshieldMath(html, placeholders) {
  let result = html;
  placeholders.forEach(({ placeholder, original }) => {
    result = result.replace(placeholder, original);
  });
  return result;
}

/**
 * Universal Bilingual Formatter (rt)
 * Transforms plain explanation text into interactive, bilingual-annotated HTML.
 */
export function rt(text, options = {}) {
  if (!text) return '';
  const lang = options.language || 'en';
  const customWords = options.customWords || {};
  const isSmall = options.isSmall || false;
  const mergedWords = { ...VOCABULARY_BANK, ...customWords };

  // Step 1: Pre-LLE Math Insulation
  const { shielded, placeholders } = shieldMath(text);

  // Format fractions like 1/2 or 3/5
  let html = shielded.replace(/(\b\d+)\/(\d+\b)/g, '<span class="frac"><span class="frac-top">$1</span><span class="frac-bot">$2</span></span>');

  // Sort connectives by length descending to match phrases first
  const connKeys = Object.keys(CONNECTIVE_WORDS).sort((a, b) => b.length - a.length);
  for (const conn of connKeys) {
    const regex = new RegExp(`\\b(${conn})\\b`, 'gi');
    const hi = CONNECTIVE_WORDS[conn];
    html = html.replace(regex, (match) => {
      return `<span class="connective" data-w="${match.toLowerCase()}" data-h="${hi}" title="${hi}">${match}</span>`;
    });
  }

  // Tokenize words for vocabulary tap
  const wordKeys = Object.keys(mergedWords).sort((a, b) => b.length - a.length);
  for (const word of wordKeys) {
    const regex = new RegExp(`\\b(${word})\\b`, 'gi');
    const hi = mergedWords[word];
    html = html.replace(regex, (match) => {
      return `<span class="word" data-w="${match.toLowerCase()}" data-h="${hi}" title="${hi}">${match}</span>`;
    });
  }

  // Step 2: Unshield insulated math
  const unshielded = unshieldMath(html, placeholders);
  const cls = isSmall ? 'lle-text-sm' : 'lle-text';
  return `<div class="${cls}">${unshielded}</div>`;
}

/**
 * Attach global word tap listener to show modal dialog
 */
export function setupWordDialogListener(dialogId = 'wordDialog') {
  if (typeof document === 'undefined') return;

  document.addEventListener('click', (e) => {
    const wordEl = e.target.closest('.word, .connective');
    if (!wordEl) return;

    const w = wordEl.getAttribute('data-w') || '';
    const h = wordEl.getAttribute('data-h') || 'हिंदी अर्थ उपलब्ध नहीं';
    const isConn = wordEl.classList.contains('connective');

    const dlg = document.getElementById(dialogId);
    if (!dlg) return;

    const wordSlot = dlg.querySelector('#dlgWord');
    const hindiSlot = dlg.querySelector('#dlgHindi');
    const descSlot = dlg.querySelector('#dlgDesc');

    if (wordSlot) wordSlot.textContent = w.toUpperCase();
    if (hindiSlot) hindiSlot.textContent = h;
    if (descSlot) descSlot.textContent = isConn ? 'संयोजक शब्द (Connecting Word)' : 'शब्दावली अर्थ (Key Concept Vocabulary)';

    if (typeof dlg.showModal === 'function') {
      dlg.showModal();
    }
  });
}
