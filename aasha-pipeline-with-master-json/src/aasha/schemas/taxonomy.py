"""Universal Curricular Taxonomy Schema for AASHA AIOS.

Covers:
- Education Boards: NCERT, CBSE, ICSE, State Boards (Maharashtra, Karnataka, UP, etc.)
- Grade Bands: Primary (1-5), Middle (6-8), Secondary (9-10), Senior Secondary (11-12)
- Subject Domains: STEM, Humanities, Languages, Social Sciences, Commerce, Vocational
- Cognitive Depth: Bloom's Taxonomy (Remember, Understand, Apply, Analyze, Evaluate, Create)
"""

from __future__ import annotations

from enum import Enum


class EducationBoard(str, Enum):
    """Standardized Education Boards across Indian K-12."""
    NCERT = "NCERT"
    CBSE = "CBSE"
    ICSE = "ICSE"
    MAHARASHTRA_SSC = "MAHARASHTRA_SSC"
    KARNATAKA_KSEEB = "KARNATAKA_KSEEB"
    UP_BOARD = "UP_BOARD"
    TAMIL_NADU_STATE = "TAMIL_NADU_STATE"
    ANDHRA_PRADESH_STATE = "ANDHRA_PRADESH_STATE"
    GENERIC_STATE = "GENERIC_STATE"
    INTERNATIONAL = "INTERNATIONAL"


class GradeBand(str, Enum):
    """Pedagogical Grade Bands determining UX complexity and cognitive scaffolding."""
    PRIMARY = "primary"            # Classes 1-5 (Playful, big touch targets >=56px, audio chimes)
    MIDDLE = "middle"              # Classes 6-8 (Adventure, XP streaks, badges)
    SECONDARY = "secondary"        # Classes 9-10 (Structured, HUD, timed mastery)
    SENIOR_SECONDARY = "senior"    # Classes 11-12 (Rigorous, analytical, formula labs)


class SubjectDomain(str, Enum):
    """Broad disciplinary categories for interaction and plugin routing."""
    STEM = "STEM"
    HUMANITIES = "Humanities"
    LANGUAGES = "Languages"
    SOCIAL_SCIENCES = "Social Sciences"
    COMMERCE = "Commerce"
    VOCATIONAL = "Vocational"


class CognitiveLevel(str, Enum):
    """Bloom's Revised Taxonomy levels for learning and assessment."""
    REMEMBER = "remember"
    UNDERSTAND = "understand"
    APPLY = "apply"
    ANALYZE = "analyze"
    EVALUATE = "evaluate"
    CREATE = "create"


def get_grade_band(grade: int) -> GradeBand:
    """Map class integer (1-12) to pedagogical GradeBand."""
    if grade <= 5:
        return GradeBand.PRIMARY
    elif grade <= 8:
        return GradeBand.MIDDLE
    elif grade <= 10:
        return GradeBand.SECONDARY
    else:
        return GradeBand.SENIOR_SECONDARY


def normalize_board(board: str | None) -> EducationBoard:
    """Normalize user or PDF metadata board string to EducationBoard enum."""
    if not board:
        return EducationBoard.NCERT
    b = board.upper().strip().replace(" ", "_").replace("-", "_")
    mapping: dict[str, EducationBoard] = {
        "NCERT": EducationBoard.NCERT,
        "CBSE": EducationBoard.CBSE,
        "ICSE": EducationBoard.ICSE,
        "CISCE": EducationBoard.ICSE,
        "MAHARASHTRA": EducationBoard.MAHARASHTRA_SSC,
        "MAHARASHTRA_SSC": EducationBoard.MAHARASHTRA_SSC,
        "KARNATAKA": EducationBoard.KARNATAKA_KSEEB,
        "KSEEB": EducationBoard.KARNATAKA_KSEEB,
        "UP": EducationBoard.UP_BOARD,
        "UP_BOARD": EducationBoard.UP_BOARD,
        "UPMSP": EducationBoard.UP_BOARD,
        "TN": EducationBoard.TAMIL_NADU_STATE,
        "TAMIL_NADU": EducationBoard.TAMIL_NADU_STATE,
        "AP": EducationBoard.ANDHRA_PRADESH_STATE,
        "ANDHRA_PRADESH": EducationBoard.ANDHRA_PRADESH_STATE,
        "STATE": EducationBoard.GENERIC_STATE,
        "IB": EducationBoard.INTERNATIONAL,
        "CAMBRIDGE": EducationBoard.INTERNATIONAL,
    }
    return mapping.get(b, EducationBoard.NCERT)


def get_subject_domain(subject: str) -> SubjectDomain:
    """Map subject identifier to canonical SubjectDomain."""
    s = subject.lower().strip()
    if s in {"math", "mathematics", "science", "physics", "chemistry", "biology", "computer_science", "coding"}:
        return SubjectDomain.STEM
    elif s in {"english", "hindi", "sanskrit", "tamil", "bengali", "telugu", "marathi", "gujarati"}:
        return SubjectDomain.LANGUAGES
    elif s in {"social_studies", "history", "geography", "civics", "political_science"}:
        return SubjectDomain.HUMANITIES
    elif s in {"evs", "environmental_science"}:
        return SubjectDomain.SOCIAL_SCIENCES
    elif s in {"economics", "accounting", "financial_literacy", "business_studies"}:
        return SubjectDomain.COMMERCE
    else:
        return SubjectDomain.STEM
