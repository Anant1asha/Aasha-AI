# Plugin System — 12 Open-Source Interaction Tools

The Aasha pipeline uses a **plugin architecture** to embed open-source interactive
learning tools into generated chapters. Each plugin wraps an external simulation,
visualization, or exercise tool and provides a uniform interface.

## Available Plugins

| Plugin | License | Size | Subjects | Grades | Use Case |
|--------|---------|------|----------|--------|----------|
| **JSXGraph** | MIT | ~200KB | Math | 6-12 | Geometry, graphing, function plotting, coordinate systems |
| **PhET** | GPL v3 | ~50KB* | Science, Math | 6-12 | Physics, chemistry, biology, math simulations |
| **GeoGebra** | Non-commercial | ~800KB | Math | 6-12 | Geometry, algebra, 3D, calculus applets |
| **Mermaid.js** | MIT | ~150KB | All | 3-12 | Diagrams, flowcharts, timelines, mind maps |
| **Fabric.js** | MIT | ~300KB | Science, EVS | 3-10 | Anatomy labeling, image hotspots, tap-to-place |
| **H5P** | MIT | ~500KB | All | 1-12 | Interactive content (branching scenarios, memory games) |
| **Virtual Lab** | MIT | ~100KB | Science | 6-12 | Physics, chemistry, biology experiment simulations |
| **Scilab** | CeCILL | ~2MB | Math, Science | 9-12 | Numerical computation, ODE solving, signal processing |
| **Mafs** | MIT | ~150KB | Math | 8-12 | Reactive math visualizations, coordinate geometry |
| **Hot Potatoes** | GNU GPL | ~50KB | All | 1-12 | JQuiz, JMatch, JCloze, JCross, JMix exercise types |
| **Phonics** | MIT | ~30KB | English | 1-3 | Phonics cards, word builders, picture matching |
| **Timeline** | MIT | ~40KB | Social Studies | 3-12 | Interactive timelines, branching cause-and-effect |

*PhET size varies per simulation; base64 embedding adds ~33% overhead.

*All sizes are approximate for the minified JS bundle when embedded as base64.*

## How It Works

### 1. Plugin Registration

All 12 plugins are auto-registered at startup via `create_default_registry()`:

```python
from aasha.plugins import create_default_registry

registry = create_default_registry()
# 12 plugins + 1 fallback (v5 canvas) registered
```

### 2. Plugin Routing

When the Experience Designer (Agent 2) encounters a concept, it creates an
`InteractionRequest` and queries the registry:

```python
from aasha.plugins import InteractionRequest

req = InteractionRequest(
    concept="geometry",
    subject="math",
    grade=8,
    interaction_type="geometry",
)

best_plugin = registry.find_best(req)
step_spec = best_plugin.render_step(req)
# step_spec = {"t": "jsxgraph", "concept": "geometry", "preset": "geometry", ...}
```

The registry tries each plugin's `can_handle()` method, collects all matches,
and returns the one with the smallest embed size (lighter = better for mobile).

### 3. Asset Embedding

Each plugin provides `embed_assets()` which returns CSS and JS to be injected
into the HTML output. The Frontend Code Synthesizer (Agent 4) collects these
from all plugins used in the chapter and embeds them in the final HTML.

### 4. Subject-Specific Routing

The `profiles` module declares which interaction types and plugins each subject
prefers:

| Subject Domain | Preferred Plugins |
|---------------|-------------------|
| STEM (math, science) | JSXGraph, PhET, Scilab, Mafs, GeoGebra, Virtual Lab |
| Humanities (social studies, history) | Timeline, Mermaid, H5P |
| Languages (English, K-3) | Phonics, Hot Potatoes |
| Social Sciences (EVS) | Fabric, Mermaid, Hot Potatoes |

## Adding a New Plugin

1. Create a new directory under `src/aasha/plugins/<name>/`
2. Write `plugin.py` with a class inheriting from `InteractionPlugin`
3. Implement: `metadata`, `can_handle()`, `render_step()`, `embed_assets()`
4. Add the plugin to `plugin_specs` in `base.py`'s `create_default_registry()`

## Offline Embedding

All plugins are designed for offline use. In production:
- Download the library's minified JS bundle
- Base64-encode it
- Embed as a `<script>` tag in the HTML

The current implementation provides placeholder renderers. To activate full
functionality, replace the placeholder JS in `embed_assets()` with the
base64-encoded library bundle.
