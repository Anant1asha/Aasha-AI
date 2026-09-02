"""PhET Interactive Simulations plugin.

PhET (University of Colorado Boulder) provides open-source interactive
science and math simulations. This plugin:
- Maps chapter concepts to relevant PhET simulations
- Embeds simulations as base64-encoded iframe srcdoc in the HTML
- Handles GPL v3 license metadata

PhET sims can be downloaded from https://phet.colorado.edu/ as self-contained
HTML files and embedded via <iframe srcdoc="base64...">.

This plugin generates a step type 'phet' with a srcdoc_b64 field.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from ..base import InteractionPlugin, InteractionRequest, PluginMetadata

logger = logging.getLogger(__name__)

# Mapping of concepts to PhET simulation identifiers
# These are the simulation names from https://phet.colorado.edu/
PHET_SIM_CATALOG = {
    # Physics
    "motion": "the-moving-man",
    "velocity": "the-moving-man",
    "acceleration": "the-moving-man",
    "force": "forces-and-motion-basics",
    "friction": "forces-and-motion-basics",
    "gravity": "gravity-force-lab",
    "energy": "energy-forms-and-changes",
    "waves": "wave-on-a-string",
    "sound": "sound",
    "light": "color-vision",
    "circuits": "circuit-construction-kit-dc",
    "electricity": "circuit-construction-kit-dc",
    "magnetism": "magnets-and-electromagnets",
    "optics": "geometric-optics",
    "pendulum": "pendulum-lab",
    "projectile": "projectile-motion",
    "spring": "masses-and-springs",
    "buoyancy": "buoyancy",
    # Chemistry
    "atoms": "build-an-atom",
    "molecule": "molecule-shapes",
    "chemical_bond": "molecule-shapes",
    "ph": "ph-scale",
    "acids": "acid-base-solutions",
    "reactions": "reactants-products-and-leftovers",
    "states_of_matter": "states-of-matter",
    "gas": "gas-properties",
    # Math
    "fractions": "fraction-matcher",
    "area": "area-model-introduction",
    "multiplication": "area-model-multiplication",
    "algebra": "algebra-expressions",
    "graphing": "graphing-lines",
    "calculus": "calculus-grapher",
    "probability": "plinko-probability",
    # Biology
    "photosynthesis": "photosynthesis",
    "natural_selection": "natural-selection-family",
    "dna": "build-a-dna-molecule",
    "mitosis": "cell-division",
}

# PhET simulation URL pattern (for downloading)
PHET_URL_TEMPLATE = "https://phet.colorado.edu/sims/html/{sim}/latest/{sim}_en.html"


class PhETPlugin(InteractionPlugin):
    """Plugin for embedding PhET Interactive Simulations.

    PhET sims are self-contained HTML files that can be embedded via
    <iframe srcdoc="..."> or downloaded and base64-encoded as srcdoc_b64.

    License: GPL v3 (simulations), CC-BY (some assets)
    """

    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="phet",
            version="1.0.0",
            license="GPL v3",
            license_url="https://www.gnu.org/licenses/gpl-3.0.html",
            subjects=["science", "math"],
            grade_range=(6, 12),
            interaction_types=["simulation", "exploration", "lab"],
            description="PhET Interactive Simulations — physics, chemistry, biology, math simulations from University of Colorado Boulder",
            embed_size_kb=50,  # Varies greatly per sim; avg when embedded as srcdoc
            requires_internet=False,  # Once downloaded and embedded
            offline_capable=True,
        )

    def can_handle(self, request: InteractionRequest) -> bool:
        """Check if a PhET simulation exists for this concept."""
        concept_key = request.concept.lower().replace(" ", "_")
        if concept_key in PHET_SIM_CATALOG:
            return True

        # Check suggested model
        model = request.suggested_model.lower()
        if model in PHET_SIM_CATALOG:
            return True

        # Check interaction type
        if request.interaction_type in ("simulation", "lab") and request.subject in ("science", "math"):
            # Likely a PhET match for science/math simulations
            return request.grade >= 6

        return False

    def _find_sim(self, request: InteractionRequest) -> str | None:
        """Find the best PhET simulation for a request."""
        concept_key = request.concept.lower().replace(" ", "_")
        if concept_key in PHET_SIM_CATALOG:
            return PHET_SIM_CATALOG[concept_key]

        model = request.suggested_model.lower()
        if model in PHET_SIM_CATALOG:
            return PHET_SIM_CATALOG[model]

        return None

    def render_step(self, request: InteractionRequest) -> dict[str, Any]:
        """Produce a phet step spec.

        The srcdoc_b64 field will contain the base64-encoded simulation HTML.
        If the simulation hasn't been downloaded, it generates a placeholder
        that links to the simulation and includes the simulation URL for
        the assembler to download and embed.
        """
        sim_id = self._find_sim(request)

        if not sim_id:
            # No matching sim — return a fallback text step
            return {
                "t": "text",
                "title": f"Explore: {request.concept}",
                "body": f"Explore the concept of {request.concept} interactively.",
            }

        sim_url = PHET_URL_TEMPLATE.format(sim=sim_id)

        return {
            "t": "phet",
            "instruction": f"Explore: {request.concept} (PhET Simulation)",
            "sim_id": sim_id,
            "sim_url": sim_url,
            "iframe_html": self._assets.get(sim_id, ""),
            "concept": request.concept,
        }

    def prepare(self, request: InteractionRequest) -> None:
        """Download and base64-encode the PhET simulation."""
        from ..bundler import get_bundled_script

        sim_id = self._find_sim(request)
        if not sim_id:
            self._prepared = True
            return

        sim_url = PHET_URL_TEMPLATE.format(sim=sim_id)
        
        # Use the bundler to get the iframe and store it in _assets
        # The step template will use this iframe directly or we store the srcdoc.
        # Actually, get_bundled_script caches and returns the tag. We can store it.
        iframe_tag = get_bundled_script(sim_id, sim_url, "text/html", is_iframe=True)
        self._assets[sim_id] = iframe_tag
        self._prepared = True

    def embed_assets(self) -> dict[str, str]:
        """Return any CSS needed for PhET iframes."""
        return {
            "phet_css": """
/* PhET simulation iframe */
.phet-container{width:100%;max-width:420px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:var(--shadow)}
.phet-container iframe{width:100%;height:350px;border:none;border-radius:12px}
"""
        }
