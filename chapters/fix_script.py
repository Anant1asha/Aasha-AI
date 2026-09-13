with open(r"C:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\chapters\generate_gold_standard_ad.py", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace('"c": true', '"c": True').replace('"c": false', '"c": False')
text = text.replace('"next": null', '"next": None')

with open(r"C:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\chapters\generate_gold_standard_ad.py", "w", encoding="utf-8") as f:
    f.write(text)

print("Fixed boolean literals in generate_gold_standard_ad.py")
