import sys

with open(r"C:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\chapters\assemble_unified.py", "a", encoding="utf-8") as f:
    f.write("""
// ═══ UNIFIED CHAPTER SEQUENCE WITH EMBEDDED STEP-SOLVERS ═══
// This structure unifies:
// Node Intro -> Concept Theory -> Interactive Manipulative -> Step-by-Step Escape Solver (AD Exercises) -> Milestone Reward

var JOURNEY = [
  // ─── NODE 1: THE STATIONERY SHOP & THE BIRTH OF RATIONAL NUMBERS ───
  {
    type: "intro",
    badge: "ACT 1: THE STATIONERY SHOP",
    icon: "🏪",
    title: "Seema & Sachin at the Stationery Shop",
    sub: "Seema wants to buy 3 pens, each costing ₹5. Her brother Sachin wants 2 similar pens. The shopkeeper offers a packet of 5 pens for ₹22. Cost per pen = 22/5 = ₹4.40. Neither a whole number nor an integer: a Rational Number p/q!"
  },
  {
    type: "concept",
    badge: "AD TEXTBOOK CONCEPT (PAGE 1)",
    title: "What is a Rational Number p/q?",
    text: "A rational number is a number that can be expressed as a quotient or fraction p/q of two integers, where p (numerator) is an integer and q (denominator) is a non-zero integer (q ≠ 0). Why can q never be 0? Because dividing by zero has no defined meaning in mathematics. Any integer a can be written as a/1. In standard form, q is positive and p, q share no common factor other than 1.",
    simType: "penShop",
    caption: "Interactive Stationery Counter: Change pen pack quantities and discover how ratios p/q emerge!"
  },
  {
    type: "solver",
    badge: "AD TEXTBOOK CHALLENGE: EMBARK ON",
    title: "Stationery Vault: Determine the Rational Cost",
    q: "A packet of 5 pens costs ₹22. Find the exact unit price and express it as a rational number p/q in standard form.",
    steps: [
      {
        goal: "Step 1: Set up the unit price ratio (Total Price ÷ Total Pens).",
        chips: ["22 / 5", "5 / 22", "22 - 5", "22 * 5"],
        correct: "22 / 5",
        hints: [
          "Look at the total amount paid (22) and the number of items received (5).",
          "Unit cost is calculated by dividing total cost by quantity.",
          "Select the ratio of 22 divided by 5.",
          "Tap the chip '22 / 5'."
        ]
      },
      {
        goal: "Step 2: Calculate the exact decimal value of 22 ÷ 5.",
        chips: ["4.40", "4.20", "4.00", "5.20"],
        correct: "4.40",
        hints: [
          "Divide 22 by 5: 5 goes into 20 four times, with remainder 2.",
          "Add decimal point: 20 tenths divided by 5 equals 4 tenths.",
          "The quotient is 4.4 (or ₹4.40).",
          "Select '4.40'."
        ]
      },
      {
        goal: "Step 3: Verify standard form constraint for rational numbers.",
        chips: ["p=22, q=5 (both integers, q≠0)", "q can be 0", "Fractions cannot have decimals"],
        correct: "p=22, q=5 (both integers, q≠0)",
        hints: [
          "Recall the definition of a rational number p/q.",
          "Check whether 22 and 5 are integers, and whether the denominator is non-zero.",
          "5 is non-zero, and gcd(22, 5) = 1.",
          "Select 'p=22, q=5 (both integers, q≠0)'."
        ]
      }
    ],
    xp: 25
  },
  {
    type: "solver",
    badge: "AD EXERCISE 1A: STANDARD FORM",
    title: "Standard Form Vault: Purge Common Factors",
    q: "Reduce the rational number 32 / -48 into Standard Form with a positive denominator.",
    steps: [
      {
        goal: "Step 1: Move the negative sign to the numerator so the denominator becomes positive.",
        chips: ["-32 / 48", "32 / 48", "-32 / -48", "48 / -32"],
        correct: "-32 / 48",
        hints: [
          "In standard form, the denominator must strictly be positive.",
          "Multiply both numerator and denominator by -1.",
          "This yields -32 in numerator and +48 in denominator.",
          "Select '-32 / 48'."
        ]
      },
      {
        goal: "Step 2: Identify the Highest Common Factor (HCF) of 32 and 48.",
        chips: ["16", "8", "12", "6"],
        correct: "16",
        hints: [
          "List common factors of 32 (1,2,4,8,16,32) and 48 (1,2,3,4,6,8,12,16,24,48).",
          "Find the greatest number that divides both without remainder.",
          "Both are divisible by 8, but an even higher factor is 16.",
          "Select '16'."
        ]
      },
      {
        goal: "Step 3: Divide both parts by 16 to find the co-prime standard form.",
        chips: ["-2/3", "-4/6", "-8/12", "2/3"],
        correct: "-2/3",
        hints: [
          "-32 ÷ 16 = -2.",
          "48 ÷ 16 = 3.",
          "Since 2 and 3 are co-prime, the fraction cannot be reduced further.",
          "Select '-2/3'."
        ]
      }
    ],
    xp: 30
  },
  {
    type: "milestone",
    icon: "🥉",
    title: "Act 1 Conquered: Rational Foundation",
    reward: "+55 XP Earned! You mastered p/q definitions and standard form."
  },

  // ─── NODE 2: ADDITION & COMMON DENOMINATOR EQUALIZER (EX 1A) ───
  {
    type: "intro",
    badge: "ACT 2: FRACTION SLICE EQUALIZER",
    icon: "🍕",
    title: "Adding Unequal Portions",
    sub: "How do we add portions with unequal denominators like -9/7 and 5/8? Denominators tell us slice sizes. We cannot add 7-part slices to 8-part slices directly without finding a common denominator via LCM!"
  },
  {
    type: "concept",
    badge: "AD TEXTBOOK CONCEPT (PAGE 3)",
    title: "Addition & Additive Inverse Laws",
    text: "When denominators are identical: (a/b) + (c/b) = (a+c)/b. When denominators differ, we calculate LCM(b, d) and multiply numerator and denominator to convert them into equivalent slices. Every rational number a/b has an Additive Inverse -a/b such that a/b + (-a/b) = 0. Subtraction of c/d from a/b means adding the additive inverse: a/b - c/d = a/b + (-c/d).",
    simType: "lcmAdd",
    caption: "LCM Slice Equalizer: Notice how finding common denominators reslices fractions into equal units!"
  },
  {
    type: "solver",
    badge: "AD TEXTBOOK SOLVED EXAMPLE (PAGE 3)",
    title: "LCM Bridge: Add -9/7 and 5/8",
    q: "Solve step-by-step: (-9/7) + (5/8).",
    steps: [
      {
        goal: "Step 1: Determine the LCM of denominators 7 and 8.",
        chips: ["56", "15", "48", "64"],
        correct: "56",
        hints: [
          "7 and 8 are co-prime (they share no factors other than 1).",
          "For co-prime numbers, LCM is simply their product: 7 × 8.",
          "7 × 8 = 56.",
          "Select '56'."
        ]
      },
      {
        goal: "Step 2: Scale -9/7 so its denominator is 56.",
        chips: ["-72/56", "-63/56", "-9/56", "72/56"],
        correct: "-72/56",
        hints: [
          "Multiply both numerator and denominator by 8.",
          "-9 × 8 = -72, and 7 × 8 = 56.",
          "The equivalent fraction is -72/56.",
          "Select '-72/56'."
        ]
      },
      {
        goal: "Step 3: Scale 5/8 so its denominator is 56.",
        chips: ["35/56", "40/56", "5/56", "25/56"],
        correct: "35/56",
        hints: [
          "Multiply both numerator and denominator by 7.",
          "5 × 7 = 35, and 8 × 7 = 56.",
          "The equivalent fraction is 35/56.",
          "Select '35/56'."
        ]
      },
      {
        goal: "Step 4: Combine numerators [-72 + 35] / 56.",
        chips: ["-37/56", "-107/56", "37/56", "-37/112"],
        correct: "-37/56",
        hints: [
          "Add numerators: -72 + 35.",
          "Since -72 has greater absolute value, the result is negative: -(72 - 35) = -37.",
          "Keep the common denominator 56.",
          "Select '-37/56'."
        ]
      }
    ],
    xp: 35
  },
  {
    type: "solver",
    badge: "AD EXERCISE 1A Q2(f): SUBTRACTION",
    title: "Subtraction Chamber: Solve (-4/7) - (-8/9)",
    q: "Subtract -8/9 from -4/7 step-by-step.",
    steps: [
      {
        goal: "Step 1: Rewrite subtraction as adding the additive inverse of -8/9.",
        chips: ["-4/7 + 8/9", "-4/7 - 8/9", "4/7 + 8/9", "4/7 - 8/9"],
        correct: "-4/7 + 8/9",
        hints: [
          "Subtracting a negative number is equivalent to adding its positive inverse.",
          "- (-8/9) becomes + 8/9.",
          "The expression becomes -4/7 + 8/9.",
          "Select '-4/7 + 8/9'."
        ]
      },
      {
        goal: "Step 2: Find common denominator LCM(7, 9).",
        chips: ["63", "56", "72", "16"],
        correct: "63",
        hints: [
          "7 and 9 share no common factor.",
          "LCM(7, 9) = 7 × 9 = 63.",
          "Select '63'."
        ]
      },
      {
        goal: "Step 3: Scale numerators: [(-4 × 9) + (8 × 7)] / 63.",
        chips: ["[-36 + 56] / 63", "[-36 - 56] / 63", "[36 + 56] / 63"],
        correct: "[-36 + 56] / 63",
        hints: [
          "-4 × 9 = -36.",
          "8 × 7 = 56.",
          "Combine them over 63: [-36 + 56] / 63.",
          "Select '[-36 + 56] / 63'."
        ]
      },
      {
        goal: "Step 4: Compute final simplified difference.",
        chips: ["20/63", "-20/63", "-92/63", "92/63"],
        correct: "20/63",
        hints: [
          "56 - 36 = 20.",
          "Denominator is 63.",
          "Result is 20/63.",
          "Select '20/63'."
        ]
      }
    ],
    xp: 35
  },
  {
    type: "milestone",
    icon: "🥈",
    title: "Act 2 Conquered: Operations Master",
    reward: "+70 XP Earned! You mastered fraction addition, subtraction and LCM scaling."
  },

  // ─── NODE 3: MULTIPLICATION & RECIPROCALS (EX 1A) ───
  {
    type: "intro",
    badge: "ACT 3: THE FLIPPED TWIN",
    icon: "⚖️",
    title: "Multiplication & Reciprocals",
    sub: "Multiplying fractions multiplies numerators together and denominators together. When a fraction meets its inverted twin, they balance into 1! Division is simply multiplying by the reciprocal."
  },
  {
    type: "concept",
    badge: "AD TEXTBOOK CONCEPT (PAGE 4)",
    title: "Reciprocals & Non-Zero Division",
    text: "Product rule: (a/b) × (c/d) = (ac)/(bd). If (a/b) × (c/d) = 1, then c/d is called the Reciprocal or Multiplicative Inverse of a/b. Why does 0 have no reciprocal? Because 0 = 0/1; flipping it gives 1/0, which is undefined! Division is the inverse of multiplication: (a/b) ÷ (c/d) = (a/b) × (d/c) for c/d ≠ 0.",
    simType: "multDiv",
    caption: "Reciprocal Balance Flipper: Flip the fraction to produce product 1!"
  },
  {
    type: "solver",
    badge: "AD EXERCISE 1A Q3(c): MULTIPLICATION",
    title: "Cross-Cancellation Vault: (11/-13) × (-39/22)",
    q: "Multiply 11/-13 by -39/22 step-by-step using cross-cancellation.",
    steps: [
      {
        goal: "Step 1: Standardize signs and observe the sign of the product.",
        chips: ["Positive (+), because negative × negative = positive", "Negative (-)", "Zero"],
        correct: "Positive (+), because negative × negative = positive",
        hints: [
          "Both fractions are negative (-11/13 and -39/22).",
          "When multiplying two negative numbers, the negatives cancel out.",
          "The product is strictly positive.",
          "Select 'Positive (+)...'."
        ]
      },
      {
        goal: "Step 2: Cross-cancel common factors between numerators and denominators.",
        chips: ["11 divides 22 into 2, and 13 divides 39 into 3", "Multiply 11 by 39 without cancelling", "Subtract 11 from 22"],
        correct: "11 divides 22 into 2, and 13 divides 39 into 3",
        hints: [
          "Look diagonally: 11 and 22 share factor 11 (22 ÷ 11 = 2).",
          "13 and 39 share factor 13 (39 ÷ 13 = 3).",
          "Cross-cancellation reduces the arithmetic to (1 × 3) / (1 × 2).",
          "Select '11 divides 22 into 2, and 13 divides 39 into 3'."
        ]
      },
      {
        goal: "Step 3: Multiply remaining terms to obtain the final fraction.",
        chips: ["3/2", "2/3", "-3/2", "6/4"],
        correct: "3/2",
        hints: [
          "Numerator: 1 × 3 = 3.",
          "Denominator: 1 × 2 = 2.",
          "Final fraction is 3/2.",
          "Select '3/2'."
        ]
      }
    ],
    xp: 35
  },
  {
    type: "solver",
    badge: "AD EXERCISE 1A Q4(a): DIVISION",
    title: "Division Gate: (16/7) ÷ (-8/14)",
    q: "Divide 16/7 by -8/14 step-by-step.",
    steps: [
      {
        goal: "Step 1: Invert divisor (-8/14) into its reciprocal.",
        chips: ["14 / -8", "-8 / 14", "8 / 14", "7 / 16"],
        correct: "14 / -8",
        hints: [
          "Division of fractions converts to multiplication by the divisor's reciprocal.",
          "The reciprocal of -8/14 is 14/-8.",
          "Select '14 / -8'."
        ]
      },
      {
        goal: "Step 2: Rewrite as multiplication: (16/7) × (-14/8).",
        chips: ["Cross-cancel 7 into 14 (gives 2) and 8 into 16 (gives 2)", "Directly multiply numerators", "Invert both fractions"],
        correct: "Cross-cancel 7 into 14 (gives 2) and 8 into 16 (gives 2)",
        hints: [
          "14 ÷ 7 = 2.",
          "16 ÷ 8 = 2.",
          "We get: 2 × (-2) / 1.",
          "Select 'Cross-cancel 7 into 14...'."
        ]
      },
      {
        goal: "Step 3: Compute final quotient.",
        chips: ["-4", "4", "-2", "2"],
        correct: "-4",
        hints: [
          "2 × (-2) = -4.",
          "Quotient is -4.",
          "Select '-4'."
        ]
      }
    ],
    xp: 35
  },
  {
    type: "milestone",
    icon: "🥇",
    title: "Act 3 Conquered: Multiplication & Reciprocal Pro",
    reward: "+70 XP Earned! You mastered reciprocals, cross-cancellation, and fraction division."
  },

  // ─── NODE 4: ALGEBRAIC PROPERTIES (EX 1B & 1C) ───
  {
    type: "intro",
    badge: "ACT 4: THE ALGEBRAIC RULES",
    icon: "✨",
    title: "Commutative, Associative & Distributive Laws",
    sub: "Do operations change when we swap the order or group terms differently? Addition and multiplication are commutative and associative, but subtraction and division are NOT! And the Distributive Property bridges multiplication across addition."
  },
  {
    type: "concept",
    badge: "AD TEXTBOOK CONCEPT (PAGES 5-8)",
    title: "Properties of Rational Operations",
    text: "Closure: Sum, difference, and product of rational numbers are always rational. Commutative: a + b = b + a and a × b = b × a (subtraction & division are not commutative). Associative: (a + b) + c = a + (b + c). Distributive: a × (b + c) = (a × b) + (a × c). Identities: 0 is additive identity; 1 is multiplicative identity.",
    simType: "propsTile",
    caption: "Tile Swapper: See how order changes leave addition identical but disrupt subtraction!"
  },
  {
    type: "solver",
    badge: "AD EXERCISE 1B: COMMUTATIVE VERIFICATION",
    title: "Commutativity Gate: a + b = b + a",
    q: "Verify Commutativity for a = -3/7 and b = 4/9.",
    steps: [
      {
        goal: "Step 1: Compute L.H.S. = (-3/7) + (4/9). LCM(7, 9) = 63.",
        chips: ["[-27 + 28] / 63 = 1/63", "[27 - 28] / 63 = -1/63", "7/63"],
        correct: "[-27 + 28] / 63 = 1/63",
        hints: [
          "-3 × 9 = -27, and 4 × 7 = 28.",
          "-27 + 28 = 1.",
          "L.H.S. = 1/63.",
          "Select '[-27 + 28] / 63 = 1/63'."
        ]
      },
      {
        goal: "Step 2: Compute R.H.S. = (4/9) + (-3/7).",
        chips: ["[28 + (-27)] / 63 = 1/63", "-1/63", "0"],
        correct: "[28 + (-27)] / 63 = 1/63",
        hints: [
          "Swap the order: 4/9 first, then -3/7.",
          "28 - 27 = 1 over 63 = 1/63.",
          "Select '[28 + (-27)] / 63 = 1/63'."
        ]
      },
      {
        goal: "Step 3: What does L.H.S. = R.H.S. = 1/63 prove?",
        chips: ["Addition is Commutative for rational numbers", "Subtraction is Commutative", "Division is Associative"],
        correct: "Addition is Commutative for rational numbers",
        hints: [
          "Swapping the order gave the exact same result.",
          "This proves commutativity of addition.",
          "Select 'Addition is Commutative...'."
        ]
      }
    ],
    xp: 35
  },
  {
    type: "solver",
    badge: "AD TEXTBOOK PAGE 8: DISTRIBUTIVE PROOF",
    title: "Distributive Vault: (2/5) × [(-3/7) + (6/11)]",
    q: "Verify the Distributive Property of Multiplication over Addition step-by-step.",
    steps: [
      {
        goal: "Step 1: Solve L.H.S. inside brackets: -3/7 + 6/11. LCM(7, 11) = 77.",
        chips: ["[-33 + 42]/77 = 9/77", "[-33 - 42]/77 = -75/77", "3/77"],
        correct: "[-33 + 42]/77 = 9/77",
        hints: [
          "-3 × 11 = -33, and 6 × 7 = 42.",
          "42 - 33 = 9.",
          "Bracket equals 9/77.",
          "Select '[-33 + 42]/77 = 9/77'."
        ]
      },
      {
        goal: "Step 2: Multiply with outer factor 2/5: (2 × 9) / (5 × 77).",
        chips: ["18/385", "18/77", "11/385", "4/385"],
        correct: "18/385",
        hints: [
          "2 × 9 = 18.",
          "5 × 77 = 385.",
          "L.H.S. = 18/385.",
          "Select '18/385'."
        ]
      },
      {
        goal: "Step 3: Solve R.H.S.: [2/5 × -3/7] + [2/5 × 6/11] = -6/35 + 12/55.",
        chips: ["LCM(35, 55) = 385 → [-66 + 84]/385 = 18/385", "18/35", "-18/385"],
        correct: "LCM(35, 55) = 385 → [-66 + 84]/385 = 18/385",
        hints: [
          "35 × 11 = 385, and 55 × 7 = 385.",
          "-6 × 11 = -66, and 12 × 7 = 84.",
          "84 - 66 = 18 over 385 = 18/385.",
          "Select 'LCM(35, 55) = 385 → [-66 + 84]/385 = 18/385'."
        ]
      },
      {
        goal: "Step 4: Conclude verification.",
        chips: ["L.H.S. = R.H.S. = 18/385 (Distributive Law Verified)", "Distributive law failed"],
        correct: "L.H.S. = R.H.S. = 18/385 (Distributive Law Verified)",
        hints: [
          "Both sides yield exactly 18/385.",
          "Select 'L.H.S. = R.H.S. = 18/385...'."
        ]
      }
    ],
    xp: 40
  },
  {
    type: "milestone",
    icon: "💎",
    title: "Act 4 Conquered: Algebraic Alchemist",
    reward: "+75 XP Earned! You mastered algebraic proofs and distributivity."
  },

  // ─── NODE 5: FINAL BOSS CHALLENGE (PRESCRIBED BOARD SOLVED QUESTIONS) ───
  {
    type: "intro",
    badge: "ACT 5: THE FINAL BOSS VAULT",
    icon: "🏆",
    title: "Prescribed Board Questions Challenge",
    sub: "Face the final examination board questions directly from Page 9 of the AD Textbook! Apply your knowledge of multiplicative identities, reciprocals, and associativity to conquer the chapter!"
  },
  {
    type: "solver",
    badge: "AD PRESCRIBED Q1: IDENTITIES & INVERSES",
    title: "Board Boss 1: Identify Key Multiplicative Properties",
    q: "Analyze each prescribed board identity step-by-step.",
    steps: [
      {
        goal: "Question (i): Name the property used in (-4/5) × 1 = 1 × (-4/5) = -4/5.",
        chips: ["1 is the Multiplicative Identity", "Commutative property only", "Additive identity", "Multiplicative inverse"],
        correct: "1 is the Multiplicative Identity",
        hints: [
          "Notice multiplying by 1 leaves the rational number unchanged.",
          "1 is known as the multiplicative identity element.",
          "Select '1 is the Multiplicative Identity'."
        ]
      },
      {
        goal: "Question (ii): Name the property used in (-13/17) × (-2/7) = (-2/7) × (-13/17).",
        chips: ["Commutativity under Multiplication", "Associativity", "Distributivity", "Closure"],
        correct: "Commutativity under Multiplication",
        hints: [
          "The order of the two factors is swapped (a × b = b × a).",
          "This is the Commutative Property of Multiplication.",
          "Select 'Commutativity under Multiplication'."
        ]
      },
      {
        goal: "Question (iii): Name the property used in (-19/29) × (29/-19) = 1.",
        chips: ["Multiplicative Inverse (Reciprocal)", "Multiplicative identity", "Associative", "Closure"],
        correct: "Multiplicative Inverse (Reciprocal)",
        hints: [
          "A fraction is multiplied by its inverted twin to produce 1.",
          "This is the Multiplicative Inverse or Reciprocal property.",
          "Select 'Multiplicative Inverse (Reciprocal)'."
        ]
      }
    ],
    xp: 45
  },
  {
    type: "solver",
    badge: "AD PRESCRIBED Q2 & Q3: ASSOCIATIVE & CLOSURE",
    title: "Board Boss 2: Associativity & Closure Laws",
    q: "Solve the final prescribed board exam problems.",
    steps: [
      {
        goal: "AD Prescribed Q2: What property allows computing (1/3) × [6 × (4/3)] as [(1/3) × 6] × (4/3)?",
        chips: ["Associative Property of Multiplication", "Commutative Property", "Distributive Property", "Additive Inverse"],
        correct: "Associative Property of Multiplication",
        hints: [
          "Notice that the terms remain in the exact same order (1/3, 6, 4/3), but the grouping brackets are shifted.",
          "It is of the form a × (b × c) = (a × b) × c.",
          "This is strictly the Associative Property.",
          "Select 'Associative Property of Multiplication'."
        ]
      },
      {
        goal: "AD Prescribed Q3: The product of two rational numbers is always a _____?",
        chips: ["Rational number (Closure Property)", "Whole number", "Positive integer", "Decimal with non-zero denominator"],
        correct: "Rational number (Closure Property)",
        hints: [
          "Multiplying any two integers in numerator and denominator yields integers.",
          "Therefore, the product is always a rational number.",
          "This is the Closure Property of Multiplication.",
          "Select 'Rational number (Closure Property)'."
        ]
      }
    ],
    xp: 50
  },
  {
    type: "milestone",
    icon: "👑",
    title: "🏆 CHAPTER 1 FULLY CONQUERED!",
    reward: "+100 XP Earned! You have completed 100% of the AD Class 8 Rational Numbers curriculum, exercises, and board questions in a unified step-by-step gamified journey!"
  }
];
""")

print("Part 2 added.")
