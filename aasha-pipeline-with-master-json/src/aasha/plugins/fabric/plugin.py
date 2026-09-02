"""Fabric.js - interactive canvas for anatomy labeling, image hotspots (MIT, ~300KB)."""
from __future__ import annotations
from typing import Any
from ..base import InteractionPlugin, InteractionRequest, PluginMetadata

ANATOMY_CONCEPTS = {"anatomy", "body parts", "cell structure", "plant parts", "human body",
                    "skeleton", "digestive system", "respiratory system", "nervous system"}


class FabricPlugin(InteractionPlugin):
    """Fabric.js - interactive canvas for labeling, hotspots, anatomy."""

    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="fabric", version="1.0.0", license="MIT",
            license_url="http://fabricjs.com/",
            subjects=["science", "evs", "social_studies"], grade_range=(3, 10),
            interaction_types=["image_hotspot", "labeling", "drag_place", "anatomy"],
            description="Fabric.js - interactive canvas for anatomy labeling, image hotspots, tap-to-place",
            embed_size_kb=300, offline_capable=True)

    def can_handle(self, request: InteractionRequest) -> bool:
        return (request.interaction_type in ("image_hotspot", "labeling", "anatomy")
                or (request.subject == "science"
                    and request.concept.lower() in ANATOMY_CONCEPTS))

    def render_step(self, request: InteractionRequest) -> dict[str, Any]:
        return {
            "t": "fabric", "concept": request.concept,
            "canvas_config": {"width": 400, "height": 350, "mode": "labeling"},
            "instruction": f"Tap labels to place on: {request.concept}",
        }

    def embed_assets(self) -> dict[str, str]:
        from ..bundler import get_bundled_script
        lib_js = get_bundled_script("fabric", "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js")
        
        css = ".fabric-canvas{border:1px solid #e2e8f0;border-radius:8px;display:block;margin:0 auto}"
        js = (
            "var renderFabric=function(c,config){\n"
            "  var el=document.getElementById(c);if(!el)return;\n"
            "  el.innerHTML='<canvas id=\"'+c+'_cv\" width=400 height=350 class=fabric-canvas></canvas>';\n"
            "};"
        )
        return {"fabric_lib": lib_js, "fabric_css": css, "fabric_js": js}
