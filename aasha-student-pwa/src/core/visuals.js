/**
 * Annanth Aasha Foundation - Universal Visual Learning Engine
 * Version: 2.1.0
 * 
 * Hardware-accelerated, responsive, offline visual learning models
 * adhering to AashaExperienceContract, same-frame mobile viewport constraints,
 * touch targets >= 44x44px, and sub-16.6ms render loops.
 */

export class FractionVisual {
  constructor(config = {}) {
    this.total = Math.max(1, config.total || 4);
    this.selected = Math.min(this.total, Math.max(0, config.selected || config.active || 0));
    this.onInteraction = config.onInteraction || null;
    this.container = null;
    this.isPaused = false;
  }

  mount(container) {
    this.container = container;
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;max-width:380px;margin:0 auto;padding:8px 0;user-select:none;';

    // SVG Fraction Strip
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 320 64');
    svg.setAttribute('style', 'width:100%;height:auto;max-height:80px;border-radius:10px;background:#f8fafc;');

    const cellWidth = 320 / this.total;
    this.cellElements = [];

    for (let i = 0; i < this.total; i++) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('cursor', 'pointer');
      g.setAttribute('role', 'button');
      g.setAttribute('tabindex', '0');
      g.setAttribute('aria-label', `Part ${i + 1} of ${this.total}`);

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', i * cellWidth + 2);
      rect.setAttribute('y', 6);
      rect.setAttribute('width', cellWidth - 4);
      rect.setAttribute('height', 52);
      rect.setAttribute('rx', 8);
      rect.setAttribute('fill', i < this.selected ? '#22c55e' : '#f1f5f9');
      rect.setAttribute('stroke', i < this.selected ? '#16a34a' : '#cbd5e1');
      rect.setAttribute('stroke-width', '2');
      rect.style.transition = 'all .15s ease';

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', i * cellWidth + cellWidth / 2);
      label.setAttribute('y', 36);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '14');
      label.setAttribute('font-weight', '700');
      label.setAttribute('fill', i < this.selected ? '#ffffff' : '#64748b');
      label.textContent = `1/${this.total}`;

      g.appendChild(rect);
      g.appendChild(label);

      const toggle = () => this.selectPart(i + 1);
      g.addEventListener('click', toggle);
      svg.appendChild(g);
      this.cellElements.push({ rect, label });
    }
    wrap.appendChild(svg);

    // Readout and Controls
    const readout = document.createElement('div');
    readout.style.cssText = 'font-size:1.15rem;font-weight:800;color:#1e293b;display:flex;align-items:center;gap:12px;';
    readout.innerHTML = `<span>Fraction: <b>${this.selected} / ${this.total}</b></span>`;
    this.readoutEl = readout.querySelector('b');

    // Touch-optimized buttons (>=44x44px)
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:10px;align-items:center;';

    const decBtn = document.createElement('button');
    decBtn.textContent = '−';
    decBtn.type = 'button';
    decBtn.style.cssText = 'width:44px;height:44px;min-width:44px;min-height:44px;border-radius:10px;border:2px solid #cbd5e1;background:#ffffff;font-size:1.4rem;font-weight:800;cursor:pointer;touch-action:manipulation;color:#0f172a;';
    decBtn.onclick = () => this.selectPart(Math.max(0, this.selected - 1));

    const incBtn = document.createElement('button');
    incBtn.textContent = '+';
    incBtn.type = 'button';
    incBtn.style.cssText = 'width:44px;height:44px;min-width:44px;min-height:44px;border-radius:10px;border:2px solid #cbd5e1;background:#ffffff;font-size:1.4rem;font-weight:800;cursor:pointer;touch-action:manipulation;color:#0f172a;';
    incBtn.onclick = () => this.selectPart(Math.min(this.total, this.selected + 1));

    btnRow.appendChild(decBtn);
    btnRow.appendChild(readout);
    btnRow.appendChild(incBtn);
    wrap.appendChild(btnRow);

    this.container.appendChild(wrap);
  }

  selectPart(count) {
    this.selected = count;
    if (this.readoutEl) {
      this.readoutEl.textContent = `${this.selected} / ${this.total}`;
    }
    this.cellElements.forEach((el, idx) => {
      const on = idx < this.selected;
      el.rect.setAttribute('fill', on ? '#22c55e' : '#f1f5f9');
      el.rect.setAttribute('stroke', on ? '#16a34a' : '#cbd5e1');
      el.label.setAttribute('fill', on ? '#ffffff' : '#64748b');
    });

    const state = this.getState();
    this.dispatchTelemetry('fraction_changed', state);
    if (this.onInteraction) {
      this.onInteraction(state);
    }
  }

  getState() {
    return {
      type: 'fraction',
      selected: this.selected,
      total: this.total,
      decimal: Number((this.selected / this.total).toFixed(3))
    };
  }

  dispatchTelemetry(eventType, payload) {
    if (this.container && typeof this.container.dispatchEvent === 'function') {
      const ev = new CustomEvent('aasha:telemetry', {
        bubbles: true,
        composed: true,
        detail: {
          timestamp: Date.now(),
          foundationId: 'F04_PHET',
          eventType,
          payload
        }
      });
      this.container.dispatchEvent(ev);
    }
  }

  pause() { this.isPaused = true; }
  resume() { this.isPaused = false; }
  reset() { this.selectPart(0); }
  destroy() { if (this.container) this.container.innerHTML = ''; }
}

