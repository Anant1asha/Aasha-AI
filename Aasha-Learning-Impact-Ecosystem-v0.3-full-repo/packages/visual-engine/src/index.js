export function generateVisualHtml(spec = {}){
  const type = spec.type ?? 'card';
  if (type === 'grid-area' || type === 'perimeter-grid') {
    return generateGridAreaHtml(spec);
  }
  return generateFractionBarHtml(spec);
}

function generateFractionBarHtml(spec = {}){
  const total = Number(spec.total ?? spec.denominator ?? spec.d ?? 0);
  const shaded = Number(spec.shaded ?? spec.numerator ?? spec.n ?? 0);
  const title = spec.title ?? '';
  const text = spec.text ?? '';
  const label = spec.alt ?? spec.ariaLabel ?? (total > 0 ? `${shaded} out of ${total} equal parts shaded` : (title || 'Learning visual'));

  let visualHtml = '';

  if (total > 0 && total <= 20) {
    const width = 320;
    const height = 54;
    const cellWidth = (width - 4) / total;
    let rects = '';
    for (let i = 0; i < total; i++) {
      const isShaded = i < shaded;
      const x = 2 + (i * cellWidth);
      const a11yAttrs = spec.interactive 
        ? `tabindex="0" role="button" aria-pressed="${isShaded}" aria-label="Part ${i + 1} of ${total}, ${isShaded ? 'shaded' : 'unshaded'}"`
        : '';
      rects += `<rect class="frac-cell ${isShaded ? 'shaded' : 'unshaded'}" data-index="${i}" x="${x.toFixed(1)}" y="4" width="${(cellWidth - 2).toFixed(1)}" height="46" rx="6" fill="${isShaded ? '#0284c7' : '#f1f5f9'}" stroke="#cbd5e1" stroke-width="2" ${a11yAttrs} style="transition: fill 0.2s, stroke 0.2s; cursor: ${spec.interactive ? 'pointer' : 'default'}"></rect>`;
    }
    visualHtml = `
      <div class="visual-model-wrapper" style="text-align: center; margin: 12px 0;">
        <svg class="fraction-bar-svg frac-svg-bar" viewBox="0 0 ${width} ${height}" style="width: 100%; max-width: ${width}px; height: auto; display: block; margin: 0 auto;" role="img" aria-label="${label}">
          <title>${label}</title>
          ${rects}
        </svg>
        <div class="frac-readout" style="margin-top: 8px; font-weight: 800; font-size: 1.25rem; color: #0f172a;">
          <span class="numerator">${shaded}</span> / <span class="denominator">${total}</span>
          <span style="font-size: 0.85rem; font-weight: 600; color: #64748b; margin-left: 6px;">(${Math.round((shaded / total) * 100)}% of whole)</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="aasha-visual aasha-visual-fraction-bar" role="region" aria-label="${label}">
      ${title ? `<strong class="visual-title" style="display:block; margin-bottom: 4px; font-size: 1.05rem;">${escapeHtml(title)}</strong>` : ''}
      ${visualHtml}
      ${text ? `<div class="visual-text" style="font-size: 0.95rem; line-height: 1.5; color: #334155; margin-top: 6px;">${escapeHtml(text)}</div>` : ''}
    </div>
  `.trim();
}

function generateGridAreaHtml(spec = {}){
  const rows = Number(spec.rows ?? 4);
  const cols = Number(spec.cols ?? 6);
  const fillRows = Number(spec.fillRows ?? 3);
  const fillCols = Number(spec.fillCols ?? 5);
  const unit = spec.unit ?? 'cm';
  const title = spec.title ?? '';
  const text = spec.text ?? '';

  const area = fillRows * fillCols;
  const perimeter = 2 * (fillRows + fillCols);
  const label = spec.alt ?? spec.ariaLabel ?? `${fillCols} by ${fillRows} rectangle: Area = ${area} sq ${unit}, Perimeter = ${perimeter} ${unit}`;

  const width = 320;
  const height = 180;
  const cellW = (width - 4) / cols;
  const cellH = (height - 4) / rows;

  let rects = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isShaded = r < fillRows && c < fillCols;
      const x = 2 + (c * cellW);
      const y = 2 + (r * cellH);
      const a11yAttrs = spec.interactive 
        ? `tabindex="0" role="button" aria-pressed="${isShaded}" aria-label="Square row ${r + 1}, column ${c + 1}, ${isShaded ? 'enclosed' : 'empty'}"`
        : '';
      rects += `<rect class="grid-cell ${isShaded ? 'shaded' : 'unshaded'}" data-row="${r}" data-col="${c}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(cellW - 2).toFixed(1)}" height="${(cellH - 2).toFixed(1)}" rx="3" fill="${isShaded ? '#3b82f6' : '#f8fafc'}" stroke="${isShaded ? '#1d4ed8' : '#cbd5e1'}" stroke-width="${isShaded ? '2' : '1'}" ${a11yAttrs} style="transition: fill 0.2s; cursor: ${spec.interactive ? 'pointer' : 'default'}"></rect>`;
    }
  }

  const visualHtml = `
    <div class="visual-model-wrapper" style="text-align: center; margin: 12px 0;">
      <svg class="grid-area-svg" viewBox="0 0 ${width} ${height}" style="width: 100%; max-width: ${width}px; height: auto; display: block; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;" role="img" aria-label="${label}">
        <title>${label}</title>
        ${rects}
      </svg>
      <div class="grid-readout" style="margin-top: 10px; display: flex; justify-content: center; gap: 20px; font-weight: 700; font-size: 1.05rem;">
        <div style="background: #eff6ff; padding: 6px 12px; border-radius: 8px; border: 1px solid #bfdbfe; color: #1e40af;">
          Length: <span class="readout-cols">${fillCols}</span> ${unit} · Width: <span class="readout-rows">${fillRows}</span> ${unit}
        </div>
        <div style="background: #ecfdf5; padding: 6px 12px; border-radius: 8px; border: 1px solid #a7f3d0; color: #065f46;">
          Area: <span class="readout-area">${area}</span> ${unit}²
        </div>
        <div style="background: #fefce8; padding: 6px 12px; border-radius: 8px; border: 1px solid #fef08a; color: #854d0e;">
          Perimeter: <span class="readout-peri">${perimeter}</span> ${unit}
        </div>
      </div>
    </div>
  `;

  return `
    <div class="aasha-visual aasha-visual-grid-area" role="region" aria-label="${label}">
      ${title ? `<strong class="visual-title" style="display:block; margin-bottom: 4px; font-size: 1.05rem;">${escapeHtml(title)}</strong>` : ''}
      ${visualHtml}
      ${text ? `<div class="visual-text" style="font-size: 0.95rem; line-height: 1.5; color: #334155; margin-top: 6px;">${escapeHtml(text)}</div>` : ''}
    </div>
  `.trim();
}

