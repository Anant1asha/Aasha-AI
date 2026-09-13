# AASHA AIOS — Teacher HIL Proposal & Pedagogical Review
**Chapter**: Class 7 Mathematics — Algebraic Expressions (`c7_math_algebraic_expressions`)  
**Target Board/Curriculum**: NCERT / CBSE Class 7 Mathematics Chapter 12  
**Foundation Match**: Foundation F01: Escape Run (Balance Scale Manipulative) — MIT License (Extract Strategy)  
**Status**: BETA Vertical Slice Verified (Dual-Benchmark Passed)  

---

## 1. शिक्षक के लिए सारांश (Hindi Summary for Educators)

आदरणीय शिक्षक महोदय / महोदया,

यह अध्याय **कक्षा 7 गणित: बीजीय व्यंजक (Algebraic Expressions)** का इंटरएक्टिव और अनुभवात्मक डिजिटल पाठ है। इसे ग्रामीण एवं अर्ध-शहरी विद्यालयों के 2G/3G नेटवर्क और 4GB रैम वाले सामान्य स्मार्टफोन्स को ध्यान में रखकर तैयार किया गया है।

### मुख्य बिंदु:
1. **अवधारणात्मक समझ (Conceptual Grounding)**:
   - छात्र पहले 'चर' (Variable) और 'अचर' (Constant) के वास्तविक अंतर को समझते हैं।
   - वे देखते हैं कि कैसे पद (Terms) गुणांकों और चरों के गुणनफल होते हैं, और कैसे समान पदों (Like Terms) को तराजू (Balance Scale) पर तौलकर जोड़ा या घटाया जा सकता है।
2. **इंटरएक्टिव तराजू सिमुलेशन (F01 Balance Scale Manipulative)**:
   - छात्र स्वयं तराजू के दोनों पलड़ों में \(x\) और संख्यात्मक ब्लॉक रखकर समीकरण/व्यंजक को संतुलित करते हैं।
   - इससे छात्रों में यह भ्रांति दूर होती है कि \(2x + 4 = 6x\)। वे दृश्य रूप से देखते हैं कि चर पद और अचर पद अलग-अलग ब्लॉक होते हैं और उन्हें सीधे नहीं जोड़ा जा सकता।
3. **द्विभाषी सहायता (Bilingual Word-Tap Assistance)**:
   - पाठ में किसी भी कठिन तकनीकी शब्द (जैसे *Algebraic Expression*, *Coefficient*, *Like Terms*) पर टैप करते ही उसका शुद्ध एवं सरल हिंदी अर्थ और व्याख्या तुरंत पॉपअप के रूप में दिखाई देती है।
4. **4-स्तरीय संकेत प्रणाली (4-Tier Progressive Scaffolding)**:
   - प्रश्नों में सीधे उत्तर कभी नहीं बताया जाता।
   - छात्र को क्रमशः 4 संकेत मिलते हैं: ध्यानाकर्षण (H1: Hook) \(\to\) अवधारणा संबंध (H2: Concept) \(\to\) सूत्र/विधि (H3: Strategy) \(\to\) मध्यवर्ती गणना (H4: Intermediate Step)।
5. **शून्य-डेटा खपत (Offline-First)**:
   - यह पूरा पाठ 56 KB की एकल HTML5 फ़ाइल में समाहित है। एक बार लोड होने के बाद इसे बिना इंटरनेट के पूर्ण रूप से चलाया जा सकता है।

---

## 2. Four-Pillar Pedagogical Audit

| Pillar | Implementation Verification | Pedagogical Objective |
| :--- | :--- | :--- |
| **Pillar 1: Mathematical Truth & Misconception Diagnostics** | 3 verified misconceptions bound to specific distractors with zero spoiler leaks (Passes L-Truth 100/100). | Detects when students mistakenly combine unequal powers (e.g. \(x^2 + x\)) or add unlike terms (\(3x + 4 \to 7x\)). |
| **Pillar 2: Experiential Manipulative Grounding** | `<aasha-sim>` Web Component running synchronous F01 Balance Scale manipulative with real-time feedback. | Converts abstract symbolic algebra into tangible physical weights, reinforcing equivalence and conservation. |
| **Pillar 3: Progressive Scaffolding (Zone of Proximal Development)** | 4-tier non-spoiler hints (H1 Hook, H2 Concept, H3 Strategy, H4 Step) dynamically unlocked per question. | Encourages productive struggle and self-directed problem solving without spoon-feeding answers. |
| **Pillar 4: Linguistic & Cognitive Accessibility** | Bilingual Indic substrate (`window.WM` Hindi word-map) with mathematical formula insulation (`__AASHA_MATH_X__`). | Bridges English-medium instruction barriers for vernacular-medium and bilingual rural students. |

---

## 3. Curriculum & Foundation Reuse Mapping

- **Subject**: Mathematics
- **Class**: Grade 7
- **Chapter**: Algebraic Expressions (NCERT Chapter 12)
- **Extracted Concepts**:
  1. `cpt:algebraic_expression`: Structure of expressions, variables, constants, and operators.
  2. `cpt:terms_and_factors`: Tree breakdown of algebraic expressions into terms and factors.
  3. `cpt:like_and_unlike_terms`: Identifying terms with identical algebraic factors.
- **Bound Foundation**: `F01: Escape Run` (Balance Scale Engine)
  - **Strategy**: `EXTRACT` (Mathematical balance model and SVG weight blocks reused under MIT license).
  - **Isolation**: Wrapped inside universal `AashaExperienceContract` (`mount`, `getState`, `reset`, `destroy`, `telemetry`).
- **Assessment Structure**:
  - **Warm-up (Tier 1)**: 3 Foundational identification questions.
  - **Deep Dive (Tier 2)**: 3 Term simplification and coefficient extraction questions.
  - **Boss Challenge (Tier 3)**: 3 Multi-step equivalence and word-problem challenges.

---

## 4. Verification Evidence & Artifact Manifest

- **Compiled Chapter Package**: `Aasha-AI/chapters/AlgebraicExpressions_Class7_BETA_v6.html` (56,570 bytes, 100% offline).
- **Canonical IR Specification**: `Aasha-AI/chapters/AlgebraicExpressions_Class7_BETA_canonical_ir.json`.
- **L-Truth Benchmark Certification**: Score **100/100** (0 spoilers, 0 math collisions, 0 rule violations).
- **Chrome CDP Automated Verification**:
  - Viewport Overflows: 16:9 (0px), 19.5:9 (0px), 20:9 (0px).
  - Console Errors: 0.
  - Screenshots Captured: 6 verified milestone PNGs in agent artifact repository.
