/**
 * Aasha Universal Visual / Simulation Contract
 * Version: 1.0.0
 * 
 * Every interactive visual learning component (SVG, Canvas, JSXGraph, PhET)
 * must implement this lifecycle interface.
 */

class VisualComponent {
  /**
   * Mounts the visual component inside the target DOM element.
   * @param {HTMLElement} container - Target container (320px - 480px width)
   * @param {Object} config - JSON configuration for the visual
   */
  mount(container, config) {
    throw new Error('mount() must be implemented');
  }

  /**
   * Returns current serializable state for telemetry and state restoration.
   * @returns {Object}
   */
  getState() {
    throw new Error('getState() must be implemented');
  }

  /**
   * Resets visual component to initial configuration.
   */
  reset() {
    throw new Error('reset() must be implemented');
  }

  /**
   * Destroys event listeners, canvas contexts, and timers.
   */
  destroy() {
    throw new Error('destroy() must be implemented');
  }
}

/**
 * Reference Implementation: Native SVG Fraction Bar Visual
 */
class FractionBarVisual extends VisualComponent {
  mount(container, config) {
    this.container = container;
    this.total = config.total || 4;
    this.selected = config.selected || 0;
    this.onInteraction = config.onInteraction || null;

    this.container.innerHTML = '';
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('viewBox', '0 0 320 60');
    this.svg.setAttribute('style', 'width:100%;height:auto;border-radius:8px;');

    const cellWidth = 320 / this.total;
    this.cells = [];

    for (let i = 0; i < this.total; i++) {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', i * cellWidth + 2);
      rect.setAttribute('y', 5);
      rect.setAttribute('width', cellWidth - 4);
      rect.setAttribute('height', 50);
      rect.setAttribute('rx', 6);
      rect.setAttribute('fill', i < this.selected ? '#22c55e' : '#f1f5f9');
      rect.setAttribute('stroke', '#cbd5e1');
      rect.setAttribute('stroke-width', '2');
      rect.setAttribute('cursor', 'pointer');
      rect.setAttribute('role', 'button');
      rect.setAttribute('tabindex', '0');

      rect.addEventListener('click', () => this._toggleCell(i));
      this.svg.appendChild(rect);
      this.cells.push(rect);
    }
    this.container.appendChild(this.svg);
  }

  _toggleCell(index) {
    this.selected = index + 1;
    this.cells.forEach((c, idx) => {
      c.setAttribute('fill', idx < this.selected ? '#22c55e' : '#f1f5f9');
    });
    if (this.onInteraction) {
      this.onInteraction({ type: 'select', selected: this.selected, total: this.total });
    }
  }

  getState() {
    return { selected: this.selected, total: this.total };
  }

  reset() {
    this.selected = 0;
    this.cells.forEach(c => c.setAttribute('fill', '#f1f5f9'));
  }

  destroy() {
    if (this.container) this.container.innerHTML = '';
  }
}

/**
 * Reference Implementation: Native SVG Algebra Tile / Area Distribution Visual
 * Supports representation of expressions like (x + a)(x + b) or k(ax + b)
 */
