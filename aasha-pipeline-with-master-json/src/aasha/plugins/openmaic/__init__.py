"""OpenMAIC interactive simulation plugin module."""
from __future__ import annotations

from .builder import OpenMAICInteractionBuilder
from .plugin import OpenMAICPlugin
from .templates import GRAVITY_FREEFALL_LAB, OPENMAIC_CATALOG, PROJECTILE_MOTION_LAB

__all__ = [
    "OpenMAICPlugin",
    "OpenMAICInteractionBuilder",
    "OPENMAIC_CATALOG",
    "PROJECTILE_MOTION_LAB",
    "GRAVITY_FREEFALL_LAB",
]
