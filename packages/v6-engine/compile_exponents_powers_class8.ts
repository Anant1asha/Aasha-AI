import * as fs from 'fs';
import * as path from 'path';
import { IRAssembler, AgentProposalsInput } from '../canonical-ir/ir_assembler';
import { validateCanonicalIR, type SourceInventoryItem } from '../canonical-ir/canonical_ir_schema';
import { V6Compiler } from './v6_compiler';

type PrebuiltWarmupQuestion = {
  tag: string;
  prompt: string;
  opts: Array<{ text: string; correct: boolean; m: string }>;
  hints?: { h1: string; h2: string; h3: string; h4: string };
};
type HindiWarmupAdaptation = {
  prompt: string;
  hints: [string, string, string, string];
  distractorExplanations: [string, string, string, string];
  options?: [string, string, string, string];
};
type AssessmentAdaptationArgs = [
  objective_index: number,
  concept_name: string,
  hints: [string, string, string, string],
  distractorExplanations: [string, string, string, string],
  hindi: HindiWarmupAdaptation,
];
const prebuiltWarmupQuestions = (require('../../scripts/exponents_warmup_data.js') as {
  WARMUP_QUESTIONS: PrebuiltWarmupQuestion[];
}).WARMUP_QUESTIONS;
const prebuiltBossQuestions = (require('../../scripts/exponents_boss_data.js') as {
  BOSS_QUESTIONS: PrebuiltWarmupQuestion[];
}).BOSS_QUESTIONS;
const prebuiltDeepDiveQuestions = (require('../../scripts/exponents_deepdive_data.js') as {
  DEEPDIVE_QUESTIONS: PrebuiltWarmupQuestion[];
}).DEEPDIVE_QUESTIONS;
const prebuiltWarmupByTag = new Map(prebuiltWarmupQuestions.map((question) => [question.tag, question]));
const prebuiltBossByTag = new Map(prebuiltBossQuestions.map((question) => [question.tag, question]));
const prebuiltDeepDiveByTag = new Map(prebuiltDeepDiveQuestions.map((question) => [question.tag, question]));
function adaptPrebuiltQuestion(
  question: PrebuiltWarmupQuestion,
  objective_index: number,
  concept_name: string,
  hints: [string, string, string, string],
  distractorExplanations: [string, string, string, string],
  hindi: HindiWarmupAdaptation,
) {
  return {
    objective_index,
    concept_name,
    question_type: 'mcq',
    prompt: question.prompt,
    prompt_hindi: hindi.prompt,
    options: question.opts.map((option, index) => ({
      text: option.text,
      text_hindi: hindi.options?.[index] || option.text,
      is_correct: option.correct,
      distractor_explanation: option.correct ? 'Correct choice.' : distractorExplanations[index],
      distractor_explanation_hindi: option.correct ? 'सही विकल्प।' : hindi.distractorExplanations[index],
    })),
    hints: { H1: hints[0], H2: hints[1], H3: hints[2], H4: hints[3] },
    hints_hindi: { H1: hindi.hints[0], H2: hindi.hints[1], H3: hindi.hints[2], H4: hindi.hints[3] },
  };
}
function adaptPrebuiltWarmup(tag: string, ...args: AssessmentAdaptationArgs) {
  const question = prebuiltWarmupByTag.get(tag);
  if (!question) throw new Error(`Missing prebuilt assessment resource '${tag}'`);
  return adaptPrebuiltQuestion(question, ...args);
}
function adaptPrebuiltBoss(tag: string, ...args: AssessmentAdaptationArgs) {
  const question = prebuiltBossByTag.get(tag);
  if (!question) throw new Error(`Missing prebuilt assessment resource '${tag}'`);
  return adaptPrebuiltQuestion(question, ...args);
}
function adaptPrebuiltDeepDive(tag: string, objectiveIndex: number, conceptName: string, hindi: HindiWarmupAdaptation) {
  const question = prebuiltDeepDiveByTag.get(tag);
  if (!question) throw new Error(`Missing prebuilt assessment resource '${tag}'`);
  if (!question.hints) throw new Error(`Prebuilt assessment resource '${tag}' is missing its four English hints`);
  const hints: AssessmentAdaptationArgs[2] = [question.hints.h1, question.hints.h2, question.hints.h3, question.hints.h4];
  const distractorExplanations: AssessmentAdaptationArgs[3] = question.opts.map((option) =>
    option.correct ? 'Correct choice.' : option.m
      .replace(/\bresult is\b/gi, 'the result equals')
      .replace(/\binstead of\b/gi, 'rather than')
      .replace(/\bshould be\b/gi, 'should remain')
      .replace(/\b(is|giving|becomes|yielding)\b/gi, 'remains')
      .replace(/\bto get\b/gi, 'for'),
  ) as AssessmentAdaptationArgs[3];
  return adaptPrebuiltQuestion(question, objectiveIndex, conceptName, hints, distractorExplanations, hindi);
}
const additionalWarmupAssessments: AgentProposalsInput['raw_assessments'] = [
  adaptPrebuiltWarmup('Warm Up Q1(c)', 0, 'Exponential Notation and Sign Rules', [
    'Check whether the exponent is odd or even before calculating.',
    'Raise the magnitude of the numerator and denominator separately.',
    'Keep track of the negative sign while applying the power to each part.',
    'Use repeated multiplication to finish each power, then form the fraction.',
  ], [
    'Correct choice.',
    'Sign parity was not tracked while raising a negative rational base to an odd exponent.',
    'The numerator and denominator were scaled linearly; exponentiation requires repeated factors.',
    'The fraction was reversed even though the base has no negative exponent.',
  ], {
    prompt: 'घात का मान ज्ञात कीजिए: \\((-\\frac{5}{3})^5\\)',
    hints: [
      'गणना से पहले जाँचें कि घात विषम है या सम।',
      'अंश और हर पर अलग-अलग घात लगाएँ।',
      'ऋणात्मक आधार की घात में चिह्न का ध्यान रखें।',
      'बार-बार गुणा करके दोनों घात निकालें, फिर भिन्न लिखें।',
    ],
    distractorExplanations: [
      'सही विकल्प।',
      'विषम घात के लिए ऋणात्मक परिमेय आधार का चिह्न सही तरह नहीं रखा गया।',
      'अंश और हर को सीधे पाँच से गुणा किया गया; यहाँ बार-बार गुणा करना है।',
      'भिन्न को उलट दिया गया, जबकि आधार पर ऋणात्मक घात नहीं है।',
    ],
  }),
  adaptPrebuiltWarmup('Warm Up Q1(d)', 0, 'Exponential Notation and Sign Rules', [
    'Notice that the exponent is even.',
    'Apply the exponent to the numerator and denominator separately.',
    'Pair negative factors to determine the sign of the result.',
    'Square the numerator and denominator powers in stages before simplifying.',
  ], [
    'Correct choice.',
    'Negative factors were left unpaired despite the even exponent.',
    'The exponent was multiplied by the base rather than counting its repeated factors.',
    'Only three factors were counted; the exponent requires four.',
  ], {
    prompt: 'घात का मान ज्ञात कीजिए: \\((-\\frac{7}{11})^4\\)',
    hints: [
      'ध्यान दें कि घात सम संख्या है।',
      'अंश और हर पर अलग-अलग घात लगाएँ।',
      'ऋणात्मक गुणनखंडों के जोड़े बनाकर चिह्न तय करें।',
      'सरल करने से पहले अंश और हर की घात को चरणों में निकालें।',
    ],
    distractorExplanations: [
      'सही विकल्प।',
      'सम घात होने पर भी ऋणात्मक गुणनखंडों को जोड़ों में नहीं रखा गया।',
      'घात को बार-बार गुणा की संख्या मानने के बजाय आधार से गुणा किया गया।',
      'केवल तीन गुणनखंड गिने गए, जबकि घात चार है।',
    ],
  }),
  adaptPrebuiltWarmup('Warm Up Q2(b)', 0, 'Exponential Notation and Sign Rules', [
    'Look for repeated equal factors in the integer.',
    'Test the prime base named in the question.',
    'Divide by that base repeatedly and record how many factors are used.',
    'Check that multiplying the repeated factors reconstructs the given integer.',
  ], [
    'Correct choice.',
    'The proposed exponent counts two factors of thirteen, while the given integer contains three.',
    'The proposed exponent uses four factors of thirteen, exceeding the given integer.',
    'The base seventeen does not divide the given integer into equal prime factors.',
  ], {
    prompt: '2197 को अभाज्य आधार 13 का उपयोग करके घातांक रूप में लिखिए।',
    hints: [
      'पूर्णांक में समान गुणनखंड खोजें।',
      'प्रश्न में दिए गए अभाज्य आधार से भाग देकर देखें।',
      'बार-बार भाग देकर उपयोग किए गए गुणनखंडों की संख्या गिनें।',
      'जाँचे कि समान गुणनखंडों का गुणन करने पर दिया गया पूर्णांक मिलता है।',
    ],
    distractorExplanations: [
      'सही विकल्प।',
      'इस घातांक में तेरह के दो गुणनखंड हैं, जबकि दिए गए पूर्णांक में तीन हैं।',
      'इस घातांक में तेरह के चार गुणनखंड हैं, जो दिए गए पूर्णांक से अधिक हैं।',
      'आधार सत्रह दिए गए पूर्णांक को समान अभाज्य गुणनखंडों में विभाजित नहीं करता।',
    ],
  }),
  adaptPrebuiltWarmup('Warm Up Q2(c)', 0, 'Exponential Notation and Sign Rules', [
    'Build powers of two by repeated doubling.',
    'Start from a nearby known power such as 2^5.',
    'Continue doubling while keeping a count of the exponent.',
    'Verify the count by reversing the doublings from the given number.',
  ], [
    'Correct choice.',
    'The proposed exponent stops before enough doublings have been counted.',
    'The proposed exponent stops one doubling too early.',
    'The proposed exponent counts one doubling beyond the target.',
  ], {
    prompt: '1024 को आधार 2 का उपयोग करके घातांक रूप में लिखिए।',
    hints: [
      'बार-बार दुगुना करके 2 की घातें बनाएँ।',
      '2 की किसी परिचित घात से शुरू करें।',
      'घातांक की गिनती रखते हुए दुगुना करना जारी रखें।',
      'दिए गए पूर्णांक से पीछे की ओर दुगुना करने की जाँच करें।',
    ],
    distractorExplanations: [
      'सही विकल्प।',
      'प्रस्तावित घातांक में आवश्यक दुगुनीकरण से पहले रुक गए।',
      'प्रस्तावित घातांक लक्ष्य से एक दुगुनीकरण पहले रुकता है।',
      'प्रस्तावित घातांक लक्ष्य से एक दुगुनीकरण आगे जाता है।',
    ],
  }),
  adaptPrebuiltWarmup('Warm Up Q6(c)', 2, 'The Five Fundamental Laws of Exponents', [
    'Notice that all three variables carry the same exponent.',
    'Use the product law for equal powers with different bases.',
    'Group the product of the variables inside parentheses.',
    'Keep the shared exponent outside the grouped product.',
  ], [
    'Correct choice.',
    'The exponents were added rather than factored outside the common base product.',
    'Multiplication between the bases was changed into addition.',
    'Parentheses were omitted, leaving the exponent on only the final variable.',
  ], {
    prompt: 'एकल घात के रूप में लिखिए: \\(a^4 \\times b^4 \\times c^4\\)',
    hints: [
      'ध्यान दें कि तीनों चरों पर समान घात है।',
      'अलग-अलग आधारों की समान घातों के गुणन का नियम उपयोग करें।',
      'चरों के गुणनफल को कोष्ठक के भीतर रखें।',
      'समूहित गुणनफल के बाहर समान घात बनाए रखें।',
    ],
    distractorExplanations: [
      'सही विकल्प।',
      'समान आधारों के गुणनफल से घात बाहर निकालने के बजाय घातों को जोड़ा गया।',
      'आधारों के बीच गुणा को जोड़ में बदल दिया गया।',
      'कोष्ठक छूटने से घात केवल अंतिम चर पर लागू हुई।',
    ],
  }),
];
const additionalTextbookMcqAssessments: AgentProposalsInput['raw_assessments'] = [
  adaptPrebuiltBoss('Textbook MCQ 7', 2, 'The Five Fundamental Laws of Exponents', [
    'Evaluate each zero power separately.',
    'A non-zero base raised to zero has the same value in each bracket.',
    'Simplify the first bracket before multiplying.',
    'Use the zero-product property after simplifying the brackets.',
  ], [
    'Correct choice.',
    'The zero-power terms were treated as unequal rather than evaluated individually.',
    'The subtraction sign in the first factor was omitted.',
    'The separate zero powers were combined into a single exponent expression.',
  ], {
    prompt: 'सरल कीजिए: \\((8^0 - 3^0) \\times (8^0 + 3^0)\\)',
    hints: [
      'दोनों शून्य घातों का मान अलग-अलग ज्ञात करें।',
      'शून्य से भिन्न आधार की शून्य घात का मान याद करें।',
      'गुणा करने से पहले पहले कोष्ठक को सरल करें।',
      'कोष्ठकों को सरल करने के बाद शून्य गुणनफल गुण का उपयोग करें।',
    ],
    distractorExplanations: [
      'सही विकल्प।',
      'दोनों शून्य घातों का मान अलग-अलग निकालने पर ध्यान नहीं दिया गया।',
      'पहले गुणनखंड में घटाव का चिह्न छूट गया।',
      'अलग-अलग शून्य घातों को एक ही घातांक व्यंजक मान लिया गया।',
    ],
  }),
  adaptPrebuiltBoss('Textbook MCQ 9', 2, 'The Five Fundamental Laws of Exponents', [
    'Evaluate both zero powers before multiplying.',
    'Compare the values of the two terms inside parentheses.',
    'Simplify the difference before evaluating the square.',
    'Use the zero-product property after simplifying the brackets.',
  ], [
    'Correct choice.',
    'The equal zero-power terms were not evaluated before subtraction.',
    'The exponent was applied after subtracting the bases.',
    'The zero-power rule was confused with a rule that returns one for an entire product.',
  ], {
    prompt: 'सरल कीजिए: \\((3^0 - 4^0) \\times 5^2\\)',
    hints: [
      'पहले 3 और 4 की शून्य घातों का मान निकालें।',
      'कोष्ठक के भीतर दोनों पदों की तुलना करें।',
      'वर्ग निकालने से पहले अंतर को सरल करें।',
      'कोष्ठकों को सरल करने के बाद शून्य गुणनफल गुण का उपयोग करें।',
    ],
    distractorExplanations: [
      'सही विकल्प।',
      'घटाने से पहले समान शून्य घातों का मान नहीं निकाला गया।',
      'घात लगाने से पहले आधारों को घटा दिया गया।',
      'शून्य घात के नियम को पूरे गुणनफल पर लागू कर दिया गया।',
    ],
  }),
  adaptPrebuiltBoss('Textbook MCQ 10', 3, 'Solving Exponential Equations', [
    'Rewrite 1 as a power with base 2.',
    'For equal positive bases, compare the exponents.',
    'Set the exponent on the left equal to zero.',
    'Use the inverse operation to isolate x.',
  ], [
    'Correct choice.',
    'The proposed value leaves the exponent one unit below zero.',
    'The proposed value leaves the exponent two units below zero.',
    'The proposed value leaves the exponent three units below zero.',
  ], {
    prompt: 'घातांकीय समीकरण \\(2^{x-4} = 1\\) में x का मान ज्ञात कीजिए।',
    hints: [
      '1 को आधार 2 की घात के रूप में लिखें।',
      'समान धनात्मक आधारों के लिए घातांकों की तुलना करें।',
      'बाईं ओर के घातांक को शून्य के बराबर रखें।',
      'x को अलग करने के लिए प्रतिलोम संक्रिया का उपयोग करें।',
    ],
    distractorExplanations: [
      'सही विकल्प।',
      'इस मान पर घातांक शून्य से एक कम रहता है।',
      'इस मान पर घातांक शून्य से दो कम रहता है।',
      'इस मान पर घातांक शून्य से तीन कम रहता है।',
    ],
  }),
  adaptPrebuiltBoss('Textbook MCQ 11', 4, 'Standard Form and Scientific Notation', [
    'Move the decimal point until one non-zero digit remains to its left.',
    'Count the decimal places moved to obtain the coefficient.',
    'A number smaller than one requires a negative power of ten.',
    'Check the number of decimal shifts without calculating the original number again.',
  ], [
    'Correct choice.',
    'The decimal shift was undercounted by one place.',
    'The coefficient has more than one non-zero digit before the decimal point.',
    'A positive power was chosen for a number smaller than one.',
  ], {
    prompt: '0.00000037 का मानक वैज्ञानिक रूप क्या है?',
    hints: [
      'दशमलव को इस तरह रखें कि बाईं ओर एक गैर-शून्य अंक रहे।',
      'गुणांक बनाने के लिए दशमलव के स्थानांतरण गिनें।',
      'एक से छोटी संख्या के लिए 10 की ऋणात्मक घात चाहिए।',
      'मूल संख्या की फिर से गणना किए बिना दशमलव स्थानों की गिनती जाँचें।',
    ],
    distractorExplanations: [
      'सही विकल्प।',
      'दशमलव का स्थानांतरण एक स्थान कम गिना गया।',
      'दशमलव से पहले एक से अधिक गैर-शून्य अंक रखे गए।',
      'एक से छोटी संख्या के लिए धनात्मक घात चुनी गई।',
    ],
  }),
];
const additionalExercise2aAssessments: AgentProposalsInput['raw_assessments'] = [
  adaptPrebuiltWarmup('Exercise 2(A) Q3(b)', 1, 'Negative Integral Exponents and Reciprocals', [
    'A negative exponent represents a reciprocal.',
    'Rewrite the power as a fraction with the squared base in the denominator.',
    'Evaluate the product represented by the square.',
    'Use the signs of the two factors to determine the sign of the denominator.',
  ], [
    'Correct choice.',
    'The sign of the square of a negative base was not checked.',
    'The negative exponent was treated as a negative value without taking a reciprocal.',
    'The reciprocal step was omitted after evaluating the squared base.',
  ], {
    prompt: '\\((-4)^{-2}\\) को p/q के रूप में लिखिए।',
    hints: [
      'ऋणात्मक घात का अर्थ व्युत्क्रम होता है।',
      'घात को हर में वर्ग वाले भिन्न के रूप में लिखें।',
      'वर्ग द्वारा दिखाए गए गुणनफल का मान निकालें।',
      'हर का चिह्न तय करने के लिए दोनों गुणनखंडों के चिह्न देखें।',
    ],
    distractorExplanations: [
      'सही विकल्प।',
      'ऋणात्मक आधार के वर्ग का चिह्न जाँचा नहीं गया।',
      'व्युत्क्रम लेने के बजाय ऋणात्मक घात को ऋणात्मक मान समझा गया।',
      'वर्ग का मान निकालने के बाद व्युत्क्रम का चरण छूट गया।',
    ],
  }),
  adaptPrebuiltWarmup('Exercise 2(A) Q3(c)', 1, 'Negative Integral Exponents and Reciprocals', [
    'Focus on the negative power in the denominator.',
    'Rewrite the reciprocal of a negative power as a positive power.',
    'Evaluate the resulting power after rewriting the expression.',
    'Use repeated multiplication to express the value as a rational number.',
  ], [
    'Correct choice.',
      'An extra negative sign was added while the base remains positive.',
    'The denominator was left unchanged after applying the reciprocal law.',
    'The base and exponent were multiplied rather than evaluating the power.',
  ], {
    prompt: '\\(\\frac{1}{7^{-2}}\\) को p/q के रूप में लिखिए।',
    hints: [
      'हर में स्थित घात पर ध्यान दें।',
      'ऋणात्मक घात के व्युत्क्रम को धनात्मक घात के रूप में लिखें।',
      'व्यंजक को दोबारा लिखने के बाद घात का मान निकालें।',
      'मान को परिमेय संख्या के रूप में लिखने के लिए बार-बार गुणा करें।',
    ],
    distractorExplanations: [
      'सही विकल्प।',
      'धनात्मक आधार के लिए अतिरिक्त ऋण चिह्न लगा दिया गया।',
      'व्युत्क्रम नियम लगाने के बाद हर को नहीं बदला गया।',
      'घात का मान निकालने के बजाय आधार और घातांक को गुणा किया गया।',
    ],
  }),
];
const additionalHotsAssessments: AgentProposalsInput['raw_assessments'] = [
  adaptPrebuiltBoss('HOTS Q2(b)', 2, 'The Five Fundamental Laws of Exponents', [
    'Expand each power using the power-of-a-power law.',
    'Collect the exponents in the numerator and denominator separately.',
    'Compare the two totals using the quotient law for equal bases.',
    'Reduce the remaining power of a divided by itself.',
  ], [
    'Correct choice.',
    'The power multiplication in the numerator was not applied to each term.',
    'A nonzero exponent remains after subtracting matching numerator and denominator powers.',
    'The exponents were multiplied together rather than combined under like-base rules.',
  ], {
    prompt: 'सरल कीजिए: \\(\\frac{(a^{p+q})^2 (a^{q+r})^2 (a^{r+p})^2}{(a^p a^q a^r)^4}\\)',
    hints: [
      'घात की घात वाले नियम से अंश के प्रत्येक पद को खोलें।',
      'अंश और हर के घातांकों का योग अलग-अलग करें।',
      'समान आधारों के भाग के नियम से दोनों योगों की तुलना करें।',
      'बचे हुए पद में समान आधार की घात को स्वयं से भाग दें।',
    ],
    distractorExplanations: [
      'सही विकल्प।',
      'अंश के प्रत्येक पद पर घात की घात वाला नियम नहीं लगाया गया।',
      'अंश और हर की समान घातों को घटाने के बाद भी गैर-शून्य घात रखी गई।',
      'समान आधारों के नियम के बजाय घातांकों को आपस में गुणा किया गया।',
    ],
  }),
  adaptPrebuiltQuestion({
    tag: 'HOTS Q3 (source-derived ratio question)',
    prompt: 'A red blood cell is 0.000007 m in size and a plant cell is 0.00001275 m. Approximately how many times as large is the plant cell?',
    opts: [
      { text: 'Approximately 1.82 times', correct: true, m: '' },
      { text: 'Approximately 0.55 times', correct: false, m: '' },
      { text: 'Approximately 1.275 times', correct: false, m: '' },
      { text: 'Approximately 5.75 times', correct: false, m: '' },
    ],
  }, 4, 'Standard Form and Scientific Notation', [
    'Write both measurements in the same unit and standard form.',
    'Divide the plant-cell size by the red-blood-cell size.',
    'Divide the coefficients and subtract the powers of ten.',
    'Estimate the quotient to two decimal places without reversing the ratio.',
  ], [
    'Correct choice.',
    'The numerator and denominator were reversed when forming the comparison.',
    'The coefficient was copied without comparing both cell measurements.',
    'The coefficients were subtracted rather than forming a ratio.',
  ], {
    prompt: 'लाल रक्त कोशिका का आकार 0.000007 m और पादप कोशिका का आकार 0.00001275 m है। पादप कोशिका लगभग कितनी गुना बड़ी है?',
    hints: [
      'दोनों मापों को समान इकाई और मानक रूप में लिखें।',
      'पादप कोशिका के आकार को लाल रक्त कोशिका के आकार से भाग दें।',
      'गुणांकों को भाग दें और 10 की घातों को घटाएँ।',
      'अनुपात की दिशा बदले बिना भागफल को दो दशमलव स्थान तक अनुमानित करें।',
    ],
    distractorExplanations: [
      'सही विकल्प।',
      'तुलना बनाते समय अंश और हर उलट दिए गए।',
      'दोनों कोशिकाओं के माप की तुलना किए बिना गुणांक लिया गया।',
      'अनुपात बनाने के बजाय गुणांकों को घटाया गया।',
    ],
    options: ['लगभग 1.82 गुना', 'लगभग 0.55 गुना', 'लगभग 1.275 गुना', 'लगभग 5.75 गुना'],
  }),
];
const additionalDeepDiveAssessments: AgentProposalsInput['raw_assessments'] = [
  adaptPrebuiltDeepDive('Ex 2A Q15(b)', 3, 'Solving Exponential Equations', {
    prompt: 'x ज्ञात कीजिए: (2/9)^3 × (2/9)^-6 = (2/9)^(2x-1)',
    hints: ['बाईं ओर समान आधार की घातों को जोड़ें।', 'दोनों ओर के घातांकों को बराबर रखें।', 'पहले स्थिर पद को दूसरी ओर ले जाएँ।', 'x अलग करने के लिए दोनों पक्षों को 2 से भाग दें।'],
    distractorExplanations: ['', 'घातांक बराबर करते समय स्थिर पद का चिह्न गलत बदला गया।', 'x का गुणांक 2 होने पर उससे भाग देना छूट गया।', 'दोनों पक्षों के घातांक पूरी तरह रद्द मान लिए गए।'],
  }),
  adaptPrebuiltDeepDive('Ex 2A Q15(d)', 3, 'Solving Exponential Equations', {
    prompt: 'x ज्ञात कीजिए: (3/2)^-3 × (3/2)^5 = (3/2)^(2x-1)',
    hints: ['बाईं ओर के समान आधार वाले घातांकों को जोड़ें।', 'दोनों पक्षों के घातांकों की तुलना करें।', '2x को अकेला करने के लिए दोनों ओर 1 जोड़ें।', 'x का मान पाने के लिए 2 से भाग दें।'],
    distractorExplanations: ['', 'भिन्न 3/2 को निकटतम पूर्णांक मानकर बदल दिया गया।', '2x अलग करते समय 1 को गलत दिशा में ले जाया गया।', 'बाईं ओर घातांकों का योग गलत निकाला गया।'],
  }),
  adaptPrebuiltDeepDive('Ex 2A Q10', 1, 'Negative Integral Exponents and Reciprocals', {
    prompt: '3^-7 को किस संख्या से गुणा करें ताकि गुणनफल 3 हो?',
    hints: ['अज्ञात गुणक को 3^k मानें।', 'गुणन नियम से घातांकों का संबंध लिखें।', 'प्राप्त घातांक को लक्ष्य घात 1 के बराबर रखें।', 'k ज्ञात करने के लिए दोनों ओर 7 जोड़ें।'],
    distractorExplanations: ['', 'घातांकों का अंतर लेते समय 1 को 7 से गलत घटाया गया।', 'ऋणात्मक घात चुनने से मान और छोटा हो जाता है।', '3^7 से गुणा करने पर लक्ष्य घात 1 नहीं बनती।'],
  }),
  adaptPrebuiltDeepDive('Ex 2A Q11', 1, 'Negative Integral Exponents and Reciprocals', {
    prompt: '(-4)^5 को किस संख्या से भाग दें ताकि भागफल 4^-2 हो?',
    hints: ['दिए गए भाग संबंध को अज्ञात भाजक x के साथ लिखें।', 'विषम घात के कारण (-4)^5 का चिह्न ऋणात्मक है।', 'x को अलग करने के लिए ऋणात्मक घातों का नियम लगाएँ।', 'घातांक 5 - (-2) को सरल करें।'],
    distractorExplanations: ['', 'विषम घात से मिलने वाला ऋण चिह्न छोड़ दिया गया।', 'भाग संबंध में ऋणात्मक घात का चिह्न सही तरह नहीं संभाला गया।', 'ऋण चिह्न छोड़ने के साथ घातांकों का अंतर भी गलत लिया गया।'],
  }),
  adaptPrebuiltDeepDive('Ex 2A Q13', 1, 'Negative Integral Exponents and Reciprocals', {
    prompt: '(3/8)^-3 को किस संख्या से भाग दें ताकि उत्तर 9/64 हो?',
    hints: ['पहचानें कि 9/64, (3/8)^2 के बराबर है।', 'अज्ञात भाजक x रखकर भाग का समीकरण बनाएँ।', 'x को अलग करने के लिए दोनों घातों का भाग लिखें।', 'समान आधार की घातों को घटाएँ।'],
    distractorExplanations: ['', 'भागफल के लिए घातांक का चिह्न उलट दिया गया।', 'घातांकों को घटाने का क्रम उलट गया।', 'आधार और घातांक दोनों एक साथ उलट दिए गए।'],
  }),
  adaptPrebuiltDeepDive('Ex 2A Q14', 1, 'Negative Integral Exponents and Reciprocals', {
    prompt: '(4/7)^-2 को किस संख्या से भाग दें ताकि भागफल 7/16 हो?',
    hints: ['पहले (4/7)^-2 का धनात्मक घात वाला रूप निकालें।', 'मिले हुए मान को अज्ञात भाजक x से भाग के रूप में लिखें।', 'x अलग करने के लिए 49/16 को 7/16 से भाग दें।', 'समान हर 16 को काटकर शेष भाग सरल करें।'],
    distractorExplanations: ['', 'अज्ञात भाजक निकालते समय घात का मान नहीं निकाला गया।', 'भाज्य को भागफल से भाग देने की जगह गुणा किया गया।', 'भिन्न के अंश और हर के गुणनखंड छोड़ दिए गए।'],
  }),
  adaptPrebuiltDeepDive('Ex 2B Q1(c)', 4, 'Standard Form and Scientific Notation', {
    prompt: '0.0000000839 को मानक वैज्ञानिक रूप में लिखें।',
    hints: ['गुणांक को 1 और 10 के बीच रखें।', 'दशमलव को 8.39 बनाने तक दाईं ओर खिसकाएँ।', 'यह संख्या 1 से छोटी है, इसलिए घात ऋणात्मक होगी।', 'दशमलव को वापस खिसकाकर उत्तर जाँचें।'],
    distractorExplanations: ['', 'दशमलव स्थानांतरण की संख्या एक कम गिनी गई।', 'गुणांक को 1 से बड़ा और 10 से छोटा नहीं रखा गया।', 'एक से छोटी संख्या के लिए घात का चिह्न धनात्मक कर दिया गया।'],
  }),
  adaptPrebuiltDeepDive('Ex 2B Q2(b)', 4, 'Standard Form and Scientific Notation', {
    prompt: '4.6 × 10^4 को सामान्य दशमलव रूप में लिखें।',
    hints: ['धनात्मक घात दशमलव को दाईं ओर ले जाती है।', 'दशमलव को चार स्थान खिसकाएँ।', 'पहला स्थान 6 के बाद दशमलव हटाता है।', 'बचे हुए स्थानों में शून्य भरें।'],
    distractorExplanations: ['', '46 के बाद चार शून्य जोड़ने से एक स्थान अतिरिक्त हो गया।', 'दशमलव को केवल तीन स्थान दाईं ओर खिसकाया गया।', 'धनात्मक घात को ऋणात्मक मानकर दशमलव बाईं ओर खिसकाया गया।'],
  }),
  adaptPrebuiltDeepDive('Ex 2B Q2(c)', 4, 'Standard Form and Scientific Notation', {
    prompt: '8 × 10^-8 को सामान्य दशमलव रूप में लिखें।',
    hints: ['ऋणात्मक घात दशमलव को बाईं ओर ले जाती है।', 'दशमलव को कुल आठ स्थान खिसकाएँ।', '8 से पहले आने वाले शून्यों की संख्या गिनें।', 'दशमलव और अंतिम अंक 8 के स्थान को दोबारा जाँचें।'],
    distractorExplanations: ['', 'दशमलव केवल सात स्थान खिसकाया गया।', 'आवश्यकता से एक अतिरिक्त शून्य जोड़ा गया।', 'ऋणात्मक घात को धनात्मक मानकर दशमलव दाईं ओर खिसकाया गया।'],
  }),
  adaptPrebuiltDeepDive('Ex 2B Q2(d)', 4, 'Standard Form and Scientific Notation', {
    prompt: '5.8 × 10^12 को सामान्य दशमलव रूप में लिखें।',
    hints: ['धनात्मक घात दशमलव को दाईं ओर ले जाती है।', 'दशमलव को बारह स्थान खिसकाएँ।', 'पहला स्थान 8 के बाद दशमलव हटाता है।', 'शेष स्थानों में शून्य भरकर अंकों की संख्या जाँचें।'],
    distractorExplanations: ['', '58 के बाद बारह शून्य जोड़ने से एक स्थान अतिरिक्त हो गया।', 'दशमलव को ग्यारह स्थान ही खिसकाया गया।', 'घात का चिह्न उलटकर दशमलव बाईं ओर खिसकाया गया।'],
  }),
  adaptPrebuiltDeepDive('Ex 2B Q3(b)', 4, 'Standard Form and Scientific Notation', {
    prompt: 'इलेक्ट्रॉन के आवेश 0.00000000000000000016 C को मानक रूप में लिखें।',
    hints: ['गुणांक को 1.6 बनाकर दशमलव स्थानांतरण गिनें।', 'दशमलव को 1 और 6 के बीच लाएँ।', 'दशमलव के बाद के शून्य भी स्थानों की गिनती में आते हैं।', 'छोटी राशि के लिए 10 की घात ऋणात्मक रखें।'],
    distractorExplanations: ['', 'दशमलव स्थानांतरण एक कम गिना गया।', 'गुणांक 1 और 10 के बीच मानक रूप में नहीं है।', 'सूक्ष्म आवेश के लिए घात का चिह्न धनात्मक कर दिया गया।'],
  }),
  adaptPrebuiltDeepDive('Ex 2B Q3(c)', 4, 'Standard Form and Scientific Notation', {
    prompt: 'जीवाणु के आकार 0.0000005 m को मानक रूप में लिखें।',
    hints: ['गुणांक 5 रखें।', 'दशमलव को 5 के ठीक बाद लाएँ।', 'दशमलव के स्थानांतरण की कुल संख्या गिनें।', 'एक से छोटी लंबाई के लिए ऋणात्मक घात लिखें।'],
    distractorExplanations: ['', 'दशमलव स्थानांतरण एक कम गिना गया।', 'गुणांक 1 से छोटा रखा गया, इसलिए रूप मानक नहीं है।', 'सूक्ष्म लंबाई के लिए घात का चिह्न धनात्मक कर दिया गया।'],
  }),
  adaptPrebuiltDeepDive('Ex 2B Q3(d)', 4, 'Standard Form and Scientific Notation', {
    prompt: 'पादप कोशिका के आकार 0.00001275 m को वैज्ञानिक मानक रूप में लिखें।',
    hints: ['गुणांक 1.275 बनाने के लिए दशमलव खिसकाएँ।', 'दशमलव स्थानांतरण की संख्या गिनें।', 'एक से छोटी लंबाई के लिए घात ऋणात्मक होगी।', 'दशमलव को वापस रखकर उत्तर जाँचें।'],
    distractorExplanations: ['', 'दशमलव स्थानांतरण एक स्थान कम गिना गया।', 'गुणांक में दशमलव से पहले दो अंक रह गए।', 'छोटी लंबाई के लिए घात का चिह्न धनात्मक कर दिया गया।'],
  }),
  adaptPrebuiltDeepDive('Ex 2B Q3(e)', 4, 'Standard Form and Scientific Notation', {
    prompt: 'निर्वात में प्रकाश की गति 300,000,000 m/s को मानक रूप में लिखें।',
    hints: ['गुणांक में केवल एक गैर-शून्य अंक दशमलव से पहले रखें।', 'दशमलव को 3 के बाद रखें।', 'दाईं ओर खिसकाए गए स्थान गिनें।', 'बड़ी संख्या के लिए 10 की घात धनात्मक रखें।'],
    distractorExplanations: ['', 'दशमलव स्थानांतरण में एक शून्य छूट गया।', 'गुणांक को एक अंक तक सामान्यीकृत नहीं किया गया।', 'बड़ी गति के लिए घात का चिह्न ऋणात्मक कर दिया गया।'],
  }),
];

