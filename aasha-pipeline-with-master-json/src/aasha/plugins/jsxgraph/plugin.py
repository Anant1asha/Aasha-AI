"""JSXGraph - interactive geometry, graphing, function plotting.

JSXGraph is a cross-browser JavaScript library for interactive geometry,
function plotting, and data visualization. Pure JS, MIT licensed, ~200KB.
Ideal for offline single-file embedding.

Step type: 'jsxgraph' with board_config field.
"""
from __future__ import annotations
from typing import Any
from ..base import InteractionPlugin, InteractionRequest, PluginMetadata

PRESETS = {
    "geometry": {"tools": ["point", "line", "segment", "circle", "polygon"], "boundingbox": [-5, 5, 5, -5], "axis": False, "grid": False},
    "graphing": {"tools": ["point", "line", "function", "slider"], "boundingbox": [-5, 5, 5, -5], "axis": True, "grid": True},
    "function_plot": {"tools": ["function", "slider"], "boundingbox": [-5, 5, 5, -5], "axis": True, "grid": True},
    "trigonometry": {"tools": ["function", "slider", "point"], "boundingbox": [-6.28, 3, 6.28, -3], "axis": True, "grid": True},
    "calculus": {"tools": ["function", "derivative", "integral"], "boundingbox": [-5, 5, 5, -5], "axis": True, "grid": True},
    "statistics": {"tools": ["point", "histogram", "barchart"], "boundingbox": [-1, 10, 10, -1], "axis": True, "grid": False},
}

CONCEPT_MAP = {
    "geometry": "geometry", "angles": "geometry", "triangles": "geometry", "circles": "geometry",
    "polygons": "geometry", "constructions": "geometry", "coordinate_geometry": "graphing",
    "linear_equations": "graphing", "quadratic": "function_plot", "functions": "function_plot",
    "graphing": "graphing", "slope": "graphing", "trigonometry": "trigonometry", "sin": "trigonometry",
    "cos": "trigonometry", "tan": "trigonometry", "calculus": "calculus", "derivatives": "calculus",
    "integrals": "calculus", "statistics": "statistics", "data": "statistics", "probability": "statistics",
}


class JSXGraphPlugin(InteractionPlugin):
    """JSXGraph interactive geometry/graphing plugin (MIT, ~200KB)."""

    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="jsxgraph", version="1.0.0", license="MIT",
            license_url="https://github.com/jsxgraph/jsxgraph/blob/master/LICENSE",
            subjects=["math"], grade_range=(6, 12),
            interaction_types=["geometry", "graphing", "exploration", "interactive_visual"],
            description="JSXGraph - interactive geometry, graphing, function plotting (pure JS, ~200KB)",
            embed_size_kb=200, offline_capable=True)

    def can_handle(self, request: InteractionRequest) -> bool:
        if request.subject != "math":
            return False
        key = request.concept.lower().replace(" ", "_")
        return key in CONCEPT_MAP or request.interaction_type in ("geometry", "graphing")

    def render_step(self, request: InteractionRequest) -> dict[str, Any]:
        key = request.concept.lower().replace(" ", "_")
        preset_name = CONCEPT_MAP.get(key, "graphing" if request.grade >= 8 else "geometry")
        preset = PRESETS.get(preset_name, PRESETS["geometry"])
        return {
            "t": "jsxgraph", "concept": request.concept, "preset": preset_name,
            "board_config": preset,
            "instruction": f"Explore {request.concept} with JSXGraph",
        }

    def embed_assets(self) -> dict[str, str]:
        from ..bundler import get_bundled_script
        lib_js = get_bundled_script("jsxgraph", "https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraphcore.min.js")
        
        css = ".jsxg-box{width:100%;max-width:400px;height:320px;border:2px solid #cbd5e1;border-radius:12px;margin:0 auto;background:#fff}"
        js = (
            "// JSXGraph interactive renderer\n"
            "var renderJSX = function(c, config) {\n"
            "  var el = document.getElementById(c); if (!el) return;\n"
            "  var boxId = c + '_jxg';\n"
            "  el.innerHTML = '<div id=\"' + boxId + '\" class=\"jsxg-box\"></div>';\n"
            "  try {\n"
            "    if (window.JXG && window.JXG.JSXGraph) {\n"
            "      var b = JXG.JSXGraph.initBoard(boxId, config || { boundingbox: [-5, 5, 5, -5], axis: true, grid: true });\n"
            "      b.create('point', [1, 2], { name: 'P(1,2)', size: 3, color: '#3b82f6' });\n"
            "      b.create('point', [-2, -1], { name: 'Q(-2,-1)', size: 3, color: '#22c55e' });\n"
            "    }\n"
            "  } catch(e) { console.warn('JSXGraph init:', e); }\n"
            "};"
        )
        return {"jsxgraph_lib": lib_js, "jsxgraph_css": css, "jsxgraph_js": js}
