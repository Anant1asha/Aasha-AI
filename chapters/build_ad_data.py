import json

# Compile the 5 Nodes with embedded story, step-by-step game obstacles, visual sims, worked examples, and all textbook exercises
nodes = [
  {
    "id": "node_1",
    "title": "Act I: The Stationery Shop & The Quest for p/q",
    "story_chapter": "Chapter 1: The Counter Dilemma",
    "story_text": "Seema and Sachin step into the bustling wholesale stationery market. Seema needs 3 pens for school notes, and Sachin needs 2 pens for geometry drawing. Individual pens are ₹5 each. But the shopkeeper points to a sealed box of 5 pens for ₹22! Can they save money? Seema calculates: ₹22 ÷ 5 = ₹4.40. Neither a whole number nor an integer, but a ratio of two integers p/q!",
    "concept_title": "The Academic Law: Defining Rational Numbers p/q",
    "concept_body": "A rational number is any number that can be expressed as p/q, where p and q are integers and q ≠ 0. If q were 0, dividing by zero would be mathematically undefined. Every integer a is rational (a/1). In Standard Form, the denominator q is positive and p, q are co-prime (HCF = 1).",
    "sim_type": "pen_shop_sim",
    "sim_prompt": "Adjust the packet size and total price to see how wholesale unit cost generates rational numbers.",
    "challenges": [
      {
        "id": "ad_1_1",
        "tag": "AD Textbook Page 1: Embark On Challenge",
        "title": "The Shopkeeper's Price Tag",
        "prompt": "Seema bought a packet of 5 pens for ₹22. What is the unit cost of each pen as a rational number p/q and as a decimal?",
        "sub_steps": [
          {"task": "Set up the rational fraction (total cost / total pens)", "answer": "22/5", "accept": ["22/5", "22 / 5"], "type": "fraction", "hint": "Divide the total money spent by the number of pens in the box."},
          {"task": "Compute the exact decimal price in rupees", "answer": "4.40", "accept": ["4.4", "4.40", "₹4.40"], "type": "decimal", "hint": "Divide 22 by 5: 5 goes into 22 four times with remainder 2."},
          {"task": "Why is 22/5 a rational number? Identify condition for q", "answer": "5 is non-zero integer", "accept": ["q != 0", "q is not zero", "5 is non-zero integer", "non-zero", "5 != 0"], "type": "rule", "hint": "A rational number requires denominator q to be a non-zero integer."}
        ]
      },
      {
        "id": "ad_1_2",
        "tag": "Standard Form Challenge",
        "title": "Purging the Negative Denominator",
        "prompt": "Express 32/-48 in standard form with a positive denominator and co-prime integers.",
        "sub_steps": [
          {"task": "Move negative sign to numerator by multiplying top & bottom by -1", "answer": "-32/48", "accept": ["-32/48", "-32 / 48"], "type": "fraction", "hint": "Multiply both parts by -1 to keep fraction value identical."},
          {"task": "Find the Highest Common Factor (HCF) of 32 and 48", "answer": "16", "accept": ["16"], "type": "number", "hint": "Factors of 32: 1,2,4,8,16,32. Factors of 48: 1,2,3,4,6,8,12,16,24,48."},
          {"task": "Divide both parts by 16 to obtain final standard form", "answer": "-2/3", "accept": ["-2/3", "-2 / 3"], "type": "fraction", "hint": "-32 ÷ 16 = -2, and 48 ÷ 16 = 3."}
        ]
      }
    ]
  },
  {
    "id": "node_2",
    "title": "Act II: The Endless Tightrope — Number Line & Density",
    "story_chapter": "Chapter 2: Coordinates of Debt and Gain",
    "story_text": "Across the shop table lies a giant measuring tape extending in both directions from 0. To the right lies surplus cash (+); to the left lies credit and debt (-). Sachin wonders: between any two whole marks on this line, how many fractions hide in the shadows? Infinitely many!",
    "concept_title": "Locating Fractions on the Number Line",
    "concept_body": "To plot an improper rational number like -8/3, convert it into a mixed fraction: -(2 2/3). It lies between integers -2 and -3. Partition the unit length between -2 and -3 into 3 equal slices and take 2 steps left from -2.",
    "sim_type": "number_line_sim",
    "sim_prompt": "Drag and partition intervals between integers to pinpoint positive and negative rational coordinates.",
    "challenges": [
      {
        "id": "ad_2_1",
        "tag": "Coordinate Pinpoint",
        "title": "Pinpointing -8/3",
        "prompt": "Locate the rational number -8/3 on the coordinate line.",
        "sub_steps": [
          {"task": "Convert -8/3 to mixed fraction form: -([whole] and [rem]/3)", "answer": "-(2 2/3)", "accept": ["-2 2/3", "-(2 2/3)", "-2 and 2/3", "2 2/3"], "type": "mixed", "hint": "8 divided by 3 is 2 with remainder 2."},
          {"task": "Identify the two consecutive integers it lies between (enter lower, upper)", "answer": "-3, -2", "accept": ["-3, -2", "-2, -3", "-3 and -2", "-2 and -3"], "type": "text", "hint": "Since it is negative 2 and 2/3, it is between -2 and the next integer left."},
          {"task": "How many equal slices must the unit gap be divided into?", "answer": "3", "accept": ["3"], "type": "number", "hint": "The denominator tells us how many equal partitions are in each unit interval."}
        ]
      }
    ]
  },
  {
    "id": "node_3",
    "title": "Act III: The Slicing Kitchen — Operations (+ and -) (AD Ex 1A)",
    "story_chapter": "Chapter 3: Equalizing Unequal Slices",
    "story_text": "Seema brings lunch: two parathas sliced differently. One is cut into 7 slices, the other into 8 slices! Sachin tries to add slices directly: 'Let\\'s just add 4 + 5!' Seema stops him: 'A slice of 7 is larger than a slice of 8! We must reslice both to a common denominator!'",
    "concept_title": "Addition & Subtraction via LCM",
    "concept_body": "When denominators are equal: a/b + c/b = (a+c)/b. When denominators differ: find LCM(b, d), scale each fraction to equal units, then combine numerators. For subtraction: a/b - c/d = a/b + (-c/d). Every rational a/b has an additive inverse -a/b summing to 0.",
    "sim_type": "slice_equalizer_sim",
    "sim_prompt": "Select denominators to watch the visual bar reslice into common LCM partitions.",
    "challenges": [
      {
        "id": "ex1a_add_1",
        "tag": "AD Ex 1A Q1(a)",
        "title": "Equal Denominator Addition",
        "prompt": "Add: 5/2 and -11/2",
        "sub_steps": [
          {"task": "Combine numerators over common denominator 2: [5 + (-11)] / 2", "answer": "-6/2", "accept": ["-6/2", "-6 / 2"], "type": "fraction", "hint": "Add 5 and -11."},
          {"task": "Simplify to simplest integer", "answer": "-3", "accept": ["-3"], "type": "number", "hint": "-6 divided by 2."}
        ]
      },
      {
        "id": "ex1a_add_2",
        "tag": "AD Ex 1A Q1(e)",
        "title": "Unequal Denominator Addition",
        "prompt": "Add: 4/-7 and -5/8",
        "sub_steps": [
          {"task": "Write 4/-7 in standard form with positive denominator", "answer": "-4/7", "accept": ["-4/7", "-4 / 7"], "type": "fraction", "hint": "Move negative sign to numerator."},
          {"task": "Find LCM of denominators 7 and 8", "answer": "56", "accept": ["56"], "type": "number", "hint": "7 and 8 are co-prime: 7 × 8 = 56."},
          {"task": "Scale numerators: [(-4 × 8) + (-5 × 7)] / 56", "answer": "(-32 - 35)/56", "accept": ["-67/56", "-67 / 56", "(-32 - 35)/56"], "type": "fraction", "hint": "-4 × 8 = -32; -5 × 7 = -35."},
          {"task": "Final sum in standard form", "answer": "-67/56", "accept": ["-67/56", "-67 / 56"], "type": "fraction", "hint": "-32 + (-35) = -67."}
        ]
      },
      {
        "id": "ex1a_sub_1",
        "tag": "AD Ex 1A Q2(a)",
        "title": "Rational Subtraction",
        "prompt": "Subtract: (-18/5) - (-8/5)",
        "sub_steps": [
          {"task": "Convert subtraction of negative to addition of inverse: -18/5 + 8/5", "answer": "(-18 + 8)/5", "accept": ["-10/5", "(-18 + 8)/5", "-10 / 5"], "type": "fraction", "hint": "Minus a negative gives plus."},
          {"task": "Simplify result", "answer": "-2", "accept": ["-2"], "type": "number", "hint": "-10 divided by 5."}
        ]
      },
      {
        "id": "ex1a_sub_2",
        "tag": "AD Ex 1A Q2(f)",
        "title": "Subtraction with Different Denominators",
        "prompt": "Subtract: (-4/7) - (-8/9)",
        "sub_steps": [
          {"task": "Find common denominator LCM(7, 9)", "answer": "63", "accept": ["63"], "type": "number", "hint": "7 × 9 = 63."},
          {"task": "Scale fractions: [(-4 × 9) - (-8 × 7)] / 63 = (-36 + 56)/63", "answer": "20/63", "accept": ["20/63", "20 / 63"], "type": "fraction", "hint": "-36 + 56 = 20."}
        ]
      }
    ]
  },
  {
    "id": "node_4",
    "title": "Act IV: The Multiplicative Balance Scale — (* and /) (AD Ex 1A)",
    "story_chapter": "Chapter 4: The Inverted Twin",
    "story_text": "The shopkeeper shows them an ancient two-pan brass scale. 'If you put a fraction on one pan, what balances it to 1?' Its reciprocal twin! But when Sachin tries to place 0 on the scale, the balance shatters: 'Zero has no twin! Division by zero is impossible!'",
    "concept_title": "Multiplication, Reciprocals & Division",
    "concept_body": "Product of fractions: (a/b) × (c/d) = (ac)/(bd). Reciprocal of a/b is b/a because (a/b) × (b/a) = 1. Division is the inverse of multiplication: (a/b) ÷ (c/d) = (a/b) × (d/c). Zero has no reciprocal because 1/0 is undefined.",
    "sim_type": "balance_scale_sim",
    "sim_prompt": "Place fractions on the balance scale and watch them flip into reciprocals to equal 1.",
    "challenges": [
      {
        "id": "ex1a_mul_1",
        "tag": "AD Ex 1A Q3(c)",
        "title": "Cross-Cancellation Multiplication",
        "prompt": "Multiply: (11/-13) by (-39/22)",
        "sub_steps": [
          {"task": "Determine the sign of product (negative × negative)", "answer": "positive", "accept": ["positive", "+", "pos"], "type": "text", "hint": "Two negative factors multiply to a positive product."},
          {"task": "Cross cancel common factors: 11 into 22, and 13 into 39", "answer": "(1 × 3)/(1 × 2)", "accept": ["3/2", "3 / 2", "(1 * 3)/(1 * 2)"], "type": "fraction", "hint": "11 goes into 22 twice; 13 goes into 39 three times."},
          {"task": "Final reduced product", "answer": "3/2", "accept": ["3/2", "1.5", "1 1/2"], "type": "fraction", "hint": "3 divided by 2."}
        ]
      },
      {
        "id": "ex1a_div_1",
        "tag": "AD Ex 1A Q4(a)",
        "title": "Division via Reciprocal",
        "prompt": "Divide: (16/7) by (-8/14)",
        "sub_steps": [
          {"task": "Invert the divisor (-8/14) to its reciprocal", "answer": "-14/8", "accept": ["-14/8", "-14 / 8", "-7/4"], "type": "fraction", "hint": "Flip numerator and denominator."},
          {"task": "Rewrite as multiplication: (16/7) × (-14/8)", "answer": "-4", "accept": ["-4"], "type": "number", "hint": "16/8 = 2; -14/7 = -2. 2 × (-2) = -4."}
        ]
      }
    ]
  },
  {
    "id": "node_5",
    "title": "Act V: The Master Alchemist — Algebraic Laws & Grand Boss (AD Ex 1B, 1C)",
    "story_chapter": "Chapter 5: Regrouping Magic & The Final Audit",
    "story_text": "Before leaving the stationery market, Seema and Sachin face the Head Auditor. A giant ledger with 4 long fractions appears. 'Calculate this!' says the auditor. Rather than finding a massive 385 common denominator directly, Seema uses Commutative, Associative, and Distributive grouping to conquer the ledger in seconds!",
    "concept_title": "Algebraic Laws & Distributivity",
    "concept_body": "Addition & Multiplication are Commutative (a+b = b+a) and Associative [(a+b)+c = a+(b+c)]. Subtraction and Division are NOT! Distributive Law bridges operations: a(b ± c) = ab ± ac. Multiplicative identity is 1; Additive identity is 0.",
    "sim_type": "distributive_grid_sim",
    "sim_prompt": "Drag grouping brackets to see how smart algebra collapses complex sums into simple mental arithmetic.",
    "challenges": [
      {
        "id": "ex1b_prop_1",
        "tag": "AD Ex 1B Q1(a)",
        "title": "Commutative Fill-in-the-Blank",
        "prompt": "Fill in the blank using Commutative Property: (-3/7) + (4/9) = _____ + (-3/7)",
        "sub_steps": [
          {"task": "State the missing rational number", "answer": "4/9", "accept": ["4/9", "4 / 9"], "type": "fraction", "hint": "Commutativity states a + b = b + a."}
        ]
      },
      {
        "id": "ex1c_distrib_1",
        "tag": "AD Ex 1C Solved Page 8",
        "title": "The Distributive Boss Challenge",
        "prompt": "Verify: (2/5) × [(-3/7) + (6/11)] = [(2/5) × (-3/7)] + [(2/5) × (6/11)]",
        "sub_steps": [
          {"task": "Solve inside bracket: -3/7 + 6/11 (LCM = 77)", "answer": "9/77", "accept": ["9/77", "9 / 77"], "type": "fraction", "hint": "(-33 + 42)/77 = 9/77."},
          {"task": "Evaluate LHS: (2/5) × (9/77)", "answer": "18/385", "accept": ["18/385", "18 / 385"], "type": "fraction", "hint": "2 × 9 = 18; 5 × 77 = 385."},
          {"task": "Evaluate RHS distributed sum: (-6/35) + (12/55) with LCM 385", "answer": "18/385", "accept": ["18/385", "18 / 385"], "type": "fraction", "hint": "(-66 + 84)/385 = 18/385."},
          {"task": "Is Distributive Property verified (yes/no)?", "answer": "yes", "accept": ["yes", "true", "verified"], "type": "text", "hint": "LHS equals RHS."}
        ]
      },
      {
        "id": "prescribed_boss",
        "tag": "AD Prescribed Board Exam Question",
        "title": "The Board Examiner's Lock",
        "prompt": "Name the property: (-19/29) × (29/-19) = 1",
        "sub_steps": [
          {"task": "Identify the property used", "answer": "Multiplicative Inverse", "accept": ["multiplicative inverse", "reciprocal", "reciprocal property", "multiplicative inverse property"], "type": "text", "hint": "A number multiplied by its inverted twin equals 1."}
        ]
      }
    ]
  }
]

with open(r"C:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\chapters\ad_nodes_data.json", "w", encoding="utf-8") as f:
    json.dump(nodes, f, indent=2)

print("ad_nodes_data.json generated successfully!")