export class AlgebraTileVisual {
  constructor(config = {}) {
    this.labelA = config.labelA || 'x';
    this.labelB = config.labelB || '2';
    this.labelC = config.labelC || 'x';
    this.labelD = config.labelD || '3';
    this.onInteraction = config.onInteraction || null;
    this.container = null;
    this.isPaused = false;
    this.tiles = [
      { id: 'x2', x: 20, y: 35, w: 140, h: 100, fill: '#38bdf8', stroke: '#0284c7', label: `${this.labelA}²`, active: false },
      { id: 'bx', x: 170, y: 35, w: 90, h: 100, fill: '#fbbf24', stroke: '#d97706', label: `${this.labelB}${this.labelA}`, active: false },
      { id: 'ax', x: 20, y: 145, w: 140, h: 60, fill: '#fbbf24', stroke: '#d97706', label: `${this.labelD}${this.labelC}`, active: false },
      { id: 'ab', x: 170, y: 145, w: 90, h: 60, fill: '#4ade80', stroke: '#16a34a', label: '6', active: false }
    ];
  }

  mount(container) {
    this.container = container;
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;width:100%;max-width:380px;margin:0 auto;user-select:none;';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 300 220');
    svg.setAttribute('style', 'width:100%;height:auto;border-radius:12px;background:#f8fafc;');

    // Header banner
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', '150');
    title.setAttribute('y', '20');
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-size', '13');
    title.setAttribute('font-weight', '700');
    title.setAttribute('fill', '#0f172a');
    title.textContent = `Area: (${this.labelA} + ${this.labelB}) × (${this.labelC} + ${this.labelD})`;
    svg.appendChild(title);

    this.tileElements = [];
    this.tiles.forEach(t => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('cursor', 'pointer');
      g.setAttribute('role', 'button');
      g.setAttribute('tabindex', '0');

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', t.x);
      rect.setAttribute('y', t.y);
      rect.setAttribute('width', t.w);
      rect.setAttribute('height', t.h);
      rect.setAttribute('rx', '6');
      rect.setAttribute('fill', t.fill);
      rect.setAttribute('fill-opacity', t.active ? '1.0' : '0.65');
      rect.setAttribute('stroke', t.stroke);
      rect.setAttribute('stroke-width', t.active ? '3' : '2');
      rect.style.transition = 'all .15s ease';

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', t.x + t.w / 2);
      label.setAttribute('y', t.y + t.h / 2 + 5);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '15');
      label.setAttribute('font-weight', 'bold');
      label.setAttribute('fill', '#0f172a');
      label.textContent = t.label;

      g.appendChild(rect);
      g.appendChild(label);

