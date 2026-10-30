"""AASHA Visual Resource (AVR) Harvest Plugin.
Exposes prebuilt, certified offline interactives (AVR-P301 to AVR-P321) from
AASHA_Visual_Mass_Harvest_Phase3/ to the pipeline via the Resource-First Reuse Hierarchy.
"""
from aasha.plugins.harvest.plugin import AVRPlugin

__all__ = ["AVRPlugin"]
