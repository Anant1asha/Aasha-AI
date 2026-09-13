import json

with open(r"C:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\chapters\ad_all_questions.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Node 1: Stationery Shop & Rational Numbers (Embark On)
node1_steps = [
  {
    "t": "intro",
    "icon": "🏪",
    "title": "Seema & Sachin at the Stationery Shop",
    "sub": "Welcome to Class 8 Mathematics! Seema and Sachin are shopping for school stationery when they stumble upon a wholesale bargain. Let us discover why integers fail and rational numbers are born!",
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
            {"t": "32/48", "c": False, "m": "32 × (-1) = -32."},
            {"t": "-48/32", "c": False, "m": "Do not invert the fraction."}
          ]
        },
        {
          "instruction": "Step 2: Find the Highest Common Factor (HCF) of 32 and 48.",
          "type": "mcq",
          "q": "What is the HCF of 32 and 48?",
          "opts": [
            {"t": "16", "c": True, "m": ""},
            {"t": "8", "c": False, "m": "16 is a higher common factor."},
            {"t": "12", "c": False, "m": "12 does not divide 32."}
          ]
        },
        {
          "instruction": "Step 3: Divide both parts by 16: (-32 ÷ 16) / (48 ÷ 16).",
          "type": "input",
          "q": "Enter the final standard fraction (e.g. -2/3):",
          "answer": "-2/3",
          "hint": "-32 ÷ 16 = -2; 48 ÷ 16 = 3."
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
        {"t": "Because zero is not considered an integer", "c": False, "m": "Zero is an integer, but dividing into zero parts has no mathematical meaning."},
        {"t": "Because fractions can only contain positive numbers", "c": False, "m": "Rationals routinely contain negative integers."},
        {"t": "Because zero erases the numerator", "c": False, "m": "0 in numerator gives 0, but 0 in denominator is undefined."}
      ]
    }
  },
  {
    "t": "progress",
    "tokens": 15,
    "xp": 35,
    "text": "Outstanding! You have mastered the definition of rational numbers and standard form!",
    "next": "Number Line & Density"
  }
]

# Node 2: Number Line Coordinates & Density
node2_steps = [
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
    "t": "quiz",
    "q": {
      "q": "Between which two consecutive integers does the rational number 13/5 lie on the number line?",
      "opts": [
        {"t": "Between 2 and 3 (since 13/5 = 2 and 3/5)", "c": True, "m": ""},
        {"t": "Between 1 and 2", "c": False, "m": "13/5 is 2.6, which is greater than 2."},
        {"t": "Between 3 and 4", "c": False, "m": "13/5 is less than 3."},
        {"t": "Between 12 and 14", "c": False, "m": "Convert improper fraction to mixed fraction first."}
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
        {"t": "No rational numbers exist between them", "c": False, "m": "Rational numbers are densely distributed."},
        {"t": "Only ten rational numbers", "c": False, "m": "Subdivisions are endless."}
      ]
    }
  },
  {
    "t": "progress",
    "tokens": 15,
    "xp": 35,
    "text": "Brilliant! You can now pinpoint any rational number on the infinite coordinate line!",
    "next": "Exercise 1A: Addition Drills"
  }
]

# Node 3: Exercise 1A Addition (All 8 sub-parts from Q1)
node3_steps = [
  {
    "t": "intro",
    "icon": "➕",
    "title": "Exercise 1A: Rational Addition Arena",
    "sub": "Master all 8 addition challenges directly from Exercise 1A of the AD textbook! Match denominators via LCM, simplify signs, and reduce to standard form.",
    "hero": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiB2aWV3Qm94PSIwIDAgMjAwIDEyMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNkYmVhZmUiIHJ4PSIxNiIvPjx0ZXh0IHg9IjEwMCIgeT0iNjUiIGZvbnQtc2l6ZT0iNDgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuKnuTwvdGV4dD48L3N2Zz4="
  },
  {
    "t": "text",
    "title": "Addition Rules for Exercise 1A",
    "text": "Rule 1: If denominators are identical: a/b + c/b = (a + c)/b.\nRule 2: If denominators differ: find LCM(b, d), scale fractions to common slice size: a/b + c/d = (ad + bc)/bd.\nRule 3: Purge negative denominators to standard form before finding LCM!"
  }
]
for item in data["ex1a_q1"]:
  node3_steps.append({
    "t": "quiz",
    "q": {
      "q": f"[{item['tag']}] {item['q']}",
      "opts": item["opts"]
    }
  })
node3_steps.append({
  "t": "progress",
  "tokens": 25,
  "xp": 50,
  "text": "🏆 Outstanding! You have solved 100% of Exercise 1A Question 1 addition problems!",
  "next": "Exercise 1A: Subtraction Arena"
})

# Node 4: Exercise 1A Subtraction (All 8 sub-parts from Q2)
node4_steps = [
  {
    "t": "intro",
    "icon": "➖",
    "title": "Exercise 1A: Rational Subtraction Arena",
    "sub": "Subtracting rational numbers means adding the additive inverse! Conquer all 8 subtraction problems from Exercise 1A.",
    "hero": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiB2aWV3Qm94PSIwIDAgMjAwIDEyMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNkYmVhZmUiIHJ4PSIxNiIvPjx0ZXh0IHg9IjEwMCIgeT0iNjUiIGZvbnQtc2l6ZT0iNDgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuKItTwvdGV4dD48L3N2Zz4="
  },
  {
    "t": "text",
    "title": "Subtraction Rule: Additive Inverse",
    "text": "To subtract c/d from a/b, add the additive inverse of c/d: a/b - c/d = a/b + (-c/d). Remember: minus a negative turns into a positive!"
  }
]
for item in data["ex1a_q2"]:
  node4_steps.append({
    "t": "quiz",
    "q": {
      "q": f"[{item['tag']}] {item['q']}",
      "opts": item["opts"]
    }
  })
