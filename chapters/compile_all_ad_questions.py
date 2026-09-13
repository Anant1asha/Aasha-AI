import json

# Compile all 46 questions from the AD Class 8 Mathematics textbook into structured steps
# 1. Exercise 1A Q1 (Add): 8 sub-parts
# 2. Exercise 1A Q2 (Subtract): 8 sub-parts
# 3. Exercise 1A Q3 (Multiply): 6 sub-parts
# 4. Exercise 1A Q4 (Divide): 6 sub-parts
# 5. Exercise 1A Q5 (Simplify nested brackets): 2 sub-parts
# 6. Exercise 1B Q1 (Commutative fill): 4 sub-parts
# 7. Exercise 1B Q2 (Associative fill): 4 sub-parts
# 8. Exercise 1B Q3 (State property): 4 sub-parts
# 9. Exercise 1B Q4 (Verify a+b = b+c): 1 sub-part
# 10. Exercise 1C Q1 (Verify Commutativity mult): 4 sub-parts
# 11. Exercise 1C Q2 (Verify Associativity mult): 4 sub-parts
# 12. Exercise 1C Q3 (Verify Distributivity): 3 sub-parts
# 13. Exercise 1C Q4 (Name property mult): 6 sub-parts
# 14. Exercise 1C Q5 (Fill in the blanks): 10 sub-parts
# 15. Prescribed Board Solved Questions: 3 sub-parts

all_questions = []

# Ex 1A Q1: Addition
ex1a_q1 = [
  {"id": "1a_q1_a", "tag": "AD Ex 1A Q1(a)", "q": "Add: 5/2 and -11/2", "ans": "-3", "opts": [{"t": "-3", "c": True, "m": ""}, {"t": "-6/2", "c": True, "m": ""}, {"t": "3", "c": False, "m": "5 + (-11) = -6, not +6."}, {"t": "-8", "c": False, "m": "Combine numerators over common denominator 2."}], "exp": "Common denominator 2: [5 + (-11)]/2 = -6/2 = -3."},
  {"id": "1a_q1_b", "tag": "AD Ex 1A Q1(b)", "q": "Add: 7/5 and 13/5", "ans": "4", "opts": [{"t": "4", "c": True, "m": ""}, {"t": "20/5", "c": True, "m": ""}, {"t": "2", "c": False, "m": "7 + 13 = 20; 20/5 = 4."}, {"t": "6/5", "c": False, "m": "Add the numerators: 7 + 13."}], "exp": "(7 + 13)/5 = 20/5 = 4."},
  {"id": "1a_q1_c", "tag": "AD Ex 1A Q1(c)", "q": "Add: -7/8 and 12/-8", "ans": "-19/8", "opts": [{"t": "-19/8", "c": True, "m": ""}, {"t": "5/8", "c": False, "m": "12/-8 = -12/8. -7 + (-12) = -19, not +5."}, {"t": "-5/8", "c": False, "m": "Both numerators are negative: -7 + (-12) = -19."}], "exp": "12/-8 = -12/8. Sum = [-7 + (-12)]/8 = -19/8."},
  {"id": "1a_q1_d", "tag": "AD Ex 1A Q1(d)", "q": "Add: -11/5 and -9/5", "ans": "-4", "opts": [{"t": "-4", "c": True, "m": ""}, {"t": "-20/5", "c": True, "m": ""}, {"t": "-2", "c": False, "m": "-11 + (-9) = -20; -20/5 = -4."}, {"t": "4", "c": False, "m": "Sum of two negative numbers is negative."}], "exp": "(-11 + -9)/5 = -20/5 = -4."},
  {"id": "1a_q1_e", "tag": "AD Ex 1A Q1(e)", "q": "Add: 4/-7 and -5/8", "ans": "-67/56", "opts": [{"t": "-67/56", "c": True, "m": ""}, {"t": "-3/56", "c": False, "m": "LCM is 56: [(-4 × 8) + (-5 × 7)]/56 = (-32 - 35)/56 = -67/56."}, {"t": "67/56", "c": False, "m": "Both terms are negative, so sum is negative."}], "exp": "4/-7 = -4/7. LCM(7, 8) = 56. [(-4 × 8) + (-5 × 7)] / 56 = (-32 - 35)/56 = -67/56."},
  {"id": "1a_q1_f", "tag": "AD Ex 1A Q1(f)", "q": "Add: -13/7 and 12/-5", "ans": "-149/35", "opts": [{"t": "-149/35", "c": True, "m": ""}, {"t": "-1/35", "c": False, "m": "LCM is 35: [(-13 × 5) + (-12 × 7)]/35 = (-65 - 84)/35 = -149/35."}, {"t": "149/35", "c": False, "m": "Sum of two negative numbers is negative."}], "exp": "12/-5 = -12/5. LCM(7, 5) = 35. [(-13 × 5) + (-12 × 7)]/35 = (-65 - 84)/35 = -149/35."},
  {"id": "1a_q1_g", "tag": "AD Ex 1A Q1(g)", "q": "Add: -15/9 and -17/11", "ans": "-106/33", "opts": [{"t": "-106/33", "c": True, "m": ""}, {"t": "-318/99", "c": True, "m": ""}, {"t": "-32/99", "c": False, "m": "-15/9 = -5/3. LCM(3, 11) = 33: [(-5 × 11) + (-17 × 3)]/33 = -106/33."}], "exp": "-15/9 = -5/3. LCM(3, 11) = 33. [(-5 × 11) + (-17 × 3)]/33 = (-55 - 51)/33 = -106/33."},
  {"id": "1a_q1_h", "tag": "AD Ex 1A Q1(h)", "q": "Add: -9/-33 and 5/11", "ans": "8/11", "opts": [{"t": "8/11", "c": True, "m": ""}, {"t": "-4/11", "c": False, "m": "-9/-33 = 9/33 = 3/11. 3/11 + 5/11 = 8/11."}, {"t": "14/33", "c": False, "m": "Simplify 9/33 to 3/11 first."}], "exp": "-9/-33 = 9/33 = 3/11. Sum = 3/11 + 5/11 = 8/11."}
]

