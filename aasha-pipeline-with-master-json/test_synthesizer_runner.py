import json
import sys
from pathlib import Path

# Add src to sys.path
src_dir = Path(__file__).parent / "src"
sys.path.insert(0, str(src_dir))

from aasha.synthesis.code_synthesizer import FrontendCodeSynthesizer

work_dir = Path(__file__).parent / "test_output"
work_dir.mkdir(exist_ok=True)

pedagogy_map = {
    "chapter_title": "Class 8 Algebraic Expressions",
    "subject": "math",
    "grade": 8,
    "concepts": [
        {"name": "Terms and Coefficients", "summary": "Variables, constants, and terms in algebra.", "key_ideas": ["variable", "coefficient"], "difficulty": "easy", "plugin": "jsxgraph"},
        {"name": "Multiplication of Monomials", "summary": "Distributive law and powers.", "key_ideas": ["distributive", "powers"], "difficulty": "medium", "plugin": "mermaid"},
    ]
}

experience_plan = {
    "concepts": pedagogy_map["concepts"],
    "plugins_used": ["jsxgraph", "mermaid"]
}

assessment_suite = {
    "warmup": [
        {"id": "q_w1", "node_id": "node_1", "question": "Identify the coefficient in -4xy", "opts": [{"t": "-4", "c": True, "m": ""}, {"t": "4", "c": False, "m": "Notice the negative sign in front of the term."}], "xp": 5, "hint": "Look at the signed number"}
    ],
    "deep_dive": [
        {"id": "q_d1", "node_id": "node_2", "question": "Simplify 2x(3x + 4)", "opts": [{"t": "6x² + 8x", "c": True, "m": ""}, {"t": "6x + 8x", "c": False, "m": "Multiply the variables: x times x equals x squared."}], "xp": 10, "hint": "Distribute 2x to both terms"}
    ],
    "boss": [
        {"id": "q_b1", "node_id": "node_2", "question": "Multiply (x + 2)(x + 3)", "opts": [{"t": "x² + 5x + 6", "c": True, "m": ""}, {"t": "x² + 6", "c": False, "m": "Remember the middle terms when expanding (2x + 3x)."}], "xp": 20, "hint": "Use FOIL method"}
    ]
}

for name, data in [("pedagogy_map.json", pedagogy_map), ("experience_plan.json", experience_plan), ("assessment_suite.json", assessment_suite)]:
    with open(work_dir / name, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

synthesizer = FrontendCodeSynthesizer()
result = synthesizer.run(work_dir, {"subject": "math", "grade": 8})
print("Synthesis Result:", result)

html_path = work_dir / "chapter.html"
assert html_path.exists(), "chapter.html must exist"
html_content = html_path.read_text(encoding="utf-8")

# Verifications
assert "MathIsolation" in html_content, "Math isolation tag missing"
assert "data:text/javascript;base64," in html_content, "Plugin base64 lib script missing"
assert "progressionDecision" in html_content, "TEAS progression engine missing"
assert "sync_outbox" in html_content, "Telemetry outbox missing"
assert "quiz-opts-container" in html_content, "Universal question contract missing"

print("\nALL SYNTHESIZER CHECKS PASSED SUCCESSFULLY!")
