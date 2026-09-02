"""Subject profiles — declare interaction types and grade-appropriate tools per subject domain.

Based on the paste-1.md spec:
  - STEM (math, science): JSXGraph, PhET, Canvas, Fabric.js, Scilab, Mafs, GeoGebra
  - Humanities (social studies, history): timelines, maps, branching
  - Languages (English, Hindi K-3): phonics cards, word builders, picture matching
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any


@dataclass
class SubjectProfile:
    """Declares what interaction types a subject supports."""
    subject: str
    domain: str  # STEM, Humanities, Languages, Social Sciences
    grade_range: tuple[int, int] = (1, 12)
    interaction_types: list[str] = field(default_factory=list)
    preferred_plugins: list[str] = field(default_factory=list)
    assessment_types: list[str] = field(default_factory=lambda: ["mcq", "numerical", "short_answer"])
    description: str = ""


# ─── Subject domain classification ──────────────────────────────────────

DOMAIN_MAP = {
    # STEM
    "math": "STEM",
    "mathematics": "STEM",
    "science": "STEM",
    "physics": "STEM",
    "chemistry": "STEM",
    "biology": "STEM",
    "computer_science": "STEM",
    # Humanities
    "social_studies": "Humanities",
    "history": "Humanities",
    "geography": "Humanities",
    "civics": "Humanities",
    "economics": "Humanities",
    "political_science": "Humanities",
    # Languages
    "english": "Languages",
    "hindi": "Languages",
    "sanskrit": "Languages",
    "tamil": "Languages",
    "bengali": "Languages",
    # Social Sciences (applied)
    "evs": "Social Sciences",
    "environmental_science": "Social Sciences",
}


# ─── Subject profiles ───────────────────────────────────────────────────

PROFILES: dict[str, SubjectProfile] = {
    "math": SubjectProfile(
        subject="math", domain="STEM", grade_range=(1, 12),
        interaction_types=["geometry", "graphing", "interactive_visual", "exploration",
                           "numerical_computation", "simulation"],
        preferred_plugins=["jsxgraph", "mafs", "geogebra", "scilab", "phet", "hotpotatoes"],
        assessment_types=["mcq", "numerical", "interactive_solver", "short_answer", "drag_drop"],
        description="Mathematics — geometry, algebra, calculus, statistics, numerical computation",
    ),
    "science": SubjectProfile(
        subject="science", domain="STEM", grade_range=(1, 12),
        interaction_types=["simulation", "lab", "experiment", "anatomy", "labeling",
                           "image_hotspot", "exploration"],
        preferred_plugins=["phet", "vlab", "fabric", "mermaid", "hotpotatoes", "h5p"],
        assessment_types=["mcq", "match_column", "image_hotspot", "short_answer", "numerical"],
        description="Science — physics, chemistry, biology experiments and simulations",
    ),
    "english": SubjectProfile(
        subject="english", domain="Languages", grade_range=(1, 12),
        interaction_types=["phonics_card", "word_builder", "picture_match", "letter_tracing",
                           "diagram", "timeline"],
        preferred_plugins=["phonics", "hotpotatoes", "h5p", "mermaid", "timeline"],
        assessment_types=["jcloze", "jmix", "jcross", "mcq", "short_answer"],
        description="English — phonics, reading, grammar, vocabulary, comprehension",
    ),
    "social_studies": SubjectProfile(
        subject="social_studies", domain="Humanities", grade_range=(3, 12),
        interaction_types=["timeline", "branching", "cause_effect", "map_exploration",
                           "diagram", "flowchart"],
        preferred_plugins=["timeline", "mermaid", "h5p", "hotpotatoes"],
        assessment_types=["mcq", "match_column", "short_answer", "jcross", "branching"],
        description="Social Studies — history, geography, civics, economics",
    ),
    "evs": SubjectProfile(
        subject="evs", domain="Social Sciences", grade_range=(1, 5),
        interaction_types=["image_hotspot", "labeling", "exploration", "diagram"],
        preferred_plugins=["fabric", "mermaid", "hotpotatoes", "h5p"],
        assessment_types=["mcq", "match_column", "image_hotspot", "jcloze"],
        description="Environmental Studies — nature, community, sustainability",
    ),
}


def get_profile(subject: str) -> SubjectProfile:
    """Get the subject profile for a given subject."""
    key = subject.lower().strip()
    if key in PROFILES:
        return PROFILES[key]
    # Try domain-based fallback
    domain = DOMAIN_MAP.get(key, "STEM")
    if domain == "Languages":
        return PROFILES["english"]
    elif domain == "Humanities":
        return PROFILES["social_studies"]
    elif domain == "Social Sciences":
        return PROFILES["evs"]
    else:
        return PROFILES["math"]


def classify_domain(subject: str) -> str:
    """Classify a subject into its domain (STEM, Humanities, Languages, Social Sciences)."""
    return DOMAIN_MAP.get(subject.lower().strip(), "STEM")