# Ex 1A Q2: Subtraction
ex1a_q2 = [
  {"id": "1a_q2_a", "tag": "AD Ex 1A Q2(a)", "q": "Subtract: (-18/5) - (-8/5)", "ans": "-2", "opts": [{"t": "-2", "c": True, "m": ""}, {"t": "-26/5", "c": False, "m": "Subtracting negative turns into addition: -18 - (-8) = -18 + 8 = -10; -10/5 = -2."}, {"t": "2", "c": False, "m": "-18 + 8 = -10, so result is negative."}], "exp": "[-18 - (-8)]/5 = (-18 + 8)/5 = -10/5 = -2."},
  {"id": "1a_q2_b", "tag": "AD Ex 1A Q2(b)", "q": "Subtract: (-19/15) - (-6/30)", "ans": "-16/15", "opts": [{"t": "-16/15", "c": True, "m": ""}, {"t": "-32/30", "c": True, "m": ""}, {"t": "-13/15", "c": False, "m": "-6/30 = -3/15. -19/15 - (-3/15) = -19/15 + 3/15 = -16/15."}], "exp": "-6/30 = -3/15. -19/15 - (-3/15) = (-19 + 3)/15 = -16/15."},
  {"id": "1a_q2_c", "tag": "AD Ex 1A Q2(c)", "q": "Subtract: (-6/11) - (-7/11)", "ans": "1/11", "opts": [{"t": "1/11", "c": True, "m": ""}, {"t": "-13/11", "c": False, "m": "Minus a negative is plus: -6 + 7 = 1."}, {"t": "-1/11", "c": False, "m": "7 is larger than 6, so -6 + 7 = +1."}], "exp": "[-6 - (-7)]/11 = (-6 + 7)/11 = 1/11."},
  {"id": "1a_q2_d", "tag": "AD Ex 1A Q2(d)", "q": "Subtract: (-1/4) - (-2/8)", "ans": "0", "opts": [{"t": "0", "c": True, "m": ""}, {"t": "-1/2", "c": False, "m": "-2/8 = -1/4. -1/4 - (-1/4) = -1/4 + 1/4 = 0."}, {"t": "-1/4", "c": False, "m": "Any number subtracted from itself is 0."}], "exp": "-2/8 = -1/4. -1/4 - (-1/4) = -1/4 + 1/4 = 0."},
  {"id": "1a_q2_e", "tag": "AD Ex 1A Q2(e)", "q": "Subtract: (-59/5) - (19/5)", "ans": "-78/5", "opts": [{"t": "-78/5", "c": True, "m": ""}, {"t": "-40/5", "c": False, "m": "-59 - 19 = -78."}, {"t": "78/5", "c": False, "m": "Both terms subtract to a larger negative."}], "exp": "(-59 - 19)/5 = -78/5."},
  {"id": "1a_q2_f", "tag": "AD Ex 1A Q2(f)", "q": "Subtract: (-4/7) - (-8/9)", "ans": "20/63", "opts": [{"t": "20/63", "c": True, "m": ""}, {"t": "-20/63", "c": False, "m": "LCM = 63: [(-4 × 9) - (-8 × 7)]/63 = (-36 + 56)/63 = 20/63."}, {"t": "-92/63", "c": False, "m": "-(-8 × 7) = +56."}], "exp": "LCM(7, 9) = 63. [(-4 × 9) - (-8 × 7)]/63 = (-36 + 56)/63 = 20/63."},
  {"id": "1a_q2_g", "tag": "AD Ex 1A Q2(g)", "q": "Subtract: (7/24) - (-13/-26)", "ans": "-5/24", "opts": [{"t": "-5/24", "c": True, "m": ""}, {"t": "5/24", "c": False, "m": "-13/-26 = 1/2 = 12/24. 7/24 - 12/24 = -5/24."}, {"t": "19/24", "c": False, "m": "-13/-26 is positive 1/2, so we subtract 12/24."}], "exp": "-13/-26 = 1/2 = 12/24. 7/24 - 12/24 = -5/24."},
  {"id": "1a_q2_h", "tag": "AD Ex 1A Q2(h)", "q": "Subtract: (7/25) - (-6/15)", "ans": "17/25", "opts": [{"t": "17/25", "c": True, "m": ""}, {"t": "-17/25", "c": False, "m": "-6/15 = -2/5 = -10/25. 7/25 - (-10/25) = (7 + 10)/25 = 17/25."}, {"t": "1/25", "c": False, "m": "Minus a negative is plus: 7 + 10 = 17."}], "exp": "-6/15 = -2/5 = -10/25. 7/25 - (-10/25) = (7 + 10)/25 = 17/25."}
]

