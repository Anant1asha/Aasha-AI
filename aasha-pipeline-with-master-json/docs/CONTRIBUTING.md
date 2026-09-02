# Contributing to Aasha Pipeline

We welcome contributions! The pipeline is highly extensible. Here is how you can add new capabilities to the system.

## Adding a New Plugin

Plugins allow the pipeline to embed new interactive tools.
1. Create a new directory: `src/aasha/plugins/<plugin_name>/`
2. Create `plugin.py` and inherit from `InteractionPlugin`.
3. Implement the required interface:
   - `metadata`: Define the name, license, size, and supported domains.
   - `can_handle(request)`: Return a boolean if this plugin can satisfy the `InteractionRequest`.
   - `render_step(request)`: Return the JSON spec for the step.
   - `embed_assets()`: Return the base64 encoded `.js` and `.css` strings required to run the tool offline.
4. Register the plugin in `src/aasha/plugins/base.py` within `create_default_registry()`.

## Adding a New Agent

If you need a new stage in the pipeline (e.g., a Translation Agent):
1. Create `src/aasha/agents/<agent_name>.py`
2. Inherit from the base `Agent` class.
3. Implement `process(input_data)`:
   - Make LLM calls using the `Adapter` class.
   - Return structured data (dict/JSON).
4. Update `src/aasha/pipeline/orchestrator.py` to add your agent into the sequence and define its input/output file mapping on the File-Backed Bus.

## Adding a New Subject Profile

To optimize behavior for a new subject (e.g., "music"):
1. Open `src/aasha/config/profiles.py`.
2. Add a new dictionary entry defining:
   - `preferred_plugins`: list of plugin names to prioritize.
   - `difficulty_curve`: how quickly assessments should ramp up.
   - `system_prompt_overrides`: any specific instructions for Agent 1 and Agent 2 when dealing with this subject.
3. Test your profile by running a CLI job with `--subject music`.

Please ensure all tests pass before opening a PR!