class AlgebraTileVisual extends VisualComponent {
  mount(container, config) {
    this.container = container;
    this.x = config.x || 3;
    this.a = config.a || 2;
    this.b = config.b || 3;
    this.labelA = config.labelA || 'x';
    this.labelB = config.labelB || '2';
    this.labelC = config.labelC || 'x';
    this.labelD = config.labelD || '3';
    this.onInteraction = config.onInteraction || null;

    this.container.innerHTML = '';
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('viewBox', '0 0 340 220');
    this.svg.setAttribute('style', 'width:100%;height:auto;border-radius:8px;background:#f8fafc;');

    // Title / expression banner
    const textTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textTitle.setAttribute('x', '170');
    textTitle.setAttribute('y', '22');
    textTitle.setAttribute('text-anchor', 'middle');
    textTitle.setAttribute('font-size', '13');
    textTitle.setAttribute('font-weight', '600');
    textTitle.setAttribute('fill', '#0f172a');
    textTitle.textContent = `Area Distribution: (${this.labelA} + ${this.labelB}) × (${this.labelC} + ${this.labelD})`;
    this.svg.appendChild(textTitle);

    // Tiles (x^2, bx, ax, ab)
    this.tiles = [
      { id: 'x2', x: 40, y: 40, w: 120, h: 100, fill: '#38bdf8', stroke: '#0284c7', label: `${this.labelA}²`, active: false },
      { id: 'bx', x: 165, y: 40, w: 80, h: 100, fill: '#fbbf24', stroke: '#d97706', label: `${this.labelB}${this.labelA}`, active: false },
      { id: 'ax', x: 40, y: 145, w: 120, h: 55, fill: '#fbbf24', stroke: '#d97706', label: `${this.labelD}${this.labelC}`, active: false },
      { id: 'ab', x: 165, y: 145, w: 80, h: 55, fill: '#4ade80', stroke: '#16a34a', label: `${this.b * this.a}`, active: false }
    ];

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
      rect.setAttribute('rx', '4');
      rect.setAttribute('fill', t.fill);
      rect.setAttribute('fill-opacity', '0.7');
      rect.setAttribute('stroke', t.stroke);
      rect.setAttribute('stroke-width', '2');

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', t.x + t.w / 2);
      text.setAttribute('y', t.y + t.h / 2 + 5);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '14');
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('fill', '#0f172a');
      text.textContent = t.label;

      g.appendChild(rect);
      g.appendChild(text);
      const toggle = () => this._toggleTile(t, rect);
      g.addEventListener('click', toggle);
      rect.addEventListener('click', toggle);
      this.svg.appendChild(g);
      this.tileElements.push({ tile: t, rect, g });
    });

    this.container.appendChild(this.svg);
  }

  _toggleTile(t, rect) {
    t.active = !t.active;
    rect.setAttribute('fill-opacity', t.active ? '1.0' : '0.7');
    rect.setAttribute('stroke-width', t.active ? '3' : '2');
    if (this.onInteraction) {
      this.onInteraction({
        type: 'tile_toggle',
        tileId: t.id,
        active: t.active,
        activeCount: this.tiles.filter(tile => tile.active).length
      });
    }
  }

  getState() {
    return {
      activeTiles: this.tiles.filter(t => t.active).map(t => t.id),
      totalTiles: this.tiles.length,
      expression: `(${this.labelA} + ${this.labelB})(${this.labelC} + ${this.labelD})`
    };
  }

  reset() {
    this.tileElements.forEach(({ tile, rect }) => {
      tile.active = false;
      rect.setAttribute('fill-opacity', '0.7');
      rect.setAttribute('stroke-width', '2');
    });
  }

  destroy() {
    if (this.container) this.container.innerHTML = '';
  }
}

/**
 * Reference Implementation: Native SVG Geometric Perimeter & Boundary Walk Visual
 * Supports interactive walking/highlighting of polygon boundaries and dynamic perimeter calculation
 */