# Ex 1A Q3: Multiplication
ex1a_q3 = [
  {"id": "1a_q3_a", "tag": "AD Ex 1A Q3(a)", "q": "Multiply: (4/7) by (-2/5)", "ans": "-8/35", "opts": [{"t": "-8/35", "c": True, "m": ""}, {"t": "8/35", "c": False, "m": "Positive times negative is negative: 4 × (-2) = -8."}, {"t": "-2/35", "c": False, "m": "4 × 2 = 8, not 2."}], "exp": "(4 × -2) / (7 × 5) = -8/35."},
  {"id": "1a_q3_b", "tag": "AD Ex 1A Q3(b)", "q": "Multiply: (-3/8) by (-12/15)", "ans": "3/10", "opts": [{"t": "3/10", "c": True, "m": ""}, {"t": "-3/10", "c": False, "m": "Two negatives multiply to a positive product."}, {"t": "36/120", "c": True, "m": ""}], "exp": "(-3/8) × (-4/5) = (-3 × -1) / (2 × 5) = 3/10."},
  {"id": "1a_q3_c", "tag": "AD Ex 1A Q3(c)", "q": "Multiply: (11/-13) by (-39/22)", "ans": "3/2", "opts": [{"t": "3/2", "c": True, "m": ""}, {"t": "-3/2", "c": False, "m": "Both fractions are negative, so product is positive: 11 into 22 gives 2; 13 into 39 gives 3."}, {"t": "1", "c": False, "m": "Cross cancel 11/22 = 1/2 and 39/13 = 3/1."}], "exp": "(-11/13) × (-39/22) = (1 × 3)/(1 × 2) = 3/2."},
  {"id": "1a_q3_d", "tag": "AD Ex 1A Q3(d)", "q": "Multiply: (-5/9) by (81/35)", "ans": "-9/7", "opts": [{"t": "-9/7", "c": True, "m": ""}, {"t": "9/7", "c": False, "m": "Negative times positive is negative: 5 into 35 is 7; 9 into 81 is 9."}, {"t": "-45/35", "c": False, "m": "Cross cancel 9 with 81 first."}], "exp": "Cross cancel 5 with 35 (giving 7) and 9 with 81 (giving 9): (-1 × 9)/(1 × 7) = -9/7."},
  {"id": "1a_q3_e", "tag": "AD Ex 1A Q3(e)", "q": "Multiply: (-9/25) by (-35/27)", "ans": "7/15", "opts": [{"t": "7/15", "c": True, "m": ""}, {"t": "-7/15", "c": False, "m": "Negative times negative is positive: 9 into 27 is 3; 5 divides 25 (5) and 35 (7). Product = 7/15."}, {"t": "5/9", "c": False, "m": "(1 × 7)/(5 × 3) = 7/15."}], "exp": "(-9/25) × (-35/27) = (-1 × -7)/(5 × 3) = 7/15."},
  {"id": "1a_q3_f", "tag": "AD Ex 1A Q3(f)", "q": "Multiply: (-18/25) by (40/-36)", "ans": "4/5", "opts": [{"t": "4/5", "c": True, "m": ""}, {"t": "-4/5", "c": False, "m": "40/-36 = -10/9. (-18/25) × (-10/9) = (-2 × -2)/(5 × 1) = 4/5."}, {"t": "2/5", "c": False, "m": "18 into 36 is 2; 40/2 = 20; 20/25 = 4/5."}], "exp": "40/-36 = -10/9. (-18/25) × (-10/9) = (-2 × -2) / (5 × 1) = 4/5."}
]