export function renderVisual(target, spec = {}){
  if(!target) throw new Error('target required');
  if (typeof target.replaceChildren === 'function') {
    target.replaceChildren();
  }

  const html = generateVisualHtml(spec);
  
  if (typeof document !== 'undefined') {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const container = temp.firstElementChild;

    const type = spec.type ?? 'card';
    if (type === 'grid-area' || type === 'perimeter-grid') {
      setupGridInteraction(container, spec);
    } else {
      setupFractionInteraction(container, spec);
    }

    target.appendChild(container);
    return container;
  } else {
    return html;
  }
}

function setupFractionInteraction(container, spec){
  const total = Number(spec.total ?? spec.denominator ?? spec.d ?? 0);
  const shaded = Number(spec.shaded ?? spec.numerator ?? spec.n ?? 0);

  if (spec.interactive && total > 0) {
    let currentShaded = shaded;
    const cells = container.querySelectorAll('.frac-cell');
    
    const toggleCell = (idx) => {
      currentShaded = (idx + 1 === currentShaded) ? idx : (idx + 1);
      cells.forEach((c, i) => {
        const isFilled = i < currentShaded;
        c.setAttribute('fill', isFilled ? '#0284c7' : '#f1f5f9');
        c.setAttribute('aria-pressed', String(isFilled));
        c.setAttribute('aria-label', `Part ${i + 1} of ${total}, ${isFilled ? 'shaded' : 'unshaded'}`);
        c.classList.toggle('shaded', isFilled);
        c.classList.toggle('unshaded', !isFilled);
      });
      const numEl = container.querySelector('.numerator');
      if (numEl) numEl.textContent = currentShaded;
      if (typeof spec.onUpdate === 'function') {
        spec.onUpdate({ shaded: currentShaded, total });
      }
    };

    cells.forEach(cell => {
      const idx = Number(cell.dataset.index);
      cell.onclick = () => toggleCell(idx);
      cell.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleCell(idx);
        }
      };
    });
  }
}

function setupGridInteraction(container, spec){
  if (!spec.interactive) return;

  const rows = Number(spec.rows ?? 4);
  const cols = Number(spec.cols ?? 6);
  let currentRows = Number(spec.fillRows ?? 3);
  let currentCols = Number(spec.fillCols ?? 5);
  const unit = spec.unit ?? 'cm';

  const cells = container.querySelectorAll('.grid-cell');

  const updateGrid = (newR, newC) => {
    currentRows = newR;
    currentCols = newC;
    const newArea = currentRows * currentCols;
    const newPeri = 2 * (currentRows + currentCols);

    cells.forEach(c => {
      const r = Number(c.dataset.row);
      const col = Number(c.dataset.col);
      const isFilled = r < currentRows && col < currentCols;
      c.setAttribute('fill', isFilled ? '#3b82f6' : '#f8fafc');
      c.setAttribute('stroke', isFilled ? '#1d4ed8' : '#cbd5e1');
      c.setAttribute('stroke-width', isFilled ? '2' : '1');
      c.setAttribute('aria-pressed', String(isFilled));
      c.classList.toggle('shaded', isFilled);
      c.classList.toggle('unshaded', !isFilled);
    });

    const rowsEl = container.querySelector('.readout-rows');
    const colsEl = container.querySelector('.readout-cols');
    const areaEl = container.querySelector('.readout-area');
    const periEl = container.querySelector('.readout-peri');

    if (rowsEl) rowsEl.textContent = currentRows;
    if (colsEl) colsEl.textContent = currentCols;
    if (areaEl) areaEl.textContent = newArea;
    if (periEl) periEl.textContent = newPeri;

    if (typeof spec.onUpdate === 'function') {
      spec.onUpdate({ rows: currentRows, cols: currentCols, area: newArea, perimeter: newPeri });
    }
  };

  cells.forEach(cell => {
    const r = Number(cell.dataset.row);
    const c = Number(cell.dataset.col);
    const trigger = () => updateGrid(r + 1, c + 1);

    cell.onclick = trigger;
    cell.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        trigger();
      }
    };
  });
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
