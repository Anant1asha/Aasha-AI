"""V5 Canvas Fallback — the built-in v5 engine canvas visuals.

This plugin is the fallback when no specialized simulation plugin matches.
It uses the v5 engine's native canvas drawing functions (drawPizza, drawFracBar,
drawAreaModel, drawNumLine, etc.) which are already in the template.
"""

from __future__ import annotations

from typing import Any

from .base import InteractionPlugin, InteractionRequest, PluginMetadata


# Map of suggested models to v5 step types
MODEL_TO_STEP = {
    "pizza": "ix_pizza",
    "bar": "ix_bar",
    "area": "ix_area",
    "slider": "ix_slider",
}

# Subject-specific canvas models available in the v5 engine
CANVAS_MODELS = {
    "math": ["pizza", "bar", "area", "slider", "numline", "shape", "grid"],
    "science": ["bar", "grid", "area"],  # Limited science support
    "english": [],
    "evs": [],
    "social_studies": [],
}


class V5CanvasFallback(InteractionPlugin):
    """Fallback plugin using the v5 engine's built-in canvas visuals."""

    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="v5-canvas",
            version="1.0.0",
            license="Proprietary (Aasha Foundation)",
            subjects=["math", "science"],
            grade_range=(3, 10),
            interaction_types=["interactive_visual", "exploration"],
            description="Built-in v5 engine canvas visuals (pizza, bar, area, slider, number line, shapes)",
            embed_size_kb=0,  # Already in the template
            requires_internet=False,
            offline_capable=True,
        )

    def can_handle(self, request: InteractionRequest) -> bool:
        """Always returns True — this is the fallback."""
        return True

    def render_step(self, request: InteractionRequest) -> dict[str, Any]:
        """Produce a v5 canvas step based on the suggested model."""
        model = request.suggested_model.lower()

        if model == "pizza":
            return {
                "t": "ix_pizza",
                "instruction": f"Tap slices to explore {request.concept}",
                "slices": 4,
            }
        elif model == "bar":
            return {
                "t": "ix_bar",
                "instruction": f"Tap parts to explore {request.concept}",
                "parts": 5,
            }
        elif model == "area":
            return {
                "t": "ix_area",
                "instruction": f"Tap squares to explore {request.concept}",
                "rows": 3,
                "cols": 4,
            }
        elif model == "slider":
            return {
                "t": "ix_slider",
                "instruction": f"Slide to explore {request.concept}",
                "base_num": 1,
                "base_den": 2,
            }
        else:
            # Default to bar model
            return {
                "t": "ix_bar",
                "instruction": f"Tap parts to explore {request.concept}",
                "parts": 4,
            }

    def embed_assets(self) -> dict[str, str]:
        """No additional assets — v5 canvas is already in the template."""
        return {}
