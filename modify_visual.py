import re

with open('Aasha-Learning-Impact-Ecosystem-v0.3-full-repo/packages/visual-engine/src/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

anim_code = """  // Initial animation
  let currentAnimatedCols = 0;
  const animInterval = setInterval(() => {
    if(currentAnimatedCols >= currentCols) {
      clearInterval(animInterval);
      return;
    }
    currentAnimatedCols++;
    cells.forEach(c => {
      const r = Number(c.dataset.row);
      const col = Number(c.dataset.col);
      const isFilled = r < currentRows && col < currentAnimatedCols;
      c.setAttribute('fill', isFilled ? '#3b82f6' : '#f8fafc');
      c.setAttribute('stroke', isFilled ? '#1d4ed8' : '#cbd5e1');
      c.setAttribute('stroke-width', isFilled ? '2' : '1');
      c.setAttribute('aria-pressed', String(isFilled));
      c.classList.toggle('shaded', isFilled);
      c.classList.toggle('unshaded', !isFilled);
    });
  }, 100);
"""
content = content.replace("const updateGrid = (newR, newC) => {", anim_code + "\n  const updateGrid = (newR, newC) => {")

with open('Aasha-Learning-Impact-Ecosystem-v0.3-full-repo/packages/visual-engine/src/index.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated visual-engine successfully")
