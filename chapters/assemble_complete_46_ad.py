import json, re

# Load Gold Standard v6 Base HTML
base_file = r"C:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\chapters\AlgebraicExpressions_Class8_Gamified_v5_Enhanced_v6.html"
with open(base_file, "r", encoding="utf-8") as f:
    v6_html = f.read()

# Load all 46 questions nodes
with open(r"C:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\chapters\ad_full_nodes_46.json", "r", encoding="utf-8") as f:
    nodes = json.load(f)

# Replace Title, Headers, Storage Key
v6_html = re.sub(r'<title>.*?</title>', '<title>Rational Numbers (AD Edition — All 46 Book Questions) — Aasha Learning Ecosystem</title>', v6_html)
v6_html = v6_html.replace('Algebraic Expressions & Identities', 'Rational Numbers (परिमेय संख्याएँ)')
v6_html = v6_html.replace('Chapter 1: Rational Numbers', 'Chapter 1: Rational Numbers (AD Class 8 Math — All 46 Questions)')
v6_html = v6_html.replace('aasha_algebra8_v5', 'aasha_rational_ad_all_46_v6')

# Serialize nodes
nodes_js = json.dumps(nodes, ensure_ascii=False)

# Replace NODES array in template
pattern = r'var NODES=\[.*?\];\s*var App='
replacement = f'var NODES={nodes_js};\nvar App='
v6_html = re.sub(pattern, replacement, v6_html, flags=re.DOTALL)

target_file = r"C:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\chapters\RationalNumbers_Class8_AD.html"
with open(target_file, "w", encoding="utf-8") as f:
    f.write(v6_html)

print("Successfully generated Complete 46-Question Chapter HTML at:", target_file)
print("File size:", len(v6_html), "bytes")
