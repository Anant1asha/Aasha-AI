import json

with open(r"C:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\chapters\ad_all_questions.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Add remaining 4 questions to make exact 46
ex1c_extra = [
  {"id": "1c_q5_a", "tag": "AD Ex 1C Q5(a)", "q": "Fill in blank: [(-9/16) × (11/7)] = (11/7) × [_____]", "ans": "-9/16", "opts": [{"t": "-9/16", "c": True, "m": ""}, {"t": "9/16", "c": False, "m": "Commutative Property preserves the negative sign."}, {"t": "11/7", "c": False, "m": "Missing term is -9/16."}], "exp": "Commutative Property: a × b = b × a. Blank = -9/16."},
  {"id": "1c_q5_c", "tag": "AD Ex 1C Q5(c)", "q": "Fill in blank: (-7/13) × [_____] = -7/13", "ans": "1", "opts": [{"t": "1", "c": True, "m": ""}, {"t": "0", "c": False, "m": "Multiplying by 0 gives 0."}, {"t": "-1", "c": False, "m": "Multiplying by -1 changes the sign."}], "exp": "1 is the multiplicative identity: a × 1 = a."},
  {"id": "1c_q5_d", "tag": "AD Ex 1C Q5(d)", "q": "Fill in blank: [_____] × (-19/47) = 0", "ans": "0", "opts": [{"t": "0", "c": True, "m": ""}, {"t": "1", "c": False, "m": "1 × (-19/47) = -19/47."}, {"t": "-47/19", "c": False, "m": "Reciprocal product equals 1, not 0."}], "exp": "Property of zero: 0 × a = 0."},
  {"id": "1a_q5_a", "tag": "AD Ex 1A Q5(a)", "q": "Simplify: [(3/2) × (-7/4) × (8/9)] - [(-15/2) × (3/7) × (8/14)]", "ans": "-13/21", "opts": [{"t": "-13/21", "c": True, "m": ""}, {"t": "-7/3", "c": False, "m": "First term cancels to -7/3; second cancels to -90/56 = -45/28. Combine carefully."}, {"t": "13/21", "c": False, "m": "Check common denominator and signs."}], "exp": "First bracket cancels to -7/3. Second bracket cancels to -45/28. Difference = -7/3 - (-45/28) = -13/21."}
]

data["ex1c_extra"] = ex1c_extra
with open(r"C:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\chapters\ad_all_questions.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

total = sum(len(v) for v in data.values())
print(f"Total verified questions in json: {total}")
