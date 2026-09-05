"""
LLE Integration Examples — How to add the Language Layer Engine
to existing Python agent frameworks.

Covers: LangChain, LlamaIndex, Haystack, and a plain custom agent.
"""

# ═══════════════════════════════════════════════════════════════
# EXAMPLE 1: LangChain Integration
# ═══════════════════════════════════════════════════════════════
"""
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from lle_engine import LLE

# Initialize LLE once
lle = LLE()

# Optionally load domain-specific vocabulary
lle.load_words({
    "photosynthesis": "प्रकाश संश्लेषण (फोटोसिंथेसिस)",
    "chlorophyll": "क्लोरोफिल (क्लोरोफिल)",
    "ecosystem": "पारिस्थितिकी तंत्र (ईकोसिस्टम)",
})

# Your normal chain
prompt = ChatPromptTemplate.from_template("Explain {topic} for a 6th grade student.")
model = ChatOpenAI(temperature=0.7)
chain = prompt | model | StrOutputParser

# Generate English content
english_text = chain.invoke({"topic": "photosynthesis"})

# Pass through LLE before returning to user
bilingual_html = lle.render_text(english_text)

# Find unknown words to expand dictionary
gaps = lle.get_unknown_words(english_text)
print(f"Vocabulary gaps: {gaps}")

# Return bilingual HTML to frontend
return bilingual_html
"""


# ═══════════════════════════════════════════════════════════════
# EXAMPLE 2: LlamaIndex Integration
# ═══════════════════════════════════════════════════════════════
"""
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
from lle_engine import LLE

lle = LLE()

# Load domain-specific words from your subject
lle.load_words({
    "mauryan": "मौर्य (मॉरियन)",
    "ashoka": "अशोक (अशोका)",
    "edict": "अभिलेख (एडिक्ट)",
})

documents = SimpleDirectoryReader("./data").load_data()
index = VectorStoreIndex.from_documents(documents)

# Query
response = index.as_query_engine().query("Who was Emperor Ashoka?")
english_answer = str(response)

# Wrap with LLE
bilingual_html = lle.render_text(english_answer)

# Export updated dict for frontend
lle.export_js("./static/lle_custom_words.js")
"""


# ═══════════════════════════════════════════════════════════════
# EXAMPLE 3: Middleware Pattern (framework-agnostic)
# ═══════════════════════════════════════════════════════════════
"""
from lle_engine import LLE

class LLEMiddleware:
    \"\"\"
    Wrap any agent's text output with the Language Layer Engine.
    Drop this between your agent's response and the frontend.
    \"\"\"
    def __init__(self, domain_words=None):
        self.lle = LLE()
        if domain_words:
            self.lle.load_words(domain_words)

    def process(self, agent_response: str) -> dict:
        \"\"\"
        Takes the agent's English response.
        Returns bilingual HTML + metadata.
        \"\"\"
        html = self.lle.render_text(agent_response)
        unknown = self.lle.get_unknown_words(agent_response)

        return {
            "html": html,
            "unknown_words": unknown,
            "dict_size": self.lle.dict_size(),
        }

    def learn_word(self, english: str, hindi: str, romanized: str = ""):
        \"\"\"Add a word to the dictionary at runtime.\"\"\"
        self.lle.add_word(english, hindi, romanized)

    def export_for_frontend(self, path: str):
        \"\"\"Export current dictionary as JS for the frontend.\"\"\"
        self.lle.export_js(path)


# Usage
middleware = LLEMiddleware(domain_words={
    "democracy": "लोकतंत्र (डिमॉक्रेसी)",
    "parliament": "संसद (पार्लियामेंट)",
    "constitution": "संविधान (कॉन्स्टिट्यूशन)",
})

# Your agent generates English text
agent_output = "Democracy is a system where people elect their representatives."

# LLE wraps it
result = middleware.process(agent_output)
# result["html"] → bilingual HTML with word-level Hindi
# result["unknown_words"] → ["elect", "representatives", "system"]

# Learn missing words
middleware.learn_word("representatives", "प्रतिनिधि", "रेप्रज़ेन्टेटिव्स")
middleware.learn_word("elect", "चुनना", "इलेक्ट")
"""


# ═══════════════════════════════════════════════════════════════
# EXAMPLE 4: HTML Frontend Integration (with lle.js)
# ═══════════════════════════════════════════════════════════════
"""
<!-- In your HTML page -->
<script src="lle.js"></script>
<script>
  // Initialize LLE
  LLE.init();

  // Optionally load domain-specific words
  LLE.loadDictionary({
    "photosynthesis": "प्रकाश संश्लेषण (फोटोसिंथेसिस)",
    "chlorophyll": "क्लोरोफिल (क्लोरोफिल)"
  });

  // When your agent returns text, render it through LLE
  function displayAgentResponse(englishText) {
    var html = LLE.renderText(englishText);
    document.getElementById('response-area').innerHTML = html;
  }

  // Or if using fetch to call your agent API:
  async function askAgent(question) {
    const res = await fetch('/api/agent', {
      method: 'POST',
      body: JSON.stringify({query: question})
    });
    const data = await res.json();
    // data.text is the English response from your agent
    document.getElementById('response-area').innerHTML = LLE.renderText(data.text);
  }
</script>
"""


# ═══════════════════════════════════════════════════════════════
# RUN A QUICK DEMO (if executed directly)
# ═══════════════════════════════════════════════════════════════
if __name__ == '__main__':
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

    from lle_engine import LLE

    lle = LLE()

    print("═" * 60)
    print("LLE — Language Layer Engine Demo")
    print("═" * 60)
    print(f"Dictionary: {lle.dict_size()}")
    print()

    # Demo text
    text = (
        "History is the study of the past. "
        "Therefore, historians examine evidence to understand what happened. "
        "Because the past is gone, they must look for clues."
    )

    print("English input:")
    print(text)
    print()

    html = lle.render_text(text)
    print("Bilingual HTML output:")
    print(html[:500] + "...")
    print()

    unknown = lle.get_unknown_words(text)
    print(f"Unknown words (not in dictionary): {unknown}")
    print()

    # Add a missing word
    lle.add_word("historians", "इतिहासकार", "हिस्टोरियन्स")
    unknown2 = lle.get_unknown_words(text)
    print(f"After adding 'historians': {unknown2}")
    print()

    print("Lookup tests:")
    for w in ["history", "because", "past", "xyz"]:
        result = lle.lookup(w)
        print(f"  {w} → {result}")
