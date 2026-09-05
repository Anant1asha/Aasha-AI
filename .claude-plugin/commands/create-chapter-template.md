# Command: /create-chapter-template

## Description
Scaffolds a clean, self-contained Class 1–10 HTML chapter template with embedded LLE JavaScript boilerplate (`rt`, `applyLLE`, `showWord`).

## Template Outline
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aasha Offline Chapter Template</title>
  <style>
    /* Embedded Self-Contained Styles */
    body { font-family: system-ui, sans-serif; line-height: 1.6; margin: 0; padding: 1rem; }
    .lle-word { border-bottom: 2px dashed #0284c7; cursor: pointer; color: #0369a1; }
  </style>
</head>
<body>
  <div id="chapter-content">
    <h1>Chapter Title / पाठ का शीर्षक</h1>
    <p>Sample bilingual content with LLE support.</p>
  </div>
  <script>
    // Embedded LLE Engine Hooks
    function applyLLE() { /* LLE initialization */ }
    function showWord(word) { /* Show bilingual popup */ }
  </script>
</body>
</html>
```