      const toggle = () => this.toggleTile(t, rect);
      g.addEventListener('click', toggle);
      svg.appendChild(g);
      this.tileElements.push({ tile: t, rect });
    });

    wrap.appendChild(svg);
    this.container.appendChild(wrap);
  }

  toggleTile(t, rect) {
    t.active = !t.active;
    rect.setAttribute('fill-opacity', t.active ? '1.0' : '0.65');
    rect.setAttribute('stroke-width', t.active ? '3' : '2');

    const state = this.getState();
    this.dispatchTelemetry('tile_toggled', state);
    if (this.onInteraction) {
      this.onInteraction(state);
    }
  }

  getState() {
    return {
      type: 'algebra_tile',
      activeTiles: this.tiles.filter(t => t.active).map(t => t.id),
      activeCount: this.tiles.filter(t => t.active).length,
      totalTiles: this.tiles.length
    };
  }

  dispatchTelemetry(eventType, payload) {
    if (this.container && typeof this.container.dispatchEvent === 'function') {
      const ev = new CustomEvent('aasha:telemetry', {
        bubbles: true,
        composed: true,
        detail: {
          timestamp: Date.now(),
          foundationId: 'F08_PHYSICS_NOTEBOOK',
          eventType,
          payload
        }
      });
      this.container.dispatchEvent(ev);
    }
  }

  pause() { this.isPaused = true; }
  resume() { this.isPaused = false; }
  reset() {
    this.tiles.forEach(t => t.active = false);
    if (this.tileElements) {
      this.tileElements.forEach(({ rect }) => {
        rect.setAttribute('fill-opacity', '0.65');
        rect.setAttribute('stroke-width', '2');
      });
    }
  }
  destroy() { if (this.container) this.container.innerHTML = ''; }
}

export class ElectricCircuitVisual {
  constructor(config = {}) {
    this.switchClosed = config.switchClosed || false;
    this.materialType = config.materialType || 'copper';
    this.filamentIntact = config.filamentIntact !== false;
    this.conductors = new Set(['copper', 'iron', 'graphite']);
    this.onInteraction = config.onInteraction || null;
    this.container = null;
    this.isPaused = false;
  }

  mount(container) {
    this.container = container;
    this.render();
  }

  isConductive() {
    return this.conductors.has(this.materialType.toLowerCase());
  }

  isComplete() {
    return this.switchClosed && this.filamentIntact && this.isConductive();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;width:100%;max-width:380px;margin:0 auto;user-select:none;gap:8px;';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 340 180');
    svg.setAttribute('style', 'width:100%;height:auto;background:#0f172a;border-radius:12px;');

    // Switch Graphic
    const switchLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    switchLine.setAttribute('x1', '220');
    switchLine.setAttribute('y1', '50');
    switchLine.setAttribute('x2', this.switchClosed ? '260' : '250');
    switchLine.setAttribute('y2', this.switchClosed ? '50' : '35');
    switchLine.setAttribute('stroke', this.switchClosed ? '#22c55e' : '#94a3b8');
    switchLine.setAttribute('stroke-width', '4');
    switchLine.setAttribute('stroke-linecap', 'round');
    svg.appendChild(switchLine);

    // Bulb Glow
    const bulbGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bulbGlow.setAttribute('cx', '280');
    bulbGlow.setAttribute('cy', '100');
    bulbGlow.setAttribute('r', '22');
    bulbGlow.setAttribute('fill', this.isComplete() ? 'rgba(250, 204, 21, 0.5)' : 'transparent');
    svg.appendChild(bulbGlow);

    // Bulb Body
    const bulb = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bulb.setAttribute('cx', '280');
    bulb.setAttribute('cy', '100');
    bulb.setAttribute('r', '14');
    bulb.setAttribute('fill', this.isComplete() ? '#fef08a' : '#1e293b');
    bulb.setAttribute('stroke', this.isComplete() ? '#facc15' : '#64748b');
    bulb.setAttribute('stroke-width', '2');
    svg.appendChild(bulb);

    wrap.appendChild(svg);

    // Controls Row (>=44x44px buttons)
    const ctrlRow = document.createElement('div');
    ctrlRow.style.cssText = 'display:flex;gap:10px;width:100%;justify-content:center;';

