"""Interaction Plugin System — extensible architecture for embedding open-source
interactive learning tools into generated chapters.

Each plugin wraps an external simulation/exercise tool (PhET, GeoGebra, JSXGraph,
Hot Potatoes, Scilab, virtual labs) and provides a uniform interface:
  - metadata: what subjects/grades/concepts it supports
  - can_handle(): whether this plugin can serve a given interaction need
  - prepare(): pre-process any external assets (download, base64-encode)
  - render_step(): produce the step spec that the v5 engine renders
  - embed_assets(): return any runtime JS/CSS that must be embedded in the HTML

Plugins are registered in a PluginRegistry. The DesignAgent queries the registry
to find the best plugin for a given visual/interaction opportunity.
"""

from __future__ import annotations

import base64
import json
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class InteractionRequest:
    """Describes an interaction need from the DesignAgent."""
    concept: str = ""
    subject: str = "math"
    grade: int = 4
    interaction_type: str = ""  # "simulation", "geometry", "graphing", "quiz_variety", "lab"
    suggested_model: str = ""   # "pizza", "bar", "circuit", "molecule", etc.
    context: str = ""           # Additional context about the concept


@dataclass
class PluginMetadata:
    """Declares what a plugin can do."""
    name: str
    version: str = "1.0.0"
    license: str = ""
    license_url: str = ""
    subjects: list[str] = field(default_factory=list)
    grade_range: tuple[int, int] = (3, 12)
    interaction_types: list[str] = field(default_factory=list)
    description: str = ""
    embed_size_kb: int = 0  # Approximate size when embedded
    requires_internet: bool = False
    offline_capable: bool = True


class InteractionPlugin(ABC):
    """Base class for all interaction plugins.

    A plugin wraps an external tool and provides:
    1. Metadata about what it can do
    2. A can_handle() check for a given interaction request
    3. A prepare() method to pre-process assets
    4. A render_step() method to produce a v5-compatible step spec
    5. An embed_assets() method to return runtime JS/CSS for the HTML <head>
    """

    def __init__(self):
        self._prepared: bool = False
        self._assets: dict[str, str] = {}  # name → base64 content

    @property
    @abstractmethod
    def metadata(self) -> PluginMetadata:
        """Return this plugin's metadata."""
        ...

    @abstractmethod
    def can_handle(self, request: InteractionRequest) -> bool:
        """Return True if this plugin can serve the given interaction request."""
        ...

    @abstractmethod
    def render_step(self, request: InteractionRequest) -> dict[str, Any]:
        """Produce a v5-compatible step spec for this interaction.

        Returns a step dict with at least 't' (step type) and any plugin-specific
        fields needed by the engine to render the interaction.
        """
        ...

    def prepare(self, request: InteractionRequest) -> None:
        """Pre-process any external assets (download, base64-encode).

        Override in subclasses that need to fetch or encode external resources.
        Default: no-op.
        """
        self._prepared = True

    def embed_assets(self) -> dict[str, str]:
        """Return runtime assets that must be embedded in the HTML.

        Returns a dict of {name: content} where content is JS or CSS to be
        injected into the <head> or <body> of the generated HTML.

        Override in subclasses that provide runtime libraries.
        """
        return {}

    @property
    def is_prepared(self) -> bool:
        return self._prepared

    def _b64_encode(self, data: bytes) -> str:
        """Base64-encode binary data."""
        return base64.b64encode(data).decode("ascii")

    def _b64_encode_text(self, text: str) -> str:
        """Base64-encode a text string."""
        return base64.b64encode(text.encode("utf-8")).decode("ascii")

    def __repr__(self):
        return f"<{self.__class__.__name__} {self.metadata.name} v{self.metadata.version}>"


class PluginRegistry:
    """Registry of available interaction plugins.

    The DesignAgent queries this to find the best plugin for a given
    interaction need. Plugins are registered by name and can be looked
    up by subject, grade, and interaction type.
    """

    def __init__(self):
        self._plugins: dict[str, InteractionPlugin] = {}
        self._fallback: InteractionPlugin | None = None

    def register(self, plugin: InteractionPlugin) -> None:
        """Register a plugin."""
        name = plugin.metadata.name
        self._plugins[name] = plugin
        logger.info(f"Registered plugin: {name}")

    def set_fallback(self, plugin: InteractionPlugin) -> None:
        """Set the fallback plugin used when no specific plugin matches."""
        self._fallback = plugin

    def get(self, name: str) -> InteractionPlugin | None:
        """Get a plugin by name."""
        return self._plugins.get(name)

    def find_best(
        self,
        request: InteractionRequest,
    ) -> InteractionPlugin | None:
        """Find the best plugin for a given interaction request.

        Tries each registered plugin's can_handle() and returns the first match.
        Falls back to the fallback plugin if no match.
        """
        candidates = []
        for plugin in self._plugins.values():
            if plugin.can_handle(request):
                candidates.append(plugin)

        if candidates:
            # Prefer plugins with smaller embed size (lighter = better for mobile)
            candidates.sort(key=lambda p: p.metadata.embed_size_kb)
            return candidates[0]

        if self._fallback:
            logger.debug(f"No specific plugin for {request.interaction_type}/{request.suggested_model}, using fallback")
            return self._fallback

        return None

    def list_plugins(self) -> list[PluginMetadata]:
        """Return metadata for all registered plugins."""
        return [p.metadata for p in self._plugins.values()]

    def plugins_for_subject(self, subject: str) -> list[PluginMetadata]:
        """Return plugins that support a given subject."""
        return [
            p.metadata for p in self._plugins.values()
            if subject in p.metadata.subjects or not p.metadata.subjects
        ]


def create_default_registry() -> PluginRegistry:
    """Create a registry with all available plugins registered.

    This is the main entry point — the orchestrator calls this to set up
    the plugin system.
    """
    registry = PluginRegistry()

    # Register all 12 plugins (lazy imports to avoid hard dependencies)
    plugin_specs = [
        ("jsxgraph.plugin", "JSXGraphPlugin"),
        ("phet.plugin", "PhETPlugin"),
        ("geogebra.plugin", "GeoGebraPlugin"),
        ("mermaid.plugin", "MermaidPlugin"),
        ("fabric.plugin", "FabricPlugin"),
        ("h5p.plugin", "H5PPlugin"),
        ("vlab.plugin", "VirtualLabPlugin"),
        ("scilab.plugin", "ScilabPlugin"),
        ("mafs.plugin", "MafsPlugin"),
        ("hotpotatoes.plugin", "HotPotatoesPlugin"),
        ("phonics.plugin", "PhonicsPlugin"),
        ("timeline.plugin", "TimelinePlugin"),
    ]

    for mod_path, cls_name in plugin_specs:
        try:
            import importlib
            mod = importlib.import_module(f"aasha.plugins.{mod_path}")
            cls = getattr(mod, cls_name)
            registry.register(cls())
        except Exception as e:
            logger.warning(f"Plugin {cls_name} not available: {e}")

    # Set fallback: the built-in v5 canvas visuals
    from .v5_canvas import V5CanvasFallback
    registry.set_fallback(V5CanvasFallback())

    return registry
