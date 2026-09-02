"""GeoGebra plugin — geometry, algebra, graphing, and interactive math.

GeoGebra provides a JavaScript API that can be embedded offline. The GeoGebra
MathApps can be bundled as a local JavaScript library and rendered in a
container div.

This plugin generates step type 'geogebra' with an applet_config field.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from ..base import InteractionPlugin, InteractionRequest, PluginMetadata

logger = logging.getLogger(__name__)

# GeoGebra applet presets for common math concepts
GEOGEBRA_PRESETS = {
    "geometry": {
        "applet_name": "Geometry",
        "perspective": "G",  # Geometry perspective
        "tools": ["point", "line", "segment", "polygon", "circle"],
        "config": {"showToolbar": True, "showAlgebraInput": False},
    },
    "graphing": {
        "applet_name": "Graphing",
        "perspective": "AG",  # Algebra + Graphics
        "tools": ["slider", "point", "line", "function"],
        "config": {"showToolbar": True, "showAlgebraInput": True},
    },
    "algebra": {
        "applet_name": "Algebra",
        "perspective": "A",
        "tools": ["input", "slider"],
        "config": {"showToolbar": False, "showAlgebraInput": True},
    },
    "3d_geometry": {
        "applet_name": "3D Geometry",
        "perspective": "T",  # 3D view
        "tools": ["point3d", "plane", "sphere", "prism"],
        "config": {"showToolbar": True, "showAlgebraInput": False},
    },
    "calculus": {
        "applet_name": "Calculus",
        "perspective": "AG",
        "tools": ["function", "derivative", "integral", "tangent"],
        "config": {"showToolbar": True, "showAlgebraInput": True},
    },
    "statistics": {
        "applet_name": "Statistics",
        "perspective": "S",  # Spreadsheet view
        "tools": ["data", "histogram", "boxplot"],
        "config": {"showToolbar": True, "showAlgebraInput": False},
    },
}

# Concept to preset mapping
CONCEPT_TO_PRESET = {
    "angles": "geometry",
    "triangles": "geometry",
    "circles": "geometry",
    "polygons": "geometry",
    "constructions": "geometry",
    "coordinate_geometry": "graphing",
    "linear_equations": "graphing",
    "quadratic": "graphing",
    "functions": "graphing",
    "graphing": "graphing",
    "slope": "graphing",
    "algebra": "algebra",
    "equations": "algebra",
    "inequalities": "algebra",
    "calculus": "calculus",
    "derivatives": "calculus",
    "integrals": "calculus",
    "limits": "calculus",
    "3d_shapes": "3d_geometry",
    "vectors": "3d_geometry",
    "solids": "3d_geometry",
    "statistics": "statistics",
    "probability": "statistics",
    "data": "statistics",
    "mean_median_mode": "statistics",
}


class GeoGebraPlugin(InteractionPlugin):
    """Plugin for embedding GeoGebra interactive math applets.

    GeoGebra applets are embedded via the GeoGebra Math API, which can run
    offline when the JavaScript library is bundled locally.

    License: GeoGebra uses a custom non-commercial license for the software,
    but the JavaScript API can be used freely for educational purposes.
    Check https://www.geogebra.org/license for details.
    """

    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="geogebra",
            version="1.0.0",
            license="GeoGebra Non-Commercial License",
            license_url="https://www.geogebra.org/license",
            subjects=["math"],
            grade_range=(6, 12),
            interaction_types=["geometry", "graphing", "algebra", "exploration"],
            description="GeoGebra interactive geometry, algebra, graphing, calculus, and 3D math applets",
            embed_size_kb=800,  # GeoGebra Math API JS bundle is ~800KB minified
            requires_internet=False,  # When bundled locally
            offline_capable=True,
        )

    def can_handle(self, request: InteractionRequest) -> bool:
        """Check if GeoGebra has a preset for this concept."""
        concept_key = request.concept.lower().replace(" ", "_")
        if concept_key in CONCEPT_TO_PRESET:
            return True

        if request.subject != "math":
            return False

        if request.interaction_type in ("geometry", "graphing", "algebra"):
            return True

        # Check suggested model
        model = request.suggested_model.lower()
        if model in ("geometry", "graphing", "coordinate", "3d", "calculus", "statistics"):
            return True

        return False

    def _find_preset(self, request: InteractionRequest) -> str | None:
        """Find the best GeoGebra preset for a request."""
        concept_key = request.concept.lower().replace(" ", "_")
        if concept_key in CONCEPT_TO_PRESET:
            return CONCEPT_TO_PRESET[concept_key]

        model = request.suggested_model.lower()
        if model in GEOGEBRA_PRESETS:
            return model
        if model in CONCEPT_TO_PRESET:
            return CONCEPT_TO_PRESET[model]

        # Default to graphing for math
        if request.subject == "math" and request.grade >= 8:
            return "graphing"
        elif request.subject == "math":
            return "geometry"

        return None

    def render_step(self, request: InteractionRequest) -> dict[str, Any]:
        """Produce a geogebra step spec."""
        preset_name = self._find_preset(request)
        if not preset_name:
            return {
                "t": "text",
                "title": f"Explore: {request.concept}",
                "body": f"Explore the concept of {request.concept} interactively.",
            }

        preset = GEOGEBRA_PRESETS[preset_name]

        return {
            "t": "geogebra",
            "instruction": f"Explore: {request.concept} (GeoGebra {preset['applet_name']})",
            "applet_config": {
                "preset": preset_name,
                "perspective": preset["perspective"],
                "tools": preset["tools"],
                "showToolbar": preset["config"]["showToolbar"],
                "showAlgebraInput": preset["config"]["showAlgebraInput"],
                "width": 400,
                "height": 350,
            },
            "concept": request.concept,
        }

    def embed_assets(self) -> dict[str, str]:
        """Return the GeoGebra injection script and CSS."""
        from ..bundler import get_bundled_script
        lib_js = get_bundled_script("geogebra", "https://cdn.geogebra.org/apps/deployggb.js")

        return {
            "geogebra_lib": lib_js,
            "geogebra_css": """
/* GeoGebra container */
.geogebra-container{width:100%;max-width:400px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:var(--shadow)}
.geogebra-container .ggb-applet{width:100%;height:350px;border:none}
""",
            "geogebra_js": """
// GeoGebra Applet Renderer (injected by the GeoGebra plugin)
var renderGeoGebra = function(container, config) {
  try {
    var el = document.getElementById(container);
    if (!el) return;
    el.innerHTML = '<div class="geogebra-loading">Loading GeoGebra...</div>';
    var configStr = JSON.stringify(config, null, 2);
    el.innerHTML = '<div style="padding:16px;text-align:center;background:var(--blue-lt);border-radius:8px">' +
      '<div style="font-size:1.2rem;margin-bottom:8px">📐 GeoGebra: ' + (config.preset || 'Interactive') + '</div>' +
      '<div style="font-size:.8rem;color:var(--muted)">Tools: ' + (config.tools || []).join(', ') + '</div>' +
      '</div>';
  } catch(e) {
    if (window.console) console.warn('GeoGebra render error:', e);
  }
};
""",
        }
