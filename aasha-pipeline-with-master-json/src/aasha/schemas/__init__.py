"""Pydantic schemas for all pipeline intermediate JSONs."""

from __future__ import annotations

from typing import Any, Literal

import pydantic
if not hasattr(pydantic, "field_validator"):
    def _field_validator(*fields, **kwargs):
        kwargs.pop("mode", None)
        return pydantic.validator(*fields, allow_reuse=True, **kwargs)
    pydantic.field_validator = _field_validator
    _orig_field = pydantic.Field
    def _v1_compat_field(*args, **kwargs):
        kwargs.pop("min_length", None)
        kwargs.pop("max_length", None)
        return _orig_field(*args, **kwargs)
    pydantic.Field = _v1_compat_field
    pydantic.BaseModel.model_dump = lambda self, **kw: self.dict(**kw)
    pydantic.BaseModel.model_validate = classmethod(lambda cls, obj: cls.parse_obj(obj))
    pydantic.BaseModel.model_validate_json = classmethod(lambda cls, s: cls.parse_raw(s))
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
    qa: dict[str, Any] = Field(default_factory=dict)
    outputs: dict[str, str] = Field(default_factory=dict)
    error_stage: str = ""
    error_message: str = ""


# Stage names in order
STAGE_ORDER = [
    "ingest", "analyze", "design", "assess", "lle",
    "assemble", "qa", "output",
]

FULL_SYNTHESIS_STAGE_ORDER = [
    "ingest", "analyze", "design", "assess",
    "synthesize", "qa", "output",
]

LEARN_ARENA_STAGE_ORDER = [
    "ingest", "analyze", "design", "assess", "lle",
    "learn_arena", "qa", "output",
]

# Mapping from stage name to stage index (1-indexed for display)
STAGE_NUMBERS = {name: i + 1 for i, name in enumerate(STAGE_ORDER)}
