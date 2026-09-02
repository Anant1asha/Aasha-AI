"""Virtual Lab - physics, chemistry, biology experiments (HTML5 canvas, MIT)."""
from __future__ import annotations
from typing import Any
from ..base import InteractionPlugin, InteractionRequest, PluginMetadata

LAB_CATALOG = {
    "physics": ["motion", "pendulum", "circuit", "optics", "waves", "spring", "friction", "gravity", "projectile"],
    "chemistry": ["titration", "mixing", "ph", "reaction", "crystal", "separation", "flame_test"],
    "biology": ["cell", "photosynthesis", "respiration", "mitosis", "ecosystem", "digestion"],
}


class VirtualLabPlugin(InteractionPlugin):
    """Virtual Lab - physics, chemistry, biology experiment simulations."""

    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="vlab", version="1.0.0", license="MIT",
            subjects=["science"], grade_range=(6, 12),
            interaction_types=["lab", "simulation", "experiment"],
            description="Virtual Lab - physics, chemistry, biology experiment simulations",
            embed_size_kb=100, offline_capable=True)

    def can_handle(self, request: InteractionRequest) -> bool:
        if request.subject != "science":
            return False
        key = request.concept.lower().replace(" ", "_")
        for domain, concepts in LAB_CATALOG.items():
            if key in concepts or any(c in key for c in concepts):
                return True
        return request.interaction_type in ("lab", "experiment")

    def render_step(self, request: InteractionRequest) -> dict[str, Any]:
        key = request.concept.lower().replace(" ", "_")
        domain = "physics"
        for d, concepts in LAB_CATALOG.items():
            if key in concepts or any(c in key for c in concepts):
                domain = d
                break
        return {
            "t": "vlab", "concept": request.concept, "lab_type": domain,
            "experiment": key,
            "instruction": f"Virtual Lab: {request.concept}",
            "canvas_config": {"width": 400, "height": 350},
        }

    def embed_assets(self) -> dict[str, str]:
        from ..bundler import get_bundled_script
        lib_js = get_bundled_script("vlab", "https://cdn.jsdelivr.net/npm/vlab-mock/dist/vlab.min.js")
        
        css = ".vlab-canvas{width:400px;height:350px;border-radius:8px;background:#1e293b;margin:0 auto;display:block}"
        js = (
            "var renderVLab=function(c,config){\n"
            "  var el=document.getElementById(c);if(!el)return;\n"
            "  el.innerHTML='<canvas class=vlab-canvas></canvas>';\n"
            "};"
        )
        return {"vlab_lib": lib_js, "vlab_css": css, "vlab_js": js}
