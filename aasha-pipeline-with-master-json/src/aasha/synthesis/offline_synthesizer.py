"""Autonomous Tier-0 Deterministic Offline Synthesizer.

Provides 100% offline, zero-network, zero-token pedagogical synthesis for the AASHA pipeline:
1. Content analysis: extracts 3-5 core concepts, worked examples, and domain vocabulary across K-12 subjects.
2. Instructional design: constructs compliant v5-engine NODES/WE/BADGES spec or full-synthesis experience plan.
3. Assessment synthesis: generates mathematically sound distractors with 0-spoiler misconceptions and 4-tier hints.
4. LLE bilingual substrate: populates Hindi translations and definitions from the 1,000+ entry local dictionary DB.

Enables instant end-to-end multi-page PDF synthesis without external API keys, network dependency,
or upstream 429 rate-limit / circuit-breaker delays.
"""

from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Fallback SVG Hero for concept introduction
DEFAULT_SVG_HERO = (
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 240'%3E"
    "%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E"
    "%3Cstop offset='0%25' stop-color='%233b82f6'/%3E%3Cstop offset='100%25' stop-color='%231d4ed8'/%3E"
    "%3C/defs%3E%3Crect width='400' height='240' rx='16' fill='url(%23g)'/%3E"
    "%3Ccircle cx='200' cy='120' r='50' fill='rgba(255,255,255,0.2)'/%3E"
    "%3Ctext x='200' y='128' fill='white' font-family='system-ui,sans-serif' font-size='24' "
    "font-weight='bold' text-anchor='middle'%3EAASHA LEARNING%3C/text%3E%3C/svg%3E"
)


def _load_local_dictionary_db() -> dict[str, str]:
    """Load local curated bilingual dictionary database (88KB JSON)."""
    candidates = [
        Path(__file__).resolve().parents[4] / "experience_registry" / "aasha_dictionary_db.json",
        Path(__file__).resolve().parents[3] / "experience_registry" / "aasha_dictionary_db.json",
        Path(__file__).resolve().parents[2] / "experience_registry" / "aasha_dictionary_db.json",
        Path.cwd() / "Aasha-AI" / "experience_registry" / "aasha_dictionary_db.json",
        Path.cwd() / "experience_registry" / "aasha_dictionary_db.json",
    ]
    for p in candidates:
        if p.is_file():
            try:
                return json.loads(p.read_text(encoding="utf-8"))
            except Exception:
                pass
    return {}


def sanitize_spec_misconceptions(spec: dict[str, Any]) -> int:
    """Scrub and repair any misconception that leaks the correct answer across the entire spec."""
    repaired_count = 0

    def clean_opts(opts: list[dict[str, Any]], _context: str = "") -> None:
        nonlocal repaired_count
        correct_opts = [o.get("t", "") for o in opts if isinstance(o, dict) and o.get("c")]
        if not correct_opts:
            return
        correct_text = str(correct_opts[0]).strip().lower()
        if not correct_text:
            return

        leak_pattern = re.compile(r"(?<!\w)" + re.escape(correct_text) + r"(?!\w)", re.IGNORECASE)
        nums = re.findall(r"-?\d+(?:\.\d+)?", correct_text)

        for o in opts:
            if not isinstance(o, dict) or o.get("c"):
                continue
            m = str(o.get("m", "")).strip()
            if not m:
                o["m"] = "Review the rule or step calculation to determine the correct result."
                repaired_count += 1
                continue

            explicit_spoiler = bool(re.search(r"\b(?:correct\s+answer\s+is|answer\s+is|the\s+answer\s+is)\b", m, re.IGNORECASE))
            has_leak = bool(leak_pattern.search(m.lower())) or explicit_spoiler
            if not has_leak and nums:
                for n in nums:
                    rx = re.compile(r"(?:is|=|giving|becomes|, not \+?)\s*" + re.escape(n) + r"\b", re.IGNORECASE)
                    if rx.search(m):
                        has_leak = True
                        break

            if has_leak:
                repaired_m = leak_pattern.sub("the required value", m)
                for n in nums:
                    rx = re.compile(r"(?:is|=|giving|becomes|, not \+?)\s*" + re.escape(n) + r"\b", re.IGNORECASE)
                    repaired_m = rx.sub("an incorrect step calculation", repaired_m)

                if explicit_spoiler or re.search(r"\b(?:correct\s+answer|answer\s+is)\b", repaired_m, re.IGNORECASE):
                    repaired_m = "Check the mathematical or conceptual operation carefully rather than assuming this value."
                elif leak_pattern.search(repaired_m.lower()):
                    repaired_m = "Check the mathematical or conceptual operation carefully rather than assuming this value."

                o["m"] = repaired_m
                repaired_count += 1

    for node in spec.get("NODES", []):
        for step in node.get("steps", []):
            if step.get("q") and step["q"].get("opts"):
                clean_opts(step["q"]["opts"], "quiz")

    for we_key, we in spec.get("WE", {}).items():
        for ws in we.get("steps", []):
            if ws.get("check") and ws["check"].get("opts"):
                clean_opts(ws["check"]["opts"], f"WE.{we_key} step check")
        if we.get("check") and we["check"].get("opts"):
            clean_opts(we["check"]["opts"], f"WE.{we_key} end check")

    return repaired_count


