"""Hot Potatoes-style exercises - JQuiz, JMatch, JCloze, JCross, JMix (GNU GPL)."""
from __future__ import annotations
from typing import Any
from ..base import InteractionPlugin, InteractionRequest, PluginMetadata

EXERCISE_TYPES = {
    "jquiz": "MCQ quiz",
    "jmatch": "Match the column",
    "jcloze": "Fill in the blanks",
    "jcross": "Crossword puzzle",
    "jmix": "Jumble/sentence reorder",
}


class HotPotatoesPlugin(InteractionPlugin):
    """Hot Potatoes-style exercise types for assessment variety."""

    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="hotpotatoes", version="1.0.0", license="GNU GPL",
            license_url="https://hotpot.uvic.ca/",
            subjects=["math", "science", "english", "evs", "social_studies"],
            grade_range=(1, 12),
            interaction_types=list(EXERCISE_TYPES.keys()),
            description="Hot Potatoes-style exercises - JQuiz, JMatch, JCloze, JCross, JMix for assessment variety",
            embed_size_kb=50, offline_capable=True)

    def can_handle(self, request: InteractionRequest) -> bool:
        return request.interaction_type in EXERCISE_TYPES

    def render_step(self, request: InteractionRequest) -> dict[str, Any]:
        ex_type = request.interaction_type
        return {
            "t": "hotpotatoes", "concept": request.concept, "exercise_type": ex_type,
            "instruction": EXERCISE_TYPES.get(ex_type, "Interactive exercise"),
            "exercise_config": {"type": ex_type, "data": {}},
        }

    def embed_assets(self) -> dict[str, str]:
        return {
            "hp_css": ".hp-container{width:100%;max-width:420px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px}",
            "hp_js": (
                "var renderHP=function(c,config){var el=document.getElementById(c);if(!el)return;"
                "el.innerHTML='<div class=hp-container><div style=text-align:center;font-weight:700>'+config.type.toUpperCase()+'</div></div>';}"
            ),
        }
