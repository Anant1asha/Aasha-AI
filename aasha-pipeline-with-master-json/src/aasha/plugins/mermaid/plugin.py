"""Mermaid.js - diagrams, flowcharts, timelines, mind maps (MIT, ~150KB)."""
from __future__ import annotations
from typing import Any
from ..base import InteractionPlugin, InteractionRequest, PluginMetadata


class MermaidPlugin(InteractionPlugin):
    """Mermaid.js - interactive diagrams, flowcharts, timelines, mind maps."""

    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="mermaid", version="1.0.0", license="MIT",
            license_url="https://github.com/mermaid-js/mermaid/blob/develop/LICENSE",
            subjects=["science", "math", "english", "evs", "social_studies"],
            grade_range=(3, 12),
            interaction_types=["diagram", "flowchart", "timeline", "mindmap", "exploration"],
            description="Mermaid.js - interactive diagrams, flowcharts, timelines, mind maps",
            embed_size_kb=150, offline_capable=True)

    def can_handle(self, request: InteractionRequest) -> bool:
        return request.interaction_type in ("diagram", "flowchart", "timeline", "mindmap") or (
            request.subject in ("social_studies", "english", "evs", "science")
            and request.interaction_type == "exploration"
        )

    def render_step(self, request: InteractionRequest) -> dict[str, Any]:
        diagram_type = request.interaction_type or "flowchart"
        return {
            "t": "mermaid", "concept": request.concept, "diagram_type": diagram_type,
            "mermaid_code": f"{diagram_type}\n  TD\n  A[Start] --> B[{request.concept}]",
            "instruction": f"Visual diagram: {request.concept}",
        }

    def embed_assets(self) -> dict[str, str]:
        css = ".mermaid-container{width:100%;max-width:420px;margin:0 auto;text-align:center}"
        js = (
            "var renderMermaid=function(c,code){\n"
            "  var el=document.getElementById(c);if(!el)return;\n"
            "  el.innerHTML='<pre>'+code+'</pre>';\n"
            "};"
        )
        return {"mermaid_css": css, "mermaid_js": js}
