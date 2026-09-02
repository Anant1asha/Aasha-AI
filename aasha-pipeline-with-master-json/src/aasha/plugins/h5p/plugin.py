"""H5P - interactive content format (MIT, JSON-based)."""
from __future__ import annotations
from typing import Any
from ..base import InteractionPlugin, InteractionRequest, PluginMetadata

CONTENT_TYPES = {
    "branching_scenario": "H5P.BranchingScenario",
    "memory_game": "H5P.MemoryGame",
    "interactive_video": "H5P.InteractiveVideo",
    "course_presentation": "H5P.CoursePresentation",
}


class H5PPlugin(InteractionPlugin):
    """H5P - interactive content format (JSON-based, embeddable)."""

    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="h5p", version="1.0.0", license="MIT",
            license_url="https://h5p.org/license",
            subjects=["math", "science", "english", "evs", "social_studies"],
            grade_range=(1, 12),
            interaction_types=["interactive_video", "course_presentation", "branching_scenario", "memory_game"],
            description="H5P - interactive content format (JSON-based, embeddable)",
            embed_size_kb=500, offline_capable=True)

    def can_handle(self, request: InteractionRequest) -> bool:
        return request.interaction_type in CONTENT_TYPES

    def render_step(self, request: InteractionRequest) -> dict[str, Any]:
        content_type = CONTENT_TYPES.get(request.interaction_type, "H5P.CoursePresentation")
        return {
            "t": "h5p", "concept": request.concept, "content_type": content_type,
            "h5p_json": {"library": content_type, "params": {}},
            "instruction": f"Interactive: {request.concept}",
        }

    def embed_assets(self) -> dict[str, str]:
        from ..bundler import get_bundled_script
        lib_js = get_bundled_script("h5p", "https://cdn.jsdelivr.net/npm/h5p-standalone@3.5.1/dist/main.bundle.js")
        
        css = ".h5p-container{width:100%;max-width:420px;margin:0 auto;border-radius:12px;overflow:hidden}"
        js = (
            "var renderH5P=function(c,json){\n"
            "  var el=document.getElementById(c);if(!el)return;\n"
            "  el.innerHTML='<div>H5P: '+json.library+'</div>';\n"
            "};"
        )
        return {"h5p_lib": lib_js, "h5p_css": css, "h5p_js": js}
