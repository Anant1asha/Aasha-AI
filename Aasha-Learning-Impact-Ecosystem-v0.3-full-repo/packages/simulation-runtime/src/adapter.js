import { AashaExperienceAdapter } from './index.js';

export class SimulationAdapter extends AashaExperienceAdapter {
  constructor(manifest = {}) {
    super(manifest);
    this.manifest = manifest;
  }
  mount(target, params = {}) {
    if (!target) throw new Error('target required');
    this.container = target;
    target.textContent = `Simulation: ${this.manifest.title || 'Interactive Asset'}`;
    return { id: this.manifest.id, params };
  }
  getState() {
    return { id: this.manifest.id, ...this.state };
  }
  reset() {
    this.state = {};
  }
  destroy() {
    if (this.container) {
      this.container.textContent = '';
      this.container = null;
    }
  }
}
