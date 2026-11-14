"""HTML Assembler — Stage 7: compiles the chapter spec into a single HTML file.

Injects content into the v5 template at the 8 placeholders:
  {{CHAPTER_TITLE}}, {{WM_JSON}}, {{CONN_JSON}}, {{LEVELS_JSON}},
  {{BADGES_JSON}}, {{WE_JSON}}, {{SOLVE_JSON}}, {{CONTENT_JSON}}
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# The 8 placeholders in the v5 template
PLACEHOLDERS = [
    "{{CHAPTER_TITLE}}",
    "{{STORAGE_KEY}}",
    "{{WM_JSON}}",
    "{{CONN_JSON}}",
    "{{LEVELS_JSON}}",
    "{{BADGES_JSON}}",
    "{{WE_JSON}}",
    "{{SOLVE_JSON}}",
    "{{CONTENT_JSON}}",
]


class HTMLAssembler:
    """Compiles a chapter spec + LLE into a single HTML file."""

    def __init__(self, template_path: str = "template/v5-engine-template.html"):
        self.template_path = Path(template_path)
        if not self.template_path.exists():
            raise FileNotFoundError(f"Template not found: {self.template_path}")
        with open(self.template_path, "r", encoding="utf-8") as f:
            self.template = f.read()
        # Gate: verify all 9 placeholders exist in the template at construction time
        self._verify_template_placeholders()

    def _verify_template_placeholders(self) -> None:
        """Raise ValueError if any required placeholder is missing from the template.

        Called at construction time so failures surface immediately, not mid-pipeline.
        """
        missing = [ph for ph in PLACEHOLDERS if ph not in self.template]
        if missing:
            raise ValueError(
                f"Template is missing required placeholders: {missing}. "
                f"Check {self.template_path}"
            )

    def _serialize(self, data: Any) -> str:
        """Serialize to JSON with ensure_ascii=False to preserve Devanagari."""
        return json.dumps(data, ensure_ascii=False, indent=None, separators=(",", ":"))

    def assemble(
        self,
        spec: dict[str, Any],
        lle: dict[str, Any],
        defaults: dict[str, Any] | None = None,
    ) -> str:
        """Assemble the final HTML.

        Args:
            spec: The chapter_spec.json dict
            lle: The lle.json dict (with WM and CONN)
            defaults: The config/defaults.json dict (for LEVELS fallback)

        Returns:
            The complete HTML string
        """
        chapter = spec.get("chapter", {})
        chapter_title = chapter.get("title", "Untitled Chapter")

        # WM and CONN from LLE
        wm = lle.get("WM", {})
        conn = lle.get("CONN", {})

        # LEVELS: use spec override or defaults
        if spec.get("LEVELS"):
            levels = spec["LEVELS"]
        elif defaults:
            levels = defaults.get("LEVELS", [])
        else:
            levels = []

        # BADGES from spec
        badges = spec.get("BADGES", [])

        # WE and SOLVE from spec
        we = spec.get("WE", {})
        solve = spec.get("SOLVE", {})

        # NODES from spec
        nodes = spec.get("NODES", [])

        # Collect and inline URIRA interactive simulations (M1 URIRA Bridge)
        inlined_sims: dict[str, str] = {}
        for node in nodes:
            for step in node.get("steps", []):
                res = step.get("resolved_interactive")
                sim_id = step.get("sim_id") or (res.get("resource_id") if isinstance(res, dict) else None)
                if sim_id and sim_id not in inlined_sims:
                    asset_file = self._find_interactive_asset_file(sim_id)
                    if asset_file and asset_file.is_file():
                        try:
                            inlined_sims[sim_id] = asset_file.read_text(encoding="utf-8")
                        except Exception as e:
                            logger.warning(f"Could not inline asset {sim_id}: {e}")

        # Build the replacement map
        replacements = {
            "{{CHAPTER_TITLE}}": chapter_title,
            "{{STORAGE_KEY}}": chapter.get("storage_key", "aasha_chapter_v5"),
            "{{WM_JSON}}": self._serialize(wm),
            "{{CONN_JSON}}": self._serialize(conn),
            "{{LEVELS_JSON}}": self._serialize(levels),
            "{{BADGES_JSON}}": self._serialize(badges),
            "{{WE_JSON}}": self._serialize(we),
            "{{SOLVE_JSON}}": self._serialize(solve),
            "{{CONTENT_JSON}}": self._serialize(nodes),
        }

        html = self.template
        for placeholder, value in replacements.items():
            if placeholder in html:
                html = html.replace(placeholder, value)
            else:
                logger.warning(f"Placeholder {placeholder} not found in template")

        # Inject inlined simulation bundles if present
        if inlined_sims:
            sims_json = (
                json.dumps(inlined_sims, ensure_ascii=False)
                .replace("<", "\\u003c")
                .replace(">", "\\u003e")
            )
            injection = f"\n<script>window.__INLINED_SIMS__ = {sims_json};</script>\n"
            if "</head>" in html:
                html = html.replace("</head>", f"{injection}</head>", 1)
            elif "</body>" in html:
                html = html.replace("</body>", f"{injection}</body>", 1)

        # Verify no unresolved placeholders remain
        for ph in PLACEHOLDERS:
            if ph in html:
                logger.warning(f"Unresolved placeholder {ph} remains in output")

        return html

    @classmethod
    def _find_interactive_asset_file(cls, resource_id: str) -> Path | None:
        """Locates the interactive HTML asset file across repository paths."""
        candidate_roots = [
            Path.cwd(),
            Path.cwd() / "Aasha-AI",
            Path(__file__).resolve().parents[5],
            Path(__file__).resolve().parents[4],
            Path(__file__).resolve().parents[3],
        ]
        for r in candidate_roots:
            asset_dir = r / "assets" / "cdn" / "interactives"
            if asset_dir.is_dir():
                matches = list(asset_dir.glob(f"{resource_id}*.html"))
                if matches:
                    return matches[0]
        return None

    def assemble_to_file(
        self,
        spec_path: str | Path,
        lle_path: str | Path,
        output_path: str | Path,
        defaults_path: str | Path | None = None,
    ) -> Path:
        """Assemble from file paths and write to output.

        Args:
            spec_path: Path to chapter_spec.json
            lle_path: Path to lle.json
            output_path: Path to write the HTML file
            defaults_path: Optional path to config/defaults.json

        Returns:
            Path to the written HTML file
        """
        with open(spec_path, "r", encoding="utf-8") as f:
            spec = json.load(f)

        with open(lle_path, "r", encoding="utf-8") as f:
            lle = json.load(f)

        defaults = None
        if defaults_path and Path(defaults_path).exists():
            with open(defaults_path, "r", encoding="utf-8") as f:
                defaults = json.load(f)

        html = self.assemble(spec, lle, defaults)

        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(html)

        size_kb = output_path.stat().st_size / 1024
        logger.info(f"Assembled {output_path.name} ({size_kb:.0f} KB)")

        return output_path
