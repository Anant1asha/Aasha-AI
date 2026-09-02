"""Pydantic schemas for all pipeline intermediate JSONs."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


# ─── Chapter Spec Schema ────────────────────────────────────────────────

class Option(BaseModel):
    """A single quiz/VQ/solve/WE-check option."""
    t: str = Field(..., min_length=1, description="Option text")
    c: bool = Field(..., description="True if this is the correct option")
    m: str = Field("", description="Misconception explanation (empty when correct)")


class OptionSet(BaseModel):
    """A question with its options."""
    q: str = Field(..., min_length=1, description="Question text")
    visual: str | None = Field(None, description="Visual type for VQ")
    parts: int | None = None
    shaded: int | None = None
    opts: list[Option] = Field(..., min_length=3, max_length=4)


class WEStep(BaseModel):
    """A step within a worked example."""
    text: str
    c: Literal["blue", "green"]
    final: bool = False
    check: OptionSet | None = None


class WorkedExample(BaseModel):
    """A worked-example definition."""
    title: str
    question: str
    steps: list[WEStep] = Field(..., min_length=3, max_length=4)
    check: OptionSet


class SolveStep(BaseModel):
    """A step within a guided solve."""
    prompt: str
    type: Literal["mcq", "input"]
    opts: list[Option] | None = None
    answer: str | None = None
    m: str | None = None


class SolveDefinition(BaseModel):
    """A guided multi-step solve definition."""
    title: str
    question: str
    steps: list[SolveStep] = Field(..., min_length=1)


class Step(BaseModel):
    """A step in a node."""
    t: Literal[
        "intro", "text", "quiz", "vq", "worked", "solve",
        "dd_build", "dd_match",
        "ix_pizza", "ix_bar", "ix_area", "ix_slider",
        "video", "progress", "phet",
    ]
    hero: str | None = None
    title: str | None = None
    body: str | None = None
    ctx: str | None = None
    q: OptionSet | None = None
    we: str | None = Field(None, pattern=r"^WE\.")
    sl: str | None = Field(None, pattern=r"^SOLVE\.")
    instruction: str | None = None
    slices: int | None = None
    parts: int | None = None
    rows: int | None = None
    cols: int | None = None
    base_num: int | None = None
    base_den: int | None = None
    target_num: int | None = None
    target_den: int | None = None
    pairs: list[dict[str, str]] | None = None
    animation: str | None = None
    srcdoc_b64: str | None = None
    xp: int | None = None
    next: bool | None = None


class Node(BaseModel):
    """A concept node in the chapter."""
    title: str = Field(..., min_length=1)
    emoji: str | None = None
    steps: list[Step] = Field(..., min_length=1)


class ChapterMeta(BaseModel):
    """Chapter metadata."""
    title: str = Field(..., min_length=1)
    subject: Literal["math", "science", "english", "evs"]
    grade: int = Field(..., ge=3, le=8)
    storage_key: str = Field(..., pattern=r"^aasha_[a-z0-9]+_v5$")
    emoji: str | None = None
    hero_image: str | None = None


class LevelEntry(BaseModel):
    xp: int = Field(..., ge=0)
    name: str
    ic: str


class Badge(BaseModel):
    id: str
    name: str
    ic: str
    desc: str


class ChapterSpec(BaseModel):
    """The central intermediate JSON — the contract between pipeline stages
    and the HTML assembler."""
    chapter: ChapterMeta
    LEVELS: list[LevelEntry] | None = None
    BADGES: list[Badge] = Field(None, min_length=3, max_length=5)
    WE: dict[str, WorkedExample] | None = None
    SOLVE: dict[str, SolveDefinition] | None = None
    NODES: list[Node] = Field(..., min_length=3, max_length=5)


# ─── Intermediate Schemas ──────────────────────────────────────────────

class PageBlock(BaseModel):
    x0: float
    y0: float
    x1: float
    y1: float
    text: str
    type: str = "text"


class PageImage(BaseModel):
    ref: str
    width: int
    height: int
    b64: str


class Page(BaseModel):
    page_num: int
    text: str
    blocks: list[PageBlock] = Field(default_factory=list)
    images: list[PageImage] = Field(default_factory=list)


class Heading(BaseModel):
    text: str
    page: int
    level: int = 2


class Exercise(BaseModel):
    page: int
    heading: str
    questions: list[str] = Field(default_factory=list)


class Figure(BaseModel):
    page: int
    caption: str = ""
    image_ref: str = ""


class RawExtract(BaseModel):
    """Output of PDF Ingestion (Stage 1)."""
    source_file: str
    page_count: int
    pages: list[Page] = Field(default_factory=list)
    headings: list[Heading] = Field(default_factory=list)
    exercises: list[Exercise] = Field(default_factory=list)
    figures: list[Figure] = Field(default_factory=list)


class Concept(BaseModel):
    name: str
    summary: str
    key_ideas: list[str] = Field(default_factory=list)
    difficulty: str = "medium"


class WorkedExampleCandidate(BaseModel):
    problem: str
    approach: str
    concept: str = ""


class QuizOpportunity(BaseModel):
    concept: str
    context: str = ""


class VisualOpportunity(BaseModel):
    concept: str
    suggested_model: str = "bar"


class ContentMap(BaseModel):
    """Output of Content Analysis (Stage 2)."""
    chapter_title: str
    subject: str
    grade: int
    concepts: list[Concept] = Field(default_factory=list)
    worked_examples: list[WorkedExampleCandidate] = Field(default_factory=list)
    quiz_opportunities: list[QuizOpportunity] = Field(default_factory=list)
    visual_opportunities: list[VisualOpportunity] = Field(default_factory=list)
    vocabulary: list[str] = Field(default_factory=list)


class LLEFile(BaseModel):
    """Output of LLE Generation (Stage 5)."""
    CONN: dict[str, str] = Field(default_factory=dict)
    WM: dict[str, str] = Field(default_factory=dict)


class QAFailure(BaseModel):
    check: str
    reason: str


class QAReport(BaseModel):
    """Output of QA (Stage 8)."""
    passed: bool
    checks_total: int
    checks_passed: int
    failures: list[QAFailure] = Field(default_factory=list)
    categories: dict[str, dict[str, int]] = Field(default_factory=dict)


class StageResult(BaseModel):
    name: str
    status: str = "pending"
    duration_s: float = 0.0
    output: str = ""
    error: str = ""


class JobInput(BaseModel):
    source_pdf: str
    subject: str = "math"
    grade: int = 4
    provider: str = "openai"
    model: str = ""
    mode: str = "v5-engine"


class Job(BaseModel):
    """Job tracking JSON — the state of a single chapter build."""
    id: str
    status: str = "queued"
    created_at: str = ""
    updated_at: str = ""
    input: JobInput
    stages: list[StageResult] = Field(default_factory=list)
    cost_usd: float = 0.0
    costs: dict[str, float] = Field(default_factory=dict)
    qa: dict[str, Any] = Field(default_factory=dict)
    outputs: dict[str, str] = Field(default_factory=dict)
    error_stage: str = ""
    error_message: str = ""


# Stage names in order
STAGE_ORDER_V5 = [
    "ingest", "analyze", "design", "assess", "lle",
    "assemble", "qa", "output",
]

STAGE_ORDER_FS = [
    "ingest", "analyze", "design", "assess",
    "synthesize", "qa", "output",
]

# Provide a combined list for validation if needed, or default to V5
STAGE_ORDER = STAGE_ORDER_V5

# Mapping from stage name to stage index (1-indexed for display)
STAGE_NUMBERS = {name: i + 1 for i, name in enumerate(STAGE_ORDER)}


# ─── Full-Synthesis Supplementary Assessment Generator ─────────────────

# Template-based supplementary questions keyed by (subject, difficulty).
# Used in Stage 4 of the full-synthesis pipeline to fill gaps when extracted
# exercises don't cover all three gamification levels.
_SUPPLEMENTARY_TEMPLATES: dict[str, dict[str, list[dict[str, Any]]]] = {
    "math": {
        "warmup": [
            {"question": "Which number comes next in the pattern?", "opts": [
                {"t": "The next number follows the rule", "c": True, "m": ""},
                {"t": "Any random number", "c": False, "m": "Patterns follow specific rules"},
                {"t": "The previous number", "c": False, "m": "Not always"},
            ], "xp": 5},
            {"question": "What does this symbol represent?", "opts": [
                {"t": "The correct mathematical meaning", "c": True, "m": ""},
                {"t": "Something unrelated", "c": False, "m": "Check the definition"},
                {"t": "None of the above", "c": False, "m": "Review the concept"},
            ], "xp": 5},
        ],
        "deep_dive": [
            {"question": "Apply the concept to solve this real-world problem.", "opts": [
                {"t": "Use the correct method step by step", "c": True, "m": ""},
                {"t": "Guess the answer", "c": False, "m": "Always show your working"},
                {"t": "Skip the steps", "c": False, "m": "Steps help verify correctness"},
            ], "xp": 10, "hint": "Think about what the concept means in context"},
        ],
        "boss": [
            {"question": "Explain and justify your reasoning for this multi-step problem.", "opts": [
                {"t": "Provide a clear, logical explanation with evidence", "c": True, "m": ""},
                {"t": "State only the final answer", "c": False, "m": "Explanation shows understanding"},
                {"t": "Copy from a similar problem", "c": False, "m": "Original thinking is required"},
            ], "xp": 20, "hint": "Connect the concept to a broader principle"},
        ],
    },
    "science": {
        "warmup": [
            {"question": "Which of these is a property of the concept we studied?", "opts": [
                {"t": "The correct defining property", "c": True, "m": ""},
                {"t": "An unrelated property", "c": False, "m": "Review the key features"},
                {"t": "The opposite of the property", "c": False, "m": "Think carefully about definitions"},
            ], "xp": 5},
        ],
        "deep_dive": [
            {"question": "Predict what would happen if we changed a key variable.", "opts": [
                {"t": "The scientifically correct outcome", "c": True, "m": ""},
                {"t": "An impossible outcome", "c": False, "m": "Consider natural laws"},
                {"t": "Nothing would change", "c": False, "m": "Variables always have effects"},
            ], "xp": 10, "hint": "Use cause-and-effect reasoning"},
        ],
        "boss": [
            {"question": "Design an experiment to test this concept. What is the key principle?", "opts": [
                {"t": "Control variables and test the hypothesis", "c": True, "m": ""},
                {"t": "Change everything at once", "c": False, "m": "Only change one variable"},
                {"t": "Skip the hypothesis", "c": False, "m": "Hypothesis guides the experiment"},
            ], "xp": 20, "hint": "Think about fair testing"},
        ],
    },
    "english": {
        "warmup": [
            {"question": "Identify the correct usage of the concept.", "opts": [
                {"t": "The grammatically correct option", "c": True, "m": ""},
                {"t": "The common mistake", "c": False, "m": "Check the rules"},
                {"t": "An informal variant", "c": False, "m": "Standard form is preferred"},
            ], "xp": 5},
        ],
        "deep_dive": [
            {"question": "Choose the best way to express this idea in writing.", "opts": [
                {"t": "Clear and precise expression", "c": True, "m": ""},
                {"t": "Vague and ambiguous wording", "c": False, "m": "Be specific"},
                {"t": "Overly complex sentence", "c": False, "m": "Simplicity aids clarity"},
            ], "xp": 10, "hint": "Focus on clarity"},
        ],
        "boss": [
            {"question": "Analyze the author's technique and its effect on the reader.", "opts": [
                {"t": "Identify technique and explain its purpose", "c": True, "m": ""},
                {"t": "Only name the technique", "c": False, "m": "Explain the effect too"},
                {"t": "Ignore the context", "c": False, "m": "Context matters for analysis"},
            ], "xp": 20, "hint": "Connect technique to meaning"},
        ],
    },
}

# Fallback for subjects not in the map
_DEFAULT_SUPPLEMENTARY = {
    "warmup": [
        {"question": "Recall the key fact from the chapter.", "opts": [
            {"t": "The correct fact", "c": True, "m": ""},
            {"t": "A related but incorrect fact", "c": False, "m": "Check the chapter again"},
            {"t": "An unrelated fact", "c": False, "m": "Focus on the topic"},
        ], "xp": 5},
    ],
    "deep_dive": [
        {"question": "Apply what you learned to a new situation.", "opts": [
            {"t": "Correct application", "c": True, "m": ""},
            {"t": "Incorrect application", "c": False, "m": "Think about the principle"},
            {"t": "Skip the application", "c": False, "m": "Practice makes perfect"},
        ], "xp": 10, "hint": "Connect to the core concept"},
    ],
    "boss": [
        {"question": "Evaluate and justify your understanding of this topic.", "opts": [
            {"t": "Well-reasoned evaluation with evidence", "c": True, "m": ""},
            {"t": "Opinion without evidence", "c": False, "m": "Back up your claims"},
            {"t": "Copy the textbook definition", "c": False, "m": "Show original thinking"},
        ], "xp": 20, "hint": "Think critically"},
    ],
}


MIN_QUESTIONS_PER_LEVEL = 2  # Minimum exercises per gamification level

def _get_supplementary_templates(subject: str) -> dict[str, list[dict[str, Any]]]:
    """Return supplementary templates for a subject, falling back to defaults."""
    return _SUPPLEMENTARY_TEMPLATES.get(subject, _DEFAULT_SUPPLEMENTARY)


def generate_supplementary_assessments(
    assessment_suite: dict[str, list[dict[str, Any]]],
    subject: str = "math",
    concepts: list[dict[str, Any]] | None = None,
) -> dict[str, list[dict[str, Any]]]:
    """Fill gaps in the assessment suite with supplementary questions.

    Ensures each level (warmup, deep_dive, boss) has at least
    MIN_QUESTIONS_PER_LEVEL entries. If extracted exercises already
    cover a level, no supplementary questions are added.

    Args:
        assessment_suite: The current suite with 'warmup', 'deep_dive', 'boss' keys.
        subject: The chapter subject, used to select templates.
        concepts: Optional list of concept dicts for context-aware generation.

    Returns:
        Updated assessment_suite with supplementary questions added.
    """
    templates = _get_supplementary_templates(subject)
    result = dict(assessment_suite)

    for level in ("warmup", "deep_dive", "boss"):
        current_count = len(result.get(level, []))
        if current_count >= MIN_QUESTIONS_PER_LEVEL:
            continue

        # Need more questions for this level
        needed = MIN_QUESTIONS_PER_LEVEL - current_count
        pool = templates.get(level, _DEFAULT_SUPPLEMENTARY.get(level, []))

        added = 0
        for template in pool:
            if added >= needed:
                break
            # Deep-copy the template to avoid mutation
            q = dict(template)
            q_opts = [dict(o) for o in template.get("opts", [])]
            q["opts"] = q_opts
            q["supplementary"] = True  # Mark as generated, not extracted
            result.setdefault(level, []).append(q)
            added += 1

        # If pool was too small, duplicate with concept context
        if added < needed and concepts:
            for concept in concepts:
                if added >= needed:
                    break
                concept_name = concept.get("name", "this topic")
                q = {
                    "question": f"Demonstrate your understanding of {concept_name}.",
                    "opts": [
                        {"t": f"Correct understanding of {concept_name}", "c": True, "m": ""},
                        {"t": f"Common misconception about {concept_name}", "c": False, "m": "Review the concept carefully"},
                        {"t": "Unrelated answer", "c": False, "m": "Stay focused on the topic"},
                    ],
                    "xp": {"warmup": 5, "deep_dive": 10, "boss": 20}.get(level, 5),
                    "supplementary": True,
                }
                result.setdefault(level, []).append(q)
                added += 1

    return result


def enrich_content_map(
    content_map: dict[str, Any],
    exercises: list[dict[str, Any]],
) -> dict[str, Any]:
    """Merge extracted exercises into content_map to produce pedagogy_map.

    Adds exercise statistics and concept-exercise linkage for downstream
    stages (design, assess, synthesize).

    Args:
        content_map: Output from AnalysisAgent.
        exercises: List of exercise dicts from ExerciseExtractor.

    Returns:
        Enriched pedagogy_map dict.
    """
    pedagogy_map = dict(content_map)
    pedagogy_map["extracted_exercises"] = exercises

    # Compute exercise statistics
    type_counts: dict[str, int] = {}
    difficulty_counts: dict[str, int] = {}
    for ex in exercises:
        ex_type = ex.get("type", "unknown")
        diff = ex.get("difficulty", "recall")
        type_counts[ex_type] = type_counts.get(ex_type, 0) + 1
        difficulty_counts[diff] = difficulty_counts.get(diff, 0) + 1

    pedagogy_map["exercise_stats"] = {
        "total": len(exercises),
        "by_type": type_counts,
        "by_difficulty": difficulty_counts,
    }

    return pedagogy_map