const exercise2APartCounts = [4, 4, 8, 4, 4, 8, 8];
const exercise2ASourceInventory = exercise2APartCounts.flatMap((partCount, questionIndex) =>
  Array.from({ length: partCount }, (_, partIndex) => {
    const part = String.fromCharCode('a'.charCodeAt(0) + partIndex);
    return {
      id: `math-matrix-ch2-ex2a-q${questionIndex + 1}-${part}`,
      kind: 'textbook_exercise' as const,
      document_id: 'math-matrix-8-ch2-part-1',
      pages: [6],
      granularity: 'question_part' as const,
      label: `Exercise 2(A) ${questionIndex + 1}(${part})`,
    };
  }),
);
const exercise2ARemainingPartCounts = [8, 6, 4, 1, 1, 3, 1, 1, 1, 1, 1, 1, 1];
const exercise2ARemainingSourceInventory: SourceInventoryItem[] = exercise2ARemainingPartCounts.flatMap((partCount, index) => {
  const questionNumber = index + 8;
  return Array.from({ length: partCount }, (_, partIndex) => {
    const part = partCount === 1 ? undefined : String.fromCharCode('a'.charCodeAt(0) + partIndex);
    return {
      id: part ? `math-matrix-ch2-ex2a-q${questionNumber}-${part}` : `math-matrix-ch2-ex2a-q${questionNumber}`,
      kind: 'textbook_exercise',
      document_id: 'math-matrix-8-ch2-part-2',
      pages: [1],
      granularity: part ? 'question_part' : 'question',
      label: part ? `Exercise 2(A) ${questionNumber}(${part})` : `Exercise 2(A) ${questionNumber}`,
    };
  });
});
const exercise2BQuestionSpecs = [
  { question: 1, partCount: 8 },
  { question: 2, partCount: 8 },
  { question: 3, partCount: 8 },
  { question: 4, partCount: 1 },
  { question: 5, partCount: 1 },
];
const exercise2BSourceInventory: SourceInventoryItem[] = exercise2BQuestionSpecs.flatMap(({ question, partCount }) =>
  Array.from({ length: partCount }, (_, partIndex) => {
    const part = partCount === 1 ? undefined : String.fromCharCode('a'.charCodeAt(0) + partIndex);
    const page = question < 3 || (question === 3 && partIndex < 4) ? 2 : 3;
    return {
      id: part ? `math-matrix-ch2-ex2b-q${question}-${part}` : `math-matrix-ch2-ex2b-q${question}`,
      kind: 'textbook_exercise',
      document_id: 'math-matrix-8-ch2-part-2',
      pages: [page],
      granularity: part ? 'question_part' : 'question',
      label: part ? `Exercise 2(B) ${question}(${part})` : `Exercise 2(B) ${question}`,
    };
  }),
);
const rewindQuestionSpecs = [
  { question: 1, partCount: 8, page: 4 }, { question: 2, partCount: 8, page: 4 },
  { question: 3, partCount: 4, page: 4 }, { question: 4, partCount: 2, page: 4 },
  { question: 5, partCount: 1, page: 4 }, { question: 6, partCount: 1, page: 4 },
  { question: 7, partCount: 6, page: 4 }, { question: 8, partCount: 2, page: 4 },
  { question: 9, partCount: 4, page: 4 }, { question: 10, partCount: 2, page: 4 },
  { question: 11, partCount: 1, page: 4 }, { question: 12, partCount: 1, page: 4 },
  { question: 13, partCount: 4, page: 4 }, { question: 14, partCount: 4, page: 5 },
  { question: 15, partCount: 1, page: 5 },
];
const rewindSourceInventory: SourceInventoryItem[] = rewindQuestionSpecs.flatMap(({ question, partCount, page }) =>
  Array.from({ length: partCount }, (_, partIndex) => {
    const part = partCount === 1 ? undefined : String.fromCharCode('a'.charCodeAt(0) + partIndex);
    return {
      id: part ? `math-matrix-ch2-rewind-q${question}-${part}` : `math-matrix-ch2-rewind-q${question}`,
      kind: 'textbook_exercise',
      document_id: 'math-matrix-8-ch2-part-2',
      pages: [page],
      granularity: part ? 'question_part' : 'question',
      label: part ? `Rewind Yourself ${question}(${part})` : `Rewind Yourself ${question}`,
    };
  }),
);
const higherOrderThinkingSourceInventory: SourceInventoryItem[] = [
  { id: 'math-matrix-ch2-hots-q1-missing-source', kind: 'other', document_id: 'math-matrix-8-ch2-part-2', pages: [3], granularity: 'other', label: 'Higher Order Thinking Skills item 1 is not present in the supplied scan; the next visible item is question 2' },
  { id: 'math-matrix-ch2-hots-q2-a', kind: 'textbook_exercise', document_id: 'math-matrix-8-ch2-part-2', pages: [4], granularity: 'question_part', label: 'Higher Order Thinking Skills 2(a): simplify the reciprocal-power identity' },
  { id: 'math-matrix-ch2-hots-q2-b', kind: 'textbook_exercise', document_id: 'math-matrix-8-ch2-part-2', pages: [4], granularity: 'question_part', label: 'Higher Order Thinking Skills 2(b): simplify the algebraic exponent expression' },
  { id: 'math-matrix-ch2-hots-q3', kind: 'textbook_exercise', document_id: 'math-matrix-8-ch2-part-2', pages: [4], granularity: 'question', label: 'Higher Order Thinking Skills 3: compare plant-cell and red-blood-cell sizes' },
  { id: 'math-matrix-ch2-hots-q4', kind: 'textbook_exercise', document_id: 'math-matrix-8-ch2-part-2', pages: [4], granularity: 'question', label: 'Higher Order Thinking Skills 4: estimate spacecraft travel time to the Moon' },
];
const chapterConceptSourceInventory: SourceInventoryItem[] = [
  { id: 'math-matrix-ch2-concept-exponential-notation', kind: 'chapter_concept', document_id: 'math-matrix-8-ch2-part-1', pages: [2], granularity: 'concept', label: 'Exponential notation, base and exponent, and sign parity' },
  { id: 'math-matrix-ch2-concept-negative-integral-exponents', kind: 'chapter_concept', document_id: 'math-matrix-8-ch2-part-1', pages: [2], granularity: 'concept', label: 'Negative integral exponents as reciprocal powers' },
  { id: 'math-matrix-ch2-concept-exponent-laws', kind: 'chapter_concept', document_id: 'math-matrix-8-ch2-part-1', pages: [4], granularity: 'concept', label: 'Five laws of exponents with integral powers' },
  { id: 'math-matrix-ch2-concept-solving-exponential-equations', kind: 'chapter_concept', document_id: 'math-matrix-8-ch2-part-1', pages: [6], granularity: 'concept', label: 'Solving for an unknown exponent by comparing like bases' },
  { id: 'math-matrix-ch2-concept-standard-form', kind: 'chapter_concept', document_id: 'math-matrix-8-ch2-part-2', pages: [1], granularity: 'concept', label: 'Expressing small numbers in standard form using powers of ten' },
];
const introductoryExampleSourceInventory: SourceInventoryItem[] = Array.from({ length: 8 }, (_, exampleIndex) => ({
  id: `math-matrix-ch2-intro-example-${String.fromCharCode('a'.charCodeAt(0) + exampleIndex)}`,
  kind: 'worked_example',
  document_id: 'math-matrix-8-ch2-part-1',
  pages: [2],
  granularity: 'worked_example',
  label: `Introduction example ${String.fromCharCode('a'.charCodeAt(0) + exampleIndex)}: repeated multiplication and power notation`,
}));
const solvedExamplePages: Array<[number, string, number]> = [
  [1, 'math-matrix-8-ch2-part-1', 3], [2, 'math-matrix-8-ch2-part-1', 3],
  [3, 'math-matrix-8-ch2-part-1', 3], [4, 'math-matrix-8-ch2-part-1', 3],
  [5, 'math-matrix-8-ch2-part-1', 4], [6, 'math-matrix-8-ch2-part-1', 4],
  [7, 'math-matrix-8-ch2-part-1', 4], [8, 'math-matrix-8-ch2-part-1', 5],
  [9, 'math-matrix-8-ch2-part-1', 5], [10, 'math-matrix-8-ch2-part-1', 6],
  [11, 'math-matrix-8-ch2-part-1', 6], [12, 'math-matrix-8-ch2-part-2', 2],
  [13, 'math-matrix-8-ch2-part-2', 2], [14, 'math-matrix-8-ch2-part-2', 2],
  [15, 'math-matrix-8-ch2-part-2', 2],
];
const numberedSolvedExampleInventory: SourceInventoryItem[] = solvedExamplePages.map(([example, document_id, page]) => ({
  id: `math-matrix-ch2-solved-example-${example}`,
  kind: 'worked_example',
  document_id,
  pages: [page],
  granularity: 'worked_example',
  label: `Solved Example ${example}`,
}));
const chapterActivitySourceInventory: SourceInventoryItem[] = [
  { id: 'math-matrix-ch2-activity-maths-lab', kind: 'activity', document_id: 'math-matrix-8-ch2-part-2', pages: [3], granularity: 'activity', label: 'Maths Lab: three-round base and exponent spinner activity' },
  { id: 'math-matrix-ch2-activity-life-skills', kind: 'activity', document_id: 'math-matrix-8-ch2-part-2', pages: [3], granularity: 'activity', label: 'Life Skills and Values: weekly savings pattern' },
  { id: 'math-matrix-ch2-activity-subject-integration', kind: 'activity', document_id: 'math-matrix-8-ch2-part-2', pages: [3], granularity: 'activity', label: 'Subject Integration: research satellite distances and express in scientific notation' },
];

