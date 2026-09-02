"""Scilab - numerical computation and simulation (CeCILL license)."""
from __future__ import annotations
from typing import Any
from ..base import InteractionPlugin, InteractionRequest, PluginMetadata

SCILAB_CONCEPTS = {"matrices", "differential_equations", "signal_processing", "optimization", "numerical_methods"}


class ScilabPlugin(InteractionPlugin):
    """Scilab/Xcos - numerical computation, matrix operations, ODE solving."""

    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="scilab", version="1.0.0", license="CeCILL",
            license_url="https://www.scilab.org/about/ceciill",
            subjects=["math", "science"], grade_range=(9, 12),
            interaction_types=["numerical_computation", "simulation", "data_analysis"],
            description="Scilab/Xcos - numerical computation, matrix operations, ODE solving, signal processing",
            embed_size_kb=2000, offline_capable=True)

    def can_handle(self, request: InteractionRequest) -> bool:
        if request.grade < 9:
            return False
        return (request.interaction_type in ("numerical_computation", "data_analysis")
                or request.concept.lower() in SCILAB_CONCEPTS)

    def render_step(self, request: InteractionRequest) -> dict[str, Any]:
        return {
            "t": "scilab", "concept": request.concept,
            "script": f"// Scilab script for {request.concept}",
            "instruction": f"Numerical computation: {request.concept}",
        }

    def embed_assets(self) -> dict[str, str]:
        return {"scilab_css": ".scilab-output{font-family:monospace;background:#1e293b;color:#a7f3d0;padding:12px;border-radius:8px;font-size:.8rem;max-height:300px;overflow-y:auto}"}