node4_steps.append({
  "t": "progress",
  "tokens": 25,
  "xp": 50,
  "text": "🏆 Incredible! You have solved 100% of Exercise 1A Question 2 subtraction problems!",
  "next": "Exercise 1A: Multiplication & Division Arena"
})

# Node 5: Exercise 1A Multiplication & Division (Q3, Q4 & Q5)
node5_steps = [
  {
    "t": "intro",
    "icon": "✖️",
    "title": "Exercise 1A: Multiplication & Division Arena",
    "sub": "Multiply numerators and denominators directly using cross-cancellation. Divide by multiplying by the flipped reciprocal twin! Covers all of Q3, Q4, and Q5.",
    "hero": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiB2aWV3Qm94PSIwIDAgMjAwIDEyMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNkYmVhZmUiIHJ4PSIxNiIvPjx0ZXh0IHg9IjEwMCIgeT0iNjUiIGZvbnQtc2l6ZT0iNDgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuKcqTwvdGV4dD48L3N2Zz4="
  }
]
for item in data["ex1a_q3"]:
  node5_steps.append({
    "t": "quiz",
    "q": {
      "q": f"[{item['tag']}] {item['q']}",
      "opts": item["opts"]
    }
  })
for item in data["ex1a_q4"]:
  node5_steps.append({
    "t": "quiz",
    "q": {
      "q": f"[{item['tag']}] {item['q']}",
      "opts": item["opts"]
    }
  })
# Add Q5 simplify
for item in data.get("ex1c_extra", []):
  if "1a_q5" in item["id"]:
    node5_steps.append({
      "t": "quiz",
      "q": {
        "q": f"[{item['tag']}] {item['q']}",
        "opts": item["opts"]
      }
    })

node5_steps.append({
  "t": "progress",
  "tokens": 30,
  "xp": 60,
  "text": "🏆 Mastery! You have conquered all multiplication, division, and nested simplification in Exercise 1A!",
  "next": "Exercise 1B & 1C: Algebraic Properties & Board Exam Arena"
})

# Node 6: Exercise 1B & 1C Algebraic Properties & Board Prescribed Arena
node6_steps = [
  {
    "t": "intro",
    "icon": "✨",
    "title": "Exercise 1B, 1C & Board Exam Master Arena",
    "sub": "Prove and apply Closure, Commutative, Associative, and Distributive laws across Exercises 1B, 1C, and Prescribed Board Solved Questions!",
    "hero": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiB2aWV3Qm94PSIwIDAgMjAwIDEyMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNkYmVhZmUiIHJ4PSIxNiIvPjx0ZXh0IHg9IjEwMCIgeT0iNjUiIGZvbnQtc2l6ZT0iNDgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuKckTwvdGV4dD48L3N2Zz4="
  },
  {
    "t": "text",
    "title": "Summary of Properties (Pages 5–8)",
    "text": "1. Closure: a + b, a - b, a × b are always rational numbers.\n2. Commutativity: a + b = b + a and a × b = b × a (subtraction & division are NOT commutative).\n3. Associativity: (a + b) + c = a + (b + c) and (a × b) × c = a × (b × c).\n4. Distributivity: a × (b ± c) = (a × b) ± (a × c).\n5. Identities: 0 is additive identity; 1 is multiplicative identity. Reciprocal product equals 1."
  }
]
for item in data["ex1b"]:
  node6_steps.append({
    "t": "quiz",
    "q": {
      "q": f"[{item['tag']}] {item['q']}",
      "opts": item["opts"]
    }
  })
for item in data["ex1c"]:
  node6_steps.append({
    "t": "quiz",
    "q": {
      "q": f"[{item['tag']}] {item['q']}",
      "opts": item["opts"]
    }
  })
for item in data.get("ex1c_extra", []):
  if "1c_q5" in item["id"]:
    node6_steps.append({
      "t": "quiz",
      "q": {
        "q": f"[{item['tag']}] {item['q']}",
        "opts": item["opts"]
      }
    })

node6_steps.append({
  "t": "progress",
  "tokens": 50,
  "xp": 100,
  "text": "👑 GRAND CHAMPION! You have solved 100% of all 46 textbook problems from AD Class 8 Mathematics Chapter 1!",
  "next": None
})

all_nodes = [
  {"title": "The Stationery Shop & p/q Definition", "emoji": "🏪", "icon": "🏪", "color": "#3b82f6", "steps": node1_steps},
  {"title": "Number Line Coordinates & Density", "emoji": "📍", "icon": "📍", "color": "#10b981", "steps": node2_steps},
  {"title": "Ex 1A: Addition Arena (All 8 Qs)", "emoji": "➕", "icon": "➕", "color": "#f59e0b", "steps": node3_steps},
  {"title": "Ex 1A: Subtraction Arena (All 8 Qs)", "emoji": "➖", "icon": "➖", "color": "#ef4444", "steps": node4_steps},
  {"title": "Ex 1A: Multiply & Divide (All 14 Qs)", "emoji": "✖️", "icon": "✖️", "color": "#8b5cf6", "steps": node5_steps},
  {"title": "Ex 1B & 1C: Properties Arena (All 16 Qs)", "emoji": "✨", "icon": "✨", "color": "#ec4899", "steps": node6_steps}
]

with open(r"C:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\chapters\ad_full_nodes_46.json", "w", encoding="utf-8") as f:
    json.dump(all_nodes, f, indent=2)

print("Generated ad_full_nodes_46.json containing all 46 questions across 6 Nodes!")