class GeometricPerimeterVisual extends VisualComponent {
  mount(container, config) {
    this.container = container;
    this.shapeType = config.shapeType || 'rectangle'; // rectangle, square, triangle
    this.sides = config.sides || [
      { name: 'Top', len: 6, label: '6 cm' },
      { name: 'Right', len: 4, label: '4 cm' },
      { name: 'Bottom', len: 6, label: '6 cm' },
      { name: 'Left', len: 4, label: '4 cm' }
    ];
    this.onInteraction = config.onInteraction || null;

    this.container.innerHTML = '';
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('viewBox', '0 0 340 220');
    this.svg.setAttribute('style', 'width:100%;height:auto;border-radius:8px;background:#f8fafc;');

    // Header banner
    const banner = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    banner.setAttribute('x', '170');
    banner.setAttribute('y', '22');
    banner.setAttribute('text-anchor', 'middle');
    banner.setAttribute('font-size', '13');
    banner.setAttribute('font-weight', '600');
    banner.setAttribute('fill', '#0f172a');
    banner.textContent = `Boundary Walk: Tap sides to calculate Perimeter`;
    this.svg.appendChild(banner);

    this.activeSides = new Set();
    this.sideElements = [];

    // Coordinates for 240x120 centered rectangle
    const x0 = 50, y0 = 45, w = 240, h = 120;
    const sidePaths = [
      { id: 0, x1: x0, y1: y0, x2: x0 + w, y2: y0, lx: x0 + w / 2, ly: y0 - 8 },
      { id: 1, x1: x0 + w, y1: y0, x2: x0 + w, y2: y0 + h, lx: x0 + w + 18, ly: y0 + h / 2 },
      { id: 2, x1: x0 + w, y1: y0 + h, x2: x0, y2: y0 + h, lx: x0 + w / 2, ly: y0 + h + 18 },
      { id: 3, x1: x0, y1: y0 + h, x2: x0, y2: y0, lx: x0 - 18, ly: y0 + h / 2 }
    ];

    // Filled background shape
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', x0);
    bgRect.setAttribute('y', y0);
    bgRect.setAttribute('width', w);
    bgRect.setAttribute('height', h);
    bgRect.setAttribute('fill', '#e0e7ff');
    bgRect.setAttribute('fill-opacity', '0.4');
    this.svg.appendChild(bgRect);

    // Perimeter readout text
    this.statusText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    this.statusText.setAttribute('x', '170');
    this.statusText.setAttribute('y', y0 + h / 2 + 5);
    this.statusText.setAttribute('text-anchor', 'middle');
    this.statusText.setAttribute('font-size', '15');
    this.statusText.setAttribute('font-weight', 'bold');
    this.statusText.setAttribute('fill', '#3b82f6');
    this.statusText.textContent = 'P = 0 cm (0/4 sides walked)';
    this.svg.appendChild(this.statusText);

    // Render interactive boundary segments
    sidePaths.forEach((sp, idx) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('cursor', 'pointer');
      g.setAttribute('role', 'button');
      g.setAttribute('tabindex', '0');

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', sp.x1);
      line.setAttribute('y1', sp.y1);
      line.setAttribute('x2', sp.x2);
      line.setAttribute('y2', sp.y2);
      line.setAttribute('stroke', '#94a3b8');
      line.setAttribute('stroke-width', '5');
      line.setAttribute('stroke-linecap', 'round');

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', sp.lx);
      label.setAttribute('y', sp.ly);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '12');
      label.setAttribute('font-weight', '600');
      label.setAttribute('fill', '#475569');
      label.textContent = this.sides[idx] ? this.sides[idx].label : `${idx}`;

      g.appendChild(line);
      g.appendChild(label);

      const toggle = () => this._toggleSide(idx, line);
      g.addEventListener('click', toggle);
      line.addEventListener('click', toggle);

      this.svg.appendChild(g);
      this.sideElements.push({ idx, line, label });
    });

    this.container.appendChild(this.svg);
  }

  _toggleSide(idx, line) {
    if (this.activeSides.has(idx)) {
      this.activeSides.delete(idx);
      line.setAttribute('stroke', '#94a3b8');
      line.setAttribute('stroke-width', '5');
    } else {
      this.activeSides.add(idx);
      line.setAttribute('stroke', '#22c55e');
      line.setAttribute('stroke-width', '8');
    }

    const currentP = Array.from(this.activeSides).reduce((sum, i) => sum + (this.sides[i] ? this.sides[i].len : 0), 0);
    this.statusText.textContent = `P = ${currentP} cm (${this.activeSides.size}/${this.sides.length} sides walked)`;

    if (this.onInteraction) {
      this.onInteraction({
        type: 'side_walk',
        sideIndex: idx,
        activeSidesCount: this.activeSides.size,
        currentPerimeter: currentP
      });
    }
  }

  getState() {
    const currentP = Array.from(this.activeSides).reduce((sum, i) => sum + (this.sides[i] ? this.sides[i].len : 0), 0);
    return {
      activeSides: Array.from(this.activeSides),
      totalSides: this.sides.length,
      currentPerimeter: currentP,
      shapeType: this.shapeType
    };
  }

  reset() {
    this.activeSides.clear();
    this.sideElements.forEach(({ line }) => {
      line.setAttribute('stroke', '#94a3b8');
      line.setAttribute('stroke-width', '5');
    });
    this.statusText.textContent = `P = 0 cm (0/${this.sides.length} sides walked)`;
  }

  destroy() {
    if (this.container) this.container.innerHTML = '';
  }
}

/**
 * Reference Implementation: Native SVG Electric Circuit Visual (Science / Physics)
 * Demonstrates causality: closed circuit + intact filament + conductive test material -> current flow + bulb glowing.
 * Supports experimental parameter changes: switch state, bulb filament state, insertable materials.
 */
