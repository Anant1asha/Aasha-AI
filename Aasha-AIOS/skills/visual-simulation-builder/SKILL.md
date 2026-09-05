---
name: aasha-visual-simulation-builder
description: Designs interactive visual learning components (SVG, Canvas, JSXGraph) implementing the Aasha Visual Contract. Activate when creating visual models, geometric grids, or manipulatives.
version: 1.0.0
layer: layer-2-education
license: Apache-2.0
compatibility:
  runtimes: [antigravity, claude-code, freebuff, python-cli]
tools_required:
  - view_file
  - write_to_file
---

# Aasha Visual Simulation Builder Skill

## 1. Technical Contract
Every visual component must adhere to the lifecycle methods:
- mount(container, config)
- getState()
- reset()
- destroy()

## 2. Touch & Accessibility Rules
- Minimum tap target: 44x44px.
- Zero HTML5 drag-and-drop (strictly tap-to-select or touch sliders).
- Always provide an accessible fallback / skip button.
