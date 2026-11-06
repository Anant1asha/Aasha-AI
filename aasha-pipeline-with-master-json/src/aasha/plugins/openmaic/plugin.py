"""OpenMAIC Interaction Plugin.

Integrates THU-MAIC/OpenMAIC interactive generation primitives and simulation blueprints
into the AASHA AIOS multi-agent pipeline.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from ..base import InteractionPlugin, InteractionRequest, PluginMetadata
from .builder import OpenMAICInteractionBuilder
from .templates import OPENMAIC_CATALOG, PROJECTILE_MOTION_LAB

logger = logging.getLogger(__name__)


class OpenMAICPlugin(InteractionPlugin):
    """Plugin for OpenMAIC interactive simulations and labs."""

    def __init__(self) -> None:
        super().__init__()
        self.builder = OpenMAICInteractionBuilder(theme="modern-dark")

    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="openmaic",
            version="1.0.0",
            license="MIT",
            license_url="https://github.com/THU-MAIC/OpenMAIC/blob/main/LICENSE",
            subjects=["science", "math", "physics"],
            grade_range=(4, 12),
            interaction_types=["simulation", "lab", "manipulative", "interactive_widget", "kinematics"],
            description="OpenMAIC - Governed Interactive Simulation Primitives & Physics/Math Labs",
            embed_size_kb=25,
            requires_internet=False,
            offline_capable=True,
        )

    def can_handle(self, request: InteractionRequest) -> bool:
        """Check if OpenMAIC supports the requested concept or interaction type."""
        concept_key = request.concept.lower().replace(" ", "_")
        if concept_key in OPENMAIC_CATALOG or any(k in concept_key for k in OPENMAIC_CATALOG):
            return True

        if request.suggested_model.lower() in ("projectile", "gravity", "freefall", "kinematics", "openmaic"):
            return True

        if request.interaction_type in ("simulation", "lab", "manipulative") and request.subject in ("science", "physics"):
            return True

        return False

    def render_step(self, request: InteractionRequest) -> Dict[str, Any]:
        """Produce an openmaic step specification for the chapter synthesis engine."""
        concept_key = request.concept.lower().replace(" ", "_")
        sim_code: Optional[str] = None

        for k, template in OPENMAIC_CATALOG.items():
            if k in concept_key or concept_key in k:
                sim_code = template
                break

        if not sim_code:
            sim_code = PROJECTILE_MOTION_LAB

        compiled = self.builder.compile_widget_payload(
            sim_code,
            schema_contract={
                "widgetType": "simulation",
                "title": f"{request.concept.title()} Lab",
                "template_version": "1.0.0",
                "required_controls": ["slider", "button"],
                "engine": "vanilla_js_canvas",
            },
        )

        controls: List[str] = compiled.get("validation", {}).get("controls_found", [])

        return {
            "t": "openmaic",
            "instruction": f"Interactive Simulation: {compiled.get('title')}",
            "concept": request.concept,
            "widgetType": "simulation",
            "title": compiled.get("title"),
            "engine": compiled.get("engine"),
            "srcdoc_b64": compiled.get("srcdoc_b64"),
            "compiled_source": compiled.get("compiled_source"),
            "controls": controls,
        }

    def embed_assets(self) -> Dict[str, str]:
        """Return container styling for OpenMAIC widgets embedded in synthesized chapters."""
        css = """
.openmaic-container {
    width: 100%;
    max-width: 720px;
    margin: 16px auto;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #334155;
    background: #0f172a;
    box-shadow: 0 4px 14px rgba(0,0,0,0.3);
}
.openmaic-frame {
    width: 100%;
    min-height: 480px;
    border: none;
    display: block;
}
"""
        return {"openmaic_css": css.strip()}
