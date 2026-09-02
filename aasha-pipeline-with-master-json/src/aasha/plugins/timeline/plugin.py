"""Interactive Timeline - for social studies, history, civics."""
from __future__ import annotations
from typing import Any
from ..base import InteractionPlugin, InteractionRequest, PluginMetadata

TIMELINE_CONCEPTS = {"history", "civilization", "freedom_struggle", "government", "culture", "independence"}


class TimelinePlugin(InteractionPlugin):
    """Interactive timelines, branching cause-and-effect, click-to-reveal maps."""

    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="timeline", version="1.0.0", license="MIT",
            subjects=["social_studies", "history", "english"], grade_range=(3, 12),
            interaction_types=["timeline", "branching", "cause_effect", "map_exploration"],
            description="Interactive timelines, branching cause-and-effect, click-to-reveal maps for social studies",
            embed_size_kb=40, offline_capable=True)

    def can_handle(self, request: InteractionRequest) -> bool:
        return (request.subject in ("social_studies", "history", "civics", "english")
                and (request.interaction_type in ("timeline", "branching", "cause_effect", "map_exploration")
                     or request.concept.lower() in TIMELINE_CONCEPTS))

    def render_step(self, request: InteractionRequest) -> dict[str, Any]:
        timeline_type = request.interaction_type or "timeline"
        return {
            "t": "timeline", "concept": request.concept, "timeline_type": timeline_type,
            "events": [],
            "instruction": f"Explore: {request.concept} (interactive timeline)",
        }

    def embed_assets(self) -> dict[str, str]:
        return {
            "timeline_css": ".timeline-track{width:100%;max-width:420px;height:4px;background:linear-gradient(90deg,#3b82f6,#8b5cf6);border-radius:2px;margin:24px auto;position:relative}",
            "timeline_js": (
                "var renderTimeline=function(c,config){var el=document.getElementById(c);if(!el)return;"
                "el.innerHTML='<div class=timeline-track></div><div style=text-align:center;color:#64748b>'+config.timeline_type+': '+config.concept+'</div>';}"
            ),
        }