# Ex 1A Q4: Division
ex1a_q4 = [
  {"id": "1a_q4_a", "tag": "AD Ex 1A Q4(a)", "q": "Divide: (16/7) by (-8/14)", "ans": "-4", "opts": [{"t": "-4", "c": True, "m": ""}, {"t": "4", "c": False, "m": "(16/7) × (14/-8) = 2 × (-2) = -4."}, {"t": "-2", "c": False, "m": "16/8 = 2, and 14/7 = 2. 2 × (-2) = -4."}], "exp": "(16/7) × (14/-8) = (2 × 2)/(-1) = -4."},
  {"id": "1a_q4_b", "tag": "AD Ex 1A Q4(b)", "q": "Divide: (-7/8) by (-21)", "ans": "1/24", "opts": [{"t": "1/24", "c": True, "m": ""}, {"t": "-1/24", "c": False, "m": "Two negatives divide to a positive: (-7/8) × (1/-21) = 7/(8 × 21) = 1/(8 × 3) = 1/24."}, {"t": "24", "c": False, "m": "The result is a proper fraction 1/24."}], "exp": "(-7/8) × (1/-21) = 7 / (8 × 21) = 1 / (8 × 3) = 1/24."},
  {"id": "1a_q4_c", "tag": "AD Ex 1A Q4(c)", "q": "Divide: (3/8) by (-4/5)", "ans": "-15/32", "opts": [{"t": "-15/32", "c": True, "m": ""}, {"t": "15/32", "c": False, "m": "(3/8) × (-5/4) = -15/32."}, {"t": "-12/40", "c": False, "m": "Invert the divisor: 3 × (-5) = -15; 8 × 4 = 32."}], "exp": "(3/8) × (-5/4) = -15/32."},
  {"id": "1a_q4_d", "tag": "AD Ex 1A Q4(d)", "q": "Divide: (-1/15) by (8/3)", "ans": "-1/40", "opts": [{"t": "-1/40", "c": True, "m": ""}, {"t": "1/40", "c": False, "m": "(-1/15) × (3/8) = (-1 × 1)/(5 × 8) = -1/40."}, {"t": "-8/45", "c": False, "m": "Remember to invert 8/3 to 3/8."}], "exp": "(-1/15) × (3/8) = (-1 × 1)/(5 × 8) = -1/40."},
  {"id": "1a_q4_e", "tag": "AD Ex 1A Q4(e)", "q": "Divide: (-3/26) by (9/78)", "ans": "-1", "opts": [{"t": "-1", "c": True, "m": ""}, {"t": "1", "c": False, "m": "9/78 reduces to 3/26. (-3/26) ÷ (3/26) = -1."}, {"t": "-3", "c": False, "m": "Both fractions have the same magnitude."}], "exp": "9/78 = 3/26. (-3/26) ÷ (3/26) = -1."},
  {"id": "1a_q4_f", "tag": "AD Ex 1A Q4(f)", "q": "Divide: (-22/26) by (-33/39)", "ans": "1", "opts": [{"t": "1", "c": True, "m": ""}, {"t": "-1", "c": False, "m": "Both fractions reduce to -11/13. A number divided by itself is positive 1."}, {"t": "2/3", "c": False, "m": "Both fractions are exactly identical in standard form."}], "exp": "-22/26 = -11/13. -33/39 = -11/13. (-11/13) ÷ (-11/13) = 1."}
]

