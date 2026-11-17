"""Interaction Plugin System - extensible architecture for embedding open-source
interactive learning tools into generated chapters.

Available plugins:
  - JSXGraph   (MIT, ~200KB)  - geometry, graphing, function plotting
  - PhET       (GPL v3)       - physics, chemistry, biology simulations
  - GeoGebra   (non-commercial)- geometry, algebra, graphing, 3D
  - Mermaid.js (MIT, ~150KB)  - diagrams, flowcharts, timelines, mind maps
  - Fabric.js  (MIT, ~300KB)  - anatomy labeling, image hotspots
  - H5P        (MIT, ~500KB)  - interactive content format (JSON-based)
  - VirtualLab (MIT, ~100KB)  - physics, chemistry, biology experiments
  - Scilab     (CeCILL)       - numerical computation, ODE solving
  - Mafs       (MIT, ~150KB)  - reactive math visualizations
  - HotPotatoes(GNU GPL)      - JQuiz, JMatch, JCloze, JCross, JMix
  - Phonics    (MIT, ~30KB)   - early primary K-3 language cards
  - Timeline   (MIT, ~40KB)   - social studies interactive timelines
"""
from .base import (
    InteractionPlugin,
    InteractionRequest,
    PluginMetadata,
    PluginRegistry,
    create_default_registry,
)

__all__ = [
    "InteractionPlugin",
    "InteractionRequest",
    "PluginMetadata",
    "PluginRegistry",
    "create_default_registry",
]
