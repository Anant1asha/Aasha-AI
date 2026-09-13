/**
 * Annanth Aasha Foundation - Universal Experience Contract & Adapters
 * Version: 2.1.0
 * Architecture: Layer 3 Experience Adapters (Translating Foundations to Aasha OS)
 *
 * Implements standard non-destructive lifecycle:
 * - mount(container, config)
 * - getState()
 * - pause()   -> Halts rAF and timers to conserve CPU/battery without dropping state (>=4GB RAM invariant)
 * - resume()  -> Resumes animation loops and active listeners
 * - reset()   -> Returns component to initial baseline
 * - destroy() -> Cleans up listeners, observers, and DOM bindings
 * - emitTelemetry(eventType, payload)
 */

class AashaExperienceContract {
  mount(container, config) { throw new Error('mount() must be implemented'); }
  getState() { throw new Error('getState() must be implemented'); }
  pause() { /* Optional override, non-destructive pause */ }
  resume() { /* Optional override, non-destructive resume */ }
  reset() { throw new Error('reset() must be implemented'); }
  destroy() { throw new Error('destroy() must be implemented'); }

  emitTelemetry(eventType, payload) {
    const event = new CustomEvent('aasha:telemetry', {
      bubbles: true,
      composed: true,
      detail: {
        timestamp: Date.now(),
        foundationId: this.foundationId || 'AASHA_CUSTOM',
        experienceId: this.experienceId || 'generic',
        eventType,
        payload
      }
    });
    if (this.container && typeof this.container.dispatchEvent === 'function') {
      this.container.dispatchEvent(event);
    }
  }

  emitStateChange(newState) {
    const event = new CustomEvent('aasha:state_change', {
      bubbles: true,
      composed: true,
      detail: {
        timestamp: Date.now(),
        foundationId: this.foundationId || 'AASHA_CUSTOM',
        experienceId: this.experienceId || 'generic',
        state: newState
      }
    });
    if (this.container && typeof this.container.dispatchEvent === 'function') {
      this.container.dispatchEvent(event);
    }
  }
}

class AashaExperienceAdapter extends AashaExperienceContract {
  constructor(metadata = {}) {
    super();
    this.foundationId = metadata.foundationId || 'F00';
    this.foundationName = metadata.foundationName || 'Unknown';
    this.sourceRepo = metadata.sourceRepo || '';
    this.experienceId = metadata.experienceId || 'adapter';
    this.container = null;
    this.config = {};
    this.state = {};
    this.isPaused = false;
  }

  mount(container, config = {}) {
    this.container = container;
    this.config = config;
    this.state = { ...(config.initialState || {}) };
    this.isPaused = false;
  }

  getState() {
    return { ...this.state };
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  reset() {
    this.state = { ...(this.config.initialState || {}) };
  }

  destroy() {
    this.pause();
    this.container = null;
  }
}

/**
 * Universal <aasha-sim> Web Component
 * Enforces hardware viewport boundaries, automatic non-destructive pause/resume
 * via IntersectionObserver, and telemetry event bubbling.
 */
class AashaSimElement extends (typeof HTMLElement !== 'undefined' ? HTMLElement : Object) {
  constructor() {
    super();
    this._adapter = null;
    this._observer = null;
  }

  static get observedAttributes() {
    return ['foundation', 'experience-id', 'auto-pause'];
  }

  connectedCallback() {
    this.style.display = 'block';
    this.style.width = '100%';
    this.style.minHeight = '120px';
    this.style.position = 'relative';

    // Auto-pause when outside viewport (>=4GB RAM balanced lifecycle invariant)
    if (typeof IntersectionObserver !== 'undefined') {
      this._observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!this._adapter) return;
          if (entry.isIntersecting) {
            if (typeof this._adapter.resume === 'function') this._adapter.resume();
          } else {
            if (typeof this._adapter.pause === 'function') this._adapter.pause();
          }
        });
      }, { threshold: 0.1 });
      this._observer.observe(this);
    }
  }

  disconnectedCallback() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
    if (this._adapter && typeof this._adapter.destroy === 'function') {
      this._adapter.destroy();
      this._adapter = null;
    }
  }

  bindAdapter(adapter, config = {}) {
    if (this._adapter && typeof this._adapter.destroy === 'function') {
      this._adapter.destroy();
    }
    this._adapter = adapter;
    if (this._adapter && typeof this._adapter.mount === 'function') {
      this._adapter.mount(this, config);
    }
  }

  get adapter() {
    return this._adapter;
  }
}

// Register custom element if running in a browser environment
if (typeof customElements !== 'undefined' && !customElements.get('aasha-sim')) {
  customElements.define('aasha-sim', AashaSimElement);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AashaExperienceContract,
    AashaExperienceAdapter,
    AashaSimElement
  };
}