    const switchBtn = document.createElement('button');
    switchBtn.type = 'button';
    switchBtn.textContent = this.switchClosed ? 'Switch: CLOSED' : 'Switch: OPEN';
    switchBtn.style.cssText = `min-height:44px;min-width:44px;padding:8px 14px;border-radius:10px;border:2px solid ${this.switchClosed ? '#22c55e' : '#cbd5e1'};background:${this.switchClosed ? '#dcfce7' : '#ffffff'};font-weight:700;cursor:pointer;`;
    switchBtn.onclick = () => {
      this.switchClosed = !this.switchClosed;
      this.render();
      this.dispatchState();
    };

    const matBtn = document.createElement('button');
    matBtn.type = 'button';
    matBtn.textContent = `Material: ${this.materialType}`;
    matBtn.style.cssText = 'min-height:44px;min-width:44px;padding:8px 14px;border-radius:10px;border:2px solid #cbd5e1;background:#ffffff;font-weight:700;cursor:pointer;';
    matBtn.onclick = () => {
      const mats = ['copper', 'rubber', 'iron', 'wood'];
      const idx = (mats.indexOf(this.materialType) + 1) % mats.length;
      this.materialType = mats[idx];
      this.render();
      this.dispatchState();
    };

    ctrlRow.appendChild(switchBtn);
    ctrlRow.appendChild(matBtn);
    wrap.appendChild(ctrlRow);

    this.container.appendChild(wrap);
  }

  dispatchState() {
    const state = this.getState();
    if (this.container && typeof this.container.dispatchEvent === 'function') {
      this.container.dispatchEvent(new CustomEvent('aasha:telemetry', {
        bubbles: true,
        composed: true,
        detail: {
          timestamp: Date.now(),
          foundationId: 'F03_ALL_SCIENCE',
          eventType: 'circuit_state_change',
          payload: state
        }
      }));
    }
    if (this.onInteraction) this.onInteraction(state);
  }

  getState() {
    return {
      type: 'circuit',
      switchClosed: this.switchClosed,
      material: this.materialType,
      conductive: this.isConductive(),
      complete: this.isComplete()
    };
  }

  pause() { this.isPaused = true; }
  resume() { this.isPaused = false; }
  reset() {
    this.switchClosed = false;
    this.materialType = 'copper';
    this.render();
  }
  destroy() { if (this.container) this.container.innerHTML = ''; }
}

export function fractionVisual(total = 5, active = 3) {
  return `<div class="fraction" role="img" aria-label="${active} of ${total} equal parts selected">${Array.from({ length: total }, (_, i) => `<button class="part ${i < active ? 'on' : ''}" data-index="${i}" aria-label="Part ${i + 1}"></button>`).join('')}</div>`;
}

/**
 * Universal Visual Renderer Factory
 * Mounts interactive or returns markup representation
 */
export function renderVisual(type, data = {}, container = null, onInteraction = null) {
  if (container) {
    if (type === 'fraction') {
      const vis = new FractionVisual({ total: data.total || 5, selected: data.active || data.selected || 0, onInteraction });
      vis.mount(container);
      return vis;
    }
    if (type === 'algebra_tile') {
      const vis = new AlgebraTileVisual({ ...data, onInteraction });
      vis.mount(container);
      return vis;
    }
    if (type === 'circuit') {
      const vis = new ElectricCircuitVisual({ ...data, onInteraction });
      vis.mount(container);
      return vis;
    }
  }

  // Standalone HTML fallback
  if (type === 'fraction') return fractionVisual(data.total, data.active || data.selected);
  if (type === 'bar') {
    const pct = Math.max(0, Math.min(100, data.percent || 0));
    return `<div class="visual"><strong>${data.label || 'Interactive model'}</strong><div class="progress" style="height:12px;background:#e2e8f0;border-radius:6px;overflow:hidden;margin-top:6px;"><i style="display:block;height:100%;width:${pct}%;background:#3b82f6;border-radius:6px;transition:width .3s;"></i></div></div>`;
  }
  return `<div class="visual">${data?.label || 'Visual learning asset'}</div>`;
}