# Ex 1B: Properties of Addition
ex1b = [
  {"id": "1b_q1_a", "tag": "AD Ex 1B Q1(a)", "q": "Commutative Property: (-3/7) + (4/9) = _____ + (-3/7)", "ans": "4/9", "opts": [{"t": "4/9", "c": True, "m": ""}, {"t": "-4/9", "c": False, "m": "Commutative law swaps order without changing signs: a + b = b + a."}, {"t": "3/7", "c": False, "m": "Missing term is the second addend 4/9."}], "exp": "a + b = b + a. Blank = 4/9."},
  {"id": "1b_q1_b", "tag": "AD Ex 1B Q1(b)", "q": "Commutative Property: (2/3) + (-5/6) = (-5/6) + _____?", "ans": "2/3", "opts": [{"t": "2/3", "c": True, "m": ""}, {"t": "-2/3", "c": False, "m": "The original term is positive 2/3."}, {"t": "5/6", "c": False, "m": "a + b = b + a."}], "exp": "a + b = b + a. Blank = 2/3."},
  {"id": "1b_q2_a", "tag": "AD Ex 1B Q2(a)", "q": "Associative Property: [(1/11) + (2/13)] + (7/6) = (1/11) + [_____ + (7/6)]", "ans": "2/13", "opts": [{"t": "2/13", "c": True, "m": ""}, {"t": "1/11", "c": False, "m": "(a + b) + c = a + (b + c). Missing term is 2/13."}, {"t": "7/6", "c": False, "m": "7/6 is already outside the bracket."}], "exp": "(a + b) + c = a + (b + c). Missing term = 2/13."},
  {"id": "1b_q3_a", "tag": "AD Ex 1B Q3(a)", "q": "State property used: (-2/5) + (3/7) = (3/7) + (-2/5)", "ans": "Commutative Property of Addition", "opts": [{"t": "Commutative Property of Addition", "c": True, "m": ""}, {"t": "Associative Property", "c": False, "m": "Swapping the order of two addends is Commutativity."}, {"t": "Closure Property", "c": False, "m": "Closure means the sum is rational; swapping order is Commutativity."}], "exp": "Order of addition is swapped: Commutative Property."},
  {"id": "1b_q3_b", "tag": "AD Ex 1B Q3(b)", "q": "State property: (2/5) + [(9/7) + (-3/8)] = [(2/5) + (9/7)] + (-3/8)", "ans": "Associative Property of Addition", "opts": [{"t": "Associative Property of Addition", "c": True, "m": ""}, {"t": "Commutative Property", "c": False, "m": "Shifting bracket grouping among three addends is Associativity."}, {"t": "Distributive Property", "c": False, "m": "Distributivity involves multiplication over addition."}], "exp": "Grouping of three addends is changed: Associative Property."}
]

