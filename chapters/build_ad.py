# Generator script to assemble AD Class 8 Rational Numbers standalone HTML
target_file = r"C:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\chapters\RationalNumbers_Class8_AD.html"
base_file = r"C:\Users\admin\Downloads\NGO AI LLM\Aasha-AI\chapters\RationalNumbers_Class8_MDS.html"

with open(base_file, "r", encoding="utf-8") as f:
    base_html = f.read()

print("Base file size:", len(base_html))
