"""Mafs - reactive math visualizations (MIT, lightweight)."""
from __future__ import annotations
from typing import Any
from ..base import InteractionPlugin, InteractionRequest, PluginMetadata

MAFS_CONCEPTS = {"functions", "coordinate_geometry", "vectors", "transformations", "calculus"}


class MafsPlugin(InteractionPlugin):
    """Mafs - reactive, interactive math visualizations."""

    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="mafs", version="1.0.0", license="MIT",
            license_url="https://github.com/stevenpetryk/mafs/blob/main/LICENSE",
            subjects=["math"], grade_range=(8, 12),
            interaction_types=["graphing", "geometry", "exploration", "interactive_visual"],
            description="Mafs - reactive, interactive math visualizations for coordinate geometry and functions",
            embed_size_kb=150, offline_capable=True)

    def can_handle(self, request: InteractionRequest) -> bool:
        if request.subject != "math" or request.grade < 8:
            return False
        return (request.interaction_type in ("graphing", "geometry")
                or request.concept.lower() in MAFS_CONCEPTS)

    def render_step(self, request: InteractionRequest) -> dict[str, Any]:
        return {
            "t": "mafs", "concept": request.concept,
            "config": {"width": 400, "height": 350, "type": "function_plot"},
            "instruction": f"Explore: {request.concept} (interactive graph)",
        }

    def embed_assets(self) -> dict[str, str]:
        from ..bundler import get_bundled_script
        lib_js = get_bundled_script("mafs", "https://unpkg.com/mafs/dist/mafs.min.js")
        return {
            "mafs_lib": lib_js,
            "mafs_css": ".mafs-container{width:400px;height:350px;border-radius:8px;overflow:hidden;margin:0 auto}"
        }