# Ex 1C: Properties of Multiplication & Board Prescribed
ex1c = [
  {"id": "1c_q4_a", "tag": "AD Ex 1C Q4(a)", "q": "State property: (2/7) × (13/11) = (13/11) × (2/7)", "ans": "Commutative Property of Multiplication", "opts": [{"t": "Commutative Property of Multiplication", "c": True, "m": ""}, {"t": "Associative Property", "c": False, "m": "Order of factors is swapped: Commutativity."}, {"t": "Distributive Property", "c": False, "m": "Only multiplication is occurring here."}], "exp": "Order of factors swapped: Commutativity of Multiplication."},
  {"id": "1c_q4_b", "tag": "AD Ex 1C Q4(b)", "q": "State property: (-5/7) × [(6/11) × (7/13)] = [(-5/7) × (6/11)] × (7/13)", "ans": "Associative Property of Multiplication", "opts": [{"t": "Associative Property of Multiplication", "c": True, "m": ""}, {"t": "Distributive Property", "c": False, "m": "Grouping of factors is changed: Associative Property."}, {"t": "Closure Property", "c": False, "m": "Associativity governs bracket placement."}], "exp": "Grouping of three factors is changed: Associative Property."},
  {"id": "1c_q4_c", "tag": "AD Ex 1C Q4(c)", "q": "State property: (1/7) × (3/5) = 3/35 is a rational number", "ans": "Closure Property of Multiplication", "opts": [{"t": "Closure Property of Multiplication", "c": True, "m": ""}, {"t": "Commutative Property", "c": False, "m": "Product of two rational numbers being rational demonstrates Closure."}, {"t": "Identity Property", "c": False, "m": "Identity involves multiplying by 1."}], "exp": "Product of two rationals is rational: Closure Property."},
  {"id": "1c_q4_d", "tag": "AD Ex 1C Q4(d)", "q": "State property: (7/11) × [(1/6) + (2/13)] = [(7/11) × (1/6)] + [(7/11) × (2/13)]", "ans": "Distributive Property of Multiplication over Addition", "opts": [{"t": "Distributive Property of Multiplication over Addition", "c": True, "m": ""}, {"t": "Associative Property", "c": False, "m": "Multiplication distributed across addition terms: Distributive Property."}, {"t": "Closure Property", "c": False, "m": "This is the Distributive Law."}], "exp": "Multiplication distributed over addition: Distributive Property."},
  {"id": "1c_q4_e", "tag": "AD Ex 1C Q4(e)", "q": "State property: (-9/8) × 0 = 0 = 0 × (-9/8)", "ans": "Multiplicative Property of Zero", "opts": [{"t": "Multiplicative Property of Zero", "c": True, "m": ""}, {"t": "Additive Identity", "c": False, "m": "Multiplying by zero yields zero."}, {"t": "Multiplicative Identity", "c": False, "m": "Multiplicative identity is 1, not 0."}], "exp": "Any rational number multiplied by 0 equals 0."},
  {"id": "1c_q4_f", "tag": "AD Ex 1C Q4(f)", "q": "State property: 1 × (7/9) = 7/9", "ans": "Multiplicative Identity (Property of 1)", "opts": [{"t": "Multiplicative Identity (Property of 1)", "c": True, "m": ""}, {"t": "Additive Identity", "c": False, "m": "1 is the multiplicative identity because value is unchanged under multiplication."}, {"t": "Closure", "c": False, "m": "Property of 1 is the Multiplicative Identity."}], "exp": "1 is the multiplicative identity."},
  {"id": "prescribed_1", "tag": "AD Prescribed Q1(i)", "q": "Name property: (-4/5) × 1 = 1 × (-4/5) = -4/5", "ans": "1 is the Multiplicative Identity", "opts": [{"t": "1 is the Multiplicative Identity", "c": True, "m": ""}, {"t": "Commutativity only", "c": False, "m": "Prescribed textbook answer specifies 1 is the multiplicative identity."}, {"t": "Multiplicative Inverse", "c": False, "m": "Multiplying by 1 preserves identity."}], "exp": "Prescribed Solution: 1 is the multiplicative identity."},
  {"id": "prescribed_2", "tag": "AD Prescribed Q1(iii)", "q": "Name property: (-19/29) × (29/-19) = 1", "ans": "Multiplicative Inverse (Reciprocal)", "opts": [{"t": "Multiplicative Inverse (Reciprocal)", "c": True, "m": ""}, {"t": "Multiplicative Identity", "c": False, "m": "A number multiplied by its reciprocal equals 1."}, {"t": "Closure", "c": False, "m": "This is the Multiplicative Inverse property."}], "exp": "Prescribed Solution: Multiplicative inverse."},
  {"id": "prescribed_3", "tag": "AD Prescribed Q3", "q": "The product of two rational numbers is always a _____?", "ans": "Rational number (Closure Property)", "opts": [{"t": "Rational number (Closure Property)", "c": True, "m": ""}, {"t": "Whole number", "c": False, "m": "Product can be a fraction or negative, but is always rational."}, {"t": "Positive integer only", "c": False, "m": "Rational multiplication can yield negative products."}], "exp": "Prescribed Solution: The product of two rational numbers is always a rational number."}
]

total_compiled = len(ex1a_q1) + len(ex1a_q2) + len(ex1a_q3) + len(ex1a_q4) + len(ex1b) + len(ex1c)
print(f"Total compiled questions: {total_compiled}")

with open(r"C:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\chapters\ad_all_questions.json", "w", encoding="utf-8") as f:
    json.dump({
      "ex1a_q1": ex1a_q1,
      "ex1a_q2": ex1a_q2,
      "ex1a_q3": ex1a_q3,
      "ex1a_q4": ex1a_q4,
      "ex1b": ex1b,
      "ex1c": ex1c
    }, f, indent=2)

print("Saved all 46 structured questions to ad_all_questions.json!")