class ElectricCircuitVisual extends VisualComponent {
  mount(container, config) {
    this.container = container;
    this.switchClosed = config.switchClosed || false;
    this.filamentIntact = config.filamentIntact !== false;
    this.materialType = config.materialType || 'copper'; // 'copper', 'iron', 'wood', 'rubber', 'air'
    this.conductiveMaterials = new Set(['copper', 'iron', 'graphite', 'aluminum', 'key', 'pin']);
    this.onInteraction = config.onInteraction || null;

    this.container.innerHTML = '';
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('viewBox', '0 0 360 200');
    this.svg.setAttribute('style', 'width:100%;height:auto;background:#0f172a;border-radius:12px;user-select:none;');

    // Header title
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', '180');
    title.setAttribute('y', '25');
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-size', '13');
    title.setAttribute('fill', '#94a3b8');
    title.setAttribute('font-weight', '600');
    title.textContent = 'Interactive Circuit: Switch, Battery & Bulb';
    this.svg.appendChild(title);

    // Battery (Top left: x=60 to 120, y=50)
    const battGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const battBody = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    battBody.setAttribute('x', '70'); battBody.setAttribute('y', '45');
    battBody.setAttribute('width', '50'); battBody.setAttribute('height', '24');
    battBody.setAttribute('rx', '4'); battBody.setAttribute('fill', '#334155');
    battBody.setAttribute('stroke', '#64748b'); battBody.setAttribute('stroke-width', '2');

    const battCap = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    battCap.setAttribute('x', '120'); battCap.setAttribute('y', '52');
    battCap.setAttribute('width', '6'); battCap.setAttribute('height', '10');
    battCap.setAttribute('fill', '#e2e8f0');

    const battText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    battText.setAttribute('x', '95'); battText.setAttribute('y', '62');
    battText.setAttribute('text-anchor', 'middle'); battText.setAttribute('font-size', '10');
    battText.setAttribute('fill', '#38bdf8'); battText.setAttribute('font-weight', 'bold');
    battText.textContent = '+  1.5V  -';
    battGroup.appendChild(battBody); battGroup.appendChild(battCap); battGroup.appendChild(battText);
    this.svg.appendChild(battGroup);

    // Switch (Top right: x=240 to 300, y=57)
    const switchGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    switchGroup.setAttribute('cursor', 'pointer');
    switchGroup.setAttribute('role', 'button');
    switchGroup.setAttribute('aria-label', 'Toggle Switch');

    this.switchContactA = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.switchContactA.setAttribute('cx', '230'); this.switchContactA.setAttribute('cy', '57');
    this.switchContactA.setAttribute('r', '5'); this.switchContactA.setAttribute('fill', '#cbd5e1');

    this.switchContactB = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.switchContactB.setAttribute('cx', '270'); this.switchContactB.setAttribute('cy', '57');
    this.switchContactB.setAttribute('r', '5'); this.switchContactB.setAttribute('fill', '#cbd5e1');

    this.switchBlade = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    this.switchBlade.setAttribute('x1', '230'); this.switchBlade.setAttribute('y1', '57');
    this.switchBlade.setAttribute('stroke', '#38bdf8'); this.switchBlade.setAttribute('stroke-width', '4');
    this.switchBlade.setAttribute('stroke-linecap', 'round');

    const switchLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    switchLabel.setAttribute('x', '250'); switchLabel.setAttribute('y', '38');
    switchLabel.setAttribute('text-anchor', 'middle'); switchLabel.setAttribute('font-size', '11');
    switchLabel.setAttribute('fill', '#94a3b8'); switchLabel.textContent = 'Switch (Tap to toggle)';

    switchGroup.appendChild(this.switchContactA); switchGroup.appendChild(this.switchContactB);
    switchGroup.appendChild(this.switchBlade); switchGroup.appendChild(switchLabel);
    switchGroup.addEventListener('click', () => this.toggleSwitch());
    this.svg.appendChild(switchGroup);
    this.switchGroup = switchGroup;

    // Test Material Gap (Bottom: x=140 to 200, y=160)
    const matGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    matGroup.setAttribute('cursor', 'pointer');
    matGroup.setAttribute('role', 'button');
    matGroup.setAttribute('aria-label', 'Change Material');

    this.matBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    this.matBox.setAttribute('x', '135'); this.matBox.setAttribute('y', '150');
    this.matBox.setAttribute('width', '90'); this.matBox.setAttribute('height', '20');
    this.matBox.setAttribute('rx', '4');
    this.matBox.setAttribute('stroke-width', '2');

    this.matText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    this.matText.setAttribute('x', '180'); this.matText.setAttribute('y', '164');
    this.matText.setAttribute('text-anchor', 'middle'); this.matText.setAttribute('font-size', '11');
    this.matText.setAttribute('font-weight', '600');

    matGroup.appendChild(this.matBox); matGroup.appendChild(this.matText);
    matGroup.addEventListener('click', () => this.cycleMaterial());
    this.svg.appendChild(matGroup);
    this.matGroup = matGroup;

    // Light Bulb (Right side: x=300, y=105)
    const bulbGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.bulbGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.bulbGlow.setAttribute('cx', '300'); this.bulbGlow.setAttribute('cy', '105');
    this.bulbGlow.setAttribute('r', '24');
    this.bulbGlow.setAttribute('fill', 'rgba(250, 204, 21, 0.0)');

    this.bulbGlass = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.bulbGlass.setAttribute('cx', '300'); this.bulbGlass.setAttribute('cy', '105');
    this.bulbGlass.setAttribute('r', '15');
    this.bulbGlass.setAttribute('fill', '#1e293b');
    this.bulbGlass.setAttribute('stroke', '#64748b');
    this.bulbGlass.setAttribute('stroke-width', '2');

    this.filament = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.filament.setAttribute('d', 'M 295 108 Q 300 97 305 108');
    this.filament.setAttribute('fill', 'none');
    this.filament.setAttribute('stroke', '#64748b');
    this.filament.setAttribute('stroke-width', '2');

    bulbGroup.appendChild(this.bulbGlow);
    bulbGroup.appendChild(this.bulbGlass);
    bulbGroup.appendChild(this.filament);
    this.svg.appendChild(bulbGroup);

    // Conductive Wire Loops
    this.wires = [];
    const wirePaths = [
      // Wire 1: Battery left to bottom tester
      'M 70 57 L 40 57 L 40 160 L 135 160',
      // Wire 2: Tester right to bulb bottom
      'M 225 160 L 300 160 L 300 120',
      // Wire 3: Bulb top to switch right
      'M 300 90 L 300 57 L 270 57',
      // Wire 4: Switch left to battery right
      'M 230 57 L 126 57'
    ];
    wirePaths.forEach((d) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', d);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', '#64748b');
      p.setAttribute('stroke-width', '3');
      p.setAttribute('stroke-linecap', 'round');
      this.svg.appendChild(p);
      this.wires.push(p);
    });

    // Status Banner
    this.statusText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    this.statusText.setAttribute('x', '180');
    this.statusText.setAttribute('y', '192');
    this.statusText.setAttribute('text-anchor', 'middle');
    this.statusText.setAttribute('font-size', '12');
    this.statusText.setAttribute('font-weight', '600');
    this.svg.appendChild(this.statusText);

    this.container.appendChild(this.svg);
    this._updateVisualState();
  }

  isConductive() {
    return this.conductiveMaterials.has(this.materialType.toLowerCase());
  }

  isCircuitComplete() {
    return this.switchClosed && this.filamentIntact && this.isConductive();
  }

  toggleSwitch() {
    this.switchClosed = !this.switchClosed;
    this._updateVisualState();
    if (this.onInteraction) {
      this.onInteraction({
        type: 'toggle_switch',
        switchClosed: this.switchClosed,
        isCircuitComplete: this.isCircuitComplete()
      });
    }
  }

  cycleMaterial() {
    const sequence = ['copper', 'rubber', 'iron', 'wood'];
    const curIdx = sequence.indexOf(this.materialType);
    this.materialType = sequence[(curIdx + 1) % sequence.length];
    this._updateVisualState();
    if (this.onInteraction) {
      this.onInteraction({
        type: 'change_material',
        materialType: this.materialType,
        isConductive: this.isConductive(),
        isCircuitComplete: this.isCircuitComplete()
      });
    }
  }

  setFilamentIntact(intact) {
    this.filamentIntact = Boolean(intact);
    this._updateVisualState();
  }

  _updateVisualState() {
    // Switch blade position
    if (this.switchClosed) {
      this.switchBlade.setAttribute('x2', '270');
      this.switchBlade.setAttribute('y2', '57');
      this.switchBlade.setAttribute('stroke', '#22c55e');
    } else {
      this.switchBlade.setAttribute('x2', '260');
      this.switchBlade.setAttribute('y2', '42');
      this.switchBlade.setAttribute('stroke', '#94a3b8');
    }

    // Material Styling
    const conductive = this.isConductive();
    if (this.materialType === 'copper') {
      this.matBox.setAttribute('fill', '#b45309');
      this.matBox.setAttribute('stroke', '#f59e0b');
      this.matText.setAttribute('fill', '#ffffff');
      this.matText.textContent = 'Copper (Conductor)';
    } else if (this.materialType === 'iron') {
      this.matBox.setAttribute('fill', '#475569');
      this.matBox.setAttribute('stroke', '#94a3b8');
      this.matText.setAttribute('fill', '#ffffff');
      this.matText.textContent = 'Iron Nail (Conductor)';
    } else if (this.materialType === 'rubber') {
      this.matBox.setAttribute('fill', '#1e293b');
      this.matBox.setAttribute('stroke', '#ef4444');
      this.matText.setAttribute('fill', '#fca5a5');
      this.matText.textContent = 'Rubber (Insulator)';
    } else {
      this.matBox.setAttribute('fill', '#78350f');
      this.matBox.setAttribute('stroke', '#d97706');
      this.matText.setAttribute('fill', '#fef3c7');
      this.matText.textContent = 'Wood (Insulator)';
    }

    const complete = this.isCircuitComplete();
    if (complete) {
      // Bulb glows yellow
      this.bulbGlow.setAttribute('fill', 'rgba(250, 204, 21, 0.45)');
      this.bulbGlass.setAttribute('fill', '#fef08a');
      this.bulbGlass.setAttribute('stroke', '#facc15');
      this.filament.setAttribute('stroke', '#eab308');
      this.filament.setAttribute('stroke-width', '3');

      // Wire glow
      this.wires.forEach(w => {
        w.setAttribute('stroke', '#38bdf8');
        w.setAttribute('stroke-width', '4');
      });

      this.statusText.setAttribute('fill', '#4ade80');
      this.statusText.textContent = 'Circuit Closed & Complete: Current flows, bulb GLOWS!';
    } else {
      // Bulb unlit
      this.bulbGlow.setAttribute('fill', 'rgba(250, 204, 21, 0.0)');
      this.bulbGlass.setAttribute('fill', '#1e293b');
      this.bulbGlass.setAttribute('stroke', '#64748b');
      this.filament.setAttribute('stroke', this.filamentIntact ? '#64748b' : '#ef4444');
      this.filament.setAttribute('stroke-width', '2');

      this.wires.forEach(w => {
        w.setAttribute('stroke', '#475569');
        w.setAttribute('stroke-width', '3');
      });

      this.statusText.setAttribute('fill', '#f87171');
      if (!this.switchClosed) {
        this.statusText.textContent = 'Circuit OPEN: Switch is open (no path for current).';
      } else if (!conductive) {
        this.statusText.textContent = `Circuit BROKEN: ${this.materialType} is an insulator.`;
      } else if (!this.filamentIntact) {
        this.statusText.textContent = 'Circuit BROKEN: Bulb filament is fused/broken.';
      }
    }
  }

  getState() {
    return {
      switchClosed: this.switchClosed,
      materialType: this.materialType,
      isConductive: this.isConductive(),
      filamentIntact: this.filamentIntact,
      isCircuitComplete: this.isCircuitComplete()
    };
  }

  reset() {
    this.switchClosed = false;
    this.materialType = 'copper';
    this.filamentIntact = true;
    this._updateVisualState();
  }

  destroy() {
    if (this.container) this.container.innerHTML = '';
  }
}

if (typeof module !== 'undefined') {
  module.exports = { VisualComponent, FractionBarVisual, AlgebraTileVisual, GeometricPerimeterVisual, ElectricCircuitVisual };
}



