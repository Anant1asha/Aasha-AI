/**
 * Annanth Aasha Foundation - Multi-Chapter Universal Curriculum Catalog
 * Version: 2.1.0
 * 
 * Supports universal boards, classes 1-10, mathematics, science, and 3-Tier
 * Gamified Assessment (Warm-up -> Deep Dive -> Boss Challenge) with L-Truth 0-spoiler guarantees.
 */

export const CHAPTERS_CATALOG = [
  // ─────────────────────────────────────────────────────────────────────────────
  // CHAPTER 1: Class 6 Mathematics — Fractions
  // Foundation: F04 PhET Fraction Bar (Interactive SVG/Manipulative)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'fractions-demo',
    title: 'Fractions — Understanding Parts of a Whole',
    grade: 6,
    subject: 'Mathematics',
    foundation: 'F04_PHET',
    language_defaults: ['en', 'hi'],
    schema_version: 1,
    nodes: [
      {
        id: 'fraction_parts',
        title: 'Fraction Parts (Numerator & Denominator)',
        objective: 'Identify numerator and denominator and explain what each represents in a partitioned whole.',
        dependencies: [],
        steps: [
          {
            type: 'explain',
            text: 'A fraction describes equal parts of a whole. The denominator tells how many equal parts make the whole; the numerator tells how many equal parts are selected.'
          },
          {
            type: 'visual',
            visual: 'fraction',
            data: { total: 5, active: 3 }
          },
          {
            type: 'explain',
            text: 'When we partition an object into 5 equal parts and take 3 parts, we write \\( \\frac{3}{5} \\).'
          }
        ],
        words: {
          fraction: 'अंश',
          numerator: 'अंश संख्या',
          denominator: 'हर',
          whole: 'पूर्ण वस्तु',
          equal: 'बराबर'
        }
      },
      {
        id: 'equivalent',
        title: 'Equivalent Fractions',
        objective: 'Recognize fractions that represent the exact same quantity despite different numerical terms.',
        dependencies: ['fraction_parts'],
        steps: [
          {
            type: 'explain',
            text: 'Equivalent fractions look different numerically but represent the exact same quantity, because multiplying or dividing both terms by the same non-zero number does not alter the underlying value.'
          },
          {
            type: 'visual',
            visual: 'bar',
            data: { label: 'Equivalent representations of 1/2 and 2/4', percent: 50 }
          },
          {
            type: 'explain',
            text: 'Notice that \\( \\frac{1}{2} = \\frac{2}{4} = \\frac{3}{6} \\).'
          }
        ],
        words: {
          equivalent: 'समतुल्य',
          quantity: 'मात्रा',
          represent: 'दर्शाना',
          alter: 'बदलना'
        }
      },
      {
        id: 'addition',
        title: 'Adding Fractions with Like Denominators',
        objective: 'Add numerators while keeping the common denominator unchanged.',
        dependencies: ['equivalent'],
        steps: [
          {
            type: 'explain',
            text: 'When denominators are the same, the parts are of identical size. Therefore, add the numerators directly and keep the denominator unchanged.'
          },
          {
            type: 'visual',
            visual: 'fraction',
            data: { total: 6, active: 4 }
          },
          {
            type: 'explain',
            text: 'For example: \\( \\frac{1}{5} + \\frac{2}{5} = \\frac{1+2}{5} = \\frac{3}{5} \\).'
          }
        ],
        words: {
          denominator: 'हर',
          numerator: 'अंश',
          identical: 'समान आकार के',
          unchanged: 'अपरिवर्तित'
        }
      }
    ],
    questions: [
      // Tier 1: Warm-up
      {
        id: 'F_W1',
        node_id: 'fraction_parts',
        tier: 1,
        tier_name: 'Warm-up',
        prompt: 'In the fraction 3/5, which number represents the numerator?',
        options: ['3', '5', '8', '2'],
        correct_index: 0,
        explanation: 'The top number of a fraction represents the numerator.',
        misconception: 'Confusing the top number (numerator) with the bottom number (denominator).'
      },
      {
        id: 'F_W2',
        node_id: 'fraction_parts',
        tier: 1,
        tier_name: 'Warm-up',
        prompt: 'In the fraction 2/7, what does the number 7 indicate?',
        options: ['Total equal parts making the whole', 'Number of parts selected', 'Total students in class', 'Difference of parts'],
        correct_index: 0,
        explanation: 'The denominator always defines how many equal parts the whole is partitioned into.',
        misconception: 'Interpreting the denominator as the number of shaded parts.'
      },
      // Tier 2: Deep Dive (Manipulative Linked)
      {
        id: 'F_D1',
        node_id: 'equivalent',
        tier: 2,
        tier_name: 'Deep Dive',
        prompt: 'Which fraction represents the exact same quantity as 1/2?',
        options: ['2/4', '1/3', '3/5', '2/5'],
        correct_index: 0,
        explanation: 'Multiplying numerator and denominator of 1/2 by 2 produces 2/4.',
        misconception: 'Comparing numeral digits directly without scaling the underlying ratio.'
      },
      {
        id: 'F_D2',
        node_id: 'addition',
        tier: 2,
        tier_name: 'Deep Dive',
        prompt: 'Compute the sum: 1/5 + 2/5 = ?',
        options: ['3/5', '3/10', '2/5', '1/5'],
        correct_index: 0,
        explanation: 'Add numerators (1 + 2 = 3) while keeping the common denominator 5.',
        misconception: 'Adding both the numerators and the denominators together.'
      },
      // Tier 3: Boss Challenge
      {
        id: 'F_B1',
        node_id: 'addition',
        tier: 3,
        tier_name: 'Boss Challenge',
        prompt: 'If a strip has 6 equal divisions and 4 divisions are shaded, what is the simplest equivalent fraction?',
        options: ['2/3', '4/6', '1/2', '5/6'],
        correct_index: 0,
        explanation: 'Dividing 4 and 6 by their greatest common factor (2) gives 2/3.',
        misconception: 'Stopping at unsimplified form or subtracting terms rather than reducing factors.'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CHAPTER 2: Class 8 Mathematics — Rational Numbers
  // Foundation: F08 Physics Notebook / Number Line Density
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'rational-numbers',
    title: 'Rational Numbers — Properties & Density',
    grade: 8,
    subject: 'Mathematics',
    foundation: 'F08_PHYSICS_NOTEBOOK',
    language_defaults: ['en', 'hi'],
    schema_version: 1,
    nodes: [
      {
        id: 'rational_def',
        title: 'Definition of Rational Numbers',
        objective: 'Define a rational number as p/q where p, q are integers and q != 0.',
        dependencies: [],
        steps: [
          {
            type: 'explain',
            text: 'A rational number is any number that can be written in the form \\( \\frac{p}{q} \\), where p and q are integers and \\( q \\neq 0 \\).'
          },
          {
            type: 'visual',
            visual: 'fraction',
            data: { total: 4, active: 3 }
          },
          {
            type: 'explain',
            text: 'Because division by zero is undefined, the denominator q can never be zero.'
          }
        ],
        words: {
          rational: 'परिमेय संख्या',
          integer: 'पूर्णांक',
          denominator: 'हर',
          undefined: 'अपरिभाषित'
        }
      },
      {
        id: 'closure_property',
        title: 'Closure and Commutativity',
        objective: 'Apply closure and commutative properties under addition and multiplication.',
        dependencies: ['rational_def'],
        steps: [
          {
            type: 'explain',
            text: 'Rational numbers are closed under addition, subtraction, and multiplication. Furthermore, addition is commutative: \\( a + b = b + a \\).'
          },
          {
            type: 'visual',
            visual: 'bar',
            data: { label: 'Commutative balance: a + b = b + a', percent: 100 }
          }
        ],
        words: {
          closure: 'संवृत गुणधर्म',
          commutative: 'क्रमविनिमेय',
          addition: 'योग',
          multiplication: 'गुणा'
        }
      },
      {
        id: 'density_property',
        title: 'Density on the Number Line',
        objective: 'Find rational numbers between any two given rational numbers.',
        dependencies: ['closure_property'],
        steps: [
          {
            type: 'explain',
            text: 'Between any two distinct rational numbers, there exist infinitely many rational numbers. We can find intermediate values by taking the mean: \\( \\frac{a + b}{2} \\).'
          },
          {
            type: 'visual',
            visual: 'bar',
            data: { label: 'Infinite density between points', percent: 75 }
          }
        ],
        words: {
          density: 'सघनता',
          infinitely: 'अनन्त रूप से',
          intermediate: 'मध्यवर्ती मान',
          mean: 'औसत'
        }
      }
    ],
    questions: [
      // Tier 1: Warm-up
      {
        id: 'RN_W1',
        node_id: 'rational_def',
        tier: 1,
        tier_name: 'Warm-up',
        prompt: 'In the definition of rational number p/q, what condition must q satisfy?',
        options: ['q ≠ 0', 'q = 0', 'q must be 1', 'q must be positive only'],
        correct_index: 0,
        explanation: 'The denominator q can never be zero because division by zero is undefined.',
        misconception: 'Believing the denominator can be zero or must be strictly positive.'
      },
      {
        id: 'RN_W2',
        node_id: 'closure_property',
        tier: 1,
        tier_name: 'Warm-up',
        prompt: 'Which arithmetic operation does NOT guarantee closure for all rational numbers?',
        options: ['Division (due to zero)', 'Addition', 'Multiplication', 'Subtraction'],
        correct_index: 0,
        explanation: 'Division by zero is undefined, so rational numbers are not closed under division unless zero is excluded.',
        misconception: 'Assuming division is always defined for any rational denominator.'
      },
      // Tier 2: Deep Dive
      {
        id: 'RN_D1',
        node_id: 'closure_property',
        tier: 2,
        tier_name: 'Deep Dive',
        prompt: 'For any two rational numbers a and b, what does the commutative property of addition state?',
        options: ['a + b = b + a', 'a - b = b - a', 'a ÷ b = b ÷ a', 'a + b = a × b'],
        correct_index: 0,
        explanation: 'Addition of rational numbers can be done in any order without changing the sum.',
        misconception: 'Assuming subtraction or division is also commutative.'
      },
      // Tier 3: Boss Challenge
      {
        id: 'RN_B1',
        node_id: 'density_property',
        tier: 3,
        tier_name: 'Boss Challenge',
        prompt: 'How many rational numbers exist strictly between 1/4 and 1/2?',
        options: ['Infinitely many', 'Only 1', 'Exactly 10', 'None'],
        correct_index: 0,
        explanation: 'The density property states that between any two rational numbers, an infinite number of rational numbers exist.',
        misconception: 'Treating rational numbers like discrete integers that have finite gaps.'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CHAPTER 3: Class 8 Science — Chemical Effects of Electric Current
  // Foundation: F03 All Science Sims (Circuit & Conductor Lab)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'electric-circuits',
    title: 'Electric Current & Chemical Effects',
    grade: 8,
    subject: 'Science',
    foundation: 'F03_ALL_SCIENCE',
    language_defaults: ['en', 'hi'],
    schema_version: 1,
    nodes: [
      {
        id: 'circuit_basics',
        title: 'Complete Circuit & Flow of Current',
        objective: 'Demonstrate that current requires a closed, unbroken conductive loop to flow.',
        dependencies: [],
        steps: [
          {
            type: 'explain',
            text: 'An electric current requires an unbroken, closed loop connecting the battery terminals through conductive wires for the bulb to glow.'
          },
          {
            type: 'visual',
            visual: 'circuit',
            data: { switchClosed: false, materialType: 'copper' }
          },
          {
            type: 'explain',
            text: 'Notice that opening the switch creates an air gap, breaking the circuit so current cannot flow.'
          }
        ],
        words: {
          circuit: 'विद्युत परिपथ',
          current: 'विद्युत धारा',
          conductor: 'सुचालक',
          insulator: 'कुचालक'
        }
      },
      {
        id: 'conductors_insulators',
        title: 'Conductors and Insulators',
        objective: 'Differentiate materials that permit electric current from those that resist it.',
        dependencies: ['circuit_basics'],
        steps: [
          {
            type: 'explain',
            text: 'Metals like copper and iron allow electric current to pass freely and are called conductors. Materials like rubber and wood resist current and are called insulators.'
          },
          {
            type: 'visual',
            visual: 'circuit',
            data: { switchClosed: true, materialType: 'copper' }
          }
        ],
        words: {
          copper: 'तांबा',
          rubber: 'रबर',
          iron: 'लोहा',
          wood: 'लकड़ी'
        }
      }
    ],
    questions: [
      // Tier 1: Warm-up
      {
        id: 'EC_W1',
        node_id: 'circuit_basics',
        tier: 1,
        tier_name: 'Warm-up',
        prompt: 'What happens to the current in a circuit when the switch is opened?',
        options: ['Current stops flowing completely', 'Current flows backwards', 'Current increases rapidly', 'Bulb glows brighter'],
        correct_index: 0,
        explanation: 'An open switch breaks the continuity of the circuit, stopping the flow of charge.',
        misconception: 'Believing current can jump through open air gaps at low battery voltage.'
      },
      // Tier 2: Deep Dive
      {
        id: 'EC_D1',
        node_id: 'conductors_insulators',
        tier: 2,
        tier_name: 'Deep Dive',
        prompt: 'Which of the following test materials inserted into the circuit gap will permit the bulb to glow?',
        options: ['Iron nail', 'Rubber eraser', 'Dry wooden stick', 'Plastic ruler'],
        correct_index: 0,
        explanation: 'Iron is a good conductor of electricity, allowing current to complete the circuit.',
        misconception: 'Classifying plastic or rubber as electrical conductors.'
      },
      // Tier 3: Boss Challenge
      {
        id: 'EC_B1',
        node_id: 'conductors_insulators',
        tier: 3,
        tier_name: 'Boss Challenge',
        prompt: 'If the switch is closed and a copper wire is connected, but the bulb still does NOT glow, what is the most probable physical fault?',
        options: ['The bulb filament is broken/fused', 'Copper is an insulator', 'Battery has infinite charge', 'Current has no direction'],
        correct_index: 0,
        explanation: 'A broken filament inside the bulb creates an open circuit internally, halting current flow.',
        misconception: 'Assuming copper resists current or that electricity disappears without a gap.'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CHAPTER 4: Class 8 Mathematics — Algebraic Expressions & Identities
  // Foundation: F08 Physics Notebook Area Model / Algebra Tiles
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'algebraic-expressions',
    title: 'Algebraic Expressions & Identities',
    grade: 8,
    subject: 'Mathematics',
    foundation: 'F08_PHYSICS_NOTEBOOK',
    language_defaults: ['en', 'hi'],
    schema_version: 1,
    nodes: [
      {
        id: 'terms_factors',
        title: 'Terms, Factors and Coefficients',
        objective: 'Identify variables, constants, and terms in an algebraic expression.',
        dependencies: [],
        steps: [
          {
            type: 'explain',
            text: 'An algebraic expression is built from terms. A term is a product of factors: numerical coefficients and algebraic variables.'
          },
          {
            type: 'visual',
            visual: 'algebra_tile',
            data: { labelA: 'x', labelB: '2', labelC: 'x', labelD: '3' }
          },
          {
            type: 'explain',
            text: 'In the expression \\( 4x + 7 \\), 4x and 7 are terms, with 4 being the numerical coefficient of x.'
          }
        ],
        words: {
          expression: 'बीजीय व्यंजक',
          variable: 'चर',
          coefficient: 'गुणांक',
          term: 'पद'
        }
      },
      {
        id: 'area_identity',
        title: 'Geometric Area Representation of (x+a)(x+b)',
        objective: 'Visualize polynomial multiplication using rectangular area decomposition.',
        dependencies: ['terms_factors'],
        steps: [
          {
            type: 'explain',
            text: 'The product of two binomials corresponds to the total area of a rectangle partitioned into 4 smaller sub-rectangles: \\( (x + a)(x + b) = x^2 + (a + b)x + ab \\).'
          },
          {
            type: 'visual',
            visual: 'algebra_tile',
            data: { labelA: 'x', labelB: '2', labelC: 'x', labelD: '3' }
          }
        ],
        words: {
          area: 'क्षेत्रफल',
          identity: 'सर्वसमिका',
          binomial: 'द्विपद',
          product: 'गुणनफल'
        }
      }
    ],
    questions: [
      // Tier 1: Warm-up
      {
        id: 'AE_W1',
        node_id: 'terms_factors',
        tier: 1,
        tier_name: 'Warm-up',
        prompt: 'In the term -7xy, what is the numerical coefficient?',
        options: ['-7', '7', 'xy', '-x'],
        correct_index: 0,
        explanation: 'The constant multiplier including its sign is the numerical coefficient.',
        misconception: 'Omitting the negative sign or confusing the variable part with the coefficient.'
      },
      // Tier 2: Deep Dive
      {
        id: 'AE_D1',
        node_id: 'area_identity',
        tier: 2,
        tier_name: 'Deep Dive',
        prompt: 'Expand the product using the identity: (x + 2)(x + 3) = ?',
        options: ['x² + 5x + 6', 'x² + 6x + 5', 'x² + 5x + 5', '2x + 5'],
        correct_index: 0,
        explanation: 'x² + (2 + 3)x + (2 × 3) = x² + 5x + 6.',
        misconception: 'Multiplying the constant terms to get 6 but forgetting the cross terms (2x and 3x).'
      },
      // Tier 3: Boss Challenge
      {
        id: 'AE_B1',
        node_id: 'area_identity',
        tier: 3,
        tier_name: 'Boss Challenge',
        prompt: 'If an area tile model has sub-regions of x², 4x, 3x, and 12, what binomial factors represent its length and width?',
        options: ['(x + 3) and (x + 4)', '(x + 2) and (x + 6)', '(x + 1) and (x + 12)', '(x + 7) and (x + 1)'],
        correct_index: 0,
        explanation: 'Sum of constants is 3 + 4 = 7 (matching 7x) and product is 3 × 4 = 12.',
        misconception: 'Picking factors of 12 that do not sum to the combined middle coefficient of 7.'
      }
    ]
  }
];

// Default exports for backward compatibility
export const CHAPTER = CHAPTERS_CATALOG[0];
export const QUESTIONS = CHAPTERS_CATALOG[0].questions;

export function getChapterById(id) {
  return CHAPTERS_CATALOG.find(c => c.id === id) || CHAPTERS_CATALOG[0];
}

export function getQuestionsForChapter(chapterId) {
  const chap = getChapterById(chapterId);
  return chap ? chap.questions : [];
}
