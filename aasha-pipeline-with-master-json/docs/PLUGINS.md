# Plugin System — 12 Open-Source Interaction Tools

The Aasha pipeline uses a **plugin architecture** to embed open-source interactive
learning tools into generated chapters. Each plugin wraps an external simulation,
visualization, or exercise tool and provides a uniform interface.

## Available Plugins

| Plugin | License | Size | Subjects | Grades | Use Case |
|--------|---------|------|----------|--------|----------|
| **JSXGraph** | MIT | ~200KB | Math | 6-12 | Geometry, graphing, function plotting |
| **PhET** | GPL v3 | ~50KB* | Science, Math | 6-12 | Physics, chemistry, biology simulations |
| **GeoGebra** | Non-commercial | ~800KB | Math | 6-12 | Geometry, algebra, 3D |
| **Mermaid.js** | MIT | ~150KB | All | 3-12 | Diagrams, flowcharts, timelines |
| **Fabric.js** | MIT | ~300KB | Science, EVS | 3-10 | Anatomy labeling, hotspots |
| **H5P** | MIT | ~500KB | All | 1-12 | Branching scenarios, memory games |
| **Virtual Lab** | MIT | ~100KB | Science | 6-12 | Experiment simulations |
| **Scilab** | CeCILL | ~2MB | Math, Science | 9-12 | Numerical computation |
| **Mafs** | MIT | ~150KB | Math | 8-12 | Reactive math visualizations |
| **Hot Potatoes** | GNU GPL | ~50KB | All | 1-12 | JQuiz, JMatch, JCloze |
| **Phonics** | MIT | ~30KB | English | 1-3 | Phonics cards, word builders |
| **Timeline** | MIT | ~40KB | Social Studies | 3-12 | Interactive timelines |

*Sizes are approximate. Base64 embedding adds ~33% overhead.*

## Real Library Base64 Embedding Technique

To ensure the final generated chapters remain 100% offline and single-file, we utilize a **Base64 embedding technique** for plugin dependencies.

### How it works:
1. **Download & Minify**: The pipeline downloads the minified `.js` and `.css` assets of the required plugins.
2. **Base64 Encode**: The binary/text assets are encoded into base64 strings.
3. **Data URI Injection**: These base64 strings are injected directly into `<script>` and `<style>` tags or loaded dynamically via Data URIs (`data:text/javascript;base64,...`) within the generated HTML file.
4. **Execution**: When the user opens the HTML file, the browser parses and executes the base64-encoded libraries natively without needing an external network request.

### The 20MB Limit
Because everything is stuffed into a single HTML file, there is a hard upper limit on the file size. 
- Mobile browsers (specifically WebView in Android and WebKit on low-end iOS devices) begin to struggle parsing massive inline DOM structures.
- Therefore, we enforce a **strict 20MB total file size limit** for any single chapter. 
- If a chapter exceeds this limit (usually due to embedding heavy plugins like Scilab or multiple high-res base64 images), the pipeline will throw a size validation error during the QA phase. Plugins are selected based on the optimal balance between capability and their base64 embedded weight.

## How It Works

### 1. Plugin Registration
All plugins are auto-registered at startup via `create_default_registry()`.

### 2. Plugin Routing
The Experience Designer (Agent 2) queries the registry via an `InteractionRequest`. The registry tries each plugin's `can_handle()` method and selects the one with the smallest embed size that can handle the request.

### 3. Asset Embedding
Each plugin provides `embed_assets()` which returns the necessary base64 encoded libraries. The Frontend Code Synthesizer (Agent 4) embeds them.