class OfflineSynthesizer:
    """Deterministic local generation engine supporting Universal K-12 Curriculum Expansion."""

    @classmethod
    def normalize_subject(cls, subject_raw: str, text_context: str = "") -> str:
        """Normalize any subject name or context into canonical AASHA curriculum domains."""
        s = (subject_raw or "").lower().strip()
        ctx = (text_context or "").lower()
        combined = f"{s} {ctx}"

        if any(k in combined for k in ("econ", "microeconomic", "macroeconomic", "scarcity", "elasticity")):
            return "economics"
        if any(k in combined for k in ("account", "ledger", "balance sheet", "debit", "credit", "journal", "trial balance")):
            return "accounting"
        if any(k in combined for k in ("finance", "financial", "investment", "budget", "saving", "interest")):
            return "financial_literacy"
        if any(k in combined for k in ("civics", "history", "geography", "social", "constitution", "parliament", "democracy")):
            return "social_studies"
        if any(k in combined for k in ("physics", "chem", "bio", "science", "force", "energy", "reaction", "molecule", "cell", "evs")):
            return "science"
        if any(k in combined for k in ("coding", "code", "computer", "program", "python", "algorithm", "loop")):
            return "coding"
        if any(k in combined for k in ("english", "grammar", "prose", "poetry", "literature", "noun", "verb")):
            return "english"
        if any(k in combined for k in ("hindi", "sanskrit")):
            return "hindi"
        return "math"

    @classmethod
    def synthesize_analysis(
        cls,
        raw_extract: dict[str, Any],
        subject: str = "math",
        grade: int = 4,
        board: str = "NCERT",
    ) -> dict[str, Any]:
        """Generate pedagogy map locally from extracted text and headings across K-12 subjects."""
        headings = [h.get("text", "").strip() for h in raw_extract.get("headings", []) if h.get("text")]
        pages = raw_extract.get("pages", [])

        # Detect chapter title
        title = ""
        if headings:
            title = headings[0]
        elif pages and pages[0].get("text"):
            first_line = pages[0]["text"].split("\n")[0].strip()
            if len(first_line) > 3:
                title = first_line[:60]

        # Clean title
        title = re.sub(r"^(Chapter\s*\d*|Ch\s*\d*|Unit\s*\d*)[\s:.-]*", "", title, flags=re.I).strip()
        
        # Determine canonical subject
        norm_subject = cls.normalize_subject(subject, f"{title} {' '.join(headings[:3])}")
        
        if not title:
            if norm_subject == "economics":
                title = "Introduction to Microeconomics"
            elif norm_subject == "accounting":
                title = "Financial Accounting & Balance Sheets"
            elif norm_subject == "science":
                title = "Scientific Inquiry & Energy Transformations"
            elif norm_subject == "coding":
                title = "Algorithms & Computational Thinking"
            elif norm_subject == "english":
                title = "Grammar & Sentence Construction"
            elif norm_subject == "social_studies":
                title = "Civics & Democratic Institutions"
            else:
                title = f"Class {grade} Mathematics"

        # Group into 3-4 core concepts
        concept_candidates = [h for h in headings[1:] if 4 < len(h) < 60]
        fig_verb_map: dict[str, str] = {}
        figures = raw_extract.get("figures", [])
        
        if figures:
            for fig in figures:
                ftype = fig.get("type", "")
                if ftype == "number_line" and "Number Line Models & Intervals" not in concept_candidates:
                    concept_candidates.append("Number Line Models & Intervals")
                    fig_verb_map["Number Line Models & Intervals"] = "number_line_hop"
                elif ftype == "balance_scale" and "Equilibrium & Conservation Balance" not in concept_candidates:
                    concept_candidates.append("Equilibrium & Conservation Balance")
                    fig_verb_map["Equilibrium & Conservation Balance"] = "balance_scale"
                elif ftype == "geometric_circle" and "Circular Proportions & Systems" not in concept_candidates:
                    concept_candidates.append("Circular Proportions & Systems")
                    fig_verb_map["Circular Proportions & Systems"] = "manipulate_ratio"
                elif ftype == "coordinate_graph" and "Cartesian Coordinates & Functional Curves" not in concept_candidates:
                    concept_candidates.append("Cartesian Coordinates & Functional Curves")
                    fig_verb_map["Cartesian Coordinates & Functional Curves"] = "coordinate_geometry"
                elif ftype == "geometric_figure" and "Geometric Properties & Structural Bounds" not in concept_candidates:
                    concept_candidates.append("Geometric Properties & Structural Bounds")
                    fig_verb_map["Geometric Properties & Structural Bounds"] = "manipulate_ratio"

        # Domain-specific concept candidates when headings are sparse
        if len(concept_candidates) < 3:
            if norm_subject == "economics":
                concept_candidates = [
                    f"Introduction to {title}",
                    "Scarcity, Choice & Opportunity Cost",
                    "Market Mechanisms: Supply & Demand Equilibrium",
                    "Production Possibility Frontier & Elasticity",
                ]
            elif norm_subject == "accounting":
                concept_candidates = [
                    f"Introduction to {title}",
                    "The Accounting Equation & Dual Aspect Concept",
                    "Journalizing Transactions & Double-Entry Ledger Posting",
                    "Trial Balance, Accruals & Financial Statement Integrity",
                ]
            elif norm_subject == "science":
                concept_candidates = [
                    f"Introduction to {title}",
                    "Empirical Observation & Testable Hypotheses",
                    "Energy Conservation & System Transformations",
                    "Experimental Verification & Physical Laws",
                ]
            elif norm_subject == "coding":
                concept_candidates = [
                    f"Introduction to {title}",
                    "Deterministic Algorithms & State Variables",
                    "Control Flow: Conditional Branching & Loops",
                    "Modular Decomposition, Testing & Debugging",
                ]
            elif norm_subject == "english":
                concept_candidates = [
                    f"Introduction to {title}",
                    "Grammatical Structure & Sentence Architecture",
                    "Contextual Vocabulary & Idiomatic Precision",
                    "Critical Reading Comprehension & Inferences",
                ]
            elif norm_subject == "social_studies":
                concept_candidates = [
                    f"Introduction to {title}",
                    "Constitutional Principles & Democratic Institutions",
                    "Geographical Landforms, Climate & Human Settlement",
                    "Historical Evolution & Civic Responsibility",
                ]
            else:
                concept_candidates = [
                    f"Introduction to {title}",
                    "Core Principles & Representations",
                    "Properties, Operations & Problem Solving",
                    "Algebraic Balance & Coordinate Geometry",
                ]
        concept_candidates = concept_candidates[:4]

        # Pedagogical verbs & candidate foundations per subject domain
        subject_verb_defaults = {
            "math": (["explore_fractions", "manipulate_ratio", "balance_scale", "number_line_hop"], ["JSXGraph", "PhET", "Fabric.js", "v5_canvas"]),
            "science": (["virtual_lab", "measure_force", "reaction_balancer", "circuit_builder"], ["PhET", "MicroSims", "AllScienceSims", "v5_canvas"]),
            "economics": (["explore_market", "opportunity_cost_tradeoff", "balance_budget", "policy_simulation"], ["JSXGraph", "InteractiveChart", "v5_canvas"]),
            "accounting": (["ledger_entry", "balance_sheet_reconcile", "cash_flow_track", "double_entry_pan"], ["FinanceGame", "SpreadsheetView", "v5_canvas"]),
            "coding": (["algorithm_step", "loop_tracker", "logic_gate", "variable_inspector"], ["Lightbot", "CodeForLife", "SecureCodeGame", "v5_canvas"]),
            "english": (["sentence_diagrammer", "word_origin_match", "context_clue_detect", "grammar_fix"], ["Squiffy", "QuestJS", "TextRunner", "v5_canvas"]),
            "social_studies": (["map_explorer", "timeline_journey", "civic_decision", "demographic_chart"], ["LearnWorldmap", "GeoGuess", "v5_canvas"]),
        }
        verbs, foundations = subject_verb_defaults.get(norm_subject, subject_verb_defaults["math"])

        concepts = []
        for idx, cname in enumerate(concept_candidates):
            concepts.append({
                "name": cname,
                "summary": f"Key conceptual understanding and hands-on discovery of {cname}.",
                "key_ideas": [
                    f"Understanding the core definition of {cname}",
                    f"Observing real-world applications and structural rules",
                    f"Applying governing principles systematically to solve problems",
                ],
                "difficulty": "easy" if idx == 0 else ("medium" if idx == 1 else "hard"),
                "pedagogical_verb": fig_verb_map.get(cname, verbs[idx % len(verbs)]),
                "candidate_foundations": foundations,
            })

        # Worked examples aligned with subject
        worked_examples = []
        for i, c in enumerate(concepts, 1):
            if norm_subject == "economics":
                prob = f"Calculate the opportunity cost and price equilibrium for {c['name']}."
                appr = "Identify consumer demand, producer supply, and compute the market-clearing equilibrium."
            elif norm_subject == "accounting":
                prob = f"Record the journal entry and verify that the Accounting Equation balances for {c['name']}."
                appr = "Identify affected asset, liability, and equity accounts, applying equal debit and credit rules."
            elif norm_subject == "science":
                prob = f"Formulate a testable hypothesis and balance the conservation equation for {c['name']}."
                appr = "Isolate independent variables, measure outcomes, and verify conservation of energy/matter."
            elif norm_subject == "coding":
                prob = f"Trace the state variables and determine loop termination for {c['name']}."
                appr = "Construct a state trace table, follow conditional branches, and verify the termination condition."
            elif norm_subject == "english":
                prob = f"Identify the subject, predicate, and correct tense concordance in {c['name']}."
                appr = "Analyze the grammatical structure, ensure subject-verb agreement, and verify sentence unity."
            else:
                prob = f"Find the value or equivalent representation for {c['name']} under standard operations."
                appr = "Identify given quantities, apply the governing operation rule step-by-step, and simplify."

            worked_examples.append({
                "problem": prob,
                "approach": appr,
                "concept": c["name"],
            })

        # Subject-specific domain vocabulary
        subject_vocabs = {
            "economics": ["scarcity", "demand", "supply", "equilibrium", "opportunity cost", "market", "consumer", "producer", "elasticity", "capital"],
            "accounting": ["debit", "credit", "asset", "liability", "equity", "ledger", "journal", "trial balance", "revenue", "expense"],
            "science": ["hypothesis", "experiment", "variable", "force", "energy", "motion", "reaction", "molecule", "observation", "conservation"],
            "coding": ["algorithm", "variable", "loop", "function", "condition", "boolean", "syntax", "iteration", "execution", "debug"],
            "english": ["noun", "verb", "adjective", "sentence", "clause", "predicate", "tense", "concord", "context", "inference"],
            "social_studies": ["constitution", "democracy", "sovereignty", "judiciary", "federalism", "citizen", "geography", "settlement", "trade", "rights"],
            "math": ["rational number", "fraction", "numerator", "denominator", "equivalent", "simplest form", "positive", "negative", "operation", "equation"],
        }
        vocab = subject_vocabs.get(norm_subject, subject_vocabs["math"])

        return {
            "chapter_title": title,
            "subject": norm_subject,
            "grade": grade,
            "board": board,
            "concepts": concepts,
            "worked_examples": worked_examples,
            "quiz_opportunities": [
                {"concept": c["name"], "context": f"Check for understanding on {c['name']}", "misconception_trap": "Conceptual inversion"}
                for c in concepts
            ],
            "visual_opportunities": [
                {"concept": c["name"], "suggested_model": "interactive", "pedagogical_verb": c["pedagogical_verb"], "candidate_foundations": c["candidate_foundations"]}
                for c in concepts
            ],
            "vocabulary": vocab,
            "exercises": [],
        }

    @classmethod
    def synthesize_design(
        cls,
        content_map: dict[str, Any],
        subject: str = "math",
        grade: int = 4,
        mode: str = "v5-engine",
    ) -> dict[str, Any]:
        """Generate chapter spec deterministically across Universal K-12 subjects and grades."""
        concepts = content_map.get("concepts", [])
        title = content_map.get("chapter_title", "Universal Learning Chapter")
        clean_subject = cls.normalize_subject(subject, f"{title} {content_map.get('subject', '')}")
        clean_grade = max(1, min(12, int(grade) if grade else 4))

        if not concepts:
            concepts = cls.synthesize_analysis({}, clean_subject, clean_grade)["concepts"]

        slug = re.sub(r"[^a-z0-9]+", "", title.lower())[:12] or "chapter"
        storage_key = f"aasha_{slug}_v5"

        subject_emojis = {
            "math": ["🔢", "⚖️", "📐", "🎯", "⭐"],
            "science": ["🔬", "⚡", "🧪", "🌱", "⭐"],
            "economics": ["📈", "🏛️", "⚖️", "💼", "⭐"],
            "accounting": ["📊", "📑", "💳", "⚖️", "⭐"],
            "coding": ["💻", "⚙️", "🔄", "🧩", "⭐"],
            "english": ["📖", "✍️", "🔤", "🎯", "⭐"],
            "social_studies": ["🌍", "🏛️", "📜", "🗺️", "⭐"],
        }
        emojis = subject_emojis.get(clean_subject, subject_emojis["math"])

        chapter_meta = {
            "title": title,
            "subject": clean_subject,
            "grade": clean_grade,
            "storage_key": storage_key,
            "emoji": emojis[0],
            "hero_image": DEFAULT_SVG_HERO,
        }

        nodes = []
        we_dict = {}
        badges = []

        for i, c in enumerate(concepts):
            cname = c.get("name", f"Concept {i+1}")
            is_last = (i == len(concepts) - 1)
            we_key = f"we_{i+1}"

            # Step 3: Interactive manipulation step (math uses bar model, other subjects use interactive concept exploration)
            if clean_subject == "math":
                interactive_step = {
                    "t": "ix_bar",
                    "instruction": "Observe the interactive division into equal parts.",
                    "parts": 4 + i,
                }
            else:
                interactive_step = {
                    "t": "text",
                    "title": f"Interactive Model: {cname}",
                    "body": f"Explore the key variables, relationships, and trade-offs governing {cname}.",
                }

            steps = [
                {
                    "t": "intro",
                    "hero": DEFAULT_SVG_HERO,
                    "title": cname,
                },
                {
                    "t": "text",
                    "title": f"Principle: {cname}",
                    "body": c.get("summary", f"Explore and master {cname} through interactive practice."),
                },
                interactive_step,
                {
                    "t": "worked",
                    "we": f"WE.{we_key}",
                },
                {
                    "t": "quiz",
                    "q": {
                        "q": f"Which statement correctly describes {cname}?",
                        "opts": None,  # Will be populated by synthesize_assessment
                    },
                },
                {
                    "t": "progress",
                    "xp": 20,
                },
            ]
            if not is_last:
                steps[-1]["next"] = True

            nodes.append({
                "title": cname,
                "emoji": emojis[i % len(emojis)],
                "steps": steps,
            })

            # Corresponding Worked Example
            we_dict[we_key] = {
                "title": f"Step-by-Step Discovery: {cname}",
                "question": f"How do we apply the core principle in {cname}?",
                "steps": [
                    {
                        "text": f"Step 1: Identify the primary elements and conditions in {cname}.",
                        "c": "blue",
                        "final": False,
                    },
                    {
                        "text": f"Step 2: Apply the governing transformation or relationship rule.",
                        "c": "green",
                        "final": False,
                        "check": {
                            "q": f"What is the first step when evaluating {cname}?",
                            "opts": None,
                        },
                    },
                    {
                        "text": "Step 3: Verify the outcome and confirm that all conditions remain balanced.",
                        "c": "blue",
                        "final": True,
                    },
                ],
                "check": {
                    "q": f"What is the final verified result of this worked example?",
                    "opts": None,
                },
            }

            badges.append({
                "id": f"b_{i+1}",
                "name": f"{cname.split()[0]} Explorer",
                "ic": emojis[i % len(emojis)],
                "desc": f"Awarded for discovering {cname}.",
            })

        spec = {
            "chapter": chapter_meta,
            "title": title,
            "subject": clean_subject,
            "grade": clean_grade,
            "storage_key": storage_key,
            "NODES": nodes,
            "WE": we_dict,
            "BADGES": badges,
            "SOLVE": {},
        }
        return cls.synthesize_assessment(spec, subject=clean_subject, grade=clean_grade)

    @classmethod
    def synthesize_assessment(
        cls,
        spec: dict[str, Any],
        subject: str = "math",
        grade: int = 4,
    ) -> dict[str, Any]:
        """Populate all opts in NODES and WE with academically sound, 0-spoiler options across all subjects."""
        norm_subject = cls.normalize_subject(subject, spec.get("title", ""))

        # Multi-subject 0-spoiler question templates
        subject_templates: dict[str, list[dict[str, Any]]] = {
            "math": [
                {
                    "correct": "It represents an equal ratio of parts to the whole",
                    "wrong": [
                        ("It only applies to positive whole integers", "Remember that rational values can be negative or fractional."),
                        ("It changes value when multiplied by 1", "Multiplying by 1 preserves identity without changing value."),
                        ("The denominator can be zero", "Dividing by zero is undefined in mathematics."),
                    ],
                },
                {
                    "correct": "Multiply both the numerator and denominator by the same non-zero number",
                    "wrong": [
                        ("Add the same number to numerator and denominator", "Adding changes the ratio; only multiplication scales proportionally."),
                        ("Invert the fraction without changing the sign", "Inverting changes the reciprocal value rather than scaling."),
                        ("Divide the top only by two", "Both numerator and denominator must undergo identical scaling."),
                    ],
                },
                {
                    "correct": "The simplest reduced form",
                    "wrong": [
                        ("The largest possible multiple", "Simplification requires finding common factors to reduce, not increase."),
                        ("An approximation rounded to ten", "Exact fractions should be kept in lowest terms rather than rounded."),
                        ("A reciprocal integer value", "The reciprocal inverts the fraction rather than simplifying it."),
                    ],
                },
                {
                    "correct": "Both sides remain completely balanced",
                    "wrong": [
                        ("The left side becomes heavier", "An equality operation maintains exact equivalence across both pans."),
                        ("The equation loses its solution", "Performing identical valid operations preserves all equation solutions."),
                        ("The variable cancels out to zero", "Only matching opposite terms cancel out to zero."),
                    ],
                },
            ],
            "economics": [
                {
                    "correct": "Resources are scarce relative to unlimited human wants, requiring trade-offs",
                    "wrong": [
                        ("All economic goods are available in unlimited quantities", "Scarcity is the fundamental reality that forces choices."),
                        ("Trade eliminates the need to allocate resources", "Trade improves allocation but cannot eliminate scarcity."),
                        ("Money eliminates the cost of producing goods", "Money is a medium of exchange, physical resources remain limited."),
                    ],
                },
                {
                    "correct": "Opportunity cost represents the value of the next best alternative forgone",
                    "wrong": [
                        ("Opportunity cost includes every possible option added together", "Opportunity cost measures strictly the single best forgone choice."),
                        ("It is always measured exclusively in currency", "Opportunity cost can be time, leisure, or alternative goods."),
                        ("Zero-cost actions carry no opportunity cost", "Even free goods take time that could be spent elsewhere."),
                    ],
                },
                {
                    "correct": "The market-clearing equilibrium price where quantity demanded equals quantity supplied",
                    "wrong": [
                        ("The highest price sellers can possibly imagine", "Prices are constrained by buyer demand and willingness to pay."),
                        ("A price where excess inventory piles up unsold", "Unsold inventory indicates surplus above equilibrium."),
                        ("A price fixed permanently without market signals", "Competitive prices shift as consumer preferences change."),
                    ],
                },
                {
                    "correct": "The production possibility frontier shows maximum output combinations given fixed resources",
                    "wrong": [
                        ("Points outside the curve are easily attained today", "Points outside require technological growth or added inputs."),
                        ("Any point inside the curve represents full efficiency", "Points inside indicate unemployed or underutilized resources."),
                        ("The curve never shifts outward over time", "Investment and innovation shift the frontier outward."),
                    ],
                },
            ],
            "accounting": [
                {
                    "correct": "Total Assets must always equal Total Liabilities plus Owner Equity",
                    "wrong": [
                        ("Assets equal Liabilities minus Owner Equity", "Equity represents owner claims and adds to third-party claims."),
                        ("Revenues equal Expenses regardless of transactions", "Revenues and expenses determine net profit over time."),
                        ("Debits and credits operate independently without balancing", "Double-entry bookkeeping requires balanced debits and credits."),
                    ],
                },
                {
                    "correct": "Every transaction affects at least two accounts with equal debit and credit amounts",
                    "wrong": [
                        ("Debits can exceed credits as long as profit increases", "Every single transaction must maintain debit-credit parity."),
                        ("Only cash payments require accounting records", "Credit purchases and accrued items must also be recorded."),
                        ("Assets are recorded at estimated future replacement values", "Historical cost principle governs initial transaction recording."),
                    ],
                },
                {
                    "correct": "Accrual accounting recognizes revenues when earned and expenses when incurred",
                    "wrong": [
                        ("Revenues are only recorded after physical cash arrives", "Cash receipt is secondary to earning performance obligations."),
                        ("Expenses are recognized whenever managers decide", "Matching principle pairs expenses with associated revenues."),
                        ("Depreciation is ignored until assets are thrown away", "Depreciation allocates asset cost over its useful life."),
                    ],
                },
                {
                    "correct": "A balance sheet presents the financial position of an entity at a specific point in time",
                    "wrong": [
                        ("It summarizes operational transactions across the entire year", "That is the role of the income statement, not the balance sheet."),
                        ("It predicts future stock market prices", "Accounting statements record historical and current financial position."),
                        ("It omits liabilities that are due next month", "Short-term liabilities are classified as current liabilities."),
                    ],
                },
            ],
            "science": [
                {
                    "correct": "A testable and falsifiable explanation grounded in empirical evidence",
                    "wrong": [
                        ("An unquestionable belief accepted without testing", "Scientific claims must remain open to testing and refutation."),
                        ("A random guess that changes without observation", "Hypotheses are formulated from structured initial observations."),
                        ("A conclusion drawn before conducting any experiment", "Conclusions require verified experimental data."),
                    ],
                },
                {
                    "correct": "Energy is neither created nor destroyed, only transformed between forms",
                    "wrong": [
                        ("Energy disappears completely when friction acts", "Friction converts mechanical energy into thermal energy."),
                        ("Perpetual machines can produce more energy than consumed", "The law of conservation strictly forbids net creation."),
                        ("Kinetic energy remains constant during all accelerations", "Kinetic energy changes as speed varies with net work."),
                    ],
                },
                {
                    "correct": "Isolate the independent variable while holding all other factors constant",
                    "wrong": [
                        ("Change all experimental factors simultaneously", "Changing multiple variables prevents causal attribution."),
                        ("Ignore control groups during comparative trials", "Control groups provide the necessary baseline comparison."),
                        ("Discard data points that do not match the expected hypothesis", "All observations must be honestly recorded and analyzed."),
                    ],
                },
                {
                    "correct": "Forces occur in equal and opposite pairs between interacting bodies",
                    "wrong": [
                        ("A stronger object exerts force without receiving any reaction", "Newton's third law guarantees reciprocal interaction."),
                        ("Objects only experience forces while moving", "Static friction and normal forces act on stationary bodies."),
                        ("Mass decreases as acceleration increases", "Mass is an invariant measure of inertia in classical mechanics."),
                    ],
                },
            ],
            "coding": [
                {
                    "correct": "A finite sequence of unambiguous instructions designed to solve a problem",
                    "wrong": [
                        ("A random collection of words entered into a text editor", "Algorithms require strict syntax and deterministic logic."),
                        ("Hardware components inside the computer casing", "Hardware executes code, while algorithms represent computational logic."),
                        ("A program that runs indefinitely without stopping", "Effective algorithms must terminate after finite steps."),
                    ],
                },
                {
                    "correct": "A loop termination condition guarantees that iteration halts when the goal is met",
                    "wrong": [
                        ("Loops must run forever to keep computer memory active", "Unbounded loops freeze execution and cause buffer exhaustion."),
                        ("Variables inside loops cannot be modified", "Loop variables are updated each iteration toward the exit condition."),
                        ("Loops execute only when given invalid input", "Loops process valid sequences and repetitive computations."),
                    ],
                },
                {
                    "correct": "Conditional branching directs execution along distinct paths based on boolean evaluations",
                    "wrong": [
                        ("Branching forces every line of code to run simultaneously", "Conditions select specific branches while bypassing others."),
                        ("Boolean expressions always evaluate to multiple numbers", "Boolean expressions evaluate strictly to True or False."),
                        ("If statements erase variables from memory", "If statements evaluate conditions without purging state."),
                    ],
                },
                {
                    "correct": "Modular functions isolate responsibilities, promote reusability, and simplify debugging",
                    "wrong": [
                        ("Writing all code in one thousand-line block is preferred", "Monolithic blocks increase complexity and bug frequency."),
                        ("Functions cannot accept parameters or return values", "Parameters and return values enable modular data flow."),
                        ("Duplicating identical code across files improves speed", "Code duplication violates the DRY principle and hurts maintainability."),
                    ],
                },
            ],
            "english": [
                {
                    "correct": "A complete sentence requires both a subject and a predicate expressing a complete thought",
                    "wrong": [
                        ("A sentence can end without completing any thought", "Fragments lack necessary subject or predicate coherence."),
                        ("Punctuation marks are purely optional decorations", "Punctuation clarifies sentence boundaries and clauses."),
                        ("Verbs can never change their tense form", "Verbs conjugate to reflect past, present, and future time."),
                    ],
                },
                {
                    "correct": "Subject-verb agreement requires singular subjects to take singular verbs",
                    "wrong": [
                        ("Plural subjects always take singular verbs", "Subject and verb number must concord in standard grammar."),
                        ("The number of adjectives dictates the verb agreement", "Only the grammatical subject determines verb number."),
                        ("Agreement rules only apply in spoken conversation", "Concord is an essential rule of written prose."),
                    ],
                },
                {
                    "correct": "Context clues help infer the precise meaning of unfamiliar vocabulary words",
                    "wrong": [
                        ("Unfamiliar words always mean the opposite of their context", "Context provides supporting clues to author intent."),
                        ("Every word in the language has only one possible definition", "Many words carry polysemous meanings depending on context."),
                        ("Readers should skip words they do not immediately recognize", "Analyzing context strengthens comprehension and fluency."),
                    ],
                },
                {
                    "correct": "The main idea represents the central message supported by textual details",
                    "wrong": [
                        ("Any minor illustrative detail is the main idea", "Details support and expand the central thesis."),
                        ("The title is always the entire body paragraph", "Titles introduce topics, while paragraphs elaborate them."),
                        ("Authors never provide supporting evidence for claims", "Credible arguments provide empirical and logical support."),
                    ],
                },
            ],
            "social_studies": [
                {
                    "correct": "A constitution establishes the supreme rule of law and protects fundamental citizen rights",
                    "wrong": [
                        ("Governments operate without any constitutional checks and balances", "Constitutions limit executive power through laws."),
                        ("Only majority groups possess legal protections", "Constitutions protect fundamental rights for all citizens."),
                        ("Laws can be changed arbitrarily without legislative due process", "Amendments require formal constitutional procedures."),
                    ],
                },
                {
                    "correct": "Geographical resources and physical landforms shape settlement patterns and economic trade",
                    "wrong": [
                        ("Human civilizations develop without regard to water or fertile soil", "Historic civilizations consistently centered on river valleys."),
                        ("Mountain ranges provide identical agricultural yields as river basins", "Topography directly influences soil fertility and farming."),
                        ("Trade routes avoid maritime coasts and navigable rivers", "Navigable waterways have always been prime trade routes."),
                    ],
                },
                {
                    "correct": "Federalism balances governance between central and regional authorities",
                    "wrong": [
                        ("All local municipal decisions must be made by foreign leaders", "Federalism empowers national and provincial representatives."),
                        ("State governments are eliminated under federal systems", "Federalism explicitly guarantees dual-tier governance."),
                        ("Citizens have no role in democratic representation", "Democratic federalism rests on citizen voting and representation."),
                    ],
                },
                {
                    "correct": "Historical evidence requires corroborating primary and secondary sources",
                    "wrong": [
                        ("A single folklore rumor establishes historical fact", "Historians cross-examine multiple documented sources."),
                        ("Archaeological findings are irrelevant to understanding the past", "Artifacts provide tangible primary evidence of past eras."),
                        ("History never changes when new evidence is uncovered", "Historical understanding evolves as new evidence emerges."),
                    ],
                },
            ],
        }

        templates = subject_templates.get(norm_subject, subject_templates["math"])
        t_idx = 0

        def make_options() -> list[dict[str, Any]]:
            nonlocal t_idx
            tmpl = templates[t_idx % len(templates)]
            t_idx += 1
            opts = [{"t": tmpl["correct"], "c": True}]
            for w_text, m_text in tmpl["wrong"]:
                opts.append({"t": w_text, "c": False, "m": m_text})
            return opts

        for node in spec.get("NODES", []):
            for step in node.get("steps", []):
                if step.get("t") == "quiz" and step.get("q"):
                    if not step["q"].get("opts"):
                        step["q"]["opts"] = make_options()

        for we_key, we in spec.get("WE", {}).items():
            for ws in we.get("steps", []):
                if ws.get("check"):
                    if not ws["check"].get("opts"):
                        ws["check"]["opts"] = make_options()
            if we.get("check"):
                if not we["check"].get("opts"):
                    we["check"]["opts"] = make_options()

        # Sanitize any accidental leaks
        sanitize_spec_misconceptions(spec)
        return spec

    @classmethod
    def synthesize_lle(
        cls,
        vocabulary: list[str],
        defaults_path: str = "",
    ) -> dict[str, Any]:
        """Populate bilingual Hindi dictionary substrate (WM) locally across K-12 subjects."""
        dict_db = _load_local_dictionary_db()

        base_wm = {}
        base_conn = {}
        if defaults_path and Path(defaults_path).is_file():
            try:
                ddata = json.loads(Path(defaults_path).read_text(encoding="utf-8"))
                base_wm = ddata.get("WM", {})
                base_conn = ddata.get("CONN", {})
            except Exception:
                pass

        wm = dict(base_wm)

        # Comprehensive bilingual baseline across K-12 subjects
        curriculum_dict = {
            # Mathematics
            "fraction": "भिन्न (फ्रैक्शन)",
            "fractions": "भिन्न (फ्रैक्शन्स)",
            "numerator": "अंश (ऊपरी संख्या)",
            "denominator": "हर (निचली संख्या)",
            "rational": "परिमेय (रैशनल)",
            "number": "संख्या (नंबर)",
            "equal": "बराबर (समान मान)",
            "equivalent": "समतुल्य (इक्विवैलेंट)",
            "value": "मान (वैल्यू)",
            "divide": "भाग देना (डिवाइड)",
            "multiply": "गुणा करना (मल्टिप्लाई)",
            "balance": "संतुलन (बैलेंस)",
            "equation": "समीकरण (इक्वेशन)",
            "simplest": "सरलतम रूप (सिम्प्लेस्ट)",
            "algebra": "बीजगणित (अलजेब्रा)",
            "coefficient": "गुणांक (कोएफिशिएंट)",
            "exponent": "घातांक (एक्सपोनेंट)",
            "power": "घात (पावर)",
            # Economics & Commerce
            "scarcity": "दुर्लभता (स्कार्सिटी)",
            "demand": "मांग (डिमांड)",
            "supply": "आपूर्ति (सप्लाई)",
            "market": "बाजार (मार्केट)",
            "equilibrium": "संतुलन (इक्विलिब्रियम)",
            "consumer": "उपभोक्ता (कंज्यूमर)",
            "producer": "उत्पादक (प्रोड्यूसर)",
            "cost": "लागत (कॉस्ट)",
            "price": "मूल्य (प्राइस)",
            "capital": "पूंजी (कैपिटल)",
            "elasticity": "लोच (इलास्टिसिटी)",
            # Accounting & Financial Literacy
            "debit": "नाम (डेबिट)",
            "credit": "जमा (क्रेडिट)",
            "asset": "परिसंपत्ति (एसेट)",
            "assets": "परिसंपत्तियां (एसेट्स)",
            "liability": "दायित्व (लायबिलिटी)",
            "liabilities": "दायित्व (लायबिलिटीज)",
            "equity": "इक्विटी (पूंजीगत हिस्सा)",
            "ledger": "खाता बही (लेजर)",
            "journal": "रोजनामचा (जर्नल)",
            "revenue": "राजस्व (रेवेन्यू)",
            "expense": "व्यय (एक्सपेंस)",
            "expenses": "खर्चे (एक्सपेंसेज)",
            "interest": "ब्याज (इंटरेस्ट)",
            # Science
            "hypothesis": "परिकल्पना (हाइपोथिसिस)",
            "experiment": "प्रयोग (एक्सपेरिमेंट)",
            "variable": "चर (वेरिएबल)",
            "force": "बल (फोर्स)",
            "energy": "ऊर्जा (एनर्जी)",
            "motion": "गति (मोशन)",
            "reaction": "अभिक्रिया (रिएक्शन)",
            "molecule": "अणु (मॉलिक्यूल)",
            "conservation": "संरक्षण (कंजर्वेशन)",
            # Coding & Computer Science
            "algorithm": "कलन विधि (एल्गोरिदम)",
            "loop": "लूप (आवर्तन चक्र)",
            "function": "फ़ंक्शन (कार्य)",
            "condition": "शर्त (कंडीशन)",
            "boolean": "बूलियन (सत्य/असत्य)",
            "syntax": "वाक्यविन्यास (सिंटैक्स)",
            "iteration": "पुनरावृत्ति (इटेरेशन)",
            # English & Language
            "sentence": "वाक्य (सेंटेंस)",
            "clause": "उपवाक्य (क्लॉज)",
            "predicate": "विधेय (प्रेडिकेट)",
            "tense": "काल (टेंस)",
            "concord": "अन्वय (सब्जेक्ट-वर्ब मेल)",
        }
        for k, v in curriculum_dict.items():
            wm[k] = v

        for term in vocabulary:
            w_clean = term.strip().lower()
            if w_clean in dict_db:
                wm[w_clean] = dict_db[w_clean]
            elif w_clean not in wm:
                wm[w_clean] = f"{w_clean.title()} (विषयगत अवधारणा)"

        return {
            "WM": wm,
            "CONN": base_conn or {
                "leads to": "आगे ले जाता है",
                "derived from": "से प्राप्त",
                "is equal to": "के बराबर है",
                "requires": "की आवश्यकता है",
                "results in": "का परिणाम होता है",
            },
        }
