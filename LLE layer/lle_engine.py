"""
LLE — Language Layer Engine (Python backend)
=============================================
A portable bilingual rendering layer for Indic scripts.
Designed to integrate with any Python agent framework (LangChain, LlamaIndex, custom).

What it does:
  1. Maintains a Word Map (WM) and Connectives (CONN) dictionary
     mapping English words → "हिन्दी_अर्थ (romanized_pronunciation)"
  2. Renders English text into HTML spans with word-level Hindi translations
  3. Exports dictionaries as JSON for the JS frontend (lle.js)
  4. Can enrich its dictionary from open-source Hindi NLP tools

Usage in a Python agent:
  from lle_engine import LLE
  lle = LLE()
  html = lle.render_text("History is the study of the past.")
  # → '<div class="lle-text"><span class="word" data-w="history" data-h="इतिहास (हिस्ट्री)">History</span> ...'

  # Export dict for JS frontend
  lle.export_json("lle_dict.json")

  # Load domain-specific words
  lle.load_words({"photosynthesis": "प्रकाश संश्लेषण (फोटोसिंथेसिस)"})

License: MIT
"""

import json
import re
from typing import Dict, Optional


class LLE:
    """
    Language Layer Engine — bilingual English↔Hindi text renderer.

    Mirrors the JavaScript rt() function: walks English text word-by-word,
    wraps each word in a <span> carrying its Hindi translation as data attributes.
    """

    # ─── Connectives (logical connectors, shown inline) ───────────────
    CONN: Dict[str, str] = {
        "if": "यदि (इफ)",
        "because": "क्योंकि (बिकॉज़)",
        "therefore": "इसलिए (देयरफोर)",
        "however": "हालांकि (हाउएवर)",
        "so that": "ताकि (सो दैट)",
        "in order to": "के लिए (इन ऑर्डर टू)",
        "which means": "जिसका अर्थ है (विच मीन्स)",
        "although": "यद्यपि (ऑलदो)",
        "unless": "जब तक (अनलेस)",
        "due to": "के कारण (ड्यू टू)",
        "for example": "उदाहरण के लिए (फॉर एग्ज़ैम्पल)",
        "such that": "जैसे कि (सच दैट)",
        "since": "चूंकि (सिंस)",
        "then": "तब (देन)",
        "when": "जब (वेन)",
        "while": "जबकि (व्हाइल)",
        "even though": "भले ही (ईवन दो)",
        "instead of": "के बजाय (इनस्टेड ऑफ)",
        "that is why": "इसीलिए (दैट इज़ वाय)",
        "in other words": "दूसरे शब्दों में (इन अदर वर्ड्स)",
        "whereas": "जबकि (वेयरैज़)",
        "furthermore": "इसके अलावा (फर्दरमोर)",
        "in contrast": "इसके विपरीत (इन कॉन्ट्रास्ट)",
        "so": "इसलिए (सो)",
        "because of": "के कारण (बिकॉज़ ऑफ)",
        "as a result": "परिणामस्वरूप (ऐज़ अ रिज़ल्ट)",
        "consequently": "परिणामस्वरूप (कॉन्सीक्वेंटली)",
        "otherwise": "अन्यथा (अदरवाइज़)",
        "similarly": "इसी तरह (सिमिलर्ली)",
        "on the other hand": "दूसरी ओर (ऑन द अदर हैंड)",
        "that is": "अर्थात (दैट इज़)",
        "namely": "यथा (नेम्ली)",
        "thus": "इस प्रकार (दस)",
        "hence": "अतः (हेंस)",
        "yet": "फिर भी (येट)",
        "still": "फिर भी (स्टिल)",
        "afterwards": "बाद में (आफ्टरवर्ड्स)",
        "finally": "अंत में (फाइनली)",
        "firstly": "पहले (फर्स्टली)",
        "secondly": "दूसरा (सेकंडली)",
        "next": "अगला (नेक्स्ट)",
        "also": "भी (ऑल्सो)",
        "but": "परंतु (बट)",
        "or": "या (ऑर)",
        "nor": "न ही (नॉर)",
        "whether": "क्या (वदर)",
    }

    # ─── Word Map (common English words → Hindi + romanized) ──────────
    WM: Dict[str, str] = {
        # Articles & pronouns
        "a": "एक (ए)", "an": "एक (ऐन)", "the": "यह/वह (द)",
        "is": "है (इज़)", "are": "हैं (आर)", "was": "था (वाज़)", "were": "थे (वर)",
        "am": "हूँ (ऐम)", "be": "होना (बी)", "been": "हुआ (बीन)", "being": "होते (बीइंग)",
        "have": "है (हैव)", "has": "है (हैज़)", "had": "था (हैड)",
        "do": "करना (डू)", "does": "करता (डज़)", "did": "किया (डिड)",
        "will": "will (विल)", "would": "would (वुड)", "shall": "shall (शैल)", "should": "should (शुड)",
        "can": "सकता (कैन)", "could": "सकता था (कुड)", "may": "may (मे)", "might": "might (माइट)",
        "must": "must (मस्ट)",
        "i": "मैं (आई)", "we": "हम (वी)", "you": "तुम (यू)", "he": "वह (ही)", "she": "वह (शी)",
        "it": "यह (इट)", "they": "वे (दे)", "this": "यह (दिस)", "that": "वह (दैट)",
        "these": "ये (दीज़)", "those": "वे (दोज़)",
        "my": "मेरा (माय)", "our": "हमारा (आवर)", "your": "तुम्हारा (योर)",
        "his": "उसका (हिज़)", "her": "उसका (हर)", "their": "उनका (देयर)",
        "what": "क्या (वॉट)", "where": "कहाँ (वेयर)", "why": "क्यों (वाय)",
        "how": "कैसे (हाउ)", "who": "कौन (हू)", "which": "कौन सा (विच)",
        # Common verbs
        "go": "जाना (गो)", "goes": "जाता (गोज़)", "went": "गया (वेंट)", "gone": "गया (गॉन)",
        "come": "आना (कम)", "comes": "आता (कम्स)", "came": "आया (केम)",
        "see": "देखना (सी)", "sees": "देखता (सीज़)", "saw": "देखा (सॉ)", "seen": "देखा (सीन)",
        "look": "देखना (लुक)", "find": "खोजना (फाइंड)", "found": "पाया (फाउंड)",
        "take": "लेना (टेक)", "takes": "लेता (टेक्स)", "took": "लिया (टुक)", "taken": "लिया (टेकन)",
        "give": "देना (गिव)", "gives": "देता (गिव्स)", "gave": "दिया (गेव)", "given": "दिया (गिवन)",
        "make": "बनाना (मेक)", "makes": "बनाता (मेक्स)", "made": "बनाया (मेड)",
        "show": "दिखाना (शो)", "shows": "दिखाता (शोज़)", "showed": "दिखाया (शोड)",
        "tell": "बताना (टेल)", "tells": "बताता (टेल्स)", "told": "बताया (टोल्ड)",
        "ask": "पूछना (आस्क)", "asks": "पूछता (आस्क्स)", "asked": "पूछा (आस्क्ड)",
        "call": "बुलाना (कॉल)", "called": "कहलाता (कॉल्ड)", "calls": "बुलाता (कॉल्ज़)",
        "use": "उपयोग (यूज़)", "uses": "उपयोग (यूज़ेज़)", "used": "उपयोग किया (यूज़्ड)",
        "know": "जानना (नो)", "knows": "जानता (नोज़)", "knew": "जानता था (न्यू)", "known": "ज्ञात (नोन)",
        "think": "सोचना (थिंक)", "study": "अध्ययन (स्टडी)", "studies": "अध्ययन (स्टडीज़)",
        "learn": "सीखना (लर्न)", "teach": "पढ़ाना (टीच)", "understand": "समझना (अंडरस्टैंड)",
        "live": "रहना (लिव)", "lived": "रहते (लिव्ड)", "change": "बदलना (चेंज)", "changed": "बदला (चेंज्ड)",
        "help": "मदद (हेल्प)", "helps": "मदद (हेल्प्स)", "helped": "मदद की (हेल्प्ट)",
        "examine": "जांचना (इग्ज़ैमिन)", "write": "लिखना (राइट)", "written": "लिखित (रिटन)",
        "read": "पढ़ना (रीड)", "divide": "विभाजित (डिवाइड)", "divided": "बाँटा (डिवाइडेड)",
        "multiply": "गुणा करना (मल्टिप्लाई)", "add": "जोड़ना (ऐड)", "subtract": "घटाना (सबट्रैक्ट)",
        # Common nouns
        "time": "समय (टाइम)", "people": "लोग (पीपल)", "world": "दुनिया (वर्ल्ड)",
        "place": "जगह (प्लेस)", "thing": "चीज़ (थिंग)", "things": "चीज़ें (थिंग्ज़)",
        "way": "रास्ता (वे)", "ways": "तरीके (वेज़)", "day": "दिन (डे)", "days": "दिन (डेज़)",
        "year": "साल (यियर)", "years": "साल (यियर्स)", "man": "आदमी (मैन)", "men": "आदमी (मेन)",
        "woman": "महिला (वुमन)", "women": "महिलाएँ (विमेन)", "child": "बच्चा (चाइल्ड)",
        "children": "बच्चे (चिल्ड्रन)", "hand": "हाथ (हैंड)", "hands": "हाथ (हैंड्स)",
        "part": "भाग (पार्ट)", "parts": "भागों (पार्ट्स)", "whole": "पूर्ण (होल)",
        "number": "संख्या (नंबर)", "word": "शब्द (वर्ड)", "words": "शब्द (वर्ड्स)",
        "name": "नाम (नेम)", "names": "नाम (नेम्स)", "letter": "पत्र (लेटर)",
        "book": "किताब (बुक)", "books": "किताबें (बुक्स)", "story": "कहानी (स्टोरी)",
        "question": "प्रश्न (क्वेस्चन)", "answer": "उत्तर (आंसर)",
        "water": "पानी (वॉटर)", "food": "भोजन (फूड)", "fire": "आग (फायर)",
        "stone": "पत्थर (स्टोन)", "metal": "धातु (मेटल)", "wood": "लकड़ी (वुड)",
        "tree": "पेड़ (ट्री)", "trees": "पेड़ (ट्रीज़)", "river": "नदी (रिवर)", "rivers": "नदियाँ (रिवर्स)",
        "land": "भूमि (लैंड)", "mountain": "पहाड़ (माउंटेन)", "sun": "सूरज (सन)", "moon": "चंद्रमा (मून)",
        "stars": "तारे (स्टार्स)", "sky": "आकाश (स्काई)", "earth": "पृथ्वी (अर्थ)",
        # Adjectives
        "good": "अच्छा (गुड)", "bad": "बुरा (बैड)", "big": "बड़ा (बिग)", "small": "छोटा (स्मॉल)",
        "old": "पुराना (ओल्ड)", "new": "नया (न्यू)", "young": "जवान (यंग)",
        "first": "पहला (फर्स्ट)", "last": "अंतिम (लास्ट)", "next": "अगला (नेक्स्ट)",
        "same": "समान (सेम)", "different": "अलग (डिफरेंट)", "equal": "बराबर (इक्वल)",
        "important": "महत्वपूर्ण (इम्पोर्टेंट)", "main": "मुख्य (मेन)",
        "total": "कुल (टोटल)", "true": "सच (ट्रू)", "false": "गलत (फॉल्स)",
        "correct": "सही (करेक्ट)", "wrong": "गलत (रॉंग)",
        "easy": "आसान (ईज़ी)", "difficult": "कठिन (डिफिकल्ट)",
        "rich": "अमीर (रिच)", "poor": "गरीब (पूअर)",
        "long": "लंबा (लॉन्ग)", "short": "छोटा (शॉर्ट)", "high": "ऊँचा (हाय)", "low": "नीचा (लो)",
        "full": "पूरा (फुल)", "empty": "खाली (एम्टी)",
        "strong": "मज़बूत (स्ट्रॉन्ग)", "weak": "कमज़ोर (वीक)",
        "beautiful": "सुंदर (ब्यूटिफुल)", "ancient": "प्राचीन (एइंशेंट)", "modern": "आधुनिक (मॉडर्न)",
        # Academic / study words
        "history": "इतिहास (हिस्ट्री)", "science": "विज्ञान (साइंस)",
        "math": "गणित (मैथ)", "mathematics": "गणित (मैथमैटिक्स)",
        "art": "कला (आर्ट)", "music": "संगीत (म्यूज़िक)", "language": "भाषा (लैंग्विज)",
        "knowledge": "ज्ञान (नॉलिज)", "education": "शिक्षा (एजुकेशन)", "school": "विद्यालय (स्कूल)",
        "teacher": "शिक्षक (टीचर)", "student": "छात्र (स्टूडेंट)",
        "past": "अतीत (पास्ट)", "present": "वर्तमान (प्रेज़ेंट)", "future": "भविष्य (फ्यूचर)",
        "event": "घटना (इवेंट)", "events": "घटनाएँ (इवेंट्स)",
        "evidence": "साक्ष्य (एविडेंस)", "source": "स्रोत (सोर्स)", "sources": "स्रोत (सोर्सेज़)",
        "information": "जानकारी (इन्फर्मेशन)", "record": "रिकॉर्ड (रिकॉर्ड)", "records": "रिकॉर्ड (रिकॉर्ड्स)",
        "document": "दस्तावेज़ (डॉक्यूमेंट)", "documents": "दस्तावेज़ (डॉक्यूमेंट्स)",
        "coin": "सिक्का (कॉइन)", "coins": "सिक्के (कॉइन्स)",
        "inscription": "अभिलेख (इन्स्क्रिप्शन)", "manuscript": "पांडुलिपि (मैन्युस्क्रिप्ट)",
        "monument": "स्मारक (मॉन्यूमेंट)", "temples": "मंदिर (टेम्पल्स)",
        "archaeological": "पुरातत्वीय (आर्किऑलॉजिकल)", "literary": "साहित्यिक (लिटरेरी)",
        "artifact": "कलाकृति (आर्टिफैक्ट)", "remains": "अवशेष (रिमेन्स)",
        # Prepositions & conjunctions
        "in": "में (इन)", "on": "पर (ऑन)", "at": "पर (ऐट)", "of": "का (ऑव)",
        "to": "को (टू)", "from": "से (फ्रॉम)", "with": "के साथ (विथ)",
        "by": "द्वारा (बाय)", "for": "के लिए (फॉर)", "about": "के बारे में (अबाउट)",
        "into": "में (इनटू)", "onto": "पर (ऑनटू)", "upon": "पर (अपॉन)",
        "over": "ऊपर (ओवर)", "under": "नीचे (अंडर)", "above": "ऊपर (अबाउ)", "below": "नीचे (बिलो)",
        "before": "पहले (बिफोर)", "after": "बाद में (आफ्टर)",
        "between": "के बीच (बिटवीन)", "among": "में (अमंग)",
        "through": "से होकर (थ्रू)", "during": "के दौरान (ड्यूरिंग)",
        "without": "बिना (विदाउट)", "within": "भीतर (विदिन)",
        # Quantity
        "all": "सभी (ऑल)", "some": "कुछ (सम)", "many": "कई (मेनी)", "few": "थोड़े (फ्यू)",
        "more": "अधिक (मोर)", "most": "अधिकांश (मोस्ट)", "less": "कम (लेस)", "least": "कम से कम (लीस्ट)",
        "much": "बहुत (मच)", "very": "बहुत (वेरी)", "enough": "पर्याप्त (इनफ)",
        "each": "प्रत्येक (ईच)", "every": "हर (एवरी)", "both": "दोनों (बोथ)",
        "any": "कोई भी (एनी)", "several": "कई (सेवरल)",
        "one": "एक (वन)", "two": "दो (टू)", "three": "तीन (थ्री)", "four": "चार (फोर)",
        "five": "पाँच (फाइव)", "six": "छह (सिक्स)", "seven": "सात (सेवन)", "eight": "आठ (एट)",
        "nine": "नौ (नाइन)", "ten": "दस (टेन)",
        "hundred": "सौ (हंड्रेड)", "thousand": "हज़ार (थाउज़ंड)",
        # Science & nature
        "living": "जीवित (लिविंग)", "non-living": "निर्जीव (नॉन-लिविंग)",
        "plant": "पौधा (प्लांट)", "plants": "पौधे (प्लांट्स)", "animal": "जानवर (ऐनिमल)",
        "animals": "जानवर (ऐनिमल्स)", "body": "शरीर (बॉडी)", "bodies": "शरीर (बॉडीज़)",
        "growth": "वृद्धि (ग्रोथ)", "energy": "ऊर्जा (एनर्जी)",
        "light": "प्रकाश (लाइट)", "heat": "गर्मी (हीट)",
        "sound": "ध्वनि (साउंड)", "force": "बल (फोर्स)", "motion": "गति (मोशन)",
        "matter": "पदार्थ (मैटर)", "solid": "ठोस (सॉलिड)", "liquid": "द्रव (लिक्विड)", "gas": "गैस (गैस)",
        "element": "तत्व (एलिमेंट)", "elements": "तत्व (एलिमेंट्स)",
        "atom": "परमाणु (ऐटम)", "molecule": "अणु (मॉलिक्यूल)",
        # Social studies
        "society": "समाज (सोसाइटी)", "culture": "संस्कृति (कल्चर)",
        "government": "सरकार (गवर्नमेंट)", "country": "देश (कंट्री)", "countries": "देश (कंट्रीज़)",
        "city": "शहर (सिटी)", "village": "गाँव (विलेज)", "state": "राज्य (स्टेट)",
        "nation": "राष्ट्र (नेशन)", "king": "राजा (किंग)", "queen": "रानी (क्वीन)",
        "war": "युद्ध (वॉर)", "peace": "शांति (पीस)", "law": "कानून (लॉ)",
        "right": "अधिकार (राइट)", "duty": "कर्तव्य (ड्यूटी)",
        "trade": "व्यापार (ट्रेड)", "farmer": "किसान (फार्मर)", "market": "बाज़ार (मार्केट)",
        # Misc high-frequency
        "like": "जैसे (लाइक)", "than": "से (दैन)", "as": "जैसे (ऐज़)",
        "not": "नहीं (नॉट)", "no": "नहीं (नो)", "yes": "हाँ (येस)",
        "now": "अब (नाउ)", "here": "यहाँ (हियर)", "there": "वहाँ (देयर)",
        "today": "आज (टुडे)", "yesterday": "कल (बुकलगय)", "tomorrow": "कल (टुमॉरो)",
        "always": "हमेशा (ऑलवेज़)", "never": "कभी नहीं (नेवर)", "sometimes": "कभी-कभी (समटाइम्स)",
        "often": "अक्सर (ऑफ़न)", "usually": "आमतौर पर (यूज़ुअली)",
        "again": "फिर (अगेन)", "once": "एक बार (वंस)", "twice": "दो बार (ट्वाइस)",
        "already": "पहले से (ऑलरेडी)", "perhaps": "शायद (पर्हैप्स)", "maybe": "शायद (मेबी)",
        "become": "बनना (बिकम)", "becomes": "बनता (बिकम्स)", "became": "बना (बिकेम)",
        "happen": "होना (हैपन)", "happens": "होता (हैपन्स)", "happened": "हुआ (हैपंड)",
        "produce": "उत्पादन (प्रोड्यूस)", "product": "उत्पाद (प्रॉडक्ट)",
        "create": "बनाना (क्रिएट)", "created": "बनाया (क्रिएटिड)",
        "cause": "कारण (कॉज़)", "caused": "कारण बना (कॉज़्ड)",
        "mean": "अर्थ (मीन)", "means": "मतलब (मीन्स)", "meant": "मतलब था (मेंट)",
        "example": "उदाहरण (इग्ज़ैम्पल)", "examples": "उदाहरण (इग्ज़ैम्पल्स)",
        "kind": "प्रकार (काइंड)", "kinds": "प्रकार (काइंड्स)",
        "type": "प्रकार (टाइप)", "types": "प्रकार (टाइप्स)",
        "form": "रूप (फॉर्म)", "forms": "रूप (फॉर्म्स)",
        "able": "सक्षम (एबल)", "unable": "असमर्थ (अनेबल)",
        "possible": "संभव (पॉसिबल)", "impossible": "असंभव (इम्पॉसिबल)",
        "together": "साथ (टुगेदर)", "alone": "अकेला (अलोन)",
        "available": "उपलब्ध (अवेलेबल)", "useful": "उपयोगी (यूज़फुल)",
        "writing": "लेखन (राइटिंग)", "script": "लिपि (स्क्रिप्ट)", "scripts": "लिपि (स्क्रिप्ट्स)",
        "vedas": "वेद (वेदास)", "vindhya": "विंध्य (विंध्य)",
        "travelers": "यात्री (ट्रैवलर्स)", "surfaces": "सतहें (सर्फेसेज़)",
        "steel": "इस्पात (स्टील)", "tool": "उपकरण (टूल)",
        "ad": "एडी (एडी)", "bc": "ईसा पूर्व (बीसी)",
        "value": "मान (वैल्यू)", "amount": "मात्रा (अमाउंट)",
        "piece": "टुकड़ा (पीस)", "pieces": "टुकड़े (पीसेज़)",
        "top": "ऊपरी (टॉप)", "bottom": "निचली (बॉटम)",
        "proper": "उचित (प्रॉपर)", "improper": "अनुचित (इम्प्रॉपर)",
        "mixed": "मिश्रित (मिक्स्ड)", "equivalent": "तुल्य (इक्विवलेंट)",
        "fraction": "भिन्न (फ्रैक्शन)", "fractions": "भिन्न (फ्रैक्शन्स)",
        "numerator": "अंश (न्यूमरेटर)", "denominator": "हर (डिनॉमिनेटर)",
        "left": "बायाँ (लेफ्ट)", "side": "तरफ (साइड)", "sides": "तरफ (साइड्स)",
        "line": "रेखा (लाइट)", "lines": "रेखाएँ (लाइन्स)",
        "point": "बिंदु (पॉइंट)", "circle": "वृत्त (सर्कल)",
        "angle": "कोण (एंगल)", "triangle": "त्रिभुज (ट्राइएंगल)",
        "square": "वर्ग (स्क्वेयर)", "shape": "आकार (शेप)",
        "size": "आकार (साइज़)", "color": "रंग (कलर)", "colors": "रंग (कलर्स)",
        "measure": "मापना (मेज़र)", "length": "लंबाई (लेंथ)",
        "weight": "वज़न (वेट)", "height": "ऊँचाई (हाइट)",
        "area": "क्षेत्रफल (एरिया)", "volume": "आयतन (वॉल्यूम)",
        "speed": "गति (स्पीड)", "distance": "दूरी (डिस्टेंस)",
        "direction": "दिशा (डायरेक्शन)", "position": "स्थिति (पोज़िशन)",
    }

    def __init__(self, max_connectives: int = 2):
        self.max_connectives = max_connectives
        # Sorted connective keys, longest first (for greedy matching)
        self._conn_keys = sorted(self.CONN.keys(), key=len, reverse=True)
        self._word_pattern = re.compile(r'[a-zA-Z]+')

    def _esc(self, s: str) -> str:
        """Escape HTML entities in a string."""
        return (s.replace('&', '&')
                 .replace('"', '"')
                 .replace('<', '<')
                 .replace('>', '>'))

    def render_text(self, text: str, small: bool = False) -> str:
        """
        Render English text into bilingual HTML.

        Each word is wrapped in <span class="word" data-w="..." data-h="...">
        Connectives (first N per sentence) get inline Hindi shown.
        All words carry data-h for click/tap lookup.

        Args:
            text: English text to render
            small: If True, use smaller text class (lle-text-sm)

        Returns:
            HTML string with word-level Hindi annotations
        """
        if not text:
            return ''

        cls = 'lle-text-sm' if small else 'lle-text'
        html = text
        result = []
        conn_count = 0
        i = 0

        while i < len(html):
            ch = html[i]

            # Sentence boundary → reset connective counter
            if ch in '.!?':
                conn_count = 0
                result.append(ch)
                i += 1
                continue

            # Skip HTML tags
            if ch == '<':
                ci = html.find('>', i)
                if ci >= 0:
                    result.append(html[i:ci + 1])
                    i = ci + 1
                    continue

            matched = False

            # Try connective match (only at word boundaries)
            if i == 0 or not html[i - 1].isalpha():
                for c in self._conn_keys:
                    sub = html[i:i + len(c)]
                    if sub.lower() == c.lower():
                        ai = i + len(c)
                        if ai < len(html) and html[ai].isalpha():
                            continue
                        hi = self.CONN[c]
                        conn_count += 1
                        if conn_count <= self.max_connectives:
                            result.append(
                                f'<span class="connective" data-w="{self._esc(sub)}" '
                                f'data-h="{self._esc(hi)}">{sub} '
                                f'<span class="connective-hi">({hi})</span></span>'
                            )
                        else:
                            result.append(
                                f'<span class="word" data-w="{self._esc(sub.lower())}" '
                                f'data-h="{self._esc(hi)}">{sub}</span>'
                            )
                        i += len(c)
                        matched = True
                        break

            if matched:
                continue

            # Regular word
            if ch.isalpha():
                m = self._word_pattern.match(html, i)
                if m:
                    word = m.group()
                    cw = word.lower()
                    hi = self.WM.get(cw, '')
                    result.append(
                        f'<span class="word" data-w="{self._esc(cw)}" '
                        f'data-h="{self._esc(hi)}">{word}</span>'
                    )
                    i = m.end()
                else:
                    result.append(ch)
                    i += 1
            else:
                result.append(ch)
                i += 1

        return f'<div class="{cls}">{"".join(result)}</div>'

    def load_words(self, words: Dict[str, str]) -> None:
        """Merge custom word entries into the Word Map."""
        for k, v in words.items():
            self.WM[k.lower()] = v

    def load_connectives(self, conns: Dict[str, str]) -> None:
        """Merge custom connective entries."""
        for k, v in conns.items():
            self.CONN[k.lower()] = v
        self._conn_keys = sorted(self.CONN.keys(), key=len, reverse=True)

    def lookup(self, word: str) -> Optional[str]:
        """Look up a single word's Hindi translation."""
        return self.WM.get(word.lower())

    def dict_size(self) -> dict:
        """Return dictionary statistics."""
        return {
            'words': len(self.WM),
            'connectives': len(self.CONN),
        }

    def export_json(self, path: str) -> None:
        """Export WM and CONN dictionaries as JSON for the JS frontend."""
        data = {'WM': self.WM, 'CONN': self.CONN}
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def export_js(self, path: str) -> None:
        """Export dictionaries as a JS snippet that updates LLE.WM and LLE.CONN."""
        wm_json = json.dumps(self.WM, ensure_ascii=False)
        conn_json = json.dumps(self.CONN, ensure_ascii=False)
        js = f"""// Auto-generated by LLE Python engine
if (typeof LLE !== 'undefined') {{
  LLE.loadDictionary({wm_json});
  LLE.loadConnectives({conn_json});
}}
"""
        with open(path, 'w', encoding='utf-8') as f:
            f.write(js)

    def get_unknown_words(self, text: str) -> list:
        """
        Scan text and return words NOT in the dictionary.
        Useful for finding vocabulary gaps to fill.
        """
        words = set(re.findall(r'[a-zA-Z]+', text.lower()))
        return sorted(w for w in words if w not in self.WM and w not in self.CONN)

    def add_word(self, english: str, hindi: str, romanized: str = '') -> None:
        """
        Add a single word to the dictionary.
        hindi: Hindi meaning in Devanagari
        romanized: pronunciation in roman script (optional)
        """
        entry = f"{hindi}"
        if romanized:
            entry = f"{hindi} ({romanized})"
        self.WM[english.lower()] = entry
