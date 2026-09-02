"""Phonics and word builder - for early primary (K-3) language learning."""
from __future__ import annotations
from typing import Any
from ..base import InteractionPlugin, InteractionRequest, PluginMetadata

PHONICS_CONCEPTS = {"phonics", "letters", "sight words", "rhyming", "syllables", "alphabet"}


class PhonicsPlugin(InteractionPlugin):
    """Phonics cards, word builders, picture matching for K-3."""

    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="phonics", version="1.0.0", license="MIT",
            subjects=["english"], grade_range=(1, 3),
            interaction_types=["phonics_card", "word_builder", "picture_match", "letter_tracing"],
            description="Phonics cards, word builders, picture matching for early primary language learning",
            embed_size_kb=30, offline_capable=True)

    def can_handle(self, request: InteractionRequest) -> bool:
        if request.subject != "english" or request.grade > 3:
            return False
        return (request.interaction_type in ("phonics_card", "word_builder", "picture_match", "letter_tracing")
                or request.concept.lower() in PHONICS_CONCEPTS)

    def render_step(self, request: InteractionRequest) -> dict[str, Any]:
        return {
            "t": "phonics", "concept": request.concept,
            "activity_type": request.interaction_type or "phonics_card",
            "instruction": f"Tap to explore: {request.concept}",
        }

    def embed_assets(self) -> dict[str, str]:
        return {
            "phonics_css": ".phonics-card{width:200px;height:200px;border-radius:16px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);display:flex;align-items:center;justify-content:center;margin:0 auto;cursor:pointer;color:#fff;font-size:3rem;font-weight:800}",
            "phonics_js": "var renderPhonics=function(c,config){var el=document.getElementById(c);if(!el)return;el.innerHTML='<div class=phonics-card>A</div>';}",
        }
