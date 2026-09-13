import json, re

# Load Gold Standard v6 Template
base_file = r"C:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\chapters\AlgebraicExpressions_Class8_Gamified_v5_Enhanced_v6.html"
with open(base_file, "r", encoding="utf-8") as f:
    v6_html = f.read()

# Replace Titles and Storage Key
v6_html = re.sub(r'<title>.*?</title>', '<title>Rational Numbers (AD Edition) — Aasha Learning Ecosystem</title>', v6_html)
v6_html = v6_html.replace('Algebraic Expressions & Identities', 'Rational Numbers (परिमेय संख्याएँ)')
v6_html = v6_html.replace('Chapter 1: Rational Numbers', 'Chapter 1: Rational Numbers (AD Class 8 Math)')
v6_html = v6_html.replace('aasha_algebra8_v5', 'aasha_rational_numbers_ad_v6')

# Build the 5 Authentic AD Nodes
nodes = [
  {
    "title": "Stationery Shop & Rational Numbers",
    "emoji": "🏪",
    "icon": "🏪",
    "color": "#3b82f6",
    "steps": [
      {
        "t": "intro",
        "icon": "🏪",
        "title": "Seema & Sachin at the Stationery Shop",
        "sub": "Welcome to Class 8 Mathematics! Seema and Sachin are shopping for school stationery when they stumble upon a wholesale bargain. Let us explore why integers fail and rational numbers are born!",
        "hero": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiB2aWV3Qm94PSIwIDAgMjAwIDEyMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNkYmVhZmUiIHJ4PSIxNiIvPjx0ZXh0IHg9IjEwMCIgeT0iNjUiIGZvbnQtc2l6ZT0iNDgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPvCfj6s8L3RleHQ+PC9zdmc+"
      },
      {
        "t": "text",
        "title": "AD Textbook Embark On: Finding Cost per Pen",
        "text": "Seema wants to buy 3 pens, each costing ₹5 individually. Her brother Sachin wants 2 similar pens. At the shop, the shopkeeper tells them that a packet of 5 pens costs ₹22. Now, Seema and Sachin need to figure out the cost of each pen to ensure they are getting a good deal. To find out the cost of each pen when bought in a packet, we divide the total cost of the packet by the number of pens in it. Mathematically: Cost of each pen = ₹22/5. Dividing ₹22 by 5 gives: 22/5 = ₹4.40. Therefore, each pen in the packet costs ₹4.40! This division resulted in a number that is not a whole number (0, 1, 2, 3...) or simple integer."
      },
      {
        "t": "text",
        "title": "What is a Rational Number?",
        "text": "Here, ₹4.40 is a rational number because it can be expressed as a fraction p/q where both the numerator (22) and the denominator (5) are integers, and the denominator is non-zero (5 ≠ 0). A rational number is a number that can be expressed as a quotient or fraction p/q of two integers, where p is an integer and q is a non-zero integer (q ≠ 0). Any integer a is a rational number because it can be written as a/1. Rational numbers include positive and negative numbers as well as zero (0 = 0/1). In Standard Form, the denominator is positive and p, q share no common factor other than 1."
      },
      {
        "t": "solve",
        "sl": {
          "title": "Guided Step-by-Step Solve: Standard Form",
          "prompt": "Express the rational number 32/-48 in standard form with a positive denominator.",
          "steps": [
            {
              "instruction": "Step 1: Notice the negative sign is in the denominator. Multiply both numerator and denominator by -1 to make the denominator positive.",
              "type": "mcq",
              "q": "What is [32 × (-1)] / [-48 × (-1)]?",
              "opts": [
                {"t": "-32/48", "c": True, "m": ""},
                {"t": "32/48", "c": False, "m": "A positive multiplied by a negative is negative. 32 × (-1) = -32."},
                {"t": "-48/32", "c": False, "m": "Do not invert the fraction; simply multiply top and bottom by -1."}
              ]
            },
            {
              "instruction": "Step 2: Find the Highest Common Factor (HCF) of 32 and 48 to cancel out common factors.",
              "type": "mcq",
              "q": "What is the HCF of 32 and 48?",
              "opts": [
                {"t": "16", "c": True, "m": ""},
                {"t": "8", "c": False, "m": "8 divides both, but 16 is a higher common factor (16 × 2 = 32, 16 × 3 = 48)."},
                {"t": "12", "c": False, "m": "12 does not divide 32 without remainder."}
              ]
            },
            {
              "instruction": "Step 3: Divide both parts by 16: (-32 ÷ 16) / (48 ÷ 16).",
              "type": "input",
              "q": "Enter the final standard fraction (e.g. -2/3):",
              "answer": "-2/3",
              "hint": "-32 divided by 16 is -2, and 48 divided by 16 is 3."
            }
          ]
        }
      },
      {
        "t": "quiz",
        "q": {
          "q": "Why can the denominator q of a rational number p/q never be zero?",
          "opts": [
            {"t": "Because division by zero is mathematically undefined", "c": True, "m": ""},
            {"t": "Because zero is not considered an integer", "c": False, "m": "Zero is indeed an integer, but dividing any quantity into zero parts has no mathematical meaning."},
            {"t": "Because fractions can only contain positive numbers", "c": False, "m": "Rational numbers routinely include negative integers; the restriction is strictly against zero in the denominator."},
            {"t": "Because zero deletes the numerator", "c": False, "m": "Zero in the numerator produces 0 (0/5 = 0), but zero in the denominator cannot divide any value."}
          ]
        }
      },
      {
        "t": "progress",
        "tokens": 15,
        "xp": 35,
        "text": "Outstanding! You have mastered the definition of rational numbers and standard form!",
        "next": "Number Line & Coordinates"
      }
    ]
  },
  {
    "title": "Number Line & Coordinate Pinpoint",
    "emoji": "📍",
    "icon": "📍",
    "color": "#10b981",
    "steps": [
      {
        "t": "intro",
        "icon": "📍",
        "title": "Coordinates on the Number Line",
        "sub": "A number line stretches endlessly in two directions from origin 0. Positive rationals lie to the right, and negative rationals lie to the left. Let us pinpoint exact fractional coordinates!",
        "hero": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiB2aWV3Qm94PSIwIDAgMjAwIDEyMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNkYmVhZmUiIHJ4PSIxNiIvPjx0ZXh0IHg9IjEwMCIgeT0iNjUiIGZvbnQtc2l6ZT0iNDgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuKRoDwvdGV4dD48L3N2Zz4="
      },
      {
        "t": "text",
        "title": "Locating Improper Rational Numbers",
        "text": "To locate an improper rational number like -8/3 on the number line, first convert it into a mixed fraction: -8/3 = - (2 and 2/3). This reveals that it lies between the consecutive integers -2 and -3. Because the denominator is 3, divide the unit length between -2 and -3 into 3 equal parts. Moving 2 parts to the left from -2 marks the exact position of -8/3."
      },
      {
        "t": "solve",
        "sl": {
          "title": "Guided Step-by-Step Solve: Coordinate Pinpoint",
          "prompt": "Locate the rational number 13/5 on the number line.",
          "steps": [
            {
              "instruction": "Step 1: Convert 13/5 into a mixed fraction to find between which two integers it lies.",
              "type": "mcq",
              "q": "13 ÷ 5 gives what whole quotient and remainder?",
              "opts": [
                {"t": "2 with remainder 3, so 2 and 3/5", "c": True, "m": ""},
                {"t": "3 with remainder 2, so 3 and 2/5", "c": False, "m": "5 × 2 = 10, so the quotient is 2, not 3."},
                {"t": "1 with remainder 8", "c": False, "m": "The remainder must always be smaller than the divisor 5."}
              ]
            },
            {
              "instruction": "Step 2: Determine the integer interval on the positive side of 0.",
              "type": "mcq",
              "q": "Between which two consecutive integers does 13/5 lie?",
              "opts": [
                {"t": "Between 2 and 3", "c": True, "m": ""},
                {"t": "Between 1 and 2", "c": False, "m": "13/5 = 2.6, which is greater than 2."},
                {"t": "Between 3 and 4", "c": False, "m": "2 and 3/5 is less than 3."}
              ]
            },
            {
              "instruction": "Step 3: Into how many equal parts must the unit gap between 2 and 3 be partitioned?",
              "type": "input",
              "q": "Enter number of equal partitions (equal to denominator):",
              "answer": "5",
              "hint": "The denominator of the fraction specifies the number of equal divisions."
            }
          ]
        }
      },
      {
        "t": "quiz",
        "q": {
          "q": "How many rational numbers exist between any two distinct rational numbers on a number line?",
          "opts": [
            {"t": "Infinitely many rational numbers", "c": True, "m": ""},
            {"t": "Exactly one rational number", "c": False, "m": "You can always find the midpoint between any two rationals, and subdivide indefinitely."},
            {"t": "No rational numbers exist between them", "c": False, "m": "Unlike integers, rational numbers are densely distributed with endless sub-intervals."},
            {"t": "Only ten rational numbers", "c": False, "m": "Any gap can be divided by 10, 100, 1000 without limit."}
          ]
        }
      },
      {
        "t": "progress",
        "tokens": 15,
        "xp": 35,
        "text": "Brilliant! You can now pinpoint any rational number on the infinite coordinate line!",
        "next": "Addition & Subtraction (AD Ex 1A)"
      }
    ]
  },
  {
    "title": "Addition & Subtraction (AD Ex 1A)",
    "emoji": "➕",
    "icon": "➕",
    "color": "#f59e0b",
    "steps": [
      {
        "t": "intro",
        "icon": "➕",
        "title": "Equalizing Slices: Addition & Subtraction",
        "sub": "In Exercise 1A, we combine and deduct rational numbers. When denominators match, simply add numerators. When they differ, find the LCM to reslice into equal units!",
        "hero": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiB2aWV3Qm94PSIwIDAgMjAwIDEyMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNkYmVhZmUiIHJ4PSIxNiIvPjx0ZXh0IHg9IjEwMCIgeT0iNjUiIGZvbnQtc2l6ZT0iNDgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuKnuTwvdGV4dD48L3N2Zz4="
      },
      {
        "t": "text",
        "title": "AD Textbook Page 3 Rules: Addition & Additive Inverse",
        "text": "1. Same denominator: a/b + c/b = (a + c)/b. For example: 5/3 + 4/3 = (5 + 4)/3 = 9/3 = 3.\n2. Different denominators: a/b + c/d = (ad + bc)/bd. For example (from Page 3): (-9/7) + (5/8) = [(-9 × 8) + (7 × 5)] / (7 × 8) = (-72 + 35)/56 = -37/56.\n3. Additive Inverse: If a/b + c/d = 0, then c/d is called the additive inverse of a/b. For example, the additive inverse of 3/7 is -3/7, and of -3/7 is 3/7.\n4. Subtraction: a/b - c/d means adding the additive inverse: a/b + (-c/d)."
      },
      {
        "t": "solve",
        "sl": {
          "title": "Guided Step-by-Step Solve: AD Ex 1A Q1(e)",
          "prompt": "Add the rational numbers: 4/-7 and -5/8 (from AD Textbook Exercise 1A).",
          "steps": [
            {
              "instruction": "Step 1: Write 4/-7 in standard form with a positive denominator.",
              "type": "mcq",
              "q": "What is 4/-7 with positive denominator?",
              "opts": [
                {"t": "-4/7", "c": True, "m": ""},
                {"t": "4/7", "c": False, "m": "A negative denominator makes the entire value negative. Standard form places the minus in the numerator."},
                {"t": "-7/4", "c": False, "m": "Do not invert the fraction."}
              ]
            },
            {
              "instruction": "Step 2: Find the LCM of denominators 7 and 8 to get a common slice size.",
              "type": "mcq",
              "q": "Since 7 and 8 are co-prime, what is their LCM?",
              "opts": [
                {"t": "56", "c": True, "m": ""},
                {"t": "15", "c": False, "m": "Multiply 7 and 8 to find the common multiple: 7 × 8 = 56."},
                {"t": "28", "c": False, "m": "8 does not divide 28."}
              ]
            },
            {
              "instruction": "Step 3: Scale both numerators: [(-4 × 8) + (-5 × 7)] / 56 = (-32 - 35) / 56.",
              "type": "input",
              "q": "Enter the final simplified fraction (e.g. -67/56):",
              "answer": "-67/56",
              "hint": "-32 + (-35) = -67, over denominator 56."
            }
          ]
        }
      },
      {
        "t": "quiz",
        "q": {
          "q": "From AD Ex 1A Q2(a): What is (-18/5) - (-8/5)?",
          "opts": [
            {"t": "-2", "c": True, "m": ""},
            {"t": "-26/5", "c": False, "m": "Subtracting a negative turns into addition: -18 - (-8) = -18 + 8 = -10."},
            {"t": "2", "c": False, "m": "-18 + 8 gives -10, so -10/5 = -2, not positive 2."},
            {"t": "-10", "c": False, "m": "Remember to divide by the common denominator 5: -10 ÷ 5 = -2."}
          ]
        }
      },
      {
        "t": "progress",
        "tokens": 20,
        "xp": 40,
        "text": "Excellent! You have mastered rational addition, subtraction, and slice scaling!",
        "next": "Multiplication & Reciprocals (AD Ex 1A)"
      }
    ]
  },
  {
    "title": "Multiplication & Division (AD Ex 1A)",
    "emoji": "✖️",
    "icon": "✖️",
    "color": "#8b5cf6",
    "steps": [
      {
        "t": "intro",
        "icon": "✖️",
        "title": "Cross-Cancellation & The Reciprocal Twin",
        "sub": "Multiplying rational numbers scales numerators and denominators together. Dividing is simply multiplying by the reciprocal twin! Let us master Exercise 1A Q3 and Q4.",
        "hero": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiB2aWV3Qm94PSIwIDAgMjAwIDEyMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNkYmVhZmUiIHJ4PSIxNiIvPjx0ZXh0IHg9IjEwMCIgeT0iNjUiIGZvbnQtc2l6ZT0iNDgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuKcqTwvdGV4dD48L3N2Zz4="
      },
      {
        "t": "text",
        "title": "AD Textbook Page 4 Rules: Multiplication & Reciprocals",
        "text": "1. Multiplication: (a/b) × (c/d) = (Product of numerators) / (Product of denominators) = (ac)/(bd).\n2. Reciprocal (Multiplicative Inverse): If (a/b) × (c/d) = 1, then c/d is called the reciprocal of a/b. For example, reciprocal of 3/5 is 5/3, and of -5/8 is -8/5.\n3. Division: Division is the inverse of multiplication. (a/b) ÷ (c/d) = (a/b) × [reciprocal of c/d] = (ad)/(bc) where c/d ≠ 0.\nExample from Page 4: Divide 9/11 by 3/5 = (9/11) ÷ (3/5) = (9/11) × (5/3) = (9 × 5) / (11 × 3) = 15/11."
      },
      {
        "t": "solve",
        "sl": {
          "title": "Guided Step-by-Step Solve: AD Ex 1A Q3(c)",
          "prompt": "Multiply: (11/-13) by (-39/22) (from AD Textbook Exercise 1A Q3).",
          "steps": [
            {
              "instruction": "Step 1: Notice both fractions are negative. What will be the sign of their product?",
              "type": "mcq",
              "q": "Negative multiplied by negative gives:",
              "opts": [
                {"t": "Positive (+)", "c": True, "m": ""},
                {"t": "Negative (-)", "c": False, "m": "Two negative factors always multiply to a positive product."},
                {"t": "Zero", "c": False, "m": "Only multiplying by 0 gives zero."}
              ]
            },
            {
              "instruction": "Step 2: Cross cancel common factors: 11 divides 22 into 2, and 13 divides 39 into 3.",
              "type": "mcq",
              "q": "After cross cancellation, what are the remaining numerator and denominator factors?",
              "opts": [
                {"t": "(1 × 3) / (1 × 2)", "c": True, "m": ""},
                {"t": "(11 × 3) / (13 × 2)", "c": False, "m": "11 and 13 have already cancelled out to 1."},
                {"t": "(2 × 3) / (1 × 1)", "c": False, "m": "22 is in the denominator, so 2 remains in the denominator."}
              ]
            },
            {
              "instruction": "Step 3: Compute the final reduced fraction.",
              "type": "input",
              "q": "Enter final answer (e.g. 3/2):",
              "answer": "3/2",
              "hint": "Numerator 1 × 3 = 3; Denominator 1 × 2 = 2."
            }
          ]
        }
      },
      {
        "t": "quiz",
        "q": {
          "q": "From AD Ex 1A Q4(a): Divide (16/7) by (-8/14). What is the result?",
          "opts": [
            {"t": "-4", "c": True, "m": ""},
            {"t": "4", "c": False, "m": "A positive divided by a negative yields a negative result."},
            {"t": "-16/7", "c": False, "m": "Invert the divisor to 14/-8 and multiply: (16/7) × (14/-8) = 2 × (-2) = -4."},
            {"t": "-2", "c": False, "m": "16/8 = 2, and 14/7 = 2, so 2 × (-2) = -4."}
          ]
        }
      },
      {
        "t": "progress",
        "tokens": 20,
        "xp": 40,
        "text": "Incredible! You have mastered fraction multiplication, cross-cancellation, and reciprocal division!",
        "next": "Algebraic Properties & Distributive Law (AD Ex 1B & 1C)"
      }
    ]
  },
  {
    "title": "Algebraic Properties & Distributivity (AD Ex 1B, 1C)",
    "emoji": "✨",
    "icon": "✨",
    "color": "#ec4899",
    "steps": [
      {
        "t": "intro",
        "icon": "✨",
        "title": "Algebraic Properties & The Distributive Law",
        "sub": "In Exercises 1B and 1C, we prove Closure, Commutative, Associative, and Distributive properties. These laws allow mental arithmetic shortcuts across long expressions!",
        "hero": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiB2aWV3Qm94PSIwIDAgMjAwIDEyMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNkYmVhZmUiIHJ4PSIxNiIvPjx0ZXh0IHg9IjEwMCIgeT0iNjUiIGZvbnQtc2l6ZT0iNDgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuKckTwvdGV4dD48L3N2Zz4="
      },
      {
        "t": "text",
        "title": "AD Textbook Pages 5–8: The 5 Core Properties",
        "text": "1. Closure: Sum, difference, and product of rational numbers are always rational numbers.\n2. Commutative Property: a/b + c/d = c/d + a/b, and (a/b) × (c/d) = (c/d) × (a/b). Subtraction and division are NOT commutative!\n3. Associative Property: (a/b + c/d) + e/f = a/b + (c/d + e/f). Subtraction and division are NOT associative!\n4. Identity Elements: 0 is the Additive Identity (a/b + 0 = a/b). 1 is the Multiplicative Identity (a/b × 1 = a/b).\n5. Distributive Property: (a/b) × [(c/d) ± (e/f)] = [(a/b) × (c/d)] ± [(a/b) × (e/f)]."
      },
      {
        "t": "solve",
        "sl": {
          "title": "Guided Step-by-Step Solve: AD Page 8 Distributive Law",
          "prompt": "Verify: (2/5) × [(-3/7) + (6/11)] = [(2/5) × (-3/7)] + [(2/5) × (6/11)].",
          "steps": [
            {
              "instruction": "Step 1: Solve inside brackets for LHS: -3/7 + 6/11 with LCM 77.",
              "type": "mcq",
              "q": "[(-3 × 11) + (6 × 7)] / 77 equals:",
              "opts": [
                {"t": "9/77", "c": True, "m": ""},
                {"t": "3/77", "c": False, "m": "-33 + 42 = 9."},
                {"t": "-9/77", "c": False, "m": "42 is larger than 33, so the result is positive 9/77."}
              ]
            },
            {
              "instruction": "Step 2: Multiply with outer factor: (2/5) × (9/77).",
              "type": "mcq",
              "q": "(2 × 9) / (5 × 77) equals:",
              "opts": [
                {"t": "18/385", "c": True, "m": ""},
                {"t": "11/82", "c": False, "m": "Multiply numerators together (2 × 9 = 18) and denominators together (5 × 77 = 385)."},
                {"t": "18/77", "c": False, "m": "Don't forget to multiply 5 by 77."}
              ]
            },
            {
              "instruction": "Step 3: Evaluate RHS distributed sum: (-6/35) + (12/55) with LCM 385. (-66 + 84)/385.",
              "type": "input",
              "q": "Enter final RHS fraction:",
              "answer": "18/385",
              "hint": "84 - 66 = 18, over denominator 385."
            }
          ]
        }
      },
      {
        "t": "quiz",
        "q": {
          "q": "AD Prescribed Board Question 1(iii): Name the property used in (-19/29) × (29/-19) = 1",
          "opts": [
            {"t": "Multiplicative Inverse (Reciprocal) Property", "c": True, "m": ""},
            {"t": "Multiplicative Identity Property", "c": False, "m": "Multiplicative identity involves multiplying by 1 to keep value unchanged; here reciprocals multiply to equal 1."},
            {"t": "Commutative Property", "c": False, "m": "Commutativity involves swapping order, not multiplying by the reciprocal."},
            {"t": "Closure Property", "c": False, "m": "Closure guarantees the product is rational, but product equaling 1 specifically demonstrates the reciprocal."}
          ]
        }
      },
      {
        "t": "progress",
        "tokens": 25,
        "xp": 50,
        "text": "🏆 Congratulations! You have conquered the entire AD Class 8 Rational Numbers chapter with full academic rigor!",
        "next": None
      }
    ]
  }
]

# Serialize nodes to JSON
nodes_js = json.dumps(nodes, ensure_ascii=False)

# Replace NODES array in template
pattern = r'var NODES=\[.*?\];\s*var App='
replacement = f'var NODES={nodes_js};\nvar App='
v6_html = re.sub(pattern, replacement, v6_html, flags=re.DOTALL)

target_file = r"C:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\chapters\RationalNumbers_Class8_AD.html"
with open(target_file, "w", encoding="utf-8") as f:
    f.write(v6_html)

print("Successfully generated Gold Standard v6 Chapter for AD Class 8 Rational Numbers!")
print("Output size:", len(v6_html), "bytes")