// Full Agent Proposals for Class 8 Mathematics: Exponents and Powers
// Curricular Source: Math Matrix 8, Chapter 2 ("Exponents and Powers"); board/edition details remain unverified.
// Contract Binding: Aasha-AI/content/contracts/Mathematics_Class8_exponents_and_powers.yaml
// Resource selection is determined at compile time from registry evidence; this label alone is not a match.

export const exponentsPowersProposal: AgentProposalsInput = {
  chapter_id: 'c8_math_exponents_powers',
  title: 'Exponents and Powers',
  grade: 8,
  subject: 'Mathematics',
  board: 'Unspecified — Math Matrix 8 source scan',
  source_pdf_hash: 'sha256:883160b55ef8a9d107cda802b97ed763ed255ffbcca9131a8a63744ac5877a20',
  source_documents: [
    { id: 'math-matrix-8-ch2-part-1', file_name: 'MDS grade 8th math exponent part 1.pdf', sha256: '883160b55ef8a9d107cda802b97ed763ed255ffbcca9131a8a63744ac5877a20', page_count: 6 },
    { id: 'math-matrix-8-ch2-part-2', file_name: 'MDS grade 8th math exponent part 2.pdf', sha256: '73307fe342b0f61958c514d09668135cfb05e99cbce53203aa2ceb116b71fc35', page_count: 5 },
  ],
  // Concepts, worked examples, selected activities, the page-1 Warm Up,
  // Exercise 2(A) 1–7, and later exact assessment matches are inventoried.
  // Exercises 2(A)/2(B), review items, and remaining source sections still
  // need item-level inventory and mapping before chapter scope can be FULL.
  source_inventory_scope: 'PARTIAL',
  source_inventory: [
    ...chapterConceptSourceInventory,
    ...introductoryExampleSourceInventory,
    ...numberedSolvedExampleInventory,
    ...chapterActivitySourceInventory,
    ...exercise2ASourceInventory,
    ...exercise2ARemainingSourceInventory,
    ...exercise2BSourceInventory,
    ...rewindSourceInventory,
    ...higherOrderThinkingSourceInventory,
    ...Array.from({ length: 10 }, (_, questionIndex) => ['a', 'b', 'c', 'd'].map((part) => ({
      id: `math-matrix-ch2-warmup-q${questionIndex + 1}-${part}`,
      kind: 'textbook_exercise' as const,
      document_id: 'math-matrix-8-ch2-part-1',
      pages: [1],
      granularity: 'question_part' as const,
      label: `Warm Up ${questionIndex + 1}(${part})`,
    }))).flat(),
    { id: 'math-matrix-ch2-mcq-q1', kind: 'textbook_exercise', document_id: 'math-matrix-8-ch2-part-2', pages: [5], granularity: 'question', label: 'Multiple Choice Question 1: simplify the expression with powers of 2' },
    { id: 'math-matrix-ch2-mcq-q2', kind: 'textbook_exercise', document_id: 'math-matrix-8-ch2-part-2', pages: [5], granularity: 'question', label: 'Multiple Choice Question 2: simplify x^-1 + y^-1' },
    { id: 'math-matrix-ch2-mcq-q3', kind: 'textbook_exercise', document_id: 'math-matrix-8-ch2-part-2', pages: [5], granularity: 'question', label: 'Multiple Choice Question 3: evaluate x + x(x^x) for x=2' },
    { id: 'math-matrix-ch2-mcq-q4', kind: 'textbook_exercise', document_id: 'math-matrix-8-ch2-part-2', pages: [5], granularity: 'question', label: 'Multiple Choice Question 4: find the multiplicative inverse of 10^-100' },
    { id: 'math-matrix-ch2-mcq-q5', kind: 'textbook_exercise', document_id: 'math-matrix-8-ch2-part-2', pages: [5], granularity: 'question', label: 'Multiple Choice Question 5: evaluate the expression with powers of 3' },
    { id: 'math-matrix-ch2-mcq-q6', kind: 'textbook_exercise', document_id: 'math-matrix-8-ch2-part-2', pages: [5], granularity: 'question', label: 'Multiple Choice Question 6: solve the equation in powers of 3' },
    { id: 'math-matrix-ch2-mcq-q7', kind: 'textbook_exercise', document_id: 'math-matrix-8-ch2-part-2', pages: [5], granularity: 'question', label: 'Multiple Choice Question 7: evaluate a product involving zero powers' },
    { id: 'math-matrix-ch2-mcq-q8', kind: 'textbook_exercise', document_id: 'math-matrix-8-ch2-part-2', pages: [5], granularity: 'question', label: 'Multiple Choice Question 8: find the reciprocal of a rational expression' },
    { id: 'math-matrix-ch2-mcq-q9', kind: 'textbook_exercise', document_id: 'math-matrix-8-ch2-part-2', pages: [5], granularity: 'question', label: 'Multiple Choice Question 9: evaluate a product involving zero powers' },
    { id: 'math-matrix-ch2-mcq-q10', kind: 'textbook_exercise', document_id: 'math-matrix-8-ch2-part-2', pages: [5], granularity: 'question', label: 'Multiple Choice Question 10: solve an exponential equation' },
    { id: 'math-matrix-ch2-mcq-q11', kind: 'textbook_exercise', document_id: 'math-matrix-8-ch2-part-2', pages: [5], granularity: 'question', label: 'Multiple Choice Question 11: express a small number in standard form' },
    { id: 'math-matrix-ch2-mcq-q12', kind: 'textbook_exercise', document_id: 'math-matrix-8-ch2-part-2', pages: [5], granularity: 'question', label: 'Multiple Choice Question 12: find the least positive integer m' },
  ],
  source_coverage: [
    { source_item_id: 'math-matrix-ch2-hots-q1-missing-source', learning_target_ids: [], assessment_item_ids: [], coverage: 'OMITTED', note: 'Question text is not present in the supplied scans; do not infer or generate source-specific content.' },
    { source_item_id: 'math-matrix-ch2-concept-exponential-notation', learning_target_ids: ['cpt:mathematics:c8:c8_math_exponents_powers:c_1', 'cnt:mathematics:c8:c8_math_exponents_powers:def_1'], assessment_item_ids: [], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-concept-negative-integral-exponents', learning_target_ids: ['cpt:mathematics:c8:c8_math_exponents_powers:c_2', 'cnt:mathematics:c8:c8_math_exponents_powers:def_2'], assessment_item_ids: [], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-concept-exponent-laws', learning_target_ids: ['cpt:mathematics:c8:c8_math_exponents_powers:c_3', 'cnt:mathematics:c8:c8_math_exponents_powers:def_3'], assessment_item_ids: [], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-concept-solving-exponential-equations', learning_target_ids: ['cpt:mathematics:c8:c8_math_exponents_powers:c_4', 'cnt:mathematics:c8:c8_math_exponents_powers:def_4'], assessment_item_ids: [], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-concept-standard-form', learning_target_ids: ['cpt:mathematics:c8:c8_math_exponents_powers:c_5', 'cnt:mathematics:c8:c8_math_exponents_powers:def_5'], assessment_item_ids: [], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-intro-example-h', learning_target_ids: ['cnt:mathematics:c8:c8_math_exponents_powers:learning_1'], assessment_item_ids: [], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-solved-example-1', learning_target_ids: ['cnt:mathematics:c8:c8_math_exponents_powers:learning_2'], assessment_item_ids: [], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-solved-example-11', learning_target_ids: ['cnt:mathematics:c8:c8_math_exponents_powers:learning_3'], assessment_item_ids: [], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-solved-example-12', learning_target_ids: ['cnt:mathematics:c8:c8_math_exponents_powers:learning_4'], assessment_item_ids: [], coverage: 'FULL' },
    ...[
      'math-matrix-ch2-intro-example-a', 'math-matrix-ch2-intro-example-b', 'math-matrix-ch2-intro-example-c',
      'math-matrix-ch2-intro-example-d', 'math-matrix-ch2-intro-example-e', 'math-matrix-ch2-intro-example-f',
      'math-matrix-ch2-intro-example-g', 'math-matrix-ch2-solved-example-2', 'math-matrix-ch2-solved-example-3',
      'math-matrix-ch2-solved-example-4', 'math-matrix-ch2-solved-example-5', 'math-matrix-ch2-solved-example-6',
      'math-matrix-ch2-solved-example-7', 'math-matrix-ch2-solved-example-8', 'math-matrix-ch2-solved-example-9',
      'math-matrix-ch2-solved-example-10', 'math-matrix-ch2-solved-example-13', 'math-matrix-ch2-solved-example-14',
      'math-matrix-ch2-solved-example-15', 'math-matrix-ch2-activity-maths-lab',
      'math-matrix-ch2-activity-life-skills', 'math-matrix-ch2-activity-subject-integration',
    ].map((source_item_id, index) => ({
      source_item_id,
      learning_target_ids: [`cnt:mathematics:c8:c8_math_exponents_powers:learning_${index + 5}`],
      assessment_item_ids: [],
      coverage: 'FULL' as const,
    })),
    { source_item_id: 'math-matrix-ch2-mcq-q7', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_31'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-mcq-q9', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_32'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-mcq-q10', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_33'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-mcq-q11', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_34'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-ex2a-q3-b', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_35'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-ex2a-q3-c', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_36'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-hots-q2-b', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_37'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-hots-q3', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_38'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-warmup-q1-c', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_26'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-warmup-q1-d', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_27'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-warmup-q2-b', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_28'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-warmup-q2-c', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_29'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-warmup-q6-c', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_30'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-warmup-q1-a', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_1'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-warmup-q1-b', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_2'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-warmup-q2-a', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_3'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-warmup-q6-b', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_7'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-warmup-q8-a', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_6'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-ex2a-q10-a', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_12'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-ex2a-q10-c', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_13'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-ex2a-q18', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_11'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-ex2b-q1-a', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_14'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-ex2b-q2-a', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_15'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-mcq-q1', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_16'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-mcq-q2', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_17'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-mcq-q3', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_18'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-mcq-q4', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_19'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-mcq-q5', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_20'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-mcq-q6', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_21'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-mcq-q8', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_22'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-mcq-q12', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_23'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-hots-q2-a', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_24'], coverage: 'FULL' },
    { source_item_id: 'math-matrix-ch2-hots-q4', learning_target_ids: [], assessment_item_ids: ['ast:mathematics:c8:c8_math_exponents_powers:q_25'], coverage: 'FULL' },
    ...[
      ['math-matrix-ch2-ex2a-q10-b', 39], ['math-matrix-ch2-ex2a-q10-d', 40],
      ['math-matrix-ch2-ex2a-q14', 41], ['math-matrix-ch2-ex2a-q15', 42],
      ['math-matrix-ch2-ex2a-q19', 43], ['math-matrix-ch2-ex2a-q20', 44],
      ['math-matrix-ch2-ex2b-q1-e', 45], ['math-matrix-ch2-ex2b-q2-b', 46],
      ['math-matrix-ch2-ex2b-q2-c', 47], ['math-matrix-ch2-ex2b-q2-e', 48],
      ['math-matrix-ch2-ex2b-q3-b', 49], ['math-matrix-ch2-ex2b-q3-c', 50],
      ['math-matrix-ch2-ex2b-q3-d', 51], ['math-matrix-ch2-ex2b-q3-f', 52],
    ].map(([source_item_id, questionIndex]) => ({
      source_item_id: source_item_id as string,
      learning_target_ids: [],
      assessment_item_ids: [`ast:mathematics:c8:c8_math_exponents_powers:q_${questionIndex}`],
      coverage: 'FULL' as const,
    })),
  ],
  raw_objectives: [
    {
      description: 'Understand the exponential notation, distinguishing base and power, and apply sign rules for odd/even powers of negative rational numbers.',
      bloom_level: 'understand',
      success_criteria: ['Identify base and exponent in exponential notation', 'Evaluate odd and even powers of negative numbers accurately'],
    },
    {
      description: 'Reason and apply the concept of negative integral exponents as multiplicative inverses and reciprocal fractions.',
      bloom_level: 'apply',
      success_criteria: ['Transform negative exponents into reciprocal positive powers', 'Compute values of rational bases with negative powers'],
    },
    {
      description: 'Master and apply the 5 fundamental laws of exponents with integral powers to simplify complex numerical and algebraic expressions.',
      bloom_level: 'apply',
      success_criteria: ['Execute product, quotient, and power of power laws correctly', 'Apply zero exponent identity a^0 = 1 for any non-zero base'],
    },
    {
      description: 'Solve exponential equations by transforming expressions to common bases and equating exponents.',
      bloom_level: 'analyze',
      success_criteria: ['Align LHS and RHS to identical prime or rational bases', 'Formulate and solve linear equations in the exponent variable'],
    },
    {
      description: 'Convert extreme astronomical and microscopic scientific measurements between usual decimal form and standard scientific notation.',
      bloom_level: 'analyze',
      success_criteria: ['Express numbers in standard form k * 10^n with 1 <= k < 10', 'Compare real-world physical dimensions and perform arithmetic on scientific numbers'],
    },
  ],
  raw_concepts: [
    {
      name: 'Exponential Notation and Sign Rules',
      definition: 'Repeated multiplication of a rational number by itself is expressed as exponential notation \\(a^n\\), where \\(a\\) is the base and \\(n\\) is the exponent or index. For any fraction, \\((\\frac{p}{q})^n = \\frac{p^n}{q^n}\\). A negative base raised to an odd power retains a negative value, whereas raised to an even power produces a positive value.',
    },
    {
      name: 'Negative Integral Exponents and Reciprocals',
      definition: 'A negative integral exponent indicates repeated division and represents the multiplicative inverse of the corresponding positive power: \\(a^{-n} = \\frac{1}{a^n}\\). For any non-zero rational fraction, \\((\\frac{p}{q})^{-n} = (\\frac{q}{p})^n\\). The product of a non-zero number and its multiplicative inverse always equals 1.',
    },
    {
      name: 'The Five Fundamental Laws of Exponents',
      definition: 'For non-zero rational bases and integral exponents: (1) Product Law: \\(a^m \\times a^n = a^{m+n}\\); (2) Quotient Law: \\(a^m \\div a^n = a^{m-n}\\); (3) Power of a Power: \\((a^m)^n = a^{mn}\\); (4) Power of a Product: \\(a^m \\times b^m = (ab)^m\\); and (5) Zero Exponent Law: \\(a^0 = 1\\) for every non-zero base \\(a\\).',
    },
    {
      name: 'Solving Exponential Equations',
      definition: 'An exponential equation contains an unknown variable in the exponent. When two exponential expressions with the same non-zero base (other than 1 or -1) are equal, their exponents must be equal: if \\(a^x = a^y\\), then \\(x = y\\). Unknown terms are isolated by aligning both sides to common bases.',
    },
    {
      name: 'Standard Form and Scientific Notation',
      definition: 'Scientific notation represents extreme numbers in the normalized form \\(k \\times 10^n\\), where \\(1 \\le k < 10\\) and \\(n\\) is an integer. For numbers smaller than 1, shifting the decimal point to the right produces a negative exponent \\(n\\). For numbers greater than 10, shifting to the left produces a positive exponent \\(n\\).',
    },
  ],
  raw_learning_content: [
    {
      source_item_id: 'math-matrix-ch2-intro-example-h',
      concept_name: 'Exponential Notation and Sign Rules',
      type: 'worked_example',
      text_english: 'Introduction Example (h): Expand \\((-4/5)^5\\) as repeated multiplication. Five factors of \\(-4/5\\) give \\((-4)^5/5^5=-1024/3125\\). The exponent is odd, so the result remains negative.',
      text_hindi: 'परिचय उदाहरण (h): \\((-4/5)^5\\) को बार-बार गुणा के रूप में लिखें। \\(-4/5\\) के पाँच गुणनखंडों से \\((-4)^5/5^5=-1024/3125\\) मिलता है। घात विषम है, इसलिए उत्तर ऋणात्मक रहता है।',
    },
    {
      source_item_id: 'math-matrix-ch2-solved-example-1',
      concept_name: 'Negative Integral Exponents and Reciprocals',
      type: 'worked_example',
      text_english: 'Solved Example 1: Express each value as p/q. (a) \\(4^{-3}=1/4^3=1/64\\). (b) \\((5/3)^{-3}=(3/5)^3=27/125\\). (c) \\(1/(2^{-5})=1/(1/32)=32\\). A negative exponent reciprocates its base before the positive power is evaluated.',
      text_hindi: 'हल उदाहरण 1: प्रत्येक मान को p/q के रूप में लिखें। (a) \\(4^{-3}=1/4^3=1/64\\)। (b) \\((5/3)^{-3}=(3/5)^3=27/125\\)। (c) \\(1/(2^{-5})=1/(1/32)=32\\)। धनात्मक घात का मान निकालने से पहले ऋणात्मक घात आधार का व्युत्क्रम लेती है।',
    },
    {
      source_item_id: 'math-matrix-ch2-solved-example-11',
      concept_name: 'Solving Exponential Equations',
      type: 'worked_example',
      text_english: 'Solved Example 11: Find x by comparing exponents with matching bases. (a) \\((6/7)^x(6/7)^5=(6/7)^5\\), so x+5=5 and x=0. (b) \\((1/2)^{2x}/(1/2)^2=(1/2)^4\\), so 2x-2=4 and x=3.',
      text_hindi: 'हल उदाहरण 11: समान आधारों की घातों की तुलना करके x ज्ञात करें। (a) \\((6/7)^x(6/7)^5=(6/7)^5\\), इसलिए x+5=5 और x=0। (b) \\((1/2)^{2x}/(1/2)^2=(1/2)^4\\), इसलिए 2x-2=4 और x=3।',
    },
    {
      source_item_id: 'math-matrix-ch2-solved-example-12',
      concept_name: 'Standard Form and Scientific Notation',
      type: 'worked_example',
      text_english: 'Solved Example 12: Write each decimal in standard form, with one non-zero digit before the decimal point. (a) 0.6573 = 6.573 × 10^-1. (b) 0.000005 = 5 × 10^-6. (c) 0.000000254 = 2.54 × 10^-7. (d) 0.0000031 = 3.1 × 10^-6.',
      text_hindi: 'हल उदाहरण 12: प्रत्येक दशमलव को मानक रूप में लिखें, जहाँ दशमलव से पहले एक गैर-शून्य अंक हो। (a) 0.6573 = 6.573 × 10^-1। (b) 0.000005 = 5 × 10^-6। (c) 0.000000254 = 2.54 × 10^-7। (d) 0.0000031 = 3.1 × 10^-6।',
    },
    { source_item_id: 'math-matrix-ch2-intro-example-a', concept_name: 'Exponential Notation and Sign Rules', type: 'worked_example', text_english: 'Introduction example (a): (-1)^2 = (-1) × (-1) = 1. An even number of negative factors gives a positive product.', text_hindi: 'परिचय उदाहरण (a): (-1)^2 = (-1) × (-1) = 1। ऋणात्मक गुणनखंडों की सम संख्या का गुणनफल धनात्मक होता है।' },
    { source_item_id: 'math-matrix-ch2-intro-example-b', concept_name: 'Exponential Notation and Sign Rules', type: 'worked_example', text_english: 'Introduction example (b): (-1)^3 = (-1) × (-1) × (-1) = -1. An odd number of negative factors gives a negative product.', text_hindi: 'परिचय उदाहरण (b): (-1)^3 = (-1) × (-1) × (-1) = -1। ऋणात्मक गुणनखंडों की विषम संख्या का गुणनफल ऋणात्मक होता है।' },
    { source_item_id: 'math-matrix-ch2-intro-example-c', concept_name: 'Exponential Notation and Sign Rules', type: 'worked_example', text_english: 'Introduction example (c): (-2)^6 is six factors of -2; pairing the factors gives 2^6 = 64.', text_hindi: 'परिचय उदाहरण (c): (-2)^6 में -2 के छह गुणनखंड हैं; जोड़े बनाने पर 2^6 = 64 मिलता है।' },
    { source_item_id: 'math-matrix-ch2-intro-example-d', concept_name: 'Exponential Notation and Sign Rules', type: 'worked_example', text_english: 'Introduction example (d): (-2)^7 is seven factors of -2. The odd exponent keeps the product negative, and its magnitude is 2^7 = 128.', text_hindi: 'परिचय उदाहरण (d): (-2)^7 में -2 के सात गुणनखंड हैं। विषम घात के कारण गुणनफल ऋणात्मक रहता है और उसका परिमाण 2^7 = 128 है।' },
    { source_item_id: 'math-matrix-ch2-intro-example-e', concept_name: 'Exponential Notation and Sign Rules', type: 'worked_example', text_english: 'Introduction example (e): (-1/4)^4 = (-1)^4/4^4 = 1/256. The even exponent makes the result positive.', text_hindi: 'परिचय उदाहरण (e): (-1/4)^4 = (-1)^4/4^4 = 1/256। सम घात से उत्तर धनात्मक होता है।' },
    { source_item_id: 'math-matrix-ch2-intro-example-f', concept_name: 'Exponential Notation and Sign Rules', type: 'worked_example', text_english: 'Introduction example (f): (-1/3)^3 = (-1)^3/3^3 = -1/27.', text_hindi: 'परिचय उदाहरण (f): (-1/3)^3 = (-1)^3/3^3 = -1/27।' },
    { source_item_id: 'math-matrix-ch2-intro-example-g', concept_name: 'Exponential Notation and Sign Rules', type: 'worked_example', text_english: 'Introduction example (g): (3/4)^3 = 3^3/4^3 = 27/64.', text_hindi: 'परिचय उदाहरण (g): (3/4)^3 = 3^3/4^3 = 27/64।' },
    { source_item_id: 'math-matrix-ch2-solved-example-2', concept_name: 'Negative Integral Exponents and Reciprocals', type: 'worked_example', text_english: 'Solved Example 2: (a) (5/8)^-2 × (4/3)^-3 = (8/5)^2 × (3/4)^3 = 27/25. (b) (-2/7)^-4 × (-7/9)^3 = (7/2)^4 × (-7/9)^3 = -823543/11664. Take reciprocals for negative exponents before multiplying.', text_hindi: 'हल उदाहरण 2: (a) (5/8)^-2 × (4/3)^-3 = (8/5)^2 × (3/4)^3 = 27/25। (b) (-2/7)^-4 × (-7/9)^3 = (7/2)^4 × (-7/9)^3 = -823543/11664। गुणा करने से पहले ऋणात्मक घातों का व्युत्क्रम लें।' },
    { source_item_id: 'math-matrix-ch2-solved-example-3', concept_name: 'Negative Integral Exponents and Reciprocals', type: 'worked_example', text_english: 'Solved Example 3: (a) (4^-1 + 8^-1) ÷ (2/3)^-1 = (1/4 + 1/8) ÷ (3/2) = 1/4. (b) (2^-1 ÷ 5^-1)^2 ÷ (-5/8)^-1 = (5/2)^2 × (-5/8) = -125/32. The scanned solution appears to print -10, which does not follow from the expression as printed.', text_hindi: 'हल उदाहरण 3: (a) (4^-1 + 8^-1) ÷ (2/3)^-1 = (1/4 + 1/8) ÷ (3/2) = 1/4। (b) (2^-1 ÷ 5^-1)^2 ÷ (-5/8)^-1 = (5/2)^2 × (-5/8) = -125/32। स्कैन में उत्तर -10 दिखता है, जो मुद्रित व्यंजक से नहीं निकलता।' },
    { source_item_id: 'math-matrix-ch2-solved-example-4', concept_name: 'Negative Integral Exponents and Reciprocals', type: 'worked_example', text_english: 'Solved Example 4: (a) (1/4)^-2 + (1/2)^-2 + (1/3)^-2 = 16 + 4 + 9 = 29. (b) {6^-1 + (3/2)^-1}^-1 = (1/6 + 2/3)^-1 = 6/5.', text_hindi: 'हल उदाहरण 4: (a) (1/4)^-2 + (1/2)^-2 + (1/3)^-2 = 16 + 4 + 9 = 29। (b) {6^-1 + (3/2)^-1}^-1 = (1/6 + 2/3)^-1 = 6/5।' },
    { source_item_id: 'math-matrix-ch2-solved-example-5', concept_name: 'Negative Integral Exponents and Reciprocals', type: 'worked_example', text_english: 'Solved Example 5: Let x be the number. (-6)^-1 × x = 15^-1, so x = (1/15) ÷ (-1/6) = -2/5.', text_hindi: 'हल उदाहरण 5: संख्या x मानें। (-6)^-1 × x = 15^-1, अतः x = (1/15) ÷ (-1/6) = -2/5।' },
    { source_item_id: 'math-matrix-ch2-solved-example-6', concept_name: 'The Five Fundamental Laws of Exponents', type: 'worked_example', text_english: 'Solved Example 6: (a) (-2)^-3 × (-2)^-4 = (-2)^-7 = -1/128. (b) 3^2 × 3^-5 × 3^6 = 3^3 = 27. (c) 2^-7 ÷ 2^-3 = 2^-4 = 1/16. (d) (4^2)^-3 = 4^-6 = 1/4096. (e) 3^-3 × (-7)^-3 = (-21)^-3 = -1/9261. (f) 3^-5/4^-5 = (4/3)^5 = 1024/243.', text_hindi: 'हल उदाहरण 6: (a) (-2)^-3 × (-2)^-4 = (-2)^-7 = -1/128। (b) 3^2 × 3^-5 × 3^6 = 3^3 = 27। (c) 2^-7 ÷ 2^-3 = 2^-4 = 1/16। (d) (4^2)^-3 = 4^-6 = 1/4096। (e) 3^-3 × (-7)^-3 = (-21)^-3 = -1/9261। (f) 3^-5/4^-5 = (4/3)^5 = 1024/243।' },
    { source_item_id: 'math-matrix-ch2-solved-example-7', concept_name: 'The Five Fundamental Laws of Exponents', type: 'worked_example', text_english: 'Solved Example 7: (a) (-5/6)^2 × (-5/6)^-5 × (-5/6)^4 = (-5/6)^1 = -5/6. (b) (9/14)^-4 ÷ (9/14)^-6 = (9/14)^2 = 81/196. (c) (6/17)^-2 ÷ (6/17)^3 = (17/6)^5 = 1419857/7776. (d) ((11/15)^-4)^-3 = (11/15)^12. (e) (-3)^4 × (5/3)^4 = 625. (f) 8^-3 × 4^0 × 2^3 = 1/64.', text_hindi: 'हल उदाहरण 7: (a) (-5/6)^2 × (-5/6)^-5 × (-5/6)^4 = (-5/6)^1 = -5/6। (b) (9/14)^-4 ÷ (9/14)^-6 = (9/14)^2 = 81/196। (c) (6/17)^-2 ÷ (6/17)^3 = (17/6)^5 = 1419857/7776। (d) ((11/15)^-4)^-3 = (11/15)^12। (e) (-3)^4 × (5/3)^4 = 625। (f) 8^-3 × 4^0 × 2^3 = 1/64।' },
    { source_item_id: 'math-matrix-ch2-solved-example-8', concept_name: 'The Five Fundamental Laws of Exponents', type: 'worked_example', text_english: 'Solved Example 8: (a) ((1/3)^-2 − (1/2)^-3) ÷ (1/4)^-2 = (9 − 8) ÷ 16 = 1/16. (b) ((6/7)^2)^3 × ((6/7)^-4)^2 = (6/7)^-2 = 49/36. (c) ((3/7)^4 × (3/7)^3) ÷ (27/343)^3 = 49/9.', text_hindi: 'हल उदाहरण 8: (a) ((1/3)^-2 − (1/2)^-3) ÷ (1/4)^-2 = (9 − 8) ÷ 16 = 1/16। (b) ((6/7)^2)^3 × ((6/7)^-4)^2 = (6/7)^-2 = 49/36। (c) ((3/7)^4 × (3/7)^3) ÷ (27/343)^3 = 49/9।' },
    { source_item_id: 'math-matrix-ch2-solved-example-9', concept_name: 'The Five Fundamental Laws of Exponents', type: 'worked_example', text_english: 'Solved Example 9: (a) (8^-1 × 5^3)/2^-4 = 2^1 × 5^3 = 250. (b) (3^-5 × 10^-5 × 125)/(5^-7 × 6^-5) = 3125. (c) (a^-2 b^-3 c^-4 d^2)/(a^2 b^-4 c^-2 d^2) = b/(a^4 c^2).', text_hindi: 'हल उदाहरण 9: (a) (8^-1 × 5^3)/2^-4 = 2^1 × 5^3 = 250। (b) (3^-5 × 10^-5 × 125)/(5^-7 × 6^-5) = 3125। (c) (a^-2 b^-3 c^-4 d^2)/(a^2 b^-4 c^-2 d^2) = b/(a^4 c^2)।' },
    { source_item_id: 'math-matrix-ch2-solved-example-10', concept_name: 'Negative Integral Exponents and Reciprocals', type: 'worked_example', text_english: 'Solved Example 10: Find x such that (-3/2)^-3 ÷ x = (4/27)^-2. Rearranging gives x = (-3/2)^-3 ÷ (4/27)^-2 = -128/19683.', text_hindi: 'हल उदाहरण 10: x ज्ञात करें ताकि (-3/2)^-3 ÷ x = (4/27)^-2 हो। पुनर्व्यवस्थित करने पर x = (-3/2)^-3 ÷ (4/27)^-2 = -128/19683 मिलता है।' },
    { source_item_id: 'math-matrix-ch2-solved-example-13', concept_name: 'Standard Form and Scientific Notation', type: 'worked_example', text_english: 'Solved Example 13: Write in usual form: (a) 6.57 × 10^4 = 65,700. (b) 9.24 × 10^-5 = 0.0000924. (c) 2 × 10^-6 = 0.000002.', text_hindi: 'हल उदाहरण 13: सामान्य रूप में लिखें: (a) 6.57 × 10^4 = 65,700। (b) 9.24 × 10^-5 = 0.0000924। (c) 2 × 10^-6 = 0.000002।' },
    { source_item_id: 'math-matrix-ch2-solved-example-14', concept_name: 'Standard Form and Scientific Notation', type: 'worked_example', text_english: 'Solved Example 14: The Sun’s diameter is 1.4 × 10^9 m and Earth’s is 1.2756 × 10^7 m. Their ratio is (1.4/1.2756) × 10^2 ≈ 109.75, or about 110 to two significant figures. The printed solution rounds coarsely to approximately 100.', text_hindi: 'हल उदाहरण 14: सूर्य का व्यास 1.4 × 10^9 मीटर और पृथ्वी का 1.2756 × 10^7 मीटर है। अनुपात (1.4/1.2756) × 10^2 ≈ 109.75, अर्थात दो सार्थक अंकों तक लगभग 110 है। मुद्रित हल इसे मोटे तौर पर लगभग 100 तक पूर्णांकित करता है।' },
    { source_item_id: 'math-matrix-ch2-solved-example-15', concept_name: 'Standard Form and Scientific Notation', type: 'worked_example', text_english: 'Solved Example 15: Sun–Earth distance = 1.496 × 10^11 m and Earth–Moon distance = 3.84 × 10^8 m. During a solar eclipse, Sun–Moon distance = (1.496 × 10^3 − 3.84) × 10^8 m = 1492.16 × 10^8 m.', text_hindi: 'हल उदाहरण 15: सूर्य–पृथ्वी दूरी = 1.496 × 10^11 मीटर और पृथ्वी–चंद्रमा दूरी = 3.84 × 10^8 मीटर। सूर्यग्रहण के समय सूर्य–चंद्रमा दूरी = (1.496 × 10^3 − 3.84) × 10^8 मीटर = 1492.16 × 10^8 मीटर।' },
    { source_item_id: 'math-matrix-ch2-activity-maths-lab', concept_name: 'The Five Fundamental Laws of Exponents', type: 'guided_step', text_english: 'Maths Lab: Work in pairs using a base spinner A (1–10) and exponent spinner B (1–5). Round I: spin to choose a and m, then spin B again for n; each learner evaluates a^m × a^n and a^m ÷ a^n, adds the results, and the higher sum wins. Round II: compare a^m × a^n with (a^m)^n; the smaller difference wins. Round III: compare a^m ÷ a^n with (a^m)^n; the smaller difference wins. The learner winning the most rounds is the final winner.', text_hindi: 'गणित प्रयोगशाला: जोड़ी में आधार स्पिनर A (1–10) और घातांक स्पिनर B (1–5) का उपयोग करें। पहला दौर: a और m चुनें, फिर n के लिए B फिर घुमाएँ; प्रत्येक विद्यार्थी a^m × a^n और a^m ÷ a^n का मान निकालकर जोड़ें, अधिक योग वाला जीतता है। दूसरा दौर: a^m × a^n और (a^m)^n की तुलना करें; कम अंतर वाला जीतता है। तीसरा दौर: a^m ÷ a^n और (a^m)^n की तुलना करें; कम अंतर वाला जीतता है। सबसे अधिक दौर जीतने वाला अंतिम विजेता है।' },
    { source_item_id: 'math-matrix-ch2-activity-life-skills', concept_name: 'The Five Fundamental Laws of Exponents', type: 'guided_step', text_english: 'Life Skills and Values: Aarav saves ₹5 in the first week of January 2024, ₹15 in the second, ₹45 in the third, and triples the amount each week. Find the total saved by the end of the second week of February. Discuss the habit shown, how often you save, ways to save money, and the value reflected in consistent saving.', text_hindi: 'जीवन कौशल और मूल्य: आरव जनवरी 2024 के पहले सप्ताह में ₹5, दूसरे में ₹15, तीसरे में ₹45 बचाता है और हर सप्ताह राशि तीन गुना करता है। फरवरी के दूसरे सप्ताह के अंत तक कुल बचत ज्ञात करें। बचत की आदत, आप कितनी बार बचत करते हैं, बचत के अलग-अलग तरीके और नियमित बचत का मूल्य चर्चा करें।' },
    { source_item_id: 'math-matrix-ch2-activity-subject-integration', concept_name: 'Standard Form and Scientific Notation', type: 'guided_step', text_english: 'Subject Integration: Research the total number of satellites orbiting Earth and the average distance between Earth and those satellites. Express the distance in scientific notation for clarity.', text_hindi: 'विषय एकीकरण: पृथ्वी की परिक्रमा करने वाले उपग्रहों की कुल संख्या और पृथ्वी तथा इन उपग्रहों के बीच औसत दूरी पर शोध करें। स्पष्टता के लिए दूरी को वैज्ञानिक संकेतन में लिखें।' },
  ],
  raw_misconceptions: [
    {
      concept_name: 'Negative Integral Exponents and Reciprocals',
      name: 'Base Negation Error',
      description: 'Student confuses a negative exponent with a negative base value, assuming a negative power turns the whole number negative.',
      remediation: 'A negative sign in an exponent designates reciprocal division (multiplicative inverse), not an arithmetic negative sign on the base.',
    },
    {
      concept_name: 'The Five Fundamental Laws of Exponents',
      name: 'Base Multiplication Confusion',
      description: 'Student multiplies the bases together when applying the product law (e.g. treating 2^3 * 2^4 as 4^7).',
      remediation: 'When identical bases are multiplied, the base represents the unchanging factor; only the counts of factors (exponents) combine.',
    },
    {
      concept_name: 'The Five Fundamental Laws of Exponents',
      name: 'Quotient Exponent Division',
      description: 'Student divides exponents by each other during base division instead of subtracting them (e.g. treating 3^6 / 3^2 as 3^3).',
      remediation: 'Division of like bases cancels common factors one by one; therefore, denominator exponent count subtracts from numerator count.',
    },
    {
      concept_name: 'The Five Fundamental Laws of Exponents',
      name: 'Zero Power Value Confusion',
      description: 'Student assumes raising a non-zero base to power zero equals zero or equals the base itself.',
      remediation: 'By the quotient rule, dividing any non-zero quantity by itself yields an exponent difference of zero and an arithmetic value of 1.',
    },
    {
      concept_name: 'Standard Form and Scientific Notation',
      name: 'Non-Normalized Coefficient Error',
      description: 'Student leaves multiple non-zero digits before the decimal point (e.g. writing 35 * 10^4 instead of 3.5 * 10^5).',
      remediation: 'Standard scientific notation requires the leading decimal coefficient to contain strictly one non-zero digit to the left of the point.',
    },
  ],
  raw_assessments: [
    // ════════════════════════════════════════════════════════════════════════
    // TIER 1: WARM-UP (Foundational Powers, Sign Rules, Simple Reciprocals)
    // ════════════════════════════════════════════════════════════════════════
    {
      objective_index: 0,
      concept_name: 'Exponential Notation and Sign Rules',
      question_type: 'mcq',
      prompt: 'What is the value of \\((-1)^7\\)?',
      options: [
        { text: '-1', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '1', is_correct: false, misconception_name: 'Base Negation Error', distractor_explanation: 'Raising a negative unit base to an odd exponent retains a negative sign through unpaired factors.' },
        { text: '-7', is_correct: false, distractor_explanation: 'Exponents represent repeated multiplication of the base, not multiplication of base with exponent.' },
        { text: '7', is_correct: false, distractor_explanation: 'Repeated multiplication of unit factors cannot increase the absolute numerical magnitude above one.' },
      ],
      hints: {
        H1: 'Notice whether the exponent 7 is an even number or an odd number.',
        H2: 'An odd number of negative signs leaves one unpaired negative factor.',
        H3: 'Recall the rule: (-1) raised to any odd natural number retains its negative sign.',
        H4: 'Multiplying negative one by itself seven times pairs three negatives into positives, leaving one negative.',
      },
    },
    {
      objective_index: 0,
      concept_name: 'Exponential Notation and Sign Rules',
      question_type: 'mcq',
      prompt: 'Evaluate \\(13^3\\) into expanded standard value.',
      options: [
        { text: '2,197', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '169', is_correct: false, distractor_explanation: 'This value corresponds to 13 multiplied twice; a cube requires three factors of thirteen.' },
        { text: '39', is_correct: false, distractor_explanation: 'Multiplying base thirteen by the exponent three confuses repeated addition with repeated multiplication.' },
        { text: '2,097', is_correct: false, distractor_explanation: 'Carefully compute intermediate multiplication: 169 multiplied by 13.' },
      ],
      hints: {
        H1: 'Identify the power: 13 raised to exponent 3 means 13 * 13 * 13.',
        H2: 'First calculate the square: 13 * 13.',
        H3: 'Now multiply the product 169 by 13 once more.',
        H4: 'Compute: 169 * 10 + 169 * 3.',
      },
    },
    {
      objective_index: 0,
      concept_name: 'Exponential Notation and Sign Rules',
      question_type: 'mcq',
      prompt: 'Which power notation correctly expresses \\(-15,625\\)?',
      options: [
        { text: '\\((-25)^3\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\((-5)^6\\)', is_correct: false, misconception_name: 'Base Negation Error', distractor_explanation: 'An even exponent applied to a negative base creates a positive number rather than a negative quantity.' },
        { text: '\\((-5)^5\\)', is_correct: false, distractor_explanation: 'Multiplying five factors of negative five reaches negative 3,125.' },
        { text: '\\((-25)^2\\)', is_correct: false, distractor_explanation: 'Squaring negative twenty-five reaches positive 625.' },
      ],
      hints: {
        H1: 'Observe the negative sign in the given number -15,625.',
        H2: 'A negative power result requires an odd exponent on a negative base.',
        H3: 'Factor 15625: 25 * 25 * 25 = 25^3.',
        H4: 'Since the final value is negative, (-25)^3 preserves the negative sign.',
      },
    },
    {
      objective_index: 1,
      concept_name: 'Negative Integral Exponents and Reciprocals',
      question_type: 'mcq',
      prompt: 'What is the rational value of \\(4^{-3}\\)?',
      options: [
        { text: '\\(\\frac{1}{64}\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '-64', is_correct: false, misconception_name: 'Base Negation Error', distractor_explanation: 'A negative sign in an exponent inverts the factor into a denominator; it does not turn the product negative.' },
        { text: '64', is_correct: false, distractor_explanation: 'A negative exponent represents reciprocal division rather than positive direct power.' },
        { text: '\\(-\\frac{1}{64}\\)', is_correct: false, distractor_explanation: 'With a positive base, reciprocal inversion retains positivity without introducing negative signs.' },
      ],
      hints: {
        H1: 'Focus on the negative sign in the exponent -3.',
        H2: 'Recall the rule: a^(-n) = 1 / a^n.',
        H3: 'Invert the base into the denominator: 1 / 4^3.',
        H4: 'Calculate 4 * 4 * 4 in the denominator.',
      },
    },
    {
      objective_index: 1,
      concept_name: 'Negative Integral Exponents and Reciprocals',
      question_type: 'mcq',
      prompt: 'Express \\((\\frac{5}{3})^{-3}\\) as a rational number of the form \\(\\frac{p}{q}\\).',
      options: [
        { text: '\\(\\frac{27}{125}\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(-\\frac{27}{125}\\)', is_correct: false, misconception_name: 'Base Negation Error', distractor_explanation: 'The negative exponent indicates fractional inversion; both numerator and denominator remain positive.' },
        { text: '\\(\\frac{125}{27}\\)', is_correct: false, distractor_explanation: 'Invert the fraction to remove the negative exponent before cubing numerator and denominator.' },
        { text: '\\(\\frac{9}{15}\\)', is_correct: false, distractor_explanation: 'Exponents indicate repeated multiplication, not multiplication of numerator and denominator by three.' },
      ],
      hints: {
        H1: 'Observe the negative exponent on the rational fraction (5/3).',
        H2: 'Apply the fractional reciprocal law: (p/q)^(-n) = (q/p)^n.',
        H3: 'Swap numerator and denominator: (3/5)^3.',
        H4: 'Cube both terms: 3^3 / 5^3.',
      },
    },
    {
      objective_index: 2,
      concept_name: 'The Five Fundamental Laws of Exponents',
      question_type: 'mcq',
      prompt: 'What is the value of \\((5^0 - 7^0) \\times 3^3 \\div 6^0\\)?',
      options: [
        { text: '0', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '27', is_correct: false, misconception_name: 'Zero Power Value Confusion', distractor_explanation: 'Subtracting equal zero-power terms reduces the inner bracket to zero.' },
        { text: '1', is_correct: false, distractor_explanation: 'Parentheses evaluate to zero prior to subsequent multiplication.' },
        { text: '-27', is_correct: false, distractor_explanation: 'The term inside parentheses evaluates to 1 - 1, which completely eliminates the factor.' },
      ],
      hints: {
        H1: 'Look at the terms raised to exponent 0: 5^0 and 7^0.',
        H2: 'Recall the zero exponent law: any non-zero base to power zero equals 1.',
        H3: 'Evaluate the bracket first: (1 - 1).',
        H4: 'Multiply zero by any finite power product.',
      },
    },
    {
      objective_index: 2,
      concept_name: 'The Five Fundamental Laws of Exponents',
      question_type: 'mcq',
      prompt: 'Simplify and express as a single power: \\(9^5 \\times 6^5\\).',
      options: [
        { text: '\\(54^5\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(54^{10}\\)', is_correct: false, misconception_name: 'Base Multiplication Confusion', distractor_explanation: 'When bases differ but exponents match, exponents do not add; bases multiply under the shared exponent.' },
        { text: '\\(15^5\\)', is_correct: false, distractor_explanation: 'Bases undergo multiplication under a common power, rather than basic addition.' },
        { text: '\\(15^{10}\\)', is_correct: false, distractor_explanation: 'Both bases must multiply, and the shared exponent stays unchanged.' },
      ],
      hints: {
        H1: 'Notice that both factors share the exact same exponent 5.',
        H2: 'Recall the common power law: a^m * b^m = (ab)^m.',
        H3: 'Combine the bases under a single exponent: (9 * 6)^5.',
        H4: 'Compute the base product: 9 * 6.',
      },
    },

    // ════════════════════════════════════════════════════════════════════════
    // TIER 2: DEEP DIVE (Fraction Inversions, Unknown Multipliers, Equations)
    // ════════════════════════════════════════════════════════════════════════
    {
      objective_index: 1,
      concept_name: 'Negative Integral Exponents and Reciprocals',
      question_type: 'mcq',
      prompt: 'Simplify the sum of reciprocal powers: \\((\\frac{1}{2})^{-2} + (\\frac{1}{3})^{-2} + (\\frac{1}{4})^{-2}\\).',
      options: [
        { text: '29', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(\\frac{1}{29}\\)', is_correct: false, distractor_explanation: 'Inverting each unit fraction turns each denominator into an integer before squaring.' },
        { text: '9', is_correct: false, distractor_explanation: 'Squaring 2, 3, and 4 generates separate terms that sum together.' },
        { text: '-29', is_correct: false, misconception_name: 'Base Negation Error', distractor_explanation: 'Negative exponents invert positive fractions into positive integers; no negative signs enter.' },
      ],
      hints: {
        H1: 'Invert each fraction first: (1/a)^(-2) = a^2.',
        H2: 'Calculate the three squared integers: 2^2, 3^2, and 4^2.',
        H3: 'Add the three values: 4 + 9 + 16.',
        H4: 'Sum the numbers: 13 + 16.',
      },
    },
    {
      objective_index: 2,
      concept_name: 'The Five Fundamental Laws of Exponents',
      question_type: 'mcq',
      prompt: 'Simplify: \\([6^{-1} + (\\frac{3}{2})^{-1}]^{-1}\\).',
      options: [
        { text: '\\(\\frac{6}{5}\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(\\frac{5}{6}\\)', is_correct: false, distractor_explanation: 'Do not forget the outermost exponent -1, which inverts the bracketed sum.' },
        { text: '\\(\\frac{1}{6}\\)', is_correct: false, distractor_explanation: 'Add both reciprocal fractions using their common denominator six.' },
        { text: '6', is_correct: false, distractor_explanation: 'Compute 1/6 + 2/3 = 5/6, then take the reciprocal.' },
      ],
      hints: {
        H1: 'Evaluate the two inner terms: 6^(-1) = 1/6 and (3/2)^(-1) = 2/3.',
        H2: 'Find a common denominator to add the inner fractions: 1/6 + 4/6.',
        H3: 'The inner sum is 5/6.',
        H4: 'Apply the outer negative exponent: (5/6)^(-1).',
      },
    },
    {
      objective_index: 1,
      concept_name: 'Negative Integral Exponents and Reciprocals',
      question_type: 'mcq',
      prompt: 'By what number should \\((-6)^{-1}\\) be multiplied so that the product becomes \\(15^{-1}\\)?',
      options: [
        { text: '\\(-\\frac{2}{5}\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(\\frac{2}{5}\\)', is_correct: false, distractor_explanation: 'Dividing a positive target fraction by a negative factor leaves a negative quotient.' },
        { text: '\\(-\\frac{5}{2}\\)', is_correct: false, distractor_explanation: 'Invert the divisor when converting division to multiplication.' },
        { text: '\\(-\\frac{1}{90}\\)', is_correct: false, distractor_explanation: 'Divide the product by the known factor rather than multiplying them together.' },
      ],
      hints: {
        H1: 'Set up the equation: (-6)^(-1) * y = 15^(-1).',
        H2: 'Write with unit fractions: (-1/6) * y = 1/15.',
        H3: 'Isolate y: y = (1/15) / (-1/6) = (1/15) * (-6).',
        H4: 'Simplify -6/15 by dividing numerator and denominator by 3.',
      },
    },
    {
      objective_index: 2,
      concept_name: 'The Five Fundamental Laws of Exponents',
      question_type: 'mcq',
      prompt: 'What number should be multiplied with \\(5^{-3}\\) so that the product becomes \\(125\\)?',
      options: [
        { text: '\\(5^6\\) (or 15,625)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(5^0\\) (or 1)', is_correct: false, misconception_name: 'Base Multiplication Confusion', distractor_explanation: 'Multiplying by one retains the reciprocal fraction rather than reaching the target whole number.' },
        { text: '\\(5^3\\) (or 125)', is_correct: false, distractor_explanation: 'Multiplying opposite powers cancels to 5^0 = 1, not the target power.' },
        { text: '\\(5^{-6}\\)', is_correct: false, misconception_name: 'Base Negation Error', distractor_explanation: 'A negative power of five decreases the numerical value further into smaller decimals.' },
      ],
      hints: {
        H1: 'Write 125 as a power of 5: 125 = 5^3.',
        H2: 'Set up the equation: 5^(-3) * y = 5^3.',
        H3: 'Isolate y: y = 5^3 / 5^(-3).',
        H4: 'Apply the quotient law: 3 - (-3) = 3 + 3.',
      },
    },
    {
      objective_index: 3,
      concept_name: 'Solving Exponential Equations',
      question_type: 'mcq',
      prompt: 'Find the value of \\(x\\) in: \\((\\frac{5}{3})^{-5} \\times (\\frac{5}{3})^{-11} = (\\frac{5}{3})^{8x}\\).',
      options: [
        { text: 'x = -2', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: 'x = 2', is_correct: false, distractor_explanation: 'Summing negative exponents -5 and -11 keeps a negative sign.' },
        { text: 'x = -16', is_correct: false, distractor_explanation: 'Remember to divide the combined exponent -16 by the coefficient 8.' },
        { text: 'x = 1', is_correct: false, distractor_explanation: 'Equate the sum of left exponents directly to 8x.' },
      ],
      hints: {
        H1: 'Apply the product law to the left-hand side: add exponents -5 and -11.',
        H2: 'The combined left exponent is -5 + (-11) = -16.',
        H3: 'Since bases match, equate exponents: 8x = -16.',
        H4: 'Divide -16 by 8 to isolate x.',
      },
    },
    {
      objective_index: 3,
      concept_name: 'Solving Exponential Equations',
      question_type: 'mcq',
      prompt: 'Solve for \\(x\\): \\((-\\frac{1}{2})^{-19} \\div (-\\frac{1}{2})^8 = (-\\frac{1}{2})^{-2x + 1}\\).',
      options: [
        { text: 'x = 14', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: 'x = -14', is_correct: false, distractor_explanation: 'Be attentive with signs when isolating variable terms across the equals sign.' },
        { text: 'x = 13', is_correct: false, distractor_explanation: 'Subtracting positive 8 from -19 reaches -27; then isolate the variable term.' },
        { text: 'x = 28', is_correct: false, distractor_explanation: 'Divide -28 by -2 to find x.' },
      ],
      hints: {
        H1: 'Apply the quotient law to the LHS: subtract the denominator exponent: -19 - 8.',
        H2: 'The left-hand exponent simplifies to -27.',
        H3: 'Equate exponents: -2x + 1 = -27.',
        H4: 'Subtract 1 from both sides to get -2x = -28, then divide by -2.',
      },
    },
    {
      objective_index: 4,
      concept_name: 'Standard Form and Scientific Notation',
      question_type: 'mcq',
      prompt: 'Express the decimal \\(0.000000000086\\) in standard scientific form.',
      options: [
        { text: '\\(8.6 \\times 10^{-11}\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(86 \\times 10^{-12}\\)', is_correct: false, misconception_name: 'Non-Normalized Coefficient Error', distractor_explanation: 'The leading factor in scientific notation must have only one non-zero digit before the decimal point.' },
        { text: '\\(8.6 \\times 10^{11}\\)', is_correct: false, distractor_explanation: 'Decimals smaller than one require negative exponents of base ten.' },
        { text: '\\(0.86 \\times 10^{-10}\\)', is_correct: false, distractor_explanation: 'The coefficient must be greater than or equal to one.' },
      ],
      hints: {
        H1: 'Locate the first non-zero digit: 8.',
        H2: 'Place the decimal point immediately after 8 to get 8.6.',
        H3: 'Count how many places the decimal shifts to the right from original position to 8.6.',
        H4: 'Shifting 11 places to the right gives an exponent of -11.',
      },
    },
    {
      objective_index: 4,
      concept_name: 'Standard Form and Scientific Notation',
      question_type: 'mcq',
      prompt: 'Write \\(3.05 \\times 10^{-6}\\) in usual decimal form.',
      options: [
        { text: '0.00000305', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '0.0000305', is_correct: false, distractor_explanation: 'Ensure decimal shifts account for the single whole digit.' },
        { text: '3,050,000', is_correct: false, distractor_explanation: 'A negative exponent shifts the decimal point leftward, creating a small decimal fraction.' },
        { text: '0.000000305', is_correct: false, distractor_explanation: 'Moving 6 places left shifts past the digit 3 plus five additional zero placeholders.' },
      ],
      hints: {
        H1: 'Observe the exponent -6: move the decimal point 6 places to the left.',
        H2: 'Moving one place left passes digit 3: .305.',
        H3: 'The remaining 5 shifts require inserting 5 zeros before 3.',
        H4: 'Write the result: 0.00000305.',
      },
    },

    // ════════════════════════════════════════════════════════════════════════
    // TIER 3: BOSS CHALLENGE (Textbook MCQs, HOTS & Astronomy Applications)
    // ════════════════════════════════════════════════════════════════════════
    {
      objective_index: 2,
      concept_name: 'The Five Fundamental Laws of Exponents',
      question_type: 'mcq',
      prompt: 'Evaluate the expression: \\(\\frac{2^{2001} + 2^{1999}}{2^{2000} - 2^{1999}}\\).',
      options: [
        { text: '5', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '2', is_correct: false, distractor_explanation: 'Factor out the lowest power 2^1999 from both numerator and denominator.' },
        { text: '\\(2^{1000} + 1\\)', is_correct: false, distractor_explanation: 'Exponents cannot be subtracted across fraction bars without factoring out common base multiples.' },
        { text: '10', is_correct: false, distractor_explanation: 'Calculate bracket terms after factoring: (4 + 1) / (2 - 1).' },
      ],
      hints: {
        H1: 'Notice the common base 2 and very close exponent values: 1999, 2000, 2001.',
        H2: 'Factor out 2^1999 from both numerator and denominator.',
        H3: 'Numerator becomes 2^1999 * (2^2 + 1) = 2^1999 * (4 + 1).',
        H4: 'Denominator becomes 2^1999 * (2^1 - 1) = 2^1999 * 1. Cancel common factor 2^1999.',
      },
    },
    {
      objective_index: 1,
      concept_name: 'Negative Integral Exponents and Reciprocals',
      question_type: 'mcq',
      prompt: 'When simplified, the algebraic expression \\(x^{-1} + y^{-1}\\) is equal to:',
      options: [
        { text: '\\(\\frac{x + y}{xy}\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: 'x + y', is_correct: false, distractor_explanation: 'Negative exponents invert variables into denominators before addition.' },
        { text: 'xy', is_correct: false, distractor_explanation: 'Fraction addition retains separate denominator relationships.' },
        { text: '\\(\\frac{1}{xy}\\)', is_correct: false, distractor_explanation: 'Adding 1/x + 1/y requires cross-multiplying numerators over common denominator xy.' },
      ],
      hints: {
        H1: 'Rewrite each term with positive exponents: 1/x + 1/y.',
        H2: 'Identify the common denominator for adding fractions with denominators x and y.',
        H3: 'Convert each fraction: y/(xy) + x/(xy).',
        H4: 'Combine the numerators over the common denominator.',
      },
    },
    {
      objective_index: 0,
      concept_name: 'Exponential Notation and Sign Rules',
      question_type: 'mcq',
      prompt: 'Find the numerical value of \\(x + x(x^x)\\) when \\(x = 2\\).',
      options: [
        { text: '10', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '16', is_correct: false, distractor_explanation: 'Follow order of operations: evaluate innermost power 2^2 first, then multiply by 2, then add 2.' },
        { text: '18', is_correct: false, distractor_explanation: 'Carefully compute: 2 + 2 * (2^2) = 2 + 2 * 4.' },
        { text: '36', is_correct: false, distractor_explanation: 'Do not add the outer terms before completing multiplication.' },
      ],
      hints: {
        H1: 'Substitute x = 2 into the expression: 2 + 2 * (2^2).',
        H2: 'Evaluate the exponent first: 2^2 = 4.',
        H3: 'Multiply the outer factor: 2 * 4 = 8.',
        H4: 'Complete the addition: 2 + 8.',
      },
    },
    {
      objective_index: 1,
      concept_name: 'Negative Integral Exponents and Reciprocals',
      question_type: 'mcq',
      prompt: 'What is the multiplicative inverse of \\(10^{-100}\\)?',
      options: [
        { text: '\\(10^{100}\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(10^{-100}\\)', is_correct: false, distractor_explanation: 'Multiplying a number by itself does not equal 1 unless the power exponent cancels to zero.' },
        { text: '\\(-10^{100}\\)', is_correct: false, misconception_name: 'Base Negation Error', distractor_explanation: 'The multiplicative inverse inverts exponent sign; it never negates the base.' },
        { text: '\\(10^{-50}\\)', is_correct: false, distractor_explanation: 'Adding -50 to -100 does not equal zero.' },
      ],
      hints: {
        H1: 'Recall the definition: the product of a number and its multiplicative inverse must equal 1.',
        H2: 'Set up: 10^(-100) * 10^k = 10^0 = 1.',
        H3: 'Apply the product law: -100 + k = 0.',
        H4: 'Solve for k: k = 100.',
      },
    },
    {
      objective_index: 2,
      concept_name: 'The Five Fundamental Laws of Exponents',
      question_type: 'mcq',
      prompt: 'Evaluate: \\((3^2)^3 + (\\frac{2}{3})^0 + 3^5\\).',
      options: [
        { text: '973', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '930', is_correct: false, distractor_explanation: 'Ensure all three terms are calculated and included in the sum.' },
        { text: '932', is_correct: false, distractor_explanation: 'Check the zero power term: any non-zero fraction to power zero equals one.' },
        { text: '950', is_correct: false, distractor_explanation: 'Sum the three evaluated components accurately without omitting terms.' },
      ],
      hints: {
        H1: 'Apply power of power to the first term: (3^2)^3 = 3^(2 * 3) = 3^6.',
        H2: 'Evaluate 3^6: 729.',
        H3: 'Apply zero power rule: (2/3)^0 = 1. Evaluate 3^5: 243.',
        H4: 'Add: 729 + 1 + 243.',
      },
    },
    {
      objective_index: 3,
      concept_name: 'Solving Exponential Equations',
      question_type: 'mcq',
      prompt: 'If \\(\\frac{10}{3} \\times 3^x - 3^{x-1} = 81\\), find the value of \\(x\\).',
      options: [
        { text: 'x = 3', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: 'x = 2', is_correct: false, distractor_explanation: 'Factor out the common variable term before equating with the target power.' },
        { text: 'x = 4', is_correct: false, distractor_explanation: 'Equate exponents after converting both sides to identical bases.' },
        { text: 'x = 1', is_correct: false, distractor_explanation: 'Carefully isolate the variable term across the equals sign.' },
      ],
      hints: {
        H1: 'Express 3^(x-1) as (3^x) / 3 = (1/3) * 3^x.',
        H2: 'Factor out 3^x: (10/3 - 1/3) * 3^x = (9/3) * 3^x = 3 * 3^x.',
        H3: 'Simplify the LHS: 3^(x + 1). Write 81 as base 3: 81 = 3^4.',
        H4: 'Equate exponents: x + 1 = 4, so x = 4 - 1.',
      },
    },
    {
      objective_index: 2,
      concept_name: 'The Five Fundamental Laws of Exponents',
      question_type: 'mcq',
      prompt: 'What is the reciprocal of the rational number \\((\\frac{3}{2})^{-2} \\div (\\frac{1}{3})^{-3}\\)?',
      options: [
        { text: '\\(\\frac{243}{4}\\)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(\\frac{4}{243}\\)', is_correct: false, distractor_explanation: 'Remember to invert the final rational quotient to obtain the requested reciprocal.' },
        { text: '\\(\\frac{241}{4}\\)', is_correct: false, distractor_explanation: 'Calculate 9 * 27 for the inverted product.' },
        { text: '\\(\\frac{240}{4}\\)', is_correct: false, distractor_explanation: 'Carefully compute (2/3)^2 / 3^3 = (4/9) / 27.' },
      ],
      hints: {
        H1: 'Simplify (3/2)^(-2) = (2/3)^2 = 4/9.',
        H2: 'Simplify (1/3)^(-3) = 3^3 = 27.',
        H3: 'Divide: (4/9) / 27 = 4 / (9 * 27) = 4/243.',
        H4: 'Take the reciprocal of 4/243 by inverting numerator and denominator.',
      },
    },
    {
      objective_index: 3,
      concept_name: 'Solving Exponential Equations',
      question_type: 'mcq',
      prompt: 'If \\([((\\frac{1}{3})^{-1} - (\\frac{1}{4})^{-1})^{-1}]^m = 1\\), what is the least positive integral value of \\(m\\)?',
      options: [
        { text: 'm = 2', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: 'm = 1', is_correct: false, distractor_explanation: 'An odd power on base -1 preserves a negative value.' },
        { text: 'm = 0', is_correct: false, distractor_explanation: 'The problem explicitly asks for the least positive integer (greater than zero).' },
        { text: 'm = 3', is_correct: false, distractor_explanation: 'An odd exponent preserves the negative sign on base -1.' },
      ],
      hints: {
        H1: 'Evaluate the inner terms: (1/3)^(-1) = 3 and (1/4)^(-1) = 4.',
        H2: 'Subtract inside brackets: 3 - 4 = -1.',
        H3: 'Take reciprocal: (-1)^(-1) = -1. The expression simplifies to (-1)^m = 1.',
        H4: 'Recall that (-1) raised to an even power equals 1; the smallest positive even integer is 2.',
      },
    },
    {
      objective_index: 2,
      concept_name: 'The Five Fundamental Laws of Exponents',
      question_type: 'mcq',
      prompt: 'Prove the algebraic identity: \\(\\frac{1}{1 + x^{q-p}} + \\frac{1}{1 + x^{p-q}}\\). What does it simplify to?',
      options: [
        { text: '1', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '0', is_correct: false, distractor_explanation: 'Express the negative index difference as a reciprocal fraction to establish matching denominators.' },
        { text: '\\(x^{p+q}\\)', is_correct: false, distractor_explanation: 'Multiply numerator and denominator of the second term by x^q to align denominators.' },
        { text: '2', is_correct: false, distractor_explanation: 'Summing the unified fractions forms (x^p + x^q) / (x^p + x^q) = 1.' },
      ],
      hints: {
        H1: 'Express x^(p-q) as 1 / x^(q-p).',
        H2: 'Substitute into the second fraction: 1 / [1 + 1 / x^(q-p)].',
        H3: 'Multiply numerator and denominator of second term by x^(q-p).',
        H4: 'Add the two fractions with identical denominators: [1 + x^(q-p)] / [1 + x^(q-p)].',
      },
    },
    {
      objective_index: 4,
      concept_name: 'Standard Form and Scientific Notation',
      question_type: 'mcq',
      prompt: 'A spacecraft travels at \\(12\\text{ km/s} = 1.2 \\times 10^4\\text{ m/s}\\). If distance to Moon is \\(3.48 \\times 10^8\\text{ m}\\), how much time is required to reach the Moon?',
      options: [
        { text: '\\(2.9 \\times 10^4\\text{ s}\\) (approx 8 hours 3.3 minutes)', is_correct: true, distractor_explanation: 'Correct choice.' },
        { text: '\\(2.9 \\times 10^3\\text{ s}\\)', is_correct: false, distractor_explanation: 'Divide exponents of ten: 10^8 / 10^4 = 10^(8 - 4) = 10^4.' },
        { text: '\\(4.176 \\times 10^{12}\\text{ s}\\)', is_correct: false, distractor_explanation: 'Time equals distance divided by speed, not distance multiplied by speed.' },
        { text: '\\(2.9 \\times 10^5\\text{ s}\\)', is_correct: false, distractor_explanation: 'Direct coefficient division leaves the base value unchanged while powers of ten subtract directly.' },
      ],
      hints: {
        H1: 'Apply the physics formula: Time = Distance / Speed.',
        H2: 'Divide coefficients: 3.48 / 1.2.',
        H3: 'Divide powers of ten: 10^8 / 10^4 = 10^(8 - 4).',
        H4: 'Combine: 2.9 * 10^4 seconds.',
      },
    },
    ...additionalWarmupAssessments,
    ...additionalTextbookMcqAssessments,
    ...additionalExercise2aAssessments,
    ...additionalHotsAssessments,
    ...additionalDeepDiveAssessments,
  ],
  word_map: {
    "exponent": "घातांक (एक्सपोनेंट)",
    "exponents": "घातांक (एक्सपोनेंट्स)",
    "power": "घात (पावर)",
    "powers": "घातें (पावर्स)",
    "base": "आधार (बेस)",
    "bases": "आधार (बेसेस)",
    "integral": "पूर्णांक (इंटीग्रल)",
    "reciprocal": "व्युत्क्रम (रेसिप्रोकल)",
    "reciprocals": "व्युत्क्रम (रेसिप्रोकल्स)",
    "multiplicative": "गुणात्मक (मल्टीप्लिकेटिव)",
    "inverse": "प्रतिलोम (इन्वर्स)",
    "product": "गुणनफल (प्रोडक्ट)",
    "quotient": "भागफल (कोटिएंट)",
    "law": "नियम (लॉ)",
    "laws": "नियम (लॉज़)",
    "notation": "संकेतन (नोटेशन)",
    "scientific": "वैज्ञानिक (साइंटिफिक)",
    "standard": "मानक रूप (स्टैंडर्ड)",
    "form": "रूप (फॉर्म)",
    "decimal": "दशमलव (डेसिमल)",
    "equation": "समीकरण (इक्वेशन)",
    "equations": "समीकरण (इक्वेशन्स)",
    "variable": "चर (वेरिएबल)",
    "simplify": "सरल करना (सिम्प्लिफाई)",
    "evaluate": "मान ज्ञात करना (इवैल्यूएट)",
    "express": "व्यक्त करना (एक्सप्रेस)",
    "rational": "परिमेय संख्या (रैशनल)",
    "positive": "धनात्मक (पॉज़िटिव)",
    "negative": "ऋणात्मक (नेगेटिव)",
    "numerator": "अंश (न्यूमरेटर)",
    "denominator": "हर (डिनॉमिनेटर)",
    "multiply": "गुणा करना (मल्टीप्लाई)",
    "divide": "भाग देना (डिवाइड)",
    "add": "जोड़ना (ऐड)",
    "subtract": "घटाना (सबट्रैक्ट)",
    "spinner": "चकरी (स्पिनर)",
    "arena": "अखाड़ा / मैदान (एरीना)",
    "battle": "मुकाबला (बैटल)",
  },
};

export function compileExponentsPowersChapter() {
  console.log('='.repeat(80));
  console.log(' COMPILING CLASS 8 MATHEMATICS: EXPONENTS AND POWERS (CHAPTER 2)');
  console.log('='.repeat(80));

  console.log('\n1. Normalizing Agent Proposals into Canonical Prototype IR...');
  const { canonicalIR, validationErrors } = IRAssembler.assemble(exponentsPowersProposal);

  if (validationErrors.length > 0) {
    console.error('ERROR: Assembled Canonical IR validation failed:', validationErrors);
    process.exit(1);
  }
  console.log('   ✓ Assembled Canonical IR successfully. Entity IDs namespaced.');

  console.log('\n2. Validating Canonical IR Schema & Invariants...');
  const validation = validateCanonicalIR(canonicalIR);
  if (!validation.valid) {
    console.error('ERROR: Schema validation failed:', validation.errors);
    process.exit(1);
  }
  console.log('   ✓ Canonical IR v1.1.0 Strict Schema: PASS');
  console.log('   ✓ Basic schema spoiler heuristic: PASS (adversarial answer-leakage review remains required)');
  console.log('   ✓ 4-Tier Scaffolding Hints: PASS');
  console.log('   • Offline runtime and zero-network verification: PENDING');
  console.log('   ✓ Experience acceptance metadata: PASS (runtime criteria still require verification)');

  console.log('\n3. Running V6 Compiler...');
  const sourcePdfDir = path.resolve(__dirname, '../../content/pdfs');
  const compiled = V6Compiler.compilePair(canonicalIR, {
    sourcePdfPaths: {
      'math-matrix-8-ch2-part-1': path.join(sourcePdfDir, 'MDS grade 8th math exponent part 1.pdf'),
      'math-matrix-8-ch2-part-2': path.join(sourcePdfDir, 'MDS grade 8th math exponent part 2.pdf'),
    },
    requireFullSourceCoverage: true,
  });
  if (compiled.errors.length > 0) {
    console.error('ERROR: V6 Compilation Failed:', compiled.errors);
    process.exit(1);
  }
  console.log('   Source coverage:', compiled.sourceCoverage.status, '(' + compiled.sourceCoverage.fully_covered + '/' + compiled.sourceCoverage.total_items + ' mapped); source PDF hash:', compiled.sourceCoverage.source_hash_status);
  console.log('   English/Hindi LLE coverage:', compiled.lleCoverage.status, '(' + compiled.lleCoverage.coverage_percent + '%)');
  console.log('   ✓ Standalone learning + assessment packages generated (' + compiled.learningHtml.length + ' + ' + compiled.assessmentHtml.length + ' bytes)');

  const chaptersDir = path.resolve(__dirname, '../../chapters');
  if (!fs.existsSync(chaptersDir)) {
    fs.mkdirSync(chaptersDir, { recursive: true });
  }

  const learningPath = path.resolve(chaptersDir, 'ExponentsPowers_Class8_learning.html');
  fs.writeFileSync(learningPath, compiled.learningHtml, 'utf-8');
  console.log('   ✓ Written learning HTML to:', learningPath);

  const assessmentPath = path.resolve(chaptersDir, 'ExponentsPowers_Class8_assessment.html');
  fs.writeFileSync(assessmentPath, compiled.assessmentHtml, 'utf-8');
  console.log('   ✓ Written assessment HTML to:', assessmentPath);

  const irPath = path.resolve(chaptersDir, 'ExponentsPowers_Class8_canonical_ir.json');
  fs.writeFileSync(irPath, JSON.stringify(canonicalIR, null, 2), 'utf-8');
  console.log('   ✓ Written Canonical IR to:', irPath);

  // Generate Teacher HIL Proposal
  const proposalPath = path.resolve(chaptersDir, 'ExponentsPowers_Class8.proposal.md');
  const proposalContent = `# AASHA AIOS — Teacher Review Proposal
**Chapter**: Class 8 Mathematics — Exponents and Powers (\`c8_math_exponents_powers\`)
**Status**: Draft only — source verification, coverage reconciliation, runtime checks, and teacher review are pending.

## Evidence available

- The Canonical IR assembled by this script.
- The source hash supplied to the compiler (must be the digest of the actual textbook PDF).
- The capability match evidence embedded in the generated standalone files.

## Review still required

- Confirm the exact textbook edition and source PDF; map every section, example, activity, and exercise to generated content.
- Review the learner artifact and assessment artifact separately, including English/Hindi language quality and answer-feedback behavior.
- Verify any proposed reusable foundation's provenance, license, offline operation, accessibility, and adaptation scope. A catalog entry is not approval.
- Run offline, touch-target, browser, size, TEAS, and no-answer-leakage checks before distribution.
- Record the teacher/reviewer decision through the governed approval path.

इस सामग्री को अभी पूर्ण अध्याय, प्रमाणित मूल्यांकन, या स्वीकृत संसाधन नहीं माना गया है। स्रोत-पुस्तक और कवरेज की समीक्षा आवश्यक है।
`;
  fs.writeFileSync(proposalPath, proposalContent, 'utf-8');
  console.log('   ✓ Written Teacher HIL Proposal to:', proposalPath);

  console.log('\n=== EXPONENTS AND POWERS CLASS 8 COMPILED SUCCESSFULLY ===\n');
}

if (require.main === module || process.argv[1]?.includes('compile_exponents_powers_class8')) {
  compileExponentsPowersChapter();
}
